// Simple chart creation functions - NO IMPORTS

console.log('📊 Loading charts.js...');

// Pastel color palette
const pastelColors = ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#E0BBFF', '#F0E6FF', '#E6FFF9'];

// Basic chart options
const defaultOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
        legend: {
            position: 'top',
            labels: {
                font: { size: 12 }
            }
        }
    }
};

/**
 * Create salary chart by department
 */
function createSalaryChart(data) {
    console.log('📊 Creating salary chart with', data.length, 'employees');
    
    const ctx = document.getElementById('salaryChart');
    if (!ctx) {
        console.error('❌ Canvas salaryChart not found');
        return null;
    }

    // Group by department and calculate average salary
    const deptData = {};
    data.forEach(emp => {
        if (!deptData[emp.departamento]) {
            deptData[emp.departamento] = { total: 0, count: 0 };
        }
        deptData[emp.departamento].total += emp.salario_anual;
        deptData[emp.departamento].count += 1;
    });

    const labels = Object.keys(deptData);
    const salaries = labels.map(dept => Math.round(deptData[dept].total / deptData[dept].count));

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Average Salary',
                data: salaries,
                backgroundColor: pastelColors.slice(0, labels.length)
            }]
        },
        options: {
            ...defaultOptions,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

/**
 * Create scatter chart for satisfaction vs productivity
 */
function createScatterChart(data) {
    console.log('📊 Creating scatter chart with', data.length, 'employees');
    
    const ctx = document.getElementById('scatterChart');
    if (!ctx) {
        console.error('❌ Canvas scatterChart not found');
        return null;
    }

    const scatterData = data.map(emp => ({
        x: emp.satisfaccion_laboral,
        y: emp.productividad_score
    }));

    return new Chart(ctx, {
        type: 'scatter',
        data: {
            datasets: [{
                label: 'Employees',
                data: scatterData,
                backgroundColor: 'rgba(102, 126, 234, 0.6)'
            }]
        },
        options: {
            ...defaultOptions,
            scales: {
                x: {
                    title: { display: true, text: 'Job Satisfaction' },
                    min: 0, max: 10
                },
                y: {
                    title: { display: true, text: 'Productivity Score' },
                    min: 0, max: 100
                }
            }
        }
    });
}

/**
 * Create geographic distribution chart
 */
function createGeoChart(data) {
    console.log('📊 Creating geo chart with', data.length, 'employees');
    
    const ctx = document.getElementById('geoChart');
    if (!ctx) {
        console.error('❌ Canvas geoChart not found');
        return null;
    }

    // Count by zone
    const zoneData = {};
    data.forEach(emp => {
        zoneData[emp.zona_geografica] = (zoneData[emp.zona_geografica] || 0) + 1;
    });

    return new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: Object.keys(zoneData),
            datasets: [{
                data: Object.values(zoneData),
                backgroundColor: pastelColors.slice(0, Object.keys(zoneData).length)
            }]
        },
        options: {
            ...defaultOptions,
            cutout: '60%'
        }
    });
}

/**
 * Create work modality chart
 */
function createModalityChart(data) {
    console.log('📊 Creating modality chart with', data.length, 'employees');
    
    const ctx = document.getElementById('modalityChart');
    if (!ctx) {
        console.error('❌ Canvas modalityChart not found');
        return null;
    }

    // Group by modality
    const modalityData = {};
    data.forEach(emp => {
        if (!modalityData[emp.modalidad_trabajo]) {
            modalityData[emp.modalidad_trabajo] = {
                satisfaction: 0,
                productivity: 0,
                count: 0
            };
        }
        modalityData[emp.modalidad_trabajo].satisfaction += emp.satisfaccion_laboral;
        modalityData[emp.modalidad_trabajo].productivity += emp.productividad_score;
        modalityData[emp.modalidad_trabajo].count += 1;
    });

    const labels = Object.keys(modalityData);
    const satisfactionData = labels.map(mod => 
        (modalityData[mod].satisfaction / modalityData[mod].count).toFixed(1)
    );
    const productivityData = labels.map(mod => 
        (modalityData[mod].productivity / modalityData[mod].count).toFixed(1)
    );

    return new Chart(ctx, {
        type: 'bar',
        data: {
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
        },
        options: {
            ...defaultOptions,
            scales: {
                y: { beginAtZero: true, max: 10 }
            }
        }
    });
}

/**
 * Create work-life balance chart
 */
function createWorkLifeChart(data) {
    console.log('📊 Creating work-life chart with', data.length, 'employees');
    
    const ctx = document.getElementById('workLifeChart');
    if (!ctx) {
        console.error('❌ Canvas workLifeChart not found');
        return null;
    }

    // Group by department
    const deptData = {};
    data.forEach(emp => {
        if (!deptData[emp.departamento]) {
            deptData[emp.departamento] = {
                hours: 0,
                exercise: 0,
                sleep: 0,
                count: 0
            };
        }
        deptData[emp.departamento].hours += emp.horas_semanales || 40;
        deptData[emp.departamento].exercise += emp.horas_ejercicio_semana || 0;
        deptData[emp.departamento].sleep += emp.horas_sueno_noche || 7;
        deptData[emp.departamento].count += 1;
    });

    const labels = Object.keys(deptData);
    const hoursData = labels.map(dept => (deptData[dept].hours / deptData[dept].count).toFixed(1));
    const exerciseData = labels.map(dept => (deptData[dept].exercise / deptData[dept].count).toFixed(1));
    const sleepData = labels.map(dept => (deptData[dept].sleep / deptData[dept].count).toFixed(1));

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [
                {
                    label: 'Weekly Hours',
                    data: hoursData,
                    backgroundColor: '#FFB3BA'
                },
                {
                    label: 'Exercise Hours/Week',
                    data: exerciseData,
                    backgroundColor: '#BAFFC9'
                },
                {
                    label: 'Sleep Hours/Night',
                    data: sleepData,
                    backgroundColor: '#BAE1FF'
                }
            ]
        },
        options: {
            ...defaultOptions,
            scales: {
                y: { beginAtZero: true }
            }
        }
    });
}

/**
 * Create age distribution chart
 */
function createAgeChart(data) {
    console.log('📊 Creating age chart with', data.length, 'employees');
    
    const ctx = document.getElementById('ageChart');
    if (!ctx) {
        console.error('❌ Canvas ageChart not found');
        return null;
    }

    // Group by age ranges
    const ageGroups = { '< 25': 0, '25-34': 0, '35-44': 0, '45-54': 0, '55+': 0 };
    
    data.forEach(emp => {
        const age = emp.edad;
        if (age < 25) ageGroups['< 25']++;
        else if (age < 35) ageGroups['25-34']++;
        else if (age < 45) ageGroups['35-44']++;
        else if (age < 55) ageGroups['45-54']++;
        else ageGroups['55+']++;
    });

    return new Chart(ctx, {
        type: 'pie',
        data: {
            labels: Object.keys(ageGroups),
            datasets: [{
                data: Object.values(ageGroups),
                backgroundColor: pastelColors.slice(0, 5)
            }]
        },
        options: defaultOptions
    });
}

/**
 * Create education level chart
 */
function createEducationChart(data) {
    console.log('📊 Creating education chart with', data.length, 'employees');
    
    const ctx = document.getElementById('educationChart');
    if (!ctx) {
        console.error('❌ Canvas educationChart not found');
        return null;
    }

    // Group by education level
    const eduData = {};
    data.forEach(emp => {
        if (!eduData[emp.nivel_educacion]) {
            eduData[emp.nivel_educacion] = { total: 0, count: 0 };
        }
        eduData[emp.nivel_educacion].total += emp.salario_anual;
        eduData[emp.nivel_educacion].count += 1;
    });

    const labels = Object.keys(eduData);
    const salaries = labels.map(edu => Math.round(eduData[edu].total / eduData[edu].count));

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Average Salary',
                data: salaries,
                backgroundColor: '#FFDFBA'
            }]
        },
        options: {
            ...defaultOptions,
            scales: {
                y: {
                    beginAtZero: true,
                    ticks: {
                        callback: function(value) {
                            return '$' + value.toLocaleString();
                        }
                    }
                }
            }
        }
    });
}

/**
 * Create stress analysis chart
 */
function createStressChart(data) {
    console.log('📊 Creating stress chart with', data.length, 'employees');
    
    const ctx = document.getElementById('stressChart');
    if (!ctx) {
        console.error('❌ Canvas stressChart not found');
        return null;
    }

    // Group by department and calculate average stress
    const deptData = {};
    data.forEach(emp => {
        if (!deptData[emp.departamento]) {
            deptData[emp.departamento] = { total: 0, count: 0 };
        }
        deptData[emp.departamento].total += emp.nivel_estres || 5;
        deptData[emp.departamento].count += 1;
    });

    const labels = Object.keys(deptData);
    const stress = labels.map(dept => (deptData[dept].total / deptData[dept].count).toFixed(1));

    return new Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                label: 'Average Stress Level',
                data: stress,
                backgroundColor: '#FFB3BA'
            }]
        },
        options: {
            ...defaultOptions,
            indexAxis: 'y',
            scales: {
                x: { beginAtZero: true, max: 10 }
            }
        }
    });
}

// Make functions available globally
console.log('🌐 Making chart functions global...');
window.createSalaryChart = createSalaryChart;
window.createScatterChart = createScatterChart;
window.createGeoChart = createGeoChart;
window.createModalityChart = createModalityChart;
window.createWorkLifeChart = createWorkLifeChart;
window.createAgeChart = createAgeChart;
window.createEducationChart = createEducationChart;
window.createStressChart = createStressChart;

console.log('✅ Charts.js loaded successfully!');
