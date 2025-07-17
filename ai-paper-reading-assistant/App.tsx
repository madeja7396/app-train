
import React, { useState, useCallback, useEffect, useRef } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import WelcomeScreen from './components/WelcomeScreen';
import PdfViewer from './components/PdfViewer';
import TranslationPane from './components/TranslationPane';
import NotebookPane from './components/NotebookPane';
import ActionPopup from './components/ActionPopup';
import { LoadingSpinner } from './components/icons/LoadingSpinner';
import { ChevronLeftIcon } from './components/icons/ChevronLeftIcon';
import { ChevronRightIcon } from './components/icons/ChevronRightIcon';
import type { Term, Selection } from './types';
import { extractTextFromPdf, renderPdfPage } from './services/pdfService';
import { translateText, explainTerm, extractTerms } from './services/geminiService';

export default function App() {
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [pdfText, setPdfText] = useState<string>('');
  const [isProcessingPdf, setIsProcessingPdf] = useState(false);

  const [currentTranslation, setCurrentTranslation] = useState('');
  const [explainedTerms, setExplainedTerms] = useState<Term[]>([]);

  const [selection, setSelection] = useState<Selection | null>(null);
  const [jumpToLocation, setJumpToLocation] = useState<{ page: number, rect: DOMRectReadOnly | null } | null>(null);

  const [isLoading, setIsLoading] = useState({
    translation: false,
    explanation: false,
    terms: false,
  });
  
  const [isLeftPaneVisible, setIsLeftPaneVisible] = useState(true);
  const [isRightPaneVisible, setIsRightPaneVisible] = useState(true);

  const pdfViewerRef = useRef<HTMLDivElement>(null);

  const resetState = () => {
    setPdfFile(null);
    setPdfDocument(null);
    setTotalPages(0);
    setCurrentPage(1);
    setPdfText('');
    setCurrentTranslation('');
    setExplainedTerms([]);
    setSelection(null);
    setIsLoading({ translation: false, explanation: false, terms: false });
    setIsLeftPaneVisible(true);
    setIsRightPaneVisible(true);
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/pdf') {
      resetState();
      setPdfFile(file);
      setIsProcessingPdf(true);
      try {
        const { pdf, text, numPages } = await extractTextFromPdf(file);
        setPdfDocument(pdf);
        setPdfText(text);
        setTotalPages(numPages);
        setCurrentPage(1);
      } catch (error) {
        console.error("Error processing PDF:", error);
        alert("Failed to process PDF file.");
        resetState();
      } finally {
        setIsProcessingPdf(false);
      }
    } else {
      alert("Please upload a valid PDF file.");
    }
  };

  const translateCurrentPage = useCallback(async (pageNumber: number, doc: PDFDocumentProxy) => {
    setIsLoading(prev => ({ ...prev, translation: true }));
    setCurrentTranslation('');
    try {
      const page = await doc.getPage(pageNumber);
      const textContent = await page.getTextContent();
      const pageText = textContent.items.map(item => 'str' in item ? item.str : '').join(' ');
      
      if (pageText.trim()) {
        const translation = await translateText(pageText, pdfText);
        setCurrentTranslation(translation);
      }
    } catch (error) {
      console.error("Translation failed:", error);
      setCurrentTranslation("Failed to translate page.");
    } finally {
      setIsLoading(prev => ({ ...prev, translation: false }));
    }
  }, [pdfText]);

  useEffect(() => {
    if (pdfDocument && currentPage > 0) {
      translateCurrentPage(currentPage, pdfDocument);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, pdfDocument]);
  
  const handleSelectionChange = (newSelection: Selection | null) => {
    setSelection(newSelection);
  };

  const handleAction = async (action: 'translate' | 'explain') => {
    if (!selection) return;

    if (action === 'translate') {
      setIsLoading(prev => ({ ...prev, translation: true }));
      try {
        if (!isLeftPaneVisible) setIsLeftPaneVisible(true);
        const translation = await translateText(selection.text, pdfText);
        setCurrentTranslation(prev => `${prev}\n\n--- Selection ---\n${selection.text}\n\n--- Translation ---\n${translation}`);
      } catch (error) {
        console.error("Selection translation failed:", error);
      } finally {
        setIsLoading(prev => ({ ...prev, translation: false }));
      }
    } else if (action === 'explain') {
      setIsLoading(prev => ({ ...prev, explanation: true }));
      try {
        if (!isRightPaneVisible) setIsRightPaneVisible(true);
        const explanation = await explainTerm(selection.text, pdfText);
        const newTerm: Term = {
          id: Date.now().toString(),
          text: selection.text,
          explanation,
          page: currentPage,
          rect: selection.rect
        };
        setExplainedTerms(prev => [newTerm, ...prev]);
      } catch (error) {
        console.error("Explanation failed:", error);
      } finally {
        setIsLoading(prev => ({ ...prev, explanation: false }));
      }
    }
    setSelection(null);
  };
  
  const handleExtractTerms = async () => {
    if (!pdfText) return;
    setIsLoading(prev => ({ ...prev, terms: true }));
    if (!isRightPaneVisible) setIsRightPaneVisible(true);
    try {
      const terms = await extractTerms(pdfText);
      const newTerms: Term[] = terms.map(term => ({
        id: `term-${Math.random()}`,
        text: term,
        explanation: 'Click to generate explanation.',
        page: -1, // Indicates it's from the whole document
        rect: { x: 0, y: 0, width: 0, height: 0, top: 0, right: 0, bottom: 0, left: 0, toJSON: () => ({}) },
      }));
      const existingTerms = new Set(explainedTerms.map(t => t.text.toLowerCase()));
      const filteredNewTerms = newTerms.filter(t => !existingTerms.has(t.text.toLowerCase()));
      setExplainedTerms(prev => [...filteredNewTerms, ...prev]);
    } catch (error) {
      console.error("Failed to extract terms:", error);
    } finally {
      setIsLoading(prev => ({ ...prev, terms: false }));
    }
  };

  const handleExplainExtractedTerm = async (term: Term) => {
    if (term.explanation !== 'Click to generate explanation.') return;
    if (!isRightPaneVisible) setIsRightPaneVisible(true);
    setIsLoading(prev => ({ ...prev, explanation: true }));
    try {
      const explanation = await explainTerm(term.text, pdfText);
      setExplainedTerms(prevTerms => prevTerms.map(t => t.id === term.id ? { ...t, explanation } : t));
    } catch (error) {
      console.error("Explanation failed:", error);
    } finally {
      setIsLoading(prev => ({ ...prev, explanation: false }));
    }
  };
  
  const handleJumpTo = (page: number, rect: DOMRectReadOnly) => {
    if(page !== -1) {
      setCurrentPage(page);
      setJumpToLocation({ page, rect });
      // Reset after a short delay to allow re-triggering
      setTimeout(() => setJumpToLocation(null), 1000);
    }
  };

  return (
    <div className="min-h-screen text-slate-800 dark:text-slate-200 bg-slate-50 dark:bg-slate-900 font-sans">
      <header className="fixed top-0 left-0 right-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 h-16 flex items-center justify-between px-6 z-30 shadow-sm">
        <h1 className="text-xl font-bold text-primary-600 dark:text-primary-400">AI Paper Reading Assistant</h1>
        <div>
          <label htmlFor="file-upload" className="cursor-pointer bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition-colors text-sm font-medium">
            {pdfFile ? 'Change PDF' : 'Upload PDF'}
          </label>
          <input id="file-upload" type="file" className="hidden" onChange={handleFileChange} accept=".pdf" />
        </div>
      </header>

      <main className="pt-16 grid grid-cols-1 lg:grid-cols-10 h-screen overflow-hidden">
        {isProcessingPdf ? (
          <div className="col-span-10 flex flex-col items-center justify-center h-full">
            <LoadingSpinner />
            <p className="mt-4 text-lg">Processing your document...</p>
          </div>
        ) : !pdfDocument ? (
          <div className="col-span-10 flex items-center justify-center h-full">
            <WelcomeScreen onFileUpload={handleFileChange} />
          </div>
        ) : (
          <>
            {isLeftPaneVisible && (
              <div className="lg:col-span-2 h-full overflow-y-auto bg-white dark:bg-slate-800/50 p-4 border-r border-slate-200 dark:border-slate-700 transition-all duration-300">
                <TranslationPane 
                  translation={currentTranslation} 
                  isLoading={isLoading.translation}
                  onToggle={() => setIsLeftPaneVisible(false)}
                />
              </div>
            )}
            
            {(() => {
              let centerPaneCols = 6;
              if (!isLeftPaneVisible) centerPaneCols += 2;
              if (!isRightPaneVisible) centerPaneCols += 2;

              return (
                <div ref={pdfViewerRef} className={`lg:col-span-${centerPaneCols} h-full overflow-y-auto relative bg-slate-200 dark:bg-slate-950 flex flex-col items-center py-8 px-4 transition-all duration-300`}>
                  {!isLeftPaneVisible && (
                    <button
                      onClick={() => setIsLeftPaneVisible(true)}
                      title="Expand Translation Pane"
                      className="absolute top-1/2 left-0 transform -translate-y-1/2 bg-slate-100 dark:bg-slate-800 p-1 rounded-r-md z-20 hover:bg-slate-200 dark:hover:bg-slate-700 border-y border-r border-slate-300 dark:border-slate-600 transition-colors"
                      aria-label="Expand Translation Pane"
                    >
                      <ChevronRightIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    </button>
                  )}

                  <PdfViewer
                    pdfDocument={pdfDocument}
                    currentPage={currentPage}
                    onSelectionChange={handleSelectionChange}
                    jumpToLocation={jumpToLocation}
                    containerRef={pdfViewerRef}
                  />
                  {selection && <ActionPopup selection={selection} onAction={handleAction} />}
                  <div className="fixed bottom-4 z-20 bg-white/70 dark:bg-slate-800/70 backdrop-blur-sm p-2 rounded-full shadow-lg flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage <= 1}
                      className="px-3 py-1 rounded-full disabled:opacity-50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      Prev
                    </button>
                    <span className="text-sm font-medium w-20 text-center">
                      Page {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage >= totalPages}
                      className="px-3 py-1 rounded-full disabled:opacity-50 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      Next
                    </button>
                  </div>

                  {!isRightPaneVisible && (
                    <button
                      onClick={() => setIsRightPaneVisible(true)}
                      title="Expand Notebook Pane"
                      className="absolute top-1/2 right-0 transform -translate-y-1/2 bg-slate-100 dark:bg-slate-800 p-1 rounded-l-md z-20 hover:bg-slate-200 dark:hover:bg-slate-700 border-y border-l border-slate-300 dark:border-slate-600 transition-colors"
                      aria-label="Expand Notebook Pane"
                    >
                      <ChevronLeftIcon className="w-5 h-5 text-slate-600 dark:text-slate-300" />
                    </button>
                  )}
                </div>
              );
            })()}

            {isRightPaneVisible && (
              <div className="lg:col-span-2 h-full overflow-y-auto bg-white dark:bg-slate-800/50 p-4 border-l border-slate-200 dark:border-slate-700 transition-all duration-300">
                <NotebookPane
                  terms={explainedTerms}
                  onExtractTerms={handleExtractTerms}
                  onExplainTerm={handleExplainExtractedTerm}
                  onJumpTo={handleJumpTo}
                  isLoading={{...isLoading}}
                  onToggle={() => setIsRightPaneVisible(false)}
                />
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
