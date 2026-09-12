import { useState, useCallback } from 'react';

interface CustomFetchOptions {
  method?: string;
  headers?: HeadersInit;
  body?: unknown;
}

export function useFetch(baseUrl = '') {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const request = useCallback(async (endpoint = '', options: CustomFetchOptions = {}) => {
    setLoading(true);
    setError(null);

    try {
      const fetchOptions: RequestInit = {
        method: options.method || 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      };

      if (options.body) {
        fetchOptions.body = JSON.stringify(options.body);
      }

      const response = await fetch(`\({baseUrl}\){endpoint}`, fetchOptions);

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const result = await response.json();
      setData(result);
      return result;
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [baseUrl]);

  return { data, loading, error, request };
}