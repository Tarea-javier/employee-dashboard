'use strict';

// ===================================================================================
// I. CONFIGURACIÓN GLOBAL Y SELECCIÓN DE ELEMENTOS
// ===================================================================================
const MARGIN = { top: 20, right: 30, bottom: 60, left: 70 };
const HORIZONTAL_MARGIN = { top: 20, right: 30, bottom: 40, left: 150 };

// Seleccionamos los contenedores del DOM
const barChartContainer = d3.select("#barchart");
const discountChartContainer = d3.select("#discount-chart");
const scatterPlotContainer = d3.select("#scatterplot");
const histogramContainer = d3.select("#histogram");
const heatmapContainer = d3.select("#heatmap");
const boxplotContainer = d3.select("#boxplot");
const tooltip = d3.select("#tooltip");

// Controles
const resetButton = d3.select("#reset-button");
const infoTitle = d3.select("#info-title");
const productCount = d3.select("#product-count");

// Escala de colores para categorías de precio
const colorScale = d3.scaleOrdinal()
    .domain(["Budget", "Mid-Range", "Premium"])
    .range(["#4dd0e1", "#ffab40", "#7e57c2"]);

// Estado de la aplicación
let allData = [];
let currentFilter = null;
let filteredData = [];
let kpiManager, filtersManager, breadcrumbsManager, crossFilterManager;
let productModal, chartExpansionManager, exportManager;
let heatmapChart, boxplotChart;

// ===================================================================================
// II. CARGA Y PROCESAMIENTO DE DATOS
// ===================================================================================
d3.csv("data/amazon_cleaned.csv").then(data => {
    console.log("Datos cargados:", data.length, "filas.");

    // Coerción de tipos y validación de datos
    data.forEach(d => {
        d.actual_price = +d.actual_price;
        d.discount_percentage = +d.discount_percentage;
        d.rating = +d.rating;
        d.rating_count = +d.rating_count;
        d.isValid = !isNaN(d.rating) && d.rating > 0 &&
                    !isNaN(d.rating_count) && d.rating_count > 0 &&
                    !isNaN(d.actual_price) && d.actual_price > 0 &&
                    d.main_category && d.discount_percentage > 0;
        
        // Clasificar productos por rango de precio
        if (d.actual_price <= 50) d.price_category = "Budget";
        else if (d.actual_price <= 200) d.price_category = "Mid-Range";
        else d.price_category = "Premium";
    });

    allData = data.filter(d => d.isValid);
    filteredData = [...allData];
    console.log("Datos válidos tras limpieza:", allData.length, "filas.");

    initializeApp();

}).catch(error => {
    console.error("Error al cargar o procesar el archivo CSV:", error);
    barChartContainer.append("p").html("<strong>Error:</strong> No se pudo cargar el archivo <code>data/amazon_cleaned.csv</code>.").style("color", "red");
});

// ===================================================================================
// III. FUNCIÓN PRINCIPAL DE INICIALIZACIÓN Y EVENTOS
// ===================================================================================
function initializeApp() {
    console.log("Inicializando Dashboard mejorado...");
    
    // Inicializar componentes nuevos
    if (!kpiManager) {
        kpiManager = new KPIManager(allData);
        filtersManager = new FiltersManager(handleFilterChange);
        breadcrumbsManager = new BreadcrumbsManager(handleBreadcrumbRemove);
        crossFilterManager = new CrossFilterManager();
        productModal = new ProductModal();
        chartExpansionManager = new ChartExpansionManager();
        exportManager = new ExportManager();
        heatmapChart = new HeatmapChart("#heatmap", allData);
        boxplotChart = new BoxPlotChart("#boxplot", allData);
        
        // Registrar gráficos para cross-filtering
        crossFilterManager.registerChart("barchart", { highlightCategory: highlightCategoryInBarChart });
        crossFilterManager.registerChart("scatter", { highlightCategory: highlightCategoryInScatter });
        crossFilterManager.registerChart("discount", { highlightCategory: highlightCategoryInDiscount });
        crossFilterManager.registerChart("histogram", { highlightCategory: highlightCategoryInHistogram });
    }
    
    // Aplicar filtros actuales
    const dataToDisplay = getFilteredData();
    
    // Dibujar todas las visualizaciones
    drawBarChart(allData); // El gráfico de barras siempre muestra el total
    drawDiscountChart(dataToDisplay);
    drawScatterPlot(dataToDisplay);
    drawHistogram(dataToDisplay);
    drawHeatmap(dataToDisplay);
    drawBoxplot(dataToDisplay);
    updateInfoBox(dataToDisplay, currentFilter);
    
    // Actualizar KPIs con datos filtrados
    kpiManager.updateKPIs(dataToDisplay);

    // Configurar listeners de eventos solo una vez
    if (!resetButton.on("click")) {
        setupEventListeners();
    }
}

function handleBreadcrumbRemove(type, value) {
    if (type === 'category') {
        currentFilter = null;
        resetButton.classed("hidden", true);
    }
    // Aquí podrías manejar otros tipos de filtros
    initializeApp();
}

function highlightCategoryInBarChart(category) {
    d3.selectAll("#barchart .bar")
        .classed("highlighted", d => d.category === category)
        .classed("dimmed", d => d.category !== category);
}

function highlightCategoryInScatter(category) {
    d3.selectAll("#scatterplot .scatter-dot")
        .classed("highlighted", d => d.main_category === category)
        .classed("dimmed", d => d.main_category !== category);
}

function highlightCategoryInDiscount(category) {
    d3.selectAll("#discount-chart .bar")
        .classed("highlighted", d => d.category === category)
        .classed("dimmed", d => d.category !== category);
}

function highlightCategoryInHistogram(category) {
    // El histograma no se filtra por categoría directamente
    // pero podríamos cambiar su color o mostrar una indicación
    d3.select("#histogram").classed("category-highlighted", true);
}

function setupEventListeners() {
    resetButton.on("click", () => {
        console.log("Filtro reseteado.");
        currentFilter = null;
        
        initializeApp();
        
        resetButton.classed("hidden", true);
        d3.selectAll(".bar").style("opacity", 1);
    });

    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            console.log("Ventana redimensionada. Redibujando...");
            initializeApp();
        }, 250);
    });
}

function handleFilterChange(filters) {
    console.log("Filtros aplicados:", filters);
    
    // Aplicar filtros a los datos
    filteredData = filtersManager.applyFilters(allData);
    
    // Si hay filtro de categoría, aplicarlo también
    if (currentFilter) {
        filteredData = filteredData.filter(d => d.main_category === currentFilter);
    }
    
    // Re-dibujar visualizaciones con datos filtrados
    const dataToDisplay = filteredData;
    
    drawDiscountChart(dataToDisplay);
    drawScatterPlot(dataToDisplay);
    drawHistogram(dataToDisplay);
    drawHeatmap(dataToDisplay);
    drawBoxplot(dataToDisplay);
    updateInfoBox(dataToDisplay, currentFilter);
    kpiManager.updateKPIs(dataToDisplay);
}

function getFilteredData() {
    let data = filteredData;
    if (currentFilter) {
        data = data.filter(d => d.main_category === currentFilter);
    }
    return data;
}

// ===================================================================================
// IV. FUNCIONES DE DIBUJO DE GRÁFICOS
// ===================================================================================

/**
 * Dibuja el Gráfico de Barras de Volumen de Productos.
 */
function drawBarChart(data) {
    const categoryCounts = d3.rollup(data, v => v.length, d => d.main_category);
    const categoryData = Array.from(categoryCounts, ([key, value]) => ({ category: key, count: value }))
        .sort((a, b) => d3.descending(a.count, b.count));

    barChartContainer.html("");
    const { width, height, svg } = setupChartContainer(barChartContainer, MARGIN);
    
    const xScale = d3.scaleBand().domain(categoryData.map(d => d.category)).range([0, width]).padding(0.2);
    const yScale = d3.scaleLinear().domain([0, d3.max(categoryData, d => d.count)]).range([height, 0]).nice();

    drawAxes(svg, xScale, yScale, width, height, "Número de Productos", "", true);

    svg.selectAll(".bar")
        .data(categoryData)
        .join("rect")
            .attr("class", "bar chart-element")
            .attr("x", d => xScale(d.category))
            .attr("width", xScale.bandwidth())
            .attr("y", d => yScale(d.count))
            .attr("height", d => height - yScale(d.count))
            .style("opacity", d => (currentFilter === null || currentFilter === d.category) ? 1 : 0.4)
            .on("click", (event, d) => {
                if (currentFilter === d.category) {
                    // Si ya está filtrado, quitar filtro
                    currentFilter = null;
                    breadcrumbsManager.clearAll();
                    resetButton.classed("hidden", true);
                } else {
                    // Aplicar nuevo filtro
                    currentFilter = d.category;
                    breadcrumbsManager.clearAll();
                    breadcrumbsManager.addFilter('category', d.category, `Categoría: ${d.category}`);
                    resetButton.classed("hidden", false);
                }
                
                initializeApp();
                crossFilterManager.clearHighlight();
                d3.selectAll(".bar").style("opacity", bar_d => 
                    (currentFilter === null || currentFilter === bar_d.category) ? 1 : 0.4);
            })
            .on("mouseenter", (event, d) => {
                // Cross-filtering: destacar categoría en otros gráficos
                crossFilterManager.highlightCategory(d.category, "barchart");
                
                // Tooltip
                createTooltipHandler(d => `<h4>${d.category}</h4><p><strong>${d.count.toLocaleString()}</strong> productos</p>`)(event, d);
            })
            .on("mouseleave", (event, d) => {
                crossFilterManager.clearHighlight();
                hideTooltip(event);
            })
            .on("mousemove", moveTooltip);
}

/**
 * Dibuja el Gráfico de Barras Horizontales de Descuento Promedio.
 */
function drawDiscountChart(data) {
    const avgDiscountByCategory = d3.rollup(
        data,
        v => d3.mean(v, d => d.discount_percentage),
        d => d.main_category
    );
    const discountData = Array.from(avgDiscountByCategory, ([key, value]) => ({ category: key, avgDiscount: value }))
        .sort((a, b) => d3.descending(a.avgDiscount, b.avgDiscount));

    discountChartContainer.html("");
    const { width, height, svg } = setupChartContainer(discountChartContainer, HORIZONTAL_MARGIN);

    const xScale = d3.scaleLinear().domain([0, d3.max(discountData, d => d.avgDiscount)]).range([0, width]).nice();
    const yScale = d3.scaleBand().domain(discountData.map(d => d.category)).range([0, height]).padding(0.2);

    svg.append("g").call(d3.axisLeft(yScale));
    svg.append("g").attr("transform", `translate(0, ${height})`).call(d3.axisBottom(xScale).ticks(5).tickFormat(d => `${d}%`));

    svg.append("text").attr("class", "axis-label").attr("text-anchor", "middle").attr("x", width / 2).attr("y", height + MARGIN.bottom).text("Descuento Promedio (%)");

    svg.selectAll(".discount-bar")
        .data(discountData)
        .join("rect")
            .attr("class", "bar")
            .attr("x", xScale(0))
            .attr("y", d => yScale(d.category))
            .attr("height", yScale.bandwidth())
            .attr("width", 0)
            .on("mouseover", createTooltipHandler(d => `<h4>${d.category}</h4><p>Descuento promedio: <strong>${d.avgDiscount.toFixed(1)}%</strong></p>`))
            .on("mousemove", moveTooltip)
            .on("mouseout", hideTooltip)
            .transition()
            .duration(800)
            .attr("width", d => xScale(d.avgDiscount));
}

/**
 * Dibuja el Gráfico de Dispersión (Scatter Plot).
 */
function drawScatterPlot(data) {
    scatterPlotContainer.html("");
    const { width, height, svg } = setupChartContainer(scatterPlotContainer, MARGIN);

    const xScale = d3.scaleLinear().domain([1, 5]).range([0, width]);
    const yScale = d3.scaleLog().domain(d3.extent(data, d => d.rating_count)).range([height, 0]).nice();
    const radiusScale = d3.scaleSqrt().domain([0, d3.max(allData, d => d.discount_percentage)]).range([3, 15]);
    
    drawAxes(svg, xScale, yScale, width, height, "Popularidad (Nº Calificaciones)", "Calificación (1-5)");

    svg.selectAll(".scatter-dot")
        .data(data, d => d.product_id)
        .join("circle")
            .attr("class", "scatter-dot chart-element")
            .attr("cx", d => xScale(d.rating))
            .attr("cy", d => yScale(d.rating_count))
            .attr("r", d => radiusScale(d.discount_percentage))
            .style("fill", d => colorScale(d.price_category))
            .on("click", (event, d) => {
                event.stopPropagation();
                productModal.show(d);
            })
            .on("mouseenter", (event, d) => {
                // Destacar categoría en otros gráficos
                crossFilterManager.highlightCategory(d.main_category, "scatter");
                
                // Tooltip mejorado
                createTooltipHandler(d => `
                    <h4>${d.product_name.substring(0, 40)}...</h4>
                    <p><strong>Calificación:</strong> ${d.rating} ★</p>
                    <p><strong>Popularidad:</strong> ${d.rating_count.toLocaleString()} reseñas</p>
                    <p><strong>Descuento:</strong> ${d.discount_percentage}%</p>
                    <p><strong>Precio:</strong> ${d.actual_price}</p>
                    <p><em>Click para ver detalles</em></p>
                `)(event, d);
            })
            .on("mouseleave", (event, d) => {
                crossFilterManager.clearHighlight();
                hideTooltip(event);
            })
            .on("mousemove", moveTooltip);
}

/**
 * Dibuja el Histograma de Distribución de Calificaciones.
 */
function drawHistogram(data) {
    histogramContainer.html("");
    const { width, height, svg } = setupChartContainer(histogramContainer, MARGIN);

    const xScale = d3.scaleLinear().domain([1, 5]).range([0, width]);
    const bins = d3.histogram().value(d => d.rating).domain(xScale.domain()).thresholds(xScale.ticks(20))(data);
    const yScale = d3.scaleLinear().domain([0, d3.max(bins, d => d.length)]).range([height, 0]).nice();
    
    drawAxes(svg, xScale, yScale, width, height, "Frecuencia", "Calificación");

    svg.selectAll(".hist-bar")
      .data(bins)
      .join("rect")
        .attr("class", "bar")
        .attr("x", d => xScale(d.x0) + 1)
        .attr("width", d => Math.max(0, xScale(d.x1) - xScale(d.x0) - 1))
        .attr("y", d => yScale(d.length))
        .attr("height", d => height - yScale(d.length))
        .style("fill", "var(--color-budget)")
        .on("mouseover", createTooltipHandler(d => `<h4>Rango: ${d.x0.toFixed(1)} - ${d.x1.toFixed(1)} ★</h4><p><strong>${d.length.toLocaleString()}</strong> productos</p>`))
        .on("mousemove", moveTooltip)
        .on("mouseout", hideTooltip);
}

/**
 * Dibuja el Heatmap de Categorías vs Rangos de Precio.
 */
function drawHeatmap(data) {
    heatmapChart.data = data;
    heatmapChart.draw();
}

/**
 * Dibuja el Box Plot de Distribución de Precios.
 */
function drawBoxplot(data) {
    boxplotChart.data = data;
    boxplotChart.draw();
}

// ===================================================================================
// V. FUNCIONES AUXILIARES Y DE UTILIDAD
// ===================================================================================

/** Crea un contenedor SVG base y devuelve sus dimensiones y referencia. */
function setupChartContainer(container, margin) {
    const width = container.node().getBoundingClientRect().width - margin.left - margin.right;
    const height = container.node().getBoundingClientRect().height - margin.top - margin.bottom;
    const svg = container.append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
      .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);
    return { width, height, svg };
}

/** Dibuja los ejes X e Y con sus etiquetas. */
function drawAxes(svg, xScale, yScale, width, height, yLabel, xLabel, rotateXLabels = false) {
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(d3.format(".2s"));

    const xAxisGroup = svg.append("g").attr("transform", `translate(0, ${height})`).call(xAxis);
    if (rotateXLabels) {
        xAxisGroup.selectAll("text")
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");
    }
    
    svg.append("g").call(yAxis);

    if (xLabel) {
        svg.append("text")
            .attr("class", "axis-label")
            .attr("text-anchor", "middle")
            .attr("x", width / 2)
            .attr("y", height + MARGIN.bottom - 5)
            .text(xLabel);
    }
    
    if (yLabel) {
        svg.append("text")
            .attr("class", "axis-label")
            .attr("transform", "rotate(-90)")
            .attr("y", 0 - MARGIN.left)
            .attr("x", 0 - (height / 2))
            .attr("dy", "1em")
            .style("text-anchor", "middle")
            .text(yLabel);
    }
}

/** Actualiza el cuadro de información. */
function updateInfoBox(data, filter) {
    infoTitle.text(filter ? `Categoría: ${filter}` : "Todas las Categorías");
    productCount.text(data.length.toLocaleString());
}

// Funciones de Tooltip para reutilizar
const createTooltipHandler = (htmlContent) => (event, d) => {
    tooltip.html(htmlContent(d))
           .classed("hidden", false);
    d3.select(event.currentTarget).style("filter", "brightness(0.9)");
};

const moveTooltip = (event) => {
    tooltip.style("left", (event.pageX + 20) + "px")
           .style("top", (event.pageY) + "px");
};

const hideTooltip = (event) => {
    tooltip.classed("hidden", true);
    d3.select(event.currentTarget).style("filter", "none");
};

// Función global para redibujar gráficos expandidos
window.redrawChart = function(chartType, expanded = false) {
    const container = expanded ? 
        d3.select('.viz-card.expanded').select('.chart-wrapper') : 
        d3.select(`#${chartType}`);
    
    if (!container.node()) return;
    
    const dataToDisplay = getFilteredData();
    
    switch(chartType) {
        case 'barchart':
            // Re-implementar drawBarChart con el contenedor específico
            break;
        case 'scatter':
            // Re-implementar drawScatterPlot con el contenedor específico
            break;
        case 'discount':
            // Re-implementar drawDiscountChart con el contenedor específico  
            break;
        case 'histogram':
            // Re-implementar drawHistogram con el contenedor específico
            break;
        case 'heatmap':
            if (heatmapChart) {
                heatmapChart.data = dataToDisplay;
                heatmapChart.draw();
            }
            break;
        case 'boxplot':
            if (boxplotChart) {
                boxplotChart.data = dataToDisplay;
                boxplotChart.draw();
            }
            break;
    }
};

// Atajos de teclado
document.addEventListener('keydown', (event) => {
    if (event.ctrlKey || event.metaKey) {
        switch(event.key) {
            case 'e':
                event.preventDefault();
                if (exportManager) {
                    exportManager.exportData(getFilteredData(), 'amazon-filtered-data.csv');
                }
                break;
            case 'r':
                event.preventDefault();
                currentFilter = null;
                breadcrumbsManager.clearAll();
                filtersManager.clearAllFilters();
                initializeApp();
                break;
        }
    }
    
    if (event.key === 'Escape') {
        currentFilter = null;
        breadcrumbsManager.clearAll();
        crossFilterManager.clearHighlight();
        initializeApp();
    }
});
