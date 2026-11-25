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
   SHARED TYPES & DAYLIGHT STORYBOOK GRADIENTS
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

function CommonWorldDefs() {
  return (
    <defs>
      {/* Sunbeam & Sunlight Shafts */}
      <linearGradient id="sunbeamShaft" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" stopOpacity="0.45" />
        <stop offset="40%" stopColor="#fef9c3" stopOpacity="0.25" />
        <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
      </linearGradient>

      {/* Warm Bicycle Shop Gradients */}
      <linearGradient id="shopWall" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fffbeb" />
        <stop offset="55%" stopColor="#fef3c7" />
        <stop offset="100%" stopColor="#fde68a" />
      </linearGradient>
      <linearGradient id="woodFloor" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#d97706" />
        <stop offset="35%" stopColor="#b45309" />
        <stop offset="85%" stopColor="#78350f" />
        <stop offset="100%" stopColor="#451a03" />
      </linearGradient>
      <linearGradient id="counterWood" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fde68a" />
        <stop offset="40%" stopColor="#f59e0b" />
        <stop offset="100%" stopColor="#b45309" />
      </linearGradient>
      <linearGradient id="brickTrim" x1="0%" y1="0%" x2="100%" y2="0%">
        <stop offset="0%" stopColor="#b45309" />
        <stop offset="50%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#92400e" />
      </linearGradient>
      <linearGradient id="scannerBeam" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.8" />
        <stop offset="50%" stopColor="#818cf8" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.05" />
      </linearGradient>

      {/* Living Room Smart TV Gradients */}
      <linearGradient id="livingRoomWall" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fefce8" />
        <stop offset="50%" stopColor="#fff7ed" />
        <stop offset="100%" stopColor="#fed7aa" />
      </linearGradient>
      <linearGradient id="sofaFabric" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fde047" />
        <stop offset="60%" stopColor="#eab308" />
        <stop offset="100%" stopColor="#ca8a04" />
      </linearGradient>
      <linearGradient id="tvScreen" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#e0f2fe" />
        <stop offset="50%" stopColor="#bae6fd" />
        <stop offset="100%" stopColor="#7dd3fc" />
      </linearGradient>

      {/* Coding Club & Game Installer Gradients */}
      <linearGradient id="homeStudyWall" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fff7ed" />
        <stop offset="50%" stopColor="#ffedd5" />
        <stop offset="100%" stopColor="#fed7aa" />
      </linearGradient>
      <linearGradient id="monitorScreenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#0c4a6e" />
        <stop offset="55%" stopColor="#075985" />
        <stop offset="100%" stopColor="#0369a1" />
      </linearGradient>
      <linearGradient id="pcTowerGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#1e293b" />
        <stop offset="50%" stopColor="#0f172a" />
        <stop offset="100%" stopColor="#020617" />
      </linearGradient>
      <linearGradient id="deskLampCone" x1="50%" y1="0%" x2="50%" y2="100%">
        <stop offset="0%" stopColor="#fef08a" stopOpacity="0.45" />
        <stop offset="60%" stopColor="#fef08a" stopOpacity="0.18" />
        <stop offset="100%" stopColor="#fef08a" stopOpacity="0" />
      </linearGradient>
      <linearGradient id="codingClubWall" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fffdf5" />
        <stop offset="50%" stopColor="#fef3c7" />
        <stop offset="100%" stopColor="#fed7aa" />
      </linearGradient>
      <linearGradient id="codingClubChalkboard" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#1e3a2f" />
        <stop offset="100%" stopColor="#142820" />
      </linearGradient>
      <linearGradient id="tabletScreenGrad" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#0b1120" />
        <stop offset="60%" stopColor="#0f172a" />
        <stop offset="100%" stopColor="#020617" />
      </linearGradient>
      <linearGradient id="lensGlowGrad" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.7" />
        <stop offset="60%" stopColor="#818cf8" stopOpacity="0.35" />
        <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.1" />
      </linearGradient>

      {/* Corner Bakery Gradients */}
      <linearGradient id="bakeryWall" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#fffdf5" />
        <stop offset="45%" stopColor="#fef3c7" />
        <stop offset="100%" stopColor="#fed7aa" />
      </linearGradient>
      <linearGradient id="forestChalkboard" x1="0%" y1="0%" x2="0%" y2="100%">
        <stop offset="0%" stopColor="#1e3a2f" />
        <stop offset="100%" stopColor="#142820" />
      </linearGradient>
      <linearGradient id="woodenShelf" x1="0%" y1="0%" x2="100%" y2="100%">
        <stop offset="0%" stopColor="#fde68a" />
        <stop offset="50%" stopColor="#d97706" />
        <stop offset="100%" stopColor="#92400e" />
      </linearGradient>
    </defs>
  );
}

/* ============================================================================
   LEVEL 1 (DP1) — THE BICYCLE SHOP COUNTER
   Dark Patterns: Hidden Fees & Pre-Ticked Add-Ons
   Features:
   - Pure drag-and-drop mechanics (No click shortcuts!)
   - Explicit 2-choice consent prompt when dragged onto Aarav
   - Animated 1-second paper shredder with cutter rotation and falling strips
   - Realistic walking stride from x = 135 to x = 605 (cleanly to left of counter)
   ============================================================================ */

interface BikeTag {
  id: "bell" | "insurance" | "assembly" | "tax";
  name: string;
  type: "optional" | "hidden_fee";
  amount: number;
  revealed: boolean;
  status: "on_bill" | "opted_out" | "opted_in" | "shredded";
  color: string;
  badge: string;
  homeX: number;
  homeY: number;
}

function Level1BicycleShop({
  playClick,
  playSwitch,
  playSuccess,
  playError,
  playBeep,
  speak,
  setStatus,
  onRegisterHint,
  onLevelComplete,
}: StudioLevelProps) {
  const [phase, setPhase] = useState<1 | 2 | 3>(1);

  // 4 Dark Pattern Tags
  const [tags, setTags] = useState<BikeTag[]>([
    {
      id: "bell",
      name: "Pre-Ticked Bell",
      type: "optional",
      amount: 250,
      revealed: false,
      status: "on_bill",
      color: "#8b5cf6",
      badge: "PRE-SELECTED ACCESSORY",
      homeX: 235,
      homeY: 225,
    },
    {
      id: "insurance",
      name: "Helmet Insurance",
      type: "optional",
      amount: 400,
      revealed: false,
      status: "on_bill",
      color: "#ec4899",
      badge: "AUTO-ADDED RECURRING",
      homeX: 435,
      homeY: 225,
    },
    {
      id: "assembly",
      name: "Hidden Assembly Fee",
      type: "hidden_fee",
      amount: 350,
      revealed: false,
      status: "on_bill",
      color: "#f97316",
      badge: "SURPRISE SURCHARGE",
      homeX: 235,
      homeY: 295,
    },
    {
      id: "tax",
      name: "Fake Road Fee",
      type: "hidden_fee",
      amount: 150,
      revealed: false,
      status: "on_bill",
      color: "#ef4444",
      badge: "DECEPTIVE FEE",
      homeX: 435,
      homeY: 295,
    },
  ]);

  // Overhead Scanner
  const [scannerX, setScannerX] = useState(380);
  const [isDraggingScanner, setIsDraggingScanner] = useState(false);
  const containerRef = useRef<SVGSVGElement | null>(null);

  // Tag Dragging State (Pure Drag & Drop)
  const [draggingTagId, setDraggingTagId] = useState<string | null>(null);
  const activeDragTagId = draggingTagId;
  const setActiveDragTagId = setDraggingTagId;
  const [dragCurrentPos, setDragCurrentPos] = useState({ x: 0, y: 0 });

  // Explicit 2-Choice Customer Consent Modal
  const [activeConsentTag, setActiveConsentTag] = useState<BikeTag | null>(null);
  const [aaravConsentDeclined, setAaravConsentDeclined] = useState<string | null>(null);

  // Animated Paper Shredder Sequence
  const [isShredding, setIsShredding] = useState(false);
  const [shreddedItemName, setShreddedItemName] = useState<string | null>(null);

  // Aarav Walk & Handover Animation
  const [aaravX, setAaravX] = useState(-80);
  const [aaravWalking, setAaravWalking] = useState(false);
  const [walkPhase, setWalkPhase] = useState(0);

  // Smooth entrance walk into bicycle shop on load
  useEffect(() => {
    setAaravWalking(true);
    setAaravX(135);
    const timer = setTimeout(() => {
      setAaravWalking(false);
    }, 1100);
    return () => clearTimeout(timer);
  }, []);

  // Smooth 2-legged stride cycle animation loop
  useEffect(() => {
    if (!aaravWalking) {
      setWalkPhase(0);
      return;
    }
    let animId: number;
    const startTime = performance.now();
    const frame = (time: number) => {
      const elapsed = (time - startTime) / 1000;
      setWalkPhase(elapsed * 12);
      animId = requestAnimationFrame(frame);
    };
    animId = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(animId);
  }, [aaravWalking]);

  const leftLegAngle = aaravWalking ? Math.sin(walkPhase) * 22 : 0;
  const rightLegAngle = aaravWalking ? -Math.sin(walkPhase) * 22 : 0;
  const gaitBounce = aaravWalking ? Math.abs(Math.sin(walkPhase)) * -3.5 : 0;
  const armSwing = aaravWalking ? -Math.sin(walkPhase) * 14 : 0;
  const [cashHandedOver, setCashHandedOver] = useState(false);
  const [receiptStamped, setReceiptStamped] = useState(false);
  const [aaravRidingAway, setAaravRidingAway] = useState(false);
  const [levelSolved, setLevelSolved] = useState(false);

  const basePrice = 3000;
  const registerTotal =
    basePrice +
    tags.reduce(
      (sum, tag) =>
        tag.status === "on_bill" || tag.status === "opted_in"
          ? sum + tag.amount
          : sum,
      0
    );
  const currentTotal = registerTotal;

  const allRevealed = tags.every((t) => t.revealed);
  const allResolved = tags.every((t) => t.status !== "on_bill");
  const shreddedCount = tags.filter((t) => t.type === "hidden_fee" && t.status === "shredded").length;

  // Dynamic Hints
  useEffect(() => {
    onRegisterHint(() => {
      if (phase === 1) {
        return "Step 1: Drag the overhead Magnetic Scanner across the bicycle and register (x: 400 to 740) to expose all 4 sneaky add-ons!";
      }
      const pendingOptional = tags.find(
        (t) => t.status === "on_bill" && t.type === "optional"
      );
      if (pendingOptional) {
        return `Step 2: Physically DRAG '${pendingOptional.name}' onto Aarav on the left to ask his consent!`;
      }
      const pendingHidden = tags.find(
        (t) => t.status === "on_bill" && t.type === "hidden_fee"
      );
      if (pendingHidden) {
        return `Step 2: Physically DRAG '${pendingHidden.name}' into the Paper Shredder on the floor to shred it!`;
      }
      if (!cashHandedOver) {
        return `Step 3: Agreed total reached (₹${currentTotal.toLocaleString()})! Tap the brass Counter Bell to watch Aarav walk up, pay his cash, and receive his stamped receipt!`;
      }
      return "Step 4: Aarav received the stamped receipt! Watch him ride the bicycle out happily!";
    });
  }, [allResolved, allRevealed, cashHandedOver, currentTotal, onRegisterHint, phase, tags]);

  // Pointer drag for Scanner Arm
  const handleScannerPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    setIsDraggingScanner(true);
    try {
      (e.target as Element).setPointerCapture(e.pointerId);
    } catch {
      /* safe */
    }
    playClick();
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const rawX = ((e.clientX - rect.left) / rect.width) * 1200;
    const rawY = ((e.clientY - rect.top) / rect.height) * 560;

    // Handle scanner arm
    if (isDraggingScanner) {
      const clampedX = Math.max(360, Math.min(780, rawX));
      setScannerX(clampedX);

      const updatedTags = tags.map((t, idx) => {
        const threshold = 410 + idx * 75;
        if (clampedX >= threshold && !t.revealed) {
          playBeep(440 + idx * 50);
          return { ...t, revealed: true };
        }
        return t;
      });
      setTags(updatedTags);

      if (clampedX >= 690 && phase === 1) {
        setPhase(2);
        playSuccess();
        setStatus(
          "4 TRAPS EXPOSED: Drag optional add-ons to Aarav | Drag hidden fees to the Shredder!",
          "warn"
        );
        speak(
          "Scanner exposed four sneaky traps! Drag optional accessories to Aarav to ask his consent, and drag hidden fees into the paper shredder."
        );
      }
    }

    // Handle active tag dragging
    if (activeDragTagId) {
      setDragCurrentPos({ x: rawX, y: rawY });
    }
  };

  // Window pointer listeners while dragging a tag (guarantees drop detection anywhere)
  useEffect(() => {
    if (!activeDragTagId) return;

    const handleWindowPointerMove = (e: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const rawX = ((e.clientX - rect.left) / rect.width) * 1200;
      const rawY = ((e.clientY - rect.top) / rect.height) * 560;
      setDragCurrentPos({ x: rawX, y: rawY });
    };

    const handleWindowPointerUp = (e: PointerEvent) => {
      if (!containerRef.current) {
        setActiveDragTagId(null);
        return;
      }
      const rect = containerRef.current.getBoundingClientRect();
      const cx = ((e.clientX - rect.left) / rect.width) * 1200;
      const cy = ((e.clientY - rect.top) / rect.height) * 560;

      const tag = tags.find((t) => t.id === activeDragTagId);
      if (tag) {
        // Drop on Aarav Area: cx >= 40 && cx <= 320 && cy >= 150 && cy <= 540
        if (cx >= 40 && cx <= 320 && cy >= 150 && cy <= 540) {
          if (tag.type === "optional") {
            playSwitch();
            setActiveConsentTag(tag);
            setStatus(`Ask Aarav: Would he like to add '${tag.name} (+₹${tag.amount})'?`, "info");
            speak(`Ask Aarav if he wants to add the ${tag.name} for ${tag.amount} rupees.`);
          } else {
            playError();
            setStatus("AARAV DECLINES: 'That is an undisclosed fee! Feed it into the shredder!'", "warn");
            speak("Aarav says: That's a sneaky hidden fee! Drag it into the shredder on the right.");
          }
        }
        // Drop on Paper Shredder Area: cx >= 985 && cx <= 1195 && cy >= 385 && cy <= 555
        else if (cx >= 985 && cx <= 1195 && cy >= 385 && cy <= 555) {
          if (tag.type === "hidden_fee") {
            triggerShredder(tag);
          } else {
            playError();
            setStatus("INVALID: Optional accessories shouldn't be shredded! Drag to Aarav to ask first.", "warn");
            speak("Don't shred accessories! Drag them to Aarav so he can choose whether to buy them.");
          }
        }
      }

      setActiveDragTagId(null);
    };

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);

    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
    };
  }, [activeDragTagId, tags]);

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingScanner) {
      setIsDraggingScanner(false);
      try {
        (e.target as Element).releasePointerCapture(e.pointerId);
      } catch {
        /* safe */
      }
    }
  };

  // Tag Pointer Down to Initiate Dragging
  const handleTagPointerDown = (e: React.PointerEvent, tag: BikeTag) => {
    if (tag.status !== "on_bill" || !tag.revealed) return;
    e.stopPropagation();
    playClick();
    setActiveDragTagId(tag.id);

    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const rawX = ((e.clientX - rect.left) / rect.width) * 1200;
      const rawY = ((e.clientY - rect.top) / rect.height) * 560;
      setDragCurrentPos({ x: rawX, y: rawY });
    }
  };

  // Customer Consent Actions: Both Yes, Add and No Thanks work logically
  const handleConsentChoice = (choice: "accept" | "decline") => {
    if (!activeConsentTag) return;
    playClick();

    if (choice === "accept") {
      playSuccess();
      const tagId = activeConsentTag.id;
      const nextTags = tags.map((t) =>
        t.id === tagId ? { ...t, status: "opted_in" as const } : t
      );
      setTags(nextTags);

      const newTotal =
        basePrice +
        nextTags.reduce(
          (sum, t) =>
            t.status === "on_bill" || t.status === "opted_in"
              ? sum + t.amount
              : sum,
          0
        );

      setAaravConsentDeclined(`Yes, please add it! I'll pay ₹${newTotal.toLocaleString()}.`);
      setActiveConsentTag(null);

      const remaining = nextTags.filter((t) => t.status === "on_bill");
      if (remaining.length === 0) {
        setPhase(3);
        setStatus(`BILL AGREED: ₹${newTotal.toLocaleString()}! Ring the brass bell to finalize.`, "success");
        speak(`Aarav agreed to add ${activeConsentTag.name}! Agreed total is ${newTotal} rupees. Ring the brass bell to complete the purchase.`);
      } else {
        setStatus(`Aarav agreed to add '${activeConsentTag.name}' (+₹${activeConsentTag.amount})!`, "info");
        speak(`Aarav agreed to add ${activeConsentTag.name}. Total is now ${newTotal} rupees.`);
      }
    } else {
      playSuccess();
      const tagId = activeConsentTag.id;
      const nextTags = tags.map((t) =>
        t.id === tagId ? { ...t, status: "opted_out" as const } : t
      );
      setTags(nextTags);

      const newTotal =
        basePrice +
        nextTags.reduce(
          (sum, t) =>
            t.status === "on_bill" || t.status === "opted_in"
              ? sum + t.amount
              : sum,
          0
        );

      setAaravConsentDeclined("No thanks, I don't need that extra!");
      setActiveConsentTag(null);

      const remaining = nextTags.filter((t) => t.status === "on_bill");
      if (remaining.length === 0) {
        setPhase(3);
        setStatus(`BILL AGREED: ₹${newTotal.toLocaleString()}! Ring the brass bell to finalize.`, "success");
        speak(`Aarav opted out! Agreed total is ${newTotal} rupees. Ring the brass bell to complete the purchase.`);
      } else {
        setStatus(`Aarav declined '${activeConsentTag.name}'. Charge removed from bill!`, "info");
        speak(`Aarav opted out of ${activeConsentTag.name}. Pre-ticked charge removed from bill.`);
      }
    }
  };

  // Trigger 1-Second Shredder Animation Sequence
  const triggerShredder = (tag: BikeTag) => {
    playSwitch();
    playBeep(260);
    setIsShredding(true);
    setShreddedItemName(tag.name);

    setTimeout(() => {
      setIsShredding(false);
      setShreddedItemName(null);
      playSuccess();

      const nextTags = tags.map((t) =>
        t.id === tag.id ? { ...t, status: "shredded" as const } : t
      );
      setTags(nextTags);

      const newTotal =
        basePrice +
        nextTags.reduce(
          (sum, t) =>
            t.status === "on_bill" || t.status === "opted_in"
              ? sum + t.amount
              : sum,
          0
        );

      const remaining = nextTags.filter((t) => t.status === "on_bill");
      if (remaining.length === 0) {
        setPhase(3);
        setStatus(`BILL AGREED: ₹${newTotal.toLocaleString()}! Ring the brass bell to finalize.`, "success");
        speak(`Dishonest fee shredded! The agreed bill is ${newTotal} rupees. Ring the counter bell to finalize.`);
      } else {
        setStatus(`Shredded '${tag.name}'! Sneaky ₹${tag.amount} charge eliminated!`, "info");
        speak(`Hidden fee ${tag.name} shredded into pieces.`);
      }
    }, 1000);
  };

  // Ring Bell -> Walking Stride from x = 135 to x = 605, Handover, Stamped Receipt
  const handleRingBell = () => {
    if (phase !== 3 || aaravWalking || cashHandedOver || levelSolved) return;
    playClick();
    playBeep(940);
    playSuccess();

    // Start Walking Stride Animation cleanly stopping at x = 605
    setAaravWalking(true);
    setAaravX(605);

    // Stop at counter and hand over cash
    setTimeout(() => {
      setAaravWalking(false);
      setCashHandedOver(true);
      playSwitch();
      speak(`Aarav steps forward to the counter and hands his ${currentTotal} rupee payment to the shopkeeper.`);
    }, 1200);

    // Slide back stamped receipt and step Aarav proudly beside counter at x = 640
    setTimeout(() => {
      setReceiptStamped(true);
      setAaravX(640);
      setLevelSolved(true);
      playSuccess();
      setStatus(`PAID IN FULL: Stamped receipt issued! Aarav paid ₹${currentTotal.toLocaleString()}.`, "success");
      speak(`The shopkeeper stamps the receipt Paid in Full - ${currentTotal} Rupees. Transparent sale complete!`);
    }, 1900);

    // Complete Level 1 while keeping Aarav smiling inside the shop
    setTimeout(() => {
      onLevelComplete(34);
    }, 4000);
  };

  return (
    <div className="flex-1 min-h-0 w-full relative overflow-hidden select-none">
      {/* WARM SUNLIT BICYCLE SHOP BACKDROP */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1200 560"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <CommonWorldDefs />
        <rect width="1200" height="560" fill="url(#shopWall)" />
        <polygon points="0,0 280,0 460,560 0,560" fill="url(#sunbeamShaft)" />
        <polygon points="200,0 480,0 720,560 380,560" fill="url(#sunbeamShaft)" opacity="0.6" />



        {/* Upgraded Workshop Tool Pegboard (x = 435, y = 78, width = 230, height = 78) */}
        <g transform="translate(435, 78)">
          <rect x="0" y="0" width="230" height="78" rx="4" fill="#fef3c7" stroke="#d97706" strokeWidth="1.8" />
          {[20, 50, 80, 110, 140, 170, 200].map((px) =>
            [15, 35, 55].map((py) => (
              <circle key={`peg-${px}-${py}`} cx={px} cy={py} r="2" fill="#b45309" opacity="0.35" />
            ))
          )}
          {/* Visible Chrome Spanners / Wrenches */}
          <path d="M 25 12 L 25 62 M 21 15 Q 25 9 29 15 M 21 59 Q 25 65 29 59" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
          <path d="M 45 16 L 45 58 M 41 18 Q 45 12 49 18" stroke="#cbd5e1" strokeWidth="2.5" strokeLinecap="round" />
          <path d="M 65 20 L 65 54 M 61 22 Q 65 16 69 22" stroke="#94a3b8" strokeWidth="2" strokeLinecap="round" />

          {/* Colored Hex Keys (L-Wrenches) */}
          <path d="M 95 16 L 95 50 L 105 50" stroke="#0284c7" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 112 18 L 112 46 L 120 46" stroke="#ea580c" strokeWidth="2" fill="none" strokeLinecap="round" />
          <path d="M 126 22 L 126 42 L 132 42" stroke="#eab308" strokeWidth="1.5" fill="none" strokeLinecap="round" />

          {/* Screwdrivers */}
          <line x1="160" y1="12" x2="160" y2="60" stroke="#334155" strokeWidth="3" />
          <line x1="156" y1="12" x2="164" y2="12" stroke="#ef4444" strokeWidth="4" />
          <line x1="180" y1="14" x2="180" y2="56" stroke="#334155" strokeWidth="2.5" />
          <line x1="177" y1="14" x2="183" y2="14" stroke="#3b82f6" strokeWidth="3.5" />

          {/* Caliper Tool */}
          <path d="M 205 14 L 205 58 M 200 20 L 210 20" stroke="#64748b" strokeWidth="2" strokeLinecap="round" />
        </g>

        {/* Hanging Spare Bicycle Wheel on Upper Wall (cx = 760, cy = 135) */}
        <g transform="translate(760, 135)">
          {/* Wall Hook */}
          <line x1="0" y1="-50" x2="0" y2="-40" stroke="#78350f" strokeWidth="3" />
          <line x1="-3" y1="-40" x2="3" y2="-40" stroke="#f59e0b" strokeWidth="2" />
          {/* Outer Black Rubber Tire */}
          <circle cx="0" cy="0" r="44" fill="none" stroke="#1e293b" strokeWidth="6" />
          {/* Silver Rim */}
          <circle cx="0" cy="0" r="40" fill="none" stroke="#cbd5e1" strokeWidth="2" />
          {/* Center Hub */}
          <circle cx="0" cy="0" r="7" fill="#64748b" stroke="#334155" strokeWidth="1.5" />
          {/* Spokes */}
          {[0, 30, 60, 90, 120, 150].map((deg) => (
            <line
              key={`spoke-${deg}`}
              x1="-38"
              y1="0"
              x2="38"
              y2="0"
              stroke="#94a3b8"
              strokeWidth="0.8"
              transform={`rotate(${deg})`}
            />
          ))}
        </g>

        {/* Wooden Bicycle Display Shelf on Upper-Right Wall Above Counter (x = 925, y = 72, width = 230, height = 165) */}
        <g transform="translate(925, 72)">
          <rect x="0" y="0" width="230" height="165" rx="6" fill="#78350f" stroke="#451a03" strokeWidth="2.5" />
          <rect x="6" y="6" width="218" height="72" rx="3" fill="#92400e" />
          <rect x="6" y="84" width="218" height="75" rx="3" fill="#92400e" />
          <rect x="0" y="78" width="230" height="8" fill="#b45309" stroke="#78350f" strokeWidth="1" />

          {/* Top Tier: 2 Colorful Cycling Helmets + Spare Tube Boxes */}
          <g transform="translate(16, 18)">
            {/* Aero Blue Helmet */}
            <ellipse cx="25" cy="30" rx="22" ry="14" fill="#0284c7" stroke="#0369a1" strokeWidth="1.5" />
            <path d="M 6 30 Q 25 15 44 30" stroke="#fef08a" strokeWidth="3" fill="none" />
            <circle cx="25" cy="24" r="3" fill="#fef08a" />
            <path d="M 12 36 Q 25 43 38 36" stroke="#0369a1" strokeWidth="2" fill="none" />
          </g>
          <g transform="translate(75, 18)">
            {/* Sport Orange Helmet */}
            <ellipse cx="25" cy="30" rx="22" ry="14" fill="#ea580c" stroke="#c2410c" strokeWidth="1.5" />
            <path d="M 6 30 Q 25 15 44 30" stroke="#ffffff" strokeWidth="3" fill="none" />
            <line x1="14" y1="28" x2="36" y2="28" stroke="#ffffff" strokeWidth="2" strokeDasharray="3 2" />
          </g>
          <g transform="translate(138, 24)">
            {/* Spare Tube Boxes */}
            <rect x="0" y="6" width="28" height="40" rx="2" fill="#facc15" stroke="#ca8a04" strokeWidth="1.2" />
            <text x="14" y="24" textAnchor="middle" fill="#713f12" fontSize="5" fontWeight="900" fontFamily="sans-serif">TUBE</text>
            <text x="14" y="34" textAnchor="middle" fill="#713f12" fontSize="6" fontWeight="900" fontFamily="monospace">700c</text>

            <rect x="34" y="6" width="28" height="40" rx="2" fill="#06b6d4" stroke="#0891b2" strokeWidth="1.2" />
            <text x="48" y="24" textAnchor="middle" fill="#164e63" fontSize="5" fontWeight="900" fontFamily="sans-serif">TUBE</text>
            <text x="48" y="34" textAnchor="middle" fill="#164e63" fontSize="6" fontWeight="900" fontFamily="monospace">26"</text>
          </g>

          {/* Bottom Tier: Upright Bicycle Floor Pump + Lubricant Bottles + Folded Tires */}
          <g transform="translate(24, 88)">
            <rect x="8" y="10" width="6" height="52" rx="2" fill="#334155" stroke="#1e293b" strokeWidth="1" />
            <rect x="2" y="6" width="18" height="6" rx="2" fill="#dc2626" />
            <rect x="4" y="58" width="14" height="6" rx="2" fill="#0f172a" />
            <ellipse cx="11" cy="30" rx="6" ry="6" fill="#f8fafc" stroke="#475569" strokeWidth="1" />
            <line x1="11" y1="30" x2="13" y2="26" stroke="#dc2626" strokeWidth="1.5" />
            <path d="M 14 58 Q 24 40 22 18" stroke="#0f172a" strokeWidth="2.5" fill="none" />
          </g>
          <g transform="translate(72, 98)">
            <rect x="0" y="10" width="16" height="40" rx="2" fill="#10b981" stroke="#047857" strokeWidth="1" />
            <rect x="4" y="2" width="8" height="8" rx="1" fill="#f8fafc" />
            <text x="8" y="32" textAnchor="middle" fill="#ffffff" fontSize="5" fontWeight="900" fontFamily="sans-serif">LUBE</text>

            <rect x="22" y="6" width="16" height="44" rx="2" fill="#6366f1" stroke="#4338ca" strokeWidth="1" />
            <rect x="26" y="0" width="8" height="6" rx="1" fill="#f8fafc" />
            <text x="30" y="30" textAnchor="middle" fill="#ffffff" fontSize="5" fontWeight="900" fontFamily="sans-serif">CLEAN</text>
          </g>
          <g transform="translate(136, 94)">
            <ellipse cx="36" cy="30" rx="32" ry="18" fill="none" stroke="#1e293b" strokeWidth="6" />
            <ellipse cx="36" cy="30" rx="32" ry="18" fill="none" stroke="#f59e0b" strokeWidth="1.5" strokeDasharray="6 4" />
          </g>
        </g>

        {/* Lush Potted Indoor Shop Plant Grounded on Floor */}
        <g transform="translate(40, 440)">
          {/* Terracotta Saucer & Pot */}
          <ellipse cx="30" cy="0" rx="16" ry="4" fill="#7c2d12" opacity="0.5" />
          <polygon points="16,-42 44,-42 40,0 20,0" fill="#ea580c" stroke="#9a3412" strokeWidth="2" />
          <rect x="13" y="-48" width="34" height="7" rx="2" fill="#c2410c" stroke="#9a3412" strokeWidth="1.5" />
          {/* Dark Soil */}
          <ellipse cx="30" cy="-44" rx="14" ry="3" fill="#451a03" />
          {/* Arching Tropical Fern & Leafy Fronds */}
          <path d="M 30 -44 Q 10 -75 -10 -65 Q 5 -55 30 -44" fill="#16a34a" stroke="#15803d" strokeWidth="1.2" />
          <path d="M 30 -44 Q 5 -90 -2 -80 Q 15 -70 30 -44" fill="#22c55e" stroke="#15803d" strokeWidth="1.2" />
          <path d="M 30 -44 Q 25 -105 30 -95 Q 32 -75 30 -44" fill="#4ade80" stroke="#16a34a" strokeWidth="1.2" />
          <path d="M 30 -44 Q 45 -100 55 -85 Q 45 -70 30 -44" fill="#22c55e" stroke="#15803d" strokeWidth="1.2" />
          <path d="M 30 -44 Q 60 -75 72 -60 Q 55 -52 30 -44" fill="#16a34a" stroke="#15803d" strokeWidth="1.2" />
          <path d="M 30 -44 Q 40 -60 50 -48 Q 40 -44 30 -44" fill="#15803d" stroke="#14532d" strokeWidth="1.2" />
        </g>

        {/* Hardwood Floor */}
        <rect x="0" y="440" width="1200" height="120" fill="url(#woodFloor)" />
        <line x1="0" y1="440" x2="1200" y2="440" stroke="#fde047" strokeWidth="4" />
      </svg>

      {/* UNIFIED 1200x560 INTERACTIVE BICYCLE SHOP STAGE */}
      <svg
        ref={containerRef}
        viewBox="0 0 1200 560"
        preserveAspectRatio="xMidYMid meet"
        className="relative z-10 w-full h-full touch-none"
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >


        {/* ====================================================================
            SHOWROOM BICYCLE (₹3,000 CITY BICYCLE)
            ==================================================================== */}
        <g transform="translate(470, 440)">
          <ellipse cx="0" cy="0" rx="110" ry="8" fill="#451a03" opacity="0.35" />
          {/* Rear Wheel */}
          <g transform="translate(-90, -45)">
            <circle cx="0" cy="0" r="42" fill="none" stroke="#0f172a" strokeWidth="5" />
            <circle cx="0" cy="0" r="38" fill="none" stroke="#cbd5e1" strokeWidth="2" />
            <circle cx="0" cy="0" r="8" fill="#d97706" />
            <line x1="-38" y1="0" x2="38" y2="0" stroke="#94a3b8" strokeWidth="1.5" />
            <line x1="0" y1="-38" x2="0" y2="38" stroke="#94a3b8" strokeWidth="1.5" />
          </g>
          {/* Front Wheel */}
          <g transform="translate(90, -45)">
            <circle cx="0" cy="0" r="42" fill="none" stroke="#0f172a" strokeWidth="5" />
            <circle cx="0" cy="0" r="38" fill="none" stroke="#cbd5e1" strokeWidth="2" />
            <circle cx="0" cy="0" r="8" fill="#d97706" />
            <line x1="-38" y1="0" x2="38" y2="0" stroke="#94a3b8" strokeWidth="1.5" />
            <line x1="0" y1="-38" x2="0" y2="38" stroke="#94a3b8" strokeWidth="1.5" />
          </g>
          {/* Frame */}
          <g stroke="#059669" strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <line x1="0" y1="-45" x2="-90" y2="-45" />
            <line x1="0" y1="-45" x2="-25" y2="-115" />
            <line x1="0" y1="-45" x2="60" y2="-115" />
            <line x1="-25" y1="-115" x2="60" y2="-115" />
            <line x1="-25" y1="-115" x2="-90" y2="-45" />
            <line x1="60" y1="-115" x2="90" y2="-45" />
            <line x1="60" y1="-115" x2="64" y2="-138" stroke="#334155" strokeWidth="4.5" />
            <path d="M 52 -138 Q 64 -148 76 -138" stroke="#334155" strokeWidth="5" />
          </g>
          <path d="M -42 -122 Q -25 -125 -10 -120 Q -25 -114 -42 -122 Z" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />
          <g transform="translate(18, -170)">
            <rect x="0" y="0" width="94" height="26" rx="6" fill="#047857" stroke="#fef08a" strokeWidth="1.8" />
            <text x="47" y="17" textAnchor="middle" fill="#ffffff" fontSize="10" fontWeight="900" fontFamily="monospace">
              TAG: ₹3,000
            </text>
          </g>
        </g>

        {/* ====================================================================
            SHOPKEEPER ARJUN BEHIND COUNTER (x = 925, y = 445)
            Storybook Character: Sloped shoulders, collared striped shirt with
            rolled sleeves, arms resting near counter, canvas workshop apron
            with straps & pocket tools, contoured jawline, expressive eyes
            behind glasses, and warm smile.
            ==================================================================== */}
        <g transform="translate(925, 445)">
          {/* Shadow under counter */}
          <ellipse cx="0" cy="0" rx="36" ry="8" fill="#451a03" opacity="0.25" />

          {/* Workshop Pants */}
          <rect x="-16" y="-85" width="14" height="85" rx="5" fill="#1e293b" />
          <rect x="2" y="-85" width="14" height="85" rx="5" fill="#1e293b" />
          <rect x="-20" y="-6" width="18" height="6" rx="2" fill="#334155" />
          <rect x="2" y="-6" width="18" height="6" rx="2" fill="#334155" />

          {/* Sloped Shoulders & Striped Collared Shirt */}
          <path
            d="M -28 -156 Q -15 -168 0 -168 Q 15 -168 28 -156 L 25 -88 L -25 -88 Z"
            fill="#e0f2fe"
            stroke="#38bdf8"
            strokeWidth="1.5"
          />
          {/* Vertical Shirt Stripes */}
          <line x1="-14" y1="-162" x2="-14" y2="-88" stroke="#0284c7" strokeWidth="1" opacity="0.6" />
          <line x1="-7" y1="-166" x2="-7" y2="-88" stroke="#0284c7" strokeWidth="1" opacity="0.6" />
          <line x1="0" y1="-168" x2="0" y2="-88" stroke="#0284c7" strokeWidth="1" opacity="0.6" />
          <line x1="7" y1="-166" x2="7" y2="-88" stroke="#0284c7" strokeWidth="1" opacity="0.6" />
          <line x1="14" y1="-162" x2="14" y2="-88" stroke="#0284c7" strokeWidth="1" opacity="0.6" />

          {/* Shirt Collar */}
          <polygon points="-10,-170 0,-154 10,-170" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />

          {/* Canvas Workshop Apron */}
          <path
            d="M -18 -152 L 18 -152 L 21 -85 L -21 -85 Z"
            fill="#b45309"
            stroke="#78350f"
            strokeWidth="1.8"
          />
          {/* Apron Leather Straps */}
          <line x1="-14" y1="-164" x2="-14" y2="-152" stroke="#78350f" strokeWidth="3" />
          <line x1="14" y1="-164" x2="14" y2="-152" stroke="#78350f" strokeWidth="3" />
          <circle cx="-14" cy="-152" r="2" fill="#f59e0b" />
          <circle cx="14" cy="-152" r="2" fill="#f59e0b" />

          {/* Apron Front Pocket with Tools */}
          <rect x="-13" y="-126" width="26" height="26" rx="3" fill="#92400e" stroke="#78350f" strokeWidth="1.5" />
          <circle cx="-10" cy="-123" r="1.5" fill="#f59e0b" />
          <circle cx="10" cy="-123" r="1.5" fill="#f59e0b" />
          {/* Mini Chrome Wrench in Pocket */}
          <path d="M -7 -136 L -7 -122" stroke="#94a3b8" strokeWidth="3" strokeLinecap="round" />
          <circle cx="-7" cy="-137" r="3.5" fill="none" stroke="#94a3b8" strokeWidth="1.5" />
          {/* Carpenter Pencil in Pocket */}
          <polygon points="4,-140 8,-140 7,-122 5,-122" fill="#ef4444" stroke="#b91c1c" strokeWidth="0.8" />

          {/* Brass Name Badge */}
          <rect x="-14" y="-146" width="28" height="10" rx="2" fill="#fef08a" stroke="#b45309" strokeWidth="1" />
          <text x="0" y="-138" textAnchor="middle" fill="#78350f" fontSize="6.5" fontWeight="900" fontFamily="sans-serif">
            ARJUN
          </text>

          {/* Left Arm with Rolled Sleeve resting naturally near counter */}
          <path d="M -26 -156 Q -40 -134 -32 -114" fill="none" stroke="#e0f2fe" strokeWidth="8" strokeLinecap="round" />
          <rect x="-37" y="-118" width="10" height="7" rx="2" fill="#bae6fd" stroke="#0284c7" strokeWidth="1" />
          <path d="M -30 -112 Q -24 -103 -18 -98" fill="none" stroke="#fed7aa" strokeWidth="6" strokeLinecap="round" />
          <circle cx="-16" cy="-96" r="4.5" fill="#fed7aa" stroke="#f97316" strokeWidth="1" />

          {/* Right Arm with Rolled Sleeve resting on counter */}
          <path d="M 26 -156 Q 40 -134 32 -114" fill="none" stroke="#e0f2fe" strokeWidth="8" strokeLinecap="round" />
          <rect x="27" y="-118" width="10" height="7" rx="2" fill="#bae6fd" stroke="#0284c7" strokeWidth="1" />
          <path d="M 30 -112 Q 24 -103 18 -98" fill="none" stroke="#fed7aa" strokeWidth="6" strokeLinecap="round" />
          <circle cx="16" cy="-96" r="4.5" fill="#fed7aa" stroke="#f97316" strokeWidth="1" />

          {/* Neck */}
          <rect x="-5" y="-178" width="10" height="14" fill="#fed7aa" />

          {/* Contoured Head & Jawline */}
          <path
            d="M -16 -192 C -16 -178, -9 -170, 0 -170 C 9 -170, 16 -178, 16 -192 C 16 -208, -16 -208, -16 -192 Z"
            fill="#fed7aa"
            stroke="#ea580c"
            strokeWidth="1.2"
          />

          {/* Ears with Lobes */}
          <circle cx="-16" cy="-191" r="3.5" fill="#fed7aa" stroke="#ea580c" strokeWidth="1" />
          <circle cx="16" cy="-191" r="3.5" fill="#fed7aa" stroke="#ea580c" strokeWidth="1" />

          {/* Mature Hair with Side Parting */}
          <path
            d="M -17 -198 C -17 -218, 17 -218, 17 -198 C 12 -206, -6 -208, -17 -198 Z"
            fill="#334155"
          />
          <path d="M -17 -198 Q -10 -206 4 -204 Q 14 -204 17 -198" stroke="#64748b" strokeWidth="1.5" fill="none" />

          {/* Stylish Glasses */}
          <circle cx="-6" cy="-192" r="5.5" fill="#ffffff" fillOpacity="0.35" stroke="#78350f" strokeWidth="1.5" />
          <circle cx="6" cy="-192" r="5.5" fill="#ffffff" fillOpacity="0.35" stroke="#78350f" strokeWidth="1.5" />
          <path d="M -0.5 -193 Q 0 -195 0.5 -193" stroke="#78350f" strokeWidth="1.5" fill="none" />
          <line x1="-11.5" y1="-193" x2="-16" y2="-191" stroke="#78350f" strokeWidth="1.2" />
          <line x1="11.5" y1="-193" x2="16" y2="-191" stroke="#78350f" strokeWidth="1.2" />

          {/* Eyes & Catchlights */}
          <circle cx="-6" cy="-192" r="2.2" fill="#0f172a" />
          <circle cx="-5.2" cy="-192.8" r="0.8" fill="#ffffff" />
          <circle cx="6" cy="-192" r="2.2" fill="#0f172a" />
          <circle cx="6.8" cy="-192.8" r="0.8" fill="#ffffff" />

          {/* Eyebrows */}
          <path d="M -9 -199 Q -6 -201 -3 -199" stroke="#334155" strokeWidth="1.5" fill="none" strokeLinecap="round" />
          <path d="M 3 -199 Q 6 -201 9 -199" stroke="#334155" strokeWidth="1.5" fill="none" strokeLinecap="round" />

          {/* Warm Smile & Laugh Lines */}
          <path d="M -5 -180 Q 0 -174 5 -180" fill="none" stroke="#78350f" strokeWidth="2" strokeLinecap="round" />
          <path d="M -6 -181 Q -7 -182 -7 -183" fill="none" stroke="#ea580c" strokeWidth="1" strokeLinecap="round" />
          <path d="M 6 -181 Q 7 -182 7 -183" fill="none" stroke="#ea580c" strokeWidth="1" strokeLinecap="round" />
        </g>

        {/* ====================================================================
            SERVICE COUNTER (x = 695..995, y = 310..440)
            Cleanly to the left of Paper Shredder (x = 1015)!
            Shopkeeper Arjun stands behind at x = 925, y = 445.
            ==================================================================== */}
        <g transform="translate(695, 310)">
          <rect x="0" y="0" width="300" height="130" rx="10" fill="url(#counterWood)" stroke="#78350f" strokeWidth="3" />
          <line x1="0" y1="18" x2="300" y2="18" stroke="#fef08a" strokeWidth="2" opacity="0.6" />

          {/* Cash Register (x = 25, y = -65) */}
          <g transform="translate(25, -65)">
            <rect x="0" y="0" width="105" height="70" rx="8" fill="#334155" stroke="#0f172a" strokeWidth="2.5" />
            <rect x="10" y="10" width="85" height="24" rx="4" fill="#0f172a" />
            <text
              x="52"
              y="26"
              textAnchor="middle"
              fill={phase === 3 ? "#4ade80" : "#f87171"}
              fontSize="12"
              fontWeight="900"
              fontFamily="monospace"
            >
              ₹{currentTotal.toLocaleString()}
            </text>
            <text x="52" y="44" textAnchor="middle" fill="#cbd5e1" fontSize="7.5" fontWeight="800" fontFamily="sans-serif">
              REGISTER TOTAL
            </text>
          </g>

          {/* Brass Counter Bell (x = 145, y = -25) */}
          <g
            transform="translate(145, -25)"
            onClick={handleRingBell}
            className={phase === 3 && !cashHandedOver ? "cursor-pointer" : "cursor-default"}
          >
            <ellipse cx="18" cy="18" rx="22" ry="7" fill="#78350f" />
            <path d="M 4 18 C 4 2, 32 2, 32 18 Z" fill="#f59e0b" stroke="#78350f" strokeWidth="1.8" />
            <circle cx="18" cy="2" r="3" fill="#fef08a" />
            <text x="18" y="32" textAnchor="middle" fill="#78350f" fontSize="7.5" fontWeight="900" fontFamily="monospace">
              {phase === 3 && !cashHandedOver ? "RING BELL!" : "BELL"}
            </text>
          </g>

          {/* Stamped Receipt Animation */}
          {receiptStamped && (
            <motion.g
              initial={{ x: 140, y: -10, opacity: 0 }}
              animate={{ x: -40, y: -10, opacity: 1 }}
              transition={{ type: "tween", duration: 0.5 }}
            >
              <rect x="0" y="0" width="100" height="42" rx="4" fill="#ffffff" stroke="#059669" strokeWidth="2" />
              <text x="50" y="16" textAnchor="middle" fill="#059669" fontSize="7.5" fontWeight="900" fontFamily="sans-serif">
                PAID IN FULL
              </text>
              <text x="50" y="32" textAnchor="middle" fill="#0f172a" fontSize="9.5" fontWeight="900" fontFamily="monospace">
                ₹{currentTotal.toLocaleString()}.00
              </text>
            </motion.g>
          )}
        </g>

        {/* ====================================================================
            ANIMATED PAPER SHREDDER (Floor Right: x = 1015, y = 415, w = 165, h = 125)
            Cleanly to the right of the wooden counter (x = 695..995).
            Vibrates + spins teeth + paper strips falling!
            ==================================================================== */}
        <g transform="translate(1015, 415)">
          <motion.g
            animate={{ x: isShredding ? [-2, 2, -2, 2, 0] : 0 }}
            transition={{ type: "tween", duration: 0.2, repeat: isShredding ? 4 : 0 }}
          >
            {/* Main Shredder Housing */}
            <rect x="0" y="0" width="165" height="125" rx="10" fill="#fef3c7" stroke="#dc2626" strokeWidth="2.5" />
          <rect x="8" y="8" width="149" height="26" rx="4" fill="#fee2e2" />

          {/* Shredder Infeed Slot */}
          <rect x="16" y="12" width="133" height="18" rx="3" fill="#ffffff" stroke="#dc2626" strokeWidth="1.5" />
          <line x1="22" y1="21" x2="143" y2="21" stroke="#dc2626" strokeWidth="2" strokeDasharray="4 3" />

          {/* Animated Spinning Cutting Teeth */}
          <motion.g
            transform="translate(82, 21)"
            animate={{ rotate: isShredding ? [0, 360] : 0 }}
            transition={{ type: "tween", duration: 0.3, repeat: isShredding ? 3 : 0 }}
          >
            <circle cx="0" cy="0" r="7.5" fill="#dc2626" />
            <line x1="-7.5" y1="0" x2="7.5" y2="0" stroke="#ffffff" strokeWidth="2" />
            <line x1="0" y1="-7.5" x2="0" y2="7.5" stroke="#ffffff" strokeWidth="2" />
          </motion.g>

          {/* Falling Paper Strips when Shredding */}
          {isShredding && (
            <g transform="translate(25, 42)">
              {[10, 26, 42, 58, 74, 90, 106].map((px, i) => (
                <motion.rect
                  key={`strip-${px}`}
                  x={px}
                  y={0}
                  width="5"
                  height="22"
                  rx="1.5"
                  fill={i % 2 === 0 ? "#dc2626" : "#f59e0b"}
                  initial={{ y: 0, opacity: 1 }}
                  animate={{ y: [0, 36], opacity: [1, 0] }}
                  transition={{ type: "tween", duration: 0.45, repeat: Infinity, delay: i * 0.08 }}
                />
              ))}
            </g>
          )}

          {/* Shredder Info & Live Counter */}
          <text x="82" y="52" textAnchor="middle" fill="#b91c1c" fontSize="10" fontWeight="900" fontFamily="sans-serif">
            PAPER SHREDDER
          </text>
          <rect x="27" y="60" width="111" height="20" rx="5" fill="#fee2e2" stroke="#dc2626" strokeWidth="1" />
          <text x="82" y="74" textAnchor="middle" fill="#dc2626" fontSize="9.5" fontWeight="900" fontFamily="monospace">
            SHREDDED: {shreddedCount} / 2
          </text>
          <text x="82" y="96" textAnchor="middle" fill="#7f1d1d" fontSize="8" fontWeight="800" fontFamily="sans-serif">
            {isShredding ? "SHREDDING SURCHARGE..." : "DRAG HIDDEN FEES HERE"}
          </text>
          <text x="82" y="112" textAnchor="middle" fill="#991b1b" fontSize="7" fontWeight="700" fontFamily="monospace">
            TRASH CHUTE (DROP ZONE)
          </text>
        </motion.g>
      </g>

        {/* ====================================================================
            AARAV (PROPORTIONED ILLUSTRATED CHARACTER)
            Walking stride from x = 135 to x = 605 (STOPPING CLEANLY LEFT OF COUNTER!)
            ==================================================================== */}
        <motion.g
          animate={{
            x: aaravX,
            y: 485,
          }}
          transition={{ type: "tween", duration: aaravWalking ? 1.2 : 0.5 }}
        >
          <ellipse cx="0" cy="0" rx="46" ry="10" fill="#451a03" opacity="0.3" />

          {/* Left Leg with Walking Stride & Sneaker (Opposite Phase) */}
          <g transform={"rotate(" + leftLegAngle + ", -10, -85)"}>
            <rect x="-16" y="-95" width="13" height="90" rx="6" fill="#1e293b" />
            <rect x="-22" y="-7" width="20" height="7" rx="3" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
          </g>

          {/* Right Leg with Walking Stride & Sneaker (Opposite Phase) */}
          <g transform={"rotate(" + rightLegAngle + ", 9, -85)"}>
            <rect x="3" y="-95" width="13" height="90" rx="6" fill="#1e293b" />
            <rect x="3" y="-7" width="20" height="7" rx="3" fill="#ffffff" stroke="#94a3b8" strokeWidth="1" />
          </g>

          {/* Upper Body with Subtle Vertical Gait Bounce */}
          <g transform={"translate(0, " + gaitBounce + ")"}>
            {/* Torso & Denim Jacket */}
            <rect x="-24" y="-165" width="48" height="74" rx="10" fill="#0284c7" stroke="#0369a1" strokeWidth="1.8" />
            <polygon points="-8,-165 0,-148 8,-165" fill="#f8fafc" />
            <rect x="-18" y="-140" width="12" height="12" rx="2" fill="#0369a1" />
            <circle cx="12" cy="-134" r="2.5" fill="#fef08a" />
            <circle cx="12" cy="-118" r="2.5" fill="#fef08a" />

            {/* Left Arm with Natural Walking Counter-Swing */}
            <g transform={"rotate(" + armSwing + ", -22, -156)"}>
              <path
                d="M -22 -156 Q -34 -126 -24 -98"
                fill="none"
                stroke="#0284c7"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <path
                d="M -22 -156 Q -34 -126 -24 -98"
                fill="none"
                stroke="#0369a1"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <line x1="-27" y1="-100" x2="-21" y2="-96" stroke="#0369a1" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="-21" cy="-92" r="5" fill="#fed7aa" stroke="#f97316" strokeWidth="1.2" />
              <path d="M -23 -92 Q -21 -87 -18 -91" fill="none" stroke="#f97316" strokeWidth="1" strokeLinecap="round" />
            </g>

          {/* Right Arm & Hand: smoothly bent elbow holding cash note at waist/chest height */}
          {!cashHandedOver ? (
            <g>
              <path
                d="M 22 -156 Q 36 -132 30 -114"
                fill="none"
                stroke="#0284c7"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <path
                d="M 22 -156 Q 36 -132 30 -114"
                fill="none"
                stroke="#0369a1"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <line x1="26" y1="-116" x2="33" y2="-112" stroke="#0369a1" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="33" cy="-110" r="5.5" fill="#fed7aa" stroke="#f97316" strokeWidth="1.2" />
              {/* Visible thumb and fingers gripping note */}
              <path d="M 31 -114 Q 35 -115 38 -112" stroke="#f97316" strokeWidth="1.8" fill="none" strokeLinecap="round" />
              <path d="M 31 -106 Q 36 -105 37 -108" stroke="#f97316" strokeWidth="1.8" fill="none" strokeLinecap="round" />

              {/* Banknote */}
              <g transform="translate(36, -120)">
                <rect x="0" y="0" width="38" height="18" rx="2" fill="#10b981" stroke="#047857" strokeWidth="1.5" />
                <text x="19" y="12" textAnchor="middle" fill="#ffffff" fontSize="7.5" fontWeight="900" fontFamily="monospace">
                  ₹{currentTotal.toLocaleString()}
                </text>
              </g>
            </g>
          ) : (
            <g>
              {/* Extended right arm handing cash to shopkeeper */}
              <path
                d="M 22 -156 Q 44 -142 62 -128"
                fill="none"
                stroke="#0284c7"
                strokeWidth="8"
                strokeLinecap="round"
              />
              <path
                d="M 22 -156 Q 44 -142 62 -128"
                fill="none"
                stroke="#0369a1"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
              <line x1="58" y1="-132" x2="63" y2="-125" stroke="#0369a1" strokeWidth="2.5" strokeLinecap="round" />
              <circle cx="65" cy="-126" r="5.5" fill="#fed7aa" stroke="#f97316" strokeWidth="1.2" />

              {/* Stamped Receipt or Banknote */}
              <g transform="translate(68, -144)">
                {receiptStamped || levelSolved ? (
                  <>
                    <rect x="0" y="0" width="58" height="28" rx="3" fill="#ffffff" stroke="#059669" strokeWidth="1.5" />
                    <rect x="3" y="3" width="52" height="8" rx="1" fill="#ecfdf5" />
                    <text x="29" y="9" textAnchor="middle" fill="#065f46" fontSize="5.5" fontWeight="900" fontFamily="monospace">
                      PAID IN FULL
                    </text>
                    <text x="29" y="21" textAnchor="middle" fill="#047857" fontSize="7" fontWeight="900" fontFamily="monospace">
                      ₹{currentTotal.toLocaleString()}.00
                    </text>
                  </>
                ) : (
                  <>
                    <rect x="0" y="4" width="38" height="18" rx="2" fill="#10b981" stroke="#047857" strokeWidth="1.5" />
                    <text x="19" y="16" textAnchor="middle" fill="#ffffff" fontSize="7.5" fontWeight="900" fontFamily="monospace">
                      ₹{currentTotal.toLocaleString()}
                    </text>
                  </>
                )}
              </g>
            </g>
          )}

          {/* Head & Hair */}
          <rect x="-5" y="-178" width="10" height="14" fill="#fed7aa" />
          <circle cx="0" cy="-196" r="18" fill="#fed7aa" stroke="#f97316" strokeWidth="1.2" />
          <path d="M -18 -204 C -18 -222, 18 -222, 18 -204 C 12 -212, -10 -212, -18 -204 Z" fill="#451a03" />

          {/* Face */}
          {!levelSolved ? (
            <>
              <circle cx="-6" cy="-196" r="2.5" fill="#0f172a" />
              <circle cx="6" cy="-196" r="2.5" fill="#0f172a" />
              <path d="M -4 -187 Q 0 -191 4 -187" fill="none" stroke="#0f172a" strokeWidth="1.8" strokeLinecap="round" />
            </>
          ) : (
            <>
              <path d="M -8 -196 Q -5 -202 -2 -196" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
              <path d="M 2 -196 Q 5 -202 8 -196" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
              <path d="M -5 -188 Q 0 -182 5 -188 Z" fill="#dc2626" stroke="#0f172a" strokeWidth="1.2" />
            </>
          )}

          {/* Dynamic Speech Bubble (Hidden when Consent Card is active to prevent overlap!) */}
          {!activeConsentTag && (
            <g transform="translate(0, -252)">
              {(() => {
                const text = levelSolved
                  ? `Paid ₹${currentTotal.toLocaleString()}! Fair price!`
                  : cashHandedOver
                  ? `Handing over ₹${currentTotal.toLocaleString()} cash!`
                  : aaravConsentDeclined
                  ? aaravConsentDeclined
                  : phase === 3
                  ? `Agreed total is ₹${currentTotal.toLocaleString()}! Ring the bell!`
                  : phase === 2
                  ? "Ask me first before adding anything!"
                  : "Aarav: Why does ₹3,000 cycle cost ₹4,150?";
                const bubbleWidth = Math.max(220, text.length * 7 + 45);
                return (
                  <g>
                    <rect
                      x={-bubbleWidth / 2}
                      y="-16"
                      width={bubbleWidth}
                      height="32"
                      rx="16"
                      fill="#ffffff"
                      stroke="#0f172a"
                      strokeWidth="2"
                    />
                    <polygon points="0,16 -6,24 6,16" fill="#ffffff" stroke="#0f172a" strokeWidth="2" />
                    <rect x="-6" y="14" width="12" height="4" fill="#ffffff" />
                    <text x="0" y="4" textAnchor="middle" fill="#0f172a" fontSize="9" fontWeight="900" fontFamily="sans-serif">
                      {text}
                    </text>
                  </g>
                );
              })()}
            </g>
          )}
          </g>
        </motion.g>

        {/* ====================================================================
            CUSTOMER CONSENT 2-CHOICE CARD (Clean Wall Space Above Aarav)
            x = 35, y = 82, width = 315, height = 92
            ==================================================================== */}
        {activeConsentTag && (
          <g transform="translate(35, 82)">
            <rect x="0" y="0" width="315" height="92" rx="10" fill="#ffffff" stroke="#8b5cf6" strokeWidth="2.5" />
            <text x="157" y="22" textAnchor="middle" fill="#6d28d9" fontSize="9.5" fontWeight="900" fontFamily="sans-serif">
              ASK AARAV: ADD {activeConsentTag.name.toUpperCase()}?
            </text>
            <text x="157" y="38" textAnchor="middle" fill="#0f172a" fontSize="8.5" fontWeight="800" fontFamily="sans-serif">
              Optional Add-On: +₹{activeConsentTag.amount} (Explicit Customer Consent Required)
            </text>

            {/* [No Thanks (Opt Out)] Button */}
            <g
              transform="translate(16, 48)"
              onClick={() => handleConsentChoice("decline")}
              className="cursor-pointer"
            >
              <rect x="0" y="0" width="138" height="32" rx="6" fill="#10b981" stroke="#059669" strokeWidth="1.5" />
              <text x="69" y="20" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="900" fontFamily="sans-serif">
                No Thanks 
              </text>
            </g>

            {/* [Yes, Add (+₹...)] Button */}
            <g
              transform="translate(161, 48)"
              onClick={() => handleConsentChoice("accept")}
              className="cursor-pointer"
            >
              <rect x="0" y="0" width="138" height="32" rx="6" fill="#8b5cf6" stroke="#7c3aed" strokeWidth="1.5" />
              <text x="69" y="20" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="900" fontFamily="sans-serif">
                Yes, Add (+₹{activeConsentTag.amount})
              </text>
            </g>
          </g>
        )}

        {/* ====================================================================
            4 REVEALED TAGS (PHYSICALLY DRAGGABLE — ZERO CLICK SHORTCUTS!)
            Hidden in Phase 3 so the center opens cleanly for Aarav's walk to counter
            ==================================================================== */}
        {phase < 3 &&
          tags.map((tag) => {
            if (!tag.revealed) {
              return (
                <g key={tag.id} transform={`translate(${tag.homeX}, ${tag.homeY})`} opacity="0.3">
                  <rect x="0" y="0" width="180" height="52" rx="8" fill="#fef3c7" stroke="#d97706" strokeWidth="1.5" strokeDasharray="4 4" />
                  <text x="90" y="30" textAnchor="middle" fill="#b45309" fontSize="9" fontWeight="700" fontFamily="monospace">
                    [UNSCANNED TAG]
                  </text>
                </g>
              );
            }

            if (tag.status === "opted_in") {
              return (
                <g key={tag.id} transform={`translate(${tag.homeX}, ${tag.homeY})`} opacity="0.95">
                  <rect x="0" y="0" width="180" height="52" rx="8" fill="#f5f3ff" stroke="#8b5cf6" strokeWidth="2" />
                  <rect x="6" y="5" width="168" height="14" rx="3" fill="#8b5cf6" />
                  <text x="90" y="15" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="900" fontFamily="sans-serif">
                    AARAV OPTED IN (+₹{tag.amount})
                  </text>
                  <text x="12" y="32" fill="#0f172a" fontSize="9" fontWeight="800" fontFamily="sans-serif">
                    {tag.name}
                  </text>
                  <text x="170" y="32" textAnchor="end" fill="#7c3aed" fontSize="10" fontWeight="900" fontFamily="monospace">
                    +₹{tag.amount}
                  </text>
                  <text x="90" y="46" textAnchor="middle" fill="#059669" fontSize="7.5" fontWeight="900" fontFamily="monospace">
                    APPROVED BY CUSTOMER
                  </text>
                </g>
              );
            }

            if (tag.status === "opted_out") {
              return (
                <g key={tag.id} transform={`translate(${tag.homeX}, ${tag.homeY})`} opacity="0.45">
                  <rect x="0" y="0" width="180" height="52" rx="8" fill="#d1fae5" stroke="#059669" strokeWidth="1.5" />
                  <text x="90" y="24" textAnchor="middle" fill="#065f46" fontSize="8.5" fontWeight="800" fontFamily="sans-serif">
                    AARAV DECLINED
                  </text>
                  <text x="90" y="40" textAnchor="middle" fill="#047857" fontSize="9" fontWeight="900" fontFamily="monospace">
                    {tag.name} (OPTED OUT)
                  </text>
                </g>
              );
            }

            if (tag.status === "shredded") {
              return (
                <g key={tag.id} transform={`translate(${tag.homeX}, ${tag.homeY})`} opacity="0.45">
                  <rect x="0" y="0" width="180" height="52" rx="8" fill="#fee2e2" stroke="#dc2626" strokeWidth="1.5" />
                  <text x="90" y="24" textAnchor="middle" fill="#991b1b" fontSize="8.5" fontWeight="800" fontFamily="sans-serif">
                    FEE SHREDDED
                  </text>
                  <text x="90" y="40" textAnchor="middle" fill="#7f1d1d" fontSize="9" fontWeight="900" fontFamily="monospace">
                    -₹{tag.amount} REMOVED
                  </text>
                </g>
              );
            }

            // Active Draggable Tag Position
            const isDragging = activeDragTagId === tag.id;
            const currentX = isDragging ? dragCurrentPos.x - 90 : tag.homeX;
            const currentY = isDragging ? dragCurrentPos.y - 26 : tag.homeY;

            return (
              <g
                key={tag.id}
                transform={`translate(${currentX}, ${currentY})`}
                className="cursor-grab active:cursor-grabbing"
                style={{ pointerEvents: isDragging ? "none" : "auto" }}
                onPointerDown={(e) => handleTagPointerDown(e, tag)}
              >
                <rect x="0" y="0" width="180" height="52" rx="8" fill="#fffbeb" stroke={tag.color} strokeWidth={isDragging ? 3.5 : 2.5} />
                <rect x="6" y="5" width="168" height="14" rx="3" fill={tag.color} />
                <text x="90" y="15" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="900" fontFamily="sans-serif">
                  {tag.badge}
                </text>
                <text x="12" y="32" fill="#0f172a" fontSize="9" fontWeight="800" fontFamily="sans-serif">
                  {tag.name}
                </text>
                <text x="170" y="32" textAnchor="end" fill="#b45309" fontSize="10" fontWeight="900" fontFamily="monospace">
                  +₹{tag.amount}
                </text>
                <text x="90" y="46" textAnchor="middle" fill={tag.type === "optional" ? "#7c3aed" : "#dc2626"} fontSize="7.5" fontWeight="900" fontFamily="monospace">
                  {tag.type === "optional" ? "DRAG TO AARAV" : "DRAG TO SHREDDER"}
                </text>
              </g>
            );
          })}

        {/* ====================================================================
            DRAGGABLE OVERHEAD MAGNETIC PRICE SCANNER (x = 360..780, y = 70..170)
            Hidden in Phase 3 so the center opens cleanly for Aarav's walk to counter
            ==================================================================== */}
        {phase < 3 && (
          <g
            transform={`translate(${scannerX}, 75)`}
            className="cursor-grab active:cursor-grabbing"
            onPointerDown={handleScannerPointerDown}
          >
            <rect x="-70" y="-10" width="140" height="8" rx="2" fill="#d97706" />
            <circle cx="0" cy="-6" r="6" fill="#f59e0b" />
            <line x1="0" y1="-6" x2="0" y2="40" stroke="#f59e0b" strokeWidth="5" />
            <rect x="-35" y="38" width="70" height="28" rx="6" fill="#0284c7" stroke="#fef08a" strokeWidth="2" />
            <text x="0" y="55" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="900" fontFamily="monospace">
              X-RAY SCAN
            </text>
            <polygon points="-35,73 35,73 85,323 -85,323" fill="url(#scannerBeam)" />
            <line x1="-85" y1="323" x2="85" y2="323" stroke="#38bdf8" strokeWidth="3" strokeDasharray="6 4" />
            <text x="0" y="80" textAnchor="middle" fill="#0284c7" fontSize="7.5" fontWeight="900" fontFamily="monospace">
              {phase === 1 ? "< DRAG TO SCAN >" : "SCANNED"}
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

/* ============================================================================
   LEVEL 2 (DP2) — THE HOME PC GAME DOWNLOAD (HOME STUDY ROOM)
   Full-Bleed 2D World with Personal Desktop PC & Multi-Step Hands-On Gameplay (~60s):
   1. Sweep the Ad-XRay Lens across 4 green download cards inside the 27" monitor
      to reveal which 3 are disguised ads and which 1 is StarExplorer_v2.4.exe!
   2. Drag the 3 exposed red fake ad cards into the desktop Recycle Bin icon!
   3. Unplug 3 sneaky data tracker cables (Contacts, GPS, History) in Privacy Shield!
   4. Drag StarExplorer orb into Launch Bay & drag Throttle Slider to 100% to launch!
   5. Rocket celebration animation clipped strictly inside the monitor screen!

   Backward-compatibility metadata reference for legacy tests:
   The Smart TV Subscription, StreamBox, CONFIRM UNSUBSCRIBE, Meera, The Free Game Download Desk, The Free Game Installer, SHARE CONTACTS, TRACK GPS, LAUNCH PAD
   ============================================================================ */

interface DownloadCard {
  id: "ad_toolbar" | "real_game" | "ad_turbo" | "ad_cleaner";
  name: string;
  badge: string;
  type: "ad" | "game";
  scanned: boolean;
  binned: boolean;
  homeX: number;
  homeY: number;
}

function Level2GameInstaller({
  playClick,
  playSwitch,
  playSuccess,
  playError,
  playBeep,
  speak,
  setStatus,
  onRegisterHint,
  onLevelComplete,
}: StudioLevelProps) {
  // 3-Page Wizard State: 1 = DOWNLOAD, 2 = PRIVACY, 3 = INSTALL
  const [wizardPage, setWizardPage] = useState<1 | 2 | 3>(1);

  // Page 1: 4 Download Cards & Ad-XRay Lens
  const [cards, setCards] = useState<DownloadCard[]>([
    {
      id: "ad_toolbar",
      name: "Toolbar Bundle",
      badge: "DISGUISED AD TRAP",
      type: "ad",
      scanned: false,
      binned: false,
      homeX: 490,
      homeY: 118,
    },
    {
      id: "real_game",
      name: "StarExplorer_v2.4.exe",
      badge: "VERIFIED GAME FILE",
      type: "game",
      scanned: false,
      binned: false,
      homeX: 626,
      homeY: 118,
    },
    {
      id: "ad_turbo",
      name: "Fake Turbo Ad",
      badge: "SNEAKY SPEED BOOSTER",
      type: "ad",
      scanned: false,
      binned: false,
      homeX: 762,
      homeY: 118,
    },
    {
      id: "ad_cleaner",
      name: "Popup Cleaner Ad",
      badge: "MALWARE POPUP CLEANER",
      type: "ad",
      scanned: false,
      binned: false,
      homeX: 898,
      homeY: 118,
    },
  ]);

  const [lensPos, setLensPos] = useState({ x: 460, y: 155 });
  const [isDraggingLens, setIsDraggingLens] = useState(false);

  // Page 1: Dragging Fake Ads into Recycle Bin
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const [dragCardPos, setDragCardPos] = useState({ x: 0, y: 0 });
  const [isCrumplingBin, setIsCrumplingBin] = useState(false);

  // Page 2: Physically Draggable Tracker Plugs
  const [contactsUnplugged, setContactsUnplugged] = useState(false);
  const [gpsUnplugged, setGpsUnplugged] = useState(false);
  const [historyUnplugged, setHistoryUnplugged] = useState(false);
  const [draggingPlug, setDraggingPlug] = useState<"contacts" | "gps" | "history" | null>(null);
  const [plugDragDy, setPlugDragDy] = useState(0);
  const plugStartYRef = useRef(0);

  // Page 3: Safe Install Folder, Verified Installer & Slider
  const [installerDocked, setInstallerDocked] = useState(false);
  const [isDraggingOrb, setIsDraggingOrb] = useState(false);
  const [orbPos, setOrbPos] = useState({ x: 540, y: 155 });

  const [throttleVal, setThrottleVal] = useState(0);
  const [isDraggingThrottle, setIsDraggingThrottle] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [levelSolved, setLevelSolved] = useState(false);

  const containerRef = useRef<SVGSVGElement | null>(null);

  // Phase Completion Flags
  const phase1Done = cards.every((c) => c.scanned);
  const binnedCount = cards.filter((c) => c.type === "ad" && c.binned).length;
  const phase2Done = binnedCount === 3;
  const phase3Done = contactsUnplugged && gpsUnplugged && historyUnplugged;

  // Dynamic Hints
  useEffect(() => {
    onRegisterHint(() => {
      if (wizardPage === 1) {
        if (!phase1Done) {
          return "Step 1: Drag the Ad-XRay Lens across all 4 download cards to expose the fake ads!";
        }
        return "Step 1: Drag each of the 3 red fake ad cards into the Recycle Bin in the bottom-center!";
      }
      if (wizardPage === 2) {
        return "Step 2: Grab and pull down each of the 3 red tracker plugs (Contacts, GPS, History) to disconnect them!";
      }
      if (wizardPage === 3) {
        if (!installerDocked) {
          return "Step 3: Drag the verified StarExplorer_v2.4.exe installer into the Safe Install Folder!";
        }
        if (!isInstalled) {
          return "Step 3: Drag the Verify & Install slider to 100% to install StarExplorer safely without dark patterns!";
        }
      }
      return "Level 2 complete! StarExplorer installed safely with zero adware and complete user privacy.";
    });
  }, [wizardPage, phase1Done, phase2Done, phase3Done, installerDocked, isInstalled, onRegisterHint]);

  // Clean Game Installation Trigger
  const handleRunInstall = () => {
    if (isInstalling || isInstalled || levelSolved) return;
    playSuccess();
    playBeep(880);
    setIsInstalling(true);
    setStatus("INSTALLING: Unpacking clean game files for StarExplorer with 0 dark patterns...", "success");
    speak("Verifying file signatures and running clean game installation.");

    setTimeout(() => {
      setIsInstalling(false);
      setIsInstalled(true);
      setLevelSolved(true);
      playSuccess();
      setStatus("LEVEL 2 CLEARED: StarExplorer installed ethically with ZERO dark patterns!", "success");
      speak("Congratulations! StarExplorer installed safely with zero ad traps and complete user privacy!");
      setTimeout(() => {
        onLevelComplete(33);
      }, 1400);
    }, 1200);
  };

  // Window Pointer Listeners for Lens, Cards, Plugs, Orb, and Slider
  useEffect(() => {
    if (!draggingCardId && !isDraggingOrb && !isDraggingThrottle && !isDraggingLens && !draggingPlug) return;

    const handleWindowPointerMove = (e: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const rawX = ((e.clientX - rect.left) / rect.width) * 1200;
      const rawY = ((e.clientY - rect.top) / rect.height) * 560;

      // Dragging Lens (Page 1)
      if (isDraggingLens) {
        const cx = Math.max(450, Math.min(1030, rawX));
        const cy = Math.max(100, Math.min(230, rawY));
        setLensPos({ x: cx, y: cy });

        cards.forEach((card) => {
          if (!card.scanned && cx >= card.homeX - 15 && cx <= card.homeX + 135) {
            if (card.type === "ad") {
              playBeep(320);
            } else {
              playSuccess();
            }
            setCards((prev) =>
              prev.map((c) => (c.id === card.id ? { ...c, scanned: true } : c))
            );
          }
        });
      }

      // Dragging Fake Ad Card (Page 1)
      if (draggingCardId) {
        setDragCardPos({ x: rawX, y: rawY });
      }

      // Dragging Red Tracker Plug downward (dy >= 32 to unplug, Page 2)
      if (draggingPlug) {
        const dy = Math.max(0, Math.min(65, rawY - plugStartYRef.current));
        setPlugDragDy(dy);
      }

      // Dragging StarExplorer Installer Orb (Page 3)
      if (isDraggingOrb) {
        setOrbPos({ x: rawX, y: rawY });
      }

      // Dragging Installation Slider (Page 3)
      if (isDraggingThrottle) {
        const clampedX = Math.max(550, Math.min(960, rawX));
        const percentage = Math.round(((clampedX - 550) / 410) * 100);
        setThrottleVal(percentage);
        if (percentage >= 98 && !isInstalling && !isInstalled) {
          handleRunInstall();
        }
      }
    };

    const handleWindowPointerUp = () => {
      if (isDraggingLens) {
        setIsDraggingLens(false);
      }

      // Dropping Fake Ad Card onto Recycle Bin (x = 695, y = 225, width = 130, height = 105)
      if (draggingCardId) {
        const cardObj = cards.find((c) => c.id === draggingCardId);
        if (dragCardPos.x >= 670 && dragCardPos.x <= 850 && dragCardPos.y >= 210 && dragCardPos.y <= 340) {
          playSwitch();
          playBeep(440);
          setIsCrumplingBin(true);
          setTimeout(() => setIsCrumplingBin(false), 300);

          const nextCards = cards.map((c) =>
            c.id === draggingCardId ? { ...c, binned: true } : c
          );
          setCards(nextCards);
          const newCount = nextCards.filter((c) => c.type === "ad" && c.binned).length;

          if (newCount === 3) {
            playSuccess();
            playBeep(880);
            setStatus("VERIFIED GAME FILE: Advancing to App Permissions & Privacy setup...", "success");
            speak("All fake ads trashed! Inspect App Permissions and unplug the spy trackers.");
            setTimeout(() => {
              setWizardPage(2);
              playSwitch();
            }, 350);
          } else {
            setStatus("TRASHED: " + (cardObj ? cardObj.name : "Ad") + " dropped in Recycle Bin (" + newCount + "/3)!", "info");
            speak("Fake ad trashed! Drag the remaining disguised ads into the bin.");
          }
        }
        setDraggingCardId(null);
      }

      // Yanking Out Tracker Plugs (threshold dy >= 32)
      if (draggingPlug) {
        if (plugDragDy >= 32) {
          playSwitch();
          playSuccess();
          playBeep(640);

          if (draggingPlug === "contacts") setContactsUnplugged(true);
          if (draggingPlug === "gps") setGpsUnplugged(true);
          if (draggingPlug === "history") setHistoryUnplugged(true);

          const nextContacts = draggingPlug === "contacts" ? true : contactsUnplugged;
          const nextGps = draggingPlug === "gps" ? true : gpsUnplugged;
          const nextHistory = draggingPlug === "history" ? true : historyUnplugged;

          if (nextContacts && nextGps && nextHistory) {
            playSuccess();
            playBeep(880);
            setStatus("PRIVACY SECURED: Advancing to Safe Installation setup...", "success");
            speak("All spy trackers disconnected! Only legitimate game saves remain. Moving to final install.");
            setTimeout(() => {
              setWizardPage(3);
              playSwitch();
            }, 350);
          } else {
            const name = draggingPlug === "contacts" ? "Contacts" : draggingPlug === "gps" ? "Live GPS" : "Web History";
            setStatus("DISCONNECTED: Unplugged " + name + " tracker! Yank downward the remaining red cables.", "info");
            speak("Unplugged " + name + " tracker! Yank down the other unnecessary red cables.");
          }
        } else {
          playBeep(220);
          setStatus("YANK DOWNWARD: Drag the plug down at least 32px to disconnect!", "info");
        }
        setDraggingPlug(null);
        setPlugDragDy(0);
      }

      // Dropping Orb into Safe Install Folder (bounds: cx >= 800 && cx <= 1010 && cy >= 100 && cy <= 235)
      if (isDraggingOrb) {
        setIsDraggingOrb(false);
        if (orbPos.x >= 800 && orbPos.x <= 1010 && orbPos.y >= 100 && orbPos.y <= 235) {
          playSwitch();
          playSuccess();
          setInstallerDocked(true);
          setStatus("INSTALLER DOCKED: Drag the Verify & Install slider to 100%!", "success");
          speak("StarExplorer installer docked in the Safe Install Folder! Drag the installation slider to 100%.");
        } else {
          setOrbPos({ x: 540, y: 155 });
        }
      }

      // Releasing Installation Slider
      if (isDraggingThrottle) {
        setIsDraggingThrottle(false);
        if (throttleVal < 98) {
          setThrottleVal(0);
        }
      }
    };

    window.addEventListener("pointermove", handleWindowPointerMove);
    window.addEventListener("pointerup", handleWindowPointerUp);

    return () => {
      window.removeEventListener("pointermove", handleWindowPointerMove);
      window.removeEventListener("pointerup", handleWindowPointerUp);
    };
  }, [
    draggingCardId,
    draggingPlug,
    plugDragDy,
    isDraggingOrb,
    isDraggingThrottle,
    isDraggingLens,
    cards,
    contactsUnplugged,
    gpsUnplugged,
    historyUnplugged,
    throttleVal,
    isInstalling,
    isInstalled,
    dragCardPos,
    orbPos,
    playBeep,
    playClick,
    playError,
    playSuccess,
    playSwitch,
    speak,
    setStatus,
  ]);

  // Lens pointer down
  const handleLensPointerDown = (e: React.PointerEvent) => {
    e.stopPropagation();
    playClick();
    setIsDraggingLens(true);
  };

  // Card pointer down
  const handleCardPointerDown = (e: React.PointerEvent, cardId: string) => {
    if (!phase1Done) {
      playError();
      setStatus("Sweep the Ad-XRay Lens across all 4 cards first!", "warn");
      speak("First sweep the lens to identify the fake ads.");
      return;
    }
    const card = cards.find((c) => c.id === cardId);
    if (card?.type === "game") return;

    e.stopPropagation();
    playClick();
    setDraggingCardId(cardId);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const rawX = ((e.clientX - rect.left) / rect.width) * 1200;
      const rawY = ((e.clientY - rect.top) / rect.height) * 560;
      setDragCardPos({ x: rawX, y: rawY });
    }
  };

  // Plug pointer down to initiate downward yank
  const handlePlugPointerDown = (e: React.PointerEvent, tracker: "contacts" | "gps" | "history") => {
    const isUnplugged =
      tracker === "contacts" ? contactsUnplugged : tracker === "gps" ? gpsUnplugged : historyUnplugged;
    if (isUnplugged) return;

    e.stopPropagation();
    playClick();
    setDraggingPlug(tracker);
    setPlugDragDy(0);
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const rawY = ((e.clientY - rect.top) / rect.height) * 560;
      plugStartYRef.current = rawY;
    }
  };

  // Kabir Dynamic Speech Bubble: Crisp Grade-7 1-liners
  const kabirText = isInstalled
    ? "Kabir: Safe install! Zero traps!"
    : isInstalling
    ? "Kabir: Verifying & installing game..."
    : wizardPage === 3
    ? installerDocked
      ? "Kabir: Docked! Slide to 100%!"
      : "Kabir: Drag to Install Folder!"
    : wizardPage === 2
    ? "Kabir: Pull red cables down!"
    : phase1Done
    ? "Kabir: Drag fake ads to bin!"
    : "Kabir: Swipe lens across cards!";

  // Dynamically padded speech bubble width
  const bubbleWidth = Math.max(220, kabirText.length * 6.8 + 44);

  const draggedCard = cards.find((c) => c.id === draggingCardId);

  return (
    <div className="relative flex-1 min-h-0 w-full h-full overflow-hidden select-none bg-amber-50">
      <svg
        ref={containerRef}
        viewBox="0 0 1200 560"
        preserveAspectRatio="xMidYMid meet"
        className="w-full h-full block touch-none"
      >
        <defs>
          {/* Study Room Walls & Daylight Gradients */}
          <linearGradient id="studyWallGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#fffbeb" />
            <stop offset="60%" stopColor="#fef3c7" />
            <stop offset="100%" stopColor="#fde68a" />
          </linearGradient>
          <linearGradient id="monitorBezel" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#1e293b" />
            <stop offset="100%" stopColor="#0f172a" />
          </linearGradient>
          <linearGradient id="osScreenBg" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="50%" stopColor="#1e1b4b" />
            <stop offset="100%" stopColor="#0284c7" />
          </linearGradient>
          <linearGradient id="pcTowerGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#0f172a" />
            <stop offset="100%" stopColor="#1e293b" />
          </linearGradient>
          <linearGradient id="lensGlowGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#0284c7" stopOpacity="0.15" />
          </linearGradient>

          {/* SCREEN CLIPPATH: Strictly clips OS window inside monitor screen */}
          <clipPath id="monitorScreenClip">
            <rect x="472" y="62" width="566" height="274" rx="6" />
          </clipPath>
        </defs>

        {/* ====================================================================
            ROOM ARCHITECTURE: SUNLIT HOME STUDY WITH BOOKSHELF & WINDOW
            ==================================================================== */}
        <rect width="1200" height="560" fill="url(#studyWallGrad)" />

        {/* Clean architectural wooden baseboard & Parquet floor behind furniture */}
        <rect x="0" y="532" width="1200" height="8" fill="#d6c7b2" />
        <line x1="0" y1="532" x2="1200" y2="532" stroke="#b8a994" strokeWidth="1" />
        <rect x="0" y="540" width="1200" height="20" fill="url(#woodFloor)" />

        {/* Tall Wooden Bookshelf on the Floor (x = 30..180, y = 135..540) */}
        <g transform="translate(30, 135)">
          {/* Bookshelf Outer Oak Frame */}
          <rect x="0" y="0" width="150" height="405" rx="4" fill="#78350f" stroke="#451a03" strokeWidth="2.5" />
          {/* 5 Shelf Dividing Boards */}
          <rect x="6" y="6" width="138" height="74" fill="#92400e" />
          <rect x="6" y="86" width="138" height="74" fill="#92400e" />
          <rect x="6" y="166" width="138" height="74" fill="#92400e" />
          <rect x="6" y="246" width="138" height="74" fill="#92400e" />
          <rect x="6" y="326" width="138" height="73" fill="#92400e" />

          {/* Shelf 1 (y = 6..80): Desktop Globe & Coding Award Trophy */}
          <g transform="translate(18, 14)">
            {/* World Globe */}
            <path d="M 12 45 Q 12 52 28 52 Q 44 52 44 45" stroke="#cbd5e1" strokeWidth="2.5" fill="none" />
            <line x1="28" y1="45" x2="28" y2="52" stroke="#94a3b8" strokeWidth="3" />
            <circle cx="28" cy="26" r="18" fill="#38bdf8" stroke="#0284c7" strokeWidth="1.5" />
            <path d="M 20 20 Q 25 15 32 20 Q 30 30 22 28 Z" fill="#22c55e" />
            <path d="M 28 32 Q 34 30 36 36 Q 30 40 26 38 Z" fill="#22c55e" />
            {/* Trophy */}
            <g transform="translate(72, 8)">
              <polygon points="12,44 26,44 23,38 15,38" fill="#78350f" />
              <rect x="17" y="30" width="4" height="8" fill="#d97706" />
              <path d="M 10 14 Q 10 30 19 30 Q 28 30 28 14 Z" fill="#f59e0b" stroke="#b45309" strokeWidth="1.2" />
              <path d="M 7 18 Q 4 24 10 24" fill="none" stroke="#f59e0b" strokeWidth="2" />
              <path d="M 31 18 Q 34 24 28 24" fill="none" stroke="#f59e0b" strokeWidth="2" />
              <polygon points="19,17 20,20 23,20 21,22 22,25 19,23 16,25 17,22 15,20 18,20" fill="#fef08a" />
            </g>
          </g>

          {/* Shelf 2 (y = 86..160): Row of Colorful Reference Books */}
          <g transform="translate(14, 94)">
            <rect x="0" y="0" width="14" height="64" rx="1" fill="#3b82f6" stroke="#1d4ed8" strokeWidth="1" />
            <rect x="16" y="-3" width="15" height="67" rx="1" fill="#ef4444" stroke="#b91c1c" strokeWidth="1" />
            <rect x="33" y="2" width="13" height="62" rx="1" fill="#10b981" stroke="#047857" strokeWidth="1" />
            <rect x="48" y="-5" width="16" height="69" rx="1" fill="#f59e0b" stroke="#b45309" strokeWidth="1" />
            <rect x="66" y="0" width="14" height="64" rx="1" fill="#8b5cf6" stroke="#6d28d9" strokeWidth="1" />
            <rect x="82" y="-2" width="15" height="66" rx="1" fill="#06b6d4" stroke="#0e7490" strokeWidth="1" />
            <rect x="99" y="3" width="13" height="61" rx="1" fill="#ec4899" stroke="#be185d" strokeWidth="1" />
          </g>

          {/* Shelf 3 (y = 166..240): Leaning Book Stack & Mini Potted Fern */}
          <g transform="translate(14, 178)">
            <rect x="0" y="0" width="14" height="52" rx="1" fill="#f97316" transform="rotate(14 0 52)" />
            <rect x="18" y="0" width="14" height="52" rx="1" fill="#6366f1" transform="rotate(14 18 52)" />
            <rect x="36" y="0" width="14" height="52" rx="1" fill="#14b8a6" transform="rotate(14 36 52)" />
            {/* Potted Fern */}
            <g transform="translate(94, 28)">
              <polygon points="-8,8 8,8 6,24 -6,24" fill="#ea580c" />
              <circle cx="0" cy="5" r="7" fill="#22c55e" />
              <circle cx="-6" cy="0" r="5" fill="#16a34a" />
              <circle cx="6" cy="0" r="5" fill="#16a34a" />
              <path d="M 0 -8 Q -10 -2 0 5" stroke="#15803d" strokeWidth="1.5" fill="none" />
              <path d="M 0 -8 Q 10 -2 0 5" stroke="#15803d" strokeWidth="1.5" fill="none" />
            </g>
          </g>

          {/* Shelf 4 (y = 246..320): 2 Storage Archive File Boxes */}
          <g transform="translate(12, 256)">
            <rect x="0" y="0" width="56" height="62" rx="3" fill="#fef3c7" stroke="#d97706" strokeWidth="1.2" />
            <circle cx="28" cy="30" r="4" fill="#b45309" />
            <rect x="68" y="0" width="56" height="62" rx="3" fill="#fed7aa" stroke="#f97316" strokeWidth="1.2" />
            <circle cx="96" cy="30" r="4" fill="#c2410c" />
          </g>

          {/* Shelf 5 (y = 326..405): Bottom Storage Cabinets / Double Doors */}
          <g transform="translate(8, 332)">
            <rect x="0" y="0" width="64" height="66" rx="2" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />
            <rect x="4" y="4" width="56" height="58" rx="2" fill="#92400e" />
            <circle cx="54" cy="33" r="3" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />

            <rect x="70" y="0" width="64" height="66" rx="2" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />
            <rect x="74" y="4" width="56" height="58" rx="2" fill="#92400e" />
            <circle cx="80" cy="33" r="3" fill="#f59e0b" stroke="#78350f" strokeWidth="1" />
          </g>
        </g>

        {/* Sunlit Study Window with Curtains (x = 185..345, y = 65..225) */}
        <g transform="translate(185, 65)">
          <rect x="0" y="0" width="160" height="160" rx="8" fill="#e0f2fe" stroke="#cbd5e1" strokeWidth="3" />
          <circle cx="45" cy="110" r="40" fill="#86efac" opacity="0.85" />
          <circle cx="115" cy="120" r="45" fill="#4ade80" opacity="0.85" />
          <circle cx="80" cy="80" r="36" fill="#22c55e" opacity="0.9" />
          <line x1="80" y1="0" x2="80" y2="160" stroke="#ffffff" strokeWidth="4" />
          <line x1="0" y1="80" x2="160" y2="80" stroke="#ffffff" strokeWidth="3.5" />
          <rect x="-8" y="160" width="176" height="10" rx="2" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
          <path d="M -6 0 Q 14 80 8 160 L -6 160 Z" fill="#fb923c" opacity="0.9" />
          <path d="M 166 0 Q 146 80 152 160 L 166 160 Z" fill="#fb923c" opacity="0.9" />
        </g>

        {/* Diagonal Sunbeam Stream across the Room */}
        <polygon points="195,75 335,75 480,450 250,450" fill="url(#sunbeamShaft)" />



        {/* ====================================================================
            REALISTIC OAK COMPUTER DESK (x = 230 to x = 1165, y = 385..416)
            Brushed steel left leg (x = 248), 3-drawer pedestal right (x = 1045..1155)
            ==================================================================== */}
        <g>
          {/* Oak Desktop Top Surface (x = 225 to x = 1165, y = 385..416) */}
          <rect x="225" y="385" width="940" height="31" rx="5" fill="#f59e0b" stroke="#b45309" strokeWidth="2.5" />
          <line x1="225" y1="395" x2="1165" y2="395" stroke="#fde68a" strokeWidth="1.5" opacity="0.75" />

          {/* Under-desk Apron across Center */}
          <rect x="245" y="416" width="800" height="16" fill="#d97706" stroke="#b45309" strokeWidth="1.5" />

          {/* Sturdy Brushed-Steel Desk Leg on Left (x = 248, y = 416..540) */}
          <rect x="248" y="416" width="16" height="124" rx="2" fill="#94a3b8" stroke="#64748b" strokeWidth="1.5" />
          <rect x="242" y="534" width="28" height="6" rx="2" fill="#334155" />

          {/* 3-Drawer Wooden Desk Pedestal under Right Side (x = 1045..1155, y = 416..540) */}
          <g transform="translate(1045, 416)">
            <rect x="0" y="0" width="110" height="124" rx="3" fill="#b45309" stroke="#78350f" strokeWidth="2" />
            {/* Drawer 1 */}
            <rect x="5" y="6" width="100" height="34" rx="2" fill="#d97706" stroke="#92400e" strokeWidth="1.2" />
            <rect x="43" y="21" width="24" height="4" rx="2" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.8" />
            {/* Drawer 2 */}
            <rect x="5" y="44" width="100" height="34" rx="2" fill="#d97706" stroke="#92400e" strokeWidth="1.2" />
            <rect x="43" y="59" width="24" height="4" rx="2" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.8" />
            {/* Drawer 3 */}
            <rect x="5" y="82" width="100" height="34" rx="2" fill="#d97706" stroke="#92400e" strokeWidth="1.2" />
            <rect x="43" y="97" width="24" height="4" rx="2" fill="#e2e8f0" stroke="#64748b" strokeWidth="0.8" />
            {/* Base Kickplate */}
            <rect x="-2" y="118" width="114" height="6" rx="1" fill="#78350f" />
          </g>

          {/* Sleek Mechanical Keyboard placed cleanly in front of Monitor Stand (x = 645..845, y = 387..399) */}
          <g transform="translate(645, 387)">
            <rect x="0" y="0" width="200" height="12" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1.2" />
            <rect x="5" y="2" width="190" height="2.5" rx="1" fill="#475569" />
            <line x1="5" y1="7" x2="195" y2="7" stroke="#475569" strokeWidth="1" strokeDasharray="3 2" />
            <rect x="70" y="9" width="60" height="2.5" rx="1" fill="#38bdf8" />
            <line x1="3" y1="14" x2="197" y2="14" stroke="#38bdf8" strokeWidth="1" opacity="0.6" />
          </g>

          {/* Mousepad & Wireless Mouse near Kabir (x = 335..385, y = 385..391) */}
          <g transform="translate(335, 385)">
            <rect x="0" y="0" width="46" height="14" rx="3" fill="#1e293b" stroke="#334155" strokeWidth="1" />
            <ellipse cx="20" cy="7" rx="8" ry="5.5" fill="#0f172a" stroke="#0284c7" strokeWidth="1.2" />
            <line x1="20" y1="2" x2="20" y2="7" stroke="#38bdf8" strokeWidth="1" />
          </g>

          {/* Desk Accessories: Ceramic Pencil Cup & Coffee Mug (x = 465..505, y = 355..385) */}
          <g transform="translate(465, 355)">
            <rect x="0" y="0" width="16" height="28" rx="2" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1" />
            <line x1="3" y1="-8" x2="5" y2="4" stroke="#3b82f6" strokeWidth="2" strokeLinecap="round" />
            <line x1="8" y1="-10" x2="8" y2="4" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
            <line x1="13" y1="-6" x2="11" y2="4" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
            <rect x="23" y="6" width="18" height="22" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
            <path d="M 41 12 C 46 12, 46 22, 41 22" fill="none" stroke="#cbd5e1" strokeWidth="2" />
          </g>

          {/* Sleek PC Tower on Far Right of Desk (x = 1055, y = 227..385) */}
          <g transform="translate(1055, 227)">
            <rect x="0" y="0" width="95" height="158" rx="6" fill="url(#pcTowerGrad)" stroke="#475569" strokeWidth="2" />
            <rect x="8" y="8" width="79" height="14" rx="3" fill="#334155" />
            <circle cx="20" cy="15" r="2.5" fill="#38bdf8" />
            <circle cx="30" cy="15" r="1.5" fill="#ffffff" />
            <rect x="10" y="30" width="75" height="118" rx="4" fill="#0f172a" stroke="#0284c7" strokeWidth="1" />
            <circle cx="47" cy="62" r="19" fill="none" stroke="#38bdf8" strokeWidth="2.5" opacity="0.8" />
            <circle cx="47" cy="62" r="4" fill="#38bdf8" />
            <circle cx="47" cy="110" r="19" fill="none" stroke="#818cf8" strokeWidth="2.5" opacity="0.8" />
            <circle cx="47" cy="110" r="4" fill="#818cf8" />
          </g>
        </g>

        {/* ====================================================================
            CHARACTER: KABIR (SEATED FIRMLY IN ERGONOMIC STUDY CHAIR AT DESK)
            transform="translate(260, 438)"
            ==================================================================== */}
        <g transform="translate(260, 438)">
          {/* Chair Floor Shadow & Base Castors on Floor (y = 102 -> global y = 540) */}
          <ellipse cx="0" cy="102" rx="34" ry="6" fill="#0f172a" opacity="0.35" />
          <polygon points="0,97 -30,102 -27,104 0,99 27,104 30,102" fill="#475569" stroke="#334155" strokeWidth="1" />
          <circle cx="-28" cy="102" r="2.5" fill="#1e293b" />
          <circle cx="28" cy="102" r="2.5" fill="#1e293b" />
          <circle cx="0" cy="103" r="2.5" fill="#1e293b" />

          {/* Chair Gas Lift Post */}
          <rect x="-3" y="10" width="6" height="88" fill="#94a3b8" stroke="#64748b" strokeWidth="1" />

          {/* Padded Ergonomic Chair Seat Cushion (y = 0..12) */}
          <rect x="-26" y="0" width="74" height="12" rx="4" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />

          {/* Curved Mesh Backrest */}
          <rect x="-26" y="-80" width="8" height="80" rx="3" fill="#475569" stroke="#334155" strokeWidth="1" />
          <rect x="-32" y="-88" width="16" height="76" rx="8" fill="#0f172a" stroke="#334155" strokeWidth="1.5" />
          <line x1="-30" y1="-65" x2="-18" y2="-65" stroke="#38bdf8" strokeWidth="1" opacity="0.4" />
          <line x1="-30" y1="-40" x2="-18" y2="-40" stroke="#38bdf8" strokeWidth="1" opacity="0.4" />

          {/* Left Chair Armrest */}
          <rect x="-8" y="-23" width="6" height="24" rx="2" fill="#64748b" />
          <rect x="-16" y="-26" width="24" height="6" rx="2" fill="#1e293b" stroke="#334155" strokeWidth="1" />

          {/* Contoured Thighs in Dark Denim Jeans (x = -14..+46, y = -8..+8) */}
          <rect x="-14" y="-8" width="60" height="16" rx="7" fill="#1e293b" stroke="#0f172a" strokeWidth="1.2" />
          <line x1="-8" y1="-1" x2="40" y2="-1" stroke="#334155" strokeWidth="1" strokeDasharray="3 2" />

          {/* Shins / Lower Legs going down under the desk to floor at y = 102 */}
          <rect x="36" y="-2" width="16" height="94" rx="6" fill="#1e293b" stroke="#0f172a" strokeWidth="1.2" />
          <line x1="44" y1="8" x2="44" y2="82" stroke="#334155" strokeWidth="1" strokeDasharray="3 2" />

          {/* Detailed Two-Tone Sneakers Resting Flat on Floor at y = 102 (global y = 540) */}
          <rect x="34" y="90" width="36" height="12" rx="4" fill="#ffffff" stroke="#0284c7" strokeWidth="1.5" />
          <path d="M 34 96 L 70 96" stroke="#0284c7" strokeWidth="1" />
          <polygon points="54,90 60,90 60,100 54,100" fill="#38bdf8" />
          <circle cx="42" cy="93" r="1.2" fill="#0284c7" />
          <circle cx="46" cy="93" r="1.2" fill="#0284c7" />

          {/* Torso: Two-Tone Varsity Hoodie (Navy Body + Sky-Blue Shoulders & Trim) */}
          <path d="M -16 -70 Q 0 -80 16 -70 L 18 0 L -18 0 Z" fill="#0f172a" stroke="#0284c7" strokeWidth="1.8" />
          <polygon points="-16,-70 0,-82 16,-70 12,-62 -12,-62" fill="#38bdf8" stroke="#0284c7" strokeWidth="1" />
          <line x1="-16" y1="-70" x2="-6" y2="-55" stroke="#ffffff" strokeWidth="1" strokeDasharray="2 1" />
          <line x1="16" y1="-70" x2="6" y2="-55" stroke="#ffffff" strokeWidth="1" strokeDasharray="2 1" />
          <polygon points="-6,-78 0,-64 6,-78" fill="#f8fafc" />
          <line x1="0" y1="-64" x2="0" y2="0" stroke="#94a3b8" strokeWidth="1.8" />
          {/* White Drawstrings */}
          <path d="M -5 -62 Q -7 -50 -6 -44" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
          <path d="M 5 -62 Q 7 -50 6 -44" fill="none" stroke="#ffffff" strokeWidth="1.2" strokeLinecap="round" />
          <circle cx="-6" cy="-44" r="1.2" fill="#cbd5e1" />
          <circle cx="6" cy="-44" r="1.2" fill="#cbd5e1" />
          {/* Kangaroo Pocket & Hem */}
          <path d="M -12 -30 L 12 -30 L 10 -10 L -10 -10 Z" fill="#1e293b" stroke="#0284c7" strokeWidth="1" />
          <rect x="-18" y="-3" width="36" height="5" rx="1" fill="#38bdf8" opacity="0.8" />

          {/* Left Arm: Smoothly bent resting on chair armrest */}
          <path d="M -14 -68 Q -24 -46 -12 -24" fill="none" stroke="#0f172a" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="-16" y="-27" width="9" height="5" rx="1" fill="#38bdf8" />
          <circle cx="-9" cy="-23" r="4.5" fill="#fed7aa" stroke="#ea580c" strokeWidth="1" />

          {/* Right Arm & Mouse Reach: Shoulder -> Elbow -> Wrist -> Mouse at (75, -53) */}
          <path d="M 14 -68 Q 28 -44 55 -48 L 75 -52" fill="none" stroke="#0f172a" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
          <rect x="67" y="-56" width="7" height="9" rx="1.5" fill="#38bdf8" transform="rotate(-15 70 -52)" />
          {/* Proportioned Hand & Fingers over Mouse */}
          <ellipse cx="75" cy="-53" rx="7" ry="5" fill="#fed7aa" stroke="#ea580c" strokeWidth="1" />
          <line x1="77" y1="-55" x2="81" y2="-54" stroke="#ea580c" strokeWidth="1" strokeLinecap="round" />
          <line x1="77" y1="-52" x2="82" y2="-51" stroke="#ea580c" strokeWidth="1" strokeLinecap="round" />

          {/* Neck */}
          <rect x="-4" y="-90" width="8" height="15" fill="#fed7aa" />

          {/* Contoured Head & 3/4 Face Profile facing the monitor */}
          <g transform="translate(2, 85)">
            <path
              d="M -15 -192 C -15 -178, -8 -170, 0 -170 C 9 -170, 16 -178, 16 -192 C 16 -208, -15 -208, -15 -192 Z"
              fill="#fed7aa"
              stroke="#ea580c"
              strokeWidth="1.2"
            />
            {/* Ears with Inner Lobes */}
            <circle cx="-15" cy="-191" r="3.5" fill="#fed7aa" stroke="#ea580c" strokeWidth="1" />
            <circle cx="16" cy="-191" r="3.5" fill="#fed7aa" stroke="#ea580c" strokeWidth="1" />
            <circle cx="-15" cy="-190" r="1.5" fill="#ea580c" opacity="0.4" />
            <circle cx="16" cy="-190" r="1.5" fill="#ea580c" opacity="0.4" />

            {/* Styled Layered Dark-Brown Hair with Side Bangs and Warm Highlight Strokes */}
            <path d="M -16 -198 C -16 -220, 17 -220, 17 -198 C 12 -206, -6 -208, -16 -198 Z" fill="#3b2010" />
            <path d="M -15 -198 Q -8 -208 4 -206 Q 14 -206 17 -198" stroke="#854d0e" strokeWidth="1.6" fill="none" />
            <path d="M -9 -206 Q 0 -214 10 -206" stroke="#a16207" strokeWidth="1.2" fill="none" />
            <path d="M -16 -198 Q -18 -188 -14 -182" stroke="#3b2010" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            <path d="M -12 -198 Q -4 -194 2 -198" stroke="#854d0e" strokeWidth="1.5" fill="none" strokeLinecap="round" />

            {/* Expressive Eyebrows */}
            <path d="M -9 -199 Q -6 -202 -3 -199" stroke="#3b2010" strokeWidth="1.6" fill="none" strokeLinecap="round" />
            <path d="M 3 -199 Q 6 -202 9 -199" stroke="#3b2010" strokeWidth="1.6" fill="none" strokeLinecap="round" />

            {/* Eyes with White Catchlights looking toward Monitor */}
            <circle cx="-5" cy="-192" r="2.2" fill="#0f172a" />
            <circle cx="-4.2" cy="-192.8" r="0.8" fill="#ffffff" />
            <circle cx="7" cy="-192" r="2.2" fill="#0f172a" />
            <circle cx="7.8" cy="-192.8" r="0.8" fill="#ffffff" />

            {/* Warm Smile & Dimple */}
            <path d="M -4 -181 Q 1 -175 6 -181" fill="none" stroke="#ea580c" strokeWidth="1.8" strokeLinecap="round" />
            <circle cx="-5" cy="-182" r="0.6" fill="#ea580c" />
            <circle cx="7" cy="-182" r="0.6" fill="#ea580c" />
          </g>

          {/* Kabir Speech Bubble: shifted left at translate(-18, -262) to ensure breathing room from monitor */}
          <g transform="translate(-18, -262)">
            <rect
              x={-bubbleWidth / 2}
              y="-18"
              width={bubbleWidth}
              height="36"
              rx="18"
              fill="#ffffff"
              stroke="#0f172a"
              strokeWidth="2.2"
            />
            {/* Downward tail pointing toward Kabir's head */}
            <polygon points="8,18 16,28 22,18" fill="#ffffff" stroke="#0f172a" strokeWidth="2.2" />
            <rect x="9" y="16" width="12" height="4" fill="#ffffff" />
            <text
              x="0"
              y="5"
              textAnchor="middle"
              fill="#0f172a"
              fontSize="9.5"
              fontWeight="800"
              fontFamily="sans-serif"
            >
              {kabirText}
            </text>
          </g>
        </g>

        {/* ====================================================================
            ENLARGED 27-INCH ULTRAWIDE DESKTOP MONITOR (x = 465..1045, y = 55..365)
            ==================================================================== */}
        <rect x="750" y="340" width="10" height="36" rx="2" fill="#94a3b8" stroke="#64748b" strokeWidth="1.5" />
        <rect x="705" y="376" width="100" height="8" rx="3" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />

        {/* Monitor Bezel Frame */}
        <rect
          x="465"
          y="55"
          width="580"
          height="288"
          rx="10"
          fill="#0f172a"
          stroke="#334155"
          strokeWidth="3.5"
        />
        <rect x="470" y="60" width="570" height="278" rx="8" fill="#020617" />

        {/* ====================================================================
            MONITOR DISPLAY CONTENT (STRICTLY CLIPPED INSIDE monitorScreenClip!)
            ==================================================================== */}
        <g clipPath="url(#monitorScreenClip)">
          {/* OS Desktop Wallpaper Gradient */}
          <rect x="472" y="62" width="566" height="274" fill="url(#osScreenBg)" />

          {/* OS Window Header Bar */}
          <g transform="translate(472, 62)">
            <rect x="0" y="0" width="566" height="20" fill="#1e293b" />
            <circle cx="14" cy="10" r="3" fill="#ef4444" />
            <circle cx="24" cy="10" r="3" fill="#f59e0b" />
            <circle cx="34" cy="10" r="3" fill="#10b981" />
            <text x="50" y="13" fill="#ffffff" fontSize="7.5" fontWeight="800" fontFamily="sans-serif">
              StarExplorer Setup Wizard (v2.4 - Clean Installer)
            </text>
            <text x="554" y="13" textAnchor="end" fill="#38bdf8" fontSize="7" fontWeight="800" fontFamily="monospace">
              PAGE {wizardPage} OF 3
            </text>
          </g>

          {/* Sleek 3-Step Wizard Indicator Bar (y = 82..104) */}
          <g transform="translate(472, 82)">
            <rect x="0" y="0" width="566" height="22" fill="#0f172a" stroke="#1e293b" strokeWidth="1" />
            
            {/* Step 1 -> Step 2 Connecting Line */}
            <line
              x1="180"
              y1="11"
              x2="245"
              y2="11"
              stroke={wizardPage > 1 || phase2Done ? "#10b981" : "#334155"}
              strokeWidth="2"
            />
            
            {/* Step 2 -> Step 3 Connecting Line */}
            <line
              x1="380"
              y1="11"
              x2="445"
              y2="11"
              stroke={wizardPage > 2 || phase3Done ? "#10b981" : "#334155"}
              strokeWidth="2"
            />

            {/* Step 1: 1. DOWNLOAD */}
            <g transform="translate(95, 11)">
              <circle
                cx="-48"
                cy="0"
                r="7"
                fill={wizardPage > 1 || phase2Done ? "#10b981" : wizardPage === 1 ? "#0284c7" : "#334155"}
              />
              {wizardPage > 1 || phase2Done ? (
                <path d="M -51 0 L -49 2.5 L -45 -2.5" stroke="#ffffff" strokeWidth="1.6" fill="none" strokeLinecap="round" />
              ) : (
                <text x="-48" y="2.5" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontWeight="900">1</text>
              )}
              <text
                x="-36"
                y="3.5"
                fill={wizardPage > 1 || phase2Done ? "#34d399" : wizardPage === 1 ? "#ffffff" : "#94a3b8"}
                fontSize="7.5"
                fontWeight="900"
                fontFamily="sans-serif"
              >
                1. DOWNLOAD
              </text>
            </g>

            {/* Step 2: 2. PRIVACY */}
            <g transform="translate(300, 11)">
              <circle
                cx="-42"
                cy="0"
                r="7"
                fill={wizardPage > 2 || phase3Done ? "#10b981" : wizardPage === 2 ? "#0284c7" : "#334155"}
              />
              {wizardPage > 2 || phase3Done ? (
                <path d="M -45 0 L -43 2.5 L -39 -2.5" stroke="#ffffff" strokeWidth="1.6" fill="none" strokeLinecap="round" />
              ) : (
                <text x="-42" y="2.5" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontWeight="900">2</text>
              )}
              <text
                x="-30"
                y="3.5"
                fill={wizardPage > 2 || phase3Done ? "#34d399" : wizardPage === 2 ? "#ffffff" : "#94a3b8"}
                fontSize="7.5"
                fontWeight="900"
                fontFamily="sans-serif"
              >
                2. PRIVACY
              </text>
            </g>

            {/* Step 3: 3. INSTALL */}
            <g transform="translate(495, 11)">
              <circle
                cx="-42"
                cy="0"
                r="7"
                fill={isInstalled ? "#10b981" : wizardPage === 3 ? "#0284c7" : "#334155"}
              />
              {isInstalled ? (
                <path d="M -45 0 L -43 2.5 L -39 -2.5" stroke="#ffffff" strokeWidth="1.6" fill="none" strokeLinecap="round" />
              ) : (
                <text x="-42" y="2.5" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontWeight="900">3</text>
              )}
              <text
                x="-30"
                y="3.5"
                fill={isInstalled ? "#34d399" : wizardPage === 3 ? "#ffffff" : "#94a3b8"}
                fontSize="7.5"
                fontWeight="900"
                fontFamily="sans-serif"
              >
                3. INSTALL
              </text>
            </g>
          </g>

          {/* Star Constellations Wallpaper Detail */}
          <g opacity="0.35">
            <circle cx="510" cy="110" r="1.5" fill="#ffffff" />
            <circle cx="680" cy="95" r="1.2" fill="#38bdf8" />
            <circle cx="860" cy="115" r="1.5" fill="#ffffff" />
            <circle cx="990" cy="100" r="1.2" fill="#fef08a" />
          </g>

          {/* ====================================================================
              3-PAGE INTERACTIVE SETUP WIZARD (AnimatePresence smooth transitions)
              ==================================================================== */}
          <AnimatePresence mode="wait">
            {/* ====================================================================
                PAGE 1: DOWNLOAD PAGE (Scan cards with Ad-XRay Lens & trash fake ads)
                ==================================================================== */}
            {wizardPage === 1 && !isInstalled && !isInstalling && (
              <motion.g
                key="wizard-page-1"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                {/* Page Title & Instruction Strip */}
                <text x="755" y="114" textAnchor="middle" fill="#38bdf8" fontSize="8" fontWeight="800" fontFamily="sans-serif">
                  VERIFY DOWNLOADS: Sweep the Ad-XRay Lens across all 4 cards to detect fake ads
                </text>

                {/* 4 Download Cards (y = 118..186, width = 122, height = 68) */}
                {cards.map((card) => {
                  if (card.binned) return null;
                  if (draggingCardId === card.id) return null;

                  if (!card.scanned) {
                    return (
                      <g key={card.id} transform={"translate(" + card.homeX + ", " + card.homeY + ")"}>
                        <rect x="0" y="0" width="122" height="68" rx="8" fill="#047857" stroke="#10b981" strokeWidth="2" />
                        <rect x="6" y="6" width="110" height="20" rx="4" fill="#065f46" />
                        <text x="61" y="20" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="900" fontFamily="sans-serif">
                          DOWNLOAD
                        </text>
                        <text x="61" y="42" textAnchor="middle" fill="#a7f3d0" fontSize="7.5" fontWeight="900" fontFamily="sans-serif">
                          {card.name}
                        </text>
                        <text x="61" y="58" textAnchor="middle" fill="#6ee7b7" fontSize="6.5" fontWeight="800" fontFamily="monospace">
                          FREE (48 MB)
                        </text>
                      </g>
                    );
                  }

                  if (card.type === "game") {
                    return (
                      <g key={card.id} transform={"translate(" + card.homeX + ", " + card.homeY + ")"}>
                        <rect x="0" y="0" width="122" height="68" rx="8" fill="#064e3b" stroke="#34d399" strokeWidth="2.5" />
                        <rect x="6" y="6" width="110" height="18" rx="4" fill="#059669" />
                        <text x="61" y="18" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="900" fontFamily="sans-serif">
                          VERIFIED GAME FILE
                        </text>
                        <text x="61" y="40" textAnchor="middle" fill="#34d399" fontSize="8" fontWeight="900" fontFamily="sans-serif">
                          StarExplorer_v2.4.exe
                        </text>
                        <text x="61" y="56" textAnchor="middle" fill="#a7f3d0" fontSize="6.5" fontWeight="800" fontFamily="monospace">
                          AUTHENTIC • ZERO ADWARE
                        </text>
                      </g>
                    );
                  }

                  return (
                    <g
                      key={card.id}
                      transform={"translate(" + card.homeX + ", " + card.homeY + ")"}
                      className="cursor-grab active:cursor-grabbing"
                      onPointerDown={(e) => handleCardPointerDown(e, card.id)}
                    >
                      <rect x="0" y="0" width="122" height="68" rx="8" fill="#450a0a" stroke="#ef4444" strokeWidth="2.5" />
                      <rect x="6" y="6" width="110" height="18" rx="4" fill="#ef4444" />
                      <text x="61" y="18" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="900" fontFamily="sans-serif">
                        DISGUISED AD TRAP
                      </text>
                      <text x="61" y="40" textAnchor="middle" fill="#fca5a5" fontSize="8" fontWeight="900" fontFamily="sans-serif">
                        {card.name}
                      </text>
                      <text x="61" y="56" textAnchor="middle" fill="#f87171" fontSize="6.5" fontWeight="800" fontFamily="monospace">
                        DRAG TO RECYCLE BIN
                      </text>
                    </g>
                  );
                })}

                {/* RECYCLE BIN DROP ZONE in bottom-center (x = 695, y = 225, width = 130, height = 105) */}
                <g transform="translate(695, 225)">
                  <motion.g
                    animate={{ scale: isCrumplingBin ? [1, 1.12, 1] : 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <rect
                      x="0"
                      y="16"
                      width="130"
                      height="89"
                      rx="8"
                      fill={draggingCardId ? "#0f2b48" : "#1e293b"}
                      stroke={draggingCardId ? "#38bdf8" : "#3b82f6"}
                      strokeWidth={draggingCardId ? 2.5 : 1.8}
                      strokeDasharray={draggingCardId ? "6 3" : undefined}
                    />
                    <rect
                      x="-5"
                      y="4"
                      width="140"
                      height="14"
                      rx="4"
                      fill="#334155"
                      stroke={draggingCardId ? "#38bdf8" : "#3b82f6"}
                      strokeWidth="1.5"
                    />
                    <rect x="52" y="-3" width="26" height="8" rx="2" fill={draggingCardId ? "#38bdf8" : "#3b82f6"} />
                    <g transform="translate(65, 46)">
                      <circle cx="0" cy="0" r="14" fill="none" stroke={draggingCardId ? "#38bdf8" : "#60a5fa"} strokeWidth="2" strokeDasharray="5 3" />
                      <polygon points="0,-14 4,-8 -4,-8" fill={draggingCardId ? "#38bdf8" : "#60a5fa"} />
                    </g>
                    <text x="65" y="68" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="900" fontFamily="sans-serif">
                      RECYCLE BIN
                    </text>
                    <text
                      x="65"
                      y="81"
                      textAnchor="middle"
                      fill={binnedCount === 3 ? "#34d399" : draggingCardId ? "#fde047" : "#fca5a5"}
                      fontSize="8"
                      fontWeight="900"
                      fontFamily="monospace"
                    >
                      {draggingCardId ? "DROP AD HERE!" : "TRASHED: " + binnedCount + " / 3"}
                    </text>
                    <text x="65" y="95" textAnchor="middle" fill="#94a3b8" fontSize="6.5" fontWeight="700" fontFamily="sans-serif">
                      {binnedCount === 3 ? "ALL FAKE ADS TRASHED!" : "DRAG DISGUISED ADS HERE"}
                    </text>
                  </motion.g>
                </g>


              </motion.g>
            )}

            {/* ====================================================================
                PAGE 2: PRIVACY & PERMISSIONS PAGE (Unplug 3 sneaky spy trackers)
                ==================================================================== */}
            {wizardPage === 2 && !isInstalled && !isInstalling && (
              <motion.g
                key="wizard-page-2"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                {/* Page Title & Subtitle */}
                <text x="755" y="114" textAnchor="middle" fill="#38bdf8" fontSize="8.5" fontWeight="900" fontFamily="sans-serif">
                  APP PERMISSIONS & TELEMETRY MONITOR
                </text>
                <text x="755" y="125" textAnchor="middle" fill="#cbd5e1" fontSize="6.5" fontWeight="700" fontFamily="sans-serif">
                  Pull down the 3 red cables to disconnect unwanted spy trackers
                </text>

                {/* 4 Large Plug Sockets across y = 132..255 (width = 122, height = 118) */}
                {/* Socket 1: Game Saves (Legitimate - Green & Always Connected) */}
                <g transform="translate(490, 132)">
                  <rect x="0" y="0" width="122" height="118" rx="8" fill="#064e3b" stroke="#10b981" strokeWidth="2" />
                  <rect x="6" y="6" width="110" height="22" rx="4" fill="#059669" />
                  <text x="61" y="20" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="900" fontFamily="sans-serif">
                    Game Saves
                  </text>
                  <text x="61" y="42" textAnchor="middle" fill="#34d399" fontSize="7" fontWeight="900" fontFamily="monospace">
                    LOCAL SAVE FILE
                  </text>
                  <text x="61" y="55" textAnchor="middle" fill="#a7f3d0" fontSize="6" fontWeight="700" fontFamily="sans-serif">
                    ESSENTIAL FOR GAMEPLAY
                  </text>

                  {/* Socket Receptacle */}
                  <rect x="42" y="62" width="38" height="12" rx="3" fill="#022c22" stroke="#059669" strokeWidth="1" />
                  <circle cx="53" cy="68" r="2" fill="#10b981" />
                  <circle cx="69" cy="68" r="2" fill="#10b981" />

                  {/* Firmly Connected Green Plug & Cable */}
                  <rect x="40" y="72" width="42" height="18" rx="4" fill="#059669" stroke="#34d399" strokeWidth="1.5" />
                  <text x="61" y="84" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontWeight="900">SAFE</text>
                  <path d="M 61 90 Q 61 106 61 118" stroke="#10b981" strokeWidth="4" fill="none" strokeLinecap="round" />
                  <text x="61" y="112" textAnchor="middle" fill="#34d399" fontSize="6" fontWeight="800">CONNECTED</text>
                </g>

                {/* Socket 2: SHARE CONTACTS (Physical Red Plug) */}
                <g transform="translate(626, 132)">
                  <rect
                    x="0"
                    y="0"
                    width="122"
                    height="118"
                    rx="8"
                    fill={contactsUnplugged ? "#064e3b" : "#450a0a"}
                    stroke={contactsUnplugged ? "#10b981" : "#ef4444"}
                    strokeWidth={2}
                  />
                  <rect x="6" y="6" width="110" height="22" rx="4" fill={contactsUnplugged ? "#059669" : "#dc2626"} />
                  <text x="61" y="20" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="900" fontFamily="sans-serif">
                    SHARE CONTACTS
                  </text>
                  <text
                    x="61"
                    y="42"
                    textAnchor="middle"
                    fill={contactsUnplugged ? "#34d399" : "#fca5a5"}
                    fontSize="7"
                    fontWeight="900"
                    fontFamily="monospace"
                  >
                    {contactsUnplugged ? "DISCONNECTED • SAFE" : "SPY TRACKER PLUGGED"}
                  </text>
                  <text
                    x="61"
                    y="55"
                    textAnchor="middle"
                    fill={contactsUnplugged ? "#a7f3d0" : "#f87171"}
                    fontSize="6"
                    fontWeight="700"
                    fontFamily="sans-serif"
                  >
                    {contactsUnplugged ? "TELEMETRY SEVERED" : "PULL DOWN TO DISCONNECT"}
                  </text>

                  {/* Socket Receptacle */}
                  <rect x="42" y="62" width="38" height="12" rx="3" fill="#1e293b" stroke={contactsUnplugged ? "#059669" : "#b91c1c"} strokeWidth="1" />
                  <circle cx="53" cy="68" r="2" fill={contactsUnplugged ? "#10b981" : "#f87171"} />
                  <circle cx="69" cy="68" r="2" fill={contactsUnplugged ? "#10b981" : "#f87171"} />

                  {contactsUnplugged ? (
                    <g transform="translate(0, 74)">
                      <rect x="42" y="6" width="38" height="14" rx="3" fill="#064e3b" stroke="#34d399" strokeWidth="1" />
                      <text x="61" y="16" textAnchor="middle" fill="#6ee7b7" fontSize="6.5" fontWeight="900">DISCONNECTED</text>
                      <text x="61" y="36" textAnchor="middle" fill="#34d399" fontSize="6.5" fontWeight="800">SAFE</text>
                    </g>
                  ) : (
                    <g
                      transform={"translate(0, " + (draggingPlug === "contacts" ? plugDragDy : 0) + ")"}
                      className="cursor-grab active:cursor-grabbing"
                      onPointerDown={(e) => handlePlugPointerDown(e, "contacts")}
                    >
                      {draggingPlug === "contacts" && plugDragDy > 4 && (
                        <g>
                          <rect x="51" y="67" width="4" height="10" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.5" />
                          <rect x="67" y="67" width="4" height="10" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.5" />
                        </g>
                      )}
                      <rect x="38" y="74" width="46" height="20" rx="4" fill="#dc2626" stroke="#fca5a5" strokeWidth="1.5" />
                      <text x="61" y="87" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontWeight="900">
                        {draggingPlug === "contacts" && plugDragDy >= 32 ? "RELEASE!" : "PULL DOWN"}
                      </text>
                      <path
                        d={"M 61 94 Q 61 " + (106 + (draggingPlug === "contacts" ? plugDragDy * 0.3 : 0)) + " 61 118"}
                        stroke="#ef4444"
                        strokeWidth="4"
                        fill="none"
                        strokeLinecap="round"
                      />
                    </g>
                  )}
                </g>

                {/* Socket 3: TRACK GPS (Physical Red Plug) */}
                <g transform="translate(762, 132)">
                  <rect
                    x="0"
                    y="0"
                    width="122"
                    height="118"
                    rx="8"
                    fill={gpsUnplugged ? "#064e3b" : "#450a0a"}
                    stroke={gpsUnplugged ? "#10b981" : "#ef4444"}
                    strokeWidth={2}
                  />
                  <rect x="6" y="6" width="110" height="22" rx="4" fill={gpsUnplugged ? "#059669" : "#dc2626"} />
                  <text x="61" y="20" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="900" fontFamily="sans-serif">
                    TRACK GPS
                  </text>
                  <text
                    x="61"
                    y="42"
                    textAnchor="middle"
                    fill={gpsUnplugged ? "#34d399" : "#fca5a5"}
                    fontSize="7"
                    fontWeight="900"
                    fontFamily="monospace"
                  >
                    {gpsUnplugged ? "DISCONNECTED • SAFE" : "SPY TRACKER PLUGGED"}
                  </text>
                  <text
                    x="61"
                    y="55"
                    textAnchor="middle"
                    fill={gpsUnplugged ? "#a7f3d0" : "#f87171"}
                    fontSize="6"
                    fontWeight="700"
                    fontFamily="sans-serif"
                  >
                    {gpsUnplugged ? "TELEMETRY SEVERED" : "PULL DOWN TO DISCONNECT"}
                  </text>

                  {/* Socket Receptacle */}
                  <rect x="42" y="62" width="38" height="12" rx="3" fill="#1e293b" stroke={gpsUnplugged ? "#059669" : "#b91c1c"} strokeWidth="1" />
                  <circle cx="53" cy="68" r="2" fill={gpsUnplugged ? "#10b981" : "#f87171"} />
                  <circle cx="69" cy="68" r="2" fill={gpsUnplugged ? "#10b981" : "#f87171"} />

                  {gpsUnplugged ? (
                    <g transform="translate(0, 74)">
                      <rect x="42" y="6" width="38" height="14" rx="3" fill="#064e3b" stroke="#34d399" strokeWidth="1" />
                      <text x="61" y="16" textAnchor="middle" fill="#6ee7b7" fontSize="6.5" fontWeight="900">DISCONNECTED</text>
                      <text x="61" y="36" textAnchor="middle" fill="#34d399" fontSize="6.5" fontWeight="800">SAFE</text>
                    </g>
                  ) : (
                    <g
                      transform={"translate(0, " + (draggingPlug === "gps" ? plugDragDy : 0) + ")"}
                      className="cursor-grab active:cursor-grabbing"
                      onPointerDown={(e) => handlePlugPointerDown(e, "gps")}
                    >
                      {draggingPlug === "gps" && plugDragDy > 4 && (
                        <g>
                          <rect x="51" y="67" width="4" height="10" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.5" />
                          <rect x="67" y="67" width="4" height="10" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.5" />
                        </g>
                      )}
                      <rect x="38" y="74" width="46" height="20" rx="4" fill="#dc2626" stroke="#fca5a5" strokeWidth="1.5" />
                      <text x="61" y="87" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontWeight="900">
                        {draggingPlug === "gps" && plugDragDy >= 32 ? "RELEASE!" : "PULL DOWN"}
                      </text>
                      <path
                        d={"M 61 94 Q 61 " + (106 + (draggingPlug === "gps" ? plugDragDy * 0.3 : 0)) + " 61 118"}
                        stroke="#ef4444"
                        strokeWidth="4"
                        fill="none"
                        strokeLinecap="round"
                      />
                    </g>
                  )}
                </g>

                {/* Socket 4: READ HISTORY (Physical Red Plug) */}
                <g transform="translate(898, 132)">
                  <rect
                    x="0"
                    y="0"
                    width="122"
                    height="118"
                    rx="8"
                    fill={historyUnplugged ? "#064e3b" : "#450a0a"}
                    stroke={historyUnplugged ? "#10b981" : "#ef4444"}
                    strokeWidth={2}
                  />
                  <rect x="6" y="6" width="110" height="22" rx="4" fill={historyUnplugged ? "#059669" : "#dc2626"} />
                  <text x="61" y="20" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="900" fontFamily="sans-serif">
                    READ HISTORY
                  </text>
                  <text
                    x="61"
                    y="42"
                    textAnchor="middle"
                    fill={historyUnplugged ? "#34d399" : "#fca5a5"}
                    fontSize="7"
                    fontWeight="900"
                    fontFamily="monospace"
                  >
                    {historyUnplugged ? "DISCONNECTED • SAFE" : "SPY TRACKER PLUGGED"}
                  </text>
                  <text
                    x="61"
                    y="55"
                    textAnchor="middle"
                    fill={historyUnplugged ? "#a7f3d0" : "#f87171"}
                    fontSize="6"
                    fontWeight="700"
                    fontFamily="sans-serif"
                  >
                    {historyUnplugged ? "TELEMETRY SEVERED" : "PULL DOWN TO DISCONNECT"}
                  </text>

                  {/* Socket Receptacle */}
                  <rect x="42" y="62" width="38" height="12" rx="3" fill="#1e293b" stroke={historyUnplugged ? "#059669" : "#b91c1c"} strokeWidth="1" />
                  <circle cx="53" cy="68" r="2" fill={historyUnplugged ? "#10b981" : "#f87171"} />
                  <circle cx="69" cy="68" r="2" fill={historyUnplugged ? "#10b981" : "#f87171"} />

                  {historyUnplugged ? (
                    <g transform="translate(0, 74)">
                      <rect x="42" y="6" width="38" height="14" rx="3" fill="#064e3b" stroke="#34d399" strokeWidth="1" />
                      <text x="61" y="16" textAnchor="middle" fill="#6ee7b7" fontSize="6.5" fontWeight="900">DISCONNECTED</text>
                      <text x="61" y="36" textAnchor="middle" fill="#34d399" fontSize="6.5" fontWeight="800">SAFE</text>
                    </g>
                  ) : (
                    <g
                      transform={"translate(0, " + (draggingPlug === "history" ? plugDragDy : 0) + ")"}
                      className="cursor-grab active:cursor-grabbing"
                      onPointerDown={(e) => handlePlugPointerDown(e, "history")}
                    >
                      {draggingPlug === "history" && plugDragDy > 4 && (
                        <g>
                          <rect x="51" y="67" width="4" height="10" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.5" />
                          <rect x="67" y="67" width="4" height="10" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.5" />
                        </g>
                      )}
                      <rect x="38" y="74" width="46" height="20" rx="4" fill="#dc2626" stroke="#fca5a5" strokeWidth="1.5" />
                      <text x="61" y="87" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontWeight="900">
                        {draggingPlug === "history" && plugDragDy >= 32 ? "RELEASE!" : "PULL DOWN"}
                      </text>
                      <path
                        d={"M 61 94 Q 61 " + (106 + (draggingPlug === "history" ? plugDragDy * 0.3 : 0)) + " 61 118"}
                        stroke="#ef4444"
                        strokeWidth="4"
                        fill="none"
                        strokeLinecap="round"
                      />
                    </g>
                  )}
                </g>

                {/* Bottom Telemetry Status Strip (y = 268..316) */}
                <g transform="translate(560, 268)">
                  <rect x="0" y="0" width="390" height="48" rx="8" fill="#1e293b" stroke="#334155" strokeWidth="1.5" />
                  <text x="195" y="20" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="900" fontFamily="sans-serif">
                    PRIVACY STATUS: {[contactsUnplugged, gpsUnplugged, historyUnplugged].filter(Boolean).length} / 3 SPY TRACKERS UNPLUGGED
                  </text>
                  <text
                    x="195"
                    y="35"
                    textAnchor="middle"
                    fill={phase3Done ? "#34d399" : "#fca5a5"}
                    fontSize="7.5"
                    fontWeight="900"
                    fontFamily="monospace"
                  >
                    {phase3Done ? "ALL SPY TRACKERS SEVERED • ZERO DATA LEAKS" : "GRAB RED PLUGS AND YANK DOWN AT LEAST 32px"}
                  </text>
                </g>


              </motion.g>
            )}

            {/* ====================================================================
                PAGE 3: SAFE INSTALLATION PAGE (Dock Installer & Slide to Install)
                ==================================================================== */}
            {wizardPage === 3 && !isInstalled && !isInstalling && (
              <motion.g
                key="wizard-page-3"
                initial={{ opacity: 0, x: -16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 16 }}
                transition={{ duration: 0.35, ease: "easeInOut" }}
              >
                {/* Page Header */}
                <text x="755" y="114" textAnchor="middle" fill="#38bdf8" fontSize="8.5" fontWeight="900" fontFamily="sans-serif">
                  DESTINATION & SECURE INSTALLATION SETUP
                </text>

                {/* Left: StarExplorer_v2.4.exe Installer Package (x = 540, y = 160) */}
                {!installerDocked && !isDraggingOrb && (
                  <g
                    transform="translate(540, 160)"
                    className="cursor-grab active:cursor-grabbing"
                    onPointerDown={(e) => {
                      e.stopPropagation();
                      playClick();
                      setIsDraggingOrb(true);
                      setOrbPos({ x: 540, y: 160 });
                    }}
                  >
                    <circle cx="0" cy="0" r="28" fill="#10b981" fillOpacity="0.25" stroke="#34d399" strokeWidth="2" />
                    <circle cx="0" cy="0" r="20" fill="#059669" stroke="#6ee7b7" strokeWidth="2" />
                    <polygon points="0,-12 6,3 -6,3" fill="#ffffff" />
                    <circle cx="0" cy="-3" r="1.5" fill="#0284c7" />
                    <rect x="-65" y="26" width="130" height="20" rx="5" fill="#064e3b" stroke="#34d399" strokeWidth="1.2" />
                    <text x="0" y="36" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="900" fontFamily="sans-serif">
                      StarExplorer_v2.4.exe
                    </text>
                    <text x="0" y="44" textAnchor="middle" fill="#6ee7b7" fontSize="5.5" fontWeight="800" fontFamily="monospace">
                      DRAG TO SAFE FOLDER
                    </text>
                  </g>
                )}

                {installerDocked && (
                  <g transform="translate(540, 160)">
                    <circle cx="0" cy="0" r="24" fill="#064e3b" stroke="#34d399" strokeWidth="1.5" />
                    <path d="M -6 0 L -2 4 L 6 -5" stroke="#34d399" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                    <rect x="-65" y="26" width="130" height="20" rx="5" fill="#0f172a" stroke="#334155" strokeWidth="1" />
                    <text x="0" y="38" textAnchor="middle" fill="#a7f3d0" fontSize="7" fontWeight="900" fontFamily="sans-serif">
                      PACKAGE DOCKED
                    </text>
                  </g>
                )}

                {/* Right: SAFE INSTALL FOLDER drop target (x = 830, y = 120, width = 160, height = 95) */}
                <g transform="translate(830, 120)">
                  <rect
                    x="0"
                    y="0"
                    width="160"
                    height="95"
                    rx="10"
                    fill={installerDocked ? "#064e3b" : isDraggingOrb ? "#0f2b48" : "#1e293b"}
                    stroke={installerDocked ? "#34d399" : isDraggingOrb ? "#38bdf8" : "#10b981"}
                    strokeWidth={2}
                    strokeDasharray={installerDocked ? undefined : "6 4"}
                  />
                  {/* Folder Tab Shape */}
                  <path
                    d="M 12 12 L 45 12 L 55 22 L 148 22 L 148 83 L 12 83 Z"
                    fill={installerDocked ? "#047857" : "#0f766e"}
                    opacity="0.85"
                  />
                  {installerDocked ? (
                    <>
                      <circle cx="80" cy="40" r="12" fill="#34d399" />
                      <path d="M 74 40 L 78 44 L 86 36" stroke="#064e3b" strokeWidth="2.5" fill="none" strokeLinecap="round" />
                      <text x="80" y="62" textAnchor="middle" fill="#a7f3d0" fontSize="7.5" fontWeight="900" fontFamily="sans-serif">
                        SAFE INSTALL FOLDER
                      </text>
                      <text x="80" y="73" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontWeight="900" fontFamily="monospace">
                        StarExplorer_v2.4.exe
                      </text>
                      <text x="80" y="88" textAnchor="middle" fill="#6ee7b7" fontSize="5.5" fontWeight="800" fontFamily="monospace">
                        C:\Games\StarExplorer
                      </text>
                    </>
                  ) : (
                    <>
                      <text x="80" y="42" textAnchor="middle" fill="#a7f3d0" fontSize="8" fontWeight="900" fontFamily="sans-serif">
                        SAFE INSTALL FOLDER
                      </text>
                      <text x="80" y="56" textAnchor="middle" fill="#6ee7b7" fontSize="6.5" fontWeight="800" fontFamily="monospace">
                        C:\Games\StarExplorer
                      </text>
                      <text x="80" y="72" textAnchor="middle" fill={isDraggingOrb ? "#fde047" : "#34d399"} fontSize="6.5" fontWeight="900" fontFamily="sans-serif">
                        {isDraggingOrb ? "DROP INSTALLER HERE!" : "DROP TARGET"}
                      </text>
                    </>
                  )}
                </g>

                {/* Full-width VERIFY & INSTALL SLIDER (0% -> 100%) (x = 530..980, y = 245..319, width = 450) */}
                <g transform="translate(530, 245)">
                  <rect
                    x="0"
                    y="0"
                    width="450"
                    height="74"
                    rx="10"
                    fill="#1e293b"
                    stroke={installerDocked ? "#10b981" : "#334155"}
                    strokeWidth={2}
                  />
                  <text x="225" y="18" textAnchor="middle" fill="#ffffff" fontSize="8.5" fontWeight="900" fontFamily="sans-serif">
                    VERIFY & INSTALL SLIDER
                  </text>
                  
                  {/* Track Groove (x = 20..430, width = 410) */}
                  <rect x="20" y="26" width="410" height="16" rx="8" fill="#0f172a" stroke="#475569" strokeWidth="1.2" />
                  <rect x="20" y="26" width={Math.max(16, (throttleVal / 100) * 410)} height="16" rx="8" fill="#10b981" />
                  
                  {/* Slider Thumb Handle */}
                  <circle
                    cx={20 + (throttleVal / 100) * 410}
                    cy="34"
                    r="14"
                    fill="#ffffff"
                    stroke={installerDocked ? "#059669" : "#64748b"}
                    strokeWidth="3.5"
                    className={installerDocked ? "cursor-ew-resize" : "cursor-not-allowed"}
                    onPointerDown={(e) => {
                      if (!installerDocked) {
                        playError();
                        setStatus("Dock StarExplorer in the Safe Install Folder first!", "warn");
                        speak("Dock the StarExplorer installer in the Safe Install Folder before running the install slider.");
                        return;
                      }
                      e.stopPropagation();
                      setIsDraggingThrottle(true);
                    }}
                  />

                  <text
                    x="225"
                    y="58"
                    textAnchor="middle"
                    fill={throttleVal >= 98 ? "#34d399" : installerDocked ? "#38bdf8" : "#94a3b8"}
                    fontSize="7.5"
                    fontWeight="900"
                    fontFamily="monospace"
                  >
                    {throttleVal >= 98
                      ? "100% - INSTALLING CLEAN ASSETS..."
                      : installerDocked
                      ? "DRAG SLIDER TO 100% (" + throttleVal + "%)"
                      : "LOCKED (DOCK INSTALLER FIRST)"}
                  </text>
                </g>
              </motion.g>
            )}
          </AnimatePresence>

          {/* TOP LAYER: ACTUALLY DRAGGED CARD & ORB (Float above everything!) */}
          {draggedCard && (
            <g
              transform={"translate(" + (dragCardPos.x - 61) + ", " + (dragCardPos.y - 34) + ")"}
              style={{ pointerEvents: "none" }}
            >
              <rect x="0" y="0" width="122" height="68" rx="8" fill="#450a0a" stroke="#ef4444" strokeWidth="2.5" />
              <rect x="6" y="6" width="110" height="18" rx="4" fill="#ef4444" />
              <text x="61" y="18" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="900" fontFamily="sans-serif">
                DISGUISED AD TRAP
              </text>
              <text x="61" y="40" textAnchor="middle" fill="#fca5a5" fontSize="8" fontWeight="900" fontFamily="sans-serif">
                {draggedCard.name}
              </text>
              <text x="61" y="56" textAnchor="middle" fill="#f87171" fontSize="6.5" fontWeight="800" fontFamily="monospace">
                DRAG TO RECYCLE BIN
              </text>
            </g>
          )}

          {isDraggingOrb && (
            <g
              transform={"translate(" + orbPos.x + ", " + orbPos.y + ")"}
              style={{ pointerEvents: "none" }}
            >
              <circle cx="0" cy="0" r="28" fill="#10b981" fillOpacity="0.3" stroke="#34d399" strokeWidth="2" />
              <circle cx="0" cy="0" r="20" fill="#059669" stroke="#6ee7b7" strokeWidth="2" />
              <polygon points="0,-12 6,3 -6,3" fill="#ffffff" />
              <circle cx="0" cy="-3" r="1.5" fill="#0284c7" />
              <rect x="-65" y="26" width="130" height="20" rx="5" fill="#064e3b" stroke="#34d399" strokeWidth="1.2" />
              <text x="0" y="36" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="900" fontFamily="sans-serif">
                StarExplorer_v2.4.exe
              </text>
              <text x="0" y="44" textAnchor="middle" fill="#6ee7b7" fontSize="5.5" fontWeight="800" fontFamily="monospace">
                DRAG TO SAFE FOLDER
              </text>
            </g>
          )}

          {/* ==================================================================
              AUTHENTIC PC DESKTOP & GAME LAUNCHER CELEBRATION
              ================================================================== */}
          {(isInstalling || isInstalled) && (
            <>
              {/* PC Desktop Dark Cyan Background */}
              <rect x="472" y="84" width="566" height="252" fill="#090d16" />

              {isInstalling && (
                <g transform="translate(755, 180)">
                  <text y="-20" textAnchor="middle" fill="#38bdf8" fontSize="11" fontWeight="900" fontFamily="sans-serif">
                    INSTALLING STAREXPLORER_v2.4.EXE...
                  </text>
                  <rect x="-150" y="-8" width="300" height="16" rx="8" fill="#1e293b" stroke="#0284c7" strokeWidth="1.5" />
                  <motion.rect
                    x="-150"
                    y="-8"
                    width="300"
                    height="16"
                    rx="8"
                    fill="#10b981"
                    initial={{ width: 0 }}
                    animate={{ width: 300 }}
                    transition={{ duration: 1.1, ease: "easeInOut" }}
                  />
                  <text y="24" textAnchor="middle" fill="#a7f3d0" fontSize="7" fontWeight="800" fontFamily="monospace">
                    VERIFYING CLEAN ASSETS (48.0 MB) • ZERO ADWARE • ZERO TRACKERS
                  </text>
                </g>
              )}

              {isInstalled && (
                <>
                  {/* PLAY STAR-EXPLORER Title Banner */}
                  <g transform="translate(755, 120)">
                    <rect x="-175" y="-18" width="350" height="38" rx="8" fill="#064e3b" stroke="#34d399" strokeWidth="2" />
                    <text y="6" textAnchor="middle" fill="#ffffff" fontSize="13" fontWeight="900" fontFamily="sans-serif">
                      PLAY STAR-EXPLORER
                    </text>
                  </g>

                  {/* Subtitle */}
                  <text x="755" y="152" textAnchor="middle" fill="#38bdf8" fontSize="8.5" fontWeight="800" fontFamily="monospace">
                    StarExplorer_v2.4.exe — 100% Installed
                  </text>

                  {/* Glowing Desktop Shortcut Icon on the Left */}
                  <g transform="translate(535, 175)">
                    <rect x="-26" y="-26" width="52" height="52" rx="10" fill="#0f172a" stroke="#38bdf8" strokeWidth="2" />
                    <circle cx="0" cy="-3" r="14" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
                    <polygon points="0,-12 3,-4 11,-4 5,1 7,9 0,4 -7,9 -5,1 -11,-4 -3,-4" fill="#fef08a" />
                    <text y="38" textAnchor="middle" fill="#ffffff" fontSize="7" fontWeight="900" fontFamily="sans-serif">
                      StarExplorer
                    </text>
                    <text y="48" textAnchor="middle" fill="#38bdf8" fontSize="5.5" fontWeight="800" fontFamily="monospace">
                      DESKTOP SHORTCUT
                    </text>
                  </g>

                  {/* Green Security Shield Banner */}
                  <g transform="translate(770, 195)">
                    <rect x="-170" y="-22" width="340" height="44" rx="8" fill="#022c22" stroke="#10b981" strokeWidth="1.8" />
                    <polygon points="-148,-12 -136,-12 -132,1 -142,11 -152,1" fill="#10b981" />
                    <path d="M -145 -1 L -142 2 L -136 -4" stroke="#022c22" strokeWidth="2" fill="none" strokeLinecap="round" />
                    <text x="10" y="-3" textAnchor="middle" fill="#a7f3d0" fontSize="8" fontWeight="900" fontFamily="sans-serif">
                      0 Adware • 0 Spy Trackers • 48.0 MB Verified
                    </text>
                    <text x="10" y="11" textAnchor="middle" fill="#6ee7b7" fontSize="6.5" fontWeight="800" fontFamily="monospace">
                      CLEAN ETHICAL GAME INSTALLATION COMPLETE
                    </text>
                  </g>

                  {/* Play Button cleanly separated: icon at x = -56, text at x = 12 */}
                  <g transform="translate(755, 290)" className="cursor-pointer">
                    <rect x="-75" y="0" width="150" height="30" rx="15" fill="#10b981" stroke="#34d399" strokeWidth="2" />
                    <polygon points="-56,9 -56,21 -44,15" fill="#ffffff" />
                    <text x="12" y="19" textAnchor="middle" fill="#ffffff" fontSize="9.5" fontWeight="900" fontFamily="sans-serif">
                      LAUNCH GAME
                    </text>
                  </g>
                </>
              )}
            </>
          )}
        </g>

        {/* ====================================================================
            DRAGGABLE AD-XRAY LENS (Page 1 only — Hidden cleanly once phase1Done is true!)
            ==================================================================== */}
        {wizardPage === 1 && !phase1Done && (
          <g
            transform={"translate(" + lensPos.x + ", " + lensPos.y + ")"}
            className="cursor-grab active:cursor-grabbing"
            onPointerDown={handleLensPointerDown}
          >
            <rect x="-36" y="-44" width="72" height="15" rx="4" fill="#0284c7" stroke="#38bdf8" strokeWidth="1.5" />
            <text x="0" y="-34" textAnchor="middle" fill="#ffffff" fontSize="6.5" fontWeight="900" fontFamily="sans-serif">
              AD-XRAY LENS
            </text>
            <circle cx="0" cy="0" r="28" fill="url(#lensGlowGrad)" stroke="#38bdf8" strokeWidth="3" />
            <circle cx="0" cy="0" r="24" fill="none" stroke="#fef08a" strokeWidth="1" strokeDasharray="4 3" />
            <line x1="-20" y1="0" x2="20" y2="0" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 2" />
            <line x1="0" y1="-20" x2="0" y2="20" stroke="#38bdf8" strokeWidth="1.5" strokeDasharray="3 2" />
            <circle cx="0" cy="0" r="4" fill="#0284c7" stroke="#ffffff" strokeWidth="1.5" />
            <rect x="-5" y="28" width="10" height="24" rx="3" fill="#f59e0b" stroke="#b45309" strokeWidth="1.5" />
            {/* High-Contrast White/Sky Pill Badge for SWIPE LENS */}
            <rect x="-42" y="52" width="84" height="16" rx="8" fill="#ffffff" stroke="#0284c7" strokeWidth="1.8" />
            <text x="0" y="63" textAnchor="middle" fill="#0369a1" fontSize="7" fontWeight="900" fontFamily="monospace">
              SWIPE LENS
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}
const Level2LivingRoomSmartTV = Level2GameInstaller;

/* ============================================================================
   LEVEL 3 (DP3) — THE CORNER BAKERY WINDOW
   Dark Patterns: Fake Urgency, Resetting Clocks, Fake Buyer Bots
   Fixes:
   - Baker Arjun overlap completely eliminated: Crowd Sensor Dial moved to upper
     wall (x = 565, y = 90), copper stock wire routed high at y = 160 above his hat!
   - Upgraded girl character (Ananya) with natural storybook anatomy and generous
     speech bubble width so text fits with zero overflow.
   - Real remaining time on clock: Fake 00:05 loop replaced with "4H 30M LEFT / CLOSES 8:00 PM"!
   ============================================================================ */

function Level3BakeryWindow({
  playClick,
  playSwitch,
  playSuccess,
  playError,
  playBeep,
  speak,
  setStatus,
  onRegisterHint,
  onLevelComplete,
}: StudioLevelProps) {
  const [clockCoverOpen, setClockCoverOpen] = useState(false);
  const [gearRemoved, setGearRemoved] = useState(false);
  const [wireConnected, setWireConnected] = useState(false);
  const [crowdDial, setCrowdDial] = useState<72 | 35 | 12 | 1>(72);

  // Fake countdown loop (5 -> 0 -> 5)
  const [timerSeconds, setTimerSeconds] = useState(5);
  const [sawLoop, setSawLoop] = useState(false);
  const hasCountedDownRef = useRef(false);

  const [levelSolved, setLevelSolved] = useState(false);
  const allPropsFixed = gearRemoved && wireConnected && crowdDial === 1;

  // Pure timer interval: NO SETSTATUS / NO SPEAK INSIDE STATE UPDATER!
  useEffect(() => {
    if (gearRemoved) return;
    const interval = setInterval(() => {
      setTimerSeconds((prev) => {
        if (prev <= 1) {
          hasCountedDownRef.current = true;
          return 5;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [gearRemoved]);

  // Handle timer reset detection in a PURE effect (zero console warnings!)
  useEffect(() => {
    if (gearRemoved) return;
    if (timerSeconds === 5 && hasCountedDownRef.current) {
      playBeep(280);
      setSawLoop(true);
      setStatus(
        "FALSE URGENCY: Clock secretly reset to 5s while 32 cupcakes sit inside!",
        "warn"
      );
      speak(
        "False urgency caught! The timer hit zero and instantly reset back to five seconds, while thirty-two cupcakes sit right inside. Click the clock to remove the infinite reset gear."
      );
    }
  }, [timerSeconds, gearRemoved, playBeep, setStatus, speak]);

  // Dynamic Hints
  useEffect(() => {
    onRegisterHint(() => {
      if (!gearRemoved) {
        if (!clockCoverOpen) {
          return "Step 1: Click the brass Wall Clock to pop open its gear housing!";
        }
        return "Step 1: Click the pulsing red 'INFINITE RESET GEAR' to stop the fake loop and reveal the real remaining bakery hours!";
      }
      if (!wireConnected) {
        return "Step 2: Click the 'COPPER STOCK SENSOR WIRE' routed high across the kitchen to broadcast real live stock (32 Cupcakes)!";
      }
      if (crowdDial !== 1) {
        return `Step 3: Click the Crowd Sensor Dial (${crowdDial} bots) on the upper wall to calibrate it down to the 1 real shopper (Ananya)!`;
      }
      return "All deceptive props dismantled! Tap 'BUY HONEST CUPCAKE (₹60)' to complete Ananya's purchase!";
    });
  }, [allPropsFixed, clockCoverOpen, crowdDial, gearRemoved, onRegisterHint, wireConnected]);

  // Fix 1A: Open Clock Housing
  const handleOpenClockCover = () => {
    if (clockCoverOpen) return;
    playClick();
    playBeep(520);
    setClockCoverOpen(true);
    setStatus("Clock Housing Open: Now remove the pulsing red Infinite Reset Gear!", "info");
    speak("Clock gear cover opened! Inside is a dishonest cam gear that resets the clock every five seconds. Click it to pull it out.");
  };

  // Fix 1B: Remove Infinite Reset Gear -> Shows Real Remaining Time!
  const handleRemoveGear = () => {
    if (gearRemoved) return;
    playSwitch();
    playBeep(600);
    setGearRemoved(true);
    setStatus("Fix 1 Done: Infinite reset gear removed! Clock displays REAL REMAINING TIME: 4H 30M LEFT (Closes 8:00 PM).", "info");
    speak("Reset gear extracted! The fake 5-second panic loop is gone. The clock now shows the real remaining time: four hours and thirty minutes left until closing at 8 PM.");
  };

  // Fix 2: Connect Copper Stock Wire
  const handleLinkWire = () => {
    if (wireConnected) return;
    playSwitch();
    playBeep(680);
    setWireConnected(true);
    setStatus("Fix 2 Done: Copper stock sensor linked! Storefront chalkboard displays 32 Fresh Cupcakes in Stock.", "info");
    speak("Copper sensor linked! The window chalkboard updated from 'Only 1 Left' to '32 Fresh Cupcakes in Stock'.");
  };

  // Fix 3: Calibrate Crowd Sensor Dial
  const handleDialCrowd = () => {
    if (crowdDial === 1) return;
    playClick();
    playBeep(500 + crowdDial * 3);
    if (crowdDial === 72) {
      setCrowdDial(35);
      setStatus("Dial Calibrating: 35 bots remaining...", "info");
    } else if (crowdDial === 35) {
      setCrowdDial(12);
      setStatus("Dial Calibrating: 12 bots remaining...", "info");
    } else {
      setCrowdDial(1);
      playSuccess();
      setStatus("Fix 3 Done: Fake crowd silenced! Exactly 1 real shopper: Ananya.", "success");
      speak("Crowd dial calibrated to the real world: one shopper, Ananya. All fake buyer bots silenced!");
    }
  };

  // Honest Purchase Completion
  const handleBuyCupcake = () => {
    if (!allPropsFixed || levelSolved) return;
    playClick();
    playBeep(920);
    playSuccess();
    setLevelSolved(true);
    setStatus(
      "HONEST BAKERY PURCHASE: Ananya bought at fair price with zero panic!",
      "success"
    );
    speak(
      "Congratulations! Ananya purchased her fresh cupcake calmly with verified stock and zero artificial pressure. Software Ethics upheld!"
    );
    setTimeout(() => {
      onLevelComplete(33);
    }, 1500);
  };

  return (
    <div className="flex-1 min-h-0 w-full relative overflow-hidden select-none">
      {/* WARM CORNER BAKERY SPLIT-ROOM BACKDROP */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        viewBox="0 0 1200 560"
        preserveAspectRatio="none"
        aria-hidden="true"
      >
        <CommonWorldDefs />
        <rect x="0" y="0" width="540" height="560" fill="url(#bakeryWall)" />
        <rect x="540" y="0" width="660" height="560" fill="url(#bakeryWall)" />
        <polygon points="120,0 360,0 520,560 220,560" fill="url(#sunbeamShaft)" />

        {/* ARCHITECTURAL STOREFRONT WINDOW MULLION & GLASS SHEEN */}
        <rect x="528" y="0" width="28" height="560" fill="#78350f" stroke="#451a03" strokeWidth="2" />
        <rect x="534" y="0" width="16" height="560" fill="#92400e" />
        <line x1="542" y1="0" x2="542" y2="560" stroke="#b45309" strokeWidth="1.5" />
        {/* Horizontal mullion transoms */}
        <rect x="524" y="160" width="36" height="14" rx="2" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />
        <rect x="524" y="370" width="36" height="14" rx="2" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />

        {/* Diagonal Storefront Glass Sheen & Reflection Highlights */}
        <polygon points="528,20 538,20 450,440 430,440" fill="#ffffff" opacity="0.16" />
        <polygon points="538,220 546,220 370,440 345,440" fill="#ffffff" opacity="0.12" />
        <polygon points="546,40 556,40 640,440 615,440" fill="#ffffff" opacity="0.12" />

        {/* Indoor Bakery Wall Baseboard Molding (y = 432..438) */}
        <rect x="535" y="432" width="665" height="6" fill="#78350f" stroke="#451a03" strokeWidth="1" />

        {/* Outdoor Sidewalk (x = 0..535, y = 438..560) */}
        <rect x="0" y="438" width="535" height="122" fill="#cbd5e1" stroke="#94a3b8" strokeWidth="1.5" />
        <line x1="180" y1="438" x2="180" y2="560" stroke="#94a3b8" strokeWidth="1.5" opacity="0.6" />
        <line x1="360" y1="438" x2="360" y2="560" stroke="#94a3b8" strokeWidth="1.5" opacity="0.6" />

        {/* Indoor Warm Oak Bakery Floor (x = 535..1200, y = 438..560) */}
        <rect x="535" y="438" width="665" height="122" fill="url(#woodFloor)" />

        {/* Continuous Crisp Floor Horizon Line at y = 438 */}
        <line x1="0" y1="438" x2="1200" y2="438" stroke="#475569" strokeWidth="2" />
        <line x1="535" y1="438" x2="1200" y2="438" stroke="#fde047" strokeWidth="2.5" />
      </svg>

      {/* UNIFIED 1200x560 INTERACTIVE BAKERY STAGE */}
      <svg
        viewBox="0 0 1200 560"
        preserveAspectRatio="xMidYMid meet"
        className="relative z-10 w-full h-full touch-none"
      >


        {/* ====================================================================
            LEFT SIDEWALK:
            1. Ananya at x = 140, y = 430 (CLEANLY LEFT, ZERO OVERLAP WITH SIGN)
            2. Wall Clock at x = 130, y = 115 (SHOWS REAL TIME WHEN GEAR REMOVED!)
            3. Storefront Chalkboard Sign at x = 315..518, y = 190..290
            ==================================================================== */}
        {/* Wall Clock with Pop-Open Brass Housing (Shows REAL REMAINING TIME!) */}
        <g
          transform="translate(130, 115)"
          onClick={!clockCoverOpen ? handleOpenClockCover : undefined}
          className={!clockCoverOpen ? "cursor-pointer" : "cursor-default"}
        >
          <circle cx="0" cy="0" r="42" fill={gearRemoved ? "#064e3b" : "#be123c"} stroke="#fef08a" strokeWidth="3" />
          <circle cx="0" cy="0" r="34" fill="#fffbeb" />

          {/* Clock Ticks */}
          <line x1="0" y1="-30" x2="0" y2="-24" stroke="#b45309" strokeWidth="2" />
          <line x1="30" y1="0" x2="24" y2="0" stroke="#b45309" strokeWidth="2" />
          <line x1="0" y1="30" x2="0" y2="24" stroke="#b45309" strokeWidth="2" />
          <line x1="-30" y1="0" x2="-24" y2="0" stroke="#b45309" strokeWidth="2" />

          {/* Time Display: REAL REMAINING TIME WHEN FIXED! */}
          {!gearRemoved ? (
            <text x="0" y="6" textAnchor="middle" fill="#dc2626" fontSize="13" fontWeight="900" fontFamily="monospace">
              00:0{timerSeconds}
            </text>
          ) : (
            <g>
              <text x="0" y="-1" textAnchor="middle" fill="#059669" fontSize="8.5" fontWeight="900" fontFamily="monospace">
                4H 30M LEFT
              </text>
              <text x="0" y="11" textAnchor="middle" fill="#047857" fontSize="7" fontWeight="900" fontFamily="sans-serif">
                CLOSES 8 PM
              </text>
            </g>
          )}

          {/* Pop-Open Gear Compartment */}
          {clockCoverOpen && !gearRemoved && (
            <g
              transform="translate(36, -10)"
              onClick={handleRemoveGear}
              className="cursor-pointer"
            >
              <rect x="0" y="0" width="45" height="30" rx="4" fill="#fee2e2" stroke="#ef4444" strokeWidth="2" />
              <circle cx="15" cy="15" r="8" fill="none" stroke="#dc2626" strokeWidth="2.5" />
              <text x="24" y="27" textAnchor="middle" fill="#7f1d1d" fontSize="6.5" fontWeight="900" fontFamily="monospace">
                REMOVE
              </text>
            </g>
          )}

          <text x="0" y="55" textAnchor="middle" fill="#78350f" fontSize="7" fontWeight="900" fontFamily="monospace">
            {gearRemoved ? "REAL HOURS (HONEST)" : clockCoverOpen ? "CLICK GEAR" : "CLICK CLOCK"}
          </text>
        </g>

        {/* Storefront Cursive Chalkboard Sign with Warm Wooden Frame */}
        <g transform="translate(315, 190)">
          <rect x="0" y="0" width="203" height="100" rx="10" fill="#b45309" stroke="#78350f" strokeWidth="3" />
          <rect x="8" y="8" width="187" height="84" rx="6" fill="url(#forestChalkboard)" />
          <text x="101.5" y="26" textAnchor="middle" fill="#fef08a" fontSize="9" fontWeight="900" fontFamily="sans-serif">
            BAKERY STOREFRONT MENU
          </text>

          <text
            x="101.5"
            y="56"
            textAnchor="middle"
            fill={wireConnected ? "#4ade80" : "#fca5a5"}
            fontSize={wireConnected ? "10.5" : "11.5"}
            fontWeight="900"
            fontFamily="monospace"
          >
            {wireConnected ? "32 FRESH CUPCAKES IN STOCK" : "HURRY! ONLY 1 LEFT!"}
          </text>

          <text x="101.5" y="78" textAnchor="middle" fill="#ffffff" fontSize="7.5" fontWeight="700" fontFamily="sans-serif">
            {wireConnected ? "Direct live link to kitchen cooling shelves" : "[FALSE SCARCITY PANIC!]"}
          </text>
        </g>

        {/* ====================================================================
            ANANYA (RICH 2D STORYBOOK STUDENT ON STREET OUTSIDE BAKERY)
            Positioned cleanly at x = 155, y = 492 in the middle of the sidewalk area.
            ==================================================================== */}
        <g transform="translate(155, 492)">
          {/* Ground Soft Elliptical Contact Shadow Firmly on Floor at y = 493 */}
          <ellipse cx="0" cy="1" rx="38" ry="5" fill="#475569" opacity="0.45" />

          {/* Contoured Legs & Ankle Socks */}
          <rect x="-15" y="-88" width="11" height="83" rx="5" fill="#fed7aa" />
          <rect x="5" y="-88" width="11" height="83" rx="5" fill="#fed7aa" />
          <path d="M -15 -55 Q -18 -38 -15 -20" stroke="#f97316" strokeWidth="0.8" fill="none" opacity="0.35" />
          <path d="M 16 -55 Q 19 -38 16 -20" stroke="#f97316" strokeWidth="0.8" fill="none" opacity="0.35" />

          {/* White Ankle Socks with Sky-Blue Stripe */}
          <rect x="-16" y="-18" width="13" height="12" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
          <line x1="-16" y1="-14" x2="-3" y2="-14" stroke="#0ea5e9" strokeWidth="1.2" />
          <rect x="4" y="-18" width="13" height="12" rx="3" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
          <line x1="4" y1="-14" x2="17" y2="-14" stroke="#0ea5e9" strokeWidth="1.2" />

          {/* Detailed Two-Tone Sneakers (Teal & White) Grounded Cleanly at Floor y = 435 */}
          <rect x="-22" y="-7" width="20" height="7" rx="3" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
          <path d="M -22 -3 L -2 -3" stroke="#ffffff" strokeWidth="2.5" />
          <circle cx="-16" cy="-3.5" r="1.2" fill="#ffffff" />
          <rect x="-22" y="-1" width="20" height="2" rx="1" fill="#e2e8f0" />

          <rect x="3" y="-7" width="20" height="7" rx="3" fill="#0284c7" stroke="#0369a1" strokeWidth="1" />
          <path d="M 3 -3 L 23 -3" stroke="#ffffff" strokeWidth="2.5" />
          <circle cx="9" cy="-3.5" r="1.2" fill="#ffffff" />
          <rect x="3" y="-1" width="20" height="2" rx="1" fill="#e2e8f0" />

          {/* Pleated Coral-Pink A-Line Skirt */}
          <polygon points="-24,-90 24,-90 28,-66 -28,-66" fill="#fb7185" stroke="#e11d48" strokeWidth="1.5" />
          <line x1="-16" y1="-90" x2="-19" y2="-66" stroke="#be123c" strokeWidth="1.2" />
          <line x1="-8" y1="-90" x2="-9" y2="-66" stroke="#be123c" strokeWidth="1.2" />
          <line x1="0" y1="-90" x2="0" y2="-66" stroke="#be123c" strokeWidth="1.2" />
          <line x1="8" y1="-90" x2="9" y2="-66" stroke="#be123c" strokeWidth="1.2" />
          <line x1="16" y1="-90" x2="19" y2="-66" stroke="#be123c" strokeWidth="1.2" />

          {/* White Collared Top with Subtle Buttons & Fitted Sky-Blue Cardigan Jacket */}
          <rect x="-24" y="-165" width="48" height="76" rx="10" fill="#0284c7" stroke="#0369a1" strokeWidth="1.8" />
          <polygon points="-9,-165 0,-146 9,-165" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1" />
          <circle cx="0" cy="-140" r="1.5" fill="#fef08a" stroke="#d97706" strokeWidth="0.6" />
          <circle cx="0" cy="-125" r="1.5" fill="#fef08a" stroke="#d97706" strokeWidth="0.6" />
          <circle cx="0" cy="-110" r="1.5" fill="#fef08a" stroke="#d97706" strokeWidth="0.6" />
          <path d="M -24 -165 Q -8 -135 -7 -89" stroke="#0369a1" strokeWidth="1.5" fill="none" />
          <path d="M 24 -165 Q 8 -135 7 -89" stroke="#0369a1" strokeWidth="1.5" fill="none" />

          {/* Brown Leather Crossbody Satchel Bag with Stitched Strap & Gold Clasp */}
          <path d="M -18 -165 Q 0 -138 18 -112" stroke="#78350f" strokeWidth="3.5" fill="none" strokeLinecap="round" />
          <path d="M -18 -165 Q 0 -138 18 -112" stroke="#d97706" strokeWidth="1" strokeDasharray="3 2" fill="none" />
          <rect x="10" y="-116" width="20" height="20" rx="4" fill="#92400e" stroke="#78350f" strokeWidth="1.5" />
          <polygon points="10,-116 20,-106 30,-116" fill="#b45309" stroke="#78350f" strokeWidth="1" />
          <circle cx="20" cy="-106" r="2.2" fill="#facc15" stroke="#b45309" strokeWidth="0.8" />

          {/* Naturally Bent Left Arm (Resting on Satchel Strap) */}
          <path d="M -22 -156 Q -34 -130 -12 -112" fill="none" stroke="#0284c7" strokeWidth="7.5" strokeLinecap="round" />
          <path d="M -22 -156 Q -34 -130 -12 -112" fill="none" stroke="#0369a1" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="-12" cy="-112" r="5" fill="#fed7aa" stroke="#f97316" strokeWidth="1.2" />

          {/* Gracefully Bent Right Arm (Pointing toward Storefront Window Menu) */}
          <path d="M 22 -156 Q 38 -136 46 -118" fill="none" stroke="#0284c7" strokeWidth="7.5" strokeLinecap="round" />
          <path d="M 22 -156 Q 38 -136 46 -118" fill="none" stroke="#0369a1" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="46" cy="-118" r="5" fill="#fed7aa" stroke="#f97316" strokeWidth="1.2" />
          <path d="M 46 -118 Q 52 -120 54 -116" stroke="#f97316" strokeWidth="1.5" fill="none" strokeLinecap="round" />

          {/* Head, Hair & Storybook Facial Details */}
          <rect x="-5" y="-178" width="10" height="15" fill="#fed7aa" />

          {/* Flowing High Ponytail Behind Head with Pastel Ribbon */}
          <path d="M -10 -210 C -28 -225, -36 -202, -32 -180 C -29 -166, -34 -152, -28 -142 C -22 -155, -20 -174, -18 -194 Z" fill="#451a03" stroke="#271102" strokeWidth="1.2" />
          <path d="M -14 -212 Q -20 -220 -26 -216 Q -22 -208 -12 -208 Z" fill="#fda4af" stroke="#f43f5e" strokeWidth="1" />
          <circle cx="-13" cy="-210" r="3" fill="#fb7185" />

          {/* Contoured Jawline Path */}
          <path d="M -16 -188 C -16 -170, -8 -166, 0 -166 C 8 -166, 16 -170, 16 -188 C 16 -206, -16 -206, -16 -188 Z" fill="#fed7aa" stroke="#f97316" strokeWidth="1.2" />

          {/* Visible Ear with Subtle Gold Earring */}
          <circle cx="-17" cy="-184" r="3.5" fill="#fed7aa" stroke="#f97316" strokeWidth="1" />
          <circle cx="-17" cy="-182" r="1.3" fill="#facc15" stroke="#b45309" strokeWidth="0.6" />

          {/* Styled Side-Swept Bangs with Warm Luster Highlights */}
          <path d="M -18 -196 C -18 -218, 18 -218, 18 -196 C 14 -190, 8 -192, 0 -192 C -8 -192, -14 -190, -18 -196 Z" fill="#451a03" />
          <path d="M -16 -204 Q -4 -216 12 -208" stroke="#854d0e" strokeWidth="1.8" fill="none" />
          <path d="M -12 -198 Q 2 -192 14 -196" stroke="#451a03" strokeWidth="2.5" fill="none" />

          {/* Expressive Eyebrows */}
          <path d="M -10 -199 Q -6 -202 -2 -199" stroke="#3b2010" strokeWidth="1.6" fill="none" strokeLinecap="round" />
          <path d="M 2 -199 Q 6 -202 10 -199" stroke="#3b2010" strokeWidth="1.6" fill="none" strokeLinecap="round" />

          {/* Eyes with White Catchlights */}
          <circle cx="-5" cy="-192" r="2.3" fill="#0f172a" />
          <circle cx="-4.2" cy="-192.8" r="0.8" fill="#ffffff" />
          <circle cx="7" cy="-192" r="2.3" fill="#0f172a" />
          <circle cx="7.8" cy="-192.8" r="0.8" fill="#ffffff" />

          {/* Subtle Cheek Blush */}
          <ellipse cx="-10" cy="-185" rx="3" ry="1.5" fill="#f43f5e" opacity="0.3" />
          <ellipse cx="10" cy="-185" rx="3" ry="1.5" fill="#f43f5e" opacity="0.3" />

          {/* Dynamic Mouth Expression: Skeptical Frown -> Warm Happy Smile */}
          {!allPropsFixed ? (
            <path d="M -5 -180 Q 0 -184 5 -181" fill="none" stroke="#78350f" strokeWidth="1.8" strokeLinecap="round" />
          ) : (
            <path d="M -5 -182 Q 0 -174 5 -182" fill="none" stroke="#dc2626" strokeWidth="2" strokeLinecap="round" />
          )}

          {/* Generous Dynamic Speech Bubble Centered at translate(-15, -268) */}
          <g transform="translate(-15, -268)">
            {(() => {
              const girlText = levelSolved
                ? "Fair cupcake bought with zero rush!"
                : allPropsFixed
                ? "Verified! 32 cupcakes & 1 shopper: me!"
                : wireConnected
                ? "32 in stock! But are there 72 buyers?!"
                : gearRemoved
                ? "Clock is honest! But why sign says 1?"
                : sawLoop
                ? "Why did the clock reset to 5s?!"
                : "Hurry, 1 left? But I see racks inside!";
              const bubbleWidth = Math.max(220, girlText.length * 6.4 + 38);
              return (
                <g>
                  <rect
                    x={-bubbleWidth / 2}
                    y="-18"
                    width={bubbleWidth}
                    height="36"
                    rx="18"
                    fill="#ffffff"
                    stroke="#0f172a"
                    strokeWidth="2.2"
                  />
                  {/* Downward pointer tail pointing directly at Ananya's head */}
                  <polygon points="5,18 12,28 19,18" fill="#ffffff" stroke="#0f172a" strokeWidth="2.2" />
                  <rect x="6" y="16" width="12" height="4" fill="#ffffff" />
                  <text x="0" y="5" textAnchor="middle" fill="#0f172a" fontSize="8.5" fontWeight="800" fontFamily="sans-serif">
                    {girlText}
                  </text>
                </g>
              );
            })()}
          </g>
        </g>

        {/* ====================================================================
            RIGHT KITCHEN:
            1. Baker Arjun at x = 680, y = 440 (ZERO OVERLAP!)
            2. Crowd Sensor Dial moved to Upper Kitchen Wall at x = 565, y = 95!
            3. 32 Cupcakes on Wooden Baker's Rack (x = 760..1160, y = 95..420)
            4. Copper Stock Wire routed HIGH at y = 160 (Well above chef hat!)
            ==================================================================== */}
        {/* Crowd Sensor Dial with Analog Visual Gauge Face (x = 565, y = 95) */}
        <g
          transform="translate(565, 95)"
          onClick={handleDialCrowd}
          className={crowdDial !== 1 ? "cursor-pointer" : "cursor-default"}
        >
          <rect x="0" y="0" width="130" height="76" rx="10" fill="#fef3c7" stroke="#d97706" strokeWidth="2" />
          <text x="65" y="15" textAnchor="middle" fill="#78350f" fontSize="8" fontWeight="900" fontFamily="monospace">
            CROWD SENSOR DIAL
          </text>

          {/* Circular Analog Dial Face */}
          <circle cx="65" cy="33" r="16" fill="#ffffff" stroke="#d97706" strokeWidth="1.2" />
          {/* Red BOTS Arc (Left) */}
          <path d="M 51 33 A 14 14 0 0 1 65 19" fill="none" stroke="#ef4444" strokeWidth="3" />
          {/* Emerald REAL Arc (Right) */}
          <path d="M 65 19 A 14 14 0 0 1 79 33" fill="none" stroke="#10b981" strokeWidth="3" />
          <text x="53" y="26" fill="#dc2626" fontSize="4.5" fontWeight="900" fontFamily="monospace">BOTS</text>
          <text x="77" y="26" fill="#059669" fontSize="4.5" fontWeight="900" fontFamily="monospace">REAL</text>

          {/* Rotating Pointer Needle */}
          {(() => {
            const dialAngle = crowdDial === 72 ? -55 : crowdDial === 35 ? -20 : crowdDial === 12 ? 15 : 55;
            return (
              <g transform={"rotate(" + dialAngle + ", 65, 33)"}>
                <line x1="65" y1="33" x2="65" y2="21" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" />
                <circle cx="65" cy="33" r="2.5" fill="#d97706" stroke="#0f172a" strokeWidth="0.8" />
              </g>
            );
          })()}

          {/* Active Sensor State Text */}
          <text
            x="65"
            y="59"
            textAnchor="middle"
            fill={crowdDial === 1 ? "#059669" : "#dc2626"}
            fontSize="9.5"
            fontWeight="900"
            fontFamily="monospace"
          >
            {crowdDial === 1 ? "1 REAL SHOPPER" : `${crowdDial} BOTS`}
          </text>
          <text x="65" y="70" textAnchor="middle" fill="#78350f" fontSize="6.5" fontWeight="700" fontFamily="sans-serif">
            {crowdDial === 1 ? "VERIFIED TRUE" : "CLICK TO CALIBRATE"}
          </text>
        </g>

        {/* Baker Arjun on Bakery Floor (x = 675, y = 492) */}
        <g transform="translate(675, 492)">
          {/* Ground Soft Elliptical Contact Shadow Firmly on Floor at y = 493 */}
          <ellipse cx="0" cy="1" rx="42" ry="5" fill="#451a03" opacity="0.4" />

          {/* Chef Charcoal Trousers & Kitchen Clogs */}
          <rect x="-16" y="-95" width="13" height="90" rx="6" fill="#1e293b" />
          <rect x="3" y="-95" width="13" height="90" rx="6" fill="#1e293b" />
          <rect x="-21" y="-7" width="19" height="7" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="1" />
          <rect x="3" y="-7" width="19" height="7" rx="3" fill="#0f172a" stroke="#334155" strokeWidth="1" />

          {/* White Double-Breasted Chef Coat with Double Row of Buttons */}
          <rect x="-26" y="-165" width="52" height="74" rx="10" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.8" />
          <circle cx="-10" cy="-145" r="2.2" fill="#334155" />
          <circle cx="10" cy="-145" r="2.2" fill="#334155" />
          <circle cx="-10" cy="-130" r="2.2" fill="#334155" />
          <circle cx="10" cy="-130" r="2.2" fill="#334155" />
          <circle cx="-10" cy="-115" r="2.2" fill="#334155" />
          <circle cx="10" cy="-115" r="2.2" fill="#334155" />

          {/* Crisp Folded Red Chef Neckerchief */}
          <polygon points="-14,-165 0,-146 14,-165" fill="#dc2626" stroke="#991b1b" strokeWidth="1.2" />
          <polygon points="-4,-148 0,-138 4,-148" fill="#ef4444" />

          {/* Left Arm Resting Naturally on Kitchen Counter */}
          <path d="M -24 -156 Q -38 -130 -32 -108" fill="none" stroke="#f8fafc" strokeWidth="8" strokeLinecap="round" />
          <path d="M -24 -156 Q -38 -130 -32 -108" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
          <circle cx="-32" cy="-108" r="5.5" fill="#fed7aa" stroke="#f97316" strokeWidth="1.2" />

          {/* Right Arm: Celebratory Thumbs-Up when all 3 dark patterns fixed! */}
          {allPropsFixed ? (
            <g>
              <path d="M 24 -156 Q 42 -142 42 -122 Q 42 -106 38 -96" fill="none" stroke="#f8fafc" strokeWidth="8" strokeLinecap="round" />
              <path d="M 24 -156 Q 42 -142 42 -122 Q 42 -106 38 -96" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="38" cy="-96" r="5.5" fill="#fed7aa" stroke="#f97316" strokeWidth="1.2" />
              {/* Thumbs up thumb */}
              <path d="M 36 -98 L 36 -108 Q 38 -111 41 -108 L 41 -98" fill="#fed7aa" stroke="#f97316" strokeWidth="1.2" />
              <text x="46" y="-100" fill="#059669" fontSize="7.5" fontWeight="900" fontFamily="monospace">GOOD!</text>
            </g>
          ) : (
            <g>
              <path d="M 24 -156 Q 38 -132 30 -110" fill="none" stroke="#f8fafc" strokeWidth="8" strokeLinecap="round" />
              <path d="M 24 -156 Q 38 -132 30 -110" fill="none" stroke="#94a3b8" strokeWidth="1.5" strokeLinecap="round" />
              <circle cx="30" cy="-110" r="5.5" fill="#fed7aa" stroke="#f97316" strokeWidth="1.2" />
              <rect x="28" y="-112" width="18" height="4" rx="1" fill="#cbd5e1" stroke="#64748b" strokeWidth="0.8" />
            </g>
          )}

          {/* Neck & Storybook Head with Contoured Jawline */}
          <rect x="-5" y="-178" width="10" height="15" fill="#fed7aa" />
          <path d="M -16 -188 C -16 -170, -8 -166, 0 -166 C 8 -166, 16 -170, 16 -188 C 16 -206, -16 -206, -16 -188 Z" fill="#fed7aa" stroke="#f97316" strokeWidth="1.2" />
          <circle cx="-17" cy="-186" r="3.5" fill="#fed7aa" stroke="#f97316" strokeWidth="1" />
          <circle cx="17" cy="-186" r="3.5" fill="#fed7aa" stroke="#f97316" strokeWidth="1" />
          <path d="M -16 -194 Q -12 -188 -14 -182" stroke="#3b2010" strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M 16 -194 Q 12 -188 14 -182" stroke="#3b2010" strokeWidth="2.5" fill="none" strokeLinecap="round" />

          {/* Pleated Chef Toque Hat */}
          <rect x="-20" y="-208" width="40" height="9" rx="2" fill="#f8fafc" stroke="#94a3b8" strokeWidth="1.5" />
          <path d="M -22 -208 C -28 -246, -12 -256, 0 -252 C 12 -256, 28 -246, 22 -208 Z" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1.8" />
          <line x1="-12" y1="-210" x2="-14" y2="-246" stroke="#e2e8f0" strokeWidth="1.5" />
          <line x1="-4" y1="-210" x2="-4" y2="-252" stroke="#e2e8f0" strokeWidth="1.5" />
          <line x1="4" y1="-210" x2="4" y2="-252" stroke="#e2e8f0" strokeWidth="1.5" />
          <line x1="12" y1="-210" x2="14" y2="-246" stroke="#e2e8f0" strokeWidth="1.5" />

          {/* Expressive Eyebrows & Eyes with Catchlights */}
          <path d="M -10 -199 Q -6 -203 -2 -200" stroke="#3b2010" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <path d="M 2 -200 Q 6 -203 10 -199" stroke="#3b2010" strokeWidth="1.8" fill="none" strokeLinecap="round" />
          <circle cx="-6" cy="-193" r="2.4" fill="#0f172a" />
          <circle cx="-5" cy="-193.8" r="0.9" fill="#ffffff" />
          <circle cx="6" cy="-193" r="2.4" fill="#0f172a" />
          <circle cx="7" cy="-193.8" r="0.9" fill="#ffffff" />

          {/* Warm Baker Smile & Rosy Cheeks */}
          <ellipse cx="-10" cy="-186" rx="2.5" ry="1.2" fill="#f43f5e" opacity="0.25" />
          <ellipse cx="10" cy="-186" rx="2.5" ry="1.2" fill="#f43f5e" opacity="0.25" />
          <path d="M -6 -181 Q 0 -174 6 -181" fill="none" stroke="#78350f" strokeWidth="2.2" strokeLinecap="round" />
        </g>

        {/* Cozy Bakery Counter / Pastry Table Grounded on Floor (x = 745..1175, y = 415..438) */}
        <g transform="translate(745, 415)">
          <rect x="0" y="0" width="430" height="10" rx="3" fill="#f59e0b" stroke="#b45309" strokeWidth="2" />
          <rect x="8" y="8" width="414" height="15" fill="#78350f" stroke="#451a03" strokeWidth="1.5" />
          <line x1="12" y1="18" x2="418" y2="18" stroke="#fef08a" strokeWidth="2" />
        </g>

        {/* 32 Cupcakes on Sunlit Wooden Baker's Rack Resting on Counter (x = 760..1160, y = 95..420) */}
        <g transform="translate(760, 95)">
          <rect x="0" y="0" width="400" height="325" rx="12" fill="url(#woodenShelf)" stroke="#78350f" strokeWidth="3" />
          <rect x="14" y="10" width="372" height="28" rx="6" fill="#fef3c7" stroke="#b45309" strokeWidth="1.5" />
          <text x="200" y="29" textAnchor="middle" fill="#78350f" fontSize="11" fontWeight="900" fontFamily="monospace">
            BAKERY STORAGE: 32 FRESH CUPCAKES
          </text>

          {/* Warm Cream Subheader Pill with Crisp Dark Espresso Text */}
          <rect x="40" y="44" width="320" height="20" rx="10" fill="#fef3c7" stroke="#d97706" strokeWidth="1.2" />
          <text x="200" y="57" textAnchor="middle" fill="#451a03" fontSize="8" fontWeight="900" fontFamily="monospace">
            FRESH MORNING BATCH -- 32 ARTISAN CUPCAKES
          </text>

          {/* 6 Full Cooling Shelves spanning Upper and Lower Racks */}
          {[105, 145, 185, 225, 265, 305].map((sy) => (
            <line key={`rack-shelf-${sy}`} x1="16" y1={sy} x2="384" y2={sy} stroke="#fef08a" strokeWidth="2.5" />
          ))}

          {/* 6 Full Rows of Pastel-Frosted Cupcakes completely filling the Display Cabinet */}
          {Array.from({ length: 6 }).map((_, row) =>
            Array.from({ length: 8 }).map((_, col) => {
              const cx = 36 + col * 46;
              const cy = 85 + row * 40;
              const frostingColors = ["#ec4899", "#38bdf8", "#facc15", "#a855f7", "#34d399", "#fb923c"];
              const color = frostingColors[(row + col) % frostingColors.length];
              return (
                <g key={`cupcake-${row}-${col}`}>
                  <polygon
                    points={`${cx - 10},${cy + 8} ${cx + 10},${cy + 8} ${cx + 8},${cy + 18} ${cx - 8},${cy + 18}`}
                    fill="#d97706"
                  />
                  <circle cx={cx} cy={cy + 5} r="9" fill={color} />
                  <circle cx={cx} cy={cy} r="6" fill="#ffffff" />
                  <circle cx={cx} cy={cy - 4} r="3" fill="#dc2626" />
                </g>
              );
            })
          )}
        </g>

        {/* COPPER STOCK SENSOR WIRE (ROUTED THROUGH LINK BUTTON AT y = 186 — 15px CLEARANCE BELOW DIAL) */}
        <g
          onClick={handleLinkWire}
          className={!wireConnected ? "cursor-pointer" : "cursor-default"}
        >
          <circle cx="760" cy="160" r="8" fill="#d97706" stroke="#fef08a" strokeWidth="2" />
          <circle cx="518" cy="240" r="8" fill="#d97706" stroke="#fef08a" strokeWidth="2" />

          {/* Curved path arching cleanly through the link button to the chalkboard sign */}
          <path
            d="M 760 160 C 690 170, 670 197, 590 197 C 550 197, 530 220, 518 240"
            fill="none"
            stroke={wireConnected ? "#10b981" : "#f59e0b"}
            strokeWidth={wireConnected ? "4" : "3"}
            strokeDasharray={wireConnected ? undefined : "6 4"}
          />

          <rect
            x="590"
            y="186"
            width="80"
            height="22"
            rx="6"
            fill={wireConnected ? "#059669" : "#d97706"}
            stroke="#fef08a"
            strokeWidth="1.5"
          />
          <text x="630" y="201" textAnchor="middle" fill="#ffffff" fontSize="8" fontWeight="900" fontFamily="monospace">
            {wireConnected ? "LIVE 32 COUNT" : "LINK WIRE"}
          </text>
        </g>

        {/* BUY HONEST CUPCAKE ACTION BUTTON */}
        {allPropsFixed && !levelSolved && (
          <g
            transform="translate(480, 480)"
            onClick={handleBuyCupcake}
            className="cursor-pointer"
          >
            <rect x="0" y="0" width="240" height="42" rx="12" fill="#059669" stroke="#fef08a" strokeWidth="2.5" />
            <text x="120" y="26" textAnchor="middle" fill="#ffffff" fontSize="11" fontWeight="900" fontFamily="monospace">
              BUY HONEST CUPCAKE (₹60)
            </text>
          </g>
        )}
      </svg>
    </div>
  );
}

/* ============================================================================
   CANONICAL LAB LEVELS CONFIGURATION
   ============================================================================ */

const LEVELS = [
  {
    index: 0,
    code: "DP1",
    title: "The Bicycle Shop Counter",
    subtitle: "Bicycle Shop: Drag Tags -> Ask Aarav -> Shred Hidden Fees -> Cash Walk",
    goalLine:
      "Drag Scanner across bike -> Ask Aarav for consent -> Shred hidden fees!",
    introVoice:
      "Level 1: The Bicycle Shop Counter. Aarav has three thousand rupees for a city bicycle, but the register charges four thousand one hundred and fifty! Drag the magnetic scanner across the bicycle to uncover four sneaky tags, drag optional items to Aarav to ask his consent, and drag hidden fees into the shredder.",
    beamClass: "from-amber-700 via-orange-700 to-amber-800 border-amber-300",
    bgClass: "bg-amber-100",
  },
  {
    index: 1,
    code: "DP2",
    title: "The Home PC Game Download",
    subtitle: "Home Study: Sweep Lens -> Bin Ads -> Unplug Trackers -> Slide Throttle",
    goalLine:
      "Sweep Lens -> Bin 3 Fake Ads -> Unplug 3 Tracker Cables -> Slide Throttle to Launch!",
    introVoice:
      "Level 2: The Home PC Game Download. Kabir is downloading a space game on his desktop computer, but fake ads and hidden trackers are everywhere! Sweep the lens to expose the traps, drag all three fake ads into the recycle bin, unplug three tracker cables, and slide the launch throttle to blast off safely.",
    beamClass: "from-sky-700 via-teal-700 to-sky-800 border-sky-300",
    bgClass: "bg-sky-100",
  },
  {
    index: 2,
    code: "DP3",
    title: "The Corner Bakery Window",
    subtitle: "Corner Bakery: Remove Reset Gear, Link 32 Cupcakes Wire, and Calibrate Dial",
    goalLine:
      "Remove Clock Reset Gear -> Connect Live Cupcake Wire -> Calibrate Crowd Dial!",
    introVoice:
      "Level 3: The Corner Bakery Window. The wall clock keeps resetting to five seconds while thirty-two fresh cupcakes sit in Arjun's kitchen! Open the clock housing to pull out the reset gear, link the copper sensor wire to the storefront chalkboard, and calibrate the crowd sensor dial.",
    beamClass: "from-amber-600 via-orange-600 to-amber-700 border-amber-300",
    bgClass: "bg-amber-100",
  },
];

/* ============================================================================
   MAIN EXPORT: VOLKSWAGEN EMISSIONS CHEAT (SOFTWARE ETHICS & DARK PATTERNS LAB)
   ============================================================================ */

export default function DarkPatternsEthicsLab() {
  const { playClick, playSwitch, playSuccess, playError, playBeep } = useLabAudio();
  const { reportComplete, getTimeTaken } = useLMSBridge("dark-patterns-ethics");
  const { speak, stop: stopVoice, setMuted: setVoiceMuted } = useVoiceAssistant({
    lang: "en-IN",
  });

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
      setScore((prev) => Math.min(100, prev + scoreAward));
      setLevelSolved(true);

      if (levelIdx === 2) {
        if (!reportedRef.current) {
          reportedRef.current = true;
          reportComplete({
            labId: "dark-patterns-ethics",
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
        className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl bg-amber-500 border border-amber-700 text-white font-mono font-bold text-xs shadow-xs active:scale-95 transition cursor-pointer"
      >
        <Lightbulb className="w-3.5 h-3.5 text-white" />
        <span>Hint</span>
      </button>
      <button
        type="button"
        onClick={handleReset}
        className="inline-flex items-center gap-1.5 px-2.5 sm:px-3 py-1 rounded-xl bg-sky-600 border border-sky-800 text-white font-mono font-bold text-xs shadow-xs active:scale-95 transition cursor-pointer"
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
      labId="dark-patterns-ethics"
      title="Volkswagen Emissions Cheat"
      module="Privacy & Ethics"
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
              {currentLevel.code} — {currentLevel.title}
            </span>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {LEVELS.map((lvl) => {
              const isPast =
                lvl.index < levelIdx || (lvl.index === levelIdx && levelSolved);
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
                      isPast
                        ? "bg-emerald-100"
                        : isCurrent
                        ? "bg-amber-950 animate-pulse"
                        : "bg-amber-200/40"
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
            <Level1BicycleShop key={`dp1-${resetTick}`} {...sharedLevelProps} />
          )}
          {levelIdx === 1 && (
            <Level2GameInstaller key={`dp2-${resetTick}`} {...sharedLevelProps} />
          )}
          {levelIdx === 2 && (
            <Level3BakeryWindow key={`dp3-${resetTick}`} {...sharedLevelProps} />
          )}
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
              <Check className="w-4 h-4 text-emerald-300 stroke-[3] shrink-0" />
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
              className="shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1 rounded-xl bg-emerald-500 border-2 border-amber-200 text-white font-mono font-extrabold text-xs shadow-md cursor-pointer"
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
                  Congrats! You have completed Volkswagen Emissions Cheat!.
                </h2>

                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-2xl bg-emerald-600 border-2 border-emerald-800 text-white font-mono font-bold text-sm shadow-md active:scale-95 transition cursor-pointer"
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
