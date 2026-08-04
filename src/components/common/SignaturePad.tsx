/**
 * Hand-rolled canvas signature pad — one consumer (the worker handover
 * receipt), so a ~130-line canvas + Pointer Events implementation was chosen
 * over a new npm dependency. Pointer Events give one code path for mouse,
 * touch and stylus (`setPointerCapture` keeps the stroke tracking even if the
 * pointer leaves the canvas mid-drag).
 *
 * Controlled, Form.Item-compatible: `value` is a `data:image/png;base64,…`
 * URL (or null when untouched — never a blank PNG), `onChange` fires once per
 * completed stroke (not per move, to avoid re-render storms).
 */
'use client';

import { useEffect, useRef, useState } from 'react';
import { Button, Space } from 'antd';
import { ClearOutlined, UndoOutlined } from '@ant-design/icons';

export interface SignaturePadProps {
  value?: string | null;
  onChange?: (value: string | null) => void;
  disabled?: boolean;
  isRtl?: boolean;
  width?: number;
  height?: number;
}

type Point = { x: number; y: number };
type Stroke = Point[];

/**
 * Crops the source canvas to its ink bounding box (plus a small pad for the
 * round line caps) before export — a signature is typically a small fraction
 * of the pad's area, and the backend's `signatureImage` column has turned out
 * to reject anything much beyond a few hundred bytes of base64 (confirmed:
 * 638 chars → 201, 7100 chars → 500 with an empty body — a server-side crash,
 * not a validation error). Trimming keeps typical signatures well under that
 * cliff; see WorkerDeliveryRecordModal's save handler for the retry-without-
 * signature fallback that covers the rest.
 */
function trimToInk(canvas: HTMLCanvasElement, strokes: Stroke[], cssWidth: number, cssHeight: number): string {
  const dpr = canvas.width / cssWidth;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const stroke of strokes) {
    for (const p of stroke) {
      if (p.x < minX) minX = p.x;
      if (p.x > maxX) maxX = p.x;
      if (p.y < minY) minY = p.y;
      if (p.y > maxY) maxY = p.y;
    }
  }
  const pad = 4;
  minX = Math.max(0, minX - pad);
  minY = Math.max(0, minY - pad);
  maxX = Math.min(cssWidth, maxX + pad);
  maxY = Math.min(cssHeight, maxY + pad);
  const boxW = Math.max(1, maxX - minX);
  const boxH = Math.max(1, maxY - minY);

  const out = document.createElement('canvas');
  out.width = boxW * dpr;
  out.height = boxH * dpr;
  const octx = out.getContext('2d');
  if (!octx) return canvas.toDataURL('image/png');
  octx.drawImage(
    canvas,
    minX * dpr,
    minY * dpr,
    boxW * dpr,
    boxH * dpr,
    0,
    0,
    boxW * dpr,
    boxH * dpr
  );
  return out.toDataURL('image/png');
}

export default function SignaturePad({
  value,
  onChange,
  disabled,
  isRtl,
  width = 400,
  height = 160,
}: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const strokesRef = useRef<Stroke[]>([]);
  const drawingRef = useRef(false);
  const [hasInk, setHasInk] = useState(false);
  // Ref mutations don't trigger re-renders — mirror the count so button
  // `disabled` states (Undo especially) actually update.
  const [strokeCount, setStrokeCount] = useState(0);
  // Guards the hydration effect against re-loading the image we just emitted
  // ourselves (the parent echoes `onChange` back as the next `value`) — without
  // this every stroke would trigger a clear+redraw-from-image flicker.
  const lastEmittedRef = useRef<string | null>(null);

  const t = {
    clear: isRtl ? 'مسح' : 'Clear',
    undo: isRtl ? 'تراجع' : 'Undo',
    hint: isRtl ? 'وقّع هنا' : 'Sign here',
  };

  const getCtx = () => canvasRef.current?.getContext('2d') ?? null;

  /** Redraws the backing store from `strokesRef` — used by Undo and DPI setup. */
  const redraw = () => {
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.strokeStyle = '#1a1a2e';
    for (const stroke of strokesRef.current) {
      if (stroke.length < 2) continue;
      ctx.beginPath();
      ctx.moveTo(stroke[0].x, stroke[0].y);
      for (let i = 1; i < stroke.length - 1; i++) {
        const mid = { x: (stroke[i].x + stroke[i + 1].x) / 2, y: (stroke[i].y + stroke[i + 1].y) / 2 };
        ctx.quadraticCurveTo(stroke[i].x, stroke[i].y, mid.x, mid.y);
      }
      ctx.stroke();
    }
  };

  // Scale the backing store by devicePixelRatio so strokes aren't blurry on retina/mobile.
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    const ctx = getCtx();
    ctx?.scale(dpr, dpr);
    redraw();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [width, height]);

  // Hydrate an externally-supplied value (e.g. loading an existing record for edit).
  // Drawn as a flat image rather than reconstructed strokes — fine since Undo/redraw
  // after that point simply clears (editing a hydrated signature starts fresh).
  useEffect(() => {
    if (value === lastEmittedRef.current) return; // our own echo — skip
    if (!value) {
      strokesRef.current = [];
      setStrokeCount(0);
      setHasInk(false);
      redraw();
      return;
    }
    const canvas = canvasRef.current;
    const ctx = getCtx();
    if (!canvas || !ctx) return;
    const img = new Image();
    img.onload = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0, width, height);
      setHasInk(true);
    };
    img.src = value;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const toPoint = (e: React.PointerEvent<HTMLCanvasElement>): Point => {
    const rect = canvasRef.current!.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  const emit = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const inkPresent = strokesRef.current.some((s) => s.length > 1);
    setHasInk(inkPresent);
    const next = inkPresent ? trimToInk(canvas, strokesRef.current, width, height) : null;
    lastEmittedRef.current = next;
    onChange?.(next);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (disabled) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    strokesRef.current.push([toPoint(e)]);
    setStrokeCount(strokesRef.current.length);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawingRef.current || disabled) return;
    const stroke = strokesRef.current[strokesRef.current.length - 1];
    stroke.push(toPoint(e));
    redraw();
  };

  const endStroke = () => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    emit();
  };

  const handleClear = () => {
    strokesRef.current = [];
    setStrokeCount(0);
    redraw();
    emit();
  };

  const handleUndo = () => {
    strokesRef.current.pop();
    setStrokeCount(strokesRef.current.length);
    redraw();
    emit();
  };

  return (
    <div dir="ltr">
      <div
        style={{
          position: 'relative',
          border: '1px dashed #d9d9d9',
          borderRadius: 6,
          width,
          height,
          background: disabled ? '#f5f5f5' : '#fff',
        }}
      >
        {!hasInk && (
          <span
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#bfbfbf',
              fontSize: 13,
              pointerEvents: 'none',
            }}
          >
            {t.hint}
          </span>
        )}
        <canvas
          ref={canvasRef}
          style={{ touchAction: 'none', cursor: disabled ? 'not-allowed' : 'crosshair' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endStroke}
          onPointerCancel={endStroke}
          onPointerLeave={endStroke}
        />
      </div>
      <Space style={{ marginTop: 8 }}>
        <Button size="small" icon={<UndoOutlined />} onClick={handleUndo} disabled={disabled || strokeCount === 0}>
          {t.undo}
        </Button>
        <Button size="small" icon={<ClearOutlined />} onClick={handleClear} disabled={disabled || !hasInk}>
          {t.clear}
        </Button>
      </Space>
    </div>
  );
}
