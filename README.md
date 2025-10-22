# Cold Air Explorer

Cold Air Explorer is a web application that visualizes simulated and forecasted Cold Air Outbreaks over North America. It leverages the power of Google's Gemini generative AI to create scientifically plausible meteorological datasets on demand, which are then rendered as an interactive map and a detailed dashboard.

## Features

-   **AI-Powered Data Generation**: Generates complex weather data using the Gemini API.
-   **Two Operational Modes**:
    -   **Simulation Mode**: Creates a plausible historical cold air outbreak event.
    -   **Forecast Mode**: Generates a potential future event based on a user-provided date and location.
-   **Interactive Map Visualization**:
    -   Displays outbreak data points over a map of North America using D3.js.
    -   Supports smooth zooming and panning to explore specific regions.
    -   Allows users to save their current map view (zoom, pan, active layer) to `localStorage` and load it back later.
-   **Multiple Data Layers**: Users can toggle between different meteorological views on the map:
    -   **Temperature**: Shows individual data points colored by temperature.
    -   **Pressure**: Renders a contour plot (isobars) of the pressure system.
    -   **Wind**: Displays a heatmap of wind speed.
-   **Comprehensive Dashboard**:
    -   Shows key metrics like the event name, minimum temperature, and maximum geospatial extent.
    -   Includes charts visualizing monthly event frequency and long-term severity trends using Recharts.
-   **Robust Error Handling**: Validates the AI's response to ensure data integrity and provides clear feedback to the user if an error occurs.

## How to Use

1.  **Select a Mode**: Upon loading, you can choose between `Simulation` and `Forecast` mode in the header.
2.  **Generate Data**:
    -   In **Simulation Mode**, simply click the "Simulate New Outbreak" button. The AI will generate a complete dataset for a hypothetical event.
    -   In **Forecast Mode**, enter a future date and a location (e.g., "Denver, CO") and click "Generate Forecast".
3.  **Explore the Map**:
    -   Use your mouse wheel to **zoom** in and out.
    -   Click and drag to **pan** across the map.
    -   Use the toggle buttons at the top-right of the map to switch between `Temperature`, `Pressure`, and `Wind` layers.
    -   In the Temperature layer, hover over individual points to see a detailed tooltip.
4.  **Save Your View**:
    -   Once you have a map view you'd like to keep, click the "Save View" button in the header.
    -   To return to this view later, click the "Load View" button.
5.  **Analyze the Dashboard**:
    -   On the left, the dashboard provides a summary of the generated event, including charts that provide historical context.

## Technical Stack

-   **Frontend**: React, TypeScript, D3.js, Recharts
-   **Styling**: Tailwind CSS
-   **AI Model**: Google Gemini (`@google/genai`)

## File Structure

```
.
├── index.html              # Main HTML entry point
├── index.tsx               # React application root
├── App.tsx                 # Main application component and state management
├── README.md               # Application documentation
├── metadata.json           # Application metadata
├── types.ts                # TypeScript type definitions for the data
│
├── components/
│   ├── Dashboard.tsx       # Component for all dashboard charts and stats
│   ├── NorthAmericaMap.tsx # The interactive D3.js map component
│   └── icons.tsx           # SVG icon components
│
└── services/
    └── geminiService.ts    # Logic for calling and validating the Gemini API
```
