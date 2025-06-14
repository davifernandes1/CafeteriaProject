document.addEventListener('DOMContentLoaded', () => {

    // 1. CONFIGURAÇÃO E VARIÁVEIS GLOBAIS
    const API_URL = 'http://localhost:3000/api';

    // Elementos da DOM
    const loginPage = document.getElementById('login-page');
    const appContainer = document.getElementById('app-container');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');
    const productModal = document.getElementById('product-modal');
    const deleteModal = document.getElementById('delete-modal');
    const viewProductModal = document.getElementById('view-product-modal');
    const productSearchInput = document.getElementById('product-search');

    // Variáveis de estado
    let products = [];
    let sales = [];
    let tables = Array.from({ length: 6 }, (_, i) => ({ id: i + 1, status: 'free', order: [] }));
    let posCart = [];
    let currentTableId = null;
    let currentUser = null;
    let salesChart, stockChart;

    // 2. FUNÇÃO HELPER PARA API
    async function fetchApi(endpoint, options = {}) {
        try {
            const response = await fetch(`${API_URL}${endpoint}`, options);
            const isJson = response.headers.get('content-type')?.includes('application/json');
            const data = isJson ? await response.json() : await response.text();
            if (!response.ok) {
                const errorMessage = (isJson ? data.message : data) || `Erro na requisição para ${endpoint}`;
                const cleanError = errorMessage.includes('Regra de negócio violada:') ? errorMessage.split('Regra de negócio violada:')[1].trim() : errorMessage;
                throw new Error(cleanError);
            }
            return data;
        } catch (error) {
            showToast(error.message, 'error');
            throw error;
        }
    }

    // 3. AUTENTICAÇÃO E NAVEGAÇÃO
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
        try {
            const data = await fetchApi('/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password })
            });
            currentUser = data;
            loginPage.classList.add('hidden');
            appContainer.classList.remove('hidden');
            window.location.hash = '#dashboard';
            await handleNavigation();
        } catch (error) {
            document.getElementById('login-error').textContent = error.message;
            document.getElementById('login-error').classList.remove('hidden');
        }
    });
    
    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        currentUser = null;
        appContainer.classList.add('hidden');
        loginPage.classList.remove('hidden');
        loginForm.reset();
        window.location.hash = '';
    });
    
    async function handleNavigation() {
        const hash = window.location.hash || '#dashboard';
        document.querySelectorAll('main').forEach(p => p.classList.add('hidden'));
        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
        const activePage = document.querySelector(`${hash}-page`);
        const activeLink = document.querySelector(`a[href="${hash}"]`);
        if (activePage) activePage.classList.remove('hidden');
        if (activeLink) activeLink.classList.add('active');
        const pageRenderer = pageRenderers[hash];
        if (pageRenderer) await pageRenderer();
    }
    window.addEventListener('hashchange', handleNavigation);

    // 4. MAPEAMENTO DE PÁGINAS E FUNÇÕES DE RENDERIZAÇÃO
    const pageRenderers = {
        '#dashboard': async () => { 
            const [s, p] = await Promise.all([fetchApi('/vendas'), fetchApi('/produtos')]);
            sales = s;
            products = p;
            renderDashboard();
        },
        '#pdv': async () => { 
            if (products.length === 0) products = await fetchApi('/produtos');
            renderPdv(); 
        },
        '#vendas': async () => { sales = await fetchApi('/vendas'); renderSalesLog(); },
        '#produtos': async () => { products = await fetchApi('/produtos'); renderProductTable(); },
    };
    
    // --- Funções que desenham a UI ---
    function renderDashboard() {
        const today = new Date().toDateString();
        const todaySales = sales.filter(s => new Date(s.data_venda).toDateString() === today);
        const totalSalesValue = todaySales.reduce((sum, s) => sum + Number(s.valor_total), 0);
        document.getElementById('daily-sales-value').textContent = `R$ ${totalSalesValue.toFixed(2).replace('.', ',')}`;
        document.getElementById('daily-orders-count').textContent = todaySales.length;
        document.getElementById('average-ticket').textContent = `R$ ${(todaySales.length > 0 ? totalSalesValue / todaySales.length : 0).toFixed(2).replace('.', ',')}`;
        document.getElementById('occupied-tables-count').textContent = tables.filter(t => t.status === 'occupied').length;
        renderLowStockList();
        renderCharts();
    }

    function renderLowStockList() {
        const lowStockList = document.getElementById('low-Estoque-list');
        if (!lowStockList) return;
        lowStockList.innerHTML = '';
        const lowStockProducts = products.filter(p => p.quantidade_estoque <= 10);
        if (lowStockProducts.length === 0) {
            lowStockList.innerHTML = `<p class="text-sm text-gray-500">Nenhum item com estoque baixo.</p>`;
        } else {
            lowStockProducts.forEach(p => {
                lowStockList.innerHTML += `<li class="flex justify-between items-center text-sm py-1"><span class="font-semibold">${p.nome_produto}</span><span class="font-bold text-red-500">${p.quantidade_estoque} un.</span></li>`;
            });
        }
    }

    function renderCharts() {
        const salesCtx = document.getElementById('salesChart')?.getContext('2d');
        if (salesCtx) {
            if (salesChart) salesChart.destroy();
            salesChart = new Chart(salesCtx, {
                type: 'line',
                data: { labels: ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'], datasets: [{ label: 'Vendas (R$)', data: sales.reduce((acc, sale) => { acc[new Date(sale.data_venda).getDay()] += Number(sale.valor_total); return acc; }, new Array(7).fill(0)), backgroundColor: 'rgba(161, 98, 7, 0.2)', borderColor: '#A16207', borderWidth: 3, tension: 0.3, fill: true }] },
                options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } }
            });
        }
        const stockContainer = document.getElementById('stock-chart-container');
        if (stockContainer) {
            let chartCanvas = document.getElementById('stockChart');
            if(!chartCanvas) {
                stockContainer.innerHTML = '<h3 class="text-xl font-bold mt-6">Top 5 Produtos em Estoque</h3><div class="chart-container mt-4"><canvas id="stockChart"></canvas></div>';
                chartCanvas = document.getElementById('stockChart');
            }
            const stockCtx = chartCanvas.getContext('2d');
            if (stockCtx) {
                const sortedProducts = [...products].sort((a, b) => b.quantidade_estoque - a.quantidade_estoque).slice(0, 5);
                if (stockChart) stockChart.destroy();
                stockChart = new Chart(stockCtx, {
                    type: 'doughnut',
                    data: {
                        labels: sortedProducts.map(p => p.nome_produto),
                        datasets: [{ label: 'Estoque', data: sortedProducts.map(p => p.quantidade_estoque), backgroundColor: ['#A16207', '#3A2E2A', '#E7E5E4', '#854D0E', '#57534E'], hoverOffset: 4 }]
                    },
                    options: { responsive: true, maintainAspectRatio: false, plugins: { legend: { position: 'top' } } }
                });
            }
        }
    }
    
    function renderPdv() { 
        renderTablesGridForPdv();
        renderPosProducts();
        renderCart();
    }

    function renderSalesLog() {
        const reportBody = document.getElementById('sales-report-table-body');
        reportBody.innerHTML = '';
        if (sales.length === 0) {
            reportBody.innerHTML = `<tr><td colspan="5" class="text-center p-5 text-gray-500">Nenhuma venda registrada.</td></tr>`;
            return;
        }
        sales.forEach(s => {
            reportBody.innerHTML += `<tr><td class="p-3 font-bold">#${s.id_venda}</td><td class="p-3">${s.origem}</td><td class="p-3">${new Date(s.data_venda).toLocaleString('pt-BR')}</td><td class="p-3">R$ ${Number(s.valor_total).toFixed(2).replace('.', ',')}</td><td class="p-3 text-xs">Vendido por: ${s.nome_usuario}</td></tr>`;
        });
    }

    function renderProductTable() {
        const productTableBody = document.getElementById('product-table-body');
        productTableBody.innerHTML = '';
        if (!products || products.length === 0) {
            productTableBody.innerHTML = `<tr><td colspan="6" class="text-center p-5 text-gray-500">Nenhum produto cadastrado.</td></tr>`;
            return;
        }
        products.forEach(p => {
            const estoqueStatus = p.quantidade_estoque > 10 ? 'ok' : (p.quantidade_estoque > 0 ? 'low' : 'empty');
            const statusInfo = { ok: { text: 'OK', color: 'bg-green-100 text-green-800' }, low: { text: 'Baixo', color: 'bg-yellow-100 text-yellow-800' }, empty: { text: 'Esgotado', color: 'bg-red-100 text-red-800' } };
            const isAdmin = currentUser && currentUser.cargo === 'Administrador';
            const adminButtons = `<button data-action="edit" data-id="${p.id_produto}" class="text-gray-500 hover:text-purple-600 p-2" title="Editar"><i class="fas fa-pencil-alt"></i></button> <button data-action="delete" data-id="${p.id_produto}" class="text-gray-500 hover:text-red-600 p-2" title="Desativar"><i class="fas fa-trash-alt"></i></button>`;
            
            productTableBody.innerHTML += `<tr><td class="p-3"><img src="${p.imagem_url}" onerror="this.src='https://placehold.co/48x48/EEE/31343C?text=Sem+Img'" alt="${p.nome_produto}" class="w-12 h-12 object-cover rounded-md"></td><td class="p-3 font-bold">${p.nome_produto}</td><td class="p-3">R$ ${Number(p.preco).toFixed(2).replace('.', ',')}</td><td class="p-3">${p.quantidade_estoque} un.</td><td class="p-3"><span class="px-2 py-1 text-xs font-semibold rounded-full ${statusInfo[estoqueStatus].color}">${statusInfo[estoqueStatus].text}</span></td><td class="p-3 text-center whitespace-nowrap"><button data-action="view" data-id="${p.id_produto}" class="text-gray-500 hover:text-blue-600 p-2" title="Visualizar"><i class="fas fa-eye"></i></button>${isAdmin ? adminButtons : ''}</td></tr>`;
        });
    }

    function renderPosProducts(filteredProducts = products) {
        const productListEl = document.getElementById('pos-product-list');
        productListEl.innerHTML = '';
        if (filteredProducts.length === 0) {
            productListEl.innerHTML = `<p class="col-span-full text-center text-gray-500">Nenhum produto encontrado.</p>`;
            return;
        }
        filteredProducts.forEach(p => {
            const card = document.createElement('div');
            card.className = `card flex flex-col items-center p-2 rounded-lg shadow-sm cursor-pointer transition-transform transform hover:scale-105 ${p.quantidade_estoque > 0 ? 'bg-white' : 'bg-gray-200 opacity-50'}`;
            card.innerHTML = `<img src="${p.imagem_url}" onerror="this.src='https://placehold.co/100x96/EEE/31343C?text=Sem+Img'" class="w-full h-24 object-cover rounded-md mb-2"><div class="text-center"><h6 class="text-sm font-bold truncate">${p.nome_produto}</h6><p class="text-xs text-gray-500">R$ ${Number(p.preco).toFixed(2)}</p></div>`;
            if (p.quantidade_estoque > 0) card.onclick = () => addToCart(p.id_produto);
            productListEl.appendChild(card);
        });
    }

    function renderTablesGridForPdv() {
        const tablesGrid = document.getElementById('tables-grid');
        tablesGrid.innerHTML = '';
        const pedidoIdentificador = document.getElementById('pedido-atual-identificador');
        const counterCard = document.createElement('div');
        const isBalcaoActive = currentTableId === 'balcao';
        counterCard.className = `p-2 rounded-lg font-semibold text-center cursor-pointer transition-all duration-200 border-2 ${isBalcaoActive ? 'bg-[#A16207] text-white border-transparent' : 'bg-gray-100 hover:bg-gray-200 border-gray-200'}`;
        counterCard.innerHTML = `<i class="fas fa-store mr-2"></i><span>Balcão</span>`;
        counterCard.onclick = () => selectPdvTable('balcao');
        tablesGrid.appendChild(counterCard);
        tables.forEach(table => {
            const tableCard = document.createElement('div');
            const isActive = table.id === currentTableId;
            let stateClass = '';
            if (isActive) {
                stateClass = 'bg-[#A16207] text-white border-transparent';
                pedidoIdentificador.textContent = `Mesa ${table.id}`;
            } else if (table.status === 'occupied') {
                stateClass = 'bg-red-100 text-red-800 border-red-200 hover:bg-red-200';
            } else {
                stateClass = 'bg-green-100 text-green-800 border-green-200 hover:bg-green-200';
            }
            tableCard.className = `p-2 rounded-lg font-semibold text-center cursor-pointer transition-all duration-200 border-2 ${stateClass}`;
            tableCard.innerHTML = `<i class="fas fa-chair mr-2"></i><span>${table.id}</span>`;
            tableCard.onclick = () => selectPdvTable(table.id);
            tablesGrid.appendChild(tableCard);
        });
        if(isBalcaoActive) {
            pedidoIdentificador.textContent = 'Venda ao Balcão';
        } else if (!currentTableId) {
            pedidoIdentificador.textContent = 'Nenhum';
        }
    }
    
    function renderCart() {
        const cartItemsEl = document.getElementById('pos-cart-items');
        const finalizeBtn = document.getElementById('finalize-sale-btn');
        if (currentTableId === null) {
            cartItemsEl.innerHTML = `<p class="text-gray-500 text-center mt-8">Selecione uma mesa ou "Venda ao Balcão" para começar.</p>`;
            finalizeBtn.disabled = true; return;
        }
        finalizeBtn.disabled = posCart.length === 0;
        cartItemsEl.innerHTML = posCart.length === 0 ? `<p class="text-gray-500 text-center mt-8">Adicione itens ao pedido.</p>` : '';
        posCart.forEach(item => {
            cartItemsEl.innerHTML += `<div class="flex justify-between items-center mb-2 p-2 bg-white rounded-md"><div class="flex-grow"><p class="font-semibold text-sm">${item.nome_produto}</p></div><div class="flex items-center gap-2"><button class="font-bold px-2" onclick="updateCartQuantity(${item.id_produto}, -1)">-</button><span>${item.quantity}</span><button class="font-bold px-2" onclick="updateCartQuantity(${item.id_produto}, 1)">+</button></div><p class="font-bold text-sm w-20 text-right">R$ ${(item.preco * item.quantity).toFixed(2).replace('.', ',')}</p></div>`;
        });
        const total = posCart.reduce((s, i) => s + i.preco * i.quantity, 0);
        document.getElementById('pos-cart-total').textContent = `R$ ${total.toFixed(2).replace('.', ',')}`;
    }

    // 5. LÓGICA DO PDV E BUSCA
    function selectPdvTable(tableId) {
        currentTableId = tableId;
        posCart = tableId === 'balcao' ? [] : tables.find(t => t.id === tableId).order;
        renderPdv();
    }
    
    function addToCart(productId) {
        if (currentTableId === null) { showToast("Selecione uma mesa para começar.", "error"); return; }
        const product = products.find(p => p.id_produto === productId);
        const cartItem = posCart.find(item => item.id_produto === productId);
        const estoqueDisp = product.quantidade_estoque - (cartItem ? cartItem.quantity : 0);
        if (estoqueDisp <= 0) { showToast(`Estoque esgotado para ${product.nome_produto}!`, 'error'); return; }
        if (cartItem) { cartItem.quantity++; } else { posCart.push({ ...product, quantity: 1 }); }
        if (currentTableId !== 'balcao') {
            const table = tables.find(t => t.id === currentTableId);
            if (table) { table.order = [...posCart]; table.status = 'occupied'; }
        }
        renderCart(); renderTablesGridForPdv();
    }

    window.updateCartQuantity = (productId, change) => {
        const cartItem = posCart.find(item => item.id_produto === productId);
        if (!cartItem) return;
        const newQuantity = cartItem.quantity + change;
        if (newQuantity <= 0) {
            posCart = posCart.filter(item => item.id_produto !== productId);
        } else {
            const product = products.find(p => p.id_produto === productId);
            if (newQuantity > product.quantidade_estoque) { showToast('Quantidade excede o estoque!', 'error'); return; }
            cartItem.quantity = newQuantity;
        }
        if (currentTableId !== 'balcao') {
            const table = tables.find(t => t.id === currentTableId);
            if (table) { table.order = [...posCart]; if (posCart.length === 0) table.status = 'free'; }
        }
        renderCart(); renderTablesGridForPdv();
    };

    document.getElementById('finalize-sale-btn').addEventListener('click', async () => {
        if (posCart.length === 0 || currentTableId === null) return;
        const saleData = { id_usuario: currentUser.id_usuario, origem: currentTableId === 'balcao' ? 'Balcão' : `Mesa ${currentTableId}`, itens: posCart.map(item => ({ id_produto: item.id_produto, quantidade: item.quantity })) };
        try {
            await fetchApi('/vendas', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(saleData) });
            showToast('Venda finalizada com sucesso!', 'success');
            if (currentTableId !== 'balcao') {
                const table = tables.find(t => t.id === currentTableId);
                table.status = 'free'; table.order = [];
            }
            posCart = []; currentTableId = null;
            await fetchApi('/produtos').then(data => products = data);
            renderPdv();
        } catch (error) { /* erro já tratado em fetchApi */ }
    });
    
    productSearchInput.addEventListener('input', (e) => {
        const searchTerm = e.target.value.toLowerCase();
        const filtered = products.filter(p => p.nome_produto.toLowerCase().includes(searchTerm));
        renderPosProducts(filtered);
    });

    // 6. MANIPULAÇÃO DE MODAIS
    function closeModalWindows() {
        document.querySelectorAll('.modal-overlay').forEach(modal => {
            modal.classList.remove('flex');
            modal.classList.add('hidden');
        });
    }

    // Listener de eventos centralizado para todos os modais e ações
    document.addEventListener('click', (e) => {
        const target = e.target;
        if (target.closest('.close-modal-btn') || target.classList.contains('modal-overlay')) {
            e.preventDefault();
            closeModalWindows();
        }

        const actionButton = target.closest('button[data-action]');
        if (actionButton) {
            const action = actionButton.dataset.action;
            const id = parseInt(actionButton.dataset.id);
            if (action === 'view') openViewModal(id);
            if (action === 'edit') openEditModal(id);
            if (action === 'delete') openDeleteModal(id);
        }
    });
    
    document.getElementById('add-product-btn').addEventListener('click', () => {
        document.getElementById('product-form').reset();
        document.getElementById('product-id').value = '';
        document.getElementById('modal-title').textContent = 'Adicionar Novo Produto';
        productModal.classList.remove('hidden');
        productModal.classList.add('flex');
    });

    async function handleProductFormSubmit(e) {
        e.preventDefault();
        const id = document.getElementById('product-id').value;
        const productData = { nome_produto: document.getElementById('product-name').value, preco: parseFloat(document.getElementById('product-price').value), quantidade_estoque: parseInt(document.getElementById('product-Estoque').value), imagem_url: document.getElementById('product-image-url').value };
        const url = id ? `/produtos/${id}` : '/produtos';
        const method = id ? 'PUT' : 'POST';
        try {
            await fetchApi(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(productData) });
            showToast(id ? 'Produto atualizado!' : 'Produto criado!', 'success');
            await pageRenderers['#produtos']();
            closeModalWindows();
        } catch (error) { /* erro já tratado */ }
    }

    async function handleDeleteProduct(productId) {
        try {
            await fetchApi(`/produtos/${productId}`, { method: 'DELETE' });
            showToast('Produto desativado!', 'success');
            await pageRenderers['#produtos']();
            closeModalWindows();
        } catch (error) { /* erro já tratado */ }
    }
    
    document.getElementById('product-form').addEventListener('submit', handleProductFormSubmit);
    document.getElementById('confirm-delete-btn').addEventListener('click', (e) => handleDeleteProduct(parseInt(e.currentTarget.dataset.productId)));

    window.openEditModal = (productId) => {
        const product = products.find(p => p.id_produto === productId);
        if (product) {
            document.getElementById('modal-title').textContent = `Editar Produto: ${product.nome_produto}`;
            document.getElementById('product-id').value = product.id_produto;
            document.getElementById('product-name').value = product.nome_produto;
            document.getElementById('product-image-url').value = product.imagem_url;
            document.getElementById('product-price').value = product.preco;
            document.getElementById('product-Estoque').value = product.quantidade_estoque;
            productModal.classList.remove('hidden');
            productModal.classList.add('flex');
        }
    };
    
    window.openDeleteModal = (productId) => {
        const product = products.find(p => p.id_produto === productId);
        if (product) {
            document.getElementById('delete-product-name').textContent = product.nome_produto;
            document.getElementById('confirm-delete-btn').dataset.productId = productId;
            deleteModal.classList.remove('hidden');
            deleteModal.classList.add('flex');
        }
    };
    
    window.openViewModal = (productId) => {
        const product = products.find(p => p.id_produto === productId);
        if (product) {
            const content = document.getElementById('view-product-content');
            content.innerHTML = `
                <img src="${product.imagem_url}" onerror="this.src='https://placehold.co/400x200/EEE/31343C?text=Sem+Img'" class="w-full h-48 object-cover rounded-lg mb-4">
                <h3 class="text-2xl font-bold mb-2">${product.nome_produto}</h3>
                <p class="text-lg font-semibold text-green-600 mb-4">R$ ${Number(product.preco).toFixed(2).replace('.', ',')}</p>
                <div class="text-left space-y-2">
                    <p><strong>Estoque Atual:</strong> ${product.quantidade_estoque} unidades</p>
                </div>`;
            viewProductModal.classList.remove('hidden');
            viewProductModal.classList.add('flex');
        }
    };
    
    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toastEl = document.createElement('div');
        toastEl.className = `p-4 rounded-lg shadow-lg text-white ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`;
        toastEl.textContent = message;
        container.appendChild(toastEl);
        setTimeout(() => { toastEl.remove(); }, 4000);
    }
    
    if (window.location.hash) handleNavigation();
});
