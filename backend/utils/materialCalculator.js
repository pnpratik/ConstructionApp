/**
 * Nirmaan – Rule-based Material Calculator
 * Estimates material quantities from drawing inputs
 */

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Round to 2 decimal places */
const r2 = (n) => parseFloat(n.toFixed(2));

/** Round to nearest whole number */
const r0 = (n) => Math.round(n);

/** Truck loads helper: given qty in tons, return string like "15T × 3 trips" */
const truckLoads = (tons, truckSize) => Math.ceil(tons / truckSize);

// ─── STRUCTURAL / ARCHITECTURAL ───────────────────────────────────────────────
/**
 * @param {Object} inputs
 *   floorArea      – sqft per floor
 *   floors         – number of floors (incl. ground)
 *   wallLength     – total wall length per floor (meters)
 *   wallHeight     – floor-to-ceiling height (meters), default 3
 *   wallThickness  – 3 | 4 | 9  (inches)
 *   masonryType    – 'brick' | 'block'
 */
const calculateStructural = (inputs) => {
  const {
    floorArea     = 0,
    floors        = 1,
    wallLength    = 0,
    wallHeight    = 3,
    wallThickness = 9,    // inches: 3, 4, or 9
    masonryType   = 'brick',
  } = inputs;

  const totalArea     = floorArea * floors;           // sqft
  const wallFaceAreaFt2 = wallLength * 3.281 * wallHeight * 3.281; // ft²
  const wallVolumeCFT = wallFaceAreaFt2 * (wallThickness / 12);    // cft
  const totalSteelKg  = totalArea * 4;                // 4 kg/sqft rule of thumb

  const materials = [];

  // ── STEEL by bar diameter ─────────────────────────────────────────────────
  // Distribution ratios based on typical residential RCC structure
  const steelDist = {
    '6mm  (Stirrups / Distribution)':   0.05,
    '8mm  (Slab Distribution Bars)':    0.12,
    '12mm (Slab Main / Light Columns)': 0.22,
    '16mm (Beam Bars / Columns)':       0.25,
    '20mm (Heavy Beams / Columns)':     0.18,
    '25mm (Main Column Bars)':          0.12,
    '32mm (Heavy Column / Foundation)': 0.06,
  };

  Object.entries(steelDist).forEach(([dia, ratio]) => {
    const qty = r0(totalSteelKg * ratio);
    if (qty > 0) {
      materials.push({
        materialName: `TMT Steel Bar – ${dia}`,
        category: 'steel',
        quantity: qty,
        unit: 'kg',
      });
    }
  });

  // Total steel summary row
  materials.push({
    materialName: 'TMT Steel – Total (all diameters)',
    category: 'steel',
    quantity: r0(totalSteelKg),
    unit: 'kg',
  });

  // Binding wire – ~1 kg per 100 kg steel
  materials.push({
    materialName: 'Binding Wire (16 gauge)',
    category: 'steel',
    quantity: r2(totalSteelKg * 0.01),
    unit: 'kg',
  });

  // ── CEMENT in bags ────────────────────────────────────────────────────────
  // OPC 53 – slab: 0.4 bags/sqft, walls: 0.25 bags/cft
  const cementBags = r2(totalArea * 0.40 + wallVolumeCFT * 0.25);
  materials.push({
    materialName: 'Cement – OPC 53 Grade (50 kg bag)',
    category: 'cement',
    quantity: cementBags,
    unit: 'bags',
  });

  // ── MASONRY: Brick OR Block ───────────────────────────────────────────────
  if (masonryType === 'block') {
    // AAC / Concrete blocks (600×200×200 mm for 8" wall, 600×200×100 for 4")
    const blockSizeLabel = wallThickness <= 4 ? '4" AAC Block (600×100×200mm)' : '8" AAC Block (600×200×200mm)';
    const blocksPerFt2   = wallThickness <= 4 ? 12 : 6; // approx per sqft of wall face
    materials.push({
      materialName: `${blockSizeLabel}`,
      category: 'block',
      quantity: r0(wallFaceAreaFt2 * blocksPerFt2),
      unit: 'nos',
    });
    // Block jointing mortar – ~0.02 bags/block
    materials.push({
      materialName: 'Block Jointing Mortar / Thin-bed Mortar',
      category: 'cement',
      quantity: r0(wallFaceAreaFt2 * blocksPerFt2 * 0.02),
      unit: 'bags',
    });
  } else {
    // Bricks – 3", 4", 9" wall
    let bricksPerFt2, brickLabel;
    if (wallThickness <= 3) {
      bricksPerFt2 = 35;  // ~35 bricks/sqft for 3" (75mm) skin wall
      brickLabel   = '3" Brick Wall (75mm)';
    } else if (wallThickness <= 4) {
      bricksPerFt2 = 55;  // ~55 bricks/sqft for 4" (100mm) half-brick wall
      brickLabel   = '4" Brick Wall (100mm)';
    } else {
      bricksPerFt2 = 110; // ~110 bricks/sqft for 9" (230mm) full-brick wall
      brickLabel   = '9" Brick Wall (230mm)';
    }
    materials.push({
      materialName: `Bricks – ${brickLabel}`,
      category: 'brick',
      quantity: r0(wallFaceAreaFt2 * bricksPerFt2),
      unit: 'nos',
    });
    // Mortar for brickwork – cement bags
    const mortarCementBags = r2(wallVolumeCFT * 0.18);
    materials.push({
      materialName: 'Cement for Brickwork Mortar (OPC)',
      category: 'cement',
      quantity: mortarCementBags,
      unit: 'bags',
    });
  }

  // ── CONCRETE (RMC / Site Mix) ─────────────────────────────────────────────
  const concreteCUM = r2(totalArea * 0.05); // 0.05 cum/sqft for slabs
  materials.push({
    materialName: 'Ready-Mix Concrete – M25 (Slabs)',
    category: 'concrete',
    quantity: concreteCUM,
    unit: 'cum',
  });
  materials.push({
    materialName: 'Ready-Mix Concrete – M30 (Columns/Beams)',
    category: 'concrete',
    quantity: r2(totalArea * 0.02),
    unit: 'cum',
  });

  // ── AGGREGATE ────────────────────────────────────────────────────────────
  // 20mm coarse aggregate: ~0.8 ton/sqft of slab (approx)
  const agg20Tons  = r2(concreteCUM * 1.2);  // 1.2 ton/cum
  const agg12Tons  = r2(concreteCUM * 0.5);  // 12mm for columns/beams
  const agg20_15T  = truckLoads(agg20Tons, 15);
  const agg20_25T  = truckLoads(agg20Tons, 25);
  const agg12_15T  = truckLoads(agg12Tons, 15);

  materials.push({
    materialName: `Coarse Aggregate 20mm – ${agg20Tons} tons (${agg20_15T} trips @15T  /  ${agg20_25T} trips @25T)`,
    category: 'other',
    quantity: agg20Tons,
    unit: 'tons',
  });
  materials.push({
    materialName: `Coarse Aggregate 12mm – ${agg12Tons} tons (${agg12_15T} trips @15T)`,
    category: 'other',
    quantity: agg12Tons,
    unit: 'tons',
  });

  // ── SAND / M-SAND ────────────────────────────────────────────────────────
  // Plastering + masonry + slab: ~0.025 cum/sqft → ~0.04 ton/sqft
  const sandTons   = r2((totalArea * 0.025 + wallVolumeCFT * 0.35 / 35.315) * 1.6); // cum → tons
  const sand_15T   = truckLoads(sandTons, 15);
  const sand_25T   = truckLoads(sandTons, 25);

  materials.push({
    materialName: `River Sand / M-Sand – ${sandTons} tons (${sand_15T} trips @15T  /  ${sand_25T} trips @25T)`,
    category: 'other',
    quantity: sandTons,
    unit: 'tons',
  });

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
    materials.push({ materialName: 'CPVC Pipe 20mm (Cold Water)',   category: 'pipe',    quantity: r2(coldWaterPipeRuns * 1.15), unit: 'meter' });
    materials.push({ materialName: 'CPVC Fittings 20mm',            category: 'fitting', quantity: Math.ceil(coldWaterPipeRuns * 0.5), unit: 'nos' });
  }
  if (hotWaterPipeRuns > 0) {
    materials.push({ materialName: 'CPVC Pipe 25mm (Hot Water)',    category: 'pipe',    quantity: r2(hotWaterPipeRuns * 1.15),  unit: 'meter' });
    materials.push({ materialName: 'CPVC Fittings 25mm',            category: 'fitting', quantity: Math.ceil(hotWaterPipeRuns * 0.5), unit: 'nos' });
  }
  if (drainPipeRuns > 0) {
    materials.push({ materialName: 'uPVC Drain Pipe 110mm',         category: 'pipe',    quantity: r2(drainPipeRuns * 1.1),      unit: 'meter' });
    materials.push({ materialName: 'uPVC Drain Fittings 110mm',     category: 'fitting', quantity: Math.ceil(drainPipeRuns * 0.3), unit: 'nos' });
  }
  if (bathrooms > 0) {
    materials.push({ materialName: 'Water Closet (WC)',             category: 'bath_fittings', quantity: bathrooms, unit: 'nos' });
    materials.push({ materialName: 'Wash Basin',                    category: 'bath_fittings', quantity: bathrooms, unit: 'nos' });
    materials.push({ materialName: 'Shower Set',                    category: 'bath_fittings', quantity: bathrooms, unit: 'set' });
    materials.push({ materialName: 'Gate Valve 20mm',               category: 'fitting',       quantity: bathrooms * 3, unit: 'nos' });
  }
  if (kitchens > 0) {
    materials.push({ materialName: 'Kitchen Sink (SS)',             category: 'bath_fittings', quantity: kitchens, unit: 'nos' });
    materials.push({ materialName: 'Kitchen Tap',                   category: 'fitting',       quantity: kitchens, unit: 'nos' });
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

  const materials  = [];
  const totalPts   = lightPoints + fanPoints + socketPoints + acPoints || 1;

  if (totalCircuitLength > 0) {
    materials.push({ materialName: 'FR Wire 1.5 sqmm (Light/Fan)',  category: 'cable', quantity: r2((lightPoints + fanPoints) * totalCircuitLength / totalPts * 1.2), unit: 'meter' });
    materials.push({ materialName: 'FR Wire 2.5 sqmm (Socket)',     category: 'cable', quantity: r2(socketPoints * totalCircuitLength / totalPts * 1.2),               unit: 'meter' });
    if (acPoints > 0)
      materials.push({ materialName: 'FR Wire 4 sqmm (AC)',         category: 'cable', quantity: r2(acPoints * totalCircuitLength / totalPts * 1.2),                   unit: 'meter' });
    materials.push({ materialName: 'Earth Wire 1.5 sqmm',           category: 'cable', quantity: r2(totalCircuitLength * 1.1),                                        unit: 'meter' });
    materials.push({ materialName: 'PVC Conduit 20mm',              category: 'electrical_accessories', quantity: r2(totalCircuitLength * 1.1), unit: 'meter' });
  }
  if (lightPoints > 0)  materials.push({ materialName: 'Modular Switch (1 way)',  category: 'switch', quantity: lightPoints,  unit: 'nos' });
  if (fanPoints > 0)    materials.push({ materialName: 'Fan Regulator / Switch',  category: 'switch', quantity: fanPoints,    unit: 'nos' });
  if (socketPoints > 0) {
    materials.push({ materialName: 'Modular 5A Socket',             category: 'switch', quantity: socketPoints,                 unit: 'nos' });
    materials.push({ materialName: 'Modular 15A Socket',            category: 'switch', quantity: Math.ceil(socketPoints * 0.3), unit: 'nos' });
  }
  if (acPoints > 0) materials.push({ materialName: 'AC Socket 25A', category: 'switch', quantity: acPoints, unit: 'nos' });
  if (panels > 0) {
    materials.push({ materialName: 'MCB Distribution Board (12-way)', category: 'electrical_accessories', quantity: panels,                        unit: 'nos' });
    materials.push({ materialName: 'MCB 6A (Single Pole)',            category: 'electrical_accessories', quantity: Math.ceil(totalPts * 0.6),     unit: 'nos' });
    materials.push({ materialName: 'MCB 16A (Single Pole)',           category: 'electrical_accessories', quantity: Math.ceil(totalPts * 0.4),     unit: 'nos' });
  }
  return materials;
};


// ─── Main entry ───────────────────────────────────────────────────────────────
const calculateMaterials = (drawingType, inputs) => {
  switch (drawingType) {
    case 'structural':
    case 'architectural': return calculateStructural(inputs);
    case 'plumbing':      return calculatePlumbing(inputs);
    case 'electrical':    return calculateElectrical(inputs);
    default:              return [];
  }
};

module.exports = { calculateMaterials, calculateStructural, calculatePlumbing, calculateElectrical };
