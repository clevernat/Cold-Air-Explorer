import React, { useRef, useEffect, useState } from 'react';
import * as d3 from 'd3';
import type { MapPoint } from '../types';

type Layer = 'temperature' | 'pressure' | 'wind';

interface NorthAmericaMapProps {
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

const NorthAmericaMap: React.FC<NorthAmericaMapProps> = ({ mapData, activeLayer, onLayerChange }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const [tooltip, setTooltip] = useState<TooltipData | null>(null);

  useEffect(() => {
    if (!mapData || mapData.length === 0 || !svgRef.current) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();
    svg.style("cursor", "grab");

    const width = 800;
    const height = 600;

    const projection = d3.geoAlbers()
      .center([0, 45])
      .rotate([97, 0])
      .parallels([29.5, 45.5])
      .scale(900)
      .translate([width / 2, height / 2]);
    
    const config = layerConfig[activeLayer];

    const g = svg.append("g");

    g.append("g")
      .selectAll("path")
      .data(["M652,242L634,233L609,242L571,242L551,219L537,212L517,219L501,237L480,242L477,222L454,204L424,196L403,169L381,159L349,152L329,141L313,113L292,104L274,124L253,132L219,132L204,115L181,104L165,116L156,141L142,159L120,165L108,187L117,211L143,237L151,265L163,284L177,314L188,342L199,353L229,367L241,392L271,411L289,425L321,437L345,433L363,445L375,472L403,485L424,472L440,480L464,489L481,475L497,458L513,446L527,458L541,476L551,465L552,437L564,417L580,396L592,374L598,345L597,322L612,301L630,283L644,263Z"])
      .enter().append("path")
      .attr("d", d => d)
      .attr("fill", "#2D3748")
      .attr("stroke", "#4A5568");

    if (activeLayer === 'temperature') {
      const tempColor = d3.scaleSequential(config.scale).domain(config.domain as [number, number]);
      g.append("g").selectAll("circle")
        .data(mapData)
        .enter()
        .append("circle")
        .attr("cx", d => projection([d.lon, d.lat])![0])
        .attr("cy", d => projection([d.lon, d.lat])![1])
        .attr("r", 5)
        .attr("fill", d => tempColor(d.temp))
        .attr("stroke", "white")
        .attr("stroke-width", 0.5)
        .style("cursor", "pointer")
        .attr("opacity", 0.8)
        .on("mouseover", (event, d) => {
          d3.select(event.currentTarget).attr("r", 8).attr("opacity", 1);
          const containerRect = svgRef.current?.parentElement?.getBoundingClientRect();
          if (!containerRect) return;
          const circleRect = (event.currentTarget as SVGCircleElement).getBoundingClientRect();
          const x = circleRect.left + circleRect.width / 2 - containerRect.left;
          const y = circleRect.top + circleRect.height / 2 - containerRect.top;
          setTooltip({
            x: x,
            y: y,
            content: `Temp: ${d.temp.toFixed(1)}°C<br/>Pressure: ${d.pressure} hPa<br/>Wind: ${d.windSpeed} km/h`
          });
        })
        .on("mouseout", (event) => {
          d3.select(event.currentTarget).attr("r", 5).attr("opacity", 0.8);
          setTooltip(null);
        });
    } else {
        const colorScale = d3.scaleSequential(config.scale).domain(config.domain as [number, number]);
        const densityData = d3.contourDensity<MapPoint>()
            .x(d => projection([d.lon, d.lat])![0])
            .y(d => projection([d.lon, d.lat])![1])
            .weight(d => d[activeLayer === 'pressure' ? 'pressure' : 'windSpeed'])
            .size([width, height])
            .bandwidth(35)
            .thresholds(15)(mapData);

        g.append('g')
            .selectAll('path')
            .data(densityData)
            .enter().append('path')
            .attr('d', d3.geoPath())
            .attr('fill', d => colorScale(d.value))
            .attr('fill-opacity', 0.5)
            .attr('stroke', 'none');
    }

    const zoom = d3.zoom<SVGSVGElement, unknown>()
      .scaleExtent([1, 8])
      .on("zoom", (event) => {
        g.attr("transform", event.transform.toString());
      });

    svg.call(zoom)
       .on("mousedown.zoom", () => svg.style("cursor", "grabbing"))
       .on("mouseup.zoom", () => svg.style("cursor", "grab"));

  }, [mapData, activeLayer]);
  
  const currentConfig = layerConfig[activeLayer];

  return (
    <div className="relative w-full h-full bg-gray-800 rounded-lg p-2 overflow-hidden">
      <div className="absolute top-4 right-4 z-10 bg-gray-900 bg-opacity-70 p-1 rounded-lg flex space-x-1">
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

      <svg ref={svgRef} viewBox="0 0 800 600" className="w-full h-full"></svg>
      {tooltip && activeLayer === 'temperature' && (
        <div
          className="absolute bg-gray-900 text-white text-xs rounded-md p-2 shadow-lg pointer-events-none"
          style={{
            left: `${tooltip.x + 15}px`,
            top: `${tooltip.y}px`,
            transform: 'translateY(-50%)'
          }}
          dangerouslySetInnerHTML={{ __html: tooltip.content }}
        />
      )}
       <div className="absolute bottom-4 right-4 bg-gray-900 bg-opacity-70 p-2 rounded-lg text-xs">
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

export default NorthAmericaMap;