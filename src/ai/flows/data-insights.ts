
'use server';

/**
 * @fileOverview Uses AI to suggest potential insights or relationships within the dataset.
 *
 * - getDataInsights - A function that generates insights from the provided data.
 * - DataInsightsInput - The input type for the getDataInsights function.
 * - DataInsightsOutput - The return type for the getDataInsights function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DataInsightsInputSchema = z.object({
  headers: z.array(z.string()).describe('The headers of the dataset.'),
  data: z.array(
    z.record(z.union([z.string(), z.number(), z.boolean(), z.null()]))
  ).describe('The data in the dataset, where values can be strings, numbers, booleans, or null.'),
  customInstructions: z.string().optional().describe('Optional custom instructions to guide the AI in generating insights.'),
});
export type DataInsightsInput = z.infer<typeof DataInsightsInputSchema>;

const DataInsightsOutputSchema = z.object({
  insights: z.array(z.string()).describe('A list of insights generated from the data.'),
});
export type DataInsightsOutput = z.infer<typeof DataInsightsOutputSchema>;

export async function getDataInsights(input: DataInsightsInput): Promise<DataInsightsOutput> {
  return dataInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dataInsightsPrompt',
  input: {schema: DataInsightsInputSchema},
  output: {schema: DataInsightsOutputSchema},
  prompt: `You are an AI data analyst.
{{#if customInstructions}}
Follow these specific instructions: {{{customInstructions}}}
{{else}}
Your task is to analyze the given dataset and provide a list of potential insights or relationships within the data.
Focus on actionable insights, correlations, anomalies, or trends that might be interesting.
{{/if}}

Analyze the following dataset:
Dataset Headers: {{#each headers}}{{{this}}}{{#if @last}}{{else}}, {{/if}}{{/each}}

Dataset (sample of rows, use this sample to infer patterns):
{{#each data}}
  Row {{@index}}: {{#each this}}{{@key}}: {{{this}}}{{#if @last}}{{else}}; {{/if}}{{/each}}
{{/each}}

Based on your analysis (and the custom instructions if provided), provide a list of insights.
Each insight should be a concise string.
Insights:`,
});

const dataInsightsFlow = ai.defineFlow(
  {
    name: 'dataInsightsFlow',
    inputSchema: DataInsightsInputSchema,
    outputSchema: DataInsightsOutputSchema,
  },
  async input => {
    // Prepare a version of the input where `data` is explicitly the first 10 rows
    // (or fewer if the input data has less than 10 rows).
    // Note: DataSphereApp.tsx already sends a sample of up to 50 rows.
    // This ensures the prompt itself only processes a small, consistent sample.
    const processedInput = {
      ...input,
      data: input.data.slice(0, 10),
    };
    const {output} = await prompt(processedInput);
    return output!;
  }
);
