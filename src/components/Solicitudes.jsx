import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  deleteDoc,
  doc,
} from "firebase/firestore";
import {
  Table,
  Tag,
  Spin,
  Alert,
  Card,
  Modal,
  Descriptions,
  Space,
  Button,
  Image,
} from "antd";
import "antd/dist/reset.css";

const statusMap = {
  pendiente: { color: "volcano", text: "PENDIENTE" },
  en_proceso: { color: "gold", text: "EN PROCESO" },
  atendido: { color: "green", text: "RESUELTO" },
};

function formatFecha(fecha) {
  if (!fecha) return "-";
  try {
    const d =
      typeof fecha.toDate === "function" ? fecha.toDate() : new Date(fecha);
    return new Intl.DateTimeFormat("es-PA", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(d);
  } catch {
    return "-";
  }
}

function renderTicketNumber(record) {
  const n = record?.numeroTicket;
  if (typeof n === "number" && Number.isFinite(n)) {
    return <strong>#{String(n).padStart(6, "0")}</strong>;
  }
  return (
    <strong>
      #
      {String(record?.id || "")
        .slice(0, 6)
        .toUpperCase()}
    </strong>
  );
}

const Solicitudes = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [ticketSel, setTicketSel] = useState(null);

  useEffect(() => {
    const q = query(collection(db, "tickets"), orderBy("fecha", "desc"));
    const unsub = onSnapshot(
      q,
      (snap) => {
        const data = snap.docs.map((d) => {
          const raw = d.data();
          return {
            id: d.id,
            ...raw,
            // mapeamos a los nombres que usa la tabla/modal
            usuarioNombre: raw.nombre || "", // nombre completo en una cadena
            usuarioCorreo: raw.usuario || "", // correo del usuario
          };
        });
        setTickets(data);
        setLoading(false);
      },
      (err) => {
        setError("Error al cargar tickets: " + err.message);
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const abrirDetalle = (record) => {
    setTicketSel(record);
    setDetalleOpen(true);
  };

  const cerrarDetalle = () => {
    setDetalleOpen(false);
    setTicketSel(null);
  };

  const eliminarTicket = async (record) => {
    if (
      !window.confirm(
        `¿Eliminar la solicitud #${
          record?.numeroTicket ?? record?.id
        }? Esta acción no se puede deshacer.`
      )
    ) {
      return;
    }
    try {
      await deleteDoc(doc(db, "tickets", record.id));
    } catch (e) {
      alert("No se pudo eliminar la solicitud: " + e.message);
    }
  };

  const columns = [
    {
      title: "N° Ticket",
      dataIndex: "numeroTicket",
      key: "numeroTicket",
      render: (_, record) => renderTicketNumber(record),
      width: 110,
      fixed: "left",
    },
    {
      title: "Fecha/Hora",
      dataIndex: "fecha",
      key: "fecha",
      render: (f) => formatFecha(f),
      width: 160,
    },
    {
      title: "Departamento",
      dataIndex: "departamento",
      key: "departamento",
      width: 150,
      render: (d) => d || <span style={{ color: "#999" }}>—</span>,
    },
    {
      title: "Tipo de Problema",
      dataIndex: "tipoProblema",
      key: "tipoProblema",
      width: 160,
    },
    {
      title: "Descripción",
      dataIndex: "descripcion",
      key: "descripcion",
      ellipsis: true,
      render: (txt) => (txt ? txt : <span style={{ color: "#999" }}>—</span>),
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      width: 130,
      render: (estado) => {
        const meta = statusMap[estado] || {
          color: "default",
          text: String(estado || "—").toUpperCase(),
        };
        return <Tag color={meta.color}>{meta.text}</Tag>;
      },
    },
    {
      title: "Técnico asignado",
      dataIndex: "tecnico",
      key: "tecnico",
      width: 180,
      render: (t) =>
        t ? (
          <Tag color="blue">{t}</Tag>
        ) : (
          <Tag color="default">NO ASIGNADO</Tag>
        ),
    },
    {
      title: "Usuario",
      dataIndex: "usuarioNombre",
      key: "usuarioNombre",
      width: 180,
      render: (nombre) => nombre || "—",
    },
    {
      title: "Correo",
      dataIndex: "usuarioCorreo",
      key: "usuarioCorreo",
      width: 220,
      render: (correo) => correo || <span style={{ color: "#999" }}>—</span>,
    },
    {
      title: "Acciones",
      key: "acciones",
      fixed: "right",
      width: 160,
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => abrirDetalle(record)}>
            Ver más
          </Button>
          <Button danger size="small" onClick={() => eliminarTicket(record)}>
            Eliminar
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="ESTADO DE SOLICITUDES A SOPORTE"
      bordered={false}
      style={{ margin: "20px" }}
    >
      {error && (
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          closable
          style={{ marginBottom: 20 }}
        />
      )}

      <Table
        columns={columns}
        dataSource={tickets}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 10 }}
        scroll={{ x: 1100 }}
        size="middle"
        locale={{
          emptyText: loading ? (
            <Spin tip="Cargando solicitudes..." />
          ) : (
            "No hay solicitudes registradas"
          ),
        }}
      />

      {/* Modal de Detalle */}
      <Modal
        open={detalleOpen}
        onCancel={cerrarDetalle}
        footer={null}
        title={
          <span>
            Detalle de la solicitud{" "}
            {ticketSel ? renderTicketNumber(ticketSel) : ""}
          </span>
        }
        width={800}
      >
        {ticketSel && (
          <div style={{ display: "grid", gap: 16 }}>
            <Descriptions
              bordered
              size="small"
              column={2}
              items={[
                {
                  key: "fecha",
                  label: "Fecha/Hora",
                  children: formatFecha(ticketSel.fecha),
                },
                {
                  key: "estado",
                  label: "Estado",
                  children: (
                    <Tag color={(statusMap[ticketSel.estado] || {}).color}>
                      {
                        (
                          statusMap[ticketSel.estado] || {
                            text: ticketSel.estado || "—",
                          }
                        ).text
                      }
                    </Tag>
                  ),
                },
                {
                  key: "tipo",
                  label: "Tipo de problema",
                  children: ticketSel.tipoProblema || "—",
                },
                {
                  key: "depto",
                  label: "Departamento",
                  children: ticketSel.departamento || "—",
                },
                {
                  key: "tecnico",
                  label: "Técnico asignado",
                  children: ticketSel.tecnico || "—",
                },
                {
                  key: "usuario",
                  label: "Usuario",
                  children: (
                    <div>
                      <div style={{ fontWeight: 600 }}>
                        {ticketSel.usuarioNombre || "—"}
                      </div>
                      <div style={{ color: "#666" }}>
                        {ticketSel.usuarioCorreo || "—"}
                      </div>
                    </div>
                  ),
                },
              ]}
            />

            <div>
              <h4 style={{ marginTop: 8 }}>Descripción</h4>
              <div
                style={{
                  background: "#fafafa",
                  border: "1px solid #f0f0f0",
                  borderRadius: 8,
                  padding: 12,
                  whiteSpace: "pre-wrap",
                }}
              >
                {ticketSel.descripcion || "—"}
              </div>
            </div>

            {Array.isArray(ticketSel.archivos) &&
              ticketSel.archivos.length > 0 && (
                <div>
                  <h4>Adjuntos</h4>
                  <Space wrap>
                    {ticketSel.archivos.map((f, idx) => {
                      const url = typeof f === "string" ? f : f?.url;
                      const name =
                        typeof f === "string"
                          ? archivo_`${idx + 1}`
                          : f?.name || archivo_`${idx + 1}`;
                      const type = typeof f === "string" ? "" : f?.type || "";
                      const isImg =
                        type.startsWith("image/") ||
                        /\.(png|jpg|jpeg|gif|webp)$/i.test(url || "");
                      return isImg ? (
                        <Image
                          key={idx}
                          src={url}
                          alt={name}
                          width={120}
                          style={{ borderRadius: 8 }}
                          placeholder
                        />
                      ) : (
                        <Button
                          key={idx}
                          type="link"
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          {name}
                        </Button>
                      );
                    })}
                  </Space>
                </div>
              )}
          </div>
        )}
      </Modal>
    </Card>
  );
};

export default Solicitudes;