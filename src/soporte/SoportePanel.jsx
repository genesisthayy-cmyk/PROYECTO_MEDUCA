import React, { useState } from "react";
import "./Soportepanel.css";
import InicioSoporte from "./InicioSoporte";
import SolicitudesSoporte from "./SolicitudesSoporte";
import ConfiguracionSoporte from "./ConfiguracionSoporte";
import { auth, db } from "../firebaseConfig";
import { deleteDoc, doc } from "firebase/firestore";
import { signOut, deleteUser } from "firebase/auth";

export default function SoportePanel({ usuario }) {
  const [vista, setVista] = useState("Inicio");
  const [modoOscuro, setModoOscuro] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);

  const renderVista = () => {
    switch (vista) {
      case "Inicio":
        return <InicioSoporte usuario={usuario} />;
      case "Solicitudes":
        return <SolicitudesSoporte usuario={usuario} />;
      case "Configuracion":
        return <ConfiguracionSoporte usuario={usuario} />;
      default:
        return <InicioSoporte usuario={usuario} />;
    }
  };

  const manejarCerrarSesion = () => {
    signOut(auth).then(() => {
      window.location.href = "/";
    });
  };

  const manejarEliminarCuenta = async () => {
    if (
      window.confirm(
        "¿Seguro que quieres eliminar tu cuenta? Esta acción no se puede deshacer."
      )
    ) {
      try {
        await deleteDoc(doc(db, "usuarios", usuario.uid));
        await deleteUser(auth.currentUser);
        alert("Cuenta eliminada con éxito.");
        window.location.href = "/";
      } catch (error) {
        console.error("Error al eliminar la cuenta:", error);
        alert("No se pudo eliminar la cuenta. Intenta nuevamente.");
      }
    }
  };

  return (
    <div className={`soporte-container ${modoOscuro ? "oscuro" : ""}`}>
      {/* Barra lateral */}
      <div className="soporte-sidebar">
        <h2>PANEL DE SOPORTE</h2>
        <button onClick={() => setVista("Inicio")}>Inicio</button>
        <button onClick={() => setVista("Solicitudes")}>Solicitudes</button>
        <button onClick={() => setVista("Configuracion")}>Configuración</button>
      </div>

      {/* Contenido principal */}
      <div className="soporte-main">
        {/* Encabezado con menú */}
        <div className="soporte-header">
          <div className="menu-opciones">
            <button
              className="menu-boton"
              onClick={() => setMenuAbierto(!menuAbierto)}
            >
              ⋮
            </button>
            {menuAbierto && (
              <div className="menu-desplegable">
                <button onClick={manejarCerrarSesion}>Cerrar sesión</button>
                <button onClick={manejarEliminarCuenta} className="eliminar">
                  Eliminar cuenta
                </button>
                <button onClick={() => setModoOscuro(!modoOscuro)}>
                  {modoOscuro ? "Modo claro" : "Modo oscuro"}
                </button>
              </div>
            )}
          </div>
        </div>

        {renderVista()}
      </div>
    </div>
  );
}
