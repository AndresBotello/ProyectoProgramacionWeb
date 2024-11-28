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
  const [lecciones, setLecciones] = useState([{ 
    titulo: '', 
    contenido: '', 
    orden: 1,
    imagen: null,
    video: null,
    imagen_url: '',
    video_url: ''
  }]);

  const [isUploading, setIsUploading] = useState(false);
  const [mensajeExito, setMensajeExito] = useState('');

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
        console.error('Error al cargar los datos:', error);
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

  const handleFileChange = (index, e, fileType) => {
    const file = e.target.files[0];
    if (!file) return;

    const nuevasLecciones = [...lecciones];
    nuevasLecciones[index][fileType] = file;
    setLecciones(nuevasLecciones);
  };

  const addLeccion = () => {
    if (lecciones.length < 10) {
      setLecciones([
        ...lecciones,
        {
          titulo: '',
          contenido: '',
          orden: lecciones.length + 1,
          imagen: null,
          video: null,
          imagen_url: '',
          video_url: ''
        }
      ]);
    } else {
      alert('Solo puedes agregar hasta 10 lecciones');
    }
  };

  const deleteLeccion = (index) => {
    const nuevasLecciones = lecciones.filter((_, i) => i !== index);
    // Reordenar las lecciones restantes
    nuevasLecciones.forEach((leccion, i) => {
      leccion.orden = i + 1;
    });
    setLecciones(nuevasLecciones);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsUploading(true);

    try {
      // 1. Crear el curso primero
      const cursoResponse = await fetch('http://localhost:3000/api/cursos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(curso)
      });

      if (!cursoResponse.ok) throw new Error('Error al crear el curso');
      
      const cursoData = await cursoResponse.json();
      const cursoId = cursoData.data.cursoId;

      // 2. Crear cada lección con sus archivos
      for (let i = 0; i < lecciones.length; i++) {
        const leccion = lecciones[i];
        const formData = new FormData();
        
        formData.append('titulo', leccion.titulo);
        formData.append('contenido', leccion.contenido);
        formData.append('curso_id', cursoId);
        formData.append('orden', leccion.orden);

        if (leccion.imagen) {
          formData.append('imagen', leccion.imagen);
        }
        if (leccion.video) {
          formData.append('video', leccion.video);
        }

        const leccionResponse = await fetch('http://localhost:3000/api/cursos/lecciones', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });

        if (!leccionResponse.ok) {
          throw new Error(`Error al crear la lección ${i + 1}`);
        }
      }

      setMensajeExito('Curso y lecciones creados correctamente');
      setTimeout(() => {
        navigate('/home');
      }, 2000);

    } catch (error) {
      console.error('Error:', error);
      setMensajeExito('Error al crear el curso y las lecciones');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="course-create-container">
      <h1>Create New Course</h1>
      <form onSubmit={handleSubmit}>
        <div>
          <label>Course Title</label>
          <input type="text" name="titulo" value={curso.titulo} onChange={handleChange} required />
        </div>
        <div>
          <label>Description</label>
          <textarea name="descripcion" value={curso.descripcion} onChange={handleChange} required />
        </div>
        <div>
          <label>Extended Content</label>
          <textarea name="contenido" value={curso.contenido} onChange={handleChange} required />
        </div>
        <div>
          <label>Category</label>
          <select name="categoria_id" value={curso.categoria_id} onChange={handleChange} required>
            <option value="">Select a category</option>
            {categorias.map((categoria) => (
              <option key={categoria.id} value={categoria.id}>{categoria.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Level</label>
          <select name="nivel_id" value={curso.nivel_id} onChange={handleChange} required>
            <option value="">Select a level</option>
            {niveles.map((nivel) => (
              <option key={nivel.id} value={nivel.id}>{nivel.nivel}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Instructor</label>
          <select name="instructor_id" value={curso.instructor_id} onChange={handleChange} required>
            <option value="">Select an instructor</option>
            {instructores.map((instructor) => (
              <option key={instructor.id} value={instructor.id}>{instructor.nombre}</option>
            ))}
          </select>
        </div>
        <div>
          <label>Price</label>
          <input type="number" name="precio" value={curso.precio} onChange={handleChange} required />
        </div>
        <div>
          <label>Visible</label>
          <input 
            type="checkbox" 
            name="visible" 
            checked={curso.visible} 
            onChange={(e) => setCurso({ ...curso, visible: e.target.checked })} 
          />
        </div>
        <div>
          <label>Language</label>
          <select name="idioma" value={curso.idioma} onChange={handleChange}>
            <option value="ES">Spanish</option>
            <option value="EN">English</option>
          </select>
        </div>
  
        <div>
          <h3>Lessons</h3>
          {lecciones.map((leccion, index) => (
            <div key={index} className="leccion-container">
              <div className="leccion-header">
                <h4>Lesson {index + 1}</h4>
                <button 
                  type="button"
                  onClick={() => deleteLeccion(index)}
                  className="delete-button"
                >
                  Delete
                </button>
              </div>
              <div>
                <label>Title</label>
                <input 
                  type="text" 
                  name="titulo" 
                  value={leccion.titulo} 
                  onChange={(e) => handleLeccionChange(index, e)} 
                  required 
                />
              </div>
              <div>
                <label>Content</label>
                <textarea 
                  name="contenido" 
                  value={leccion.contenido} 
                  onChange={(e) => handleLeccionChange(index, e)} 
                  required 
                />
              </div>
              <div>
                <label>Video</label>
                <input 
                  type="file" 
                  accept="video/*" 
                  onChange={(e) => handleFileChange(index, e, 'video')} 
                />
              </div>
              <div>
                <label>Image</label>
                <input 
                  type="file" 
                  accept="image/*" 
                  onChange={(e) => handleFileChange(index, e, 'imagen')} 
                />
              </div>
            </div>
          ))}
          <button type="button" onClick={addLeccion} className="add-button">
            Add Lesson
          </button>
        </div>
  
        <div className="submit-container">
          <button type="submit" disabled={isUploading} className="submit-button">
            {isUploading ? 'Creating course...' : 'Create Course'}
          </button>
        </div>
      </form>
  
      {mensajeExito && (
        <div className={mensajeExito.includes('Error') ? 'error-message' : 'success-message'}>
          {mensajeExito}
        </div>
      )}
    </div>
  );
  
};
export default CourseCreate;