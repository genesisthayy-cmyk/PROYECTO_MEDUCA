import React, { useEffect, useState } from "react";
import { db } from "../firebaseConfig";
import {
  collection,
  onSnapshot,
  updateDoc,
  doc,
  deleteDoc,
} from "firebase/firestore";
import {
  Table,
  Tag,
  Spin,
  Alert,
  Card,
  Select,
  Button,
  Modal,
  Descriptions,
  Space,
} from "antd";
import "antd/dist/reset.css";

const { Option } = Select;

const tecnicosDisponibles = [
  "Ricardo Fosatti",
  "Humberto Núñez",
  "Laura Arosemena",
  "Jan González",
  "Andy Emerick",
  "Practicantes",
];

const estadosDisponibles = [
  { value: "pendiente", label: "Pendiente", color: "volcano" },
  { value: "en_proceso", label: "En Proceso", color: "gold" },
  { value: "atendido", label: "Resuelto", color: "green" },
];

const SolicitudesSoporte = () => {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [detalleOpen, setDetalleOpen] = useState(false);
  const [ticketSel, setTicketSel] = useState(null);

  // Escuchar tickets
  useEffect(() => {
    const unsub = onSnapshot(
      collection(db, "tickets"),
      (snapshot) => {
        const data = snapshot.docs.map((doc, index) => ({
          id: doc.id,
          numeroTicket: index + 1, // números secuenciales
          ...doc.data(),
        }));
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

  // Actualizar estado o técnico
  const actualizarCampo = async (id, campo, valor) => {
    try {
      const ticketRef = doc(db, "tickets", id);
      await updateDoc(ticketRef, { [campo]: valor });
    } catch (err) {
      console.error("Error al actualizar:", err);
    }
  };

  // Eliminar
  const eliminarTicket = async (id) => {
    try {
      await deleteDoc(doc(db, "tickets", id));
    } catch (err) {
      console.error("Error eliminando ticket:", err);
    }
  };

  // Columnas de soporte
  const columns = [
    {
      title: "N° Ticket",
      dataIndex: "numeroTicket",
      key: "numeroTicket",
      render: (num) => <strong>#{num}</strong>,
      width: 100,
    },
    {
      title: "Fecha/Hora",
      dataIndex: "fecha",
      key: "fecha",
      render: (fecha) =>
        fecha ? new Date(fecha.toDate()).toLocaleString() : "-",
      width: 160,
    },
    {
      title: "Departamento",
      dataIndex: "departamento",
      key: "departamento",
      width: 180,
    },
    {
      title: "Tipo de Problema",
      dataIndex: "tipoProblema",
      key: "tipoProblema",
      width: 180,
    },
    {
      title: "Descripción",
      dataIndex: "descripcion",
      key: "descripcion",
      ellipsis: true,
      width: 250,
    },
    {
      title: "Estado",
      dataIndex: "estado",
      key: "estado",
      render: (estado, record) => (
        <Select
          defaultValue={estado}
          style={{ width: 150 }}
          onChange={(nuevoEstado) =>
            actualizarCampo(record.id, "estado", nuevoEstado)
          }
        >
          {estadosDisponibles.map((e) => (
            <Option key={e.value} value={e.value}>
              <Tag color={e.color}>{e.label}</Tag>
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: "Técnico Asignado",
      dataIndex: "tecnico",
      key: "tecnico",
      render: (tecnico, record) => (
        <Select
          defaultValue={tecnico || ""}
          style={{ width: 180 }}
          placeholder="Seleccionar técnico"
          onChange={(nuevoTecnico) =>
            actualizarCampo(record.id, "tecnico", nuevoTecnico)
          }
        >
          {tecnicosDisponibles.map((t) => (
            <Option key={t} value={t}>
              {t}
            </Option>
          ))}
        </Select>
      ),
    },
    {
      title: "Acciones",
      key: "acciones",
      render: (_, record) => (
        <Space>
          <Button size="small" onClick={() => { setTicketSel(record); setDetalleOpen(true); }}>
            Ver más
          </Button>
          <Button danger size="small" onClick={() => eliminarTicket(record.id)}>
            Eliminar
          </Button>
        </Space>
      ),
    },
  ];

  return (
    <Card
      title="GESTIÓN DE SOLICITUDES - SOPORTE"
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
        pagination={{ pageSize: 8 }}
        scroll={{ x: 1200 }}
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
        onCancel={() => { setDetalleOpen(false); setTicketSel(null); }}
        footer={null}
        title={
          <span>
            Detalle de la solicitud{" "}
            {ticketSel ? `#${ticketSel.numeroTicket}` : ""}
          </span>
        }
        width={700}
      >
        {ticketSel && (
          <Descriptions bordered size="small" column={2}>
            <Descriptions.Item label="Fecha/Hora">
              {ticketSel.fecha
                ? new Date(ticketSel.fecha.toDate()).toLocaleString()
                : "-"}
            </Descriptions.Item>
            <Descriptions.Item label="Estado">
              {ticketSel.estado || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Tipo de problema">
              {ticketSel.tipoProblema || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Departamento">
              {ticketSel.departamento || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Técnico asignado">
              {ticketSel.tecnico || "—"}
            </Descriptions.Item>
            <Descriptions.Item label="Usuario">
              <div style={{ fontWeight: 600 }}>
                {/* muestra cualquiera de los dos campos disponibles */}
                {ticketSel.usuarioNombre || ticketSel.nombre || "—"}
              </div>
              <div style={{ color: "#666" }}>
                {ticketSel.usuarioCorreo || ticketSel.usuario || "—"}
              </div>
            </Descriptions.Item>
          </Descriptions>
        )}

        {ticketSel && (
          <div style={{ marginTop: 16 }}>
            <h4>Descripción</h4>
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
        )}
      </Modal>
    </Card>
  );
};

export default SolicitudesSoporte;