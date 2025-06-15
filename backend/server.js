const express = require('express');
const cors = require('cors');
const routes = require('./routes'); 


const app = express();
const port = 3000; 

app.use(cors()); 
app.use(express.json());
app.use('/api', routes);


app.listen(port, () => {
    console.log(`🚀 Servidor do Café & Gestão rodando em http://localhost:${port}`);
});
