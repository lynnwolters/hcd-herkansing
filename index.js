// JavaScript voor het tekenen op het canvas en herkenning
const canvas = document.getElementById('drawCanvas');
const ctx = canvas.getContext('2d');
let drawing = false;

// Start tekenen bij mouse down
canvas.addEventListener('mousedown', (e) => {
    drawing = true;
    ctx.beginPath();
    ctx.moveTo(e.offsetX, e.offsetY);
});

// Stop tekenen bij mouse up
canvas.addEventListener('mouseup', () => {
    drawing = false;
    ctx.closePath();
    herkenLetter();
});

// Teken als de muis beweegt
canvas.addEventListener('mousemove', (e) => {
    if (drawing) {
        ctx.lineTo(e.offsetX, e.offsetY);
        ctx.stroke();
    }
});

// Canvas wissen
document.getElementById('clearBtn').addEventListener('click', () => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById('outputText').value = ''; // Reset het outputveld
});

// Functie om te herkennen welke letter getekend is
async function herkenLetter() {
    const output = document.getElementById('outputText');

    // Het canvas omzetten naar een 28x28 afbeelding
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const tensor = tf.browser.fromPixels(imageData, 1)  // Grayscale
        .resizeNearestNeighbor([28, 28])  // Verklein de afbeelding naar 28x28 pixels
        .div(255)  // Schaal de pixelwaardes naar tussen 0 en 1
        .expandDims(0);  // Voeg een batch-dimensie toe (nodig voor TensorFlow)

    // Laad het model voor handschriftherkenning (bijvoorbeeld een model voor MNIST)
    const model = await tf.loadLayersModel('https://cdn.jsdelivr.net/npm/@tensorflow-models/mnist');

    // Voorspel de getekende letter
    const prediction = model.predict(tensor);
    const predictedLabel = prediction.argMax(-1).dataSync()[0];

    // Zet de voorspelde label om naar een karakter (0-9)
    output.value = predictedLabel;
}

