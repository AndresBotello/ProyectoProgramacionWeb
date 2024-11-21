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
      <nav className="navbar" aria-label="Main Navigation"> 
        <div className="container"> 
          <Link to="/" aria-label="Homepage"> 
            <img src={logo} alt="Logo" className="logo" /> 
          </Link> 
          <ul className="nav-links"> 
            <li><a href="#courses">Courses</a></li> 
            <li><a href="#about">About Us</a></li> 
            <li><a href="#contact">Contact</a></li> 
          </ul> 
          <Link to="/login"> 
            <button className="btn-primary">Sign In</button> 
          </Link> 
        </div> 
      </nav> 
  
      {/* Main Content */} 
      <main> 
        {/* Hero Section */} 
        <section className="hero-section"> 
          <div className="hero-content"> 
            <h1>Learn and Grow with Us</h1> 
            <p>Connect with a global community of learners and professionals.</p> 
          </div> 
        </section>
  
        {/* Courses Section */} 
        <section id="courses" className="courses-section"> 
          <div className="container"> 
            <h2>Our Courses</h2> 
            <div className="course-list"> 
              {isLoading ? ( 
                <p>Loading courses...</p> 
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
                <p>No courses available.</p> 
              )}
            </div> 
          </div> 
        </section>
  
        {/* About Section */} 
        <section id="about" className="about-section"> 
          <div className="container"> 
            <h2>About Us</h2> 
            <p>We are a learning platform focused on providing the best educational experience for everyone.</p> 
          </div> 
        </section>
  
        {/* Contact Section */} 
        <section id="contact" className="contact-section"> 
          <div className="container"> 
            <h2>Contact Us</h2> 
            <form className="form" aria-label="Contact form"> 
              <input 
                type="text" 
                placeholder="Name" 
                className="input" 
                aria-label="Name" 
              /> 
              <textarea 
                placeholder="Message" 
                className="textarea" 
                aria-label="Message"
              ></textarea> 
              <button type="submit" className="btn-primary">Send Message</button> 
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