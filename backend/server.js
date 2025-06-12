// server.js
// Este é o arquivo principal que inicia o servidor da API.

const express = require('express');
const cors = require('cors');
const routes = require('./routes'); // Importa as rotas que definimos

// Cria a aplicação Express
const app = express();
const port = 3000; // Define a porta em que o back-end irá rodar

// --- Middlewares ---
// O 'cors' permite que o seu front-end (rodando em outra porta) acesse esta API.
app.use(cors()); 

// O 'express.json' permite que o servidor entenda requisições com corpo no formato JSON.
// Essencial para receber dados do front-end nos métodos POST e PUT.
app.use(express.json());

// --- Rotas da API ---
// Define que todas as rotas importadas de 'routes.js' começarão com o prefixo '/api'
// Ex: http://localhost:3000/api/produtos
app.use('/api', routes);

// --- Iniciar o Servidor ---
// A aplicação começa a "ouvir" por requisições na porta definida.
app.listen(port, () => {
    console.log(`🚀 Servidor do Café & Gestão rodando em http://localhost:${port}`);
});
