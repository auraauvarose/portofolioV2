"use client";

import { useEffect, useRef } from "react";

/**
 * SpiderWalker — laba-laba SVG kecil yang "jalan-jalan santai" mengelilingi
 * perimeter viewport (atas → kanan → bawah → kiri → ulang).
 *
 * - Posisi digerakkan via requestAnimationFrame (transform saja, tanpa
 *   re-render React per frame), kecepatan 40–60px/detik dengan variasi acak.
 * - Rotasi otomatis per sisi (0/90/180/270) supaya kaki selalu "napak" ke
 *   tepi layar yang sedang dilewati.
 * - Animasi kaki terpisah dari posisi: CSS @keyframes pendek (0.4s) yang
 *   berjalan hanya saat spider bergerak (`spider-walking` class).
 * - Setiap 20–40 detik berhenti: idle 2–3 detik, atau (jika sedang di sisi
 *   atas) turun memakai benang jaring ke tengah layar, menggantung, lalu naik.
 * - prefers-reduced-motion: reduce → spider parkir statis, tidak bergerak.
 * - Perimeter di-re-measure ulang saat window di-resize.
 */

const SIZE = 30;
const SPEED_MIN = 40;
const SPEED_MAX = 60;
const STOP_EVERY_MIN = 20000;
const STOP_EVERY_MAX = 40000;
const IDLE_MIN = 2000;
const IDLE_MAX = 3000;
const WEB_CHANCE = 0.45;
const WEB_DROP_SPEED = 90; // px/s turun
const WEB_RISE_SPEED = 120; // px/s naik

type Mode = "walk" | "idle" | "webDown" | "webHang" | "webUp";

// Kaki: titik tempel (x,y) + path melengkung (Q-curve) menjauhi badan.
// `d` = delay animasi (s) supaya kaki-kaki saling bergantian.
// Silhouette monokrom: badan 2 elips + 8 kaki, semua pakai currentColor.
const LEGS: { x: number; y: number; d: string; delay: number }[] = [
  { x: 12.7, y: 13.2, d: "M0 0 Q -2.8 -4.5 -6.5 -6", delay: 0 },
  { x: 12.5, y: 15.4, d: "M0 0 Q -3 -2.6 -7 -3", delay: 0.1 },
  { x: 12.5, y: 17.7, d: "M0 0 Q -3 -0.8 -6.8 -0.5", delay: 0.2 },
  { x: 12.9, y: 20, d: "M0 0 Q -2.8 1.2 -6.3 2", delay: 0.3 },
  { x: 17.3, y: 13.2, d: "M0 0 Q 2.8 -4.5 6.5 -6", delay: 0.2 },
  { x: 17.5, y: 15.4, d: "M0 0 Q 3 -2.6 7 -3", delay: 0.3 },
  { x: 17.5, y: 17.7, d: "M0 0 Q 3 -0.8 6.8 -0.5", delay: 0.4 },
  { x: 17.1, y: 20, d: "M0 0 Q 2.8 1.2 6.3 2", delay: 0.5 },
];

export default function SpiderWalker() {
  const elRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const thread = el.querySelector<HTMLElement>(".spider-thread");
    if (!thread) return;

    const st = {
      w: 0,
      h: 0,
      dist: 0, // jarak (px) di sepanjang perimeter
      mode: "walk" as Mode,
      speed: SPEED_MIN,
      nextStop: 0, // timestamp kapan berhenti berikutnya
      idleUntil: 0,
      webX: 0,
      webY: 0,
      webTarget: 0,
      swayFrom: -6,
      swayTo: 6,
      swayDur: 1.6,
      last: 0,
    };

    const rand = (min: number, max: number) => min + Math.random() * (max - min);

    const measure = () => {
      st.w = window.innerWidth;
      st.h = window.innerHeight;
      const perim = 2 * (st.w + st.h);
      st.dist = ((st.dist % perim) + perim) % perim;
    };

    // Peta jarak perimeter → (x, y, rotasi). Spider digambar menghadap ke atas,
    // jadi rotasi 0/90/180/270 membuat kaki "napak" ke tepi yang sedang dilewati.
    const pos = () => {
      const perim = 2 * (st.w + st.h);
      const d = ((st.dist % perim) + perim) % perim;
      if (d <= st.w) return { x: d, y: 0, rot: 0 };
      if (d <= st.w + st.h) return { x: st.w, y: d - st.w, rot: 90 };
      if (d <= 2 * st.w + st.h) return { x: st.w - (d - st.w - st.h), y: st.h, rot: 180 };
      return { x: 0, y: st.h - (d - 2 * st.w - st.h), rot: 270 };
    };

    const applyPose = (x: number, y: number, rot: number) => {
      el.style.transform = `translate3d(${x}px, ${y}px, 0) translate(-50%, -50%) rotate(${rot}deg)`;
    };

    const setThread = (h: number) => {
      thread.style.top = `${-h}px`;
      thread.style.height = `${h}px`;
      thread.style.opacity = h > 0 ? "1" : "0";
    };

    // Goyangan pendulum saat bergelantungan: pivot di titik jangkar
    // langit-langit (container top-left + (15, 15 - webY)) supaya thread
    // ikut miring — animasi `rotate` CSS terpisah dari transform JS.
    const startSway = () => {
      st.swayFrom = -rand(4, 8);
      st.swayTo = rand(4, 8);
      st.swayDur = rand(1.2, 2);
      el.style.transformOrigin = `15px ${15 - st.webY}px`;
      el.style.setProperty("--sway-from", `${st.swayFrom}deg`);
      el.style.setProperty("--sway-to", `${st.swayTo}deg`);
      el.style.setProperty("--sway-dur", `${st.swayDur}s`);
      el.classList.add("spider-swaying");
    };
    const stopSway = () => {
      el.classList.remove("spider-swaying");
      el.style.transformOrigin = "";
    };

    let walking = false;
    const setWalking = (on: boolean) => {
      if (on !== walking) {
        walking = on;
        el.classList.toggle("spider-walking", on);
      }
    };

    const startWalking = (now: number) => {
      st.mode = "walk";
      st.speed = rand(SPEED_MIN, SPEED_MAX);
      st.nextStop = now + rand(STOP_EVERY_MIN, STOP_EVERY_MAX);
    };

    const park = () => {
      // Mode reduce-motion: spider statis di pojok kanan atas.
      stopSway();
      applyPose(Math.max(SIZE + 12, st.w - 80), 0, 0);
      setThread(0);
      setWalking(false);
    };

    let raf = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const dt = Math.min((now - st.last) / 1000, 0.1);
      st.last = now;

      switch (st.mode) {
        case "walk": {
          st.dist += st.speed * dt;
          const p = pos();
          applyPose(p.x, p.y, p.rot);
          setWalking(true);
          if (now >= st.nextStop) {
            if (p.rot === 0 && st.w > 100 && Math.random() < WEB_CHANCE) {
              // Di sisi atas → turun pakai benang jaring.
              st.mode = "webDown";
              st.webX = p.x;
              st.webY = 0;
              st.webTarget = Math.max(80, st.h * 0.35);
            } else {
              st.mode = "idle";
              st.idleUntil = now + rand(IDLE_MIN, IDLE_MAX);
            }
          }
          break;
        }
        case "idle": {
          const p = pos();
          applyPose(p.x, p.y, p.rot);
          setWalking(false);
          if (now >= st.idleUntil) startWalking(now);
          break;
        }
        case "webDown": {
          st.webY = Math.min(st.webY + WEB_DROP_SPEED * dt, st.webTarget);
          applyPose(st.webX, st.webY, 0);
          setThread(st.webY);
          setWalking(true);
          if (st.webY >= st.webTarget) {
            st.mode = "webHang";
            st.idleUntil = now + rand(IDLE_MIN, IDLE_MAX);
            startSway();
          }
          break;
        }
        case "webHang": {
          applyPose(st.webX, st.webY, 0);
          setThread(st.webY);
          setWalking(false);
          if (now >= st.idleUntil) {
            stopSway();
            st.mode = "webUp";
          }
          break;
        }
        case "webUp": {
          st.webY = Math.max(st.webY - WEB_RISE_SPEED * dt, 0);
          applyPose(st.webX, st.webY, 0);
          setThread(st.webY);
          setWalking(true);
          if (st.webY <= 0) startWalking(now);
          break;
        }
      }
    };

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onMotionChange = (e: MediaQueryListEvent) => {
      if (e.matches) {
        cancelAnimationFrame(raf);
        park();
      } else {
        st.last = performance.now();
        startWalking(st.last);
        raf = requestAnimationFrame(tick);
      }
    };

    measure();
    st.dist = st.w / 2; // mulai dari tengah sisi atas
    st.last = performance.now();
    window.addEventListener("resize", measure);

    if (mq.matches) {
      park();
    } else {
      startWalking(st.last);
      raf = requestAnimationFrame(tick);
    }
    mq.addEventListener("change", onMotionChange);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", measure);
      mq.removeEventListener("change", onMotionChange);
    };
  }, []);

  return (
    <div
      ref={elRef}
      aria-hidden
      className="spider-walker pointer-events-none fixed left-0 top-0 z-[99995] h-[30px] w-[30px]"
      style={{ willChange: "transform" }}
    >
      {/* Benang jaring — di-resize dari JS saat mode web */}
      <div className="spider-thread" />
      <svg width={SIZE} height={SIZE} viewBox="0 0 30 30" fill="none" aria-hidden>
        {LEGS.map((l, i) => (
          <g key={i} transform={`translate(${l.x} ${l.y})`}>
            <path
              className="spider-leg"
              d={l.d}
              stroke="currentColor"
              strokeWidth="1.2"
              strokeLinecap="round"
              fill="none"
              style={{ animationDelay: `${l.delay}s` }}
            />
          </g>
        ))}
        {/* Abdomen + kepala — silhouette monokrom */}
        <ellipse cx="15" cy="21.5" rx="5.2" ry="6" fill="currentColor" />
        <ellipse cx="15" cy="12.4" rx="3.3" ry="3" fill="currentColor" />
      </svg>
    </div>
  );
}
