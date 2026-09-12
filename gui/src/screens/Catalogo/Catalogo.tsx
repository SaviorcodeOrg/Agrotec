import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "../../components/Button";
import { llamarApi } from "../../lib/api";
import { useApiProtegida } from "../../hooks/useApiProtegida";
import "../Vendedor/GaleriaVenta.css";
import "../Registro/RegistroWizard.css";

interface ProductoCatalogo {
  Nombre_Producto: string;
  precioDesde: string;
  cantidadTotal: string;
  Descripcion: string | null;
  Foto_Producto_URL: string | null;
  Unidad_De_Venta: number | null;
  MInimo_De_Compra: string | null;
}

type ResultadoCompra = { total: number; facturaUrl: string } | string;

export function Catalogo() {
  const { isAuthenticated, loginWithRedirect } = useAuth0();
  const { llamar } = useApiProtegida();
  const [productos, setProductos] = useState<ProductoCatalogo[] | null>(null);
  const [error, setError] = useState("");
  const [comprando, setComprando] = useState<string | null>(null);
  const [resultados, setResultados] = useState<Record<string, ResultadoCompra>>({});

  useEffect(() => {
    cargarCatalogo();
  }, []);

  async function cargarCatalogo() {
    setError("");
    try {
      // Publico - no necesita token, así que usa llamarApi directo en vez
      // de useApiProtegida (que siempre intenta obtener uno).
      const data = await llamarApi("/api/productos");
      setProductos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  }

  async function comprar(nombreProducto: string) {
    if (!isAuthenticated) {
      loginWithRedirect({ appState: { returnTo: "/Catalogo" } });
      return;
    }

    setComprando(nombreProducto);
    setResultados((prev) => ({ ...prev, [nombreProducto]: "" }));

    try {
      const data = await llamar("/api/comprar", {
        method: "POST",
        body: JSON.stringify({ Nombre_Producto: nombreProducto, cantidad: 1 }),
      });

      setResultados((prev) => ({
        ...prev,
        [nombreProducto]: {
          total: data.producto.total,
          facturaUrl: `https://agrotecapi.saviorcode.com${data.factura.url}`,
        },
      }));

      await cargarCatalogo();
    } catch (err) {
      setResultados((prev) => ({
        ...prev,
        [nombreProducto]: err instanceof Error ? err.message : "Error desconocido",
      }));
    } finally {
      setComprando(null);
    }
  }

  return (
    <div className="galeria-fondo">
      <div className="galeria-header">
        <h1>Catálogo Agrotec</h1>
      </div>

      {error && <p className="wizard-error-inline">{error}</p>}

      {productos && productos.length === 0 && (
        <p className="galeria-vacia">
          No hay productos disponibles por el momento.
        </p>
      )}

      <div className="galeria-grid">
        {productos?.map((producto) => {
          const resultado = resultados[producto.Nombre_Producto];

          return (
            <div className="producto-card" key={producto.Nombre_Producto}>
              {producto.Foto_Producto_URL ? (
                <img
                  className="producto-imagen"
                  src={producto.Foto_Producto_URL}
                  alt={producto.Nombre_Producto}
                />
              ) : (
                <div className="producto-imagen-placeholder">Sin foto</div>
              )}
              <div className="producto-info">
                <h3>{producto.Nombre_Producto}</h3>
                <span className="producto-precio">Desde ${producto.precioDesde}</span>
                <span className="producto-stock">
                  {producto.cantidadTotal} disponibles
                </span>
                {producto.Descripcion && (
                  <p style={{ fontSize: 13, opacity: 0.75, margin: 0 }}>
                    {producto.Descripcion}
                  </p>
                )}

                <Button
                  onPress={() => comprar(producto.Nombre_Producto)}
                  isDisabled={comprando === producto.Nombre_Producto}
                >
                  {comprando === producto.Nombre_Producto
                    ? "Comprando..."
                    : "Comprar 1"}
                </Button>

                {typeof resultado === "string" && resultado && (
                  <p className="wizard-error-inline">{resultado}</p>
                )}
                {resultado && typeof resultado === "object" && (
                  <p style={{ fontSize: 13, margin: 0 }}>
                    ¡Comprado! Total: ${resultado.total} -{" "}
                    <a href={resultado.facturaUrl} target="_blank" rel="noreferrer">
                      Ver factura
                    </a>
                  </p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
