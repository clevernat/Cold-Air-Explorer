
export interface MapPoint {
  lat: number;
  lon: number;
  temp: number; // in Celsius
  pressure: number; // in hPa
  windSpeed: number; // in km/h
  windDirection: number; // in degrees
}

export interface MonthlyFrequency {
  month: string;
  count: number;
}

export interface SeverityTrend {
  year: number;
  avgMinTemp: number;
}

export interface DashboardData {
  eventName: string;
  eventDate: string;
  maxExtent: number; // in sq km
  minTemperature: number; // in Celsius
  monthlyFrequency: MonthlyFrequency[];
  severityTrend: SeverityTrend[];
}

export interface OutbreakData {
  mapData: MapPoint[];
  dashboardData: DashboardData;
}
