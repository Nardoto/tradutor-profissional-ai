// ========================================
// PAINEL DE ADMINISTRAÇÃO
// Admin Panel for Managing PRO Users
// Version: 6.2.0 - Teste Grátis 3 Dias
// Desenvolvido por: Nardoto
// ========================================

let currentUser = null;
let allUsers = [];

// Admin emails - Lista de administradores autorizados
const ADMIN_EMAILS = [
    'tharcisionardoto@gmail.com',  // Conta principal do Firebase
    'nardotoengenharia@gmail.com'  // Conta secundária
];

// ========================================
// AUTENTICAÇÃO
// ========================================

// Monitorar estado de autenticação
window.firebaseOnAuthStateChanged(window.firebaseAuth, (user) => {
    console.log('Auth state changed:', user ? user.email : 'não logado');

    if (user) {
        // Verificar se é admin (pode ser qualquer email da lista)
        if (ADMIN_EMAILS.includes(user.email)) {
            console.log('✅ Admin autorizado:', user.email);
            currentUser = user;
            showAdminPanel();
            loadUsers();
        } else {
            console.log('❌ Email não autorizado:', user.email);
            showToast('❌ Acesso negado! Apenas administradores podem acessar.', 'error');
            setTimeout(() => logout(), 2000);
        }
    } else {
        console.log('Nenhum usuário logado - mostrando tela de login');
        showLoginScreen();
    }
});

function showLoginScreen() {
    document.getElementById('loginScreen').style.display = 'flex';
    document.getElementById('adminPanel').style.display = 'none';
}

function showAdminPanel() {
    document.getElementById('loginScreen').style.display = 'none';
    document.getElementById('adminPanel').style.display = 'block';
}

async function loginWithGoogle() {
    try {
        console.log('Iniciando login com popup...');
        const result = await window.firebaseSignInWithPopup(window.firebaseAuth, window.firebaseProvider);
        console.log('✅ Login bem-sucedido:', result.user.email);
    } catch (error) {
        console.error('Erro no login:', error);

        if (error.code === 'auth/popup-closed-by-user') {
            showToast('⚠️ Login cancelado', 'warning');
        } else if (error.code === 'auth/popup-blocked') {
            showToast('⚠️ Popup bloqueado! Permita popups para este site.', 'warning');
        } else {
            showToast('❌ Erro ao fazer login: ' + error.message, 'error');
        }
    }
}

window.loginWithGoogle = loginWithGoogle;

async function logout() {
    try {
        await window.firebaseSignOut(window.firebaseAuth);
        showToast('✅ Logout realizado com sucesso!', 'success');
    } catch (error) {
        console.error('Erro no logout:', error);
    }
}

window.logout = logout;

// ========================================
// CARREGAR USUÁRIOS
// ========================================

async function loadUsers() {
    const loading = document.getElementById('loading');
    const userList = document.getElementById('userList');

    loading.classList.add('show');
    userList.innerHTML = '';

    try {
        const usersRef = window.firebaseCollection(window.firebaseDb, 'users');
        const snapshot = await window.firebaseGetDocs(usersRef);

        allUsers = [];
        snapshot.forEach((doc) => {
            allUsers.push({
                id: doc.id,
                ...doc.data()
            });
        });

        // Ordenar por data de criação (mais recentes primeiro)
        allUsers.sort((a, b) => {
            const dateA = new Date(a.createdAt || 0);
            const dateB = new Date(b.createdAt || 0);
            return dateB - dateA;
        });

        updateStats();
        renderUsers(allUsers);

        showToast(`✅ ${allUsers.length} usuários carregados!`, 'success');
    } catch (error) {
        console.error('Erro ao carregar usuários:', error);
        showToast('❌ Erro ao carregar usuários', 'error');
    } finally {
        loading.classList.remove('show');
    }
}

window.loadUsers = loadUsers;

function updateStats() {
    const total = allUsers.length;
    const pro = allUsers.filter(u => u.isPro).length;
    const free = total - pro;

    document.getElementById('totalUsers').textContent = total;
    document.getElementById('proUsers').textContent = pro;
    document.getElementById('freeUsers').textContent = free;
}

function renderUsers(users) {
    const userList = document.getElementById('userList');

    if (users.length === 0) {
        userList.innerHTML = '<p style="text-align: center; color: var(--text-light); padding: 2rem;">Nenhum usuário encontrado.</p>';
        return;
    }

    userList.innerHTML = users.map(user => {
        // Verificar se é teste grátis
        const isTrial = user.isPro && user.proActivatedBy === 'trial';
        const trialExpired = isTrial && user.trialExpiresAt && new Date(user.trialExpiresAt) < new Date();

        // Calcular dias restantes do teste
        let trialDaysLeft = 0;
        if (isTrial && user.trialExpiresAt) {
            const expiresAt = new Date(user.trialExpiresAt);
            const now = new Date();
            trialDaysLeft = Math.ceil((expiresAt - now) / (1000 * 60 * 60 * 24));
        }

        // Badge do status
        let badgeClass = 'badge-free';
        let badgeText = 'GRÁTIS';

        if (user.isPro) {
            if (isTrial) {
                badgeClass = 'badge-free'; // Laranja para teste
                badgeText = trialExpired ? 'TESTE EXPIRADO' : `TESTE (${trialDaysLeft}d)`;
            } else {
                badgeClass = 'badge-pro';
                badgeText = 'PRO';
            }
        }

        return `
            <div class="user-item" data-email="${user.email}">
                <div class="user-info">
                    <div class="user-email">
                        ${user.email}
                        <span class="badge ${badgeClass}">
                            ${badgeText}
                        </span>
                    </div>
                    <div class="user-status">
                        ${user.displayName || 'Sem nome'} •
                        ${user.translationsToday || 0} traduções hoje •
                        Criado em ${formatDate(user.createdAt)}
                        ${isTrial && !trialExpired ? ` • Teste expira em ${new Date(user.trialExpiresAt).toLocaleDateString('pt-BR')}` : ''}
                    </div>
                </div>
                <div class="user-actions">
                    ${user.isPro ?
                        `<button onclick="togglePro('${user.id}', '${user.email}', false)" class="btn btn-danger btn-sm">Desativar PRO</button>` :
                        `<button onclick="togglePro('${user.id}', '${user.email}', true)" class="btn btn-success btn-sm">Ativar PRO</button>`
                    }
                </div>
            </div>
        `;
    }).join('');
}

function formatDate(dateString) {
    if (!dateString) return 'Data desconhecida';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

// ========================================
// ATIVAR/DESATIVAR PRO - NOVO SISTEMA COM PLANOS
// ========================================

// Configuração de planos
const PLANS = {
    free: {
        id: 'free',
        name: 'FREE (Grátis)',
        features: [],
        isPro: false
    },
    basic: {
        id: 'basic',
        name: 'BÁSICO',
        features: ['veo3-automator', 'wisk-automator', 'tradutor-ai-unlimited'],
        isPro: true
    },
    vip: {
        id: 'vip',
        name: 'VIP (Tudo Liberado)',
        features: ['all-features'],
        isPro: true
    }
};

async function changePlan(userId, email) {
    // Mostrar dialog para escolher o plano
    const planChoice = prompt(
        `Escolha o plano para ${email}:\n\n` +
        `1 - FREE (Grátis) - Sem acesso\n` +
        `2 - BÁSICO - VEO3, Wisk, Tradutor AI\n` +
        `3 - VIP - TUDO liberado (inclui futuras extensões)\n\n` +
        `Digite 1, 2 ou 3:`
    );

    let plan;
    if (planChoice === '1') {
        plan = PLANS.free;
    } else if (planChoice === '2') {
        plan = PLANS.basic;
    } else if (planChoice === '3') {
        plan = PLANS.vip;
    } else {
        showToast('❌ Opção inválida!', 'error');
        return;
    }

    if (!confirm(`Confirmar mudança para plano ${plan.name}?`)) {
        return;
    }

    try {
        const userRef = window.firebaseDoc(window.firebaseDb, 'users', userId);

        await window.firebaseUpdateDoc(userRef, {
            plan: plan.id,
            isPro: plan.isPro,
            features: plan.features,
            proActivatedBy: plan.isPro ? 'admin_manual' : null,
            proActivatedAt: plan.isPro ? new Date().toISOString() : null
        });

        showToast(`✅ Plano ${plan.name} ativado para ${email}!`, 'success');

        // Recarregar lista
        await loadUsers();
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        showToast(`❌ Erro ao alterar plano`, 'error');
    }
}

// Manter compatibilidade com código antigo
async function togglePro(userId, email, activate) {
    if (activate) {
        // Ao ativar, chamar changePlan para escolher qual plano
        await changePlan(userId, email);
    } else {
        // Ao desativar, voltar para FREE
        if (!confirm(`Tem certeza que deseja DESATIVAR PRO para ${email}?`)) {
            return;
        }

        try {
            const userRef = window.firebaseDoc(window.firebaseDb, 'users', userId);

            await window.firebaseUpdateDoc(userRef, {
                plan: 'free',
                isPro: false,
                features: [],
                proActivatedBy: null,
                proActivatedAt: null
            });

            showToast(`✅ PRO desativado para ${email}!`, 'success');
            await loadUsers();
        } catch (error) {
            console.error('Erro ao atualizar usuário:', error);
            showToast(`❌ Erro ao desativar PRO`, 'error');
        }
    }
}

window.togglePro = togglePro;
window.changePlan = changePlan;

// ========================================
// ATIVAÇÃO EM MASSA
// ========================================

async function activateMultiple() {
    const emailList = document.getElementById('emailList').value;

    if (!emailList.trim()) {
        showToast('⚠️ Cole a lista de emails primeiro!', 'warning');
        return;
    }

    // Separar emails por linha e limpar espaços
    const emails = emailList
        .split('\n')
        .map(e => e.trim().toLowerCase())
        .filter(e => e && e.includes('@'));

    if (emails.length === 0) {
        showToast('⚠️ Nenhum email válido encontrado!', 'warning');
        return;
    }

    if (!confirm(`Ativar PRO para ${emails.length} usuários?\n\n${emails.slice(0, 5).join('\n')}${emails.length > 5 ? '\n...' : ''}`)) {
        return;
    }

    let activated = 0;
    let notFound = 0;

    showToast(`⏳ Ativando PRO para ${emails.length} usuários...`, 'info');

    try {
        // Buscar todos os usuários
        const usersRef = window.firebaseCollection(window.firebaseDb, 'users');
        const snapshot = await window.firebaseGetDocs(usersRef);

        const userMap = new Map();
        snapshot.forEach((doc) => {
            const data = doc.data();
            userMap.set(data.email.toLowerCase(), { id: doc.id, ...data });
        });

        // Ativar PRO para cada email
        for (const email of emails) {
            const user = userMap.get(email);

            if (user) {
                const userRef = window.firebaseDoc(window.firebaseDb, 'users', user.id);

                await window.firebaseUpdateDoc(userRef, {
                    isPro: true,
                    proActivatedBy: 'admin_bulk',
                    proActivatedAt: new Date().toISOString()
                });

                activated++;
            } else {
                notFound++;
                console.log(`⚠️ Usuário não encontrado: ${email}`);
            }
        }

        showToast(
            `✅ PRO ativado para ${activated} usuários!\n` +
            (notFound > 0 ? `⚠️ ${notFound} emails não encontrados (precisam fazer login primeiro)` : ''),
            'success'
        );

        // Recarregar lista
        await loadUsers();

        // Limpar textarea
        document.getElementById('emailList').value = '';

    } catch (error) {
        console.error('Erro na ativação em massa:', error);
        showToast('❌ Erro ao ativar usuários em massa', 'error');
    }
}

window.activateMultiple = activateMultiple;

// ========================================
// IMPORTAÇÃO KIWIFY COM VÍNCULO
// ========================================

async function importKiwifyCustomers() {
    const csvData = document.getElementById('kiwifyImportData').value;

    if (!csvData.trim()) {
        showToast('⚠️ Cole os dados CSV primeiro!', 'warning');
        return;
    }

    // Processar CSV do Kiwify
    const lines = csvData.split('\n').map(line => line.trim()).filter(line => line);

    if (lines.length < 2) {
        showToast('⚠️ CSV inválido! Cole o cabeçalho e os dados.', 'warning');
        return;
    }

    // Primeira linha é o cabeçalho
    const header = lines[0].split(',').map(h => h.trim());

    // Encontrar índices das colunas importantes
    const emailIndex = header.findIndex(h => h.toLowerCase().includes('email'));
    const nameIndex = header.findIndex(h => h.toLowerCase().includes('customer name'));
    const statusIndex = header.findIndex(h => h.toLowerCase().includes('status'));
    const startedAtIndex = header.findIndex(h => h.toLowerCase().includes('started at'));

    if (emailIndex === -1) {
        showToast('❌ Coluna "Customer Email" não encontrada no CSV!', 'error');
        return;
    }

    console.log('📊 Colunas detectadas:', { emailIndex, nameIndex, statusIndex, startedAtIndex });

    const customers = [];

    // Processar cada linha (pular cabeçalho)
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        const parts = line.split(',').map(p => p.trim());

        // Pegar valores das colunas
        const email = parts[emailIndex];
        const name = nameIndex !== -1 ? parts[nameIndex] : '';
        const status = statusIndex !== -1 ? parts[statusIndex] : 'active';
        const startedAt = startedAtIndex !== -1 ? parts[startedAtIndex] : '';

        // Validar email
        if (!email || !email.includes('@')) {
            console.warn('⚠️ Linha inválida - email não encontrado:', line);
            continue;
        }

        // Filtrar apenas assinaturas ativas
        if (status.toLowerCase() !== 'active') {
            console.log(`⏸️ Ignorando ${email} - Status: ${status}`);
            continue;
        }

        // Gerar order_id e order_ref automáticos
        const timestamp = startedAt ? new Date(startedAt).getTime() : Date.now();
        const orderId = `KW${timestamp}`;
        const orderRef = `IMPORT-${timestamp}`;

        customers.push({
            email: email.toLowerCase(),
            orderId: orderId,
            orderRef: orderRef,
            name: name || 'Cliente Kiwify'
        });
    }

    if (customers.length === 0) {
        showToast('⚠️ Nenhum cliente ativo encontrado no CSV!', 'warning');
        return;
    }

    // Confirmar importação
    const message = `Importar e vincular ${customers.length} clientes ATIVOS ao Kiwify?\n\nPrimeiros 5:\n${customers.slice(0, 5).map(c => `${c.name} <${c.email}>`).join('\n')}${customers.length > 5 ? '\n...' : ''}`;

    if (!confirm(message)) {
        return;
    }

    let imported = 0;
    let notFound = 0;
    let updated = 0;

    showToast(`⏳ Importando ${customers.length} clientes...`, 'info');

    try {
        // Buscar todos os usuários
        const usersRef = window.firebaseCollection(window.firebaseDb, 'users');
        const snapshot = await window.firebaseGetDocs(usersRef);

        const userMap = new Map();
        snapshot.forEach((doc) => {
            const data = doc.data();
            userMap.set(data.email.toLowerCase(), { id: doc.id, ...data });
        });

        // Importar cada cliente
        for (const customer of customers) {
            const user = userMap.get(customer.email);

            if (user) {
                // Usuário existe - atualizar com vínculo Kiwify
                const userRef = window.firebaseDoc(window.firebaseDb, 'users', user.id);

                await window.firebaseUpdateDoc(userRef, {
                    isPro: true,
                    proActivatedBy: 'kiwify_import',
                    proActivatedAt: new Date().toISOString(),
                    kiwifyOrderId: customer.orderId,
                    kiwifyOrderRef: customer.orderRef,
                    kiwifyCustomer: {
                        email: customer.email,
                        name: customer.name || 'Importado'
                    }
                });

                if (user.isPro) {
                    updated++;
                } else {
                    imported++;
                }

                console.log(`✅ Importado com vínculo: ${customer.email} (Order: ${customer.orderId})`);

            } else {
                // Usuário não existe - criar ativação pendente
                const pendingRef = window.firebaseCollection(window.firebaseDb, 'pending_activations');

                // Verificar se já existe ativação pendente
                const pendingQuery = window.firebaseQuery(
                    pendingRef,
                    window.firebaseWhere('email', '==', customer.email)
                );
                const pendingSnap = await window.firebaseGetDocs(pendingQuery);

                if (pendingSnap.empty) {
                    // Adicionar nova ativação pendente
                    await window.firebaseAddDoc(pendingRef, {
                        email: customer.email,
                        orderId: customer.orderId,
                        orderRef: customer.orderRef,
                        customerName: customer.name,
                        createdAt: new Date().toISOString(),
                        status: 'pending',
                        source: 'kiwify_import'
                    });
                }

                notFound++;
                console.log(`⚠️ Usuário não encontrado (ativação pendente criada): ${customer.email}`);
            }
        }

        // Mensagem final
        let resultMessage = `✅ Importação concluída!\n\n`;

        if (imported > 0) {
            resultMessage += `✅ ${imported} novos clientes ativados com vínculo Kiwify\n`;
        }

        if (updated > 0) {
            resultMessage += `🔄 ${updated} clientes já PRO atualizados com vínculo\n`;
        }

        if (notFound > 0) {
            resultMessage += `⚠️ ${notFound} emails não encontrados\n(ativações pendentes criadas - serão ativados no primeiro login)`;
        }

        showToast(resultMessage, 'success');

        // Recarregar lista
        await loadUsers();

        // Limpar textarea
        document.getElementById('kiwifyImportData').value = '';

    } catch (error) {
        console.error('❌ Erro na importação Kiwify:', error);
        showToast('❌ Erro ao importar clientes: ' + error.message, 'error');
    }
}

window.importKiwifyCustomers = importKiwifyCustomers;

// ========================================
// ATIVAÇÃO TESTE GRÁTIS (3 DIAS)
// ========================================

async function activateTrials() {
    const emailList = document.getElementById('trialEmailList').value;

    if (!emailList.trim()) {
        showToast('⚠️ Cole a lista de emails primeiro!', 'warning');
        return;
    }

    // Separar emails por linha e limpar espaços
    const emails = emailList
        .split('\n')
        .map(e => e.trim().toLowerCase())
        .filter(e => e && e.includes('@'));

    if (emails.length === 0) {
        showToast('⚠️ Nenhum email válido encontrado!', 'warning');
        return;
    }

    if (!confirm(`🎁 Ativar teste grátis de 3 dias para ${emails.length} usuários?\n\n${emails.slice(0, 5).join('\n')}${emails.length > 5 ? '\n...' : ''}`)) {
        return;
    }

    let activated = 0;
    let pending = 0;
    let updated = 0;

    showToast(`⏳ Ativando teste grátis para ${emails.length} usuários...`, 'info');

    try {
        // Buscar todos os usuários
        const usersRef = window.firebaseCollection(window.firebaseDb, 'users');
        const snapshot = await window.firebaseGetDocs(usersRef);

        const userMap = new Map();
        snapshot.forEach((doc) => {
            const data = doc.data();
            userMap.set(data.email.toLowerCase(), { id: doc.id, ...data });
        });

        // Calcular data de expiração (3 dias a partir de agora)
        const trialDuration = 3 * 24 * 60 * 60 * 1000; // 3 dias em milissegundos
        const trialExpiresAt = new Date(Date.now() + trialDuration).toISOString();

        // Ativar teste para cada email
        for (const email of emails) {
            const user = userMap.get(email);

            if (user) {
                const userRef = window.firebaseDoc(window.firebaseDb, 'users', user.id);

                // Se usuário já é PRO pago (kiwify), não sobrescrever
                if (user.isPro && user.proActivatedBy === 'kiwify') {
                    console.log(`⏭️ Pulando ${email} - Já é PRO pago (Kiwify)`);
                    updated++;
                    continue;
                }

                await window.firebaseUpdateDoc(userRef, {
                    isPro: true,
                    proActivatedBy: 'trial',
                    proActivatedAt: new Date().toISOString(),
                    trialExpiresAt: trialExpiresAt
                });

                activated++;
                console.log(`🎁 Teste ativado para ${email} até ${new Date(trialExpiresAt).toLocaleString('pt-BR')}`);

            } else {
                // Usuário não existe - criar ativação pendente
                const pendingRef = window.firebaseCollection(window.firebaseDb, 'pending_activations');

                // Verificar se já existe ativação pendente
                const pendingQuery = window.firebaseQuery(
                    pendingRef,
                    window.firebaseWhere('email', '==', email)
                );
                const pendingSnap = await window.firebaseGetDocs(pendingQuery);

                if (pendingSnap.empty) {
                    // Adicionar nova ativação pendente
                    await window.firebaseAddDoc(pendingRef, {
                        email: email,
                        orderId: `TRIAL-${Date.now()}`,
                        orderRef: `TRIAL-${Date.now()}`,
                        trialExpiresAt: trialExpiresAt,
                        createdAt: new Date().toISOString(),
                        status: 'pending',
                        source: 'trial'
                    });
                }

                pending++;
                console.log(`⚠️ Teste pendente criado para ${email} (aguardando primeiro login)`);
            }
        }

        // Mensagem final
        let resultMessage = `✅ Teste grátis (3 dias) ativado!\n\n`;

        if (activated > 0) {
            resultMessage += `🎁 ${activated} usuários com teste ativo até ${new Date(trialExpiresAt).toLocaleDateString('pt-BR')}\n`;
        }

        if (pending > 0) {
            resultMessage += `⚠️ ${pending} testes pendentes (aguardando login)\n`;
        }

        if (updated > 0) {
            resultMessage += `⏭️ ${updated} usuários já PRO pagos (não alterados)`;
        }

        showToast(resultMessage, 'success');

        // Recarregar lista
        await loadUsers();

        // Limpar textarea
        document.getElementById('trialEmailList').value = '';

    } catch (error) {
        console.error('❌ Erro na ativação de testes:', error);
        showToast('❌ Erro ao ativar testes: ' + error.message, 'error');
    }
}

window.activateTrials = activateTrials;

// ========================================
// FILTRO DE BUSCA
// ========================================

function filterUsers() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();

    if (!searchTerm) {
        renderUsers(allUsers);
        return;
    }

    const filtered = allUsers.filter(user =>
        user.email.toLowerCase().includes(searchTerm) ||
        (user.displayName && user.displayName.toLowerCase().includes(searchTerm))
    );

    renderUsers(filtered);
}

window.filterUsers = filterUsers;

// ========================================
// TOAST NOTIFICATION
// ========================================

function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.style.background =
        type === 'success' ? '#10b981' :
        type === 'error' ? '#ef4444' :
        type === 'warning' ? '#f59e0b' :
        '#1f2937';

    toast.classList.add('show');

    setTimeout(() => {
        toast.classList.remove('show');
    }, 4000);
}

console.log('⚙️ Admin Panel v6.2.0 - Teste Grátis 3 Dias - by Nardoto');
