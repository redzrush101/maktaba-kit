import type { TocItem } from "./models";

export type AnyObj = Record<string, unknown>;

export function asObj(value: unknown): AnyObj | undefined {
  return value && typeof value === "object" && !Array.isArray(value) ? value as AnyObj : undefined;
}

export function asArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function arrayOfObjects(value: unknown): AnyObj[] {
  return asArray(value).flatMap((item) => asObj(item) ? [asObj(item)] as AnyObj[] : []);
}

export function asString(value: unknown): string | undefined {
  if (typeof value === "string") return value;
  if (typeof value === "number") return String(value);
  return undefined;
}

export function asNumber(value: unknown): number | undefined {
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

export function cleanWhitespace(value: string, join = " ") {
  return (value || "").split(/\s+/).filter(Boolean).join(join);
}

export type TocSectionGroup = { section: TocItem; chapters: TocItem[] };

export function groupTocSections(items: TocItem[]): TocSectionGroup[] {
  const groups: TocSectionGroup[] = [];
  let currentGroup: TocSectionGroup | undefined;
  for (const item of items) {
    if (item.level === 0) {
      currentGroup = { section: item, chapters: [] };
      groups.push(currentGroup);
    } else if (currentGroup) {
      currentGroup.chapters.push(item);
    }
  }
  return groups;
}

export function splitArabicEnglish(text: string, english?: string | null): { arabic: string; english?: string } {
  const existingEnglish = english?.trim();
  if (existingEnglish) return { arabic: text, english: existingEnglish };
  if (!/[A-Za-z]/.test(text)) return { arabic: text, english: undefined };

  const newlineSplit = text.search(/\n+(?=[A-Za-z0-9])/);
  if (newlineSplit > 0) {
    const arabic = text.slice(0, newlineSplit).trim();
    const latin = text.slice(newlineSplit).trim();
    if (arabic && /[A-Za-z]/.test(latin)) return { arabic, english: latin };
  }

  const latinStart = text.search(/[A-Za-z]/);
  if (latinStart > 0 && /[\u0600-\u06FF]/.test(text.slice(0, latinStart))) {
    return { arabic: text.slice(0, latinStart).trim(), english: text.slice(latinStart).trim() };
  }

  return { arabic: text.trim(), english: undefined };
}
