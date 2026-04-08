import React, { useState, useEffect } from 'react';
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

export default function WeatherWidget({ city = 'Ahmedabad' }) {
  const [weather,   setWeather]   = useState(null);
  const [loading,   setLoading]   = useState(true);
  const [expanded,  setExpanded]  = useState(false);
  const [lastFetch, setLastFetch] = useState(null);

  const load = () => {
    setLoading(true);
    api.get(`/weather?city=${city}`)
      .then(r => { setWeather(r.data.weather); setLastFetch(new Date()); })
      .catch(() => setWeather(null))
      .finally(() => setLoading(false));
  };

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
  const todayFc  = weather.forecast?.[0];

  return (
    <div className="card overflow-hidden p-0">
      {/* Main weather card */}
      <div className={`bg-gradient-to-br ${bg} text-white p-4`}>
        {weather.mock && (
          <div className="flex items-center gap-1.5 bg-white/20 rounded-lg px-2.5 py-1 text-xs font-medium mb-3 w-fit">
            <AlertTriangle size={11} /> Demo data — add OPENWEATHER_KEY for live weather
          </div>
        )}
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-1 text-white/80 text-sm mb-1">
              <span>📍 {weather.city}, {weather.country}</span>
              <button onClick={load} className="ml-1 hover:text-white"><RefreshCw size={11} /></button>
            </div>
            <div className="flex items-end gap-1">
              <span className="text-5xl font-light">{weather.temp}°</span>
              <span className="text-xl pb-1">C</span>
            </div>
            <p className="text-white/90 capitalize mt-0.5">{weather.description}</p>
            <p className="text-white/70 text-xs mt-0.5">Feels like {weather.feelsLike}°C</p>
          </div>
          {weather.icon && (
            <img src={ICON_URL(weather.icon)} alt={weather.condition} className="w-20 h-20 drop-shadow-lg" />
          )}
        </div>

        {/* Stats row */}
        <div className="flex gap-4 mt-3 pt-3 border-t border-white/20 text-xs">
          <div className="flex items-center gap-1"><Droplets size={12} /> {weather.humidity}%</div>
          <div className="flex items-center gap-1"><Wind size={12} /> {weather.windSpeed} km/h</div>
          {weather.sunrise && <div className="flex items-center gap-1"><Sunrise size={12} /> {weather.sunrise}</div>}
          {weather.sunset  && <div className="flex items-center gap-1"><Sunset  size={12} /> {weather.sunset}</div>}
        </div>
      </div>

      {/* Rain alert */}
      {rainDays.length > 0 && (
        <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 flex items-center gap-2 text-sm text-blue-800">
          <AlertTriangle size={14} className="text-blue-500 shrink-0" />
          <span>
            <strong>Rain Alert:</strong> {rainDays.map(d => d.date).join(', ')} — plan site work accordingly
          </span>
        </div>
      )}

      {/* 5-day forecast toggle */}
      <div className="px-4 py-2">
        <button onClick={() => setExpanded(!expanded)}
          className="w-full flex items-center justify-between text-xs text-gray-500 hover:text-gray-700 py-1">
          <span className="font-medium">5-Day Forecast</span>
          <span>{expanded ? '▲' : '▼'}</span>
        </button>

        {expanded && (
          <div className="grid grid-cols-5 gap-1 pb-3 mt-1">
            {(weather.forecast || []).map((day, i) => (
              <div key={i} className={`text-center p-2 rounded-xl ${
                day.rain > 50 ? 'bg-blue-50 border border-blue-100' :
                day.rain > 20 ? 'bg-sky-50' : 'bg-gray-50'
              }`}>
                <p className="text-xs font-medium text-gray-600 truncate">{day.date}</p>
                {day.icon
                  ? <img src={ICON_URL(day.icon)} alt={day.condition} className="w-8 h-8 mx-auto" />
                  : <Cloud size={20} className="text-gray-400 mx-auto my-1" />}
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
