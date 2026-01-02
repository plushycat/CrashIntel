/**
 * Temporal Analysis Page - JavaScript
 * Fetches data from /analyze/temporal API and populates the UI
 */

const API_BASE = 'http://127.0.0.1:8000';

// DOM Elements (will be set after DOM loads)
let granularitySelect, dateRangeSelect, dayFilterSelect, generateBtn;
let peakHourStat, highestRiskDayStat, trendStat, seasonalityStat;
let patternCards;

/**
 * Initialize the page
 */
function initTemporalPage() {
    // Get DOM elements
    granularitySelect = document.getElementById('granularity-select');
    dateRangeSelect = document.getElementById('date-range-select');
    dayFilterSelect = document.getElementById('day-filter-select');
    generateBtn = document.getElementById('generate-btn');
    
    peakHourStat = document.getElementById('peak-hour-stat');
    highestRiskDayStat = document.getElementById('highest-risk-day-stat');
    trendStat = document.getElementById('trend-stat');
    seasonalityStat = document.getElementById('seasonality-stat');
    
    patternCards = document.querySelectorAll('.pattern-card');
    
    // Attach event listener
    if (generateBtn) {
        generateBtn.addEventListener('click', handleGenerateAnalysis);
    }
    
    // Load initial data (Hourly by default)
    fetchTemporalData('Hourly');
}

/**
 * Fetch temporal data from the API
 */
async function fetchTemporalData(granularity) {
    try {
        const response = await fetch(`${API_BASE}/analyze/temporal?granularity=${granularity}`);
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const data = await response.json();
        
        if (data.error) {
            console.error('API Error:', data.error);
            return;
        }
        
        updateStats(data, granularity);
        
    } catch (error) {
        console.error('Failed to fetch temporal data:', error);
    }
}

/**
 * Update the statistics display
 */
function updateStats(data, granularity) {
    // Update Peak Hour/Day stat
    if (peakHourStat && data.peak_label) {
        peakHourStat.textContent = data.peak_label;
    }
    
    // Update Highest Risk Day stat (show peak value count)
    if (highestRiskDayStat && data.peak_value) {
        highestRiskDayStat.textContent = `${data.peak_value} incidents`;
    }
    
    // Calculate and show trend (based on first vs last half of data)
    if (trendStat && data.values && data.values.length > 1) {
        const midpoint = Math.floor(data.values.length / 2);
        const firstHalf = data.values.slice(0, midpoint).reduce((a, b) => a + b, 0);
        const secondHalf = data.values.slice(midpoint).reduce((a, b) => a + b, 0);
        
        if (secondHalf > firstHalf * 1.1) {
            trendStat.textContent = '↗ Increasing';
            trendStat.style.color = '#ff6b6b';
        } else if (secondHalf < firstHalf * 0.9) {
            trendStat.textContent = '↘ Decreasing';
            trendStat.style.color = '#51cf66';
        } else {
            trendStat.textContent = '→ Stable';
            trendStat.style.color = '#ffd43b';
        }
    }
    
    // Calculate seasonality score (variance-based)
    if (seasonalityStat && data.values && data.values.length > 1) {
        const mean = data.values.reduce((a, b) => a + b, 0) / data.values.length;
        const variance = data.values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / data.values.length;
        const cv = (Math.sqrt(variance) / mean) * 100; // Coefficient of variation
        
        let score;
        if (cv < 10) score = 'Low';
        else if (cv < 25) score = 'Moderate';
        else score = 'High';
        
        seasonalityStat.textContent = `${score} (${cv.toFixed(1)}%)`;
    }
    
    // Update pattern cards with actual data
    updatePatternCards(data, granularity);
}

/**
 * Update the pattern cards based on data analysis
 */
function updatePatternCards(data, granularity) {
    if (!data.values || !data.labels) return;
    
    // Find peak periods
    const maxVal = Math.max(...data.values);
    const maxIdx = data.values.indexOf(maxVal);
    
    // For hourly data, identify rush hours
    if (granularity === 'Hourly') {
        // Morning rush (6-9)
        const morningSum = data.values.slice(6, 10).reduce((a, b) => a + b, 0);
        // Evening rush (17-20)  
        const eveningSum = data.values.slice(17, 21).reduce((a, b) => a + b, 0);
        // Night hours (22-4)
        const nightSum = data.values.slice(22, 24).reduce((a, b) => a + b, 0) + 
                         data.values.slice(0, 5).reduce((a, b) => a + b, 0);
        
        // Update card subtitles with actual counts
        const cards = document.querySelectorAll('.mini-card');
        if (cards.length >= 4) {
            cards[0].querySelector('div:last-child').textContent = `${morningSum} incidents`;
            cards[1].querySelector('div:last-child').textContent = `${eveningSum} incidents`;
            // Weekend card - keep static for now
            cards[3].querySelector('div:last-child').textContent = `${nightSum} incidents`;
        }
    }
}

/**
 * Handle Generate Analysis button click
 */
function handleGenerateAnalysis() {
    const granularity = granularitySelect ? granularitySelect.value : 'Hourly';
    
    // Map UI options to API parameters
    let apiGranularity;
    switch(granularity) {
        case 'Daily':
        case 'Weekly':
            apiGranularity = 'Daily';
            break;
        case 'Hourly':
        default:
            apiGranularity = 'Hourly';
    }
    
    // Show loading state
    if (peakHourStat) peakHourStat.textContent = 'Loading...';
    
    fetchTemporalData(apiGranularity);
}

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', initTemporalPage);
