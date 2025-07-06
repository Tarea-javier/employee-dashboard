console.log('Main script starting...');

class EmployeeDashboard {
    constructor() {
        console.log('Creating dashboard...');
        this.fullData = []; // Almacenará todos los datos originales
        this.filteredData = []; // Almacenará los datos filtrados para mostrar
        this.charts = {};
        this.filters = {
            departamento: 'all',
            zona_geografica: 'all'
        };

        // Paleta de colores pastel más suaves
        this.pastelPalette = [
            '#54a0ff', '#ff9f43', '#1dd1a1', '#ff6b6b', '#feca57',
            '#48dbfb', '#ff7979', '#c8d6e5', '#576574', '#eccc68'
        ];
        this.departmentColors = {};
        this.init();
    }

    async init() {
        console.log('Initializing dashboard...');
        if (typeof Chart === 'undefined') {
            console.error('Chart.js library is missing. Execution stopped.');
            return;
        }
        this.configureChartDefaults();
        this.setupFilterEventListeners();
        await this.loadInitialData();
    }

    configureChartDefaults() {
        Chart.defaults.font.family = "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif";
        Chart.defaults.plugins.legend.position = 'bottom';
        Chart.defaults.plugins.legend.labels.usePointStyle = true;
        Chart.defaults.plugins.legend.labels.boxWidth = 8;
        Chart.defaults.maintainAspectRatio = false;
    }

    getColor(key, palette) {
        if (!this.departmentColors[key]) {
            const index = Object.keys(this.departmentColors).length % palette.length;
            this.departmentColors[key] = palette[index];
        }
        return this.departmentColors[key];
    }
    
    // Nueva función para obtener colores con transparencia para un look más suave
    getSoftColor(key, palette) {
        const solidColor = this.getColor(key, palette);
        // Añadimos 'B3' al final para un 70% de opacidad
        return solidColor + 'B3'; 
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
        const indices = requiredCols.reduce((acc, col) => ({ ...acc, [col]: headers.indexOf(col) }), {});

        this.fullData = lines.map(line => {
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
        }).filter(e => e.salario_anual > 0 && e.departamento);
        
        console.log(`Processed ${this.fullData.length} employees`);
        this.populateFilterOptions();
        this.updateUI();
    }

    populateFilterOptions() {
        const departments = [...new Set(this.fullData.map(e => e.departamento))].sort();
        const geoZones = [...new Set(this.fullData.map(e => e.zona_geografica))].sort();
        
        const deptSelect = document.getElementById('filterDepartment');
        departments.forEach(d => {
            const option = document.createElement('option');
            option.value = d;
            option.textContent = d;
            deptSelect.appendChild(option);
        });

        const geoSelect = document.getElementById('filterGeoZone');
        geoZones.forEach(z => {
            const option = document.createElement('option');
            option.value = z;
            option.textContent = z;
            geoSelect.appendChild(option);
        });
    }

    setupFilterEventListeners() {
        document.getElementById('filterDepartment').addEventListener('change', (e) => {
            this.filters.departamento = e.target.value;
            this.updateUI();
        });
        document.getElementById('filterGeoZone').addEventListener('change', (e) => {
            this.filters.zona_geografica = e.target.value;
            this.updateUI();
        });
        document.getElementById('resetFilters').addEventListener('click', () => {
            this.filters.departamento = 'all';
            this.filters.zona_geografica = 'all';
            document.getElementById('filterDepartment').value = 'all';
            document.getElementById('filterGeoZone').value = 'all';
            this.updateUI();
        });
    }

    applyFilters() {
        this.filteredData = this.fullData.filter(employee => {
            const deptMatch = this.filters.departamento === 'all' || employee.departamento === this.filters.departamento;
            const geoMatch = this.filters.zona_geografica === 'all' || employee.zona_geografica === this.filters.zona_geografica;
            return deptMatch && geoMatch;
        });
    }

    updateUI() {
        this.applyFilters();
        this.updateMetrics();
        this.createAllCharts();
    }
    
    updateMetrics() {
        const data = this.filteredData;
        const total = data.length;
        
        if (total === 0) {
            document.getElementById('totalEmployees').textContent = '0';
            document.getElementById('avgSalary').textContent = 'N/A';
            document.getElementById('avgSatisfaction').textContent = 'N/A';
            document.getElementById('avgProductivity').textContent = 'N/A';
            return;
        }

        const avgSalary = Math.round(data.reduce((sum, e) => sum + e.salario_anual, 0) / total);
        const avgSatisfaction = (data.reduce((sum, e) => sum + e.satisfaccion_laboral, 0) / total);
        const avgProductivity = Math.round(data.reduce((sum, e) => sum + e.productividad_score, 0) / total);

        document.getElementById('totalEmployees').textContent = total.toLocaleString();
        document.getElementById('avgSalary').textContent = `$${avgSalary.toLocaleString()}`;
        document.getElementById('avgSatisfaction').textContent = avgSatisfaction.toFixed(1);
        document.getElementById('avgProductivity').textContent = avgProductivity.toString();
    }
    
    createAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        this.charts = {};

        if (this.filteredData.length === 0) {
            console.log("No data to display in charts after filtering.");
            return;
        }
        
        this.createSalaryChart();
        this.createSatisfactionChart();
        this.createGeoChart();
        this.createAgeHistogramChart();
        this.createStressChart();
        this.createSleepChart();
    }

    createSalaryChart() {
        const deptData = this.filteredData.reduce((acc, e) => {
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
                    backgroundColor: labels.map(dept => this.getSoftColor(dept, this.pastelPalette)),
                    borderColor: labels.map(dept => this.getColor(dept, this.pastelPalette)),
                    borderWidth: 1.5,
                }]
            },
            options: { plugins: { legend: { display: false } } }
        });
    }

    createSatisfactionChart() {
        const datasets = Object.entries(this.filteredData.reduce((acc, e) => {
            if (!acc[e.departamento]) acc[e.departamento] = [];
            acc[e.departamento].push({ x: e.satisfaccion_laboral, y: e.productividad_score });
            return acc;
        }, {})).map(([dept, data]) => ({
            label: dept,
            data,
            backgroundColor: this.getSoftColor(dept, this.pastelPalette),
            borderColor: this.getColor(dept, this.pastelPalette),
            borderWidth: 1,
        }));
        this.charts.satisfaction = new Chart('satisfactionChart', { type: 'scatter', data: { datasets } });
    }

    createGeoChart() {
        const zoneData = this.filteredData.reduce((acc, e) => {
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
                    backgroundColor: this.getSoftColor(this.pastelPalette[0], []),
                    borderColor: this.pastelPalette[0],
                    borderWidth: 1.5,
                }]
            },
            options: { indexAxis: 'y', plugins: { legend: { display: false } } }
        });
    }

    createAgeHistogramChart() {
        const ageGroups = this.filteredData.reduce((acc, e) => {
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
                    data, 
                    backgroundColor: this.getSoftColor(this.pastelPalette[2], []),
                    borderColor: this.pastelPalette[2],
                    borderWidth: 1.5,
                }] 
            },
            options: { plugins: { legend: { display: false } } }
        });
    }
    
    createStressChart() {
        const modalityData = this.filteredData.reduce((acc, e) => {
            const modality = e.modalidad_trabajo || 'N/A';
            if (!acc[modality]) acc[modality] = { total: 0, count: 0 };
            acc[modality].total += e.nivel_estres;
            acc[modality].count++;
            return acc;
        }, {});
        const labels = Object.keys(modalityData);
        const data = labels.map(m => modalityData[m].total / modalityData[m].count);
        this.charts.stress = new Chart('stressChart', {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{ 
                    label: 'Average Stress Level', 
                    data: data, 
                    backgroundColor: this.getSoftColor(this.pastelPalette[1], []),
                    borderColor: this.pastelPalette[1],
                    borderWidth: 1.5,
                }]
            },
            options: {
                plugins: { legend: { display: false } },
                scales: { y: { beginAtZero: true, title: { display: true, text: 'Average Stress (1-10)' } } }
            }
        });
    }

    calculateLinearRegression(data) {
        const n = data.length;
        if (n < 2) return { m: 0, b: 0, valid: false };

        let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
        data.forEach(({ x, y }) => {
            sumX += x;
            sumY += y;
            sumXY += x * y;
            sumXX += x * x;
        });

        const denominator = (n * sumXX - sumX * sumX);
        if (denominator === 0) return { m: 0, b: 0, valid: false };

        const m = (n * sumXY - sumX * sumY) / denominator;
        const b = (sumY - m * sumX) / n;
        return { m, b, valid: true };
    }

    createSleepChart() {
        const scatterData = this.filteredData.map(e => ({ x: e.horas_sueno_noche, y: e.nivel_estres })).filter(p => p.x && p.y);
        
        const datasets = [{
            label: 'Employees',
            data: scatterData,
            backgroundColor: this.getSoftColor(this.pastelPalette[3], []),
            borderColor: this.getColor(this.pastelPalette[3], []),
            pointRadius: 4,
            borderWidth: 1,
        }];

        const regression = this.calculateLinearRegression(scatterData);
        if (regression.valid) {
            const xValues = scatterData.map(p => p.x);
            const minX = Math.min(...xValues);
            const maxX = Math.max(...xValues);
            const trendlinePoints = [
                { x: minX, y: regression.m * minX + regression.b },
                { x: maxX, y: regression.m * maxX + regression.b }
            ];
            datasets.push({
                label: 'Trendline',
                data: trendlinePoints,
                type: 'line',
                borderColor: '#e74c3c',
                borderWidth: 2,
                pointRadius: 0,
                fill: false
            });
        }

        this.charts.sleep = new Chart('sleepChart', {
            type: 'scatter',
            data: { datasets },
            options: { 
                plugins: { legend: { display: true } },
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
