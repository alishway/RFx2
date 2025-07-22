import type { SuggestionExtractionResult } from "@/types/aiSuggestions";

export class SuggestionExtractionService {
  /**
   * Extract structured suggestions from AI chat messages
   */
  static extractSuggestions(content: string): SuggestionExtractionResult[] {
    const results: SuggestionExtractionResult[] = [];
    
    // Extract deliverables
    const deliverables = this.extractDeliverables(content);
    if (deliverables.items.length > 0) {
      results.push(deliverables);
    }

    // Extract criteria
    const mandatoryCriteria = this.extractMandatoryCriteria(content);
    if (mandatoryCriteria.items.length > 0) {
      results.push(mandatoryCriteria);
    }

    const ratedCriteria = this.extractRatedCriteria(content);
    if (ratedCriteria.items.length > 0) {
      results.push(ratedCriteria);
    }

    // Extract timeline
    const timeline = this.extractTimeline(content);
    if (timeline.items.length > 0) {
      results.push(timeline);
    }

    // Extract budget
    const budget = this.extractBudget(content);
    if (budget.items.length > 0) {
      results.push(budget);
    }

    return results;
  }

  private static extractDeliverables(content: string): SuggestionExtractionResult {
    const patterns = [
      /deliverable[s]?[:\-\s]+(.*?)(?=\n\n|\n[A-Z]|$)/gis,
      /you should deliver[:\-\s]+(.*?)(?=\n\n|\n[A-Z]|$)/gis,
      /key output[s]?[:\-\s]+(.*?)(?=\n\n|\n[A-Z]|$)/gis,
      /project will produce[:\-\s]+(.*?)(?=\n\n|\n[A-Z]|$)/gis
    ];

    const items = [];
    let confidence = 0;

    for (const pattern of patterns) {
      const matches = [...content.matchAll(pattern)];
      for (const match of matches) {
        const extractedText = match[1].trim();
        const deliverableItems = this.parseListItems(extractedText);
        
        for (const item of deliverableItems) {
          if (item.trim().length > 10) { // Filter out very short items
            items.push({
              name: this.extractTitle(item),
              description: item.trim(),
              selected: false
            });
            confidence = Math.max(confidence, 0.7);
          }
        }
      }
    }

    // Look for bullet points or numbered lists
    const listMatches = content.match(/(?:^|\n)[\s]*[-•*]\s*(.+)/gm);
    if (listMatches) {
      for (const match of listMatches) {
        const cleanMatch = match.replace(/^[\s\n]*[-•*]\s*/, '').trim();
        if (this.isLikelyDeliverable(cleanMatch)) {
          items.push({
            name: this.extractTitle(cleanMatch),
            description: cleanMatch,
            selected: false
          });
          confidence = Math.max(confidence, 0.6);
        }
      }
    }

    return {
      sectionType: 'deliverables',
      items: this.deduplicateItems(items),
      confidence
    };
  }

  private static extractMandatoryCriteria(content: string): SuggestionExtractionResult {
    const patterns = [
      /mandatory[:\-\s]+(.*?)(?=\n\n|\nrated|\n[A-Z]|$)/gis,
      /must have[:\-\s]+(.*?)(?=\n\n|\n[A-Z]|$)/gis,
      /required[:\-\s]+(.*?)(?=\n\n|\n[A-Z]|$)/gis,
      /essential[:\-\s]+(.*?)(?=\n\n|\n[A-Z]|$)/gis
    ];

    const items = [];
    let confidence = 0;

    for (const pattern of patterns) {
      const matches = [...content.matchAll(pattern)];
      for (const match of matches) {
        const extractedText = match[1].trim();
        const criteriaItems = this.parseListItems(extractedText);
        
        for (const item of criteriaItems) {
          if (item.trim().length > 10) {
            items.push({
              name: this.extractTitle(item),
              description: item.trim(),
              type: 'mandatory'
            });
            confidence = Math.max(confidence, 0.8);
          }
        }
      }
    }

    return {
      sectionType: 'mandatory_criteria',
      items: this.deduplicateItems(items),
      confidence
    };
  }

  private static extractRatedCriteria(content: string): SuggestionExtractionResult {
    const patterns = [
      /rated[:\-\s]+(.*?)(?=\n\n|\n[A-Z]|$)/gis,
      /evaluation criteria[:\-\s]+(.*?)(?=\n\n|\n[A-Z]|$)/gis,
      /scoring[:\-\s]+(.*?)(?=\n\n|\n[A-Z]|$)/gis,
      /weighted[:\-\s]+(.*?)(?=\n\n|\n[A-Z]|$)/gis
    ];

    const items = [];
    let confidence = 0;

    for (const pattern of patterns) {
      const matches = [...content.matchAll(pattern)];
      for (const match of matches) {
        const extractedText = match[1].trim();
        const criteriaItems = this.parseListItems(extractedText);
        
        for (const item of criteriaItems) {
          if (item.trim().length > 10) {
            const weight = this.extractWeight(item);
            items.push({
              name: this.extractTitle(item),
              description: item.trim(),
              type: 'rated',
              weight: weight || 10
            });
            confidence = Math.max(confidence, 0.7);
          }
        }
      }
    }

    return {
      sectionType: 'rated_criteria',
      items: this.deduplicateItems(items),
      confidence
    };
  }

  private static extractTimeline(content: string): SuggestionExtractionResult {
    const patterns = [
      /timeline[:\-\s]+(.*?)(?=\n\n|\n[A-Z]|$)/gis,
      /duration[:\-\s]+(.*?)(?=\n\n|\n[A-Z]|$)/gis,
      /schedule[:\-\s]+(.*?)(?=\n\n|\n[A-Z]|$)/gis,
      /(\d+)\s*(days?|weeks?|months?)/gi
    ];

    const items = [];
    let confidence = 0;

    for (const pattern of patterns) {
      const matches = [...content.matchAll(pattern)];
      for (const match of matches) {
        const extractedText = match[1] || match[0];
        if (extractedText.trim().length > 5) {
          items.push({
            description: extractedText.trim(),
            suggestedDuration: this.extractDuration(extractedText)
          });
          confidence = Math.max(confidence, 0.6);
        }
      }
    }

    return {
      sectionType: 'timeline',
      items: this.deduplicateItems(items),
      confidence
    };
  }

  private static extractBudget(content: string): SuggestionExtractionResult {
    const patterns = [
      /budget[:\-\s]+(.*?)(?=\n\n|\n[A-Z]|$)/gis,
      /cost[:\-\s]+(.*?)(?=\n\n|\n[A-Z]|$)/gis,
      /price[:\-\s]+(.*?)(?=\n\n|\n[A-Z]|$)/gis,
      /\$[\d,]+(?:\.\d{2})?/g,
      /[\d,]+\s*(?:dollars?|USD|CAD)/gi
    ];

    const items = [];
    let confidence = 0;

    for (const pattern of patterns) {
      const matches = [...content.matchAll(pattern)];
      for (const match of matches) {
        const extractedText = match[1] || match[0];
        if (extractedText.trim().length > 3) {
          const budgetRange = this.extractBudgetRange(extractedText);
          items.push({
            description: extractedText.trim(),
            suggestedRange: budgetRange
          });
          confidence = Math.max(confidence, 0.5);
        }
      }
    }

    return {
      sectionType: 'budget',
      items: this.deduplicateItems(items),
      confidence
    };
  }

  private static parseListItems(text: string): string[] {
    // Split by line breaks and clean up
    const lines = text.split(/\n|;|,(?=\s[A-Z])/);
    return lines
      .map(line => line.replace(/^[\s\d\.\-•*]+/, '').trim())
      .filter(line => line.length > 3);
  }

  private static extractTitle(text: string): string {
    // Extract the first sentence or first 50 characters as title
    const firstSentence = text.split(/[.!?]/)[0];
    return firstSentence.length > 50 
      ? firstSentence.substring(0, 47) + '...'
      : firstSentence;
  }

  private static extractWeight(text: string): number | undefined {
    const weightMatch = text.match(/(\d+)%/);
    return weightMatch ? parseInt(weightMatch[1]) : undefined;
  }

  private static extractDuration(text: string): string | undefined {
    const durationMatch = text.match(/(\d+)\s*(days?|weeks?|months?)/i);
    return durationMatch ? durationMatch[0] : undefined;
  }

  private static extractBudgetRange(text: string): { min?: number; max?: number } | undefined {
    const amountMatches = text.match(/\$?([\d,]+(?:\.\d{2})?)/g);
    if (!amountMatches) return undefined;

    const amounts = amountMatches.map(match => 
      parseFloat(match.replace(/[$,]/g, ''))
    ).filter(num => !isNaN(num));

    if (amounts.length === 1) {
      return { max: amounts[0] };
    } else if (amounts.length >= 2) {
      return { min: Math.min(...amounts), max: Math.max(...amounts) };
    }

    return undefined;
  }

  private static isLikelyDeliverable(text: string): boolean {
    const deliverableKeywords = [
      'report', 'document', 'analysis', 'plan', 'strategy', 'design',
      'system', 'application', 'website', 'platform', 'solution',
      'implementation', 'training', 'support', 'maintenance'
    ];

    return deliverableKeywords.some(keyword => 
      text.toLowerCase().includes(keyword)
    );
  }

  private static deduplicateItems(items: any[]): any[] {
    const seen = new Set();
    return items.filter(item => {
      const key = item.name || item.description;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}