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
 * Calculates the number of tablets from weight, dose/kg and tablet strength.
 * tablets = (weight × dosePerKg) ÷ tabletStrengthMg
 * @param weightKg - Patient's weight in kilograms.
 * @param dosePerKg - Standard dose per kilogram for the drug.
 * @param tabletStrengthMg - The strength in milligrams of a single tablet.
 * @returns The number of tablets required.
 */
export function calculateTabletsFromWeight(weightKg: number, dosePerKg: number, tabletStrengthMg: number): number {
  if (tabletStrengthMg === 0) return 0;
  return (weightKg * dosePerKg) / tabletStrengthMg;
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

/**
 * Parses the frequency string to determine the number of doses per day.
 * @param frequency - The administration frequency string (e.g., "Every 12 hours").
 * @returns The number of doses per day.
 */
export function getDosesPerDay(frequency?: string): number {
  if (!frequency) return 1;
  const freq = frequency.toLowerCase();

  if (freq.includes("once a day") || freq.includes("every 24 hours")) return 1;
  if (freq.includes("twice a day") || freq.includes("every 12 hours")) return 2;
  if (freq.includes("three times a day") || freq.includes("every 8 hours")) return 3;
  if (freq.includes("four times a day") || freq.includes("every 6 hours")) return 4;
  
  const match = freq.match(/(\d+)/);
  if (match) {
    const hours = parseInt(match[0], 10);
    if (hours > 0 && 24 % hours === 0) {
      return 24 / hours;
    }
  }

  // Default to 1 if frequency is unparsable (e.g., "as needed")
  return 1;
}
