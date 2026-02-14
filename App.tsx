import React, { useState, useEffect } from 'react';
import { Character, Story, ViewState, UserProfile } from './types';
import { CharacterManager } from './components/CharacterManager';
import { StoryCreator } from './components/StoryCreator';
import { StoryViewer } from './components/StoryViewer';
import { Button } from './components/Button';
import { BookOpen, Users, Plus, User } from 'lucide-react';

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
      case 'DASHBOARD':
      default:
        return (
          <div className="max-w-6xl mx-auto py-8 px-4">
             <div className="text-center py-16 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-3xl shadow-xl text-white mb-12">
                <h1 className="text-5xl font-extrabold mb-4 tracking-tight">StoryVerse AI</h1>
                <p className="text-xl text-indigo-100 max-w-2xl mx-auto mb-8">
                  Turn your friends and family into comic book heroes. Create personalized stories with AI magic.
                </p>
                <div className="flex justify-center gap-4">
                  <Button 
                    onClick={() => setView('CREATE_STORY')} 
                    className="bg-white text-indigo-600 hover:bg-indigo-50 shadow-lg border-none"
                    icon={<Plus className="w-5 h-5" />}
                  >
                    Create New Story
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setView('CHARACTERS')}
                    className="border-indigo-400 text-white hover:bg-indigo-500 hover:text-white"
                    icon={<Users className="w-5 h-5" />}
                  >
                    Manage Characters
                  </Button>
                </div>
             </div>

             <div className="mb-8">
               <h2 className="text-2xl font-bold text-slate-800 mb-6 flex items-center">
                 <BookOpen className="w-6 h-6 mr-2 text-indigo-600" />
                 Your Stories
               </h2>
               
               {stories.length === 0 ? (
                 <div className="bg-white rounded-xl p-12 text-center border-2 border-dashed border-slate-200">
                   <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-4">
                     <BookOpen className="w-8 h-8" />
                   </div>
                   <h3 className="text-lg font-medium text-slate-900">No stories yet</h3>
                   <p className="text-slate-500 mt-1 mb-6">Create your first magical adventure today!</p>
                   <Button onClick={() => setView('CREATE_STORY')}>Start Writing</Button>
                 </div>
               ) : (
                 <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                   {stories.map(story => (
                     <div 
                       key={story.id} 
                       onClick={() => { setActiveStoryId(story.id); setView('VIEW_STORY'); }}
                       className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow border border-slate-100 overflow-hidden cursor-pointer group"
                     >
                       <div className="h-40 bg-slate-100 relative overflow-hidden">
                         {/* Show first scene image if available, else pattern */}
                         {story.scenes[0]?.imageUrl ? (
                           <img src={story.scenes[0].imageUrl} alt={story.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                         ) : (
                           <div className="w-full h-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center">
                              <BookOpen className="w-12 h-12 text-indigo-200" />
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
                              <div className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs text-white font-bold bg-indigo-600 z-10">
                                {story.userProfile?.name.charAt(0) || 'U'}
                              </div>
                              {story.characters.slice(0, 2).map((char, i) => (
                                <div key={i} className={`w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-xs text-white font-bold ${char.avatarColor}`}>
                                  {char.name.charAt(0)}
                                </div>
                              ))}
                            </div>
                            <span className="text-indigo-600 text-sm font-medium group-hover:underline">Read Story &rarr;</span>
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
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <nav className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center cursor-pointer" onClick={() => setView('DASHBOARD')}>
              <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center mr-2">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-xl text-slate-900 tracking-tight">StoryVerse AI</span>
            </div>
            
            <div className="flex items-center space-x-4">
                <div className="hidden md:flex items-center text-sm font-medium text-slate-600 mr-2 bg-slate-100 px-3 py-1 rounded-full">
                    <User className="w-4 h-4 mr-2" />
                    {userProfile ? userProfile.name : 'Guest'}
                </div>
              <button 
                onClick={() => setView('DASHBOARD')}
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${view === 'DASHBOARD' ? 'text-indigo-600 bg-indigo-50' : 'text-slate-600 hover:text-slate-900'}`}
              >
                Dashboard
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