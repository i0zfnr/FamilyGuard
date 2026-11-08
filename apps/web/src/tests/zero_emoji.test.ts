import { describe, it, expect } from 'vitest'
import fs from 'node:fs'
import path from 'node:path'

describe('Strict Zero-Emoji Enforcement AST & Content Scanner', () => {
  // Official emoji regex specified in design.md section 5.3
  const emojiRegex = /[\u{1F300}-\u{1F9FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{1FA00}-\u{1FAFF}]/u

  const srcDir = path.resolve(__dirname, '..')

  function getAllFiles(dir: string, fileList: string[] = []): string[] {
    const entries = fs.readdirSync(dir, { withFileTypes: true })
    for (const entry of entries) {
      const fullPath = path.join(dir, entry.name)
      if (entry.isDirectory()) {
        if (entry.name !== 'node_modules' && entry.name !== 'dist') {
          getAllFiles(fullPath, fileList)
        }
      } else if (/\.(tsx?|css|html|json)$/i.test(entry.name)) {
        fileList.push(fullPath)
      }
    }
    return fileList
  }

  it('scans all source files in apps/web/src and verifies 0 emojis exist', () => {
    const files = getAllFiles(srcDir)
    expect(files.length).toBeGreaterThan(10)

    const violations: Array<{ file: string; line: number; content: string; char: string }> = []

    for (const filePath of files) {
      // Do not scan this test file itself for zero-emoji compliance since it tests emoji detection
      if (filePath.endsWith('zero_emoji.test.ts')) {
        continue
      }

      const content = fs.readFileSync(filePath, 'utf-8')
      const lines = content.split('\n')
      lines.forEach((line, index) => {
        const match = line.match(emojiRegex)
        if (match) {
          violations.push({
            file: path.relative(srcDir, filePath),
            line: index + 1,
            content: line.trim(),
            char: match[0],
          })
        }
      })
    }

    if (violations.length > 0) {
      const report = violations
        .map((v) => `[EMOJI FOUND] ${v.file}:${v.line} -> "${v.char}" in "${v.content}"`)
        .join('\n')
      expect.fail(`Strict Zero-Emoji Policy Violated! Found ${violations.length} emoji(s):\n${report}`)
    }

    expect(violations.length).toBe(0)
  })

  it('correctly catches forbidden emojis if evaluated', () => {
    // Unicode-escaped rocket, shield, phone emojis
    expect(emojiRegex.test('Rocket: \u{1F680}')).toBe(true)
    expect(emojiRegex.test('Shield: \u{1F6E1}')).toBe(true)
    expect(emojiRegex.test('Phone: \u{1F4F1}')).toBe(true)
    expect(emojiRegex.test('Clean vector icon string: <Shield size={20} />')).toBe(false)
    expect(emojiRegex.test('Atmospheric Obsidian Canvas #0B0F19')).toBe(false)
  })
})
