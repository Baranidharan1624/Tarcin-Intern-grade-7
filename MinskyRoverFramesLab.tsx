
"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Award,
  RotateCcw,
  HelpCircle,
} from "lucide-react";
import confetti from "canvas-confetti";
import { LabShell } from "@/components/LabShell";
import { useLabAudio } from "@/hooks/useLabAudio";
import { useLMSBridge } from "@/hooks/useLMSBridge";
import { useVoiceAssistant } from "@/hooks/useVoiceAssistant";

// ── Types & Hardware Configuration ──────────────────────────────────
type LevelId = 1 | 2 | 3;
type PowerOption = "DefaultSolar" | "RtgThermal";
type DriveOption = "RubberTires" | "SnowTreads";
type ToolOption = "CargoClaw" | "RotaryDrill";
type SensorOption = "OpticalCam" | "ThermalSonar";
type PartType =
  | "SnowTreads"
  | "RubberTires"
  | "RotaryDrill"
  | "CargoClaw"
  | "RtgThermal"
  | "DefaultSolar"
  | "ThermalSonar"
  | "OpticalCam";

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

interface IceShard {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  rot: number;
  vrot: number;
  size: number;
  opacity: number;
}

interface AmbientSnow {
  id: number;
  x: number;
  y: number;
  r: number;
  speed: number;
  drift: number;
}

export default function MinskyRoverFramesLab() {
  const { playClick, playSuccess, playError, playSwitch } = useLabAudio();
  const { reportComplete, getTimeTaken } = useLMSBridge("minsky-rover-frames");
  const { speak } = useVoiceAssistant({ lang: "en-IN" });

  // ── Mission & Level State ──────────────────────────────────────────
  const [level, setLevel] = useState<LevelId>(1);
  const [score, setScore] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const completed = isCompleted;
  const setCompleted = setIsCompleted;
  const showCompletionModal = isCompleted;
  const [showHintModal, setShowHintModal] = useState<boolean>(false);

  // ── Frame Inheritance Tethers ──────────────────────────────────────
  // In Level 1: Pull 3 cables from overhead Base Frame.
  // In Levels 2 & 3: Inherited baseline traits stay locked in.
  const [tetherPower, setTetherPower] = useState<boolean>(false);
  const [tetherGps, setTetherGps] = useState<boolean>(false);
  const [tetherHull, setTetherHull] = useState<boolean>(false);

  // ── Rover Slot Overrides ───────────────────────────────────────────
  const [powerSlot, setPowerSlot] = useState<PowerOption>("DefaultSolar");
  const [driveSlot, setDriveSlot] = useState<DriveOption>("RubberTires");
  const [toolSlot, setToolSlot] = useState<ToolOption>("CargoClaw");
  const [sensorSlot, setSensorSlot] = useState<SensorOption>("OpticalCam");

  // ── Drag & Drop State ──────────────────────────────────────────────
  const [activeDragTether, setActiveDragTether] = useState<"power" | "gps" | "hull" | null>(null);
  const [tetherCursor, setTetherCursor] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const [activeDragPart, setActiveDragPart] = useState<PartType | null>(null);
  const [partCursor, setPartCursor] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // ── Simulation & Live Test Track State ──────────────────────────────
  const [isSimulating, setIsSimulating] = useState<boolean>(false);
  const [simPhase, setSimPhase] = useState<"idle" | "running" | "failed" | "passed">("idle");
  const [roverTrackX, setRoverTrackX] = useState<number>(0); // 0 = at dock, ~680 = target
  const [roverBounceY, setRoverBounceY] = useState<number>(0);
  const [wheelSpinAngle, setWheelSpinAngle] = useState<number>(0);
  const [drillAngle, setDrillAngle] = useState<number>(0);
  const [sonarPulse, setSonarPulse] = useState<number>(0);
  const [treadOffset, setTreadOffset] = useState<number>(0);
  const [anemometerAngle, setAnemometerAngle] = useState<number>(0);
  const [heatAuraPulse, setHeatAuraPulse] = useState<number>(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const [iceShards, setIceShards] = useState<IceShard[]>([]);
  const [iceWallState, setIceWallState] = useState<"intact" | "cracking" | "shattered">("intact");
  const [failureNotice, setFailureNotice] = useState<string | null>(null);
  const [showFrameBreakdown, setShowFrameBreakdown] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>(
    "MISSION 1: Pull 3 inheritance cables from Base Rover Frame to rover ports, then pull Launch Lever."
  );

  // Ambient gentle snowfall (28 gentle particles drifting over the outdoor glacier)
  const [ambientSnow, setAmbientSnow] = useState<AmbientSnow[]>(() =>
    Array.from({ length: 28 }, (_, i) => ({
      id: i + 1,
      x: 580 + (i * 22) % 610,
      y: (i * 19) % 520,
      r: 1.2 + (i % 3) * 0.7,
      speed: 0.35 + (i % 4) * 0.2,
      drift: Math.sin(i) * 0.25,
    }))
  );

  const containerRef = useRef<SVGSVGElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const idCounterRef = useRef<number>(1);

  // ── Spoken Introductions for Scientific & Infrastructure Missions ──
  useEffect(() => {
    if (level === 1) {
      speak(
        "Welcome to Svalbard Rover Station! The Frostbite Ridge Weather Relay is offline and out of power. First, pull down the three inheritance cables from the Base Rover Frame. Then pull the Launch Lever to test on Frostbite Ridge!"
      );
      setStatusMessage(
        "PULL DOWN 3 INHERITANCE CABLES (POWER, GPS, HULL) TO ROVER SOCKETS, THEN LAUNCH."
      );
      setShowFrameBreakdown(false);
    } else if (level === 2) {
      speak(
        "Priority mission! The sub-glacial automated ice core sample rig is blocked behind a four-meter permafrost ice wall in a shaded canyon. Test your solar power and cargo claw to see why overrides are needed!"
      );
      setStatusMessage(
        "MISSION 2: SUB-GLACIAL ICE CORE DRILL SITE. OVERRIDE POWER AND FRONT TOOL SLOTS TO EXTRACT CORE SAMPLES."
      );
      setIceWallState("intact");
      setShowFrameBreakdown(false);
    } else if (level === 3) {
      speak(
        "Blizzard whiteout at Outpost 7 Aurora Observatory! Standard optical cameras cannot see through blowing snow. Specialize your sensor slot with Thermal Sonar to link the observatory!"
      );
      setStatusMessage(
        "MISSION 3: POLAR AURORA OBSERVATORY. OVERRIDE OPTICAL SENSOR WITH THERMAL SONAR TO PENETRATE WHITEOUT."
      );
      setIceWallState("intact");
      setShowFrameBreakdown(false);
    }
  }, [level, speak]);

  // ── Ambient Simulation Loop ────────────────────────────────────────
  useEffect(() => {
    let lastTime = performance.now();

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;

      // Drill rotation
      if (toolSlot === "RotaryDrill") {
        setDrillAngle((prev) => (prev + dt * 900) % 360);
      }

      // Sonar wave expansion
      if (sensorSlot === "ThermalSonar") {
        setSonarPulse((prev) => (prev + dt * 1.6) % 3);
      }

      // Wheel and tread motion during simulation
      if (isSimulating) {
        setWheelSpinAngle((prev) => (prev + dt * 520) % 360);
        setTreadOffset((prev) => (prev + dt * 260) % 32);
      }

      // Payoff animations: Weather Station Anemometer & Heat Aura
      if (simPhase === "passed") {
        if (level === 1) {
          setAnemometerAngle((prev) => (prev + dt * 720) % 360);
        }
        if (level === 2) {
          setHeatAuraPulse((prev) => (prev + dt * 2.5) % 3);
        }
      }

      // Gentle ambient snowfall drift across outdoor glacier (x = 580..1195)
      setAmbientSnow((prev) =>
        prev.map((s) => {
          let ny = s.y + s.speed * dt * 60;
          let nx = s.x - s.drift * dt * 60;
          if (ny > 540) ny = 10;
          if (nx < 580) nx = 1190;
          if (nx > 1195) nx = 585;
          return { ...s, x: nx, y: ny };
        })
      );

      // Update particles
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx * dt * 60,
            y: p.y + p.vy * dt * 60,
            life: p.life - dt,
          }))
          .filter((p) => p.life > 0)
      );

      // Update flying ice shards
      setIceShards((prev) =>
        prev
          .map((s) => ({
            ...s,
            x: s.x + s.vx * dt * 60,
            y: s.y + s.vy * dt * 60 + 0.5 * 9.8 * dt * dt * 60,
            vy: s.vy + 0.14,
            rot: s.rot + s.vrot * dt * 60,
            opacity: s.opacity - dt * 0.45,
          }))
          .filter((s) => s.opacity > 0)
      );

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [toolSlot, sensorSlot, isSimulating, simPhase, level]);

  // ── Add Particle Burst Helper ──────────────────────────────────────
  const spawnParticles = useCallback(
    (x: number, y: number, count: number, colors: string[], speed: number = 3) => {
      const newItems: Particle[] = [];
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2;
        const mag = (Math.random() * 0.8 + 0.2) * speed;
        newItems.push({
          id: ++idCounterRef.current,
          x,
          y,
          vx: Math.cos(angle) * mag,
          vy: Math.sin(angle) * mag,
          color: colors[Math.floor(Math.random() * colors.length)],
          size: Math.random() * 3 + 2,
          life: 0.6 + Math.random() * 0.4,
          maxLife: 1.0,
        });
      }
      setParticles((prev) => [...prev.slice(-60), ...newItems]);
    },
    []
  );

  // ── Spawn Shattered Ice Shards Helper ──────────────────────────────
  const shatterIceWall = useCallback((originX: number, originY: number) => {
    const shards: IceShard[] = [];
    for (let i = 0; i < 16; i++) {
      const angle = (Math.random() * 1.6 - 0.8) * Math.PI;
      const speed = Math.random() * 6 + 3;
      shards.push({
        id: ++idCounterRef.current,
        x: originX + (Math.random() - 0.5) * 20,
        y: originY + (Math.random() - 0.5) * 60,
        vx: Math.cos(angle) * speed + 2,
        vy: Math.sin(angle) * speed - 1.5,
        rot: Math.random() * 360,
        vrot: (Math.random() - 0.5) * 20,
        size: Math.random() * 12 + 6,
        opacity: 1.0,
      });
    }
    setIceShards(shards);
  }, []);

  // ── Accurate SVG Coordinates via CTM ──────────────────────────────
  const getSvgPoint = useCallback((e: React.PointerEvent | PointerEvent) => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const svg = containerRef.current;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX;
    pt.y = e.clientY;
    const ctm = svg.getScreenCTM();
    if (ctm) {
      const transformed = pt.matrixTransform(ctm.inverse());
      return { x: transformed.x, y: transformed.y };
    }
    const rect = svg.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 1200,
      y: ((e.clientY - rect.top) / rect.height) * 560,
    };
  }, []);

  // ── Global Pointer Event Handling for Dragging Tethers and Parts ────
  useEffect(() => {
    if (!activeDragTether && !activeDragPart) return;

    const handlePointerMove = (e: PointerEvent) => {
      if (!containerRef.current) return;
      const pt = getSvgPoint(e);
      if (activeDragTether) setTetherCursor(pt);
      if (activeDragPart) setPartCursor(pt);
    };

    const handlePointerUp = (e: PointerEvent) => {
      const pt = getSvgPoint(e);

      // ── Handle Tether Drop onto Rover Chassis Input Ports ──
      // Power Port target: (245, 252) | GPS Port target: (305, 238) | Hull Port target: (295, 318)
      if (activeDragTether) {
        if (activeDragTether === "power") {
          const hit = Math.hypot(pt.x - 245, pt.y - 252) < 55 || (pt.x >= 190 && pt.x <= 280 && pt.y >= 210 && pt.y <= 290);
          if (hit) {
            playSuccess();
            setTetherPower(true);
            spawnParticles(245, 252, 18, ["#38bdf8", "#0284c7", "#fef08a"]);
            speak("Power Core cable snapped into Rover Power port! Inherited baseline power traits.");
            setStatusMessage("BASE FRAME TRAIT INHERITED: POWER CORE CONNECTED.");
          } else {
            playError();
          }
        } else if (activeDragTether === "gps") {
          const hit = Math.hypot(pt.x - 305, pt.y - 238) < 55 || (pt.x >= 280 && pt.x <= 340 && pt.y >= 200 && pt.y <= 280);
          if (hit) {
            playSuccess();
            setTetherGps(true);
            spawnParticles(305, 238, 18, ["#38bdf8", "#0284c7", "#67e8f9"]);
            speak("GPS Telemetry cable snapped into Rover Nav port! Inherited telemetry traits.");
            setStatusMessage("BASE FRAME TRAIT INHERITED: GPS TELEMETRY CONNECTED.");
          } else {
            playError();
          }
        } else if (activeDragTether === "hull") {
          // Clean lower-center chassis side panel target: (276, 322)
          const hit = Math.hypot(pt.x - 276, pt.y - 322) < 55 || (pt.x >= 230 && pt.x <= 320 && pt.y >= 280 && pt.y <= 360);
          if (hit) {
            playSuccess();
            setTetherHull(true);
            spawnParticles(276, 322, 18, ["#34d399", "#10b981", "#38bdf8"]);
            speak("Hull Armor cable snapped into Rover Chassis port! Inherited armor baseline.");
            setStatusMessage("BASE FRAME TRAIT INHERITED: HULL ARMOR CONNECTED.");
          } else {
            playError();
          }
        }
        setActiveDragTether(null);
      }

      // ── Handle Hardware Part Drop onto Rover Target Sockets ──
      if (activeDragPart) {
        // Wheels / Axles Socket (x: 180..440, y: 305..385)
        const inWheelSocket = pt.x >= 180 && pt.x <= 440 && pt.y >= 305 && pt.y <= 385;
        // Front Tool Socket (Nose, x: 380..470, y: 245..320)
        const inToolSocket = pt.x >= 380 && pt.x <= 470 && pt.y >= 245 && pt.y <= 320;
        // Power Bay Socket (Rear roof, x: 210..285, y: 200..280)
        const inPowerSocket = pt.x >= 210 && pt.x <= 285 && pt.y >= 200 && pt.y <= 280;
        // Sensor Mast Socket (Front roof, x: 320..380, y: 195..265)
        const inSensorSocket = pt.x >= 320 && pt.x <= 380 && pt.y >= 195 && pt.y <= 265;

        if (activeDragPart === "SnowTreads" || activeDragPart === "RubberTires") {
          if (inWheelSocket) {
            playSwitch();
            setDriveSlot(activeDragPart);
            spawnParticles(pt.x, pt.y, 20, ["#10b981", "#34d399", "#f59e0b"]);
            speak(`Overrode wheels slot with ${activeDragPart === "SnowTreads" ? "Heavy Snow Treads" : "Rubber Tires"}!`);
            setStatusMessage(`WHEELS SLOT OVERRIDDEN: ${activeDragPart.toUpperCase()}`);
          } else {
            playError();
          }
        } else if (activeDragPart === "RotaryDrill" || activeDragPart === "CargoClaw") {
          if (inToolSocket) {
            playSwitch();
            setToolSlot(activeDragPart);
            spawnParticles(pt.x, pt.y, 20, ["#0284c7", "#38bdf8", "#facc15"]);
            speak(`Overrode front attachment with ${activeDragPart === "RotaryDrill" ? "Diamond Ice Drill" : "Cargo Claw"}!`);
            setStatusMessage(`TOOL SLOT OVERRIDDEN: ${activeDragPart.toUpperCase()}`);
          } else {
            playError();
          }
        } else if (activeDragPart === "RtgThermal" || activeDragPart === "DefaultSolar") {
          if (inPowerSocket) {
            playSwitch();
            setPowerSlot(activeDragPart);
            spawnParticles(pt.x, pt.y, 20, ["#f59e0b", "#fbbf24", "#10b981"]);
            speak(`Overrode power slot with ${activeDragPart === "RtgThermal" ? "RTG Thermal Generator" : "Solar Panels"}!`);
            setStatusMessage(`POWER SLOT OVERRIDDEN: ${activeDragPart.toUpperCase()}`);
          } else {
            playError();
          }
        } else if (activeDragPart === "ThermalSonar" || activeDragPart === "OpticalCam") {
          if (inSensorSocket) {
            playSwitch();
            setSensorSlot(activeDragPart);
            spawnParticles(pt.x, pt.y, 20, ["#67e8f9", "#38bdf8", "#a855f7"]);
            speak(`Overrode sensor slot with ${activeDragPart === "ThermalSonar" ? "Thermal Sonar Scanner" : "Optical Camera"}!`);
            setStatusMessage(`SENSOR SLOT OVERRIDDEN: ${activeDragPart.toUpperCase()}`);
          } else {
            playError();
          }
        }

        setActiveDragPart(null);
      }
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);

    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
    };
  }, [activeDragTether, activeDragPart, getSvgPoint, playError, playSuccess, playSwitch, spawnParticles, speak]);

  // ── Pulling the Test Track Launch Lever ─────────────────────────────
  const handleLaunchLever = useCallback(() => {
    if (isSimulating) return;

    // Must inherit base traits first
    if (!tetherPower || !tetherGps || !tetherHull) {
      playError();
      speak("Connect all three Base Frame inheritance cables first before launching!");
      setStatusMessage("INHERITANCE MISSING! PULL DOWN POWER, GPS, AND HULL CABLES TO ROVER PORTS.");
      return;
    }

    playClick();
    playSwitch();
    setIsSimulating(true);
    setSimPhase("running");
    setFailureNotice(null);
    setShowFrameBreakdown(false);
    setRoverTrackX(0);

    // ── Execute Level-Specific Test Simulation ──
    if (level === 1) {
      speak("Rover launching onto Frostbite Ridge test incline!");
      setStatusMessage("TESTING: CLIMBING FROSTBITE RIDGE SNOWDRIFT SLOPE...");

      let step = 0;
      const interval = setInterval(() => {
        step += 1;
        setRoverTrackX(step * 18);
        setRoverBounceY(Math.sin(step * 0.9) * 2.5);

        // Failure Point: Step 10 hits icy incline with Rubber Tires
        if (driveSlot === "RubberTires" && step >= 10) {
          clearInterval(interval);
          setSimPhase("failed");
          setIsSimulating(false);
          setFailureNotice("SLIP FAILURE: Smooth rubber tires lose all traction on steep ice! Wheels spinning in place.");
          playError();
          speak("Look! Smooth rubber tires spin furiously kicking snow but slide backward! Override the wheels with Snow Treads!");
          setStatusMessage("TIRE SPINOUT! RUBBER TIRES FAILED ON ICE. DRAG SNOW TREADS FROM WORKBENCH TO WHEELS.");
          setTimeout(() => {
            setRoverTrackX(0);
            setRoverBounceY(0);
          }, 1200);
          return;
        }

        // Success Point: Step 25 reaches Frostbite Ridge weather station with Scientific Payoff
        if (driveSlot === "SnowTreads" && step >= 25) {
          clearInterval(interval);
          setSimPhase("passed");
          setIsSimulating(false);
          setShowFrameBreakdown(true);
          playSuccess();
          confetti({ particleCount: 70, spread: 60, origin: { y: 0.55 } });
          speak("Outstanding! Rover docked at the weather relay, transferred power, and Doppler radar is transmitting live!");
          setStatusMessage("MISSION 1 SUCCESS: WEATHER RELAY ONLINE • DOPPLER RADAR BROADCASTING!");
          setScore(35);

          setTimeout(() => {
            setLevel(2);
            setSimPhase("idle");
            setRoverTrackX(0);
            setFailureNotice(null);
            setShowFrameBreakdown(false);
            setIceWallState("intact");
          }, 3200);
        }
      }, 70);
    } else if (level === 2) {
      speak("Rover entering overcast Glacier Canyon toward the automated ice-core sample rig!");
      setStatusMessage("TESTING: ENTERING SHADED CANYON TOWARD 4-METER GLACIAL ICE WALL...");

      let step = 0;
      const interval = setInterval(() => {
        step += 1;
        setRoverTrackX(step * 18);
        setRoverBounceY(Math.sin(step * 0.9) * 2.5);

        // Failure Point 1: Solar Panel in shaded twilight canyon
        if (powerSlot === "DefaultSolar" && step >= 8) {
          clearInterval(interval);
          setSimPhase("failed");
          setIsSimulating(false);
          setFailureNotice("POWER DEPLETED: Solar panels dropped to 0% in shaded glacier canyon! Rover stalled.");
          playError();
          speak("Solar power failed in the shaded ice canyon! Override the power bay with the RTG Thermal Generator!");
          setStatusMessage("POWER STALL! SOLAR CELLS CANNOT RUN IN SHADOW. DRAG RTG THERMAL CORE TO POWER BAY.");
          setTimeout(() => {
            setRoverTrackX(0);
            setRoverBounceY(0);
          }, 1200);
          return;
        }

        // Failure Point 2: Cargo Claw against solid ice wall
        if (toolSlot === "CargoClaw" && step >= 18) {
          clearInterval(interval);
          setSimPhase("failed");
          setIsSimulating(false);
          setFailureNotice("CLAW BOUNCED: Standard grabber claw shattered against solid 4-meter glacial permafrost!");
          playError();
          spawnParticles(860, 280, 25, ["#38bdf8", "#ffffff", "#f59e0b"], 5);
          speak("The cargo claw bounced right off solid permafrost! Override the front tool with the Rotary Ice Drill!");
          setStatusMessage("TOOL FAILED! CARGO CLAW CANNOT PIERCE SOLID ICE. DRAG ROTARY ICE DRILL TO FRONT TOOL.");
          setTimeout(() => {
            setRoverTrackX(0);
            setRoverBounceY(0);
          }, 1200);
          return;
        }

        // Live Ice-Wall Breaking sequence at step 18
        if (step === 18 && toolSlot === "RotaryDrill") {
          setIceWallState("cracking");
          spawnParticles(860, 280, 20, ["#38bdf8", "#bae6fd", "#ffffff"], 4);
          setTimeout(() => {
            setIceWallState("shattered");
            shatterIceWall(860, 280);
            playSwitch();
          }, 400);
        }

        // Success Point: RTG + Drill + Treads destroys ice wall and extracts ice-core sample!
        if (powerSlot === "RtgThermal" && toolSlot === "RotaryDrill" && driveSlot === "SnowTreads" && step >= 26) {
          clearInterval(interval);
          setSimPhase("passed");
          setIsSimulating(false);
          setShowFrameBreakdown(true);
          playSuccess();
          spawnParticles(1050, 290, 35, ["#38bdf8", "#bae6fd", "#f59e0b"], 6);
          confetti({ particleCount: 85, spread: 65, origin: { y: 0.55 } });
          speak("Victory! Rotary Ice Drill breached permafrost, RTG thermal core energized the rig, and deep ice-core sample is retrieved!");
          setStatusMessage("MISSION 2 SUCCESS: ICE WALL BREACHED • CORE SAMPLE EXTRACTED • CRYO ANALYSIS COMPLETE!");
          setScore(70);

          setTimeout(() => {
            setLevel(3);
            setSimPhase("idle");
            setRoverTrackX(0);
            setFailureNotice(null);
            setShowFrameBreakdown(false);
            setIceWallState("intact");
          }, 3200);
        }
      }, 70);
    } else if (level === 3) {
      speak("Rover launching into North Pole blizzard whiteout toward Outpost 7 Aurora Observatory!");
      setStatusMessage("TESTING: ENTERING HOWLING BLIZZARD WHITEOUT TOWARD OUTPOST 7 OBSERVATORY...");

      let step = 0;
      const interval = setInterval(() => {
        step += 1;
        setRoverTrackX(step * 18);
        setRoverBounceY(Math.sin(step * 0.9) * 2.5);

        // Failure Point: Optical Camera blinded by blowing snow
        if (sensorSlot === "OpticalCam" && step >= 10) {
          clearInterval(interval);
          setSimPhase("failed");
          setIsSimulating(false);
          setFailureNotice("VISION BLINDED: Optical video cameras blinded by blowing snow whiteout! Rover halted at crevasse.");
          playError();
          speak("Whiteout conditions! The optical camera cannot see through blowing snow. Override the sensor with Thermal Sonar!");
          setStatusMessage("ZERO VISIBILITY! OPTICAL CAMERA BLINDED BY SNOW. DRAG THERMAL SONAR TO SENSOR MAST.");
          setTimeout(() => {
            setRoverTrackX(0);
            setRoverBounceY(0);
          }, 1200);
          return;
        }

        // Shatter ice wall along the way at step 18
        if (step === 18 && toolSlot === "RotaryDrill" && iceWallState === "intact") {
          setIceWallState("cracking");
          spawnParticles(860, 280, 20, ["#38bdf8", "#bae6fd", "#ffffff"], 4);
          setTimeout(() => {
            setIceWallState("shattered");
            shatterIceWall(860, 280);
            playSwitch();
          }, 400);
        }

        // Success Point: Sonar scans through whiteout, docks at Outpost 7 Aurora Observatory!
        if (
          sensorSlot === "ThermalSonar" &&
          toolSlot === "RotaryDrill" &&
          driveSlot === "SnowTreads" &&
          powerSlot === "RtgThermal" &&
          step >= 26
        ) {
          clearInterval(interval);
          setSimPhase("passed");
          setIsSimulating(false);
          setShowFrameBreakdown(true);
          playSuccess();
          confetti({ particleCount: 130, spread: 85, origin: { y: 0.5 } });
          setScore(100);
          speak(
            "Sensational! Thermal Sonar penetrated the blizzard, Outpost 7 Aurora Observatory is online and sky lasers are transmitting! Marvin Minsky's Frame architecture conquered all polar anomalies!"
          );
          setStatusMessage("MISSION 3 SUCCESS: OBSERVATORY TELEMETRY ACTIVE • ALL 3 POLAR MISSIONS ACCOMPLISHED!");
          setTimeout(() => {
            reportComplete({ labId: "minsky-rover-frames", points: 100, timeTaken: getTimeTaken() });
            setShowFrameBreakdown(false);
            setIsCompleted(true);
          }, 2200);
        }
      }, 70);
    }
  }, [
    isSimulating,
    tetherPower,
    tetherGps,
    tetherHull,
    level,
    driveSlot,
    powerSlot,
    toolSlot,
    sensorSlot,
    iceWallState,
    playClick,
    playSwitch,
    playError,
    playSuccess,
    speak,
    spawnParticles,
    shatterIceWall,
    reportComplete,
    getTimeTaken,
  ]);

  // ── Reset Handler ──────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    playClick();
    setLevel(1);
    setScore(0);
    setCompleted(false);
    setTetherPower(false);
    setTetherGps(false);
    setTetherHull(false);
    setPowerSlot("DefaultSolar");
    setDriveSlot("RubberTires");
    setToolSlot("CargoClaw");
    setSensorSlot("OpticalCam");
    setIsSimulating(false);
    setSimPhase("idle");
    setRoverTrackX(0);
    setRoverBounceY(0);
    setFailureNotice(null);
    setShowFrameBreakdown(false);
    setIceWallState("intact");
    setStatusMessage(
      "MISSION 1: Pull 3 inheritance cables from Base Rover Frame to rover ports, then pull Launch Lever."
    );
    speak("Lab reset. Pull down the three Base Frame inheritance cables to begin.");
  }, [playClick, speak]);

  // ── Hint Handler ───────────────────────────────────────────────────
  const handleHint = useCallback(() => {
    playClick();
    if (!tetherPower || !tetherGps || !tetherHull) {
      speak("Pull the three glowing cables from the overhead Base Rover Frame down to the rover chassis ports.");
      setShowHintModal(true);
      return;
    }
    if (level === 1) {
      speak("Smooth rubber tires slip on ice! Drag the cleated Snow Treads from the workbench onto the wheels mount.");
    } else if (level === 2) {
      speak("Shaded canyons have no sunlight and glacier ice is rock hard. Drag the RTG Thermal Core to power and Rotary Drill to tool!");
    } else if (level === 3) {
      speak("Blowing blizzard snow blinds normal cameras. Drag Thermal Sonar onto the top mast so sonar waves can see!");
    }
    setShowHintModal(true);
  }, [level, playClick, speak, tetherGps, tetherHull, tetherPower]);

  // Hazard Alert States for visual signifiers
  const isWheelHazard = simPhase === "failed" && driveSlot === "RubberTires" && level >= 1;
  const isPowerHazard = simPhase === "failed" && powerSlot === "DefaultSolar" && level >= 2;
  const isToolHazard = simPhase === "failed" && toolSlot === "CargoClaw" && level >= 2;
  const isSensorHazard = simPhase === "failed" && sensorSlot === "OpticalCam" && level >= 3;

  // Cables physically attach only when the rover is docked at base.
  const isAtBaseDock = roverTrackX === 0 && !isSimulating;

  return (
    <LabShell
      labId="minsky-rover-frames"
      title="Minsky's Rover AI Frames Configurator"
      subtitle="AI Knowledge Representation — Default Frame Inheritance + Specialized Environmental Overrides"
      module="Artificial Intelligence"
      fullBleed={true}
      score={score}
      maxScore={100}
      navExtra={
        <div className="flex items-center gap-2">
          {/* Hint Button */}
          <button
            type="button"
            onClick={handleHint}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/50 hover:bg-amber-500/30 text-amber-900 font-bold text-xs transition cursor-pointer shadow-sm"
          >
            <HelpCircle className="w-3.5 h-3.5 text-amber-700" />
            <span>Hint</span>
          </button>

          {/* Reset Button */}
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-200/80 border border-slate-300 hover:bg-slate-300/80 text-slate-800 font-bold text-xs transition cursor-pointer shadow-sm"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-700" />
            <span>Reset</span>
          </button>
        </div>
      }
    >
      <div className="relative flex-1 min-h-0 w-full h-full overflow-hidden select-none bg-sky-100 flex items-center justify-center">
        {/* ====================================================================
            LAYER 1: FULL-BLEED BACKGROUND ENVIRONMENT (Zero Horizontal Bars)
            Single Continuous Ground Plane & Daylight Polar World
            ==================================================================== */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          <defs>
            {/* Sunlit Polar Daylight Sky */}
            <linearGradient id="bgSkyGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={level === 2 ? "#64748b" : "#7dd3fc"} />
              <stop offset="45%" stopColor={level === 2 ? "#94a3b8" : "#bae6fd"} />
              <stop offset="80%" stopColor={level === 2 ? "#cbd5e1" : "#e0f2fe"} />
              <stop offset="100%" stopColor="#f8fafc" />
            </linearGradient>

            {/* Sunlit Assembly Hangar Wall (Fades out seamlessly at x=52%) */}
            <linearGradient id="bgHangarWall" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#f1f5f9" />
              <stop offset="40%" stopColor="#e2e8f0" />
              <stop offset="65%" stopColor="#e0f2fe" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#e0f2fe" stopOpacity="0" />
            </linearGradient>

            {/* Continuous Ground Plane: Polished Bay Floor -> Seamless Snow */}
            <linearGradient id="bgGroundFloor" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#cbd5e1" />
              <stop offset="38%" stopColor="#e2e8f0" />
              <stop offset="50%" stopColor="#f0f9ff" />
              <stop offset="100%" stopColor="#ffffff" />
            </linearGradient>
          </defs>

          {/* Sky Layer */}
          <rect x="0" y="0" width="100" height="70" fill="url(#bgSkyGrad)" />

          {/* Seamless Interior Hangar Wall */}
          <rect x="0" y="0" width="60" height="68" fill="url(#bgHangarWall)" />

          {/* Single Unified Continuous Ground Plane (y = 68%..100%) */}
          <rect x="0" y="68" width="100" height="32" fill="url(#bgGroundFloor)" />
        </svg>

        {/* ====================================================================
            LAYER 2: MAIN INTERACTIVE STAGE (1200 x 560 ViewBox)
            Scaled with preserveAspectRatio="xMidYMid meet" so nothing is clipped!
            Continuous Open Polar World (NO Center Pillar Split)
            ==================================================================== */}
        <svg
          ref={containerRef}
          viewBox="0 0 1200 560"
          preserveAspectRatio="xMidYMid meet"
          className="w-full h-full max-h-full block touch-none z-10 relative select-none"
        >
          <defs>
            {/* Metallic Aluminum Beams */}
            <linearGradient id="silverBeam" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="35%" stopColor="#e2e8f0" />
              <stop offset="70%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>

            {/* Rover Chassis 2.5D Shading */}
            <linearGradient id="roverHullShading" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="30%" stopColor="#f1f5f9" />
              <stop offset="70%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>

            {/* Windshield Tint */}
            <linearGradient id="cockpitGlass" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
              <stop offset="60%" stopColor="#0284c7" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#0369a1" stopOpacity="0.85" />
            </linearGradient>

            <linearGradient id="goldCore" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="40%" stopColor="#eab308" />
              <stop offset="80%" stopColor="#ca8a04" />
              <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>

            <linearGradient id="augerSteel" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#7dd3fc" />
              <stop offset="50%" stopColor="#0284c7" />
              <stop offset="100%" stopColor="#0369a1" />
            </linearGradient>

            <linearGradient id="iceWallCrystalline" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#0284c7" stopOpacity="0.9" />
              <stop offset="100%" stopColor="#075985" stopOpacity="0.95" />
            </linearGradient>

            {/* Bright, Sunlit Glacier Ice Formations for Canyon (No black blocks!) */}
            <linearGradient id="glacierIceGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="35%" stopColor="#e0f2fe" stopOpacity="0.9" />
              <stop offset="70%" stopColor="#bae6fd" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.8" />
            </linearGradient>

            <linearGradient id="snowDrift" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#f0f9ff" />
              <stop offset="85%" stopColor="#e0f2fe" />
              <stop offset="100%" stopColor="#bae6fd" />
            </linearGradient>

            {/* Glowing Effects */}
            <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="alertGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="5" result="blur" />
              <feColorMatrix type="matrix" values="1 0 0 0 0  0 0.2 0 0 0  0 0 0.2 0 0  0 0 0 1 0" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* ==================================================================
              BACKGROUND PANORAMA: Sunlit Alpine Horizon & Arctic Mountains
              ================================================================== */}
          <g opacity={level === 3 ? 0.4 : 0.85}>
            <polygon points="520,310 680,140 820,310" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="1.5" />
            <polygon points="680,140 720,190 660,210" fill="#ffffff" />
            <polygon points="780,310 940,110 1100,320" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="1.5" />
            <polygon points="940,110 1000,170 920,190" fill="#ffffff" />
            <polygon points="1040,320 1150,160 1200,320" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
          </g>

          {/* Arctic Sun (Mission 1 & 3) */}
          {level !== 2 && (
            <g transform="translate(1120, 80)">
              <circle cx="0" cy="0" r="38" fill="#fef08a" opacity="0.35" filter="url(#softGlow)" />
              <circle cx="0" cy="0" r="24" fill="#fef08a" opacity="0.75" />
              <circle cx="0" cy="0" r="16" fill="#ffffff" />
            </g>
          )}

          {/* ==================================================================
              MISSION 2: BRIGHT SUNLIT CRYSTALLINE GLACIER CANYON FORMATIONS
              (Zero dark/navy blocks! Clean sky-blue ice ridges with frosted glass badge)
              ================================================================== */}
          {level === 2 && (
            <g>
              {/* Left Sunlit Crystalline Ice Ridge */}
              <polygon
                points="740,160 790,135 835,210 830,340 730,340"
                fill="url(#glacierIceGrad)"
                stroke="#ffffff"
                strokeWidth="2"
                filter="url(#softGlow)"
              />
              <line x1="790" y1="135" x2="810" y2="340" stroke="#38bdf8" strokeWidth="2" strokeOpacity="0.7" />

              {/* Right Translucent Sky-Blue Ice Spire */}
              <polygon
                points="1105,150 1165,120 1200,140 1200,340 1090,340"
                fill="url(#glacierIceGrad)"
                stroke="#ffffff"
                strokeWidth="2"
                filter="url(#softGlow)"
              />
              <line x1="1165" y1="120" x2="1140" y2="340" stroke="#38bdf8" strokeWidth="2" strokeOpacity="0.7" />

              {/* Clean Frosted-Glass Sky Badge for Canyon Sunlight Readout */}
              <g transform="translate(915, 105)">
                <rect x="0" y="-18" width="165" height="36" rx="8" fill="#ffffff" fillOpacity="0.92" stroke="#7dd3fc" strokeWidth="2" filter="url(#softGlow)" />
                <circle cx="22" cy="0" r="8" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1.5" />
                <circle cx="30" cy="-4" r="10" fill="#bae6fd" stroke="#0284c7" strokeWidth="1.5" />
                <circle cx="38" cy="0" r="8" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1.5" />
                <text x="98" y="-3" textAnchor="middle" fill="#0369a1" fontSize="8" fontWeight="900" fontFamily="sans-serif">
                  SHADED GLACIER CANYON
                </text>
                <text x="98" y="9" textAnchor="middle" fill="#b45309" fontSize="7" fontWeight="900">
                  LOW SUNLIGHT (0% SOLAR)
                </text>
              </g>
            </g>
          )}

          {/* ==================================================================
              UNIFIED CONTINUOUS GROUND PLANE & RICH ARCTIC FOREGROUND TERRAIN
              Zero blank white space! Sculpted drifts, crevasse ice, trail & flags.
              ================================================================== */}
          {/* Main Glacier Snow Surface */}
          <path
            d="M 520 350 Q 680 320 840 345 T 1200 335 L 1200 560 L 520 560 Z"
            fill="url(#snowDrift)"
            stroke="#bae6fd"
            strokeWidth="2"
          />

          {/* Rich Midground Sculpted Snow Mounds & Shaded Ice Crevasses */}
          <path
            d="M 550 405 Q 700 375 870 415 T 1200 390 L 1200 560 L 550 560 Z"
            fill="#f0f9ff"
            stroke="#e0f2fe"
            strokeWidth="1.5"
          />
          {/* Glacial Deep Blue Ice Crevasse Facets */}
          <polygon points="690,415 740,435 770,418 730,412" fill="#0284c7" opacity="0.35" />
          <polygon points="860,430 910,455 940,432 895,425" fill="#0369a1" opacity="0.4" />
          <polygon points="1040,420 1100,442 1130,425 1075,418" fill="#0284c7" opacity="0.35" />

          {/* Dotted Expedition Rover Trail from Hangar Ramp to Mission Station */}
          <path
            d="M 540 375 Q 680 365 830 380 T 1040 355"
            fill="none"
            stroke="#93c5fd"
            strokeWidth="3.5"
            strokeDasharray="6 6"
            opacity="0.75"
          />
          <path
            d="M 540 382 Q 680 372 830 387 T 1040 362"
            fill="none"
            stroke="#93c5fd"
            strokeWidth="3.5"
            strokeDasharray="6 6"
            opacity="0.75"
          />

          {/* High-Visibility Polar Expedition Surveyor Marker Flags */}
          <g transform="translate(650, 415)">
            <ellipse cx="0" cy="18" rx="14" ry="4" fill="#cbd5e1" opacity="0.6" />
            <line x1="0" y1="18" x2="0" y2="-16" stroke="#475569" strokeWidth="2" />
            <polygon points="0,-16 16,-10 0,-4" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
          </g>

          <g transform="translate(810, 445)">
            <ellipse cx="0" cy="18" rx="14" ry="4" fill="#cbd5e1" opacity="0.6" />
            <line x1="0" y1="18" x2="0" y2="-16" stroke="#475569" strokeWidth="2" />
            <polygon points="0,-16 16,-10 0,-4" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
          </g>

          <g transform="translate(970, 420)">
            <ellipse cx="0" cy="18" rx="14" ry="4" fill="#cbd5e1" opacity="0.6" />
            <line x1="0" y1="18" x2="0" y2="-16" stroke="#475569" strokeWidth="2" />
            <polygon points="0,-16 16,-10 0,-4" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
          </g>

          {/* Indoor Epoxy Floor Grid Lines (Soft reflections) */}
          <line x1="40" y1="365" x2="520" y2="365" stroke="#cbd5e1" strokeWidth="1.5" strokeDasharray="16 16" />
          {/* Floor Threshold Seam (Zero vertical bars!) */}
          <line x1="530" y1="345" x2="530" y2="430" stroke="#f59e0b" strokeWidth="3" strokeDasharray="12 8" opacity="0.6" />

          {/* ==================================================================
              CONTINUOUS GENTLE ATMOSPHERIC SNOWFALL (Zero UI Overlap)
              28 soft particles drifting smoothly across the outdoor glacier
              ================================================================== */}
          {ambientSnow.map((s) => (
            <circle key={s.id} cx={s.x} cy={s.y} r={s.r} fill="#ffffff" opacity={0.65} pointerEvents="none" />
          ))}

          {/* ==================================================================
              OUTDOOR SCIENTIFIC MISSION TARGETS & LIVE PAYOFF VISUALS
              ================================================================== */}
          {/* Level 1: Frostbite Ridge Weather Relay & Live Doppler Radar Payoff */}
          {level === 1 && (
            <g transform="translate(1040, 275)">
              <ellipse cx="0" cy="65" rx="75" ry="20" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1.5" />
              <rect x="-35" y="0" width="70" height="60" rx="6" fill="#ffffff" stroke="#0284c7" strokeWidth="2.5" />
              <polygon points="-42,0 0,-26 42,0" fill="#0284c7" stroke="#0369a1" strokeWidth="2" />

              {/* Weather Station Mast */}
              <line x1="0" y1="-26" x2="0" y2="-70" stroke="#64748b" strokeWidth="3" />

              {/* Spinning Anemometer Wind Cups on Mast */}
              <g transform={`translate(0, -68) rotate(${simPhase === "passed" ? anemometerAngle : 0})`}>
                <line x1="-14" y1="0" x2="14" y2="0" stroke="#334155" strokeWidth="2" />
                <line x1="0" y1="-14" x2="0" y2="14" stroke="#334155" strokeWidth="2" />
                <circle cx="-14" cy="0" r="3.5" fill="#0284c7" />
                <circle cx="14" cy="0" r="3.5" fill="#0284c7" />
                <circle cx="0" cy="-14" r="3.5" fill="#0284c7" />
                <circle cx="0" cy="14" r="3.5" fill="#0284c7" />
              </g>

              {/* Beacon Light */}
              <circle
                cx="0"
                cy="-46"
                r={simPhase === "passed" ? 14 : 9}
                fill={simPhase === "passed" ? "#22c55e" : "#ef4444"}
                filter="url(#softGlow)"
              />

              {/* Live Signal Waves Emanating into Sky when Relay Online */}
              {simPhase === "passed" && (
                <g filter="url(#softGlow)">
                  <circle cx="0" cy="-46" r="24" fill="none" stroke="#22c55e" strokeWidth="2" opacity="0.75" />
                  <circle cx="0" cy="-46" r="36" fill="none" stroke="#38bdf8" strokeWidth="1.5" opacity="0.5" />
                </g>
              )}

              <text x="0" y="24" textAnchor="middle" fill="#0369a1" fontSize="9" fontWeight="900" fontFamily="sans-serif">
                WEATHER RELAY
              </text>
              <text x="0" y="40" textAnchor="middle" fill={simPhase === "passed" ? "#15803d" : "#b91c1c"} fontSize="7.5" fontWeight="900">
                {simPhase === "passed" ? "DOPPLER RADAR ONLINE" : "POWER CELL DEAD"}
              </text>
            </g>
          )}

          {/* Level 1 Energy Transfer Beam (Rover -> Weather Relay during Payoff) */}
          {level === 1 && simPhase === "passed" && (
            <line
              x1="980"
              y1="280"
              x2="1015"
              y2="295"
              stroke="#38bdf8"
              strokeWidth="4"
              strokeDasharray="6 3"
              filter="url(#softGlow)"
            />
          )}

          {/* Level 2: Automated Sub-Glacial Ice-Core Sample Rig (Strictly Mission 2) */}
          {level === 2 && (
            <g transform="translate(1050, 0)">
              {/* Status Beacon on Tower Mast */}
              <line x1="0" y1="284" x2="0" y2="298" stroke="#475569" strokeWidth="2.5" />
              <circle
                cx="0"
                cy="278"
                r={simPhase === "passed" ? 8 : 6}
                fill={simPhase === "passed" ? "#22c55e" : "#f59e0b"}
                filter="url(#softGlow)"
              />

              {/* Clean Destination Title above the orange rig housing */}
              <text x="0" y="292" textAnchor="middle" fill="#0284c7" fontSize="8.5" fontWeight="900" fontFamily="sans-serif">
                ICE-CORE RIG
              </text>

              {/* Orange Industrial Rig Housing */}
              <rect x="-32" y="298" width="64" height="52" rx="6" fill="#fff7ed" stroke="#ea580c" strokeWidth="2.5" />
              <path d="M -40 350 L 40 350" stroke="#334155" strokeWidth="4.5" strokeLinecap="round" />

              {/* Core Extractor Chamber (Dark Core Cylinder) */}
              <rect x="-14" y="306" width="28" height="26" rx="3" fill="#0f172a" />
              <line x1="0" y1="308" x2="0" y2="330" stroke="#38bdf8" strokeWidth="3" />

              {/* RTG Thermal Heating Aura Payoff (Warms & extracts sample) */}
              {simPhase === "passed" && (
                <g filter="url(#softGlow)">
                  <circle cx="0" cy="319" r={18 + heatAuraPulse * 16} fill="none" stroke="#f59e0b" strokeWidth="3" opacity={1 - heatAuraPulse / 3} />
                  <circle cx="0" cy="319" r={26 + heatAuraPulse * 22} fill="none" stroke="#38bdf8" strokeWidth="2" opacity={0.8 - heatAuraPulse / 3} />
                </g>
              )}

              {/* Cleanly Centered Subtitle Below the Core Cylinder (Zero tube overlap) */}
              <text x="0" y="343" textAnchor="middle" fill={simPhase === "passed" ? "#15803d" : "#b45309"} fontSize="6.5" fontWeight="900">
                {simPhase === "passed" ? "CORE EXTRACTED" : "AWAITING POWER"}
              </text>
            </g>
          )}

          {/* 4M ICE WALL (Live Multi-Stage Shattering Animation, Missions 2 & 3) */}
          {(level === 2 || level === 3) && (
            <g>

              {/* 4M ICE WALL (Live Multi-Stage Shattering Animation) */}
              {iceWallState === "intact" && (
                <g transform="translate(860, 210)">
                  <rect
                    x="-24"
                    y="0"
                    width="48"
                    height="145"
                    rx="8"
                    fill="url(#iceWallCrystalline)"
                    stroke="#7dd3fc"
                    strokeWidth="3"
                    filter="url(#softGlow)"
                  />
                  <line x1="-14" y1="30" x2="10" y2="75" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.8" />
                  <line x1="8" y1="65" x2="-8" y2="120" stroke="#ffffff" strokeWidth="2" strokeOpacity="0.8" />
                  <text x="0" y="-12" textAnchor="middle" fill="#0284c7" fontSize="10" fontWeight="900" fontFamily="sans-serif">
                    4M ICE WALL
                  </text>
                </g>
              )}

              {iceWallState === "cracking" && (
                <g transform="translate(860, 210)">
                  <rect
                    x="-24"
                    y="0"
                    width="48"
                    height="145"
                    rx="8"
                    fill="url(#iceWallCrystalline)"
                    stroke="#ffffff"
                    strokeWidth="3.5"
                    filter="url(#softGlow)"
                  />
                  <path d="M 0 0 L -12 35 L 14 70 L -6 110 L 8 145" fill="none" stroke="#ffffff" strokeWidth="3" />
                  <path d="M -12 35 L -22 60 M 14 70 L 22 95 M -6 110 L -18 130" fill="none" stroke="#bae6fd" strokeWidth="2" />
                  <text x="0" y="-12" textAnchor="middle" fill="#ef4444" fontSize="10" fontWeight="900" fontFamily="sans-serif">
                    CRACKING!
                  </text>
                </g>
              )}

              {iceWallState === "shattered" && (
                <g transform="translate(860, 210)">
                  <polygon points="-20,120 -5,145 15,135 25,145 -10,150" fill="#7dd3fc" opacity="0.85" />
                  <polygon points="10,130 30,140 25,150 5,148" fill="#38bdf8" opacity="0.85" />
                  <text x="0" y="110" textAnchor="middle" fill="#15803d" fontSize="9" fontWeight="900" fontFamily="sans-serif">
                    BREACHED!
                  </text>
                </g>
              )}
            </g>
          )}

          {/* Level 3: Blizzard Whiteout Outpost 7 Aurora Observatory */}
          {level === 3 && (
            <g transform="translate(1040, 0)">
              {/* Foundation Ground Pad */}
              <ellipse cx="0" cy="350" rx="75" ry="18" fill="#cbd5e1" />

              {/* Observatory Geodesic Dome */}
              <path
                d="M -65 350 A 65 65 0 0 1 65 350 Z"
                fill={simPhase === "passed" ? "#fef3c7" : "#f8fafc"}
                stroke={simPhase === "passed" ? "#f59e0b" : "#0284c7"}
                strokeWidth="3"
                filter={simPhase === "passed" ? "url(#softGlow)" : undefined}
              />
              <rect x="-20" y="318" width="40" height="32" rx="4" fill={simPhase === "passed" ? "#f59e0b" : "#334155"} />

              {/* Sky-Scanner Laser Tower Mast */}
              <line x1="0" y1="285" x2="0" y2="248" stroke="#475569" strokeWidth="4" />

              {/* Glowing Beacon Orb / Dish at cy = 248 */}
              <circle
                cx="0"
                cy="248"
                r={simPhase === "passed" ? 14 : 9}
                fill={simPhase === "passed" ? "#22c55e" : "#facc15"}
                filter="url(#softGlow)"
              />

              {/* Vertical Green Sky-Scanner Laser Beam when Observatory Online */}
              {simPhase === "passed" && (
                <g filter="url(#softGlow)">
                  <circle cx="0" cy="248" r="24" fill="none" stroke="#22c55e" strokeWidth="2" opacity="0.75" />
                  <line x1="0" y1="234" x2="0" y2="28" stroke="#22c55e" strokeWidth="3.5" />
                </g>
              )}

              {/* Raised Header cleanly above the green beacon orb / dish (y = 208) */}
              <text x="0" y="208" textAnchor="middle" fill="#0284c7" fontSize="10" fontWeight="900" fontFamily="sans-serif">
                AURORA OBSERVATORY
              </text>

              {/* Frosted Status Pill on Dome (Completely hides WHITEOUT text on success) */}
              {simPhase === "passed" ? (
                <g>
                  <rect x="-95" y="296" width="190" height="18" rx="4" fill="#ffffff" fillOpacity="0.95" stroke="#15803d" strokeWidth="1" filter="url(#softGlow)" />
                  <text x="0" y="308" textAnchor="middle" fill="#15803d" fontSize="7.5" fontWeight="900">
                    OBSERVATORY TELEMETRY ACTIVE
                  </text>
                </g>
              ) : (
                <g>
                  <rect x="-70" y="296" width="140" height="18" rx="4" fill="#ffffff" fillOpacity="0.88" stroke="#b45309" strokeWidth="1" />
                  <text x="0" y="308" textAnchor="middle" fill="#b45309" fontSize="7.5" fontWeight="900">
                    WHITEOUT BLOCKED
                  </text>
                </g>
              )}

              {/* Thermal Infrared Wireframe Silhouette (Illuminated by Sonar) */}
              {sensorSlot === "ThermalSonar" && (
                <g filter="url(#softGlow)" opacity={0.65 + Math.sin(sonarPulse * 2) * 0.25}>
                  <path
                    d="M -65 350 A 65 65 0 0 1 65 350 Z"
                    fill="none"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    strokeDasharray="6 3"
                  />
                  <circle cx="0" cy="248" r="26" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 4" />
                </g>
              )}
            </g>
          )}

          {/* Level 3 Blizzard Wind Streaks */}
          {level === 3 && (
            <g opacity="0.45" pointerEvents="none">
              {[-100, 100, 300, 500, 700, 900, 1100].map((bx, i) => (
                <path
                  key={i}
                  d={`M ${bx} 60 L ${bx + 260} 480`}
                  stroke="#ffffff"
                  strokeWidth="4"
                  strokeDasharray="16 26"
                />
              ))}
            </g>
          )}

          {/* ==================================================================
              OVERHEAD BASE ROVER FRAME GANTRY (y = 20..82)
              Mounted on Brushed Aluminum Beam with 3 Base Anchor Terminals
              ================================================================== */}
          <g transform="translate(35, 20)">
            <rect
              x="0"
              y="0"
              width="545"
              height="62"
              rx="10"
              fill="#ffffff"
              stroke="#0284c7"
              strokeWidth="2.5"
              filter="url(#softGlow)"
            />

            {/* Title & Concept Header */}
            <g transform="translate(14, 18)">
              <text x="0" y="12" fill="#0369a1" fontSize="10.5" fontWeight="900" fontFamily="sans-serif">
                BASE ROVER FRAME
              </text>
              <text x="0" y="27" fill="#64748b" fontSize="8" fontWeight="800" fontFamily="sans-serif">
                PARENT TEMPLATE (MINSKY)
              </text>
            </g>

            {/* Terminal 1: Power Cable (Origin at x = 200) */}
            <g
              transform="translate(180, 8)"
              className="cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => {
                e.stopPropagation();
                playClick();
                setActiveDragTether("power");
                setTetherCursor(getSvgPoint(e));
              }}
            >
              <rect
                x="0"
                y="0"
                width="110"
                height="46"
                rx="8"
                fill={tetherPower ? "#064e3b" : "#f1f5f9"}
                stroke={tetherPower ? "#10b981" : "#0284c7"}
                strokeWidth="2"
              />
              <circle cx="20" cy="23" r="11" fill={tetherPower ? "#10b981" : "#0284c7"} />
              <polygon points="20,16 15,24 20,24 17,31 25,20 20,20" fill="#ffffff" />
              <text x="64" y="20" textAnchor="middle" fill={tetherPower ? "#ffffff" : "#0f172a"} fontSize="8" fontWeight="900">
                POWER CORE
              </text>
              <text x="64" y="33" textAnchor="middle" fill={tetherPower ? "#6ee7b7" : "#0284c7"} fontSize="7" fontWeight="800">
                {tetherPower ? "INHERITED" : "PULL CABLE"}
              </text>
            </g>

            {/* Terminal 2: GPS Telemetry (Origin at x = 300) */}
            <g
              transform="translate(300, 8)"
              className="cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => {
                e.stopPropagation();
                playClick();
                setActiveDragTether("gps");
                setTetherCursor(getSvgPoint(e));
              }}
            >
              <rect
                x="0"
                y="0"
                width="110"
                height="46"
                rx="8"
                fill={tetherGps ? "#064e3b" : "#f1f5f9"}
                stroke={tetherGps ? "#10b981" : "#0284c7"}
                strokeWidth="2"
              />
              <circle cx="20" cy="23" r="11" fill={tetherGps ? "#10b981" : "#0284c7"} />
              <text x="20" y="27" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900">
                G
              </text>
              <text x="64" y="20" textAnchor="middle" fill={tetherGps ? "#ffffff" : "#0f172a"} fontSize="8" fontWeight="900">
                GPS TELEMETRY
              </text>
              <text x="64" y="33" textAnchor="middle" fill={tetherGps ? "#6ee7b7" : "#0284c7"} fontSize="7" fontWeight="800">
                {tetherGps ? "INHERITED" : "PULL CABLE"}
              </text>
            </g>

            {/* Terminal 3: Hull Armor (Origin at x = 420) */}
            <g
              transform="translate(420, 8)"
              className="cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => {
                e.stopPropagation();
                playClick();
                setActiveDragTether("hull");
                setTetherCursor(getSvgPoint(e));
              }}
            >
              <rect
                x="0"
                y="0"
                width="110"
                height="46"
                rx="8"
                fill={tetherHull ? "#064e3b" : "#f1f5f9"}
                stroke={tetherHull ? "#10b981" : "#0284c7"}
                strokeWidth="2"
              />
              <circle cx="20" cy="23" r="11" fill={tetherHull ? "#10b981" : "#0284c7"} />
              <text x="20" y="27" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900">
                H
              </text>
              <text x="64" y="20" textAnchor="middle" fill={tetherHull ? "#ffffff" : "#0f172a"} fontSize="8" fontWeight="900">
                HULL ARMOR
              </text>
              <text x="64" y="33" textAnchor="middle" fill={tetherHull ? "#6ee7b7" : "#0284c7"} fontSize="7" fontWeight="800">
                {tetherHull ? "INHERITED" : "PULL CABLE"}
              </text>
            </g>
          </g>

          {/* ==================================================================
              INHERITANCE CABLES (Gantry terminals to Rover Chassis Ports)
              Cleanly routed down to rover sockets without overlapping windshield or sensors!
              ================================================================== */}
          {/* Power Cable: Terminal (235, 74) -> Rover Port (245, 252) */}
          {tetherPower && isAtBaseDock && (
            <g filter="url(#softGlow)">
              <path
                d="M 235 74 C 235 150, 245 170, 245 252"
                fill="none"
                stroke="#0284c7"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M 235 74 C 235 150, 245 170, 245 252"
                fill="none"
                stroke="#7dd3fc"
                strokeWidth="2"
                strokeDasharray="6 4"
                strokeDashoffset={-treadOffset}
              />
              <circle cx="245" cy="252" r="5" fill="#38bdf8" />
            </g>
          )}

          {/* GPS Cable: Terminal (355, 74) -> Rover Port (305, 238) */}
          {tetherGps && isAtBaseDock && (
            <g filter="url(#softGlow)">
              <path
                d="M 355 74 C 355 140, 305 160, 305 238"
                fill="none"
                stroke="#0284c7"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M 355 74 C 355 140, 305 160, 305 238"
                fill="none"
                stroke="#7dd3fc"
                strokeWidth="2"
                strokeDasharray="6 4"
                strokeDashoffset={-treadOffset}
              />
              <circle cx="305" cy="238" r="5" fill="#38bdf8" />
            </g>
          )}

          {/* Hull Armor Cable: Cleanly routed to lower-center chassis panel (276, 322) */}
          {tetherHull && isAtBaseDock && (
            <g filter="url(#softGlow)">
              <path
                d="M 475 74 C 470 140, 375 220, 315 285 C 298 305, 282 315, 276 322"
                fill="none"
                stroke="#10b981"
                strokeWidth="4"
                strokeLinecap="round"
              />
              <path
                d="M 475 74 C 470 140, 375 220, 315 285 C 298 305, 282 315, 276 322"
                fill="none"
                stroke="#a7f3d0"
                strokeWidth="2"
                strokeDasharray="6 4"
                strokeDashoffset={-treadOffset}
              />
              <circle cx="276" cy="322" r="5" fill="#34d399" />
            </g>
          )}

          {/* Active Tether Wire Following Pointer */}
          {activeDragTether && (
            <path
              d={`M ${
                activeDragTether === "power" ? 235 : activeDragTether === "gps" ? 355 : 475
              } 74 Q ${(tetherCursor.x + 350) / 2} ${(tetherCursor.y + 74) / 2 + 40} ${tetherCursor.x} ${
                tetherCursor.y
              }`}
              fill="none"
              stroke="#0284c7"
              strokeWidth="4.5"
              strokeLinecap="round"
              strokeDasharray="6 4"
            />
          )}

          {/* ==================================================================
              HYDRAULIC LIFT DOCK & FLOOR LAUNCH CONSOLE
              Console is at (x = 495, y = 330) beside lift — Zero Vertical Collision!
              ================================================================== */}
          {/* Scissor Lift Platform */}
          <g transform="translate(305, 345)">
            <rect x="-175" y="14" width="350" height="14" rx="3" fill="#64748b" stroke="#334155" strokeWidth="2" />
            <line x1="-135" y1="14" x2="135" y2="-6" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" />
            <line x1="135" y1="14" x2="-135" y2="-6" stroke="#94a3b8" strokeWidth="6" strokeLinecap="round" />
            <circle cx="0" cy="4" r="5" fill="#f59e0b" stroke="#334155" strokeWidth="2" />
            <rect x="-185" y="-14" width="370" height="14" rx="3" fill="#cbd5e1" stroke="#475569" strokeWidth="2" />
            <line x1="-175" y1="-7" x2="175" y2="-7" stroke="#f59e0b" strokeWidth="4" strokeDasharray="16 12" />
          </g>

          {/* Relocated Physical Launch Console (Beside Lift Platform at x = 505, y = 330) */}
          <g
            transform="translate(505, 330)"
            className="cursor-pointer"
            onClick={handleLaunchLever}
          >
            <rect x="-24" y="0" width="48" height="38" rx="5" fill="#1e293b" stroke="#475569" strokeWidth="2" />
            <text x="0" y="11" textAnchor="middle" fill="#fef08a" fontSize="6.5" fontWeight="900">
              LAUNCH
            </text>
            <text x="0" y="20" textAnchor="middle" fill="#38bdf8" fontSize="6" fontWeight="900">
              LEVER
            </text>
            <rect x="-4" y="24" width="8" height="12" rx="3" fill="#020617" />
            {/* Knurled Handle (Pulls downward smoothly) */}
            <g
              transform={`translate(0, ${isSimulating || simPhase === "running" ? 14 : 0})`}
              style={{ transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
            >
              <circle cx="0" cy="20" r="10" fill="#f59e0b" stroke="#b45309" strokeWidth="2" filter="url(#softGlow)" />
              <circle cx="0" cy="20" r="5" fill="#ef4444" />
            </g>
          </g>

          {/* ==================================================================
              UPGRADED 2.5D ARTICULATED POLAR EXPLORATION ROVER
              Teaches Default Frame Inheritance vs. Slot Overrides directly by sight!
              ================================================================== */}
          <g
            transform={`translate(${
              isSimulating || simPhase !== "idle" ? 305 + roverTrackX : 305
            }, ${282 + roverBounceY})`}
          >
            {/* Ground Shadow */}
            <ellipse cx="0" cy="65" rx="145" ry="16" fill="#334155" opacity="0.35" />

            {/* Main Rover Body Hull: Detailed 2.5D Articulated Armor Plates */}
            <polygon
              points="-130,22 -110,-18 75,-18 128,12 120,40 -130,40"
              fill="url(#roverHullShading)"
              stroke="#334155"
              strokeWidth="2.5"
            />
            {/* Upper Cockpit & Equipment Deck Plate */}
            <polygon points="-100,-18 68,-18 52,-34 -85,-34" fill="#f8fafc" stroke="#64748b" strokeWidth="1.5" />

            {/* Aerodynamic Cockpit Windshield (Tinted Polar Glass) */}
            <polygon
              points="10,-18 66,-18 50,-34 2,-34"
              fill="url(#cockpitGlass)"
              stroke="#0284c7"
              strokeWidth="1.5"
            />

            {/* Mudguards & Fender Flares over wheels */}
            <path d="M -105 32 Q -80 12 -55 32" fill="none" stroke="#475569" strokeWidth="4.5" strokeLinecap="round" />
            <path d="M 55 32 Q 80 12 105 32" fill="none" stroke="#475569" strokeWidth="4.5" strokeLinecap="round" />

            {/* Rocker Panel Hazard Stripes */}
            <line x1="-115" y1="36" x2="110" y2="36" stroke="#f59e0b" strokeWidth="3" strokeDasharray="8 6" />

            {/* Glowing Internal Data Bus Conduits */}
            <line
              x1="-90"
              y1="12"
              x2="90"
              y2="12"
              stroke={tetherPower && tetherGps ? "#0284c7" : "#94a3b8"}
              strokeWidth={tetherPower ? "4" : "1.5"}
              strokeDasharray={tetherPower ? "6 3" : "none"}
              filter={tetherPower ? "url(#softGlow)" : undefined}
            />

            {/* ==============================================================
                3 PHYSICAL INHERITANCE INPUT SOCKETS ON ROVER
                Accurate snap targets for the gantry cables!
                ============================================================== */}
            {/* Socket 1: POWER PORT (Rear roof deck, local x = -60, y = -30) */}
            <g transform="translate(-60, -30)">
              <circle
                cx="0"
                cy="0"
                r="7"
                fill={tetherPower ? "#064e3b" : "#e2e8f0"}
                stroke={tetherPower ? "#10b981" : "#0284c7"}
                strokeWidth="2"
                filter={tetherPower ? "url(#softGlow)" : undefined}
              />
              <circle cx="0" cy="0" r="3" fill={tetherPower ? "#34d399" : "#0284c7"} />
              <text x="0" y="11" textAnchor="middle" fill="#0369a1" fontSize="5" fontWeight="900">
                PWR
              </text>
            </g>

            {/* Socket 2: GPS PORT (Center roof mast base, local x = 0, y = -44) */}
            <g transform="translate(0, -44)">
              <circle
                cx="0"
                cy="0"
                r="7"
                fill={tetherGps ? "#064e3b" : "#e2e8f0"}
                stroke={tetherGps ? "#10b981" : "#0284c7"}
                strokeWidth="2"
                filter={tetherGps ? "url(#softGlow)" : undefined}
              />
              <circle cx="0" cy="0" r="3" fill={tetherGps ? "#34d399" : "#0284c7"} />
              <text x="0" y="11" textAnchor="middle" fill="#0369a1" fontSize="5" fontWeight="900">
                GPS
              </text>
            </g>

            {/* Socket 3: HULL ARMOR PORT (Lower-Center Metallic Chassis Panel, local x = -29, y = 40; global 276, 322) */}
            <g transform="translate(-29, 40)">
              <circle
                cx="0"
                cy="0"
                r="7"
                fill={tetherHull ? "#064e3b" : "#e2e8f0"}
                stroke={tetherHull ? "#10b981" : "#0284c7"}
                strokeWidth="2"
                filter={tetherHull ? "url(#softGlow)" : undefined}
              />
              <circle cx="0" cy="0" r="3" fill={tetherHull ? "#34d399" : "#0284c7"} />
              <text x="0" y="-9" textAnchor="middle" fill="#059669" fontSize="5" fontWeight="900">
                HULL
              </text>
            </g>

            {/* Stamped INHERITED Frame Badge on Hull (local x = 19, y = 24; global 324) */}
            {tetherPower && tetherGps && tetherHull && (
              <g transform="translate(19, 24)" filter="url(#softGlow)">
                <rect x="-32" y="-8" width="64" height="15" rx="3" fill="#0284c7" opacity="0.9" />
                <text x="0" y="2" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontWeight="900">
                  INHERITED FRAME
                </text>
              </g>
            )}

            {/* ==============================================================
                SLOT 1: POWER BAY (Rear Roof Deck, x = -60)
                ============================================================== */}
            <g transform="translate(-60, -34)">
              {isPowerHazard && (
                <circle cx="0" cy="-20" r="26" fill="none" stroke="#ef4444" strokeWidth="2.5" filter="url(#alertGlow)" strokeDasharray="6 4" />
              )}
              {powerSlot === "DefaultSolar" ? (
                /* DEFAULT INHERITED: Solar Panel (Cyan Blueprint Frame) */
                <g>
                  <line x1="0" y1="0" x2="0" y2="-20" stroke="#0284c7" strokeWidth="2" strokeDasharray="2 2" />
                  <rect x="-32" y="-34" width="64" height="16" rx="2" fill="#e0f2fe" stroke="#0284c7" strokeWidth="2" strokeDasharray="4 2" />
                  {[-18, -4, 10].map((sx) => (
                    <line key={sx} x1={sx} y1="-34" x2={sx} y2="-18" stroke="#38bdf8" strokeWidth="1.5" />
                  ))}
                  <rect x="-20" y="-44" width="40" height="9" rx="2" fill="#0284c7" />
                  <text x="0" y="-37" textAnchor="middle" fill="#ffffff" fontSize="5.5" fontWeight="900">
                    BASE: SOLAR
                  </text>
                </g>
              ) : (
                /* SPECIALIZED OVERRIDE: RTG Thermal Core (Bold 3D Gold Hardware) */
                <g>
                  <rect x="-22" y="-34" width="44" height="28" rx="4" fill="url(#goldCore)" stroke="#b45309" strokeWidth="2" />
                  {[-14, -7, 0, 7, 14].map((fx) => (
                    <line key={fx} x1={fx} y1="-34" x2={fx} y2="-6" stroke="#854d0e" strokeWidth="1.5" />
                  ))}
                  <circle cx="0" cy="-20" r="9" fill="#0f172a" />
                  <circle cx="0" cy="-20" r="5" fill="#10b981" filter="url(#softGlow)" />
                  <rect x="-24" y="-44" width="48" height="9" rx="2" fill="#ca8a04" />
                  <text x="0" y="-37" textAnchor="middle" fill="#ffffff" fontSize="5.5" fontWeight="900">
                    OVERRIDE: RTG
                  </text>
                </g>
              )}
            </g>

            {/* ==============================================================
                SLOT 2: GPS DISH (Center Roof, x = 0) — Default Inherited Base
                ============================================================== */}
            <g transform="translate(0, -34)">
              <line x1="0" y1="0" x2="0" y2="-18" stroke="#64748b" strokeWidth="2.5" />
              <path d="M -16 -28 A 18 18 0 0 1 16 -28" fill="none" stroke="#0284c7" strokeWidth="2.5" strokeDasharray="3 2" />
              <circle cx="0" cy="-28" r="2.5" fill="#0284c7" />
              <rect x="-16" y="-38" width="32" height="9" rx="2" fill="#0284c7" />
              <text x="0" y="-31" textAnchor="middle" fill="#ffffff" fontSize="5.5" fontWeight="900">
                BASE: GPS
              </text>
            </g>

            {/* ==============================================================
                SLOT 3: SENSOR MAST (Front Roof, x = 40)
                Sleek compact 3D Parabolic Radar/Sonar Dish (34 x 28) — Never a text box!
                ============================================================== */}
            <g transform="translate(40, -34)">
              {isSensorHazard && (
                <circle cx="0" cy="-20" r="22" fill="none" stroke="#ef4444" strokeWidth="2.5" filter="url(#alertGlow)" strokeDasharray="6 4" />
              )}
              <line x1="0" y1="0" x2="0" y2="-20" stroke="#475569" strokeWidth="2.5" />
              {sensorSlot === "OpticalCam" ? (
                /* DEFAULT INHERITED: Optical Camera (Cyan Blueprint Wireframe) */
                <g transform="translate(0, -20)">
                  <rect x="-11" y="-9" width="22" height="13" rx="2" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="3 2" />
                  <circle cx="-4" cy="-2" r="2.5" fill="#38bdf8" />
                  <circle cx="4" cy="-2" r="2.5" fill="#38bdf8" />
                  <rect x="-18" y="-18" width="36" height="8" rx="2" fill="#0284c7" />
                  <text x="0" y="-12" textAnchor="middle" fill="#ffffff" fontSize="5.5" fontWeight="900">
                    BASE: CAM
                  </text>
                </g>
              ) : (
                /* SPECIALIZED OVERRIDE: Sleek 3D Parabolic Radar/Sonar Dish */
                <g transform="translate(0, -18)">
                  <path d="M -15 -6 Q 0 10 15 -6" fill="url(#silverBeam)" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="0" cy="-1" r="3" fill="#a855f7" />
                  {/* Concentric Cyan & Amber Sonar Arcs */}
                  <circle cx="0" cy="-1" r={8 + sonarPulse * 12} fill="none" stroke="#38bdf8" strokeWidth="1.8" opacity={1 - sonarPulse / 3} />
                  <circle cx="0" cy="-1" r={14 + sonarPulse * 18} fill="none" stroke="#f59e0b" strokeWidth="1.2" opacity={0.8 - sonarPulse / 3} />
                  <rect x="-18" y="-16" width="36" height="8" rx="2" fill="#7c3aed" />
                  <text x="0" y="-10" textAnchor="middle" fill="#ffffff" fontSize="5" fontWeight="900">
                    SONAR
                  </text>
                </g>
              )}
            </g>

            {/* ==============================================================
                SLOT 4: NOSE MOUNT TOOL (Horizontal at 0°, local x = 125, y = 22)
                ============================================================== */}
            <g transform="translate(122, 22)">
              {isToolHazard && (
                <circle cx="28" cy="0" r="26" fill="none" stroke="#ef4444" strokeWidth="2.5" filter="url(#alertGlow)" strokeDasharray="6 4" />
              )}
              {toolSlot === "CargoClaw" ? (
                /* DEFAULT INHERITED: Cargo Claw (Cyan Blueprint Styling) */
                <g>
                  <rect x="0" y="-8" width="18" height="16" rx="2" fill="#e0f2fe" stroke="#0284c7" strokeWidth="1.5" strokeDasharray="3 2" />
                  <path d="M 18 -6 Q 42 -18 52 -4" fill="none" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" />
                  <path d="M 18 4 Q 42 16 52 4" fill="none" stroke="#0284c7" strokeWidth="4" strokeLinecap="round" />
                  <rect x="12" y="-18" width="40" height="9" rx="2" fill="#0284c7" />
                  <text x="32" y="-11" textAnchor="middle" fill="#ffffff" fontSize="5.5" fontWeight="900">
                    BASE: CLAW
                  </text>
                </g>
              ) : (
                /* SPECIALIZED OVERRIDE: Rotary Ice Drill (Straight 0°, y = 282) */
                <g>
                  <rect x="0" y="-11" width="20" height="22" rx="3" fill="#1e293b" stroke="#38bdf8" strokeWidth="1.5" />
                  <polygon points="20,-12 68,0 20,12" fill="url(#augerSteel)" stroke="#0284c7" strokeWidth="1.5" />
                  <g transform={`rotate(${drillAngle}, 44, 0)`}>
                    <line x1="30" y1="-8" x2="40" y2="8" stroke="#ffffff" strokeWidth="2.5" />
                    <line x1="44" y1="-5" x2="54" y2="5" stroke="#ffffff" strokeWidth="2.5" />
                  </g>
                  <rect x="18" y="-18" width="48" height="9" rx="2" fill="#0284c7" />
                  <text x="42" y="-11" textAnchor="middle" fill="#ffffff" fontSize="5.5" fontWeight="900">
                    OVERRIDE: DRILL
                  </text>
                </g>
              )}
            </g>

            {/* ==============================================================
                SLOT 5: WHEELS / AXLES ATTACHMENTS (Rear x = -80, Front x = 80)
                ============================================================== */}
            {isWheelHazard && (
              <g>
                <circle cx="-80" cy="50" r="32" fill="none" stroke="#ef4444" strokeWidth="2.5" filter="url(#alertGlow)" strokeDasharray="6 4" />
                <circle cx="80" cy="50" r="32" fill="none" stroke="#ef4444" strokeWidth="2.5" filter="url(#alertGlow)" strokeDasharray="6 4" />
              </g>
            )}

            {driveSlot === "RubberTires" ? (
              /* DEFAULT INHERITED: Rubber Tires (Cyan Blueprint Rim) */
              <g>
                {[-80, 80].map((wx) => (
                  <g key={wx} transform={`translate(${wx}, 50) rotate(${wheelSpinAngle})`}>
                    <circle cx="0" cy="0" r="24" fill="#1e293b" stroke="#0284c7" strokeWidth="3.5" strokeDasharray="6 3" />
                    <circle cx="0" cy="0" r="12" fill="#cbd5e1" stroke="#0284c7" strokeWidth="1.5" />
                    <line x1="-12" y1="0" x2="12" y2="0" stroke="#f8fafc" strokeWidth="2" />
                    <line x1="0" y1="-12" x2="0" y2="12" stroke="#f8fafc" strokeWidth="2" />
                  </g>
                ))}
                <rect x="-45" y="79" width="90" height="11" rx="2" fill="#0284c7" />
                <text x="0" y="87" textAnchor="middle" fill="#ffffff" fontSize="6" fontWeight="900">
                  BASE: RUBBER TIRES (0.12 GRIP)
                </text>
              </g>
            ) : (
              /* SPECIALIZED OVERRIDE: Cleated Caterpillar Snow Treads */
              <g>
                {[-80, 80].map((tx) => (
                  <g key={tx} transform={`translate(${tx}, 50)`}>
                    <polygon points="-32,12 0,-16 32,12" fill="#042f2e" stroke="#14b8a6" strokeWidth="2.5" />
                    <circle cx="-20" cy="10" r="10" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                    <circle cx="20" cy="10" r="10" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                    <circle cx="0" cy="-8" r="8" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
                    <path d="M -34 14 L 0 -18 L 34 14 Z" fill="none" stroke="#020617" strokeWidth="7" strokeLinejoin="round" />
                    <path
                      d="M -34 14 L 0 -18 L 34 14 Z"
                      fill="none"
                      stroke="#34d399"
                      strokeWidth="2"
                      strokeDasharray="5 3"
                      strokeDashoffset={treadOffset}
                    />
                  </g>
                ))}
                <rect x="-92" y="78" width="185" height="13" rx="3" fill="#059669" stroke="#047857" strokeWidth="0.5" />
                <text x="0" y="87.5" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="900" fontFamily="sans-serif">
                  OVERRIDE: SNOW TREADS
                </text>
              </g>
            )}
          </g>

          {/* ==================================================================
              OPEN SUNLIT WORKBENCH TABLE (y = 445..540)
              Hardware icons cleanly centered below title labels; zero overlap!
              ================================================================== */}
          <g transform="translate(35, 445)">
            <rect x="0" y="0" width="545" height="95" rx="10" fill="#ffffff" stroke="#cbd5e1" strokeWidth="2" />
            <line x1="0" y1="18" x2="545" y2="18" stroke="#e2e8f0" strokeWidth="1.5" />
            <text x="272" y="13" textAnchor="middle" fill="#0284c7" fontSize="8.5" fontWeight="900" fontFamily="sans-serif">
              OVERRIDE HARDWARE WORKBENCH (DRAG PART ONTO ROVER SLOT)
            </text>

            {/* Bay 1: Snow Treads (Center at x = 68) */}
            <g
              transform="translate(68, 56)"
              className="cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => {
                e.stopPropagation();
                playClick();
                setActiveDragPart("SnowTreads");
                setPartCursor(getSvgPoint(e));
              }}
            >
              {isWheelHazard && (
                <rect x="-56" y="-32" width="112" height="64" rx="8" fill="none" stroke="#10b981" strokeWidth="2.5" filter="url(#softGlow)" strokeDasharray="6 4" />
              )}
              <rect x="-52" y="-30" width="104" height="60" rx="7" fill={driveSlot === "SnowTreads" ? "#d1fae5" : "#f8fafc"} stroke="#10b981" strokeWidth="2" />
              {/* Title at top */}
              <text x="0" y="-16" textAnchor="middle" fill="#0f172a" fontSize="7.5" fontWeight="900">
                SNOW TREADS
              </text>
              {/* Icon cleanly centered */}
              <g transform="translate(0, -1)">
                <polygon points="-22,8 0,-10 22,8" fill="#042f2e" stroke="#14b8a6" strokeWidth="2" />
                <path d="M -24 10 L 0 -12 L 24 10 Z" fill="none" stroke="#020617" strokeWidth="5" />
                <path d="M -24 10 L 0 -12 L 24 10 Z" fill="none" stroke="#34d399" strokeWidth="1.5" strokeDasharray="3 2" />
              </g>
              {/* Status at bottom */}
              <text x="0" y="24" textAnchor="middle" fill="#059669" fontSize="7" fontWeight="800">
                {driveSlot === "SnowTreads" ? "EQUIPPED" : "DRAG TO WHEELS"}
              </text>
            </g>

            {/* Bay 2: Rotary Ice Drill (Center at x = 204) */}
            <g
              transform="translate(204, 56)"
              className="cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => {
                e.stopPropagation();
                playClick();
                setActiveDragPart("RotaryDrill");
                setPartCursor(getSvgPoint(e));
              }}
            >
              {isToolHazard && (
                <rect x="-56" y="-32" width="112" height="64" rx="8" fill="none" stroke="#38bdf8" strokeWidth="2.5" filter="url(#softGlow)" strokeDasharray="6 4" />
              )}
              <rect x="-52" y="-30" width="104" height="60" rx="7" fill={toolSlot === "RotaryDrill" ? "#e0f2fe" : "#f8fafc"} stroke="#0284c7" strokeWidth="2" />
              <text x="0" y="-16" textAnchor="middle" fill="#0f172a" fontSize="7.5" fontWeight="900">
                ROTARY ICE DRILL
              </text>
              <g transform="translate(0, -1)">
                <rect x="-16" y="-6" width="12" height="12" rx="2" fill="#1e293b" />
                <polygon points="-4,-9 26,0 -4,9" fill="url(#augerSteel)" stroke="#38bdf8" strokeWidth="1.5" />
                <line x1="2" y1="-6" x2="10" y2="5" stroke="#ffffff" strokeWidth="2" />
              </g>
              <text x="0" y="24" textAnchor="middle" fill="#0284c7" fontSize="7" fontWeight="800">
                {toolSlot === "RotaryDrill" ? "EQUIPPED" : "DRAG TO TOOL"}
              </text>
            </g>

            {/* Bay 3: RTG Thermal Generator (Center at x = 340) */}
            <g
              transform="translate(340, 56)"
              className="cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => {
                e.stopPropagation();
                playClick();
                setActiveDragPart("RtgThermal");
                setPartCursor(getSvgPoint(e));
              }}
            >
              {isPowerHazard && (
                <rect x="-56" y="-32" width="112" height="64" rx="8" fill="none" stroke="#f59e0b" strokeWidth="2.5" filter="url(#softGlow)" strokeDasharray="6 4" />
              )}
              <rect x="-52" y="-30" width="104" height="60" rx="7" fill={powerSlot === "RtgThermal" ? "#fef3c7" : "#f8fafc"} stroke="#f59e0b" strokeWidth="2" />
              <text x="0" y="-16" textAnchor="middle" fill="#0f172a" fontSize="7.5" fontWeight="900">
                RTG THERMAL CORE
              </text>
              <g transform="translate(0, -1)">
                <rect x="-16" y="-13" width="32" height="22" rx="3" fill="url(#goldCore)" stroke="#b45309" strokeWidth="1.5" />
                <circle cx="0" cy="-2" r="5" fill="#0f172a" />
                <circle cx="0" cy="-2" r="3" fill="#10b981" filter="url(#softGlow)" />
              </g>
              <text x="0" y="24" textAnchor="middle" fill="#b45309" fontSize="7" fontWeight="800">
                {powerSlot === "RtgThermal" ? "EQUIPPED" : "DRAG TO POWER"}
              </text>
            </g>

            {/* Bay 4: Thermal Sonar Scanner (Center at x = 476) */}
            <g
              transform="translate(476, 56)"
              className="cursor-grab active:cursor-grabbing"
              onPointerDown={(e) => {
                e.stopPropagation();
                playClick();
                setActiveDragPart("ThermalSonar");
                setPartCursor(getSvgPoint(e));
              }}
            >
              {isSensorHazard && (
                <rect x="-56" y="-32" width="112" height="64" rx="8" fill="none" stroke="#a855f7" strokeWidth="2.5" filter="url(#softGlow)" strokeDasharray="6 4" />
              )}
              <rect x="-52" y="-30" width="104" height="60" rx="7" fill={sensorSlot === "ThermalSonar" ? "#f3e8ff" : "#f8fafc"} stroke="#a855f7" strokeWidth="2" />
              <text x="0" y="-16" textAnchor="middle" fill="#0f172a" fontSize="7.5" fontWeight="900">
                THERMAL SONAR
              </text>
              <g transform="translate(0, -1)">
                <path d="M -15 -6 Q 0 10 15 -6" fill="url(#silverBeam)" stroke="#7c3aed" strokeWidth="2" strokeLinecap="round" />
                <circle cx="0" cy="-1" r="3" fill="#a855f7" />
                <circle cx="0" cy="-1" r={8} fill="none" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 2" />
              </g>
              <text x="0" y="24" textAnchor="middle" fill="#7c3aed" fontSize="7" fontWeight="800">
                {sensorSlot === "ThermalSonar" ? "EQUIPPED" : "DRAG TO SENSOR"}
              </text>
            </g>
          </g>

          {/* ==================================================================
              ACTIVE DRAGGED HARDWARE PREVIEW (Renders actual 3D mechanical object!)
              Never a large dark-green box!
              ================================================================== */}
          {activeDragPart && (
            <g transform={`translate(${partCursor.x}, ${partCursor.y})`} style={{ pointerEvents: "none" }}>
              {activeDragPart === "ThermalSonar" && (
                <g filter="url(#softGlow)">
                  <path d="M -16 -6 Q 0 12 16 -6" fill="url(#silverBeam)" stroke="#7c3aed" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="0" cy="-1" r="3.5" fill="#a855f7" />
                  <circle cx="0" cy="-1" r={10} fill="none" stroke="#38bdf8" strokeWidth="2" />
                </g>
              )}
              {activeDragPart === "RotaryDrill" && (
                <g filter="url(#softGlow)">
                  <rect x="-14" y="-7" width="14" height="14" rx="2" fill="#1e293b" />
                  <polygon points="0,-10 32,0 0,10" fill="url(#augerSteel)" stroke="#38bdf8" strokeWidth="1.5" />
                </g>
              )}
              {activeDragPart === "SnowTreads" && (
                <g filter="url(#softGlow)">
                  <polygon points="-24,8 0,-12 24,8" fill="#042f2e" stroke="#14b8a6" strokeWidth="2" />
                  <path d="M -26 10 L 0 -14 L 26 10 Z" fill="none" stroke="#020617" strokeWidth="6" />
                  <path d="M -26 10 L 0 -14 L 26 10 Z" fill="none" stroke="#34d399" strokeWidth="2" strokeDasharray="4 2" />
                </g>
              )}
              {activeDragPart === "RtgThermal" && (
                <g filter="url(#softGlow)">
                  <rect x="-18" y="-14" width="36" height="26" rx="3" fill="url(#goldCore)" stroke="#b45309" strokeWidth="1.5" />
                  <circle cx="0" cy="-1" r="6" fill="#0f172a" />
                  <circle cx="0" cy="-1" r="3.5" fill="#10b981" />
                </g>
              )}
              {/* Clean compact pill badge below dragged part */}
              <rect x="-40" y="16" width="80" height="14" rx="4" fill="#0284c7" opacity="0.9" filter="url(#softGlow)" />
              <text x="0" y="26" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="900">
                {activeDragPart}
              </text>
            </g>
          )}

          {/* ==================================================================
              DYNAMIC PARTICLES & ICE SHARDS
              ================================================================== */}
          {particles.map((p) => (
            <circle key={p.id} cx={p.x} cy={p.y} r={p.size} fill={p.color} opacity={p.life / p.maxLife} />
          ))}

          {iceShards.map((s) => (
            <g key={s.id} transform={`translate(${s.x}, ${s.y}) rotate(${s.rot})`} opacity={s.opacity}>
              <polygon
                points={`0,-${s.size} ${s.size * 0.7},${s.size * 0.5} -${s.size * 0.7},${s.size * 0.5}`}
                fill="#bae6fd"
                stroke="#38bdf8"
                strokeWidth="1.5"
              />
            </g>
          ))}

          {/* ==================================================================
              VISUAL ROVER AI FRAME SUMMARY READOUT (At destination payoff)
              Floats cleanly above center glacier (x = 610..940, y = 80..215)
              Teaches Minsky's Default Frame Inheritance vs. Slot Overrides!
              ================================================================== */}
          {showFrameBreakdown && !isCompleted && (
            <g transform="translate(560, 85)" filter="url(#softGlow)">
              {/* Semi-transparent Frosted Blueprint Card */}
              <rect
                x="0"
                y="0"
                width="335"
                height={level === 3 ? 135 : 120}
                rx="10"
                fill="#ffffff"
                fillOpacity="0.95"
                stroke={level === 1 ? "#0284c7" : level === 2 ? "#059669" : "#7c3aed"}
                strokeWidth="2.5"
              />

              {/* Header Title */}
              <text x="168" y="20" textAnchor="middle" fill="#0369a1" fontSize="9.5" fontWeight="900" fontFamily="sans-serif">
                {level === 3 ? "MINSKY AI FRAME MASTERY BREAKDOWN" : "ROVER AI FRAME ARCHITECTURE SUMMARY"}
              </text>
              <line x1="14" y1="28" x2="321" y2="28" stroke="#cbd5e1" strokeWidth="1" />

              {/* Level 1 Summary */}
              {level === 1 && (
                <g transform="translate(16, 42)">
                  <rect x="0" y="0" width="14" height="14" rx="3" fill="#0284c7" />
                  <text x="7" y="11" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900">
                    B
                  </text>
                  <text x="22" y="11" fill="#0369a1" fontSize="8" fontWeight="900">
                    INHERITED FROM BASE FRAME (3/3):
                  </text>
                  <text x="22" y="24" fill="#475569" fontSize="7.5" fontWeight="700">
                    Power Core, GPS Telemetry, Hull Armor (Zero reprogramming)
                  </text>

                  <rect x="0" y="34" width="14" height="14" rx="3" fill="#059669" />
                  <text x="7" y="45" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900">
                    O
                  </text>
                  <text x="22" y="45" fill="#059669" fontSize="8" fontWeight="900">
                    SPECIALIZED SLOT OVERRIDE (1/4):
                  </text>
                  <text x="22" y="58" fill="#475569" fontSize="7.5" fontWeight="700">
                    Wheels: Rubber Tires to Snow Treads (0.92 ice grip)
                  </text>
                </g>
              )}

              {/* Level 2 Summary */}
              {level === 2 && (
                <g transform="translate(16, 42)">
                  <rect x="0" y="0" width="14" height="14" rx="3" fill="#0284c7" />
                  <text x="7" y="11" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900">
                    B
                  </text>
                  <text x="22" y="11" fill="#0369a1" fontSize="8" fontWeight="900">
                    INHERITED BASE TRAITS:
                  </text>
                  <text x="22" y="24" fill="#475569" fontSize="7.5" fontWeight="700">
                    GPS Telemetry, Hull Armor (Inherited without redesign)
                  </text>

                  <rect x="0" y="34" width="14" height="14" rx="3" fill="#059669" />
                  <text x="7" y="45" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900">
                    O
                  </text>
                  <text x="22" y="45" fill="#059669" fontSize="8" fontWeight="900">
                    ENVIRONMENTAL SLOT OVERRIDES (3/4):
                  </text>
                  <text x="22" y="58" fill="#475569" fontSize="7.5" fontWeight="700">
                    RTG Thermal Core (Shadow Power) + Ice Drill + Snow Treads
                  </text>
                </g>
              )}

              {/* Level 3 Summary */}
              {level === 3 && (
                <g transform="translate(16, 40)">
                  <rect x="0" y="0" width="14" height="14" rx="3" fill="#0284c7" />
                  <text x="7" y="11" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900">
                    B
                  </text>
                  <text x="22" y="11" fill="#0369a1" fontSize="8" fontWeight="900">
                    INHERITED BASE TEMPLATE:
                  </text>
                  <text x="22" y="23" fill="#475569" fontSize="7.5" fontWeight="700">
                    Chassis Hull, Base Logic, GPS Navigation
                  </text>

                  <rect x="0" y="32" width="14" height="14" rx="3" fill="#7c3aed" />
                  <text x="7" y="43" textAnchor="middle" fill="#ffffff" fontSize="9" fontWeight="900">
                    O
                  </text>
                  <text x="22" y="43" fill="#7c3aed" fontSize="8" fontWeight="900">
                    COMPLETE POLAR OVERRIDES (4/4):
                  </text>
                  <text x="22" y="55" fill="#475569" fontSize="7.5" fontWeight="700">
                    RTG Power, Snow Treads, Tungsten Drill, Thermal Sonar
                  </text>
                  <text x="22" y="72" fill="#0f172a" fontSize="7" fontWeight="800">
                    Principle: Common traits inherited; only polar anomalies overridden!
                  </text>
                </g>
              )}
            </g>
          )}

          {/* ==================================================================
              TOP HUD STATUS BANNER
              ================================================================== */}
          <g transform="translate(680, 20)">
            <rect x="0" y="0" width="480" height="28" rx="6" fill="#f8fafc" stroke="#0284c7" strokeWidth="1.5" />
            <text x="14" y="18" fill="#0284c7" fontSize="8.5" fontWeight="900">
              {level === 1 ? "MISSION 1: FROSTBITE RIDGE" : level === 2 ? "MISSION 2: ICE-CORE DRILL SITE" : "MISSION 3: AURORA OBSERVATORY"}
            </text>
            <text x="360" y="18" textAnchor="end" fill="#059669" fontSize="8" fontWeight="800">
              OVERRIDES: {(driveSlot === "SnowTreads" ? 1 : 0) + (toolSlot === "RotaryDrill" ? 1 : 0) + (powerSlot === "RtgThermal" ? 1 : 0) + (sensorSlot === "ThermalSonar" ? 1 : 0)}/4
            </text>
            <text x="465" y="18" textAnchor="end" fill="#ca8a04" fontSize="9" fontWeight="900">
              {score}/100
            </text>
          </g>

          {/* Failure Alert Banner */}
          {failureNotice && (
            <g transform="translate(380, 200)">
              <rect x="0" y="0" width="460" height="46" rx="8" fill="#fef2f2" stroke="#ef4444" strokeWidth="2.5" filter="url(#softGlow)" />
              <text x="230" y="20" textAnchor="middle" fill="#991b1b" fontSize="8.5" fontWeight="900">
                {failureNotice}
              </text>
              <text x="230" y="36" textAnchor="middle" fill="#b91c1c" fontSize="7.5" fontWeight="800">
                WHY IT FAILED: Common base defaults do not fit extreme polar terrain. Override needed!
              </text>
            </g>
          )}
        </svg>

        {/* ====================================================================
            HINT MODAL
            ==================================================================== */}
        <AnimatePresence>
          {showHintModal && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
              onClick={() => setShowHintModal(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 15 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 15 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-md rounded-2xl bg-white border-2 border-amber-400 p-6 text-slate-900 shadow-2xl"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-600">
                    <HelpCircle className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-amber-700">Rover Frame Engineering Hint</h3>
                    <span className="text-xs text-slate-500 font-sans">Mission {level} Guidance</span>
                  </div>
                </div>

                <div className="text-xs text-slate-700 space-y-2 mb-5 leading-relaxed font-sans">
                  <div>
                    <strong>Minsky's AI Frame Principle:</strong> You do not re-engineer a robot from scratch for every mission.
                  </div>
                  <div>
                    1. <strong>Inherit Base Slots:</strong> Connect the 3 overhead cables (Power, GPS, Hull) to the matching rover chassis ports.
                  </div>
                  <div>
                    2. <strong>Override Specific Slots:</strong>
                    {level === 1 && " Drag Snow Treads from the workbench onto the wheels mount to overcome icy inclines."}
                    {level === 2 && " Drag RTG Thermal Core to Power, and Rotary Ice Drill to Tool to pierce the permafrost ice wall."}
                    {level === 3 && " Drag Thermal Sonar to the sensor mast to see through blowing blizzard whiteout."}
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowHintModal(false)}
                  className="w-full py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition cursor-pointer"
                >
                  Understood, Resume Mission
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ====================================================================
            UNIVERSAL COMPLETION MODAL (Strict Contract Text)
            ==================================================================== */}
        <AnimatePresence>
          {isCompleted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md"
            >
              <motion.div
                initial={{ scale: 0.9, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
                className="relative w-full max-w-md rounded-3xl bg-white/95 backdrop-blur-md border-2 border-emerald-400 shadow-2xl p-6 sm:p-8 text-center z-50"
              >
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 border-4 border-amber-200 shadow-md flex items-center justify-center">
                  <Award className="w-9 h-9 text-white" />
                </div>

                <h2 className="font-sans font-extrabold text-xl sm:text-2xl text-slate-900 tracking-tight mb-4">
                  Congrats! You have completed Minsky's Rover AI Frames Configurator.
                </h2>

                <div className="text-xs text-slate-700 font-sans leading-relaxed mb-6">
                  You mastered Marvin Minsky's foundational concept of <strong>Frames</strong>! The polar rover inherited baseline traits automatically from the Base Frame template and only needed specialized overrides for Arctic snow, ice walls, and blizzard storms.
                </div>

                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 border-2 border-emerald-800 text-white font-sans font-bold text-sm shadow-md active:scale-95 transition cursor-pointer"
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
