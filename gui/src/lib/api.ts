// Cliente HTTP compartido para el backend. Antes cada pantalla tenia su
// propia constante API_URL y su propio bloque de fetch/manejo de errores
// duplicado - esto centraliza ambos en un solo lugar.
export const API_URL = "https://agrotecapi.saviorcode.com";

interface OpcionesApi extends RequestInit {
  token?: string;
}

export async function llamarApi(ruta: string, opciones: OpcionesApi = {}) {
  const { token, headers, ...resto } = opciones;

  const res = await fetch(`${API_URL}${ruta}`, {
    ...resto,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });

  const data = await res.json();

  if (!res.ok) {
    const error = new Error(data.error || `Error HTTP ${res.status}`) as Error & {
      status?: number;
    };
    error.status = res.status;
    throw error;
  }

  return data;
}
