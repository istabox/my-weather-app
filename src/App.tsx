import { useEffect, useState } from "react"
import Header from "./components/Header"
import WeatherSearch from "./components/WeatherSearch"

export default function App() {
  const [isDark, setIsDark] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
  )

  useEffect(() => {
    document.documentElement.classList.toggle("dark", isDark)
  }, [isDark])

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = (e: MediaQueryListEvent) => setIsDark(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  return (
    <div className="min-h-screen bg-[var(--app-bg)]">
      <Header isDark={isDark} onToggle={() => setIsDark((d) => !d)} />
      <main className="container mx-auto px-4 py-10 max-w-2xl">
        <WeatherSearch />
      </main>
    </div>
  )
}
