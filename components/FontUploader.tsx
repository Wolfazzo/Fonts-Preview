import React, { useRef } from 'react';
import { UploadCloud, Loader } from 'lucide-react';

interface FontUploaderProps {
  onFilesSelected: (files: File[]) => void;
  isLoading: boolean;
  fontCount: number;
}

const FontUploader: React.FC<FontUploaderProps> = ({ onFilesSelected, isLoading, fontCount }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      onFilesSelected(Array.from(event.target.files));
    }
  };

  const handleButtonClick = async () => {
    if (isLoading) return;

    if ('showDirectoryPicker' in window) {
      try {
        const directoryHandle = await (window as any).showDirectoryPicker();
        const files: File[] = [];
        for await (const entry of directoryHandle.values()) {
          if (entry.kind === 'file') {
            const file = await entry.getFile();
            if (file.name.toLowerCase().endsWith('.ttf') || file.name.toLowerCase().endsWith('.otf')) {
              files.push(file);
            }
          }
        }
        onFilesSelected(files);
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error('Error selecting directory:', err);
          // Fallback to file input if there's an error (e.g., security)
          fileInputRef.current?.click();
        }
      }
    } else {
      // Fallback for browsers that don't support showDirectoryPicker
      fileInputRef.current?.click();
    }
  };

  return (
    <div>
      <button
        type="button"
        onClick={handleButtonClick}
        disabled={isLoading}
        className="w-full cursor-pointer bg-orange-600 text-white font-bold py-3 px-4 rounded-md inline-flex items-center justify-center hover:bg-orange-700 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-800 focus-visible:ring-orange-500 disabled:bg-orange-800 disabled:cursor-not-allowed"
      >
        {isLoading ? (
          <>
            <Loader className="animate-spin mr-2" size={20} />
            <span>Loading...</span>
          </>
        ) : (
          <>
            <UploadCloud className="mr-2" size={20} />
            <span>Upload Font Directory</span>
          </>
        )}
      </button>
      <input
        ref={fileInputRef}
        id="font-upload"
        type="file"
        // @ts-ignore
        webkitdirectory="true"
        directory="true"
        multiple
        onChange={handleFileChange}
        className="hidden"
        disabled={isLoading}
        accept=".ttf,.otf"
      />
      {fontCount > 0 && !isLoading && (
        <p className="text-sm text-slate-400 mt-2 text-center">
          {fontCount} font{fontCount !== 1 ? 's' : ''} loaded.
        </p>
      )}
    </div>
  );
};

export default FontUploader;
