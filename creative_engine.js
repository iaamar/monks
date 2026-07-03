// Configuration and utility functions for creative ad generation

const CreativeConfig = {
  // Creative themes for different product categories
  THEMES: {
    TECHNOLOGY: {
      primaryColors: { light: ['#0066CC', '#FFFFFF'], dark: ['#FF6600', '#000000'] },
      typography: 'sans-serif',
      style: 'modern, clean, professional'
    },
    SUSTAINABILITY: {
      primaryColors: { light: ['#2ECC71', '#FFFFFF'], dark: ['#27AE60', '#000000'] },
      typography: 'serif',
      style: 'nature-inspired, fresh, vibrant'
    },
    FINANCIAL: {
      primaryColors: { light: ['#3498DB', '#FFFFFF'], dark: ['#2980B9', '#000000'] },
      typography: 'monospace',
      style: 'trustworthy, professional, stable'
    }
  },

  // Language and locale configurations
  LOCALES: {
    'en-US': { buttonText: 'Get Started', textDirection: 'left-to-right' },
    'es-ES': { buttonText: 'Comenzar', textDirection: 'left-to-right' },
    'fr-FR': { buttonText: 'Commencer', textDirection: 'left-to-right' },
    'de-DE': { buttonText: 'Beginnen', textDirection: 'left-to-right' },
    'ja-JP': { buttonText: '開始', textDirection: 'right-to-left' }
  }
};

// Creative thinking approaches for prompt engineering
const CreativeApproaches = {
  DIRECT: {
    name: 'Direct Adaptation',
    description: 'Straightforward translation and adaptation preserving original intent',
    useCase: 'Fast iteration, maintains brand consistency'
  },
  CHAIN_OF_THOUGHT: {
    name: 'Chain-of-Thought Reasoning',
    description: 'Sequential step-by-step reasoning process',
    useCase: 'Human-in-the-loop validation, explainable AI'
  },
  CONSTRAINT_DRIVEN: {
    name: 'Constraint-Driven Creation',
    description: 'Creative problem solving within strict boundaries',
    useCase: 'Innovation under constraints, breakthrough ideas'
  },
  PERSONA_BASED: {
    name: 'Persona-Based Design',
    description: 'Design from different creative perspectives and user personas',
    useCase: 'Diverse aesthetic options, user-centered design'
  }
};

// Image manipulation strategies
const ManipulationStrategies = {
  COLOR_HARMONIZATION: {
    description: 'Balance color palettes for visual harmony',
    techniques: ['complementary', 'analogous', 'triadic']
  },
  TEXT_OPTIMIZATION: {
    description: 'Ensure text readability and visual hierarchy',
    techniques: ['contrast adjustment', 'font scaling', 'background optimization']
  },
  COMPOSITION_REFINEMENT: {
    description: 'Improve visual composition and focal points',
    techniques: ['rule of thirds', 'leading lines', 'negative space']
  }
};

/**
 * Creative prompt engineering system
 * Demonstrates multiple approaches to generating creative AI prompts
 */
function CreativePromptEngineer(basePrompt, theme, variant) {
  const approaches = {};

  // 1. Direct Approach - Simple adaptation
  approaches.direct = generateDirectPrompt(basePrompt, theme, variant);

  // 2. Chain-of-Thought Approach - Sequential reasoning
  approaches.chainOfThought = generateChainOfThoughtPrompt(basePrompt, theme, variant);

  // 3. Constraint-Driven Approach - Creative within boundaries
  approaches.constraintDriven = generateConstraintPrompt(basePrompt, theme, variant);

  // 4. Persona-Based Approach - Different creative perspectives
  approaches.personaBased = generatePersonaPrompts(basePrompt, theme, variant);

  return approaches;
}

/**
 * Generates a persona-based prompt with cultural awareness
 */
function generatePersonaPrompt(basePrompt, theme, variant, persona) {
  const personaContext = {
    'FINANCIAL_ADVISOR': {
      tone: 'professional, authoritative, trustworthy',
      visualElements: 'formal presentation, clean layout, charts/graphs',
      colorPreferences: 'blue, gold, navy - conveying stability and expertise'
    },
    'YOUNG_PROFESSIONAL': {
      tone: 'ambitious, energetic, modern',
      visualElements: 'dynamic compositions, bold typography, movement',
      colorPreferences: 'gradient effects, neon accents, contrasting colors'
    },
    'CONSUMER_EXPERT': {
      tone: 'approachable, friendly, relatable',
      visualElements: 'lifestyle imagery, candid photos, authentic settings',
      colorPreferences: 'warm tones, natural lighting, earthy colors'
    }
  };

  const personaInfo = personaContext[persona] || personaContext.FINANCIAL_ADVISOR;

  return {
    persona: persona,
    adaptedPrompt: `${basePrompt} 
    
    Target Audience: ${variant.language} market (${variant.locale}).
    Creative Direction: ${personaInfo.tone}
    Visual Elements: ${personaInfo.visualElements}
    Color Palette: ${personaInfo.colorPreferences}
    Call-to-Action: Button text "${variant.buttonText || 'Learn More'}" 
    Cultural Adaptation: Ensure appropriateness for ${variant.locale} market
    Technical Requirements: High contrast for readability, mobile-optimized dimensions",
    reasoning: `Approaches creative thinking from ${persona} perspective, ensuring diverse aesthetic outcomes`
  };
}

/**
 * Generates constraint-driven prompts
 * Shows how limitations can drive creativity
 */
function generateConstraintPrompt(basePrompt, theme, variant) {
  const constraints = [
    `Must use exactly these two colors: ${variant.colors[0]} and ${variant.colors[1]} - no other colors allowed`,
    `Button text must be exactly: "${variant.buttonText}" - cannot change length or wording`,
    `Text must be legible when scaled to 50% size - prioritize contrast`,
    `Design must work on both light (${variant.colors[1]}) and dark (${variant.colors[0]}) backgrounds`,
    `Include exactly 3-5 typography elements - avoid clutter`
  ];

  return {
    constraintType: 'strict',
    constraints: constraints,
    creativePrompt: `${basePrompt} 
    
    STRICT CREATIVE CONSTRAINTS - Use these to drive innovation:
    1. ${constraints[0]}
    2. ${constraints[1]}
    3. ${constraints[2]}
    4. ${constraints[3]}
    5. ${constraints[4]}
    
    Chain-of-Thought for Constraint Innovation:
    - Problem: How to make limited palette impactful?
    - Solution: Use saturation variations and strategic placement
    - Problem: How to make fixed button text engaging?
    - Solution: Position strategically and add visual interest around it
    - Expected Outcome: Surprising creativity within limitations`,
    innovationPotential: 'High - Constraints force breakthrough solutions'
  };
}

/**
 * Creates a multicultural adaptation strategy
 */
function generateMulticulturalPrompt(basePrompt, theme, variant) {
  const culturalConsiderations = {
    'en-US': {
      marketingTrends: 'Direct, value-focused, social proof-driven',
      colorPsychology: 'Blue (trust), Green (growth), Red (action)',
      designLanguage: 'Minimalist, spacious, performance-oriented'
    },
    'es-ES': {
      marketingTrends: 'Emotional, family-oriented, relationship-focused',
      colorPsychology: 'Red (passion), Gold (wealth), Blue (trust)',
      designLanguage: 'Vibrant, festive, high-energy'
    },
    'fr-FR': {
      marketingTrends: 'Elegant, sophisticated, quality-focused',
      colorPsychology: 'Navy (authority), Gold (luxury), Red (passion)',
      designLanguage: 'Classic, refined, understated luxury'
    },
    'de-DE': {
      marketingTrends: 'Practical, efficient, detail-oriented',
      colorPsychology: 'Grey (neutral), Blue (trust), Green (nature)',
      designLanguage: 'Clean, functional, precision-engineered'
    },
    'ja-JP': {
      marketingTrends: 'Harmony, balance, tradition with innovation',
      colorPsychology: 'Red (joy), White (purity), Green (nature)',
      designLanguage: 'Negative space, subtle gradients, meticulous detail'
    }
  };

  const culture = culturalConsiderations[variant.locale] || culturalConsiderations['en-US'];

  return {
    culturalStrategy: variant.locale,
    marketInsight: culture,
    prompt: `${basePrompt} 
    
    CULTURAL INSIGHTS FOR ${variant.locale.toUpperCase()}:
    - Marketing Trends: ${culture.marketingTrends}
    - Color Psychology: ${culture.colorPsychology}
    - Design Language: ${culture.designLanguage}
    
    ADAPTATION STRATEGY:
    1. Translate core message with cultural nuance, not just literal translation
    2. Adapt visual metaphors to resonate with local experiences
    3. Adjust color usage based on cultural associations
    4. Modify layout preferences (e.g., reading direction)
    5. Ensure all text elements are culturally appropriate symbols
    
    INNOVATION OPPORTUNITIES:
    - What's currently missing in ${variant.locale} ad market?
    - How can we challenge cultural assumptions?
    - What local elements can elevate global brand?
    - How do we respect tradition while appearing innovative?`,
    complexityLevel: 'High - Requires deep cultural understanding'
  };
}

/**
 * Evaluates creative quality across multiple dimensions
 */
function EvaluateCreativeQuality(variant, baseMetrics) {
  const evaluation = {
    overall: 0,
    dimensions: {},
    recommendations: [],
    confidence: 0
  };

  // 1. Technical Quality Assessment
  evaluation.dimensions.technical = calculateTechnicalScore(variant, baseMetrics);

  // 2. Cultural Appropriateness
  evaluation.dimensions.cultural = calculateCulturalScore(variant, baseMetrics);

  // 3. Creative Innovation
  evaluation.dimensions.creative = calculateCreativeScore(variant, baseMetrics);

  // 4. Business Effectiveness
  evaluation.dimensions.business = calculateBusinessScore(variant, baseMetrics);

  // Weighted overall score
  evaluation.overall = (
    evaluation.dimensions.technical * 0.25 +
    evaluation.dimensions.cultural * 0.30 +
    evaluation.dimensions.creative * 0.25 +
    evaluation.dimensions.business * 0.20
  );

  // Generate recommendations based on weak areas
  if (evaluation.dimensions.cultural < 70) {
    evaluation.recommendations.push('Consider additional cultural testing for target market');
  }

  if (evaluation.dimensions.creative < 60) {
    evaluation.recommendations.push('Explore additional creative approaches or prompts');
  }

  if (evaluation.dimensions.business < 75) {
    evaluation.recommendations.push('Test with target audience to improve conversion potential');
  }

  return evaluation;
}

/**
 * Creative workflow orchestrator with continuous improvement
 */
function CreativeWorkflowOrchestrator(inputParameters) {
  const workflow = {
    iteration: 0,
    strategy: 'continuous_improvement',
    stages: [],
    outcomes: []
  };

  // Stage 1: Discovery and Strategy
  const discovery = discoverCreativeRequirements(inputParameters);
  workflow.stages.push(discovery);

  // Stage 2: Creative Exploration
  const exploration = creativeExplorationPhase(discovery);
  workflow.stages.push(exploration);

  // Stage 3: Generation and Refinement
  const generation = generationAndRefinementPhase(exploration);
  workflow.stages.push(generation);

  // Stage 4: Evaluation and Optimization
  const evaluation = evaluationAndOptimizationPhase(generation);
  workflow.stages.push(evaluation);

  return workflow;
}

/**
 * Continuous learning and improvement cycle
 */
function ContinuousImprovementCycle(variant, evaluationResults) {
  const insights = extractLearningInsights(variant, evaluationResults);

  return {
    learnedFromThisIteration: insights.map(insight => insight.title),
    actionItems: insights.map(insight => insight.action),
    nextIterationImprovements: generateNextIterationImprovements(insights),
    successMetrics: calculateSuccessMetrics(insights),
    recommendation: summarizeRecommendation(insights)
  };
}
