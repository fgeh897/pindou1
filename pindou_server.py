from __future__ import annotations

import argparse
import importlib
import io
import json
import math
import os
import re
import tempfile
from pathlib import Path
from typing import Any

import numpy as np
from PIL import Image, ImageOps

ROOT = Path(__file__).resolve().parent
DEPLOYMENT_MODE = os.environ.get("PINDOU_DEPLOYMENT_MODE", "full").strip().lower()
OCR_ENGINE_PREFERENCE = os.environ.get("PINDOU_OCR_ENGINE", "auto").strip().lower()
if os.environ.get("PINDOU_CACHE_DIR"):
    LOCAL_CACHE_DIR = Path(os.environ["PINDOU_CACHE_DIR"])
elif os.environ.get("VERCEL"):
    LOCAL_CACHE_DIR = Path(tempfile.gettempdir()) / "pindou-cache"
else:
    LOCAL_CACHE_DIR = ROOT / ".paddle-cache"
LOCAL_CACHE_DIR.mkdir(parents=True, exist_ok=True)
STATE_FILE = Path(os.environ.get("PINDOU_STATE_FILE", str(ROOT / "pindou-persist-state.json")))
drive, tail = os.path.splitdrive(str(LOCAL_CACHE_DIR))
os.environ["HOME"] = str(LOCAL_CACHE_DIR)
os.environ["USERPROFILE"] = str(LOCAL_CACHE_DIR)
os.environ["HOMEDRIVE"] = drive or str(ROOT.drive)
os.environ["HOMEPATH"] = tail or "\\"
os.environ["PADDLE_HOME"] = str(LOCAL_CACHE_DIR / "paddle")
os.environ["XDG_CACHE_HOME"] = str(LOCAL_CACHE_DIR)
os.environ["PPNLP_HOME"] = str(LOCAL_CACHE_DIR / "ppnlp")
os.environ["DATA_HOME"] = str(LOCAL_CACHE_DIR / "dataset")

try:
    from fastapi import FastAPI, File, Form, HTTPException, UploadFile
    from fastapi.middleware.cors import CORSMiddleware
    from fastapi.responses import FileResponse, JSONResponse
    from fastapi.staticfiles import StaticFiles
except ImportError:  # pragma: no cover - runtime dependency
    FastAPI = None
    UploadFile = None
    File = None
    Form = None
    HTTPException = RuntimeError
    CORSMiddleware = None
    FileResponse = None
    JSONResponse = None
    StaticFiles = None

OCR_CODE_RE = re.compile(r"([A-Z])\s*([0-9]{1,2})")
OCR_ENGINE: Any = None
OCR_ERROR: str | None = None
OCR_ENGINE_NAME = "unavailable"
MAX_OCR_IMAGE_EDGE = max(1200, int(os.environ.get("PINDOU_OCR_MAX_EDGE", "2400")))
MAX_OCR_IMAGE_PIXELS = max(1_000_000, int(os.environ.get("PINDOU_OCR_MAX_PIXELS", "5000000")))


def read_persisted_state() -> dict[str, Any]:
    if not STATE_FILE.exists():
        return {}

    try:
        return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except Exception:
        return {}


def write_persisted_state(payload: dict[str, Any]) -> None:
    temp_file = STATE_FILE.with_suffix(".tmp")
    temp_file.write_text(
        json.dumps(payload, ensure_ascii=False, separators=(",", ":")),
        encoding="utf-8",
    )
    temp_file.replace(STATE_FILE)


def get_ocr_engine() -> Any:
    global OCR_ENGINE, OCR_ERROR, OCR_ENGINE_NAME
    if OCR_ENGINE is not None:
        return OCR_ENGINE
    errors: list[str] = []

    preferred_order: list[str]
    if OCR_ENGINE_PREFERENCE == "rapidocr":
        preferred_order = ["rapidocr"]
    elif OCR_ENGINE_PREFERENCE == "paddleocr" or OCR_ENGINE_PREFERENCE == "paddle":
        preferred_order = ["paddleocr"]
    else:
        preferred_order = ["rapidocr", "paddleocr"]

    for engine_name in preferred_order:
        if engine_name == "rapidocr":
            try:
                rapid_module = importlib.import_module("rapidocr_onnxruntime")
                OCR_ENGINE = ("rapidocr", rapid_module.RapidOCR())
                OCR_ENGINE_NAME = "rapidocr"
                OCR_ERROR = None
                return OCR_ENGINE
            except Exception as error:  # pragma: no cover - runtime dependency
                errors.append(f"RapidOCR 初始化失败: {error}")
            continue

        try:
            paddle_module = importlib.import_module("paddleocr")
            OCR_ENGINE = (
                "paddleocr",
                paddle_module.PaddleOCR(
                    use_angle_cls=False,
                    lang="en",
                    show_log=False,
                    det=True,
                    rec=True,
                    cls=False,
                ),
            )
            OCR_ENGINE_NAME = "paddleocr"
            OCR_ERROR = None
            return OCR_ENGINE
        except Exception as error:  # pragma: no cover - runtime dependency
            errors.append(f"PaddleOCR 初始化失败: {error}")

    OCR_ENGINE_NAME = "unavailable"
    OCR_ERROR = "；".join(errors) if errors else "没有可用的 OCR 引擎。"
    return None


def pil_to_array(image: Image.Image) -> np.ndarray:
    if image.mode != "RGB":
        image = image.convert("RGB")
    return np.asarray(image)


def load_rgb_image(content: bytes) -> tuple[Image.Image, float]:
    if not content:
        raise ValueError("empty file")

    try:
        image = Image.open(io.BytesIO(content))
        image = ImageOps.exif_transpose(image)
        if image.mode != "RGB":
            image = image.convert("RGB")
    except Exception as exc:  # pragma: no cover
        raise ValueError(f"invalid image: {exc}") from exc

    width, height = image.size
    longest_edge = max(width, height)
    total_pixels = width * height
    edge_scale = min(1.0, MAX_OCR_IMAGE_EDGE / longest_edge) if longest_edge else 1.0
    pixel_scale = min(1.0, math.sqrt(MAX_OCR_IMAGE_PIXELS / total_pixels)) if total_pixels else 1.0
    scale = min(edge_scale, pixel_scale)

    if scale >= 0.999:
        return image, 1.0

    resized = image.resize(
        (
            max(1, int(round(width * scale))),
            max(1, int(round(height * scale))),
        ),
        Image.Resampling.LANCZOS,
    )
    return resized, scale


def is_swatch_pixel(rgb: np.ndarray) -> np.ndarray:
    brightness = rgb.mean(axis=2)
    spread = rgb.max(axis=2) - rgb.min(axis=2)
    return (brightness < 246) & ((spread > 12) | (brightness < 220))


def extract_swatch_boxes(rgb: np.ndarray, step: int = 3) -> list[dict[str, int]]:
    height, width, _ = rgb.shape
    grid_h = (height + step - 1) // step
    grid_w = (width + step - 1) // step
    sample = rgb[::step, ::step]
    mask = is_swatch_pixel(sample)
    visited = np.zeros_like(mask, dtype=bool)
    boxes: list[dict[str, int]] = []
    min_cells = max(18, (grid_w * grid_h) // 800)

    for row in range(grid_h):
        for col in range(grid_w):
            if not mask[row, col] or visited[row, col]:
                continue

            queue = [(col, row)]
            visited[row, col] = True
            count = 0
            min_col = max_col = col
            min_row = max_row = row

            while queue:
                current_col, current_row = queue.pop()
                count += 1
                min_col = min(min_col, current_col)
                max_col = max(max_col, current_col)
                min_row = min(min_row, current_row)
                max_row = max(max_row, current_row)

                for next_col, next_row in (
                    (current_col - 1, current_row),
                    (current_col + 1, current_row),
                    (current_col, current_row - 1),
                    (current_col, current_row + 1),
                ):
                    if next_col < 0 or next_row < 0 or next_col >= grid_w or next_row >= grid_h:
                        continue
                    if visited[next_row, next_col] or not mask[next_row, next_col]:
                        continue
                    visited[next_row, next_col] = True
                    queue.append((next_col, next_row))

            box_width = (max_col - min_col + 1) * step
            box_height = (max_row - min_row + 1) * step
            if count < min_cells or box_width < 36 or box_height < 20:
                continue

            boxes.append(
                {
                    "x": min_col * step,
                    "y": min_row * step,
                    "width": min(width - min_col * step, box_width),
                    "height": min(height - min_row * step, box_height),
                }
            )

    return sorted(
        boxes,
        key=lambda item: (round(item["y"] / 18), item["x"], item["y"]),
    )


def sample_swatch_rgb(rgb: np.ndarray, box: dict[str, int]) -> list[int]:
    height, width, _ = rgb.shape
    margin_x = max(2, round(box["width"] * 0.1))
    margin_y = max(2, round(box["height"] * 0.14))
    points = [
        (box["x"] + margin_x, box["y"] + margin_y),
        (box["x"] + box["width"] // 2, box["y"] + margin_y),
        (box["x"] + box["width"] - margin_x, box["y"] + margin_y),
        (box["x"] + margin_x, box["y"] + box["height"] - margin_y),
        (box["x"] + box["width"] // 2, box["y"] + box["height"] - margin_y),
        (box["x"] + box["width"] - margin_x, box["y"] + box["height"] - margin_y),
        (box["x"] + margin_x, box["y"] + box["height"] // 2),
        (box["x"] + box["width"] - margin_x, box["y"] + box["height"] // 2),
    ]
    patch_radius = max(1, round(min(box["width"], box["height"]) * 0.035))
    patch_medians: list[np.ndarray] = []
    for x, y in points:
        left = max(0, min(width - 1, int(round(x))))
        top = max(0, min(height - 1, int(round(y))))
        patch = rgb[
            max(0, top - patch_radius) : min(height, top + patch_radius + 1),
            max(0, left - patch_radius) : min(width, left + patch_radius + 1),
        ]
        if patch.size == 0:
            continue
        patch_medians.append(np.median(patch.reshape(-1, 3), axis=0))

    if not patch_medians:
        return [0, 0, 0]

    if len(patch_medians) == 1:
        winner = patch_medians[0]
    else:
        stacked = np.vstack(patch_medians)
        channel_median = np.median(stacked, axis=0)
        scores: list[tuple[float, float, np.ndarray]] = []
        for candidate in patch_medians:
            deltas = stacked - candidate
            cohesion = float(np.linalg.norm(deltas, axis=1).sum())
            median_distance = float(np.linalg.norm(candidate - channel_median))
            scores.append((cohesion, median_distance, candidate))
        scores.sort(key=lambda item: (item[0], item[1]))
        winner = scores[0][2]

    return [int(round(value)) for value in winner.tolist()]


def score_manual_swatch_box(rgb: np.ndarray, box: dict[str, int]) -> float:
    height, width, _ = rgb.shape
    x = max(0, min(width - 1, int(box["x"])))
    y = max(0, min(height - 1, int(box["y"])))
    w = max(2, min(width - x, int(box["width"])))
    h = max(2, min(height - y, int(box["height"])))
    region = rgb[y : y + h, x : x + w]
    mask = is_swatch_pixel(region)
    active = int(mask.sum())
    total = max(1, w * h)
    density = active / total
    area = w * h
    left_bias = 1 - (x + w / 2) / max(1, width)
    return density * area * (0.75 + left_bias * 0.35)


def detect_best_manual_swatch_box(rgb: np.ndarray) -> dict[str, int]:
    height, width, _ = rgb.shape
    boxes = extract_swatch_boxes(rgb, step=2)
    if not boxes:
        return {"x": 0, "y": 0, "width": width, "height": height}

    best = sorted(
        ((box, score_manual_swatch_box(rgb, box)) for box in boxes),
        key=lambda item: item[1],
        reverse=True,
    )[0][0]
    return clamp_box(best, width, height)


def polygon_to_rect(polygon: Any) -> dict[str, int]:
    xs = [point[0] for point in polygon]
    ys = [point[1] for point in polygon]
    min_x = int(round(min(xs)))
    min_y = int(round(min(ys)))
    max_x = int(round(max(xs)))
    max_y = int(round(max(ys)))
    return {
        "x": min_x,
        "y": min_y,
        "width": max(1, max_x - min_x),
        "height": max(1, max_y - min_y),
    }


def clamp_box(box: dict[str, int], image_width: int, image_height: int) -> dict[str, int]:
    x = max(0, min(image_width - 1, int(box["x"])))
    y = max(0, min(image_height - 1, int(box["y"])))
    width = max(1, int(box["width"]))
    height = max(1, int(box["height"]))
    width = min(width, image_width - x)
    height = min(height, image_height - y)
    return {"x": x, "y": y, "width": width, "height": height}


def rect_center(rect: dict[str, int]) -> tuple[float, float]:
    return rect["x"] + rect["width"] / 2, rect["y"] + rect["height"] / 2


def rect_contains_point(rect: dict[str, int], x: float, y: float) -> bool:
    return rect["x"] <= x <= rect["x"] + rect["width"] and rect["y"] <= y <= rect["y"] + rect["height"]


def rect_intersection_area(left: dict[str, int], right: dict[str, int]) -> int:
    x1 = max(left["x"], right["x"])
    y1 = max(left["y"], right["y"])
    x2 = min(left["x"] + left["width"], right["x"] + right["width"])
    y2 = min(left["y"] + left["height"], right["y"] + right["height"])
    if x2 <= x1 or y2 <= y1:
        return 0
    return (x2 - x1) * (y2 - y1)


def crop_text_region(image: Image.Image, box: dict[str, int]) -> Image.Image:
    left = int(max(0, box["x"] + box["width"] * 0.04))
    top = int(max(0, box["y"] + box["height"] * 0.08))
    right = int(min(image.width, box["x"] + box["width"] * 0.58))
    bottom = int(min(image.height, box["y"] + box["height"] * 0.78))
    region = image.crop((left, top, right, bottom))
    return region.resize((region.width * 3, region.height * 3), Image.Resampling.LANCZOS)


def normalize_code_text(text: str) -> str:
    compact = re.sub(r"[^A-Za-z0-9]", "", text).upper()
    if not compact:
        return ""

    compact = compact.replace("O", "0") if compact[:1].isdigit() else compact
    match = OCR_CODE_RE.search(compact)
    if not match:
        return ""

    prefix = match.group(1)
    digits = match.group(2)
    return f"{prefix}{digits}"


def extract_texts_from_paddle_result(result: Any) -> list[tuple[str, float]]:
    texts: list[tuple[str, float]] = []

    def walk(value: Any) -> None:
        if isinstance(value, tuple) and len(value) == 2 and isinstance(value[0], str):
            texts.append((value[0], float(value[1]) if isinstance(value[1], (int, float)) else 0.0))
            return
        if isinstance(value, list):
            for item in value:
                walk(item)

    walk(result)
    return texts


def extract_texts_from_rapid_result(result: Any) -> list[tuple[str, float]]:
    texts: list[tuple[str, float]] = []
    if not result:
        return texts

    for item in result:
        if isinstance(item, (list, tuple)) and len(item) >= 3 and isinstance(item[1], str):
            score = item[2] if isinstance(item[2], (int, float)) else 0.0
            texts.append((item[1], float(score)))
    return texts


def extract_ocr_lines(image: Image.Image) -> list[dict[str, Any]]:
    engine_pack = get_ocr_engine()
    if engine_pack is None:
        return []

    engine_name, engine = engine_pack
    source = pil_to_array(image)
    lines: list[dict[str, Any]] = []

    if engine_name == "rapidocr":
        result, _ = engine(source)
        iterable = result or []
        for item in iterable:
            if not isinstance(item, (list, tuple)) or len(item) < 3:
                continue
            polygon, text, score = item[0], item[1], item[2]
            if not isinstance(text, str):
                continue
            lines.append(
                {
                    "text": text,
                    "score": float(score) if isinstance(score, (int, float)) else 0.0,
                    "polygon": polygon,
                    "rect": polygon_to_rect(polygon),
                }
            )
        return lines

    result = engine.ocr(source, cls=False)
    for page in result or []:
        for item in page or []:
            if not isinstance(item, (list, tuple)) or len(item) < 2:
                continue
            polygon = item[0]
            text_pack = item[1]
            if not isinstance(text_pack, (list, tuple)) or len(text_pack) < 1:
                continue
            text = text_pack[0]
            score = text_pack[1] if len(text_pack) > 1 else 0.0
            if not isinstance(text, str):
                continue
            lines.append(
                {
                    "text": text,
                    "score": float(score) if isinstance(score, (int, float)) else 0.0,
                    "polygon": polygon,
                    "rect": polygon_to_rect(polygon),
                }
            )
    return lines


def recognize_box_code(image: Image.Image, box: dict[str, int]) -> tuple[str, float]:
    engine_pack = get_ocr_engine()
    if engine_pack is None:
        return "", 0.0

    region = crop_text_region(image, box)
    region_array = pil_to_array(region)
    engine_name, engine = engine_pack
    if engine_name == "rapidocr":
        result, _ = engine(region_array)
        extracted = extract_texts_from_rapid_result(result)
    else:
        result = engine.ocr(region_array, cls=False)
        extracted = extract_texts_from_paddle_result(result)
    best_code = ""
    best_score = 0.0
    for text, score in extracted:
        normalized = normalize_code_text(text)
        if not normalized:
            continue
        if score > best_score:
            best_code = normalized
            best_score = score
    return best_code, best_score


def build_code_entries_from_ocr(ocr_lines: list[dict[str, Any]]) -> list[dict[str, Any]]:
    entries: list[dict[str, Any]] = []
    for item in ocr_lines:
        code = normalize_code_text(item["text"])
        if not code:
            continue
        entries.append(
            {
                "code": code,
                "score": float(item["score"]),
                "rect": item["rect"],
                "text": item["text"],
            }
        )
    return entries


def group_code_rows(code_entries: list[dict[str, Any]]) -> list[list[dict[str, Any]]]:
    if not code_entries:
        return []

    sorted_entries = sorted(code_entries, key=lambda item: (item["rect"]["y"], item["rect"]["x"]))
    heights = [item["rect"]["height"] for item in sorted_entries]
    median_height = float(np.median(np.asarray(heights, dtype=float))) if heights else 20.0
    threshold = max(18.0, median_height * 1.25)
    rows: list[list[dict[str, Any]]] = []
    row_centers: list[float] = []

    for entry in sorted_entries:
        _, center_y = rect_center(entry["rect"])
        target_index = -1
        for index, row_center in enumerate(row_centers):
            if abs(center_y - row_center) <= threshold:
                target_index = index
                break
        if target_index < 0:
            rows.append([entry])
            row_centers.append(center_y)
        else:
            rows[target_index].append(entry)
            centers = [rect_center(item["rect"])[1] for item in rows[target_index]]
            row_centers[target_index] = float(sum(centers) / len(centers))

    for row in rows:
        row.sort(key=lambda item: item["rect"]["x"])
    return rows


def find_candidate_box_for_code(
    code_rect: dict[str, int],
    candidate_boxes: list[dict[str, int]],
    used_indexes: set[int],
) -> dict[str, int] | None:
    center_x, center_y = rect_center(code_rect)
    best_index = -1
    best_score = -1.0

    for index, candidate in enumerate(candidate_boxes):
        if index in used_indexes:
            continue
        contains = rect_contains_point(candidate, center_x, center_y)
        overlap = rect_intersection_area(candidate, code_rect)
        if not contains and overlap <= 0:
            continue
        score = (2.0 if contains else 0.0) + overlap / max(1, code_rect["width"] * code_rect["height"])
        if score > best_score:
            best_index = index
            best_score = score

    if best_index < 0:
        return None

    used_indexes.add(best_index)
    return candidate_boxes[best_index]


def estimate_boxes_from_code_rows(
    rows: list[list[dict[str, Any]]],
    image_width: int,
    image_height: int,
    candidate_boxes: list[dict[str, int]],
) -> list[dict[str, Any]]:
    candidate_widths = [box["width"] for box in candidate_boxes]
    candidate_heights = [box["height"] for box in candidate_boxes]
    fallback_width = int(round(float(np.median(np.asarray(candidate_widths, dtype=float))))) if candidate_widths else 188
    fallback_height = int(round(float(np.median(np.asarray(candidate_heights, dtype=float))))) if candidate_heights else 44
    if fallback_width < 120:
        fallback_width = 188
    if fallback_height < 30:
        fallback_height = 44

    detections: list[dict[str, Any]] = []
    used_candidate_indexes: set[int] = set()

    for row in rows:
        if not row:
            continue

        row_heights = [item["rect"]["height"] for item in row]
        row_height = int(round(float(np.median(np.asarray(row_heights, dtype=float))) * 2.2)) if row_heights else fallback_height
        row_height = max(32, row_height)
        row_center = float(sum(rect_center(item["rect"])[1] for item in row) / len(row))
        estimated_widths: list[int] = []

        for index, entry in enumerate(row[:-1]):
            left = int(round(entry["rect"]["x"] - 4))
            next_left = row[index + 1]["rect"]["x"]
            estimated_widths.append(max(90, int(round(next_left - left - 8))))

        row_width = int(round(float(np.median(np.asarray(estimated_widths, dtype=float))))) if estimated_widths else fallback_width
        row_width = max(120, row_width)

        for index, entry in enumerate(row):
            matched_box = find_candidate_box_for_code(entry["rect"], candidate_boxes, used_candidate_indexes)
            if matched_box is not None:
                detections.append(
                    {
                        "code": entry["code"],
                        "score": entry["score"],
                        "box": clamp_box(matched_box, image_width, image_height),
                    }
                )
                continue

            left = int(round(entry["rect"]["x"] - 4))
            if index < len(row) - 1:
                next_left = row[index + 1]["rect"]["x"]
                right = int(round(next_left - 8))
            else:
                right = left + row_width

            top = int(round(row_center - row_height / 2))
            estimated_box = clamp_box(
                {
                    "x": left,
                    "y": top,
                    "width": max(1, right - left),
                    "height": row_height,
                },
                image_width,
                image_height,
            )
            detections.append(
                {
                    "code": entry["code"],
                    "score": entry["score"],
                    "box": estimated_box,
                }
            )

    return detections


def analyze_palette_card(image: Image.Image) -> dict[str, Any]:
    rgb = pil_to_array(image)
    boxes = extract_swatch_boxes(rgb)
    ocr_lines = extract_ocr_lines(image)
    code_entries = build_code_entries_from_ocr(ocr_lines)
    estimated_detections = estimate_boxes_from_code_rows(group_code_rows(code_entries), image.width, image.height, boxes)
    detections: list[dict[str, Any]] = []
    recognized_by_code: dict[str, dict[str, Any]] = {}

    if not estimated_detections:
        for index, box in enumerate(boxes, start=1):
            swatch_rgb = sample_swatch_rgb(rgb, box)
            code, score = recognize_box_code(image, box)
            item = {
                "swatchIndex": index,
                "box": box,
                "rgb": swatch_rgb,
                "code": code,
                "score": round(score, 4),
            }
            detections.append(item)
            if code:
                existing = recognized_by_code.get(code)
                if existing is None or item["score"] > existing["score"]:
                    recognized_by_code[code] = {
                        "code": code,
                        "rgb": swatch_rgb,
                        "standardRgb": swatch_rgb,
                        "score": item["score"],
                    }

        return {
            "engine": OCR_ENGINE_NAME,
            "ocrError": OCR_ERROR,
            "swatchCount": len(detections),
            "detections": detections,
            "recognizedEntries": sorted(recognized_by_code.values(), key=lambda item: item["code"]),
        }

    for index, detected in enumerate(estimated_detections, start=1):
        box = detected["box"]
        swatch_rgb = sample_swatch_rgb(rgb, box)
        code = detected["code"]
        score = detected["score"]
        item = {
            "swatchIndex": index,
            "box": box,
            "rgb": swatch_rgb,
            "code": code,
            "score": round(score, 4),
        }
        detections.append(item)
        if code:
            existing = recognized_by_code.get(code)
            if existing is None or item["score"] > existing["score"]:
                recognized_by_code[code] = {
                    "code": code,
                    "rgb": swatch_rgb,
                    "standardRgb": swatch_rgb,
                    "score": item["score"],
                }

    return {
        "engine": OCR_ENGINE_NAME,
        "ocrError": OCR_ERROR,
        "swatchCount": len(detections),
        "detections": detections,
        "recognizedEntries": sorted(recognized_by_code.values(), key=lambda item: item["code"]),
    }


def analyze_manual_swatch(image: Image.Image) -> dict[str, Any]:
    rgb = pil_to_array(image)
    box = detect_best_manual_swatch_box(rgb)
    swatch_rgb = sample_swatch_rgb(rgb, box)
    code, score = recognize_box_code(image, box)
    return {
        "engine": OCR_ENGINE_NAME,
        "ocrError": OCR_ERROR,
        "box": box,
        "rgb": swatch_rgb,
        "code": code,
        "score": round(float(score), 4),
    }


def analyze_palette_grid(
    image: Image.Image,
    grid_rect: dict[str, int],
    rows: int,
    cols: int,
    gap_x_ratio: float = 0.12,
    gap_y_ratio: float = 0.12,
) -> dict[str, Any]:
    rgb = pil_to_array(image)
    safe_rect = clamp_box(grid_rect, image.width, image.height)
    rows = max(1, min(30, int(rows)))
    cols = max(1, min(30, int(cols)))
    gap_x_ratio = max(0.0, min(0.48, float(gap_x_ratio)))
    gap_y_ratio = max(0.0, min(0.48, float(gap_y_ratio)))
    detections: list[dict[str, Any]] = []
    recognized_by_code: dict[str, dict[str, Any]] = {}

    for row in range(rows):
        top = safe_rect["y"] + round((safe_rect["height"] * row) / rows)
        bottom = safe_rect["y"] + round((safe_rect["height"] * (row + 1)) / rows)
        for col in range(cols):
            left = safe_rect["x"] + round((safe_rect["width"] * col) / cols)
            right = safe_rect["x"] + round((safe_rect["width"] * (col + 1)) / cols)
            outer_box = clamp_box(
                {
                    "x": left,
                    "y": top,
                    "width": max(1, right - left),
                    "height": max(1, bottom - top),
                },
                image.width,
                image.height,
            )
            inset_x = round(outer_box["width"] * gap_x_ratio * 0.5)
            inset_y = round(outer_box["height"] * gap_y_ratio * 0.5)
            cell_box = clamp_box(
                {
                    "x": outer_box["x"] + inset_x,
                    "y": outer_box["y"] + inset_y,
                    "width": max(6, outer_box["width"] - inset_x * 2),
                    "height": max(6, outer_box["height"] - inset_y * 2),
                },
                image.width,
                image.height,
            )
            cell_image = image.crop(
                (
                    cell_box["x"],
                    cell_box["y"],
                    cell_box["x"] + cell_box["width"],
                    cell_box["y"] + cell_box["height"],
                )
            )
            cell_rgb = pil_to_array(cell_image)
            local_sample_box = detect_best_manual_swatch_box(cell_rgb)
            swatch_rgb = sample_swatch_rgb(cell_rgb, local_sample_box)
            code_box = {
                "x": 0,
                "y": 0,
                "width": cell_image.width,
                "height": max(1, round(cell_image.height * 0.76)),
            }
            code, score = recognize_box_code(cell_image, code_box)
            sample_box = {
                "x": cell_box["x"] + local_sample_box["x"],
                "y": cell_box["y"] + local_sample_box["y"],
                "width": local_sample_box["width"],
                "height": local_sample_box["height"],
            }
            item = {
                "swatchIndex": len(detections) + 1,
                "box": cell_box,
                "sampleBox": sample_box,
                "rgb": swatch_rgb,
                "code": code,
                "score": round(float(score), 4),
                "gridRow": row,
                "gridCol": col,
            }
            detections.append(item)
            if code:
                existing = recognized_by_code.get(code)
                if existing is None or item["score"] > existing["score"]:
                    recognized_by_code[code] = {
                        "code": code,
                        "rgb": swatch_rgb,
                        "standardRgb": swatch_rgb,
                        "score": item["score"],
                    }

    return {
        "engine": OCR_ENGINE_NAME,
        "ocrError": OCR_ERROR,
        "grid": {
            "rows": rows,
            "cols": cols,
            "gapXRatio": gap_x_ratio,
            "gapYRatio": gap_y_ratio,
            "rect": safe_rect,
        },
        "swatchCount": len(detections),
        "detections": detections,
        "recognizedEntries": sorted(recognized_by_code.values(), key=lambda item: item["code"]),
    }


def build_app() -> Any:
    if FastAPI is None:
        return None

    app = FastAPI(title="Pindou OCR Server")
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=False,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/api/health")
    async def health() -> dict[str, Any]:
        engine = get_ocr_engine()
        return {
            "ok": True,
            "engine": OCR_ENGINE_NAME,
            "ocrReady": engine is not None,
            "ocrError": OCR_ERROR,
        }

    @app.get("/api/state")
    async def get_persisted_state() -> dict[str, Any]:
        payload = read_persisted_state()
        return {
            "ok": True,
            "state": payload or None,
        }

    @app.put("/api/state")
    async def put_persisted_state(payload: dict[str, Any]) -> dict[str, Any]:
        if not isinstance(payload, dict):
            raise HTTPException(status_code=400, detail="state payload must be an object")

        write_persisted_state(payload)
        return {
            "ok": True,
            "saved": True,
        }

    @app.post("/api/ocr/palette-card")
    async def ocr_palette_card(file: UploadFile = File(...)) -> Any:
        content = await file.read()
        try:
            image, _ = load_rgb_image(content)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

        result = analyze_palette_card(image)
        if not result["recognizedEntries"] and result["ocrError"]:
            return JSONResponse(status_code=503, content=result)
        return result

    @app.post("/api/ocr/manual-swatch")
    async def ocr_manual_swatch(file: UploadFile = File(...)) -> Any:
        content = await file.read()
        try:
            image, _ = load_rgb_image(content)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

        result = analyze_manual_swatch(image)
        if not result["code"] and result["ocrError"]:
            return JSONResponse(status_code=503, content=result)
        return result

    @app.post("/api/ocr/palette-grid")
    async def ocr_palette_grid(
        file: UploadFile = File(...),
        rows: int = Form(...),
        cols: int = Form(...),
        gapXRatio: float = Form(0.12),
        gapYRatio: float = Form(0.12),
        x: float = Form(...),
        y: float = Form(...),
        width: float = Form(...),
        height: float = Form(...),
    ) -> Any:
        content = await file.read()
        try:
            image, scale = load_rgb_image(content)
        except ValueError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc

        result = analyze_palette_grid(
            image,
            {
                "x": int(round(x * scale)),
                "y": int(round(y * scale)),
                "width": int(round(width * scale)),
                "height": int(round(height * scale)),
            },
            rows,
            cols,
            gapXRatio,
            gapYRatio,
        )
        if not result["recognizedEntries"] and result["ocrError"]:
            return JSONResponse(status_code=503, content=result)
        return result

    @app.get("/")
    async def root() -> Any:
        return FileResponse(ROOT / "index-local-browser.html")

    if DEPLOYMENT_MODE != "api_only":
        app.mount("/", StaticFiles(directory=str(ROOT), html=True), name="static")
    return app


app = build_app()


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--host", default="0.0.0.0")
    parser.add_argument("--port", default=int(os.environ.get("PINDOU_PORT", "8123")), type=int)
    args = parser.parse_args()

    if FastAPI is None:
        print("缺少 FastAPI / Uvicorn 依赖。")
        print("请先安装 requirements-ocr.txt 里的依赖后再启动。")
        return 1

    import uvicorn  # imported lazily so file stays importable without dependency

    uvicorn.run("pindou_server:app", host=args.host, port=args.port, reload=False)
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
