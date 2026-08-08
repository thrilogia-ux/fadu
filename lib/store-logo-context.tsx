"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  DEFAULT_STORE_LOGO_SETTINGS,
  normalizeStoreLogoSettings,
  type StoreLogoSettings,
} from "@/lib/store-logo";

type StoreLogoContextValue = {
  settings: StoreLogoSettings;
  loaded: boolean;
  refresh: () => Promise<void>;
};

const StoreLogoContext = createContext<StoreLogoContextValue>({
  settings: DEFAULT_STORE_LOGO_SETTINGS,
  loaded: false,
  refresh: async () => {},
});

export function StoreLogoProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<StoreLogoSettings>(DEFAULT_STORE_LOGO_SETTINGS);
  const [loaded, setLoaded] = useState(false);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/store-logo", { cache: "no-store" });
      if (!res.ok) return;
      const data = await res.json();
      setSettings(normalizeStoreLogoSettings(data));
    } catch {
      setSettings(DEFAULT_STORE_LOGO_SETTINGS);
    } finally {
      setLoaded(true);
    }
  }, []);

  useEffect(() => {
    void refresh();
    const onFocus = () => void refresh();
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [refresh]);

  const value = useMemo(
    () => ({ settings, loaded, refresh }),
    [settings, loaded, refresh]
  );

  return <StoreLogoContext.Provider value={value}>{children}</StoreLogoContext.Provider>;
}

export function useStoreLogo() {
  return useContext(StoreLogoContext);
}
