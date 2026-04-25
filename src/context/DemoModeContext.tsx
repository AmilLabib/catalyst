import {
  createContext,
  type ReactNode,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

export type DemoModeContextValue = {
  /**
   * Incrementing token. Components can react (via useEffect) when this value changes.
   * This avoids needing to re-mount routes or keep a global store.
   */
  demoRunId: number;
  triggerDemo: () => void;
};

const DemoModeContext = createContext<DemoModeContextValue | null>(null);

export function DemoModeProvider({ children }: { children: ReactNode }) {
  const [demoRunId, setDemoRunId] = useState(0);

  const triggerDemo = useCallback(() => {
    setDemoRunId((n) => n + 1);
  }, []);

  const value = useMemo(
    () => ({ demoRunId, triggerDemo }),
    [demoRunId, triggerDemo],
  );

  return (
    <DemoModeContext.Provider value={value}>
      {children}
    </DemoModeContext.Provider>
  );
}

export function useDemoMode() {
  const ctx = useContext(DemoModeContext);
  if (!ctx) {
    throw new Error("useDemoMode must be used within DemoModeProvider");
  }
  return ctx;
}
