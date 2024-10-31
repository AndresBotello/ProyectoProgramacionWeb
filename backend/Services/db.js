const mysql=require('mysql2/promise');
const config=require('../config');
const dbconfig={
    host: config.mysql.host,
    user: config.mysql.user,
    password: config.mysql.password,
    database: config.mysql.database,
    port: config.mysql.port,

};

let pool;
async function initconecting(){
    try {
        pool=mysql.createPool(dbconfig);
        console.log('Base de datos conectada');
    } catch (error) {
        console.log('Error en la base de datos', error);
        setTimeout(initconecting, 2000);
    }

}
initconecting();

async function query(sql,params){
    const [rows]=await pool.execute(sql,params);
    return rows;
}

module.exports={
    query,
    pool
};