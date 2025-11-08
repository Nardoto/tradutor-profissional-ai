# 🥝 Integração Kiwify - Plano PRO Automático

Guia completo para integrar o Tradutor Profissional AI com a Kiwify e ativar o Plano PRO automaticamente quando o usuário pagar.

---

## 🎯 O Que Vamos Fazer

✅ Criar produto na Kiwify (Assinatura R$ 19,90/mês)
✅ Configurar webhook da Kiwify
✅ Criar Cloud Function para receber pagamentos
✅ Ativar PRO automaticamente quando pagar
✅ Cancelar PRO quando cancelar assinatura

---

## 📋 Pré-requisitos

- ✅ Conta na Kiwify ([https://app.kiwify.com.br](https://app.kiwify.com.br))
- ✅ Firebase configurado (você já tem!)
- ✅ Site publicado no GitHub Pages

---

## 🚀 PASSO 1: Criar Produto na Kiwify

### 1.1 Criar Conta na Kiwify

1. Acesse [https://app.kiwify.com.br](https://app.kiwify.com.br)
2. Clique em **"Criar conta grátis"**
3. Preencha seus dados
4. Confirme seu email

### 1.2 Criar Produto

1. No painel da Kiwify, clique em **"Produtos"** → **"Criar Produto"**
2. Preencha as informações:

**Informações Básicas:**
- **Nome do Produto:** Plano PRO - Tradutor Profissional AI
- **Tipo de Produto:** Assinatura
- **Descrição:**
  ```
  🚀 Plano PRO - Tradutor Profissional AI

  ✅ Traduções ilimitadas todos os dias
  ✅ Exportar TXT e SRT (legendas)
  ✅ Suporte prioritário
  ✅ Sem anúncios

  Acesso imediato após a confirmação do pagamento!
  ```

**Precificação:**
- **Valor:** R$ 19,90
- **Frequência:** Mensal
- **Oferta:** Assinatura recorrente

**Formas de Pagamento:**
- ✅ Cartão de Crédito
- ✅ PIX
- ✅ Boleto (opcional)

3. Clique em **"Salvar Produto"**

4. **COPIE o ID do Produto** (você vai precisar)
   - Exemplo: `prod_abc123xyz`

---

## 🚀 PASSO 2: Configurar Firebase Cloud Functions

### 2.1 Instalar Firebase CLI

```bash
# Instalar Firebase CLI globalmente
npm install -g firebase-tools

# Fazer login no Firebase
firebase login

# Navegar até o diretório do projeto
cd "c:\Users\tharc\Videos\documentario biblicos\GERADOR DE ROTEIROS\APP_DESENVOLVIMENTO\tradutor-biblico"

# Inicializar Functions
firebase init functions
```

**Selecione:**
- ✅ JavaScript
- ✅ ESLint: Yes
- ✅ Install dependencies: Yes

### 2.2 Criar Arquivo de Cloud Function

Crie o arquivo `functions/index.js` com o seguinte código:

```javascript
const functions = require('firebase-functions');
const admin = require('firebase-admin');
const crypto = require('crypto');

admin.initializeApp();

// ========================================
// WEBHOOK KIWIFY
// ========================================

exports.kiwifyWebhook = functions.https.onRequest(async (req, res) => {
    // Permitir CORS
    res.set('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(204).send('');
    }

    try {
        console.log('📥 Webhook recebido da Kiwify:', JSON.stringify(req.body, null, 2));

        const event = req.body;

        // Verificar tipo de evento
        switch (event.type) {
            case 'order.paid':
                await handleOrderPaid(event);
                break;

            case 'subscription.started':
                await handleSubscriptionStarted(event);
                break;

            case 'subscription.canceled':
                await handleSubscriptionCanceled(event);
                break;

            case 'subscription.overdue':
                await handleSubscriptionOverdue(event);
                break;

            default:
                console.log(`⚠️ Evento não tratado: ${event.type}`);
        }

        res.status(200).send('OK');
    } catch (error) {
        console.error('❌ Erro no webhook:', error);
        res.status(500).send('Error');
    }
});

// ========================================
// HANDLERS DE EVENTOS
// ========================================

// Quando uma compra é aprovada
async function handleOrderPaid(event) {
    try {
        const { Customer, Product } = event.data;
        const customerEmail = Customer.email;

        console.log(`💰 Pagamento aprovado para: ${customerEmail}`);

        // Buscar usuário no Firestore pelo email
        const usersRef = admin.firestore().collection('users');
        const snapshot = await usersRef.where('email', '==', customerEmail).get();

        if (snapshot.empty) {
            console.log(`⚠️ Usuário não encontrado no Firestore: ${customerEmail}`);
            console.log('💡 Usuário precisa fazer login no site primeiro!');
            return;
        }

        // Ativar PRO para o usuário
        snapshot.forEach(async (doc) => {
            await doc.ref.update({
                isPro: true,
                proActivatedAt: admin.firestore.FieldValue.serverTimestamp(),
                proActivatedBy: 'kiwify',
                kiwifyOrderId: event.data.order_id,
                kiwifyCustomerId: Customer.id,
                kiwifyProductId: Product.id,
                proExpiresAt: getNextMonthDate()
            });

            console.log(`✅ Plano PRO ativado para: ${customerEmail}`);
        });

    } catch (error) {
        console.error('Erro ao processar pagamento:', error);
    }
}

// Quando uma assinatura é iniciada
async function handleSubscriptionStarted(event) {
    console.log('🔄 Assinatura iniciada:', event.data.subscription_id);
    await handleOrderPaid(event); // Mesmo tratamento
}

// Quando uma assinatura é cancelada
async function handleSubscriptionCanceled(event) {
    try {
        const { Customer } = event.data;
        const customerEmail = Customer.email;

        console.log(`❌ Assinatura cancelada para: ${customerEmail}`);

        // Buscar usuário no Firestore
        const usersRef = admin.firestore().collection('users');
        const snapshot = await usersRef.where('email', '==', customerEmail).get();

        if (snapshot.empty) {
            console.log(`⚠️ Usuário não encontrado: ${customerEmail}`);
            return;
        }

        // Desativar PRO
        snapshot.forEach(async (doc) => {
            await doc.ref.update({
                isPro: false,
                proCanceledAt: admin.firestore.FieldValue.serverTimestamp(),
                proCanceledBy: 'kiwify'
            });

            console.log(`🔴 Plano PRO cancelado para: ${customerEmail}`);
        });

    } catch (error) {
        console.error('Erro ao cancelar assinatura:', error);
    }
}

// Quando uma assinatura está atrasada
async function handleSubscriptionOverdue(event) {
    console.log('⚠️ Assinatura atrasada:', event.data.subscription_id);
    // Você pode implementar lógica de aviso ao usuário
}

// ========================================
// FUNÇÕES AUXILIARES
// ========================================

function getNextMonthDate() {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return admin.firestore.Timestamp.fromDate(date);
}

// ========================================
// ENDPOINT PARA CRIAR LINK DE PAGAMENTO
// ========================================

exports.createCheckoutLink = functions.https.onRequest(async (req, res) => {
    // Permitir CORS
    res.set('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(204).send('');
    }

    try {
        const { userId, email, displayName } = req.body;

        // ID do seu produto na Kiwify (SUBSTITUA PELO SEU!)
        const KIWIFY_PRODUCT_ID = 'SEU_PRODUCT_ID_AQUI';

        // Link de checkout da Kiwify
        const checkoutUrl = `https://pay.kiwify.com.br/${KIWIFY_PRODUCT_ID}?email=${encodeURIComponent(email)}&name=${encodeURIComponent(displayName)}`;

        console.log(`🔗 Link de checkout criado para: ${email}`);

        res.json({
            success: true,
            checkoutUrl: checkoutUrl
        });

    } catch (error) {
        console.error('Erro ao criar link:', error);
        res.status(500).json({ error: error.message });
    }
});
```

### 2.3 Editar package.json das Functions

Em `functions/package.json`, adicione as dependências:

```json
{
  "name": "functions",
  "description": "Cloud Functions for Firebase",
  "scripts": {
    "serve": "firebase emulators:start --only functions",
    "shell": "firebase functions:shell",
    "start": "npm run shell",
    "deploy": "firebase deploy --only functions",
    "logs": "firebase functions:log"
  },
  "engines": {
    "node": "18"
  },
  "main": "index.js",
  "dependencies": {
    "firebase-admin": "^11.8.0",
    "firebase-functions": "^4.3.1"
  },
  "devDependencies": {
    "eslint": "^8.15.0",
    "eslint-config-google": "^0.14.0",
    "firebase-functions-test": "^3.1.0"
  },
  "private": true
}
```

### 2.4 Deploy das Functions

```bash
# Fazer deploy das functions
firebase deploy --only functions
```

Após o deploy, você receberá as URLs:
- `https://YOUR_REGION-tradutor-profissional-ai.cloudfunctions.net/kiwifyWebhook`
- `https://YOUR_REGION-tradutor-profissional-ai.cloudfunctions.net/createCheckoutLink`

**COPIE essas URLs!** Você vai precisar.

---

## 🚀 PASSO 3: Configurar Webhook na Kiwify

### 3.1 Adicionar Webhook

1. No painel da Kiwify, vá em **"Configurações"** → **"Webhooks"**
2. Clique em **"Adicionar Webhook"**
3. Preencha:
   - **URL:** `https://YOUR_REGION-tradutor-profissional-ai.cloudfunctions.net/kiwifyWebhook`
   - **Eventos:** Selecione todos relacionados a pagamento e assinatura:
     - ✅ order.paid
     - ✅ subscription.started
     - ✅ subscription.canceled
     - ✅ subscription.overdue
4. Clique em **"Salvar"**

### 3.2 Testar Webhook

1. Na Kiwify, vá em **"Webhooks"** → Clique nos 3 pontinhos → **"Testar"**
2. Selecione evento **"order.paid"**
3. Clique em **"Enviar Teste"**
4. Verifique se chegou no Firebase Functions Log:
   ```bash
   firebase functions:log
   ```

---

## 🚀 PASSO 4: Criar Botão de Pagamento no Site

### 4.1 Criar arquivo `payment.js`

Crie o arquivo `payment.js`:

```javascript
// ========================================
// SISTEMA DE PAGAMENTO KIWIFY
// Payment Manager v1.0.0
// Desenvolvido por: Nardoto
// ========================================

class PaymentManager {
    constructor() {
        console.log('💳 PaymentManager v1.0.0 - Kiwify Integration');

        // URL da Cloud Function (SUBSTITUA PELA SUA!)
        this.cloudFunctionUrl = 'https://YOUR_REGION-tradutor-profissional-ai.cloudfunctions.net/createCheckoutLink';

        this.setupEventListeners();
    }

    setupEventListeners() {
        // Interceptar cliques nos botões de upgrade
        document.addEventListener('click', (e) => {
            if (e.target.closest('.btn-upgrade-pro') ||
                e.target.id === 'upgradeButton') {
                e.preventDefault();
                this.initCheckout();
            }
        });
    }

    async initCheckout() {
        try {
            // Verificar se usuário está logado
            if (!window.authManager || !window.authManager.currentUser) {
                window.authManager.showToast('⚠️ Faça login primeiro!', 'warning');
                return;
            }

            const user = window.authManager.currentUser;

            // Mostrar loading
            window.authManager.showToast('⏳ Gerando link de pagamento...', 'info');

            // Criar link de checkout
            const response = await fetch(this.cloudFunctionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    userId: user.uid,
                    email: user.email,
                    displayName: user.displayName || user.email
                })
            });

            const data = await response.json();

            if (data.success && data.checkoutUrl) {
                // Redirecionar para página de pagamento da Kiwify
                window.location.href = data.checkoutUrl;
            } else {
                throw new Error('Erro ao gerar link de pagamento');
            }

        } catch (error) {
            console.error('❌ Erro ao iniciar checkout:', error);
            window.authManager.showToast('❌ Erro ao processar. Tente novamente.', 'error');
        }
    }
}

// Inicializar PaymentManager
window.paymentManager = new PaymentManager();
console.log('✅ PaymentManager carregado');
```

### 4.2 Adicionar script no index.html

No final do `index.html`, antes de `</body>`:

```html
<!-- Scripts -->
<script src="auth.js?v=3.0.0"></script>
<script src="translator.js?v=3.0.0"></script>
<script src="payment.js?v=1.0.0"></script> <!-- NOVO -->
</body>
</html>
```

### 4.3 Atualizar Botões de Upgrade

Edite `auth.js`, função `showLimitReachedModal()`:

```javascript
<button class="btn-primary btn-upgrade-pro" style="width: 100%; padding: 1rem; margin-bottom: 0.5rem;">
    ⭐ Assinar Plano PRO - R$ 19,90/mês
</button>
```

---

## 🚀 PASSO 5: Configurar URLs de Retorno

### 5.1 Criar Páginas de Sucesso/Erro

Na Kiwify, configure as URLs de retorno:

1. Vá em **"Produtos"** → Editar seu produto
2. Em **"URLs de Redirecionamento"**:
   - **Sucesso:** `https://nardoto.com.br/tradutor-profissional-ai/?payment=success`
   - **Erro:** `https://nardoto.com.br/tradutor-profissional-ai/?payment=error`

### 5.2 Tratar Retorno no Site

No `index.html`, adicione no final do `<body>`:

```html
<script>
// Verificar parâmetro de retorno do pagamento
const urlParams = new URLSearchParams(window.location.search);
const paymentStatus = urlParams.get('payment');

if (paymentStatus === 'success') {
    setTimeout(() => {
        if (window.authManager) {
            window.authManager.showToast('🎉 Pagamento confirmado! Seu Plano PRO está sendo ativado...', 'success');

            // Recarregar stats do usuário após 3 segundos
            setTimeout(() => {
                window.authManager.loadUserStats();
            }, 3000);
        }
    }, 1000);

    // Limpar URL
    window.history.replaceState({}, document.title, window.location.pathname);
}

if (paymentStatus === 'error') {
    setTimeout(() => {
        if (window.authManager) {
            window.authManager.showToast('❌ Pagamento não aprovado. Tente novamente.', 'error');
        }
    }, 1000);

    // Limpar URL
    window.history.replaceState({}, document.title, window.location.pathname);
}
</script>
```

---

## 🧪 PASSO 6: Testar o Sistema Completo

### 6.1 Teste de Compra

1. **Faça login no site** com uma conta de teste
2. **Clique em "Upgrade para PRO"**
3. **Você será redirecionado** para a página de pagamento da Kiwify
4. **Use um cartão de teste** (Kiwify tem modo sandbox)
5. **Confirme o pagamento**
6. **Você será redirecionado** de volta para o site
7. **O webhook ativará o PRO** automaticamente

### 6.2 Verificar no Firebase

1. Acesse Firebase Console → Firestore Database
2. Vá na coleção `users`
3. Encontre seu usuário
4. Verifique se `isPro: true`

### 6.3 Verificar Logs

```bash
# Ver logs das Cloud Functions
firebase functions:log

# Filtrar apenas webhook
firebase functions:log --only kiwifyWebhook
```

---

## 📊 Dados que a Kiwify Envia

Exemplo de webhook `order.paid`:

```json
{
  "type": "order.paid",
  "data": {
    "order_id": "ord_abc123",
    "Customer": {
      "id": "cus_xyz789",
      "email": "joao@gmail.com",
      "full_name": "João Silva"
    },
    "Product": {
      "id": "prod_def456",
      "name": "Plano PRO - Tradutor AI"
    },
    "amount": 1990,
    "created_at": "2025-01-08T10:00:00Z"
  }
}
```

---

## 💰 Taxas da Kiwify

- **Plano Free:** 9,9% + R$ 0,99 por transação
- **Plano Pro:** 5,9% + R$ 0,99 por transação (R$ 49/mês)
- **Plano Business:** 4,9% + R$ 0,99 por transação (R$ 149/mês)

**Exemplo com Plano Free:**
- Venda: R$ 19,90
- Taxa Kiwify: R$ 2,96
- **Você recebe: R$ 16,94**

---

## 🔒 Segurança

### Validar Webhook (Opcional mas Recomendado)

A Kiwify envia um header `X-Kiwify-Signature` para validar que o webhook é legítimo:

```javascript
// No início da função kiwifyWebhook
const signature = req.headers['x-kiwify-signature'];
const SECRET = 'SUA_SECRET_KEY_DA_KIWIFY'; // Pegar na Kiwify

// Validar signature
const hash = crypto
    .createHmac('sha256', SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');

if (hash !== signature) {
    console.log('⚠️ Webhook inválido!');
    return res.status(401).send('Unauthorized');
}
```

---

## 📋 Checklist Final

- [ ] Produto criado na Kiwify
- [ ] Firebase Functions deployadas
- [ ] Webhook configurado na Kiwify
- [ ] payment.js criado e adicionado ao site
- [ ] Botões de upgrade atualizados
- [ ] URLs de retorno configuradas
- [ ] Testado com compra real/sandbox
- [ ] Verificado ativação no Firestore

---

## 🎯 Fluxo Completo

```
1. Usuário clica "Upgrade para PRO"
   ↓
2. payment.js cria link de checkout
   ↓
3. Usuário é redirecionado para Kiwify
   ↓
4. Usuário paga (PIX, Cartão, Boleto)
   ↓
5. Kiwify envia webhook para Cloud Function
   ↓
6. Cloud Function ativa isPro: true no Firestore
   ↓
7. Usuário volta para o site
   ↓
8. Site mostra "Plano PRO Ativado!" 🎉
```

---

## 🆘 Problemas Comuns

### "Webhook não está sendo recebido"
- Verifique se a URL está correta
- Veja logs: `firebase functions:log`
- Teste manualmente na Kiwify

### "Usuário não encontrado no Firestore"
- Usuário precisa fazer login no site ANTES de pagar
- Assim ele será criado no Firestore

### "PRO não ativa automaticamente"
- Verifique se o email do pagamento é o mesmo do login
- Veja logs da Cloud Function

---

**Desenvolvido por Nardoto** | Powered by Kiwify & Firebase
