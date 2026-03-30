import { useRef, useState } from "react"
import { Loader2, MapPin, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { fetchWeather, reverseGeocode, type WeatherData } from "@/lib/weather"
import WeatherResult from "./WeatherResult"

type Status = "idle" | "loading" | "success" | "error"
type GeoStatus = "idle" | "loading" | "denied" | "unavailable"

const STORAGE_KEY = "weather-recent-cities"
const MAX_RECENT = 5

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")
  } catch {
    return []
  }
}

function saveRecent(city: string): string[] {
  const prev = loadRecent().filter((c) => c.toLowerCase() !== city.toLowerCase())
  const next = [city, ...prev].slice(0, MAX_RECENT)
  localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
  return next
}

export default function WeatherSearch() {
  const [searchQuery, setSearchQuery] = useState("")
  const [status, setStatus] = useState<Status>("idle")
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [recentCities, setRecentCities] = useState<string[]>(loadRecent)
  const [geoStatus, setGeoStatus] = useState<GeoStatus>(
    "geolocation" in navigator ? "idle" : "unavailable"
  )
  const resultRef = useRef<HTMLDivElement>(null)

  async function runSearch(city: string) {
    const trimmed = city.trim()
    if (!trimmed) return

    setStatus("loading")
    setWeatherData(null)
    setErrorMessage(null)

    try {
      const data = await fetchWeather(trimmed)
      setWeatherData(data)
      setStatus("success")
      setRecentCities(saveRecent(data.current.cityName))
      setTimeout(() => resultRef.current?.focus(), 0)
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Something went wrong. Please try again.")
      setStatus("error")
      setTimeout(() => resultRef.current?.focus(), 0)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    await runSearch(searchQuery)
  }

  async function handleGeolocate() {
    setGeoStatus("loading")
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { name } = await reverseGeocode(
            position.coords.latitude,
            position.coords.longitude
          )
          setSearchQuery(name)
          setGeoStatus("idle")
          await runSearch(name)
        } catch (err) {
          setGeoStatus("idle")
          setErrorMessage(
            err instanceof Error ? err.message : "Could not determine your city from your location."
          )
          setStatus("error")
        }
      },
      (err) => {
        setGeoStatus(err.code === err.PERMISSION_DENIED ? "denied" : "unavailable")
      }
    )
  }

  const isLoading = status === "loading" || geoStatus === "loading"

  return (
    <section aria-label="Weather search">
      <form role="search" onSubmit={handleSubmit} className="flex gap-2">
        <Input
          type="search"
          placeholder="Enter a city name…"
          aria-label="City name"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          disabled={isLoading}
          className="rounded-xl h-11 text-base"
        />
        <Button
          type="submit"
          aria-label="Search weather"
          disabled={isLoading}
          className="rounded-xl h-11 px-5 gap-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-70"
        >
          {status === "loading" ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="h-4 w-4" aria-hidden="true" />
          )}
          <span>{status === "loading" ? "Searching…" : "Search"}</span>
        </Button>
      </form>

      {/* Geolocation */}
      {geoStatus !== "unavailable" && (
        <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={handleGeolocate}
            disabled={isLoading}
            className="gap-1.5 text-sm text-muted-foreground hover:text-foreground px-2 h-7"
          >
            {geoStatus === "loading" ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <MapPin className="h-3.5 w-3.5" aria-hidden="true" />
            )}
            <span>{geoStatus === "loading" ? "Detecting location…" : "Use my location"}</span>
          </Button>
          {geoStatus === "denied" && (
            <span className="text-xs text-amber-600 dark:text-amber-400">
              Location access was denied. You can enable it in your browser settings.
            </span>
          )}
        </div>
      )}

      {/* Recent searches */}
      {recentCities.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Recent searches">
          {recentCities.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => {
                setSearchQuery(city)
                runSearch(city)
              }}
              disabled={isLoading}
              className="text-xs px-3 py-1 rounded-full border border-border bg-muted hover:bg-accent transition-colors disabled:opacity-50 cursor-pointer"
            >
              {city}
            </button>
          ))}
        </div>
      )}

      <div aria-live="polite" aria-atomic="true" className="mt-6">
        {status === "error" && errorMessage && (
          <div
            ref={resultRef}
            tabIndex={-1}
            className="outline-none rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-5 py-4 text-red-700 dark:text-red-400 text-sm"
            role="alert"
          >
            <p className="font-medium">Oops — something went wrong</p>
            <p className="mt-1">{errorMessage}</p>
          </div>
        )}

        {status === "success" && weatherData && (
          <WeatherResult
            ref={resultRef}
            current={weatherData.current}
            forecast={weatherData.forecast}
          />
        )}
      </div>
    </section>
  )
}
