import fs from "fs";

type Transcript = {
  id: string;
  text: string;
  status: string;
  error: string;
  utterances: Array<{ speaker: string; text: string }>;
  sentiment_analysis_results: Array<{
    speaker: string;
    text: string;
    sentiment: string;
  }>;
};

const UPLOAD_URL = "https://api.assemblyai.com/v2/upload";

class AssemblyAi {
  public apiKey: string | undefined;
  public hasSentiment: boolean;

  constructor(props: { apiKey: string | undefined; hasSentiment: boolean }) {
    this.apiKey = props.apiKey;
    this.hasSentiment = props.hasSentiment;
  }

  // Function to upload a local file to the AssemblyAI API
  async upload_file(
    api_token: string | undefined,
    path: string
  ): Promise<string | null> {
    if (!api_token) {
      console.log("Invalid API token");
      return null;
    }

    console.log(`Uploading file: ${path}`);

    // Read the file data
    const data: Buffer = fs.readFileSync(path);

    try {
      // Send a POST request to the API to upload the file, passing in the headers and the file data
      const response: Response = await fetch(UPLOAD_URL, {
        method: "POST",
        body: data,
        headers: {
          "Content-Type": "application/octet-stream",
          Authorization: api_token,
        },
      });

      // If the response is successful, return the upload URL
      if (response.status === 200) {
        const responseData = await response.json();
        return responseData["upload_url"];
      } else {
        console.error(`Error: ${response.status} - ${response.statusText}`);
        return null;
      }
    } catch (error) {
      console.error(`Error: ${error}`);
      return null;
    }
  }

  // Async function that sends a request to the AssemblyAI transcription API and retrieves the transcript
  async transcribeAudio(
    api_token: string | undefined,
    audio_url: string
  ): Promise<Transcript | null> {
    if (!api_token) {
      console.log("invalid API token");
      return null;
    }
    console.log("Transcribing audio...");

    const headers = {
      authorization: api_token,
      "content-type": "application/json",
    };

    const diarizationConfig = {
      speaker_labels: true,
      speakers_expected: 2,
    };

    const config = {
      audio_url,
      language_code: "en",
      //language_detection: true,
      ...diarizationConfig,
      ...(this.hasSentiment && { sentiment_analysis: true }),
    };

    // Send a POST request to the transcription API with the audio URL in the request body
    const response: Response = await fetch(
      "https://api.assemblyai.com/v2/transcript",
      {
        method: "POST",
        headers,
        body: JSON.stringify(config),
      }
    );

    const responseData: Transcript = await response.json();
    const transcriptId: string = responseData.id;

    const pollingEndpoint: string = `https://api.assemblyai.com/v2/transcript/${transcriptId}`;

    // Poll the transcription API until the transcript is ready
    while (true) {
      // Send a GET request to the polling endpoint to retrieve the status of the transcript
      const pollingResponse: Response = await fetch(pollingEndpoint, {
        headers,
      });
      const transcriptionResult: Transcript = await pollingResponse.json();

      // If the transcription is complete, return the transcript object
      if (transcriptionResult.status === "completed") {
        const formatted: string[] = [];
        const utterances: Array<{ speaker: string; text: string; sentiment?: string }> =
          this.hasSentiment
            ? transcriptionResult.sentiment_analysis_results
            : transcriptionResult.utterances;

        if (utterances) {
          if (this.hasSentiment)
            utterances.forEach(({ speaker, text, sentiment }) =>
              formatted.push(`Speaker ${speaker} [${sentiment}]: ${text}`)
            );
          else
            utterances.forEach(({ speaker, text }) =>
              formatted.push(`Speaker ${speaker}: ${text}`)
            );

          transcriptionResult.text = formatted.join("\n");
        } else {
          console.log("NO UTTERANCES FOUND");
        }

        return transcriptionResult;
      } else if (transcriptionResult.status === "error") {
        throw new Error(`Transcription failed: ${transcriptionResult.error}`);
      }
      // If the transcription is still in progress, wait for a few seconds before polling again
      else {
        await new Promise((resolve) => setTimeout(resolve, 3000));
      }
    }
  }

  async run(path: string): Promise<string | null> {
    const uploadUrl: string | null = await this.upload_file(this.apiKey, path);

    if (!uploadUrl) {
      console.error(new Error("Upload failed. Please try again."));
      return null;
    }

    const transcript: Transcript | null = await this.transcribeAudio(
      this.apiKey,
      uploadUrl
    );

    return transcript?.text || null;
  }
}

export default AssemblyAi;
