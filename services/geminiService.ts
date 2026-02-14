import { GoogleGenAI, Type, Modality } from "@google/genai";
import { Character, Story, Scene, UserProfile } from "../types";

// Initialize Gemini API Client
const apiKey = process.env.API_KEY || '';

const ai = new GoogleGenAI({ apiKey });

export const generateStoryFromPrompt = async (
  userProfile: UserProfile,
  characters: Character[],
  prompt: string
): Promise<Omit<Story, 'id' | 'createdAt' | 'userProfile'>> => {
  if (!apiKey) throw new Error("API Key is missing");

  // Format characters for the prompt
  const characterDescriptions = characters
    .map(c => `- ${c.name} (${c.relation}, ${c.gender}): ${c.traits}. ${c.description}`)
    .join('\n');

  // Explicitly add 'Me' to the context using UserProfile
  const inputContext = `
  MAIN PROTAGONIST (USER):
  - Name: ${userProfile.name}
  - Gender: ${userProfile.gender}
  - Description: ${userProfile.description}
  (Refer to this character as "${userProfile.name}" or "Me" in the story structure, but consistent name in dialogue speaker fields).

  SUPPORTING CHARACTERS:
  ${characterDescriptions}

  USER STORY IDEA:
  ${prompt}
  `;

  const model = "gemini-3-flash-preview";

  // DRACONIAN instructions to keep it short and valid JSON.
  const systemInstruction = `You are a strict JSON Data Generator API. 
  
  Task: Generate a 3-scene comic story where the main protagonist (${userProfile.name}) interacts with the supporting characters.
  
  CONSTRAINTS:
  1. Output raw JSON only. No markdown formatting.
  2. "visual_description": MAX 15 words. Describe the scene visually.
  3. "narration": MAX 10 words.
  4. "dialogue": MAX 2 items per scene. Text MAX 10 words.
  5. TOTAL SCENES: Exactly 3.
  6. Ensure ${userProfile.name} is an active participant.
  
  JSON Schema:
  {
    "title": "String",
    "synopsis": "String (Max 20 words)",
    "scenes": [
      {
        "visual_description": "String",
        "narration": "String",
        "dialogue": [{ "speaker": "String", "text": "String" }]
      }
    ]
  }`;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: { parts: [{ text: inputContext }] },
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        maxOutputTokens: 4000,
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            synopsis: { type: Type.STRING },
            scenes: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  visual_description: { type: Type.STRING },
                  narration: { type: Type.STRING },
                  dialogue: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        speaker: { type: Type.STRING },
                        text: { type: Type.STRING }
                      },
                      required: ["speaker", "text"]
                    }
                  }
                },
                required: ["visual_description", "dialogue"]
              }
            }
          },
          required: ["title", "synopsis", "scenes"]
        }
      }
    });

    let jsonText = response.text;
    if (!jsonText) throw new Error("No response from AI");

    // Defensive cleanup
    jsonText = jsonText.replace(/^```json\s*/, '').replace(/\s*```$/, '');

    let parsed;
    try {
      parsed = JSON.parse(jsonText);
    } catch (e) {
      console.error("JSON Parse Error. Raw Text:", jsonText);
      throw new Error("Received malformed JSON from AI model.");
    }

    // Validate structure
    if (!parsed || !Array.isArray(parsed.scenes)) {
      console.error("Invalid Structure:", parsed);
      throw new Error("AI response missing 'scenes' array.");
    }

    // Transform to match our internal Story type
    return {
      title: parsed.title || "Untitled Story",
      synopsis: parsed.synopsis || "A short adventure.",
      characters,
      scenes: parsed.scenes.map((s: any, index: number) => ({
        id: `scene-${Date.now()}-${index}`,
        visual_description: s.visual_description || "A generic scene.",
        narration: s.narration || "",
        dialogue: Array.isArray(s.dialogue) ? s.dialogue : []
      }))
    };

  } catch (error) {
    console.error("Error generating story:", error);
    throw error; // Re-throw to be caught by component
  }
};

export const generateSceneImage = async (visualDescription: string): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing");

  const model = "gemini-2.5-flash-image";
  const prompt = `Manga style illustration, black and white or muted colors, dramatic lighting, high quality line art. ${visualDescription}`;

  // Retry logic wrapper
  const callApi = async (attempt = 1): Promise<string> => {
    try {
      const response = await ai.models.generateContent({
        model,
        contents: {
          parts: [
            { text: prompt }
          ]
        },
        config: {
          imageConfig: {
            aspectRatio: "16:9",
          }
        }
      });

      const candidates = response.candidates;
      if (candidates && candidates.length > 0) {
        const parts = candidates[0].content.parts;
        for (const part of parts) {
          if (part.inlineData && part.inlineData.data) {
            return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
          }
        }
      }

      throw new Error("No image data found in response");
    } catch (e: any) {
      // Retry on 500 or unknown RPC errors up to 2 times
      if (attempt < 3 && (e.message?.includes('500') || e.message?.includes('Rpc failed'))) {
        console.warn(`Image generation failed (attempt ${attempt}). Retrying...`, e.message);
        await new Promise(resolve => setTimeout(resolve, 1500)); // Wait 1.5s
        return callApi(attempt + 1);
      }
      throw e;
    }
  };

  try {
    return await callApi();
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};

export const generateSpeech = async (text: string, voiceName: string = 'Zephyr'): Promise<string> => {
  const ttsUrl = import.meta.env.VITE_TTS_API_URL;
  if (!ttsUrl) throw new Error("TTS API URL is missing");

  // XTTS requires a speaker wav to clone. We need to fetch a default one or provide one.
  // The official docker run command often suggests mapping a folder with wavs.
  // However, the api/tts endpoint of coqui-ai/tts usually takes a `speaker_wav` file path local to the container OR a file upload.
  // BUT: The standard simple setup often allows just a speaker name if models support it, or we send a dummy wav.
  // LET'S ASSUME for this integration we use a standard speaker file that exists in the default image or we find a way to list them.
  // actually, the XTTS model needs a reference audio.

  // Strategy:
  // 1. Fetch available speakers to see if we can just use a name.
  // 2. If not, we might need to send a base64 sample. 

  // SIMPLIFICATION for this step: Try to use a default "speaker_wav" path that might exist, or fail gracefully.
  // Better yet: XTTS-v2 supports "speaker_idx" if using a model with multiple speakers, but usually it needs "speaker_wav".
  // Let's try to fetch the list of speakers from the server first if possible? No, let's stick to the request.

  const callApi = async (attempt = 1): Promise<string> => {
    try {
      // The XTTS API endpoint is usually /tts_to_audio/
      // payload: {"text": "...", "speaker_wav": "...", "language_id": "en"}

      // We need to provide a speaker_wav. 
      // Since we are running this in docker, we can map a folder of voices.
      // For now, let's use a generic generic female voice if we can't find one.
      // Wait, the user wants to use XTTS. 

      // OPTION 1: Use the standard /api/tts endpoint
      const response = await fetch(`${ttsUrl}/api/tts`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: text,
          speaker_wav: "examples/female.wav", // Default example in some containers, might fail.
          language_id: "en"
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`TTS Server Error: ${response.status} ${errText}`);
      }

      const blob = await response.blob();
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          if (typeof reader.result === 'string') {
            // remove "data:audio/wav;base64," prefix if we want raw base64, 
            // but the existing code expects a full data string or just raw?
            // existing code: return part.inlineData.data; -> this is RAW base64 without prefix.

            const base64 = reader.result.split(',')[1];
            resolve(base64);
          } else {
            reject(new Error("Failed to convert blob to base64"));
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

    } catch (e: any) {
      console.warn(`Local TTS generation failed (attempt ${attempt}):`, e.message);
      throw e;
    }
  };

  try {
    return await callApi();
  } catch (error) {
    console.error("Error generating speech:", error);
    throw error;
  }
};

export const generateCharacterResponse = async (
  character: Character,
  userProfile: UserProfile,
  chatHistory: { role: string; text: string }[],
  userMessage: string
): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing");

  const model = "gemini-2.5-flash";

  const systemInstruction = `You are roleplaying as a character in a conversation. Stay COMPLETELY in character at all times.

CHARACTER YOU ARE PLAYING:
- Name: ${character.name}
- Gender: ${character.gender}
- Relationship to the user: ${character.relation}
- Personality traits: ${character.traits}
- Description: ${character.description}

THE USER TALKING TO YOU:
- Name: ${userProfile.name}
- Gender: ${userProfile.gender}

RULES:
1. Respond as ${character.name} would, based on their personality traits and relationship.
2. Keep responses conversational and natural, like a real video call.
3. Keep responses concise — 1-3 sentences max, like natural speech.
4. Show emotion and personality consistent with the character traits.
5. Address the user by their name (${userProfile.name}) occasionally.
6. Never break character or mention being an AI.`;

  // Build conversation history for context
  const historyParts = chatHistory.map(msg => ({
    role: msg.role === 'user' ? 'user' as const : 'model' as const,
    parts: [{ text: msg.text }]
  }));

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [
        ...historyParts,
        { role: 'user' as const, parts: [{ text: userMessage }] }
      ],
      config: {
        systemInstruction,
        maxOutputTokens: 200,
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return text.trim();
  } catch (error) {
    console.error("Error generating character response:", error);
    throw error;
  }
};

// Helper to decode base64 to Uint8Array
function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

// Helper to decode PCM to AudioBuffer
async function decodeAudioDataHelper(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

// Helper to play the audio buffer
export const playAudioData = async (base64String: string) => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

    const bytes = decode(base64String);
    const buffer = await decodeAudioDataHelper(bytes, audioContext, 24000, 1);

    const source = audioContext.createBufferSource();
    source.buffer = buffer;
    source.connect(audioContext.destination);
    source.start(0);
    return source;
  } catch (e) {
    console.error("Error playing audio", e);
  }
};