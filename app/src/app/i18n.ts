import { DICT } from './i18n-en';
import { RULES } from './i18n-rules';

/**
 * Automatyczne tłumaczenie interfejsu.
 * Prototyp renderuje teksty po polsku; ta warstwa podmienia je w drzewie DOM na angielskie:
 *  - dokładne dopasowanie ze słownika (teksty, placeholdery, podpowiedzi, etykiety dostępności, tytuł strony),
 *  - reguły dla fraz z liczbami i datami („za 3 dni”, „4 szczenięta”, „Finanse w październiku”),
 *  - dzielenie fraz złożonych na segmenty (" · ", ": ", ", ") i tłumaczenie każdego z nich.
 * Dane użytkownika (imiona psów, notatki) nie są w słowniku, więc zostają bez zmian.
 * W wersji produkcyjnej teksty trafią do plików językowych; ta warstwa pozwala pokazać pełny angielski interfejs już teraz.
 */
export type Lang = 'pl' | 'en';
const ATTRS = ['placeholder', 'title', 'aria-label', 'alt'];
const originals = new WeakMap<Node, string>();
const ours = new WeakMap<Node, string>();
const attrOrig = new WeakMap<Element, Record<string, string>>();
const attrOurs = new WeakMap<Element, Record<string, string>>();
let active = false;
let observer: MutationObserver | null = null;
let scheduled = false;
const miss = new Set<string>();

function lookup(t: string): string | null {
  if (!t || /^[\d\s.,:%+\-–—()/×·#€$zł]*$/.test(t)) return null; // same liczby, znaki, waluty
  const d = DICT[t];
  if (d !== undefined) return d;
  for (const [re, fn] of RULES) { const m = t.match(re); if (m) { const r = fn(m, T); if (r) return r; } }
  return null;
}

/** Tłumaczenie fragmentu albo ten sam tekst, gdy brak tłumaczenia (dla reguł). */
const T = (s: string): string => translateString(s) ?? s;
/** Poziomy dzielenia fraz złożonych – od najgrubszego (wiersze) do najdrobniejszego. */
const LEVELS: RegExp[] = [/(\n)/, /( · | \| )/, /( – | — )/, /(: )/, /(, )/, /( \/ )/];
const EDGE = /^((?:[·–—]\s)?)(.*?)((?:\s[·–—])?)$/s;

function tr(raw: string, level: number): string | null {
  const lead = raw.match(/^\s*/)![0], trail = raw.match(/\s*$/)![0];
  const t = raw.trim();
  if (!t) return null;
  const direct = lookup(t);
  if (direct !== null) return lead + direct + trail;
  // separatory na brzegach („· Plan:”, „21. dzień ciąży ·”) zostają, tłumaczymy środek
  const edge = t.match(EDGE);
  if (edge && (edge[1] || edge[3]) && edge[2]) { const inner = tr(edge[2], level); return inner === null ? null : lead + edge[1] + inner + edge[3] + trail; }
  for (let l = level; l < LEVELS.length; l++) {
    const parts = t.split(LEVELS[l]);
    if (parts.length === 1) continue;
    let changed = false;
    const out = parts.map((p, i) => { if (i % 2) return p; const r = tr(p, l + 1); if (r !== null) { changed = true; return r; } return p; });
    return changed ? lead + out.join('') + trail : null;
  }
  if (/[a-ząćęłńóśźż]{3,}/i.test(t) && miss.size < 400) miss.add(t);
  return null;
}

export function translateString(s: string): string | null {
  const r = tr(s, 0);
  return r === s ? null : r;
}

function applyText(n: Text) {
  const cur = n.nodeValue ?? '';
  if (ours.get(n) === cur) return;
  originals.set(n, cur);
  const tr = translateString(cur);
  if (tr !== null && tr !== cur) { ours.set(n, tr); n.nodeValue = tr; }
}
function applyAttrs(el: Element) {
  for (const a of ATTRS) {
    const cur = el.getAttribute(a); if (cur === null) continue;
    const o = attrOurs.get(el) ?? {}; if (o[a] === cur) continue;
    const orig = attrOrig.get(el) ?? {}; orig[a] = cur; attrOrig.set(el, orig);
    const tr = translateString(cur);
    if (tr !== null && tr !== cur) { o[a] = tr; attrOurs.set(el, o); el.setAttribute(a, tr); }
  }
}
function walk(root: Node) {
  if (root.nodeType === Node.TEXT_NODE) { const p = (root as Text).parentElement; if (p && !['SCRIPT', 'STYLE'].includes(p.tagName)) applyText(root as Text); return; }
  if (root.nodeType !== Node.ELEMENT_NODE && root.nodeType !== Node.DOCUMENT_NODE) return;
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  if (root.nodeType === Node.ELEMENT_NODE) applyAttrs(root as Element);
  let n: Node | null;
  while ((n = w.nextNode())) {
    if (n.nodeType === Node.ELEMENT_NODE) { applyAttrs(n as Element); continue; }
    const p = (n as Text).parentElement;
    if (p && !['SCRIPT', 'STYLE', 'TEXTAREA'].includes(p.tagName)) applyText(n as Text);
  }
}
function restore(root: Node) {
  const w = document.createTreeWalker(root, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
  let n: Node | null = root;
  do {
    if (n.nodeType === Node.ELEMENT_NODE) { const o = attrOrig.get(n as Element); if (o) { for (const a of Object.keys(o)) if (attrOurs.get(n as Element)?.[a] === (n as Element).getAttribute(a)) (n as Element).setAttribute(a, o[a]); attrOurs.delete(n as Element); } }
    else if (n.nodeType === Node.TEXT_NODE && ours.get(n) === n.nodeValue) { n.nodeValue = originals.get(n) ?? n.nodeValue; ours.delete(n); }
  } while ((n = w.nextNode()));
}
function schedule() {
  if (scheduled || !active) return;
  scheduled = true;
  queueMicrotask(() => { scheduled = false; if (active) { walk(document.body); translateTitle(); } });
}
function translateTitle() { const tr = translateString(document.title); if (tr && tr !== document.title) document.title = tr; }

export function setLanguage(lang: Lang) {
  const on = lang === 'en';
  document.documentElement.lang = lang;
  if (on === active) { if (on) schedule(); return; }
  active = on;
  if (on) {
    walk(document.body); translateTitle();
    observer = new MutationObserver(() => schedule());
    observer.observe(document.body, { childList: true, subtree: true, characterData: true, attributes: true, attributeFilter: ATTRS });
  } else {
    observer?.disconnect(); observer = null;
    restore(document.body);
    document.title = 'Dogpilot – hodowla i opieka nad psem';
  }
}
/** Teksty, dla których nie znaleziono tłumaczenia (do uzupełniania słownika). */
export function untranslated(): string[] { return [...miss]; }
if (typeof window !== 'undefined') { const w = window as unknown as { __dogpilotUntranslated?: () => string[]; __dogpilotTranslate?: (s: string) => string | null }; w.__dogpilotUntranslated = untranslated; w.__dogpilotTranslate = translateString; }
