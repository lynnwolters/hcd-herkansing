document.addEventListener("DOMContentLoaded", function () {
  const canvas = document.getElementById("canvas");
  canvas.width = window.innerWidth * 0.5;
  canvas.height = 300;

  const context = canvas.getContext("2d");
  let isDrawing = false;
  let lastX = 0;
  let lastY = 0;
  let interpolation = 0.1;
  let isErasing = false;
  const eraserRadius = 15;
  let selectedLanguage = "eng";

  context.fillStyle = "white";
  context.fillRect(0, 0, canvas.width, canvas.height);

  function startDrawing(e) {
    isDrawing = true;
    const rect = canvas.getBoundingClientRect();
    [lastX, lastY] = [e.clientX - rect.left, e.clientY - rect.top];
  }

  function stopDrawing() {
    isDrawing = false;
    extractText();
  }

  function drawPreview() {
    const previewCanvas = document.getElementById("canvas-preview");
    const previewContext = previewCanvas.getContext("2d");
    previewContext.drawImage(canvas, 0, 0);
  }

  function draw(e) {
    if (!isDrawing) return;

    const rect = canvas.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const distance = Math.sqrt(
      (currentX - lastX) ** 2 + (currentY - lastY) ** 2
    );

    const steps = Math.floor(distance / interpolation);

    const deltaX = (currentX - lastX) / steps;
    const deltaY = (currentY - lastY) / steps;

    for (let i = 0; i < steps; i++) {
      const intermediateX = lastX + deltaX * i;
      const intermediateY = lastY + deltaY * i;

      if (isErasing) {
        context.beginPath();
        context.arc(currentX, currentY, eraserRadius, 0, 2 * Math.PI);
        context.fillStyle = "white";
        context.fill();
      } else {
        context.beginPath();
        context.moveTo(intermediateX, intermediateY);
        context.lineTo(intermediateX + deltaX, intermediateY + deltaY);
        context.stroke();
        const brushSizeInput = document.getElementById("brush-size");
        const brushSize = parseInt(brushSizeInput.value, 10);
        context.lineWidth = brushSize;
        context.strokeStyle = "black";
      }
    }

    [lastX, lastY] = [currentX, currentY];
    drawPreview();
  }
  const extract_text = document.getElementById("extract-text");

  function extractText() {
    Tesseract.recognize(canvas.toDataURL("image/png"), selectedLanguage)
      .then(function (result) {
        extract_text.innerText = result.data.text;
      })
      .catch(function (error) {
        console.error(error);
        extract_text.innerText = error;
      });
  }

  canvas.addEventListener("mousedown", startDrawing);
  canvas.addEventListener("mousemove", draw);
  canvas.addEventListener("mouseup", stopDrawing);
  canvas.addEventListener("mouseout", stopDrawing);

  // ERASER DRAW
  const eraserButton = document.getElementById("eraser-button");
  const circleGomme = document.getElementById("circle-gomme");
  eraserButton.addEventListener("click", function () {
    isErasing = !isErasing;

    if (isErasing) {
      circleGomme.style.display = "block";
    } else {
      circleGomme.style.display = "none";
    }

    eraserButton.classList.toggle("active");
  });

  // CIRCLE ERASER
  const circle = document.getElementById("circle-gomme");
  const container = document.querySelector(".draw");
  const circleStyle = circle.style;

  document.addEventListener("mousemove", (e) => {
    window.requestAnimationFrame(() => {
      const containerRect = container.getBoundingClientRect();
      const mouseX = e.clientX - containerRect.left;
      const mouseY = e.clientY - containerRect.top;

      circleStyle.top = `${mouseY - circle.offsetHeight / 2}px`;
      circleStyle.left = `${mouseX - circle.offsetWidth / 2}px`;
    });
  });

  // RESET DRAW
  const resetButton = document.getElementById("reset-button");
  resetButton.addEventListener("click", function () {
    lastX = 0;
    lastY = 0;
    extract_text.innerText = "";
    circleGomme.style.display = "none";
    isErasing = false;
    context.clearRect(0, 0, canvas.width, canvas.height);
    drawPreview();
    const previewCanvas = document.getElementById("canvas-preview");
    const previewContext = previewCanvas.getContext("2d");

    previewContext.clearRect(0, 0, previewCanvas.width, previewCanvas.height);
  });

  // SELECT LANGUAGE
  const languageSelect = document.getElementById("language-select");
  languageSelect.addEventListener("change", function () {
    selectedLanguage = languageSelect.value;
    extractText();
  });
});
