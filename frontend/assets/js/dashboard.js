/**
 * Módulo do Dashboard - Chart.js e métricas
 */

class SGVDashboard {
    constructor() {
        this.charts = {};
        this.data = {};
        this.initialized = false;
        this.chartType = 'bar'; // 'bar' ou 'line'
        this.lastRenderTime = 0;

        // Configurações padrão do Chart.js
        this.defaultChartOptions = {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'top',
                },
                tooltip: {
                    backgroundColor: 'rgba(0, 0, 0, 0.8)',
                    titleColor: '#ffffff',
                    bodyColor: '#ffffff',
                    borderColor: '#2563eb',
                    borderWidth: 1,
                }
            },
            scales: {
                y: {
                    beginAtZero: true,
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                },
                x: {
                    grid: {
                        color: 'rgba(0, 0, 0, 0.1)'
                    }
                }
            }
        };

        // Paleta de cores
        this.colors = {
            primary: '#2563eb',
            success: '#16a34a',
            warning: '#eab308',
            danger: '#dc2626',
            secondary: '#64748b',
            info: '#0ea5e9',
            light: '#f1f5f9',
            dark: '#1e293b'
        };
    }

    /**
     * Inicializa o dashboard
     */
    async init() {
        try {
            if (this.initialized) {
                console.log('ℹ️ Dashboard já inicializado, ignorando...');
                return;
            }

            console.log('📊 Iniciando processo de inicialização do Dashboard...');

            // Carregar todos os dados
            console.log('📥 Carregando dados do servidor...');
            await this.loadData();
            console.log('✅ Dados carregados com sucesso');

            // Renderizar componentes
            console.log('🎨 Renderizando KPIs...');
            this.renderKPIs();
            console.log('✅ KPIs renderizados');

            console.log('📈 Renderizando gráficos...');
            this.renderCharts();
            console.log('✅ Gráficos renderizados');

            console.log('📋 Renderizando tabelas...');
            this.renderTables();
            console.log('✅ Tabelas renderizadas');

            console.log('💡 Renderizando recomendações...');
            this.renderRecommendations();
            console.log('✅ Recomendações renderizadas');

            this.initialized = true;
            console.log('🎉 Dashboard inicializado com sucesso!');

        } catch (error) {
            console.error('❌ Erro ao inicializar Dashboard:', error);
            console.error('📍 Stack trace completo:', error.stack);
            console.error('🔍 Dados disponíveis:', this.data);

            if (typeof SGVUtils !== 'undefined') {
                SGVUtils.showToast('Erro ao carregar dashboard: ' + error.message, 'error');
            } else {
                console.error('⚠️ SGVUtils não disponível para mostrar toast');
            }
            throw error; // Re-throw para que a função pai possa capturar
        }
    }

    /**
     * Carrega todos os dados do dashboard
     */
    async loadData() {
        try {
            console.log('🔄 Iniciando carregamento de dados...');
            SGVUtils.showLoading();

            console.log('📡 Testando endpoint individual...');
            // Testar um endpoint primeiro
            const testKpis = await SGVApi.api.getKPIs();
            console.log('✅ Teste KPIs:', testKpis);

            console.log('📊 Carregando todos os dados em paralelo...');
            // Carregar todos os dados em paralelo
            const [
                kpis,
                vidaUtilCategoria,
                fipeCategoria,
                topRodados,
                topHoras,
                topManutencoes,
                recomendacoes
            ] = await Promise.all([
                SGVApi.api.getKPIs(),
                SGVApi.api.getVidaUtilPorCategoria(),
                SGVApi.api.getFipePorCategoria(),
                SGVApi.api.getTopRodados(10),
                SGVApi.api.getTopHoras(10),
                SGVApi.api.getTopManutencoes(10),
                SGVApi.api.getRecomendacoes()
            ]);

            console.log('📦 Dados individuais carregados:');
            console.log('  KPIs:', kpis);
            console.log('  Vida Útil:', vidaUtilCategoria?.length, 'categorias');
            console.log('  FIPE:', fipeCategoria?.length, 'categorias');
            console.log('  Top Rodados:', topRodados?.length, 'veículos');
            console.log('  Top Horas:', topHoras?.length, 'veículos');
            console.log('  Top Manutenções:', topManutencoes?.length, 'veículos');
            console.log('  Recomendações:', recomendacoes?.length, 'itens');

            // Armazenar dados
            this.data = {
                kpis,
                vidaUtilCategoria,
                fipeCategoria,
                topRodados,
                topHoras,
                topManutencoes,
                recomendacoes
            };

            console.log('✅ Todos os dados carregados e armazenados');
            console.log('📈 Estado final dos dados:', this.data);

        } catch (error) {
            console.error('❌ Erro ao carregar dados:', error);
            console.error('📍 Stack trace:', error.stack);
            throw error;
        } finally {
            SGVUtils.hideLoading();
        }
    }

    /**
     * Renderiza os cards KPI
     */
    renderKPIs() {
        const { kpis } = this.data;

        // Evitar re-renderização muito frequente
        const now = Date.now();
        if (now - this.lastRenderTime < 500) {
            console.log('⚠️ Evitando re-renderização muito rápida dos KPIs');
            return;
        }
        this.lastRenderTime = now;

        console.log('🎨 Renderizando KPIs com dados:', kpis);

        // Verificar se os elementos existem
        const elements = {
            'kpi-frota-total': document.getElementById('kpi-frota-total'),
            'kpi-pct-ativos': document.getElementById('kpi-pct-ativos'),
            'kpi-vida-util': document.getElementById('kpi-vida-util'),
            'kpi-horas-mes': document.getElementById('kpi-horas-mes')
        };

        console.log('🔍 Elementos KPI encontrados:', Object.entries(elements).map(([id, el]) => `${id}: ${el ? 'OK' : 'NOT FOUND'}`));

        // Renderizar apenas elementos que existem
        if (elements['kpi-frota-total']) {
            elements['kpi-frota-total'].textContent = SGVUtils.formatNumber(kpis.frota_total);
            console.log('✅ Frota total:', kpis.frota_total);
        }

        if (elements['kpi-pct-ativos']) {
            elements['kpi-pct-ativos'].textContent = SGVUtils.formatPercent(kpis.pct_ativos);
            console.log('✅ % Ativos:', kpis.pct_ativos);
        }

        if (elements['kpi-vida-util']) {
            elements['kpi-vida-util'].textContent = SGVUtils.formatNumber(kpis.vida_util_media, 1);
            console.log('✅ Vida útil média:', kpis.vida_util_media);
        }

        if (elements['kpi-horas-mes']) {
            elements['kpi-horas-mes'].textContent = SGVUtils.formatNumber(kpis.horas_mes_total);
            console.log('✅ Horas/mês:', kpis.horas_mes_total);
        }
    }

    /**
     * Renderiza os gráficos
     */
    renderCharts() {
        this.renderVidaUtilChart();
        this.setupChartControls();
    }

    /**
     * Configura controles dos gráficos
     */
    setupChartControls() {
        const toggleButton = document.getElementById('chart-type-toggle');
        if (toggleButton) {
            toggleButton.addEventListener('click', () => {
                this.toggleChartType();
            });
        }
    }

    /**
     * Alterna entre gráfico de barras e linha
     */
    toggleChartType() {
        this.chartType = this.chartType === 'bar' ? 'line' : 'bar';

        // Atualizar texto do botão
        const toggleButton = document.getElementById('chart-type-toggle');
        if (toggleButton) {
            toggleButton.innerHTML = this.chartType === 'bar' ? '📊 Barras' : '📈 Linha';
            toggleButton.title = this.chartType === 'bar' ? 'Alternar para gráfico de linha' : 'Alternar para gráfico de barras';
        }

        // Re-renderizar o gráfico
        this.renderVidaUtilChart();
    }

    /**
     * Gráfico de Vida Útil por Categoria
     */
    renderVidaUtilChart() {
        const ctx = document.getElementById('chart-vida-util');
        const { vidaUtilCategoria } = this.data;

        if (!ctx) {
            console.warn('⚠️ Elemento chart-vida-util não encontrado');
            return;
        }

        if (!vidaUtilCategoria || vidaUtilCategoria.length === 0) {
            console.warn('⚠️ Dados vidaUtilCategoria vazios');
            return;
        }

        // Verificar se Chart.js está disponível
        if (typeof Chart === 'undefined') {
            console.warn('⚠️ Chart.js não disponível, criando gráfico alternativo...');
            this.renderVidaUtilFallback(vidaUtilCategoria);
            return;
        }

        // Destruir gráfico anterior se existir
        if (this.charts.vidaUtil) {
            try {
                this.charts.vidaUtil.destroy();
                console.log('🗑️ Gráfico anterior destruído');
            } catch (error) {
                console.warn('⚠️ Erro ao destruir gráfico anterior:', error);
            }
            this.charts.vidaUtil = null;
        }

        // Preparar dados
        const labels = vidaUtilCategoria.map(item => item.categoria);
        const data = vidaUtilCategoria.map(item => item.nota_media);

        // Cores baseadas na nota (verde para alta, vermelho para baixa)
        const backgroundColors = data.map(nota => {
            if (nota >= 80) return this.colors.success;
            if (nota >= 60) return this.colors.warning;
            return this.colors.danger;
        });

        try {
            // Guardar referência para uso nas callbacks
            const chartType = this.chartType;

            // Configuração específica para cada tipo de gráfico
            const dataset = this.chartType === 'line' ? {
                label: 'Vida Útil Média',
                data,
                borderColor: this.colors.primary,
                backgroundColor: this.colors.primary + '20',
                borderWidth: 3,
                fill: true,
                tension: 0.4,
                pointBackgroundColor: backgroundColors,
                pointBorderColor: backgroundColors,
                pointBorderWidth: 2,
                pointRadius: 6,
                pointHoverRadius: 8
            } : {
                label: 'Vida Útil Média',
                data,
                backgroundColor: backgroundColors,
                borderColor: backgroundColors.map(color => color),
                borderWidth: 1,
                borderRadius: 4,
                borderSkipped: false,
            };

            this.charts.vidaUtil = new Chart(ctx.getContext('2d'), {
                type: this.chartType,
                data: {
                    labels,
                    datasets: [dataset]
                },
                options: {
                    responsive: true,
                    maintainAspectRatio: false,
                    animation: {
                        duration: 750,
                        easing: 'easeInOutQuart'
                    },
                    interaction: {
                        intersect: false,
                        mode: 'index'
                    },
                    plugins: {
                        legend: {
                            position: 'top'
                        },
                        tooltip: {
                            backgroundColor: 'rgba(0, 0, 0, 0.8)',
                            titleColor: '#ffffff',
                            bodyColor: '#ffffff',
                            borderColor: '#2563eb',
                            borderWidth: 1,
                            callbacks: {
                                label: (context) => {
                                    const data = vidaUtilCategoria[context.dataIndex];
                                    const baseInfo = [
                                        `Vida Útil: ${context.parsed.y.toFixed(1)}%`,
                                        `Total: ${data.total_veiculos} veículos`,
                                        `Ativos: ${data.veiculos_ativos} (${((data.veiculos_ativos / data.total_veiculos) * 100).toFixed(1)}%)`
                                    ];

                                    if (chartType === 'line') {
                                        baseInfo.push(`Km Média: ${SGVUtils.formatNumber(data.km_media)} km`);
                                        baseInfo.push(`Horas/Mês: ${SGVUtils.formatNumber(data.horas_mes_media, 1)}h`);
                                    } else {
                                        baseInfo.push(`Críticos: ${data.veiculos_criticos} | Atenção: ${data.veiculos_atencao} | Adequados: ${data.veiculos_adequados}`);
                                    }

                                    return baseInfo;
                                },
                                title: (context) => {
                                    return `📊 ${context[0].label}`;
                                }
                            }
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            max: 100,
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            },
                            ticks: {
                                callback: function (value) {
                                    return value + '%';
                                }
                            }
                        },
                        x: {
                            grid: {
                                color: 'rgba(0, 0, 0, 0.1)'
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('❌ Erro ao criar gráfico vida útil:', error);
        }
    }

    /**
     * Gráfico alternativo quando Chart.js não está disponível
     */
    renderVidaUtilFallback(vidaUtilCategoria) {
        const container = document.getElementById('chart-vida-util').parentElement;

        // Remover canvas e criar div alternativo
        const canvas = document.getElementById('chart-vida-util');
        canvas.style.display = 'none';

        let fallbackDiv = container.querySelector('.chart-fallback');
        if (!fallbackDiv) {
            fallbackDiv = document.createElement('div');
            fallbackDiv.className = 'chart-fallback';
            container.appendChild(fallbackDiv);
        }

        // Criar gráfico em HTML/CSS
        fallbackDiv.innerHTML = `
            <div style="padding: 20px; border: 1px solid #ddd; border-radius: 8px; background: #f9f9f9;">
                <h4 style="margin: 0 0 15px 0; color: #333;">📊 Vida Útil por Categoria</h4>
                <div style="display: grid; gap: 10px;">
                    ${vidaUtilCategoria.map(item => {
            const color = item.nota_media >= 80 ? '#16a34a' :
                item.nota_media >= 60 ? '#eab308' : '#dc2626';
            const width = Math.max(item.nota_media, 5); // Mínimo 5% para visibilidade

            return `
                            <div style="display: flex; align-items: center; gap: 10px;">
                                <div style="min-width: 100px; font-weight: bold;">${item.categoria}</div>
                                <div style="flex: 1; background: #e5e5e5; border-radius: 4px; height: 24px; position: relative;">
                                    <div style="background: ${color}; height: 100%; width: ${width}%; border-radius: 4px; display: flex; align-items: center; justify-content: flex-end; padding-right: 8px;">
                                        <span style="color: white; font-size: 12px; font-weight: bold;">${item.nota_media.toFixed(1)}%</span>
                                    </div>
                                </div>
                                <div style="min-width: 60px; font-size: 12px; color: #666;">${item.total_veiculos} veículos</div>
                            </div>
                        `;
        }).join('')}
                </div>
                <div style="margin-top: 15px; font-size: 12px; color: #888;">
                    ⚠️ Gráfico simplificado (Chart.js não disponível)
                </div>
            </div>
        `;

        console.log('✅ Gráfico alternativo renderizado');
    }

    /**
     * Renderiza as tabelas
     */
    renderTables() {
        try {
            this.renderVidaUtilDetalhadaTable();
            this.renderFipeTable();
            this.renderTopRodadosTable();
            this.renderTopHorasTable();
            this.renderTopManutencoesTable();
        } catch (error) {
            console.error('❌ Erro ao renderizar tabelas:', error);
            throw error;
        }
    }

    /**
     * Tabela Detalhada de Vida Útil por Categoria
     */
    renderVidaUtilDetalhadaTable() {
        const tbody = document.querySelector('#table-vida-util-detalhada tbody');
        const { vidaUtilCategoria } = this.data;

        if (!tbody) {
            console.error('❌ Elemento #table-vida-util-detalhada tbody não encontrado');
            return;
        }

        if (!vidaUtilCategoria) {
            console.error('❌ Dados vidaUtilCategoria não encontrados');
            return;
        }

        if (typeof SGVUtils === 'undefined') {
            console.error('❌ SGVUtils não está definido');
            return;
        }

        tbody.innerHTML = '';

        vidaUtilCategoria.forEach(item => {
            const row = document.createElement('tr');

            // Calcular percentual de ativos
            const pctAtivos = item.total_veiculos > 0 ?
                ((item.veiculos_ativos / item.total_veiculos) * 100).toFixed(1) : 0;

            // Criar distribuição de status
            const statusHtml = `
                <div class="status-breakdown">
                    <span class="status-item critico" title="Crítico: ${item.veiculos_criticos}">
                        ${item.veiculos_criticos}
                    </span>
                    <span class="status-item atencao" title="Atenção: ${item.veiculos_atencao}">
                        ${item.veiculos_atencao}
                    </span>
                    <span class="status-item adequado" title="Adequado: ${item.veiculos_adequados}">
                        ${item.veiculos_adequados}
                    </span>
                </div>
            `;

            // Classe de cor baseada na nota média
            const notaClass = item.nota_media >= 80 ? 'adequado' :
                item.nota_media >= 60 ? 'atencao' : 'critico';

            row.innerHTML = `
                <td><strong>${item.categoria}</strong></td>
                <td class="vida-util-cell ${notaClass}">
                    <strong>${item.nota_media}%</strong>
                </td>
                <td>${SGVUtils.formatNumber(item.total_veiculos)}</td>
                <td>
                    ${SGVUtils.formatNumber(item.veiculos_ativos)} 
                    <span class="text-muted">(${pctAtivos}%)</span>
                </td>
                <td>${statusHtml}</td>
                <td>${SGVUtils.formatNumber(item.km_media)} km</td>
                <td>${SGVUtils.formatNumber(item.horas_mes_media, 1)}h</td>
                <td>${SGVUtils.formatNumber(item.manutencoes_6m_media, 1)}</td>
            `;
            tbody.appendChild(row);
        });
    }

    /**
     * Tabela FIPE por Categoria
     */
    renderFipeTable() {
        const tbody = document.querySelector('#table-fipe tbody');
        const { fipeCategoria } = this.data;

        tbody.innerHTML = '';

        fipeCategoria.forEach(item => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><strong>${item.categoria}</strong></td>
                <td>${SGVUtils.formatCurrency(item.valor_fipe_medio)}</td>
                <td><strong>${SGVUtils.formatCurrency(item.valor_fipe_total)}</strong></td>
            `;
            tbody.appendChild(row);
        });

        // Adicionar total
        const valorTotal = fipeCategoria.reduce((sum, item) => sum + item.valor_fipe_total, 0);
        const totalRow = document.createElement('tr');
        totalRow.style.backgroundColor = 'var(--bg-secondary)';
        totalRow.style.fontWeight = 'bold';
        totalRow.innerHTML = `
            <td><strong>TOTAL DA FROTA</strong></td>
            <td>-</td>
            <td><strong>${SGVUtils.formatCurrency(valorTotal)}</strong></td>
        `;
        tbody.appendChild(totalRow);
    }

    /**
     * Tabela TOP 10 Mais Rodados
     */
    renderTopRodadosTable() {
        const tbody = document.querySelector('#table-top-rodados tbody');
        const { topRodados } = this.data;

        tbody.innerHTML = '';

        topRodados.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <span class="ranking-position">${index + 1}º</span>
                    <strong>${item.prefixo}</strong>
                </td>
                <td>${item.categoria}</td>
                <td><strong>${SGVUtils.formatNumber(item.valor)} km</strong></td>
            `;
            tbody.appendChild(row);
        });
    }

    /**
     * Tabela TOP Mais Horas
     */
    renderTopHorasTable() {
        const tbody = document.querySelector('#table-top-horas tbody');
        const { topHoras } = this.data;

        tbody.innerHTML = '';

        topHoras.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <span class="ranking-position">${index + 1}º</span>
                    <strong>${item.prefixo}</strong>
                </td>
                <td>${item.categoria}</td>
                <td><strong>${SGVUtils.formatNumber(item.valor)}h</strong></td>
            `;
            tbody.appendChild(row);
        });
    }

    /**
     * Tabela TOP Mais Manutenções
     */
    renderTopManutencoesTable() {
        const tbody = document.querySelector('#table-top-manutencoes tbody');
        const { topManutencoes } = this.data;

        tbody.innerHTML = '';

        topManutencoes.forEach((item, index) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>
                    <span class="ranking-position">${index + 1}º</span>
                    <strong>${item.prefixo}</strong>
                </td>
                <td>${item.categoria}</td>
                <td><strong>${item.valor}</strong></td>
            `;
            tbody.appendChild(row);
        });
    }

    /**
     * Renderiza recomendações de descarte
     */
    renderRecommendations() {
        const container = document.getElementById('recommendations-container');
        const { recomendacoes } = this.data;

        container.innerHTML = '';

        if (recomendacoes.length === 0) {
            container.innerHTML = `
                <div class="empty-state">
                    <p>✅ Nenhuma recomendação de descarte no momento.</p>
                    <p class="text-muted">Todos os veículos estão dentro dos parâmetros aceitáveis.</p>
                </div>
            `;
            return;
        }

        recomendacoes.forEach(rec => {
            const item = document.createElement('div');
            item.className = 'recommendation-item';

            const notaClass = SGVUtils.getOcupacaoClass(rec.nota_ocupacao < 60 ? 'Crítico' : 'Atenção');

            item.innerHTML = `
                <div class="recommendation-header">
                    <div class="recommendation-title">
                        🚓 ${rec.prefixo} - ${rec.placa}
                        <span class="vehicle-category">(${rec.categoria})</span>
                    </div>
                    <span class="recommendation-nota ${notaClass}">
                        Nota: ${rec.nota_ocupacao}
                    </span>
                </div>
                <div class="recommendation-org">
                    <strong>Organização:</strong> ${rec.organizacao_nome}
                </div>
                <div class="recommendation-motivo">
                    <strong>Motivo:</strong> ${rec.motivo}
                </div>
                <div class="recommendation-impacto">
                    <strong>Impacto:</strong> ${rec.impacto}
                </div>
            `;

            container.appendChild(item);
        });

        // Adicionar estatísticas
        const stats = document.createElement('div');
        stats.className = 'recommendations-stats';
        stats.innerHTML = `
            <p><strong>Total de recomendações:</strong> ${recomendacoes.length} veículos</p>
            <p class="text-muted">Representa ${((recomendacoes.length / this.data.kpis.frota_total) * 100).toFixed(1)}% da frota total</p>
        `;
        container.appendChild(stats);
    }

    /**
     * Atualiza dados do dashboard
     */
    async refresh() {
        try {
            console.log('🔄 Atualizando dashboard...');
            await this.loadData();

            this.renderKPIs();
            this.renderCharts();
            this.renderTables();
            this.renderRecommendations();

            SGVUtils.showToast('Dashboard atualizado', 'success');

        } catch (error) {
            console.error('Erro ao atualizar dashboard:', error);
            SGVUtils.showToast('Erro ao atualizar dashboard', 'error');
        }
    }

    /**
     * Exporta dados para CSV
     */
    exportTopRodados() {
        const { topRodados } = this.data;
        const csv = this.arrayToCSV(topRodados, [
            { key: 'prefixo', label: 'Prefixo' },
            { key: 'placa', label: 'Placa' },
            { key: 'categoria', label: 'Categoria' },
            { key: 'organizacao_nome', label: 'Organização' },
            { key: 'valor', label: 'Quilometragem' }
        ]);

        SGVUtils.downloadData(csv, 'top_veiculos_rodados.csv', 'text/csv');
    }

    /**
     * Exporta recomendações para CSV
     */
    exportRecomendacoes() {
        const { recomendacoes } = this.data;
        const csv = this.arrayToCSV(recomendacoes, [
            { key: 'prefixo', label: 'Prefixo' },
            { key: 'placa', label: 'Placa' },
            { key: 'categoria', label: 'Categoria' },
            { key: 'organizacao_nome', label: 'Organização' },
            { key: 'nota_ocupacao', label: 'Nota de Ocupação' },
            { key: 'motivo', label: 'Motivo' },
            { key: 'impacto', label: 'Impacto' }
        ]);

        SGVUtils.downloadData(csv, 'recomendacoes_descarte.csv', 'text/csv');
    }

    /**
     * Converte array para CSV
     */
    arrayToCSV(array, columns) {
        const headers = columns.map(col => col.label).join(',');
        const rows = array.map(item =>
            columns.map(col => {
                const value = item[col.key] || '';
                return `"${value.toString().replace(/"/g, '""')}"`;
            }).join(',')
        );

        return [headers, ...rows].join('\n');
    }

    /**
     * Imprime dashboard
     */
    print() {
        window.print();
    }

    /**
     * Obtém estatísticas resumidas
     */
    getSummaryStats() {
        const { kpis, recomendacoes, topRodados, topManutencoes } = this.data;

        return {
            frota_total: kpis.frota_total,
            veiculos_ativos: Math.round(kpis.frota_total * kpis.pct_ativos / 100),
            recomendacoes_descarte: recomendacoes.length,
            maior_quilometragem: topRodados[0]?.valor || 0,
            mais_manutencoes: topManutencoes[0]?.valor || 0,
            vida_util_media: kpis.vida_util_media
        };
    }

    /**
     * Destroi gráficos e limpa dados
     */
    destroy() {
        console.log('🧹 Limpando dashboard...');

        // Destruir todos os gráficos
        Object.entries(this.charts).forEach(([key, chart]) => {
            if (chart) {
                try {
                    chart.destroy();
                    console.log(`🗑️ Gráfico ${key} destruído`);
                } catch (error) {
                    console.warn(`⚠️ Erro ao destruir gráfico ${key}:`, error);
                }
            }
        });

        // Limpar canvas fallback se existir
        const chartContainer = document.getElementById('chart-vida-util')?.parentElement;
        if (chartContainer) {
            const fallback = chartContainer.querySelector('.chart-fallback');
            if (fallback) {
                fallback.remove();
                console.log('🗑️ Gráfico fallback removido');
            }
        }

        // Resetar estado
        this.charts = {};
        this.data = {};
        this.initialized = false;
        this.lastRenderTime = 0;

        console.log('✅ Dashboard limpo');
    }
}

// ====== CONTROLE DA INTERFACE DASHBOARD ======

let sgvDashboard = null;
let dashboardInitializing = false;

/**
 * Aguarda Chart.js carregar ou tenta carregá-lo dinamicamente
 */
async function waitForChartJS(timeout = 10000) {
    return new Promise((resolve, reject) => {
        // Se já está carregado, resolver imediatamente
        if (typeof Chart !== 'undefined') {
            resolve();
            return;
        }

        console.log('⏳ Aguardando Chart.js carregar...');

        let attempts = 0;
        const maxAttempts = timeout / 100;

        const checkInterval = setInterval(() => {
            attempts++;

            if (typeof Chart !== 'undefined') {
                console.log('✅ Chart.js carregado após', attempts * 100, 'ms');
                clearInterval(checkInterval);
                resolve();
                return;
            }

            if (attempts >= maxAttempts) {
                clearInterval(checkInterval);
                console.warn('⚠️ Timeout aguardando Chart.js, tentando carregar dinamicamente...');

                // Tentar carregar dinamicamente
                loadChartJSDynamically()
                    .then(resolve)
                    .catch(reject);
            }
        }, 100);
    });
}

/**
 * Carrega Chart.js dinamicamente
 */
function loadChartJSDynamically() {
    return new Promise((resolve, reject) => {
        console.log('🔄 Carregando Chart.js dinamicamente...');

        const script = document.createElement('script');
        script.src = 'https://cdnjs.cloudflare.com/ajax/libs/Chart.js/4.4.0/chart.min.js';
        script.async = true;

        script.onload = () => {
            console.log('✅ Chart.js carregado dinamicamente');
            resolve();
        };

        script.onerror = () => {
            console.error('❌ Falha ao carregar Chart.js dinamicamente');
            // Tentar um último CDN
            const fallbackScript = document.createElement('script');
            fallbackScript.src = 'https://unpkg.com/chart.js@4.4.0/dist/chart.min.js';
            fallbackScript.async = true;

            fallbackScript.onload = () => {
                console.log('✅ Chart.js carregado via CDN fallback');
                resolve();
            };

            fallbackScript.onerror = () => {
                console.error('❌ Falha no CDN fallback, tentando versão local...');
                // Tentar carregar versão local se existir
                const localScript = document.createElement('script');
                localScript.src = '/static/assets/libs/chart.min.js';
                localScript.async = true;

                localScript.onload = () => {
                    console.log('✅ Chart.js carregado via arquivo local');
                    resolve();
                };

                localScript.onerror = () => {
                    reject(new Error('Falha ao carregar Chart.js de todos os CDNs e arquivo local'));
                };

                document.head.appendChild(localScript);
            };

            document.head.appendChild(fallbackScript);
        };

        document.head.appendChild(script);
    });
}

/**
 * Inicializa a aba Dashboard
 */
async function initDashboard() {
    // Prevenir múltiplas inicializações simultâneas
    if (dashboardInitializing) {
        console.log('⚠️ Dashboard já está sendo inicializado, aguardando...');
        return;
    }

    if (sgvDashboard && sgvDashboard.initialized) {
        console.log('ℹ️ Dashboard já está inicializado');
        return;
    }

    dashboardInitializing = true;
    console.log('📊 Inicializando Dashboard...');

    try {
        // Verificar dependências
        console.log('🔍 Verificando dependências...');

        // Aguardar Chart.js carregar se necessário
        await waitForChartJS();
        console.log('✅ Chart.js disponível');

        if (typeof SGVUtils === 'undefined') {
            throw new Error('SGVUtils não está carregado');
        }
        console.log('✅ SGVUtils disponível');

        if (typeof SGVApi === 'undefined') {
            throw new Error('SGVApi não está carregado');
        }
        console.log('✅ SGVApi disponível');

        // Inicializar dashboard se ainda não foi
        console.log('🔧 Criando instância do dashboard...');
        if (!sgvDashboard) {
            sgvDashboard = new SGVDashboard();
            console.log('✅ Instância SGVDashboard criada');
        } else {
            console.log('ℹ️ Usando instância existente do SGVDashboard');
        }

        console.log('⚡ Iniciando dashboard...');
        await sgvDashboard.init();

        // Configurar eventos
        console.log('🎮 Configurando eventos...');
        setupDashboardEvents();

        console.log('✅ Dashboard inicializado com sucesso');

    } catch (error) {
        console.error('❌ Erro ao inicializar Dashboard:', error);
        console.error('📍 Stack trace:', error.stack);

        // Verificar se SGVUtils está disponível antes de usar
        if (typeof SGVUtils !== 'undefined') {
            SGVUtils.showToast('Erro ao inicializar Dashboard: ' + error.message, 'error');
        } else {
            alert('Erro ao inicializar Dashboard: ' + error.message);
        }
    } finally {
        dashboardInitializing = false;
    }
}

/**
 * Configura eventos do dashboard
 */
function setupDashboardEvents() {
    // Auto-refresh periódico (5 minutos)
    setInterval(async () => {
        if (sgvDashboard && document.querySelector('#tab-dashboard.active')) {
            await sgvDashboard.refresh();
        }
    }, 5 * 60 * 1000);

    // Eventos de export (se houver botões)
    const exportButtons = document.querySelectorAll('[data-export]');
    exportButtons.forEach(button => {
        button.addEventListener('click', (e) => {
            const exportType = e.target.dataset.export;

            switch (exportType) {
                case 'top-rodados':
                    sgvDashboard.exportTopRodados();
                    break;
                case 'recomendacoes':
                    sgvDashboard.exportRecomendacoes();
                    break;
                case 'print':
                    sgvDashboard.print();
                    break;
            }
        });
    });

    // Adicionar botões de ação se não existirem
    addDashboardActionButtons();
}

/**
 * Adiciona botões de ação ao dashboard
 */
function addDashboardActionButtons() {
    // Botão de refresh no header dos KPIs
    const kpisSection = document.querySelector('.kpis-section');
    if (kpisSection && !kpisSection.querySelector('.refresh-btn')) {
        const refreshBtn = document.createElement('button');
        refreshBtn.className = 'btn btn-secondary btn-sm refresh-btn';
        refreshBtn.innerHTML = '🔄 Atualizar';
        refreshBtn.style.position = 'absolute';
        refreshBtn.style.top = '10px';
        refreshBtn.style.right = '10px';
        refreshBtn.onclick = () => sgvDashboard.refresh();

        kpisSection.style.position = 'relative';
        kpisSection.appendChild(refreshBtn);
    }

    // Botões de export nas tabelas
    const tables = [
        { id: 'table-top-rodados', export: 'top-rodados', label: '📥 Exportar CSV' },
        { id: 'recommendations-container', export: 'recomendacoes', label: '📥 Exportar Recomendações' }
    ];

    tables.forEach(({ id, export: exportType, label }) => {
        const container = document.getElementById(id);
        if (container && !container.querySelector('.export-btn')) {
            const parent = container.closest('.dashboard-section, .ranking-card');
            if (parent) {
                const header = parent.querySelector('.section-header');
                if (header) {
                    const exportBtn = document.createElement('button');
                    exportBtn.className = 'btn btn-secondary btn-sm export-btn';
                    exportBtn.innerHTML = label;
                    exportBtn.style.float = 'right';
                    exportBtn.onclick = () => {
                        if (exportType === 'top-rodados') {
                            sgvDashboard.exportTopRodados();
                        } else if (exportType === 'recomendacoes') {
                            sgvDashboard.exportRecomendacoes();
                        }
                    };

                    header.appendChild(exportBtn);
                }
            }
        }
    });
}

/**
 * Atualiza dashboard manualmente
 */
async function refreshDashboard() {
    if (sgvDashboard) {
        await sgvDashboard.refresh();
    }
}

/**
 * Reinicializa dashboard completamente
 */
async function reinitDashboard() {
    console.log('🔄 Reinicializando dashboard completamente...');

    // Limpar estado global
    dashboardInitializing = false;

    // Destruir instância atual se existir
    if (sgvDashboard) {
        sgvDashboard.destroy();
        sgvDashboard = null;
    }

    // Aguardar um pouco para evitar conflitos
    await new Promise(resolve => setTimeout(resolve, 200));

    // Inicializar novamente
    await initDashboard();
}

/**
 * Obtém resumo das estatísticas
 */
function getDashboardSummary() {
    if (sgvDashboard) {
        return sgvDashboard.getSummaryStats();
    }
    return null;
}

// Adicionar estilos específicos do dashboard
const dashboardStyles = `
    .ranking-position {
        display: inline-block;
        background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
        color: white;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        text-align: center;
        line-height: 24px;
        font-size: 0.75rem;
        font-weight: bold;
        margin-right: 8px;
    }
    
    .vehicle-category {
        color: var(--text-muted);
        font-weight: normal;
        font-size: 0.875rem;
    }
    
    .recommendations-stats {
        margin-top: var(--spacing-lg);
        padding: var(--spacing-md);
        background-color: var(--bg-secondary);
        border-radius: var(--border-radius);
        border-left: 4px solid var(--primary-color);
    }
    
    .empty-state {
        text-align: center;
        padding: var(--spacing-xl);
        color: var(--text-secondary);
    }
    
    .empty-state p:first-child {
        font-size: 1.125rem;
        margin-bottom: var(--spacing-md);
    }
    
    .status.ativo {
        color: var(--success-color);
    }
    
    .status.inativo {
        color: var(--danger-color);
    }
    
    .recommendations-stats strong {
        color: var(--text-primary);
    }
    
    .export-btn, .refresh-btn {
        margin-left: var(--spacing-md);
    }
    
    .status-breakdown {
        display: flex;
        gap: 4px;
        justify-content: center;
        flex-wrap: wrap;
    }
    
    .status-item {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 12px;
        font-size: 0.75rem;
        font-weight: bold;
        color: white;
        min-width: 20px;
        text-align: center;
    }
    
    .status-item.critico {
        background-color: var(--danger-color, #dc2626);
    }
    
    .status-item.atencao {
        background-color: var(--warning-color, #eab308);
        color: #1f2937;
    }
    
    .status-item.adequado {
        background-color: var(--success-color, #16a34a);
    }
    
    .vida-util-cell {
        text-align: center;
    }
    
    .vida-util-cell.critico {
        background-color: rgba(220, 38, 38, 0.1);
        color: var(--danger-color, #dc2626);
    }
    
    .vida-util-cell.atencao {
        background-color: rgba(234, 179, 8, 0.1);
        color: var(--warning-color, #eab308);
    }
    
    .vida-util-cell.adequado {
        background-color: rgba(22, 163, 74, 0.1);
        color: var(--success-color, #16a34a);
    }
    
    .text-muted {
        color: var(--text-muted, #6b7280);
        font-size: 0.875rem;
    }
    
    .chart-controls {
        display: flex;
        gap: 8px;
        align-items: center;
    }
    
    .section-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-md, 16px);
    }
    
    .section-header h3,
    .section-header h4 {
        margin: 0;
    }
    
    #chart-type-toggle {
        transition: all 0.2s ease;
        font-size: 0.875rem;
        padding: 6px 12px;
        border-radius: 6px;
        border: 1px solid var(--border-color, #d1d5db);
        background: var(--bg-primary, #ffffff);
        color: var(--text-primary, #374151);
        cursor: pointer;
    }
    
    #chart-type-toggle:hover {
        background: var(--bg-secondary, #f9fafb);
        transform: translateY(-1px);
        box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }
    
    #chart-type-toggle:active {
        transform: translateY(0);
    }
    
    @media print {
        .export-btn, .refresh-btn, .btn {
            display: none !important;
        }
        
        .dashboard-section {
            break-inside: avoid;
            margin-bottom: var(--spacing-lg);
        }
        
        .kpis-section {
            display: grid !important;
            grid-template-columns: repeat(2, 1fr) !important;
        }
    }
`;

// Adicionar estilos ao documento
if (!document.querySelector('#dashboard-styles')) {
    const style = document.createElement('style');
    style.id = 'dashboard-styles';
    style.textContent = dashboardStyles;
    document.head.appendChild(style);
}

// Função de teste para debug
window.testDashboard = async function () {
    console.log('🧪 === TESTE MANUAL DO DASHBOARD ===');

    // 1. Verificar dependências
    console.log('1️⃣ Verificando dependências...');
    console.log('  Chart.js:', typeof Chart !== 'undefined' ? '✅' : '❌');
    console.log('  SGVUtils:', typeof SGVUtils !== 'undefined' ? '✅' : '❌');
    console.log('  SGVApi:', typeof SGVApi !== 'undefined' ? '✅' : '❌');

    // 2. Verificar elementos DOM
    console.log('2️⃣ Verificando elementos DOM...');
    const dashboardTab = document.getElementById('tab-dashboard');
    const kpiElements = ['kpi-frota-total', 'kpi-pct-ativos', 'kpi-vida-util', 'kpi-horas-mes'];
    const chartElement = document.getElementById('chart-vida-util');

    console.log('  Tab dashboard:', dashboardTab ? '✅' : '❌');
    console.log('  Chart element:', chartElement ? '✅' : '❌');
    kpiElements.forEach(id => {
        const el = document.getElementById(id);
        console.log(`  ${id}:`, el ? '✅' : '❌');
    });

    // 3. Testar APIs
    console.log('3️⃣ Testando APIs...');
    try {
        const kpis = await SGVApi.api.getKPIs();
        console.log('  API KPIs:', kpis ? '✅' : '❌', kpis);

        const vidaUtil = await SGVApi.api.getVidaUtilPorCategoria();
        console.log('  API Vida Útil:', vidaUtil ? '✅' : '❌', vidaUtil?.length, 'categorias');
    } catch (error) {
        console.log('  APIs:', '❌', error.message);
    }

    // 4. Testar inicialização
    console.log('4️⃣ Testando inicialização do dashboard...');
    try {
        await initDashboard();
        console.log('  Inicialização:', '✅');
    } catch (error) {
        console.log('  Inicialização:', '❌', error.message);
    }

    console.log('🏁 Teste concluído!');
};

// Exportar para uso global
window.initDashboard = initDashboard;
window.refreshDashboard = refreshDashboard;
window.reinitDashboard = reinitDashboard;
window.getDashboardSummary = getDashboardSummary;
