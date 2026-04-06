/**
 * DWG / DXF Auto-Analyzer
 * Reads uploaded drawing files and extracts quantities automatically.
 * Supports: DXF (full entity parsing) + DWG binary (text/string extraction)
 */

const fs = require('fs');

// Load dxf-parser if available
let DxfParser;
try { DxfParser = require('dxf-parser'); } catch {}

// ─── Format detection ──────────────────────────────────────────────────────────
function detectFormat(buffer) {
  const header = buffer.slice(0, 6).toString('ascii');
  if (header.startsWith('AC')) return 'dwg'; // AutoCAD DWG magic bytes
  const preview = buffer.slice(0, 200).toString('utf8', 0, 200);
  if (preview.includes('SECTION') || preview.trim().startsWith('0\n') || preview.trim().startsWith('0\r\n')) return 'dxf';
  return 'unknown';
}

// ─── Extract printable ASCII strings from binary buffer ───────────────────────
function extractStrings(buffer, minLen = 3) {
  const strings = [];
  let cur = '';
  for (let i = 0; i < buffer.length; i++) {
    const c = buffer[i];
    if (c >= 32 && c <= 126) {
      cur += String.fromCharCode(c);
    } else {
      if (cur.length >= minLen) strings.push(cur.trim());
      cur = '';
    }
  }
  if (cur.length >= minLen) strings.push(cur.trim());
  return strings;
}

// ─── Geometry helpers ─────────────────────────────────────────────────────────
function dist2D(p1, p2) {
  if (!p1 || !p2) return 0;
  return Math.sqrt(Math.pow((p2.x || 0) - (p1.x || 0), 2) + Math.pow((p2.y || 0) - (p1.y || 0), 2));
}

function polygonArea(vertices) {
  if (!vertices || vertices.length < 3) return 0;
  let area = 0;
  const n = vertices.length;
  for (let i = 0; i < n; i++) {
    const j = (i + 1) % n;
    area += (vertices[i].x || 0) * (vertices[j].y || 0);
    area -= (vertices[j].x || 0) * (vertices[i].y || 0);
  }
  return Math.abs(area / 2);
}

// ─── Default fallback inputs per drawing type ─────────────────────────────────
function defaultInputs(type) {
  if (type === 'structural' || type === 'architectural') {
    return { floorArea: 1200, floors: 7, wallLength: 120, wallHeight: 3, wallThickness: 9 };
  }
  if (type === 'plumbing') {
    return { coldWaterPipeRuns: 80, hotWaterPipeRuns: 40, drainPipeRuns: 80, bathrooms: 2, kitchens: 1 };
  }
  if (type === 'electrical') {
    return { lightPoints: 12, fanPoints: 6, socketPoints: 16, acPoints: 2, totalCircuitLength: 150, panels: 1 };
  }
  return {};
}

// ─── DWG Binary Analyzer ──────────────────────────────────────────────────────
function analyzeDWGBinary(buffer, drawingType) {
  const strings = extractStrings(buffer, 2);
  const allText = strings.join('\n').toUpperCase();
  const result = { format: 'dwg_binary', confidence: 'medium', inputs: {}, details: [], roomTypes: {} };

  // ── Room type detection ──────────────────────────────────────────────────
  const bedrooms   = (allText.match(/BED[\s-]?ROOM|BEDRM|B\.R\b/g) || []).length;
  const bathrooms  = (allText.match(/\bBATH|TOILET|W\.C\b|\bWC\b|LAVAT/g) || []).length;
  const kitchens   = (allText.match(/KITCHEN|KIT\b|K\.T\b/g) || []).length;
  const living     = (allText.match(/LIVING|HALL\b|DRAWING\s*ROOM|DINING/g) || []).length;
  result.roomTypes = { bedrooms, bathrooms, kitchens, living };

  // ── Floor count ──────────────────────────────────────────────────────────
  let floors = 1;
  const gp = allText.match(/G\s*\+\s*(\d+)/);
  if (gp) floors = parseInt(gp[1]) + 1;
  const fp = allText.match(/(\d+)\s*(?:FLOOR|STOREY|STORY)/);
  if (fp) floors = Math.max(floors, parseInt(fp[1]));
  floors = Math.max(1, Math.min(floors, 50)); // sanity

  // ── Area extraction ───────────────────────────────────────────────────────
  let floorArea = 0;
  const sqftMatches = allText.match(/(\d[\d,]*(?:\.\d+)?)\s*(?:SQ\.?\s*FT|SQFT|SQ\.?\s*FEET)/g) || [];
  const sqmMatches  = allText.match(/(\d[\d,]*(?:\.\d+)?)\s*(?:SQ\.?\s*M(?:TR|ETER)?|SQM)\b/g) || [];

  if (sqftMatches.length > 0) {
    const areas = sqftMatches.map(m => parseFloat(m.replace(/,/g, '').match(/[\d.]+/)[0]));
    floorArea = Math.max(...areas);
    result.details.push(`Sqft found in drawing: ${sqftMatches.slice(0, 3).join(', ')}`);
    result.confidence = 'high';
  } else if (sqmMatches.length > 0) {
    const areas = sqmMatches.map(m => parseFloat(m.replace(/,/g, '').match(/[\d.]+/)[0]));
    floorArea = Math.round(Math.max(...areas) * 10.764);
    result.details.push(`Sqm found in drawing: ${sqmMatches.slice(0, 3).join(', ')}`);
    result.confidence = 'high';
  }

  // Estimate from room count if no area annotation found
  if (floorArea < 100) {
    const rooms = bedrooms + living + kitchens + bathrooms;
    if (rooms > 0) {
      floorArea = Math.round(rooms * 160); // ~160 sqft per room avg
      result.details.push(`Estimated area from ${rooms} detected rooms (${bedrooms} bed, ${living} living, ${kitchens} kit, ${bathrooms} bath)`);
      result.confidence = 'low';
    } else {
      floorArea = 1200; // safe default
      result.details.push('No area annotations or room labels found – using default');
      result.confidence = 'low';
    }
  }

  // ── Wall properties ───────────────────────────────────────────────────────
  let wallThickness = 9;
  if (allText.match(/\b115\b|4\.5\s*INCH|4\.5"/)) wallThickness = 4.5;
  if (allText.match(/\b230\b|9\s*INCH|9"/)) wallThickness = 9;

  let wallHeight = 3.0;
  const hm = allText.match(/(?:HEIGHT|HT\.?)\s*[=:]\s*(\d+(?:\.\d+)?)\s*(MM|M\b|CM)?/);
  if (hm) {
    let h = parseFloat(hm[1]);
    const unit = (hm[2] || '').toUpperCase();
    if (unit === 'MM' || h > 100) h = h / 1000;
    if (unit === 'CM') h = h / 100;
    if (h >= 2 && h <= 6) wallHeight = h;
  }

  // Rough wall length: perimeter estimate from area
  const wallLength = Math.round(4 * Math.sqrt(floorArea * 0.0929) * (0.6 + Math.random() * 0.2)); // m
  result.details.push(`Floors: ${floors}, Area/floor: ${floorArea} sqft, Wall ht: ${wallHeight}m, Thickness: ${wallThickness}"`);

  // ── Build inputs per drawing type ─────────────────────────────────────────
  if (drawingType === 'structural' || drawingType === 'architectural') {
    result.inputs = {
      floorArea,
      floors,
      wallLength: wallLength || Math.round(floorArea * 0.09),
      wallHeight,
      wallThickness,
    };
  } else if (drawingType === 'plumbing') {
    const baths = Math.max(bathrooms, bedrooms, 1);
    const kits  = Math.max(kitchens, 1);
    result.inputs = {
      coldWaterPipeRuns: Math.round((baths * 8 + kits * 5) * Math.max(Math.ceil(floors / 2), 1)),
      hotWaterPipeRuns:  Math.round((baths * 4 + kits * 3) * Math.max(Math.ceil(floors / 2), 1)),
      drainPipeRuns:     Math.round((baths * 7 + kits * 4) * Math.max(Math.ceil(floors / 2), 1)),
      bathrooms: baths,
      kitchens: kits,
    };
  } else if (drawingType === 'electrical') {
    const rooms = Math.max(bedrooms + living + kitchens, 3);
    result.inputs = {
      lightPoints:        Math.round(rooms * 3 * Math.max(1, floors)),
      fanPoints:          Math.round(rooms * 1.5 * Math.max(1, floors)),
      socketPoints:       Math.round(rooms * 4 * Math.max(1, floors)),
      acPoints:           Math.max(bedrooms * floors, 2),
      totalCircuitLength: Math.round(floorArea * 0.092903 * 0.4 * floors), // sqft → m² → circuit factor
      panels:             Math.max(floors, 1),
    };
  }

  return result;
}

// ─── DXF Full Entity Analyzer ─────────────────────────────────────────────────
function analyzeDXF(content, drawingType) {
  const result = { format: 'dxf', confidence: 'high', inputs: {}, details: [] };

  if (!DxfParser) {
    result.confidence = 'low';
    result.error = 'dxf-parser not available';
    result.inputs = defaultInputs(drawingType);
    return result;
  }

  try {
    const parser = new DxfParser();
    const dxf = parser.parseSync(content);
    const entities = dxf.entities || [];

    const lines       = entities.filter(e => e.type === 'LINE');
    const lwPolys     = entities.filter(e => e.type === 'LWPOLYLINE');
    const polys       = entities.filter(e => e.type === 'POLYLINE');
    const inserts     = entities.filter(e => e.type === 'INSERT');
    const texts       = entities.filter(e => e.type === 'TEXT' || e.type === 'MTEXT');
    const dimensions  = entities.filter(e => e.type === 'DIMENSION');

    result.details.push(`DXF: ${lines.length} lines, ${lwPolys.length + polys.length} polylines, ${inserts.length} inserts, ${texts.length} texts, ${dimensions.length} dims`);

    // ── Detect drawing units (mm vs m) ──────────────────────────────────────
    const sampleLens = lines.slice(0, 30).map(l => dist2D(l.vertices?.[0] || l.start, l.vertices?.[1] || l.end)).filter(l => l > 0);
    const avgLen = sampleLens.length ? sampleLens.reduce((a, b) => a + b, 0) / sampleLens.length : 1000;
    // > 200 → likely mm (Indian/metric), else meters
    const toMeters = avgLen > 200 ? 1 / 1000 : 1;
    result.details.push(`Unit scale: ×${toMeters} (avg entity len = ${avgLen.toFixed(1)})`);

    // ── Total line length ────────────────────────────────────────────────────
    const totalLineM = lines.reduce((sum, l) => {
      return sum + dist2D(l.vertices?.[0] || l.start, l.vertices?.[1] || l.end);
    }, 0) * toMeters;

    // ── Closed polyline areas ────────────────────────────────────────────────
    const allPolys = [...lwPolys, ...polys];
    const closedPolys = allPolys.filter(p => p.shape || p.closed);
    const areas = closedPolys
      .map(p => polygonArea(p.vertices || []) * toMeters * toMeters) // m²
      .filter(a => a > 0.5); // ignore tiny shapes

    const totalAreaM2 = areas.reduce((s, a) => s + a, 0);
    const totalAreaSqft = totalAreaM2 * 10.764;

    // ── Detect floors from text ───────────────────────────────────────────────
    const textContent = texts.map(t => t.text || t.string || '').join(' ').toUpperCase();
    let floors = 1;
    const gp = textContent.match(/G\s*\+\s*(\d+)/);
    if (gp) floors = parseInt(gp[1]) + 1;

    // ── Block name analysis ───────────────────────────────────────────────────
    const blockNames = inserts.map(i => (i.name || '').toUpperCase());

    if (drawingType === 'structural' || drawingType === 'architectural') {
      const perFloorArea = closedPolys.length > 0
        ? Math.round(totalAreaSqft / Math.max(floors, 1))
        : 1200;

      const wallLen = Math.round(totalLineM * 0.35 / Math.max(floors, 1)); // ~35% of all lines are walls

      result.inputs = {
        floorArea:     Math.max(perFloorArea, 100),
        floors,
        wallLength:    Math.max(wallLen, 20),
        wallHeight:    3.0,
        wallThickness: 9,
      };
      result.details.push(`Area/floor: ${perFloorArea} sqft (${closedPolys.length} closed polys), Wall length: ${wallLen}m`);

    } else if (drawingType === 'plumbing') {
      const plumbLayers = ['PLUMB', 'PLB', 'PIPE', 'SANITARY', 'DRAIN', 'WATER', 'HOT', 'COLD'];
      const plumbLines = lines.filter(l => plumbLayers.some(pl => (l.layer || '').toUpperCase().includes(pl)));
      const pipeLen = (plumbLines.length > 5 ? plumbLines : lines).reduce((sum, l) => {
        return sum + dist2D(l.vertices?.[0] || l.start, l.vertices?.[1] || l.end);
      }, 0) * toMeters;

      const bathBlocks = blockNames.filter(n => /WC|TOILET|BATH|LAVAT/.test(n)).length;
      const basBlocks  = blockNames.filter(n => /BASIN|WASH/.test(n)).length;
      const kitBlocks  = blockNames.filter(n => /KITCHEN|SINK|KIT/.test(n)).length;

      const baths = Math.max(bathBlocks || basBlocks, 1);
      const kits  = Math.max(kitBlocks, 1);

      result.inputs = {
        coldWaterPipeRuns: Math.max(Math.round(pipeLen * 0.4), 20),
        hotWaterPipeRuns:  Math.max(Math.round(pipeLen * 0.2), 10),
        drainPipeRuns:     Math.max(Math.round(pipeLen * 0.4), 20),
        bathrooms: baths,
        kitchens:  kits,
      };
      result.details.push(`Pipe length: ${pipeLen.toFixed(1)}m, Baths: ${baths}, Kitchens: ${kits}`);

    } else if (drawingType === 'electrical') {
      const elecLayers = ['ELEC', 'POWER', 'LIGHT', 'LT', 'EL-'];
      const elecLines = lines.filter(l => elecLayers.some(el => (l.layer || '').toUpperCase().includes(el)));
      const circuitLen = (elecLines.length > 5 ? elecLines : lines).reduce((sum, l) => {
        return sum + dist2D(l.vertices?.[0] || l.start, l.vertices?.[1] || l.end);
      }, 0) * toMeters * 0.5;

      const lightCount  = blockNames.filter(n => /LIGHT|LAMP|FIX|LT-/.test(n)).length;
      const fanCount    = blockNames.filter(n => /FAN/.test(n)).length;
      const socketCount = blockNames.filter(n => /SOCKET|PLUG|OUTLET/.test(n)).length;
      const acCount     = blockNames.filter(n => /\bAC\b|SPLIT|AIRCON/.test(n)).length;
      const switchCount = blockNames.filter(n => /SWITCH|SW-/.test(n)).length;
      const panelCount  = blockNames.filter(n => /PANEL|MCB|DB\b|BOARD/.test(n)).length;

      result.inputs = {
        lightPoints:        lightCount  || Math.max(switchCount, 8),
        fanPoints:          fanCount    || 4,
        socketPoints:       socketCount || Math.max(switchCount - lightCount - fanCount, 8),
        acPoints:           acCount     || 2,
        totalCircuitLength: Math.max(Math.round(circuitLen), 50),
        panels:             panelCount || Math.max(floors, 1),
      };
      result.details.push(`Light: ${lightCount}, Fan: ${fanCount}, Socket: ${socketCount}, AC: ${acCount}, Circuit: ${circuitLen.toFixed(1)}m`);
    }

    return result;
  } catch (err) {
    result.confidence = 'low';
    result.error = err.message;
    result.inputs = defaultInputs(drawingType);
    result.details.push(`DXF parse error: ${err.message}`);
    return result;
  }
}

// ─── Main export ───────────────────────────────────────────────────────────────
async function analyzeDrawingFile(filePath, drawingType) {
  try {
    const buffer = fs.readFileSync(filePath);
    const format = detectFormat(buffer);

    if (format === 'dxf') {
      return analyzeDXF(buffer.toString('utf8'), drawingType);
    }

    if (format === 'dwg') {
      return analyzeDWGBinary(buffer, drawingType);
    }

    // Unknown format – try DXF parse first, fall back to binary
    try {
      return analyzeDXF(buffer.toString('utf8'), drawingType);
    } catch {
      return analyzeDWGBinary(buffer, drawingType);
    }
  } catch (err) {
    return {
      format: 'error',
      confidence: 'low',
      error: err.message,
      inputs: defaultInputs(drawingType),
      details: [`File read error: ${err.message}`],
    };
  }
}

module.exports = { analyzeDrawingFile };
