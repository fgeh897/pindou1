import io
import os
from typing import Any

os.environ.setdefault("PINDOU_DEPLOYMENT_MODE", "api_only")
os.environ.setdefault("PINDOU_OCR_ENGINE", "rapidocr")

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from PIL import Image

import pindou_server as server


app = FastAPI(title="Pindou OCR API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def load_rgb_image(content: bytes) -> Image.Image:
    if not content:
        raise HTTPException(status_code=400, detail="empty file")

    try:
        return Image.open(io.BytesIO(content)).convert("RGB")
    except Exception as exc:  # pragma: no cover
        raise HTTPException(status_code=400, detail=f"invalid image: {exc}") from exc


@app.get("/api/health")
async def health() -> dict[str, Any]:
    engine = server.get_ocr_engine()
    return {
        "ok": True,
        "ocrReady": engine is not None,
        "ocrError": server.OCR_ERROR,
    }


@app.post("/api/ocr/palette-card")
async def ocr_palette_card(file: UploadFile = File(...)) -> Any:
    image = load_rgb_image(await file.read())
    result = server.analyze_palette_card(image)
    if not result["recognizedEntries"] and result["ocrError"]:
        return JSONResponse(status_code=503, content=result)
    return result


@app.post("/api/ocr/manual-swatch")
async def ocr_manual_swatch(file: UploadFile = File(...)) -> Any:
    image = load_rgb_image(await file.read())
    result = server.analyze_manual_swatch(image)
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
    image = load_rgb_image(await file.read())
    result = server.analyze_palette_grid(
        image,
        {
            "x": int(round(x)),
            "y": int(round(y)),
            "width": int(round(width)),
            "height": int(round(height)),
        },
        rows,
        cols,
        gapXRatio,
        gapYRatio,
    )
    if not result["recognizedEntries"] and result["ocrError"]:
        return JSONResponse(status_code=503, content=result)
    return result
