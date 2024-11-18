import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/proyectolog.jpeg';
import '../Inicio.css';
import Footer from './Footer';

const CourseItem = ({ title, description, onLoginClick }) => {
  return (
    <div className="course-item" onClick={onLoginClick}>
      <h3>{title}</h3>
      <p>{description}</p>
    </div>
  );
};

const Inicio = () => {
  const [cursos, setCursos] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCursos = async () => {
      setIsLoading(true);
      try {
        const response = await fetch('http://localhost:3000/api/cursos/todos');
        if (!response.ok) {
          throw new Error('Error al obtener cursos');
        }
        const data = await response.json();
        setCursos(data.data || []);
      } catch (error) {
        console.error('Error al obtener cursos:', error);
        setError('Error al obtener cursos');
      } finally {
        setIsLoading(false);
      }
    };

    fetchCursos();
  }, []); // Removido token de las dependencias ya que ya no lo necesitamos

  // Función simplificada que solo redirige al login
  const handleLoginRedirect = () => {
    navigate('/login');
  };

  return (
    <div className="app">
      {/* Navbar */}
      <nav className="navbar" aria-label="Main navigation">
        <div className="container">
          <Link to="/" aria-label="Homepage">
            <img src={logo} alt="Logo" className="logo" />
          </Link>
          <ul className="nav-links">
            <li><a href="#courses">Cursos</a></li>
            <li><a href="#about">Nosotros</a></li>
            <li><a href="#contact">Contacto</a></li>
          </ul>
          <Link to="/login">
            <button className="btn-primary">Iniciar Sesión</button>
          </Link>
        </div>
      </nav>

      {/* Main Content */}
      <main>
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-content">
            <h1>Aprende y Crece con Nosotros</h1>
            <p>Conecta con una comunidad global de aprendices y profesionales.</p>
          </div>
        </section>

        {/* Courses Section */}
        <section id="courses" className="courses-section">
          <div className="container">
            <h2>Nuestros Cursos</h2>
            <div className="course-list">
              {isLoading ? (
                <p>Cargando cursos...</p>
              ) : error ? (
                <p>{error}</p>
              ) : cursos.length > 0 ? (
                cursos.map(curso => (
                  <CourseItem 
                    key={curso.id} 
                    title={curso.titulo} 
                    description={curso.descripcion}
                    onLoginClick={handleLoginRedirect}
                  />
                ))
              ) : (
                <p>No hay cursos disponibles.</p>
              )}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="about-section">
          <div className="container">
            <h2>Sobre Nosotros</h2>
            <p>Somos una plataforma de aprendizaje enfocada en brindar la mejor experiencia educativa para todos.</p>
          </div>
        </section>

        {/* Contact Section */}
        <section id="contact" className="contact-section">
          <div className="container">
            <h2>Contáctanos</h2>
            <form className="form" aria-label="Contact form">
              <input type="text" placeholder="Nombre" className="input" aria-label="Nombre" />
              <textarea placeholder="Mensaje" className="textarea" aria-label="Mensaje"></textarea>
              <button type="submit" className="btn-primary">Enviar Mensaje</button>
            </form>
          </div>
        </section>
      </main>

      {/* Footer */}
      <Footer />
    </div>
  );
};

export default Inicio;