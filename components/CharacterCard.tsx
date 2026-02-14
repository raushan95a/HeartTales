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
        relative group rounded-xl p-4 border-2 transition-all duration-200 bg-white
        ${selectable 
          ? 'cursor-pointer hover:border-indigo-300' 
          : 'hover:shadow-md border-slate-100'}
        ${selected ? 'border-indigo-600 ring-2 ring-indigo-100 bg-indigo-50' : ''}
      `}
      onClick={() => selectable && onToggleSelect && onToggleSelect(character.id)}
    >
      <div className="flex items-start space-x-4">
        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg shadow-inner ${character.avatarColor}`}>
          {character.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-slate-800 truncate">{character.name}</h3>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{character.relation}</p>
          <p className="text-sm text-slate-600 line-clamp-2">{character.description}</p>
          
          <div className="mt-2 flex flex-wrap gap-1">
            {character.traits.split(',').map((trait, i) => (
              <span key={i} className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-xs border border-slate-200">
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
              className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-md"
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
        <div className="absolute top-4 right-4">
           <div className="w-6 h-6 bg-indigo-600 rounded-full flex items-center justify-center">
             <User className="w-4 h-4 text-white" />
           </div>
        </div>
      )}
    </div>
  );
};