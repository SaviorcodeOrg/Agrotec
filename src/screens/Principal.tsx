import "./Principal.css";
import campoimg from "../assets/Campo.jpeg";
import { motion } from "motion/react";
import { Button } from "../components/Button";
import { useNavigate } from "react-router-dom";
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
        initial={{ y: 500, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 1.5 }}
      >
        <img src={campoimg} width={400} height={800} alt="" id="introImg"></img>
        <motion.p
          id="Textointroductorio"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.9 }}
          transition={{ duration: 1.5 }}
        >
          Bienvenido a la mejor pagina de agricultura
          <br></br> diseñada para comprar y vender
          <br></br>
          {""}
          producto agricola a precio razonable apoyando<br></br> a miles de
          agricultores
          <br></br>a lo largo del mundo
        </motion.p>
      </motion.div>
      <motion.div
        initial={{ opacity: 0, y: 50 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, amount: 0.3 }}
        transition={{ duration: 1.5 }}
      >
        <Button
          style={{ width: 200, height: 70, margin: 100 }}
          onClick={Continuar}
        >
          Continuar{" "}
        </Button>
      </motion.div>
      <footer>Agrotec</footer>
    </>
  );
}
