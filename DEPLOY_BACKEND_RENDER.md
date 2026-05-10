# 拼豆 OCR 后端部署到 Render

当前这套 OCR 后端不适合继续放在 Vercel Function 里，原因有两个：

1. `RapidOCR` 在 Vercel 运行时缺少 `libxcb.so.1`
2. `PaddleOCR + PaddlePaddle` 总体积超过 Vercel Python Function 的 500 MB 临时存储限制

因此推荐把 OCR 后端单独部署到 Render 的 Docker Web Service。

## 已准备好的文件

- `ocr-backend.Dockerfile`
- `render.yaml`
- `requirements-ocr.txt`

## Render 部署步骤

1. 把当前项目推到 GitHub 仓库
2. 登录 Render
3. 选择 `New +` -> `Blueprint`
4. 连接这个 GitHub 仓库
5. Render 会自动识别根目录下的 `render.yaml`
6. 创建服务后等待首次部署完成
7. 成功后记下公网地址，例如：
   - `https://pindou-ocr-backend.onrender.com`

## 部署完成后要做的最后一步

把 Render 后端公网地址告诉前端，让公网网站改用这个 OCR 后端。

当前前端已经预留了这个接入口：

- `window.__PIN_DOU_OCR_API_BASE_URL__`

拿到 Render 地址后，把它写到 Vercel 公网前端里即可，例如：

- `https://pindou-ocr-backend.onrender.com`

这样前端会请求：

- `${OCR_API_BASE_URL}/api/ocr/palette-card`
- `${OCR_API_BASE_URL}/api/ocr/manual-swatch`
- `${OCR_API_BASE_URL}/api/ocr/palette-grid`
