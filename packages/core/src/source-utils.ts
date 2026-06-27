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
