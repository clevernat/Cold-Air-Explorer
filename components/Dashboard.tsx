
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import type { DashboardData } from '../types';

interface DashboardProps {
  data: DashboardData;
  activeLayer: 'temperature' | 'pressure' | 'wind';
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const { name, value, unit } = payload[0];
    const formattedLabel = name === 'Events' ? `${label}: ${value}` : `${label}: ${value}${unit}`;

    return (
      <div className="bg-gray-700 p-2 border border-gray-600 rounded backdrop-blur-sm bg-opacity-70">
        <p className="label font-semibold">{formattedLabel}</p>
      </div>
    );
  }
  return null;
};


const Dashboard: React.FC<DashboardProps> = ({ data, activeLayer }) => {

    const layerDisplayConfig = {
        temperature: {
            statLabel: 'Min Temperature',
            statValue: `${data.minTemperature}°C`,
            statColor: 'text-blue-300',
            chartLabel: 'Severity Trend (Avg. Min Temp)',
            chartData: data.severityTrend,
            chartDataKey: 'avgMinTemp',
            chartUnit: '°C',
            chartColor: '#38B2AC'
        },
        pressure: {
            statLabel: 'Max Pressure',
            statValue: `${data.maxPressure} hPa`,
            statColor: 'text-orange-300',
            chartLabel: 'Pressure Trend (Avg. Max Pressure)',
            chartData: data.pressureTrend,
            chartDataKey: 'avgMaxPressure',
            chartUnit: ' hPa',
            chartColor: '#E16462'
        },
        wind: {
            statLabel: 'Max Wind Speed',
            statValue: `${data.maxWindSpeed} km/h`,
            statColor: 'text-yellow-300',
            chartLabel: 'Wind Trend (Avg. Max Wind)',
            chartData: data.windTrend,
            chartDataKey: 'avgMaxWind',
            chartUnit: ' km/h',
            chartColor: '#F68F44'
        }
    };

    const config = layerDisplayConfig[activeLayer];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-sm text-gray-400">{config.statLabel}</h3>
          <p className={`text-2xl font-bold ${config.statColor}`}>{config.statValue}</p>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-sm text-gray-400">Event Name</h3>
          <p className="text-lg font-semibold text-cyan-300 truncate" title={data.eventName}>{data.eventName}</p>
        </div>
        <div className="relative group bg-gray-800 p-4 rounded-lg cursor-help">
          <h3 className="text-sm text-gray-400">Max Extent</h3>
          <p className="text-2xl font-bold text-teal-300">{data.maxExtent.toLocaleString()} km²</p>
          <div role="tooltip" className="absolute bottom-full left-1/2 z-10 -translate-x-1/2 mb-2 w-64 p-2 text-xs font-medium text-center text-white bg-gray-700 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
            The total area covered by the outbreak in square kilometers.
          </div>
        </div>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="font-semibold mb-4 text-gray-300">Monthly Event Frequency</h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={data.monthlyFrequency} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
            <XAxis dataKey="month" tick={{ fill: '#A0AEC0' }} />
            <YAxis tick={{ fill: '#A0AEC0' }} />
            <Tooltip content={<CustomTooltip />} cursor={{fill: 'rgba(113, 128, 150, 0.1)'}} />
            <Bar dataKey="count" fill="#4299E1" name="Events" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-gray-800 p-4 rounded-lg">
        <h3 className="font-semibold mb-4 text-gray-300">{config.chartLabel}</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={config.chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
            <XAxis dataKey="year" tick={{ fill: '#A0AEC0' }} />
            <YAxis tick={{ fill: '#A0AEC0' }} unit={config.chartUnit} />
            <Tooltip content={<CustomTooltip />} cursor={{stroke: '#4A5568', strokeWidth: 1}}/>
            <Line type="monotone" dataKey={config.chartDataKey} stroke={config.chartColor} strokeWidth={2} name={config.chartLabel} unit={config.chartUnit} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;