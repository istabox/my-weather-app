import { useRef, useState } from "react"
import { Loader2, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { fetchHistoricStats, type HistoricStats, type MonthlyAvg } from "@/lib/historic"

const STORAGE_KEY = "weather-recent-cities"

function loadRecent(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]")
  } catch {
    return []
  }
}

function barColor(temp: number): string {
  if (temp <= 0) return "#93c5fd"   // blue-300
  if (temp <= 8) return "#6ee7b7"   // emerald-300
  if (temp <= 16) return "#fde68a"  // amber-200
  if (temp <= 24) return "#fb923c"  // orange-400
  return "#f87171"                   // red-400
}

const LEGEND: [string, string][] = [
  ["≤ 0°C", "#93c5fd"],
  ["1–8°C", "#6ee7b7"],
  ["9–16°C", "#fde68a"],
  ["17–24°C", "#fb923c"],
  ["> 24°C", "#f87171"],
]

function MonthlyChart({ months }: { months: MonthlyAvg[] }) {
  const W = 600, H = 265
  const mL = 48, mR = 15, mT = 25, mB = 40
  const plotW = W - mL - mR
  const plotH = H - mT - mB

  const temps = months.map((m) => m.avgTemp)
  const dataMin = Math.min(...temps)
  const dataMax = Math.max(...temps)

  // Snap Y range to multiples of 5, always including 0
  const yMin = Math.floor(Math.min(0, dataMin - 2) / 5) * 5
  const yMax = Math.ceil(Math.max(0, dataMax + 4) / 5) * 5
  const yRange = yMax - yMin

  const sy = (val: number) => (plotH * (yMax - val)) / yRange
  const zeroY = sy(0)

  const barW = plotW / 12
  const pad = 6
  const bw = barW - pad

  const tickStep = yRange > 50 ? 10 : 5
  const ticks: number[] = []
  for (let t = Math.ceil(yMin / tickStep) * tickStep; t <= yMax; t += tickStep) {
    ticks.push(t)
  }

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full"
      aria-label="Monthly average temperature bar chart"
    >
      <g transform={`translate(${mL},${mT})`}>
        {/* Grid lines + Y-axis labels */}
        {ticks.map((t) => (
          <g key={t}>
            <line
              x1={0}
              y1={sy(t)}
              x2={plotW}
              y2={sy(t)}
              stroke="currentColor"
              strokeOpacity={t === 0 ? 0.35 : 0.1}
              strokeWidth={t === 0 ? 1.5 : 1}
              strokeDasharray={t === 0 ? undefined : "3 3"}
            />
            <text
              x={-6}
              y={sy(t)}
              textAnchor="end"
              dominantBaseline="middle"
              fontSize={10}
              fill="currentColor"
              fillOpacity={0.55}
            >
              {t > 0 ? `+${t}` : t}°
            </text>
          </g>
        ))}

        {/* Bars + labels */}
        {months.map((m, i) => {
          const x = i * barW + pad / 2
          const isPos = m.avgTemp >= 0
          const top = sy(isPos ? m.avgTemp : 0)
          const bot = sy(isPos ? 0 : m.avgTemp)
          const bh = Math.max(bot - top, 1)
          // temp label: above bar for positive, below for negative
          const labelY = isPos ? top - 5 : bot + 12

          return (
            <g key={m.month}>
              <rect
                x={x}
                y={top}
                width={bw}
                height={bh}
                rx={3}
                fill={barColor(m.avgTemp)}
              />
              <text
                x={x + bw / 2}
                y={labelY}
                textAnchor="middle"
                fontSize={9}
                fill="currentColor"
                fillOpacity={0.75}
              >
                {m.avgTemp > 0 ? `+${m.avgTemp}` : m.avgTemp}°
              </text>
              <text
                x={x + bw / 2}
                y={plotH + 18}
                textAnchor="middle"
                fontSize={11}
                fill="currentColor"
                fillOpacity={0.65}
              >
                {m.month}
              </text>
            </g>
          )
        })}

        {/* Y-axis border line */}
        <line
          x1={0}
          y1={0}
          x2={0}
          y2={plotH}
          stroke="currentColor"
          strokeOpacity={0.15}
        />

        {/* Extra "0°" label at right edge when there are negative bars */}
        {dataMin < 0 && (
          <text
            x={plotW + 4}
            y={zeroY}
            dominantBaseline="middle"
            fontSize={9}
            fill="currentColor"
            fillOpacity={0.4}
          >
            0°
          </text>
        )}
      </g>
    </svg>
  )
}

export default function WeatherStats() {
  const [query, setQuery] = useState("")
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState<HistoricStats | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recentCities] = useState<string[]>(loadRecent)
  const resultRef = useRef<HTMLDivElement>(null)

  async function runSearch(city: string) {
    const trimmed = city.trim()
    if (!trimmed) return
    setLoading(true)
    setStats(null)
    setError(null)
    try {
      const data = await fetchHistoricStats(trimmed)
      setStats(data)
      setTimeout(() => resultRef.current?.focus(), 0)
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Something went wrong. Please try again."
      )
      setTimeout(() => resultRef.current?.focus(), 0)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section aria-label="Historic weather statistics">
      <form
        role="search"
        onSubmit={(e) => {
          e.preventDefault()
          runSearch(query)
        }}
        className="flex gap-2"
      >
        <Input
          type="search"
          placeholder="Enter a city name…"
          aria-label="City name"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          disabled={loading}
          className="rounded-xl h-11 text-base"
        />
        <Button
          type="submit"
          aria-label="Search historic weather"
          disabled={loading}
          className="rounded-xl h-11 px-5 gap-2 bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-70"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="h-4 w-4" aria-hidden="true" />
          )}
          <span>{loading ? "Loading…" : "Search"}</span>
        </Button>
      </form>

      {/* Recent cities from localStorage */}
      {recentCities.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-2" aria-label="Recent searches">
          {recentCities.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => {
                setQuery(city)
                runSearch(city)
              }}
              disabled={loading}
              className="text-xs px-3 py-1 rounded-full border border-border bg-muted hover:bg-accent transition-colors disabled:opacity-50 cursor-pointer"
            >
              {city}
            </button>
          ))}
        </div>
      )}

      <div aria-live="polite" aria-atomic="true" className="mt-6">
        {error && (
          <div
            ref={resultRef}
            tabIndex={-1}
            className="outline-none rounded-2xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950 px-5 py-4 text-red-700 dark:text-red-400 text-sm"
            role="alert"
          >
            <p className="font-medium">Oops — something went wrong</p>
            <p className="mt-1">{error}</p>
          </div>
        )}

        {stats && (
          <div ref={resultRef} tabIndex={-1} className="outline-none">
            <Card className="rounded-2xl shadow-md border border-blue-100 dark:border-slate-700 bg-white dark:bg-slate-800">
              <CardContent className="p-6">
                <p className="text-lg font-semibold text-blue-700 dark:text-blue-400">
                  {stats.cityName},{" "}
                  <span className="font-normal text-muted-foreground">
                    {stats.country}
                  </span>
                </p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  Monthly average temperature — {stats.year}
                </p>
                <div className="mt-5">
                  <MonthlyChart months={stats.months} />
                </div>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground justify-end">
                  {LEGEND.map(([label, color]) => (
                    <span key={label} className="flex items-center gap-1.5">
                      <span
                        className="inline-block w-3 h-3 rounded-sm flex-shrink-0"
                        style={{ background: color }}
                      />
                      {label}
                    </span>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </section>
  )
}
