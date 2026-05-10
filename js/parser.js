import { clamp, getPerceptualDistance, getRgbDistance, matchNearestColor } from "./color.js";

const SAMPLE_OUTER_MARGIN_RATIO = 0.1;
const SAMPLE_INNER_EXCLUSION_RATIO = 0.24;
const SAMPLE_RING_OFFSETS = [
  [0.18, "top"],
  [0.36, "top"],
  [0.5, "top"],
  [0.64, "top"],
  [0.82, "top"],
  [0.18, "bottom"],
  [0.36, "bottom"],
  [0.5, "bottom"],
  [0.64, "bottom"],
  [0.82, "bottom"],
  ["left", 0.34],
  ["left", 0.5],
  ["left", 0.66],
  ["right", 0.34],
  ["right", 0.5],
  ["right", 0.66],
];
const TEXT_REGION_X_RATIO = 0.2;
const TEXT_REGION_Y_RATIO = 0.18;
const TEXT_REGION_WIDTH_RATIO = 0.6;
const TEXT_REGION_HEIGHT_RATIO = 0.64;
const TEXT_TEMPLATE_CACHE = new Map();

function getLocalSamplingRect(cellStartX, cellStartY, cellWidth, cellHeight, sampling = {}) {
  const localScaleX = clamp(
    Number.isFinite(sampling.localScaleX) ? sampling.localScaleX : 1,
    0.55,
    1,
  );
  const localScaleY = clamp(
    Number.isFinite(sampling.localScaleY) ? sampling.localScaleY : 1,
    0.55,
    1,
  );
  const width = cellWidth * localScaleX;
  const height = cellHeight * localScaleY;
  const x = cellStartX + (cellWidth - width) / 2;
  const y = cellStartY + (cellHeight - height) / 2;

  return {
    x,
    y,
    width,
    height,
    localScaleX,
    localScaleY,
  };
}

function getPixelFromImageData(imageData, width, x, y) {
  const px = clamp(Math.floor(x), 0, width - 1);
  const py = clamp(Math.floor(y), 0, imageData.height - 1);
  const index = (py * width + px) * 4;

  return [
    imageData.data[index],
    imageData.data[index + 1],
    imageData.data[index + 2],
  ];
}

function getPatchAverageFromImageData(imageData, width, x, y, radius = 1) {
  const pixels = [];
  for (let offsetY = -radius; offsetY <= radius; offsetY += 1) {
    for (let offsetX = -radius; offsetX <= radius; offsetX += 1) {
      pixels.push(getPixelFromImageData(imageData, width, x + offsetX, y + offsetY));
    }
  }

  return averageRgb(pixels);
}

function chunkCells(cells, gridWidth, gridHeight, chunkSize = 5) {
  const chunks = [];
  const chunkCols = Math.ceil(gridWidth / chunkSize);
  const chunkRows = Math.ceil(gridHeight / chunkSize);

  for (let chunkRow = 0; chunkRow < chunkRows; chunkRow += 1) {
    for (let chunkCol = 0; chunkCol < chunkCols; chunkCol += 1) {
      const startX = chunkCol * chunkSize + 1;
      const endX = Math.min(gridWidth, startX + chunkSize - 1);
      const startY = chunkRow * chunkSize + 1;
      const endY = Math.min(gridHeight, startY + chunkSize - 1);
      const chunkCellsList = [];

      for (let y = startY; y <= endY; y += 1) {
        for (let x = startX; x <= endX; x += 1) {
          chunkCellsList.push(cells[(y - 1) * gridWidth + (x - 1)]);
        }
      }

      chunks.push({
        index: chunks.length,
        chunkCol: chunkCol + 1,
        chunkRow: chunkRow + 1,
        startX,
        endX,
        startY,
        endY,
        width: endX - startX + 1,
        height: endY - startY + 1,
        cells: chunkCellsList,
      });
    }
  }

  return chunks;
}

export function buildStats(cells) {
  const counts = new Map();

  for (const cell of cells) {
    if (cell.excluded || cell.code === "EXCLUDED" || cell.code === "EMPTY" || cell.code === "UNSET") {
      continue;
    }
    counts.set(cell.code, (counts.get(cell.code) || 0) + 1);
  }

  return [...counts.entries()]
    .map(([code, count]) => ({ code, count }))
    .sort((left, right) => right.count - left.count || left.code.localeCompare(right.code));
}

function averageRgb(samples) {
  const total = samples.reduce(
    (accumulator, rgb) => {
      accumulator[0] += rgb[0];
      accumulator[1] += rgb[1];
      accumulator[2] += rgb[2];
      return accumulator;
    },
    [0, 0, 0],
  );

  return total.map((value) => Math.round(value / samples.length));
}

function medianRgb(samples) {
  if (!samples.length) {
    return [0, 0, 0];
  }

  return [0, 1, 2].map((channel) => {
    const sorted = samples.map((rgb) => rgb[channel]).sort((left, right) => left - right);
    const middle = Math.floor(sorted.length / 2);
    if (sorted.length % 2 === 1) {
      return sorted[middle];
    }
    return Math.round((sorted[middle - 1] + sorted[middle]) / 2);
  });
}

function shouldExcludeCell(col, row, gridWidth, gridHeight, excludeOuterLayers = 0) {
  if (!excludeOuterLayers) {
    return false;
  }
  return (
    col < excludeOuterLayers ||
    row < excludeOuterLayers ||
    col >= gridWidth - excludeOuterLayers ||
    row >= gridHeight - excludeOuterLayers
  );
}

function buildParserActiveBounds(mask, width, height) {
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

function normalizeParserBinaryMask(mask, width, height, targetWidth = 72, targetHeight = 28) {
  const bounds = buildParserActiveBounds(mask, width, height);
  if (!bounds) {
    return null;
  }

  const normalized = new Uint8Array(targetWidth * targetHeight);
  for (let targetY = 0; targetY < targetHeight; targetY += 1) {
    for (let targetX = 0; targetX < targetWidth; targetX += 1) {
      const sourceX = bounds.x + ((targetX + 0.5) / targetWidth) * bounds.width;
      const sourceY = bounds.y + ((targetY + 0.5) / targetHeight) * bounds.height;
      const pixelX = clamp(Math.floor(sourceX), 0, width - 1);
      const pixelY = clamp(Math.floor(sourceY), 0, height - 1);
      normalized[targetY * targetWidth + targetX] = mask[pixelY * width + pixelX];
    }
  }

  return {
    width: targetWidth,
    height: targetHeight,
    data: normalized,
  };
}

function renderParserCodeTemplateMask(code, fontFamily) {
  const cacheKey = `${code}::${fontFamily}`;
  if (TEXT_TEMPLATE_CACHE.has(cacheKey)) {
    return TEXT_TEMPLATE_CACHE.get(cacheKey);
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

  const normalized = normalizeParserBinaryMask(mask, canvas.width, canvas.height);
  TEXT_TEMPLATE_CACHE.set(cacheKey, normalized);
  return normalized;
}

function compareParserBinaryMasks(left, right) {
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

function getParserCellTextRect(cellStartX, cellStartY, cellWidth, cellHeight) {
  return {
    x: cellStartX + cellWidth * TEXT_REGION_X_RATIO,
    y: cellStartY + cellHeight * TEXT_REGION_Y_RATIO,
    width: Math.max(8, cellWidth * TEXT_REGION_WIDTH_RATIO),
    height: Math.max(8, cellHeight * TEXT_REGION_HEIGHT_RATIO),
  };
}

function buildParserCellTextMask(imageData, imageWidth, cellStartX, cellStartY, cellWidth, cellHeight, backgroundRgb) {
  const roi = getParserCellTextRect(cellStartX, cellStartY, cellWidth, cellHeight);
  const startX = clamp(Math.floor(roi.x), 0, imageWidth - 1);
  const startY = clamp(Math.floor(roi.y), 0, imageData.height - 1);
  const roiWidth = Math.max(4, Math.min(imageWidth - startX, Math.floor(roi.width)));
  const roiHeight = Math.max(4, Math.min(imageData.height - startY, Math.floor(roi.height)));
  const mask = new Uint8Array(roiWidth * roiHeight);

  for (let y = 0; y < roiHeight; y += 1) {
    for (let x = 0; x < roiWidth; x += 1) {
      const rgb = getPixelFromImageData(imageData, imageWidth, startX + x, startY + y);
      const distance = getRgbDistance(rgb, backgroundRgb);
      const brightnessDelta =
        Math.abs(((rgb[0] + rgb[1] + rgb[2]) / 3) - ((backgroundRgb[0] + backgroundRgb[1] + backgroundRgb[2]) / 3));
      mask[y * roiWidth + x] = distance >= 34 || brightnessDelta >= 24 ? 1 : 0;
    }
  }

  return normalizeParserBinaryMask(mask, roiWidth, roiHeight);
}

function getParserMaskDensity(mask) {
  if (!mask?.data?.length) {
    return 0;
  }
  let active = 0;
  for (const value of mask.data) {
    if (value) {
      active += 1;
    }
  }
  return active / mask.data.length;
}

function recognizeCellCodeFromMask(sampleMask, palette) {
  if (!sampleMask || !palette.length) {
    return null;
  }

  let bestMatch = null;
  for (const entry of palette) {
    const variants = [
      renderParserCodeTemplateMask(entry.code, '"Arial Black", "Segoe UI", sans-serif'),
      renderParserCodeTemplateMask(entry.code, '"Segoe UI", Arial, sans-serif'),
    ].filter(Boolean);
    for (const variant of variants) {
      const score = compareParserBinaryMasks(sampleMask, variant);
      if (!bestMatch || score > bestMatch.score) {
        bestMatch = { code: entry.code, score };
      }
    }
  }

  if (!bestMatch || bestMatch.score < 0.16) {
    return null;
  }

  return bestMatch;
}

function recognizeCellCodeFromCenter(imageData, imageWidth, cellStartX, cellStartY, cellWidth, cellHeight, backgroundRgb, palette) {
  const sampleMask = buildParserCellTextMask(imageData, imageWidth, cellStartX, cellStartY, cellWidth, cellHeight, backgroundRgb);
  return recognizeCellCodeFromMask(sampleMask, palette);
}

function getPixelVariance(samples) {
  if (!samples.length) {
    return 0;
  }
  const average = averageRgb(samples);
  return samples.reduce((sum, rgb) => sum + getRgbDistance(rgb, average), 0) / samples.length;
}

function buildBackgroundSamplePixels(imageData, imageWidth, cellStartX, cellStartY, cellWidth, cellHeight, sampling) {
  const mode = sampling.mode || "ring";
  const outerMarginRatio = clamp(
    Number.isFinite(sampling.outerMarginRatio) ? sampling.outerMarginRatio : SAMPLE_OUTER_MARGIN_RATIO,
    0.02,
    0.28,
  );
  const innerExclusionRatio = Math.max(
    clamp(
      Number.isFinite(sampling.innerExclusionRatio) ? sampling.innerExclusionRatio : SAMPLE_INNER_EXCLUSION_RATIO,
      0.12,
      0.42,
    ),
    outerMarginRatio + 0.04,
  );
  const offsetXRatio = clamp(
    Number.isFinite(sampling.offsetXRatio) ? sampling.offsetXRatio : 0,
    -0.28,
    0.28,
  );
  const offsetYRatio = clamp(
    Number.isFinite(sampling.offsetYRatio) ? sampling.offsetYRatio : 0,
    -0.28,
    0.28,
  );
  const pixels = [];
  const points = [];
  const sampleRect = getLocalSamplingRect(cellStartX, cellStartY, cellWidth, cellHeight, sampling);
  const sampleStartX = sampleRect.x;
  const sampleStartY = sampleRect.y;
  const sampleWidth = sampleRect.width;
  const sampleHeight = sampleRect.height;

  if (mode === "anchor") {
    const anchorXRatio = clamp(Number.isFinite(sampling.anchorXRatio) ? sampling.anchorXRatio : 0.18, 0.05, 0.95);
    const anchorYRatio = clamp(Number.isFinite(sampling.anchorYRatio) ? sampling.anchorYRatio : 0.18, 0.05, 0.95);
    const sampleX = sampleStartX + anchorXRatio * sampleWidth;
    const sampleY = sampleStartY + anchorYRatio * sampleHeight;
    pixels.push(getPatchAverageFromImageData(imageData, imageWidth, sampleX, sampleY, sampling.patchRadius || 1));
    points.push({ x: sampleX, y: sampleY });
    return { pixels, points };
  }

  for (const [ratioA, ratioB] of SAMPLE_RING_OFFSETS) {
    const shiftedX = typeof ratioA === "number" ? clamp(ratioA + offsetXRatio, 0.05, 0.95) : ratioA;
    const shiftedY = typeof ratioB === "number" ? clamp(ratioB + offsetYRatio, 0.05, 0.95) : ratioB;
    const ratioX =
      shiftedX === "left" ? outerMarginRatio : shiftedX === "right" ? 1 - outerMarginRatio : shiftedX;
    const ratioY =
      shiftedY === "top" ? outerMarginRatio : shiftedY === "bottom" ? 1 - outerMarginRatio : shiftedY;
    const sampleX = clamp(sampleStartX + ratioX * sampleWidth, sampleStartX, sampleStartX + sampleWidth);
    const sampleY = clamp(sampleStartY + ratioY * sampleHeight, sampleStartY, sampleStartY + sampleHeight);
    if (
      ratioX > innerExclusionRatio &&
      ratioX < 1 - innerExclusionRatio &&
      ratioY > innerExclusionRatio &&
      ratioY < 1 - innerExclusionRatio
    ) {
      continue;
    }
    pixels.push(getPatchAverageFromImageData(imageData, imageWidth, sampleX, sampleY, sampling.patchRadius || 1));
    points.push({ x: sampleX, y: sampleY });
  }

  return { pixels, points };
}

function resolveCellColor(sampledPixels, palette) {
  if (!sampledPixels.length) {
    return {
      sampledRgb: [0, 0, 0],
      code: "UNSET",
      matchedRgb: [0, 0, 0],
      distance: null,
      confidence: 0,
      voteBreakdown: [],
    };
  }

  const sampledRgb = averageRgb(sampledPixels);
  if (!palette.length) {
    return {
      sampledRgb,
      code: "UNSET",
      matchedRgb: sampledRgb,
      distance: null,
      confidence: 0,
      voteBreakdown: [],
    };
  }

  const votes = new Map();

  for (const pixel of sampledPixels) {
    const nearest = matchNearestColor(pixel, palette);
    if (!nearest) {
      continue;
    }

    const existing = votes.get(nearest.code) || {
      count: 0,
      pixels: [],
      distanceSum: 0,
      rgb: nearest.rgb,
    };
    existing.count += 1;
    existing.pixels.push(pixel);
    existing.distanceSum += nearest.distance;
    votes.set(nearest.code, existing);
  }

  const winnerEntry = [...votes.entries()]
    .map(([code, entry]) => ({
      code,
      ...entry,
      averageDistance: entry.distanceSum / Math.max(1, entry.count),
    }))
    .sort(
      (left, right) =>
        right.count - left.count ||
        left.averageDistance - right.averageDistance ||
        left.code.localeCompare(right.code),
    )[0];

  if (!winnerEntry) {
    return {
      sampledRgb,
      code: "UNSET",
      matchedRgb: sampledRgb,
      distance: null,
      confidence: 0,
      voteBreakdown: [],
    };
  }

  const winnerPixels = winnerEntry.pixels.length ? winnerEntry.pixels : sampledPixels;
  const stableRgb = medianRgb(winnerPixels);
  const supportRatio = winnerEntry.count / sampledPixels.length;
  const distanceSpread = Math.max(0, 1 - winnerEntry.averageDistance / 35);
  const confidence = Math.max(0, Math.min(1, supportRatio * 0.8 + distanceSpread * 0.2));
  const voteBreakdown = [...votes.entries()]
    .map(([code, entry]) => ({
      code,
      count: entry.count,
      matchedRgb: entry.rgb,
      averageDistance: entry.distanceSum / Math.max(1, entry.count),
      ratio: entry.count / sampledPixels.length,
    }))
    .sort(
      (left, right) =>
        right.count - left.count ||
        left.averageDistance - right.averageDistance ||
        left.code.localeCompare(right.code),
    );

  return {
    sampledRgb: stableRgb,
    code: winnerEntry.code,
    matchedRgb: winnerEntry.rgb,
    distance: Number.isFinite(winnerEntry.averageDistance) ? winnerEntry.averageDistance : getPerceptualDistance(stableRgb, winnerEntry.rgb),
    confidence,
    voteBreakdown,
  };
}

function looksLikeBlankCell(sampledRgb, variance, textMaskDensity, preserveBlankWithoutText) {
  if (!preserveBlankWithoutText) {
    return false;
  }

  const brightness = (sampledRgb[0] + sampledRgb[1] + sampledRgb[2]) / 3;
  const colorSpread = Math.max(sampledRgb[0], sampledRgb[1], sampledRgb[2]) - Math.min(sampledRgb[0], sampledRgb[1], sampledRgb[2]);
  return brightness >= 232 && variance <= 18 && textMaskDensity <= 0.018 && colorSpread <= 42;
}

export function analyzeGrid({ originalCanvas, crop, gridSize, palette, sampling = {}, gridAlignment = {}, recognition = {}, overrides = {} }) {
  const { width: gridWidth, height: gridHeight } = gridSize;
  const ctx = originalCanvas.getContext("2d", { willReadFrequently: true });
  const imageData = ctx.getImageData(0, 0, originalCanvas.width, originalCanvas.height);
  const paletteByCode = new Map(palette.map((entry) => [entry.code, entry]));
  const watermarkTextAssist = Boolean(recognition.watermarkTextAssist);
  const preserveBlankWithoutText = recognition.preserveBlankWithoutText !== false;
  const excludeOuterLayers = clamp(
    Number.isFinite(recognition.excludeOuterLayers) ? recognition.excludeOuterLayers : 0,
    0,
    8,
  );
  const exhaustiveTextAssist = watermarkTextAssist && gridWidth * gridHeight <= 1600 && palette.length <= 24;
  const baseCellWidth = crop.width / gridWidth;
  const baseCellHeight = crop.height / gridHeight;
  const cellWidthScale = clamp(
    Number.isFinite(gridAlignment.cellWidthScale) ? gridAlignment.cellWidthScale : 1,
    0.75,
    1.25,
  );
  const cellHeightScale = clamp(
    Number.isFinite(gridAlignment.cellHeightScale) ? gridAlignment.cellHeightScale : 1,
    0.75,
    1.25,
  );
  const originX = crop.x + (Number.isFinite(gridAlignment.offsetX) ? gridAlignment.offsetX : 0);
  const originY = crop.y + (Number.isFinite(gridAlignment.offsetY) ? gridAlignment.offsetY : 0);
  const cellWidth = baseCellWidth * cellWidthScale;
  const cellHeight = baseCellHeight * cellHeightScale;
  const cells = [];

  for (let row = 0; row < gridHeight; row += 1) {
    for (let col = 0; col < gridWidth; col += 1) {
      const cellStartX = originX + col * cellWidth;
      const cellStartY = originY + row * cellHeight;
      const centerX = cellStartX + 0.5 * cellWidth;
      const centerY = cellStartY + 0.5 * cellHeight;
      const sampledPack = buildBackgroundSamplePixels(
        imageData,
        originalCanvas.width,
        cellStartX,
        cellStartY,
        cellWidth,
        cellHeight,
        sampling,
      );
      const resolved = resolveCellColor(sampledPack.pixels, palette);
      const pixelVariance = getPixelVariance(sampledPack.pixels);
      const isExcluded = shouldExcludeCell(col, row, gridWidth, gridHeight, excludeOuterLayers);
      const textMask = buildParserCellTextMask(
        imageData,
        originalCanvas.width,
        cellStartX,
        cellStartY,
        cellWidth,
        cellHeight,
        resolved.sampledRgb,
      );
      const textMaskDensity = getParserMaskDensity(textMask);
      const isLikelyBlank =
        !isExcluded &&
        looksLikeBlankCell(resolved.sampledRgb, pixelVariance, textMaskDensity, preserveBlankWithoutText);
      const textAssistCandidate =
        watermarkTextAssist &&
        !isLikelyBlank &&
        !isExcluded &&
        (
          exhaustiveTextAssist ||
          resolved.confidence < 0.9 ||
          (resolved.voteBreakdown[0]?.ratio || 0) < 0.92 ||
          pixelVariance > 14
        )
          ? recognizeCellCodeFromMask(textMask, palette)
          : null;
      const shouldApplyTextAssist =
        Boolean(textAssistCandidate) &&
        (() => {
          const textMatchedEntry = paletteByCode.get(textAssistCandidate.code);
          if (!textMatchedEntry) {
            return false;
          }

          const sampledBrightness = (resolved.sampledRgb[0] + resolved.sampledRgb[1] + resolved.sampledRgb[2]) / 3;
          const textCandidateDistance = getPerceptualDistance(resolved.sampledRgb, textMatchedEntry.rgb);
          const resolvedDistance = Number.isFinite(resolved.distance) ? resolved.distance : getPerceptualDistance(resolved.sampledRgb, resolved.matchedRgb);
          const textMaskStrongEnough = textMaskDensity >= 0.022;
          const textScoreStrongEnough =
            textAssistCandidate.score >= 0.3 ||
            (
              textAssistCandidate.score >= 0.22 &&
              (resolved.confidence < 0.82 || (resolved.voteBreakdown[0]?.ratio || 0) < 0.68 || resolved.code === "UNSET")
            );
          const colorDistanceAcceptable =
            textCandidateDistance <= resolvedDistance + 3.2 ||
            (
              resolved.confidence < 0.72 &&
              textCandidateDistance <= resolvedDistance + 8
            ) ||
            (
              resolved.code === "UNSET" &&
              textCandidateDistance <= 24
            );
          const darkCellGuard =
            sampledBrightness > 88 ||
            (
              textMaskDensity >= 0.05 &&
              textAssistCandidate.score >= 0.34 &&
              textCandidateDistance <= resolvedDistance + 2.2
            );

          return textMaskStrongEnough && textScoreStrongEnough && colorDistanceAcceptable && darkCellGuard;
        })();
      const textMatchedEntry = shouldApplyTextAssist ? paletteByCode.get(textAssistCandidate.code) : null;
      const overrideCode = overrides[`${col + 1},${row + 1}`] || "";
      const matchedEntry = overrideCode ? paletteByCode.get(overrideCode) : null;
      const finalCode = isExcluded
        ? "EXCLUDED"
        : overrideCode || (isLikelyBlank ? "EMPTY" : textMatchedEntry?.code || resolved.code);
      const finalMatchedRgb = isExcluded || isLikelyBlank ? resolved.sampledRgb : matchedEntry?.rgb || textMatchedEntry?.rgb || resolved.matchedRgb;

      cells.push({
        x: col + 1,
        y: row + 1,
        cellStartX,
        cellStartY,
        cellWidth,
        cellHeight,
        centerX,
        centerY,
        sampledRgb: resolved.sampledRgb,
        code: finalCode,
        matchedRgb: finalMatchedRgb,
        distance: isExcluded ? null : overrideCode ? 0 : textMatchedEntry ? 0 : resolved.distance,
        confidence: isExcluded
          ? 0
          : isLikelyBlank
            ? Math.max(0.9, 1 - textMaskDensity * 10)
          : overrideCode
            ? 1
            : textMatchedEntry
              ? Math.max(resolved.confidence, Math.min(0.98, 0.58 + textAssistCandidate.score))
              : resolved.confidence,
        voteBreakdown: overrideCode
          ? [
              {
                code: overrideCode,
                count: sampledPack.pixels.length,
                matchedRgb: matchedEntry?.rgb || resolved.matchedRgb,
                averageDistance: 0,
                ratio: 1,
              },
            ]
          : resolved.voteBreakdown,
        manualOverride: Boolean(overrideCode),
        excluded: isExcluded,
        textAssist: textAssistCandidate
          ? {
              code: textAssistCandidate.code,
              score: textAssistCandidate.score,
              applied: Boolean(textMatchedEntry),
            }
          : null,
        textMaskDensity,
        samplePoints: sampledPack.points,
      });
    }
  }

  const globalStats = buildStats(cells);
  const chunks = chunkCells(cells, gridWidth, gridHeight, 5);

  return {
    gridWidth,
    gridHeight,
    crop,
    originX,
    originY,
    baseCellWidth,
    baseCellHeight,
    cellWidth,
    cellHeight,
    cells,
    chunks,
    globalStats,
    unmatchedCount: cells.filter((cell) => cell.code === "UNSET").length,
  };
}
