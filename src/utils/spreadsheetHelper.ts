import * as XLSX from 'xlsx';
import { CustomOptionsData, retroOptionManager } from './shuffleBag';
import {
  SUBURBAN_LOCATIONS,
  SUBURBAN_ANOMALIES,
  NOSTALGIA_ARTIFACTS,
  IMPROVISED_WEAPONS,
  IMPROVISED_GEAR
} from '../data/retroLibrary';

export interface ParsedSpreadsheetCategoryData {
  locations: string[];
  anomalies: string[];
  characters: string[];
  artifacts: string[];
  weapons: string[];
  gear: string[];
  unclassified: string[];
}

export interface ParsedSpreadsheetResult {
  fileName: string;
  fileSize: number;
  sheetNames: string[];
  categories: ParsedSpreadsheetCategoryData;
  totalItems: number;
  previewRows: Array<{
    category: 'locations' | 'anomalies' | 'characters' | 'artifacts' | 'weapons' | 'gear' | 'unclassified';
    value: string;
    source: string;
  }>;
}

export type RecognizedCategory = 'locations' | 'anomalies' | 'characters' | 'artifacts' | 'weapons' | 'gear';

// Normalizer to map arbitrary header or sheet names to standardized categories
export function normalizeCategoryName(raw: string): RecognizedCategory | null {
  const clean = raw.toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  
  if (/^(location|locations|place|places|venue|venues|habitat|habitats|zones|setting|settings|suburb|suburbs)$/.test(clean)) {
    return 'locations';
  }
  if (/^(anomaly|anomalies|monster|monsters|entity|entities|creature|creatures|boss|bosses|enemy|enemies|hazard|hazards|threat|threats)$/.test(clean)) {
    return 'anomalies';
  }
  if (/^(character|characters|operative|operatives|hero|heroes|protagonist|protagonists|player|players|agent|agents)$/.test(clean)) {
    return 'characters';
  }
  if (/^(artifact|artifacts|relic|relics|item|items|nostalgia|toy|toys|nostalgiaartifact|childhoodrelic|collectible|collectibles)$/.test(clean)) {
    return 'artifacts';
  }
  if (/^(weapon|weapons|tool|tools|improvisedweapon|improvisedweapons|armament|armaments|gearweapon)$/.test(clean)) {
    return 'weapons';
  }
  if (/^(gear|gears|loadout|loadouts|combo|combos|gearcombo|gearcombination|preset|presets|improvisedgear)$/.test(clean)) {
    return 'gear';
  }

  return null;
}

/**
 * Parse an uploaded spreadsheet file (.xlsx, .xls, .csv, .tsv) into structured categories
 */
export async function parseSpreadsheetFile(file: File): Promise<ParsedSpreadsheetResult> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: 'array' });

  const categories: ParsedSpreadsheetCategoryData = {
    locations: [],
    anomalies: [],
    characters: [],
    artifacts: [],
    weapons: [],
    gear: [],
    unclassified: []
  };

  const previewRows: ParsedSpreadsheetResult['previewRows'] = [];

  const addUnique = (cat: keyof ParsedSpreadsheetCategoryData, item: string, source: string) => {
    const trimmed = String(item).trim();
    if (!trimmed || trimmed.length === 0) return;
    
    // Ignore header artifacts if they leaked through
    const lower = trimmed.toLowerCase();
    if (['locations', 'anomalies', 'characters', 'operatives', 'heroes', 'artifacts', 'weapons', 'gear', 'items', 'category', 'value', 'name', 'option'].includes(lower)) {
      return;
    }

    if (!categories[cat].includes(trimmed)) {
      categories[cat].push(trimmed);
      if (previewRows.length < 100) {
        previewRows.push({
          category: cat,
          value: trimmed,
          source
        });
      }
    }
  };

  workbook.SheetNames.forEach((sheetName) => {
    const worksheet = workbook.Sheets[sheetName];
    if (!worksheet) return;

    // Convert sheet to 2D array of strings
    const rows = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1, defval: '' });
    if (!rows || rows.length === 0) return;

    const sheetCat = normalizeCategoryName(sheetName);

    // Case 1: The entire sheet represents one specific category (e.g. Sheet named "Locations")
    if (sheetCat) {
      rows.forEach((row, rowIdx) => {
        if (!Array.isArray(row)) return;
        row.forEach((cellVal) => {
          if (cellVal && typeof cellVal === 'string' && cellVal.trim()) {
            // If first row looks like header, skip if it matches category name
            if (rowIdx === 0 && normalizeCategoryName(cellVal)) return;
            addUnique(sheetCat, cellVal, `Sheet: "${sheetName}"`);
          }
        });
      });
      return;
    }

    // Case 2: Inspect first row for column headers (e.g. Column 1: "Locations", Column 2: "Anomalies")
    const headerRow = rows[0] || [];
    const columnCategories: Array<RecognizedCategory | null> = [];
    let isKeyValueFormat = false;
    let categoryColIdx = -1;
    let valueColIdx = -1;

    headerRow.forEach((h, colIdx) => {
      const headerStr = String(h || '');
      const cat = normalizeCategoryName(headerStr);
      columnCategories[colIdx] = cat;

      const cleanH = headerStr.toLowerCase().trim();
      if (['category', 'type', 'group', 'kind'].includes(cleanH)) {
        categoryColIdx = colIdx;
      }
      if (['name', 'value', 'option', 'item', 'text', 'title', 'entry'].includes(cleanH)) {
        valueColIdx = colIdx;
      }
    });

    // Check if this sheet is a 2-column key-value format (Category, Name)
    if (categoryColIdx !== -1 && valueColIdx !== -1) {
      isKeyValueFormat = true;
    }

    const hasAnyCategorizedColumn = columnCategories.some(c => c !== null);

    if (isKeyValueFormat) {
      // Parse as Key-Value pairs
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row) continue;
        const rawCat = String(row[categoryColIdx] || '');
        const rawVal = String(row[valueColIdx] || '');
        const cat = normalizeCategoryName(rawCat);
        if (cat && rawVal.trim()) {
          addUnique(cat, rawVal, `Sheet: "${sheetName}", Row ${i + 1}`);
        } else if (rawVal.trim()) {
          addUnique('unclassified', rawVal, `Sheet: "${sheetName}", Row ${i + 1}`);
        }
      }
    } else if (hasAnyCategorizedColumn) {
      // Parse as multi-column spreadsheet
      for (let i = 1; i < rows.length; i++) {
        const row = rows[i];
        if (!row) continue;
        row.forEach((cellVal, colIdx) => {
          const cat = columnCategories[colIdx];
          const val = String(cellVal || '').trim();
          if (val) {
            if (cat) {
              addUnique(cat, val, `Sheet: "${sheetName}", Col: "${headerRow[colIdx] || colIdx + 1}"`);
            } else {
              addUnique('unclassified', val, `Sheet: "${sheetName}", Col ${colIdx + 1}`);
            }
          }
        });
      }
    } else {
      // Fallback: No obvious headers, collect non-empty text cells as unclassified (or if sheet has single column, unclassified)
      rows.forEach((row, rowIdx) => {
        if (!Array.isArray(row)) return;
        row.forEach((cellVal, colIdx) => {
          const val = String(cellVal || '').trim();
          if (val) {
            addUnique('unclassified', val, `Sheet: "${sheetName}", R${rowIdx + 1}:C${colIdx + 1}`);
          }
        });
      });
    }
  });

  const totalItems = 
    categories.locations.length +
    categories.anomalies.length +
    categories.artifacts.length +
    categories.weapons.length +
    categories.gear.length +
    categories.unclassified.length;

  return {
    fileName: file.name,
    fileSize: file.size,
    sheetNames: workbook.SheetNames,
    categories,
    totalItems,
    previewRows
  };
}

/**
 * Parse raw text (e.g. pasted directly from Google Sheets / Excel as TSV or CSV)
 */
export function parseSpreadsheetFromText(rawText: string, sourceName: string = 'Pasted Google Sheet Data'): ParsedSpreadsheetResult {
  const workbook = XLSX.read(rawText, { type: 'string' });

  const categories: ParsedSpreadsheetCategoryData = {
    locations: [],
    anomalies: [],
    characters: [],
    artifacts: [],
    weapons: [],
    gear: [],
    unclassified: []
  };

  const previewRows: ParsedSpreadsheetResult['previewRows'] = [];

  const addUnique = (cat: keyof ParsedSpreadsheetCategoryData, item: string, source: string) => {
    const trimmed = String(item).trim();
    if (!trimmed || trimmed.length === 0) return;
    
    const lower = trimmed.toLowerCase();
    if (['locations', 'anomalies', 'characters', 'operatives', 'heroes', 'artifacts', 'weapons', 'gear', 'items', 'category', 'value', 'name', 'option'].includes(lower)) {
      return;
    }

    if (!categories[cat].includes(trimmed)) {
      categories[cat].push(trimmed);
      if (previewRows.length < 100) {
        previewRows.push({
          category: cat,
          value: trimmed,
          source
        });
      }
    }
  };

  const firstSheetName = workbook.SheetNames[0] || 'Sheet1';
  const worksheet = workbook.Sheets[firstSheetName];
  if (worksheet) {
    const rows = XLSX.utils.sheet_to_json<string[]>(worksheet, { header: 1, defval: '' });
    if (rows && rows.length > 0) {
      const headerRow = rows[0] || [];
      const columnCategories: Array<RecognizedCategory | null> = [];
      let isKeyValueFormat = false;
      let categoryColIdx = -1;
      let valueColIdx = -1;

      headerRow.forEach((h, colIdx) => {
        const headerStr = String(h || '');
        const cat = normalizeCategoryName(headerStr);
        columnCategories[colIdx] = cat;

        const cleanH = headerStr.toLowerCase().trim();
        if (['category', 'type', 'group', 'kind'].includes(cleanH)) {
          categoryColIdx = colIdx;
        }
        if (['name', 'value', 'option', 'item', 'text', 'title', 'entry'].includes(cleanH)) {
          valueColIdx = colIdx;
        }
      });

      if (categoryColIdx !== -1 && valueColIdx !== -1) {
        isKeyValueFormat = true;
      }

      const hasAnyCategorizedColumn = columnCategories.some(c => c !== null);

      if (isKeyValueFormat) {
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row) continue;
          const rawCat = String(row[categoryColIdx] || '');
          const rawVal = String(row[valueColIdx] || '');
          const cat = normalizeCategoryName(rawCat);
          if (cat && rawVal.trim()) {
            addUnique(cat, rawVal, `Row ${i + 1}`);
          } else if (rawVal.trim()) {
            addUnique('unclassified', rawVal, `Row ${i + 1}`);
          }
        }
      } else if (hasAnyCategorizedColumn) {
        for (let i = 1; i < rows.length; i++) {
          const row = rows[i];
          if (!row) continue;
          row.forEach((cellVal, colIdx) => {
            const cat = columnCategories[colIdx];
            const val = String(cellVal || '').trim();
            if (val) {
              if (cat) {
                addUnique(cat, val, `Col: "${headerRow[colIdx] || colIdx + 1}"`);
              } else {
                addUnique('unclassified', val, `Col ${colIdx + 1}`);
              }
            }
          });
        }
      } else {
        // Fallback: If no recognized headers, check if all rows are entries
        rows.forEach((row, rowIdx) => {
          if (!Array.isArray(row)) return;
          row.forEach((cellVal, colIdx) => {
            const val = String(cellVal || '').trim();
            if (val) {
              addUnique('unclassified', val, `R${rowIdx + 1}:C${colIdx + 1}`);
            }
          });
        });
      }
    }
  }

  const totalItems = 
    categories.locations.length +
    categories.anomalies.length +
    categories.artifacts.length +
    categories.weapons.length +
    categories.gear.length +
    categories.unclassified.length;

  return {
    fileName: sourceName,
    fileSize: new Blob([rawText]).size,
    sheetNames: ['Pasted Sheet'],
    categories,
    totalItems,
    previewRows
  };
}

/**
 * Extract Google Sheet ID and GID from any Google Docs Spreadsheet link
 */
export function extractGoogleSheetId(url: string): { sheetId: string | null; gid: string | null } {
  const cleanUrl = url.trim();
  
  // Standard format: https://docs.google.com/spreadsheets/d/SPREADSHEET_ID/edit#gid=123456
  const idMatch = cleanUrl.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
  const sheetId = idMatch ? idMatch[1] : null;

  // Extract gid if present
  const gidMatch = cleanUrl.match(/[#&?]gid=([0-9]+)/);
  const gid = gidMatch ? gidMatch[1] : null;

  return { sheetId, gid };
}

/**
 * Fetch and parse a public/shared Google Sheet directly via URL
 */
export async function fetchAndParseGoogleSheetUrl(url: string): Promise<ParsedSpreadsheetResult> {
  const { sheetId, gid } = extractGoogleSheetId(url);
  if (!sheetId) {
    throw new Error('Invalid Google Sheet URL. Please ensure it starts with "https://docs.google.com/spreadsheets/d/..."');
  }

  // Construct CSV export endpoint
  const gidParam = gid ? `&gid=${gid}` : '';
  const exportUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidParam}`;
  
  let csvText = '';
  try {
    const resp = await fetch(exportUrl);
    if (!resp.ok) {
      // Try gviz fallback
      const gvizUrl = `https://docs.google.com/spreadsheets/d/${sheetId}/gviz/tq?tqx=out:csv${gid ? `&gid=${gid}` : ''}`;
      const gvizResp = await fetch(gvizUrl);
      if (!gvizResp.ok) {
        throw new Error('Unable to access Google Sheet. Please make sure the sheet sharing is set to "Anyone with the link can view".');
      }
      csvText = await gvizResp.text();
    } else {
      csvText = await resp.text();
    }
  } catch (err: any) {
    throw new Error(
      err?.message || 
      'Could not connect to Google Sheet. Please check your link or ensure the sharing setting is "Anyone with the link can view", or use the Copy & Paste option below!'
    );
  }

  if (!csvText || !csvText.trim()) {
    throw new Error('The Google Sheet appears to be empty or has no accessible data rows.');
  }

  return parseSpreadsheetFromText(csvText, `Google Sheet (${sheetId.slice(0, 8)}...)`);
}

/**
 * Apply parsed spreadsheet data into the RetroOptionManager
 */
export function commitParsedSpreadsheet(
  parsed: ParsedSpreadsheetResult,
  unclassifiedTarget: 'locations' | 'anomalies' | 'characters' | 'artifacts' | 'weapons' | 'gear' | 'ignore',
  mode: 'merge' | 'replace'
): {
  locationsAdded: number;
  anomaliesAdded: number;
  charactersAdded: number;
  artifactsAdded: number;
  weaponsAdded: number;
  gearAdded: number;
  totalAdded: number;
} {
  const toCommit: CustomOptionsData = {
    customLocations: [...parsed.categories.locations],
    customAnomalies: [...parsed.categories.anomalies],
    customCharacters: [...(parsed.categories.characters || [])],
    customArtifacts: [...parsed.categories.artifacts],
    customWeapons: [...parsed.categories.weapons],
    customGear: [...parsed.categories.gear],
    customArtStyles: []
  };

  // Route unclassified items if user designated a category
  if (unclassifiedTarget !== 'ignore' && parsed.categories.unclassified.length > 0) {
    if (unclassifiedTarget === 'locations') {
      toCommit.customLocations.push(...parsed.categories.unclassified);
    } else if (unclassifiedTarget === 'anomalies') {
      toCommit.customAnomalies.push(...parsed.categories.unclassified);
    } else if (unclassifiedTarget === 'characters') {
      toCommit.customCharacters.push(...parsed.categories.unclassified);
    } else if (unclassifiedTarget === 'artifacts') {
      toCommit.customArtifacts.push(...parsed.categories.unclassified);
    } else if (unclassifiedTarget === 'weapons') {
      toCommit.customWeapons.push(...parsed.categories.unclassified);
    } else if (unclassifiedTarget === 'gear') {
      toCommit.customGear.push(...parsed.categories.unclassified);
    }
  }

  if (mode === 'replace') {
    retroOptionManager.setCustomData(toCommit);
    const custom = retroOptionManager.getCustomData();
    return {
      locationsAdded: custom.customLocations.length,
      anomaliesAdded: custom.customAnomalies.length,
      charactersAdded: custom.customCharacters.length,
      artifactsAdded: custom.customArtifacts.length,
      weaponsAdded: custom.customWeapons.length,
      gearAdded: custom.customGear.length,
      totalAdded: 
        custom.customLocations.length +
        custom.customAnomalies.length +
        custom.customCharacters.length +
        custom.customArtifacts.length +
        custom.customWeapons.length +
        custom.customGear.length
    };
  } else {
    const result = retroOptionManager.mergeCustomData(toCommit);
    return {
      locationsAdded: result.addedCounts.customLocations,
      anomaliesAdded: result.addedCounts.customAnomalies,
      charactersAdded: result.addedCounts.customCharacters,
      artifactsAdded: result.addedCounts.customArtifacts,
      weaponsAdded: result.addedCounts.customWeapons,
      gearAdded: result.addedCounts.customGear,
      totalAdded: result.totalAdded
    };
  }
}

/**
 * Generate a pre-formatted Excel template (.xlsx) with sample data across sheets and columns
 */
export function generateSampleExcelWorkbook(): Uint8Array {
  const wb = XLSX.utils.book_new();

  // Multi-column master sheet
  const masterData = [
    ["Locations", "Anomalies", "Artifacts", "Weapons", "Gear Combinations"],
    ["Arcade prize redemption counter", "Possessed Dial-Up Modem Singularity", "Talkboy Cassette Recorder", "Aluminum T-Ball Bat", "Talkboy Cassette Recorder + Aluminum T-Ball Bat"],
    ["Abandoned Blockbuster VHS drop chute", "Phase-Shifting Chuck E. Cheese Animatronic", "Heavy Brass POG Slammer", "Heavy CRT Remote Control", "Heavy Brass POG Slammer + Retractable TV Antenna"],
    ["KB Toys clearance aisle at 8:59 PM", "Sentient Fun-Pack Slime", "Trapper Keeper (Prism Edition)", "Metal Lunchbox Shield", "Trapper Keeper (Prism Edition) + Metal Lunchbox Shield"],
    ["Skatepark half-pipe at twilight", "Static-Bleeding Tamagotchi Overlord", "Glow-in-the-dark Sticky Hand", "Industrial Squeegee", "Glow-in-the-dark Sticky Hand + Industrial Squeegee"],
    ["Sizzler soft-serve ice cream station", "The 90s Infomercial Psychic Hotline Ghost", "Clear Purple Game Boy Color", "Broken Hockey Stick", "Clear Purple Game Boy Color + Steel Bicycle Chain"],
    ["Neon Laser Tag maze under fog overdrive", "Cursed Trapper Keeper with Velcro Teeth", "Hit Clips Micro Audio Player", "Master Lock on a Neon Shoelace", "Hit Clips Micro Audio Player + Sharpened Golf Pencil"]
  ];
  const wsMaster = XLSX.utils.aoa_to_sheet(masterData);
  XLSX.utils.book_append_sheet(wb, wsMaster, "Master Multi-Column");

  // Separate sheets for organized input
  const wsLocations = XLSX.utils.aoa_to_sheet([
    ["Location Name"],
    ["Suburban Taco Bell with 1993 teal wallpaper"],
    ["Sears appliance showroom CRT display wall"],
    ["Roller rink glowing carpet under blacklight"],
    ["Discovery Zone padded obstacle abyss"],
    ["Public library microfiche scanning booth"]
  ]);
  XLSX.utils.book_append_sheet(wb, wsLocations, "Locations");

  const wsAnomalies = XLSX.utils.aoa_to_sheet([
    ["Anomaly Name"],
    ["Hyper-Dimensional Beanie Baby Swarm"],
    ["Unregistered Laserdisc Arch-Demon"],
    ["POG Slammer Hivemind Cluster"],
    ["Sentient VHS Rewinder of Endless Doom"],
    ["AOL 1000 Hours CD-ROM Shuriken Swarm"]
  ]);
  XLSX.utils.book_append_sheet(wb, wsAnomalies, "Anomalies");

  const wsArtifacts = XLSX.utils.aoa_to_sheet([
    ["Artifact Name"],
    ["Yomega Brain Clutch Yo-Yo"],
    ["Fisher-Price PixelVision Camcorder"],
    ["AOL 3.5-inch Floppy Disk Bandolier"],
    ["Casio G-Shock Illuminator"],
    ["Tamagotchi Virtual Pet on Carabiner"]
  ]);
  XLSX.utils.book_append_sheet(wb, wsArtifacts, "Artifacts");

  const wsWeapons = XLSX.utils.aoa_to_sheet([
    ["Weapon Name"],
    ["Heavy Maglite Flashlight"],
    ["Tennis Racket with Broken Strings"],
    ["Wooden Croquet Mallet"],
    ["Cast Iron Skillet from Sears"],
    ["Super Soaker 50 with Holy Mountain Dew"]
  ]);
  XLSX.utils.book_append_sheet(wb, wsWeapons, "Weapons");

  // Output as Uint8Array
  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}

/**
 * Generate a sample CSV string
 */
export function generateSampleCsv(): string {
  const rows = [
    ['Locations', 'Anomalies', 'Artifacts', 'Weapons', 'Gear Combinations'],
    ['Suburban Cul-de-sac Sprinkler Vortex', 'Sentient Fun-Pack Slime', 'Talkboy Cassette Recorder', 'Aluminum T-Ball Bat', 'Talkboy + Aluminum Bat'],
    ['KB Toys Clearance Aisle', 'Possessed Dial-Up Modem Singularity', 'Heavy Brass POG Slammer', 'Heavy CRT Remote Control', 'POG Slammer + CRT Remote'],
    ['Abandoned Laser Tag Maze', 'Phase-Shifting Chuck E. Animatronic', 'Clear Purple Game Boy Color', 'Master Lock on Shoelace', 'Game Boy + Master Lock'],
    ['Sizzler Soft-Serve Station', 'Static-Bleeding Tamagotchi Overlord', 'Glow Sticky Hand', 'Industrial Squeegee', 'Sticky Hand + Squeegee']
  ];
  return rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
}

/**
 * Export the current database (Built-in + Custom or Custom Only) as an Excel (.xlsx) file
 */
export function exportCurrentDatabaseToExcel(customOnly: boolean = false): Uint8Array {
  const wb = XLSX.utils.book_new();

  const custom = retroOptionManager.getCustomData();
  const locations = customOnly ? custom.customLocations : retroOptionManager.getLocations();
  const anomalies = customOnly ? custom.customAnomalies : retroOptionManager.getAnomalies();
  const characters = customOnly ? custom.customCharacters : retroOptionManager.getCharacters();
  const artifacts = customOnly ? custom.customArtifacts : retroOptionManager.getArtifacts();
  const weapons = customOnly ? custom.customWeapons : retroOptionManager.getWeapons();
  const gear = customOnly ? custom.customGear : retroOptionManager.getGearPresets();

  // Multi-column combined overview
  const maxLen = Math.max(locations.length, anomalies.length, characters.length, artifacts.length, weapons.length, gear.length);
  const combinedAoa: string[][] = [
    ["Locations", "Anomalies", "Operatives", "Artifacts", "Weapons", "Gear Presets"]
  ];

  for (let i = 0; i < maxLen; i++) {
    combinedAoa.push([
      locations[i] || "",
      anomalies[i] || "",
      characters[i] || "",
      artifacts[i] || "",
      weapons[i] || "",
      gear[i] || ""
    ]);
  }

  const wsMaster = XLSX.utils.aoa_to_sheet(combinedAoa);
  XLSX.utils.book_append_sheet(wb, wsMaster, "Master Database");

  // Category specific sheets
  const wsLoc = XLSX.utils.aoa_to_sheet([["Location"], ...locations.map(x => [x])]);
  XLSX.utils.book_append_sheet(wb, wsLoc, "Locations");

  const wsAnom = XLSX.utils.aoa_to_sheet([["Anomaly / Monster"], ...anomalies.map(x => [x])]);
  XLSX.utils.book_append_sheet(wb, wsAnom, "Anomalies");

  const wsChar = XLSX.utils.aoa_to_sheet([["Operative / Hero"], ...characters.map(x => [x])]);
  XLSX.utils.book_append_sheet(wb, wsChar, "Operatives");

  const wsArt = XLSX.utils.aoa_to_sheet([["Nostalgia Artifact"], ...artifacts.map(x => [x])]);
  XLSX.utils.book_append_sheet(wb, wsArt, "Artifacts");

  const wsWpn = XLSX.utils.aoa_to_sheet([["Improvised Weapon"], ...weapons.map(x => [x])]);
  XLSX.utils.book_append_sheet(wb, wsWpn, "Weapons");

  const wsGear = XLSX.utils.aoa_to_sheet([["Gear Preset"], ...gear.map(x => [x])]);
  XLSX.utils.book_append_sheet(wb, wsGear, "Gear");

  return XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
}

/**
 * Export current database as CSV
 */
export function exportCurrentDatabaseToCsv(customOnly: boolean = false): string {
  const custom = retroOptionManager.getCustomData();
  const locations = customOnly ? custom.customLocations : retroOptionManager.getLocations();
  const anomalies = customOnly ? custom.customAnomalies : retroOptionManager.getAnomalies();
  const characters = customOnly ? custom.customCharacters : retroOptionManager.getCharacters();
  const artifacts = customOnly ? custom.customArtifacts : retroOptionManager.getArtifacts();
  const weapons = customOnly ? custom.customWeapons : retroOptionManager.getWeapons();
  const gear = customOnly ? custom.customGear : retroOptionManager.getGearPresets();

  const maxLen = Math.max(locations.length, anomalies.length, characters.length, artifacts.length, weapons.length, gear.length);
  const rows: string[][] = [
    ["Locations", "Anomalies", "Operatives", "Artifacts", "Weapons", "Gear Presets"]
  ];

  for (let i = 0; i < maxLen; i++) {
    rows.push([
      locations[i] || "",
      anomalies[i] || "",
      characters[i] || "",
      artifacts[i] || "",
      weapons[i] || "",
      gear[i] || ""
    ]);
  }

  return rows.map(r => r.map(c => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
}
