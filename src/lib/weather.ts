const API_KEY = import.meta.env.VITE_WEATHER_API_KEY as string
const BASE = "https://api.openweathermap.org"

export interface CurrentWeather {
  cityName: string
  country: string
  temp: number
  feelsLike: number
  condition: string
  description: string
  iconCode: string
  humidity: number
  windSpeed: number // m/s
}

export interface ForecastDay {
  date: string
  dayLabel: string
  high: number
  low: number
  iconCode: string
  condition: string
}

export interface WeatherData {
  current: CurrentWeather
  forecast: ForecastDay[]
}

// Step 1: city name → lat/lon
async function geocode(
  city: string
): Promise<{ lat: number; lon: number; name: string; country: string }> {
  const res = await fetch(
    `${BASE}/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${API_KEY}`
  )
  if (!res.ok) throw new Error("Unable to reach the weather service. Please try again.")
  const data: Array<{ lat: number; lon: number; name: string; country: string }> =
    await res.json()
  if (data.length === 0)
    throw new Error(`City "${city}" not found. Please check the spelling and try again.`)
  return { lat: data[0].lat, lon: data[0].lon, name: data[0].name, country: data[0].country }
}

// Step 2a: current weather at coords
async function fetchCurrent(
  lat: number,
  lon: number,
  cityName: string,
  country: string
): Promise<CurrentWeather> {
  const res = await fetch(
    `${BASE}/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
  )
  if (!res.ok) throw new Error("Failed to fetch current weather. Please try again.")
  const d = await res.json()
  return {
    cityName,
    country,
    temp: Math.round(d.main.temp),
    feelsLike: Math.round(d.main.feels_like),
    condition: d.weather[0].main as string,
    description: d.weather[0].description as string,
    iconCode: d.weather[0].icon as string,
    humidity: d.main.humidity as number,
    windSpeed: d.wind.speed as number,
  }
}

// Step 2b: 5-day / 3-hour forecast at coords, grouped into daily summaries
async function fetchForecast(lat: number, lon: number): Promise<ForecastDay[]> {
  const res = await fetch(
    `${BASE}/data/2.5/forecast?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
  )
  if (!res.ok) throw new Error("Failed to fetch forecast. Please try again.")

  const data: {
    list: Array<{
      dt_txt: string
      main: { temp: number }
      weather: Array<{ main: string; icon: string }>
    }>
  } = await res.json()

  // Group 3-hour slots by calendar date
  const byDay: Record<
    string,
    Array<{ temp: number; icon: string; condition: string }>
  > = {}

  for (const item of data.list) {
    const date = item.dt_txt.slice(0, 10) // "YYYY-MM-DD"
    if (!byDay[date]) byDay[date] = []
    byDay[date].push({
      temp: item.main.temp,
      icon: item.weather[0].icon.replace(/n$/, "d"), // prefer daytime icons
      condition: item.weather[0].main,
    })
  }

  // Skip today; take the next 5 days
  const today = new Date().toISOString().slice(0, 10)
  const futureDays = Object.entries(byDay)
    .filter(([date]) => date > today)
    .slice(0, 5)

  return futureDays.map(([date, slots]) => {
    const temps = slots.map((s) => s.temp)
    const midSlot = slots[Math.floor(slots.length / 2)]
    return {
      date,
      dayLabel: new Date(`${date}T12:00:00`).toLocaleDateString("en-US", {
        weekday: "short",
      }),
      high: Math.round(Math.max(...temps)),
      low: Math.round(Math.min(...temps)),
      iconCode: midSlot.icon,
      condition: midSlot.condition,
    }
  })
}

// Reverse geocode: lat/lon → city name
export async function reverseGeocode(
  lat: number,
  lon: number
): Promise<{ name: string; country: string }> {
  const res = await fetch(
    `${BASE}/geo/1.0/reverse?lat=${lat}&lon=${lon}&limit=1&appid=${API_KEY}`
  )
  if (!res.ok) throw new Error("Unable to determine your location.")
  const data: Array<{ name: string; country: string }> = await res.json()
  if (data.length === 0) throw new Error("Could not identify a city at your location.")
  return { name: data[0].name, country: data[0].country }
}

// Public entry point: geocode then fetch current + forecast in parallel
export async function fetchWeather(city: string): Promise<WeatherData> {
  const { lat, lon, name, country } = await geocode(city)
  const [current, forecast] = await Promise.all([
    fetchCurrent(lat, lon, name, country),
    fetchForecast(lat, lon),
  ])
  return { current, forecast }
}
