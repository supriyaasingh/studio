/**
 * Estimates weight based on age using common pediatric formulas.
 * This serves as a proxy for the WHO Age-to-Weight estimation table.
 * 
 * @param ageInYears - The child's age in years.
 * @returns The estimated weight in kilograms.
 */
export function estimateWeight(ageInYears: number): number {
  if (ageInYears <= 0) {
    return 0;
  }

  // Formula for children from 1 to 6 years old
  if (ageInYears >= 1 && ageInYears <= 6) {
    return (ageInYears * 2) + 8;
  }
  
  // Formula for children from 7 to 12 years old
  if (ageInYears > 6 && ageInYears <= 12) {
    return (ageInYears * 7 - 5) / 2;
  }

  // Simplified logic for infants under 1 year
  if (ageInYears < 1) {
    const ageInMonths = ageInYears * 12;
    if (ageInMonths <= 6) {
      // Approximate birth weight + 0.6 kg per month
      return 3.5 + (ageInMonths * 0.6);
    } else {
      // From 6 months, gain is slower
      return 3.5 + (6 * 0.6) + ((ageInMonths - 6) * 0.5);
    }
  }

  // Default for older children (very rough estimate)
  return ageInYears * 3;
}
