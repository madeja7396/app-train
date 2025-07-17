
import React from 'react';

interface WelcomeScreenProps {
  onFileUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ onFileUpload }) => {
  return (
    <div className="text-center p-8 max-w-2xl mx-auto">
      <div className="mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-20 w-20 text-primary-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
      </div>
      <h2 className="text-3xl font-bold text-slate-800 dark:text-white mb-3">Welcome to your AI Research Partner</h2>
      <p className="text-lg text-slate-600 dark:text-slate-400 mb-8">
        Upload a PDF to begin. Instantly translate text, get explanations for complex terms, and keep your notes all in one place.
      </p>
      <div>
        <label htmlFor="welcome-file-upload" className="inline-block cursor-pointer bg-primary-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-primary-700 transition-all transform hover:scale-105 shadow-lg">
          Upload PDF
        </label>
        <input id="welcome-file-upload" type="file" className="hidden" onChange={onFileUpload} accept=".pdf" />
      </div>
    </div>
  );
};

export default WelcomeScreen;
