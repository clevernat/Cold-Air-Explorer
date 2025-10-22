import React, { useState, useCallback, useMemo } from 'react';
import { generateOutbreakData, generateForecastData } from './services/geminiService';
import type { OutbreakData } from './types';
import NorthAmericaMap from './components/NorthAmericaMap';
import Dashboard from './components/Dashboard';
import { SnowflakeIcon, LoadingSpinner } from './components/icons';

type Mode = 'simulation' | 'forecast';
type Layer = 'temperature' | 'pressure' | 'wind';

const App: React.FC = () => {
  const [outbreakData, setOutbreakData] = useState<OutbreakData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('simulation');
  const [forecastDate, setForecastDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [forecastLocation, setForecastLocation] = useState<string>('Chicago, IL');
  const [activeLayer, setActiveLayer] = useState<Layer>('temperature');

  const handleGenerateData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = mode === 'simulation'
        ? await generateOutbreakData()
        : await generateForecastData(forecastDate, forecastLocation);
      setOutbreakData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [mode, forecastDate, forecastLocation]);

  const isGenerateDisabled = useMemo(() => {
    if (isLoading) return true;
    if (mode === 'forecast' && (!forecastDate || !forecastLocation.trim())) return true;
    return false;
  }, [isLoading, mode, forecastDate, forecastLocation]);

  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 font-sans">
      <header className="bg-gray-800 shadow-md">
        <div className="container mx-auto px-4 py-3 flex flex-wrap justify-between items-center gap-4">
          <div className="flex items-center space-x-3">
            <SnowflakeIcon className="h-8 w-8 text-blue-400" />
            <h1 className="text-2xl font-bold tracking-tight text-white">Cold Air Explorer</h1>
          </div>
          <div className="flex items-center flex-wrap gap-2">
             <div className="bg-gray-700 p-1 rounded-lg flex">
                <button onClick={() => setMode('simulation')} className={`px-3 py-1 text-sm font-medium rounded-md ${mode === 'simulation' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Simulation</button>
                <button onClick={() => setMode('forecast')} className={`px-3 py-1 text-sm font-medium rounded-md ${mode === 'forecast' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}>Forecast</button>
             </div>
             {mode === 'forecast' && (
                <>
                    <input 
                        type="date"
                        value={forecastDate}
                        onChange={(e) => setForecastDate(e.target.value)}
                        className="px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500"
                    />
                    <input 
                        type="text"
                        placeholder="e.g., Chicago, IL"
                        value={forecastLocation}
                        onChange={(e) => setForecastLocation(e.target.value)}
                        className="px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md text-sm w-36 focus:ring-blue-500 focus:border-blue-500"
                    />
                </>
             )}
            <button
                onClick={handleGenerateData}
                disabled={isGenerateDisabled}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 disabled:bg-blue-800 disabled:cursor-not-allowed"
            >
                {isLoading ? (
                <>
                    <LoadingSpinner />
                    Generating...
                </>
                ) : (
                    mode === 'simulation' ? 'Simulate New Outbreak' : 'Generate Forecast'
                )}
            </button>
          </div>
        </div>
      </header>

      <main className="container mx-auto p-4">
        {error && (
          <div className="bg-red-900 border border-red-700 text-red-200 px-4 py-3 rounded-lg relative mb-4" role="alert">
            <strong className="font-bold">Error: </strong>
            <span className="block sm:inline">{error}</span>
          </div>
        )}

        {!outbreakData && !isLoading && (
          <div className="text-center py-20">
            <div className="max-w-2xl mx-auto">
              <SnowflakeIcon className="h-16 w-16 text-gray-600 mx-auto mb-4" />
              <h2 className="text-3xl font-bold text-white mb-2">Welcome to Cold Air Explorer</h2>
              <p className="text-gray-400 mb-6">
                Use the controls in the header to get started. Select a mode, then click "Simulate New Outbreak" or "Generate Forecast" to visualize a scientifically plausible cold air event over North America using generative AI.
              </p>
            </div>
          </div>
        )}

        {isLoading && !outbreakData && (
          <div className="flex flex-col items-center justify-center h-96">
            <LoadingSpinner />
            <p className="mt-4 text-lg text-gray-400">Generating meteorological data... this may take a moment.</p>
          </div>
        )}

        {outbreakData && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-1">
              <Dashboard data={outbreakData.dashboardData} />
            </div>
            <div className="lg:col-span-2 min-h-[400px] lg:min-h-[600px]">
              <NorthAmericaMap 
                mapData={outbreakData.mapData} 
                activeLayer={activeLayer}
                onLayerChange={setActiveLayer}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;