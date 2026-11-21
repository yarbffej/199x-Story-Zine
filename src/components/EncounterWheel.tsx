import React, { useRef, useState, useEffect, useCallback } from 'react';
import { 
  Sparkles, 
  Dices, 
  RotateCw, 
  Zap, 
  Compass, 
  Flame, 
  Maximize2, 
  Minimize2,
  CheckCircle2
} from 'lucide-react';
import { playWheelClick, playWheelWin, playCriticalSmashSound } from '../utils/audio';

export interface WheelSlice {
  id: string;
  name: string;
  icon: string;
  bg: string;
  textColor: string;
  threatLevel: string;
  threatColor: string;
  vibe: string;
}

export const WHEEL_SLICES: WheelSlice[] = [
  { id: 'mall-arcade', name: 'MALL ARCADE', icon: '🍕', bg: '#FF007F', textColor: '#FFFFFF', threatLevel: 'RADICAL', threatColor: '#00F0FF', vibe: 'Neon CRT Cabinets & Token Slots' },
  { id: 'roller-rink', name: 'ROLLER RINK', icon: '⚡', bg: '#9333EA', textColor: '#FDE047', threatLevel: 'GLOWING', threatColor: '#FFE600', vibe: 'Blacklight Carpet & Disco Mirrorballs' },
  { id: 'toxic-ooze', name: 'TOXIC OOZE', icon: '🧪', bg: '#16A34A', textColor: '#000000', threatLevel: 'HAZMAT', threatColor: '#22C55E', vibe: 'Radioactive Glowing Sewer Slime' },
  { id: 'pcb-circuit', name: '16-BIT CHIP', icon: '💾', bg: '#0891B2', textColor: '#FFFFFF', threatLevel: 'OVERCLOCKED', threatColor: '#00F0FF', vibe: 'Emerald PCB Motherboard Traces' },
  { id: 'cosmic-abduction', name: 'COSMIC BEAM', icon: '🛸', bg: '#4338CA', textColor: '#FFFFFF', threatLevel: 'OMEGA', threatColor: '#EC4899', vibe: 'Suburban Sky Traction Tractor Ray' },
  { id: 'fleer-gold', name: 'FLEER GOLD', icon: '🏆', bg: '#CA8A04', textColor: '#000000', threatLevel: '24K BULLION', threatColor: '#FFE600', vibe: 'Ultra Embossed Foil Leafing' },
  { id: 'vhs-glitch', name: 'VHS STATIC', icon: '📼', bg: '#DB2777', textColor: '#FFFFFF', threatLevel: 'TRACKING', threatColor: '#38BDF8', vibe: 'Magnetic Tape Head Desync Glitch' },
  { id: 'jazz-cup', name: "'90S JAZZ CUP", icon: '🥤', bg: '#0D9488', textColor: '#FFFFFF', threatLevel: 'WAVE', threatColor: '#2DD4BF', vibe: '1991 Teal Solo Cup Brushstrokes' },
  { id: 'pizza-hut', name: 'PIZZA BUFFET', icon: '🔥', bg: '#EA580C', textColor: '#FFFFFF', threatLevel: 'RED ROOF', threatColor: '#F97316', vibe: 'Stained Glass Lamps & Sizzle Pan' },
  { id: 'prism-refractor', name: 'PRISM FOIL', icon: '🌈', bg: '#7C3AED', textColor: '#FDE047', threatLevel: 'REFRACTOR', threatColor: '#C084FC', vibe: 'Laser Rainbow Diffraction Grating' },
  { id: 'blockbuster', name: 'RENTAL VHS', icon: '🥋', bg: '#1D4ED8', textColor: '#FDE047', threatLevel: 'LATE RETURN', threatColor: '#FFE600', vibe: 'Blue & Gold Rewind Police' },
  { id: 'laser-tag', name: 'LASER TAG', icon: '🛹', bg: '#65A30D', textColor: '#000000', threatLevel: 'TARGET LOCK', threatColor: '#A3E635', vibe: 'Fog Machine & Infrared Crossbeams' },
  { id: 'critical-smash', name: 'CRITICAL SMASH', icon: '💀', bg: '#DC2626', textColor: '#FFFFFF', threatLevel: 'MAX THREAT', threatColor: '#FF0055', vibe: '100% Lethal Suburban Roguelike' },
  { id: 'hypercolor', name: 'HYPERCOLOR', icon: '🔮', bg: '#A21CAF', textColor: '#FFFFFF', threatLevel: 'HEAT-SHIFT', threatColor: '#E879F9', vibe: 'Thermochromic Palm-Print Shifts' },
  { id: 'pixel-matrix', name: 'PIXEL MATRIX', icon: '👾', bg: '#059669', textColor: '#FFFFFF', threatLevel: 'POLTERGEIST', threatColor: '#34D399', vibe: 'Corrupted Sprite Memory Bank' },
  { id: 'school-lasers', name: 'PHOTO LASERS', icon: '⚡', bg: '#0284C7', textColor: '#FDE047', threatLevel: 'PORTRAIT', threatColor: '#38BDF8', vibe: 'Lifetouch Geometric Crossbeams' }
];

interface EncounterWheelProps {
  isRolling: boolean;
  onStartRolling: () => void;
  onStopRolling: (winningSlice: WheelSlice) => void;
  currentSlice?: WheelSlice | null;
  className?: string;
  isExpanded?: boolean;
  onToggleExpand?: () => void;
}

export const EncounterWheel: React.FC<EncounterWheelProps> = ({
  isRolling,
  onStartRolling,
  onStopRolling,
  currentSlice,
  className = '',
  isExpanded = false,
  onToggleExpand
}) => {
  // Spin mode: 'arrow' (Stationary Wheel with Spinning Arrow) or 'wheel' (Spinning Wheel)
  const [spinMode, setSpinMode] = useState<'arrow' | 'wheel'>('arrow');
  const [rotationAngle, setRotationAngle] = useState<number>(0);
  const [winningSlice, setWinningSlice] = useState<WheelSlice | null>(currentSlice || null);
  const [isDecelerating, setIsDecelerating] = useState<boolean>(false);
  const [activeLedIndex, setActiveLedIndex] = useState<number>(0);

  const angleRef = useRef<number>(0);
  const velocityRef = useRef<number>(0);
  const animationFrameRef = useRef<number | null>(null);
  const lastTickSliceRef = useRef<number>(-1);
  const isRollingRef = useRef<boolean>(isRolling);
  const isDeceleratingRef = useRef<boolean>(isDecelerating);

  isRollingRef.current = isRolling;
  isDeceleratingRef.current = isDecelerating;

  const SLICE_COUNT = WHEEL_SLICES.length;
  const SLICE_ANGLE = 360 / SLICE_COUNT; // 22.5 degrees

  // Calculate slice pointed at
  const getSliceFromAngle = useCallback((angle: number): { index: number; slice: WheelSlice } => {
    // When spinMode === 'arrow': arrow starts at 0 pointing straight UP (-90 deg in Cartesian coordinates).
    // Angle increases clockwise.
    // When spinMode === 'wheel': wheel rotates, top pointer is at 12 o'clock.
    const normalized = spinMode === 'arrow'
      ? ((angle % 360) + 360) % 360
      : ((360 - (angle % 360)) + 360) % 360;

    const index = Math.floor((normalized + SLICE_ANGLE / 2) / SLICE_ANGLE) % SLICE_COUNT;
    return { index, slice: WHEEL_SLICES[index] };
  }, [SLICE_ANGLE, SLICE_COUNT, spinMode]);

  // Main animation physics loop
  useEffect(() => {
    if (!isRolling && !isDecelerating) {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      return;
    }

    let lastTimestamp = performance.now();

    const loop = (now: number) => {
      const dt = Math.min((now - lastTimestamp) / 1000, 0.1);
      lastTimestamp = now;

      if (isRollingRef.current && !isDeceleratingRef.current) {
        // Continuous high-speed spin: ~860 degrees per second
        velocityRef.current = 860;
        angleRef.current = (angleRef.current + velocityRef.current * dt) % 360000;
        setRotationAngle(angleRef.current);

        const { index } = getSliceFromAngle(angleRef.current);
        setActiveLedIndex(index);

        if (index !== lastTickSliceRef.current) {
          lastTickSliceRef.current = index;
          playWheelClick(800 + (index % 6) * 60);
        }

        animationFrameRef.current = requestAnimationFrame(loop);
      } else if (isDeceleratingRef.current) {
        // Realistic friction deceleration
        velocityRef.current = Math.max(0, velocityRef.current - 350 * dt);
        angleRef.current = (angleRef.current + velocityRef.current * dt) % 360000;
        setRotationAngle(angleRef.current);

        const { index, slice } = getSliceFromAngle(angleRef.current);
        setActiveLedIndex(index);

        if (index !== lastTickSliceRef.current) {
          lastTickSliceRef.current = index;
          playWheelClick(650 + (index % 4) * 80);
        }

        if (velocityRef.current <= 4) {
          // Stopped dead on spot!
          setIsDecelerating(false);
          setWinningSlice(slice);
          playWheelWin();
          playCriticalSmashSound();
          onStopRolling(slice);
          if (animationFrameRef.current) {
            cancelAnimationFrame(animationFrameRef.current);
            animationFrameRef.current = null;
          }
          return;
        }

        animationFrameRef.current = requestAnimationFrame(loop);
      }
    };

    animationFrameRef.current = requestAnimationFrame(loop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [isRolling, isDecelerating, getSliceFromAngle, onStopRolling]);

  const handleTriggerStop = () => {
    if (!isRolling || isDecelerating) return;
    setIsDecelerating(true);
  };

  const handleToggleSpin = () => {
    if (isRolling && !isDecelerating) {
      handleTriggerStop();
    } else if (!isRolling) {
      setIsDecelerating(false);
      onStartRolling();
    }
  };

  // Fixed SVG Coordinate Geometry (Large 540x540 ViewBox)
  const size = 540;
  const cx = 270;
  const cy = 270;
  const outerRimRadius = 255;
  const wheelRadius = 230;
  const hubRadius = 60;

  // Pre-calculate 16 Stationary Wedge Paths
  // Slice 0 is centered directly at 12 o'clock (-90 degrees)
  const wedges = WHEEL_SLICES.map((slice, i) => {
    const startDeg = -90 - SLICE_ANGLE / 2 + i * SLICE_ANGLE;
    const endDeg = startDeg + SLICE_ANGLE;

    const startRad = (startDeg * Math.PI) / 180;
    const endRad = (endDeg * Math.PI) / 180;

    const x1 = cx + wheelRadius * Math.cos(startRad);
    const y1 = cy + wheelRadius * Math.sin(startRad);
    const x2 = cx + wheelRadius * Math.cos(endRad);
    const y2 = cy + wheelRadius * Math.sin(endRad);

    const pathData = `M ${cx} ${cy} L ${x1} ${y1} A ${wheelRadius} ${wheelRadius} 0 0 1 ${x2} ${y2} Z`;

    const midDeg = startDeg + SLICE_ANGLE / 2;
    const midRad = (midDeg * Math.PI) / 180;

    // Fix inverted text: text on bottom/left half (90 deg to 270 deg) is flipped 180 deg so it's always readable upright!
    const normalizedDeg = ((midDeg % 360) + 360) % 360;
    const isUpsideDown = normalizedDeg > 90 && normalizedDeg < 270;
    const labelRotation = isUpsideDown ? midDeg + 180 : midDeg;

    // Text label position along center of slice wedge
    const textDist = wheelRadius * 0.65;
    const textX = cx + textDist * Math.cos(midRad);
    const textY = cy + textDist * Math.sin(midRad);

    // Peg position at wedge border
    const pegDist = wheelRadius - 3;
    const pegX = cx + pegDist * Math.cos(startRad);
    const pegY = cy + pegDist * Math.sin(startRad);

    // Chaser LED position on outer rim
    const ledDist = outerRimRadius - 10;
    const ledX = cx + ledDist * Math.cos(midRad);
    const ledY = cy + ledDist * Math.sin(midRad);

    return {
      slice,
      index: i,
      pathData,
      textX,
      textY,
      midDeg,
      labelRotation,
      pegX,
      pegY,
      ledX,
      ledY
    };
  });

  const currentActiveSlice = getSliceFromAngle(rotationAngle).slice;
  const activeSector = (isRolling || isDecelerating) ? currentActiveSlice : (winningSlice || currentActiveSlice);

  return (
    <div className={`relative flex flex-col items-center select-none font-mono ${className}`}>
      {/* Header Bar */}
      <div className="w-full flex flex-wrap items-center justify-between pb-3 mb-3 border-b border-zinc-800 text-xs gap-2">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-pink-500 animate-pulse shadow-[0_0_10px_#ec4899]" />
          <span className="font-black text-yellow-300 text-sm tracking-widest uppercase">
            ★ 199X RETRO ENCOUNTER WHEEL ★
          </span>
          <span className="px-2 py-0.5 rounded bg-black text-[10px] text-cyan-300 border border-cyan-500/50 font-bold">
            16 FUN SLICES
          </span>
        </div>

        <div className="flex items-center gap-2">
          {/* Spin Mode Selector */}
          <div className="inline-flex rounded-lg bg-zinc-900 border border-zinc-800 p-0.5 text-[10px] font-bold">
            <button
              type="button"
              onClick={() => setSpinMode('arrow')}
              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                spinMode === 'arrow' 
                  ? 'bg-yellow-400 text-black font-black' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Stationary Wheel with Spinning Arrow"
            >
              🎯 STATIONARY WHEEL
            </button>
            <button
              type="button"
              onClick={() => setSpinMode('wheel')}
              className={`px-2 py-1 rounded transition-colors cursor-pointer ${
                spinMode === 'wheel' 
                  ? 'bg-cyan-400 text-black font-black' 
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
              title="Spinning Wheel with Top Needle"
            >
              🎡 ROTATING WHEEL
            </button>
          </div>

          {winningSlice && !isRolling && !isDecelerating && (
            <span className="text-[11px] font-bold text-emerald-300 bg-emerald-950/80 px-2.5 py-1 rounded border border-emerald-500/60 shadow-sm flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
              <span>HIT: {winningSlice.icon} {winningSlice.name}</span>
            </span>
          )}

          {onToggleExpand && (
            <button
              type="button"
              onClick={onToggleExpand}
              className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 border border-zinc-700 cursor-pointer"
              title={isExpanded ? "Collapse Wheel" : "Expand Wheel"}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          )}
        </div>
      </div>

      {/* PROMINENT TOP TARGET SECTOR HUD BILLBOARD (Makes it 100% clear what it landed on!) */}
      <div 
        className="w-full mb-3 p-3 sm:p-4 rounded-2xl border-2 transition-all duration-300 shadow-2xl relative overflow-hidden"
        style={{
          backgroundColor: '#090a12',
          borderColor: activeSector.threatColor,
          boxShadow: `0 0 30px ${activeSector.threatColor}40, inset 0 0 20px ${activeSector.bg}30`
        }}
      >
        {/* Retro scanline overlay */}
        <div className="absolute inset-0 pointer-events-none bg-[repeating-linear-gradient(0deg,transparent,transparent_2px,rgba(0,0,0,0.3)_3px)] opacity-60 z-10" />

        <div className="relative z-20 flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-5">
          {/* Left: Giant Sector Icon + Name Display */}
          <div className="flex items-center gap-3.5 sm:gap-4 min-w-0 w-full sm:w-auto">
            {/* Sector Giant Icon Box */}
            <div 
              className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl flex items-center justify-center text-3xl sm:text-4xl shrink-0 border-2 shadow-xl transition-all duration-200"
              style={{
                backgroundColor: activeSector.bg,
                borderColor: activeSector.threatColor,
                boxShadow: `0 0 25px ${activeSector.threatColor}70`
              }}
            >
              <span>{activeSector.icon}</span>
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[10px] font-mono font-bold tracking-widest text-zinc-400 uppercase">
                  {isRolling ? (isDecelerating ? 'TARGET BRAKING ONTO' : 'SECTOR IN RETICLE') : '★ TARGET SECTOR ACQUIRED ★'}
                </span>
                <span 
                  className="px-2 py-0.5 rounded text-[9px] font-mono font-black uppercase text-black shadow-xs"
                  style={{ backgroundColor: activeSector.threatColor }}
                >
                  {activeSector.threatLevel}
                </span>
              </div>

              {/* GIANT UNMISTAKABLE SECTOR NAME */}
              <h3 
                className="text-2xl sm:text-3xl font-black font-sans uppercase tracking-tight truncate drop-shadow-[0_2px_8px_rgba(0,0,0,0.9)]"
                style={{ color: activeSector.threatColor }}
              >
                {activeSector.name}
              </h3>

              <p className="text-xs font-mono text-zinc-300 truncate">
                {activeSector.vibe}
              </p>
            </div>
          </div>

          {/* Right: Lock Status Telemetry Box */}
          <div className="flex sm:flex-col items-center sm:items-end justify-between w-full sm:w-auto gap-2 shrink-0 border-t sm:border-t-0 border-zinc-800/80 pt-2 sm:pt-0">
            <div className="text-left sm:text-right font-mono">
              <span className="text-[9px] text-zinc-400 uppercase block">RETICLE LOCK</span>
              <span className="text-xs sm:text-sm font-black text-yellow-300">
                {isRolling ? (isDecelerating ? '🛑 BRAKING...' : '⚡ 860 RPM') : '✓ SPOT LOCKED'}
              </span>
            </div>
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-black/80 border border-zinc-800">
              <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: activeSector.threatColor }} />
              <span className="text-[9.5px] font-mono text-zinc-300 uppercase font-bold">
                {spinMode === 'arrow' ? 'STATIONARY WHEEL' : 'ROTATING WHEEL'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Main Wheel Viewport: Large, Stationary, and Fully Centered */}
      <div className="relative flex items-center justify-center p-1 sm:p-3 w-full max-w-[560px]">
        {/* Top Needle for 'wheel' mode only */}
        {spinMode === 'wheel' && (
          <div 
            className="absolute top-0 z-30 pointer-events-none drop-shadow-[0_6px_12px_rgba(0,0,0,0.9)]"
            style={{ top: '8px' }}
          >
            <svg width="40" height="48" viewBox="0 0 40 48" fill="none">
              <polygon points="20,44 4,6 36,6" fill="#FFE600" stroke="#000000" strokeWidth="3" />
              <polygon points="20,38 8,10 32,10" fill="#EF4444" />
              <circle cx="20" cy="10" r="5" fill="#FFE600" stroke="#000000" strokeWidth="2" />
              <circle cx="20" cy="10" r="2" fill="#FFFFFF" />
            </svg>
          </div>
        )}

        {/* 540x540 High-Definition SVG Wheel */}
        <svg 
          viewBox={`0 0 ${size} ${size}`}
          className="w-full h-auto max-w-[520px] filter drop-shadow-[0_0_35px_rgba(0,0,0,0.95)] cursor-pointer select-none"
          onClick={handleToggleSpin}
        >
          {/* Heavy Outer Metallic Gold Fleer Ultra Ring */}
          <circle 
            cx={cx} 
            cy={cy} 
            r={outerRimRadius} 
            fill="#090a10" 
            stroke="#FFE600" 
            strokeWidth="9" 
          />
          <circle 
            cx={cx} 
            cy={cy} 
            r={outerRimRadius - 6} 
            fill="none" 
            stroke="#00F0FF" 
            strokeWidth="2.5" 
          />
          <circle 
            cx={cx} 
            cy={cy} 
            r={wheelRadius + 2} 
            fill="#000000" 
            stroke="#000000" 
            strokeWidth="2" 
          />

          {/* Slices Group: 
              If spinMode === 'arrow': Slices remain 100% STATIONARY!
              If spinMode === 'wheel': Slices rotate around the exact center (cx, cy)! */}
          <g 
            transform={spinMode === 'wheel' ? `rotate(${rotationAngle}, ${cx}, ${cy})` : undefined}
          >
            {wedges.map((w) => {
              const isTargetSlice = !isRolling && !isDecelerating && winningSlice?.id === w.slice.id;
              const isPassingSlice = isRolling && currentActiveSlice.id === w.slice.id;

              return (
                <g key={w.slice.id}>
                  {/* Slice Wedge */}
                  <path
                    d={w.pathData}
                    fill={w.slice.bg}
                    stroke={isTargetSlice ? '#FFE600' : '#000000'}
                    strokeWidth={isTargetSlice ? 5 : 2.5}
                    opacity={isTargetSlice ? 1.0 : (isPassingSlice ? 1.0 : 0.88)}
                    className="transition-all"
                  />

                  {/* Radial Label and Icon with Upright Text Flip */}
                  <g transform={`translate(${w.textX}, ${w.textY}) rotate(${w.labelRotation})`}>
                    <text
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill={w.slice.textColor}
                      fontSize="12.5"
                      fontWeight="900"
                      fontFamily="monospace"
                      letterSpacing="0.5"
                      stroke="#000000"
                      strokeWidth="1.2"
                      paintOrder="stroke"
                    >
                      {w.slice.icon} {w.slice.name}
                    </text>
                  </g>

                  {/* Perimeter Brass Separator Peg */}
                  <circle
                    cx={w.pegX}
                    cy={w.pegY}
                    r={isTargetSlice ? "6" : "5"}
                    fill={isTargetSlice ? "#FFFFFF" : "#FFE600"}
                    stroke="#000000"
                    strokeWidth="2"
                  />
                  <circle
                    cx={w.pegX}
                    cy={w.pegY}
                    r="2"
                    fill={isTargetSlice ? "#FFE600" : "#FFFFFF"}
                  />
                </g>
              );
            })}
          </g>

          {/* Perimeter Chaser LED Bulbs */}
          {wedges.map((w, idx) => {
            const isLit = (activeLedIndex === idx) || (!isRolling && !isDecelerating && winningSlice?.id === w.slice.id);
            return (
              <circle
                key={`led-${idx}`}
                cx={w.ledX}
                cy={w.ledY}
                r={isLit ? "5.5" : "3.5"}
                fill={isLit ? "#FFE600" : "#3f3f46"}
                stroke="#000000"
                strokeWidth="1"
                className="transition-all"
                filter={isLit ? "drop-shadow(0 0 6px #ffe600)" : undefined}
              />
            );
          })}

          {/* SPINNER ARROW:
              When spinMode === 'arrow' (STATIONARY WHEEL), this needle spins rapidly around the center! */}
          {spinMode === 'arrow' && (
            <g transform={`rotate(${rotationAngle}, ${cx}, ${cy})`}>
              {/* Arrow Shaft / Pointer pointing straight up toward 12 o'clock */}
              <polygon
                points={`${cx},${cy - wheelRadius + 18} ${cx - 16},${cy - 48} ${cx + 16},${cy - 48}`}
                fill="#FFE600"
                stroke="#000000"
                strokeWidth="3.5"
                filter="drop-shadow(0 0 10px rgba(255,230,0,0.8))"
              />
              <polygon
                points={`${cx},${cy - wheelRadius + 28} ${cx - 10},${cy - 44} ${cx + 10},${cy - 44}`}
                fill="#EF4444"
              />

              {/* Counter-weight tail */}
              <polygon
                points={`${cx},${cy + 52} ${cx - 14},${cy + 24} ${cx + 14},${cy + 24}`}
                fill="#EC4899"
                stroke="#000000"
                strokeWidth="2.5"
              />
              <line
                x1={cx}
                y1={cy - 48}
                x2={cx}
                y2={cy + 24}
                stroke="#00F0FF"
                strokeWidth="6"
                strokeLinecap="round"
              />
            </g>
          )}

          {/* Center 3D Hub Button */}
          <circle 
            cx={cx} 
            cy={cy} 
            r={hubRadius} 
            fill="#090a10" 
            stroke="#FFE600" 
            strokeWidth="6" 
          />
          <circle 
            cx={cx} 
            cy={cy} 
            r={hubRadius - 8} 
            fill={isRolling ? (isDecelerating ? '#78350f' : '#b91c1c') : '#1e1b4b'} 
            stroke="#00F0FF" 
            strokeWidth="3" 
            className="transition-colors"
          />

          {/* Center Hub Telemetry Text */}
          <text
            x={cx}
            y={cy - 12}
            textAnchor="middle"
            fill="#FFE600"
            fontSize="14"
            fontWeight="900"
            fontFamily="monospace"
            letterSpacing="1"
          >
            {isRolling ? (isDecelerating ? 'STOPPING' : 'HIT STOP!') : 'SPIN'}
          </text>
          <text
            x={cx}
            y={cy + 12}
            textAnchor="middle"
            fill="#00F0FF"
            fontSize="12"
            fontWeight="900"
            fontFamily="monospace"
          >
            {isRolling ? (isDecelerating ? '...' : 'THE SPOT!') : 'WHEEL'}
          </text>
        </svg>
      </div>

      {/* Primary Strike Control Button: "KEEP GOING UNTIL I HIT SPOT" */}
      <div className="w-full max-w-lg mt-3 flex flex-col items-center gap-2.5">
        <button
          type="button"
          onClick={handleToggleSpin}
          disabled={isDecelerating}
          className={`w-full py-3.5 px-6 rounded-2xl font-mono font-black text-sm sm:text-base uppercase tracking-wider transition-all duration-200 flex items-center justify-center gap-2.5 shadow-2xl cursor-pointer active:scale-95 ${
            isRolling
              ? isDecelerating
                ? "bg-amber-600 text-yellow-100 border-2 border-amber-300 animate-pulse shadow-[0_0_30px_rgba(217,119,6,0.7)]"
                : "bg-red-600 hover:bg-red-500 text-white border-2 border-yellow-300 shadow-[0_0_35px_rgba(239,68,68,0.85)] animate-bounce"
              : "bg-gradient-to-r from-pink-600 via-purple-600 to-cyan-600 hover:from-pink-500 hover:to-cyan-400 text-white border-2 border-yellow-400 shadow-[0_0_25px_rgba(236,72,153,0.6)]"
          }`}
        >
          {isRolling ? (
            isDecelerating ? (
              <>
                <RotateCw className="w-5 h-5 animate-spin text-yellow-300" />
                <span>DECELERATING TO THE SPOT...</span>
              </>
            ) : (
              <>
                <span className="w-4 h-4 rounded-full bg-yellow-300 animate-ping inline-block" />
                <span className="text-yellow-200 font-black">🛑 HIT STOP! // HIT THE SPOT!</span>
              </>
            )
          ) : (
            <>
              <Dices className="w-5 h-5 text-yellow-300" />
              <span>SPIN ENCOUNTER WHEEL (RUNS UNTIL STOPPED)</span>
            </>
          )}
        </button>

        {/* Live Sector Feed & Telemetry */}
        <div className="w-full bg-black/85 border border-zinc-800 rounded-xl px-4 py-2 flex items-center justify-between text-[11px] text-zinc-300 font-mono shadow-inner">
          <div className="flex items-center gap-2 truncate">
            <span className="text-yellow-400 font-bold uppercase shrink-0">SECTOR STATUS:</span>
            {isRolling ? (
              <span className="text-pink-400 font-bold animate-pulse truncate">
                {isDecelerating 
                  ? `DECELERATING ONTO ${currentActiveSlice.icon} ${currentActiveSlice.name}...` 
                  : `CONTINUOUS ${spinMode === 'arrow' ? 'ARROW' : 'WHEEL'} ROTATION (HIT STOP TO LOCK SPOT)`}
              </span>
            ) : winningSlice ? (
              <span className="truncate">
                LOCKED ON <strong className="text-yellow-300 font-bold">{winningSlice.icon} {winningSlice.name}</strong> • <span className="text-cyan-300">{winningSlice.vibe}</span>
              </span>
            ) : (
              <span className="text-zinc-500">READY • CLICK TO SPIN CONTINUOUSLY</span>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0 ml-2 font-bold">
            <span className="text-zinc-500 text-[9px] uppercase">{spinMode} MODE</span>
            <span className="text-cyan-400">{isRolling ? '860 RPM' : 'IDLE'}</span>
          </div>
        </div>
      </div>
    </div>
  );
};
