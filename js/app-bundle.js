// ============================================================
// color.js
// ============================================================
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function hexToRgb(hex) {
  var sanitized = hex.replace("#", "").trim();
  if (sanitized.length !== 6) {
    return [0, 0, 0];
  }
  return [
    parseInt(sanitized.slice(0, 2), 16),
    parseInt(sanitized.slice(2, 4), 16),
    parseInt(sanitized.slice(4, 6), 16),
  ];
}

function rgbToHex(rgb) {
  return "#" + rgb.map(function (value) {
    return clamp(value, 0, 255).toString(16).padStart(2, "0");
  }).join("");
}

function parseRgbText(input) {
  var values = input
    .split(",")
    .map(function (part) { return parseInt(part.trim(), 10); })
    .filter(function (value) { return Number.isFinite(value); });
  if (values.length !== 3) {
    return null;
  }
  return values.map(function (value) { return clamp(value, 0, 255); });
}

function formatRgb(rgb) {
  return rgb.join(",");
}

function getRgbDistance(sourceRgb, targetRgb) {
  var sr = sourceRgb[0], sg = sourceRgb[1], sb = sourceRgb[2];
  var tr = targetRgb[0], tg = targetRgb[1], tb = targetRgb[2];
  return Math.sqrt((sr - tr) * (sr - tr) + (sg - tg) * (sg - tg) + (sb - tb) * (sb - tb));
}

function matchNearestColor(sampleRgb, palette) {
  if (!palette.length) {
    return null;
  }
  var bestMatch = null;
  for (var i = 0; i < palette.length; i++) {
    var entry = palette[i];
    var distance = getRgbDistance(sampleRgb, entry.rgb);
    if (!bestMatch || distance < bestMatch.distance) {
      bestMatch = {
        code: entry.code,
        rgb: entry.rgb,
        distance: distance,
      };
    }
  }
  return bestMatch;
}

function getReadableTextColor(rgb) {
  var luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
  return luminance > 0.62 ? "#1e1712" : "#fff9f0";
}

// ============================================================
// state.js
// ============================================================
var initialState = {
  image: {
    element: null,
    width: 0,
    height: 0,
  },
  originalCanvas: null,
  crop: null,
  cropDisplay: null,
  cropConfirmed: false,
  gridSize: {
    width: 40,
    height: 40,
  },
  sampling: {
    insetRatio: 0.18,
    offsetXRatio: 0,
    offsetYRatio: 0,
  },
  showSamplingOverlay: true,
  palette: [],
  pickerMode: false,
  analysis: null,
  currentChunkIndex: 0,
  strategyType: "color-fill",
};

var _state = JSON.parse(JSON.stringify(initialState));
var _listeners = [];

function _notify() {
  for (var i = 0; i < _listeners.length; i++) {
    _listeners[i](_state);
  }
}

function getState() {
  return _state;
}

function setState(updater) {
  var nextState = typeof updater === "function" ? updater(_state) : updater;
  _state = nextState;
  _notify();
}

function patchState(partial) {
  _state = Object.assign({}, _state, partial);
  _notify();
}

function subscribe(listener) {
  _listeners.push(listener);
  return function () {
    var idx = _listeners.indexOf(listener);
    if (idx >= 0) _listeners.splice(idx, 1);
  };
}

function resetAnalysis() {
  _state = Object.assign({}, _state, {
    analysis: null,
    currentChunkIndex: 0,
  });
  _notify();
}

// ============================================================
// parser.js
// ============================================================
var SAMPLE_INSET_RATIO = 0.18;
var SAMPLE_BACKGROUND_OFFSETS = [
  [0.26, 0.26],
  [0.5, 0.22],
  [0.74, 0.26],
  [0.22, 0.5],
  [0.78, 0.5],
  [0.26, 0.74],
  [0.5, 0.78],
  [0.74, 0.74],
];

function getPixelFromImageData(imageData, width, x, y) {
  var px = clamp(Math.floor(x), 0, width - 1);
  var py = clamp(Math.floor(y), 0, imageData.height - 1);
  var index = (py * width + px) * 4;
  return [
    imageData.data[index],
    imageData.data[index + 1],
    imageData.data[index + 2],
  ];
}

function chunkCells(cells, gridWidth, gridHeight, chunkSize) {
  chunkSize = chunkSize || 5;
  var chunks = [];
  var chunkCols = Math.ceil(gridWidth / chunkSize);
  var chunkRows = Math.ceil(gridHeight / chunkSize);

  for (var chunkRow = 0; chunkRow < chunkRows; chunkRow++) {
    for (var chunkCol = 0; chunkCol < chunkCols; chunkCol++) {
      var startX = chunkCol * chunkSize + 1;
      var endX = Math.min(gridWidth, startX + chunkSize - 1);
      var startY = chunkRow * chunkSize + 1;
      var endY = Math.min(gridHeight, startY + chunkSize - 1);
      var chunkCellsList = [];

      for (var y = startY; y <= endY; y++) {
        for (var x = startX; x <= endX; x++) {
          chunkCellsList.push(cells[(y - 1) * gridWidth + (x - 1)]);
        }
      }

      chunks.push({
        index: chunks.length,
        chunkCol: chunkCol + 1,
        chunkRow: chunkRow + 1,
        startX: startX,
        endX: endX,
        startY: startY,
        endY: endY,
        width: endX - startX + 1,
        height: endY - startY + 1,
        cells: chunkCellsList,
      });
    }
  }

  return chunks;
}

function buildStats(cells) {
  var counts = new Map();
  for (var i = 0; i < cells.length; i++) {
    var code = cells[i].code;
    counts.set(code, (counts.get(code) || 0) + 1);
  }
  var result = [];
  counts.forEach(function (count, code) {
    result.push({ code: code, count: count });
  });
  result.sort(function (left, right) {
    return right.count - left.count || left.code.localeCompare(right.code);
  });
  return result;
}

function averageRgb(samples) {
  var total = [0, 0, 0];
  for (var i = 0; i < samples.length; i++) {
    total[0] += samples[i][0];
    total[1] += samples[i][1];
    total[2] += samples[i][2];
  }
  return [
    Math.round(total[0] / samples.length),
    Math.round(total[1] / samples.length),
    Math.round(total[2] / samples.length),
  ];
}

function buildBackgroundSamplePixels(imageData, imageWidth, cellStartX, cellStartY, cellWidth, cellHeight, sampling) {
  var insetRatio = clamp(
    Number.isFinite(sampling.insetRatio) ? sampling.insetRatio : SAMPLE_INSET_RATIO,
    0.08,
    0.35
  );
  var offsetXRatio = clamp(
    Number.isFinite(sampling.offsetXRatio) ? sampling.offsetXRatio : 0,
    -0.35,
    0.35
  );
  var offsetYRatio = clamp(
    Number.isFinite(sampling.offsetYRatio) ? sampling.offsetYRatio : 0,
    -0.35,
    0.35
  );
  var insetX = cellWidth * insetRatio;
  var insetY = cellHeight * insetRatio;
  var minX = cellStartX + insetX;
  var maxX = cellStartX + cellWidth - insetX;
  var minY = cellStartY + insetY;
  var maxY = cellStartY + cellHeight - insetY;
  var pixels = [];
  var points = [];

  for (var i = 0; i < SAMPLE_BACKGROUND_OFFSETS.length; i++) {
    var ratioX = SAMPLE_BACKGROUND_OFFSETS[i][0];
    var ratioY = SAMPLE_BACKGROUND_OFFSETS[i][1];
    var shiftedRatioX = clamp(ratioX + offsetXRatio, 0.1, 0.9);
    var shiftedRatioY = clamp(ratioY + offsetYRatio, 0.1, 0.9);
    var rawX = cellStartX + shiftedRatioX * cellWidth;
    var rawY = cellStartY + shiftedRatioY * cellHeight;
    var sampleX = clamp(rawX, minX, maxX);
    var sampleY = clamp(rawY, minY, maxY);
    pixels.push(getPixelFromImageData(imageData, imageWidth, sampleX, sampleY));
    points.push({ x: sampleX, y: sampleY });
  }

  return {
    pixels: pixels,
    points: points,
  };
}

function resolveCellColor(sampledPixels, palette) {
  if (!sampledPixels.length) {
    return {
      sampledRgb: [0, 0, 0],
      code: "UNSET",
      matchedRgb: [0, 0, 0],
      distance: null,
      confidence: 0,
    };
  }

  var sampledRgb = averageRgb(sampledPixels);
  if (!palette.length) {
    return {
      sampledRgb: sampledRgb,
      code: "UNSET",
      matchedRgb: sampledRgb,
      distance: null,
      confidence: 0,
    };
  }

  var votes = new Map();
  for (var i = 0; i < sampledPixels.length; i++) {
    var nearest = matchNearestColor(sampledPixels[i], palette);
    if (!nearest) {
      continue;
    }

    var existing = votes.get(nearest.code) || {
      code: nearest.code,
      rgb: nearest.rgb,
      count: 0,
      totalDistance: 0,
    };
    existing.count += 1;
    existing.totalDistance += nearest.distance;
    votes.set(nearest.code, existing);
  }

  var rankedVotes = [];
  votes.forEach(function (value) {
    rankedVotes.push(value);
  });
  rankedVotes.sort(function (left, right) {
    if (right.count !== left.count) {
      return right.count - left.count;
    }
    return left.totalDistance - right.totalDistance;
  });

  var winner = rankedVotes[0];
  if (!winner) {
    return {
      sampledRgb: sampledRgb,
      code: "UNSET",
      matchedRgb: sampledRgb,
      distance: null,
      confidence: 0,
    };
  }

  return {
    sampledRgb: sampledRgb,
    code: winner.code,
    matchedRgb: winner.rgb,
    distance: winner.totalDistance / winner.count,
    confidence: winner.count / sampledPixels.length,
  };
}

function analyzeGrid(opts) {
  var originalCanvas = opts.originalCanvas;
  var crop = opts.crop;
  var gridSize = opts.gridSize;
  var palette = opts.palette;
  var sampling = opts.sampling || {};

  var gridWidth = gridSize.width;
  var gridHeight = gridSize.height;
  var ctx = originalCanvas.getContext("2d", { willReadFrequently: true });
  var imageData = ctx.getImageData(0, 0, originalCanvas.width, originalCanvas.height);
  var cellWidth = crop.width / gridWidth;
  var cellHeight = crop.height / gridHeight;
  var cells = [];

  for (var row = 0; row < gridHeight; row++) {
    for (var col = 0; col < gridWidth; col++) {
      var cellStartX = crop.x + col * cellWidth;
      var cellStartY = crop.y + row * cellHeight;
      var centerX = crop.x + (col + 0.5) * cellWidth;
      var centerY = crop.y + (row + 0.5) * cellHeight;
      var samplePack = buildBackgroundSamplePixels(
        imageData,
        originalCanvas.width,
        cellStartX,
        cellStartY,
        cellWidth,
        cellHeight,
        sampling
      );
      var resolved = resolveCellColor(samplePack.pixels, palette);

      cells.push({
        x: col + 1,
        y: row + 1,
        centerX: centerX,
        centerY: centerY,
        sampledRgb: resolved.sampledRgb,
        code: resolved.code,
        matchedRgb: resolved.matchedRgb,
        distance: resolved.distance,
        confidence: resolved.confidence,
        samplePoints: samplePack.points,
      });
    }
  }

  var globalStats = buildStats(cells);
  var chunks = chunkCells(cells, gridWidth, gridHeight, 5);

  return {
    gridWidth: gridWidth,
    gridHeight: gridHeight,
    crop: crop,
    cellWidth: cellWidth,
    cellHeight: cellHeight,
    cells: cells,
    chunks: chunks,
    globalStats: globalStats,
    unmatchedCount: cells.filter(function (cell) { return cell.code === "UNSET"; }).length,
  };
}

// ============================================================
// smart-plan.js
// ============================================================
function getCurrentChunk(gridData) {
  if (!gridData || !gridData.chunks || !gridData.chunks.length) {
    return null;
  }
  return gridData.chunks[gridData.currentChunkIndex || 0] || gridData.chunks[0];
}

function generateSmartPlan(gridData, strategyType) {
  var currentChunk = getCurrentChunk(gridData);
  if (!currentChunk) {
    return {
      title: "等待区块数据",
      description: "先完成网格解析，系统才会生成当前 5x5 的拼搭建议。",
      highlights: [],
    };
  }

  if (strategyType === "edge-first") {
    var edgeHighlights = [];
    for (var i = 0; i < currentChunk.cells.length; i++) {
      var cell = currentChunk.cells[i];
      var localX = cell.x - currentChunk.startX + 1;
      var localY = cell.y - currentChunk.startY + 1;
      if (
        localX === 1 ||
        localY === 1 ||
        localX === currentChunk.width ||
        localY === currentChunk.height
      ) {
        edgeHighlights.push({ x: cell.x, y: cell.y });
      }
    }

    return {
      title: "策略 B：从边缘到中心",
      description: "建议先固定外围 " + edgeHighlights.length + " 颗边缘珠子，再补内部，能更快建立轮廓并减少看错位的概率。",
      highlights: edgeHighlights,
    };
  }

  var stats = buildStats(currentChunk.cells);
  var dominant = stats[0];
  var colorHighlights = [];
  for (var j = 0; j < currentChunk.cells.length; j++) {
    var c = currentChunk.cells[j];
    if (c.code === (dominant && dominant.code)) {
      colorHighlights.push({ x: c.x, y: c.y });
    }
  }

  return {
    title: "策略 A：按颜色填涂",
    description: dominant
      ? "当前区块里数量最多的是 " + dominant.code + "（共 " + dominant.count + " 颗），可以先把这组颜色一次性铺完。"
      : "当前区块没有可用颜色统计。",
    highlights: colorHighlights,
  };
}

// ============================================================
// 预置 Mard 221 色卡（从 palette-data.js 加载）
// ============================================================
(function initPalette() {
  var colors = window.PINDOU_COLORS;
  if (colors && colors.length) {
    for (var i = 0; i < colors.length; i++) {
      var entry = {
        code: colors[i].code,
        rgb: hexToRgb(colors[i].hex),
      };
      initialState.palette.push(entry);
      _state.palette.push(entry);
    }
    _notify();
  }
})();

function getMasterPalette() {
  var colors = window.PINDOU_COLORS || [];
  var result = [];
  for (var i = 0; i < colors.length; i++) {
    result.push({
      code: colors[i].code,
      rgb: hexToRgb(colors[i].hex),
    });
  }
  return result;
}

function extractPaletteCandidatesFromCanvas(sourceCanvas, options) {
  options = options || {};
  var ctx = sourceCanvas.getContext("2d", { willReadFrequently: true });
  var imageData = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  var masterPalette = getMasterPalette();
  var buckets = new Map();
  var step = Math.max(1, options.sampleStep || 4);

  for (var y = 0; y < sourceCanvas.height; y += step) {
    for (var x = 0; x < sourceCanvas.width; x += step) {
      var index = (y * sourceCanvas.width + x) * 4;
      var r = imageData.data[index];
      var g = imageData.data[index + 1];
      var b = imageData.data[index + 2];
      var a = imageData.data[index + 3];
      if (a < 200) {
        continue;
      }

      var brightness = (r + g + b) / 3;
      if (brightness > 248) {
        continue;
      }

      var key =
        Math.round(r / 12) + "|" +
        Math.round(g / 12) + "|" +
        Math.round(b / 12);

      var bucket = buckets.get(key) || {
        count: 0,
        sum: [0, 0, 0],
      };
      bucket.count += 1;
      bucket.sum[0] += r;
      bucket.sum[1] += g;
      bucket.sum[2] += b;
      buckets.set(key, bucket);
    }
  }

  var bucketList = [];
  buckets.forEach(function (bucket) {
    bucketList.push({
      count: bucket.count,
      rgb: [
        Math.round(bucket.sum[0] / bucket.count),
        Math.round(bucket.sum[1] / bucket.count),
        Math.round(bucket.sum[2] / bucket.count),
      ],
    });
  });
  bucketList.sort(function (left, right) {
    return right.count - left.count;
  });

  var deduped = [];
  var usedCodes = {};
  var limit = Math.min(bucketList.length, options.maxBuckets || 96);
  var minCount = options.minCount || Math.max(10, Math.floor(sourceCanvas.width * sourceCanvas.height / 6000));

  for (var i = 0; i < limit; i++) {
    var candidate = bucketList[i];
    if (candidate.count < minCount) {
      continue;
    }

    var nearest = matchNearestColor(candidate.rgb, masterPalette);
    if (!nearest || usedCodes[nearest.code]) {
      continue;
    }

    usedCodes[nearest.code] = true;
    deduped.push({
      code: nearest.code,
      rgb: candidate.rgb,
      standardRgb: nearest.rgb,
      count: candidate.count,
      distance: nearest.distance,
    });
  }

  deduped.sort(function (left, right) {
    return left.code.localeCompare(right.code);
  });
  return deduped;
}

function buildLegendProbeCanvas(originalCanvas) {
  var width = originalCanvas.width;
  var height = Math.floor(originalCanvas.height * 0.34);
  var startY = originalCanvas.height - height;
  var canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  var ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(originalCanvas, 0, startY, width, height, 0, 0, width, height);
  return canvas;
}

// ============================================================
// app entry point
// ============================================================
(function () {
  var imageInput = document.querySelector("#imageInput");
  var gridWidthInput = document.querySelector("#gridWidthInput");
  var gridHeightInput = document.querySelector("#gridHeightInput");
  var cropCanvas = document.querySelector("#cropCanvas");
  var applyCropBtn = document.querySelector("#applyCropBtn");
  var resetCropBtn = document.querySelector("#resetCropBtn");
  var imageStatus = document.querySelector("#imageStatus");
  var imageSizeText = document.querySelector("#imageSizeText");
  var cropInfoText = document.querySelector("#cropInfoText");
  var cellSizeText = document.querySelector("#cellSizeText");
  var paletteStatus = document.querySelector("#paletteStatus");
  var paletteCodeInput = document.querySelector("#paletteCodeInput");
  var paletteColorInput = document.querySelector("#paletteColorInput");
  var paletteRgbInput = document.querySelector("#paletteRgbInput");
  var addPaletteBtn = document.querySelector("#addPaletteBtn");
  var pickColorBtn = document.querySelector("#pickColorBtn");
  var paletteList = document.querySelector("#paletteList");
  var analyzeBtn = document.querySelector("#analyzeBtn");
  var downloadJsonBtn = document.querySelector("#downloadJsonBtn");
  var parseStatus = document.querySelector("#parseStatus");
  var analysisSummary = document.querySelector("#analysisSummary");
  var viewerCanvas = document.querySelector("#viewerCanvas");
  var strategySelect = document.querySelector("#strategySelect");
  var prevChunkBtn = document.querySelector("#prevChunkBtn");
  var nextChunkBtn = document.querySelector("#nextChunkBtn");
  var chunkLabel = document.querySelector("#chunkLabel");
  var chunkCoordLabel = document.querySelector("#chunkCoordLabel");
  var localStats = document.querySelector("#localStats");
  var globalStats = document.querySelector("#globalStats");
  var planPanel = document.querySelector("#planPanel");
  var step2Panel = document.querySelector("#tab-step2");
  var step3Panel = document.querySelector("#tab-step3");

  // Tab navigation
  var tabBtns = document.querySelectorAll(".tab-btn");
  var tabPanels = document.querySelectorAll(".tab-panel");
  var tabStep4Btn = document.querySelector('[data-tab="tab-step4"]');

  // Palette collapse / search
  var togglePaletteBtn = document.querySelector("#togglePaletteBtn");
  var togglePaletteIcon = document.querySelector("#togglePaletteIcon");
  var paletteSearchInput = document.querySelector("#paletteSearchInput");

  // Minimap
  var minimapCanvas = document.querySelector("#minimapCanvas");
  var minimapCtx = minimapCanvas.getContext("2d");

  var cropCtx = cropCanvas.getContext("2d");
  var viewerCtx = viewerCanvas.getContext("2d");

  var cropGesture = null;
  var viewerSwipeStart = null;
  var paletteImageInput = null;
  var extractLegendBtn = null;
  var uploadPaletteImageBtn = null;
  var sampleOverlayToggle = null;
  var sampleInsetInput = null;
  var sampleOffsetXInput = null;
  var sampleOffsetYInput = null;

  function injectEnhancementControls() {
    if (step2Panel && !document.querySelector("#paletteImageInput")) {
      var paletteToolWrap = document.createElement("div");
      paletteToolWrap.className = "summary-card";
      paletteToolWrap.innerHTML =
        '<h3>色卡图片识别</h3>' +
        '<p class="plan-text">可以直接识别原图底部用料清单，也可以单独上传一张所用颜色图。系统会按色块颜色匹配到最接近的 Mard 色号，并把该图片里的实际颜色作为匹配基准。</p>' +
        '<div class="button-row" style="margin-top:12px;">' +
        '<button id="extractLegendBtn" type="button">识别原图底部色卡</button>' +
        '<button id="uploadPaletteImageBtn" class="ghost-btn" type="button">上传颜色图片识别</button>' +
        '</div>' +
        '<input id="paletteImageInput" type="file" accept="image/*" style="display:none;" />' +
        '<div id="paletteExtractStatus" class="empty-text" style="margin-top:10px;">建议优先用底部用料清单，识别会更稳。</div>';
      step2Panel.appendChild(paletteToolWrap);
    }

    if (step3Panel && !document.querySelector("#sampleOverlayToggle")) {
      var sampleToolWrap = document.createElement("div");
      sampleToolWrap.className = "summary-card";
      sampleToolWrap.innerHTML =
        '<h3>采样点调校</h3>' +
        '<p class="plan-text">解析前可以调采样位置，解析后在裁剪预览里查看采样点是否踩到文字或网格线。</p>' +
        '<div class="field-grid" style="margin-top:12px;">' +
        '<label class="field"><span>内缩 %</span><input id="sampleInsetInput" type="number" min="8" max="35" step="1" value="18" inputmode="numeric" /></label>' +
        '<label class="field"><span>X 偏移 %</span><input id="sampleOffsetXInput" type="number" min="-35" max="35" step="1" value="0" inputmode="numeric" /></label>' +
        '<label class="field"><span>Y 偏移 %</span><input id="sampleOffsetYInput" type="number" min="-35" max="35" step="1" value="0" inputmode="numeric" /></label>' +
        '</div>' +
        '<div class="button-row" style="margin-top:12px;">' +
        '<button id="sampleOverlayToggle" class="ghost-btn" type="button">隐藏采样点</button>' +
        '</div>' +
        '<div id="sampleOverlayHint" class="empty-text" style="margin-top:10px;">确认裁剪并完成解析后，Step 1 里会直接画出采样点。</div>';
      var analyzeRow = analyzeBtn && analyzeBtn.parentElement;
      if (analyzeRow && analyzeRow.parentElement === step3Panel) {
        analyzeRow.insertAdjacentElement("afterend", sampleToolWrap);
      } else {
        step3Panel.appendChild(sampleToolWrap);
      }
    }

    paletteImageInput = document.querySelector("#paletteImageInput");
    extractLegendBtn = document.querySelector("#extractLegendBtn");
    uploadPaletteImageBtn = document.querySelector("#uploadPaletteImageBtn");
    sampleOverlayToggle = document.querySelector("#sampleOverlayToggle");
    sampleInsetInput = document.querySelector("#sampleInsetInput");
    sampleOffsetXInput = document.querySelector("#sampleOffsetXInput");
    sampleOffsetYInput = document.querySelector("#sampleOffsetYInput");
  }

  // ---- canvas helpers ----

  function ensureCanvasSize(canvas, width, height) {
    var dpr = window.devicePixelRatio || 1;
    canvas.width = Math.floor(width * dpr);
    canvas.height = Math.floor(height * dpr);
    canvas.style.height = height + "px";
    var ctx = canvas.getContext("2d");
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    return ctx;
  }

  function clampWithinImage(point, image) {
    return {
      x: Math.min(image.width, Math.max(0, point.x)),
      y: Math.min(image.height, Math.max(0, point.y)),
    };
  }

  function normalizeRect(start, end) {
    return {
      x: Math.min(start.x, end.x),
      y: Math.min(start.y, end.y),
      width: Math.abs(end.x - start.x),
      height: Math.abs(end.y - start.y),
    };
  }

  function getCropCanvasPoint(event, display) {
    var rect = cropCanvas.getBoundingClientRect();
    var localX = event.clientX - rect.left;
    var localY = event.clientY - rect.top;
    return clampWithinImage(
      {
        x: (localX - display.offsetX) / display.scale,
        y: (localY - display.offsetY) / display.scale,
      },
      getState().image,
    );
  }

  function getViewerPoint(event) {
    var rect = viewerCanvas.getBoundingClientRect();
    return {
      x: event.clientX - rect.left,
      y: event.clientY - rect.top,
    };
  }

  function createImageBitmapCanvas(image) {
    var canvas = document.createElement("canvas");
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    var ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(image, 0, 0);
    return canvas;
  }

  function buildCropDisplay(image) {
    var containerWidth = cropCanvas.clientWidth || cropCanvas.parentElement.clientWidth || 320;
    var safeWidth = Math.max(280, containerWidth);
    var scale = safeWidth / image.width;
    var height = Math.max(320, image.height * scale);
    ensureCanvasSize(cropCanvas, safeWidth, height);

    return {
      scale: scale,
      drawWidth: image.width * scale,
      drawHeight: image.height * scale,
      offsetX: 0,
      offsetY: 0,
    };
  }

  // ---- rendering ----

  function renderStatList(stats, emptyText) {
    if (!stats.length) {
      return '<p class="empty-text">' + emptyText + '</p>';
    }
    var html = '<div class="stat-list">';
    for (var i = 0; i < stats.length; i++) {
      var item = stats[i];
      html +=
        '<div class="stat-row">' +
        '<span><code>' + item.code + '</code></span>' +
        '<strong>' + item.count + ' 颗</strong>' +
        '</div>';
    }
    html += '</div>';
    return html;
  }

  function drawSamplingOverlayOnCrop(zx, zy, zoomScale) {
    var state = getState();
    var analysis = state.analysis;
    if (!analysis || !state.showSamplingOverlay) {
      return;
    }

    for (var i = 0; i < analysis.cells.length; i++) {
      var cell = analysis.cells[i];
      if (cell.confidence < 0.55) {
        var cellX = zx + (cell.x - 1) * analysis.cellWidth * zoomScale;
        var cellY = zy + (cell.y - 1) * analysis.cellHeight * zoomScale;
        var cellW = analysis.cellWidth * zoomScale;
        var cellH = analysis.cellHeight * zoomScale;
        cropCtx.strokeStyle = "rgba(231, 0, 47, 0.55)";
        cropCtx.lineWidth = 1.5;
        cropCtx.strokeRect(cellX + 1, cellY + 1, cellW - 2, cellH - 2);
      }

      if (!cell.samplePoints) {
        continue;
      }

      for (var j = 0; j < cell.samplePoints.length; j++) {
        var point = cell.samplePoints[j];
        var px = zx + (point.x - analysis.crop.x) * zoomScale;
        var py = zy + (point.y - analysis.crop.y) * zoomScale;
        cropCtx.beginPath();
        cropCtx.fillStyle = "rgba(44, 196, 198, 0.86)";
        cropCtx.arc(px, py, zoomScale > 5 ? 1.8 : 1.1, 0, Math.PI * 2);
        cropCtx.fill();
      }
    }
  }

  function drawCropCanvas() {
    var state = getState();
    var image = state.image;
    var crop = state.crop;
    var cropDisplay = state.cropDisplay;
    var pickerMode = state.pickerMode;
    var cropConfirmed = state.cropConfirmed;

    if (!image.element || !cropDisplay) {
      var w = cropCanvas.clientWidth || 320;
      ensureCanvasSize(cropCanvas, w, 320);
      cropCtx.clearRect(0, 0, w, 320);
      cropCtx.fillStyle = "#6f6257";
      cropCtx.font = "600 16px 'Segoe UI'";
      cropCtx.fillText("上传图纸后，这里会显示可拖拽裁剪区。", 18, 40);
      return;
    }

    var cw = cropCanvas.clientWidth;
    var ch = Math.max(320, cropDisplay.drawHeight);

    if (cropConfirmed) {
      // 已确认裁剪：只展示裁剪区域（放大铺满画布）
      ensureCanvasSize(cropCanvas, cw, ch);
      cropCtx.clearRect(0, 0, cw, ch);

      // Extract and zoom the cropped region
      var cropW = crop.width;
      var cropH = crop.height;
      var zoomScale = Math.min(cw / cropW, ch / cropH);
      var zw = cropW * zoomScale;
      var zh = cropH * zoomScale;
      var zx = (cw - zw) / 2;
      var zy = (ch - zh) / 2;

      cropCtx.fillStyle = "#fffdf8";
      cropCtx.fillRect(zx - 4, zy - 4, zw + 8, zh + 8);
      cropCtx.drawImage(
        image.element,
        crop.x, crop.y, crop.width, crop.height,
        zx, zy, zw, zh
      );

      // Draw grid overlay
      var gridW = state.gridSize.width;
      var gridH = state.gridSize.height;
      var cellW = zw / gridW;
      var cellH = zh / gridH;
      cropCtx.strokeStyle = "rgba(48,33,22,0.18)";
      cropCtx.lineWidth = 1;
      for (var gx = 0; gx <= gridW; gx++) {
        var px = zx + gx * cellW;
        cropCtx.beginPath();
        cropCtx.moveTo(px, zy);
        cropCtx.lineTo(px, zy + zh);
        cropCtx.stroke();
      }
      for (var gy = 0; gy <= gridH; gy++) {
        var py = zy + gy * cellH;
        cropCtx.beginPath();
        cropCtx.moveTo(zx, py);
        cropCtx.lineTo(zx + zw, py);
        cropCtx.stroke();
      }

      drawSamplingOverlayOnCrop(zx, zy, zoomScale);

      cropCtx.fillStyle = "#302116";
      cropCtx.font = "700 13px 'Segoe UI'";
      cropCtx.fillText(
        "裁剪结果 — " + gridW + "x" + gridH + " 网格，可去 Step 3 解析",
        zx + 8,
        Math.max(22, zy - 10)
      );
    } else {
      // 未确认：显示完整图片 + 暗色蒙版 + 裁剪亮框
      ensureCanvasSize(cropCanvas, cw, ch);
      cropCtx.clearRect(0, 0, cw, ch);
      cropCtx.drawImage(image.element, 0, 0, cropDisplay.drawWidth, cropDisplay.drawHeight);
      cropCtx.fillStyle = "rgba(40, 27, 19, 0.42)";
      cropCtx.fillRect(0, 0, cropDisplay.drawWidth, cropDisplay.drawHeight);

      if (!crop) {
        return;
      }

      var left = crop.x * cropDisplay.scale;
      var top = crop.y * cropDisplay.scale;
      var rw = crop.width * cropDisplay.scale;
      var rh = crop.height * cropDisplay.scale;

      cropCtx.clearRect(left, top, rw, rh);
      cropCtx.strokeStyle = pickerMode ? "#2f6c73" : "#f4c64f";
      cropCtx.lineWidth = 3;
      cropCtx.setLineDash(pickerMode ? [] : [6, 4]);
      cropCtx.strokeRect(left, top, rw, rh);
      cropCtx.setLineDash([]);
      cropCtx.fillStyle = pickerMode ? "rgba(47, 108, 115, 0.14)" : "rgba(244, 198, 79, 0.1)";
      cropCtx.fillRect(left, top, rw, rh);

      // Drag handles at corners
      var handleR = 6;
      var corners = [
        [left, top], [left + rw, top],
        [left, top + rh], [left + rw, top + rh]
      ];
      cropCtx.fillStyle = "#f4c64f";
      for (var ci = 0; ci < corners.length; ci++) {
        cropCtx.beginPath();
        cropCtx.arc(corners[ci][0], corners[ci][1], handleR, 0, Math.PI * 2);
        cropCtx.fill();
      }

      cropCtx.fillStyle = "#302116";
      cropCtx.font = "700 14px 'Segoe UI'";
      var labelText = pickerMode
        ? "取色模式：点击图片任意位置采样"
        : "裁剪区域 " + Math.round(crop.width) + " x " + Math.round(crop.height) + " px  —  拖拽后点击确认裁剪";
      cropCtx.fillText(labelText, left + 10, Math.max(18, top + 22));
    }
  }

  function renderPaletteList() {
    var palette = getState().palette;
    paletteStatus.textContent = palette.length + " 个色号";

    if (!palette.length) {
      paletteList.innerHTML = '<p class="empty-text">先录入几个色号，解析时会按最接近的 RGB 自动匹配。</p>';
      togglePaletteBtn.innerHTML = '<span id="togglePaletteIcon">▼</span> 展开色卡列表（0 色）';
      togglePaletteIcon = document.querySelector("#togglePaletteIcon");
      return;
    }

    var html = "";
    for (var i = 0; i < palette.length; i++) {
      var entry = palette[i];
      html +=
        '<div class="palette-item">' +
        '<div class="palette-item-main">' +
        '<span class="swatch" style="background:' + rgbToHex(entry.rgb) + '"></span>' +
        '<div>' +
        '<div><code>' + entry.code + '</code></div>' +
        '<small>' + formatRgb(entry.rgb) + '</small>' +
        '</div>' +
        '</div>' +
        '<button type="button" class="ghost-btn" data-remove-index="' + i + '">删除</button>' +
        '</div>';
    }
    paletteList.innerHTML = html;

    // Update toggle button text
    if (!_paletteExpanded) {
      togglePaletteBtn.innerHTML = '<span id="togglePaletteIcon">▼</span> 展开色卡列表（' + palette.length + ' 色）';
      togglePaletteIcon = document.querySelector("#togglePaletteIcon");
    }

    // Apply search filter if any
    if (_paletteExpanded && paletteSearchInput.value) {
      filterPalette();
    }
  }

  function renderSummary() {
    var state = getState();
    var image = state.image;
    var crop = state.crop;
    var gridSize = state.gridSize;
    var analysis = state.analysis;
    var currentChunkIndex = state.currentChunkIndex;
    var strategyType = state.strategyType;

    imageStatus.textContent = image.element ? "图片已加载" : "未加载图片";
    imageSizeText.textContent = image.width && image.height ? image.width + " x " + image.height : "-";

    // Update pick color button
    if (state.pickerMode) {
      pickColorBtn.textContent = "退出取色模式";
      pickColorBtn.style.background = "#2f6c73";
      pickColorBtn.style.color = "#fff";
    } else {
      pickColorBtn.textContent = "从图片取色";
      pickColorBtn.style.background = "";
      pickColorBtn.style.color = "";
    }

    parseStatus.textContent = analysis ? "解析完成" : "等待解析";

    if (sampleOverlayToggle) {
      sampleOverlayToggle.textContent = state.showSamplingOverlay ? "隐藏采样点" : "显示采样点";
    }
    if (sampleInsetInput && document.activeElement !== sampleInsetInput) {
      sampleInsetInput.value = Math.round((state.sampling.insetRatio || 0.18) * 100);
    }
    if (sampleOffsetXInput && document.activeElement !== sampleOffsetXInput) {
      sampleOffsetXInput.value = Math.round((state.sampling.offsetXRatio || 0) * 100);
    }
    if (sampleOffsetYInput && document.activeElement !== sampleOffsetYInput) {
      sampleOffsetYInput.value = Math.round((state.sampling.offsetYRatio || 0) * 100);
    }

    // Analyze button: enabled only when all prerequisites are met
    var canAnalyze = image.element && crop && state.palette.length > 0;
    analyzeBtn.disabled = !canAnalyze;

    // Show why analyze is disabled
    if (!canAnalyze && image.element) {
      if (!crop) {
        analyzeBtn.title = "请先在 Step 1 中确认裁剪区域";
      } else if (!state.palette.length) {
        analyzeBtn.title = "请先在 Step 2 中录入至少一个色号";
      }
    } else {
      analyzeBtn.title = "";
    }

    downloadJsonBtn.disabled = !analysis;
    prevChunkBtn.disabled = !analysis || currentChunkIndex <= 0;
    nextChunkBtn.disabled = !analysis || currentChunkIndex >= ((analysis && analysis.chunks.length) || 1) - 1;

    // Enable/disable Step 4 tab
    if (tabStep4Btn) {
      tabStep4Btn.disabled = !analysis;
    }

    if (crop) {
      cropInfoText.textContent = "x:" + crop.x.toFixed(1) + " y:" + crop.y.toFixed(1) + " / " + crop.width.toFixed(1) + " x " + crop.height.toFixed(1);
      cellSizeText.textContent = (crop.width / gridSize.width).toFixed(2) + " x " + (crop.height / gridSize.height).toFixed(2) + " px";
    } else {
      cropInfoText.textContent = "-";
      cellSizeText.textContent = "-";
    }

    if (!analysis) {
      analysisSummary.className = "summary-card empty";
      if (!state.palette.length) {
        analysisSummary.innerHTML =
          '<p style="color:#c13d3d;">请先在 Step 2 中录入色卡，然后再点击解析。</p>' +
          '<p style="margin-top:8px;">录入色号如 H07、H18 等，颜色可从图纸色卡区域用取色器拾取。</p>';
      } else {
        analysisSummary.textContent = "一切就绪！点击「解析整张网格」开始分析。";
      }
      chunkLabel.textContent = "-";
      chunkCoordLabel.textContent = "-";
      localStats.innerHTML = '<p class="empty-text">暂无区块统计。</p>';
      globalStats.innerHTML = '<p class="empty-text">暂无全局统计。</p>';
      planPanel.innerHTML = '<p class="empty-text">暂无智能建议。</p>';
      return;
    }

    var chunk = analysis.chunks[currentChunkIndex];
    var plan = generateSmartPlan(Object.assign({}, analysis, { currentChunkIndex: currentChunkIndex }), strategyType);
    var localColorStats = buildStats(chunk.cells);

    analysisSummary.className = "summary-card";
    analysisSummary.innerHTML =
      '<h3>解析概况</h3>' +
      '<p>全图共 <strong>' + (analysis.gridWidth * analysis.gridHeight) + '</strong> 格，拆成 <strong>' + analysis.chunks.length + '</strong> 个 5x5 区块。当前策略为 <span class="mini-code">' + plan.title + '</span>。</p>' +
      (analysis.unmatchedCount > 0
        ? '<p class="alert">有 ' + analysis.unmatchedCount + ' 个格子未匹配到色卡，显示为原始采样色。</p>'
        : '');
    chunkLabel.textContent = "区块 " + (currentChunkIndex + 1) + " / " + analysis.chunks.length;
    chunkCoordLabel.textContent = "(" + chunk.startX + "," + chunk.startY + ") → (" + chunk.endX + "," + chunk.endY + ")";
    localStats.innerHTML = renderStatList(localColorStats, "当前区块尚未识别到颜色。");
    globalStats.innerHTML = renderStatList(analysis.globalStats, "暂无全局统计。");
    planPanel.innerHTML = '<h3>' + plan.title + '</h3><p class="plan-text">' + plan.description + '</p>';
  }

  function drawViewer() {
    var state = getState();
    var analysis = state.analysis;
    var currentChunkIndex = state.currentChunkIndex;
    var strategyType = state.strategyType;
    var width = viewerCanvas.clientWidth || 320;
    var height = Math.max(320, width);
    ensureCanvasSize(viewerCanvas, width, height);
    viewerCtx.clearRect(0, 0, width, height);
    viewerCtx.imageSmoothingEnabled = false;

    if (!analysis) {
      viewerCtx.fillStyle = "#6f6257";
      viewerCtx.font = "600 16px 'Segoe UI'";
      viewerCtx.fillText("完成解析后，这里会显示放大的 5x5 区块。", 18, 40);
      return;
    }

    var chunk = analysis.chunks[currentChunkIndex];
    var plan = generateSmartPlan(Object.assign({}, analysis, { currentChunkIndex: currentChunkIndex }), strategyType);
    var padding = 20;
    var cellSize = Math.floor((Math.min(width, height) - padding * 2) / Math.max(chunk.width, chunk.height));
    var gridWidth = chunk.width * cellSize;
    var gridHeight = chunk.height * cellSize;
    var offsetX = Math.floor((width - gridWidth) / 2);
    var offsetY = Math.floor((height - gridHeight) / 2);

    viewerCtx.fillStyle = "#fffdf8";
    viewerCtx.fillRect(offsetX - 6, offsetY - 6, gridWidth + 12, gridHeight + 12);

    for (var i = 0; i < chunk.cells.length; i++) {
      var cell = chunk.cells[i];
      var localCol = cell.x - chunk.startX;
      var localRow = cell.y - chunk.startY;
      var x = offsetX + localCol * cellSize;
      var y = offsetY + localRow * cellSize;

      viewerCtx.fillStyle = rgbToHex(cell.matchedRgb);
      viewerCtx.fillRect(x, y, cellSize, cellSize);
      viewerCtx.strokeStyle = "rgba(54, 39, 29, 0.2)";
      viewerCtx.lineWidth = 1;
      viewerCtx.strokeRect(x, y, cellSize, cellSize);

      // Show code only if cell is large enough
      if (cellSize >= 24) {
        viewerCtx.fillStyle = getReadableTextColor(cell.matchedRgb);
        viewerCtx.font = "700 " + Math.max(12, Math.floor(cellSize * 0.22)) + "px 'Segoe UI'";
        viewerCtx.textAlign = "center";
        viewerCtx.textBaseline = "middle";
        viewerCtx.fillText(cell.code, x + cellSize / 2, y + cellSize / 2);
      }
    }

    for (var j = 0; j < plan.highlights.length; j++) {
      var highlight = plan.highlights[j];
      var hlLocalCol = highlight.x - chunk.startX;
      var hlLocalRow = highlight.y - chunk.startY;
      var hx = offsetX + hlLocalCol * cellSize;
      var hy = offsetY + hlLocalRow * cellSize;

      viewerCtx.strokeStyle = strategyType === "edge-first" ? "#2f6c73" : "#f4c64f";
      viewerCtx.lineWidth = 4;
      viewerCtx.strokeRect(hx + 2, hy + 2, cellSize - 4, cellSize - 4);
    }
  }

  function rerender() {
    drawCropCanvas();
    renderPaletteList();
    renderSummary();
    drawViewer();
    drawMinimap();
  }

  // ---- tab switching ----

  function switchTab(tabId) {
    for (var t = 0; t < tabBtns.length; t++) {
      var btn = tabBtns[t];
      if (btn.getAttribute("data-tab") === tabId) {
        btn.classList.add("active");
      } else {
        btn.classList.remove("active");
      }
    }
    for (var p = 0; p < tabPanels.length; p++) {
      var panel = tabPanels[p];
      if (panel.id === tabId) {
        panel.classList.add("active");
      } else {
        panel.classList.remove("active");
      }
    }
    // Re-render to fix canvas sizes in newly visible panels
    setTimeout(function () {
      var state = getState();
      if (state.image.element) {
        var display = buildCropDisplay({
          width: state.image.width,
          height: state.image.height,
        });
        patchState({ cropDisplay: display });
      } else {
        rerender();
      }
    }, 50);
  }

  // ---- palette toggle & search ----

  var _paletteExpanded = false;

  function togglePalette() {
    _paletteExpanded = !_paletteExpanded;
    if (_paletteExpanded) {
      paletteList.style.display = "grid";
      paletteSearchInput.style.display = "block";
      togglePaletteIcon.textContent = "▲";
      togglePaletteBtn.innerHTML = '<span id="togglePaletteIcon">▲</span> 收起色卡列表';
      // Re-bind icon element
      togglePaletteIcon = document.querySelector("#togglePaletteIcon");
    } else {
      paletteList.style.display = "none";
      paletteSearchInput.style.display = "none";
      togglePaletteIcon.textContent = "▼";
      togglePaletteBtn.innerHTML = '<span id="togglePaletteIcon">▼</span> 展开色卡列表（' + getState().palette.length + ' 色）';
      togglePaletteIcon = document.querySelector("#togglePaletteIcon");
      paletteSearchInput.value = "";
    }
  }

  function filterPalette() {
    var query = paletteSearchInput.value.trim().toUpperCase();
    var items = paletteList.querySelectorAll(".palette-item");
    for (var i = 0; i < items.length; i++) {
      var codeEl = items[i].querySelector("code");
      var code = codeEl ? codeEl.textContent : "";
      if (!query || code.indexOf(query) !== -1) {
        items[i].style.display = "flex";
      } else {
        items[i].style.display = "none";
      }
    }
  }

  // ---- minimap ----

  function drawMinimap() {
    var state = getState();
    var analysis = state.analysis;
    var currentChunkIndex = state.currentChunkIndex;

    var mw = minimapCanvas.clientWidth || 120;
    var mh = Math.max(mw, 120);
    var dpr = window.devicePixelRatio || 1;
    minimapCanvas.width = Math.floor(mw * dpr);
    minimapCanvas.height = Math.floor(mh * dpr);
    minimapCanvas.style.height = mh + "px";
    minimapCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    minimapCtx.clearRect(0, 0, mw, mh);

    if (!analysis) {
      minimapCtx.fillStyle = "#6f6257";
      minimapCtx.font = "600 12px 'Segoe UI'";
      minimapCtx.fillText("完成解析后显示缩略图", 10, 30);
      return;
    }

    var gridW = analysis.gridWidth;
    var gridH = analysis.gridHeight;
    var cellW = mw / gridW;
    var cellH = mh / gridH;
    var cellSize = Math.min(cellW, cellH);
    var offsetX = (mw - gridW * cellSize) / 2;
    var offsetY = (mh - gridH * cellSize) / 2;

    minimapCtx.imageSmoothingEnabled = false;

    // Draw all cells
    for (var i = 0; i < analysis.cells.length; i++) {
      var cell = analysis.cells[i];
      var col = cell.x - 1;
      var row = cell.y - 1;
      var x = offsetX + col * cellSize;
      var y = offsetY + row * cellSize;

      minimapCtx.fillStyle = rgbToHex(cell.matchedRgb);
      minimapCtx.fillRect(x, y, cellSize, cellSize);
    }

    // Highlight current chunk
    var chunk = analysis.chunks[currentChunkIndex];
    var cx = offsetX + (chunk.startX - 1) * cellSize;
    var cy = offsetY + (chunk.startY - 1) * cellSize;
    var cw = chunk.width * cellSize;
    var ch = chunk.height * cellSize;

    minimapCtx.strokeStyle = "#e7002f";
    minimapCtx.lineWidth = 2.5;
    minimapCtx.strokeRect(cx - 1, cy - 1, cw + 2, ch + 2);
    minimapCtx.strokeStyle = "#fff";
    minimapCtx.lineWidth = 1;
    minimapCtx.strokeRect(cx + 1, cy + 1, cw - 2, ch - 2);

    // Chunk number label
    minimapCtx.fillStyle = "#fff";
    minimapCtx.font = "700 10px 'Segoe UI'";
    minimapCtx.textAlign = "center";
    minimapCtx.textBaseline = "middle";
    var labelW = Math.min(40, cw - 4);
    var labelH = Math.min(18, ch - 4);
    if (labelW > 16 && labelH > 10) {
      minimapCtx.fillStyle = "rgba(0,0,0,0.6)";
      var lx = cx + cw / 2 - labelW / 2;
      var ly = cy + ch / 2 - labelH / 2;
      minimapCtx.fillRect(lx, ly, labelW, labelH);
      minimapCtx.fillStyle = "#fff";
      minimapCtx.fillText((currentChunkIndex + 1) + "/" + analysis.chunks.length, cx + cw / 2, cy + ch / 2);
    }
  }

  function handleMinimapClick(event) {
    var state = getState();
    var analysis = state.analysis;
    if (!analysis) return;

    var rect = minimapCanvas.getBoundingClientRect();
    var mx = event.clientX - rect.left;
    var my = event.clientY - rect.top;

    var mw = minimapCanvas.clientWidth || 120;
    var mh = Math.max(mw, 120);
    var gridW = analysis.gridWidth;
    var gridH = analysis.gridHeight;
    var cellSize = Math.min(mw / gridW, mh / gridH);
    var offsetX = (mw - gridW * cellSize) / 2;
    var offsetY = (mh - gridH * cellSize) / 2;

    // Find which chunk was clicked
    for (var i = 0; i < analysis.chunks.length; i++) {
      var chunk = analysis.chunks[i];
      var cx = offsetX + (chunk.startX - 1) * cellSize;
      var cy = offsetY + (chunk.startY - 1) * cellSize;
      var cw = chunk.width * cellSize;
      var ch = chunk.height * cellSize;

      if (mx >= cx && mx <= cx + cw && my >= cy && my <= cy + ch) {
        patchState({ currentChunkIndex: i });
        return;
      }
    }
  }

  // ---- actions ----

  function setExtractionStatus(message, isError) {
    var statusEl = document.querySelector("#paletteExtractStatus");
    if (!statusEl) {
      return;
    }
    statusEl.textContent = message;
    statusEl.style.color = isError ? "#c13d3d" : "#745f4b";
  }

  function mergePaletteEntries(entries) {
    var paletteMap = {};
    var current = getState().palette.slice();
    for (var i = 0; i < current.length; i++) {
      paletteMap[current[i].code] = current[i];
    }
    for (var j = 0; j < entries.length; j++) {
      paletteMap[entries[j].code] = {
        code: entries[j].code,
        rgb: entries[j].rgb,
        standardRgb: entries[j].standardRgb || entries[j].rgb,
      };
    }

    var merged = [];
    for (var code in paletteMap) {
      if (Object.prototype.hasOwnProperty.call(paletteMap, code)) {
        merged.push(paletteMap[code]);
      }
    }
    merged.sort(function (left, right) {
      return left.code.localeCompare(right.code);
    });
    patchState({ palette: merged });
    resetAnalysis();
  }

  function extractPaletteFromLegendArea() {
    var state = getState();
    if (!state.originalCanvas) {
      setExtractionStatus("请先上传原图，再识别底部色卡。", true);
      return;
    }

    var legendCanvas = buildLegendProbeCanvas(state.originalCanvas);
    var extracted = extractPaletteCandidatesFromCanvas(legendCanvas, {
      sampleStep: 5,
      maxBuckets: 120,
    });

    if (!extracted.length) {
      setExtractionStatus("没有从底部色卡里识别到可用颜色，请尝试单独上传颜色图片。", true);
      return;
    }

    mergePaletteEntries(extracted);
    setExtractionStatus("已从原图底部色卡提取 " + extracted.length + " 个颜色。");
  }

  function extractPaletteFromUploadedImage(file) {
    if (!file) {
      return;
    }

    var objectUrl = URL.createObjectURL(file);
    var img = new Image();
    img.onload = function () {
      URL.revokeObjectURL(objectUrl);
      var canvas = document.createElement("canvas");
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      var ctx = canvas.getContext("2d", { willReadFrequently: true });
      ctx.drawImage(img, 0, 0);
      var extracted = extractPaletteCandidatesFromCanvas(canvas, {
        sampleStep: 4,
        maxBuckets: 140,
      });

      if (!extracted.length) {
        setExtractionStatus("上传的颜色图片里没有识别到足够明显的色块。", true);
        return;
      }

      mergePaletteEntries(extracted);
      setExtractionStatus("已从上传图片识别 " + extracted.length + " 个颜色。");
    };
    img.onerror = function () {
      URL.revokeObjectURL(objectUrl);
      setExtractionStatus("颜色图片加载失败，请换一张更清晰的图片。", true);
    };
    img.src = objectUrl;
  }

  function updateSamplingFromInputs() {
    if (!sampleInsetInput || !sampleOffsetXInput || !sampleOffsetYInput) {
      return;
    }

    patchState({
      sampling: {
        insetRatio: clamp((parseFloat(sampleInsetInput.value) || 18) / 100, 0.08, 0.35),
        offsetXRatio: clamp((parseFloat(sampleOffsetXInput.value) || 0) / 100, -0.35, 0.35),
        offsetYRatio: clamp((parseFloat(sampleOffsetYInput.value) || 0) / 100, -0.35, 0.35),
      },
    });
    resetAnalysis();
  }

  function setGridSize() {
    patchState({
      gridSize: {
        width: Math.max(1, parseInt(gridWidthInput.value, 10) || 1),
        height: Math.max(1, parseInt(gridHeightInput.value, 10) || 1),
      },
    });
    resetAnalysis();
  }

  function handleImageUpload(event) {
    var file = event.target.files ? event.target.files[0] : null;
    if (!file) {
      return;
    }

    var objectUrl = URL.createObjectURL(file);
    var img = new Image();

    img.onload = function () {
      URL.revokeObjectURL(objectUrl);

      // 延迟一帧确保 DOM 布局完成后再读取 clientWidth
      requestAnimationFrame(function () {
        var display = buildCropDisplay({
          width: img.naturalWidth,
          height: img.naturalHeight,
        });

        setState(function (state) {
          return Object.assign({}, state, {
            image: {
              element: img,
              width: img.naturalWidth,
              height: img.naturalHeight,
            },
            originalCanvas: createImageBitmapCanvas(img),
            cropDisplay: display,
            crop: {
              x: 0,
              y: 0,
              width: img.naturalWidth,
              height: img.naturalHeight,
            },
            cropConfirmed: false,
            analysis: null,
            currentChunkIndex: 0,
            pickerMode: false,
          });
        });
      });
    };

    img.onerror = function () {
      URL.revokeObjectURL(objectUrl);
      window.alert("图片加载失败，请检查文件格式是否被浏览器支持（推荐 PNG / JPG）。");
    };

    img.src = objectUrl;
  }

  function applyCrop() {
    var state = getState();
    if (!state.crop || !state.image.element) {
      return;
    }

    patchState({ cropConfirmed: true });
    resetAnalysis();
  }

  function resetCropToFullImage() {
    var state = getState();
    if (!state.image.width || !state.image.height) {
      return;
    }

    patchState({
      crop: {
        x: 0,
        y: 0,
        width: state.image.width,
        height: state.image.height,
      },
      cropConfirmed: false,
    });
    resetAnalysis();
  }

  function addPaletteEntry() {
    var code = paletteCodeInput.value.trim().toUpperCase();
    var rgb = parseRgbText(paletteRgbInput.value) || hexToRgb(paletteColorInput.value);

    if (!code) {
      window.alert("请先输入色号，例如 H07。");
      return;
    }

    var newPalette = getState().palette.filter(function (item) { return item.code !== code; });
    newPalette.push({ code: code, rgb: rgb });

    patchState({
      palette: newPalette,
    });

    paletteCodeInput.value = "";
    resetAnalysis();
  }

  function sampleColorAtPoint(point) {
    var state = getState();
    if (!state.originalCanvas) {
      return;
    }

    var ctx = state.originalCanvas.getContext("2d", { willReadFrequently: true });
    var pixel = ctx.getImageData(Math.floor(point.x), Math.floor(point.y), 1, 1).data;
    var rgb = [pixel[0], pixel[1], pixel[2]];
    paletteColorInput.value = rgbToHex(rgb);
    paletteRgbInput.value = formatRgb(rgb);

    // 持续取色模式：不退出，方便连续采样
  }

  function togglePickerMode() {
    var state = getState();
    var newMode = !state.pickerMode;
    patchState({ pickerMode: newMode });

    if (newMode) {
      cropCanvas.classList.add("picker-active");
    } else {
      cropCanvas.classList.remove("picker-active");
    }
  }

  // ---- pointer events ----

  function handleCropPointerDown(event) {
    var state = getState();
    if (!state.image.element || !state.cropDisplay) {
      return;
    }

    var point = getCropCanvasPoint(event, state.cropDisplay);

    if (state.pickerMode) {
      sampleColorAtPoint(point);
      rerender();
      return;
    }

    // 如果已确认裁剪，重新拖拽时自动回到编辑模式
    if (state.cropConfirmed) {
      patchState({ cropConfirmed: false });
    }

    cropGesture = {
      start: point,
      active: true,
    };
    cropCanvas.setPointerCapture(event.pointerId);
    patchState({ crop: { x: point.x, y: point.y, width: 1, height: 1 } });
  }

  function handleCropPointerMove(event) {
    if (!cropGesture || !cropGesture.active) {
      return;
    }

    var state = getState();
    if (!state.cropDisplay) {
      return;
    }

    var point = getCropCanvasPoint(event, state.cropDisplay);
    var rect = normalizeRect(cropGesture.start, point);
    patchState({
      crop: Object.assign({}, rect, {
        width: Math.max(1, rect.width),
        height: Math.max(1, rect.height),
      }),
    });
    resetAnalysis();
  }

  function handleCropPointerUp(event) {
    if (!cropGesture || !cropGesture.active) {
      return;
    }
    cropGesture.active = false;
    cropCanvas.releasePointerCapture(event.pointerId);
  }

  function handleAnalyze() {
    var state = getState();
    if (!state.originalCanvas || !state.crop || !state.palette.length) {
      return;
    }

    patchState({
      analysis: analyzeGrid({
        originalCanvas: state.originalCanvas,
        crop: state.crop,
        gridSize: state.gridSize,
        palette: state.palette,
        sampling: state.sampling,
      }),
      currentChunkIndex: 0,
    });
  }

  function moveChunk(step) {
    var state = getState();
    if (!state.analysis) {
      return;
    }

    var nextIndex = Math.min(
      state.analysis.chunks.length - 1,
      Math.max(0, state.currentChunkIndex + step),
    );
    patchState({ currentChunkIndex: nextIndex });
  }

  function handleViewerPointerDown(event) {
    if (!getState().analysis) {
      return;
    }
    viewerSwipeStart = getViewerPoint(event);
  }

  function handleViewerPointerUp(event) {
    if (!viewerSwipeStart) {
      return;
    }

    var endPoint = getViewerPoint(event);
    var deltaX = endPoint.x - viewerSwipeStart.x;
    var deltaY = endPoint.y - viewerSwipeStart.y;
    viewerSwipeStart = null;

    if (Math.abs(deltaX) > 48 && Math.abs(deltaY) < 36) {
      moveChunk(deltaX < 0 ? 1 : -1);
    }
  }

  function downloadAnalysisJson() {
    var analysis = getState().analysis;
    if (!analysis) {
      return;
    }

    var payload = {
      gridWidth: analysis.gridWidth,
      gridHeight: analysis.gridHeight,
      crop: analysis.crop,
      cellWidth: analysis.cellWidth,
      cellHeight: analysis.cellHeight,
      globalStats: analysis.globalStats,
      chunks: analysis.chunks,
      cells: analysis.cells,
    };

    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var link = document.createElement("a");
    link.href = url;
    link.download = "perler-grid-analysis.json";
    link.click();
    URL.revokeObjectURL(url);
  }

  // ---- bind events ----

  function bindEvents() {
    // Tab navigation
    for (var t = 0; t < tabBtns.length; t++) {
      tabBtns[t].addEventListener("click", function (event) {
        var tabId = event.currentTarget.getAttribute("data-tab");
        if (!event.currentTarget.disabled) {
          switchTab(tabId);
        }
      });
    }

    imageInput.addEventListener("change", handleImageUpload);
    gridWidthInput.addEventListener("input", setGridSize);
    gridHeightInput.addEventListener("input", setGridSize);

    applyCropBtn.addEventListener("click", applyCrop);
    resetCropBtn.addEventListener("click", resetCropToFullImage);

    paletteColorInput.addEventListener("input", function () {
      paletteRgbInput.value = formatRgb(hexToRgb(paletteColorInput.value));
    });
    paletteRgbInput.value = formatRgb(hexToRgb(paletteColorInput.value));

    addPaletteBtn.addEventListener("click", addPaletteEntry);
    pickColorBtn.addEventListener("click", togglePickerMode);

    // Palette collapse & search
    togglePaletteBtn.addEventListener("click", togglePalette);
    paletteSearchInput.addEventListener("input", filterPalette);
    if (extractLegendBtn) {
      extractLegendBtn.addEventListener("click", extractPaletteFromLegendArea);
    }
    if (uploadPaletteImageBtn && paletteImageInput) {
      uploadPaletteImageBtn.addEventListener("click", function () {
        paletteImageInput.click();
      });
      paletteImageInput.addEventListener("change", function (event) {
        var file = event.target.files ? event.target.files[0] : null;
        extractPaletteFromUploadedImage(file);
        event.target.value = "";
      });
    }

    paletteList.addEventListener("click", function (event) {
      var button = event.target.closest("[data-remove-index]");
      if (!button) {
        return;
      }
      var index = parseInt(button.dataset.removeIndex, 10);
      var newPalette = getState().palette.filter(function (_, itemIndex) { return itemIndex !== index; });
      patchState({ palette: newPalette });
      resetAnalysis();
    });

    analyzeBtn.addEventListener("click", function () {
      handleAnalyze();
      // Auto-switch to Step 4 tab after analysis
      if (getState().analysis && tabStep4Btn && !tabStep4Btn.disabled) {
        switchTab("tab-step4");
      }
    });
    downloadJsonBtn.addEventListener("click", downloadAnalysisJson);

    strategySelect.addEventListener("change", function () {
      patchState({ strategyType: strategySelect.value });
    });

    if (sampleOverlayToggle) {
      sampleOverlayToggle.addEventListener("click", function () {
        patchState({ showSamplingOverlay: !getState().showSamplingOverlay });
      });
    }
    if (sampleInsetInput) {
      sampleInsetInput.addEventListener("input", updateSamplingFromInputs);
    }
    if (sampleOffsetXInput) {
      sampleOffsetXInput.addEventListener("input", updateSamplingFromInputs);
    }
    if (sampleOffsetYInput) {
      sampleOffsetYInput.addEventListener("input", updateSamplingFromInputs);
    }

    prevChunkBtn.addEventListener("click", function () { moveChunk(-1); });
    nextChunkBtn.addEventListener("click", function () { moveChunk(1); });

    cropCanvas.addEventListener("pointerdown", handleCropPointerDown);
    cropCanvas.addEventListener("pointermove", handleCropPointerMove);
    cropCanvas.addEventListener("pointerup", handleCropPointerUp);
    cropCanvas.addEventListener("pointercancel", handleCropPointerUp);

    viewerCanvas.addEventListener("pointerdown", handleViewerPointerDown);
    viewerCanvas.addEventListener("pointerup", handleViewerPointerUp);

    // Minimap click
    minimapCanvas.addEventListener("click", handleMinimapClick);

    window.addEventListener("resize", function () {
      var state = getState();
      if (!state.image.element) {
        rerender();
        return;
      }
      patchState({
        cropDisplay: buildCropDisplay({
          width: state.image.width,
          height: state.image.height,
        }),
      });
    });
  }

  subscribe(rerender);
  injectEnhancementControls();
  bindEvents();
  rerender();
})();
