
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
  data: z.array(z.record(z.string())).describe('The data in the dataset.'),
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
Dataset Headers: {{#each headers}}{{{this}}}{{unless @last}}, {{/unless}}{{/each}}

Dataset (first 10 rows, use this sample to infer patterns):
{{#each (slice data 0 10)}}
  Row {{@index}}: {{#each this}}{{@key}}: {{{this}}}{{unless @last}}; {{/unless}}{{/each}}
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
    const {output} = await prompt(input);
    return output!;
  }
);
