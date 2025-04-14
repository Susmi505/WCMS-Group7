/**
 * Temperature Comparison Chart
 */

/**
 * Load data for the temperature comparison chart
 * @param {Array} cities - Array of city names
 * @param {string} units - 'metric' or 'imperial'
 */
async function loadTemperatureComparisonData(cities, units) {
    const selector = '#temp-comparison .chart-container';
    showLoading(selector);
    
    try {
        const weatherData = await weatherApiService.getMultipleCitiesWeather(cities, units);
        createTemperatureComparisonChart(selector, weatherData, units);
    } catch (error) {
        showError(selector, error.message);
    }
}

/**
 * Create the temperature comparison bar chart
 * @param {string} selector - CSS selector for the container
 * @param {Array} data - Weather data for cities
 * @param {string} units - 'metric' or 'imperial'
 */
function createTemperatureComparisonChart(selector, data, units) {
    clearChart(selector);
    
    // Extract data for the chart
    const chartData = data.map(cityData => ({
        city: cityData.name,
        temp: cityData.main.temp,
        feels_like: cityData.main.feels_like,
        weather: cityData.weather[0].main,
        weatherIcon: cityData.weather[0].icon
    }));
    
    // Sort by temperature
    chartData.sort((a, b) => b.temp - a.temp);
    
    // Set up dimensions
    const container = d3.select(selector);
    const width = container.node().getBoundingClientRect().width;
    const height = 400;
    const margin = { top: 40, right: 60, bottom: 60, left: 80 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Create SVG
    const svg = container.append('svg')
        .attr('width', width)
        .attr('height', height);
    
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    // Create scales
    const xScale = d3.scaleBand()
        .domain(chartData.map(d => d.city))
        .range([0, innerWidth])
        .padding(0.2);
    
    const yScale = d3.scaleLinear()
        .domain([
            Math.min(d3.min(chartData, d => d.temp), d3.min(chartData, d => d.feels_like)) - 5,
            Math.max(d3.max(chartData, d => d.temp), d3.max(chartData, d => d.feels_like)) + 5
        ])
        .range([innerHeight, 0]);
    
    // Create axis
    const xAxis = d3.axisBottom(xScale);
    const yAxis = d3.axisLeft(yScale);
    
    g.append('g')
        .attr('transform', `translate(0, ${innerHeight})`)
        .call(xAxis)
        .selectAll('text')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em')
        .attr('transform', 'rotate(-45)');
    
    g.append('g')
        .call(yAxis);
    
    // Add y-axis label
    g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -60)
        .attr('x', -innerHeight / 2)
        .attr('text-anchor', 'middle')
        .text(`Temperature (${units === 'metric' ? '°C' : '°F'})`);
    
    // Create tooltip
    const tooltip = createTooltip();
    
    // Create a group for each city
    const cityGroups = g.selectAll('.city-group')
        .data(chartData)
        .enter()
        .append('g')
        .attr('class', 'city-group')
        .attr('transform', d => `translate(${xScale(d.city)}, 0)`);
    
    // Add actual temperature bars
    cityGroups.append('rect')
        .attr('x', 0)
        .attr('y', d => yScale(d.temp))
        .attr('width', xScale.bandwidth() / 2)
        .attr('height', d => innerHeight - yScale(d.temp))
        .attr('fill', '#1e88e5')
        .on('mouseover', function(event, d) {
            tooltip.transition()
                .duration(200)
                .style('opacity', 0.9);
            tooltip.html(`
                <strong>${d.city}</strong><br>
                Actual: ${formatTemperature(d.temp, units)}<br>
                Weather: ${d.weather}
            `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
            
            d3.select(this).attr('fill', '#64b5f6');
        })
        .on('mouseout', function() {
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
            
            d3.select(this).attr('fill', '#1e88e5');
        });
    
    // Add "feels like" temperature bars in graph
    cityGroups.append('rect')
        .attr('x', xScale.bandwidth() / 2)
        .attr('y', d => yScale(d.feels_like))
        .attr('width', xScale.bandwidth() / 2)
        .attr('height', d => innerHeight - yScale(d.feels_like))
        .attr('fill', '#ff9800')
        .on('mouseover', function(event, d) {
            tooltip.transition()
                .duration(200)
                .style('opacity', 0.9);
            tooltip.html(`
                <strong>${d.city}</strong><br>
                Feels like: ${formatTemperature(d.feels_like, units)}<br>
                Weather: ${d.weather}
            `)
                .style('left', (event.pageX + 10) + 'px')
                .style('top', (event.pageY - 28) + 'px');
            
            d3.select(this).attr('fill', '#ffb74d');
        })
        .on('mouseout', function() {
            tooltip.transition()
                .duration(500)
                .style('opacity', 0);
            
            d3.select(this).attr('fill', '#ff9800');
        });
    
    
    // Add legend
    const legend = svg.append('g')
        .attr('transform', `translate(${width - margin.right}, ${margin.top})`);
    
    legend.append('rect')
        .attr('x', 0)
        .attr('y', 0)
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', '#1e88e5');
    
    legend.append('text')
        .attr('x', 20)
        .attr('y', 12)
        .text('Actual Temperature');
    
    legend.append('rect')
        .attr('x', 0)
        .attr('y', 25)
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', '#ff9800');
    
    legend.append('text')
        .attr('x', 20)
        .attr('y', 37)
        .text('Feels Like');
        
    // Add title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .attr('font-size', '16px')
        .attr('font-weight', 'bold')
        .text('Current Temperature Comparison');
}
