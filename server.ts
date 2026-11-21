import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import { generateProceduralEncounter } from "./src/engine/procedural.ts";
import { generateDynamicVideoPrompts } from "./src/engine/choreography.ts";
import { buildLongForm3ActChronicle } from "./src/engine/zineEngine.ts";
import { getThemeSetById } from "./src/data/themeSets.ts";
import { retroOptionManager } from "./src/utils/shuffleBag.ts";
import { CombatEncounter, CardThemeType } from "./src/types.ts";

dotenv.config();

const app = express();
const DEFAULT_PORT = Number(process.env.PORT) || 3000;

app.use(express.json());

// Lazy-initialized Gemini client
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient && process.env.GEMINI_API_KEY) {
    aiClient = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({
    status: "ok",
    hasApiKey: Boolean(process.env.GEMINI_API_KEY),
    timestamp: new Date().toISOString()
  });
});

// Helper to normalize video prompt into two clean sections separated by a newline
function formatVideoGenerationPrompt(rawPrompt?: string, artifact?: string, entity?: string, character?: string): string {
  const defaultAudio = "Audio: Multi-layered Ultra sound design: crunching plastic impacts and whirring motorized conveyor gears, buzzing fluorescent strip lights humming in a quiet suburban store aisle, escalating into an analog 16-bit synthesizer crescendo. No spoken dialogue or vocals.";
  const antiSwirlRule = "Ending action rule: Absolute grounded finish. Strictly NO swirling, NO weapon twirling, NO spinning items in circles, and NO circular vortex loops. The subject holds their final position steady or exits frame cleanly.";

  if (!rawPrompt || !rawPrompt.trim()) {
    const visual = `Dynamic low-angle 2D layout tracking shot at 24fps in vibrant 1990s Western graphic novel and Saturday morning action cartoon style with analog VHS tape wobble, non-photorealistic. Continuous 4.0-second cinematic animation sequence. Runtime: Exactly 4.0 seconds. Encounter: ${character || 'Suburban Operative'} confronting the bizarre cosmic anomaly ${entity || 'the anomaly entity'}. Choreography: [0:00-0:02] Rapid evasive sprint across linoleum floor; [0:02-0:04] Immediate slide into stationary cover behind metal retail shelving, freezing completely motionless with weapon held tight. Visual style: Stylized 1990s Western graphic novel aesthetic. Bold ink contour linework, deep dramatic shadows, rich gouache-painted environment backgrounds, and dynamic comic action lines. Style constraint: Absolutely no anime tropes, no oversized anime eyes, no kawaii aesthetics, no 3D CGI, and no photorealistic camera physics. ${antiSwirlRule}`;
    return `${visual}\n${defaultAudio}`;
  }

  let cleaned = rawPrompt.replace(/\[\s*AUDIO[^\]]*\]/gi, '').trim();
  cleaned = cleaned.replace(/\bbrandishes\b/gi, 'steadies');
  cleaned = cleaned.replace(/\bbrandishing\b/gi, 'holding');
  cleaned = cleaned.replace(/\bspins gracefully\b/gi, 'comes to a firm halt');
  cleaned = cleaned.replace(/\bspins\b/gi, 'pivots');
  cleaned = cleaned.replace(/\bvortex\b/gi, 'distortion wave');

  const audioMarkerRegex = /(?:Audio\s*\/\s*Sound\s*Design\s*Cue\s*:\s*|Audio\s*:\s*)/i;
  const match = cleaned.match(audioMarkerRegex);

  if (match && match.index !== undefined) {
    let rawVisual = cleaned.slice(0, match.index).trim();
    if (!rawVisual.includes("NO swirling")) {
      rawVisual = `${rawVisual} ${antiSwirlRule}`;
    }
    const visualPart = rawVisual.replace(/[\s\.\,\;]+$/, '') + '.';
    let audioContent = cleaned.slice(match.index + match[0].length).trim();
    audioContent = audioContent.replace(/\[\s*AUDIO[^\]]*\]/gi, '').trim();
    audioContent = audioContent.replace(/STRICTLY INSTRUMENTAL SFX, NO SPEECH, NO VOCALS\.?/i, 'No spoken dialogue or vocals.');
    if (!/No spoken dialogue or vocals\.?$/i.test(audioContent)) {
      audioContent = audioContent.replace(/\.?$/, '. No spoken dialogue or vocals.');
    }
    return `${visualPart}\nAudio: ${audioContent}`;
  } else {
    let visualPart = cleaned;
    if (!visualPart.includes("NO swirling")) {
      visualPart = `${visualPart} ${antiSwirlRule}`;
    }
    return `${visualPart}\n${defaultAudio}`;
  }
}

// Encounter generation API
app.post("/api/encounter", async (req, res) => {
  const { location, anomaly, improvised_gear, character, art_style, card_type, theme_set_id } = req.body || {};
  const themeDef = getThemeSetById(theme_set_id);
  
  const targetCardType: 'bad_guy' | 'good_guy' = card_type && card_type !== 'auto'
    ? card_type
    : (Math.random() < 0.80 ? 'bad_guy' : 'good_guy');

  try {
    const ai = getGeminiClient();
    if (ai) {
      const systemInstruction = `ROLE: You are the art and narrative director for a high-speed, 199X suburban cosmic action-roguelike collectible card game. 
TONE & ATMOSPHERE: Deadpan, weird, kinetic, and authentic 1990s comic book aesthetic.

NARRATIVE SPECIFICATION (STRICT 2-SENTENCE MANDATE):
- cosmic_distortion: You must write EXACTLY TWO short, punchy sentences (30-40 words total).
  Sentence 1: Describe the surreal sensory and environmental breakdown of [LOCATION].
  Sentence 2: Describe the physical emergence, sound, or threat posture of [SUBJECT].
  Strictly NO single-sentence lines and NO multi-paragraph essays! Keep it razor-sharp so it fits a 3-line card dossier.

CRITICAL MANDATE — NO GOOD GUY AND BAD GUY IN SCENES TOGETHER:
You are strictly forbidden from placing a good guy (operative / hero) and a bad guy (anomaly / monster / villain) in the same scene together! Every card and generated scene has a single exclusive subject focus determined by [CARD TYPE DIRECTIVE]:
1. If card_type is 'bad_guy':
   - Focus EXCLUSIVELY on the Bad Guy / Anomaly in [LOCATION].
   - ABSOLUTELY ZERO good guys or operatives may appear anywhere in frame or choreography!
   - entity_name is the Anomaly title.
2. If card_type is 'good_guy':
   - Focus EXCLUSIVELY on the Good Guy / Operative in [LOCATION] with their retro gear.
   - ABSOLUTELY ZERO monsters or anomalies may appear anywhere in frame or choreography!
   - entity_name is the Operative's name.

VISUAL GENERATION PROMPT MANDATE (CLEAN ARTWORK ONLY):
- Generate a 4:3 full-bleed concept illustration prompt depicting ONLY the designated subject in [LOCATION].
- Single continuous undivided frame. Strictly NO split screens and NO diptychs.
- STRICT NEGATIVE DIRECTIVE: Clean edge-to-edge illustration ONLY. Absolutely no text, no lettering, no words, no logos, no watermarks, no speech bubbles, no puzzle mazes, and no borders in the artwork.
- ABSOLUTELY NO ANIME OR MANGA AESTHETICS. Focus on 90s Dark Horse, Jim Lee, or Bruce Timm Western graphic novel styles.

KINETIC 4-SECOND VIDEO CHOREOGRAPHY (GOOGLE ULTRA & FLOW COMPATIBLE):
- Runtime: Exactly 4.0 seconds at 24fps.
- Generate a dynamic, unique 4-second physical action tailored specifically to the creature's anatomy and materials:
  * If a serpent/beast: undulating coils whip conveyor belts, snapping spring-steel fangs, then freezing completely rigid against a pillar.
  * If a machine/vending/dispenser: stomping hydraulic limbs, slamming coin slots, spraying pressurized syrup, then locking all pistons motionless.
  * If a fluid/slime/ooze: bubbling across linoleum, crawling up metal racks, then flash-freezing into rigid crystalline glass in total stillness.
  * If a phantom/energy: arcing between breaker terminals, strobing overhead tubes, then dropping into grounded, motionless silence.
  * If an operative: athletic slide-turn across polished tiles, planting boots firmly against cover, locking forward aim in total stillness.
- STRICT MANDATE — NO SWIRLING: Absolutely NO weapon twirling, NO spinning in circles, and NO circular vortex loops. Holds final position rigid.

IMPEL POWER RATINGS (1-7 SCALE):
Evaluate the creature or operative and assign dynamic integer ratings from 1 to 7 for:
- strength (1 to 7)
- speed (1 to 7)
- energy (1 to 7)
- psychic (1 to 7)`;

      const prompt = `[LOCATION]: ${location || "KB Toys clearance aisle at 8:59 PM"}
[ANOMALY / BAD GUY]: ${anomaly || "Sentient Fun-Pack Slime"}
[OPERATIVE / HERO]: ${character || "Dex 'Neon-Drift' Kowalski"}
[IMPROVISED GEAR]: ${improvised_gear || "Light-up LA Gear Sneakers + Rusty Garden Shears"}
[VISUAL ART STYLE]: ${art_style || "90s Dark Horse Graphic Novel with heavy inks and dramatic shadows (Strictly Non-Anime)"}
[CARD TYPE DIRECTIVE]: ${targetCardType === 'bad_guy' ? 'BAD GUY (Focus EXCLUSIVELY on the anomaly/creature/villain. Absolutely ZERO good guys or operatives in this scene.)' : 'GOOD GUY (Focus EXCLUSIVELY on the lone hero/operative with retro gear. Absolutely ZERO bad guys or monsters in this scene.)'}`;

      const CANDIDATE_MODELS = [
        "gemini-3-flash-preview",
        "gemini-3.1-flash-lite-preview",
        "gemini-3.5-flash"
      ];

      for (const model of CANDIDATE_MODELS) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              systemInstruction,
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  card_type: {
                    type: Type.STRING,
                    enum: ["bad_guy", "good_guy"]
                  },
                  entity_name: {
                    type: Type.STRING,
                    description: "Specific title for the anomaly (if bad_guy) or operative (if good_guy)"
                  },
                  featured_character: {
                    type: Type.STRING,
                    description: "Name of the 199X operative"
                  },
                  cosmic_distortion: {
                    type: Type.STRING,
                    description: "EXACTLY two punchy sentences describing the sensory breakdown and emergence"
                  },
                  threat_level_color: {
                    type: Type.STRING,
                    description: "Vivid 1990s hex code (e.g. #FF007F, #39FF14, #00F0FF, #FFE600)"
                  },
                  protagonist_loadout: {
                    type: Type.OBJECT,
                    properties: {
                      nostalgia_artifact: { type: Type.STRING },
                      improvised_weapon: { type: Type.STRING },
                      weird_synergy_effect: { type: Type.STRING }
                    },
                    required: ["nostalgia_artifact", "improvised_weapon", "weird_synergy_effect"]
                  },
                  impel_ratings: {
                    type: Type.OBJECT,
                    properties: {
                      strength: { type: Type.INTEGER, description: "Rating 1 to 7" },
                      speed: { type: Type.INTEGER, description: "Rating 1 to 7" },
                      energy: { type: Type.INTEGER, description: "Rating 1 to 7" },
                      psychic: { type: Type.INTEGER, description: "Rating 1 to 7" }
                    },
                    required: ["strength", "speed", "energy", "psychic"]
                  },
                  combat_ticker: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Array of three short sentences describing incident telemetry"
                  },
                  status_affliction: {
                    type: Type.STRING,
                    description: "Hyper-specific 90s debuff (e.g. 'Aural Vertigo', 'Static-Seizure')"
                  },
                  critical_smash: {
                    type: Type.BOOLEAN
                  },
                  card_foil_rarity: {
                    type: Type.STRING,
                    enum: ["standard", "silver", "gold", "prism"]
                  },
                  card_theme: {
                    type: Type.STRING,
                    description: "Authentic 90s background finish ID (e.g. 'memphis-rad', 'cracked-ice', 'cyber-pcb')"
                  },
                  visual_generation_prompt: {
                    type: Type.STRING,
                    description: "Full-bleed 4:3 concept art prompt, clean illustration with zero text and single undivided frame"
                  },
                  video_generation_prompt: {
                    type: Type.STRING,
                    description: "4-second cinematic animation prompt with morphology-tailored choreography and anti-swirl finish"
                  }
                },
                required: [
                  "card_type",
                  "entity_name",
                  "cosmic_distortion",
                  "threat_level_color",
                  "protagonist_loadout",
                  "impel_ratings",
                  "combat_ticker",
                  "status_affliction",
                  "critical_smash",
                  "card_foil_rarity",
                  "card_theme",
                  "visual_generation_prompt",
                  "video_generation_prompt"
                ]
              }
            }
          });

          const text = response.text?.trim();
          if (text) {
            const parsed = JSON.parse(text) as CombatEncounter;
            parsed.card_type = parsed.card_type || targetCardType;
            if (!parsed.featured_character) {
              parsed.featured_character = character || retroOptionManager.rollCharacter();
            }

            // Fallback for Impel ratings if omitted
            if (!(parsed as any).impel_ratings) {
              (parsed as any).impel_ratings = {
                strength: Math.floor(Math.random() * 5) + 3,
                speed: Math.floor(Math.random() * 5) + 3,
                energy: Math.floor(Math.random() * 5) + 3,
                psychic: parsed.critical_smash ? 7 : Math.floor(Math.random() * 5) + 3
              };
            }

            // Collectible chase odds
            if (!parsed.card_foil_rarity || !['standard', 'silver', 'gold', 'prism'].includes(parsed.card_foil_rarity)) {
              const roll = Math.floor(Math.random() * 100) + 1;
              if (roll === 100) parsed.card_foil_rarity = 'prism';
              else if (roll >= 96) parsed.card_foil_rarity = 'gold';
              else if (roll >= 86) parsed.card_foil_rarity = 'silver';
              else parsed.card_foil_rarity = 'standard';
            }
            parsed.is_foil = parsed.card_foil_rarity !== 'standard';

            const dynamicChoreo = generateDynamicVideoPrompts({
              entityName: parsed.entity_name || (targetCardType === 'bad_guy' ? anomaly : character) || 'Subject',
              location: location || 'the suburban sector',
              cardType: parsed.card_type,
              weapon: parsed.protagonist_loadout?.improvised_weapon || 'improvised weapon',
              artifact: parsed.protagonist_loadout?.nostalgia_artifact || 'retro device',
              characterDesc: parsed.featured_character || character,
              artStyle: art_style
            });

            parsed.video_generation_prompt = formatVideoGenerationPrompt(
              parsed.video_generation_prompt || dynamicChoreo.videoPrompt,
              parsed.protagonist_loadout?.nostalgia_artifact,
              parsed.entity_name,
              parsed.featured_character
            );

            // Preserve AI's custom choreography inside flow_video_prompt if generated, or use morphology-aware choreography
            const aiVisualAction = parsed.video_generation_prompt.split('\nAudio:')[0]?.trim();
            const aiAudioPart = parsed.video_generation_prompt.split('\nAudio:')[1]?.trim() || dynamicChoreo.chosenPreset.audio;

            parsed.flow_video_prompt = aiVisualAction
              ? `Animate the provided image: Maintain exact subject likeness, environment geometry, and ${art_style || '1990s graphic novel art style'} from the source image. Camera: ${dynamicChoreo.chosenPreset.camera}. Runtime: Exactly 4.0 seconds. Action: ${aiVisualAction} Ending directive: Grounded, definitive finish. Absolutely NO swirling, NO weapon twirling, NO spinning in circles, NO circular vortex loops, and NO sinking or melting downward into the floor! The subject holds their final position completely rigid or exits frame cleanly. Fluid 24fps motion, smooth easing, no texture jitter. Audio: ${aiAudioPart}`
              : dynamicChoreo.flowPrompt;

            parsed.location = location || 'K&B Novelty Depot clearance aisle at 8:59 PM';
            parsed.theme_set_id = themeDef.id;
            parsed.theme_set_name = themeDef.name;
            parsed.theme_set_badge = themeDef.shortBadge;
            parsed.morphology_type = dynamicChoreo.morphologyId;
            parsed.environment_type = dynamicChoreo.environmentId;
            if (!parsed.card_theme || !themeDef.cardThemes.includes(parsed.card_theme as CardThemeType)) {
              parsed.card_theme = themeDef.cardThemes[Math.floor(Math.random() * themeDef.cardThemes.length)];
            }

            return res.json(parsed);
          }
        } catch (modelErr: unknown) {
          console.log(`Model ${model} issue, testing candidate fallback...`);
        }
      }
    }
  } catch (_err) {
    console.log("Encounter generation switching to procedural engine fallback.");
  }

  // Fallback to procedural generator
  const fallback = generateProceduralEncounter({
    location,
    anomaly,
    improvised_gear,
    character,
    art_style,
    card_type,
    theme_set_id
  });
  return res.json(fallback);
});

// Long-form 3-Act Zine Chronicle expansion API (3 rich paragraphs per Act, ~750-1,100 words total)
app.post("/api/zine-story", async (req, res) => {
  const { encounter } = req.body || {};
  if (!encounter) {
    return res.status(400).json({ error: "Missing encounter payload" });
  }

  try {
    const ai = getGeminiClient();
    if (ai) {
      const anomalyLabel =
        encounter.anomaly_name ||
        (encounter.card_type === "bad_guy" ? encounter.entity_name : "Sentient Neon Rift Anomaly");
      const prompt = `Write a vivid, cohesive, progressing 199X suburban cosmic comic-zine story (~850 to 1,050 words total) based on this 199X encounter:
- Good Guy Hero: ${encounter.featured_character || "Dex 'Neon-Drift' Kowalski"} (KEEP THIS EXACT SAME SINGLE HERO from start to finish — never add a second hero or switch gender!)
- Bad Guy Monster/Anomaly: ${anomalyLabel}
- Location: ${encounter.location || "K&B Novelty Depot clearance aisle at 8:59 PM"}
- Retro Artifact: ${encounter.protagonist_loadout?.nostalgia_artifact}
- Improvised Weapon: ${encounter.protagonist_loadout?.improvised_weapon}
- Synergy Effect: ${encounter.protagonist_loadout?.weird_synergy_effect}
- Cosmic Distortion: ${encounter.cosmic_distortion}
- Status Debuff: ${encounter.status_affliction}

CRITICAL COHESIVE PROGRESSION:
Return valid JSON with three fields: "sceneSetup", "intervention", and "aftermath".
Each field MUST contain EXACTLY 3 rich, multi-sentence paragraphs separated by "\\n\\n" (~250-350 words per Act, ~850-1,050 words total):
1. "sceneSetup" (Act 01): The lone Good Guy Hero arrives inside the eerie 1990s location, notices the sensory cosmic distortion, and watches the Bad Guy Monster emerge from the shadows.
2. "intervention" (Act 02): Direct, high-speed Good Guy vs. Bad Guy showdown where the Hero couples the retro artifact onto the improvised weapon to unleash the exact synergy effect and overwhelm the monster.
3. "aftermath" (Act 03): Grounded, definitive victory; the Bad Guy dissipates, the suburban room falls quiet, and the Hero's cooled gear rests beside a newly crystallized holographic trading card.`;

      const CANDIDATE_MODELS = [
        "gemini-3-flash-preview",
        "gemini-3.1-flash-lite-preview",
        "gemini-3.5-flash"
      ];

      for (const model of CANDIDATE_MODELS) {
        try {
          const response = await ai.models.generateContent({
            model,
            contents: prompt,
            config: {
              responseMimeType: "application/json",
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  sceneSetup: { type: Type.STRING },
                  intervention: { type: Type.STRING },
                  aftermath: { type: Type.STRING },
                },
                required: ["sceneSetup", "intervention", "aftermath"],
              },
            },
          });
          const text = response.text?.trim();
          if (text) {
            return res.json(JSON.parse(text));
          }
        } catch {
          // try next model
        }
      }
    }
  } catch {
    // fallback below
  }

  return res.json(buildLongForm3ActChronicle(encounter));
});

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  function listenOnAvailablePort(port: number) {
    const server = app.listen(port, "0.0.0.0", () => {
      console.log(`199X Suburban Cosmic Roguelike Engine listening on http://localhost:${port}`);
    });
    server.on("error", (err: NodeJS.ErrnoException) => {
      if (err.code === "EADDRINUSE") {
        console.log(`Port ${port} is in use, trying port ${port + 1}...`);
        listenOnAvailablePort(port + 1);
      } else {
        throw err;
      }
    });
  }

  listenOnAvailablePort(DEFAULT_PORT);
}

startServer();