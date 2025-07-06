// Main application controller
class EmployeeDashboard {
    constructor() {
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
        this.setupEventListeners();
        this.loadSampleData();
    }

    setupEventListeners() {
        // File upload
        const fileInput = document.getElementById('csvFile');
        const fileStatus = document.getElementById('fileStatus');
        
        fileInput.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (file) {
                fileStatus.textContent = `Selected: ${file.name}`;
                this.loadCSVFile(file);
            }
        });

        // Filter event listeners
        const filterElements = ['departmentFilter', 'zoneFilter', 'modalityFilter', 'educationFilter'];
        filterElements.forEach(filterId => {
            document.getElementById(filterId).addEventListener('change', () => {
                this.applyFilters();
            });
        });

        // Reset filters
        document.getElementById('resetFilters').addEventListener('click', () => {
            this.resetFilters();
        });
    }

    async loadCSVFile(file) {
        this.showLoading(true);
        
        try {
            const text = await this.readFileAsText(file);
            const parsedData = Papa.parse(text, {
                header: true,
                dynamicTyping: true,
                skipEmptyLines: true
            });

            if (parsedData.errors.length > 0) {
                throw new Error('Error parsing CSV: ' + parsedData.errors[0].message);
            }

            this.data = this.processData(parsedData.data);
            this.filteredData = [...this.data];
            
            this.populateFilters();
            this.updateMetrics();
            this.initializeCharts();
            this.showDashboard(true);
            this.showLoading(false);

        } catch (error) {
            console.error('Error loading CSV:', error);
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
        // Generate sample data based on the CSV structure
        const sampleData = this.generateSampleData(50);
        this.data = sampleData;
        this.filteredData = [...this.data];
        
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
        // Clean and validate data
        return rawData.filter(row => {
            return row.empleado_id && 
                   row.departamento && 
                   !isNaN(row.salario_anual) && 
                   !isNaN(row.satisfaccion_laboral);
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
    }

    populateFilters() {
        const populateSelect = (selectId, field) => {
            const select = document.getElementById(selectId);
            const uniqueValues = [...new Set(this.data.map(item => item[field]))].sort();
            
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
        // Update filter values
        this.filters.department = document.getElementById('departmentFilter').value;
        this.filters.zone = document.getElementById('zoneFilter').value;
        this.filters.modality = document.getElementById('modalityFilter').value;
        this.filters.education = document.getElementById('educationFilter').value;

        // Apply filters
        this.filteredData = this.data.filter(item => {
            return (!this.filters.department || item.departamento === this.filters.department) &&
                   (!this.filters.zone || item.zona_geografica === this.filters.zone) &&
                   (!this.filters.modality || item.modalidad_trabajo === this.filters.modality) &&
                   (!this.filters.education || item.nivel_educacion === this.filters.education);
        });

        // Update metrics and charts
        this.updateMetrics();
        this.updateCharts();
    }

    resetFilters() {
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

        // Update metrics and charts
        this.updateMetrics();
        this.updateCharts();
    }

    updateMetrics() {
        if (this.filteredData.length === 0) return;

        // Calculate metrics
        const totalEmployees = this.filteredData.length;
        const avgSalary = this.filteredData.reduce((sum, emp) => sum + emp.salario_anual, 0) / totalEmployees;
        const avgSatisfaction = this.filteredData.reduce((sum, emp) => sum + emp.satisfaccion_laboral, 0) / totalEmployees;
        const avgProductivity = this.filteredData.reduce((sum, emp) => sum + emp.productividad_score, 0) / totalEmployees;

        // Update DOM
        document.getElementById('totalEmployees').textContent = totalEmployees.toLocaleString();
        document.getElementById('avgSalary').textContent = `$${Math.round(avgSalary).toLocaleString()}`;
        document.getElementById('avgSatisfaction').textContent = avgSatisfaction.toFixed(1);
        document.getElementById('avgProductivity').textContent = Math.round(avgProductivity);
    }

    initializeCharts() {
        if (this.filteredData.length === 0) return;

        // Initialize all charts
        this.charts.salary = createSalaryChart(this.filteredData);
        this.charts.scatter = createScatterChart(this.filteredData);
        this.charts.geo = createGeoChart(this.filteredData);
        this.charts.modality = createModalityChart(this.filteredData);
        this.charts.workLife = createWorkLifeChart(this.filteredData);
        this.charts.age = createAgeChart(this.filteredData);
        this.charts.education = createEducationChart(this.filteredData);
        this.charts.stress = createStressChart(this.filteredData);
    }

    updateCharts() {
        if (this.filteredData.length === 0) return;

        // Update all charts with filtered data
        Object.keys(this.charts).forEach(chartKey => {
            if (this.charts[chartKey]) {
                this.charts[chartKey].destroy();
            }
        });

        // Recreate charts with new data
        this.initializeCharts();
    }

    showLoading(show) {
        document.getElementById('loading').style.display = show ? 'block' : 'none';
    }

    showDashboard(show) {
        document.getElementById('dashboard').style.display = show ? 'block' : 'none';
        if (show) {
            document.getElementById('dashboard').classList.add('fade-in');
        }
    }

    showError(message) {
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
    window.dashboard = new EmployeeDashboard();
});
