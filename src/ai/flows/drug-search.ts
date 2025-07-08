'use server';

/**
 * @fileOverview An AI agent for searching drug information and dosages.
 *
 * - drugSearch - A function that handles the drug search process.
 * - DrugSearchInput - The input type for the drugSearch function.
 * - DrugSearchOutput - The return type for the drugSearch function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DrugSearchInputSchema = z.object({
  query: z.string().describe('The drug name or condition to search for.'),
  weightKg: z.number().optional().describe('The weight of the child in kilograms.'),
  ageYears: z.number().optional().describe('The age of the child in years.'),
});
export type DrugSearchInput = z.infer<typeof DrugSearchInputSchema>;

const DrugSearchOutputSchema = z.object({
  name: z.string().describe('The correct generic name of the drug.'),
  dosePerKg: z.number().describe('The standard total daily dose per kg of the drug in mg/kg/day.'),
  maxDailyDosePerKg: z.number().optional().describe('The maximum daily dose per kg of the drug.'),
  frequency: z.string().optional().describe('The frequency of administration, e.g., "Every 12 hours".'),
  category: z.string().optional().describe('The category of the drug (e.g., Antibiotic, Antipyretic).'),
  form: z.string().optional().describe('Common forms for the drug (e.g., syrup, tablet).'),
  strength: z.string().optional().describe('The strength of the available preparation')
});
export type DrugSearchOutput = z.infer<typeof DrugSearchOutputSchema>;

export async function drugSearch(input: DrugSearchInput): Promise<DrugSearchOutput> {
  return drugSearchFlow(input);
}

const drugSearchPrompt = ai.definePrompt({
  name: 'drugSearchPrompt',
  input: {schema: DrugSearchInputSchema},
  output: {schema: DrugSearchOutputSchema},
  prompt: `You are a pediatric medical assistant. Based on the provided query, return the drug information in JSON format.

Consider the weight and age of the child when determining the appropriate dosage.

Query: {{{query}}}

Weight (kg): {{weightKg}}
Age (years): {{ageYears}}

Output the information in JSON format, including:
1. Correct generic name (name)
2. Standard total daily dose per kg (dosePerKg) in mg/kg/day - this is required.
3. Max daily dose per kg (maxDailyDosePerKg) - if applicable
4. Frequency of administration (frequency), e.g., "Every 12 hours" or "Twice a day".
5. Drug type (category)
6. Common forms for the drug (form) - e.g., syrup, tablet
7. The strength of the available preparation (strength), e.g., "125mg/5mL" or "400mg"

If a field is not applicable or unknown, omit it from the JSON output, except for dosePerKg which is mandatory.
`,
});

const drugSearchFlow = ai.defineFlow(
  {
    name: 'drugSearchFlow',
    inputSchema: DrugSearchInputSchema,
    outputSchema: DrugSearchOutputSchema,
  },
  async input => {
    const {output} = await drugSearchPrompt(input);
    return output!;
  }
);
