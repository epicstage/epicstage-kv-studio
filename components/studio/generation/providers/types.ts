import type { ImageData } from "../../types";

export type ProviderId = "gemini" | "openai";

export type ImageSize = "512" | "1K" | "2K" | "4K";

/**
 * Normalized image-generation request. Providers translate this into their
 * native payload. `ratio` is the logical aspect (e.g. "16:9"); providers
 * resolve it to a pixel size using `size` as the quality/resolution bucket.
 */
export interface GenerateRequest {
  prompt: string;
  system?: string;
  ratio: string;
  size?: ImageSize;
  temperature?: number;
  seed?: number;
  /**
   * Reference images. For Gemini these become inline `parts`; for OpenAI
   * they become multipart `image[]` uploads on /v1/images/edits.
   * The caller decides order — first entry is treated as the primary
   * reference by both providers.
   */
  refs?: ImageData[];
  /** OpenAI only — quality tier. Gemini ignores this. Default: "high". */
  quality?: "low" | "medium" | "high" | "auto";
}

export interface ImageProvider {
  id: ProviderId;
  /** Returns a data URL (data:image/png;base64,...). */
  generate(req: GenerateRequest): Promise<string>;
}
