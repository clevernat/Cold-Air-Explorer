import { GoogleGenAI, Type } from "@google/genai";
import type { OutbreakData } from '../types';

const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  throw new Error("API_KEY environment variable not set");
}

const ai = new GoogleGenAI({ apiKey: API_KEY });

const responseSchema = {
  type: Type.OBJECT,
  properties: {
    mapData: {
      type: Type.ARRAY,
      description: "Array of 50 data points for the map visualization.",
      items: {
        type: Type.OBJECT,
        properties: {
          lat: { type: Type.NUMBER, description: "Latitude, between 25 and 60." },
          lon: { type: Type.NUMBER, description: "Longitude, between -125 and -65." },
          temp: { type: Type.NUMBER, description: "Temperature in Celsius, between -40 and 5." },
          pressure: { type: Type.NUMBER, description: "Sea level pressure in hPa, between 1010 and 1050." },
          windSpeed: { type: Type.NUMBER, description: "Wind speed in km/h, between 10 and 80." },
          windDirection: { type: Type.NUMBER, description: "Wind direction in degrees (0-360)." },
        },
        required: ["lat", "lon", "temp", "pressure", "windSpeed", "windDirection"],
      },
    },
    dashboardData: {
      type: Type.OBJECT,
      description: "Data for the dashboard widgets.",
      properties: {
        eventName: { type: Type.STRING, description: "A creative name for the cold air outbreak event, e.g., 'Polar Vortex Intrusion of Winter 2024'." },
        eventDate: { type: Type.STRING, description: "The simulated date of the event in 'Month DD, YYYY' format." },
        maxExtent: { type: Type.NUMBER, description: "Maximum geospatial extent of the outbreak in square kilometers." },
        minTemperature: { type: Type.NUMBER, description: "The lowest temperature recorded during the event in Celsius." },
        monthlyFrequency: {
          type: Type.ARRAY,
          description: "Simulated count of similar events per month over the last year.",
          items: {
            type: Type.OBJECT,
            properties: {
              month: { type: Type.STRING, description: "Month abbreviation (e.g., 'Jan', 'Feb')." },
              count: { type: Type.NUMBER, description: "Number of events." },
            },
            required: ["month", "count"],
          },
        },
        severityTrend: {
          type: Type.ARRAY,
          description: "Simulated trend of average minimum temperatures for similar events over the last 5 years.",
          items: {
            type: Type.OBJECT,
            properties: {
              year: { type: Type.NUMBER, description: "Year." },
              avgMinTemp: { type: Type.NUMBER, description: "Average minimum temperature in Celsius." },
            },
            required: ["year", "avgMinTemp"],
          },
        },
      },
      required: ["eventName", "eventDate", "maxExtent", "minTemperature", "monthlyFrequency", "severityTrend"],
    },
  },
  required: ["mapData", "dashboardData"],
};

const generateData = async (prompt: string): Promise<OutbreakData> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema,
      },
    });
    
    const jsonText = response.text.trim();
    const data = JSON.parse(jsonText);
    
    // Basic validation to ensure the parsed data matches the expected structure.
    if (!data.mapData || !data.dashboardData) {
        throw new Error("Generated data is missing required fields.");
    }

    return data as OutbreakData;
  } catch (error) {
    console.error("Error generating data from AI model:", error);
    throw new Error("Failed to generate data from the AI model.");
  }
};


export const generateOutbreakData = async (): Promise<OutbreakData> => {
  const prompt = "Generate a dataset simulating a significant cold air outbreak over North America. The data should be scientifically plausible, reflecting typical patterns of such an event: a high-pressure system moving south from the arctic, bringing very cold temperatures. The core of the cold air should be centered over the US Midwest or Great Plains. Ensure the provided data points cover a wide area of the US and Canada.";
  return generateData(prompt);
};

export const generateForecastData = async (date: string, location: string): Promise<OutbreakData> => {
  if (!date || !location) {
    throw new Error("Date and location are required for a forecast.");
  }
  const prompt = `Generate a plausible forecast for a potential cold air outbreak centered around ${location} for the date ${date}. The data should reflect typical meteorological patterns leading to such an event. The core of the cold air should be focused near the specified location, but the data points should cover a wide area of the surrounding region in the US and Canada. The forecast should be scientifically grounded.`;
  return generateData(prompt);
};
