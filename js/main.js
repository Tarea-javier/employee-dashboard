'use strict';

// Fichero: main.js
// Proyecto: Dashboard de Análisis de Productos
// Autor: Gemini
// Descripción: Script principal para renderizar cuatro visualizaciones interactivas
// y conectadas utilizando la librería D3.js, con un enfoque en la legibilidad
// y la eficiencia del rendimiento.

// ===================================================================================
// I. CONFIGURACIÓN GLOBAL Y SELECCIÓN DE ELEMENTOS
// ===================================================================================
const MARGIN = { top: 20, right: 30, bottom: 60, left: 70 };
const HORIZONTAL_MARGIN = { top: 20, right: 30, bottom: 40, left: 150 }; // Margen mayor para etiquetas horizontales

// Seleccionamos los contenedores del DOM.
const barChartContainer = d3.select("#barchart");
const discountChartContainer = d3.select("#discount-chart"); // NUEVO
const scatterPlotContainer = d3.select("#scatterplot");
const histogramContainer = d3.select("#histogram");
const tooltip = d3.select("#tooltip");

// Controles
const resetButton = d3.select("#reset-button");
const infoTitle = d3.select("#info-title");
const productCount = d3.select("#product-count");

// Escala de colores para categorías de precio.
const colorScale = d3.scaleOrdinal()
    .domain(["Budget", "Mid-Range", "Premium"])
    .range(["#4dd0e1", "#ffab40", "#7e57c2"]); // Nueva paleta

// Estado de la aplicación
let allData = [];
let currentFilter = null;


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
    });

    allData = data.filter(d => d.isValid);
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
    console.log("Inicializando Dashboard...");
    
    // Aplicar el filtro actual o usar todos los datos
    const dataToDisplay = currentFilter ? allData.filter(d => d.main_category === currentFilter) : allData;

    // Dibujar todas las visualizaciones
    drawBarChart(allData); // El gráfico de barras siempre muestra el total para permitir la selección
    drawDiscountChart(dataToDisplay); // NUEVO
    drawScatterPlot(dataToDisplay);
    drawHistogram(dataToDisplay);
    updateInfoBox(dataToDisplay, currentFilter);

    // Configurar listeners de eventos solo una vez
    if (!resetButton.on("click")) {
        setupEventListeners();
    }
}

function setupEventListeners() {
    resetButton.on("click", () => {
        console.log("Filtro reseteado.");
        currentFilter = null;
        
        initializeApp(); // Re-inicializa la vista con todos los datos
        
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


// ===================================================================================
// IV. FUNCIONES DE DIBUJO DE GRÁFICOS
// ===================================================================================

/**
 * Dibuja el Gráfico de Barras de Volumen de Productos.
 * @param {Array} data - El conjunto de datos completo.
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
            .attr("class", "bar")
            .attr("x", d => xScale(d.category))
            .attr("width", xScale.bandwidth())
            .attr("y", d => yScale(d.count))
            .attr("height", d => height - yScale(d.count))
            .style("opacity", d => (currentFilter === null || currentFilter === d.category) ? 1 : 0.4)
            .on("click", (event, d) => {
                currentFilter = d.category;
                initializeApp(); // Re-renderizar todo con el nuevo filtro
                resetButton.classed("hidden", false);
                d3.selectAll(".bar").style("opacity", bar_d => (bar_d.category === currentFilter) ? 1 : 0.4);
            })
            .on("mouseover", createTooltipHandler(d => `<h4>${d.category}</h4><p><strong>${d.count.toLocaleString()}</strong> productos</p>`))
            .on("mousemove", moveTooltip)
            .on("mouseout", hideTooltip);
}

/**
 * NUEVO: Dibuja el Gráfico de Barras Horizontales de Descuento Promedio.
 * @param {Array} data - El conjunto de datos a visualizar.
 */
function drawDiscountChart(data) {
    // Agrupar por categoría y calcular el descuento promedio
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

    // Dibujar ejes (invertidos para gráfico horizontal)
    svg.append("g").call(d3.axisLeft(yScale));
    svg.append("g").attr("transform", `translate(0, ${height})`).call(d3.axisBottom(xScale).ticks(5).tickFormat(d => `${d}%`));

    // Etiqueta del eje X
    svg.append("text").attr("class", "axis-label").attr("text-anchor", "middle").attr("x", width / 2).attr("y", height + MARGIN.bottom).text("Descuento Promedio (%)");

    svg.selectAll(".discount-bar")
        .data(discountData)
        .join("rect")
            .attr("class", "bar")
            .attr("x", xScale(0))
            .attr("y", d => yScale(d.category))
            .attr("height", yScale.bandwidth())
            .attr("width", 0) // Empezar en 0 para la animación
            .on("mouseover", createTooltipHandler(d => `<h4>${d.category}</h4><p>Descuento promedio: <strong>${d.avgDiscount.toFixed(1)}%</strong></p>`))
            .on("mousemove", moveTooltip)
            .on("mouseout", hideTooltip)
            .transition() // Animación de entrada
            .duration(800)
            .attr("width", d => xScale(d.avgDiscount));
}


/**
 * Dibuja el Gráfico de Dispersión (Scatter Plot).
 * @param {Array} data - El conjunto de datos a visualizar.
 */
function drawScatterPlot(data) {
    // OPTIMIZACIÓN: Con decenas de miles de puntos, cambiar a <canvas> sería más rápido.
    // Para ~1300 puntos, SVG es ideal porque facilita la interacción por elemento.
    scatterPlotContainer.html("");
    const { width, height, svg } = setupChartContainer(scatterPlotContainer, MARGIN);

    const xScale = d3.scaleLinear().domain([1, 5]).range([0, width]);
    const yScale = d3.scaleLog().domain(d3.extent(data, d => d.rating_count)).range([height, 0]).nice();
    const radiusScale = d3.scaleSqrt().domain([0, d3.max(allData, d => d.discount_percentage)]).range([3, 20]);
    
    drawAxes(svg, xScale, yScale, width, height, "Popularidad (Nº Calificaciones)", "Calificación (1-5)");

    svg.selectAll(".scatter-dot")
        .data(data, d => d.product_id)
        .join("circle")
            .attr("class", "scatter-dot")
            .attr("cx", d => xScale(d.rating))
            .attr("cy", d => yScale(d.rating_count))
            .attr("r", d => radiusScale(d.discount_percentage))
            .style("fill", d => colorScale(d.price_category))
            .on("click", (event, d) => d.product_link && window.open(d.product_link, "_blank"))
            .on("mouseover", createTooltipHandler(d => `
                <h4>${d.product_name.substring(0, 40)}...</h4>
                <p><strong>Calificación:</strong> ${d.rating} ★</p>
                <p><strong>Popularidad:</strong> ${d.rating_count.toLocaleString()} reseñas</p>
                <p><strong>Descuento:</strong> ${d.discount_percentage}%</p>
            `))
            .on("mousemove", moveTooltip)
            .on("mouseout", hideTooltip);
}

/**
 * Dibuja el Histograma de Distribución de Calificaciones.
 * @param {Array} data - El conjunto de datos a visualizar.
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
        xAxisGroup.selectAll("text").attr("transform", "translate(-10,0)rotate(-45)").style("text-anchor", "end");
    }
    
    svg.append("g").call(yAxis);

    svg.append("text").attr("class", "axis-label").attr("text-anchor", "middle").attr("x", width / 2).attr("y", height + MARGIN.bottom - 5).text(xLabel);
    svg.append("text").attr("class", "axis-label").attr("transform", "rotate(-90)").attr("y", 0 - MARGIN.left).attr("x", 0 - (height / 2)).attr("dy", "1em").style("text-anchor", "middle").text(yLabel);
}

/** Actualiza el cuadro de información. */
function updateInfoBox(data, filter) {
    infoTitle.text(filter ? `Categoría: ${filter}` : "Todas las Categorías");
    productCount.text(data.length.toLocaleString());
}

// --- Funciones de Tooltip para reutilizar ---
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
