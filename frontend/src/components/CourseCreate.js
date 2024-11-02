import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../CourseCreate.css';

const CourseCreate = () => {
  const [curso, setCurso] = useState({
    titulo: '',
    descripcion: '',
    contenido: '',
    categoria_id: '', 
    nivel_id: '', 
    instructor_id: '', 
    precio: '',
    visible: true,
    idioma: 'ES'
  });

  const [categorias, setCategorias] = useState([]);
  const [niveles, setNiveles] = useState([]);
  const [instructores, setInstructores] = useState([]);
  const [lecciones, setLecciones] = useState([{ titulo: '', contenido: '', video_url: '', orden: 1 }]);

  const navigate = useNavigate();
  const token = localStorage.getItem('token');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categoriaRes = await fetch('http://localhost:3000/api/categoriasniveles/categorias', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const categoriaData = await categoriaRes.json();
        setCategorias(categoriaData.data.data || []);

        const nivelRes = await fetch('http://localhost:3000/api/categoriasniveles/niveles', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const nivelData = await nivelRes.json();
        setNiveles(nivelData.data.data || []);

        const instructorRes = await fetch('http://localhost:3000/api/usuarios/instructores', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        const instructorData = await instructorRes.json();
        setInstructores(instructorData.data.data || []);

      } catch (error) {
        console.error('Error al cargar los datos:', error.message);
      }
    };

    fetchData();
  }, [token]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurso({ ...curso, [name]: value });
  };

  const handleLeccionChange = (index, e) => {
    const { name, value } = e.target;
    const nuevasLecciones = [...lecciones];
    nuevasLecciones[index][name] = value;
    setLecciones(nuevasLecciones);
  };

  const addLeccion = () => {
    setLecciones([...lecciones, { titulo: '', contenido: '', video_url: '', orden: lecciones.length + 1 }]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:3000/api/cursos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(curso)
      });

      if (!response.ok) {
        throw new Error('Error al crear el curso');
      }

      const data = await response.json();
      const cursoId = data.data.cursoId;

      await Promise.all(
        lecciones.map(async (leccion) => {
          await fetch('http://localhost:3000/api/cursos/lecciones', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ ...leccion, curso_id: cursoId })
          });
        })
      );

      navigate(`/cursos/${cursoId}`);
    } catch (error) {
      console.error('Error al crear el curso:', error.message);
    }
  };

  return (
    <div className="course-create-container">
      <h1>Crear Nuevo Curso</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Título del Curso</label>
          <input type="text" name="titulo" value={curso.titulo} onChange={handleChange} required />
        </div>
        <div>
          <label>Descripción</label>
          <textarea name="descripcion" value={curso.descripcion} onChange={handleChange} required />
        </div>
        <div>
          <label>Contenido Extendido</label>
          <textarea name="contenido" value={curso.contenido} onChange={handleChange} required />
        </div>
        <div>
          <label>Categoría</label>
          <select name="categoria_id" value={curso.categoria_id} onChange={handleChange} required>
            <option value="">Seleccionar categoría</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Nivel</label>
          <select name="nivel_id" value={curso.nivel_id} onChange={handleChange} required>
            <option value="">Seleccionar nivel</option>
            {niveles.map((nivel) => (
              <option key={nivel.id} value={nivel.id}>{nivel.nivel}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Instructor</label>
          <select name="instructor_id" value={curso.instructor_id} onChange={handleChange} required>
            <option value="">Seleccionar instructor</option>
            {instructores.map((instructor) => (
              <option key={instructor.id} value={instructor.id}>{instructor.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Precio</label>
          <input type="number" name="precio" value={curso.precio} onChange={handleChange} required />
        </div>

        <h2>Lecciones</h2>
        {lecciones.map((leccion, index) => (
          <div className="leccion-container" key={index}>
            <label>Título de la Lección</label>
            <input
              type="text"
              name="titulo"
              value={leccion.titulo}
              onChange={(e) => handleLeccionChange(index, e)}
              required
            />
            <label>Contenido de la Lección</label>
            <textarea
              name="contenido"
              value={leccion.contenido}
              onChange={(e) => handleLeccionChange(index, e)}
              required
            />
            <label>URL del Video (opcional)</label>
            <input
              type="text"
              name="video_url"
              value={leccion.video_url}
              onChange={(e) => handleLeccionChange(index, e)}
            />
          </div>
        ))}
        <button type="button" onClick={addLeccion}>Agregar otra lección</button>
        <button type="submit">Crear Curso</button>
      </form>
    </div>
  );
};

export default CourseCreate;
