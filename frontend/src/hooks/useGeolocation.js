import { useCallback, useEffect, useState } from 'react';

export const DEFAULT_LOCATION = { lat: 37.7749, lon: -122.4194 };

export function useGeolocation() {
  const [coords, setCoords] = useState(null);
  const [status, setStatus] = useState('prompting');
  const [label, setLabel] = useState(null);

  const request = useCallback(() => {
    setStatus('prompting');
    if (!navigator.geolocation) {
      setStatus('denied');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
        setLabel('Current location');
        setStatus('granted');
      },
      () => {
        setStatus('denied');
      }
    );
  }, []);

  const useDefault = useCallback(() => {
    setCoords(DEFAULT_LOCATION);
    setLabel('San Francisco, CA');
    setStatus('granted');
  }, []);

  // Point the app at an arbitrary location (e.g. a geocoded ZIP code).
  const setManualLocation = useCallback((c, newLabel) => {
    setCoords({ lat: c.lat, lon: c.lon });
    setLabel(newLabel || null);
    setStatus('granted');
  }, []);

  useEffect(() => {
    request();
  }, [request]);

  return { coords, status, label, request, useDefault, setManualLocation };
}
