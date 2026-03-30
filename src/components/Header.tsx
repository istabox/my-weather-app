import { Moon, Sun } from "lucide-react"

interface HeaderProps {
  isDark: boolean
  onToggle: () => void
}

export default function Header({ isDark, onToggle }: HeaderProps) {
  return (
    <header
      className="bg-[var(--header-bg)] text-[var(--header-text)] py-4 px-6 shadow-md"
      role="banner"
    >
      <div className="container mx-auto max-w-2xl flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">My Weather</h1>

        <button
          onClick={onToggle}
          aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
          className="relative inline-flex h-6 w-11 shrink-0 items-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          style={{
            backgroundColor: isDark ? "rgba(74,222,128,0.8)" : "rgba(255,255,255,0.3)",
            transition: "background-color 0.3s ease",
          }}
        >
          <span
            className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white shadow"
            style={{
              transform: isDark ? "translateX(1.25rem)" : "translateX(0.125rem)",
              transition: "transform 0.3s ease",
            }}
          >
            {isDark ? (
              <Moon className="h-3 w-3 text-blue-800" aria-hidden="true" />
            ) : (
              <Sun className="h-3 w-3 text-yellow-500" aria-hidden="true" />
            )}
          </span>
        </button>
      </div>
    </header>
  )
}
