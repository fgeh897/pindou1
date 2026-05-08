export function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

export function hexToRgb(hex) {
  const sanitized = hex.replace("#", "").trim();
  if (sanitized.length !== 6) {
    return [0, 0, 0];
  }

  return [
    Number.parseInt(sanitized.slice(0, 2), 16),
    Number.parseInt(sanitized.slice(2, 4), 16),
    Number.parseInt(sanitized.slice(4, 6), 16),
  ];
}

export function rgbToHex(rgb) {
  return `#${rgb.map((value) => clamp(value, 0, 255).toString(16).padStart(2, "0")).join("")}`;
}

export function parseRgbText(input) {
  const values = input
    .split(",")
    .map((part) => Number.parseInt(part.trim(), 10))
    .filter((value) => Number.isFinite(value));

  if (values.length !== 3) {
    return null;
  }

  return values.map((value) => clamp(value, 0, 255));
}

export function formatRgb(rgb) {
  return rgb.join(",");
}

export function getRgbDistance(sourceRgb, targetRgb) {
  const [sr, sg, sb] = sourceRgb;
  const [tr, tg, tb] = targetRgb;
  return Math.sqrt((sr - tr) ** 2 + (sg - tg) ** 2 + (sb - tb) ** 2);
}

function srgbToLinear(value) {
  const normalized = value / 255;
  if (normalized <= 0.04045) {
    return normalized / 12.92;
  }
  return ((normalized + 0.055) / 1.055) ** 2.4;
}

export function rgbToXyz(rgb) {
  const [r, g, b] = rgb.map(srgbToLinear);
  return [
    (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) * 100,
    (r * 0.2126729 + g * 0.7151522 + b * 0.072175) * 100,
    (r * 0.0193339 + g * 0.119192 + b * 0.9503041) * 100,
  ];
}

function xyzPivot(value) {
  const delta = 6 / 29;
  if (value > delta ** 3) {
    return Math.cbrt(value);
  }
  return value / (3 * delta ** 2) + 4 / 29;
}

export function rgbToLab(rgb) {
  const [x, y, z] = rgbToXyz(rgb);
  const refX = 95.047;
  const refY = 100;
  const refZ = 108.883;
  const fx = xyzPivot(x / refX);
  const fy = xyzPivot(y / refY);
  const fz = xyzPivot(z / refZ);
  return [
    116 * fy - 16,
    500 * (fx - fy),
    200 * (fy - fz),
  ];
}

export function deltaE76(leftLab, rightLab) {
  const [l1, a1, b1] = leftLab;
  const [l2, a2, b2] = rightLab;
  return Math.sqrt((l1 - l2) ** 2 + (a1 - a2) ** 2 + (b1 - b2) ** 2);
}

export function deltaE2000(leftLab, rightLab) {
  const [l1, a1, b1] = leftLab;
  const [l2, a2, b2] = rightLab;
  const avgLp = (l1 + l2) / 2;
  const c1 = Math.sqrt(a1 ** 2 + b1 ** 2);
  const c2 = Math.sqrt(a2 ** 2 + b2 ** 2);
  const avgC = (c1 + c2) / 2;
  const g = 0.5 * (1 - Math.sqrt((avgC ** 7) / (avgC ** 7 + 25 ** 7)));
  const a1p = (1 + g) * a1;
  const a2p = (1 + g) * a2;
  const c1p = Math.sqrt(a1p ** 2 + b1 ** 2);
  const c2p = Math.sqrt(a2p ** 2 + b2 ** 2);
  const avgCp = (c1p + c2p) / 2;

  const h1p = Math.atan2(b1, a1p) >= 0 ? Math.atan2(b1, a1p) : Math.atan2(b1, a1p) + 2 * Math.PI;
  const h2p = Math.atan2(b2, a2p) >= 0 ? Math.atan2(b2, a2p) : Math.atan2(b2, a2p) + 2 * Math.PI;

  const deltaLp = l2 - l1;
  const deltaCp = c2p - c1p;

  let deltaHp = 0;
  if (c1p * c2p !== 0) {
    if (Math.abs(h2p - h1p) <= Math.PI) {
      deltaHp = h2p - h1p;
    } else if (h2p <= h1p) {
      deltaHp = h2p - h1p + 2 * Math.PI;
    } else {
      deltaHp = h2p - h1p - 2 * Math.PI;
    }
  }

  const deltaBigHp = 2 * Math.sqrt(c1p * c2p) * Math.sin(deltaHp / 2);

  let avgHp = h1p + h2p;
  if (c1p * c2p === 0) {
    avgHp = h1p + h2p;
  } else if (Math.abs(h1p - h2p) > Math.PI) {
    avgHp = (h1p + h2p + 2 * Math.PI) / 2;
  } else {
    avgHp = (h1p + h2p) / 2;
  }

  const t =
    1 -
    0.17 * Math.cos(avgHp - Math.PI / 6) +
    0.24 * Math.cos(2 * avgHp) +
    0.32 * Math.cos(3 * avgHp + Math.PI / 30) -
    0.2 * Math.cos(4 * avgHp - (63 * Math.PI) / 180);

  const deltaTheta = ((30 * Math.PI) / 180) * Math.exp(-((((avgHp * 180) / Math.PI - 275) / 25) ** 2));
  const rc = 2 * Math.sqrt((avgCp ** 7) / (avgCp ** 7 + 25 ** 7));
  const sl = 1 + (0.015 * (avgLp - 50) ** 2) / Math.sqrt(20 + (avgLp - 50) ** 2);
  const sc = 1 + 0.045 * avgCp;
  const sh = 1 + 0.015 * avgCp * t;
  const rt = -Math.sin(2 * deltaTheta) * rc;

  return Math.sqrt(
    (deltaLp / sl) ** 2 +
      (deltaCp / sc) ** 2 +
      (deltaBigHp / sh) ** 2 +
      rt * (deltaCp / sc) * (deltaBigHp / sh),
  );
}

export function getPerceptualDistance(sourceRgb, targetRgb) {
  return deltaE2000(rgbToLab(sourceRgb), rgbToLab(targetRgb));
}

export function matchNearestColor(sampleRgb, palette) {
  if (!palette.length) {
    return null;
  }

  let bestMatch = null;
  const sampleLab = rgbToLab(sampleRgb);

  for (const entry of palette) {
    const entryLab = entry.lab || rgbToLab(entry.rgb);
    if (!entry.lab) {
      entry.lab = entryLab;
    }
    const distance = deltaE2000(sampleLab, entryLab);
    if (!bestMatch || distance < bestMatch.distance) {
      bestMatch = {
        code: entry.code,
        rgb: entry.rgb,
        lab: entryLab,
        distance,
      };
    }
  }

  return bestMatch;
}

export function getReadableTextColor(rgb) {
  const luminance = (0.299 * rgb[0] + 0.587 * rgb[1] + 0.114 * rgb[2]) / 255;
  return luminance > 0.62 ? "#1e1712" : "#fff9f0";
}
