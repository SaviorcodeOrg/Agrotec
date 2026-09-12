import './App.css'
import { BrowserRouter, Routes, Route, Link, useNavigate } from 'react-router-dom'
import { Auth0Provider, useAuth0 } from '@auth0/auth0-react'
import type { ReactNode } from 'react'
import Principal from './screens/Principal'
import { VerMas } from './screens/VerMas'
import { CrearCuenta} from './screens/CrearCuenta'
import { SignInComprador } from './screens/Comprador/SignInComprador'
import { SignInVendedor } from './screens/Vendedor/SignInVendedor'
import { motion } from 'motion/react'

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
        <span className="nav-link">{user?.email}</span>
        <button
          className="nav-link"
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
<Link to= '/'  className="nav-link">Regresar a Inicio </Link>
<Link to='/VerMas' className="nav-link">Ver mas</Link>
<BotonSesion />
  </motion.nav>
  <Routes>
    <Route path='/CrearCuenta' element={<CrearCuenta/>}/>
    <Route path="/" element={<Principal />}/>
    <Route path="/VerMas" element={<VerMas/>}/>
    <Route path="/RegistrarComprador" element={<SignInComprador/>}/>
    <Route path="/RegistrarVendedor" element={<SignInVendedor/>}/>
  </Routes>
  </Auth0ProviderConNavegacion>
  </BrowserRouter>
)
}