import fs from "node:fs/promises"
import path from "node:path"

/**
 * CRC32 implementation (SheetJS style) adapted from:
 * https://raw.githubusercontent.com/ohroy/hexo-abbrlink/master/lib/crc32.js
 */
function signed_crc_table() {
  let c = 0
  const table = new Array(256)
  for (let n = 0; n !== 256; ++n) {
    c = n
    c = (c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1)
    c = (c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1)
    c = (c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1)
    c = (c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1)
    c = (c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1)
    c = (c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1)
    c = (c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1)
    c = (c & 1) ? (-306674912 ^ (c >>> 1)) : (c >>> 1)
    table[n] = c
  }
  return typeof Int32Array !== "undefined" ? new Int32Array(table) : table
}

const CRC32_TABLE = signed_crc_table()

function crc32_str(str) {
  let C = -1
  for (let i = 0, L = str.length, c, d; i < L;) {
    c = str.charCodeAt(i++)
    if (c < 0x80) {
      C = (C >>> 8) ^ CRC32_TABLE[(C ^ c) & 0xFF]
    } else if (c < 0x800) {
      C = (C >>> 8) ^ CRC32_TABLE[(C ^ (192 | ((c >> 6) & 31))) & 0xFF]
      C = (C >>> 8) ^ CRC32_TABLE[(C ^ (128 | (c & 63))) & 0xFF]
    } else if (c >= 0xD800 && c < 0xE000) {
      c = (c & 1023) + 64
      d = str.charCodeAt(i++) & 1023
      C = (C >>> 8) ^ CRC32_TABLE[(C ^ (240 | ((c >> 8) & 7))) & 0xFF]
      C = (C >>> 8) ^ CRC32_TABLE[(C ^ (128 | ((c >> 2) & 63))) & 0xFF]
      C =
        (C >>> 8) ^
        CRC32_TABLE[(C ^ (128 | ((d >> 6) & 15) | ((c & 3) << 4))) & 0xFF]
      C = (C >>> 8) ^ CRC32_TABLE[(C ^ (128 | (d & 63))) & 0xFF]
    } else {
      C = (C >>> 8) ^ CRC32_TABLE[(C ^ (224 | ((c >> 12) & 15))) & 0xFF]
      C = (C >>> 8) ^ CRC32_TABLE[(C ^ (128 | ((c >> 6) & 63))) & 0xFF]
      C = (C >>> 8) ^ CRC32_TABLE[(C ^ (128 | (c & 63))) & 0xFF]
    }
  }
  return C ^ -1
}

function crc32hex(input) {
  // >>>0 converts to unsigned 32-bit
  return (crc32_str(String(input)) >>> 0).toString(16).padStart(8, "0")
}

async function listMarkdownFiles(dir) {
  const out = []
  const entries = await fs.readdir(dir, { withFileTypes: true })
  for (const ent of entries) {
    const p = path.join(dir, ent.name)
    if (ent.isDirectory()) {
      out.push(...(await listMarkdownFiles(p)))
    } else if (ent.isFile()) {
      const ext = path.extname(ent.name).toLowerCase()
      if (ext === ".md" || ext === ".mdx") out.push(p)
    }
  }
  return out
}

function detectEol(s) {
  return s.includes("\r\n") ? "\r\n" : "\n"
}

function parseFrontmatter(raw) {
  const eol = detectEol(raw)
  const lines = raw.split(eol)
  if (!lines.length) return { has: false, eol }
  if (lines[0].trim() !== "---") return { has: false, eol }

  let end = -1
  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      end = i
      break
    }
  }
  if (end === -1) return { has: false, eol }

  const fmLines = lines.slice(1, end)
  const bodyLines = lines.slice(end + 1)
  return {
    has: true,
    eol,
    fmLines,
    body: bodyLines.join(eol),
    startLineCount: end + 1,
  }
}

function getFrontmatterField(fmLines, key) {
  const re = new RegExp(`^\\s*${key}\\s*:\\s*(.+?)\\s*$`, "i")
  for (const line of fmLines) {
    const m = line.match(re)
    if (m) {
      let v = m[1].trim()
      v = v.replace(/^['"]/, "").replace(/['"]$/, "")
      return v
    }
  }
  return ""
}

function upsertAbbrlink(raw, abbrlink) {
  const parsed = parseFrontmatter(raw)
  const eol = parsed.eol
  const quoted = `"${abbrlink}"`

  if (!parsed.has) {
    const head = ["---", `abbrlink: ${quoted}`, "---", ""].join(eol)
    return head + raw
  }

  const fmLines = [...parsed.fmLines]
  const keyRe = /^\s*abbrlink\s*:/i
  const existingIdx = fmLines.findIndex((l) => keyRe.test(l))
  if (existingIdx >= 0) {
    fmLines.splice(existingIdx, 1)
  }

  const dateIdx = fmLines.findIndex((l) => /^\s*date\s*:/i.test(l))
  const titleIdx = fmLines.findIndex((l) => /^\s*title\s*:/i.test(l))
  const insertAt = dateIdx >= 0 ? dateIdx : titleIdx >= 0 ? titleIdx + 1 : 0
  fmLines.splice(insertAt, 0, `abbrlink: ${quoted}`)

  const rebuilt =
    ["---", ...fmLines, "---", parsed.body].join(eol)
  return rebuilt
}

async function main() {
  const repoRoot = process.cwd()
  const contentDir = path.join(repoRoot, "src", "content")

  let files = []
  try {
    files = await listMarkdownFiles(contentDir)
  } catch (e) {
    // No content dir? Nothing to do.
    return
  }

  files.sort((a, b) => a.localeCompare(b))

  const records = []
  for (const filePath of files) {
    const raw = await fs.readFile(filePath, "utf8")
    const parsed = parseFrontmatter(raw)
    const fmLines = parsed.has ? parsed.fmLines : []

    const rel = path
      .relative(contentDir, filePath)
      .split(path.sep)
      .join("/")

    const title = getFrontmatterField(fmLines, "title")
    const abbr = getFrontmatterField(fmLines, "abbrlink")

    records.push({
      filePath,
      rel,
      title,
      raw,
      abbr: abbr.trim(),
      baseSeed: (title || rel).trim(),
      hadAbbr: Boolean(abbr.trim()),
    })
  }

  // Allocate unique abbrlinks:
  // - keep existing if not duplicate
  // - generate for missing
  // - resolve duplicates by regenerating for all but one, deterministically
  const used = new Set()

  // First pass: assign existing unique, mark duplicates to fix
  const byAbbr = new Map()
  for (const r of records) {
    if (!r.abbr) continue
    const key = String(r.abbr)
    const arr = byAbbr.get(key) ?? []
    arr.push(r)
    byAbbr.set(key, arr)
  }

  const toFix = new Set()
  for (const [abbr, group] of byAbbr.entries()) {
    if (group.length === 1) {
      used.add(abbr)
      continue
    }
    // Keep the first (prefer one that already had abbrlink, then by path)
    group.sort((a, b) => {
      if (a.hadAbbr !== b.hadAbbr) return a.hadAbbr ? -1 : 1
      return a.rel.localeCompare(b.rel)
    })
    used.add(abbr)
    for (let i = 1; i < group.length; i++) toFix.add(group[i])
  }

  // Second pass: generate for missing and duplicates
  let changed = 0
  for (const r of records) {
    if (r.abbr && !toFix.has(r)) continue

    let attempt = 0
    while (true) {
      const seed = attempt === 0 ? r.baseSeed : `${r.baseSeed}#${attempt}`
      const next = crc32hex(seed)
      if (!used.has(next)) {
        used.add(next)
        if (r.abbr !== next) {
          r.abbr = next
          r.raw = upsertAbbrlink(r.raw, next)
          changed++
        }
        break
      }
      attempt++
    }
  }

  if (changed) {
    await Promise.all(records.map((r) => fs.writeFile(r.filePath, r.raw, "utf8")))
  }

  // Final verification: no missing / no duplicates
  const finalMap = new Map()
  for (const r of records) {
    const v = String(r.abbr || "").trim()
    if (!v) {
      throw new Error(`Missing abbrlink after generation: ${r.rel}`)
    }
    const arr = finalMap.get(v) ?? []
    arr.push(r.rel)
    finalMap.set(v, arr)
  }

  const dup = []
  for (const [abbr, rels] of finalMap.entries()) {
    if (rels.length > 1) dup.push({ abbr, rels })
  }
  if (dup.length) {
    const msg = dup
      .slice(0, 10)
      .map((d) => `${d.abbr}: ${d.rels.join(", ")}`)
      .join("\n")
    throw new Error(`Duplicate abbrlink detected:\n${msg}${dup.length > 10 ? "\n..." : ""}`)
  }
}

await main()

