const OWM_KEY = import.meta.env.VITE_WEATHER_API_KEY as string
const OWM_BASE = "https://api.openweathermap.org"

export interface MonthlyAvg {
  month: string
  avgTemp: number
}

export interface HistoricStats {
  cityName: string
  country: string
  year: number
  months: MonthlyAvg[]
}

async function geocode(city: string) {
  const res = await fetch(
    `${OWM_BASE}/geo/1.0/direct?q=${encodeURIComponent(city)}&limit=1&appid=${OWM_KEY}`
  )
  if (!res.ok) throw new Error("Unable to reach the weather service. Please try again.")
  const data: Array<{ lat: number; lon: number; name: string; country: string }> =
    await res.json()
  if (data.length === 0)
    throw new Error(`City "${city}" not found. Please check the spelling and try again.`)
  return data[0]
}

const MONTH_NAMES = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
]

export async function fetchHistoricStats(city: string): Promise<HistoricStats> {
  const { lat, lon, name, country } = await geocode(city)

  // Fetch the previous full calendar year so every month has complete data
  const year = new Date().getFullYear() - 1

  const res = await fetch(
    `https://archive-api.open-meteo.com/v1/archive` +
    `?latitude=${lat}&longitude=${lon}` +
    `&start_date=${year}-01-01&end_date=${year}-12-31` +
    `&daily=temperature_2m_max,temperature_2m_min&timezone=auto`
  )
  if (!res.ok) throw new Error("Unable to fetch historic weather data. Please try again.")

  const data: {
    daily: {
      time: string[]
      temperature_2m_max: (number | null)[]
      temperature_2m_min: (number | null)[]
    }
  } = await res.json()

  const sums = new Array(12).fill(0)
  const counts = new Array(12).fill(0)

  for (let i = 0; i < data.daily.time.length; i++) {
    const tmax = data.daily.temperature_2m_max[i]
    const tmin = data.daily.temperature_2m_min[i]
    if (tmax == null || tmin == null) continue
    const month = new Date(`${data.daily.time[i]}T12:00:00`).getMonth()
    sums[month] += (tmax + tmin) / 2
    counts[month]++
  }

  const months: MonthlyAvg[] = MONTH_NAMES.map((month, i) => ({
    month,
    avgTemp:
      counts[i] > 0 ? Math.round((sums[i] / counts[i]) * 10) / 10 : 0,
  }))

  return { cityName: name, country, year, months }
}
