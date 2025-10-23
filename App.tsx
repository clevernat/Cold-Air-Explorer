
import React, { useState, useCallback, useMemo, useRef } from 'react';
import { generateOutbreakData, generateForecastData } from './services/geminiService';
import type { OutbreakData } from './types';
import WorldMap from './components/WorldMap';
import Dashboard from './components/Dashboard';
import { SnowflakeIcon, LoadingSpinner, CameraIcon } from './components/icons';
import html2canvas from 'html2canvas';

type Mode = 'simulation' | 'forecast';
type Layer = 'temperature' | 'pressure' | 'wind';

const App: React.FC = () => {
  const [outbreakData, setOutbreakData] = useState<OutbreakData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isSavingImage, setIsSavingImage] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>('simulation');
  const [forecastDate, setForecastDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [forecastLocation, setForecastLocation] = useState<string>('Moscow, Russia');
  const [activeLayer, setActiveLayer] = useState<Layer>('temperature');
  const mapComponentRef = useRef<HTMLDivElement>(null);

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

  const handleSaveImage = useCallback(async () => {
    if (!mapComponentRef.current) return;
    setIsSavingImage(true);
    setError(null);

    try {
        const mapElement = mapComponentRef.current;
        
        // Wait for all tile images to be loaded to prevent blank map captures
        const tileImages = Array.from(mapElement.querySelectorAll('.leaflet-tile-container img')) as HTMLImageElement[];
        const promises = tileImages.map(img => {
            return new Promise<void>(resolve => {
                if (img.complete && img.naturalHeight !== 0) {
                    resolve();
                } else {
                    img.onload = () => resolve();
                    img.onerror = () => resolve(); // Resolve even on error to not block forever
                }
            });
        });
        await Promise.all(promises);
        
        // A small delay to ensure rendering is complete after image loads
        await new Promise(resolve => setTimeout(resolve, 500));

        const canvas = await html2canvas(mapElement, {
            useCORS: true,
            allowTaint: true,
            logging: false,
            backgroundColor: '#111827',
            removeContainer: false,
            onclone: (doc) => {
                // Hides all UI controls in the cloned document for a cleaner screenshot
                const leafletControls = doc.querySelectorAll('.leaflet-control');
                leafletControls.forEach(el => ((el as HTMLElement).style.visibility = 'hidden'));
                
                const customControls = doc.querySelectorAll('.z-\\[1000\\]');
                customControls.forEach(el => ((el as HTMLElement).style.visibility = 'hidden'));
            }
        });
        const link = document.createElement('a');
        link.download = `cold-air-explorer-${activeLayer}-${new Date().toISOString().split('T')[0]}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
    } catch (e) {
        console.error("Failed to save image", e);
        setError("Could not save map as image. This can happen if map tiles are not fully loaded or accessible.");
    } finally {
        setIsSavingImage(false);
    }
  }, [activeLayer]);

  const isGenerateDisabled = useMemo(() => {
    if (isLoading || isSavingImage) return true;
    if (mode === 'forecast' && (!forecastDate || !forecastLocation.trim())) return true;
    return false;
  }, [isLoading, isSavingImage, mode, forecastDate, forecastLocation]);

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
                <button 
                    onClick={() => setMode('simulation')} 
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${mode === 'simulation' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
                    disabled={isLoading || isSavingImage}
                >
                    Simulation
                </button>
                <button 
                    onClick={() => setMode('forecast')} 
                    className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${mode === 'forecast' ? 'bg-blue-600 text-white' : 'text-gray-300 hover:bg-gray-600'}`}
                    disabled={isLoading || isSavingImage}
                >
                    Forecast
                </button>
             </div>
             {mode === 'forecast' && (
                <>
                    <input 
                        type="date"
                        value={forecastDate}
                        onChange={(e) => setForecastDate(e.target.value)}
                        className="px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md text-sm focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-800 disabled:cursor-not-allowed"
                        disabled={isLoading || isSavingImage}
                    />
                    <input 
                        type="text"
                        placeholder="e.g., Moscow, Russia"
                        value={forecastLocation}
                        onChange={(e) => setForecastLocation(e.target.value)}
                        className="px-2 py-1.5 bg-gray-700 border border-gray-600 rounded-md text-sm w-36 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-800 disabled:cursor-not-allowed"
                        disabled={isLoading || isSavingImage}
                    />
                </>
             )}
            <button
                onClick={handleGenerateData}
                disabled={isGenerateDisabled}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 disabled:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed"
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
            <button
                onClick={handleSaveImage}
                disabled={!outbreakData || isLoading || isSavingImage}
                className="inline-flex items-center justify-center p-2 border border-transparent rounded-full text-white bg-gray-700 hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-800 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Save Map as Image"
            >
                {isSavingImage ? <LoadingSpinner /> : <CameraIcon className="h-5 w-5" />}
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
                Use the controls in the header to get started. Select a mode, then click "Simulate New Outbreak" or "Generate Forecast" to visualize a scientifically plausible cold air event using generative AI.
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
              <Dashboard 
                data={outbreakData.dashboardData}
                activeLayer={activeLayer} 
              />
            </div>
            <div className="lg:col-span-2 min-h-[400px] lg:min-h-[600px]">
              <WorldMap 
                ref={mapComponentRef}
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