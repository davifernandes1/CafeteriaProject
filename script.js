document.addEventListener('DOMContentLoaded', () => {

    const loginPage = document.getElementById('login-page');
    const appContainer = document.getElementById('app-container');
    const loginForm = document.getElementById('login-form');
    const logoutBtn = document.getElementById('logout-btn');

    // 2. MOCK DATA (Simulação de uma base de dados)

    let products = [];
    let sales = [];
    let tables = [];
    let posCart = [];
    let currentTableId = null;

    // 3. API FUNCTIONS (Funções que irão comunicar com o back-end)
 
    
    // Simula a busca de dados iniciais do servidor
    async function fetchInitialData() {
        console.log("Simulando busca de dados iniciais...");
        products = [
            { id: 1, name: "Espresso Duplo", price: 8.50, Estoque: 45, EstoqueAlert: 10, imageUrl: "https://cafeonline.com.br/blog/wp-content/uploads/espresso-doppio-1-1024x576.webp" },
            { id: 2, name: "Bolo de Fubá", price: 12.00, Estoque: 8, EstoqueAlert: 5, imageUrl: "https://receitadaboa.com.br/wp-content/uploads/2024/08/Imagem-ilustrativa-de-bolo-de-fuba-2.webp" },
            { id: 3, name: "Pão de Queijo", price: 6.00, Estoque: 3, EstoqueAlert: 10, imageUrl: "https://amopaocaseiro.com.br/wp-content/uploads/2022/08/yt-069_pao-de-queijo_receita-840x560.jpg" },
            { id: 4, name: "Cappuccino", price: 11.00, Estoque: 30, EstoqueAlert: 10, imageUrl: "https://www.minhareceita.com.br/app/uploads/2025/03/cappuccino-cremoso-site-minha-receita.webp" },
            { id: 5, name: "Croissant", price: 9.50, Estoque: 20, EstoqueAlert: 8, imageUrl: "https://delishglobe.com/wp-content/uploads/2024/11/Croissants-article.png" },
        ];
        sales = [];
        tables = Array.from({ length: 8 }, (_, i) => ({ id: i + 1, status: 'free', order: [] }));
        console.log("Dados simulados carregados.");
    }
    
    // Simula a criação de uma nova venda na API
    async function createSale(saleData) {
        console.log("Simulando criação de venda:", saleData);
        const saleId = (sales.length > 0 ? Math.max(...sales.map(s => s.id)) : 0) + 1;
        const newSale = { id: saleId, ...saleData, date: new Date().toISOString() };
        sales.push(newSale);
        
        // Simular atualização de Estoque
        saleData.items.forEach(cartItem => {
            const product = products.find(p => p.id === cartItem.id);
            if(product) product.Estoque -= cartItem.quantity;
        });

        return newSale;
    }

    // 4. AUTH & NAVIGATION

    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;

        if (username === 'admin' && password === 'admin') {
            await fetchInitialData(); 
            loginPage.classList.add('hidden');
            appContainer.classList.remove('hidden');
            window.location.hash = '#dashboard';
            handleNavigation();
        } else {
            document.getElementById('login-error').classList.remove('hidden');
        }
    });

    logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        appContainer.classList.add('hidden');
        loginPage.classList.remove('hidden');
        loginForm.reset();
        window.location.hash = '';
    });

    function handleNavigation() {
        const hash = window.location.hash || '#dashboard';
        document.querySelectorAll('main').forEach(p => p.classList.add('hidden'));
        document.querySelectorAll('.sidebar-link').forEach(l => l.classList.remove('active'));
        
        const activePage = document.querySelector(`${hash}-page`);
        const activeLink = document.querySelector(`a[href="${hash}"]`);

        if (activePage) activePage.classList.remove('hidden');
        if (activeLink) activeLink.classList.add('active');
        
        const pageRenderer = pageRenderers[hash];
        if (pageRenderer) pageRenderer();
    }
    window.addEventListener('hashchange', handleNavigation);


    // 5. RENDER FUNCTIONS
 
    
    const pageRenderers = {
        '#dashboard': renderDashboard,
        '#pdv': renderPdv,
        '#vendas': renderSalesLog,
        '#produtos': renderProductTable,
        '#estoque': renderEstoqueTable,
    };
    
    // --- Dashboard ---
    function renderDashboard() {
        const today = new Date().toDateString();
        const todaySales = sales.filter(s => new Date(s.date).toDateString() === today);
        const totalSalesValue = todaySales.reduce((sum, s) => sum + s.total, 0);

        document.getElementById('daily-sales-value').textContent = `R$ ${totalSalesValue.toFixed(2).replace('.', ',')}`;
        document.getElementById('daily-orders-count').textContent = todaySales.length;
        document.getElementById('average-ticket').textContent = `R$ ${(todaySales.length > 0 ? totalSalesValue / todaySales.length : 0).toFixed(2).replace('.', ',')}`;
        document.getElementById('occupied-tables-count').textContent = tables.filter(t => t.status === 'occupied').length;

        const lowEstoqueList = document.getElementById('low-Estoque-list');
        lowEstoqueList.innerHTML = '';
        const lowEstoqueProducts = products.filter(p => p.Estoque <= p.EstoqueAlert);
        if (lowEstoqueProducts.length === 0) {
             lowEstoqueList.innerHTML = `<p class="text-sm text-gray-500">Nenhum item com Estoque baixo.</p>`;
        } else {
            lowEstoqueProducts.forEach(p => {
                lowEstoqueList.innerHTML += `<li class="flex justify-between items-center text-sm"><span class="font-semibold">${p.name}</span><span class="font-bold text-red-500">${p.Estoque} un.</span></li>`;
            });
        }
        
        renderSalesChart();
    }

    let salesChart;
    function renderSalesChart() {
        const canvas = document.getElementById('salesChart');
        if (!canvas || !canvas.offsetParent) {
            setTimeout(renderSalesChart, 50);
            return;
        }
        const ctx = canvas.getContext('2d');
        const labels = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
        const salesByDay = new Array(7).fill(0);
        sales.forEach(sale => { salesByDay[new Date(sale.date).getDay()] += sale.total; });
        if (salesChart) salesChart.destroy();
        salesChart = new Chart(ctx, {
            type: 'line',
            data: { labels, datasets: [{ label: 'Vendas (R$)', data: salesByDay, backgroundColor: 'rgba(200, 106, 45, 0.2)', borderColor: '#c86a2d', borderWidth: 3, tension: 0.3, fill: true }] },
            options: { responsive: true, maintainAspectRatio: false, scales: { y: { beginAtZero: true } }, plugins: { legend: { display: false } } }
        });
    }

    // --- Ponto de Venda (PDV) ---
    function renderPdv() {
        renderTablesGridForPdv();
        renderPosProducts();
        renderCart();
    }

    function renderTablesGridForPdv() {
        const tablesGrid = document.getElementById('tables-grid');
        tablesGrid.innerHTML = '';
        
        const counterSaleBtn = document.createElement('button');
        const isBalcaoActive = currentTableId === 'balcao';
        counterSaleBtn.className = `p-2 rounded-lg font-bold transition h-10 ${isBalcaoActive ? 'bg-[#4a2c2a] text-white ring-2 ring-offset-2 ring-[#4a2c2a]' : 'bg-blue-500 text-white'} hover:opacity-80`;
        counterSaleBtn.innerHTML = `<i class="fas fa-store mr-2"></i> Balcão`;
        counterSaleBtn.onclick = () => selectPdvTable('balcao');
        tablesGrid.appendChild(counterSaleBtn);

        tables.forEach(table => {
            const tableEl = document.createElement('button');
            const isOccupied = table.status === 'occupied';
            const isActive = table.id === currentTableId;
            tableEl.className = `p-2 rounded-lg font-bold transition w-16 h-10 ${isActive ? 'bg-[#4a2c2a] text-white ring-2 ring-offset-2 ring-[#4a2c2a]' : (isOccupied ? 'bg-orange-400 text-white' : 'bg-green-500 text-white')} hover:opacity-80`;
            tableEl.textContent = table.id;
            tableEl.onclick = () => selectPdvTable(table.id);
            tablesGrid.appendChild(tableEl);
        });
    }

    function selectPdvTable(tableId) {
        currentTableId = tableId;
        if (tableId === 'balcao') {
            posCart = [];
        } else {
            const table = tables.find(t => t.id === tableId);
            posCart = [...table.order];
        }
        renderPdv();
    }

    function renderPosProducts() {
        const productListEl = document.getElementById('pos-product-list');
        productListEl.innerHTML = '';
        products.forEach(p => {
            const card = document.createElement('div');
            card.className = `border rounded-lg shadow-sm cursor-pointer transition-transform transform hover:scale-105 ${p.Estoque > 0 ? 'bg-white' : 'bg-gray-200 opacity-50'}`;
            card.innerHTML = `<img src="${p.imageUrl}" class="w-full h-24 object-cover rounded-t-lg"><div class="p-2 text-center"><h6 class="text-sm font-bold truncate">${p.name}</h6></div>`;
            if (p.Estoque > 0) card.onclick = () => addToCart(p.id);
            productListEl.appendChild(card);
        });
    }

    function renderCart() {
        const cartItemsEl = document.getElementById('pos-cart-items');
        const finalizeBtn = document.getElementById('finalize-sale-btn');
        
        if (currentTableId === null) {
            cartItemsEl.innerHTML = `<p class="text-gray-500 text-center mt-8">Selecione uma mesa ou "Venda ao Balcão" para começar.</p>`;
            finalizeBtn.disabled = true;
            return;
        }
        finalizeBtn.disabled = posCart.length === 0;
        cartItemsEl.innerHTML = posCart.length === 0 ? `<p class="text-gray-500 text-center mt-8">Adicione itens ao pedido.</p>` : '';
        
        if (posCart.length > 0) {
            posCart.forEach(item => {
                cartItemsEl.innerHTML += `<div class="flex justify-between items-center mb-2 p-2 bg-white rounded-md"><div class="flex-grow"><p class="font-semibold text-sm">${item.name}</p></div><div class="flex items-center gap-2"><button class="font-bold px-2" onclick="updateCartQuantity(${item.id}, -1)">-</button><span>${item.quantity}</span><button class="font-bold px-2" onclick="updateCartQuantity(${item.id}, 1)">+</button></div><p class="font-bold text-sm w-20 text-right">R$ ${(item.price * item.quantity).toFixed(2).replace('.', ',')}</p></div>`;
            });
        }
        document.getElementById('pos-cart-total').textContent = `R$ ${posCart.reduce((s, i) => s + i.price * i.quantity, 0).toFixed(2).replace('.', ',')}`;
    }
    
    // --- Outras Páginas ---
    function renderSalesLog() {
        const reportBody = document.getElementById('sales-report-table-body');
        reportBody.innerHTML = sales.length === 0 ? `<tr><td colspan="5" class="text-center p-5 text-gray-500">Nenhuma venda registada.</td></tr>` : '';
        sales.slice().reverse().forEach(s => {
            reportBody.innerHTML += `<tr><td class="p-3 font-bold">#${s.id}</td><td class="p-3">${s.tableId === 'balcao' ? 'Balcão' : `Mesa ${s.tableId}`}</td><td class="p-3">${new Date(s.date).toLocaleString('pt-BR')}</td><td class="p-3">R$ ${s.total.toFixed(2).replace('.', ',')}</td><td class="p-3 text-xs">${s.items.map(i => `${i.quantity}x ${i.name}`).join(', ')}</td></tr>`;
        });
    }
    
    function renderProductTable() {
        const productTableBody = document.getElementById('product-table-body');
        productTableBody.innerHTML = '';
        products.forEach(p => {
            productTableBody.innerHTML += `<tr><td class="p-3"><img src="${p.imageUrl}" alt="${p.name}" class="w-12 h-12 object-cover rounded-md"></td><td class="p-3 font-bold">${p.name}</td><td class="p-3">R$ ${p.price.toFixed(2).replace('.', ',')}</td><td class="p-3">${p.Estoque} un.</td><td class="p-3 text-center"><button onclick="openViewModal(${p.id})" class="text-gray-500 hover:text-green-600 p-2" title="Visualizar"><i class="fas fa-eye"></i></button><button onclick="openEditModal(${p.id})" class="text-gray-500 hover:text-blue-600 p-2" title="Editar"><i class="fas fa-pencil-alt"></i></button><button onclick="openDeleteModal(${p.id})" class="text-gray-500 hover:text-red-600 p-2" title="Eliminar"><i class="fas fa-trash-alt"></i></button></td></tr>`;
        });
    }

    function renderEstoqueTable() {
        const EstoqueTableBody = document.getElementById('Estoque-table-body');
        EstoqueTableBody.innerHTML = '';
        products.forEach(p => {
            const EstoqueStatus = p.Estoque > p.EstoqueAlert ? 'ok' : (p.Estoque > 0 ? 'low' : 'empty');
            const statusInfo = {
                ok: { text: 'OK', color: 'bg-green-100 text-green-800' },
                low: { text: 'Baixo', color: 'bg-yellow-100 text-yellow-800' },
                empty: { text: 'Esgotado', color: 'bg-red-100 text-red-800' }
            };
            EstoqueTableBody.innerHTML += `<tr><td class="p-3 font-semibold">${p.name}</td><td class="p-3">${p.Estoque} un.</td><td class="p-3"><span class="px-2 py-1 text-xs font-semibold rounded-full ${statusInfo[EstoqueStatus].color}">${statusInfo[EstoqueStatus].text}</span></td><td class="p-3 text-center"><button onclick="openAddEstoqueModal(${p.id})" class="text-blue-600 hover:text-blue-800 p-2"><i class="fas fa-plus-circle mr-1"></i> Adicionar</button></td></tr>`;
        });
    }

 
    // 6. EVENT HANDLERS & LOGIC

    function showToast(message, type = 'success') {
        const container = document.getElementById('toast-container');
        const toastEl = document.createElement('div');
        toastEl.className = `p-4 rounded-lg shadow-lg text-white ${type === 'success' ? 'bg-green-500' : 'bg-red-500'}`;
        toastEl.textContent = message;
        container.appendChild(toastEl);
        setTimeout(() => { toastEl.remove(); }, 3000);
    }

    function addToCart(productId) {
        if (currentTableId === null) { showToast("Por favor, selecione uma mesa ou 'Venda ao Balcão' primeiro.", "error"); return; }
        const product = products.find(p => p.id === productId), cartItem = posCart.find(item => item.id === productId);
        const EstoqueAvailable = product.Estoque - (cartItem ? cartItem.quantity : 0);
        if (EstoqueAvailable <= 0) { showToast(`Estoque esgotado para ${product.name}!`, 'error'); return; }
        if (cartItem) cartItem.quantity++; else posCart.push({ ...product, quantity: 1 });
        
        if (currentTableId !== 'balcao') {
            const table = tables.find(t => t.id === currentTableId);
            if(table) { table.order = [...posCart]; table.status = 'occupied'; }
        }
        renderCart();
        renderTablesGridForPdv();
    }
    
    window.updateCartQuantity = (productId, change) => {
        const cartItem = posCart.find(item => item.id === productId);
        if (!cartItem) return;
        const newQuantity = cartItem.quantity + change;
        if (newQuantity <= 0) {
            posCart = posCart.filter(item => item.id !== productId);
        } else {
            const product = products.find(p => p.id === productId);
            if (newQuantity > product.Estoque) { showToast('Quantidade excede o Estoque!', 'error'); return; }
            cartItem.quantity = newQuantity;
        }
        
        if (currentTableId !== 'balcao') {
            const table = tables.find(t => t.id === currentTableId);
            if(table) {
                table.order = [...posCart];
                if(posCart.length === 0) table.status = 'free';
            }
        }
        renderCart();
        renderTablesGridForPdv();
    }

    document.getElementById('finalize-sale-btn').addEventListener('click', async () => {
        if (posCart.length === 0 || currentTableId === null) return;
        const saleData = {
            tableId: currentTableId,
            items: posCart.map(item => ({ id: item.id, name: item.name, quantity: item.quantity, price: item.price })),
            total: posCart.reduce((s, i) => s + i.price * i.quantity, 0),
        };
        const newSale = await createSale(saleData);
        showToast(`Venda #${newSale.id} finalizada com sucesso!`, 'success');
        
        if (currentTableId !== 'balcao') {
            const table = tables.find(t => t.id === currentTableId);
            table.status = 'free'; table.order = [];
        }
        
        posCart = []; currentTableId = null;
        renderPdv();
    });

    const productModal = document.getElementById('product-modal');
    const addEstoqueModal = document.getElementById('add-Estoque-modal');
    const deleteModal = document.getElementById('delete-modal');
    const viewProductModal = document.getElementById('view-product-modal');

    function closeModalWindows() {
        productModal.classList.add('hidden');
        addEstoqueModal.classList.add('hidden');
        deleteModal.classList.add('hidden');
        viewProductModal.classList.add('hidden');
    }
    
    document.querySelectorAll('.close-modal-btn').forEach(btn => btn.addEventListener('click', closeModalWindows));
    
    window.openAddEstoqueModal = (productId) => {
        const product = products.find(p => p.id === productId);
        if(product) {
            document.getElementById('add-Estoque-modal-title').textContent = `Adicionar ao Estoque: ${product.name}`;
            document.getElementById('add-Estoque-product-id').value = productId;
            addEstoqueModal.classList.remove('hidden');
            addEstoqueModal.classList.add('flex');
        }
    };
    
    document.getElementById('add-product-btn').addEventListener('click', () => {
        document.getElementById('product-form').reset();
        document.getElementById('product-id').value = '';
        document.getElementById('modal-title').textContent = 'Adicionar Novo Produto';
        productModal.classList.remove('hidden');
        productModal.classList.add('flex');
    });

    window.openEditModal = (productId) => {
        const product = products.find(p => p.id === productId);
        if(product) {
            document.getElementById('modal-title').textContent = `Editar Produto: ${product.name}`;
            document.getElementById('product-id').value = product.id;
            document.getElementById('product-name').value = product.name;
            document.getElementById('product-image-url').value = product.imageUrl;
            document.getElementById('product-price').value = product.price;
            document.getElementById('product-Estoque').value = product.Estoque;
            productModal.classList.remove('hidden');
            productModal.classList.add('flex');
        }
    }

    window.openDeleteModal = (productId) => {
        const product = products.find(p => p.id === productId);
        if(product) {
            document.getElementById('delete-product-name').textContent = product.name;
            document.getElementById('confirm-delete-btn').dataset.productId = productId;
            deleteModal.classList.remove('hidden');
            deleteModal.classList.add('flex');
        }
    }

     window.openViewModal = (productId) => {
        const product = products.find(p => p.id === productId);
        if(product) {
            const content = document.getElementById('view-product-content');
            content.innerHTML = `
                <img src="${product.imageUrl}" class="w-full h-48 object-cover rounded-lg mb-4">
                <h3 class="text-2xl font-bold mb-2">${product.name}</h3>
                <p class="text-lg font-semibold text-green-600 mb-4">R$ ${product.price.toFixed(2).replace('.', ',')}</p>
                <div class="text-left space-y-2">
                    <p><strong>Estoque Atual:</strong> ${product.Estoque} unidades</p>
                    <p><strong>Alerta de Estoque Baixo:</strong> ${product.EstoqueAlert} unidades</p>
                </div>
            `;
            viewProductModal.classList.remove('hidden');
            viewProductModal.classList.add('flex');
        }
    }

    document.getElementById('confirm-delete-btn').addEventListener('click', (e) => {
        const productId = parseInt(e.currentTarget.dataset.productId);
        products = products.filter(p => p.id !== productId);
        renderProductTable();
        closeModalWindows();
        showToast('Produto eliminado com sucesso.', 'success');
    });

    document.getElementById('product-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const id = parseInt(document.getElementById('product-id').value);
        const data = {
            name: document.getElementById('product-name').value,
            imageUrl: document.getElementById('product-image-url').value,
            price: parseFloat(document.getElementById('product-price').value),
            Estoque: parseInt(document.getElementById('product-Estoque').value),
            EstoqueAlert: 10 // Padrão
        };
        
        if(id) { // Editando
            const index = products.findIndex(p => p.id === id);
            products[index] = { ...products[index], ...data };
            showToast(`${data.name} atualizado com sucesso.`, 'success');
        } else { // Criando
            data.id = (products.length > 0 ? Math.max(...products.map(p => p.id)) : 0) + 1;
            products.push(data);
            showToast(`${data.name} adicionado com sucesso.`, 'success');
        }

        renderProductTable();
        closeModalWindows();
    });

     document.getElementById('add-Estoque-form').addEventListener('submit', (e) => {
        e.preventDefault();
        const productId = parseInt(document.getElementById('add-Estoque-product-id').value);
        const quantity = parseInt(document.getElementById('add-Estoque-quantity').value);
        const product = products.find(p => p.id === productId);
        if(product && quantity > 0) {
            product.Estoque += quantity;
            showToast('Estoque atualizado!', 'success');
            renderEstoqueTable();
        }
        closeModalWindows();
        e.target.reset();
    });
});
