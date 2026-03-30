import { useEffect, useState } from "react"
import Header from "./components/Header"
import WeatherSearch from "./components/WeatherSearch"
import WeatherStats from "./components/WeatherStats"

type Tab = "current" | "history"

const TABS: { id: Tab; label: string }[] = [
  { id: "current", label: "Current Weather" },
  { id: "history", label: "Historical Stats" },
]

export default function App() {
  const [isDark, setIsDark] = useState(() =>
    window.matchMedia("(prefers-color-scheme: dark)").matches
  )
  const [activeTab, setActiveTab] = useState<Tab>("current")

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
        <nav
          className="flex gap-1 mb-8 border-b border-border"
          role="tablist"
          aria-label="App sections"
        >
          {TABS.map(({ id, label }) => (
            <button
              key={id}
              role="tab"
              aria-selected={activeTab === id}
              onClick={() => setActiveTab(id)}
              className={[
                "px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors",
                activeTab === id
                  ? "border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {label}
            </button>
          ))}
        </nav>

        {activeTab === "current" ? <WeatherSearch /> : <WeatherStats />}
      </main>
    </div>
  )
}
