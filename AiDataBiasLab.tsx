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
   SHARED TYPES, COORDINATE MAPPER & PINNED-JOINT WALKING SVG CHARACTERS
   ============================================================================ */

type StatusTone = "info" | "warn" | "success";

interface WorldLevelProps {
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
      <linearGradient id="metalSilver" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#94a3b8" />
        <stop offset="50%" stopColor="#f1f5f9" />
        <stop offset="100%" stopColor="#64748b" />
      </linearGradient>
      <linearGradient id="metalSilverVert" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#f1f5f9" />
        <stop offset="50%" stopColor="#cbd5e1" />
        <stop offset="100%" stopColor="#64748b" />
      </linearGradient>
      <linearGradient id="goldAccent" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef9c3" />
        <stop offset="50%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
      <linearGradient id="glassShine" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#e0f2fe" stopOpacity="0.92" />
        <stop offset="50%" stopColor="#ffffff" stopOpacity="0.55" />
        <stop offset="100%" stopColor="#bae6fd" stopOpacity="0.86" />
      </linearGradient>
    </defs>
  );
}

type CharacterKind =
  | "opt_healthy"
  | "opt_strain_noglasses"
  | "opt_strain_glasses"
  | "rural_healthy"
  | "city_spot";

/**
 * Full-body articulated SVG person grounded strictly at y = 0 (shoes touch y = 0).
 * Uses SVG-native <animateTransform> pinned directly to exact shoulder (±16, -100)
 * and hip (±8, -56) coordinates so limbs NEVER detach or drift during walking.
 */
function FullBodyCharacterSVG({
  kind,
  walking = false,
  glareFlash = false,
  scale = 1,
  badgeText,
  badgeColor,
  subBadgeText,
}: {
  kind: CharacterKind;
  walking?: boolean;
  glareFlash?: boolean;
  scale?: number;
  badgeText: string;
  badgeColor: string;
  subBadgeText?: string;
}) {
  const palette: Record<
    CharacterKind,
    {
      shirt: string;
      pants: string;
      shoe: string;
      skin: string;
      hair: string;
      hasGlasses?: boolean;
      hasEyeStrain?: boolean;
    }
  > = {
    opt_healthy: {
      shirt: "#0284c7",
      pants: "#1e3a8a",
      shoe: "#0f172a",
      skin: "#f1c27d",
      hair: "#334155",
    },
    opt_strain_noglasses: {
      shirt: "#d97706",
      pants: "#1e293b",
      shoe: "#451a03",
      skin: "#d2996c",
      hair: "#1c1917",
      hasEyeStrain: true,
    },
    opt_strain_glasses: {
      shirt: "#7c3aed",
      pants: "#0f172a",
      shoe: "#312e81",
      skin: "#e0ac69",
      hair: "#451a03",
      hasGlasses: true,
      hasEyeStrain: true,
    },
    rural_healthy: {
      shirt: "#059669",
      pants: "#78350f",
      shoe: "#451a03",
      skin: "#c68642",
      hair: "#1c1917",
    },
    city_spot: {
      shirt: "#2563eb",
      pants: "#1e293b",
      shoe: "#0f172a",
      skin: "#f1c27d",
      hair: "#1e293b",
      hasGlasses: true,
    },
  };

  const c = palette[kind];

  return (
    <g transform={`scale(${scale})`}>
      {/* Ground contact shadow anchored strictly at y = 0 */}
      <ellipse cx="0" cy="0" rx="24" ry="5" fill="#0f172a" opacity="0.22" />

      {/* Body group with ultra-subtle grounded walk bob */}
      <g>
        {walking && (
          <animateTransform
            attributeName="transform"
            type="translate"
            values="0 0; 0 -2; 0 0; 0 -2; 0 0"
            dur="0.5s"
            repeatCount="indefinite"
          />
        )}

        {/* BACK ARM — pinned directly at right shoulder joint (16, -100) */}
        <g>
          {walking && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="-18 16 -100; 18 16 -100; -18 16 -100"
              dur="0.5s"
              repeatCount="indefinite"
            />
          )}
          <rect x="10.5" y="-106" width="11" height="44" rx="5.5" fill={c.skin} stroke="#0f172a" strokeWidth="2.2" />
          <rect x="9.5" y="-107" width="13" height="20" rx="6.5" fill={c.shirt} stroke="#0f172a" strokeWidth="2.2" />
        </g>

        {/* BACK LEG + SHOE — pinned directly at right hip joint (8, -56) */}
        <g>
          {walking && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="18 8 -56; -18 8 -56; 18 8 -56"
              dur="0.5s"
              repeatCount="indefinite"
            />
          )}
          <rect x="1.5" y="-62" width="13" height="54" rx="6.5" fill={c.pants} stroke="#0f172a" strokeWidth="2.4" />
          <path d="M 1 -10 L 20 -10 Q 24 -10 24 -4 L 24 0 L 1 0 Z" fill={c.shoe} stroke="#0f172a" strokeWidth="2" />
        </g>

        {/* FRONT LEG + SHOE — pinned directly at left hip joint (-8, -56) */}
        <g>
          {walking && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="-18 -8 -56; 18 -8 -56; -18 -8 -56"
              dur="0.5s"
              repeatCount="indefinite"
            />
          )}
          <rect x="-14.5" y="-62" width="13" height="54" rx="6.5" fill={c.pants} stroke="#0f172a" strokeWidth="2.4" />
          <path d="M -16 -10 L 3 -10 Q 7 -10 7 -4 L 7 0 L -16 0 Z" fill={c.shoe} stroke="#0f172a" strokeWidth="2" />
        </g>

        {/* TORSO / SHIRT (covers both hip and shoulder joints cleanly) */}
        <rect x="-19" y="-110" width="38" height="56" rx="14" fill={c.shirt} stroke="#0f172a" strokeWidth="2.6" />
        <path
          d="M -8 -110 L 0 -100 L 8 -110"
          fill="none"
          stroke="#fef9c3"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* FRONT ARM — pinned directly at left shoulder joint (-16, -100) */}
        <g>
          {walking && (
            <animateTransform
              attributeName="transform"
              type="rotate"
              values="18 -16 -100; -18 -16 -100; 18 -16 -100"
              dur="0.5s"
              repeatCount="indefinite"
            />
          )}
          <rect x="-21.5" y="-106" width="11" height="44" rx="5.5" fill={c.skin} stroke="#0f172a" strokeWidth="2.2" />
          <rect x="-22.5" y="-107" width="13" height="20" rx="6.5" fill={c.shirt} stroke="#0f172a" strokeWidth="2.2" />
        </g>

        {/* NECK & HEAD */}
        <rect x="-6" y="-120" width="12" height="12" rx="4" fill={c.skin} />
        <circle cx="0" cy="-139" r="24" fill={c.skin} stroke="#0f172a" strokeWidth="2.6" />

        {/* DISTINCT HAIRSTYLES */}
        {kind === "opt_healthy" && (
          <path d="M -23 -144 A 23 20 0 0 1 23 -144 Q 8 -151 -10 -148 Z" fill={c.hair} stroke="#0f172a" strokeWidth="2" />
        )}
        {kind === "opt_strain_noglasses" && (
          <path d="M -23 -142 Q -12 -168 2 -159 Q 15 -168 23 -142 Q 6 -150 -23 -142 Z" fill={c.hair} stroke="#0f172a" strokeWidth="2" />
        )}
        {kind === "opt_strain_glasses" && (
          <>
            <circle cx="21" cy="-150" r="8" fill={c.hair} stroke="#0f172a" strokeWidth="2" />
            <path d="M -23 -143 A 23 21 0 0 1 23 -143 Q 0 -152 -23 -143 Z" fill={c.hair} stroke="#0f172a" strokeWidth="2" />
          </>
        )}
        {kind === "rural_healthy" && (
          <>
            <circle cx="-22" cy="-143" r="9" fill={c.hair} stroke="#0f172a" strokeWidth="2" />
            <path d="M -23 -144 A 23 20 0 0 1 23 -144 Z" fill={c.hair} stroke="#0f172a" strokeWidth="2" />
          </>
        )}
        {kind === "city_spot" && (
          <path d="M -23 -145 A 23 20 0 0 1 23 -145 Q 6 -155 -14 -150 Z" fill={c.hair} stroke="#0f172a" strokeWidth="2" />
        )}

        {/* EYES (Clear White vs. Visible Red Eye Strain) */}
        <ellipse
          cx="-8"
          cy="-139"
          rx="5.2"
          ry="4.2"
          fill={c.hasEyeStrain ? "#fda4af" : "#ffffff"}
          stroke={c.hasEyeStrain ? "#e11d48" : "#0f172a"}
          strokeWidth="1.4"
        />
        <ellipse
          cx="8"
          cy="-139"
          rx="5.2"
          ry="4.2"
          fill={c.hasEyeStrain ? "#fda4af" : "#ffffff"}
          stroke={c.hasEyeStrain ? "#e11d48" : "#0f172a"}
          strokeWidth="1.4"
        />
        <circle cx="-8" cy="-139" r="2.2" fill="#0f172a" />
        <circle cx="8" cy="-139" r="2.2" fill="#0f172a" />

        {/* Visible Red Eye-Strain Indicator Lines */}
        {c.hasEyeStrain && (
          <g stroke="#e11d48" strokeWidth="1.6" strokeLinecap="round">
            <line x1="-15" y1="-142" x2="-13" y2="-140" />
            <line x1="15" y1="-142" x2="13" y2="-140" />
          </g>
        )}

        {/* BOLD EYEGLASSES FRAMES + LENS REFLECTION */}
        {c.hasGlasses && (
          <g>
            <rect
              x="-17"
              y="-146"
              width="15"
              height="12"
              rx="4"
              fill={glareFlash ? "#fef08a" : "#e0f2fe"}
              fillOpacity={glareFlash ? "0.92" : "0.35"}
              stroke="#0f172a"
              strokeWidth="2.6"
            />
            <rect
              x="2"
              y="-146"
              width="15"
              height="12"
              rx="4"
              fill={glareFlash ? "#fef08a" : "#e0f2fe"}
              fillOpacity={glareFlash ? "0.92" : "0.35"}
              stroke="#0f172a"
              strokeWidth="2.6"
            />
            <line x1="-2" y1="-141" x2="2" y2="-141" stroke="#0f172a" strokeWidth="2.6" />
            {/* Diagonal white lens shine */}
            <line x1="-14" y1="-144" x2="-10" y2="-136" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.88" />
            <line x1="5" y1="-144" x2="9" y2="-136" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" opacity="0.88" />
            {/* Bright Glare Starburst when Untrained Scanner Fails */}
            {glareFlash && (
              <polygon
                points="0,-156 3,-145 14,-148 5,-140 16,-134 4,-135 2,-124 -2,-135 -14,-134 -5,-140 -14,-148 -3,-145"
                fill="#fef08a"
                stroke="#e11d48"
                strokeWidth="1.6"
              />
            )}
          </g>
        )}

        {/* EXPRESSION */}
        <path
          d={c.hasEyeStrain || kind === "city_spot" ? "M -6 -125 Q 0 -129 6 -125" : "M -6 -128 Q 0 -122 6 -128"}
          fill="none"
          stroke="#0f172a"
          strokeWidth="2.2"
          strokeLinecap="round"
        />
      </g>

      {/* CRISP OVERHEAD STATUS BADGE */}
      <g transform="translate(0, -184)">
        <rect
          x="-58"
          y="-16"
          width="116"
          height={subBadgeText ? "36" : "26"}
          rx="11"
          fill={badgeColor}
          stroke="#fef9c3"
          strokeWidth="2.2"
        />
        <text x="0" y="1" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900" fontFamily="monospace">
          {badgeText}
        </text>
        {subBadgeText && (
          <text x="0" y="14" textAnchor="middle" fill="#fef08a" fontSize="8.8" fontWeight="900" fontFamily="monospace">
            {subBadgeText}
          </text>
        )}
      </g>
    </g>
  );
}

/* ============================================================================
   LEVEL 1 (R1) — EYE HEALTH SCANNER (Glasses vs. No-Glasses Bias)
   Full-bleed sunlit Optometry Clinic with eye-chart wall posters, central
   AI Eye Scanner Arch + Training Memory Bank, and grounded walking patients.
   ============================================================================ */

type R1PatientId = "opt_healthy" | "opt_strain_noglasses" | "opt_strain_glasses";

interface R1Patient {
  id: R1PatientId;
  code: string;
  homeX: number;
  badgeText: string;
  subBadgeText: string;
  badgeColor: string;
  state: "waiting" | "walking_in" | "glare_miss" | "checked";
}

function Level1EyeClinic({
  playSwitch,
  playSuccess,
  playError,
  playBeep,
  speak,
  setStatus,
  onRegisterHint,
  onLevelComplete,
}: WorldLevelProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [patients, setPatients] = useState<R1Patient[]>([
    {
      id: "opt_healthy",
      code: "Patient A",
      homeX: 94,
      badgeText: "PATIENT A",
      subBadgeText: "NO GLASSES • OK",
      badgeColor: "#0284c7",
      state: "waiting",
    },
    {
      id: "opt_strain_noglasses",
      code: "Patient B",
      homeX: 206,
      badgeText: "PATIENT B",
      subBadgeText: "NO GLASSES • STRAIN",
      badgeColor: "#d97706",
      state: "waiting",
    },
    {
      id: "opt_strain_glasses",
      code: "Patient C",
      homeX: 318,
      badgeText: "PATIENT C",
      subBadgeText: "GLASSES • STRAIN",
      badgeColor: "#7c3aed",
      state: "waiting",
    },
  ]);

  const [glassesScansLoaded, setGlassesScansLoaded] = useState(0); // 0..2
  const [archBanner, setArchBanner] = useState<
    "idle" | "scanning" | "healthy" | "strain_caught" | "glare_blind"
  >("idle");
  const [sawGlareFail, setSawGlareFail] = useState(false);
  const [busy, setBusy] = useState(false);
  const [solved, setSolved] = useState(false);

  const [dragPatient, setDragPatient] = useState<{ id: R1PatientId; x: number; y: number } | null>(null);
  const [dragScan, setDragScan] = useState<{ idx: number; x: number; y: number } | null>(null);
  const movedRef = useRef(false);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
  }, []);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  const glassesTrained = glassesScansLoaded >= 2;

  useEffect(() => {
    onRegisterHint(() => {
      if (!sawGlareFail && !glassesTrained) {
        return "Walk Patient A, Patient B, and Patient C (wearing glasses) through the AI Eye Scanner Arch.";
      }
      if (!glassesTrained) {
        return "Drag both With-Glasses Eye Scans from the right clinic table into the empty WITH-GLASSES SCANS bank above the arch.";
      }
      if (!solved) {
        return "Walk Patient C (and any remaining waiting patients) through the AI Eye Scanner Arch to finish.";
      }
      return "All three patients accurately scanned with glasses glare filtered!";
    });
  }, [glassesTrained, onRegisterHint, sawGlareFail, solved]);

  const walkThroughScanner = useCallback(
    (pid: R1PatientId) => {
      if (busy) return;
      const target = patients.find((p) => p.id === pid);
      if (!target || target.state === "checked") return;

      setBusy(true);
      playSwitch();
      playBeep(560);
      setArchBanner("scanning");
      setPatients((prev) => prev.map((p) => (p.id === pid ? { ...p, state: "walking_in" } : p)));

      schedule(() => {
        const isGlareFail = pid === "opt_strain_glasses" && !glassesTrained;
        if (isGlareFail) {
          playError();
          setArchBanner("glare_blind");
          setSawGlareFail(true);
          setPatients((prev) => prev.map((p) => (p.id === pid ? { ...p, state: "glare_miss" } : p)));
          setStatus(
            "BLIND SPOT: UNTRAINED ON GLASSES — Glare blocked Patient C's scan! Load With-Glasses Eye Scans.",
            "warn"
          );
          speak(
            "Blind spot! Patient C's glasses reflected glare because the scanner was never trained on people wearing glasses. Drag With-Glasses Eye Scans into the top Memory Bank."
          );
          schedule(() => {
            setPatients((prev) => prev.map((p) => (p.id === pid ? { ...p, state: "waiting" } : p)));
            setBusy(false);
          }, 1150);
        } else {
          playSuccess();
          setArchBanner(pid === "opt_healthy" ? "healthy" : "strain_caught");
          const allDone = patients.every((p) => (p.id === pid ? true : p.state === "checked"));
          setPatients((prev) => prev.map((p) => (p.id === pid ? { ...p, state: "checked" as const } : p)));
          if (allDone && !solved) {
            setSolved(true);
            setStatus("All patients accurately scanned — glasses glare filtered & eye strain caught!", "success");
            speak("Brilliant! Once With-Glasses scans were added, the eye scanner filtered out the glare and caught Patient C's eye strain.");
            onLevelComplete(35);
          } else if (pid === "opt_healthy") {
            setStatus("HEALTHY EYES (Patient A) — now walk the next patient through the arch!", "success");
          } else if (pid === "opt_strain_noglasses") {
            setStatus("EYE STRAIN CAUGHT (Patient B) — now test Patient C wearing glasses!", "success");
          } else {
            setStatus("EYE STRAIN CAUGHT (Patient C) — walk any remaining waiting patients through!", "success");
          }
          setBusy(false);
        }
      }, 820);
    },
    [busy, glassesTrained, onLevelComplete, patients, playBeep, playError, playSuccess, playSwitch, schedule, setStatus, solved, speak]
  );

  const loadGlassesScan = useCallback(() => {
    if (glassesScansLoaded >= 2 || busy) return;
    if (!sawGlareFail) {
      playError();
      setStatus("Walk Patient C (wearing glasses) through the scanner first to see the glasses glare blind spot!", "warn");
      speak("First walk Patient C wearing glasses through the scanner arch to observe why glare confuses the AI.");
      return;
    }
    playSwitch();
    playBeep(640 + glassesScansLoaded * 95);
    const next = glassesScansLoaded + 1;
    setGlassesScansLoaded(next);
    if (next >= 2) {
      playSuccess();
      setArchBanner("idle");
      setStatus("WITH-GLASSES SCANS loaded! Walk Patient C through the AI Eye Scanner Arch again.", "success");
      speak("With-Glasses scans loaded! Now walk Patient C through the scanner arch again.");
    } else {
      setStatus("1 With-Glasses Scan loaded — drag the second scan into the top Memory Bank.", "info");
    }
  }, [busy, glassesScansLoaded, playBeep, playError, playSuccess, playSwitch, sawGlareFail, setStatus, speak]);

  const onSvgMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const pt = clientToSvg(svgRef.current, e.clientX, e.clientY);
    if (dragPatient) {
      movedRef.current = true;
      setDragPatient({ id: dragPatient.id, x: Math.max(70, Math.min(760, pt.x)), y: 444 });
    } else if (dragScan) {
      movedRef.current = true;
      setDragScan({ ...dragScan, x: pt.x, y: pt.y });
    }
  };

  const onSvgUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const pt = clientToSvg(svgRef.current, e.clientX, e.clientY);
    if (dragPatient) {
      const wasTap = !movedRef.current;
      const pid = dragPatient.id;
      setDragPatient(null);
      if (wasTap || pt.x > 400) {
        walkThroughScanner(pid);
      }
    }
    if (dragScan) {
      const wasTap = !movedRef.current;
      setDragScan(null);
      if (wasTap || (pt.x > 400 && pt.x < 800 && pt.y > 10 && pt.y < 160)) {
        loadGlassesScan();
      }
    }
  };

  return (
    <div className="flex-1 min-h-0 w-full relative overflow-hidden select-none">
      {/* FULL-BLEED SUNLIT OPTOMETRY CLINIC BACKDROP */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1200 560"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="optWall" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#e0f2fe" />
            <stop offset="56%" stopColor="#f0fdfa" />
            <stop offset="100%" stopColor="#a7f3d0" />
          </linearGradient>
          <linearGradient id="optFloor" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#5eead4" />
            <stop offset="100%" stopColor="#0f766e" />
          </linearGradient>
        </defs>
        <rect width="1200" height="560" fill="url(#optWall)" />
        <rect x="0" y="346" width="1200" height="88" fill="#bae6fd" opacity="0.45" />
        <rect x="0" y="434" width="1200" height="126" fill="url(#optFloor)" />
      </svg>

      {/* UNIFIED 1200x560 SINGLE-SURFACE OPTOMETRY CLINIC WORLD */}
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
          <linearGradient id="optBeam" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor={archBanner === "glare_blind" ? "#fb7185" : "#34d399"} stopOpacity="0.72" />
            <stop offset="100%" stopColor={archBanner === "glare_blind" ? "#e11d48" : "#10b981"} stopOpacity="0.06" />
          </linearGradient>
        </defs>

        {/* GROUNDED CLINIC FLOOR LINE (y = 444) & INTAKE / CARE BAY MARKINGS */}
        <rect x="0" y="434" width="1200" height="14" fill="#0d9488" />
        <rect x="822" y="434" width="350" height="14" rx="4" fill="#10b981" stroke="#fef08a" strokeWidth="1.8" />
        <line x1="0" y1="488" x2="810" y2="488" stroke="#ccfbf1" strokeWidth="5" strokeDasharray="24 18" opacity="0.7" />
        <text x="206" y="518" textAnchor="middle" fill="#fef9c3" fontSize="11.5" fontWeight="900" fontFamily="monospace">
          PATIENT INTAKE TRACK (CLICK OR DRAG THROUGH ARCH)
        </text>

        {/* AI EYE SCANNER ARCH (Pillars terminate cleanly behind Training Memory Bank crown) */}
        <rect x="424" y="112" width="48" height="334" rx="10" fill="url(#metalSilver)" stroke="#0f172a" strokeWidth="3.5" />
        <rect x="728" y="112" width="48" height="334" rx="10" fill="url(#metalSilver)" stroke="#0f172a" strokeWidth="3.5" />
        <rect x="412" y="436" width="72" height="18" rx="5" fill="#0f766e" stroke="#0f172a" strokeWidth="2.5" />
        <rect x="716" y="436" width="72" height="18" rx="5" fill="#0f766e" stroke="#0f172a" strokeWidth="2.5" />

        {/* Scanner Arch Status Screen */}
        <rect x="414" y="128" width="372" height="62" rx="14" fill="#0f172a" stroke="#38bdf8" strokeWidth="3.5" />
        <text x="600" y="150" textAnchor="middle" fill="#7dd3fc" fontSize="11" fontWeight="900" fontFamily="monospace">
          AI EYE SCANNER ARCH
        </text>
        <rect
          x="428"
          y="157"
          width="344"
          height="26"
          rx="8"
          fill={
            archBanner === "glare_blind"
              ? "#e11d48"
              : archBanner === "healthy" || archBanner === "strain_caught"
              ? "#059669"
              : "#0c4a6e"
          }
        />
        <text x="600" y="174" textAnchor="middle" fill="#ffffff" fontSize="10.5" fontWeight="900" fontFamily="monospace">
          {archBanner === "glare_blind"
            ? "BLIND SPOT: UNTRAINED ON GLASSES"
            : archBanner === "healthy"
            ? "HEALTHY EYES CONFIRMED!"
            : archBanner === "strain_caught"
            ? "EYE STRAIN CAUGHT!"
            : archBanner === "scanning"
            ? "SCANNING EYE HEALTH..."
            : glassesTrained
            ? "GLASSES GLARE FILTER: ACTIVE"
            : "WALK PATIENTS THROUGH SCANNER"}
        </text>

        {(archBanner === "scanning" ||
          archBanner === "healthy" ||
          archBanner === "strain_caught" ||
          archBanner === "glare_blind") && (
          <polygon points="484,190 716,190 724,442 476,442" fill="url(#optBeam)" />
        )}

        {/* BOLTED TRAINING MEMORY BANK ON ARCH CROWN */}
        <rect x="408" y="20" width="384" height="106" rx="16" fill="#0c4a6e" stroke="#38bdf8" strokeWidth="3.8" />
        <text x="600" y="38" textAnchor="middle" fill="#fef08a" fontSize="10" fontWeight="900" fontFamily="monospace">
          TRAINING MEMORY BANK
        </text>

        {/* Left Bank: NO-GLASSES SCANS: LOADED */}
        <g transform="translate(502, 80)">
          <rect x="-82" y="-34" width="164" height="68" rx="12" fill="#0284c7" stroke="#fef08a" strokeWidth="2.8" />
          <ellipse cx="0" cy="-12" rx="14" ry="8" fill="#ffffff" stroke="#0f172a" strokeWidth="1.8" />
          <circle cx="0" cy="-12" r="4" fill="#0f172a" />
          <text x="0" y="10" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="900" fontFamily="monospace">
            NO-GLASSES SCANS
          </text>
          <text x="0" y="24" textAnchor="middle" fill="#bbf7d0" fontSize="9" fontWeight="900" fontFamily="monospace">
            LOADED
          </text>
        </g>

        {/* Right Bank: WITH-GLASSES SCANS: EMPTY -> LOADED */}
        <g
          transform="translate(698, 80)"
          onClick={loadGlassesScan}
          className={!glassesTrained ? "cursor-pointer" : ""}
        >
          <rect
            x="-82"
            y="-34"
            width="164"
            height="68"
            rx="12"
            fill={glassesTrained ? "#7c3aed" : "#1e1b4b"}
            stroke={glassesTrained ? "#fef08a" : "#fb7185"}
            strokeWidth="3"
          />
          {/* Mini Glasses Icon */}
          <rect x="-18" y="-20" width="15" height="11" rx="3" fill="none" stroke={glassesTrained ? "#fef08a" : "#fda4af"} strokeWidth="2.2" />
          <rect x="3" y="-20" width="15" height="11" rx="3" fill="none" stroke={glassesTrained ? "#fef08a" : "#fda4af"} strokeWidth="2.2" />
          <line x1="-3" y1="-15" x2="3" y2="-15" stroke={glassesTrained ? "#fef08a" : "#fda4af"} strokeWidth="2.2" />
          <text x="0" y="10" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="900" fontFamily="monospace">
            WITH-GLASSES SCANS
          </text>
          <text x="0" y="24" textAnchor="middle" fill={glassesTrained ? "#bbf7d0" : "#fda4af"} fontSize="9" fontWeight="900" fontFamily="monospace">
            {glassesTrained ? "LOADED" : glassesScansLoaded === 0 ? "EMPTY" : `${glassesScansLoaded}/2 LOADED`}
          </text>
          {!glassesTrained && (
            <motion.rect
              x="-82"
              y="-34"
              width="164"
              height="68"
              rx="12"
              fill="none"
              stroke="#fb7185"
              strokeWidth="3"
              animate={{ opacity: [0.25, 1, 0.25] }}
              transition={{ type: "tween", repeat: Infinity, duration: 1.0 }}
            />
          )}
        </g>

        {/* FULL-BODY WALKING PATIENTS GROUNDED STRICTLY AT y = 444 */}
        {patients.map((pt, idx) => {
          const isDragging = dragPatient?.id === pt.id;
          const isWalking = pt.state === "walking_in" || pt.state === "glare_miss" || isDragging;
          const checkedX = 876 + idx * 112;

          const anim = isDragging
            ? { x: dragPatient.x, y: 444 }
            : pt.state === "walking_in"
            ? { x: [pt.homeX, 600], y: 444 }
            : pt.state === "glare_miss"
            ? { x: [600, 812], y: 444 }
            : pt.state === "checked"
            ? { x: checkedX, y: 444 }
            : { x: pt.homeX, y: 444 };

          const checkedLabel = pt.id === "opt_healthy" ? "HEALTHY!" : "STRAIN CAUGHT!";

          return (
            <motion.g
              key={pt.id}
              initial={{ x: pt.homeX, y: 444 }}
              animate={anim}
              transition={
                isDragging
                  ? { duration: 0 }
                  : pt.state === "walking_in" || pt.state === "glare_miss"
                  ? { type: "tween", duration: 0.78, ease: "linear" }
                  : { type: "spring", stiffness: 220, damping: 24 }
              }
              onPointerDown={(e) => {
                if (busy || pt.state === "checked") return;
                e.stopPropagation();
                svgRef.current?.setPointerCapture(e.pointerId);
                movedRef.current = false;
                setDragPatient({ id: pt.id, x: pt.homeX, y: 444 });
              }}
              className={pt.state === "waiting" && !busy ? "cursor-grab active:cursor-grabbing" : "cursor-default"}
            >
              <FullBodyCharacterSVG
                kind={pt.id}
                walking={isWalking}
                glareFlash={pt.state === "glare_miss"}
                scale={0.9}
                badgeText={pt.state === "checked" ? checkedLabel : pt.badgeText}
                subBadgeText={pt.state === "checked" ? undefined : pt.subBadgeText}
                badgeColor={pt.state === "checked" ? "#059669" : pt.badgeColor}
              />
            </motion.g>
          );
        })}

        {/* SIMPLE RIGHT-HAND CLINIC TABLE HOLDING 2 DRAGGABLE GLASSES SCAN SLIDES */}
        <rect x="854" y="508" width="310" height="13" rx="5" fill="url(#metalSilverVert)" stroke="#0f172a" strokeWidth="2.4" />
        <rect x="876" y="521" width="14" height="39" fill="url(#metalSilver)" stroke="#0f172a" strokeWidth="2" />
        <rect x="1128" y="521" width="14" height="39" fill="url(#metalSilver)" stroke="#0f172a" strokeWidth="2" />
        <text x="1009" y="544" textAnchor="middle" fill="#fef08a" fontSize="10.5" fontWeight="900" fontFamily="monospace">
          WITH-GLASSES EYE SCANS
        </text>

        {[0, 1].map((idx) => {
          const used = idx < glassesScansLoaded;
          const restX = 936 + idx * 146;
          const restY = 482;
          const isDrag = dragScan?.idx === idx;
          return (
            <g
              key={`gscan-${idx}`}
              transform={`translate(${isDrag ? dragScan.x : restX}, ${isDrag ? dragScan.y : restY})`}
              onPointerDown={(e) => {
                if (used || busy) return;
                e.stopPropagation();
                svgRef.current?.setPointerCapture(e.pointerId);
                movedRef.current = false;
                setDragScan({ idx, x: restX, y: restY });
              }}
              className={!used ? "cursor-grab active:cursor-grabbing" : "cursor-default"}
              opacity={used ? 0.25 : 1}
            >
              {sawGlareFail && !used && (
                <rect x="-64" y="-30" width="128" height="60" rx="14" fill="none" stroke="#fde047" strokeWidth="4" />
              )}
              <rect x="-58" y="-24" width="116" height="48" rx="11" fill="url(#goldAccent)" stroke="#451a03" strokeWidth="2.6" />
              <rect x="-48" y="-16" width="96" height="32" rx="7" fill="#312e81" />
              <rect x="-15" y="-12" width="12" height="8" rx="2.5" fill="none" stroke="#fef08a" strokeWidth="1.8" />
              <rect x="3" y="-12" width="12" height="8" rx="2.5" fill="none" stroke="#fef08a" strokeWidth="1.8" />
              <line x1="-3" y1="-8" x2="3" y2="-8" stroke="#fef08a" strokeWidth="1.8" />
              <text x="0" y="11" textAnchor="middle" fill="#ffffff" fontSize="8.8" fontWeight="900" fontFamily="monospace">
                GLASSES SCAN
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ============================================================================
   LEVEL 2 (R2) — LIVE MICROBE MICROSCOPE LAB (Rich Lab + Live AI Guess Meter)
   Populated biology lab shelves, glowing flasks, overhead conical lamp beams,
   10-slot wheel, live AI Guess Meter, circular swimming-microbe eyepiece,
   multi-slide Patient Sample Rack, and Germ Specimen Tray.
   ============================================================================ */

function SpikyGermIcon({ r = 12 }: { r?: number }) {
  const s = r / 14;
  return (
    <g transform={`scale(${s})`}>
      <polygon
        points="0,-16 4,-6 14,-10 7,-1 16,5 5,6 9,16 0,8 -9,16 -5,6 -16,5 -7,-1 -14,-10 -4,-6"
        fill="#e11d48"
        stroke="#fef08a"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="0" cy="0" r="4.5" fill="#fda4af" />
    </g>
  );
}

function GoodMicrobeIcon({ r = 11 }: { r?: number }) {
  return (
    <g>
      <circle cx="0" cy="0" r={r} fill="#38bdf8" stroke="#e0f2fe" strokeWidth="1.8" />
      <circle cx={-r * 0.25} cy={-r * 0.2} r={r * 0.35} fill="#0284c7" />
      <circle cx={r * 0.25} cy={r * 0.25} r={r * 0.18} fill="#ffffff" opacity="0.85" />
    </g>
  );
}

function Level2MicrobeLab({
  playSwitch,
  playSuccess,
  playError,
  playBeep,
  speak,
  setStatus,
  onRegisterHint,
  onLevelComplete,
}: WorldLevelProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  // 10-slot wheel: 9 Round Blue Good Microbes + 1 Spiky Red Germ
  const [slots, setSlots] = useState<("good" | "germ")[]>([
    "germ",
    "good",
    "good",
    "good",
    "good",
    "good",
    "good",
    "good",
    "good",
    "good",
  ]);
  const [lensState, setLensState] = useState<
    "empty" | "scanning" | "control_healthy" | "biased" | "ready_rescan" | "found"
  >("empty");
  const [activeSample, setActiveSample] = useState<"control" | "infected" | null>(null);
  const [sawBias, setSawBias] = useState(false);
  const [solved, setSolved] = useState(false);

  const [dragSample, setDragSample] = useState<{ kind: "control" | "infected"; x: number; y: number } | null>(null);
  const [dragGermSlide, setDragGermSlide] = useState<{ idx: number; x: number; y: number } | null>(null);
  const movedRef = useRef(false);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
  }, []);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  const germCount = slots.filter((s) => s === "germ").length;
  const goodCount = 10 - germCount;
  const goodPct = goodCount * 10;
  const germPct = germCount * 10;
  const isBalanced = germCount >= 5;
  const germSlidesUsed = germCount - 1;

  const wheelCx = 256;
  const wheelCy = 246;
  const wheelSlotR = 66;

  const getSlotPos = (idx: number) => {
    const rad = ((idx * 36 - 90) * Math.PI) / 180;
    return {
      x: wheelCx + Math.cos(rad) * wheelSlotR,
      y: wheelCy + Math.sin(rad) * wheelSlotR,
    };
  };

  useEffect(() => {
    onRegisterHint(() => {
      if (!sawBias && !isBalanced) {
        return "Drag the Infected Sample (or Control Slide) onto the Microscope Stage to test the 9:1 wheel first.";
      }
      if (!isBalanced) {
        return "Drag 4 Spiky Germ Slides onto Blue slots on the 10-slot wheel until the AI Guess Meter reaches 50/50.";
      }
      if (!solved) {
        return "Drag the Infected Sample Slide back onto the Microscope Stage to detect the Spiky Red Germs.";
      }
      return "Balanced 5:5 microbe wheel detected the germ infection!";
    });
  }, [isBalanced, onRegisterHint, sawBias, solved]);

  const scanSampleSlide = useCallback(
    (sampleKind: "control" | "infected" = "infected") => {
      if (lensState === "scanning") return;
      playSwitch();
      playBeep(580);
      setActiveSample(sampleKind);
      setLensState("scanning");
      setStatus(
        sampleKind === "control"
          ? "Examining healthy Control Slide under the Microscope Lens..."
          : "Examining patient's Infected Sample under the Microscope Lens...",
        "info"
      );

      schedule(() => {
        if (sampleKind === "control") {
          playSuccess();
          setLensState("control_healthy");
          setStatus(
            "CONTROL SLIDE: Healthy! Only Round Blue Good Microbes visible. Now inspect the Infected Sample.",
            "success"
          );
          speak("Control slide confirmed healthy with only round blue good microbes. Now test the patient's infected sample.");
          return;
        }

        if (!isBalanced) {
          playError();
          setLensState("biased");
          setSawBias(true);
          setStatus(
            `${goodPct}% ROUND BIAS — AI missed the swimming Spiky Red Germs! Balance the 10-slot wheel to 5:5.`,
            "warn"
          );
          speak(
            `Wrong diagnosis! ${goodPct} percent of the microscope wheel is blue good microbes, so the AI missed the spiky red germs swimming under the lens.`
          );
        } else {
          playSuccess();
          setLensState("found");
          if (!solved) {
            setSolved(true);
            setStatus("GERM INFECTION FOUND! Balanced 5:5 microbe training caught the spiky germs.", "success");
            speak("Germ infection found! Balancing the wheel to five good microbes and five spiky germs fixed the bias.");
            onLevelComplete(70);
          }
        }
      }, 660);
    },
    [goodPct, isBalanced, lensState, onLevelComplete, playBeep, playError, playSuccess, playSwitch, schedule, setStatus, solved, speak]
  );

  const swapGoodToGerm = useCallback(
    (preferredIdx?: number) => {
      if (isBalanced || lensState === "scanning") return;
      if (!sawBias) {
        playError();
        setStatus("Test the patient's Infected Sample Slide under the lens first to see the 90% bias!", "warn");
        speak("First drag the Infected Sample Slide under the microscope lens to observe the bias.");
        return;
      }
      let targetIdx = preferredIdx;
      if (targetIdx === undefined || slots[targetIdx] !== "good") {
        targetIdx = slots.findIndex((s) => s === "good");
      }
      if (targetIdx === -1) return;

      playSwitch();
      playBeep(600 + germCount * 42);
      const next = [...slots];
      next[targetIdx] = "germ";
      setSlots(next);

      const nextGerms = next.filter((s) => s === "germ").length;
      const nextRoundPct = (10 - nextGerms) * 10;
      if (nextGerms >= 5) {
        playSuccess();
        setLensState("ready_rescan");
        setStatus("BALANCED 5:5 — DRAG SLIDE TO LENS! Re-scan the Infected Sample to catch the spiky germs.", "success");
        speak("Balanced five to five! Drag the infected sample slide to the lens to catch the spiky germs.");
      } else {
        setLensState("biased");
        setStatus(
          `${nextRoundPct}% ROUND BIAS — swap more Blue slots until the wheel reaches 5:5!`,
          "info"
        );
      }
    },
    [germCount, isBalanced, lensState, playBeep, playError, playSuccess, playSwitch, sawBias, setStatus, slots, speak]
  );

  const onSvgMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const pt = clientToSvg(svgRef.current, e.clientX, e.clientY);
    if (dragSample) {
      movedRef.current = true;
      setDragSample({ ...dragSample, x: pt.x, y: pt.y });
    } else if (dragGermSlide) {
      movedRef.current = true;
      setDragGermSlide({ ...dragGermSlide, x: pt.x, y: pt.y });
    }
  };

  const onSvgUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const pt = clientToSvg(svgRef.current, e.clientX, e.clientY);
    if (dragSample) {
      const wasTap = !movedRef.current;
      const kind = dragSample.kind;
      setDragSample(null);
      if (wasTap || (pt.x > 360 && pt.x < 1120 && pt.y > 90 && pt.y < 420)) {
        scanSampleSlide(kind);
      }
    }
    if (dragGermSlide) {
      const wasTap = !movedRef.current;
      setDragGermSlide(null);
      if (wasTap) {
        swapGoodToGerm();
      } else if (Math.hypot(pt.x - wheelCx, pt.y - wheelCy) < 125) {
        let closest: number | undefined;
        let minD = 999;
        slots.forEach((s, i) => {
          if (s !== "good") return;
          const pos = getSlotPos(i);
          const d = Math.hypot(pt.x - pos.x, pt.y - pos.y);
          if (d < minD) {
            minD = d;
            closest = i;
          }
        });
        swapGoodToGerm(closest);
      }
    }
  };

  return (
    <div className="flex-1 min-h-0 w-full relative overflow-hidden select-none">
      {/* FULL-BLEED VIOLET & AQUA BIOLOGY LAB BACKDROP */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1200 560"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="m2Wall" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ddd6fe" />
            <stop offset="56%" stopColor="#cffafe" />
            <stop offset="100%" stopColor="#67e8f9" />
          </linearGradient>
          <linearGradient id="m2Bench" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#312e81" />
            <stop offset="100%" stopColor="#1e1b4b" />
          </linearGradient>
        </defs>
        <rect width="1200" height="560" fill="url(#m2Wall)" />
        <rect x="0" y="422" width="1200" height="138" fill="url(#m2Bench)" />
      </svg>

      {/* UNIFIED 1200x560 LIVE MICROBE MICROSCOPE LAB */}
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
          <clipPath id="lensClip">
            <circle cx="0" cy="0" r="96" />
          </clipPath>
        </defs>

        {/* WORKBENCH METAL LIP */}
        <rect x="0" y="416" width="1200" height="14" fill="url(#metalSilverVert)" stroke="#1e1b4b" strokeWidth="2.5" />

        {/* GIANT CENTRAL OPTICAL MICROSCOPE (x = 374..584) */}
        <path d="M 378 418 L 410 384 L 558 384 L 588 418 Z" fill="url(#metalSilverVert)" stroke="#1e1b4b" strokeWidth="3.2" />
        <path d="M 432 384 C 392 310, 400 156, 466 130 L 492 130 L 492 264" fill="none" stroke="#1e1b4b" strokeWidth="34" strokeLinecap="round" />
        <path d="M 432 384 C 392 310, 400 156, 466 130 L 492 130 L 492 264" fill="none" stroke="url(#metalSilver)" strokeWidth="24" strokeLinecap="round" />
        <rect x="468" y="54" width="48" height="136" rx="10" fill="url(#metalSilver)" stroke="#1e1b4b" strokeWidth="3" />
        <polygon points="470,190 514,190 504,264 480,264" fill="#312e81" stroke="#38bdf8" strokeWidth="2.6" />

        <g onClick={() => scanSampleSlide("infected")} className="cursor-pointer">
          <rect x="416" y="328" width="152" height="20" rx="6" fill="#0f172a" stroke="#38bdf8" strokeWidth="3" />
          <polygon points="482,264 502,264 536,328 448,328" fill="#38bdf8" opacity="0.3" />
          <text x="492" y="370" textAnchor="middle" fill="#1e1b4b" fontSize="10.5" fontWeight="900" fontFamily="monospace">
            MICROSCOPE STAGE
          </text>
        </g>

        {/* 10-SLOT MICROBE TRAINING WHEEL BOLTED TO MICROSCOPE TURRET */}
        <rect x="256" y="234" width="166" height="24" fill="url(#metalSilverVert)" stroke="#1e1b4b" strokeWidth="2.8" />
        <circle cx={wheelCx} cy={wheelCy} r="94" fill="#1e1b4b" stroke={isBalanced ? "#34d399" : "#a78bfa"} strokeWidth="5" />
        <circle cx={wheelCx} cy={wheelCy} r="35" fill="#312e81" stroke="#fde047" strokeWidth="2.6" />
        <text x={wheelCx} y={wheelCy - 3} textAnchor="middle" fill="#fef08a" fontSize="14" fontWeight="900" fontFamily="monospace">
          {goodCount}:{germCount}
        </text>
        <text x={wheelCx} y={wheelCy + 13} textAnchor="middle" fill={isBalanced ? "#6ee7b7" : "#fda4af"} fontSize="8.5" fontWeight="900" fontFamily="monospace">
          {isBalanced ? "BALANCED" : `${goodPct}% GOOD`}
        </text>

        {slots.map((kind, idx) => {
          const pos = getSlotPos(idx);
          const isGood = kind === "good";
          return (
            <g
              key={`mslot-${idx}`}
              transform={`translate(${pos.x}, ${pos.y})`}
              onClick={() => {
                if (isGood && !isBalanced) swapGoodToGerm(idx);
              }}
              className={isGood && !isBalanced ? "cursor-pointer" : "cursor-default"}
            >
              <circle cx="0" cy="0" r="17" fill={isGood ? "#0c4a6e" : "#4c0519"} stroke={isGood ? "#38bdf8" : "#fb7185"} strokeWidth="2.4" />
              {isGood ? <GoodMicrobeIcon r={9} /> : <SpikyGermIcon r={10.5} />}
            </g>
          );
        })}

        <rect x="160" y="350" width="192" height="24" rx="10" fill="#1e1b4b" stroke="#a78bfa" strokeWidth="2" />
        <text x="256" y="366" textAnchor="middle" fill="#e0e7ff" fontSize="10" fontWeight="900" fontFamily="monospace">
          10-SLOT MICROBE WHEEL
        </text>

        {/* OPTICAL DATA CABLES: MICROSCOPE -> AI GUESS METER -> EYEPIECE */}
        <path d="M 516 232 L 604 232" stroke="#1e1b4b" strokeWidth="18" strokeLinecap="round" />
        <path d="M 516 232 L 604 232" stroke="#38bdf8" strokeWidth="9" strokeLinecap="round" />
        <path d="M 786 232 L 864 232" stroke="#1e1b4b" strokeWidth="18" strokeLinecap="round" />
        <path d="M 786 232 L 864 232" stroke={isBalanced ? "#34d399" : "#fb7185"} strokeWidth="9" strokeLinecap="round" />

        {/* LIVE AI GUESS METER BETWEEN MICROSCOPE & CIRCULAR EYEPIECE */}
        <g transform="translate(695, 244)">
          <rect
            x="-92"
            y="-102"
            width="184"
            height="206"
            rx="18"
            fill="#0f172a"
            stroke={isBalanced ? "#34d399" : "#f59e0b"}
            strokeWidth="3.8"
          />
          <text x="0" y="-80" textAnchor="middle" fill="#fef08a" fontSize="10.5" fontWeight="900" fontFamily="monospace">
            AI GUESS METER
          </text>

          {/* Round Microbe Live Confidence Bar */}
          <g transform="translate(-44, 42)">
            <rect x="-20" y="-98" width="40" height="98" rx="8" fill="#1e293b" stroke="#38bdf8" strokeWidth="2" />
            <motion.rect
              x="-16"
              width="32"
              rx="6"
              fill="#38bdf8"
              animate={{ y: -goodPct * 0.94, height: Math.max(8, goodPct * 0.94) }}
              transition={{ type: "tween", duration: 0.35 }}
            />
            <text x="0" y="-104" textAnchor="middle" fill="#7dd3fc" fontSize="11" fontWeight="900" fontFamily="monospace">
              {goodPct}%
            </text>
            <text x="0" y="16" textAnchor="middle" fill="#e0f2fe" fontSize="8.5" fontWeight="900" fontFamily="monospace">
              ROUND
            </text>
          </g>

          {/* Spiky Germ Live Confidence Bar */}
          <g transform="translate(44, 42)">
            <rect x="-20" y="-98" width="40" height="98" rx="8" fill="#1e293b" stroke="#fb7185" strokeWidth="2" />
            <motion.rect
              x="-16"
              width="32"
              rx="6"
              fill={isBalanced ? "#10b981" : "#fb7185"}
              animate={{ y: -germPct * 0.94, height: Math.max(8, germPct * 0.94) }}
              transition={{ type: "tween", duration: 0.35 }}
            />
            <text x="0" y="-104" textAnchor="middle" fill={isBalanced ? "#6ee7b7" : "#fda4af"} fontSize="11" fontWeight="900" fontFamily="monospace">
              {germPct}%
            </text>
            <text x="0" y="16" textAnchor="middle" fill="#ffe4e6" fontSize="8.5" fontWeight="900" fontFamily="monospace">
              SPIKY
            </text>
          </g>

          {/* Meter Verdict Pill */}
          <rect
            x="-76"
            y="70"
            width="152"
            height="24"
            rx="8"
            fill={isBalanced ? "#059669" : "#be123c"}
          />
          <text x="0" y="86" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="900" fontFamily="monospace">
            {isBalanced ? "50 / 50 BALANCED" : `${goodPct}% BIAS SKEW`}
          </text>
        </g>

        {/* GIANT CIRCULAR MICROSCOPE EYEPIECE WITH LIVE ANIMATED SWIMMING MICROBES */}
        <g transform="translate(974, 224)" onClick={() => scanSampleSlide(activeSample ?? "infected")} className="cursor-pointer">
          <circle
            cx="0"
            cy="0"
            r="112"
            fill="#0f172a"
            stroke={
              lensState === "biased"
                ? "#f97316"
                : lensState === "found" || lensState === "ready_rescan"
                ? "#34d399"
                : "#38bdf8"
            }
            strokeWidth="7"
          />
          <circle cx="0" cy="0" r="96" fill="#1e1b4b" stroke="#67e8f9" strokeOpacity="0.45" strokeWidth="2.5" />

          {lensState === "empty" ? (
            <text x="0" y="5" textAnchor="middle" fill="#67e8f9" fontSize="12.5" fontWeight="900" fontFamily="monospace">
              SLIDE UNDER LENS
            </text>
          ) : (
            <g clipPath="url(#lensClip)">
              <circle cx="0" cy="0" r="94" fill={activeSample === "control" ? "#0c4a6e" : "#3b0764"} opacity="0.58" />
              {/* Swimming Round Blue Good Microbes (Present in both Control & Infected) */}
              <motion.g
                animate={{ x: [-48, -32, -52, -48], y: [-38, -24, -18, -38] }}
                transition={{ type: "tween", repeat: Infinity, duration: 4.2, ease: "easeInOut" }}
              >
                <GoodMicrobeIcon r={13} />
              </motion.g>
              <motion.g
                animate={{ x: [44, 56, 36, 44], y: [36, 22, 46, 36] }}
                transition={{ type: "tween", repeat: Infinity, duration: 3.8, ease: "easeInOut" }}
              >
                <GoodMicrobeIcon r={11} />
              </motion.g>
              <motion.g
                animate={{ x: [-36, -20, -44, -36], y: [46, 34, 52, 46] }}
                transition={{ type: "tween", repeat: Infinity, duration: 4.6, ease: "easeInOut" }}
              >
                <GoodMicrobeIcon r={10} />
              </motion.g>
              {activeSample === "control" && (
                <>
                  <motion.g
                    animate={{ x: [14, -6, 22, 14], y: [-14, 10, -24, -14] }}
                    transition={{ type: "tween", repeat: Infinity, duration: 4.1, ease: "easeInOut" }}
                  >
                    <GoodMicrobeIcon r={14} />
                  </motion.g>
                  <motion.g
                    animate={{ x: [34, 18, 42, 34], y: [-38, -22, -46, -38] }}
                    transition={{ type: "tween", repeat: Infinity, duration: 3.7, ease: "easeInOut" }}
                  >
                    <GoodMicrobeIcon r={12} />
                  </motion.g>
                </>
              )}

              {/* Swimming Spiky Red Germs (ONLY on Patient Infected Sample) */}
              {activeSample !== "control" && (
                <>
                  <motion.g
                    animate={{ x: [-8, 12, -14, -8], y: [-12, 6, -4, -12], rotate: [0, 180, 360] }}
                    transition={{ type: "tween", repeat: Infinity, duration: 4.5, ease: "easeInOut" }}
                  >
                    <SpikyGermIcon r={20} />
                    {lensState === "found" && (
                      <circle cx="0" cy="0" r="26" fill="none" stroke="#34d399" strokeWidth="3.5" />
                    )}
                  </motion.g>
                  <motion.g
                    animate={{ x: [36, 24, 46, 36], y: [-36, -20, -42, -36], rotate: [360, 180, 0] }}
                    transition={{ type: "tween", repeat: Infinity, duration: 3.9, ease: "easeInOut" }}
                  >
                    <SpikyGermIcon r={15} />
                    {lensState === "found" && (
                      <circle cx="0" cy="0" r="21" fill="none" stroke="#34d399" strokeWidth="3" />
                    )}
                  </motion.g>
                  <motion.g
                    animate={{ x: [-4, 14, -10, -4], y: [42, 30, 50, 42], rotate: [0, 360] }}
                    transition={{ type: "tween", repeat: Infinity, duration: 5.0, ease: "linear" }}
                  >
                    <SpikyGermIcon r={14} />
                  </motion.g>
                </>
              )}

              {/* Ghostly Blue Bias Ring ONLY while skewed (< 5:5) on Infected Sample */}
              {lensState === "biased" && !isBalanced && activeSample !== "control" && (
                <motion.circle
                  cx="0"
                  cy="0"
                  r="62"
                  fill="#38bdf8"
                  fillOpacity="0.26"
                  stroke="#38bdf8"
                  strokeWidth="4.5"
                  strokeDasharray="10 6"
                  animate={{ scale: [0.95, 1.05, 0.95] }}
                  transition={{ type: "tween", repeat: Infinity, duration: 1.2 }}
                />
              )}
            </g>
          )}

          {/* Engraved Lens Readout Pill — syncs live with every 10-slot wheel swap */}
          <rect
            x="-152"
            y="122"
            width="304"
            height="32"
            rx="12"
            fill={
              lensState === "found" || (isBalanced && (lensState === "ready_rescan" || lensState === "biased"))
                ? "#059669"
                : lensState === "biased"
                ? goodPct >= 90
                  ? "#e11d48"
                  : "#d97706"
                : lensState === "control_healthy"
                ? "#0284c7"
                : "#1e1b4b"
            }
            stroke="#fde047"
            strokeWidth="2.4"
          />
          <text x="0" y="142" textAnchor="middle" fill="#ffffff" fontSize="10.2" fontWeight="900" fontFamily="monospace">
            {lensState === "found"
              ? "GERM INFECTION FOUND!"
              : isBalanced && (lensState === "ready_rescan" || lensState === "biased")
              ? "BALANCED 5:5 — DRAG SLIDE TO LENS"
              : lensState === "biased"
              ? `${goodPct}% ROUND BIAS — RE-SCAN SLIDE`
              : lensState === "control_healthy"
              ? "HEALTHY CONTROL (ALL GOOD)"
              : lensState === "scanning"
              ? "SCANNING MICROBES..."
              : "LIVE PETRI BLOOD VIEW"}
          </text>
        </g>

        {/* LEFT WORKBENCH: BOTH CONTROL SLIDE & INFECTED SAMPLE ARE DRAGGABLE */}
        <text x="242" y="454" textAnchor="middle" fill="#7dd3fc" fontSize="10.5" fontWeight="900" fontFamily="monospace">
          PATIENT SAMPLES (DRAG EITHER SLIDE TO STAGE)
        </text>
        <g
          transform={`translate(${dragSample?.kind === "control" ? dragSample.x : 124}, ${
            dragSample?.kind === "control" ? dragSample.y : 496
          })`}
          onPointerDown={(e) => {
            if (lensState === "scanning") return;
            e.stopPropagation();
            svgRef.current?.setPointerCapture(e.pointerId);
            movedRef.current = false;
            setDragSample({ kind: "control", x: 124, y: 496 });
          }}
          className="cursor-grab active:cursor-grabbing"
        >
          <rect x="-74" y="-27" width="148" height="54" rx="13" fill="url(#glassShine)" stroke="#38bdf8" strokeWidth="3" />
          <g transform="translate(-46, 0)">
            <GoodMicrobeIcon r={12} />
          </g>
          <text x="16" y="-2" textAnchor="middle" fill="#0f172a" fontSize="10" fontWeight="900" fontFamily="monospace">
            CONTROL SLIDE
          </text>
          <text x="16" y="13" textAnchor="middle" fill="#0369a1" fontSize="9" fontWeight="900" fontFamily="monospace">
            HEALTHY REF
          </text>
        </g>

        <g
          transform={`translate(${dragSample?.kind === "infected" ? dragSample.x : 344}, ${
            dragSample?.kind === "infected" ? dragSample.y : 496
          })`}
          onPointerDown={(e) => {
            if (lensState === "scanning") return;
            e.stopPropagation();
            svgRef.current?.setPointerCapture(e.pointerId);
            movedRef.current = false;
            setDragSample({ kind: "infected", x: 344, y: 496 });
          }}
          className="cursor-grab active:cursor-grabbing"
        >
          {isBalanced && !solved && (
            <rect x="-92" y="-34" width="184" height="68" rx="16" fill="none" stroke="#fde047" strokeWidth="4" />
          )}
          <rect x="-86" y="-27" width="172" height="54" rx="13" fill="url(#glassShine)" stroke="#fb7185" strokeWidth="3.2" />
          <g transform="translate(-52, 0)">
            <SpikyGermIcon r={14} />
          </g>
          <text x="18" y="-2" textAnchor="middle" fill="#0f172a" fontSize="10.8" fontWeight="900" fontFamily="monospace">
            INFECTED SAMPLE
          </text>
          <text x="18" y="13" textAnchor="middle" fill="#be123c" fontSize="9.5" fontWeight="900" fontFamily="monospace">
            DRAG TO LENS
          </text>
        </g>

        {/* RIGHT WORKBENCH: 4 DRAGGABLE SPIKY GERM SLIDES DIRECTLY ON SURFACE */}
        <text x="860" y="454" textAnchor="middle" fill="#fef08a" fontSize="10.5" fontWeight="900" fontFamily="monospace">
          SPIKY GERM SLIDES (DRAG ONTO BLUE WHEEL SLOTS)
        </text>
        {[0, 1, 2, 3].map((idx) => {
          const used = idx < germSlidesUsed;
          const restX = 656 + idx * 136;
          const restY = 500;
          const isDrag = dragGermSlide?.idx === idx;
          return (
            <g
              key={`germ-slide-${idx}`}
              transform={`translate(${isDrag ? dragGermSlide.x : restX}, ${isDrag ? dragGermSlide.y : restY})`}
              onPointerDown={(e) => {
                if (used || lensState === "scanning") return;
                e.stopPropagation();
                svgRef.current?.setPointerCapture(e.pointerId);
                movedRef.current = false;
                setDragGermSlide({ idx, x: restX, y: restY });
              }}
              className={!used ? "cursor-grab active:cursor-grabbing" : "cursor-default"}
              opacity={used ? 0.25 : 1}
            >
              {sawBias && !used && (
                <circle cx="0" cy="0" r="34" fill="none" stroke="#fde047" strokeWidth="3.5" />
              )}
              <circle cx="0" cy="0" r="27" fill="#4c0519" stroke="#fb7185" strokeWidth="3" />
              <SpikyGermIcon r={15} />
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ============================================================================
   LEVEL 3 (R3) — DUAL-CLINIC X-RAY SCANNER (Split Tele-Health Diagnostic Bay)
   Rich split-environment bay: Rural Clinic intake arch + wall heart/lung
   monitor on left, ceiling cable trays, overhead Training X-Ray Lightbox,
   full-height X-Ray Body Scanner, and large Live Chest X-Ray Console on right.
   ============================================================================ */

type XRayPatientId = "rural_healthy" | "city_spot";

function ChestXRayIllustration({
  hasDustShadows,
  hasLungSpot,
  falseAlarm,
  spotFlagged,
}: {
  hasDustShadows: boolean;
  hasLungSpot: boolean;
  falseAlarm: boolean;
  spotFlagged: boolean;
}) {
  return (
    <g>
      {/* Faint Portable-Scanner Dust Shadows on Rural X-Ray Corners */}
      {hasDustShadows && (
        <g opacity="0.46">
          <ellipse cx="-52" cy="-34" rx="22" ry="14" fill="#94a3b8" />
          <ellipse cx="48" cy="30" rx="26" ry="16" fill="#94a3b8" />
          <ellipse cx="-44" cy="40" rx="18" ry="10" fill="#cbd5e1" />
        </g>
      )}
      {/* Spine Column */}
      <rect x="-5" y="-56" width="10" height="112" rx="4" fill="#bae6fd" opacity="0.88" />
      {/* Left & Right Lungs Silhouette */}
      <path d="M -10 -46 C -42 -42, -52 12, -46 46 C -34 52, -16 44, -10 38 Z" fill="#0c4a6e" stroke="#7dd3fc" strokeWidth="2.4" />
      <path d="M 10 -46 C 42 -42, 52 12, 46 46 C 34 52, 16 44, 10 38 Z" fill="#0c4a6e" stroke="#7dd3fc" strokeWidth="2.4" />
      {/* Ribcage Arches */}
      {[-34, -18, -2, 14, 30].map((ry) => (
        <g key={ry} stroke="#e0f2fe" strokeWidth="3.2" strokeLinecap="round" fill="none" opacity="0.72">
          <path d={`M -6 ${ry} Q -28 ${ry - 4} -44 ${ry + 6}`} />
          <path d={`M 6 ${ry} Q 28 ${ry - 4} 44 ${ry + 6}`} />
        </g>
      ))}
      {/* Real Lung Spot on City Patient */}
      {hasLungSpot && (
        <g transform="translate(26, 6)">
          <circle cx="0" cy="0" r="12" fill="#f97316" opacity="0.9" />
          {spotFlagged && (
            <circle cx="0" cy="0" r="18" fill="none" stroke="#fde047" strokeWidth="3.2" />
          )}
        </g>
      )}
      {/* False Alarm Reticle Mistaking Harmless Rural Dust Shadow */}
      {falseAlarm && (
        <g transform="translate(48, 30)">
          <motion.g
            animate={{ scale: [0.92, 1.12, 0.92] }}
            transition={{ type: "tween", repeat: Infinity, duration: 0.9 }}
          >
            <circle cx="0" cy="0" r="20" fill="none" stroke="#fb7185" strokeWidth="3.5" strokeDasharray="6 4" />
          </motion.g>
        </g>
      )}
    </g>
  );
}

function Level3XRayScanner({
  playSwitch,
  playSuccess,
  playError,
  playBeep,
  speak,
  setStatus,
  onRegisterHint,
  onLevelComplete,
}: WorldLevelProps) {
  const svgRef = useRef<SVGSVGElement | null>(null);
  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const [ruralXraysLoaded, setRuralXraysLoaded] = useState(0); // 0..2 Rural Healthy X-rays in Lightbox
  const [activeScan, setActiveScan] = useState<XRayPatientId | null>(null);
  const [patientStates, setPatientStates] = useState<
    Record<XRayPatientId, "waiting" | "walking_in" | "false_alarm_bounce" | "checked">
  >({
    rural_healthy: "waiting",
    city_spot: "waiting",
  });
  const [busy, setBusy] = useState(false);
  const [screenOutcome, setScreenOutcome] = useState<"idle" | "scanning" | "false_alarm" | "healthy_ok" | "spot_caught">("idle");
  const [sawFalseAlarm, setSawFalseAlarm] = useState(false);
  const [passedRural, setPassedRural] = useState(false);
  const [passedCity, setPassedCity] = useState(false);
  const [solved, setSolved] = useState(false);

  const [dragPatient, setDragPatient] = useState<{ id: XRayPatientId; x: number; y: number } | null>(null);
  const [dragXray, setDragXray] = useState<{ idx: number; x: number; y: number } | null>(null);
  const movedRef = useRef(false);

  const schedule = useCallback((fn: () => void, ms: number) => {
    const t = setTimeout(fn, ms);
    timersRef.current.push(t);
  }, []);

  useEffect(() => {
    return () => {
      timersRef.current.forEach((t) => clearTimeout(t));
    };
  }, []);

  const ruralTrained = ruralXraysLoaded >= 2;
  const anyWalking =
    patientStates.rural_healthy === "walking_in" ||
    patientStates.city_spot === "walking_in";

  useEffect(() => {
    onRegisterHint(() => {
      if (!sawFalseAlarm && !ruralTrained) {
        return "Walk the Rural Patient (Healthy) through the X-Ray Body Scanner to see how portable-scanner shadows confuse the AI.";
      }
      if (!ruralTrained) {
        return "Drag both Rural Healthy X-Ray slides from the lower dock into the empty slots on the crown Training X-Ray Lightbox.";
      }
      if (!passedRural || !passedCity) {
        return "Walk any remaining waiting patient through the X-Ray Scanner to finish.";
      }
      return "Shadow-aware X-ray scanner verified both patients accurately!";
    });
  }, [onRegisterHint, passedCity, passedRural, ruralTrained, sawFalseAlarm]);

  const walkThroughXRay = useCallback(
    (pid: XRayPatientId) => {
      if (busy || patientStates[pid] === "checked") return;
      setBusy(true);
      playSwitch();
      playBeep(560);
      setActiveScan(pid);
      setScreenOutcome("scanning");
      setPatientStates((prev) => ({ ...prev, [pid]: "walking_in" }));
      setStatus("Capturing chest X-ray as patient walks through the scanner...", "info");

      schedule(() => {
        if (pid === "rural_healthy") {
          if (!ruralTrained) {
            playError();
            setScreenOutcome("false_alarm");
            setSawFalseAlarm(true);
            setPatientStates((prev) => ({ ...prev, rural_healthy: "false_alarm_bounce" }));
            setStatus("LUNG ALERT! (PORTABLE X-RAY SHADOW) — Load Rural Healthy X-Ray slides onto the Lightbox!", "warn");
            speak(
              "False lung alert! Faint portable X-ray shadows confused the AI because its lightbox only had city hospital X-rays."
            );
            schedule(() => {
              setPatientStates((prev) => ({ ...prev, rural_healthy: "waiting" }));
              setBusy(false);
            }, 950);
          } else {
            playSuccess();
            setScreenOutcome("healthy_ok");
            setPassedRural(true);
            setPatientStates((prev) => ({ ...prev, rural_healthy: "checked" }));
            if (passedCity && !solved) {
              setSolved(true);
              setStatus("Rural Patient cleared healthy & City Lung Spot caught accurately!", "success");
              speak("Fantastic! Congrats! You have completed AI in Disease Prediction.");
              onLevelComplete(100);
            } else {
              setStatus("HEALTHY LUNGS confirmed! Now walk City Patient (Lung Spot) through the scanner.", "success");
              speak("Healthy lungs confirmed! Now walk the city patient through the scanner to catch the real lung spot.");
            }
            setBusy(false);
          }
        } else {
          playSuccess();
          setScreenOutcome("spot_caught");
          setPassedCity(true);
          setPatientStates((prev) => ({ ...prev, city_spot: "checked" }));
          if (passedRural && !solved) {
            setSolved(true);
            setStatus("Rural Patient cleared healthy & City Lung Spot caught accurately!", "success");
            speak("Fantastic! Congrats! You have completed AI in Disease Prediction.");
            onLevelComplete(100);
          } else if (ruralTrained) {
            setStatus("LUNG SPOT CAUGHT! Now walk Rural Patient (Healthy) through the scanner.", "success");
          } else {
            setStatus("LUNG SPOT CAUGHT — now test Rural Patient (Healthy) through the scanner!", "success");
          }
          setBusy(false);
        }
      }, 820);
    },
    [busy, onLevelComplete, passedCity, passedRural, patientStates, playBeep, playError, playSuccess, playSwitch, ruralTrained, schedule, setStatus, solved, speak]
  );

  const loadRuralXray = useCallback(() => {
    if (ruralXraysLoaded >= 2 || busy) return;
    if (!sawFalseAlarm) {
      playError();
      setStatus("Walk Rural Patient (Healthy) through the X-Ray Scanner first to see the portable-shadow false alarm!", "warn");
      speak("First walk the healthy rural patient through the X-Ray scanner to see why the AI gets confused.");
      return;
    }
    playSwitch();
    playBeep(660 + ruralXraysLoaded * 90);
    const next = ruralXraysLoaded + 1;
    setRuralXraysLoaded(next);
    if (next >= 2) {
      playSuccess();
      setScreenOutcome("idle");
      setStatus(
        passedCity
          ? "Rural Healthy X-Rays loaded! Now walk Rural Patient (Healthy) through the scanner."
          : "Rural Healthy X-Rays loaded! Walk both patients through the scanner.",
        "success"
      );
      speak("Rural healthy X-rays mounted on the lightbox! Now walk the rural patient through the X-Ray scanner.");
    } else {
      setStatus("1 Rural Healthy X-Ray mounted — drag the second slide onto the Lightbox.", "info");
    }
  }, [busy, passedCity, playBeep, playError, playSuccess, playSwitch, ruralXraysLoaded, sawFalseAlarm, setStatus, speak]);

  const onSvgMove = (e: React.PointerEvent<SVGSVGElement>) => {
    const pt = clientToSvg(svgRef.current, e.clientX, e.clientY);
    if (dragPatient) {
      movedRef.current = true;
      setDragPatient({ id: dragPatient.id, x: Math.max(70, Math.min(680, pt.x)), y: 444 });
    } else if (dragXray) {
      movedRef.current = true;
      setDragXray({ ...dragXray, x: pt.x, y: pt.y });
    }
  };

  const onSvgUp = (e: React.PointerEvent<SVGSVGElement>) => {
    const pt = clientToSvg(svgRef.current, e.clientX, e.clientY);
    if (dragPatient) {
      const wasTap = !movedRef.current;
      const pid = dragPatient.id;
      setDragPatient(null);
      if (wasTap || pt.x > 340) {
        walkThroughXRay(pid);
      }
    }
    if (dragXray) {
      const wasTap = !movedRef.current;
      setDragXray(null);
      if (wasTap || (pt.x > 340 && pt.x < 780 && pt.y > 10 && pt.y < 165)) {
        loadRuralXray();
      }
    }
  };

  return (
    <div className="flex-1 min-h-0 w-full relative overflow-hidden select-none">
      {/* FULL-BLEED SPLIT-ENVIRONMENT TELE-HEALTH DIAGNOSTIC BAY BACKDROP */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1200 560"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="x3RuralWall" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#fde68a" />
            <stop offset="60%" stopColor="#fef3c7" />
            <stop offset="100%" stopColor="#fed7aa" />
          </linearGradient>
          <linearGradient id="x3HospWall" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#ccfbf1" />
            <stop offset="56%" stopColor="#99f6e4" />
            <stop offset="100%" stopColor="#5eead4" />
          </linearGradient>
          <linearGradient id="x3Floor" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#0f766e" />
            <stop offset="100%" stopColor="#042f2e" />
          </linearGradient>
        </defs>
        {/* Clean Split Clinic Backdrop */}
        <rect x="0" y="0" width="374" height="436" fill="url(#x3RuralWall)" />
        <rect x="374" y="0" width="826" height="436" fill="url(#x3HospWall)" />
        <rect x="0" y="434" width="1200" height="126" fill="url(#x3Floor)" />
      </svg>

      {/* UNIFIED 1200x560 DIAGNOSTIC X-RAY BAY WORLD */}
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

        {/* GROUNDED FLOOR TRACK (y = 444) & RIGHT CHECKED PATIENTS BAY */}
        <rect x="0" y="432" width="1200" height="14" fill="url(#goldAccent)" stroke="#451a03" strokeWidth="2.4" />
        <rect x="746" y="432" width="414" height="14" rx="4" fill="#10b981" stroke="#fef08a" strokeWidth="1.8" />
        <line x1="0" y1="488" x2="720" y2="488" stroke="#99f6e4" strokeWidth="4.5" strokeDasharray="20 16" opacity="0.65" />
        <text x="200" y="520" textAnchor="middle" fill="#fef9c3" fontSize="11" fontWeight="900" fontFamily="monospace">
          WALK PATIENTS THROUGH X-RAY SCANNER
        </text>

        {/* UNIFIED X-RAY BODY SCANNER ARCH + CROWN-MOUNTED TRAINING LIGHTBOX */}
        <rect x="398" y="176" width="44" height="266" rx="10" fill="url(#metalSilver)" stroke="#0f172a" strokeWidth="3.5" />
        <rect x="626" y="176" width="44" height="266" rx="10" fill="url(#metalSilver)" stroke="#0f172a" strokeWidth="3.5" />
        {anyWalking && (
          <rect x="446" y="182" width="176" height="258" fill="#2dd4bf" opacity="0.34" />
        )}

        {/* Single Unified Arch Crown Chassis (Lightbox + Scanner Header as One Piece) */}
        <rect x="368" y="24" width="332" height="158" rx="18" fill="#0f172a" stroke="#f59e0b" strokeWidth="3.8" />
        <text x="534" y="44" textAnchor="middle" fill="#fde047" fontSize="10.5" fontWeight="900" fontFamily="monospace">
          TRAINING X-RAY LIGHTBOX
        </text>
        {[
          { label: "CITY 1", x: 414, loaded: true, rural: false },
          { label: "CITY 2", x: 494, loaded: true, rural: false },
          { label: "RURAL 1", x: 574, loaded: ruralXraysLoaded >= 1, rural: true },
          { label: "RURAL 2", x: 654, loaded: ruralXraysLoaded >= 2, rural: true },
        ].map((slot) => (
          <g
            key={slot.label}
            transform={`translate(${slot.x}, 92)`}
            onClick={slot.rural && !slot.loaded ? loadRuralXray : undefined}
            className={slot.rural && !slot.loaded ? "cursor-pointer" : ""}
          >
            <rect
              x="-34"
              y="-36"
              width="68"
              height="72"
              rx="10"
              fill={slot.loaded ? "#0c4a6e" : "#1e1b4b"}
              stroke={slot.loaded ? "#38bdf8" : "#fb7185"}
              strokeWidth="2.4"
            />
            {slot.loaded ? (
              <g transform="scale(0.36)">
                <ChestXRayIllustration
                  hasDustShadows={slot.rural}
                  hasLungSpot={false}
                  falseAlarm={false}
                  spotFlagged={false}
                />
              </g>
            ) : (
              <text x="0" y="4" textAnchor="middle" fill="#fda4af" fontSize="9" fontWeight="900" fontFamily="monospace">
                EMPTY
              </text>
            )}
            <text x="0" y="30" textAnchor="middle" fill="#fef08a" fontSize="8" fontWeight="900" fontFamily="monospace">
              {slot.label}
            </text>
          </g>
        ))}

        {/* Flush Integrated Scanner Header Bar */}
        <path
          d="M 372 140 L 696 140 L 696 168 Q 696 178 686 178 L 382 178 Q 372 178 372 168 Z"
          fill="#0f766e"
          stroke="#fde047"
          strokeWidth="2.2"
        />
        <text x="534" y="164" textAnchor="middle" fill="#fef9c3" fontSize="11.5" fontWeight="900" fontFamily="monospace">
          X-RAY BODY SCANNER
        </text>

        {/* Heavy Cable Linking X-Ray Scanner -> Live Chest X-Ray Screen */}
        <path d="M 698 148 L 770 148" stroke="#0f172a" strokeWidth="18" strokeLinecap="round" />
        <path d="M 698 148 L 770 148" stroke="#f59e0b" strokeWidth="9" strokeLinecap="round" />

        {/* UPPER RIGHT: SINGLE CLEAN LIVE CHEST X-RAY DISPLAY SCREEN (Clears Checked Bay below) */}
        <rect
          x="768"
          y="18"
          width="400"
          height="240"
          rx="20"
          fill="#020617"
          stroke={
            screenOutcome === "false_alarm"
              ? "#fb7185"
              : screenOutcome === "healthy_ok" || screenOutcome === "spot_caught"
              ? "#34d399"
              : "#38bdf8"
          }
          strokeWidth="4.5"
        />
        <text x="790" y="44" textAnchor="start" fill="#7dd3fc" fontSize="11.5" fontWeight="900" fontFamily="monospace">
          LIVE CHEST X-RAY
        </text>
        <g transform="translate(1078, 40)">
          <circle cx="-64" cy="0" r="5.5" fill={ruralTrained ? "#10b981" : "#fb7185"} />
          <text x="-52" y="4" textAnchor="start" fill={ruralTrained ? "#6ee7b7" : "#fda4af"} fontSize="9.8" fontWeight="900" fontFamily="monospace">
            SHADOW FILTER: {ruralTrained ? "ON" : "OFF"}
          </text>
        </g>
        <line x1="786" y1="54" x2="1150" y2="54" stroke="#1e293b" strokeWidth="2" />

        {/* Chest X-Ray Ribcage View Directly on Screen */}
        <g transform="translate(968, 134)">
          {activeScan ? (
            <g transform="scale(0.98)">
              <ChestXRayIllustration
                hasDustShadows={activeScan === "rural_healthy"}
                hasLungSpot={activeScan === "city_spot"}
                falseAlarm={screenOutcome === "false_alarm"}
                spotFlagged={screenOutcome === "spot_caught"}
              />
            </g>
          ) : (
            <text x="0" y="5" textAnchor="middle" fill="#67e8f9" fontSize="12" fontWeight="900" fontFamily="monospace">
              WALK PATIENT THROUGH ARCH
            </text>
          )}
        </g>

        {/* Bottom Verdict Banner */}
        <rect
          x="786"
          y="212"
          width="364"
          height="32"
          rx="9"
          fill={
            screenOutcome === "false_alarm"
              ? "#e11d48"
              : screenOutcome === "healthy_ok"
              ? "#059669"
              : screenOutcome === "spot_caught"
              ? "#d97706"
              : "#0c4a6e"
          }
          stroke="#fde047"
          strokeWidth="2"
        />
        <text x="968" y="232" textAnchor="middle" fill="#ffffff" fontSize="10.5" fontWeight="900" fontFamily="monospace">
          {screenOutcome === "false_alarm"
            ? "LUNG ALERT! (PORTABLE X-RAY SHADOW)"
            : screenOutcome === "healthy_ok"
            ? "HEALTHY LUNGS — SHADOW IGNORED!"
            : screenOutcome === "spot_caught"
            ? "LUNG SPOT CAUGHT ACCURATELY!"
            : screenOutcome === "scanning"
            ? "CAPTURING CHEST X-RAY..."
            : ruralTrained
            ? "SHADOW FILTER: ACTIVE — RE-SCAN"
            : "CITY HOSPITAL TRAINING ONLY"}
        </text>

        {/* FULL-BODY WALKING PATIENTS (Intake Left -> Checked Bay Right, Grounded at y = 444) */}
        {[
          {
            id: "rural_healthy" as XRayPatientId,
            homeX: 118,
            checkedX: 856,
            badgeText: passedRural ? "HEALTHY OK" : "RURAL PATIENT",
            subBadge: passedRural ? undefined : "HEALTHY",
            badgeColor: passedRural ? "#059669" : "#0f766e",
          },
          {
            id: "city_spot" as XRayPatientId,
            homeX: 254,
            checkedX: 1044,
            badgeText: passedCity ? "SPOT CAUGHT!" : "CITY PATIENT",
            subBadge: passedCity ? undefined : "LUNG SPOT",
            badgeColor: passedCity ? "#d97706" : "#2563eb",
          },
        ].map((pt) => {
          const st = patientStates[pt.id];
          const isDragging = dragPatient?.id === pt.id;
          const isWalking = st === "walking_in" || st === "false_alarm_bounce" || isDragging;
          const anim = isDragging
            ? { x: dragPatient.x, y: 444 }
            : st === "walking_in"
            ? { x: [pt.homeX, 534], y: 444 }
            : st === "false_alarm_bounce"
            ? { x: [534, 490], y: 444 }
            : st === "checked"
            ? { x: pt.checkedX, y: 444 }
            : { x: pt.homeX, y: 444 };

          return (
            <motion.g
              key={pt.id}
              initial={{ x: pt.homeX, y: 444 }}
              animate={anim}
              transition={
                isDragging
                  ? { duration: 0 }
                  : st === "walking_in" || st === "false_alarm_bounce"
                  ? { type: "tween", duration: 0.78, ease: "linear" }
                  : { type: "spring", stiffness: 220, damping: 24 }
              }
              onPointerDown={(e) => {
                if (busy || st === "checked") return;
                e.stopPropagation();
                svgRef.current?.setPointerCapture(e.pointerId);
                movedRef.current = false;
                setDragPatient({ id: pt.id, x: pt.homeX, y: 444 });
              }}
              className={!busy && st === "waiting" ? "cursor-grab active:cursor-grabbing" : "cursor-default"}
            >
              <FullBodyCharacterSVG
                kind={pt.id}
                walking={isWalking}
                scale={0.86}
                badgeText={pt.badgeText}
                subBadgeText={pt.subBadge}
                badgeColor={pt.badgeColor}
              />
            </motion.g>
          );
        })}

        {/* LOWER RIGHT: 2 DRAGGABLE RURAL HEALTHY SLIDES DIRECTLY ON SURFACE (Foreground z-order) */}
        <text x="968" y="472" textAnchor="middle" fill="#fef08a" fontSize="10.5" fontWeight="900" fontFamily="monospace">
          RURAL HEALTHY X-RAY SLIDES (DRAG TO LIGHTBOX)
        </text>
        {[0, 1].map((idx) => {
          const used = idx < ruralXraysLoaded;
          const restX = 876 + idx * 184;
          const restY = 512;
          const isDrag = dragXray?.idx === idx;
          return (
            <g
              key={`rx-${idx}`}
              transform={`translate(${isDrag ? dragXray.x : restX}, ${isDrag ? dragXray.y : restY})`}
              onPointerDown={(e) => {
                if (used || busy) return;
                e.stopPropagation();
                svgRef.current?.setPointerCapture(e.pointerId);
                movedRef.current = false;
                setDragXray({ idx, x: restX, y: restY });
              }}
              className={!used ? "cursor-grab active:cursor-grabbing" : "cursor-default"}
              opacity={used ? 0.25 : 1}
            >
              {sawFalseAlarm && !used && (
                <rect x="-78" y="-30" width="156" height="60" rx="15" fill="none" stroke="#fde047" strokeWidth="4" />
              )}
              <rect x="-70" y="-24" width="140" height="48" rx="11" fill="#0c4a6e" stroke="#fde047" strokeWidth="2.8" />
              <text x="0" y="-2" textAnchor="middle" fill="#ffffff" fontSize="10.2" fontWeight="900" fontFamily="monospace">
                RURAL HEALTHY
              </text>
              <text x="0" y="13" textAnchor="middle" fill="#fde047" fontSize="9.2" fontWeight="900" fontFamily="monospace">
                X-RAY SLIDE
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ============================================================================
   MAIN ORCHESTRATOR: AI IN DISEASE PREDICTION
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
    title: "Eye Health Scanner",
    goalLine: "Goal: Train the AI Eye Scanner on With-Glasses scans so Patient C's eye strain is caught.",
    introVoice:
      "Eye Health Scanner. Walk Patient A, Patient B, and Patient C wearing glasses through the scanner arch to discover why glasses glare causes a blind spot.",
    beamClass: "from-sky-900 via-teal-900 to-sky-900 border-cyan-300",
    bgClass: "bg-sky-100",
  },
  {
    index: 1,
    code: "R2",
    title: "Live Microbe Microscope Lab",
    goalLine: "Goal: Balance the 10-slot wheel and AI Guess Meter to catch the swimming Spiky Red Germs.",
    introVoice:
      "Live Microbe Microscope Lab. Slide the Infected Sample Slide under the microscope lens to watch the AI Guess Meter and fix the ninety percent bias.",
    beamClass: "from-violet-950 via-indigo-900 to-cyan-900 border-violet-300",
    bgClass: "bg-violet-100",
  },
  {
    index: 2,
    code: "R3",
    title: "Dual-Clinic X-Ray Scanner",
    goalLine: "Goal: Train the X-ray scanner on rural portable shadows so healthy lungs pass while lung spots alert.",
    introVoice:
      "Dual-Clinic X-Ray Scanner. Walk the healthy Rural Patient through the X-Ray scanner to see how portable shadows confuse the AI, then mount Rural Healthy X-Ray slides on the lightbox.",
    beamClass: "from-teal-950 via-emerald-900 to-teal-950 border-amber-300",
    bgClass: "bg-teal-100",
  },
];

export default function AiDataBiasLab() {
  const { playClick, playSwitch, playSuccess, playError, playBeep } = useLabAudio();
  const { reportComplete, getTimeTaken } = useLMSBridge("ai-data-bias");
  const { speak, stop: stopVoice, setMuted: setVoiceMuted } = useVoiceAssistant({ lang: "en-IN" });

  const [levelIdx, setLevelIdx] = useState<0 | 1 | 2>(0);
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
            labId: "ai-data-bias",
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
              colors: ["#38bdf8", "#a78bfa", "#10b981", "#fbbf24", "#fb7185"],
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

  const sharedLevelProps: WorldLevelProps = {
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
      labId="ai-data-bias"
      title="AI in Disease Prediction"
      module="Artificial Intelligence"
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
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-300 border border-sky-950 shrink-0" />
            <span className="font-mono font-extrabold text-[11px] sm:text-xs text-sky-50 uppercase tracking-wider truncate">
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
                      : "bg-black/25 border-cyan-200/35 text-sky-100/80"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isPast ? "bg-emerald-100" : isCurrent ? "bg-amber-950 animate-pulse" : "bg-cyan-200/40"
                    }`}
                  />
                  <span>{lvl.code}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* ACTIVE CONTAINERLESS FULL-BLEED 2D WORLD */}
        <div className="flex-1 min-h-0 w-full flex flex-col overflow-hidden relative">
          {levelIdx === 0 && <Level1EyeClinic key={`v1-${resetTick}`} {...sharedLevelProps} />}
          {levelIdx === 1 && <Level2MicrobeLab key={`v2-${resetTick}`} {...sharedLevelProps} />}
          {levelIdx === 2 && <Level3XRayScanner key={`v3-${resetTick}`} {...sharedLevelProps} />}
        </div>

        {/* FLUSH BOTTOM STATUS STRIP */}
        <div
          className={`relative z-30 shrink-0 w-full px-3 sm:px-5 py-1.5 border-t-2 flex items-center justify-between gap-2 shadow-inner transition-colors ${
            status.tone === "warn"
              ? "bg-gradient-to-r from-rose-900 via-rose-800 to-rose-900 border-amber-300 text-amber-50"
              : status.tone === "success"
              ? "bg-gradient-to-r from-emerald-900 via-emerald-800 to-emerald-900 border-amber-300 text-emerald-50"
              : "bg-gradient-to-r from-sky-950 via-cyan-950 to-sky-950 border-cyan-400 text-sky-100"
          }`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {status.tone === "warn" ? (
              <AlertTriangle className="w-4 h-4 text-amber-300 shrink-0" />
            ) : status.tone === "success" ? (
              <Check className="w-4 h-4 text-emerald-300 shrink-0 stroke-[3]" />
            ) : (
              <Lightbulb className="w-4 h-4 text-cyan-300 shrink-0" />
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
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-sky-950/55 backdrop-blur-xs"
            >
              <motion.div
                initial={{ scale: 0.86, y: 16, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
                className="relative w-full max-w-md rounded-3xl bg-gradient-to-b from-sky-100 via-cyan-50 to-emerald-100 border-4 border-cyan-400 shadow-2xl p-6 sm:p-8 text-center"
              >
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-sky-500 to-emerald-500 border-4 border-cyan-200 shadow-md flex items-center justify-center">
                  <Award className="w-9 h-9 text-white" />
                </div>

                <h2 className="font-sans font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight mb-5">
                  Congrats! You have completed AI in Disease Prediction.
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
