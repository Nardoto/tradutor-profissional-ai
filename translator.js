// ========================================
// TRADUTOR DE TEXTOS RELIGIOSOS
// Standalone Translation Tool
// Version: 1.0.0
// ========================================

class BiblicalTranslator {
    constructor() {
        console.log('🌐 Tradutor de Textos Religiosos v1.0.0');

        this.geminiApiKey = null;
        this.isTranslating = false;

        this.init();
    }

    init() {
        // Carregar API Key do localStorage
        this.geminiApiKey = localStorage.getItem('geminiApiKey');

        // Event listeners
        document.getElementById('translateButton').addEventListener('click', () => {
            this.translate();
        });

        document.getElementById('clearButton').addEventListener('click', () => {
            this.clearAll();
        });

        document.getElementById('settingsButton').addEventListener('click', () => {
            document.getElementById('settingsModal').style.display = 'block';
        });

        document.getElementById('saveApiKeyButton').addEventListener('click', () => {
            this.saveApiKey();
        });

        document.getElementById('testApiKeyButton').addEventListener('click', () => {
            this.testApiKey();
        });

        document.getElementById('copyOriginalButton').addEventListener('click', () => {
            this.copyToClipboard('originalText', 'Original');
        });

        document.getElementById('copyTranslatedButton').addEventListener('click', () => {
            this.copyToClipboard('translatedText', 'Tradução');
        });

        // Contadores em tempo real
        document.getElementById('originalText').addEventListener('input', (e) => {
            this.updateCounter('original', e.target.value);
        });

        document.getElementById('translatedText').addEventListener('input', (e) => {
            this.updateCounter('translated', e.target.value);
        });

        // Fechar modal ao clicar fora
        document.getElementById('settingsModal').addEventListener('click', (e) => {
            if (e.target.id === 'settingsModal') {
                document.getElementById('settingsModal').style.display = 'none';
            }
        });

        // Verificar se tem API Key ao carregar
        if (!this.geminiApiKey) {
            setTimeout(() => {
                this.showToast('⚠️ Configure sua API Key do Google Gemini primeiro', 'warning');
                document.getElementById('settingsModal').style.display = 'block';
            }, 1000);
        }
    }

    updateCounter(type, text) {
        const charCount = text.length;
        const counterId = type === 'original' ? 'originalCounter' : 'translatedCounter';
        document.getElementById(counterId).textContent = `${charCount.toLocaleString()} caracteres`;
    }

    async translate() {
        if (this.isTranslating) return;

        const originalText = document.getElementById('originalText').value.trim();
        const languageSelector = document.getElementById('languageSelector');

        // Validações
        if (!originalText) {
            this.showToast('⚠️ Digite ou cole um texto para traduzir', 'warning');
            return;
        }

        if (!languageSelector.value) {
            this.showToast('⚠️ Selecione um idioma de destino', 'warning');
            return;
        }

        if (!this.geminiApiKey) {
            this.showToast('⚠️ Configure sua API Key primeiro', 'error');
            document.getElementById('settingsModal').style.display = 'block';
            return;
        }

        const languageMap = {
            'english': 'Inglês',
            'portuguese': 'Português (Brasil)',
            'spanish': 'Espanhol',
            'french': 'Francês',
            'italian': 'Italiano',
            'german': 'Alemão'
        };

        const targetLanguage = languageMap[languageSelector.value];

        // Atualizar UI
        this.isTranslating = true;
        const translateButton = document.getElementById('translateButton');
        const originalButtonText = translateButton.innerHTML;
        translateButton.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="margin-right: 0.5rem; animation: spin 1s linear infinite;">
                <circle cx="12" cy="12" r="10"/>
                <path d="M12 6v6l4 2"/>
            </svg>
            Traduzindo...
        `;
        translateButton.disabled = true;

        document.getElementById('translatedLanguageLabel').textContent = `Tradução (${targetLanguage})`;

        const prompt = `
Você é um tradutor especializado em roteiros de documentários bíblicos e textos religiosos.

TAREFA: Traduza o texto abaixo de Português para ${targetLanguage}, mantendo TOTAL FIDELIDADE ao conteúdo original.

INSTRUÇÕES CRÍTICAS:
1. PRESERVAÇÃO TEOLÓGICA:
   - Mantenha EXATAMENTE o significado teológico e doutrinário
   - Preserve todos os nomes bíblicos (Jesus, Jerusalém, Abraão, etc.)
   - Mantenha termos técnicos religiosos com precisão

2. ESTILO NARRATIVO:
   - Mantenha o tom narrativo de documentário
   - Preserve o ritmo e a cadência do texto original
   - Mantenha a força dramática e emocional das passagens

3. FIDELIDADE ESTRUTURAL:
   - Mantenha TODOS os parágrafos e quebras de linha
   - Preserve marcadores de tempo (ex: "0:00-2:30")
   - Mantenha títulos e subtítulos sem alteração de formato

4. QUALIDADE LINGUÍSTICA:
   - Use linguagem culta e fluente em ${targetLanguage}
   - Evite traduções literais que soem não-naturais
   - Adapte expressões idiomáticas mantendo o sentido original

5. RESTRIÇÕES:
   - NÃO adicione explicações, notas ou comentários
   - NÃO omita ou resuma nenhuma parte do texto
   - NÃO altere números, datas ou referências bíblicas
   - Retorne APENAS a tradução, sem prefácio ou conclusão

TEXTO ORIGINAL (Português):
${originalText}

TRADUÇÃO FIEL PARA ${targetLanguage.toUpperCase()}:
`;

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${this.geminiApiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: prompt }]
                        }]
                    })
                }
            );

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error?.message || 'Erro na API');
            }

            const data = await response.json();
            const translatedText = data.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!translatedText) {
                throw new Error('Resposta vazia da IA');
            }

            // Exibir tradução
            document.getElementById('translatedText').value = translatedText;
            this.updateCounter('translated', translatedText);

            // Calcular e exibir estatísticas
            this.updateStatistics(originalText, translatedText);

            this.showToast('✅ Tradução concluída com sucesso!', 'success');

        } catch (error) {
            console.error('Erro ao traduzir:', error);
            this.showToast(`❌ Erro na tradução: ${error.message}`, 'error');
        } finally {
            this.isTranslating = false;
            translateButton.innerHTML = originalButtonText;
            translateButton.disabled = false;
        }
    }

    updateStatistics(originalText, translatedText) {
        const originalWords = originalText.trim().split(/\s+/).length;
        const originalChars = originalText.length;
        const translatedWords = translatedText.trim().split(/\s+/).length;
        const translatedChars = translatedText.length;

        // Calcular diferenças
        const wordsDiff = ((translatedWords - originalWords) / originalWords * 100).toFixed(1);
        const charsDiff = ((translatedChars - originalChars) / originalChars * 100).toFixed(1);

        const wordsColor = Math.abs(wordsDiff) > 10 ? '#f59e0b' : '#10b981';
        const charsColor = Math.abs(charsDiff) > 10 ? '#f59e0b' : '#10b981';

        // Atualizar DOM
        document.getElementById('originalWords').textContent = originalWords.toLocaleString();
        document.getElementById('originalChars').textContent = originalChars.toLocaleString();
        document.getElementById('translatedWords').textContent = translatedWords.toLocaleString();
        document.getElementById('translatedChars').textContent = translatedChars.toLocaleString();

        document.getElementById('wordsDiff').innerHTML = `<span style="color: ${wordsColor}">(${wordsDiff > 0 ? '+' : ''}${wordsDiff}%)</span>`;
        document.getElementById('charsDiff').innerHTML = `<span style="color: ${charsColor}">(${charsDiff > 0 ? '+' : ''}${charsDiff}%)</span>`;

        // Mostrar painel de estatísticas
        document.getElementById('statsPanel').style.display = 'grid';
    }

    clearAll() {
        document.getElementById('originalText').value = '';
        document.getElementById('translatedText').value = '';
        document.getElementById('languageSelector').value = '';
        document.getElementById('translatedLanguageLabel').textContent = 'Tradução';
        document.getElementById('originalCounter').textContent = '0 caracteres';
        document.getElementById('translatedCounter').textContent = '0 caracteres';
        document.getElementById('statsPanel').style.display = 'none';
        this.showToast('🗑️ Tudo limpo!', 'info');
    }

    saveApiKey() {
        const apiKey = document.getElementById('apiKeyInput').value.trim();

        if (!apiKey) {
            this.showToast('⚠️ Digite uma API Key válida', 'warning');
            return;
        }

        localStorage.setItem('geminiApiKey', apiKey);
        this.geminiApiKey = apiKey;

        document.getElementById('settingsModal').style.display = 'none';
        this.showToast('✅ API Key salva com sucesso!', 'success');
    }

    async testApiKey() {
        const apiKey = document.getElementById('apiKeyInput').value.trim() || this.geminiApiKey;

        if (!apiKey) {
            this.showToast('⚠️ Configure uma API Key primeiro', 'warning');
            return;
        }

        const testButton = document.getElementById('testApiKeyButton');
        testButton.disabled = true;
        testButton.textContent = '🧪 Testando...';

        try {
            const response = await fetch(
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
                {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{
                            parts: [{ text: 'Hello' }]
                        }]
                    })
                }
            );

            if (response.ok) {
                this.showToast('✅ API Key válida! Conexão bem-sucedida.', 'success');
            } else {
                const error = await response.json();
                throw new Error(error.error?.message || 'API Key inválida');
            }
        } catch (error) {
            this.showToast(`❌ Erro: ${error.message}`, 'error');
        } finally {
            testButton.disabled = false;
            testButton.textContent = '🧪 Testar Conexão';
        }
    }

    copyToClipboard(textareaId, label) {
        const text = document.getElementById(textareaId).value;

        if (!text) {
            this.showToast('⚠️ Não há texto para copiar', 'warning');
            return;
        }

        navigator.clipboard.writeText(text).then(() => {
            this.showToast(`✅ ${label} copiado para a área de transferência!`, 'success');
        }).catch(() => {
            this.showToast('❌ Erro ao copiar', 'error');
        });
    }

    showToast(message, type = 'info') {
        const toast = document.getElementById('toast');
        if (!toast) return;

        toast.textContent = message;
        toast.className = `toast ${type}`;
        toast.classList.add('show');

        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

// Add spinning animation for loading icon
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        from { transform: rotate(0deg); }
        to { transform: rotate(360deg); }
    }
`;
document.head.appendChild(style);

// Initialize app
let translator;
document.addEventListener('DOMContentLoaded', () => {
    translator = new BiblicalTranslator();
});
