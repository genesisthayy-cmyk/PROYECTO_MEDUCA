import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import AuthPanel from "./AuthPanel";
import AdminPanel from "./components/AdminPanel";
import SoportePanel from "./soporte/SoportePanel";

function App() {
  // Define el usuarioDemo correctamente
  const usuarioDemo = {
    nombre: "Usuario de Soporte", // Añade el valor que falta
  };

  return (
    <Router>
      <Routes>
        <Route path="/" element={<AuthPanel />} />
        <Route path="/admin" element={<AdminPanel />} />
        {/* Corregimos la ruta a "/soporte" y pasamos la prop usuario */}
        <Route
          path="/soporte"
          element={<SoportePanel usuario={usuarioDemo} />}
        />
      </Routes>
    </Router>
  );
}

export default App;
