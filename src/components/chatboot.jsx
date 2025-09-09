import React, { useState } from "react";

export default function Chatbot() {
  const [chatInput, setChatInput] = useState("");
  const [chatMensajes, setChatMensajes] = useState([]);

  const respuestas = {
    internet: "Verifica el cableado y reinicia el router.",
    impresora: "Asegúrate de que esté conectada y con tinta.",
    correo: "Comprueba tu contraseña y conexión a internet."
  };

  const handleChat = (e) => {
    e.preventDefault();
    if (chatInput.trim()) {
      const userMsg = { tipo: "usuario", texto: chatInput };
      let botRespuesta = "No entiendo tu consulta, ¿puedes dar más detalles?";
      Object.keys(respuestas).forEach((key) => {
        if (chatInput.toLowerCase().includes(key)) {
          botRespuesta = respuestas[key];
        }
      });
      const botMsg = { tipo: "bot", texto: botRespuesta };

      setChatMensajes([...chatMensajes, userMsg, botMsg]);
      setChatInput("");
    }
  };

  return (
    <div className="chatbot">
      <h3>Asistente Virtual</h3>
      <div className="chat-mensajes">
        {chatMensajes.map((msg, index) => (
          <div key={index} className={msg.tipo}>
            <p>{msg.texto}</p>
          </div>
        ))}
      </div>
      <form onSubmit={handleChat} className="chat-form">
        <input
          type="text"
          placeholder="Escribe tu duda aquí..."
          value={chatInput}
          onChange={(e) => setChatInput(e.target.value)}
        />
        <button type="submit">Enviar</button>
      </form>
    </div>
  );
}