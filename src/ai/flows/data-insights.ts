
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
  narrativeSummary: z.string().describe('A comprehensive overview of the dataset, similar to an executive summary. This should be a well-formatted paragraph or multiple paragraphs.'),
  keyFindings: z.array(z.string()).describe('A list of 3-5 key trends, insights, or important points, suitable for a bulleted or numbered list. Each finding should be concise.'),
  rootCauseAnalysis: z.string().describe('A brief summary discussing potential root causes or contributing factors for the key findings or observed patterns. This should be a concise paragraph.'),
  suggestedSolutions: z.array(z.string()).describe('A list of 2-3 general suggestions, next steps for investigation, or potential solutions based on the analysis. Each suggestion should be concise.'),
});
export type DataInsightsOutput = z.infer<typeof DataInsightsOutputSchema>;


export async function getDataInsights(input: DataInsightsInput): Promise<DataInsightsOutput> {
  return dataInsightsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'dataInsightsPrompt',
  input: {schema: DataInsightsInputSchema},
  output: {schema: DataInsightsOutputSchema},
  prompt: `You are an expert AI data analyst. Your task is to provide a clear and concise summary of the given dataset.

{{#if customInstructions}}
Please follow these specific instructions: {{{customInstructions}}}
{{/if}}

Analyze the following dataset:
Dataset Headers: {{#each headers}}{{{this}}}{{#if @last}}{{else}}, {{/if}}{{/each}}

Dataset (sample of rows, use this sample to infer patterns for the summary):
{{#each data}}
  Row {{@index}}: {{#each this}}{{@key}}: {{{this}}}{{#if @last}}{{else}}; {{/if}}{{/each}}
{{/each}}

Based on your analysis (and the custom instructions if provided), provide the following:
1.  **narrativeSummary**: A comprehensive overview of the dataset. Describe what the data is about, its scope (e.g., date ranges if identifiable, primary entities involved), and any immediate high-level observations. This should be a well-formatted paragraph or multiple paragraphs.
2.  **keyFindings**: A list of 3 to 5 distinct key trends, important insights, anomalies, or significant relationships you've identified within the data. Each finding should be a concise string, suitable for a bullet point. For example: "Sales have increased by 20% in the last quarter." or "Column 'Status' shows 'Pending' for 75% of entries."
3.  **rootCauseAnalysis**: A brief summary (1-2 paragraphs) discussing potential root causes or contributing factors for the most significant key findings or observed patterns. Frame this as hypotheses or areas for further investigation. For example: "The observed increase in sales might be due to a recent marketing campaign or seasonal demand. Further analysis of campaign data and historical trends is recommended."
4.  **suggestedSolutions**: A list of 2 to 3 general suggestions, next steps for investigation, or potential solutions based on the overall analysis and key findings. Each suggestion should be a concise string. For example: "Investigate the correlation between marketing spend and sales figures." or "Implement data quality checks for the 'Status' column."

Ensure your output strictly adheres to the JSON schema provided for narrativeSummary (a single string), keyFindings (an array of strings), rootCauseAnalysis (a single string), and suggestedSolutions (an array of strings).
Example for keyFindings: ["Finding 1 text.", "Finding 2 text.", "Finding 3 text."]
Example for suggestedSolutions: ["Suggestion 1 text.", "Suggestion 2 text."]
`,
  config: {
    safetySettings: [
      {
        category: 'HARM_CATEGORY_HATE_SPEECH',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_HARASSMENT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
      {
        category: 'HARM_CATEGORY_SEXUALLY_EXPLICIT',
        threshold: 'BLOCK_MEDIUM_AND_ABOVE',
      },
    ],
  },
});

const dataInsightsFlow = ai.defineFlow(
  {
    name: 'dataInsightsFlow',
    inputSchema: DataInsightsInputSchema,
    outputSchema: DataInsightsOutputSchema,
  },
  async input => {
    // The input.data is already sampled to 50 rows by DataSphereApp.tsx
    // If you want to send a smaller sample to the AI prompt, you can slice it here.
    // For example, to send only the first 10 rows of the (up to) 50:
    const processedInput = {
      ...input,
      data: input.data.slice(0, 10), // Use a sample of 10 rows for the prompt
    };
    const {output} = await prompt(processedInput);
    return output!;
  }
);
