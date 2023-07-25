import { path as ffmpegPath } from "@ffmpeg-installer/ffmpeg";
import ffmpeg from "fluent-ffmpeg";

ffmpeg.setFfmpegPath(ffmpegPath);

enum ValidFormats {
  flac,
}

function toPath(
  path: string,
  format: keyof typeof ValidFormats
): string | null {
  const extension = path.match(/^.*\.([a-z1-9]+)/);
  if (!extension) return null;

  return path.replace(extension[1], format);
}

function convert(
  inputPath: string,
  callback: (outputPath: string) => void,
  error: (e: any) => void
): void {
  const format = "flac";

  const outputPath = toPath(inputPath, format);
  if (!outputPath) {
    error("Invalid path");
    return;
  }

  ffmpeg(inputPath)
    .toFormat(format)
    .output(outputPath)
    .on("end", () => callback(outputPath))
    .on("error", (e) => error(e))
    .run();
}

export default convert;
