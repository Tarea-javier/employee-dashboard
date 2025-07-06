// Main application controller
class EmployeeDashboard {
    constructor() {
        console.log('🚀 Initializing EmployeeDashboard...');
        this.data = [];
        this.filteredData = [];
        this.charts = {};
        this.filters = {
            department: '',
            zone: '',
            modality: '',
            education: ''
        };
        
        this.init();
    }

    init() {
        console.log('📋 Setting up event listeners...');
        this.setupEventListeners();
        console.log('📊 Loading sample data...');
        this.loadSampleData();
    }

    setupEventListeners() {
        // File upload
        const fileInput = document.getElementById('csvFile');
        const fileStatus = document.getElementById('fileStatus');
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                console.log('📁 File selected:', file.name);
                fileStatus.textContent = `Selected: ${file.name}`;
                this.loadCSVFile(file);
            }
        });

        // Filter event listeners
        const filterElements = ['departmentFilter', 'zoneFilter', 'modalityFilter', 'educationFilter'];
        filterElements.forEach(filterId => {
            document.getElementById(filterId).addEventListener('change', () => {
                console.log('🔍 Filter changed:', filterId);
                this.applyFilters();
            });
        });

        // Reset filters
        document.getElementById('resetFilters').addEventListener('click', () => {
            console.log('🔄 Resetting filters...');
            this.resetFilters();
        });
    }

    async loadCSVFile(file) {
        console.log('📤 Starting CSV upload...');
        this.showLoading(true);
        
        try {
            const text = await this.readFileAsText(file);
            console.log('📖 File read successfully, size:', text.length, 'characters');
            
            const parsedData = Papa.parse(text, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true
            });

            if (parsedData.errors.length > 0) {
                console.warn('⚠️ CSV parsing warnings:', parsedData.errors);
            }

            console.log('✅ CSV parsed successfully:', parsedData.data.length, 'rows');
            console.log('📋 Sample row:', parsedData.data[0]);

            this.data = this.processData(parsedData.data);
            this.filteredData = [...this.data];
            
            console.log('🔧 Processed data:', this.data.length, 'valid employees');
            
            this.populateFilters();
            this.updateMetrics();
            this.initializeCharts();
            this.showDashboard(true);
            this.showLoading(false);

        } catch (error) {
            console.error('❌ Error loading CSV:', error);
            this.showError(error.message);
            this.showLoading(false);
        }
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('Error reading file'));
            reader.readAsText(file);
        });
    }

    loadSampleData() {
        console.log('🎲 Generating sample data...');
        const sampleData = this.generateSampleData(50);
        this.data = sampleData;
        this.filteredData = [...this.data];
        
        console.log('✅ Sample data generated:', this.data.length, 'employees');
        
        this.populateFilters();
        this.updateMetrics();
        this.initializeCharts();
        this.showDashboard(true);
    }

    generateSampleData(count) {
        const departments = ['Tecnología', 'Legal', 'Diseño', 'Operaciones', 'Marketing', 'Ventas', 'RRHH'];
        const educationLevels = ['Licenciatura', 'Maestría', 'Doctorado', 'Técnico'];
        const zones = ['Centro', 'Norte', 'Sur', 'Sureste', 'Occidente'];
        const cities = ['Ciudad de México', 'Monterrey', 'Guadalajara', 'Mérida', 'Puebla'];
        const modalities = ['Presencial', 'Remoto', 'Híbrido'];
        const genders = ['Masculino', 'Femenino'];

        const data = [];
        for (let i = 0; i < count; i++) {
            data.push({
                empleado_id: `EMP_${String(i + 1).padStart(5, '0')}`,
                departamento: departments[Math.floor(Math.random() * departments.length)],
                nivel_educacion: educationLevels[Math.floor(Math.random() * educationLevels.length)],
                ciudad: cities[Math.floor(Math.random() * cities.length)],
                zona_geografica: zones[Math.floor(Math.random() * zones.length)],
                genero: genders[Math.floor(Math.random() * genders.length)],
                modalidad_trabajo: modalities[Math.floor(Math.random() * modalities.length)],
                edad: Math.floor(Math.random() * 40) + 25,
                experiencia_anos: Math.floor(Math.random() * 20) + 1,
                salario_anual: Math.floor(Math.random() * 100000) + 50000,
                horas_semanales: Math.floor(Math.random() * 20) + 35,
                nivel_estres: Math.round((Math.random() * 10) * 10) / 10,
                satisfaccion_laboral: Math.round((Math.random() * 10) * 10) / 10,
                productividad_score: Math.floor(Math.random() * 50) + 50,
                horas_ejercicio_semana: Math.floor(Math.random() * 10),
                horas_sueno_noche: Math.round((Math.random() * 4 + 6) * 10) / 10
            });
        }
        return data;
    }

    processData(rawData) {
        console.log('🔧 Processing raw data...');
        
        // Clean and validate data
        const processed = rawData.filter(row => {
            const isValid = row.empleado_id && 
                   row.departamento && 
                   !isNaN(row.salario_anual) && 
                   !isNaN(row.satisfaccion_laboral);
            
            if (!isValid) {
                console.log('⚠️ Invalid row filtered out:', row);
            }
            return isValid;
        }).map(row => ({
            ...row,
            salario_anual: Number(row.salario_anual) || 0,
            edad: Number(row.edad) || 0,
            experiencia_anos: Number(row.experiencia_anos) || 0,
            horas_semanales: Number(row.horas_semanales) || 0,
            nivel_estres: Number(row.nivel_estres) || 0,
            satisfaccion_laboral: Number(row.satisfaccion_laboral) || 0,
            productividad_score: Number(row.productividad_score) || 0,
            horas_ejercicio_semana: Number(row.horas_ejercicio_semana) || 0,
            horas_sueno_noche: Number(row.horas_sueno_noche) || 0
        }));

        console.log(`✅ Data processed: ${processed.length}/${rawData.length} valid rows`);
        return processed;
    }

    populateFilters() {
        console.log('🔽 Populating filter dropdowns...');
        
        const populateSelect = (selectId, field) => {
            const select = document.getElementById(selectId);
            const uniqueValues = [...new Set(this.data.map(item => item[field]))].sort();
            
            console.log(`Filter ${selectId}: ${uniqueValues.length} unique values for ${field}`);
            
            // Clear existing options except the first one
            select.innerHTML = select.children[0].outerHTML;
            
            uniqueValues.forEach(value => {
                if (value) {
                    const option = document.createElement('option');
                    option.value = value;
                    option.textContent = value;
                    select.appendChild(option);
                }
            });
        };

        populateSelect('departmentFilter', 'departamento');
        populateSelect('zoneFilter', 'zona_geografica');
        populateSelect('modalityFilter', 'modalidad_trabajo');
        populateSelect('educationFilter', 'nivel_educacion');
    }

    applyFilters() {
        console.log('🔍 Applying filters...');
        
        // Update filter values
        this.filters.department = document.getElementById('departmentFilter').value;
        this.filters.zone = document.getElementById('zoneFilter').value;
        this.filters.modality = document.getElementById('modalityFilter').value;
        this.filters.education = document.getElementById('educationFilter').value;

        console.log('🎯 Active filters:', this.filters);

        // Apply filters
        this.filteredData = this.data.filter(item => {
            return (!this.filters.department || item.departamento === this.filters.department) &&
                   (!this.filters.zone || item.zona_geografica === this.filters.zone) &&
                   (!this.filters.modality || item.modalidad_trabajo === this.filters.modality) &&
                   (!this.filters.education || item.nivel_educacion === this.filters.education);
        });

        console.log(`📊 Filtered data: ${this.filteredData.length}/${this.data.length} employees`);

        // Update metrics and charts
        this.updateMetrics();
        this.updateCharts();
    }

    resetFilters() {
        console.log('🔄 Resetting all filters...');
        
        // Reset filter selects
        document.getElementById('departmentFilter').value = '';
        document.getElementById('zoneFilter').value = '';
        document.getElementById('modalityFilter').value = '';
        document.getElementById('educationFilter').value = '';

        // Reset filter object
        this.filters = {
            department: '',
            zone: '',
            modality: '',
            education: ''
        };

        // Reset filtered data
        this.filteredData = [...this.data];

        console.log('✅ Filters reset, showing all', this.filteredData.length, 'employees');

        // Update metrics and charts
        this.updateMetrics();
        this.updateCharts();
    }

    updateMetrics() {
        if (this.filteredData.length === 0) {
            console.log('⚠️ No data to update metrics');
            return;
        }

        console.log('📈 Updating metrics...');

        // Calculate metrics
        const totalEmployees = this.filteredData.length;
        const avgSalary = this.filteredData.reduce((sum, emp) => sum + emp.salario_anual, 0) / totalEmployees;
        const avgSatisfaction = this.filteredData.reduce((sum, emp) => sum + emp.satisfaccion_laboral, 0) / totalEmployees;
        const avgProductivity = this.filteredData.reduce((sum, emp) => sum + emp.productividad_score, 0) / totalEmployees;

        console.log('📊 Calculated metrics:', {
            totalEmployees,
            avgSalary: Math.round(avgSalary),
            avgSatisfaction: avgSatisfaction.toFixed(1),
            avgProductivity: Math.round(avgProductivity)
        });

        // Update DOM
        document.getElementById('totalEmployees').textContent = totalEmployees.toLocaleString();
        document.getElementById('avgSalary').textContent = `$${Math.round(avgSalary).toLocaleString()}`;
        document.getElementById('avgSatisfaction').textContent = avgSatisfaction.toFixed(1);
        document.getElementById('avgProductivity').textContent = Math.round(avgProductivity);
    }

    initializeCharts() {
        if (this.filteredData.length === 0) {
            console.log('⚠️ No data to initialize charts');
            return;
        }

        console.log('📊 Initializing charts...');
        console.log('🔍 Chart.js available?', typeof Chart !== 'undefined');
        console.log('🔍 Chart functions available?', {
            createSalaryChart: typeof window.createSalaryChart,
            createScatterChart: typeof window.createScatterChart,
            createGeoChart: typeof window.createGeoChart
        });
        
        if (typeof Chart === 'undefined') {
            console.error('❌ Chart.js is not loaded! Charts cannot be created.');
            return;
        }

        try {
            console.log('📊 Creating salary chart...');
            this.charts.salary = window.createSalaryChart ? window.createSalaryChart(this.filteredData) : this.createSimpleChart('salaryChart', 'bar');
            
            console.log('📊 Creating scatter chart...');
            this.charts.scatter = window.createScatterChart ? window.createScatterChart(this.filteredData) : this.createSimpleChart('scatterChart', 'scatter');
            
            console.log('📊 Creating geo chart...');
            this.charts.geo = window.createGeoChart ? window.createGeoChart(this.filteredData) : this.createSimpleChart('geoChart', 'doughnut');
            
            console.log('📊 Creating modality chart...');
            this.charts.modality = window.createModalityChart ? window.createModalityChart(this.filteredData) : this.createSimpleChart('modalityChart', 'bar');
            
            console.log('📊 Creating work-life chart...');
            this.charts.workLife = window.createWorkLifeChart ? window.createWorkLifeChart(this.filteredData) : this.createSimpleChart('workLifeChart', 'bar');
            
            console.log('📊 Creating age chart...');
            this.charts.age = window.createAgeChart ? window.createAgeChart(this.filteredData) : this.createSimpleChart('ageChart', 'pie');
            
            console.log('📊 Creating education chart...');
            this.charts.education = window.createEducationChart ? window.createEducationChart(this.filteredData) : this.createSimpleChart('educationChart', 'bar');
            
            console.log('📊 Creating stress chart...');
            this.charts.stress = window.createStressChart ? window.createStressChart(this.filteredData) : this.createSimpleChart('stressChart', 'bar');
            
            console.log('✅ All charts initialized successfully!');
        } catch (error) {
            console.error('❌ Error initializing charts:', error);
        }
    }

    createSimpleChart(canvasId, type) {
        console.log(`🎨 Creating simple ${type} chart for ${canvasId}`);
        const ctx = document.getElementById(canvasId).getContext('2d');
        
        // Simple fallback chart
        return new Chart(ctx, {
            type: type,
            data: {
                labels: ['Tecnología', 'Legal', 'Diseño', 'Operaciones'],
                datasets: [{
                    label: 'Sample Data',
                    data: [120000, 80000, 95000, 70000],
                    backgroundColor: ['#FFB3BA', '#FFDFBA', '#BAFFC9', '#BAE1FF']
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }

    updateCharts() {
        if (this.filteredData.length === 0) {
            console.log('⚠️ No data to update charts');
            return;
        }

        console.log('🔄 Updating charts with filtered data...');

        // Update all charts with filtered data
        Object.keys(this.charts).forEach(chartKey => {
            if (this.charts[chartKey]) {
                console.log(`🗑️ Destroying ${chartKey} chart...`);
                this.charts[chartKey].destroy();
            }
        });

        // Recreate charts with new data
        this.initializeCharts();
    }

    showLoading(show) {
        document.getElementById('loading').style.display = show ? 'block' : 'none';
        console.log('⏳ Loading state:', show ? 'ON' : 'OFF');
    }

    showDashboard(show) {
        document.getElementById('dashboard').style.display = show ? 'block' : 'none';
        if (show) {
            document.getElementById('dashboard').classList.add('fade-in');
        }
        console.log('📊 Dashboard visibility:', show ? 'VISIBLE' : 'HIDDEN');
    }

    showError(message) {
        console.error('❌ Showing error:', message);
        document.getElementById('errorMessage').textContent = message;
        document.getElementById('errorState').style.display = 'block';
    }
}

// Utility functions
const groupBy = (array, key) => {
    return array.reduce((result, item) => {
        const group = item[key];
        if (!result[group]) {
            result[group] = [];
        }
        result[group].push(item);
        return result;
    }, {});
};

const calculateAverage = (array, key) => {
    if (array.length === 0) return 0;
    return array.reduce((sum, item) => sum + (item[key] || 0), 0) / array.length;
};

// Initialize the dashboard when the page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 DOM Content Loaded');
    console.log('🔍 Checking dependencies...');
    console.log('📊 Chart.js loaded?', typeof Chart !== 'undefined');
    console.log('📄 Papa Parse loaded?', typeof Papa !== 'undefined');
    
    // Wait for all dependencies to load
    const initDashboard = () => {
        if (typeof Chart !== 'undefined' && typeof Papa !== 'undefined') {
            console.log('✅ All dependencies loaded, initializing dashboard...');
            window.dashboard = new EmployeeDashboard();
        } else {
            console.log('⏳ Waiting for dependencies... Chart:', typeof Chart !== 'undefined', 'Papa:', typeof Papa !== 'undefined');
            setTimeout(initDashboard, 500);
        }
    };
    
    initDashboard();
});
