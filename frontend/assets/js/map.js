/**
 * Módulo do mapa SIGWEB - Leaflet
 */

class SGVMap {
    constructor(containerId) {
        this.containerId = containerId;
        this.map = null;
        this.layers = {
            batalhoes: null,
            bases: null,
            viaturas: null
        };
        this.layerControls = {};
        this.currentFilters = {};
        this.initialized = false;

        // Configurações padrão
        this.defaultCenter = [-23.550520, -46.633308]; // Centro de SP
        this.defaultZoom = 10;

        // Estilos das camadas
        this.styles = {
            batalhao: {
                color: '#2563eb',
                weight: 2,
                fillOpacity: 0.1,
                fillColor: '#2563eb'
            },
            base: {
                radius: 8,
                fillColor: '#16a34a',
                color: '#000',
                weight: 1,
                opacity: 1,
                fillOpacity: 0.8
            },
            viatura: {
                critical: {
                    fillColor: '#dc2626',
                    color: '#991b1b',
                    radius: 8,
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                },
                warning: {
                    fillColor: '#eab308',
                    color: '#a16207',
                    radius: 8,
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                },
                good: {
                    fillColor: '#16a34a',
                    color: '#15803d',
                    radius: 8,
                    weight: 2,
                    opacity: 1,
                    fillOpacity: 0.8
                }
            }
        };
    }

    /**
     * Inicializa o mapa
     */
    async init() {
        try {
            if (this.initialized) return;

            console.log('📍 Inicializando mapa...');

            // Criar mapa Leaflet
            this.map = L.map(this.containerId, {
                center: this.defaultCenter,
                zoom: this.defaultZoom,
                zoomControl: true,
                attributionControl: true
            });

            // Adicionar tile layer (OpenStreetMap)
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors',
                maxZoom: 18
            }).addTo(this.map);

            // Inicializar camadas
            this.initLayers();

            // Configurar eventos
            this.setupEvents();

            // Carregar dados iniciais
            await this.loadInitialData();

            this.initialized = true;
            console.log('✅ Mapa inicializado com sucesso');

        } catch (error) {
            console.error('❌ Erro ao inicializar mapa:', error);
            SGVUtils.showToast('Erro ao carregar mapa', 'error');
        }
    }

    /**
     * Inicializa as camadas do mapa
     */
    initLayers() {
        // Criar grupos de camadas
        this.layers.batalhoes = L.layerGroup().addTo(this.map);
        this.layers.bases = L.layerGroup().addTo(this.map);
        this.layers.viaturas = L.layerGroup().addTo(this.map);

        // Vincular checkboxes aos layer controls
        this.layerControls = {
            batalhoes: document.getElementById('layer-batalhoes'),
            bases: document.getElementById('layer-bases'),
            viaturas: document.getElementById('layer-viaturas')
        };

        // Configurar eventos dos checkboxes
        Object.entries(this.layerControls).forEach(([layerName, checkbox]) => {
            if (checkbox) {
                checkbox.addEventListener('change', (e) => {
                    this.toggleLayer(layerName, e.target.checked);
                });
            }
        });
    }

    /**
     * Configura eventos do mapa
     */
    setupEvents() {
        // Evento de zoom
        this.map.on('zoomend', () => {
            this.updateMarkersVisibility();
        });

        // Evento de movimento
        this.map.on('moveend', () => {
            // Pode ser usado para carregar dados por região
        });
    }

    /**
     * Carrega dados iniciais
     */
    async loadInitialData() {
        try {
            SGVUtils.showLoading();

            // Carregar em paralelo
            const [batalhoes, bases, viaturas] = await Promise.all([
                SGVApi.api.getGeoBatalhoes(),
                SGVApi.api.getGeoBases(),
                SGVApi.api.getGeoViaturas()
            ]);

            // Adicionar às camadas
            this.addBatalhoesLayer(batalhoes);
            this.addBasesLayer(bases);
            this.addViaturasLayer(viaturas);

            // Atualizar cores da legenda e estatísticas
            this.updateLegendColors();
            this.updateLegendStats();

        } catch (error) {
            console.error('Erro ao carregar dados iniciais:', error);
            SGVUtils.showToast('Erro ao carregar dados do mapa', 'error');
        } finally {
            SGVUtils.hideLoading();
        }
    }

    /**
 * Adiciona camada de batalhões (polígonos)
 */
    addBatalhoesLayer(geojson) {
        if (!geojson || !geojson.features) return;

        geojson.features.forEach(feature => {
            const layer = L.geoJSON(feature, {
                style: this.styles.batalhao,
                onEachFeature: (feature, layer) => {
                    const props = feature.properties;
                    const popupContent = `
                        <div class="popup-content">
                            <h4>🏛️ ${props.batalhao_nome}</h4>
                            <p><strong>📍 Município:</strong> ${props.municipio}</p>
                            <p><strong>📊 Tipo:</strong> Área de Atuação</p>
                        </div>
                    `;
                    layer.bindPopup(popupContent, { maxWidth: 300 });
                }
            });

            this.layers.batalhoes.addLayer(layer);
        });
    }

    /**
 * Adiciona camada de bases (pontos)
 */
    addBasesLayer(geojson) {
        if (!geojson || !geojson.features) return;

        geojson.features.forEach(feature => {
            const props = feature.properties;
            const coords = feature.geometry.coordinates;

            const marker = L.circleMarker([coords[1], coords[0]], {
                ...this.styles.base,
                radius: 10
            });

            const popupContent = `
                <div class="popup-content">
                    <h4>🏢 ${props.batalhao_nome}</h4>
                    <p><strong>📍 Município:</strong> ${props.municipio}</p>
                    <p><strong>🏛️ Tipo:</strong> Base/Batalhão</p>
                    <p><strong>📍 Coordenadas:</strong> ${coords[1].toFixed(4)}°, ${coords[0].toFixed(4)}°</p>
                </div>
            `;

            marker.bindPopup(popupContent, { maxWidth: 300 });
            this.layers.bases.addLayer(marker);
        });
    }

    /**
 * Adiciona camada de viaturas (pontos)
 */
    addViaturasLayer(geojson) {
        if (!geojson || !geojson.features) return;

        geojson.features.forEach(feature => {
            const props = feature.properties;
            const coords = feature.geometry.coordinates;

            // Determinar estilo baseado na nota de ocupação
            const nota = props.nota_ocupacao || 0;
            const faixaKey = this.getNotaFaixaKey(nota);
            const style = this.styles.viatura[faixaKey];

            const marker = L.circleMarker([coords[1], coords[0]], {
                ...style
            });

            // Popup detalhado
            const popupContent = this.createViaturaPopopup(props);
            marker.bindPopup(popupContent, { maxWidth: 400 });

            // Armazenar propriedades no marker para filtragem
            marker.properties = props;

            this.layers.viaturas.addLayer(marker);
        });
    }

    /**
     * Determina a chave da faixa baseada na nota de ocupação
     */
    getNotaFaixaKey(nota) {
        if (nota < 60) return 'critical';
        if (nota < 80) return 'warning';
        return 'good';
    }

    /**
 * Cria popup detalhado para viatura
 */
    createViaturaPopopup(props) {
        const notaBadge = this.createEnhancedNotaBadge(props.nota_ocupacao, props.faixa_ocupacao);
        const statusIcon = props.ativo ? '✅' : '❌';
        const statusText = props.ativo ? 'Ativo' : 'Inativo';

        return `
            <div class="popup-content viatura-popup">
                <div class="popup-header">
                    <h4>🚓 ${props.prefixo}</h4>
                    <div class="nota-badge">${notaBadge}</div>
                </div>
                
                <div class="popup-body">
                    <div class="info-grid">
                        <div class="info-item">
                            <strong>Placa:</strong>
                            <span>${props.placa}</span>
                        </div>
                        <div class="info-item">
                            <strong>Categoria:</strong>
                            <span>${props.categoria}</span>
                        </div>
                        <div class="info-item">
                            <strong>Organização:</strong>
                            <span>${props.organizacao}</span>
                        </div>
                        <div class="info-item">
                            <strong>Local:</strong>
                            <span>${props.municipio} - ${props.bairro}</span>
                        </div>
                        <div class="info-item">
                            <strong>Área:</strong>
                            <span>${props.area_atuacao}</span>
                        </div>
                        <div class="info-item">
                            <strong>Odômetro:</strong>
                            <span>${SGVUtils.formatNumber(props.odometro_km)} km</span>
                        </div>
                        <div class="info-item">
                            <strong>Horas/Mês:</strong>
                            <span>${SGVUtils.formatNumber(props.horas_mes)}h</span>
                        </div>
                        <div class="info-item">
                            <strong>Manutenções (6m):</strong>
                            <span>${props.manutencoes_6m}</span>
                        </div>
                        <div class="info-item">
                            <strong>Status:</strong>
                            <span class="status ${props.ativo ? 'ativo' : 'inativo'}">
                                ${statusIcon} ${statusText}
                            </span>
                        </div>
                    </div>
                </div>
                
                <div class="popup-actions">
                    <button class="btn btn-primary" onclick="showViaturaDetails(${props.veiculo_id})">
                        📋 Ver Detalhes
                    </button>
                    <button class="btn btn-secondary" onclick="centerOnViatura(${props.veiculo_id})">
                        🎯 Centralizar
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Cria badge de nota melhorado
     */
    createEnhancedNotaBadge(nota, faixa) {
        const className = SGVUtils.getOcupacaoClass(faixa);

        return `<span class="badge ${className}">${nota}</span>`;
    }

    /**
     * Aplica filtros ao mapa
     */
    async applyFilters(filters) {
        try {
            SGVUtils.showLoading();
            this.currentFilters = { ...filters };

            // Limpar camada de viaturas
            this.layers.viaturas.clearLayers();

            // Carregar viaturas filtradas
            const viaturas = await SGVApi.api.getGeoViaturas(filters);
            this.addViaturasLayer(viaturas);

            // Atualizar estatísticas da legenda
            this.updateLegendStats();

            // Ajustar visualização se houver filtro específico por viatura
            if (filters.viatura && viaturas.features.length === 1) {
                const feature = viaturas.features[0];
                const coords = feature.geometry.coordinates;

                // Centralizar no veículo
                this.map.setView([coords[1], coords[0]], 15);

                // Abrir popup automaticamente
                this.layers.viaturas.eachLayer(layer => {
                    if (layer.properties.veiculo_id === feature.properties.veiculo_id) {
                        setTimeout(() => layer.openPopup(), 500);
                    }
                });
            } else if (viaturas.features.length > 0) {
                // Ajustar bounds para mostrar todas as viaturas
                this.fitBoundsToViaturas();
            }

            console.log(`Filtros aplicados: ${viaturas.features.length} viaturas encontradas`);

        } catch (error) {
            console.error('Erro ao aplicar filtros:', error);
            SGVUtils.showToast('Erro ao aplicar filtros', 'error');
        } finally {
            SGVUtils.hideLoading();
        }
    }

    /**
     * Ajusta o mapa para mostrar todas as viaturas
     */
    fitBoundsToViaturas() {
        const bounds = [];

        this.layers.viaturas.eachLayer(layer => {
            bounds.push(layer.getLatLng());
        });

        if (bounds.length > 0) {
            const group = new L.featureGroup(this.layers.viaturas.getLayers());
            this.map.fitBounds(group.getBounds(), { padding: [20, 20] });
        }
    }

    /**
     * Limpa todos os filtros
     */
    async clearFilters() {
        this.currentFilters = {};
        await this.loadInitialData();

        // Voltar para visualização padrão
        this.map.setView(this.defaultCenter, this.defaultZoom);

        console.log('Filtros limpos');
    }

    /**
     * Liga/desliga camada
     */
    toggleLayer(layerName, visible) {
        const layer = this.layers[layerName];
        if (!layer) return;

        if (visible) {
            if (!this.map.hasLayer(layer)) {
                this.map.addLayer(layer);
            }
        } else {
            if (this.map.hasLayer(layer)) {
                this.map.removeLayer(layer);
            }
        }
    }

    /**
 * Atualiza visibilidade dos marcadores baseado no zoom
 */
    updateMarkersVisibility() {
        const zoom = this.map.getZoom();

        // Ajustar opacidade baseado no zoom, mas manter as cores
        this.layers.viaturas.eachLayer(layer => {
            const props = layer.properties;
            const nota = props.nota_ocupacao || 0;
            const faixaKey = this.getNotaFaixaKey(nota);
            const baseStyle = this.styles.viatura[faixaKey];

            if (zoom < 8) {
                // Zoom baixo: reduzir opacidade mas manter cores
                layer.setStyle({
                    ...baseStyle,
                    opacity: 0.3,
                    fillOpacity: 0.3
                });
            } else {
                // Zoom normal: opacidade total
                layer.setStyle({
                    ...baseStyle,
                    opacity: 1,
                    fillOpacity: 0.8
                });
            }
        });
    }

    /**
     * Busca viatura por coordenadas
     */
    findViaturaNearby(lat, lng, radiusKm = 1) {
        const nearby = [];

        this.layers.viaturas.eachLayer(layer => {
            const layerLatLng = layer.getLatLng();
            const distance = SGVUtils.calculateDistance(
                lat, lng,
                layerLatLng.lat, layerLatLng.lng
            );

            if (distance <= radiusKm) {
                nearby.push({
                    layer,
                    distance,
                    properties: layer.properties
                });
            }
        });

        return nearby.sort((a, b) => a.distance - b.distance);
    }

    /**
     * Exporta dados visíveis como GeoJSON
     */
    exportVisibleData() {
        const features = [];

        this.layers.viaturas.eachLayer(layer => {
            if (this.map.getBounds().contains(layer.getLatLng())) {
                features.push({
                    type: 'Feature',
                    geometry: {
                        type: 'Point',
                        coordinates: [layer.getLatLng().lng, layer.getLatLng().lat]
                    },
                    properties: layer.properties
                });
            }
        });

        const geojson = {
            type: 'FeatureCollection',
            features
        };

        SGVUtils.downloadData(
            JSON.stringify(geojson, null, 2),
            `viaturas_${new Date().toISOString().split('T')[0]}.geojson`,
            'application/geo+json'
        );
    }

    /**
     * Obtém estatísticas das viaturas visíveis
     */
    getVisibleStats() {
        const stats = {
            total: 0,
            por_faixa: { critical: 0, warning: 0, good: 0 },
            por_categoria: {},
            por_municipio: {}
        };

        this.layers.viaturas.eachLayer(layer => {
            if (this.map.getBounds().contains(layer.getLatLng())) {
                const props = layer.properties;
                stats.total++;

                // Por faixa
                const faixa = props.faixa_ocupacao?.toLowerCase() || 'good';
                stats.por_faixa[faixa]++;

                // Por categoria
                if (!stats.por_categoria[props.categoria]) {
                    stats.por_categoria[props.categoria] = 0;
                }
                stats.por_categoria[props.categoria]++;

                // Por município
                if (!stats.por_municipio[props.municipio]) {
                    stats.por_municipio[props.municipio] = 0;
                }
                stats.por_municipio[props.municipio]++;
            }
        });

        return stats;
    }

    /**
     * Atualiza as cores da legenda para corresponder às cores do mapa
     */
    updateLegendColors() {
        const legendColors = document.querySelectorAll('.legend-color');

        legendColors.forEach(color => {
            if (color.classList.contains('critical')) {
                color.style.backgroundColor = this.styles.viatura.critical.fillColor;
            } else if (color.classList.contains('warning')) {
                color.style.backgroundColor = this.styles.viatura.warning.fillColor;
            } else if (color.classList.contains('good')) {
                color.style.backgroundColor = this.styles.viatura.good.fillColor;
            }
        });
    }

    /**
     * Obtém estatísticas das viaturas por faixa de nota
     */
    getViaturasStats() {
        const stats = {
            critical: 0,
            warning: 0,
            good: 0,
            total: 0
        };

        this.layers.viaturas.eachLayer(layer => {
            const props = layer.properties;
            const nota = props.nota_ocupacao || 0;
            const faixaKey = this.getNotaFaixaKey(nota);

            stats[faixaKey]++;
            stats.total++;
        });

        return stats;
    }

    /**
     * Atualiza estatísticas na legenda
     */
    updateLegendStats() {
        const stats = this.getViaturasStats();
        const legendItems = document.querySelectorAll('.legend-item');

        legendItems.forEach(item => {
            const colorSpan = item.querySelector('.legend-color');
            const textSpan = item.querySelector('span:not(.legend-color)');

            if (!textSpan) return;

            let count = 0;
            if (colorSpan.classList.contains('critical')) {
                count = stats.critical;
            } else if (colorSpan.classList.contains('warning')) {
                count = stats.warning;
            } else if (colorSpan.classList.contains('good')) {
                count = stats.good;
            }

            // Adicionar contagem ao texto se ainda não existe
            const originalText = textSpan.innerHTML.split(' <small>')[0];
            const percentage = stats.total > 0 ? ((count / stats.total) * 100).toFixed(1) : '0';

            textSpan.innerHTML = `${originalText} <small>(${count} viaturas - ${percentage}%)</small>`;
        });
    }

    /**
     * Destroi o mapa
     */
    destroy() {
        if (this.map) {
            this.map.remove();
            this.map = null;
            this.initialized = false;
        }
    }
}

// ====== CONTROLE DA INTERFACE SIGWEB ======

let sgvMap = null;

/**
 * Inicializa a aba SIGWEB
 */
async function initSigweb() {
    console.log('🗺️ Inicializando SIGWEB...');

    try {
        // Inicializar mapa se ainda não foi
        if (!sgvMap) {
            sgvMap = new SGVMap('map');
            await sgvMap.init();
        }

        // Configurar filtros
        await setupFilters();

        // Configurar eventos
        setupSigwebEvents();

        console.log('✅ SIGWEB inicializado');

    } catch (error) {
        console.error('❌ Erro ao inicializar SIGWEB:', error);
        SGVUtils.showToast('Erro ao inicializar SIGWEB', 'error');
    }
}

/**
 * Configura os filtros da interface
 */
async function setupFilters() {
    try {
        // Carregar opções dos selects
        const [comandos, municipios] = await Promise.all([
            SGVApi.api.getOrganizacoes('Comando'),
            SGVApi.api.getMunicipios()
        ]);

        // Popular selects
        await SGVApi.loadSelectOptions(
            document.getElementById('filter-comando'),
            comandos,
            'Todos os comandos'
        );

        await SGVApi.loadSelectOptions(
            document.getElementById('filter-municipio'),
            municipios,
            'Todos os municípios'
        );

        // Configurar selects dependentes
        SGVApi.setupDependentSelect(
            document.getElementById('filter-comando'),
            document.getElementById('filter-unidade'),
            async (comandoNome) => {
                const unidades = await SGVApi.api.getOrganizacoes('Unidade');
                return unidades; // Filtrar por comando seria ideal
            },
            'Todas as unidades'
        );

        SGVApi.setupDependentSelect(
            document.getElementById('filter-unidade'),
            document.getElementById('filter-batalhao'),
            async (unidadeNome) => {
                const batalhoes = await SGVApi.api.getOrganizacoes('Batalhao');
                return batalhoes; // Filtrar por unidade seria ideal
            },
            'Todos os batalhões'
        );

        SGVApi.setupDependentSelect(
            document.getElementById('filter-municipio'),
            document.getElementById('filter-bairro'),
            async (municipio) => {
                return await SGVApi.api.getBairros(municipio);
            },
            'Todos os bairros'
        );

    } catch (error) {
        console.error('Erro ao configurar filtros:', error);
        SGVUtils.showToast('Erro ao carregar filtros', 'error');
    }
}

/**
 * Configura eventos da interface SIGWEB
 */
function setupSigwebEvents() {
    // Botão aplicar filtros
    document.getElementById('apply-filters').addEventListener('click', async () => {
        const filters = collectFilters();
        await sgvMap.applyFilters(filters);
    });

    // Botão limpar filtros
    document.getElementById('clear-filters').addEventListener('click', async () => {
        clearFilterForm();
        await sgvMap.clearFilters();
    });

    // Auto-aplicar filtros em mudanças (com debounce)
    const filterForm = document.querySelector('.filters-content');
    SGVApi.watchFormChanges(filterForm, async () => {
        const filters = collectFilters();
        if (Object.keys(filters).length > 0) {
            await sgvMap.applyFilters(filters);
        }
    }, 1000);
}

/**
 * Coleta valores dos filtros
 */
function collectFilters() {
    const filters = {};

    const comando = document.getElementById('filter-comando').value;
    const unidade = document.getElementById('filter-unidade').value;
    const batalhao = document.getElementById('filter-batalhao').value;
    const viatura = document.getElementById('filter-viatura').value;
    const municipio = document.getElementById('filter-municipio').value;
    const bairro = document.getElementById('filter-bairro').value;

    if (comando) filters.comando = comando;
    if (unidade) filters.unidade = unidade;
    if (batalhao) filters.batalhao = batalhao;
    if (viatura) filters.viatura = viatura;
    if (municipio) filters.municipio = municipio;
    if (bairro) filters.bairro = bairro;

    return filters;
}

/**
 * Limpa formulário de filtros
 */
function clearFilterForm() {
    document.getElementById('filter-comando').value = '';
    document.getElementById('filter-unidade').value = '';
    document.getElementById('filter-batalhao').value = '';
    document.getElementById('filter-viatura').value = '';
    document.getElementById('filter-municipio').value = '';
    document.getElementById('filter-bairro').value = '';

    // Desabilitar selects dependentes
    document.getElementById('filter-unidade').innerHTML = '<option value="">Todas as unidades</option>';
    document.getElementById('filter-batalhao').innerHTML = '<option value="">Todos os batalhões</option>';
    document.getElementById('filter-bairro').innerHTML = '<option value="">Todos os bairros</option>';
}

/**
 * Centraliza o mapa na viatura
 */
function centerOnViatura(veiculoId) {
    if (!sgvMap) return;

    let targetMarker = null;

    // Encontrar o marker da viatura
    sgvMap.layers.viaturas.eachLayer(layer => {
        if (layer.properties && layer.properties.veiculo_id === veiculoId) {
            targetMarker = layer;
        }
    });

    if (targetMarker) {
        const latLng = targetMarker.getLatLng();
        sgvMap.map.setView(latLng, 16);

        // Piscar o marker mantendo as cores da nota de ocupação
        const props = targetMarker.properties;
        const nota = props.nota_ocupacao || 0;
        const faixaKey = sgvMap.getNotaFaixaKey(nota);
        const originalStyle = sgvMap.styles.viatura[faixaKey];

        const flashStyle = {
            ...originalStyle,
            radius: 15,
            weight: 4,
            color: '#ffffff', // Borda branca para destaque
            opacity: 1,
            fillOpacity: 1
        };

        // Animação de piscar 3 vezes
        let blinkCount = 0;
        const blinkInterval = setInterval(() => {
            if (blinkCount % 2 === 0) {
                targetMarker.setStyle(flashStyle);
            } else {
                targetMarker.setStyle(originalStyle);
            }
            blinkCount++;

            if (blinkCount >= 6) {
                clearInterval(blinkInterval);
                targetMarker.setStyle(originalStyle);
            }
        }, 200);

        SGVUtils.showToast('Centralizado na viatura', 'success');
    }
}

/**
 * Mostra detalhes da viatura (chamado pelo popup)
 */
async function showViaturaDetails(veiculoId) {
    try {
        SGVUtils.showLoading();

        const veiculo = await SGVApi.api.getVeiculo(veiculoId);

        const modal = document.getElementById('veiculo-modal');
        const modalTitle = document.getElementById('modal-title');
        const modalBody = document.getElementById('modal-body');

        modalTitle.innerHTML = `🚓 ${veiculo.prefixo} - ${veiculo.placa}`;
        modalBody.innerHTML = createViaturaDetailsHTML(veiculo);

        // Adicionar botões de ação no modal se não existirem
        addModalActions(modal, veiculoId);

        modal.classList.add('show');

        // Fechar modal
        modal.querySelector('.modal-close').onclick = () => {
            modal.classList.remove('show');
        };

        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.remove('show');
            }
        };

    } catch (error) {
        console.error('Erro ao carregar detalhes:', error);
        SGVUtils.showToast('Erro ao carregar detalhes da viatura', 'error');
    } finally {
        SGVUtils.hideLoading();
    }
}

/**
 * Adiciona botões de ação ao modal
 */
function addModalActions(modal, veiculoId) {
    // Verificar se já existem botões
    let actionsDiv = modal.querySelector('.modal-actions');

    if (!actionsDiv) {
        // Criar div de ações
        actionsDiv = document.createElement('div');
        actionsDiv.className = 'modal-actions';
        actionsDiv.innerHTML = `
            <button class="btn btn-secondary" onclick="centerOnViatura(${veiculoId}); document.getElementById('veiculo-modal').classList.remove('show');">
                🎯 Centralizar no Mapa
            </button>
            <button class="btn btn-primary" onclick="document.getElementById('veiculo-modal').classList.remove('show');">
                ✅ Fechar
            </button>
        `;

        // Adicionar antes do fechamento do modal-content
        const modalContent = modal.querySelector('.modal-content');
        modalContent.appendChild(actionsDiv);
    }
}

/**
 * Cria HTML detalhado da viatura
 */
function createViaturaDetailsHTML(veiculo) {
    const notaBadge = SGVUtils.createNotaBadge(veiculo.nota_ocupacao, veiculo.faixa_ocupacao);
    const statusIcon = veiculo.ativo ? '✅' : '❌';
    const statusText = veiculo.ativo ? 'Ativo' : 'Inativo';

    return `
        <div class="veiculo-details">
            <div class="details-header">
                <div class="vehicle-info">
                    <h3>🚓 ${veiculo.prefixo}</h3>
                    <p>${veiculo.categoria} - ${veiculo.placa}</p>
                </div>
                <div class="nota-badge">${notaBadge}</div>
            </div>
            
            <div class="details-grid">
                <div class="detail-section">
                    <h4 data-section="info">Informações Gerais</h4>
                    <div class="detail-item">
                        <strong>Organização:</strong>
                        <span>${veiculo.organizacao.nome}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Localização:</strong>
                        <span>${veiculo.municipio} - ${veiculo.bairro}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Área de Atuação:</strong>
                        <span>${veiculo.area_atuacao}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Status:</strong>
                        <span class="status ${veiculo.ativo ? 'ativo' : 'inativo'}">
                            ${statusIcon} ${statusText}
                        </span>
                    </div>
                    <div class="detail-item">
                        <strong>Data de Cadastro:</strong>
                        <span>${new Date(veiculo.created_at).toLocaleDateString('pt-BR')}</span>
                    </div>
                </div>
                
                <div class="detail-section">
                    <h4 data-section="operational">Métricas Operacionais</h4>
                    <div class="detail-item">
                        <strong>Odômetro:</strong>
                        <span>${SGVUtils.formatNumber(veiculo.odometro_km)} km</span>
                    </div>
                    <div class="detail-item">
                        <strong>Horas/Mês:</strong>
                        <span>${SGVUtils.formatNumber(veiculo.horas_mes)}h</span>
                    </div>
                    <div class="detail-item">
                        <strong>Manutenções (6m):</strong>
                        <span>${veiculo.manutencoes_6m} manutenções</span>
                    </div>
                    <div class="detail-item">
                        <strong>Valor FIPE:</strong>
                        <span>${SGVUtils.formatCurrency(veiculo.valor_fipe)}</span>
                    </div>
                    <div class="detail-item">
                        <strong>Nota de Ocupação:</strong>
                        <span>${veiculo.nota_ocupacao}/100 (${veiculo.faixa_ocupacao})</span>
                    </div>
                </div>
                
                ${veiculo.latitude && veiculo.longitude ? `
                <div class="detail-section">
                    <h4 data-section="location">Localização GPS</h4>
                    <div class="detail-item">
                        <strong>Latitude:</strong>
                        <span>${veiculo.latitude.toFixed(6)}°</span>
                    </div>
                    <div class="detail-item">
                        <strong>Longitude:</strong>
                        <span>${veiculo.longitude.toFixed(6)}°</span>
                    </div>
                    <div class="detail-item">
                        <strong>Coordenadas DMS:</strong>
                        <span>${SGVUtils.toDMS(veiculo.latitude, true)}</span>
                    </div>
                    <div class="detail-item">
                        <strong></strong>
                        <span>${SGVUtils.toDMS(veiculo.longitude, false)}</span>
                    </div>
                </div>
                ` : ''}
            </div>
            
            ${veiculo.manutencoes && veiculo.manutencoes.length > 0 ? `
            <div class="detail-section">
                <h4 data-section="maintenance">Histórico de Manutenções</h4>
                <div class="manutencoes-list">
                    ${veiculo.manutencoes.slice(0, 8).map(m => `
                        <div class="manutencao-item">
                            <div class="manutencao-date">${new Date(m.data).toLocaleDateString('pt-BR')}</div>
                            <div class="manutencao-tipo">🔧 ${m.tipo}</div>
                            <div class="manutencao-custo">${SGVUtils.formatCurrency(m.custo)}</div>
                        </div>
                    `).join('')}
                    ${veiculo.manutencoes.length > 8 ? `
                        <p class="text-muted">
                            💡 Mostrando as 8 manutenções mais recentes de um total de ${veiculo.manutencoes.length}
                        </p>
                    ` : ''}
                </div>
            </div>
            ` : `
            <div class="detail-section">
                <h4 data-section="maintenance">Histórico de Manutenções</h4>
                <p class="text-muted">📝 Nenhuma manutenção registrada para este veículo.</p>
            </div>
            `}
        </div>
    `;
}

// Exportar para uso global
window.initSigweb = initSigweb;
window.showViaturaDetails = showViaturaDetails;
window.centerOnViatura = centerOnViatura;

