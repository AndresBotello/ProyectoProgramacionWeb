import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../App.css';
import imagen3 from '../assets/Imagen3.jpg'; 
import imagen5 from '../assets/naturalezamuerta.jpg'; 
import imagen4 from '../assets/Imagen4.jpg'; 
import imagen6 from '../assets/perfil.jpg';
import Footer from './Footer';

const InfoBox = ({ imageSrc, description }) => (
  <div className="info-item">
    <img src={imageSrc} alt={description} className="logo-image" />
    <p className="logo-description">{description}</p>
  </div>
);

const Loguin = ({ onLogin }) => {
  const [registrando, setRegistrando] = useState(false);
  const [isRecovering, setIsRecovering] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [nombre, setNombre] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [recoveryCode, setRecoveryCode] = useState('');
  const [verificationCode, setVerificationCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
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
        setSuccessMessage("Usuario registrado correctamente. Verifica tu correo.");
        setIsVerifying(true);
      } else {
        localStorage.setItem('token', data.token);
        localStorage.setItem('nombre', data.nombre);
        localStorage.setItem('tipo_usuario_id', data.tipo_usuario_id);
        onLogin(data);

        navigate(data.tipo_usuario_id === 2 ? '/home' : '/user-access');  
      }
    } catch (error) {
      setError(error.message || "Correo o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordRecovery = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/usuarios/password-recovery', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: email }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error en la recuperación de contraseña");
      
      setSuccessMessage("Código de recuperación enviado a tu correo.");
      setIsVerifying(true);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleVerifyCodeAndResetPassword = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/usuarios/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: email, codigo: recoveryCode, nuevaContrasena: newPassword }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error al restablecer la contraseña");

      setSuccessMessage("Contraseña restablecida con éxito. Inicia sesión con tu nueva contraseña.");
      setIsRecovering(false);
      setIsVerifying(false);
    } catch (error) {
      setError(error.message);
    }
  };

  const handleVerifyEmail = async () => {
    try {
      const response = await fetch('http://localhost:3000/api/usuarios/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo: email, codigo: verificationCode }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.message || "Error en la verificación de correo");

      setSuccessMessage("Correo verificado exitosamente. Inicia sesión.");
      setIsVerifying(false);
      setRegistrando(false); 
    } catch (error) {
      setError(error.message);
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
          {!isRecovering && !isVerifying && (
            <>
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
              <button className="btn-toggle" onClick={() => setIsRecovering(true)}>
                ¿Olvidaste tu contraseña?
              </button>
            </>
          )}

          {isRecovering && !isVerifying && (
            <>
              <h2>Recuperar Contraseña</h2>
              <input 
                type="email" 
                placeholder="Correo electrónico" 
                className="input-field" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
              <button onClick={handlePasswordRecovery} className="btn-submit">
                Enviar Código de Recuperación
              </button>
              <button className="btn-toggle" onClick={() => setIsRecovering(false)}>
                Regresar
              </button>
            </>
          )}

          {isVerifying && registrando && (
            <>
              <h2>Verificar Correo Electrónico</h2>
              <input 
                type="text" 
                placeholder="Código de verificación" 
                className="input-field" 
                value={verificationCode} 
                onChange={(e) => setVerificationCode(e.target.value)} 
                required 
              />
              <button onClick={handleVerifyEmail} className="btn-submit">
                Verificar Correo
              </button>
            </>
          )}

          {isVerifying && isRecovering && (
            <>
              <h2>Verificar Código y Restablecer Contraseña</h2>
              <input 
                type="text" 
                placeholder="Código de recuperación" 
                className="input-field" 
                value={recoveryCode} 
                onChange={(e) => setRecoveryCode(e.target.value)} 
                required 
              />
              <input 
                type="password" 
                placeholder="Nueva Contraseña" 
                className="input-field" 
                value={newPassword} 
                onChange={(e) => setNewPassword(e.target.value)} 
                required 
              />
              <button onClick={handleVerifyCodeAndResetPassword} className="btn-submit">
                Restablecer Contraseña
              </button>
              <button className="btn-toggle" onClick={() => { setIsVerifying(false); setIsRecovering(false); }}>
                Regresar
              </button>
            </>
          )}
        </div>

        <div className="centered-container">
          <div className="info-box">
            <InfoBox imageSrc={imagen3} description="Vista de montaje en lugar expositivo 2022" />
            <InfoBox imageSrc={imagen5} description="Metaforización sobre la vida" />
            <InfoBox imageSrc={imagen4} description="RELACIÓN VITAL Escultura" />
            <InfoBox imageSrc={imagen6} description="SUSURRO DEL DIOS CRONOS" />
          </div>
        </div>

        <div className="image-section-loguin"></div>
      </div>
      <Footer />
    </div>
  );
};

export default Loguin;
