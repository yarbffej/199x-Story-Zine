import { CombatEncounter, CardThemeType } from '../types';
import { ZinePaletteId, getZinePalette } from '../data/zinePalettes';
import { getChoreographyPresetsForCard } from './choreography';

export interface ZineActs {
  sceneSetup: string;     // 3 rich paragraphs (Act 01)
  intervention: string;   // 3 rich paragraphs (Act 02)
  aftermath: string;      // 3 rich paragraphs (Act 03)
}

export interface ZinePrompts {
  masterStoryboard2x2Prompt: string;
  sameChatGif1FollowupPrompt: string;
  sameChatGif2FollowupPrompt: string;
  sameChatVideoFollowupPrompt: string;
  sameChatOutroVideoPrompt: string;
  leadVideo16x9: string;
  shot01WideArchitecture: string;
  shot02AnomalyPortrait: string;
  shot03LowAngleAction: string;
  shot04TabletopGearFlatlay: string;
  gif01Act1TensionLoop: string;
  gif02Act3AftermathLoop: string;
  synthSongPrompt: string;
  storyGeneratorPrompt: string;
}

export interface ZineIssueData {
  id: string;
  issueNumber: number;
  hexSeed: string;
  title: string;
  classification: string;
  sectorTag: string;
  actPhase: string;
  location: string;
  anomalyName: string;
  characterName: string;
  characterFull: string;
  weapon: string;
  artifact: string;
  synergy: string;
  lightingMood: string;
  cameraAngle: string;
  witnessPerspective: string;
  artStyle: string;
  zinePaletteId: ZinePaletteId;
  encounter: CombatEncounter;
  acts: ZineActs;
  prompts: ZinePrompts;
  // Hydrated Runtime Media URLs (Object URLs or Data URIs)
  videoUrl?: string;
  outroVideoUrl?: string;
  galleryUrls: (string | undefined)[]; // [shot01, shot02, shot03, shot04]
  gifUrl?: string;
  gifUrl2?: string;
  audioUrl?: string;
  audioTitle?: string;
  cardImageUrl?: string;
  cardVideoUrl?: string;
}

const BRAND_FREE_REPLACEMENTS: Array<[RegExp, string]> = [
  [/\bKB Toys\b/gi, 'retro mall toy depot'],
  [/\bBlockbuster\b/gi, 'midnight VHS rental outlet'],
  [/\bChuck E\.?\s*Cheese(?:'s)?\b/gi, 'animatronic pizza arcade'],
  [/\bLA Gear\b/gi, 'neon light-up high-top'],
  [/\bWalkman\b/gi, 'portable cassette player'],
  [/\bDiscman\b/gi, 'portable anti-skip CD player'],
  [/\bGame\s*Boy\b/gi, 'translucent 8-bit handheld console'],
  [/\bNintendo\s*64|\bN64\b/gi, 'atomic-purple 64-bit console'],
  [/\bSuper\s*Soaker\b/gi, 'pressurized neon hydro-blaster'],
  [/\bPolaroid\b/gi, 'instant-film camera'],
  [/\bTrapper\s*Keeper\b/gi, 'velcro geometric 3-ring binder'],
  [/\bRollerblade(?:s)?\b/gi, 'neon inline skates'],
  [/\bMaglite\b/gi, 'heavy anodized aluminum flashlight'],
  [/\bSlush\s*Puppie|\bSlush\s*Puppy\b/gi, 'neon slushie dispenser'],
  [/\b Discovery\s*Zone\b/gi, 'tubular indoor foam-pit playzone'],
  [/\bAOL\b/gi, '56k dial-up trial disc'],
  [/\bSuncoast\b/gi, 'mall cinema tape boutique'],
  [/\bScholastic\b/gi, 'elementary school book-fair'],
  [/\bPOG(?:s)?\b/gi, 'holographic milk-cap slammer'],
  [/\bBop-It\b/gi, 'plastic rhythm-command toy'],
  [/\bSkip-It\b/gi, 'counter-weighted ankle-spinner toy'],
];

export function sanitizeBrandFree(text: string): string {
  let out = text || '';
  for (const [pattern, replacement] of BRAND_FREE_REPLACEMENTS) {
    out = out.replace(pattern, replacement);
  }
  return out;
}

function hashString(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return Math.abs(h);
}

function pickSeeded<T>(arr: T[], seed: number, offset: number = 0): T {
  return arr[Math.abs(seed + offset * 31) % arr.length];
}

export function buildLongForm3ActChronicle(
  encounter: CombatEncounter,
  anomalyOverride?: string
): ZineActs {
  const location = encounter.location || 'K&B Novelty Depot clearance aisle at 8:59 PM';
  const charFull = encounter.featured_character || "Dex 'Neon-Drift' Kowalski (199X Suburban Recon Operative)";
  const charShort = charFull.split('(')[0].trim() || 'The Operative';
  const anomaly =
    anomalyOverride ||
    encounter.anomaly_name ||
    (encounter.card_type === 'bad_guy'
      ? encounter.entity_name
      : 'Residual Dimensional Rift Anomaly');
  const weapon = encounter.protagonist_loadout?.improvised_weapon || 'modified hardware rig';
  const artifact = encounter.protagonist_loadout?.nostalgia_artifact || 'retro pocket artifact';
  const synergy = encounter.protagonist_loadout?.weird_synergy_effect || 'Harmonic Overdrive Resonance';
  const distortion = encounter.cosmic_distortion || 'Fluorescent ceiling tubes hum at impossible dimensional frequencies.';
  const affliction = encounter.status_affliction || 'Static-Shock Hallucinations';
  const ticker0 = encounter.combat_ticker?.[0] || `${anomaly} destabilizes the local suburban grid.`;
  const ticker1 = encounter.combat_ticker?.[1] || `${charShort} locks ${artifact} and ${weapon} into active phase alignment.`;

  const seed = hashString(`${encounter.entity_name}|${location}|${weapon}|${artifact}`);

  const act1Openers = [
    `At exactly one minute before closing time, ${location} had already slipped halfway out of standard suburban time and into something buzzing, airless, and electric. Along the scuffed checkerboard linoleum, forty-watt fluorescent ballast tubes flickered in an uneven three-beat cadence, casting pools of bruised violet and sodium-amber shadow between the deserted fixtures. Outside in the sodium-lit parking lot, not a single station wagon or hatchback moved; inside, the air tasted sharply of warm CRT ozone, floor wax, and copper coins.`,
    `Nobody in the neighborhood ever lingered around ${location} once the sun dropped behind the cul-de-sac treeline, and tonight the silence felt thick enough to snap like an over-wound cassette ribbon. Rows of forgotten 1990s hardware and sun-bleached display racks stretched toward the back exit in rigid perspective lines, bathed in the sickly cyan wash of an idling transformer box. Even the dust motes hanging beneath the ceiling vents had stopped drifting, pinned in mid-air by an invisible barometric drop.`,
    `The hum began forty feet beneath the concrete slab of ${location}, rising up through the metal shelving brackets until every loose price tag and wire rack vibrated in sympathetic harmony. Overhead, rain ticked against the skylights in slow, deliberate intervals, throwing streaked neon reflections across the empty corridor. It was the unmistakable signature of a late-night suburban breach—the exact moment mundane 199X architecture begins peeling at the corners.`,
  ];

  const act1Middles = [
    `${charShort} stepped past the threshold with boots planted light on the tiles, keeping one gloved hand resting near the ${weapon} while checking the analog readout rigged to the ${artifact}. Across the sector, the first unmistakable symptoms of ${affliction} were already taking hold: shadows detached themselves by half an inch from the objects casting them, and a faint static charge raised the fine hairs along ${charShort}'s forearms. ${distortion}`,
    `Crouching beside an overturned plastic crate to read the micro-vibrations in the floor, ${charShort} unclipped the ${artifact} and held it level toward the darkest recess of ${location}. Instead of normal ambient room noise, the air carried a low magnetic warble—the telltale carrier wave of ${affliction} saturating the building's wiring. Every reflective surface within thirty yards rippled like dark soda water as ${distortion.charAt(0).toLowerCase() + distortion.slice(1)}`,
    `From the far end of ${location}, a cold draft smelling of scorched circuit boards and cherry fog-machine vapor rolled low across the floor tiles. ${charShort} adjusted the strap of the ${weapon}, watching the indicator LEDs on the ${artifact} climb rapidly into the red zone as ${affliction} began warping depth perception down the corridor. Right on cue, ${distortion.charAt(0).toLowerCase() + distortion.slice(1)}`,
  ];

  const act1Closers = [
    `Then the ambient hum cut out completely, replaced by a sub-audible pressure wave that bowed the ceiling tiles inward. Out of the deepest pocket of shadow at the heart of ${location}, ${anomaly} began to uncoil into physical space, bending the surrounding neon glare around its silhouette like a lens. ${ticker0} There would be no backup from town tonight—only whatever improvised 199X engineering ${charShort} carried on their belt.`,
    `At the center of the warped geometry, space fractured with the crisp snap of an overloaded flyback transformer. ${anomaly} surged into full material density, radiating chromatic shockwaves that turned drifting dust into glittering geometric sparks across ${location}. ${ticker0} ${charShort} exhaled once, steadied their stance, and Thumb-clicked the ${artifact} into live combat calibration.`,
    `Before the emergency exit sign could finish its third blink, the breach locked into full manifestation. Towering amidst the skewed architecture of ${location}, ${anomaly} announced its arrival with a bone-rattling kinetic pulse that rattled every bolt in the framing. ${ticker0} Narrowing their eyes against the glare, ${charShort} brought the ${weapon} forward to meet the surge head-on.`,
  ];

  const act2Openers = [
    `The opening clash erupted across ${location} in a burst of pure 1990s graphic-novel velocity. ${anomaly} lunged first, lashing violent arcs of anomalous energy across the middle aisle and tearing deep gouges through metal trim and laminate paneling alike. Diving laterally beneath the initial sweep, ${charShort} skidded across the polished floor on scuffed sneakers, sparks kicking up as the ${weapon} deflected the leading edge of the shockwave by millimeters.`,
    `Zero warning separated the standoff from full-throttle kinetic collision. ${anomaly} drove forward with terrifying mass and unnatural agility, warping the local gravity pocket inside ${location} until loose bolts, tokens, and shattered plastic housings orbited waist-high in the air. ${charShort} vaulted cleanly over a buckled counter, planting one boot against a structural column to launch sideways out of the anomaly's crushing trajectory.`,
    `The first shockwave from ${anomaly} slammed down the length of ${location} like a runaway freight train made of static and neon. Ceiling louvers rattled loose as ${charShort} dropped into a low, balanced slide, bracing the ${weapon} with both hands to carve a clean defensive lane through the distortion field. Every impact echoed with the amplified crunch of overloaded arcade speakers.`,
  ];

  const act2Middles = [
    `With zero room left to retreat, ${charShort} slammed the ${artifact} directly against the housing of the ${weapon}, bridging their circuits in an audacious field modification. Instantly, the improvised coupling ignited ${synergy}—flooding the corridor with a brilliant counter-frequency halo that pushed back the crushing weight of ${affliction}. ${ticker1} Arcs of electric cyan and hot magenta energy danced along the length of the ${weapon}, turning everyday suburban salvage into a precision anomaly-breaker.`,
    `Remembering an old late-night schematic scribbled in the margins of a spiral notebook, ${charShort} twisted the dial on the ${artifact} past its factory stop and locked it onto the frame of the ${weapon}. The resulting feedback loop triggered ${synergy} with a deafening harmonic chord that rattled every pane of glass in ${location}. ${ticker1} Caught flat-footed by the sudden phase-shift, ${anomaly} recoiled as its outer distortion shield fractured like tempered ice.`,
    `Timing the pulse between two erratic voltage spikes, ${charShort} pressed the ${artifact} flush into the grip assembly of the ${weapon}. A blinding ribbon of chromatic resonance roared to life as ${synergy} engaged at peak output, slicing cleanly through the haze of ${affliction}. ${ticker1} For three heart-stopping seconds, the entire interior of ${location} lit up like a pinball playfield on jackpot multiball.`,
  ];

  const act2Closers = [
    `Pushing that momentum to the limit, ${charShort} sprinted up an inclined rack and drove a decisive, grounded strike straight through the core anchor sustaining ${anomaly}. No wasted motion, no theatricalflourish—just raw leverage, high-voltage synergy, and split-second 199X reflexes meeting cosmic impossibility at point-blank range. With a thunderous implosion of harmless prism sparks, the dimensional tether anchoring the breach snapped clean in two.`,
    `Refusing to let the anomaly re-anchor, ${charShort} planted both heels into the floor tiles and unleashed the full stored charge of ${synergy} from the ${weapon}. The beam met ${anomaly} dead-center, unraveling its chaotic form into harmless ribbons ofphosphorescent vapor that spiraled toward the rafters and vanished. One final shockwave rolled outward through ${location}, blowing open the double doors before dropping into sudden, ringing stillness.`,
    `In one fluid, grounded finish, ${charShort} pivoted behind a steel stanchion and channeled the surging resonance of the ${artifact} through the ${weapon}, pinning ${anomaly}'s dimensional rift until its unstable geometry collapsed inward on itself. A brilliant flash of ultraviolet and gold washed across the walls of ${location}, etching crisp comic-book silhouettes against every surface before the breach sealed shut with an audible vacuum pop.`,
  ];

  const act3Openers = [
    `Silence returned to ${location} all at once—not the heavy, suffocating dread of the breach, but the crisp, familiar quiet of a late 1990s night after a summer thunderstorm passes. Overhead, half the fluorescent strips hummed steadily back to warm white life while cool night air drifted in through a cracked transom window, carrying the faint smell of wet asphalt and pine needles. The oppressive grip of ${affliction} evaporated completely.`,
    `As the final ribbons of chromatic static dissolved above the rafters of ${location}, normal suburban gravity reasserted itself with a gentle clatter of settling plastic and brass tokens. The warped perspective lines along the floor tiles snapped smoothly back into true ninety-degree angles, leaving only faint scorch crescents and a dusting of iridescent frost where ${anomaly} had stood moments earlier.`,
    `For a long minute, the only sound inside ${location} was the rhythmic tick of cooling metal housings and the distant hum of a streetlamp ballast out by the curb. ${charShort} remained crouched in a textbook grounded stance until every sensor needle on the ${artifact} settled back to zero, confirming that the local spacetime seam had fused shut for good.`,
  ];

  const act3Middles = [
    `Lowering the ${weapon}, ${charShort} uncoupled the warm casing of the ${artifact} and blew a thin wisp of ozone smoke off its contacts. Despite running way past any sane voltage rating to sustain ${synergy}, the retro hardware held together with electrical tape, solder, and sheer 199X stubbornness. Across the room, the bizarre distortions that had twisted ${location} were already fading into ordinary scuff marks that the morning shift would blame on a faulty floor buffer.`,
    `Standing up and brushing glittering dimensional grit from their jacket sleeves, ${charShort} ran a quick diagnostic check over the ${weapon} and tucked the ${artifact} safely back into a padded utility pouch. Without the ambient surge feeding ${synergy}, the gear looked almost ordinary again—just beat-up 1990s neighborhood salvage carrying hairline heat-tints that proved what had happened here.`,
    `${charShort} walked the perimeter of ${location} once to make sure no secondary micro-rifts lingered behind the shelving bays. Beneath the sole of one sneaker, a handful of brass arcade tokens and fused plastic shards clinked across the tile—physical souvenirs from a clash nobody on the daytime town council would ever believe.`,
  ];

  const act3Closers = [
    `Right at the exact focal point where ${anomaly} had vanished, a single rectangle of condensed prismatic cardstock rested face-up on the floor, shimmering with a fresh Series 2 holographic foil sheen. ${charShort} scooped up the newly crystallized trading card, slipped it into a protective binder sleeve, and shouldered the ${weapon}. By the time the distant town clock struck the hour, ${location} stood quiet and secure—logged, archived, and ready for the next issue.`,
    `Resting squarely atop a scarred countertop at the center of ${location} was the unmistakable glint of a freshly minted Series 2 archival card, its embossed surface still warm from the dimensional collapse. ${charShort} pocketed the specimen alongside the ${artifact}, gave the quiet room one final nod, and stepped out under the sodium-orange streetlights into the cool 199X night.`,
    `Before slipping out the side service door of ${location}, ${charShort} spotted a gleaming prismatic card wedged neatly beside a cooled brass token—the unmistakable physical imprint left behind whenever an Omega-class anomaly is neutralized. Sliding the card into their jacket pocket and slinging the ${weapon} low, ${charShort} disappeared down the misty sidewalk before the first patrol headlights turned the corner.`,
  ];

  return {
    sceneSetup: [
      pickSeeded(act1Openers, seed, 1),
      pickSeeded(act1Middles, seed, 2),
      pickSeeded(act1Closers, seed, 3),
    ].join('\n\n'),
    intervention: [
      pickSeeded(act2Openers, seed, 4),
      pickSeeded(act2Middles, seed, 5),
      pickSeeded(act2Closers, seed, 6),
    ].join('\n\n'),
    aftermath: [
      pickSeeded(act3Openers, seed, 7),
      pickSeeded(act3Middles, seed, 8),
      pickSeeded(act3Closers, seed, 9),
    ].join('\n\n'),
  };
}

function extractStoryBeat(actText: string, paragraphIdx: number, maxLen: number = 220): string {
  const paragraphs = (actText || '')
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
  const chosen = paragraphs[Math.min(paragraphIdx, Math.max(0, paragraphs.length - 1))] || '';
  const firstSentence = chosen.split(/(?<=[.!?])\s+/)[0] || chosen;
  const cleaned = sanitizeBrandFree(firstSentence).replace(/\s+/g, ' ').trim();
  return cleaned.length > maxLen ? `${cleaned.slice(0, maxLen).trim()}...` : cleaned;
}

const FEMALE_HERO_PATTERN =
  /\b(maya|samira|chloe|tessa|cassie|kira|wendy|trixie|jenny|angela|brenda|valerie|nadia|brooke|tara|cindy|roxie|elena|sonia|evelyn|becca|lunch lady|sarah|jessica|amanda|ashley|rachel|emily|hannah|megan|nicole|stephanie|heather|melissa|michelle|tiffany|amber|kimberly|christina|kelly|erin|laura|maria|lisa|karen|nancy|donna|susan|woman|female|girl|lady|queen|mom|mother|sister|she|her)\b/i;

const VETERAN_AGE_PATTERN =
  /\b(coach|officer|professor|arthur|dale|brenda|big mike|sgt|frank|dr\.|evelyn|stan|lunch lady|hank|detective|novak|wade|president|teacher|veteran|dad|warden|orthodontist)\b/i;

export function buildConsistentHeroVisualLock(charClean: string): {
  genderNoun: 'female' | 'male';
  pronounSubj: 'she' | 'he';
  pronounPoss: 'her' | 'his';
  shortRole: string;
  lockedSheet: string;
} {
  const match = charClean.match(/^([^(]+?)(?:\s*\((.+)\))?$/);
  const shortName = (match?.[1] || charClean).trim();
  const traitRaw = (
    match?.[2] || '1990s suburban recon scout in authentic nineties streetwear'
  ).trim();
  const seed = hashString(shortName.toLowerCase());

  const isFemale = FEMALE_HERO_PATTERN.test(charClean);
  const isVeteran = VETERAN_AGE_PATTERN.test(charClean);
  const genderNoun: 'female' | 'male' = isFemale ? 'female' : 'male';
  const pronounSubj: 'she' | 'he' = isFemale ? 'she' : 'he';
  const pronounPoss: 'her' | 'his' = isFemale ? 'her' : 'his';

  const ageBuild = isFemale
    ? isVeteran
      ? 'determined adult woman in her late 30s, athletic build'
      : 'athletic young woman in her early 20s, sharp expressive features'
    : isVeteran
    ? 'rugged adult man in his early 40s, sturdy athletic build'
    : 'athletic young man in his early 20s, sharp expressive features';

  const femaleHair = [
    'shoulder-length chestnut-brown hair held back with neon clips',
    'chin-length jet-black angled bob haircut with bangs',
    'wavy copper-auburn hair tied in a high 1990s ponytail',
    'shoulder-length layered dark-blonde hair',
    'curly dark-brown hair pulled half-back',
    'short tousled espresso-brown shag haircut',
  ];
  const maleHair = [
    'short messy dark-brown 1990s parted curtains hair',
    'spiky jet-black hair',
    'short sandy-blonde hair under a backward 1990s cap',
    'wavy dark-chestnut hair pushed back',
    'clean dark buzz-fade haircut',
    'chin-length tousled brown grunge hair',
  ];
  const hairDesc = pickSeeded(isFemale ? femaleHair : maleHair, seed, 1);

  const traitLower = traitRaw.toLowerCase();
  let topDesc = '';
  if (traitLower.includes('windbreaker')) {
    topDesc = 'teal-and-magenta geometric 1990s nylon windbreaker zipped halfway over a white tee';
  } else if (traitLower.includes('leather flight jacket')) {
    topDesc = 'scuffed dark-brown 1990s leather flight jacket over a gray crew tee';
  } else if (traitLower.includes('denim vest')) {
    topDesc = 'studded blue denim vest over a charcoal hoodie with fingerless gloves';
  } else if (traitLower.includes('track jacket')) {
    topDesc = 'navy-and-crimson striped 1990s athletic track jacket';
  } else if (traitLower.includes('sensor vest')) {
    topDesc = 'neon-trimmed blacklight laser-tag vest over a purple long-sleeve shirt';
  } else if (traitLower.includes('crimson gi')) {
    topDesc = 'sleeveless crimson martial-arts gi top with black belt';
  } else if (traitLower.includes('corduroy')) {
    topDesc = 'tan corduroy blazer over a plaid button-down shirt';
  } else if (traitLower.includes('flannel')) {
    topDesc = 'red-and-black plaid 1990s flannel overshirt over a dark graphic-free tee';
  } else if (traitLower.includes('coveralls')) {
    topDesc = 'slate-blue mechanic coveralls rolled at the sleeves';
  } else if (traitLower.includes('spandex')) {
    topDesc = 'neon-cobalt 1990s aerobics jacket over athletic gear';
  } else {
    topDesc = pickSeeded(
      [
        'color-blocked teal-and-plum 1990s nylon windbreaker over a heather-gray tee',
        'faded indigo 1990s denim jacket with rolled sleeves over a crimson ringer tee',
        'forest-green and gold 1990s varsity bomber jacket',
        'charcoal-and-cyan 1990s retro track jacket',
        'burgundy overshirt jacket over a black turtleneck',
        'cobalt-blue 1990s utility vest over a white long-sleeve tee',
      ],
      seed,
      2
    );
  }

  const bottomDesc = traitLower.includes('inline skates') || traitLower.includes('rollerblade')
    ? 'baggy dark-wash 1990s jeans, knee pads, and neon inline skates'
    : pickSeeded(
        [
          'baggy dark-wash 1990s denim jeans and white-and-neon high-top sneakers',
          'charcoal 1990s cargo pants and scuffed black skate sneakers',
          'cuffed stonewashed blue jeans and retro cross-trainer sneakers',
        ],
        seed,
        3
      );

  const lockedSheet = `SINGLE CONSISTENT ${genderNoun.toUpperCase()} HERO (${ageBuild}, ${hairDesc}, wearing ${topDesc} with ${bottomDesc}; archetype: ${traitRaw} — strictly ONLY ONE human hero in frame, never change ${pronounPoss} gender, hair, or outfit)`;

  return {
    genderNoun,
    pronounSubj,
    pronounPoss,
    shortRole: traitRaw,
    lockedSheet,
  };
}

function buildConsistentVillainVisualLock(
  anomaly: string,
  morphologyBadge: string
): string {
  const seed = hashString(anomaly.toLowerCase());
  const glowPalette = pickSeeded(
    [
      'bioluminescent toxic-lime and electric-magenta energy veins',
      'crackling ultraviolet-purple and arc-cyan plasma filaments',
      'molten amber-gold and neon-crimson dimensional fractures',
      'radioactive turquoise and hot-pink phosphor tendrils',
    ],
    seed,
    4
  );
  const surfaceDetail = pickSeeded(
    [
      'glossy mutated 1990s plastic-and-ooze carapace',
      'warped chrome, tangled magnetic tape, and jagged crystalline plating',
      'hulking biomechanical chassis fused with glowing CRT glass and cables',
      'towering semi-translucent ectoplasmic mass with sharp geometric shards',
    ],
    seed,
    5
  );
  return `CONSISTENT BAD GUY MONSTER ("${anomaly}": a menacing 1990s comic-book ${morphologyBadge.toLowerCase()} villain with ${surfaceDetail} and ${glowPalette})`;
}

export function compile199xZinePrompts(
  encounter: CombatEncounter,
  acts?: ZineActs,
  anomalyOverride?: string
): ZinePrompts {
  const rawLocation = encounter.location || 'retro suburban novelty store clearance aisle at 8:59 PM';
  const location = sanitizeBrandFree(rawLocation);
  const rawAnomaly =
    anomalyOverride ||
    encounter.anomaly_name ||
    (encounter.card_type === 'bad_guy'
      ? encounter.entity_name
      : 'Sentient Neon Rift Anomaly');
  const anomaly = sanitizeBrandFree(rawAnomaly);
  const rawChar = encounter.featured_character || "Dex 'Neon-Drift' Kowalski";
  const charClean = sanitizeBrandFree(rawChar);
  const weapon = sanitizeBrandFree(
    encounter.protagonist_loadout?.improvised_weapon || 'modified retro hardware weapon'
  );
  const artifact = sanitizeBrandFree(
    encounter.protagonist_loadout?.nostalgia_artifact || 'retro 1990s pocket gadget'
  );
  const synergy = sanitizeBrandFree(
    encounter.protagonist_loadout?.weird_synergy_effect || 'Harmonic Overdrive Aura'
  );
  const style = sanitizeBrandFree(
    encounter.visual_style ||
      '1990s Dark Horse indie graphic novel ink-and-watercolor illustration'
  );
  const distortion = sanitizeBrandFree(
    encounter.cosmic_distortion || 'Fluorescent lights hum at dimensional frequencies.'
  );

  // Pull exact narrative beats from Act 01, Act 02, and Act 03 so every prompt follows the story!
  const resolvedActs = acts || buildLongForm3ActChronicle(encounter, rawAnomaly);
  const act1SceneBeat = extractStoryBeat(resolvedActs.sceneSetup, 0);
  const act1TensionBeat = extractStoryBeat(resolvedActs.sceneSetup, 1);
  const act1EmergenceBeat = extractStoryBeat(resolvedActs.sceneSetup, 2);
  const act2SynergyBeat = extractStoryBeat(resolvedActs.intervention, 1);
  const act2ClimaxBeat = extractStoryBeat(resolvedActs.intervention, 2);
  const act3CalmBeat = extractStoryBeat(resolvedActs.aftermath, 0);
  const act3SouvenirBeat = extractStoryBeat(resolvedActs.aftermath, 2);

  const { morphology, environment, presets } = getChoreographyPresetsForCard(
    rawAnomaly,
    rawLocation,
    'bad_guy',
    weapon,
    artifact,
    rawChar
  );
  const leadPreset = presets[0];

  const charMatch = charClean.match(/^([^(]+?)(?:\s*\((.+)\))?$/);
  const charShortName = (charMatch?.[1] || charClean).trim();
  const heroLock = buildConsistentHeroVisualLock(charClean);
  const villainLock = buildConsistentVillainVisualLock(anomaly, morphology.badge);

  const anonymizeCharInBeat = (beat: string) =>
    charShortName
      ? beat
          .split(charShortName)
          .join(`the ${heroLock.genderNoun} operative`)
          .split(charShortName.replace(/['"]/g, ''))
          .join(`the ${heroLock.genderNoun} operative`)
      : beat;

  const safeAct1Scene = anonymizeCharInBeat(act1SceneBeat);
  const safeAct1Tension = anonymizeCharInBeat(act1TensionBeat);
  const safeAct1Emergence = anonymizeCharInBeat(act1EmergenceBeat);
  const safeAct2Synergy = anonymizeCharInBeat(act2SynergyBeat);
  const safeAct2Climax = anonymizeCharInBeat(act2ClimaxBeat);
  const safeAct3Calm = anonymizeCharInBeat(act3CalmBeat);
  const safeAct3Souvenir = anonymizeCharInBeat(act3SouvenirBeat);

  const leadAudioClean = sanitizeBrandFree(leadPreset.audio);

  const styleGuard = `Visual style: Rendered in ${style}, bold 1990s Western graphic novel ink contour lines, rich gouache shading, and vivid neon rim-lighting (${environment.lightingCue}). Brand-free 1990s aesthetic: strictly NO readable text, NO lettering, NO brand logos, NO speech bubbles, NO watermarks, NO anime/chibi tropes, and NO borders.`;

  // 1. Image 01 (Act 01 Opening): Wide establishing shot with our exact locked Good Guy entering the warped suburban location
  const shot01WideArchitecture = `Wide 16:9 architectural establishing concept illustration following Act 01 of the story ("${safeAct1Scene}"). Expansive 1990s suburban interior/exterior geometry inside ${location} with flickering fluorescent fixtures, wet floor reflections, and spatial warping (${distortion}). In the foreground aisle, ${heroLock.lockedSheet} steps cautiously into the sector holding ${artifact} and ${weapon}, scanning the shadows ahead. ${styleGuard}`;

  // 2. Image 02 (Act 01->02 Breach): Dramatic Bad Guy villain reveal portrait
  const shot02AnomalyPortrait = `Dramatic 16:9 close-up monster villain portrait illustrating the story's breach moment ("${safeAct1Emergence}"). Exclusively showcases ${villainLock} manifesting inside ${location}, warping nearby shelves and casting eerie neon reflections across the floor. Solitary villain monster focus — zero humans in frame. ${styleGuard}`;

  // 3. Image 03 (Act 02 Showdown): Good Guy VS. Bad Guy face-off splash page!
  const shot03LowAngleAction = `Dynamic 16:9 low-angle comic-book action showdown splash page depicting Act 02 ("${safeAct2Synergy}") with BOTH the Good Guy Hero AND the Bad Guy Monster clashing in the same widescreen frame inside ${location}: on the left, ${heroLock.lockedSheet} plants ${heroLock.pronounPoss} feet and couples ${artifact} onto ${weapon}, unleashing a blazing ${synergy} energy blast straight into ${villainLock} lunging from the right in flying sparks and kinetic ink lines. ${styleGuard}`;

  // 4. Image 04 (Act 03 Aftermath): Overhead tabletop / floor macro flat-lay following Act 03's closing beat
  const shot04TabletopGearFlatlay = `Top-down 90-degree overhead macro flat-lay illustration (16:9) depicting the closing Act 03 story moment ("${safeAct3Souvenir}"): the hero's cooled 1990s retro gear (${artifact} and ${weapon}), gleaming brass arcade tokens, translucent neon slammer caps, and an unlettered blank prismatic rainbow holographic foil card resting on scuffed tiles in ${location}. Still-life objects ONLY — strictly ZERO hands, ZERO faces, ZERO characters, and ZERO readable words or logos. ${styleGuard}`;

  // 5. Story GIF #1 (Act 01 Tension Loop): Same locked Good Guy bracing as the Bad Guy's neon shadow pulses down the aisle
  const gif01Act1TensionLoop = `Generate a standalone 16:9 widescreen seamless looping video clip (3-4 seconds at 24fps, text-to-video) accompanying Act 01 ("${safeAct1Tension}"). Scene inside ${location}: ${heroLock.lockedSheet} crouches motionless in cover in the foreground holding ${artifact} as its indicator light pulses steadily, while down the flickering fluorescent aisle the ominous glowing silhouette of ${villainLock} casts pulsing neon shadows across the floor in a continuous seamless loop. Locked-off tripod camera. ${styleGuard}`;

  // 6. Story GIF #2 (Act 03 Aftermath Loop): Standalone text-to-video seamless 16:9 loop accompanying Act 03
  const gif02Act3AftermathLoop = `Generate a standalone 16:9 widescreen seamless looping video clip (3-4 seconds at 24fps, text-to-video) accompanying Act 03 ("${safeAct3Calm}"). Scene: Inside quiet, stabilized ${location}, cooled 1990s retro gear (${artifact} and ${weapon}) rests on the scuffed floor beside an unlettered prismatic rainbow holographic foil card while wisps of cyan and magenta ozone mist drift lazily through warm sodium light in a calm seamless loop. Locked-off tripod camera; still-life gear scene with no characters. ${styleGuard}`;

  // 7. Lead 16:9 Hero Cinema Video Prompt: Standalone Text-to-Video Good Guy VS. Bad Guy Climax!
  const leadVideo16x9 = `Generate a standalone 16:9 widescreen 4-second video clip from scratch (1080p, 24fps, text-to-video) depicting the Act 02 Good Guy vs. Bad Guy climax ("${safeAct2Climax}"). Setting: ${location} under ${environment.lightingCue}. Characters in frame: (1) Good Guy — ${heroLock.lockedSheet}, armed with ${weapon} and ${artifact}; facing off against (2) Bad Guy — ${villainLock}. Camera: ${leadPreset.camera}. Motion choreography (4.0s): The ${heroLock.genderNoun} hero slides into a braced stance on the left side of ${location} and fires a linear surge of ${synergy} neon energy from ${weapon} and ${artifact} straight across the aisle; on the right side, the cosmic monster recoils against ${environment.propAnchor} in a shower of sparks as both hold a dramatic, rock-steady standoff freeze. Ending directive: Grounded, definitive finish — strictly NO swirling, NO weapon twirling, NO spinning in circles, and NO floor sinking; both subjects hold their final standoff pose steady. Fluid 24fps motion with crisp comic linework. ${styleGuard} Audio: ${leadAudioClean}`;

  // 8. Story-Synced 3-Act Synth Soundtrack Prompt
  const synthSongPrompt = `1990s suburban cosmic story soundtrack (118 BPM, 45-60s instrumental) structured to follow the 3-Act Zine story in "${location}": [0:00-0:15 Act I Tension] eerie analog VHS synth drone, buzzing fluorescent hum, and creeping bass pulse; [0:15-0:42 Act II Clash] punchy FM synthwave bassline, gated 16-bit snare drums, and electric guitar power chords erupting for "${synergy}"; [0:42-0:60 Act III Aftermath] warm, nostalgic midnight synth pads and shimmering bell arpeggios fading into quiet resolution. Strictly instrumental, no vocals.`;

  // 9. External 3-Act Long-Form Story Prompt
  const storyGeneratorPrompt = `Write a rich, deadpan-weird, kinetic 1990s suburban cosmic comic-zine story (~900 words total) broken into 3 Acts with EXACTLY 3 vivid paragraphs per Act (labeled "ACT 01", "ACT 02", and "ACT 03"):
- Title: ${encounter.entity_name}
- Setting: ${location}
- Operative: ${charClean}
- Anomaly: ${anomaly}
- Retro Gear Loadout: ${artifact} + ${weapon} (Synergy: ${synergy})
- Environmental Distortion: ${distortion}
- Status Debuff: ${encounter.status_affliction}
Keep 100% authentic 1990s suburban details, tactile hardware physics, and a grounded, definitive Act 03 resolution where a holographic trading card crystallizes in the aftermath.`;

  // 0A. MASTER 1-PROMPT 2x2 SEQUENTIAL STORYBOARD SHEET (4 COMPLETELY DIFFERENT CAMERA ANGLES & MOMENTS!)
  const masterStoryboard2x2Prompt = `Generate ONE single high-resolution 16:9 widescreen 2x2 four-panel sequential graphic-novel storyboard sheet (EXACTLY 2 columns x 2 rows of equal-sized edge-to-edge panels with NO text, NO labels, NO panel numbers, NO speech bubbles, and NO thick borders) telling ONE continuous, cohesive 1990s cosmic comic story at ${location}. CRITICAL VARIETY RULE: Every one of the 4 panels MUST use a COMPLETELY DIFFERENT camera angle, distance, and location-within-the-scene — zero repeated compositions!

LOCKED CAST & STYLE ACROSS ALL 4 PANELS:
- GOOD GUY HERO: ${heroLock.lockedSheet}
- BAD GUY MONSTER: ${villainLock}
- SETTING & LIGHTING: ${location} under ${environment.lightingCue} (${distortion})
- ${styleGuard}

EXACT 4 DISTINCT CAMERA ANGLES (2x2 GRID, LEFT-TO-RIGHT, TOP-TO-BOTTOM):
- TOP-LEFT PANEL (Act I — Exterior Threshold Arrival): Wide exterior/entrance establishing shot from OUTSIDE the rain-slick glowing glass storefront/doors of ${location} at dusk/night, showing neon signage glow reflecting on wet pavement as the exact same Good Guy Hero pushes open the entrance door holding ${artifact} and ${weapon} ("${safeAct1Scene}").
- TOP-RIGHT PANEL (Act I→II — Villain Emergence Close-Up): Tight claustrophobic interior close-up portrait deep inside the back shelves/machinery of ${location}, showing ONLY the towering Bad Guy Monster ripping through warped hardware with glowing neon veins (monster only, zero humans; "${safeAct1Emergence}").
- BOTTOM-LEFT PANEL (Act II — Full-Body Showdown Clash): Dynamic wide low-angle worm's-eye battle splash inside the main floor of ${location} with BOTH the exact same Good Guy Hero braced on the left and the exact same Bad Guy Monster lunging on the right as ${artifact} + ${weapon} blast blazing ${synergy} lightning straight across the room ("${safeAct2Synergy}").
- BOTTOM-RIGHT PANEL (Act III — Overhead Tabletop Souvenir Flat-Lay): Strict 90-degree top-down overhead macro flat-lay on the scuffed linoleum floor showing the cooled ${artifact} and ${weapon} resting beside gleaming brass arcade tokens and a fanned trio of shimmering blank rainbow holographic foil trading cards (still-life objects ONLY — zero hands, zero people, zero text; "${safeAct3Souvenir}").`;

  // 0B. SAME-CHAT GIF #1 FOLLOW-UP (BRAND-NEW CUTAWAY SCENE — NEVER REPEATS PANEL 1!)
  const sameChatGif1FollowupPrompt = `Using the EXACT same 1990s graphic-novel ink art style and neon color palette from the storyboard above, generate a 4-second seamless 16:9 widescreen looping clip (24fps, no dialogue) showing a BRAND-NEW ACT I CUTAWAY SCENE (STRICTLY DO NOT repeat the storefront entrance or corridor angle from Panel 1!): Extreme macro close-up cutaway of a buzzing 1990s CRT security monitor and the hero's handheld ${artifact} hardware suddenly glitching with jagged cyan-and-magenta radar waveforms, flickering LED gauges, and tiny electrical sparks jumping off metal shelving brackets in a tense continuous loop.`;

  // 0C. SAME-CHAT GIF #2 FOLLOW-UP (BRAND-NEW CUTAWAY SCENE — NEVER REPEATS PANEL 4!)
  const sameChatGif2FollowupPrompt = `Using the EXACT same 1990s graphic-novel ink art style and lighting from the storyboard above, generate a 4-second seamless 16:9 widescreen looping clip (24fps, no dialogue) showing a BRAND-NEW ACT II→III CUTAWAY SCENE (STRICTLY DO NOT repeat the tabletop floor flat-lay from Panel 4!): Dramatic tilted upward shot looking straight up at the ceiling fluorescent light grid of ${location} as a glowing violet dimensional spacetime crack snaps shut overhead, raining down slow sparkling cyan-and-gold static embers through drifting neon mist in a hypnotic loop.`;

  // 0D. SAME-CHAT LEAD VIDEO #1 (LONGER 8-SECOND ACT II CLIMAX SHOWDOWN!)
  const sameChatVideoFollowupPrompt = `Using the EXACT same ${heroLock.genderNoun} hero, Bad Guy monster, outfit, art style, and room lighting from Panel 3 (bottom-left) of the storyboard image above, generate a FULL 8-second 16:9 widescreen cinematic video clip (24fps, 3-beat continuous action, no dialogue) bringing the Act II Good Guy vs. Bad Guy climax to life inside ${location}: [0:00-0:03] Camera tracks dynamically from behind the ${heroLock.genderNoun} hero as ${heroLock.pronounSubj} slides into a braced stance on the left and charges ${artifact} onto ${weapon} while "${anomaly}" lunges forward from the right shaking the shelving; [0:03-0:06] A massive linear beam of ${synergy} neon energy erupts across the aisle, blasting the monster backward into ${environment.propAnchor} in an explosion of comic-book ink sparks and flickering fluorescents; [0:06-0:08] The dust settles into a dramatic, grounded standoff hold with zero spinning or swirling. Bold 1990s graphic-novel ink style. Audio: ${leadAudioClean}`;

  // 0E. SAME-CHAT FINALE VIDEO #2 (8-SECOND ACT III ENDING / VICTORY OUTRO THAT CLOSES THE TALE!)
  const sameChatOutroVideoPrompt = `Using the EXACT same ${heroLock.genderNoun} hero, outfit, art style, and lighting from the storyboard above, generate a FULL 8-second 16:9 widescreen closing finale video clip (24fps, no dialogue) that ENDS the story in Act III inside ${location}: [0:00-0:03] The defeated anomaly "${anomaly}" fractures and dissolves upward into ribbons of glowing cyan, gold, and magenta holographic foil light as the warped shelves snap back to normal; [0:03-0:06] Those shimmering light ribbons condense onto the scuffed floor beside the hero's boots into three gleaming, blank rainbow holographic trading cards; [0:06-0:08] The ${heroLock.genderNoun} hero stoops, pockets the glowing holographic cards, shoulders ${weapon}, and steps calmly out through the glowing exit doors into the misty 1990s suburban night as the neon lights hum quietly. Audio: Sweeping crystalline chime dissolve, gentle card clink, soft sneaker footsteps, automatic door chime, and warm nostalgic 1990s midnight synth fade-out. No dialogue.`;

  return {
    masterStoryboard2x2Prompt,
    sameChatGif1FollowupPrompt,
    sameChatGif2FollowupPrompt,
    sameChatVideoFollowupPrompt,
    sameChatOutroVideoPrompt,
    leadVideo16x9,
    shot01WideArchitecture,
    shot02AnomalyPortrait,
    shot03LowAngleAction,
    shot04TabletopGearFlatlay,
    gif01Act1TensionLoop,
    gif02Act3AftermathLoop,
    synthSongPrompt,
    storyGeneratorPrompt,
  };
}

export function buildZineIssueFromEncounter(
  encounter: CombatEncounter,
  issueNumber: number = 1,
  existingMedia?: Partial<
    Pick<
      ZineIssueData,
      | 'videoUrl'
      | 'outroVideoUrl'
      | 'galleryUrls'
      | 'gifUrl'
      | 'gifUrl2'
      | 'audioUrl'
      | 'audioTitle'
      | 'cardImageUrl'
      | 'cardVideoUrl'
      | 'acts'
    >
  >
): ZineIssueData {
  const loc = encounter.location || 'K&B Novelty Depot clearance aisle at 8:59 PM';
  const charFull = encounter.featured_character || "Dex 'Neon-Drift' Kowalski";
  const charShort = charFull.split('(')[0].trim() || charFull;
  const anomalyName =
    encounter.anomaly_name ||
    (encounter.card_type === 'bad_guy'
      ? encounter.entity_name
      : 'Dimensional Breach Anomaly');
  const weapon =
    encounter.protagonist_loadout?.improvised_weapon || 'Improvised Hardware Rig';
  const artifact =
    encounter.protagonist_loadout?.nostalgia_artifact || '199X Pocket Artifact';
  const synergy =
    encounter.protagonist_loadout?.weird_synergy_effect || 'Harmonic Overdrive';

  const { morphology, environment, presets } = getChoreographyPresetsForCard(
    encounter.entity_name || anomalyName,
    loc,
    encounter.card_type || 'bad_guy',
    weapon,
    artifact,
    charFull
  );

  const seedNum = hashString(`${encounter.entity_name}|${loc}|${issueNumber}`);
  const hexSeed = `0x9X_${seedNum.toString(16).toUpperCase().slice(0, 6)}`;
  const pal = getZinePalette(encounter.card_theme);

  const acts = existingMedia?.acts || buildLongForm3ActChronicle(encounter, anomalyName);
  const prompts = compile199xZinePrompts(encounter, acts, anomalyName);

  return {
    id: `zine-${seedNum}-${issueNumber}`,
    issueNumber: encounter.card_number || issueNumber,
    hexSeed,
    title: encounter.entity_name,
    classification:
      encounter.card_type === 'good_guy'
        ? '199X HERO ISSUE'
        : encounter.critical_smash
        ? 'OMEGA ANOMALY SPECIAL'
        : '199X ANOMALY CHRONICLE',
    sectorTag: encounter.theme_set_badge || environment.badge.toUpperCase(),
    actPhase: `${morphology.badge} • ${encounter.status_affliction || 'CONDITION AMBER'}`,
    location: loc,
    anomalyName,
    characterName: charShort,
    characterFull: charFull,
    weapon,
    artifact,
    synergy,
    lightingMood: environment.lightingCue,
    cameraAngle: presets[0]?.camera || 'Dynamic Low-Angle 24fps Tracking Shot',
    witnessPerspective: `${charShort} • Field Loadout Recon`,
    artStyle:
      encounter.visual_style ||
      '90s Dark Horse indie graphic novel ink-and-watercolor illustration',
    zinePaletteId: pal.finishId,
    encounter,
    acts,
    prompts,
    videoUrl: existingMedia?.videoUrl,
    outroVideoUrl: existingMedia?.outroVideoUrl,
    galleryUrls: existingMedia?.galleryUrls || [undefined, undefined, undefined, undefined],
    gifUrl: existingMedia?.gifUrl,
    gifUrl2: existingMedia?.gifUrl2,
    audioUrl: existingMedia?.audioUrl,
    audioTitle:
      existingMedia?.audioTitle ||
      `199X ${encounter.theme_set_badge || 'Suburban'} Synthwave Tape`,
    cardImageUrl: existingMedia?.cardImageUrl,
    cardVideoUrl: existingMedia?.cardVideoUrl,
  };
}

/**
 * Parses a pasted 3-Act story text into sceneSetup, intervention, and aftermath.
 */
export function parsePasted3ActStory(rawText: string): ZineActs | null {
  const cleaned = rawText.trim();
  if (!cleaned || cleaned.length < 60) return null;

  // Try splitting by ACT 01 / ACT 1 / <scene_setup> markers first
  const act2Match = cleaned.match(
    /(?:^|\n)\s*(?:#+\s*)?(?:\*\*)?(?:ACT\s*0?2|ACT\s+II|<intervention>)(?:[^\n]*)\n/i
  );
  const act3Match = cleaned.match(
    /(?:^|\n)\s*(?:#+\s*)?(?:\*\*)?(?:ACT\s*0?3|ACT\s+III|<aftermath>)(?:[^\n]*)\n/i
  );

  if (act2Match?.index !== undefined && act3Match?.index !== undefined && act3Match.index > act2Match.index) {
    const rawAct1 = cleaned
      .slice(0, act2Match.index)
      .replace(/^\s*(?:#+\s*)?(?:\*\*)?(?:ACT\s*0?1|ACT\s+I|<scene_setup>)(?:[^\n]*)\n/i, '')
      .trim();
    const rawAct2 = cleaned
      .slice(act2Match.index + act2Match[0].length, act3Match.index)
      .trim();
    const rawAct3 = cleaned
      .slice(act3Match.index + act3Match[0].length)
      .trim();
    if (rawAct1 && rawAct2 && rawAct3) {
      return {
        sceneSetup: rawAct1,
        intervention: rawAct2,
        aftermath: rawAct3,
      };
    }
  }

  // Fallback: split paragraphs evenly across 3 acts
  const paragraphs = cleaned
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  if (paragraphs.length >= 3) {
    const third = Math.ceil(paragraphs.length / 3);
    return {
      sceneSetup: paragraphs.slice(0, third).join('\n\n'),
      intervention: paragraphs.slice(third, third * 2).join('\n\n'),
      aftermath: paragraphs.slice(third * 2).join('\n\n'),
    };
  }

  return {
    sceneSetup: cleaned,
    intervention: cleaned,
    aftermath: cleaned,
  };
}
