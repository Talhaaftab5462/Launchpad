const fs   = require('fs')
const path = require('path')
const { nativeImage } = require('electron')

const iconCache = new Map()

function bakeAccentIntoSvg(svgPath, accentHex) {
  let svg = fs.readFileSync(svgPath, 'utf8')
  svg = svg.replace(/var\(--accent\)/g, accentHex)
  svg = svg.replace(/#c07cff/gi, accentHex)
  svg = svg.replace(/#3b82f6/gi, accentHex)
  return svg
}

function bakeAccentIntoSvgFlat(svgPath, accentHex) {
  let svg = bakeAccentIntoSvg(svgPath, accentHex)
  svg = svg.replace(/\s*filter="url\(#[^"]*\)"/g, '')
  svg = svg.replace(/<filter[\s\S]*?<\/filter>/g, '')
  return svg
}

async function svgToPng(svgString, size) {
  const sharp = require('sharp')
  return sharp(Buffer.from(svgString))
    .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png({ compressionLevel: 9 })
    .toBuffer()
}

function getPngLogoPath(svgPath) {
  const candidate = path.join(path.dirname(svgPath), 'launchpad-logo-circle.png')
  return fs.existsSync(candidate) ? candidate : null
}

function hexToRgb(hex) {
  const h = hex.replace('#', '')
  return {
    r: parseInt(h.slice(0, 2), 16),
    g: parseInt(h.slice(2, 4), 16),
    b: parseInt(h.slice(4, 6), 16),
  }
}

async function getNativeImage(svgPath, accentHex, size, flat = false) {
  const cacheKey = `${accentHex}-${size}-${flat ? 'flat' : 'full'}`
  if (iconCache.has(cacheKey)) return iconCache.get(cacheKey)

  try {
    const sharp = require('sharp')
    const pngPath = getPngLogoPath(svgPath)
    let pngBuffer

    if (pngPath) {
      pngBuffer = await sharp(pngPath)
        .resize(size, size, { fit: 'contain', background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .tint(hexToRgb(accentHex))
        .png()
        .toBuffer()
    } else {
      const svg = flat ? bakeAccentIntoSvgFlat(svgPath, accentHex) : bakeAccentIntoSvg(svgPath, accentHex)
      pngBuffer = await svgToPng(svg, size)
    }

    const image = nativeImage.createFromBuffer(pngBuffer, { scaleFactor: 1 })
    iconCache.set(cacheKey, image)
    return image
  } catch (err) {
    console.error(`[IconGen] Failed to render ${size}px icon:`, err.message)
    return null
  }
}

async function getTrayNativeImage(svgPath, accentHex) {
  try {
    const [img16, img32] = await Promise.all([
      getNativeImage(svgPath, accentHex, 16, true),
      getNativeImage(svgPath, accentHex, 32, true),
    ])

    if (!img16 && !img32) return null

    if (process.platform === 'darwin' && img16 && img32) {
      const multi = nativeImage.createEmpty()
      multi.addRepresentation({ scaleFactor: 1.0, buffer: img16.toPNG() })
      multi.addRepresentation({ scaleFactor: 2.0, buffer: img32.toPNG() })
      return multi
    }

    return img32 || img16
  } catch (err) {
    console.error('[IconGen] getTrayNativeImage failed:', err.message)
    return null
  }
}

async function getAppNativeImage(svgPath, accentHex) {
  return getNativeImage(svgPath, accentHex, 256, false)
}

function clearIconCache() {
  iconCache.clear()
}

module.exports = {
  getTrayNativeImage,
  getAppNativeImage,
  clearIconCache,
}