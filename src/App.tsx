import './App.css'
import {BrowserRouter,Routes,Route,Link} from 'react-router-dom'
import Principal from './screens/Principal'
import { VerMas } from './screens/VerMas'
import { CrearCuenta} from './screens/CrearCuenta'
import { motion } from 'motion/react'
export default function App(){

return(
  <BrowserRouter>
  <motion.nav>
<Link to= '/'  className="nav-link">Regresar a Inicio </Link>
<Link to='/VerMas' className="nav-link">Ver mas</Link>
  </motion.nav>
  <Routes>
    <Route path='/CrearCuenta' element={<CrearCuenta/>}/>
    <Route path="/" element={<Principal />}></Route>
    <Route path="/Precios" element={<VerMas/>}></Route>
  </Routes>
  </BrowserRouter>
)
} 