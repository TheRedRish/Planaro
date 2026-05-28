import { useState, useEffect } from 'react';
import { fetchWeather, type WeatherForecast } from '@/services/weather-provider';

export function useWeather(lat: number = 55.6761, lon: number = 12.5683) {
  const [weather, setWeather] = useState<WeatherForecast[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    setLoading(true);
    fetchWeather(lat, lon)
      .then(setWeather)
      .catch(setError)
      .finally(() => setLoading(false));
  }, [lat, lon]);

  return { weather, loading, error };
}
