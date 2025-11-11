import React, { useState, useEffect, useCallback } from 'react';
import type { ParsedFont } from './types';
import FontUploader from './components/FontUploader';
import FontList from './components/FontList';
import FontPreview from './components/FontPreview';
import { FileText, Palette, Search } from 'lucide-react';

// Make opentype.js available globally for TypeScript
declare const opentype: any;

interface AppError {
  message: string;
  type: 'error' | 'warning';
}

const App: React.FC = () => {
  const [fonts, setFonts] = useState<ParsedFont[]>([]);
  const [selectedFont, setSelectedFont] = useState<ParsedFont | null>(null);
  const [comparisonFont, setComparisonFont] = useState<ParsedFont | null>(null);
  const [isCompareMode, setIsCompareMode] = useState(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<AppError | null>(null);
  const [styleSheet, setStyleSheet] = useState<HTMLStyleElement | null>(null);
  const [customText, setCustomText] = useState('Type your own text here to preview the font.');
  const [comparisonCustomText, setComparisonCustomText] = useState('Type your own text here to preview the font.');
  const [searchQuery, setSearchQuery] = useState('');
  const [fontSize, setFontSize] = useState(48);
  const [comparisonFontSize, setComparisonFontSize] = useState(48);

  useEffect(() => {
    const newStyleSheet = document.createElement('style');
    document.head.appendChild(newStyleSheet);
    setStyleSheet(newStyleSheet);

    return () => {
      document.head.removeChild(newStyleSheet);
    };
  }, []);

  const parseFontWeightAndStyle = (subfamily: string): { fontWeight: string | number; fontStyle: string } => {
    const lowerSubfamily = subfamily.toLowerCase();
    let fontWeight: string | number = 'normal';
    let fontStyle = 'normal';

    if (lowerSubfamily.includes('italic')) {
      fontStyle = 'italic';
    }
    if (lowerSubfamily.includes('oblique')) {
      fontStyle = 'oblique';
    }

    if (lowerSubfamily.includes('thin') || lowerSubfamily.includes('hairline')) fontWeight = 100;
    else if (lowerSubfamily.includes('extralight') || lowerSubfamily.includes('ultralight')) fontWeight = 200;
    else if (lowerSubfamily.includes('light')) fontWeight = 300;
    else if (lowerSubfamily.includes('book') || lowerSubfamily.includes('regular') || lowerSubfamily.includes('normal')) fontWeight = 400;
    else if (lowerSubfamily.includes('medium')) fontWeight = 500;
    else if (lowerSubfamily.includes('semibold') || lowerSubfamily.includes('demibold')) fontWeight = 600;
    else if (lowerSubfamily.includes('bold')) fontWeight = 700;
    else if (lowerSubfamily.includes('extrabold') || lowerSubfamily.includes('ultrabold')) fontWeight = 800;
    else if (lowerSubfamily.includes('black') || lowerSubfamily.includes('heavy')) fontWeight = 900;
    
    return { fontWeight, fontStyle };
  };

  const handleFiles = useCallback(async (files: File[]) => {
    setIsLoading(true);
    setError(null);
    setFonts([]);
    setSelectedFont(null);
    setIsCompareMode(false);
    setComparisonFont(null);

    const validFiles = files.filter(file => 
      file.name.toLowerCase().endsWith('.ttf') || file.name.toLowerCase().endsWith('.otf')
    );

    if (validFiles.length === 0) {
      setError({ message: "No valid .ttf or .otf font files found in the selected directory.", type: 'error' });
      setIsLoading(false);
      return;
    }

    const failedFiles: string[] = [];

    const fontPromises = validFiles.map(async (file, index): Promise<ParsedFont | null> => {
      try {
        const arrayBuffer = await file.arrayBuffer();
        const font = opentype.parse(arrayBuffer);
        
        const fontFamilyName = font.names.fontFamily?.en || file.name.replace(/\.(ttf|otf)$/i, '') || `Unnamed Font ${index}`;
        const subfamilyName = font.names.fontSubfamily?.en || 'Regular';
        
        const { fontWeight, fontStyle } = parseFontWeightAndStyle(subfamilyName);

        const id = `${fontFamilyName}-${subfamilyName}-${index}`;
        const uniqueFontFamily = `custom-font-${Date.now()}-${index}`;
        const blob = new Blob([arrayBuffer], { type: 'font/opentype' });
        const blobUrl = URL.createObjectURL(blob);

        return {
          id,
          displayName: `${fontFamilyName} ${subfamilyName}`,
          fontFamily: uniqueFontFamily,
          fontWeight,
          fontStyle,
          blobUrl,
          font,
          fileName: file.name,
        };
      } catch (e) {
        console.error(`Failed to parse font file: ${file.name}`, e);
        failedFiles.push(file.name);
        return null;
      }
    });

    const loadedFonts = (await Promise.all(fontPromises)).filter((f): f is ParsedFont => f !== null);

    if (loadedFonts.length > 0) {
      if (styleSheet) {
          const fontFaceRules = loadedFonts.map(f => `
            @font-face {
              font-family: '${f.fontFamily}';
              src: url('${f.blobUrl}');
              font-weight: ${f.fontWeight};
              font-style: ${f.fontStyle};
            }
          `).join('\n');
          styleSheet.innerHTML = fontFaceRules;
      }
      
      setFonts(loadedFonts);
      setSelectedFont(loadedFonts[0]);

      if (failedFiles.length > 0) {
          setError({
              message: `Loaded ${loadedFonts.length} fonts. Failed to parse: ${failedFiles.join(', ')}. They may be corrupted.`,
              type: 'warning'
          });
      }
    } else if (failedFiles.length > 0) {
       setError({ message: `Could not parse any fonts. The following files may be corrupted: ${failedFiles.join(', ')}`, type: 'error'});
    } else {
       setError({ message: "No valid font files were found in the selected directory.", type: 'warning' });
    }
    
    setIsLoading(false);
  }, [styleSheet]);
  
  const toggleCompareMode = useCallback(() => {
    const nextValue = !isCompareMode;
    setIsCompareMode(nextValue);
    if (nextValue) {
      setComparisonFontSize(fontSize);
      setComparisonCustomText(customText);
      if (!comparisonFont) {
        const differentFont = fonts.find(f => f.id !== selectedFont?.id) || fonts[1] || fonts[0] || null;
        setComparisonFont(differentFont);
      }
    } else {
      setComparisonFont(null);
    }
  }, [isCompareMode, fonts, selectedFont, comparisonFont, fontSize, customText]);

  const handleSelectComparisonFont = useCallback((fontId: string) => {
    const font = fonts.find(f => f.id === fontId);
    if (font) {
      setComparisonFont(font);
    }
  }, [fonts]);

  const filteredFonts = fonts.filter(font =>
    font.displayName.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-slate-900 text-slate-200 font-sans flex flex-col">
      <header className="bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 p-4 sticky top-0 z-10">
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Palette className="w-8 h-8 text-orange-400" />
            <h1 className="text-2xl font-bold text-white tracking-tight">Font Previewer</h1>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto p-4 md:p-6">
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 h-[calc(100vh-150px)] max-h-[800px]">
          <aside className="md:col-span-1 lg:col-span-1 bg-slate-800/80 rounded-lg p-4 flex flex-col h-[calc(100vh-150px)] max-h-[800px]">
            <FontUploader onFilesSelected={handleFiles} isLoading={isLoading} fontCount={fonts.length} />
            
            <div className="relative mt-4">
              <input
                type="text"
                placeholder="Search fonts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-700 border border-slate-600 rounded-md py-2 pl-10 pr-4 focus:ring-2 focus:ring-orange-500 focus:outline-none transition-shadow text-sm text-slate-200 placeholder-slate-400"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            </div>

            {error && (
              <div className={`mt-4 p-3 border rounded-md text-sm ${
                error.type === 'error'
                  ? 'bg-red-500/20 text-red-300 border-red-500/30'
                  : 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30'
              }`}>
                {error.message}
              </div>
            )}
            <div className="mt-4 flex-grow overflow-hidden">
              <FontList 
                fonts={filteredFonts} 
                selectedFontId={selectedFont?.id || null}
                onSelectFont={setSelectedFont}
              />
            </div>
          </aside>

          <section className="md:col-span-2 lg:col-span-3 h-[calc(100vh-150px)] max-h-[800px]">
             {selectedFont ? (
              <div className={`h-full w-full grid ${isCompareMode ? 'grid-cols-1 lg:grid-cols-2 gap-6' : 'grid-cols-1'}`}>
                <div className="h-full bg-slate-800/80 rounded-lg overflow-y-auto p-6">
                  <FontPreview 
                    key={selectedFont.id} 
                    font={selectedFont} 
                    customText={customText}
                    onCustomTextChange={setCustomText}
                    fontSize={fontSize}
                    onFontSizeChange={setFontSize}
                    isCompareMode={isCompareMode}
                    onToggleCompare={toggleCompareMode}
                  />
                </div>
                {isCompareMode && (
                  <div className="h-full bg-slate-800/80 rounded-lg overflow-y-auto p-6">
                     {comparisonFont ? (
                        <FontPreview 
                          key={comparisonFont.id} 
                          font={comparisonFont} 
                          customText={comparisonCustomText}
                          onCustomTextChange={setComparisonCustomText}
                          fontSize={comparisonFontSize}
                          onFontSizeChange={setComparisonFontSize}
                          isComparisonPanel={true}
                          allFonts={fonts}
                          onSelectComparisonFont={handleSelectComparisonFont}
                          onCloseComparePanel={toggleCompareMode}
                        />
                     ) : (
                      <div className="flex items-center justify-center h-full text-slate-500">
                        <p>No other font to compare.</p>
                      </div>
                     )}
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-slate-500 text-center bg-slate-800/80 rounded-lg">
                 {isLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
                    <p className="mt-4 text-lg">Loading fonts...</p>
                  </>
                 ) : (
                  <>
                    <FileText size={64} className="mb-4" />
                    <h2 className="text-2xl font-semibold text-slate-400">Welcome to Font Previewer</h2>
                    <p className="mt-2 max-w-md">Upload a directory of fonts to get started. Your selected font preview will appear here.</p>
                  </>
                 )}
              </div>
            )}
          </section>
        </div>
      </main>
    </div>
  );
};

export default App;
