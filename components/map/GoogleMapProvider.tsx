"use client";

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

type GoogleLibraries = {
  maps: google.maps.MapsLibrary;
  marker: google.maps.MarkerLibrary;
};

type GoogleMapContextValue = {
  libraries: GoogleLibraries | null;
  loading: boolean;
  error: string | null;
};

const GoogleMapContext = createContext<GoogleMapContextValue | null>(null);
let googleLibrariesPromise: Promise<GoogleLibraries> | null = null;
let configuredApiKey: string | null = null;

function loadGoogleLibraries(apiKey: string): Promise<GoogleLibraries> {
  if (!googleLibrariesPromise) {
    if (!configuredApiKey) {
      setOptions({ key: apiKey, v: "weekly", language: "tr", region: "TR" });
      configuredApiKey = apiKey;
    }

    googleLibrariesPromise = Promise.all([
      importLibrary("maps") as Promise<google.maps.MapsLibrary>,
      importLibrary("marker") as Promise<google.maps.MarkerLibrary>
    ]).then(([maps, marker]) => ({ maps, marker }));
  }

  return googleLibrariesPromise;
}

export function GoogleMapProvider({ children }: { children: ReactNode }) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY?.trim() ?? "";
  const [libraries, setLibraries] = useState<GoogleLibraries | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    if (!apiKey) {
      setError("Google Maps API anahtarı yapılandırılmadı.");
      return () => { active = false; };
    }

    loadGoogleLibraries(apiKey)
      .then(result => { if (active) setLibraries(result); })
      .catch(() => { if (active) setError("Google Maps yüklenemedi."); });

    return () => { active = false; };
  }, [apiKey]);

  const value = useMemo<GoogleMapContextValue>(() => ({ libraries, loading: !libraries && !error, error }), [libraries, error]);
  return <GoogleMapContext.Provider value={value}>{children}</GoogleMapContext.Provider>;
}

export function useGoogleMap() {
  const context = useContext(GoogleMapContext);
  if (!context) throw new Error("useGoogleMap must be used within GoogleMapProvider");
  return context;
}
