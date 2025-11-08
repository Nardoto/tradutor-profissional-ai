# Tradutor Profissional AI

Tradutor especializado em textos religiosos e roteiros de documentários bíblicos - Powered by Google Gemini AI

## Recursos

### Sistema de Pagamento Integrado (Kiwify)
- Plano GRÁTIS: 3 traduções por dia
- Plano PRO: Traduções ilimitadas
- Integração automática com Kiwify
- Ativação instantânea via webhook

### Gerenciamento de Usuários
- Autenticação com Google
- Painel administrativo para gerenciar usuários PRO
- Ativação manual e em massa de planos PRO
- Estatísticas de uso em tempo real

### Traduções Profissionais
- Powered by Google Gemini AI
- Especializado em textos bíblicos e religiosos
- Interface intuitiva com preview em tempo real
- Histórico de traduções

---

## Configuração do Sistema

### 1. Webhook Kiwify

Para receber notificações de pagamento automáticas, configure o webhook no painel Kiwify:

**URL do Webhook:**
```
https://us-central1-tradutor-profissional-ai.cloudfunctions.net/kiwifyWebhook
```

**Como configurar:**
1. Acesse seu produto no [Kiwify](https://dashboard.kiwify.com.br/)
2. Vá em Configurações > Webhooks
3. Adicione a URL acima
4. Selecione os eventos:
   - `order.paid` (Pagamento aprovado)
   - `subscription.canceled` (Assinatura cancelada)
   - `subscription.expired` (Assinatura expirada)
   - `order.refunded` (Pedido reembolsado)
5. Salve as configurações

### 2. URL do Produto Kiwify

Atualizar a URL do produto em [payment.js:13](payment.js#L13):
```javascript
this.kiwifyCheckoutUrl = 'https://pay.kiwify.com.br/NtnupLV';
```

### 3. Painel Administrativo

Acesse o painel em: `https://nardoto.com.br/admin.html`

**Administradores autorizados:**
- tharcisionardoto@gmail.com
- nardotoengenharia@gmail.com

Para adicionar mais administradores, edite [admin.js:12-15](admin.js#L12-L15):
```javascript
const ADMIN_EMAILS = [
    'tharcisionardoto@gmail.com',
    'nardotoengenharia@gmail.com',
    'novo-admin@gmail.com'  // Adicione aqui
];
```

---

## Estrutura do Projeto

```
tradutor-biblico/
├── index.html              # Página principal do tradutor
├── admin.html              # Painel administrativo
├── styles.css              # Estilos globais
├── auth.js                 # Sistema de autenticação
├── translator.js           # Lógica de tradução
├── payment.js              # Integração Kiwify
├── admin.js                # Lógica do painel admin
├── functions/              # Cloud Functions
│   ├── index.js           # Webhook e ativações pendentes
│   └── package.json       # Dependências
├── firebase.json           # Configuração Firebase
└── README.md              # Documentação
```

---

## Deploy

### Primeiro Deploy
```bash
# Instalar dependências
cd functions
npm install

# Fazer login no Firebase
firebase login

# Selecionar projeto
firebase use tradutor-profissional-ai

# Deploy completo
firebase deploy
```

### Deploy apenas das Functions
```bash
firebase deploy --only functions
```

### Deploy apenas do Hosting
```bash
firebase deploy --only hosting
```

---

## Fluxo de Pagamento

### Caso 1: Usuário já tem conta
1. Usuário clica em "Upgrade para PRO"
2. É redirecionado para checkout Kiwify (email pré-preenchido)
3. Completa o pagamento
4. Webhook `kiwifyWebhook` recebe notificação `order.paid`
5. Function busca usuário no Firestore pelo email
6. Ativa campo `isPro: true` no usuário
7. Usuário recebe acesso PRO instantaneamente

### Caso 2: Usuário ainda não tem conta
1. Cliente compra no Kiwify diretamente
2. Webhook `kiwifyWebhook` recebe `order.paid`
3. Não encontra usuário no Firestore
4. Cria registro em `pending_activations` collection
5. Quando cliente faz login pela primeira vez no site
6. Function `checkPendingActivations` é chamada
7. Encontra ativação pendente pelo email
8. Ativa PRO automaticamente
9. Marca ativação como processada

---

## Monitoramento

### Ver logs das Functions
```bash
firebase functions:log
```

### Ver logs de uma function específica
```bash
firebase functions:log --only kiwifyWebhook
firebase functions:log --only checkPendingActivations
```

### Testar localmente
```bash
firebase emulators:start --only functions
```

---

## Segurança

### Domínios Autorizados
Configure os domínios autorizados no Firebase Console:
1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Selecione o projeto `tradutor-profissional-ai`
3. Vá em Authentication > Settings > Authorized domains
4. Adicione: `nardoto.com.br`

### Regras do Firestore
As regras de segurança estão configuradas para:
- Usuários podem ler apenas seus próprios dados
- Apenas Cloud Functions podem escrever em `users`
- Admins podem ler todos os dados

---

## Suporte

Desenvolvido por: **Nardoto**
- Email: tharcisionardoto@gmail.com
- Email: nardotoengenharia@gmail.com

---

## Changelog

### v1.0.0 (2025-01-08)
- Sistema de autenticação com Google
- Integração completa com Kiwify
- Painel administrativo funcional
- Ativação automática via webhook
- Suporte a ativações pendentes
