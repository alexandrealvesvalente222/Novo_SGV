/**
 * Utilitários e funções auxiliares
 */

// Constantes
const FAIXAS_OCUPACAO = {
    'Crítico': { min: 0, max: 59, color: '#dc2626', class: 'critical' },
    'Atenção': { min: 60, max: 79, color: '#eab308', class: 'warning' },
    'Adequado': { min: 80, max: 100, color: '#16a34a', class: 'good' }
};

/**
 * Mostra o loading overlay
 */
function showLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.add('show');
    }
}

/**
 * Esconde o loading overlay
 */
function hideLoading() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.remove('show');
    }
}

/**
 * Exibe notificação toast
 */
function showToast(message, type = 'info') {
    // Criar elemento do toast
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.innerHTML = `
        <div class="toast-content">
            <span class="toast-icon">${type === 'error' ? '❌' : type === 'success' ? '✅' : 'ℹ️'}</span>
            <span class="toast-message">${message}</span>
        </div>
    `;

    // Adicionar estilos se não existirem
    if (!document.querySelector('#toast-styles')) {
        const style = document.createElement('style');
        style.id = 'toast-styles';
        style.textContent = `
            .toast {
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0,0,0,0.15);
                z-index: 10000;
                animation: slideInRight 0.3s ease-out;
                max-width: 400px;
            }
            .toast-error { border-left: 4px solid #dc2626; }
            .toast-success { border-left: 4px solid #16a34a; }
            .toast-info { border-left: 4px solid #2563eb; }
            .toast-content {
                display: flex;
                align-items: center;
                gap: 12px;
                padding: 16px;
            }
            .toast-message {
                font-size: 0.875rem;
                color: #374151;
            }
            @keyframes slideInRight {
                from { transform: translateX(100%); opacity: 0; }
                to { transform: translateX(0); opacity: 1; }
            }
        `;
        document.head.appendChild(style);
    }

    // Adicionar ao DOM
    document.body.appendChild(toast);

    // Remover após 5 segundos
    setTimeout(() => {
        toast.style.animation = 'slideInRight 0.3s ease-out reverse';
        setTimeout(() => toast.remove(), 300);
    }, 5000);
}

/**
 * Formata números com separadores
 */
function formatNumber(num, decimals = 0) {
    if (num === null || num === undefined) return '-';
    return Number(num).toLocaleString('pt-BR', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

/**
 * Formata valores monetários
 */
function formatCurrency(value) {
    if (value === null || value === undefined) return '-';
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}

/**
 * Formata percentuais
 */
function formatPercent(value, decimals = 1) {
    if (value === null || value === undefined) return '-';
    return `${formatNumber(value, decimals)}%`;
}

/**
 * Obtém a cor da faixa de ocupação
 */
function getOcupacaoColor(faixa) {
    return FAIXAS_OCUPACAO[faixa]?.color || '#64748b';
}

/**
 * Obtém a classe CSS da faixa de ocupação
 */
function getOcupacaoClass(faixa) {
    return FAIXAS_OCUPACAO[faixa]?.class || 'secondary';
}

/**
 * Cria badge de nota de ocupação
 */
function createNotaBadge(nota, faixa) {
    const className = getOcupacaoClass(faixa);

    return `<span class="badge ${className}">${nota}</span>`;
}

/**
 * Debounce para inputs
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

/**
 * Valida se uma string é um JSON válido
 */
function isValidJSON(str) {
    try {
        JSON.parse(str);
        return true;
    } catch (e) {
        return false;
    }
}

/**
 * Escapa HTML para prevenir XSS
 */
function escapeHtml(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
}

/**
 * Converte string para slug
 */
function slugify(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '') // Remove acentos
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');
}

/**
 * Calcula distância entre dois pontos geográficos (Haversine)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Raio da Terra em km
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * Agrupa array por propriedade
 */
function groupBy(array, key) {
    return array.reduce((result, currentValue) => {
        const groupKey = currentValue[key];
        if (!result[groupKey]) {
            result[groupKey] = [];
        }
        result[groupKey].push(currentValue);
        return result;
    }, {});
}

/**
 * Ordena array por múltiplas propriedades
 */
function sortBy(array, ...props) {
    return array.sort((a, b) => {
        for (let prop of props) {
            let direction = 1;
            if (prop.startsWith('-')) {
                direction = -1;
                prop = prop.slice(1);
            }

            if (a[prop] < b[prop]) return -1 * direction;
            if (a[prop] > b[prop]) return 1 * direction;
        }
        return 0;
    });
}

/**
 * Gera ID único
 */
function generateId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

/**
 * Converte coordenadas para formato DMS
 */
function toDMS(coordinate, isLatitude) {
    const absolute = Math.abs(coordinate);
    const degrees = Math.floor(absolute);
    const minutesNotTruncated = (absolute - degrees) * 60;
    const minutes = Math.floor(minutesNotTruncated);
    const seconds = Math.floor((minutesNotTruncated - minutes) * 60);

    const direction = coordinate >= 0 ?
        (isLatitude ? 'N' : 'E') :
        (isLatitude ? 'S' : 'W');

    return `${degrees}°${minutes}'${seconds}"${direction}`;
}

/**
 * Cria elemento DOM com atributos
 */
function createElement(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);

    Object.entries(attributes).forEach(([key, value]) => {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'innerHTML') {
            element.innerHTML = value;
        } else if (key === 'textContent') {
            element.textContent = value;
        } else {
            element.setAttribute(key, value);
        }
    });

    children.forEach(child => {
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else {
            element.appendChild(child);
        }
    });

    return element;
}

/**
 * Observer para mudanças no DOM
 */
function observeElement(element, callback, options = {}) {
    const observer = new MutationObserver(callback);
    observer.observe(element, {
        childList: true,
        subtree: true,
        attributes: true,
        ...options
    });
    return observer;
}

/**
 * Download de dados como arquivo
 */
function downloadData(data, filename, type = 'application/json') {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

/**
 * Copia texto para clipboard
 */
async function copyToClipboard(text) {
    try {
        await navigator.clipboard.writeText(text);
        showToast('Texto copiado para a área de transferência', 'success');
    } catch (err) {
        console.error('Erro ao copiar:', err);
        showToast('Erro ao copiar texto', 'error');
    }
}

/**
 * Validadores comuns
 */
const validators = {
    email: (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
    phone: (phone) => /^\(\d{2}\)\s\d{4,5}-\d{4}$/.test(phone),
    cpf: (cpf) => {
        cpf = cpf.replace(/[^\d]/g, '');
        if (cpf.length !== 11) return false;

        // Verificar dígitos verificadores
        let sum = 0;
        for (let i = 0; i < 9; i++) {
            sum += parseInt(cpf.charAt(i)) * (10 - i);
        }
        let remainder = 11 - (sum % 11);
        if (remainder === 10 || remainder === 11) remainder = 0;
        if (remainder !== parseInt(cpf.charAt(9))) return false;

        sum = 0;
        for (let i = 0; i < 10; i++) {
            sum += parseInt(cpf.charAt(i)) * (11 - i);
        }
        remainder = 11 - (sum % 11);
        if (remainder === 10 || remainder === 11) remainder = 0;
        return remainder === parseInt(cpf.charAt(10));
    },
    cnpj: (cnpj) => {
        cnpj = cnpj.replace(/[^\d]/g, '');
        if (cnpj.length !== 14) return false;

        // Verificar dígitos verificadores (implementação simplificada)
        return true; // Para propósito de demo
    }
};

/**
 * Máscara para inputs
 */
function applyMask(input, mask) {
    input.addEventListener('input', (e) => {
        let value = e.target.value.replace(/\D/g, '');
        let maskedValue = '';
        let maskIndex = 0;

        for (let i = 0; i < value.length && maskIndex < mask.length; i++) {
            while (maskIndex < mask.length && mask[maskIndex] !== '#') {
                maskedValue += mask[maskIndex];
                maskIndex++;
            }
            if (maskIndex < mask.length) {
                maskedValue += value[i];
                maskIndex++;
            }
        }

        e.target.value = maskedValue;
    });
}

// Exportar funções para uso global
window.SGVUtils = {
    showLoading,
    hideLoading,
    showToast,
    formatNumber,
    formatCurrency,
    formatPercent,
    getOcupacaoColor,
    getOcupacaoClass,
    createNotaBadge,
    debounce,
    isValidJSON,
    escapeHtml,
    slugify,
    calculateDistance,
    groupBy,
    sortBy,
    generateId,
    toDMS,
    createElement,
    observeElement,
    downloadData,
    copyToClipboard,
    validators,
    applyMask,
    FAIXAS_OCUPACAO
};
