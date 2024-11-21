import React, { useState, useEffect } from 'react';
import '../UsuariosListIns.css';

const UsuariosListIns = () => {
  const [puntos, setPuntos] = useState([]);
  const [loading, setLoading] = useState(true); 
  const [error, setError] = useState(null); 

  const token = localStorage.getItem('token');
  const instructorId = localStorage.getItem('id'); 

  useEffect(() => {
    const fetchPuntos = async () => {
      if (!instructorId || !token) {
        setError('No se encontró el ID del instructor o el token en el localStorage.');
        setLoading(false);
        return;
      }

      try {
        const response = await fetch(
          `http://localhost:3000/api/usuarios/puntos/${instructorId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const data = await response.json();

        if (response.ok && data.data && Array.isArray(data.data.data)) {
            setPuntos(data.data.data); 
          } else {
            setError(data.message || 'Error desconocido al obtener los puntos.');
          }
      } catch (err) {
        setError('Error al obtener los puntos: ' + err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPuntos();
  }, [instructorId, token]);

  return (
    <div className="usuarios-list">
      <h2>Student Points Report</h2>
  
      {loading ? (
        <div>Loading data...</div>
      ) : error ? (
        <div className="error">{error}</div>
      ) : puntos.length > 0 ? (
        <table>
          <thead>
            <tr>
              <th>Student</th>
              <th>Course</th>
              <th>Enrollment Date</th>
              <th>Points Earned</th>
              <th>Total Grade</th>
            </tr>
          </thead>
          <tbody>
            {puntos.map((punto) => (
              <tr key={punto.usuario_id}>
                <td>{punto.usuario_nombre}</td>
                <td>{punto.curso_titulo}</td>
                <td>{new Date(punto.fecha_inscripcion).toLocaleDateString()}</td>
                <td>{punto.puntos_obtenidos}</td>
                <td>{punto.porcentaje_completitud}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div>No records found.</div>
      )}
    </div>
  );
};  

export default UsuariosListIns;
