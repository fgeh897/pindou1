import { formatRgb, getPerceptualDistance, getReadableTextColor, getRgbDistance, hexToRgb, parseRgbText, rgbToHex } from "./color.js";
import { analyzeGrid, buildStats } from "./parser.js";
import { generateSmartPlan } from "./plan.js";
import { getState, patchState, resetAnalysis, setState, subscribe } from "./state.js";

const imageInput = document.querySelector("#imageInput");
const imagePickBtn = document.querySelector("#imagePickBtn");
const imagePickHint = document.querySelector("#imagePickHint");
const gridWidthInput = document.querySelector("#gridWidthInput");
const gridHeightInput = document.querySelector("#gridHeightInput");
const cropCanvas = document.querySelector("#cropCanvas");
const applyCropBtn = document.querySelector("#applyCropBtn");
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
const overviewCanvas = document.querySelector("#overviewCanvas");
const strategySelect = document.querySelector("#strategySelect");
const prevChunkBtn = document.querySelector("#prevChunkBtn");
const nextChunkBtn = document.querySelector("#nextChunkBtn");
const moveUpBtn = document.querySelector("#moveUpBtn");
const moveLeftBtn = document.querySelector("#moveLeftBtn");
const moveRightBtn = document.querySelector("#moveRightBtn");
const moveDownBtn = document.querySelector("#moveDownBtn");
const chunkLabel = document.querySelector("#chunkLabel");
const chunkCoordLabel = document.querySelector("#chunkCoordLabel");
const localStats = document.querySelector("#localStats");
const globalStats = document.querySelector("#globalStats");
const planPanel = document.querySelector("#planPanel");
const tabBtns = [...document.querySelectorAll(".tab-btn")];
const tabPanels = [...document.querySelectorAll(".tab-panel")];
const tabLibraryBtn = document.querySelector('[data-tab="tab-library"]');
const tabStep4Btn = document.querySelector('[data-tab="tab-step4"]');
const tabLibraryBadge = document.querySelector("#tabLibraryBadge");
const togglePaletteBtn = document.querySelector("#togglePaletteBtn");
const paletteSearchInput = document.querySelector("#paletteSearchInput");
const minimapCanvas = document.querySelector("#minimapCanvas");
const minimapCtx = minimapCanvas?.getContext("2d") || null;
const overviewCtx = overviewCanvas?.getContext("2d") || null;
const libraryStatus = document.querySelector("#libraryStatus");
const libraryProjectNameInput = document.querySelector("#libraryProjectNameInput");
const libraryProjectStatusSelect = document.querySelector("#libraryProjectStatusSelect");
const saveProjectBtn = document.querySelector("#saveProjectBtn");
const importProjectBtn = document.querySelector("#importProjectBtn");
const libraryImageInput = document.querySelector("#libraryImageInput");
const libraryProjectList = document.querySelector("#libraryProjectList");
const step2Panel = document.querySelector("#tab-step2");
const step3Panel = document.querySelector("#tab-step3");
const step4Panel = document.querySelector("#tab-step4");
const focusColorSelect = document.querySelector("#focusColorSelect");
const focusTopColorBtn = document.querySelector("#focusTopColorBtn");
const clearFocusColorBtn = document.querySelector("#clearFocusColorBtn");
const focusColorSummary = document.querySelector("#focusColorSummary");
	// 后端地址默认 Render，可通过 window.__PIN_DOU_OCR_API_BASE_URL__ 覆盖
	// 见 DEPLOY_BACKEND_RENDER.md

const cropCtx = cropCanvas.getContext("2d");
const viewerCtx = viewerCanvas.getContext("2d");

let cropGesture = null;
let viewerSwipeStart = null;
let paletteExpanded = false;
let paletteImageInput = null;
let extractLegendBtn = null;
let uploadPaletteImageBtn = null;
let paletteReviewCanvas = null;
let paletteReviewCtx = null;
let paletteReviewStatus = null;
let paletteReviewCodeInput = null;
let paletteReviewRetryBtn = null;
let paletteReviewSaveBtn = null;
let paletteReviewDeleteBtn = null;
let paletteReviewClearBtn = null;
let paletteReviewModeSelect = null;
let paletteReviewColorValue = null;
let paletteReviewPixelGrid = null;
let paletteReviewResetColorBtn = null;
let paletteReviewDetailCanvas = null;
let paletteReviewDetailCtx = null;
let paletteReviewList = null;
let paletteGridRowsInput = null;
let paletteGridColsInput = null;
let paletteGridGapXInput = null;
let paletteGridGapYInput = null;
let paletteGridInitBtn = null;
let paletteGridApplyBtn = null;
let paletteGridResetBtn = null;
let paletteGridEditInput = null;
let paletteGridStatus = null;
let sampleOverlayToggle = null;
let sampleModeSelect = null;
let sampleOuterMarginInput = null;
let sampleInsetInput = null;
let sampleOffsetXInput = null;
let sampleOffsetYInput = null;
let watermarkTextAssistInput = null;
let chartTextPriorityInput = null;
let excludeOuterLayersInput = null;
let preserveBlankWithoutTextInput = null;
let sampleAnchorInfo = null;
let sampleDemoCanvas = null;
let sampleDemoCtx = null;
let sampleInspectCanvas = null;
let sampleInspectCtx = null;
let sampleInspectStatus = null;
let sampleInspectVotes = null;
let sampleInspectWindowSelect = null;
let seedTargetCodeSelect = null;
let seedContrastCodeSelect = null;
let seedThresholdInput = null;
let seedAddTargetBtn = null;
let seedAddContrastBtn = null;
let seedAnalyzeBtn = null;
let seedApplyBtn = null;
let seedClearBtn = null;
let seedResetOverridesBtn = null;
let seedStatus = null;
let seedTargetList = null;
let seedContrastList = null;
let seedCandidateList = null;
let calibrationActiveCodeSelect = null;
let calibrationAddSampleBtn = null;
let calibrationBuildBtn = null;
let calibrationApplyBtn = null;
let calibrationDisableBtn = null;
let calibrationClearActiveBtn = null;
let calibrationClearAllBtn = null;
let calibrationStatus = null;
let calibrationSampleList = null;
let gridOffsetXInput = null;
let gridOffsetYInput = null;
let cellWidthScaleInput = null;
let cellHeightScaleInput = null;
let previewCellInput = null;
let resetAlignmentBtn = null;
let paletteImportModeSelect = null;
let paletteSetNameText = null;
let markerPresetSelect = null;
let markerSummary = null;
let paletteReviewGesture = null;
let paletteReviewGridGesture = null;
let sampleInspectHitRegions = [];
let sampleInspectOverlay = null;
let sampleInspectGesture = null;
let persistStateTimer = null;
let persistStateRequestSeq = 0;
let persistStateSavedSeq = 0;
let libraryDataExportBtn = null;
let libraryDataImportBtn = null;
let libraryDataImportInput = null;
let libraryDataStatus = null;
let batchReplaceModeInput = null;
let batchReplaceCodeInput = null;
let batchReplaceCodeList = null;
let batchReplaceApplyBtn = null;
let batchReplaceClearSelectionBtn = null;
let batchReplaceClearOverridesBtn = null;
let batchReplaceStatus = null;
let viewerSelectionGesture = null;
let overviewSelectionGesture = null;

const analysisBatchSelection = {
  targetCode: "",
  selectedKeys: new Set(),
  dragRect: null,
};

let paletteReviewState = {
  sourceCanvas: null,
  sourceName: "",
  detections: [],
  selection: null,
  display: null,
  activeIndex: -1,
  manualRgb: null,
  manualPoint: null,
  detailDisplay: null,
  detailPixels: [],
  grid: null,
};

const STORAGE_KEY = "pindou-assistant-state-v1";
const SERVER_STATE_URL = window.__PIN_DOU_CLOUD_STATE_URL__ || "/api/state";
	const OCR_API_BASE_URL = window.__PIN_DOU_OCR_API_BASE_URL__ || "https://pindou1-1.onrender.com";
const BACKEND_PALETTE_OCR_URL = `${OCR_API_BASE_URL}/api/ocr/palette-card`;
const BACKEND_MANUAL_SWATCH_OCR_URL = `${OCR_API_BASE_URL}/api/ocr/manual-swatch`;
const BACKEND_PALETTE_GRID_OCR_URL = `${OCR_API_BASE_URL}/api/ocr/palette-grid`;

console.log("[OCR] Config: OCR_API_BASE_URL =", OCR_API_BASE_URL);
console.log("[OCR] Config: canUseBackendOcr =", canUseBackendOcr());
console.log("[OCR] Config: protocol =", window.location.protocol);
const PROJECT_STATUS_LABELS = {
  todo: "未拼",
  doing: "拼到一半",
  done: "已拼好",
};

function createEmptySeedAssist() {
  return {
    targetCode: "",
    contrastCode: "",
    threshold: 8,
    targetSeeds: [],
    contrastSeeds: [],
    candidates: [],
    targetPrototypeRgb: null,
    contrastPrototypeRgb: null,
  };
}

function createEmptyCalibrationAssist() {
  return {
    enabled: false,
    activeCode: "",
    samplesByCode: {},
    prototypesByCode: {},
  };
}

function createDefaultPaletteReviewGrid(sourceCanvas, detections = []) {
  const canvasWidth = sourceCanvas?.width || 0;
  const canvasHeight = sourceCanvas?.height || 0;
  const detectionCount = detections.length;
  const inferredRows = detectionCount >= 20 ? 5 : detectionCount >= 8 ? 4 : 3;
  const inferredCols = detectionCount ? Math.max(1, Math.ceil(detectionCount / inferredRows)) : 8;

  let rect = null;
  if (detections.length) {
    const left = Math.min(...detections.map((item) => item.box.x));
    const top = Math.min(...detections.map((item) => item.box.y));
    const right = Math.max(...detections.map((item) => item.box.x + item.box.width));
    const bottom = Math.max(...detections.map((item) => item.box.y + item.box.height));
    const padX = Math.max(4, Math.round((right - left) * 0.02));
    const padY = Math.max(4, Math.round((bottom - top) * 0.04));
    rect = {
      x: Math.max(0, left - padX),
      y: Math.max(0, top - padY),
      width: Math.min(canvasWidth, right - left + padX * 2),
      height: Math.min(canvasHeight, bottom - top + padY * 2),
    };
  } else {
    const padX = Math.round(canvasWidth * 0.04);
    const padY = Math.round(canvasHeight * 0.04);
    rect = {
      x: padX,
      y: padY,
      width: Math.max(20, canvasWidth - padX * 2),
      height: Math.max(20, canvasHeight - padY * 2),
    };
  }

  return {
    enabled: false,
    editMode: false,
    rows: inferredRows,
    cols: inferredCols,
    gapXRatio: 0.12,
    gapYRatio: 0.12,
    rect,
  };
}

function normalizeProjectName(name) {
  return (name || "未命名图纸").replace(/\.[^.]+$/, "").trim() || "未命名图纸";
}

function createProjectId() {
  return `project-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

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

function setImagePickHint(message, isError = false) {
  if (!imagePickHint) {
    return;
  }
  imagePickHint.textContent = message;
  imagePickHint.style.color = isError ? "#c13d3d" : "#745f4b";
}

function openImagePicker() {
  if (!imageInput) {
    return;
  }

  try {
    imageInput.value = "";
  } catch (error) {
    console.warn("reset image input value failed:", error);
  }

  setImagePickHint("已请求系统图片选择器...");

  try {
    if (typeof imageInput.showPicker === "function") {
      imageInput.showPicker();
      return;
    }
  } catch (error) {
    console.warn("showPicker failed, fallback to click:", error);
  }

  try {
    imageInput.click();
  } catch (error) {
    console.warn("input.click failed:", error);
    setImagePickHint("浏览器拦截了选图器，请优先点左侧“直接打开系统选图”。", true);
  }
}

function canUseBackendOcr() {
  return true;
}

function getBackendEngineLabel(engineName) {
  if (!engineName) {
    return "后端 OCR";
  }
  if (engineName === "rapidocr") {
    return "后端 OCR（RapidOCR）";
  }
  if (engineName === "paddleocr") {
    return "后端 OCR（PaddleOCR）";
  }
  return `后端 OCR（${engineName}）`;
}

async function requestBackendPaletteOcr(file) {
  console.log("[OCR] Calling backend:", BACKEND_PALETTE_OCR_URL);
  console.log("[OCR] File:", file.name, file.type, file.size, "bytes");

  const formData = new FormData();
  formData.append("file", file);

  let response;
  try {
    response = await fetch(BACKEND_PALETTE_OCR_URL, {
      method: "POST",
      body: formData,
    });
  } catch (networkErr) {
    console.error("[OCR] Network error:", networkErr);
    const msg = "Network error: cannot reach " + BACKEND_PALETTE_OCR_URL + " - " + (networkErr.message || String(networkErr));
    throw new Error(msg);
  }

  console.log("[OCR] Response status:", response.status);
  const payload = await response.json().catch((err) => {
    console.error("[OCR] JSON parse error:", err);
    return {};
  });
  console.log("[OCR] Response body:", JSON.stringify(payload).slice(0, 500));

  if (!response.ok) {
    const message = payload?.ocrError || payload?.detail || `OCR request failed (${response.status})`;
    console.error("[OCR] Backend error:", message);
    throw new Error(message);
  }
  return payload;
}
}

async function requestBackendManualSwatchOcr(file) {
  const formData = new FormData();
  formData.append("file", file);
  const response = await fetch(BACKEND_MANUAL_SWATCH_OCR_URL, {
    method: "POST",
    body: formData,
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.ocrError || payload?.detail || `Manual OCR request failed (${response.status})`;
    throw new Error(message);
  }
  return payload;
}

async function requestBackendPaletteGridOcr(file, grid) {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("rows", String(grid.rows));
  formData.append("cols", String(grid.cols));
  formData.append("gapXRatio", String(grid.gapXRatio ?? 0.12));
  formData.append("gapYRatio", String(grid.gapYRatio ?? 0.12));
  formData.append("x", String(grid.rect.x));
  formData.append("y", String(grid.rect.y));
  formData.append("width", String(grid.rect.width));
  formData.append("height", String(grid.rect.height));
  const response = await fetch(BACKEND_PALETTE_GRID_OCR_URL, {
    method: "POST",
    body: formData,
  });
  const payload = await response.json();
  if (!response.ok) {
    const message = payload?.ocrError || payload?.detail || `Grid OCR request failed (${response.status})`;
    throw new Error(message);
  }
  return payload;
}

function createStoredImageRecord(dataUrl, image, name = "") {
  return {
    dataUrl,
    width: image.naturalWidth,
    height: image.naturalHeight,
    name,
  };
}

async function loadImageElement(source) {
  const image = new Image();
  image.decoding = "async";

  const loadPromise = new Promise((resolve, reject) => {
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("图片文件无法读取或格式不受支持"));
  });

  image.src = source;

  if (typeof image.decode === "function") {
    try {
      await image.decode();
      return image;
    } catch (error) {
      console.warn("image.decode failed, fallback to onload:", error);
    }
  }

  await loadPromise;
  return image;
}

async function loadImageFromDataUrl(dataUrl) {
  return loadImageElement(dataUrl);
}

function buildProjectSnapshot(state) {
  return {
    gridSize: state.gridSize,
    gridAlignment: state.gridAlignment,
    sampling: state.sampling,
    recognition: state.recognition,
    showSamplingOverlay: state.showSamplingOverlay,
    crop: state.crop,
    cropConfirmed: state.cropConfirmed,
    palette: state.palette,
    paletteSetName: state.paletteSetName,
    paletteImportMode: state.paletteImportMode,
    paletteReviewMode: state.paletteReviewMode,
    strategyType: state.strategyType,
    focusColorCode: state.focusColorCode,
    markerPreset: state.markerPreset,
    selectedPreviewCell: state.selectedPreviewCell,
    sampleInspectWindow: state.sampleInspectWindow,
    manualOverrides: state.manualOverrides,
    seedAssist: state.seedAssist,
    calibrationAssist: state.calibrationAssist,
    storedImage: state.storedImage || null,
    paletteReviewSnapshot: buildPaletteReviewSnapshot(),
    currentProjectName: state.currentProjectName || "",
    currentProjectStatus: state.currentProjectStatus || "todo",
  };
}

function buildPersistedState(state) {
  const meta = getCurrentProjectMeta(state);
  const existingProjects = state.libraryProjects || [];
  const nextLibraryProjects =
    meta.id && state.storedImage?.dataUrl
      ? [
          createProjectRecordFromSnapshot(
            buildProjectSnapshot({
              ...state,
              currentProjectName: meta.name,
              currentProjectStatus: meta.status,
            }),
            {
              id: meta.id,
              name: meta.name,
              status: meta.status,
              createdAt: existingProjects.find((project) => project.id === meta.id)?.createdAt,
              coverImageDataUrl:
                state.storedImage?.dataUrl || existingProjects.find((project) => project.id === meta.id)?.coverImageDataUrl || "",
            },
          ),
          ...existingProjects.filter((project) => project.id !== meta.id),
        ]
      : existingProjects;

  return {
    ...buildProjectSnapshot(state),
    libraryProjects: nextLibraryProjects,
    currentProjectId: state.currentProjectId || "",
  };
}

function createProjectRecordFromSnapshot(snapshot, overrides = {}) {
  const now = new Date().toISOString();
  const storedImage = snapshot.storedImage || null;
  return {
    id: overrides.id || createProjectId(),
    name: overrides.name || snapshot.currentProjectName || normalizeProjectName(storedImage?.name || ""),
    status: overrides.status || snapshot.currentProjectStatus || "todo",
    createdAt: overrides.createdAt || now,
    updatedAt: now,
    coverImageDataUrl: overrides.coverImageDataUrl || storedImage?.dataUrl || "",
    gridSize: snapshot.gridSize || { width: 40, height: 40 },
    paletteCount: Array.isArray(snapshot.palette) ? snapshot.palette.length : 0,
    snapshot,
  };
}

function buildPaletteReviewSnapshot() {
  if (!paletteReviewState.sourceCanvas) {
    return null;
  }

  return {
    sourceName: paletteReviewState.sourceName || "",
    sourceDataUrl: paletteReviewState.sourceCanvas.toDataURL("image/jpeg", 0.9),
    detections: (paletteReviewState.detections || []).map((item) => ({
      swatchIndex: item.swatchIndex,
      rgb: item.rgb,
      box: item.box,
      sampleBox: item.sampleBox || null,
      manualRgb: item.manualRgb || null,
      manualPoint: item.manualPoint || null,
      code: item.code || "",
      score: item.score || 0,
    })),
    selection: paletteReviewState.selection || null,
    activeIndex: paletteReviewState.activeIndex,
    manualRgb: paletteReviewState.manualRgb || null,
    manualPoint: paletteReviewState.manualPoint || null,
    detailPixels: paletteReviewState.detailPixels || [],
    grid: paletteReviewState.grid || null,
  };
}

function resetPaletteReviewState() {
  paletteReviewState = {
    sourceCanvas: null,
    sourceName: "",
    detections: [],
    selection: null,
    display: null,
    activeIndex: -1,
    manualRgb: null,
    manualPoint: null,
    detailDisplay: null,
    detailPixels: [],
    grid: null,
  };
}

async function buildHydratedStateFromSnapshot(snapshot, extras = {}) {
  const parsedSeedAssist = snapshot.seedAssist || {};
  const parsedCalibrationAssist = snapshot.calibrationAssist || {};
  const nextState = {
    ...getState(),
    gridSize: snapshot.gridSize || getState().gridSize,
    gridAlignment: snapshot.gridAlignment || getState().gridAlignment,
    sampling: {
      ...getState().sampling,
      ...(snapshot.sampling || {}),
    },
    recognition: {
      ...getState().recognition,
      ...(snapshot.recognition || {}),
    },
    showSamplingOverlay:
      typeof snapshot.showSamplingOverlay === "boolean" ? snapshot.showSamplingOverlay : getState().showSamplingOverlay,
    crop: snapshot.crop || getState().crop,
    cropConfirmed: Boolean(snapshot.cropConfirmed),
    palette: snapshot.palette || getState().palette,
    paletteSetName: snapshot.paletteSetName || getState().paletteSetName,
    paletteImportMode: snapshot.paletteImportMode || getState().paletteImportMode,
    paletteReviewMode: snapshot.paletteReviewMode || getState().paletteReviewMode,
    strategyType: snapshot.strategyType || getState().strategyType,
    focusColorCode: snapshot.focusColorCode || "",
    markerPreset: snapshot.markerPreset || getState().markerPreset,
    selectedPreviewCell: snapshot.selectedPreviewCell || getState().selectedPreviewCell,
    sampleInspectWindow: snapshot.sampleInspectWindow || getState().sampleInspectWindow,
    manualOverrides: snapshot.manualOverrides || {},
    seedAssist: {
      ...createEmptySeedAssist(),
      ...parsedSeedAssist,
      targetSeeds: parsedSeedAssist.targetSeeds || parsedSeedAssist.seeds || [],
      contrastSeeds: parsedSeedAssist.contrastSeeds || [],
      candidates: [],
      targetPrototypeRgb: parsedSeedAssist.targetPrototypeRgb || parsedSeedAssist.prototypeRgb || null,
      contrastPrototypeRgb: parsedSeedAssist.contrastPrototypeRgb || null,
      contrastCode: parsedSeedAssist.contrastCode || "",
    },
    calibrationAssist: {
      ...createEmptyCalibrationAssist(),
      ...parsedCalibrationAssist,
      samplesByCode: parsedCalibrationAssist.samplesByCode || {},
      prototypesByCode: parsedCalibrationAssist.prototypesByCode || {},
    },
    storedImage: snapshot.storedImage || null,
    libraryProjects: extras.libraryProjects || getState().libraryProjects || [],
    currentProjectId: extras.currentProjectId || "",
    currentProjectName: extras.currentProjectName || snapshot.currentProjectName || "",
    currentProjectStatus: extras.currentProjectStatus || snapshot.currentProjectStatus || "todo",
    analysis: null,
    currentChunkIndex: 0,
  };

  if (snapshot.storedImage?.dataUrl) {
    const image = await loadImageFromDataUrl(snapshot.storedImage.dataUrl);
    nextState.image = {
      element: image,
      width: image.naturalWidth,
      height: image.naturalHeight,
    };
    nextState.originalCanvas = createImageBitmapCanvas(image);
    nextState.cropDisplay = buildCropDisplay({
      width: image.naturalWidth,
      height: image.naturalHeight,
    });
    nextState.crop =
      snapshot.crop || {
        x: 0,
        y: 0,
        width: image.naturalWidth,
        height: image.naturalHeight,
      };
  } else {
    nextState.image = { element: null, width: 0, height: 0 };
    nextState.originalCanvas = null;
    nextState.cropDisplay = null;
    nextState.crop = snapshot.crop || null;
  }

  resetPaletteReviewState();
  if (snapshot.paletteReviewSnapshot?.sourceDataUrl) {
    try {
      const paletteImage = await loadImageFromDataUrl(snapshot.paletteReviewSnapshot.sourceDataUrl);
      const sourceCanvas = createImageBitmapCanvas(paletteImage);
      paletteReviewState = {
        sourceCanvas,
        sourceName: snapshot.paletteReviewSnapshot.sourceName || "",
        detections: snapshot.paletteReviewSnapshot.detections || [],
        selection: snapshot.paletteReviewSnapshot.selection || null,
        display: null,
        activeIndex: Number.isInteger(snapshot.paletteReviewSnapshot.activeIndex) ? snapshot.paletteReviewSnapshot.activeIndex : -1,
        manualRgb: snapshot.paletteReviewSnapshot.manualRgb || null,
        manualPoint: snapshot.paletteReviewSnapshot.manualPoint || null,
        detailDisplay: null,
        detailPixels: snapshot.paletteReviewSnapshot.detailPixels || [],
        grid:
          snapshot.paletteReviewSnapshot.grid ||
          createDefaultPaletteReviewGrid(sourceCanvas, snapshot.paletteReviewSnapshot.detections || []),
      };
    } catch (error) {
      console.warn("Failed to restore palette review snapshot:", error);
    }
  }

  return nextState;
}

function saveStateToStorage() {
  const state = getState();
  const payload = buildPersistedState(state);
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
  } catch (error) {
    console.warn("Failed to persist local state:", error);
  }

  scheduleServerStatePersist(payload);
}

function scheduleServerStatePersist(payload = buildPersistedState(getState())) {
  if (typeof window.fetch !== "function") {
    return;
  }

  const requestSeq = ++persistStateRequestSeq;
  if (persistStateTimer) {
    window.clearTimeout(persistStateTimer);
  }

  persistStateTimer = window.setTimeout(async () => {
    try {
      await fetch(SERVER_STATE_URL, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });
      persistStateSavedSeq = Math.max(persistStateSavedSeq, requestSeq);
    } catch (error) {
      console.warn("Failed to persist server state:", error);
    }
  }, 420);
}

async function loadPersistedPayload() {
  if (typeof window.fetch === "function") {
    try {
      const response = await fetch(SERVER_STATE_URL, { cache: "no-store" });
      if (response.ok) {
        const payload = await response.json();
        if (payload?.state && typeof payload.state === "object") {
          return payload.state;
        }
      }
    } catch (error) {
      console.warn("Failed to load server state, fallback to localStorage:", error);
    }
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch (error) {
    console.warn("Failed to parse local state:", error);
    return null;
  }
}

async function restoreStateFromStorage() {
  const parsed = await loadPersistedPayload();
  if (!parsed) {
    return;
  }

  try {
    const nextState = await buildHydratedStateFromSnapshot(parsed, {
      libraryProjects: parsed.libraryProjects || [],
      currentProjectId: parsed.currentProjectId || "",
      currentProjectName: parsed.currentProjectName || "",
      currentProjectStatus: parsed.currentProjectStatus || "todo",
    });
    setState(nextState);
  } catch (error) {
    console.warn("Failed to restore local state:", error);
  }
}

function getMasterPalette() {
  const colors = window.PINDOU_COLORS || [];
  return colors.map((entry) => ({
    code: entry.code,
    rgb: hexToRgb(entry.hex),
  }));
}

function buildLegendProbeCanvas(originalCanvas) {
  const width = originalCanvas.width;
  const height = Math.floor(originalCanvas.height * 0.34);
  const startY = originalCanvas.height - height;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(originalCanvas, 0, startY, width, height, 0, 0, width, height);
  return canvas;
}

function extractPaletteCandidatesFromCanvas(sourceCanvas, options = {}) {
  const ctx = sourceCanvas.getContext("2d", { willReadFrequently: true });
  const imageData = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const masterPalette = getMasterPalette();
  const buckets = new Map();
  const step = Math.max(1, options.sampleStep || 4);

  for (let y = 0; y < sourceCanvas.height; y += step) {
    for (let x = 0; x < sourceCanvas.width; x += step) {
      const index = (y * sourceCanvas.width + x) * 4;
      const r = imageData.data[index];
      const g = imageData.data[index + 1];
      const b = imageData.data[index + 2];
      const a = imageData.data[index + 3];
      if (a < 200) {
        continue;
      }

      const brightness = (r + g + b) / 3;
      if (brightness > 248) {
        continue;
      }

      const key = `${Math.round(r / 12)}|${Math.round(g / 12)}|${Math.round(b / 12)}`;
      const bucket = buckets.get(key) || {
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

  const bucketList = [...buckets.values()]
    .map((bucket) => ({
      count: bucket.count,
      rgb: bucket.sum.map((value) => Math.round(value / bucket.count)),
    }))
    .sort((left, right) => right.count - left.count);

  const minCount = options.minCount || Math.max(10, Math.floor(sourceCanvas.width * sourceCanvas.height / 6000));
  const limit = Math.min(bucketList.length, options.maxBuckets || 96);
  const usedCodes = new Set();
  const extracted = [];

  for (let index = 0; index < limit; index += 1) {
    const candidate = bucketList[index];
    if (candidate.count < minCount) {
      continue;
    }

    const nearest = getNearestMasterColor(candidate.rgb, masterPalette);
    if (!nearest || usedCodes.has(nearest.code)) {
      continue;
    }

    usedCodes.add(nearest.code);
    extracted.push({
      code: nearest.code,
      rgb: candidate.rgb,
      standardRgb: nearest.rgb,
      count: candidate.count,
      distance: nearest.distance,
    });
  }

  return extracted.sort((left, right) => left.code.localeCompare(right.code));
}

function isPotentialSwatchPixel(r, g, b, a) {
  if (a < 180) {
    return false;
  }

  const brightness = (r + g + b) / 3;
  const spread = Math.max(r, g, b) - Math.min(r, g, b);
  return brightness < 246 && (spread > 12 || brightness < 220);
}

const CODE_TEMPLATE_CACHE = new Map();

function getCodeCandidateList() {
  const knownCodes = new Set((window.PINDOU_COLORS || []).map((entry) => entry.code));
  for (const entry of getState().palette) {
    knownCodes.add(entry.code);
  }
  return [...knownCodes].sort((left, right) => left.localeCompare(right));
}

function buildActiveBounds(mask, width, height) {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      if (!mask[y * width + x]) {
        continue;
      }
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
  }

  if (maxX < minX || maxY < minY) {
    return null;
  }

  return {
    x: minX,
    y: minY,
    width: maxX - minX + 1,
    height: maxY - minY + 1,
  };
}

function normalizeBinaryMask(mask, width, height, targetWidth = 72, targetHeight = 28) {
  const bounds = buildActiveBounds(mask, width, height);
  if (!bounds) {
    return null;
  }

  const normalized = new Uint8Array(targetWidth * targetHeight);

  for (let targetY = 0; targetY < targetHeight; targetY += 1) {
    for (let targetX = 0; targetX < targetWidth; targetX += 1) {
      const sourceX = bounds.x + ((targetX + 0.5) / targetWidth) * bounds.width;
      const sourceY = bounds.y + ((targetY + 0.5) / targetHeight) * bounds.height;
      const pixelX = clampNumber(Math.floor(sourceX), 0, width - 1);
      const pixelY = clampNumber(Math.floor(sourceY), 0, height - 1);
      normalized[targetY * targetWidth + targetX] = mask[pixelY * width + pixelX];
    }
  }

  return {
    width: targetWidth,
    height: targetHeight,
    data: normalized,
  };
}

function renderCodeTemplateMask(code, fontFamily) {
  const cacheKey = `${code}::${fontFamily}`;
  if (CODE_TEMPLATE_CACHE.has(cacheKey)) {
    return CODE_TEMPLATE_CACHE.get(cacheKey);
  }

  const canvas = document.createElement("canvas");
  canvas.width = 220;
  canvas.height = 90;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = "#111111";

  let fontSize = 56;
  for (; fontSize >= 22; fontSize -= 2) {
    ctx.font = `900 ${fontSize}px ${fontFamily}`;
    if (ctx.measureText(code).width <= canvas.width * 0.82) {
      break;
    }
  }

  ctx.font = `900 ${fontSize}px ${fontFamily}`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(code, canvas.width / 2, canvas.height / 2 + 2);

  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const mask = new Uint8Array(canvas.width * canvas.height);
  for (let index = 0; index < mask.length; index += 1) {
    const pixelIndex = index * 4;
    const brightness =
      (imageData.data[pixelIndex] + imageData.data[pixelIndex + 1] + imageData.data[pixelIndex + 2]) / 3;
    mask[index] = brightness < 180 ? 1 : 0;
  }

  const normalized = normalizeBinaryMask(mask, canvas.width, canvas.height);
  CODE_TEMPLATE_CACHE.set(cacheKey, normalized);
  return normalized;
}

function getCodeTemplateVariants(code) {
  return [
    renderCodeTemplateMask(code, '"Arial Black", "Segoe UI", sans-serif'),
    renderCodeTemplateMask(code, '"Segoe UI", Arial, sans-serif'),
  ].filter(Boolean);
}

function compareBinaryMasks(left, right) {
  let overlap = 0;
  let union = 0;
  let leftCount = 0;
  let rightCount = 0;

  for (let index = 0; index < left.data.length; index += 1) {
    const leftValue = left.data[index];
    const rightValue = right.data[index];
    if (leftValue) {
      leftCount += 1;
    }
    if (rightValue) {
      rightCount += 1;
    }
    if (leftValue || rightValue) {
      union += 1;
    }
    if (leftValue && rightValue) {
      overlap += 1;
    }
  }

  if (!union) {
    return 0;
  }

  const densityPenalty = Math.abs(leftCount - rightCount) / Math.max(leftCount, rightCount, 1);
  return overlap / union - densityPenalty * 0.18;
}

function buildTextMaskFromSwatch(sourceCanvas, box, backgroundRgb) {
  const ctx = sourceCanvas.getContext("2d", { willReadFrequently: true });
  const roi = {
    x: Math.max(0, Math.floor(box.x + box.width * 0.04)),
    y: Math.max(0, Math.floor(box.y + box.height * 0.12)),
    width: Math.max(16, Math.floor(box.width * 0.46)),
    height: Math.max(12, Math.floor(box.height * 0.62)),
  };
  const imageData = ctx.getImageData(
    roi.x,
    roi.y,
    Math.min(roi.width, sourceCanvas.width - roi.x),
    Math.min(roi.height, sourceCanvas.height - roi.y),
  );
  const mask = new Uint8Array(imageData.width * imageData.height);
  const threshold = 44;

  for (let y = 0; y < imageData.height; y += 1) {
    for (let x = 0; x < imageData.width; x += 1) {
      const index = (y * imageData.width + x) * 4;
      const rgb = [imageData.data[index], imageData.data[index + 1], imageData.data[index + 2]];
      mask[y * imageData.width + x] = getRgbDistance(rgb, backgroundRgb) >= threshold ? 1 : 0;
    }
  }

  return normalizeBinaryMask(mask, imageData.width, imageData.height);
}

function recognizeSwatchCode(sourceCanvas, swatch) {
  const sampleMask = buildTextMaskFromSwatch(sourceCanvas, swatch.box, swatch.rgb);
  if (!sampleMask) {
    return null;
  }

  let bestMatch = null;
  for (const code of getCodeCandidateList()) {
    const variants = getCodeTemplateVariants(code);
    for (const variant of variants) {
      const score = compareBinaryMasks(sampleMask, variant);
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { code, score };
      }
    }
  }

  if (!bestMatch || bestMatch.score < 0.18) {
    return null;
  }

  return bestMatch;
}

function extractSwatchBoxesFromCanvas(sourceCanvas, options = {}) {
  const ctx = sourceCanvas.getContext("2d", { willReadFrequently: true });
  const imageData = ctx.getImageData(0, 0, sourceCanvas.width, sourceCanvas.height);
  const step = Math.max(2, options.step || 3);
  const width = Math.ceil(sourceCanvas.width / step);
  const height = Math.ceil(sourceCanvas.height / step);
  const mask = new Uint8Array(width * height);

  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      const x = Math.min(sourceCanvas.width - 1, col * step);
      const y = Math.min(sourceCanvas.height - 1, row * step);
      const index = (y * sourceCanvas.width + x) * 4;
      if (
        isPotentialSwatchPixel(
          imageData.data[index],
          imageData.data[index + 1],
          imageData.data[index + 2],
          imageData.data[index + 3],
        )
      ) {
        mask[row * width + col] = 1;
      }
    }
  }

  const visited = new Uint8Array(width * height);
  const boxes = [];
  const queue = [];
  const minCells = Math.max(18, Math.floor((width * height) / 800));

  for (let row = 0; row < height; row += 1) {
    for (let col = 0; col < width; col += 1) {
      const startIndex = row * width + col;
      if (!mask[startIndex] || visited[startIndex]) {
        continue;
      }

      visited[startIndex] = 1;
      queue.length = 0;
      queue.push([col, row]);
      let head = 0;
      let count = 0;
      let minCol = col;
      let maxCol = col;
      let minRow = row;
      let maxRow = row;

      while (head < queue.length) {
        const [currentCol, currentRow] = queue[head];
        head += 1;
        count += 1;
        minCol = Math.min(minCol, currentCol);
        maxCol = Math.max(maxCol, currentCol);
        minRow = Math.min(minRow, currentRow);
        maxRow = Math.max(maxRow, currentRow);

        const neighbors = [
          [currentCol - 1, currentRow],
          [currentCol + 1, currentRow],
          [currentCol, currentRow - 1],
          [currentCol, currentRow + 1],
        ];

        for (const [nextCol, nextRow] of neighbors) {
          if (nextCol < 0 || nextRow < 0 || nextCol >= width || nextRow >= height) {
            continue;
          }
          const nextIndex = nextRow * width + nextCol;
          if (!mask[nextIndex] || visited[nextIndex]) {
            continue;
          }
          visited[nextIndex] = 1;
          queue.push([nextCol, nextRow]);
        }
      }

      const boxWidth = (maxCol - minCol + 1) * step;
      const boxHeight = (maxRow - minRow + 1) * step;
      if (count < minCells || boxWidth < 36 || boxHeight < 20) {
        continue;
      }

      boxes.push({
        x: minCol * step,
        y: minRow * step,
        width: Math.min(sourceCanvas.width - minCol * step, boxWidth),
        height: Math.min(sourceCanvas.height - minRow * step, boxHeight),
      });
    }
  }

  return boxes.sort((left, right) => {
    const rowDelta = Math.abs(left.y - right.y);
    if (rowDelta > 18) {
      return left.y - right.y;
    }
    return left.x - right.x;
  });
}

function samplePaletteSwatchRgb(sourceCanvas, box) {
  const ctx = sourceCanvas.getContext("2d", { willReadFrequently: true });
  const marginX = Math.max(2, Math.round(box.width * 0.1));
  const marginY = Math.max(2, Math.round(box.height * 0.14));
  const ringPoints = [
    [box.x + marginX, box.y + marginY],
    [box.x + box.width / 2, box.y + marginY],
    [box.x + box.width - marginX, box.y + marginY],
    [box.x + marginX, box.y + box.height - marginY],
    [box.x + box.width / 2, box.y + box.height - marginY],
    [box.x + box.width - marginX, box.y + box.height - marginY],
    [box.x + marginX, box.y + box.height / 2],
    [box.x + box.width - marginX, box.y + box.height / 2],
  ];
  const patchRadius = Math.max(1, Math.round(Math.min(box.width, box.height) * 0.035));
  const patchMedians = ringPoints.map(([x, y]) => {
    const pixels = [];
    const centerX = Math.round(x);
    const centerY = Math.round(y);
    for (let offsetY = -patchRadius; offsetY <= patchRadius; offsetY += 1) {
      for (let offsetX = -patchRadius; offsetX <= patchRadius; offsetX += 1) {
        const safeX = clampNumber(centerX + offsetX, 0, sourceCanvas.width - 1);
        const safeY = clampNumber(centerY + offsetY, 0, sourceCanvas.height - 1);
        const data = ctx.getImageData(safeX, safeY, 1, 1).data;
        pixels.push([data[0], data[1], data[2]]);
      }
    }
    return medianRgbList(pixels);
  });

  if (!patchMedians.length) {
    return [0, 0, 0];
  }

  if (patchMedians.length === 1) {
    return patchMedians[0];
  }

  const channelMedian = medianRgbList(patchMedians);
  const ranked = patchMedians
    .map((rgb) => ({
      rgb,
      cohesion: patchMedians.reduce((sum, other) => sum + getPerceptualDistance(rgb, other), 0),
      medianDistance: getPerceptualDistance(rgb, channelMedian),
    }))
    .sort(
      (left, right) =>
        left.cohesion - right.cohesion ||
        left.medianDistance - right.medianDistance,
    );

  return ranked[0]?.rgb || channelMedian;
}

function scoreManualSwatchBox(sourceCanvas, box) {
  const ctx = sourceCanvas.getContext("2d", { willReadFrequently: true });
  const startX = Math.max(0, Math.floor(box.x));
  const startY = Math.max(0, Math.floor(box.y));
  const width = Math.max(2, Math.min(sourceCanvas.width - startX, Math.floor(box.width)));
  const height = Math.max(2, Math.min(sourceCanvas.height - startY, Math.floor(box.height)));
  const imageData = ctx.getImageData(startX, startY, width, height);
  let active = 0;

  for (let index = 0; index < imageData.data.length; index += 4) {
    if (
      isPotentialSwatchPixel(
        imageData.data[index],
        imageData.data[index + 1],
        imageData.data[index + 2],
        imageData.data[index + 3],
      )
    ) {
      active += 1;
    }
  }

  const total = Math.max(1, width * height);
  const density = active / total;
  const area = width * height;
  const leftBias = 1 - (box.x + box.width * 0.5) / Math.max(1, sourceCanvas.width);
  return density * area * (0.75 + leftBias * 0.35);
}

function detectBestManualSwatchBox(sourceCanvas) {
  const boxes = extractSwatchBoxesFromCanvas(sourceCanvas, { step: 2 });
  if (!boxes.length) {
    return { x: 0, y: 0, width: sourceCanvas.width, height: sourceCanvas.height };
  }

  return [...boxes]
    .map((box) => ({
      box,
      score: scoreManualSwatchBox(sourceCanvas, box),
    }))
    .sort((left, right) => right.score - left.score)[0].box;
}

function buildManualSelectionSwatch(sourceCanvas) {
  const swatchBox = detectBestManualSwatchBox(sourceCanvas);
  return {
    swatchIndex: paletteReviewState.detections.length + 1,
    rgb: samplePaletteSwatchRgb(sourceCanvas, swatchBox),
    box: { ...swatchBox },
  };
}

function sampleMedianRgbFromCanvasPoint(sourceCanvas, x, y, radius = 2) {
  const ctx = sourceCanvas.getContext("2d", { willReadFrequently: true });
  const pixels = [];
  const px = Math.round(x);
  const py = Math.round(y);
  for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
    for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
      const safeX = clampNumber(px + offsetX, 0, sourceCanvas.width - 1);
      const safeY = clampNumber(py + offsetY, 0, sourceCanvas.height - 1);
      const data = ctx.getImageData(safeX, safeY, 1, 1).data;
      pixels.push([data[0], data[1], data[2]]);
    }
  }
  return medianRgbList(pixels);
}

function sampleExactRgbFromCanvasPoint(sourceCanvas, x, y) {
  const ctx = sourceCanvas.getContext("2d", { willReadFrequently: true });
  const px = clampNumber(Math.round(x), 0, sourceCanvas.width - 1);
  const py = clampNumber(Math.round(y), 0, sourceCanvas.height - 1);
  const data = ctx.getImageData(px, py, 1, 1).data;
  return [data[0], data[1], data[2]];
}

function samplePixelGridFromCanvasPoint(sourceCanvas, x, y, radius = 2) {
  const ctx = sourceCanvas.getContext("2d", { willReadFrequently: true });
  const pixels = [];
  const px = Math.round(x);
  const py = Math.round(y);
  for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
    for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
      const safeX = clampNumber(px + offsetX, 0, sourceCanvas.width - 1);
      const safeY = clampNumber(py + offsetY, 0, sourceCanvas.height - 1);
      const data = ctx.getImageData(safeX, safeY, 1, 1).data;
      pixels.push({
        x: safeX,
        y: safeY,
        rgb: [data[0], data[1], data[2]],
      });
    }
  }
  return pixels;
}

function extractPaletteSwatchesFromCanvas(sourceCanvas) {
  const boxes = extractSwatchBoxesFromCanvas(sourceCanvas);
  return boxes.map((box, index) => ({
    swatchIndex: index + 1,
    rgb: samplePaletteSwatchRgb(sourceCanvas, box),
    box,
  }));
}

function extractPaletteEntriesByOcr(sourceCanvas) {
  const swatches = extractPaletteSwatchesFromCanvas(sourceCanvas);
  const entries = [];
  const seenCodes = new Set();

  for (const swatch of swatches) {
    const matched = recognizeSwatchCode(sourceCanvas, swatch);
    if (!matched || seenCodes.has(matched.code)) {
      continue;
    }
    seenCodes.add(matched.code);
    entries.push({
      code: matched.code,
      rgb: swatch.rgb,
      standardRgb: swatch.rgb,
      score: matched.score,
      swatchIndex: swatch.swatchIndex,
    });
  }

  return {
    entries: entries.sort((left, right) => left.code.localeCompare(right.code)),
    swatchCount: swatches.length,
  };
}

function analyzePaletteCardCanvas(sourceCanvas) {
  return extractPaletteSwatchesFromCanvas(sourceCanvas).map((swatch) => {
    const matched = recognizeSwatchCode(sourceCanvas, swatch);
    return {
      ...swatch,
      code: matched?.code || "",
      score: matched?.score || 0,
    };
  });
}

function setPaletteReviewData(sourceCanvas, sourceName, detections, options = {}) {
  const nextGrid =
    options.grid ||
    createDefaultPaletteReviewGrid(sourceCanvas, detections || []);
  paletteReviewState = {
    sourceCanvas,
    sourceName,
    detections: detections || [],
    selection: null,
    display: null,
    activeIndex: -1,
    manualRgb: null,
    manualPoint: null,
    detailDisplay: null,
    detailPixels: [],
    grid: {
      ...nextGrid,
      rect: nextGrid?.rect ? { ...nextGrid.rect } : null,
    },
  };
  saveStateToStorage();
}

function getRecognizedEntriesFromDetections(detections) {
  const byCode = new Map();
  for (const item of detections) {
    if (!item.code) {
      continue;
    }
    const existing = byCode.get(item.code);
    if (!existing || item.score > existing.score) {
      byCode.set(item.code, {
        code: item.code,
        rgb: item.rgb,
        standardRgb: item.rgb,
        score: item.score,
      });
    }
  }
  return [...byCode.values()].sort((left, right) => left.code.localeCompare(right.code));
}

function setPaletteReviewStatus(message, isError = false) {
  if (!paletteReviewStatus) {
    return;
  }
  paletteReviewStatus.textContent = message;
  paletteReviewStatus.style.color = isError ? "#c13d3d" : "#745f4b";
}

function renderPaletteReviewCodeList() {
  const dataList = document.querySelector("#paletteReviewCodeList");
  if (!dataList) {
    return;
  }
  dataList.innerHTML = getCodeCandidateList()
    .map((code) => `<option value="${code}"></option>`)
    .join("");
}

function createCanvasFromRegion(sourceCanvas, box) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(box.width));
  canvas.height = Math.max(1, Math.floor(box.height));
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(
    sourceCanvas,
    Math.floor(box.x),
    Math.floor(box.y),
    Math.floor(box.width),
    Math.floor(box.height),
    0,
    0,
    canvas.width,
    canvas.height,
  );
  return canvas;
}

function clonePaletteGrid(grid) {
  if (!grid) {
    return null;
  }
  return {
    ...grid,
    rect: grid.rect ? { ...grid.rect } : null,
  };
}

function normalizePaletteGridRect(sourceCanvas, rect) {
  if (!sourceCanvas || !rect) {
    return null;
  }
  const safeRect = {
    x: clampNumber(rect.x, 0, Math.max(0, sourceCanvas.width - 1)),
    y: clampNumber(rect.y, 0, Math.max(0, sourceCanvas.height - 1)),
    width: clampNumber(rect.width, 12, sourceCanvas.width),
    height: clampNumber(rect.height, 12, sourceCanvas.height),
  };
  safeRect.width = Math.min(safeRect.width, sourceCanvas.width - safeRect.x);
  safeRect.height = Math.min(safeRect.height, sourceCanvas.height - safeRect.y);
  return safeRect;
}

function getPaletteReviewGrid() {
  if (!paletteReviewState.sourceCanvas) {
    return null;
  }
  if (!paletteReviewState.grid) {
    paletteReviewState.grid = createDefaultPaletteReviewGrid(paletteReviewState.sourceCanvas, paletteReviewState.detections || []);
  }
  if (!paletteReviewState.grid.rect) {
    paletteReviewState.grid.rect = createDefaultPaletteReviewGrid(paletteReviewState.sourceCanvas, paletteReviewState.detections || []).rect;
  }
  paletteReviewState.grid.rect = normalizePaletteGridRect(paletteReviewState.sourceCanvas, paletteReviewState.grid.rect);
  return paletteReviewState.grid;
}

function setPaletteGridStatus(message, isError = false) {
  if (!paletteGridStatus) {
    return;
  }
  paletteGridStatus.textContent = message;
  paletteGridStatus.style.color = isError ? "#c13d3d" : "#745f4b";
}

function getPaletteGridCellBoxes(grid) {
  if (!grid?.rect || !grid.rows || !grid.cols) {
    return [];
  }
  const boxes = [];
  for (let row = 0; row < grid.rows; row += 1) {
    const top = grid.rect.y + (grid.rect.height * row) / grid.rows;
    const bottom = grid.rect.y + (grid.rect.height * (row + 1)) / grid.rows;
    for (let col = 0; col < grid.cols; col += 1) {
      const left = grid.rect.x + (grid.rect.width * col) / grid.cols;
      const right = grid.rect.x + (grid.rect.width * (col + 1)) / grid.cols;
      boxes.push({
        row,
        col,
        x: left,
        y: top,
        width: Math.max(1, right - left),
        height: Math.max(1, bottom - top),
      });
    }
  }
  return boxes;
}

function getCurrentPaletteReviewSelectionBox() {
  const activeItem =
    paletteReviewState.activeIndex >= 0 ? paletteReviewState.detections[paletteReviewState.activeIndex] : null;
  return activeItem?.box || paletteReviewState.selection || null;
}

function getRectCenter(rect) {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2,
  };
}

function shrinkPaletteGridCellBox(cellBox, grid) {
  const gapXRatio = clampNumber(Number(grid?.gapXRatio ?? 0.12), 0, 0.48);
  const gapYRatio = clampNumber(Number(grid?.gapYRatio ?? 0.12), 0, 0.48);
  const insetX = cellBox.width * gapXRatio * 0.5;
  const insetY = cellBox.height * gapYRatio * 0.5;
  return {
    ...cellBox,
    x: cellBox.x + insetX,
    y: cellBox.y + insetY,
    width: Math.max(6, cellBox.width - insetX * 2),
    height: Math.max(6, cellBox.height - insetY * 2),
  };
}

function getPaletteGridDisplayRect(display, rect) {
  return {
    x: rect.x * display.scale,
    y: rect.y * display.scale,
    width: rect.width * display.scale,
    height: rect.height * display.scale,
  };
}

function getPaletteGridHandles(displayRect) {
  return [
    { key: "nw", x: displayRect.x, y: displayRect.y },
    { key: "ne", x: displayRect.x + displayRect.width, y: displayRect.y },
    { key: "sw", x: displayRect.x, y: displayRect.y + displayRect.height },
    { key: "se", x: displayRect.x + displayRect.width, y: displayRect.y + displayRect.height },
  ];
}

function hitPaletteGridHandle(point, displayRect) {
  const handles = getPaletteGridHandles(displayRect);
  const threshold = 16;
  for (const handle of handles) {
    if (Math.abs(point.x - handle.x) <= threshold && Math.abs(point.y - handle.y) <= threshold) {
      return handle.key;
    }
  }
  return "";
}

function pointInPaletteGridRect(point, displayRect) {
  return (
    point.x >= displayRect.x &&
    point.x <= displayRect.x + displayRect.width &&
    point.y >= displayRect.y &&
    point.y <= displayRect.y + displayRect.height
  );
}

function buildPaletteReviewDisplay() {
  if (!paletteReviewCanvas || !paletteReviewState.sourceCanvas) {
    return null;
  }

  const sourceCanvas = paletteReviewState.sourceCanvas;
  const width = paletteReviewCanvas.clientWidth || paletteReviewCanvas.parentElement?.clientWidth || 320;
  const safeWidth = Math.max(280, width);
  const scale = safeWidth / sourceCanvas.width;
  const height = Math.max(180, Math.round(sourceCanvas.height * scale));
  ensureCanvasSize(paletteReviewCanvas, safeWidth, height);
  return {
    scale,
    drawWidth: sourceCanvas.width * scale,
    drawHeight: sourceCanvas.height * scale,
    offsetX: 0,
    offsetY: 0,
  };
}

function getPaletteReviewPoint(event) {
  const rect = paletteReviewCanvas.getBoundingClientRect();
  const display = paletteReviewState.display;
  const localX = event.clientX - rect.left;
  const localY = event.clientY - rect.top;
  return {
    x: clampNumber((localX - display.offsetX) / display.scale, 0, paletteReviewState.sourceCanvas.width),
    y: clampNumber((localY - display.offsetY) / display.scale, 0, paletteReviewState.sourceCanvas.height),
  };
}

function hitPaletteDetection(point) {
  return paletteReviewState.detections.findIndex(
    (item) =>
      point.x >= item.box.x &&
      point.x <= item.box.x + item.box.width &&
      point.y >= item.box.y &&
      point.y <= item.box.y + item.box.height,
  );
}

function renderPaletteReview() {
  if (!paletteReviewCanvas || !paletteReviewCtx) {
    return;
  }

  if (!paletteReviewState.sourceCanvas) {
    ensureCanvasSize(paletteReviewCanvas, Math.max(280, paletteReviewCanvas.clientWidth || 320), 180);
    paletteReviewCtx.clearRect(0, 0, paletteReviewCanvas.clientWidth || 320, 180);
    paletteReviewCtx.fillStyle = "#6f6257";
    paletteReviewCtx.font = "600 14px 'Segoe UI'";
    paletteReviewCtx.fillText("上传颜色卡后，这里会显示识别框和色号结果。", 14, 28);
    renderPaletteReviewDetailV2();
    renderPaletteReviewList();
    return;
  }

  paletteReviewState.display = buildPaletteReviewDisplay();
  const { sourceCanvas, display, detections, selection, activeIndex } = paletteReviewState;
  const grid = getPaletteReviewGrid();
  if (paletteGridRowsInput && document.activeElement !== paletteGridRowsInput) {
    paletteGridRowsInput.value = String(grid?.rows || 5);
  }
  if (paletteGridColsInput && document.activeElement !== paletteGridColsInput) {
    paletteGridColsInput.value = String(grid?.cols || 10);
  }
  if (paletteGridGapXInput && document.activeElement !== paletteGridGapXInput) {
    paletteGridGapXInput.value = String(Math.round((grid?.gapXRatio || 0) * 100));
  }
  if (paletteGridGapYInput && document.activeElement !== paletteGridGapYInput) {
    paletteGridGapYInput.value = String(Math.round((grid?.gapYRatio || 0) * 100));
  }
  if (paletteGridEditInput) {
    paletteGridEditInput.checked = Boolean(grid?.enabled && grid?.editMode);
  }
  paletteReviewCtx.clearRect(0, 0, display.drawWidth, display.drawHeight);
  paletteReviewCtx.drawImage(sourceCanvas, 0, 0, display.drawWidth, display.drawHeight);

  for (let index = 0; index < detections.length; index += 1) {
    const item = detections[index];
    const x = item.box.x * display.scale;
    const y = item.box.y * display.scale;
    const width = item.box.width * display.scale;
    const height = item.box.height * display.scale;
    const isActive = index === activeIndex;

    paletteReviewCtx.strokeStyle = item.code ? (isActive ? "#2f6c73" : "#4bab72") : "#c13d3d";
    paletteReviewCtx.lineWidth = isActive ? 3 : 2;
    paletteReviewCtx.strokeRect(x, y, width, height);
    paletteReviewCtx.fillStyle = item.code ? "rgba(47,108,115,0.9)" : "rgba(193,61,61,0.9)";
    paletteReviewCtx.beginPath();
    paletteReviewCtx.arc(x + 10, y + 10, 8, 0, Math.PI * 2);
    paletteReviewCtx.fill();
    paletteReviewCtx.fillStyle = "#fff";
    paletteReviewCtx.font = "700 11px 'Segoe UI'";
    paletteReviewCtx.textAlign = "center";
    paletteReviewCtx.textBaseline = "middle";
    paletteReviewCtx.fillText(String(index + 1), x + 10, y + 10);

    if (item.sampleBox) {
      paletteReviewCtx.strokeStyle = "rgba(244, 198, 79, 0.98)";
      paletteReviewCtx.lineWidth = 2;
      paletteReviewCtx.setLineDash([4, 3]);
      paletteReviewCtx.strokeRect(
        item.sampleBox.x * display.scale,
        item.sampleBox.y * display.scale,
        item.sampleBox.width * display.scale,
        item.sampleBox.height * display.scale,
      );
      paletteReviewCtx.setLineDash([]);

      const autoPointX = (item.sampleBox.x + item.sampleBox.width / 2) * display.scale;
      const autoPointY = (item.sampleBox.y + item.sampleBox.height / 2) * display.scale;
      paletteReviewCtx.save();
      paletteReviewCtx.fillStyle = "rgba(44, 196, 198, 0.96)";
      paletteReviewCtx.strokeStyle = "rgba(255,255,255,0.92)";
      paletteReviewCtx.lineWidth = 1.4;
      paletteReviewCtx.beginPath();
      paletteReviewCtx.arc(autoPointX, autoPointY, isActive ? 4.2 : 3.2, 0, Math.PI * 2);
      paletteReviewCtx.fill();
      paletteReviewCtx.stroke();
      paletteReviewCtx.restore();
    }

    if (item.manualPoint) {
      const manualPointX = item.manualPoint.x * display.scale;
      const manualPointY = item.manualPoint.y * display.scale;
      paletteReviewCtx.save();
      paletteReviewCtx.strokeStyle = "#9d5333";
      paletteReviewCtx.lineWidth = 2;
      paletteReviewCtx.beginPath();
      paletteReviewCtx.moveTo(manualPointX - 6, manualPointY);
      paletteReviewCtx.lineTo(manualPointX + 6, manualPointY);
      paletteReviewCtx.moveTo(manualPointX, manualPointY - 6);
      paletteReviewCtx.lineTo(manualPointX, manualPointY + 6);
      paletteReviewCtx.stroke();
      paletteReviewCtx.fillStyle = "#9d5333";
      paletteReviewCtx.beginPath();
      paletteReviewCtx.arc(manualPointX, manualPointY, 3.2, 0, Math.PI * 2);
      paletteReviewCtx.fill();
      paletteReviewCtx.restore();
    }
  }

  if (grid?.enabled && grid.rect) {
    const workingBoxes = getPaletteGridCellBoxes(grid).map((cell) => shrinkPaletteGridCellBox(cell, grid));
    paletteReviewCtx.save();
    paletteReviewCtx.strokeStyle = "rgba(244, 198, 79, 0.9)";
    paletteReviewCtx.lineWidth = 1.5;
    paletteReviewCtx.setLineDash([5, 4]);
    for (const box of workingBoxes) {
      paletteReviewCtx.strokeRect(
        box.x * display.scale,
        box.y * display.scale,
        box.width * display.scale,
        box.height * display.scale,
      );
    }
    paletteReviewCtx.setLineDash([]);
    paletteReviewCtx.restore();
  }

  if (selection) {
    paletteReviewCtx.strokeStyle = "#f4c64f";
    paletteReviewCtx.lineWidth = 2;
    paletteReviewCtx.setLineDash([6, 4]);
    paletteReviewCtx.strokeRect(
      selection.x * display.scale,
      selection.y * display.scale,
      selection.width * display.scale,
      selection.height * display.scale,
    );
    paletteReviewCtx.setLineDash([]);
  }

  if (grid?.enabled && grid.rect) {
    const displayRect = getPaletteGridDisplayRect(display, grid.rect);
    paletteReviewCtx.save();
    paletteReviewCtx.strokeStyle = "rgba(47,108,115,0.92)";
    paletteReviewCtx.lineWidth = grid.editMode ? 3 : 2;
    paletteReviewCtx.strokeRect(displayRect.x, displayRect.y, displayRect.width, displayRect.height);
    for (let row = 1; row < grid.rows; row += 1) {
      const y = displayRect.y + (displayRect.height * row) / grid.rows;
      paletteReviewCtx.beginPath();
      paletteReviewCtx.moveTo(displayRect.x, y);
      paletteReviewCtx.lineTo(displayRect.x + displayRect.width, y);
      paletteReviewCtx.stroke();
    }
    for (let col = 1; col < grid.cols; col += 1) {
      const x = displayRect.x + (displayRect.width * col) / grid.cols;
      paletteReviewCtx.beginPath();
      paletteReviewCtx.moveTo(x, displayRect.y);
      paletteReviewCtx.lineTo(x, displayRect.y + displayRect.height);
      paletteReviewCtx.stroke();
    }
    if (grid.editMode) {
      paletteReviewCtx.fillStyle = "#fffdf8";
      paletteReviewCtx.strokeStyle = "#2f6c73";
      paletteReviewCtx.lineWidth = 2;
      for (const handle of getPaletteGridHandles(displayRect)) {
        paletteReviewCtx.beginPath();
        paletteReviewCtx.arc(handle.x, handle.y, 7, 0, Math.PI * 2);
        paletteReviewCtx.fill();
        paletteReviewCtx.stroke();
      }
    }
    paletteReviewCtx.restore();
  }

  renderPaletteReviewDetailV2();
  renderPaletteReviewList();
}

function renderPaletteReviewDetail() {
  if (!paletteReviewDetailCanvas || !paletteReviewDetailCtx) {
    return;
  }

  ensureCanvasSize(paletteReviewDetailCanvas, 220, 120);
  paletteReviewDetailCtx.clearRect(0, 0, 220, 120);
  paletteReviewDetailCtx.fillStyle = "#fffdf8";
  paletteReviewDetailCtx.fillRect(0, 0, 220, 120);

  const activeItem =
    paletteReviewState.activeIndex >= 0 ? paletteReviewState.detections[paletteReviewState.activeIndex] : null;
  const selection = activeItem ? activeItem.box : paletteReviewState.selection;
  if (!paletteReviewState.sourceCanvas || !selection) {
    paletteReviewState.detailPixels = [];
    paletteReviewDetailCtx.fillStyle = "#6f6257";
    paletteReviewDetailCtx.font = "600 13px 'Segoe UI'";
    paletteReviewDetailCtx.fillText("点击右侧结果，或在整图中框选一个色块。", 12, 28);
    return;
  }

  const previewCanvas = createCanvasFromRegion(paletteReviewState.sourceCanvas, selection);
  const scale = Math.min(196 / previewCanvas.width, 88 / previewCanvas.height);
  const drawWidth = previewCanvas.width * scale;
  const drawHeight = previewCanvas.height * scale;
  const offsetX = (220 - drawWidth) / 2;
  const offsetY = 10 + (88 - drawHeight) / 2;
  paletteReviewDetailCtx.drawImage(previewCanvas, offsetX, offsetY, drawWidth, drawHeight);
  paletteReviewDetailCtx.strokeStyle = "#d9c9b6";
  paletteReviewDetailCtx.strokeRect(offsetX, offsetY, drawWidth, drawHeight);
  if (activeItem?.sampleBox) {
    const innerX = ((activeItem.sampleBox.x - selection.x) / selection.width) * drawWidth;
    const innerY = ((activeItem.sampleBox.y - selection.y) / selection.height) * drawHeight;
    const innerW = (activeItem.sampleBox.width / selection.width) * drawWidth;
    const innerH = (activeItem.sampleBox.height / selection.height) * drawHeight;
    paletteReviewDetailCtx.strokeStyle = "#f4c64f";
    paletteReviewDetailCtx.setLineDash([4, 3]);
    paletteReviewDetailCtx.strokeRect(offsetX + innerX, offsetY + innerY, innerW, innerH);
    paletteReviewDetailCtx.setLineDash([]);
  }
  paletteReviewDetailCtx.fillStyle = "#302116";
  paletteReviewDetailCtx.font = "700 12px 'Segoe UI'";
  const label = activeItem?.code || paletteReviewCodeInput?.value?.trim().toUpperCase() || "待填写";
  paletteReviewDetailCtx.fillText(`当前色号：${label}`, 12, 108);
}

function renderPaletteReviewDetailV2() {
  if (!paletteReviewDetailCanvas || !paletteReviewDetailCtx) {
    return;
  }

  const canvasWidth = Math.max(
    220,
    Math.round(paletteReviewDetailCanvas.parentElement?.clientWidth || paletteReviewDetailCanvas.clientWidth || 220) - 4,
  );
  const canvasHeight = Math.max(132, Math.round(canvasWidth * 0.58));
  ensureCanvasSize(paletteReviewDetailCanvas, canvasWidth, canvasHeight);
  paletteReviewDetailCanvas.style.width = `${canvasWidth}px`;
  paletteReviewDetailCtx.clearRect(0, 0, canvasWidth, canvasHeight);
  paletteReviewDetailCtx.fillStyle = "#fffdf8";
  paletteReviewDetailCtx.fillRect(0, 0, canvasWidth, canvasHeight);
  paletteReviewState.detailDisplay = null;

  const activeItem =
    paletteReviewState.activeIndex >= 0 ? paletteReviewState.detections[paletteReviewState.activeIndex] : null;
  const selection = activeItem ? activeItem.box : paletteReviewState.selection;
  if (!paletteReviewState.sourceCanvas || !selection) {
    paletteReviewDetailCtx.fillStyle = "#6f6257";
    paletteReviewDetailCtx.font = "600 13px 'Segoe UI'";
    paletteReviewDetailCtx.fillText("点击左侧识别框，或重新拖一个手动框选区域。", 12, 28);
    if (paletteReviewColorValue) {
      paletteReviewColorValue.textContent = "直接在右侧放大预览上点真实像素，或点下面 5x5 像素板。保存时会优先使用你手选的颜色。";
    }
    if (paletteReviewPixelGrid) {
      paletteReviewPixelGrid.innerHTML = "";
    }
    return;
  }

  const previewCanvas = createCanvasFromRegion(paletteReviewState.sourceCanvas, selection);
  const previewMaxWidth = Math.max(180, canvasWidth - 24);
  const previewMaxHeight = Math.max(84, canvasHeight - 48);
  const scale = Math.min(previewMaxWidth / previewCanvas.width, previewMaxHeight / previewCanvas.height);
  const drawWidth = previewCanvas.width * scale;
  const drawHeight = previewCanvas.height * scale;
  const offsetX = (canvasWidth - drawWidth) / 2;
  const offsetY = 10 + (previewMaxHeight - drawHeight) / 2;
  const footerY = canvasHeight - 14;
  paletteReviewState.detailDisplay = {
    selection: { ...selection },
    canvasWidth,
    canvasHeight,
    offsetX,
    offsetY,
    drawWidth,
    drawHeight,
  };
  paletteReviewDetailCtx.drawImage(previewCanvas, offsetX, offsetY, drawWidth, drawHeight);
  paletteReviewDetailCtx.strokeStyle = "#d9c9b6";
  paletteReviewDetailCtx.strokeRect(offsetX, offsetY, drawWidth, drawHeight);

  const sampleBox = activeItem?.sampleBox;
  if (sampleBox) {
    const innerX = offsetX + ((sampleBox.x - selection.x) / selection.width) * drawWidth;
    const innerY = offsetY + ((sampleBox.y - selection.y) / selection.height) * drawHeight;
    const innerW = (sampleBox.width / selection.width) * drawWidth;
    const innerH = (sampleBox.height / selection.height) * drawHeight;
    paletteReviewDetailCtx.strokeStyle = "#f4c64f";
    paletteReviewDetailCtx.setLineDash([4, 3]);
    paletteReviewDetailCtx.strokeRect(innerX, innerY, innerW, innerH);
    paletteReviewDetailCtx.setLineDash([]);
  }

  const previewPoint =
    paletteReviewState.manualPoint &&
    paletteReviewState.manualPoint.x >= selection.x &&
    paletteReviewState.manualPoint.x <= selection.x + selection.width &&
    paletteReviewState.manualPoint.y >= selection.y &&
    paletteReviewState.manualPoint.y <= selection.y + selection.height
      ? paletteReviewState.manualPoint
      : sampleBox
        ? {
            x: sampleBox.x + sampleBox.width / 2,
            y: sampleBox.y + sampleBox.height / 2,
          }
        : {
            x: selection.x + selection.width / 2,
            y: selection.y + selection.height / 2,
          };
  const manualPointInSelection =
    paletteReviewState.manualPoint &&
    paletteReviewState.manualPoint.x >= selection.x &&
    paletteReviewState.manualPoint.x <= selection.x + selection.width &&
    paletteReviewState.manualPoint.y >= selection.y &&
    paletteReviewState.manualPoint.y <= selection.y + selection.height
      ? paletteReviewState.manualPoint
      : null;
  const autoPointInSelection = previewPoint;

  if (autoPointInSelection) {
    const autoPointX = offsetX + ((autoPointInSelection.x - selection.x) / selection.width) * drawWidth;
    const autoPointY = offsetY + ((autoPointInSelection.y - selection.y) / selection.height) * drawHeight;
    paletteReviewDetailCtx.save();
    paletteReviewDetailCtx.fillStyle = manualPointInSelection ? "rgba(44, 196, 198, 0.65)" : "rgba(44, 196, 198, 0.96)";
    paletteReviewDetailCtx.strokeStyle = "rgba(255,255,255,0.92)";
    paletteReviewDetailCtx.lineWidth = 1.2;
    paletteReviewDetailCtx.beginPath();
    paletteReviewDetailCtx.arc(autoPointX, autoPointY, 4, 0, Math.PI * 2);
    paletteReviewDetailCtx.fill();
    paletteReviewDetailCtx.stroke();
    paletteReviewDetailCtx.restore();
  }

  if (manualPointInSelection) {
    const markerX = offsetX + ((manualPointInSelection.x - selection.x) / selection.width) * drawWidth;
    const markerY = offsetY + ((manualPointInSelection.y - selection.y) / selection.height) * drawHeight;
    paletteReviewDetailCtx.save();
    paletteReviewDetailCtx.strokeStyle = "#9d5333";
    paletteReviewDetailCtx.lineWidth = 2;
    paletteReviewDetailCtx.beginPath();
    paletteReviewDetailCtx.moveTo(markerX - 7, markerY);
    paletteReviewDetailCtx.lineTo(markerX + 7, markerY);
    paletteReviewDetailCtx.moveTo(markerX, markerY - 7);
    paletteReviewDetailCtx.lineTo(markerX, markerY + 7);
    paletteReviewDetailCtx.stroke();
    paletteReviewDetailCtx.fillStyle = "#9d5333";
    paletteReviewDetailCtx.beginPath();
    paletteReviewDetailCtx.arc(markerX, markerY, 3.8, 0, Math.PI * 2);
    paletteReviewDetailCtx.fill();
    paletteReviewDetailCtx.strokeStyle = "#fffdf8";
    paletteReviewDetailCtx.lineWidth = 1.8;
    paletteReviewDetailCtx.stroke();
    paletteReviewDetailCtx.restore();
  }

  if (manualPointInSelection) {
    paletteReviewDetailCtx.fillStyle = "#9d5333";
    paletteReviewDetailCtx.font = "600 10px 'Segoe UI'";
    paletteReviewDetailCtx.fillText("手选点", Math.max(12, canvasWidth - 56), footerY);
  } else if (autoPointInSelection) {
    paletteReviewDetailCtx.fillStyle = "rgba(44, 196, 198, 0.96)";
    paletteReviewDetailCtx.font = "600 10px 'Segoe UI'";
    paletteReviewDetailCtx.fillText("自动点", Math.max(12, canvasWidth - 56), footerY);
  }

  paletteReviewDetailCtx.fillStyle = "#302116";
  paletteReviewDetailCtx.font = "700 12px 'Segoe UI'";
  const label = activeItem?.code || paletteReviewCodeInput?.value?.trim().toUpperCase() || "待填写";
  paletteReviewDetailCtx.fillText(`当前色号：${label}`, 12, footerY);

  const effectiveRgb = paletteReviewState.manualRgb || activeItem?.manualRgb || activeItem?.rgb || null;
  if (paletteReviewColorValue) {
    paletteReviewColorValue.textContent = effectiveRgb
      ? `当前取色：${formatRgb(effectiveRgb)}  ${rgbToHex(effectiveRgb)}${paletteReviewState.manualRgb ? `（手选点 ${Math.round(manualPointInSelection?.x || 0)},${Math.round(manualPointInSelection?.y || 0)}）` : "（自动主色）"}`
      : "直接在右侧放大预览上点真实像素，或点下面 5x5 像素板。保存时会优先使用你手选的颜色。";
  }

  if (paletteReviewPixelGrid) {
    const pixels = previewPoint
      ? samplePixelGridFromCanvasPoint(paletteReviewState.sourceCanvas, previewPoint.x, previewPoint.y, 2)
      : [];
    paletteReviewState.detailPixels = pixels;
    paletteReviewPixelGrid.innerHTML = pixels.length
      ? `
        <div class="palette-pixel-grid-label">手动取色板 · 5x5 像素</div>
        <div class="palette-pixel-grid-cells">
          ${pixels
            .map((item, index) =>
              `<button type="button" class="palette-pixel-cell${paletteReviewState.manualPoint && Math.round(paletteReviewState.manualPoint.x) === item.x && Math.round(paletteReviewState.manualPoint.y) === item.y ? " is-active" : ""}" data-palette-pixel-index="${index}" title="${item.x},${item.y} ${formatRgb(item.rgb)}" style="background:${rgbToHex(item.rgb)}"></button>`,
            )
            .join("")}
        </div>
        <p class="empty-text" style="margin:0;">点任意小格，直接把那个真实像素设成手动取色点。</p>
      `
      : "";
  } else {
    paletteReviewState.detailPixels = [];
  }
}

function getDetailCanvasClientPoint(event) {
  if (event?.touches?.length) {
    return {
      clientX: event.touches[0].clientX,
      clientY: event.touches[0].clientY,
    };
  }
  if (event?.changedTouches?.length) {
    return {
      clientX: event.changedTouches[0].clientX,
      clientY: event.changedTouches[0].clientY,
    };
  }
  return {
    clientX: event.clientX,
    clientY: event.clientY,
  };
}

function handlePaletteReviewDetailPointerDown(event) {
  try {
    const detail = paletteReviewState.detailDisplay;
    if (!detail || !paletteReviewState.sourceCanvas) {
      setPaletteReviewStatus("放大取色区还没准备好，请先在左侧选中一个色块。", true);
      return;
    }

    event.preventDefault?.();
    event.stopPropagation?.();

    const clientPoint = getDetailCanvasClientPoint(event);
    const rect = paletteReviewDetailCanvas.getBoundingClientRect();
    const scaleX = rect.width > 0 ? detail.canvasWidth / rect.width : 1;
    const scaleY = rect.height > 0 ? detail.canvasHeight / rect.height : 1;
    const localX = (clientPoint.clientX - rect.left) * scaleX;
    const localY = (clientPoint.clientY - rect.top) * scaleY;
    setPaletteReviewStatus(`收到点击：画布 ${Math.round(localX)},${Math.round(localY)}。正在取色...`);
    const clampedLocalX = clampNumber(localX, detail.offsetX, detail.offsetX + detail.drawWidth);
    const clampedLocalY = clampNumber(localY, detail.offsetY, detail.offsetY + detail.drawHeight);
    const snappedToImage = Math.abs(clampedLocalX - localX) > 0.5 || Math.abs(clampedLocalY - localY) > 0.5;
    const ratioX = (clampedLocalX - detail.offsetX) / Math.max(1, detail.drawWidth);
    const ratioY = (clampedLocalY - detail.offsetY) / Math.max(1, detail.drawHeight);
    const sourceX = detail.selection.x + ratioX * detail.selection.width;
    const sourceY = detail.selection.y + ratioY * detail.selection.height;
    const rgb = sampleExactRgbFromCanvasPoint(paletteReviewState.sourceCanvas, sourceX, sourceY);
    paletteReviewState.manualRgb = rgb;
    paletteReviewState.manualPoint = {
      x: Math.round(sourceX),
      y: Math.round(sourceY),
    };
    if (paletteReviewState.activeIndex >= 0 && paletteReviewState.detections[paletteReviewState.activeIndex]) {
      paletteReviewState.detections[paletteReviewState.activeIndex].manualRgb = [...rgb];
      paletteReviewState.detections[paletteReviewState.activeIndex].manualPoint = {
        x: Math.round(sourceX),
        y: Math.round(sourceY),
      };
    }
    if (paletteReviewColorValue) {
      paletteReviewColorValue.textContent = `当前取色：${formatRgb(rgb)}  ${rgbToHex(rgb)}（手选点 ${Math.round(sourceX)},${Math.round(sourceY)}）`;
    }
    setPaletteReviewStatus(
      `${snappedToImage ? "点击已吸附到最近图内像素：" : "已手动选择真实像素："}${Math.round(sourceX)},${Math.round(sourceY)} ${formatRgb(rgb)} ${rgbToHex(rgb)}。保存时会优先使用这次手选颜色。`,
    );
    saveStateToStorage();
    renderPaletteReview();
  } catch (error) {
    setPaletteReviewStatus(`手动取色报错：${error?.message || error}`, true);
    console.error("palette review detail pick failed", error);
  }
}

function handlePaletteReviewDetailDelegated(event) {
  const target = event.target;
  if (!target || target.id !== "paletteReviewDetailCanvas") {
    return;
  }
  handlePaletteReviewDetailPointerDown(event);
}

function applyManualPalettePixelSelection(index) {
  const pixel = paletteReviewState.detailPixels?.[index];
  if (!pixel) {
    setPaletteReviewStatus("当前没有可用的像素取色点。请先选中一个色卡。", true);
    return;
  }

  paletteReviewState.manualRgb = [...pixel.rgb];
  paletteReviewState.manualPoint = {
    x: pixel.x,
    y: pixel.y,
  };
  if (paletteReviewState.activeIndex >= 0 && paletteReviewState.detections[paletteReviewState.activeIndex]) {
    paletteReviewState.detections[paletteReviewState.activeIndex].manualRgb = [...pixel.rgb];
    paletteReviewState.detections[paletteReviewState.activeIndex].manualPoint = {
      x: pixel.x,
      y: pixel.y,
    };
  }
  setPaletteReviewStatus(`已手动选择真实颜色：${formatRgb(pixel.rgb)} ${rgbToHex(pixel.rgb)}。保存时会优先使用这次手选颜色。`);
  saveStateToStorage();
  renderPaletteReview();
}

function resetPaletteReviewManualColor() {
  paletteReviewState.manualRgb = null;
  paletteReviewState.manualPoint = null;
  setPaletteReviewStatus("已清除手选颜色，保存时会恢复使用自动检测到的内部色块颜色。");
  saveStateToStorage();
  renderPaletteReview();
}

function renderPaletteReviewList() {
  if (!paletteReviewList) {
    return;
  }

  const detections = paletteReviewState.detections || [];
  if (!detections.length) {
    paletteReviewList.innerHTML = `<p class="empty-text">上传颜色卡后，这里会列出每个检测到的色块。</p>`;
    return;
  }

  paletteReviewList.innerHTML = detections
    .map((item, index) => {
      const activeClass = index === paletteReviewState.activeIndex ? " active" : "";
      const statusClass = item.code ? "ok" : "pending";
      return `
        <button type="button" class="palette-review-item${activeClass}" data-review-index="${index}">
          <span class="palette-review-chip ${statusClass}">${index + 1}</span>
          <span class="palette-review-swatch" style="background:${rgbToHex(item.rgb)}"></span>
          <span class="palette-review-meta">
            <strong>${item.code || "待补"}</strong>
            <small>${item.code ? `置信 ${(item.score || 0).toFixed(2)}` : "点此修正"}</small>
          </span>
        </button>
      `;
    })
    .join("");
}

function updatePaletteReviewModeUi() {
  const mode = getState().paletteReviewMode || "color-first";
  if (paletteReviewModeSelect && document.activeElement !== paletteReviewModeSelect) {
    paletteReviewModeSelect.value = mode;
  }
  if (paletteReviewRetryBtn) {
    paletteReviewRetryBtn.disabled = mode !== "ocr-first";
    paletteReviewRetryBtn.textContent = mode === "ocr-first" ? "后端重识别文字" : "当前模式不识别文字";
  }
  if (paletteReviewSaveBtn) {
    paletteReviewSaveBtn.textContent = mode === "ocr-first" ? "按当前色号保存色卡" : "按手填色号保存色卡";
  }
}

function removePaletteEntryByCodeIfUnused(code) {
  if (!code) {
    return;
  }
  const stillUsed = paletteReviewState.detections.some((item) => item.code === code);
  if (stillUsed) {
    return;
  }
  patchState({
    palette: getState().palette.filter((entry) => entry.code !== code),
  });
  resetAnalysis();
}

function deleteActivePaletteReviewDetection() {
  const activeIndex = paletteReviewState.activeIndex;
  if (activeIndex < 0 || activeIndex >= paletteReviewState.detections.length) {
    setPaletteReviewStatus("请先点选一个误识别框，再删除。", true);
    return;
  }

  const [removed] = paletteReviewState.detections.splice(activeIndex, 1);
  paletteReviewState.activeIndex = -1;
  paletteReviewState.selection = null;
  paletteReviewState.manualRgb = null;
  paletteReviewState.manualPoint = null;
  if (paletteReviewCodeInput) {
    paletteReviewCodeInput.value = "";
  }
  removePaletteEntryByCodeIfUnused(removed?.code || "");
  setPaletteReviewStatus(
    removed?.code
      ? `已删除色块 ${removed.swatchIndex}（${removed.code}）。现在可以在左侧重新拖框，把拆分后的区域重新加入色卡。`
      : "已删除当前误识别框。现在可以在左侧重新拖框，把拆分后的区域重新加入色卡。",
  );
  saveStateToStorage();
  renderPaletteReview();
}

function recalibratePaletteWithSwatches(swatches, setName) {
  const currentPalette = [...getState().palette];
  if (!currentPalette.length || !swatches.length) {
    return 0;
  }

  const unusedSwatches = [...swatches];
  const recalibrated = currentPalette.map((entry) => {
    let bestIndex = 0;
    let bestDistance = Number.POSITIVE_INFINITY;
    for (let index = 0; index < unusedSwatches.length; index += 1) {
      const distance = getRgbDistance(entry.rgb, unusedSwatches[index].rgb);
      if (distance < bestDistance) {
        bestDistance = distance;
        bestIndex = index;
      }
    }

    const [matchedSwatch] = unusedSwatches.splice(bestIndex, 1);
    return matchedSwatch
      ? {
          ...entry,
          rgb: matchedSwatch.rgb,
          standardRgb: matchedSwatch.rgb,
        }
      : entry;
  });

  patchState({
    palette: recalibrated,
    paletteSetName: setName,
  });
  resetAnalysis();
  return Math.min(currentPalette.length, swatches.length);
}

function getNearestMasterColor(sampleRgb, palette) {
  let bestMatch = null;
  for (const entry of palette) {
    const distance =
      Math.sqrt(
        (sampleRgb[0] - entry.rgb[0]) ** 2 +
          (sampleRgb[1] - entry.rgb[1]) ** 2 +
          (sampleRgb[2] - entry.rgb[2]) ** 2,
      );
    if (!bestMatch || distance < bestMatch.distance) {
      bestMatch = {
        code: entry.code,
        rgb: entry.rgb,
        distance,
      };
    }
  }
  return bestMatch;
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

function getEffectiveGridMetrics(state) {
  if (!state.crop) {
    return null;
  }

  const baseCellWidth = state.crop.width / state.gridSize.width;
  const baseCellHeight = state.crop.height / state.gridSize.height;
  const cellWidthScale = Number.isFinite(state.gridAlignment?.cellWidthScale) ? state.gridAlignment.cellWidthScale : 1;
  const cellHeightScale = Number.isFinite(state.gridAlignment?.cellHeightScale) ? state.gridAlignment.cellHeightScale : 1;
  const cellWidth = baseCellWidth * cellWidthScale;
  const cellHeight = baseCellHeight * cellHeightScale;
  const originX = state.crop.x + (Number.isFinite(state.gridAlignment?.offsetX) ? state.gridAlignment.offsetX : 0);
  const originY = state.crop.y + (Number.isFinite(state.gridAlignment?.offsetY) ? state.gridAlignment.offsetY : 0);

  return {
    originX,
    originY,
    baseCellWidth,
    baseCellHeight,
    cellWidth,
    cellHeight,
  };
}

function clampNumber(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function clampPreviewCell(cell, gridSize = getState().gridSize) {
  return {
    x: clampNumber(Math.round(cell?.x || 1), 1, Math.max(1, gridSize.width)),
    y: clampNumber(Math.round(cell?.y || 1), 1, Math.max(1, gridSize.height)),
  };
}

function parsePreviewCellValue(text, gridSize = getState().gridSize) {
  const [rawX, rawY] = String(text || "")
    .split(/[,锛寈X ]+/)
    .filter(Boolean);

  return clampPreviewCell(
    {
      x: Number.parseInt(rawX, 10) || 1,
      y: Number.parseInt(rawY, 10) || 1,
    },
    gridSize,
  );
}

function getCellRectByIndex(state, cellX, cellY) {
  const metrics = getEffectiveGridMetrics(state);
  if (!metrics) {
    return null;
  }

  return {
    x: metrics.originX + (cellX - 1) * metrics.cellWidth,
    y: metrics.originY + (cellY - 1) * metrics.cellHeight,
    width: metrics.cellWidth,
    height: metrics.cellHeight,
  };
}

function getLocalSamplingScale(sampling = getState().sampling) {
  return {
    x: clampNumber(Number.isFinite(sampling?.localScaleX) ? sampling.localScaleX : 1, 0.55, 1),
    y: clampNumber(Number.isFinite(sampling?.localScaleY) ? sampling.localScaleY : 1, 0.55, 1),
  };
}

function getCenteredScaledRect(rect, scaleX = 1, scaleY = 1) {
  const safeScaleX = clampNumber(scaleX, 0.55, 1);
  const safeScaleY = clampNumber(scaleY, 0.55, 1);
  const width = rect.width * safeScaleX;
  const height = rect.height * safeScaleY;
  return {
    x: rect.x + (rect.width - width) / 2,
    y: rect.y + (rect.height - height) / 2,
    width,
    height,
  };
}

function getSamplingCellRect(cellRect, sampling = getState().sampling) {
  const localScale = getLocalSamplingScale(sampling);
  return getCenteredScaledRect(cellRect, localScale.x, localScale.y);
}

function getInsetRect(cellRect, sampling) {
  const insetRatio = Math.min(0.35, Math.max(0.08, sampling?.insetRatio ?? 0.22));
  const insetX = cellRect.width * insetRatio;
  const insetY = cellRect.height * insetRatio;
  return {
    x: cellRect.x + insetX,
    y: cellRect.y + insetY,
    width: Math.max(1, cellRect.width - insetX * 2),
    height: Math.max(1, cellRect.height - insetY * 2),
  };
}

function getSamplingRects(cellRect, sampling) {
  const outerMarginRatio = clampNumber(sampling?.outerMarginRatio ?? 0.1, 0.02, 0.28);
  const rawInnerRatio = clampNumber(sampling?.innerExclusionRatio ?? 0.24, 0.12, 0.42);
  const innerExclusionRatio = Math.max(rawInnerRatio, outerMarginRatio + 0.04);
  const outerX = cellRect.width * outerMarginRatio;
  const outerY = cellRect.height * outerMarginRatio;
  const innerX = cellRect.width * innerExclusionRatio;
  const innerY = cellRect.height * innerExclusionRatio;

  return {
    outerRect: {
      x: cellRect.x + outerX,
      y: cellRect.y + outerY,
      width: Math.max(1, cellRect.width - outerX * 2),
      height: Math.max(1, cellRect.height - outerY * 2),
    },
    innerRect: {
      x: cellRect.x + innerX,
      y: cellRect.y + innerY,
      width: Math.max(1, cellRect.width - innerX * 2),
      height: Math.max(1, cellRect.height - innerY * 2),
    },
    outerMarginRatio,
    innerExclusionRatio,
  };
}

function getTextAssistRect(cellRect) {
  return {
    x: cellRect.x + cellRect.width * 0.2,
    y: cellRect.y + cellRect.height * 0.18,
    width: Math.max(1, cellRect.width * 0.6),
    height: Math.max(1, cellRect.height * 0.64),
  };
}

function buildSamplingPreviewPoints(cellRect, sampling) {
  const mode = sampling?.mode || "ring";
  const samplingRect = getSamplingCellRect(cellRect, sampling);
  const { outerRect, innerRect, outerMarginRatio } = getSamplingRects(samplingRect, sampling);
  const offsetXRatio = clampNumber(sampling?.offsetXRatio ?? 0, -0.28, 0.28);
  const offsetYRatio = clampNumber(sampling?.offsetYRatio ?? 0, -0.28, 0.28);

  if (mode === "anchor") {
    const anchorXRatio = clampNumber(sampling?.anchorXRatio ?? 0.18, 0.05, 0.95);
    const anchorYRatio = clampNumber(sampling?.anchorYRatio ?? 0.18, 0.05, 0.95);
    return {
      outerRect,
      innerRect,
      points: [
        {
          x: samplingRect.x + anchorXRatio * samplingRect.width,
          y: samplingRect.y + anchorYRatio * samplingRect.height,
        },
      ],
      samplingRect,
    };
  }

  const ringOffsets = [
    [0.18, outerMarginRatio],
    [0.36, outerMarginRatio],
    [0.5, outerMarginRatio],
    [0.64, outerMarginRatio],
    [0.82, outerMarginRatio],
    [0.18, 1 - outerMarginRatio],
    [0.36, 1 - outerMarginRatio],
    [0.5, 1 - outerMarginRatio],
    [0.64, 1 - outerMarginRatio],
    [0.82, 1 - outerMarginRatio],
    [outerMarginRatio, 0.34],
    [outerMarginRatio, 0.5],
    [outerMarginRatio, 0.66],
    [1 - outerMarginRatio, 0.34],
    [1 - outerMarginRatio, 0.5],
    [1 - outerMarginRatio, 0.66],
  ];

  return {
    outerRect,
    innerRect,
    samplingRect,
    points: ringOffsets.map(([ratioX, ratioY]) => ({
      x: samplingRect.x + clampNumber(ratioX + offsetXRatio, 0.05, 0.95) * samplingRect.width,
      y: samplingRect.y + clampNumber(ratioY + offsetYRatio, 0.05, 0.95) * samplingRect.height,
    })),
  };
}

function getChunkIndexByGridPosition(analysis, chunkCol, chunkRow) {
  return analysis.chunks.findIndex((chunk) => chunk.chunkCol === chunkCol && chunk.chunkRow === chunkRow);
}

function getFocusedStats(analysis, focusColorCode) {
  if (!analysis || !focusColorCode) {
    return null;
  }

  const matchedCells = analysis.cells.filter((cell) => cell.code === focusColorCode);
  return {
    code: focusColorCode,
    count: matchedCells.length,
    chunks: new Set(matchedCells.map((cell) => String(Math.ceil(cell.x / 5)) + "-" + String(Math.ceil(cell.y / 5)))).size,
  };
}

function getDimmedColor(rgb, alpha = 0.16) {
  return `rgba(${rgb[0]}, ${rgb[1]}, ${rgb[2]}, ${alpha})`;
}

function getMapLayout(width, height, analysis) {
  const cellSize = Math.min(width / analysis.gridWidth, height / analysis.gridHeight);
  const offsetX = (width - analysis.gridWidth * cellSize) / 2;
  const offsetY = (height - analysis.gridHeight * cellSize) / 2;
  return { cellSize, offsetX, offsetY };
}

function resolveChunkIndexFromMapPoint(canvas, event, analysis) {
  if (!canvas || !analysis) {
    return -1;
  }

  const rect = canvas.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const clickY = event.clientY - rect.top;
  const width = canvas.clientWidth || rect.width || 120;
  const height = canvas.clientHeight || rect.height || width;
  const { cellSize, offsetX, offsetY } = getMapLayout(width, height, analysis);
  const gridX = Math.floor((clickX - offsetX) / cellSize) + 1;
  const gridY = Math.floor((clickY - offsetY) / cellSize) + 1;

  if (gridX < 1 || gridX > analysis.gridWidth || gridY < 1 || gridY > analysis.gridHeight) {
    return -1;
  }

  return getChunkIndexByGridPosition(analysis, Math.ceil(gridX / 5), Math.ceil(gridY / 5));
}

function resolveGridPositionFromMapPoint(canvas, event, analysis) {
  if (!canvas || !analysis) {
    return null;
  }

  const rect = canvas.getBoundingClientRect();
  const clickX = event.clientX - rect.left;
  const clickY = event.clientY - rect.top;
  const width = canvas.clientWidth || rect.width || 120;
  const height = canvas.clientHeight || rect.height || width;
  const { cellSize, offsetX, offsetY } = getMapLayout(width, height, analysis);
  const gridX = Math.floor((clickX - offsetX) / cellSize) + 1;
  const gridY = Math.floor((clickY - offsetY) / cellSize) + 1;

  if (gridX < 1 || gridX > analysis.gridWidth || gridY < 1 || gridY > analysis.gridHeight) {
    return null;
  }

  return { x: gridX, y: gridY };
}

function getMarkerPresets() {
  return {
    lime: { label: "荧光绿", color: "#8bd450" },
    amber: { label: "亮橙", color: "#ef9c3d" },
    cyan: { label: "湖蓝", color: "#35b9d8" },
    magenta: { label: "玫红", color: "#cf5bb6" },
    violet: { label: "紫蓝", color: "#6276ef" },
  };
}

function getMarkerTargetCode(state) {
  if (!state.analysis) {
    return "";
  }

  return state.focusColorCode || state.analysis.globalStats[0]?.code || "";
}

function buildMarkerAnchors(analysis, colorCode) {
  if (!analysis || !colorCode) {
    return [];
  }

  const candidates = analysis.cells.filter((cell) => cell.code === colorCode);
  if (!candidates.length) {
    return [];
  }

  const targetPoints = [
    { label: "宸︿笂", x: 1, y: 1 },
    { label: "鍙充笂", x: analysis.gridWidth, y: 1 },
    { label: "宸︿笅", x: 1, y: analysis.gridHeight },
    { label: "鍙充笅", x: analysis.gridWidth, y: analysis.gridHeight },
    { label: "涓績", x: Math.round(analysis.gridWidth / 2), y: Math.round(analysis.gridHeight / 2) },
  ];
  const used = new Set();

  return targetPoints
    .map((target, index) => {
      let best = null;
      for (const cell of candidates) {
        const key = `${cell.x}-${cell.y}`;
        if (used.has(key)) {
          continue;
        }

        const distance = Math.hypot(cell.x - target.x, cell.y - target.y);
        if (!best || distance < best.distance) {
          best = { ...cell, distance };
        }
      }

      if (!best) {
        return null;
      }

      used.add(`${best.x}-${best.y}`);
      return {
        index: index + 1,
        label: target.label,
        x: best.x,
        y: best.y,
        chunkCol: Math.ceil(best.x / 5),
        chunkRow: Math.ceil(best.y / 5),
      };
    })
    .filter(Boolean);
}

function injectEnhancementControls() {
  const libraryPanel = document.querySelector("#tab-library");
  if (libraryPanel && !document.querySelector("#libraryDataExportBtn")) {
    const libraryTools = document.createElement("div");
    libraryTools.className = "summary-card";
    libraryTools.style.marginTop = "12px";
    libraryTools.innerHTML = `
      <h3>整库导出与导入</h3>
      <p class="plan-text">这里会打包当前拼豆库里的所有图纸快照、裁剪、色卡、修正结果和项目状态。你可以从电脑导出到手机，也可以在另一台设备上再导入回来。</p>
      <div class="button-row" style="margin-top:12px;">
        <button id="libraryDataExportBtn" type="button">导出全部图纸数据</button>
        <button id="libraryDataImportBtn" class="ghost-btn" type="button">导入图纸数据包</button>
        <input id="libraryDataImportInput" type="file" accept=".json,application/json" style="display:none;" />
      </div>
      <p id="libraryDataStatus" class="empty-text" style="margin-top:10px;">建议每次大改完都导出一份整库数据包，手机和电脑都能留底。</p>
    `;
    libraryPanel.appendChild(libraryTools);
  }

  if (step2Panel && !document.querySelector("#paletteImageInput")) {
    const paletteTools = document.createElement("div");
    paletteTools.className = "summary-card";
    paletteTools.innerHTML = `
      <h3>色卡图片识别</h3>
      <p class="plan-text">上传颜色卡截图后，系统会先尝试识别每个色块里的色号文字，再把这个色号和该色块的实际背景色绑定成本图色卡。这样即使这张图和标准色卡有色差，后续解析也会优先按本图颜色来匹配。</p>
      <div class="field-grid" style="margin-top:12px;">
        <label class="field">
          <span>导入方式</span>
          <select id="paletteImportModeSelect">
            <option value="replace">替换当前色卡，按这张图单独成套</option>
            <option value="merge">合并到当前色卡</option>
          </select>
        </label>
        <div class="field">
          <span>当前色卡套装</span>
          <p class="empty-text" id="paletteSetNameText">当前项目色卡</p>
        </div>
      </div>
      <div class="button-row" style="margin-top:12px;">
        <button id="extractLegendBtn" type="button">识别原图底部色卡</button>
        <button id="uploadPaletteImageBtn" class="ghost-btn" type="button">上传颜色卡做本图校准</button>
      </div>
      <input id="paletteImageInput" type="file" accept="image/*" style="display:none;" />
      <div id="paletteExtractStatus" class="empty-text" style="margin-top:10px;">建议先有色号列表，再上传颜色卡截图校准本图颜色。</div>
      <div class="summary-card" style="margin-top:12px; padding:12px;">
        <h3>识别效果预览</h3>
        <p class="plan-text">先看左侧整图框选结果，再从右侧列表点选单个色块。绿色 = 已识别，红色 = 待补，黄色虚线 = 你正在手动框选的区域。若两个色块被识别成一个，先删掉误框，再重新拖小框拆分。手动框选长条色卡时，系统会尽量只从真正的色块区取色，忽略右侧数量区。</p>
        <div class="palette-review-layout">
          <div class="summary-card palette-review-stage">
            <canvas id="paletteReviewCanvas" aria-label="颜色卡识别预览"></canvas>
          </div>
          <div class="summary-card palette-review-side">
            <canvas id="paletteReviewDetailCanvas" aria-label="当前色块放大预览"></canvas>
            <div id="paletteReviewList" class="palette-review-list"></div>
          </div>
        </div>
        <p id="paletteReviewStatus" class="empty-text" style="margin-top:10px;">上传颜色卡后，这里会显示识别到的色块和色号。</p>
        <div class="summary-card" style="margin-top:12px; padding:12px;">
          <h3>手动框选修正</h3>
          <p class="plan-text">如果自动识别把两个色块并成一个，或者你更相信自己眼睛，就直接在左侧拖框，右侧点真实底色，再手填色号保存。手动模式不会被自动 OCR 强行改掉。</p>
          <div class="field-grid" style="margin-top:12px;">
            <label class="field">
              <span>修正模式</span>
              <select id="paletteReviewModeSelect">
                <option value="color-first">颜色优先：手填色号 + 内部色块取色保存</option>
                <option value="ocr-first">色号优先：调用后端 OCR 重识别文字</option>
              </select>
            </label>
            <label class="field">
              <span>手动色号</span>
              <input id="paletteReviewCodeInput" type="text" maxlength="12" placeholder="例如 H9 / C20" list="paletteReviewCodeList" />
              <datalist id="paletteReviewCodeList"></datalist>
            </label>
            <div class="field">
              <span>手动修正</span>
              <div class="button-row">
                <button id="paletteReviewRetryBtn" class="ghost-btn" type="button">后端重识别文字</button>
                <button id="paletteReviewSaveBtn" type="button">把框选新建为色卡</button>
                <button id="paletteReviewDeleteBtn" class="ghost-btn" type="button">删除选中色块</button>
                <button id="paletteReviewClearBtn" class="ghost-btn" type="button">清除框选</button>
              </div>
            </div>
          </div>
          <div class="field-grid" style="margin-top:12px;">
            <div class="field">
              <span>真实取色</span>
              <p class="empty-text" id="paletteReviewColorValue">直接在右侧放大预览上点真实像素，或点下面 5x5 像素板。保存时会优先使用你手选的颜色。</p>
              <div id="paletteReviewPixelGrid" class="palette-pixel-grid"></div>
            </div>
            <div class="field">
              <span>颜色修正</span>
              <div class="button-row">
                <button id="paletteReviewResetColorBtn" class="ghost-btn" type="button">清除手选颜色</button>
              </div>
            </div>
          </div>
        </div>
        <div class="summary-card" style="margin-top:12px; padding:12px;">
          <h3>交互式网格覆盖</h3>
          <p class="plan-text">适合排版很规整的颜色卡。先输入行列数，再初始化网格；勾选“拖拽调整网格”后，可直接在左侧图上拖动外框和四角，把网格完全套住每个色块。若色块之间隔着数字或留白，可继续调“列间距/行间距”，让黄色工作框只包住真正的单个色卡。随后按格切图，交给后端逐格 OCR。</p>
          <div class="field-grid" style="margin-top:12px;">
            <label class="field">
              <span>行数</span>
              <input id="paletteGridRowsInput" type="number" min="1" max="30" step="1" value="5" inputmode="numeric" />
            </label>
            <label class="field">
              <span>列数</span>
              <input id="paletteGridColsInput" type="number" min="1" max="30" step="1" value="10" inputmode="numeric" />
            </label>
            <label class="field">
              <span>列间距 %</span>
              <input id="paletteGridGapXInput" type="number" min="0" max="48" step="1" value="12" inputmode="numeric" />
            </label>
            <label class="field">
              <span>行间距 %</span>
              <input id="paletteGridGapYInput" type="number" min="0" max="48" step="1" value="12" inputmode="numeric" />
            </label>
            <label class="field" style="display:flex; align-items:center; gap:10px; padding-top:26px;">
              <input id="paletteGridEditInput" type="checkbox" />
              <span>拖拽调整网格</span>
            </label>
          </div>
          <div class="button-row" style="margin-top:12px;">
            <button id="paletteGridInitBtn" class="ghost-btn" type="button">初始化网格</button>
            <button id="paletteGridApplyBtn" type="button">按网格识别色卡</button>
            <button id="paletteGridResetBtn" class="ghost-btn" type="button">清除网格</button>
          </div>
          <p id="paletteGridStatus" class="empty-text" style="margin-top:10px;">规则色卡建议优先用网格模式：青色大框 = 节距网格，黄色虚线框 = 实际工作框。遇到色卡之间有数字或空白时，先调间距，再识别。</p>
        </div>
      </div>
    `;
    step2Panel.appendChild(paletteTools);
  }

  if (step3Panel && !document.querySelector("#sampleOverlayToggle")) {
    const sampleTools = document.createElement("div");
    sampleTools.className = "summary-card";
    sampleTools.innerHTML = `
      <h3>采样点调校</h3>
      <p class="plan-text">解析前可调采样框。推荐先看下面的小方格示意图：外框是允许取样区，内框是避开字母数字的禁采区。也可以直接点示意格，指定一个“所有小格通用的安全点”。</p>
      <div class="field-grid" style="margin-top:12px;">
        <label class="field"><span>起始 X 偏移 px</span><input id="gridOffsetXInput" type="number" step="0.2" value="0" inputmode="decimal" /></label>
        <label class="field"><span>起始 Y 偏移 px</span><input id="gridOffsetYInput" type="number" step="0.2" value="0" inputmode="decimal" /></label>
        <label class="field"><span>预览格子</span><input id="previewCellInput" type="text" value="1,1" placeholder="例如 12,8" /></label>
      </div>
      <div class="field-grid" style="margin-top:12px;">
        <label class="field">
          <span>取样方式</span>
          <select id="sampleModeSelect">
            <option value="ring">框环取样</option>
            <option value="anchor">固定安全点</option>
          </select>
        </label>
        <label class="field"><span>外框留边 %</span><input id="sampleOuterMarginInput" type="number" min="2" max="28" step="1" value="10" inputmode="numeric" /></label>
        <label class="field"><span>内层避字 %</span><input id="sampleInsetInput" type="number" min="12" max="42" step="1" value="24" inputmode="numeric" /></label>
      </div>
      <div class="field-grid" style="margin-top:12px;">
        <label class="field"><span>X 偏移 %</span><input id="sampleOffsetXInput" type="number" min="-35" max="35" step="1" value="0" inputmode="numeric" /></label>
        <label class="field"><span>Y 偏移 %</span><input id="sampleOffsetYInput" type="number" min="-35" max="35" step="1" value="0" inputmode="numeric" /></label>
        <div class="field"><span>固定安全点</span><p class="empty-text" id="sampleAnchorInfo">点击下方示意格设置安全点。</p></div>
      </div>
      <div class="field-grid" style="margin-top:12px;">
        <label class="field" style="display:flex; align-items:center; gap:10px; padding-top:26px;">
          <input id="watermarkTextAssistInput" type="checkbox" />
          <span>有水印时启用中心文字辅助识别</span>
        </label>
        <label class="field" style="display:flex; align-items:center; gap:10px; padding-top:26px;">
          <input id="chartTextPriorityInput" type="checkbox" />
          <span>图纸色号清晰时，优先按文字识别</span>
        </label>
        <label class="field" style="display:flex; align-items:center; gap:10px; padding-top:26px;">
          <input id="preserveBlankWithoutTextInput" type="checkbox" checked />
          <span>格子里没有文字时，不自动转成色号</span>
        </label>
        <label class="field"><span>剔除外层圈数</span><input id="excludeOuterLayersInput" type="number" min="0" max="8" step="1" value="0" inputmode="numeric" /></label>
        <div class="field"><span>识别策略</span><p class="empty-text">如果图纸上的色号文字本身很清晰，建议打开“优先按文字识别”；有水印时再打开水印模式；勾选“没有文字不转色号”后，白底空白格会保留为空白；剔除外层后，边框那几圈不会参与统计和建议。</p></div>
      </div>
      <div class="summary-card" style="margin-top:12px; padding:12px;">
        <canvas id="sampleDemoCanvas" aria-label="采样示意格"></canvas>
        <p class="viewer-tip">示意格中间的字只是演示干扰区。点击示意格可设置“固定安全点”，后续每个格子都用这个相对位置取色。</p>
      </div>
      <div class="summary-card sampling-inspector-card" style="margin-top:12px;">
        <h3>真实网格采样检查器</h3>
        <p class="plan-text">这里不是示意图，而是当前图纸里真实的网格放大预览。浅黄框 = 原始格子边界，亮黄框 = 局部中心收缩框，绿色框 = 取样外框，蓝色虚线 = 避字区，圆点 = 实际采样点。拖白点后会记住这个收缩比例，并套用到所有格子。</p>
        <div class="field-grid" style="margin-top:12px;">
          <label class="field">
            <span>检查范围</span>
            <select id="sampleInspectWindowSelect">
              <option value="3">3x3</option>
              <option value="7">7x7</option>
              <option value="11">11x11 大图模式</option>
            </select>
          </label>
          <div class="field">
            <span>整图定位</span>
            <p class="empty-text">范围越大，越适合检查边框、连片颜色和整体对齐；点预览里的任意格子可以直接跳过去。</p>
          </div>
        </div>
        <canvas id="sampleInspectCanvas" aria-label="真实网格采样检查器"></canvas>
        <div class="sampling-legend">
          <span><i class="swatch-dot is-cell"></i>当前格</span>
          <span><i class="swatch-dot is-outer"></i>取样外框</span>
          <span><i class="swatch-dot is-inner"></i>避字区</span>
          <span><i class="swatch-dot is-point"></i>采样点</span>
        </div>
        <p id="sampleInspectStatus" class="empty-text" style="margin-top:10px;">确认裁剪后，这里会显示真实网格采样落点。</p>
        <div id="sampleInspectVotes" class="sample-votes-panel"></div>
      </div>
      <div class="summary-card seed-assist-card" style="margin-top:12px;">
        <h3>双种子对抗模式</h3>
        <p class="plan-text">如果两种近色总是互相误判，就分别挑几个“目标色”和“对照色”的真实格子。系统会同时建立两边的本图原型，再判断每一格到底更像哪一边，而不是只看单一目标。</p>
        <div class="field-grid" style="margin-top:12px;">
          <label class="field">
            <span>目标色号</span>
            <select id="seedTargetCodeSelect"></select>
          </label>
          <label class="field">
            <span>对照色号</span>
            <select id="seedContrastCodeSelect"></select>
          </label>
          <label class="field">
            <span>相近阈值</span>
            <input id="seedThresholdInput" type="number" min="2" max="20" step="0.5" value="8" inputmode="decimal" />
          </label>
        </div>
        <div class="button-row" style="margin-top:12px;">
          <button id="seedAddTargetBtn" class="ghost-btn" type="button">把当前格加入目标种子</button>
          <button id="seedAddContrastBtn" class="ghost-btn" type="button">把当前格加入对照种子</button>
          <button id="seedAnalyzeBtn" type="button">分析对抗候选</button>
        </div>
        <div class="button-row" style="margin-top:12px;">
          <button id="seedApplyBtn" type="button">批量修正候选</button>
          <button id="seedClearBtn" class="ghost-btn" type="button">清空种子</button>
          <button id="seedResetOverridesBtn" class="ghost-btn" type="button">清空批量修正</button>
        </div>
        <p id="seedStatus" class="empty-text" style="margin-top:10px;">先解析整图，然后把几个你确定的格子加入种子。</p>
        <div class="seed-layout">
          <div>
            <h4>目标种子</h4>
            <div id="seedTargetList" class="seed-list"></div>
          </div>
          <div>
            <h4>对照种子</h4>
            <div id="seedContrastList" class="seed-list"></div>
          </div>
          <div>
            <h4>对抗候选</h4>
            <div id="seedCandidateList" class="seed-list"></div>
          </div>
        </div>
      </div>
      <div class="summary-card seed-assist-card" style="margin-top:12px;">
        <h3>图内颜色原型校准</h3>
        <p class="plan-text">如果大图小字太糊，就不要硬认字。先选一个色号，再把几个你确定属于它的真实格子加入样本。系统会用这些样本生成这张图自己的颜色原型，再按本图原型重跑整张图。</p>
        <div class="field-grid" style="margin-top:12px;">
          <label class="field">
            <span>当前校准色号</span>
            <select id="calibrationActiveCodeSelect"></select>
          </label>
          <div class="field">
            <span>使用建议</span>
            <p class="empty-text">优先先收黑色、白色、深蓝这类最稳定的颜色，每个色号建议取 5-15 个样本。</p>
          </div>
        </div>
        <div class="button-row" style="margin-top:12px;">
          <button id="calibrationAddSampleBtn" class="ghost-btn" type="button">把当前格加入样本</button>
          <button id="calibrationBuildBtn" type="button">生成本图原型</button>
          <button id="calibrationApplyBtn" type="button">按原型重跑整图</button>
        </div>
        <div class="button-row" style="margin-top:12px;">
          <button id="calibrationDisableBtn" class="ghost-btn" type="button">恢复标准色解析</button>
          <button id="calibrationClearActiveBtn" class="ghost-btn" type="button">清空当前色样本</button>
          <button id="calibrationClearAllBtn" class="ghost-btn" type="button">清空全部原型</button>
        </div>
        <p id="calibrationStatus" class="empty-text" style="margin-top:10px;">先解析整图，再把你确定的格子加入样本。</p>
        <div>
          <h4>当前色样本</h4>
          <div id="calibrationSampleList" class="seed-list"></div>
        </div>
      </div>
      <div class="field-grid" style="margin-top:12px;">
        <label class="field"><span>单格宽度 %</span><input id="cellWidthScaleInput" type="number" min="75" max="125" step="1" value="100" inputmode="numeric" /></label>
        <label class="field"><span>单格高度 %</span><input id="cellHeightScaleInput" type="number" min="75" max="125" step="1" value="100" inputmode="numeric" /></label>
        <div class="field">
          <span>手动对齐</span>
          <div class="button-row">
            <button id="resetAlignmentBtn" class="ghost-btn" type="button">重置对齐</button>
          </div>
        </div>
      </div>
      <div class="button-row" style="margin-top:12px;">
        <button id="sampleOverlayToggle" class="ghost-btn" type="button">隐藏采样点</button>
      </div>
    `;
    analyzeBtn.parentElement?.insertAdjacentElement("afterend", sampleTools);
  }

  if (step4Panel && !document.querySelector("#markerPresetSelect")) {
    const markerTools = document.createElement("div");
    markerTools.className = "summary-card";
    markerTools.style.marginTop = "12px";
      markerTools.innerHTML = `
      <h3>定位标记色</h3>
      <p class="plan-text">当某一个颜色在大图里不好找时，可先在四角和中心挑出几个定位点，用临时替代色占位，最后再换回图纸原色。</p>
      <div class="field-grid" style="margin-top:12px;">
        <label class="field">
          <span>临时标记色</span>
          <select id="markerPresetSelect">
            <option value="lime">荧光绿</option>
            <option value="amber">亮橙</option>
            <option value="cyan">湖蓝</option>
            <option value="magenta">玫红</option>
            <option value="violet">紫蓝</option>
          </select>
        </label>
        <div class="field">
          <span>定位建议</span>
          <p class="empty-text" id="markerSummary">先在“整体大图模式”里选一个颜色，这里会自动给出四角加中心的定位点。</p>
        </div>
      </div>
    `;
    step4Panel.appendChild(markerTools);
  }

  paletteImageInput = document.querySelector("#paletteImageInput");
  extractLegendBtn = document.querySelector("#extractLegendBtn");
  uploadPaletteImageBtn = document.querySelector("#uploadPaletteImageBtn");
  paletteReviewCanvas = document.querySelector("#paletteReviewCanvas");
  paletteReviewCtx = paletteReviewCanvas?.getContext("2d") || null;
  paletteReviewDetailCanvas = document.querySelector("#paletteReviewDetailCanvas");
  paletteReviewDetailCtx = paletteReviewDetailCanvas?.getContext("2d") || null;
  paletteReviewList = document.querySelector("#paletteReviewList");
  paletteReviewStatus = document.querySelector("#paletteReviewStatus");
  paletteReviewModeSelect = document.querySelector("#paletteReviewModeSelect");
  paletteReviewCodeInput = document.querySelector("#paletteReviewCodeInput");
  paletteReviewRetryBtn = document.querySelector("#paletteReviewRetryBtn");
  paletteReviewSaveBtn = document.querySelector("#paletteReviewSaveBtn");
  paletteReviewDeleteBtn = document.querySelector("#paletteReviewDeleteBtn");
  paletteReviewClearBtn = document.querySelector("#paletteReviewClearBtn");
  paletteReviewColorValue = document.querySelector("#paletteReviewColorValue");
  paletteReviewPixelGrid = document.querySelector("#paletteReviewPixelGrid");
  paletteReviewResetColorBtn = document.querySelector("#paletteReviewResetColorBtn");
  paletteGridRowsInput = document.querySelector("#paletteGridRowsInput");
  paletteGridColsInput = document.querySelector("#paletteGridColsInput");
  paletteGridGapXInput = document.querySelector("#paletteGridGapXInput");
  paletteGridGapYInput = document.querySelector("#paletteGridGapYInput");
  paletteGridInitBtn = document.querySelector("#paletteGridInitBtn");
  paletteGridApplyBtn = document.querySelector("#paletteGridApplyBtn");
  paletteGridResetBtn = document.querySelector("#paletteGridResetBtn");
  paletteGridEditInput = document.querySelector("#paletteGridEditInput");
  paletteGridStatus = document.querySelector("#paletteGridStatus");
  paletteImportModeSelect = document.querySelector("#paletteImportModeSelect");
  paletteSetNameText = document.querySelector("#paletteSetNameText");
  sampleOverlayToggle = document.querySelector("#sampleOverlayToggle");
  sampleModeSelect = document.querySelector("#sampleModeSelect");
  sampleOuterMarginInput = document.querySelector("#sampleOuterMarginInput");
  sampleInsetInput = document.querySelector("#sampleInsetInput");
  sampleOffsetXInput = document.querySelector("#sampleOffsetXInput");
  sampleOffsetYInput = document.querySelector("#sampleOffsetYInput");
  watermarkTextAssistInput = document.querySelector("#watermarkTextAssistInput");
  chartTextPriorityInput = document.querySelector("#chartTextPriorityInput");
  preserveBlankWithoutTextInput = document.querySelector("#preserveBlankWithoutTextInput");
  excludeOuterLayersInput = document.querySelector("#excludeOuterLayersInput");
  sampleAnchorInfo = document.querySelector("#sampleAnchorInfo");
  sampleDemoCanvas = document.querySelector("#sampleDemoCanvas");
  sampleDemoCtx = sampleDemoCanvas?.getContext("2d") || null;
  sampleInspectCanvas = document.querySelector("#sampleInspectCanvas");
  sampleInspectCtx = sampleInspectCanvas?.getContext("2d") || null;
  sampleInspectWindowSelect = document.querySelector("#sampleInspectWindowSelect");
  sampleInspectStatus = document.querySelector("#sampleInspectStatus");
  sampleInspectVotes = document.querySelector("#sampleInspectVotes");
  seedTargetCodeSelect = document.querySelector("#seedTargetCodeSelect");
  seedContrastCodeSelect = document.querySelector("#seedContrastCodeSelect");
  seedThresholdInput = document.querySelector("#seedThresholdInput");
  seedAddTargetBtn = document.querySelector("#seedAddTargetBtn");
  seedAddContrastBtn = document.querySelector("#seedAddContrastBtn");
  seedAnalyzeBtn = document.querySelector("#seedAnalyzeBtn");
  seedApplyBtn = document.querySelector("#seedApplyBtn");
  seedClearBtn = document.querySelector("#seedClearBtn");
  seedResetOverridesBtn = document.querySelector("#seedResetOverridesBtn");
  seedStatus = document.querySelector("#seedStatus");
  seedTargetList = document.querySelector("#seedTargetList");
  seedContrastList = document.querySelector("#seedContrastList");
  seedCandidateList = document.querySelector("#seedCandidateList");
  calibrationActiveCodeSelect = document.querySelector("#calibrationActiveCodeSelect");
  calibrationAddSampleBtn = document.querySelector("#calibrationAddSampleBtn");
  calibrationBuildBtn = document.querySelector("#calibrationBuildBtn");
  calibrationApplyBtn = document.querySelector("#calibrationApplyBtn");
  calibrationDisableBtn = document.querySelector("#calibrationDisableBtn");
  calibrationClearActiveBtn = document.querySelector("#calibrationClearActiveBtn");
  calibrationClearAllBtn = document.querySelector("#calibrationClearAllBtn");
  calibrationStatus = document.querySelector("#calibrationStatus");
  calibrationSampleList = document.querySelector("#calibrationSampleList");
  gridOffsetXInput = document.querySelector("#gridOffsetXInput");
  gridOffsetYInput = document.querySelector("#gridOffsetYInput");
  cellWidthScaleInput = document.querySelector("#cellWidthScaleInput");
  cellHeightScaleInput = document.querySelector("#cellHeightScaleInput");
  previewCellInput = document.querySelector("#previewCellInput");
  resetAlignmentBtn = document.querySelector("#resetAlignmentBtn");
  markerPresetSelect = document.querySelector("#markerPresetSelect");
  markerSummary = document.querySelector("#markerSummary");
  libraryDataExportBtn = document.querySelector("#libraryDataExportBtn");
  libraryDataImportBtn = document.querySelector("#libraryDataImportBtn");
  libraryDataImportInput = document.querySelector("#libraryDataImportInput");
  libraryDataStatus = document.querySelector("#libraryDataStatus");
  batchReplaceModeInput = document.querySelector("#batchReplaceModeInput");
  batchReplaceCodeInput = document.querySelector("#batchReplaceCodeInput");
  batchReplaceCodeList = document.querySelector("#batchReplaceCodeList");
  batchReplaceApplyBtn = document.querySelector("#batchReplaceApplyBtn");
  batchReplaceClearSelectionBtn = document.querySelector("#batchReplaceClearSelectionBtn");
  batchReplaceClearOverridesBtn = document.querySelector("#batchReplaceClearOverridesBtn");
  batchReplaceStatus = document.querySelector("#batchReplaceStatus");
}

function initDefaultPalette() {
  if (getState().palette.length || !window.PINDOU_COLORS?.length) {
    return;
  }

  patchState({
    palette: window.PINDOU_COLORS.map((entry) => ({
      code: entry.code,
      rgb: hexToRgb(entry.hex),
    })),
  });
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

function renderLibraryPanel() {
  const state = getState();
  const projects = [...(state.libraryProjects || [])].sort((left, right) => {
    const leftTime = new Date(left.updatedAt || 0).getTime();
    const rightTime = new Date(right.updatedAt || 0).getTime();
    return rightTime - leftTime;
  });
  const currentMeta = getCurrentProjectMeta(state);

  if (tabLibraryBadge) {
    tabLibraryBadge.textContent = `${projects.length}张`;
  }
  if (libraryStatus) {
    libraryStatus.textContent = `${projects.length} 张图纸`;
  }
  if (libraryProjectNameInput && document.activeElement !== libraryProjectNameInput) {
    libraryProjectNameInput.value = currentMeta.name || "";
  }
  if (libraryProjectStatusSelect && document.activeElement !== libraryProjectStatusSelect) {
    libraryProjectStatusSelect.value = currentMeta.status || "todo";
  }
  if (!libraryProjectList) {
    return;
  }

  if (!projects.length) {
    libraryProjectList.innerHTML = `<p class="empty-text">这里还没有图纸。先导入一张图，或者把当前正在编辑的图纸保存进拼豆库。</p>`;
    return;
  }

  libraryProjectList.innerHTML = projects
    .map(
      (project) => `
        <article class="library-card ${project.id === state.currentProjectId ? "is-active" : ""}">
          <div class="library-card-cover">
            ${project.coverImageDataUrl ? `<img src="${project.coverImageDataUrl}" alt="${project.name}" />` : `<div class="library-cover-empty">无预览</div>`}
          </div>
          <div class="library-card-body">
            <div class="library-card-head">
              <div>
                <h3>${project.name}</h3>
                <p>${buildProjectSummary(project)}</p>
              </div>
              <span class="library-status-badge status-${project.status}">${getProjectDisplayStatus(project.status)}</span>
            </div>
            <p class="library-card-time">上次保存：${formatProjectTime(project.updatedAt)}</p>
            <div class="library-card-actions">
              <button type="button" data-library-open="${project.id}">打开</button>
              <select data-library-status="${project.id}">
                ${Object.entries(PROJECT_STATUS_LABELS)
                  .map(
                    ([value, label]) => `<option value="${value}" ${project.status === value ? "selected" : ""}>${label}</option>`,
                  )
                  .join("")}
              </select>
              <button type="button" class="ghost-btn" data-library-delete="${project.id}">删除</button>
            </div>
          </div>
        </article>
      `,
    )
    .join("");
}

function saveCurrentProjectToLibrary() {
  const state = getState();
  if (!state.storedImage?.dataUrl) {
    window.alert("请先上传一张图纸，再保存到拼豆库。");
    return;
  }

  const name = normalizeProjectName(libraryProjectNameInput?.value || state.currentProjectName || state.storedImage?.name || "");
  const status = libraryProjectStatusSelect?.value || state.currentProjectStatus || "todo";
  const projectId = state.currentProjectId || createProjectId();
  const snapshot = buildProjectSnapshot({
    ...state,
    currentProjectName: name,
    currentProjectStatus: status,
  });
  const existing = (state.libraryProjects || []).find((project) => project.id === projectId);
  const project = createProjectRecordFromSnapshot(snapshot, {
    id: projectId,
    name,
    status,
    createdAt: existing?.createdAt,
    coverImageDataUrl: state.storedImage?.dataUrl || existing?.coverImageDataUrl || "",
  });
  patchState({
    libraryProjects: [
      project,
      ...(state.libraryProjects || []).filter((item) => item.id !== projectId),
    ],
    currentProjectId: project.id,
    currentProjectName: name,
    currentProjectStatus: status,
  });
  libraryStatus.textContent = `已保存：${project.name}`;
}

function drawSampleDemo() {
  if (!sampleDemoCanvas || !sampleDemoCtx) {
    return;
  }

  ensureCanvasSize(sampleDemoCanvas, 180, 180);
  const ctx = sampleDemoCtx;
  const state = getState();
  const cellRect = { x: 24, y: 24, width: 132, height: 132 };
  const { samplingRect, outerRect, innerRect, points } = buildSamplingPreviewPoints(cellRect, state.sampling);
  const textRect = getTextAssistRect(cellRect);

  ctx.clearRect(0, 0, 180, 180);
  ctx.fillStyle = "#fffaf4";
  ctx.fillRect(0, 0, 180, 180);
  ctx.fillStyle = "#f1a7b5";
  ctx.fillRect(cellRect.x, cellRect.y, cellRect.width, cellRect.height);
  ctx.strokeStyle = "rgba(48, 33, 22, 0.2)";
  ctx.lineWidth = 2;
  ctx.strokeRect(cellRect.x, cellRect.y, cellRect.width, cellRect.height);
  ctx.strokeStyle = "rgba(244, 198, 79, 0.9)";
  ctx.lineWidth = 2;
  ctx.strokeRect(samplingRect.x, samplingRect.y, samplingRect.width, samplingRect.height);

  ctx.fillStyle = "rgba(92, 34, 53, 0.85)";
  ctx.font = "800 30px 'Segoe UI'";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("H2", cellRect.x + cellRect.width / 2, cellRect.y + cellRect.height / 2);

  ctx.strokeStyle = "rgba(75, 171, 114, 0.95)";
  ctx.lineWidth = 2;
  ctx.strokeRect(outerRect.x, outerRect.y, outerRect.width, outerRect.height);
  ctx.strokeStyle = "rgba(44, 196, 198, 0.95)";
  ctx.setLineDash([6, 4]);
  ctx.strokeRect(innerRect.x, innerRect.y, innerRect.width, innerRect.height);
  ctx.setLineDash([]);
  if (state.recognition?.watermarkTextAssist) {
    ctx.strokeStyle = "rgba(186, 90, 214, 0.95)";
    ctx.setLineDash([4, 4]);
    ctx.strokeRect(textRect.x, textRect.y, textRect.width, textRect.height);
    ctx.setLineDash([]);
  }

  for (const point of points) {
    ctx.fillStyle = state.sampling.mode === "anchor" ? "#9d5333" : "rgba(44, 196, 198, 0.95)";
    ctx.beginPath();
    ctx.arc(point.x, point.y, state.sampling.mode === "anchor" ? 5 : 3, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = "#745f4b";
  ctx.font = "600 11px 'Segoe UI'";
  ctx.textAlign = "left";
  ctx.fillText("黄框 = 局部中心收缩框", 8, 14);
  ctx.fillText("绿框 = 取样外框", 8, 28);
  ctx.fillText("蓝框 = 避字内框", 8, 168);
  if (state.recognition?.watermarkTextAssist) {
    ctx.fillText("紫框 = 中心文字识别区", 56, 168);
  }
}

function getCellAnalysis(state, cellX, cellY) {
  return state.analysis?.cells?.find((cell) => cell.x === cellX && cell.y === cellY) || null;
}

function drawInspectorMessage(width, height, message) {
  if (!sampleInspectCtx) {
    return;
  }
  sampleInspectCtx.clearRect(0, 0, width, height);
  sampleInspectCtx.fillStyle = "#fffdf8";
  sampleInspectCtx.fillRect(0, 0, width, height);
  sampleInspectCtx.fillStyle = "#6f6257";
  sampleInspectCtx.font = "600 15px 'Segoe UI'";
  sampleInspectCtx.fillText(message, 16, 28);
}

function renderSampleVotePanel(cellAnalysis) {
  if (!sampleInspectVotes) {
    return;
  }

  if (!cellAnalysis) {
    sampleInspectVotes.innerHTML = `<p class="empty-text">解析后，这里会显示当前格子的候选色投票明细。</p>`;
    return;
  }

  const votes = (cellAnalysis.voteBreakdown || []).slice(0, 6);
  const pointCount = cellAnalysis.samplePoints?.length || 0;
  const sampledRgbText = formatRgb(cellAnalysis.sampledRgb || [0, 0, 0]);
  const textAssistText = cellAnalysis.textAssist
    ? ` · 文字 ${cellAnalysis.textAssist.code} ${cellAnalysis.textAssist.applied ? "已采用" : "候选"} ${(cellAnalysis.textAssist.score || 0).toFixed(2)}`
    : "";

  sampleInspectVotes.innerHTML = `
    <div class="sample-votes-head">
      <strong>当前格投票明细</strong>
      <span class="empty-text">采样点 ${pointCount} 个 · 稳定 RGB ${sampledRgbText}${textAssistText}</span>
    </div>
    ${
      votes.length
        ? `<div class="sample-votes-list">
            ${votes
              .map(
                (vote) => `
                  <div class="sample-vote-row ${vote.code === cellAnalysis.code ? "is-winner" : ""}">
                    <div class="sample-vote-main">
                      <span class="sample-vote-swatch" style="background:${rgbToHex(vote.matchedRgb)}"></span>
                      <strong><code>${vote.code}</code></strong>
                    </div>
                    <span>${vote.count} 票</span>
                    <span>${Math.round(vote.ratio * 100)}%</span>
                    <span>距 ${vote.averageDistance.toFixed(1)}</span>
                  </div>
                `,
              )
              .join("")}
          </div>`
        : `<p class="empty-text">当前格还没有可用投票数据。</p>`
    }
  `;
}

function getCellKey(x, y) {
  return `${x},${y}`;
}

function normalizeColorCodeInput(text) {
  return String(text || "").trim().toUpperCase();
}

function buildAvailableColorCodes(state = getState()) {
  const codes = new Set(state.palette.map((entry) => entry.code));
  for (const item of state.analysis?.globalStats || []) {
    if (item.code && item.code !== "EMPTY" && item.code !== "EXCLUDED" && item.code !== "UNSET") {
      codes.add(item.code);
    }
  }
  return [...codes].sort((left, right) => left.localeCompare(right));
}

function getSelectedBatchCells(state = getState()) {
  if (!state.analysis) {
    return [];
  }
  return state.analysis.cells.filter((cell) => analysisBatchSelection.selectedKeys.has(getCellKey(cell.x, cell.y)));
}

function clearBatchSelection({ keepTargetCode = true } = {}) {
  analysisBatchSelection.selectedKeys = new Set();
  analysisBatchSelection.dragRect = null;
  if (!keepTargetCode) {
    analysisBatchSelection.targetCode = "";
    if (batchReplaceCodeInput) {
      batchReplaceCodeInput.value = "";
    }
  }

  if (step4Panel && !document.querySelector("#batchReplaceApplyBtn")) {
    const batchTools = document.createElement("div");
    batchTools.className = "summary-card";
    batchTools.style.marginTop = "12px";
    batchTools.innerHTML = `
      <h3>批量替换修正</h3>
      <p class="plan-text">打开批量模式后，你可以在整体大图里逐个点选错误格子，也可以直接拖框圈一片，再统一替换成正确色号。这个修正会跟着项目一起持久保存。</p>
      <div class="field-grid" style="margin-top:12px;">
        <label class="field" style="display:flex; align-items:center; gap:10px; padding-top:26px;">
          <input id="batchReplaceModeInput" type="checkbox" />
          <span>开启批量替换模式</span>
        </label>
        <label class="field">
          <span>替换成色号</span>
          <input id="batchReplaceCodeInput" type="text" maxlength="12" placeholder="例如 H2 / C17" list="batchReplaceCodeList" />
          <datalist id="batchReplaceCodeList"></datalist>
        </label>
        <div class="field">
          <span>操作</span>
          <div class="button-row">
            <button id="batchReplaceApplyBtn" type="button">替换选中格子</button>
            <button id="batchReplaceClearSelectionBtn" class="ghost-btn" type="button">清除选择</button>
            <button id="batchReplaceClearOverridesBtn" class="ghost-btn" type="button">清除选中修正</button>
          </div>
        </div>
      </div>
      <p id="batchReplaceStatus" class="empty-text" style="margin-top:10px;">关闭时仍可正常浏览。打开后：整体大图拖框 = 框选，点单格 = 多选；5x5 里点单格也能加入选择。</p>
    `;
    step4Panel.appendChild(batchTools);
  }
}

function isBatchReplaceModeEnabled() {
  return Boolean(batchReplaceModeInput?.checked);
}

function setBatchReplaceStatus(message, isError = false) {
  if (!batchReplaceStatus) {
    return;
  }
  batchReplaceStatus.textContent = message;
  batchReplaceStatus.style.color = isError ? "#c13d3d" : "#745f4b";
}

function setLibraryDataStatus(message, isError = false) {
  if (!libraryDataStatus) {
    return;
  }
  libraryDataStatus.textContent = message;
  libraryDataStatus.style.color = isError ? "#c13d3d" : "#745f4b";
}

function medianChannel(values) {
  const sorted = [...values].sort((left, right) => left - right);
  const middle = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 1) {
    return sorted[middle];
  }
  return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
}

function medianRgbList(rgbList) {
  if (!rgbList.length) {
    return [0, 0, 0];
  }
  return [0, 1, 2].map((channel) => medianChannel(rgbList.map((rgb) => rgb[channel])));
}

function buildCalibrationCodeOptions(state = getState()) {
  const codes = new Set(state.palette.map((entry) => entry.code));
  for (const item of state.analysis?.globalStats || []) {
    if (item.code && item.code !== "EMPTY" && item.code !== "EXCLUDED" && item.code !== "UNSET") {
      codes.add(item.code);
    }
  }
  return [...codes].sort((left, right) => left.localeCompare(right));
}

function getCalibrationCellsByCode(code, state = getState()) {
  if (!state.analysis || !code) {
    return [];
  }
  const refs = state.calibrationAssist?.samplesByCode?.[code] || [];
  return refs
    .map((sample) => state.analysis.cells.find((cell) => cell.x === sample.x && cell.y === sample.y))
    .filter(Boolean);
}

function buildPrototypeRgbFromCells(cells) {
  if (!cells.length) {
    return null;
  }
  if (cells.length === 1) {
    return [...cells[0].sampledRgb];
  }

  const candidates = cells.map((cell) => cell.sampledRgb);
  let winner = candidates[0];
  let winnerScore = Number.POSITIVE_INFINITY;

  for (const candidate of candidates) {
    const score = candidates.reduce((sum, other) => sum + getPerceptualDistance(candidate, other), 0);
    if (score < winnerScore) {
      winner = candidate;
      winnerScore = score;
    }
  }

  return [...winner];
}

function buildAnalysisPalette(state = getState()) {
  const calibrationAssist = state.calibrationAssist || {};
  if (!calibrationAssist.enabled) {
    return state.palette;
  }

  const prototypesByCode = calibrationAssist.prototypesByCode || {};
  return state.palette.map((entry) => {
    const prototype = prototypesByCode[entry.code];
    if (!prototype?.rgb) {
      return entry;
    }
    return {
      ...entry,
      rgb: prototype.rgb,
      lab: null,
      sourceRgb: entry.sourceRgb || entry.standardRgb || entry.rgb,
      calibratedRgb: prototype.rgb,
    };
  });
}

function rerunAnalysisWithCurrentState(nextOverrides = getState().manualOverrides) {
  const state = getState();
  if (!state.originalCanvas || !state.crop || !state.palette.length) {
    return null;
  }

  return analyzeGrid({
    originalCanvas: state.originalCanvas,
    crop: state.crop,
    gridSize: state.gridSize,
    palette: buildAnalysisPalette(state),
    sampling: state.sampling,
    recognition: state.recognition,
    gridAlignment: state.gridAlignment,
    overrides: nextOverrides,
  });
}

function buildSeedTargetOptions() {
  const state = getState();
  const codes = new Set(state.palette.map((entry) => entry.code));
  for (const item of state.analysis?.globalStats || []) {
    codes.add(item.code);
  }
  return [...codes].sort((left, right) => left.localeCompare(right));
}

function getSeedCellsByType(type, state = getState()) {
  if (!state.analysis) {
    return [];
  }
  const seeds = type === "contrast" ? state.seedAssist?.contrastSeeds || [] : state.seedAssist?.targetSeeds || [];
  return seeds
    .map((seed) => state.analysis.cells.find((cell) => cell.x === seed.x && cell.y === seed.y))
    .filter(Boolean);
}

function renderSeedAssistPanel() {
  const state = getState();
  const seedAssist = state.seedAssist || {};
  const targetOptions = buildSeedTargetOptions();
  const targetSeeds = getSeedCellsByType("target", state);
  const contrastSeeds = getSeedCellsByType("contrast", state);
  const hasBothCodes =
    Boolean(seedAssist.targetCode) &&
    Boolean(seedAssist.contrastCode) &&
    seedAssist.targetCode !== seedAssist.contrastCode;

  if (seedTargetCodeSelect) {
    seedTargetCodeSelect.innerHTML = [
      `<option value="">璇烽€夋嫨鐩爣鑹插彿</option>`,
      ...targetOptions.map((code) => `<option value="${code}">${code}</option>`),
    ].join("");
    seedTargetCodeSelect.value = seedAssist.targetCode || "";
  }

  if (seedContrastCodeSelect) {
    seedContrastCodeSelect.innerHTML = [
      `<option value="">璇烽€夋嫨瀵圭収鑹插彿</option>`,
      ...targetOptions.map((code) => `<option value="${code}">${code}</option>`),
    ].join("");
    seedContrastCodeSelect.value = seedAssist.contrastCode || "";
  }

  if (seedThresholdInput && document.activeElement !== seedThresholdInput) {
    seedThresholdInput.value = String(seedAssist.threshold ?? 8);
  }

  if (seedAddTargetBtn) {
    seedAddTargetBtn.disabled = !state.analysis || !seedAssist.targetCode;
  }
  if (seedAddContrastBtn) {
    seedAddContrastBtn.disabled = !state.analysis || !seedAssist.contrastCode;
  }
  if (seedAnalyzeBtn) {
    seedAnalyzeBtn.disabled = !state.analysis || !hasBothCodes || !targetSeeds.length || !contrastSeeds.length;
  }
  if (seedApplyBtn) {
    seedApplyBtn.disabled = !state.analysis || !(seedAssist.candidates || []).some((item) => item.currentCode !== item.targetCode);
  }
  if (seedResetOverridesBtn) {
    seedResetOverridesBtn.disabled = !Object.keys(state.manualOverrides || {}).length;
  }

  if (seedTargetList) {
    seedTargetList.innerHTML = targetSeeds.length
      ? targetSeeds
          .map(
            (cell, index) => `
              <button type="button" class="seed-item" data-seed-type="target" data-seed-index="${index}">
                <span><code>${seedAssist.targetCode || cell.code}</code> · (${cell.x},${cell.y})</span>
                <small>${formatRgb(cell.sampledRgb)}</small>
              </button>
            `,
          )
          .join("")
      : `<p class="empty-text">还没有目标种子。先挑几个你确定属于 ${seedAssist.targetCode || "目标色"} 的格子。</p>`;
  }

  if (seedContrastList) {
    seedContrastList.innerHTML = contrastSeeds.length
      ? contrastSeeds
          .map(
            (cell, index) => `
              <button type="button" class="seed-item" data-seed-type="contrast" data-seed-index="${index}">
                <span><code>${seedAssist.contrastCode || cell.code}</code> · (${cell.x},${cell.y})</span>
                <small>${formatRgb(cell.sampledRgb)}</small>
              </button>
            `,
          )
          .join("")
      : `<p class="empty-text">还没有对照种子。先挑几个你确定属于 ${seedAssist.contrastCode || "对照色"} 的格子。</p>`;
  }

  if (seedCandidateList) {
    const candidates = seedAssist.candidates || [];
    seedCandidateList.innerHTML = candidates.length
      ? candidates
          .slice(0, 24)
          .map(
            (item, index) => {
              const targetDistance = Number.isFinite(item.targetDistance) ? item.targetDistance : Number.isFinite(item.distance) ? item.distance : 999;
              const contrastDistance = Number.isFinite(item.contrastDistance) ? item.contrastDistance : 999;
              const margin = Number.isFinite(item.margin) ? item.margin : 0;
              const targetVoteRatio = Number.isFinite(item.targetVoteRatio) ? item.targetVoteRatio : 0;
              const contrastVoteRatio = Number.isFinite(item.contrastVoteRatio) ? item.contrastVoteRatio : 0;
              const neighborSupport = Number.isFinite(item.neighborSupport) ? item.neighborSupport : 0;
              return `
              <button type="button" class="seed-item ${item.currentCode !== item.targetCode ? "is-suggested" : ""}" data-seed-candidate-index="${index}">
                <span><code>(${item.x},${item.y})</code> ${item.currentCode} -> ${item.targetCode}</span>
                <small>T ${targetDistance.toFixed(2)} / C ${contrastDistance.toFixed(2)} · 差值 +${margin.toFixed(2)} · 目标票 ${(targetVoteRatio * 100).toFixed(0)}% · 对照票 ${(contrastVoteRatio * 100).toFixed(0)}% · 邻域 ${neighborSupport}</small>
              </button>
            `;
            },
          )
          .join("")
      : `<p class="empty-text">分析后，这里会列出更像目标色、而且明显不像对照色的候选格子。</p>`;
  }

  if (seedStatus) {
    const candidateCount = seedAssist.candidates?.length || 0;
    const overrideCount = Object.keys(state.manualOverrides || {}).length;
    if (!hasBothCodes && seedAssist.targetCode && seedAssist.contrastCode && seedAssist.targetCode === seedAssist.contrastCode) {
      seedStatus.textContent = `目标色和对照色不能相同。请换一个对照色号。当前已手动修正 ${overrideCount} 格。`;
      return;
    }
    seedStatus.textContent = seedAssist.targetPrototypeRgb && seedAssist.contrastPrototypeRgb
      ? `目标 ${seedAssist.targetCode} · ${targetSeeds.length} 个种子 · 原型 RGB ${formatRgb(seedAssist.targetPrototypeRgb)}；对照 ${seedAssist.contrastCode} · ${contrastSeeds.length} 个种子 · 原型 RGB ${formatRgb(seedAssist.contrastPrototypeRgb)}。当前候选 ${candidateCount} 格，已手动修正 ${overrideCount} 格。`
      : `先解析整图，再分别为目标色 ${seedAssist.targetCode || "未选"} 和对照色 ${seedAssist.contrastCode || "未选"} 挑几个你确定的格子当种子。当前已手动修正 ${overrideCount} 格。`;
  }
}

function addCurrentCellAsSeed(type = "target") {
  const state = getState();
  const seedCode = type === "contrast" ? state.seedAssist?.contrastCode || "" : state.seedAssist?.targetCode || "";
  if (!state.analysis || !seedCode) {
    return;
  }

  const cell = state.analysis.cells.find(
    (item) => item.x === state.selectedPreviewCell?.x && item.y === state.selectedPreviewCell?.y,
  );
  if (!cell || cell.excluded) {
    return;
  }

  const seedKey = type === "contrast" ? "contrastSeeds" : "targetSeeds";
  const prototypeKey = type === "contrast" ? "contrastPrototypeRgb" : "targetPrototypeRgb";
  const nextSeeds = [...(state.seedAssist?.[seedKey] || [])];
  if (!nextSeeds.some((seed) => seed.x === cell.x && seed.y === cell.y)) {
    nextSeeds.push({ x: cell.x, y: cell.y });
  }

  patchState({
    seedAssist: {
      ...state.seedAssist,
      [seedKey]: nextSeeds,
      candidates: [],
      [prototypeKey]: null,
    },
  });
}

function analyzeSeedCandidates() {
  const state = getState();
  const targetCode = state.seedAssist?.targetCode || "";
  const contrastCode = state.seedAssist?.contrastCode || "";
  if (!state.analysis || !targetCode || !contrastCode || targetCode === contrastCode) {
    return;
  }

  const targetSeedCells = getSeedCellsByType("target", state);
  const contrastSeedCells = getSeedCellsByType("contrast", state);
  if (!targetSeedCells.length || !contrastSeedCells.length) {
    return;
  }

  const threshold = Number(state.seedAssist?.threshold || 8);
  const targetPrototypeRgb = medianRgbList(targetSeedCells.map((cell) => cell.sampledRgb));
  const contrastPrototypeRgb = medianRgbList(contrastSeedCells.map((cell) => cell.sampledRgb));
  const paletteByCode = new Map(state.palette.map((entry) => [entry.code, entry.rgb]));
  const targetSeedKeySet = new Set(targetSeedCells.map((cell) => getCellKey(cell.x, cell.y)));
  const contrastSeedKeySet = new Set(contrastSeedCells.map((cell) => getCellKey(cell.x, cell.y)));
  const preliminary = state.analysis.cells.map((cell) => {
    if (cell.excluded) {
      return {
        cell,
        targetDistance: Number.POSITIVE_INFINITY,
        contrastDistance: Number.POSITIVE_INFINITY,
        margin: Number.NEGATIVE_INFINITY,
        currentAssignedDistance: Number.POSITIVE_INFINITY,
        currentImprovement: Number.NEGATIVE_INFINITY,
        targetVoteRatio: 0,
        contrastVoteRatio: 0,
      };
    }
    const targetDistance = getPerceptualDistance(cell.sampledRgb, targetPrototypeRgb);
    const contrastDistance = getPerceptualDistance(cell.sampledRgb, contrastPrototypeRgb);
    const currentRgb = paletteByCode.get(cell.code) || cell.matchedRgb;
    const currentAssignedDistance = getPerceptualDistance(cell.sampledRgb, currentRgb);
    const targetVote = (cell.voteBreakdown || []).find((item) => item.code === targetCode);
    const contrastVote = (cell.voteBreakdown || []).find((item) => item.code === contrastCode);
    return {
      cell,
      targetDistance,
      contrastDistance,
      margin: contrastDistance - targetDistance,
      currentAssignedDistance,
      currentImprovement: currentAssignedDistance - targetDistance,
      targetVoteRatio: targetVote?.ratio || 0,
      contrastVoteRatio: contrastVote?.ratio || 0,
    };
  });
  const targetAffinityMap = new Map(
    preliminary.map((item) => [
      getCellKey(item.cell.x, item.cell.y),
      item.margin >= 0.8 && item.targetDistance <= threshold * 1.15,
    ]),
  );

  const candidates = preliminary
    .map((entry) => {
      const { cell, targetDistance, contrastDistance, margin, currentAssignedDistance, currentImprovement, targetVoteRatio, contrastVoteRatio } = entry;
      const neighborKeys = [
        getCellKey(cell.x - 1, cell.y),
        getCellKey(cell.x + 1, cell.y),
        getCellKey(cell.x, cell.y - 1),
        getCellKey(cell.x, cell.y + 1),
      ];
      const neighborSupport = neighborKeys.filter((key) => targetAffinityMap.get(key)).length;
      const nearTargetSeed = targetSeedCells.some((seedCell) => Math.abs(seedCell.x - cell.x) + Math.abs(seedCell.y - cell.y) <= 1);
      const voteLead = targetVoteRatio - contrastVoteRatio;
      const strongTargetEvidence = cell.code === targetCode || targetVoteRatio >= 0.2 || currentImprovement >= 1;
      const continuityGate = neighborSupport >= 1 || targetVoteRatio >= 0.34 || nearTargetSeed;
      const contrastBlock =
        cell.code === contrastCode &&
        (margin < Math.max(2.2, threshold * 0.28) || voteLead < 0.12 || targetDistance > threshold * 0.78);
      const pass =
        targetDistance <= threshold &&
        margin >= Math.max(1.1, threshold * 0.14) &&
        voteLead >= -0.02 &&
        strongTargetEvidence &&
        continuityGate &&
        !contrastBlock &&
        !contrastSeedKeySet.has(getCellKey(cell.x, cell.y));
      return {
        x: cell.x,
        y: cell.y,
        currentCode: cell.code,
        targetCode,
        contrastCode,
        targetDistance,
        contrastDistance,
        margin,
        neighborSupport,
        targetVoteRatio,
        contrastVoteRatio,
        currentAssignedDistance,
        improvement: currentImprovement,
        voteLead,
        isTargetSeed: targetSeedKeySet.has(getCellKey(cell.x, cell.y)),
        isContrastSeed: contrastSeedKeySet.has(getCellKey(cell.x, cell.y)),
        pass,
      };
    })
    .filter(
      (item) =>
        item.isTargetSeed || item.pass,
    )
    .sort(
      (left, right) =>
        Number(right.isTargetSeed) - Number(left.isTargetSeed) ||
        right.margin - left.margin ||
        right.targetVoteRatio - left.targetVoteRatio ||
        right.improvement - left.improvement ||
        left.targetDistance - right.targetDistance,
    );

  patchState({
    seedAssist: {
      ...state.seedAssist,
      targetPrototypeRgb,
      contrastPrototypeRgb,
      candidates,
    },
  });
}

function applySeedCandidates() {
  const state = getState();
  const targetCode = state.seedAssist?.targetCode || "";
  const candidates = state.seedAssist?.candidates || [];
  if (!state.analysis || !targetCode || !candidates.length) {
    return;
  }

  const nextOverrides = { ...(state.manualOverrides || {}) };
  for (const item of candidates) {
    if (item.currentCode !== targetCode) {
      nextOverrides[getCellKey(item.x, item.y)] = targetCode;
    }
  }

  const nextAnalysis = rerunAnalysisWithCurrentState(nextOverrides);
  if (!nextAnalysis) {
    return;
  }

  patchState({
    manualOverrides: nextOverrides,
    analysis: nextAnalysis,
    currentChunkIndex: 0,
    seedAssist: {
      ...state.seedAssist,
      candidates: candidates.map((item) => ({ ...item, currentCode: targetCode })),
    },
  });
}

function clearManualOverrides() {
  const nextAnalysis = rerunAnalysisWithCurrentState({});
  patchState({
    manualOverrides: {},
    analysis: nextAnalysis,
    currentChunkIndex: 0,
  });
}

function drawRealSamplingInspector() {
  if (!sampleInspectCanvas || !sampleInspectCtx) {
    return;
  }

  const state = getState();
  const inspectWindow = Math.max(3, Number.parseInt(state.sampleInspectWindow || 3, 10) || 3);
  const inspectRadius = Math.floor(inspectWindow / 2);
  const width = sampleInspectCanvas.clientWidth || 320;
  const height = Math.max(280, Math.min(inspectWindow >= 11 ? 640 : 540, Math.round(width * (inspectWindow >= 11 ? 1.02 : inspectWindow >= 7 ? 0.95 : 0.88))));
  ensureCanvasSize(sampleInspectCanvas, width, height);
  sampleInspectHitRegions = [];
  sampleInspectOverlay = null;
  if (!state.image.element || !state.crop || !state.cropConfirmed) {
    drawInspectorMessage(width, height, "先完成裁剪确认，这里才会显示真实网格采样。");
    if (sampleInspectStatus) {
      sampleInspectStatus.textContent = "先上传图片并确认裁剪，然后再用这个检查器看真实采样位置。";
    }
    renderSampleVotePanel(null);
    return;
  }

  const selected = clampPreviewCell(state.selectedPreviewCell, state.gridSize);
  const cells = [];
  for (let cellY = Math.max(1, selected.y - inspectRadius); cellY <= Math.min(state.gridSize.height, selected.y + inspectRadius); cellY += 1) {
    for (let cellX = Math.max(1, selected.x - inspectRadius); cellX <= Math.min(state.gridSize.width, selected.x + inspectRadius); cellX += 1) {
      const rect = getCellRectByIndex(state, cellX, cellY);
      if (!rect) {
        continue;
      }
      cells.push({ x: cellX, y: cellY, rect, analysis: getCellAnalysis(state, cellX, cellY) });
    }
  }

  if (!cells.length) {
    drawInspectorMessage(width, height, "当前格子超出有效网格，请调一下裁剪或单格参数。");
    if (sampleInspectStatus) {
      sampleInspectStatus.textContent = "当前预览格无法映射到有效网格，请调一下裁剪、偏移或单格比例。";
    }
    renderSampleVotePanel(null);
    return;
  }

  const bounds = cells.reduce(
    (acc, item) => ({
      x: Math.min(acc.x, item.rect.x),
      y: Math.min(acc.y, item.rect.y),
      right: Math.max(acc.right, item.rect.x + item.rect.width),
      bottom: Math.max(acc.bottom, item.rect.y + item.rect.height),
    }),
    { x: Number.POSITIVE_INFINITY, y: Number.POSITIVE_INFINITY, right: Number.NEGATIVE_INFINITY, bottom: Number.NEGATIVE_INFINITY },
  );
  const sourceWidth = Math.max(1, bounds.right - bounds.x);
  const sourceHeight = Math.max(1, bounds.bottom - bounds.y);
  const padding = 18;
  const labelBand = 34;
  const scale = Math.min((width - padding * 2) / sourceWidth, (height - padding * 2 - labelBand) / sourceHeight);
  const drawWidth = sourceWidth * scale;
  const drawHeight = sourceHeight * scale;
  const offsetX = (width - drawWidth) / 2;
  const offsetY = labelBand + (height - labelBand - drawHeight) / 2;

  sampleInspectCtx.clearRect(0, 0, width, height);
  sampleInspectCtx.fillStyle = "#fffdf8";
  sampleInspectCtx.fillRect(0, 0, width, height);
  sampleInspectCtx.drawImage(
    state.image.element,
    bounds.x,
    bounds.y,
    sourceWidth,
    sourceHeight,
    offsetX,
    offsetY,
    drawWidth,
    drawHeight,
  );

  sampleInspectCtx.strokeStyle = "rgba(48, 33, 22, 0.18)";
  sampleInspectCtx.lineWidth = 1;

  for (const item of cells) {
    const drawX = offsetX + (item.rect.x - bounds.x) * scale;
    const drawY = offsetY + (item.rect.y - bounds.y) * scale;
    const drawW = item.rect.width * scale;
    const drawH = item.rect.height * scale;
    sampleInspectCtx.strokeRect(drawX, drawY, drawW, drawH);
    sampleInspectHitRegions.push({ x: item.x, y: item.y, drawX, drawY, drawW, drawH });

    if (item.x === selected.x && item.y === selected.y) {
      sampleInspectCtx.fillStyle = "rgba(244, 198, 79, 0.18)";
      sampleInspectCtx.fillRect(drawX, drawY, drawW, drawH);
      sampleInspectCtx.strokeStyle = "rgba(244, 198, 79, 0.96)";
      sampleInspectCtx.lineWidth = 3;
      sampleInspectCtx.strokeRect(drawX, drawY, drawW, drawH);
      sampleInspectCtx.strokeStyle = "rgba(48, 33, 22, 0.18)";
      sampleInspectCtx.lineWidth = 1;
    }

    sampleInspectCtx.fillStyle = "rgba(48, 33, 22, 0.72)";
    sampleInspectCtx.font = `700 ${Math.max(10, Math.min(14, Math.floor(Math.min(drawW, drawH) * 0.18)))}px 'Segoe UI'`;
    sampleInspectCtx.textAlign = "left";
    sampleInspectCtx.textBaseline = "top";
    sampleInspectCtx.fillText(`${item.x},${item.y}`, drawX + 4, drawY + 4);
  }

  const selectedRect = getCellRectByIndex(state, selected.x, selected.y);
  const selectedAnalysis = getCellAnalysis(state, selected.x, selected.y);
  if (selectedRect) {
    const { samplingRect, outerRect, innerRect, points } = buildSamplingPreviewPoints(selectedRect, state.sampling);
    const textRect = getTextAssistRect(selectedRect);
    const cellBoxX = offsetX + (selectedRect.x - bounds.x) * scale;
    const cellBoxY = offsetY + (selectedRect.y - bounds.y) * scale;
    const cellBoxW = selectedRect.width * scale;
    const cellBoxH = selectedRect.height * scale;
    const previewX = offsetX + (samplingRect.x - bounds.x) * scale;
    const previewY = offsetY + (samplingRect.y - bounds.y) * scale;
    const previewW = samplingRect.width * scale;
    const previewH = samplingRect.height * scale;
    const outerX = offsetX + (outerRect.x - bounds.x) * scale;
    const outerY = offsetY + (outerRect.y - bounds.y) * scale;
    const outerW = outerRect.width * scale;
    const outerH = outerRect.height * scale;
    const innerX = offsetX + (innerRect.x - bounds.x) * scale;
    const innerY = offsetY + (innerRect.y - bounds.y) * scale;
    const innerW = innerRect.width * scale;
    const innerH = innerRect.height * scale;
    const centerX = previewX + previewW / 2;
    const centerY = previewY + previewH / 2;
    const textX = offsetX + (textRect.x - bounds.x) * scale;
    const textY = offsetY + (textRect.y - bounds.y) * scale;
    const textW = textRect.width * scale;
    const textH = textRect.height * scale;
    const handleRadius = Math.max(7, Math.min(11, Math.round(Math.min(previewW, previewH) * 0.08)));
    const handleDiameter = handleRadius * 2;
    const handles = {
      nw: { x: previewX, y: previewY },
      n: { x: previewX + previewW / 2, y: previewY },
      ne: { x: previewX + previewW, y: previewY },
      e: { x: previewX + previewW, y: previewY + previewH / 2 },
      se: { x: previewX + previewW, y: previewY + previewH },
      s: { x: previewX + previewW / 2, y: previewY + previewH },
      sw: { x: previewX, y: previewY + previewH },
      w: { x: previewX, y: previewY + previewH / 2 },
    };

    sampleInspectCtx.strokeStyle = "rgba(244, 198, 79, 0.34)";
    sampleInspectCtx.lineWidth = 2;
    sampleInspectCtx.strokeRect(cellBoxX, cellBoxY, cellBoxW, cellBoxH);
    sampleInspectCtx.strokeStyle = "rgba(244, 198, 79, 0.96)";
    sampleInspectCtx.lineWidth = 3;
    sampleInspectCtx.strokeRect(previewX, previewY, previewW, previewH);
    sampleInspectCtx.strokeStyle = "rgba(75, 171, 114, 0.96)";
    sampleInspectCtx.lineWidth = 2;
    sampleInspectCtx.strokeRect(outerX, outerY, outerW, outerH);
    sampleInspectCtx.strokeStyle = "rgba(44, 196, 198, 0.98)";
    sampleInspectCtx.setLineDash([7, 5]);
    sampleInspectCtx.strokeRect(innerX, innerY, innerW, innerH);
    sampleInspectCtx.setLineDash([]);
    sampleInspectCtx.strokeStyle = "rgba(244, 198, 79, 0.35)";
    sampleInspectCtx.lineWidth = 1.2;
    sampleInspectCtx.beginPath();
    sampleInspectCtx.moveTo(centerX, cellBoxY);
    sampleInspectCtx.lineTo(centerX, cellBoxY + cellBoxH);
    sampleInspectCtx.moveTo(cellBoxX, centerY);
    sampleInspectCtx.lineTo(cellBoxX + cellBoxW, centerY);
    sampleInspectCtx.stroke();
    if (state.recognition?.watermarkTextAssist) {
      sampleInspectCtx.strokeStyle = "rgba(186, 90, 214, 0.98)";
      sampleInspectCtx.setLineDash([5, 4]);
      sampleInspectCtx.strokeRect(textX, textY, textW, textH);
      sampleInspectCtx.setLineDash([]);
    }

    for (const point of points) {
      const x = offsetX + (point.x - bounds.x) * scale;
      const y = offsetY + (point.y - bounds.y) * scale;
      sampleInspectCtx.beginPath();
      sampleInspectCtx.fillStyle = state.sampling.mode === "anchor" ? "#9d5333" : "rgba(44, 196, 198, 0.96)";
      sampleInspectCtx.arc(x, y, state.sampling.mode === "anchor" ? 5 : 3.5, 0, Math.PI * 2);
      sampleInspectCtx.fill();
      sampleInspectCtx.strokeStyle = "rgba(255,255,255,0.9)";
      sampleInspectCtx.lineWidth = 1;
      sampleInspectCtx.stroke();
    }

    sampleInspectCtx.beginPath();
    sampleInspectCtx.fillStyle = "rgba(244, 198, 79, 0.98)";
    sampleInspectCtx.arc(centerX, centerY, 4.5, 0, Math.PI * 2);
    sampleInspectCtx.fill();
    sampleInspectCtx.strokeStyle = "rgba(255,255,255,0.96)";
    sampleInspectCtx.lineWidth = 1.2;
    sampleInspectCtx.stroke();

    sampleInspectCtx.fillStyle = "#ffffff";
    sampleInspectCtx.strokeStyle = "rgba(244, 198, 79, 0.98)";
    sampleInspectCtx.lineWidth = 2;
    for (const handle of Object.values(handles)) {
      sampleInspectCtx.beginPath();
      sampleInspectCtx.arc(handle.x, handle.y, handleRadius, 0, Math.PI * 2);
      sampleInspectCtx.fill();
      sampleInspectCtx.stroke();
    }

    sampleInspectOverlay = {
      cellBox: { x: cellBoxX, y: cellBoxY, width: cellBoxW, height: cellBoxH },
      previewBox: { x: previewX, y: previewY, width: previewW, height: previewH },
      handles,
      handleRadius,
      handleDiameter,
      scale,
      selected,
      baseRect: selectedRect,
    };
  }

  sampleInspectCtx.fillStyle = "#302116";
  sampleInspectCtx.font = "800 13px 'Segoe UI'";
  sampleInspectCtx.textAlign = "left";
  sampleInspectCtx.textBaseline = "middle";
  sampleInspectCtx.fillText(`真实采样检查 · ${inspectWindow}x${inspectWindow} · 当前格 ${selected.x},${selected.y}`, 14, 18);
  if (sampleInspectStatus) {
    const cellLabel = selectedAnalysis?.code === "EMPTY" ? "空白格" : `识别 ${selectedAnalysis?.code}`;
    const localScale = getLocalSamplingScale(state.sampling);
    sampleInspectStatus.textContent = selectedAnalysis
      ? `当前检查格 (${selected.x},${selected.y}) · ${selectedAnalysis.excluded ? "已按外层剔除跳过" : cellLabel}${selectedAnalysis.manualOverride ? "（手动修正）" : ""}${selectedAnalysis.textAssist?.applied ? ` · 文字辅助 ${selectedAnalysis.textAssist.code}` : ""} · 采样 RGB ${formatRgb(selectedAnalysis.sampledRgb)} · 置信 ${selectedAnalysis.confidence.toFixed(2)} · 局部收缩 ${Math.round(localScale.x * 100)}% x ${Math.round(localScale.y * 100)}%。拖黄框可平移，拖白色圆点会记住这个中心收缩比例，并用于所有格子。`
      : `当前检查格 (${selected.x},${selected.y}) · 还没做整图解析。先用这个视图把网格边界、外框和采样点调准，再点“解析整张网格”。白点缩放现在会记住局部中心收缩比例。`;
  }
  renderSampleVotePanel(selectedAnalysis);
}

function drawSamplingOverlayOnCrop(originX, originY, zoomScale) {
  const state = getState();
  if (!state.showSamplingOverlay) {
    return;
  }

  const previewRect = getCellRectByIndex(
    state,
    state.selectedPreviewCell?.x || 1,
    state.selectedPreviewCell?.y || 1,
  );
  if (previewRect) {
    const { samplingRect, outerRect, innerRect, points } = buildSamplingPreviewPoints(previewRect, state.sampling);
    const textRect = getTextAssistRect(previewRect);
    const cellBoxX = originX + (previewRect.x - state.crop.x) * zoomScale;
    const cellBoxY = originY + (previewRect.y - state.crop.y) * zoomScale;
    const cellBoxW = previewRect.width * zoomScale;
    const cellBoxH = previewRect.height * zoomScale;
    const previewX = originX + (samplingRect.x - state.crop.x) * zoomScale;
    const previewY = originY + (samplingRect.y - state.crop.y) * zoomScale;
    const previewW = samplingRect.width * zoomScale;
    const previewH = samplingRect.height * zoomScale;
    const centerX = previewX + previewW / 2;
    const centerY = previewY + previewH / 2;
    const outerX = originX + (outerRect.x - state.crop.x) * zoomScale;
    const outerY = originY + (outerRect.y - state.crop.y) * zoomScale;
    const outerW = outerRect.width * zoomScale;
    const outerH = outerRect.height * zoomScale;
    const innerX = originX + (innerRect.x - state.crop.x) * zoomScale;
    const innerY = originY + (innerRect.y - state.crop.y) * zoomScale;
    const innerW = innerRect.width * zoomScale;
    const innerH = innerRect.height * zoomScale;
    const textX = originX + (textRect.x - state.crop.x) * zoomScale;
    const textY = originY + (textRect.y - state.crop.y) * zoomScale;
    const textW = textRect.width * zoomScale;
    const textH = textRect.height * zoomScale;

    cropCtx.strokeStyle = "rgba(244, 198, 79, 0.32)";
    cropCtx.lineWidth = 1.5;
    cropCtx.strokeRect(cellBoxX, cellBoxY, cellBoxW, cellBoxH);
    cropCtx.strokeStyle = "rgba(244, 198, 79, 0.95)";
    cropCtx.lineWidth = 2;
    cropCtx.strokeRect(previewX, previewY, previewW, previewH);
    cropCtx.strokeStyle = "rgba(75, 171, 114, 0.95)";
    cropCtx.strokeRect(outerX, outerY, outerW, outerH);
    cropCtx.strokeStyle = "rgba(44, 196, 198, 0.95)";
    cropCtx.setLineDash([6, 4]);
    cropCtx.strokeRect(innerX, innerY, innerW, innerH);
    cropCtx.setLineDash([]);
    cropCtx.strokeStyle = "rgba(244, 198, 79, 0.3)";
    cropCtx.lineWidth = 1;
    cropCtx.beginPath();
    cropCtx.moveTo(centerX, cellBoxY);
    cropCtx.lineTo(centerX, cellBoxY + cellBoxH);
    cropCtx.moveTo(cellBoxX, centerY);
    cropCtx.lineTo(cellBoxX + cellBoxW, centerY);
    cropCtx.stroke();
    if (state.recognition?.watermarkTextAssist) {
      cropCtx.strokeStyle = "rgba(186, 90, 214, 0.95)";
      cropCtx.setLineDash([4, 4]);
      cropCtx.strokeRect(textX, textY, textW, textH);
      cropCtx.setLineDash([]);
    }

    for (const point of points) {
      const x = originX + (point.x - state.crop.x) * zoomScale;
      const y = originY + (point.y - state.crop.y) * zoomScale;
      cropCtx.beginPath();
      cropCtx.fillStyle = state.sampling.mode === "anchor" ? "rgba(157, 83, 51, 0.96)" : "rgba(44, 196, 198, 0.92)";
      cropCtx.arc(x, y, state.sampling.mode === "anchor" ? Math.max(3, zoomScale * 0.12) : (zoomScale > 5 ? 2.2 : 1.2), 0, Math.PI * 2);
      cropCtx.fill();
    }

    cropCtx.beginPath();
    cropCtx.fillStyle = "rgba(244, 198, 79, 0.96)";
    cropCtx.arc(centerX, centerY, Math.max(2.2, zoomScale * 0.11), 0, Math.PI * 2);
    cropCtx.fill();
  }

  if (!state.analysis) {
    return;
  }

  for (const cell of state.analysis.cells) {
    if (cell.confidence < 0.55) {
      const cellX = originX + (cell.cellStartX - state.analysis.crop.x) * zoomScale;
      const cellY = originY + (cell.cellStartY - state.analysis.crop.y) * zoomScale;
      const cellW = cell.cellWidth * zoomScale;
      const cellH = cell.cellHeight * zoomScale;
      cropCtx.strokeStyle = "rgba(231, 0, 47, 0.55)";
      cropCtx.lineWidth = 1.5;
      cropCtx.strokeRect(cellX + 1, cellY + 1, cellW - 2, cellH - 2);
    }
  }
}

function drawCropCanvas() {
  const state = getState();
  const { image, crop, cropDisplay, pickerMode, cropConfirmed } = state;

  if (!image.element || !cropDisplay) {
    const width = cropCanvas.clientWidth || 320;
    const height = 320;
    ensureCanvasSize(cropCanvas, width, height);
    cropCtx.clearRect(0, 0, width, height);
    cropCtx.fillStyle = "#6f6257";
    cropCtx.font = "600 16px 'Segoe UI'";
    cropCtx.fillText("先上传一张图纸，这里才会显示裁剪预览。", 18, 40);
    return;
  }

  if (!crop) {
    cropCtx.clearRect(0, 0, cropCanvas.clientWidth, cropCanvas.clientHeight);
    cropCtx.drawImage(image.element, 0, 0, cropDisplay.drawWidth, cropDisplay.drawHeight);
    return;
  }

  if (cropConfirmed) {
    const canvasWidth = cropCanvas.clientWidth || cropDisplay.drawWidth;
    const canvasHeight = Math.max(320, cropCanvas.clientHeight || cropDisplay.drawHeight);
    ensureCanvasSize(cropCanvas, canvasWidth, canvasHeight);
    cropCtx.clearRect(0, 0, canvasWidth, canvasHeight);

    const zoomScale = Math.min(canvasWidth / crop.width, canvasHeight / crop.height);
    const zoomWidth = crop.width * zoomScale;
    const zoomHeight = crop.height * zoomScale;
    const originX = (canvasWidth - zoomWidth) / 2;
    const originY = (canvasHeight - zoomHeight) / 2;

    cropCtx.fillStyle = "#fffdf8";
    cropCtx.fillRect(originX - 4, originY - 4, zoomWidth + 8, zoomHeight + 8);
    cropCtx.drawImage(
      image.element,
      crop.x,
      crop.y,
      crop.width,
      crop.height,
      originX,
      originY,
      zoomWidth,
      zoomHeight,
    );

    const metrics = getEffectiveGridMetrics(state);
    cropCtx.strokeStyle = "rgba(48, 33, 22, 0.18)";
    cropCtx.lineWidth = 1;

    if (metrics) {
      for (let gridX = 0; gridX <= state.gridSize.width; gridX += 1) {
        const x = originX + (metrics.originX + gridX * metrics.cellWidth - crop.x) * zoomScale;
        cropCtx.beginPath();
        cropCtx.moveTo(x, originY);
        cropCtx.lineTo(x, originY + zoomHeight);
        cropCtx.stroke();
      }

      for (let gridY = 0; gridY <= state.gridSize.height; gridY += 1) {
        const y = originY + (metrics.originY + gridY * metrics.cellHeight - crop.y) * zoomScale;
        cropCtx.beginPath();
        cropCtx.moveTo(originX, y);
        cropCtx.lineTo(originX + zoomWidth, y);
        cropCtx.stroke();
      }
    }

    drawSamplingOverlayOnCrop(originX, originY, zoomScale);
    cropCtx.fillStyle = "#302116";
    cropCtx.font = "700 13px 'Segoe UI'";
    cropCtx.fillText(
      `已确认裁剪 · 预览格 ${state.selectedPreviewCell?.x || 1},${state.selectedPreviewCell?.y || 1}`,
      originX + 8,
      Math.max(22, originY - 10),
    );
    return;
  }

  cropCtx.clearRect(0, 0, cropCanvas.clientWidth, cropCanvas.clientHeight);
  cropCtx.drawImage(image.element, 0, 0, cropDisplay.drawWidth, cropDisplay.drawHeight);
  cropCtx.fillStyle = "rgba(40, 27, 19, 0.42)";
  cropCtx.fillRect(0, 0, cropDisplay.drawWidth, cropDisplay.drawHeight);

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
    pickerMode ? "取色模式：点击图片任意位置取色。" : `裁剪区域 ${Math.round(crop.width)} x ${Math.round(crop.height)}`,
    left + 10,
    Math.max(18, top + 22),
  );
}

function renderPaletteList() {
  const { palette, paletteSetName } = getState();
  paletteStatus.textContent = `${palette.length} 个色号`;
  if (paletteSetNameText) {
    paletteSetNameText.textContent = paletteSetName || "当前项目色卡";
  }

  if (!palette.length) {
    paletteList.innerHTML = `<p class="empty-text">先添加色卡颜色，后续每个格子才会匹配到最近的色号。</p>`;
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
          <button type="button" class="ghost-btn" data-remove-index="${index}">Remove</button>
        </div>
      `,
    )
    .join("");

  if (togglePaletteBtn && !paletteExpanded) {
    togglePaletteBtn.innerHTML = `<span id="togglePaletteIcon">▼</span> 展开色卡列表（${palette.length} 色）`;
  }

  if (paletteExpanded && paletteSearchInput?.value) {
    filterPalette();
  }
}

function renderFocusColorOptions() {
  if (!focusColorSelect) {
    return;
  }

  const { analysis, focusColorCode } = getState();
  const options = ['<option value="">鏄剧ず鍏ㄩ儴棰滆壊</option>'];
  if (analysis) {
    for (const item of analysis.globalStats) {
      options.push(`<option value="${item.code}">${item.code} (${item.count})</option>`);
    }
  }
  focusColorSelect.innerHTML = options.join("");
  focusColorSelect.value = focusColorCode || "";
}

function togglePalette() {
  if (!togglePaletteBtn || !paletteSearchInput) {
    return;
  }

  paletteExpanded = !paletteExpanded;
  paletteList.style.display = paletteExpanded ? "grid" : "none";
  paletteSearchInput.style.display = paletteExpanded ? "block" : "none";
  togglePaletteBtn.innerHTML = paletteExpanded
    ? `<span id="togglePaletteIcon">▲</span> 收起色卡列表`
    : `<span id="togglePaletteIcon">▼</span> 展开色卡列表（${getState().palette.length} 色）`;

  if (!paletteExpanded) {
    paletteSearchInput.value = "";
    filterPalette();
  }
}

function filterPalette() {
  if (!paletteSearchInput) {
    return;
  }

  const query = paletteSearchInput.value.trim().toUpperCase();
  for (const item of paletteList.querySelectorAll(".palette-item")) {
    const code = item.querySelector("code")?.textContent || "";
    item.style.display = !query || code.includes(query) ? "flex" : "none";
  }
}

function switchTab(tabId) {
  if (!tabBtns.length || !tabPanels.length) {
    return;
  }

  for (const button of tabBtns) {
    button.classList.toggle("active", button.dataset.tab === tabId);
  }

  for (const panel of tabPanels) {
    panel.classList.toggle("active", panel.id === tabId);
  }

  window.setTimeout(() => {
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
  }, 40);
}

function renderSummary() {
  const state = getState();
  const { image, crop, gridSize, analysis, currentChunkIndex, strategyType, focusColorCode } = state;
  imageStatus.textContent = image.element ? "图片已加载" : "未加载图片";
  imageSizeText.textContent = image.width && image.height ? `${image.width} x ${image.height}` : "-";
  pickColorBtn.textContent = state.pickerMode ? "点图取色中" : "从图片取色";
  parseStatus.textContent = analysis ? "解析完成" : "等待解析";
  analyzeBtn.disabled = !image.element || !crop || !state.palette.length;
  downloadJsonBtn.disabled = !analysis;
  prevChunkBtn.disabled = !analysis || currentChunkIndex <= 0;
  nextChunkBtn.disabled = !analysis || currentChunkIndex >= (analysis?.chunks.length || 1) - 1;
  if (moveUpBtn) {
    moveUpBtn.disabled = !analysis || analysis.chunks[currentChunkIndex]?.chunkRow <= 1;
  }
  if (moveDownBtn) {
    moveDownBtn.disabled =
      !analysis || analysis.chunks[currentChunkIndex]?.chunkRow >= Math.ceil((analysis?.gridHeight || 0) / 5);
  }
  if (moveLeftBtn) {
    moveLeftBtn.disabled = !analysis || analysis.chunks[currentChunkIndex]?.chunkCol <= 1;
  }
  if (moveRightBtn) {
    moveRightBtn.disabled =
      !analysis || analysis.chunks[currentChunkIndex]?.chunkCol >= Math.ceil((analysis?.gridWidth || 0) / 5);
  }
  if (tabStep4Btn) {
    tabStep4Btn.disabled = !analysis;
  }
  if (sampleOverlayToggle) {
    sampleOverlayToggle.textContent = state.showSamplingOverlay ? "隐藏采样点" : "显示采样点";
  }
  if (sampleModeSelect && document.activeElement !== sampleModeSelect) {
    sampleModeSelect.value = state.sampling.mode || "ring";
  }
  if (sampleOuterMarginInput && document.activeElement !== sampleOuterMarginInput) {
    sampleOuterMarginInput.value = Math.round((state.sampling.outerMarginRatio || 0.1) * 100);
  }
  if (sampleInsetInput && document.activeElement !== sampleInsetInput) {
    sampleInsetInput.value = Math.round((state.sampling.innerExclusionRatio || 0.24) * 100);
  }
  if (sampleOffsetXInput && document.activeElement !== sampleOffsetXInput) {
    sampleOffsetXInput.value = Math.round((state.sampling.offsetXRatio || 0) * 100);
  }
  if (sampleOffsetYInput && document.activeElement !== sampleOffsetYInput) {
    sampleOffsetYInput.value = Math.round((state.sampling.offsetYRatio || 0) * 100);
  }
  if (watermarkTextAssistInput) {
    watermarkTextAssistInput.checked = Boolean(state.recognition?.watermarkTextAssist);
  }
  if (chartTextPriorityInput) {
    chartTextPriorityInput.checked = Boolean(state.recognition?.chartTextPriority);
  }
  if (preserveBlankWithoutTextInput) {
    preserveBlankWithoutTextInput.checked = state.recognition?.preserveBlankWithoutText !== false;
  }
  if (excludeOuterLayersInput && document.activeElement !== excludeOuterLayersInput) {
    excludeOuterLayersInput.value = String(state.recognition?.excludeOuterLayers || 0);
  }
  if (gridOffsetXInput && document.activeElement !== gridOffsetXInput) {
    gridOffsetXInput.value = (state.gridAlignment?.offsetX || 0).toFixed(1);
  }
  if (gridOffsetYInput && document.activeElement !== gridOffsetYInput) {
    gridOffsetYInput.value = (state.gridAlignment?.offsetY || 0).toFixed(1);
  }
  if (cellWidthScaleInput && document.activeElement !== cellWidthScaleInput) {
    cellWidthScaleInput.value = Math.round((state.gridAlignment?.cellWidthScale || 1) * 100);
  }
  if (cellHeightScaleInput && document.activeElement !== cellHeightScaleInput) {
    cellHeightScaleInput.value = Math.round((state.gridAlignment?.cellHeightScale || 1) * 100);
  }
  if (previewCellInput && document.activeElement !== previewCellInput) {
    previewCellInput.value = `${state.selectedPreviewCell?.x || 1},${state.selectedPreviewCell?.y || 1}`;
  }
  if (sampleInspectWindowSelect && document.activeElement !== sampleInspectWindowSelect) {
    sampleInspectWindowSelect.value = String(state.sampleInspectWindow || 3);
  }
  if (libraryProjectNameInput && document.activeElement !== libraryProjectNameInput) {
    libraryProjectNameInput.value = state.currentProjectName || normalizeProjectName(state.storedImage?.name || "");
  }
  if (libraryProjectStatusSelect && document.activeElement !== libraryProjectStatusSelect) {
    libraryProjectStatusSelect.value = state.currentProjectStatus || "todo";
  }
  if (paletteImportModeSelect && document.activeElement !== paletteImportModeSelect) {
    paletteImportModeSelect.value = state.paletteImportMode || "replace";
  }
  if (markerPresetSelect && document.activeElement !== markerPresetSelect) {
    markerPresetSelect.value = state.markerPreset || "lime";
  }
  if (sampleAnchorInfo) {
    sampleAnchorInfo.textContent =
      state.sampling.mode === "anchor"
        ? `当前安全点：${Math.round((state.sampling.anchorXRatio || 0.18) * 100)}% , ${Math.round((state.sampling.anchorYRatio || 0.18) * 100)}%`
        : "框环取样会沿外框一圈取色，并避开内层文字区。";
  }

  if (crop) {
    const metrics = getEffectiveGridMetrics(state);
    cropInfoText.textContent = `x:${crop.x.toFixed(1)} y:${crop.y.toFixed(1)} / ${crop.width.toFixed(1)} x ${crop.height.toFixed(1)}`;
    cellSizeText.textContent = metrics
      ? `${metrics.cellWidth.toFixed(2)} x ${metrics.cellHeight.toFixed(2)} px · 偏移 ${metrics.originX - crop.x >= 0 ? "+" : ""}${(metrics.originX - crop.x).toFixed(1)}, ${metrics.originY - crop.y >= 0 ? "+" : ""}${(metrics.originY - crop.y).toFixed(1)}`
      : `${(crop.width / gridSize.width).toFixed(2)} x ${(crop.height / gridSize.height).toFixed(2)} px`;
  } else {
    cropInfoText.textContent = "-";
    cellSizeText.textContent = "-";
  }

  if (!analysis) {
    analysisSummary.className = "summary-card empty";
    analysisSummary.textContent = "解析完成后，这里会显示整图概览、当前区块信息和智能建议。";
    chunkLabel.textContent = "-";
    chunkCoordLabel.textContent = "-";
    localStats.innerHTML = `<p class="empty-text">还没有当前 5x5 用量数据。</p>`;
    globalStats.innerHTML = `<p class="empty-text">还没有全局颜色统计。</p>`;
    planPanel.innerHTML = `<p class="empty-text">还没有智能建议。</p>`;
    renderFocusColorOptions();
    if (focusColorSummary) {
      focusColorSummary.textContent = "可筛选某一个颜色，只看它在全图和当前 5x5 里的位置。";
    }
    if (markerSummary) {
      markerSummary.textContent = "先在整体大图模式里选一个颜色，这里会自动给出四角加中心的定位点。";
    }
    return;
  }

  const chunk = analysis.chunks[currentChunkIndex];
  const plan = generateSmartPlan({ ...analysis, currentChunkIndex }, strategyType);
  const localColorStats = buildStats(chunk.cells);
  const focusedStats = getFocusedStats(analysis, focusColorCode);
  const markerTargetCode = getMarkerTargetCode(state);
  const markerPreset = getMarkerPresets()[state.markerPreset] || getMarkerPresets().lime;
  const markerAnchors = buildMarkerAnchors(analysis, markerTargetCode);
  const focusedCellsInChunk = focusColorCode ? chunk.cells.filter((cell) => !cell.excluded && cell.code === focusColorCode) : [];
  const focusedPositions =
    focusedCellsInChunk.length > 0
      ? focusedCellsInChunk
          .slice(0, 12)
          .map((cell) => `(${cell.x},${cell.y})`)
          .join(" ")
      : "";

  analysisSummary.className = "summary-card";
  analysisSummary.innerHTML = `
    <h3>解析概览</h3>
    <p>总格数：<strong>${analysis.gridWidth * analysis.gridHeight}</strong>。5x5 区块总数：<strong>${analysis.chunks.length}</strong>。当前策略：<span class="mini-code">${plan.title}</span>。</p>
  `;
  chunkLabel.textContent = `区块 ${currentChunkIndex + 1} / ${analysis.chunks.length}`;
  chunkCoordLabel.textContent = `区块 ${chunk.chunkCol},${chunk.chunkRow} · (${chunk.startX},${chunk.startY}) -> (${chunk.endX},${chunk.endY})`;
  localStats.innerHTML = renderStatList(localColorStats, "当前 5x5 里还没有可统计的颜色。");
  globalStats.innerHTML = renderStatList(analysis.globalStats, "整张图里还没有可统计的颜色。");
  planPanel.innerHTML = `<h3>${plan.title}</h3><p class="plan-text">${plan.description}</p>`;
  renderFocusColorOptions();
  if (focusColorSummary) {
    focusColorSummary.textContent = focusedStats
      ? `${focusedStats.code} 全图 ${focusedStats.count} 颗，分布在 ${focusedStats.chunks} 个 5x5 区块。当前区块 ${focusedCellsInChunk.length} 颗${focusedPositions ? `（${focusedPositions}）` : ""}`
      : `当前最多颜色：${analysis.globalStats[0]?.code || "-"}（${analysis.globalStats[0]?.count || 0} 颗）。`;
  }
  if (markerSummary) {
    markerSummary.textContent = markerAnchors.length
      ? `建议把 ${markerTargetCode} 的 ${markerAnchors.map((anchor) => `${anchor.label}(${anchor.x},${anchor.y})`).join("、")} 先用“${markerPreset.label}”临时占位，大块完成后再换回 ${markerTargetCode}。`
      : "当前选中的颜色在图里数量太少，暂时不建议做定位标记。";
  }
}

function renderBatchReplacePanel() {
  if (!batchReplaceCodeList || !batchReplaceStatus) {
    return;
  }

  const state = getState();
  const codes = buildAvailableColorCodes(state);
  batchReplaceCodeList.innerHTML = codes.map((code) => `<option value="${code}"></option>`).join("");

  if (batchReplaceCodeInput && document.activeElement !== batchReplaceCodeInput) {
    batchReplaceCodeInput.value = analysisBatchSelection.targetCode || state.focusColorCode || batchReplaceCodeInput.value || "";
  }

  const selectedCells = getSelectedBatchCells(state);
  const selectedOverrideCount = selectedCells.filter((cell) => cell.manualOverride).length;
  if (batchReplaceApplyBtn) {
    batchReplaceApplyBtn.disabled = !state.analysis || !selectedCells.length;
  }
  if (batchReplaceClearSelectionBtn) {
    batchReplaceClearSelectionBtn.disabled = !analysisBatchSelection.selectedKeys.size;
  }
  if (batchReplaceClearOverridesBtn) {
    batchReplaceClearOverridesBtn.disabled = !selectedOverrideCount;
  }

  if (!state.analysis) {
    setBatchReplaceStatus("先解析整图，再在整体大图或 5x5 里多选 / 框选要修正的格子。");
    return;
  }

  const selectedText = selectedCells.length
    ? `${selectedCells.length} 格：${selectedCells.slice(0, 10).map((cell) => `(${cell.x},${cell.y})`).join(" ")}${selectedCells.length > 10 ? " ..." : ""}`
    : "还没有选中格子";
  setBatchReplaceStatus(
    isBatchReplaceModeEnabled()
      ? `批量模式已开启。当前选中 ${selectedText}。其中已有手动修正 ${selectedOverrideCount} 格。`
      : `批量模式已关闭。当前选中 ${selectedText}。打开后可点选或拖框选择。`,
  );
}

function renderCalibrationAssistPanel() {
  const state = getState();
  const calibrationAssist = state.calibrationAssist || createEmptyCalibrationAssist();
  const options = buildCalibrationCodeOptions(state);
  const activeCode = calibrationAssist.activeCode || options[0] || "";
  const activeCells = getCalibrationCellsByCode(activeCode, state);
  const activePrototype = calibrationAssist.prototypesByCode?.[activeCode] || null;
  const prototypeCount = Object.keys(calibrationAssist.prototypesByCode || {}).length;

  if (calibrationActiveCodeSelect) {
    calibrationActiveCodeSelect.innerHTML = [
      `<option value="">请选择要校准的色号</option>`,
      ...options.map((code) => `<option value="${code}">${code}</option>`),
    ].join("");
    calibrationActiveCodeSelect.value = activeCode;
  }

  if (calibrationAddSampleBtn) {
    calibrationAddSampleBtn.disabled = !state.analysis || !activeCode;
  }
  if (calibrationBuildBtn) {
    calibrationBuildBtn.disabled = !state.analysis || !Object.keys(calibrationAssist.samplesByCode || {}).length;
  }
  if (calibrationApplyBtn) {
    calibrationApplyBtn.disabled = !state.analysis || !prototypeCount;
  }
  if (calibrationDisableBtn) {
    calibrationDisableBtn.disabled = !state.analysis || !calibrationAssist.enabled;
  }
  if (calibrationClearActiveBtn) {
    calibrationClearActiveBtn.disabled = !activeCode || !activeCells.length;
  }
  if (calibrationClearAllBtn) {
    calibrationClearAllBtn.disabled =
      !prototypeCount &&
      !Object.keys(calibrationAssist.samplesByCode || {}).some((code) => (calibrationAssist.samplesByCode?.[code] || []).length);
  }

  if (calibrationSampleList) {
    calibrationSampleList.innerHTML = activeCells.length
      ? activeCells
          .map(
            (cell, index) => `
              <button type="button" class="seed-item" data-calibration-index="${index}">
                <span><code>${activeCode}</code> · (${cell.x},${cell.y})</span>
                <small>${formatRgb(cell.sampledRgb)}</small>
              </button>
            `,
          )
          .join("")
      : `<p class="empty-text">先选一个色号，再把几个你确定的格子加入样本。建议每个色号取 5-15 个样本。</p>`;
  }

  if (calibrationStatus) {
    const activeCount = activeCells.length;
    const enabledText = calibrationAssist.enabled ? "已启用本图原型重匹配" : "当前仍使用标准色卡 RGB 解析";
    if (activePrototype?.rgb) {
      calibrationStatus.textContent = `${enabledText}。当前色 ${activeCode} 已有 ${activeCount} 个样本，本图原型 RGB ${formatRgb(activePrototype.rgb)}。整套共 ${prototypeCount} 个已生成原型。`;
    } else {
      calibrationStatus.textContent = `${enabledText}。当前色 ${activeCode || "未选"} 已采样 ${activeCount} 格。先收样本，再点“生成本图原型”。`;
    }
  }
}

function addCurrentCellToCalibrationSamples() {
  const state = getState();
  const activeCode = state.calibrationAssist?.activeCode || buildCalibrationCodeOptions(state)[0] || "";
  if (!state.analysis || !activeCode) {
    return;
  }

  const cell = state.analysis.cells.find(
    (item) => item.x === state.selectedPreviewCell?.x && item.y === state.selectedPreviewCell?.y,
  );
  if (!cell || cell.excluded) {
    return;
  }

  const nextSamplesByCode = {
    ...(state.calibrationAssist?.samplesByCode || {}),
  };
  const currentSamples = [...(nextSamplesByCode[activeCode] || [])];
  if (!currentSamples.some((sample) => sample.x === cell.x && sample.y === cell.y)) {
    currentSamples.push({ x: cell.x, y: cell.y });
  }
  nextSamplesByCode[activeCode] = currentSamples;

  const nextPrototypes = {
    ...(state.calibrationAssist?.prototypesByCode || {}),
  };
  delete nextPrototypes[activeCode];

  patchState({
    calibrationAssist: {
      ...state.calibrationAssist,
      activeCode,
      samplesByCode: nextSamplesByCode,
      prototypesByCode: nextPrototypes,
    },
  });
}

function rebuildCalibrationPrototypes() {
  const state = getState();
  if (!state.analysis) {
    return;
  }

  const samplesByCode = state.calibrationAssist?.samplesByCode || {};
  const prototypesByCode = {};
  for (const [code, refs] of Object.entries(samplesByCode)) {
    if (!refs?.length) {
      continue;
    }
    const cells = getCalibrationCellsByCode(code, state);
    const rgb = buildPrototypeRgbFromCells(cells);
    if (!rgb) {
      continue;
    }
    prototypesByCode[code] = {
      rgb,
      sampleCount: cells.length,
    };
  }

  patchState({
    calibrationAssist: {
      ...state.calibrationAssist,
      prototypesByCode,
    },
  });
}

function applyCalibrationRematch() {
  const state = getState();
  if (!state.analysis) {
    return;
  }

  const prototypeCount = Object.keys(state.calibrationAssist?.prototypesByCode || {}).length;
  if (!prototypeCount) {
    return;
  }

  const nextCalibrationAssist = {
    ...state.calibrationAssist,
    enabled: true,
  };
  patchState({ calibrationAssist: nextCalibrationAssist });
  const nextAnalysis = rerunAnalysisWithCurrentState(state.manualOverrides || {});
  if (!nextAnalysis) {
    return;
  }
  patchState({
    analysis: nextAnalysis,
    currentChunkIndex: 0,
  });
}

function disableCalibrationRematch() {
  const state = getState();
  if (!state.analysis) {
    return;
  }

  patchState({
    calibrationAssist: {
      ...state.calibrationAssist,
      enabled: false,
    },
  });
  const nextAnalysis = rerunAnalysisWithCurrentState(state.manualOverrides || {});
  if (!nextAnalysis) {
    return;
  }
  patchState({
    analysis: nextAnalysis,
    currentChunkIndex: 0,
  });
}

function formatProjectTime(isoString) {
  if (!isoString) {
    return "未保存";
  }
  const date = new Date(isoString);
  if (Number.isNaN(date.getTime())) {
    return "未保存";
  }
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")} ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
}

function getProjectDisplayStatus(status) {
  return PROJECT_STATUS_LABELS[status] || PROJECT_STATUS_LABELS.todo;
}

function buildProjectSummary(project) {
  const width = project.gridSize?.width || project.snapshot?.gridSize?.width || 0;
  const height = project.gridSize?.height || project.snapshot?.gridSize?.height || 0;
  return `${width || "-"} x ${height || "-"} · ${project.paletteCount || 0} 色`;
}

function getCurrentProjectMeta(state = getState()) {
  const currentProject = (state.libraryProjects || []).find((project) => project.id === state.currentProjectId);
  return {
    id: state.currentProjectId || currentProject?.id || "",
    name: state.currentProjectName || currentProject?.name || normalizeProjectName(state.storedImage?.name || ""),
    status: state.currentProjectStatus || currentProject?.status || "todo",
  };
}

function updateCurrentProjectMeta(partial) {
  const current = getCurrentProjectMeta();
  patchState({
    currentProjectId: partial.id ?? current.id,
    currentProjectName: partial.name ?? current.name,
    currentProjectStatus: partial.status ?? current.status,
  });
}

function upsertProjectRecord(project) {
  const state = getState();
  const libraryProjects = [...(state.libraryProjects || [])];
  const index = libraryProjects.findIndex((item) => item.id === project.id);
  if (index >= 0) {
    libraryProjects[index] = project;
  } else {
    libraryProjects.unshift(project);
  }
  patchState({ libraryProjects });
}

function removeProjectRecord(projectId) {
  const state = getState();
  const nextProjects = (state.libraryProjects || []).filter((project) => project.id !== projectId);
  patchState({
    libraryProjects: nextProjects,
    ...(state.currentProjectId === projectId
      ? {
          currentProjectId: "",
          currentProjectName: normalizeProjectName(state.storedImage?.name || ""),
          currentProjectStatus: "todo",
        }
      : {}),
  });
}

function syncCurrentProjectToLibrary(options = {}) {
  const state = getState();
  const meta = getCurrentProjectMeta(state);
  if (!meta.id || !state.storedImage?.dataUrl) {
    return null;
  }
  const existing = (state.libraryProjects || []).find((project) => project.id === meta.id);
  const snapshot = buildProjectSnapshot({
    ...state,
    currentProjectName: meta.name,
    currentProjectStatus: meta.status,
  });
  const project = createProjectRecordFromSnapshot(snapshot, {
    id: meta.id,
    name: meta.name,
    status: meta.status,
    createdAt: existing?.createdAt,
    coverImageDataUrl: state.storedImage?.dataUrl || existing?.coverImageDataUrl || "",
  });
  upsertProjectRecord(project);
  if (!options.silent) {
    parseStatus.textContent = `已同步项目：${project.name}`;
  }
  return project;
}

async function loadProjectById(projectId) {
  const state = getState();
  const project = (state.libraryProjects || []).find((item) => item.id === projectId);
  if (!project?.snapshot) {
    return;
  }

  if (state.currentProjectId && state.currentProjectId !== projectId) {
    syncCurrentProjectToLibrary({ silent: true });
  }

  const nextState = await buildHydratedStateFromSnapshot(project.snapshot, {
    libraryProjects: getState().libraryProjects,
    currentProjectId: project.id,
    currentProjectName: project.name,
    currentProjectStatus: project.status || "todo",
  });
  clearBatchSelection({ keepTargetCode: false });
  setState(nextState);
  switchTab("tab-step1");
}

function buildLibraryImportSnapshot(image, dataUrl, fileName, sourceState) {
  return {
    gridSize: { ...sourceState.gridSize },
    gridAlignment: { ...sourceState.gridAlignment },
    sampling: { ...sourceState.sampling },
    recognition: { ...sourceState.recognition },
    showSamplingOverlay: true,
    crop: {
      x: 0,
      y: 0,
      width: image.naturalWidth,
      height: image.naturalHeight,
    },
    cropConfirmed: false,
    palette: [],
    paletteSetName: `${normalizeProjectName(fileName)} 色卡`,
    paletteImportMode: "replace",
    paletteReviewMode: "color-first",
    strategyType: "color-fill",
    focusColorCode: "",
    markerPreset: "lime",
    selectedPreviewCell: { x: 1, y: 1 },
    sampleInspectWindow: 3,
    manualOverrides: {},
    seedAssist: createEmptySeedAssist(),
    calibrationAssist: createEmptyCalibrationAssist(),
    storedImage: createStoredImageRecord(dataUrl, image, fileName),
    paletteReviewSnapshot: null,
    currentProjectName: normalizeProjectName(fileName),
    currentProjectStatus: "todo",
  };
}

async function importProjectsFromFiles(fileList) {
  const files = [...(fileList || [])].filter(Boolean);
  if (!files.length) {
    return;
  }

  const sourceState = getState();
  const importedProjects = [];
  for (const file of files) {
    const dataUrl = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    const image = await loadImageFromDataUrl(dataUrl);
    const snapshot = buildLibraryImportSnapshot(image, dataUrl, file.name, sourceState);
    importedProjects.push(createProjectRecordFromSnapshot(snapshot));
  }

  const mergedProjects = [...importedProjects, ...(getState().libraryProjects || [])];
  patchState({ libraryProjects: mergedProjects });

  if (importedProjects[0]) {
    await loadProjectById(importedProjects[0].id);
  }
}

function buildLibraryBundlePayload() {
  if (getState().currentProjectId) {
    syncCurrentProjectToLibrary({ silent: true });
  }

  const state = getState();
  const payload = {
    bundleType: "pindou-library-bundle",
    version: 1,
    exportedAt: new Date().toISOString(),
    libraryProjects: state.libraryProjects || [],
  };

  if (!state.currentProjectId && state.storedImage?.dataUrl) {
    payload.currentWorkspace = {
      name: state.currentProjectName || normalizeProjectName(state.storedImage?.name || ""),
      status: state.currentProjectStatus || "todo",
      snapshot: buildProjectSnapshot(state),
    };
  }

  return payload;
}

function downloadLibraryBundle() {
  const payload = buildLibraryBundlePayload();
  const projectCount = payload.libraryProjects?.length || 0;
  if (!projectCount && !payload.currentWorkspace?.snapshot) {
    setLibraryDataStatus("当前还没有可导出的图纸数据。先保存至少一张图纸进拼豆库。", true);
    return;
  }

  const timestamp = new Date().toISOString().replace(/[-:]/g, "").replace(/\..+/, "").replace("T", "-");
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `pindou-library-${timestamp}.json`;
  link.click();
  URL.revokeObjectURL(url);
  setLibraryDataStatus(`已导出 ${projectCount} 张图纸${payload.currentWorkspace?.snapshot ? "，并包含当前未入库工作区" : ""}。`);
}

function mergeProjectsById(baseProjects, incomingProjects) {
  const merged = new Map();
  for (const project of baseProjects || []) {
    if (project?.id) {
      merged.set(project.id, project);
    }
  }
  for (const project of incomingProjects || []) {
    if (!project?.id) {
      continue;
    }
    const existing = merged.get(project.id);
    if (!existing) {
      merged.set(project.id, project);
      continue;
    }
    const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
    const incomingTime = new Date(project.updatedAt || project.createdAt || 0).getTime();
    merged.set(project.id, incomingTime >= existingTime ? project : existing);
  }
  return [...merged.values()].sort(
    (left, right) => new Date(right.updatedAt || right.createdAt || 0).getTime() - new Date(left.updatedAt || left.createdAt || 0).getTime(),
  );
}

async function importLibraryBundleFromFile(file) {
  if (!file) {
    return;
  }

  try {
    const text = await file.text();
    const parsed = JSON.parse(text);
    const importedProjects = Array.isArray(parsed)
      ? parsed
      : Array.isArray(parsed.libraryProjects)
        ? parsed.libraryProjects
        : [];

    const sanitizedProjects = importedProjects.filter((project) => project?.id && project?.snapshot);
    if (parsed?.currentWorkspace?.snapshot) {
      sanitizedProjects.unshift(
        createProjectRecordFromSnapshot(parsed.currentWorkspace.snapshot, {
          name: parsed.currentWorkspace.name || parsed.currentWorkspace.snapshot.currentProjectName || "未命名图纸",
          status: parsed.currentWorkspace.status || parsed.currentWorkspace.snapshot.currentProjectStatus || "todo",
        }),
      );
    }

    if (!sanitizedProjects.length) {
      setLibraryDataStatus("这个数据包里没有可导入的图纸快照。", true);
      return;
    }

    const mergedProjects = mergeProjectsById(getState().libraryProjects || [], sanitizedProjects);
    patchState({ libraryProjects: mergedProjects });
    setLibraryDataStatus(`已导入 ${sanitizedProjects.length} 张图纸，当前拼豆库共 ${mergedProjects.length} 张。`);
  } catch (error) {
    setLibraryDataStatus(`导入数据包失败：${error?.message || error}`, true);
  }
}

function getViewerLayout(state = getState()) {
  const { analysis, currentChunkIndex } = state;
  if (!analysis) {
    return null;
  }

  const chunk = analysis.chunks[currentChunkIndex];
  const width = viewerCanvas.clientWidth || 320;
  const height = Math.max(320, width);
  const padding = 20;
  const cellSize = Math.floor((Math.min(width, height) - padding * 2) / Math.max(chunk.width, chunk.height));
  const gridWidth = chunk.width * cellSize;
  const gridHeight = chunk.height * cellSize;
  const offsetX = Math.floor((width - gridWidth) / 2);
  const offsetY = Math.floor((height - gridHeight) / 2);
  return { width, height, chunk, cellSize, offsetX, offsetY, gridWidth, gridHeight };
}

function resolveViewerCellFromPoint(localX, localY, state = getState()) {
  const layout = getViewerLayout(state);
  if (!layout) {
    return null;
  }

  const localCol = Math.floor((localX - layout.offsetX) / layout.cellSize);
  const localRow = Math.floor((localY - layout.offsetY) / layout.cellSize);
  if (
    localCol < 0 ||
    localRow < 0 ||
    localCol >= layout.chunk.width ||
    localRow >= layout.chunk.height
  ) {
    return null;
  }

  return {
    x: layout.chunk.startX + localCol,
    y: layout.chunk.startY + localRow,
  };
}

function resolveGridPositionFromLocalPoint(localX, localY, width, height, analysis) {
  const { cellSize, offsetX, offsetY } = getMapLayout(width, height, analysis);
  const gridX = Math.floor((localX - offsetX) / cellSize) + 1;
  const gridY = Math.floor((localY - offsetY) / cellSize) + 1;
  if (gridX < 1 || gridX > analysis.gridWidth || gridY < 1 || gridY > analysis.gridHeight) {
    return null;
  }
  return { x: gridX, y: gridY };
}

function toggleBatchSelectionCell(cellX, cellY) {
  const key = getCellKey(cellX, cellY);
  if (analysisBatchSelection.selectedKeys.has(key)) {
    analysisBatchSelection.selectedKeys.delete(key);
  } else {
    analysisBatchSelection.selectedKeys.add(key);
  }
}

function addBatchSelectionRect(startCell, endCell) {
  if (!startCell || !endCell) {
    return 0;
  }

  const minX = Math.min(startCell.x, endCell.x);
  const maxX = Math.max(startCell.x, endCell.x);
  const minY = Math.min(startCell.y, endCell.y);
  const maxY = Math.max(startCell.y, endCell.y);
  let added = 0;

  for (let y = minY; y <= maxY; y += 1) {
    for (let x = minX; x <= maxX; x += 1) {
      const key = getCellKey(x, y);
      if (!analysisBatchSelection.selectedKeys.has(key)) {
        added += 1;
      }
      analysisBatchSelection.selectedKeys.add(key);
    }
  }

  return added;
}

function applyBatchReplaceToSelection() {
  const state = getState();
  const targetCode = normalizeColorCodeInput(batchReplaceCodeInput?.value || analysisBatchSelection.targetCode);
  const selectedCells = getSelectedBatchCells(state);
  if (!state.analysis || !selectedCells.length) {
    setBatchReplaceStatus("先选中要修正的格子，再做批量替换。", true);
    return;
  }
  if (!targetCode) {
    setBatchReplaceStatus("先填一个目标色号，再替换。", true);
    return;
  }
  if (!state.palette.some((entry) => entry.code === targetCode)) {
    setBatchReplaceStatus(`当前色卡里没有 ${targetCode}，请先确认色卡或色号。`, true);
    return;
  }

  const nextOverrides = { ...(state.manualOverrides || {}) };
  for (const cell of selectedCells) {
    nextOverrides[getCellKey(cell.x, cell.y)] = targetCode;
  }
  const nextAnalysis = rerunAnalysisWithCurrentState(nextOverrides);
  if (!nextAnalysis) {
    setBatchReplaceStatus("批量替换失败，当前还没有可重算的解析结果。", true);
    return;
  }

  analysisBatchSelection.targetCode = targetCode;
  patchState({
    manualOverrides: nextOverrides,
    analysis: nextAnalysis,
    currentChunkIndex: 0,
  });
  setBatchReplaceStatus(`已把 ${selectedCells.length} 个选中格子批量替换为 ${targetCode}。`);
}

function clearSelectedBatchOverrides() {
  const state = getState();
  const selectedCells = getSelectedBatchCells(state);
  if (!state.analysis || !selectedCells.length) {
    setBatchReplaceStatus("先选中想恢复自动识别的格子。", true);
    return;
  }

  const nextOverrides = { ...(state.manualOverrides || {}) };
  let removed = 0;
  for (const cell of selectedCells) {
    const key = getCellKey(cell.x, cell.y);
    if (key in nextOverrides) {
      delete nextOverrides[key];
      removed += 1;
    }
  }

  const nextAnalysis = rerunAnalysisWithCurrentState(nextOverrides);
  patchState({
    manualOverrides: nextOverrides,
    analysis: nextAnalysis,
    currentChunkIndex: 0,
  });
  setBatchReplaceStatus(
    removed ? `已清除 ${removed} 个选中格子的手动修正，恢复自动识别结果。` : "选中的格子里本来就没有手动修正。",
    false,
  );
}

function drawViewer() {
  const state = getState();
  const { analysis, currentChunkIndex, strategyType, focusColorCode } = state;
  const seedCandidateKeys = new Set((state.seedAssist?.candidates || []).map((item) => getCellKey(item.x, item.y)));
  const selectedBatchKeys = analysisBatchSelection.selectedKeys;
  const width = viewerCanvas.clientWidth || 320;
  const height = Math.max(320, width);
  ensureCanvasSize(viewerCanvas, width, height);
  viewerCtx.clearRect(0, 0, width, height);
  viewerCtx.imageSmoothingEnabled = false;

  if (!analysis) {
    viewerCtx.fillStyle = "#6f6257";
    viewerCtx.font = "600 16px 'Segoe UI'";
    viewerCtx.fillText("先解析整图，这里才会显示放大的 5x5 区块。", 18, 40);
    return;
  }

  const chunk = analysis.chunks[currentChunkIndex];
  const plan = generateSmartPlan({ ...analysis, currentChunkIndex }, strategyType);
  const visibleHighlights = focusColorCode
    ? plan.highlights.filter((highlight) =>
        chunk.cells.some((cell) => cell.x === highlight.x && cell.y === highlight.y && !cell.excluded && cell.code === focusColorCode),
      )
    : plan.highlights;
  const markerPreset = getMarkerPresets()[state.markerPreset] || getMarkerPresets().lime;
  const markerAnchors = buildMarkerAnchors(analysis, getMarkerTargetCode(state))
    .filter((anchor) => anchor.x >= chunk.startX && anchor.x <= chunk.endX && anchor.y >= chunk.startY && anchor.y <= chunk.endY);
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
    const isFocusMatch = !cell.excluded && (!focusColorCode || cell.code === focusColorCode);

    viewerCtx.fillStyle = cell.excluded ? "#f0e7da" : rgbToHex(cell.matchedRgb);
    viewerCtx.fillRect(x, y, cellSize, cellSize);
    if (!isFocusMatch) {
      viewerCtx.fillStyle = "rgba(255, 253, 248, 0.82)";
      viewerCtx.fillRect(x, y, cellSize, cellSize);
    }
    viewerCtx.strokeStyle = "rgba(54, 39, 29, 0.2)";
    viewerCtx.lineWidth = 1;
    viewerCtx.strokeRect(x, y, cellSize, cellSize);
    if (isFocusMatch) {
      const displayCode = cell.excluded || cell.code === "EMPTY" ? "" : cell.code;
      if (displayCode) {
        viewerCtx.fillStyle = getReadableTextColor(cell.matchedRgb);
        viewerCtx.font = `700 ${Math.max(12, Math.floor(cellSize * 0.22))}px 'Segoe UI'`;
        viewerCtx.textAlign = "center";
        viewerCtx.textBaseline = "middle";
        viewerCtx.fillText(displayCode, x + cellSize / 2, y + cellSize / 2);
      }
      viewerCtx.fillStyle = "rgba(48, 33, 22, 0.7)";
      viewerCtx.font = `600 ${Math.max(10, Math.floor(cellSize * 0.16))}px 'Segoe UI'`;
      viewerCtx.fillText(`${cell.x},${cell.y}`, x + cellSize / 2, y + cellSize - 11);
    }

    if (focusColorCode && !cell.excluded && cell.code === focusColorCode) {
      viewerCtx.strokeStyle = "#9d5333";
      viewerCtx.lineWidth = 3;
      viewerCtx.strokeRect(x + 3, y + 3, cellSize - 6, cellSize - 6);
    }
    if (seedCandidateKeys.has(getCellKey(cell.x, cell.y))) {
      viewerCtx.strokeStyle = "rgba(207, 91, 182, 0.95)";
      viewerCtx.lineWidth = 3;
      viewerCtx.strokeRect(x + 6, y + 6, cellSize - 12, cellSize - 12);
    }
    if (selectedBatchKeys.has(getCellKey(cell.x, cell.y))) {
      viewerCtx.strokeStyle = "rgba(44, 196, 198, 0.98)";
      viewerCtx.lineWidth = Math.max(2, Math.floor(cellSize * 0.12));
      viewerCtx.strokeRect(x + 4, y + 4, cellSize - 8, cellSize - 8);
    }
  }

  for (const highlight of visibleHighlights) {
    const localCol = highlight.x - chunk.startX;
    const localRow = highlight.y - chunk.startY;
    const x = offsetX + localCol * cellSize;
    const y = offsetY + localRow * cellSize;

    viewerCtx.strokeStyle = strategyType === "edge-first" ? "#2f6c73" : "#f4c64f";
    viewerCtx.lineWidth = 4;
    viewerCtx.strokeRect(x + 2, y + 2, cellSize - 4, cellSize - 4);
  }

  for (const anchor of markerAnchors) {
    const localCol = anchor.x - chunk.startX;
    const localRow = anchor.y - chunk.startY;
    const x = offsetX + localCol * cellSize;
    const y = offsetY + localRow * cellSize;
    const badgeRadius = Math.max(9, Math.floor(cellSize * 0.18));
    viewerCtx.fillStyle = markerPreset.color;
    viewerCtx.beginPath();
    viewerCtx.arc(x + cellSize - badgeRadius - 4, y + badgeRadius + 4, badgeRadius, 0, Math.PI * 2);
    viewerCtx.fill();
    viewerCtx.fillStyle = "#fff";
    viewerCtx.font = `800 ${Math.max(10, Math.floor(cellSize * 0.16))}px 'Segoe UI'`;
    viewerCtx.textAlign = "center";
    viewerCtx.textBaseline = "middle";
    viewerCtx.fillText(String(anchor.index), x + cellSize - badgeRadius - 4, y + badgeRadius + 4);
  }
}

function drawMinimap() {
  if (!minimapCanvas || !minimapCtx) {
    return;
  }

  const state = getState();
  const { analysis, currentChunkIndex, focusColorCode } = state;
  const width = minimapCanvas.clientWidth || 120;
  const height = Math.max(width, 120);
  ensureCanvasSize(minimapCanvas, width, height);
  minimapCtx.clearRect(0, 0, width, height);

  if (!analysis) {
    minimapCtx.fillStyle = "#6f6257";
    minimapCtx.font = "600 12px 'Segoe UI'";
    minimapCtx.fillText("解析后才会显示缩略图", 10, 30);
    return;
  }

  const { cellSize, offsetX, offsetY } = getMapLayout(width, height, analysis);
  minimapCtx.imageSmoothingEnabled = false;

  for (const cell of analysis.cells) {
    const x = offsetX + (cell.x - 1) * cellSize;
    const y = offsetY + (cell.y - 1) * cellSize;
    const isFocusMatch = !cell.excluded && (!focusColorCode || cell.code === focusColorCode);
    minimapCtx.fillStyle = cell.excluded ? "#efe5d8" : isFocusMatch ? rgbToHex(cell.matchedRgb) : "#e9dfd1";
    minimapCtx.fillRect(x, y, cellSize, cellSize);
  }

  const chunk = analysis.chunks[currentChunkIndex];
  const x = offsetX + (chunk.startX - 1) * cellSize;
  const y = offsetY + (chunk.startY - 1) * cellSize;
  const chunkWidth = chunk.width * cellSize;
  const chunkHeight = chunk.height * cellSize;
  minimapCtx.strokeStyle = "#e7002f";
  minimapCtx.lineWidth = 2;
  minimapCtx.strokeRect(x - 1, y - 1, chunkWidth + 2, chunkHeight + 2);
}

function drawOverview() {
  if (!overviewCanvas || !overviewCtx) {
    return;
  }

  const state = getState();
  const { analysis, currentChunkIndex, focusColorCode } = state;
  const seedCandidateKeys = new Set((state.seedAssist?.candidates || []).map((item) => getCellKey(item.x, item.y)));
  const selectedBatchKeys = analysisBatchSelection.selectedKeys;
  const markerPreset = getMarkerPresets()[state.markerPreset] || getMarkerPresets().lime;
  const markerAnchors = buildMarkerAnchors(analysis, getMarkerTargetCode(state));
  const width = overviewCanvas.clientWidth || 320;
  const targetHeight = analysis
    ? Math.max(320, Math.min(560, Math.round((width * analysis.gridHeight) / analysis.gridWidth)))
    : 320;
  ensureCanvasSize(overviewCanvas, width, targetHeight);
  overviewCtx.clearRect(0, 0, width, targetHeight);

  if (!analysis) {
    overviewCtx.fillStyle = "#6f6257";
    overviewCtx.font = "600 14px 'Segoe UI'";
    overviewCtx.fillText("解析后才会显示整图总览。", 14, 28);
    return;
  }

  const { cellSize, offsetX, offsetY } = getMapLayout(width, targetHeight, analysis);
  overviewCtx.imageSmoothingEnabled = false;

  for (const cell of analysis.cells) {
    const x = offsetX + (cell.x - 1) * cellSize;
    const y = offsetY + (cell.y - 1) * cellSize;
    const isFocusMatch = !cell.excluded && (!focusColorCode || cell.code === focusColorCode);
    overviewCtx.fillStyle = cell.excluded ? "#f0e7da" : isFocusMatch ? rgbToHex(cell.matchedRgb) : "#efe5d8";
    overviewCtx.fillRect(x, y, cellSize, cellSize);

    if (focusColorCode && !cell.excluded && cell.code === focusColorCode && cellSize >= 5) {
      overviewCtx.strokeStyle = "#9d5333";
      overviewCtx.lineWidth = Math.max(1, cellSize * 0.18);
      overviewCtx.strokeRect(x + 0.5, y + 0.5, Math.max(1, cellSize - 1), Math.max(1, cellSize - 1));
    }
    if (seedCandidateKeys.has(getCellKey(cell.x, cell.y))) {
      overviewCtx.strokeStyle = "rgba(207, 91, 182, 0.9)";
      overviewCtx.lineWidth = Math.max(1, cellSize * 0.22);
      overviewCtx.strokeRect(x + 1, y + 1, Math.max(1, cellSize - 2), Math.max(1, cellSize - 2));
    }
    if (selectedBatchKeys.has(getCellKey(cell.x, cell.y))) {
      overviewCtx.strokeStyle = "rgba(44, 196, 198, 0.98)";
      overviewCtx.lineWidth = Math.max(1.5, cellSize * 0.24);
      overviewCtx.strokeRect(x + 1, y + 1, Math.max(1, cellSize - 2), Math.max(1, cellSize - 2));
    }
    if (cell.x === (state.selectedPreviewCell?.x || 1) && cell.y === (state.selectedPreviewCell?.y || 1)) {
      overviewCtx.strokeStyle = "rgba(244, 198, 79, 0.98)";
      overviewCtx.lineWidth = Math.max(1.5, cellSize * 0.28);
      overviewCtx.strokeRect(x + 0.5, y + 0.5, Math.max(1, cellSize - 1), Math.max(1, cellSize - 1));
    }
  }

  overviewCtx.strokeStyle = "rgba(48, 33, 22, 0.12)";
  overviewCtx.lineWidth = 1;
  for (let gridX = 0; gridX <= analysis.gridWidth; gridX += 5) {
    const x = offsetX + gridX * cellSize;
    overviewCtx.beginPath();
    overviewCtx.moveTo(x, offsetY);
    overviewCtx.lineTo(x, offsetY + analysis.gridHeight * cellSize);
    overviewCtx.stroke();
  }
  for (let gridY = 0; gridY <= analysis.gridHeight; gridY += 5) {
    const y = offsetY + gridY * cellSize;
    overviewCtx.beginPath();
    overviewCtx.moveTo(offsetX, y);
    overviewCtx.lineTo(offsetX + analysis.gridWidth * cellSize, y);
    overviewCtx.stroke();
  }

  const chunk = analysis.chunks[currentChunkIndex];
  overviewCtx.strokeStyle = "#e7002f";
  overviewCtx.lineWidth = 2;
  overviewCtx.strokeRect(
    offsetX + (chunk.startX - 1) * cellSize,
    offsetY + (chunk.startY - 1) * cellSize,
    chunk.width * cellSize,
    chunk.height * cellSize,
  );

  for (const anchor of markerAnchors) {
    const x = offsetX + (anchor.x - 0.5) * cellSize;
    const y = offsetY + (anchor.y - 0.5) * cellSize;
    const radius = Math.max(5, cellSize * 0.46);
    overviewCtx.fillStyle = markerPreset.color;
    overviewCtx.beginPath();
    overviewCtx.arc(x, y, radius, 0, Math.PI * 2);
    overviewCtx.fill();
    overviewCtx.fillStyle = "#fff";
    overviewCtx.font = `800 ${Math.max(8, Math.floor(radius * 1.2))}px 'Segoe UI'`;
    overviewCtx.textAlign = "center";
    overviewCtx.textBaseline = "middle";
    overviewCtx.fillText(String(anchor.index), x, y);
  }

  if (analysisBatchSelection.dragRect && isBatchReplaceModeEnabled()) {
    const start = analysisBatchSelection.dragRect.start;
    const end = analysisBatchSelection.dragRect.end;
    const minX = Math.min(start.x, end.x);
    const maxX = Math.max(start.x, end.x);
    const minY = Math.min(start.y, end.y);
    const maxY = Math.max(start.y, end.y);
    overviewCtx.fillStyle = "rgba(44, 196, 198, 0.14)";
    overviewCtx.strokeStyle = "rgba(44, 196, 198, 0.98)";
    overviewCtx.lineWidth = 2;
    overviewCtx.fillRect(
      offsetX + (minX - 1) * cellSize,
      offsetY + (minY - 1) * cellSize,
      (maxX - minX + 1) * cellSize,
      (maxY - minY + 1) * cellSize,
    );
    overviewCtx.strokeRect(
      offsetX + (minX - 1) * cellSize,
      offsetY + (minY - 1) * cellSize,
      (maxX - minX + 1) * cellSize,
      (maxY - minY + 1) * cellSize,
    );
  }
}

function rerender() {
  drawCropCanvas();
  drawSampleDemo();
  drawRealSamplingInspector();
  renderPaletteReview();
  renderPaletteReviewCodeList();
  updatePaletteReviewModeUi();
  renderPaletteList();
  renderLibraryPanel();
  renderSeedAssistPanel();
  renderCalibrationAssistPanel();
  renderSummary();
  renderBatchReplacePanel();
  drawViewer();
  drawMinimap();
  drawOverview();
}

function setExtractionStatus(message, isError = false) {
  const status = document.querySelector("#paletteExtractStatus");
  if (!status) {
    return;
  }
  status.textContent = message;
  status.style.color = isError ? "#c13d3d" : "#745f4b";
}

function mergePaletteEntries(entries, setName = getState().paletteSetName) {
  const byCode = new Map(getState().palette.map((entry) => [entry.code, entry]));
  for (const entry of entries) {
    byCode.set(entry.code, {
      code: entry.code,
      rgb: entry.rgb,
      standardRgb: entry.standardRgb || entry.rgb,
    });
  }

  patchState({
    palette: [...byCode.values()].sort((left, right) => left.code.localeCompare(right.code)),
    paletteSetName: setName,
  });
  resetAnalysis();
}

function replacePaletteEntries(entries, setName = "褰撳墠椤圭洰鑹插崱") {
  patchState({
    palette: entries
      .map((entry) => ({
        code: entry.code,
        rgb: entry.rgb,
        standardRgb: entry.standardRgb || entry.rgb,
      }))
      .sort((left, right) => left.code.localeCompare(right.code)),
    paletteSetName: setName,
  });
  resetAnalysis();
}

function applyImportedPalette(entries, setName) {
  if (getState().paletteImportMode === "merge") {
    mergePaletteEntries(entries, setName);
    return;
  }

  replacePaletteEntries(entries, setName);
}

function extractPaletteFromLegendArea() {
  const state = getState();
  if (!state.originalCanvas) {
    setExtractionStatus("请先上传原图，再识别底部色卡。", true);
    return;
  }

  const extracted = extractPaletteCandidatesFromCanvas(buildLegendProbeCanvas(state.originalCanvas), {
    sampleStep: 5,
    maxBuckets: 120,
  });

  if (!extracted.length) {
    setExtractionStatus("没有从底部色卡识别到可用颜色，请尝试单独上传颜色图。", true);
    return;
  }

  applyImportedPalette(extracted, "原图底部色卡");
  setExtractionStatus(
    state.paletteImportMode === "merge"
      ? `已把原图底部色卡中的 ${extracted.length} 个颜色合并进当前色卡。`
      : `已从原图底部色卡生成单独色卡，共 ${extracted.length} 个颜色。`,
  );
}

async function extractPaletteFromUploadedImage(file) {
  if (!file) {
    return;
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = await loadImageElement(objectUrl);
    const canvas = createImageBitmapCanvas(image);

    if (canUseBackendOcr()) {
      try {
        const backendResult = await requestBackendPaletteOcr(file);
        const detections = backendResult.detections || [];
        const recognizedEntries = backendResult.recognizedEntries || [];
        const backendLabel = getBackendEngineLabel(backendResult.engine);
        setPaletteReviewData(canvas, file.name || "本图颜色卡", detections);
        renderPaletteReview();

        if (!detections.length) {
          setExtractionStatus(`${backendLabel} 没找到稳定的色块，请换一张更清晰的截图。`, true);
          setPaletteReviewStatus(`${backendLabel} 没有找到色块。你仍然可以手动框选单个色块补录。`, true);
          return;
        }

        if (recognizedEntries.length) {
          applyImportedPalette(recognizedEntries, file.name || "本图颜色卡");
          setExtractionStatus(
            `${backendLabel} 已识别 ${recognizedEntries.length} 个色号，并绑定到本图实际色块颜色。`,
          );
          setPaletteReviewStatus(
            `${backendLabel} 共检测到 ${detections.length} 个色块，成功识别 ${recognizedEntries.length} 个色号。先点右侧列表检查，再修正红框。`,
          );
          return;
        }

        setExtractionStatus(`${backendLabel} 找到了色块，但文字没识别准。请直接在右侧列表里逐个修正。`, true);
        setPaletteReviewStatus("当前没有识别出可用色号。请点右侧列表中的色块，再手动填写或重识别。", true);
        return;
      } catch (error) {
        console.error("[OCR] FAILED:", error);
        const errMsg = error?.message || String(error);
        setExtractionStatus("后端 OCR 失败: " + errMsg + "。已回退到本地识别。按 F12 打开控制台看详细日志。", true);
      }
    }

    const detections = analyzePaletteCardCanvas(canvas);
    const recognizedEntries = getRecognizedEntriesFromDetections(detections);
    setPaletteReviewData(canvas, file.name || "本图颜色卡", detections);
    renderPaletteReview();

    if (!detections.length) {
      setExtractionStatus("上传的颜色卡里没有识别到足够明显的色块。", true);
      setPaletteReviewStatus("没有找到稳定的色块，请换一张更清晰的截图，或者手动框选单个色块。", true);
      return;
    }

    if (recognizedEntries.length) {
      applyImportedPalette(recognizedEntries, file.name || "本图颜色卡");
      setExtractionStatus(`后端 OCR 当前不可用，已回退到本地识别并识别出 ${recognizedEntries.length} 个色号。`);
      setPaletteReviewStatus(`本地识别共检测到 ${detections.length} 个色块，成功识别 ${recognizedEntries.length} 个色号。建议重点检查红框。`);
      return;
    }

    setExtractionStatus("后端 OCR 当前不可用，本地文字识别也没识别准。请用右侧列表逐个修正。", true);
    setPaletteReviewStatus("自动识别失败。请先点一个色块，再手动填写色号或重识别。", true);
  } catch (error) {
    setExtractionStatus("颜色图片加载失败，请换一张更清晰的图片。", true);
    console.warn(error);
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

function updateSamplingFromInputs() {
  if (!sampleInsetInput || !sampleOffsetXInput || !sampleOffsetYInput) {
    return;
  }

  patchState({
    sampling: {
      ...getState().sampling,
      mode: sampleModeSelect?.value || "ring",
      outerMarginRatio: clampNumber((Number.parseFloat(sampleOuterMarginInput?.value) || 10) / 100, 0.02, 0.28),
      innerExclusionRatio: clampNumber((Number.parseFloat(sampleInsetInput.value) || 24) / 100, 0.12, 0.42),
      offsetXRatio: clampNumber((Number.parseFloat(sampleOffsetXInput.value) || 0) / 100, -0.28, 0.28),
      offsetYRatio: clampNumber((Number.parseFloat(sampleOffsetYInput.value) || 0) / 100, -0.28, 0.28),
    },
  });
  resetAnalysis();
}

function updateRecognitionFromInputs() {
  patchState({
    recognition: {
      ...getState().recognition,
      watermarkTextAssist: Boolean(watermarkTextAssistInput?.checked),
      chartTextPriority: Boolean(chartTextPriorityInput?.checked),
      preserveBlankWithoutText: preserveBlankWithoutTextInput?.checked !== false,
      excludeOuterLayers: clampNumber(Number.parseInt(excludeOuterLayersInput?.value || "0", 10) || 0, 0, 8),
    },
  });
  resetAnalysis();
}

function updateAlignmentFromInputs() {
  const state = getState();
  patchState({
    gridAlignment: {
      offsetX: Number.parseFloat(gridOffsetXInput?.value) || 0,
      offsetY: Number.parseFloat(gridOffsetYInput?.value) || 0,
      cellWidthScale: clampNumber((Number.parseFloat(cellWidthScaleInput?.value) || 100) / 100, 0.75, 1.25),
      cellHeightScale: clampNumber((Number.parseFloat(cellHeightScaleInput?.value) || 100) / 100, 0.75, 1.25),
    },
    selectedPreviewCell: clampPreviewCell(state.selectedPreviewCell, state.gridSize),
  });
  resetAnalysis();
}

function updatePreviewCellFromInput() {
  patchState({
    selectedPreviewCell: parsePreviewCellValue(previewCellInput?.value, getState().gridSize),
  });
}

function handleSampleDemoPointerDown(event) {
  if (!sampleDemoCanvas) {
    return;
  }

  const rect = sampleDemoCanvas.getBoundingClientRect();
  const localX = event.clientX - rect.left;
  const localY = event.clientY - rect.top;
  const cellRect = { x: 24, y: 24, width: 132, height: 132 };
  if (
    localX < cellRect.x ||
    localX > cellRect.x + cellRect.width ||
    localY < cellRect.y ||
    localY > cellRect.y + cellRect.height
  ) {
    return;
  }

  patchState({
    sampling: {
      ...getState().sampling,
      mode: "anchor",
      anchorXRatio: clampNumber((localX - cellRect.x) / cellRect.width, 0.05, 0.95),
      anchorYRatio: clampNumber((localY - cellRect.y) / cellRect.height, 0.05, 0.95),
    },
  });
  resetAnalysis();
}

function handleSampleInspectPointerDown(event) {
  if (!sampleInspectCanvas || !sampleInspectHitRegions.length) {
    return;
  }

  const rect = sampleInspectCanvas.getBoundingClientRect();
  const localX = event.clientX - rect.left;
  const localY = event.clientY - rect.top;
  const state = getState();

  if (sampleInspectOverlay?.previewBox) {
    const { previewBox, cellBox, handles, handleRadius, scale } = sampleInspectOverlay;
    let dragMode = null;
    for (const [name, handle] of Object.entries(handles)) {
      if (Math.hypot(localX - handle.x, localY - handle.y) <= handleRadius + 4) {
        dragMode = name;
        break;
      }
    }

    if (!dragMode) {
      const moveBox = cellBox || previewBox;
      const withinPreview =
        localX >= moveBox.x &&
        localX <= moveBox.x + moveBox.width &&
        localY >= moveBox.y &&
        localY <= moveBox.y + moveBox.height;
      if (withinPreview) {
        dragMode = "move";
      }
    }

    if (dragMode) {
      sampleInspectGesture = {
        pointerId: event.pointerId,
        mode: dragMode,
        startX: localX,
        startY: localY,
        scale,
        startAlignment: { ...(state.gridAlignment || {}) },
        startMetrics: getEffectiveGridMetrics(state),
        startSampling: { ...(state.sampling || {}) },
        startBaseRect: sampleInspectOverlay?.baseRect ? { ...sampleInspectOverlay.baseRect } : null,
      };
      sampleInspectCanvas.setPointerCapture(event.pointerId);
      return;
    }
  }

  const hit = sampleInspectHitRegions.find(
    (item) =>
      localX >= item.drawX &&
      localX <= item.drawX + item.drawW &&
      localY >= item.drawY &&
      localY <= item.drawY + item.drawH,
  );

  if (!hit) {
    return;
  }

  patchState({
    selectedPreviewCell: clampPreviewCell({ x: hit.x, y: hit.y }, getState().gridSize),
  });
}

function applyInspectorDrag(localX, localY) {
  if (!sampleInspectGesture?.startMetrics) {
    return;
  }

  const state = getState();
  const dxImage = (localX - sampleInspectGesture.startX) / sampleInspectGesture.scale;
  const dyImage = (localY - sampleInspectGesture.startY) / sampleInspectGesture.scale;
  const startAlignment = sampleInspectGesture.startAlignment;
  const startMetrics = sampleInspectGesture.startMetrics;
  const baseCellWidth = startMetrics.baseCellWidth;
  const baseCellHeight = startMetrics.baseCellHeight;
  let offsetX = Number.isFinite(startAlignment.offsetX) ? startAlignment.offsetX : 0;
  let offsetY = Number.isFinite(startAlignment.offsetY) ? startAlignment.offsetY : 0;
  let cellWidth = startMetrics.cellWidth;
  let cellHeight = startMetrics.cellHeight;
  const mode = sampleInspectGesture.mode;

  if (mode === "move") {
    offsetX += dxImage;
    offsetY += dyImage;
  } else {
    const baseRect = sampleInspectGesture.startBaseRect || {
      width: startMetrics.cellWidth,
      height: startMetrics.cellHeight,
    };
    const startScale = getLocalSamplingScale(sampleInspectGesture.startSampling);
    let localWidth = baseRect.width * startScale.x;
    let localHeight = baseRect.height * startScale.y;

    if (mode.includes("e")) {
      localWidth += dxImage * 2;
    }
    if (mode.includes("w")) {
      localWidth -= dxImage * 2;
    }
    if (mode.includes("s")) {
      localHeight += dyImage * 2;
    }
    if (mode.includes("n")) {
      localHeight -= dyImage * 2;
    }
    const localScaleX = clampNumber(localWidth / Math.max(1, baseRect.width), 0.55, 1);
    const localScaleY = clampNumber(localHeight / Math.max(1, baseRect.height), 0.55, 1);
    setState((current) => ({
      ...current,
      sampling: {
        ...current.sampling,
        localScaleX,
        localScaleY,
      },
      selectedPreviewCell: clampPreviewCell(state.selectedPreviewCell, state.gridSize),
      analysis: null,
      currentChunkIndex: 0,
    }));
    return;
  }

  setState((current) => ({
    ...current,
    gridAlignment: {
      offsetX,
      offsetY,
      cellWidthScale: clampNumber(cellWidth / baseCellWidth, 0.75, 1.25),
      cellHeightScale: clampNumber(cellHeight / baseCellHeight, 0.75, 1.25),
    },
    selectedPreviewCell: clampPreviewCell(state.selectedPreviewCell, state.gridSize),
    analysis: null,
    currentChunkIndex: 0,
  }));
}

function handleSampleInspectPointerMove(event) {
  if (!sampleInspectGesture || sampleInspectGesture.pointerId !== event.pointerId) {
    return;
  }

  const rect = sampleInspectCanvas.getBoundingClientRect();
  const localX = event.clientX - rect.left;
  const localY = event.clientY - rect.top;
  applyInspectorDrag(localX, localY);
}

function handleSampleInspectPointerUp(event) {
  if (!sampleInspectGesture || sampleInspectGesture.pointerId !== event.pointerId) {
    return;
  }

  sampleInspectCanvas?.releasePointerCapture(event.pointerId);
  sampleInspectGesture = null;
}

function handlePaletteReviewPointerDown(event) {
  if (!paletteReviewCanvas || !paletteReviewState.sourceCanvas || !paletteReviewState.display) {
    return;
  }

  const displayRect = paletteReviewCanvas.getBoundingClientRect();
  const displayPoint = {
    x: event.clientX - displayRect.left - paletteReviewState.display.offsetX,
    y: event.clientY - displayRect.top - paletteReviewState.display.offsetY,
  };
  const grid = getPaletteReviewGrid();
  if (grid?.enabled && grid.editMode && grid.rect) {
    const gridDisplayRect = getPaletteGridDisplayRect(paletteReviewState.display, grid.rect);
    const handleKey = hitPaletteGridHandle(displayPoint, gridDisplayRect);
    if (handleKey || pointInPaletteGridRect(displayPoint, gridDisplayRect)) {
      paletteReviewGridGesture = {
        mode: handleKey || "move",
        startPoint: { x: displayPoint.x, y: displayPoint.y },
        startRect: { ...grid.rect },
      };
      paletteReviewCanvas.setPointerCapture(event.pointerId);
      return;
    }
  }

  const point = getPaletteReviewPoint(event);
  paletteReviewGesture = {
    start: point,
    active: true,
  };
  paletteReviewCanvas.setPointerCapture(event.pointerId);
}

function handlePaletteReviewPointerMove(event) {
  if (paletteReviewGridGesture?.mode && paletteReviewState.display && paletteReviewState.sourceCanvas) {
    const rect = paletteReviewCanvas.getBoundingClientRect();
    const displayPoint = {
      x: event.clientX - rect.left - paletteReviewState.display.offsetX,
      y: event.clientY - rect.top - paletteReviewState.display.offsetY,
    };
    const deltaX = displayPoint.x - paletteReviewGridGesture.startPoint.x;
    const deltaY = displayPoint.y - paletteReviewGridGesture.startPoint.y;
    const scale = paletteReviewState.display.scale || 1;
    const sourceDeltaX = deltaX / scale;
    const sourceDeltaY = deltaY / scale;
    const nextRect = { ...paletteReviewGridGesture.startRect };

    if (paletteReviewGridGesture.mode === "move") {
      nextRect.x += sourceDeltaX;
      nextRect.y += sourceDeltaY;
    } else if (paletteReviewGridGesture.mode.includes("w")) {
      nextRect.x += sourceDeltaX;
      nextRect.width -= sourceDeltaX;
    } else if (paletteReviewGridGesture.mode.includes("e")) {
      nextRect.width += sourceDeltaX;
    }

    if (paletteReviewGridGesture.mode.includes("n")) {
      nextRect.y += sourceDeltaY;
      nextRect.height -= sourceDeltaY;
    } else if (paletteReviewGridGesture.mode.includes("s")) {
      nextRect.height += sourceDeltaY;
    }

    const grid = getPaletteReviewGrid();
    grid.rect = normalizePaletteGridRect(paletteReviewState.sourceCanvas, nextRect);
    renderPaletteReview();
    saveStateToStorage();
    return;
  }

  if (!paletteReviewGesture?.active) {
    return;
  }

  const point = getPaletteReviewPoint(event);
  paletteReviewState.selection = {
    ...normalizeRect(paletteReviewGesture.start, point),
    width: Math.max(1, Math.abs(point.x - paletteReviewGesture.start.x)),
    height: Math.max(1, Math.abs(point.y - paletteReviewGesture.start.y)),
  };
  paletteReviewState.activeIndex = -1;
  paletteReviewState.manualRgb = null;
  paletteReviewState.manualPoint = null;
  renderPaletteReview();
}

function handlePaletteReviewPointerUp(event) {
  if (paletteReviewGridGesture?.mode) {
    paletteReviewGridGesture = null;
    try {
      paletteReviewCanvas.releasePointerCapture(event.pointerId);
    } catch (error) {
      void error;
    }
    setPaletteGridStatus("已更新网格位置。确认青色节距网格和黄色工作框都套准后，再点“按网格识别色卡”。");
    saveStateToStorage();
    return;
  }

  if (!paletteReviewGesture?.active) {
    return;
  }

  const point = getPaletteReviewPoint(event);
  const dragRect = normalizeRect(paletteReviewGesture.start, point);
  paletteReviewGesture.active = false;
  paletteReviewCanvas.releasePointerCapture(event.pointerId);
  paletteReviewState.manualRgb = null;
  paletteReviewState.manualPoint = null;

  if (dragRect.width < 6 && dragRect.height < 6) {
    const hitIndex = hitPaletteDetection(point);
    paletteReviewState.activeIndex = hitIndex;
    if (hitIndex >= 0) {
      const hit = paletteReviewState.detections[hitIndex];
      paletteReviewState.selection = { ...hit.box };
      paletteReviewState.manualRgb = hit.manualRgb ? [...hit.manualRgb] : null;
      paletteReviewState.manualPoint = hit.manualPoint ? { ...hit.manualPoint } : null;
      if (paletteReviewCodeInput) {
        paletteReviewCodeInput.value = hit.code || "";
      }
      setPaletteReviewStatus(
        hit.code
          ? `已选中色块 ${hit.swatchIndex}，当前识别为 ${hit.code}。如果不对，可以改手动色号后重新加入。`
          : `已选中色块 ${hit.swatchIndex}。当前未识别出色号，可点“对框选重识别”或直接手动录入。`,
        !hit.code,
      );
    } else {
      paletteReviewState.selection = null;
      setPaletteReviewStatus("已取消选择。");
    }
  } else {
    paletteReviewState.selection = {
      x: dragRect.x,
      y: dragRect.y,
      width: Math.max(1, dragRect.width),
      height: Math.max(1, dragRect.height),
    };
    setPaletteReviewStatus("已框选一个手动区域。可以点“对框选重识别”，或者直接填色号加入色卡。");
  }

  renderPaletteReview();
}

function selectPaletteReviewIndex(index) {
  if (index < 0 || index >= paletteReviewState.detections.length) {
    return;
  }

  const hit = paletteReviewState.detections[index];
  paletteReviewState.activeIndex = index;
  paletteReviewState.selection = { ...hit.box };
  paletteReviewState.manualRgb = hit.manualRgb ? [...hit.manualRgb] : null;
  paletteReviewState.manualPoint = hit.manualPoint ? { ...hit.manualPoint } : null;
  if (paletteReviewCodeInput) {
    paletteReviewCodeInput.value = hit.code || "";
  }
  setPaletteReviewStatus(
    hit.code
      ? `已选中第 ${index + 1} 个色块，当前识别为 ${hit.code}。`
      : `已选中第 ${index + 1} 个色块。当前未识别出色号，可直接手动填写。`,
    !hit.code,
  );
  renderPaletteReview();
}

function updatePaletteGridFromInputs() {
  const grid = getPaletteReviewGrid();
  if (!grid) {
    return;
  }
  grid.rows = clampNumber(Number.parseInt(paletteGridRowsInput?.value || String(grid.rows || 5), 10) || 5, 1, 30);
  grid.cols = clampNumber(Number.parseInt(paletteGridColsInput?.value || String(grid.cols || 10), 10) || 10, 1, 30);
  grid.gapXRatio = clampNumber((Number.parseInt(paletteGridGapXInput?.value || String(Math.round((grid.gapXRatio || 0) * 100)), 10) || 0) / 100, 0, 0.48);
  grid.gapYRatio = clampNumber((Number.parseInt(paletteGridGapYInput?.value || String(Math.round((grid.gapYRatio || 0) * 100)), 10) || 0) / 100, 0, 0.48);
  grid.editMode = Boolean(paletteGridEditInput?.checked);
  delete grid.anchorA;
  delete grid.anchorB;
  delete grid.anchorCount;
  saveStateToStorage();
  renderPaletteReview();
}

function initializePaletteGridFromCurrentView() {
  if (!paletteReviewState.sourceCanvas) {
    setPaletteGridStatus("请先上传一张颜色卡图片。", true);
    return;
  }
  const baseRect = paletteReviewState.selection
    ? { ...paletteReviewState.selection }
    : createDefaultPaletteReviewGrid(paletteReviewState.sourceCanvas, paletteReviewState.detections || []).rect;
  paletteReviewState.grid = {
    enabled: true,
    editMode: Boolean(paletteGridEditInput?.checked),
    rows: clampNumber(Number.parseInt(paletteGridRowsInput?.value || "5", 10) || 5, 1, 30),
    cols: clampNumber(Number.parseInt(paletteGridColsInput?.value || "10", 10) || 10, 1, 30),
    gapXRatio: clampNumber((Number.parseInt(paletteGridGapXInput?.value || "12", 10) || 12) / 100, 0, 0.48),
    gapYRatio: clampNumber((Number.parseInt(paletteGridGapYInput?.value || "12", 10) || 12) / 100, 0, 0.48),
    rect: normalizePaletteGridRect(paletteReviewState.sourceCanvas, baseRect),
  };
  setPaletteGridStatus("已初始化网格。青色框控制节距，黄色虚线是实际工作框。若色卡之间隔着数字或空白，继续调列间距/行间距。");
  saveStateToStorage();
  renderPaletteReview();
}

function clearPaletteGrid() {
  const grid = getPaletteReviewGrid();
  if (!grid) {
    return;
  }
  grid.enabled = false;
  grid.editMode = false;
  setPaletteGridStatus("已清除网格覆盖。");
  saveStateToStorage();
  renderPaletteReview();
}

function canvasToPngFile(canvas, fileName) {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("图片导出失败"));
        return;
      }
      resolve(new File([blob], fileName, { type: "image/png" }));
    }, "image/png");
  });
}

function runLocalPaletteGridRecognition(grid) {
  const boxes = getPaletteGridCellBoxes(grid);
  const detections = boxes.map((cell, index) => {
    const workBox = shrinkPaletteGridCellBox(cell, grid);
    const cellBox = {
      x: Math.floor(workBox.x),
      y: Math.floor(workBox.y),
      width: Math.max(1, Math.floor(workBox.width)),
      height: Math.max(1, Math.floor(workBox.height)),
    };
    const cellCanvas = createCanvasFromRegion(paletteReviewState.sourceCanvas, cellBox);
    const swatch = buildManualSelectionSwatch(cellCanvas);
    const matched = recognizeSwatchCode(cellCanvas, swatch);
    return {
      swatchIndex: index + 1,
      box: cellBox,
      sampleBox: {
        x: cellBox.x + swatch.box.x,
        y: cellBox.y + swatch.box.y,
        width: swatch.box.width,
        height: swatch.box.height,
      },
      rgb: swatch.rgb,
      code: matched?.code || "",
      score: matched?.score || 0,
      gridRow: cell.row,
      gridCol: cell.col,
    };
  });
  return {
    engine: "local-grid-fallback",
    detections,
    recognizedEntries: getRecognizedEntriesFromDetections(detections),
  };
}

async function applyPaletteGridRecognition() {
  if (!paletteReviewState.sourceCanvas) {
    setPaletteGridStatus("请先上传颜色卡图片。", true);
    return;
  }
  const grid = getPaletteReviewGrid();
  if (!grid?.enabled || !grid.rect) {
    setPaletteGridStatus("请先初始化网格。", true);
    return;
  }
  updatePaletteGridFromInputs();
  const frozenGrid = clonePaletteGrid(grid);
  setPaletteGridStatus(`准备按 ${frozenGrid.rows} 行 ${frozenGrid.cols} 列切图识别，请稍候...`);

  try {
    let result = null;
    if (canUseBackendOcr()) {
      try {
        const file = await canvasToPngFile(paletteReviewState.sourceCanvas, "palette-grid.png");
        result = await requestBackendPaletteGridOcr(file, frozenGrid);
        setPaletteGridStatus(`后端网格 OCR 已完成：检测 ${result.detections?.length || 0} 格，识别到 ${result.recognizedEntries?.length || 0} 个色号。`);
      } catch (error) {
        console.warn("Backend grid OCR unavailable, fallback to local grid review:", error);
      }
    }

    if (!result) {
      result = runLocalPaletteGridRecognition(frozenGrid);
      setPaletteGridStatus(`后端网格 OCR 当前不可用，已回退到本地逐格识别：检测 ${result.detections.length} 格，识别到 ${result.recognizedEntries.length} 个色号。`, true);
    }

    setPaletteReviewData(
      paletteReviewState.sourceCanvas,
      paletteReviewState.sourceName || "本图颜色卡",
      result.detections || [],
      {
        grid: {
          ...frozenGrid,
          enabled: true,
        },
      },
    );
    renderPaletteReview();
    setPaletteReviewStatus("网格识别结果已载入。现在 OCR 不再猜排版，你可以逐格检查并继续手动修正。");
  } catch (error) {
    setPaletteGridStatus(`网格识别失败：${error?.message || "未知错误"}`, true);
  }
}

function runPaletteSelectionOcr() {
  if ((getState().paletteReviewMode || "color-first") !== "ocr-first") {
    setPaletteReviewStatus("当前是“颜色优先”模式。这里不会识别文字，只会按你手填色号保存。", true);
    return;
  }
  const selection = paletteReviewState.selection;
  if (!paletteReviewState.sourceCanvas || !selection || selection.width < 8 || selection.height < 8) {
    setPaletteReviewStatus("请先框选一个足够大的色块区域。", true);
    return;
  }

  const regionCanvas = createCanvasFromRegion(paletteReviewState.sourceCanvas, selection);
  const localSwatch = buildManualSelectionSwatch(regionCanvas);
  const applyMatchedResult = (matchedCode, matchedScore, modeLabel) => {
    if (!matchedCode) {
      setPaletteReviewStatus(`${modeLabel} 没识别出稳定色号。你可以直接手动填写后再保存。`, true);
      return;
    }

    if (paletteReviewCodeInput) {
      paletteReviewCodeInput.value = matchedCode;
    }
    setPaletteReviewStatus(`${modeLabel} 识别结果：${matchedCode}（置信 ${(matchedScore || 0).toFixed(2)}）。这一步只回填色号，不会自动改色卡；确认无误后再点保存。`);
  };

  if (canUseBackendOcr()) {
    regionCanvas.toBlob(async (blob) => {
      if (!blob) {
        setPaletteReviewStatus("框选区域导出失败，请重试。", true);
        return;
      }
      try {
        const backendResult = await requestBackendManualSwatchOcr(new File([blob], "manual-swatch.png", { type: "image/png" }));
        const code = backendResult.code || "";
        const score = backendResult.score || 0;
        if (backendResult.sampleBox) {
          localSwatch.box = backendResult.sampleBox;
        }
        applyMatchedResult(code, score, getBackendEngineLabel(backendResult.engine));
        renderPaletteReview();
      } catch (error) {
        console.warn("Backend manual OCR unavailable, fallback to local OCR:", error);
        const matched = recognizeSwatchCode(regionCanvas, localSwatch);
        applyMatchedResult(matched?.code || "", matched?.score || 0, "本地回退 OCR");
        renderPaletteReview();
      }
    }, "image/png");
    return;
  }

  const matched = recognizeSwatchCode(regionCanvas, localSwatch);
  applyMatchedResult(matched?.code || "", matched?.score || 0, "本地回退 OCR");
  renderPaletteReview();
}

function savePaletteSelectionManually() {
  try {
    const activeDetection =
      paletteReviewState.activeIndex >= 0 ? paletteReviewState.detections[paletteReviewState.activeIndex] : null;
    const selection = activeDetection?.box || paletteReviewState.selection;
    const code = paletteReviewCodeInput?.value.trim().toUpperCase();
    const reviewMode = getState().paletteReviewMode || "color-first";
    if (!paletteReviewState.sourceCanvas || !selection || selection.width < 8 || selection.height < 8) {
      setPaletteReviewStatus("保存失败：请先在左侧选中一个色块，或重新框选一个足够大的区域。", true);
      return;
    }
    if (!code) {
      setPaletteReviewStatus(
        reviewMode === "ocr-first"
          ? "保存失败：请先点“后端重识别文字”或手动填写色号。"
          : "保存失败：请先输入手动色号，例如 H9。",
        true,
      );
      return;
    }

    setPaletteReviewStatus(`正在保存 ${code}...`);
    const regionCanvas = createCanvasFromRegion(paletteReviewState.sourceCanvas, selection);
    const localSwatch = buildManualSelectionSwatch(regionCanvas);
    const rgb = paletteReviewState.manualRgb ? [...paletteReviewState.manualRgb] : localSwatch.rgb;
    mergePaletteEntries(
      [
        {
          code,
          rgb,
          standardRgb: rgb,
        },
      ],
      paletteReviewState.sourceName || "本图颜色卡",
    );
    const nextDetection = {
      swatchIndex: paletteReviewState.detections.length + 1,
      rgb,
      box: { ...selection },
      sampleBox: {
        x: selection.x + localSwatch.box.x,
        y: selection.y + localSwatch.box.y,
        width: localSwatch.box.width,
        height: localSwatch.box.height,
      },
      manualRgb: paletteReviewState.manualRgb ? [...paletteReviewState.manualRgb] : null,
      manualPoint: paletteReviewState.manualPoint ? { ...paletteReviewState.manualPoint } : null,
      code,
      score: 1,
    };
    const shouldReplaceActive =
      Boolean(activeDetection) &&
      Math.abs(activeDetection.box.x - selection.x) < 1 &&
      Math.abs(activeDetection.box.y - selection.y) < 1 &&
      Math.abs(activeDetection.box.width - selection.width) < 1 &&
      Math.abs(activeDetection.box.height - selection.height) < 1;
    if (shouldReplaceActive && paletteReviewState.activeIndex >= 0) {
      paletteReviewState.detections[paletteReviewState.activeIndex] = {
        ...nextDetection,
        swatchIndex: activeDetection.swatchIndex,
      };
    } else {
      paletteReviewState.detections.push(nextDetection);
      paletteReviewState.activeIndex = paletteReviewState.detections.length - 1;
    }
    const nextIndex = shouldReplaceActive && paletteReviewState.activeIndex >= 0 ? paletteReviewState.activeIndex : paletteReviewState.detections.length - 1;
    paletteReviewState.activeIndex = nextIndex;
    paletteReviewState.selection = { ...nextDetection.box };
    if (paletteReviewCodeInput) {
      paletteReviewCodeInput.value = code;
    }
    setPaletteReviewStatus(
      shouldReplaceActive
        ? `已覆盖当前色块为 ${code}，并同步更新右侧列表。`
        : `已新增色块 ${code}，并加入右侧列表。`,
    );
    saveStateToStorage();
    renderPaletteReview();
  } catch (error) {
    setPaletteReviewStatus(`保存色卡报错：${error?.message || error}`, true);
    console.error("savePaletteSelectionManually failed", error);
  }
}

function applyCrop() {
  const state = getState();
  if (!state.crop || !state.image.element) {
    return;
  }
  patchState({ cropConfirmed: true });
  resetAnalysis();
}

function handleMinimapClick(event) {
  const state = getState();
  if (!state.analysis || !minimapCanvas) {
    return;
  }

  const nextIndex = resolveChunkIndexFromMapPoint(minimapCanvas, event, state.analysis);
  if (nextIndex >= 0) {
    patchState({ currentChunkIndex: nextIndex });
  }
}

function handleOverviewClick(event) {
  if (isBatchReplaceModeEnabled()) {
    return;
  }

  const state = getState();
  if (!state.analysis || !overviewCanvas) {
    return;
  }

  const gridPosition = resolveGridPositionFromMapPoint(overviewCanvas, event, state.analysis);
  const nextIndex = resolveChunkIndexFromMapPoint(overviewCanvas, event, state.analysis);
  if (nextIndex >= 0 || gridPosition) {
    patchState({
      currentChunkIndex: nextIndex >= 0 ? nextIndex : state.currentChunkIndex,
      selectedPreviewCell: gridPosition ? clampPreviewCell(gridPosition, state.gridSize) : state.selectedPreviewCell,
    });
  }
}

function setGridSize() {
  const gridSize = {
    width: Math.max(1, Number.parseInt(gridWidthInput.value, 10) || 1),
    height: Math.max(1, Number.parseInt(gridHeightInput.value, 10) || 1),
  };
  patchState({
    gridSize,
    selectedPreviewCell: clampPreviewCell(getState().selectedPreviewCell, gridSize),
  });
  resetAnalysis();
}

async function handleImageUpload(event) {
  const file = event.target.files?.[0];
  if (!file) {
    setImagePickHint("没有选到图片。若三星浏览器无反应，请点“直接打开系统选图”。", true);
    return;
  }

  try {
    const objectUrl = URL.createObjectURL(file);
    const reader = new FileReader();
    const dataUrl = await new Promise((resolve, reject) => {
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
    const image = await loadImageElement(objectUrl);
    URL.revokeObjectURL(objectUrl);

    resetPaletteReviewState();
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
      cropConfirmed: false,
      analysis: null,
      currentChunkIndex: 0,
      pickerMode: false,
      storedImage: createStoredImageRecord(dataUrl, image, file.name),
      currentProjectId: "",
      currentProjectName: normalizeProjectName(file.name),
      currentProjectStatus: "todo",
    }));
    setImagePickHint(`已载入图片：${file.name}`);
  } catch (error) {
    console.error("handleImageUpload failed", error);
    setImagePickHint(`载入图片失败：${error?.message || error}`, true);
  } finally {
    try {
      event.target.value = "";
    } catch (error) {
      console.warn("clear image input after upload failed:", error);
    }
  }
}

function handleOverviewPointerDown(event) {
  if (!isBatchReplaceModeEnabled() || !getState().analysis || !overviewCanvas) {
    return;
  }

  const rect = overviewCanvas.getBoundingClientRect();
  const localX = event.clientX - rect.left;
  const localY = event.clientY - rect.top;
  const startCell = resolveGridPositionFromLocalPoint(localX, localY, overviewCanvas.clientWidth || rect.width || 320, overviewCanvas.clientHeight || rect.height || 320, getState().analysis);
  if (!startCell) {
    return;
  }

  overviewSelectionGesture = {
    pointerId: event.pointerId,
    startX: localX,
    startY: localY,
    startCell,
    currentCell: startCell,
    moved: false,
  };
  analysisBatchSelection.dragRect = { start: startCell, end: startCell };
  overviewCanvas.setPointerCapture(event.pointerId);
  rerender();
}

function handleOverviewPointerMove(event) {
  if (!overviewSelectionGesture || overviewSelectionGesture.pointerId !== event.pointerId || !overviewCanvas || !getState().analysis) {
    return;
  }

  const rect = overviewCanvas.getBoundingClientRect();
  const localX = event.clientX - rect.left;
  const localY = event.clientY - rect.top;
  const currentCell = resolveGridPositionFromLocalPoint(localX, localY, overviewCanvas.clientWidth || rect.width || 320, overviewCanvas.clientHeight || rect.height || 320, getState().analysis) || overviewSelectionGesture.currentCell;
  overviewSelectionGesture.currentCell = currentCell;
  overviewSelectionGesture.moved =
    overviewSelectionGesture.moved ||
    Math.abs(localX - overviewSelectionGesture.startX) > 8 ||
    Math.abs(localY - overviewSelectionGesture.startY) > 8;
  analysisBatchSelection.dragRect = { start: overviewSelectionGesture.startCell, end: currentCell };
  rerender();
}

function handleOverviewPointerUp(event) {
  if (!overviewSelectionGesture || overviewSelectionGesture.pointerId !== event.pointerId || !overviewCanvas) {
    return;
  }

  const gesture = overviewSelectionGesture;
  overviewSelectionGesture = null;
  overviewCanvas.releasePointerCapture(event.pointerId);
  analysisBatchSelection.dragRect = null;

  if (!gesture.moved) {
    toggleBatchSelectionCell(gesture.startCell.x, gesture.startCell.y);
    patchState({
      selectedPreviewCell: clampPreviewCell(gesture.startCell, getState().gridSize),
    });
    return;
  }

  const added = addBatchSelectionRect(gesture.startCell, gesture.currentCell);
  patchState({
    selectedPreviewCell: clampPreviewCell(gesture.currentCell, getState().gridSize),
  });
  setBatchReplaceStatus(`已框选 ${added} 个格子。可继续框别的区域，最后统一替换。`);
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
    cropConfirmed: false,
  });
  resetAnalysis();
}

function addPaletteEntry() {
  const code = paletteCodeInput.value.trim().toUpperCase();
  const rgb = parseRgbText(paletteRgbInput.value) || hexToRgb(paletteColorInput.value);

  if (!code) {
    window.alert("请输入色号，例如 H07。");
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

  if (state.pickerMode) {
    const point = getCanvasEventPoint(event, state.cropDisplay);
    sampleColorAtPoint(point);
    rerender();
    return;
  }

  if (state.cropConfirmed) {
    const canvasWidth = cropCanvas.clientWidth || state.cropDisplay.drawWidth;
    const canvasHeight = Math.max(320, cropCanvas.clientHeight || state.cropDisplay.drawHeight);
    const zoomScale = Math.min(canvasWidth / state.crop.width, canvasHeight / state.crop.height);
    const zoomWidth = state.crop.width * zoomScale;
    const zoomHeight = state.crop.height * zoomScale;
    const originX = (canvasWidth - zoomWidth) / 2;
    const originY = (canvasHeight - zoomHeight) / 2;
    const rect = cropCanvas.getBoundingClientRect();
    const localX = event.clientX - rect.left;
    const localY = event.clientY - rect.top;

    if (
      localX >= originX &&
      localX <= originX + zoomWidth &&
      localY >= originY &&
      localY <= originY + zoomHeight
    ) {
      const imageX = state.crop.x + (localX - originX) / zoomScale;
      const imageY = state.crop.y + (localY - originY) / zoomScale;
      const metrics = getEffectiveGridMetrics(state);
      if (metrics) {
        patchState({
          selectedPreviewCell: clampPreviewCell(
            {
              x: Math.floor((imageX - metrics.originX) / metrics.cellWidth) + 1,
              y: Math.floor((imageY - metrics.originY) / metrics.cellHeight) + 1,
            },
            state.gridSize,
          ),
        });
      }
    }
    return;
  }

  const point = getCanvasEventPoint(event, state.cropDisplay);

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

  try {
    patchState({
      analysis: analyzeGrid({
      originalCanvas: state.originalCanvas,
      crop: state.crop,
      gridSize: state.gridSize,
      palette: buildAnalysisPalette(state),
      sampling: state.sampling,
      recognition: state.recognition,
      gridAlignment: state.gridAlignment,
      overrides: state.manualOverrides || {},
    }),
      currentChunkIndex: 0,
      seedAssist: {
        ...state.seedAssist,
        candidates: [],
      },
    });
  } catch (error) {
    console.error("Grid analyze failed:", error);
    parseStatus.textContent = `解析失败：${error?.message || "未知错误"}`;
  }
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

function moveChunkByGrid(deltaCol, deltaRow) {
  const state = getState();
  if (!state.analysis) {
    return;
  }

  const currentChunk = state.analysis.chunks[state.currentChunkIndex];
  const chunkCols = Math.ceil(state.analysis.gridWidth / 5);
  const chunkRows = Math.ceil(state.analysis.gridHeight / 5);
  const targetCol = clampNumber(currentChunk.chunkCol + deltaCol, 1, chunkCols);
  const targetRow = clampNumber(currentChunk.chunkRow + deltaRow, 1, chunkRows);
  const nextIndex = getChunkIndexByGridPosition(state.analysis, targetCol, targetRow);

  if (nextIndex >= 0) {
    patchState({ currentChunkIndex: nextIndex });
  }
}

function handleViewerPointerDown(event) {
  if (!getState().analysis) {
    return;
  }

  if (isBatchReplaceModeEnabled()) {
    viewerSelectionGesture = {
      start: getViewerPoint(event),
      pointerId: event.pointerId,
    };
    return;
  }

  viewerSwipeStart = getViewerPoint(event);
}

function handleViewerPointerUp(event) {
  if (isBatchReplaceModeEnabled()) {
    if (!viewerSelectionGesture || viewerSelectionGesture.pointerId !== event.pointerId) {
      return;
    }
    const endPoint = getViewerPoint(event);
    const deltaX = endPoint.x - viewerSelectionGesture.start.x;
    const deltaY = endPoint.y - viewerSelectionGesture.start.y;
    const state = getState();
    if (Math.abs(deltaX) <= 12 && Math.abs(deltaY) <= 12) {
      const gridPosition = resolveViewerCellFromPoint(endPoint.x, endPoint.y, state);
      if (gridPosition) {
        toggleBatchSelectionCell(gridPosition.x, gridPosition.y);
        patchState({
          selectedPreviewCell: clampPreviewCell(gridPosition, state.gridSize),
        });
      }
    }
    viewerSelectionGesture = null;
    return;
  }

  if (!viewerSwipeStart) {
    return;
  }

  const endPoint = getViewerPoint(event);
  const deltaX = endPoint.x - viewerSwipeStart.x;
  const deltaY = endPoint.y - viewerSwipeStart.y;
  viewerSwipeStart = null;

  if (Math.abs(deltaX) > Math.abs(deltaY) && Math.abs(deltaX) > 48) {
    moveChunkByGrid(deltaX < 0 ? 1 : -1, 0);
    return;
  }

  if (Math.abs(deltaY) > 48) {
    moveChunkByGrid(0, deltaY < 0 ? 1 : -1);
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

function bindTap(element, handler) {
  if (!element) {
    return;
  }

  let touchHandled = false;
  element.addEventListener("click", (event) => {
    if (touchHandled) {
      touchHandled = false;
      return;
    }
    handler(event);
  });
  element.addEventListener(
    "touchend",
    (event) => {
      touchHandled = true;
      event.preventDefault();
      handler(event);
    },
    { passive: false },
  );
}

function bindEvents() {
  for (const button of tabBtns) {
    button.addEventListener("click", (event) => {
      if (event.currentTarget.disabled) {
        return;
      }
      switchTab(event.currentTarget.dataset.tab);
    });
  }

  imageInput?.addEventListener("click", () => {
    try {
      imageInput.value = "";
    } catch (error) {
      console.warn("clear image input on click failed:", error);
    }
  });
  imageInput.addEventListener("change", handleImageUpload);
  imagePickBtn?.addEventListener("click", openImagePicker);
  saveProjectBtn?.addEventListener("click", saveCurrentProjectToLibrary);
  importProjectBtn?.addEventListener("click", () => libraryImageInput?.click());
  libraryDataExportBtn?.addEventListener("click", downloadLibraryBundle);
  libraryDataImportBtn?.addEventListener("click", () => libraryDataImportInput?.click());
  libraryDataImportInput?.addEventListener("change", async (event) => {
    await importLibraryBundleFromFile(event.target.files?.[0]);
    event.target.value = "";
  });
  libraryImageInput?.addEventListener("change", async (event) => {
    await importProjectsFromFiles(event.target.files);
    event.target.value = "";
  });
  libraryProjectNameInput?.addEventListener("change", () => {
    updateCurrentProjectMeta({ name: normalizeProjectName(libraryProjectNameInput.value) });
  });
  libraryProjectStatusSelect?.addEventListener("change", () => {
    updateCurrentProjectMeta({ status: libraryProjectStatusSelect.value || "todo" });
    if (getState().currentProjectId) {
      syncCurrentProjectToLibrary({ silent: true });
    }
  });
  libraryProjectList?.addEventListener("click", async (event) => {
    const openButton = event.target.closest("[data-library-open]");
    if (openButton) {
      await loadProjectById(openButton.dataset.libraryOpen);
      return;
    }

    const deleteButton = event.target.closest("[data-library-delete]");
    if (!deleteButton) {
      return;
    }

    const projectId = deleteButton.dataset.libraryDelete;
    const project = (getState().libraryProjects || []).find((item) => item.id === projectId);
    if (!project) {
      return;
    }
    if (!window.confirm(`确定删除图纸“${project.name}”吗？`)) {
      return;
    }
    removeProjectRecord(projectId);
  });
  libraryProjectList?.addEventListener("change", (event) => {
    const statusSelect = event.target.closest("[data-library-status]");
    if (!statusSelect) {
      return;
    }

    const projectId = statusSelect.dataset.libraryStatus;
    const nextStatus = statusSelect.value || "todo";
    const state = getState();
    const nextProjects = (state.libraryProjects || []).map((project) =>
      project.id === projectId
        ? {
            ...project,
            status: nextStatus,
            updatedAt: new Date().toISOString(),
            snapshot: {
              ...project.snapshot,
              currentProjectStatus: nextStatus,
            },
          }
        : project,
    );
    patchState({
      libraryProjects: nextProjects,
      ...(state.currentProjectId === projectId ? { currentProjectStatus: nextStatus } : {}),
    });
  });
  gridWidthInput.addEventListener("input", setGridSize);
  gridHeightInput.addEventListener("input", setGridSize);
  applyCropBtn?.addEventListener("click", applyCrop);
  resetCropBtn.addEventListener("click", resetCropToFullImage);
  paletteColorInput.addEventListener("input", () => {
    paletteRgbInput.value = formatRgb(hexToRgb(paletteColorInput.value));
  });
  paletteRgbInput.value = formatRgb(hexToRgb(paletteColorInput.value));
  addPaletteBtn.addEventListener("click", addPaletteEntry);
  pickColorBtn.addEventListener("click", () => patchState({ pickerMode: !getState().pickerMode }));
  togglePaletteBtn?.addEventListener("click", togglePalette);
  paletteSearchInput?.addEventListener("input", filterPalette);
  paletteImportModeSelect?.addEventListener("change", () => {
    patchState({ paletteImportMode: paletteImportModeSelect.value });
  });
  paletteReviewModeSelect?.addEventListener("change", () => {
    patchState({ paletteReviewMode: paletteReviewModeSelect.value });
    setPaletteReviewStatus(
      paletteReviewModeSelect.value === "ocr-first"
        ? "已切到“色号优先”。点击“后端重识别文字”会调用后端 OCR，只回填色号，不会自动改色卡。"
        : "已切到“颜色优先”。系统不会识别文字，只会按你手填色号 + 内部色块取色保存。",
    );
  });
  extractLegendBtn?.addEventListener("click", extractPaletteFromLegendArea);
  uploadPaletteImageBtn?.addEventListener("click", () => paletteImageInput?.click());
  paletteImageInput?.addEventListener("change", (event) => {
    extractPaletteFromUploadedImage(event.target.files?.[0]);
    event.target.value = "";
  });
  bindTap(paletteReviewRetryBtn, runPaletteSelectionOcr);
  paletteReviewSaveBtn?.addEventListener("click", savePaletteSelectionManually);
  paletteReviewSaveBtn?.addEventListener(
    "touchend",
    (event) => {
      event.preventDefault();
      savePaletteSelectionManually();
    },
    { passive: false },
  );
  bindTap(paletteReviewDeleteBtn, deleteActivePaletteReviewDetection);
  paletteReviewDetailCanvas?.addEventListener("pointerdown", handlePaletteReviewDetailPointerDown);
  paletteReviewDetailCanvas?.addEventListener("pointerup", handlePaletteReviewDetailPointerDown);
  paletteReviewDetailCanvas?.addEventListener("click", handlePaletteReviewDetailPointerDown);
  paletteReviewDetailCanvas?.addEventListener("mouseup", handlePaletteReviewDetailPointerDown);
  paletteReviewDetailCanvas?.addEventListener("touchstart", handlePaletteReviewDetailPointerDown, { passive: false });
  step2Panel?.addEventListener("pointerdown", handlePaletteReviewDetailDelegated, true);
  step2Panel?.addEventListener("click", handlePaletteReviewDetailDelegated, true);
  step2Panel?.addEventListener("mouseup", handlePaletteReviewDetailDelegated, true);
  step2Panel?.addEventListener("touchstart", handlePaletteReviewDetailDelegated, { passive: false, capture: true });
  bindTap(paletteReviewResetColorBtn, resetPaletteReviewManualColor);
  paletteGridRowsInput?.addEventListener("input", updatePaletteGridFromInputs);
  paletteGridColsInput?.addEventListener("input", updatePaletteGridFromInputs);
  paletteGridGapXInput?.addEventListener("input", updatePaletteGridFromInputs);
  paletteGridGapYInput?.addEventListener("input", updatePaletteGridFromInputs);
  paletteGridEditInput?.addEventListener("change", updatePaletteGridFromInputs);
  bindTap(paletteGridInitBtn, initializePaletteGridFromCurrentView);
  bindTap(paletteGridApplyBtn, applyPaletteGridRecognition);
  bindTap(paletteGridResetBtn, clearPaletteGrid);
  bindTap(paletteReviewClearBtn, () => {
    paletteReviewState.selection = null;
    paletteReviewState.manualRgb = null;
    paletteReviewState.manualPoint = null;
    paletteReviewState.activeIndex = -1;
    if (paletteReviewCodeInput) {
      paletteReviewCodeInput.value = "";
    }
    setPaletteReviewStatus("已清除当前框选。");
    renderPaletteReview();
    saveStateToStorage();
  });
  paletteReviewPixelGrid?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-palette-pixel-index]");
    if (!button) {
      return;
    }
    const index = Number.parseInt(button.dataset.palettePixelIndex, 10);
    if (!Number.isFinite(index)) {
      return;
    }
    applyManualPalettePixelSelection(index);
  });
  paletteReviewPixelGrid?.addEventListener(
    "touchend",
    (event) => {
      const button = event.target.closest("[data-palette-pixel-index]");
      if (!button) {
        return;
      }
      event.preventDefault();
      const index = Number.parseInt(button.dataset.palettePixelIndex, 10);
      if (!Number.isFinite(index)) {
        return;
      }
      applyManualPalettePixelSelection(index);
    },
    { passive: false },
  );
  paletteReviewList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-review-index]");
    if (!button) {
      return;
    }
    selectPaletteReviewIndex(Number.parseInt(button.dataset.reviewIndex, 10));
  });
  sampleOverlayToggle?.addEventListener("click", () => {
    patchState({ showSamplingOverlay: !getState().showSamplingOverlay });
  });
  sampleModeSelect?.addEventListener("change", updateSamplingFromInputs);
  sampleOuterMarginInput?.addEventListener("input", updateSamplingFromInputs);
  sampleInsetInput?.addEventListener("input", updateSamplingFromInputs);
  sampleOffsetXInput?.addEventListener("input", updateSamplingFromInputs);
  sampleOffsetYInput?.addEventListener("input", updateSamplingFromInputs);
  sampleInspectWindowSelect?.addEventListener("change", () => {
    patchState({
      sampleInspectWindow: clampNumber(Number.parseInt(sampleInspectWindowSelect.value || "3", 10) || 3, 3, 11),
    });
  });
  watermarkTextAssistInput?.addEventListener("change", updateRecognitionFromInputs);
  preserveBlankWithoutTextInput?.addEventListener("change", updateRecognitionFromInputs);
  excludeOuterLayersInput?.addEventListener("input", updateRecognitionFromInputs);
  sampleDemoCanvas?.addEventListener("pointerdown", handleSampleDemoPointerDown);
  sampleInspectCanvas?.addEventListener("pointerdown", handleSampleInspectPointerDown);
  sampleInspectCanvas?.addEventListener("pointermove", handleSampleInspectPointerMove);
  sampleInspectCanvas?.addEventListener("pointerup", handleSampleInspectPointerUp);
  sampleInspectCanvas?.addEventListener("pointercancel", handleSampleInspectPointerUp);
  seedTargetCodeSelect?.addEventListener("change", () => {
    patchState({
      seedAssist: {
        ...getState().seedAssist,
        targetCode: seedTargetCodeSelect.value,
        targetSeeds: [],
        candidates: [],
        targetPrototypeRgb: null,
      },
    });
  });
  seedContrastCodeSelect?.addEventListener("change", () => {
    patchState({
      seedAssist: {
        ...getState().seedAssist,
        contrastCode: seedContrastCodeSelect.value,
        contrastSeeds: [],
        candidates: [],
        contrastPrototypeRgb: null,
      },
    });
  });
  seedThresholdInput?.addEventListener("input", () => {
    patchState({
      seedAssist: {
        ...getState().seedAssist,
        threshold: Number.parseFloat(seedThresholdInput.value) || 8,
      },
    });
  });
  seedAddTargetBtn?.addEventListener("click", () => addCurrentCellAsSeed("target"));
  seedAddContrastBtn?.addEventListener("click", () => addCurrentCellAsSeed("contrast"));
  seedAnalyzeBtn?.addEventListener("click", analyzeSeedCandidates);
  seedApplyBtn?.addEventListener("click", applySeedCandidates);
  seedClearBtn?.addEventListener("click", () => {
    patchState({
      seedAssist: {
        ...getState().seedAssist,
        targetSeeds: [],
        contrastSeeds: [],
        candidates: [],
        targetPrototypeRgb: null,
        contrastPrototypeRgb: null,
      },
    });
  });
  seedResetOverridesBtn?.addEventListener("click", clearManualOverrides);
  calibrationActiveCodeSelect?.addEventListener("change", () => {
    patchState({
      calibrationAssist: {
        ...getState().calibrationAssist,
        activeCode: calibrationActiveCodeSelect.value || "",
      },
    });
  });
  calibrationAddSampleBtn?.addEventListener("click", addCurrentCellToCalibrationSamples);
  calibrationBuildBtn?.addEventListener("click", rebuildCalibrationPrototypes);
  calibrationApplyBtn?.addEventListener("click", applyCalibrationRematch);
  calibrationDisableBtn?.addEventListener("click", disableCalibrationRematch);
  calibrationClearActiveBtn?.addEventListener("click", () => {
    const state = getState();
    const activeCode = state.calibrationAssist?.activeCode || "";
    if (!activeCode) {
      return;
    }
    const nextSamplesByCode = {
      ...(state.calibrationAssist?.samplesByCode || {}),
    };
    const nextPrototypesByCode = {
      ...(state.calibrationAssist?.prototypesByCode || {}),
    };
    delete nextSamplesByCode[activeCode];
    delete nextPrototypesByCode[activeCode];
    patchState({
      calibrationAssist: {
        ...state.calibrationAssist,
        samplesByCode: nextSamplesByCode,
        prototypesByCode: nextPrototypesByCode,
      },
    });
  });
  calibrationClearAllBtn?.addEventListener("click", () => {
    patchState({
      calibrationAssist: {
        ...createEmptyCalibrationAssist(),
        activeCode: getState().calibrationAssist?.activeCode || "",
      },
    });
  });
  calibrationSampleList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-calibration-index]");
    if (!button) {
      return;
    }
    const state = getState();
    const activeCode = state.calibrationAssist?.activeCode || "";
    const refs = state.calibrationAssist?.samplesByCode?.[activeCode] || [];
    const index = Number.parseInt(button.dataset.calibrationIndex, 10);
    const ref = refs[index];
    if (!ref) {
      return;
    }
    patchState({
      selectedPreviewCell: clampPreviewCell({ x: ref.x, y: ref.y }, state.gridSize),
    });
  });
  [seedTargetList, seedContrastList].filter(Boolean).forEach((listEl) => listEl.addEventListener("click", (event) => {
    const button = event.target.closest("[data-seed-index]");
    if (!button) {
      return;
    }
    const index = Number.parseInt(button.dataset.seedIndex, 10);
    const state = getState();
    const type = button.dataset.seedType === "contrast" ? "contrast" : "target";
    const seeds = type === "contrast" ? state.seedAssist?.contrastSeeds || [] : state.seedAssist?.targetSeeds || [];
    const seed = seeds[index];
    if (!seed) {
      return;
    }
    patchState({
      selectedPreviewCell: clampPreviewCell({ x: seed.x, y: seed.y }, state.gridSize),
    });
  }));
  seedCandidateList?.addEventListener("click", (event) => {
    const button = event.target.closest("[data-seed-candidate-index]");
    if (!button) {
      return;
    }
    const index = Number.parseInt(button.dataset.seedCandidateIndex, 10);
    const item = getState().seedAssist?.candidates?.[index];
    if (!item) {
      return;
    }
    patchState({
      selectedPreviewCell: clampPreviewCell({ x: item.x, y: item.y }, getState().gridSize),
    });
  });
  gridOffsetXInput?.addEventListener("input", updateAlignmentFromInputs);
  gridOffsetYInput?.addEventListener("input", updateAlignmentFromInputs);
  cellWidthScaleInput?.addEventListener("input", updateAlignmentFromInputs);
  cellHeightScaleInput?.addEventListener("input", updateAlignmentFromInputs);
  previewCellInput?.addEventListener("change", updatePreviewCellFromInput);
  resetAlignmentBtn?.addEventListener("click", () => {
    patchState({
      gridAlignment: {
        offsetX: 0,
        offsetY: 0,
        cellWidthScale: 1,
        cellHeightScale: 1,
      },
      sampling: {
        ...getState().sampling,
        localScaleX: 1,
        localScaleY: 1,
      },
      selectedPreviewCell: { x: 1, y: 1 },
    });
    resetAnalysis();
  });
  paletteList.addEventListener("click", (event) => {
    const button = event.target.closest("[data-remove-index]");
    if (!button) {
      return;
    }

    const index = Number.parseInt(button.dataset.removeIndex, 10);
    patchState({ palette: getState().palette.filter((_, itemIndex) => itemIndex !== index) });
    resetAnalysis();
  });
  analyzeBtn.addEventListener("click", () => {
    handleAnalyze();
    if (getState().analysis && tabStep4Btn && !tabStep4Btn.disabled) {
      switchTab("tab-step4");
    }
  });
  downloadJsonBtn.addEventListener("click", downloadAnalysisJson);
  strategySelect.addEventListener("change", () => patchState({ strategyType: strategySelect.value }));
  prevChunkBtn.addEventListener("click", () => moveChunk(-1));
  nextChunkBtn.addEventListener("click", () => moveChunk(1));
  moveUpBtn?.addEventListener("click", () => moveChunkByGrid(0, -1));
  moveLeftBtn?.addEventListener("click", () => moveChunkByGrid(-1, 0));
  moveRightBtn?.addEventListener("click", () => moveChunkByGrid(1, 0));
  moveDownBtn?.addEventListener("click", () => moveChunkByGrid(0, 1));
  focusColorSelect?.addEventListener("change", () => patchState({ focusColorCode: focusColorSelect.value }));
  focusTopColorBtn?.addEventListener("click", () => {
    const topCode = getState().analysis?.globalStats?.[0]?.code || "";
    patchState({ focusColorCode: topCode });
  });
  clearFocusColorBtn?.addEventListener("click", () => patchState({ focusColorCode: "" }));
  markerPresetSelect?.addEventListener("change", () => patchState({ markerPreset: markerPresetSelect.value }));
  batchReplaceModeInput?.addEventListener("change", () => {
    if (!batchReplaceModeInput.checked) {
      analysisBatchSelection.dragRect = null;
    }
    rerender();
  });
  batchReplaceCodeInput?.addEventListener("input", () => {
    analysisBatchSelection.targetCode = normalizeColorCodeInput(batchReplaceCodeInput.value);
  });
  batchReplaceApplyBtn?.addEventListener("click", applyBatchReplaceToSelection);
  batchReplaceClearSelectionBtn?.addEventListener("click", () => {
    clearBatchSelection();
    rerender();
  });
  batchReplaceClearOverridesBtn?.addEventListener("click", clearSelectedBatchOverrides);
  cropCanvas.addEventListener("pointerdown", handleCropPointerDown);
  cropCanvas.addEventListener("pointermove", handleCropPointerMove);
  cropCanvas.addEventListener("pointerup", handleCropPointerUp);
  cropCanvas.addEventListener("pointercancel", handleCropPointerUp);
  paletteReviewCanvas?.addEventListener("pointerdown", handlePaletteReviewPointerDown);
  paletteReviewCanvas?.addEventListener("pointermove", handlePaletteReviewPointerMove);
  paletteReviewCanvas?.addEventListener("pointerup", handlePaletteReviewPointerUp);
  paletteReviewCanvas?.addEventListener("pointercancel", handlePaletteReviewPointerUp);
  viewerCanvas.addEventListener("pointerdown", handleViewerPointerDown);
  viewerCanvas.addEventListener("pointerup", handleViewerPointerUp);
  overviewCanvas?.addEventListener("pointerdown", handleOverviewPointerDown);
  overviewCanvas?.addEventListener("pointermove", handleOverviewPointerMove);
  overviewCanvas?.addEventListener("pointerup", handleOverviewPointerUp);
  overviewCanvas?.addEventListener("pointercancel", handleOverviewPointerUp);
  minimapCanvas?.addEventListener("click", handleMinimapClick);
  overviewCanvas?.addEventListener("click", handleOverviewClick);
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

injectEnhancementControls();
subscribe((state) => {
  rerender(state);
  saveStateToStorage();
});
bindEvents();
restoreStateFromStorage().finally(() => {
  switchTab("tab-library");
  rerender();
});
