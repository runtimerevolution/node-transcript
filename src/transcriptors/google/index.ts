import speech, { protos } from "@google-cloud/speech";

import recorder from "node-record-lpcm16";
import fs from "fs";

class Google {
  private client = new speech.v1.SpeechClient();
  private fileConfig: protos.google.cloud.speech.v1.IRecognitionConfig = {
    encoding: "FLAC",
    audioChannelCount: 2,
    languageCode: "en-US",
    useEnhanced: true,
    model: "medical_conversation",
    diarizationConfig: {
      enableSpeakerDiarization: true,
      minSpeakerCount: 2,
      maxSpeakerCount: 2,
    },
  };

  private streamConfig: protos.google.cloud.speech.v1.IRecognitionConfig = {
    encoding: "LINEAR16",
    sampleRateHertz: 16000,
    languageCode: "en-US",
    //alternativeLanguageCodes: ["pt-PT"],
    model: "latest_long",
    useEnhanced: true,
  };

  async run(path: string): Promise<string | null> {
    //const gcsUri = "gs://cloud-samples-data/speech/brooklyn_bridge.raw";

    const audio: protos.google.cloud.speech.v1.IRecognitionAudio = {
      //uri: gcsUri,
      content: fs.readFileSync(path).toString("base64"),
    };

    const request: protos.google.cloud.speech.v1.IRecognizeRequest = {
      audio: audio,
      config: this.fileConfig,
    };

    const [response] = await this.client.recognize(request);
    if (!response.results) return null;

    const result = response.results[response.results.length - 1];
    if (!result.alternatives?.length) return null;
    const wordsInfo = result.alternatives[0].words;

    return this.speakersTranscription(wordsInfo, result.languageCode)
  }

  runStream(): void {
    const sampleRateHertz = 16000;

    const request: protos.google.cloud.speech.v1.IStreamingRecognitionConfig = {
      config: this.streamConfig,
      //interimResults: true,
    };

    const recognizeStream = this.client
      .streamingRecognize(request)
      .on("error", console.error)
      .on(
        "data",
        (stream: protos.google.cloud.speech.v1.IStreamingRecognizeResponse) => {
          const stdoutText =
            stream.results && stream.results[0].alternatives
              ? stream.results[0].alternatives[0].transcript
              : "";

          console.log("> ",stdoutText);
        }
      );

    //https://www.npmjs.com/package/node-record-lpcm16#options
    recorder
      .record({
        sampleRateHertz: sampleRateHertz,
        threshold: 0,
        verbose: false,
        recordProgram: "sox", //"arecord", "sox"
        silence: "10.0",
      })
      .stream()
      .on("error", console.error)
      .pipe(recognizeStream);
  }

  private speakersTranscription(
    words: protos.google.cloud.speech.v1.IWordInfo[] | null | undefined,
    language: string | null | undefined
  ) {
    if (!words) return null;

    const transcript: string[] = [];
    let phrase = 0;

    for (let idx = 0; idx < words.length; idx++) {
      const { speakerTag, word } = words[idx];

      if (words[idx - 1]?.speakerTag !== speakerTag) {
        phrase++;
        transcript[
          phrase
        ] = `\n[Speaker ${speakerTag?.toString()}][${language}]: `;
      }

      transcript[phrase] = transcript[phrase].concat(`${word} `);
    }

    return transcript.join("");
  }
}

export default Google;
