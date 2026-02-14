import React, { useState, useRef, useEffect } from 'react';
import { Character, UserProfile, ChatMessage } from '../types';
import { generateCharacterResponse } from '../services/geminiService';
import { Phone, PhoneOff, Mic, MicOff, Volume2, VolumeX, Send, ArrowLeft, MessageCircle } from 'lucide-react';

interface CharacterCallProps {
    characters: Character[];
    userProfile: UserProfile | null;
    onBack: () => void;
}

// ─── 3D Animated Avatar ─────────────────────────────────────────────
const Avatar3D: React.FC<{ character: Character; isSpeaking: boolean; isRinging: boolean }> = ({ character, isSpeaking, isRinging }) => {
    const colorMap: Record<string, string> = {
        'bg-red-500': '#ef4444', 'bg-orange-500': '#f97316', 'bg-amber-500': '#f59e0b',
        'bg-green-500': '#22c55e', 'bg-emerald-500': '#10b981', 'bg-teal-500': '#14b8a6',
        'bg-cyan-500': '#06b6d4', 'bg-blue-500': '#3b82f6', 'bg-indigo-500': '#6366f1',
        'bg-violet-500': '#8b5cf6', 'bg-purple-500': '#a855f7', 'bg-fuchsia-500': '#d946ef',
        'bg-pink-500': '#ec4899', 'bg-rose-500': '#f43f5e',
    };
    const color = colorMap[character.avatarColor] || '#6366f1';
    const skinTone = character.gender === 'Female' ? '#FDBCB4' : '#D2A679';

    return (
        <div className="relative flex items-center justify-center w-full h-full">
            {/* Ambient glow */}
            <div
                className="absolute rounded-full blur-3xl opacity-30"
                style={{
                    width: '340px', height: '340px',
                    background: `radial-gradient(circle, ${color}, transparent 70%)`,
                    animation: isSpeaking ? 'pulseGlow 1s ease-in-out infinite' : 'pulseGlow 3s ease-in-out infinite',
                }}
            />

            {/* Head container with bob animation */}
            <div
                className="relative"
                style={{
                    animation: isRinging ? 'ringBounce 0.4s ease-in-out infinite' : 'headBob 3s ease-in-out infinite',
                    perspective: '600px',
                }}
            >
                {/* Face circle */}
                <div
                    className="relative rounded-full shadow-2xl flex items-center justify-center"
                    style={{
                        width: '200px', height: '200px',
                        background: `linear-gradient(145deg, ${skinTone}, ${adjustBrightness(skinTone, -20)})`,
                        boxShadow: `0 20px 60px ${color}44, 0 0 80px ${color}22, inset 0 -8px 20px rgba(0,0,0,0.1)`,
                        transform: 'rotateY(5deg) rotateX(-2deg)',
                    }}
                >
                    {/* Hair */}
                    <div
                        className="absolute top-0 left-1/2 -translate-x-1/2 rounded-t-full"
                        style={{
                            width: '210px', height: '100px',
                            background: character.gender === 'Female'
                                ? `linear-gradient(180deg, #1a1a2e, #16213e)`
                                : `linear-gradient(180deg, #2d2d2d, #1a1a1a)`,
                            top: '-15px',
                            borderRadius: character.gender === 'Female' ? '110px 110px 30px 30px' : '105px 105px 10px 10px',
                        }}
                    />
                    {character.gender === 'Female' && (
                        <>
                            <div className="absolute" style={{
                                width: '30px', height: '80px', background: 'linear-gradient(180deg, #1a1a2e, #16213e)',
                                top: '60px', left: '-10px', borderRadius: '0 0 20px 20px',
                            }} />
                            <div className="absolute" style={{
                                width: '30px', height: '80px', background: 'linear-gradient(180deg, #1a1a2e, #16213e)',
                                top: '60px', right: '-10px', borderRadius: '0 0 20px 20px',
                            }} />
                        </>
                    )}

                    {/* Eyes */}
                    <div className="absolute flex gap-10" style={{ top: '75px' }}>
                        <div className="relative">
                            <div className="w-7 h-7 bg-white rounded-full shadow-inner flex items-center justify-center">
                                <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: color }}>
                                    <div className="w-2 h-2 bg-black rounded-full" />
                                </div>
                            </div>
                            {/* Blink overlay */}
                            <div
                                className="absolute inset-0 rounded-full"
                                style={{
                                    background: skinTone,
                                    animation: 'blink 4s ease-in-out infinite',
                                    transformOrigin: 'top',
                                }}
                            />
                        </div>
                        <div className="relative">
                            <div className="w-7 h-7 bg-white rounded-full shadow-inner flex items-center justify-center">
                                <div className="w-4 h-4 rounded-full flex items-center justify-center" style={{ background: color }}>
                                    <div className="w-2 h-2 bg-black rounded-full" />
                                </div>
                            </div>
                            <div
                                className="absolute inset-0 rounded-full"
                                style={{
                                    background: skinTone,
                                    animation: 'blink 4s ease-in-out infinite',
                                    transformOrigin: 'top',
                                }}
                            />
                        </div>
                    </div>

                    {/* Eyebrows */}
                    <div className="absolute flex gap-14" style={{ top: '62px' }}>
                        <div className="w-8 h-1.5 rounded-full bg-gray-800 opacity-60" style={{ transform: 'rotate(-5deg)' }} />
                        <div className="w-8 h-1.5 rounded-full bg-gray-800 opacity-60" style={{ transform: 'rotate(5deg)' }} />
                    </div>

                    {/* Nose */}
                    <div className="absolute" style={{ top: '100px', left: '50%', transform: 'translateX(-50%)' }}>
                        <div className="w-3 h-4 rounded-full opacity-30" style={{ background: adjustBrightness(skinTone, -30) }} />
                    </div>

                    {/* Mouth */}
                    <div className="absolute" style={{ top: '125px', left: '50%', transform: 'translateX(-50%)' }}>
                        {isSpeaking ? (
                            <div
                                className="rounded-full bg-gray-800 flex items-center justify-center"
                                style={{
                                    width: '28px',
                                    animation: 'mouthMove 0.3s ease-in-out infinite alternate',
                                }}
                            >
                                <div className="w-4 h-1 bg-red-400 rounded-full mt-0.5" />
                            </div>
                        ) : (
                            <div
                                className="w-12 h-1.5 rounded-full opacity-50"
                                style={{
                                    background: adjustBrightness(skinTone, -40),
                                    borderRadius: '0 0 20px 20px',
                                    height: '3px',
                                }}
                            />
                        )}
                    </div>

                    {/* Cheek blush */}
                    <div className="absolute w-6 h-4 rounded-full opacity-20" style={{ top: '108px', left: '25px', background: '#ff6b6b' }} />
                    <div className="absolute w-6 h-4 rounded-full opacity-20" style={{ top: '108px', right: '25px', background: '#ff6b6b' }} />
                </div>

                {/* Neck */}
                <div
                    className="mx-auto rounded-b-lg"
                    style={{
                        width: '50px', height: '25px',
                        background: `linear-gradient(180deg, ${adjustBrightness(skinTone, -10)}, ${adjustBrightness(skinTone, -25)})`,
                    }}
                />

                {/* Shoulders */}
                <div
                    className="mx-auto rounded-t-3xl"
                    style={{
                        width: '160px', height: '40px',
                        background: `linear-gradient(145deg, ${color}, ${adjustBrightness(color, -30)})`,
                        marginTop: '-5px',
                    }}
                />
            </div>

            {/* CSS Animations */}
            <style>{`
        @keyframes headBob {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          25% { transform: translateY(-6px) rotate(0.5deg); }
          75% { transform: translateY(-3px) rotate(-0.5deg); }
        }
        @keyframes ringBounce {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-12px) scale(1.03); }
        }
        @keyframes blink {
          0%, 42%, 44%, 100% { transform: scaleY(0); }
          43% { transform: scaleY(1); }
        }
        @keyframes mouthMove {
          0% { height: 8px; }
          100% { height: 16px; }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.45; transform: scale(1.08); }
        }
      `}</style>
        </div>
    );
};

function adjustBrightness(hex: string, amount: number): string {
    const num = parseInt(hex.replace('#', ''), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00FF) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000FF) + amount));
    return `#${(1 << 24 | r << 16 | g << 8 | b).toString(16).slice(1)}`;
}

// ─── Character Selection Grid ────────────────────────────────────────
const CharacterSelector: React.FC<{
    characters: Character[];
    onSelect: (char: Character) => void;
    onBack: () => void;
}> = ({ characters, onSelect, onBack }) => {
    if (characters.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="w-24 h-24 bg-slate-100 rounded-full flex items-center justify-center mb-6">
                    <Phone className="w-10 h-10 text-slate-300" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">No Characters Yet</h2>
                <p className="text-slate-500 mb-6 max-w-md">
                    Create some characters first in the Character Manager, then come back to call them!
                </p>
                <button
                    onClick={onBack}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                >
                    Go to Dashboard
                </button>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto py-8 px-4">
            <div className="flex items-center mb-8">
                <button
                    onClick={onBack}
                    className="mr-4 p-2 rounded-lg hover:bg-slate-100 transition-colors text-slate-600"
                >
                    <ArrowLeft className="w-5 h-5" />
                </button>
                <div>
                    <h2 className="text-3xl font-extrabold text-slate-900">Call a Character</h2>
                    <p className="text-slate-500 mt-1">Choose who you want to video call</p>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                {characters.map(char => {
                    const colorMap: Record<string, string> = {
                        'bg-red-500': '#ef4444', 'bg-orange-500': '#f97316', 'bg-amber-500': '#f59e0b',
                        'bg-green-500': '#22c55e', 'bg-emerald-500': '#10b981', 'bg-teal-500': '#14b8a6',
                        'bg-cyan-500': '#06b6d4', 'bg-blue-500': '#3b82f6', 'bg-indigo-500': '#6366f1',
                        'bg-violet-500': '#8b5cf6', 'bg-purple-500': '#a855f7', 'bg-fuchsia-500': '#d946ef',
                        'bg-pink-500': '#ec4899', 'bg-rose-500': '#f43f5e',
                    };
                    const hexColor = colorMap[char.avatarColor] || '#6366f1';

                    return (
                        <div
                            key={char.id}
                            onClick={() => onSelect(char)}
                            className="group cursor-pointer bg-white rounded-2xl border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden hover:-translate-y-1"
                        >
                            {/* Color banner */}
                            <div
                                className="h-20 relative overflow-hidden"
                                style={{ background: `linear-gradient(135deg, ${hexColor}, ${adjustBrightness(hexColor, -40)})` }}
                            >
                                <div className="absolute inset-0 opacity-20" style={{
                                    backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(255,255,255,0.3) 0%, transparent 60%)',
                                }} />
                                {/* Call icon */}
                                <div className="absolute top-3 right-3 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center group-hover:bg-white/40 transition-colors">
                                    <Phone className="w-5 h-5 text-white" />
                                </div>
                            </div>

                            {/* Avatar overlap */}
                            <div className="flex justify-center -mt-8">
                                <div
                                    className="w-16 h-16 rounded-full border-4 border-white shadow-lg flex items-center justify-center text-2xl font-bold text-white"
                                    style={{ background: hexColor }}
                                >
                                    {char.name.charAt(0)}
                                </div>
                            </div>

                            <div className="p-4 pt-2 text-center">
                                <h3 className="text-lg font-bold text-slate-900">{char.name}</h3>
                                <span className="inline-block px-3 py-0.5 rounded-full text-xs font-medium mt-1 mb-2"
                                    style={{ background: `${hexColor}15`, color: hexColor }}>
                                    {char.relation}
                                </span>
                                <p className="text-sm text-slate-500 line-clamp-2">{char.traits}</p>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};


// ─── Active Call UI ─────────────────────────────────────────────────
const ActiveCall: React.FC<{
    character: Character;
    userProfile: UserProfile;
    onEndCall: () => void;
}> = ({ character, userProfile, onEndCall }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [isMuted, setIsMuted] = useState(false);
    const [isSpeakerOn, setIsSpeakerOn] = useState(true);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isListening, setIsListening] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [isConnecting, setIsConnecting] = useState(true);
    const chatEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const isSpeakerOnRef = useRef(isSpeakerOn);
    const recognitionRef = useRef<any>(null);
    const messagesRef = useRef<ChatMessage[]>([]);

    // Keep messages ref in sync for use in speech recognition callback
    useEffect(() => { messagesRef.current = messages; }, [messages]);

    // Keep ref in sync with state so the TTS callback always has the latest value
    useEffect(() => { isSpeakerOnRef.current = isSpeakerOn; }, [isSpeakerOn]);

    // ── Browser TTS helper ──
    const speakText = (text: string) => {
        if (!isSpeakerOnRef.current || !('speechSynthesis' in window)) return;

        // Cancel any ongoing speech
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.0;
        utterance.pitch = character.gender === 'Female' ? 1.3 : 0.9;
        utterance.volume = 1;

        // Try to pick a voice matching gender
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
            const genderKeywords = character.gender === 'Female'
                ? ['female', 'woman', 'zira', 'samantha', 'karen', 'victoria', 'fiona']
                : ['male', 'man', 'david', 'daniel', 'james', 'alex', 'mark'];
            const match = voices.find(v =>
                genderKeywords.some(k => v.name.toLowerCase().includes(k))
            );
            if (match) utterance.voice = match;
        }

        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => setIsSpeaking(false);
        utterance.onerror = () => setIsSpeaking(false);

        window.speechSynthesis.speak(utterance);
    };

    // Preload voices (some browsers need this)
    useEffect(() => {
        window.speechSynthesis?.getVoices();
        const handleVoices = () => window.speechSynthesis.getVoices();
        window.speechSynthesis?.addEventListener?.('voiceschanged', handleVoices);
        return () => {
            window.speechSynthesis?.removeEventListener?.('voiceschanged', handleVoices);
            window.speechSynthesis?.cancel();
        };
    }, []);

    // Stop speaking when speaker is toggled off
    useEffect(() => {
        if (!isSpeakerOn) {
            window.speechSynthesis?.cancel();
            setIsSpeaking(false);
        }
    }, [isSpeakerOn]);

    // Call timer
    useEffect(() => {
        const timer = setInterval(() => setCallDuration(d => d + 1), 1000);
        return () => clearInterval(timer);
    }, []);

    // Simulate connecting + greeting
    useEffect(() => {
        const timeout = setTimeout(() => {
            setIsConnecting(false);
            const greetingText = `Hey ${userProfile.name}! Great to see you! What's up?`;
            const greeting: ChatMessage = {
                id: `msg-${Date.now()}`,
                role: 'character',
                text: greetingText,
                timestamp: Date.now(),
            };
            setMessages([greeting]);
            // Speak the greeting
            setTimeout(() => speakText(greetingText), 300);
        }, 2000);
        return () => clearTimeout(timeout);
    }, [userProfile.name]);

    // Auto-scroll chat — scroll only within the chat container
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }, [messages]);

    const formatTime = (secs: number) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    // ── Core send function (used by both text input and voice) ──
    const sendMessage = async (text: string, currentMessages?: ChatMessage[]) => {
        if (!text.trim() || isLoading) return;

        const userMsg: ChatMessage = {
            id: `msg-${Date.now()}`,
            role: 'user',
            text: text.trim(),
            timestamp: Date.now(),
        };
        setMessages(prev => [...prev, userMsg]);
        setInputText('');
        setIsLoading(true);

        try {
            // Use provided messages or current state for history
            const msgList = currentMessages || messagesRef.current;
            const history = msgList.map(m => ({ role: m.role === 'user' ? 'user' : 'model', text: m.text }));
            const response = await generateCharacterResponse(character, userProfile, history, text.trim());

            const charMsg: ChatMessage = {
                id: `msg-${Date.now() + 1}`,
                role: 'character',
                text: response,
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, charMsg]);

            // Speak the response using browser TTS
            speakText(response);
        } catch (err) {
            console.error('Failed to get character response:', err);
            const fallback = "Sorry, I'm having trouble hearing you... can you say that again?";
            const errorMsg: ChatMessage = {
                id: `msg-${Date.now() + 1}`,
                role: 'character',
                text: fallback,
                timestamp: Date.now(),
            };
            setMessages(prev => [...prev, errorMsg]);
            speakText(fallback);
        } finally {
            setIsLoading(false);
            inputRef.current?.focus();
        }
    };

    const handleSend = () => sendMessage(inputText);

    // ── Speech Recognition (Speech-to-Text) ──
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    const toggleListening = () => {
        if (!SpeechRecognition) {
            alert('Speech recognition is not supported in your browser. Please use Chrome.');
            return;
        }

        if (isListening) {
            // Stop listening
            recognitionRef.current?.stop();
            setIsListening(false);
            return;
        }

        // Start listening
        const recognition = new SpeechRecognition();
        recognition.lang = 'en-US';
        recognition.interimResults = false;
        recognition.continuous = false;
        recognition.maxAlternatives = 1;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event: any) => {
            const transcript = event.results[0][0].transcript;
            if (transcript.trim()) {
                sendMessage(transcript);
            }
        };

        recognition.onerror = (event: any) => {
            console.error('Speech recognition error:', event.error);
            setIsListening(false);
        };

        recognition.onend = () => {
            setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    // Cleanup recognition on unmount
    useEffect(() => {
        return () => {
            recognitionRef.current?.stop();
        };
    }, []);

    const colorMap: Record<string, string> = {
        'bg-red-500': '#ef4444', 'bg-orange-500': '#f97316', 'bg-amber-500': '#f59e0b',
        'bg-green-500': '#22c55e', 'bg-emerald-500': '#10b981', 'bg-teal-500': '#14b8a6',
        'bg-cyan-500': '#06b6d4', 'bg-blue-500': '#3b82f6', 'bg-indigo-500': '#6366f1',
        'bg-violet-500': '#8b5cf6', 'bg-purple-500': '#a855f7', 'bg-fuchsia-500': '#d946ef',
        'bg-pink-500': '#ec4899', 'bg-rose-500': '#f43f5e',
    };
    const charColor = colorMap[character.avatarColor] || '#6366f1';

    return (
        <div className="fixed inset-0 z-50 bg-slate-900 flex flex-col h-screen overflow-hidden" style={{ fontFamily: "'Inter', sans-serif" }}>
            {/* ─── Top bar ─── */}
            <div className="flex-shrink-0 flex items-center justify-between px-5 py-3 bg-black/30 backdrop-blur-sm">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full animate-pulse" style={{ background: '#22c55e' }} />
                    <span className="text-white/80 text-sm font-medium">
                        {isConnecting ? 'Connecting...' : formatTime(callDuration)}
                    </span>
                </div>
                <div className="flex items-center gap-2">
                    <span className="text-white font-semibold text-sm">{character.name}</span>
                    <span className="text-white/50 text-xs px-2 py-0.5 rounded-full border border-white/10">
                        {character.relation}
                    </span>
                </div>
            </div>

            {/* ─── Main content area — fills remaining space ─── */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
                {/* Avatar area — fixed height on mobile, flex on desktop */}
                <div className="h-[45vh] lg:h-auto lg:flex-1 flex-shrink-0 relative" style={{
                    background: `radial-gradient(ellipse at center, ${charColor}15 0%, #0f172a 70%)`,
                }}>
                    <Avatar3D character={character} isSpeaking={isSpeaking || isLoading} isRinging={isConnecting} />

                    {/* Connecting overlay */}
                    {isConnecting && (
                        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/40 backdrop-blur-sm z-10">
                            <div
                                className="w-24 h-24 rounded-full border-4 border-white/20 flex items-center justify-center mb-4 animate-pulse"
                                style={{ borderTopColor: charColor }}
                            >
                                <Phone className="w-10 h-10 text-white animate-bounce" />
                            </div>
                            <p className="text-white text-lg font-medium">Calling {character.name}...</p>
                            <p className="text-white/50 text-sm mt-1">Ringing</p>
                        </div>
                    )}

                    {/* Self-view pip */}
                    <div className="absolute top-4 right-4 w-24 h-24 rounded-2xl bg-slate-800 border-2 border-white/10 shadow-2xl flex items-center justify-center overflow-hidden">
                        <div className="w-14 h-14 rounded-full bg-indigo-600 flex items-center justify-center text-white text-xl font-bold shadow-lg">
                            {userProfile.name.charAt(0)}
                        </div>
                        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 text-white/60 text-[10px] font-medium">You</div>
                    </div>
                </div>

                {/* Chat panel — takes remaining space on mobile, fixed width on desktop */}
                <div className="flex-1 lg:flex-none lg:w-96 flex flex-col min-h-0 bg-slate-800/95 backdrop-blur-xl border-l border-white/5">
                    {/* Chat header */}
                    <div className="flex-shrink-0 px-4 py-3 border-b border-white/5 flex items-center gap-2">
                        <MessageCircle className="w-4 h-4 text-white/50" />
                        <span className="text-white/70 text-sm font-medium">Chat</span>
                        <span className="text-white/30 text-xs ml-auto">{messages.length} messages</span>
                    </div>

                    {/* Messages — scrollable, constrained */}
                    <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
                        {messages.map(msg => (
                            <div
                                key={msg.id}
                                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                            >
                                <div className={`flex items-end gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                                    {msg.role === 'character' && (
                                        <div
                                            className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs text-white font-bold"
                                            style={{ background: charColor }}
                                        >
                                            {character.name.charAt(0)}
                                        </div>
                                    )}
                                    <div
                                        className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${msg.role === 'user'
                                            ? 'bg-indigo-600 text-white rounded-br-md'
                                            : 'bg-white/10 text-white/90 rounded-bl-md'
                                            }`}
                                    >
                                        {msg.text}
                                    </div>
                                </div>
                            </div>
                        ))}

                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="flex items-end gap-2">
                                    <div
                                        className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs text-white font-bold"
                                        style={{ background: charColor }}
                                    >
                                        {character.name.charAt(0)}
                                    </div>
                                    <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-bl-md">
                                        <div className="flex gap-1.5">
                                            <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                            <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                            <div className="w-2 h-2 bg-white/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                        <div ref={chatEndRef} />
                    </div>

                    {/* Input bar */}
                    <div className="flex-shrink-0 px-4 py-3 border-t border-white/5">
                        {/* Listening indicator */}
                        {isListening && (
                            <div className="flex items-center gap-2 mb-2 px-1">
                                <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
                                <span className="text-green-400 text-xs font-medium animate-pulse">Listening... speak now</span>
                            </div>
                        )}
                        <div className="flex items-center gap-2 bg-white/5 rounded-2xl px-4 py-1 border border-white/10 focus-within:border-indigo-500/50 transition-colors">
                            {/* Mic button inside input bar */}
                            <button
                                onClick={toggleListening}
                                disabled={isLoading || isConnecting}
                                className={`p-2 rounded-xl transition-all disabled:opacity-30 ${isListening
                                    ? 'bg-green-500/20 text-green-400'
                                    : 'text-white/40 hover:text-white/70 hover:bg-white/10'
                                    }`}
                                title={isListening ? 'Stop listening' : 'Speak to send'}
                            >
                                {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                            </button>
                            <input
                                ref={inputRef}
                                type="text"
                                value={inputText}
                                onChange={e => setInputText(e.target.value)}
                                onKeyDown={e => e.key === 'Enter' && handleSend()}
                                placeholder={isListening ? 'Listening...' : `Say something to ${character.name}...`}
                                disabled={isLoading || isConnecting || isListening}
                                className="flex-1 bg-transparent text-white text-sm py-2.5 placeholder-white/30 outline-none disabled:opacity-40"
                            />
                            <button
                                onClick={handleSend}
                                disabled={!inputText.trim() || isLoading || isConnecting}
                                className="p-2 rounded-xl transition-all disabled:opacity-30 hover:bg-indigo-600/50"
                                style={{ color: charColor }}
                            >
                                <Send className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* ─── Bottom call controls ─── */}
            <div className="flex-shrink-0 flex items-center justify-center gap-5 py-4 bg-black/40 backdrop-blur-sm">
                <button
                    onClick={toggleListening}
                    disabled={isLoading || isConnecting}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all relative ${isListening
                        ? 'bg-green-500 text-white shadow-lg shadow-green-500/40'
                        : 'bg-white/10 text-white hover:bg-white/20'
                        } disabled:opacity-30`}
                >
                    {isListening && (
                        <div className="absolute inset-0 rounded-full border-2 border-green-400 animate-ping opacity-50" />
                    )}
                    {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>

                <button
                    onClick={() => { window.speechSynthesis?.cancel(); onEndCall(); }}
                    className="w-16 h-16 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg shadow-red-500/30 transition-all hover:scale-105 active:scale-95"
                >
                    <PhoneOff className="w-7 h-7" />
                </button>

                <button
                    onClick={() => setIsSpeakerOn(!isSpeakerOn)}
                    className={`w-12 h-12 rounded-full flex items-center justify-center transition-all ${!isSpeakerOn ? 'bg-red-500/20 text-red-400' : 'bg-white/10 text-white hover:bg-white/20'
                        }`}
                >
                    {isSpeakerOn ? <Volume2 className="w-5 h-5" /> : <VolumeX className="w-5 h-5" />}
                </button>
            </div>
        </div>
    );
};

// ─── Main Export ─────────────────────────────────────────────────────
export const CharacterCall: React.FC<CharacterCallProps> = ({ characters, userProfile, onBack }) => {
    const [selectedCharacter, setSelectedCharacter] = useState<Character | null>(null);

    if (!userProfile) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
                <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mb-6">
                    <Phone className="w-10 h-10 text-amber-400" />
                </div>
                <h2 className="text-2xl font-bold text-slate-800 mb-2">Set Up Your Profile First</h2>
                <p className="text-slate-500 mb-6 max-w-md">
                    You need to create a user profile before making calls. Go to Create Story to set up your profile.
                </p>
                <button
                    onClick={onBack}
                    className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-medium hover:bg-indigo-700 transition-colors"
                >
                    Go to Dashboard
                </button>
            </div>
        );
    }

    if (selectedCharacter) {
        return (
            <ActiveCall
                character={selectedCharacter}
                userProfile={userProfile}
                onEndCall={() => setSelectedCharacter(null)}
            />
        );
    }

    return (
        <CharacterSelector
            characters={characters}
            onSelect={setSelectedCharacter}
            onBack={onBack}
        />
    );
};
