
import React from 'react';
import { Step, City } from '../types';

interface InfoPanelProps {
  step: Step | null;
  cities: City[];
}

const DPTableDisplay: React.FC<{ step: Step; cities: City[] }> = ({ step, cities }) => {
  if (!step.dpTable || Object.keys(step.dpTable).length === 0) {
    return <p className="text-slate-400 text-sm">DP Table will be shown here.</p>;
  }
  
  const { dpTable, highlightedDpCell } = step;

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-xs text-left">
        <thead className="text-slate-300">
          <tr>
            <th className="p-2 border-b border-slate-600">Subset</th>
            {cities.slice(1).map(city => (
              <th key={city.id} className="p-2 border-b border-slate-600 text-center">{city.name}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {Object.entries(dpTable).map(([subsetKey, rowData]) => (
            <tr key={subsetKey} className="border-t border-slate-700">
              <td className="p-2 font-mono text-sky-400">{subsetKey}</td>
              {cities.slice(1).map(city => {
                const cellData = rowData[city.id];
                const isHighlighted = highlightedDpCell?.subsetKey === subsetKey && highlightedDpCell?.endNode === city.id;
                const cellClass = isHighlighted ? 'bg-amber-500/20' : '';
                return (
                  <td key={city.id} className={`p-2 text-center ${cellClass} transition-colors duration-300`}>
                    {cellData ? cellData.cost.toFixed(2) : '-'}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};


const DistanceMatrixDisplay: React.FC<{ step: Step | null, cities: City[] }> = ({ step, cities }) => {
    if (!step?.distanceMatrix) return null;
    const matrix = step.distanceMatrix;

    return (
        <div>
            <h4 className="text-sm font-bold text-slate-300 mb-2">Distance Matrix</h4>
            <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                    <thead className="text-slate-300">
                        <tr>
                            <th className="p-2 border-b border-slate-600"></th>
                            {cities.map((c) => <th key={c.id} className="p-2 border-b border-slate-600 text-center">{c.name}</th>)}
                        </tr>
                    </thead>
                    <tbody>
                        {matrix.map((row, i) => (
                            <tr key={i} className="border-t border-slate-700">
                                <td className="p-2 font-bold text-slate-300">{cities[i].name}</td>
                                {row.map((dist, j) => (
                                    <td key={j} className="p-2 text-center text-slate-400">{dist.toFixed(1)}</td>
                                ))}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}

const InfoPanel: React.FC<InfoPanelProps> = ({ step, cities }) => {
  return (
    <div className="bg-slate-800 rounded-lg shadow-lg p-4 flex flex-col space-y-4 h-full overflow-y-auto">
      <div>
        <h3 className="text-lg font-bold text-white mb-2">Algorithm Steps</h3>
        <div className="bg-slate-900 rounded p-3 min-h-[80px] text-slate-200 text-sm font-mono whitespace-pre-wrap">
          {step?.description || 'Start the algorithm to see the steps.'}
        </div>
      </div>
      <div>
        <h3 className="text-lg font-bold text-white mb-2">DP Table</h3>
        <div className="bg-slate-900 rounded p-3">
          {step?.dpTable ? <DPTableDisplay step={step} cities={cities} /> : <p className="text-slate-400 text-sm">DP Table is only available for the Held-Karp algorithm.</p>}
        </div>
      </div>
       <div>
         <DistanceMatrixDisplay step={step} cities={cities} />
      </div>
    </div>
  );
};

export default InfoPanel;