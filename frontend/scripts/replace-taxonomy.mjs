#!/usr/bin/env node
import fs from "node:fs/promises"
import path from "node:path"
import process from "node:process"
import { fileURLToPath } from "node:url"
import { createInterface } from "node:readline/promises"

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url))
const FRONTEND_ROOT = path.resolve(SCRIPT_DIR, "..")
const POSTS_DIR = path.join(FRONTEND_ROOT, "src", "content", "post")

process.stdout.on("error", (error) => {
  if (error.code === "EPIPE") process.exit(0)
  throw error
})

const FIELD_ALIASES = new Map([
  ["1", "categories"],
  ["category", "categories"],
  ["categories", "categories"],
  ["cat", "categories"],
  ["分类", "categories"],
  ["2", "tags"],
  ["tag", "tags"],
  ["tags", "tags"],
  ["标签", "tags"],
])

function parseArgs(argv) {
  const args = {}

  for (let i = 0; i < argv.length; i++) {
    const item = argv[i]
    if (item === "--help" || item === "-h") {
      args.help = true
      continue
    }
    if (item === "--dry-run") {
      args.dryRun = true
      continue
    }

    const eq = item.match(/^--([^=]+)=(.*)$/)
    if (eq) {
      args[eq[1]] = eq[2]
      continue
    }

    if (item.startsWith("--")) {
      const key = item.slice(2)
      const next = argv[i + 1]
      if (next && !next.startsWith("--")) {
        args[key] = next
        i++
      } else {
        args[key] = true
      }
    }
  }

  return args
}

function usage() {
  console.log(`批量替换文章分类或标签

交互式运行:
  node scripts/replace-taxonomy.mjs

命令行运行:
  node scripts/replace-taxonomy.mjs --type categories --from GalGame --to Galgame
  node scripts/replace-taxonomy.mjs --type tags --from Key --to VisualArts

可选:
  --dry-run  只预览匹配数量，不写入文件`)
}

function normalizeField(input) {
  return FIELD_ALIASES.get(String(input || "").trim().toLowerCase()) || ""
}

async function promptMissingOptions(args) {
  if (args.help) return args

  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  })

  try {
    let field = normalizeField(args.type || args.field)
    while (!field) {
      const answer = await rl.question("请选择要替换的类型（1=分类 categories，2=标签 tags）：")
      field = normalizeField(answer)
      if (!field) console.log("输入无效，请输入 1、2、分类、标签、categories 或 tags。")
    }

    let from = args.from
    while (typeof from !== "string" || from.length === 0) {
      from = await rl.question("请输入要替换的原文本：")
      if (!from) console.log("原文本不能为空。")
    }

    let to = args.to
    while (typeof to !== "string" || to.length === 0) {
      to = await rl.question("请输入替换后的新文本：")
      if (!to) console.log("新文本不能为空。")
    }

    return { ...args, field, from, to }
  } finally {
    rl.close()
  }
}

async function listMarkdownFiles(dir) {
  const out = []
  const entries = await fs.readdir(dir, { withFileTypes: true })

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      out.push(...(await listMarkdownFiles(fullPath)))
    } else if (entry.isFile() && path.extname(entry.name).toLowerCase() === ".md") {
      out.push(fullPath)
    }
  }

  return out
}

function detectEol(raw) {
  return raw.includes("\r\n") ? "\r\n" : "\n"
}

function parseFrontmatter(raw) {
  const eol = detectEol(raw)
  const lines = raw.split(eol)

  if (lines[0]?.trim() !== "---") {
    return { hasFrontmatter: false, eol }
  }

  for (let i = 1; i < lines.length; i++) {
    if (lines[i].trim() === "---") {
      return {
        hasFrontmatter: true,
        eol,
        frontmatter: lines.slice(1, i),
        body: lines.slice(i + 1),
      }
    }
  }

  return { hasFrontmatter: false, eol }
}

function rebuildFile(parsed) {
  return ["---", ...parsed.frontmatter, "---", ...parsed.body].join(parsed.eol)
}

function findFieldRange(lines, field) {
  const keyRe = new RegExp(`^${field}\\s*:(.*)$`, "i")
  const start = lines.findIndex((line) => keyRe.test(line))
  if (start < 0) return null

  let end = lines.length
  for (let i = start + 1; i < lines.length; i++) {
    if (/^[A-Za-z0-9_-]+\s*:/.test(lines[i])) {
      end = i
      break
    }
  }

  return { start, end }
}

function splitInlineComment(value) {
  let quote = ""

  for (let i = 0; i < value.length; i++) {
    const ch = value[i]
    const prev = value[i - 1]

    if (quote) {
      if (ch === quote && prev !== "\\") quote = ""
      continue
    }

    if (ch === "'" || ch === '"') {
      quote = ch
      continue
    }

    if (ch === "#" && (i === 0 || /\s/.test(prev))) {
      return {
        value: value.slice(0, i),
        comment: value.slice(i),
      }
    }
  }

  return { value, comment: "" }
}

function isPlainYamlSafe(value) {
  if (!value || value.trim() !== value) return false
  if (/^(true|false|null|~|yes|no|on|off)$/i.test(value)) return false
  if (/^-?(?:\d+|\d+\.\d+)$/.test(value)) return false
  if (/^[-?:,[\]{}#&*!|>'"%@`]/.test(value)) return false
  if (/:($|\s)|\s#/.test(value)) return false
  return true
}

function quoteYaml(value) {
  return JSON.stringify(value)
}

function formatYamlValue(value, quote) {
  if (quote === '"') return quoteYaml(value)
  if (quote === "'") return `'${value.replaceAll("'", "''")}'`
  return isPlainYamlSafe(value) ? value : quoteYaml(value)
}

function unquoteYamlValue(value) {
  const trimmed = value.trim()
  const quote = trimmed[0]

  if ((quote === '"' || quote === "'") && trimmed.endsWith(quote)) {
    const inner = trimmed.slice(1, -1)
    if (quote === '"') {
      try {
        return { value: JSON.parse(trimmed), quote }
      } catch {
        return { value: inner, quote }
      }
    }
    return { value: inner.replaceAll("''", "'"), quote }
  }

  return { value: trimmed, quote: "" }
}

function replaceScalar(rawValue, from, to) {
  const leading = rawValue.match(/^\s*/)?.[0] || ""
  const trailing = rawValue.match(/\s*$/)?.[0] || ""
  const middle = rawValue.slice(leading.length, rawValue.length - trailing.length)
  const parsed = unquoteYamlValue(middle)

  if (parsed.value !== from) {
    return { value: rawValue, replacements: 0 }
  }

  return {
    value: `${leading}${formatYamlValue(to, parsed.quote)}${trailing}`,
    replacements: 1,
  }
}

function splitInlineArrayItems(value) {
  const items = []
  let quote = ""
  let start = 0

  for (let i = 0; i < value.length; i++) {
    const ch = value[i]
    const prev = value[i - 1]

    if (quote) {
      if (ch === quote && prev !== "\\") quote = ""
      continue
    }

    if (ch === "'" || ch === '"') {
      quote = ch
      continue
    }

    if (ch === ",") {
      items.push(value.slice(start, i))
      start = i + 1
    }
  }

  items.push(value.slice(start))
  return items
}

function replaceInlineValue(rawValue, from, to) {
  const { value, comment } = splitInlineComment(rawValue)
  const trimmed = value.trim()

  if (!trimmed) {
    return { value: rawValue, replacements: 0 }
  }

  if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
    let replacements = 0
    const beforeBracket = value.slice(0, value.indexOf("[") + 1)
    const afterBracket = value.slice(value.lastIndexOf("]"))
    const inner = value.slice(value.indexOf("[") + 1, value.lastIndexOf("]"))
    const items = splitInlineArrayItems(inner).map((item) => {
      const result = replaceScalar(item, from, to)
      replacements += result.replacements
      return result.value
    })

    return {
      value: `${beforeBracket}${items.join(",")}${afterBracket}${comment}`,
      replacements,
    }
  }

  const result = replaceScalar(value, from, to)
  return {
    value: `${result.value}${comment}`,
    replacements: result.replacements,
  }
}

function replaceListLine(line, from, to) {
  const match = line.match(/^(\s*(?:-\s*)+)(.*)$/)
  if (!match) return { line, replacements: 0 }

  const prefix = match[1]
  const rest = match[2]
  const { value, comment } = splitInlineComment(rest)
  const result = replaceScalar(value, from, to)

  return {
    line: `${prefix}${result.value}${comment}`,
    replacements: result.replacements,
  }
}

function replaceField(frontmatter, field, from, to) {
  const range = findFieldRange(frontmatter, field)
  if (!range) return { lines: frontmatter, replacements: 0 }

  const next = [...frontmatter]
  let replacements = 0
  const fieldMatch = next[range.start].match(/^([A-Za-z0-9_-]+\s*:)(.*)$/)
  const inline = fieldMatch?.[2] ?? ""

  if (inline.trim()) {
    const result = replaceInlineValue(inline, from, to)
    next[range.start] = `${fieldMatch[1]}${result.value}`
    replacements += result.replacements
  }

  for (let i = range.start + 1; i < range.end; i++) {
    const result = replaceListLine(next[i], from, to)
    next[i] = result.line
    replacements += result.replacements
  }

  return { lines: next, replacements }
}

async function replaceInPosts({ field, from, to, dryRun }) {
  const files = (await listMarkdownFiles(POSTS_DIR)).sort((a, b) => a.localeCompare(b))
  const changed = []
  let totalReplacements = 0

  for (const filePath of files) {
    const raw = await fs.readFile(filePath, "utf8")
    const parsed = parseFrontmatter(raw)
    if (!parsed.hasFrontmatter) continue

    const result = replaceField(parsed.frontmatter, field, from, to)
    if (!result.replacements) continue

    totalReplacements += result.replacements
    changed.push({
      filePath,
      replacements: result.replacements,
    })

    if (!dryRun) {
      await fs.writeFile(
        filePath,
        rebuildFile({ ...parsed, frontmatter: result.lines }),
        "utf8",
      )
    }
  }

  return { changed, totalReplacements, fileCount: files.length }
}

async function main() {
  const args = await promptMissingOptions(parseArgs(process.argv.slice(2)))

  if (args.help) {
    usage()
    return
  }

  const field = args.field || normalizeField(args.type)
  if (!field) {
    throw new Error("类型无效，请使用 categories 或 tags。")
  }

  const from = String(args.from ?? "")
  const to = String(args.to ?? "")
  if (!from || !to) {
    throw new Error("原文本和新文本不能为空。")
  }
  if (from === to) {
    throw new Error("原文本和新文本相同，不需要替换。")
  }

  const result = await replaceInPosts({
    field,
    from,
    to,
    dryRun: Boolean(args.dryRun),
  })

  const typeName = field === "categories" ? "分类" : "标签"
  console.log(`已扫描文章数：${result.fileCount}`)
  console.log(`${args.dryRun ? "可替换" : "已替换"}${typeName}：${from} -> ${to}`)
  console.log(`${args.dryRun ? "将影响" : "已更新"}文件数：${result.changed.length}`)
  console.log(`${args.dryRun ? "匹配" : "替换"}条目数：${result.totalReplacements}`)

  for (const item of result.changed) {
    const rel = path.relative(FRONTEND_ROOT, item.filePath).split(path.sep).join("/")
    console.log(`- ${rel} (${item.replacements})`)
  }
}

await main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error))
  process.exitCode = 1
})
