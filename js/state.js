const initialState = {
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
  gridAlignment: {
    offsetX: 0,
    offsetY: 0,
    cellWidthScale: 1,
    cellHeightScale: 1,
  },
  sampling: {
    mode: "ring",
    outerMarginRatio: 0.1,
    innerExclusionRatio: 0.24,
    offsetXRatio: 0,
    offsetYRatio: 0,
    localScaleX: 1,
    localScaleY: 1,
    anchorXRatio: 0.18,
    anchorYRatio: 0.18,
    patchRadius: 1,
  },
  recognition: {
    watermarkTextAssist: false,
    chartTextPriority: false,
    excludeOuterLayers: 0,
    preserveBlankWithoutText: true,
  },
  showSamplingOverlay: true,
  palette: [],
  paletteSetName: "当前项目色卡",
  paletteImportMode: "replace",
  paletteReviewMode: "color-first",
  pickerMode: false,
  analysis: null,
  currentChunkIndex: 0,
  strategyType: "color-fill",
  focusColorCode: "",
  markerPreset: "lime",
  selectedPreviewCell: {
    x: 1,
    y: 1,
  },
  sampleInspectWindow: 3,
  manualOverrides: {},
  seedAssist: {
    targetCode: "",
    contrastCode: "",
    threshold: 8,
    targetSeeds: [],
    contrastSeeds: [],
    candidates: [],
    targetPrototypeRgb: null,
    contrastPrototypeRgb: null,
  },
  calibrationAssist: {
    enabled: false,
    activeCode: "",
    samplesByCode: {},
    prototypesByCode: {},
  },
  storedImage: null,
  libraryProjects: [],
  currentProjectId: "",
  currentProjectName: "",
  currentProjectStatus: "todo",
};

let state = structuredClone(initialState);
const listeners = new Set();

function notify() {
  for (const listener of listeners) {
    listener(state);
  }
}

export function getState() {
  return state;
}

export function setState(updater) {
  const nextState = typeof updater === "function" ? updater(state) : updater;
  state = nextState;
  notify();
}

export function patchState(partial) {
  state = {
    ...state,
    ...partial,
  };
  notify();
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function resetAnalysis() {
  state = {
    ...state,
    analysis: null,
    currentChunkIndex: 0,
  };
  notify();
}
