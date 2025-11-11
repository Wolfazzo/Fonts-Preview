import React, { useState } from 'react';
import type { ParsedFont } from '../types';
import { Download, X, Search } from 'lucide-react';

interface FontPreviewProps {
  font: ParsedFont;
  customText: string;
  onCustomTextChange: (text: string) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  isCompareMode?: boolean;
  onToggleCompare?: () => void;
  isComparisonPanel?: boolean;
  allFonts?: ParsedFont[];
  onSelectComparisonFont?: (fontId: string) => void;
  onCloseComparePanel?: () => void;
}

const FontPreview: React.FC<FontPreviewProps> = ({ 
  font, 
  customText, 
  onCustomTextChange,
  fontSize,
  onFontSizeChange,
  isCompareMode,
  onToggleCompare,
  isComparisonPanel,
  allFonts = [],
  onSelectComparisonFont,
  onCloseComparePanel
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchListVisible, setIsSearchListVisible] = useState(false);

  const previewStyle = {
    fontFamily: `'${font.fontFamily}'`,
    fontWeight: font.fontWeight,
    fontStyle: font.fontStyle,
    fontSize: `${fontSize}px`
  };
  
  const fontDetails = [
    { label: 'Family', value: font.font.names.fontFamily?.en ?? 'N/A' },
    { label: 'Style', value: font.font.names.fontSubfamily?.en ?? 'N/A' },
    { label: 'Version', value: font.font.names.version?.en ?? 'N/A' },
    { label: 'Glyphs', value: font.font.numGlyphs ?? 'N/A' },
  ];

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = font.blobUrl;
    link.download = font.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };
  
  const filteredComparisonFonts = allFonts.filter(f => 
    f.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const uniqueFontSizeId = `font-size-${font.id}`;

  return (
    <div className="space-y-6 flex flex-col h-full">
      <div>
        <div className="flex items-center justify-between flex-wrap gap-4">
          <h2 className="text-3xl font-bold text-orange-400 truncate max-w-[calc(100%-200px)]" title={font.displayName}>{font.displayName}</h2>
          
          <div className="flex items-center gap-2 flex-shrink-0">
            {!isComparisonPanel && (
              <button
                onClick={onToggleCompare}
                className="bg-slate-700 text-slate-200 font-bold py-2 px-4 rounded-md hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-orange-500"
              >
                {isCompareMode ? 'Close Compare' : 'Compare'}
              </button>
            )}
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 bg-orange-600 text-white font-bold py-2 px-3 rounded-md hover:bg-orange-700 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-orange-500"
              aria-label={`Download font ${font.displayName}`}
            >
              <Download size={18} />
            </button>
             {isComparisonPanel && (
              <button
                onClick={onCloseComparePanel}
                className="p-2 bg-slate-700 text-slate-200 rounded-md hover:bg-slate-600 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-slate-800 focus:ring-orange-500"
                aria-label="Close comparison panel"
              >
                <X size={18} />
              </button>
            )}
          </div>
        </div>

        {isComparisonPanel ? (
          <div className="mt-4">
            <div className="relative">
              <input
                type="text"
                placeholder="Search fonts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setIsSearchListVisible(true)}
                onBlur={() => setTimeout(() => setIsSearchListVisible(false), 200)}
                className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 pl-10 pr-4 focus:ring-2 focus:ring-orange-500 focus:outline-none transition-shadow text-sm text-slate-200 placeholder-slate-400"
                aria-label="Search comparison fonts"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
              
              {isSearchListVisible && searchQuery.length > 0 && (
                <div className="absolute top-full mt-2 w-full z-10 bg-slate-800 border border-slate-600 rounded-md shadow-lg max-h-48 overflow-y-auto p-1">
                  <div className="space-y-1">
                    {filteredComparisonFonts.length > 0 ? filteredComparisonFonts.map(f => {
                      const isSelected = f.id === font.id;
                      return (
                        <div
                          key={f.id}
                          onClick={() => {
                            if (onSelectComparisonFont) {
                              onSelectComparisonFont(f.id);
                            }
                            setSearchQuery(''); // Clears input and hides list
                          }}
                          className={`p-3 rounded-md cursor-pointer transition-all duration-150 text-sm truncate ${
                            isSelected
                              ? 'bg-orange-600 text-white font-semibold ring-2 ring-orange-400'
                              : 'text-slate-300 hover:bg-slate-700/50 hover:text-white'
                          }`}
                          style={{
                            fontFamily: `'${f.fontFamily}'`,
                            fontWeight: f.fontWeight,
                            fontStyle: f.fontStyle
                          }}
                        >
                          {f.displayName}
                        </div>
                      );
                    }) : (
                      <div className="p-3 text-sm text-slate-500">
                        <p>No fonts found.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400 mt-2">
            {fontDetails.map(detail => (
              <div key={detail.label}>
                <span className="font-semibold text-slate-300">{detail.label}: </span>
                <span>{detail.value}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-4">
        <label htmlFor={uniqueFontSizeId} className="text-sm font-medium text-slate-300">Font Size:</label>
        <input 
            type="range" 
            id={uniqueFontSizeId}
            min="12" 
            max="128" 
            value={fontSize}
            onChange={(e) => onFontSizeChange(Number(e.target.value))}
            className="w-48 h-2 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-orange-500"
        />
        <span className="text-lg font-mono w-16 text-center bg-slate-700/50 rounded-md py-1">{fontSize}px</span>
      </div>

      <div>
        <label htmlFor={`custom-text-input-${font.id}`} className="text-sm text-slate-400 mb-2 block">
          Type your own text here to preview the font.
        </label>
        <textarea
          id={`custom-text-input-${font.id}`}
          value={customText}
          onChange={(e) => onCustomTextChange(e.target.value)}
          className="w-full p-3 bg-slate-700 border border-slate-600 rounded-md focus:ring-2 focus:ring-orange-500 focus:outline-none transition-shadow text-lg"
          rows={3}
        />
      </div>

       <div 
        className="p-4 bg-slate-900/50 rounded-lg leading-snug break-words flex-grow whitespace-pre-wrap normal-case"
        style={previewStyle}
      >
        {customText || "Start typing..."}
      </div>
    </div>
  );
};

export default FontPreview;