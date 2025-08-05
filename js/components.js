// UI Components for Amazon Dashboard

class KPIManager {
    constructor(data) {
        this.data = data;
        this.kpiElements = {
            totalProducts: document.getElementById('total-products'),
            avgDiscount: document.getElementById('avg-discount'),
            topCategory: document.getElementById('top-category'),
            avgRating: document.getElementById('avg-rating')
        };
        this.init();
    }
    
    init() {
        this.updateKPIs(this.data);
    }
    
    updateKPIs(data) {
        const metrics = this.calculateMetrics(data);
        
        this.animateValue(this.kpiElements.totalProducts, 0, metrics.total, 1000);
        this.animateValue(this.kpiElements.avgDiscount, 0, metrics.avgDiscount, 1000, '%');
        this.kpiElements.topCategory.textContent = metrics.topCategory;
        this.animateValue(this.kpiElements.avgRating, 0, metrics.avgRating, 1000, ' ★');
    }
    
    calculateMetrics(data) {
        if (!data || data.length === 0) {
            return { total: 0, avgDiscount: 0, avgRating: 0, topCategory: 'N/A' };
        }
        
        const total = data.length;
        const avgDiscount = d3.mean(data, d => d.discount_percentage) || 0;
        const avgRating = d3.mean(data, d => d.rating) || 0;
        
        const categoryCount = d3.rollup(data, v => v.length, d => d.main_category);
        const topCategory = Array.from(categoryCount.entries())
            .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
            
        return { 
            total, 
            avgDiscount: Math.round(avgDiscount * 10) / 10,
            avgRating: Math.round(avgRating * 10) / 10,
            topCategory 
        };
    }
    
    animateValue(element, start, end, duration, suffix = '') {
        if (!element) return;
        
        const startTime = performance.now();
        const animate = (currentTime) => {
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            const easeOut = 1 - Math.pow(1 - progress, 3);
            const currentValue = start + (end - start) * easeOut;
            
            if (suffix === '%' || suffix === ' ★') {
                element.textContent = currentValue.toFixed(1) + suffix;
            } else {
                element.textContent = Math.floor(currentValue).toLocaleString() + suffix;
            }
            
            if (progress < 1) {
                requestAnimationFrame(animate);
            }
        };
        requestAnimationFrame(animate);
    }
}

class FiltersManager {
    constructor(onFilterChange) {
        this.onFilterChange = onFilterChange;
        this.filters = {
            priceRange: [0, 10000],
            searchTerm: '',
            minRating: 1
        };
        this.debounceTimer = null;
        this.init();
    }
    
    init() {
        const priceSlider = document.getElementById('price-slider');
        const priceDisplay = document.getElementById('price-display');
        const searchBox = document.getElementById('search-box');
        const ratingSlider = document.getElementById('rating-slider');
        const ratingDisplay = document.getElementById('rating-display');
        const clearFilters = document.getElementById('clear-filters');
        
        if (priceSlider) {
            priceSlider.addEventListener('input', (e) => {
                this.filters.priceRange[1] = +e.target.value;
                if (priceDisplay) {
                    priceDisplay.textContent = `$${(+e.target.value).toLocaleString()}`;
                }
                this.debounceFilterChange();
            });
        }
        
        if (searchBox) {
            searchBox.addEventListener('input', (e) => {
                this.filters.searchTerm = e.target.value.toLowerCase().trim();
                this.debounceFilterChange();
            });
        }
        
        if (ratingSlider) {
            ratingSlider.addEventListener('input', (e) => {
                this.filters.minRating = +e.target.value;
                if (ratingDisplay) {
                    ratingDisplay.textContent = `${e.target.value}+ ★`;
                }
                this.debounceFilterChange();
            });
        }
        
        if (clearFilters) {
            clearFilters.addEventListener('click', () => {
                this.clearAllFilters();
            });
        }
    }
    
    debounceFilterChange() {
        clearTimeout(this.debounceTimer);
        this.debounceTimer = setTimeout(() => {
            this.onFilterChange(this.filters);
        }, 300);
    }
    
    clearAllFilters() {
        this.filters = {
            priceRange: [0, 10000],
            searchTerm: '',
            minRating: 1
        };
        
        const priceSlider = document.getElementById('price-slider');
        const searchBox = document.getElementById('search-box');
        const ratingSlider = document.getElementById('rating-slider');
        const priceDisplay = document.getElementById('price-display');
        const ratingDisplay = document.getElementById('rating-display');
        
        if (priceSlider) {
            priceSlider.value = 10000;
            if (priceDisplay) priceDisplay.textContent = '$10,000';
        }
        if (searchBox) searchBox.value = '';
        if (ratingSlider) {
            ratingSlider.value = 1;
            if (ratingDisplay) ratingDisplay.textContent = '1+ ★';
        }
        
        this.onFilterChange(this.filters);
    }
    
    applyFilters(data) {
        return data.filter(item => {
            const matchesPrice = item.actual_price <= this.filters.priceRange[1];
            const matchesRating = item.rating >= this.filters.minRating;
            const matchesSearch = !this.filters.searchTerm || 
                item.product_name.toLowerCase().includes(this.filters.searchTerm) ||
                item.main_category.toLowerCase().includes(this.filters.searchTerm);
            
            return matchesPrice && matchesRating && matchesSearch;
        });
    }
}

class HeatmapChart {
    constructor(containerId, data) {
        this.container = d3.select(containerId);
        this.data = data;
        this.margin = { top: 20, right: 30, bottom: 60, left: 120 };
    }
    
    draw() {
        this.container.html("");
        
        const containerRect = this.container.node().getBoundingClientRect();
        const width = containerRect.width - this.margin.left - this.margin.right;
        const height = containerRect.height - this.margin.top - this.margin.bottom;
        
        const svg = this.container.append("svg")
            .attr("width", width + this.margin.left + this.margin.right)
            .attr("height", height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);
        
        const priceRanges = ['0-50', '50-100', '100-500', '500+'];
        const categories = [...new Set(this.data.map(d => d.main_category))].slice(0, 8);
        
        const heatmapData = this.processDataForHeatmap(categories, priceRanges);
        
        const xScale = d3.scaleBand()
            .domain(priceRanges)
            .range([0, width])
            .padding(0.1);
            
        const yScale = d3.scaleBand()
            .domain(categories)
            .range([0, height])
            .padding(0.1);
            
        const colorScale = d3.scaleSequential(d3.interpolateBlues)
            .domain([0, d3.max(heatmapData, d => d.count)]);
        
        svg.selectAll(".heatmap-rect")
            .data(heatmapData)
            .join("rect")
            .attr("class", "heatmap-rect")
            .attr("x", d => xScale(d.priceRange))
            .attr("y", d => yScale(d.category))
            .attr("width", xScale.bandwidth())
            .attr("height", yScale.bandwidth())
            .attr("fill", d => colorScale(d.count))
            .attr("stroke", "white")
            .attr("stroke-width", 1)
            .on("mouseover", (event, d) => {
                d3.select("#tooltip")
                    .html(`<h4>${d.category}</h4><p>Rango: $${d.priceRange}</p><p><strong>${d.count}</strong> productos</p>`)
                    .classed("hidden", false)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 10) + "px");
            })
            .on("mouseout", () => {
                d3.select("#tooltip").classed("hidden", true);
            });
        
        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(xScale));
            
        svg.append("g")
            .call(d3.axisLeft(yScale));
            
        svg.append("text")
            .attr("class", "axis-label")
            .attr("x", width / 2)
            .attr("y", height + 50)
            .attr("text-anchor", "middle")
            .text("Rango de Precio ($)");
    }
    
    processDataForHeatmap(categories, priceRanges) {
        const result = [];
        
        categories.forEach(category => {
            priceRanges.forEach(range => {
                const categoryData = this.data.filter(d => d.main_category === category);
                let count = 0;
                
                categoryData.forEach(item => {
                    const price = item.actual_price;
                    if (range === '0-50' && price <= 50) count++;
                    else if (range === '50-100' && price > 50 && price <= 100) count++;
                    else if (range === '100-500' && price > 100 && price <= 500) count++;
                    else if (range === '500+' && price > 500) count++;
                });
                
                result.push({
                    category,
                    priceRange: range,
                    count
                });
            });
        });
        
        return result;
    }
}

class BoxPlotChart {
    constructor(containerId, data) {
        this.container = d3.select(containerId);
        this.data = data;
        this.margin = { top: 20, right: 30, bottom: 60, left: 70 };
    }
    
    draw() {
        this.container.html("");
        
        const containerRect = this.container.node().getBoundingClientRect();
        const width = containerRect.width - this.margin.left - this.margin.right;
        const height = containerRect.height - this.margin.top - this.margin.bottom;
        
        const svg = this.container.append("svg")
            .attr("width", width + this.margin.left + this.margin.right)
            .attr("height", height + this.margin.top + this.margin.bottom)
            .append("g")
            .attr("transform", `translate(${this.margin.left}, ${this.margin.top})`);
        
        const categories = [...new Set(this.data.map(d => d.main_category))].slice(0, 6);
        const boxplotData = this.calculateBoxplotData(categories);
        
        const xScale = d3.scaleBand()
            .domain(categories)
            .range([0, width])
            .padding(0.3);
            
        const yScale = d3.scaleLinear()
            .domain([0, d3.max(boxplotData, d => d.max)])
            .range([height, 0])
            .nice();
        
        const boxWidth = xScale.bandwidth();
        
        boxplotData.forEach((d, i) => {
            const x = xScale(d.category);
            const color = d3.schemeCategory10[i % 10];
            
            // Box
            svg.append("rect")
                .attr("x", x)
                .attr("y", yScale(d.q3))
                .attr("width", boxWidth)
                .attr("height", yScale(d.q1) - yScale(d.q3))
                .attr("fill", color)
                .attr("fill-opacity", 0.3)
                .attr("stroke", color)
                .attr("stroke-width", 2);
            
            // Median line
            svg.append("line")
                .attr("x1", x)
                .attr("x2", x + boxWidth)
                .attr("y1", yScale(d.median))
                .attr("y2", yScale(d.median))
                .attr("stroke", color)
                .attr("stroke-width", 3);
            
            // Whiskers
            svg.append("line")
                .attr("x1", x + boxWidth/2)
                .attr("x2", x + boxWidth/2)
                .attr("y1", yScale(d.q3))
                .attr("y2", yScale(d.max))
                .attr("stroke", color)
                .attr("stroke-width", 1);
                
            svg.append("line")
                .attr("x1", x + boxWidth/2)
                .attr("x2", x + boxWidth/2)
                .attr("y1", yScale(d.q1))
                .attr("y2", yScale(d.min))
                .attr("stroke", color)
                .attr("stroke-width", 1);
        });
        
        svg.append("g")
            .attr("transform", `translate(0, ${height})`)
            .call(d3.axisBottom(xScale))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");
            
        svg.append("g")
            .call(d3.axisLeft(yScale).tickFormat(d => `$${d}`));
            
        svg.append("text")
            .attr("class", "axis-label")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - this.margin.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text("Precio ($)");
    }
    
    calculateBoxplotData(categories) {
        return categories.map(category => {
            const prices = this.data
                .filter(d => d.main_category === category)
                .map(d => d.actual_price)
                .sort((a, b) => a - b);
            
            const q1 = d3.quantile(prices, 0.25);
            const median = d3.quantile(prices, 0.5);
            const q3 = d3.quantile(prices, 0.75);
            const min = prices[0];
            const max = prices[prices.length - 1];
            
            return { category, q1, median, q3, min, max };
        });
    }
}

// Export components
window.KPIManager = KPIManager;
window.FiltersManager = FiltersManager;
window.HeatmapChart = HeatmapChart;
window.BoxPlotChart = BoxPlotChart;