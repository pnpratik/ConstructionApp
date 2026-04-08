/**
 * cameraCapture.js — CCTV snapshot utility
 *
 * Supports:
 *   Hikvision  — ISAPI REST snapshot
 *   Dahua/CP Plus — CGI snapshot
 *   Axis       — VAPIX snapshot
 *   Generic    — configurable URL
 *   none/mock  — returns placeholder (for testing without real camera)
 */

const http  = require('http');
const https = require('https');
const path  = require('path');
const fs    = require('fs');

// ─── Build snapshot URL based on brand ──────────────────────────────────────
const getSnapshotUrl = (camera) => {
  // Custom URL always wins
  if (camera.snapshotUrl && camera.snapshotUrl.trim()) return camera.snapshotUrl.trim();

  const ip   = camera.ip;
  const port = camera.port || 80;
  const ch   = camera.channel || 1;

  switch (camera.brand) {
    case 'hikvision':
      // Hikvision ISAPI — most common in India
      return `http://${ip}:${port}/ISAPI/Streaming/channels/${ch}01/picture`;

    case 'dahua':
    case 'cpplus':
      // CP Plus uses Dahua OEM firmware
      return `http://${ip}:${port}/cgi-bin/snapshot.cgi?channel=${ch}`;

    case 'axis':
      return `http://${ip}:${port}/axis-cgi/jpg/image.cgi?resolution=1280x720`;

    case 'onvif':
    case 'generic':
    default:
      // Common fallback URL — many generic IP cameras use this
      return `http://${ip}:${port}/snapshot.cgi`;
  }
};

// ─── Fetch image buffer from camera ─────────────────────────────────────────
const fetchSnapshot = (camera) => {
  return new Promise((resolve, reject) => {
    const url  = getSnapshotUrl(camera);
    const auth = Buffer.from(`${camera.username || 'admin'}:${camera.password || ''}`).toString('base64');

    let parsed;
    try { parsed = new URL(url); } catch {
      return reject(new Error(`Invalid camera URL: ${url}`));
    }

    const options = {
      hostname: parsed.hostname,
      port:     parseInt(parsed.port) || 80,
      path:     parsed.pathname + parsed.search,
      method:   'GET',
      headers:  { Authorization: `Basic ${auth}` },
      timeout:  10000, // 10s
    };

    const protocol = parsed.protocol === 'https:' ? https : http;

    const req = protocol.request(options, (res) => {
      if (res.statusCode !== 200) {
        return reject(new Error(`Camera HTTP ${res.statusCode} — check IP/credentials`));
      }
      const chunks = [];
      res.on('data', c => chunks.push(c));
      res.on('end', () => resolve(Buffer.concat(chunks)));
    });

    req.on('error', (e) => reject(new Error(`Cannot reach camera: ${e.message}`)));
    req.on('timeout', () => { req.destroy(); reject(new Error('Camera timed out (10s)')); });
    req.end();
  });
};

// ─── Save snapshot to disk, return URL ──────────────────────────────────────
const saveSnapshot = async (camera, storeId) => {
  try {
    // If camera brand is 'none' or not enabled → skip (no error)
    if (!camera || !camera.enabled || camera.brand === 'none') {
      return { success: false, error: 'Camera not configured' };
    }

    const buffer = await fetchSnapshot(camera);

    const dir      = path.join(__dirname, '../uploads/snapshots');
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

    const filename  = `snap_${storeId}_${Date.now()}.jpg`;
    const filepath  = path.join(dir, filename);
    fs.writeFileSync(filepath, buffer);

    return { success: true, url: `/uploads/snapshots/${filename}` };
  } catch (err) {
    console.error(`[Camera] Snapshot failed for store ${storeId}: ${err.message}`);
    return { success: false, error: err.message };
  }
};

// ─── Find matching store for an order ────────────────────────────────────────
// Matches order item categories to store materialCategories
const findStoreForOrder = async (orderItems) => {
  const Store = require('../models/Store');
  const categories = [...new Set((orderItems || []).map(i => i.category).filter(Boolean))];

  if (!categories.length) return null;

  // Find store with camera enabled that holds any of these categories
  const store = await Store.findOne({
    isActive: true,
    'camera.enabled': true,
    materialCategories: { $in: categories },
  });

  return store;
};

module.exports = { saveSnapshot, fetchSnapshot, getSnapshotUrl, findStoreForOrder };
