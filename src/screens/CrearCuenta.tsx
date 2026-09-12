import { GridList, GridListItem, Text } from "../components/Gridlist";
import VendedorImg from "../assets/Vendedor.jpg";
import CompradorImg from "../assets/Comprador.webp";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/Button";
import type { Selection } from "react-aria-components/GridList";
import { useState } from "react";
import { Modal, Dialog, ModalOverlay, Heading } from "react-aria-components";

export function CrearCuenta() {
  const [rol, setRol] = useState<string>("");
  const [mostrarError, setMostrarError] = useState<boolean>(false);
  const navigate = useNavigate();
  function manejarSeleccion(keys: Selection) {
    if (keys !== "all") {
      const seleccionado = [...keys][0];
      if (seleccionado) {
        setRol(String(seleccionado));
      } else {
        setRol("");
      }
    }
  }
  function IraSignIn() {
    if (!rol) {
      setMostrarError(true);
      return;
    }
    if (rol === "Vendedor") {
      navigate("/RegistrarVendedor");
    } else if (rol === "Comprador") {
      navigate("/RegistrarComprador");
    }
  }
  function cerrarModal() {
    setMostrarError(false);
  }
  return (
    <>
      <h1 id="TituloCrearCuenta">
        Selecciona una tipo de cuenta presionando la Imagen o el texto{" "}
      </h1>

      <p>
        Puedes confirmar que esta seleccionada cuando el margen se ponga en
        verde
      </p>
      <div>
        <GridList
          aria-label="Seleccion de tipo de cuenta"
          selectionMode="single"
          layout="grid"
          onSelectionChange={manejarSeleccion}
        >
          <GridListItem textValue="Cuenta de Vendedor" id="Vendedor">
            <img src={VendedorImg}></img>
            <Text> Crear cuenta de vendedor</Text>
            <Text slot="description">
              Selecciona esta opcion si eres un Agricultor interesado en
              comerciar sus productos a travez de una plataforma segura y
              confiable
            </Text>
          </GridListItem>
          <GridListItem textValue="Cuenta de comprador" id="Comprador">
            <img src={CompradorImg}></img>
            <Text>Crear cuenta de comprador</Text>
            <Text slot="description">
              Si estas interesado en comprar productos de origen natural a
              distintos Agricultores de tu comunidad esta es tu opcion
            </Text>
          </GridListItem>
        </GridList>
      </div>
      <div className="IrALacreacionDeCuenta">
        <Button style={{ width: 150, height: 70 }} onClick={IraSignIn}>
          Crear la cuenta
        </Button>
      </div>
      <ModalOverlay
        isOpen={mostrarError}
        onOpenChange={setMostrarError}
        isDismissable
        className="ModalBackdrop"
      >
        <Modal className="ModalDesing">
          <Dialog role="alertdialog">
            <Heading slot="title">Tuviste una pequeña equivocacion </Heading>
            <p>
              Tienes que seleccionar un Rol como lo indica el Texto, en este
              caso se te olvido pero ntp 'v'
            </p>
            <Button onPress={cerrarModal}>Entendido</Button>
          </Dialog>
        </Modal>
      </ModalOverlay>
    </>
  );
}
