/**
 * Rule-based Material Calculator
 * Estimates material quantities from drawing inputs
 */

/**
 * Calculate materials from STRUCTURAL / ARCHITECTURAL drawing
 * @param {Object} inputs - { floorArea (sqft), floors, wallLength (m), wallHeight (m), wallThickness (inches) }
 */
const calculateStructural = (inputs) => {
  const { floorArea = 0, floors = 1, wallLength = 0, wallHeight = 3, wallThickness = 9 } = inputs;
  const totalArea = floorArea * floors;
  const wallVolumeCFT = wallLength * 3.28 * wallHeight * 3.28 * (wallThickness / 12); // in cft

  const materials = [];

  // Steel (TMT Bars) – approx 4 kg per sqft for RCC slabs
  materials.push({
    materialName: 'TMT Steel Bars',
    category: 'steel',
    quantity: parseFloat((totalArea * 4).toFixed(2)),
    unit: 'kg'
  });

  // Cement – approx 0.4 bags per sqft (slab + plaster)
  materials.push({
    materialName: 'Cement (OPC 53)',
    category: 'cement',
    quantity: parseFloat((totalArea * 0.4 + wallVolumeCFT * 0.25).toFixed(2)),
    unit: 'bag'
  });

  // Bricks/Blocks – based on wall volume
  if (wallThickness === 4.5) {
    // 4.5 inch wall → Half-brick wall → ~55 bricks per sqft of wall face
    const wallFaceArea = wallLength * 3.28 * wallHeight * 3.28;
    materials.push({
      materialName: 'Bricks (4.5" wall)',
      category: 'brick',
      quantity: parseFloat((wallFaceArea * 55).toFixed(0)),
      unit: 'nos'
    });
  } else {
    // 9 inch wall → Full-brick wall → ~110 bricks per sqft of wall face
    const wallFaceArea = wallLength * 3.28 * wallHeight * 3.28;
    materials.push({
      materialName: 'Bricks (9" wall)',
      category: 'brick',
      quantity: parseFloat((wallFaceArea * 110).toFixed(0)),
      unit: 'nos'
    });
    // OR Concrete Blocks (alternative)
    materials.push({
      materialName: 'Concrete Blocks (8" AAC)',
      category: 'block',
      quantity: parseFloat((wallFaceArea * 9).toFixed(0)),
      unit: 'nos'
    });
  }

  // Concrete (RMC) for slabs – approx 0.05 cum per sqft
  materials.push({
    materialName: 'Ready-Mix Concrete (M25)',
    category: 'concrete',
    quantity: parseFloat((totalArea * 0.05).toFixed(2)),
    unit: 'cum'
  });

  // River Sand – approx 0.02 cum per sqft
  materials.push({
    materialName: 'River Sand / M-Sand',
    category: 'other',
    quantity: parseFloat((totalArea * 0.02 + wallVolumeCFT * 0.35).toFixed(2)),
    unit: 'cum'
  });

  return materials;
};

/**
 * Calculate materials from PLUMBING drawing
 * @param {Object} inputs - { coldWaterPipeRuns, hotWaterPipeRuns, drainPipeRuns, bathrooms, kitchens }
 */
const calculatePlumbing = (inputs) => {
  const {
    coldWaterPipeRuns = 0,
    hotWaterPipeRuns = 0,
    drainPipeRuns = 0,
    bathrooms = 0,
    kitchens = 0
  } = inputs;

  const materials = [];

  // CPVC Pipes (cold water) – 20mm
  if (coldWaterPipeRuns > 0) {
    materials.push({
      materialName: 'CPVC Pipe 20mm (Cold Water)',
      category: 'pipe',
      quantity: parseFloat((coldWaterPipeRuns * 1.15).toFixed(2)), // 15% extra for wastage
      unit: 'meter'
    });
    // Fittings – approx 1 fitting per 2 meters
    materials.push({
      materialName: 'CPVC Fittings 20mm',
      category: 'fitting',
      quantity: Math.ceil(coldWaterPipeRuns * 0.5),
      unit: 'nos'
    });
  }

  // CPVC Pipes (hot water) – 25mm
  if (hotWaterPipeRuns > 0) {
    materials.push({
      materialName: 'CPVC Pipe 25mm (Hot Water)',
      category: 'pipe',
      quantity: parseFloat((hotWaterPipeRuns * 1.15).toFixed(2)),
      unit: 'meter'
    });
    materials.push({
      materialName: 'CPVC Fittings 25mm',
      category: 'fitting',
      quantity: Math.ceil(hotWaterPipeRuns * 0.5),
      unit: 'nos'
    });
  }

  // uPVC Drainage Pipes – 110mm
  if (drainPipeRuns > 0) {
    materials.push({
      materialName: 'uPVC Drain Pipe 110mm',
      category: 'pipe',
      quantity: parseFloat((drainPipeRuns * 1.1).toFixed(2)),
      unit: 'meter'
    });
    materials.push({
      materialName: 'uPVC Drain Fittings 110mm',
      category: 'fitting',
      quantity: Math.ceil(drainPipeRuns * 0.3),
      unit: 'nos'
    });
  }

  // Bathroom fittings per bathroom
  if (bathrooms > 0) {
    materials.push({
      materialName: 'Water Closet (WC)',
      category: 'bath_fittings',
      quantity: bathrooms,
      unit: 'nos'
    });
    materials.push({
      materialName: 'Wash Basin',
      category: 'bath_fittings',
      quantity: bathrooms,
      unit: 'nos'
    });
    materials.push({
      materialName: 'Shower Set',
      category: 'bath_fittings',
      quantity: bathrooms,
      unit: 'set'
    });
    materials.push({
      materialName: 'Gate Valve 20mm',
      category: 'fitting',
      quantity: bathrooms * 3,
      unit: 'nos'
    });
  }

  // Kitchen fittings
  if (kitchens > 0) {
    materials.push({
      materialName: 'Kitchen Sink (SS)',
      category: 'bath_fittings',
      quantity: kitchens,
      unit: 'nos'
    });
    materials.push({
      materialName: 'Kitchen Tap',
      category: 'fitting',
      quantity: kitchens,
      unit: 'nos'
    });
  }

  return materials;
};

/**
 * Calculate materials from ELECTRICAL drawing
 * @param {Object} inputs - { lightPoints, fanPoints, socketPoints, acPoints, totalCircuitLength, panels }
 */
const calculateElectrical = (inputs) => {
  const {
    lightPoints = 0,
    fanPoints = 0,
    socketPoints = 0,
    acPoints = 0,
    totalCircuitLength = 0,
    panels = 1
  } = inputs;

  const materials = [];
  const totalPoints = lightPoints + fanPoints + socketPoints + acPoints;

  // Wiring cables
  if (totalCircuitLength > 0) {
    // 1.5 sq mm for lights & fans
    materials.push({
      materialName: 'FR Wire 1.5 sqmm (Light/Fan)',
      category: 'cable',
      quantity: parseFloat(((lightPoints + fanPoints) * totalCircuitLength / (totalPoints || 1) * 1.2).toFixed(2)),
      unit: 'meter'
    });

    // 2.5 sq mm for sockets
    materials.push({
      materialName: 'FR Wire 2.5 sqmm (Socket)',
      category: 'cable',
      quantity: parseFloat((socketPoints * totalCircuitLength / (totalPoints || 1) * 1.2).toFixed(2)),
      unit: 'meter'
    });

    // 4 sq mm for AC points
    if (acPoints > 0) {
      materials.push({
        materialName: 'FR Wire 4 sqmm (AC)',
        category: 'cable',
        quantity: parseFloat((acPoints * totalCircuitLength / (totalPoints || 1) * 1.2).toFixed(2)),
        unit: 'meter'
      });
    }

    // Earth wire (green/yellow) – same run as circuit
    materials.push({
      materialName: 'Earth Wire 1.5 sqmm',
      category: 'cable',
      quantity: parseFloat((totalCircuitLength * 1.1).toFixed(2)),
      unit: 'meter'
    });

    // Conduit pipe (20mm PVC)
    materials.push({
      materialName: 'PVC Conduit 20mm',
      category: 'electrical_accessories',
      quantity: parseFloat((totalCircuitLength * 1.1).toFixed(2)),
      unit: 'meter'
    });
  }

  // Switches & sockets
  if (lightPoints > 0) {
    materials.push({
      materialName: 'Modular Switch (1 way)',
      category: 'switch',
      quantity: lightPoints,
      unit: 'nos'
    });
  }
  if (fanPoints > 0) {
    materials.push({
      materialName: 'Fan Regulator / Switch',
      category: 'switch',
      quantity: fanPoints,
      unit: 'nos'
    });
  }
  if (socketPoints > 0) {
    materials.push({
      materialName: 'Modular 5A Socket',
      category: 'switch',
      quantity: socketPoints,
      unit: 'nos'
    });
    materials.push({
      materialName: 'Modular 15A Socket',
      category: 'switch',
      quantity: Math.ceil(socketPoints * 0.3),
      unit: 'nos'
    });
  }
  if (acPoints > 0) {
    materials.push({
      materialName: 'AC Socket 25A',
      category: 'switch',
      quantity: acPoints,
      unit: 'nos'
    });
  }

  // Distribution Board / MCB panel
  if (panels > 0) {
    materials.push({
      materialName: 'MCB Distribution Board (12-way)',
      category: 'electrical_accessories',
      quantity: panels,
      unit: 'nos'
    });
    materials.push({
      materialName: 'MCB 6A (Single Pole)',
      category: 'electrical_accessories',
      quantity: Math.ceil(totalPoints * 0.6),
      unit: 'nos'
    });
    materials.push({
      materialName: 'MCB 16A (Single Pole)',
      category: 'electrical_accessories',
      quantity: Math.ceil(totalPoints * 0.4),
      unit: 'nos'
    });
  }

  return materials;
};

/**
 * Main calculator function
 */
const calculateMaterials = (drawingType, inputs) => {
  switch (drawingType) {
    case 'structural':
    case 'architectural':
      return calculateStructural(inputs);
    case 'plumbing':
      return calculatePlumbing(inputs);
    case 'electrical':
      return calculateElectrical(inputs);
    default:
      return [];
  }
};

module.exports = { calculateMaterials, calculateStructural, calculatePlumbing, calculateElectrical };
