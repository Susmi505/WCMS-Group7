/**
 * Weather Distribution Chart
 */

/**
 * Load data for the weather distribution chart
 * @param {Array} cities - Array of city names
 * @param {string} units - 'metric' or 'imperial'
 */
async function loadWeatherDistributionData(cities, units) {
    const selector = '#weather-dist .chart-container';
    showLoading(selector);
    
    try {
        const weatherData = await weatherApiService.getMultipleCitiesWeather(cities, units);
        createWeatherDistributionChart(selector, weatherData);
    } catch (error) {
        showError(selector, error.message);
    }
}

/**
 * Create the weather distribution pie chart
 * @param {string} selector - CSS selector for the container
 * @param {Array} data - Weather data for cities
 */
function createWeatherDistributionChart(selector, data) {
    clearChart(selector);
    
    // Extract data for the chart
    const weatherCounts = {};
    
    data.forEach(cityData => {
        const weather = cityData.weather[0].main;
        weatherCounts[weather] = (weatherCounts[weather] || 0) + 1;
    });
    
    const pieData = Object.keys(weatherCounts).map(weather => ({
        weather: weather,
        count: weatherCounts[weather]
    }));
    
    // Set up dimensions
    const container = d3.select(selector);
    const width = container.node().getBoundingClientRect().width;
    const height = 400;
    const margin = { top: 40, right: 120, bottom: 40, left: 40 };
    const radius = Math.min(width - margin.left - margin.right, height - margin.top - margin.bottom) / 2;
    
    // Create SVG for graph
    const svg = container.append('svg')
        .attr('width', width)
        .attr('height', height);
    
    const g = svg.append('g')
        .attr('transform', `translate(${width / 2 - margin.right / 2}, ${height / 2})`);
    
    // Set up color scale
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10);
    
    // Create pie layout
    const pie = d3.pie()
        .value(d => d.count)
        .sort(null);
    
    // Create arc generator for pie slices
    const arc = d3.arc()
        .innerRadius(0)
        .outerRadius(radius);
    
    // Create arc generator for labels
    const labelArc = d3.arc()
        .innerRadius(radius * 0.8)
        .outerRadius(radius * 0.8);
    
    // Create tooltip
    const tooltip = createTooltip();
    
    // Create pie slices
    const arcs = g.selectAll('.arc')
        .data(pie(pieData))
        .enter()
        .append('g')
        .attr('class', 'arc');
    
    arcs.append('path')
        .attr('d', arc)
        .attr('fill', d => colorScale(d.data.weather))
        .attr('stroke', 'white')
        .style('stroke-width', '2px')
        .on('mouseover', function(event, d) {
            tooltip.transition()
                .duration(200)
                .style('opacity', 0.9);
            tooltip.html(`
                <strong>${d.data.weather}</strong><br>
                ${d.data.count} ${d.data.count === 1 ? 'city' : 'cities'}<br>
                ${(d.data.count / data.length * 100).toFixed(1)}%
            `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
            
            d3.select(this).attr('opacity', 0.8);
        })
        .on('mouseout', function() {
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
            
            d3.select(this).attr('opacity', 1);
        });
    
    // Add percentage labels
    arcs.append('text')
        .attr('transform', d => `translate(${labelArc.centroid(d)})`)
        .attr('text-anchor', 'middle')
        .text(d => `${(d.data.count / data.length * 100).toFixed(0)}%`)
        .style('fill', 'white')
        .style('font-size', '12px')
        .style('font-weight', 'bold');
    
    // Add legend
    const legend = svg.append('g')
        .attr('transform', `translate(${width - margin.right + 40}, ${height / 2 - pieData.length * 12})`);
    
    const legendItems = legend.selectAll('.legend-item')
        .data(pieData)
        .enter()
        .append('g')
        .attr('class', 'legend-item')
        .attr('transform', (d, i) => `translate(0, ${i * 25})`);
    
    legendItems.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', d => colorScale(d.weather));
    
    legendItems.append('text')
        .attr('x', 25)
        .attr('y', 12)
        .text(d => `${d.weather} (${d.count})`);
    
    // Add title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .attr('font-size', '16px')
        .attr('font-weight', 'bold')
        .text('Weather Conditions Distribution');
}
