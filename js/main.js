// Employee Analytics Dashboard - Waits for Chart.js
console.log('📦 main.js loading...');

class EmployeeDashboard {
    constructor() {
        console.log('🏗️ EmployeeDashboard constructor called');
        this.data = [];
        this.charts = {};
        this.googleColors = {
            blue: '#1a73e8',
            green: '#34a853',
            yellow: '#fbbc04',
            red: '#ea4335',
            gray: '#9aa0a6'
        };
        
        this.init();
    }

    init() {
        console.log('🚀 Initializing Employee Dashboard...');
        this.setupEventListeners();
        this.generateSampleData();
        this.updateMetrics();
        
        // Esperar a que Chart.js se cargue antes de crear gráficas
        this.waitForChartJs();
    }

    waitForChartJs() {
        console.log('⏳ Waiting for Chart.js to load...');
        
        const checkChartJs = () => {
            if (typeof Chart !== 'undefined') {
                console.log('✅ Chart.js is now available!');
                this.createAllCharts();
            } else {
                console.log('⏳ Still waiting for Chart.js...');
                setTimeout(checkChartJs, 100); // Check every 100ms
            }
        };
        
        checkChartJs();
    }

    setupEventListeners() {
        console.log('📱 Setting up event listeners...');
        
        const fileInput = document.getElementById('csvFile');
        const fileStatus = document.getElementById('fileStatus');

        if (!fileInput) {
            console.error('❌ csvFile input not found');
            return;
        }

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                console.log('📁 File selected:', file.name);
                fileStatus.textContent = file.name;
                this.loadCSVFile(file);
            }
        });
        
        console.log('✅ Event listeners set up');
    }

    generateSampleData() {
        console.log('🎲 Generating sample data...');
        
        const departments = ['Technology', 'Legal', 'Design', 'Operations', 'Marketing', 'Sales', 'HR'];
        const zones = ['North', 'South', 'Center', 'East', 'West'];
        
        this.data = Array.from({length: 50}, (_, i) => ({
            id: `EMP_${String(i + 1).padStart(3, '0')}`,
            department: departments[Math.floor(Math.random() * departments.length)],
            zone: zones[Math.floor(Math.random() * zones.length)],
            age: Math.floor(Math.random() * 40) + 25,
            salary: Math.floor(Math.random() * 100000) + 50000,
            satisfaction: Math.round((Math.random() * 10) * 10) / 10,
            productivity: Math.floor(Math.random() * 50) + 50
        }));

        console.log(`✅ Generated ${this.data.length} employee records`);
    }

    async loadCSVFile(file) {
        console.log('📄 Loading CSV file...');
        this.showLoading(true);

        try {
            const text = await file.text();
            const parsed = this.parseCSV(text);
            
            if (parsed.length > 0) {
                this.data = parsed;
                console.log(`✅ CSV loaded: ${this.data.length} employees`);
                this.updateMetrics();
                
                // Solo actualizar gráficas si Chart.js está disponible
                if (typeof Chart !== 'undefined') {
                    this.updateAllCharts();
                } else {
                    console.log('⏳ Chart.js not ready yet, will update charts when available');
                }
            } else {
                console.error('❌ No valid data found in CSV');
            }
        } catch (error) {
            console.error('❌ Error loading CSV:', error);
        } finally {
            this.showLoading(false);
        }
    }

    parseCSV(text) {
        const lines = text.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];

        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        console.log('📋 CSV Headers found:', headers.length);

        // Simple mapping for common CSV formats
        const findColumn = (possibleNames) => {
            for (const name of possibleNames) {
                const index = headers.indexOf(name);
                if (index !== -1) return index;
            }
            return -1;
        };

        const indices = {
            id: findColumn(['empleado_id', 'id', 'employee_id']),
            department: findColumn(['departamento', 'department']),
            zone: findColumn(['zona_geografica', 'zone', 'region']),
            age: findColumn(['edad', 'age']),
            salary: findColumn(['salario_anual', 'salary']),
            satisfaction: findColumn(['satisfaccion_laboral', 'satisfaction']),
            productivity: findColumn(['productividad_score', 'productivity'])
        };

        console.log('🗂️ Column mapping:', indices);

        // Parse data rows
        return lines.slice(1).map((line, rowIndex) => {
            const values = line.split(',').map(v => v.trim());
            
            try {
                return {
                    id: values[indices.id] || `EMP_${rowIndex + 1}`,
                    department: values[indices.department] || 'Unknown',
                    zone: values[indices.zone] || 'Unknown',
                    age: parseInt(values[indices.age]) || 30,
                    salary: parseInt(values[indices.salary]) || 50000,
                    satisfaction: parseFloat(values[indices.satisfaction]) || 5.0,
                    productivity: parseInt(values[indices.productivity]) || 75
                };
            } catch (error) {
                return null;
            }
        }).filter(row => row && row.department !== 'Unknown');
    }

    updateMetrics() {
        console.log('📊 Updating metrics...');
        
        if (this.data.length === 0) return;

        const total = this.data.length;
        const avgSalary = Math.round(this.data.reduce((sum, emp) => sum + emp.salary, 0) / total);
        const avgSatisfaction = (this.data.reduce((sum, emp) => sum + emp.satisfaction, 0) / total);
        const avgProductivity = Math.round(this.data.reduce((sum, emp) => sum + emp.productivity, 0) / total);

        // Update DOM elements safely
        const updateElement = (id, value) => {
            const element = document.getElementById(id);
            if (element) element.textContent = value;
        };

        updateElement('totalEmployees', total.toLocaleString());
        updateElement('avgSalary', `$${avgSalary.toLocaleString()}`);
        updateElement('avgSatisfaction', avgSatisfaction.toFixed(1));
        updateElement('avgProductivity', avgProductivity);

        console.log('✅ Metrics updated:', { total, avgSalary, avgSatisfaction, avgProductivity });
    }

    createAllCharts() {
        console.log('📈 Creating all charts...');
        
        if (typeof Chart === 'undefined') {
            console.error('❌ Chart.js still not available');
            return;
        }

        if (this.data.length === 0) {
            console.error('❌ No data available for charts');
            return;
        }

        console.log('✅ Chart.js is available, creating charts...');

        try {
            this.createSalaryChart();
            this.createScatterChart();
            this.createGeoChart();
            this.createAgeChart();
            console.log('🎉 All charts created successfully!');
        } catch (error) {
            console.error('❌ Error creating charts:', error);
        }
    }

    updateAllCharts() {
        console.log('🔄 Updating all charts...');
        
        // Destroy existing charts
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        
        this.charts = {}; // Clear charts object
        this.createAllCharts(); // Recreate all charts
    }

    createSalaryChart() {
        const ctx = document.getElementById('salaryChart');
        if (!ctx) {
            console.error('❌ Salary chart canvas not found');
            return;
        }

        // Group by department
        const deptData = {};
        this.data.forEach(emp => {
            if (!deptData[emp.department]) {
                deptData[emp.department] = { total: 0, count: 0 };
            }
            deptData[emp.department].total += emp.salary;
            deptData[emp.department].count += 1;
        });

        const labels = Object.keys(deptData).sort();
        const data = labels.map(dept => Math.round(deptData[dept].total / deptData[dept].count));

        this.charts.salary = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: this.googleColors.blue,
                    borderRadius: 4
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: { legend: { display: false } },
                scales: {
                    y: {
                        beginAtZero: true,
                        ticks: {
                            callback: (value) => '$' + value.toLocaleString()
                        }
                    }
                }
            }
        });

        console.log('✅ Salary chart created');
    }

    createScatterChart() {
        const ctx = document.getElementById('scatterChart');
        if (!ctx) return;

        const scatterData = this.data.map(emp => ({
            x: emp.satisfaction,
            y: emp.productivity
        }));

        this.charts.scatter = new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    data: scatterData,
                    backgroundColor: this.googleColors.red,
                    pointRadius: 4
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

        console.log('✅ Scatter chart created');
    }

    createGeoChart() {
        const ctx = document.getElementById('geoChart');
        if (!ctx) return;

        const zoneData = {};
        this.data.forEach(emp => {
            zoneData[emp.zone] = (zoneData[emp.zone] || 0) + 1;
        });

        const labels = Object.keys(zoneData).sort();
        const data = labels.map(zone => zoneData[zone]);

        this.charts.geo = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: [
                        this.googleColors.blue,
                        this.googleColors.green,
                        this.googleColors.yellow,
                        this.googleColors.red,
                        this.googleColors.gray
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%'
            }
        });

        console.log('✅ Geographic chart created');
    }

    createAgeChart() {
        const ctx = document.getElementById('ageChart');
        if (!ctx) return;

        const ageGroups = { '< 30': 0, '30-39': 0, '40-49': 0, '50+': 0 };
        
        this.data.forEach(emp => {
            if (emp.age < 30) ageGroups['< 30']++;
            else if (emp.age < 40) ageGroups['30-39']++;
            else if (emp.age < 50) ageGroups['40-49']++;
            else ageGroups['50+']++;
        });

        this.charts.age = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: Object.keys(ageGroups),
                datasets: [{
                    data: Object.values(ageGroups),
                    backgroundColor: [
                        this.googleColors.blue,
                        this.googleColors.green,
                        this.googleColors.yellow,
                        this.googleColors.red
                    ]
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });

        console.log('✅ Age chart created');
    }

    showLoading(show) {
        const loading = document.getElementById('loading');
        const dashboard = document.getElementById('dashboard');
        
        if (loading && dashboard) {
            if (show) {
                loading.style.display = 'block';
                dashboard.style.display = 'none';
            } else {
                loading.style.display = 'none';
                dashboard.style.display = 'block';
            }
        }
    }
}

// Initialize when DOM is ready
console.log('🌟 Setting up dashboard initialization...');

function initializeDashboard() {
    console.log('🚀 Initializing dashboard...');
    window.employeeDashboard = new EmployeeDashboard();
}

// Wait for DOM
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeDashboard);
} else {
    initializeDashboard();
}
