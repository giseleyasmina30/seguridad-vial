import { useState, useRef, useEffect } from "react";

const SYSTEM_PROMPT = `Sos el asistente virtual oficial de Seguridad Vial de la Municipalidad de La Rioja Capital.
Tu nombre es VIAL IA.
Respondés ÚNICAMENTE con la información que figura en la base de datos oficial que te fue proporcionada. No inventás nada. Si no tenés la información, lo decís claramente y sugerís llamar al (3804) 298573.
Hablás en español, de forma clara, amable y directa. Usás "vos" como tratamiento.
Si alguien te saluda o pregunta algo genérico, respondés con una bienvenida y preguntás en qué trámite podés ayudar.

BASE DE DATOS OFICIAL:

=== LICENCIA PROFESIONAL CLASE D1 (Uber, Taxi, Remis) ===
Requisitos:
- 2 fotocopias de DNI
- Domicilio en La Rioja Capital
- 1 folio
- Certificado de antecedentes penales
- Generar boleta CENAT (https://boletadepago.seguridadvial.gob.ar) y abonarla EL DÍA del trámite (tiene vencimiento)
- Licencia particular Clase B con antigüedad mínima de 1 año
- Libre deuda contribución Rodados - Rentas Municipal

Previo al trámite:
- Curso de educación vial de duración mínima 5 horas
- Solicitar turno previo

El día del trámite:
- Revisión médica y psicológica con profesional del Centro de Emisión de Licencias
- Aprobar examen teórico de manejo
- Traer vehículo para examen práctico
- Timbrado de Rentas Municipal
- Traer cédula del/los vehículo/s
- Si sos diabético/a: presentar informe del especialista
- NO se acepta comprobante de antecedentes penales en trámite

=== LICENCIA PARTICULAR - PRIMERA VEZ (Moto Clase A / Auto Clase B) ===
Requisitos:
- 2 fotocopias de DNI
- Domicilio en La Rioja Capital
- Constancia de CUIL
- 1 folio
- Generar boleta CENAT y abonarla EL DÍA del trámite
- Libre deuda contribución Rodados - Rentas Municipal

Previo al trámite:
- Entregar documentación en la oficina
- Se asigna turno para el curso de Seguridad Vial

El día del trámite:
- Revisión médica
- Traer cédula del vehículo
- CENAT
- Lapicera para el curso
- Aprobar examen teórico
- Traer vehículo para examen práctico

=== LICENCIA PARTICULAR - RENOVACIÓN (Moto Clase A / Auto Clase B) ===
Requisitos:
- 2 fotocopias de DNI
- Rentas Municipal / Certificación de pago de tasas
- Libre deuda contribución Rodados
- 1 folio
- Generar boleta CENAT y abonarla EL DÍA del trámite
- Licencia vencida y fotocopia de la misma

El día del trámite:
- Revisión médica
- Lapicera para el curso
- Aprobar examen teórico
- Traer vehículo para examen práctico
- Traer cédula del vehículo
- CENAT

Observación: Una de las piezas indica que la licencia no puede tener más de 90 días de vencida. Conviene confirmar este dato llamando al (3804) 298573.

=== CERTIFICADO DE LEGALIDAD INTERNACIONAL ===
Pasos:
1. Firma de la autoridad de la Dirección General de Seguridad Vial Municipal Capital
2. Certificación de firma en Escribanía Municipal - Shopping Catedral, 2do piso
3. Certificación por el/la Intendente
4. Abonar Tasa de Justicia - Tribunal Superior de Justicia, frente a Plaza 25 de Mayo
5. Apostillar en el Colegio de Escribanos

=== CENAT ===
La boleta CENAT se genera en: https://boletadepago.seguridadvial.gob.ar
Debe abonarse EL DÍA del trámite porque tiene vencimiento.

=== CONTACTO ===
Teléfono: (3804) 298573
Organismo: Subsecretaría de Seguridad Vial. Ministerio de Seguridad, Justicia y Derechos Humanos.

REGLA IMPORTANTE: Si te preguntan algo que no está en esta base de datos, decís: "No tengo esa información disponible. Te recomiendo comunicarte directamente con la oficina al (3804) 298573."`;

const SUGGESTIONS = [
  "¿Qué necesito para sacar la licencia por primera vez?",
  "¿Cómo renuevo mi licencia?",
  "¿Qué es el CENAT y dónde lo pago?",
  "Quiero sacar la licencia profesional para Uber",
  "¿Cómo legalizo mi licencia para el exterior?",
  "¿Qué necesito si soy diabético/a?",
];

function generateId() {
  return Math.random().toString(36).substr(2, 9);
}

export default function SeguridadVialBot() {
  const [chats, setChats] = useState([{ id: generateId(), title: "Nueva consulta", messages: [] }]);
  const [activeChatId, setActiveChatId] = useState(chats[0].id);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const bottomRef = useRef(null);
  const textareaRef = useRef(null);

  const activeChat = chats.find((c) => c.id === activeChatId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages, loading]);

  const updateChat = (id, updater) => {
    setChats((prev) => prev.map((c) => (c.id === id ? updater(c) : c)));
  };

  const sendMessage = async (text) => {
    const userText = text || input.trim();
    if (!userText || loading) return;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "52px";
    setLoading(true);

    const userMsg = { role: "user", content: userText };
    const currentMessages = [...activeChat.messages, userMsg];

    updateChat(activeChatId, (c) => ({
      ...c,
      messages: currentMessages,
      title: c.messages.length === 0 ? userText.slice(0, 40) + (userText.length > 40 ? "..." : "") : c.title,
    }));

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
    
          },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: currentMessages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const data = await response.json();
      const reply = data.content?.[0]?.text || "No pude procesar tu consulta. Intentá de nuevo o llamá al (3804) 298573.";
      updateChat(activeChatId, (c) => ({ ...c, messages: [...c.messages, { role: "assistant", content: reply }] }));
    } catch {
      updateChat(activeChatId, (c) => ({ ...c, messages: [...c.messages, { role: "assistant", content: "Hubo un error. Por favor llamá al (3804) 298573." }] }));
    }
    setLoading(false);
  };

  const newChat = () => {
    const id = generateId();
    setChats((prev) => [{ id, title: "Nueva consulta", messages: [] }, ...prev]);
    setActiveChatId(id);
  };

  const deleteChat = (id, e) => {
    e.stopPropagation();
    const remaining = chats.filter((c) => c.id !== id);
    if (remaining.length === 0) {
      const nid = generateId();
      setChats([{ id: nid, title: "Nueva consulta", messages: [] }]);
      setActiveChatId(nid);
    } else {
      setChats(remaining);
      if (activeChatId === id) setActiveChatId(remaining[0].id);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const handleTextareaChange = (e) => {
    setInput(e.target.value);
    e.target.style.height = "52px";
    e.target.style.height = Math.min(e.target.scrollHeight, 140) + "px";
  };

  const isEmpty = activeChat?.messages.length === 0;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Barlow+Condensed:wght@400;500;600;700&family=Barlow:wght@300;400;500&display=swap');
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        :root {
          --bg: #f4f6f9;
          --sidebar: #1a2744;
          --sidebar-hover: #243258;
          --surface: #ffffff;
          --border: #e2e8f0;
          --accent: #1a56db;
          --accent-dark: #1648c0;
          --accent-soft: #eef2ff;
          --text: #1e293b;
          --text-muted: #64748b;
          --text-dim: #94a3b8;
          --user-bg: #eef2ff;
          --argentina: #74b9e0;
        }
        body { background: var(--bg); color: var(--text); font-family: 'Barlow', sans-serif; height: 100vh; overflow: hidden; }
        .app { display: flex; height: 100vh; width: 100vw; }

        /* SIDEBAR */
        .sidebar {
          width: 270px; min-width: 270px; background: var(--sidebar);
          display: flex; flex-direction: column;
          transition: all 0.3s ease; overflow: hidden;
        }
        .sidebar.closed { width: 0; min-width: 0; }

        .sidebar-header {
          padding: 20px 18px 16px;
          background: #0f1b38;
          border-bottom: 1px solid rgba(255,255,255,0.08);
        }

        .escudo {
          width: 36px; height: 36px; background: white; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          font-size: 18px; margin-bottom: 10px; flex-shrink: 0;
        }

        .org-name {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 11px; font-weight: 600; letter-spacing: 2px;
          text-transform: uppercase; color: rgba(255,255,255,0.5);
          line-height: 1.3; margin-bottom: 3px;
        }

        .dept-name {
          font-family: 'Barlow Condensed', sans-serif;
          font-size: 17px; font-weight: 700; letter-spacing: 1px;
          text-transform: uppercase; color: #ffffff;
          line-height: 1.2;
        }

        .dept-sub {
          font-size: 11px; color: var(--argentina);
          margin-top: 4px; font-weight: 400; letter-spacing: 0.5px;
        }

        .new-btn {
          margin: 14px 14px 8px;
          background: rgba(255,255,255,0.08);
          border: 1px solid rgba(255,255,255,0.12);
          color: rgba(255,255,255,0.85);
          font-family: 'Barlow', sans-serif; font-size: 13px; font-weight: 400;
          padding: 10px 14px; border-radius: 8px; cursor: pointer;
          display: flex; align-items: center; gap: 8px;
          width: calc(100% - 28px); transition: all 0.2s;
        }
        .new-btn:hover { background: rgba(255,255,255,0.14); }

        .sidebar-label {
          font-size: 10px; letter-spacing: 2px; text-transform: uppercase;
          color: rgba(255,255,255,0.25); padding: 8px 18px 4px;
        }

        .chat-list { flex: 1; overflow-y: auto; padding: 4px 8px; }
        .chat-list::-webkit-scrollbar { width: 3px; }
        .chat-list::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); }

        .chat-item {
          display: flex; align-items: center; justify-content: space-between;
          padding: 9px 12px; border-radius: 7px; cursor: pointer;
          font-size: 12.5px; color: rgba(255,255,255,0.5);
          transition: all 0.15s; gap: 8px; margin-bottom: 2px;
          font-weight: 300;
        }
        .chat-item:hover, .chat-item.active { background: var(--sidebar-hover); color: rgba(255,255,255,0.9); }
        .chat-item-title { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
        .del-btn { background: none; border: none; color: transparent; cursor: pointer; font-size: 16px; padding: 0 3px; transition: all 0.15s; }
        .chat-item:hover .del-btn { color: rgba(255,255,255,0.3); }
        .del-btn:hover { color: #fc8181!important; }

        .sidebar-footer {
          padding: 14px 18px; border-top: 1px solid rgba(255,255,255,0.08);
          font-size: 11px; color: rgba(255,255,255,0.25); text-align: center;
        }

        .contact-info {
          padding: 12px 14px; margin: 8px 14px;
          background: rgba(255,255,255,0.05);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 8px;
        }
        .contact-label { font-size: 9px; letter-spacing: 1.5px; text-transform: uppercase; color: rgba(255,255,255,0.3); margin-bottom: 4px; }
        .contact-phone { font-size: 14px; color: var(--argentina); font-weight: 500; letter-spacing: 0.5px; }

        /* MAIN */
        .main { flex: 1; display: flex; flex-direction: column; min-width: 0; background: var(--bg); }

        .topbar {
          display: flex; align-items: center; gap: 12px; padding: 13px 24px;
          background: white; border-bottom: 1px solid var(--border);
          box-shadow: 0 1px 3px rgba(0,0,0,0.05);
        }

        .toggle-btn {
          background: none; border: 1px solid var(--border); color: var(--text-muted);
          width: 34px; height: 34px; border-radius: 8px; cursor: pointer;
          display: flex; align-items: center; justify-content: center;
          font-size: 15px; transition: all 0.2s; flex-shrink: 0;
        }
        .toggle-btn:hover { border-color: var(--accent); color: var(--accent); }

        .topbar-title { font-size: 13px; color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-weight: 400; flex: 1; }

        .online-pill {
          background: #f0fdf4; border: 1px solid #bbf7d0;
          color: #16a34a; font-size: 10px; letter-spacing: 1.5px;
          padding: 4px 11px; border-radius: 20px; text-transform: uppercase;
          display: flex; align-items: center; gap: 5px; flex-shrink: 0; font-weight: 500;
        }
        .green-dot { width: 6px; height: 6px; background: #22c55e; border-radius: 50%; animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }

        /* MESSAGES */
        .messages { flex: 1; overflow-y: auto; scroll-behavior: smooth; }
        .messages::-webkit-scrollbar { width: 4px; }
        .messages::-webkit-scrollbar-thumb { background: var(--border); border-radius: 2px; }

        .empty-state {
          display: flex; flex-direction: column; align-items: center;
          justify-content: center; height: 100%; gap: 24px; padding: 40px 24px;
          animation: fadeUp 0.5s ease;
        }
        @keyframes fadeUp { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }

        .empty-header { text-align: center; }
        .empty-escudo { font-size: 48px; margin-bottom: 12px; }
        .empty-org { font-family: 'Barlow Condensed', sans-serif; font-size: 12px; font-weight: 600; letter-spacing: 3px; text-transform: uppercase; color: var(--text-dim); margin-bottom: 4px; }
        .empty-title { font-family: 'Barlow Condensed', sans-serif; font-size: 32px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: var(--sidebar); line-height: 1.1; }
        .empty-sub { font-size: 13px; color: var(--text-muted); margin-top: 8px; font-weight: 400; }

        .empty-intro {
          font-size: 15px; color: var(--text-muted); text-align: center;
          max-width: 460px; line-height: 1.7; font-weight: 300;
          background: white; border: 1px solid var(--border);
          border-radius: 12px; padding: 16px 20px;
        }

        .suggestions-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 10px; width: 100%; max-width: 580px; }
        .suggestion-card {
          background: white; border: 1px solid var(--border); border-radius: 10px;
          padding: 12px 16px; cursor: pointer; font-size: 13px; color: var(--text-muted);
          text-align: left; font-family: 'Barlow', sans-serif; transition: all 0.2s;
          line-height: 1.5; font-weight: 400;
        }
        .suggestion-card:hover { background: var(--accent-soft); border-color: #c7d7f8; color: var(--accent); transform: translateY(-1px); box-shadow: 0 2px 8px rgba(26,86,219,0.1); }

        /* MESSAGES */
        .message-row { padding: 18px 24px; display: flex; gap: 14px; max-width: 820px; margin: 0 auto; width: 100%; animation: fadeUp 0.25s ease; }
        .message-row.user-row { flex-direction: row-reverse; }

        .msg-av {
          width: 34px; height: 34px; border-radius: 8px;
          display: flex; align-items: center; justify-content: center;
          font-size: 11px; flex-shrink: 0; font-weight: 600;
          letter-spacing: 0.5px; font-family: 'Barlow Condensed', sans-serif;
        }
        .msg-av.bot { background: var(--sidebar); color: white; font-size: 13px; }
        .msg-av.user { background: var(--accent-soft); border: 1px solid #c7d7f8; color: var(--accent); }

        .msg-body { flex: 1; font-size: 14.5px; line-height: 1.78; color: var(--text); font-weight: 300; padding-top: 5px; max-width: 660px; white-space: pre-wrap; }
        .user-row .msg-body {
          background: var(--user-bg); border: 1px solid #c7d7f8;
          border-radius: 12px 12px 2px 12px; padding: 12px 16px;
          font-size: 14px; max-width: 500px; flex: none; white-space: pre-wrap;
        }

        .typing { display: flex; gap: 5px; align-items: center; padding: 8px 0; }
        .td { width: 7px; height: 7px; background: var(--accent); border-radius: 50%; opacity: 0.3; animation: bl 1.2s infinite; }
        .td:nth-child(2){animation-delay:.2s} .td:nth-child(3){animation-delay:.4s}
        @keyframes bl { 0%,100%{opacity:0.2;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }

        /* INPUT */
        .input-wrapper { padding: 14px 24px 18px; border-top: 1px solid var(--border); background: white; }
        .input-box {
          max-width: 820px; margin: 0 auto; background: var(--bg);
          border: 1px solid var(--border); border-radius: 12px;
          display: flex; align-items: flex-end; gap: 10px; padding: 10px 14px;
          transition: border-color 0.2s; box-shadow: 0 1px 3px rgba(0,0,0,0.04);
        }
        .input-box:focus-within { border-color: #93b4f8; box-shadow: 0 0 0 3px rgba(26,86,219,0.08); }

        .input-ta {
          flex: 1; background: none; border: none; outline: none; color: var(--text);
          font-family: 'Barlow', sans-serif; font-size: 14px; font-weight: 400;
          resize: none; line-height: 1.6; min-height: 52px; max-height: 140px; padding: 6px 0;
        }
        .input-ta::placeholder { color: var(--text-dim); }

        .send-btn {
          width: 38px; height: 38px; background: var(--accent); border: none;
          border-radius: 9px; cursor: pointer; display: flex; align-items: center;
          justify-content: center; flex-shrink: 0; margin-bottom: 3px; transition: all 0.2s;
        }
        .send-btn:hover { background: var(--accent-dark); transform: scale(1.05); }
        .send-btn:active { transform: scale(0.95); }
        .send-btn:disabled { background: var(--border); cursor: not-allowed; transform: none; }
        .send-btn:disabled path { fill: var(--text-dim); }

        .input-hint { text-align: center; font-size: 11px; color: var(--text-dim); margin-top: 8px; max-width: 820px; margin-left: auto; margin-right: auto; }

        @media(max-width:640px) {
          .sidebar { position: absolute; z-index: 100; height: 100vh; }
          .sidebar.closed { width: 0; min-width: 0; }
          .suggestions-grid { grid-template-columns: 1fr; }
        }
      `}</style>

      <div className="app">
        {/* SIDEBAR */}
        <div className={`sidebar ${sidebarOpen ? "" : "closed"}`}>
          <div className="sidebar-header">
            <div className="escudo">🛡️</div>
            <div className="org-name">Municipalidad de La Rioja</div>
            <div className="dept-name">Seguridad Vial</div>
            <div className="dept-sub">Asistente virtual con IA</div>
          </div>

          <button className="new-btn" onClick={newChat}>
            <span style={{fontSize:"16px"}}>＋</span> Nueva consulta
          </button>

          <div className="sidebar-label">Historial</div>

          <div className="chat-list">
            {chats.map((chat) => (
              <div key={chat.id} className={`chat-item ${chat.id === activeChatId ? "active" : ""}`} onClick={() => setActiveChatId(chat.id)}>
                <span className="chat-item-title">💬 {chat.title}</span>
                <button className="del-btn" onClick={(e) => deleteChat(chat.id, e)}>×</button>
              </div>
            ))}
          </div>

          <div className="contact-info">
            <div className="contact-label">📞 Contacto directo</div>
            <div className="contact-phone">(3804) 298573</div>
          </div>

          <div className="sidebar-footer">
            Subsecretaría de Seguridad Vial<br/>Ministerio de Seguridad · La Rioja
          </div>
        </div>

        {/* MAIN */}
        <div className="main">
          <div className="topbar">
            <button className="toggle-btn" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            <span className="topbar-title">{activeChat?.title || "Nueva consulta"}</span>
            <span className="online-pill"><span className="green-dot" /> En línea</span>
          </div>

          <div className="messages">
            {isEmpty ? (
              <div className="empty-state">
                <div className="empty-header">
                  <div className="empty-escudo">🛡️</div>
                  <div className="empty-org">Municipalidad de La Rioja Capital</div>
                  <div className="empty-title">Seguridad Vial</div>
                  <div className="empty-sub">Centro de Emisión de Licencias de Conducir</div>
                </div>
                <div className="empty-intro">
                  👋 Hola, soy <strong>VIAL IA</strong>. Puedo ayudarte con información sobre <strong>licencias de conducir</strong>, requisitos, trámites y más. ¿En qué te puedo ayudar hoy?
                </div>
                <div className="suggestions-grid">
                  {SUGGESTIONS.map((s, i) => (
                    <button key={i} className="suggestion-card" onClick={() => sendMessage(s)}>{s}</button>
                  ))}
                </div>
              </div>
            ) : (
              <>
                {activeChat.messages.map((msg, i) => (
                  <div key={i} className={`message-row ${msg.role === "user" ? "user-row" : ""}`}>
                    <div className={`msg-av ${msg.role === "user" ? "user" : "bot"}`}>
                      {msg.role === "user" ? "Vos" : "SV"}
                    </div>
                    <div className="msg-body">{msg.content}</div>
                  </div>
                ))}
                {loading && (
                  <div className="message-row">
                    <div className="msg-av bot">SV</div>
                    <div className="msg-body"><div className="typing"><div className="td"/><div className="td"/><div className="td"/></div></div>
                  </div>
                )}
                <div ref={bottomRef} />
              </>
            )}
          </div>

          <div className="input-wrapper">
            <div className="input-box">
              <textarea ref={textareaRef} className="input-ta" placeholder="Escribí tu consulta sobre licencias de conducir..." value={input} onChange={handleTextareaChange} onKeyDown={handleKeyDown} rows={1} />
              <button className="send-btn" onClick={() => sendMessage()} disabled={loading || !input.trim()}>
                <svg width="16" height="16" viewBox="0 0 24 24"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="white"/></svg>
              </button>
            </div>
            <p className="input-hint">Este asistente responde únicamente con información oficial de Seguridad Vial · (3804) 298573</p>
          </div>
        </div>
      </div>
    </>
  );
}
