document.addEventListener('DOMContentLoaded', () => {
    // Attach event listener to the analyze button
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', runComplexPrediction);
    }

    // Attach listener for speed range display
    const speedRange = document.getElementById("speedRange");
    if(speedRange){
        speedRange.addEventListener('input', function() {
            document.getElementById('speedValueDisplay').innerText = this.value;
        });
    }
});

function runComplexPrediction() {
    // 1. Get values
    const location = document.getElementById("locationSelect").value;
    const vehicle = document.getElementById("vehicleSelect").value;
    const weather = document.getElementById("weatherSelect").value;
    const speed = parseInt(document.getElementById("speedRange").value);

    // 2. Prepare UI
    const placeholder = document.getElementById("placeholderResult");
    const terminalContainer = document.getElementById("terminalContainer");
    const riskResultContainer = document.getElementById("riskResultContainer");
    const term = document.getElementById("terminal");

    placeholder.style.display = "none";
    terminalContainer.style.display = "block";
    riskResultContainer.style.display = "none";
    
    // Clear previous logs
    term.innerHTML = '<div class="log-line">> System Ready...</div>';

    // 3. Simulate process with Terminal Logs
    log("Initializing Neural Network...");
    
    setTimeout(() => {
        log(`Loading geospatial data for ${location}...`);
    }, 800);

    setTimeout(() => {
        log(`Analyzing weather condition: ${weather}...`);
    }, 1500);

    setTimeout(() => {
        log(`Processing vehicle dynamics (${vehicle} @ ${speed}km/h)...`);
    }, 2400);

    setTimeout(() => {
        log("Calculating aggregate risk probability...");
    }, 3200);

    setTimeout(() => {
        log("Inference complete. Generating report...");
        showFinalResult(location, vehicle, weather, speed);
    }, 4200);
}

function log(msg) {
    const term = document.getElementById("terminal");
    const div = document.createElement("div");
    div.className = "log-line";
    div.innerText = "> " + msg;
    term.appendChild(div);
    term.scrollTop = term.scrollHeight;
}

function showFinalResult(location, vehicle, weather, speed) {
    const riskData = calculateRisk(location, weather, vehicle, speed);
    
    const terminalContainer = document.getElementById("terminalContainer");
    const riskResultContainer = document.getElementById("riskResultContainer");
    
    terminalContainer.style.display = "none";
    riskResultContainer.style.display = "block";

    // Animate Score
    animateValue("riskScore", 0, riskData.score, 1000);

    // Update Circle Color
    const circle = document.getElementById("riskCircle");
    circle.style.borderColor = riskData.color;

    // Update Text
    const predictionText = document.getElementById("predictionResult");
    predictionText.innerText = riskData.label;
    predictionText.style.background = riskData.color; // Fallback
    predictionText.style.background = `linear-gradient(135deg, #fff 0%, ${riskData.mainColor} 100%)`;
    predictionText.style.webkitBackgroundClip = "text";
    predictionText.style.webkitTextFillColor = "transparent";

    document.getElementById("resultMessage").innerText = riskData.message;
}

function calculateRisk(loc, wea, veh, speed) {
    // Hardcoded Logic weights
    let score = 20; // Base risk

    // Location Weights
    if (loc === "Hebbal") score += 30; // High traffic
    if (loc === "NiceRoad") score += 25; // High speed zone
    if (loc === "Koramangala") score += 10;
    if (loc === "Indiranagar") score += 15;

    // Vehicle Weights
    if (veh === "Motorcycle") score += 20; // Vulnerable
    // Speed Impact for different vehicles
    if (speed > 60 && veh === "Motorcycle") score += 15;
    if (speed > 80) score += 20;
    if (speed > 120) score += 40; // High danger

    // Weather Weights
    if (wea === "Rain") score += 15;
    if (wea === "Fog") score += 25;

    // Cap score at 99
    if (score > 99) score = 99;
    if (score < 10) score = 10;

    // Classify
    let label = "Low Risk";
    let color = "#10b981"; // Green
    let message = "Conditions are favorable for safe travel. Standard caution advised.";

    if (score > 50) {
        label = "Moderate Risk";
        color = "#f59e0b"; // Orange
        message = `elevated risk due to ${speed}km/h speed in ${loc}. Exercise increased caution.`;
    }
    if (score > 75) {
        label = "High Risk - FATAL";
        color = "#ef4444"; // Red
        message = "CRITICAL WARNING: Probability of severe accident is extremely high. Reduce speed immediately or avoid travel.";
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