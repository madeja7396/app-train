import React from 'react';
import { LoadingSpinner } from './icons/LoadingSpinner';
import { ChevronLeftIcon } from './icons/ChevronLeftIcon';

interface TranslationPaneProps {
  translation: string;
  isLoading: boolean;
  onToggle: () => void;
}

const TranslationPane: React.FC<TranslationPaneProps> = ({ translation, isLoading, onToggle }) => {
  return (
    <div className="flex flex-col h-full relative">
      <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">Page Translation (JA)</h2>
      {isLoading ? (
        <div className="flex-grow flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner />
            <p className="mt-2 text-sm text-slate-500">Translating...</p>
          </div>
        </div>
      ) : (
        <div className="prose prose-sm dark:prose-invert max-w-none flex-grow overflow-y-auto whitespace-pre-wrap">
          {translation || "No content to translate on this page, or select text in the viewer to translate a specific part."}
        </div>
      )}
      <button 
        onClick={onToggle} 
        title="Collapse Pane"
        aria-label="Collapse Translation Pane"
        className="absolute top-1/2 -right-3.5 transform -translate-y-1/2 bg-slate-100 dark:bg-slate-800 p-1 rounded-full z-10 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 transition-colors"
      >
        <ChevronLeftIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
      </button>
    </div>
  );
};

export default TranslationPane;
