// Data processing utilities for the Employee Dashboard

/**
 * Data Processor Class - Handles all data processing operations
 */
class DataProcessor {
    /**
     * Group data by a specific field and calculate aggregations
     */
    static groupAndAggregate(data, groupField, aggregations = {}) {
        const grouped = this.groupBy(data, groupField);
        const result = {};

        Object.keys(grouped).forEach(key => {
            const group = grouped[key];
            result[key] = {
                count: group.length,
                data: group
            };

            // Calculate aggregations
            Object.keys(aggregations).forEach(field => {
                const operation = aggregations[field];
                const values = group.map(item => item[field]).filter(val => !isNaN(val));
                
                switch (operation) {
                    case 'avg':
                        result[key][`${field}_avg`] = values.length > 0 ? 
                            values.reduce((sum, val) => sum + val, 0) / values.length : 0;
                        break;
                    case 'sum':
                        result[key][`${field}_sum`] = values.reduce((sum, val) => sum + val, 0);
                        break;
                    case 'min':
                        result[key][`${field}_min`] = values.length > 0 ? Math.min(...values) : 0;
                        break;
                    case 'max':
                        result[key][`${field}_max`] = values.length > 0 ? Math.max(...values) : 0;
                        break;
                }
            });
        });

        return result;
    }

    /**
     * Group array by a field
     */
    static groupBy(array, key) {
        return array.reduce((result, item) => {
            const group = item[key];
            if (!result[group]) {
                result[group] = [];
            }
            result[group].push(item);
            return result;
        }, {});
    }

    /**
     * Calculate correlation between two numeric fields
     */
    static calculateCorrelation(data, field1, field2) {
        const pairs = data.map(item => [item[field1], item[field2]])
                         .filter(pair => !isNaN(pair[0]) && !isNaN(pair[1]));
        
        if (pairs.length < 2) return 0;

        const n = pairs.length;
        const sum1 = pairs.reduce((sum, pair) => sum + pair[0], 0);
        const sum2 = pairs.reduce((sum, pair) => sum + pair[1], 0);
        const sum1Sq = pairs.reduce((sum, pair) => sum + pair[0] * pair[0], 0);
        const sum2Sq = pairs.reduce((sum, pair) => sum + pair[1] * pair[1], 0);
        const pSum = pairs.reduce((sum, pair) => sum + pair[0] * pair[1], 0);

        const num = pSum - (sum1 * sum2 / n);
        const den = Math.sqrt((sum1Sq - sum1 * sum1 / n) * (sum2Sq - sum2 * sum2 / n));

        return den === 0 ? 0 : num / den;
    }

    /**
     * Create age groups for analysis
     */
    static createAgeGroups(data) {
        return data.map(item => ({
            ...item,
            age_group: this.getAgeGroup(item.edad)
        }));
    }

    static getAgeGroup(age) {
        if (age < 25) return '< 25';
        if (age < 35) return '25-34';
        if (age < 45) return '35-44';
        if (age < 55) return '45-54';
        return '55+';
    }

    /**
     * Create salary ranges
     */
    static createSalaryRanges(data) {
        return data.map(item => ({
            ...item,
            salary_range: this.getSalaryRange(item.salario_anual)
        }));
    }

    static getSalaryRange(salary) {
        if (salary < 50000) return '< $50K';
        if (salary < 75000) return '$50K-$75K';
        if (salary < 100000) return '$75K-$100K';
        if (salary < 150000) return '$100K-$150K';
        return '$150K+';
    }

    /**
     * Calculate percentiles for a numeric field
     */
    static calculatePercentiles(data, field, percentiles = [25, 50, 75, 95]) {
        const values = data.map(item => item[field])
                          .filter(val => !isNaN(val))
                          .sort((a, b) => a - b);
        
        if (values.length === 0) return {};

        const result = {};
        percentiles.forEach(p => {
            const index = Math.ceil((p / 100) * values.length) - 1;
            result[`p${p}`] = values[Math.max(0, index)];
        });

        return result;
    }

    /**
     * Detect outliers using IQR method
     */
    static detectOutliers(data, field) {
        const values = data.map(item => item[field]).filter(val => !isNaN(val));
        if (values.length === 0) return [];

        values.sort((a, b) => a - b);
        
        const q1Index = Math.floor(values.length * 0.25);
        const q3Index = Math.floor(values.length * 0.75);
        const q1 = values[q1Index];
        const q3 = values[q3Index];
        const iqr = q3 - q1;
        
        const lowerBound = q1 - 1.5 * iqr;
        const upperBound = q3 + 1.5 * iqr;

        return data.filter(item => {
            const value = item[field];
            return value < lowerBound || value > upperBound;
        });
    }

    /**
     * Calculate department performance metrics
     */
    static calculateDepartmentMetrics(data) {
        const departments = this.groupAndAggregate(data, 'departamento', {
            salario_anual: 'avg',
            satisfaccion_laboral: 'avg',
            productividad_score: 'avg',
            nivel_estres: 'avg',
            experiencia_anos: 'avg'
        });

        // Add performance score calculation
        Object.keys(departments).forEach(dept => {
            const metrics = departments[dept];
            // Normalize and weight the metrics (higher satisfaction and productivity, lower stress = better)
            const satisfactionScore = (metrics.satisfaccion_laboral_avg / 10) * 100;
            const productivityScore = metrics.productividad_score_avg;
            const stressScore = (10 - metrics.nivel_estres_avg) / 10 * 100; // Invert stress
            
            metrics.performance_score = (satisfactionScore + productivityScore + stressScore) / 3;
        });

        return departments;
    }

    /**
     * Calculate work-life balance metrics
     */
    static calculateWorkLifeBalance(data) {
        return data.map(item => {
            const workLifeScore = this.getWorkLifeBalanceScore(item);
            return {
                ...item,
                work_life_balance_score: workLifeScore
            };
        });
    }

    static getWorkLifeBalanceScore(employee) {
        // Scoring based on hours worked, exercise, sleep, and stress
        let score = 100; // Start with perfect score

        // Deduct points for overwork
        if (employee.horas_semanales > 45) {
            score -= (employee.horas_semanales - 45) * 2;
        }

        // Deduct points for lack of exercise
        if (employee.horas_ejercicio_semana < 3) {
            score -= (3 - employee.horas_ejercicio_semana) * 5;
        }

        // Deduct points for insufficient sleep
        if (employee.horas_sueno_noche < 7) {
            score -= (7 - employee.horas_sueno_noche) * 10;
        }

        // Deduct points for high stress
        if (employee.nivel_estres > 7) {
            score -= (employee.nivel_estres - 7) * 5;
        }

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Calculate geographic insights
     */
    static calculateGeographicMetrics(data) {
        const zones = this.groupAndAggregate(data, 'zona_geografica', {
            salario_anual: 'avg',
            satisfaccion_laboral: 'avg',
            productividad_score: 'avg'
        });

        const cities = this.groupAndAggregate(data, 'ciudad', {
            salario_anual: 'avg',
            satisfaccion_laboral: 'avg'
        });

        return { zones, cities };
    }

    /**
     * Generate insights and recommendations
     */
    static generateInsights(data) {
        const insights = [];

        // Department analysis
        const deptMetrics = this.calculateDepartmentMetrics(data);
        const deptKeys = Object.keys(deptMetrics);
        
        if (deptKeys.length > 0) {
            const bestDept = deptKeys.reduce((a, b) => 
                deptMetrics[a].performance_score > deptMetrics[b].performance_score ? a : b
            );
            const worstDept = deptKeys.reduce((a, b) => 
                deptMetrics[a].performance_score < deptMetrics[b].performance_score ? a : b
            );

            insights.push({
                type: 'department',
                title: 'Department Performance',
                message: `${bestDept} has the highest performance score, while ${worstDept} needs attention.`,
                value: deptMetrics[bestDept].performance_score.toFixed(1)
            });
        }

        // Salary insights
        const salaryStats = this.calculatePercentiles(data, 'salario_anual');
        const avgSalary = data.reduce((sum, emp) => sum + emp.salario_anual, 0) / data.length;
        
        insights.push({
            type: 'salary',
            title: 'Salary Distribution',
            message: `Average salary is ${formatCurrency(avgSalary)}. 25% earn below ${formatCurrency(salaryStats.p25 || 0)}.`,
            value: formatCurrency(avgSalary)
        });

        // Work-life balance
        const workLifeData = this.calculateWorkLifeBalance(data);
        const avgWorkLife = workLifeData.reduce((sum, emp) => sum + emp.work_life_balance_score, 0) / workLifeData.length;
        
        insights.push({
            type: 'worklife',
            title: 'Work-Life Balance',
            message: `Average work-life balance score is ${avgWorkLife.toFixed(1)}%. ${avgWorkLife < 70 ? 'Needs improvement.' : 'Good overall balance.'}`,
            value: avgWorkLife.toFixed(1) + '%'
        });

        // Correlation insights
        const satisfactionProductivityCorr = this.calculateCorrelation(data, 'satisfaccion_laboral', 'productividad_score');
        
        insights.push({
            type: 'correlation',
            title: 'Satisfaction-Productivity Correlation',
            message: `Correlation coefficient: ${satisfactionProductivityCorr.toFixed(2)}. ${satisfactionProductivityCorr > 0.5 ? 'Strong positive relationship.' : 'Weak relationship.'}`,
            value: satisfactionProductivityCorr.toFixed(2)
        });

        return insights;
    }

    /**
     * Validate and clean data
     */
    static validateAndCleanData(rawData) {
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

    /**
     * Calculate summary statistics for a field
     */
    static calculateStats(data, field) {
        const values = data.map(item => item[field]).filter(val => !isNaN(val));
        if (values.length === 0) return null;

        values.sort((a, b) => a - b);
        
        const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
        const median = values[Math.floor(values.length / 2)];
        const min = values[0];
        const max = values[values.length - 1];
        
        // Calculate standard deviation
        const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
        const stdDev = Math.sqrt(variance);

        return {
            count: values.length,
            mean: mean,
            median: median,
            min: min,
            max: max,
            stdDev: stdDev,
            range: max - min
        };
    }
}

/**
 * Utility function for currency formatting
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0
    }).format(value);
}

/**
 * Utility function for percentage formatting
 */
function formatPercentage(value, decimals = 1) {
    return (value * 100).toFixed(decimals) + '%';
}

/**
 * Utility function for number formatting
 */
function formatNumber(value, decimals = 0) {
    return Number(value).toFixed(decimals);
}

/**
 * Generate a random color from the pastel palette
 */
function getRandomPastelColor() {
    const colors = ['#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#E0BBFF', '#F0E6FF', '#E6FFF9'];
    return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Debounce function for performance optimization
 */
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Make all functions and classes available globally
window.DataProcessor = DataProcessor;
window.formatCurrency = formatCurrency;
window.formatPercentage = formatPercentage;
window.formatNumber = formatNumber;
window.getRandomPastelColor = getRandomPastelColor;
window.debounce = debounce;
