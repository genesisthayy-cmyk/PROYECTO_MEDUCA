import React, { useState } from "react";
import { auth, db } from "./firebaseConfig";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
} from "firebase/auth";
import {
  doc,
  setDoc,
  query,
  where,
  getDocs,
  collection,
} from "firebase/firestore";
import { EyeInvisibleOutlined, EyeTwoTone } from "@ant-design/icons";
import "./styles.css";

export default function AuthPanel() {
  const [isLogin, setIsLogin] = useState(true);
  const [nombre, setNombre] = useState("");
  const [apellidos, setApellidos] = useState("");
  const [cedula, setCedula] = useState("");
  const [extension, setExtension] = useState("");
  const [departamento, setDepartamento] = useState("");
  const [tipoUsuario, setTipoUsuario] = useState("Usuario Administrativo");
  const [correo, setCorreo] = useState("");
  const [correoPersonal, setCorreoPersonal] = useState("");
  const [contraseña, setContraseña] = useState("");
  const [mostrarPass, setMostrarPass] = useState(false);
  const [error, setError] = useState("");

  const departamentos = [
    "Soporte Tecnico",
    "Recursos Humanos",
    "Almacén",
    "Contraloría",
    "Arte y Cultura",
    "Planificación",
    "Asesoria Legal",
    "Asunto Estudiantil",
    "Bienes Patrimoniales",
    "Cisco Educativo",
    "Compras",
    "Contabilidad",
    "Depósito a la Orden",
    "Secretaria Dirección",
    "Equiparación de Oportunidades",
    "Estadística",
    "Evaluación Educativa",
    "FECE",
    "Padre de Familia",
    "Fondo Agropecuario",
    "Gestión De Riesgo",
    "Ingieneria y Arquitectura",
    "Lenguas Extranjeras",
    "Matrícula",
    "Nutrición",
    "Supervisión",
    "Pagos",
    "Perfeccionamiento",
    "Relaciones Públicas",
    "Robótica",
    "SIACE",
    "Subdirección técnico Administrativo",
    "Subdirección Técnico Docente",
    "Secretaria Subdirección",
    "Dirección",
    "Transporte",
  ];

  const handlePasswordReset = async () => {
    if (!correo) {
      alert("Por favor ingresa tu correo para recuperar la contraseña.");
      return;
    }
    try {
      await sendPasswordResetEmail(auth, correo);
      alert("Correo de recuperación enviado. Revisa tu bandeja de entrada.");
    } catch (err) {
      alert("Error al enviar el correo. Verifica el correo ingresado.");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      if (isLogin) {
        const userCredential = await signInWithEmailAndPassword(
          auth,
          correo,
          contraseña
        );

        const q = query(
          collection(db, "usuarios"),
          where("Correo", "==", correo)
        );
        const querySnapshot = await getDocs(q);

        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const tipo = userDoc.data().TipoUsuario || "Administrativo";
          alert(`Redirigiendo al panel de ${tipo}`);
          window.location.href = tipo === "Soporte" ? "/soporte" : "/admin";
        } else {
          alert("No se encontró el usuario en la base de datos.");
        }
      } else {
        const userCredential = await createUserWithEmailAndPassword(
          auth,
          correo,
          contraseña
        );
        const user = userCredential.user;

        await setDoc(doc(db, "usuarios", user.uid), {
          Nombre: nombre,
          Apellidos: apellidos,
          Cedula: cedula,
          Extension: extension,
          Departamento: departamento,
          TipoUsuario: tipoUsuario,
          Correo: correo,
          CorreoPersonal: correoPersonal || null,
          FechaRegistro: new Date().toISOString(),
        });

        alert("Registro exitoso ✅");
        setIsLogin(true);
      }
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h1 className="title">RED DE SOPORTE</h1>
        <h2 className="subtitle">SERVICIO TÉCNICO MEDUCA PANAMÁ OESTE</h2>
        <h3 className="form-title">
          {isLogin ? "Iniciar sesión" : "Registrarse"}
        </h3>

        <form onSubmit={handleSubmit} className="form">
          {!isLogin && (
            <div className="registro-grid">
              <div className="form-column">
                <input
                  type="text"
                  placeholder="Nombre"
                  value={nombre}
                  onChange={(e) => setNombre(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Apellidos"
                  value={apellidos}
                  onChange={(e) => setApellidos(e.target.value)}
                  required
                />
                <input
                  type="text"
                  placeholder="Cédula"
                  value={cedula}
                  onChange={(e) => setCedula(e.target.value)}
                  required
                />
              </div>

              <div className="form-column">
                <input
                  type="text"
                  placeholder="N° de Extensión"
                  value={extension}
                  onChange={(e) => setExtension(e.target.value)}
                  required
                />
                <label>Departamento</label>
                <select
                  value={departamento}
                  onChange={(e) => setDepartamento(e.target.value)}
                  required
                >
                  <option value="">Seleccione un departamento</option>
                  {departamentos.map((depto) => (
                    <option key={depto} value={depto}>
                      {depto}
                    </option>
                  ))}
                </select>
                <label>Tipo de usuario</label>
                <select
                  value={tipoUsuario}
                  onChange={(e) => setTipoUsuario(e.target.value)}
                  required
                >
                  <option value="Usuario Administrativo">
                    Usuario Administrativo
                  </option>
                  <option value="Soporte">Soporte</option>
                </select>
              </div>

              <div className="campo-completo">
                <input
                  type="email"
                  placeholder="Correo personal (opcional)"
                  value={correoPersonal}
                  onChange={(e) => setCorreoPersonal(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="campo-completo">
            <input
              type="email"
              placeholder="Correo institucional"
              value={correo}
              onChange={(e) => setCorreo(e.target.value)}
              required
            />
          </div>

          {/* Input de contraseña profesional */}
          <div className="campo-completo password-wrapper">
            <input
              type={mostrarPass ? "text" : "password"}
              placeholder="Contraseña"
              value={contraseña}
              onChange={(e) => setContraseña(e.target.value)}
              required
            />
            <span
              className="toggle-pass"
              onClick={() => setMostrarPass(!mostrarPass)}
            >
              {mostrarPass ? <EyeTwoTone /> : <EyeInvisibleOutlined />}
            </span>
          </div>

          {error && <p className="error">{error}</p>}

          <button type="submit" className="btn-primary">
            {isLogin ? "Iniciar sesión" : "Registrarse"}
          </button>

          {isLogin && (
            <p className="link">
              ¿Olvidaste tu contraseña?{" "}
              <span onClick={handlePasswordReset} className="recover">
                Recuperar
              </span>
            </p>
          )}
        </form>

        <p className="link">
          {isLogin ? (
            <>
              ¿No tienes cuenta?{" "}
              <span onClick={() => setIsLogin(false)}>Crear una</span>
            </>
          ) : (
            <>
              ¿Ya tienes cuenta?{" "}
              <span onClick={() => setIsLogin(true)}>Iniciar sesión</span>
            </>
          )}
        </p>
      </div>
    </div>
  );
}
