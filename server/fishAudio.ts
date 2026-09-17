export async function synthesizeFishAudio(
  text: string,
  referenceId?: string
): Promise<Buffer> {
  const fishKey = process.env.FISHAUDIO_API_KEY || process.env.FISH_AUDIO_API_KEY;
  if (!fishKey) {
    throw new Error("Fish Audio API key is not configured.");
  }

  // Clean markdown syntax before passing text to audio synthesis
  const cleanText = text
    .replace(/```[\s\S]*?```/g, "Code block omitted.")
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[*_~#]/g, "")
    .replace(/>\s+/g, "")
    .replace(/[-*]\s+/g, "")
    .replace(/\n+/g, " ")
    .trim();

  if (!cleanText) {
    throw new Error("No pronounceable text provided for synthesis.");
  }

  const payload: any = {
    text: cleanText.slice(0, 1200),
    format: "mp3",
  };

  if (referenceId) {
    payload.reference_id = referenceId;
  }

  const response = await fetch("https://api.fish.audio/v1/tts", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${fishKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Fish Audio TTS API error (${response.status}): ${errorText}`);
  }

  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
