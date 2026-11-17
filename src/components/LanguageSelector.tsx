import React, { useState, useRef, useEffect } from 'react';
import { Globe, ChevronDown, Check } from 'lucide-react';
import { SupportedLanguage } from '../types/nerv';
import { playKeySound } from '../utils/audio';

interface LanguageSelectorProps {
  currentLanguage: SupportedLanguage;
  onSelectLanguage: (lang: SupportedLanguage) => void;
  title?: string;
}

const LANGUAGES: { id: SupportedLanguage; label: string; full: string; code: string }[] = [
  { id: 'PT-BR', label: 'PT-BR', full: 'Português (Brasil)', code: 'BR' },
  { id: 'ENG', label: 'ENG', full: 'English (US)', code: 'EN' },
  { id: 'JPN', label: 'JPN', full: '日本語 (Japanese)', code: 'JA' },
  { id: 'CHI', label: 'CHI', full: '中文 (Chinese)', code: 'ZH' },
];

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  currentLanguage,
  onSelectLanguage,
  title = 'Selecionar Idioma',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (lang: SupportedLanguage) => {
    playKeySound();
    onSelectLanguage(lang);
    setIsOpen(false);
  };

  return (
    <div ref={dropdownRef} className="relative select-none font-mono">
      <button
        type="button"
        onClick={() => {
          playKeySound();
          setIsOpen((prev) => !prev);
        }}
        className={`h-[44px] px-2.5 sm:px-3 border-2 flex items-center justify-center gap-1.5 font-mono text-xs cursor-pointer transition-all select-none shadow-[0_0_8px_rgba(255,122,0,0.15)] ${
          isOpen
            ? 'border-[#ff7a00] bg-[#1a0f07] text-[#ff7a00]'
            : 'border-[#4a3520] bg-[#140e08] text-[#ffca8a] hover:border-[#ff7a00] hover:text-[#ff7a00]'
        }`}
        title={title}
        aria-expanded={isOpen}
      >
        <Globe className="w-4 h-4 text-[#ff7a00] shrink-0" />
        <span className="font-bold tracking-wider text-[11px] sm:text-xs">{currentLanguage}</span>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#8a6845] transition-transform ${isOpen ? 'rotate-180 text-[#ff7a00]' : ''}`}
        />
      </button>

      {/* Tactical Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-44 bg-[#090704] border-2 border-[#ff7a00] shadow-[0_4px_20px_rgba(0,0,0,0.85)] z-50 py-1 font-mono text-xs">
          <div className="px-2.5 py-1 text-[9px] text-[#7a5a3a] border-b border-[#2d1b0f] uppercase tracking-wider font-bold">
            NERV LANG SELECT
          </div>

          {LANGUAGES.map((item) => {
            const isSelected = item.id === currentLanguage;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(item.id)}
                className={`w-full px-2.5 py-1.5 text-left flex items-center justify-between gap-2 transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#1e1107] text-[#ff7a00] font-bold'
                    : 'text-[#ffca8a] hover:bg-[#150d06] hover:text-[#ff7a00]'
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="text-[10px] px-1 py-0.2 border border-[#4a3520] bg-[#0c0805] text-[#8a6845]">
                    {item.code}
                  </span>
                  <span>{item.full}</span>
                </div>
                {isSelected && <Check className="w-3.5 h-3.5 text-[#4dff9a]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
};
