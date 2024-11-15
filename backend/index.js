const express = require("express");
const cors = require('cors');
require('dotenv').config();


const app = express();


const usuariosRouter = require('./Routes/usuarios');
const cursosRouter = require("./Routes/Cursos");
const categoriasNivelesRouter = require("./Routes/categoriasNiveles"); 
const evaluacionesRouter = require("./Routes/Evaluaciones");
const port = process.env.PORT || 3000;

app.use(express.json());

app.use(
    express.urlencoded({
        extended: true,
    })
);

var corsOptions = {
    origin: [
        "http://localhost:3001"
    ],
    optionsSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.get("/", (req, res) => {
    res.json({ message: "OK" });
});


app.use("/api/categoriasniveles", categoriasNivelesRouter); 
app.use("/api/usuarios", usuariosRouter);
app.use("/api/cursos", cursosRouter);
app.use("/api/evaluaciones", evaluacionesRouter);

app.listen(port, () => {
    console.log(`App listening at http://localhost:${port}`);
});
