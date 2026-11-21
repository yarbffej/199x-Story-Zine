import React, { useState, useRef } from 'react';
import { RotateCw, Sparkles, Download } from 'lucide-react';
import html2canvas from 'html2canvas-pro';
import { ZineIssueData } from '../engine/zineEngine';
import { playZineBlip, playZineResonanceChime } from '../utils/audio';

interface HoloBoosterPackProps {
  issue: ZineIssueData;
  surfaceBg: string;
  ink: string;
  accent1: string;
  accent1Ink: string;
  accent2: string;
  accent2Ink: string;
  accent3: string;
  accent3Ink: string;
}

type HoloCardStyle = 'sugar-glitter' | 'halo-silver' | 'prism-relic';

interface SingleHoloCardSpec {
  id: string;
  style: HoloCardStyle;
  superLabel: string;
  title: string;
  footerLeft: string;
  footerRight: string;
  artUrl?: string;
  stats: { str: number; spd: number; eng: number; psy: number };
  backTitle: string;
  backDesc: string;
  backTags: Array<{ label: string; value: string }>;
  cardCode: string;
}

const HoloCollectorCard: React.FC<{ spec: SingleHoloCardSpec }> = ({ spec }) => {
  const [flipped, setFlipped] = useState(false);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0, fx: 50, fy: 50, active: false });
  const [savingPng, setSavingPng] = useState(false);
  const cardFrontRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    const rx = (y / (rect.height / 2)) * -12;
    const ry = (x / (rect.width / 2)) * 12;
    const fx = Math.round(((x + rect.width / 2) / rect.width) * 100);
    const fy = Math.round(((y + rect.height / 2) / rect.height) * 100);
    setTilt({ rx, ry, fx, fy, active: true });
  };

  const handleMouseLeave = () => {
    setTilt({ rx: 0, ry: 0, fx: 50, fy: 50, active: false });
  };

  const handleFlip = () => {
    playZineBlip(flipped ? 760 : 940);
    setFlipped((f) => !f);
  };

  const handleDownloadCardPng = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!cardFrontRef.current || savingPng) return;
    playZineResonanceChime();
    setSavingPng(true);
    try {
      const cvs = await html2canvas(cardFrontRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: null,
      });
      const link = document.createElement('a');
      const slug = spec.title.replace(/[^a-zA-Z0-9]+/g, '_').replace(/^_|_$/g, '');
      link.download = `199X_HOLO_CARD_${spec.cardCode.replace('#', '')}_${slug}.png`;
      link.href = cvs.toDataURL('image/png');
      link.click();
    } catch {
      // ignore export failure
    } finally {
      setSavingPng(false);
    }
  };

  const frameClass =
    spec.style === 'sugar-glitter'
      ? 'holo-frame-glitter'
      : spec.style === 'halo-silver'
      ? 'holo-frame-silver'
      : 'holo-frame-prism';

  const { str, spd, eng, psy } = spec.stats;

  return (
    <div className="flex flex-col items-center gap-2.5 w-full">
      <div
        onClick={handleFlip}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ perspective: '1150px' }}
        className="w-full max-w-[325px] aspect-[5/7] select-none cursor-pointer"
      >
        <div
          style={{
            transformStyle: 'preserve-3d',
            transform: flipped
              ? `rotateY(180deg) rotateX(${tilt.rx * 0.35}deg)`
              : `rotateX(${tilt.rx}deg) rotateY(${tilt.ry}deg) ${
                  tilt.active ? 'scale3d(1.03, 1.03, 1.03)' : 'scale3d(1, 1, 1)'
                }`,
            transition: tilt.active
              ? 'transform 85ms ease-out'
              : 'transform 520ms cubic-bezier(0.22, 1, 0.36, 1)',
          }}
          className="relative w-full h-full rounded-[18px] shadow-[0_18px_38px_rgba(0,0,0,0.6)]"
        >
          {/* ==================== FRONT FACE ==================== */}
          <div
            ref={cardFrontRef}
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
            }}
            className={`absolute inset-0 w-full h-full rounded-[18px] p-[11px] overflow-hidden ${frameClass}`}
          >
            {/* Dynamic Mouse-Tracking Rainbow Holographic Glare */}
            <div
              style={{
                background: `linear-gradient(${
                  112 + tilt.ry * 2.5
                }deg, transparent 5%, rgba(255,0,127,0.34) 24%, rgba(0,240,255,0.44) 46%, rgba(255,230,0,0.46) 66%, transparent 92%)`,
                backgroundSize: '210% 210%',
                backgroundPosition: `${tilt.fx}% ${tilt.fy}%`,
                mixBlendMode: 'color-dodge',
              }}
              className="pointer-events-none absolute inset-0 z-30 opacity-65"
            />

            {spec.style === 'halo-silver' ? (
              /* ---------- STYLE B: "HALO SILVER" DIAMOND STAT CREST LAYOUT (card_purple_halo_it.jpg) ---------- */
              <div className="relative z-10 w-full h-full rounded-[10px] border-[2.5px] border-[#111] bg-[#161925] p-[5px] flex flex-col justify-between shadow-inner">
                <div className="w-full h-full rounded-[7px] border-[1.5px] border-[#d4af37]/80 flex flex-col justify-between overflow-hidden bg-[#171d2d]">
                  {/* Top Diamond Stat Crest + Beveled Silver Foil Name */}
                  <div className="relative px-2.5 py-2 bg-gradient-to-b from-[#1e2640] to-[#111526] border-b-[2px] border-[#d4af37]/70 flex items-center gap-2.5 min-h-[60px]">
                    {/* Iconic 4-Quadrant Gold Diamond Stat Crest */}
                    <div className="relative w-[46px] h-[46px] shrink-0 flex items-center justify-center">
                      <div className="w-[34px] h-[34px] rotate-45 bg-gradient-to-br from-[#f6e3a1] via-[#d4af37] to-[#a67c23] border-[2px] border-[#111] shadow-md flex items-center justify-center">
                        <div className="-rotate-45 grid grid-cols-2 w-full h-full text-[10px] font-mono font-black text-[#111] leading-none place-items-center p-0.5">
                          <span>{str}</span>
                          <span>{spd}</span>
                          <span>{eng}</span>
                          <span>{psy}</span>
                        </div>
                      </div>
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="text-[9px] font-mono font-bold uppercase tracking-widest text-cyan-300/90">
                        {spec.superLabel}
                      </div>
                      <h4 className="font-display font-black text-base sm:text-[18px] uppercase leading-[1.02] tracking-tight truncate silver-bevel-text">
                        {spec.title}
                      </h4>
                    </div>
                  </div>

                  {/* Center Framed Artwork */}
                  <div className="relative flex-1 m-1.5 rounded-[5px] border-[2px] border-[#111] bg-black overflow-hidden">
                    {spec.artUrl ? (
                      <img
                        src={spec.artUrl}
                        alt={spec.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400 font-mono text-xs p-3 text-center">
                        Drop Storyboard Sheet to Populate Holo Art
                      </div>
                    )}
                    <div className="pointer-events-none absolute inset-0 ring-1 ring-inset ring-white/20" />
                  </div>

                  {/* Bottom Framed Cream/Gold Stat Strip */}
                  <div className="mx-1.5 mb-1.5 px-2 py-1.5 rounded-[4px] border-[2px] border-[#111] bg-gradient-to-r from-[#f3ead1] via-[#fbf5e3] to-[#ead9b0] text-[#111] text-center shadow-sm">
                    <div className="font-mono font-black text-[10px] sm:text-[11px] tracking-tight uppercase">
                      STR {str} - SPD {spd} - ENG {eng} - PSY {psy}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* ---------- STYLE A & C: "SUGAR HIGH" GLITTER-SWIRL + LED DIGITAL STAT BAR (card_champion_eagle_sugar_high.jpg) ---------- */
              <div className="relative z-10 w-full h-full rounded-[12px] bg-[#0e0f14] border-[2px] border-black/80 p-2.5 flex flex-col justify-between overflow-hidden text-white shadow-inner">
                {/* Top Arcade Gold-to-Red Retro Block Title */}
                <div className="space-y-0.5 pb-1.5">
                  <div className="flex items-center justify-between gap-1">
                    <span className="font-mono-zine text-[10px] font-black uppercase tracking-widest arcade-gold-text">
                      {spec.superLabel}
                    </span>
                    <span className="font-mono-zine text-[9px] font-bold text-zinc-400">
                      {spec.cardCode}
                    </span>
                  </div>
                  <h4 className="font-display font-black text-lg sm:text-[21px] uppercase leading-[0.98] tracking-tight truncate arcade-gold-text">
                    {spec.title}
                  </h4>
                </div>

                {/* Center Heavy-Inked Art Window */}
                <div className="relative flex-1 rounded-[10px] border-[2.5px] border-zinc-400/70 bg-black overflow-hidden shadow-lg">
                  {spec.artUrl ? (
                    <img
                      src={spec.artUrl}
                      alt={spec.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-zinc-400 font-mono text-xs p-3 text-center">
                      Drop Storyboard Sheet to Populate Holo Art
                    </div>
                  )}

                  {/* Iconic Bottom Floating Holographic Pill with Circular Vortex Emblem + LED 7-Segment Stats */}
                  <div className="absolute bottom-2 left-2 right-2 rounded-xl border-[2px] border-[#111] holo-foil-pill p-1 flex items-center gap-1.5 shadow-[0_4px_12px_rgba(0,0,0,0.65)]">
                    {/* Circular Holo Emblem */}
                    <div className="w-9 h-9 rounded-full border-[2px] border-[#111] bg-gradient-to-tr from-[#3b0764] via-[#06b6d4] to-[#facc15] flex items-center justify-center shrink-0 shadow-inner">
                      <div className="w-5 h-5 rounded-full border-2 border-[#111] bg-black/75 flex items-center justify-center">
                        <Sparkles className="w-3 h-3 text-yellow-300" />
                      </div>
                    </div>

                    {/* Digital LED Stat Readout */}
                    <div className="flex-1 min-w-0">
                      <div className="text-[8px] font-mono font-black uppercase text-[#111] tracking-wider leading-none mb-0.5 text-center">
                        199X POWER STATS
                      </div>
                      <div className="grid grid-cols-4 gap-0.5 bg-[#0b0c10] rounded-md px-1 py-0.5 border border-black text-center font-mono font-black text-xs leading-tight">
                        <span className="text-[#fde047]">{str}</span>
                        <span className="text-[#38bdf8]">{spd}</span>
                        <span className="text-[#ff2a85]">{eng}</span>
                        <span className="text-[#a3e635]">{psy}</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Bottom Metallic Class Footer */}
                <div className="pt-1.5 flex items-center justify-between gap-2 text-[10px] font-display font-black uppercase tracking-wider">
                  <span className="text-amber-300/90 italic truncate">{spec.footerLeft}</span>
                  <span className="text-sky-400 italic truncate">{spec.footerRight}</span>
                </div>
              </div>
            )}
          </div>

          {/* ==================== BACK FACE (180° FLIP DOSSIER) ==================== */}
          <div
            style={{
              backfaceVisibility: 'hidden',
              WebkitBackfaceVisibility: 'hidden',
              transform: 'rotateY(180deg)',
            }}
            className={`absolute inset-0 w-full h-full rounded-[18px] p-[11px] overflow-hidden ${frameClass}`}
          >
            <div className="w-full h-full rounded-[12px] bg-[#10121b] border-[2px] border-black p-3.5 flex flex-col justify-between text-white">
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[10px] font-mono-zine border-b border-white/15 pb-1.5">
                  <span className="px-2 py-0.5 rounded bg-[#FFE600] text-black font-black uppercase">
                    {spec.cardCode}
                  </span>
                  <span className="text-cyan-300 font-bold uppercase flex items-center gap-1">
                    <RotateCw className="w-3 h-3" /> Tap to Flip
                  </span>
                </div>
                <h4 className="font-display text-base font-black uppercase text-yellow-300 leading-tight">
                  {spec.backTitle}
                </h4>
                <p className="text-[11px] leading-relaxed text-zinc-200 font-medium line-clamp-5">
                  {spec.backDesc}
                </p>
              </div>

              <div className="space-y-1.5 text-[10px] font-mono-zine">
                {spec.backTags.map((t) => (
                  <div
                    key={t.label}
                    className="p-2 rounded-lg bg-black/70 border border-white/15 flex justify-between gap-2"
                  >
                    <span className="text-zinc-400 uppercase shrink-0">{t.label}:</span>
                    <span className="text-cyan-300 font-bold truncate text-right">{t.value}</span>
                  </div>
                ))}
              </div>

              <div className="grid grid-cols-4 gap-1 pt-1.5 border-t border-white/15 text-center font-mono text-[10px] font-black">
                <div className="p-1 rounded bg-pink-600/30 border border-pink-400/50">
                  STR {str}
                </div>
                <div className="p-1 rounded bg-cyan-600/30 border border-cyan-400/50">
                  SPD {spd}
                </div>
                <div className="p-1 rounded bg-yellow-500/30 border border-yellow-400/50">
                  ENG {eng}
                </div>
                <div className="p-1 rounded bg-lime-600/30 border border-lime-400/50">
                  PSY {psy}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tiny Action Row Beneath Each Card */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={handleFlip}
          className="px-2.5 py-1 rounded-lg border-2 theme-border bg-black/80 text-white font-mono-zine text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer hover:brightness-125"
        >
          <RotateCw className="w-3 h-3" /> {flipped ? 'Front' : 'Flip Back'}
        </button>
        <button
          type="button"
          onClick={(e) => void handleDownloadCardPng(e)}
          disabled={savingPng}
          className="px-2.5 py-1 rounded-lg border-2 theme-border bg-[#FFE600] text-black font-mono-zine text-[10px] font-bold uppercase flex items-center gap-1 cursor-pointer hover:brightness-105"
          title="Save this holographic card as a high-res PNG"
        >
          <Download className="w-3 h-3" /> {savingPng ? 'Saving...' : 'Save PNG'}
        </button>
      </div>
    </div>
  );
};

export const HoloBoosterPack: React.FC<HoloBoosterPackProps> = ({
  issue,
  surfaceBg,
  ink,
  accent1,
  accent1Ink,
  accent2,
  accent2Ink,
  accent3,
  accent3Ink,
}) => {
  const baseStats = issue.encounter.impel_ratings || {
    strength: 5,
    speed: 6,
    energy: 6,
    psychic: 5,
  };
  const clampStat = (n: number) => Math.max(1, Math.min(9, n));
  const shots = issue.galleryUrls || [];
  const issuePad = String(issue.issueNumber).padStart(2, '0');

  const cards: SingleHoloCardSpec[] = [
    {
      id: 'hero',
      style: 'sugar-glitter',
      superLabel: '199X OPERATIVE',
      title: issue.characterName,
      footerLeft: '199X SERIES 2',
      footerRight: 'HERO OPERATIVE',
      artUrl: shots[2] || shots[0] || issue.cardImageUrl,
      stats: {
        str: clampStat(baseStats.strength),
        spd: clampStat(baseStats.speed + 1),
        eng: clampStat(baseStats.energy),
        psy: clampStat(baseStats.psychic),
      },
      backTitle: issue.characterFull,
      backDesc: issue.acts.intervention.split('\n\n')[0] || issue.encounter.cosmic_distortion,
      backTags: [
        { label: 'Sector', value: issue.sectorTag },
        { label: 'Weapon', value: issue.weapon },
        { label: 'Relic', value: issue.artifact },
      ],
      cardCode: `#${issuePad}-A`,
    },
    {
      id: 'villain',
      style: 'halo-silver',
      superLabel: 'OMEGA ANOMALY',
      title: issue.anomalyName,
      footerLeft: '199X SERIES 2',
      footerRight: 'BAD GUY THREAT',
      artUrl: shots[1] || shots[2] || issue.cardImageUrl,
      stats: {
        str: clampStat(baseStats.strength + 1),
        spd: clampStat(baseStats.speed),
        eng: clampStat(baseStats.energy + 1),
        psy: clampStat(baseStats.psychic + 1),
      },
      backTitle: issue.anomalyName,
      backDesc: issue.encounter.cosmic_distortion,
      backTags: [
        { label: 'Location', value: issue.location },
        { label: 'Debuff', value: issue.encounter.status_affliction },
        { label: 'Class', value: issue.classification },
      ],
      cardCode: `#${issuePad}-B`,
    },
    {
      id: 'relic',
      style: 'prism-relic',
      superLabel: 'SYNERGY RELIC FOIL',
      title: issue.synergy,
      footerLeft: '199X ARTIFACT',
      footerRight: 'HOLO INSERT',
      artUrl: shots[3] || shots[0] || issue.cardImageUrl,
      stats: {
        str: clampStat(baseStats.strength),
        spd: clampStat(baseStats.speed),
        eng: clampStat(baseStats.energy + 2),
        psy: clampStat(baseStats.psychic + 1),
      },
      backTitle: `${issue.artifact} + ${issue.weapon}`,
      backDesc: issue.acts.aftermath.split('\n\n')[0] || issue.encounter.cosmic_distortion,
      backTags: [
        { label: 'Synergy', value: issue.synergy },
        { label: 'Relic', value: issue.artifact },
        { label: 'Weapon', value: issue.weapon },
      ],
      cardCode: `#${issuePad}-C`,
    },
  ];

  return (
    <section
      style={{ backgroundColor: surfaceBg, color: ink }}
      className="pop-card p-5 sm:p-8 space-y-6"
    >
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <span
              style={{ backgroundColor: accent1, color: accent1Ink }}
              className="px-3 py-1 rounded-full border-2 theme-border font-mono-zine text-xs font-black uppercase -rotate-1"
            >
              ✨ ISSUE #{issuePad} HOLOGRAPHIC BOOSTER PACK
            </span>
            <span
              style={{ backgroundColor: accent2, color: accent2Ink }}
              className="px-3 py-1 rounded-full border-2 theme-border font-mono-zine text-xs font-bold uppercase"
            >
              3 COLLECTIBLE FOIL CARDS
            </span>
          </div>
          <h3 className="font-display text-2xl sm:text-4xl font-extrabold uppercase tracking-tight">
            Crystallized Aftermath Holographic Cards
          </h3>
          <p className="text-xs sm:text-sm font-semibold opacity-80">
            Hover to tilt the rainbow holographic foil, click any card to flip 180° for its field dossier, or save individual card PNGs!
          </p>
        </div>

        <span
          style={{ backgroundColor: accent3, color: accent3Ink }}
          className="px-3 py-1.5 rounded-xl border-2 theme-border font-mono-zine text-xs font-bold uppercase"
        >
          🦸 Hero + 👾 Villain + ⚡ Synergy Relic
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-7 place-items-center pt-1">
        {cards.map((card) => (
          <HoloCollectorCard key={card.id} spec={card} />
        ))}
      </div>
    </section>
  );
};
