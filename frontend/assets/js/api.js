/**
 * Cliente da API REST
 */

class APIClient {
    constructor(baseURL = '') {
        this.baseURL = baseURL;
        this.defaultHeaders = {
            'Content-Type': 'application/json',
        };
    }

    /**
     * Faz requisição HTTP
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        const config = {
            headers: { ...this.defaultHeaders, ...options.headers },
            ...options
        };

        try {
            const response = await fetch(url, config);

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.detail || `HTTP ${response.status}: ${response.statusText}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }

            return await response.text();
        } catch (error) {
            console.error(`Erro na requisição para ${endpoint}:`, error);
            throw error;
        }
    }

    // ====== MÉTODOS HTTP ======
    async get(endpoint, params = {}) {
        const queryString = new URLSearchParams(params).toString();
        const url = queryString ? `${endpoint}?${queryString}` : endpoint;
        return this.request(url, { method: 'GET' });
    }

    async post(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
    }

    async put(endpoint, data = {}) {
        return this.request(endpoint, {
            method: 'PUT',
            body: JSON.stringify(data)
        });
    }

    async delete(endpoint) {
        return this.request(endpoint, { method: 'DELETE' });
    }

    async upload(endpoint, file, additionalData = {}) {
        const formData = new FormData();
        formData.append('file', file);

        Object.entries(additionalData).forEach(([key, value]) => {
            formData.append(key, value);
        });

        return this.request(endpoint, {
            method: 'POST',
            headers: {}, // Remove Content-Type para FormData
            body: formData
        });
    }

    // ====== ENDPOINTS DE VEÍCULOS ======
    async getVeiculos(filtros = {}) {
        return this.get('/api/veiculos', filtros);
    }

    async getVeiculo(id) {
        return this.get(`/api/veiculos/${id}`);
    }

    async getNotaOcupacao(id) {
        return this.get(`/api/veiculos/${id}/nota`);
    }

    // ====== ENDPOINTS GEO ======
    async getGeoBatalhoes(municipio = null) {
        const params = municipio ? { municipio } : {};
        return this.get('/api/geo/batalhoes', params);
    }

    async getGeoBases(municipio = null) {
        const params = municipio ? { municipio } : {};
        return this.get('/api/geo/bases', params);
    }

    async getGeoViaturas(filtros = {}) {
        return this.get('/api/geo/viaturas', filtros);
    }

    async uploadGeoJSON(tipo, file) {
        return this.upload('/api/geo/upload', file, { tipo });
    }

    // ====== ENDPOINTS DASHBOARD ======
    async getKPIs() {
        return this.get('/api/dashboard/kpis');
    }

    async getVidaUtilPorCategoria() {
        return this.get('/api/dashboard/vida_util_por_categoria');
    }

    async getFipePorCategoria() {
        return this.get('/api/dashboard/fipe_por_categoria');
    }

    async getTopRodados(limit = 10) {
        return this.get('/api/dashboard/top_rodados', { limit });
    }

    async getTopHoras(limit = 10) {
        return this.get('/api/dashboard/top_horas', { limit });
    }

    async getTopManutencoes(limit = 10) {
        return this.get('/api/dashboard/top_manutencoes', { limit });
    }

    async getRecomendacoes() {
        return this.get('/api/recomendacoes');
    }

    // ====== ENDPOINTS ORGANIZAÇÕES ======
    async getOrganizacoes(tipo = null) {
        const params = tipo ? { tipo } : {};
        return this.get('/api/organizacoes', params);
    }

    async getFilhosOrganizacao(orgId) {
        return this.get(`/api/organizacoes/${orgId}/filhos`);
    }

    // ====== ENDPOINTS ADMIN ======
    async getParametros() {
        return this.get('/api/admin/parametros');
    }

    async updateParametros(parametros) {
        return this.put('/api/admin/parametros', parametros);
    }

    // ====== ENDPOINTS UTILITÁRIOS ======
    async getMunicipios() {
        return this.get('/api/municipios');
    }

    async getBairros(municipio = null) {
        const params = municipio ? { municipio } : {};
        return this.get('/api/bairros', params);
    }

    async getCategorias() {
        return this.get('/api/categorias');
    }
}

// ====== CLASSE PARA CACHE DE DADOS ======
class DataCache {
    constructor(ttl = 5 * 60 * 1000) { // 5 minutos por padrão
        this.cache = new Map();
        this.ttl = ttl;
    }

    set(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    get(key) {
        const item = this.cache.get(key);
        if (!item) return null;

        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return null;
        }

        return item.data;
    }

    clear() {
        this.cache.clear();
    }

    delete(key) {
        this.cache.delete(key);
    }

    has(key) {
        const item = this.cache.get(key);
        if (!item) return false;

        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }
}

// ====== CLASSE PARA GERENCIAR ESTADO GLOBAL ======
class StateManager {
    constructor() {
        this.state = {};
        this.listeners = {};
    }

    setState(key, value) {
        const oldValue = this.state[key];
        this.state[key] = value;

        // Notificar listeners
        if (this.listeners[key]) {
            this.listeners[key].forEach(callback => {
                callback(value, oldValue);
            });
        }
    }

    getState(key) {
        return this.state[key];
    }

    subscribe(key, callback) {
        if (!this.listeners[key]) {
            this.listeners[key] = [];
        }
        this.listeners[key].push(callback);

        // Retornar função para cancelar subscription
        return () => {
            const index = this.listeners[key].indexOf(callback);
            if (index > -1) {
                this.listeners[key].splice(index, 1);
            }
        };
    }

    clearState() {
        this.state = {};
    }
}

// ====== INSTÂNCIAS GLOBAIS ======
const api = new APIClient();
const cache = new DataCache();
const state = new StateManager();

// ====== FUNÇÕES DE CONVENIÊNCIA ======

/**
 * Carrega dados com cache
 */
async function loadWithCache(cacheKey, apiCall, forceReload = false) {
    if (!forceReload && cache.has(cacheKey)) {
        return cache.get(cacheKey);
    }

    try {
        const data = await apiCall();
        cache.set(cacheKey, data);
        return data;
    } catch (error) {
        console.error(`Erro ao carregar ${cacheKey}:`, error);
        throw error;
    }
}

/**
 * Carrega opções para selectbox
 */
async function loadSelectOptions(selectElement, options, defaultOption = 'Selecione...') {
    selectElement.innerHTML = `<option value="">${defaultOption}</option>`;

    options.forEach(option => {
        const optionElement = document.createElement('option');
        optionElement.value = option.value || option.id || option;
        optionElement.textContent = option.label || option.nome || option;
        selectElement.appendChild(optionElement);
    });
}

/**
 * Atualiza selectbox dependente
 */
function setupDependentSelect(parentSelect, childSelect, loadFunction, defaultOption = 'Selecione...') {
    parentSelect.addEventListener('change', async (e) => {
        const parentValue = e.target.value;

        if (!parentValue) {
            childSelect.innerHTML = `<option value="">${defaultOption}</option>`;
            childSelect.disabled = true;
            return;
        }

        try {
            childSelect.disabled = true;
            childSelect.innerHTML = `<option value="">Carregando...</option>`;

            const options = await loadFunction(parentValue);
            await loadSelectOptions(childSelect, options, defaultOption);

            childSelect.disabled = false;
        } catch (error) {
            console.error('Erro ao carregar opções dependentes:', error);
            childSelect.innerHTML = `<option value="">Erro ao carregar</option>`;
            SGVUtils.showToast('Erro ao carregar opções', 'error');
        }
    });
}

/**
 * Monitora alterações em formulário
 */
function watchFormChanges(formElement, callback, debounceTime = 500) {
    const debouncedCallback = SGVUtils.debounce(callback, debounceTime);

    formElement.addEventListener('input', debouncedCallback);
    formElement.addEventListener('change', debouncedCallback);
}

/**
 * Serializa formulário para objeto
 */
function serializeForm(formElement) {
    const formData = new FormData(formElement);
    const data = {};

    for (let [key, value] of formData.entries()) {
        if (data[key]) {
            // Se já existe, converter para array
            if (!Array.isArray(data[key])) {
                data[key] = [data[key]];
            }
            data[key].push(value);
        } else {
            data[key] = value;
        }
    }

    return data;
}

/**
 * Popula formulário com dados
 */
function populateForm(formElement, data) {
    Object.entries(data).forEach(([key, value]) => {
        const field = formElement.querySelector(`[name="${key}"]`);
        if (field) {
            if (field.type === 'checkbox') {
                field.checked = !!value;
            } else if (field.type === 'radio') {
                const radio = formElement.querySelector(`[name="${key}"][value="${value}"]`);
                if (radio) radio.checked = true;
            } else {
                field.value = value || '';
            }
        }
    });
}

/**
 * Valida formulário
 */
function validateForm(formElement, rules = {}) {
    const errors = {};
    const formData = serializeForm(formElement);

    Object.entries(rules).forEach(([field, validators]) => {
        const value = formData[field];
        const fieldErrors = [];

        validators.forEach(validator => {
            if (typeof validator === 'function') {
                const result = validator(value);
                if (result !== true) {
                    fieldErrors.push(result);
                }
            } else if (typeof validator === 'object') {
                const { type, message, ...options } = validator;

                switch (type) {
                    case 'required':
                        if (!value || value.trim() === '') {
                            fieldErrors.push(message || 'Campo obrigatório');
                        }
                        break;
                    case 'min':
                        if (value && value.length < options.length) {
                            fieldErrors.push(message || `Mínimo ${options.length} caracteres`);
                        }
                        break;
                    case 'max':
                        if (value && value.length > options.length) {
                            fieldErrors.push(message || `Máximo ${options.length} caracteres`);
                        }
                        break;
                    case 'email':
                        if (value && !SGVUtils.validators.email(value)) {
                            fieldErrors.push(message || 'Email inválido');
                        }
                        break;
                }
            }
        });

        if (fieldErrors.length > 0) {
            errors[field] = fieldErrors;
        }
    });

    return {
        isValid: Object.keys(errors).length === 0,
        errors
    };
}

/**
 * Exibe erros de validação
 */
function showValidationErrors(formElement, errors) {
    // Limpar erros anteriores
    formElement.querySelectorAll('.field-error').forEach(el => el.remove());
    formElement.querySelectorAll('.is-invalid').forEach(el => el.classList.remove('is-invalid'));

    // Mostrar novos erros
    Object.entries(errors).forEach(([field, fieldErrors]) => {
        const fieldElement = formElement.querySelector(`[name="${field}"]`);
        if (fieldElement) {
            fieldElement.classList.add('is-invalid');

            const errorDiv = document.createElement('div');
            errorDiv.className = 'field-error';
            errorDiv.style.color = 'var(--danger-color)';
            errorDiv.style.fontSize = '0.75rem';
            errorDiv.style.marginTop = '4px';
            errorDiv.textContent = fieldErrors.join(', ');

            fieldElement.parentNode.appendChild(errorDiv);
        }
    });
}

// Exportar para uso global
window.SGVApi = {
    api,
    cache,
    state,
    loadWithCache,
    loadSelectOptions,
    setupDependentSelect,
    watchFormChanges,
    serializeForm,
    populateForm,
    validateForm,
    showValidationErrors
};
