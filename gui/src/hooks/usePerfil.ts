import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useApiProtegida } from "./useApiProtegida";

export interface Usuario {
  id: number;
  Username: string;
  Nombre: string;
  Email: string | null;
  Telefono: string | null;
  id_Vendedor: string | null;
  ID_comprador: string | null;
}

// Centraliza el fetch de /api/perfil - Perfil, RegistroWizard y el nav de
// App.tsx necesitan saber si el usuario ya tiene cuenta y de que tipo, y
// antes cada uno repetia el mismo fetch + manejo del 404.
export function usePerfil() {
  const { isAuthenticated } = useAuth0();
  const { llamar } = useApiProtegida();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [noRegistrado, setNoRegistrado] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    if (!isAuthenticated) {
      setCargando(false);
      return;
    }

    (async () => {
      try {
        const data = await llamar("/api/perfil");
        setUsuario(data);
      } catch (err) {
        if ((err as { status?: number })?.status === 404) {
          setNoRegistrado(true);
        }
      } finally {
        setCargando(false);
      }
    })();
  }, [isAuthenticated, llamar]);

  return { usuario, noRegistrado, cargando };
}
