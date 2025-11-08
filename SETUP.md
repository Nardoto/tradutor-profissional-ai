# Checklist de Configuração - Tradutor Profissional AI

## Status do Sistema

### ✅ Componentes Implementados

- [x] Sistema de autenticação com Google
- [x] Gerenciamento de usuários PRO/FREE
- [x] Integração com Kiwify (checkout)
- [x] Webhook para receber pagamentos
- [x] Cloud Functions deployadas
- [x] Painel administrativo funcional
- [x] Regras de segurança do Firestore
- [x] Verificação automática de ativações pendentes
- [x] Documentação completa

### 🔧 Configurações Necessárias

Você precisa completar as seguintes configurações para o sistema funcionar 100%:

---

## 1. Configurar Webhook no Kiwify

### Por que é necessário?
Para que o sistema receba notificações automáticas quando um cliente comprar o plano PRO.

### Como fazer:

1. Acesse o [Dashboard Kiwify](https://dashboard.kiwify.com.br/)
2. Selecione seu produto (Plano PRO do Tradutor)
3. Vá em **Configurações** > **Webhooks**
4. Clique em **Adicionar Webhook**
5. Configure:

   **URL do Webhook:**
   ```
   https://us-central1-tradutor-profissional-ai.cloudfunctions.net/kiwifyWebhook
   ```

   **Eventos para habilitar:**
   - ✅ `order.paid` (Pagamento aprovado)
   - ✅ `subscription.canceled` (Assinatura cancelada)
   - ✅ `subscription.expired` (Assinatura expirada)
   - ✅ `order.refunded` (Pedido reembolsado)

6. Salve as configurações

### Como testar se funciona:

Após configurar, faça um pedido teste no Kiwify. Você pode verificar se o webhook funcionou:

```bash
firebase functions:log --only kiwifyWebhook
```

Você deve ver logs como:
```
📥 Webhook recebido
💰 Pagamento aprovado para: email@exemplo.com
✅ Plano PRO ativado com sucesso
```

---

## 2. Verificar Domínios Autorizados no Firebase

### Por que é necessário?
Para que o login com Google funcione no seu domínio personalizado.

### Como fazer:

1. Acesse o [Firebase Console](https://console.firebase.google.com/)
2. Selecione o projeto **tradutor-profissional-ai**
3. No menu lateral, clique em **Authentication**
4. Vá na aba **Settings** > **Authorized domains**
5. Verifique se estes domínios estão na lista:
   - ✅ `nardoto.com.br`
   - ✅ `tradutor-profissional-ai.firebaseapp.com`
   - ✅ `localhost` (para testes locais)

6. Se `nardoto.com.br` não estiver, clique em **Add domain** e adicione

---

## 3. Testar o Painel Administrativo

### Acesso:
```
https://nardoto.com.br/admin.html
```

### Credenciais autorizadas:
- tharcisionardoto@gmail.com
- nardotoengenharia@gmail.com

### O que testar:

1. **Login:**
   - Acesse `/admin.html`
   - Clique em "Entrar com Google"
   - Faça login com uma das contas autorizadas
   - Deve entrar no painel automaticamente

2. **Visualizar Usuários:**
   - Clique em "Recarregar Lista"
   - Deve mostrar todos os usuários cadastrados
   - Verificar estatísticas (Total, PRO, Grátis)

3. **Ativar PRO Manualmente:**
   - Busque um usuário FREE
   - Clique em "Ativar PRO"
   - Confirme
   - Usuário deve ficar com badge "PRO"

4. **Ativação em Massa:**
   - Cole uma lista de emails (um por linha)
   - Clique em "Ativar PRO para Todos"
   - Deve ativar todos os emails encontrados

---

## 4. Testar Fluxo de Pagamento

### Teste Completo (Caso 1: Usuário já tem conta)

1. **Criar conta de teste:**
   - Acesse https://nardoto.com.br
   - Faça login com uma conta Google de teste
   - Verifique que está como FREE (3 traduções/dia)

2. **Iniciar checkout:**
   - Clique no botão "Upgrade para PRO"
   - Deve abrir o checkout Kiwify em nova aba
   - Email deve estar pré-preenchido

3. **Simular pagamento:**
   - No Kiwify, você pode fazer um pedido teste
   - Use os dados de teste do Kiwify se disponível

4. **Verificar ativação:**
   - O webhook deve receber a notificação
   - Usuário deve ter `isPro: true` automaticamente
   - Recarregue a página principal
   - Deve mostrar "Plano PRO Ativo"

### Teste Completo (Caso 2: Usuário paga antes de ter conta)

1. **Fazer pedido direto no Kiwify:**
   - Acesse o link do produto Kiwify
   - Complete a compra com um email que não tem conta

2. **Verificar ativação pendente:**
   ```bash
   firebase firestore:get pending_activations --limit 10
   ```

3. **Fazer login no site:**
   - Acesse https://nardoto.com.br
   - Faça login com o mesmo email que comprou
   - Sistema deve detectar a ativação pendente
   - Deve mostrar mensagem: "🎉 Seu Plano PRO foi ativado!"
   - Plano deve estar ativo

---

## 5. Monitoramento e Logs

### Ver logs das Cloud Functions:

```bash
# Logs gerais
firebase functions:log

# Webhook específico
firebase functions:log --only kiwifyWebhook

# Ativações pendentes
firebase functions:log --only checkPendingActivations

# Últimas 50 linhas
firebase functions:log --limit 50
```

### O que monitorar:

- **Pagamentos recebidos:** Logs de `order.paid`
- **Ativações bem-sucedidas:** Mensagens com "✅"
- **Erros:** Mensagens com "❌"
- **Usuários não encontrados:** "⚠️ Usuário não encontrado"

---

## 6. Verificar Segurança

### Regras do Firestore:

As regras foram deployadas. Você pode verificar no Firebase Console:

1. Vá em **Firestore Database** > **Rules**
2. Deve mostrar as regras de [firestore.rules](firestore.rules)

### Testar permissões:

```javascript
// No console do navegador (em incognito):

// Tentar ler outros usuários (deve falhar)
const otherUserDoc = await firebase.firestore().collection('users').doc('outro-uid').get();
// Esperado: Permission denied

// Tentar modificar isPro (deve falhar)
const myDoc = firebase.firestore().collection('users').doc('meu-uid');
await myDoc.update({ isPro: true });
// Esperado: Permission denied
```

---

## 7. Backup e Recuperação

### Configurar backup automático (recomendado):

1. Acesse [Firebase Console](https://console.firebase.google.com/)
2. Vá em **Firestore Database** > **Backups**
3. Ative backups automáticos diários

### Exportar dados manualmente:

```bash
# Exportar collection users
firebase firestore:export users-backup

# Importar backup
firebase firestore:import users-backup
```

---

## 🎉 Checklist Final

Antes de considerar o sistema 100% operacional, confirme:

- [ ] Webhook configurado no Kiwify
- [ ] Domínio nardoto.com.br autorizado no Firebase
- [ ] Admin panel acessível e funcional
- [ ] Teste de pagamento realizado com sucesso
- [ ] Teste de ativação pendente realizado
- [ ] Logs funcionando corretamente
- [ ] Regras de segurança deployadas
- [ ] Backup configurado (recomendado)

---

## 🆘 Problemas Comuns

### Admin panel não abre popup de login

**Solução:**
1. Limpe o cache do navegador (Ctrl+Shift+Delete)
2. Teste em modo anônimo
3. Verifique se popups estão permitidos
4. Verifique domínio autorizado no Firebase

### Webhook não recebe notificações

**Solução:**
1. Verifique URL configurada no Kiwify
2. Teste manualmente enviando POST:
   ```bash
   curl -X POST https://us-central1-tradutor-profissional-ai.cloudfunctions.net/kiwifyWebhook \
        -H "Content-Type: application/json" \
        -d '{"type":"order.paid","Customer":{"email":"teste@gmail.com"}}'
   ```
3. Verifique logs: `firebase functions:log --only kiwifyWebhook`

### Usuário não ativa PRO depois de pagar

**Solução:**
1. Verifique se webhook foi recebido nos logs
2. Confira se email do pagamento é exatamente o mesmo do login
3. Se criou ativação pendente, peça ao usuário para fazer logout/login
4. Verifique manualmente no Firestore se `isPro` foi atualizado

### Erro de permissão no Firestore

**Solução:**
1. Verifique se regras foram deployadas
2. Confirme que usuário está autenticado
3. Verifique no console do Firebase se há erros de permissão

---

## 📞 Suporte

**Desenvolvedor:** Nardoto
- tharcisionardoto@gmail.com
- nardotoengenharia@gmail.com

**Documentação completa:** [README.md](README.md)
