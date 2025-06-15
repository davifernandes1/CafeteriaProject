

require('dotenv').config();
const sql = require('mssql');


const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: true, 
        trustServerCertificate: false 
    }
};



async function getConnection() {
    try {
        const pool = await sql.connect(dbConfig);
        return pool;
    } catch (err) {
        console.error('Erro de conexão com o banco de dados:', err);
        throw err;
    }
}

module.exports = {
    getConnection
};
