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
          lat: { type: Type.NUMBER, description: "Latitude, between -60 and 75." },
          lon: { type: Type.NUMBER, description: "Longitude, between -180 and 180." },
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
        eventName: { type: Type.STRING, description: "A creative name for the cold air outbreak event, e.g., 'Siberian Express of Winter 2024'." },
        eventDate: { type: Type.STRING, description: "The simulated date of the event in 'Month DD, YYYY' format." },
        maxExtent: { type: Type.NUMBER, description: "Maximum geospatial extent of the outbreak in square kilometers." },
        minTemperature: { type: Type.NUMBER, description: "The lowest temperature recorded during the event in Celsius." },
        maxPressure: { type: Type.NUMBER, description: "The highest pressure recorded during the event in hPa." },
        maxWindSpeed: { type: Type.NUMBER, description: "The highest wind speed recorded during the event in km/h." },
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
        pressureTrend: {
          type: Type.ARRAY,
          description: "Simulated trend of average maximum pressure for similar events over the last 5 years.",
          items: {
            type: Type.OBJECT,
            properties: {
              year: { type: Type.NUMBER, description: "Year." },
              avgMaxPressure: { type: Type.NUMBER, description: "Average maximum pressure in hPa." },
            },
            required: ["year", "avgMaxPressure"],
          },
        },
        windTrend: {
          type: Type.ARRAY,
          description: "Simulated trend of average maximum wind speed for similar events over the last 5 years.",
          items: {
            type: Type.OBJECT,
            properties: {
              year: { type: Type.NUMBER, description: "Year." },
              avgMaxWind: { type: Type.NUMBER, description: "Average maximum wind speed in km/h." },
            },
            required: ["year", "avgMaxWind"],
          },
        },
        report: {
            type: Type.STRING,
            description: "A comprehensive meteorological analysis report of the event in Markdown format. The report should be well-structured with a title (as a heading), a summary paragraph, and sections for 'Key Metrics', 'Geospatial Extent and Affected Areas', and 'Historical Context and Trends'. The tone should be formal and informative."
        }
      },
      required: ["eventName", "eventDate", "maxExtent", "minTemperature", "maxPressure", "maxWindSpeed", "monthlyFrequency", "severityTrend", "pressureTrend", "windTrend", "report"],
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
    if (!data.mapData || !data.dashboardData || !data.dashboardData.report) {
        throw new Error("Generated data is missing required fields, including the analysis report.");
    }

    return data as OutbreakData;
  } catch (error) {
    console.error("Error generating data from AI model:", error);
    throw new Error("Failed to generate data from the AI model.");
  }
};


export const generateOutbreakData = async (): Promise<OutbreakData> => {
  const prompt = "Generate a dataset simulating a significant cold air outbreak over a major continental landmass (e.g., North America, Europe, or Asia). The data should be scientifically plausible, reflecting typical patterns of such an event: a high-pressure system moving south from the arctic, bringing very cold temperatures. The core of the cold air should be centered over a plausible region for such an event. Ensure the provided data points cover a wide area of the affected continent.";
  return generateData(prompt);
};

export const generateForecastData = async (date: string, location: string): Promise<OutbreakData> => {
  if (!date || !location) {
    throw new Error("Date and location are required for a forecast.");
  }
  const prompt = `Generate a plausible forecast for a potential cold air outbreak centered around ${location} for the date ${date}. The data should reflect typical meteorological patterns leading to such an event. The core of the cold air should be focused near the specified location, but the data points should cover a wide area of the surrounding region. The forecast should be scientifically grounded.`;
  return generateData(prompt);
};