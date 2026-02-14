export interface Character {
  id: string;
  name: string;
  gender: 'Male' | 'Female';
  relation: string; // e.g., 'Mom', 'Best Friend'
  traits: string;
  description: string;
  avatarColor: string;
  voice: string;
}

export interface UserProfile {
  name: string;
  gender: 'Male' | 'Female';
  description: string;
  voice: string;
}

export interface Dialogue {
  speaker: string;
  text: string;
  audioData?: string; // Base64 audio string
}

export interface Scene {
  id: string;
  visual_description: string;
  narration: string;
  dialogue: Dialogue[];
  imageUrl?: string;
  isGeneratingImage?: boolean;
}

export interface Story {
  id: string;
  title: string;
  synopsis: string;
  createdAt: number;
  characters: Character[];
  userProfile: UserProfile; // Store the user context for this story
  scenes: Scene[];
}

export type ViewState = 'DASHBOARD' | 'CHARACTERS' | 'CREATE_STORY' | 'VIEW_STORY';

export const RELATION_OPTIONS = [
  'Friend', 'Mother', 'Father', 'Brother', 'Sister', 'Partner', 'Colleague', 'Pet', 'Other'
];

export const AVATAR_COLORS = [
  'bg-red-500', 'bg-orange-500', 'bg-amber-500', 'bg-green-500', 
  'bg-emerald-500', 'bg-teal-500', 'bg-cyan-500', 'bg-blue-500', 
  'bg-indigo-500', 'bg-violet-500', 'bg-purple-500', 'bg-fuchsia-500', 'bg-pink-500', 'bg-rose-500'
];

export const VOICE_OPTIONS = [
  'Puck', 'Charon', 'Kore', 'Fenrir', 'Zephyr'
];