# Tradutor Profissional AI - Painel de Licenças

## LINKS RÁPIDOS (clique para abrir)

| O que | URL |
|-------|-----|
| **Site ao vivo** | https://tradutor-profissional-ai.web.app |
| **Admin Panel** | https://tradutor-profissional-ai.web.app/admin.html |
| **Firebase Console** | https://console.firebase.google.com/project/tradutor-profissional-ai |
| **Hosting (Deploys)** | https://console.firebase.google.com/project/tradutor-profissional-ai/hosting |
| **Firestore (Banco)** | https://console.firebase.google.com/project/tradutor-profissional-ai/firestore |
| **Functions (Webhooks)** | https://console.firebase.google.com/project/tradutor-profissional-ai/functions |
| **Authentication** | https://console.firebase.google.com/project/tradutor-profissional-ai/authentication |

---

## COMANDOS ESSENCIAIS

### Publicar alterações no site (Deploy)
```bash
firebase deploy --only hosting
```

### Publicar alterações nas Cloud Functions
```bash
firebase deploy --only functions
```

### Publicar TUDO (hosting + functions)
```bash
firebase deploy
```

### Ver logs das Functions
```bash
firebase functions:log
```

### Salvar no Git
```bash
git add .
git commit -m "Descrição da mudança"
git push
```

---

## FLUXO DE TRABALHO

### Para editar e publicar:
1. Abra esta pasta no VSCode
2. Edite os arquivos desejados
3. Salve as alterações (Ctrl+S)
4. Abra o terminal (Ctrl+`)
5. Rode: `firebase deploy --only hosting`
6. Pronto! Site atualizado em ~30 segundos

### Importante:
- **Alterações NÃO vão automaticamente pro site**
- **Você precisa rodar `firebase deploy` após cada mudança**
- Git é só para backup/versionamento (não publica)

---

## ESTRUTURA DE ARQUIVOS

```
tradutor-licencas/
├── index.html        # Página principal do tradutor (usuários)
├── admin.html        # Painel de administração de licenças
├── admin.js          # Lógica do painel admin
├── auth.js           # Sistema de autenticação Firebase
├── translator.js     # Lógica de tradução (Gemini AI)
├── payment.js        # Integração com Kiwify
├── styles.css        # Estilos visuais
├── firebase.json     # Configuração do Firebase
├── .firebaserc       # Projeto Firebase selecionado
├── firestore.rules   # Regras de segurança do banco
└── functions/        # Cloud Functions (webhooks)
    ├── index.js      # Código das functions
    └── package.json  # Dependências Node.js
```

---

## ADMINISTRADORES AUTORIZADOS

Edite em `admin.js` linhas 12-15:
```javascript
const ADMIN_EMAILS = [
    'tharcisionardoto@gmail.com',
    'nardotoengenharia@gmail.com'
];
```

---

## WEBHOOK KIWIFY

**URL para configurar no Kiwify:**
```
https://us-central1-tradutor-profissional-ai.cloudfunctions.net/kiwifyWebhook
```

**Eventos a selecionar:**
- `order.paid` - Pagamento aprovado
- `subscription.canceled` - Assinatura cancelada
- `subscription.expired` - Assinatura expirada
- `order.refunded` - Pedido reembolsado

---

## CREDENCIAIS FIREBASE (já configuradas)

```javascript
const firebaseConfig = {
    apiKey: "AIzaSyBQPGu8l-JQqjHRubcAcYeUK7aIgH7vPIE",
    authDomain: "tradutor-profissional-ai.firebaseapp.com",
    projectId: "tradutor-profissional-ai",
    storageBucket: "tradutor-profissional-ai.firebasestorage.app",
    messagingSenderId: "943297790089",
    appId: "1:943297790089:web:75c2fa533bbe1310d2c658"
};
```

---

## FLUXO DE PAGAMENTO

### Usuário já tem conta:
1. Clica em "Upgrade para PRO"
2. Paga no Kiwify
3. Webhook ativa automaticamente
4. Usuário vira PRO instantaneamente

### Usuário novo (sem conta):
1. Compra direto no Kiwify
2. Webhook cria "ativação pendente"
3. Quando faz login no site
4. Sistema ativa PRO automaticamente

---

## SUPORTE

Desenvolvido por: **Nardoto**
- tharcisionardoto@gmail.com
- nardotoengenharia@gmail.com

---

**Última atualização:** Dezembro 2025
