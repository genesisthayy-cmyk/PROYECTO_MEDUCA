import React from "react";
import "./adminstyle.css";

export default function Inicio({ usuario }) {
  // Intentar distintos campos para mostrar un nombre legible
  const nombre =
    usuario?.nombre || usuario?.displayName || usuario?.email || "Usuario";

  return (
    <div className="inicio-container">
      <div className="bienvenida-box">
        <h2 className="bienvenida-titulo">¡Bienvenido/a {nombre}!</h2>
        <p className="bienvenida-subtitulo">
          Nos alegra verte de nuevo en la red de soporte
        </p>
      </div>
    </div>
  );
}
