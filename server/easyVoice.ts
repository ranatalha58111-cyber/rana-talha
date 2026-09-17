export function hasEasyVoiceKey(): boolean {
  return Boolean(
    process.env.easyvoicekey ||
    process.env.EASYVOICEKEY ||
    process.env.EASY_VOICE_KEY ||
    process.env.EASYVOICE_API_KEY
  );
}

export function getEasyVoiceKey(): string {
  const key =
    process.env.easyvoicekey ||
    process.env.EASYVOICEKEY ||
    process.env.EASY_VOICE_KEY ||
    process.env.EASYVOICE_API_KEY;

  if (!key) {
    throw new Error("EasyVoice API key is not configured.");
  }
  return key;
}

export async function synthesizeEasyVoice(
  text: string,
  preferredVoice: string = "bm_daniel"
): Promise<Buffer> {
  const apiKey = getEasyVoiceKey();

  // Sanitize text for clean vocal pronunciation
  const cleanText = text
    .replace(/```[\s\S]*?```/g, "Code block omitted.")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/J\.A\.R\.V\.I\.S\./gi, "Jarvis")
    .replace(/J\.A\.R\.V\.I\.S/gi, "Jarvis")
    .replace(/JARVIS/gi, "Jarvis")
    .replace(/[*_~#]/g, "")
    .replace(/>\s+/g, "")
    .replace(/[-*]\s+/g, "")
    .replace(/\n+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  if (!cleanText) {
    throw new Error("No pronounceable text provided for synthesis.");
  }

  // Safe input length for instant generation
  const inputSlice = cleanText.slice(0, 1000);

  // List of fallback voices in case of transient node availability
  const candidateVoices = Array.from(
    new Set([preferredVoice, "bm_daniel", "am_adam", "ar_m1"])
  ).filter(Boolean);

  let lastError: any = null;

  for (const voiceId of candidateVoices) {
    try {
      const response = await fetch("https://easyvoice.ae/api/v1/audio/speech", {
        method: "POST",
        signal: AbortSignal.timeout(2200),
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "kokoro-82m",
          input: inputSlice,
          voice: voiceId,
        }),
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        return Buffer.from(arrayBuffer);
      }

      const errBody = await response.text();
      lastError = new Error(`EasyVoice API error (${response.status}, voice: ${voiceId}): ${errBody}`);

      // If it's a quota or auth error, don't keep trying other voices
      if (response.status === 401 || response.status === 429) {
        throw lastError;
      }
    } catch (err: any) {
      lastError = err;
      if (err?.message?.includes("401") || err?.message?.includes("429")) {
        throw err;
      }
    }
  }

  throw lastError || new Error("EasyVoice audio synthesis failed across candidate voices.");
}
