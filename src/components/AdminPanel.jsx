import React, { useState } from "react";
import "./adminstyle.css";
import Inicio from "./inicio";
import NuevaSolicitud from "./NuevaSolicitud";
import Solicitudes from "./Solicitudes";
import Configuracion from "./configuracion";

export default function AdminPanel({ usuario }) {
  const [vista, setVista] = useState("Inicio");
  const [menuOpen, setMenuOpen] = useState(false);

  const renderVista = () => {
    switch (vista) {
      case "Inicio":
        return <Inicio usuario={usuario} />;
      case "NuevaSolicitud":
        return <NuevaSolicitud usuario={usuario} />;
      case "Solicitudes":
        return <Solicitudes usuario={usuario} />;
      case "Configuracion":
        return <Configuracion usuario={usuario} />;
      default:
        return <Inicio usuario={usuario} />;
    }
  };

  return (
    <div className="admin-container">
      {/* Barra lateral */}
      <div className="sidebar">
        <h2>PANEL ADMINISTRATIVO</h2>
        <button onClick={() => setVista("Inicio")}>Inicio</button>
        <button onClick={() => setVista("NuevaSolicitud")}>
          Nueva Solicitud
        </button>
        <button onClick={() => setVista("Solicitudes")}>Solicitudes</button>
        <button onClick={() => setVista("Configuracion")}>Configuración</button>
      </div>

      {/* Contenido principal */}
      <div className="content">
        {/* Menú tres puntitos */}
        <div className="menu-opciones">
          <button className="menu-btn" onClick={() => setMenuOpen(!menuOpen)}>
            ⋮
          </button>
          {menuOpen && (
            <div className="menu-dropdown">
              <button onClick={() => alert("Cerrar sesión")}>
                Cerrar sesión
              </button>
              <button onClick={() => alert("Eliminar cuenta")}>
                Eliminar cuenta
              </button>
            </div>
          )}
        </div>

        {renderVista()}
      </div>
    </div>
  );
}
