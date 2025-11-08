# 🔥 Configuração do Firebase para o Tradutor Profissional AI

Este guia mostra como configurar o Firebase para habilitar o sistema de login e controle de uso no Tradutor Profissional AI.

## 📋 Pré-requisitos

- Conta Google (gratuita)
- Acesso ao [Console do Firebase](https://console.firebase.google.com)

---

## 🚀 Passo a Passo Completo

### 1️⃣ Criar Projeto no Firebase

1. Acesse [console.firebase.google.com](https://console.firebase.google.com)
2. Clique em **"Adicionar projeto"** (ou "Create a project")
3. Digite um nome (ex: `tradutor-profissional-ai`)
4. Desabilite o Google Analytics (opcional)
5. Clique em **"Criar projeto"**

---

### 2️⃣ Registrar o App Web

1. No painel do projeto, clique no ícone **`</>`** (Web)
2. Digite um apelido para o app (ex: `Tradutor Web`)
3. **NÃO** marque "Firebase Hosting" (já estamos no GitHub Pages)
4. Clique em **"Registrar app"**
5. **COPIE** o código de configuração que aparece (vamos usar no próximo passo)

Exemplo do código que você verá:

```javascript
const firebaseConfig = {
  apiKey: "AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q",
  authDomain: "tradutor-profissional-ai.firebaseapp.com",
  projectId: "tradutor-profissional-ai",
  storageBucket: "tradutor-profissional-ai.appspot.com",
  messagingSenderId: "123456789012",
  appId: "1:123456789012:web:a1b2c3d4e5f6g7h8i9j0k1"
};
```

---

### 3️⃣ Configurar o Código do Projeto

1. Abra o arquivo `index.html` no seu editor de código
2. Procure por esta seção (linha ~560):

```javascript
const firebaseConfig = {
    apiKey: "SUA_API_KEY_AQUI",
    authDomain: "seu-projeto.firebaseapp.com",
    projectId: "seu-projeto-id",
    storageBucket: "seu-projeto.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};
```

3. **SUBSTITUA** pelos valores que você copiou do Firebase Console
4. **SALVE** o arquivo

---

### 4️⃣ Ativar Authentication (Login com Google)

1. No Firebase Console, vá em **"Authentication"** (menu lateral)
2. Clique em **"Vamos começar"** (Get started)
3. Na aba **"Sign-in method"**, clique em **"Google"**
4. **Ative** o provedor Google
5. Selecione um email de suporte (seu email)
6. Clique em **"Salvar"**

---

### 5️⃣ Criar Banco de Dados Firestore

1. No Firebase Console, vá em **"Firestore Database"** (menu lateral)
2. Clique em **"Criar banco de dados"**
3. Escolha **"Iniciar no modo de produção"**
4. Selecione a localização (escolha `southamerica-east1` - São Paulo)
5. Clique em **"Ativar"**

---

### 6️⃣ Configurar Regras de Segurança do Firestore

1. No Firestore, vá na aba **"Regras"**
2. **SUBSTITUA** as regras padrão por:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Regra para coleção de usuários
    match /users/{userId} {
      // Permitir leitura e escrita apenas para o próprio usuário
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

3. Clique em **"Publicar"**

---

### 7️⃣ Configurar Domínio Autorizado (GitHub Pages)

1. No Firebase Console, vá em **"Authentication"** → **"Settings"** (Configurações)
2. Na aba **"Authorized domains"** (Domínios autorizados)
3. Clique em **"Add domain"** (Adicionar domínio)
4. Digite: `nardoto.github.io`
5. Clique em **"Add"** (Adicionar)

---

## ✅ Pronto! Como Testar

1. **Commit e push** suas alterações para o GitHub:

```bash
git add .
git commit -m "Configurar Firebase no projeto"
git push
```

2. Acesse seu site: `https://nardoto.github.io/tradutor-profissional-ai/`

3. Você verá a tela de login com o botão **"Entrar com Google"**

4. Clique no botão e faça login com sua conta Google

5. Após o login, você verá:
   - Seu nome e foto no canto superior direito
   - Contador de traduções (0 / 10)
   - Acesso completo ao tradutor

---

## 🎯 Funcionalidades Habilitadas

✅ **Login com Google** (1 clique)
✅ **10 traduções grátis por dia**
✅ **Contador de uso em tempo real**
✅ **Bloqueio automático ao atingir limite**
✅ **Reset automático diário**
✅ **Coleta de leads** (emails dos usuários)
✅ **Preparado para sistema de pagamento futuro**

---

## 📊 Visualizar Dados dos Usuários

1. No Firebase Console, vá em **"Firestore Database"**
2. Clique na coleção **"users"**
3. Você verá todos os usuários cadastrados com:
   - Email
   - Nome
   - Foto
   - Número de traduções hoje
   - Data de criação
   - Último login

---

## 💰 Custos

**Firebase Spark Plan (Grátis):**
- ✅ 50.000 usuários autenticados/mês
- ✅ 50.000 leituras/dia no Firestore
- ✅ 20.000 escritas/dia no Firestore
- ✅ 1 GB de armazenamento

**Estimativa:** Com 10 traduções por usuário/dia, você aguenta ~2.000 usuários ativos gratuitamente!

---

## 🔒 Segurança

- ✅ Regras do Firestore protegem dados dos usuários
- ✅ Cada usuário só acessa seus próprios dados
- ✅ API Keys do Firebase são públicas (é seguro!)
- ✅ Chaves Gemini AI ficam no navegador do usuário

---

## ❓ Problemas Comuns

### "Firebase não está carregado"
- Verifique se copiou o `firebaseConfig` corretamente
- Limpe o cache do navegador (Ctrl + F5)

### "Login não funciona"
- Verifique se adicionou o domínio autorizado
- Verifique se ativou o provedor Google

### "Erro de permissão no Firestore"
- Verifique se as regras de segurança estão corretas
- Verifique se o usuário está logado

---

## 📞 Próximos Passos

Com o Firebase configurado, você pode adicionar:

1. **Histórico de traduções** (salvar cada tradução)
2. **Sistema de pagamento** (Stripe/Mercado Pago)
3. **Planos PRO** (traduções ilimitadas)
4. **Analytics** (ver estatísticas de uso)
5. **Notificações** (avisar quando limite acabar)

---

**Desenvolvido por Nardoto** | Powered by Firebase & Google Gemini AI
