import React, { useState, useEffect } from 'react';
import { Character, Story } from '../types';
import { CharacterCard } from './CharacterCard';
import { Button } from './Button';
import { generateStoryFromPrompt } from '../services/geminiService';
import { Sparkles, ArrowRight, BookOpen } from 'lucide-react';

interface StoryCreatorProps {
  characters: Character[];
  onStoryCreated: (story: Story) => void;
  onCancel: () => void;
}

export const StoryCreator: React.FC<StoryCreatorProps> = ({ characters, onStoryCreated, onCancel }) => {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const toggleSelection = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  useEffect(() => {
    let interval: ReturnType<typeof setInterval>;
    if (isGenerating) {
      setProgress(0);
      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 90) return prev; // Stall at 90% until done
          return prev + Math.floor(Math.random() * 5) + 1;
        });
      }, 500);
    } else {
      setProgress(0);
    }
    return () => clearInterval(interval);
  }, [isGenerating]);

  const handleGenerate = async () => {
    if (selectedIds.size === 0) return;
    if (!prompt.trim()) return;

    setIsGenerating(true);
    setError(null);

    try {
      const selectedChars = characters.filter(c => selectedIds.has(c.id));
      const storyData = await generateStoryFromPrompt(selectedChars, prompt);
      
      const newStory: Story = {
        id: crypto.randomUUID(),
        createdAt: Date.now(),
        ...storyData
      };

      setProgress(100);
      setTimeout(() => {
        onStoryCreated(newStory);
      }, 500);
    } catch (err: any) {
      console.error(err);
      setError("Failed to generate story. Please try again. " + (err.message || ''));
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="mb-8">
        <button onClick={onCancel} className="text-sm text-slate-500 hover:text-indigo-600 mb-4 flex items-center">
           &larr; Back to Dashboard
        </button>
        <h2 className="text-3xl font-bold text-slate-900">Create a New Story</h2>
        <p className="text-slate-500 mt-1">Select characters and describe the adventure you want them to have.</p>
      </div>

      {/* Step 1: Select Characters */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center">
          <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm mr-2">1</span>
          Select Characters
        </h3>
        
        {characters.length === 0 ? (
          <div className="p-4 bg-yellow-50 text-yellow-800 rounded-lg">
            You need to add characters before creating a story.
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
          <span className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-sm mr-2">2</span>
          Story Idea
        </h3>
        <textarea
          className="w-full h-32 p-4 rounded-xl border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none resize-none text-lg"
          placeholder="e.g. They find a secret map in the attic and go on a treasure hunt in the backyard..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
        />
        <p className="text-xs text-slate-500 mt-2 text-right">{prompt.length} chars</p>
      </div>

      {/* Action */}
      <div className="flex flex-col items-center">
        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm max-w-lg w-full text-center">
            {error}
          </div>
        )}
        
        {isGenerating && (
            <div className="w-full max-w-md mb-6">
                <div className="flex justify-between text-sm font-medium text-slate-600 mb-2">
                    <span>Creating your story...</span>
                    <span>{progress}%</span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2.5">
                    <div className="bg-indigo-600 h-2.5 rounded-full transition-all duration-500 ease-out" style={{ width: `${progress}%` }}></div>
                </div>
            </div>
        )}

        <Button 
          onClick={handleGenerate}
          disabled={selectedIds.size === 0 || !prompt.trim()}
          isLoading={isGenerating}
          className="w-full md:w-auto text-lg px-8 py-4 shadow-xl shadow-indigo-200"
          icon={<Sparkles className="w-5 h-5"/>}
        >
          {isGenerating ? 'Generating Story Magic...' : 'Generate Story'}
        </Button>
      </div>

      {/* Tips */}
      <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 text-center text-slate-500 text-sm">
        <div className="p-4 bg-slate-50 rounded-lg">
          <Sparkles className="w-6 h-6 mx-auto mb-2 text-indigo-400"/>
          <p>AI creates scenes and dialogue tailored to your characters' traits.</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-lg">
          <BookOpen className="w-6 h-6 mx-auto mb-2 text-teal-400"/>
          <p>Read the story in a comic-strip format.</p>
        </div>
        <div className="p-4 bg-slate-50 rounded-lg">
          <ArrowRight className="w-6 h-6 mx-auto mb-2 text-purple-400"/>
          <p>Visualize any scene with AI image generation.</p>
        </div>
      </div>
    </div>
  );
};