
import React from 'react';
import { City, Step } from '../types';
import { CITY_LABELS } from '../constants';

interface VisualizationCanvasProps {
  cities: City[];
  step: Step | null;
  onAddCity: (e: React.MouseEvent<SVGSVGElement>) => void;
  isAddingCities: boolean;
}

const VisualizationCanvas: React.FC<VisualizationCanvasProps> = ({ cities, step, onAddCity, isAddingCities }) => {
  const getCityById = (id: number) => cities.find(c => c.id === id);

  const renderPath = (path: number[], color: string, strokeWidth = '2', dashArray = '') => {
    if (!path || path.length < 2) return null;
    const points = [];
    for (let i = 0; i < path.length - 1; i++) {
      const fromCity = getCityById(path[i]);
      const toCity = getCityById(path[i + 1]);
      if (fromCity && toCity) {
        points.push(
          <line
            key={`${i}-${fromCity.id}-${toCity.id}`}
            x1={fromCity.x}
            y1={fromCity.y}
            x2={toCity.x}
            y2={toCity.y}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={dashArray}
            markerEnd="url(#arrow)"
          />
        );
      }
    }
    return points;
  };
  
  const finalPath = step?.finalPath;
  const pathBeingCalculated = step?.pathBeingCalculated;

  return (
    <div className="bg-slate-800 rounded-lg shadow-lg h-full relative overflow-hidden">
      <svg
        className={`w-full h-full ${isAddingCities ? 'cursor-crosshair' : 'cursor-default'}`}
        onClick={isAddingCities ? onAddCity : undefined}
      >
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill="#94a3b8" />
          </marker>
        </defs>

        {/* Render final path if it exists */}
        {finalPath && renderPath(finalPath, '#10b981' /* emerald-500 */, '4')}

        {/* Render path being calculated, but not if it's part of the final path already shown */}
        {pathBeingCalculated && !finalPath && renderPath(pathBeingCalculated, '#f59e0b' /* amber-500 */, '3', '8 4')}

        {/* Render cities */}
        {cities.map((city, index) => (
          <g key={city.id}>
            <circle cx={city.x} cy={city.y} r="10" fill="#38bdf8" /* sky-400 */ stroke="#0f172a" strokeWidth="2" />
            <text
              x={city.x}
              y={city.y}
              dy=".3em"
              textAnchor="middle"
              fill="white"
              fontSize="12"
              fontWeight="bold"
            >
              {CITY_LABELS[index]}
            </text>
          </g>
        ))}
      </svg>
       {isAddingCities && (
        <div className="absolute top-2 left-2 bg-sky-500 text-white text-xs font-bold px-2 py-1 rounded-full">
          Click to add a city
        </div>
      )}
    </div>
  );
};

export default VisualizationCanvas;