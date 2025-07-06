// Employee Analytics Dashboard - Simple Version
console.log('Main script starting...');

class EmployeeDashboard {
    constructor() {
        console.log('Creating dashboard...');
        this.data = [];
        this.charts = {};
        
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

    async loadInitialData() {
        console.log('Loading initial data from data/work.csv...');
        try {
            // La ruta es relativa a index.html
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
        return -1; // Devolver -1 si no se encuentra
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
                    data: data,
                    backgroundColor: '#1a73e8',
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
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

        const scatterData = this.data.map(emp => ({
            x: emp.satisfaction,
            y: emp.productivity
        }));

        this.charts.scatter = new Chart(canvas, {
            type: 'scatter',
            data: {
                datasets: [{
                    data: scatterData,
                    backgroundColor: '#ea4335',
                    pointRadius: 4,
                    pointHoverRadius: 6,
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    x: { title: { display: true, text: 'Satisfaction' } },
                    y: { title: { display: true, text: 'Productivity' } }
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
                    backgroundColor: ['#1a73e8', '#34a853', '#fbbc04', '#ea4335', '#9aa0a6']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%'
            }
        });
    }

    createAgeChart() {
        const canvas = document.getElementById('ageChart');
        if (!canvas) return;

        const ageGroups = { '< 30': 0, '30-39': 0, '40-49': 0, '50+': 0 };
        
        this.data.forEach(emp => {
            if (emp.age < 30) ageGroups['< 30']++;
            else if (emp.age < 40) ageGroups['30-39']++;
            else if (emp.age < 50) ageGroups['40-49']++;
            else ageGroups['50+']++;
        });

        this.charts.age = new Chart(canvas, {
            type: 'pie',
            data: {
                labels: Object.keys(ageGroups),
                datasets: [{
                    data: Object.values(ageGroups),
                    backgroundColor: ['#1a73e8', '#34a853', '#fbbc04', '#ea4335']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }
}

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM ready, creating dashboard...');
    window.employeeDashboard = new EmployeeDashboard();
});
