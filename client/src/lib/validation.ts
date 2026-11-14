export function cleanText(value: string, maxLength: number) {
  return value.trim().replace(/[<>]/g, "").slice(0, maxLength);
}

export function validEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}
