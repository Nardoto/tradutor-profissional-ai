// ========================================
// PAINEL DE ADMINISTRAÇÃO
// Admin Panel for Managing PRO Users
// Version: 1.0.0
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

// Verificar resultado do redirect (quando volta do Google)
window.firebaseGetRedirectResult(window.firebaseAuth).then((result) => {
    if (result && result.user) {
        console.log('Login via redirect bem-sucedido');
    }
}).catch((error) => {
    console.error('Erro no redirect:', error);
    showToast('❌ Erro no login. Tente novamente.', 'error');
});

window.firebaseOnAuthStateChanged(window.firebaseAuth, (user) => {
    if (user) {
        // Verificar se é admin (pode ser qualquer email da lista)
        if (ADMIN_EMAILS.includes(user.email)) {
            currentUser = user;
            showAdminPanel();
            loadUsers();
        } else {
            showToast('❌ Acesso negado! Apenas administradores podem acessar.', 'error');
            logout();
        }
    } else {
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

function loginWithGoogle() {
    try {
        // Usar redirect ao invés de popup (funciona melhor com CORS)
        window.firebaseSignInWithRedirect(window.firebaseAuth, window.firebaseProvider);
    } catch (error) {
        console.error('Erro no login:', error);
        showToast('❌ Erro ao fazer login', 'error');
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

    userList.innerHTML = users.map(user => `
        <div class="user-item" data-email="${user.email}">
            <div class="user-info">
                <div class="user-email">
                    ${user.email}
                    <span class="badge ${user.isPro ? 'badge-pro' : 'badge-free'}">
                        ${user.isPro ? 'PRO' : 'GRÁTIS'}
                    </span>
                </div>
                <div class="user-status">
                    ${user.displayName || 'Sem nome'} •
                    ${user.translationsToday || 0} traduções hoje •
                    Criado em ${formatDate(user.createdAt)}
                </div>
            </div>
            <div class="user-actions">
                ${user.isPro ?
                    `<button onclick="togglePro('${user.id}', '${user.email}', false)" class="btn btn-danger btn-sm">Desativar PRO</button>` :
                    `<button onclick="togglePro('${user.id}', '${user.email}', true)" class="btn btn-success btn-sm">Ativar PRO</button>`
                }
            </div>
        </div>
    `).join('');
}

function formatDate(dateString) {
    if (!dateString) return 'Data desconhecida';
    const date = new Date(dateString);
    return date.toLocaleDateString('pt-BR');
}

// ========================================
// ATIVAR/DESATIVAR PRO
// ========================================

async function togglePro(userId, email, activate) {
    const action = activate ? 'ativar' : 'desativar';

    if (!confirm(`Tem certeza que deseja ${action} PRO para ${email}?`)) {
        return;
    }

    try {
        const userRef = window.firebaseDoc(window.firebaseDb, 'users', userId);

        await window.firebaseUpdateDoc(userRef, {
            isPro: activate,
            proActivatedBy: activate ? 'admin_manual' : null,
            proActivatedAt: activate ? new Date().toISOString() : null
        });

        showToast(`✅ PRO ${activate ? 'ativado' : 'desativado'} para ${email}!`, 'success');

        // Recarregar lista
        await loadUsers();
    } catch (error) {
        console.error('Erro ao atualizar usuário:', error);
        showToast(`❌ Erro ao ${action} PRO`, 'error');
    }
}

window.togglePro = togglePro;

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

console.log('⚙️ Admin Panel v1.0.0 - by Nardoto');
