import React, { useState } from 'react';
import '../Portafolio.css';

const PortfolioPage = () => {
  // Estado para los proyectos (inicialmente vacío)
  const [projects, setProjects] = useState([]);

  // Estado para los nuevos proyectos
  const [newProject, setNewProject] = useState({
    title: '',
    description: '',
    image: null,
    id: null,
  });

  // Manejo de cambios en los campos de texto
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProject({
      ...newProject,
      [name]: value,
    });
  };

  // Manejo de la carga de imágenes
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file && file.type.startsWith('image/')) {
      setNewProject({
        ...newProject,
        image: URL.createObjectURL(file),
      });
    } else {
      alert('Por favor, selecciona una imagen.');
    }
  };

  // Manejo de la adición o actualización de proyectos
  const handleAddProject = () => {
    if (newProject.id) {
      setProjects(projects.map(project =>
        project.id === newProject.id ? newProject : project
      ));
    } else {
      setProjects([
        ...projects,
        {
          ...newProject,
          id: projects.length + 1,
        },
      ]);
    }
    setNewProject({ title: '', description: '', image: null, id: null });
  };

  // Manejo de la edición de un proyecto
  const handleEditProject = (id) => {
    const projectToEdit = projects.find(p => p.id === id);
    setNewProject({
      title: projectToEdit.title,
      description: projectToEdit.description,
      image: projectToEdit.image,
      id,
    });
  };

  // Manejo de la eliminación de un proyecto
  const handleDeleteProject = (id) => {
    setProjects(projects.filter(project => project.id !== id));
  };

  return (
    <div className="portfolio-container">
      <header className="portfolio-header">
        <h1>Portafolio de Lorena Gullo Mercado</h1>
      </header>
      <main className="portfolio-main">
        <section className="portfolio-section">
          <h2>Portafolio de Trabajos</h2>
          <div className="portfolio-grid">
            {projects.length === 0 ? (
              <p>No hay proyectos para mostrar. Agrega uno nuevo.</p>
            ) : (
              projects.map((project) => (
                <div key={project.id} className="portfolio-item">
                  <img src={project.image} alt={project.title} className="portfolio-image" />
                  <div className="portfolio-description">
                    <h3>{project.title}</h3>
                    <p>{project.description}</p>
                    <button onClick={() => handleEditProject(project.id)} className="edit-button">Editar</button>
                    <button onClick={() => handleDeleteProject(project.id)} className="delete-button">Eliminar</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="add-project-section">
          <h2>{newProject.id ? 'Editar proyecto' : 'Agregar nuevo proyecto'}</h2>
          <input
            type="text"
            name="title"
            value={newProject.title}
            onChange={handleInputChange}
            placeholder="Nombre del proyecto"
            className="input-field"
          />
          <textarea
            name="description"
            value={newProject.description}
            onChange={handleInputChange}
            placeholder="Descripción del proyecto"
            className="input-field"
          />
          <input
            type="file"
            name="image"
            onChange={handleImageChange}
            accept="image/*"
            className="file-input"
          />
          {newProject.image && <img src={newProject.image} alt="Vista previa" className="preview-image" />}
          <button onClick={handleAddProject} className="submit-button">
            {newProject.id ? 'Actualizar Proyecto' : 'Agregar Proyecto'}
          </button>
        </section>
      </main>
    </div>
  );
};

export default PortfolioPage;
