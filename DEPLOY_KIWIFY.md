# 🚀 Deploy Sistema de Pagamento Kiwify

Guia completo para fazer o deploy do sistema de pagamento integrado com Kiwify.

---

## 📋 O Que Foi Implementado

✅ **Firebase Cloud Functions** - Webhook para receber notificações do Kiwify
✅ **payment.js** - Frontend para redirecionar ao checkout Kiwify
✅ **Ativação automática** - Plano PRO ativado automaticamente após pagamento
✅ **Ativação pendente** - Sistema para ativar usuários que pagaram antes de fazer login
✅ **Cancelamento automático** - Desativa PRO quando assinatura for cancelada

---

## 🎯 Passo a Passo - Deploy Completo

### PASSO 1: Instalar Firebase CLI

Abra o terminal e execute:

```bash
npm install -g firebase-tools
```

Verifique se foi instalado:

```bash
firebase --version
```

---

### PASSO 2: Fazer Login no Firebase

```bash
firebase login
```

Isso vai abrir o navegador para você fazer login com sua conta Google.

---

### PASSO 3: Inicializar Firebase Functions

No diretório do projeto (`tradutor-biblico`), execute:

```bash
cd "c:\Users\tharc\Videos\documentario biblicos\GERADOR DE ROTEIROS\APP_DESENVOLVIMENTO\tradutor-biblico"
firebase init
```

**Seleções:**
- Escolha: **Functions** (use espaço para selecionar, Enter para confirmar)
- Use projeto existente: **tradutor-profissional-ai**
- Linguagem: **JavaScript**
- ESLint: **No** (já temos o código pronto)
- Sobrescrever arquivos: **No** (não sobrescrever os arquivos que criamos)
- Instalar dependências: **Yes**

---

### PASSO 4: Instalar Dependências das Functions

Entre na pasta `functions` e instale as dependências:

```bash
cd functions
npm install
```

Aguarde a instalação terminar.

---

### PASSO 5: Fazer Deploy das Functions

Volte para a raiz do projeto e faça o deploy:

```bash
cd ..
firebase deploy --only functions
```

**Aguarde o deploy terminar!** Isso pode levar 2-3 minutos.

---

### PASSO 6: Copiar URL do Webhook

Após o deploy, você verá algo assim no terminal:

```
✔  Deploy complete!

Function URL (kiwifyWebhook):
https://us-central1-tradutor-profissional-ai.cloudfunctions.net/kiwifyWebhook
```

**COPIE ESSA URL!** Você vai precisar dela no próximo passo.

---

### PASSO 7: Criar Produto no Kiwify

1. **Acesse seu painel Kiwify:**
   - [https://dashboard.kiwify.com.br/products](https://dashboard.kiwify.com.br/products)

2. **Crie um novo produto:**
   - Clique em **"Criar Produto"**
   - **Nome:** Plano PRO - Tradutor Profissional AI
   - **Tipo:** Assinatura
   - **Valor:** R$ 19,90
   - **Frequência:** Mensal
   - **Descrição:**
     ```
     Traduções ilimitadas com IA Google Gemini
     Histórico completo de traduções
     Suporte prioritário
     Sem anúncios
     ```

3. **Configure a página de checkout:**
   - Personalize cores e logo (opcional)
   - Ative **PIX**, **Cartão de Crédito**, **Boleto**

4. **Salve o produto**

5. **Copie o ID do produto:**
   - Vá em **"Configurações"** → **"Integração"**
   - Copie a **URL de Checkout**
   - Vai ser algo como: `https://pay.kiwify.com.br/ABC123XYZ`

---

### PASSO 8: Configurar URL no payment.js

Abra o arquivo `payment.js` e substitua a URL do checkout:

```javascript
// Linha 12 do payment.js
this.kiwifyCheckoutUrl = 'https://pay.kiwify.com.br/ABC123XYZ';
```

**Substitua `ABC123XYZ` pelo ID do seu produto!**

---

### PASSO 9: Configurar Webhook no Kiwify

1. **No painel Kiwify, vá em:**
   - **Configurações** → **Webhooks**

2. **Adicione um novo webhook:**
   - **URL:** Cole a URL da Cloud Function que você copiou no PASSO 6
   - **Eventos:** Selecione TODOS os eventos:
     - ✅ `order.paid` (Pedido Pago)
     - ✅ `subscription.canceled` (Assinatura Cancelada)
     - ✅ `subscription.expired` (Assinatura Expirada)
     - ✅ `order.refunded` (Pedido Reembolsado)

3. **Salve o webhook**

4. **Teste o webhook:**
   - Clique em **"Testar Webhook"**
   - Você deve ver `200 OK` ou `Success`

---

### PASSO 10: Fazer Commit e Push das Mudanças

Agora vamos subir todas as alterações para o GitHub:

```bash
git status
git add .
git commit -m "Implementar sistema de pagamento Kiwify

- Adicionar Firebase Cloud Functions para webhook Kiwify
- Criar payment.js para integração frontend
- Atualizar auth.js com botões de upgrade
- Adicionar suporte a Firebase Functions no index.html
- Sistema de ativação automática de Plano PRO
- Sistema de ativação pendente para usuários que pagaram antes de fazer login

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>"
```

Depois faça push:

```bash
git push origin main
```

---

## 🧪 Como Testar

### Teste 1: Fluxo Completo de Pagamento

1. **Acesse o site:** https://nardoto.com.br/tradutor-profissional-ai
2. **Faça login** com sua conta Google
3. **Faça 50 traduções** para atingir o limite
4. **Clique em "Fazer Upgrade"** no modal
5. **Será redirecionado** para o checkout Kiwify
6. **Complete o pagamento** (use PIX para teste rápido)
7. **Aguarde** 5-10 segundos
8. **Recarregue a página**
9. **Verifique** se o perfil mostra "Plano PRO"
10. **Tente fazer mais traduções** - deve estar ilimitado!

---

### Teste 2: Ativação Manual (Se Necessário)

Se o usuário pagou mas ainda não ativou automaticamente:

1. **Acesse Firebase Console:**
   - [https://console.firebase.google.com](https://console.firebase.google.com)
   - Projeto: **tradutor-profissional-ai**

2. **Vá em Firestore Database:**
   - Clique na coleção **`pending_activations`**
   - Veja se tem o email do usuário lá

3. **Se tiver:**
   - Peça para o usuário fazer login no site
   - O sistema vai ativar automaticamente

4. **Se não tiver:**
   - Ative manualmente seguindo [ATIVAR_USUARIO_PRO.md](./ATIVAR_USUARIO_PRO.md)

---

### Teste 3: Verificar Logs do Webhook

Para ver se o webhook está funcionando:

```bash
firebase functions:log
```

Você verá logs como:

```
📥 Webhook recebido: {...}
💰 Pagamento aprovado para: joao@gmail.com
✅ Plano PRO ativado com sucesso para: joao@gmail.com
```

---

## 🔍 Troubleshooting

### Problema 1: Webhook não está recebendo eventos

**Solução:**
1. Verifique se a URL no Kiwify está correta
2. Teste o webhook no painel Kiwify
3. Veja os logs: `firebase functions:log`

---

### Problema 2: Usuário pagou mas PRO não ativou

**Causas possíveis:**

**A) Usuário ainda não fez login no site**
- Solução: Peça para ele fazer login primeiro
- O sistema vai ativar automaticamente quando ele logar

**B) Webhook não enviou notificação**
- Verifique logs: `firebase functions:log`
- Teste webhook no painel Kiwify

**C) Email diferente**
- Usuário usou email diferente no Kiwify vs Google login
- Solução: Ative manualmente [ATIVAR_USUARIO_PRO.md](./ATIVAR_USUARIO_PRO.md)

---

### Problema 3: Erro 403 ou CORS no webhook

**Solução:**
O código já tem CORS habilitado. Se der erro:

1. Vá em Firebase Console → Functions
2. Clique em `kiwifyWebhook`
3. Vá em **"Permissões"**
4. Adicione `allUsers` com papel `Cloud Functions Invoker`

---

### Problema 4: Firebase Functions não fazem deploy

**Solução:**

1. Ative billing no Firebase (Plano Blaze):
   - [https://console.firebase.google.com/project/tradutor-profissional-ai/usage/details](https://console.firebase.google.com/project/tradutor-profissional-ai/usage/details)
   - Clique em **"Upgrade para Blaze"**
   - **NÃO SE PREOCUPE:** Continua grátis até 2 milhões de invocações/mês!

2. Se já está no Blaze, tente:
   ```bash
   firebase deploy --only functions --debug
   ```

---

## 📊 Monitoramento

### Ver Pagamentos no Kiwify

- Dashboard: [https://dashboard.kiwify.com.br/sales](https://dashboard.kiwify.com.br/sales)
- Você vê todos os pagamentos, assinaturas e cancelamentos

---

### Ver Usuários PRO no Firestore

1. Acesse: [https://console.firebase.google.com](https://console.firebase.google.com)
2. Projeto: **tradutor-profissional-ai**
3. **Firestore Database** → **users**
4. Filtre por: `isPro == true`

---

### Ver Logs das Functions

```bash
firebase functions:log --only kiwifyWebhook
```

Ou veja no Firebase Console:
- Functions → kiwifyWebhook → Logs

---

## 💰 Custos

### Firebase Functions (Plano Blaze)

**Grátis até:**
- 2.000.000 invocações/mês
- 400.000 GB-s/mês
- 200.000 GB/mês de tráfego

**Estimativa para seu caso:**
- 100 pagamentos/mês = ~100 invocações
- **Custo: R$ 0,00** (muito abaixo do limite grátis)

### Kiwify

**Taxa por transação:**
- R$ 19,90 → Você recebe ~R$ 17,50 (taxa de ~12%)
- Sem mensalidade, só paga por transação

---

## 🎯 Próximos Passos Opcionais

1. **Email de Boas-vindas:**
   - Configurar SendGrid ou Resend
   - Enviar email quando PRO for ativado

2. **Dashboard Admin:**
   - Ver todos os usuários PRO
   - Ver receita mensal
   - Ver cancelamentos

3. **Cupons de Desconto:**
   - Criar cupons no Kiwify
   - Oferecer 20% off na primeira compra

4. **Histórico de Traduções:**
   - Salvar todas as traduções dos usuários PRO
   - Mostrar histórico no perfil

---

## ✅ Checklist Final

Marque conforme for completando:

- [ ] Firebase CLI instalado
- [ ] Login no Firebase feito
- [ ] Firebase Functions inicializado
- [ ] Dependências instaladas
- [ ] Deploy das Functions feito com sucesso
- [ ] URL do webhook copiada
- [ ] Produto criado no Kiwify
- [ ] Checkout configurado (PIX, Cartão, Boleto)
- [ ] URL do produto copiada e colocada no payment.js
- [ ] Webhook configurado no Kiwify
- [ ] Webhook testado com sucesso (200 OK)
- [ ] Mudanças commitadas e pushed para GitHub
- [ ] Teste completo realizado (login → upgrade → pagamento → ativação)
- [ ] Plano Blaze ativado no Firebase (se necessário)

---

## 🎉 Parabéns!

Seu sistema de pagamento está funcionando! 🚀

Agora você tem:
- ✅ Assinaturas recorrentes automáticas
- ✅ Ativação instantânea do Plano PRO
- ✅ Cancelamento automático
- ✅ Sistema de ativação pendente
- ✅ Logs completos de todos os eventos

**Desenvolvido por Nardoto** | Powered by Kiwify & Firebase
