import React, { useEffect, useRef } from 'react';
import type { ParsedFont } from '../types';

interface FontListProps {
  fonts: ParsedFont[];
  selectedFontId: string | null;
  onSelectFont: (font: ParsedFont) => void;
}

const FontList: React.FC<FontListProps> = ({ fonts, selectedFontId, onSelectFont }) => {
  const listRef = useRef<HTMLDivElement>(null);
  const selectedItemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (selectedItemRef.current) {
      selectedItemRef.current.scrollIntoView({
        block: 'nearest',
        behavior: 'smooth'
      });
    }
  }, [selectedFontId]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!fonts.length) return;

      const currentIndex = fonts.findIndex(f => f.id === selectedFontId);

      if (event.key === 'ArrowDown') {
        event.preventDefault();
        const nextIndex = (currentIndex + 1) % fonts.length;
        onSelectFont(fonts[nextIndex]);
      } else if (event.key === 'ArrowUp') {
        event.preventDefault();
        const prevIndex = (currentIndex - 1 + fonts.length) % fonts.length;
        onSelectFont(fonts[prevIndex]);
      }
    };

    const listElement = listRef.current;
    listElement?.addEventListener('keydown', handleKeyDown);

    return () => {
      listElement?.removeEventListener('keydown', handleKeyDown);
    };
  }, [fonts, selectedFontId, onSelectFont]);

  if (fonts.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-slate-500">
        <p>No fonts loaded.</p>
      </div>
    );
  }

  return (
    <div
      ref={listRef}
      tabIndex={0}
      className="h-full overflow-y-auto pr-2 -mr-2 space-y-1 focus:outline-none focus:ring-2 focus:ring-orange-500/50 rounded-md"
    >
      {fonts.map(font => {
        const isSelected = font.id === selectedFontId;
        return (
          <div
            key={font.id}
            ref={isSelected ? selectedItemRef : null}
            onClick={() => onSelectFont(font)}
            className={`p-3 rounded-md cursor-pointer transition-all duration-150 text-sm truncate ${
              isSelected
                ? 'bg-orange-600 text-white font-semibold ring-2 ring-orange-400'
                : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
            }`}
            style={{
              fontFamily: `'${font.fontFamily}'`,
              fontWeight: font.fontWeight,
              fontStyle: font.fontStyle
            }}
          >
            {font.displayName}
          </div>
        );
      })}
    </div>
  );
};

export default FontList;
