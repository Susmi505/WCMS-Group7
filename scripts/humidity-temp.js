/**
 * Humidity vs Temperature Chart
 */

/**
 * Load data for the humidity vs temperature chart
 * @param {Array} cities - Array of city names
 * @param {string} units - 'metric' or 'imperial'
 */
async function loadHumidityTemperatureData(cities, units) {
    const selector = '#humidity-temp .chart-container';
    showLoading(selector);
    
    try {
        const weatherData = await weatherApiService.getMultipleCitiesWeather(cities, units);
        createHumidityTemperatureChart(selector, weatherData, units);
    } catch (error) {
        showError(selector, error.message);
    }
}

/**
 * Create the humidity vs temperature scatter plot
 * @param {string} selector - CSS selector for the container
 * @param {Array} data - Weather data for cities
 * @param {string} units - 'metric' or 'imperial'
 */
function createHumidityTemperatureChart(selector, data, units) {
    clearChart(selector);
    
    // Extract data for the chart
    const chartData = data.map(cityData => ({
        city: cityData.name,
        humidity: cityData.main.humidity,
        temp: cityData.main.temp,
        weather: cityData.weather[0].main,
        weatherIcon: cityData.weather[0].icon
    }));
    
    // Set up dimensions
    const container = d3.select(selector);
    const width = container.node().getBoundingClientRect().width;
    const height = 500;
    const margin = { top: 40, right: 120, bottom: 60, left: 70 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Create SVG
    const svg = container.append('svg')
        .attr('width', width)
        .attr('height', height);
    
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    // Create scales
    const xScale = d3.scaleLinear()
        .domain([0, 100])
        .range([0, innerWidth]);
    
    const yScale = d3.scaleLinear()
        .domain([
            d3.min(chartData, d => d.temp) - 5,
            d3.max(chartData, d => d.temp) + 5
        ])
        .range([innerHeight, 0]);
    
    const radiusScale = d3.scaleSqrt()
        .domain([
            d3.min(chartData, d => d.humidity),
            d3.max(chartData, d => d.humidity)
        ])
        .range([5, 20]);
    
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(chartData.map(d => d.city));
    
    // Create axes
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);
    
    g.append('g')
        .attr('transform', `translate(0, ${innerHeight})`)
        .call(xAxis);
    
    g.append('g')
        .call(yAxis);
    
    // Add axis labels
    g.append('text')
        .attr('x', innerWidth / 2)
        .attr('y', innerHeight + 40)
        .attr('text-anchor', 'middle')
        .text('Humidity (%)');
    
    g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -50)
        .attr('x', -innerHeight / 2)
        .attr('text-anchor', 'middle')
        .text(`Temperature (${units === 'metric' ? '°C' : '°F'})`);
    
    // Create tooltip
    const tooltip = createTooltip();
    
    // Add grid lines
    g.append('g')
        .attr('class', 'grid')
        .selectAll('line')
        .data(xScale.ticks())
        .enter()
        .append('line')
        .attr('x1', d => xScale(d))
        .attr('y1', 0)
        .attr('x2', d => xScale(d))
        .attr('y2', innerHeight)
        .attr('stroke', '#e0e0e0')
        .attr('stroke-width', 1);
    
    g.append('g')
        .attr('class', 'grid')
        .selectAll('line')
        .data(yScale.ticks())
        .enter()
        .append('line')
        .attr('x1', 0)
        .attr('y1', d => yScale(d))
        .attr('x2', innerWidth)
        .attr('y2', d => yScale(d))
        .attr('stroke', '#e0e0e0')
        .attr('stroke-width', 1);
    
    // Add regression line
    if (chartData.length > 1) {
        const xValues = chartData.map(d => d.humidity);
        const yValues = chartData.map(d => d.temp);
        
        // Calculate regression
        const n = xValues.length;
        const xMean = xValues.reduce((a, b) => a + b, 0) / n;
        const yMean = yValues.reduce((a, b) => a + b, 0) / n;
        
        const numerator = xValues.reduce((acc, x, i) => {
            return acc + (x - xMean) * (yValues[i] - yMean);
        }, 0);
        
        const denominator = xValues.reduce((acc, x) => {
            return acc + Math.pow(x - xMean, 2);
        }, 0);
        
        const slope = numerator / denominator;
        const intercept = yMean - slope * xMean;
        
        // Add trend line
        g.append('line')
            .attr('x1', xScale(0))
            .attr('y1', yScale(intercept))
            .attr('x2', xScale(100))
            .attr('y2', yScale(intercept + slope * 100))
            .attr('stroke', '#ff5722')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,5');
    }
    
    // Add data points
    g.selectAll('.data-point')
        .data(chartData)
        .enter()
        .append('circle')
        .attr('class', 'data-point')
        .attr('cx', d => xScale(d.humidity))
        .attr('cy', d => yScale(d.temp))
        .attr('r', d => radiusScale(d.humidity))
        .attr('fill', d => colorScale(d.city))
        .attr('opacity', 0.7)
        .on('mouseover', function(event, d) {
            tooltip.transition()
                .duration(200)
                .style('opacity', 0.9);
            tooltip.html(`
                <strong>${d.city}</strong><br>
                Humidity: ${d.humidity}%<br>
                Temp: ${formatTemperature(d.temp, units)}<br>
                Weather: ${d.weather}
            `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
            
            d3.select(this)
                .attr('stroke', 'white')
                .attr('stroke-width', 2)
                .attr('opacity', 1);
        })
        .on('mouseout', function() {
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
            
            d3.select(this)
                .attr('stroke', 'none')
                .attr('opacity', 0.7);
        });
    
    // Add city labels
    g.selectAll('.city-label')
        .data(chartData)
        .enter()
        .append('text')
        .attr('class', 'city-label')
        .attr('x', d => xScale(d.humidity))
        .attr('y', d => yScale(d.temp) - radiusScale(d.humidity) - 5)
        .attr('text-anchor', 'middle')
        .attr('font-size', '12px')
        .text(d => d.city);
    
    // Add weather icons
    g.selectAll('.weather-icon')
        .data(chartData)
        .enter()
        .append('image')
        .attr('class', 'weather-icon')
        .attr('x', d => xScale(d.humidity) - 15)
        .attr('y', d => yScale(d.temp) - radiusScale(d.humidity) - 35)
        .attr('width', 30)
        .attr('height', 30)
        .attr('xlink:href', d => getWeatherIconUrl(d.weatherIcon));
    
    // Add legend
    const legend = svg.append('g')
        .attr('transform', `translate(${width - margin.right + 20}, ${margin.top})`);
    
    chartData.forEach((d, i) => {
        const legendItem = legend.append('g')
            .attr('transform', `translate(0, ${i * 25})`);
        
        legendItem.append('circle')
            .attr('cx', 10)
            .attr('cy', 10)
            .attr('r', 7)
            .attr('fill', colorScale(d.city));
        
        legendItem.append('text')
            .attr('x', 25)
            .attr('y', 14)
            .text(d.city);
    });
    
    // Add trend line legend
    if (chartData.length > 1) {
        const trendLegend = legend.append('g')
            .attr('transform', `translate(0, ${chartData.length * 25 + 10})`);
        
        trendLegend.append('line')
            .attr('x1', 0)
            .attr('y1', 10)
            .attr('x2', 20)
            .attr('y2', 10)
            .attr('stroke', '#ff5722')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '5,5');
        
        trendLegend.append('text')
            .attr('x', 25)
            .attr('y', 14)
            .text('Trend Line');
    }
    
    // Add title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .attr('font-size', '16px')
        .attr('font-weight', 'bold')
        .text('Humidity vs Temperature Relationship');
}
