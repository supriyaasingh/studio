// src/ai/flows/auto-categorize-drug.ts
'use server';

/**
 * @fileOverview Automatically categorizes drugs into predefined types.
 *
 * - autoCategorizeDrug - A function that categorizes a given drug.
 * - AutoCategorizeDrugInput - The input type for the autoCategorizeDrug function.
 * - AutoCategorizeDrugOutput - The return type for the autoCategorizeDrug function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AutoCategorizeDrugInputSchema = z.object({
  drugName: z.string().describe('The name of the drug to categorize.'),
});
export type AutoCategorizeDrugInput = z.infer<typeof AutoCategorizeDrugInputSchema>;

const AutoCategorizeDrugOutputSchema = z.object({
  category: z
    .string()
    .describe(
      'The category of the drug, such as Antibiotic, Antipyretic, Respiratory, or GI.'
    ),
});
export type AutoCategorizeDrugOutput = z.infer<typeof AutoCategorizeDrugOutputSchema>;

export async function autoCategorizeDrug(
  input: AutoCategorizeDrugInput
): Promise<AutoCategorizeDrugOutput> {
  return autoCategorizeDrugFlow(input);
}

const prompt = ai.definePrompt({
  name: 'autoCategorizeDrugPrompt',
  input: {schema: AutoCategorizeDrugInputSchema},
  output: {schema: AutoCategorizeDrugOutputSchema},
  prompt: `You are a medical expert tasked with categorizing drugs.

  Given the drug name, determine its category. The possible categories are: Antibiotic, Antipyretic, Respiratory, GI.

  Drug Name: {{{drugName}}}
  Category:`, // Instruct LLM to only output the category. Supplying examples might cause it to generate the category and explanation.
});

const autoCategorizeDrugFlow = ai.defineFlow(
  {
    name: 'autoCategorizeDrugFlow',
    inputSchema: AutoCategorizeDrugInputSchema,
    outputSchema: AutoCategorizeDrugOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
