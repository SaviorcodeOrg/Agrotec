import { useEffect, useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/Button";
import { useApiProtegida } from "../../hooks/useApiProtegida";
import "../Registro/RegistroWizard.css";

interface Usuario {
  id: number;
  Username: string;
  Nombre: string;
  Email: string | null;
  Telefono: string | null;
  id_Vendedor: string | null;
  ID_comprador: string | null;
}

export function Perfil() {
  const { isAuthenticated, isLoading, loginWithRedirect, logout } = useAuth0();
  const { llamar } = useApiProtegida();
  const navigate = useNavigate();
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [noRegistrado, setNoRegistrado] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isAuthenticated) return;

    (async () => {
      try {
        const data = await llamar("/api/perfil");
        setUsuario(data);
      } catch (err) {
        // /api/perfil responde 404 si el usuario ya inicio sesion con
        // Auth0 pero todavia no completo el registro de Vendedor/Comprador
        // - eso no es un error real, es un estado normal que hay que
        // distinguir de una falla de verdad (por eso se revisa el status,
        // no el texto del mensaje - mas resistente a que el backend
        // cambie la redaccion exacta).
        const status = (err as { status?: number })?.status;
        if (status === 404) {
          setNoRegistrado(true);
        } else {
          setError(err instanceof Error ? err.message : "Error desconocido");
        }
      }
    })();
  }, [isAuthenticated, llamar]);

  if (isLoading) {
    return <div className="wizard-fondo" />;
  }

  if (!isAuthenticated) {
    return (
      <div className="wizard-fondo">
        <div className="wizard-tarjeta-contenedor">
          <div className="wizard-card">
            <h1>Primero inicia sesion</h1>
            <p className="wizard-subtitulo">
              Necesitas iniciar sesion para ver tu perfil.
            </p>
            <div className="wizard-acciones">
              <Button
                onPress={() =>
                  loginWithRedirect({ appState: { returnTo: "/Perfil" } })
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

  if (noRegistrado) {
    return (
      <div className="wizard-fondo">
        <div className="wizard-tarjeta-contenedor">
          <div className="wizard-card">
            <h1>Todavia no tienes un perfil</h1>
            <p className="wizard-subtitulo">
              Ya iniciaste sesion, pero falta registrarte como Vendedor o
              Comprador.
            </p>
            <div className="wizard-acciones">
              <Button onPress={() => navigate("/CrearCuenta")}>
                Crear cuenta
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
        <div className="wizard-card">
          <h1>Mi perfil</h1>

          {error && <p className="wizard-error-inline">{error}</p>}

          {usuario && (
            <>
              <p className="wizard-subtitulo">
                Tipo: <strong>{usuario.id_Vendedor ? "Vendedor" : "Comprador"}</strong>
              </p>
              <ul className="wizard-resumen">
                <li>Username: {usuario.Username}</li>
                <li>Nombre: {usuario.Nombre}</li>
                <li>Email: {usuario.Email || "—"}</li>
                <li>Teléfono: {usuario.Telefono || "—"}</li>
              </ul>

              <div className="wizard-acciones">
                {usuario.id_Vendedor && (
                  <Button variant="secondary" onPress={() => navigate("/Vender")}>
                    Mi galería de venta
                  </Button>
                )}
                {usuario.ID_comprador && (
                  <Button variant="secondary" onPress={() => navigate("/Catalogo")}>
                    Ir a comprar
                  </Button>
                )}
                <Button
                  onPress={() =>
                    logout({ logoutParams: { returnTo: window.location.origin } })
                  }
                >
                  Cerrar sesion
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
