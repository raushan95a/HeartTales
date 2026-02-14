import React, { useState, useEffect, useRef } from 'react';
import { Story, Scene } from '../types';
import { generateSceneImage, generateSpeech, playAudioData } from '../services/geminiService';
import { Button } from './Button';
import { ArrowLeft, Share2, Volume2, Loader2, PlayCircle, StopCircle } from 'lucide-react';

interface StoryViewerProps {
  story: Story;
  onBack: () => void;
  onUpdateStory: (updatedStory: Story) => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({ story, onBack, onUpdateStory }) => {
  const [generatingSceneId, setGeneratingSceneId] = useState<string | null>(null);
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  
  // Cache to store audio promises
  const audioCache = useRef<Map<string, Promise<string>>>(new Map());
  // Ref to track if we should stop the sequence
  const isPlayingAllRef = useRef(false);

  // 1. Auto-generate images on mount
  useEffect(() => {
    let isMounted = true;

    const generateMissingImages = async () => {
      const scenesToGenerate = story.scenes.filter(s => !s.imageUrl && !s.isGeneratingImage);

      for (const scene of scenesToGenerate) {
        if (!isMounted) break;

        const storyWithLoading = {
            ...story,
            scenes: story.scenes.map(s => s.id === scene.id ? { ...s, isGeneratingImage: true } : s)
        };
        onUpdateStory(storyWithLoading);

        try {
          const base64Image = await generateSceneImage(scene.visual_description);
          
          if (!isMounted) break;

          const updatedStory = {
            ...story,
            scenes: story.scenes.map(s => 
              s.id === scene.id 
                ? { ...s, imageUrl: base64Image, isGeneratingImage: false } 
                : s
            )
          };
          onUpdateStory(updatedStory);
        } catch (error) {
          console.error(`Failed to auto-generate image for scene ${scene.id}`, error);
          const revertedStory = {
            ...story,
            scenes: story.scenes.map(s => s.id === scene.id ? { ...s, isGeneratingImage: false } : s)
          };
          onUpdateStory(revertedStory);
        }
      }
    };

    if (story.scenes.some(s => !s.imageUrl && !s.isGeneratingImage)) {
        generateMissingImages();
    }

    return () => { isMounted = false; };
  }, [story.id]); 

  // Determine appropriate voice
  const getVoiceForSpeaker = (speakerName: string): string => {
    // Check if it's "Me" or a known character
    if (speakerName.toLowerCase() === 'me' || speakerName.toLowerCase() === 'i') {
        return 'Zephyr'; // Default soft male voice for user, could be randomized or configured
    }

    const character = story.characters.find(c => c.name.toLowerCase() === speakerName.toLowerCase());
    if (character && character.voice) return character.voice;
    
    // If character found but no voice (legacy) or unknown speaker, infer from gender if possible or fallback
    if (character) {
        if (character.gender === 'Female') return 'Kore';
        return 'Zephyr';
    }

    return 'Zephyr'; // Fallback
  };

  const getAudio = (text: string, speaker: string, key: string): Promise<string> => {
    if (audioCache.current.has(key)) {
        return audioCache.current.get(key)!;
    }
    const voice = getVoiceForSpeaker(speaker);
    const promise = generateSpeech(text, voice).catch(e => {
        audioCache.current.delete(key); // Remove failed promise
        throw e;
    });
    audioCache.current.set(key, promise);
    return promise;
  };

  const playSingleAudio = async (text: string, speakerName: string, audioKey: string) => {
     try {
        setPlayingAudioId(audioKey);
        
        const base64Audio = await getAudio(text, speakerName, audioKey);
        
        await new Promise<void>(async (resolve) => {
            const source = await playAudioData(base64Audio);
            if (source) {
                source.onended = () => resolve();
            } else {
                resolve();
            }
        });
     } catch (e) {
         console.error("Audio playback failed", e);
     } finally {
         setPlayingAudioId(null);
     }
  };

  const handlePlayAllStory = async () => {
    if (isPlayingAll) {
        isPlayingAllRef.current = false;
        setIsPlayingAll(false);
        return;
    }

    setIsPlayingAll(true);
    isPlayingAllRef.current = true;

    // Create a flat playlist of all dialogues
    const playlist: { text: string; speaker: string; id: string; elementId: string }[] = [];
    
    story.scenes.forEach((scene, sIdx) => {
        scene.dialogue.forEach((d, dIdx) => {
            playlist.push({
                text: d.text,
                speaker: d.speaker,
                id: `${sIdx}-${dIdx}`,
                elementId: `dialogue-${sIdx}-${dIdx}`
            });
        });
    });

    // Start playing loop
    for (let i = 0; i < playlist.length; i++) {
        if (!isPlayingAllRef.current) break;

        const item = playlist[i];

        // 1. Buffer ahead: ensure next 2 items are fetching
        if (i + 1 < playlist.length) {
            const next = playlist[i+1];
            getAudio(next.text, next.speaker, next.id);
        }
        if (i + 2 < playlist.length) {
            const nextNext = playlist[i+2];
            getAudio(nextNext.text, nextNext.speaker, nextNext.id);
        }

        // 2. Scroll into view
        const element = document.getElementById(item.elementId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // 3. Play Audio (Wait for fetch + playback)
        await playSingleAudio(item.text, item.speaker, item.id);
        
        // Small pause
        if (isPlayingAllRef.current) {
            await new Promise(r => setTimeout(r, 300)); 
        }
    }

    setIsPlayingAll(false);
    isPlayingAllRef.current = false;
  };

  return (
    <div className="max-w-5xl mx-auto py-8 px-4 bg-slate-50">
      <div className="mb-8 flex items-center justify-between sticky top-0 bg-slate-50/95 backdrop-blur-sm z-20 py-4 border-b border-slate-200 shadow-sm px-4 -mx-4">
        <button onClick={onBack} className="text-sm font-bold text-slate-700 hover:text-indigo-600 flex items-center transition-colors">
           <ArrowLeft className="w-5 h-5 mr-1" /> BACK
        </button>
        
        <div className="flex gap-3">
            <Button 
                variant={isPlayingAll ? "danger" : "primary"}
                onClick={handlePlayAllStory}
                icon={isPlayingAll ? <StopCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
                className={isPlayingAll ? "bg-red-100 text-red-600 border-red-200 hover:bg-red-200" : "bg-indigo-600 text-white hover:bg-indigo-700"}
            >
                {isPlayingAll ? "Stop Reading" : "Read Story"}
            </Button>
        </div>
      </div>

      <div className="text-center mb-16 animate-fade-in-up">
        <h1 className="text-5xl font-extrabold text-slate-900 mb-6 font-comic tracking-tight uppercase">{story.title}</h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto italic font-serif leading-relaxed border-t-2 border-b-2 border-slate-200 py-4">{story.synopsis}</p>
      </div>

      <div className="space-y-16">
        {story.scenes.map((scene, sceneIndex) => (
          <div key={scene.id} className="bg-white rounded-none border-4 border-slate-900 shadow-[8px_8px_0px_0px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col md:flex-row min-h-[500px]">
            
            {/* Manga Visual Panel (Left/Top) */}
            <div className="md:w-3/5 bg-slate-100 relative min-h-[400px] flex items-center justify-center border-b-4 md:border-b-0 md:border-r-4 border-slate-900">
              {scene.imageUrl ? (
                <div className="relative w-full h-full group animate-in fade-in duration-700">
                    <img src={scene.imageUrl} alt={scene.visual_description} className="w-full h-full object-cover grayscale contrast-125 brightness-110" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none"></div>
                </div>
              ) : (
                <div className="p-12 text-center w-full flex flex-col items-center justify-center h-full">
                   <div className="mb-4 text-slate-400">
                     {scene.isGeneratingImage ? (
                        <div className="flex flex-col items-center">
                            <Loader2 className="w-12 h-12 animate-spin text-indigo-500 mb-4" />
                            <p className="text-indigo-600 font-bold animate-pulse">Drawing Scene...</p>
                        </div>
                     ) : (
                        <p className="text-sm text-slate-500 font-mono border border-dashed border-slate-300 p-4 bg-slate-50 max-w-xs mx-auto">
                            Waiting for artist...
                        </p>
                     )}
                   </div>
                </div>
              )}
            </div>

            {/* Narrative Panel (Right/Bottom) */}
            <div className="md:w-2/5 p-6 flex flex-col bg-white">
                <div className="flex-1 space-y-6">
                    {/* Narration Box */}
                    {scene.narration && (
                        <div className="bg-slate-100 border-2 border-slate-800 p-4 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.1)] mb-8">
                            <p className="font-comic text-slate-800 text-sm leading-relaxed uppercase tracking-wide">
                                {scene.narration}
                            </p>
                        </div>
                    )}

                    {/* Dialogue Bubbles */}
                    <div className="space-y-6">
                        {scene.dialogue.map((d, i) => {
                            const audioKey = `${sceneIndex}-${i}`;
                            const isPlaying = playingAudioId === audioKey;
                            const isMe = d.speaker.toLowerCase() === 'me' || d.speaker.toLowerCase() === 'i';

                            return (
                                <div 
                                    id={`dialogue-${sceneIndex}-${i}`}
                                    key={i} 
                                    className={`flex flex-col transition-all duration-500 ${isMe ? 'items-end' : 'items-start'}`}
                                >
                                    <div className={`flex items-end gap-2 max-w-full ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                        {/* Bubble */}
                                        <div className={`
                                            relative px-6 py-4 rounded-3xl border-2 shadow-sm transition-all duration-300
                                            ${isPlaying ? 'border-indigo-500 ring-2 ring-indigo-200 scale-105 z-10' : 'border-slate-900'}
                                            ${isMe 
                                                ? 'bg-indigo-50 rounded-br-none mr-2' 
                                                : 'bg-white rounded-bl-none ml-2'}
                                        `}>
                                            <p className="text-xs font-black text-slate-400 mb-1 uppercase tracking-wider">{d.speaker}</p>
                                            <p className="font-comic text-lg text-slate-900 leading-tight">
                                                {d.text}
                                            </p>
                                        </div>
                                        
                                        {/* Play Button (Manual) */}
                                        <button 
                                            onClick={() => playSingleAudio(d.text, d.speaker, audioKey)}
                                            className={`
                                                mb-1 p-2 rounded-full transition-colors
                                                ${isPlaying ? 'bg-indigo-100 text-indigo-600' : 'bg-slate-100 text-slate-400 hover:text-indigo-600'}
                                            `}
                                            title="Play Voice"
                                            disabled={playingAudioId !== null}
                                        >
                                            {isPlaying ? (
                                                <Volume2 className="w-4 h-4 animate-pulse" />
                                            ) : (
                                                <PlayCircle className="w-4 h-4" />
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
                
                <div className="mt-8 pt-4 border-t-2 border-slate-100 text-right">
                    <span className="text-xs font-black text-slate-300 uppercase tracking-widest">Page {sceneIndex + 1}</span>
                </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};