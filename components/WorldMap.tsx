import React, { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import type { MapPoint } from '../types';

declare const L: any; // Use the globally available Leaflet object

type Layer = 'temperature' | 'pressure' | 'wind';

interface WorldMapProps {
  mapData: MapPoint[];
  activeLayer: Layer;
  onLayerChange: (layer: Layer) => void;
}

interface TooltipData {
  x: number;
  y: number;
  content: string;
}

const layerConfig = {
    temperature: {
        domain: [-40, 5],
        scale: d3.interpolateCool,
        label: "Temperature (°C)",
        gradient: 'linear-gradient(to right, #3A46C8, #4D8BC9, #62D2C5, #79F8BF, #90FFB9)'
    },
    pressure: {
        domain: [1010, 1050],
        scale: d3.interpolatePlasma,
        label: "Pressure (hPa)",
        gradient: 'linear-gradient(to right, #0d0887, #6a00a8, #b12a90, #e16462, #fca636, #f0f921)'
    },
    wind: {
        domain: [10, 80],
        scale: d3.interpolateInferno,
        label: "Wind Speed (km/h)",
        gradient: 'linear-gradient(to right, #000004, #51127c, #b63679, #f68f44, #fcffa4)'
    }
};

const WorldMap: React.FC<WorldMapProps> = ({ mapData, activeLayer, onLayerChange }) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const svgOverlayRef = useRef<SVGSVGElement | null>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  // Initialize map effect
  useEffect(() => {
    if (mapContainerRef.current && !mapRef.current) {
        const map = L.map(mapContainerRef.current, {
            center: [40, -40],
            zoom: 3,
            worldCopyJump: true,
            zoomControl: false, // Add it later in a different position
        });
        
        const darkLayer = L.tileLayer(
            'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
            subdomains: 'abcd',
            maxZoom: 19
        }).addTo(map);

        const satelliteLayer = L.tileLayer(
            'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        });

        const baseMaps = {
            "Map": darkLayer,
            "Satellite": satelliteLayer
        };

        L.control.layers(baseMaps).addTo(map);
        L.control.zoom({ position: 'bottomleft' }).addTo(map);

        L.svg({clickable:true}).addTo(map);
        const overlay = d3.select(map.getPanes().overlayPane);
        // FIX: Add .node() to get the underlying SVG element from the d3 selection.
        svgOverlayRef.current = overlay.select<SVGSVGElement>("svg").attr("pointer-events", "auto").node();

        mapRef.current = map;
    }

    return () => {
        if (mapRef.current) {
            mapRef.current.remove();
            mapRef.current = null;
        }
    }
  }, []);

  // Update data overlay effect
  useEffect(() => {
    if (!mapRef.current || !svgOverlayRef.current || !mapData || mapData.length === 0) return;

    const map = mapRef.current;
    const svg = d3.select(svgOverlayRef.current);
    const g = svg.select<SVGGElement>("g").node() ? svg.select<SVGGElement>("g") : svg.append("g");
    
    const config = layerConfig[activeLayer];
    
    const transform = (d: MapPoint) => {
      const point = map.latLngToLayerPoint(new L.LatLng(d.lat, d.lon));
      return [point.x, point.y];
    };
    
    const draw = () => {
        const width = map.getSize().x;
        const height = map.getSize().y;
        g.selectAll("*").remove();

        if (activeLayer === 'temperature') {
            const tempColor = d3.scaleSequential(config.scale).domain(config.domain as [number, number]);
            g.selectAll("circle")
                .data(mapData)
                .enter().append("circle")
                .attr("transform", d => `translate(${transform(d)})`)
                .attr("r", 5)
                .attr("fill", d => tempColor(d.temp))
                .attr("stroke", "white")
                .attr("stroke-width", 0.5)
                .attr("opacity", 0.8)
                .style("cursor", "pointer")
                .on("mouseover", (event, d) => {
                    d3.select(event.currentTarget).attr("r", 8).attr("opacity", 1);
                    const point = map.latLngToContainerPoint(new L.LatLng(d.lat, d.lon));
                    setTooltip({
                        x: point.x,
                        y: point.y,
                        content: `Temp: ${d.temp.toFixed(1)}°C<br/>Pressure: ${d.pressure} hPa<br/>Wind: ${d.windSpeed} km/h`
                    });
                })
                .on("mouseout", (event) => {
                    d3.select(event.currentTarget).attr("r", 5).attr("opacity", 0.8);
                    setTooltip(null);
                });
        } else {
             const colorScale = d3.scaleSequential(config.scale).domain(config.domain as [number, number]);
             const projectedData = mapData.map(d => ({...d, point: transform(d)}));

             const densityData = d3.contourDensity<any>()
                .x(d => d.point[0])
                .y(d => d.point[1])
                .weight(d => d[activeLayer === 'pressure' ? 'pressure' : 'windSpeed'])
                .size([width, height])
                .bandwidth(35)
                .thresholds(15)(projectedData);

            g.selectAll('path')
                .data(densityData)
                .enter().append('path')
                .attr('d', d3.geoPath())
                .attr('fill', d => colorScale(d.value))
                .attr('fill-opacity', 0.5)
                .attr('stroke', 'none');
        }
    }
    
    const onUpdate = () => {
        requestAnimationFrame(draw);
    }
    
    map.on('zoomend moveend', onUpdate);
    draw(); // Initial draw

    return () => {
        map.off('zoomend moveend', onUpdate);
    }

  }, [mapData, activeLayer]);
  
  const currentConfig = layerConfig[activeLayer];

  return (
    <div className="relative w-full h-full bg-gray-800 rounded-lg overflow-hidden">
        <style>{`
           .leaflet-control-layers { background: #1F2937; border-radius: 8px; border: 1px solid #4B5563; }
           .leaflet-control-layers-base label { color: #E5E7EB; font-weight: normal; }
           .leaflet-control-layers-separator { border-top: 1px solid #4B5563; }
           .leaflet-control-zoom-in, .leaflet-control-zoom-out { background-color: #1F2937 !important; color: #E5E7EB !important; border-bottom: 1px solid #4B5563 !important; }
        `}</style>
        <div ref={mapContainerRef} className="w-full h-full" />
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] bg-gray-900 bg-opacity-70 p-1 rounded-lg flex space-x-1">
            {(['temperature', 'pressure', 'wind'] as Layer[]).map(layer => (
                <button
                    key={layer}
                    onClick={() => onLayerChange(layer)}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                    activeLayer === layer
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-300 hover:bg-gray-700'
                    }`}
                >
                    {layer.charAt(0).toUpperCase() + layer.slice(1)}
                </button>
            ))}
        </div>
        {tooltip && activeLayer === 'temperature' && (
            <div
            className="absolute z-[1001] bg-gray-900 text-white text-xs rounded-md p-2 shadow-lg pointer-events-none"
            style={{
                left: `${tooltip.x + 15}px`,
                top: `${tooltip.y}px`,
                transform: 'translateY(-50%)'
            }}
            dangerouslySetInnerHTML={{ __html: tooltip.content }}
            />
        )}
        <div className="absolute bottom-4 right-4 z-[1000] bg-gray-900 bg-opacity-70 p-2 rounded-lg text-xs">
            <h4 className="font-bold mb-2">{currentConfig.label}</h4>
            <div className="flex items-center">
                <span>{currentConfig.domain[0]}</span>
                <div className="w-24 h-3 mx-2" style={{background: currentConfig.gradient}}></div>
                <span>{currentConfig.domain[1]}</span>
            </div>
        </div>
    </div>
  );
};

export default WorldMap;