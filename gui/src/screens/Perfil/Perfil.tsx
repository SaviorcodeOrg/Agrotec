import { useAuth0 } from "@auth0/auth0-react";
import { useNavigate } from "react-router-dom";
import { Button } from "../../components/Button";
import { usePerfil } from "../../hooks/usePerfil";
import "../Registro/RegistroWizard.css";

export function Perfil() {
  const { isAuthenticated, isLoading, loginWithRedirect, logout } = useAuth0();
  const navigate = useNavigate();
  const { usuario, noRegistrado, cargando } = usePerfil();

  if (isLoading || cargando) {
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
