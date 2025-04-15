(function (window, document) {
  var root = (typeof self === "object" && self.self === self && self) || this;

  var handwriting = function (obj) {
    if (obj instanceof handwriting) return obj;
    return { _wrapped: obj };
  };

  root.handwriting = handwriting;

  handwriting.createCanvas = function (cvs, lineWidth) {
    const canvas = {
      canvas: cvs,
      cxt: cvs.getContext("2d"),
      lineWidth: lineWidth || 3,
      width: cvs.width,
      height: cvs.height,
      drawing: false,
      handwritingX: [],
      handwritingY: [],
      trace: [],
      options: {},
      step: [],
      redo_step: [],
      redo_trace: [],
      allowUndo: false,
      allowRedo: false,
      callback: undefined,
    };

    cvs.addEventListener("mousedown", (e) => mouseDown(canvas, e));
    cvs.addEventListener("mousemove", (e) => mouseMove(canvas, e));
    cvs.addEventListener("mouseup", () => mouseUp(canvas));
    cvs.addEventListener("touchstart", (e) => touchStart(canvas, e));
    cvs.addEventListener("touchmove", (e) => touchMove(canvas, e));
    cvs.addEventListener("touchend", (e) => touchEnd(canvas, e));

    canvas.setUndoRedo = (undo, redo) => {
      canvas.allowUndo = undo;
      canvas.allowRedo = undo ? redo : false;
      if (!canvas.allowUndo) {
        canvas.step = [];
        canvas.redo_step = [];
        canvas.redo_trace = [];
      }
    };

    canvas.setLineWidth = (width) => (canvas.lineWidth = width);
    canvas.setCallBack = (cb) => (canvas.callback = cb);
    canvas.setOptions = (opts) => (canvas.options = opts);

    canvas.undo = () => undo(canvas);
    canvas.redo = () => redo(canvas);
    canvas.erase = () => erase(canvas);

    canvas.recognize = () => handwriting.recognize(canvas);

    return canvas;
  };

  function mouseDown(canvas, e) {
    const cxt = canvas.cxt;
    cxt.lineWidth = canvas.lineWidth;
    canvas.handwritingX = [];
    canvas.handwritingY = [];
    canvas.drawing = true;
    cxt.beginPath();
    const rect = canvas.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    cxt.moveTo(x, y);
    canvas.handwritingX.push(x);
    canvas.handwritingY.push(y);
  }

  function mouseMove(canvas, e) {
    if (!canvas.drawing) return;
    const rect = canvas.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    canvas.cxt.lineTo(x, y);
    canvas.cxt.stroke();
    canvas.handwritingX.push(x);
    canvas.handwritingY.push(y);
  }

  function mouseUp(canvas) {
    const w = [canvas.handwritingX, canvas.handwritingY, []];
    canvas.trace.push(w);
    canvas.drawing = false;
    if (canvas.allowUndo) canvas.step.push(canvas.canvas.toDataURL());
  }

  function touchStart(canvas, e) {
    e.preventDefault();
    canvas.cxt.lineWidth = canvas.lineWidth;
    canvas.handwritingX = [];
    canvas.handwritingY = [];
    const rect = canvas.canvas.getBoundingClientRect();
    const touch = e.changedTouches[0];
    const x = touch.pageX - rect.left;
    const y = touch.pageY - rect.top;
    canvas.handwritingX.push(x);
    canvas.handwritingY.push(y);
    canvas.cxt.beginPath();
    canvas.cxt.moveTo(x, y);
  }

  function touchMove(canvas, e) {
    e.preventDefault();
    const touch = e.targetTouches[0];
    const rect = canvas.canvas.getBoundingClientRect();
    const x = touch.pageX - rect.left;
    const y = touch.pageY - rect.top;
    canvas.handwritingX.push(x);
    canvas.handwritingY.push(y);
    canvas.cxt.lineTo(x, y);
    canvas.cxt.stroke();
  }

  function touchEnd(canvas) {
    const w = [canvas.handwritingX, canvas.handwritingY, []];
    canvas.trace.push(w);
    if (canvas.allowUndo) canvas.step.push(canvas.canvas.toDataURL());
  }

  function undo(canvas) {
    if (!canvas.allowUndo || canvas.step.length <= 0) return;
    if (canvas.step.length === 1) {
      if (canvas.allowRedo) {
        canvas.redo_step.push(canvas.step.pop());
        canvas.redo_trace.push(canvas.trace.pop());
        canvas.cxt.clearRect(0, 0, canvas.width, canvas.height);
      }
    } else {
      if (canvas.allowRedo) {
        canvas.redo_step.push(canvas.step.pop());
        canvas.redo_trace.push(canvas.trace.pop());
      } else {
        canvas.step.pop();
        canvas.trace.pop();
      }
      loadFromUrl(canvas.step.slice(-1)[0], canvas);
    }
  }

  function redo(canvas) {
    if (!canvas.allowRedo || canvas.redo_step.length <= 0) return;
    canvas.step.push(canvas.redo_step.pop());
    canvas.trace.push(canvas.redo_trace.pop());
    loadFromUrl(canvas.step.slice(-1)[0], canvas);
  }

  function erase(canvas) {
    canvas.cxt.clearRect(0, 0, canvas.width, canvas.height);
    canvas.step = [];
    canvas.redo_step = [];
    canvas.redo_trace = [];
    canvas.trace = [];
  }

  function loadFromUrl(url, canvas) {
    const img = new Image();
    img.onload = function () {
      canvas.cxt.clearRect(0, 0, canvas.width, canvas.height);
      canvas.cxt.drawImage(img, 0, 0);
    };
    img.src = url;
  }

  handwriting.recognize = function (canvas) {
    const trace = canvas.trace;
    const options = canvas.options || {};
    const callback = canvas.callback;

    const data = JSON.stringify({
      options: "enable_pre_space",
      requests: [
        {
          writing_guide: {
            writing_area_width: options.width || canvas.width,
            writing_area_height: options.height || canvas.height,
          },
          ink: trace,
          language: options.language || "zh_TW",
        },
      ],
    });

    const xhr = new XMLHttpRequest();
    xhr.addEventListener("readystatechange", function () {
      if (this.readyState === 4) {
        if (this.status === 200) {
          const response = JSON.parse(this.responseText);
          if (response.length === 1)
            return callback(undefined, new Error(response[0]));
          let results = response[1][0][1];
          if (options.numOfWords) {
            results = results.filter((r) => r.length === options.numOfWords);
          }
          if (options.numOfReturn) {
            results = results.slice(0, options.numOfReturn);
          }
          callback(results, undefined);
        } else if (this.status === 403) {
          callback(undefined, new Error("access denied"));
        } else if (this.status === 503) {
          callback(undefined, new Error("can't connect to recognition server"));
        }
      }
    });

    xhr.open(
      "POST",
      "https://www.google.com.tw/inputtools/request?ime=handwriting&app=mobilesearch&cs=1&oe=UTF-8"
    );
    xhr.setRequestHeader("content-type", "application/json");
    xhr.send(data);
  };
})(window, document);

const canvas = handwriting.createCanvas(document.getElementById("canvas"), 3);

canvas.setCallBack(function (data, err) {
  if (err) {
    throw err;
  } else {
    const resultElement = document.getElementById("result");
    const newSpan = document.createElement("span");
    newSpan.textContent = data + " ";
    resultElement.appendChild(newSpan);

    canvas.erase();
  }
});

canvas.eraseResult = function () {
  const resultEl = document.getElementById("result");
  if (resultEl) {
    resultEl.innerHTML = "";
  }
};

canvas.copy = function () {
  const resultEl = document.getElementById("result");
  if (!resultEl) return;

  const text = resultEl.textContent.trim();

  if (text.length === 0) return;

  navigator.clipboard
    .writeText(text)
    .then(() => {
      alert("Tekst gekopieerd naar klembord.");
    })
    .catch((err) => {
      console.error("Fout bij kopiëren:", err);
    });
};

canvas.setLineWidth(5);

canvas.setOptions({
  language: "en",
  numOfReturn: 1,
});
