require('dotenv').config();

module.exports={
    app:{
        port:process.env.PORT||3000,
    },
    mysql:{
        host:process.env.DB_HOST,
        user:process.env.DB_USER,
        password:process.env.DB_PASSWORD,
        database:process.env.DB_DATABASE,
        port:process.env.DB_PORT
    },
    secret_key:process.env.SECRET_KEY
}
