// main.js

// I. CONFIGURACIÓN Y CONSTANTES
// =============================
// Definir márgenes, dimensiones y seleccionar contenedores SVG.
const MARGIN = { top: 50, right: 50, bottom: 50, left: 50 };
// ...otras constantes

// II. CARGA Y PROCESAMIENTO DE DATOS
// ==================================
// Usar d3.csv() para cargar el archivo.
d3.csv("data/amazon_cleaned.csv").then(data => {
    
    // 1. Limpieza de datos: convertir strings a números.
    data.forEach(d => {
        d.rating = +d.rating;
        d.rating_count = +d.rating_count;
        d.discount_percentage = +d.discount_percentage;
        // ... otras conversiones necesarias
    });

    // 2. Agregación de datos para el gráfico de barras.
    const categoryCounts = d3.rollup(data, v => v.length, d => d.main_category);
    const categoryData = Array.from(categoryCounts, ([key, value]) => ({ category: key, count: value }));

    // III. LÓGICA DE VISUALIZACIÓN
    // =============================
    // Llamar a las funciones que dibujan cada gráfico.
    drawBarChart(categoryData, data);
    drawScatterPlot(data);

}).catch(error => {
    console.error("Error al cargar o procesar los datos:", error);
});


// IV. FUNCIONES DE DIBUJO
// ========================

function drawBarChart(categoryData, fullData) {
    // 1. Crear escalas (band para categorías, linear para conteo).
    // 2. Dibujar ejes.
    // 3. Dibujar barras (rects) con una transición de entrada.
    // 4. Añadir eventos de hover (cambio de color) y click.
    //    - El evento de click llama a `updateScatterPlot(filteredData)`.
}

function drawScatterPlot(plotData) {
    // 1. Crear escalas (linear para rating, log para rating_count, etc.).
    // 2. Dibujar ejes.
    // 3. Dibujar círculos (data join). Usar .join() para manejar la
    //    entrada, actualización y salida de datos de forma declarativa.
    // 4. Añadir transiciones para la animación.
    // 5. Configurar eventos de hover para mostrar el tooltip.
    // 6. Configurar eventos de click para abrir el enlace del producto.
}


// V. FUNCIONES DE INTERACTIVIDAD Y ACTUALIZACIÓN
// ===============================================

function updateScatterPlot(filteredData) {
    // Esta función es llamada por el gráfico de barras.
    // Vuelve a vincular los datos (filteredData) a los círculos y
    // aplica una transición suave para mover, añadir o quitar puntos.
}

// VI. RESPONSIVIDAD (Opcional pero recomendado)
// ==============================================
// Escuchar el evento 'resize' de la ventana para redibujar los gráficos
// con las nuevas dimensiones del contenedor.

// VII. COMENTARIOS
// =================
// Asegúrate de comentar cada bloque: qué hace, por qué se usa una escala
// logarítmica, cómo funciona el data join, etc. para alcanzar las 500+ líneas.
