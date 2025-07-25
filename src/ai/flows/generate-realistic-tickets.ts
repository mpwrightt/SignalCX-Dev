'use server';

/**
 * @fileOverview AI flow to generate realistic tickets with all Zendesk API fields
 * This replaces mock data generation with AI-powered realistic ticket creation
 * that gets stored in Firebase using the enterprise schema.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const GenerateTicketsInputSchema = z.object({
  count: z.number().min(1).max(50).describe('Number of tickets to generate (1-50)'),
  organizationId: z.string().describe('Organization ID for the tickets'),
  scenario: z.string().optional().describe('Optional scenario context (e.g., "e-commerce support", "SaaS platform", "financial services")'),
  complexity: z.enum(['simple', 'moderate', 'complex']).optional().default('moderate').describe('Complexity level of generated tickets'),
  includeConversations: z.boolean().optional().default(true).describe('Whether to include conversation threads'),
});

const GeneratedTicketSchema = z.object({
  id: z.number(),
  subject: z.string(),
  description: z.string(),
  requester_id: z.number(),
  assignee_id: z.number().optional(),
  status: z.enum(['new', 'open', 'pending', 'hold', 'solved', 'closed']),
  priority: z.enum(['urgent', 'high', 'normal', 'low']).nullable(),
  tags: z.array(z.string()),
  created_at: z.string(),
  updated_at: z.string(),
  requester: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
    role: z.enum(['end-user', 'agent', 'admin']),
    active: z.boolean()
  }),
  assignee: z.object({
    id: z.number(),
    name: z.string(),
    email: z.string(),
    role: z.enum(['agent', 'admin']),
    active: z.boolean()
  }).optional(),
  comments: z.array(z.object({
    id: z.number(),
    author_id: z.number(),
    body: z.string(),
    public: z.boolean(),
    created_at: z.string(),
    via: z.object({
      channel: z.enum(['web', 'email', 'chat', 'phone', 'api'])
    })
  })),
  metric_set: z.object({
    ticket_id: z.number(),
    first_response_time_in_minutes: z.object({
      calendar: z.number(),
      business: z.number()
    }).nullable(),
    full_resolution_time_in_minutes: z.object({
      calendar: z.number(),
      business: z.number()
    }).nullable(),
    latest_sla_breach_at: z.string().nullable()
  }).nullable()
});

const GenerateTicketsOutputSchema = z.object({
  tickets: z.array(GeneratedTicketSchema),
  summary: z.object({
    total_generated: z.number(),
    scenarios_covered: z.array(z.string()),
    status_distribution: z.record(z.number())
  })
});

export type GenerateTicketsInput = z.infer<typeof GenerateTicketsInputSchema>;
export type GeneratedTicket = z.infer<typeof GeneratedTicketSchema>;
export type GenerateTicketsOutput = z.infer<typeof GenerateTicketsOutputSchema>;

const prompt = ai.definePrompt({
  name: 'generateRealisticTicketsPrompt',
  input: { schema: GenerateTicketsInputSchema },
  output: { schema: GenerateTicketsOutputSchema },
  prompt: `You are an expert at generating realistic customer support tickets that match real-world scenarios.

Generate {{count}} realistic support tickets with complete Zendesk API data structure.

Context:
- Organization scenario: {{scenario}}
- Complexity level: {{complexity}}
- Include conversations: {{includeConversations}}

Requirements:
1. **Realistic Content**: Create genuine customer issues with appropriate urgency
2. **Complete Zendesk Structure**: Include all fields from the Zendesk API
3. **Consistent IDs**: Use realistic ID numbering (start tickets from 50001)
4. **Varied Scenarios**: Cover different support categories:
   - Technical issues (bugs, errors, performance)
   - Account problems (login, billing, permissions)
   - Feature requests and questions
   - Integration and API issues
   - Product feedback and complaints
5. **Realistic Timelines**: Use logical timestamp sequencing
6. **Diverse Users**: Create varied requester profiles
7. **Proper Conversations**: Create realistic exchanges if includeConversations is true
8. **SLA Compliance**: Mix compliant and breached tickets
9. **Mixed Outcomes**: Include tickets in various states

Make tickets feel authentic with real-world technical terminology and appropriate detail levels.`,
});

const generateRealisticTicketsFlow = ai.defineFlow(
  {
    name: 'generateRealisticTicketsFlow',
    inputSchema: GenerateTicketsInputSchema,
    outputSchema: GenerateTicketsOutputSchema,
  },
  async (input) => {
    console.log(`[generateRealisticTicketsFlow] Generating ${input.count} tickets for org ${input.organizationId}`);
    
    const { output } = await prompt(input);
    console.log(`[generateRealisticTicketsFlow] Generated ${output!.tickets.length} tickets`);
    
    return output!;
  }
);

export async function generateRealisticTickets(input: GenerateTicketsInput): Promise<GenerateTicketsOutput> {
  console.log('[AI Flow] generateRealisticTickets called with input:', input);
  try {
    const result = await generateRealisticTicketsFlow(input);
    console.log('[AI Flow] generateRealisticTickets completed successfully:', {
      ticketCount: result.tickets?.length,
      summary: result.summary
    });
    return result;
  } catch (error) {
    console.error('[AI Flow] generateRealisticTickets failed:', error);
    throw error;
  }
}

export { generateRealisticTicketsFlow }; 