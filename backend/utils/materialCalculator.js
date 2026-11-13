/**
 * Nirmaan – Rule-based Material Calculator
 * Structural and Architectural are now SEPARATE calculators.
 */

const r2 = (n) => parseFloat(Number(n).toFixed(2));
const r0 = (n) => Math.round(n);

// ─── STRUCTURAL (RCC Frame) ────────────────────────────────────────────────────
// Only outputs bar diameters the user explicitly confirms are in the drawing.
// No wall / masonry calculations — those belong to Architectural.
/**
 * inputs:
 *   floorArea      – sqft per floor
 *   floors         – number of floors (incl. ground)
 *   barDiameters   – array of mm strings user confirmed e.g. ['8','12','16','20']
 *   totalSteelKg   – (optional) total from Bar Bending Schedule; if 0, estimate
 *   concreteSlab   – (optional) cum of slab concrete if known; else estimate
 *   concreteColumn – (optional) cum of column/beam concrete if known; else estimate
 */
const calculateStructural = (inputs) => {
  const {
    floorArea      = 0,
    floors         = 1,
    barDiameters   = [],
    totalSteelKg   = 0,
    concreteSlab   = 0,
    concreteColumn = 0,
  } = inputs;

  const totalArea = floorArea * floors;
  const steelKg   = totalSteelKg > 0 ? totalSteelKg : totalArea * 4; // 4 kg/sqft thumb rule

  // Distribution ratios per diameter (typical residential RCC)
  const DIA_CONFIG = {
    '6':  { label: 'TMT Bar 6mm – Stirrups / Ties',              ratio: 0.05 },
    '8':  { label: 'TMT Bar 8mm – Slab Distribution Bars',       ratio: 0.10 },
    '10': { label: 'TMT Bar 10mm – Light Beam / Slab Support',   ratio: 0.08 },
    '12': { label: 'TMT Bar 12mm – Slab Main Bars / Columns',    ratio: 0.22 },
    '16': { label: 'TMT Bar 16mm – Beam Bars / Columns',         ratio: 0.25 },
    '20': { label: 'TMT Bar 20mm – Main Beams / Heavy Columns',  ratio: 0.18 },
    '25': { label: 'TMT Bar 25mm – Main Column Bars',            ratio: 0.08 },
    '32': { label: 'TMT Bar 32mm – Heavy Columns / Raft Found.',  ratio: 0.04 },
  };

  // Only use diameters the user confirmed exist in the drawing
  const selected = (barDiameters || []).map(String).filter(d => DIA_CONFIG[d]);

  // If no diameters specified, return just the total (safer than guessing)
  const materials = [];

  if (selected.length > 0) {
    // Normalise ratios so they sum to 1 across selected diameters
    const ratioSum = selected.reduce((s, d) => s + DIA_CONFIG[d].ratio, 0);
    for (const dia of selected) {
      const cfg = DIA_CONFIG[dia];
      const qty = r0(steelKg * (cfg.ratio / ratioSum));
      if (qty > 0) {
        materials.push({ materialName: cfg.label, category: 'steel', quantity: qty, unit: 'kg' });
      }
    }
  }

  // Total steel and binding wire — always shown
  materials.push({ materialName: 'TMT Steel – Total (All Diameters)', category: 'steel', quantity: r0(steelKg), unit: 'kg' });
  materials.push({ materialName: 'Binding Wire 16 Gauge',              category: 'steel', quantity: r2(steelKg * 0.01), unit: 'kg' });

  // Concrete — slab and columns/beams
  const slabCUM   = concreteSlab   > 0 ? concreteSlab   : r2(totalArea * 0.0465); // ~0.05 m²/sqft × sqft → cum
  const colCUM    = concreteColumn > 0 ? concreteColumn : r2(totalArea * 0.0186);

  materials.push({ materialName: 'Ready-Mix Concrete M25 – Slabs',          category: 'concrete', quantity: slabCUM, unit: 'cum' });
  materials.push({ materialName: 'Ready-Mix Concrete M30 – Columns & Beams', category: 'concrete', quantity: colCUM,  unit: 'cum' });

  const totalConcreteCUM = slabCUM + colCUM;
  materials.push({ materialName: 'Coarse Aggregate 20mm (Concrete)',  category: 'concrete', quantity: r2(totalConcreteCUM * 1.2), unit: 'tons' });
  materials.push({ materialName: 'Coarse Aggregate 12mm (Columns)',   category: 'concrete', quantity: r2(colCUM * 0.6),           unit: 'tons' });
  materials.push({ materialName: 'River Sand / M-Sand (Concrete)',    category: 'concrete', quantity: r2(totalConcreteCUM * 0.8), unit: 'tons' });
  materials.push({ materialName: 'Cement OPC 53 Grade – Concrete Mix', category: 'cement',  quantity: r0(totalConcreteCUM * 7.2), unit: 'bags' });

  return materials;
};

// ─── ARCHITECTURAL (Walls, Masonry, Finishes) ─────────────────────────────────
// Used for floor-plan drawings that show partition walls, room layouts.
/**
 * inputs:
 *   floorArea      – sqft per floor
 *   floors         – number of floors
 *   wallLength     – total wall centre-line length per floor (m)
 *   wallHeight     – floor-to-ceiling height (m), default 3
 *   wallThickness  – 3 | 4 | 9 inches
 *   masonryType    – 'brick' | 'block'
 */
const calculateArchitectural = (inputs) => {
  const {
    floorArea     = 0,
    floors        = 1,
    wallLength    = 0,
    wallHeight    = 3,
    wallThickness = 9,
    masonryType   = 'brick',
  } = inputs;

  const totalArea       = floorArea * floors;
  const wallFaceAreaFt2 = wallLength * 3.281 * wallHeight * 3.281;
  const wallVolumeCFT   = wallFaceAreaFt2 * (wallThickness / 12);
  const materials       = [];

  // Masonry
  if (masonryType === 'block') {
    const blockLabel = wallThickness <= 4 ? '4" AAC Block (600×100×200mm)' : '8" AAC Block (600×200×200mm)';
    const bpFt2      = wallThickness <= 4 ? 12 : 6;
    materials.push({ materialName: blockLabel,                          category: 'block',  quantity: r0(wallFaceAreaFt2 * bpFt2), unit: 'nos' });
    materials.push({ materialName: 'Block Jointing / Thin-bed Mortar', category: 'cement', quantity: r0(wallFaceAreaFt2 * bpFt2 * 0.02), unit: 'bags' });
  } else {
    let bpFt2, brickLabel;
    if (wallThickness <= 3)       { bpFt2 = 35;  brickLabel = '3" Brick Wall (75mm)'; }
    else if (wallThickness <= 4)  { bpFt2 = 55;  brickLabel = '4" Brick Wall (100mm)'; }
    else                          { bpFt2 = 110; brickLabel = '9" Brick Wall (230mm)'; }
    materials.push({ materialName: `Bricks – ${brickLabel}`, category: 'brick',  quantity: r0(wallFaceAreaFt2 * bpFt2), unit: 'nos' });
    materials.push({ materialName: 'Cement – Brickwork Mortar (OPC)', category: 'cement', quantity: r2(wallVolumeCFT * 0.18), unit: 'bags' });
  }

  // Plastering
  const plasterCement = r2(wallFaceAreaFt2 * 2 * 0.05); // both sides
  materials.push({ materialName: 'Cement – Internal Plastering 12mm', category: 'cement', quantity: plasterCement, unit: 'bags' });
  materials.push({ materialName: 'River Sand – Plastering',           category: 'other',  quantity: r2(wallFaceAreaFt2 * 2 * 0.012), unit: 'tons' });

  // Flooring
  const floorSqft = totalArea;
  materials.push({ materialName: 'Vitrified Floor Tiles (600×600mm)', category: 'tiles', quantity: r0(floorSqft * 0.11), unit: 'sqm' });
  materials.push({ materialName: 'Tile Adhesive / Cement Mortar',     category: 'cement', quantity: r0(floorSqft * 0.025), unit: 'bags' });

  return materials;
};


// ─── PLUMBING ─────────────────────────────────────────────────────────────────
const calculatePlumbing = (inputs) => {
  const {
    coldWaterPipeRuns = 0,
    hotWaterPipeRuns  = 0,
    drainPipeRuns     = 0,
    bathrooms         = 0,
    kitchens          = 0,
  } = inputs;

  const materials = [];

  if (coldWaterPipeRuns > 0) {
    materials.push({ materialName: 'CPVC Pipe 20mm (Cold Water)',  category: 'pipe',    quantity: r2(coldWaterPipeRuns * 1.15), unit: 'meter' });
    materials.push({ materialName: 'CPVC Fittings 20mm',           category: 'fitting', quantity: Math.ceil(coldWaterPipeRuns * 0.5), unit: 'nos' });
  }
  if (hotWaterPipeRuns > 0) {
    materials.push({ materialName: 'CPVC Pipe 25mm (Hot Water)',   category: 'pipe',    quantity: r2(hotWaterPipeRuns * 1.15),  unit: 'meter' });
    materials.push({ materialName: 'CPVC Fittings 25mm',           category: 'fitting', quantity: Math.ceil(hotWaterPipeRuns * 0.5), unit: 'nos' });
  }
  if (drainPipeRuns > 0) {
    materials.push({ materialName: 'uPVC Drain Pipe 110mm',        category: 'pipe',    quantity: r2(drainPipeRuns * 1.1),     unit: 'meter' });
    materials.push({ materialName: 'uPVC Drain Fittings 110mm',    category: 'fitting', quantity: Math.ceil(drainPipeRuns * 0.3), unit: 'nos' });
  }
  if (bathrooms > 0) {
    materials.push({ materialName: 'Water Closet (WC)',            category: 'bath_fittings', quantity: bathrooms, unit: 'nos' });
    materials.push({ materialName: 'Wash Basin',                   category: 'bath_fittings', quantity: bathrooms, unit: 'nos' });
    materials.push({ materialName: 'Shower Set',                   category: 'bath_fittings', quantity: bathrooms, unit: 'set' });
    materials.push({ materialName: 'Gate Valve 20mm',              category: 'fitting',       quantity: bathrooms * 3, unit: 'nos' });
  }
  if (kitchens > 0) {
    materials.push({ materialName: 'Kitchen Sink (SS)',            category: 'bath_fittings', quantity: kitchens, unit: 'nos' });
    materials.push({ materialName: 'Kitchen Tap',                  category: 'fitting',       quantity: kitchens, unit: 'nos' });
  }

  return materials;
};


// ─── ELECTRICAL ───────────────────────────────────────────────────────────────
const calculateElectrical = (inputs) => {
  const {
    lightPoints        = 0,
    fanPoints          = 0,
    socketPoints       = 0,
    acPoints           = 0,
    totalCircuitLength = 0,
    panels             = 1,
  } = inputs;

  const materials = [];
  const totalPts  = (lightPoints + fanPoints + socketPoints + acPoints) || 1;

  if (totalCircuitLength > 0) {
    if (lightPoints + fanPoints > 0)
      materials.push({ materialName: 'FR Wire 1.5 sqmm (Light/Fan)',  category: 'cable', quantity: r2((lightPoints + fanPoints) / totalPts * totalCircuitLength * 1.2), unit: 'meter' });
    if (socketPoints > 0)
      materials.push({ materialName: 'FR Wire 2.5 sqmm (Sockets)',    category: 'cable', quantity: r2(socketPoints / totalPts * totalCircuitLength * 1.2), unit: 'meter' });
    if (acPoints > 0)
      materials.push({ materialName: 'FR Wire 4 sqmm (AC)',           category: 'cable', quantity: r2(acPoints / totalPts * totalCircuitLength * 1.2), unit: 'meter' });
    materials.push({ materialName: 'Earth Wire 1.5 sqmm',             category: 'cable', quantity: r2(totalCircuitLength * 1.1), unit: 'meter' });
    materials.push({ materialName: 'PVC Conduit 20mm',                category: 'electrical_accessories', quantity: r2(totalCircuitLength * 1.1), unit: 'meter' });
  }

  if (lightPoints > 0)   materials.push({ materialName: 'Modular Switch 1-Way',  category: 'switch', quantity: lightPoints,  unit: 'nos' });
  if (fanPoints > 0)     materials.push({ materialName: 'Fan Regulator / Switch', category: 'switch', quantity: fanPoints,    unit: 'nos' });
  if (socketPoints > 0) {
    materials.push({ materialName: 'Modular 5A Socket',               category: 'switch', quantity: socketPoints,                  unit: 'nos' });
    materials.push({ materialName: 'Modular 15A Socket',              category: 'switch', quantity: Math.ceil(socketPoints * 0.3), unit: 'nos' });
  }
  if (acPoints > 0)      materials.push({ materialName: 'AC Socket 25A',          category: 'switch', quantity: acPoints, unit: 'nos' });

  if (panels > 0) {
    materials.push({ materialName: 'MCB Distribution Board 12-way',   category: 'electrical_accessories', quantity: panels, unit: 'nos' });
    materials.push({ materialName: 'MCB 6A Single Pole',              category: 'electrical_accessories', quantity: Math.ceil(totalPts * 0.6), unit: 'nos' });
    materials.push({ materialName: 'MCB 16A Single Pole',             category: 'electrical_accessories', quantity: Math.ceil(totalPts * 0.4), unit: 'nos' });
  }

  return materials;
};


// ─── Main entry ───────────────────────────────────────────────────────────────
const calculateMaterials = (drawingType, inputs) => {
  switch (drawingType) {
    case 'structural':    return calculateStructural(inputs);
    case 'architectural': return calculateArchitectural(inputs);
    case 'plumbing':      return calculatePlumbing(inputs);
    case 'electrical':    return calculateElectrical(inputs);
    default:              return [];
  }
};

module.exports = { calculateMaterials, calculateStructural, calculateArchitectural, calculatePlumbing, calculateElectrical };
