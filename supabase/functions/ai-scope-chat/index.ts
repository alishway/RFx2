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

    const contentType = detectContentType(message);
    
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

${getContentSpecificPrompt(contentType)}

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

    // Parse structured content from AI response
    let extractedDeliverables: any[] = [];

    if (contentType !== 'general') {
      extractedDeliverables = parseStructuredContentFromResponse(aiResponse, contentType);
    }

    // Analyze for compliance flags
    const complianceFlags = analyzeComplianceFlags(aiResponse, message);

    // Generate suggestions based on the conversation
    const suggestions = generateSuggestions(formData, aiResponse);

    return new Response(JSON.stringify({
      response: aiResponse,
      suggestions: suggestions,
      complianceFlags: complianceFlags,
      extractedDeliverables: extractedDeliverables
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

// Helper function to detect content type
function detectContentType(message: string): string {
  const lowerMessage = message.toLowerCase();
  if (lowerMessage.includes('deliverable') || lowerMessage.includes('outcome') || lowerMessage.includes('produce')) {
    return 'deliverables';
  }
  if (lowerMessage.includes('mandatory') || lowerMessage.includes('required') || lowerMessage.includes('must have')) {
    return 'mandatory';
  }
  if (lowerMessage.includes('rated') || lowerMessage.includes('scoring') || lowerMessage.includes('evaluate')) {
    return 'rated';
  }
  return 'general';
}

// Helper function to get content-specific prompts that encourage structured output
function getContentSpecificPrompt(contentType: string): string {
  switch (contentType) {
    case 'deliverables':
      return `DELIVERABLES REQUEST DETECTED: When providing deliverables suggestions, format your response to include clear deliverable items. For each deliverable, provide:
- A clear, specific name/title
- A detailed description of what will be delivered
- Any relevant timing or dependencies

Structure your suggestions as numbered or bulleted items for easy parsing.`;

    case 'mandatory':
      return `MANDATORY CRITERIA REQUEST DETECTED: When providing mandatory criteria suggestions, format your response to include clear pass/fail requirements. For each criterion, provide:
- A clear, specific requirement name
- A detailed description of what must be met
- Any relevant compliance standards or thresholds

Structure your suggestions as numbered or bulleted items for easy parsing.`;

    case 'rated':
      return `RATED CRITERIA REQUEST DETECTED: When providing rated criteria suggestions, format your response to include clear evaluation criteria. For each criterion, provide:
- A clear, specific criterion name  
- A detailed description of what will be evaluated
- Suggested weight/scoring information where appropriate

Structure your suggestions as numbered or bulleted items for easy parsing.`;

    default:
      return '';
  }
}

// Helper function to parse structured content from AI response
function parseStructuredContentFromResponse(aiResponse: string, contentType: string): any[] {
  const items: any[] = [];
  
  console.log('=== PARSING DEBUG ===');
  console.log('Content type:', contentType);
  console.log('AI Response length:', aiResponse.length);
  console.log('AI Response first 500 chars:', aiResponse.substring(0, 500));
  
  // Look for numbered list items - more flexible pattern
  const numberedItemPattern = /(\d+)\.\s*\*\*(.+?)\*\*([\s\S]*?)(?=\n\d+\.\s*\*\*|$)/g;
  const matches = [...aiResponse.matchAll(numberedItemPattern)];
  
  console.log('Found matches:', matches.length);

  if (matches.length === 0) {
    // Fallback: try simpler numbered pattern
    const fallbackPattern = /(\d+)\.\s*(.+?)(?=\n\d+\.|$)/gms;
    const fallbackMatches = [...aiResponse.matchAll(fallbackPattern)];
    console.log('Fallback matches found:', fallbackMatches.length);
    
    fallbackMatches.forEach((match, index) => {
      const fullText = match[2].trim();
      console.log(`Fallback item ${index + 1}:`, fullText.substring(0, 100));
      
      // Simple extraction for fallback
      const lines = fullText.split('\n').filter(line => line.trim());
      const name = lines[0].replace(/^\*\*(.+?)\*\*/, '$1').trim();
      const description = lines.slice(1).join(' ').trim();
      
      const baseId = contentType === 'deliverables' ? 'del' : 
                    contentType === 'mandatory' ? 'mand' : 'rated';
      
      const item: any = {
        id: `${baseId}_${Date.now()}_${index + 1}`,
        name: name,
        description: description || undefined
      };

      if (contentType === 'rated') {
        item.weight = 10;
        item.scale = "0-100 points";
        item.type = 'rated';
      } else if (contentType === 'mandatory') {
        item.type = 'mandatory';
      }

      items.push(item);
    });
    
    return items;
  }

  // Process main matches
  matches.forEach((match, index) => {
    const itemNumber = match[1];
    const itemTitle = match[2].trim();
    const itemContent = match[3].trim();
    
    console.log(`\n--- Processing item ${itemNumber} ---`);
    console.log('Title:', itemTitle);
    console.log('Content:', itemContent.substring(0, 200));
    
    // Extract all content after the title
    const contentLines = itemContent.split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .map(line => {
        // Clean up bullet points and formatting
        return line
          .replace(/^[-•*]\s*/, '') // Remove bullet markers
          .replace(/^\*\*(.+?)\*\*:\s*/, '$1: ') // Convert **Label**: to Label:
          .replace(/^\*\*(.+?)\*\*\s*/, '$1: '); // Convert **Label** to Label:
      });
    
    const description = contentLines.join(' ').trim();
    
    console.log('Final description:', description.substring(0, 150));

    const baseId = contentType === 'deliverables' ? 'del' : 
                  contentType === 'mandatory' ? 'mand' : 'rated';
    
    const item: any = {
      id: `${baseId}_${Date.now()}_${index + 1}`,
      name: itemTitle,
      description: description || undefined
    };

    // Add content-type specific properties
    if (contentType === 'rated') {
      const weightMatch = itemContent.match(/(\d+)\s*points?|weight.*?(\d+)%?/i);
      item.weight = weightMatch ? parseInt(weightMatch[1] || weightMatch[2]) : 10;
      item.scale = "0-100 points";
      item.type = 'rated';
    } else if (contentType === 'mandatory') {
      item.type = 'mandatory';
    }

    console.log('Final item:', JSON.stringify(item, null, 2));
    items.push(item);
  });

  // If no structured list found, try to extract from paragraph text
  if (items.length === 0 && contentType !== 'general') {
    // Fallback: look for key phrases that might indicate items
    const keyPhrases = contentType === 'deliverables' 
      ? ['report', 'document', 'presentation', 'analysis', 'deliverable']
      : contentType === 'mandatory'
      ? ['must', 'required', 'certification', 'experience', 'qualification']
      : ['approach', 'quality', 'experience', 'performance', 'methodology'];

    const sentences = aiResponse.split(/[.!?]+/);
    let itemCount = 0;

    sentences.forEach((sentence, index) => {
      const lowerSentence = sentence.toLowerCase();
      const hasKeyPhrase = keyPhrases.some(phrase => lowerSentence.includes(phrase));
      
      if (hasKeyPhrase && sentence.trim().length > 20 && itemCount < 5) {
        const baseId = contentType === 'deliverables' ? 'del' : 
                      contentType === 'mandatory' ? 'mand' : 'rated';
        
        const item: any = {
          id: `${baseId}_${Date.now()}_${itemCount + 1}`,
          name: sentence.trim().substring(0, 50) + '...',
          description: sentence.trim()
        };

        if (contentType === 'rated') {
          item.weight = 15;
          item.scale = "0-100 points";
          item.type = 'rated';
        } else if (contentType === 'mandatory') {
          item.type = 'mandatory';
        }

        items.push(item);
        itemCount++;
      }
    });
  }

  return items.slice(0, 8); // Limit to 8 items maximum
}