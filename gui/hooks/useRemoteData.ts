"use client";

import { useCallback, useEffect, useState } from "react";
import { isNetworkError } from "@/lib/api";

/**
 * - loading: request in flight
 * - success: server answered (data may be empty)
 * - offline: server could not be reached
 * - error:   server answered with an error
 */
export type RemoteStatus = "loading" | "success" | "offline" | "error";

export function statusFromError(err: unknown): RemoteStatus {
  return isNetworkError(err) ? "offline" : "error";
}

interface RemoteState<T> {
  status: RemoteStatus;
  data?: T;
  error?: unknown;
}

/**
 * Loads data on mount (and whenever `fetcher` changes) and tracks the request status.
 * `fetcher` must be stable: a module-level function or wrapped in useCallback.
 */
export function useRemoteData<T>(fetcher: () => Promise<T>) {
  const [state, setState] = useState<RemoteState<T>>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let active = true;
    fetcher()
      .then((data) => active && setState({ status: "success", data }))
      .catch((error) => {
        if (!active) return;
        console.warn("Request failed", error);
        setState({ status: statusFromError(error), error });
      });
    return () => {
      active = false;
    };
  }, [fetcher, attempt]);

  const reload = useCallback(() => {
    setState({ status: "loading" });
    setAttempt((n) => n + 1);
  }, []);

  return { ...state, reload };
}
