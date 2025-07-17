
import React, { useRef, useEffect, useCallback, useState } from 'react';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import { renderPdfPage } from '../services/pdfService';
import type { Selection } from '../types';

interface PdfViewerProps {
  pdfDocument: PDFDocumentProxy;
  currentPage: number;
  onSelectionChange: (selection: Selection | null) => void;
  jumpToLocation: { page: number, rect: DOMRectReadOnly | null } | null;
  containerRef: React.RefObject<HTMLDivElement>;
}

const PdfViewer: React.FC<PdfViewerProps> = ({ pdfDocument, currentPage, onSelectionChange, jumpToLocation, containerRef }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const textLayerRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(false);

  const renderPage = useCallback(async () => {
    if (!pdfDocument || !canvasRef.current || !textLayerRef.current || !containerRef.current) return;
    setIsRendering(true);
    // Use clientWidth which represents the viewable width of the container, including padding.
    const containerWidth = containerRef.current.clientWidth;
    await renderPdfPage(pdfDocument, currentPage, canvasRef.current, textLayerRef.current, containerWidth);
    setIsRendering(false);
  }, [pdfDocument, currentPage, containerRef]);

  useEffect(() => {
    renderPage();
  }, [renderPage]);

  useEffect(() => {
    const handleResize = () => {
      renderPage();
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [renderPage]);
  
  useEffect(() => {
    if (jumpToLocation && jumpToLocation.page === currentPage && jumpToLocation.rect && textLayerRef.current && highlightRef.current) {
      const textLayer = textLayerRef.current;
      const pageRect = textLayer.getBoundingClientRect();
      const highlight = highlightRef.current;

      highlight.style.left = `${jumpToLocation.rect.left - pageRect.left}px`;
      highlight.style.top = `${jumpToLocation.rect.top - pageRect.top}px`;
      highlight.style.width = `${jumpToLocation.rect.width}px`;
      highlight.style.height = `${jumpToLocation.rect.height}px`;
      highlight.style.opacity = '1';

      textLayer.scrollTop = (jumpToLocation.rect.top - pageRect.top) - 50; // Scroll into view

      const timer = setTimeout(() => {
        highlight.style.opacity = '0';
      }, 1500); // Highlight fades after 1.5s
      return () => clearTimeout(timer);
    }
  }, [jumpToLocation, currentPage]);


  const handleMouseUp = () => {
    const selection = window.getSelection();
    if (selection && !selection.isCollapsed && textLayerRef.current?.contains(selection.anchorNode)) {
      const text = selection.toString().trim();
      if (text) {
        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        onSelectionChange({ text, rect });
      } else {
        onSelectionChange(null);
      }
    } else {
      onSelectionChange(null);
    }
  };

  return (
    <div className="relative shadow-lg" onMouseUp={handleMouseUp}>
      {isRendering && <div className="absolute inset-0 bg-white/50 dark:bg-slate-900/50 flex items-center justify-center z-10"><p>Rendering...</p></div>}
      <canvas ref={canvasRef} className="rounded-md" />
      <div ref={textLayerRef} className="textLayer absolute top-0 left-0" />
      <div ref={highlightRef} className="absolute bg-primary-400/50 rounded-sm pointer-events-none transition-opacity duration-500" style={{opacity: 0}} />
    </div>
  );
};

export default PdfViewer;
