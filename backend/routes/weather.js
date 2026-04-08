/**
 * weather.js — OpenWeatherMap proxy route
 *
 * GET /api/weather?city=Ahmedabad&lat=23.02&lon=72.57
 *
 * When OPENWEATHER_KEY is not set → returns mock data so the app
 * works without an API key and auto-activates once key is added.
 *
 * Free API key: openweathermap.org → Sign up → API keys (1000 calls/day free)
 */

const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/auth');

router.use(protect);

// ── Mock weather data (used when no API key) ─────────────────────────────────
const MOCK = {
  city: 'Ahmedabad',
  country: 'IN',
  temp: 32,
  feelsLike: 36,
  humidity: 55,
  windSpeed: 14,
  condition: 'Clear',
  description: 'clear sky',
  icon: '01d',
  sunrise: '06:15',
  sunset: '19:48',
  forecast: [
    { date: 'Today',     high: 34, low: 26, condition: 'Clear',         icon: '01d', rain: 0   },
    { date: 'Tomorrow',  high: 31, low: 24, condition: 'Partly Cloudy', icon: '02d', rain: 10  },
    { date: 'Day 3',     high: 28, low: 22, condition: 'Light Rain',    icon: '10d', rain: 70  },
    { date: 'Day 4',     high: 30, low: 23, condition: 'Clear',         icon: '01d', rain: 5   },
    { date: 'Day 5',     high: 33, low: 25, condition: 'Partly Cloudy', icon: '02d', rain: 15  },
  ],
  mock: true,
};

// ── Format helper ─────────────────────────────────────────────────────────────
const formatTime = (unix) => {
  const d = new Date(unix * 1000);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
};

const dayName = (unix) => {
  const days = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  return days[new Date(unix * 1000).getDay()];
};

// ── GET /api/weather ──────────────────────────────────────────────────────────
router.get('/', async (req, res) => {
  const key  = process.env.OPENWEATHER_KEY;
  const city = req.query.city || 'Ahmedabad';
  const lat  = req.query.lat;
  const lon  = req.query.lon;

  if (!key) {
    console.log('[Weather] No API key — returning mock data. Add OPENWEATHER_KEY to .env for live data.');
    return res.json({ success: true, weather: MOCK });
  }

  try {
    const axios = require('axios');

    // Current weather
    const coordQ = (lat && lon) ? `lat=${lat}&lon=${lon}` : `q=${encodeURIComponent(city)},IN`;
    const [current, forecast] = await Promise.all([
      axios.get(`https://api.openweathermap.org/data/2.5/weather?${coordQ}&appid=${key}&units=metric`),
      axios.get(`https://api.openweathermap.org/data/2.5/forecast?${coordQ}&appid=${key}&units=metric&cnt=40`),
    ]);

    const c   = current.data;
    const fcl = forecast.data.list;

    // Group forecast by day (pick noon reading for each day)
    const days = {};
    fcl.forEach(item => {
      const date = new Date(item.dt * 1000);
      const key  = date.toDateString();
      if (!days[key]) days[key] = [];
      days[key].push(item);
    });

    const fiveDays = Object.entries(days).slice(0, 5).map(([k, items], i) => {
      const noon   = items.find(it => new Date(it.dt * 1000).getHours() === 12) || items[0];
      const highs  = items.map(it => it.main.temp_max);
      const lows   = items.map(it => it.main.temp_min);
      const rains  = items.map(it => it.pop * 100);
      return {
        date:      i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : dayName(noon.dt),
        high:      Math.round(Math.max(...highs)),
        low:       Math.round(Math.min(...lows)),
        condition: noon.weather[0].main,
        description: noon.weather[0].description,
        icon:      noon.weather[0].icon,
        rain:      Math.round(Math.max(...rains)),
      };
    });

    res.json({
      success: true,
      weather: {
        city:        c.name,
        country:     c.sys.country,
        temp:        Math.round(c.main.temp),
        feelsLike:   Math.round(c.main.feels_like),
        humidity:    c.main.humidity,
        windSpeed:   Math.round(c.wind.speed * 3.6), // m/s → km/h
        condition:   c.weather[0].main,
        description: c.weather[0].description,
        icon:        c.weather[0].icon,
        sunrise:     formatTime(c.sys.sunrise),
        sunset:      formatTime(c.sys.sunset),
        forecast:    fiveDays,
        mock:        false,
      },
    });
  } catch (err) {
    console.error('[Weather] API error:', err.message);
    res.json({ success: true, weather: { ...MOCK, city, apiError: err.message } });
  }
});

module.exports = router;
