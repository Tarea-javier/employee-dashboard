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
    const chartData = prepareChartData(data, 'salary_by_department');
    
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
    const chartData = prepareChartData(data, 'satisfaction_productivity');
    
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
                                `Department: ${context.raw.department || 'N/A'}`
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
    const chartData = prepareChartData(data, 'geographic_distribution');
    
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
    const chartData = prepareChartData(data, 'work_modality');
    
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
    const chartData = prepareChartData(data, 'work_life_balance');
    
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
    const chartData = prepareChartData(data, 'age_distribution');
    
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
    const chartData = prepareChartData(data, 'education_impact');
    
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
 * Create stress level analysis chart
 */
function createStressChart(data) {
    const ctx = document.getElementById('stressChart').getContext('2d');
    const chartData = prepareChartData(data, 'stress_analysis');
    
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
 * Prepare chart data for different chart types
 */
function prepareChartData(data, chartType) {
    switch (chartType) {
        case 'salary_by_department':
            return prepareSalaryByDepartment(data);
        case 'satisfaction_productivity':
            return prepareSatisfactionProductivity(data);
        case 'geographic_distribution':
            return prepareGeographicDistribution(data);
        case 'work_modality':
            return prepareWorkModality(data);
        case 'age_distribution':
            return prepareAgeDistribution(data);
        case 'education_impact':
            return prepareEducationImpact(data);
        case 'stress_analysis':
            return prepareStressAnalysis(data);
        case 'work_life_balance':
            return prepareWorkLifeBalance(data);
        default:
            return {};
    }
}

function prepareSalaryByDepartment(data) {
    const grouped = groupByField(data, 'departamento');
    const labels = Object.keys(grouped);
    const salaries = labels.map(dept => {
        const deptData = grouped[dept];
        return Math.round(deptData.reduce((sum, emp) => sum + emp.salario_anual, 0) / deptData.length);
    });

    return {
        labels: labels,
        datasets: [{
            label: 'Average Salary',
            data: salaries,
            backgroundColor: pastelColors.primary.slice(0, labels.length)
        }]
    };
}

function prepareSatisfactionProductivity(data) {
    return {
        datasets: [{
            label: 'Employees',
            data: data.map(emp => ({
                x: emp.satisfaccion_laboral,
                y: emp.productividad_score,
                department: emp.departamento
            })),
            backgroundColor: 'rgba(102, 126, 234, 0.6)',
            borderColor: 'rgba(102, 126, 234, 1)'
        }]
    };
}

function prepareGeographicDistribution(data) {
    const grouped = groupByField(data, 'zona_geografica');
    
    return {
        labels: Object.keys(grouped),
        datasets: [{
            data: Object.values(grouped).map(zone => zone.length),
            backgroundColor: pastelColors.primary.slice(0, Object.keys(grouped).length)
        }]
    };
}

function prepareWorkModality(data) {
    const grouped = groupByField(data, 'modalidad_trabajo');
    const labels = Object.keys(grouped);
    
    const satisfactionData = labels.map(modality => {
        const modalityData = grouped[modality];
        return (modalityData.reduce((sum, emp) => sum + emp.satisfaccion_laboral, 0) / modalityData.length).toFixed(1);
    });
    
    const productivityData = labels.map(modality => {
        const modalityData = grouped[modality];
        return (modalityData.reduce((sum, emp) => sum + emp.productividad_score, 0) / modalityData.length).toFixed(1);
    });

    return {
        labels: labels,
        datasets: [
            {
                label: 'Job Satisfaction',
                data: satisfactionData,
                backgroundColor: '#BAFFC9'
            },
            {
                label: 'Productivity Score',
                data: productivityData,
                backgroundColor: '#BAE1FF'
            }
        ]
    };
}

function prepareAgeDistribution(data) {
    const ageGroups = ['< 25', '25-34', '35-44', '45-54', '55+'];
    const distribution = {};
    
    ageGroups.forEach(group => distribution[group] = 0);
    
    data.forEach(emp => {
        const age = emp.edad;
        let group;
        if (age < 25) group = '< 25';
        else if (age < 35) group = '25-34';
        else if (age < 45) group = '35-44';
        else if (age < 55) group = '45-54';
        else group = '55+';
        
        distribution[group]++;
    });

    return {
        labels: ageGroups,
        datasets: [{
            data: Object.values(distribution),
            backgroundColor: pastelColors.primary.slice(0, ageGroups.length)
        }]
    };
}

function prepareEducationImpact(data) {
    const grouped = groupByField(data, 'nivel_educacion');
    const labels = Object.keys(grouped);
    
    const salaryData = labels.map(edu => {
        const eduData = grouped[edu];
        return Math.round(eduData.reduce((sum, emp) => sum + emp.salario_anual, 0) / eduData.length);
    });

    return {
        labels: labels,
        datasets: [{
            label: 'Average Salary',
            data: salaryData,
            backgroundColor: '#FFDFBA'
        }]
    };
}

function prepareStressAnalysis(data) {
    const grouped = groupByField(data, 'departamento');
    const labels = Object.keys(grouped);
    
    const stressData = labels.map(dept => {
        const deptData = grouped[dept];
        return (deptData.reduce((sum, emp) => sum + emp.nivel_estres, 0) / deptData.length).toFixed(1);
    });

    return {
        labels: labels,
        datasets: [{
            label: 'Average Stress Level',
            data: stressData,
            backgroundColor: '#FFB3BA'
        }]
    };
}

function prepareWorkLifeBalance(data) {
    const grouped = groupByField(data, 'departamento');
    const labels = Object.keys(grouped);
    
    const weeklyHours = labels.map(dept => {
        const deptData = grouped[dept];
        return (deptData.reduce((sum, emp) => sum + emp.horas_semanales, 0) / deptData.length).toFixed(1);
    });
    
    const exerciseHours = labels.map(dept => {
        const deptData = grouped[dept];
        return (deptData.reduce((sum, emp) => sum + emp.horas_ejercicio_semana, 0) / deptData.length).toFixed(1);
    });
    
    const sleepHours = labels.map(dept => {
        const deptData = grouped[dept];
        return (deptData.reduce((sum, emp) => sum + emp.horas_sueno_noche, 0) / deptData.length).toFixed(1);
    });

    return {
        labels: labels,
        datasets: [
            {
                label: 'Weekly Hours',
                data: weeklyHours,
                backgroundColor: '#FFB3BA'
            },
            {
                label: 'Exercise Hours/Week',
                data: exerciseHours,
                backgroundColor: '#BAFFC9'
            },
            {
                label: 'Sleep Hours/Night',
                data: sleepHours,
                backgroundColor: '#BAE1FF'
            }
        ]
    };
}

// Utility function to group data by field
function groupByField(array, key) {
    return array.reduce((result, item) => {
        const group = item[key];
        if (!result[group]) {
            result[group] = [];
        }
        result[group].push(item);
        return result;
    }, {});
}

// Make functions available globally
window.createSalaryChart = createSalaryChart;
window.createScatterChart = createScatterChart;
window.createGeoChart = createGeoChart;
window.createModalityChart = createModalityChart;
window.createWorkLifeChart = createWorkLifeChart;
window.createAgeChart = createAgeChart;
window.createEducationChart = createEducationChart;
window.createStressChart = createStressChart;
