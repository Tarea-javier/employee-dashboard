console.log('Main script starting...');

class EmployeeDashboard {
    constructor() {
        console.log('Creating dashboard...');
        this.data = [];
        this.charts = {};

        // NUEVA PALETA DE COLORES PASTEL: Vibrante y estética
        this.pastelPalette = [
            '#54a0ff', '#ff9f43', '#1dd1a1', '#ff6b6b', '#feca57',
            '#48dbfb', '#ff7979', '#c8d6e5', '#576574', '#eccc68'
        ];
        this.departmentColors = {};
        this.init();
    }

    init() {
        console.log('Initializing dashboard...');
        if (typeof Chart === 'undefined' || typeof Chart.controllers.boxplot === 'undefined') {
            console.error('Chart.js or a required plugin is missing.');
            return;
        }
        this.configureChartDefaults();
        this.loadInitialData();
    }
    
    // Configuración global para todas las gráficas
    configureChartDefaults() {
        Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
        Chart.defaults.plugins.legend.position = 'bottom'; // Leyenda abajo, más compacto
        Chart.defaults.plugins.legend.labels.usePointStyle = true;
        Chart.defaults.plugins.legend.labels.boxWidth = 8;
        // CORREGIDO: Se fuerza a las gráficas a llenar el contenedor
        Chart.defaults.maintainAspectRatio = false; 
    }
    
    getColor(key, palette) {
        if (!this.departmentColors[key]) {
            const index = Object.keys(this.departmentColors).length % palette.length;
            this.departmentColors[key] = palette[index];
        }
        return this.departmentColors[key];
    }
    
    async loadInitialData() {
        console.log('Loading initial data...');
        try {
            const response = await fetch('data/work.csv');
            const csvText = await response.text();
            this.processCSVData(csvText);
        } catch (error) {
            console.error('Error loading initial CSV:', error);
        }
    }

    processCSVData(csvText) {
        const lines = csvText.split('\n').slice(1).filter(line => line.trim());
        const headers = csvText.split('\n')[0].split(',').map(h => h.trim().toLowerCase().replace(/"/g, ''));
        
        const colIndices = requiredCols => requiredCols.reduce((acc, col) => {
            acc[col] = headers.indexOf(col);
            return acc;
        }, {});
        
        const indices = colIndices(['departamento', 'salario_anual', 'satisfaccion_laboral', 'productividad_score', 'zona_geografica', 'edad', 'modalidad_trabajo', 'nivel_estres', 'horas_sueno_noche']);

        this.data = lines.map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const employee = {};
            Object.keys(indices).forEach(key => employee[key] = values[indices[key]]);
            return {
                ...employee,
                salario_anual: parseInt(employee.salario_anual) || 0,
                satisfaccion_laboral: parseFloat(employee.satisfaccion_laboral) || 0,
                productividad_score: parseInt(employee.productividad_score) || 0,
                edad: parseInt(employee.edad) || 0,
                nivel_estres: parseFloat(employee.nivel_estres) || 0,
                horas_sueno_noche: parseFloat(employee.horas_sueno_noche) || 0,
            };
        }).filter(e => e.salario_anual > 0);
        
        console.log(`Processed ${this.data.length} employees`);
        this.updateUI();
    }

    updateUI() {
        this.updateMetrics();
        this.createAllCharts();
    }
    
    updateMetrics() {
        const total = this.data.length;
        const avgSalary = Math.round(this.data.reduce((sum, e) => sum + e.salario_anual, 0) / total);
        const avgSatisfaction = (this.data.reduce((sum, e) => sum + e.satisfaccion_laboral, 0) / total);
        const avgProductivity = Math.round(this.data.reduce((sum, e) => sum + e.productividad_score, 0) / total);

        document.getElementById('totalEmployees').textContent = total.toLocaleString();
        document.getElementById('avgSalary').textContent = `$${avgSalary.toLocaleString()}`;
        document.getElementById('avgSatisfaction').textContent = avgSatisfaction.toFixed(1);
        document.getElementById('avgProductivity').textContent = avgProductivity.toString();
    }
    
    createAllCharts() {
        Object.values(this.charts).forEach(chart => chart.destroy());
        this.charts = {};
        
        this.createSalaryChart();
        this.createSatisfactionChart();
        this.createGeoChart();
        this.createAgeHistogramChart();
        this.createStressChart();
        this.createSleepChart();
    }

    createSalaryChart() {
        const deptData = this.data.reduce((acc, e) => {
            acc[e.departamento] = acc[e.departamento] || { total: 0, count: 0 };
            acc[e.departamento].total += e.salario_anual;
            acc[e.departamento].count++;
            return acc;
        }, {});

        const labels = Object.keys(deptData).sort();
        const data = labels.map(dept => Math.round(deptData[dept].total / deptData[dept].count));
        
        this.charts.salary = new Chart('salaryChart', {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Average Salary',
                    data,
                    backgroundColor: labels.map(dept => this.getColor(dept, this.pastelPalette)),
                    borderWidth: 0,
                }]
            },
            options: { plugins: { legend: { display: false } } }
        });
    }

    createSatisfactionChart() {
        const datasets = Object.entries(this.data.reduce((acc, e) => {
            if (!acc[e.departamento]) acc[e.departamento] = [];
            acc[e.departamento].push({ x: e.satisfaccion_laboral, y: e.productividad_score });
            return acc;
        }, {})).map(([dept, data]) => ({
            label: dept,
            data,
            backgroundColor: this.getColor(dept, this.pastelPalette) + 'B3', // 70% opacity
        }));

        this.charts.satisfaction = new Chart('satisfactionChart', {
            type: 'scatter', data: { datasets }
        });
    }

    createGeoChart() {
        const zoneData = this.data.reduce((acc, e) => {
            acc[e.zona_geografica] = (acc[e.zona_geografica] || 0) + 1;
            return acc;
        }, {});
        const sortedZones = Object.entries(zoneData).sort((a, b) => b[1] - a[1]);
        
        this.charts.geo = new Chart('geoChart', {
            type: 'bar',
            data: {
                labels: sortedZones.map(z => z[0]),
                datasets: [{
                    data: sortedZones.map(z => z[1]),
                    backgroundColor: this.pastelPalette[0],
                }]
            },
            options: { indexAxis: 'y', plugins: { legend: { display: false } } }
        });
    }

    createAgeHistogramChart() {
        const ageGroups = this.data.reduce((acc, e) => {
            const bin = Math.floor(e.edad / 5) * 5;
            acc[bin] = (acc[bin] || 0) + 1;
            return acc;
        }, {});
        const labels = Object.keys(ageGroups).sort((a,b) => a - b).map(bin => `${bin}-${parseInt(bin) + 4}`);
        const data = Object.keys(ageGroups).sort((a,b) => a - b).map(bin => ageGroups[bin]);

        this.charts.age = new Chart('ageHistogramChart', {
            type: 'bar',
            data: {
                labels,
                datasets: [{ data, backgroundColor: this.pastelPalette[2] }]
            },
            options: { plugins: { legend: { display: false } } }
        });
    }
    
    createStressChart() {
        const modalityData = this.data.reduce((acc, e) => {
            if (!acc[e.modalidad_trabajo]) acc[e.modalidad_trabajo] = [];
            acc[e.modalidad_trabajo].push(e.nivel_estres);
            return acc;
        }, {});
        
        this.charts.stress = new Chart('stressChart', {
            type: 'boxplot',
            data: {
                labels: Object.keys(modalityData),
                datasets: [{
                    data: Object.values(modalityData),
                    backgroundColor: this.pastelPalette[1] + '99',
                    borderColor: this.pastelPalette[1],
                    borderWidth: 2,
                }]
            },
            options: { plugins: { legend: { display: false } } }
        });
    }

    createSleepChart() {
        this.charts.sleep = new Chart('sleepChart', {
            type: 'scatter',
            data: {
                datasets: [{
                    data: this.data.map(e => ({ x: e.horas_sueno_noche, y: e.nivel_estres })),
                    backgroundColor: this.pastelPalette[3] + 'B3',
                }]
            },
            options: { plugins: { legend: { display: false } } }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready, creating dashboard...');
    window.employeeDashboard = new EmployeeDashboard();
});
