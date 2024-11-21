import React, { useState, useEffect } from 'react';
import { Bell, Check, X } from 'lucide-react';
import '../NotificacionesCenter.css';

const NotificacionesCenter = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const token = localStorage.getItem('token');
  const usuarioId = localStorage.getItem('id');

  const fetchNotifications = async () => {
    if (!token) {
      setError('No hay sesión activa');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      const response = await fetch(`http://localhost:3000/api/notificaciones/mis-notificaciones/${usuarioId}`, {
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
      
      if (!data || !Array.isArray(data.data)) {
        throw new Error('Formato de datos inválido');
      }
      
      setNotifications(data.data);
      setUnreadCount(data.data.filter(n => !n.leida).length);
    } catch (error) {
      console.error('Error al obtener notificaciones:', error);
      setError(error.message || 'Error al cargar las notificaciones');
      
      if (error.message === 'Sesión expirada') {
        localStorage.removeItem('token');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const markAsRead = async (notificationId, event) => {
    event.stopPropagation();
    if (!token) {
      setError('No hay sesión activa');
      return;
    }

    try {
      const response = await fetch(
        `http://localhost:3000/api/notificaciones/${notificationId}/marcar-leida`, 
        {
          method: 'PUT',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (!response.ok) {
        throw new Error('Error al marcar como leída');
      }
      
      // Actualización optimista
      setNotifications(notifications.map(notif => 
        notif.id === notificationId ? { ...notif, leida: true } : notif
      ));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error al marcar notificación como leída:', error);
      await fetchNotifications();
    }
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="notification-button"
        aria-label="Notificaciones"
      >
        <Bell className="notification-icon" />
        {unreadCount > 0 && (
          <span className="notification-badge">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="modal-overlay">
          <div 
            className="modal-backdrop"
            onClick={() => setIsOpen(false)}
          />
          
          <div className="notification-panel">
            <div className="notification-header">
              <div className="header-content">
                <Bell className="header-icon" />
                <h2 className="header-title">Notifications</h2>
                {unreadCount > 0 && (
                  <span className="unread-badge">
                    {unreadCount} nueva{unreadCount !== 1 ? 's' : ''}
                  </span>
                )}
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="close-button"
              >
                <X className="close-icon" />
              </button>
            </div>
            
            <div className="notification-content">
              {isLoading ? (
                <div className="loading-state">
                  <div className="loading-spinner"></div>
                  <p>Loading notifications...</p>
                </div>
              ) : error ? (
                <div className="error-state">
                  <p className="error-message">⚠️ {error}</p>
                  <button 
                    onClick={fetchNotifications}
                    className="retry-button"
                  >
                    Reintentar
                  </button>
                </div>
              ) : notifications.length > 0 ? (
                <div className="notification-list">
                  {notifications.map((notification) => (
                    <div
                      key={notification.id}
                      className={`notification-item ${!notification.leida ? 'unread' : ''}`}
                    >
                      <div className="notification-item-content">
                        <div className="notification-text">
                          <div className="notification-header-row">
                            <span className="notification-title">
                              {notification.tipo === 'nuevo_curso' ? 'New Course Available' : 'Notification'}
                            </span>
                            {!notification.leida && (
                              <span className="new-badge">
                                New
                              </span>
                            )}
                          </div>
                          <p className="notification-message">
                            {notification.contenido}
                          </p>
                          <div className="notification-time">
                            {new Date(notification.fecha_envio).toLocaleString()}
                          </div>
                        </div>
                        {!notification.leida && (
                          <button
                            onClick={(e) => markAsRead(notification.id, e)}
                            className="mark-read-button"
                            title="Mark as read"
                          >
                            <Check className="check-icon" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="empty-state">
                  <Bell className="empty-icon" />
                  <p className="empty-title">No notifications</p>
                  <p className="empty-subtitle">Notifications will appear here</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificacionesCenter;