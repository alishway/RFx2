export interface Deliverable {
  id: string;
  name: string;
  description: string;
  selected: boolean;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  selected: boolean;
  category: string;
}

export interface Requirement {
  id: string;
  name: string;
  description: string;
  type: 'mandatory' | 'rated';
  weight?: number;
  scale?: string;
}

export interface Requirements {
  mandatory: Requirement[];
  rated: Requirement[];
  priceWeight: number;
}

export interface IntakeFormData {
  title?: string;
  background: string;
  commodityType: string;
  estimatedValue?: string;
  deliverables: Deliverable[];
  tasks: Task[];
  startDate: string;
  endDate: string;
  attachments: File[];
  requirements: Requirements;
  budgetTolerance: 'sensitive' | 'moderate' | 'flexible';
  aiMetadata?: {
    lastProcessedMessageId?: string;
    suggestionsCount: number;
    acceptedCount: number;
    rejectedCount: number;
    modifiedCount: number;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  suggestions?: string[];
  extractedDeliverables?: Deliverable[];
}