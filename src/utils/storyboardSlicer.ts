/**
 * Smart 2x2 Storyboard Auto-Slicer
 * Takes a single generated 4-panel 2x2 comic sheet and automatically trims outer borders
 * and inner comic gutter lines, returning 4 clean full-bleed PNG Blobs in story order:
 * [0] Top-Left (Act I), [1] Top-Right (Act I->II), [2] Bottom-Left (Act II), [3] Bottom-Right (Act III).
 */

function isRowUniformBorder(
  data: Uint8ClampedArray,
  width: number,
  y: number
): boolean {
  const rowOffset = y * width * 4;
  // Sample 32 points across the row
  const step = Math.max(1, Math.floor(width / 32));
  let minL = 255;
  let maxL = 0;
  let sumL = 0;
  let count = 0;

  for (let x = 0; x < width; x += step) {
    const idx = rowOffset + x * 4;
    const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    if (lum < minL) minL = lum;
    if (lum > maxL) maxL = lum;
    sumL += lum;
    count++;
  }

  const avgL = sumL / Math.max(1, count);
  const spread = maxL - minL;
  // Detect near-solid white or near-solid black/dark gutter stripes
  return spread < 26 && (avgL < 34 || avgL > 224);
}

function isColUniformBorder(
  data: Uint8ClampedArray,
  width: number,
  height: number,
  x: number
): boolean {
  const step = Math.max(1, Math.floor(height / 32));
  let minL = 255;
  let maxL = 0;
  let sumL = 0;
  let count = 0;

  for (let y = 0; y < height; y += step) {
    const idx = (y * width + x) * 4;
    const lum = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2];
    if (lum < minL) minL = lum;
    if (lum > maxL) maxL = lum;
    sumL += lum;
    count++;
  }

  const avgL = sumL / Math.max(1, count);
  const spread = maxL - minL;
  return spread < 26 && (avgL < 34 || avgL > 224);
}

function loadImageFromFile(file: Blob): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };
    img.onerror = (err) => {
      URL.revokeObjectURL(url);
      reject(err);
    };
    img.src = url;
  });
}

function canvasToCompactJpegBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error('Failed to encode sliced panel JPEG'));
      },
      'image/jpeg',
      0.88
    );
  });
}

export async function slice2x2StoryboardInto4Shots(
  file: Blob
): Promise<[Blob, Blob, Blob, Blob]> {
  const img = await loadImageFromFile(file);
  const W = img.naturalWidth || img.width;
  const H = img.naturalHeight || img.height;

  const fullCanvas = document.createElement('canvas');
  fullCanvas.width = W;
  fullCanvas.height = H;
  const fullCtx = fullCanvas.getContext('2d');
  if (!fullCtx) throw new Error('Canvas 2D context unavailable');
  fullCtx.drawImage(img, 0, 0, W, H);

  const imgData = fullCtx.getImageData(0, 0, W, H).data;

  // 1. Trim outer solid borders (up to 8% from each edge)
  const maxOuterX = Math.floor(W * 0.08);
  const maxOuterY = Math.floor(H * 0.08);

  let left = 0;
  while (left < maxOuterX && isColUniformBorder(imgData, W, H, left)) left++;
  let right = W - 1;
  while (right > W - 1 - maxOuterX && isColUniformBorder(imgData, W, H, right)) right--;
  let top = 0;
  while (top < maxOuterY && isRowUniformBorder(imgData, W, top)) top++;
  let bottom = H - 1;
  while (bottom > H - 1 - maxOuterY && isRowUniformBorder(imgData, W, bottom)) bottom--;

  // 2. Detect center vertical & horizontal gutter seams around 50%
  const midX = Math.floor((left + right) / 2);
  const midY = Math.floor((top + bottom) / 2);
  const maxGutterX = Math.floor((right - left) * 0.06);
  const maxGutterY = Math.floor((bottom - top) * 0.06);

  let splitLeftEnd = midX;
  while (splitLeftEnd > midX - maxGutterX && isColUniformBorder(imgData, W, H, splitLeftEnd)) {
    splitLeftEnd--;
  }
  let splitRightStart = midX + 1;
  while (splitRightStart < midX + maxGutterX && isColUniformBorder(imgData, W, H, splitRightStart)) {
    splitRightStart++;
  }

  let splitTopEnd = midY;
  while (splitTopEnd > midY - maxGutterY && isRowUniformBorder(imgData, W, splitTopEnd)) {
    splitTopEnd--;
  }
  let splitBottomStart = midY + 1;
  while (splitBottomStart < midY + maxGutterY && isRowUniformBorder(imgData, W, splitBottomStart)) {
    splitBottomStart++;
  }

  // Extra 1.4% anti-seam bleed trim inside each quadrant for crisp borderless panels
  const bleedX = Math.max(4, Math.floor((right - left) * 0.014));
  const bleedY = Math.max(4, Math.floor((bottom - top) * 0.014));

  const quadrants: Array<{ x: number; y: number; w: number; h: number }> = [
    // 0: Top-Left (Act I)
    {
      x: left + bleedX,
      y: top + bleedY,
      w: Math.max(64, splitLeftEnd - left - bleedX * 2),
      h: Math.max(64, splitTopEnd - top - bleedY * 2),
    },
    // 1: Top-Right (Act I -> II)
    {
      x: splitRightStart + bleedX,
      y: top + bleedY,
      w: Math.max(64, right - splitRightStart - bleedX * 2),
      h: Math.max(64, splitTopEnd - top - bleedY * 2),
    },
    // 2: Bottom-Left (Act II Showdown)
    {
      x: left + bleedX,
      y: splitBottomStart + bleedY,
      w: Math.max(64, splitLeftEnd - left - bleedX * 2),
      h: Math.max(64, bottom - splitBottomStart - bleedY * 2),
    },
    // 3: Bottom-Right (Act III Aftermath)
    {
      x: splitRightStart + bleedX,
      y: splitBottomStart + bleedY,
      w: Math.max(64, right - splitRightStart - bleedX * 2),
      h: Math.max(64, bottom - splitBottomStart - bleedY * 2),
    },
  ];

  const blobs: Blob[] = [];
  for (const q of quadrants) {
    const outCanvas = document.createElement('canvas');
    // Normalize each panel cleanly to crisp widescreen (max 1280px wide for fast, compact HTML/Drive export)
    const outW = Math.min(1280, Math.max(640, q.w));
    const outH = Math.round(outW * (q.h / q.w));
    outCanvas.width = outW;
    outCanvas.height = outH;
    const outCtx = outCanvas.getContext('2d');
    if (!outCtx) throw new Error('Panel canvas unavailable');
    outCtx.imageSmoothingEnabled = true;
    outCtx.imageSmoothingQuality = 'high';
    outCtx.drawImage(fullCanvas, q.x, q.y, q.w, q.h, 0, 0, outW, outH);
    blobs.push(await canvasToCompactJpegBlob(outCanvas));
  }

  return [blobs[0], blobs[1], blobs[2], blobs[3]];
}
