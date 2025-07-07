
import React, { useState, useEffect, useCallback } from 'react';
import { City, Algorithm, Step } from './types';
import { SAMPLE_CITIES_4, SAMPLE_CITIES_5, CITY_LABELS } from './constants';
import { generateHeldKarpSteps, generateNearestNeighborSteps } from './services/tspSolver';
import VisualizationCanvas from './components/VisualizationCanvas';
import InfoPanel from './components/InfoPanel';
import ControlPanel from './components/ControlPanel';

const App: React.FC = () => {
  const [cities, setCities] = useState<City[]>(SAMPLE_CITIES_4);
  const [algorithm, setAlgorithm] = useState<Algorithm>(Algorithm.HeldKarp);
  const [steps, setSteps] = useState<Step[]>([]);
  const [currentStepIndex, setCurrentStepIndex] = useState<number>(0);
  const [isAddingCities, setIsAddingCities] = useState<boolean>(false);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speed, setSpeed] = useState<number>(1000); // ms delay
  const [isRunning, setIsRunning] = useState<boolean>(false);

  useEffect(() => {
    if (!isPlaying || !isRunning || currentStepIndex >= steps.length - 1) {
      return;
    }
    const timer = setTimeout(() => {
      setCurrentStepIndex(prev => prev + 1);
    }, speed);
    return () => clearTimeout(timer);
  }, [isPlaying, currentStepIndex, steps.length, speed, isRunning]);

  const handleAddCity = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isAddingCities || cities.length >= 15) return;
    const svg = e.currentTarget;
    const rect = svg.getBoundingClientRect();
    const newCity: City = {
      id: cities.length > 0 ? Math.max(...cities.map(c => c.id)) + 1 : 0,
      name: CITY_LABELS[cities.length % CITY_LABELS.length],
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
    setCities([...cities, newCity]);
  };

  const resetState = useCallback(() => {
    setIsPlaying(false);
    setIsRunning(false);
    setSteps([]);
    setCurrentStepIndex(0);
  }, []);
  
  const handleStart = () => {
    if (cities.length < 2) {
      alert("Please add at least 2 cities to start the algorithm.");
      return;
    }
    resetState();
    setIsAddingCities(false);
    let generatedSteps: Step[];
    if (algorithm === Algorithm.HeldKarp) {
      generatedSteps = generateHeldKarpSteps(cities);
    } else {
      generatedSteps = generateNearestNeighborSteps(cities);
    }
    setSteps(generatedSteps);
    setIsRunning(true);
    setIsPlaying(true);
  };
  
  const handleResetAll = () => {
      resetState();
      setCities([]);
      setIsAddingCities(true);
  }

  const handleClearCities = () => {
    if (isRunning) return;
    setCities([]);
    resetState();
  };

  const handleLoadSample = (count: 4 | 5) => {
    if (isRunning) return;
    setCities(count === 4 ? SAMPLE_CITIES_4 : SAMPLE_CITIES_5);
    resetState();
    setIsAddingCities(false);
  };
  
  const handleStepChange = (index: number) => {
    if (index >= 0 && index < steps.length) {
      setCurrentStepIndex(index);
      setIsPlaying(false);
    }
  };


  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 p-4 font-sans">
      <header className="text-center mb-4">
        <h1 className="text-3xl md:text-4xl font-bold text-sky-400">Route Insight</h1>
        <p className="text-slate-400">A Traveling Salesperson Problem (TSP) Visualizer</p>
      </header>
      
      <main className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-120px)]">
        <div className="lg:w-2/3 h-1/2 lg:h-full">
          <VisualizationCanvas
            cities={cities}
            step={steps[currentStepIndex]}
            onAddCity={handleAddCity}
            isAddingCities={isAddingCities}
          />
        </div>
        <div className="lg:w-1/3 h-1/2 lg:h-full">
          <InfoPanel step={steps[currentStepIndex]} cities={cities} />
        </div>
      </main>

      <footer className="mt-4">
        <ControlPanel
          algorithm={algorithm}
          setAlgorithm={setAlgorithm}
          onStart={handleStart}
          onReset={handleResetAll}
          onClearCities={handleClearCities}
          onLoadSample={handleLoadSample}
          isAddingCities={isAddingCities}
          setIsAddingCities={setIsAddingCities}
          stepIndex={currentStepIndex}
          totalSteps={steps.length}
          onStepChange={handleStepChange}
          isPlaying={isPlaying}
          setIsPlaying={setIsPlaying}
          speed={speed}
          setSpeed={setSpeed}
          isRunning={isRunning}
        />
      </footer>
    </div>
  );
};

export default App;