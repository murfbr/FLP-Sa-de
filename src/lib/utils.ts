import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

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
