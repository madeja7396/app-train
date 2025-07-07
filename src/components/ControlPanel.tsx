
import React from 'react';
import { Algorithm } from '../types';
import { Play, Pause, FastForward, SkipBack, RotateCcw, Plus, Trash2 } from 'lucide-react';

interface ControlPanelProps {
  algorithm: Algorithm;
  setAlgorithm: (algo: Algorithm) => void;
  onStart: () => void;
  onReset: () => void;
  onClearCities: () => void;
  onLoadSample: (count: 4 | 5) => void;
  isAddingCities: boolean;
  setIsAddingCities: (isAdding: boolean) => void;
  stepIndex: number;
  totalSteps: number;
  onStepChange: (index: number) => void;
  isPlaying: boolean;
  setIsPlaying: (playing: boolean) => void;
  speed: number;
  setSpeed: (speed: number) => void;
  isRunning: boolean;
}

const ControlButton: React.FC<{ onClick?: () => void; disabled?: boolean; children: React.ReactNode; className?: string }> = ({ onClick, disabled, children, className }) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`px-3 py-2 text-sm font-semibold rounded-md flex items-center justify-center gap-2 transition-colors
      ${disabled ? 'bg-slate-600 text-slate-400 cursor-not-allowed' : 'bg-sky-600 hover:bg-sky-500 text-white'}
      ${className}`}
  >
    {children}
  </button>
);


const ControlPanel: React.FC<ControlPanelProps> = (props) => {
  const {
    algorithm, setAlgorithm, onStart, onReset, onClearCities, onLoadSample,
    isAddingCities, setIsAddingCities, stepIndex, totalSteps, onStepChange,
    isPlaying, setIsPlaying, speed, setSpeed, isRunning
  } = props;
    
  const isFinished = stepIndex === totalSteps - 1;

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-4 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
      {/* City & Algorithm Setup */}
      <div className="flex flex-wrap items-center gap-2">
         <h3 className="text-sm font-bold text-white mr-2">Setup:</h3>
         <ControlButton onClick={() => setIsAddingCities(!isAddingCities)} className={isAddingCities ? 'bg-amber-600 hover:bg-amber-500' : ''} disabled={isRunning}>
             <Plus size={16}/> Add City
         </ControlButton>
         <ControlButton onClick={onClearCities} disabled={isRunning} className="bg-red-600 hover:bg-red-500"><Trash2 size={16}/> Clear</ControlButton>
         <ControlButton onClick={() => onLoadSample(4)} disabled={isRunning}>Sample 4</ControlButton>
         <ControlButton onClick={() => onLoadSample(5)} disabled={isRunning}>Sample 5</ControlButton>
         <select
            value={algorithm}
            onChange={(e) => setAlgorithm(e.target.value as Algorithm)}
            disabled={isRunning}
            className="bg-slate-700 text-white rounded-md px-3 py-2 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-sky-500 disabled:bg-slate-600 disabled:text-slate-400"
          >
            <option value={Algorithm.HeldKarp}>Held-Karp (DP)</option>
            <option value={Algorithm.NearestNeighbor}>Nearest Neighbor</option>
          </select>
          <ControlButton onClick={onStart} disabled={isRunning}>Start</ControlButton>
      </div>

      {/* Playback Controls */}
      <div className="flex flex-wrap items-center gap-2">
         <h3 className="text-sm font-bold text-white mr-2">Controls:</h3>
         <ControlButton onClick={() => onStepChange(0)} disabled={!isRunning}><SkipBack size={16}/></ControlButton>
         <ControlButton onClick={() => setIsPlaying(!isPlaying)} disabled={!isRunning || isFinished}>
            {isPlaying ? <Pause size={16}/> : <Play size={16}/>}
         </ControlButton>
         <ControlButton onClick={() => onStepChange(stepIndex + 1)} disabled={!isRunning || isFinished}><FastForward size={16}/></ControlButton>
         <ControlButton onClick={onReset}><RotateCcw size={16}/> Reset All</ControlButton>
         <div className="flex items-center gap-2">
            <label htmlFor="speed" className="text-sm font-medium text-slate-300">Speed:</label>
            <input
                type="range"
                id="speed"
                min="100"
                max="2000"
                step="100"
                value={2100 - speed}
                onChange={(e) => setSpeed(2100 - parseInt(e.target.value))}
                className="w-24"
                disabled={!isRunning}
            />
         </div>
      </div>
    </div>
  );
};

export default ControlPanel;