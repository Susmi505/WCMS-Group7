/**
 * Wind Direction Chart
 */

/**
 * Load data for the wind direction chart
 * @param {Array} cities - Array of city names
 * @param {string} units - 'metric' or 'imperial'
 */
async function loadWindDirectionData(cities, units) {
    const selector = '#wind-direction .chart-container';
    showLoading(selector);
    
    try {
        const weatherData = await weatherApiService.getMultipleCitiesWeather(cities, units);
        createWindDirectionChart(selector, weatherData, units);
    } catch (error) {
        showError(selector, error.message);
    }
}

/**
 * Create the wind direction radial chart
 * @param {string} selector - CSS selector for the container
 * @param {Array} data - Weather data for cities
 * @param {string} units - 'metric' or 'imperial'
 */
function createWindDirectionChart(selector, data, units) {
    clearChart(selector);
    
    // Extract data for the chart
    const chartData = data.map(cityData => ({
        city: cityData.name,
        windSpeed: cityData.wind.speed,
        windDeg: cityData.wind.deg,
        temp: cityData.main.temp,
        weather: cityData.weather[0].main,
        weatherIcon: cityData.weather[0].icon
    }));
    
    // Set up dimensions
    const container = d3.select(selector);
    const width = container.node().getBoundingClientRect().width;
    const height = 500;
    const margin = { top: 40, right: 120, bottom: 40, left: 40 };
    const chartSize = Math.min(width - margin.left - margin.right, height - margin.top - margin.bottom);
    const radius = chartSize / 2;
    
    // Create SVG
    const svg = container.append('svg')
        .attr('width', width)
        .attr('height', height);
    
    const g = svg.append('g')
        .attr('transform', `translate(${width / 2 - margin.right / 2}, ${height / 2})`);
    
    // Create scales
    const radiusScale = d3.scaleLinear()
        .domain([0, d3.max(chartData, d => d.windSpeed) * 1.2])
        .range([0, radius]);
    
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(chartData.map(d => d.city));
    
    // Create tooltip
    const tooltip = createTooltip();
    
    // Add concentric circles for wind speed reference
    const speedTicks = radiusScale.ticks(5);
    
    g.selectAll('.speed-circle')
        .data(speedTicks)
        .enter()
        .append('circle')
        .attr('class', 'speed-circle')
        .attr('cx', 0)
        .attr('cy', 0)
        .attr('r', d => radiusScale(d))
        .attr('fill', 'none')
        .attr('stroke', '#ccc')
        .attr('stroke-dasharray', '2,2');
    
    // Add labels for speed circles
    g.selectAll('.speed-label')
        .data(speedTicks)
        .enter()
        .append('text')
        .attr('class', 'speed-label')
        .attr('x', 5)
        .attr('y', d => -radiusScale(d))
        .attr('dy', '0.3em')
        .text(d => `${d} ${units === 'metric' ? 'm/s' : 'mph'}`);
    
    // Add cardinal direction labels
    const directions = [
        { label: 'N', angle: 0 },
        { label: 'NE', angle: 45 },
        { label: 'E', angle: 90 },
        { label: 'SE', angle: 135 },
        { label: 'S', angle: 180 },
        { label: 'SW', angle: 225 },
        { label: 'W', angle: 270 },
        { label: 'NW', angle: 315 }
    ];
    
    g.selectAll('.direction-label')
        .data(directions)
        .enter()
        .append('text')
        .attr('class', 'direction-label')
        .attr('x', d => (radius + 20) * Math.sin(d.angle * Math.PI / 180))
        .attr('y', d => -(radius + 20) * Math.cos(d.angle * Math.PI / 180))
        .attr('text-anchor', 'middle')
        .attr('font-weight', 'bold')
        .text(d => d.label);
    
    // Add radial lines for directions
    g.selectAll('.direction-line')
        .data(directions)
        .enter()
        .append('line')
        .attr('class', 'direction-line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', d => radius * Math.sin(d.angle * Math.PI / 180))
        .attr('y2', d => -radius * Math.cos(d.angle * Math.PI / 180))
        .attr('stroke', '#ccc')
        .attr('stroke-width', 1);
    
    // Plot data points
    const dataPoints = g.selectAll('.data-point')
        .data(chartData)
        .enter()
        .append('g')
        .attr('class', 'data-point')
        .attr('transform', d => {
            // Convert wind direction degree to x,y coordinates
            const x = radiusScale(d.windSpeed) * Math.sin(d.windDeg * Math.PI / 180);
            const y = -radiusScale(d.windSpeed) * Math.cos(d.windDeg * Math.PI / 180);
            return `translate(${x}, ${y})`;
        });
    
    // Add city markers
    dataPoints.append('circle')
        .attr('r', 8)
        .attr('fill', d => colorScale(d.city))
        .attr('stroke', '#fff')
        .attr('stroke-width', 2)
        .on('mouseover', function(event, d) {
            d3.select(this)
                .attr('r', 10)
                .attr('stroke-width', 3);
            
            showTooltip(tooltip, d, event, units);
        })
        .on('mouseout', function() {
            d3.select(this)
                .attr('r', 8)
                .attr('stroke-width', 2);
            
            hideTooltip(tooltip);
        });
    
    // Create legend
    const legendGroup = svg.append('g')
        .attr('class', 'legend')
        .attr('transform', `translate(${width - margin.right + 20}, ${margin.top})`);
    
    const legend = legendGroup.selectAll('.legend-item')
        .data(chartData)
        .enter()
        .append('g')
        .attr('class', 'legend-item')
        .attr('transform', (d, i) => `translate(0, ${i * 25})`);
    
    legend.append('circle')
        .attr('r', 6)
        .attr('fill', d => colorScale(d.city));
    
    legend.append('text')
        .attr('x', 15)
        .attr('y', 4)
        .text(d => d.city);
    
    // Add title
    svg.append('text')
        .attr('class', 'chart-title')
        .attr('x', width / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .attr('font-weight', 'bold')
        .text('Wind Direction and Speed by City');
}

/**
 * Create a tooltip div for the chart
 * @returns {Object} D3 selection of the tooltip
 */
function createTooltip() {
    return d3.select('body')
        .append('div')
        .attr('class', 'chart-tooltip')
        .style('position', 'absolute')
        .style('visibility', 'hidden')
        .style('background-color', 'white')
        .style('border', '1px solid #ddd')
        .style('border-radius', '4px')
        .style('padding', '8px')
        .style('box-shadow', '0 2px 5px rgba(0, 0, 0, 0.1)')
        .style('pointer-events', 'none');
}

/**
 * Show tooltip with city weather data
 * @param {Object} tooltip - D3 selection of tooltip element
 * @param {Object} data - City data point
 * @param {Event} event - Mouse event
 * @param {string} units - Units of measurement
 */
function showTooltip(tooltip, data, event, units) {
    const speedUnit = units === 'metric' ? 'm/s' : 'mph';
    const tempUnit = units === 'metric' ? '°C' : '°F';
    
    const directionName = getWindDirectionName(data.windDeg);
    
    const content = `
        <div>
            <strong>${data.city}</strong><br>
            <img src="https://openweathermap.org/img/wn/${data.weatherIcon}.png" alt="${data.weather}">
            ${data.weather}<br>
            Wind: ${data.windSpeed} ${speedUnit} (${directionName})<br>
            Temperature: ${data.temp.toFixed(1)} ${tempUnit}
        </div>
    `;
    
    tooltip
        .style('visibility', 'visible')
        .style('left', `${event.pageX + 10}px`)
        .style('top', `${event.pageY + 10}px`)
        .html(content);
}

/**
 * Hide tooltip
 * @param {Object} tooltip - D3 selection of tooltip element
 */
function hideTooltip(tooltip) {
    tooltip.style('visibility', 'hidden');
}

/**
 * Get wind direction name from degrees
 * @param {number} degrees - Wind direction in degrees
 * @returns {string} Wind direction name
 */
function getWindDirectionName(degrees) {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 
                        'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
}

/**
 * Show loading indicator
 * @param {string} selector - CSS selector for container
 */
function showLoading(selector) {
    clearChart(selector);
    
    const container = d3.select(selector);
    container.append('div')
        .attr('class', 'loading-indicator')
        .html('<p>Loading chart data...</p>');
}

/**
 * Show error message
 * @param {string} selector - CSS selector for container
 * @param {string} message - Error message
 */
function showError(selector, message) {
    clearChart(selector);
    
    const container = d3.select(selector);
    container.append('div')
        .attr('class', 'error-message')
        .html(`<p>Error loading chart data: ${message}</p>`);
}

/**
 * Clear the chart container
 * @param {string} selector - CSS selector for container
 */
function clearChart(selector) {
    d3.select(selector).html('');
}
