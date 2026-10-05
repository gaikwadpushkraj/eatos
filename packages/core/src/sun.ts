import { DAY, MINUTE, dayStart } from './time';

/** The seven metros, with coordinates for sunrise and sunset. */
export const CITIES: Record<string, { name: string; lat: number; lon: number }> = {
  mumbai: { name: 'Mumbai', lat: 19.076, lon: 72.8777 },
  delhi: { name: 'Delhi NCR', lat: 28.6139, lon: 77.209 },
  bengaluru: { name: 'Bengaluru', lat: 12.9716, lon: 77.5946 },
  hyderabad: { name: 'Hyderabad', lat: 17.385, lon: 78.4867 },
  chennai: { name: 'Chennai', lat: 13.0827, lon: 80.2707 },
  kolkata: { name: 'Kolkata', lat: 22.5726, lon: 88.3639 },
  pune: { name: 'Pune', lat: 18.5204, lon: 73.8567 },
};

const DEFAULT = { lat: 21.15, lon: 79.09 }; // Nagpur, near the middle of India

const rad = (d: number) => (d * Math.PI) / 180;
const deg = (r: number) => (r * 180) / Math.PI;

function solar(dayOfYear: number, lat: number, lon: number, tz: number, rising: boolean): number {
  // NOAA sunrise/sunset approximation, accurate to a couple of minutes at these latitudes.
  const g = ((2 * Math.PI) / 365) * (dayOfYear - 1);
  const eqTime = 229.18 * (0.000075 + 0.001868 * Math.cos(g) - 0.032077 * Math.sin(g) - 0.014615 * Math.cos(2 * g) - 0.040849 * Math.sin(2 * g));
  const decl = 0.006918 - 0.399912 * Math.cos(g) + 0.070257 * Math.sin(g) - 0.006758 * Math.cos(2 * g) + 0.000907 * Math.sin(2 * g) - 0.002697 * Math.cos(3 * g) + 0.00148 * Math.sin(3 * g);
  const ha = deg(Math.acos(Math.cos(rad(90.833)) / (Math.cos(rad(lat)) * Math.cos(decl)) - Math.tan(rad(lat)) * Math.tan(decl)));
  const solarNoon = 720 - 4 * lon - eqTime + tz;
  return rising ? solarNoon - 4 * ha : solarNoon + 4 * ha;
}

export interface SunTimes {
  /** Epoch ms. */
  sunrise: number;
  sunset: number;
}

/** Sunrise and sunset for the local day containing `t`. */
export function sunTimes(t: number, tzOffsetMin = 330, city?: string): SunTimes {
  const place = (city && CITIES[city]) || DEFAULT;
  const start = dayStart(t, tzOffsetMin);
  const d = new Date(start + tzOffsetMin * MINUTE);
  const doy = Math.floor((Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) - Date.UTC(d.getUTCFullYear(), 0, 0)) / DAY);
  return {
    sunrise: start + solar(doy, place.lat, place.lon, tzOffsetMin, true) * MINUTE,
    sunset: start + solar(doy, place.lat, place.lon, tzOffsetMin, false) * MINUTE,
  };
}

/**
 * Dawn prayer time is approximated as 80 minutes before sunrise. This is a planning aid for
 * when to eat before a fast, not a religious ruling: follow your local timetable.
 */
export function suhoorEnds(sun: SunTimes): number {
  return sun.sunrise - 80 * MINUTE;
}
