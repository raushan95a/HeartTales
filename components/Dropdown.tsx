import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, Check } from 'lucide-react';

interface DropdownProps {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  icon?: React.ReactNode;
  placeholder?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({ value, options, onChange, icon, placeholder }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="dropdown-wrapper">
      <button
        type="button"
        className={`dropdown-trigger ${open ? 'dropdown-trigger-open' : ''}`}
        onClick={() => setOpen(o => !o)}
      >
        {icon && <span className="dropdown-icon">{icon}</span>}
        <span className="dropdown-value">{value || placeholder || 'Select…'}</span>
        <ChevronDown className={`dropdown-chevron ${open ? 'dropdown-chevron-open' : ''}`} />
      </button>

      {open && (
        <div className="dropdown-menu">
          {options.map(opt => (
            <button
              key={opt}
              type="button"
              className={`dropdown-item ${opt === value ? 'dropdown-item-active' : ''}`}
              onClick={() => { onChange(opt); setOpen(false); }}
            >
              <span>{opt}</span>
              {opt === value && <Check className="w-4 h-4 text-rose-500" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
