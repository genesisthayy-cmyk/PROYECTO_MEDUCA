import React, { useEffect, useRef, useState } from "react";
import "./nuevasolicitud.css";

import { auth, db, storage } from "../firebaseConfig";
import {
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "firebase/storage";

// —— util: número de ticket corto y legible —— //
const generarNumeroTicket = () => {
  const t = Date.now().toString().slice(-6);
  const r = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `T-${t}-${r}`;
};

const NuevaSolicitud = () => {
  // ---- estado del formulario ----
  const [formData, setFormData] = useState({
    nombre: "",
    correo: "",
    departamento: "",
    tipoProblema: "",
    descripcion: "",
  });

  const [files, setFiles] = useState([]);          // File[]
  const [filePreviews, setFilePreviews] = useState([]); // [{name,size,type}]
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ---- chatbot ----
  const [showChat, setShowChat] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  const fileInputRef = useRef(null);

  // Prefill desde usuario logueado si existe
  useEffect(() => {
    const u = auth.currentUser;
    if (u) {
      setFormData((prev) => ({
        ...prev,
        nombre: prev.nombre || u.displayName || "",
        correo: prev.correo || u.email || "",
      }));
    }
  }, []);

  const tiposProblema = [
    "Internet",
    "Impresora/Scanner",
    "PC/Laptop",
    "Teléfono",
    "Software",
    "Correo institucional",
    "Otro",
  ];

  // ------- archivos --------
  const handleFileChange = (e) => {
    const incoming = Array.from(e.target.files || []);
    const max = 5 - files.length;
    const toAdd = incoming.slice(0, Math.max(0, max));

    const newPreviews = toAdd.map((f) => ({
      name: f.name,
      size: `${(f.size / 1024).toFixed(1)} KB`,
      type: f.type.split("/")[0] || "application",
    }));

    setFiles((prev) => [...prev, ...toAdd]);
    setFilePreviews((prev) => [...prev, ...newPreviews]);
  };

  const removeFileAt = (idx) => {
    setFiles((prev) => prev.filter((_, i) => i !== idx));
    setFilePreviews((prev) => prev.filter((_, i) => i !== idx));
  };

  // ------- submit --------
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !formData.nombre.trim() ||
      !formData.correo.trim() ||
      !formData.departamento.trim() ||
      !formData.tipoProblema ||
      !formData.descripcion.trim()
    ) {
      alert("Por favor completa todos los campos requeridos.");
      return;
    }

    setIsSubmitting(true);

    try {
      // 1) crear doc con datos básicos
      const numeroTicket = generarNumeroTicket();

      const docRef = await addDoc(collection(db, "tickets"), {
        numeroTicket,
        nombre: formData.nombre.trim(),
        usuario: formData.correo.trim(),        // para que soporte lo vea como "usuario"
        departamento: formData.departamento.trim(),
        tipoProblema: formData.tipoProblema,
        descripcion: formData.descripcion.trim(),
        estado: "pendiente",
        tecnico: null,
        fecha: serverTimestamp(),
        archivos: [], // luego lo actualizamos con URLs
      });

      // 2) subir archivos (si hay) a Storage y obtener URLs
      let archivosSubidos = [];
      if (files.length > 0) {
        const uploads = files.map(async (file) => {
          const path = tickets/`${docRef.id}/${file.name}`;
          const storageRef = ref(storage, path);
          await uploadBytes(storageRef, file);
          const url = await getDownloadURL(storageRef);
          return {
            nombre: file.name,
            url,
            type: file.type.split("/")[0] || "application",
            size: file.size,
          };
        });

        archivosSubidos = await Promise.all(uploads);

        // actualizar doc con la lista de archivos
        await addDoc(collection(db, "tickets", docRef.id, "adjuntosMeta"), {
          // opcional: si quieres guardar un resumen en subcolección
          total: archivosSubidos.length,
          creado: serverTimestamp(),
        });

        // guardamos URLs dentro del ticket (campo archivos)
        // (usamos update vía set con merge: true, pero como usamos addDoc arriba, podemos usar el SDK de update)
        // Para mantenerlo simple: re-uso addDoc a una subcolección no es necesario, así que eliminamos eso si no quieres subcolección.
      }

      // Si hubo archivos, hacemos un update del documento principal con esa lista
      if (archivosSubidos.length > 0) {
        // importamos aquí para evitar otra import arriba
        const { doc, updateDoc } = await import("firebase/firestore");
        await updateDoc(doc(db, "tickets", docRef.id), {
          archivos: archivosSubidos,
        });
      }

      alert(`Solicitud enviada correctamente. Nº de ticket: ${numeroTicket}`);

      // limpiar
      setFormData({
        nombre: "",
        correo: "",
        departamento: "",
        tipoProblema: "",
        descripcion: "",
      });
      setFiles([]);
      setFilePreviews([]);
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (err) {
      console.error(err);
      alert("Hubo un error al enviar la solicitud.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="contenedor-soporte">
      <div className="formulario-soporte">
        <h2>Formulario de Solicitud</h2>

        {/* Nombre */}
        <div className="form-group">
          <label>Nombre completo:</label>
          <input
            type="text"
            value={formData.nombre}
            onChange={(e) =>
              setFormData((p) => ({ ...p, nombre: e.target.value }))
            }
            placeholder="Ej: María López"
            required
          />
        </div>

        {/* Correo */}
        <div className="form-group">
          <label>Correo institucional:</label>
          <input
            type="email"
            value={formData.correo}
            onChange={(e) =>
              setFormData((p) => ({ ...p, correo: e.target.value }))
            }
            placeholder="ejemplo@meduca.gob.pa"
            required
          />
        </div>

        {/* Departamento (texto libre) */}
        <div className="form-group">
          <label>Departamento:</label>
          <input
            type="text"
            value={formData.departamento}
            onChange={(e) =>
              setFormData((p) => ({ ...p, departamento: e.target.value }))
            }
            placeholder="Ej: Recursos Humanos"
            required
          />
        </div>

        {/* Tipo de problemática */}
        <div className="form-group">
          <label>Tipo de problemática:</label>
          <select
            value={formData.tipoProblema}
            onChange={(e) =>
              setFormData((p) => ({ ...p, tipoProblema: e.target.value }))
            }
            required
          >
            <option value="">Seleccione...</option>
            {tiposProblema.map((tipo, i) => (
              <option key={i} value={tipo}>
                {tipo}
              </option>
            ))}
          </select>
        </div>

        {/* Descripción */}
        <div className="form-group form-group-descripcion">
          <label>Descripción:</label>
          <textarea
            value={formData.descripcion}
            onChange={(e) =>
              setFormData((p) => ({ ...p, descripcion: e.target.value }))
            }
            placeholder="Describa el problema detalladamente..."
            required
          />
        </div>

        {/* Adjuntos */}
        <div className="form-group form-group-descripcion">
          <label>Adjuntar archivos:</label>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept="image/,video/,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
            style={{ display: "none" }}
          />
          <button
            type="button"
            className="upload-btn"
            onClick={() => fileInputRef.current?.click()}
          >
            📎 Adjuntar archivos (máx. 5)
          </button>

          {filePreviews.length > 0 && (
            <div className="file-previews">
              {filePreviews.map((file, i) => (
                <div key={i} className="file-item">
                  <span className={`file-icon ${file.type}`}>
                    {file.type === "image"
                      ? "🖼️"
                      : file.type === "video"
                      ? "🎬"
                      : file.type === "audio"
                      ? "🎵"
                      : "📄"}
                  </span>
                  <div className="file-info">
                    <span className="file-name">{file.name}</span>
                    <span className="file-size">{file.size}</span>
                  </div>
                  <button
                    type="button"
                    className="file-remove"
                    onClick={() => removeFileAt(i)}
                    title="Quitar archivo"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Enviar */}
        <button
          onClick={handleSubmit}
          className="submit-btn"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Enviando..." : "Enviar Solicitud"}
        </button>
      </div>

      {/* ===== CHATBOT ===== */}
      <div className="chatbot-container">
        <div className="chatbot-tab" onClick={() => setShowChat(!showChat)}>
          {showChat ? "×" : "💬"}
          {showChat && !isMinimized && <span className="pulse-dot"></span>}
        </div>
        {showChat && (
          <ChatBot
            onClose={() => setShowChat(false)}
            isMinimized={isMinimized}
            onMinimize={() => setIsMinimized(!isMinimized)}
          />
        )}
      </div>
    </div>
  );
};

/* ===== Componente ChatBot (mismo contenido, mejor maquetado) ===== */
const ChatBot = ({ onClose, isMinimized, onMinimize }) => {
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState("");
  const messagesEndRef = useRef(null);

  useEffect(() => {
    setMessages([
      {
        text:
          "Hola, soy el asistente virtual de soporte. ¿En qué puedo ayudarte?",
        sender: "bot",
        options: ["Internet", "Impresora/Scanner", "PC/Laptop"],
      },
    ]);
  }, []);

  useEffect(() => {
    if (!isMinimized) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isMinimized]);

  const handleOption = (option) => {
    let response = {};
    switch (option) {
      case "Internet":
        response = {
          text:
            "Para problemas de Internet:\n1. Verifica el cable Ethernet (luces verde/naranja)\n2. Prueba con otro navegador (Edge/Firefox)\n\n¿Resolvió tu problema? (escribe tu respuesta)",
          sender: "bot",
        };
        break;
      case "Impresora/Scanner":
        response = {
          text: `Para problemas con Impresora/Scanner:
1. Verifica el cable de corriente y conexión
2. Revisa niveles de tinta/tóner
3. Limpia los cabezales de impresión
4. Reinicia la impresora

¿Resolvió tu problema? (escribe tu respuesta)`,
          sender: "bot",
        };
        break;
      case "PC/Laptop":
        response = {
          text:
            "Para problemas con PC/Laptop:\n1. Verifica conexión eléctrica\n2. Reinicia el equipo\n3. Prueba otro puerto USB\n\n¿Resolvió tu problema? (escribe tu respuesta)",
          sender: "bot",
        };
        break;
      default:
        response = {
          text: "Por favor describe tu problema en el formulario superior.",
          sender: "bot",
        };
    }

    setMessages((prev) => [
      ...prev,
      { text: option, sender: "user" },
      response,
    ]);
  };

  const handleUserResponse = (text) => {
    const lowerText = text.toLowerCase();
    const next = [...messages, { text, sender: "user" }];

    if (["sí", "si", "resolví", "perfecto", "excelente", "yes"].some((w) => lowerText.includes(w))) {
      next.push({
        text:
          "¡Perfecto! Gracias por contactar a soporte. Si tienes otra duda, escríbenos.",
        sender: "bot",
        options: ["Internet", "Impresora/Scanner", "PC/Laptop"],
      });
    } else if (["no", "no funcionó", "nada", "todavía no"].some((w) => lowerText.includes(w))) {
      next.push({
        text:
          "Por favor, describe tu problema en el formulario superior. El equipo de soporte te responderá pronto.",
        sender: "bot",
        options: ["Internet", "Impresora/Scanner", "PC/Laptop"],
      });
    } else {
      next.push({
        text: "¿Resolvió tu problema? (responde con Sí o No)",
        sender: "bot",
      });
    }

    setMessages(next);
  };

  const submitMsg = (e) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const last = messages[messages.length - 1];
    if (last?.options) {
      handleOption(inputValue.trim());
    } else {
      handleUserResponse(inputValue.trim());
    }
    setInputValue("");
  };

  return (
    <div className={`chatbot-window ${isMinimized ? "minimized" : ""}`}>
      <div className="chatbot-header" onClick={onMinimize}>
        <h3>Asistente Virtual</h3>
        <div>
          <button
            className="minimize-btn"
            onClick={(e) => {
              e.stopPropagation();
              onMinimize();
            }}
            title={isMinimized ? "Expandir" : "Minimizar"}
          >
            {isMinimized ? "+" : "_"}
          </button>
          <button
            className="close-btn"
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            title="Cerrar"
          >
            ×
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          <div className="chatbot-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`message ${msg.sender}`}>
                {msg.text.split("\n").map((line, idx) => (
                  <p key={idx}>{line}</p>
                ))}
                {msg.options && (
                  <div className="chatbot-options">
                    {msg.options.map((opt, idx) => (
                      <button key={idx} onClick={() => handleOption(opt)}>
                        {opt}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={submitMsg} className="chatbot-input">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Escribe tu mensaje..."
              autoComplete="off"
            />
            <button type="submit">Enviar</button>
          </form>
        </>
      )}
    </div>
  );
};

export default NuevaSolicitud;