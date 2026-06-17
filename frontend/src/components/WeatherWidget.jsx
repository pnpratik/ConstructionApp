import React, { useState, useEffect, useRef } from 'react';
import { Cloud, Wind, Droplets, Thermometer, Sunrise, Sunset, AlertTriangle, RefreshCw } from 'lucide-react';
import api from '../api/axios';

const ICON_URL = (icon) => `https://openweathermap.org/img/wn/${icon}@2x.png`;

const CONDITION_BG = {
  Clear:          'from-orange-400 to-yellow-300',
  Clouds:         'from-gray-400 to-blue-300',
  Rain:           'from-blue-600 to-blue-400',
  Drizzle:        'from-blue-500 to-teal-400',
  Thunderstorm:   'from-gray-700 to-indigo-600',
  Snow:           'from-blue-200 to-white',
  Mist:           'from-gray-400 to-gray-300',
  Haze:           'from-yellow-300 to-gray-300',
  default:        'from-blue-500 to-blue-400',
};

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes in ms

export default function WeatherWidget({ city = 'Ahmedabad' }) {
  const [weather,   setWeather]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [expanded,  setExpanded]  = useState(false);

  // Cache refs — survive re-renders, don't trigger re-renders
  const lastFetchRef  = useRef(null);   // timestamp of last successful fetch
  const cachedDataRef = useRef(null);   // cached weather data

  const load = (force = false) => {
    // Skip if fetched < 5 min ago and not a manual refresh
    if (!force && lastFetchRef.current && cachedDataRef.current) {
      const age = Date.now() - lastFetchRef.current;
      if (age < CACHE_TTL) {
        setWeather(cachedDataRef.current);
        setLoading(false);
        return;
      }
    }

    setLoading(true);
    api.get(`/weather?city=${city}`)
      .then(r => {
        const data = r.data.weather;
        setWeather(data);
        cachedDataRef.current = data;
        lastFetchRef.current  = Date.now();
      })
      .catch(() => {
        // Fall back to cached data if available
        if (cachedDataRef.current) setWeather(cachedDataRef.current);
        else setWeather(null);
      })
      .finally(() => setLoading(false));
  };

  // Only run once on mount (or when city changes)
  useEffect(() => { load(); }, [city]);

  if (loading) return (
    <div className="card flex items-center gap-3 py-5">
      <div className="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
      <span className="text-sm text-gray-500">Loading weather...</span>
    </div>
  );

  if (!weather) return null;

  const bg       = CONDITION_BG[weather.condition] || CONDITION_BG.default;
  const rainDays = (weather.forecast || []).filter(d => d.rain > 50);

  return (
    <div className="card overflow-hidden p-0">
      {/* Main weather card */}
      <div className={`bg-gradient-to-br ${bg} text-white p-3 md:p-4`}>
        {weather.mock && (
          <div className="flex items-center gap-1.5 bg-white/20 rounded-lg px-2.5 py-1 text-xs font-medium mb-3 w-fit">
            <AlertTriangle size={11} /> Demo data — add OPENWEATHER_KEY for live weather
          </div>
        )}
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="flex items-center gap-1 text-white/80 text-xs md:text-sm mb-1 flex-wrap">
              <span className="truncate">📍 {weather.city}, {weather.country}</span>
              <button onClick={() => load(true)} className="ml-1 hover:text-white flex-shrink-0" title="Refresh weather">
                <RefreshCw size={11} />
              </button>
            </div>
            <div className="flex items-end gap-1">
              <span className="text-4xl md:text-5xl font-light">{weather.temp}°</span>
              <span className="text-lg md:text-xl pb-1">C</span>
            </div>
            <p className="text-white/90 capitalize mt-0.5 text-sm md:text-base">{weather.description}</p>
            <p className="text-white/70 text-xs mt-0.5">Feels like {weather.feelsLike}°C</p>
          </div>
          {weather.icon && (
            <img src={ICON_URL(weather.icon)} alt={weather.condition} className="w-14 h-14 md:w-20 md:h-20 drop-shadow-lg flex-shrink-0" />
          )}
        </div>

        {/* Stats row */}
        <div className="flex flex-wrap gap-3 mt-3 pt-3 border-t border-white/20 text-xs">
          <div className="flex items-center gap-1"><Droplets size={12} /> {weather.humidity}%</div>
          <div className="flex items-center gap-1"><Wind size={12} /> {weather.windSpeed} km/h</div>
          {weather.sunrise && <div className="flex items-center gap-1 hidden sm:flex"><Sunrise size={12} /> {weather.sunrise}</div>}
          {weather.sunset  && <div className="flex items-center gap-1 hidden sm:flex"><Sunset  size={12} /> {weather.sunset}</div>}
        </div>
      </div>

      {/* Rain alert */}
      {rainDays.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-100 px-3 md:px-4 py-2 flex items-start gap-2 text-sm text-blue-800">
          <AlertTriangle size={14} className="text-blue-500 shrink-0 mt-0.5" />
          <span className="text-xs md:text-sm">
            <strong>Rain Alert:</strong> {rainDays.map(d => d.date).join(', ')} — plan site work accordingly
          </span>
        </div>
      )}

      {/* 5-day forecast toggle */}
      <div className="px-3 md:px-4 py-2">
        <button onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-xs text-gray-500 hover:text-gray-700 py-1">
          <span className="font-medium">5-Day Forecast</span>
          <span>{expanded ? '▲' : '▼'}</span>
        </button>

        {expanded && (
          <div className="grid grid-cols-5 gap-1 pb-3 mt-1">
            {(weather.forecast || []).map((day, i) => (
              <div key={i} className={`text-center p-1.5 md:p-2 rounded-xl ${
                day.rain > 50 ? 'bg-blue-50 border border-blue-100' :
                day.rain > 20 ? 'bg-sky-50' : 'bg-gray-50'
              }`}>
                <p className="text-xs font-medium text-gray-600 truncate">{day.date}</p>
                {day.icon
                  ? <img src={ICON_URL(day.icon)} alt={day.condition} className="w-7 h-7 md:w-8 md:h-8 mx-auto" />
                  : <Cloud size={18} className="text-gray-400 mx-auto my-1" />}
                <p className="text-xs font-bold text-gray-800">{day.high}°</p>
                <p className="text-xs text-gray-400">{day.low}°</p>
                {day.rain > 0 && (
                  <p className={`text-xs font-medium mt-0.5 ${day.rain > 50 ? 'text-blue-600' : 'text-gray-400'}`}>
                    {day.rain}%
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
