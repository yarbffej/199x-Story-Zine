# ME! // MUTABLE ECHO — Brand-New Project Master Blueprint

## Why You Should Start This in a Separate Project
1. **Completely Different Visual Identity**: *199X* is a '90s retail/mall/Trapper Keeper trading card game with skewed comic banners and holographic foil. **ME! // Mutable Echo** is a **Gothic-Tech / '90s Cyber-Noir Tactical Terminal** (*Ghost in the Shell*, *Evangelion*, *Castlevania*) built around obsidian data-slates, corner-bracket HUDs, 432Hz resonance, and industrial decay.
2. **Different Card Anatomy (Video + Still + 3-Act Log + MP3 Audio)**: Your 94 folders in `Mutable Echo Lore Archive` each contain **4 media types** (2K Still Art, 1080p MP4 Video, 3-Act Narrative Doc, and an **MP3 Ambient Sonar track**). A dedicated Mutable Echo card should be an **Archival Telemetry Slate** with a built-in audio player and `<scene_setup>` / `<intervention>` / `<aftermath>` tabs—not a sports card.
3. **Separate Vault & Clean Code**: Starting in a new folder gives Mutable Echo its own clean IndexedDB database and zero leftover 199X code.

---

## Copy-Paste Kickoff Prompt for Your New Project

Open a **New Project** in Antigravity (e.g., an empty folder named `ME-Mutable-Echo-Archive-Cards`) and paste the following prompt:

```markdown
/goal Build a brand-new React + TypeScript + Tailwind + Vite application called **"ME! // MUTABLE ECHO — Archival Telemetry Slate & Card Studio"**.

### 1. READ MY GOOGLE DRIVE ARCHIVE FIRST
Use the `gdrive` skill (`gdrive readonly`) to pull my worldbuilding files directly from Google Drive (write any temporary exports to `<appDataDir>/brain/<conversation-id>/scratch/`, never `/tmp`, so it never pauses for file permissions):
- Root Folder `Mutable Echo Lore Archive` (ID: `1eNrU4AiJUUhPxqzYXUIJZ1BQyn2Z_V0i`):
  - `ME! Category Master v. 9.7.26` (ID: `1HerjNOTSR8hf8Js8YNEy2OV7e2m6l5-RD6t2cKdfQjY` — all 50 Phases across Act Phase, Action, Attire/Look, Biome, Camera Angle, Encounter/Target, Environment Biome, Lighting Style, Perspective)
  - `ME! Prompt Matrix Elements V2` (ID: `1ASetZDN6MQmwiQUJcjkA05uv-_N9HlZ8o47T6G5erS0`)
  - The 94 completed scenario subfolders (each containing a Google Doc 3-act narrative, 2K JPEG still art, 1080p MP4 video loop, and MP3 audio track).
- Root Folder `ME! 2` (ID: `1QdWe97GXVkw4DzOQ3LLWZbsjZ0yR599r`):
  - `ME_Mutable_Echo_OnePager_Tight.html` (`18sYmloU8PBd7GE9wSChfvc12-yWEfUXi`)
  - `ME_Core_Lore- 7.18.26.txt` (`1skgaPWM9Nn23jbymHJSaSDHcSOQec_TBsPtu9sm8HkM`)
  - `file-1.md` (`1WUz2sLSS9h2BfuX_bIYpQBIztuJPa0tc` — Gothic-Tech / Cyber-Noir terminal design spec)
  - `ME_Master_Prompt_Matrix_Updated.csv` (`1W_11ZKaAWqqh75s-4jdqUwJYDCfWduAh` — 11 Master Seeds)
  - `me-game-dev-bible.md` (`1hBLnKoNJj71bbJiolBnG8kZDj9PptoVu` — Nodes AA, AF33, BB, AZ + Web Audio 432Hz synthesizer)

---

### 2. VISUAL DESIGN: GOTHIC-TECH / '90s CYBER-NOIR (NOT 199X NOSTALGIA)
Do NOT style this like a 1990s sports card or Trapper Keeper binder. Build an original **Classified Archival Terminal** aesthetic inspired by *Ghost in the Shell* (1995), *Neon Genesis Evangelion* MAGI terminals, and *Castlevania* gothic-industrial architecture:
- **Palette**: Deep obsidian/charcoal (`#0d1117` / `#0a0f18`), dark slate panels (`#161b22`), Neon Cyan (`#00f2ff`) for 432Hz severance & primary HUD, Electric Magenta (`#ff007a`) for Critical Obligation Density, Emerald (`#00cc88`) for Stabilized Equilibrium, and Sodium Amber (`#ffaa00`) for Node alerts.
- **Framing**: Machined corner-bracket borders (`.terminal-border` with 2px cyan corner reticles), subtle 30px coordinate grid background, and optional toggleable Web Audio 432Hz tuning-blade chime + 35Hz/80Hz ambient drone.
- **Zero-Clutter Studio Rule**: Keep the UI ultra-clean and above the fold—no wordy paragraphs of instructions, no manual "Compile Prompt" buttons on separate tabs.

---

### 3. REINVENTED CARD DESIGN: THE "ARCHIVAL TELEMETRY SLATE"
Instead of a standard trading card, design an interactive **5:7 Machined Archival Data-Slate** (with Front/Back flip and PNG/HTML export):
- **Slate Header**:
  - Node Coordinate Tag (e.g. `NODE: BB // IRON CHAPEL`, `NODE: AF33 // BLUEPRINT WOODS`, `NODE: LL // SILENT LINES`, `NODE: AZ // ARCHITECT CORE`)
  - Classification Pill: `[ OPERATIVE / WITNESS ]` or `[ SEVERANCE TARGET ]`
  - Hex Core Seed (e.g. `SEED: 0x882_DRY_FLOOR`)
- **Slate Front (Visual & Kinetic Feed + Audio Bar)**:
  - Full-bleed 4:3 or 9:16 viewport for the **1080p 4s Video Loop** (or **2K Still Art**) with corner crosshair reticles and a live `FPS` / `432Hz` telemetry overlay.
  - **Built-in Ambient Sonar Mini-Player**: If an `.mp3` or `.m4a` track is loaded (or synthesized via the 432Hz Web Audio engine), play it right from a sleek waveform bar on the card front.
  - **Material Finishes (8 Mutable Echo Slate Materials)**:
    1. `obsidian-monolith` (Mirror-slick black obsidian with cyan corner reticles — Node AZ)
    2. `weeping-copper` (Oxidized teal & tarnished brass industrial plate — Node BB / Iron Chapel)
    3. `sodium-vapor-noir` (Soot-black slate with amber sodium edge-glow — Pack AA)
    4. `blueprint-vector` (Deep navy grid with glowing cyan wireframe traces — Node AF33)
    5. `plum-telemetry` (Bruised-indigo CRT phosphor frame — Pack LL / Silent Lines)
    6. `saffron-vitrified` (Dark cobalt stone under saffron-gold flare border — Pack D)
    7. `chitin-carapace` (Iridescent oil-slick bio-mechanical shell — Qrix / Dredge Queen)
    8. `dry-floor-purified` (Matte mathematical charcoal stone with zero texture — Log 006)
- **Slate Back (3-Act Severance Log & Diagnostic Matrix)**:
  - Secondary Still Art viewport + **3-Act Narrative Switcher**:
    - `<scene_setup>` (Act I: The Before / Tangled Obligation)
    - `<intervention>` (Act II: The 432Hz Severance / 10–12 FPS Stutter)
    - `<aftermath>` (Act III: Warm Equilibrium / 0.43s Pause & Departure)
  - **4 Telemetry Diagnostic Bars**:
    - `OBLIGATION DENSITY` (`CRITICAL` / `HIGH` / `NULLIFIED`)
    - `SEVERANCE DEPTH` (`ABSOLUTE` / `SURGICAL`)
    - `ABSENCE RADIUS` (`0.43s PAUSE` / `EXPANDING`)
    - `CLEANSE EFFICIENCY` (`100.00% // DRY FLOOR`)

---

### 4. STREAMLINED 1-SCREEN STUDIO WORKFLOW
Build only **3 top views**:
1. **`[ 01 // SLATE STUDIO ]` (Side-by-Side Card-First Workspace)**:
   - **Top Bar**: 1-click Node Pills (`All Nodes`, `Node BB: Iron Chapel`, `Node LL: Silent Lines`, `Node AF33: Woods`, `Node AZ: Architect`, `Chitinous Trenches`, `4.2s Stutter Loops`, `Node AA: Wastes`) + **`Roll 1 Slate`** + **`Batch Roll 9 Slates (Sector Page)`**.
   - **Left Column**: The interactive **Archival Telemetry Slate** (Front & Back).
   - **Right Column (Auto-Compiled Studio Dock)**:
     - Every roll (or pasted story) **automatically compiles all 4 prompts immediately** with 1-click copy buttons (zero extra "Compile" clicks):
       1. **`Copy 3-Act Story Prompt`** (for Gemini) + a box to paste the generated story (which auto-updates the downstream prompts).
       2. **`Copy 2K Still Prompt`** (enforcing 90s Cyber-Noir / Arcane Gothic / Neon Myth + strictly no readable English text).
       3. **`Copy 4s Video / 9:16 GIF Prompt`** (auto-selecting Mutable Echo choreography: 432Hz blade severing golden tethers, 10–12 FPS frame stutter, cyan wireframe ash).
       4. **`Copy Ambient Sonar Music Prompt`** (for Google Flow Music).
     - **Drop / Paste / Drive Sync**: Drop or paste **Still Art**, **MP4 Video**, and **MP3 Audio**, OR paste a **Google Drive Folder link / pick from the 94 `Mutable Echo Lore Archive` folders** to auto-load all assets in 1 click.
     - **`Commit Slate to Vault`** button (with 432Hz Web Audio chime).
2. **`[ 02 // SECTOR VAULT (9-SLATE GRID) ]`**:
   - A sleek dark-slate 3x3 archival grid (Front view, Back view, and Full-Screen Modal with audio playback + PNG/HTML export).
3. **`[ 03 // MASTER TIMELINE INDEX (AA–AZ) ]`**:
   - Interactive Node Checklist tracking all 50 Phases + 94 Archive Folders.
```
