import { openaiProvider } from "./openai";
import type { ImageProvider, ProviderId } from "./types";

// Gemini is intentionally NOT routed through this registry yet — existing
// Gemini call sites keep their hand-rolled payloads to minimize blast
// radius during the GPT Image 2 rollout. Each call site dispatches on
// `version.provider` and only diverts to `providers["openai"]` when the
// version was created with OpenAI selected.
const PROVIDERS: Partial<Record<ProviderId, ImageProvider>> = {
  openai: openaiProvider,
};

export function getProvider(id: ProviderId): ImageProvider | undefined {
  return PROVIDERS[id];
}

export {
  ratioToSize,
  resolveRatio,
  OPENAI_SUPPORTED_RATIOS,
  type ResolvedRatio,
} from "./ratio-to-size";
export type { GenerateRequest, ImageProvider, ImageSize, ProviderId } from "./types";
