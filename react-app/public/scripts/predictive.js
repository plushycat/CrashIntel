/**
 * CrashIntel Predictive Risk Analysis Engine
 * 
 * This module implements a data-driven severity prediction algorithm based on
 * findings from Phase 3 analysis of 20,000+ Bengaluru accident records.
 * 
 * Key insights incorporated:
 * 1. TIME OF DAY: Night (22:00-03:00) accounts for 40-50% of all fatalities
 * 2. WEATHER: Fog/Haze doubles the fatality rate compared to clear conditions
 * 3. VEHICLE: Motorcycles on wet roads show significantly higher severe outcomes
 * 4. SPEED: Low-congestion/high-speed environments are the deadliest
 * 5. LOCATION: 27th Main Road, 80 Feet Road, Marathahalli Bridge are fatal hotspots
 * 6. INTERACTION EFFECTS: Night + High Speed + Motorcycle = Critical Risk
 */

let riskConfig = null;

function initPredictiveRA() {
    // Load risk configuration from backend
    fetchRiskConfig();

    // Attach event listener to the analyze button
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', runComplexPrediction);
    }

    // Attach listener for speed range display
    const speedRange = document.getElementById("speedRange");
    if (speedRange) {
        speedRange.addEventListener('input', function() {
            document.getElementById('speedValueDisplay').innerText = this.value;
        });
    }
}

// Initialize immediately if DOM is ready (React support), otherwise wait
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPredictiveRA);
} else {
    initPredictiveRA();
}

async function fetchRiskConfig() {
    try {
        const response = await fetch('http://localhost:8001/api/risk-weights');
        const data = await response.json();
        
        if (data.status === 'ok') {
            riskConfig = data.data;
            console.log("Risk configuration loaded from backend.");
        } else {
            throw new Error(data.error || "Unknown error loading risk weights");
        }
    } catch (error) {
        console.error("Failed to load risk configuration:", error);
        showError("Unable to load risk data from server. Please ensure the backend is running via `run_server.bat`.");
    }
}

function showError(message) {
    const errorEl = document.getElementById('riskError');
    if (errorEl) {
        errorEl.innerText = message;
        errorEl.style.display = 'block';
        errorEl.classList.add('visible');
    }
}

function runComplexPrediction() {
    // 1. Get all input values
    const location = document.getElementById("locationSelect").value;
    const timeOfDay = document.getElementById("timeSelect").value;
    const vehicle = document.getElementById("vehicleSelect").value;
    const weather = document.getElementById("weatherSelect").value;
    const speed = parseInt(document.getElementById("speedRange").value);

    // 2. Prepare UI
    const placeholder = document.getElementById("placeholderResult");
    const terminalContainer = document.getElementById("terminalContainer");
    const riskResultContainer = document.getElementById("riskResultContainer");
    const term = document.getElementById("terminal");

    if (placeholder) placeholder.style.display = "none";
    terminalContainer.style.display = "block";
    riskResultContainer.style.display = "none";
    
    term.innerHTML = '<div class="log-line">> CrashIntel AI Engine v2.0 Ready...</div>';

    // 3. Simulate analysis with detailed logs
    log("Loading Phase 3 analytical model...");
    
    setTimeout(() => {
        log(`[LOCATION] Querying fatality data for ${location}...`);
    }, 600);

    setTimeout(() => {
        log(`[TEMPORAL] Analyzing ${timeOfDay} severity patterns...`);
    }, 1200);

    setTimeout(() => {
        log(`[WEATHER] Processing ${weather} visibility factor...`);
    }, 1800);

    setTimeout(() => {
        log(`[VEHICLE] Calculating ${vehicle} vulnerability index @ ${speed}km/h...`);
    }, 2400);

    setTimeout(() => {
        log("[ENGINE] Running multi-factor interaction analysis...");
    }, 3000);

    setTimeout(() => {
        log("[COMPLETE] Generating severity prediction...");
        showFinalResult(location, timeOfDay, vehicle, weather, speed);
    }, 3800);
}

function log(msg) {
    const term = document.getElementById("terminal");
    const div = document.createElement("div");
    div.className = "log-line";
    div.innerText = "> " + msg;
    term.appendChild(div);
    term.scrollTop = term.scrollHeight;
}

function showFinalResult(location, timeOfDay, vehicle, weather, speed) {
    const riskData = calculateRisk(location, timeOfDay, weather, vehicle, speed);
    
    const terminalContainer = document.getElementById("terminalContainer");
    const riskResultContainer = document.getElementById("riskResultContainer");
    
    terminalContainer.style.display = "none";
    riskResultContainer.style.display = "block";

    animateValue("riskScore", 0, riskData.score, 1000);

    const circle = document.getElementById("riskCircle");
    circle.style.borderColor = riskData.color;

    const predictionText = document.getElementById("predictionResult");
    predictionText.innerText = riskData.label;
    predictionText.style.background = `linear-gradient(135deg, #fff 0%, ${riskData.color} 100%)`;
    predictionText.style.webkitBackgroundClip = "text";
    predictionText.style.webkitTextFillColor = "transparent";

    document.getElementById("resultMessage").innerText = riskData.message;
}

/**
 * Data-Driven Risk Calculation Engine
 * 
 * Risk weights are loaded from backend CSV configuration derived from Phase 3 analysis.
 */
function calculateRisk(loc, time, wea, veh, speed) {
    if (!riskConfig) {
        return { score: 0, label: "Error", color: "#ccc", message: "Risk configuration not loaded." };
    }

    let score = 5; // Baseline risk (minimal)
    let riskFactors = []; // Track contributing factors for message

    // =====================================================
    // 1. LOCATION RISK
    // =====================================================
    const locData = riskConfig.location[loc];
    const locScore = locData ? locData.score : 5;
    score += locScore;
    
    if (locScore >= 20) {
        riskFactors.push(`${loc} is a documented high-fatality zone`);
    }

    // =====================================================
    // 2. TIME OF DAY RISK
    // =====================================================
    const timeData = riskConfig.time[time];
    const timeScore = timeData ? timeData.score : 0;
    score += timeScore;

    if (time === "Night") {
        riskFactors.push("Night hours (22:00-03:00) account for 40-50% of fatalities");
    }

    // =====================================================
    // 3. WEATHER RISK
    // =====================================================
    const weaData = riskConfig.weather[wea];
    const weaScore = weaData ? weaData.score : 0;
    score += weaScore;

    if (wea === "Fog") {
        riskFactors.push("Fog conditions double the fatality rate");
    } else if (wea === "Rain") {
        riskFactors.push("Wet road conditions reduce traction");
    }

    // =====================================================
    // 4. VEHICLE VULNERABILITY
    // =====================================================
    const vehData = riskConfig.vehicle[veh];
    const vehScore = vehData ? vehData.score : 0;
    score += vehScore;

    if (veh === "Motorcycle" || veh === "Bicycle") {
        riskFactors.push(`${veh} riders have the highest fatality rate per incident`);
    }

    // =====================================================
    // 5. SPEED RISK
    // =====================================================
    let speedScore = 0;
    // Iterate through sorted thresholds
    for (const threshold of riskConfig.speed_thresholds) {
        if (speed <= threshold.max_speed) {
            speedScore = threshold.score;
            if (speed > 90) {
                 riskFactors.push(`Speed of ${speed}km/h significantly increases collision severity`);
            }
            break;
        }
    }
    // Handle speeds above max threshold
    if (speed > 140) {
        speedScore = 45;
        riskFactors.push(`CRITICAL: ${speed}km/h is in the fatal velocity range`);
    }
    
    score += speedScore;

    // =====================================================
    // 6. INTERACTION EFFECTS (Dynamic from Config)
    // =====================================================
    const interactions = riskConfig.interactions || {};

    // Night + High Speed 
    if (time === "Night" && speed > 70) {
        const item = interactions["night_high_speed"];
        if (item) {
            score += item.score;
            riskFactors.push("Night + High Speed: >60% probability of fatal outcome");
        }
    }

    // Motorcycle + Wet Roads
    if ((veh === "Motorcycle" || veh === "Bicycle") && wea === "Rain") {
        const item = interactions["motorcycle_rain"];
        if (item) {
            score += item.score;
            riskFactors.push(`${veh} on wet roads: traction loss dramatically increases severity`);
        }
    }

    // Truck + Night
    if (veh === "Truck" && time === "Night") {
        const item = interactions["truck_night"];
        if (item) {
            score += item.score;
            riskFactors.push("Trucks at night: driver fatigue is a leading cause of fatalities");
        }
    }

    // Fog + High Speed
    if (wea === "Fog" && speed > 60) {
         const item = interactions["fog_high_speed"];
         if (item) {
             score += item.score;
             riskFactors.push("Low visibility + moderate speed: stopping distance exceeds sight distance");
         }
    }

    // High-fatality location + Night
    // Check if current location has high score (>20)
    if (locScore >= 20 && time === "Night") {
        const item = interactions["fatal_zone_night"];
        if (item) {
            score += item.score;
            riskFactors.push("High-fatality zone during peak danger hours");
        }
    }

    // =====================================================
    // 7. FINAL CLASSIFICATION & OUTPUT
    // =====================================================
    
    // Normalize score to 0-99 range
    score = Math.min(99, Math.max(5, Math.round(score)));

    let label, color, message;

    if (score <= 35) {
        label = "Low Risk";
        color = "#10b981"; // Green
        message = "Conditions are favorable for safe travel. Standard precautions advised.";
    } else if (score <= 60) {
        label = "Moderate Risk";
        color = "#f59e0b"; // Amber
        message = `Elevated risk detected. ${riskFactors[0] || 'Exercise increased caution. Reduce speed if conditions worsen.'}`;
    } else if (score <= 80) {
        label = "High Risk";
        color = "#f97316"; // Orange
        const topFactors = riskFactors.slice(0, 2).join('. ');
        message = `WARNING: ${topFactors}. Consider postponing travel or taking alternative routes.`;
    } else {
        label = "Critical - FATAL";
        color = "#ef4444"; // Red
        const topFactors = riskFactors.slice(0, 2).join('. ');
        message = `CRITICAL ALERT: ${topFactors}. Data shows these conditions have extremely high fatality rates. Avoid travel or reduce speed immediately.`;
    }

    return { score, label, color, message, mainColor: color };
}

function animateValue(id, start, end, duration) {
    const obj = document.getElementById(id);
    let startTimestamp = null;
    const step = (timestamp) => {
        if (!startTimestamp) startTimestamp = timestamp;
        const progress = Math.min((timestamp - startTimestamp) / duration, 1);
        obj.innerHTML = Math.floor(progress * (end - start) + start);
        if (progress < 1) {
            window.requestAnimationFrame(step);
        }
    };
    window.requestAnimationFrame(step);
}