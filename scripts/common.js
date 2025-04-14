/**
 * Common utilities for the weather dashboard
 */

/**
 * Get the selected cities from the input fields
 * @returns {Array} Array of city names
 */
function getSelectedCities() {
    const cities = [];
    
    for (let i = 1; i <= 5; i++) {
        const cityInput = document.getElementById(`city${i}`);
        if (cityInput && cityInput.value.trim()) {
            cities.push(cityInput.value.trim());
        }
    }
    
    return cities;
}

/**
 * Get the selected temperature unit
 * @returns {string} 'metric' or 'imperial'
 */
function getSelectedUnit() {
    const unitInputs = document.querySelectorAll('input[name="units"]');
    for (const input of unitInputs) {
        if (input.checked) {
            return input.value;
        }
    }
    return 'metric'; // Default
}

/**
 * Format temperature with the appropriate unit symbol
 * @param {number} temp - Temperature value
 * @param {string} units - 'metric' or 'imperial'
 * @returns {string} Formatted temperature
 */
function formatTemperature(temp, units) {
    const symbol = units === 'metric' ? '°C' : '°F';
    return `${Math.round(temp)}${symbol}`;
}

/**
 * Create a tooltip element if it doesn't exist
 * @returns {Object} D3 selection of the tooltip
 */
function createTooltip() {
    let tooltip = d3.select('body').select('.tooltip');
    
    if (tooltip.empty()) {
        tooltip = d3.select('body')
            .append('div')
            .attr('class', 'tooltip')
            .style('opacity', 0);
    }
    
    return tooltip;
}

/**
 * Format date from UNIX timestamp
 * @param {number} timestamp - UNIX timestamp
 * @param {boolean} includeTime - Whether to include time
 * @returns {string} Formatted date
 */
function formatDate(timestamp, includeTime = false) {
    const date = new Date(timestamp * 1000);
    
    const options = {
        weekday: 'short',
        month: 'short',
        day: 'numeric'
    };
    
    if (includeTime) {
        options.hour = '2-digit';
        options.minute = '2-digit';
    }
    
    return date.toLocaleDateString('en-US', options);
}

/**
 * Get color scale for cities
 * @param {Array} cities - Array of city names
 * @returns {Function} D3 color scale
 */
function getCityColorScale(cities) {
    return d3.scaleOrdinal()
        .domain(cities)
        .range(d3.schemeCategory10);
}

/**
 * Clear the contents of a chart container
 * @param {string} selector - CSS selector for the container
 */
function clearChart(selector) {
    d3.select(selector).html('');
}

/**
 * Show loading indicator in a chart container
 * @param {string} selector - CSS selector for the container
 */
function showLoading(selector) {
    clearChart(selector);
    d3.select(selector)
        .append('div')
        .attr('class', 'loading')
        .text('Loading data...');
}

/**
 * Hide loading indicator
 * @param {string} selector - CSS selector for the container
 */
function hideLoading(selector) {
    d3.select(selector).select('.loading').remove();
}

/**
 * Show error message in a chart container
 * @param {string} selector - CSS selector for the container
 * @param {string} message - Error message
 */
function showError(selector, message) {
    clearChart(selector);
    d3.select(selector)
        .append('div')
        .attr('class', 'error')
        .text(`Error: ${message}`);
}

/**
 * Get weather icon URL
 * @param {string} iconCode - Weather icon code
 * @returns {string} URL to the icon
 */
function getWeatherIconUrl(iconCode) {
    return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
}
