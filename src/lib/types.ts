import type { DrugSearchOutput } from "@/ai/flows/drug-search";
import type { OfflineDosageCalculationOutput } from "@/ai/flows/offline-dosage-calculation";

// A union type to handle results from both online and offline searches.
// We use `name` instead of `genericName` to align with drugSearch output.
export type DrugInfo = (DrugSearchOutput | Omit<OfflineDosageCalculationOutput, 'genericName'> & { name: string });

export type CalculationResult = {
  doseMg: number; // Single dose in mg
  doseMl?: number;
  doseTablets?: number;
  totalDailyDose: number;
  maxDailyDose?: number;
  warning?: string;
  dosesPerDay: number;
};
