import { IntakeFormData, Deliverable, Requirement } from "@/types/intake";

export type ContentType = 'deliverables' | 'mandatory' | 'rated' | 'general';

interface AIContentItem {
  id: string;
  name: string;
  description: string;
  type?: 'mandatory' | 'rated';
  weight?: number;
  scale?: string;
}

export const detectContentType = (message: string): ContentType => {
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('deliverable') || 
      lowerMessage.includes('deliverables') ||
      lowerMessage.includes('what should be delivered') ||
      lowerMessage.includes('suggest deliverables')) {
    return 'deliverables';
  }
  
  if (lowerMessage.includes('mandatory') || 
      lowerMessage.includes('required criteria') ||
      lowerMessage.includes('must have') ||
      lowerMessage.includes('mandatory criteria')) {
    return 'mandatory';
  }
  
  if (lowerMessage.includes('rated') || 
      lowerMessage.includes('scored') ||
      lowerMessage.includes('evaluation criteria') ||
      lowerMessage.includes('rating criteria')) {
    return 'rated';
  }
  
  return 'general';
};

export const generateContentSuggestions = (
  contentType: ContentType, 
  message: string, 
  formData: IntakeFormData
): { items: AIContentItem[], response: string } => {
  switch (contentType) {
    case 'deliverables':
      return generateDeliverableSuggestions(message, formData);
    case 'mandatory':
      return generateMandatoryCriteria(message, formData);
    case 'rated':
      return generateRatedCriteria(message, formData);
    default:
      return generateGeneralResponse(message, formData);
  }
};

const generateDeliverableSuggestions = (message: string, formData: IntakeFormData) => {
  const isDataAnalysis = message.toLowerCase().includes('data') || 
                        formData.commodityType?.toLowerCase().includes('data');
  
  const items: AIContentItem[] = isDataAnalysis ? [
    {
      id: Math.random().toString(36).substr(2, 9),
      name: "Comprehensive Data Analysis Report",
      description: "Detailed report summarizing findings, trends, patterns, and insights from the data analysis."
    },
    {
      id: Math.random().toString(36).substr(2, 9),
      name: "Interactive Dashboards",
      description: "Real-time dashboards with visualizations, charts, and key performance indicators."
    },
    {
      id: Math.random().toString(36).substr(2, 9),
      name: "Data Quality Assessment",
      description: "Assessment of data completeness, accuracy, and reliability across all sources."
    },
    {
      id: Math.random().toString(36).substr(2, 9),
      name: "Methodology Documentation",
      description: "Detailed documentation of analytical methods and statistical techniques used."
    },
    {
      id: Math.random().toString(36).substr(2, 9),
      name: "Executive Summary Presentation",
      description: "High-level presentation for stakeholders highlighting key findings and recommendations."
    }
  ] : [
    {
      id: Math.random().toString(36).substr(2, 9),
      name: "Project Management Plan",
      description: "Comprehensive project plan with timeline, milestones, and resource allocation."
    },
    {
      id: Math.random().toString(36).substr(2, 9),
      name: "Final Deliverable Report",
      description: "Complete documentation of all work performed and outcomes achieved."
    },
    {
      id: Math.random().toString(36).substr(2, 9),
      name: "Training and Knowledge Transfer",
      description: "Training materials and sessions for knowledge transfer to client staff."
    }
  ];

  const response = `Based on your project requirements, I've identified ${items.length} key deliverables that are commonly expected for this type of work. Each deliverable includes a clear description to help you understand what vendors should provide.`;

  return { items, response };
};

const generateMandatoryCriteria = (message: string, formData: IntakeFormData) => {
  const items: AIContentItem[] = [
    {
      id: Math.random().toString(36).substr(2, 9),
      name: "Minimum Years of Experience",
      description: "Vendor must have at least 3 years of relevant experience in similar projects",
      type: 'mandatory' as const
    },
    {
      id: Math.random().toString(36).substr(2, 9),
      name: "Professional Certifications",
      description: "Key personnel must hold relevant professional certifications in their field",
      type: 'mandatory' as const
    },
    {
      id: Math.random().toString(36).substr(2, 9),
      name: "Financial Standing",
      description: "Vendor must demonstrate financial stability and capability to complete the project",
      type: 'mandatory' as const
    },
    {
      id: Math.random().toString(36).substr(2, 9),
      name: "Security Clearance",
      description: "Personnel must have appropriate security clearance levels if required",
      type: 'mandatory' as const
    }
  ];

  const response = "Here are essential mandatory criteria that vendors must meet to be considered for your procurement. These are pass/fail requirements.";

  return { items, response };
};

const generateRatedCriteria = (message: string, formData: IntakeFormData) => {
  const items: AIContentItem[] = [
    {
      id: Math.random().toString(36).substr(2, 9),
      name: "Technical Approach and Methodology",
      description: "Quality and innovation of proposed technical approach",
      type: 'rated' as const,
      weight: 30,
      scale: "0-100 points"
    },
    {
      id: Math.random().toString(36).substr(2, 9),
      name: "Team Qualifications and Experience",
      description: "Relevant experience and qualifications of proposed team members",
      type: 'rated' as const,
      weight: 25,
      scale: "0-100 points"
    },
    {
      id: Math.random().toString(36).substr(2, 9),
      name: "Past Performance",
      description: "Track record on similar projects including quality and timeliness",
      type: 'rated' as const,
      weight: 20,
      scale: "0-100 points"
    },
    {
      id: Math.random().toString(36).substr(2, 9),
      name: "Value-Added Services",
      description: "Additional services or innovations beyond minimum requirements",
      type: 'rated' as const,
      weight: 15,
      scale: "0-100 points"
    },
    {
      id: Math.random().toString(36).substr(2, 9),
      name: "Local Content and Benefits",
      description: "Commitment to local hiring and economic benefits",
      type: 'rated' as const,
      weight: 10,
      scale: "0-100 points"
    }
  ];

  const response = "These rated criteria will be used to evaluate and score vendor proposals. The weights show the relative importance of each criterion.";

  return { items, response };
};

const generateGeneralResponse = (message: string, formData: IntakeFormData) => {
  const items: AIContentItem[] = [];
  
  let response = "I can help you develop specific requirements for your procurement. Try asking me to:\n\n";
  response += "• **\"Suggest deliverables for my project\"** - I'll recommend key deliverables\n";
  response += "• **\"Create mandatory criteria\"** - I'll suggest pass/fail requirements\n";
  response += "• **\"Generate rated criteria\"** - I'll propose scoring criteria with weights\n\n";
  response += "You can also describe your project in more detail, and I'll provide more targeted suggestions.";

  return { items, response };
};