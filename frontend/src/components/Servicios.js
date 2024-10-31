import React from 'react';
import CV from '../assets/PortafolioLorenaGulloMercado.pdf'; // Importa el archivo PDF
import '../Portafolio.css'; // Asegúrate de tener el archivo CSS correspondiente

const PortfolioPage = () => {
  return (
    <div className="portfolio-container">
      <header className="portfolio-header">
        <h1>Portafolio de Lorena Gullo Mercado</h1>
      </header>
      <main className="portfolio-main">
        <section className="portfolio-section">
          <h2>Portafolio de Trabajos</h2>
          <div className="portfolio-grid">
            {/* Aquí agregarás los proyectos */}
            <div className="portfolio-item">
              <img src="url-del-proyecto.jpg" alt="Descripción del proyecto" className="portfolio-image" />
              <div className="portfolio-description">
                <h3>Nombre del Proyecto</h3>
                <p>Descripción breve del proyecto.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="cv-section">
          <h2>Currículum Vitae</h2>
          <div className="cv-content">
            <p>
              Lorena Gullo Mercado es una artista plástica cuyas obras exploran la relación entre el arte y la naturaleza, utilizando 
              materiales orgánicos y artificiales para crear piezas que reflexionan sobre el tiempo, la vida y la memoria.
            </p>
            {/* Usa la ruta importada aquí */}
            <a href={CV} download className="cv-download-link">Descargar CV</a>
          </div>
        </section>
      </main>
    </div>
  );
};

export default PortfolioPage;