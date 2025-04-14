/**
 * Weather Map
 * Displays weather data on an interactive map
 */

/**
 * Initialize the weather map
 * @param {string} containerId - ID of the container element
 * @param {Object} options - Map configuration options
 */
function initWeatherMap(containerId, options = {}) {
    const defaultOptions = {
        center: [20, 0], // Default center coordinates [lat, lng]
        zoom: 2,         // Default zoom level
        minZoom: 2,      // Minimum zoom level
        maxZoom: 10      // Maximum zoom level
    };
    
    const mapOptions = { ...defaultOptions, ...options };
    
    // Initialize the map
    const map = L.map(containerId, {
        center: mapOptions.center,
        zoom: mapOptions.zoom,
        minZoom: mapOptions.minZoom,
        maxZoom: mapOptions.maxZoom
    });
    
    // Add OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);
    
    // Store map reference
    weatherMap = {
        map: map,
        markers: [],
        layers: {}
    };
    
    return weatherMap;
}

/**
 * Load weather data for cities and display on map
 * @param {Array} cities - Array of city names or coordinates
 * @param {string} units - 'metric' or 'imperial'
 * @returns {Promise} Promise resolving with the weather data
 */
async function loadWeatherMapData(cities, units = 'metric') {
    const mapContainer = document.getElementById('weather-map');
    
    if (!mapContainer) {
        console.error('Weather map container not found');
        return;
    }
    
    showMapLoading(mapContainer);
    
    try {
        // Get weather data for all cities
        const weatherData = await weatherApiService.getMultipleCitiesWeather(cities, units);
        
        // Initialize map if not already initialized
        if (!weatherMap || !weatherMap.map) {
            initWeatherMap('weather-map');
        }
        
        // Clear existing markers
        clearWeatherMarkers();
        
        // Add markers for each city
        addCityWeatherMarkers(weatherData, units);
        
        // If we have cities, fit the map to show all markers
        if (weatherData.length > 0) {
            fitMapToCities(weatherData);
        }
        
        // Add weather layer controls
        addWeatherLayerControls(units);
        
        hideMapLoading(mapContainer);
        
        return weatherData;
    } catch (error) {
        console.error('Error loading weather map data:', error);
        showMapError(mapContainer, error.message);
        throw error;
    }
}

/**
 * Add weather markers for each city
 * @param {Array} weatherData - Array of weather data for cities
 * @param {string} units - 'metric' or 'imperial'
 */
function addCityWeatherMarkers(weatherData, units) {
    weatherData.forEach(cityData => {
        const marker = createCityWeatherMarker(cityData, units);
        weatherMap.markers.push(marker);
        marker.addTo(weatherMap.map);
    });
}

/**
 * Create a weather marker for a city
 * @param {Object} cityData - Weather data for a city
 * @param {string} units - 'metric' or 'imperial'
 * @returns {Object} Leaflet marker object
 */
function createCityWeatherMarker(cityData, units) {
    const { coord, name, main, weather, wind } = cityData;
    const { lat, lon } = coord;
    
    // Create custom icon
    const weatherIcon = L.divIcon({
        className: 'weather-map-icon',
        html: `<div class="weather-icon-container">
                <img src="https://openweathermap.org/img/wn/${weather[0].icon}@2x.png" alt="${weather[0].description}">
                <span class="temp-badge">${Math.round(main.temp)}${units === 'metric' ? '°C' : '°F'}</span>
               </div>`,
        iconSize: [60, 60],
        iconAnchor: [30, 30]
    });
    
    // Create marker
    const marker = L.marker([lat, lon], { icon: weatherIcon });
    
    // Add popup with weather info
    const tempUnit = units === 'metric' ? '°C' : '°F';
    const speedUnit = units === 'metric' ? 'm/s' : 'mph';
    const windDirection = getWindDirectionName(wind.deg);
    
    const popupContent = `
        <div class="weather-popup">
            <h3>${name}</h3>
            <div class="weather-main">
                <img src="https://openweathermap.org/img/wn/${weather[0].icon}@2x.png" alt="${weather[0].description}">
                <div>
                    <div class="temp">${main.temp.toFixed(1)}${tempUnit}</div>
                    <div class="weather-desc">${weather[0].description}</div>
                </div>
            </div>
            <div class="weather-details">
                <div class="detail">
                    <span class="label">Feels like:</span>
                    <span class="value">${main.feels_like.toFixed(1)}${tempUnit}</span>
                </div>
                <div class="detail">
                    <span class="label">Humidity:</span>
                    <span class="value">${main.humidity}%</span>
                </div>
                <div class="detail">
                    <span class="label">Pressure:</span>
                    <span class="value">${main.pressure} hPa</span>
                </div>
                <div class="detail">
                    <span class="label">Wind:</span>
                    <span class="value">${wind.speed} ${speedUnit} ${windDirection}</span>
                </div>
            </div>
        </div>
    `;
    
    marker.bindPopup(popupContent, { 
        maxWidth: 300, 
        className: 'weather-map-popup' 
    });
    
    return marker;
}

/**
 * Clear all weather markers from the map
 */
function clearWeatherMarkers() {
    if (weatherMap && weatherMap.markers) {
        weatherMap.markers.forEach(marker => {
            weatherMap.map.removeLayer(marker);
        });
        weatherMap.markers = [];
    }
}

/**
 * Fit map view to show all city markers
 * @param {Array} weatherData - Array of weather data for cities
 */
function fitMapToCities(weatherData) {
    if (weatherData.length === 0) return;
    
    if (weatherData.length === 1) {
        // If only one city, center on it with a reasonable zoom level
        const { lat, lon } = weatherData[0].coord;
        weatherMap.map.setView([lat, lon], 8);
        return;
    }
    
    // Create bounds from all city coordinates
    const bounds = L.latLngBounds(weatherData.map(city => [city.coord.lat, city.coord.lon]));
    
    // Fit the map to these bounds with some padding
    weatherMap.map.fitBounds(bounds, { padding: [50, 50] });
}

/**
 * Add weather layer controls to the map
 * @param {string} units - 'metric' or 'imperial'
 */
function addWeatherLayerControls(units) {
    // Remove existing layers
    Object.values(weatherMap.layers).forEach(layer => {
        if (weatherMap.map.hasLayer(layer)) {
            weatherMap.map.removeLayer(layer);
        }
    });
    
    // Initialize new layers object
    weatherMap.layers = {};
    
    // Temperature layer
    weatherMap.layers.temperature = L.tileLayer(`https://tile.openweathermap.org/map/temp_new/{z}/{x}/{y}.png?appid=${weatherApiService.apiKey}`, {
        attribution: 'Weather data &copy; OpenWeatherMap',
        opacity: 0.5
    });
    
    // Precipitation layer
    weatherMap.layers.precipitation = L.tileLayer(`https://tile.openweathermap.org/map/precipitation_new/{z}/{x}/{y}.png?appid=${weatherApiService.apiKey}`, {
        attribution: 'Weather data &copy; OpenWeatherMap',
        opacity: 0.5
    });
    
    // Clouds layer
    weatherMap.layers.clouds = L.tileLayer(`https://tile.openweathermap.org/map/clouds_new/{z}/{x}/{y}.png?appid=${weatherApiService.apiKey}`, {
        attribution: 'Weather data &copy; OpenWeatherMap',
        opacity: 0.5
    });
    
    // Wind layer
    weatherMap.layers.wind = L.tileLayer(`https://tile.openweathermap.org/map/wind_new/{z}/{x}/{y}.png?appid=${weatherApiService.apiKey}`, {
        attribution: 'Weather data &copy; OpenWeatherMap',
        opacity: 0.5
    });
    
    // Add layer control
    L.control.layers({
        'Standard': L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }),
        'Satellite': L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
            attribution: 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
        })
    }, {
        'Temperature': weatherMap.layers.temperature,
        'Precipitation': weatherMap.layers.precipitation,
        'Clouds': weatherMap.layers.clouds,
        'Wind': weatherMap.layers.wind
    }).addTo(weatherMap.map);
    
    // Add legend
    addWeatherLegend(units);
}

/**
 * Add weather legend to the map
 * @param {string} units - 'metric' or 'imperial'
 */
function addWeatherLegend(units) {
    if (weatherMap.legend) {
        weatherMap.map.removeControl(weatherMap.legend);
    }
    
    weatherMap.legend = L.control({ position: 'bottomright' });
    
    weatherMap.legend.onAdd = function() {
        const div = L.DomUtil.create('div', 'weather-map-legend');
        const tempUnit = units === 'metric' ? '°C' : '°F';
        
        div.innerHTML = `
            <h4>Weather Legend</h4>
            <div class="legend-item">
                <div class="legend-color" style="background: linear-gradient(to right, #0000FF, #00FF00, #FFFF00, #FF0000);"></div>
                <div class="legend-labels">
                    <span>-10${tempUnit}</span>
                    <span>30${tempUnit}</span>
                </div>
            </div>
            <div class="legend-title">Temperature</div>
            
            <div class="legend-item">
                <div class="legend-color" style="background: linear-gradient(to right, rgba(0,0,255,0.1), rgba(0,0,255,1));"></div>
                <div class="legend-labels">
                    <span>Light</span>
                    <span>Heavy</span>
                </div>
            </div>
            <div class="legend-title">Precipitation</div>
        `;
        
        return div;
    };
    
    weatherMap.legend.addTo(weatherMap.map);
}

/**
 * Show loading indicator on map
 * @param {HTMLElement} container - Map container element
 */
function showMapLoading(container) {
    const loadingEl = document.createElement('div');
    loadingEl.className = 'map-loading-overlay';
    loadingEl.innerHTML = '<div class="map-loading-spinner"></div><div>Loading weather data...</div>';
    container.appendChild(loadingEl);
}

/**
 * Hide loading indicator
 * @param {HTMLElement} container - Map container element
 */
function hideMapLoading(container) {
    const loadingEl = container.querySelector('.map-loading-overlay');
    if (loadingEl) {
        loadingEl.remove();
    }
}

/**
 * Show error message on map
 * @param {HTMLElement} container - Map container element
 * @param {string} message - Error message
 */
function showMapError(container, message) {
    hideMapLoading(container);
    
    const errorEl = document.createElement('div');
    errorEl.className = 'map-error-message';
    errorEl.innerHTML = `
        <div class="error-icon">⚠️</div>
        <div>Error loading weather data: ${message}</div>
        <button class="retry-button">Retry</button>
    `;
    container.appendChild(errorEl);
    
    // Add retry button functionality
    const retryButton = errorEl.querySelector('.retry-button');
    retryButton.addEventListener('click', () => {
        errorEl.remove();
        loadWeatherMapData(lastCitiesRequested, lastUnitsRequested);
    });
}

/**
 * Track last request parameters for retry functionality
 */
let lastCitiesRequested = [];
let lastUnitsRequested = 'metric';

/**
 * Global weather map object
 */
let weatherMap = null;

/**
 * Initialize map when the DOM is ready
 */
document.addEventListener('DOMContentLoaded', () => {
    const mapContainer = document.getElementById('weather-map');
    if (mapContainer) {
        initWeatherMap('weather-map');
    }
});

/**
 * Search for a city and add it to the map
 * @param {string} cityName - Name of the city to search
 * @param {string} units - 'metric' or 'imperial'
 */
async function searchAndAddCity(cityName, units = 'metric') {
    try {
        const cityData = await weatherApiService.getCityWeather(cityName, units);
        
        // Initialize map if not already initialized
        if (!weatherMap || !weatherMap.map) {
            initWeatherMap('weather-map');
        }
        
        // Create and add marker
        const marker = createCityWeatherMarker(cityData, units);
        weatherMap.markers.push(marker);
        marker.addTo(weatherMap.map);
        
        // Center map on the new city
        weatherMap.map.setView([cityData.coord.lat, cityData.coord.lon], 8);
        
        // Open the popup
        marker.openPopup();
        
        return cityData;
    } catch (error) {
        console.error('Error searching for city:', error);
        throw error;
    }
}

/**
 * Export API for external use
 */
const weatherMapApi = {
    init: initWeatherMap,
    loadData: loadWeatherMapData,
    searchCity: searchAndAddCity,
    clearMarkers: clearWeatherMarkers
};