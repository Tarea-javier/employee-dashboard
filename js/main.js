// Employee Analytics Dashboard - Simple Version
console.log('Main script starting...');

class EmployeeDashboard {
    constructor() {
        console.log('Creating dashboard...');
        this.data = [];
        this.charts = {};

        // Paleta de colores pastel inspirada en las librerías de visualización de Python
        this.pastelColors = [
            '#a6cee3', '#1f78b4', '#b2df8a', '#33a02c', '#fb9a99', 
            '#e31a1c', '#fdbf6f', '#ff7f00', '#cab2d6', '#6a3d9a'
        ];
        this.departmentColorMap = {};

        this.init();
    }

    init() {
        console.log('Initializing dashboard...');
        
        if (typeof Chart === 'undefined') {
            console.error('Chart.js not available in main.js');
            document.getElementById('dashboard').innerHTML = '<p style="text-align:center; color:red;">Error: No se pudo cargar la librería de gráficos.</p>';
            return;
        }
        
        console.log('Chart.js is available!');
        
        this.loadInitialData();
    }

    // Función para asignar un color consistente a cada departamento
    getDepartmentColor(department) {
        if (!this.departmentColorMap[department]) {
            const colorIndex = Object.keys(this.departmentColorMap).length % this.pastelColors.length;
            this.departmentColorMap[department] = this.pastelColors[colorIndex];
        }
        return this.departmentColorMap[department];
    }
    
    async loadInitialData() {
        console.log('Loading initial data from data/work.csv...');
        try {
            const response = await fetch('data/work.csv');
            if (!response.ok) {
                throw new Error(`Network response was not ok: ${response.statusText}`);
            }
            const csvText = await response.text();
            this.processCSVData(csvText);
            
        } catch (error) {
            console.error('Error loading initial CSV:', error);
            const dashboard = document.getElementById('dashboard');
            dashboard.innerHTML = `<p style="text-align:center; color:red;">Error: No se pudo cargar el archivo de datos (work.csv). Verifica que el archivo exista en la carpeta 'data'.</p>`;
        }
    }

    processCSVData(csvText) {
        console.log('Processing CSV data...');
        try {
            const lines = csvText.split('\n').filter(line => line.trim());
            if (lines.length < 2) throw new Error('Invalid CSV file: Not enough lines.');
            
            const headers = lines[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
            console.log('Headers:', headers);

            const cols = {
                dept: this.findColumn(headers, ['departamento', 'department']),
                salary: this.findColumn(headers, ['salario_anual', 'salary']),
                satisfaction: this.findColumn(headers, ['satisfaccion_laboral', 'satisfaction']),
                productivity: this.findColumn(headers, ['productividad_score', 'productivity']),
                zone: this.findColumn(headers, ['zona_geografica', 'zone']),
                age: this.findColumn(headers, ['edad', 'age']),
            };

            const newData = [];
            for (let i = 1; i < lines.length; i++) {
                const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
                if (values.length >= headers.length) {
                    newData.push({
                        department: values[cols.dept] || 'Unknown',
                        salary: parseInt(values[cols.salary]) || 0,
                        satisfaction: parseFloat(values[cols.satisfaction]) || 0,
                        productivity: parseInt(values[cols.productivity]) || 0,
                        zone: values[cols.zone] || 'Unknown',
                        age: parseInt(values[cols.age]) || 0,
                    });
                }
            }

            if (newData.length > 0) {
                this.data = newData.filter(emp => emp.department !== 'Unknown' && emp.salary > 0);
                console.log(`Processed ${this.data.length} employees`);
                this.updateMetrics();
                this.updateCharts();
            } else {
                throw new Error('No valid data found in CSV.');
            }
        } catch (error) {
            console.error('CSV processing error:', error);
        }
    }

    findColumn(headers, possibilities) {
        for (const poss of possibilities) {
            const index = headers.indexOf(poss);
            if (index !== -1) return index;
        }
        console.warn(`Could not find a column for: ${possibilities.join(' or ')}`);
        return -1;
    }

    updateMetrics() {
        if (this.data.length === 0) return;
        
        const total = this.data.length;
        const avgSalary = Math.round(this.data.reduce((sum, emp) => sum + emp.salary, 0) / total);
        const avgSatisfaction = (this.data.reduce((sum, emp) => sum + emp.satisfaction, 0) / total);
        const avgProductivity = Math.round(this.data.reduce((sum, emp) => sum + emp.productivity, 0) / total);

        this.updateElement('totalEmployees', total.toLocaleString());
        this.updateElement('avgSalary', `$${avgSalary.toLocaleString()}`);
        this.updateElement('avgSatisfaction', avgSatisfaction.toFixed(1));
        this.updateElement('avgProductivity', avgProductivity);
        
        console.log('Metrics updated');
    }

    updateElement(id, value) {
        const element = document.getElementById(id);
        if (element) element.textContent = value;
    }

    createCharts() {
        console.log('Creating charts...');
        
        if (typeof Chart === 'undefined') {
            console.error('Chart.js not available for chart creation');
            return;
        }
        
        try {
            this.createSalaryChart();
            this.createScatterChart();
            this.createGeoChart();
            this.createAgeChart();
            console.log('All charts created!');
        } catch (error) {
            console.error('Chart creation error:', error);
        }
    }

    updateCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && chart.destroy) chart.destroy();
        });
        this.charts = {};
        this.createCharts();
    }

    createSalaryChart() {
        const canvas = document.getElementById('salaryChart');
        if (!canvas) return;

        const deptSalaries = {};
        this.data.forEach(emp => {
            if (!deptSalaries[emp.department]) {
                deptSalaries[emp.department] = { total: 0, count: 0 };
            }
            deptSalaries[emp.department].total += emp.salary;
            deptSalaries[emp.department].count++;
        });

        const labels = Object.keys(deptSalaries).sort((a,b) => a.localeCompare(b));
        const data = labels.map(dept => Math.round(deptSalaries[dept].total / deptSalaries[dept].count));

        this.charts.salary = new Chart(canvas, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    label: 'Average Salary',
                    data: data,
                    // MEJORA: Se usan colores de la paleta pastel
                    backgroundColor: labels.map(dept => this.getDepartmentColor(dept) + 'B3'), // B3 = 70% opacidad
                    borderColor: labels.map(dept => this.getDepartmentColor(dept)),
                    borderWidth: 1,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { 
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `Avg. Salary: $${context.parsed.y.toLocaleString()}`
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        ticks: { callback: value => '$' + value.toLocaleString() }
                    }
                }
            }
        });
    }

    createScatterChart() {
        const canvas = document.getElementById('scatterChart');
        if (!canvas) return;
        
        // MEJORA: Agrupamos los datos por departamento para crear un dataset por cada uno
        const dataByDept = this.data.reduce((acc, emp) => {
            if (!acc[emp.department]) {
                acc[emp.department] = [];
            }
            acc[emp.department].push(emp);
            return acc;
        }, {});

        const datasets = Object.keys(dataByDept).map(dept => {
            const color = this.getDepartmentColor(dept);
            return {
                label: dept,
                data: dataByDept[dept].map(emp => ({
                    x: emp.satisfaction,
                    y: emp.productivity,
                    // Pasamos datos adicionales para el tooltip
                    salary: emp.salary 
                })),
                // MEJORA: Color por departamento y con transparencia para ver la densidad
                backgroundColor: color + '99', // 99 = 60% opacidad
                borderColor: color,
                borderWidth: 1,
                pointRadius: 4,
                pointHoverRadius: 6,
            };
        });

        this.charts.scatter = new Chart(canvas, {
            type: 'scatter',
            data: { datasets: datasets },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'top',
                    },
                    // MEJORA: Tooltip personalizado para mostrar más información
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                const raw = context.raw;
                                let label = context.dataset.label || '';
                                if (label) {
                                    label += ': ';
                                }
                                label += `(Satisfaction: ${raw.x}, Productivity: ${raw.y})`;
                                return label;
                            },
                            afterLabel: function(context) {
                                const raw = context.raw;
                                return `Salary: $${raw.salary.toLocaleString()}`;
                            }
                        }
                    }
                },
                scales: {
                    x: { 
                        title: { display: true, text: 'Job Satisfaction (1-10)' },
                        grid: { color: 'rgba(0, 0, 0, 0.05)' }
                    },
                    y: { 
                        title: { display: true, text: 'Productivity Score (0-100)' },
                        grid: { color: 'rgba(0, 0, 0, 0.05)' }
                    }
                }
            }
        });
    }

    createGeoChart() {
        const canvas = document.getElementById('geoChart');
        if (!canvas) return;

        const zoneCounts = {};
        this.data.forEach(emp => {
            zoneCounts[emp.zone] = (zoneCounts[emp.zone] || 0) + 1;
        });

        this.charts.geo = new Chart(canvas, {
            type: 'doughnut',
            data: {
                labels: Object.keys(zoneCounts),
                datasets: [{
                    data: Object.values(zoneCounts),
                    // MEJORA: Se usa la paleta de colores pastel
                    backgroundColor: this.pastelColors,
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }

    createAgeChart() {
        const canvas = document.getElementById('ageChart');
        if (!canvas) return;

        const ageGroups = { '< 30': 0, '30-40': 0, '40-50': 0, '50+': 0 };
        
        this.data.forEach(emp => {
            if (emp.age < 30) ageGroups['< 30']++;
            else if (emp.age < 40) ageGroups['30-40']++;
            else if (emp.age < 50) ageGroups['40-50']++;
            else ageGroups['50+']++;
        });

        this.charts.age = new Chart(canvas, {
            type: 'pie',
            data: {
                labels: Object.keys(ageGroups),
                datasets: [{
                    data: Object.values(ageGroups),
                    // MEJORA: Se usa la paleta de colores pastel
                    backgroundColor: this.pastelColors,
                    borderColor: '#ffffff',
                    borderWidth: 2
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'right'
                    }
                }
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready, creating dashboard...');
    window.employeeDashboard = new EmployeeDashboard();
});
