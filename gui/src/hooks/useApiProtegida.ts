import { useState, useCallback } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { llamarApi } from "../lib/api";

// Hook para llamar endpoints protegidos - adjunta el access token de Auth0
// automaticamente y trackea cargando/error, para no repetir ese boilerplate
// en cada pantalla que necesita hablar con un endpoint con checkJwt.
export function useApiProtegida() {
  const { getAccessTokenSilently } = useAuth0();
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const llamar = useCallback(
    async (ruta: string, opciones?: RequestInit) => {
      setCargando(true);
      setError(null);
      try {
        const token = await getAccessTokenSilently();
        return await llamarApi(ruta, { ...opciones, token });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error desconocido");
        throw err;
      } finally {
        setCargando(false);
      }
    },
    [getAccessTokenSilently]
  );

  return { llamar, cargando, error };
}
