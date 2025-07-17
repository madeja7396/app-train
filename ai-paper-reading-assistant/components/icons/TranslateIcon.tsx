
import React from 'react';

export const TranslateIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M3 5h12M9 3v2m4 13-4-4M19 17v-2a4 4 0 00-4-4H9M15 3a2 2 0 11-4 0m4 0V1" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 01-6 0m6 0a3 3 0 00-6 0m6 0h6m-6 0V9" />
  </svg>
);
