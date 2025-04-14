/**
 * Temperature Timeline Chart
 */

/**
 * Load data for the temperature timeline chart
 * @param {Array} cities - Array of city names
 * @param {string} units - 'metric' or 'imperial'
 */
async function loadTemperatureTimelineData(cities, units) {
    const selector = '#temp-timeline .chart-container';
    showLoading(selector);
    
    try {
        const forecastData = await weatherApiService.getMultipleCitiesForecasts(cities, units);
        createTemperatureTimelineChart(selector, forecastData, units);
    } catch (error) {
        showError(selector, error.message);
    }
}

/**
 * Create the temperature timeline line chart
 * @param {string} selector - CSS selector for the container
 * @param {Array} data - Forecast data for cities
 * @param {string} units - 'metric' or 'imperial'
 */
function createTemperatureTimelineChart(selector, data, units) {
    clearChart(selector);
    
    // Extract data for the chart
    const chartData = [];
    
    data.forEach(cityData => {
        const city = cityData.city.name;
        
        // Get one data point per day (noon)
        const dailyData = [];
        let currentDate = null;
        
        cityData.list.forEach(forecast => {
            const date = new Date(forecast.dt * 1000);
            const dateStr = date.toISOString().split('T')[0];
            
            if (dateStr !== currentDate) {
                dailyData.push({
                    city: city,
                    date: dateStr,
                    timestamp: forecast.dt,
                    temp: forecast.main.temp,
                    weather: forecast.weather[0].main,
                    weatherIcon: forecast.weather[0].icon
                });
                currentDate = dateStr;
            }
        });
        
        chartData.push(...dailyData.slice(0, 5)); // Take only 5 days
    });
    
    // Group data by date
    const groupedByDate = d3.group(chartData, d => d.date);
    
    // Get unique dates and cities
    const dates = Array.from(groupedByDate.keys()).sort();
    const cities = [...new Set(chartData.map(d => d.city))];
    
    // Set up dimensions
    const container = d3.select(selector);
    const width = container.node().getBoundingClientRect().width;
    const height = 500;
    const margin = { top: 40, right: 120, bottom: 60, left: 60 };
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    
    // Create SVG
    const svg = container.append('svg')
        .attr('width', width)
        .attr('height', height);
    
    const g = svg.append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);
    
    // Create scales
    const xScale = d3.scalePoint()
        .domain(dates)
        .range([0, innerWidth])
        .padding(0.5);
    
    const yScale = d3.scaleLinear()
        .domain([
            d3.min(chartData, d => d.temp) - 5,
            d3.max(chartData, d => d.temp) + 5
        ])
        .range([innerHeight, 0]);
    
    const colorScale = d3.scaleOrdinal(d3.schemeCategory10)
        .domain(cities);
    
    // Create axes
    const xAxis = d3.axisBottom(xScale)
        .tickFormat(d => {
            const date = new Date(d);
            return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
        });
    
    const yAxis = d3.axisLeft(yScale);
    
    g.append('g')
        .attr('transform', `translate(0, ${innerHeight})`)
        .call(xAxis)
        .selectAll('text')
        .attr('dy', '0.5em')
        .attr('dx', '-0.3em')
        .attr('transform', 'rotate(-25)')
        .style('text-anchor', 'end');
    
    g.append('g')
        .call(yAxis);
    
    // Add y-axis label
    g.append('text')
        .attr('transform', 'rotate(-90)')
        .attr('y', -40)
        .attr('x', -innerHeight / 2)
        .attr('text-anchor', 'middle')
        .text(`Temperature (${units === 'metric' ? '°C' : '°F'})`);
    
    // Create tooltip
    const tooltip = createTooltip();
    
    // Create line generator
    const line = d3.line()
        .x(d => xScale(d.date))
        .y(d => yScale(d.temp))
        .curve(d3.curveMonotoneX);
    
    // Group data by city
    const groupedByCity = d3.group(chartData, d => d.city);
    
    // Draw lines for each city
    groupedByCity.forEach((cityData, city) => {
        // Sort by date
        cityData.sort((a, b) => new Date(a.date) - new Date(b.date));
        
        // Draw line
        g.append('path')
            .datum(cityData)
            .attr('fill', 'none')
            .attr('stroke', colorScale(city))
            .attr('stroke-width', 3)
            .attr('d', line);
        
        // Add data points
        g.selectAll(`.point-${city.replace(/\s+/g, '-').toLowerCase()}`)
            .data(cityData)
            .enter()
            .append('circle')
            .attr('class', `point-${city.replace(/\s+/g, '-').toLowerCase()}`)
            .attr('cx', d => xScale(d.date))
            .attr('cy', d => yScale(d.temp))
            .attr('r', 6)
            .attr('fill', colorScale(city))
            .attr('stroke', 'white')
            .attr('stroke-width', 2)
            .on('mouseover', function(event, d) {
                tooltip.transition()
                    .duration(200)
                    .style('opacity', 0.9);
                tooltip.html(`
                    <strong>${d.city}</strong><br>
                    ${formatDate(d.timestamp)}<br>
                    Temp: ${formatTemperature(d.temp, units)}<br>
                    Weather: ${d.weather}
                `)
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
                
                d3.select(this)
                    .attr('r', 8);
            })
            .on('mouseout', function() {
                tooltip.transition()
                    .duration(500)
                    .style('opacity', 0);
                
                d3.select(this)
                    .attr('r', 6);
            });
        
        // Add weather icons
        g.selectAll(`.icon-${city.replace(/\s+/g, '-').toLowerCase()}`)
            .data(cityData)
            .enter()
            .append('image')
            .attr('class', `icon-${city.replace(/\s+/g, '-').toLowerCase()}`)
            .attr('x', d => xScale(d.date) - 15)
            .attr('y', d => yScale(d.temp) - 35)
            .attr('width', 30)
            .attr('height', 30)
            .attr('xlink:href', d => getWeatherIconUrl(d.weatherIcon));
    });
    
    // Add legend
    const legend = svg.append('g')
        .attr('transform', `translate(${width - margin.right + 20}, ${margin.top})`);
    
    cities.forEach((city, i) => {
        const legendItem = legend.append('g')
            .attr('transform', `translate(0, ${i * 25})`);
        
        legendItem.append('line')
            .attr('x1', 0)
            .attr('y1', 10)
            .attr('x2', 20)
            .attr('y2', 10)
            .attr('stroke', colorScale(city))
            .attr('stroke-width', 3);
        
        legendItem.append('circle')
            .attr('cx', 10)
            .attr('cy', 10)
            .attr('r', 5)
            .attr('fill', colorScale(city))
            .attr('stroke', 'white')
            .attr('stroke-width', 1);
        
        legendItem.append('text')
            .attr('x', 30)
            .attr('y', 14)
            .text(city);
    });
    
    // Add title
    svg.append('text')
        .attr('x', width / 2)
        .attr('y', 20)
        .attr('text-anchor', 'middle')
        .attr('font-size', '16px')
        .attr('font-weight', 'bold')
        .text('5-Day Temperature Forecast');
}
