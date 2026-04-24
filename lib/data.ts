import rawData from "@/data/fl-ga-counties-placeholder.json";
import type { CountyRecord } from "@/lib/types";

export const counties = rawData as CountyRecord[];

export const years = [...new Set(counties.map((c) => c.year))].sort((a, b) => b - a);

export const featuredCounties = new Set([
  "Seminole County",
  "Orange County",
  "Lake County",
  "Osceola County",
  "Polk County",
  "Fulton County",
  "Gwinnett County",
  "Cobb County",
  "Forsyth County",
  "Cherokee County"
]);
