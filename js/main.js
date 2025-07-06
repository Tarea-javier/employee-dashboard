// Employee Analytics Dashboard - Simple & Clean
class EmployeeDashboard {
    constructor() {
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
        this.waitForChartJs(() => {
            this.createAllCharts();
        });
    }

    setupEventListeners() {
        // File upload
        const fileInput = document.getElementById('csvFile');
        const fileStatus = document.getElementById('fileStatus');

        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                fileStatus.textContent = file.name;
                this.loadCSVFile(file);
            }
        });
    }

    waitForChartJs(callback) {
        if (typeof Chart !== 'undefined') {
            console.log('✅ Chart.js loaded');
            callback();
        } else {
            console.log('⏳ Waiting for Chart.js...');
            setTimeout(() => this.waitForChartJs(callback), 100);
        }
    }

    generateSampleData() {
        console.log('🎲 Generating sample data...');
        
        const departments = ['Technology', 'Legal', 'Design', 'Operations', 'Marketing', 'Sales', 'HR'];
        const zones = ['North', 'South', 'Center', 'East', 'West'];
        const educationLevels = ['Bachelor', 'Master', 'PhD', 'High School'];
        
        this.data = Array.from({length: 50}, (_, i) => ({
            id: `EMP_${String(i + 1).padStart(3, '0')}`,
            department: departments[Math.floor(Math.random() * departments.length)],
            zone: zones[Math.floor(Math.random() * zones.length)],
            education: educationLevels[Math.floor(Math.random() * educationLevels.length)],
            age: Math.floor(Math.random() * 40) + 25,
            salary: Math.floor(Math.random() * 100000) + 50000,
            satisfaction: Math.round((Math.random() * 10) * 10) / 10,
            productivity: Math.floor(Math.random() * 50) + 50,
            experience: Math.floor(Math.random() * 20) + 1,
            stress: Math.round((Math.random() * 10) * 10) / 10
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
                this.updateAllCharts();
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
        console.log('📋 CSV Headers:', headers);

        // Map CSV columns to our data structure
        const columnMap = {
            id: ['empleado_id', 'id', 'employee_id'],
            department: ['departamento', 'department', 'dept'],
            zone: ['zona_geografica', 'zone', 'region'],
            education: ['nivel_educacion', 'education', 'education_level'],
            age: ['edad', 'age'],
            salary: ['salario_anual', 'salary', 'annual_salary'],
            satisfaction: ['satisfaccion_laboral', 'satisfaction', 'job_satisfaction'],
            productivity: ['productividad_score', 'productivity', 'productivity_score'],
            experience: ['experiencia_anos', 'experience', 'years_experience'],
            stress: ['nivel_estres', 'stress', 'stress_level']
        };

        // Find column indices
        const indices = {};
        Object.keys(columnMap).forEach(key => {
            for (const possibleName of columnMap[key]) {
                const index = headers.indexOf(possibleName);
                if (index !== -1) {
                    indices[key] = index;
                    break;
                }
            }
        });

        console.log('🗂️ Column mapping:', indices);

        // Parse data rows
        return lines.slice(1).map((line, rowIndex) => {
            const values = line.split(',').map(v => v.trim());
            
            try {
                return {
                    id: values[indices.id] || `EMP_${rowIndex + 1}`,
                    department: values[indices.department] || 'Unknown',
                    zone: values[indices.zone] || 'Unknown',
                    education: values[indices.education] || 'Unknown',
                    age: parseInt(values[indices.age]) || 30,
                    salary: parseInt(values[indices.salary]) || 50000,
                    satisfaction: parseFloat(values[indices.satisfaction]) || 5.0,
                    productivity: parseInt(values[indices.productivity]) || 75,
                    experience: parseInt(values[indices.experience]) || 5,
                    stress: parseFloat(values[indices.stress]) || 5.0
                };
            } catch (error) {
                console.warn(`⚠️ Error parsing row ${rowIndex + 1}:`, error);
                return null;
            }
        }).filter(row => row && row.department !== 'Unknown');
    }

    updateMetrics() {
        if (this.data.length === 0) return;

        const total = this.data.length;
        const avgSalary = Math.round(this.data.reduce((sum, emp) => sum + emp.salary, 0) / total);
        const avgSatisfaction = (this.data.reduce((sum, emp) => sum + emp.satisfaction, 0) / total);
        const avgProductivity = Math.round(this.data.reduce((sum, emp) => sum + emp.productivity, 0) / total);

        // Update DOM
        document.getElementById('totalEmployees').textContent = total.toLocaleString();
        document.getElementById('avgSalary').textContent = `$${avgSalary.toLocaleString()}`;
        document.getElementById('avgSatisfaction').textContent = avgSatisfaction.toFixed(1);
        document.getElementById('avgProductivity').textContent = avgProductivity;

        console.log('📊 Metrics updated:', { total, avgSalary, avgSatisfaction, avgProductivity });
    }

    createAllCharts() {
        console.log('📈 Creating all charts...');
        this.createSalaryChart();
        this.createScatterChart();
        this.createGeoChart();
        this.createAgeChart();
    }

    updateAllCharts() {
        console.log('🔄 Updating all charts...');
        // Destroy existing charts
        Object.values(this.charts).forEach(chart => {
            if (chart) chart.destroy();
        });
        // Recreate charts
        this.createAllCharts();
    }

    createSalaryChart() {
        const ctx = document.getElementById('salaryChart');
        if (!ctx) return;

        // Group by department and calculate average salary
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
                    label: 'Average Salary',
                    data: data,
                    backgroundColor: this.googleColors.blue,
                    borderRadius: 4,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `$${context.parsed.y.toLocaleString()}`
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { maxRotation: 45 }
                    },
                    y: {
                        beginAtZero: true,
                        grid: { color: '#f0f0f0' },
                        ticks: {
                            callback: (value) => '$' + value.toLocaleString()
                        }
                    }
                }
            }
        });
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
                    label: 'Employees',
                    data: scatterData,
                    backgroundColor: this.googleColors.red,
                    borderColor: this.googleColors.red,
                    pointRadius: 5,
                    pointHoverRadius: 7
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: { display: false },
                    tooltip: {
                        callbacks: {
                            label: (context) => `Satisfaction: ${context.parsed.x}, Productivity: ${context.parsed.y}`
                        }
                    }
                },
                scales: {
                    x: {
                        title: { display: true, text: 'Job Satisfaction (1-10)' },
                        min: 0,
                        max: 10,
                        grid: { color: '#f0f0f0' }
                    },
                    y: {
                        title: { display: true, text: 'Productivity Score' },
                        min: 0,
                        max: 100,
                        grid: { color: '#f0f0f0' }
                    }
                }
            }
        });
    }

    createGeoChart() {
        const ctx = document.getElementById('geoChart');
        if (!ctx) return;

        // Count employees by zone
        const zoneData = {};
        this.data.forEach(emp => {
            zoneData[emp.zone] = (zoneData[emp.zone] || 0) + 1;
        });

        const labels = Object.keys(zoneData).sort();
        const data = labels.map(zone => zoneData[zone]);
        const colors = [
            this.googleColors.blue,
            this.googleColors.green,
            this.googleColors.yellow,
            this.googleColors.red,
            this.googleColors.gray
        ];

        this.charts.geo = new Chart(ctx, {
            type: 'doughnut',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors.slice(0, labels.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { usePointStyle: true, padding: 20 }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
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

    createAgeChart() {
        const ctx = document.getElementById('ageChart');
        if (!ctx) return;

        // Group by age ranges
        const ageGroups = {
            '< 30': 0,
            '30-39': 0,
            '40-49': 0,
            '50+': 0
        };

        this.data.forEach(emp => {
            if (emp.age < 30) ageGroups['< 30']++;
            else if (emp.age < 40) ageGroups['30-39']++;
            else if (emp.age < 50) ageGroups['40-49']++;
            else ageGroups['50+']++;
        });

        const labels = Object.keys(ageGroups);
        const data = Object.values(ageGroups);
        const colors = [
            this.googleColors.blue,
            this.googleColors.green,
            this.googleColors.yellow,
            this.googleColors.red
        ];

        this.charts.age = new Chart(ctx, {
            type: 'pie',
            data: {
                labels: labels,
                datasets: [{
                    data: data,
                    backgroundColor: colors,
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { usePointStyle: true, padding: 20 }
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
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

    showLoading(show) {
        const loading = document.getElementById('loading');
        const dashboard = document.getElementById('dashboard');
        
        if (show) {
            loading.style.display = 'block';
            dashboard.style.display = 'none';
        } else {
            loading.style.display = 'none';
            dashboard.style.display = 'block';
        }
    }
}

// Initialize dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 DOM loaded, initializing dashboard...');
    window.employeeDashboard = new EmployeeDashboard();
});
