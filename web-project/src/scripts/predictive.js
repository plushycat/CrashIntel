document.addEventListener('DOMContentLoaded', () => {
    // Attach event listener to the analyze button
    const analyzeBtn = document.getElementById('analyzeBtn');
    if (analyzeBtn) {
        analyzeBtn.addEventListener('click', getPrediction);
    }
});

async function getPrediction() {
    // 1. Get values from the DOM
    const location = document.getElementById("locationSelect").value;
    const vehicle = document.getElementById("vehicleSelect").value;
    const weather = document.getElementById("weatherSelect").value;

    // 2. Prepare the UI elements
    const resultContainer = document.getElementById("resultContainer");
    const placeholder = document.getElementById("placeholderResult");
    const title = document.getElementById("predictionResult");
    const confidence = document.getElementById("confidenceLevel");
    const msg = document.getElementById("resultMessage");
    const icon = document.getElementById("resultIcon");

    // 3. Set Loading State
    placeholder.style.display = "none";
    resultContainer.style.display = "block";
    title.innerText = "Analyzing...";
    title.style.color = "white"; // Reset color
    confidence.innerText = "";
    msg.innerText = "";
    icon.innerText = "⏳";

    try {
        // 4. Fetch from API
        // Ensure main.py is running on port 8000
        const url = `http://127.0.0.1:8000/predict?location=${location}&vehicle_type=${vehicle}&weather=${weather}`;
        const response = await fetch(url);
        const data = await response.json();

        // 5. Update UI with Data
        if (data.error) {
            handleError(data.error);
        } else {
            handleSuccess(data);
        }
    } catch (error) {
        console.error("Connection Error:", error);
        handleError("Ensure your Python backend (main.py) is running on port 8000.");
    }

    // Helper: Handle Success State
    function handleSuccess(data) {
        title.innerText = data.prediction;
        confidence.innerText = "Confidence: " + data.confidence;
        msg.innerText = data.details || "Prediction complete.";

        // Color Coding based on severity
        if (data.prediction === "Fatal") {
            title.style.color = "#ff4d4d"; // Red
            icon.innerText = "🚨";
        } else if (data.prediction === "Serious") {
            title.style.color = "#ffa502"; // Orange
            icon.innerText = "🚑";
        } else {
            title.style.color = "#2ed573"; // Green
            icon.innerText = "✅";
        }
    }

    // Helper: Handle Error State
    function handleError(errorMessage) {
        title.innerText = "Error";
        title.style.color = "#ff6b6b";
        msg.innerText = errorMessage;
        icon.innerText = "⚠️";
    }
}