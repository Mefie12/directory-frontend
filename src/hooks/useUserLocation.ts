"use client";

import { useState, useEffect } from "react";

interface UserLocation {
  country: string;
  country_code: string;
}

export function useUserLocation() {
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => {
        if (data.country_code) {
          setLocation({
            country: data.country_name,
            country_code: data.country_code,
          });
        }
      })
      .catch(() => setLocation(null))
      .finally(() => setLoading(false));
  }, []);

  return { location, loading };
}
