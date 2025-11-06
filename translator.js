// ========================================
// TRADUTOR PROFISSIONAL AI
// Professional Translation Tool
// Version: 2.3.1 - Contador de tempo e relatório de duração da tradução
// Desenvolvido por: Nardoto
// ========================================

class ProfessionalTranslator {
    constructor() {
        console.log('🌐 Tradutor Profissional AI v2.3.1 - by Nardoto');

        this.geminiApiKey = null;
        this.isTranslating = false;
        this.translatedText = '';
        this.originalText = '';
        this.sourceLang = '';
        this.targetLang = '';

        // Configuração de chunks para textos grandes
        this.MAX_CHARS_PER_CHUNK = 25000; // ~6.000-7.000 tokens seguros
        this.currentChunk = 0;
        this.totalChunks = 0;

        // Controle de tempo
        this.startTime = null;
        this.timerInterval = null;
        this.elapsedSeconds = 0;

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

        document.getElementById('exportButton').addEventListener('click', () => {
            this.exportToTxt();
        });

        document.getElementById('exportSrtButton').addEventListener('click', () => {
            this.exportToSrt();
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

        // Atualizar label quando idioma de origem mudar
        document.getElementById('sourceLangSelector').addEventListener('change', (e) => {
            this.updateOriginalLabel(e.target.value);
        });

        document.getElementById('targetLangSelector').addEventListener('change', (e) => {
            this.updateTranslatedLabel(e.target.value);
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

    updateOriginalLabel(langValue) {
        const langNames = {
            'auto': 'Texto Original',
            'portuguese': 'Texto Original (Português)',
            'english': 'Texto Original (English)',
            'spanish': 'Texto Original (Español)',
            'french': 'Texto Original (Français)',
            'italian': 'Texto Original (Italiano)',
            'german': 'Texto Original (Deutsch)'
        };
        document.getElementById('originalLanguageLabel').textContent = langNames[langValue] || 'Texto Original';
    }

    updateTranslatedLabel(langValue) {
        const langNames = {
            'portuguese': 'Tradução (Português)',
            'english': 'Tradução (English)',
            'spanish': 'Tradução (Español)',
            'french': 'Tradução (Français)',
            'italian': 'Tradução (Italiano)',
            'german': 'Tradução (Deutsch)'
        };
        document.getElementById('translatedLanguageLabel').textContent = langNames[langValue] || 'Tradução';
    }

    updateCounter(type, text) {
        const charCount = text.length;
        const counterId = type === 'original' ? 'originalCounter' : 'translatedCounter';
        document.getElementById(counterId).textContent = `${charCount.toLocaleString()} caracteres`;
    }

    showProgressModal() {
        const modal = document.createElement('div');
        modal.id = 'progressModal';
        modal.className = 'modal';
        modal.style.display = 'block';
        modal.innerHTML = `
            <div class="modal-content" style="max-width: 600px;">
                <div style="text-align: center; padding: 2rem;">
                    <h2 style="margin: 0 0 2rem 0; color: var(--accent-primary);">
                        🌐 Traduzindo...
                    </h2>

                    <div style="background: var(--bg-hover); border-radius: var(--radius-sm); padding: 2rem; margin-bottom: 2rem;">
                        <div style="width: 80px; height: 80px; margin: 0 auto 1.5rem; border: 4px solid var(--accent-primary); border-top-color: transparent; border-radius: 50%; animation: spin 1s linear infinite;"></div>

                        <div style="height: 40px; background: var(--bg-secondary); border-radius: 20px; overflow: hidden; position: relative; margin-bottom: 1rem;">
                            <div id="progressBar" style="height: 100%; width: 0%; background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); transition: width 0.3s ease; display: flex; align-items: center; justify-content: center; color: white; font-weight: 600; font-size: 1.1rem;"></div>
                        </div>

                        <p id="progressText" style="color: var(--text-primary); font-size: 1.1rem; font-weight: 500; margin: 0 0 1rem 0;"></p>

                        <div style="display: flex; align-items: center; justify-content: center; gap: 0.5rem; padding: 0.75rem; background: linear-gradient(135deg, #667eea11 0%, #764ba211 100%); border-radius: var(--radius-sm); border: 2px solid #667eea33;">
                            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="#667eea" stroke-width="2">
                                <circle cx="10" cy="10" r="8"/>
                                <path d="M10 6v4l3 2"/>
                            </svg>
                            <span id="timerDisplay" style="color: #667eea; font-weight: 600; font-size: 1rem;">00:00</span>
                        </div>
                    </div>

                    <p style="color: var(--text-secondary); font-size: 0.9rem; margin: 0;">
                        Processando com Google Gemini AI...
                    </p>
                </div>
            </div>
        `;

        document.body.appendChild(modal);

        // Adicionar animação de spin
        if (!document.getElementById('spinAnimation')) {
            const style = document.createElement('style');
            style.id = 'spinAnimation';
            style.textContent = `
                @keyframes spin {
                    from { transform: rotate(0deg); }
                    to { transform: rotate(360deg); }
                }
            `;
            document.head.appendChild(style);
        }
    }

    updateProgress(text, percentage) {
        const progressBar = document.getElementById('progressBar');
        const progressText = document.getElementById('progressText');

        if (progressBar && progressText) {
            progressBar.style.width = `${percentage}%`;
            progressBar.textContent = `${percentage}%`;
            progressText.textContent = text;
        }
    }

    closeProgressModal() {
        const modal = document.getElementById('progressModal');
        if (modal) {
            modal.remove();
        }
    }

    startTimer() {
        this.startTime = Date.now();
        this.elapsedSeconds = 0;
        this.updateTimerDisplay();

        this.timerInterval = setInterval(() => {
            this.elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
            this.updateTimerDisplay();
        }, 1000);
    }

    stopTimer() {
        if (this.timerInterval) {
            clearInterval(this.timerInterval);
            this.timerInterval = null;
        }
        this.elapsedSeconds = Math.floor((Date.now() - this.startTime) / 1000);
        return this.elapsedSeconds;
    }

    updateTimerDisplay() {
        const timerDisplay = document.getElementById('timerDisplay');
        if (timerDisplay) {
            const minutes = Math.floor(this.elapsedSeconds / 60);
            const seconds = this.elapsedSeconds % 60;
            timerDisplay.textContent = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        }
    }

    formatElapsedTime(seconds) {
        if (seconds < 60) {
            return `${seconds} segundo${seconds !== 1 ? 's' : ''}`;
        }
        const minutes = Math.floor(seconds / 60);
        const remainingSeconds = seconds % 60;
        if (remainingSeconds === 0) {
            return `${minutes} minuto${minutes !== 1 ? 's' : ''}`;
        }
        return `${minutes} minuto${minutes !== 1 ? 's' : ''} e ${remainingSeconds} segundo${remainingSeconds !== 1 ? 's' : ''}`;
    }

    async translate() {
        if (this.isTranslating) return;

        const originalText = document.getElementById('originalText').value.trim();
        const sourceLangSelector = document.getElementById('sourceLangSelector');
        const targetLangSelector = document.getElementById('targetLangSelector');

        // Validações
        if (!originalText) {
            this.showToast('⚠️ Digite ou cole um texto para traduzir', 'warning');
            return;
        }

        if (!sourceLangSelector.value) {
            this.showToast('⚠️ Selecione o idioma de origem', 'warning');
            return;
        }

        if (!targetLangSelector.value) {
            this.showToast('⚠️ Selecione o idioma de destino', 'warning');
            return;
        }

        if (!this.geminiApiKey) {
            this.showToast('⚠️ Configure sua API Key primeiro', 'error');
            document.getElementById('settingsModal').style.display = 'block';
            return;
        }

        const languageMap = {
            'english': 'Inglês',
            'portuguese': 'Português',
            'spanish': 'Espanhol',
            'french': 'Francês',
            'italian': 'Italiano',
            'german': 'Alemão',
            'auto': 'detectado automaticamente'
        };

        this.sourceLang = languageMap[sourceLangSelector.value];
        this.targetLang = languageMap[targetLangSelector.value];
        this.originalText = originalText;

        // Atualizar UI
        this.isTranslating = true;
        const translateButton = document.getElementById('translateButton');
        const originalButtonText = translateButton.innerHTML;
        translateButton.disabled = true;

        // Mostrar modal de progresso
        this.showProgressModal();
        this.startTimer(); // Iniciar contador de tempo
        this.updateProgress('Iniciando tradução...', 0);

        await this.sleep(300);
        this.updateProgress('Preparando dados...', 15);

        const sourceLanguageText = sourceLangSelector.value === 'auto'
            ? 'detecte automaticamente o idioma de origem e'
            : `do ${this.sourceLang} para`;

        try {
            // Verificar se precisa dividir em chunks
            const chunks = this.divideTextIntoChunks(originalText, this.MAX_CHARS_PER_CHUNK);
            this.totalChunks = chunks.length;

            if (this.totalChunks > 1) {
                this.updateProgress(`📚 Texto grande detectado! Dividido em ${this.totalChunks} partes`, 10);
                await this.sleep(800);
            } else {
                this.updateProgress('Iniciando tradução...', 10);
                await this.sleep(300);
            }

            const translatedChunks = [];

            // Traduzir cada chunk
            for (let i = 0; i < chunks.length; i++) {
                this.currentChunk = i + 1;
                const chunk = chunks[i];

                // Calcular progresso baseado no chunk atual
                const baseProgress = 10;
                const translationProgress = 80;
                const chunkProgress = baseProgress + (translationProgress * (i / chunks.length));

                if (this.totalChunks > 1) {
                    this.updateProgress(`📝 Traduzindo parte ${this.currentChunk} de ${this.totalChunks}...`, Math.floor(chunkProgress));
                } else {
                    this.updateProgress('Conectando com IA...', 30);
                }
                await this.sleep(300);

                if (this.totalChunks === 1) {
                    this.updateProgress('Enviando texto...', 45);
                }

                // Traduzir chunk
                const translatedChunk = await this.translateChunk(chunk, sourceLanguageText, this.targetLang);
                translatedChunks.push(translatedChunk);

                if (this.totalChunks > 1) {
                    const nextProgress = baseProgress + (translationProgress * ((i + 1) / chunks.length));
                    this.updateProgress(`✅ Parte ${this.currentChunk} de ${this.totalChunks} concluída`, Math.floor(nextProgress));
                    await this.sleep(500);

                    // Pausa entre chunks para não sobrecarregar a API
                    if (i < chunks.length - 1) {
                        this.updateProgress(`⏳ Aguardando para próxima parte...`, Math.floor(nextProgress));
                        await this.sleep(1500);
                    }
                } else {
                    this.updateProgress('Processando resposta...', 70);
                    await this.sleep(300);
                }
            }

            // Juntar todas as traduções
            this.updateProgress('Finalizando e juntando partes...', 90);
            await this.sleep(300);

            // Juntar chunks com espaço duplo entre eles
            this.translatedText = translatedChunks.join('\n\n');

            // Exibir tradução
            document.getElementById('translatedText').value = this.translatedText;
            this.updateCounter('translated', this.translatedText);

            // Calcular e exibir estatísticas
            this.updateStatistics(originalText, this.translatedText);

            // Mostrar botões de exportar
            document.getElementById('exportButton').style.display = 'inline-flex';
            document.getElementById('exportSrtButton').style.display = 'inline-flex';

            // Mostrar painel de configurações SRT
            document.getElementById('srtSettingsPanel').style.display = 'block';

            this.updateProgress('Concluído!', 100);
            await this.sleep(500);

            // Parar timer e calcular tempo total
            const totalSeconds = this.stopTimer();
            const timeFormatted = this.formatElapsedTime(totalSeconds);

            this.closeProgressModal();

            // Mostrar mensagem de sucesso com tempo
            if (this.totalChunks > 1) {
                this.showToast(`✅ Tradução concluída! ${this.totalChunks} partes processadas em ${timeFormatted}`, 'success');
            } else {
                this.showToast(`✅ Tradução concluída em ${timeFormatted}!`, 'success');
            }

        } catch (error) {
            console.error('Erro ao traduzir:', error);
            this.stopTimer();
            this.closeProgressModal();
            this.showToast(`❌ Erro na tradução: ${error.message}`, 'error');
        } finally {
            this.isTranslating = false;
            translateButton.innerHTML = originalButtonText;
            translateButton.disabled = false;
        }
    }

    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    /**
     * Divide texto em chunks inteligentes respeitando parágrafos e sentenças
     */
    divideTextIntoChunks(text, maxChars) {
        if (text.length <= maxChars) {
            return [text];
        }

        const chunks = [];
        let remainingText = text;

        while (remainingText.length > 0) {
            if (remainingText.length <= maxChars) {
                chunks.push(remainingText);
                break;
            }

            // Tentar dividir por parágrafo duplo primeiro
            let cutPoint = remainingText.lastIndexOf('\n\n', maxChars);

            // Se não encontrar parágrafo duplo, tentar parágrafo simples
            if (cutPoint === -1 || cutPoint < maxChars * 0.7) {
                cutPoint = remainingText.lastIndexOf('\n', maxChars);
            }

            // Se não encontrar quebra de linha, tentar ponto final
            if (cutPoint === -1 || cutPoint < maxChars * 0.7) {
                cutPoint = remainingText.lastIndexOf('. ', maxChars);
                if (cutPoint !== -1) cutPoint += 1; // Incluir o ponto
            }

            // Se não encontrar ponto, tentar vírgula
            if (cutPoint === -1 || cutPoint < maxChars * 0.7) {
                cutPoint = remainingText.lastIndexOf(', ', maxChars);
                if (cutPoint !== -1) cutPoint += 1;
            }

            // Último recurso: dividir por espaço
            if (cutPoint === -1 || cutPoint < maxChars * 0.7) {
                cutPoint = remainingText.lastIndexOf(' ', maxChars);
            }

            // Se ainda não encontrou, força divisão no limite
            if (cutPoint === -1) {
                cutPoint = maxChars;
            }

            chunks.push(remainingText.substring(0, cutPoint).trim());
            remainingText = remainingText.substring(cutPoint).trim();
        }

        return chunks;
    }

    /**
     * Traduz um único chunk
     */
    async translateChunk(chunk, sourceLanguageText, targetLang) {
        const prompt = `Você é um tradutor profissional especializado.

TAREFA: ${sourceLanguageText} traduza o texto abaixo para ${targetLang}, mantendo TOTAL FIDELIDADE ao conteúdo original.

INSTRUÇÕES CRÍTICAS:
1. PRESERVAÇÃO DE CONTEÚDO:
   - Mantenha EXATAMENTE o significado original
   - Preserve todos os nomes próprios
   - Mantenha termos técnicos com precisão
   - Preserve números, datas e referências

2. ESTILO E TOM:
   - Mantenha o tom e estilo do texto original
   - Preserve o ritmo e a cadência
   - Mantenha a força emocional das passagens

3. ESTRUTURA:
   - Mantenha TODOS os parágrafos e quebras de linha
   - Preserve marcadores de tempo (ex: "0:00-2:30")
   - Mantenha títulos e subtítulos sem alteração de formato

4. QUALIDADE:
   - Use linguagem natural e fluente em ${targetLang}
   - Evite traduções literais que soem não-naturais
   - Adapte expressões idiomáticas mantendo o sentido

5. RESTRIÇÕES:
   - NÃO adicione explicações, notas ou comentários
   - NÃO omita ou resuma nenhuma parte
   - Retorne APENAS a tradução, sem prefácio ou conclusão
   - Este texto faz parte de um documento maior, então NÃO adicione introduções ou conclusões

TEXTO PARA TRADUZIR:
${chunk}

TRADUÇÃO PARA ${targetLang.toUpperCase()}:`;

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${this.geminiApiKey}`,
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

        return translatedText;
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

        // Atualizar DOM com verificações de null
        const originalWordsEl = document.getElementById('originalWords');
        const originalCharsEl = document.getElementById('originalChars');
        const translatedWordsEl = document.getElementById('translatedWords');
        const translatedCharsEl = document.getElementById('translatedChars');
        const wordsDiffEl = document.getElementById('wordsDiff');
        const charsDiffEl = document.getElementById('charsDiff');
        const statsPanelEl = document.getElementById('statsPanel');

        if (originalWordsEl) originalWordsEl.textContent = originalWords.toLocaleString();
        if (originalCharsEl) originalCharsEl.textContent = originalChars.toLocaleString();
        if (translatedWordsEl) translatedWordsEl.textContent = translatedWords.toLocaleString();
        if (translatedCharsEl) translatedCharsEl.textContent = translatedChars.toLocaleString();

        if (wordsDiffEl) {
            wordsDiffEl.innerHTML = `<span style="color: ${wordsColor}">(${wordsDiff > 0 ? '+' : ''}${wordsDiff}%)</span>`;
        }
        if (charsDiffEl) {
            charsDiffEl.innerHTML = `<span style="color: ${charsColor}">(${charsDiff > 0 ? '+' : ''}${charsDiff}%)</span>`;
        }

        // Mostrar painel de estatísticas se existir
        if (statsPanelEl) {
            statsPanelEl.style.display = 'grid';
        }
    }

    exportToTxt() {
        if (!this.translatedText) {
            this.showToast('⚠️ Não há tradução para exportar', 'warning');
            return;
        }

        const now = new Date();
        const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `traducao_${this.sourceLang}_para_${this.targetLang}_${timestamp}.txt`;

        const content = `===============================================
TRADUÇÃO PROFISSIONAL AI
Desenvolvido por: Nardoto
Powered by: Google Gemini AI
===============================================

Data: ${now.toLocaleDateString('pt-BR')} ${now.toLocaleTimeString('pt-BR')}
Idioma de origem: ${this.sourceLang}
Idioma de destino: ${this.targetLang}

===============================================
TEXTO ORIGINAL
===============================================

${this.originalText}

===============================================
TRADUÇÃO
===============================================

${this.translatedText}

===============================================
ESTATÍSTICAS
===============================================

Original:
- Palavras: ${this.originalText.trim().split(/\s+/).length}
- Caracteres: ${this.originalText.length}

Tradução:
- Palavras: ${this.translatedText.trim().split(/\s+/).length}
- Caracteres: ${this.translatedText.length}

===============================================
`;

        // Criar blob e fazer download
        const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast('✅ Arquivo exportado com sucesso!', 'success');
    }

    exportToSrt() {
        if (!this.translatedText) {
            this.showToast('⚠️ Não há tradução para exportar', 'warning');
            return;
        }

        // Pegar configurações
        const charsPerBlock = parseInt(document.getElementById('srtCharsPerBlock').value) || 84;
        const readingRate = parseInt(document.getElementById('srtReadingRate').value) || 14;

        // Dividir texto em blocos respeitando limites e pontuação
        const blocks = this.divideTextForSrt(this.translatedText, charsPerBlock);

        // Gerar conteúdo SRT
        let srtContent = '';
        let currentTime = 0;

        blocks.forEach((block, index) => {
            const duration = block.length / readingRate;
            const startTime = this.formatSrtTime(currentTime);
            const endTime = this.formatSrtTime(currentTime + duration);

            srtContent += `${index + 1}\n`;
            srtContent += `${startTime} --> ${endTime}\n`;
            srtContent += `${block}\n\n`;

            currentTime += duration;
        });

        // Criar arquivo SRT
        const now = new Date();
        const timestamp = now.toISOString().slice(0, 19).replace(/:/g, '-');
        const filename = `legenda_${this.targetLang}_${timestamp}.srt`;

        const blob = new Blob([srtContent], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        this.showToast(`✅ Legenda SRT exportada! ${blocks.length} blocos gerados`, 'success');
    }

    divideTextForSrt(text, maxChars) {
        // Quebrar por sentenças primeiro
        const sentences = text.match(/[^.!?]+[.!?]+/g) || [text];
        const blocks = [];
        let currentBlock = '';

        sentences.forEach(sentence => {
            sentence = sentence.trim();

            // Se a sentença sozinha já é maior que o limite, quebrar por palavras
            if (sentence.length > maxChars) {
                if (currentBlock) {
                    blocks.push(currentBlock.trim());
                    currentBlock = '';
                }

                const words = sentence.split(' ');
                words.forEach(word => {
                    if ((currentBlock + ' ' + word).length > maxChars) {
                        blocks.push(currentBlock.trim());
                        currentBlock = word;
                    } else {
                        currentBlock += (currentBlock ? ' ' : '') + word;
                    }
                });
            } else {
                // Verificar se cabe no bloco atual
                if ((currentBlock + ' ' + sentence).length > maxChars) {
                    blocks.push(currentBlock.trim());
                    currentBlock = sentence;
                } else {
                    currentBlock += (currentBlock ? ' ' : '') + sentence;
                }
            }
        });

        if (currentBlock) {
            blocks.push(currentBlock.trim());
        }

        return blocks.filter(block => block.length > 0);
    }

    formatSrtTime(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        const secs = Math.floor(seconds % 60);
        const millis = Math.floor((seconds % 1) * 1000);

        return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(millis).padStart(3, '0')}`;
    }

    clearAll() {
        document.getElementById('originalText').value = '';
        document.getElementById('translatedText').value = '';
        document.getElementById('sourceLangSelector').value = '';
        document.getElementById('targetLangSelector').value = '';
        document.getElementById('originalLanguageLabel').textContent = 'Texto Original';
        document.getElementById('translatedLanguageLabel').textContent = 'Tradução';
        document.getElementById('originalCounter').textContent = '0 caracteres';
        document.getElementById('translatedCounter').textContent = '0 caracteres';
        document.getElementById('statsPanel').style.display = 'none';
        document.getElementById('exportButton').style.display = 'none';
        document.getElementById('exportSrtButton').style.display = 'none';
        document.getElementById('srtSettingsPanel').style.display = 'none';
        this.translatedText = '';
        this.originalText = '';
        this.sourceLang = '';
        this.targetLang = '';
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
                `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
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

// Initialize app
let translator;
document.addEventListener('DOMContentLoaded', () => {
    translator = new ProfessionalTranslator();
});
