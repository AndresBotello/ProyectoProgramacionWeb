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
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null); 
  const navigate = useNavigate();


  const validatePassword = (password) => {
    if (!password || password.length < 6) {
      return "La contraseña debe tener al menos 6 caracteres.";
    }
    
    const strongPasswordPattern = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*])[A-Za-z\d!@#$%^&*]{6,}$/;
    if (!strongPasswordPattern.test(password)) {
      return "La contraseña debe contener al menos una letra mayúscula, un número y un carácter especial.";
    }

    return null;
  };

  const functAutenticacion = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMessage(null);
  
    if (registrando) {
      if (!nombre || !email || !password) {
        setError("Por favor, completa todos los campos.");
        setLoading(false);
        return;
      }
  
      const emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
      if (!emailPattern.test(email)) {
        setError("Por favor, ingresa un correo electrónico válido.");
        setLoading(false);
        return;
      }
      
      const passwordError = validatePassword(password);
      if (passwordError) {
        setError(passwordError);
        setLoading(false);
        return;
      }
    }
  
    try {
      const url = registrando
        ? 'https://b8fc-186-80-54-78.ngrok-free.app/api/usuarios'
        : 'https://b8fc-186-80-54-78.ngrok-free.app/api/usuarios/login';
  
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
        localStorage.setItem('id', data.id);
        localStorage.setItem('token', data.token);
        localStorage.setItem('nombre', data.nombre);
        localStorage.setItem('correo', data.correo);
        localStorage.setItem('tipo_usuario_id', data.tipo_usuario_id);
        localStorage.setItem('imagen_perfil', data.imagen_perfil);
        onLogin(data);
  
        navigate(data.tipo_usuario_id === 2 ? '/home' : (data.tipo_usuario_id === 3 ? '/instructor' : '/user-access'));
      }
    } catch (error) {
      setError(error.message || "Correo o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordRecovery = async () => {
    try {
      const response = await fetch('https://b8fc-186-80-54-78.ngrok-free.app/api/usuarios/password-recovery', {
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
    // Validar la nueva contraseña antes de enviar
    const passwordError = validatePassword(newPassword);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    try {
      const response = await fetch('https://b8fc-186-80-54-78.ngrok-free.app/api/usuarios/reset-password', {
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
      const response = await fetch('https://b8fc-186-80-54-78.ngrok-free.app/api/usuarios/verify', {
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
        <a href="/contacto">Contact</a>
      </header>

      <div className="loguin-content">
        <div className="form-box">
          {!isRecovering && !isVerifying && (
            <>
              <h2>{registrando ? "Regíster" : "Sig in"}</h2>
              {error && <p className="error-message">{error}</p>}
              {successMessage && <p className="success-message">{successMessage}</p>}
              <form onSubmit={functAutenticacion}>
                {registrando && (
                  <input 
                    type="text" 
                    placeholder="Name" 
                    className="input-field" 
                    value={nombre} 
                    onChange={(e) => setNombre(e.target.value)} 
                    required 
                  />
                )}
                <input 
                  type="email" 
                  placeholder="Email" 
                  className="input-field" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  required 
                />
                <div className="password-field">
                  <input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="Password" 
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
                    {showPassword ? "Hide" : "Display"}
                  </span>
                </div>
                <button className="btn-submit" disabled={loading}>
                  {loading ? "Loading..." : (registrando ? "Register": "Sig in")}
                </button>
              </form>
              <button className="btn-toggle" onClick={() => setRegistrando(!registrando)}>
                {registrando ? "Do you already have an account? Log in": "Don't have an account? Sign up"}
              </button>
              <button className="btn-toggle" onClick={() => setIsRecovering(true)}>
               Forgot your password?
              </button>
            </>
          )}

          {isRecovering && !isVerifying && (
            <>
              <h2>Recover Password</h2>
              {error && <p className="error-message">{error}</p>}
              {successMessage && <p className="success-message">{successMessage}</p>}
              <input 
                type="email" 
                placeholder="Correo electrónico" 
                className="input-field" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
              <button onClick={handlePasswordRecovery} className="btn-submit">
               Send Recovery Code
              </button>
              <button className="btn-toggle" onClick={() => setIsRecovering(false)}>
               Go back
              </button>
            </>
          )}

          {isVerifying && registrando && (
            <>
              <h2>Verify Email</h2>
              {error && <p className="error-message">{error}</p>}
              {successMessage && <p className="success-message">{successMessage}</p>}
              <input 
                type="text" 
                placeholder="Código de verificación" 
                className="input-field" 
                value={verificationCode} 
                onChange={(e) => setVerificationCode(e.target.value)} 
                required 
              />
              <button onClick={handleVerifyEmail} className="btn-submit">
               Verify Email
              </button>
            </>
          )}

          {isVerifying && isRecovering && (
            <>
              <h2>Verify Code and Reset Password</h2>
              {error && <p className="error-message">{error}</p>}
              {successMessage && <p className="success-message">{successMessage}</p>}
              <input 
                type="text" 
                placeholder="Código de recuperación" 
                className="input-field" 
                value={recoveryCode} 
                onChange={(e) => setRecoveryCode(e.target.value)} 
                required 
              />
              <div className="password-field">
                <input 
                  type={showNewPassword ? 'text' : 'password'} 
                  placeholder="Nueva Contraseña" 
                  className="input-field" 
                  value={newPassword} 
                  onChange={(e) => setNewPassword(e.target.value)} 
                  required 
                />
                <span 
                  className="toggle-password" 
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  style={{ cursor: 'pointer' }}
                >
                  {showNewPassword ? "Ocultar" : "Mostrar"}
                </span>
              </div>
              <p className="password-requirements">
               The password must be at least 6 characters, one uppercase letter, one number, and one special character.
              </p>
              <button onClick={handleVerifyCodeAndResetPassword} className="btn-submit">
               Reset Password
              </button>
              <button className="btn-toggle" onClick={() => { setIsVerifying(false); setIsRecovering(false); }}>
               Go back
              </button>
            </>
          )}
        </div>

        <div className="centered-container">
          <div className="info-box">
            <InfoBox imageSrc={imagen3} description="ASSEMBLY VIEW IN EXHIBITION PLACE 2022" />
            <InfoBox imageSrc={imagen5} description="METAPHORIZATION ABOUT LIFE" />
            <InfoBox imageSrc={imagen4} description="VITAL RELATIONSHIP SCULPTURE" />
            <InfoBox imageSrc={imagen6} description="WHISPER OF THE GOD CRONOS" />
          </div>
        </div>

        <div className="image-section-loguin"></div>
      </div>
      <Footer />
    </div>
  );
};

export default Loguin;