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

type LevelId = 1 | 2 | 3;

interface DataSphere {
  id: number;
  y: number;
  lane: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  size: number;
  life: number;
}

interface DepthCommand {
  time: number;
  depth: number;
}

export default function InternetNocLab() {
  const { playClick, playSuccess, playError, playSwitch, playBeep } = useLabAudio();
  const { reportComplete, getTimeTaken } = useLMSBridge("internet-noc-lab");
  const { speak } = useVoiceAssistant({ lang: "en-IN" });

  const svgRef = useRef<SVGSVGElement | null>(null);

  // ── Mission & Progression State ─────────────────────────────────────
  const [level, setLevel] = useState<LevelId>(1);
  const [score, setScore] = useState<number>(0);
  const [isCompleted, setIsCompleted] = useState<boolean>(false);
  const [showHintModal, setShowHintModal] = useState<boolean>(false);
  const [showSummaryOverlay, setShowSummaryOverlay] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<string>(
    "MISSION 1: Widen the brass iris valve to 100 Mbps and switch from 480ms Satellite to 12ms Subsea Fiber."
  );
  const [failureNotice, setFailureNotice] = useState<string | null>(null);

  // ── Common Ambient Ticker ──────────────────────────────────────────
  const [animTime, setAnimTime] = useState<number>(0);
  const [particles, setParticles] = useState<Particle[]>([]);
  const idCounterRef = useRef<number>(1);

  // ── LEVEL 1: Undersea Coral Canyon State ───────────────────────────
  const [irisWide, setIrisWide] = useState<boolean>(false);
  const [dataSpheres, setDataSpheres] = useState<DataSphere[]>(() =>
    Array.from({ length: 16 }, (_, i) => ({
      id: i + 1,
      y: 135 + (i * 22) % 300,
      lane: i % 4,
    }))
  );

  const [l1Route, setL1Route] = useState<"satellite" | "subsea">("satellite");
  const [droneTargetY, setDroneTargetY] = useState<number>(350);
  const [droneActualY, setDroneActualY] = useState<number>(350);
  const droneActualYRef = useRef<number>(350);
  const [droneRunActive, setDroneRunActive] = useState<boolean>(false);
  const [droneX, setDroneX] = useState<number>(260);
  const [droneCollision, setDroneCollision] = useState<boolean>(false);

  // Latency delay buffer & keyboard tracking
  const depthHistoryRef = useRef<DepthCommand[]>([]);
  const keysPressedRef = useRef<{ [key: string]: boolean }>({});

  // ── LEVEL 2: Cloud-Spire DNS Relay State (4 Waves) ─────────────────
  // Zeppelin at (310, 215), Interactive TLD Track Switch, Octet IP Builder & Single Unified Banner
  const [l2Wave, setL2Wave] = useState<1 | 2 | 3 | 4>(1);
  const [l2Conn, setL2Conn] = useState<"idle" | "root" | "tld" | "auth">("idle");
  const [l2Ttl, setL2Ttl] = useState<number>(0); // 0 = empty/expired, 15 = active
  const [l2CachedDomain, setL2CachedDomain] = useState<string | null>(null);
  const [l2CachedIp, setL2CachedIp] = useState<string | null>(null);
  const [l2Hops, setL2Hops] = useState<number>(0);
  const [l2Latency, setL2Latency] = useState<number>(0);
  const [l2AirshipIp, setL2AirshipIp] = useState<string>("[ ? . ? . ? . ? ]");
  const [l2AirshipX, setL2AirshipX] = useState<number>(185);
  const [l2AirshipFlying, setL2AirshipFlying] = useState<boolean>(false);
  const [l2AirshipBouncing, setL2AirshipBouncing] = useState<boolean>(false);
  const [l2DockedCount, setL2DockedCount] = useState<number>(0);
  const [l2TimeWarpPulled, setL2TimeWarpPulled] = useState<boolean>(false);

  // Golden spark shortcut effect for Wave 2 cache hit
  const [l2GoldenSpark, setL2GoldenSpark] = useState<boolean>(false);

  // Interactive TLD Track Switch Position: ".COM" | ".ORG" | ".GOV" | "locked"
  const [l2SwitchPos, setL2SwitchPos] = useState<".COM" | ".ORG" | ".GOV" | "locked">("locked");

  // Draggable & Animated DNS Query Drone Position & State (Home cleanly at 310, 315)
  const packetHome = { x: 295, y: 315 };
  const [packetPos, setPacketPos] = useState<{ x: number; y: number }>(packetHome);
  const [packetDragging, setPacketDragging] = useState<boolean>(false);
  const [droneFlying, setDroneFlying] = useState<boolean>(false);
  const lastTtlTickRef = useRef<number>(0);

  // Single Unified Top Status Banner (at 760, 48 - Zero Stacking!)
  const [l2Banner, setL2Banner] = useState<{ text: string; isError?: boolean } | null>(null);
  const [l2GateAlert, setL2GateAlert] = useState<string | null>(null);
  const [l2SpireShake, setL2SpireShake] = useState<string | null>(null);
  // ── LEVEL 3: Sunlit Library Bookshop State ──────────────────────────
  const [l3Situation, setL3Situation] = useState<1 | 2 | 3>(1);
  const prop1Home = { x: 172, y: 450 };
  const prop2Home = { x: 458, y: 450 };
  const prop3Home = { x: 742, y: 450 };
  const [draggedProp, setDraggedProp] = useState<1 | 2 | 3 | null>(null);
  const [prop1Pos, setProp1Pos] = useState<{ x: number; y: number }>(prop1Home);
  const [prop2Pos, setProp2Pos] = useState<{ x: number; y: number }>(prop2Home);
  const [prop3Pos, setProp3Pos] = useState<{ x: number; y: number }>(prop3Home);

  const [gear1Rotated, setGear1Rotated] = useState<boolean>(false);
  const [sluice2Split, setSluice2Split] = useState<boolean>(false);
  const [key3Inserted, setKey3Inserted] = useState<boolean>(false);
  const [httpRunActive, setHttpRunActive] = useState<boolean>(false);
  const [httpWaveProgress, setHttpWaveProgress] = useState<number>(0);
  const [channel1Flare, setChannel1Flare] = useState<"none" | "404" | "200">("none");
  const [channel2Flare, setChannel2Flare] = useState<"none" | "503" | "200">("none");
  const [channel3Flare, setChannel3Flare] = useState<"none" | "403" | "200">("none");

  // ── Particle Spawner ───────────────────────────────────────────────
  const spawnParticles = useCallback((x: number, y: number, color: string, count = 10) => {
    const list: Particle[] = [];
    for (let i = 0; i < count; i++) {
      list.push({
        id: idCounterRef.current++,
        x: x + (Math.random() - 0.5) * 16,
        y: y + (Math.random() - 0.5) * 16,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        color,
        size: 2.5 + Math.random() * 2.5,
        life: 0.7 + Math.random() * 0.4,
      });
    }
    setParticles((prev) => [...prev.slice(-35), ...list]);
  }, []);

  // ── Keyboard Steering Listeners (ArrowUp/Down and W/S) ──────────────
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "arrowup" || k === "arrowdown" || k === "w" || k === "s") {
        if (k === "arrowup" || k === "arrowdown") {
          e.preventDefault();
        }
        keysPressedRef.current[k] = true;
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === "arrowup" || k === "arrowdown" || k === "w" || k === "s") {
        keysPressedRef.current[k] = false;
      }
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, []);

  // ── Level 1 Depth Gauge Pointer Dragging ───────────────────────────
  const updateDepthFromClientY = useCallback((clientY: number) => {
    if (!svgRef.current) return;
    const pt = svgRef.current.createSVGPoint();
    pt.x = 0;
    pt.y = clientY;
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return;
    const svgPt = pt.matrixTransform(ctm.inverse());

    const trackTop = 324;
    const trackBottom = 440;
    const t = Math.max(0, Math.min(1, (svgPt.y - trackTop) / (trackBottom - trackTop)));
    const newDepth = 175 + t * (445 - 175);
    setDroneTargetY(newDepth);
  }, []);

  const handleGaugePointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      playClick();
      updateDepthFromClientY(e.clientY);

      const handlePointerMove = (ev: PointerEvent) => {
        updateDepthFromClientY(ev.clientY);
      };
      const handlePointerUp = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [playClick, updateDepthFromClientY]
  );

  // ── Direct Water-Column Steering Click/Drag (Level 1) ───────────────
  const updateDepthFromWaterPointer = useCallback((clientY: number) => {
    if (!svgRef.current) return;
    const pt = svgRef.current.createSVGPoint();
    pt.x = 0;
    pt.y = clientY;
    const ctm = svgRef.current.getScreenCTM();
    if (!ctm) return;
    const svgPt = pt.matrixTransform(ctm.inverse());

    const clampedY = Math.max(175, Math.min(445, svgPt.y));
    setDroneTargetY(clampedY);
  }, []);

  const handleWaterColumnPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      updateDepthFromWaterPointer(e.clientY);

      const handlePointerMove = (ev: PointerEvent) => {
        updateDepthFromWaterPointer(ev.clientY);
      };
      const handlePointerUp = () => {
        window.removeEventListener("pointermove", handlePointerMove);
        window.removeEventListener("pointerup", handlePointerUp);
      };
      window.addEventListener("pointermove", handlePointerMove);
      window.addEventListener("pointerup", handlePointerUp);
    },
    [updateDepthFromWaterPointer]
  );

  // ── Spoken Mission Introductions ───────────────────────────────────
  useEffect(() => {
    if (level === 1) {
      speak(
        "Mission 1: Canyon Stream and Submersible Steering! Heavy 4K video is jamming in the narrow optical pipe. Drag the brass iris valve to open 100 Mbps bandwidth, then flip the seabed switch to 12ms Subsea Fiber to steer Claw Bot-3 cleanly through the coral arches!"
      );
      setStatusMessage(
        "OPEN BRASS IRIS VALVE (100 Mbps WIDE) AND CONNECT DIRECT SUBSEA FIBER (12ms) TO STEER DRONE."
      );
      setShowSummaryOverlay(false);
      setFailureNotice(null);
    } else if (level === 2) {
      speak(
        "Mission 2: Cloud-Spire DNS Relay! Drag the glowing Query Packet from the Resolver Zeppelin onto the Root Spire to discover the right-to-left referral chain!"
      );
      setStatusMessage(
        "WAVE 1: DRAG QUERY PACKET TO ROOT ('.') -> .ORG SPIRE -> oceanlab.org DOME TO STAMP 198.51.100.42."
      );
      setShowSummaryOverlay(false);
      setFailureNotice(null);
    } else if (level === 3) {
      speak(
        "Mission 3: Sunlit Library Bookshop! Help the shopkeeper resolve three HTTP requests. Drag the Updated Catalog to fix 404 Not Found, drag the Assistant Clerk to cure 503 Crowded Counter, and drag the Port-443 TLS Pass to unlock 403 Forbidden!"
      );
      setStatusMessage(
        "DRAG UPDATED CATALOG (FIX 404), DRAG ASSISTANT CLERK (FIX 503), AND DRAG TLS PASS (FIX 403)."
      );
      setShowSummaryOverlay(false);
      setFailureNotice(null);
    }
  }, [level, speak]);

  // ── Ambient Simulation Loop (60 FPS) ───────────────────────────────
  useEffect(() => {
    let lastTime = performance.now();
    let animId: number;

    const loop = (time: number) => {
      const dt = Math.min((time - lastTime) / 1000, 0.1);
      lastTime = time;
      setAnimTime((prev) => prev + dt);

      // Level 1: Animate rising 4K video spheres in optical tube
      setDataSpheres((prev) =>
        prev.map((s) => {
          let speed = irisWide ? 130 : 45;
          if (!irisWide && s.y <= 285 && s.y >= 250) {
            speed = 10;
          }
          let ny = s.y - speed * dt;
          if (ny < 135) ny = 430;
          return { ...s, y: ny };
        })
      );

      // Level 1: Keyboard steering (ArrowUp/Down and W/S) inside loop
      if (level === 1) {
        const keys = keysPressedRef.current;
        const up = keys["arrowup"] || keys["w"];
        const down = keys["arrowdown"] || keys["s"];
        if (up || down) {
          const steerSpeed = 220;
          setDroneTargetY((prev) => {
            let next = prev;
            if (up) next -= steerSpeed * dt;
            if (down) next += steerSpeed * dt;
            return Math.max(175, Math.min(445, next));
          });
        }
      }

      // Level 1: Latency Physics (Subsea 12ms vs Satellite 480ms)
      const now = performance.now();
      depthHistoryRef.current.push({ time: now, depth: droneTargetY });
      if (depthHistoryRef.current.length > 150) {
        depthHistoryRef.current = depthHistoryRef.current.filter((item) => now - item.time < 2000);
      }

      if (l1Route === "subsea") {
        const lerpFactor = Math.min(1, dt * 22);
        setDroneActualY((prev) => {
          const next = prev + (droneTargetY - prev) * lerpFactor;
          droneActualYRef.current = next;
          return next;
        });
      } else {
        const targetTime = now - 480;
        let delayedTarget = droneTargetY;
        const history = depthHistoryRef.current;
        if (history.length > 0) {
          let found: number | null = null;
          for (let i = history.length - 1; i >= 0; i--) {
            if (history[i].time <= targetTime) {
              found = history[i].depth;
              break;
            }
          }
          if (found !== null) {
            delayedTarget = found;
          } else {
            delayedTarget = history[0].depth;
          }
        }
        const satLerpFactor = Math.min(1, dt * 14);
        setDroneActualY((prev) => {
          const next = prev + (delayedTarget - prev) * satLerpFactor;
          droneActualYRef.current = next;
          return next;
        });
      }

      // Live TTL countdown: 1s per second inside RAF loop when l2Ttl > 0
      if (level === 2 && l2Ttl > 0) {
        if (now - lastTtlTickRef.current >= 1000) {
          lastTtlTickRef.current = now;
          setL2Ttl((prev) => Math.max(0, prev - 1));
        }
      }

      // Update particles
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx * dt * 45,
            y: p.y + p.vy * dt * 45,
            life: p.life - dt,
          }))
          .filter((p) => p.life > 0)
      );

      animId = requestAnimationFrame(loop);
    };

    animId = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animId);
  }, [level, irisWide, l1Route, droneTargetY]);

  // ── LEVEL 1: Submersible Obstacle Course Run ────────────────────────
  const triggerL1Collision = useCallback(
    (reason: string) => {
      playError();
      setDroneCollision(true);
      setDroneRunActive(false);

      if (l1Route === "satellite") {
        setFailureNotice(
          `COLLISION DETECTED: ${reason} (High 480ms latency delayed steering controls!)`
        );
        speak("Collision! High satellite latency delayed your steering input. Switch to direct 12ms subsea fiber!");
      } else {
        setFailureNotice(
          "COLLISION DETECTED: Claw Bot-3 clipped the coral arch! Drag the Depth Gauge smoothly through the open gap."
        );
        speak("Collision! Claw Bot-3 clipped the coral arch. Drag the Depth Gauge smoothly through the open gap.");
      }
      spawnParticles(droneX, droneActualYRef.current, "#ef4444", 25);
    },
    [l1Route, droneX, playError, speak, spawnParticles]
  );

  const handleStartDroneRun = useCallback(() => {
    if (droneRunActive) return;

    playClick();
    playSwitch();
    setDroneRunActive(true);
    setDroneCollision(false);
    setFailureNotice(null);
    setShowSummaryOverlay(false);
    setDroneX(260);

    let currX = 260;
    const interval = setInterval(() => {
      currX += 5.5;
      setDroneX(currX);

      const liveY = droneActualYRef.current;

      // Arch 1 check
      if (currX >= 435 && currX <= 465) {
        if (liveY < 275 || liveY > 425) {
          triggerL1Collision("Arch 1: Claw Bot-3 clipped upper coral ridge!");
          clearInterval(interval);
          return;
        }
      }

      // Arch 2 check
      if (currX >= 655 && currX <= 685) {
        if (liveY < 195 || liveY > 345) {
          triggerL1Collision("Arch 2: Claw Bot-3 collided with seamount spire!");
          clearInterval(interval);
          return;
        }
      }

      // Arch 3 check
      if (currX >= 865 && currX <= 895) {
        if (liveY < 325 || liveY > 475) {
          triggerL1Collision("Arch 3: Claw Bot-3 hit basalt trench wall!");
          clearInterval(interval);
          return;
        }
      }

      // Complete course
      if (currX >= 1000) {
        clearInterval(interval);
        setDroneRunActive(false);

        if (!irisWide) {
          playError();
          setFailureNotice("BANDWIDTH ERROR: 4K Video feed choked at 10 Mbps! Widen the brass iris valve to 100 Mbps.");
          speak("The drone reached the pod, but the 4K stream choked at 10 Mbps! Widen the brass iris valve.");
          return;
        }

        if (l1Route !== "subsea") {
          playError();
          setFailureNotice("LATENCY WARNING: Course completed, but 480ms ping causes dangerous piloting risk. Use 12ms fiber.");
          speak("High latency risk! Connect direct subsea fiber for mission certification.");
          return;
        }

        playSuccess();
        confetti({ particleCount: 75, spread: 65, origin: { y: 0.55 } });
        setScore(35);
        speak(
          "Outstanding! Bandwidth iris is wide at 100 Mbps, and 12ms subsea fiber gave Claw Bot-3 instant steering response through all three arches! Mission 1 complete!"
        );
        setStatusMessage("MISSION 1 COMPLETE: 100 Mbps 4K STREAMING & 12ms SUBSEA STEERING CERTIFIED!");
        setShowSummaryOverlay(true);
      }
    }, 45);
  }, [
    droneRunActive,
    irisWide,
    l1Route,
    playClick,
    playSwitch,
    playSuccess,
    playError,
    speak,
    triggerL1Collision,
  ]);

  // ── LEVEL 2: Visual 4-Wave Mechanics & Animated Flight ─────────────
  // Smooth Drone Flight Animation between Zeppelin and Target Spires
  const animateDroneFlight = useCallback(
    (targetX: number, targetY: number, onArrival: () => void) => {
      if (droneFlying || l2AirshipFlying || l2AirshipBouncing) return;
      setDroneFlying(true);
      const homeX = 295;
      const homeY = 315;
      let p = 0;

      // Phase 1: Fly out to target server (250ms)
      const flyOutTimer = setInterval(() => {
        p += 0.14;
        if (p >= 1) {
          clearInterval(flyOutTimer);
          setPacketPos({ x: targetX, y: targetY });
          onArrival();

          // Phase 2: Pause briefly at server, then return home carrying referral clue
          setTimeout(() => {
            let pBack = 0;
            const flyBackTimer = setInterval(() => {
              pBack += 0.14;
              if (pBack >= 1) {
                clearInterval(flyBackTimer);
                setPacketPos({ x: homeX, y: homeY });
                setDroneFlying(false);
              } else {
                setPacketPos({
                  x: targetX + (homeX - targetX) * pBack,
                  y: targetY + (homeY - targetY) * pBack,
                });
              }
            }, 20);
          }, 350);
        } else {
          setPacketPos({
            x: homeX + (targetX - homeX) * p,
            y: homeY + (targetY - homeY) * p,
          });
        }
      }, 20);
    },
    [droneFlying, l2AirshipFlying, l2AirshipBouncing]
  );

  const launchAirshipFlight = useCallback(
    (waveNum: 1 | 2 | 3 | 4, isStaleTest = false) => {
      setL2AirshipFlying(true);
      setL2GateAlert(null);
      let curX = 185;
      const targetX = isStaleTest ? 910 : 1040; // Fly to vacant old spot if testing stale record

      const flightInterval = setInterval(() => {
        curX += 26;
        setL2AirshipX(curX);

        if (curX >= targetX) {
          clearInterval(flightInterval);

          // Wave 3 Stale Test: Gate flashes OLD IP! ADDRESS MOVED and bounces airship back!
          if (isStaleTest) {
            playError();
            setL2AirshipFlying(false);
            setL2AirshipBouncing(true);
            setL2GateAlert("OLD IP! ADDRESS MOVED • DESTINATION VACANT!");
            setL2Banner({ text: "OLD IP! ADDRESS MOVED -> PULL 'SKIP +15s (EXPIRE TTL)' LEVER!", isError: true });
            speak("Old IP failed! The oceanlab.org server moved to a new address. Pull the Skip 15s lever to clear stale cache, then re-query!");

            // Bounce airship back to starting runway
            let backX = targetX;
            const bounceInterval = setInterval(() => {
              backX -= 40;
              setL2AirshipX(backX);
              if (backX <= 185) {
                clearInterval(bounceInterval);
                setL2AirshipX(185);
                setL2AirshipBouncing(false);
                setL2AirshipIp("[ ? . ? . ? . ? ]");
              }
            }, 30);
            return;
          }

          // Successful Gate Entry
          setL2AirshipFlying(false);
          playSuccess();
          setL2DockedCount((prev) => prev + 1);

          if (waveNum === 1) {
            setL2Wave(2);
            setL2AirshipX(185);
            setL2AirshipIp("[ ? . ? . ? . ? ]");
            setL2Conn("idle");
            setL2SwitchPos("locked");
            setL2Banner(null);
            setL2Hops(0);
            setL2Latency(0);
            speak(
              "Airship 1 docked! Airship 2 arrived for cam.oceanlab.org. Notice the Crystal Scanner shows a 1ms MATCH! Tap the Cache Crystal for an instant shortcut!"
            );
            setStatusMessage("WAVE 2: TAP CACHE CRYSTAL FOR 1ms SHORTCUT (0 HOPS)!");
          } else if (waveNum === 2) {
            setL2Wave(3);
            setL2AirshipX(185);
            setL2AirshipIp("[ ? . ? . ? . ? ]");
            setL2Conn("idle");
            setL2SwitchPos("locked");
            setL2Banner(null);
            setL2Hops(0);
            setL2Latency(0);
            speak(
              "Zero-hop shortcut complete! Airship 3 arrived. Look at the Crystal Scanner: the server moved to IP .99! Pull the SKIP 15s lever to clear stale cache!"
            );
            setStatusMessage("WAVE 3: PULL 'SKIP +15s (EXPIRE TTL)' LEVER TO INVALIDATE STALE CACHE!");
          } else if (waveNum === 3) {
            setL2Wave(4);
            setL2AirshipX(185);
            setL2AirshipIp("[ ? . ? . ? . ? ]");
            setL2Conn("idle");
            setL2SwitchPos("locked");
            setL2Banner(null);
            setL2Hops(0);
            setL2Latency(0);
            speak(
              "Fresh IP stamped and docked! Now Airship 4 arrived with weather.nasa.gov. Route via Root and flip the TLD switch to dot-gov!"
            );
            setStatusMessage("WAVE 4: ROUTE weather.nasa.gov: ROOT ('.') -> FLIP SWITCH TO .GOV -> nasa.gov.");
          } else if (waveNum === 4) {
            confetti({ particleCount: 95, spread: 75, origin: { y: 0.55 } });
            setScore(70);
            speak(
              "Outstanding victory! Mission 2 complete! You mastered right-to-left DNS resolution, cache shortcuts, and TTL expiration!"
            );
            setStatusMessage("MISSION 2 COMPLETE: HIERARCHY, LATENCY & TTL CACHE EXPIRATION CERTIFIED!");
            setShowSummaryOverlay(true);
          }
        }
      }, 30);
    },
    [playError, playSuccess, speak]
  );

  // Step 1: Connect / Drop on Root Spire (585, 135) - "WORLD INDEX"
  const handleConnectRootCore = useCallback(() => {
    if (l2AirshipFlying || l2AirshipBouncing) return;

    if (l2Wave === 2 && l2Ttl > 0) {
      playBeep();
      setL2Banner({ text: "SHORTCUT AVAILABLE -> USE CACHE CRYSTAL (0 HOPS • 1ms)!" });
      speak("Domain is in cache! Tap the Cache Memory Crystal.");
      return;
    }

    playSuccess();
    setL2Conn("root");
    setL2Hops(1);
    setL2Latency(110);
    const targetTld = l2Wave === 4 ? ".GOV" : ".ORG";
    const clue = `1. ROOT SAYS: Ask ${targetTld} TLD Spire`;
    setL2Banner({ text: clue });
    speak(clue);
    spawnParticles(585, 135, "#10b981", 18);
  }, [l2AirshipFlying, l2AirshipBouncing, l2Wave, l2Ttl, playBeep, playSuccess, speak, spawnParticles]);

  const handleConnectRoot = useCallback(() => {
    playClick();
    animateDroneFlight(585, 135, handleConnectRootCore);
  }, [playClick, animateDroneFlight, handleConnectRootCore]);

  // Step 2: Interactive TLD Track Switch Flipping (.COM, .ORG, .GOV)
  const handleFlipTldSwitch = useCallback(
    (tld: ".COM" | ".ORG" | ".GOV") => {
      playClick();
      if (l2AirshipFlying || l2AirshipBouncing) return;

      if (l2Wave === 2 && l2Ttl > 0) {
        playBeep();
        setL2Banner({ text: "SHORTCUT AVAILABLE -> USE CACHE CRYSTAL (0 HOPS)!" });
        speak("Domain is in cache! Use the Cache Memory Crystal.");
        return;
      }

      if (l2Conn === "idle") {
        playError();
        setL2SpireShake("switch");
        setTimeout(() => setL2SpireShake(null), 500);
        setL2Banner({ text: "TRACK SWITCH LOCKED: QUERY ROOT ('.') FIRST!", isError: true });
        speak("Track switch locked! Start at the World Index Root Spire first.");
        return;
      }

      const expectedTld = l2Wave === 4 ? ".GOV" : ".ORG";
      const domainName = l2Wave === 4 ? "weather.nasa.gov" : "cam.oceanlab.org";

      if (tld !== expectedTld) {
        playError();
        setL2SpireShake(tld);
        setTimeout(() => setL2SpireShake(null), 500);
        setL2Latency((prev) => prev + 120); // Penalty delay!
        setL2Banner({
          text: `WRONG EXTENSION (+120ms): ${domainName} ENDS IN ${expectedTld}!`,
          isError: true,
        });
        speak(`Wrong extension! ${domainName} ends in ${expectedTld.toLowerCase()}.`);
        return;
      }

      playSwitch();
      setL2SwitchPos(tld);
      setL2Conn("tld");
      setL2Hops(2);
      setL2Latency((prev) => prev + 110);

      // Octet IP Builder: Stamp first 2 octets piece by piece!
      const partialIp = l2Wave === 4 ? "192.0.[ ? . ? ]" : "198.51.[ ? . ? ]";
      setL2AirshipIp(partialIp);

      const clue = tld === ".GOV" ? "2. .GOV SAYS: Ask nasa.gov" : "2. .ORG SAYS: Ask oceanlab.org";
      setL2Banner({ text: clue });
      speak(clue);

      const targetY = tld === ".ORG" ? 215 : 335;
      spawnParticles(785, targetY, "#38bdf8", 20);
      spawnParticles(185, 455, "#38bdf8", 20);
    },
    [l2AirshipFlying, l2AirshipBouncing, l2Wave, l2Ttl, l2Conn, playClick, playBeep, playError, playSwitch, speak, spawnParticles]
  );

  const handleConnectTld = useCallback(
    (tld: ".COM" | ".ORG" | ".GOV") => {
      playClick();
      const targetY = tld === ".COM" ? 95 : tld === ".ORG" ? 215 : 335;
      animateDroneFlight(785, targetY, () => handleFlipTldSwitch(tld));
    },
    [playClick, animateDroneFlight, handleFlipTldSwitch]
  );

  // Step 3: Connect / Drop on Authoritative Island Dome - "ADDRESS OWNER"
  const handleConnectAuthCore = useCallback(
    (auth: "oceanlab.org" | "nasa.gov") => {
      if (l2AirshipFlying || l2AirshipBouncing) return;

      if (l2Wave === 2 && l2Ttl > 0) {
        playBeep();
        setL2Banner({ text: "USE CACHE CRYSTAL (0 HOPS • 1ms)!" });
        speak("Use the Cache Memory Crystal for zero-hop lookup.");
        return;
      }

      if (l2Conn !== "tld") {
        playError();
        setL2SpireShake(auth);
        setTimeout(() => setL2SpireShake(null), 500);
        setL2Banner({ text: "REFERRAL CHAIN REQUIRED: QUERY ROOT -> MATCHING TLD FIRST!", isError: true });
        speak("Complete the Root and TLD referrals before contacting the Authoritative dome!");
        return;
      }

      const expectedAuth = l2Wave === 4 ? "nasa.gov" : "oceanlab.org";
      if (auth !== expectedAuth) {
        playError();
        setL2SpireShake(auth);
        setTimeout(() => setL2SpireShake(null), 500);
        setL2Latency((prev) => prev + 120);
        setL2Banner({ text: `WRONG OWNER (+120ms): QUERYING FOR ${expectedAuth}!`, isError: true });
        speak(`Wrong server! Connect to ${expectedAuth}.`);
        return;
      }

      playSuccess();
      setL2Conn("auth");
      setL2Hops(3);
      setL2Latency(340);

      // In Wave 3, return fresh IP .99 to prove cache expiration
      const resolvedIp = l2Wave === 4 ? "192.0.2.88" : l2Wave === 3 ? "198.51.100.99" : "198.51.100.42";
      const resolvedDomain = l2Wave === 4 ? "weather.nasa.gov" : "cam.oceanlab.org";

      const clue = `3. OWNER SAYS: IP is ${resolvedIp}!`;
      setL2Banner({ text: clue });

      // Octet IP Builder: Final octets stamped! Full IP ready!
      setL2AirshipIp(resolvedIp);
      setL2CachedDomain(resolvedDomain);
      setL2CachedIp(resolvedIp);
      setL2Ttl(15); // Re-energize TTL ring with 15s countdown
      lastTtlTickRef.current = performance.now();

      const authX = auth === "oceanlab.org" && l2Wave === 3 ? 955 : 920;
      const authY = auth === "oceanlab.org" ? 205 : 325;
      spawnParticles(authX, authY, "#10b981", 24);
      spawnParticles(185, 455, "#10b981", 30);

      speak(`Authoritative dome unlocked! IP is ${resolvedIp}! Full IP stamped onto hull! Pull LAUNCH AIRSHIP to fly!`);
    },
    [l2AirshipFlying, l2AirshipBouncing, l2Wave, l2Ttl, l2Conn, playBeep, playError, playSuccess, speak, spawnParticles]
  );

  const handleConnectAuth = useCallback(
    (auth: "oceanlab.org" | "nasa.gov") => {
      playClick();
      const targetX = auth === "oceanlab.org" && l2Wave === 3 ? 955 : 920;
      const targetY = auth === "oceanlab.org" ? 215 : 335;
      animateDroneFlight(targetX, targetY, () => handleConnectAuthCore(auth));
    },
    [playClick, l2Wave, animateDroneFlight, handleConnectAuthCore]
  );

  // Cache Crystal Tap / Click
  const handleUseCacheCrystal = useCallback(() => {
    playClick();
    if (l2AirshipFlying || l2AirshipBouncing) return;

    if (l2Wave === 1) {
      playError();
      setL2Banner({ text: "CACHE MISS: CRYSTAL EMPTY (0s TTL) • ROUTE VIA ROOT ('.')", isError: true });
      speak("Cache Miss! The crystal core is empty. Route through the World Index Root Spire first.");
      return;
    }

    // Wave 3 Stale Test: Using stale cache before expiring TTL produces a bounce!
    if (l2Wave === 3) {
      if (!l2TimeWarpPulled && l2Ttl > 0) {
        // Stale lookup test: airship gets old .42 IP and flies to vacant old spot!
        playSwitch();
        setL2Hops(0);
        setL2Latency(1);
        setL2GoldenSpark(true);
        setTimeout(() => setL2GoldenSpark(false), 800);
        setL2AirshipIp("198.51.100.42"); // Stale IP!
        setL2Banner({ text: "STALE CACHE APPLIED: 198.51.100.42 (PULL LAUNCH AIRSHIP TO TEST...)" });
        speak("Airship loaded with cached IP 198.51.100.42. Pull LAUNCH AIRSHIP to test destination!");
        return;
      } else {
        // Already expired
        playError();
        setL2Banner({ text: "CACHE EXPIRED (TTL = 0s) • RE-QUERY HIERARCHY FOR FRESH IP!", isError: true });
        speak("Cache Expired! The TTL has reached zero. Re-query Root and .ORG to fetch the updated IP address!");
        return;
      }
    }

    if (l2Wave === 4) {
      playError();
      setL2Banner({ text: "CACHE MISS: weather.nasa.gov NOT IN CRYSTAL!", isError: true });
      speak("Cache Miss! weather.nasa.gov is not stored in the crystal. Route through Root and .GOV!");
      return;
    }

    // Wave 2 Cache Hit: 1ms shortcut!
    playSuccess();
    setL2Hops(0);
    setL2Latency(1);
    setL2GoldenSpark(true);
    setTimeout(() => setL2GoldenSpark(false), 900);
    setL2Banner({ text: "0 HOPS • 1ms CACHE HIT: GOLDEN SPARK SHORTCUT!" });
    setL2AirshipIp("198.51.100.42");
    spawnParticles(295, 215, "#eab308", 30);
    spawnParticles(185, 455, "#eab308", 30);
    speak("Instant zero-hop cache hit! One millisecond latency. Pull LAUNCH AIRSHIP to fly!");
  }, [l2AirshipFlying, l2AirshipBouncing, l2Wave, l2Ttl, l2TimeWarpPulled, playClick, playError, playSuccess, playSwitch, speak, spawnParticles]);

  // Wave 3: SKIP +15s (EXPIRE TTL) Lever Handler
  const handlePullTimeWarp = useCallback(() => {
    if (l2TimeWarpPulled) return;
    playClick();
    playSwitch();
    setL2TimeWarpPulled(true);
    setL2Ttl(0); // Drain TTL to 0s
    setL2CachedIp(null); // Clear stale record
    spawnParticles(295, 360, "#ef4444", 25);
    setL2Banner({ text: "SKIP +15s ACTIVATED: TTL = 0s • STALE CACHE WIPED!", isError: true });
    setL2GateAlert(null);
    speak("Skip 15 seconds activated! TTL reached zero and stale cache was wiped. Now re-query the spires to fetch fresh IP 198.51.100.99!");
  }, [l2TimeWarpPulled, playClick, playSwitch, speak, spawnParticles]);

  // ── Drag-to-Query Pointer Listeners for DNS Query Drone ────────────
  const handlePacketPointerDown = useCallback(
    (e: React.PointerEvent) => {
      e.preventDefault();
      if (l2AirshipFlying || l2AirshipBouncing || droneFlying) return;
      playClick();
      setPacketDragging(true);

      const updatePos = (clientX: number, clientY: number) => {
        if (!svgRef.current) return;
        const pt = svgRef.current.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const ctm = svgRef.current.getScreenCTM();
        if (!ctm) return;
        const svgPt = pt.matrixTransform(ctm.inverse());
        setPacketPos({ x: svgPt.x, y: svgPt.y });
      };

      updatePos(e.clientX, e.clientY);

      const onMove = (ev: PointerEvent) => {
        updatePos(ev.clientX, ev.clientY);
      };

      const onUp = (ev: PointerEvent) => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        setPacketDragging(false);

        if (!svgRef.current) {
          setPacketPos(packetHome);
          return;
        }

        const pt = svgRef.current.createSVGPoint();
        pt.x = ev.clientX;
        pt.y = ev.clientY;
        const ctm = svgRef.current.getScreenCTM();
        if (!ctm) {
          setPacketPos(packetHome);
          return;
        }
        const dropPt = pt.matrixTransform(ctm.inverse());

        // Check drop targets
        if (Math.hypot(dropPt.x - 585, dropPt.y - 135) < 65) {
          handleConnectRootCore();
        } else if (Math.hypot(dropPt.x - 785, dropPt.y - 95) < 55) {
          handleFlipTldSwitch(".COM");
        } else if (Math.hypot(dropPt.x - 785, dropPt.y - 215) < 55) {
          handleFlipTldSwitch(".ORG");
        } else if (Math.hypot(dropPt.x - 785, dropPt.y - 335) < 55) {
          handleFlipTldSwitch(".GOV");
        } else if (Math.hypot(dropPt.x - (l2Wave === 3 ? 955 : 920), dropPt.y - 215) < 65) {
          handleConnectAuthCore("oceanlab.org");
        } else if (Math.hypot(dropPt.x - 920, dropPt.y - 335) < 65) {
          handleConnectAuthCore("nasa.gov");
        } else if (Math.hypot(dropPt.x - 295, dropPt.y - 215) < 50) {
          handleUseCacheCrystal();
        }

        // Return drone smoothly home
        setPacketPos(packetHome);
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [l2AirshipFlying, l2AirshipBouncing, droneFlying, l2Wave, playClick, handleConnectRootCore, handleFlipTldSwitch, handleConnectAuthCore, handleUseCacheCrystal]
  );
  // ── LEVEL 3: Sunlit Library Bookshop Mechanics ──────────────────────
  const handleToggleGear1 = useCallback(() => {
    playClick();
    playSwitch();
    const next = !gear1Rotated;
    setGear1Rotated(next);
    setChannel1Flare("none");
    setFailureNotice(null);
    spawnParticles(730, 230, "#38bdf8", 14);
    if (next) {
      speak("Updated catalog handed over! Reef Map book found on shelf v2 reef-map. 404 Not Found resolved!");
    }
  }, [gear1Rotated, playClick, playSwitch, speak, spawnParticles]);

  const handleToggleSluice2 = useCallback(() => {
    playClick();
    playSwitch();
    const next = !sluice2Split;
    setSluice2Split(next);
    setChannel2Flare("none");
    setFailureNotice(null);
    spawnParticles(840, 230, "#0284c7", 14);
    if (next) {
      speak("Assistant Clerk opened second counter! Customer line divided 50/50. 503 Service Unavailable resolved!");
    }
  }, [sluice2Split, playClick, playSwitch, speak, spawnParticles]);

  const handleToggleKey3 = useCallback(() => {
    playClick();
    playSwitch();
    const next = !key3Inserted;
    setKey3Inserted(next);
    setChannel3Flare("none");
    setFailureNotice(null);
    spawnParticles(260, 230, "#ca8a04", 16);
    if (next) {
      speak("VIP Security Pass with Port-443 TLS presented! Archive room unlocked. 403 Forbidden cleared!");
    }
  }, [key3Inserted, playClick, playSwitch, speak, spawnParticles]);

  // Pointer drag listener for Prop 1, Prop 2, and Prop 3
  const handlePropPointerDown = useCallback(
    (propId: 1 | 2 | 3, e: React.PointerEvent) => {
      e.preventDefault();
      playClick();
      setDraggedProp(propId);

      const updatePos = (clientX: number, clientY: number) => {
        if (!svgRef.current) return;
        const pt = svgRef.current.createSVGPoint();
        pt.x = clientX;
        pt.y = clientY;
        const ctm = svgRef.current.getScreenCTM();
        if (!ctm) return;
        const svgPt = pt.matrixTransform(ctm.inverse());
        if (propId === 1) setProp1Pos({ x: svgPt.x, y: svgPt.y });
        else if (propId === 2) setProp2Pos({ x: svgPt.x, y: svgPt.y });
        else if (propId === 3) setProp3Pos({ x: svgPt.x, y: svgPt.y });
      };

      updatePos(e.clientX, e.clientY);

      const onMove = (ev: PointerEvent) => {
        updatePos(ev.clientX, ev.clientY);
      };

      const onUp = (ev: PointerEvent) => {
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        setDraggedProp(null);

        if (!svgRef.current) {
          setProp1Pos(prop1Home);
          setProp2Pos(prop2Home);
          setProp3Pos(prop3Home);
          return;
        }

        const pt = svgRef.current.createSVGPoint();
        pt.x = ev.clientX;
        pt.y = ev.clientY;
        const ctm = svgRef.current.getScreenCTM();
        if (!ctm) {
          setProp1Pos(prop1Home);
          setProp2Pos(prop2Home);
          setProp3Pos(prop3Home);
          return;
        }
        const dropPt = pt.matrixTransform(ctm.inverse());

        if (propId === 1) {
          const hitShopkeeper = Math.hypot(dropPt.x - 745, dropPt.y - 240) < 160 || Math.hypot(dropPt.x - 730, dropPt.y - 230) < 160;
          const hitBookshelf = Math.hypot(dropPt.x - 471, dropPt.y - 142) < 160 || Math.hypot(dropPt.x - 535, dropPt.y - 200) < 160;
          const hitCustomer = Math.hypot(dropPt.x - 240, dropPt.y - 250) < 160;
          if (hitShopkeeper || hitBookshelf || hitCustomer) {
            setL3Situation(1);
            if (!gear1Rotated) {
              handleToggleGear1();
              setTimeout(() => {
                if (!sluice2Split) setL3Situation(2);
              }, 1400);
            }
          }
          setProp1Pos(prop1Home);
        } else if (propId === 2) {
          const hitCounter = Math.hypot(dropPt.x - 880, dropPt.y - 250) < 180 || Math.hypot(dropPt.x - 810, dropPt.y - 230) < 180;
          const hitCrowd = Math.hypot(dropPt.x - 240, dropPt.y - 250) < 180 || Math.hypot(dropPt.x - 710, dropPt.y - 250) < 180;
          if (hitCounter || hitCrowd) {
            setL3Situation(2);
            if (!sluice2Split) {
              handleToggleSluice2();
              setTimeout(() => {
                if (!key3Inserted) setL3Situation(3);
              }, 1600);
            }
          }
          setProp2Pos(prop2Home);
        } else if (propId === 3) {
          const hitCustomer = Math.hypot(dropPt.x - 240, dropPt.y - 250) < 180 || Math.hypot(dropPt.x - 955, dropPt.y - 250) < 180;
          const hitVipDoor = Math.hypot(dropPt.x - 1075, dropPt.y - 195) < 180 || Math.hypot(dropPt.x - 985, dropPt.y - 210) < 180;
          if (hitCustomer || hitVipDoor) {
            setL3Situation(3);
            if (!key3Inserted) {
              handleToggleKey3();
            }
          }
          setProp3Pos(prop3Home);
        }
      };

      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [gear1Rotated, sluice2Split, key3Inserted, handleToggleGear1, handleToggleSluice2, handleToggleKey3, playClick, prop1Home, prop2Home, prop3Home]
  );

  const handleDispatchHttpBoats = useCallback(() => {
    if (httpRunActive) return;

    playClick();
    playSwitch();
    setHttpRunActive(true);
    setFailureNotice(null);
    setShowSummaryOverlay(false);
    setHttpWaveProgress(0);

    let progress = 0;
    const interval = setInterval(() => {
      progress += 4;
      setHttpWaveProgress(progress);

      if (progress >= 100) {
        clearInterval(interval);
        setHttpRunActive(false);

        const ch1Ok = gear1Rotated;
        const ch2Ok = sluice2Split;
        const ch3Ok = key3Inserted;

        setChannel1Flare(ch1Ok ? "200" : "404");
        setChannel2Flare(ch2Ok ? "200" : "503");
        setChannel3Flare(ch3Ok ? "200" : "403");

        if (ch1Ok && ch2Ok && ch3Ok) {
          playSuccess();
          confetti({ particleCount: 130, spread: 85, origin: { y: 0.5 } });
          setScore(100);
          speak(
            "Sensational triumph! All three library bookshop requests resolved! Catalog update fixed 404, Assistant Clerk cured 503 rush, and Port-443 TLS pass cleared 403 forbidden. Three 200 OK book deliveries completed!"
          );
          setStatusMessage("MISSION 3 SUCCESS: ALL THREE REQUESTS DELIVERED 200 OK • LAB COMPLETE!");

          setTimeout(() => {
            reportComplete({ labId: "internet-noc-lab", points: 100, timeTaken: getTimeTaken() });
            setShowSummaryOverlay(false);
            setIsCompleted(true);
          }, 2400);
        } else {
          playError();
          const list = [];
          if (!ch1Ok) list.push("Situation 1: 404 NOT FOUND (Shelf #999 Empty - Drag Updated Catalog)");
          if (!ch2Ok) list.push("Situation 2: 503 SERVICE UNAVAILABLE (Counter Jammed - Drag Assistant Clerk)");
          if (!ch3Ok) list.push("Situation 3: 403 FORBIDDEN (No Pass - Drag VIP Pass TLS 443)");
          setFailureNotice(list.join(" • "));
          speak("Some requests could not be delivered! Drag the props to solve all three situations.");
          setStatusMessage("HTTP INCIDENTS DETECTED! PROVIDE CATALOG (404), ASSISTANT CLERK (503), AND TLS PASS (403).");
        }
      }
    }, 45);
  }, [
    httpRunActive,
    gear1Rotated,
    sluice2Split,
    key3Inserted,
    playClick,
    playSwitch,
    playSuccess,
    playError,
    speak,
    reportComplete,
    getTimeTaken,
  ]);

  // ── Next Mission Navigation ─────────────────────────────────────────
  const handleNextMission = useCallback(() => {
    playClick();
    playSwitch();
    setLevel((prev) => ((prev < 3 ? prev + 1 : 3) as LevelId));
    setShowSummaryOverlay(false);
    setFailureNotice(null);
  }, [playClick, playSwitch]);

  // ── Reset Handler ──────────────────────────────────────────────────
  const handleReset = useCallback(() => {
    playClick();
    setLevel(1);
    setScore(0);
    setIsCompleted(false);
    setShowSummaryOverlay(false);
    setFailureNotice(null);
    setIrisWide(false);
    setL1Route("satellite");
    setDroneRunActive(false);
    setDroneTargetY(350);
    setDroneActualY(350);
    droneActualYRef.current = 350;
    depthHistoryRef.current = [];
    setDroneX(260);
    setDroneCollision(false);

    // Reset Level 2 state
    setL2Wave(1);
    setL2Conn("idle");
    setL2Ttl(0);
    setL2CachedDomain(null);
    setL2CachedIp(null);
    setL2Hops(0);
    setL2Latency(0);
    setL2AirshipIp("[ ? . ? . ? . ? ]");
    setL2AirshipX(185);
    setL2AirshipFlying(false);
    setL2AirshipBouncing(false);
    setL2DockedCount(0);
    setL2TimeWarpPulled(false);
    setL2GoldenSpark(false);
    setDroneFlying(false);
    setL2SwitchPos("locked");
    setL2Banner(null);
    setL2GateAlert(null);
    setPacketPos({ x: 295, y: 315 });
    // Reset Level 3 state
    setL3Situation(1);
    setDraggedProp(null);
    setProp1Pos({ x: 172, y: 450 });
    setProp2Pos({ x: 458, y: 450 });
    setProp3Pos({ x: 742, y: 450 });
    setGear1Rotated(false);
    setSluice2Split(false);
    setKey3Inserted(false);
    setHttpRunActive(false);
    setChannel1Flare("none");
    setChannel2Flare("none");
    setChannel3Flare("none");
    setStatusMessage(
      "MISSION 1: Widen the brass iris valve to 100 Mbps and switch from 480ms Satellite to 12ms Subsea Fiber."
    );
    speak("Lab reset. Configure bandwidth and latency in the canyon trench.");
  }, [playClick, speak]);

  // ── Hint Handler ───────────────────────────────────────────────────
  const handleHint = useCallback(() => {
    playClick();
    if (level === 1) {
      speak("Drag the Depth Gauge, use Arrow keys, or click anywhere in the ocean to steer Claw Bot-3! Click the brass iris valve to open 100 Mbps bandwidth, and tap the seabed cable to switch to 12ms subsea fiber!");
    } else if (level === 2) {
      speak("Drag the glowing Query Packet onto Root, then matching TLD, then authoritative dome! On duplicate waves, use the Cache Crystal before TTL expires!");
    } else if (level === 3) {
      speak("In the library bookshop, drag the Updated Catalog onto the shopkeeper to fix 404, drag the Assistant Clerk behind the counter to split the 503 crowd, and drag the golden Port-443 TLS Pass to unlock the 403 VIP archive!");
    }
    setShowHintModal(true);
  }, [level, playClick, speak]);

  return (
    <LabShell
      labId="internet-noc-lab"
      title="Internet NOC: Bandwidth, Latency & DNS"
      subtitle="Master physical bandwidth pipes, latency speeds, DNS hierarchies, and HTTP status code mechanics"
      score={score}
      onReset={handleReset}
      fullBleed={true}
      navExtra={
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleHint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-extrabold border border-amber-600 shadow-sm text-xs transition cursor-pointer"
            title="Hint"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Hint</span>
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-white font-extrabold border border-slate-900 shadow-sm text-xs transition cursor-pointer"
            title="Reset"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      }
    >
      <div className="relative w-full h-full overflow-hidden select-none bg-sky-200 p-0 m-0 font-sans">
        {/* ====================================================================
            FULL-BLEED BACKGROUND SVG (STRETCHES 100% EDGE-TO-EDGE)
            3 Completely Distinct Visual Environments
            ==================================================================== */}
        <svg
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
          className="absolute inset-0 w-full h-full pointer-events-none"
        >
          <defs>
            {/* Level 1 Gradients */}
            <linearGradient id="bgL1Sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="100%" stopColor="#bae6fd" />
            </linearGradient>
            <linearGradient id="bgL1Water" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0284c7" />
              <stop offset="30%" stopColor="#0369a1" />
              <stop offset="70%" stopColor="#075985" />
              <stop offset="100%" stopColor="#0c4a6e" />
            </linearGradient>
            <linearGradient id="bgL1Seabed" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>

            {/* Level 2 Gradients: Bright Sunlit Sky Blue (Zero Dark Navy/Black) */}
            <linearGradient id="bgL2Sky" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" />
              <stop offset="45%" stopColor="#bae6fd" />
              <stop offset="100%" stopColor="#f0f9ff" />
            </linearGradient>
            <linearGradient id="bgL2MountainSnow" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="60%" stopColor="#cbd5e1" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>

            {/* Level 3 Gradients (Sunlit Library Bookshop) */}
            <linearGradient id="bgL3Wall" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fefce8" />
              <stop offset="50%" stopColor="#fef9c3" />
              <stop offset="100%" stopColor="#fef08a" />
            </linearGradient>
            <linearGradient id="bgL3Floor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="40%" stopColor="#f59e0b" />
              <stop offset="100%" stopColor="#d97706" />
            </linearGradient>
          </defs>

          {level === 1 && (
            <>
              <rect x="0" y="0" width="100" height="24" fill="url(#bgL1Sky)" />
              <line x1="0" y1="24" x2="100" y2="24" stroke="#e0f2fe" strokeWidth="0.8" opacity="0.8" />
              <rect x="0" y="24" width="100" height="68" fill="url(#bgL1Water)" />
              <rect x="0" y="92" width="100" height="8" fill="url(#bgL1Seabed)" />
            </>
          )}

          {level === 2 && (
            <>
              <rect x="0" y="0" width="100" height="100" fill="url(#bgL2Sky)" />
              {/* Sunlit Stratospheric Clouds */}
              <g opacity="0.65" fill="#ffffff">
                <ellipse cx="18" cy="22" rx="14" ry="5" />
                <ellipse cx="26" cy="20" rx="9" ry="4" />
                <ellipse cx="62" cy="16" rx="16" ry="6" />
                <ellipse cx="72" cy="14" rx="10" ry="4" />
                <ellipse cx="88" cy="24" rx="12" ry="5" />
              </g>
              {/* Distant Sunlit Snow-Capped Alpine Ridges */}
              <polygon
                points="0,85 15,70 32,83 50,68 68,82 86,67 100,82 100,100 0,100"
                fill="url(#bgL2MountainSnow)"
                opacity="0.85"
              />
              <polygon points="10,75 15,70 20,75" fill="#ffffff" />
              <polygon points="45,73 50,68 55,73" fill="#ffffff" />
              <polygon points="81,71 86,67 91,71" fill="#ffffff" />
            </>
          )}

          {level === 3 && (
            <>
              {/* Sunlit Warm Cream Library Walls */}
              <rect x="0" y="0" width="100" height="64" fill="url(#bgL3Wall)" />
              {/* Soft sunbeams streaming from left windows */}
              <polygon points="0,0 35,0 55,64 12,64" fill="#ffffff" opacity="0.35" />
              <polygon points="15,0 48,0 72,64 35,64" fill="#fef08a" opacity="0.25" />
              {/* Arched crown moulding & warm oak wainscoting line */}
              <line x1="0" y1="64" x2="100" y2="64" stroke="#d97706" strokeWidth="0.8" opacity="0.8" />
              {/* Warm Honey Oak Parquet Floor */}
              <rect x="0" y="64" width="100" height="36" fill="url(#bgL3Floor)" />
              <line x1="0" y1="64" x2="100" y2="64" stroke="#b45309" strokeWidth="0.6" opacity="0.5" />
            </>
          )}
        </svg>

        {/* ====================================================================
            MAIN INTERACTIVE 2D SVG STAGE (1200 x 560)
            Zero White Containers • Daylight Illustrated Game Elements
            ==================================================================== */}
        <svg
          ref={svgRef}
          viewBox="0 0 1200 560"
          className="relative z-10 w-full h-full"
          preserveAspectRatio="xMidYMid meet"
          style={{ fontFamily: "'Plus Jakarta Sans', 'Inter', system-ui, sans-serif" }}
        >
          <defs>
            <linearGradient id="canyonWater" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
              <stop offset="25%" stopColor="#0891b2" stopOpacity="0.45" />
              <stop offset="65%" stopColor="#0369a1" stopOpacity="0.6" />
              <stop offset="100%" stopColor="#082f49" stopOpacity="0.75" />
            </linearGradient>

            <linearGradient id="brassMetallic" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="30%" stopColor="#eab308" />
              <stop offset="70%" stopColor="#ca8a04" />
              <stop offset="100%" stopColor="#854d0e" />
            </linearGradient>

            <linearGradient id="airshipSilver" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#f1f5f9" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>

            <linearGradient id="crystalGlowGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#67e8f9" />
              <stop offset="50%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#0891b2" />
            </linearGradient>

            <linearGradient id="spireStone" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="50%" stopColor="#e2e8f0" />
              <stop offset="100%" stopColor="#94a3b8" />
            </linearGradient>

            <linearGradient id="glassControlTower" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.95" />
              <stop offset="40%" stopColor="#e0f2fe" stopOpacity="0.9" />
              <stop offset="80%" stopColor="#bae6fd" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#7dd3fc" stopOpacity="0.9" />
            </linearGradient>

            <linearGradient id="opticalTube" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.4" />
            </linearGradient>

            <linearGradient id="spotlightCone" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.45" />
              <stop offset="40%" stopColor="#38bdf8" stopOpacity="0.25" />
              <stop offset="85%" stopColor="#0284c7" stopOpacity="0.08" />
              <stop offset="100%" stopColor="#0284c7" stopOpacity="0" />
            </linearGradient>

            <linearGradient id="coralLimestone" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#0e7490" />
              <stop offset="50%" stopColor="#155e75" />
              <stop offset="100%" stopColor="#164e63" />
            </linearGradient>

            <linearGradient id="goldConduit" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fef08a" />
              <stop offset="50%" stopColor="#eab308" />
              <stop offset="100%" stopColor="#ca8a04" />
            </linearGradient>

            <filter id="softGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3.5" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <filter id="laserBeam" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>

            <linearGradient id="woodOak" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="25%" stopColor="#d97706" />
              <stop offset="70%" stopColor="#b45309" />
              <stop offset="100%" stopColor="#78350f" />
            </linearGradient>

            <linearGradient id="counterSurface" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#fde68a" />
              <stop offset="40%" stopColor="#f59e0b" />
              <stop offset="85%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#92400e" />
            </linearGradient>

            <linearGradient id="vaultDoor" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#fef3c7" />
              <stop offset="30%" stopColor="#fde68a" />
              <stop offset="70%" stopColor="#d97706" />
              <stop offset="100%" stopColor="#b45309" />
            </linearGradient>

            <filter id="controlShadow" x="-10%" y="-10%" width="120%" height="120%">
              <feDropShadow dx="0" dy="2.5" stdDeviation="3.5" floodColor="#0f172a" floodOpacity="0.12" />
            </filter>
          </defs>

          {/* ==================================================================
              ENVIRONMENT 1: CORAL CANYON TRENCH & LIVE TELEMETRY
              ================================================================== */}
          {level === 1 && (
            <g>
              <rect x="0" y="135" width="1200" height="380" fill="url(#canyonWater)" />

              {/* Water Caustics */}
              <g opacity="0.25" stroke="#ffffff" strokeWidth="2" fill="none">
                <path d={`M 0,${160 + Math.sin(animTime * 2) * 4} Q 150,${150 + Math.cos(animTime * 1.5) * 6} 300,${160 + Math.sin(animTime * 2) * 4} T 600,${160} T 900,${160} T 1200,${160}`} />
                <path d={`M 0,${190 + Math.cos(animTime * 1.8) * 5} Q 200,${200 + Math.sin(animTime * 2) * 5} 400,${190} T 800,${190} T 1200,${190}`} />
                <path d={`M 0,${230 + Math.sin(animTime * 1.6) * 4} Q 250,${220} 500,${230} T 1000,${230} T 1200,${230}`} />
              </g>

              <line x1="0" y1="135" x2="1200" y2="135" stroke="#e0f2fe" strokeWidth="3" opacity="0.9" />

              {/* Direct Water-Column Steering Plane (x = 280..1100, y = 145..505) */}
              <rect
                x="280"
                y="145"
                width="820"
                height="360"
                fill="transparent"
                className="cursor-crosshair touch-none"
                onPointerDown={handleWaterColumnPointerDown}
              />

              {/* Target Depth Ghost Ring Ahead of Claw Bot-3 */}
              <g opacity="0.85">
                <line
                  x1={droneX + 25}
                  y1={droneTargetY}
                  x2={Math.min(1060, droneX + 175)}
                  y2={droneTargetY}
                  stroke={l1Route === "subsea" ? "#38bdf8" : "#f59e0b"}
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
                <circle
                  cx={Math.min(1060, droneX + 175)}
                  cy={droneTargetY}
                  r="14"
                  fill="none"
                  stroke={l1Route === "subsea" ? "#38bdf8" : "#f59e0b"}
                  strokeWidth="2"
                  filter="url(#softGlow)"
                />
                <circle
                  cx={Math.min(1060, droneX + 175)}
                  cy={droneTargetY}
                  r="3"
                  fill={l1Route === "subsea" ? "#38bdf8" : "#f59e0b"}
                />
                <text
                  x={Math.min(1060, droneX + 175) + 18}
                  y={droneTargetY + 3}
                  fill={l1Route === "subsea" ? "#0284c7" : "#d97706"}
                  fontSize="6.5"
                  fontWeight="900"
                  className="pointer-events-none select-none"
                >
                  TARGET {Math.round(droneTargetY)}m
                </text>
              </g>

              {/* Research Vessel (R/V HYDRONOC) */}
              <g transform="translate(60, 68)">
                <polygon points="12,67 195,67 185,76 25,76" fill="#dc2626" stroke="#991b1b" strokeWidth="1" />
                <polygon points="5,50 205,50 195,67 12,67" fill="#1e3a8a" stroke="#172554" strokeWidth="1.5" />
                <polygon points="0,34 210,34 205,50 5,50" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="1.5" />
                <text x="85" y="61" fill="#ffffff" fontSize="5.5" fontWeight="900" letterSpacing="0.8">
                  R/V HYDRONOC • NOC EXPEDITION
                </text>
                <circle cx="38" cy="42" r="3" fill="#0284c7" stroke="#eab308" strokeWidth="1" />
                <circle cx="56" cy="42" r="3" fill="#0284c7" stroke="#eab308" strokeWidth="1" />
                <circle cx="74" cy="42" r="3" fill="#0284c7" stroke="#eab308" strokeWidth="1" />

                <polygon points="25,18 105,18 112,34 20,34" fill="#ffffff" stroke="#94a3b8" strokeWidth="1.5" />
                <polygon points="32,22 98,22 102,29 28,29" fill="#0369a1" stroke="#0284c7" strokeWidth="1" />
                <line x1="40" y1="23" x2="65" y2="28" stroke="#ffffff" strokeWidth="1.5" opacity="0.75" />

                <line x1="68" y1="-8" x2="68" y2="18" stroke="#475569" strokeWidth="2.5" />
                <g transform={`translate(68, -8) rotate(${animTime * 140})`}>
                  <rect x="-10" y="-1.5" width="20" height="3" rx="1.5" fill="#f59e0b" stroke="#ca8a04" strokeWidth="0.8" />
                </g>
                <ellipse cx="90" cy="12" rx="6" ry="6" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.5" />

                <line x1="175" y1="34" x2="195" y2="8" stroke="#ca8a04" strokeWidth="3.5" strokeLinecap="round" />
                <line x1="195" y1="8" x2="205" y2="34" stroke="#ca8a04" strokeWidth="3.5" strokeLinecap="round" />
                <circle cx="195" cy="8" r="4" fill="#854d0e" />
                <line x1="195" y1="12" x2="195" y2="67" stroke="#38bdf8" strokeWidth="2.5" strokeDasharray="3 2" />

                {/* 1. Live Visual Telemetry: Throughput Rate Gauge with Animated Flow Bar */}
                <g transform="translate(108, -16)" filter="url(#controlShadow)">
                  <rect
                    x="0"
                    y="0"
                    width="130"
                    height="38"
                    rx="6"
                    fill="#ffffff"
                    fillOpacity="0.96"
                    stroke={irisWide ? "#10b981" : "#0284c7"}
                    strokeWidth="1.5"
                  />
                  <circle cx="12" cy="14" r="4" fill={irisWide ? "#10b981" : "#ef4444"} filter="url(#softGlow)" />
                  <text x="22" y="14" fill="#0f172a" fontSize="6.5" fontWeight="900">
                    THROUGHPUT RATE GAUGE
                  </text>
                  <rect x="12" y="22" width="106" height="8" rx="4" fill="#e2e8f0" />
                  <rect
                    x="12"
                    y="22"
                    width={irisWide ? 106 : 22 + (Math.sin(animTime * 4) + 1) * 6}
                    height="8"
                    rx="4"
                    fill={irisWide ? "#10b981" : "#f59e0b"}
                  />
                  <text x="65" y="28" textAnchor="middle" fill="#ffffff" fontSize="5" fontWeight="900">
                    {irisWide ? "100 Mbps (8 PKTS/SEC)" : "10 Mbps (1 PKT/SEC)"}
                  </text>
                </g>
              </g>

              {/* Satellite Relay in High Atmosphere */}
              <g transform="translate(940, 40)">
                <rect x="-14" y="-8" width="28" height="16" rx="3" fill="#f8fafc" stroke="#475569" strokeWidth="1.5" />
                <rect x="-42" y="-12" width="24" height="24" rx="2" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
                <rect x="18" y="-12" width="24" height="24" rx="2" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
                <ellipse cx="0" cy="10" rx="9" ry="5" fill="#ffffff" stroke="#334155" strokeWidth="1.5" />
                <circle cx="0" cy="14" r="2.5" fill={l1Route === "satellite" ? "#f59e0b" : "#94a3b8"} filter="url(#softGlow)" />

                <g transform="translate(0, 30)">
                  <rect x="-65" y="-7" width="130" height="16" rx="4" fill="#ffffff" fillOpacity="0.92" stroke="#0284c7" strokeWidth="1" />
                  <text x="0" y="4" textAnchor="middle" fill="#0f172a" fontSize="6.5" fontWeight="900">
                    GEO-SAT ORBIT • 480ms PING
                  </text>
                </g>
              </g>

              {/* Armored Subsea Fiber Cable along Seabed */}
              <g transform="translate(0, 515)">
                <path
                  d="M 0 0 Q 300 -12 600 5 T 1200 -5 L 1200 45 L 0 45 Z"
                  fill="url(#bgL1Seabed)"
                />
                <rect x="40" y="10" width="1120" height="18" rx="9" fill="#1e293b" stroke="#334155" strokeWidth="2" />
                <rect
                  x="48"
                  y="14"
                  width="1104"
                  height="10"
                  rx="5"
                  fill={l1Route === "subsea" ? "url(#goldConduit)" : "#0284c7"}
                  opacity="0.85"
                  filter="url(#softGlow)"
                />
                {l1Route === "subsea" && (
                  <circle
                    cx={100 + ((animTime * 350) % 1000)}
                    cy={19}
                    r={5}
                    fill="#ffffff"
                    filter="url(#laserBeam)"
                  />
                )}
                <g transform="translate(600, 34)">
                  <rect x="-160" y="-8" width="320" height="16" rx="4" fill="#ffffff" fillOpacity="0.94" stroke="#0284c7" strokeWidth="1" />
                  <text x="0" y="3" textAnchor="middle" fill="#0f172a" fontSize="6.5" fontWeight="900">
                    ARMORED SUBSEA FIBER CONDUIT (12ms SPEED-OF-LIGHT ROUTE)
                  </text>
                </g>
              </g>

              {/* 2. Live Visual Telemetry: Signal Echo Ripple (480ms Slow Pulse vs 12ms Instant Flash) */}
              {l1Route === "satellite" && (
                <g filter="url(#softGlow)">
                  <line x1={droneX} y1={droneActualY} x2="940" y2="42" stroke="#f59e0b" strokeWidth="2" strokeDasharray="6 4" opacity="0.6" />
                  <circle
                    cx={droneX + (940 - droneX) * ((animTime * 2.1) % 1)}
                    cy={droneActualY + (42 - droneActualY) * ((animTime * 2.1) % 1)}
                    r="6"
                    fill="#f59e0b"
                    filter="url(#laserBeam)"
                  />
                </g>
              )}
              {l1Route === "subsea" && (
                <g filter="url(#laserBeam)">
                  <line x1={droneX} y1={droneActualY} x2={droneX} y2="520" stroke="#10b981" strokeWidth="3.5" />
                  <circle cx={droneX} cy={droneActualY + ((animTime * 800) % Math.max(10, 520 - droneActualY))} r="5" fill="#ffffff" />
                </g>
              )}

              {/* Vertical Optical Tube & Brass Iris Valve */}
              <rect
                x={irisWide ? 234 : 248}
                y={135}
                width={irisWide ? 44 : 16}
                height={300}
                rx={irisWide ? 10 : 5}
                fill="url(#opticalTube)"
                stroke="#0284c7"
                strokeWidth="2"
                filter="url(#softGlow)"
              />

              {dataSpheres.map((s) => (
                <circle
                  key={s.id}
                  cx={irisWide ? 242 + s.lane * 10 : 256}
                  cy={s.y}
                  r={irisWide ? 3.5 : 4.5}
                  fill={irisWide ? "#0284c7" : "#f59e0b"}
                  filter="url(#softGlow)"
                />
              ))}

              <g transform="translate(256, 275)">
                <circle cx="0" cy="0" r="30" fill="url(#brassMetallic)" stroke="#854d0e" strokeWidth="2.5" />
                <circle cx="0" cy="0" r="18" fill="#ffffff" stroke="#ca8a04" strokeWidth="1.5" />
                <polygon points="0,-18 14,-7 0,0" fill="#ca8a04" opacity="0.85" />
                <polygon points="14,-7 14,9 0,0" fill="#ca8a04" opacity="0.85" />
                <polygon points="14,9 -5,16 0,0" fill="#ca8a04" opacity="0.85" />
                <polygon points="-5,16 -16,3 0,0" fill="#ca8a04" opacity="0.85" />
                <polygon points="-16,3 -7,-16 0,0" fill="#ca8a04" opacity="0.85" />

                <circle cx="0" cy="0" r={irisWide ? 15 : 5} fill={irisWide ? "#38bdf8" : "#f59e0b"} filter="url(#softGlow)" />

                <g
                  className="cursor-pointer"
                  onClick={() => {
                    playSwitch();
                    setIrisWide(!irisWide);
                  }}
                  transform={`translate(${irisWide ? 24 : -24}, 0)`}
                >
                  <line x1="0" y1="0" x2={irisWide ? 30 : -30} y2="0" stroke="url(#brassMetallic)" strokeWidth="8" strokeLinecap="round" />
                  <circle cx={irisWide ? 30 : -30} cy="0" r="9" fill={irisWide ? "#10b981" : "#ef4444"} stroke="#854d0e" strokeWidth="2" filter="url(#softGlow)" />
                </g>

                <g transform="translate(0, -42)" filter="url(#controlShadow)">
                  <rect x="-80" y="-8" width="160" height="18" rx="5" fill="#ffffff" fillOpacity="0.95" stroke="#0284c7" strokeWidth="1.5" />
                  <text x="0" y="4" textAnchor="middle" fill="#0f172a" fontSize="7" fontWeight="900">
                    {irisWide ? "IRIS: 100 Mbps (WIDE 4-LANE)" : "IRIS: 10 Mbps (PINCHED NARROW)"}
                  </text>
                </g>
                <text x="0" y="44" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontWeight="900" filter="url(#softGlow)">
                  CLICK HANDLE TO WIDEN PIPE
                </text>
              </g>

              {/* Generous Coral Arches */}
              <g transform="translate(450, 0)">
                <path d="M -24 135 Q -32 200 -22 265 Q 0 260 22 265 Q 32 195 24 135 Z" fill="url(#coralLimestone)" stroke="#0891b2" strokeWidth="2" />
                <circle cx="-16" cy="255" r="7" fill="#f43f5e" />
                <circle cx="2" cy="258" r="6" fill="#c084fc" />
                <circle cx="16" cy="252" r="8" fill="#fb923c" />
                <path d="M -26 515 Q -32 470 -20 435 Q 0 440 20 435 Q 30 470 26 515 Z" fill="url(#coralLimestone)" stroke="#0891b2" strokeWidth="2" />
                <circle cx="-15" cy="445" r="7" fill="#34d399" />
                <circle cx="15" cy="442" r="8" fill="#f43f5e" />
                <circle cx="0" cy="265" r="3.5" fill="#38bdf8" filter="url(#softGlow)" />
                <circle cx="0" cy="435" r="3.5" fill="#38bdf8" filter="url(#softGlow)" />
                <g transform="translate(0, 350)" filter="url(#controlShadow)">
                  <rect x="-32" y="-10" width="64" height="20" rx="5" fill="#ffffff" fillOpacity="0.94" stroke="#0284c7" strokeWidth="1.5" />
                  <text x="0" y="3" textAnchor="middle" fill="#0f172a" fontSize="7" fontWeight="900">
                    ARCH 1
                  </text>
                </g>
              </g>

              <g transform="translate(670, 0)">
                <path d="M -26 135 Q -34 160 -24 185 Q 0 180 24 185 Q 34 160 26 135 Z" fill="url(#coralLimestone)" stroke="#0891b2" strokeWidth="2" />
                <circle cx="-14" cy="178" r="7" fill="#fb923c" />
                <circle cx="14" cy="175" r="8" fill="#f43f5e" />
                <path d="M -28 515 Q -36 430 -22 355 Q 0 360 22 355 Q 36 430 28 515 Z" fill="url(#coralLimestone)" stroke="#0891b2" strokeWidth="2" />
                <circle cx="-15" cy="366" r="8" fill="#c084fc" />
                <circle cx="16" cy="364" r="7" fill="#34d399" />
                <circle cx="0" cy="185" r="3.5" fill="#38bdf8" filter="url(#softGlow)" />
                <circle cx="0" cy="355" r="3.5" fill="#38bdf8" filter="url(#softGlow)" />
                <g transform="translate(0, 270)" filter="url(#controlShadow)">
                  <rect x="-32" y="-10" width="64" height="20" rx="5" fill="#ffffff" fillOpacity="0.94" stroke="#0284c7" strokeWidth="1.5" />
                  <text x="0" y="3" textAnchor="middle" fill="#0f172a" fontSize="7" fontWeight="900">
                    ARCH 2
                  </text>
                </g>
              </g>

              <g transform="translate(880, 0)">
                <path d="M -28 135 Q -38 225 -25 315 Q 0 310 25 315 Q 38 225 28 135 Z" fill="url(#coralLimestone)" stroke="#0891b2" strokeWidth="2" />
                <circle cx="-15" cy="308" r="8" fill="#f43f5e" />
                <circle cx="15" cy="305" r="7" fill="#fb923c" />
                <path d="M -26 515 Q -32 500 -20 485 Q 0 490 20 485 Q 32 500 26 515 Z" fill="url(#coralLimestone)" stroke="#0891b2" strokeWidth="2" />
                <circle cx="0" cy="495" r="7" fill="#c084fc" />
                <circle cx="0" cy="315" r="3.5" fill="#38bdf8" filter="url(#softGlow)" />
                <circle cx="0" cy="485" r="3.5" fill="#38bdf8" filter="url(#softGlow)" />
                <g transform="translate(0, 400)" filter="url(#controlShadow)">
                  <rect x="-32" y="-10" width="64" height="20" rx="5" fill="#ffffff" fillOpacity="0.94" stroke="#0284c7" strokeWidth="1.5" />
                  <text x="0" y="3" textAnchor="middle" fill="#0f172a" fontSize="7" fontWeight="900">
                    ARCH 3
                  </text>
                </g>
              </g>

              {/* Submersible Drone Claw Bot-3 */}
              <g transform={`translate(${droneX}, ${droneActualY})`}>
                <polygon points="18,-6 140,-35 140,5 18,-2" fill="url(#spotlightCone)" />
                <polygon points="18,4 140,-5 140,35 18,6" fill="url(#spotlightCone)" />
                <circle cx="-32" cy={Math.sin(animTime * 12) * 3} r="2" fill="#ffffff" opacity="0.75" />
                <circle cx="-42" cy={Math.cos(animTime * 10) * 4} r="2.5" fill="#ffffff" opacity="0.6" />
                <circle cx="-52" cy={Math.sin(animTime * 8) * 5} r="3" fill="#ffffff" opacity="0.4" />
                <rect x="-26" y="-8" width="8" height="16" rx="3" fill="#334155" stroke="#1e293b" strokeWidth="1.5" />
                <g transform={`translate(-27, 0) rotate(${animTime * 720})`}>
                  <line x1="0" y1="-7" x2="0" y2="7" stroke="#eab308" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="0" cy="0" r="2.5" fill="#854d0e" />
                </g>
                <ellipse cx="0" cy="0" rx="25" ry="15" fill="#eab308" stroke="#ca8a04" strokeWidth="2" />
                <path d="M -20 -4 Q 0 -13 20 -4" stroke="#fef08a" strokeWidth="2" fill="none" />
                <ellipse cx="16" cy="-1" rx="8" ry="9" fill="#38bdf8" fillOpacity="0.85" stroke="#0284c7" strokeWidth="1.5" />
                <g transform="translate(18, 6)">
                  <line x1="0" y1="0" x2="10" y2="4" stroke="#64748b" strokeWidth="2.5" strokeLinecap="round" />
                  <circle cx="10" cy="4" r="2" fill="#475569" />
                  <path d="M 10 4 Q 15 1 18 3" stroke="#cbd5e1" strokeWidth="2" fill="none" />
                  <path d="M 10 4 Q 15 7 18 5" stroke="#cbd5e1" strokeWidth="2" fill="none" />
                </g>
                <circle cx="-6" cy="-22" r="3.5" fill={droneCollision ? "#ef4444" : "#10b981"} filter="url(#softGlow)" />
                <text x="0" y="3" textAnchor="middle" fill="#0f172a" fontSize="5.5" fontWeight="900">
                  CLAW BOT-3
                </text>
              </g>

              {/* Depth Gauge on Left */}
              <g
                transform="translate(25, 290)"
                filter="url(#controlShadow)"
                onPointerDown={handleGaugePointerDown}
                className="cursor-ns-resize touch-none select-none"
              >
                <rect x="0" y="0" width="68" height="175" rx="8" fill="#ffffff" fillOpacity="0.94" stroke="#0284c7" strokeWidth="2" />
                <text x="34" y="16" textAnchor="middle" fill="#0f172a" fontSize="7" fontWeight="900" className="pointer-events-none">
                  DEPTH GAUGE
                </text>
                <text x="34" y="26" textAnchor="middle" fill="#0369a1" fontSize="5.5" fontWeight="800" className="pointer-events-none">
                  STEER WHEEL
                </text>
                <line x1="16" y1="34" x2="16" y2="150" stroke="#cbd5e1" strokeWidth="2" className="pointer-events-none" />
                <text x="28" y="36" fill="#475569" fontSize="5" fontWeight="800" className="pointer-events-none">175m</text>
                <text x="28" y="75" fill="#475569" fontSize="5" fontWeight="800" className="pointer-events-none">265m</text>
                <text x="28" y="114" fill="#475569" fontSize="5" fontWeight="800" className="pointer-events-none">355m</text>
                <text x="28" y="152" fill="#475569" fontSize="5" fontWeight="800" className="pointer-events-none">445m</text>
                <line x1="48" y1="34" x2="48" y2="150" stroke="#e2e8f0" strokeWidth="6" strokeLinecap="round" className="pointer-events-none" />
                <g
                  className="cursor-ns-resize"
                  transform={`translate(48, ${
                    34 + Math.max(0, Math.min(1, (droneTargetY - 175) / (445 - 175))) * 116
                  })`}
                >
                  <circle cx="0" cy="0" r="14" fill="url(#brassMetallic)" stroke="#854d0e" strokeWidth="2" filter="url(#softGlow)" />
                  <line x1="-10" y1="0" x2="10" y2="0" stroke="#854d0e" strokeWidth="2" />
                  <circle cx="0" cy="0" r="4" fill="#0284c7" />
                </g>
                <text x="34" y="167" textAnchor="middle" fill="#0369a1" fontSize="5.5" fontWeight="800" className="pointer-events-none">
                  DRAG OR ARROWS
                </text>
              </g>

              {/* Start Trench Run Lever */}
              <g
                className="cursor-pointer"
                onClick={handleStartDroneRun}
                transform="translate(105, 415)"
                filter="url(#controlShadow)"
              >
                <rect x="0" y="0" width="138" height="36" rx="8" fill="#ffffff" fillOpacity="0.94" stroke="#10b981" strokeWidth="2" />
                <circle cx="20" cy="18" r="8" fill={droneRunActive ? "#10b981" : "#059669"} filter="url(#softGlow)" />
                <text x="36" y="16" fill="#0f172a" fontSize="7.5" fontWeight="900">
                  {droneRunActive ? "RUN IN PROGRESS..." : "START TRENCH RUN"}
                </text>
                <text x="36" y="27" fill="#059669" fontSize="6" fontWeight="800">
                  {droneRunActive ? "Steering through arches" : "Pull lever to test route"}
                </text>
              </g>

              {/* Fiber Switch Valve */}
              <g
                className="cursor-pointer"
                onClick={() => {
                  playSwitch();
                  setL1Route(l1Route === "satellite" ? "subsea" : "satellite");
                }}
                transform="translate(105, 465)"
                filter="url(#controlShadow)"
              >
                <rect
                  x="0"
                  y="0"
                  width="138"
                  height="36"
                  rx="8"
                  fill="#ffffff"
                  fillOpacity="0.94"
                  stroke={l1Route === "subsea" ? "#10b981" : "#f59e0b"}
                  strokeWidth="2"
                />
                <circle cx="20" cy="18" r="8" fill={l1Route === "subsea" ? "#10b981" : "#f59e0b"} filter="url(#softGlow)" />
                <text x="36" y="16" fill="#0f172a" fontSize="7" fontWeight="900">
                  {l1Route === "subsea" ? "ROUTE: 12ms SUBSEA FIBER" : "ROUTE: 480ms SATELLITE"}
                </text>
                <text x="36" y="26" fill={l1Route === "subsea" ? "#059669" : "#d97706"} fontSize="6" fontWeight="800">
                  {l1Route === "subsea" ? "Instant light-speed steering" : "High ping delays steering"}
                </text>
              </g>

              {/* Research Pod Dock */}
              <g transform="translate(1020, 390)" filter="url(#controlShadow)">
                <rect x="0" y="0" width="80" height="56" rx="8" fill="#ffffff" fillOpacity="0.94" stroke="#10b981" strokeWidth="2" />
                <text x="40" y="20" textAnchor="middle" fill="#059669" fontSize="7" fontWeight="900">
                  RESEARCH POD
                </text>
                <text x="40" y="38" textAnchor="middle" fill="#0f172a" fontSize="6.5" fontWeight="800">
                  {droneX >= 980 ? "POD DOCKED 100%" : "AWAITING ROV"}
                </text>
              </g>
            </g>
          )}

          {/* ==================================================================
              ENVIRONMENT 2: CLOUD-SPIRE & SKY-PORT DNS RELAY GAME (4 WAVES)
              Illustrated Zeppelin (x = 295, y = 210) • Illustrated Dirigible (x = 185, y = 455)
              Pure Visual Crystal States & Beams • Zero Extra Floating Boxes
              ================================================================== */}
          {level === 2 && (
            <g>
              {/* ────────────────────────────────────────────────────────────────
                  ILLUSTRATED CUMULUS CLOUD ISLANDS (Bases for Spires)
                  Root at (585, 175) • TLD at (785; 95, 215, 335) • Auth at (920/955, 215 & 335)
                  ──────────────────────────────────────────────────────────────── */}
              {/* Cloud under Root (585, 175) */}
              <g transform="translate(585, 175)" opacity="0.95">
                <ellipse cx="0" cy="0" rx="70" ry="20" fill="#ffffff" filter="url(#controlShadow)" />
                <ellipse cx="-25" cy="-6" rx="42" ry="16" fill="#f8fafc" />
                <ellipse cx="25" cy="-4" rx="44" ry="17" fill="#ffffff" />
              </g>

              {/* Cloud tier under TLD Spires: 120px Vertical Spacing at y = 95, 215, 335 */}
              <g transform="translate(785, 95)" opacity="0.95">
                <ellipse cx="0" cy="18" rx="60" ry="18" fill="#ffffff" filter="url(#controlShadow)" />
              </g>
              <g transform="translate(785, 215)" opacity="0.95">
                <ellipse cx="0" cy="20" rx="64" ry="19" fill="#ffffff" filter="url(#controlShadow)" />
              </g>
              <g transform="translate(785, 335)" opacity="0.95">
                <ellipse cx="0" cy="20" rx="64" ry="19" fill="#ffffff" filter="url(#controlShadow)" />
              </g>

              {/* Cloud islands under Authoritative Domes (920/955, 215 & 335) */}
              <g transform={`translate(${l2Wave === 3 ? 955 : 920}, 215)`} opacity="0.95">
                <ellipse cx="0" cy="22" rx="68" ry="20" fill="#ffffff" filter="url(#controlShadow)" />
                <ellipse cx="-20" cy="16" rx="46" ry="16" fill="#f0f9ff" />
              </g>
              <g transform="translate(920, 335)" opacity="0.95">
                <ellipse cx="0" cy="22" rx="68" ry="20" fill="#ffffff" filter="url(#controlShadow)" />
                <ellipse cx="-20" cy="16" rx="46" ry="16" fill="#f0f9ff" />
              </g>

              {/* WAVE 3: Vacant Old Spot Ghost Outline at x = 910, y = 215 */}
              {l2Wave === 3 && (
                <g opacity="0.65" filter="url(#controlShadow)">
                  <ellipse cx="910" cy="225" rx="34" ry="11" fill="none" stroke="#94a3b8" strokeDasharray="3 3" />
                  <path d="M 882 225 Q 910 185 938 225" fill="none" stroke="#94a3b8" strokeDasharray="3 3" />
                </g>
              )}

              {/* ────────────────────────────────────────────────────────────────
                  WAVE 3 STALE CACHE VISUAL BEAM & VACANT DOCK INDICATOR
                  Shows visually why crystal fails: server moved from .42 to .99!
                  Clean downward arc underneath 1. ROOT directory box
                  ──────────────────────────────────────────────────────────────── */}
              {l2Wave === 3 && !l2TimeWarpPulled && (
                <g>
                  {/* Dashed Red Stale Path in downward arc underneath Root Spire */}
                  <path
                    d="M 295 215 Q 580 395 865 225 L 910 215"
                    fill="none"
                    stroke="#ef4444"
                    strokeWidth="2.5"
                    strokeDasharray="6 4"
                    opacity="0.85"
                  />
                  
                  {/* Big Red X at Vacant Old Dock */}
                  <g transform="translate(910, 215)">
                    <line x1="-14" y1="-14" x2="14" y2="14" stroke="#dc2626" strokeWidth="3.5" strokeLinecap="round" />
                    <line x1="-14" y1="14" x2="14" y2="-14" stroke="#dc2626" strokeWidth="3.5" strokeLinecap="round" />
                    <rect x="-65" y="16" width="130" height="18" rx="3" fill="#fee2e2" stroke="#ef4444" strokeWidth="1" />
                    <text x="0" y="28.5" textAnchor="middle" fill="#991b1b" fontSize="5.5" fontWeight="900">
                      VACANT OLD DOCK (.42)
                    </text>
                  </g>

                  {/* Red Stale Badge at (610, 365) in open sky */}
                  <g transform="translate(610, 365)">
                    <rect x="-95" y="-10" width="190" height="20" rx="4" fill="#fee2e2" stroke="#ef4444" strokeWidth="1.5" filter="url(#controlShadow)" />
                    <text x="0" y="3.5" textAnchor="middle" fill="#991b1b" fontSize="6" fontWeight="900">
                      STALE (.42 != .99) • VACANT DOCK
                    </text>
                  </g>
                </g>
              )}

              {/* ────────────────────────────────────────────────────────────────
                  WAVE 2 GOLDEN SHORTCUT BEAM (0 HOPS • 1ms)
                  Direct visual connection from Crystal to Airship
                  Badge placed at (215, 375) in open sky (zero collision!)
                  ──────────────────────────────────────────────────────────────── */}
              {l2Wave === 2 && l2Ttl > 0 && (
                <g filter="url(#softGlow)">
                  <line x1="295" y1="215" x2="185" y2="455" stroke="#eab308" strokeWidth="4.5" strokeDasharray="6 3" />
                  <circle cx="215" cy="375" r="7" fill="#fde047" />
                  <g transform="translate(215, 375)">
                    <rect x="-70" y="-10" width="140" height="20" rx="4" fill="#fef08a" stroke="#ca8a04" strokeWidth="1.5" />
                    <text x="0" y="3.5" textAnchor="middle" fill="#854d0e" fontSize="6.5" fontWeight="900">
                      MATCH! CLICK CRYSTAL (1 ms)
                    </text>
                  </g>
                </g>
              )}

              {/* Flashing Spark after Cache Hit Clicked */}
              {l2GoldenSpark && (
                <g filter="url(#softGlow)">
                  <line x1="295" y1="215" x2="185" y2="455" stroke="#ffffff" strokeWidth="6" />
                  <circle cx="215" cy="375" r="10" fill="#fef08a" />
                </g>
              )}

              {/* ────────────────────────────────────────────────────────────────
                  RESOLVER ZEPPELIN (x = 295, y = 210)
                  Illustrated Airship Hull: Tail fins, brass gondola, spinning propeller
                  Clean Vertical Hierarchy (Zero text overlaps!):
                    1. Title ABOVE Zeppelin at y = 128: RESOLVER (YOUR ISP)
                    2. Speed Gauge inside upper hull at y = 165
                    3. Cache Crystal at (295, 215) with TTL timer to right (335, 218)
                    4. Saved record pill below gondola at y = 268
                  ──────────────────────────────────────────────────────────────── */}
              {/* Title cleanly ABOVE Zeppelin at y = 128 */}
              <text x="295" y="128" textAnchor="middle" fill="#0369a1" fontSize="8" fontWeight="900" letterSpacing="0.8">
                RESOLVER (YOUR ISP)
              </text>

              <g transform="translate(295, 210)" filter="url(#controlShadow)">
                {/* Tail Fins on Rear */}
                <polygon points="-108,-15 -142,-34 -126,-10" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
                <polygon points="-108,15 -142,34 -126,10" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />

                {/* White Gasbag Envelope with Sky-Blue Trim */}
                <ellipse cx="0" cy="0" rx="125" ry="56" fill="#ffffff" stroke="#0284c7" strokeWidth="2.5" />
                <path d="M -95 0 Q 0 -38 95 0" stroke="#bae6fd" strokeWidth="1.5" fill="none" opacity="0.9" />
                <path d="M -100 0 Q 0 38 100 0" stroke="#bae6fd" strokeWidth="1.5" fill="none" opacity="0.9" />
                <path d="M -120 0 Q 0 -6 120 0" stroke="#38bdf8" strokeWidth="2" fill="none" opacity="0.6" />

                {/* Spinning Propellers on Rear Pylon */}
                <g transform={`translate(-142, 0) rotate(${animTime * 1100})`}>
                  <line x1="0" y1="-18" x2="0" y2="18" stroke="#ca8a04" strokeWidth="4" strokeLinecap="round" />
                  <circle cx="0" cy="0" r="4" fill="#854d0e" />
                </g>

                {/* Brass Gondola Suspended Under Envelope */}
                <line x1="-28" y1="36" x2="-28" y2="44" stroke="#ca8a04" strokeWidth="1.5" />
                <line x1="28" y1="36" x2="28" y2="44" stroke="#ca8a04" strokeWidth="1.5" />
                <rect x="-35" y="44" width="70" height="18" rx="4" fill="url(#brassMetallic)" stroke="#ca8a04" strokeWidth="1.5" />
                <circle cx="-18" cy="53" r="3" fill="#0284c7" />
                <circle cx="0" cy="53" r="3" fill="#0284c7" />
                <circle cx="18" cy="53" r="3" fill="#0284c7" />

                {/* Single-line Speed Gauge inside upper hull at y = -45 (Absolute y = 165) */}
                <g transform="translate(0, -45)">
                  <rect
                    x="-105"
                    y="-10"
                    width="210"
                    height="20"
                    rx="5"
                    fill={l2Latency === 1 ? "#ecfdf5" : l2Latency > 0 ? "#fef3c7" : "#f0f9ff"}
                    stroke={l2Latency === 1 ? "#10b981" : l2Latency > 0 ? "#f59e0b" : "#0284c7"}
                    strokeWidth="1.5"
                  />
                  <text
                    x="0"
                    y="4"
                    textAnchor="middle"
                    fill={l2Latency === 1 ? "#059669" : l2Latency > 0 ? "#b45309" : "#0369a1"}
                    fontSize="7"
                    fontWeight="900"
                  >
                    {l2Latency === 1
                      ? "CACHE = 1 ms (340x FASTER)"
                      : l2Latency === 340
                      ? "3 HOPS = 340 ms (FULL RECURSION)"
                      : "3 HOPS = 340 ms vs CACHE = 1 ms"}
                  </text>
                </g>

                {/* Cache Memory Crystal centered at (0, 5) (Absolute y = 215) */}
                <g
                  className="cursor-pointer"
                  onClick={handleUseCacheCrystal}
                  transform="translate(0, 5)"
                >
                  {/* Circular Outer Base Ring */}
                  <circle cx="0" cy="0" r="22" fill="none" stroke="#e2e8f0" strokeWidth="4" />
                  
                  {/* Live Circular Countdown Ring */}
                  <circle
                    cx="0"
                    cy="0"
                    r="22"
                    fill="none"
                    stroke={l2Ttl > 0 ? (l2Wave === 3 && !l2TimeWarpPulled ? "#f59e0b" : "#10b981") : "#ef4444"}
                    strokeWidth="4"
                    strokeDasharray={`${(l2Ttl / 15) * 138.2} 138.2`}
                    transform="rotate(-90)"
                    strokeLinecap="round"
                    filter="url(#softGlow)"
                  />
                  
                  {/* Crystal Core (Emerald on Match, Amber on Stale, Gray on Empty) */}
                  <circle
                    cx="0"
                    cy="0"
                    r={l2Ttl > 0 ? 16 : 13}
                    fill={l2Ttl > 0 ? (l2Wave === 3 && !l2TimeWarpPulled ? "#fef3c7" : "url(#crystalGlowGrad)") : "#94a3b8"}
                    stroke={l2Ttl > 0 ? (l2Wave === 3 && !l2TimeWarpPulled ? "#f59e0b" : "#0891b2") : "#64748b"}
                    strokeWidth="2"
                    filter={l2Ttl > 0 ? "url(#softGlow)" : undefined}
                  />
                  <polygon
                    points="0,-11 9,-2 6,9 -6,9 -9,-2"
                    fill={l2Ttl > 0 ? (l2Wave === 3 && !l2TimeWarpPulled ? "#f59e0b" : "#ffffff") : "#cbd5e1"}
                    opacity="0.85"
                  />

                  {/* Visual Crystal State Pill above Crystal */}
                  <g transform="translate(0, -26)">
                    {l2Wave === 1 && (
                      <g>
                        <rect x="-52" y="-7" width="104" height="14" rx="3" fill="#f1f5f9" stroke="#94a3b8" strokeWidth="0.8" />
                        <text x="0" y="3" textAnchor="middle" fill="#64748b" fontSize="5" fontWeight="900">
                          EMPTY • ASK TOWERS
                        </text>
                      </g>
                    )}
                    {l2Wave === 2 && (
                      <g>
                        <rect x="-62" y="-7" width="124" height="14" rx="3" fill="#ecfdf5" stroke="#10b981" strokeWidth="1" filter="url(#softGlow)" />
                        <text x="0" y="3" textAnchor="middle" fill="#059669" fontSize="5" fontWeight="900">
                          MATCH! CLICK CRYSTAL
                        </text>
                      </g>
                    )}
                    {l2Wave === 3 && (
                      <g>
                        <rect x="-56" y="-7" width="112" height="14" rx="3" fill="#fee2e2" stroke="#ef4444" strokeWidth="1" />
                        <text x="0" y="3" textAnchor="middle" fill="#991b1b" fontSize="5" fontWeight="900">
                          STALE (.42 != .99)
                        </text>
                      </g>
                    )}
                    {l2Wave === 4 && (
                      <g>
                        <rect x="-58" y="-7" width="116" height="14" rx="3" fill="#fef3c7" stroke="#f59e0b" strokeWidth="1" />
                        <text x="0" y="3" textAnchor="middle" fill="#b45309" fontSize="5" fontWeight="900">
                          HAS .ORG • NEED .GOV
                        </text>
                      </g>
                    )}
                  </g>

                  {/* TTL Timer cleanly to the RIGHT of crystal at x = 40 (Absolute x = 335, y = 215) */}
                  <g transform="translate(40, 0)">
                    <rect x="0" y="-10" width="70" height="20" rx="4" fill="#f0fdf4" stroke={l2Ttl > 0 ? "#10b981" : "#cbd5e1"} strokeWidth="1" />
                    <text x="35" y="3.5" textAnchor="middle" fill={l2Ttl > 0 ? "#059669" : "#64748b"} fontSize="6.5" fontWeight="900">
                      TTL: {l2Ttl}s
                    </text>
                  </g>
                </g>

                {/* Saved Record Pill at relative y = +58 (Absolute y = 268) */}
                <g transform="translate(0, 58)">
                  <rect
                    x="-105"
                    y="-9"
                    width="210"
                    height="18"
                    rx="4"
                    fill="#ffffff"
                    fillOpacity="0.95"
                    stroke={l2Ttl > 0 ? (l2Wave === 3 && !l2TimeWarpPulled ? "#ef4444" : "#059669") : "#cbd5e1"}
                    strokeWidth="1.2"
                  />
                  <text
                    x="0"
                    y="3.5"
                    textAnchor="middle"
                    fill={l2Ttl > 0 ? (l2Wave === 3 && !l2TimeWarpPulled ? "#b91c1c" : "#059669") : "#64748b"}
                    fontSize="6.5"
                    fontWeight="900"
                  >
                    {l2Ttl > 0 && l2CachedDomain && l2CachedIp
                      ? (l2Wave === 3 && !l2TimeWarpPulled
                          ? `SAVED: ${l2CachedDomain} -> 198.51.100.42 (STALE)`
                          : `SAVED: ${l2CachedDomain} -> ${l2CachedIp}`)
                      : "SAVED: CACHE EMPTY / EXPIRED (0s TTL)"}
                  </text>
                </g>
              </g>

              {/* ── DRAGGABLE & ANIMATED QUERY DRONE (at packetPos.x, packetPos.y) ── */}
              <g
                className="cursor-grab active:cursor-grabbing select-none"
                onPointerDown={handlePacketPointerDown}
                transform={`translate(${packetPos.x}, ${packetPos.y})`}
                filter="url(#softGlow)"
              >
                <circle cx="0" cy="0" r="18" fill="none" stroke="#38bdf8" strokeWidth="2" strokeDasharray="4 3" opacity="0.85" />
                <circle cx="0" cy="0" r="14" fill="#0284c7" stroke="#ffffff" strokeWidth="2" />
                <circle cx="0" cy="0" r="6" fill="#38bdf8" />
                <polygon points="-3,-3 5,0 -3,3" fill="#ffffff" />
                <text x="0" y="-20" textAnchor="middle" fill="#0369a1" fontSize="6.5" fontWeight="900">
                  QUERY DRONE
                </text>
                <text x="0" y="24" textAnchor="middle" fill="#0284c7" fontSize="6" fontWeight="900">
                  DRAG OR CLICK SPIRES
                </text>
              </g>

              {/* ── SKIP +15s (EXPIRE TTL) LEVER AT (295, 360) ── */}
              {l2Wave === 3 && (
                <g
                  className="cursor-pointer"
                  onClick={handlePullTimeWarp}
                  transform="translate(295, 360)"
                  filter="url(#controlShadow)"
                >
                  <rect x="-85" y="-12" width="170" height="24" rx="4" fill="#fef3c7" stroke="#ca8a04" strokeWidth="2" />
                  <line
                    x1="-60"
                    y1="0"
                    x2={l2TimeWarpPulled ? -46 : -72}
                    y2="-10"
                    stroke="url(#brassMetallic)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                  <circle cx={l2TimeWarpPulled ? -46 : -72} cy="-10" r="4.5" fill={l2TimeWarpPulled ? "#ef4444" : "#f59e0b"} />
                  <text x="5" y="4" textAnchor="middle" fill="#b45309" fontSize="7" fontWeight="900">
                    EXPIRE TTL (0s)
                  </text>
                </g>
              )}

              {/* ── ACTIVE LASER TRACE FROM ZEPPELIN TO CONNECTED SPIRE ── */}
              {l2Conn !== "idle" && (
                <g filter="url(#laserBeam)">
                  <line x1="295" y1="210" x2="585" y2="135" stroke="#10b981" strokeWidth="3.5" />
                  <circle cx="440" cy="172" r="4" fill="#ffffff" />
                </g>
              )}
              {(l2Conn === "tld" || l2Conn === "auth") && (
                <g filter="url(#laserBeam)">
                  <line x1="585" y1="135" x2="785" y2={l2Wave === 4 ? 335 : 215} stroke="#38bdf8" strokeWidth="3.5" />
                </g>
              )}
              {l2Conn === "auth" && (
                <g filter="url(#laserBeam)">
                  <line x1="785" y1={l2Wave === 4 ? 335 : 215} x2={l2Wave === 3 ? 955 : 920} y2={l2Wave === 4 ? 335 : 215} stroke="#10b981" strokeWidth="3.5" />
                  <line x1={l2Wave === 3 ? 955 : 920} y1={l2Wave === 4 ? 335 : 215} x2={l2AirshipX} y2="455" stroke="#eab308" strokeWidth="3" strokeDasharray="8 4" />
                </g>
              )}

              {/* ────────────────────────────────────────────────────────────────
                  ROOT RELAY SPIRE ('.') at (585, 135) - "WORLD INDEX"
                  Tall lighthouse-style rotating radar dome • Wide nameplate width="148"
                  ──────────────────────────────────────────────────────────────── */}
              <g
                className="cursor-pointer"
                onClick={handleConnectRoot}
                transform="translate(585, 135)"
                filter="url(#controlShadow)"
              >
                {/* Lighthouse Stone Tower */}
                <polygon points="0,-44 20,28 -20,28" fill="url(#spireStone)" stroke="#64748b" strokeWidth="2" />
                <line x1="-12" y1="0" x2="12" y2="0" stroke="#94a3b8" strokeWidth="1.2" />
                <line x1="-16" y1="14" x2="16" y2="14" stroke="#94a3b8" strokeWidth="1.2" />

                {/* Rotating Radar Dome / Lantern Room */}
                <g transform={`translate(0, -44) rotate(${animTime * 90})`}>
                  <ellipse cx="0" cy="0" rx="26" ry="12" fill="#ffffff" stroke="#0284c7" strokeWidth="2" filter="url(#softGlow)" />
                  <circle cx="0" cy="0" r="6" fill={l2Conn !== "idle" ? "#10b981" : "#0284c7"} />
                </g>

                {/* Wide Nameplate width="148" */}
                <rect x="-74" y="28" width="148" height="18" rx="3" fill="#334155" />
                <text x="0" y="40" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="900">
                  1. ROOT (.) • WORLD INDEX
                </text>

                {/* TLD Directory Card */}
                <g transform="translate(0, 50)">
                  <rect x="-68" y="0" width="136" height="32" rx="4" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
                  <text x="0" y="8" textAnchor="middle" fill="#64748b" fontSize="5" fontWeight="800">
                    TLD DIRECTORY (EXTENSIONS)
                  </text>
                  
                  {/* .COM Badge */}
                  <rect x="-62" y="11" width="36" height="17" rx="3" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="0.8" />
                  <text x="-44" y="23" textAnchor="middle" fill="#64748b" fontSize="7" fontWeight="800">.COM</text>

                  {/* .ORG Badge */}
                  <rect
                    x="-20"
                    y="11"
                    width="40"
                    height="17"
                    rx="3"
                    fill={l2Wave !== 4 && l2Conn !== "idle" ? "#dcfce7" : "#f1f5f9"}
                    stroke={l2Wave !== 4 && l2Conn !== "idle" ? "#10b981" : "#cbd5e1"}
                    strokeWidth={l2Wave !== 4 && l2Conn !== "idle" ? 1.5 : 0.8}
                  />
                  <text x="0" y="23" textAnchor="middle" fill={l2Wave !== 4 && l2Conn !== "idle" ? "#059669" : "#64748b"} fontSize="7" fontWeight="900">
                    .ORG
                  </text>

                  {/* .GOV Badge */}
                  <rect
                    x="26"
                    y="11"
                    width="36"
                    height="17"
                    rx="3"
                    fill={l2Wave === 4 && l2Conn !== "idle" ? "#dcfce7" : "#f1f5f9"}
                    stroke={l2Wave === 4 && l2Conn !== "idle" ? "#10b981" : "#cbd5e1"}
                    strokeWidth={l2Wave === 4 && l2Conn !== "idle" ? 1.5 : 0.8}
                  />
                  <text x="44" y="23" textAnchor="middle" fill={l2Wave === 4 && l2Conn !== "idle" ? "#059669" : "#64748b"} fontSize="7" fontWeight="900">
                    .GOV
                  </text>
                </g>
              </g>

              {/* ────────────────────────────────────────────────────────────────
                  UPGRADED TLD SPIRES AT x = 785 (120px Vertical Spacing: y = 95, 215, 335)
                  Color-Coded Relay Dishes & Clean Single-Line Labels Underneath
                  ──────────────────────────────────────────────────────────────── */}
              {/* TLD .COM SPIRE at (785, 95) */}
              <g
                className="cursor-pointer"
                onClick={() => handleConnectTld(".COM")}
                transform={`translate(785, 95) ${l2SpireShake === ".COM" ? "translate(8, 0)" : ""}`}
                filter="url(#controlShadow)"
              >
                {/* Slate Relay Dish */}
                <ellipse cx="0" cy="-34" rx="20" ry="10" fill="#f1f5f9" stroke="#64748b" strokeWidth="2" />
                <circle cx="0" cy="-34" r="4" fill="#94a3b8" />
                <polygon points="0,-34 14,22 -14,22" fill="url(#spireStone)" stroke="#94a3b8" strokeWidth="1.5" />
                
                {/* Nameplate */}
                <rect x="-50" y="24" width="100" height="16" rx="3" fill="#475569" />
                <text x="0" y="35" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="900">
                  2. .COM TLD
                </text>
                
                {/* Clean Single-Line Label */}
                <rect x="-55" y="44" width="110" height="18" rx="3" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
                <text x="0" y="56" textAnchor="middle" fill="#64748b" fontSize="6.5" fontWeight="700">
                  google.com | apple.com
                </text>
              </g>

              {/* TLD .ORG SPIRE at (785, 215) */}
              <g
                className="cursor-pointer"
                onClick={() => handleConnectTld(".ORG")}
                transform={`translate(785, 215) ${l2SpireShake === ".ORG" ? "translate(8, 0)" : ""}`}
                filter="url(#controlShadow)"
              >
                {/* Cyan-Emerald Rotating Relay Dish */}
                <g transform={`translate(0, -36) rotate(${animTime * 110})`}>
                  <ellipse cx="0" cy="0" rx="24" ry="11" fill="#f0f9ff" stroke="#0284c7" strokeWidth="2" filter="url(#softGlow)" />
                  <circle cx="0" cy="0" r="5" fill={(l2Conn === "tld" || l2Conn === "auth") && l2Wave !== 4 ? "#10b981" : "#0284c7"} />
                </g>
                <polygon points="0,-36 16,24 -16,24" fill="url(#spireStone)" stroke="#0284c7" strokeWidth="2" />
                
                {/* Nameplate */}
                <rect x="-50" y="24" width="100" height="16" rx="3" fill="#0369a1" />
                <text x="0" y="35" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="900">
                  2. .ORG TLD
                </text>
                
                {/* Clean Single-Line Label */}
                <rect
                  x="-55"
                  y="44"
                  width="110"
                  height="18"
                  rx="3"
                  fill={(l2Conn === "tld" || l2Conn === "auth") && l2Wave !== 4 ? "#ecfdf5" : "#ffffff"}
                  stroke={(l2Conn === "tld" || l2Conn === "auth") && l2Wave !== 4 ? "#10b981" : "#0284c7"}
                  strokeWidth="1.2"
                />
                <text
                  x="0"
                  y="56"
                  textAnchor="middle"
                  fill={(l2Conn === "tld" || l2Conn === "auth") && l2Wave !== 4 ? "#059669" : "#0369a1"}
                  fontSize="7"
                  fontWeight="900"
                >
                  oceanlab.org
                </text>
              </g>

              {/* TLD .GOV SPIRE at (785, 335) */}
              <g
                className="cursor-pointer"
                onClick={() => handleConnectTld(".GOV")}
                transform={`translate(785, 335) ${l2SpireShake === ".GOV" ? "translate(8, 0)" : ""}`}
                filter="url(#controlShadow)"
              >
                {/* Amber-Gold Rotating Relay Dish */}
                <g transform={`translate(0, -36) rotate(${animTime * 110})`}>
                  <ellipse cx="0" cy="0" rx="24" ry="11" fill="#fefce8" stroke="#ca8a04" strokeWidth="2" filter="url(#softGlow)" />
                  <circle cx="0" cy="0" r="5" fill={(l2Conn === "tld" || l2Conn === "auth") && l2Wave === 4 ? "#10b981" : "#ca8a04"} />
                </g>
                <polygon points="0,-36 16,24 -16,24" fill="url(#spireStone)" stroke="#ca8a04" strokeWidth="2" />
                
                {/* Nameplate */}
                <rect x="-50" y="24" width="100" height="16" rx="3" fill="#854d0e" />
                <text x="0" y="35" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="900">
                  2. .GOV TLD
                </text>
                
                {/* Clean Single-Line Label */}
                <rect
                  x="-55"
                  y="44"
                  width="110"
                  height="18"
                  rx="3"
                  fill={(l2Conn === "tld" || l2Conn === "auth") && l2Wave === 4 ? "#ecfdf5" : "#ffffff"}
                  stroke={(l2Conn === "tld" || l2Conn === "auth") && l2Wave === 4 ? "#10b981" : "#ca8a04"}
                  strokeWidth="1.2"
                />
                <text
                  x="0"
                  y="56"
                  textAnchor="middle"
                  fill={(l2Conn === "tld" || l2Conn === "auth") && l2Wave === 4 ? "#059669" : "#854d0e"}
                  fontSize="7"
                  fontWeight="900"
                >
                  nasa.gov
                </text>
              </g>

              {/* ────────────────────────────────────────────────────────────────
                  AUTHORITATIVE DOMES (Sunlit Glass Observatories at x = 920/955)
                  "3. ADDRESS OWNER" cleanly ABOVE dome peak at y = -36
                  Dark foundation nameplate below with domain
                  Locked IP plate vs. revealed IP stamp
                  ──────────────────────────────────────────────────────────────── */}
              {/* oceanlab.org Observatory Dome */}
              <g
                className="cursor-pointer"
                onClick={() => handleConnectAuth("oceanlab.org")}
                transform={`translate(${l2Wave === 3 ? 955 : 920}, 215) ${l2SpireShake === "oceanlab.org" ? "translate(8, 0)" : ""}`}
                filter="url(#controlShadow)"
              >
                {/* Wave 3 Flashing Moved Badge */}
                {l2Wave === 3 && (
                  <g transform="translate(0, -52)" filter="url(#softGlow)">
                    <rect x="-48" y="-9" width="96" height="18" rx="4" fill="#ef4444" stroke="#ffffff" strokeWidth="1.5" />
                    <text x="0" y="3.5" textAnchor="middle" fill="#ffffff" fontSize="6" fontWeight="900">
                      MOVED! NEW IP
                    </text>
                  </g>
                )}

                {/* 3. ADDRESS OWNER cleanly ABOVE dome peak at y = -36 */}
                <text x="0" y="-36" textAnchor="middle" fill="#0369a1" fontSize="7" fontWeight="900">
                  3. ADDRESS OWNER
                </text>

                {/* Sunlit Glass Observatory Dome */}
                <ellipse cx="0" cy="8" rx="36" ry="12" fill="#0f766e" />
                <path d="M -28 8 Q 0 -28 28 8 Z" fill="#ccfbf1" stroke="#0d9488" strokeWidth="2" opacity="0.85" />
                <path d="M -14 8 Q 0 -24 14 8" fill="none" stroke="#0d9488" strokeWidth="1" opacity="0.6" />
                <circle cx="0" cy="-6" r="8" fill="url(#crystalGlowGrad)" filter="url(#softGlow)" />

                {/* Domain name on dark foundation plate below at y = +16 */}
                <rect x="-55" y="16" width="110" height="18" rx="3" fill="#0f172a" />
                <text x="0" y="28" textAnchor="middle" fill="#2dd4bf" fontSize="7" fontWeight="900">
                  oceanlab.org
                </text>

                {/* Locked IP Plate vs. Revealed IP Stamp at y = +38 */}
                <g transform="translate(0, 38)">
                  {l2Conn === "auth" ? (
                    <g>
                      <rect x="-65" y="-9" width="130" height="18" rx="3" fill="#0f172a" stroke="#10b981" strokeWidth="1.5" />
                      <circle cx="-58" cy="0" r="1.5" fill="#10b981" />
                      <circle cx="58" cy="0" r="1.5" fill="#10b981" />
                      <text x="0" y="3.5" textAnchor="middle" fill="#2dd4bf" fontSize="7" fontWeight="900">
                        IP: {l2Wave === 3 ? "198.51.100.99" : "198.51.100.42"}
                      </text>
                    </g>
                  ) : (
                    <g>
                      <rect x="-65" y="-9" width="130" height="18" rx="3" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.2" />
                      <circle cx="-58" cy="0" r="1.5" fill="#f59e0b" />
                      <circle cx="58" cy="0" r="1.5" fill="#f59e0b" />
                      <text x="0" y="3.5" textAnchor="middle" fill="#f59e0b" fontSize="7" fontWeight="900">
                        LOCKED IP: ???.???.???.??
                      </text>
                    </g>
                  )}
                </g>
              </g>

              {/* nasa.gov Observatory Dome at (920, 335) */}
              <g
                className="cursor-pointer"
                onClick={() => handleConnectAuth("nasa.gov")}
                transform={`translate(920, 335) ${l2SpireShake === "nasa.gov" ? "translate(8, 0)" : ""}`}
                filter="url(#controlShadow)"
              >
                {/* 3. ADDRESS OWNER cleanly ABOVE dome peak at y = -36 */}
                <text x="0" y="-36" textAnchor="middle" fill="#0369a1" fontSize="7" fontWeight="900">
                  3. ADDRESS OWNER
                </text>

                {/* Sunlit Glass Observatory Dome */}
                <ellipse cx="0" cy="8" rx="36" ry="12" fill="#1e3a8a" />
                <path d="M -28 8 Q 0 -28 28 8 Z" fill="#e0e7ff" stroke="#4338ca" strokeWidth="2" opacity="0.85" />
                <path d="M -14 8 Q 0 -24 14 8" fill="none" stroke="#4338ca" strokeWidth="1" opacity="0.6" />
                <circle cx="0" cy="-6" r="8" fill="#38bdf8" filter="url(#softGlow)" />

                {/* Domain name on dark foundation plate below at y = +16 */}
                <rect x="-55" y="16" width="110" height="18" rx="3" fill="#0f172a" />
                <text x="0" y="28" textAnchor="middle" fill="#818cf8" fontSize="7" fontWeight="900">
                  nasa.gov
                </text>

                {/* Locked IP Plate vs. Revealed IP Stamp at y = +38 */}
                <g transform="translate(0, 38)">
                  {l2Conn === "auth" ? (
                    <g>
                      <rect x="-65" y="-9" width="130" height="18" rx="3" fill="#0f172a" stroke="#4338ca" strokeWidth="1.5" />
                      <circle cx="-58" cy="0" r="1.5" fill="#818cf8" />
                      <circle cx="58" cy="0" r="1.5" fill="#818cf8" />
                      <text x="0" y="3.5" textAnchor="middle" fill="#818cf8" fontSize="7" fontWeight="900">
                        IP: 192.0.2.88
                      </text>
                    </g>
                  ) : (
                    <g>
                      <rect x="-65" y="-9" width="130" height="18" rx="3" fill="#1e293b" stroke="#f59e0b" strokeWidth="1.2" />
                      <circle cx="-58" cy="0" r="1.5" fill="#f59e0b" />
                      <circle cx="58" cy="0" r="1.5" fill="#f59e0b" />
                      <text x="0" y="3.5" textAnchor="middle" fill="#f59e0b" fontSize="7" fontWeight="900">
                        LOCKED IP: ???.???.???.??
                      </text>
                    </g>
                  )}
                </g>
              </g>

              {/* ────────────────────────────────────────────────────────────────
                  SINGLE UNIFIED STATUS BANNER AT (760, 48) - NEVER STACKS!
                  ──────────────────────────────────────────────────────────────── */}
              {l2Banner && (
                <g transform="translate(760, 48)" filter="url(#controlShadow)">
                  <rect
                    x="-180"
                    y="-14"
                    width="360"
                    height="28"
                    rx="6"
                    fill={l2Banner.isError ? "#fee2e2" : "#ffffff"}
                    fillOpacity="0.98"
                    stroke={l2Banner.isError ? "#ef4444" : "#10b981"}
                    strokeWidth="2"
                  />
                  <polygon
                    points="0,14 -7,19 7,19"
                    fill={l2Banner.isError ? "#fee2e2" : "#ffffff"}
                    stroke={l2Banner.isError ? "#ef4444" : "#10b981"}
                    strokeWidth="1"
                  />
                  <text
                    x="0"
                    y="4.5"
                    textAnchor="middle"
                    fill={l2Banner.isError ? "#b91c1c" : "#0f172a"}
                    fontSize="7"
                    fontWeight="900"
                  >
                    {l2Banner.text}
                  </text>
                </g>
              )}

              {/* ────────────────────────────────────────────────────────────────
                  RIGHT: SUNLIT SKY-PORT GLASS CONTROL TOWER (x = 1040..1180)
                  ──────────────────────────────────────────────────────────────── */}
              <g transform="translate(1040, 215)" filter="url(#controlShadow)">
                <rect x="0" y="0" width="115" height="320" rx="8" fill="url(#glassControlTower)" stroke="#0284c7" strokeWidth="2" />
                <line x1="15" y1="20" x2="95" y2="180" stroke="#ffffff" strokeWidth="1.5" opacity="0.75" />
                <line x1="45" y1="10" x2="105" y2="130" stroke="#ffffff" strokeWidth="1" opacity="0.5" />

                <g transform={`translate(58, -14) rotate(${animTime * 180})`}>
                  <ellipse cx="0" cy="0" rx="18" ry="7" fill="#ffffff" stroke="#0284c7" strokeWidth="1.5" />
                  <circle cx="0" cy="0" r="3" fill="#0284c7" />
                </g>

                <text x="58" y="24" textAnchor="middle" fill="#0369a1" fontSize="7" fontWeight="900" letterSpacing="0.6">
                  SKY-PORT TOWER
                </text>

                <g transform="translate(18, 38)">
                  <circle cx="10" cy="0" r="5" fill={l2DockedCount >= 1 ? "#10b981" : "#cbd5e1"} filter={l2DockedCount >= 1 ? "url(#softGlow)" : undefined} />
                  <circle cx="28" cy="0" r="5" fill={l2DockedCount >= 2 ? "#10b981" : "#cbd5e1"} filter={l2DockedCount >= 2 ? "url(#softGlow)" : undefined} />
                  <circle cx="46" cy="0" r="5" fill={l2DockedCount >= 3 ? "#10b981" : "#cbd5e1"} filter={l2DockedCount >= 3 ? "url(#softGlow)" : undefined} />
                  <circle cx="64" cy="0" r="5" fill={l2DockedCount >= 4 ? "#10b981" : "#cbd5e1"} filter={l2DockedCount >= 4 ? "url(#softGlow)" : undefined} />
                  <text x="37" y="14" textAnchor="middle" fill="#0369a1" fontSize="5.5" fontWeight="800">
                    DOCKED {l2DockedCount}/4
                  </text>
                </g>

                {/* Arrival Scanner Archway at y = 240 (Corresponds to y = 455 Stage Level) */}
                <g transform="translate(0, 240)">
                  <line
                    x1="0"
                    y1="-40"
                    x2="0"
                    y2="40"
                    stroke={l2AirshipBouncing ? "#ef4444" : l2AirshipFlying ? "#10b981" : "#f59e0b"}
                    strokeWidth="4"
                    filter="url(#laserBeam)"
                  />
                  <circle cx="0" cy="-40" r="6" fill={l2AirshipBouncing ? "#ef4444" : l2AirshipFlying ? "#10b981" : "#f59e0b"} />
                  <circle cx="0" cy="40" r="6" fill={l2AirshipBouncing ? "#ef4444" : l2AirshipFlying ? "#10b981" : "#f59e0b"} />
                  <text x="12" y="4" fill={l2AirshipBouncing ? "#b91c1c" : l2AirshipFlying ? "#059669" : "#b45309"} fontSize="6.5" fontWeight="900">
                    {l2AirshipBouncing ? "SEALED" : l2AirshipFlying ? "GATE OPEN" : "LOCKED"}
                  </text>
                </g>
              </g>

              {/* Gate Alert Flash */}
              {l2GateAlert && (
                <g transform="translate(1040, 410)" filter="url(#controlShadow)">
                  <rect x="-140" y="-12" width="280" height="24" rx="6" fill="#fee2e2" stroke="#ef4444" strokeWidth="2" />
                  <text x="0" y="4" textAnchor="middle" fill="#991b1b" fontSize="6.5" fontWeight="900">
                    {l2GateAlert}
                  </text>
                </g>
              )}

              {/* ────────────────────────────────────────────────────────────────
                  BOTTOM SKY CORRIDOR: UPGRADED CARGO DIRIGIBLE & RUNWAY AT y = 455
                  Twin tail fins, cargo doors, recessed display width="220"
                  CARGO AIRSHIP above hull at y = -48
                  4 Domain blocks centered at y = -18
                  Active Step Badge cleanly BELOW blocks at y = +8 (zero overlap!)
                  Suspended gondola at y = +28 with piece-by-piece stamped IP
                  Interactive LAUNCH AIRSHIP throttle at (185, 515)
                  ──────────────────────────────────────────────────────────────── */}
              <line x1="40" y1="492" x2="1040" y2="492" stroke="#bae6fd" strokeWidth="3" strokeDasharray="12 6" />

              {/* ── CARGO AIRSHIP DIRIGIBLE (x = l2AirshipX, y = 455) ── */}
              <g
                className={!l2AirshipFlying && !l2AirshipIp.includes("?") ? "cursor-pointer" : undefined}
                onClick={!l2AirshipFlying && !l2AirshipIp.includes("?") ? () => launchAirshipFlight(l2Wave, false) : undefined}
                transform={`translate(${l2AirshipX}, 455)`}
                opacity={l2AirshipX >= 1030 ? 0 : 1}
                filter="url(#controlShadow)"
              >
                {/* Twin Aerofoil Tail Fins */}
                <polygon points="-120,-14 -148,-32 -136,-10" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
                <polygon points="-120,14 -148,32 -136,10" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />

                {/* Silver Dirigible Hull Envelope rx="135" ry="34" */}
                <ellipse cx="0" cy="0" rx="135" ry="34" fill="url(#airshipSilver)" stroke="#0284c7" strokeWidth="2.5" />

                {/* Spinning Rear Propeller */}
                <g transform={`translate(-146, 0) rotate(${animTime * 1100})`}>
                  <line x1="0" y1="-14" x2="0" y2="14" stroke="#ca8a04" strokeWidth="3.5" strokeLinecap="round" />
                  <circle cx="0" cy="0" r="3.5" fill="#854d0e" />
                </g>

                {/* Cargo Bay Door Seams */}
                <line x1="-105" y1="-22" x2="-105" y2="22" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 2" />
                <line x1="105" y1="-22" x2="105" y2="22" stroke="#94a3b8" strokeWidth="1" strokeDasharray="3 2" />
                <line x1="-110" y1="0" x2="110" y2="0" stroke="#bae6fd" strokeWidth="1" opacity="0.6" />

                {/* CARGO AIRSHIP cleanly ABOVE hull at y = -48 */}
                <text x="0" y="-48" textAnchor="middle" fill="#0369a1" fontSize="7.5" fontWeight="900" letterSpacing="0.8">
                  CARGO AIRSHIP
                </text>

                {/* Wide Recessed Hull Display (width="220") at y = -18 */}
                <rect x="-110" y="-29" width="220" height="22" rx="4" fill="#0f172a" stroke="#0284c7" strokeWidth="1.2" />

                {/* 4 Domain Blocks inside Recessed Display */}
                <g transform="translate(0, -18)">
                  {l2Wave === 4 ? (
                    <g>
                      {/* weather */}
                      <rect x="-106" y="-9" width="48" height="18" rx="3" fill={l2Conn === "auth" ? "#ecfdf5" : "#1e293b"} stroke={l2Conn === "auth" ? "#10b981" : "#475569"} strokeWidth="1" />
                      <text x="-82" y="3.5" textAnchor="middle" fill={l2Conn === "auth" ? "#059669" : "#e2e8f0"} fontSize="7" fontWeight="900">weather</text>
                      <text x="-54" y="4" fill="#38bdf8" fontSize="8" fontWeight="900">.</text>

                      {/* nasa */}
                      <rect x="-46" y="-9" width="44" height="18" rx="3" fill={l2Conn === "auth" ? "#ecfdf5" : "#1e293b"} stroke={l2Conn === "auth" ? "#10b981" : "#475569"} strokeWidth="1" />
                      <text x="-24" y="3.5" textAnchor="middle" fill={l2Conn === "auth" ? "#059669" : "#e2e8f0"} fontSize="7" fontWeight="900">nasa</text>
                      <text x="3" y="4" fill="#38bdf8" fontSize="8" fontWeight="900">.</text>

                      {/* gov */}
                      <rect x="9" y="-9" width="36" height="18" rx="3" fill={l2Conn === "tld" || l2Conn === "auth" ? "#ecfdf5" : "#1e293b"} stroke={l2Conn === "tld" || l2Conn === "auth" ? "#10b981" : "#475569"} strokeWidth="1" />
                      <text x="27" y="3.5" textAnchor="middle" fill={l2Conn === "tld" || l2Conn === "auth" ? "#059669" : "#38bdf8"} fontSize="7" fontWeight="900">gov</text>
                      <text x="49" y="4" fill="#38bdf8" fontSize="8" fontWeight="900">.</text>

                      {/* . */}
                      <rect x="55" y="-9" width="26" height="18" rx="3" fill={l2Conn !== "idle" ? "#ecfdf5" : "#1e293b"} stroke={l2Conn !== "idle" ? "#10b981" : "#475569"} strokeWidth="1" />
                      <text x="68" y="4.5" textAnchor="middle" fill={l2Conn !== "idle" ? "#059669" : "#38bdf8"} fontSize="8" fontWeight="900">.</text>
                    </g>
                  ) : (
                    <g>
                      {/* cam */}
                      <rect x="-96" y="-9" width="36" height="18" rx="3" fill={l2Conn === "auth" || (l2Wave === 2 && l2AirshipFlying) ? "#ecfdf5" : "#1e293b"} stroke={l2Conn === "auth" || (l2Wave === 2 && l2AirshipFlying) ? "#10b981" : "#475569"} strokeWidth="1" />
                      <text x="-78" y="3.5" textAnchor="middle" fill={l2Conn === "auth" || (l2Wave === 2 && l2AirshipFlying) ? "#059669" : "#e2e8f0"} fontSize="7" fontWeight="900">cam</text>
                      <text x="-55" y="4" fill="#38bdf8" fontSize="8" fontWeight="900">.</text>

                      {/* oceanlab */}
                      <rect x="-48" y="-9" width="60" height="18" rx="3" fill={l2Conn === "auth" || (l2Wave === 2 && l2AirshipFlying) ? "#ecfdf5" : "#1e293b"} stroke={l2Conn === "auth" || (l2Wave === 2 && l2AirshipFlying) ? "#10b981" : "#475569"} strokeWidth="1" />
                      <text x="-18" y="3.5" textAnchor="middle" fill={l2Conn === "auth" || (l2Wave === 2 && l2AirshipFlying) ? "#059669" : "#e2e8f0"} fontSize="7" fontWeight="900">oceanlab</text>
                      <text x="16" y="4" fill="#38bdf8" fontSize="8" fontWeight="900">.</text>

                      {/* org */}
                      <rect x="22" y="-9" width="36" height="18" rx="3" fill={l2Conn === "tld" || l2Conn === "auth" || (l2Wave === 2 && l2AirshipFlying) ? "#ecfdf5" : "#1e293b"} stroke={l2Conn === "tld" || l2Conn === "auth" || (l2Wave === 2 && l2AirshipFlying) ? "#10b981" : "#475569"} strokeWidth="1" />
                      <text x="40" y="3.5" textAnchor="middle" fill={l2Conn === "tld" || l2Conn === "auth" || (l2Wave === 2 && l2AirshipFlying) ? "#059669" : "#38bdf8"} fontSize="7" fontWeight="900">org</text>
                      <text x="62" y="4" fill="#38bdf8" fontSize="8" fontWeight="900">.</text>

                      {/* . */}
                      <rect x="68" y="-9" width="26" height="18" rx="3" fill={l2Conn !== "idle" || (l2Wave === 2 && l2AirshipFlying) ? "#ecfdf5" : "#1e293b"} stroke={l2Conn !== "idle" || (l2Wave === 2 && l2AirshipFlying) ? "#10b981" : "#475569"} strokeWidth="1" />
                      <text x="81" y="4.5" textAnchor="middle" fill={l2Conn !== "idle" || (l2Wave === 2 && l2AirshipFlying) ? "#059669" : "#38bdf8"} fontSize="8" fontWeight="900">.</text>
                    </g>
                  )}
                </g>

                {/* Active Step Badge cleanly BELOW blocks at y = +8 (Never touches hull outline!) */}
                <g transform="translate(0, 8)">
                  <rect x="-85" y="-7" width="170" height="14" rx="3" fill="#f0f9ff" stroke="#bae6fd" strokeWidth="1" />
                  <text x="0" y="3" textAnchor="middle" fill="#0284c7" fontSize="6" fontWeight="900">
                    {l2Conn === "idle"
                      ? "1. FIND [.]"
                      : l2Conn === "root"
                      ? (l2Wave === 4 ? "2. FIND [.GOV]" : "2. FIND [.ORG]")
                      : l2Conn === "tld"
                      ? (l2Wave === 4 ? "3. FIND [nasa.gov]" : "3. FIND [oceanlab.org]")
                      : "ALL 3 HOPS RESOLVED • IP STAMPED!"}
                  </text>
                </g>

                {/* Suspended Gondola Below Envelope at y = 28 (Piece-by-piece stamped IP) */}
                <g transform="translate(0, 28)">
                  <rect x="-55" y="-10" width="110" height="20" rx="4" fill="#ffffff" stroke="#0284c7" strokeWidth="1.5" />
                  <rect
                    x="-48"
                    y="-8"
                    width="96"
                    height="16"
                    rx="3"
                    fill={l2AirshipIp.includes("?") ? "#fef3c7" : "#ecfdf5"}
                    stroke={l2AirshipIp.includes("?") ? "#f59e0b" : "#10b981"}
                    strokeWidth="1.2"
                  />
                  <text
                    x="0"
                    y="3.5"
                    textAnchor="middle"
                    fill={l2AirshipIp.includes("?") ? "#b45309" : "#059669"}
                    fontSize="7"
                    fontWeight="900"
                  >
                    {l2AirshipIp}
                  </text>
                </g>

                {/* Jet Stream while Flying */}
                {l2AirshipFlying && (
                  <g filter="url(#laserBeam)">
                    <polygon points="-135,-4 -180,0 -135,4" fill="#38bdf8" opacity="0.8" />
                    <circle cx="-155" cy="0" r="4" fill="#ffffff" />
                  </g>
                )}
              </g>

              {/* ── INTERACTIVE 'LAUNCH AIRSHIP ->' THROTTLE ON RUNWAY (185, 515) ── */}
              {!l2AirshipFlying && !l2AirshipIp.includes("?") && l2DockedCount < 4 && !showSummaryOverlay && (
                <g
                  className="cursor-pointer"
                  onClick={() => launchAirshipFlight(l2Wave, false)}
                  transform="translate(185, 515)"
                  filter="url(#softGlow)"
                >
                  <rect x="-72" y="-12" width="144" height="24" rx="5" fill="#10b981" stroke="#059669" strokeWidth="2" />
                  <polygon points="44,-4 52,0 44,4" fill="#ffffff" />
                  <text x="-6" y="4" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="900">
                    LAUNCH AIRSHIP &rarr;
                  </text>
                </g>
              )}
            </g>
          )}

          {/* ==================================================================
              ENVIRONMENT 3: SUNLIT LIBRARY BOOKSHOP (404 • 503 • 403 -> 200 OK)
              Full-screen illustrated interactive physical-props experience
              ================================================================== */}
          {level === 3 && (
            <g fontFamily="'Inter', 'Plus Jakarta Sans', system-ui, -apple-system, sans-serif" letterSpacing="0.02em">
              {/* ─────────────────────────────────────────────────────────────
                  TOP BAR (y = 12..50): 3 SITUATION TABS (Auto-advancing + Clickable)
                  ───────────────────────────────────────────────────────────── */}
              {/* Tab 1: 404 NOT FOUND */}
              <g
                className="cursor-pointer"
                onClick={() => setL3Situation(1)}
                transform="translate(24, 12)"
                filter="url(#controlShadow)"
              >
                <rect
                  x="0"
                  y="0"
                  width="370"
                  height="38"
                  rx="8"
                  fill={l3Situation === 1 ? "#ffffff" : "#fefce8"}
                  stroke={gear1Rotated ? "#10b981" : l3Situation === 1 ? "#0284c7" : "#cbd5e1"}
                  strokeWidth={l3Situation === 1 ? "2.5" : "1.2"}
                />
                <circle cx="16" cy="19" r="6" fill={gear1Rotated ? "#10b981" : "#ef4444"} />
                <text x="28" y="16" fill="#0f172a" fontSize="8" fontWeight="900">
                  1. MISSING BOOK (<tspan fontFamily="'JetBrains Mono', monospace">404 NOT FOUND</tspan>)
                </text>
                <text
                  x="28"
                  y="28"
                  fill={gear1Rotated ? "#059669" : "#b91c1c"}
                  fontSize="7"
                  fontWeight="800"
                >
                  {gear1Rotated ? "200 OK • FOUND ON /v2/reef-map" : "404 NOT FOUND • SHELF #999 EMPTY"}
                </text>
                {l3Situation === 1 && (
                  <rect x="300" y="8" width="58" height="22" rx="4" fill="#0284c7" />
                )}
                {l3Situation === 1 && (
                  <text x="329" y="22" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="900">
                    ACTIVE
                  </text>
                )}
              </g>

              {/* Tab 2: 503 SERVICE UNAVAILABLE */}
              <g
                className="cursor-pointer"
                onClick={() => setL3Situation(2)}
                transform="translate(415, 12)"
                filter="url(#controlShadow)"
              >
                <rect
                  x="0"
                  y="0"
                  width="370"
                  height="38"
                  rx="8"
                  fill={l3Situation === 2 ? "#ffffff" : "#fefce8"}
                  stroke={sluice2Split ? "#10b981" : l3Situation === 2 ? "#d97706" : "#cbd5e1"}
                  strokeWidth={l3Situation === 2 ? "2.5" : "1.2"}
                />
                <circle cx="16" cy="19" r="6" fill={sluice2Split ? "#10b981" : "#f59e0b"} />
                <text x="28" y="16" fill="#0f172a" fontSize="8" fontWeight="900">
                  2. CROWDED COUNTER (<tspan fontFamily="'JetBrains Mono', monospace">503 SERVICE UNAVAILABLE</tspan>)
                </text>
                <text
                  x="28"
                  y="28"
                  fill={sluice2Split ? "#059669" : "#b45309"}
                  fontSize="7"
                  fontWeight="800"
                >
                  {sluice2Split ? "200 OK • 2 CLERKS OPEN (50/50 QUEUE)" : "503 BUSY • COUNTER JAMMED (10k REQ)"}
                </text>
                {l3Situation === 2 && (
                  <rect x="300" y="8" width="58" height="22" rx="4" fill="#d97706" />
                )}
                {l3Situation === 2 && (
                  <text x="329" y="22" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="900">
                    ACTIVE
                  </text>
                )}
              </g>

              {/* Tab 3: 403 FORBIDDEN (Pulsing gentle border when Situation 2 solved!) */}
              <g
                className="cursor-pointer"
                onClick={() => setL3Situation(3)}
                transform="translate(805, 12)"
                filter="url(#controlShadow)"
              >
                <rect
                  x="0"
                  y="0"
                  width="370"
                  height="38"
                  rx="8"
                  fill={l3Situation === 3 ? "#ffffff" : "#fefce8"}
                  stroke={
                    l3Situation === 3
                      ? "#7c3aed"
                      : key3Inserted
                      ? "#10b981"
                      : sluice2Split
                      ? "#10b981"
                      : "#cbd5e1"
                  }
                  strokeWidth={l3Situation === 3 ? "2.5" : sluice2Split && !key3Inserted ? "2.5" : "1.2"}
                  filter={sluice2Split && !key3Inserted && l3Situation !== 3 ? "url(#softGlow)" : undefined}
                />
                <circle cx="16" cy="19" r="6" fill={key3Inserted ? "#10b981" : "#8b5cf6"} />
                <text x="28" y="16" fill="#0f172a" fontSize="8" fontWeight="900">
                  3. VIP ARCHIVE (<tspan fontFamily="'JetBrains Mono', monospace">403 FORBIDDEN</tspan>)
                </text>
                <text
                  x="28"
                  y="28"
                  fill={key3Inserted ? "#059669" : "#6d28d9"}
                  fontSize="7"
                  fontWeight="800"
                >
                  {key3Inserted ? "200 OK • TLS 443 PASS VERIFIED" : "403 LOCKED • NO VIP PASS PRESENTED"}
                </text>

                {l3Situation === 3 && (
                  <>
                    <rect x="300" y="8" width="58" height="22" rx="4" fill="#7c3aed" />
                    <text x="329" y="22" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="900">
                      ACTIVE
                    </text>
                  </>
                )}
              </g>

              

              {/* ─────────────────────────────────────────────────────────────
                  MID SCENE: ILLUSTRATED LIBRARY BOOKSHOP INTERIOR (y = 56..330)
                  ───────────────────────────────────────────────────────────── */}

              {/* Left Arched Windows & Translucent Sunbeams */}
              <g transform="translate(24, 60)">
                {/* Window 1 */}
                <path d="M 12 70 A 32 32 0 0 1 76 70 L 76 220 L 12 220 Z" fill="#7dd3fc" stroke="#d97706" strokeWidth="2.5" />
                <path d="M 22 72 A 22 22 0 0 1 66 72 L 66 215 L 22 215 Z" fill="#bae6fd" opacity="0.6" />
                <line x1="44" y1="40" x2="44" y2="220" stroke="#d97706" strokeWidth="2" />
                <line x1="12" y1="120" x2="76" y2="120" stroke="#d97706" strokeWidth="2" />
                <line x1="12" y1="170" x2="76" y2="170" stroke="#d97706" strokeWidth="2" />
                <rect x="6" y="220" width="76" height="8" rx="2" fill="#b45309" stroke="#78350f" strokeWidth="1" />

                {/* Window 2 */}
                <path d="M 96 70 A 32 32 0 0 1 160 70 L 160 220 L 96 220 Z" fill="#7dd3fc" stroke="#d97706" strokeWidth="2.5" />
                <path d="M 106 72 A 22 22 0 0 1 150 72 L 150 215 L 106 215 Z" fill="#bae6fd" opacity="0.6" />
                <line x1="128" y1="40" x2="128" y2="220" stroke="#d97706" strokeWidth="2" />
                <line x1="96" y1="120" x2="160" y2="120" stroke="#d97706" strokeWidth="2" />
                <line x1="96" y1="170" x2="160" y2="170" stroke="#d97706" strokeWidth="2" />
                <rect x="90" y="220" width="76" height="8" rx="2" fill="#b45309" stroke="#78350f" strokeWidth="1" />

                {/* Potted Plant on Window Sill */}
                <polygon points="120,220 136,220 133,204 123,204" fill="#b45309" stroke="#78350f" strokeWidth="1" />
                <circle cx="128" cy="198" r="9" fill="#10b981" />
                <circle cx="122" cy="194" r="6" fill="#059669" />
                <circle cx="134" cy="194" r="6" fill="#34d399" />

                {/* Translucent Sunbeams Streaming In */}
                <polygon points="16,65 156,65 310,270 90,270" fill="#fef08a" opacity="0.22" pointerEvents="none" />
              </g>

              {/* ─────────────────────────────────────────────────────────────
                  CENTER BOOKSHELF (x = 415..635, y = 62..328)
                  ───────────────────────────────────────────────────────────── */}
              <g transform="translate(415, 62)">
                <rect x="0" y="16" width="220" height="252" rx="4" fill="url(#woodOak)" stroke="#78350f" strokeWidth="3" />
                <polygon points="0,16 110,0 220,16" fill="#92400e" stroke="#78350f" strokeWidth="2" />
                <rect x="30" y="6" width="160" height="12" rx="3" fill="#fef3c7" stroke="#b45309" strokeWidth="1" />
                <text x="110" y="15" textAnchor="middle" fill="#78350f" fontSize="7.5" fontWeight="900">
                  ROYAL NAUTICAL ARCHIVE
                </text>

                {/* Shelf 1 (y = 66) */}
                <rect x="10" y="22" width="200" height="50" fill="#78350f" opacity="0.3" />
                <line x1="8" y1="72" x2="212" y2="72" stroke="#fde68a" strokeWidth="3" />
                <rect x="16" y="30" width="14" height="42" rx="2" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
                <rect x="32" y="26" width="16" height="46" rx="2" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1" />
                <rect x="50" y="32" width="12" height="40" rx="2" fill="#10b981" stroke="#047857" strokeWidth="1" />
                <rect x="64" y="28" width="18" height="44" rx="2" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
                <rect x="84" y="34" width="15" height="38" rx="2" fill="#8b5cf6" stroke="#6d28d9" strokeWidth="1" />
                <rect x="101" y="27" width="14" height="45" rx="2" fill="#06b6d4" stroke="#0891b2" strokeWidth="1" />
                <rect x="117" y="31" width="18" height="41" rx="2" fill="#ec4899" stroke="#be185d" strokeWidth="1" />
                <rect x="137" y="25" width="20" height="47" rx="2" fill="#64748b" stroke="#334155" strokeWidth="1" />
                <rect x="159" y="33" width="16" height="39" rx="2" fill="#84cc16" stroke="#4d7c0f" strokeWidth="1" />
                <rect x="177" y="28" width="18" height="44" rx="2" fill="#d97706" stroke="#92400e" strokeWidth="1" />

                {/* Shelf 2 (y = 126) - THE TARGET SHELF FOR 404 (Shelf #999) */}
                <rect x="10" y="76" width="200" height="54" fill="#78350f" opacity="0.3" />
                <line x1="8" y1="130" x2="212" y2="130" stroke="#fde68a" strokeWidth="3" />
                <rect x="16" y="86" width="16" height="44" rx="2" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
                <text x="24" y="112" textAnchor="middle" fill="#0369a1" fontSize="6" fontWeight="900" transform="rotate(-90 24 112)">#997</text>
                <rect x="34" y="84" width="16" height="46" rx="2" fill="#60a5fa" stroke="#2563eb" strokeWidth="1" />
                <text x="42" y="112" textAnchor="middle" fill="#1e40af" fontSize="6" fontWeight="900" transform="rotate(-90 42 112)">#998</text>

                {/* SLOT #999 (EMPTY 404 vs RESOLVED 200 OK BOOK) */}
                <g transform="translate(56, 80)">
                  {gear1Rotated ? (
                    // 200 OK: FOUND ON SHELF /v2/reef-map
                    <g filter="url(#softGlow)">
                      <rect x="0" y="2" width="60" height="48" rx="3" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.8" />
                      <rect x="6" y="6" width="48" height="40" rx="2" fill="#0369a1" />
                      <text x="30" y="19" textAnchor="middle" fill="#fde68a" fontSize="7" fontWeight="900">
                        REEF MAP
                      </text>
                      <text x="30" y="29" textAnchor="middle" fill="#a7f3d0" fontSize="6.5" fontWeight="900" fontFamily="'JetBrains Mono', monospace">
                        /v2 EDITION
                      </text>
                      <rect x="10" y="34" width="40" height="10" rx="2" fill="#10b981" />
                      <text x="30" y="42" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontWeight="900" fontFamily="'JetBrains Mono', monospace">
                        200 OK
                      </text>
                      <path d="M 28 42 L 32 42 L 34 52 L 30 49 L 26 52 Z" fill="#f59e0b" />
                    </g>
                  ) : (
                    // 404 NOT FOUND: EMPTY DASHED OUTLINE WITH TAG
                    <g>
                      <rect
                        x="0"
                        y="2"
                        width="60"
                        height="48"
                        rx="3"
                        fill="#fee2e2"
                        fillOpacity="0.85"
                        stroke="#ef4444"
                        strokeWidth="1.8"
                        strokeDasharray="4 3"
                      />
                      <text x="30" y="18" textAnchor="middle" fill="#b91c1c" fontSize="7" fontWeight="900" fontFamily="'JetBrains Mono', monospace">
                        SHELF #999
                      </text>
                      <text x="30" y="29" textAnchor="middle" fill="#ef4444" fontSize="7.5" fontWeight="900">
                        EMPTY
                      </text>
                      <rect x="4" y="34" width="52" height="12" rx="2" fill="#dc2626" />
                      <text x="30" y="43" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontWeight="900" fontFamily="'JetBrains Mono', monospace">
                        404 NOT FOUND
                      </text>
                    </g>
                  )}
                </g>

                <rect x="124" y="88" width="16" height="42" rx="2" fill="#a855f7" stroke="#7e22ce" strokeWidth="1" />
                <rect x="142" y="82" width="18" height="48" rx="2" fill="#f97316" stroke="#c2410c" strokeWidth="1" />
                <rect x="162" y="86" width="16" height="44" rx="2" fill="#14b8a6" stroke="#0f766e" strokeWidth="1" />
                <rect x="180" y="84" width="18" height="46" rx="2" fill="#64748b" stroke="#334155" strokeWidth="1" />

                {/* Shelf 3 (y = 184) */}
                <rect x="10" y="134" width="200" height="54" fill="#78350f" opacity="0.3" />
                <line x1="8" y1="188" x2="212" y2="188" stroke="#fde68a" strokeWidth="3" />
                <rect x="16" y="142" width="22" height="46" rx="2" fill="#1e3a8a" stroke="#172554" strokeWidth="1" />
                <rect x="40" y="146" width="24" height="42" rx="2" fill="#047857" stroke="#064e3b" strokeWidth="1" />
                <rect x="66" y="140" width="20" height="48" rx="2" fill="#78350f" stroke="#451a03" strokeWidth="1" />
                <rect x="88" y="144" width="26" height="44" rx="2" fill="#b45309" stroke="#78350f" strokeWidth="1" />
                <rect x="116" y="142" width="22" height="46" rx="2" fill="#4338ca" stroke="#312e81" strokeWidth="1" />
                <rect x="140" y="148" width="24" height="40" rx="2" fill="#0e7490" stroke="#155e75" strokeWidth="1" />
                <rect x="166" y="144" width="32" height="44" rx="2" fill="#334155" stroke="#1e293b" strokeWidth="1" />

                {/* Shelf 4 (y = 244) */}
                <rect x="10" y="192" width="200" height="56" fill="#78350f" opacity="0.3" />
                <line x1="8" y1="248" x2="212" y2="248" stroke="#fde68a" strokeWidth="3" />
                <rect x="16" y="200" width="34" height="48" rx="2" fill="#451a03" stroke="#290e02" strokeWidth="1" />
                <rect x="52" y="202" width="36" height="46" rx="2" fill="#581c87" stroke="#3b0764" strokeWidth="1" />
                <rect x="90" y="198" width="38" height="50" rx="2" fill="#14532d" stroke="#052e16" strokeWidth="1" />
                <rect x="130" y="204" width="36" height="44" rx="2" fill="#701a75" stroke="#4a044e" strokeWidth="1" />
                <rect x="168" y="200" width="32" height="48" rx="2" fill="#1e293b" stroke="#0f172a" strokeWidth="1" />
              </g>

              {/* ─────────────────────────────────────────────────────────────
                  CLEAN CUSTOMER & SHOPKEEPER SPEECH BUBBLES (y = 70, height = 52)
                  Clean breathing room below tabs, zero overlapping text
                  ───────────────────────────────────────────────────────────── */}
              {/* Customer Speech Bubble (Left: x = 125, y = 62) */}
              <g transform="translate(125, 62)" filter="url(#controlShadow)">
                <rect x="0" y="0" width="275" height="52" rx="7" fill="#ffffff" fillOpacity="0.98" stroke="#0284c7" strokeWidth="1.5" />
                {l3Situation === 3 ? (
                  // Pointer tail on right aimed toward Customer in the aisle
                  <>
                    <polygon points="275,22 288,27 275,32" fill="#ffffff" />
                    <line x1="275" y1="22" x2="288" y2="27" stroke="#0284c7" strokeWidth="1.5" />
                    <line x1="288" y1="27" x2="275" y2="32" stroke="#0284c7" strokeWidth="1.5" />
                  </>
                ) : (
                  // Pointer tail aimed down-left at Customer
                  <>
                    <polygon points="120,52 112,61 130,52" fill="#ffffff" />
                    <line x1="120" y1="52" x2="112" y2="61" stroke="#0284c7" strokeWidth="1.5" />
                    <line x1="112" y1="61" x2="130" y2="52" stroke="#0284c7" strokeWidth="1.5" />
                  </>
                )}

                {/* Status Pill Badge */}
                <rect x="12" y="8" width="136" height="15" rx="3" fill="#e0f2fe" stroke="#38bdf8" strokeWidth="1" />
                <text x="80" y="19" textAnchor="middle" fill="#0369a1" fontSize="7" fontWeight="900" fontFamily="'JetBrains Mono', monospace">
                  {l3Situation === 1 ? "HTTP 404 • BOOK REQUEST" : l3Situation === 2 ? "HTTP 503 • CONCURRENCY" : "HTTP 403 • ACCESS CONTROL"}
                </text>

                {/* 1 Line of Dialogue */}
                <text x="14" y="38" fill="#0f172a" fontSize="8" fontWeight="800">
                  {l3Situation === 1 && "Need Reef Map from old shelf /reef-map (#999)."}
                  {l3Situation === 2 && "10,000 of us need the Live Tide book right now!"}
                  {l3Situation === 3 && "Let me into the VIP Archive room for buoy logs."}
                </text>
              </g>

              {/* Shopkeeper Speech Bubble (Right: x = 610, y = 62, width = 250) - Visible across all situations */}
              <g transform="translate(610, 62)" filter="url(#controlShadow)">
                <rect x="0" y="0" width="250" height="52" rx="7" fill="#ffffff" fillOpacity="0.98" stroke="#0f172a" strokeWidth="1.5" />
                <polygon points="110,52 102,61 120,52" fill="#ffffff" />
                <line x1="110" y1="52" x2="102" y2="61" stroke="#0f172a" strokeWidth="1.5" />
                <line x1="102" y1="61" x2="120" y2="52" stroke="#0f172a" strokeWidth="1.5" />

                {/* Status Pill Badge */}
                <rect
                  x="12"
                  y="8"
                  width="160"
                  height="15"
                  rx="3"
                  fill={
                    l3Situation === 1
                      ? gear1Rotated ? "#ecfdf5" : "#fee2e2"
                      : l3Situation === 2
                      ? sluice2Split ? "#ecfdf5" : "#fef3c7"
                      : key3Inserted ? "#ecfdf5" : "#fee2e2"
                  }
                  stroke={
                    l3Situation === 1
                      ? gear1Rotated ? "#10b981" : "#ef4444"
                      : l3Situation === 2
                      ? sluice2Split ? "#10b981" : "#f59e0b"
                      : key3Inserted ? "#10b981" : "#ef4444"
                  }
                  strokeWidth="1"
                />
                <text
                  x="92"
                  y="19"
                  textAnchor="middle"
                  fill={
                    l3Situation === 1
                      ? gear1Rotated ? "#059669" : "#b91c1c"
                      : l3Situation === 2
                      ? sluice2Split ? "#059669" : "#b45309"
                      : key3Inserted ? "#059669" : "#b91c1c"
                  }
                  fontSize="7"
                  fontWeight="900"
                  fontFamily="'JetBrains Mono', monospace"
                >
                  {l3Situation === 1
                    ? gear1Rotated ? "200 OK • FOUND (/v2)" : "404 NOT FOUND • EMPTY"
                    : l3Situation === 2
                    ? sluice2Split ? "200 OK • LOAD BALANCED" : "503 BUSY • JAMMED"
                    : key3Inserted ? "200 OK • AUTHORIZED" : "403 FORBIDDEN • LOCKED"}
                </text>

                {/* 1 Line of Dialogue */}
                <text x="14" y="38" fill="#0f172a" fontSize="7.8" fontWeight="800">
                  {l3Situation === 1 && (gear1Rotated ? "200 OK — Found it on Shelf /v2/reef-map!" : "404 Not Found — Shelf #999 is empty!")}
                  {l3Situation === 2 && (sluice2Split ? "200 OK — Two counters open! Queue split 50/50." : "503 Busy — Single counter jammed!")}
                  {l3Situation === 3 && (key3Inserted ? "200 OK — TLS 443 Pass verified!" : "403 Forbidden — VIP TLS pass required!")}
                </text>
              </g>

              {/* ─────────────────────────────────────────────────────────────
                  TRUE 2.5D LAYER 1 (BEHIND COUNTER): CLERKS VISIBLE FROM WAIST UP
                  Waist-up bodies standing behind desk, hands resting on counter (y = 248)
                  ───────────────────────────────────────────────────────────── */}
              {/* Station 1: Shopkeeper (Clerk 1) behind Counter 1 (x = 745, y = 145) */}
              <g transform="translate(745, 145)">
                {/* Neck & Collared Shirt */}
                <rect x="-6" y="26" width="12" height="14" rx="3" fill="#fed7aa" stroke="#c2410c" strokeWidth="1" />
                <rect x="-26" y="38" width="52" height="66" rx="14" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />

                {/* Tailored Librarian Apron/Vest (#b45309) */}
                <path d="M -22 42 C -22 42 -12 40 -8 54 L -12 103 L -26 103 C -26 70 -26 50 -22 42 Z" fill="#b45309" stroke="#78350f" strokeWidth="1.2" />
                <path d="M 22 42 C 22 42 12 40 8 54 L 12 103 L 26 103 C 26 70 26 50 22 42 Z" fill="#b45309" stroke="#78350f" strokeWidth="1.2" />
                <polygon points="-8,40 8,40 0,54" fill="#f8fafc" />
                <polygon points="-3,44 0,48 3,44 0,54" fill="#991b1b" />
                <line x1="0" y1="54" x2="0" y2="103" stroke="#cbd5e1" strokeWidth="1.2" />
                <circle cx="0" cy="62" r="1.2" fill="#78350f" />
                <circle cx="0" cy="74" r="1.2" fill="#78350f" />
                <circle cx="0" cy="86" r="1.2" fill="#78350f" />

                {/* Readable Chest Badge: CLERK 1 */}
                <rect x="-17" y="58" width="34" height="11" rx="2.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.8" />
                <text x="0" y="66.5" textAnchor="middle" fill="#0f172a" fontSize="6.2" fontWeight="900" letterSpacing="0.5">CLERK 1</text>

                {/* Bent Sleeves with Hands Resting on Counter Top Surface (y = 103, absolute y = 248) */}
                <path d="M -22 46 Q -34 72 -24 102" fill="none" stroke="#b45309" strokeWidth="7" strokeLinecap="round" />
                <path d="M 22 46 Q 34 72 24 102" fill="none" stroke="#b45309" strokeWidth="7" strokeLinecap="round" />
                <rect x="-28" y="98" width="10" height="4" rx="1.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
                <rect x="18" y="98" width="10" height="4" rx="1.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
                <ellipse cx="-23" cy="103" rx="5" ry="3.5" fill="#fed7aa" stroke="#c2410c" strokeWidth="1" />
                <ellipse cx="23" cy="103" rx="5" ry="3.5" fill="#fed7aa" stroke="#c2410c" strokeWidth="1" />

                {/* Subtle Left & Right Ears */}
                <ellipse cx="-16.5" cy="16" rx="2.5" ry="4" fill="#fed7aa" stroke="#c2410c" strokeWidth="1" />
                <ellipse cx="16.5" cy="16" rx="2.5" ry="4" fill="#fed7aa" stroke="#c2410c" strokeWidth="1" />

                {/* Head, Styled Side-Part Hair, Eyebrows */}
                <circle cx="0" cy="16" r="16" fill="#fed7aa" stroke="#c2410c" strokeWidth="1.5" />
                <path d="M -16 13 C -16 -4 16 -4 16 13 C 12 5 2 2 -7 5 C -12 7 -14 10 -16 13 Z" fill="#57534e" />
                <path d="M -10 9 Q -6 6.5 -2 8.5" stroke="#334155" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                <path d="M 2 8.5 Q 6 6.5 10 9" stroke="#334155" strokeWidth="1.2" fill="none" strokeLinecap="round" />

                {/* Slim-Frame Glasses & Natural Eyes with White Highlights */}
                <rect x="-10" y="11" width="8" height="6.5" rx="1.5" fill="none" stroke="#475569" strokeWidth="1" />
                <rect x="2" y="11" width="8" height="6.5" rx="1.5" fill="none" stroke="#475569" strokeWidth="1" />
                <line x1="-2" y1="14" x2="2" y2="14" stroke="#475569" strokeWidth="1" />
                <ellipse cx="-6" cy="14" rx="1.6" ry="1.8" fill="#0f172a" />
                <circle cx="-5.4" cy="13.2" r="0.6" fill="#ffffff" />
                <ellipse cx="6" cy="14" rx="1.6" ry="1.8" fill="#0f172a" />
                <circle cx="6.6" cy="13.2" r="0.6" fill="#ffffff" />

                {/* Warm Smile */}
                <path d="M -4 22 Q 0 25.5 4 22" fill="none" stroke="#9a3412" strokeWidth="1.4" strokeLinecap="round" />
              </g>

              {/* Station 2: Assistant Clerk (Clerk 2) behind Counter 2 (x = 880, y = 145) */}
              <g transform="translate(880, 145)">
                {sluice2Split ? (
                  <g filter="url(#softGlow)">
                    {/* Neck & Collared Shirt */}
                    <rect x="-6" y="26" width="12" height="14" rx="3" fill="#fed7aa" stroke="#c2410c" strokeWidth="1" />
                    <rect x="-26" y="38" width="52" height="66" rx="14" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.2" />

                    {/* Tailored Emerald Librarian Apron/Vest (#059669) */}
                    <path d="M -22 42 C -22 42 -12 40 -8 54 L -12 103 L -26 103 C -26 70 -26 50 -22 42 Z" fill="#059669" stroke="#047857" strokeWidth="1.2" />
                    <path d="M 22 42 C 22 42 12 40 8 54 L 12 103 L 26 103 C 26 70 26 50 22 42 Z" fill="#059669" stroke="#047857" strokeWidth="1.2" />
                    <polygon points="-8,40 8,40 0,54" fill="#f8fafc" />
                    <line x1="0" y1="54" x2="0" y2="103" stroke="#cbd5e1" strokeWidth="1.2" />
                    <circle cx="0" cy="62" r="1.2" fill="#047857" />
                    <circle cx="0" cy="74" r="1.2" fill="#047857" />
                    <circle cx="0" cy="86" r="1.2" fill="#047857" />

                    {/* Readable Chest Badge: CLERK 2 */}
                    <rect x="-17" y="58" width="34" height="11" rx="2.5" fill="#ffffff" stroke="#94a3b8" strokeWidth="0.8" />
                    <text x="0" y="66.5" textAnchor="middle" fill="#047857" fontSize="6.2" fontWeight="900" letterSpacing="0.5">CLERK 2</text>

                    {/* Bent Sleeves with Hands Resting on Counter Top Surface (y = 103, absolute y = 248) */}
                    <path d="M -22 46 Q -34 72 -24 102" fill="none" stroke="#059669" strokeWidth="7" strokeLinecap="round" />
                    <path d="M 22 46 Q 34 72 24 102" fill="none" stroke="#059669" strokeWidth="7" strokeLinecap="round" />
                    <rect x="-28" y="98" width="10" height="4" rx="1.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
                    <rect x="18" y="98" width="10" height="4" rx="1.5" fill="#ffffff" stroke="#cbd5e1" strokeWidth="0.8" />
                    <ellipse cx="-23" cy="103" rx="5" ry="3.5" fill="#fed7aa" stroke="#c2410c" strokeWidth="1" />
                    <ellipse cx="23" cy="103" rx="5" ry="3.5" fill="#fed7aa" stroke="#c2410c" strokeWidth="1" />

                    {/* Subtle Left & Right Ears */}
                    <ellipse cx="-16.5" cy="16" rx="2.5" ry="4" fill="#fed7aa" stroke="#c2410c" strokeWidth="1" />
                    <ellipse cx="16.5" cy="16" rx="2.5" ry="4" fill="#fed7aa" stroke="#c2410c" strokeWidth="1" />

                    {/* Head, Auburn Hair with Fringe, Eyebrows */}
                    <circle cx="0" cy="16" r="16" fill="#fed7aa" stroke="#c2410c" strokeWidth="1.5" />
                    <path d="M -16 13 C -16 -4 16 -4 16 13 C 11 4 0 2 -8 5 C -13 7 -15 10 -16 13 Z" fill="#92400e" />
                    <path d="M -9 9 Q -5 6.5 -1 8.5" stroke="#78350f" strokeWidth="1.2" fill="none" strokeLinecap="round" />
                    <path d="M 1 8.5 Q 5 6.5 9 9" stroke="#78350f" strokeWidth="1.2" fill="none" strokeLinecap="round" />

                    {/* Natural Eyes with Highlights & Cheerful Smile */}
                    <ellipse cx="-5.5" cy="14" rx="1.6" ry="1.8" fill="#0f172a" />
                    <circle cx="-4.9" cy="13.2" r="0.6" fill="#ffffff" />
                    <ellipse cx="5.5" cy="14" rx="1.6" ry="1.8" fill="#0f172a" />
                    <circle cx="6.1" cy="13.2" r="0.6" fill="#ffffff" />
                    <path d="M -4 22 Q 0 25.5 4 22" fill="none" stroke="#9a3412" strokeWidth="1.4" strokeLinecap="round" />
                  </g>
                ) : (
                  // Closed Counter 2 Stool behind desk
                  <g opacity="0.6">
                    <ellipse cx="0" cy="80" rx="16" ry="6" fill="#b45309" stroke="#78350f" strokeWidth="1.5" />
                    <line x1="-10" y1="82" x2="-10" y2="105" stroke="#78350f" strokeWidth="2.5" />
                    <line x1="10" y1="82" x2="10" y2="105" stroke="#78350f" strokeWidth="2.5" />
                  </g>
                )}
              </g>

              {/* ─────────────────────────────────────────────────────────────
                  TRUE 2.5D LAYER 2 (MID-GROUND): WOODEN SERVICE DESK (y = 248..330)
                  Solid counter desk separating the clerks from the customers!
                  ───────────────────────────────────────────────────────────── */}
              <g transform="translate(640, 248)">
                {/* Countertop Polished Surface (y = 0..14) */}
                <rect x="0" y="0" width="335" height="14" rx="3" fill="#fde68a" stroke="#78350f" strokeWidth="1.5" />
                <line x1="0" y1="2" x2="335" y2="2" stroke="#ffffff" strokeWidth="1.2" opacity="0.9" />

                {/* Counter Front Paneled Wainscoting (y = 14..82, absolute y = 262..330) */}
                <rect x="4" y="14" width="327" height="68" fill="#92400e" stroke="#78350f" strokeWidth="1.5" />
                {/* Inset Decorative Oak Panels */}
                <rect x="12" y="20" width="145" height="56" rx="4" fill="#78350f" stroke="#b45309" strokeWidth="1" />
                <rect x="170" y="20" width="153" height="56" rx="4" fill="#78350f" stroke="#b45309" strokeWidth="1" />

                {/* Mounted COUNTER 1 Plaque near top edge of counter front (y = 262, relative y = 14) */}
                <g transform="translate(85, 20)">
                  <rect x="-38" y="-9" width="76" height="19" rx="3" fill="#fef3c7" stroke="#b45309" strokeWidth="1.5" filter="url(#controlShadow)" />
                  <text x="0" y="3.5" textAnchor="middle" fill="#78350f" fontSize="7.8" fontWeight="900">
                    COUNTER 1
                  </text>
                </g>

                {/* Mounted COUNTER 2 Plaque near top edge of counter front (y = 262, relative y = 14) */}
                <g transform="translate(246, 20)">
                  <rect
                    x="-46"
                    y="-9"
                    width="92"
                    height="19"
                    rx="3"
                    fill={sluice2Split ? "#ecfdf5" : "#fee2e2"}
                    stroke={sluice2Split ? "#10b981" : "#ef4444"}
                    strokeWidth="1.5"
                    filter="url(#controlShadow)"
                  />
                  <text
                    x="0"
                    y="3.5"
                    textAnchor="middle"
                    fill={sluice2Split ? "#059669" : "#dc2626"}
                    fontSize={sluice2Split ? "7.5" : "7.2"}
                    fontWeight="900"
                  >
                    {sluice2Split ? "COUNTER 2 (OPEN)" : "STATION 2 CLOSED"}
                  </text>
                </g>

                {/* Service Bell on Top of Counter (x = 168, absolute x = 808) */}
                <g transform="translate(168, 0)">
                  <path d="M -12 0 C -12 -10 12 -10 12 0 Z" fill="#f59e0b" stroke="#ca8a04" strokeWidth="1.2" />
                  <circle cx="0" cy="-11" r="2.5" fill="#ca8a04" />
                  <rect x="-14" y="0" width="28" height="3" rx="1" fill="#78350f" />
                </g>
              </g>

              {/* ─────────────────────────────────────────────────────────────
                  TRUE 2.5D LAYER 3 (FOREGROUND): CUSTOMERS & QUEUES
                  Grounded on library floor above baseboard (y = 348).
                  ───────────────────────────────────────────────────────────── */}

              {/* 1. Left Window Customer Figure: Rendered in Situation 1 and Situation 2 */}
              {l3Situation !== 3 && (
                <g transform="translate(240, 205)">
                  {/* Jammed Single Queue (Situation 2 Unsolved) */}
                  {l3Situation === 2 && !sluice2Split && (
                    <g>
                      {[
                        { x: -102, y: 8, hair: "#581c87", shirt: "#8b5cf6", pants: "#312e81" },
                        { x: -68, y: 4, hair: "#9a3412", shirt: "#f97316", pants: "#1e293b" },
                        { x: -34, y: 2, hair: "#9d174d", shirt: "#ec4899", pants: "#334155" },
                      ].map((c, idx) => (
                        <g key={idx} transform={`translate(${c.x}, ${c.y})`}>
                          <rect x="-9" y="88" width="7" height={48 - c.y} rx="2" fill={c.pants} />
                          <rect x="2" y="88" width="7" height={48 - c.y} rx="2" fill={c.pants} />
                          <ellipse cx="-6" cy={136 - c.y} rx="6" ry="3" fill="#0f172a" />
                          <ellipse cx="6" cy={136 - c.y} rx="6" ry="3" fill="#0f172a" />
                          <path d="M -16 44 L -21 76" stroke={c.shirt} strokeWidth="6" strokeLinecap="round" />
                          <path d="M 16 44 L 21 76" stroke={c.shirt} strokeWidth="6" strokeLinecap="round" />
                          <circle cx="-21" cy="78" r="3.5" fill="#fed7aa" />
                          <circle cx="21" cy="78" r="3.5" fill="#fed7aa" />
                          <rect x="-15" y="38" width="30" height="52" rx="8" fill={c.shirt} stroke="#1e293b" strokeWidth="1.2" />
                          <rect x="-4" y="28" width="8" height="12" rx="3" fill="#fed7aa" />
                          <circle cx="0" cy="18" r="14" fill="#fed7aa" stroke="#c2410c" strokeWidth="1.2" />
                          <path d="M -14 14 C -14 0 14 0 14 14 Z" fill={c.hair} />
                          <circle cx="-4" cy="17" r="1.5" fill="#0f172a" />
                          <circle cx="4" cy="17" r="1.5" fill="#0f172a" />
                        </g>
                      ))}
                      <rect x="-118" y="-18" width="152" height="18" rx="5" fill="#fee2e2" stroke="#ef4444" strokeWidth="1.5" />
                      <text x="-42" y="-6" textAnchor="middle" fill="#b91c1c" fontSize="6.8" fontWeight="900">
                        1 QUEUE JAMMED • 10k REQ (503)
                      </text>
                    </g>
                  )}

                  {/* Standing Customer under Left Window / Speech Bubble */}
                  <g>
                    {/* Trousers & Shoes on Floor (y = 139, absolute y = 344) */}
                    <rect x="-11" y="92" width="9" height="46" rx="2.5" fill="#1e3a8a" />
                    <rect x="2" y="92" width="9" height="46" rx="2.5" fill="#1e3a8a" />
                    <ellipse cx="-7" cy="139" rx="7.5" ry="3.5" fill="#0f172a" />
                    <ellipse cx="7" cy="139" rx="7.5" ry="3.5" fill="#0f172a" />

                    {/* Left & Right Arms + Warm Skin Hands */}
                    <path d="M -18 46 L -26 80" stroke="#0284c7" strokeWidth="7" strokeLinecap="round" />
                    <path d="M 18 46 L 26 80" stroke="#0284c7" strokeWidth="7" strokeLinecap="round" />
                    <circle cx="-26" cy="82" r="4.2" fill="#fed7aa" stroke="#c2410c" strokeWidth="1" />
                    <circle cx="26" cy="82" r="4.2" fill="#fed7aa" stroke="#c2410c" strokeWidth="1" />

                    {/* Torso Jacket & Neat Collar */}
                    <rect x="-18" y="40" width="36" height="54" rx="10" fill="#0284c7" stroke="#0369a1" strokeWidth="1.6" />
                    <polygon points="-7,40 7,40 0,54" fill="#ffffff" />

                    {/* Connected Neck in Warm Skin Tone */}
                    <rect x="-5" y="28" width="10" height="15" rx="3" fill="#fed7aa" stroke="#c2410c" strokeWidth="1" />

                    {/* Head, Hair, Eyebrows & Soft Proportional Eyes */}
                    <circle cx="0" cy="16" r="16" fill="#fed7aa" stroke="#c2410c" strokeWidth="1.5" />
                    <path d="M -16 12 C -16 -4 16 -4 16 12 C 11 5 3 3 -5 5 Z" fill="#78350f" />
                    <path d="M -10 9 Q -6 7 -2 9" stroke="#78350f" strokeWidth="1.2" fill="none" />
                    <path d="M 2 9 Q 6 7 10 9" stroke="#78350f" strokeWidth="1.2" fill="none" />
                    <circle cx="-5" cy="15" r="4.2" fill="none" stroke="#475569" strokeWidth="1.2" />
                    <circle cx="5" cy="15" r="4.2" fill="none" stroke="#475569" strokeWidth="1.2" />
                    <line x1="-0.8" y1="15" x2="0.8" y2="15" stroke="#475569" strokeWidth="1.2" />
                    <circle cx="-5" cy="15" r="1.5" fill="#0f172a" />
                    <circle cx="5" cy="15" r="1.5" fill="#0f172a" />
                    <circle cx="-4" cy="14" r="0.6" fill="#ffffff" />
                    <circle cx="6" cy="14" r="0.6" fill="#ffffff" />
                    <path d="M -4 23 Q 0 26.5 4 23" fill="none" stroke="#b45309" strokeWidth="1.4" strokeLinecap="round" />

                    {/* Solved Book in Hand (Situation 1) */}
                    {l3Situation === 1 && gear1Rotated && (
                      <g transform="translate(24, 70)" filter="url(#softGlow)">
                        <rect x="-14" y="-10" width="28" height="20" rx="3" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
                        <text x="0" y="-1" textAnchor="middle" fill="#fde68a" fontSize="5" fontWeight="900">REEF MAP</text>
                        <text x="0" y="6.5" textAnchor="middle" fill="#a7f3d0" fontSize="4.8" fontWeight="900" fontFamily="'JetBrains Mono', monospace">v2</text>
                      </g>
                    )}
                  </g>
                </g>
              )}

              {/* 2. Situation 2 Solved: Two Distinct Customer Queues (Positioned to sides at x = 665 and x = 915, badges at y = 318) */}
              {l3Situation === 2 && sluice2Split && (
                <g>
                  {/* Flow Arrow pointing to Counter 1 */}
                  <path d="M 665 195 L 710 240" fill="none" stroke="#10b981" strokeWidth="2.5" strokeDasharray="5 3" />
                  <polygon points="713,242 702,238 706,230" fill="#10b981" />

                  {/* Flow Arrow pointing to Counter 2 */}
                  <path d="M 915 195 L 890 240" fill="none" stroke="#059669" strokeWidth="2.5" strokeDasharray="5 3" />
                  <polygon points="887,242 898,238 894,230" fill="#059669" />

                  {/* LINE A Customer Group positioned to side of Counter 1 (x = 665, y = 215) */}
                  <g transform="translate(665, 215)">
                    {/* Follower customer slightly behind to the left (x = -40, y = 6) */}
                    <g transform="translate(-40, 6)">
                      <rect x="-8" y="80" width="7" height="42" rx="2" fill="#312e81" />
                      <rect x="2" y="80" width="7" height="42" rx="2" fill="#312e81" />
                      <ellipse cx="-4.5" cy="123" rx="6" ry="3" fill="#0f172a" />
                      <ellipse cx="5.5" cy="123" rx="6" ry="3" fill="#0f172a" />
                      <path d="M -14 38 L -18 68" stroke="#8b5cf6" strokeWidth="5.5" strokeLinecap="round" />
                      <path d="M 14 38 L 18 68" stroke="#8b5cf6" strokeWidth="5.5" strokeLinecap="round" />
                      <circle cx="-18" cy="70" r="3.2" fill="#fed7aa" />
                      <circle cx="18" cy="70" r="3.2" fill="#fed7aa" />
                      <rect x="-14" y="32" width="28" height="46" rx="7" fill="#8b5cf6" stroke="#4c1d95" strokeWidth="1.2" />
                      <rect x="-4" y="24" width="8" height="10" rx="2.5" fill="#fed7aa" />
                      <circle cx="0" cy="14" r="12" fill="#fed7aa" stroke="#c2410c" strokeWidth="1.2" />
                      <path d="M -12 11 C -12 -2 12 -2 12 11 Z" fill="#581c87" />
                      <circle cx="-3.5" cy="13" r="1.3" fill="#0f172a" />
                      <circle cx="3.5" cy="13" r="1.3" fill="#0f172a" />
                    </g>

                    {/* Front Customer for Counter 1 */}
                    <g>
                      <rect x="-9" y="82" width="8" height="46" rx="2" fill="#1e293b" />
                      <rect x="2" y="82" width="8" height="46" rx="2" fill="#1e293b" />
                      <ellipse cx="-5" cy="129" rx="6.5" ry="3.5" fill="#0f172a" />
                      <ellipse cx="6" cy="129" rx="6.5" ry="3.5" fill="#0f172a" />
                      <rect x="-15" y="34" width="30" height="48" rx="8" fill="#f97316" stroke="#c2410c" strokeWidth="1.4" />
                      <path d="M -15 40 L -21 72" stroke="#f97316" strokeWidth="6" strokeLinecap="round" />
                      <path d="M 15 40 L 22 68" stroke="#f97316" strokeWidth="6" strokeLinecap="round" />
                      <circle cx="-21" cy="74" r="3.5" fill="#fed7aa" />
                      <circle cx="22" cy="70" r="3.5" fill="#fed7aa" />
                      <rect x="-5" y="25" width="10" height="12" rx="3" fill="#fed7aa" />
                      <circle cx="0" cy="15" r="14" fill="#fed7aa" stroke="#c2410c" strokeWidth="1.4" />
                      <path d="M -14 11 C -14 -3 14 -3 14 11 Z" fill="#7c2d12" />
                      <circle cx="-4" cy="14" r="1.5" fill="#0f172a" />
                      <circle cx="4" cy="14" r="1.5" fill="#0f172a" />
                      <path d="M -3 20 Q 0 23 3 20" fill="none" stroke="#7c2d12" strokeWidth="1.2" strokeLinecap="round" />
                    </g>
                  </g>

                  {/* LINE B Customer Group positioned to side of Counter 2 (x = 915, y = 215) */}
                  <g transform="translate(915, 215)">
                    {/* Follower customer slightly behind to the right (x = 40, y = 6) */}
                    <g transform="translate(40, 6)">
                      <rect x="-8" y="80" width="7" height="42" rx="2" fill="#134e4a" />
                      <rect x="2" y="80" width="7" height="42" rx="2" fill="#134e4a" />
                      <ellipse cx="-4.5" cy="123" rx="6" ry="3" fill="#0f172a" />
                      <ellipse cx="5.5" cy="123" rx="6" ry="3" fill="#0f172a" />
                      <path d="M -14 38 L -18 68" stroke="#0d9488" strokeWidth="5.5" strokeLinecap="round" />
                      <path d="M 14 38 L 18 68" stroke="#0d9488" strokeWidth="5.5" strokeLinecap="round" />
                      <circle cx="-18" cy="70" r="3.2" fill="#fed7aa" />
                      <circle cx="18" cy="70" r="3.2" fill="#fed7aa" />
                      <rect x="-14" y="32" width="28" height="46" rx="7" fill="#0d9488" stroke="#115e59" strokeWidth="1.2" />
                      <rect x="-4" y="24" width="8" height="10" rx="2.5" fill="#fed7aa" />
                      <circle cx="0" cy="14" r="12" fill="#fed7aa" stroke="#c2410c" strokeWidth="1.2" />
                      <path d="M -12 11 C -12 -2 12 -2 12 11 Z" fill="#134e4a" />
                      <circle cx="-3.5" cy="13" r="1.3" fill="#0f172a" />
                      <circle cx="3.5" cy="13" r="1.3" fill="#0f172a" />
                    </g>

                    {/* Front Customer for Counter 2 */}
                    <g>
                      <rect x="-9" y="82" width="8" height="46" rx="2" fill="#334155" />
                      <rect x="2" y="82" width="8" height="46" rx="2" fill="#334155" />
                      <ellipse cx="-5" cy="129" rx="6.5" ry="3.5" fill="#0f172a" />
                      <ellipse cx="6" cy="129" rx="6.5" ry="3.5" fill="#0f172a" />
                      <rect x="-15" y="34" width="30" height="48" rx="8" fill="#ec4899" stroke="#be185d" strokeWidth="1.4" />
                      <path d="M -15 40 L -21 72" stroke="#ec4899" strokeWidth="6" strokeLinecap="round" />
                      <path d="M 15 40 L 22 68" stroke="#ec4899" strokeWidth="6" strokeLinecap="round" />
                      <circle cx="-21" cy="74" r="3.5" fill="#fed7aa" />
                      <circle cx="22" cy="70" r="3.5" fill="#fed7aa" />
                      <rect x="-5" y="25" width="10" height="12" rx="3" fill="#fed7aa" />
                      <circle cx="0" cy="15" r="14" fill="#fed7aa" stroke="#be185d" strokeWidth="1.4" />
                      <path d="M -14 11 C -14 -3 14 -3 14 11 Z" fill="#831843" />
                      <circle cx="-4" cy="14" r="1.5" fill="#0f172a" />
                      <circle cx="4" cy="14" r="1.5" fill="#0f172a" />
                      <path d="M -3 20 Q 0 23 3 20" fill="none" stroke="#831843" strokeWidth="1.2" strokeLinecap="round" />
                    </g>
                  </g>

                  {/* Clean Emerald Badges at the Bottom (y = 318) near their feet - ZERO blocking of counter plaques! */}
                  <g transform="translate(665, 318)">
                    <rect x="-42" y="-9" width="84" height="18" rx="4" fill="#ecfdf5" stroke="#10b981" strokeWidth="1.5" filter="url(#softGlow)" />
                    <text x="0" y="3.5" textAnchor="middle" fill="#047857" fontSize="7" fontWeight="900" fontFamily="'JetBrains Mono', monospace">
                      LINE A • 50%
                    </text>
                  </g>

                  <g transform="translate(915, 318)">
                    <rect x="-42" y="-9" width="84" height="18" rx="4" fill="#ecfdf5" stroke="#059669" strokeWidth="1.5" filter="url(#softGlow)" />
                    <text x="0" y="3.5" textAnchor="middle" fill="#047857" fontSize="7" fontWeight="900" fontFamily="'JetBrains Mono', monospace">
                      LINE B • 50%
                    </text>
                  </g>
                </g>
              )}

              {/* 3. Situation 3 Customer: Standing in the aisle between COUNTER 2 and the VIP Archive Door (x = 955, y = 175) */}
              {l3Situation === 3 && (
                <g transform="translate(955, 175)">
                  {/* Trousers & Shoes on Floor (y = 169, absolute y = 344) */}
                  <rect x="-11" y="92" width="9" height="76" rx="2.5" fill="#1e3a8a" />
                  <rect x="2" y="92" width="9" height="76" rx="2.5" fill="#1e3a8a" />
                  <ellipse cx="-7" cy="169" rx="7.5" ry="3.5" fill="#0f172a" />
                  <ellipse cx="7" cy="169" rx="7.5" ry="3.5" fill="#0f172a" />

                  {/* Left & Right Arms + Warm Skin Hands */}
                  <path d="M -18 46 L -26 80" stroke="#0284c7" strokeWidth="7" strokeLinecap="round" />
                  <path d="M 18 46 L 26 80" stroke="#0284c7" strokeWidth="7" strokeLinecap="round" />
                  <circle cx="-26" cy="82" r="4.2" fill="#fed7aa" stroke="#c2410c" strokeWidth="1" />
                  <circle cx="26" cy="82" r="4.2" fill="#fed7aa" stroke="#c2410c" strokeWidth="1" />

                  {/* Torso Jacket & Neat Collar */}
                  <rect x="-18" y="40" width="36" height="54" rx="10" fill="#0284c7" stroke="#0369a1" strokeWidth="1.6" />
                  <polygon points="-7,40 7,40 0,54" fill="#ffffff" />

                  {/* Connected Neck in Warm Skin Tone */}
                  <rect x="-5" y="28" width="10" height="15" rx="3" fill="#fed7aa" stroke="#c2410c" strokeWidth="1" />

                  {/* Head, Hair, Eyebrows & Soft Proportional Eyes */}
                  <circle cx="0" cy="16" r="16" fill="#fed7aa" stroke="#c2410c" strokeWidth="1.5" />
                  <path d="M -16 12 C -16 -4 16 -4 16 12 C 11 5 3 3 -5 5 Z" fill="#78350f" />
                  <path d="M -10 9 Q -6 7 -2 9" stroke="#78350f" strokeWidth="1.2" fill="none" />
                  <path d="M 2 9 Q 6 7 10 9" stroke="#78350f" strokeWidth="1.2" fill="none" />
                  <circle cx="-5" cy="15" r="4.2" fill="none" stroke="#475569" strokeWidth="1.2" />
                  <circle cx="5" cy="15" r="4.2" fill="none" stroke="#475569" strokeWidth="1.2" />
                  <line x1="-0.8" y1="15" x2="0.8" y2="15" stroke="#475569" strokeWidth="1.2" />
                  <circle cx="-5" cy="15" r="1.5" fill="#0f172a" />
                  <circle cx="5" cy="15" r="1.5" fill="#0f172a" />
                  <circle cx="-4" cy="14" r="0.6" fill="#ffffff" />
                  <circle cx="6" cy="14" r="0.6" fill="#ffffff" />
                  <path d="M -4 23 Q 0 26.5 4 23" fill="none" stroke="#b45309" strokeWidth="1.4" strokeLinecap="round" />

                  {/* Solved TLS 443 Pass Lanyard on Customer */}
                  {key3Inserted && (
                    <g transform="translate(0, 42)" filter="url(#softGlow)">
                      <path d="M -8 0 L 0 15 L 8 0" fill="none" stroke="#eab308" strokeWidth="1.8" />
                      <rect x="-14" y="15" width="28" height="16" rx="3" fill="#eab308" stroke="#ca8a04" strokeWidth="1.2" />
                      <text x="0" y="22.5" textAnchor="middle" fill="#78350f" fontSize="5" fontWeight="900" fontFamily="'JetBrains Mono', monospace">TLS 443</text>
                      <text x="0" y="28.5" textAnchor="middle" fill="#059669" fontSize="4.5" fontWeight="900">VIP PASS</text>
                    </g>
                  )}
                </g>
              )}

              {/* VIP Archive Vault Door on Far Right (x = 985..1175, y = 62..328) */}
              <g transform="translate(985, 62)">
                <path d="M 0 50 A 90 90 0 0 1 180 50 L 180 262 L 0 262 Z" fill="#78350f" stroke="#451a03" strokeWidth="3" />
                <rect x="15" y="8" width="150" height="16" rx="3" fill="#fef3c7" stroke="#b45309" strokeWidth="1" />
                <text x="90" y="19" textAnchor="middle" fill="#78350f" fontSize="7" fontWeight="900">
                  VIP ARCHIVE: BUOY SENSOR LOGS
                </text>

                {key3Inserted ? (
                  // UNLOCKED: 200 OK • ARCHIVE OPEN
                  <motion.g
                    initial={{ opacity: 0, scale: 0.92 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.4 }}
                  >
                    <polygon points="12,50 80,50 140,256 12,256" fill="#fef08a" opacity="0.45" />
                    <polygon points="80,50 168,54 168,256 80,256" fill="url(#vaultDoor)" stroke="#ca8a04" strokeWidth="2" />
                    <circle cx="100" cy="155" r="8" fill="#fde68a" stroke="#ca8a04" strokeWidth="1.5" />

                    <g filter="url(#softGlow)">
                      <rect x="10" y="105" width="160" height="46" rx="6" fill="#ecfdf5" stroke="#10b981" strokeWidth="2" />
                      <circle cx="30" cy="128" r="9" fill="#10b981" />
                      <path d="M 26 128 L 29 131 L 35 125" fill="none" stroke="#ffffff" strokeWidth="2" strokeLinecap="round" />
                      <text x="48" y="125" fill="#059669" fontSize="8" fontWeight="900" fontFamily="'JetBrains Mono', monospace">
                        200 OK • ARCHIVE OPEN
                      </text>
                      <text x="48" y="138" fill="#047857" fontSize="7" fontWeight="800">
                        Port-443 TLS key accepted!
                      </text>
                    </g>
                  </motion.g>
                ) : (
                  // LOCKED: 403 FORBIDDEN
                  <g>
                    <path d="M 12 50 A 78 78 0 0 1 168 50 L 168 256 L 12 256 Z" fill="url(#vaultDoor)" stroke="#b45309" strokeWidth="2" />
                    <circle cx="30" cy="70" r="3" fill="#fde68a" />
                    <circle cx="150" cy="70" r="3" fill="#fde68a" />
                    <circle cx="30" cy="235" r="3" fill="#fde68a" />
                    <circle cx="150" cy="235" r="3" fill="#fde68a" />

                    <g filter="url(#controlShadow)">
                      <rect x="10" y="105" width="160" height="46" rx="6" fill="#fee2e2" stroke="#dc2626" strokeWidth="2" />
                      <rect x="24" y="120" width="18" height="18" rx="3" fill="#dc2626" />
                      <path d="M 28 120 L 28 114 A 5 5 0 0 1 38 114 L 38 120" fill="none" stroke="#dc2626" strokeWidth="2.5" />
                      <circle cx="33" cy="128" r="2" fill="#ffffff" />
                      <text x="50" y="125" fill="#991b1b" fontSize="8.5" fontWeight="900" fontFamily="'JetBrains Mono', monospace">
                        403 FORBIDDEN
                      </text>
                      <text x="50" y="138" fill="#b91c1c" fontSize="7" fontWeight="800">
                        VIP Port-443 TLS pass required
                      </text>
                    </g>
                  </g>
                )}
              </g>

              {/* Clean thin oak baseboard trim (height = 8) separating library floor from lower prop tray */}
              <rect x="0" y="348" width="1200" height="8" fill="#b45309" stroke="#78350f" strokeWidth="1" />
              <line x1="0" y1="349" x2="1200" y2="349" stroke="#fde68a" strokeWidth="1" opacity="0.8" />

              {/* ─────────────────────────────────────────────────────────────
                  LOWER PROP TRAY: PANELED OAK (y = 356..560)
                  ───────────────────────────────────────────────────────────── */}
              <rect x="0" y="356" width="1200" height="204" fill="#78350f" />
              <line x1="0" y1="356" x2="1200" y2="356" stroke="#d97706" strokeWidth="2" />

              <rect x="18" y="358" width="288" height="188" rx="8" fill="#92400e" opacity="0.6" stroke="#b45309" strokeWidth="1" />
              <rect x="310" y="358" width="286" height="188" rx="8" fill="#92400e" opacity="0.6" stroke="#b45309" strokeWidth="1" />
              <rect x="600" y="358" width="286" height="188" rx="8" fill="#92400e" opacity="0.6" stroke="#b45309" strokeWidth="1" />
              <rect x="890" y="358" width="292" height="188" rx="8" fill="#92400e" opacity="0.6" stroke="#b45309" strokeWidth="1" />

              {/* ─────────────────────────────────────────────────────────────
                  PROP BAY 1: UPDATED CATALOG (Solves 404 NOT FOUND)
                  ───────────────────────────────────────────────────────────── */}
              <g
                className="cursor-pointer"
                onPointerDown={(e) => handlePropPointerDown(1, e)}
                onClick={() => {
                  setL3Situation(1);
                  if (!gear1Rotated) {
                    handleToggleGear1();
                    setTimeout(() => {
                      if (!sluice2Split) setL3Situation(2);
                    }, 1400);
                  }
                }}
                transform="translate(24, 365)"
                filter="url(#controlShadow)"
              >
                <rect
                  x="0"
                  y="0"
                  width="275"
                  height="172"
                  rx="10"
                  fill="#78350f"
                  stroke={gear1Rotated ? "#10b981" : "#0284c7"}
                  strokeWidth="2.5"
                />
                <rect x="0" y="0" width="275" height="30" rx="10" fill="#92400e" />
                <text x="14" y="20" fill="#fde68a" fontSize="8.5" fontWeight="900">
                  PROP 1: FOR <tspan fontFamily="'JetBrains Mono', monospace">404 NOT FOUND</tspan>
                </text>

                {/* Illustrated Catalog Book */}
                <g transform="translate(137, 70) scale(1.2)">
                  <rect x="-48" y="-28" width="96" height="52" rx="5" fill="#0284c7" stroke="#38bdf8" strokeWidth="2" />
                  <rect x="-42" y="-22" width="84" height="40" rx="3" fill="#0369a1" />
                  {/* Book emblem / star icon cleanly above text at y = -14 */}
                  <circle cx="0" cy="-14" r="5" fill="#fde68a" opacity="0.4" />
                  <path d="M 0 -18 L 0 -10 M -4 -14 L 4 -14" stroke="#fde68a" strokeWidth="1.5" />
                  {/* Clean text cleanly below icon */}
                  <text x="0" y="2" textAnchor="middle" fill="#fde68a" fontSize="6.2" fontWeight="900">
                    UPDATED
                  </text>
                  <text x="0" y="11" textAnchor="middle" fill="#ffffff" fontSize="6.8" fontWeight="900">
                    CATALOG
                  </text>
                  <path d="M -8 18 L -4 18 L -2 27 L -6 24 L -10 27 Z" fill="#f59e0b" />
                </g>

                {/* Code & Concept Pill */}
                <rect x="16" y="110" width="243" height="22" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                <text x="137" y="125" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="800">
                  INDEX: Maps <tspan fontFamily="'JetBrains Mono', monospace">/reef-map</tspan> &rarr; <tspan fontFamily="'JetBrains Mono', monospace">/v2/reef-map</tspan>
                </text>

                {/* Status Button */}
                <rect
                  x="16"
                  y="136"
                  width="243"
                  height="26"
                  rx="6"
                  fill={gear1Rotated ? "#059669" : "#0284c7"}
                />
                <text x="137" y="153" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="900">
                  {gear1Rotated ? "SOLVED (200 OK) • DRAG OR CLICK" : "DRAG TO SHOPKEEPER (OR CLICK)"}
                </text>
              </g>

              {/* ─────────────────────────────────────────────────────────────
                  PROP BAY 2: ASSISTANT CLERK (Solves 503 SERVICE UNAVAILABLE)
                  NO auto-switch to 3 so player sees 50/50 split in real time!
                  ───────────────────────────────────────────────────────────── */}
              <g
                className="cursor-pointer"
                onPointerDown={(e) => handlePropPointerDown(2, e)}
                onClick={() => {
                  setL3Situation(2);
                  if (!sluice2Split) {
                    handleToggleSluice2();
                    setTimeout(() => {
                      if (!key3Inserted) setL3Situation(3);
                    }, 1600);
                  }
                }}
                transform="translate(315, 365)"
                filter="url(#controlShadow)"
              >
                <rect
                  x="0"
                  y="0"
                  width="275"
                  height="172"
                  rx="10"
                  fill="#78350f"
                  stroke={sluice2Split ? "#10b981" : "#d97706"}
                  strokeWidth="2.5"
                />
                <rect x="0" y="0" width="275" height="30" rx="10" fill="#92400e" />
                <text x="14" y="20" fill="#fde68a" fontSize="8.5" fontWeight="900">
                  PROP 2: FOR <tspan fontFamily="'JetBrains Mono', monospace">503 SERVICE UNAVAILABLE</tspan>
                </text>

                {/* Illustrated Desk Bell + 50/50 Badge Cleanly Below Base */}
                <g transform="translate(137, 66) scale(1.2)">
                  <circle cx="0" cy="-8" r="20" fill="#f59e0b" stroke="#ca8a04" strokeWidth="2" />
                  <circle cx="0" cy="-8" r="14" fill="#fde68a" />
                  <path d="M -10 -6 C -10 -16 10 -16 10 -6 Z" fill="#d97706" />
                  <circle cx="0" cy="-17" r="2.5" fill="#78350f" />
                  <rect x="-14" y="-6" width="28" height="4" rx="1.5" fill="#78350f" />
                  <rect x="-22" y="14" width="44" height="15" rx="4" fill="#78350f" stroke="#ca8a04" strokeWidth="1" />
                  <text x="0" y="24.5" textAnchor="middle" fill="#fde68a" fontSize="6.8" fontWeight="900" fontFamily="'JetBrains Mono', monospace">
                    50 / 50
                  </text>
                </g>

                {/* Code & Concept Pill */}
                <rect x="16" y="110" width="243" height="22" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                <text x="137" y="125" textAnchor="middle" fill="#fde68a" fontSize="8" fontWeight="800">
                  LOAD BALANCER: Splits 10k requests across 2 servers
                </text>

                {/* Status Button */}
                <rect
                  x="16"
                  y="136"
                  width="243"
                  height="26"
                  rx="6"
                  fill={sluice2Split ? "#059669" : "#d97706"}
                />
                <text x="137" y="153" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="900">
                  {sluice2Split ? "SOLVED (200 OK) • DRAG OR CLICK" : "DRAG BEHIND COUNTER (OR CLICK)"}
                </text>
              </g>

              {/* ─────────────────────────────────────────────────────────────
                  PROP BAY 3: VIP PASS TLS 443 (Solves 403 FORBIDDEN)
                  Keycard widened to width=68 so PORT 443 never touches border
                  ───────────────────────────────────────────────────────────── */}
              <g
                className="cursor-pointer"
                onPointerDown={(e) => handlePropPointerDown(3, e)}
                onClick={() => {
                  setL3Situation(3);
                  if (!key3Inserted) {
                    handleToggleKey3();
                  }
                }}
                transform="translate(605, 365)"
                filter="url(#controlShadow)"
              >
                <rect
                  x="0"
                  y="0"
                  width="275"
                  height="172"
                  rx="10"
                  fill="#78350f"
                  stroke={key3Inserted ? "#10b981" : "#7c3aed"}
                  strokeWidth="2.5"
                />
                <rect x="0" y="0" width="275" height="30" rx="10" fill="#92400e" />
                <text x="14" y="20" fill="#fde68a" fontSize="8.5" fontWeight="900">
                  PROP 3: FOR <tspan fontFamily="'JetBrains Mono', monospace">403 FORBIDDEN</tspan>
                </text>

                {/* Illustrated VIP Keycard */}
                <g transform="translate(137, 70) scale(1.2)">
                  <rect x="-44" y="-27" width="88" height="52" rx="5" fill="#eab308" stroke="#ca8a04" strokeWidth="2" />
                  <rect x="-38" y="-21" width="76" height="40" rx="3" fill="#78350f" />
                  {/* Gold Chip on Left */}
                  <rect x="-32" y="-9" width="16" height="16" rx="2" fill="#fde68a" stroke="#ca8a04" strokeWidth="0.8" />
                  <circle cx="-24" cy="-1" r="2" fill="#ca8a04" />
                  {/* Clean text aligned on right at x=11 */}
                  <text x="11" y="-8" textAnchor="middle" fill="#fde68a" fontSize="6.2" fontWeight="900" fontFamily="'JetBrains Mono', monospace">
                    PORT 443
                  </text>
                  <text x="11" y="2" textAnchor="middle" fill="#a7f3d0" fontSize="5.5" fontWeight="800" fontFamily="'JetBrains Mono', monospace">
                    TLS KEY
                  </text>
                  <text x="11" y="11" textAnchor="middle" fill="#ffffff" fontSize="6.2" fontWeight="900">
                    VIP PASS
                  </text>
                </g>

                {/* Code & Concept Pill */}
                <rect x="16" y="110" width="243" height="22" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                <text x="137" y="125" textAnchor="middle" fill="#c4b5fd" fontSize="8" fontWeight="800">
                  SECURITY TUNNEL: HTTPS <tspan fontFamily="'JetBrains Mono', monospace">Port-443</tspan> TLS Certificate
                </text>

                {/* Status Button */}
                <rect
                  x="16"
                  y="136"
                  width="243"
                  height="26"
                  rx="6"
                  fill={key3Inserted ? "#059669" : "#7c3aed"}
                />
                <text x="137" y="153" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="900">
                  {key3Inserted ? "SOLVED (200 OK) • DRAG OR CLICK" : "DRAG TO CUSTOMER / DOOR (OR CLICK)"}
                </text>
              </g>

              {/* ─────────────────────────────────────────────────────────────
                  DELIVERY VERIFICATION BOARD
                  CHECK ALL DELIVERIES in active sky/amber when < 3 props solved
                  ───────────────────────────────────────────────────────────── */}
              <g transform="translate(895, 365)" filter="url(#controlShadow)">
                <rect x="0" y="0" width="280" height="172" rx="10" fill="#78350f" stroke="#ca8a04" strokeWidth="2.5" />
                <rect x="0" y="0" width="280" height="30" rx="10" fill="#92400e" />
                <text x="14" y="20" fill="#fde68a" fontSize="8.5" fontWeight="900">
                  DELIVERY VERIFICATION BOARD
                </text>

                {/* 3 Status LED Indicators with JetBrains Mono codes */}
                <g transform="translate(18, 38)">
                  <rect x="0" y="0" width="70" height="28" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                  <circle cx="16" cy="14" r="5" fill={gear1Rotated ? "#10b981" : "#ef4444"} />
                  <text x="26" y="12" fill="#ffffff" fontSize="6.5" fontWeight="900">404 FIX</text>
                  <text x="26" y="22" fill={gear1Rotated ? "#a7f3d0" : "#fca5a5"} fontSize="6" fontWeight="800" fontFamily="'JetBrains Mono', monospace">
                    {gear1Rotated ? "200 OK" : "EMPTY"}
                  </text>

                  <rect x="80" y="0" width="70" height="28" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                  <circle cx="96" cy="14" r="5" fill={sluice2Split ? "#10b981" : "#f59e0b"} />
                  <text x="106" y="12" fill="#ffffff" fontSize="6.5" fontWeight="900">503 FIX</text>
                  <text x="106" y="22" fill={sluice2Split ? "#a7f3d0" : "#fde68a"} fontSize="6" fontWeight="800" fontFamily="'JetBrains Mono', monospace">
                    {sluice2Split ? "200 OK" : "JAMMED"}
                  </text>

                  <rect x="160" y="0" width="70" height="28" rx="4" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                  <circle cx="176" cy="14" r="5" fill={key3Inserted ? "#10b981" : "#8b5cf6"} />
                  <text x="186" y="12" fill="#ffffff" fontSize="6.5" fontWeight="900">403 FIX</text>
                  <text x="186" y="22" fill={key3Inserted ? "#a7f3d0" : "#c4b5fd"} fontSize="6" fontWeight="800" fontFamily="'JetBrains Mono', monospace">
                    {key3Inserted ? "200 OK" : "LOCKED"}
                  </text>
                </g>

                {/* Big Verification Button: Active sky/amber when < 3 solved, bright emerald when all solved */}
                <g
                  className="cursor-pointer"
                  onClick={handleDispatchHttpBoats}
                  transform="translate(18, 78)"
                  filter="url(#softGlow)"
                >
                  <rect
                    x="0"
                    y="0"
                    width="244"
                    height="76"
                    rx="10"
                    fill={
                      httpRunActive
                        ? "#d97706"
                        : gear1Rotated && sluice2Split && key3Inserted
                        ? "#059669"
                        : "#0284c7"
                    }
                    stroke={
                      gear1Rotated && sluice2Split && key3Inserted
                        ? "#34d399"
                        : "#38bdf8"
                    }
                    strokeWidth="2.5"
                  />
                  <circle
                    cx="26"
                    cy="38"
                    r="12"
                    fill={gear1Rotated && sluice2Split && key3Inserted ? "#a7f3d0" : "#bae6fd"}
                  />
                  <text
                    x="50"
                    y="32"
                    fill="#ffffff"
                    fontSize="9"
                    fontWeight="900"
                  >
                    {httpRunActive
                      ? "VERIFYING DELIVERIES..."
                      : gear1Rotated && sluice2Split && key3Inserted
                      ? "CHECK ALL DELIVERIES (READY)"
                      : "CHECK ALL DELIVERIES"}
                  </text>
                  <text
                    x="50"
                    y="48"
                    fill={gear1Rotated && sluice2Split && key3Inserted ? "#d1fae5" : "#e0f2fe"}
                    fontSize="7.5"
                    fontWeight="800"
                  >
                    {httpRunActive
                      ? "Dispatching books to customers..."
                      : gear1Rotated && sluice2Split && key3Inserted
                      ? "All 3 solved! Click to complete mission!"
                      : `${(gear1Rotated ? 1 : 0) + (sluice2Split ? 1 : 0) + (key3Inserted ? 1 : 0)} of 3 props delivered`}
                  </text>
                </g>
              </g>

              {/* ─────────────────────────────────────────────────────────────
                  VISUAL DROP-ZONE HIGHLIGHT GUIDES (When dragging props)
                  Prop 1 drop guide centered at x = 515 (no overlap with speech bubble)
                  ───────────────────────────────────────────────────────────── */}
              {draggedProp === 1 && (
                <g pointerEvents="none">
                  {/* Guide around Shelf #999 (x = 471, y = 142) */}
                  <rect
                    x="466"
                    y="137"
                    width="70"
                    height="58"
                    rx="6"
                    fill="#0284c7"
                    fillOpacity="0.22"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeDasharray="5,4"
                    filter="url(#softGlow)"
                  />
                  {/* Guide around Shopkeeper (x = 745, y = 240) */}
                  <rect
                    x="705"
                    y="195"
                    width="80"
                    height="110"
                    rx="8"
                    fill="#0284c7"
                    fillOpacity="0.22"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeDasharray="5,4"
                    filter="url(#softGlow)"
                  />
                  {/* Instruction Pill Centered at x = 515: Leaves 45px clearance to speech bubble */}
                  <g transform="translate(515, 115)" filter="url(#controlShadow)">
                    <rect x="-85" y="-12" width="170" height="24" rx="6" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
                    <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="900">
                      DROP ON SHELF #999
                    </text>
                  </g>
                </g>
              )}

              {draggedProp === 2 && (
                <g pointerEvents="none">
                  {/* Guide around Station 2 (x = 865, y = 250) */}
                  <rect
                    x="825"
                    y="195"
                    width="80"
                    height="110"
                    rx="8"
                    fill="#f59e0b"
                    fillOpacity="0.22"
                    stroke="#f59e0b"
                    strokeWidth="2.5"
                    strokeDasharray="5,4"
                    filter="url(#softGlow)"
                  />
                  {/* Instruction Pill */}
                  <g transform="translate(865, 175)" filter="url(#controlShadow)">
                    <rect x="-80" y="-12" width="160" height="24" rx="6" fill="#d97706" stroke="#fbbf24" strokeWidth="1.5" />
                    <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="900">
                      DROP AT COUNTER 2
                    </text>
                  </g>
                </g>
              )}

              {draggedProp === 3 && (
                <g pointerEvents="none">
                  {/* Guide around Customer between Counter 2 & VIP Door (x = 955, y = 175) */}
                  <rect
                    x="925"
                    y="170"
                    width="60"
                    height="165"
                    rx="8"
                    fill="#7c3aed"
                    fillOpacity="0.22"
                    stroke="#a855f7"
                    strokeWidth="2.5"
                    strokeDasharray="5,4"
                    filter="url(#softGlow)"
                  />
                  {/* Guide around VIP Archive Door (x = 985..1165, y = 62..320) */}
                  <rect
                    x="985"
                    y="62"
                    width="180"
                    height="262"
                    rx="10"
                    fill="#7c3aed"
                    fillOpacity="0.22"
                    stroke="#a855f7"
                    strokeWidth="2.5"
                    strokeDasharray="5,4"
                    filter="url(#softGlow)"
                  />
                  {/* Instruction Pill below top tab bar at x = 975, y = 56 */}
                  <g transform="translate(975, 56)" filter="url(#controlShadow)">
                    <rect x="-120" y="-12" width="240" height="24" rx="6" fill="#7c3aed" stroke="#c084fc" strokeWidth="1.5" />
                    <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="900">
                      DROP ON VIP DOOR OR CUSTOMER
                    </text>
                  </g>
                </g>
              )}

              {/* ─────────────────────────────────────────────────────────────
                  DRAGGING HOVER PROP OVERLAY (when draggedProp !== null)
                  ───────────────────────────────────────────────────────────── */}
              {draggedProp === 1 && (
                <g transform={`translate(${prop1Pos.x}, ${prop1Pos.y})`} pointerEvents="none" filter="url(#softGlow)">
                  <circle cx="0" cy="0" r="34" fill="#0284c7" fillOpacity="0.25" />
                  <rect x="-30" y="-22" width="60" height="44" rx="4" fill="#0284c7" stroke="#38bdf8" strokeWidth="2.5" />
                  <rect x="-24" y="-18" width="48" height="36" rx="2" fill="#0369a1" />
                  <text x="0" y="4" textAnchor="middle" fill="#ffffff" fontSize="7.5" fontWeight="900">
                    UPDATED
                  </text>
                  <text x="0" y="13" textAnchor="middle" fill="#fde68a" fontSize="6.5" fontWeight="900">
                    CATALOG
                  </text>
                </g>
              )}

              {draggedProp === 2 && (
                <g transform={`translate(${prop2Pos.x}, ${prop2Pos.y})`} pointerEvents="none" filter="url(#softGlow)">
                  <circle cx="0" cy="0" r="34" fill="#d97706" fillOpacity="0.25" />
                  <circle cx="0" cy="0" r="24" fill="#f59e0b" stroke="#ca8a04" strokeWidth="2.5" />
                  <circle cx="0" cy="0" r="16" fill="#fde68a" />
                  <text x="0" y="4" textAnchor="middle" fill="#78350f" fontSize="7" fontWeight="900">
                    CLERK
                  </text>
                </g>
              )}

              {draggedProp === 3 && (
                <g transform={`translate(${prop3Pos.x}, ${prop3Pos.y})`} pointerEvents="none" filter="url(#softGlow)">
                  <circle cx="0" cy="0" r="34" fill="#7c3aed" fillOpacity="0.25" />
                  <rect x="-28" y="-20" width="56" height="40" rx="4" fill="#eab308" stroke="#ca8a04" strokeWidth="2.5" />
                  <rect x="-22" y="-16" width="44" height="32" rx="2" fill="#78350f" />
                  <text x="0" y="2" textAnchor="middle" fill="#fde68a" fontSize="7.5" fontWeight="900" fontFamily="'JetBrains Mono', monospace">
                    VIP PASS
                  </text>
                  <text x="0" y="11" textAnchor="middle" fill="#a7f3d0" fontSize="6" fontWeight="900" fontFamily="'JetBrains Mono', monospace">
                    PORT 443
                  </text>
                </g>
              )}
            </g>
          )}

          {/* Particles Layer */}
          {particles.map((p) => (
            <circle key={p.id} cx={p.x} cy={p.y} r={p.size} fill={p.color} opacity={p.life} pointerEvents="none" />
          ))}

          {/* Summary Overlay with NEXT MISSION -> */}
          {showSummaryOverlay && !isCompleted && (
            <g transform={level === 2 ? "translate(48, 62)" : "translate(560, 65)"} filter="url(#controlShadow)">
              <rect
                x="0"
                y="0"
                width="345"
                height={125}
                rx="10"
                fill="#ffffff"
                fillOpacity="0.96"
                stroke={level === 1 ? "#0284c7" : level === 2 ? "#10b981" : "#7c3aed"}
                strokeWidth="2.5"
              />
              <text x="16" y="22" fill="#0f172a" fontSize="8.5" fontWeight="900" fontFamily="sans-serif">
                {level === 1
                  ? "MISSION 1: BANDWIDTH VS. LATENCY CERTIFIED"
                  : level === 2
                  ? "MISSION 2: CLOUD-SPIRE DNS & CACHE CERTIFIED"
                  : "MISSION 3: HTTP STATUS CODE MASTERY"}
              </text>
              <line x1="14" y1="30" x2="331" y2="30" stroke="#cbd5e1" strokeWidth="1" />

              {level === 1 && (
                <g transform="translate(16, 42)">
                  <text x="0" y="12" fill="#0284c7" fontSize="7.5" fontWeight="900">
                    BANDWIDTH (100 Mbps): Wide iris pipe carried 4K stream
                  </text>
                  <text x="0" y="26" fill="#475569" fontSize="7" fontWeight="700">
                    No packet congestion or buffering delays
                  </text>
                  <text x="0" y="42" fill="#059669" fontSize="7.5" fontWeight="900">
                    LATENCY (12ms): Direct subsea fiber steering
                  </text>
                  <text x="0" y="56" fill="#475569" fontSize="7" fontWeight="700">
                    Fast response dodged all 3 underwater coral arches
                  </text>
                </g>
              )}

              {level === 2 && (
                <g transform="translate(16, 42)">
                  <text x="0" y="12" fill="#0284c7" fontSize="7.5" fontWeight="900">
                    DNS RECURSION: Root (.) &rarr; TLD (.ORG / .GOV) &rarr; Authoritative
                  </text>
                  <text x="0" y="26" fill="#475569" fontSize="7" fontWeight="700">
                    Right-to-left resolution unlocked domain segments & stamped IP
                  </text>
                  <text x="0" y="42" fill="#059669" fontSize="7.5" fontWeight="900">
                    HOP LATENCY & TTL: 0 HOPS (1ms) vs 3 HOPS (340ms)
                  </text>
                  <text x="0" y="56" fill="#475569" fontSize="7" fontWeight="700">
                    Expired TTL forced refresh, pulling fresh 198.51.100.99 record
                  </text>
                </g>
              )}

              {level === 3 && (
                <g transform="translate(16, 42)">
                  <text x="0" y="12" fill="#0284c7" fontSize="7.5" fontWeight="900">
                    HTTP 404 NOT FOUND: Updated catalog redirected Shelf #999 to /v2/reef-map
                  </text>
                  <text x="0" y="26" fill="#475569" fontSize="7" fontWeight="700">
                    Broken bookmark resolved without missing book errors
                  </text>
                  <text x="0" y="42" fill="#d97706" fontSize="7.5" fontWeight="900">
                    HTTP 503 SERVICE UNAVAILABLE: Second clerk opened counter to divide crowd 50/50
                  </text>
                  <text x="0" y="56" fill="#475569" fontSize="7" fontWeight="700">
                    Twin service stations prevented counter jamming
                  </text>
                  <text x="0" y="72" fill="#7c3aed" fontSize="7.5" fontWeight="900">
                    HTTP 403 FORBIDDEN: Port-443 TLS security pass authenticated VIP archive
                  </text>
                  <text x="0" y="86" fill="#475569" fontSize="7" fontWeight="700">
                    Authorized credentials unlocked private buoy logs (200 OK)
                  </text>
                </g>
              )}

              {level < 3 && (
                <g
                  className="cursor-pointer"
                  onClick={handleNextMission}
                  transform="translate(195, 96)"
                  filter="url(#softGlow)"
                >
                  <rect x="0" y="0" width="134" height="22" rx="4" fill="#10b981" />
                  <text x="67" y="14" textAnchor="middle" fill="#ffffff" fontSize="7.5" fontWeight="900">
                    NEXT MISSION &rarr;
                  </text>
                </g>
              )}
            </g>
          )}

          {/* Failure Alert Banner (Placed cleanly at Bottom-Center y = 515 with height="38") */}
          {failureNotice && (
            <g transform="translate(360, 515)" filter="url(#controlShadow)">
              <rect x="0" y="0" width="480" height="38" rx="6" fill="#fee2e2" fillOpacity="0.98" stroke="#ef4444" strokeWidth="1.5" />
              <text x="240" y="16" textAnchor="middle" fill="#991b1b" fontSize="7.5" fontWeight="900">
                {failureNotice}
              </text>
              <text x="240" y="29" textAnchor="middle" fill="#b91c1c" fontSize="6.5" fontWeight="800">
                WHY IT FAILED: Protocols obey physical mechanics. Adjust the defective machinery!
              </text>
            </g>
          )}
        </svg>

        {/* Hint Modal */}
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
                    <h3 className="font-bold text-base text-amber-700">Internet NOC Protocol Hint</h3>
                    <span className="text-xs text-slate-500 font-sans">Mission {level} Guidance</span>
                  </div>
                </div>

                <div className="text-xs text-slate-700 space-y-2 mb-5 leading-relaxed font-sans">
                  {level === 1 && (
                    <div>
                      Click the brass iris valve to open 100 Mbps bandwidth, switch to 12ms subsea fiber, and steer Claw Bot-3 through the canyon trench.
                    </div>
                  )}
                  {level === 2 && (
                    <div>
                      Drag the glowing Query Packet onto Root, then matching TLD, then authoritative dome! On duplicate waves, use the Cache Crystal before TTL expires!
                    </div>
                  )}
                  {level === 3 && (
                    <div>
                      In the library bookshop, drag the Updated Catalog onto the shopkeeper to fix 404, drag the Assistant Clerk behind the counter to split the 503 crowd into two lines, and drag the golden Port-443 TLS Pass to unlock the 403 VIP archive!
                    </div>
                  )}
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

        {/* Universal Completion Modal */}
        <AnimatePresence>
          {isCompleted && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-md p-4"
            >
              <motion.div
                initial={{ scale: 0.8, y: 20, opacity: 0 }}
                animate={{ scale: 1, y: 0, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", stiffness: 320, damping: 24 }}
                className="relative w-full max-w-md rounded-3xl bg-slate-900 border-2 border-emerald-400 shadow-2xl p-6 sm:p-8 text-center z-50 text-white"
              >
                <div className="mx-auto mb-4 w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-cyan-500 border-4 border-amber-200 shadow-md flex items-center justify-center">
                  <Award className="w-9 h-9 text-white" />
                </div>

                <h2 className="font-sans font-extrabold text-xl sm:text-2xl text-white tracking-tight mb-4">
                  Congrats! You have completed Internet NOC: Bandwidth, Latency & DNS.
                </h2>

                <div className="text-xs text-slate-300 font-sans leading-relaxed mb-6">
                  You physically mastered bandwidth pipe widths, latency round-trip speeds, right-to-left DNS spires, hop telemetry, TTL cache expiration, and HTTP status code incident response at the Coastal NOC!
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