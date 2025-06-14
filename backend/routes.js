const express = require('express');
const router = express.Router();
const sql = require('mssql');
const { getConnection } = require('./db');

// ROTA DE LOGIN
router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('nome_usuario', sql.VarChar, username)
            .query('SELECT * FROM Usuarios WHERE nome_usuario = @nome_usuario');
        if (result.recordset.length === 0) {
            return res.status(404).json({ message: 'Usuário não encontrado.' });
        }
        const user = result.recordset[0];
        if (password !== user.senha_hash) {
            return res.status(401).json({ message: 'Senha incorreta.' });
        }
        res.status(200).json({
            id_usuario: user.id_usuario,
            nome_usuario: user.nome_usuario,
            cargo: user.cargo
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ROTAS DE USUÁRIOS
router.get('/usuarios', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query('SELECT id_usuario, nome_usuario, cargo FROM Usuarios');
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ROTAS DE PRODUTOS
router.get('/produtos', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query("SELECT * FROM Produtos WHERE ativo = 1 ORDER BY nome_produto");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/produtos', async (req, res) => {
    const { nome_produto, preco, quantidade_estoque, imagem_url } = req.body;
    try {
        const pool = await getConnection();
        await pool.request()
            .input('nome_produto', sql.VarChar, nome_produto)
            .input('preco', sql.Decimal(10, 2), preco)
            .input('quantidade_estoque', sql.Int, quantidade_estoque)
            .input('imagem_url', sql.VarChar, imagem_url)
            .execute('sp_InserirProduto');
        res.status(201).json({ message: 'Produto criado com sucesso!' });
    } catch (err) {
        if (err.message.includes('UQ_Produtos_NomeProduto')) {
            return res.status(409).json({ message: 'Erro: Já existe um produto com este nome.' });
        }
        res.status(500).json({ message: err.message });
    }
});

router.put('/produtos/:id', async (req, res) => {
    const { nome_produto, preco, quantidade_estoque, imagem_url } = req.body;
    try {
        const pool = await getConnection();
        await pool.request()
            .input('id_produto', sql.Int, req.params.id)
            .input('nome_produto', sql.VarChar, nome_produto)
            .input('preco', sql.Decimal(10, 2), preco)
            .input('quantidade_estoque', sql.Int, quantidade_estoque)
            .input('imagem_url', sql.VarChar, imagem_url)
            .execute('sp_AlterarProduto');
        res.status(200).json({ message: 'Produto alterado com sucesso!' });
    } catch (err) {
        if (err.message.includes('UQ_Produtos_NomeProduto')) {
            return res.status(409).json({ message: 'Erro: Já existe um produto com este nome.' });
        }
        res.status(500).json({ message: err.message });
    }
});

router.delete('/produtos/:id', async (req, res) => {
    try {
        const pool = await getConnection();
        await pool.request()
            .input('id_produto', sql.Int, req.params.id)
            .execute('sp_DesativarProduto');
        res.status(200).json({ message: 'Produto desativado com sucesso!' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

// ROTAS DE VENDAS
router.get('/vendas', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request().query("SELECT v.id_venda, v.data_venda, v.valor_total, v.origem, u.nome_usuario FROM Vendas v JOIN Usuarios u ON v.id_usuario = u.id_usuario ORDER BY v.data_venda DESC");
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.get('/vendas/:id', async (req, res) => {
    try {
        const pool = await getConnection();
        const result = await pool.request()
            .input('id_venda', sql.Int, req.params.id)
            .query(`SELECT p.nome_produto, iv.quantidade, iv.valor_unitario FROM ItensVenda iv JOIN Produtos p ON iv.id_produto = p.id_produto WHERE iv.id_venda = @id_venda`);
        res.json(result.recordset);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

router.post('/vendas', async (req, res) => {
    const { id_usuario, origem, itens } = req.body;
    try {
        const pool = await getConnection();
        await pool.request()
            .input('id_usuario', sql.Int, id_usuario)
            .input('origem', sql.VarChar, origem)
            .input('itens_json', sql.NVarChar, JSON.stringify(itens))
            .execute('sp_CriarVenda');
        res.status(201).json({ message: 'Venda finalizada com sucesso!' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;
