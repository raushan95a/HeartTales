import React, { useState } from 'react';
import { Character, AVATAR_COLORS, RELATION_OPTIONS, VOICE_OPTIONS } from '../types';
import { CharacterCard } from './CharacterCard';
import { Button } from './Button';
import { Plus, X, Save, User, Mic } from 'lucide-react';
import { Dropdown } from './Dropdown';

interface CharacterManagerProps {
  characters: Character[];
  setCharacters: React.Dispatch<React.SetStateAction<Character[]>>;
}

export const CharacterManager: React.FC<CharacterManagerProps> = ({ characters, setCharacters }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  // Form State
  const [formData, setFormData] = useState<Partial<Character>>({
    name: '',
    gender: 'Female',
    relation: 'Friend',
    traits: '',
    description: '',
    avatarColor: AVATAR_COLORS[0],
    voice: 'Puck'
  });

  const resetForm = () => {
    setFormData({
      name: '',
      gender: 'Female',
      relation: 'Friend',
      traits: '',
      description: '',
      avatarColor: AVATAR_COLORS[Math.floor(Math.random() * AVATAR_COLORS.length)],
      voice: 'Puck'
    });
    setEditingId(null);
    setIsAdding(false);
  };

  const handleEdit = (char: Character) => {
    setFormData({
        ...char,
        gender: char.gender || 'Female' // Handle legacy data
    });
    setEditingId(char.id);
    setIsAdding(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm("Are you sure you want to delete this character?")) {
      setCharacters(prev => prev.filter(c => c.id !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.description) return;

    if (editingId) {
      setCharacters(prev => prev.map(c => c.id === editingId ? { ...c, ...formData } as Character : c));
    } else {
      // Use crypto.randomUUID if available, otherwise fallback to Date-based ID to prevent crashes
      const uniqueId = typeof crypto !== 'undefined' && crypto.randomUUID 
        ? crypto.randomUUID() 
        : `char-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const newChar: Character = {
        id: uniqueId,
        ...formData as Omit<Character, 'id'>
      };
      setCharacters(prev => [...prev, newChar]);
    }
    resetForm();
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 font-display">Your Characters</h2>
          <p className="text-slate-500 mt-1">Manage the cast for your stories.</p>
        </div>
        {!isAdding && (
          <Button onClick={() => setIsAdding(true)} icon={<Plus className="w-5 h-5" />}>
            Add Character
          </Button>
        )}
      </div>

      {isAdding && (
        <div className="soft-card p-6 mb-8 animate-fade-in">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-slate-800">{editingId ? 'Edit Character' : 'New Character'}</h3>
            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
              <X className="w-6 h-6" />
            </button>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Name</label>
                <input
                  type="text"
                  required
                  className="input-shell"
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="e.g. Grandma Rose"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Relation</label>
                    <Dropdown
                      value={formData.relation || 'Friend'}
                      options={RELATION_OPTIONS}
                      onChange={v => setFormData({ ...formData, relation: v })}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Gender</label>
                    <Dropdown
                      value={formData.gender || 'Female'}
                      options={['Female', 'Male']}
                      onChange={v => setFormData({ ...formData, gender: v as 'Male' | 'Female' })}
                    />
                  </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Traits (comma separated)</label>
                <input
                    type="text"
                  className="input-shell"
                    value={formData.traits}
                    onChange={e => setFormData({ ...formData, traits: e.target.value })}
                    placeholder="e.g. Funny, Brave, Loves cats"
                />
                </div>
                <div>
                    <label className="block text-sm font-medium text-slate-700 mb-2">Voice</label>
                    <Dropdown
                      value={formData.voice || 'Puck'}
                      options={VOICE_OPTIONS}
                      onChange={v => setFormData({ ...formData, voice: v })}
                      icon={<Mic className="w-4 h-4" />}
                    />
                </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Description / Background</label>
              <textarea
                required
                rows={3}
                className="textarea-shell resize-none"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                placeholder="Briefly describe their appearance and personality..."
              />
            </div>

            <div>
               <label className="block text-sm font-medium text-slate-700 mb-3">Avatar Color</label>
               <div className="flex flex-wrap gap-2">
                 {AVATAR_COLORS.map(color => (
                   <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({...formData, avatarColor: color})}
                    className={`w-8 h-8 rounded-full ${color} transition-transform hover:scale-110 ${formData.avatarColor === color ? 'ring-2 ring-offset-2 ring-slate-800 scale-110' : ''}`}
                   />
                 ))}
               </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-slate-100">
              <Button type="button" variant="outline" className="mr-3" onClick={resetForm}>Cancel</Button>
              <Button type="submit" icon={<Save className="w-4 h-4"/>}>Save Character</Button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {characters.length === 0 ? (
          <div className="col-span-full text-center py-12 soft-card border-2 border-dashed border-slate-200">
            <div className="w-16 h-16 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <User className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-medium text-slate-900">No characters yet</h3>
            <p className="text-slate-500 mt-1">Add friends or family members to start generating stories.</p>
          </div>
        ) : (
          characters.map(char => (
            <CharacterCard 
              key={char.id} 
              character={char} 
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </div>
    </div>
  );
};