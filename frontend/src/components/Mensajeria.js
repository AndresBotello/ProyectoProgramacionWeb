import React, { useState, useEffect } from 'react';
import { Send, User } from 'lucide-react';
import '../Mensajeria.css';

const Mensajeria = () => {
  const [conversacion, setConversacion] = useState([]);
  const [nuevoMensaje, setNuevoMensaje] = useState('');
  const [destinatarioId, setDestinatarioId] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const token = localStorage.getItem('token');
  const usuarioActual = localStorage.getItem('id');
  const tipoUsuario = localStorage.getItem('tipo_usuario_id');

  const cargarConversacion = async () => {
    if (!token || !destinatarioId) {
      setIsLoading(false);
      return;
    }
  
    try {
      setIsLoading(true);
      setError(null);
  
      const response = await fetch(`http://localhost:3000/api/mensajeria/conversacion/${usuarioActual}/${destinatarioId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (!response.ok) {
        if (response.status === 401) {
          throw new Error('Sesión expirada');
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
  
      const data = await response.json();
      setConversacion(data.data.data || []); // Remove .reverse()
    } catch (error) {
      console.error('Error al cargar conversación:', error);
      setError(error.message || 'Error al cargar la conversación');
    } finally {
      setIsLoading(false);
    }
  };

  const cargarUsuarios = async () => {
    if (!token) return;
  
    try {
      const endpoint = tipoUsuario === '3' 
        ? 'http://localhost:3000/api/usuarios/alumnos'
        : 'http://localhost:3000/api/usuarios/instructores';
  
      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (!response.ok) throw new Error('Error al cargar usuarios');
  
      const data = await response.json();
      setUsuarios(Array.isArray(data.data.data) ? data.data.data : []);
    } catch (error) {
      console.error('Error al cargar usuarios:', error);
      setError('Error al cargar usuarios');
    }
  };

  useEffect(() => {
    cargarUsuarios();
  }, []);

  useEffect(() => {
    if (destinatarioId) {
      cargarConversacion();
      const interval = setInterval(cargarConversacion, 30000); 
      return () => clearInterval(interval);
    }
  }, [destinatarioId]);

  const enviarMensaje = async (e) => {
    e.preventDefault();
    if (!nuevoMensaje.trim() || !destinatarioId || !token) return;

    try {
      const response = await fetch('http://localhost:3000/api/mensajeria/enviar', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          remitente_id: usuarioActual,
          destinatario_id: destinatarioId,
          contenido: nuevoMensaje
        }),
      });

      if (!response.ok) throw new Error('Error al enviar mensaje');

      setNuevoMensaje('');
      await cargarConversacion();
    } catch (error) {
      console.error('Error al enviar mensaje:', error);
      setError('Error al enviar el mensaje');
    }
  };

  return (
    <div className="mensajeria-container">
      <div className="mensajeria-form">
        <select
          value={destinatarioId}
          onChange={(e) => setDestinatarioId(e.target.value)}
          className="destinatario-select"
        >
          <option value="">Select recipient</option>
          {usuarios.map((usuario) => (
            <option key={usuario.id} value={usuario.id}>
              {usuario.nombre}
            </option>
          ))}
        </select>
        
        {destinatarioId && (
          <div className="conversacion-container">
            <div className="mensajes-container">
              {isLoading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading conversation...</p>
                </div>
              ) : error ? (
                <div className="error-state">
                  <p className="error-message">⚠️ {error}</p>
                </div>
              ) : conversacion.length > 0 ? (
                conversacion.map((mensaje) => (
                  <div 
                    key={mensaje.id}
                    className={`mensaje-item ${mensaje.remitente_id === usuarioActual ? 'mensaje-enviado' : 'mensaje-recibido'}`}
                  >
                    <div className="mensaje-header">
                      <span className="mensaje-nombre">
                        {mensaje.remitente_id === usuarioActual ? 'Tú' : mensaje.remitente_nombre}
                      </span>
                      <span className="mensaje-fecha">
                        {new Date(mensaje.fecha_envio).toLocaleString()}
                      </span>
                    </div>
                    <p className="mensaje-contenido">{mensaje.contenido}</p>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <p>There are no messages in this conversation</p>
                </div>
              )}
            </div>

            <form onSubmit={enviarMensaje} className="mensaje-form">
              <textarea
                value={nuevoMensaje}
                onChange={(e) => setNuevoMensaje(e.target.value)}
                placeholder="Escribe tu mensaje aquí..."
                className="mensaje-input"
                rows={4}
              />
              <button type="submit" className="enviar-button">
                <Send className="enviar-icon" />
                Send
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Mensajeria;