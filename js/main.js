'use strict';

// Fichero: main.js
// Proyecto: Visualización Interactiva de Productos de Amazon
// Autor: Gemini
// Descripción: Script principal para cargar datos, procesarlos y renderizar
// tres visualizaciones interactivas y conectadas utilizando la librería D3.js.

// ===================================================================================
// I. CONFIGURACIÓN GLOBAL Y SELECCIÓN DE ELEMENTOS
// ===================================================================================
// En esta sección definimos constantes, variables globales y seleccionamos los
// elementos del DOM donde se dibujarán nuestras visualizaciones.

// Márgenes estándar para los gráficos. Ayudan a que los ejes y etiquetas no se corten.
const MARGIN = { top: 20, right: 30, bottom: 60, left: 70 };

// Seleccionamos los contenedores principales del DOM.
const barChartContainer = d3.select("#barchart");
const scatterPlotContainer = d3.select("#scatterplot");
const histogramContainer = d3.select("#histogram");
const tooltip = d3.select("#tooltip");

// Seleccionamos elementos de control e información.
const resetButton = d3.select("#reset-button");
const infoTitle = d3.select("#info-title");
const productCount = d3.select("#product-count");

// Paleta de colores para las categorías de precio.
const colorScale = d3.scaleOrdinal()
    .domain(["Budget", "Mid-Range", "Premium"])
    .range(["#66c2a5", "#fc8d62", "#8da0cb"]);

// Almacenará todos los datos cargados del CSV para poder reutilizarlos.
let allData = [];
// Almacenará la categoría actualmente seleccionada para filtrar.
let currentFilter = null;


// ===================================================================================
// II. CARGA Y PROCESAMIENTO DE DATOS
// ===================================================================================
// Esta es la puerta de entrada. Usamos d3.csv para cargar los datos de forma
// asíncrona. Una vez cargados, los procesamos para asegurarnos de que los
// tipos de datos son correctos (números, fechas, etc.).

d3.csv("data/amazon_cleaned.csv").then(data => {
    console.log("Datos cargados exitosamente:", data.length, "filas.");

    // --- Sub-sección: Limpieza y Coerción de Tipos ---
    // El CSV carga todo como texto. Es CRÍTICO convertir los campos numéricos
    // a tipo `Number` para que las escalas y cálculos de D3 funcionen.
    data.forEach(d => {
        d.actual_price = +d.actual_price;
        d.discount_percentage = +d.discount_percentage;
        d.rating = +d.rating;
        d.rating_count = +d.rating_count;

        // Validamos que los datos esenciales no sean NaN (Not a Number) o 0.
        // Si falta un dato clave (como el precio o la calificación), el punto
        // no es útil para la visualización.
        d.isValid = !isNaN(d.rating) && d.rating > 0 &&
                    !isNaN(d.rating_count) && d.rating_count > 0 &&
                    !isNaN(d.actual_price) && d.actual_price > 0 &&
                    d.main_category; // Asegura que la categoría exista
    });

    // Filtramos los datos para quedarnos solo con las filas válidas.
    allData = data.filter(d => d.isValid);
    
    console.log("Datos válidos tras la limpieza:", allData.length, "filas.");

    // --- Sub-sección: Inicialización de la App ---
    // Una vez los datos están listos, llamamos a la función principal que
    // dibujará las visualizaciones por primera vez.
    initializeApp();

}).catch(error => {
    // Si hay un error al cargar el CSV (p.ej. no se encuentra), lo mostramos.
    console.error("Error al cargar o procesar el archivo CSV:", error);
    barChartContainer.append("p").text("Error al cargar datos. Asegúrate de que 'data/amazon_cleaned.csv' existe.").style("color", "red");
});


// ===================================================================================
// III. FUNCIÓN PRINCIPAL DE INICIALIZACIÓN
// ===================================================================================
// Esta función orquesta la creación de toda la página. Llama a las funciones
// de dibujo para cada gráfico y configura los listeners de eventos.

function initializeApp() {
    console.log("Inicializando la aplicación de visualización...");
    
    // 1. Dibujar todas las visualizaciones con el conjunto de datos completo.
    drawBarChart(allData);
    drawScatterPlot(allData);
    drawHistogram(allData);
    updateInfoBox(allData);

    // 2. Configurar el listener para el botón de reseteo.
    resetButton.on("click", () => {
        console.log("Botón de reseteo pulsado.");
        currentFilter = null; // Limpiar el filtro
        
        // Actualizar todas las vistas para mostrar los datos completos.
        drawScatterPlot(allData);
        drawHistogram(allData);
        updateInfoBox(allData);

        // Ocultar el botón de reseteo y resaltar todas las barras.
        resetButton.classed("hidden", true);
        d3.selectAll(".bar").style("opacity", 1);
    });

    // 3. Configurar el listener para hacer los gráficos responsivos.
    // Usamos un 'debounce' simple para no redibujar constantemente mientras se
    // cambia el tamaño de la ventana, solo al final.
    let resizeTimer;
    window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => {
            console.log("Ventana redimensionada. Redibujando visualizaciones...");
            initializeApp(); // Vuelve a dibujar todo con las nuevas dimensiones
        }, 200);
    });
}


// ===================================================================================
// IV. FUNCIONES DE DIBUJO DE GRÁFICOS
// ===================================================================================

/**
 * Dibuja/actualiza el Gráfico de Barras de Categorías.
 * @param {Array} data - El conjunto de datos a visualizar.
 */
function drawBarChart(data) {
    // --- 1. Agregación de Datos ---
    // Contamos cuántos productos hay en cada `main_category`.
    const categoryCounts = d3.rollup(data, v => v.length, d => d.main_category);
    // Convertimos el mapa a un array de objetos, más fácil de usar en D3.
    const categoryData = Array.from(categoryCounts, ([key, value]) => ({ category: key, count: value }))
        .sort((a, b) => d3.descending(a.count, b.count)); // Ordenar de mayor a menor.

    // --- 2. Dimensiones y SVG ---
    barChartContainer.html(""); // Limpiar contenido previo.
    const width = barChartContainer.node().getBoundingClientRect().width - MARGIN.left - MARGIN.right;
    const height = barChartContainer.node().getBoundingClientRect().height - MARGIN.top - MARGIN.bottom;

    const svg = barChartContainer.append("svg")
        .attr("width", width + MARGIN.left + MARGIN.right)
        .attr("height", height + MARGIN.top + MARGIN.bottom)
        .append("g")
        .attr("transform", `translate(${MARGIN.left}, ${MARGIN.top})`);
    
    // --- 3. Escalas ---
    // Eje X: Escala de banda para las categorías. `padding` añade espacio entre barras.
    const xScale = d3.scaleBand()
        .domain(categoryData.map(d => d.category))
        .range([0, width])
        .padding(0.2);

    // Eje Y: Escala lineal para el conteo de productos.
    const yScale = d3.scaleLinear()
        .domain([0, d3.max(categoryData, d => d.count)])
        .range([height, 0]);

    // --- 4. Ejes ---
    const xAxis = d3.axisBottom(xScale);
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(xAxis)
        .selectAll("text") // Rotamos las etiquetas para que no se solapen.
            .attr("transform", "translate(-10,0)rotate(-45)")
            .style("text-anchor", "end");

    const yAxis = d3.axisLeft(yScale).ticks(5).tickFormat(d3.format(".2s")); // Formato "1.5k"
    svg.append("g").call(yAxis);

    // Etiqueta para el eje Y
    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - MARGIN.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Número de Productos");

    // --- 5. Dibujo de Barras e Interacción ---
    svg.selectAll(".bar")
        .data(categoryData)
        .join("rect")
            .attr("class", "bar")
            .attr("x", d => xScale(d.category))
            .attr("width", xScale.bandwidth())
            .attr("y", d => yScale(0)) // Empieza desde y=0 para la animación
            .attr("height", 0)
            .on("click", (event, d) => {
                // --- Lógica de Filtro ---
                console.log("Categoría seleccionada:", d.category);
                currentFilter = d.category;
                const filteredData = allData.filter(item => item.main_category === currentFilter);
                
                // Actualizar las otras visualizaciones con los datos filtrados.
                drawScatterPlot(filteredData);
                drawHistogram(filteredData);
                updateInfoBox(filteredData, currentFilter);

                // Resaltar la barra seleccionada y atenuar las demás.
                d3.selectAll(".bar").style("opacity", other_d => (other_d.category === currentFilter) ? 1 : 0.4);
                resetButton.classed("hidden", false);
            })
            .on("mouseover", function(event, d) {
                // --- Tooltip ---
                tooltip.classed("hidden", false)
                       .html(`<h4>${d.category}</h4><p><strong>${d.count.toLocaleString()}</strong> productos</p>`);
            })
            .on("mousemove", (event) => {
                tooltip.style("left", (event.pageX + 15) + "px")
                       .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", () => {
                tooltip.classed("hidden", true);
            })
            // --- Animación de Entrada ---
            .transition()
            .duration(800)
            .attr("y", d => yScale(d.count))
            .attr("height", d => height - yScale(d.count));
}


/**
 * Dibuja/actualiza el Gráfico de Dispersión.
 * @param {Array} data - El conjunto de datos a visualizar.
 */
function drawScatterPlot(data) {
    scatterPlotContainer.html(""); // Limpiar
    const width = scatterPlotContainer.node().getBoundingClientRect().width - MARGIN.left - MARGIN.right;
    const height = scatterPlotContainer.node().getBoundingClientRect().height - MARGIN.top - MARGIN.bottom;

    const svg = scatterPlotContainer.append("svg")
        .attr("width", width + MARGIN.left + MARGIN.right)
        .attr("height", height + MARGIN.top + MARGIN.bottom)
        .append("g")
        .attr("transform", `translate(${MARGIN.left}, ${MARGIN.top})`);

    // --- Escalas ---
    // Eje X: Calificación. Dominio de 1 a 5.
    const xScale = d3.scaleLinear()
        .domain([1, 5])
        .range([0, width]);
    
    // Eje Y: Popularidad (número de calificaciones). Usamos escala logarítmica
    // porque los valores varían enormemente (de 1 a 100,000s).
    const yScale = d3.scaleLog()
        .domain(d3.extent(data, d => d.rating_count))
        .range([height, 0])
        .nice();

    // Escala para el radio de las burbujas: basada en el descuento.
    const radiusScale = d3.scaleSqrt()
        .domain([0, d3.max(data, d => d.discount_percentage)])
        .range([2, 15]); // Radio mínimo y máximo de las burbujas.

    // --- Ejes ---
    svg.append("g")
        .attr("transform", `translate(0, ${height})`)
        .call(d3.axisBottom(xScale).ticks(5));
    svg.append("g")
        .call(d3.axisLeft(yScale).tickFormat(d3.format(".1s")));

    // Etiquetas de los ejes
    svg.append("text")
        .attr("class", "axis-label")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + MARGIN.bottom - 10)
        .text("Calificación del Producto (1-5)");

    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - MARGIN.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Popularidad (Nº de Calificaciones)");

    // --- Dibujo de Burbujas e Interacción ---
    const dots = svg.selectAll(".scatter-dot")
        .data(data, d => d.product_id); // Usamos product_id como clave para animaciones

    dots.join(
        enter => enter.append("circle")
            .attr("class", "scatter-dot")
            .attr("cx", d => xScale(d.rating))
            .attr("cy", d => yScale(d.rating_count))
            .attr("r", 0) // Empieza con radio 0 para animación
            .style("fill", d => colorScale(d.price_category))
            .on("click", (event, d) => {
                // Abrir el enlace del producto en una nueva pestaña.
                if (d.product_link) {
                    window.open(d.product_link, "_blank");
                }
            })
            .on("mouseover", function(event, d) {
                d3.select(this).raise(); // Traer al frente
                tooltip.classed("hidden", false)
                    .html(`
                        <h4>${d.product_name.substring(0, 50)}...</h4>
                        <p><strong>Calificación:</strong> ${d.rating} ★</p>
                        <p><strong>Popularidad:</strong> ${d.rating_count.toLocaleString()} reseñas</p>
                        <p><strong>Precio:</strong> ${d.actual_price.toFixed(2)}</p>
                        <p><strong>Descuento:</strong> ${d.discount_percentage}%</p>
                    `);
            })
            .on("mousemove", (event) => {
                tooltip.style("left", (event.pageX + 15) + "px")
                       .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", () => {
                tooltip.classed("hidden", true);
            })
            .transition() // Animación de entrada
            .duration(1000)
            .delay((d, i) => i * 2) // Retraso escalonado
            .attr("r", d => radiusScale(d.discount_percentage)),
        
        update => update // Si ya existen, transición a la nueva posición
            .transition()
            .duration(1000)
            .attr("cx", d => xScale(d.rating))
            .attr("cy", d => yScale(d.rating_count))
            .attr("r", d => radiusScale(d.discount_percentage)),

        exit => exit // Si deben eliminarse, animación de salida
            .transition()
            .duration(500)
            .attr("r", 0)
            .remove()
    );
}

/**
 * Dibuja/actualiza el Histograma de Calificaciones.
 * @param {Array} data - El conjunto de datos a visualizar.
 */
function drawHistogram(data) {
    histogramContainer.html(""); // Limpiar
    const width = histogramContainer.node().getBoundingClientRect().width - MARGIN.left - MARGIN.right;
    const height = histogramContainer.node().getBoundingClientRect().height - MARGIN.top - MARGIN.bottom;

    const svg = histogramContainer.append("svg")
        .attr("width", width + MARGIN.left + MARGIN.right)
        .attr("height", height + MARGIN.top + MARGIN.bottom)
      .append("g")
        .attr("transform", `translate(${MARGIN.left},${MARGIN.top})`);
    
    // --- Escalas y Generador de Histograma ---
    const xScale = d3.scaleLinear()
        .domain([1, 5]) // Dominio fijo para calificaciones
        .range([0, width]);

    // El generador de histograma de D3 agrupa los datos en "bins" (contenedores).
    const histogram = d3.histogram()
        .value(d => d.rating)
        .domain(xScale.domain())
        .thresholds(xScale.ticks(20)); // 20 bins entre 1 y 5

    const bins = histogram(data);

    const yScale = d3.scaleLinear()
        .domain([0, d3.max(bins, d => d.length)])
        .range([height, 0]);

    // --- Ejes ---
    svg.append("g")
      .attr("transform", `translate(0, ${height})`)
      .call(d3.axisBottom(xScale));

    svg.append("g")
      .call(d3.axisLeft(yScale).tickFormat(d3.format(".2s")));
    
    // Etiquetas
    svg.append("text")
        .attr("class", "axis-label")
        .attr("text-anchor", "middle")
        .attr("x", width / 2)
        .attr("y", height + MARGIN.bottom - 15)
        .text("Calificación");
    
    svg.append("text")
        .attr("class", "axis-label")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - MARGIN.left + 20)
        .attr("x", 0 - (height / 2))
        .style("text-anchor", "middle")
        .text("Frecuencia");

    // --- Dibujo de Barras del Histograma ---
    svg.selectAll("rect")
      .data(bins)
      .join("rect")
        .attr("class", "bar")
        .attr("x", 1)
        .attr("transform", d => `translate(${xScale(d.x0)}, ${yScale(d.length)})`)
        .attr("width", d => xScale(d.x1) - xScale(d.x0) - 1)
        .attr("height", d => height - yScale(d.length))
        .style("fill", "var(--color-budget)")
        .on("mouseover", function(event, d) {
            tooltip.classed("hidden", false)
                   .html(`<h4>Rango: ${d.x0.toFixed(1)} - ${d.x1.toFixed(1)} ★</h4><p><strong>${d.length.toLocaleString()}</strong> productos</p>`);
        })
        .on("mousemove", (event) => {
            tooltip.style("left", (event.pageX + 15) + "px")
                   .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", () => {
            tooltip.classed("hidden", true);
        });
}

// ===================================================================================
// V. FUNCIONES AUXILIARES
// ===================================================================================

/**
 * Actualiza el cuadro de información con el estado actual del filtro.
 * @param {Array} data - El conjunto de datos actual.
 * @param {string|null} filter - La categoría filtrada.
 */
function updateInfoBox(data, filter = null) {
    if (filter) {
        infoTitle.text(`Categoría: ${filter}`);
    } else {
        infoTitle.text("Todos los Productos");
    }
    productCount.text(data.length.toLocaleString());
}
