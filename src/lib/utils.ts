import type { Endpoints } from "@/types";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { API_URL, EXTENSION_SECRET } from "./consts";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const apiClient = {
  async fetch<T>(endpoint: Endpoints, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_URL}${endpoint}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "x-extension-secret": EXTENSION_SECRET,
        ...options.headers,
      },
    });
    const data = await response.json();
    if (!data.success) throw new Error(data.message);
    return data.data;
  },
};

export function toMilliseconds(input: string): number {
  const timeRegex = /^(\d+)([smhdwy])$/
  const match = input.toLowerCase().match(timeRegex)

  if (!match) throw new Error('Invalid time format')

  const [, value, unit] = match
  const numValue = Number.parseInt(value)

  const conversionFactors: Record<string, number> = {
    ms: 1,
    s: 1000,
    m: 60 * 1000,
    h: 60 * 60 * 1000,
    d: 24 * 60 * 60 * 1000,
    M: 7 * 24 * 60 * 60 * 1000,
    Y: 365 * 24 * 60 * 60 * 1000
  }

  if (!(unit in conversionFactors)) throw new Error('Invalid time format')

  return numValue * conversionFactors[unit]
}