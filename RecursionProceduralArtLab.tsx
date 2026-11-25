"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";
import {
  AlertTriangle,
  ArrowRight,
  Award,
  Check,
  Lightbulb,
  RotateCcw,
} from "lucide-react";
import { LabShell } from "@/components/LabShell";
import { useLabAudio } from "@/hooks/useLabAudio";
import { useLMSBridge } from "@/hooks/useLMSBridge";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";

/* ============================================================================
   SHARED TYPES & SVG COORDINATE MAPPER
   ============================================================================ */

type StatusTone = "info" | "warn" | "success";

interface StudioLevelProps {
  playClick: () => void;
  playSwitch: () => void;
  playSuccess: () => void;
  playError: () => void;
  playBeep: (freq?: number) => void;
  speak: (text: string) => void;
  setStatus: (text: string, tone?: StatusTone) => void;
  onRegisterHint: (fn: () => string) => void;
  onLevelComplete: (scoreAward: number) => void;
}

function clientToSvg(
  svg: SVGSVGElement | null,
  clientX: number,
  clientY: number
): { x: number; y: number } {
  if (!svg) return { x: 0, y: 0 };
  const ctm = svg.getScreenCTM();
  if (ctm) {
    const pt = svg.createSVGPoint();
    pt.x = clientX;
    pt.y = clientY;
    const mapped = pt.matrixTransform(ctm.inverse());
    return { x: mapped.x, y: mapped.y };
  }
  const rect = svg.getBoundingClientRect();
  return {
    x: ((clientX - rect.left) / Math.max(1, rect.width)) * 1200,
    y: ((clientY - rect.top) / Math.max(1, rect.height)) * 560,
  };
}

function CommonWorldDefs() {
  return (
    <defs>
      <linearGradient id="brassRich" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="48%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#78350f" />
      </linearGradient>
      <linearGradient id="woodPost" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#78350f" />
        <stop offset="45%" stopColor="#b45309" />
        <stop offset="100%" stopColor="#451a03" />
      </linearGradient>
      <linearGradient id="silverSteel" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#94a3b8" />
        <stop offset="50%" stopColor="#f8fafc" />
        <stop offset="100%" stopColor="#64748b" />
      </linearGradient>
      <radialGradient id="goldSeedGrad" cx="38%" cy="35%" r="65%">
        <stop offset="0%" stopColor="#fef9c3" />
        <stop offset="48%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#92400e" />
      </radialGradient>
      {/* Soft Botanical Lotus Petal Gradients (Coral, Rose, Saffron, Soft Jade) */}
      <linearGradient id="petalCoral" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#fb7185" />
        <stop offset="55%" stopColor="#fda4af" />
        <stop offset="100%" stopColor="#ffe4e6" />
      </linearGradient>
      <linearGradient id="petalRose" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#f97316" />
        <stop offset="52%" stopColor="#fb923c" />
        <stop offset="100%" stopColor="#ffedd5" />
      </linearGradient>
      <linearGradient id="petalSaffron" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#eab308" />
        <stop offset="55%" stopColor="#facc15" />
        <stop offset="100%" stopColor="#fef9c3" />
      </linearGradient>
      <linearGradient id="petalBlush" x1="0%" y1="100%" x2="0%" y2="0%">
        <stop offset="0%" stopColor="#f43f5e" />
        <stop offset="55%" stopColor="#fda4af" />
        <stop offset="100%" stopColor="#fff1f2" />
      </linearGradient>
    </defs>
  );
}

/* ============================================================================
   LEVEL 1 (R1) — THE FRACTAL CRYSTAL TRIANGLE (Self-Similarity + Base Case Cap)
   Bright glacier-blue, silver, and coral Crystal Geometry Table with a ~340px
   central Ice Triangle, 3 Corner Prism Nodes, a draggable/tappable
   "STOP AT DEPTH 3" Base Case Prism Lock, and interactive depth stepping
   Depth 0 (1) -> Depth 1 (3) -> Depth 2 (9) -> Depth 3 (27 Crystal Triangles).
   ============================================================================ */

interface CrystalTri {
  ax: number;
  ay: number;
  bx: number;
  by: number;
  cx: number;
  cy: number;
  cornerIdx: number;
}

function buildCrystalTriangles(depth: number): CrystalTri[] {
  // Centered ~340px-wide equilateral Crystal Triangle shifted down +18px for clean top-banner clearance
  const root: CrystalTri = {
    ax: 600,
    ay: 114,
    bx: 430,
    by: 408,
    cx: 770,
    cy: 408,
    cornerIdx: 0,
  };

  let list: CrystalTri[] = [root];
  for (let d = 0; d < depth; d++) {
    const next: CrystalTri[] = [];
    for (const t of list) {
      const mabX = (t.ax + t.bx) / 2;
      const mabY = (t.ay + t.by) / 2;
      const mbcX = (t.bx + t.cx) / 2;
      const mbcY = (t.by + t.cy) / 2;
      const mcaX = (t.cx + t.ax) / 2;
      const mcaY = (t.cy + t.ay) / 2;
      next.push(
        { ax: t.ax, ay: t.ay, bx: mabX, by: mabY, cx: mcaX, cy: mcaY, cornerIdx: 0 },
        { ax: mabX, ay: mabY, bx: t.bx, by: t.by, cx: mbcX, cy: mbcY, cornerIdx: 1 },
        { ax: mcaX, ay: mcaY, bx: mbcX, by: mbcY, cx: t.cx, cy: t.cy, cornerIdx: 2 }
      );
    }
    list = next;
  }
  return list;
}

function CornerPrismNodeSVG({
  x,
  y,
  active,
  alarm,
  jewelFill,
  jewelStroke,
  label,
  labelDx = 0,
  labelDy = 0,
  labelAnchor = "middle",
}: {
  x: number;
  y: number;
  active: boolean;
  alarm: boolean;
  jewelFill: string;
  jewelStroke: string;
  label: string;
  labelDx?: number;
  labelDy?: number;
  labelAnchor?: "start" | "middle" | "end";
}) {
  return (
    <g transform={`translate(${x}, ${y})`} className="pointer-events-none">
      {(active || alarm) && (
        <motion.circle
          cx="0"
          cy="0"
          fill={alarm ? "#fb7185" : "#fbbf24"}
          opacity="0.34"
          animate={{ r: [18, 28, 18] }}
          transition={{ type: "tween", repeat: Infinity, duration: alarm ? 0.6 : 1.5 }}
        />
      )}
      <polygon
        points="0,-19 16,-9 16,9 0,19 -16,9 -16,-9"
        fill={alarm ? "#f43f5e" : jewelFill}
        stroke={alarm ? "#881337" : jewelStroke}
        strokeWidth="2.4"
      />
      <polygon
        points="0,-11 9,-5 9,5 0,11 -9,5 -9,-5"
        fill="#fef9c3"
        opacity="0.58"
      />
      <text
        x={labelDx}
        y={labelDy}
        textAnchor={labelAnchor}
        fill={alarm ? "#be123c" : "#78350f"}
        fontSize="9.2"
        fontWeight="900"
        fontFamily="monospace"
      >
        {label}
      </text>
    </g>
  );
}

/* ============================================================================
   LEVEL 1 (R1) — 3 SEQUENTIAL SUBLEVELS:
     1A: Fractal Crystal Triangle (Depth Base Case: STOP AT DEPTH 3)
     1B: The Recursive Fern Frond (Leaflet Base Case: STOP AT 3 LAYERS)
     1C: The Snowflake Crystal Carver (6-Fold Fractal Branching: STOP AT DEPTH 3)
   ============================================================================ */

interface SublevelProps extends StudioLevelProps {
  onSubComplete: () => void;
}

function Sublevel1ACrystalTriangle({
  playSwitch,
  playSuccess,
  playError,
  playBeep,
  speak,
  setStatus,
  onRegisterHint,
  onSubComplete,
}: SublevelProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [capLocked, setCapLocked] = useState(false);
  const [depth, setDepth] = useState(0);
  const [phase, setPhase] = useState<"idle" | "runaway" | "inf_alarm" | "complete">("idle");
  const [pulseTick, setPulseTick] = useState(0);
  const [done, setDone] = useState(false);

  const [dragLock, setDragLock] = useState<{ x: number; y: number } | null>(null);
  const lockMovedRef = useRef(false);

  const LOCK_START_X = 1016;
  const LOCK_START_Y = 224;
  const SOCKET_X = 1016;
  const SOCKET_Y = 390;

  const triangles = useMemo(() => buildCrystalTriangles(depth), [depth]);
  const triCount = Math.pow(3, depth);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  useEffect(() => {
    onRegisterHint(() => {
      if (!capLocked) {
        return "Sublevel 1A: Drag or tap the 'STOP AT DEPTH 3' Prism Lock into the Base Case Socket on the right so subdivision stops safely at 27 triangles.";
      }
      if (depth < 3) {
        return `Press SUBDIVIDE (DEPTH ${depth} -> ${depth + 1}) or tap the Crystal Triangle to replace each triangle with 3 half-size corner copies!`;
      }
      return "BASE CASE REACHED: Stopped cleanly at Depth 3 (27 Crystal Triangles)!";
    });
  }, [capLocked, depth, onRegisterHint]);

  const snapStopCap = useCallback(() => {
    if (capLocked || phase === "runaway") return;
    clearTimers();
    playSwitch();
    playBeep(760);
    setCapLocked(true);
    setDepth(0);
    setPhase("idle");
    setStatus(
      "BASE CASE LOCKED: STOP AT DEPTH 3! Step through Depth 0 (1) -> Depth 1 (3) -> Depth 2 (9) -> Depth 3 (27).",
      "success"
    );
    speak(
      "Stop at Depth 3 prism lock snapped onto the table! Now subdivide the crystal triangle step by step from Depth 0 to Depth 3."
    );
  }, [capLocked, clearTimers, phase, playBeep, playSwitch, setStatus, speak]);

  const handleSubdivide = useCallback(() => {
    if (phase === "runaway" || done) return;

    // Without a Base Case Depth Cap, demonstrate runaway infinite shrinking!
    if (!capLocked) {
      clearTimers();
      playSwitch();
      setPhase("runaway");
      setDepth(0);

      [1, 2, 3, 4].forEach((d, idx) => {
        const t = setTimeout(() => {
          setDepth(d);
          setPulseTick((p) => p + 1);
          playBeep(440 + d * 85);
          if (d === 4) {
            playError();
            setPhase("inf_alarm");
            setStatus("NO STOP CAP: Triangles shrink endlessly! Snap 'STOP AT DEPTH 3' into the socket.", "warn");
            speak("No stop cap! Without a base case, triangles keep splitting and shrinking endlessly. Snap Stop at Depth 3 onto the table.");
          }
        }, (idx + 1) * 240);
        timersRef.current.push(t);
      });
      return;
    }

    // With STOP AT DEPTH 3 locked, step cleanly Depth 0 -> 1 -> 2 -> 3!
    if (depth >= 3) {
      playBeep(780);
      setPulseTick((p) => p + 1);
      setStatus("BASE CASE REACHED: Stopped cleanly at Depth 3 (27 Crystal Triangles)!", "success");
      return;
    }

    const nextDepth = depth + 1;
    const nextCount = Math.pow(3, nextDepth);
    playSwitch();
    playBeep(460 + nextDepth * 110);
    setDepth(nextDepth);
    setPulseTick((p) => p + 1);

    if (nextDepth < 3) {
      setStatus(
        `Depth ${nextDepth}: ${nextCount} self-similar triangles! Subdivide again to reach Depth 3 (27).`,
        "info"
      );
      speak(`Depth ${nextDepth}! Each triangle split into three half-size copies, making ${nextCount} crystal triangles.`);
    } else {
      playSuccess();
      setPhase("complete");
      setDone(true);
      setStatus("BASE CASE REACHED: Stopped cleanly at Depth 3 (27 Crystal Triangles)! Advancing to 1B: Recursive Fern...", "success");
      speak("Base case reached! Stopped cleanly at Depth 3 with twenty-seven crystal triangles. Moving to Sublevel 1B: The Recursive Fern Frond.");
      const adv = setTimeout(() => {
        onSubComplete();
      }, 1450);
      timersRef.current.push(adv);
    }
  }, [capLocked, clearTimers, depth, done, onSubComplete, phase, playBeep, playError, playSuccess, playSwitch, setStatus, speak]);

  const onSvgMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragLock) return;
    lockMovedRef.current = true;
    setDragLock(clientToSvg(svgRef.current, e.clientX, e.clientY));
  };

  const onSvgUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragLock) return;
    const pt = clientToSvg(svgRef.current, e.clientX, e.clientY);
    const wasTap = !lockMovedRef.current;
    setDragLock(null);
    const dist = Math.hypot(pt.x - SOCKET_X, pt.y - SOCKET_Y);
    if (wasTap || dist < 120) {
      snapStopCap();
    }
  };

  const jewelFills = [
    "url(#jewelSapphire)",
    "url(#jewelAmber)",
    "url(#jewelCoral)",
    "url(#jewelEmerald)",
  ];
  const depthSteps = [
    { d: 0, count: 1, label: "1 TRIANGLE" },
    { d: 1, count: 3, label: "3 TRIANGLES" },
    { d: 2, count: 9, label: "9 TRIANGLES" },
    { d: 3, count: 27, label: "27 TRIANGLES" },
  ];

  return (
    <div className="flex-1 min-h-0 w-full relative overflow-hidden select-none">
      {/* FULL-BLEED WARM SUNLIT SKY & SANDSTONE CRYSTAL JEWEL TABLE BACKDROP */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1200 560"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="sunlitSkySandstone" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="44%" stopColor="#fef3c7" />
            <stop offset="100%" stopColor="#fde68a" />
          </linearGradient>
          <radialGradient id="crystalSunGlow" cx="50%" cy="46%" r="46%">
            <stop offset="0%" stopColor="#fffbeb" stopOpacity="0.88" />
            <stop offset="100%" stopColor="#fde68a" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="sandstoneApron" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fcd34d" />
            <stop offset="52%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
        </defs>

        <rect width="1200" height="560" fill="url(#sunlitSkySandstone)" />
        <rect width="1200" height="560" fill="url(#crystalSunGlow)" />

        {/* Warm Sunlit Diagonal Light Rays & Geometric Crystal Facets */}
        <polygon points="180,0 380,0 740,452 500,452" fill="#fffbeb" opacity="0.28" />
        <polygon points="520,0 690,0 1050,452 840,452" fill="#fef08a" opacity="0.22" />
        <g stroke="#d97706" strokeWidth="1.2" opacity="0.24">
          <polygon points="0,0 310,0 155,260" fill="#bae6fd" fillOpacity="0.34" />
          <polygon points="890,0 1200,0 1045,260" fill="#bae6fd" fillOpacity="0.34" />
          <polygon points="155,260 350,452 0,452" fill="#fde68a" fillOpacity="0.45" />
          <polygon points="1045,260 1200,452 850,452" fill="#fde68a" fillOpacity="0.45" />
        </g>

        {/* Warm Sunlit Sandstone & Gold Lower Table Apron */}
        <rect x="0" y="452" width="1200" height="108" fill="url(#sandstoneApron)" />
      </svg>

      {/* UNIFIED 1200x560 SUNLIT CRYSTAL JEWEL GEOMETRY TABLE STAGE */}
      <svg
        ref={svgRef}
        viewBox="0 0 1200 560"
        preserveAspectRatio="xMidYMid meet"
        onPointerMove={onSvgMove}
        onPointerUp={onSvgUp}
        onPointerCancel={onSvgUp}
        className="relative z-10 w-full h-full touch-none"
      >
        <CommonWorldDefs />
        <defs>
          <linearGradient id="jewelSapphire" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#67e8f9" />
            <stop offset="48%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#075985" />
          </linearGradient>
          <linearGradient id="jewelAmber" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="48%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <linearGradient id="jewelCoral" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fda4af" />
            <stop offset="48%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#be123c" />
          </linearGradient>
          <linearGradient id="jewelEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#6ee7b7" />
            <stop offset="48%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <linearGradient id="jewelGoldEmerald" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" />
            <stop offset="45%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#065f46" />
          </linearGradient>
        </defs>

        {/* Gleaming Brass Rail Along Table Edge */}
        <rect x="0" y="446" width="1200" height="9" fill="url(#brassRich)" stroke="#78350f" strokeWidth="1.8" />

        {/* TOP 1-LINE RULE & CONCEPT CALLOUT RIBBON */}
        <rect
          x="136"
          y="10"
          width="928"
          height="34"
          rx="17"
          fill={
            phase === "inf_alarm"
              ? "#be123c"
              : phase === "complete"
              ? "#059669"
              : "#0369a1"
          }
          stroke="#fef08a"
          strokeWidth="2.2"
        />
        <text x="600" y="31" textAnchor="middle" fill="#ffffff" fontSize="11.2" fontWeight="900" fontFamily="monospace">
          {phase === "inf_alarm"
            ? "NO STOP CAP: Triangles shrink endlessly! Snap 'STOP AT DEPTH 3' into the socket!"
            : phase === "complete"
            ? "BASE CASE REACHED: Stopped cleanly at Depth 3 (27 Crystal Triangles)!"
            : "RULE: Replace 1 triangle with 3 half-size triangles at its corners!"}
        </text>

        {/* LEFT BORDERLESS CRYSTAL DEPTH PROGRESSION (Depth 0 -> 1 -> 2 -> 3) */}
        <g transform="translate(174, 152)" className="pointer-events-none">
          <text x="0" y="0" textAnchor="middle" fill="#075985" fontSize="11" fontWeight="900" fontFamily="monospace">
            CRYSTAL DEPTH TRACKER
          </text>
          <line x1="-112" y1="10" x2="112" y2="10" stroke="#d97706" strokeWidth="2" />

          {depthSteps.map((step, idx) => {
            const ry = 42 + idx * 54;
            const reached = capLocked && depth >= step.d;
            const current = depth === step.d && phase !== "inf_alarm";
            const gemFill = [
              "url(#jewelSapphire)",
              "url(#jewelAmber)",
              "url(#jewelCoral)",
              "url(#jewelEmerald)",
            ][idx];
            return (
              <g key={`dstep-${step.d}`} transform={`translate(0, ${ry})`}>
                <polygon
                  points="-102,8 -92,-10 -82,8"
                  fill={current || reached ? gemFill : "#fde68a"}
                  stroke={current ? "#881337" : "#78350f"}
                  strokeWidth="1.8"
                />
                <text
                  x="-70"
                  y="3"
                  textAnchor="start"
                  fill={current ? "#be123c" : reached ? "#075985" : "#78350f"}
                  fontSize="12"
                  fontWeight="900"
                  fontFamily="monospace"
                >
                  DEPTH {step.d}
                </text>
                <text
                  x="110"
                  y="3"
                  textAnchor="end"
                  fill={current ? "#be123c" : reached ? "#047857" : "#92400e"}
                  fontSize="11.5"
                  fontWeight="900"
                  fontFamily="monospace"
                >
                  {step.label}
                </text>
                {idx < depthSteps.length - 1 && (
                  <line
                    x1="-92"
                    y1="14"
                    x2="-92"
                    y2="34"
                    stroke={reached && depth > step.d ? "#059669" : "#b45309"}
                    strokeWidth="2.4"
                    strokeDasharray={reached && depth > step.d ? undefined : "4 3"}
                  />
                )}
              </g>
            );
          })}

          <text
            x="0"
            y="246"
            textAnchor="middle"
            fill={phase === "inf_alarm" ? "#be123c" : "#075985"}
            fontSize="10.2"
            fontWeight="900"
            fontFamily="monospace"
          >
            {phase === "inf_alarm"
              ? "COUNT: 81 -> 243 -> ENDLESS!"
              : `ACTIVE COUNT: ${triCount} (×3 EACH STEP)`}
          </text>
        </g>

        {/* CENTER HERO: ~340px CRYSTAL JEWEL TRIANGLE + 3 PRISM NODES */}
        <g className="pointer-events-none">
          <line x1="600" y1="86" x2="600" y2="114" stroke={phase === "inf_alarm" ? "#f43f5e" : "#0284c7"} strokeWidth="4.2" />
          <line x1="396" y1="420" x2="430" y2="408" stroke={phase === "inf_alarm" ? "#f43f5e" : "#f59e0b"} strokeWidth="4.2" />
          <line x1="804" y1="420" x2="770" y2="408" stroke={phase === "inf_alarm" ? "#f43f5e" : "#f43f5e"} strokeWidth="4.2" />

          <polygon
            points="600,114 430,408 770,408"
            fill="#fffbeb"
            fillOpacity="0.6"
            stroke={phase === "inf_alarm" ? "#e11d48" : "#b45309"}
            strokeWidth="2.4"
            strokeDasharray="6 5"
          />
        </g>

        <CornerPrismNodeSVG
          x={600}
          y={84}
          active={depth >= 1 || phase === "complete"}
          alarm={phase === "inf_alarm"}
          jewelFill="url(#jewelSapphire)"
          jewelStroke="#075985"
          label="APEX PRISM"
          labelDx={26}
          labelDy={4}
          labelAnchor="start"
        />
        <CornerPrismNodeSVG
          x={392}
          y={420}
          active={depth >= 1 || phase === "complete"}
          alarm={phase === "inf_alarm"}
          jewelFill="url(#jewelAmber)"
          jewelStroke="#78350f"
          label="CORNER PRISM 2"
          labelDx={-24}
          labelDy={4}
          labelAnchor="end"
        />
        <CornerPrismNodeSVG
          x={808}
          y={420}
          active={depth >= 1 || phase === "complete"}
          alarm={phase === "inf_alarm"}
          jewelFill="url(#jewelCoral)"
          jewelStroke="#881337"
          label="CORNER PRISM 3"
          labelDx={24}
          labelDy={4}
          labelAnchor="start"
        />

        {/* LIVE RECURSIVE SUNLIT JEWEL TRIANGLES */}
        <g
          onClick={handleSubdivide}
          className={phase === "runaway" ? "cursor-default" : "cursor-pointer"}
        >
          {triangles.map((t, idx) => {
            const pts = `${t.ax.toFixed(1)},${t.ay.toFixed(1)} ${t.bx.toFixed(1)},${t.by.toFixed(1)} ${t.cx.toFixed(1)},${t.cy.toFixed(1)}`;
            const paletteIdx =
              depth === 0
                ? 0
                : depth === 1
                ? t.cornerIdx
                : (t.cornerIdx + Math.floor(idx / 3)) % 4;
            const fill =
              phase === "inf_alarm"
                ? "url(#jewelCoral)"
                : jewelFills[paletteIdx];
            return (
              <motion.polygon
                key={`tri-${depth}-${idx}-${pulseTick}`}
                points={pts}
                fill={fill}
                stroke={phase === "inf_alarm" ? "#881337" : "#fef9c3"}
                strokeWidth={depth >= 3 ? 1.3 : depth === 2 ? 1.9 : 2.8}
                strokeLinejoin="round"
                initial={{ opacity: 0.35 }}
                animate={{ opacity: 1 }}
                transition={{ type: "tween", duration: 0.22 }}
              />
            );
          })}

          {depth === 0 && (
            <g className="pointer-events-none">
              <text x="600" y="292" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="900" fontFamily="monospace">
                DEPTH 0: 1 CRYSTAL TRIANGLE
              </text>
              <text x="600" y="314" textAnchor="middle" fill="#fef08a" fontSize="10" fontWeight="900" fontFamily="monospace">
                {capLocked ? "CLICK TRIANGLE OR SUBDIVIDE BELOW" : "SNAP STOP CAP OR TEST SUBDIVIDE!"}
              </text>
            </g>
          )}
        </g>

        {phase === "inf_alarm" && (
          <g transform="translate(600, 308)" className="pointer-events-none">
            <motion.polygon
              points="0,-46 -40,24 40,24"
              fill="none"
              stroke="#e11d48"
              strokeWidth="4"
              animate={{ opacity: [0.95, 0.2, 0.95] }}
              transition={{ type: "tween", repeat: Infinity, duration: 0.7 }}
            />
          </g>
        )}

        {/* RIGHT SIDE: GLOWING GOLDEN-EMERALD BASE CASE CAP ("STOP AT DEPTH 3") */}
        {!capLocked && (
          <g className="pointer-events-none">
            <line
              x1={SOCKET_X}
              y1={LOCK_START_Y + 34}
              x2={SOCKET_X}
              y2={SOCKET_Y - 46}
              stroke="#059669"
              strokeWidth="3"
              strokeDasharray="6 5"
            />
            <polygon
              points={`${SOCKET_X - 7},${SOCKET_Y - 52} ${SOCKET_X + 7},${SOCKET_Y - 52} ${SOCKET_X},${SOCKET_Y - 41}`}
              fill="#059669"
            />
          </g>
        )}

        <g
          transform={`translate(${SOCKET_X}, ${SOCKET_Y})`}
          onClick={snapStopCap}
          className={!capLocked ? "cursor-pointer" : ""}
        >
          {capLocked && (
            <motion.circle
              cx="0"
              cy="0"
              fill="#34d399"
              opacity="0.32"
              animate={{ r: [56, 70, 56] }}
              transition={{ type: "tween", repeat: Infinity, duration: 1.7 }}
            />
          )}
          <rect
            x="-48"
            y="48"
            width="96"
            height="10"
            rx="4"
            fill="url(#brassRich)"
            stroke="#78350f"
            strokeWidth="2"
          />
          <polygon
            points="0,-54 70,-24 70,24 0,54 -70,24 -70,-24"
            fill={capLocked ? "url(#jewelGoldEmerald)" : "#fef3c7"}
            fillOpacity={capLocked ? 1 : 0.86}
            stroke={capLocked ? "#fef08a" : phase === "inf_alarm" ? "#e11d48" : "#d97706"}
            strokeWidth="3.4"
            strokeDasharray={capLocked ? undefined : "7 4"}
          />
          {capLocked && (
            <polygon
              points="0,-44 58,-18 58,18 0,44 -58,18 -58,-18"
              fill="none"
              stroke="#fef08a"
              strokeWidth="1.6"
              opacity="0.78"
            />
          )}
          <text
            x="0"
            y="-14"
            textAnchor="middle"
            fill={capLocked ? "#fef08a" : "#b45309"}
            fontSize="9.2"
            fontWeight="900"
            fontFamily="monospace"
          >
            BASE CASE CAP
          </text>
          <text
            x="0"
            y="8"
            textAnchor="middle"
            fill={capLocked ? "#ffffff" : phase === "inf_alarm" ? "#be123c" : "#78350f"}
            fontSize="11.5"
            fontWeight="900"
            fontFamily="monospace"
          >
            {capLocked ? "STOP AT DEPTH 3" : "NO STOP CAP"}
          </text>
          <text
            x="0"
            y="26"
            textAnchor="middle"
            fill={capLocked ? "#d1fae5" : "#92400e"}
            fontSize="8.6"
            fontWeight="900"
            fontFamily="monospace"
          >
            {capLocked ? "LOCKED (MAX 27)" : "DROP OR TAP JEWEL"}
          </text>
        </g>

        {!capLocked && (
          <g
            transform={`translate(${dragLock ? dragLock.x : LOCK_START_X}, ${dragLock ? dragLock.y : LOCK_START_Y})`}
            onPointerDown={(e) => {
              if (phase === "runaway") return;
              e.stopPropagation();
              svgRef.current?.setPointerCapture(e.pointerId);
              lockMovedRef.current = false;
              setDragLock({ x: LOCK_START_X, y: LOCK_START_Y });
            }}
            className="cursor-grab active:cursor-grabbing"
          >
            <motion.circle
              cx="0"
              cy="0"
              fill="none"
              stroke={phase === "inf_alarm" ? "#e11d48" : "#fef08a"}
              strokeWidth={phase === "inf_alarm" ? 4 : 2.6}
              animate={{ r: [52, 62, 52] }}
              transition={{ type: "tween", repeat: Infinity, duration: phase === "inf_alarm" ? 0.65 : 1.8 }}
            />
            <polygon
              points="0,-42 74,-18 74,18 0,42 -74,18 -74,-18"
              fill="url(#jewelGoldEmerald)"
              stroke="#fef08a"
              strokeWidth="3.2"
            />
            <polygon
              points="0,-33 60,-13 60,13 0,33 -60,13 -60,-13"
              fill="none"
              stroke="#fef9c3"
              strokeWidth="1.6"
              opacity="0.82"
            />
            <text x="0" y="-4" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="900" fontFamily="monospace">
              STOP AT DEPTH 3
            </text>
            <text x="0" y="13" textAnchor="middle" fill="#fef08a" fontSize="8.6" fontWeight="900" fontFamily="monospace">
              GOLDEN-EMERALD CAP
            </text>
          </g>
        )}

        {/* BOTTOM CENTER TACTILE CRYSTAL SUBDIVIDE ACTION BUTTON */}
        <g
          transform="translate(600, 504)"
          onClick={handleSubdivide}
          className={phase === "runaway" || done ? "cursor-default" : "cursor-pointer"}
        >
          <rect
            x="-192"
            y="-28"
            width="384"
            height="56"
            rx="28"
            fill={
              phase === "complete"
                ? "#059669"
                : !capLocked
                ? "#e11d48"
                : "#0284c7"
            }
            stroke="#78350f"
            strokeWidth="3"
          />
          <text x="0" y="5" textAnchor="middle" fill="#ffffff" fontSize="13.5" fontWeight="900" fontFamily="monospace">
            {phase === "runaway"
              ? "SPLITTING ENDLESSLY..."
              : !capLocked
              ? "TEST SUBDIVIDE (NO STOP CAP)"
              : depth < 3
              ? `SUBDIVIDE: DEPTH ${depth} -> ${depth + 1} (${Math.pow(3, depth + 1)} TRIANGLES)`
              : "STOPPED AT DEPTH 3 -> TO 1B!"}
          </text>
        </g>
      </svg>
    </div>
  );
}

/* ============================================================================
   SUBLEVEL 1B — THE RECURSIVE FERN FROND (Botanical Self-Similarity Puzzle)
   Bright sunlit Botanical Fern Conservatory featuring a ~340px tall central
   fern frond on a warm sandstone-and-emerald studio bench (zero rectangular
   boxes). Each side frond visibly mirrors the whole fern plant!
   ============================================================================ */

type FernStopRule = "none" | 2 | 3;

interface FernStemSeg {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  layer: number; // 1 = main stem, 2 = side fronds
  width: number;
}

interface FernLeaflet {
  x: number;
  y: number;
  angleDeg: number;
  len: number;
  width: number;
}

interface FernFuzzMote {
  x: number;
  y: number;
  r: number;
}

function buildRecursiveFern(): {
  mainStem: FernStemSeg[];
  sideFronds: FernStemSeg[];
  leaflets: FernLeaflet[];
  fuzzMotes: FernFuzzMote[];
} {
  const mainStem: FernStemSeg[] = [];
  const sideFronds: FernStemSeg[] = [];
  const leaflets: FernLeaflet[] = [];
  const fuzzMotes: FernFuzzMote[] = [];

  const baseX = 574;
  const baseY = 430;
  const topY = 92; // ~338px tall fern frond!

  // Layer 1: Graceful slightly arched central rachis stem (6 vertical segments)
  const nodes: { x: number; y: number }[] = [
    { x: baseX, y: baseY },
    { x: baseX - 2, y: 374 },
    { x: baseX - 3, y: 312 },
    { x: baseX - 2, y: 250 },
    { x: baseX, y: 192 },
    { x: baseX + 2, y: 142 },
    { x: baseX + 3, y: topY },
  ];
  for (let i = 0; i < nodes.length - 1; i++) {
    mainStem.push({
      x1: nodes[i].x,
      y1: nodes[i].y,
      x2: nodes[i + 1].x,
      y2: nodes[i + 1].y,
      layer: 1,
      width: Math.max(3, 8.5 - i * 1.05),
    });
  }

  // Layer 2: 5 pairs of opposite side fronds (each a miniature copy of the whole fern!)
  const frondSpecs = [
    { nodeIdx: 1, len: 138, tilt: 64, subPairs: 5 },
    { nodeIdx: 2, len: 122, tilt: 60, subPairs: 5 },
    { nodeIdx: 3, len: 98, tilt: 56, subPairs: 4 },
    { nodeIdx: 4, len: 72, tilt: 52, subPairs: 3 },
    { nodeIdx: 5, len: 46, tilt: 46, subPairs: 2 },
  ];

  for (const spec of frondSpecs) {
    const origin = nodes[spec.nodeIdx];
    for (const side of [-1, 1] as const) {
      const angDeg = -90 + side * spec.tilt;
      const rad = (angDeg * Math.PI) / 180;
      const endX = origin.x + Math.cos(rad) * spec.len;
      const endY = origin.y + Math.sin(rad) * spec.len;
      sideFronds.push({
        x1: origin.x,
        y1: origin.y,
        x2: endX,
        y2: endY,
        layer: 2,
        width: Math.max(2.4, spec.len * 0.036),
      });

      // Layer 3: Fine self-similar fern leaflets along both sides of every side frond!
      for (let p = 1; p <= spec.subPairs; p++) {
        const t = p / (spec.subPairs + 0.55);
        const lx = origin.x + (endX - origin.x) * t;
        const ly = origin.y + (endY - origin.y) * t;
        const leafLen = spec.len * 0.34 * (1 - t * 0.56);
        const leafW = leafLen * 0.34;

        for (const lSide of [-1, 1] as const) {
          const leafDeg = angDeg + lSide * 54;
          leaflets.push({
            x: lx,
            y: ly,
            angleDeg: leafDeg,
            len: leafLen,
            width: leafW,
          });
          // Microscopic overflow fuzz positions for NO STOP demonstration
          const lRad = (leafDeg * Math.PI) / 180;
          fuzzMotes.push(
            {
              x: lx + Math.cos(lRad) * (leafLen * 0.95),
              y: ly + Math.sin(lRad) * (leafLen * 0.95),
              r: 3.2,
            },
            {
              x: lx + Math.cos(lRad + 0.3) * (leafLen * 1.15),
              y: ly + Math.sin(lRad + 0.3) * (leafLen * 1.15),
              r: 2.3,
            }
          );
        }
      }
      // Pointed terminal tip leaflet at end of each side frond
      leaflets.push({
        x: endX,
        y: endY,
        angleDeg: angDeg,
        len: Math.max(12, spec.len * 0.2),
        width: Math.max(4, spec.len * 0.07),
      });
    }
  }

  // Crown apex miniature fern tip
  leaflets.push(
    { x: baseX + 3, y: topY + 12, angleDeg: -125, len: 24, width: 7.5 },
    { x: baseX + 3, y: topY + 12, angleDeg: -55, len: 24, width: 7.5 },
    { x: baseX + 3, y: topY, angleDeg: -90, len: 22, width: 7 }
  );

  return { mainStem, sideFronds, leaflets, fuzzMotes };
}

function Sublevel1BRecursiveFern({
  playSwitch,
  playSuccess,
  playError,
  playBeep,
  speak,
  setStatus,
  onRegisterHint,
  onSubComplete,
}: SublevelProps) {
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [stopRule, setStopRule] = useState<FernStopRule>("none");
  const [grownLayer, setGrownLayer] = useState(1); // 1 = stem, 2 = side fronds, 3 = fine leaflets, 4 = micro fuzz overflow
  const [phase, setPhase] = useState<"idle" | "growing" | "inf_fuzz" | "too_early" | "complete">("idle");
  const [done, setDone] = useState(false);

  const fern = useMemo(() => buildRecursiveFern(), []);

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  useEffect(() => {
    onRegisterHint(() => {
      if (stopRule === "none") {
        return "Sublevel 1B: Choose a Leaflet Base Case Stopper on the right (STOP AT 2 LAYERS or STOP AT 3 LAYERS), then click GROW FERN FROND!";
      }
      if (stopRule === 2) {
        return "STOP AT 2 LAYERS stops early with only coarse stems! Switch the Leaflet Base Case Stopper to STOP AT 3 LAYERS to bloom fine self-similar leaflets.";
      }
      if (!done) {
        return "STOP AT 3 LAYERS is set! Click GROW FERN FROND to bloom a lush symmetrical emerald fern.";
      }
      return "BASE CASE REACHED: Stopped cleanly at 3 recursive layers!";
    });
  }, [done, onRegisterHint, stopRule]);

  const selectRule = useCallback(
    (rule: FernStopRule) => {
      if (phase === "growing" || done) return;
      clearTimers();
      playSwitch();
      playBeep(rule === 3 ? 740 : rule === 2 ? 580 : 440);
      setStopRule(rule);
      setGrownLayer(1);
      setPhase("idle");
      setStatus(
        rule === "none"
          ? "NO STOP selected — click GROW FERN FROND to see endless microscopic fuzz!"
          : `STOP AT ${rule} LAYERS selected — click GROW FERN FROND to see what blooms!`,
        "info"
      );
    },
    [clearTimers, done, phase, playBeep, playSwitch, setStatus]
  );

  const handleGrowFern = useCallback(() => {
    if (phase === "growing" || done) return;
    clearTimers();
    playSwitch();
    setPhase("growing");
    setGrownLayer(1);

    const maxL = stopRule === 2 ? 2 : stopRule === 3 ? 3 : 4;
    for (let l = 2; l <= maxL; l++) {
      const t = setTimeout(() => {
        setGrownLayer(l);
        playBeep(440 + l * 105);

        if (l === maxL) {
          if (stopRule === "none") {
            playError();
            setPhase("inf_fuzz");
            setStatus(
              "INFINITE FERN LOOP! Set a Base Case layer limit to stop.",
              "warn"
            );
            speak(
              "Infinite fern loop! Without a Base Case layer limit, leaflets keep spawning microscopic green fuzz forever. Set a layer limit on the right."
            );
          } else if (stopRule === 2) {
            playError();
            setPhase("too_early");
            setStatus(
              "STOPPED TOO EARLY: Needs 3 layers to form fine fern leaflets!",
              "warn"
            );
            speak(
              "Stopped too early! Two layers only grew coarse side stems. Choose Stop at 3 layers so fine self-similar fern leaflets bloom."
            );
          } else {
            playSuccess();
            setPhase("complete");
            setDone(true);
            setStatus(
              "BASE CASE REACHED: Stopped cleanly at 3 recursive layers! Advancing to 1C: Snowflake Carver...",
              "success"
            );
            speak(
              "Base case reached! Stopped cleanly at three recursive layers — every side frond mirrors the whole emerald fern. Moving to Sublevel 1C: The Snowflake Crystal Carver."
            );
            const adv = setTimeout(() => {
              onSubComplete();
            }, 1500);
            timersRef.current.push(adv);
          }
        }
      }, (l - 1) * 320);
      timersRef.current.push(t);
    }
  }, [clearTimers, done, onSubComplete, phase, playBeep, playError, playSuccess, playSwitch, setStatus, speak, stopRule]);

  return (
    <div className="flex-1 min-h-0 w-full relative overflow-hidden select-none">
      {/* FULL-BLEED BRIGHT SUNLIT BOTANICAL FERN CONSERVATORY BACKDROP */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1200 560"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="fernConservatoryBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#93c5fd" />
            <stop offset="28%" stopColor="#e0f2fe" />
            <stop offset="62%" stopColor="#fef9c3" />
            <stop offset="100%" stopColor="#bbf7d0" />
          </linearGradient>
          <radialGradient id="fernSunGlow" cx="46%" cy="28%" r="54%">
            <stop offset="0%" stopColor="#fffbeb" stopOpacity="0.95" />
            <stop offset="45%" stopColor="#fef08a" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#bbf7d0" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="fernGoldenBeamA" x1="0%" y1="0%" x2="35%" y2="100%">
            <stop offset="0%" stopColor="#fef08a" stopOpacity="0.52" />
            <stop offset="55%" stopColor="#fde68a" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#fef9c3" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="fernGoldenBeamB" x1="0%" y1="0%" x2="40%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.46" />
            <stop offset="60%" stopColor="#fef08a" stopOpacity="0.18" />
            <stop offset="100%" stopColor="#dcfce7" stopOpacity="0" />
          </linearGradient>
          <linearGradient id="glasshouseArchStone" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="55%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <linearGradient id="glassPaneTint" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.34" />
            <stop offset="60%" stopColor="#e0f2fe" stopOpacity="0.16" />
            <stop offset="100%" stopColor="#dcfce7" stopOpacity="0.22" />
          </linearGradient>
          <linearGradient id="sandstoneEmeraldBench" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="38%" stopColor="#10b981" />
            <stop offset="100%" stopColor="#065f46" />
          </linearGradient>
        </defs>

        <rect width="1200" height="560" fill="url(#fernConservatoryBg)" />
        <rect width="1200" height="560" fill="url(#fernSunGlow)" />

        {/* WARM SUNLIT BOTANICAL GLASSHOUSE ARCH STRUCTURE */}
        {/* Side Glass Bays */}
        <path d="M 32 452 L 32 140 Q 162 48 292 140 L 292 452 Z" fill="url(#glassPaneTint)" stroke="#d97706" strokeWidth="3" opacity="0.5" />
        <path d="M 858 452 L 858 140 Q 1012 48 1168 140 L 1168 452 Z" fill="url(#glassPaneTint)" stroke="#d97706" strokeWidth="3" opacity="0.5" />

        {/* Grand Central Botanical Glasshouse Arch with Mullion Ribs & Sunlit Glass Fanlight */}
        <path
          d="M 292 452 L 292 162 A 283 184 0 0 1 858 162 L 858 452 Z"
          fill="url(#glassPaneTint)"
          stroke="url(#glasshouseArchStone)"
          strokeWidth="8"
          opacity="0.72"
        />
        <path
          d="M 308 452 L 308 168 A 267 168 0 0 1 842 168 L 842 452"
          fill="none"
          stroke="#fef08a"
          strokeWidth="2.5"
          opacity="0.7"
        />
        {/* Delicate Victorian Glasshouse Roof Mullions & Transoms */}
        <g stroke="#b45309" strokeWidth="1.8" opacity="0.32" fill="none">
          <line x1="292" y1="168" x2="858" y2="168" />
          <line x1="292" y1="296" x2="858" y2="296" />
          <line x1="432" y1="26" x2="432" y2="452" />
          <line x1="575" y1="0" x2="575" y2="452" />
          <line x1="718" y1="26" x2="718" y2="452" />
          <line x1="575" y1="168" x2="364" y2="46" />
          <line x1="575" y1="168" x2="786" y2="46" />
          <line x1="162" y1="92" x2="162" y2="452" />
          <line x1="1012" y1="92" x2="1012" y2="452" />
          <line x1="32" y1="268" x2="292" y2="268" />
          <line x1="858" y1="268" x2="1168" y2="268" />
        </g>

        {/* Soft Distant Conservatory Foliage Silhouettes Framing Lower Corners */}
        <g fill="#059669" opacity="0.16">
          <path d="M 0 452 C 36 392, 92 384, 138 452 Z" />
          <path d="M 68 452 C 102 406, 152 404, 196 452 Z" />
          <path d="M 1012 452 C 1054 398, 1114 394, 1168 452 Z" />
          <path d="M 1072 452 C 1118 386, 1164 388, 1200 452 Z" />
        </g>

        {/* Soft Golden Morning Sunbeams Cascading Through the Glasshouse Arch */}
        <polygon points="150,0 325,0 645,452 430,452" fill="url(#fernGoldenBeamA)" />
        <polygon points="365,0 520,0 812,452 628,452" fill="url(#fernGoldenBeamB)" />
        <polygon points="560,0 675,0 915,452 795,452" fill="url(#fernGoldenBeamA)" opacity="0.65" />

        {/* Warm Sandstone & Emerald Studio Bench Lower Apron */}
        <rect x="0" y="452" width="1200" height="108" fill="url(#sandstoneEmeraldBench)" />
      </svg>

      {/* UNIFIED 1200x560 BOTANICAL FERN CONSERVATORY STAGE */}
      <svg
        viewBox="0 0 1200 560"
        preserveAspectRatio="xMidYMid meet"
        className="relative z-10 w-full h-full touch-none"
      >
        <CommonWorldDefs />
        <defs>
          {/* Lush Layered Emerald-to-Lime Fern Leaflet Gradients */}
          <linearGradient id="fernLeafGrad" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#047857" />
            <stop offset="42%" stopColor="#10b981" />
            <stop offset="78%" stopColor="#4ade80" />
            <stop offset="100%" stopColor="#a3e635" />
          </linearGradient>
          <linearGradient id="fernLeafLime" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#059669" />
            <stop offset="45%" stopColor="#22c55e" />
            <stop offset="82%" stopColor="#84cc16" />
            <stop offset="100%" stopColor="#bef264" />
          </linearGradient>
          {/* Richly Shaded 3D Terracotta Pot & Dark Soil Gradients */}
          <linearGradient id="terracottaBody" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#7c2d12" />
            <stop offset="22%" stopColor="#c2410c" />
            <stop offset="42%" stopColor="#ea580c" />
            <stop offset="68%" stopColor="#c2410c" />
            <stop offset="100%" stopColor="#6b1f09" />
          </linearGradient>
          <linearGradient id="terracottaRim" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#9a3412" />
            <stop offset="28%" stopColor="#f97316" />
            <stop offset="52%" stopColor="#fb923c" />
            <stop offset="78%" stopColor="#ea580c" />
            <stop offset="100%" stopColor="#7c2d12" />
          </linearGradient>
          <radialGradient id="darkSoilGrad" cx="46%" cy="38%" r="58%">
            <stop offset="0%" stopColor="#5c3317" />
            <stop offset="55%" stopColor="#3b1f0b" />
            <stop offset="100%" stopColor="#1c0f05" />
          </radialGradient>
          {/* Brass & Emerald Vertical Depth Gauge Column Gradients */}
          <linearGradient id="gaugeEmeraldGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#a3e635" />
            <stop offset="35%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#059669" />
          </linearGradient>
          <linearGradient id="gaugeAmberGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fde047" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#b45309" />
          </linearGradient>
          <linearGradient id="gaugeCrimsonGlow" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fda4af" />
            <stop offset="50%" stopColor="#f43f5e" />
            <stop offset="100%" stopColor="#9f1239" />
          </linearGradient>
        </defs>

        {/* Warm Sandstone & Brass Bench Rail */}
        <rect x="0" y="446" width="1200" height="9" fill="url(#brassRich)" stroke="#78350f" strokeWidth="1.8" />

        {/* TOP 1-LINE FERN RECURSIVE RULE BANNER */}
        <rect
          x="118"
          y="10"
          width="964"
          height="34"
          rx="17"
          fill={
            phase === "inf_fuzz" || phase === "too_early"
              ? "#be123c"
              : phase === "complete"
              ? "#059669"
              : "#047857"
          }
          stroke="#fef08a"
          strokeWidth="2.2"
        />
        <text x="600" y="31" textAnchor="middle" fill="#ffffff" fontSize="10.8" fontWeight="900" fontFamily="monospace">
          {phase === "inf_fuzz"
            ? "INFINITE FERN LOOP! Set a Base Case layer limit to stop."
            : phase === "too_early"
            ? "STOPPED TOO EARLY: Needs 3 layers to form fine fern leaflets!"
            : phase === "complete"
            ? "BASE CASE REACHED: Stopped cleanly at 3 recursive layers!"
            : "RECURSIVE RULE: Draw main stem -> Sprout miniature copies of the whole fern on left & right!"}
        </text>

        {/* LEFT BORDERLESS BOTANICAL LAYER TRACKER */}
        <g transform="translate(158, 146)" className="pointer-events-none">
          <text x="0" y="0" textAnchor="middle" fill="#065f46" fontSize="10.8" fontWeight="900" fontFamily="monospace">
            FERN LAYERS
          </text>
          <line x1="-102" y1="10" x2="102" y2="10" stroke="#059669" strokeWidth="2" />
          {[
            { l: 1, title: "LAYER 1", sub: "MAIN STEM" },
            { l: 2, title: "LAYER 2", sub: "SIDE FRONDS" },
            { l: 3, title: "LAYER 3", sub: "FINE LEAFLETS" },
          ].map((row, idx) => {
            const lit = grownLayer >= row.l;
            const ry = 46 + idx * 54;
            return (
              <g key={`fl-${row.l}`} transform={`translate(0, ${ry})`}>
                <path
                  d="M -96 4 C -92 -6, -82 -10, -74 -6 C -78 4, -88 10, -96 4 Z"
                  fill={lit ? "url(#fernLeafLime)" : "#fde68a"}
                  stroke="#064e3b"
                  strokeWidth="1.6"
                />
                <text x="-62" y="0" textAnchor="start" fill={lit ? "#065f46" : "#78350f"} fontSize="11.5" fontWeight="900" fontFamily="monospace">
                  {row.title}
                </text>
                <text x="-62" y="14" textAnchor="start" fill={lit ? "#047857" : "#92400e"} fontSize="9.2" fontWeight="900" fontFamily="monospace">
                  {row.sub}
                </text>
              </g>
            );
          })}
          {phase === "inf_fuzz" && (
            <motion.text
              x="0"
              y="220"
              textAnchor="middle"
              fill="#be123c"
              fontSize="10.2"
              fontWeight="900"
              fontFamily="monospace"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ type: "tween", repeat: Infinity, duration: 0.6 }}
            >
              LAYER 4 -&gt; ∞: MICRO FUZZ!
            </motion.text>
          )}
        </g>

        {/* ====================================================================
            CENTER HERO: ~340px TALL SELF-SIMILAR RECURSIVE FERN FROND
            ==================================================================== */}
        {/* Dark Soil Mound (Behind Fern Stem So Rachis Emerges Naturally From Soil) */}
        <g transform="translate(574, 446)" className="pointer-events-none">
          <ellipse cx="0" cy="-36" rx="46" ry="11" fill="url(#darkSoilGrad)" stroke="#291507" strokeWidth="1.4" />
          <circle cx="-22" cy="-37" r="2.2" fill="#78350f" opacity="0.7" />
          <circle cx="18" cy="-39" r="1.8" fill="#5c3317" opacity="0.8" />
          <circle cx="9" cy="-36" r="2.1" fill="#291507" opacity="0.75" />
          <circle cx="-11" cy="-39" r="1.7" fill="#78350f" opacity="0.68" />
        </g>

        {/* Faint Botanical Blueprint Outline Showing Full 3-Layer Fern Silhouette */}
        <g className="pointer-events-none" opacity={phase === "complete" ? 0.08 : 0.28}>
          {fern.sideFronds.map((sf, idx) => (
            <line
              key={`fbp-sf-${idx}`}
              x1={sf.x1}
              y1={sf.y1}
              x2={sf.x2}
              y2={sf.y2}
              stroke="#059669"
              strokeWidth="2"
              strokeDasharray="4 4"
            />
          ))}
          {fern.leaflets.map((lf, idx) => (
            <g key={`fbp-lf-${idx}`} transform={`translate(${lf.x.toFixed(1)}, ${lf.y.toFixed(1)}) rotate(${lf.angleDeg.toFixed(1)})`}>
              <path
                d={`M 0 0 Q ${(lf.len * 0.45).toFixed(1)} ${(-lf.width).toFixed(1)}, ${lf.len.toFixed(1)} 0 Q ${(lf.len * 0.45).toFixed(1)} ${lf.width.toFixed(1)}, 0 0 Z`}
                fill="none"
                stroke="#059669"
                strokeWidth="1.2"
                strokeDasharray="3 3"
              />
            </g>
          ))}
        </g>

        {/* LAYER 1: MAIN FERN RACHIS STEM */}
        <g className="pointer-events-none">
          {fern.mainStem.map((s, idx) => (
            <g key={`fms-${idx}`}>
              <line
                x1={s.x1}
                y1={s.y1}
                x2={s.x2}
                y2={s.y2}
                stroke="#064e3b"
                strokeWidth={s.width + 1.2}
                strokeLinecap="round"
              />
              <line
                x1={s.x1}
                y1={s.y1}
                x2={s.x2}
                y2={s.y2}
                stroke="#10b981"
                strokeWidth={Math.max(1.8, s.width * 0.56)}
                strokeLinecap="round"
              />
            </g>
          ))}
        </g>

        {/* Richly Shaded Terracotta Pot Front Collar & Body Seated Flush on y=446 Bench */}
        <g transform="translate(574, 446)" className="pointer-events-none">
          {/* Contact shadow grounded on sandstone-brass bench */}
          <ellipse cx="0" cy="1" rx="54" ry="5.5" fill="#451a03" opacity="0.34" />
          {/* Tapered Ceramic Terracotta Body */}
          <path
            d="M -48 -32 L 48 -32 L 36 0 L -36 0 Z"
            fill="url(#terracottaBody)"
            stroke="#7c2d12"
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          {/* Subtle Rim Cast Shadow & Embossed Clay Band */}
          <path d="M -46 -28 L 46 -28 L 44 -23 L -44 -23 Z" fill="#451a03" opacity="0.34" />
          <line x1="-40" y1="-12" x2="40" y2="-12" stroke="#fdba74" strokeWidth="1.3" opacity="0.45" />
          {/* Sunlit Left Specular Ceramic Glaze */}
          <path d="M -33 -25 L -25 -4" stroke="#fed7aa" strokeWidth="3" strokeLinecap="round" opacity="0.42" />
          {/* Beveled Terracotta Pot Collar Lip Wrapping Soil */}
          <rect
            x="-56"
            y="-38"
            width="112"
            height="12"
            rx="5.5"
            fill="url(#terracottaRim)"
            stroke="#7c2d12"
            strokeWidth="2.2"
          />
          <line x1="-46" y1="-34" x2="24" y2="-34" stroke="#ffedd5" strokeWidth="1.8" strokeLinecap="round" opacity="0.54" />
        </g>

        {/* LAYER 2: MINIATURE SIDE FROND STEMS (LEFT & RIGHT) */}
        {grownLayer >= 2 && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "tween", duration: 0.25 }}
            className="pointer-events-none"
          >
            {fern.sideFronds.map((sf, idx) => (
              <g key={`fsf-${idx}`}>
                <line
                  x1={sf.x1}
                  y1={sf.y1}
                  x2={sf.x2}
                  y2={sf.y2}
                  stroke={phase === "too_early" ? "#b45309" : "#065f46"}
                  strokeWidth={sf.width + 0.9}
                  strokeLinecap="round"
                />
                <line
                  x1={sf.x1}
                  y1={sf.y1}
                  x2={sf.x2}
                  y2={sf.y2}
                  stroke={phase === "too_early" ? "#fbbf24" : "#34d399"}
                  strokeWidth={Math.max(1.2, sf.width * 0.48)}
                  strokeLinecap="round"
                />
              </g>
            ))}
          </motion.g>
        )}

        {/* LAYER 3: LUSH LAYERED EMERALD-TO-LIME FERN LEAFLETS (Each Side Frond Mirrors Whole Plant!) */}
        {grownLayer >= 3 && (
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ type: "tween", duration: 0.28 }}
            className="pointer-events-none"
          >
            {fern.leaflets.map((lf, idx) => (
              <g
                key={`flf-${idx}`}
                transform={`translate(${lf.x.toFixed(1)}, ${lf.y.toFixed(1)}) rotate(${lf.angleDeg.toFixed(1)})`}
              >
                {/* Rich emerald-to-lime leaflet blade */}
                <path
                  d={`M 0 0 Q ${(lf.len * 0.46).toFixed(1)} ${(-lf.width).toFixed(1)}, ${lf.len.toFixed(1)} 0 Q ${(lf.len * 0.46).toFixed(1)} ${lf.width.toFixed(1)}, 0 0 Z`}
                  fill={idx % 2 === 0 ? "url(#fernLeafGrad)" : "url(#fernLeafLime)"}
                  stroke="#064e3b"
                  strokeWidth="1.05"
                />
                {/* Lower shaded half for organic botanical depth */}
                <path
                  d={`M 0 0 L ${lf.len.toFixed(1)} 0 Q ${(lf.len * 0.46).toFixed(1)} ${(lf.width * 0.88).toFixed(1)}, 0 0 Z`}
                  fill="#047857"
                  opacity="0.22"
                />
                {/* Luminous lime midrib vein */}
                <line x1="2" y1="0" x2={(lf.len * 0.84).toFixed(1)} y2="0" stroke="#d9f99d" strokeWidth="0.95" opacity="0.92" />
              </g>
            ))}
          </motion.g>
        )}

        {/* LAYER 4+ MICROSCOPIC GREEN FUZZ OVERFLOW WHEN NO STOP */}
        {phase === "inf_fuzz" && (
          <motion.g
            animate={{ opacity: [0.95, 0.28, 0.95] }}
            transition={{ type: "tween", repeat: Infinity, duration: 0.48 }}
            className="pointer-events-none"
          >
            {fern.fuzzMotes.map((m, idx) => (
              <circle
                key={`fuzz-${idx}`}
                cx={m.x.toFixed(1)}
                cy={m.y.toFixed(1)}
                r={m.r}
                fill={idx % 3 === 0 ? "#f43f5e" : "#4ade80"}
                stroke="#064e3b"
                strokeWidth="0.6"
              />
            ))}
          </motion.g>
        )}

        {/* SELF-SIMILARITY CALLOUT RING: HIGHLIGHTS ONE SIDE FROND AS A MINI WHOLE FERN */}
        <g className="pointer-events-none" opacity={grownLayer >= 2 ? 1 : 0.78}>
          {/* Subtle glowing outer halo */}
          <circle
            cx="624"
            cy="222"
            r="48"
            fill="#fef08a"
            fillOpacity={grownLayer >= 3 ? 0.14 : 0.08}
            stroke="#fde047"
            strokeWidth="6"
            strokeOpacity={grownLayer >= 3 ? 0.34 : 0.2}
          />
          {/* Crisp glowing dotted self-similarity circle */}
          <motion.circle
            cx="624"
            cy="222"
            r="48"
            fill="none"
            stroke="#f59e0b"
            strokeWidth="2.4"
            strokeDasharray="6 5"
            strokeLinecap="round"
            animate={{ opacity: [0.96, 0.55, 0.96] }}
            transition={{ type: "tween", repeat: Infinity, duration: 2.2 }}
          />
          {/* Curved golden pointer connecting ring cleanly up-right to crisp 1-line tag */}
          <circle cx="659" cy="189" r="3.8" fill="#fef08a" stroke="#b45309" strokeWidth="1.6" />
          <path
            d="M 662 186 Q 684 156, 712 142"
            fill="none"
            stroke="#b45309"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          {/* Crisp 1-line Self-Similarity Tag */}
          <rect
            x="686"
            y="112"
            width="212"
            height="28"
            rx="14"
            fill="#065f46"
            stroke="#fde047"
            strokeWidth="2"
          />
          <text
            x="792"
            y="130"
            textAnchor="middle"
            fill="#fef9c3"
            fontSize="9.6"
            fontWeight="900"
            fontFamily="monospace"
          >
            1 SIDE FROND = MINI WHOLE FERN
          </text>
        </g>

        {/* ====================================================================
            RIGHT SIDE: TACTILE VERTICAL BRASS & EMERALD DEPTH STOPPER GAUGE
            ==================================================================== */}
        <g transform="translate(946, 0)">
          <text x="86" y="88" textAnchor="middle" fill="#065f46" fontSize="10.2" fontWeight="900" fontFamily="monospace">
            DEPTH STOPPER
          </text>
          <line x1="16" y1="97" x2="156" y2="97" stroke="#b45309" strokeWidth="1.8" opacity="0.65" />

          {/* Grounded Brass & Emerald Pedestal Base Seated Flush on y=446 Bench */}
          <g className="pointer-events-none">
            <rect x="-26" y="422" width="52" height="24" rx="5" fill="url(#brassRich)" stroke="#78350f" strokeWidth="2" />
            <rect x="-32" y="438" width="64" height="8" rx="3" fill="#b45309" stroke="#78350f" strokeWidth="1.8" />
            <circle cx="0" cy="431" r="4.5" fill="#10b981" stroke="#fef08a" strokeWidth="1.2" />

            {/* Sculpted Turned-Brass Crown Finial */}
            <path d="M -18 122 L 18 122 L 11 108 L -11 108 Z" fill="url(#brassRich)" stroke="#78350f" strokeWidth="1.8" />
            <circle cx="0" cy="102" r="7" fill="#10b981" stroke="#78350f" strokeWidth="2" />
            <circle cx="-2" cy="100" r="2.2" fill="#d9f99d" />

            {/* Vertical Brushed-Brass Gauge Column Housing */}
            <rect
              x="-16"
              y="120"
              width="32"
              height="304"
              rx="16"
              fill="url(#brassRich)"
              stroke="#78350f"
              strokeWidth="2.4"
            />
            {/* Recessed Dark-Emerald Glass Gauge Channel */}
            <rect
              x="-8"
              y="134"
              width="16"
              height="276"
              rx="8"
              fill="#022c22"
              stroke="#064e3b"
              strokeWidth="1.4"
            />

            {/* Smoothly Illuminated Emerald / Amber / Crimson Depth Level Column */}
            <motion.rect
              x="-6.5"
              width="13"
              rx="6.5"
              initial={false}
              animate={{
                y: stopRule === 3 ? 150 : stopRule === 2 ? 250 : 346,
                height: stopRule === 3 ? 256 : stopRule === 2 ? 156 : 60,
              }}
              transition={{ type: "tween", duration: 0.34, ease: "easeOut" }}
              fill={
                stopRule === 3
                  ? "url(#gaugeEmeraldGlow)"
                  : stopRule === 2
                  ? "url(#gaugeAmberGlow)"
                  : "url(#gaugeCrimsonGlow)"
              }
            />
            {/* Glass Tube Specular Reflection Highlight */}
            <rect x="-4.5" y="140" width="2.8" height="264" rx="1.4" fill="#ffffff" opacity="0.28" />

            {/* Brass Measurement Graduation Ticks Along Left Edge */}
            {[158, 189, 220, 252, 284, 315, 346, 378].map((ty, idx) => (
              <line
                key={`gtick-${ty}`}
                x1={idx % 3 === 0 ? -15 : -13}
                y1={ty}
                x2="-9"
                y2={ty}
                stroke="#fef08a"
                strokeWidth={idx % 3 === 0 ? 1.8 : 1.1}
                opacity={idx % 3 === 0 ? 0.95 : 0.65}
              />
            ))}

            {/* Smoothly Gliding Brass & Jewel Indicator Collar */}
            <motion.g
              initial={false}
              animate={{ y: stopRule === 3 ? 158 : stopRule === 2 ? 252 : 346 }}
              transition={{ type: "tween", duration: 0.32, ease: "easeOut" }}
            >
              <rect
                x="-21"
                y="-11"
                width="42"
                height="22"
                rx="11"
                fill="url(#brassRich)"
                stroke="#78350f"
                strokeWidth="2"
              />
              <polygon points="18,-6 29,0 18,6" fill="#fef08a" stroke="#78350f" strokeWidth="1.5" />
              <circle
                cx="0"
                cy="0"
                r="5.5"
                fill={stopRule === 3 ? "#34d399" : stopRule === 2 ? "#fbbf24" : "#fb7185"}
                stroke="#ffffff"
                strokeWidth="1.4"
              />
            </motion.g>
          </g>

          {/* THREE DISTINCT INTERACTIVE NOTCHES ALONG THE DEPTH GAUGE */}
          {[
            { rule: 3 as FernStopRule, y: 158, label: "STOP AT 3 LAYERS", sub: "FINE LEAFLETS" },
            { rule: 2 as FernStopRule, y: 252, label: "STOP AT 2 LAYERS", sub: "SIDE STEMS ONLY" },
            { rule: "none" as FernStopRule, y: 346, label: "NO STOP", sub: "INFINITE FUZZ" },
          ].map((item) => {
            const active = stopRule === item.rule;
            const activeFill =
              item.rule === "none" ? "#be123c" : item.rule === 3 ? "#059669" : "#d97706";
            const activeGlow =
              item.rule === "none" ? "#fda4af" : item.rule === 3 ? "#6ee7b7" : "#fde68a";
            return (
              <g
                key={`fstop-${String(item.rule)}`}
                transform={`translate(0, ${item.y})`}
                onClick={() => selectRule(item.rule)}
                className={phase === "growing" || done ? "cursor-default" : "cursor-pointer"}
              >
                {/* Machined Brass Notch Connector */}
                <line
                  x1="16"
                  y1="0"
                  x2="34"
                  y2="0"
                  stroke={active ? "#fef08a" : "#b45309"}
                  strokeWidth={active ? 3.5 : 2.2}
                />
                {/* Soft Illuminated Aura Behind Active Notch */}
                {active && (
                  <rect
                    x="30"
                    y="-27"
                    width="180"
                    height="54"
                    rx="27"
                    fill={activeFill}
                    opacity="0.22"
                  />
                )}
                {/* Sculpted Brass-Rimmed Tactile Notch Pill */}
                <rect
                  x="34"
                  y="-23"
                  width="172"
                  height="46"
                  rx="23"
                  fill={active ? activeFill : "#fef3c7"}
                  stroke={active ? "#fef08a" : "#b45309"}
                  strokeWidth={active ? 3 : 2.2}
                />
                {/* Status Indicator Jewel Inside Notch */}
                <circle
                  cx="54"
                  cy="0"
                  r="7.5"
                  fill={active ? activeGlow : "#e2e8f0"}
                  stroke={active ? "#ffffff" : "#065f46"}
                  strokeWidth="1.6"
                />
                <text
                  x="70"
                  y="-2"
                  textAnchor="start"
                  fill={active ? "#ffffff" : "#064e3b"}
                  fontSize="10.4"
                  fontWeight="900"
                  fontFamily="monospace"
                >
                  {item.label}
                </text>
                <text
                  x="70"
                  y="12"
                  textAnchor="start"
                  fill={active ? "#fef08a" : "#92400e"}
                  fontSize="8.4"
                  fontWeight="900"
                  fontFamily="monospace"
                >
                  {item.sub}
                </text>
              </g>
            );
          })}
        </g>

        {/* BOTTOM CENTER TACTILE "GROW FERN FROND" ACTION BUTTON */}
        <g
          transform="translate(574, 504)"
          onClick={handleGrowFern}
          className={phase === "growing" || done ? "cursor-default" : "cursor-pointer"}
        >
          <rect
            x="-186"
            y="-28"
            width="372"
            height="56"
            rx="28"
            fill={
              phase === "complete"
                ? "#059669"
                : stopRule === 3
                ? "#047857"
                : "#d97706"
            }
            stroke="#fef08a"
            strokeWidth="3"
          />
          <text x="0" y="5" textAnchor="middle" fill="#ffffff" fontSize="14" fontWeight="900" fontFamily="monospace">
            {phase === "growing"
              ? `GROWING LAYER ${grownLayer}...`
              : phase === "complete"
              ? "3 FERN LAYERS GROWN -> TO 1C!"
              : "GROW FERN FROND"}
          </text>
        </g>
      </svg>
    </div>
  );
}

/* ============================================================================
   SUBLEVEL 1C — THE SNOWFLAKE CRYSTAL CARVER (6-Fold Fractal Branching)
   Bright glacier-blue Arctic Crystal Table showing a large central 6-Point Ice
   Core overlaid on a glowing 3-Layer Snowflake Blueprint, paired with a
   vertical Cloud Freeze Thermostat (NO STOP, STOP AT DEPTH 2, STOP AT DEPTH 3).
   ============================================================================ */

type FreezeDepthRule = "none" | 2 | 3;

interface SnowflakeSeg {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  layer: number; // 1 = core arms, 2 = 3-way sub-branches, 3 = 3-way tips, 4 = overgrowth
}

function buildSnowflakeSegments(maxLayer: number): SnowflakeSeg[] {
  const cx = 574;
  const cy = 248;
  const segs: SnowflakeSeg[] = [];
  const lens = [0, 74, 46, 30, 38];

  const sprout = (x: number, y: number, angDeg: number, layer: number) => {
    if (layer > maxLayer) return;
    const len = lens[layer];
    const rad = (angDeg * Math.PI) / 180;
    const x2 = x + Math.cos(rad) * len;
    const y2 = y + Math.sin(rad) * len;
    segs.push({ x1: x, y1: y, x2, y2, layer });

    if (layer < maxLayer) {
      const spread = layer === 1 ? 46 : layer === 2 ? 42 : 34;
      sprout(x2, y2, angDeg - spread, layer + 1);
      sprout(x2, y2, angDeg, layer + 1);
      sprout(x2, y2, angDeg + spread, layer + 1);
    }
  };

  for (let i = 0; i < 6; i++) {
    sprout(cx, cy, -90 + i * 60, 1);
  }
  return segs;
}

function Sublevel1CSnowflakeCarver({
  playSwitch,
  playSuccess,
  playError,
  playBeep,
  speak,
  setStatus,
  onRegisterHint,
  onLevelComplete,
}: StudioLevelProps) {
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [freezeRule, setFreezeRule] = useState<FreezeDepthRule>("none");
  const [grownLayer, setGrownLayer] = useState(1); // 1 = 6-Point Ice Core always visible; 2, 3, or 4 (overflow!)
  const [phase, setPhase] = useState<"idle" | "freezing" | "inf_frost" | "too_early" | "complete">("idle");
  const [solved, setSolved] = useState(false);

  const blueprintSegs = useMemo(() => buildSnowflakeSegments(3), []);
  const allSegs = useMemo(() => buildSnowflakeSegments(4), []);
  const visibleSegs = useMemo(
    () => allSegs.filter((s) => s.layer <= grownLayer),
    [allSegs, grownLayer]
  );

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  useEffect(() => {
    onRegisterHint(() => {
      if (freezeRule === "none") {
        return "Sublevel 1C: Set the vertical Cloud Freeze Thermostat on the right (STOP AT DEPTH 2 or STOP AT DEPTH 3) before clicking FREEZE CRYSTAL!";
      }
      if (freezeRule === 2) {
        return "STOP AT DEPTH 2 grows 36 tips — one layer short of the glowing blueprint! Raise the Cloud Freeze Thermostat to STOP AT DEPTH 3 (216 tips).";
      }
      if (!solved) {
        return "Cloud Freeze Thermostat is set to STOP AT DEPTH 3! Click FREEZE CRYSTAL to crystallize all 3 layers cleanly inside the blueprint.";
      }
      return "BASE CASE COMPLETE: Stopped at Depth 3 — Snowflake matched!";
    });
  }, [freezeRule, onRegisterHint, solved]);

  const selectFreezeRule = useCallback(
    (rule: FreezeDepthRule) => {
      if (phase === "freezing" || solved) return;
      clearTimers();
      playSwitch();
      playBeep(rule === 3 ? 760 : rule === 2 ? 600 : 440);
      setFreezeRule(rule);
      setGrownLayer(1);
      setPhase("idle");
      setStatus(
        rule === "none"
          ? "NO STOP selected on the Cloud Freeze Thermostat — click FREEZE CRYSTAL to see runaway frost!"
          : `STOP AT DEPTH ${rule} set on the Cloud Freeze Thermostat — click FREEZE CRYSTAL to test it!`,
        "info"
      );
    },
    [clearTimers, phase, playBeep, playSwitch, setStatus, solved]
  );

  const handleFreezeCrystal = useCallback(() => {
    if (phase === "freezing" || solved) return;
    clearTimers();
    playSwitch();
    setPhase("freezing");
    setGrownLayer(1);

    const maxLayer = freezeRule === 2 ? 2 : freezeRule === 3 ? 3 : 4;
    for (let l = 2; l <= maxLayer; l++) {
      const t = setTimeout(() => {
        setGrownLayer(l);
        playBeep(480 + l * 105);

        if (l === maxLayer) {
          if (freezeRule === "none") {
            playError();
            setPhase("inf_frost");
            setStatus(
              "INFINITE CRYSTAL LOOP! Set a Base Case freeze depth to stop.",
              "warn"
            );
            speak(
              "Infinite crystal loop! Without a Base Case freeze depth, ice branches overgrow past the blueprint forever. Set the Cloud Freeze Thermostat on the right."
            );
          } else if (freezeRule === 2) {
            playError();
            setPhase("too_early");
            setStatus(
              "STOPPED TOO EARLY: 36 tips grown — blueprint needs Depth 3!",
              "warn"
            );
            speak(
              "Stopped too early! Thirty-six crystal tips grew, leaving the outer snowflake blueprint ring empty. Set the Cloud Freeze Thermostat to Stop at Depth 3."
            );
          } else {
            playSuccess();
            setPhase("complete");
            setStatus(
              "BASE CASE COMPLETE: Stopped at Depth 3 — Snowflake matched!",
              "success"
            );
            speak(
              "Base case complete! Stopped cleanly at Depth 3 with two hundred sixteen crystal tips matching the snowflake blueprint. Click Next Level to enter Level 2!"
            );
            if (!solved) {
              setSolved(true);
              onLevelComplete(35);
            }
          }
        }
      }, (l - 1) * 340);
      timersRef.current.push(t);
    }
  }, [clearTimers, freezeRule, onLevelComplete, phase, playBeep, playError, playSuccess, playSwitch, setStatus, solved, speak]);

  const tipDisplay =
    grownLayer === 1
      ? "6 CORE ARMS"
      : grownLayer === 2
      ? "36 TIPS"
      : grownLayer === 3
      ? "216 TIPS"
      : "1,296+ -> ∞!";

  // Mercury/frost column top Y inside the vertical silver-and-ice Cloud Freeze Thermostat tube
  const thermoFillTopY = freezeRule === 3 ? 148 : freezeRule === 2 ? 248 : 344;

  // Subtle floating snow-crystal motes drifting across the Arctic Crystal Table
  const snowMotes = [
    { x: 266, y: 120, s: 5.5, dur: 4.2 },
    { x: 342, y: 318, s: 4.5, dur: 5.1 },
    { x: 422, y: 110, s: 4, dur: 3.8 },
    { x: 742, y: 122, s: 5, dur: 4.6 },
    { x: 814, y: 298, s: 5.5, dur: 4.9 },
    { x: 766, y: 382, s: 4, dur: 4.0 },
    { x: 318, y: 402, s: 4.8, dur: 5.3 },
  ];

  return (
    <div className="flex-1 min-h-0 w-full relative overflow-hidden select-none">
      {/* FULL-BLEED BRIGHT GLACIER-BLUE ARCTIC CRYSTAL TABLE BACKDROP */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1200 560"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="arcticCrystalBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="48%" stopColor="#e0f2fe" />
            <stop offset="100%" stopColor="#bae6fd" />
          </linearGradient>
          <radialGradient id="arcticAura" cx="48%" cy="44%" r="45%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.94" />
            <stop offset="100%" stopColor="#bae6fd" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="arcticIceApron" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="55%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#075985" />
          </linearGradient>
        </defs>
        <rect width="1200" height="560" fill="url(#arcticCrystalBg)" />
        <rect width="1200" height="560" fill="url(#arcticAura)" />
        {/* Sunlit Northern Crystal Beams */}
        <polygon points="160,0 380,0 740,452 490,452" fill="#ffffff" opacity="0.3" />
        <polygon points="560,0 740,0 1080,452 860,452" fill="#f0f9ff" opacity="0.24" />
        <rect x="0" y="452" width="1200" height="108" fill="url(#arcticIceApron)" />
      </svg>

      {/* UNIFIED 1200x560 SNOWFLAKE CRYSTAL CARVER STAGE */}
      <svg
        viewBox="0 0 1200 560"
        preserveAspectRatio="xMidYMid meet"
        className="relative z-10 w-full h-full touch-none"
      >
        <CommonWorldDefs />
        <defs>
          <linearGradient id="iceSapphireArm" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#38bdf8" />
            <stop offset="52%" stopColor="#0284c7" />
            <stop offset="100%" stopColor="#075985" />
          </linearGradient>
          <linearGradient id="iceDiamondTip" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="52%" stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <linearGradient id="iceCoreFacet" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#ffffff" />
            <stop offset="45%" stopColor="#67e8f9" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <linearGradient id="thermoMercuryIce" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="55%" stopColor="#38bdf8" />
            <stop offset="100%" stopColor="#e0f2fe" />
          </linearGradient>
        </defs>

        <rect x="0" y="446" width="1200" height="9" fill="url(#silverSteel)" stroke="#075985" strokeWidth="1.8" />

        {/* SUBTLE FLOATING SNOW-CRYSTAL MOTES */}
        <g className="pointer-events-none">
          {snowMotes.map((m, i) => (
            <motion.g
              key={`mote-${i}`}
              transform={`translate(${m.x}, ${m.y})`}
              animate={{ opacity: [0.25, 0.85, 0.25] }}
              transition={{ type: "tween", repeat: Infinity, duration: m.dur }}
            >
              <polygon
                points={`0,${-m.s} ${(m.s * 0.65).toFixed(1)},0 0,${m.s} ${(-m.s * 0.65).toFixed(1)},0`}
                fill="#ffffff"
                stroke="#7dd3fc"
                strokeWidth="1"
              />
            </motion.g>
          ))}
        </g>

        {/* TOP 1-LINE SNOWFLAKE RECURSION RULE BANNER */}
        <rect
          x="136"
          y="10"
          width="928"
          height="34"
          rx="17"
          fill={
            phase === "inf_frost" || phase === "too_early"
              ? "#be123c"
              : phase === "complete"
              ? "#059669"
              : "#0369a1"
          }
          stroke="#e0f2fe"
          strokeWidth="2.2"
        />
        <text x="600" y="31" textAnchor="middle" fill="#ffffff" fontSize="11.2" fontWeight="900" fontFamily="monospace">
          {phase === "inf_frost"
            ? "INFINITE CRYSTAL LOOP! Set a Base Case freeze depth to stop."
            : phase === "too_early"
            ? "STOPPED TOO EARLY: 36 tips grown — blueprint needs Depth 3!"
            : phase === "complete"
            ? "BASE CASE COMPLETE: Stopped at Depth 3 — Snowflake matched!"
            : "RECURSIVE RULE: Every ice tip sprouts 3 smaller crystal branches!"}
        </text>

        {/* LEFT BORDERLESS ARCTIC LAYER & TIP COUNTER */}
        <g transform="translate(154, 146)" className="pointer-events-none">
          <text x="0" y="0" textAnchor="middle" fill="#075985" fontSize="10.8" fontWeight="900" fontFamily="monospace">
            SNOWFLAKE LAYERS
          </text>
          <line x1="-102" y1="10" x2="102" y2="10" stroke="#0284c7" strokeWidth="2" />
          {[
            { l: 1, label: "DEPTH 1", count: "6 ARMS" },
            { l: 2, label: "DEPTH 2", count: "36 TIPS" },
            { l: 3, label: "DEPTH 3", count: "216 TIPS" },
          ].map((row, idx) => {
            const lit = grownLayer >= row.l;
            const ry = 46 + idx * 52;
            return (
              <g key={`snl-${row.l}`} transform={`translate(0, ${ry})`}>
                <polygon
                  points="-86,-9 -77,0 -86,9 -95,0"
                  fill={lit ? "url(#iceDiamondTip)" : "#bae6fd"}
                  stroke="#075985"
                  strokeWidth="1.8"
                />
                <text x="-64" y="4" textAnchor="start" fill={lit ? "#075985" : "#475569"} fontSize="11.5" fontWeight="900" fontFamily="monospace">
                  {row.label}
                </text>
                <text x="98" y="4" textAnchor="end" fill={lit ? "#0369a1" : "#64748b"} fontSize="11.2" fontWeight="900" fontFamily="monospace">
                  {row.count}
                </text>
              </g>
            );
          })}
          <text
            x="0"
            y="214"
            textAnchor="middle"
            fill={phase === "inf_frost" ? "#be123c" : phase === "complete" ? "#047857" : "#0369a1"}
            fontSize="11"
            fontWeight="900"
            fontFamily="monospace"
          >
            ACTIVE: {tipDisplay}
          </text>
        </g>

        {/* ====================================================================
            CENTER HERO: FACETED ICE-SAPPHIRE & FROST-WHITE SNOWFLAKE + DIAMOND TIPS
            ==================================================================== */}
        {/* Soft Circular Frost Halo & Outer Target Ring */}
        <g transform="translate(574, 248)" className="pointer-events-none">
          {phase === "complete" && (
            <motion.circle
              cx="0"
              cy="0"
              fill="#e0f2fe"
              opacity="0.55"
              animate={{ r: [158, 172, 158] }}
              transition={{ type: "tween", repeat: Infinity, duration: 1.8 }}
            />
          )}
          <circle cx="0" cy="0" r="158" fill="#ffffff" fillOpacity="0.46" stroke="#38bdf8" strokeWidth="2.2" strokeDasharray="7 6" />
          <circle cx="0" cy="0" r="118" fill="none" stroke="#7dd3fc" strokeWidth="1.6" strokeDasharray="5 5" opacity="0.65" />
          <circle cx="0" cy="0" r="74" fill="none" stroke="#bae6fd" strokeWidth="1.4" strokeDasharray="4 4" opacity="0.7" />
        </g>

        {/* GLOWING 3-LAYER SNOWFLAKE BLUEPRINT OUTLINE */}
        <g className="pointer-events-none" opacity={phase === "complete" ? 0.14 : 0.44}>
          {blueprintSegs.map((seg, idx) => (
            <line
              key={`sbp-${idx}`}
              x1={seg.x1}
              y1={seg.y1}
              x2={seg.x2}
              y2={seg.y2}
              stroke="#0284c7"
              strokeWidth={seg.layer === 1 ? 6 : seg.layer === 2 ? 3.6 : 2.2}
              strokeDasharray="4 4"
              strokeLinecap="round"
            />
          ))}
        </g>

        {/* LIVE THICK FACETED ICE-SAPPHIRE & FROST-WHITE CRYSTAL ARMS */}
        <g className="pointer-events-none">
          {visibleSegs.map((seg, idx) => {
            const isOver = seg.layer === 4;
            const outerStroke = isOver
              ? "#be123c"
              : seg.layer === 1
              ? "#075985"
              : seg.layer === 2
              ? "#0369a1"
              : "#0284c7";
            const midStroke = isOver
              ? "#fb7185"
              : seg.layer === 1
              ? "#38bdf8"
              : seg.layer === 2
              ? "#7dd3fc"
              : "#bae6fd";
            const outerW = seg.layer === 1 ? 11.5 : seg.layer === 2 ? 6.8 : seg.layer === 3 ? 4.2 : 3.2;
            const midW = seg.layer === 1 ? 6.2 : seg.layer === 2 ? 3.5 : seg.layer === 3 ? 2 : 1.4;
            const frostW = seg.layer === 1 ? 2.4 : seg.layer === 2 ? 1.4 : 0.9;
            return (
              <g key={`sseg-${seg.layer}-${idx}`}>
                {/* Deep Ice-Sapphire Crystal Bevel */}
                <line
                  x1={seg.x1}
                  y1={seg.y1}
                  x2={seg.x2}
                  y2={seg.y2}
                  stroke={outerStroke}
                  strokeWidth={outerW}
                  strokeLinecap="round"
                />
                {/* Luminous Glacier-Cyan Mid Facet */}
                <line
                  x1={seg.x1}
                  y1={seg.y1}
                  x2={seg.x2}
                  y2={seg.y2}
                  stroke={midStroke}
                  strokeWidth={midW}
                  strokeLinecap="round"
                />
                {/* Crisp Frost-White Specular Ridge */}
                <line
                  x1={seg.x1}
                  y1={seg.y1}
                  x2={seg.x2}
                  y2={seg.y2}
                  stroke="#ffffff"
                  strokeWidth={frostW}
                  strokeLinecap="round"
                  opacity="0.9"
                />
              </g>
            );
          })}

          {/* GLOWING FACETED DIAMOND ICE CRYSTALS AT EVERY BRANCH TIP (Zero Plain Green Circles!) */}
          {grownLayer >= 2 &&
            visibleSegs
              .filter((s) => s.layer === Math.min(grownLayer, 3))
              .map((seg, idx) => {
                const ang = (Math.atan2(seg.y2 - seg.y1, seg.x2 - seg.x1) * 180) / Math.PI + 90;
                const dSize = grownLayer === 3 ? 6.2 : 7.8;
                return (
                  <g
                    key={`dtip-${idx}`}
                    transform={`translate(${seg.x2.toFixed(1)}, ${seg.y2.toFixed(1)}) rotate(${ang.toFixed(1)})`}
                  >
                    <circle cx="0" cy="0" r={dSize * 1.15} fill="#e0f2fe" opacity="0.55" />
                    <polygon
                      points={`0,${-dSize} ${(dSize * 0.62).toFixed(1)},0 0,${dSize} ${(-dSize * 0.62).toFixed(1)},0`}
                      fill={phase === "complete" ? "url(#iceDiamondTip)" : "#ffffff"}
                      stroke="#0369a1"
                      strokeWidth="1.2"
                      strokeLinejoin="round"
                    />
                    <polygon
                      points={`0,${(-dSize * 0.5).toFixed(1)} ${(dSize * 0.3).toFixed(1)},0 0,${(dSize * 0.5).toFixed(1)} ${(-dSize * 0.3).toFixed(1)},0`}
                      fill="#ffffff"
                    />
                  </g>
                );
              })}

          {/* LUMINOUS MULTI-FACETED HEXAGONAL ICE CORE */}
          <g transform="translate(574, 248)">
            <circle cx="0" cy="0" r="34" fill="#ffffff" opacity="0.55" />
            <polygon
              points="0,-28 24.2,-14 24.2,14 0,28 -24.2,14 -24.2,-14"
              fill="url(#iceCoreFacet)"
              stroke="#075985"
              strokeWidth="2.6"
              strokeLinejoin="round"
            />
            {[0, 60, 120].map((deg) => (
              <line
                key={`core-rib-${deg}`}
                x1="0"
                y1="-25"
                x2="0"
                y2="25"
                stroke="#ffffff"
                strokeWidth="1.8"
                opacity="0.88"
                transform={`rotate(${deg})`}
              />
            ))}
            <polygon
              points="0,-14 12.1,-7 12.1,7 0,14 -12.1,7 -12.1,-7"
              fill="#ffffff"
              stroke="#38bdf8"
              strokeWidth="1.6"
            />
          </g>
        </g>

        {/* OVERGROWN FROST BURST PULSE WHEN NO STOP */}
        {phase === "inf_frost" && (
          <motion.circle
            cx="574"
            cy="248"
            fill="none"
            stroke="#e11d48"
            strokeWidth="4"
            animate={{ r: [158, 184, 158], opacity: [0.95, 0.25, 0.95] }}
            transition={{ type: "tween", repeat: Infinity, duration: 0.7 }}
            className="pointer-events-none"
          />
        )}

        {/* ====================================================================
            RIGHT SIDE: SLEEK SILVER-AND-ICE CLOUD FREEZE THERMOSTAT + PILL MARKERS
            ==================================================================== */}
        <g transform="translate(926, 0)">
          {/* Sculpted Frosted Cloud Crown Above Thermostat */}
          <g transform="translate(0, 96)" className="pointer-events-none">
            <circle cx="-18" cy="4" r="15" fill="#ffffff" stroke="#0284c7" strokeWidth="2.2" />
            <circle cx="18" cy="4" r="15" fill="#ffffff" stroke="#0284c7" strokeWidth="2.2" />
            <circle cx="0" cy="-6" r="20" fill="#f0f9ff" stroke="#0284c7" strokeWidth="2.2" />
            <rect x="-18" y="2" width="36" height="15" fill="#ffffff" />
            <text x="58" y="-28" textAnchor="middle" fill="#075985" fontSize="9.6" fontWeight="900" fontFamily="monospace">
              CLOUD FREEZE THERMOSTAT
            </text>
          </g>

          {/* Sleek Brushed Silver & Frosted Glass Mercury Tube */}
          <rect x="-15" y="120" width="30" height="264" rx="15" fill="url(#silverSteel)" stroke="#075985" strokeWidth="2.4" />
          <rect x="-9" y="128" width="18" height="248" rx="9" fill="#f0f9ff" stroke="#7dd3fc" strokeWidth="1.4" />
          {/* Active Icy Mercury Column */}
          <rect
            x="-6"
            y={thermoFillTopY}
            width="12"
            height={376 - thermoFillTopY}
            rx="6"
            fill={freezeRule === "none" ? "#e11d48" : "url(#thermoMercuryIce)"}
          />
          {/* Specular Glass Highlight Along Mercury Tube */}
          <line x1="-4" y1="136" x2="-4" y2="366" stroke="#ffffff" strokeWidth="2" opacity="0.72" strokeLinecap="round" />

          {/* Faceted Crystal Silver-and-Ice Thermostat Bulb */}
          <circle cx="0" cy="392" r="24" fill="url(#silverSteel)" stroke="#075985" strokeWidth="2.6" />
          <circle
            cx="0"
            cy="392"
            r="17"
            fill={freezeRule === "none" ? "#e11d48" : freezeRule === 3 ? "#0284c7" : "#38bdf8"}
            stroke="#e0f2fe"
            strokeWidth="2"
          />
          <polygon points="0,382 6,392 0,402 -6,392" fill="#ffffff" opacity="0.75" />

          {/* 3 Crisp Pill Markers Extending Cleanly Off the Silver-and-Ice Tube */}
          {[
            { rule: 3 as FreezeDepthRule, y: 158, text: "DEPTH 3: 216 TIPS" },
            { rule: 2 as FreezeDepthRule, y: 252, text: "DEPTH 2: 36 TIPS" },
            { rule: "none" as FreezeDepthRule, y: 344, text: "NO STOP: ∞ FROST" },
          ].map((opt) => {
            const active = freezeRule === opt.rule;
            const fill = active
              ? opt.rule === "none"
                ? "#be123c"
                : opt.rule === 3
                ? "#059669"
                : "#0284c7"
              : "#f0f9ff";
            return (
              <g
                key={`th-${String(opt.rule)}`}
                transform={`translate(24, ${opt.y})`}
                onClick={() => selectFreezeRule(opt.rule)}
                className={phase === "freezing" || solved ? "cursor-default" : "cursor-pointer"}
              >
                {/* Connector Tick From Mercury Tube Into Pill */}
                <line x1="-10" y1="0" x2="2" y2="0" stroke={active ? "#075985" : "#38bdf8"} strokeWidth="3" />
                <rect
                  x="2"
                  y="-19"
                  width="196"
                  height="38"
                  rx="19"
                  fill={fill}
                  stroke={active ? "#fef08a" : "#0284c7"}
                  strokeWidth={active ? 2.8 : 2}
                />
                <polygon
                  points="18,-6 23,0 18,6 13,0"
                  fill={active ? "#fef08a" : "#38bdf8"}
                />
                <text
                  x="108"
                  y="4"
                  textAnchor="middle"
                  fill={active ? "#ffffff" : "#0c4a6e"}
                  fontSize="10.4"
                  fontWeight="900"
                  fontFamily="monospace"
                >
                  {opt.text}
                </text>
              </g>
            );
          })}
        </g>

        {/* BOTTOM CENTER TACTILE "FREEZE CRYSTAL" ACTION BUTTON */}
        <g
          transform="translate(574, 504)"
          onClick={handleFreezeCrystal}
          className={phase === "freezing" || solved ? "cursor-default" : "cursor-pointer"}
        >
          <rect
            x="-182"
            y="-28"
            width="364"
            height="56"
            rx="28"
            fill={
              phase === "complete"
                ? "#059669"
                : freezeRule === 3
                ? "#0284c7"
                : "#d97706"
            }
            stroke="#e0f2fe"
            strokeWidth="3"
          />
          <text x="0" y="5" textAnchor="middle" fill="#ffffff" fontSize="14.5" fontWeight="900" fontFamily="monospace">
            {phase === "freezing"
              ? `FREEZING DEPTH ${grownLayer}...`
              : phase === "complete"
              ? "SNOWFLAKE MATCHED (216 TIPS)!"
              : "FREEZE CRYSTAL"}
          </text>
        </g>
      </svg>
    </div>
  );
}

/* ============================================================================
   LEVEL 1 (R1) ORCHESTRATOR (CLEAN FULL-BLEED PROGRESSION: 1A -> 1B -> 1C)
   Updates top-left R1 header title dynamically without an extra sub-header bar.
   ============================================================================ */

type R1Sublevel = "1A" | "1B" | "1C";

interface Level1WrapperProps extends StudioLevelProps {
  onSubTitleChange: (title: string) => void;
}

function Level1CrystalTriangle({ onSubTitleChange, ...props }: Level1WrapperProps) {
  const [activeSub, setActiveSub] = useState<R1Sublevel>("1A");

  const advanceToSub = useCallback(
    (nextSub: "1B" | "1C") => {
      setActiveSub(nextSub);
      if (nextSub === "1B") {
        onSubTitleChange("THE RECURSIVE FERN FROND");
        props.setStatus(
          "Sublevel 1B: Set the Depth Stopper gauge and click GROW FERN FROND to bloom a self-similar fern!",
          "info"
        );
        props.speak(
          "Sublevel 1B: The Recursive Fern Frond. Draw the main stem and sprout miniature copies of the whole fern on the left and right. Choose the right layer stopper and click Grow Fern Frond."
        );
      } else {
        onSubTitleChange("THE SNOWFLAKE CRYSTAL CARVER");
        props.setStatus(
          "Sublevel 1C: Set the Cloud Freeze Thermostat to match the 3-layer Snowflake Blueprint and click FREEZE CRYSTAL!",
          "info"
        );
        props.speak(
          "Sublevel 1C: The Snowflake Crystal Carver. Every ice tip sprouts three smaller branches. Set the Cloud Freeze Thermostat to match the three-layer snowflake blueprint and click Freeze Crystal."
        );
      }
    },
    [onSubTitleChange, props]
  );

  const handleR1FinalComplete = useCallback(
    (scoreAward: number) => {
      props.onLevelComplete(scoreAward);
    },
    [props]
  );

  return (
    <div className="flex-1 min-h-0 w-full flex flex-col overflow-hidden relative">
      {activeSub === "1A" && (
        <Sublevel1ACrystalTriangle {...props} onSubComplete={() => advanceToSub("1B")} />
      )}
      {activeSub === "1B" && (
        <Sublevel1BRecursiveFern {...props} onSubComplete={() => advanceToSub("1C")} />
      )}
      {activeSub === "1C" && (
        <Sublevel1CSnowflakeCarver {...props} onLevelComplete={handleR1FinalComplete} />
      )}
    </div>
  );
}

/* ============================================================================
   LEVEL 2 (R2) — SUNBEAM CANOPY GROWER (Pointed Leaves & Golden Blossoms)
   Preserves the left-side LAYER 0..4 ladder, bottom 1->2->4->8->16 counter,
   and natural wooden garden post lever, upgraded with organic pointed green
   leaves along twigs and glowing golden-amber 5-petal blossoms at Layer 4 tips!
   ============================================================================ */

interface CanopyBranch {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  dirDeg: number;
  layer: number;
  width: number;
}

function buildCanopyGeometry(): {
  branches: CanopyBranch[];
  orbs: { x: number; y: number }[];
} {
  const branches: CanopyBranch[] = [];
  const layer3Tips: { x: number; y: number }[] = [];

  const spreadByLayer = [33, 26, 20, 15];
  const lenByLayer = [98, 76, 58, 46, 36];

  const grow = (x: number, y: number, dirDeg: number, layer: number) => {
    const len = lenByLayer[layer];
    const rad = (dirDeg * Math.PI) / 180;
    const x2 = x + Math.cos(rad) * len;
    const y2 = y + Math.sin(rad) * len;
    branches.push({
      x1: x,
      y1: y,
      x2,
      y2,
      dirDeg,
      layer,
      width: Math.max(3, 14 - layer * 2.6),
    });
    if (layer === 3) {
      layer3Tips.push({
        x: x2 + Math.cos(rad) * 24,
        y: y2 + Math.sin(rad) * 24,
      });
    }
    if (layer >= 4) return;
    const spread = spreadByLayer[layer];
    grow(x2, y2, dirDeg - spread, layer + 1);
    grow(x2, y2, dirDeg + spread, layer + 1);
  };

  grow(590, 452, -90, 0);
  return { branches, orbs: layer3Tips };
}

/** Illustrated pointed botanical green leaf with midrib vein */
function PointedLeafSVG({
  x,
  y,
  angleDeg,
  scale = 1,
}: {
  x: number;
  y: number;
  angleDeg: number;
  scale?: number;
}) {
  return (
    <g transform={`translate(${x}, ${y}) rotate(${angleDeg}) scale(${scale})`}>
      <path
        d="M 0 0 C 7 -6, 11 -14, 0 -24 C -11 -14, -7 -6, 0 0 Z"
        fill="#16a34a"
        stroke="#064e3b"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path d="M 0 -2 C 3 -8, 4 -14, 0 -21" fill="none" stroke="#86efac" strokeWidth="1.3" strokeLinecap="round" />
    </g>
  );
}

/** Glowing 5-petal golden-amber flower blossom at Layer 4 twig tips */
function GoldenBlossomSVG({ x, y, scale = 1 }: { x: number; y: number; scale?: number }) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      <circle cx="0" cy="0" r="14" fill="#fde047" opacity="0.32" />
      {[0, 72, 144, 216, 288].map((deg) => (
        <g key={`bp-${deg}`} transform={`rotate(${deg})`}>
          <path
            d="M 0 -2 C 5 -6, 6 -12, 0 -15 C -6 -12, -5 -6, 0 -2 Z"
            fill="#fbbf24"
            stroke="#b45309"
            strokeWidth="1.2"
          />
          <path d="M 0 -4 C 2.5 -7, 2.5 -10, 0 -12 C -2.5 -10, -2.5 -7, 0 -4 Z" fill="#fef9c3" opacity="0.85" />
        </g>
      ))}
      <circle cx="0" cy="0" r="4" fill="#d97706" stroke="#fef9c3" strokeWidth="1.3" />
    </g>
  );
}

function Level2SunbeamCanopy({
  playSwitch,
  playSuccess,
  playError,
  playBeep,
  speak,
  setStatus,
  onRegisterHint,
  onLevelComplete,
}: StudioLevelProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [graftAttached, setGraftAttached] = useState(false);
  const [layer, setLayer] = useState(0); // 0..4
  const [leverPulled, setLeverPulled] = useState(false);
  const [solved, setSolved] = useState(false);

  const [dragGraft, setDragGraft] = useState<{ x: number; y: number } | null>(null);
  const movedRef = useRef(false);

  const { branches: allBranches, orbs } = useMemo(() => buildCanopyGeometry(), []);
  const visibleBranches = useMemo(() => allBranches.filter((b) => b.layer <= layer), [allBranches, layer]);
  const allOrbsLit = layer === 4;

  useEffect(() => {
    onRegisterHint(() => {
      if (!graftAttached) {
        return "Drag the SPLIT INTO 2 SMALLER BRANCHES graft tag onto the sapling trunk.";
      }
      if (layer < 4) {
        return `Pull the garden post lever (GROW NEXT LAYER) to grow Layer ${layer + 1} up to Layer 4.`;
      }
      return "All 5 layers grown — 16 golden blossoms bloomed across the canopy!";
    });
  }, [graftAttached, layer, onRegisterHint]);

  const attachGraft = useCallback(() => {
    if (graftAttached) return;
    playSwitch();
    playBeep(640);
    setGraftAttached(true);
    setStatus("Rule grafted! Pull the garden post lever to grow Layer 1 (2 Branches).", "success");
    speak("Rule grafted onto the sapling! Pull the garden post lever step by step to watch every tip double.");
  }, [graftAttached, playBeep, playSwitch, setStatus, speak]);

  const growNextLayer = useCallback(() => {
    if (layer >= 4) return;
    if (!graftAttached) {
      playError();
      setStatus("Drag the SPLIT INTO 2 SMALLER BRANCHES graft tag onto the sapling trunk first!", "warn");
      speak("First drag the Split into two smaller branches graft tag onto the sapling trunk.");
      return;
    }

    const next = layer + 1;
    setLayer(next);
    setLeverPulled(true);
    setTimeout(() => setLeverPulled(false), 260);
    playSwitch();
    playBeep(420 + next * 105);

    if (next === 1) {
      setStatus("LAYER 1: 2 Branches — Pull again to run the same 'Split into 2' rule at both tips!", "info");
    } else if (next === 2) {
      setStatus("LAYER 2: 4 Branches — Every branch split into 2 smaller leafy copies!", "info");
    } else if (next === 3) {
      setStatus("LAYER 3: 8 Branches — One more pull to bloom golden blossoms on all 16 twigs!", "info");
    } else if (next === 4) {
      playSuccess();
      setStatus("LAYER 4: 16 Twigs — Pointed leaves and golden blossoms bloomed across the entire canopy!", "success");
      speak("Wonderful! Running the same split into two rule at every tip doubled branches from one to sixteen and bloomed golden blossoms!");
      if (!solved) {
        setSolved(true);
        onLevelComplete(70);
      }
    }
  }, [graftAttached, layer, onLevelComplete, playBeep, playError, playSuccess, playSwitch, setStatus, solved, speak]);

  const onSvgMove = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragGraft) return;
    movedRef.current = true;
    setDragGraft(clientToSvg(svgRef.current, e.clientX, e.clientY));
  };

  const onSvgUp = (e: React.PointerEvent<SVGSVGElement>) => {
    if (!dragGraft) return;
    const pt = clientToSvg(svgRef.current, e.clientX, e.clientY);
    const wasTap = !movedRef.current;
    setDragGraft(null);
    if (wasTap || (pt.x > 460 && pt.x < 720 && pt.y > 260 && pt.y < 460)) {
      attachGraft();
    }
  };

  const ladderRows = [
    { lvl: 4, y: 126, text: "LAYER 4: 16 Twigs" },
    { lvl: 3, y: 186, text: "LAYER 3: 8 Branches" },
    { lvl: 2, y: 248, text: "LAYER 2: 4 Branches" },
    { lvl: 1, y: 316, text: "LAYER 1: 2 Branches" },
    { lvl: 0, y: 396, text: "LAYER 0: 1 Trunk" },
  ];
  const counts = [1, 2, 4, 8, 16];

  return (
    <div className="flex-1 min-h-0 w-full relative overflow-hidden select-none">
      {/* FULL-BLEED EMERALD & GOLD BOTANICAL TERRACE BACKDROP */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1200 560"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="terSky" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef9c3" />
            <stop offset="52%" stopColor="#d1fae5" />
            <stop offset="100%" stopColor="#6ee7b7" />
          </linearGradient>
          <linearGradient id="terSoil" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#78350f" />
            <stop offset="100%" stopColor="#3b1605" />
          </linearGradient>
        </defs>
        <rect width="1200" height="560" fill="url(#terSky)" />
        <polygon points="350,0 830,0 960,456 240,456" fill="#fef08a" opacity="0.25" />
        <rect x="0" y="456" width="1200" height="104" fill="url(#terSoil)" />
      </svg>

      {/* UNIFIED 1200x560 BOTANICAL TERRACE STAGE */}
      <svg
        ref={svgRef}
        viewBox="0 0 1200 560"
        preserveAspectRatio="xMidYMid meet"
        onPointerMove={onSvgMove}
        onPointerUp={onSvgUp}
        onPointerCancel={onSvgUp}
        className="relative z-10 w-full h-full touch-none"
      >
        <CommonWorldDefs />

        {/* TOP 1-LINE CONCEPT CALLOUT */}
        <rect x="256" y="16" width="688" height="34" rx="17" fill="#064e3b" stroke="#fef08a" strokeWidth="2.2" />
        <text x="600" y="37" textAnchor="middle" fill="#fef9c3" fontSize="11.2" fontWeight="900" fontFamily="monospace">
          HOW IT WORKS: The same &apos;Split into 2&apos; rule runs at every single tip.
        </text>

        {/* GRASSY TERRACE EDGE ABOVE SOIL BED */}
        <rect x="0" y="448" width="1200" height="14" fill="#059669" stroke="#022c22" strokeWidth="2.2" />

        {/* LEFT-SIDE RECURSION LAYER LADDER (LAYER 0..4) */}
        <g className="pointer-events-none">
          <line x1="36" y1="126" x2="36" y2="396" stroke="#065f46" strokeWidth="3.5" strokeLinecap="round" opacity="0.45" />
          {ladderRows.map((row) => {
            const lit = row.lvl <= layer;
            return (
              <g key={`lad-${row.lvl}`} transform={`translate(0, ${row.y})`}>
                <line
                  x1="234"
                  y1="0"
                  x2="430"
                  y2="0"
                  stroke={lit ? "#059669" : "#6ee7b7"}
                  strokeWidth={lit ? "2" : "1.5"}
                  strokeDasharray="6 6"
                  opacity={lit ? 0.65 : 0.4}
                />
                <circle
                  cx="36"
                  cy="0"
                  r={lit ? 8.5 : 6.5}
                  fill={lit ? (row.lvl === 4 ? "#fde047" : "#10b981") : "#a7f3d0"}
                  stroke="#064e3b"
                  strokeWidth="2.4"
                />
                <rect
                  x="52"
                  y="-14"
                  width="178"
                  height="28"
                  rx="14"
                  fill={lit ? (row.lvl === 4 ? "#059669" : "#065f46") : "#ecfdf5"}
                  fillOpacity={lit ? 0.96 : 0.72}
                  stroke={lit ? "#fef08a" : "#10b981"}
                  strokeWidth="2"
                />
                <text
                  x="141"
                  y="4"
                  textAnchor="middle"
                  fill={lit ? "#fef9c3" : "#065f46"}
                  fontSize="10.2"
                  fontWeight="900"
                  fontFamily="monospace"
                >
                  {row.text}
                </text>
              </g>
            );
          })}
        </g>

        {/* SOFT SUNBEAM CANOPY GLOW TARGETS (8 Warm Sunbeams Above Canopy) */}
        {orbs.map((orb, idx) => (
          <g key={`orb-${idx}`} transform={`translate(${orb.x}, ${orb.y - 12})`} className="pointer-events-none">
            {allOrbsLit ? (
              <>
                <motion.circle
                  cx="0"
                  cy="0"
                  fill="#fde047"
                  opacity="0.34"
                  animate={{ r: [18, 28, 18] }}
                  transition={{ type: "tween", repeat: Infinity, duration: 1.6, delay: idx * 0.1 }}
                />
                {/* Subtle drifting golden sun-motes when all 16 blossoms bloom */}
                <motion.circle
                  cx={(idx % 2 === 0 ? -12 : 14)}
                  r="3.2"
                  fill="#fef9c3"
                  animate={{ cy: [8, -26, 8], opacity: [0.15, 0.9, 0.15] }}
                  transition={{ type: "tween", repeat: Infinity, duration: 2.6 + (idx % 3) * 0.4, delay: idx * 0.18 }}
                />
              </>
            ) : (
              <circle cx="0" cy="0" r="10" fill="#fef9c3" fillOpacity="0.55" stroke="#f59e0b" strokeWidth="1.6" strokeDasharray="3 3" />
            )}
          </g>
        ))}

        {/* CENTRAL GROWING SAPLING, POINTED GREEN LEAVES & GOLDEN BLOSSOMS */}
        <g>
          {visibleBranches.map((seg, i) => {
            const midX = (seg.x1 + seg.x2) / 2;
            const midY = (seg.y1 + seg.y2) / 2;
            const rotUp = seg.dirDeg + 90; // 0 = straight up
            return (
              <g key={`cb-${seg.layer}-${i}`}>
                <motion.line
                  x1={seg.x1}
                  y1={seg.y1}
                  x2={seg.x2}
                  y2={seg.y2}
                  stroke={seg.layer < 2 ? "#78350f" : seg.layer < 4 ? "#92400e" : "#15803d"}
                  strokeWidth={seg.width}
                  strokeLinecap="round"
                  initial={{ pathLength: 0, opacity: 0.4 }}
                  animate={{ pathLength: 1, opacity: 1 }}
                  transition={{ type: "tween", duration: 0.34, ease: "easeOut" }}
                />

                {/* Illustrated Pointed Green Leaves Sprouting Along Twigs (Layers 2, 3, 4) */}
                {seg.layer >= 2 && (
                  <>
                    <PointedLeafSVG x={midX} y={midY} angleDeg={rotUp - 48} scale={seg.layer === 4 ? 0.85 : 0.72} />
                    <PointedLeafSVG x={midX} y={midY} angleDeg={rotUp + 48} scale={seg.layer === 4 ? 0.85 : 0.72} />
                  </>
                )}

                {/* Fresh Sprouting Pointed Leaf Pair at Active Frontier Tips (Layers 0..3) */}
                {seg.layer === layer && layer < 4 && (
                  <>
                    <PointedLeafSVG x={seg.x2} y={seg.y2} angleDeg={rotUp - 34} scale={0.9} />
                    <PointedLeafSVG x={seg.x2} y={seg.y2} angleDeg={rotUp + 34} scale={0.9} />
                  </>
                )}

                {/* Glowing Golden-Amber 5-Petal Flower Blossoms at All 16 Layer-4 Tips! */}
                {seg.layer === 4 && (
                  <motion.g
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: "tween", duration: 0.4, delay: (i % 8) * 0.04 }}
                  >
                    <GoldenBlossomSVG x={seg.x2} y={seg.y2} scale={0.95} />
                  </motion.g>
                )}
              </g>
            );
          })}
        </g>

        {/* TRUNK GRAFT DROP RING OR ATTACHED GRAFT RIBBON */}
        <g transform="translate(590, 404)" onClick={attachGraft} className={!graftAttached ? "cursor-pointer" : ""}>
          {graftAttached ? (
            <g>
              <rect x="-64" y="-14" width="128" height="28" rx="14" fill="#059669" stroke="#fef08a" strokeWidth="2.4" />
              <text x="0" y="4" textAnchor="middle" fill="#fef9c3" fontSize="9.5" fontWeight="900" fontFamily="monospace">
                SPLIT x2 ACTIVE
              </text>
            </g>
          ) : (
            <motion.circle
              cx="0"
              cy="0"
              r="24"
              fill="none"
              stroke="#d97706"
              strokeWidth="3.2"
              strokeDasharray="6 5"
              animate={{ opacity: [0.35, 1, 0.35] }}
              transition={{ type: "tween", repeat: Infinity, duration: 1.0 }}
            />
          )}
        </g>

        {/* DRAGGABLE "SPLIT INTO 2 SMALLER BRANCHES" GRAFT TAG */}
        {!graftAttached && (
          <g
            transform={`translate(${dragGraft ? dragGraft.x : 786}, ${dragGraft ? dragGraft.y : 396})`}
            onPointerDown={(e) => {
              e.stopPropagation();
              svgRef.current?.setPointerCapture(e.pointerId);
              movedRef.current = false;
              setDragGraft({ x: 786, y: 396 });
            }}
            className="cursor-grab active:cursor-grabbing"
          >
            <rect x="-118" y="-32" width="236" height="64" rx="32" fill="#065f46" stroke="#fef08a" strokeWidth="3.2" />
            <path d="M -86 14 L -86 0 L -97 -13 M -86 0 L -75 -13" fill="none" stroke="#fef08a" strokeWidth="3" strokeLinecap="round" />
            <text x="14" y="-4" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900" fontFamily="monospace">
              SPLIT INTO 2
            </text>
            <text x="14" y="12" textAnchor="middle" fill="#fef08a" fontSize="10" fontWeight="900" fontFamily="monospace">
              SMALLER BRANCHES
            </text>
            <text x="14" y="25" textAnchor="middle" fill="#a7f3d0" fontSize="8.2" fontWeight="900" fontFamily="monospace">
              DRAG ONTO TRUNK
            </text>
          </g>
        )}

        {/* NATURAL WOODEN GARDEN POST WITH TACTILE "GROW NEXT LAYER" LEVER */}
        <g transform="translate(1032, 448)">
          <rect x="-14" y="-210" width="28" height="214" rx="6" fill="url(#woodPost)" stroke="#451a03" strokeWidth="2.8" />
          <ellipse cx="0" cy="-210" rx="18" ry="6" fill="url(#brassRich)" stroke="#451a03" strokeWidth="2.2" />
          <circle cx="0" cy="-148" r="14" fill="url(#brassRich)" stroke="#451a03" strokeWidth="2.5" />

          <g onClick={growNextLayer} className={layer < 4 ? "cursor-pointer" : "cursor-default"}>
            <motion.line
              x1="0"
              y1="-148"
              stroke="#451a03"
              strokeWidth="10"
              strokeLinecap="round"
              animate={{ x2: 64, y2: leverPulled ? -112 : -184 }}
              transition={{ type: "tween", duration: 0.2 }}
            />
            <motion.line
              x1="0"
              y1="-148"
              stroke="url(#brassRich)"
              strokeWidth="6"
              strokeLinecap="round"
              animate={{ x2: 64, y2: leverPulled ? -112 : -184 }}
              transition={{ type: "tween", duration: 0.2 }}
            />
            <motion.circle
              r="15"
              fill={layer >= 4 ? "#059669" : "#d97706"}
              stroke="#fef08a"
              strokeWidth="3"
              animate={{ cx: 68, cy: leverPulled ? -110 : -186 }}
              transition={{ type: "tween", duration: 0.2 }}
            />

            <rect
              x="-96"
              y="-92"
              width="192"
              height="44"
              rx="22"
              fill={layer >= 4 ? "#059669" : graftAttached ? "#d97706" : "#475569"}
              stroke="#fef08a"
              strokeWidth="2.8"
            />
            <text x="0" y="-73" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900" fontFamily="monospace">
              {layer >= 4 ? "ALL 16 BLOSSOMS LIT!" : "GROW NEXT LAYER"}
            </text>
            <text x="0" y="-58" textAnchor="middle" fill="#fef08a" fontSize="9.2" fontWeight="900" fontFamily="monospace">
              {layer >= 4 ? "CANOPY COMPLETE" : `(+1 DEPTH) • LAYER ${layer}`}
            </text>
          </g>
        </g>

        {/* SOIL BED EXPONENTIAL COUNTER */}
        <g transform="translate(600, 508)">
          <text x="-432" y="5" textAnchor="start" fill="#fde68a" fontSize="12" fontWeight="900" fontFamily="monospace">
            SAME RULE ON EVERY TIP:
          </text>
          {counts.map((cnt, idx) => {
            const reached = idx <= layer;
            const cx = -126 + idx * 106;
            return (
              <g key={`cnt-${cnt}`} transform={`translate(${cx}, 0)`}>
                {idx > 0 && (
                  <text x="-53" y="5" textAnchor="middle" fill={reached ? "#fde047" : "#92400e"} fontSize="13" fontWeight="900" fontFamily="monospace">
                    -&gt;
                  </text>
                )}
                <circle
                  cx="0"
                  cy="0"
                  r="20"
                  fill={reached ? (idx === 4 ? "#059669" : "#d97706") : "#451a03"}
                  stroke={reached ? "#fef08a" : "#92400e"}
                  strokeWidth="2.4"
                />
                <text x="0" y="5" textAnchor="middle" fill={reached ? "#ffffff" : "#b45309"} fontSize="13" fontWeight="900" fontFamily="monospace">
                  {cnt}
                </text>
              </g>
            );
          })}
          <text x="386" y="5" textAnchor="middle" fill="#fef08a" fontSize="12" fontWeight="900" fontFamily="monospace">
            BRANCHES
          </text>
        </g>
      </svg>
    </div>
  );
}

/* ============================================================================
   LEVEL 3 (R3) — SUNLIT CLOCKWORK SPIRAL STUDIO (Bright Daylight + Bottom Loop)
   Bright sky-blue, crisp white & warm brass Architect's Drafting Studio
   (zero dark navy backgrounds!).
   Upper/Center Stage: Large Clockwork Turtle Drafting Canvas + 6 Crystal Gems.
   Bottom Workbench: Horizontal 4-Node Recursive Loop Track:
   [GATE 1: STOP IF LINE < 15px] -> [STEP 2: DRAW & SHRINK 85%] ->
   [STEP 3: TURN ANGLE (45° / 60° / 90°)] -> [STEP 4: REPEAT INSIDE SELF]
   with a glowing animated return pipe curving from STEP 4 back into GATE 1!
   ============================================================================ */

type TurnAngleOption = 45 | 60 | 90;

interface SpiralSegment {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  angleDeg: number;
  lengthPx: number;
  color: string;
  step: number;
}

function buildPuzzleSpiral(
  turnDeg: TurnAngleOption,
  startX = 434,
  startY = 104
): {
  segments: SpiralSegment[];
  gems: { x: number; y: number }[];
  centerJewel: { x: number; y: number };
} {
  const maxSteps = turnDeg === 90 ? 20 : 2;
  let x = startX;
  let y = startY;
  let ang = 0;
  let len = 276;

  const segments: SpiralSegment[] = [];
  const gems: { x: number; y: number }[] = [];

  for (let i = 0; i < maxSteps; i++) {
    const rad = (ang * Math.PI) / 180;
    const x2 = x + Math.cos(rad) * len;
    const y2 = y + Math.sin(rad) * len;
    const hue = (195 + i * 14) % 360;
    segments.push({
      x1: x,
      y1: y,
      x2,
      y2,
      angleDeg: ang,
      lengthPx: Math.round(len),
      color: `hsl(${hue}, 82%, 44%)`,
      step: i + 1,
    });
    if (i < 6) {
      gems.push({ x: x2, y: y2 });
    }
    x = x2;
    y = y2;
    ang += turnDeg;
    len *= 0.85;
  }

  const last = segments[segments.length - 1];
  return {
    segments,
    gems,
    centerJewel: { x: last.x2, y: last.y2 },
  };
}

function ClockworkTurtleSVG({
  tracing = false,
  spinningForever = false,
}: {
  tracing?: boolean;
  spinningForever?: boolean;
}) {
  return (
    <g>
      {spinningForever && (
        <animateTransform
          attributeName="transform"
          type="rotate"
          values="0 0 0; 360 0 0"
          dur="0.32s"
          repeatCount="indefinite"
        />
      )}
      <ellipse cx="8" cy="-14" rx="7" ry="4.5" fill="#d97706" stroke="#78350f" strokeWidth="1.6" transform="rotate(-24 8 -14)" />
      <ellipse cx="8" cy="14" rx="7" ry="4.5" fill="#d97706" stroke="#78350f" strokeWidth="1.6" transform="rotate(24 8 14)" />
      <ellipse cx="-10" cy="-12" rx="6" ry="4" fill="#b45309" stroke="#78350f" strokeWidth="1.5" transform="rotate(20 -10 -12)" />
      <ellipse cx="-10" cy="12" rx="6" ry="4" fill="#b45309" stroke="#78350f" strokeWidth="1.5" transform="rotate(-20 -10 12)" />
      <polygon points="-16,-4 -26,0 -16,4" fill="#0284c7" stroke="#0c4a6e" strokeWidth="1.4" />

      <circle cx="19" cy="0" r="8" fill="#059669" stroke="#064e3b" strokeWidth="1.8" />
      <circle cx="22" cy="-3.2" r="2" fill="#0f172a" />
      <circle cx="22" cy="3.2" r="2" fill="#0f172a" />
      <circle cx="22.6" cy="-3.6" r="0.7" fill="#ffffff" />
      <circle cx="22.6" cy="2.8" r="0.7" fill="#ffffff" />

      <ellipse cx="-1" cy="0" rx="16" ry="13.5" fill="url(#brassRich)" stroke="#78350f" strokeWidth="2.2" />
      <g>
        {(tracing || spinningForever) && (
          <animateTransform
            attributeName="transform"
            type="rotate"
            values="0 -1 0; 360 -1 0"
            dur="0.7s"
            repeatCount="indefinite"
          />
        )}
        <circle cx="-1" cy="0" r="7.5" fill="#0369a1" stroke="#fef08a" strokeWidth="1.8" strokeDasharray="3 2" />
        <circle cx="-1" cy="0" r="3" fill="#fef08a" />
      </g>
    </g>
  );
}

function Level3ClockworkSpiral({
  playSwitch,
  playSuccess,
  playError,
  playBeep,
  speak,
  setStatus,
  onRegisterHint,
  onLevelComplete,
}: StudioLevelProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [turnAngle, setTurnAngle] = useState<TurnAngleOption>(45);
  const [hasStopRule, setHasStopRule] = useState(false);
  const [tracedSteps, setTracedSteps] = useState(0);
  const [runOutcome, setRunOutcome] = useState<
    "idle" | "running" | "angle_miss" | "no_stop_spin" | "safe_done"
  >("idle");
  const [solved, setSolved] = useState(false);

  // Drag state for green STOP IF LINE < 15px block from left workbench holder into GATE 1
  const [dragStop, setDragStop] = useState<{ x: number; y: number } | null>(null);
  const stopMovedRef = useRef(false);

  // Drag/click state for Brass Compass Pointer directly on the Clockwork Turtle
  const [draggingCompass, setDraggingCompass] = useState(false);
  const compassMovedRef = useRef(false);

  const HOLDER_X = 166;
  const HOLDER_Y = 342;
  const GATE1_X = 166;
  const GATE1_Y = 502;
  const START_X = 434;
  const START_Y = 104;

  const target90 = useMemo(() => buildPuzzleSpiral(90, START_X, START_Y), []);
  const activeRun = useMemo(() => buildPuzzleSpiral(turnAngle, START_X, START_Y), [turnAngle]);

  const collectedGems = turnAngle === 90 ? Math.min(6, tracedSteps) : tracedSteps > 0 ? 1 : 0;
  const currentLinePx =
    tracedSteps === 0
      ? 276
      : runOutcome === "safe_done"
      ? 13
      : activeRun.segments[Math.min(tracedSteps - 1, activeRun.segments.length - 1)].lengthPx;

  const clearTimers = useCallback(() => {
    timersRef.current.forEach((t) => clearTimeout(t));
    timersRef.current = [];
  }, []);

  useEffect(() => {
    return () => {
      clearTimers();
    };
  }, [clearTimers]);

  useEffect(() => {
    onRegisterHint(() => {
      if (!hasStopRule) {
        return "Drag or tap 'STOP IF LINE < 15px' from the left workbench holder down into GATE 1.";
      }
      if (turnAngle !== 90) {
        return "Click or drag the Brass Compass Pointer on the Clockwork Turtle until the dotted preview ray aims straight down at Gem 2 (90°).";
      }
      if (!solved) {
        return "Press RUN TURTLE to collect all 6 Crystal Gems and halt cleanly at GATE 1!";
      }
      return "BASE CASE TRUE: LINE < 15px -> STOPPED cleanly at the center!";
    });
  }, [hasStopRule, onRegisterHint, solved, turnAngle]);

  const setCompassAngle = useCallback(
    (deg: TurnAngleOption) => {
      if (runOutcome === "running") return;
      clearTimers();
      playSwitch();
      playBeep(460 + deg * 3);
      setTurnAngle(deg);
      setTracedSteps(0);
      setRunOutcome("idle");
      setStatus(
        deg === 90
          ? hasStopRule
            ? "Turtle Compass aimed at 90° & GATE 1 locked! Press RUN TURTLE now."
            : "Turtle Compass aimed at 90°! Lock 'STOP IF LINE < 15px' into GATE 1 (or test RUN TURTLE first)."
          : `Turtle Compass rotated to ${deg}° — watch the dotted preview ray aim relative to Gem 2!`,
        deg === 90 ? "success" : "info"
      );
    },
    [clearTimers, hasStopRule, playBeep, playSwitch, runOutcome, setStatus]
  );

  const cycleCompassAngle = useCallback(() => {
    const next: TurnAngleOption = turnAngle === 45 ? 60 : turnAngle === 60 ? 90 : 45;
    setCompassAngle(next);
  }, [setCompassAngle, turnAngle]);

  const attachStopRule = useCallback(() => {
    if (hasStopRule || runOutcome === "running") return;
    clearTimers();
    playSwitch();
    playBeep(740);
    setHasStopRule(true);
    setTracedSteps(0);
    setRunOutcome("idle");
    setStatus(
      turnAngle === 90
        ? "GATE 1 locked: STOP IF LINE < 15px! Press RUN TURTLE now."
        : "GATE 1 locked: STOP IF LINE < 15px! Rotate the Clockwork Turtle's Brass Compass to aim at Gem 2.",
      "success"
    );
    speak("Stop gate locked into Gate One! Now aim the turtle's brass compass and press Run Turtle.");
  }, [clearTimers, hasStopRule, playBeep, playSwitch, runOutcome, setStatus, speak, turnAngle]);

  const handleRunTurtle = useCallback(() => {
    if (runOutcome === "running") return;
    clearTimers();
    playSwitch();
    setRunOutcome("running");
    setTracedSteps(0);

    const total = activeRun.segments.length;
    const stepMs = turnAngle === 90 ? 78 : 190;

    for (let s = 1; s <= total; s++) {
      const t = setTimeout(() => {
        setTracedSteps(s);
        if (turnAngle === 90 && s <= 6) {
          playBeep(520 + s * 65);
        } else if (s % 2 === 1) {
          playBeep(400 + s * 22);
        }

        if (s === total) {
          if (turnAngle !== 90) {
            playError();
            setRunOutcome("angle_miss");
            setStatus("ANGLE OFF TARGET: Rotate the Clockwork Turtle's Brass Compass to 90° so the ray hits Gem 2!", "warn");
            speak(`Angle off target! ${turnAngle} degree turns missed the crystal gems. Click or drag the turtle's brass compass to ninety degrees.`);
          } else if (!hasStopRule) {
            playError();
            setRunOutcome("no_stop_spin");
            setStatus("NO STOP RULE! Lock 'STOP IF LINE < 15px' into GATE 1 so the turtle halts!", "warn");
            speak("No stop rule in Gate One! The turtle reached the center and is spinning forever. Drag Stop if line is under fifteen pixels from the left holder into Gate One.");
          } else {
            playSuccess();
            setRunOutcome("safe_done");
            setStatus("BASE CASE TRUE: LINE < 15px -> STOPPED! All 6 gems collected cleanly.", "success");
            speak("Base case true! Line dropped under fifteen pixels at Gate One and the turtle stopped safely. Congrats! You have completed Meet the Algorithm Artist!");
            if (!solved) {
              setSolved(true);
              onLevelComplete(100);
            }
          }
        }
      }, s * stepMs);
      timersRef.current.push(t);
    }
  }, [activeRun.segments.length, clearTimers, hasStopRule, onLevelComplete, playBeep, playError, playSuccess, playSwitch, runOutcome, setStatus, solved, speak, turnAngle]);

  const turtlePose = useMemo(() => {
    if (tracedSteps === 0) {
      return { x: START_X, y: START_Y, angle: 0 };
    }
    const seg = activeRun.segments[Math.min(tracedSteps - 1, activeRun.segments.length - 1)];
    return { x: seg.x2, y: seg.y2, angle: seg.angleDeg };
  }, [activeRun.segments, tracedSteps]);

  const snapNearestAngle = (degRaw: number): TurnAngleOption => {
    const opts: TurnAngleOption[] = [45, 60, 90];
    let best: TurnAngleOption = 45;
    let bestDiff = Infinity;
    for (const o of opts) {
      const d = Math.abs(degRaw - o);
      if (d < bestDiff) {
        bestDiff = d;
        best = o;
      }
    }
    return best;
  };

  const onSvgMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const pt = clientToSvg(svgRef.current, e.clientX, e.clientY);

    if (dragStop) {
      stopMovedRef.current = true;
      setDragStop(pt);
      return;
    }

    if (draggingCompass) {
      compassMovedRef.current = true;
      const deg = (Math.atan2(pt.y - turtlePose.y, pt.x - turtlePose.x) * 180) / Math.PI;
      const clamped = Math.max(30, Math.min(110, deg));
      const nearest = snapNearestAngle(clamped);
      if (nearest !== turnAngle) {
        playBeep(460 + nearest * 3);
        setTurnAngle(nearest);
        setTracedSteps(0);
        setRunOutcome("idle");
      }
    }
  };

  const onSvgUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const pt = clientToSvg(svgRef.current, e.clientX, e.clientY);

    if (dragStop) {
      const wasTap = !stopMovedRef.current;
      setDragStop(null);
      if (wasTap || (pt.x > 20 && pt.x < 330 && pt.y > 410 && pt.y < 555)) {
        attachStopRule();
      }
      return;
    }

    if (draggingCompass) {
      const wasTap = !compassMovedRef.current;
      setDraggingCompass(false);
      if (wasTap) {
        cycleCompassAngle();
      } else {
        setCompassAngle(turnAngle);
      }
    }
  };

  const targetDottedPath = useMemo(() => {
    const first = target90.segments[0];
    return (
      `M ${first.x1} ${first.y1} ` +
      target90.segments.map((s) => `L ${s.x2.toFixed(1)} ${s.y2.toFixed(1)}`).join(" ")
    );
  }, [target90.segments]);

  // Live dotted preview ray geometry: start -> Gem 1 -> turnAngle ray aiming relative to Gem 2
  const gem1 = target90.gems[0];
  const rayLen = 224;
  const rayRad = (turnAngle * Math.PI) / 180;
  const rayEndX = gem1.x + Math.cos(rayRad) * rayLen;
  const rayEndY = gem1.y + Math.sin(rayRad) * rayLen;
  // Arrowhead at end of preview ray
  const arrowBack1X = rayEndX - Math.cos(rayRad - 0.42) * 15;
  const arrowBack1Y = rayEndY - Math.sin(rayRad - 0.42) * 15;
  const arrowBack2X = rayEndX - Math.cos(rayRad + 0.42) * 15;
  const arrowBack2Y = rayEndY - Math.sin(rayRad + 0.42) * 15;

  // Brass compass pointer coordinates relative to turtle center (0,0)
  // Knob sits cleanly inside/on the ring (r = 34) while degree labels sit far outside (r = 66) with wide spacing!
  const compassR = 38;
  const knobR = 34;
  const pointerX = Math.cos(rayRad) * knobR;
  const pointerY = Math.sin(rayRad) * knobR;

  // Show interactive Brass Compass Aiming Ring ONLY while adjusting before running (never while tracing or finished!)
  const showCompassAiming = runOutcome === "idle" || runOutcome === "angle_miss";

  return (
    <div className="flex-1 min-h-0 w-full relative overflow-hidden select-none">
      {/* FULL-BLEED BRIGHT DAYLIGHT ARCHITECT'S DRAFTING STUDIO BACKDROP */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1200 560"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="archWall" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="56%" stopColor="#f8fafc" />
            <stop offset="100%" stopColor="#fef9c3" />
          </linearGradient>
          <linearGradient id="archDesk" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="100%" stopColor="#fde68a" />
          </linearGradient>
        </defs>
        <rect width="1200" height="560" fill="url(#archWall)" />
        {/* Crisp Daylight Blueprint Grid Lines on Upper Drafting Stage */}
        <g stroke="#bae6fd" strokeWidth="1.2" opacity="0.6">
          {[100, 200, 300, 400, 500, 600, 700, 800, 900, 1000, 1100].map((gx) => (
            <line key={gx} x1={gx} y1="0" x2={gx} y2="386" />
          ))}
          {[80, 160, 240, 320].map((gy) => (
            <line key={gy} x1="0" y1={gy} x2="1200" y2={gy} />
          ))}
        </g>
        <rect x="0" y="386" width="1200" height="174" fill="url(#archDesk)" />
      </svg>

      {/* UNIFIED 1200x560 SUNLIT CLOCKWORK SPIRAL ARCHITECT STUDIO */}
      <svg
        ref={svgRef}
        viewBox="0 0 1200 560"
        preserveAspectRatio="xMidYMid meet"
        onPointerMove={onSvgMove}
        onPointerUp={onSvgUp}
        onPointerCancel={onSvgUp}
        className="relative z-10 w-full h-full touch-none"
      >
        <CommonWorldDefs />
        <rect x="0" y="384" width="1200" height="8" fill="url(#brassRich)" stroke="#78350f" strokeWidth="1.8" />

        {/* TOP 1-LINE STUDIO BANNER */}
        <rect
          x="126"
          y="10"
          width="948"
          height="34"
          rx="17"
          fill={
            runOutcome === "angle_miss" || runOutcome === "no_stop_spin"
              ? "#be123c"
              : runOutcome === "safe_done"
              ? "#059669"
              : "#0369a1"
          }
          stroke="#fef08a"
          strokeWidth="2.2"
        />
        <text x="600" y="31" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="900" fontFamily="monospace">
          {runOutcome === "angle_miss"
            ? "ANGLE OFF TARGET: Rotate the Clockwork Turtle's Brass Compass to aim at Gem 2!"
            : runOutcome === "no_stop_spin"
            ? "NO STOP RULE! Lock 'STOP IF LINE < 15px' into GATE 1 so the turtle halts!"
            : runOutcome === "safe_done"
            ? "BASE CASE TRUE: LINE < 15px -> STOPPED!"
            : "CLOCKWORK SPIRAL: Lock STOP BLOCK into GATE 1, rotate Turtle Compass to 90°, then RUN TURTLE!"}
        </text>

        {/* ====================================================================
            LEFT UPPER STAGE: TELEMETRY + SLEEK DISAPPEARING BRASS RAIL CLIP
            ==================================================================== */}
        {/* Left Borderless Architectural Drafting-Table Telemetry Readout (Directly on Grid) */}
        <g transform="translate(154, 144)" className="pointer-events-none">
          <text x="0" y="-34" textAnchor="middle" fill="#0369a1" fontSize="11" fontWeight="900" fontFamily="monospace">
            SPIRAL TELEMETRY
          </text>
          <line x1="-96" y1="-24" x2="96" y2="-24" stroke="#38bdf8" strokeWidth="1.8" opacity="0.75" />
          <text x="0" y="-2" textAnchor="middle" fill="#0c4a6e" fontSize="15.5" fontWeight="900" fontFamily="monospace">
            GEMS: {collectedGems} / 6
          </text>
          <text x="0" y="25" textAnchor="middle" fill={runOutcome === "safe_done" ? "#059669" : "#b45309"} fontSize="14" fontWeight="900" fontFamily="monospace">
            LINE: {currentLinePx}px
          </text>
          <text x="0" y="48" textAnchor="middle" fill={hasStopRule ? "#059669" : "#be123c"} fontSize="9.6" fontWeight="900" fontFamily="monospace">
            {runOutcome === "safe_done"
              ? "LINE < 15px -> STOPPED!"
              : hasStopRule
              ? "GATE 1 ARMED (< 15px)"
              : "GATE 1 OPEN (NO STOP)"}
          </text>
        </g>

        {/* SLEEK BRASS RAIL CLIP DIRECTLY ON WORKBENCH RAIL — HIDDEN ONCE PICKED UP OR LOCKED INTO GATE 1! */}
        {!hasStopRule && !dragStop && (
          <g transform={`translate(${HOLDER_X}, 384)`} className="pointer-events-none">
            <rect x="-82" y="-12" width="164" height="12" rx="4" fill="url(#brassRich)" stroke="#78350f" strokeWidth="2" />
            <rect x="-74" y="-22" width="14" height="14" rx="3" fill="url(#brassRich)" stroke="#78350f" strokeWidth="1.8" />
            <rect x="60" y="-22" width="14" height="14" rx="3" fill="url(#brassRich)" stroke="#78350f" strokeWidth="1.8" />
            <circle cx="-67" cy="-6" r="2.2" fill="#78350f" />
            <circle cx="67" cy="-6" r="2.2" fill="#78350f" />
          </g>
        )}

        {/* ====================================================================
            CENTER DRAFTING CANVAS: BOLD ~280px SPIRAL + LIVE AIMING RAY + 6 GEMS + TURTLE COMPASS
            ==================================================================== */}
        {/* Dotted 90° Square Spiral Target Blueprint */}
        <path
          d={targetDottedPath}
          fill="none"
          stroke="#0284c7"
          strokeWidth="3.2"
          strokeDasharray="7 6"
          opacity="0.52"
          className="pointer-events-none"
        />

        {/* LIVE DOTTED PREVIEW RAY SHOWING WHERE THE FIRST TURN AIMS RELATIVE TO THE 6 GEMS */}
        {showCompassAiming && !solved && (
          <g className="pointer-events-none">
            {/* First straight leg preview */}
            <line
              x1={START_X}
              y1={START_Y}
              x2={gem1.x}
              y2={gem1.y}
              stroke={turnAngle === 90 ? "#059669" : "#ea580c"}
              strokeWidth="3.4"
              strokeDasharray="8 5"
              opacity="0.82"
            />
            {/* First turned leg aiming ray */}
            <line
              x1={gem1.x}
              y1={gem1.y}
              x2={rayEndX}
              y2={rayEndY}
              stroke={turnAngle === 90 ? "#059669" : "#ea580c"}
              strokeWidth="4"
              strokeDasharray="8 5"
              strokeLinecap="round"
            />
            <polygon
              points={`${rayEndX.toFixed(1)},${rayEndY.toFixed(1)} ${arrowBack1X.toFixed(1)},${arrowBack1Y.toFixed(1)} ${arrowBack2X.toFixed(1)},${arrowBack2Y.toFixed(1)}`}
              fill={turnAngle === 90 ? "#059669" : "#ea580c"}
            />
            {/* Angle Callout Badge at First Corner */}
            <rect
              x={gem1.x + 16}
              y={gem1.y - 16}
              width="78"
              height="22"
              rx="11"
              fill={turnAngle === 90 ? "#059669" : "#ea580c"}
              stroke="#fef08a"
              strokeWidth="1.6"
            />
            <text
              x={gem1.x + 55}
              y={gem1.y - 1}
              textAnchor="middle"
              fill="#ffffff"
              fontSize="9.5"
              fontWeight="900"
              fontFamily="monospace"
            >
              AIM: {turnAngle}°
            </text>
          </g>
        )}

        {/* Center Stop Jewel */}
        <g transform={`translate(${target90.centerJewel.x.toFixed(1)}, ${target90.centerJewel.y.toFixed(1)})`} className="pointer-events-none">
          {runOutcome === "no_stop_spin" && (
            <motion.circle
              cx="0"
              cy="0"
              fill="none"
              stroke="#e11d48"
              strokeWidth="3.5"
              animate={{ r: [18, 28, 18] }}
              transition={{ type: "tween", repeat: Infinity, duration: 0.7 }}
            />
          )}
          <polygon
            points="0,-16 14,0 0,16 -14,0"
            fill={runOutcome === "safe_done" ? "#059669" : "#f59e0b"}
            stroke="#78350f"
            strokeWidth="2.4"
          />
          {runOutcome === "idle" && tracedSteps === 0 && (
            <text x="0" y="30" textAnchor="middle" fill="#92400e" fontSize="9.2" fontWeight="900" fontFamily="monospace">
              CENTER JEWEL
            </text>
          )}
        </g>

        {/* 6 Glowing Crystal Gems Along the 90° Square Spiral Corners */}
        {target90.gems.map((gem, idx) => {
          const hit = turnAngle === 90 && tracedSteps >= idx + 1;
          return (
            <g key={`gem-${idx}`} transform={`translate(${gem.x.toFixed(1)}, ${gem.y.toFixed(1)})`} className="pointer-events-none">
              {hit && <circle cx="0" cy="0" r="20" fill="#34d399" opacity="0.38" />}
              <polygon
                points="0,-13 11,0 0,13 -11,0"
                fill={hit ? "#059669" : "#0284c7"}
                stroke={hit ? "#fef08a" : "#ffffff"}
                strokeWidth="2.4"
              />
            </g>
          );
        })}

        {/* Live Traced Spiral Segments */}
        <g>
          {activeRun.segments.slice(0, tracedSteps).map((seg) => (
            <line
              key={`tr-${turnAngle}-${seg.step}`}
              x1={seg.x1}
              y1={seg.y1}
              x2={seg.x2}
              y2={seg.y2}
              stroke={turnAngle === 90 ? seg.color : "#e11d48"}
              strokeWidth="4.6"
              strokeLinecap="round"
            />
          ))}
        </g>

        {/* CLOCKWORK ART TURTLE + INTERACTIVE BRASS COMPASS (HIDDEN DURING TRACE & WHEN FINISHED!) */}
        <g transform={`translate(${turtlePose.x.toFixed(1)}, ${turtlePose.y.toFixed(1)})`}>
          {/* Tactile Brass Compass Aiming Ring — Shown ONLY while adjusting angle before running */}
          {showCompassAiming && (
            <g
              onPointerDown={(e) => {
                e.stopPropagation();
                svgRef.current?.setPointerCapture(e.pointerId);
                compassMovedRef.current = false;
                setDraggingCompass(true);
              }}
              className="cursor-grab active:cursor-grabbing"
            >
              {/* Outer Brass Protractor Ring */}
              <circle
                cx="0"
                cy="0"
                r={compassR}
                fill="#fffbeb"
                fillOpacity="0.48"
                stroke={turnAngle === 90 ? "#059669" : "#d97706"}
                strokeWidth="3.2"
              />
              {/* Widely Spaced Protractor Detent Ticks & Outer Degree Markers (45° / 60° / 90°) — Zero Knob Overlap! */}
              {[
                { deg: 45 as TurnAngleOption, labelDeg: 34 },
                { deg: 60 as TurnAngleOption, labelDeg: 63 },
                { deg: 90 as TurnAngleOption, labelDeg: 94 },
              ].map(({ deg, labelDeg }) => {
                const r = (deg * Math.PI) / 180;
                const lr = (labelDeg * Math.PI) / 180;
                const tx1 = Math.cos(r) * (compassR - 4);
                const ty1 = Math.sin(r) * (compassR - 4);
                const tx2 = Math.cos(r) * (compassR + 9);
                const ty2 = Math.sin(r) * (compassR + 9);
                const lx = Math.cos(lr) * (compassR + 28);
                const ly = Math.sin(lr) * (compassR + 28);
                const active = turnAngle === deg;
                return (
                  <g key={`tick-${deg}`}>
                    <line
                      x1={tx1}
                      y1={ty1}
                      x2={tx2}
                      y2={ty2}
                      stroke={active ? "#059669" : "#78350f"}
                      strokeWidth={active ? 3 : 2}
                      strokeLinecap="round"
                    />
                    <text
                      x={lx}
                      y={ly + 3.5}
                      textAnchor="middle"
                      fill={active ? "#059669" : "#78350f"}
                      fontSize="10.2"
                      fontWeight="900"
                      fontFamily="monospace"
                    >
                      {deg}°
                    </text>
                  </g>
                );
              })}
              {/* Rotating Brass Compass Pointer Needle & Tactile Knob (Seated cleanly inside outer label ring) */}
              <line
                x1="0"
                y1="0"
                x2={pointerX}
                y2={pointerY}
                stroke="#78350f"
                strokeWidth="5"
                strokeLinecap="round"
              />
              <line
                x1="0"
                y1="0"
                x2={pointerX}
                y2={pointerY}
                stroke={turnAngle === 90 ? "#10b981" : "#fbbf24"}
                strokeWidth="2.6"
                strokeLinecap="round"
              />
              <circle
                cx={pointerX}
                cy={pointerY}
                r="7.5"
                fill={turnAngle === 90 ? "#059669" : "url(#goldSeedGrad)"}
                stroke="#78350f"
                strokeWidth="2.2"
              />
              {/* 1-Line Compass Callout Cleanly Above Turtle */}
              <rect
                x="-90"
                y="-56"
                width="180"
                height="19"
                rx="9.5"
                fill="#0c4a6e"
                stroke="#fef08a"
                strokeWidth="1.5"
              />
              <text x="0" y="-43" textAnchor="middle" fill="#ffffff" fontSize="8.6" fontWeight="900" fontFamily="monospace">
                COMPASS: {turnAngle}° (CLICK/DRAG)
              </text>
            </g>
          )}

          {/* Clockwork Turtle Body */}
          <g transform={`rotate(${turtlePose.angle.toFixed(1)})`} className="pointer-events-none">
            <ClockworkTurtleSVG
              tracing={runOutcome === "running"}
              spinningForever={runOutcome === "no_stop_spin"}
            />
          </g>
        </g>

        {/* RIGHT UPPER STAGE: TACTILE "RUN TURTLE" BUTTON */}
        <g
          transform="translate(1042, 198)"
          onClick={handleRunTurtle}
          className={runOutcome === "running" ? "cursor-default" : "cursor-pointer"}
        >
          <rect
            x="-120"
            y="-32"
            width="240"
            height="64"
            rx="32"
            fill={solved ? "#059669" : turnAngle === 90 && hasStopRule ? "#d97706" : "#0284c7"}
            stroke="#78350f"
            strokeWidth="3.2"
          />
          <polygon points="-84,-10 -84,10 -66,0" fill="#fef08a" />
          <text x="14" y="5" textAnchor="middle" fill="#ffffff" fontSize="14.5" fontWeight="900" fontFamily="monospace">
            {runOutcome === "running" ? "TRACING..." : solved ? "RUN AGAIN" : "RUN TURTLE"}
          </text>
        </g>

        {/* ====================================================================
            BOTTOM WORKBENCH: HORIZONTAL 4-NODE RECURSIVE LOOP TRACK
            Return pipe curves cleanly from STEP 4 into top edge of GATE 1 (ZERO OVERLAP!)
            ==================================================================== */}
        {/* GLOWING ANIMATED RETURN PIPE: STEP 4 -> DIRECTLY INTO TOP EDGE OF GATE 1 */}
        <path
          d="M 1036 464 L 1036 420 Q 1036 412 1026 412 L 176 412 Q 166 412 166 420 L 166 456"
          fill="none"
          stroke="#78350f"
          strokeWidth="11"
          strokeLinecap="round"
        />
        <path
          d="M 1036 464 L 1036 420 Q 1036 412 1026 412 L 176 412 Q 166 412 166 420 L 166 456"
          fill="none"
          stroke={runOutcome === "safe_done" ? "#10b981" : "#38bdf8"}
          strokeWidth="6"
          strokeLinecap="round"
        />
        {/* Arrowhead terminates at y=463 — cleanly touching top border of GATE 1 (y=464) with zero overlap */}
        <polygon points="158,452 174,452 166,463" fill={runOutcome === "safe_done" ? "#10b981" : "#38bdf8"} />
        <circle r="4.6" fill="#fef08a">
          <animateMotion
            dur="1.8s"
            repeatCount="indefinite"
            path="M 1036 464 L 1036 412 L 166 412 L 166 456"
          />
        </circle>
        <text x="600" y="434" textAnchor="middle" fill="#92400e" fontSize="9.2" fontWeight="900" fontFamily="monospace">
          EVERY RECURSIVE LOOP RETURNS STRAIGHT INTO GATE 1 (BASE CASE CHECK)
        </text>

        {/* Forward Brass Pipes Connecting GATE 1 -> STEP 2 -> STEP 3 -> STEP 4 */}
        {[
          [296, 326],
          [568, 600],
          [874, 906],
        ].map(([xA, xB], idx) => (
          <g key={`fwd-${idx}`}>
            <line x1={xA} y1="502" x2={xB} y2="502" stroke="#78350f" strokeWidth="8" />
            <line x1={xA} y1="502" x2={xB - 4} y2="502" stroke="#f59e0b" strokeWidth="4" />
            <polygon points={`${xB - 8},494 ${xB + 2},502 ${xB - 8},510`} fill="#78350f" />
          </g>
        ))}

        {/* NODE 1: [GATE 1: BASE CASE ENTRY] — Clean exact-bounds replacement, zero overlapping layers! */}
        <g transform={`translate(${GATE1_X}, ${GATE1_Y})`} onClick={attachStopRule} className={!hasStopRule ? "cursor-pointer" : ""}>
          {!hasStopRule ? (
            <>
              <rect
                x="-130"
                y="-38"
                width="260"
                height="76"
                rx="16"
                fill="#fff1f2"
                stroke="#e11d48"
                strokeWidth="3.2"
                strokeDasharray="7 4"
              />
              <text x="0" y="-14" textAnchor="middle" fill="#be123c" fontSize="9.4" fontWeight="900" fontFamily="monospace">
                GATE 1: BASE CASE ENTRY
              </text>
              <text x="0" y="8" textAnchor="middle" fill="#9f1239" fontSize="11.2" fontWeight="900" fontFamily="monospace">
                EMPTY — NO STOP RULE!
              </text>
              <text x="0" y="26" textAnchor="middle" fill="#be123c" fontSize="8.8" fontWeight="900" fontFamily="monospace">
                DROP OR CLICK STOP BLOCK HERE
              </text>
            </>
          ) : (
            <>
              {runOutcome === "safe_done" && (
                <motion.rect
                  x="-135"
                  y="-43"
                  width="270"
                  height="86"
                  rx="20"
                  fill="none"
                  stroke="#34d399"
                  strokeWidth="4"
                  animate={{ opacity: [0.95, 0.3, 0.95] }}
                  transition={{ type: "tween", repeat: Infinity, duration: 1.1 }}
                />
              )}
              <rect
                x="-130"
                y="-38"
                width="260"
                height="76"
                rx="16"
                fill={runOutcome === "safe_done" ? "#059669" : "#047857"}
                stroke={runOutcome === "safe_done" ? "#fef08a" : "#34d399"}
                strokeWidth="3.2"
              />
              <text x="0" y="-14" textAnchor="middle" fill="#fef08a" fontSize="9.4" fontWeight="900" fontFamily="monospace">
                GATE 1: BASE CASE ENTRY
              </text>
              <text
                x="0"
                y="8"
                textAnchor="middle"
                fill="#ffffff"
                fontSize={runOutcome === "safe_done" ? "9.5" : "11.5"}
                fontWeight="900"
                fontFamily="monospace"
              >
                {runOutcome === "safe_done" ? "BASE CASE TRUE: LINE < 15px" : "STOP IF LINE < 15px"}
              </text>
              <text x="0" y="26" textAnchor="middle" fill="#bbf7d0" fontSize="8.8" fontWeight="900" fontFamily="monospace">
                {runOutcome === "safe_done" ? "-> STOPPED!" : "CHECKS BEFORE EVERY TURN"}
              </text>
            </>
          )}
        </g>

        {/* NODE 2: [STEP 2: DRAW & SHRINK 85%] */}
        <g transform="translate(447, 502)">
          <rect x="-121" y="-38" width="242" height="76" rx="16" fill="#0284c7" stroke="#0c4a6e" strokeWidth="3" />
          <text x="0" y="-12" textAnchor="middle" fill="#bae6fd" fontSize="9.4" fontWeight="900" fontFamily="monospace">
            STEP 2
          </text>
          <text x="0" y="9" textAnchor="middle" fill="#ffffff" fontSize="11.5" fontWeight="900" fontFamily="monospace">
            DRAW &amp; SHRINK 85%
          </text>
          <text x="0" y="26" textAnchor="middle" fill="#fef08a" fontSize="8.8" fontWeight="900" fontFamily="monospace">
            NOW: {currentLinePx}px
          </text>
        </g>

        {/* NODE 3: [STEP 3: TURN ANGLE] — Live readout synced with Clockwork Turtle's Brass Compass (ZERO MCQ BUTTONS!) */}
        <g transform="translate(737, 502)">
          <rect
            x="-137"
            y="-38"
            width="274"
            height="76"
            rx="16"
            fill={turnAngle === 90 ? "#ecfdf5" : "#fffbeb"}
            stroke={turnAngle === 90 ? "#059669" : "#d97706"}
            strokeWidth="3.2"
          />
          <text x="0" y="-14" textAnchor="middle" fill="#78350f" fontSize="9.4" fontWeight="900" fontFamily="monospace">
            STEP 3: TURN ANGLE
          </text>
          <text
            x="0"
            y="10"
            textAnchor="middle"
            fill={turnAngle === 90 ? "#047857" : "#b45309"}
            fontSize="14.5"
            fontWeight="900"
            fontFamily="monospace"
          >
            TURN {turnAngle}°
          </text>
          <text
            x="0"
            y="26"
            textAnchor="middle"
            fill={turnAngle === 90 ? "#059669" : "#0369a1"}
            fontSize="8.8"
            fontWeight="900"
            fontFamily="monospace"
          >
            {turnAngle === 90 ? "COMPASS LOCKED TO 90° SPIRAL!" : "SET ON TURTLE'S BRASS COMPASS"}
          </text>
        </g>

        {/* NODE 4: [STEP 4: REPEAT INSIDE SELF] */}
        <g transform="translate(1036, 502)">
          <rect x="-130" y="-38" width="260" height="76" rx="16" fill="#0f766e" stroke="#134e4a" strokeWidth="3" />
          <text x="0" y="-12" textAnchor="middle" fill="#99f6e4" fontSize="9.4" fontWeight="900" fontFamily="monospace">
            STEP 4
          </text>
          <text x="0" y="9" textAnchor="middle" fill="#ffffff" fontSize="11.5" fontWeight="900" fontFamily="monospace">
            REPEAT INSIDE SELF
          </text>
          <text x="0" y="26" textAnchor="middle" fill="#fef08a" fontSize="8.8" fontWeight="900" fontFamily="monospace">
            LOOPS BACK TO GATE 1
          </text>
        </g>

        {/* DRAGGABLE GREEN STOP BLOCK (Docked cleanly on the Brass Rail Clip; rendered on top while dragging!) */}
        {!hasStopRule && (
          <g
            transform={`translate(${dragStop ? dragStop.x : HOLDER_X}, ${dragStop ? dragStop.y : HOLDER_Y})`}
            onPointerDown={(e) => {
              if (runOutcome === "running") return;
              e.stopPropagation();
              svgRef.current?.setPointerCapture(e.pointerId);
              stopMovedRef.current = false;
              setDragStop({ x: HOLDER_X, y: HOLDER_Y });
            }}
            className="cursor-grab active:cursor-grabbing"
          >
            {runOutcome === "no_stop_spin" && (
              <rect x="-128" y="-30" width="256" height="60" rx="16" fill="none" stroke="#e11d48" strokeWidth="3.8" />
            )}
            <rect x="-122" y="-25" width="244" height="50" rx="12" fill="#059669" stroke="#fef08a" strokeWidth="2.8" />
            <text x="0" y="-2" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="900" fontFamily="monospace">
              STOP IF LINE &lt; 15px
            </text>
            <text x="0" y="14" textAnchor="middle" fill="#fef08a" fontSize="8.5" fontWeight="900" fontFamily="monospace">
              DRAG OR CLICK INTO GATE 1
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

/* ============================================================================
   MAIN ORCHESTRATOR: MEET THE ALGORITHM ARTIST!
   ============================================================================ */

interface LevelMeta {
  index: 0 | 1 | 2;
  code: string;
  title: string;
  goalLine: string;
  introVoice: string;
  beamClass: string;
  bgClass: string;
}

const LEVELS: LevelMeta[] = [
  {
    index: 0,
    code: "R1",
    title: "The Fractal Crystal Triangle",
    goalLine: "Goal: Snap 'STOP AT DEPTH 3' onto the Crystal Geometry Table, then subdivide from Depth 0 (1) to Depth 3 (27).",
    introVoice:
      "The Fractal Crystal Triangle. Replace one triangle with three half-size triangles at its corners! Snap the Stop at Depth 3 base case prism lock onto the table, then step cleanly through Depth 0 to Depth 3.",
    beamClass: "from-sky-800 via-cyan-700 to-sky-800 border-sky-200",
    bgClass: "bg-sky-100",
  },
  {
    index: 1,
    code: "R2",
    title: "Sunbeam Canopy Grower",
    goalLine: "Goal: Graft the 'Split into 2' rule onto the trunk and pull the garden lever to grow all 5 leafy layers.",
    introVoice:
      "Sunbeam Canopy Grower. Drag the Split into two smaller branches graft tag onto the sapling trunk, then pull the garden post lever to grow pointed leaves and sixteen golden blossoms.",
    beamClass: "from-emerald-950 via-teal-900 to-emerald-950 border-amber-300",
    bgClass: "bg-emerald-100",
  },
  {
    index: 2,
    code: "R3",
    title: "Sunlit Clockwork Spiral Studio",
    goalLine: "Goal: Lock STOP IF LINE < 15px into GATE 1, rotate the Turtle's Brass Compass to 90°, and press RUN TURTLE.",
    introVoice:
      "Sunlit Clockwork Spiral Studio. Drag Stop if line is under fifteen pixels from the left holder into Gate One, rotate the brass compass directly on the clockwork turtle to aim at the crystal gems, and press Run Turtle.",
    beamClass: "from-sky-800 via-teal-700 to-sky-800 border-amber-300",
    bgClass: "bg-sky-100",
  },
];

export default function RecursionProceduralArtLab() {
  const { playClick, playSwitch, playSuccess, playError, playBeep } = useLabAudio();
  const { reportComplete, getTimeTaken } = useLMSBridge("recursion-procedural-art");
  const { speak, stop: stopVoice, setMuted: setVoiceMuted } = useVoiceAssistant({ lang: "en-IN" });

  const [levelIdx, setLevelIdx] = useState<0 | 1 | 2>(0);
  const [r1SubTitle, setR1SubTitle] = useState<string>("THE FRACTAL CRYSTAL TRIANGLE");
  const [resetTick, setResetTick] = useState(0);
  const [levelSolved, setLevelSolved] = useState(false);
  const [score, setScore] = useState(0);
  const [status, setStatusState] = useState<{ text: string; tone: StatusTone }>({
    text: LEVELS[0].goalLine,
    tone: "info",
  });
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const hintProviderRef = useRef<() => string>(() => LEVELS[0].goalLine);
  const reportedRef = useRef(false);
  const hasIntroRef = useRef(false);
  const modalTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const currentLevel = LEVELS[levelIdx];

  const setStatus = useCallback((text: string, tone: StatusTone = "info") => {
    setStatusState({ text, tone });
  }, []);

  const registerHint = useCallback((fn: () => string) => {
    hintProviderRef.current = fn;
  }, []);

  useEffect(() => {
    if (!hasIntroRef.current) {
      hasIntroRef.current = true;
      const t = setTimeout(() => {
        speak(LEVELS[0].introVoice);
      }, 420);
      return () => clearTimeout(t);
    }
  }, [speak]);

  useEffect(() => {
    return () => {
      if (modalTimerRef.current) clearTimeout(modalTimerRef.current);
      stopVoice();
    };
  }, [stopVoice]);

  const handleLevelComplete = useCallback(
    (scoreAward: number) => {
      setScore(scoreAward);
      setLevelSolved(true);

      if (levelIdx === 2) {
        if (!reportedRef.current) {
          reportedRef.current = true;
          reportComplete({
            labId: "recursion-procedural-art",
            points: 100,
            timeTaken: getTimeTaken(),
          });
        }
        modalTimerRef.current = setTimeout(() => {
          try {
            confetti({
              particleCount: 120,
              spread: 80,
              origin: { y: 0.56 },
              colors: ["#38bdf8", "#34d399", "#fbbf24", "#fb7185", "#a78bfa"],
            });
          } catch {
            /* ignore */
          }
          setShowCompletionModal(true);
        }, 1250);
      }
    },
    [getTimeTaken, levelIdx, reportComplete]
  );

  const handleNextLevel = useCallback(() => {
    if (levelIdx >= 2) return;
    playClick();
    const nextIdx = (levelIdx + 1) as 0 | 1 | 2;
    setLevelIdx(nextIdx);
    setLevelSolved(false);
    setStatusState({ text: LEVELS[nextIdx].goalLine, tone: "info" });
    speak(LEVELS[nextIdx].introVoice);
  }, [levelIdx, playClick, speak]);

  const handleReset = useCallback(() => {
    if (modalTimerRef.current) {
      clearTimeout(modalTimerRef.current);
      modalTimerRef.current = null;
    }
    stopVoice();
    playClick();
    setLevelIdx(0);
    setR1SubTitle("THE FRACTAL CRYSTAL TRIANGLE");
    setResetTick((t) => t + 1);
    setLevelSolved(false);
    setScore(0);
    setShowCompletionModal(false);
    setStatusState({ text: LEVELS[0].goalLine, tone: "info" });
    setTimeout(() => {
      speak(LEVELS[0].introVoice);
    }, 250);
  }, [playClick, speak, stopVoice]);

  const handleHint = useCallback(() => {
    playClick();
    const msg = hintProviderRef.current();
    setStatusState({ text: msg, tone: "info" });
    speak(msg);
  }, [playClick, speak]);

  const navExtraControls = (
    <>
      <button
        type="button"
        onClick={handleHint}
        className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl bg-amber-500 border border-amber-700 text-white font-mono font-bold text-xs shadow-xs active:scale-95 transition"
      >
        <Lightbulb className="w-3.5 h-3.5 text-white" />
        <span>Hint</span>
      </button>
      <button
        type="button"
        onClick={handleReset}
        className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl bg-sky-600 border border-sky-800 text-white font-mono font-bold text-xs shadow-xs active:scale-95 transition"
      >
        <RotateCcw className="w-3.5 h-3.5 text-white" />
        <span>Reset</span>
      </button>
    </>
  );

  const sharedLevelProps: StudioLevelProps = {
    playClick,
    playSwitch,
    playSuccess,
    playError,
    playBeep,
    speak,
    setStatus,
    onRegisterHint: registerHint,
    onLevelComplete: handleLevelComplete,
  };

  return (
    <LabShell
      labId="recursion-procedural-art"
      title="Meet the Algorithm Artist!"
      module="Algorithms & Logic"
      score={score}
      maxScore={100}
      navExtra={navExtraControls}
      fullBleed
      bgOverride={currentLevel.bgClass}
      onMuteChange={(muted) => setVoiceMuted(muted)}
    >
      <div className="flex-1 min-h-0 w-full flex flex-col overflow-hidden relative">
        {/* Top Slim World Header Beam & Level Lamps */}
        <div
          className={`relative z-30 shrink-0 w-full px-3 sm:px-5 py-1 bg-gradient-to-r ${currentLevel.beamClass} border-b-2 flex items-center justify-between gap-2 shadow-sm`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-300 border border-amber-950 shrink-0" />
            <span className="font-mono font-extrabold text-[11px] sm:text-xs text-amber-50 uppercase tracking-wider truncate">
              {levelIdx === 0
                ? `R1 — ${r1SubTitle}`
                : `${currentLevel.code} — ${currentLevel.title}`}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {LEVELS.map((lvl) => {
              const isPast = lvl.index < levelIdx || (lvl.index === levelIdx && levelSolved);
              const isCurrent = lvl.index === levelIdx && !levelSolved;
              return (
                <div
                  key={lvl.code}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full border font-mono font-extrabold text-[10px] transition-colors ${
                    isPast
                      ? "bg-emerald-600 border-emerald-200 text-white"
                      : isCurrent
                      ? "bg-amber-300 border-amber-50 text-amber-950"
                      : "bg-black/25 border-amber-200/35 text-amber-100/80"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isPast ? "bg-emerald-100" : isCurrent ? "bg-amber-950 animate-pulse" : "bg-amber-200/40"
                    }`}
                  />
                  <span>{lvl.code}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ACTIVE FULL-BLEED 2D STUDIO WORLD */}
        <div className="flex-1 min-h-0 w-full flex flex-col overflow-hidden relative">
          {levelIdx === 0 && (
            <Level1CrystalTriangle
              key={`r1-${resetTick}`}
              {...sharedLevelProps}
              onSubTitleChange={setR1SubTitle}
            />
          )}
          {levelIdx === 1 && <Level2SunbeamCanopy key={`r2-${resetTick}`} {...sharedLevelProps} />}
          {levelIdx === 2 && <Level3ClockworkSpiral key={`r3-${resetTick}`} {...sharedLevelProps} />}
        </div>

        {/* FLUSH BOTTOM STATUS STRIP */}
        <div
          className={`relative z-30 shrink-0 w-full px-3 sm:px-5 py-1.5 border-t-2 flex items-center justify-between gap-2 shadow-inner transition-colors ${
            status.tone === "warn"
              ? "bg-gradient-to-r from-rose-900 via-rose-800 to-rose-900 border-amber-300 text-amber-50"
              : status.tone === "success"
              ? "bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 border-amber-300 text-emerald-50"
              : "bg-gradient-to-r from-teal-950 via-emerald-950 to-teal-950 border-emerald-400 text-emerald-100"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {status.tone === "warn" ? (
              <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
            ) : status.tone === "success" ? (
              <Check className="w-4 h-4 text-emerald-300 shrink-0 stroke-[3]" />
            ) : (
              <Lightbulb className="w-4 h-4 text-amber-300 shrink-0" />
            )}
            <span className="font-sans font-bold text-[11px] sm:text-xs truncate">
              {status.text}
            </span>
          </div>

          {levelSolved && levelIdx < 2 && (
            <motion.button
              type="button"
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleNextLevel}
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-xl bg-emerald-500 border-2 border-amber-200 text-white font-mono font-extrabold text-xs shadow-md"
            >
              <span>Next Level</span>
              <ArrowRight className="w-3.5 h-3.5 text-white" />
            </motion.button>
          )}
        </div>

        {/* UNIVERSAL COMPLETION MODAL */}
        <AnimatePresence>
          {showCompletionModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-emerald-950/55 backdrop-blur-xs"
            >
              <motion.div
                initial={{ scale: 0.86, y: 16, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
                className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-amber-100 via-emerald-50 to-teal-100 border-4 border-emerald-400 shadow-2xl p-6 sm:p-8 text-center"
              >
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-amber-500 border-4 border-amber-200 shadow-md flex items-center justify-center">
                  <Award className="w-9 h-9 text-white" />
                </div>

                <h2 className="font-sans font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight mb-5">
                  Congrats! You have completed Meet the Algorithm Artist!.
                </h2>

                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-600 border-2 border-emerald-800 text-white font-mono font-bold text-sm shadow-md active:scale-95 transition"
                >
                  <RotateCcw className="w-4 h-4 text-white" />
                  <span>Play Again</span>
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </LabShell>
  );
}
