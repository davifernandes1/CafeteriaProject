# ☕ Café & Gestão - Sistema de Ponto de Venda e Gestão

## 📖 Sobre o Projeto

**Café & Gestão** é um sistema web completo, desenhado como uma solução **full stack** para simular e gerir as operações diárias de uma cafetaria moderna. O projeto demonstra o desenvolvimento de uma arquitetura cliente-servidor robusta, intuitiva e funcional.

O sistema permite ao administrador gerir todos os aspetos do negócio, desde o controlo de vendas em tempo real até à gestão de produtos e do stock. O front-end, construído com tecnologias web modernas, comunica-se com um back-end potente desenvolvido em Node.js, que por sua vez interage com um banco de dados SQL Server para garantir a persistência e a integridade dos dados.

---

## ✨ Funcionalidades Principais

O sistema está organizado em módulos para facilitar a gestão do estabelecimento:

* **🔐 Autenticação Segura:**
    * Ecrã de login profissional que valida as credenciais contra a base de dados para garantir que apenas utilizadores autorizados acedam ao painel.
    * Funcionalidade de logout para encerrar a sessão de forma segura.

* **📊 Dashboard Inteligente:**
    * Visão geral do negócio com métricas essenciais atualizadas em tempo real, obtidas através de consultas à API.
    * **Cards de resumo:** Vendas do Dia, Total de Pedidos, Ticket Médio e Mesas Ocupadas.
    * **Gráfico de Vendas:** Um gráfico de linhas que mostra o desempenho das vendas ao longo da semana.
    * **Alerta de Stock Baixo:** Uma lista que destaca os produtos que precisam de ser reabastecidos com urgência.

* **🛒 Ponto de Venda (PDV) Integrado:**
    * Interface otimizada para tirar pedidos de forma rápida e eficiente.
    * **Gestão de Mesas e Venda ao Balcão:** Permite selecionar uma mesa ou optar por uma venda rápida ao balcão. O estado das mesas (livre/ocupada) é guardado e atualizado.
    * **Atualização automática do stock:** Ao finalizar uma venda, o back-end executa uma transação que atualiza o stock dos produtos no banco de dados.

* **📦 Gestão de Produtos (CRUD Completo):**
    * **Adicionar:** Cria novos produtos que são persistidos na base de dados.
    * **Visualizar:** Lê e exibe todos os produtos registados.
    * **Editar:** Altera as informações de qualquer produto existente.
    * **Eliminar:** Remove produtos do catálogo (com confirmação).

* **📋 Gestão de Stock:**
    * Página dedicada para monitorizar e repor a quantidade de cada produto, com as alterações a serem guardadas diretamente na base de dados.

* **📜 Histórico de Vendas:**
    * Registo detalhado de todas as vendas finalizadas, obtido através de uma consulta à API que busca os dados no banco.

---

## 🛠️ Tecnologias Utilizadas

Este projeto foi construído utilizando uma arquitetura full stack moderna.

### **Front-end (Cliente)**
* **HTML5:** Para a estruturação semântica do conteúdo.
* **CSS3:** Para estilização, em conjunto com o framework **Tailwind CSS**.
* **JavaScript (ES6+):** Para toda a lógica da aplicação, interatividade, manipulação do DOM e comunicação com a API (via `fetch`).

#### **Dependências (via CDN)**

| Dependência | Propósito |
| :--- | :--- |
| **Tailwind CSS** | Framework de CSS para design rápido e personalizado. |
| **Font Awesome** | Biblioteca de ícones utilizada em toda a interface. |
| **Chart.js** | Biblioteca para a criação dos gráficos dinâmicos. |


### **Back-end (Servidor)**
* **Node.js:** Ambiente de execução para o JavaScript do lado do servidor.
* **Express.js:** Framework para a construção da API RESTful, gestão de rotas e middleware.
* **`mssql`:** Driver Node.js para a ligação e execução de comandos no SQL Server.
* **`cors`:** Middleware para permitir pedidos de origens diferentes (neste caso, do front-end).

### **Banco de Dados**
* **SQL Server:** Sistema de gestão de banco de dados relacional utilizado para armazenar todos os dados da aplicação, como produtos, vendas e utilizadores.

---
## Autor
Desenvolvido por Davi Fernandes — [@davifernandes1](https://github.com/davifernandes1)