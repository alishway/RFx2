import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, formData, conversationHistory } = await req.json();

    if (!openAIApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    const systemPrompt = `You are an AI assistant specialized in Canadian public sector procurement. Your role is to help users develop comprehensive and compliant RFx (Request for Proposals/Quotes) documents.

CORE RESPONSIBILITIES:
1. Guide users through procurement scope development
2. Ensure compliance with Canadian procurement regulations (CFTA, CETA, CPTPP, etc.)
3. Help identify potential restrictive language or practices
4. Suggest appropriate evaluation criteria and methodologies
5. Provide guidance on budget and timeline considerations

COMPLIANCE FOCUS:
- Flag potentially restrictive requirements that may favor specific vendors
- Ensure openness, fairness, and transparency in procurement practices
- Identify trade agreement thresholds and obligations
- Suggest appropriate posting periods and evaluation methodologies

CURRENT FORM DATA CONTEXT:
Background: ${formData.background || 'Not provided'}
Commodity Type: ${formData.commodityType || 'Not specified'}
Deliverables: ${formData.deliverables.length} items defined
Requirements: ${formData.requirements.mandatory.length} mandatory, ${formData.requirements.rated.length} rated criteria
Budget Tolerance: ${formData.budgetTolerance || 'Not set'}

Respond in a helpful, professional manner. If you identify compliance concerns, clearly explain them and suggest alternatives. Keep responses concise but comprehensive.`;

    const messages = [
      { role: 'system', content: systemPrompt },
      ...conversationHistory.slice(-10), // Last 10 messages for context
      { role: 'user', content: message }
    ];

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: messages,
        max_tokens: 800,
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.error?.message || 'OpenAI API error');
    }

    const aiResponse = data.choices[0].message.content;

    // Analyze for compliance flags
    const complianceFlags = analyzeComplianceFlags(aiResponse, message);

    // Generate suggestions based on the conversation
    const suggestions = generateSuggestions(formData, aiResponse);

    return new Response(JSON.stringify({
      response: aiResponse,
      suggestions: suggestions,
      complianceFlags: complianceFlags
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error in ai-scope-chat function:', error);
    return new Response(JSON.stringify({ 
      error: error.message || 'Internal server error' 
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

function analyzeComplianceFlags(aiResponse: string, userMessage: string): string[] {
  const flags: string[] = [];
  const combinedText = `${userMessage} ${aiResponse}`.toLowerCase();

  // Common restrictive language patterns
  const restrictivePatterns = [
    { pattern: /must have (\d+)\+ years/, flag: 'Excessive experience requirements detected' },
    { pattern: /only.*certified by/, flag: 'Potentially restrictive certification requirement' },
    { pattern: /proprietary|brand name|specific product/, flag: 'Possible brand name specification' },
    { pattern: /pre-qualified|preferred vendor/, flag: 'Potential vendor restriction' },
    { pattern: /local.*only|regional.*only/, flag: 'Geographic restriction may violate trade agreements' }
  ];

  restrictivePatterns.forEach(({ pattern, flag }) => {
    if (pattern.test(combinedText)) {
      flags.push(flag);
    }
  });

  return flags;
}

function generateSuggestions(formData: any, aiResponse: string): string[] {
  const suggestions: string[] = [];

  if (!formData.background) {
    suggestions.push("Provide more project background details");
  }

  if (!formData.commodityType) {
    suggestions.push("Specify the commodity or service type");
  }

  if (formData.deliverables.length === 0) {
    suggestions.push("Define specific deliverables");
  }

  if (formData.requirements.mandatory.length === 0) {
    suggestions.push("Add mandatory evaluation criteria");
  }

  if (aiResponse.includes('budget') || aiResponse.includes('cost')) {
    suggestions.push("Discuss budget considerations");
  }

  if (aiResponse.includes('timeline') || aiResponse.includes('schedule')) {
    suggestions.push("Define project timeline");
  }

  return suggestions;
}