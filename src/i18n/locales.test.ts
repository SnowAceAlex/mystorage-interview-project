import { test } from 'node:test'
import assert from 'node:assert/strict'
import { en } from './locales/en'
import { vi } from './locales/vi'

function leaves(node: object, prefix = ''): Map<string, string> {
  const out = new Map<string, string>()
  for (const [key, value] of Object.entries(node)) {
    const path = prefix ? `${prefix}.${key}` : key
    if (typeof value === 'string') out.set(path, value)
    else for (const [childPath, text] of leaves(value, path)) out.set(childPath, text)
  }
  return out
}

const placeholders = (text: string) => [...text.matchAll(/{{\s*(\w+)\s*}}|<(\w+)>/g)].map((m) => m[1] ?? m[2]).sort()

test('en and vi define the same keys', () => {
  assert.deepEqual([...leaves(vi).keys()].sort(), [...leaves(en).keys()].sort())
})

test('no empty strings, and both locales use the same placeholders and tags', () => {
  const viLeaves = leaves(vi)
  for (const [path, text] of leaves(en)) {
    const translated = viLeaves.get(path) ?? ''
    assert.ok(text.trim() && translated.trim(), `${path} is empty`)
    assert.deepEqual(placeholders(translated), placeholders(text), `${path} placeholders differ`)
  }
})
