# 🔑 Como Ativar Usuários PRO Manualmente

Guia para ativar manualmente o Plano PRO para usuários específicos pelo Firebase Console.

---

## 🎯 Como Funciona

1. Usuário te envia o **email** dele
2. Você acessa o **Firebase Console**
3. Encontra o usuário pelo email na coleção `users`
4. Ativa o campo `isPro: true`
5. **Pronto!** Usuário tem traduções ilimitadas 🚀

---

## 📋 Passo a Passo - Ativar PRO Manualmente

### Método 1: Firebase Console (Visual - Mais Fácil)

1. **Acesse o Firebase Console:**
   - [https://console.firebase.google.com](https://console.firebase.google.com)
   - Projeto: **tradutor-profissional-ai**

2. **Vá em Firestore Database:**
   - Menu lateral → **Firestore Database**
   - Clique na coleção **`users`**

3. **Encontre o usuário pelo email:**
   - Use **Ctrl + F** no navegador
   - Busque pelo email do usuário (ex: `joao@gmail.com`)
   - Ou role manualmente até encontrar

4. **Edite o documento do usuário:**
   - Clique no **documento do usuário** (ID único)
   - Você verá os campos: `email`, `displayName`, `isPro`, etc.

5. **Ativar Plano PRO:**
   - Clique no campo **`isPro`**
   - Altere de `false` para **`true`**
   - Clique em **"Atualizar"** (ícone de salvar)

6. **Adicionar data de ativação (Opcional):**
   - Clique em **"Adicionar campo"** (+ Add field)
   - Nome do campo: `proActivatedAt`
   - Tipo: **timestamp**
   - Valor: Clique em **"Now"** (data/hora atual)
   - Clique em **"Adicionar"**

7. **PRONTO!** 🎉
   - Usuário agora tem **Plano PRO**
   - Traduções ilimitadas ativadas
   - O perfil mostrará "Plano PRO"

---

### Método 2: Firebase CLI (Linha de Comando - Avançado)

Se você preferir fazer via script (ativar vários de uma vez):

```javascript
// Salve este script como: ativar-pro.js

const admin = require('firebase-admin');

// Inicializar Firebase Admin
const serviceAccount = require('./tradutor-profissional-ai-firebase-adminsdk.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

// Função para ativar PRO por email
async function ativarProPorEmail(email) {
  try {
    // Buscar usuário por email
    const usersRef = db.collection('users');
    const snapshot = await usersRef.where('email', '==', email).get();

    if (snapshot.empty) {
      console.log(`❌ Usuário não encontrado: ${email}`);
      return;
    }

    // Ativar PRO
    snapshot.forEach(async (doc) => {
      await doc.ref.update({
        isPro: true,
        proActivatedAt: admin.firestore.FieldValue.serverTimestamp(),
        proActivatedBy: 'manual'
      });

      console.log(`✅ Plano PRO ativado para: ${email}`);
    });

  } catch (error) {
    console.error(`Erro ao ativar PRO para ${email}:`, error);
  }
}

// Ativar PRO para um usuário específico
ativarProPorEmail('joao@gmail.com');

// Ou ativar para vários de uma vez:
/*
const usuarios = [
  'joao@gmail.com',
  'maria@gmail.com',
  'pedro@gmail.com'
];

usuarios.forEach(email => ativarProPorEmail(email));
*/
```

**Para usar o script:**
```bash
# Instalar Firebase Admin SDK
npm install firebase-admin

# Baixar chave privada do Firebase
# Console Firebase → Configurações do Projeto → Contas de Serviço → Gerar nova chave privada

# Executar script
node ativar-pro.js
```

---

## 🔍 Como Verificar se Funcionou

### No Firebase Console:
1. Vá em **Firestore Database** → **users**
2. Clique no documento do usuário
3. Verifique se `isPro` está `true`

### No Site (usuário logado):
1. Usuário faz login no site
2. Clica no perfil (canto superior direito)
3. Deve mostrar **"Plano PRO"** ao invés de "Plano Grátis"
4. Contador mostra **"Traduções Ilimitadas"** ou número sem limite

---

## 📊 Campos do Usuário no Firestore

Quando você ativar PRO, os campos ficam assim:

```javascript
{
  email: "joao@gmail.com",
  displayName: "João Silva",
  photoURL: "https://...",
  isPro: true,                          // ← ESTE É O PRINCIPAL!
  translationsToday: 0,
  lastReset: "2025-01-08",
  createdAt: "2025-01-08T10:00:00.000Z",
  lastLogin: "2025-01-08T12:30:00.000Z",
  proActivatedAt: "2025-01-08T14:00:00.000Z",  // Data que ativou PRO
  proActivatedBy: "manual"               // Como foi ativado (manual ou payment)
}
```

---

## 🔄 Como Desativar PRO (Cancelar)

Se precisar remover o plano PRO de alguém:

1. Acesse o documento do usuário no Firestore
2. Altere `isPro` de `true` para **`false`**
3. Clique em **"Atualizar"**
4. **Pronto!** Usuário volta para o plano gratuito (50 traduções/dia)

---

## 💡 Dicas Importantes

### 1. **Marcar como foi ativado:**
Sempre adicione o campo `proActivatedBy: "manual"` quando ativar manualmente. Assim você sabe quem pagou e quem você deu de graça/teste.

### 2. **Anotar motivo (opcional):**
Você pode adicionar um campo `proReason` com o motivo:
- `"teste"` - Usuário de teste
- `"parceiro"` - Parceiro/colaborador
- `"pagamento_manual"` - Pagou fora do sistema
- `"cortesia"` - Cortesia/brinde

### 3. **Data de expiração (futuro):**
Você pode adicionar `proExpiresAt` para planos temporários:
```javascript
{
  isPro: true,
  proActivatedAt: "2025-01-08",
  proExpiresAt: "2025-02-08",  // Expira em 1 mês
  proReason: "teste_30_dias"
}
```

Depois, crie uma Cloud Function para desativar automaticamente quando expirar.

---

## 📋 Template de Controle (Google Sheets)

Crie uma planilha para controlar seus usuários PRO:

| Email | Nome | Ativado em | Tipo | Status | Observação |
|-------|------|------------|------|--------|------------|
| joao@gmail.com | João Silva | 08/01/2025 | Manual | Ativo | Teste 30 dias |
| maria@gmail.com | Maria Santos | 10/01/2025 | Manual | Ativo | Parceira |
| pedro@gmail.com | Pedro Costa | 12/01/2025 | Manual | Cancelado | Solicitou cancelamento |

---

## 🚀 Quando Implementar Pagamento Automático

Quando você implementar o Mercado Pago/Stripe no futuro:

1. O webhook do pagamento vai fazer exatamente o que você faz manualmente
2. Só vai adicionar `proActivatedBy: "payment"` e `paymentId`
3. O resto continua **exatamente igual**!

Então todo o sistema já está pronto! 🎉

---

## ❓ Perguntas Frequentes

### **"E se o usuário ainda não fez login?"**
- Ele precisa fazer login pelo menos 1 vez primeiro
- Só depois aparece no Firestore para você ativar

### **"Posso ativar antes de ele fazer login?"**
- Não. Precisa existir o documento dele no Firestore
- Peça para ele fazer login primeiro, depois ative

### **"Quanto tempo leva para atualizar no site?"**
- Instantâneo! Assim que você salvar, ele recarrega a página e já está PRO

### **"Posso ativar PRO por tempo limitado?"**
- Sim! Adicione o campo `proExpiresAt` com a data de expiração
- Depois crie uma Cloud Function para desativar automaticamente

---

## 📞 Fluxo Completo com o Usuário

**1. Usuário te contata:**
> "Oi! Quero assinar o Plano PRO. Meu email é joao@gmail.com"

**2. Você responde:**
> "Ótimo! Faça login no site pelo menos 1 vez: https://nardoto.com.br/tradutor-profissional-ai
> Depois me confirme que já fez login."

**3. Usuário confirma:**
> "Já fiz login!"

**4. Você ativa no Firebase Console**
- Email: joao@gmail.com
- isPro: true
- proActivatedBy: "manual"
- proReason: "pagamento_pix" (ou o que for)

**5. Você confirma:**
> "Pronto! Seu Plano PRO está ativado. Recarregue a página para ver. 🎉"

**6. Usuário recarrega e vê:**
- **Plano PRO** no perfil
- **Traduções Ilimitadas**
- 🚀

---

**Desenvolvido por Nardoto** | Sistema de Ativação Manual PRO
