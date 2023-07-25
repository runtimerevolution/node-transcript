import "dotenv/config";

import AssemblyAi from "./transcriptors/assemblyAi";
import Google from "./transcriptors/google";

import convert from "./utils/converter";

interface Transcriptor {
  run: (path: string) => Promise<string | null>;
}

class App {
  private assembly: AssemblyAi;
  private google: Google;
  private transcriptor: Transcriptor;

  constructor() {
    this.assembly = new AssemblyAi({
      apiKey: process.env.ASSEMBLY,
      //hasSentiment: true,
      hasSentiment: false,
    });
    this.google = new Google();

    //this.transcriptor = this.google;
    this.transcriptor = this.assembly;
  }

  /**
   * Async file transcription
   * 
   * Will return the transcript according to transcriptor set
   * On Google's case, file transcription is limited as specified on https://cloud.google.com/speech-to-text/quotas
   * To transcribe longer files, refer to using Google Cloud Buckets https://cloud.google.com/speech-to-text/docs/async-recognize#speech-async-recognize-gcs-csharp
   */
  async makeTranscript(path: string): Promise<string | null> {
    const transcript: string | null = path
      ? await this.transcriptor.run(path)
      : null;

    console.log(transcript);
    return transcript;
  }

  /**
   * Audio conversion (Google easily accepts the .flac format, while others need some extra configuration)
   */
  convertion(inputPath: string) {
    convert(
      inputPath,
      async (outputPath) => {
        const transcript = await this.makeTranscript(outputPath);
        console.log(transcript);
      },
      (e) => console.log("error " + e)
    );
  }

  /**
   * Google live streaming
   *
   * Streaming is limited to 5 minutes with this example, there is an infinite streaming option sample
   * https://github.com/GoogleCloudPlatform/nodejs-docs-samples/blob/main/speech/infiniteStreaming.js
   */
  stream() {
    this.google.runStream();
  }
}

const app = new App();

// If the transcriptor set is Google, ensure the file has a .flac format or, use app.convertion() to convert and run the transcription
// The file sample rate hertz can be different accordingly to the file you use, if so, "sampleRateHertz" should be changed on the config

app.makeTranscript("./public/uploads/joeRogan.mp3");
//app.convertion("./public/uploads/conversation.wav");
//app.stream()
