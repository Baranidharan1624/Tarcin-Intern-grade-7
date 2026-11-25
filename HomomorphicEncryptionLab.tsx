"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
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
   SHARED TYPES & SVG COORDINATE HELPER
   ============================================================================ */

type StatusTone = "info" | "warn" | "success";
type EyeState = "idle" | "safe" | "alert" | "blind";

interface LevelProps {
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

function clientToSvgPoint(
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

/* ============================================================================
   SHARED BESPOKE SVG SYMBOLS (Rendered directly in unified 1200x560 stage)
   ============================================================================ */

function SvgBrassKey({
  x = 0,
  y = 0,
  scale = 1,
  glow = false,
}: {
  x?: number;
  y?: number;
  scale?: number;
  glow?: boolean;
}) {
  return (
    <g transform={`translate(${x}, ${y}) scale(${scale})`}>
      {glow && <ellipse cx="0" cy="0" rx="56" ry="26" fill="#fde047" opacity="0.34" />}
      {/* Ornate bow ring */}
      <circle cx="-30" cy="0" r="19" fill="url(#sharedGold)" stroke="#451a03" strokeWidth="3" />
      <circle cx="-30" cy="0" r="9.5" fill="#fffbeb" stroke="#92400e" strokeWidth="2.2" />
      {/* Collar */}
      <rect x="-12" y="-9" width="10" height="18" rx="3" fill="#fde68a" stroke="#451a03" strokeWidth="2.2" />
      {/* Shaft */}
      <rect x="-2" y="-5" width="54" height="10" rx="4" fill="url(#sharedGold)" stroke="#451a03" strokeWidth="2.4" />
      {/* Key teeth */}
      <path
        d="M 22 5 L 22 18 L 31 18 L 31 11 L 39 11 L 39 19 L 49 19 L 49 5 Z"
        fill="url(#sharedGold)"
        stroke="#451a03"
        strokeWidth="2.4"
        strokeLinejoin="round"
      />
      <line x1="2" y1="-1.5" x2="46" y2="-1.5" stroke="#fef9c3" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

function SvgPrivacyEye({
  cx,
  cy,
  state,
  lookX = 0,
}: {
  cx: number;
  cy: number;
  state: EyeState;
  lookX?: number;
}) {
  const isAlert = state === "alert";
  const isSafe = state === "safe";
  const isBlind = state === "blind";

  return (
    <g transform={`translate(${cx}, ${cy})`}>
      <motion.g
        animate={isAlert ? { x: [-7, 7, -5, 5, 0] } : { x: 0 }}
        transition={isAlert ? { type: "tween", duration: 0.4 } : { duration: 0.2 }}
      >
      {/* Scan cone underneath when active */}
      {(isAlert || isSafe) && (
        <path
          d="M -28 22 L -56 54 L 56 54 L 28 22 Z"
          fill={isAlert ? "#f43f5e" : "#10b981"}
          opacity="0.32"
        />
      )}
      {/* Brass housing */}
      <path
        d="M -56 0 Q 0 -34 56 0 Q 0 34 -56 0 Z"
        fill="url(#sharedGold)"
        stroke="#451a03"
        strokeWidth="3.2"
      />
      <path
        d="M -46 0 Q 0 -24 46 0 Q 0 24 -46 0 Z"
        fill={isAlert ? "#ffe4e6" : "#fffbeb"}
        stroke="#92400e"
        strokeWidth="1.8"
      />
      <motion.g
        animate={{ x: isAlert ? 0 : lookX }}
        transition={{ type: "spring", stiffness: 260, damping: 22 }}
      >
        <circle
          cx="0"
          cy="0"
          r={isAlert ? 16 : 13.5}
          fill={isAlert ? "#e11d48" : isSafe ? "#059669" : "#0284c7"}
          stroke="#0f172a"
          strokeWidth="1.8"
        />
        <circle cx="0" cy="0" r={isAlert ? 6.5 : 5.5} fill="#0f172a" />
        <circle cx="-5" cy="-5" r="2.8" fill="#ffffff" opacity="0.9" />
        {isBlind && (
          <text
            x="0"
            y="5"
            textAnchor="middle"
            fill="#fef08a"
            fontSize="14"
            fontWeight="900"
            fontFamily="monospace"
          >
            ?
          </text>
        )}
      </motion.g>
      <circle cx="-51" cy="0" r="2.5" fill="#fef3c7" stroke="#451a03" strokeWidth="1" />
      <circle cx="51" cy="0" r="2.5" fill="#fef3c7" stroke="#451a03" strokeWidth="1" />
      {/* Engraved status badge below eye */}
      <rect
        x="-56"
        y="20"
        width="112"
        height="19"
        rx="9.5"
        fill={isAlert ? "#e11d48" : isSafe ? "#047857" : isBlind ? "#d97706" : "#451a03"}
        stroke="#fde68a"
        strokeWidth="1.8"
      />
      <text
        x="0"
        y="33"
        textAnchor="middle"
        fill="#fef9c3"
        fontSize="9.5"
        fontWeight="800"
        fontFamily="monospace"
      >
        {isAlert ? "LOCK FIRST!" : isSafe ? "SEALED SAFE" : isBlind ? "BLIND (?)" : "PRIVACY EYE"}
      </text>
      </motion.g>
    </g>
  );
}

function SvgNoKeyPlaque({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        x="-48"
        y="-15"
        width="96"
        height="30"
        rx="10"
        fill="url(#noKeyRed)"
        stroke="#fde68a"
        strokeWidth="2.4"
      />
      <circle cx="-36" cy="0" r="2.2" fill="#fde68a" />
      <circle cx="36" cy="0" r="2.2" fill="#fde68a" />
      <text
        x="0"
        y="4.5"
        textAnchor="middle"
        fill="#ffffff"
        fontSize="12"
        fontWeight="900"
        fontFamily="monospace"
      >
        NO KEY
      </text>
    </g>
  );
}

function SvgGear({
  cx,
  cy,
  r = 34,
  spinning = false,
  reverse = false,
  fill = "#f59e0b",
}: {
  cx: number;
  cy: number;
  r?: number;
  spinning?: boolean;
  reverse?: boolean;
  fill?: string;
}) {
  const s = r / 30;
  return (
    <g transform={`translate(${cx}, ${cy}) scale(${s})`}>
      <motion.g
        animate={spinning ? { rotate: reverse ? -360 : 360 } : { rotate: 0 }}
        transition={
          spinning
            ? { type: "tween", repeat: Infinity, duration: 2.2, ease: "linear" }
            : { duration: 0.35 }
        }
      >
        <path
          d="M -4 -29 L 4 -29 L 6 -21 L 12 -18 L 19 -24 L 25 -17 L 19 -10 L 21 -4 L 29 -2 L 29 6 L 21 8 L 18 14 L 23 21 L 16 27 L 9 21 L 3 23 L 1 29 L -7 29 L -9 22 L -15 19 L -22 24 L -28 17 L -22 10 L -24 4 L -29 2 L -29 -6 L -21 -8 L -18 -14 L -23 -21 L -16 -27 L -9 -21 L -5 -23 Z"
          fill={fill}
          stroke="#451a03"
          strokeWidth="2.4"
          strokeLinejoin="round"
        />
        <circle cx="0" cy="0" r="11" fill="#fef3c7" stroke="#451a03" strokeWidth="2.4" />
        <circle cx="0" cy="0" r="4.5" fill="#78350f" />
      </motion.g>
    </g>
  );
}

function SvgPatternGlyph({
  pattern,
  size = 22,
  spinning = false,
  tint = "cyan",
}: {
  pattern: "wave" | "star" | "diamond";
  size?: number;
  spinning?: boolean;
  tint?: "cyan" | "emerald" | "amber";
}) {
  const strokeMain = tint === "emerald" ? "#34d399" : tint === "amber" ? "#fbbf24" : "#38bdf8";
  const strokeAccent = "#fef08a";
  const s = size / 24;

  return (
    <g transform={`scale(${s})`}>
      <motion.g
        animate={spinning ? { rotate: 360 } : { rotate: 0 }}
        transition={
          spinning
            ? { type: "tween", repeat: Infinity, duration: 1.8, ease: "linear" }
            : { duration: 0.25 }
        }
      >
        <circle
          cx="0"
          cy="0"
          r="20"
          fill="none"
          stroke={strokeMain}
          strokeWidth="2.5"
          strokeDasharray="6 4"
        />
        {pattern === "wave" && (
          <>
            <path d="M -13 -4 Q -6 -14 0 -4 T 13 -4" fill="none" stroke={strokeAccent} strokeWidth="3" strokeLinecap="round" />
            <path d="M -13 6 Q -6 -4 0 6 T 13 6" fill="none" stroke={strokeMain} strokeWidth="2.6" strokeLinecap="round" />
          </>
        )}
        {pattern === "star" && (
          <polygon
            points="0,-15 4,-5 15,-4 6,3 9,14 0,8 -9,14 -6,3 -15,-4 -4,-5"
            fill={strokeAccent}
            stroke="#92400e"
            strokeWidth="1.8"
            strokeLinejoin="round"
          />
        )}
        {pattern === "diamond" && (
          <>
            <polygon
              points="0,-14 14,0 0,14 -14,0"
              fill="none"
              stroke={strokeAccent}
              strokeWidth="3"
              strokeLinejoin="round"
            />
            <circle cx="0" cy="0" r="5" fill={strokeMain} />
          </>
        )}
      </motion.g>
    </g>
  );
}

function SvgPadlockBadge({ x, y, locked }: { x: number; y: number; locked: boolean }) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <circle
        cx="0"
        cy="0"
        r="11"
        fill={locked ? "#059669" : "#e11d48"}
        stroke="#fef9c3"
        strokeWidth="2"
      />
      {locked ? (
        <>
          <path d="M -4 -1 L -4 -4 A 4 4 0 0 1 4 -4 L 4 -1" fill="none" stroke="#ffffff" strokeWidth="2" />
          <rect x="-5.5" y="-1" width="11" height="7.5" rx="2" fill="#ffffff" />
        </>
      ) : (
        <>
          <path d="M -4 -1 L -4 -4 A 4 4 0 0 1 3 -6" fill="none" stroke="#ffffff" strokeWidth="2" />
          <rect x="-5.5" y="-1" width="11" height="7.5" rx="2" fill="#ffffff" />
        </>
      )}
    </g>
  );
}

function SharedSvgDefs() {
  return (
    <defs>
      <linearGradient id="sharedGold" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef9c3" />
        <stop offset="45%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#92400e" />
      </linearGradient>
      <linearGradient id="sharedGoldVert" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" />
        <stop offset="50%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#78350f" />
      </linearGradient>
      <linearGradient id="noKeyRed" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#e11d48" />
        <stop offset="100%" stopColor="#881337" />
      </linearGradient>
      <linearGradient id="glassClear" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.92" />
        <stop offset="50%" stopColor="#ffffff" stopOpacity="0.58" />
        <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.88" />
      </linearGradient>
      <linearGradient id="sealedBlue" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#0369a1" />
        <stop offset="100%" stopColor="#1e3a8a" />
      </linearGradient>
      <linearGradient id="sealedGreen" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#059669" />
        <stop offset="100%" stopColor="#064e3b" />
      </linearGradient>
    </defs>
  );
}

/* ============================================================================
   LEVEL 1 (R1) — SECRET SAVINGS COMBINER (Encrypted Math: 12 + 15 = 27)
   Full-bleed unified-coordinate sunlit amber brass foundry
   ============================================================================ */

interface SavingsJar {
  id: string;
  value: number;
  pedestalX: number;
  domeSlotX: number;
  locked: boolean;
  state: "pedestal" | "routing" | "in_dome";
  pattern: "wave" | "diamond";
}

type Level1Stage = "loading" | "fusing" | "delivering" | "docked" | "unlocking" | "revealed";

function Level1SavingsFoundry({
  playClick,
  playSwitch,
  playSuccess,
  playError,
  playBeep,
  speak,
  setStatus,
  onRegisterHint,
  onLevelComplete,
}: LevelProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [jars, setJars] = useState<SavingsJar[]>([
    { id: "j12", value: 12, pedestalX: 118, domeSlotX: 520, locked: false, state: "pedestal", pattern: "wave" },
    { id: "j15", value: 15, pedestalX: 242, domeSlotX: 640, locked: false, state: "pedestal", pattern: "diamond" },
  ]);
  const [stage, setStage] = useState<Level1Stage>("loading");
  const [eyeState, setEyeState] = useState<EyeState>("idle");
  const [bouncingId, setBouncingId] = useState<string | null>(null);

  // Interactive SVG drag states (pixel-exact in 1200x560 coordinate space!)
  const [dragKeyLeft, setDragKeyLeft] = useState<{ x: number; y: number } | null>(null);
  const [dragKeyRight, setDragKeyRight] = useState<{ x: number; y: number } | null>(null);
  const [dragJar, setDragJar] = useState<{ id: string; x: number; y: number } | null>(null);
  const [leverOffset, setLeverOffset] = useState(0); // 0 to 105
  const leverDraggingRef = useRef(false);
  const leverStartYRef = useRef(0);
  const leverFiredRef = useRef(false);
  const pointerMovedRef = useRef(false);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
  }, []);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  const unlockedCount = jars.filter((j) => !j.locked).length;
  const allInDome = jars.every((j) => j.state === "in_dome");
  const anyRouting = jars.some((j) => j.state === "routing");

  useEffect(() => {
    onRegisterHint(() => {
      if (stage === "loading") {
        if (unlockedCount > 0) {
          return "Drag or tap the left Brass Master Key onto clear bell-jars 12 and 15 to lock both savings numbers.";
        }
        if (!allInDome) {
          return "Drag or tap each sealed cube to route it through the overhead brass pipe into the Glass Fusion Dome.";
        }
        return "Pull the Brass Combine Lever downward on the right side of the Fusion Dome to add both cubes while locked.";
      }
      if (stage === "docked") {
        return "Drag or tap the right Brass Master Key onto the merged cube in the Private Safe to reveal 27.";
      }
      return "Watch the keyless foundry combine the locked savings cubes without ever opening them!";
    });
  }, [allInDome, onRegisterHint, stage, unlockedCount]);

  const lockJar = useCallback(
    (id: string) => {
      if (stage !== "loading") return;
      const target = jars.find((j) => j.id === id);
      if (!target || target.locked) return;

      playSwitch();
      playBeep(560);
      setJars((prev) => prev.map((j) => (j.id === id ? { ...j, locked: true } : j)));

      const leftOpen = jars.filter((j) => !j.locked && j.id !== id).length;
      if (leftOpen === 0) {
        setStatus("Both savings jars locked! Drag or tap each sealed cube to send it through the pipe into the Fusion Dome.", "success");
        speak("Both secret numbers are locked! Now route both sealed cubes through the pipe into the glass fusion dome.");
      } else {
        setStatus("Locked! Now seal the second glass bell-jar with your Brass Master Key.", "info");
      }
    },
    [jars, playBeep, playSwitch, setStatus, speak, stage]
  );

  const routeJarToDome = useCallback(
    (id: string) => {
      if (stage !== "loading") return;
      const target = jars.find((j) => j.id === id);
      if (!target || target.state !== "pedestal") return;

      if (!target.locked) {
        playError();
        setEyeState("alert");
        setBouncingId(id);
        setStatus(`Oops! ${target.value} is still unlocked! Seal it with your Brass Key first so the foundry cannot peek.`, "warn");
        speak(`Oops! ${target.value} is open! Lock it with your Brass Master Key first so the foundry cannot peek.`);
        schedule(() => {
          setBouncingId(null);
          setEyeState("idle");
        }, 1150);
        return;
      }

      playSwitch();
      playBeep(640);
      setEyeState("safe");
      setJars((prev) => prev.map((j) => (j.id === id ? { ...j, state: "routing" } : j)));

      schedule(() => {
        playBeep(720);
        setJars((prev) => prev.map((j) => (j.id === id ? { ...j, state: "in_dome" } : j)));
        const readyAfter = jars.every((j) => j.id === id || j.state === "in_dome");
        if (readyAfter) {
          setStatus("Both sealed cubes arrived in the dome! Pull the Brass Combine Lever downward.", "success");
          speak("Both sealed cubes are inside the glass fusion dome! Pull the Brass Combine Lever down now.");
        }
        schedule(() => setEyeState((prev) => (prev === "safe" ? "idle" : prev)), 800);
      }, 680);
    },
    [jars, playBeep, playError, playSwitch, schedule, setStatus, speak, stage]
  );

  const triggerCombine = useCallback(() => {
    if (stage !== "loading" || anyRouting) return;
    if (unlockedCount > 0) {
      playError();
      setEyeState("alert");
      setStatus("Lock both glass jars with your Brass Key first!", "warn");
      speak("Lock both glass bell-jars first!");
      schedule(() => setEyeState("idle"), 1100);
      return;
    }
    if (!allInDome) {
      playError();
      setStatus("Route both sealed cubes through the pipe into the Fusion Dome first!", "warn");
      speak("Route both sealed cubes into the fusion dome first!");
      return;
    }

    playSwitch();
    playBeep(520);
    setStage("fusing");
    setEyeState("blind");
    setStatus("Fusing both sealed cubes inside the keyless Glass Fusion Dome...", "info");

    schedule(() => {
      playBeep(760);
      setStage("delivering");
      schedule(() => {
        playSwitch();
        setStage("docked");
        setEyeState("idle");
        setStatus("Merged cube arrived at your Private Safe! Turn the right Brass Master Key to reveal the sum.", "success");
        speak("The merged sealed cube rolled through the pipe to your Private Safe! Turn your Brass Master Key to unlock it.");
      }, 780);
    }, 1150);
  }, [allInDome, anyRouting, playBeep, playError, playSwitch, schedule, setStatus, speak, stage, unlockedCount]);

  const unlockSafe = useCallback(() => {
    if (stage !== "docked") return;
    playSwitch();
    setStage("unlocking");
    schedule(() => {
      playSuccess();
      setStage("revealed");
      setStatus("Unlocked 27! The keyless foundry calculated 12 + 15 = 27 without ever seeing either number.", "success");
      speak("Brilliant! Twenty-seven! The foundry added twelve and fifteen without ever opening the locks.");
      onLevelComplete(35);
    }, 520);
  }, [onLevelComplete, playSuccess, playSwitch, schedule, setStatus, speak, stage]);

  // Unified SVG Pointer Move / Up handlers for buttery dragging
  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const pt = clientToSvgPoint(svgRef.current, e.clientX, e.clientY);

    if (dragKeyLeft) {
      pointerMovedRef.current = true;
      setDragKeyLeft(pt);
    } else if (dragKeyRight) {
      pointerMovedRef.current = true;
      setDragKeyRight(pt);
    } else if (dragJar) {
      pointerMovedRef.current = true;
      setDragJar({ ...dragJar, x: pt.x, y: pt.y });
      const nearDome = pt.x > 330 && pt.x < 780 && pt.y > 100 && pt.y < 380;
      const jar = jars.find((j) => j.id === dragJar.id);
      setEyeState(nearDome ? (jar?.locked ? "safe" : "alert") : "idle");
    } else if (leverDraggingRef.current && stage === "loading") {
      pointerMovedRef.current = true;
      const dy = Math.max(0, Math.min(105, pt.y - leverStartYRef.current));
      setLeverOffset(dy);
      if (!leverFiredRef.current && dy >= 72) {
        leverFiredRef.current = true;
        triggerCombine();
      }
    }
  };

  const handleSvgPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const pt = clientToSvgPoint(svgRef.current, e.clientX, e.clientY);

    if (dragKeyLeft) {
      const wasTap = !pointerMovedRef.current;
      setDragKeyLeft(null);
      if (wasTap) {
        const firstOpen = jars.find((j) => !j.locked);
        if (firstOpen) lockJar(firstOpen.id);
        else {
          playClick();
          setStatus("Both jars are locked! Drag or tap them to send into the Fusion Dome.", "info");
        }
      } else {
        const hit = jars.find(
          (j) => !j.locked && Math.hypot(pt.x - j.pedestalX, pt.y - 315) < 75
        );
        if (hit) lockJar(hit.id);
      }
    }

    if (dragKeyRight) {
      const wasTap = !pointerMovedRef.current;
      setDragKeyRight(null);
      if (stage === "docked") {
        if (wasTap || Math.hypot(pt.x - 1030, pt.y - 315) < 95) {
          unlockSafe();
        }
      }
    }

    if (dragJar) {
      const wasTap = !pointerMovedRef.current;
      const jarId = dragJar.id;
      const jar = jars.find((j) => j.id === jarId);
      setDragJar(null);
      if (wasTap && jar) {
        if (!jar.locked) lockJar(jarId);
        else routeJarToDome(jarId);
      } else if (pt.x > 330 && pt.x < 780 && pt.y > 90 && pt.y < 395) {
        routeJarToDome(jarId);
      } else {
        setEyeState("idle");
      }
    }

    if (leverDraggingRef.current) {
      const wasTap = !pointerMovedRef.current;
      leverDraggingRef.current = false;
      if (wasTap && stage === "loading") {
        setLeverOffset(95);
        schedule(() => {
          triggerCombine();
          setLeverOffset(0);
        }, 160);
      } else {
        setLeverOffset(0);
      }
    }
  };

  return (
    <div className="flex-1 min-h-0 w-full relative overflow-hidden select-none">
      {/* FULL-BLEED EDGE-TO-EDGE AMBER FOUNDRY BACKDROP (Zero dead voids at any aspect ratio) */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1200 560"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="l1BgWall" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef3c7" />
            <stop offset="52%" stopColor="#fde68a" />
            <stop offset="100%" stopColor="#d97706" />
          </linearGradient>
          <linearGradient id="l1BgBench" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#b45309" />
            <stop offset="18%" stopColor="#92400e" />
            <stop offset="100%" stopColor="#451a03" />
          </linearGradient>
          <pattern id="l1BgBrick" width="76" height="38" patternUnits="userSpaceOnUse">
            <rect width="76" height="38" fill="none" stroke="#b45309" strokeOpacity="0.16" strokeWidth="1.5" />
            <line x1="38" y1="0" x2="38" y2="19" stroke="#b45309" strokeOpacity="0.16" strokeWidth="1.5" />
            <line x1="0" y1="19" x2="76" y2="19" stroke="#b45309" strokeOpacity="0.16" strokeWidth="1.5" />
          </pattern>
        </defs>
        <rect width="1200" height="560" fill="url(#l1BgWall)" />
        <rect width="1200" height="405" fill="url(#l1BgBrick)" />
        <rect x="0" y="395" width="1200" height="165" fill="url(#l1BgBench)" />
      </svg>

      {/* UNIFIED 1200x560 INTERACTIVE FOUNDRY MACHINERY STAGE */}
      <svg
        ref={svgRef}
        viewBox="0 0 1200 560"
        preserveAspectRatio="xMidYMid meet"
        onPointerMove={handleSvgPointerMove}
        onPointerUp={handleSvgPointerUp}
        onPointerCancel={handleSvgPointerUp}
        className="relative z-10 w-full h-full touch-none"
      >
        <SharedSvgDefs />
        <defs>
          <linearGradient id="l1SkyGlass" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#7dd3fc" />
            <stop offset="100%" stopColor="#fef9c3" />
          </linearGradient>
          <linearGradient id="l1SunBeam" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef9c3" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
          </linearGradient>
          <radialGradient id="l1DomeGlass" cx="42%" cy="32%" r="65%">
            <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.88" />
            <stop offset="55%" stopColor="#bae6fd" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#fbbf24" stopOpacity="0.65" />
          </radialGradient>
        </defs>

        {/* Sunlit Arched Clerestory Skylights & Light Shafts */}
        {[60, 460, 860].map((x) => (
          <g key={x} className="pointer-events-none">
            <path
              d={`M ${x} 0 L ${x} 118 A 140 84 0 0 1 ${x + 280} 118 L ${x + 280} 0 Z`}
              fill="url(#l1SkyGlass)"
              stroke="#b45309"
              strokeWidth="5"
            />
            <line x1={x + 140} y1="0" x2={x + 140} y2="200" stroke="#b45309" strokeWidth="3.5" />
            <line x1={x} y1="84" x2={x + 280} y2="84" stroke="#b45309" strokeWidth="3.5" />
            <polygon points={`${x + 15},0 ${x + 265},0 ${x + 340},395 ${x - 40},395`} fill="url(#l1SunBeam)" />
          </g>
        ))}

        {/* Continuous Wall-to-Wall Walnut & Brass Workbench Rim + Pressure Gauges */}
        <rect x="0" y="390" width="1200" height="22" fill="url(#sharedGoldVert)" stroke="#451a03" strokeWidth="3" />
        {[90, 355, 815, 1110].map((gx) => (
          <g key={gx} className="pointer-events-none">
            <rect x={gx - 12} y="412" width="24" height="148" fill="url(#sharedGold)" stroke="#451a03" strokeWidth="2.5" />
            <circle cx={gx} cy="482" r="24" fill="#fef3c7" stroke="#b45309" strokeWidth="5" />
            <line x1={gx} y1="482" x2={gx + 12} y2="470" stroke="#e11d48" strokeWidth="3" strokeLinecap="round" />
            <circle cx={gx} cy="482" r="4" fill="#451a03" />
          </g>
        ))}

        {/* ====================================================================
            CONNECTED BRASS PIPING (100% physically bolted start-to-end!)
            ==================================================================== */}
        {/* Left Pedestals Collector Hood -> Central Fusion Dome Left Flange */}
        {/* Vertical risers from both pedestal hoods (x=118 & x=242) joining at y=160 -> elbow into Dome Left Nozzle (x=384, y=245) */}
        <path
          d="M 118 242 L 118 164 Q 118 140 144 140 L 348 140 Q 378 140 378 170 L 378 240 L 408 240"
          fill="none"
          stroke="#451a03"
          strokeWidth="30"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 118 242 L 118 164 Q 118 140 144 140 L 348 140 Q 378 140 378 170 L 378 240 L 408 240"
          fill="none"
          stroke="url(#sharedGoldVert)"
          strokeWidth="22"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 242 242 L 242 140"
          fill="none"
          stroke="#451a03"
          strokeWidth="30"
          strokeLinecap="round"
        />
        <path
          d="M 242 242 L 242 140"
          fill="none"
          stroke="url(#sharedGoldVert)"
          strokeWidth="22"
          strokeLinecap="round"
        />
        {/* Brass intake funnels above left pedestals */}
        {[118, 242].map((px) => (
          <polygon
            key={px}
            points={`${px - 28},254 ${px + 28},254 ${px + 18},232 ${px - 18},232`}
            fill="url(#sharedGold)"
            stroke="#451a03"
            strokeWidth="2.8"
          />
        ))}
        {/* Brass pipe T-joint collar */}
        <rect x="224" y="124" width="36" height="32" rx="6" fill="url(#sharedGold)" stroke="#451a03" strokeWidth="2.8" />

        {/* Central Fusion Dome Right Flange (x=762, y=240) -> Right Private Safe Top Collar (flush into y=250..264) */}
        <path
          d="M 754 240 L 826 240 Q 852 240 852 214 L 852 166 Q 852 140 878 140 L 1004 140 Q 1030 140 1030 166 L 1030 264"
          fill="none"
          stroke="#451a03"
          strokeWidth="30"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M 754 240 L 826 240 Q 852 240 852 214 L 852 166 Q 852 140 878 140 L 1004 140 Q 1030 140 1030 166 L 1030 264"
          fill="none"
          stroke="url(#sharedGoldVert)"
          strokeWidth="22"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Heavy bolted brass collar flush on top rim of Private Vault Safe (zero gap) */}
        <rect x="996" y="238" width="68" height="20" rx="5" fill="url(#sharedGold)" stroke="#451a03" strokeWidth="3" />
        <circle cx="1006" cy="248" r="2.5" fill="#fef3c7" stroke="#451a03" strokeWidth="1" />
        <circle cx="1054" cy="248" r="2.5" fill="#fef3c7" stroke="#451a03" strokeWidth="1" />

        {/* ====================================================================
            MASSIVE CENTRAL PRESSURIZED GLASS FUSION DOME (~48% of stage!)
            ==================================================================== */}
        {/* Interlocking spinning gears bolted behind the dome */}
        <SvgGear cx={402} cy={322} r={42} spinning={stage === "fusing"} fill="#f59e0b" />
        <SvgGear cx={366} cy={262} r={28} spinning={stage === "fusing"} reverse fill="#d97706" />
        <SvgGear cx={764} cy={326} r={40} spinning={stage === "fusing"} reverse fill="#f59e0b" />

        {/* Dome Structural Pedestal Anchored Flush to Workbench */}
        <path
          d="M 412 390 L 424 342 L 736 342 L 748 390 Z"
          fill="url(#sharedGoldVert)"
          stroke="#451a03"
          strokeWidth="3.2"
        />
        {/* Dome Heavy Brass Flange Bolts (Left & Right Pipes Enter Here) */}
        <rect x="386" y="216" width="28" height="48" rx="6" fill="url(#sharedGold)" stroke="#451a03" strokeWidth="3" />
        <rect x="746" y="216" width="28" height="48" rx="6" fill="url(#sharedGold)" stroke="#451a03" strokeWidth="3" />

        {/* Massive Curved Glass Fusion Dome (cx=580, width=348, height=238) */}
        <path
          d="M 406 344 L 406 236 A 174 128 0 0 1 754 236 L 754 344 Z"
          fill="url(#l1DomeGlass)"
          stroke={stage === "fusing" ? "#f59e0b" : "#92400e"}
          strokeWidth="5"
        />
        {/* Curved specular glass highlight */}
        <path
          d="M 432 232 A 145 102 0 0 1 520 138"
          fill="none"
          stroke="#ffffff"
          strokeWidth="8"
          strokeLinecap="round"
          opacity="0.65"
        />
        {/* Brass Base Collar on Dome + On-Machine Visual Equation Plate */}
        <rect x="398" y="336" width="364" height="18" rx="6" fill="url(#sharedGold)" stroke="#451a03" strokeWidth="3" />
        <text
          x="580"
          y="349"
          textAnchor="middle"
          fill="#451a03"
          fontSize="11"
          fontWeight="900"
          fontFamily="monospace"
        >
          KEYLESS FUSION DOME
        </text>
        {/* Bolted On-Machine Icon Equation Plate */}
        <rect
          x="404"
          y="357"
          width="352"
          height="31"
          rx="9"
          fill={stage === "revealed" ? "#064e3b" : stage === "loading" ? "#1e293b" : "#78350f"}
          stroke="#fde047"
          strokeWidth="2.4"
        />
        <circle cx="416" cy="372.5" r="2.6" fill="#fde047" />
        <circle cx="744" cy="372.5" r="2.6" fill="#fde047" />
        <text
          x="580"
          y="376.5"
          textAnchor="middle"
          fill="#fef9c3"
          fontSize="12"
          fontWeight="900"
          fontFamily="monospace"
        >
          {stage === "revealed"
            ? "12 + 15 = 27"
            : "[LOCKED] + [LOCKED] = [LOCKED]"}
        </text>

        {/* Bolted NO KEY Plaque + Overhead Privacy Eye on Top of Dome */}
        <SvgNoKeyPlaque x={580} y={146} />
        <SvgPrivacyEye cx={580} cy={66} state={eyeState} />

        {/* Inner Dome Crystal Seats (x=520 and x=640, y=260) */}
        {stage === "loading" && (
          <g>
            {[520, 640].map((sx, idx) => (
              <g key={sx}>
                <rect
                  x={sx - 38}
                  y="218"
                  width="76"
                  height="76"
                  rx="16"
                  fill={jars[idx].state === "in_dome" ? "#059669" : "#0c4a6e"}
                  fillOpacity={jars[idx].state === "in_dome" ? "0.2" : "0.14"}
                  stroke={jars[idx].state === "in_dome" ? "#059669" : "#92400e"}
                  strokeWidth="3"
                />
                {jars[idx].state !== "in_dome" && (
                  <text
                    x={sx}
                    y="260"
                    textAnchor="middle"
                    fill="#78350f"
                    fontSize="11"
                    fontWeight="800"
                    fontFamily="monospace"
                  >
                    SEALED {idx + 1}
                  </text>
                )}
              </g>
            ))}
            {/* Central brass + sign between seats */}
            <circle cx="580" cy="256" r="16" fill="#d97706" stroke="#451a03" strokeWidth="2.5" />
            <path d="M 573 256 L 587 256 M 580 249 L 580 263" stroke="#ffffff" strokeWidth="3.5" strokeLinecap="round" />
          </g>
        )}

        {/* Active Fusion Swirl inside Dome */}
        {stage === "fusing" && (
          <motion.g
            animate={{ scale: [0.88, 1.15, 0.94, 1.1], rotate: [0, 180, 360] }}
            transition={{ type: "tween", repeat: Infinity, duration: 0.9, ease: "easeInOut" }}
            style={{ originX: "580px", originY: "256px" }}
          >
            <circle cx="580" cy="256" r="52" fill="#fde047" opacity="0.38" />
            <rect
              x="540"
              y="216"
              width="80"
              height="80"
              rx="18"
              fill="url(#sharedGold)"
              stroke="#451a03"
              strokeWidth="3.5"
            />
            <rect x="550" y="226" width="60" height="60" rx="12" fill="url(#sealedBlue)" stroke="#fde047" strokeWidth="2.2" />
            <g transform="translate(580, 256)">
              <SvgPatternGlyph pattern="star" size={24} spinning tint="amber" />
            </g>
          </motion.g>
        )}

        {(stage === "delivering" || stage === "docked" || stage === "unlocking" || stage === "revealed") && (
          <g transform="translate(580, 256)">
            <rect x="-78" y="-18" width="156" height="36" rx="18" fill="#047857" stroke="#fde68a" strokeWidth="2.5" />
            <text x="0" y="5" textAnchor="middle" fill="#ffffff" fontSize="12" fontWeight="900" fontFamily="monospace">
              FUSED BLINDLY (?)
            </text>
          </g>
        )}

        {/* ====================================================================
            BOLTED PHYSICAL BRASS COMBINE LEVER (Right flank of Dome, x=814)
            ==================================================================== */}
        <g>
          {/* Steel mounting bracket physically bolting lever housing to Dome */}
          <rect x="752" y="294" width="52" height="16" fill="url(#sharedGold)" stroke="#451a03" strokeWidth="2.5" />
          {/* Lever vertical recessed slot housing */}
          <rect x="794" y="218" width="44" height="148" rx="14" fill="#451a03" stroke="#fbbf24" strokeWidth="3.2" />
          <rect x="810" y="232" width="12" height="120" rx="6" fill="#1c1917" />
          {/* Active tension fill */}
          <rect
            x="810"
            y="232"
            width="12"
            height={Math.max(16, leverOffset + 15)}
            rx="6"
            fill={stage !== "loading" ? "#10b981" : "#f59e0b"}
          />
          {/* Engraved Label above lever */}
          <rect x="774" y="192" width="84" height="22" rx="7" fill="#451a03" stroke="#fbbf24" strokeWidth="2" />
          <text x="816" y="207" textAnchor="middle" fill="#fef08a" fontSize="10.5" fontWeight="900" fontFamily="monospace">
            COMBINE +
          </text>

          {/* Draggable Physical T-Bar Handle */}
          <g
            transform={`translate(816, ${242 + leverOffset})`}
            onPointerDown={(e) => {
              if (stage !== "loading" || anyRouting) return;
              e.stopPropagation();
              svgRef.current?.setPointerCapture(e.pointerId);
              const pt = clientToSvgPoint(svgRef.current, e.clientX, e.clientY);
              leverDraggingRef.current = true;
              leverStartYRef.current = pt.y - leverOffset;
              leverFiredRef.current = false;
              pointerMovedRef.current = false;
            }}
            className={stage === "loading" ? "cursor-grab active:cursor-grabbing" : "cursor-default"}
          >
            {stage === "loading" && allInDome && (
              <ellipse cx="0" cy="0" rx="38" ry="22" fill="#fde047" opacity="0.4" />
            )}
            <rect
              x="-30"
              y="-15"
              width="60"
              height="30"
              rx="10"
              fill={
                stage !== "loading"
                  ? "#059669"
                  : allInDome
                  ? "#ea580c"
                  : "#d97706"
              }
              stroke="#fef08a"
              strokeWidth="2.8"
            />
            <text x="0" y="5" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900" fontFamily="monospace">
              {stage !== "loading" ? "DONE" : "PULL"}
            </text>
          </g>
        </g>

        {/* ====================================================================
            LEFT BENCH: TWO PEDESTALS + JARS (12 & 15) + BRASS MASTER KEY
            ==================================================================== */}
        <rect x="52" y="420" width="256" height="26" rx="8" fill="#451a03" stroke="#fbbf24" strokeWidth="2.2" />
        <text x="180" y="437" textAnchor="middle" fill="#fef08a" fontSize="12" fontWeight="900" fontFamily="monospace">
          PRIVATE SAVINGS BENCH
        </text>

        {/* Brass pedestals anchored flush on workbench y=390 */}
        {jars.map((jar) => (
          <g key={`ped-${jar.id}`}>
            <rect
              x={jar.pedestalX - 44}
              y="366"
              width="88"
              height="24"
              rx="8"
              fill="url(#sharedGoldVert)"
              stroke="#451a03"
              strokeWidth="2.8"
            />
            <text
              x={jar.pedestalX}
              y="382"
              textAnchor="middle"
              fill="#451a03"
              fontSize="10"
              fontWeight="900"
              fontFamily="monospace"
            >
              {jar.state === "in_dome" ? "IN DOME" : jar.locked ? "SEALED" : "OPEN JAR"}
            </text>
          </g>
        ))}

        {/* Interactive Bell-Jars / Sealed Cubes with Smooth Pipe Motion */}
        {jars.map((jar) => {
          const isBeingDragged = dragJar?.id === jar.id;
          const isBouncing = bouncingId === jar.id;
          const isRouting = jar.state === "routing";
          const isInDome = jar.state === "in_dome";

          if (isInDome && stage !== "loading") return null;

          // Smooth waypoint pipe animation from pedestal -> pipe elbow -> dome slot!
          const animatePos = isBeingDragged
            ? { x: dragJar.x, y: dragJar.y }
            : isBouncing
            ? { x: [jar.pedestalX + 35, jar.pedestalX - 18, jar.pedestalX + 10, jar.pedestalX], y: [265, 315, 305, 315] }
            : isRouting
            ? { x: [jar.pedestalX, jar.pedestalX, 378, 378, jar.domeSlotX], y: [315, 140, 140, 240, 256] }
            : isInDome
            ? { x: jar.domeSlotX, y: 256 }
            : { x: jar.pedestalX, y: 315 };

          return (
            <motion.g
              key={jar.id}
              animate={animatePos}
              transition={
                isBeingDragged
                  ? { duration: 0 }
                  : isRouting
                  ? { type: "tween", duration: 0.66, ease: "easeInOut" }
                  : isBouncing
                  ? { type: "tween", duration: 0.45, ease: "easeOut" }
                  : { type: "spring", stiffness: 320, damping: 24 }
              }
              onPointerDown={(e) => {
                if (stage !== "loading" || jar.state !== "pedestal") return;
                e.stopPropagation();
                svgRef.current?.setPointerCapture(e.pointerId);
                pointerMovedRef.current = false;
                setDragJar({ id: jar.id, x: jar.pedestalX, y: 315 });
              }}
              className={
                stage === "loading" && jar.state === "pedestal"
                  ? "cursor-grab active:cursor-grabbing"
                  : "cursor-default"
              }
            >
              {!jar.locked ? (
                <>
                  {/* Clear Glass Bell-Jar */}
                  <circle cx="0" cy="-42" r="7" fill="url(#sharedGold)" stroke="#451a03" strokeWidth="2.4" />
                  <path
                    d="M -32 34 L -32 -8 A 32 30 0 0 1 32 -8 L 32 34 Z"
                    fill="url(#glassClear)"
                    stroke="#0284c7"
                    strokeWidth="3.2"
                  />
                  <path d="M -21 -10 C -24 2 -24 16 -22 26" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" opacity="0.9" />
                  <rect x="-36" y="30" width="72" height="14" rx="5" fill="url(#sharedGold)" stroke="#451a03" strokeWidth="2.6" />
                  <text
                    x="0"
                    y="12"
                    textAnchor="middle"
                    fill="#0c4a6e"
                    fontSize="26"
                    fontWeight="900"
                    fontFamily="monospace"
                  >
                    {jar.value}
                  </text>
                  <SvgPadlockBadge x={28} y={-28} locked={false} />
                </>
              ) : (
                <>
                  {/* Opaque Scrambled Sealed Cube */}
                  <rect
                    x="-34"
                    y="-34"
                    width="68"
                    height="68"
                    rx="14"
                    fill="url(#sharedGold)"
                    stroke="#451a03"
                    strokeWidth="3"
                  />
                  <rect
                    x="-25"
                    y="-25"
                    width="50"
                    height="50"
                    rx="9"
                    fill="url(#sealedBlue)"
                    stroke="#fde047"
                    strokeWidth="2.2"
                  />
                  <SvgPatternGlyph pattern={jar.pattern} size={20} tint="cyan" />
                  <SvgPadlockBadge x={28} y={-28} locked />
                </>
              )}
            </motion.g>
          );
        })}

        {/* Left Chained Brass Master Key Cradle (x=180, y=492) */}
        <g
          onPointerDown={(e) => {
            if (stage !== "loading") return;
            e.stopPropagation();
            svgRef.current?.setPointerCapture(e.pointerId);
            pointerMovedRef.current = false;
            setDragKeyLeft({ x: 180, y: 492 });
          }}
          className={stage === "loading" && unlockedCount > 0 ? "cursor-grab active:cursor-grabbing" : "cursor-pointer"}
        >
          <rect
            x="92"
            y="458"
            width="176"
            height="68"
            rx="16"
            fill={unlockedCount > 0 && stage === "loading" ? "#78350f" : "#451a03"}
            stroke={unlockedCount > 0 && stage === "loading" ? "#fde047" : "#b45309"}
            strokeWidth="3"
          />
          <SvgBrassKey
            x={dragKeyLeft ? dragKeyLeft.x : 180}
            y={dragKeyLeft ? dragKeyLeft.y : 486}
            scale={0.95}
            glow={unlockedCount > 0 && stage === "loading"}
          />
          <text x="180" y="518" textAnchor="middle" fill="#fef08a" fontSize="10.5" fontWeight="900" fontFamily="monospace">
            {unlockedCount > 0 ? "DRAG / TAP TO LOCK" : "MASTER KEY"}
          </text>
        </g>

        {/* ====================================================================
            RIGHT SAFE: PRIVATE VAULT PEDESTAL + SMOOTH PIPE DELIVERY + KEY
            ==================================================================== */}
        {/* Private Safe Chamber Mounted Flush on Workbench */}
        <rect
          x="952"
          y="250"
          width="156"
          height="140"
          rx="18"
          fill={stage === "revealed" ? "#065f46" : "#1e293b"}
          stroke={stage === "docked" || stage === "revealed" ? "#fde047" : "#b45309"}
          strokeWidth="4.5"
          onClick={stage === "docked" ? unlockSafe : undefined}
          className={stage === "docked" ? "cursor-pointer" : ""}
        />
        <rect x="966" y="264" width="128" height="112" rx="12" fill={stage === "revealed" ? "#fef9c3" : "#0f172a"} stroke="#fbbf24" strokeWidth="2" />
        <rect x="936" y="420" width="188" height="26" rx="8" fill="#064e3b" stroke="#fde047" strokeWidth="2.2" />
        <text x="1030" y="437" textAnchor="middle" fill="#fef08a" fontSize="12" fontWeight="900" fontFamily="monospace">
          PRIVATE VAULT SAFE
        </text>

        {/* Smoothly Animated Merged Sealed Cube Traveling Along Right Output Pipe -> Safe! */}
        {(stage === "delivering" || stage === "docked" || stage === "unlocking") && (
          <motion.g
            initial={{ x: 580, y: 256, scale: 0.9 }}
            animate={
              stage === "delivering"
                ? { x: [580, 852, 852, 1030, 1030], y: [256, 240, 140, 140, 320], scale: 1 }
                : stage === "unlocking"
                ? { x: 1030, y: 320, scale: [1, 1.18, 0.9], rotate: [0, -10, 12, 0] }
                : { x: 1030, y: 320, scale: 1, rotate: 0 }
            }
            transition={
              stage === "delivering"
                ? { type: "tween", duration: 0.75, ease: "easeInOut" }
                : stage === "unlocking"
                ? { type: "tween", duration: 0.48, ease: "easeInOut" }
                : { type: "spring", stiffness: 300, damping: 22 }
            }
            onClick={stage === "docked" ? unlockSafe : undefined}
            className={stage === "docked" ? "cursor-pointer" : ""}
          >
            <rect x="-38" y="-38" width="76" height="76" rx="16" fill="url(#sharedGold)" stroke="#451a03" strokeWidth="3.2" />
            <rect x="-28" y="-28" width="56" height="56" rx="10" fill="url(#sealedBlue)" stroke="#fde047" strokeWidth="2.2" />
            <SvgPatternGlyph pattern="star" size={22} spinning={stage === "unlocking"} tint="amber" />
            <circle cx="0" cy="0" r="13" fill="#fde047" stroke="#451a03" strokeWidth="2.5" />
            <circle cx="0" cy="-2" r="3.5" fill="#451a03" />
            <rect x="-2" y="1" width="4" height="6" fill="#451a03" />
          </motion.g>
        )}

        {/* Revealed Exact Sum 27 Inside Safe */}
        {stage === "revealed" && (
          <motion.g
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 18 }}
            style={{ originX: "1030px", originY: "320px" }}
          >
            <circle cx="1030" cy="312" r="38" fill="#fef08a" stroke="#059669" strokeWidth="4" />
            <text x="1030" y="324" textAnchor="middle" fill="#064e3b" fontSize="34" fontWeight="900" fontFamily="monospace">
              27
            </text>
            <rect x="974" y="352" width="112" height="20" rx="10" fill="#059669" />
            <text x="1030" y="366" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="900" fontFamily="monospace">
              12 + 15 = 27
            </text>
          </motion.g>
        )}

        {stage === "loading" && (
          <text x="1030" y="324" textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="800" fontFamily="monospace">
            AWAITING CUBE
          </text>
        )}

        {/* Right Brass Master Key Cradle (x=1030, y=492) */}
        <g
          onPointerDown={(e) => {
            if (stage !== "docked") return;
            e.stopPropagation();
            svgRef.current?.setPointerCapture(e.pointerId);
            pointerMovedRef.current = false;
            setDragKeyRight({ x: 1030, y: 492 });
          }}
          className={stage === "docked" ? "cursor-grab active:cursor-grabbing" : "cursor-default"}
        >
          <rect
            x="942"
            y="458"
            width="176"
            height="68"
            rx="16"
            fill={stage === "docked" ? "#047857" : "#451a03"}
            stroke={stage === "docked" ? "#fde047" : "#92400e"}
            strokeWidth="3"
          />
          <SvgBrassKey
            x={dragKeyRight ? dragKeyRight.x : 1030}
            y={dragKeyRight ? dragKeyRight.y : 486}
            scale={0.95}
            glow={stage === "docked"}
          />
          <text x="1030" y="518" textAnchor="middle" fill="#fef08a" fontSize="10.5" fontWeight="900" fontFamily="monospace">
            {stage === "docked" ? "DRAG / TAP TO UNLOCK" : "SAFE KEY"}
          </text>
        </g>
      </svg>
    </div>
  );
}

/* ============================================================================
   LEVEL 2 (R2) — BLIND WORD & PASSWORD MATCHER (Encrypted Text Search: STAR)
   Cerulean sky-bridge observatory with connected diagonal track + bounded dial
   ============================================================================ */

type PatternKey = "off" | "wave" | "star" | "diamond";

interface WordCrate {
  id: string;
  word: "MOON" | "STAR" | "TREE";
  pattern: "wave" | "star" | "diamond";
  rampIndex: number;
  sealed: boolean;
  location: "ramp" | "scanning" | "reject_moving" | "rejected" | "verify_moving" | "verified";
}

const DIAL_NOTCHES: { key: PatternKey; label: string; angleDeg: number }[] = [
  { key: "off", label: "OFF", angleDeg: -105 },
  { key: "wave", label: "A", angleDeg: -35 },
  { key: "star", label: "KEY", angleDeg: 35 },
  { key: "diamond", label: "C", angleDeg: 105 },
];

// Ramp coordinates sitting cleanly ON TOP of the diagonal conveyor track!
const RAMP_POSITIONS = [
  { x: 118, y: 102 },
  { x: 214, y: 130 },
  { x: 310, y: 158 },
];

function Level2WordMatcher({
  playClick,
  playSwitch,
  playSuccess,
  playError,
  playBeep,
  speak,
  setStatus,
  onRegisterHint,
  onLevelComplete,
}: LevelProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [dialKey, setDialKey] = useState<PatternKey>("off");
  const [crates, setCrates] = useState<WordCrate[]>([
    { id: "c-moon", word: "MOON", pattern: "wave", rampIndex: 0, sealed: false, location: "ramp" },
    { id: "c-star", word: "STAR", pattern: "star", rampIndex: 1, sealed: false, location: "ramp" },
    { id: "c-tree", word: "TREE", pattern: "diamond", rampIndex: 2, sealed: false, location: "ramp" },
  ]);
  const [busy, setBusy] = useState(false);
  const [switchDir, setSwitchDir] = useState<"neutral" | "left" | "right">("neutral");
  const [scanResult, setScanResult] = useState<"idle" | "scanning" | "match" | "nomatch">("idle");
  const [lastOutcome, setLastOutcome] = useState<"idle" | "match" | "nomatch">("idle");
  const [eyeState, setEyeState] = useState<EyeState>("idle");
  const [bouncingCrateId, setBouncingCrateId] = useState<string | null>(null);
  const [unlockStage, setUnlockStage] = useState<"waiting" | "ready" | "unlocking" | "revealed">("waiting");
  const [dragKey, setDragKey] = useState<{ x: number; y: number } | null>(null);

  const dialDraggingRef = useRef(false);
  const pointerMovedRef = useRef(false);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
  }, []);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((tm) => clearTimeout(tm));
    };
  }, []);

  const dialAligned = dialKey === "star";
  const remainingOnRamp = crates.filter((c) => c.location === "ramp");
  const unsealedCrates = crates.filter((c) => !c.sealed);
  const rejectedCrates = crates.filter((c) => c.location === "rejected");
  const verifiedCrate = crates.find((c) => c.location === "verified");

  useEffect(() => {
    if (remainingOnRamp.length === 0 && !busy && verifiedCrate && unlockStage === "waiting") {
      setUnlockStage("ready");
      setStatus("Match reached Verified Bridge! Unlock it with your Bridge Key.", "success");
      speak("Awesome! The blind scanner matched the locked crate without reading any letters. Use your Bridge Key to unlock it!");
    }
  }, [busy, remainingOnRamp.length, setStatus, speak, unlockStage, verifiedCrate]);

  useEffect(() => {
    onRegisterHint(() => {
      if (unsealedCrates.length > 0) {
        return "Lock all open word crates on the track first so the scanner cannot read any letters.";
      }
      if (!dialAligned) {
        return "Rotate the circular Pattern Match Dial until its pointer aligns with your locked STAR keycard.";
      }
      if (remainingOnRamp.length > 0) {
        return "Tap each sealed crate on the diagonal conveyor track to slide it through the Blind Pattern Scanner.";
      }
      if (unlockStage === "ready") {
        return "Drag or tap your Bridge Key onto the winning crate on the right bridge to unlock STAR.";
      }
      return "Watch the blind laser check the locked pattern without reading any letters!";
    });
  }, [dialAligned, onRegisterHint, remainingOnRamp.length, unlockStage, unsealedCrates.length]);

  const lockCrate = useCallback(
    (crateId: string) => {
      const target = crates.find((c) => c.id === crateId);
      if (!target || target.sealed || target.location !== "ramp") return;
      playSwitch();
      playBeep(560);
      setEyeState("safe");
      setCrates((prev) => prev.map((c) => (c.id === crateId ? { ...c, sealed: true } : c)));
      const leftOpen = crates.filter((c) => !c.sealed && c.id !== crateId).length;
      if (leftOpen === 0) {
        setStatus("All word crates sealed! Align the Pattern Dial and send them through the scanner.", "success");
        speak("All three crates are locked! Align the pattern dial and send each sealed crate through the blind scanner.");
      } else {
        setStatus("Crate locked! Seal the remaining open crates so no words leak.", "info");
      }
      schedule(() => setEyeState((prev) => (prev === "safe" ? "idle" : prev)), 850);
    },
    [crates, playBeep, playSwitch, schedule, setStatus, speak]
  );

  const selectDialFromPoint = useCallback(
    (pt: { x: number; y: number }) => {
      // Dial center in unified SVG coords: (600, 466), radius 72 (< 160px!)
      const dx = pt.x - 600;
      const dy = pt.y - 466;
      const deg = (Math.atan2(dx, -dy) * 180) / Math.PI;
      let best = DIAL_NOTCHES[0];
      let bestDiff = 999;
      for (const n of DIAL_NOTCHES) {
        const d = Math.abs(deg - n.angleDeg);
        if (d < bestDiff) {
          bestDiff = d;
          best = n;
        }
      }
      if (best.key !== dialKey) {
        playClick();
        setDialKey(best.key);
        if (best.key === "star") {
          playBeep(700);
          setStatus(
            unsealedCrates.length > 0
              ? "Pattern Dial aligned! Remember to lock all open crates before scanning."
              : "Pattern Dial aligned! Send each sealed crate down the track.",
            "success"
          );
        }
      }
    },
    [dialKey, playBeep, playClick, setStatus, unsealedCrates.length]
  );

  const sendCrate = useCallback(
    (crateId: string) => {
      if (busy) return;
      const target = crates.find((c) => c.id === crateId);
      if (!target || target.location !== "ramp") return;

      // Privacy Eye enforces locking crates before scanning!
      if (!target.sealed) {
        playError();
        setEyeState("alert");
        setBouncingCrateId(crateId);
        setStatus(`Privacy leak! Lock ${target.word} first so the scanner cannot read the letters.`, "warn");
        speak(`Watch out! ${target.word} is open! Lock the crate first so the scanner cannot see the word.`);
        schedule(() => {
          setBouncingCrateId(null);
          setEyeState("idle");
        }, 1150);
        return;
      }

      if (!dialAligned) {
        playError();
        setEyeState("alert");
        setStatus("Align the Pattern Match Dial to your locked STAR keycard first!", "warn");
        speak("Align the Pattern Match Dial to match your locked Star keycard first!");
        schedule(() => setEyeState("idle"), 1000);
        return;
      }

      setBusy(true);
      playSwitch();
      setScanResult("scanning");
      setEyeState("blind");
      setCrates((prev) =>
        prev.map((c) => (c.id === crateId ? { ...c, location: "scanning" } : c))
      );
      setStatus("Blind scanner checking locked pattern...", "info");

      schedule(() => {
        const isMatch = target.pattern === "star";
        playBeep(isMatch ? 820 : 410);
        setScanResult(isMatch ? "match" : "nomatch");
        setLastOutcome(isMatch ? "match" : "nomatch");
        setSwitchDir(isMatch ? "right" : "left");

        setCrates((prev) =>
          prev.map((c) =>
            c.id === crateId ? { ...c, location: isMatch ? "verify_moving" : "reject_moving" } : c
          )
        );

        schedule(() => {
          playSwitch();
          setCrates((prev) =>
            prev.map((c) =>
              c.id === crateId ? { ...c, location: isMatch ? "verified" : "rejected" } : c
            )
          );
          setBusy(false);
          setScanResult("idle");
          setEyeState("safe");
          if (isMatch) {
            setStatus("Match routed across Verified Bridge — word stayed locked!", "success");
          } else {
            setStatus("No match — dropped into Reject Chute while locked.", "info");
          }
          schedule(() => setEyeState("idle"), 800);
        }, 720);
      }, 720);
    },
    [busy, crates, dialAligned, playBeep, playError, playSwitch, schedule, setStatus, speak]
  );

  const unlockVerifiedCrate = useCallback(() => {
    if (unlockStage !== "ready") return;
    playSwitch();
    setUnlockStage("unlocking");
    schedule(() => {
      playSuccess();
      setUnlockStage("revealed");
      setStatus("Unlocked STAR! The blind scanner found your secret word without ever reading MOON, STAR, or TREE.", "success");
      speak("Superb! Star! The scanner matched your hidden word without ever opening any crate.");
      onLevelComplete(70);
    }, 520);
  }, [onLevelComplete, playSuccess, playSwitch, schedule, setStatus, speak, unlockStage]);

  // Constrained Dial Knob Geometry: strictly inside dial rim (r = 72, knob path radius = r - 20 = 52!)
  const activeNotch = DIAL_NOTCHES.find((n) => n.key === dialKey) ?? DIAL_NOTCHES[0];
  const dialRad = ((activeNotch.angleDeg - 90) * Math.PI) / 180;
  const knobR = 46; // strictly <= r - 24 so the handle NEVER touches or overflows the outer rim!
  const knobX = 600 + Math.cos(dialRad) * knobR;
  const knobY = 466 + Math.sin(dialRad) * knobR;

  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const pt = clientToSvgPoint(svgRef.current, e.clientX, e.clientY);
    if (dialDraggingRef.current) {
      selectDialFromPoint(pt);
    } else if (dragKey) {
      pointerMovedRef.current = true;
      setDragKey(pt);
    }
  };

  const handleSvgPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const pt = clientToSvgPoint(svgRef.current, e.clientX, e.clientY);
    if (dialDraggingRef.current) {
      dialDraggingRef.current = false;
    }
    if (dragKey) {
      const wasTap = !pointerMovedRef.current;
      setDragKey(null);
      if (unlockStage === "ready" && (wasTap || Math.hypot(pt.x - 1035, pt.y - 255) < 95)) {
        unlockVerifiedCrate();
      }
    }
  };

  return (
    <div className="flex-1 min-h-0 w-full relative overflow-hidden select-none">
      {/* FULL-BLEED CERULEAN SKY-BRIDGE OBSERVATORY BACKDROP */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1200 560"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="l2SkyBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0284c7" />
            <stop offset="48%" stopColor="#38bdf8" />
            <stop offset="80%" stopColor="#bae6fd" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
          <linearGradient id="l2DeckBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#cbd5e1" />
            <stop offset="28%" stopColor="#94a3b8" />
            <stop offset="100%" stopColor="#475569" />
          </linearGradient>
        </defs>
        <rect width="1200" height="560" fill="url(#l2SkyBg)" />
        <rect x="0" y="388" width="1200" height="172" fill="url(#l2DeckBg)" />
      </svg>

      {/* UNIFIED 1200x560 INTERACTIVE SKY-BRIDGE OBSERVATORY STAGE */}
      <svg
        ref={svgRef}
        viewBox="0 0 1200 560"
        preserveAspectRatio="xMidYMid meet"
        onPointerMove={handleSvgPointerMove}
        onPointerUp={handleSvgPointerUp}
        onPointerCancel={handleSvgPointerUp}
        className="relative z-10 w-full h-full touch-none"
      >
        <SharedSvgDefs />
        <defs>
          <linearGradient id="l2Silver" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#94a3b8" />
            <stop offset="50%" stopColor="#f1f5f9" />
            <stop offset="100%" stopColor="#64748b" />
          </linearGradient>
          <linearGradient id="l2Laser" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.92" />
            <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.16" />
          </linearGradient>
        </defs>

        {/* Sunlit Observatory Dome Trusses & Cloud Horizon */}
        <circle cx="965" cy="78" r="100" fill="#fef9c3" opacity="0.3" className="pointer-events-none" />
        <circle cx="965" cy="78" r="46" fill="#fef08a" opacity="0.65" className="pointer-events-none" />
        <path d="M 0 165 Q 600 -65 1200 165" fill="none" stroke="#e2e8f0" strokeWidth="10" opacity="0.6" />
        <path d="M 0 280 Q 600 35 1200 280" fill="none" stroke="#cbd5e1" strokeWidth="6" opacity="0.48" />
        <g fill="#ffffff" opacity="0.82" className="pointer-events-none">
          <ellipse cx="140" cy="368" rx="185" ry="52" />
          <ellipse cx="420" cy="382" rx="220" ry="54" />
          <ellipse cx="780" cy="384" rx="235" ry="54" />
          <ellipse cx="1070" cy="364" rx="175" ry="50" />
        </g>

        {/* Steel Observatory Deck Trim & Bracing */}
        <rect x="0" y="384" width="1200" height="14" fill="url(#l2Silver)" stroke="#334155" strokeWidth="2.5" />
        {[85, 340, 860, 1115].map((x) => (
          <line key={x} x1={x} y1="398" x2={x + 48} y2="560" stroke="#334155" strokeWidth="6" opacity="0.4" />
        ))}

        {/* ====================================================================
            CONTINUOUS CONNECTED CONVEYOR TRACK -> SCANNER ARCH -> 2 BRANCHES
            ==================================================================== */}
        {/* Physical Metal Loading Hopper Bolted Directly to Top-Left End of Diagonal Track */}
        <polygon
          points="26,74 104,92 94,154 34,140"
          fill="url(#l2Silver)"
          stroke="#1e293b"
          strokeWidth="3.2"
        />
        <rect x="22" y="68" width="84" height="12" rx="4" fill="url(#sharedGold)" stroke="#451a03" strokeWidth="2.4" />
        {/* Physical Metal Loading Pedestal & Steel Truss Platform Supporting the Top-Left Track Rail */}
        <polygon
          points="56,144 374,232 374,264 56,176"
          fill="url(#l2Silver)"
          stroke="#1e293b"
          strokeWidth="3.2"
        />
        <line x1="76" y1="168" x2="354" y2="246" stroke="#475569" strokeWidth="3" strokeDasharray="10 10" />
        {/* Steel Support Pillars & Cross-Braces Anchoring Loading Platform & Verified Bridge Flush to Deck */}
        <rect x="82" y="176" width="24" height="212" fill="url(#l2Silver)" stroke="#1e293b" strokeWidth="2.8" />
        <rect x="204" y="210" width="22" height="178" fill="url(#l2Silver)" stroke="#1e293b" strokeWidth="2.8" />
        <rect x="326" y="244" width="24" height="144" fill="url(#l2Silver)" stroke="#1e293b" strokeWidth="2.8" />
        <line x1="106" y1="220" x2="204" y2="345" stroke="#475569" strokeWidth="5" opacity="0.7" />
        <line x1="204" y1="220" x2="106" y2="345" stroke="#475569" strokeWidth="5" opacity="0.7" />
        <line x1="226" y1="252" x2="326" y2="355" stroke="#475569" strokeWidth="5" opacity="0.7" />
        {/* Heavy Under-Bridge Support Frame for Verified Bridge Dock */}
        <rect x="976" y="318" width="26" height="70" fill="url(#l2Silver)" stroke="#1e293b" strokeWidth="2.8" />
        <rect x="1072" y="318" width="26" height="70" fill="url(#l2Silver)" stroke="#1e293b" strokeWidth="2.8" />
        <rect x="962" y="320" width="148" height="16" rx="4" fill="url(#sharedGold)" stroke="#451a03" strokeWidth="2.4" />

        {/* 1. Continuous Diagonal Input Conveyor Track (x=54, y=130 -> x=600, y=282) */}
        <line x1="54" y1="130" x2="600" y2="282" stroke="#1e293b" strokeWidth="36" strokeLinecap="round" />
        <line x1="54" y1="130" x2="600" y2="282" stroke="#e2e8f0" strokeWidth="24" strokeLinecap="round" />
        <line x1="54" y1="130" x2="600" y2="282" stroke="#0ea5e9" strokeWidth="6" strokeDasharray="16 14" />

        {/* 2. Connected Left Reject Chute (Forks seamlessly from x=600, y=282 -> Reject Hopper x=205, y=458) */}
        <path
          d="M 600 282 C 455 318, 305 352, 205 458"
          fill="none"
          stroke={switchDir === "left" ? "#f59e0b" : "#334155"}
          strokeWidth="34"
          strokeLinecap="round"
        />
        <path
          d="M 600 282 C 455 318, 305 352, 205 458"
          fill="none"
          stroke="#cbd5e1"
          strokeWidth="22"
          strokeLinecap="round"
        />

        {/* 3. Connected Right Verified Bridge (Flush straight into Verified Bridge Dock left port x=952, y=268) */}
        <path
          d="M 600 282 L 964 268"
          fill="none"
          stroke={switchDir === "right" ? "#10b981" : "#0284c7"}
          strokeWidth="36"
          strokeLinecap="round"
        />
        <path
          d="M 600 282 L 964 268"
          fill="none"
          stroke="#fef3c7"
          strokeWidth="22"
          strokeLinecap="round"
        />
        {/* Riveted Brass Bridge Docking Collar Joining Track Flush into Verified Bridge Dock */}
        <rect x="938" y="244" width="22" height="48" rx="5" fill="url(#sharedGold)" stroke="#451a03" strokeWidth="2.8" />
        <circle cx="949" cy="254" r="2.2" fill="#fef9c3" />
        <circle cx="949" cy="282" r="2.2" fill="#fef9c3" />

        {/* ====================================================================
            LARGE CENTRAL BLIND PATTERN SCANNER ARCH (~48% stage dominance!)
            ==================================================================== */}
        {/* Twin Heavy Steel Arch Towers Bolted Flush to Deck y=388 */}
        <rect x="444" y="138" width="44" height="250" rx="8" fill="url(#l2Silver)" stroke="#1e293b" strokeWidth="3.5" />
        <rect x="712" y="138" width="44" height="250" rx="8" fill="url(#l2Silver)" stroke="#1e293b" strokeWidth="3.5" />
        {/* Arch Roof Bridge */}
        <path
          d="M 436 154 A 164 96 0 0 1 764 154 L 764 176 L 436 176 Z"
          fill="url(#l2Silver)"
          stroke="#1e293b"
          strokeWidth="3.5"
        />
        {/* Glass Scanner Viewport Framing the Center Chamber + Visual Equation */}
        <rect
          x="488"
          y="176"
          width="224"
          height="168"
          fill={verifiedCrate || scanResult === "match" ? "#064e3b" : "#0c4a6e"}
          fillOpacity={verifiedCrate || scanResult === "match" ? "0.32" : "0.22"}
          stroke={verifiedCrate || scanResult === "match" ? "#34d399" : "#38bdf8"}
          strokeWidth="3"
        />
        {/* On-Machine Visual Pattern Equation Inside Scanner Glass */}
        <rect
          x="496"
          y="182"
          width="208"
          height="22"
          rx="7"
          fill="#0f172a"
          fillOpacity="0.88"
          stroke={verifiedCrate || scanResult === "match" ? "#34d399" : "#38bdf8"}
          strokeWidth="1.6"
        />
        <text
          x="600"
          y="196.5"
          textAnchor="middle"
          fill="#fef08a"
          fontSize="9.2"
          fontWeight="900"
          fontFamily="monospace"
        >
          [LOCKED STAR] == [LOCKED TARGET]
        </text>
        {/* Cyan Laser Curtain Scanning Locked Crates */}
        <rect
          x="564"
          y="204"
          width="72"
          height="140"
          fill="url(#l2Laser)"
          opacity={scanResult === "scanning" ? "0.95" : "0.42"}
        />
        <line
          x1="600"
          y1="204"
          x2="600"
          y2="344"
          stroke={verifiedCrate || scanResult === "match" ? "#34d399" : scanResult === "nomatch" ? "#fb7185" : "#a5f3fc"}
          strokeWidth={scanResult === "scanning" ? "6" : "3"}
        />
        {/* Overhead Privacy Eye + Bolted NO KEY Shield + Fixed State-Priority Banner */}
        <SvgPrivacyEye cx={600} cy={46} state={eyeState} />
        <SvgNoKeyPlaque x={600} y={102} />
        {(() => {
          const isMatchBanner =
            Boolean(verifiedCrate) ||
            scanResult === "match" ||
            unlockStage === "ready" ||
            unlockStage === "unlocking" ||
            unlockStage === "revealed";
          const isNoMatchBanner = !isMatchBanner && (scanResult === "nomatch" || lastOutcome === "nomatch");
          return (
            <g>
              <rect
                x="416"
                y="124"
                width="368"
                height="40"
                rx="11"
                fill={isMatchBanner ? "#065f46" : isNoMatchBanner ? "#7f1d1d" : "#0f172a"}
                stroke={isMatchBanner ? "#34d399" : isNoMatchBanner ? "#fb7185" : "#38bdf8"}
                strokeWidth="2.8"
              />
              <text
                x="600"
                y="139"
                textAnchor="middle"
                fill="#fde047"
                fontSize="9.5"
                fontWeight="900"
                fontFamily="monospace"
              >
                BLIND PATTERN SCANNER
              </text>
              <text
                x="600"
                y="156"
                textAnchor="middle"
                fill="#f0f9ff"
                fontSize="11"
                fontWeight="900"
                fontFamily="monospace"
              >
                {isMatchBanner
                  ? "MATCH FOUND — WORD NEVER READ!"
                  : isNoMatchBanner
                  ? "NO MATCH — REJECT CHUTE"
                  : "PATTERN SCANNER (LOCKED)"}
              </text>
            </g>
          );
        })()}

        {/* Physical Pivoting Track Switch Gate Blade at (600, 326) */}
        <motion.g
          animate={{ rotate: switchDir === "left" ? -26 : switchDir === "right" ? 26 : 0 }}
          transition={{ type: "spring", stiffness: 280, damping: 20 }}
          style={{ originX: "600px", originY: "326px" }}
        >
          <polygon points="600,296 588,332 612,332" fill="#f59e0b" stroke="#451a03" strokeWidth="2.5" />
          <circle cx="600" cy="326" r="10" fill="#fef08a" stroke="#451a03" strokeWidth="2.5" />
        </motion.g>

        {/* ====================================================================
            LEFT REJECT CHUTE HOPPER (Collects locked MOON & TREE crates!)
            ==================================================================== */}
        <polygon
          points="102,438 308,438 288,538 122,538"
          fill="#1e293b"
          stroke="#fbbf24"
          strokeWidth="3.5"
        />
        <rect x="118" y="418" width="174" height="24" rx="7" fill="#334155" stroke="#fbbf24" strokeWidth="2.2" />
        <text x="205" y="434" textAnchor="middle" fill="#fef08a" fontSize="10.5" fontWeight="900" fontFamily="monospace">
          REJECT CHUTE (SEALED)
        </text>

        {/* ====================================================================
            RIGHT VERIFIED SKY-BRIDGE FINISH PEDESTAL + MASTER KEY
            ==================================================================== */}
        <rect
          x="952"
          y="186"
          width="166"
          height="136"
          rx="18"
          fill={unlockStage === "revealed" ? "#065f46" : "#0c4a6e"}
          stroke={unlockStage === "ready" || unlockStage === "revealed" ? "#fde047" : "#38bdf8"}
          strokeWidth="4.2"
          onClick={unlockStage === "ready" ? unlockVerifiedCrate : undefined}
          className={unlockStage === "ready" ? "cursor-pointer" : ""}
        />
        <rect x="966" y="200" width="138" height="108" rx="12" fill={unlockStage === "revealed" ? "#fef9c3" : "#0f172a"} stroke="#fbbf24" strokeWidth="2" />
        <rect x="944" y="156" width="182" height="26" rx="8" fill="#065f46" stroke="#fde047" strokeWidth="2.2" />
        <text x="1035" y="173" textAnchor="middle" fill="#fef08a" fontSize="11.5" fontWeight="900" fontFamily="monospace">
          VERIFIED BRIDGE
        </text>
        {!verifiedCrate && (
          <text x="1035" y="258" textAnchor="middle" fill="#7dd3fc" fontSize="11" fontWeight="800" fontFamily="monospace">
            AWAITING MATCH
          </text>
        )}

        {/* Revealed STAR Word Inside Right Pedestal */}
        {unlockStage === "revealed" && (
          <motion.g
            initial={{ scale: 0.4, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: "spring", stiffness: 320, damping: 18 }}
            style={{ originX: "1035px", originY: "254px" }}
          >
            <rect x="978" y="216" width="114" height="54" rx="14" fill="#fef08a" stroke="#059669" strokeWidth="3.5" />
            <text x="1035" y="253" textAnchor="middle" fill="#064e3b" fontSize="29" fontWeight="900" fontFamily="monospace">
              STAR
            </text>
            <rect x="976" y="278" width="118" height="20" rx="10" fill="#059669" />
            <text x="1035" y="292" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900" fontFamily="monospace">
              MATCH VERIFIED!
            </text>
          </motion.g>
        )}

        {/* ====================================================================
            SMOOTHLY ANIMATED CRATES ON THE CONNECTED TRACK / CHUTE / BRIDGE!
            ==================================================================== */}
        {crates.map((crate) => {
          if (crate.location === "verified" && unlockStage === "revealed") return null;

          const startPos = RAMP_POSITIONS[crate.rampIndex];
          const rejectSlotX = 165 + rejectedCrates.findIndex((r) => r.id === crate.id) * 80;

          let targetAnim: { x: number | number[]; y: number | number[]; scale?: number | number[]; rotate?: number | number[] };
          let trans: object;

          if (crate.location === "ramp") {
            const isBouncing = bouncingCrateId === crate.id;
            targetAnim = isBouncing
              ? { x: [startPos.x + 28, startPos.x - 14, startPos.x + 8, startPos.x], y: [startPos.y + 8, startPos.y, startPos.y, startPos.y], scale: 1, rotate: [6, -6, 3, 0] }
              : { x: startPos.x, y: startPos.y, scale: 1, rotate: 0 };
            trans = isBouncing
              ? { type: "tween", duration: 0.44, ease: "easeOut" }
              : { type: "spring", stiffness: 300, damping: 24 };
          } else if (crate.location === "scanning") {
            targetAnim = { x: [startPos.x, 600], y: [startPos.y, 260], scale: 1, rotate: 0 };
            trans = { type: "tween", duration: 0.65, ease: "easeInOut" };
          } else if (crate.location === "reject_moving") {
            targetAnim = { x: [600, 420, 290, 205], y: [260, 326, 378, 488], scale: 0.88 };
            trans = { type: "tween", duration: 0.68, ease: "easeInOut" };
          } else if (crate.location === "rejected") {
            targetAnim = { x: rejectSlotX, y: 488, scale: 0.82, rotate: 0 };
            trans = { type: "spring", stiffness: 280, damping: 22 };
          } else if (crate.location === "verify_moving") {
            targetAnim = { x: [600, 820, 1035], y: [260, 272, 254], scale: 1 };
            trans = { type: "tween", duration: 0.68, ease: "easeInOut" };
          } else {
            targetAnim =
              unlockStage === "unlocking"
                ? { x: 1035, y: 254, scale: [1, 1.18, 0.9], rotate: [0, -10, 12, 0] }
                : { x: 1035, y: 254, scale: 1.05, rotate: 0 };
            trans =
              unlockStage === "unlocking"
                ? { type: "tween", duration: 0.48, ease: "easeInOut" }
                : { type: "spring", stiffness: 300, damping: 22 };
          }

          const clickableOnRamp = crate.location === "ramp" && !busy;

          return (
            <motion.g
              key={crate.id}
              initial={{ x: startPos.x, y: startPos.y }}
              animate={targetAnim}
              transition={trans}
              onClick={() => {
                if (clickableOnRamp) {
                  if (!crate.sealed) lockCrate(crate.id);
                  else sendCrate(crate.id);
                } else if (crate.location === "verified" && unlockStage === "ready") {
                  unlockVerifiedCrate();
                }
              }}
              className={
                clickableOnRamp || (crate.location === "verified" && unlockStage === "ready")
                  ? "cursor-pointer"
                  : "cursor-default"
              }
            >
              {/* Action Pill Positioned Cleanly ABOVE Each Crate (Zero Overlap with Track Rail!) */}
              {clickableOnRamp && (
                <g transform="translate(0, -40)">
                  <rect
                    x="-28"
                    y="-9"
                    width="56"
                    height="18"
                    rx="9"
                    fill={!crate.sealed ? "#e11d48" : dialAligned ? "#059669" : "#0369a1"}
                    stroke="#fde047"
                    strokeWidth="1.6"
                  />
                  <text x="0" y="3.5" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="900" fontFamily="monospace">
                    {!crate.sealed ? "LOCK" : "SEND"}
                  </text>
                </g>
              )}

              {/* Glowing ring when sealed & dial aligned */}
              {clickableOnRamp && crate.sealed && dialAligned && (
                <rect x="-40" y="-34" width="80" height="68" rx="16" fill="none" stroke="#fde047" strokeWidth="3.2" />
              )}
              <rect
                x="-34"
                y="-28"
                width="68"
                height="56"
                rx="13"
                fill={crate.sealed ? "url(#sharedGold)" : "#fef3c7"}
                stroke={!crate.sealed ? "#e11d48" : "#451a03"}
                strokeWidth="3"
              />
              {!crate.sealed ? (
                <>
                  <text x="0" y="6" textAnchor="middle" fill="#0c4a6e" fontSize="16" fontWeight="900" fontFamily="monospace">
                    {crate.word}
                  </text>
                  <SvgPadlockBadge x={28} y={-22} locked={false} />
                </>
              ) : (
                <>
                  <rect x="-25" y="-19" width="50" height="38" rx="8" fill="url(#sealedBlue)" stroke="#fde047" strokeWidth="2" />
                  <SvgPatternGlyph
                    pattern={crate.pattern}
                    size={17}
                    spinning={crate.location === "scanning" || unlockStage === "unlocking"}
                  />
                  <SvgPadlockBadge x={28} y={-22} locked />
                </>
              )}
            </motion.g>
          );
        })}

        {/* Ramp Label Plaque Positioned Cleanly Above Crate Pills */}
        <rect x="44" y="16" width="212" height="24" rx="8" fill="#0c4a6e" stroke="#7dd3fc" strokeWidth="2" />
        <text x="150" y="32" textAnchor="middle" fill="#e0f2fe" fontSize="10.5" fontWeight="900" fontFamily="monospace">
          PRIVATE LOADING TRACK
        </text>

        {/* ====================================================================
            BOUNDED CIRCULAR PATTERN MATCH DIAL (144px diameter < 160px!)
            + LOCKED STAR KEYCARD REFERENCE RIGHT BESIDE IT
            ==================================================================== */}
        {/* Locked STAR Keycard Bolted beside the Dial */}
        <g transform="translate(446, 468)">
          <rect x="-66" y="-44" width="132" height="88" rx="14" fill="#0f172a" stroke="#fde047" strokeWidth="3" />
          <text x="0" y="-24" textAnchor="middle" fill="#fde047" fontSize="9.5" fontWeight="900" fontFamily="monospace">
            LOCKED KEYCARD
          </text>
          <g transform="translate(0, 6)">
            <SvgPatternGlyph pattern="star" size={18} tint="amber" />
          </g>
          <text x="0" y="36" textAnchor="middle" fill="#a5f3fc" fontSize="10" fontWeight="900" fontFamily="monospace">
            FIND: STAR
          </text>
        </g>

        {/* Connecting steel pipe from Dial -> Scanner Arch */}
        <rect x="590" y="344" width="20" height="56" fill="url(#l2Silver)" stroke="#1e293b" strokeWidth="2.5" />

        {/* Circular Pattern Match Dial (cx=600, cy=466, r=72 => 144px diameter!) */}
        <g
          onPointerDown={(e) => {
            e.stopPropagation();
            svgRef.current?.setPointerCapture(e.pointerId);
            dialDraggingRef.current = true;
            selectDialFromPoint(clientToSvgPoint(svgRef.current, e.clientX, e.clientY));
          }}
          className="cursor-grab active:cursor-grabbing"
        >
          {/* Outer Circular Brass Bezel (r=72) */}
          <circle
            cx="600"
            cy="466"
            r="72"
            fill="url(#sharedGold)"
            stroke={dialAligned ? "#10b981" : "#451a03"}
            strokeWidth={dialAligned ? "5" : "3.5"}
          />
          {/* Inner Face (r=62) */}
          <circle cx="600" cy="466" r="62" fill="#fffbeb" stroke="#78350f" strokeWidth="2.5" />

          {/* Perimeter Pattern Notches Strictly Inside Rim */}
          {DIAL_NOTCHES.map((n) => {
            const rad = ((n.angleDeg - 90) * Math.PI) / 180;
            const nx = 600 + Math.cos(rad) * 46;
            const ny = 466 + Math.sin(rad) * 46;
            const isTarget = n.key === "star";
            return (
              <g key={n.key} transform={`translate(${nx}, ${ny})`}>
                <circle
                  cx="0"
                  cy="0"
                  r="11"
                  fill={dialKey === n.key ? "#0284c7" : isTarget ? "#fef08a" : "#e2e8f0"}
                  stroke={isTarget ? "#059669" : "#451a03"}
                  strokeWidth="2"
                />
                {n.key === "off" ? (
                  <text x="0" y="3.5" textAnchor="middle" fill="#451a03" fontSize="8" fontWeight="900" fontFamily="monospace">
                    0
                  </text>
                ) : (
                  <SvgPatternGlyph pattern={n.key} size={9} tint={isTarget ? "amber" : "cyan"} />
                )}
              </g>
            );
          })}

          {/* Rotating Pointer Needle + Orange Grip Knob STRICTLY INSIDE RIM (radius = 46 <= r - 24!) */}
          <line
            x1="600"
            y1="466"
            x2={knobX}
            y2={knobY}
            stroke={dialAligned ? "#059669" : "#ea580c"}
            strokeWidth="6"
            strokeLinecap="round"
          />
          <circle cx="600" cy="466" r="14" fill="#0369a1" stroke="#fde047" strokeWidth="2.8" />
          {/* Bounded Orange Handle Knob strictly inside the r=72 border! */}
          <circle
            cx={knobX}
            cy={knobY}
            r="10"
            fill={dialAligned ? "#10b981" : "#ea580c"}
            stroke="#fffbeb"
            strokeWidth="2.5"
          />
        </g>

        {/* Dial Plate Below */}
        <rect x="524" y="534" width="152" height="20" rx="10" fill={dialAligned ? "#047857" : "#0c4a6e"} stroke="#fde047" strokeWidth="1.8" />
        <text x="600" y="548" textAnchor="middle" fill="#fef08a" fontSize="9.5" fontWeight="900" fontFamily="monospace">
          {dialAligned ? "DIAL LOCKED: STAR" : "TURN DIAL TO STAR"}
        </text>

        {/* Right Bridge Brass Master Key Cradle (x=1035, y=476) */}
        <g
          onPointerDown={(e) => {
            if (unlockStage !== "ready") return;
            e.stopPropagation();
            svgRef.current?.setPointerCapture(e.pointerId);
            pointerMovedRef.current = false;
            setDragKey({ x: 1035, y: 476 });
          }}
          className={unlockStage === "ready" ? "cursor-grab active:cursor-grabbing" : "cursor-default"}
        >
          <rect
            x="948"
            y="438"
            width="174"
            height="74"
            rx="16"
            fill={unlockStage === "ready" ? "#047857" : "#1e293b"}
            stroke={unlockStage === "ready" ? "#fde047" : "#64748b"}
            strokeWidth="3"
          />
          <SvgBrassKey
            x={dragKey ? dragKey.x : 1035}
            y={dragKey ? dragKey.y : 468}
            scale={0.95}
            glow={unlockStage === "ready"}
          />
          <text x="1035" y="502" textAnchor="middle" fill="#fef08a" fontSize="10.5" fontWeight="900" fontFamily="monospace">
            {unlockStage === "ready" ? "DRAG / TAP TO UNLOCK" : "BRIDGE KEY"}
          </text>
        </g>
      </svg>
    </div>
  );
}

/* ============================================================================
   LEVEL 3 (R3) — BLIND CLINIC ANALYZER (Encrypted Health Check: 2 Need Care)
   Emerald medical lab with 4 tubes physically bolted into large central drum
   ============================================================================ */

interface PatientCapsule {
  id: string;
  tubeIndex: number;
  tubeX: number;
  needsCare: boolean;
  sealed: boolean;
  pattern: "wave" | "star" | "diamond";
}

type ClinicStage = "sealing" | "cranking" | "docked" | "unlocking" | "revealed";

function Level3ClinicAnalyzer({
  playClick,
  playSwitch,
  playSuccess,
  playError,
  playBeep,
  speak,
  setStatus,
  onRegisterHint,
  onLevelComplete,
}: LevelProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [patients, setPatients] = useState<PatientCapsule[]>([
    { id: "pt-1", tubeIndex: 1, tubeX: 390, needsCare: true, sealed: true, pattern: "wave" },
    { id: "pt-2", tubeIndex: 2, tubeX: 490, needsCare: false, sealed: true, pattern: "diamond" },
    { id: "pt-3", tubeIndex: 3, tubeX: 590, needsCare: true, sealed: false, pattern: "star" },
    { id: "pt-4", tubeIndex: 4, tubeX: 690, needsCare: false, sealed: true, pattern: "wave" },
  ]);
  const [stage, setStage] = useState<ClinicStage>("sealing");
  const [eyeState, setEyeState] = useState<EyeState>("idle");
  const [crankAngle, setCrankAngle] = useState(0); // 0..360
  const [shakeTube3, setShakeTube3] = useState(false);

  const [dragStamp, setDragStamp] = useState<{ x: number; y: number } | null>(null);
  const [dragKey, setDragKey] = useState<{ x: number; y: number } | null>(null);

  const crankDraggingRef = useRef(false);
  const crankMovedRef = useRef(false);
  const lastCrankAngleRef = useRef<number | null>(null);
  const pointerMovedRef = useRef(false);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
  }, []);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  const allSealed = patients.every((p) => p.sealed);
  const crankProgress = Math.min(1, crankAngle / 360);
  const inDrum = crankAngle > 20 || stage === "docked" || stage === "unlocking" || stage === "revealed";

  useEffect(() => {
    onRegisterHint(() => {
      if (!allSealed) {
        return "Drag or tap the heavy Privacy Seal Stamp onto Tube 3 to lock the exposed health record before analyzing.";
      }
      if (stage === "cranking") {
        return "Spin the Spoked Hand-Crank Wheel on the right to analyze all 4 locked patient capsules blindly.";
      }
      if (stage === "docked") {
        return "Drag or tap the Brass Master Key onto the Doctor's Total Podium to reveal only how many patients need care.";
      }
      return "Only the group count opened—every single patient health record stayed permanently locked!";
    });
  }, [allSealed, onRegisterHint, stage]);

  const sealTube3 = useCallback(() => {
    if (allSealed) return;
    playSwitch();
    playBeep(660);
    setPatients((prev) => prev.map((p) => ({ ...p, sealed: true })));
    setStage("cranking");
    setEyeState("safe");
    setStatus("Tube 3 sealed! Now turn the Spoked Hand-Crank Wheel to analyze all 4 locked health records.", "success");
    speak("Tube three is now sealed tight! Spin the spoked hand-crank wheel to analyze all four patient capsules blindly.");
    schedule(() => setEyeState("idle"), 1000);
  }, [allSealed, playBeep, playSwitch, schedule, setStatus, speak]);

  const blockUnsealedCrank = useCallback(() => {
    playError();
    setEyeState("alert");
    setShakeTube3(true);
    setStatus("Unsealed health record! Stamp Tube 3 first so no patient's private record is exposed!", "warn");
    speak("Hold on! Tube three is unsealed! Slam the Privacy Seal Stamp onto tube three so nobody sees that patient's private health record.");
    schedule(() => {
      setShakeTube3(false);
      setEyeState("idle");
    }, 1250);
  }, [playError, schedule, setStatus, speak]);

  const advanceCrank = useCallback(
    (deltaDeg: number) => {
      if (!allSealed || stage !== "cranking") return;
      setEyeState("blind");
      setCrankAngle((prev) => {
        const next = Math.min(360, prev + deltaDeg);
        if (Math.floor(next / 48) > Math.floor(prev / 48)) {
          playClick();
        }
        if (prev < 360 && next >= 360) {
          playBeep(780);
          playSwitch();
          schedule(() => {
            setStage("docked");
            setEyeState("safe");
            setStatus("All 4 locked records analyzed! Turn the Brass Master Key on the Doctor's Podium.", "success");
            speak("Analysis done! All four patient records stayed permanently sealed. Turn your Master Key on the Doctor's Podium to see the group count!");
          }, 320);
        }
        return next;
      });
    },
    [allSealed, playBeep, playClick, playSwitch, schedule, setStatus, speak, stage]
  );

  const unlockDoctorPodium = useCallback(() => {
    if (stage !== "docked") return;
    playSwitch();
    setStage("unlocking");
    schedule(() => {
      playSuccess();
      setStage("revealed");
      setStatus("2 Need Care revealed! All 4 individual patient health records stayed permanently locked inside the drum.", "success");
      speak("Two need care! Every individual patient record stayed permanently sealed inside the glass drum. Congrats! You have completed Cynthia Dwork.");
      onLevelComplete(100);
    }, 520);
  }, [onLevelComplete, playSuccess, playSwitch, schedule, setStatus, speak, stage]);

  // Spoked Hand-Crank Wheel Geometry (cx=876, cy=296, rim r=68, grip knob strictly on rim r=52!)
  const wheelCx = 876;
  const wheelCy = 296;
  const crankRad = ((crankAngle - 90) * Math.PI) / 180;
  const gripX = wheelCx + Math.cos(crankRad) * 50;
  const gripY = wheelCy + Math.sin(crankRad) * 50;

  const handleSvgPointerMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const pt = clientToSvgPoint(svgRef.current, e.clientX, e.clientY);

    if (dragStamp) {
      pointerMovedRef.current = true;
      setDragStamp(pt);
    } else if (dragKey) {
      pointerMovedRef.current = true;
      setDragKey(pt);
    } else if (crankDraggingRef.current && stage === "cranking") {
      const curr = (Math.atan2(pt.y - wheelCy, pt.x - wheelCx) * 180) / Math.PI;
      if (lastCrankAngleRef.current !== null) {
        let diff = curr - lastCrankAngleRef.current;
        if (diff > 180) diff -= 360;
        if (diff < -180) diff += 360;
        if (Math.abs(diff) > 2) {
          crankMovedRef.current = true;
          lastCrankAngleRef.current = curr;
          advanceCrank(Math.abs(diff));
        }
      }
    }
  };

  const handleSvgPointerUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const pt = clientToSvgPoint(svgRef.current, e.clientX, e.clientY);

    if (dragStamp) {
      const wasTap = !pointerMovedRef.current;
      setDragStamp(null);
      if (!allSealed && (wasTap || Math.hypot(pt.x - 590, pt.y - 122) < 95)) {
        sealTube3();
      }
    }

    if (dragKey) {
      const wasTap = !pointerMovedRef.current;
      setDragKey(null);
      if (stage === "docked" && (wasTap || (pt.x > 285 && pt.x < 775 && pt.y > 430))) {
        unlockDoctorPodium();
      }
    }

    if (crankDraggingRef.current) {
      crankDraggingRef.current = false;
      lastCrankAngleRef.current = null;
      if (!crankMovedRef.current && stage === "cranking") {
        advanceCrank(125);
      }
    }
  };

  return (
    <div className="flex-1 min-h-0 w-full relative overflow-hidden select-none">
      {/* FULL-BLEED EMERALD MEDICAL LAB BACKDROP */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1200 560"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="l3HallBg" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#d1fae5" />
            <stop offset="55%" stopColor="#a7f3d0" />
            <stop offset="100%" stopColor="#047857" />
          </linearGradient>
          <pattern id="l3Tile" width="60" height="60" patternUnits="userSpaceOnUse">
            <rect width="60" height="60" fill="none" stroke="#059669" strokeOpacity="0.14" strokeWidth="1.5" />
          </pattern>
        </defs>
        <rect width="1200" height="560" fill="url(#l3HallBg)" />
        <rect width="1200" height="456" fill="url(#l3Tile)" />
        <rect x="0" y="454" width="1200" height="106" fill="#064e3b" />
      </svg>

      {/* UNIFIED 1200x560 INTERACTIVE CLINIC ANALYZER STAGE */}
      <svg
        ref={svgRef}
        viewBox="0 0 1200 560"
        preserveAspectRatio="xMidYMid meet"
        onPointerMove={handleSvgPointerMove}
        onPointerUp={handleSvgPointerUp}
        onPointerCancel={handleSvgPointerUp}
        className="relative z-10 w-full h-full touch-none"
      >
        <SharedSvgDefs />
        <defs>
          <linearGradient id="l3Column" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#065f46" />
            <stop offset="40%" stopColor="#34d399" />
            <stop offset="100%" stopColor="#064e3b" />
          </linearGradient>
          <linearGradient id="l3Beam" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fef9c3" stopOpacity="0.55" />
            <stop offset="100%" stopColor="#fef9c3" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Sunlit Medical Lab Skylight Shafts & Fluted Jade Columns */}
        <polygon points="240,0 840,0 980,454 100,454" fill="url(#l3Beam)" className="pointer-events-none" />
        {[24, 1082].map((cx) => (
          <g key={cx} className="pointer-events-none">
            <rect x={cx} y="0" width="64" height="454" fill="url(#l3Column)" stroke="#064e3b" strokeWidth="3" />
            <rect x={cx - 8} y="440" width="80" height="16" rx="4" fill="url(#sharedGold)" stroke="#451a03" strokeWidth="2.5" />
          </g>
        ))}

        {/* Floor Gold Molding */}
        <rect x="0" y="452" width="1200" height="14" fill="url(#sharedGold)" stroke="#451a03" strokeWidth="2.5" />

        {/* ====================================================================
            4 TALL VERTICAL GLASS TUBES BOLTED DIRECTLY INTO DRUM TOP COLLAR!
            ==================================================================== */}
        {/* Ceiling Brass Intake Manifold Beam Bridging All 4 Tubes */}
        <rect x="330" y="0" width="420" height="24" rx="4" fill="url(#sharedGoldVert)" stroke="#451a03" strokeWidth="3" />

        {patients.map((pt) => (
          <g key={`tube-geo-${pt.id}`}>
            {/* Continuous Glass Tube from y=22 ceiling manifold straight down to y=194 drum collar! */}
            <rect
              x={pt.tubeX - 32}
              y="22"
              width="64"
              height="172"
              fill={pt.tubeIndex === 3 && !pt.sealed ? "#ffe4e6" : "#ecfdf5"}
              fillOpacity="0.72"
              stroke={pt.tubeIndex === 3 && !pt.sealed ? "#e11d48" : "#b45309"}
              strokeWidth="4"
            />
            {/* Glass specular shine */}
            <line x1={pt.tubeX - 20} y1="28" x2={pt.tubeX - 20} y2="188" stroke="#ffffff" strokeWidth="4.5" opacity="0.8" />
            {/* Tube number plate bolted at top */}
            <rect x={pt.tubeX - 28} y="28" width="56" height="18" rx="6" fill="#064e3b" stroke="#fde047" strokeWidth="1.6" />
            <text x={pt.tubeX} y="40.5" textAnchor="middle" fill="#fef08a" fontSize="9.5" fontWeight="900" fontFamily="monospace">
              TUBE {pt.tubeIndex}
            </text>
            {/* Heavy Brass Collar physically bolting tube directly onto Analyzer Drum top! */}
            <rect
              x={pt.tubeX - 38}
              y="182"
              width="76"
              height="18"
              rx="5"
              fill="url(#sharedGold)"
              stroke="#451a03"
              strokeWidth="2.8"
            />
          </g>
        ))}

        {/* Overhead Privacy Eye Bolted to Right Side of Ceiling Manifold */}
        <SvgPrivacyEye cx={876} cy={78} state={eyeState} />

        {/* ====================================================================
            LARGE CENTRAL BLIND CLINIC ANALYZER DRUM (~46% of stage!)
            ==================================================================== */}
        {/* Interlocking Gear on Left Side of Drum */}
        <SvgGear cx={312} cy={296} r={38} spinning={stage === "cranking" && crankAngle > 0 && crankAngle < 360} fill="#fbbf24" />

        {/* Heavy Horizontal Steel Axle Physically Connecting Drum Right Bearing (x=742) -> Hand-Crank Wheel (x=876) */}
        <rect x="740" y="282" width="136" height="28" rx="6" fill="url(#sharedGoldVert)" stroke="#451a03" strokeWidth="3" />
        <rect x="742" y="272" width="22" height="48" rx="5" fill="url(#sharedGold)" stroke="#451a03" strokeWidth="2.8" />

        {/* Wide Flanged Brass Drop-Chute Physically Connecting Drum Base (y=396) -> Doctor's Podium (y=446) */}
        <rect x="498" y="394" width="84" height="58" fill="url(#sharedGold)" stroke="#451a03" strokeWidth="3.2" />
        <rect x="486" y="394" width="108" height="14" rx="4" fill="#78350f" stroke="#fde047" strokeWidth="2" />

        {/* Main Analyzer Drum Body (x=330..750, y=194..400 => 420x206) */}
        <rect
          x="330"
          y="194"
          width="420"
          height="206"
          rx="34"
          fill="url(#sharedGoldVert)"
          stroke="#451a03"
          strokeWidth="4.5"
        />
        {/* Recessed Dark Emerald Glass Viewing Window with 4-Column Grid (Zero Capsule Overlap!) */}
        <rect
          x="350"
          y="224"
          width="380"
          height="146"
          rx="22"
          fill="#022c22"
          stroke="#fde047"
          strokeWidth="3.2"
        />
        <foreignObject x="352" y="226" width="376" height="142">
          <div className="w-full h-full flex flex-col items-center justify-between py-1.5">
            {/* Clean 4-Column Grid Holding P1, P2, P3, P4 Slots & Centered Capsules */}
            <div className="grid grid-cols-4 gap-3 items-center justify-items-center w-full px-4 flex-1">
              {patients.map((pt) => {
                const isExposed = !pt.sealed;
                return (
                  <div
                    key={`slot-${pt.id}`}
                    className={`w-full h-[96px] rounded-xl border-2 flex flex-col items-center justify-between py-1 px-1 transition-colors ${
                      isExposed
                        ? "bg-rose-950/90 border-rose-400"
                        : inDrum
                        ? "bg-emerald-900/90 border-amber-300"
                        : "bg-emerald-950/85 border-emerald-400/80"
                    }`}
                  >
                    <span
                      className={`px-2 py-0.5 rounded font-mono font-extrabold text-[9px] leading-none ${
                        isExposed ? "bg-rose-600 text-white" : "bg-emerald-800 text-amber-200"
                      }`}
                    >
                      P{pt.tubeIndex}
                    </span>

                    {isExposed ? (
                      <motion.div
                        animate={{ opacity: [1, 0.35, 1] }}
                        transition={{ type: "tween", repeat: Infinity, duration: 0.9, ease: "easeInOut" }}
                        className="flex flex-col items-center justify-center flex-1"
                      >
                        <span className="px-1.5 py-0.5 rounded bg-rose-600 text-white font-mono font-extrabold text-[9px]">
                          EXPOSED!
                        </span>
                      </motion.div>
                    ) : inDrum ? (
                      <motion.div
                        initial={{ y: -22, scale: 0.75, opacity: 0.4 }}
                        animate={{ y: 0, scale: 1, opacity: 1, rotate: stage === "cranking" ? crankAngle : 0 }}
                        transition={{ type: "spring", stiffness: 240, damping: 22 }}
                        className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-emerald-900 border-2 border-amber-300 flex items-center justify-center shadow"
                      >
                        <svg viewBox="-24 -24 48 48" className="w-8 h-8" aria-hidden="true">
                          <SvgPatternGlyph pattern={pt.pattern} size={18} tint="emerald" />
                        </svg>
                      </motion.div>
                    ) : (
                      <svg viewBox="-32 -16 64 32" className="w-14 h-7" aria-hidden="true">
                        <path
                          d="M -28 0 Q -18 -14 -8 0 T 12 0 T 28 0"
                          fill="none"
                          stroke="#34d399"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                        <path
                          d="M -28 6 Q -18 -6 -8 6 T 12 6 T 28 6"
                          fill="none"
                          stroke="#fde047"
                          strokeWidth="2"
                          strokeDasharray="4 3"
                          strokeLinecap="round"
                        />
                      </svg>
                    )}

                    <span
                      className={`font-mono font-extrabold text-[8px] leading-none uppercase ${
                        isExposed ? "text-rose-300" : inDrum ? "text-amber-300" : "text-emerald-300"
                      }`}
                    >
                      {isExposed ? "OPEN" : inDrum ? "LOCKED" : "SEALED"}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Crisp Visual Formula Badge at Bottom of Analyzer Screen */}
            <div className="mt-1 px-3 py-0.5 rounded-full bg-emerald-900 border border-emerald-400 font-mono font-extrabold text-[10px] text-amber-200 tracking-wide">
              [4 SEALED RECORDS] -&gt; [BLIND COUNT]
            </div>
          </div>
        </foreignObject>

        {/* Top Drum NO KEY Shield + Engraved Title */}
        <SvgNoKeyPlaque x={418} y={209} />
        <text x="615" y="214" textAnchor="middle" fill="#451a03" fontSize="13" fontWeight="900" fontFamily="monospace">
          BLIND CLINIC ANALYZER
        </text>
        <text x="540" y="391" textAnchor="middle" fill="#fef9c3" fontSize="10" fontWeight="900" fontFamily="monospace">
          {stage === "revealed"
            ? "ALL 4 RECORDS STAYED LOCKED"
            : allSealed
            ? "SPIN CRANK WHEEL TO COUNT"
            : "CHECK ALL 4 TUBES FOR PRIVACY LEAKS"}
        </text>

        {/* ====================================================================
            4 PATIENT HEALTH CAPSULES IN TOP TUBES (Slide cleanly into 4-col grid when cranked!)
            ==================================================================== */}
        {!inDrum &&
          patients.map((pt) => {
            const isTube3 = pt.tubeIndex === 3;
            const animProps =
              isTube3 && shakeTube3
                ? { x: [pt.tubeX - 8, pt.tubeX + 8, pt.tubeX - 6, pt.tubeX + 6, pt.tubeX], y: 122 }
                : { x: pt.tubeX, y: 122 };

            return (
              <motion.g
                key={pt.id}
                initial={{ x: pt.tubeX, y: 122 }}
                animate={animProps}
                transition={
                  isTube3 && shakeTube3
                    ? { type: "tween", duration: 0.42 }
                    : { type: "spring", stiffness: 220, damping: 24 }
                }
                onClick={() => {
                  if (isTube3 && !pt.sealed) sealTube3();
                }}
                className={isTube3 && !pt.sealed ? "cursor-pointer" : "cursor-default"}
              >
                {pt.sealed ? (
                  <>
                    <rect
                      x="-26"
                      y="-32"
                      width="52"
                      height="64"
                      rx="16"
                      fill="url(#sealedGreen)"
                      stroke="#fde047"
                      strokeWidth="2.8"
                    />
                    <SvgPatternGlyph pattern={pt.pattern} size={17} tint="emerald" />
                    <SvgPadlockBadge x={20} y={-24} locked />
                  </>
                ) : (
                  <>
                    <rect
                      x="-26"
                      y="-34"
                      width="52"
                      height="68"
                      rx="16"
                      fill="#fff1f2"
                      stroke="#e11d48"
                      strokeWidth="3.2"
                    />
                    <path d="M -8 -10 L 8 -10 M 0 -18 L 0 -2" stroke="#e11d48" strokeWidth="4.5" strokeLinecap="round" />
                    <text x="0" y="14" textAnchor="middle" fill="#9f1239" fontSize="9.5" fontWeight="900" fontFamily="monospace">
                      FEVER
                    </text>
                    <text x="0" y="26" textAnchor="middle" fill="#e11d48" fontSize="8" fontWeight="900" fontFamily="monospace">
                      OPEN!
                    </text>
                    <SvgPadlockBadge x={20} y={-26} locked={false} />
                  </>
                )}
              </motion.g>
            );
          })}

        {/* ====================================================================
            LEFT SHELF: HEAVY BRASS PRIVACY SEAL STAMP (Bolted to Left Wall)
            ==================================================================== */}
        <rect x="88" y="346" width="176" height="18" rx="6" fill="url(#sharedGold)" stroke="#451a03" strokeWidth="2.8" />
        <rect x="108" y="364" width="136" height="24" rx="8" fill="#064e3b" stroke="#fde047" strokeWidth="2" />
        <text x="176" y="380" textAnchor="middle" fill="#fef08a" fontSize="10.5" fontWeight="900" fontFamily="monospace">
          {allSealed ? "ALL SEALED" : "PRIVACY STAMP"}
        </text>

        <g
          transform={`translate(${dragStamp ? dragStamp.x : 176}, ${dragStamp ? dragStamp.y : 292})`}
          onPointerDown={(e) => {
            if (allSealed) return;
            e.stopPropagation();
            svgRef.current?.setPointerCapture(e.pointerId);
            pointerMovedRef.current = false;
            setDragStamp({ x: 176, y: 292 });
          }}
          className={!allSealed ? "cursor-grab active:cursor-grabbing" : "cursor-default"}
        >
          {!allSealed && <circle cx="0" cy="0" r="56" fill="#fde047" opacity="0.28" />}
          {/* Turned wooden stamp handle */}
          <circle cx="0" cy="-30" r="20" fill="#b45309" stroke="#451a03" strokeWidth="3" />
          <path d="M -11 -12 L 11 -12 L 18 18 L -18 18 Z" fill="#9a3412" stroke="#451a03" strokeWidth="2.8" />
          {/* Heavy brass collar & emerald seal die */}
          <rect x="-32" y="16" width="64" height="16" rx="5" fill="url(#sharedGold)" stroke="#451a03" strokeWidth="2.8" />
          <rect x="-38" y="30" width="76" height="18" rx="5" fill="#059669" stroke="#064e3b" strokeWidth="2.8" />
          <text x="0" y="42.5" textAnchor="middle" fill="#fef08a" fontSize="9.5" fontWeight="900" fontFamily="monospace">
            SEAL LOCK
          </text>
        </g>

        {/* ====================================================================
            RIGHT AXLE: SPOKED BRASS HAND-CRANK WHEEL (Bounded Circular Drag!)
            ==================================================================== */}
        <g
          onPointerDown={(e) => {
            if (stage === "docked" || stage === "unlocking" || stage === "revealed") return;
            e.stopPropagation();
            if (!allSealed) {
              blockUnsealedCrank();
              return;
            }
            svgRef.current?.setPointerCapture(e.pointerId);
            const pt = clientToSvgPoint(svgRef.current, e.clientX, e.clientY);
            crankDraggingRef.current = true;
            crankMovedRef.current = false;
            lastCrankAngleRef.current = (Math.atan2(pt.y - wheelCy, pt.x - wheelCx) * 180) / Math.PI;
          }}
          className={
            stage === "docked" || stage === "unlocking" || stage === "revealed"
              ? "cursor-default"
              : "cursor-grab active:cursor-grabbing"
          }
        >
          {/* Progress Track Ring */}
          <circle cx={wheelCx} cy={wheelCy} r="76" fill="none" stroke="#064e3b" strokeWidth="9" opacity="0.55" />
          <circle
            cx={wheelCx}
            cy={wheelCy}
            r="76"
            fill="none"
            stroke={crankProgress >= 1 ? "#34d399" : "#fde047"}
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 76}
            strokeDashoffset={2 * Math.PI * 76 * (1 - crankProgress)}
            transform={`rotate(-90 ${wheelCx} ${wheelCy})`}
          />
          {/* Outer Brass Rim */}
          <circle cx={wheelCx} cy={wheelCy} r="62" fill="none" stroke="url(#sharedGold)" strokeWidth="12" />
          <circle cx={wheelCx} cy={wheelCy} r="62" fill="none" stroke="#451a03" strokeWidth="2.5" />
          {/* 6 Rotating Spokes */}
          <g transform={`rotate(${crankAngle} ${wheelCx} ${wheelCy})`}>
            {[0, 60, 120, 180, 240, 300].map((deg) => (
              <line
                key={deg}
                x1={wheelCx}
                y1={wheelCy}
                x2={wheelCx}
                y2={wheelCy - 56}
                stroke="url(#sharedGold)"
                strokeWidth="7"
                strokeLinecap="round"
                transform={`rotate(${deg} ${wheelCx} ${wheelCy})`}
              />
            ))}
          </g>
          {/* Center Hub */}
          <circle cx={wheelCx} cy={wheelCy} r="18" fill="url(#sharedGold)" stroke="#451a03" strokeWidth="3" />
          <circle cx={wheelCx} cy={wheelCy} r="7" fill="#064e3b" />
          {/* Bounded Orange Crank Handle strictly inside the outer rim! */}
          <circle cx={gripX} cy={gripY} r="12" fill="#ea580c" stroke="#fef08a" strokeWidth="3" />
          <circle cx={gripX} cy={gripY} r="4.5" fill="#fef08a" />
        </g>

        <rect x="794" y="384" width="164" height="24" rx="12" fill={stage === "cranking" ? "#f59e0b" : "#064e3b"} stroke="#fde047" strokeWidth="2" />
        <text
          x="876"
          y="400"
          textAnchor="middle"
          fill={stage === "cranking" ? "#451a03" : "#fef08a"}
          fontSize="10.5"
          fontWeight="900"
          fontFamily="monospace"
        >
          {crankProgress >= 1 ? "ANALYZED 100%" : `CRANK WHEEL ${Math.round(crankProgress * 100)}%`}
        </text>

        {/* ====================================================================
            FLOOR BASE: DOCTOR'S TOTAL PODIUM + PRIVATE MASTER KEY
            ==================================================================== */}
        <g
          onClick={stage === "docked" ? unlockDoctorPodium : undefined}
          className={stage === "docked" ? "cursor-pointer" : ""}
        >
          <rect
            x="292"
            y="446"
            width="476"
            height="92"
            rx="18"
            fill={stage === "revealed" ? "#fef9c3" : stage === "docked" ? "#047857" : "#022c22"}
            stroke={stage === "docked" || stage === "revealed" ? "#fde047" : "#34d399"}
            strokeWidth="4"
          />
          <text
            x="530"
            y="470"
            textAnchor="middle"
            fill={stage === "revealed" ? "#065f46" : "#fde047"}
            fontSize="11"
            fontWeight="900"
            fontFamily="monospace"
          >
            DOCTOR&apos;S TOTAL PODIUM
          </text>

          {stage === "revealed" ? (
            <motion.g
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 320, damping: 18 }}
              style={{ originX: "530px", originY: "506px" }}
            >
              <text x="530" y="504" textAnchor="middle" fill="#064e3b" fontSize="25" fontWeight="900" fontFamily="monospace">
                2 Need Care
              </text>
              <text x="530" y="527" textAnchor="middle" fill="#047857" fontSize="10.5" fontWeight="900" fontFamily="monospace">
                INDIVIDUALS: LOCKED | TOTAL: UNLOCKED
              </text>
            </motion.g>
          ) : stage === "docked" || stage === "unlocking" ? (
            <motion.g
              animate={stage === "unlocking" ? { scale: [1, 1.12, 0.94] } : { scale: 1 }}
              transition={stage === "unlocking" ? { type: "tween", duration: 0.45 } : { duration: 0.2 }}
              style={{ originX: "530px", originY: "506px" }}
            >
              <text x="530" y="505" textAnchor="middle" fill="#ffffff" fontSize="16" fontWeight="900" fontFamily="monospace">
                {stage === "unlocking" ? "UNLOCKING..." : "TOTAL READY"}
              </text>
              <text x="530" y="526" textAnchor="middle" fill="#fde047" fontSize="10.5" fontWeight="900" fontFamily="monospace">
                INDIVIDUALS: LOCKED | TOTAL: UNLOCKED
              </text>
            </motion.g>
          ) : (
            <text x="530" y="508" textAnchor="middle" fill="#6ee7b7" fontSize="11.5" fontWeight="900" fontFamily="monospace">
              INDIVIDUALS: LOCKED | TOTAL: LOCKED
            </text>
          )}
        </g>

        {/* Doctor's Brass Master Key Cradle (x=876, y=492) */}
        <g
          onPointerDown={(e) => {
            if (stage !== "docked") return;
            e.stopPropagation();
            svgRef.current?.setPointerCapture(e.pointerId);
            pointerMovedRef.current = false;
            setDragKey({ x: 876, y: 492 });
          }}
          className={stage === "docked" ? "cursor-grab active:cursor-grabbing" : "cursor-default"}
        >
          <rect
            x="786"
            y="456"
            width="180"
            height="72"
            rx="16"
            fill={stage === "docked" ? "#d97706" : "#022c22"}
            stroke={stage === "docked" ? "#fef08a" : "#059669"}
            strokeWidth="3"
          />
          <SvgBrassKey
            x={dragKey ? dragKey.x : 876}
            y={dragKey ? dragKey.y : 486}
            scale={0.95}
            glow={stage === "docked"}
          />
          <text
            x="876"
            y="518"
            textAnchor="middle"
            fill={stage === "docked" ? "#451a03" : "#6ee7b7"}
            fontSize="10.5"
            fontWeight="900"
            fontFamily="monospace"
          >
            {stage === "docked" ? "DRAG / TAP TO UNLOCK" : "DOCTOR KEY"}
          </text>
        </g>
      </svg>
    </div>
  );
}

/* ============================================================================
   MAIN ORCHESTRATOR: CYNTHIA DWORK (3 Real-World Homomorphic Encryption Domains)
   ============================================================================ */

interface LevelMeta {
  index: 0 | 1 | 2;
  code: string;
  title: string;
  initialStatus: string;
  introVoice: string;
  beamClass: string;
  bgClass: string;
}

const LEVELS: LevelMeta[] = [
  {
    index: 0,
    code: "R1",
    title: "Secret Savings Combiner",
    initialStatus: "Goal: Combine 12 and 15 inside the keyless dome without exposing either number.",
    introVoice:
      "Secret Savings Combiner. Your goal is to combine twelve and fifteen inside the keyless dome without exposing either number.",
    beamClass: "from-amber-900 via-amber-800 to-amber-900 border-amber-400",
    bgClass: "bg-amber-100",
  },
  {
    index: 1,
    code: "R2",
    title: "Blind Word & Password Matcher",
    initialStatus: "Goal: Find the secret STAR crate using the blind scanner without revealing any word.",
    introVoice:
      "Blind Word and Password Matcher. Your goal is to find the secret Star crate using the blind scanner without revealing any word.",
    beamClass: "from-sky-900 via-sky-800 to-sky-900 border-cyan-300",
    bgClass: "bg-sky-600",
  },
  {
    index: 2,
    code: "R3",
    title: "Blind Clinic Analyzer",
    initialStatus: "Goal: Count the group fever total while keeping every patient's record sealed.",
    introVoice:
      "Blind Clinic Analyzer. Your goal is to count the group fever total while keeping every patient's record sealed. Inspect all four glass tubes carefully!",
    beamClass: "from-emerald-950 via-emerald-900 to-emerald-950 border-amber-300",
    bgClass: "bg-emerald-900",
  },
];

export default function HomomorphicEncryptionLab() {
  const { playClick, playSwitch, playSuccess, playError, playBeep } = useLabAudio();
  const { reportComplete, getTimeTaken } = useLMSBridge("homomorphic-encryption");
  const { speak, stop: stopVoice, setMuted: setVoiceMuted } = useVoiceAssistant({ lang: "en-IN" });

  const [levelIdx, setLevelIdx] = useState<0 | 1 | 2>(0);
  const [resetTick, setResetTick] = useState(0);
  const [levelSolved, setLevelSolved] = useState(false);
  const [score, setScore] = useState(0);
  const [status, setStatusState] = useState<{ text: string; tone: StatusTone }>({
    text: LEVELS[0].initialStatus,
    tone: "info",
  });
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  const hintProviderRef = useRef<() => string>(() => LEVELS[0].initialStatus);
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
            labId: "homomorphic-encryption",
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
              colors: ["#f59e0b", "#0ea5e9", "#10b981", "#fbbf24", "#38bdf8"],
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
    setStatusState({ text: LEVELS[nextIdx].initialStatus, tone: "info" });
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
    setResetTick((t) => t + 1);
    setLevelSolved(false);
    setScore(0);
    setShowCompletionModal(false);
    setStatusState({ text: LEVELS[0].initialStatus, tone: "info" });
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

  const sharedLevelProps: LevelProps = {
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
      labId="homomorphic-encryption"
      title="Cynthia Dwork"
      module="Advanced Computing"
      score={score}
      maxScore={100}
      navExtra={navExtraControls}
      fullBleed
      bgOverride={currentLevel.bgClass}
      onMuteChange={(muted) => setVoiceMuted(muted)}
    >
      <div className="flex-1 min-h-0 w-full flex flex-col overflow-hidden relative">
        {/* Top Engraved World Beam & 3-Level Lamps */}
        <div
          className={`relative z-30 shrink-0 w-full px-3 sm:px-5 py-1 bg-gradient-to-r ${currentLevel.beamClass} border-b-2 flex items-center justify-between gap-2 shadow-sm`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-300 border border-amber-950 shrink-0" />
            <span className="font-mono font-extrabold text-[11px] sm:text-xs text-amber-50 uppercase tracking-wider truncate">
              {currentLevel.code} — {currentLevel.title}
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

        {/* ACTIVE FULL-BLEED UNIFIED SVG WORLD */}
        <div className="flex-1 min-h-0 w-full flex flex-col overflow-hidden relative">
          {levelIdx === 0 && (
            <Level1SavingsFoundry key={`l1-${resetTick}`} {...sharedLevelProps} />
          )}
          {levelIdx === 1 && (
            <Level2WordMatcher key={`l2-${resetTick}`} {...sharedLevelProps} />
          )}
          {levelIdx === 2 && (
            <Level3ClinicAnalyzer key={`l3-${resetTick}`} {...sharedLevelProps} />
          )}
        </div>

        {/* FLUSH BOTTOM ENGRAVED BRASS STATUS STRIP */}
        <div
          className={`relative z-30 shrink-0 w-full px-3 sm:px-5 py-1.5 border-t-2 flex items-center justify-between gap-2 shadow-inner transition-colors ${
            status.tone === "warn"
              ? "bg-gradient-to-r from-rose-900 via-rose-800 to-rose-900 border-amber-300 text-amber-50"
              : status.tone === "success"
              ? "bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 border-amber-300 text-emerald-50"
              : "bg-gradient-to-r from-amber-950 via-amber-900 to-amber-950 border-amber-400 text-amber-100"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            <span className="hidden sm:inline-block w-2 h-2 rounded-full bg-amber-300 border border-amber-950 shrink-0" />
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
                className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-amber-100 via-amber-50 to-emerald-100 border-4 border-amber-400 shadow-2xl p-6 sm:p-8 text-center"
              >
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-amber-400 to-orange-500 border-4 border-amber-200 shadow-md flex items-center justify-center">
                  <Award className="w-9 h-9 text-white" />
                </div>

                <h2 className="font-sans font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight mb-5">
                  Congrats! You have completed Cynthia Dwork.
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
