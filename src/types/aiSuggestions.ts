export interface AISuggestion {
  id: string;
  intakeFormId: string;
  userId: string;
  sectionType: 'deliverables' | 'mandatory_criteria' | 'rated_criteria' | 'timeline' | 'budget';
  suggestionContent: any;
  confidenceScore?: number;
  sourceMessageId?: string;
  status: 'pending' | 'accepted' | 'rejected' | 'modified';
  createdAt: Date;
  acceptedAt?: Date;
  modifiedContent?: any;
  updatedAt: Date;
}

export interface EvaluationCriterion {
  id: string;
  intakeFormId: string;
  userId: string;
  type: 'mandatory' | 'rated';
  name: string;
  description?: string;
  weight?: number;
  source: 'user' | 'ai_suggested' | 'ai_accepted';
  aiSuggestionId?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface AIMetadata {
  lastProcessedMessageId?: string;
  suggestionsCount: number;
  acceptedCount: number;
  rejectedCount: number;
  modifiedCount: number;
}

export interface SuggestionExtractionResult {
  sectionType: AISuggestion['sectionType'];
  items: any[];
  confidence: number;
}