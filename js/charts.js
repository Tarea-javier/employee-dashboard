// Chart.js configurations and chart creation functions

// Default chart options with pastel styling
const defaultChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top',
            labels: {
                usePointStyle: true,
                padding: 20,
                font: {
                    size: 12,
                    family: 'Segoe UI'
                }
            }
        },
        tooltip: {
            backgroundColor: 'rgba(255, 255, 255, 0.95)',
            titleColor: '#4a5568',
            bodyColor: '#718096',
            borderColor: '#e2e8f0',
            borderWidth: 1,
            cornerRadius: 8,
            padding: 12
        }
    },
    scales: {
        x: {
            grid: {
                color: '#f7fafc',
                borderColor: '#e2e8f0'
            },
            ticks: {
                color: '#718096',
                font: {
                    size: 11
                }
            }
        },
        y: {
            grid: {
                color: '#f7fafc',
                borderColor: '#e2e8f0'
            },
            ticks: {
                color: '#718096',
                font: {
                    size: 11
                }
            }
        }
    }
};

// Pastel color palette
const pastelColors = {
    primary: ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#E0BBFF', '#F0E6FF', '#E6FFF9'],
    gradients: [
        'linear-gradient(45deg, #FFB3BA, #FFDFBA)',
        'linear-gradient(45deg, #BAFFC9, #BAE1FF)',
        'linear-gradient(45deg, #E0BBFF, #F0E6FF)',
        'linear-gradient(45deg, #FFFFBA, #BAFFC9)'
    ]
};

/**
 * Create salary distribution chart by department
 */
function createSalaryChart(data) {
    const ctx = document.getElementById('salaryChart').getContext('2d');
    const chartData = DataProcessor.prepareChartData(data, 'salary_by_department');
    
    return new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            ...defaultChartOptions,
            scales: {
                ...defaultChartOptions.scales,
                y: {
                    ...defaultChartOptions.scales.y,
                    beginAtZero: true,
                    ticks: {
                        ...defaultChartOptions.scales.y.ticks,
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            },
            plugins: {
                ...defaultChartOptions.plugins,
                tooltip: {
                    ...defaultChartOptions.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            return `Average Salary: $${context.parsed.y.toLocaleString()}`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Create scatter plot for satisfaction vs productivity
 */
function createScatterChart(data) {
    const ctx = document.getElementById('scatterChart').getContext('2d');
    const chartData = DataProcessor.prepareChartData(data, 'satisfaction_productivity');
    
    return new Chart(ctx, {
        type: 'scatter',
        data: chartData,
        options: {
            ...defaultChartOptions,
            scales: {
                x: {
                    ...defaultChartOptions.scales.x,
                    title: {
                        display: true,
                        text: 'Job Satisfaction (1-10)',
                        color: '#4a5568'
                    },
                    min: 0,
                    max: 10
                },
                y: {
                    ...defaultChartOptions.scales.y,
                    title: {
                        display: true,
                        text: 'Productivity Score (0-100)',
                        color: '#4a5568'
                    },
                    min: 0,
                    max: 100
                }
            },
            plugins: {
                ...defaultChartOptions.plugins,
                tooltip: {
                    ...defaultChartOptions.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            const point = context.parsed;
                            return [
                                `Satisfaction: ${point.x}`,
                                `Productivity: ${point.y}`,
                                `Department: ${context.raw.department}`
                            ];
                        }
                    }
                }
            }
        }
    });
}

/**
 * Create geographic distribution doughnut chart
 */
function createGeoChart(data) {
    const ctx = document.getElementById('geoChart').getContext('2d');
    const chartData = DataProcessor.prepareChartData(data, 'geographic_distribution');
    
    return new Chart(ctx, {
        type: 'doughnut',
        data: chartData,
        options: {
            ...defaultChartOptions,
            cutout: '60%',
            plugins: {
                ...defaultChartOptions.plugins,
                tooltip: {
                    ...defaultChartOptions.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Create work modality comparison chart
 */
function createModalityChart(data) {
    const ctx = document.getElementById('modalityChart').getContext('2d');
    const chartData = DataProcessor.prepareChartData(data, 'work_modality');
    
    return new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            ...defaultChartOptions,
            scales: {
                ...defaultChartOptions.scales,
                y: {
                    ...defaultChartOptions.scales.y,
                    beginAtZero: true,
                    max: 10
                }
            },
            plugins: {
                ...defaultChartOptions.plugins,
                tooltip: {
                    ...defaultChartOptions.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y}`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Create work-life balance chart
 */
function createWorkLifeChart(data) {
    const ctx = document.getElementById('workLifeChart').getContext('2d');
    const chartData = DataProcessor.prepareChartData(data, 'work_life_balance');
    
    return new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            ...defaultChartOptions,
            scales: {
                ...defaultChartOptions.scales,
                y: {
                    ...defaultChartOptions.scales.y,
                    beginAtZero: true
                }
            },
            plugins: {
                ...defaultChartOptions.plugins,
                tooltip: {
                    ...defaultChartOptions.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            return `${context.dataset.label}: ${context.parsed.y}`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Create age distribution pie chart
 */
function createAgeChart(data) {
    const ctx = document.getElementById('ageChart').getContext('2d');
    const chartData = DataProcessor.prepareChartData(data, 'age_distribution');
    
    return new Chart(ctx, {
        type: 'pie',
        data: chartData,
        options: {
            ...defaultChartOptions,
            plugins: {
                ...defaultChartOptions.plugins,
                tooltip: {
                    ...defaultChartOptions.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            const total = context.dataset.data.reduce((a, b) => a + b, 0);
                            const percentage = ((context.parsed / total) * 100).toFixed(1);
                            return `${context.label}: ${context.parsed} (${percentage}%)`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Create education level impact chart
 */
function createEducationChart(data) {
    const ctx = document.getElementById('educationChart').getContext('2d');
    const chartData = DataProcessor.prepareChartData(data, 'education_impact');
    
    return new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            ...defaultChartOptions,
            scales: {
                ...defaultChartOptions.scales,
                y: {
                    ...defaultChartOptions.scales.y,
                    type: 'linear',
                    display: true,
                    position: 'left',
                    beginAtZero: true,
                    ticks: {
                        ...defaultChartOptions.scales.y.ticks,
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                },
                y1: {
                    type: 'linear',
                    display: true,
                    position: 'right',
                    min: 0,
                    max: 10,
                    grid: {
                        drawOnChartArea: false,
                    },
                    ticks: {
                        color: '#718096',
                        font: {
                            size: 11
                        }
                    }
                }
            },
            plugins: {
                ...defaultChartOptions.plugins,
                tooltip: {
                    ...defaultChartOptions.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            if (context.datasetIndex === 0) {
                                return `Average Salary: $${context.parsed.y.toLocaleString()}`;
                            } else {
                                return `Job Satisfaction: ${context.parsed.y}`;
                            }
                        }
                    }
                }
            }
        }
    });
}

/**
 * Create stress level analysis chart
 */
function createStressChart(data) {
    const ctx = document.getElementById('stressChart').getContext('2d');
    const chartData = DataProcessor.prepareChartData(data, 'stress_analysis');
    
    return new Chart(ctx, {
        type: 'bar',
        data: chartData,
        options: {
            ...defaultChartOptions,
            indexAxis: 'y',
            scales: {
                x: {
                    ...defaultChartOptions.scales.x,
                    beginAtZero: true,
                    max: 10
                },
                y: defaultChartOptions.scales.y
            },
            plugins: {
                ...defaultChartOptions.plugins,
                tooltip: {
                    ...defaultChartOptions.plugins.tooltip,
                    callbacks: {
                        label: function(context) {
                            return `Stress Level: ${context.parsed.x}/10`;
                        }
                    }
                }
            }
        }
    });
}

/**
 * Create animated line chart
 */
function createAnimatedLineChart(ctx, data, options = {}) {
    return new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            ...defaultChartOptions,
            ...options,
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart'
            },
            elements: {
                line: {
                    tension: 0.4
                },
                point: {
                    radius: 6,
                    hoverRadius: 8
                }
            }
        }
    });
}

/**
 * Create gradient background for charts
 */
function createGradient(ctx, color1, color2) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, color1);
    gradient.addColorStop(1, color2);
    return gradient;
}

/**
 * Update chart with new data and smooth animation
 */
function updateChartData(chart, newData) {
    chart.data = newData;
    chart.update('active');
}

/**
 * Create multi-axis chart for complex comparisons
 */
function createMultiAxisChart(ctx, data, config) {
    return new Chart(ctx, {
        type: 'line',
        data: data,
        options: {
            ...defaultChartOptions,
            ...config,
            interaction: {
                mode: 'index',
                intersect: false,
            },
            animation: {
                duration: 1500,
                easing: 'easeInOutCubic'
            }
        }
    });
}

/**
 * Chart utility functions
 */
const ChartUtils = {
    // Destroy chart if it exists
    destroyChart: function(chart) {
        if (chart && typeof chart.destroy === 'function') {
            chart.destroy();
        }
    },

    // Get responsive font size based on screen width
    getResponsiveFontSize: function() {
        const width = window.innerWidth;
        if (width < 480) return 10;
        if (width < 768) return 11;
        return 12;
    },

    // Generate random pastel color
    generatePastelColor: function() {
        const colors = pastelColors.primary;
        return colors[Math.floor(Math.random() * colors.length)];
    },

    // Create color array for datasets
    createColorArray: function(count) {
        const colors = [];
        for (let i = 0; i < count; i++) {
            colors.push(pastelColors.primary[i % pastelColors.primary.length]);
        }
        return colors;
    }
};

// Make ChartUtils available globally
window.ChartUtils = ChartUtils;
