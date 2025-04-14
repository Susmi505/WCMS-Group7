/**
 * API Service for OpenWeatherMap
 */
class WeatherApiService {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.openweathermap.org/data/2.5';
    }

    /**
     * Get current weather for a city
     * @param {string} city - The city name
     * @param {string} units - Units (metric, imperial)
     * @returns {Promise} Promise with weather data
     */
    async getCurrentWeather(city, units = 'metric') {
        try {
            const response = await fetch(`${this.baseUrl}/weather?q=${city}&units=${units}&appid=${this.apiKey}`);
            
            if (!response.ok) {
                throw new Error(`Error fetching data for ${city}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error in getCurrentWeather:', error);
            throw error;
        }
    }

    /**
     * Get 5-day forecast for a city
     * @param {string} city - The city name
     * @param {string} units - Units (metric, imperial)
     * @returns {Promise} Promise with forecast data
     */
    async getForecast(city, units = 'metric') {
        try {
            const response = await fetch(`${this.baseUrl}/forecast?q=${city}&units=${units}&appid=${this.apiKey}`);
            
            if (!response.ok) {
                throw new Error(`Error fetching forecast for ${city}: ${response.statusText}`);
            }
            
            return await response.json();
        } catch (error) {
            console.error('Error in getForecast:', error);
            throw error;
        }
    }

    /**
     * Get current weather for multiple cities
     * @param {Array} cities - Array of city names
     * @param {string} units - Units (metric, imperial)
     * @returns {Promise} Promise with array of weather data
     */
    async getMultipleCitiesWeather(cities, units = 'metric') {
        try {
            const promises = cities.map(city => this.getCurrentWeather(city, units));
            return await Promise.all(promises);
        } catch (error) {
            console.error('Error in getMultipleCitiesWeather:', error);
            throw error;
        }
    }

    /**
     * Get 5-day forecast for multiple cities
     * @param {Array} cities - Array of city names
     * @param {string} units - Units (metric, imperial)
     * @returns {Promise} Promise with array of forecast data
     */
    async getMultipleCitiesForecasts(cities, units = 'metric') {
        try {
            const promises = cities.map(city => this.getForecast(city, units));
            return await Promise.all(promises);
        } catch (error) {
            console.error('Error in getMultipleCitiesForecasts:', error);
            throw error;
        }
    }
}

// Initialize with the provided API key
const weatherApiService = new WeatherApiService('29e589c1ce171190c0fe1b22d92f74e9');
