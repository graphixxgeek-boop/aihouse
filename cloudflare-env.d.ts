declare namespace Cloudflare {
  interface Env {
    GEMINI_API_KEY?: string;
  GEMINI_MODEL?: string;
  GEMINI_FALLBACK_MODELS?: string;
  GEMINI_API_KEY_FALLBACKS?: string;
  GROQ_API_KEY?: string;
    GROQ_MODEL?: string;
    DB?: D1Database;
    BUCKET?: R2Bucket;
  }
}
