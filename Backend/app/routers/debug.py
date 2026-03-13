# app/routers/debug.py

from fastapi import APIRouter, UploadFile, File
from fastapi.responses import Response

router = APIRouter()

@router.post("/debug/echo-image")
async def echo_image(image: UploadFile = File(...)):
    data = await image.read()

    return Response(
        content=data,
        media_type=image.content_type or "image/png"
    )