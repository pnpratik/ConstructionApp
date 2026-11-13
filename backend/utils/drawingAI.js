/**
 * Drawing AI Analyzer — reads uploaded construction drawings using Claude vision.
 * Supports: PNG, JPG, PDF. DWG/DXF files return a manual-input fallback.
 *
 * Returns:
 *   { success, extracted, clarifyingQuestions, confidence, notes }
 *   or
 *   { success:false, reason, message, needsManualInput }
 */

const fs   = require('fs');
const path = require('path');

// ─── Prompt builder per drawing type ─────────────────────────────────────────

const STRUCTURAL_FIELDS = `{
  "barDiameters": [],
  "totalSteelKg": null,
  "slabThickness": null,
  "floorArea": null,
  "floors": null,
  "isTypicalSlab": false,
  "isTypicalFloor": false,
  "concreteSlab": null,
  "concreteColumn": null
}`;

const ARCHITECTURAL_FIELDS = `{
  "floorArea": null,
  "floors": null,
  "wallLength": null,
  "wallHeight": null,
  "wallThickness": null,
  "masonryType": null,
  "isTypicalFloor": false
}`;

const PLUMBING_FIELDS = `{
  "coldWaterPipeRuns": null,
  "hotWaterPipeRuns": null,
  "drainPipeRuns": null,
  "bathrooms": null,
  "kitchens": null
}`;

const ELECTRICAL_FIELDS = `{
  "lightPoints": null,
  "fanPoints": null,
  "socketPoints": null,
  "acPoints": null,
  "totalCircuitLength": null,
  "panels": null
}`;

const TYPE_EXTRACT_GUIDE = {
  structural: `
You are reading a STRUCTURAL (RCC) drawing. Extract:
- barDiameters: array of rebar / TMT bar diameters (in mm as strings) found in the Bar Bending Schedule (BBS) table, annotations, section details, or schedules. E.g. ["8","12","16","20"]. Only include diameters EXPLICITLY labelled — do NOT assume.
- totalSteelKg: if the BBS table has a grand total weight, extract it as a number in kg.
- slabThickness: slab thickness in mm from section/detail (e.g. 125, 150, 175).
- floorArea: floor plate area in sqft if grid dimensions or room dimensions allow calculation.
- floors: total number of floors/storeys if stated in title block or general notes.
- isTypicalSlab: true if drawing title or notes says "TYPICAL SLAB" or "TYP. SLAB".
- isTypicalFloor: true if drawing title or notes says "TYPICAL FLOOR" or "TYP. FLOOR".
- concreteSlab: concrete volume (in cum) for slabs if a concrete schedule is provided.
- concreteColumn: concrete volume (in cum) for columns/beams if a concrete schedule is provided.
`,
  architectural: `
You are reading an ARCHITECTURAL drawing (floor plan / elevation). Extract:
- floorArea: total floor area in sqft. Calculate from room dimensions if visible (multiply width × length for each room and sum). Note if this is per-floor or total.
- floors: total number of floors/storeys if stated in title block or notes.
- wallLength: total wall centre-line length in meters for ALL walls on this plan.
- wallHeight: floor-to-ceiling height in meters from sections or elevation views.
- wallThickness: predominant wall thickness in inches (3, 4, or 9) from wall legend or annotations.
- masonryType: "brick" or "block" based on wall legend, notes, or hatch pattern descriptions.
- isTypicalFloor: true if the drawing title says "TYPICAL FLOOR" or "STANDARD FLOOR".
`,
  plumbing: `
You are reading a PLUMBING drawing (sanitary / water supply). Extract:
- coldWaterPipeRuns: estimated total cold water supply pipe length in meters.
- hotWaterPipeRuns: estimated total hot water supply pipe length in meters.
- drainPipeRuns: estimated total drain / soil pipe length in meters.
- bathrooms: total number of bathrooms/toilets served by this drawing.
- kitchens: total number of kitchen/utility sinks served.
`,
  electrical: `
You are reading an ELECTRICAL drawing (power / lighting layout). Extract:
- lightPoints: total number of light points (bulb/fixture symbols) on this drawing.
- fanPoints: total number of ceiling fan points.
- socketPoints: total number of socket / power points (5A + 15A combined).
- acPoints: total number of air-conditioner points (25A circuits).
- totalCircuitLength: total wiring run length in meters if circuit lengths are annotated.
- panels: number of distribution boards / MCB panels shown.
`,
};

const buildPrompt = (drawingType) => {
  const guide = TYPE_EXTRACT_GUIDE[drawingType] || TYPE_EXTRACT_GUIDE.structural;

  const fieldTemplate = {
    structural:    STRUCTURAL_FIELDS,
    architectural: ARCHITECTURAL_FIELDS,
    plumbing:      PLUMBING_FIELDS,
    electrical:    ELECTRICAL_FIELDS,
  }[drawingType] || STRUCTURAL_FIELDS;

  return `You are an expert construction drawing analyst. Analyze this ${drawingType} drawing carefully.

${guide}

CRITICAL RULES:
1. Only extract values EXPLICITLY shown in the drawing. Do not estimate or assume.
2. Set null for anything not visible or unclear.
3. For bar diameters, read the BBS table or reinforcement schedule — only list diameters that appear. Never add diameters not in the drawing.
4. If you see "TYPICAL" elements (slab, floor), create a clarifying question asking how many times this repeats.
5. If floor area or floors count is missing from the drawing, create a clarifying question for it.
6. Keep clarifying questions SHORT and specific — the user is on-site.

Return ONLY valid JSON, no markdown fences, no explanation:
{
  "extracted": ${fieldTemplate},
  "clarifyingQuestions": [
    {
      "id": "uniqueId",
      "question": "Short, specific question to ask the user",
      "type": "number",
      "fieldName": "fieldNameInExtracted",
      "hint": "e.g. '3 for G+2 building'"
    }
  ],
  "confidence": "high|medium|low",
  "notes": "One sentence — what you observed"
}

clarifyingQuestions.type can be: "number" | "select"
For "select" type, also include "options": ["option1", "option2"]`;
};

// ─── Main analyzer ────────────────────────────────────────────────────────────

const analyzeDrawingWithAI = async (filePath, drawingType) => {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey || apiKey === 'your_anthropic_api_key_here') {
    return {
      success: false,
      reason: 'no_api_key',
      message: 'ANTHROPIC_API_KEY not configured in .env',
      needsManualInput: true,
    };
  }

  const ext = path.extname(filePath).toLowerCase();
  const imageTypes = ['.png', '.jpg', '.jpeg'];
  const pdfType    = '.pdf';

  if (![...imageTypes, pdfType].includes(ext)) {
    return {
      success: false,
      reason: 'unsupported_format',
      message: `AI analysis works on PDF, PNG, or JPG files. ${ext.toUpperCase()} files cannot be read automatically. Please also upload a PDF version of this drawing for AI analysis.`,
      needsManualInput: true,
    };
  }

  if (!fs.existsSync(filePath)) {
    return { success: false, reason: 'file_not_found', message: 'Uploaded file not found on disk', needsManualInput: true };
  }

  try {
    const Anthropic = require('@anthropic-ai/sdk');
    const client    = new Anthropic({ apiKey });

    const fileBytes  = fs.readFileSync(filePath);
    const base64Data = fileBytes.toString('base64');

    const isPdf = ext === '.pdf';
    const mediaType = isPdf ? 'application/pdf'
      : ext === '.png' ? 'image/png' : 'image/jpeg';

    // Build content array
    const contentBlock = isPdf
      ? { type: 'document', source: { type: 'base64', media_type: mediaType, data: base64Data } }
      : { type: 'image',    source: { type: 'base64', media_type: mediaType, data: base64Data } };

    const requestParams = {
      model:      'claude-sonnet-4-6',
      max_tokens: 2000,
      messages: [{
        role: 'user',
        content: [
          contentBlock,
          { type: 'text', text: buildPrompt(drawingType) },
        ],
      }],
    };

    if (isPdf) {
      requestParams.betas = ['pdfs-2024-09-25'];
    }

    console.log(`🔍 Analyzing ${ext} drawing with Claude AI (type: ${drawingType})...`);
    const response = await client.messages.create(requestParams);
    const raw      = response.content[0].text.trim();

    // Strip markdown fences if model added them
    const jsonStr = raw.replace(/^```json\s*/i, '').replace(/\s*```$/, '').trim();

    let parsed;
    try {
      parsed = JSON.parse(jsonStr);
    } catch (parseErr) {
      console.error('AI JSON parse failed. Raw response:', raw.substring(0, 500));
      return { success: false, reason: 'parse_error', message: 'AI returned unexpected format', needsManualInput: true };
    }

    const extracted   = parsed.extracted   || {};
    const questions   = parsed.clarifyingQuestions || [];
    const confidence  = parsed.confidence  || 'low';
    const notes       = parsed.notes       || '';

    // If floor area / floors still missing, add default questions
    if ((drawingType === 'structural' || drawingType === 'architectural') && !extracted.floorArea) {
      if (!questions.find(q => q.fieldName === 'floorArea')) {
        questions.push({
          id: 'floorArea',
          question: 'What is the floor area per floor? (sqft)',
          type: 'number',
          fieldName: 'floorArea',
          hint: 'e.g. 1200 for a 1200 sqft floor plate',
        });
      }
    }
    if ((drawingType === 'structural' || drawingType === 'architectural') && !extracted.floors) {
      if (!questions.find(q => q.fieldName === 'floors')) {
        questions.push({
          id: 'floors',
          question: 'How many floors total? (including Ground floor)',
          type: 'number',
          fieldName: 'floors',
          hint: 'G+2 = 3 floors',
        });
      }
    }

    console.log(`✅ AI analysis done. Confidence: ${confidence}. Questions: ${questions.length}`);
    return { success: true, extracted, clarifyingQuestions: questions, confidence, notes };

  } catch (err) {
    console.error('Drawing AI error:', err.message);
    return {
      success: false,
      reason: 'api_error',
      message: err.message,
      needsManualInput: true,
    };
  }
};

module.exports = { analyzeDrawingWithAI };
