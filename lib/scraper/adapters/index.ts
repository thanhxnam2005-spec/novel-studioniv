import type { SiteAdapter } from "../types";
import { MeTruyenChuAdapter } from "./MeTruyenChu";
import { SSTruyenAdapter } from "./SSTruyen";
import { STVAdapter } from "./STV";
import { TruyenFullAdapter } from "./TruyenFull";
import { UukanshuAdapter } from "./Uukanshu";

const adapters: SiteAdapter[] = [
  STVAdapter,
  UukanshuAdapter,
  TruyenFullAdapter,
  MeTruyenChuAdapter,
  SSTruyenAdapter,
];

/** Find the adapter that matches the given URL, or null. */
export function detectAdapter(url: string): SiteAdapter | null {
  return adapters.find((a) => a.urlPattern.test(url)) ?? null;
}

/** Get all registered adapters (for UI display). */
export function getAdapters(): SiteAdapter[] {
  return adapters;
}

export { MeTruyenChuAdapter, SSTruyenAdapter, STVAdapter, TruyenFullAdapter, UukanshuAdapter };
