import "./Principal.css";
import campoimg from "../assets/Campo.jpeg";
import { motion } from "motion/react";
import { Button } from "../components/Button";
import { useNavigate } from "react-router-dom";
import Typewriter from "../components/TypeWriter";
export default function Principal() {
  const navigate = useNavigate();
  function Continuar() {
    navigate("/CrearCuenta");
  }
  return (
    <>
      <h1>AGROTEC</h1>
      <motion.div
        className="Intro"
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        whileHover={{ scale: 1.01 }}
      >
        <img src={campoimg} width={400} height={400} alt="" id="introImg"></img>
        <motion.p
          id="Textointroductorio"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
          transition={{ duration: 0.8, delay: 0.3 }}
        >
          <Typewriter text="
          Bienvenido a la mejor pagina de agricultura
        diseñada para comprar y vender
          producto agricola a precio razonable apoyandoa miles de
          agricultores
         a lo largo del mundo" speed={1}/>

        </motion.p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.5, ease: "easeOut" }}
      >
        <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.97 }} style={{ display: "inline-block" }}>
          <Button
            style={{ width: 200, height: 70, margin: 100 }}
            onClick={Continuar}
          >
            Continuar{" "}
          </Button>
        </motion.div>
      </motion.div>
  
    </>
  );
}
