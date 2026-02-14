import React, { useState } from 'react';
import { Character, Story, UserProfile, VOICE_OPTIONS, Scene } from '../types';
import { CharacterCard } from './CharacterCard';
import { Button } from './Button';
import { generateStoryFromPrompt, generateSceneImage, generateSpeech } from '../services/geminiService';
import { Sparkles, ArrowRight, BookOpen, User, Mic } from 'lucide-react';
import { Dropdown } from './Dropdown';

interface StoryCreatorProps {
  characters: Character[];
  userProfile: UserProfile | null;
  onUpdateUserProfile: (p: UserProfile) => void;
  onStoryCreated: (story: Story) => void;
  onCancel: () => void;
}

export const StoryCreator: React.FC<StoryCreatorProps> = ({
  characters,
  userProfile,
  onUpdateUserProfile,
  onStoryCreated,
  onCancel
}) => {
  // Steps: 0 = Profile (if missing), 1 = Select, 2 = Prompt, 3 = Generating
  const initialStep = userProfile ? 1 : 0;
  const [step, setStep] = useState(initialStep);

  // Profile Form State
  const [tempProfile, setTempProfile] = useState<UserProfile>({
    name: '',
    gender: 'Male',
    description: '',
    voice: 'Zephyr'
  });

  // Story State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [prompt, setPrompt] = useState('');

  // Generation State
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState('');

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
    if (error) setError(null); // Clear error on interaction
  };

  const handleSaveProfile = () => {
    if (!tempProfile.name || !tempProfile.description) return;
    onUpdateUserProfile(tempProfile);
    setStep(1);
  };

  const determineVoice = (speakerName: string, characters: Character[], userProfile: UserProfile): string => {
    // Check if it's the user
    if (speakerName.toLowerCase() === userProfile.name.toLowerCase() || speakerName.toLowerCase() === 'me' || speakerName.toLowerCase() === 'i') {
      return userProfile.voice;
    }
    // Check known characters
    const char = characters.find(c => c.name.toLowerCase() === speakerName.toLowerCase());
    if (char) return char.voice;

    // Fallback
    return 'Zephyr';
  };

  const handleGenerate = async () => {
    setError(null);

    // Validation
    if (selectedIds.size === 0) {
      setError("Please select at least one friend to join your adventure! (Click on a card above)");
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    if (!prompt.trim()) {
      setError("Please tell us what the story should be about.");
      return;
    }
    if (!userProfile) return;

    setIsGenerating(true);
    setStep(3); // Progress Screen
    setProgress(5);
    setStatusText("Weaving the story text...");

    try {
      // 1. Generate Story Text
      const selectedChars = characters.filter(c => selectedIds.has(c.id));
      const storyBase = await generateStoryFromPrompt(userProfile, selectedChars, prompt);

      setProgress(25);
      setStatusText("Story written! Now sketching the scenes...");

      // 2. Generate Images (Sequential to avoid rate limits, or Parallel if quota allows)
      // We'll do parallel requests for speed, but catch individual errors
      const scenesWithImages: Scene[] = await Promise.all(storyBase.scenes.map(async (scene, idx) => {
        try {
          const b64 = await generateSceneImage(scene.visual_description, idx);
          // Update progress based on scene count (allocating 40% of bar to images)
          setProgress(prev => Math.min(prev + (40 / storyBase.scenes.length), 65));
          return { ...scene, imageUrl: b64, isGeneratingImage: false };
        } catch (e) {
          console.error(`Failed image for scene ${idx}`, e);
          return { ...scene, isGeneratingImage: false };
        }
      }));

      setStatusText("Scenes drawn! Now recording voice actors...");
      setProgress(70);

      // 3. Generate Audio for ALL dialogues SEQUENTIALLY to avoid 429 Rate Limits

      // Create a deep copy of scenes to update
      const scenesWithAudio = JSON.parse(JSON.stringify(scenesWithImages));

      // Flatten the list of dialogues to process them one by one
      interface DialogueTask {
        sceneIdx: number;
        dialogueIdx: number;
        text: string;
        speaker: string;
      }

      const tasks: DialogueTask[] = [];
      scenesWithAudio.forEach((scene: Scene, sIdx: number) => {
        scene.dialogue.forEach((d: any, dIdx: number) => {
          tasks.push({ sceneIdx: sIdx, dialogueIdx: dIdx, text: d.text, speaker: d.speaker });
        });
      });

      const allDialoguesCount = tasks.length;
      let completedAudio = 0;

      for (const task of tasks) {
        try {
          const voice = determineVoice(task.speaker, selectedChars, userProfile);

          // Add a small delay between requests to respect rate limits
          if (completedAudio > 0) {
            await new Promise(r => setTimeout(r, 1000));
          }

          const audioB64 = await generateSpeech(task.text, voice);

          // Update the specific dialogue in the structure
          scenesWithAudio[task.sceneIdx].dialogue[task.dialogueIdx].audioData = audioB64;
        } catch (e) {
          console.error(`Failed audio for ${task.speaker} at scene ${task.sceneIdx}`, e);
          // We just skip adding audioData, user will see text without audio
        } finally {
          completedAudio++;
          // Allocate 25% of bar to audio
          const audioProgress = (completedAudio / allDialoguesCount) * 25;
          setProgress(70 + audioProgress);
        }
      }

      setStatusText("Finalizing your book...");
      setProgress(100);

      // Safe ID generation
      const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID
        ? crypto.randomUUID()
        : `story-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const finalStory: Story = {
        id: uniqueId,
        createdAt: Date.now(),
        userProfile: userProfile,
        ...storyBase,
        scenes: scenesWithAudio
      };

      // Slight delay to let user see 100%
      setTimeout(() => {
        onStoryCreated(finalStory);
      }, 800);

    } catch (err: any) {
      console.error(err);
      setError("Failed to generate story. " + (err.message || ''));
      setIsGenerating(false);
      setStep(1); // Go back to start
    }
  };

  // -- RENDER STEPS --

  if (step === 0) {
    return (
      <div className="max-w-2xl mx-auto py-12 px-4">
        <h2 className="text-3xl font-bold text-slate-900 mb-6 text-center font-display">First, tell us about YOU</h2>
        <div className="soft-card p-8">
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Your Name (The Hero)</label>
              <input
                type="text"
                className="input-shell"
                value={tempProfile.name}
                onChange={e => setTempProfile({ ...tempProfile, name: e.target.value })}
                placeholder="e.g. Alex"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Gender</label>
                <Dropdown
                  value={tempProfile.gender}
                  options={['Male', 'Female']}
                  onChange={v => setTempProfile({ ...tempProfile, gender: v as 'Male' | 'Female' })}
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Your Voice</label>
                <Dropdown
                  value={tempProfile.voice}
                  options={VOICE_OPTIONS}
                  onChange={v => setTempProfile({ ...tempProfile, voice: v })}
                  icon={<Mic className="w-4 h-4" />}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description</label>
              <textarea
                rows={3}
                className="textarea-shell"
                value={tempProfile.description}
                onChange={e => setTempProfile({ ...tempProfile, description: e.target.value })}
                placeholder="e.g. A curious explorer with messy hair..."
              />
            </div>
            <Button
              onClick={handleSaveProfile}
              className="w-full mt-4"
              disabled={!tempProfile.name || !tempProfile.description}
            >
              Continue to Story
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (step === 3) {
    return (
      <div className="max-w-xl mx-auto py-24 px-4 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2 font-display">Creating Your Masterpiece</h2>
        <p className="text-slate-500 mb-10">Weaving text, sketching scenes, and recording voices…</p>

        <div className="w-full bg-slate-100 rounded-full h-5 mb-4 progress-bar">
          <div
            className="bg-gradient-to-r from-rose-400 via-amber-400 to-rose-400 h-full rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%`, backgroundSize: '200% 100%', animation: 'shimmer 2s linear infinite' }}
          >
          </div>
        </div>
        <p className="text-sm text-rose-500 font-bold animate-pulse">{statusText}</p>
        <p className="text-xs text-slate-400 mt-3 font-medium">{Math.round(progress)}% Complete</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <button onClick={onCancel} className="text-sm text-slate-500 hover:text-rose-500 mb-4 flex items-center">
          &larr; Back to Dashboard
        </button>
        <h2 className="text-3xl font-bold text-slate-900 font-display">Create a New Story</h2>
        <p className="text-slate-500 mt-1">
          Starring <span className="font-bold text-rose-500">{userProfile?.name}</span> and friends.
        </p>
      </div>

      {/* Step 1: Select Characters */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
          <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-sm mr-2">1</span>
          Select Friends to Join You
        </h3>

        {characters.length === 0 ? (
          <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg">
            You haven't added any characters yet. Go back to Dashboard to add some!
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {characters.map(char => (
              <CharacterCard
                key={char.id}
                character={char}
                selectable
                selected={selectedIds.has(char.id)}
                onToggleSelect={toggleSelection}
              />
            ))}
          </div>
        )}
      </div>

      {/* Step 2: Prompt */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
          <span className="w-6 h-6 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center text-sm mr-2">2</span>
          Story Adventure
        </h3>
        <textarea
          className="textarea-shell h-32 resize-none text-lg"
          placeholder="e.g. We find a secret map in the attic and go on a treasure hunt..."
          value={prompt}
          onChange={(e) => {
            setPrompt(e.target.value);
            if (error) setError(null);
          }}
        />
        <p className="text-xs text-slate-500 mt-2 text-right">{prompt.length} chars</p>
      </div>

      {/* Action */}
      <div className="flex flex-col items-center">
        {error && (
          <div className="mb-4 p-3 bg-rose-50 text-rose-700 rounded-lg text-sm max-w-lg w-full text-center border border-rose-200">
            {error}
          </div>
        )}

        <Button
          onClick={handleGenerate}
          disabled={!prompt.trim()}
          className="w-full md:w-auto text-lg px-8 py-4"
          icon={<Sparkles className="w-5 h-5" />}
        >
          Generate Full Story
        </Button>
      </div>
    </div>
  );
};