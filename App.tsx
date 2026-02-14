import React, { useState, useEffect } from 'react';
import { Character, Story, ViewState, UserProfile } from './types';
import { CharacterManager } from './components/CharacterManager';
import { StoryCreator } from './components/StoryCreator';
import { StoryViewer } from './components/StoryViewer';
import { CharacterCall } from './components/CharacterCall';
import { Button } from './components/Button';
import { BookOpen, Users, Plus, User, Phone, Sparkles } from 'lucide-react';

const STORAGE_KEY_CHARS = 'storyverse_chars';
const STORAGE_KEY_STORIES = 'storyverse_stories';
const STORAGE_KEY_PROFILE = 'storyverse_profile';

export default function App() {
  const [view, setView] = useState<ViewState>('DASHBOARD');

  // Persisted User Profile
  const [userProfile, setUserProfile] = useState<UserProfile | null>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROFILE);
      return saved ? JSON.parse(saved) : null;
    } catch (e) { return null; }
  });

  // Persisted Characters
  const [characters, setCharacters] = useState<Character[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CHARS);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse characters from localStorage", e);
      return [];
    }
  });

  // Persisted Stories
  const [stories, setStories] = useState<Story[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_STORIES);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error("Failed to parse stories from localStorage", e);
      return [];
    }
  });

  const [activeStoryId, setActiveStoryId] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEY_CHARS, JSON.stringify(characters)); }, [characters]);
  useEffect(() => { localStorage.setItem(STORAGE_KEY_STORIES, JSON.stringify(stories)); }, [stories]);
  useEffect(() => {
    if (userProfile) localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(userProfile));
  }, [userProfile]);

  const handleStoryCreated = (story: Story) => {
    setStories([story, ...stories]);
    setActiveStoryId(story.id);
    setView('VIEW_STORY');
  };

  const handleUpdateStory = (updatedStory: Story) => {
    setStories(prev => prev.map(s => s.id === updatedStory.id ? updatedStory : s));
  };

  const handleOpenStory = (id: string) => {
    setActiveStoryId(id);
    setView('VIEW_STORY');
  };

  const activeStory = stories.find(s => s.id === activeStoryId);

  const renderContent = () => {
    switch (view) {
      case 'CHARACTERS':
        return <CharacterManager characters={characters} setCharacters={setCharacters} />;
      case 'CREATE_STORY':
        return (
          <StoryCreator
            characters={characters}
            userProfile={userProfile}
            onUpdateUserProfile={setUserProfile}
            onStoryCreated={handleStoryCreated}
            onCancel={() => setView('DASHBOARD')}
          />
        );
      case 'VIEW_STORY':
        if (!activeStory) return <div>Story not found</div>;
        return (
          <StoryViewer
            story={activeStory}
            onBack={() => setView('DASHBOARD')}
            onUpdateStory={handleUpdateStory}
          />
        );
      case 'CALL_CHARACTER':
        return (
          <CharacterCall
            characters={characters}
            userProfile={userProfile}
            onBack={() => setView('DASHBOARD')}
          />
        );
      case 'DASHBOARD':
      default: {
        const stats = [
          { label: 'Stories', value: String(stories.length).padStart(2, '0'), icon: '📖' },
          { label: 'Characters', value: String(characters.length).padStart(2, '0'), icon: '🎭' },
          { label: 'Hero', value: userProfile?.name || 'Guest', icon: '⭐' }
        ];

        return (
          <div className="max-w-6xl mx-auto py-8 px-4">
            <div className="hero-shell p-10 md:p-16 mb-12">
              <div className="hero-grid" />
              <div className="hero-glow" />
              <div className="hero-orb" />
              <div className="relative z-10">
                <span className="pill mb-5 animate-fade-in">✨ Heartfelt stories, AI-crafted</span>
                <h1 className="text-5xl md:text-6xl font-extrabold mb-4 tracking-tight font-display animate-fade-in-up">
                  HeartTales
                </h1>
                <p className="text-lg md:text-xl text-slate-600 max-w-2xl mb-8 animate-fade-in-up stagger-1">
                  Turn your loved ones into comic heroes and relive memories through rich, illustrated tales.
                </p>
                <div className="flex flex-wrap gap-3 animate-fade-in-up stagger-2">
                  <Button
                    onClick={() => setView('CREATE_STORY')}
                    icon={<Sparkles className="w-5 h-5" />}
                  >
                    Start a New Tale
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setView('CHARACTERS')}
                    icon={<Users className="w-5 h-5" />}
                  >
                    Manage Characters
                  </Button>
                  <Button
                    variant="secondary"
                    onClick={() => setView('CALL_CHARACTER')}
                    icon={<Phone className="w-5 h-5" />}
                  >
                    Call a Character
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-10 animate-fade-in-up stagger-3">
                  {stats.map((stat, idx) => (
                    <div key={idx} className="stat-card">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{stat.icon}</span>
                        <p className="kicker">{stat.label}</p>
                      </div>
                      <p className="text-2xl font-bold text-slate-900 mt-2">{stat.value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mb-8">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-slate-900 flex items-center">
                  <BookOpen className="w-6 h-6 mr-2 text-amber-500" />
                  Your Stories
                </h2>
                {stories.length > 0 && (
                  <Button variant="outline" onClick={() => setView('CREATE_STORY')}>
                    New Story
                  </Button>
                )}
              </div>

              {stories.length === 0 ? (
                <div className="soft-card p-16 text-center border-2 border-dashed border-slate-200 animate-fade-in-up">
                  <div className="w-20 h-20 bg-gradient-to-br from-amber-50 to-rose-50 text-rose-300 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-sm">
                    <BookOpen className="w-10 h-10" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 font-display">No stories yet</h3>
                  <p className="text-slate-500 mt-2 mb-8 max-w-sm mx-auto">Your story library is empty. Create your first magical adventure today!</p>
                  <Button onClick={() => setView('CREATE_STORY')} icon={<Sparkles className="w-4 h-4" />}>Start Writing</Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {stories.map(story => (
                    <div
                      key={story.id}
                      onClick={() => handleOpenStory(story.id)}
                      className="story-card cursor-pointer group"
                    >
                      <div className="h-40 bg-slate-100 relative overflow-hidden">
                        {/* Show first scene image if available, else pattern */}
                        {story.scenes[0]?.imageUrl ? (
                          <img src={story.scenes[0].imageUrl} alt={story.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                        ) : (
                          <div className="w-full h-full bg-gradient-to-br from-amber-50 to-rose-100 flex items-center justify-center">
                            <BookOpen className="w-12 h-12 text-amber-300" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-60"></div>
                        <div className="absolute bottom-3 left-4 text-white font-medium text-xs bg-black/30 px-2 py-1 rounded backdrop-blur-sm">
                          {new Date(story.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                      <div className="p-5">
                        <h3 className="text-xl font-bold text-slate-800 mb-2 line-clamp-1">{story.title}</h3>
                        <p className="text-slate-500 text-sm line-clamp-2 mb-4">{story.synopsis}</p>
                        <div className="flex items-center justify-between">
                          <div className="flex -space-x-2">
                            {/* Display User Avatar + Characters */}
                            <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs text-white font-bold bg-rose-500 z-10">
                              {story.userProfile?.name?.charAt(0) || 'U'}
                            </div>
                            {story.characters.slice(0, 2).map((char, i) => (
                              <div key={i} className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs text-white font-bold ${char.avatarColor}`}>
                                {char.name.charAt(0)}
                              </div>
                            ))}
                          </div>
                          <span className="text-rose-500 text-sm font-medium group-hover:underline">Read Story &rarr;</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        );
      }
    }
  };

  return (
    <div className="min-h-screen">
      <nav className="navbar-glass sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer group" onClick={() => setView('DASHBOARD')}>
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mr-2.5 shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3" style={{ background: 'linear-gradient(135deg, var(--brand-1), var(--brand-2))' }}>
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-900 tracking-tight font-display">HeartTales</span>
            </div>

            <div className="flex items-center space-x-2">
              <div className="hidden md:flex items-center text-sm font-semibold text-slate-600 mr-1 px-3.5 py-1.5 rounded-full border border-slate-200/60 bg-white/60 backdrop-blur-sm">
                <User className="w-4 h-4 mr-2 text-rose-400" />
                {userProfile ? userProfile.name : 'Guest'}
              </div>
              <button
                onClick={() => setView('DASHBOARD')}
                className={`nav-pill text-sm font-semibold ${view === 'DASHBOARD' ? 'nav-pill-active' : 'text-slate-500 hover:text-slate-900'}`}
              >
                Dashboard
              </button>
              <button
                onClick={() => setView('CALL_CHARACTER')}
                className={`nav-pill text-sm font-semibold flex items-center gap-1.5 ${view === 'CALL_CHARACTER' ? 'nav-pill-active' : 'text-slate-500 hover:text-slate-900'}`}
              >
                <Phone className="w-4 h-4" />
                Call Character
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main>
        {renderContent()}
      </main>
    </div>
  );
}