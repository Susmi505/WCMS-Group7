/**
 * Main script for the weather dashboard
 */
document.addEventListener('DOMContentLoaded', function() {
    // Initialize navigation
    initNavigation();
    
    // Initialize event listeners
    initEventListeners();
    
    // Load initial data
    loadInitialData();
});

/**
 * Initialize navigation between visualizations
 */
function initNavigation() {
    const navLinks = document.querySelectorAll('nav a');
    
    navLinks.forEach(link => {
        link.addEventListener('click', function(e) {
            e.preventDefault();
            
            // Update active link
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
            
            // Show the corresponding visualization
            const targetId = this.getAttribute('data-page');
            document.querySelectorAll('.visualization').forEach(vis => {
                vis.classList.remove('active');
            });
            document.getElementById(targetId).classList.add('active');
        });
    });
}

/**
 * Initialize event listeners
 */
function initEventListeners() {
    // Update button
    document.getElementById('update-data').addEventListener('click', function() {
        loadAllData();
    });
    
    // Unit selector
    document.querySelectorAll('input[name="units"]').forEach(input => {
        input.addEventListener('change', function() {
            loadAllData();
        });
    });
}

/**
 * Load initial data
 */
function loadInitialData() {
    // Load data for all visualizations
    loadAllData();
}

/**
 * Load data for all visualizations
 */
function loadAllData() {
    const cities = getSelectedCities();
    const units = getSelectedUnit();
    
    if (cities.length === 0) {
        alert('Please enter at least one city.');
        return;
    }
    
    // Load data for each visualization
    loadTemperatureComparisonData(cities, units);
    loadWeatherDistributionData(cities, units);
    loadTemperatureTimelineData(cities, units);
    loadHumidityTemperatureData(cities, units);
    loadWindDirectionData(cities, units);
    loadWeatherMapData(cities, units);
}
