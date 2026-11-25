import { CombatEncounter, EncounterRequestParams, ImpelRatings, CardThemeType } from '../types';
import {
  VIVID_90S_HEX_COLORS,
  WEIRD_SYNERGIES,
  COSMIC_DISTORTIONS,
  STATUS_AFFLICTIONS
} from '../data/retroLibrary';
import { THEME_SETS, MUTABLE_ECHO_THEME_SETS, getThemeSetById, isMutableEchoTheme } from '../data/themeSets';
import { retroOptionManager } from '../utils/shuffleBag';
import { generateDynamicVideoPrompts } from './choreography';
import { sanitizeVisualPromptText } from './zineEngine';

let finishRotationCursor = 0;
let themeSetRotationCursor = 0;

export function getNextRotatedThemeSetId(currentThemeId?: string): string {
  const isME = isMutableEchoTheme(currentThemeId);
  const pool = isME
    ? MUTABLE_ECHO_THEME_SETS.filter(t => t.id !== 'me-all')
    : THEME_SETS.filter(t => t.id !== 'all');
  if (!pool.length) return isME ? 'me-all' : 'all';
  const currentIdx = pool.findIndex(t => t.id === currentThemeId);
  if (currentIdx >= 0) {
    return pool[(currentIdx + 1) % pool.length].id;
  }
  const picked = pool[themeSetRotationCursor % pool.length].id;
  themeSetRotationCursor++;
  return picked;
}

export function generateProceduralEncounter(
  params?: EncounterRequestParams & {
    preferredPresetIndex?: number;
    forcedFoilRarity?: 'standard' | 'silver' | 'gold' | 'prism';
    forcedCardTheme?: CardThemeType;
  }
): CombatEncounter {
  const themeId = params?.theme_set_id || retroOptionManager.getActiveThemeId() || 'all';
  const themeDef = getThemeSetById(themeId);

  const location = params?.location?.trim() || retroOptionManager.rollLocation(true, themeId);
  const rawAnomaly = params?.anomaly?.trim() || retroOptionManager.rollAnomaly(true, themeId);
  const character = params?.character?.trim() || retroOptionManager.rollCharacter(true, themeId);
  const characterShortName = character.split('(')[0].trim() || character;

  const cardType: 'bad_guy' | 'good_guy' = params?.card_type && params.card_type !== 'auto'
    ? params.card_type
    : 'bad_guy';
  const isBadGuy = cardType === 'bad_guy';

  // Resolve concrete containment gear
  const gearCombo = params?.improvised_gear?.trim() || retroOptionManager.rollGear(true, themeId);
  let artifact = "1994 Scholastic Book Fair receipt";
  let weapon = "Modified spray-adhesive canister";
  if (gearCombo.includes("+")) {
    const parts = gearCombo.split("+").map(s => s.trim());
    artifact = parts[0] || artifact;
    weapon = parts[1] || weapon;
  } else if (gearCombo) {
    weapon = gearCombo;
  }

  const synergies = WEIRD_SYNERGIES;
  const chosenSynergy = synergies[Math.floor(Math.random() * synergies.length)];

  const distortionPool = themeDef.preferredDistortions?.length ? themeDef.preferredDistortions : COSMIC_DISTORTIONS;
  const baseDistortion = distortionPool[Math.floor(Math.random() * distortionPool.length)];
  const secondSentence = isBadGuy
    ? `${rawAnomaly} emerges from the shadows with high-voltage kinetic menace, warping every surface within twenty feet.`
    : `${characterShortName} locks ${weapon} and ${artifact} into active resonance, holding the perimeter against the breach.`;
  const chosenDistortion = `${baseDistortion} ${secondSentence}`;

  const isME = isMutableEchoTheme(themeDef.id);
  const badGuyTickers = isME
    ? [
        [
          `<scene_setup> Obligation Density critical inside ${location}; ${rawAnomaly} anchors a high-tension spacetime knot.`,
          `<intervention> Reality stutters at 10-12 FPS as ME! steps through the fracture and swings the 432Hz cyan tuning blade.`,
          `<aftermath> Golden obligation tethers shatter into dithered cyan wireframe ash; ME! departs after a 0.43s pause.`
        ],
        [
          `<scene_setup> Sub-floor conduits vibrate at 80Hz across ${location} under the presence of ${rawAnomaly}.`,
          `<intervention> A silent arc of 432Hz cyan energy slices the empty space between the tethers, severing the loop.`,
          `<aftermath> Surfaces settle into 'Dry Floor' mathematical equilibrium; revisit paths permanently locked.`
        ]
      ]
    : [
        [
          `Hostile entity classification confirmed: ${rawAnomaly} has established an anchor inside ${location}.`,
          `Surveillance cameras emit 56kbps static as ${rawAnomaly} distorts local spacetime by 380 millirads.`,
          `Dimensional fracture expands rapidly; emergency sirens blare as ${baseDistortion.toLowerCase()}`
        ],
        [
          `${rawAnomaly} unleashes a blinding pulse of chromatic radiation across ${location}.`,
          `Ambient room temperature plummets by 40 degrees as the entity absorbs all electromagnetic frequencies.`,
          `Warning klaxons echo through the sector; biological sensors detect severe cosmic instability.`
        ]
      ];

  const goodGuyTickers = isME
    ? [
        [
          `<scene_setup> ${characterShortName} observes localized telemetry drift across ${location} with ${artifact}.`,
          `<intervention> Deploying ${weapon}, ${characterShortName} traces the golden obligation tether to its anchor point.`,
          `<aftermath> Severance confirmed at 432Hz; local spacetime tension drops to zero as warm equilibrium returns.`
        ],
        [
          `<scene_setup> Archival sensor link established in ${location}; ${characterShortName} logs an active spatial seam.`,
          `<intervention> ${weapon} and ${artifact} synchronize across the threshold, isolating the dimensional fracture.`,
          `<aftermath> Record ingested into the Mutable Echo Archive; no external metrics follow past the threshold.`
        ]
      ]
    : [
        [
          `Operative dispatch confirmed: ${characterShortName} arrives on scene at ${location} under condition amber.`,
          `${characterShortName} unholsters the ${weapon} and activates the ${artifact}, scanning for dimensional anomalies.`,
          `Harmonic resonance test successful: ${artifact} initiates ${chosenSynergy}, fortifying the defensive sector.`
        ],
        [
          `${characterShortName} executes a tactical advance across ${location}, surveying the shadowy perimeter.`,
          `Internal telemetry confirms full battery charge on the ${artifact}; auxiliary systems online and optimal.`,
          `${characterShortName} prepares the ${weapon} for perimeter defense, holding position with calm determination.`
        ]
      ];

  const selectedTicker = isBadGuy
    ? badGuyTickers[Math.floor(Math.random() * badGuyTickers.length)]
    : goodGuyTickers[Math.floor(Math.random() * goodGuyTickers.length)];

  const colorPool = themeDef.threatColors?.length ? themeDef.threatColors : VIVID_90S_HEX_COLORS;
  const threatColor = colorPool[Math.floor(Math.random() * colorPool.length)];
  const isCritical = Math.random() < 0.30;

  let foilRarity: 'standard' | 'silver' | 'gold' | 'prism' = 'standard';
  if (params?.forcedFoilRarity) {
    foilRarity = params.forcedFoilRarity;
  } else {
    const roll = Math.floor(Math.random() * 100) + 1;
    if (roll === 100) foilRarity = 'prism';
    else if (roll >= 95) foilRarity = 'gold';
    else if (roll >= 84) foilRarity = 'silver';
  }

  const cardThemePool = themeDef.cardThemes;
  const cardTheme: CardThemeType = params?.forcedCardTheme
    ? params.forcedCardTheme
    : cardThemePool[(finishRotationCursor++) % cardThemePool.length];
  const artStyle = params?.art_style?.trim() || retroOptionManager.rollArtStyle(true, themeId);

  const entityName = isBadGuy ? rawAnomaly : characterShortName;

  const visualPrompt = isME
    ? isBadGuy
      ? `A full-bleed 4:3 concept art illustration from the 'ME! // Mutable Echo' universe showing the anomaly/target ${rawAnomaly} anchored inside ${location}, wrapped in taut, glowing golden obligation tethers that warp local spacetime. High-contrast black ink shadows, coarse 35mm cel-animation grain, and electric cyan/magenta rim-lighting. Visual style: ${artStyle}. Strictly no readable English text, no logos, no chibi proportions, and no borders.`
      : `A full-bleed 4:3 concept art illustration from the 'ME! // Mutable Echo' universe showing ${character} inside ${location}, equipped with ${weapon} and ${artifact}, as a 432Hz cyan energy blade severs glowing golden obligation threads into dithered wireframe sparks. High-contrast black ink shadows, coarse 35mm cel-animation grain, and atmospheric volumetric mist. Visual style: ${artStyle}. Strictly no readable English text, no logos, no chibi proportions, and no borders.`
    : isBadGuy
      ? `A full-bleed 4:3 concept art illustration of the solitary cosmic anomaly ${rawAnomaly} manifesting inside ${location}. The creature looms in dramatic solo glory, surrounded by warped aisles and reality distortions. Solitary monster focus with absolutely zero human heroes or operatives in frame. Visual style: Rendered in ${artStyle}, with bold black contour inks, hyper-vibrant deeply saturated colors, rich dark shadows, and blazing neon rim-lighting. Clean edge-to-edge artwork. Strictly no text, no lettering, no logos, no speech bubbles, and no borders.`
      : `A full-bleed 4:3 concept art illustration of 199X suburban hero ${character} navigating through ${location}. Solo operative focus with authentic 1990s streetwear, equipped with ${weapon} and ${artifact}. Zero monsters or anomalies in frame. Visual style: Rendered in ${artStyle}, with deep shadows and saturated gouache. Clean edge-to-edge artwork. Strictly no text, no lettering, no logos, no speech bubbles, and no borders.`;

  // Generate morphology & environment-aware 4-second video choreography
  const { videoPrompt, flowPrompt, morphologyId, environmentId } = generateDynamicVideoPrompts({
    entityName,
    location,
    cardType,
    weapon,
    artifact,
    characterDesc: character,
    artStyle,
    preferredIndex: params?.preferredPresetIndex
  });

  const GROUNDED_ENDINGS = ['aim_hold', 'slide_cover', 'sprint_exit', 'recon_kneel', 'holster_stride'] as const;
  const rolledEnding = GROUNDED_ENDINGS[Math.floor(Math.random() * GROUNDED_ENDINGS.length)];

  const impel: ImpelRatings = {
    strength: Math.min(7, Math.max(2, Math.floor(Math.random() * 5) + 3)),
    speed: Math.min(7, Math.max(2, Math.floor(Math.random() * 5) + 2)),
    energy: Math.min(7, Math.max(3, Math.floor(Math.random() * 5) + 3)),
    psychic: isCritical ? 7 : Math.min(7, Math.max(2, Math.floor(Math.random() * 5) + 2))
  };

  const afflictionPool = themeDef.preferredAfflictions?.length ? themeDef.preferredAfflictions : STATUS_AFFLICTIONS;
  const statusAffliction = afflictionPool[Math.floor(Math.random() * afflictionPool.length)];

  return {
    entity_name: entityName,
    anomaly_name: rawAnomaly,
    location,
    cosmic_distortion: chosenDistortion,
    threat_level_color: threatColor,
    protagonist_loadout: {
      nostalgia_artifact: artifact,
      improvised_weapon: weapon,
      weird_synergy_effect: chosenSynergy
    },
    impel_ratings: impel,
    featured_character: character,
    visual_style: artStyle,
    combat_ticker: selectedTicker,
    status_affliction: statusAffliction,
    critical_smash: isCritical || foilRarity === 'prism' || foilRarity === 'gold',
    is_foil: foilRarity !== 'standard',
    card_foil_rarity: foilRarity,
    card_theme: cardTheme,
    card_type: cardType,
    visual_generation_prompt: sanitizeVisualPromptText(visualPrompt),
    video_generation_prompt: sanitizeVisualPromptText(videoPrompt),
    flow_video_prompt: sanitizeVisualPromptText(flowPrompt),
    grounded_ending_type: rolledEnding,
    theme_set_id: themeDef.id,
    theme_set_name: themeDef.name,
    theme_set_badge: themeDef.shortBadge,
    morphology_type: morphologyId,
    environment_type: environmentId
  };
}

/**
 * Generates a cohesive, non-repeating batch of cards for a specific 199X Theme Set
 * (e.g., 9-card binder page, 6-card booster pack, or 18-card mini-set).
 * Guarantees zero duplicate entities, locations, or video choreographies across the set.
 */
export function generateThemedCardSetBatch(themeId: string, count: number = 9): CombatEncounter[] {
  const themeDef = getThemeSetById(themeId);
  const locPool = [...retroOptionManager.getLocations(themeId)];
  const anomPool = [...retroOptionManager.getAnomalies(themeId)];
  const charPool = [...retroOptionManager.getCharacters(themeId)];
  const gearPool = [...retroOptionManager.getGearPresets(themeId)];
  const stylePool = [...retroOptionManager.getArtStyles(themeId)];

  // Shuffle helper
  const shuffle = <T,>(arr: T[]): T[] => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const shuffledLocs = shuffle(locPool);
  const shuffledAnoms = shuffle(anomPool);
  const shuffledChars = shuffle(charPool);
  const shuffledGear = shuffle(gearPool);

  const results: CombatEncounter[] = [];
  const batchFinishOffset = finishRotationCursor++;

  for (let i = 0; i < count; i++) {
    // 100% Bad Guy Monsters across the full 200 Bad Guy Stockpile
    const cardType: 'bad_guy' | 'good_guy' = 'bad_guy';

    // Guarantee exciting chase cards in every batch (Card #1 = Prism leader, Card #5 = Gold, #3/#8 = Silver)
    let forcedFoil: 'standard' | 'silver' | 'gold' | 'prism' = 'standard';
    if (i === 0) forcedFoil = 'prism';
    else if (i === Math.floor(count / 2)) forcedFoil = 'gold';
    else if (i === 2 || i === count - 2) forcedFoil = 'silver';

    const loc = shuffledLocs[i % shuffledLocs.length];
    const anom = shuffledAnoms[i % shuffledAnoms.length];
    const char = shuffledChars[i % shuffledChars.length];
    const gear = shuffledGear[i % shuffledGear.length];
    const style = stylePool[i % stylePool.length];
    const rotatedFinish = themeDef.cardThemes[(batchFinishOffset + i) % themeDef.cardThemes.length];

    const encounter = generateProceduralEncounter({
      location: loc,
      anomaly: anom,
      character: char,
      improvised_gear: gear,
      art_style: style,
      card_type: cardType,
      theme_set_id: themeDef.id,
      preferredPresetIndex: i, // Rotates through different choreography presets!
      forcedFoilRarity: forcedFoil,
      forcedCardTheme: rotatedFinish
    });

    // Assign theme set card index in ticker
    encounter.combat_ticker = [
      `[${themeDef.shortBadge} • SET CARD ${i + 1} OF ${count}]`,
      ...encounter.combat_ticker.slice(0, 2)
    ];

    results.push(encounter);
  }

  return results;
}
