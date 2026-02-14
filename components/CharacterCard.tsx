import React from 'react';
import { Character } from '../types';
import { Trash2, Edit2, User } from 'lucide-react';

interface CharacterCardProps {
  character: Character;
  onEdit?: (c: Character) => void;
  onDelete?: (id: string) => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: (id: string) => void;
}

export const CharacterCard: React.FC<CharacterCardProps> = ({ 
  character, 
  onEdit, 
  onDelete, 
  selectable, 
  selected, 
  onToggleSelect 
}) => {
  return (
    <div 
      className={`
        relative group rounded-2xl p-5 border-2 transition-all duration-300 bg-white
        ${selectable 
          ? 'cursor-pointer hover:border-rose-300 hover:shadow-lg hover:-translate-y-1' 
          : 'hover:shadow-lg hover:-translate-y-1 border-slate-100'}
        ${selected ? 'border-rose-400 ring-2 ring-rose-100 bg-gradient-to-br from-rose-50 to-white shadow-lg -translate-y-1' : ''}
      `}
      onClick={() => selectable && onToggleSelect && onToggleSelect(character.id)}
    >
      <div className="flex items-start space-x-4">
        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-white font-bold text-xl shadow-md ${character.avatarColor} transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3`}>
          {character.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-slate-800 truncate">{character.name}</h3>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1">{character.relation}</p>
          <p className="text-sm text-slate-600 line-clamp-2">{character.description}</p>
          
          <div className="mt-3 flex flex-wrap gap-1.5">
            {character.traits.split(',').map((trait, i) => (
              <span key={i} className="inline-block px-2.5 py-0.5 rounded-full bg-slate-50 text-slate-600 text-xs font-medium border border-slate-100">
                {trait.trim()}
              </span>
            ))}
          </div>
        </div>
      </div>

      {!selectable && (
        <div className="absolute top-4 right-4 flex space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button 
              onClick={(e) => { e.stopPropagation(); onEdit(character); }}
              className="p-1.5 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-md"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {onDelete && (
            <button 
              onClick={(e) => { e.stopPropagation(); onDelete(character.id); }}
              className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-md"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      )}
      
      {selectable && selected && (
        <div className="absolute top-4 right-4 animate-fade-in">
           <div className="w-7 h-7 bg-gradient-to-br from-rose-400 to-rose-600 rounded-full flex items-center justify-center shadow-md">
             <User className="w-4 h-4 text-white" />
           </div>
        </div>
      )}
    </div>
  );
};