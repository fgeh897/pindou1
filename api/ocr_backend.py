import os
from typing import Any

os.environ.setdefault("PINDOU_DEPLOYMENT_MODE", "api_only")
os.environ.setdefault("PINDOU_OCR_ENGINE", "rapidocr")

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pindou_server as server


app = FastAPI(title="Pindou OCR API")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def load_rgb_image(content: bytes) -> tuple[Any, float]:
    try:
        return server.load_rgb_image(content)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc


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
    image, _ = load_rgb_image(await file.read())
    result = server.analyze_palette_card(image)
    if not result["recognizedEntries"] and result["ocrError"]:
        return JSONResponse(status_code=503, content=result)
    return result


@app.post("/api/ocr/manual-swatch")
async def ocr_manual_swatch(file: UploadFile = File(...)) -> Any:
    image, _ = load_rgb_image(await file.read())
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
    image, scale = load_rgb_image(await file.read())
    result = server.analyze_palette_grid(
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
