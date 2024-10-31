import React, { useEffect, useState } from 'react';
import '../UserManagement.css'; 

const UserManagement = () => {
    const [usuarios, setUsuarios] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const token = localStorage.getItem('token');

    useEffect(() => {
        const fetchUsuarios = async () => {
            setLoading(true);
            try {
                const response = await fetch('http://localhost:3000/api/usuarios/todos', {
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message);
                }
                setUsuarios(Array.isArray(data.data.data) ? data.data.data : []); 
            } catch (error) {
                setError('Error al cargar los usuarios: ' + error.message);
            } finally {
                setLoading(false);
            }
        };

        fetchUsuarios();
    }, [token]);

    const handleDelete = async (id) => {
        const confirmed = window.confirm('¿Estás seguro de que quieres eliminar este usuario?');
        if (confirmed) {
            try {
                const response = await fetch(`http://localhost:3000/api/usuarios/${id}`, {
                    method: 'DELETE',
                    headers: {
                        'Authorization': `Bearer ${token}`
                    }
                });
                if (!response.ok) {
                    throw new Error('Error al eliminar el usuario');
                }
                setUsuarios(usuarios.filter(user => user.id !== id));
            } catch (error) {
                setError('Error al eliminar el usuario: ' + error.message);
            }
        }
    };

    const handleRoleChange = async (id, newRole) => {
        const confirmed = window.confirm('¿Estás seguro de que deseas cambiar el rol de este usuario?');
        if (confirmed) {
            try {
                const response = await fetch(`http://localhost:3000/api/usuarios/${id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({ tipo_usuario_id: newRole })
                });
                if (!response.ok) {
                    throw new Error('Error al actualizar el rol del usuario');
                }
                setUsuarios(usuarios.map(user => (user.id === id ? { ...user, tipo_usuario_id: newRole } : user)));
            } catch (error) {
                setError('Error al cambiar el rol: ' + error.message);
            }
        }
    };

    return (
        <div className="user-management-container">
            <h1>Gestión de Usuarios</h1>
            {loading ? (
                <p>Cargando usuarios...</p>
            ) : error ? (
                <p>{error}</p>
            ) : (
                <table>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Nombre</th>
                            <th>Correo</th>
                            <th>Rol</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        {usuarios.length > 0 ? (
                            usuarios.map(usuario => (
                                <tr key={usuario.id}>
                                    <td>{usuario.id}</td>
                                    <td>{usuario.nombre}</td>
                                    <td>{usuario.correo}</td>
                                    <td>
                                        <select
                                            value={usuario.tipo_usuario_id}
                                            onChange={(e) => handleRoleChange(usuario.id, e.target.value)}
                                        >
                                            <option value="1">Usuario</option>
                                            <option value="2">Administrador</option>
                                            <option value="3">Instructor</option>
                                        </select>
                                    </td>
                                    <td>
                                        <button onClick={() => handleDelete(usuario.id)}>Eliminar</button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5">No hay usuarios disponibles</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default UserManagement;
