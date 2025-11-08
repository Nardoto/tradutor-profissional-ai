// ========================================
// SISTEMA DE PAGAMENTO KIWIFY
// Payment Manager for Kiwify Integration
// Version: 1.0.0
// Desenvolvido por: Nardoto
// ========================================

class PaymentManager {
    constructor() {
        console.log('💳 PaymentManager v1.0.0 - Kiwify Integration');

        // URL do produto Kiwify (VOCÊ VAI SUBSTITUIR PELA URL REAL)
        this.kiwifyCheckoutUrl = 'https://pay.kiwify.com.br/SEU_PRODUTO_ID';

        this.init();
    }

    init() {
        this.setupEventListeners();
        this.checkPaymentStatus();
    }

    setupEventListeners() {
        // Interceptar cliques em botões de upgrade
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-upgrade-pro')) {
                e.preventDefault();
                this.startCheckout();
            }
        });
    }

    startCheckout() {
        try {
            // Verificar se usuário está logado
            if (!window.authManager || !window.authManager.currentUser) {
                window.authManager.showToast('⚠️ Faça login primeiro para assinar o Plano PRO!', 'warning');
                return;
            }

            const user = window.authManager.currentUser;

            console.log('🛒 Iniciando checkout Kiwify para:', user.email);

            // Montar URL do checkout com email do usuário
            const checkoutUrl = `${this.kiwifyCheckoutUrl}?email=${encodeURIComponent(user.email)}`;

            // Abrir checkout em nova aba
            window.open(checkoutUrl, '_blank');

            // Mostrar mensagem de orientação
            this.showCheckoutInfo();

        } catch (error) {
            console.error('❌ Erro ao iniciar checkout:', error);
            window.authManager.showToast('❌ Erro ao abrir checkout. Tente novamente.', 'error');
        }
    }

    showCheckoutInfo() {
        const modal = `
            <div id="checkoutInfoModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.7); z-index: 10000; display: flex; align-items: center; justify-content: center;">
                <div style="background: white; border-radius: var(--radius-md); padding: 2rem; max-width: 480px; width: 90%; text-align: center;">
                    <div style="font-size: 3rem; margin-bottom: 1rem;">🛒</div>
                    <h2 style="color: var(--accent-primary); margin-bottom: 1rem;">Checkout Kiwify</h2>
                    <p style="color: var(--text-secondary); margin-bottom: 1.5rem;">
                        Você será redirecionado para a página de pagamento Kiwify.
                    </p>
                    <div style="background: linear-gradient(135deg, #667eea11 0%, #764ba211 100%); padding: 1.5rem; border-radius: var(--radius-sm); margin-bottom: 1.5rem; text-align: left;">
                        <p style="color: var(--text-secondary); font-size: 0.9rem; line-height: 1.6; margin: 0;">
                            ✅ <strong>Seu email já está preenchido</strong><br>
                            ✅ <strong>Após o pagamento, seu plano PRO será ativado automaticamente</strong><br>
                            ✅ <strong>Pode levar alguns segundos para ativar</strong><br>
                            ✅ <strong>Recarregue a página se necessário</strong>
                        </p>
                    </div>
                    <button onclick="document.getElementById('checkoutInfoModal').remove()" class="btn-primary" style="width: 100%; padding: 1rem;">
                        Entendi!
                    </button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modal);
    }

    checkPaymentStatus() {
        // Verificar se voltou do pagamento
        const urlParams = new URLSearchParams(window.location.search);
        const paymentStatus = urlParams.get('payment');

        if (paymentStatus === 'success') {
            this.handlePaymentSuccess();
            // Limpar URL
            window.history.replaceState({}, document.title, window.location.pathname);
        } else if (paymentStatus === 'error') {
            this.handlePaymentError();
            // Limpar URL
            window.history.replaceState({}, document.title, window.location.pathname);
        }
    }

    async handlePaymentSuccess() {
        console.log('✅ Pagamento aprovado! Verificando ativação...');

        // Mostrar modal de sucesso
        this.showSuccessModal();

        // Aguardar 3 segundos e verificar ativações pendentes
        setTimeout(async () => {
            await this.checkPendingActivation();
        }, 3000);
    }

    handlePaymentError() {
        console.log('❌ Erro no pagamento');
        window.authManager.showToast('❌ Houve um problema com o pagamento. Tente novamente.', 'error');
    }

    showSuccessModal() {
        const modal = `
            <div id="paymentSuccessModal" style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.8); z-index: 10000; display: flex; align-items: center; justify-content: center;">
                <div style="background: white; border-radius: var(--radius-md); padding: 2.5rem; max-width: 500px; width: 90%; text-align: center;">
                    <div style="font-size: 5rem; margin-bottom: 1rem;">🎉</div>
                    <h2 style="color: var(--accent-primary); margin-bottom: 1rem;">Pagamento Aprovado!</h2>
                    <p style="color: var(--text-secondary); margin-bottom: 2rem; font-size: 1.1rem;">
                        Bem-vindo ao <strong style="color: var(--accent-primary);">Plano PRO</strong>!
                    </p>
                    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 1.5rem; border-radius: var(--radius-sm); margin-bottom: 2rem; color: white;">
                        <p style="margin: 0; font-size: 1.1rem; font-weight: 600;">✨ Traduções Ilimitadas Ativadas!</p>
                    </div>
                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin-bottom: 1.5rem;">
                        Seu Plano PRO está sendo ativado agora...<br>
                        A página será recarregada automaticamente.
                    </p>
                    <button onclick="window.location.reload()" class="btn-primary" style="width: 100%; padding: 1rem;">
                        ⚡ Recarregar Agora
                    </button>
                </div>
            </div>
        `;
        document.body.insertAdjacentHTML('beforeend', modal);

        // Recarregar automaticamente após 5 segundos
        setTimeout(() => {
            window.location.reload();
        }, 5000);
    }

    async checkPendingActivation() {
        try {
            if (!window.authManager || !window.authManager.currentUser) {
                console.log('⚠️ Usuário não autenticado para verificar ativação');
                return;
            }

            console.log('🔍 Verificando ativações pendentes...');

            // Chamar Cloud Function para verificar ativações pendentes
            const checkPendingActivations = window.firebaseFunctions.httpsCallable('checkPendingActivations');
            const result = await checkPendingActivations();

            if (result.data.activated) {
                console.log('✅ Ativação pendente processada com sucesso!');
                // Recarregar stats do usuário
                await window.authManager.loadUserStats();
            } else {
                console.log('ℹ️ Nenhuma ativação pendente encontrada');
            }

        } catch (error) {
            console.error('❌ Erro ao verificar ativações pendentes:', error);
        }
    }
}

// Inicializar PaymentManager quando o DOM estiver pronto
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.paymentManager = new PaymentManager();
    });
} else {
    window.paymentManager = new PaymentManager();
}
