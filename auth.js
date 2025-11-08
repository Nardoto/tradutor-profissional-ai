// ========================================
// SISTEMA DE AUTENTICAÇÃO FIREBASE
// Firebase Authentication Manager
// Version: 3.0.0
// Desenvolvido por: Nardoto
// ========================================

class AuthManager {
    constructor() {
        console.log('🔐 AuthManager v3.0.0 - by Nardoto');

        this.currentUser = null;
        this.userStats = {
            translationsToday: 0,
            translationsLimit: 50,
            isPro: false,
            lastReset: new Date().toDateString()
        };

        this.init();
    }

    init() {
        // Aguardar Firebase estar pronto
        setTimeout(() => {
            this.setupFirebaseAuth();
            this.setupEventListeners();
        }, 500);
    }

    setupFirebaseAuth() {
        if (!window.firebaseAuth || !window.firebaseOnAuthStateChanged) {
            console.error('❌ Firebase não está carregado!');
            this.showLoginScreen();
            return;
        }

        // Monitorar estado de autenticação
        window.firebaseOnAuthStateChanged(window.firebaseAuth, async (user) => {
            if (user) {
                console.log('✅ Usuário autenticado:', user.email);
                this.currentUser = user;
                await this.loadUserStats();
                this.hideLoginScreen();
                this.showUserProfile();
            } else {
                console.log('❌ Usuário não autenticado');
                this.currentUser = null;
                this.showLoginScreen();
                this.hideUserProfile();
            }
        });
    }

    setupEventListeners() {
        // Botão de login com Google
        const googleLoginBtn = document.getElementById('googleLoginButton');
        if (googleLoginBtn) {
            googleLoginBtn.addEventListener('click', () => this.loginWithGoogle());
        }

        // Botão de logout
        const logoutBtn = document.getElementById('logoutButton');
        if (logoutBtn) {
            logoutBtn.addEventListener('click', () => this.logout());
        }

        // Toggle menu do usuário
        const profileBtn = document.getElementById('userProfileButton');
        if (profileBtn) {
            profileBtn.addEventListener('click', () => this.toggleUserMenu());
        }

        // Botão de upgrade
        const upgradeBtn = document.getElementById('upgradeButton');
        if (upgradeBtn) {
            upgradeBtn.addEventListener('click', () => this.showUpgradeModal());
        }

        // Fechar menu ao clicar fora
        document.addEventListener('click', (e) => {
            const menu = document.getElementById('userDropdownMenu');
            const profileBtn = document.getElementById('userProfileButton');

            if (menu && profileBtn && !menu.contains(e.target) && !profileBtn.contains(e.target)) {
                menu.style.display = 'none';
            }
        });
    }

    async loginWithGoogle() {
        try {
            const provider = window.firebaseProvider;
            const result = await window.firebaseSignInWithPopup(window.firebaseAuth, provider);

            console.log('✅ Login bem-sucedido:', result.user.email);

            // Criar ou atualizar documento do usuário
            await this.createOrUpdateUserDocument(result.user);

            this.showToast('✅ Login realizado com sucesso!', 'success');
        } catch (error) {
            console.error('❌ Erro no login:', error);

            if (error.code === 'auth/popup-closed-by-user') {
                this.showToast('⚠️ Login cancelado', 'warning');
            } else {
                this.showToast('❌ Erro ao fazer login. Tente novamente.', 'error');
            }
        }
    }

    async logout() {
        try {
            await window.firebaseSignOut(window.firebaseAuth);
            this.showToast('✅ Logout realizado com sucesso!', 'success');
        } catch (error) {
            console.error('❌ Erro no logout:', error);
            this.showToast('❌ Erro ao fazer logout', 'error');
        }
    }

    async createOrUpdateUserDocument(user) {
        const userRef = window.firebaseDoc(window.firebaseDb, 'users', user.uid);
        const userSnap = await window.firebaseGetDoc(userRef);

        const userData = {
            email: user.email,
            displayName: user.displayName,
            photoURL: user.photoURL,
            lastLogin: new Date().toISOString(),
        };

        if (!userSnap.exists()) {
            // Criar novo usuário
            await window.firebaseSetDoc(userRef, {
                ...userData,
                createdAt: new Date().toISOString(),
                isPro: false,
                translationsToday: 0,
                lastReset: new Date().toDateString()
            });
            console.log('✅ Novo usuário criado no Firestore');
        } else {
            // Atualizar último login
            await window.firebaseUpdateDoc(userRef, userData);
            console.log('✅ Dados do usuário atualizados');
        }
    }

    async loadUserStats() {
        if (!this.currentUser) return;

        try {
            const userRef = window.firebaseDoc(window.firebaseDb, 'users', this.currentUser.uid);
            const userSnap = await window.firebaseGetDoc(userRef);

            if (userSnap.exists()) {
                const data = userSnap.data();
                const today = new Date().toDateString();

                // Reset contador se mudou o dia
                if (data.lastReset !== today) {
                    await window.firebaseUpdateDoc(userRef, {
                        translationsToday: 0,
                        lastReset: today
                    });
                    this.userStats.translationsToday = 0;
                } else {
                    this.userStats.translationsToday = data.translationsToday || 0;
                }

                this.userStats.isPro = data.isPro || false;
                this.userStats.translationsLimit = data.isPro ? 999999 : 50;

                this.updateUserStatsUI();
            }
        } catch (error) {
            console.error('❌ Erro ao carregar stats:', error);
        }
    }

    async incrementTranslationCount() {
        if (!this.currentUser) return false;

        try {
            const userRef = window.firebaseDoc(window.firebaseDb, 'users', this.currentUser.uid);

            await window.firebaseUpdateDoc(userRef, {
                translationsToday: window.firebaseIncrement(1)
            });

            this.userStats.translationsToday++;
            this.updateUserStatsUI();

            return true;
        } catch (error) {
            console.error('❌ Erro ao incrementar contador:', error);
            return false;
        }
    }

    canTranslate() {
        if (!this.currentUser) {
            this.showToast('⚠️ Faça login para traduzir', 'warning');
            return false;
        }

        if (this.userStats.isPro) {
            return true;
        }

        if (this.userStats.translationsToday >= this.userStats.translationsLimit) {
            this.showLimitReachedModal();
            return false;
        }

        return true;
    }

    updateUserStatsUI() {
        // Atualizar barra de progresso
        const usageBar = document.getElementById('usageBar');
        const usedEl = document.getElementById('translationsUsed');

        if (usageBar && usedEl) {
            const percentage = (this.userStats.translationsToday / this.userStats.translationsLimit) * 100;
            usageBar.style.width = Math.min(percentage, 100) + '%';
            usedEl.textContent = this.userStats.translationsToday;
        }
    }

    showUserProfile() {
        if (!this.currentUser) return;

        const profileBtn = document.getElementById('userProfileButton');
        const avatar = document.getElementById('userAvatar');
        const name = document.getElementById('userName');
        const plan = document.getElementById('userPlan');

        if (profileBtn) {
            profileBtn.style.display = 'flex';

            if (avatar) avatar.src = this.currentUser.photoURL || '';
            if (name) name.textContent = this.currentUser.displayName || this.currentUser.email;
            if (plan) plan.textContent = this.userStats.isPro ? 'Plano PRO' : 'Plano Grátis';
        }
    }

    hideUserProfile() {
        const profileBtn = document.getElementById('userProfileButton');
        if (profileBtn) {
            profileBtn.style.display = 'none';
        }
    }

    toggleUserMenu() {
        const menu = document.getElementById('userDropdownMenu');
        if (menu) {
            menu.style.display = menu.style.display === 'none' ? 'block' : 'none';
        }
    }

    showLoginScreen() {
        const loginScreen = document.getElementById('loginScreen');
        if (loginScreen) {
            loginScreen.style.display = 'flex';
        }
    }

    hideLoginScreen() {
        const loginScreen = document.getElementById('loginScreen');
        if (loginScreen) {
            loginScreen.style.display = 'none';
        }
    }

    showLimitReachedModal() {
        const modal = `
            <div id="limitModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center;">
                <div style="background: white; border-radius: var(--radius-md); padding: 2rem; max-width: 480px; width: 90%; text-align: center;">
                    <div style="font-size: 4rem; margin-bottom: 1rem;">⚠️</div>
                    <h2 style="color: var(--accent-primary); margin-bottom: 1rem;">Limite Diário Atingido</h2>
                    <p style="color: var(--text-secondary); margin-bottom: 2rem;">
                        Você usou todas as <strong>50 traduções gratuitas</strong> de hoje.
                        Volte amanhã ou faça upgrade para o Plano PRO!
                    </p>
                    <div style="background: linear-gradient(135deg, #667eea11 0%, #764ba211 100%); padding: 1.5rem; border-radius: var(--radius-sm); margin-bottom: 2rem;">
                        <h3 style="color: var(--accent-primary); margin: 0 0 1rem 0;">⭐ Plano PRO - R$ 19,90/mês</h3>
                        <ul style="text-align: left; padding-left: 1.5rem; color: var(--text-secondary); font-size: 0.9rem; line-height: 1.8;">
                            <li><strong>Traduções ilimitadas</strong> todos os dias</li>
                            <li><strong>Histórico</strong> de todas as traduções</li>
                            <li><strong>Suporte prioritário</strong></li>
                            <li><strong>Sem anúncios</strong> (futuro)</li>
                        </ul>
                    </div>
                    <button onclick="window.paymentManager.startCheckout(); document.getElementById('limitModal').remove();" class="btn-primary btn-upgrade-pro" style="width: 100%; padding: 1rem; margin-bottom: 0.5rem;">
                        ⭐ Fazer Upgrade Agora
                    </button>
                    <button onclick="document.getElementById('limitModal').remove()" class="btn-secondary" style="width: 100%; padding: 1rem;">
                        Voltar
                    </button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modal);
    }

    showUpgradeModal() {
        // Iniciar checkout do Kiwify
        if (window.paymentManager) {
            window.paymentManager.startCheckout();
        } else {
            this.showToast('⚠️ Sistema de pagamento carregando... Tente novamente em instantes.', 'warning');
        }

        // Fechar menu
        const menu = document.getElementById('userDropdownMenu');
        if (menu) menu.style.display = 'none';
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) return;

        toast.textContent = message;
        toast.className = 'toast show ' + type;

        setTimeout(() => {
            toast.classList.remove('show');
        }, 4000);
    }
}

// Inicializar AuthManager quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.authManager = new AuthManager();
    });
} else {
    window.authManager = new AuthManager();
}
