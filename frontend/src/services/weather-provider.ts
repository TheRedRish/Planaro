export interface WeatherForecast {
  time: string;
  is_day: number;
  precipitation_probability: number;
  weather_code: number;
}

export async function fetchWeather(lat: number, lon: number): Promise<WeatherForecast[]> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=precipitation_probability,weather_code,is_day&timezone=auto`;
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to fetch weather: ${response.statusText}`);
  }

  const data = await response.json();
  const hourly = data.hourly;
  
  return hourly.time.map((time: string, index: number) => ({
    time,
    is_day: hourly.is_day[index],
    precipitation_probability: hourly.precipitation_probability[index],
    weather_code: hourly.weather_code[index],
  }));
}

export function isWeatherFavorable(forecasts: WeatherForecast[], time: Date): boolean {
  const timeStr = time.toISOString().slice(0, 14) + '00'; // Round to hour
  const forecast = forecasts.find(f => f.time.startsWith(timeStr.slice(0, 13)));
  
  if (!forecast) return true; // Assume favorable if no data

  // Simple rule: favorable if precipitation probability < 30%
  return forecast.precipitation_probability < 30;
}
