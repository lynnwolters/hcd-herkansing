import React, { useRef, useState, useEffect } from 'react';
import Tesseract from 'tesseract.js';

function App() {
  const [isDrawing, setIsDrawing] = useState(false);
  const [text, setText] = useState('');
  const canvasRef = useRef(null);
  const ctxRef = useRef(null);

  useEffect(() => {
    // Initialiseer de canvas context
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    ctxRef.current = ctx;
  }, []);

  const startDrawing = (e) => {
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const rect = canvas.getBoundingClientRect();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    const ctx = ctxRef.current;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    // Optioneel: Sla het canvas op als een afbeelding voor OCR
    const canvas = canvasRef.current;
    const imageUrl = canvas.toDataURL();
    performOCR(imageUrl);
  };

  const performOCR = (imageUrl) => {
    Tesseract.recognize(
      imageUrl,
      'eng',
      {
        logger: (m) => console.log(m), // Optioneel voor debuggen
      }
    ).then(({ data: { text } }) => {
      setText(text);
    });
  };

  return (
    <div className="App">
      <h1>Tekenen en OCR</h1>
      <canvas
        ref={canvasRef}
        width={500}
        height={500}
        onMouseDown={startDrawing}
        onMouseMove={draw}
        onMouseUp={stopDrawing}
        onMouseLeave={stopDrawing}
        style={{ border: '1px solid black' }}
      />
      <h2>Herkenning van tekst:</h2>
      <p>{text}</p>
    </div>
  );
}

export default App;
