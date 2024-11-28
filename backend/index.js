const express = require("express");
const cors = require('cors');
const path = require('path');
require('dotenv').config();


const app = express();


const usuariosRouter = require('./Routes/usuarios');
const cursosRouter = require("./Routes/Cursos");
const categoriasNivelesRouter = require("./Routes/categoriasNiveles"); 
const evaluacionesRouter = require("./Routes/Evaluaciones");
const notificacionesRouter = require("./Routes/Notificaciones");
const mensajeriaRouter = require("./Routes/Mensajeria");
const certificarRouter = require("./Routes/Certificarse");
const pagoRouter = require("./Routes/PagarCursos");

const port = process.env.PORT || 3000;

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true,
    })
);

var corsOptions = {
    origin: [
        "http://localhost:3001",
        "https://b8fc-186-80-54-78.ngrok-free.app"
    ],
    optionsSuccessStatus: 200,
    credentials: true
};

app.use(cors(corsOptions));


app.use(express.static(path.join(__dirname, 'public')));


app.get("/", (req, res) => {
    res.json({ message: "OK" });
});


app.use("/api/categoriasniveles", categoriasNivelesRouter); 
app.use("/api/usuarios", usuariosRouter);
app.use("/api/cursos", cursosRouter);
app.use("/api/evaluaciones", evaluacionesRouter);
app.use("/api/notificaciones", notificacionesRouter);
app.use("/api/mensajeria", mensajeriaRouter);
app.use("/api/certificar", certificarRouter);
app.use("/api/pagar", pagoRouter);




app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});
