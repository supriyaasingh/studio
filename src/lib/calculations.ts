/**
 * Contains all the dosage calculation formulas.
 */

/**
 * Calculates the dose in milligrams.
 * @param weightKg - Patient's weight in kilograms.
 * @param dosePerKg - Standard dose per kilogram for the drug.
 * @returns The calculated dose in milligrams.
 */
export function calculateDoseMg(weightKg: number, dosePerKg: number): number {
  return weightKg * dosePerKg;
}

/**
 * Calculates the required volume of a syrup.
 * @param doseMg - The required dose in milligrams.
 * @param syrupMg - The amount of drug in milligrams in the syrup.
 * @param syrupMl - The volume in milliliters of the syrup.
 * @returns The calculated volume in milliliters.
 */
export function calculateVolumeMl(doseMg: number, syrupMg: number, syrupMl: number): number {
  if (syrupMg === 0) return 0;
  return doseMg / (syrupMg / syrupMl);
}

/**
 * Calculates the number of tablets required for a dose.
 * @param doseMg - The required dose in milligrams.
 * @param tabletStrengthMg - The strength in milligrams of a single tablet.
 * @returns The number of tablets required.
 */
export function calculateTablets(doseMg: number, tabletStrengthMg: number): number {
  if (tabletStrengthMg === 0) return 0;
  return doseMg / tabletStrengthMg;
}

/**
 * Calculates the maximum daily dose for a patient.
 * @param weightKg - Patient's weight in kilograms.
 * @param maxDailyDosePerKg - Maximum daily dose per kilogram for the drug.
 * @returns The maximum daily dose in milligrams.
 */
export function calculateMaxDailyDose(weightKg: number, maxDailyDosePerKg: number): number {
  return weightKg * maxDailyDosePerKg;
}
