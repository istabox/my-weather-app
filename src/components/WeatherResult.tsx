import { forwardRef } from "react"
import { Droplets, Wind } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import type { CurrentWeather, ForecastDay } from "@/lib/weather"

interface WeatherResultProps {
  current: CurrentWeather
  forecast: ForecastDay[]
}

function owmIconUrl(code: string) {
  return `https://openweathermap.org/img/wn/${code}@2x.png`
}

const WeatherResult = forwardRef<HTMLDivElement, WeatherResultProps>(
  ({ current, forecast }, ref) => {
    return (
      <div ref={ref} tabIndex={-1} className="outline-none space-y-4">
        {/* Current weather card */}
        <Card
          className="rounded-2xl shadow-md border border-blue-100 dark:border-slate-700 bg-white dark:bg-slate-800 overflow-hidden"
          aria-label={`Current weather for ${current.cityName}`}
        >
          <CardContent className="p-6">
            {/* City + country */}
            <p className="text-lg font-semibold text-blue-700 dark:text-blue-400">
              {current.cityName},{" "}
              <span className="font-normal text-muted-foreground">{current.country}</span>
            </p>

            {/* Icon + temperature */}
            <div className="flex items-center gap-2 mt-2">
              <img
                src={owmIconUrl(current.iconCode)}
                alt={current.condition}
                width={64}
                height={64}
                className="-ml-2"
              />
              <span className="text-6xl font-bold text-gray-800 dark:text-gray-100 leading-none">
                {current.temp}°C
              </span>
            </div>

            {/* Condition */}
            <p className="mt-1 capitalize text-gray-500 dark:text-gray-400">{current.description}</p>

            {/* Stats row */}
            <div className="mt-4 flex flex-wrap gap-4 text-sm text-gray-600 dark:text-gray-400">
              <span className="flex items-center gap-1.5">
                <Droplets className="h-4 w-4 text-blue-400" aria-hidden="true" />
                <span>
                  Humidity <strong>{current.humidity}%</strong>
                </span>
              </span>
              <span className="flex items-center gap-1.5">
                <Wind className="h-4 w-4 text-blue-400" aria-hidden="true" />
                <span>
                  Wind <strong>{current.windSpeed.toFixed(1)} m/s</strong>
                </span>
              </span>
              <span className="text-gray-400 dark:text-gray-500">
                Feels like {current.feelsLike}°C
              </span>
            </div>
          </CardContent>
        </Card>

        {/* 5-day forecast */}
        {forecast.length > 0 && (
          <section aria-label="5-day forecast">
            <h2 className="text-sm font-medium text-muted-foreground mb-2 px-1">
              5-Day Forecast
            </h2>
            <div className="grid grid-cols-5 gap-2">
              {forecast.map((day) => (
                <Card
                  key={day.date}
                  className="rounded-2xl border border-blue-100 dark:border-slate-700 bg-white dark:bg-slate-800 shadow-sm"
                >
                  <CardContent className="p-3 flex flex-col items-center gap-1">
                    <p className="text-xs font-semibold text-blue-700 dark:text-blue-400">{day.dayLabel}</p>
                    <img
                      src={owmIconUrl(day.iconCode)}
                      alt={day.condition}
                      width={40}
                      height={40}
                      className="-my-1"
                    />
                    <p className="text-xs font-bold text-gray-800 dark:text-gray-100">{day.high}°</p>
                    <p className="text-xs text-muted-foreground">{day.low}°</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}
      </div>
    )
  }
)

WeatherResult.displayName = "WeatherResult"
export default WeatherResult
