console.log('Main script starting...');

class EmployeeDashboard {
    constructor() {
        console.log('Creating dashboard...');
        this.data = [];
        this.charts = {};

        // Paleta de colores minimalista y estética
        this.colorPalette = {
            blue: '#5b9bd5',
            orange: '#ed7d31',
            gray: '#a5a5a5',
            yellow: '#ffc000',
            lightBlue: '#4472c4',
            green: '#70ad47',
            purple: '#7030a0',
        };
        this.departmentColors = {};
        this.init();
    }

    init() {
        console.log('Initializing dashboard...');
        if (typeof Chart === 'undefined') {
            console.error('Chart.js or a plugin is missing.');
            return;
        }
        this.configureChartDefaults();
        this.loadInitialData();
    }

    configureChartDefaults() {
        Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
        Chart.defaults.plugins.legend.position = 'top';
        Chart.defaults.plugins.legend.align = 'end';
        Chart.defaults.plugins.legend.labels.boxWidth = 12;
        Chart.defaults.plugins.legend.labels.padding = 20;
        Chart.defaults.plugins.tooltip.backgroundColor = '#FFF';
        Chart.defaults.plugins.tooltip.titleColor = '#333';
        Chart.defaults.plugins.tooltip.bodyColor = '#666';
        Chart.defaults.plugins.tooltip.borderColor = '#DDD';
        Chart.defaults.plugins.tooltip.borderWidth = 1;
        Chart.defaults.plugins.tooltip.padding = 10;
        Chart.defaults.plugins.tooltip.cornerRadius = 4;
    }
    
    getDeptColor(department) {
        if (!this.departmentColors[department]) {
            const colorKeys = Object.keys(this.colorPalette);
            const index = Object.keys(this.departmentColors).length % colorKeys.length;
            this.departmentColors[department] = this.colorPalette[colorKeys[index]];
        }
        return this.departmentColors[department];
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
        
        const requiredCols = ['departamento', 'salario_anual', 'satisfaccion_laboral', 'productividad_score', 'zona_geografica', 'edad', 'modalidad_trabajo', 'nivel_estres', 'horas_sueno_noche'];
        const colIndices = {};
        requiredCols.forEach(col => colIndices[col] = headers.indexOf(col));

        this.data = lines.map(line => {
            const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
            const employee = {};
            requiredCols.forEach(col => employee[col] = values[colIndices[col]]);
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

    destroyChart(chartId) {
        if (this.charts[chartId]) {
            this.charts[chartId].destroy();
        }
    }
    
    createAllCharts() {
        Object.keys(this.charts).forEach(id => this.destroyChart(id));

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
                    backgroundColor: labels.map(dept => this.getDeptColor(dept)),
                    borderWidth: 0,
                    barPercentage: 0.7,
                    categoryPercentage: 0.8,
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                scales: { 
                    y: { ticks: { callback: v => '$' + (v/1000) + 'K' } },
                    x: { grid: { display: false } }
                }
            }
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
            backgroundColor: this.getDeptColor(dept) + 'B3', // 70% opacity
            borderColor: this.getDeptColor(dept),
            borderWidth: 1,
            pointRadius: 3,
            pointHoverRadius: 5
        }));

        this.charts.satisfaction = new Chart('satisfactionChart', {
            type: 'scatter',
            data: { datasets },
            options: {
                scales: {
                    x: { title: { display: true, text: 'Job Satisfaction' } },
                    y: { title: { display: true, text: 'Productivity Score' } }
                }
            }
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
                    label: 'Number of Employees',
                    data: sortedZones.map(z => z[1]),
                    backgroundColor: this.colorPalette.lightBlue,
                }]
            },
            options: {
                indexAxis: 'y', // Makes it a horizontal bar chart
                plugins: { legend: { display: false } },
                scales: { x: { grid: { display: false } } }
            }
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
                datasets: [{
                    label: 'Employee Count',
                    data,
                    backgroundColor: this.colorPalette.green
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                scales: { x: { grid: { display: false } } }
            }
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
                    label: 'Stress Level Distribution',
                    data: Object.values(modalityData),
                    backgroundColor: this.colorPalette.orange + '99',
                    borderColor: this.colorPalette.orange,
                    borderWidth: 1,
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                scales: { y: { title: { display: true, text: 'Stress Level (1-10)' } } }
            }
        });
    }

    createSleepChart() {
        this.charts.sleep = new Chart('sleepChart', {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Employees',
                    data: this.data.map(e => ({ x: e.horas_sueno_noche, y: e.nivel_estres })),
                    backgroundColor: this.colorPalette.purple + '99',
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                scales: {
                    x: { title: { display: true, text: 'Hours of Sleep per Night' } },
                    y: { title: { display: true, text: 'Stress Level' } }
                }
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready, creating dashboard...');
    window.employeeDashboard = new EmployeeDashboard();
});
