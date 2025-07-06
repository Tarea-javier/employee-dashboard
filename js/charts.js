// Data processing utilities - SIMPLE VERSION

console.log('🔧 Loading data-processor.js...');

/**
 * Format currency in Mexican pesos
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0
    }).format(value);
}

// Make function available globally
window.formatCurrency = formatCurrency;

console.log('✅ Data-processor.js loaded successfully!');
