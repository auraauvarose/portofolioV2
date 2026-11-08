"use client";

import { useEffect, useRef } from "react";

const CELL = 12;
const STEP = 1.9 / 14;
const EDGES = [[], [3, 2], [2, 1], [3, 1], [0, 1], [0, 1, 2, 3], [0, 2], [0, 3], [0, 3], [0, 2], [0, 3, 1, 2], [0, 1], [3, 1], [2, 1], [3, 2], []];
const permutation = (() => {
  const values = Array.from({ length: 256 }, (_, i) => i);
  let seed = 1013;
  for (let i = 255; i > 0; i--) {
    seed = (seed * 16807) % 2147483647;
    const j = seed % (i + 1);
    [values[i], values[j]] = [values[j], values[i]];
  }
  return [...values, ...values];
})();
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10);
function gradient(hash: number, x: number, y: number, z: number) {
  const h = hash & 15;
  const u = h < 8 ? x : y;
  const v = h < 4 ? y : h === 12 || h === 14 ? x : z;
  return (h & 1 ? -u : u) + (h & 2 ? -v : v);
}
function noise(x: number, y: number, z: number): number {
  const X = Math.floor(x) & 255, Y = Math.floor(y) & 255, Z = Math.floor(z) & 255;
  x -= Math.floor(x); y -= Math.floor(y); z -= Math.floor(z);
  const u = fade(x), v = fade(y), w = fade(z), p = permutation;
  const a = p[X] + Y, aa = p[a] + Z, ab = p[a + 1] + Z;
  const b = p[X + 1] + Y, ba = p[b] + Z, bb = p[b + 1] + Z;
  return mix(
    mix(mix(gradient(p[aa], x, y, z), gradient(p[ba], x - 1, y, z), u),
      mix(gradient(p[ab], x, y - 1, z), gradient(p[bb], x - 1, y - 1, z), u), v),
    mix(mix(gradient(p[aa + 1], x, y, z - 1), gradient(p[ba + 1], x - 1, y, z - 1), u),
      mix(gradient(p[ab + 1], x, y - 1, z - 1), gradient(p[bb + 1], x - 1, y - 1, z - 1), u), v), w,
  );
}

export function sampleTopography(
  x: number, y: number, time: number,
  hill: { x: number; y: number; lift: number },
): number {
  const nx = x / 280, ny = y / 280;
  return noise(nx, ny, time) * 1.1 + noise(nx * 2.1, ny * 2.1, time * 1.7) * 0.45
    + hill.lift * 1.275 * Math.exp(-Math.hypot(x - hill.x, y - hill.y) / 90);
}

export default function SiteConstellation() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const fine = window.matchMedia("(hover: hover) and (pointer: fine)");
    const hill = { x: 0, y: 0, lift: 0 };
    const target = { ...hill };
    let velocityX = 0, velocityY = 0;
    let width = 0, height = 0, cols = 0, rows = 0, dpr = 1;
    let field = new Float32Array(0);
    let raf = 0, scrollRaf = 0, last = 0, time = 0, clipTop = -1;
    let color = getComputedStyle(canvas).color;
    const xs = new Float64Array(4), ys = new Float64Array(4);

    const draw = () => {
      for (let y = 0; y <= rows; y++) {
        for (let x = 0; x <= cols; x++) {
          field[y * (cols + 1) + x] = sampleTopography(x * CELL, y * CELL, time, hill);
        }
      }
      const minor = new Path2D(), major = new Path2D();
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          const i = y * (cols + 1) + x;
          const a = field[i], b = field[i + 1], c = field[i + cols + 2], d = field[i + cols + 1];
          const end = Math.floor((Math.max(a, b, c, d) + 0.95) / STEP);
          for (let level = Math.ceil((Math.min(a, b, c, d) + 0.95) / STEP); level <= end; level++) {
            const iso = level * STEP - 0.95;
            const mask = (a > iso ? 8 : 0) | (b > iso ? 4 : 0) | (c > iso ? 2 : 0) | (d > iso ? 1 : 0);
            if (mask === 0 || mask === 15) continue;
            let edges = EDGES[mask];
            if (mask === 5 || mask === 10) {
              edges = EDGES[(mask === 5) === ((a + b + c + d) / 4 > iso) ? 10 : 5];
            }
            const left = x * CELL, top = y * CELL;
            xs[0] = left + (iso - a) / (b - a) * CELL; ys[0] = top;
            xs[1] = left + CELL; ys[1] = top + (iso - b) / (c - b) * CELL;
            xs[2] = left + (iso - d) / (c - d) * CELL; ys[2] = top + CELL;
            xs[3] = left; ys[3] = top + (iso - a) / (d - a) * CELL;
            const path = level % 5 === 0 ? major : minor;
            for (let e = 0; e < edges.length; e += 2) {
              path.moveTo(xs[edges[e]], ys[edges[e]]);
              path.lineTo(xs[edges[e + 1]], ys[edges[e + 1]]);
            }
          }
        }
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, width, height);
      ctx.strokeStyle = color;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.globalAlpha = 0.4; ctx.lineWidth = 1; ctx.stroke(minor);
      ctx.globalAlpha = 0.85; ctx.lineWidth = 1.5; ctx.stroke(major);
      ctx.globalAlpha = 1;
    };
    const resize = () => {
      if (!width) {
        hill.x = target.x = canvas.clientWidth / 2;
        hill.y = target.y = canvas.clientHeight / 2;
      }
      width = canvas.clientWidth; height = canvas.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      canvas.width = Math.max(1, Math.round(width * dpr));
      canvas.height = Math.max(1, Math.round(height * dpr));
      cols = Math.ceil(width / CELL); rows = Math.ceil(height / CELL);
      field = new Float32Array((cols + 1) * (rows + 1));
      updateClip();
      draw();
    };
    // Kontur dipotong tepat di tepi atas konten: selama hero masih terlihat
    // canvas tidak tampil sama sekali, dan begitu konten masuk konturnya
    // langsung ikut terlihat tanpa fade.
    const updateClip = () => {
      const vh = window.innerHeight || 1;
      const top = Math.max(0, Math.round(vh - window.scrollY));
      if (top === clipTop) return;
      clipTop = top;
      canvas.style.clipPath = top > 0 ? `inset(${top}px 0 0 0)` : "none";
    };
    const onScroll = () => {
      if (scrollRaf) return;
      scrollRaf = requestAnimationFrame(() => { scrollRaf = 0; updateClip(); });
    };
    const enabled = () => fine.matches && !reduced.matches && !document.hidden;
    // Spring teredam (bukan lerp per frame) supaya bukit meluncur halus.
    const stiffness = 130, damping = 24;
    const frame = (now: number) => {
      raf = 0;
      if (!enabled()) return;
      const delta = Math.min(last ? now - last : 16.7, 50);
      last = now;
      const dt = delta / 1000;
      time += delta * 0.00003;
      if (hill.lift < 0.02) { hill.x = target.x; hill.y = target.y; velocityX = velocityY = 0; }
      velocityX += (stiffness * (target.x - hill.x) - damping * velocityX) * dt;
      velocityY += (stiffness * (target.y - hill.y) - damping * velocityY) * dt;
      hill.x += velocityX * dt;
      hill.y += velocityY * dt;
      hill.lift = mix(hill.lift, target.lift, 1 - Math.exp(-delta / 220));
      if (clipTop < height - 1) draw();
      raf = requestAnimationFrame(frame);
    };
    const sync = () => {
      cancelAnimationFrame(raf); raf = 0; last = 0;
      if (reduced.matches || !fine.matches) hill.lift = target.lift = 0;
      draw();
      if (enabled()) raf = requestAnimationFrame(frame);
    };
    const move = (event: PointerEvent) => {
      if (!enabled() || event.pointerType === "touch") return;
      target.x = event.clientX; target.y = event.clientY; target.lift = 1;
    };
    const leave = () => { target.lift = 0; };
    const out = (event: PointerEvent) => { if (!event.relatedTarget) leave(); };
    const recolor = () => {
      const next = getComputedStyle(canvas).color;
      if (next !== color) { color = next; draw(); }
    };
    const sizeObserver = new ResizeObserver(resize);
    const themeObserver = new MutationObserver(recolor);
    sizeObserver.observe(canvas);
    themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    window.addEventListener("pointermove", move, { passive: true });
    window.addEventListener("pointerout", out, { passive: true });
    window.addEventListener("blur", leave);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", sync);
    reduced.addEventListener("change", sync);
    fine.addEventListener("change", sync);
    resize(); sync();
    return () => {
      cancelAnimationFrame(raf);
      cancelAnimationFrame(scrollRaf);
      sizeObserver.disconnect(); themeObserver.disconnect();
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerout", out);
      window.removeEventListener("blur", leave);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", sync);
      reduced.removeEventListener("change", sync);
      fine.removeEventListener("change", sync);
    };
  }, []);
  return <canvas ref={ref} aria-hidden="true" data-slot="topography-background"
    className="sc-host pointer-events-none fixed inset-0 z-50 h-full w-full" />;
}