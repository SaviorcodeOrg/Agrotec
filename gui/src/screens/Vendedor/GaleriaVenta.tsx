import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion, type Variants } from "motion/react";
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "../../components/Button";
import { TextField, TextArea } from "../../components/Textfield";
import { useApiProtegida } from "../../hooks/useApiProtegida";
import "./GaleriaVenta.css";
import "../Registro/RegistroWizard.css";

interface Producto {
  id: number;
  Nombre_Producto: string;
  Precio: number;
  Cantidad_Disponible: number;
  Descripcion: string | null;
  Unidad_De_Venta: number | null;
  MInimo_De_Compra: string | null;
  Foto_Producto_URL: string | null;
}

const gridVariants: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.06 } },
};

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" } },
};

const formularioInicial = {
  Nombre_Producto: "",
  Precio: "",
  Cantidad_Disponible: "",
  Descripcion: "",
  Unidad_De_Venta: "",
  MInimo_De_Compra: "",
  Foto_Producto_URL: "",
};

export function GaleriaVenta() {
  const { isAuthenticated, isLoading, loginWithRedirect } = useAuth0();
  const { llamar } = useApiProtegida();
  const [productos, setProductos] = useState<Producto[] | null>(null);
  const [error, setError] = useState("");
  const [mostrarFormulario, setMostrarFormulario] = useState(false);
  const [formulario, setFormulario] = useState(formularioInicial);
  const [enviando, setEnviando] = useState(false);
  const [errorFormulario, setErrorFormulario] = useState("");

  const cargarProductos = useCallback(async () => {
    setError("");
    try {
      const data = await llamar("/api/mis-productos");
      setProductos(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    }
  }, [llamar]);

  useEffect(() => {
    if (isAuthenticated) {
      cargarProductos();
    }
  }, [isAuthenticated, cargarProductos]);

  function actualizarCampo(campo: keyof typeof formularioInicial, valor: string) {
    setFormulario((prev) => ({ ...prev, [campo]: valor }));
  }

  async function registrarProducto() {
    setEnviando(true);
    setErrorFormulario("");

    try {
      await llamar("/api/productos", {
        method: "POST",
        body: JSON.stringify({
          Nombre_Producto: formulario.Nombre_Producto,
          Precio: Number(formulario.Precio),
          Cantidad_Disponible: Number(formulario.Cantidad_Disponible),
          Descripcion: formulario.Descripcion || null,
          Unidad_De_Venta: formulario.Unidad_De_Venta
            ? Number(formulario.Unidad_De_Venta)
            : null,
          MInimo_De_Compra: formulario.MInimo_De_Compra || null,
          Foto_Producto_URL: formulario.Foto_Producto_URL || null,
        }),
      });

      setFormulario(formularioInicial);
      setMostrarFormulario(false);
      await cargarProductos();
    } catch (err) {
      setErrorFormulario(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setEnviando(false);
    }
  }

  if (isLoading) {
    return <div className="galeria-fondo" />;
  }

  if (!isAuthenticated) {
    return (
      <div className="wizard-fondo">
        <div className="wizard-tarjeta-contenedor">
          <div className="wizard-card">
            <h1>Primero inicia sesion</h1>
            <p className="wizard-subtitulo">
              Necesitas iniciar sesion con tu cuenta de Vendedor para ver tu
              galeria de venta.
            </p>
            <div className="wizard-acciones">
              <Button
                onPress={() =>
                  loginWithRedirect({ appState: { returnTo: "/Vender" } })
                }
              >
                Iniciar sesion
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="galeria-fondo">
      <div className="galeria-header">
        <h1>Mi galeria de venta</h1>
        <Button onPress={() => setMostrarFormulario((v) => !v)}>
          {mostrarFormulario ? "Cancelar" : "+ Registrar producto"}
        </Button>
      </div>

      <AnimatePresence>
      {mostrarFormulario && (
        <motion.div
          className="wizard-tarjeta-contenedor"
          style={{ margin: "0 auto 32px" }}
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
        >
          <div className="wizard-card">
            <h1>Registrar producto</h1>
            <p className="wizard-subtitulo">
              Este producto se agrega a tu catalogo de venta. Si el stock
              llega a 0, deja de aparecer en el catalogo publico.
            </p>

            <TextField
              label="Nombre del producto"
              placeholder="Tomate"
              value={formulario.Nombre_Producto}
              onChange={(v) => actualizarCampo("Nombre_Producto", v)}
              isRequired
            />
            <TextField
              label="Precio"
              type="number"
              placeholder="25"
              value={formulario.Precio}
              onChange={(v) => actualizarCampo("Precio", v)}
              isRequired
            />
            <TextField
              label="Cantidad disponible"
              type="number"
              placeholder="100"
              value={formulario.Cantidad_Disponible}
              onChange={(v) => actualizarCampo("Cantidad_Disponible", v)}
              isRequired
            />
            <TextField
              label="Unidad de venta (opcional)"
              placeholder="1 (kg, por ejemplo)"
              type="number"
              value={formulario.Unidad_De_Venta}
              onChange={(v) => actualizarCampo("Unidad_De_Venta", v)}
            />
            <TextField
              label="Minimo de compra (opcional)"
              placeholder="1 kg"
              value={formulario.MInimo_De_Compra}
              onChange={(v) => actualizarCampo("MInimo_De_Compra", v)}
            />
            <TextArea
              label="Descripcion (opcional)"
              placeholder="Tomate rojo fresco, cosechado esta semana"
              value={formulario.Descripcion}
              onChange={(v) => actualizarCampo("Descripcion", v)}
            />
            <TextField
              label="URL de foto (opcional)"
              placeholder="https://..."
              value={formulario.Foto_Producto_URL}
              onChange={(v) => actualizarCampo("Foto_Producto_URL", v)}
            />

            {errorFormulario && (
              <p className="wizard-error-inline">{errorFormulario}</p>
            )}

            <div className="wizard-acciones">
              <Button
                onPress={registrarProducto}
                isDisabled={
                  enviando ||
                  !formulario.Nombre_Producto ||
                  !formulario.Precio ||
                  !formulario.Cantidad_Disponible
                }
              >
                {enviando ? "Guardando..." : "Guardar producto"}
              </Button>
            </div>
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {error && <p className="wizard-error-inline">{error}</p>}

      {productos && productos.length === 0 && (
        <p className="galeria-vacia">
          Todavia no has registrado ningun producto.
        </p>
      )}

      <motion.div className="galeria-grid" variants={gridVariants} initial="hidden" animate="show">
        {productos?.map((producto) => (
          <motion.div
            className="producto-card"
            key={producto.id}
            variants={cardVariants}
            whileHover={{ y: -4 }}
          >
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
              <span className="producto-precio">${producto.Precio}</span>
              {producto.Cantidad_Disponible > 0 ? (
                <span className="producto-stock">
                  {producto.Cantidad_Disponible} disponibles
                </span>
              ) : (
                <span className="producto-agotado">Agotado</span>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
