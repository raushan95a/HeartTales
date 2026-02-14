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
      contents: inputContext,
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

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
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

  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};

export const generateSpeech = async (text: string, voiceName: string = 'Zephyr'): Promise<string> => {
  if (!apiKey) throw new Error("API Key is missing");

  const model = "gemini-2.5-flash-preview-tts";

  try {
    const response = await ai.models.generateContent({
      model,
      contents: [{ parts: [{ text }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: { voiceName }
            },
        },
      },
    });

    const candidates = response.candidates;
    if (candidates && candidates.length > 0) {
        const parts = candidates[0].content.parts;
        for (const part of parts) {
            if (part.inlineData && part.inlineData.data) {
                return part.inlineData.data;
            }
        }
    }
    throw new Error("No audio data found");
  } catch (error) {
    console.error("Error generating speech:", error);
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
        const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)({sampleRate: 24000});
        
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