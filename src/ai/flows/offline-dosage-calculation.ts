'use server';

/**
 * @fileOverview A flow for offline dosage calculation using a local drug cache.
 *
 * - offlineDosageCalculation - A function that handles the offline dosage calculation process.
 * - OfflineDosageCalculationInput - The input type for the offlineDosageCalculation function.
 * - OfflineDosageCalculationOutput - The return type for the offlineDosageCalculation function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const OfflineDosageCalculationInputSchema = z.object({
  searchTerm: z.string().describe('The drug name, generic name, or condition to search for.'),
  weightKg: z.number().optional().describe('The patient weight in kilograms.'),
  ageYears: z.number().optional().describe('The patient age in years.'),
  form: z.enum(['syrup', 'tablet']).optional().describe('The drug form.'),
  strengthMg: z.number().optional().describe('The strength of the drug in milligrams.'),
  volumeMl: z.number().optional().describe('The volume of the drug in milliliters, if syrup.'),
});
export type OfflineDosageCalculationInput = z.infer<typeof OfflineDosageCalculationInputSchema>;

const OfflineDosageCalculationOutputSchema = z.object({
  name: z.string().describe('The generic name of the drug.'),
  dosePerKg: z.number().optional().describe('The recommended dose per kg in mg.'),
  maxDailyDosePerKg: z.number().optional().describe('The maximum daily dose per kg in mg.'),
  frequency: z.string().optional().describe('The frequency of administration.'),
  form: z.enum(['syrup', 'tablet']).optional().describe('The drug form.'),
  strengthMg: z.number().optional().describe('The strength of the drug in milligrams.'),
  volumeMl: z.number().optional().describe('The volume of the drug in milliliters, if syrup.'),
  calculatedDoseMg: z.number().optional().describe('The calculated dose in mg.'),
  calculatedVolumeMl: z.number().optional().describe('The calculated volume in mL, if syrup.'),
  calculatedTablets: z.number().optional().describe('The number of tablets needed.'),
  category: z.string().optional().describe('The drug category (e.g., Antibiotic, Antipyretic).'),
});
export type OfflineDosageCalculationOutput = z.infer<typeof OfflineDosageCalculationOutputSchema>;

export async function offlineDosageCalculation(
  input: OfflineDosageCalculationInput
): Promise<OfflineDosageCalculationOutput> {
  return offlineDosageCalculationFlow(input);
}

const drugDatabaseTool = ai.defineTool({
  name: 'drugDatabaseLookup',
  description: 'Looks up drug information in a local database. Use this tool when the user is offline or the internet is unreliable.',
  inputSchema: z.object({
    searchTerm: z.string().describe('The drug name, generic name, or condition to search for.'),
  }),
  outputSchema: z.array(z.object({
    name: z.string(),
    aliases: z.array(z.string()).optional(),
    category: z.string().optional(),
    dosePerKg: z.number().optional(),
    maxDailyDosePerKg: z.number().optional(),
    frequency: z.string().optional(),
    forms: z.record(z.object({
      strengthMg: z.number(),
      volumeMl: z.number().optional(),
    })).optional(),
  })),
}, async (input) => {
  // TODO: Implement the actual database lookup here.
  // This is a placeholder. Replace with actual database interaction.
  const searchTerm = input.searchTerm.toLowerCase();
  const mockDatabase = [
    {
      name: 'Paracetamol',
      aliases: ['PCM', 'Dolo', 'Crocin'],
      category: 'Antipyretic',
      dosePerKg: 15,
      maxDailyDosePerKg: 60,
      frequency: 'Every 4–6 hours',
      forms: {
        syrup: { strengthMg: 125, volumeMl: 5 },
        tablet: { strengthMg: 500 },
      },
    },
  ];

  return mockDatabase.filter(drug => {
    if (drug.name.toLowerCase().includes(searchTerm)) {
      return true;
    }
    if (drug.aliases?.some(alias => alias.toLowerCase().includes(searchTerm))) {
      return true;
    }
    return false;
  });
});

const offlineDosageCalculationPrompt = ai.definePrompt({
  name: 'offlineDosageCalculationPrompt',
  tools: [drugDatabaseTool],
  input: {schema: OfflineDosageCalculationInputSchema},
  output: {schema: OfflineDosageCalculationOutputSchema},
  prompt: `You are a pediatric medical assistant assisting a doctor who may be in an area with unreliable internet.

The doctor is trying to calculate the correct dosage for a child. Use the available tools to look up drug information in a local database and calculate the dosage.

First, use the drugDatabaseLookup tool with the search term "{{searchTerm}}" to find the relevant drug information.

Then, using the drug information, weight, age, form, and strength provided by the doctor, calculate the appropriate dosage.

If the weight is not provided but the age is provided, use the WHO age-to-weight estimation table to estimate the weight.

Return the generic name, recommended dose per kg, max daily dose per kg, frequency, form, strength, calculated dose in mg, calculated volume in mL, and calculated number of tablets.

Make sure to include the drug category.

Input from doctor:
Search Term: {{{searchTerm}}}
Weight (kg): {{{weightKg}}}
Age (years): {{{ageYears}}}
Form: {{{form}}}
Strength (mg): {{{strengthMg}}}
Volume (ml): {{{volumeMl}}}



`, 
});

const offlineDosageCalculationFlow = ai.defineFlow(
  {
    name: 'offlineDosageCalculationFlow',
    inputSchema: OfflineDosageCalculationInputSchema,
    outputSchema: OfflineDosageCalculationOutputSchema,
  },
  async input => {
    const {output} = await offlineDosageCalculationPrompt(input);
    return output!;
  }
);
