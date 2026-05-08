import { formatRgb, getReadableTextColor, hexToRgb, parseRgbText, rgbToHex } from "./color.js";
import { analyzeGrid, buildStats } from "./parser.js";
import { generateSmartPlan } from "./smart-plan.js";
import { getState, patchState, resetAnalysis, setState, subscribe } from "./state.js";

const imageInput = document.querySelector("#imageInput");
const gridWidthInput = document.querySelector("#gridWidthInput");
const gridHeightInput = document.querySelector("#gridHeightInput");
const cropCanvas = document.querySelector("#cropCanvas");
const resetCropBtn = document.querySelector("#resetCropBtn");
const imageStatus = document.querySelector("#imageStatus");
const imageSizeText = document.querySelector("#imageSizeText");
const cropInfoText = document.querySelector("#cropInfoText");
const cellSizeText = document.querySelector("#cellSizeText");
const paletteStatus = document.querySelector("#paletteStatus");
const paletteCodeInput = document.querySelector("#paletteCodeInput");
const paletteColorInput = document.querySelector("#paletteColorInput");
const paletteRgbInput = document.querySelector("#paletteRgbInput");
const addPaletteBtn = document.querySelector("#addPaletteBtn");
const pickColorBtn = document.querySelector("#pickColorBtn");
const paletteList = document.querySelector("#paletteList");
const analyzeBtn = document.querySelector("#analyzeBtn");
const downloadJsonBtn = document.querySelector("#downloadJsonBtn");
const parseStatus = document.querySelector("#parseStatus");
const analysisSummary = document.querySelector("#analysisSummary");
const viewerCanvas = document.querySelector("#viewerCanvas");
const strategySelect = document.querySelector("#strategySelect");
const prevChunkBtn = document.querySelector("#prevChunkBtn");
const nextChunkBtn = document.querySelector("#nextChunkBtn");
const chunkLabel = document.querySelector("#chunkLabel");
const chunkCoordLabel = document.querySelector("#chunkCoordLabel");
const localStats = document.querySelector("#localStats");
const globalStats = document.querySelector("#globalStats");
const planPanel = document.querySelector("#planPanel");

const cropCtx = cropCanvas.getContext("2d");
const viewerCtx = viewerCanvas.getContext("2d");

let cropGesture = null;
let viewerSwipeStart = null;

function ensureCanvasSize(canvas, width, height) {
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.height = `${height}px`;
  const ctx = canvas.getContext("2d");
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

function getCanvasEventPoint(event, display) {
  const rect = cropCanvas.getBoundingClientRect();
  const localX = event.clientX - rect.left;
  const localY = event.clientY - rect.top;
  return clampWithinImage(
    {
      x: (localX - display.offsetX) / display.scale,
      y: (localY - display.offsetY) / display.scale,
    },
    getState().image,
  );
}

function getViewerPoint(event) {
  const rect = viewerCanvas.getBoundingClientRect();
  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

function createImageBitmapCanvas(image) {
  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(image, 0, 0);
  return canvas;
}

function buildCropDisplay(image) {
  const width = cropCanvas.clientWidth || cropCanvas.parentElement.clientWidth || 320;
  const safeWidth = Math.max(280, width);
  const scale = safeWidth / image.width;
  const height = Math.max(320, image.height * scale);
  ensureCanvasSize(cropCanvas, safeWidth, height);

  return {
    scale,
    drawWidth: image.width * scale,
    drawHeight: image.height * scale,
    offsetX: 0,
    offsetY: 0,
  };
}

function renderStatList(stats, emptyText) {
  if (!stats.length) {
    return `<p class="empty-text">${emptyText}</p>`;
  }

  return `
    <div class="stat-list">
      ${stats
        .map(
          (item) => `
            <div class="stat-row">
              <span><code>${item.code}</code></span>
              <strong>${item.count} 颗</strong>
            </div>
          `,
        )
        .join("")}
    </div>
  `;
}

function drawCropCanvas() {
  const state = getState();
  const { image, crop, cropDisplay, pickerMode } = state;

  if (!image.element || !cropDisplay) {
    const width = cropCanvas.clientWidth || 320;
    const height = 320;
    ensureCanvasSize(cropCanvas, width, height);
    cropCtx.clearRect(0, 0, width, height);
    cropCtx.fillStyle = "#6f6257";
    cropCtx.font = "600 16px 'Segoe UI'";
    cropCtx.fillText("上传图纸后，这里会显示可拖拽裁剪区。", 18, 40);
    return;
  }

  cropCtx.clearRect(0, 0, cropCanvas.clientWidth, cropCanvas.clientHeight);
  cropCtx.drawImage(image.element, 0, 0, cropDisplay.drawWidth, cropDisplay.drawHeight);
  cropCtx.fillStyle = "rgba(40, 27, 19, 0.42)";
  cropCtx.fillRect(0, 0, cropDisplay.drawWidth, cropDisplay.drawHeight);

  if (!crop) {
    return;
  }

  const left = crop.x * cropDisplay.scale;
  const top = crop.y * cropDisplay.scale;
  const width = crop.width * cropDisplay.scale;
  const height = crop.height * cropDisplay.scale;

  cropCtx.clearRect(left, top, width, height);
  cropCtx.strokeStyle = pickerMode ? "#2f6c73" : "#fef3d8";
  cropCtx.lineWidth = 2;
  cropCtx.strokeRect(left, top, width, height);
  cropCtx.fillStyle = pickerMode ? "rgba(47, 108, 115, 0.16)" : "rgba(255, 248, 234, 0.16)";
  cropCtx.fillRect(left, top, width, height);
  cropCtx.fillStyle = "#fffaf3";
  cropCtx.font = "700 14px 'Segoe UI'";
  cropCtx.fillText(
    pickerMode ? "取色模式：点击图片采样" : `裁剪区域 ${Math.round(crop.width)} x ${Math.round(crop.height)}`,
    left + 10,
    Math.max(18, top + 22),
  );
}

function renderPaletteList() {
  const { palette } = getState();
  paletteStatus.textContent = `${palette.length} 个色号`;

  if (!palette.length) {
    paletteList.innerHTML = `<p class="empty-text">先录入几个色号，解析时会按最接近的 RGB 自动匹配。</p>`;
    return;
  }

  paletteList.innerHTML = palette
    .map(
      (entry, index) => `
        <div class="palette-item">
          <div class="palette-item-main">
            <span class="swatch" style="background:${rgbToHex(entry.rgb)}"></span>
            <div>
              <div><code>${entry.code}</code></div>
              <small>${formatRgb(entry.rgb)}</small>
            </div>
          </div>
          <button type="button" class="ghost-btn" data-remove-index="${index}">删除</button>
        </div>
      `,
    )
    .join("");
}

function renderSummary() {
  const state = getState();
  const { image, crop, gridSize, analysis, currentChunkIndex, strategyType } = state;
  imageStatus.textContent = image.element ? "图片已加载" : "未加载图片";
  imageSizeText.textContent = image.width && image.height ? `${image.width} x ${image.height}` : "-";
  pickColorBtn.textContent = state.pickerMode ? "点击图片采样中..." : "从图片取色";
  parseStatus.textContent = analysis ? "解析完成" : "等待解析";
  analyzeBtn.disabled = !image.element || !crop || !state.palette.length;
  downloadJsonBtn.disabled = !analysis;
  prevChunkBtn.disabled = !analysis || currentChunkIndex <= 0;
  nextChunkBtn.disabled = !analysis || currentChunkIndex >= (analysis?.chunks.length || 1) - 1;

  if (crop) {
    cropInfoText.textContent = `x:${crop.x.toFixed(1)} y:${crop.y.toFixed(1)} / ${crop.width.toFixed(1)} x ${crop.height.toFixed(1)}`;
    cellSizeText.textContent = `${(crop.width / gridSize.width).toFixed(2)} x ${(crop.height / gridSize.height).toFixed(2)} px`;
  } else {
    cropInfoText.textContent = "-";
    cellSizeText.textContent = "-";
  }

  if (!analysis) {
    analysisSummary.className = "summary-card empty";
    analysisSummary.textContent = "解析完成后，这里会显示全图概况、当前区块信息和智能建议。";
    chunkLabel.textContent = "-";
    chunkCoordLabel.textContent = "-";
    localStats.innerHTML = `<p class="empty-text">暂无区块统计。</p>`;
    globalStats.innerHTML = `<p class="empty-text">暂无全局统计。</p>`;
    planPanel.innerHTML = `<p class="empty-text">暂无智能建议。</p>`;
    return;
  }

  const chunk = analysis.chunks[currentChunkIndex];
  const plan = generateSmartPlan({ ...analysis, currentChunkIndex }, strategyType);
  const localColorStats = buildStats(chunk.cells);

  analysisSummary.className = "summary-card";
  analysisSummary.innerHTML = `
    <h3>解析概况</h3>
    <p>全图共 <strong>${analysis.gridWidth * analysis.gridHeight}</strong> 格，拆成 <strong>${analysis.chunks.length}</strong> 个 5x5 区块。当前策略为 <span class="mini-code">${plan.title}</span>。</p>
  `;
  chunkLabel.textContent = `区块 ${currentChunkIndex + 1} / ${analysis.chunks.length}`;
  chunkCoordLabel.textContent = `(${chunk.startX},${chunk.startY}) → (${chunk.endX},${chunk.endY})`;
  localStats.innerHTML = renderStatList(localColorStats, "当前区块尚未识别到颜色。");
  globalStats.innerHTML = renderStatList(analysis.globalStats, "暂无全局统计。");
  planPanel.innerHTML = `<h3>${plan.title}</h3><p class="plan-text">${plan.description}</p>`;
}

function drawViewer() {
  const state = getState();
  const { analysis, currentChunkIndex, strategyType } = state;
  const width = viewerCanvas.clientWidth || 320;
  const height = Math.max(320, width);
  ensureCanvasSize(viewerCanvas, width, height);
  viewerCtx.clearRect(0, 0, width, height);
  viewerCtx.imageSmoothingEnabled = false;

  if (!analysis) {
    viewerCtx.fillStyle = "#6f6257";
    viewerCtx.font = "600 16px 'Segoe UI'";
    viewerCtx.fillText("完成解析后，这里会显示放大的 5x5 区块。", 18, 40);
    return;
  }

  const chunk = analysis.chunks[currentChunkIndex];
  const plan = generateSmartPlan({ ...analysis, currentChunkIndex }, strategyType);
  const padding = 20;
  const cellSize = Math.floor((Math.min(width, height) - padding * 2) / Math.max(chunk.width, chunk.height));
  const gridWidth = chunk.width * cellSize;
  const gridHeight = chunk.height * cellSize;
  const offsetX = Math.floor((width - gridWidth) / 2);
  const offsetY = Math.floor((height - gridHeight) / 2);

  viewerCtx.fillStyle = "#fffdf8";
  viewerCtx.fillRect(offsetX - 6, offsetY - 6, gridWidth + 12, gridHeight + 12);

  for (const cell of chunk.cells) {
    const localCol = cell.x - chunk.startX;
    const localRow = cell.y - chunk.startY;
    const x = offsetX + localCol * cellSize;
    const y = offsetY + localRow * cellSize;

    viewerCtx.fillStyle = rgbToHex(cell.matchedRgb);
    viewerCtx.fillRect(x, y, cellSize, cellSize);
    viewerCtx.strokeStyle = "rgba(54, 39, 29, 0.2)";
    viewerCtx.lineWidth = 1;
    viewerCtx.strokeRect(x, y, cellSize, cellSize);
    viewerCtx.fillStyle = getReadableTextColor(cell.matchedRgb);
    viewerCtx.font = `700 ${Math.max(12, Math.floor(cellSize * 0.22))}px 'Segoe UI'`;
    viewerCtx.textAlign = "center";
    viewerCtx.textBaseline = "middle";
    viewerCtx.fillText(cell.code, x + cellSize / 2, y + cellSize / 2);
    viewerCtx.fillStyle = "rgba(48, 33, 22, 0.7)";
    viewerCtx.font = `600 ${Math.max(10, Math.floor(cellSize * 0.16))}px 'Segoe UI'`;
    viewerCtx.fillText(`${cell.x},${cell.y}`, x + cellSize / 2, y + cellSize - 11);
  }

  for (const highlight of plan.highlights) {
    const localCol = highlight.x - chunk.startX;
    const localRow = highlight.y - chunk.startY;
    const x = offsetX + localCol * cellSize;
    const y = offsetY + localRow * cellSize;

    viewerCtx.strokeStyle = strategyType === "edge-first" ? "#2f6c73" : "#f4c64f";
    viewerCtx.lineWidth = 4;
    viewerCtx.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
  }
}

function rerender() {
  drawCropCanvas();
  renderPaletteList();
  renderSummary();
  drawViewer();
}

function setGridSize() {
  patchState({
    gridSize: {
      width: Math.max(1, Number.parseInt(gridWidthInput.value, 10) || 1),
      height: Math.max(1, Number.parseInt(gridHeightInput.value, 10) || 1),
    },
  });
  resetAnalysis();
}

async function handleImageUpload(event) {
  const file = event.target.files?.[0];
  if (!file) {
    return;
  }

  const objectUrl = URL.createObjectURL(file);
  const image = new Image();
  image.decoding = "async";
  image.src = objectUrl;
  await image.decode();

  setState((state) => ({
    ...state,
    image: {
      element: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
    },
    originalCanvas: createImageBitmapCanvas(image),
    cropDisplay: buildCropDisplay({
      width: image.naturalWidth,
      height: image.naturalHeight,
    }),
    crop: {
      x: 0,
      y: 0,
      width: image.naturalWidth,
      height: image.naturalHeight,
    },
    analysis: null,
    currentChunkIndex: 0,
    pickerMode: false,
  }));
}

function resetCropToFullImage() {
  const state = getState();
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
  });
  resetAnalysis();
}

function addPaletteEntry() {
  const code = paletteCodeInput.value.trim().toUpperCase();
  const rgb = parseRgbText(paletteRgbInput.value) || hexToRgb(paletteColorInput.value);

  if (!code) {
    window.alert("请先输入色号，例如 H07。");
    return;
  }

  patchState({
    palette: [
      ...getState().palette.filter((item) => item.code !== code),
      { code, rgb },
    ],
  });

  paletteCodeInput.value = "";
  resetAnalysis();
}

function sampleColorAtPoint(point) {
  const state = getState();
  if (!state.originalCanvas) {
    return;
  }

  const ctx = state.originalCanvas.getContext("2d", { willReadFrequently: true });
  const pixel = ctx.getImageData(Math.floor(point.x), Math.floor(point.y), 1, 1).data;
  const rgb = [pixel[0], pixel[1], pixel[2]];
  paletteColorInput.value = rgbToHex(rgb);
  paletteRgbInput.value = formatRgb(rgb);
  patchState({ pickerMode: false });
}

function handleCropPointerDown(event) {
  const state = getState();
  if (!state.image.element || !state.cropDisplay) {
    return;
  }

  const point = getCanvasEventPoint(event, state.cropDisplay);

  if (state.pickerMode) {
    sampleColorAtPoint(point);
    rerender();
    return;
  }

  cropGesture = {
    start: point,
    active: true,
  };
  cropCanvas.setPointerCapture(event.pointerId);
  patchState({ crop: { x: point.x, y: point.y, width: 1, height: 1 } });
}

function handleCropPointerMove(event) {
  const state = getState();
  if (!cropGesture?.active || !state.cropDisplay) {
    return;
  }

  const point = getCanvasEventPoint(event, state.cropDisplay);
  const crop = normalizeRect(cropGesture.start, point);
  patchState({
    crop: {
      ...crop,
      width: Math.max(1, crop.width),
      height: Math.max(1, crop.height),
    },
  });
  resetAnalysis();
}

function handleCropPointerUp(event) {
  if (!cropGesture?.active) {
    return;
  }
  cropGesture.active = false;
  cropCanvas.releasePointerCapture(event.pointerId);
}

function handleAnalyze() {
  const state = getState();
  if (!state.originalCanvas || !state.crop || !state.palette.length) {
    return;
  }

  patchState({
    analysis: analyzeGrid({
      originalCanvas: state.originalCanvas,
      crop: state.crop,
      gridSize: state.gridSize,
      palette: state.palette,
    }),
    currentChunkIndex: 0,
  });
}

function moveChunk(step) {
  const state = getState();
  if (!state.analysis) {
    return;
  }

  const nextIndex = Math.min(
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

  const endPoint = getViewerPoint(event);
  const deltaX = endPoint.x - viewerSwipeStart.x;
  const deltaY = endPoint.y - viewerSwipeStart.y;
  viewerSwipeStart = null;

  if (Math.abs(deltaX) > 48 && Math.abs(deltaY) < 36) {
    moveChunk(deltaX < 0 ? 1 : -1);
  }
}

function downloadAnalysisJson() {
  const { analysis } = getState();
  if (!analysis) {
    return;
  }

  const payload = {
    gridWidth: analysis.gridWidth,
    gridHeight: analysis.gridHeight,
    crop: analysis.crop,
    cellWidth: analysis.cellWidth,
    cellHeight: analysis.cellHeight,
    globalStats: analysis.globalStats,
    chunks: analysis.chunks,
    cells: analysis.cells,
  };

  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = "perler-grid-analysis.json";
  link.click();
  URL.revokeObjectURL(url);
}

function bindEvents() {
  imageInput.addEventListener("change", handleImageUpload);
  gridWidthInput.addEventListener("input", setGridSize);
  gridHeightInput.addEventListener("input", setGridSize);
  resetCropBtn.addEventListener("click", resetCropToFullImage);
  paletteColorInput.addEventListener("input", () => {
    paletteRgbInput.value = formatRgb(hexToRgb(paletteColorInput.value));
  });
  paletteRgbInput.value = formatRgb(hexToRgb(paletteColorInput.value));
  addPaletteBtn.addEventListener("click", addPaletteEntry);
  pickColorBtn.addEventListener("click", () => patchState({ pickerMode: !getState().pickerMode }));
  paletteList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-index]");
    if (!button) {
      return;
    }
    const index = Number.parseInt(button.dataset.removeIndex, 10);
    patchState({ palette: getState().palette.filter((_, itemIndex) => itemIndex !== index) });
    resetAnalysis();
  });
  analyzeBtn.addEventListener("click", handleAnalyze);
  downloadJsonBtn.addEventListener("click", downloadAnalysisJson);
  strategySelect.addEventListener("change", () => patchState({ strategyType: strategySelect.value }));
  prevChunkBtn.addEventListener("click", () => moveChunk(-1));
  nextChunkBtn.addEventListener("click", () => moveChunk(1));
  cropCanvas.addEventListener("pointerdown", handleCropPointerDown);
  cropCanvas.addEventListener("pointermove", handleCropPointerMove);
  cropCanvas.addEventListener("pointerup", handleCropPointerUp);
  cropCanvas.addEventListener("pointercancel", handleCropPointerUp);
  viewerCanvas.addEventListener("pointerdown", handleViewerPointerDown);
  viewerCanvas.addEventListener("pointerup", handleViewerPointerUp);
  window.addEventListener("resize", () => {
    const state = getState();
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
bindEvents();
rerender();
