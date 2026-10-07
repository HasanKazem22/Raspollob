"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { getStoreConfig, StoreConfig } from "@/services/configService";
import { RemoteStatus, statusFromError } from "@/hooks/useRemoteData";
import { applyBrandColor } from "@/lib/brand";

interface StoreConfigContextType {
  /** null until loaded, or if the request failed */
  config: StoreConfig | null;
  status: RemoteStatus;
  isLoading: boolean;
  /** Re-fetch, e.g. after an admin saves new settings */
  refresh: () => Promise<void>;
}

const StoreConfigContext = createContext<StoreConfigContextType | undefined>(undefined);

export function StoreConfigProvider({ children }: { children: React.ReactNode }) {
  const [config, setConfig] = useState<StoreConfig | null>(null);
  const [status, setStatus] = useState<RemoteStatus>("loading");

  const load = useCallback(
    () =>
      getStoreConfig()
        .then((data) => {
          setConfig(data);
          setStatus("success");
          // The admin-chosen brand colour re-themes the whole site (design token --brand)
          applyBrandColor(data.primaryColor);
        })
        .catch((err) => {
          console.warn("Failed to load store config", err);
          setStatus(statusFromError(err));
        }),
    []
  );

  useEffect(() => {
    load();
  }, [load]);

  return (
    <StoreConfigContext.Provider value={{ config, status, isLoading: status === "loading", refresh: load }}>
      {children}
    </StoreConfigContext.Provider>
  );
}

export function useStoreConfig() {
  const context = useContext(StoreConfigContext);
  if (context === undefined) {
    throw new Error("useStoreConfig must be used within a StoreConfigProvider");
  }
  return context;
}
