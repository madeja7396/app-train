
import React, { useRef, useEffect } from 'react';
import type { Selection } from '../types';
import { TranslateIcon } from './icons/TranslateIcon';
import { ExplainIcon } from './icons/ExplainIcon';

interface ActionPopupProps {
  selection: Selection;
  onAction: (action: 'translate' | 'explain') => void;
}

const ActionPopup: React.FC<ActionPopupProps> = ({ selection, onAction }) => {
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const popup = popupRef.current;
    if (popup) {
      const { top, left, width } = selection.rect;
      popup.style.top = `${top + window.scrollY - popup.offsetHeight - 10}px`;
      popup.style.left = `${left + window.scrollX + width / 2 - popup.offsetWidth / 2}px`;
    }
  }, [selection]);

  return (
    <div
      ref={popupRef}
      className="fixed z-20 bg-slate-800 text-white rounded-lg shadow-xl flex items-center p-1 space-x-1"
    >
      <button
        onClick={() => onAction('translate')}
        className="p-2 rounded-md hover:bg-slate-700 transition-colors"
        title="Translate Selection"
      >
        <TranslateIcon className="w-5 h-5" />
      </button>
      <button
        onClick={() => onAction('explain')}
        className="p-2 rounded-md hover:bg-slate-700 transition-colors"
        title="Explain Term"
      >
        <ExplainIcon className="w-5 h-5" />
      </button>
    </div>
  );
};

export default ActionPopup;