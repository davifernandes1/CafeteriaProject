// db.js
// Versão final usando Autenticação do SQL Server, que é mais estável.

require('dotenv').config();
const sql = require('mssql');

// A configuração agora usa diretamente as credenciais do arquivo .env
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options: {
        encrypt: false, // Use true para Azure SQL
        trustServerCertificate: true // Necessário para conexões locais (localhost)
    }
};

// A lógica de "trustedConnection" foi removida, pois não é mais necessária.

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
