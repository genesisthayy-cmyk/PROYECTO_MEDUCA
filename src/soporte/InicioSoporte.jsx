// InicioSoporte.jsx
import React from "react";

const InicioSoporte = ({ usuario }) => {
  return (
    <div className="welcome-card">
      <h1>Bienvenido al Panel de Soporte</h1>
      <p>
        Hola <strong>{usuario?.email || "Técnico"}</strong>, aquí podrás
        gestionar y dar seguimiento a las solicitudes enviadas por los
        administrativos.
      </p>
      
    </div>
  );
};

export default InicioSoporte;
