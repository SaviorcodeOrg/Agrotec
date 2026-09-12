
import { Button } from "../../components/Button";
import { TextField } from "../../components/Textfield";
import {motion} from 'motion/react'


export function SignInVendedor(){
    return(
        <>
        <motion.div className="Campos"
        initial={{opacity:0}}
        animate={{opacity:1}}
        transition={{duration:1}}>
<TextField label="Nombre " placeholder="John Ejemplo "></TextField>
<TextField label="Apellidos " placeholder="Sanchez Ejemplo"></TextField>
<TextField label="Negocio" placeholder="El rancho feliz"></TextField>
<Button>Enviar</Button>
  
</motion.div>
</>
    );
}
