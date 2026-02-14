import React, { useState, useRef } from 'react';
import { Story } from '../types';
import { playAudioData } from '../services/geminiService';
import { Button } from './Button';
import { ArrowLeft, Volume2, PlayCircle, StopCircle } from 'lucide-react';

interface StoryViewerProps {
  story: Story;
  onBack: () => void;
  onUpdateStory: (updatedStory: Story) => void;
}

export const StoryViewer: React.FC<StoryViewerProps> = ({ story, onBack }) => {
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [isPlayingAll, setIsPlayingAll] = useState(false);
  const isPlayingAllRef = useRef(false);

  // Audio Playback
  const playSingleAudio = async (audioData: string | undefined, audioKey: string) => {
     if (!audioData) return;
     
     try {
        setPlayingAudioId(audioKey);
        await new Promise<void>(async (resolve) => {
            const source = await playAudioData(audioData);
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

    // Create playlist from existing data
    const playlist: { audioData?: string; id: string; elementId: string }[] = [];
    
    story.scenes.forEach((scene, sIdx) => {
        scene.dialogue.forEach((d, dIdx) => {
            playlist.push({
                audioData: d.audioData,
                id: `${sIdx}-${dIdx}`,
                elementId: `dialogue-${sIdx}-${dIdx}`
            });
        });
    });

    for (let i = 0; i < playlist.length; i++) {
        if (!isPlayingAllRef.current) break;

        const item = playlist[i];
        if (!item.audioData) continue;

        // Scroll
        const element = document.getElementById(item.elementId);
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        // Play (Synchronous wait because data is local)
        await playSingleAudio(item.audioData, item.id);
        
        if (isPlayingAllRef.current) {
            await new Promise(r => setTimeout(r, 300)); 
        }
    }

    setIsPlayingAll(false);
    isPlayingAllRef.current = false;
  };

  // Safe access to user profile
  const userName = story.userProfile?.name || 'Me';

  return (
        <div className="max-w-5xl mx-auto py-8 px-4">
            <div className="mb-8 flex items-center justify-between sticky top-0 bg-white/80 backdrop-blur-sm z-20 py-4 border-b border-slate-200 shadow-sm px-4 -mx-4">
                <button onClick={onBack} className="text-sm font-bold text-slate-700 hover:text-rose-500 flex items-center transition-colors">
           <ArrowLeft className="w-5 h-5 mr-1" /> BACK
        </button>
        
        <div className="flex gap-3">
            <Button 
                variant={isPlayingAll ? "danger" : "primary"}
                onClick={handlePlayAllStory}
                icon={isPlayingAll ? <StopCircle className="w-5 h-5" /> : <PlayCircle className="w-5 h-5" />}
            >
                {isPlayingAll ? "Stop Reading" : "Read Story"}
            </Button>
        </div>
      </div>

      <div className="text-center mb-16 animate-fade-in-up">
                <h1 className="text-5xl font-extrabold text-slate-900 mb-6 font-display tracking-tight uppercase">{story.title}</h1>
                <p className="text-xl text-slate-600 max-w-2xl mx-auto italic leading-relaxed border-t-2 border-b-2 border-slate-200 py-4">{story.synopsis}</p>
      </div>

      <div className="space-y-20">
        {story.scenes.map((scene, sceneIndex) => (
          <div key={scene.id} className="comic-panel flex flex-col md:flex-row min-h-[500px] animate-fade-in-up" style={{ animationDelay: `${sceneIndex * 0.15}s` }}>
            
            {/* Manga Visual Panel */}
            <div className="md:w-3/5 bg-slate-100 relative min-h-[400px] flex items-center justify-center border-b-4 md:border-b-0 md:border-r-3 border-slate-900 overflow-hidden">
              {scene.imageUrl ? (
                <div className="relative w-full h-full group">
                    <img src={scene.imageUrl} alt={scene.visual_description} className="w-full h-full object-cover grayscale contrast-125 brightness-110 transition-all duration-700 group-hover:grayscale-0 group-hover:contrast-100" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent pointer-events-none"></div>
                </div>
              ) : (
                <div className="p-12 text-center text-slate-400">Image not available</div>
              )}
            </div>

            {/* Narrative Panel */}
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
                            
                            // Safer check for 'Me'
                            const speakerName = d.speaker || 'Unknown';
                            const isMe = 
                                speakerName.toLowerCase() === userName.toLowerCase() || 
                                speakerName.toLowerCase() === 'me' ||
                                speakerName.toLowerCase() === 'i';

                            return (
                                <div 
                                    id={`dialogue-${sceneIndex}-${i}`}
                                    key={i} 
                                    className={`flex flex-col transition-all duration-500 ${isMe ? 'items-end' : 'items-start'}`}
                                >
                                    <div className={`flex items-end gap-2 max-w-full ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                                        <div className={`
                                            dialogue-bubble shadow-sm
                                            ${isPlaying ? 'is-playing' : ''}
                                            ${isMe 
                                                ? 'dialogue-bubble-me mr-2' 
                                                : 'dialogue-bubble-other ml-2'}
                                        `}>
                                            <p className="text-xs font-black text-slate-400 mb-1 uppercase tracking-wider">{d.speaker}</p>
                                            <p className="font-comic text-lg text-slate-900 leading-tight">
                                                {d.text}
                                            </p>
                                        </div>
                                        
                                        {d.audioData && (
                                            <button 
                                                onClick={() => playSingleAudio(d.audioData, audioKey)}
                                                className={`audio-btn mb-1 ${isPlaying ? 'is-playing' : ''}`}
                                                disabled={playingAudioId !== null}
                                            >
                                                {isPlaying ? (
                                                    <Volume2 className="w-4 h-4 animate-pulse" />
                                                ) : (
                                                    <PlayCircle className="w-4 h-4" />
                                                )}
                                            </button>
                                        )}
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