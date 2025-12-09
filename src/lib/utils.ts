import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

/**
 * Merges multiple class names into a single string
 * @param inputs - Array of class names
 * @returns Merged class names
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCPF(value: string | undefined | null): string {
  if (!value) return ''
  const digits = value.replace(/\D/g, '')
  return digits
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})/, '$1-$2')
    .replace(/(-\d{2})\d+?$/, '$1')
}

export function cleanCPF(value: string): string {
  return value.replace(/\D/g, '')
}

export function validateCPF(cpf: string): boolean {
  const clean = cleanCPF(cpf)
  if (clean.length !== 11) return false
  // Check if all digits are the same
  if (/^(\d)\1+$/.test(clean)) return false

  // Simple length check is usually enough for basic validation in this context,
  // but full algorithm could be implemented if stricter validation is needed.
  return true
}

/**
 * Formats a date using the Brazil Timezone (America/Sao_Paulo).
 * Forces the display to match Brazil time regardless of the browser's timezone.
 *
 * @param date - Date object or ISO string
 * @param formatStr - date-fns format string (e.g. 'HH:mm', 'dd/MM/yyyy')
 */
export function formatInTimeZone(
  date: Date | string,
  formatStr: string,
): string {
  const d = typeof date === 'string' ? new Date(date) : date

  // Brazil Standard Time (GMT-3) offset is 180 minutes behind UTC.
  const targetOffset = 180

  // Get local browser offset (positive if behind UTC)
  const localOffset = new Date().getTimezoneOffset()

  // Calculate the difference in minutes
  // Example: NY (300) -> BR (180). Diff = 120. Shift forward 2 hours.
  // 13:00 NY (is 18:00 UTC) -> 15:00 NY (is 20:00 UTC).
  // Wait, if it is 18:00 UTC. Brazil is 15:00.
  // NY is 13:00.
  // We want to display 15:00.
  // So we need to shift the date so that local time becomes 15:00.
  // Shift = 15:00 - 13:00 = +2h = 120min.
  // Formula: localOffset - targetOffset = 300 - 180 = 120. Correct.
  const offsetDiff = localOffset - targetOffset

  // Create a shifted date
  const shiftedDate = new Date(d.getTime() + offsetDiff * 60 * 1000)

  return format(shiftedDate, formatStr, { locale: ptBR })
}
