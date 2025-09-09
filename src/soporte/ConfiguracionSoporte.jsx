import React, { useState, useEffect } from "react";
import "./configuración.css";
import { auth, db } from "../firebaseConfig";
import {
  sendPasswordResetEmail,
  updateEmail,
  updateProfile,
  deleteUser,
  signOut,
} from "firebase/auth";
import { doc, getDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { useNavigate } from "react-router-dom";

const ConfiguracionSoporte = () => {
  const navigate = useNavigate();
  const [userData, setUserData] = useState({
    nombre: "",
    apellidos: "",
    cedula: "",
    departamento: "",
    extension: "",
    email: "",
    emailAlternativo: "",
  });

  const [darkMode, setDarkMode] = useState(
    localStorage.getItem("darkMode") === "true" || false
  );
  const [passwordEmail, setPasswordEmail] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Cargar datos del usuario
  useEffect(() => {
    const loadUserData = async () => {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, "users", user.uid));
        if (userDoc.exists()) {
          setUserData((prev) => ({
            ...prev,
            ...userDoc.data(),
            email: user.email || "",
          }));
        } else {
          setUserData((prev) => ({
            ...prev,
            email: user.email || "",
          }));
        }
      }
    };
    loadUserData();
  }, []);

  // Cambiar tema
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark-mode");
      document.documentElement.classList.remove("light-mode");
    } else {
      document.documentElement.classList.add("light-mode");
      document.documentElement.classList.remove("dark-mode");
    }
    localStorage.setItem("darkMode", darkMode);
  }, [darkMode]);

  // Restablecer contraseña
  const handlePasswordReset = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    try {
      await sendPasswordResetEmail(auth, passwordEmail);
      setSuccessMessage("¡Correo enviado! Revisa tu bandeja de entrada.");
      setPasswordEmail("");
    } catch (error) {
      setErrorMessage(` Error: ${error.message} `);
    }
  };

  // Actualizar datos
  const handleUpdateUser = async (e) => {
    e.preventDefault();
    setSuccessMessage("");
    setErrorMessage("");
    try {
      const user = auth.currentUser;
      const userRef = doc(db, "users", user.uid);

      await updateDoc(userRef, {
        nombre: userData.nombre,
        apellidos: userData.apellidos,
        cedula: userData.cedula,
        departamento: userData.departamento,
        extension: userData.extension,
        emailAlternativo: userData.emailAlternativo,
      });

      if (user.email !== userData.email) {
        await updateEmail(user, userData.email);
        await updateDoc(userRef, { email: userData.email });
      }

      await updateProfile(user, {
        displayName: `${userData.nombre} ${userData.apellidos}`,
      });

      setSuccessMessage("¡Datos actualizados correctamente!");
    } catch (error) {
      setErrorMessage(` Error al actualizar: ${error.message} `);
    }
  };

  // Eliminar cuenta
  const handleDeleteAccount = async () => {
    if (
      !window.confirm(
        "⚠️ ¿Seguro que quieres eliminar tu cuenta? Esta acción no se puede deshacer."
      )
    ) {
      return;
    }
    try {
      const user = auth.currentUser;
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(user);
      alert("Cuenta eliminada correctamente.");
      navigate("/");
    } catch (error) {
      setErrorMessage(` Error al eliminar cuenta: ${error.message} `);
    }
  };

  // Cerrar sesión
  const handleLogout = async () => {
    await signOut(auth);
    navigate("/");
  };

  // Manejo de inputs
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setUserData((prev) => ({ ...prev, [name]: value }));
  };

  return (
    <div className="configuracion-container">
      <h1>Configuración de la Cuenta (Soporte)</h1>

      {successMessage && <div className="alert success">{successMessage}</div>}
      {errorMessage && <div className="alert error">{errorMessage}</div>}

      <div className="config-grid">
        {/* Cambiar contraseña */}
        <div className="config-section">
          <h2>Cambiar Contraseña</h2>
          <form onSubmit={handlePasswordReset}>
            <div className="form-group">
              <label>Correo electrónico registrado:</label>
              <input
                type="email"
                value={passwordEmail}
                onChange={(e) => setPasswordEmail(e.target.value)}
                required
                placeholder="tucorreo@dominio.com"
              />
            </div>
            <button type="submit" className="btn btn-primary">
              Enviar enlace
            </button>
          </form>
        </div>

        {/* Datos personales */}
        <div className="config-section">
          <h2>Datos Personales</h2>
          <form onSubmit={handleUpdateUser}>
            <div className="form-row">
              <div className="form-group">
                <label>Nombre:</label>
                <input
                  type="text"
                  name="nombre"
                  value={userData.nombre}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Apellidos:</label>
                <input
                  type="text"
                  name="apellidos"
                  value={userData.apellidos}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Cédula:</label>
                <input
                  type="text"
                  name="cedula"
                  value={userData.cedula}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="form-group">
                <label>Departamento:</label>
                <input
                  type="text"
                  name="departamento"
                  value={userData.departamento}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label>Extensión:</label>
                <input
                  type="text"
                  name="extension"
                  value={userData.extension}
                  onChange={handleInputChange}
                />
              </div>
              <div className="form-group">
                <label>Correo Principal:</label>
                <input
                  type="email"
                  name="email"
                  value={userData.email}
                  onChange={handleInputChange}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label>Correo Alternativo:</label>
              <input
                type="email"
                name="emailAlternativo"
                value={userData.emailAlternativo || ""}
                onChange={handleInputChange}
                placeholder="opcional@dominio.com"
              />
            </div>

            <button type="submit" className="btn btn-primary">
              Guardar Cambios
            </button>
          </form>
        </div>

        {/* Preferencias */}
        <div className="config-section">
          <h2>Preferencias</h2>
          <div className="toggle-theme">
            <span>Modo oscuro:</span>
            <label className="switch">
              <input
                type="checkbox"
                checked={darkMode}
                onChange={() => setDarkMode(!darkMode)}
              />
              <span className="slider round"></span>
            </label>
          </div>
        </div>

        {/* Opciones de cuenta (logout y eliminar) */}
        <div className="config-section">
          <h2>Opciones de Cuenta</h2>
          <button onClick={handleLogout} className="btn btn-secondary">
            Cerrar Sesión
          </button>
          <button onClick={handleDeleteAccount} className="btn btn-danger">
            Eliminar Cuenta
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfiguracionSoporte;
