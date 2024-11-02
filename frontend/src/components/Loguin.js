import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import facebookIcon from '../assets/Facebook.png';
import instagramIcon from '../assets/Instagram.png';
import twitterIcon from '../assets/Twitter.png';
import '../App.css';
import imagen3 from '../assets/Imagen3.jpg'; 
import imagen5 from '../assets/naturalezamuerta.jpg'; 
import imagen4 from '../assets/Imagen4.jpg'; 
import imagen6 from '../assets/perfil.jpg';
import Footer from './Footer';

// Definición de InfoBox
const InfoBox = ({ imageSrc, description }) => (
  <div className="info-item">
    <img src={imageSrc} alt={description} className="logo-image" />
    <p className="logo-description">{description}</p>
  </div>
);

const Loguin = ({ onLogin }) => {
  const [registrando, setRegistrando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null); 
  const navigate = useNavigate();

  const functAutenticacion = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const url = registrando 
        ? 'http://localhost:3000/api/usuarios' 
        : 'http://localhost:3000/api/usuarios/login';

      const bodyData = registrando 
        ? { nombre, correo: email, contrasena: password, tipo_usuario_id: 1 }
        : { correo: email, contrasena: password };

      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyData),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error en la autenticación");

      if (registrando) {
        setSuccessMessage("Usuario registrado correctamente");
        setTimeout(() => setRegistrando(false), 2000);
      } else {
        localStorage.setItem('token', data.token);
        localStorage.setItem('nombre', data.nombre);
        localStorage.setItem('tipo_usuario_id', data.tipo_usuario_id);
        onLogin(data);

        if (data.tipo_usuario_id === 2) {
          navigate('/home');  
        } else {
          navigate('/user-access');  
        }        
      }
    } catch (error) {
      setError(error.message || "Correo o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loguin-container">
      <header className="navbar-loguin">
        <a href="/">Inicio</a>
        <a href="/contacto">Contacto</a>
      </header>

      <div className="loguin-content">
        <div className="form-box">
          <h2>{registrando ? "Regístrate" : "Inicia Sesión"}</h2>
          {error && <p className="error-message">{error}</p>}
          {successMessage && <p className="success-message">{successMessage}</p>}
          <form onSubmit={functAutenticacion}>
            {registrando && (
              <input 
                type="text" 
                placeholder="Nombre" 
                className="input-field" 
                value={nombre} 
                onChange={(e) => setNombre(e.target.value)} 
                required 
              />
            )}
            <input 
              type="email" 
              placeholder="Correo electrónico" 
              className="input-field" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
            <div className="password-field">
              <input 
                type={showPassword ? 'text' : 'password'} 
                placeholder="Contraseña" 
                className="input-field" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
              <span 
                className="toggle-password" 
                onClick={() => setShowPassword(!showPassword)}
                style={{ cursor: 'pointer' }}
              >
                {showPassword ? "Ocultar" : "Mostrar"}
              </span>
            </div>
            <button className="btn-submit" disabled={loading}>
              {loading ? "Cargando..." : (registrando ? "Regístrate" : "Inicia Sesión")}
            </button>
          </form>

          <button className="btn-toggle" onClick={() => setRegistrando(!registrando)}>
            {registrando ? "¿Ya tienes una cuenta? Inicia sesión" : "¿No tienes cuenta? Regístrate"}
          </button>

          <div className="social-media">
            <p>Síguenos en:</p>
            <div className="social-icons">
              <a href="https://www.facebook.com" target="_blank" rel="noopener noreferrer">
                <img src={facebookIcon} alt="Facebook" className="icon-social" />
              </a>
              <a href="https://www.instagram.com/maraleste/" target="_blank" rel="noopener noreferrer">
                <img src={instagramIcon} alt="Instagram" className="icon-social" />
              </a>
              <a href="https://www.twitter.com" target="_blank" rel="noopener noreferrer">
                <img src={twitterIcon} alt="Twitter" className="icon-social" />
              </a>
            </div>
          </div>
        </div>

        <div className="centered-container">
          <div className="info-box">
            <InfoBox imageSrc={imagen3} description="Vista de montaje en lugar expositivo 2022" />
            <InfoBox imageSrc={imagen5} description="Temáticamente en esta obra se metaforiza acerca de la importancia de lo que hacemos con la vida y con lo que nos da vida" />
            <InfoBox imageSrc={imagen4} description="RELACIÓN VITAL Escultura Dibujo sobre hoja en resina cristal, hoja natural y rama de árbol natural." />
            <InfoBox imageSrc={imagen6} description="SUSURRO DEL DIOS CRONOS, de la serie Temporario" />
          </div>
        </div>

        <div className="image-section-loguin"></div>
      </div>
      <Footer />
    </div>
  );
};

export default Loguin;
