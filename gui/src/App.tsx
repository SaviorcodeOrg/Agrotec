import './App.css'
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react'
import type { ReactNode } from 'react'
import Principal from './screens/Principal'
import { VerMas } from './screens/VerMas'
import { CrearCuenta} from './screens/CrearCuenta'
import { GaleriaVenta } from './screens/Vendedor/GaleriaVenta'
import { Catalogo } from './screens/Catalogo/Catalogo'
import { Perfil } from './screens/Perfil/Perfil'
import { motion } from 'motion/react'
import { HomeIcon,ShoppingCart,CoinsIcon,TelescopeIcon } from 'lucide-react'
// Envuelve Auth0Provider aqui (dentro de BrowserRouter, no en main.tsx) para
// que onRedirectCallback pueda usar useNavigate y volver a la pagina donde
// el usuario estaba (ej. /CrearCuenta) en vez de siempre mandarlo a "/".
function Auth0ProviderConNavegacion({ children }: { children: ReactNode }) {
  const navigate = useNavigate()

  return (
    <Auth0Provider
      domain="dev-sebkdm5n60dmbfjm.us.auth0.com"
      clientId="HtrLvS56mkueOr8n2UWkWrrW6JaSmyB6"
      authorizationParams={{
        redirect_uri: window.location.origin,
        audience: "https://agrotecapi.saviorcode.com/",
      }}
      // Default (in-memory) cache needs a cross-origin iframe silent-auth
      // check on every fresh page load to know if the user's still logged
      // in - if third-party cookies are restricted that check can hang
      // forever, leaving isLoading stuck true. localStorage persists the
      // session across reloads without needing that check.
      cacheLocation="localstorage"
      // The silent-auth iframe check defaults to a 60s timeout before
      // giving up - if it's ever going to fail (blocked cookies, etc.)
      // that's a full minute of the app looking frozen. Fail fast instead;
      // the worst case is an already-logged-in user has to click "Iniciar
      // sesion" once more, not a real problem.
      authorizeTimeoutInSeconds={5}
      onRedirectCallback={(appState) => {
        navigate(appState?.returnTo || '/')
      }}
    >
      {children}
    </Auth0Provider>
  )
}

function BotonSesion() {
  const { isAuthenticated, isLoading, loginWithRedirect, logout, user } = useAuth0()

  if (isLoading) return null

  if (isAuthenticated) {
    return (
      <>
        <Link to="/Perfil" className="nav-link">{user?.email}</Link>
        <button
          className="nav-link-button"
          onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
        >
          Cerrar sesion
        </button>
      </>
    )
  }

  return (
    <button className="nav-link" onClick={() => loginWithRedirect()}>
      Iniciar sesion
    </button>
  )
}

export default function App(){

return(
  <BrowserRouter>
  <Auth0ProviderConNavegacion>
  <motion.nav>
<Link to= '/'  className="nav-link"><HomeIcon>Regresar a Inicio</HomeIcon> </Link>
<Link to='/VerMas' className="nav-link"><TelescopeIcon></TelescopeIcon>Ver mas</Link>
<Link to='/Catalogo' className="nav-link"><ShoppingCart></ShoppingCart>Comprar</Link>
<Link to='/Vender' className="nav-link"><CoinsIcon></CoinsIcon>Vender</Link>
<BotonSesion />
  </motion.nav>
  <Routes>
    <Route path='/CrearCuenta' element={<CrearCuenta/>}/>
    <Route path="/" element={<Principal />}/>
    <Route path="/VerMas" element={<VerMas/>}/>
    <Route path="/Vender" element={<GaleriaVenta/>}/>
    <Route path="/Catalogo" element={<Catalogo/>}/>
    <Route path="/Perfil" element={<Perfil/>}/>
  </Routes>
  </Auth0ProviderConNavegacion>
  </BrowserRouter>
)
}
