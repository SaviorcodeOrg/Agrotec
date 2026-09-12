import { useEffect, useState } from "react";
import { llamarApi } from "../lib/api";

interface ProductoCatalogo {
  Nombre_Producto: string;
  cantidadTotal: string;
}

export function VerMas() {
  const [productos, setProductos] = useState<ProductoCatalogo[] | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    llamarApi("/api/productos")
      .then(setProductos)
      .catch((err) =>
        setError(err instanceof Error ? err.message : "Error desconocido")
      );
  }, []);

  const totalProductos = productos?.length ?? 0;
  const totalUnidades =
    productos?.reduce((suma, p) => suma + Number(p.cantidadTotal), 0) ?? 0;

  return (
    <div style={{ maxWidth: 600, margin: "40px auto", padding: "0 16px" }}>
      <h1>Sobre Agrotec</h1>
      <p>
        Agrotec conecta agricultores con compradores directamente, sin
        intermediarios: los vendedores registran sus productos, y los
        compradores los adquieren a través de nuestro catálogo, todo bajo una
        sola marca para que la relación de compra-venta sea justa y anónima
        para ambas partes.
      </p>

      <h2>Ahora mismo en el catálogo</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      {!error && productos === null && <p>Cargando...</p>}
      {productos && (
        <ul>
          <li>{totalProductos} productos distintos disponibles</li>
          <li>{totalUnidades} unidades en total entre todos los vendedores</li>
        </ul>
      )}
    </div>
  );
}
