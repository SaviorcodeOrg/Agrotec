import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useNavigate } from "react-router-dom";
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "../../components/Button";
import { TextField } from "../../components/Textfield";
import { useApiProtegida } from "../../hooks/useApiProtegida";
import { usePerfil } from "../../hooks/usePerfil";
import "./RegistroWizard.css";

interface DatosRegistro {
  vendedor: boolean;
  Username: string;
  Nombre: string;
  Apellidos: string;
  Email: string;
  Telefono: string;
  // Solo Vendedor
  Nombre_Negocio: string;
  Ubicaion_Aproximada: string;
  // Solo Comprador
  Modalidad_De_Entrega: string;
}

const datosIniciales: DatosRegistro = {
  vendedor: true,
  Username: "",
  Nombre: "",
  Apellidos: "",
  Email: "",
  Telefono: "",
  Nombre_Negocio: "",
  Ubicaion_Aproximada: "",
  Modalidad_De_Entrega: "",
};

type EstadoEnvio = "idle" | "enviando" | "exito" | "error";

const variantesCard = {
  entrada: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
  salida: { opacity: 0, y: -24 },
};

export function RegistroWizard() {
  const { isAuthenticated, isLoading, loginWithRedirect, user } = useAuth0();
  const { llamar } = useApiProtegida();
  const [paso, setPaso] = useState(0);
  const [datos, setDatos] = useState<DatosRegistro>(datosIniciales);
  const [estado, setEstado] = useState<EstadoEnvio>("idle");
  const [errorMensaje, setErrorMensaje] = useState("");
  const navigate = useNavigate();
  // Un Auth0Sub solo puede tener un Usuario (ver la constraint unica en la
  // tabla Usuario) - si ya existe un perfil, mostrar el wizard llevaria a un
  // "Failed to register usuario" confuso en vez de explicar que ya tiene
  // cuenta.
  const { usuario, cargando: revisandoPerfil } = usePerfil();
  const yaRegistrado = usuario !== null;

  useEffect(() => {
    if (user?.email) {
      setDatos((prev) => (prev.Email ? prev : { ...prev, Email: user.email! }));
    }
  }, [user]);

  function actualizar<K extends keyof DatosRegistro>(campo: K, valor: DatosRegistro[K]) {
    setDatos((prev) => ({ ...prev, [campo]: valor }));
  }

  const pasoValido = (() => {
    if (paso === 0) return true;
    if (paso === 1) {
      return (
        datos.Username.trim().length > 0 &&
        datos.Nombre.trim().length > 0 &&
        datos.Apellidos.trim().length > 0
      );
    }
    return true;
  })();

  function siguiente() {
    if (!pasoValido) return;
    setPaso((p) => Math.min(p + 1, 3));
  }

  function atras() {
    setPaso((p) => Math.max(p - 1, 0));
  }

  async function enviar() {
    setEstado("enviando");
    setErrorMensaje("");

    const cuerpo: Record<string, unknown> = {
      vendedor: datos.vendedor,
      Username: datos.Username,
      Nombre: datos.Nombre,
      Apellidos: datos.Apellidos,
      Email: datos.Email,
      Telefono: datos.Telefono,
    };

    if (datos.vendedor) {
      cuerpo.Nombre_Negocio = datos.Nombre_Negocio;
      cuerpo.Ubicaion_Aproximada = datos.Ubicaion_Aproximada;
    } else {
      cuerpo.Modalidad_De_Entrega = datos.Modalidad_De_Entrega;
    }

    try {
      await llamar("/api/register", {
        method: "POST",
        body: JSON.stringify(cuerpo),
      });

      setEstado("exito");
    } catch (err) {
      setErrorMensaje(err instanceof Error ? err.message : "Error desconocido");
      setEstado("error");
    }
  }

  const totalPasos = 4;

  if (isLoading || revisandoPerfil) {
    return <div className="wizard-fondo" />;
  }

  if (yaRegistrado) {
    return (
      <div className="wizard-fondo">
        <div className="wizard-tarjeta-contenedor">
          <div className="wizard-card">
            <h1>Ya tienes una cuenta</h1>
            <p className="wizard-subtitulo">
              Este inicio de sesion ya esta registrado. Solo se permite una
              cuenta de Vendedor o Comprador por inicio de sesion.
            </p>
            <div className="wizard-acciones">
              <Button onPress={() => navigate("/Perfil")}>Ver mi perfil</Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="wizard-fondo">
        <div className="wizard-tarjeta-contenedor">
          <div className="wizard-card">
            <h1>Primero inicia sesion</h1>
            <p className="wizard-subtitulo">
              Necesitas iniciar sesion antes de crear tu cuenta de Vendedor o
              Comprador.
            </p>
            <div className="wizard-acciones">
              <Button
                onPress={() =>
                  loginWithRedirect({ appState: { returnTo: '/CrearCuenta' } })
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
    <div className="wizard-fondo">
      <div className="wizard-tarjeta-contenedor">
        <div className="wizard-progreso">
          {Array.from({ length: totalPasos }).map((_, i) => (
            <div
              key={i}
              className={`wizard-punto ${i <= paso ? "wizard-punto-activo" : ""}`}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {paso === 0 && (
            <motion.div
              key="paso-tipo"
              className="wizard-card"
              variants={variantesCard}
              initial="entrada"
              animate="visible"
              exit="salida"
              transition={{ duration: 0.35 }}
            >
              <h1>¿Qué tipo de cuenta quieres crear?</h1>
              <p className="wizard-subtitulo">
                Elige uno. Solo puedes tener un tipo de cuenta por inicio de
                sesion.
              </p>

              <div className="wizard-tipo-selector" role="radiogroup">
                <button
                  type="button"
                  role="radio"
                  aria-checked={datos.vendedor}
                  className={`wizard-tipo-opcion${datos.vendedor ? " wizard-tipo-opcion-activa" : ""}`}
                  onClick={() => actualizar("vendedor", true)}
                >
                  <span className="wizard-tipo-opcion-check" aria-hidden="true" />
                  <span className="wizard-tipo-opcion-titulo">Vendedor</span>
                  <span className="wizard-tipo-opcion-desc">
                    Quiero vender mis productos
                  </span>
                </button>
                <button
                  type="button"
                  role="radio"
                  aria-checked={!datos.vendedor}
                  className={`wizard-tipo-opcion${!datos.vendedor ? " wizard-tipo-opcion-activa" : ""}`}
                  onClick={() => actualizar("vendedor", false)}
                >
                  <span className="wizard-tipo-opcion-check" aria-hidden="true" />
                  <span className="wizard-tipo-opcion-titulo">Comprador</span>
                  <span className="wizard-tipo-opcion-desc">
                    Quiero comprar productos
                  </span>
                </button>
              </div>

              <div className="wizard-acciones">
                <Button onPress={siguiente}>Siguiente</Button>
              </div>
            </motion.div>
          )}

          {paso === 1 && (
            <motion.div
              key="paso-usuario"
              className="wizard-card"
              variants={variantesCard}
              initial="entrada"
              animate="visible"
              exit="salida"
              transition={{ duration: 0.35 }}
            >
              <h1>Cuéntanos sobre ti</h1>
              <p className="wizard-subtitulo">
                Estos datos se usan para tu cuenta de usuario.
              </p>

              <TextField
                label="¿Cómo quieres que te llamen?"
                placeholder="usuario123"
                value={datos.Username}
                onChange={(v) => actualizar("Username", v)}
                isRequired
              />
              <TextField
                label="Nombre"
                placeholder="Juan"
                value={datos.Nombre}
                onChange={(v) => actualizar("Nombre", v)}
                isRequired
              />
              <TextField
                label="Apellidos"
                placeholder="Pérez García"
                value={datos.Apellidos}
                onChange={(v) => actualizar("Apellidos", v)}
                isRequired
              />
              <TextField
                label="Email"
                type="email"
                placeholder="juan@ejemplo.com"
                value={datos.Email}
                onChange={(v) => actualizar("Email", v)}
              />
              <TextField
                label="Teléfono"
                placeholder="555-0000"
                value={datos.Telefono}
                onChange={(v) => actualizar("Telefono", v)}
              />

              {!pasoValido && (
                <p className="wizard-error-inline">
                  Como quieres que te llamen, Nombre y Apellidos son obligatorios.
                </p>
              )}

              <div className="wizard-acciones">
                <Button variant="secondary" onPress={atras}>
                  Atrás
                </Button>
                <Button onPress={siguiente} isDisabled={!pasoValido}>
                  Siguiente
                </Button>
              </div>
            </motion.div>
          )}

          {paso === 2 && datos.vendedor && (
            <motion.div
              key="paso-vendedor"
              className="wizard-card"
              variants={variantesCard}
              initial="entrada"
              animate="visible"
              exit="salida"
              transition={{ duration: 0.35 }}
            >
              <h1>Datos de tu negocio</h1>
              <p className="wizard-subtitulo">
                Esto se usa para tu perfil de Vendedor y para crear tu cuenta
                en la plataforma de pagos.
              </p>

              <TextField
                label="Nombre del negocio"
                placeholder="El Rancho Feliz"
                value={datos.Nombre_Negocio}
                onChange={(v) => actualizar("Nombre_Negocio", v)}
              />
              <TextField
                label="Ubicación aproximada"
                placeholder="Monterrey, NL"
                value={datos.Ubicaion_Aproximada}
                onChange={(v) => actualizar("Ubicaion_Aproximada", v)}
              />

              <div className="wizard-acciones">
                <Button variant="secondary" onPress={atras}>
                  Atrás
                </Button>
                <Button onPress={siguiente}>Siguiente</Button>
              </div>
            </motion.div>
          )}

          {paso === 2 && !datos.vendedor && (
            <motion.div
              key="paso-comprador"
              className="wizard-card"
              variants={variantesCard}
              initial="entrada"
              animate="visible"
              exit="salida"
              transition={{ duration: 0.35 }}
            >
              <h1>Cuéntanos qué buscas comprar</h1>
              <p className="wizard-subtitulo">
                Esto se usa para tu perfil de Comprador.
              </p>

              <TextField
                label="Modalidad de entrega"
                placeholder="Entrega a domicilio"
                value={datos.Modalidad_De_Entrega}
                onChange={(v) => actualizar("Modalidad_De_Entrega", v)}
              />

              <div className="wizard-acciones">
                <Button variant="secondary" onPress={atras}>
                  Atrás
                </Button>
                <Button onPress={siguiente}>Siguiente</Button>
              </div>
            </motion.div>
          )}

          {paso === 3 && (
            <motion.div
              key="paso-confirmar"
              className="wizard-card"
              variants={variantesCard}
              initial="entrada"
              animate="visible"
              exit="salida"
              transition={{ duration: 0.35 }}
            >
              {estado === "exito" ? (
                <>
                  <h1>¡Cuenta creada!</h1>
                  <p className="wizard-subtitulo">
                    Tu cuenta de {datos.vendedor ? "Vendedor" : "Comprador"} se
                    registró correctamente.
                  </p>
                  <div className="wizard-acciones">
                    <Button onPress={() => navigate("/")}>Ir al inicio</Button>
                  </div>
                </>
              ) : (
                <>
                  <h1>Confirma tus datos</h1>
                  <p className="wizard-subtitulo">
                    Tipo: <strong>{datos.vendedor ? "Vendedor" : "Comprador"}</strong>
                  </p>

                  <ul className="wizard-resumen">
                    <li>Como te llaman: {datos.Username}</li>
                    <li>
                      Nombre: {datos.Nombre} {datos.Apellidos}
                    </li>
                    <li>Email: {datos.Email || "—"}</li>
                    <li>Teléfono: {datos.Telefono || "—"}</li>
                    {datos.vendedor ? (
                      <>
                        <li>Negocio: {datos.Nombre_Negocio || "—"}</li>
                        <li>Ubicación: {datos.Ubicaion_Aproximada || "—"}</li>
                      </>
                    ) : (
                      <li>Entrega: {datos.Modalidad_De_Entrega || "—"}</li>
                    )}
                  </ul>

                  {estado === "error" && (
                    <p className="wizard-error-inline">{errorMensaje}</p>
                  )}

                  <div className="wizard-acciones">
                    <Button
                      variant="secondary"
                      onPress={atras}
                      isDisabled={estado === "enviando"}
                    >
                      Atrás
                    </Button>
                    <Button onPress={enviar} isDisabled={estado === "enviando"}>
                      {estado === "enviando" ? "Enviando..." : "Crear cuenta"}
                    </Button>
                  </div>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
