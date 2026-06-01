import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

interface ThemeContextType {
  isDark: boolean;
  toggleTheme: () => void;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Checks if user previously set a preference, default to light
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem("chatter-theme") === "dark";
  });

  useEffect(() => {
    // Apply or remove the dark class on the html element
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("chatter-theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("chatter-theme", "light");
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  return (
    <ThemeContext.Provider value={{ isDark, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error("useTheme must be used inside ThemeProvider");
  return context;
}
