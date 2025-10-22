
import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';
import type { DashboardData } from '../types';

interface DashboardProps {
  data: DashboardData;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-gray-700 p-2 border border-gray-600 rounded">
        <p className="label">{`${label}`}</p>
        {payload.map((pld: any, index: number) => (
          <p key={index} style={{ color: pld.color }}>
            {`${pld.name}: ${pld.value}${pld.unit || ''}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};


const Dashboard: React.FC<DashboardProps> = ({ data }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
        <div className="bg-gray-800 p-4 rounded-lg">
          <h3 className="text-sm text-gray-400">Min Temperature</h3>
          <p className="text-2xl font-bold text-blue-300">{data.minTemperature}°C</p>
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
        <h3 className="font-semibold mb-4 text-gray-300">Severity Trend (Avg. Min Temp)</h3>
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={data.severityTrend} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#4A5568" />
            <XAxis dataKey="year" tick={{ fill: '#A0AEC0' }} />
            <YAxis tick={{ fill: '#A0AEC0' }} unit="°C" />
            <Tooltip content={<CustomTooltip />} cursor={{stroke: '#4A5568', strokeWidth: 1}}/>
            <Line type="monotone" dataKey="avgMinTemp" stroke="#38B2AC" strokeWidth={2} name="Avg. Min Temp" unit="°C" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default Dashboard;