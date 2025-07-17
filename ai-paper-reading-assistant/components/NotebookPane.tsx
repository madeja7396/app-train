import React from 'react';
import type { Term } from '../types';
import { LoadingSpinner } from './icons/LoadingSpinner';
import { ChevronRightIcon } from './icons/ChevronRightIcon';

interface NotebookPaneProps {
  terms: Term[];
  onExtractTerms: () => void;
  onExplainTerm: (term: Term) => void;
  onJumpTo: (page: number, rect: DOMRectReadOnly) => void;
  isLoading: { terms: boolean, explanation: boolean, translation: boolean };
  onToggle: () => void;
}

const NotebookPane: React.FC<NotebookPaneProps> = ({ terms, onExtractTerms, onExplainTerm, onJumpTo, isLoading, onToggle }) => {

  return (
    <div className="flex flex-col h-full relative">
      <h2 className="text-lg font-semibold mb-4 pb-2 border-b border-slate-200 dark:border-slate-700">Smart Notebook</h2>
      
      <div className="flex-grow overflow-y-auto pr-2">
        <div>
          <button
            onClick={onExtractTerms}
            disabled={isLoading.terms}
            className="w-full bg-primary-50 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 px-4 py-2 rounded-md hover:bg-primary-100 dark:hover:bg-primary-900 transition-colors text-sm font-medium mb-4 flex items-center justify-center gap-2"
          >
            {isLoading.terms ? <LoadingSpinner /> : 'Extract Key Terms from Document'}
          </button>
          {isLoading.explanation && <div className="text-center text-sm py-2 text-slate-500">Generating explanation...</div>}
          <ul className="space-y-3">
            {terms.length === 0 && <p className="text-sm text-slate-500">No terms explained yet. Select text and click 'Explain' or extract terms from the document.</p>}
            {terms.map(term => (
              <li key={term.id} className="bg-slate-100 dark:bg-slate-800 p-3 rounded-lg text-sm cursor-pointer hover:ring-2 hover:ring-primary-400" onClick={() => term.page !== -1 ? onJumpTo(term.page, term.rect) : onExplainTerm(term)}>
                <p className="font-semibold text-slate-800 dark:text-slate-100">{term.text}</p>
                <p className="text-slate-600 dark:text-slate-400 mt-1 whitespace-pre-wrap">{term.explanation}</p>
                 {term.page !== -1 && <span className="text-xs text-primary-500 mt-1 block">p. {term.page}</span>}
              </li>
            ))}
          </ul>
        </div>
      </div>
      <button 
        onClick={onToggle} 
        title="Collapse Pane"
        aria-label="Collapse Notebook Pane"
        className="absolute top-1/2 -left-3.5 transform -translate-y-1/2 bg-slate-100 dark:bg-slate-800 p-1 rounded-full z-10 hover:bg-slate-200 dark:hover:bg-slate-700 border border-slate-300 dark:border-slate-600 transition-colors"
      >
        <ChevronRightIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
      </button>
    </div>
  );
};

export default NotebookPane;