"""Creative Ad Image Generator for Google Apps Script

This script demonstrates an end-to-end agentic AI workflow for generating ad image variants.
It showcases rapid prototyping, API integration, and creative prompt engineering approaches.

Key Features:
- Fetches base images from ad libraries (simulated)
- Applies creative prompt engineering for multiple variants
- Generates localized ad creatives in different languages and colors
"""

// Global configuration and constants
const CONFIG = {
  // Creative prompt themes for different ad campaigns
  PROMPT_THEMES: {
    TECH_STARTUP: {
      base: "Professional tech startup ad, clean modern design, minimalisitic aesthetic",
      variations: [
        { language: "en", colors: ["#0066CC", "#FFFFFF"], locale: "en-US" },
        { language: "es", colors: ["#FF6600", "#000000"], locale: "es-ES" },
        { language: "fr", colors: ["#0066FF", "#FFFFFF"], locale: "fr-FR" },
        { language: "de", colors: ["#FF0000", "#FFFFFF"], locale: "de-DE" },
        { language: "ja", colors: ["#000000", "#FFFFFF"], locale: "ja-JP" }
      ]
    },
    SUSTAINABILITY: {
      base: "Eco-friendly product campaign, nature-inspired design, fresh vibrant colors",
      variations: [
        { language: "en", colors: ["#2ECC71", "#FFFFFF"], locale: "en-US" },
        { language: "es", colors: ["#27AE60", "#000000"], locale: "es-ES" }
      ]
    },
    FINANCIAL: {
      base: "Financial services professional presentation, trustworthy blue palette",
      variations: [
        { language: "en", colors: ["#3498DB", "#FFFFFF"], locale: "en-US" },
        { language: "es", colors: ["#2980B9", "#FFFFFF"], locale: "es-ES" }
      ]
    }
  },

  // Creative personas for prompt variations
  CREATIVE_PERSONAS: {
    MINIMALIST: "Create a clean, minimalist design focusing on essential elements only",
    DRAMATIC: "Add dramatic lighting and high contrast for visual impact",
    PLAYFUL: "Use playful colors and rounded shapes for approachability"
  },

  // Quality evaluation criteria
  EVALUATION_METRICS: {
    CONSISTENCY_WEIGHT: 0.3,
    CREATIVITY_WEIGHT: 0.4,
    TECHNICAL_QUALITY_WEIGHT: 0.3
  }
};

/**
 * Main orchestrator function - creates complete workflow for ad generation
 */
function generateAdCreativeWorkflow() {
  try {
    Logger.log("Starting ad creative generation workflow...");

    // Step 1: Fetch base image from ad library
    const baseImage = fetchBaseImageFromLibrary();
    Logger.log("✓ Base image fetched successfully");

    // Step 2: Generate creative prompt strategy
    const promptStrategy = createCreativePromptStrategy(baseImage);
    Logger.log("✓ Creative prompt strategy created");

    // Step 3: Generate ad variants using AI model
    const variants = generateAdVariants(baseImage, promptStrategy);
    Logger.log(`✓ Generated ${variants.length} ad variants");}

    // Step 4: Evaluate and rank variants
    const evaluatedVariants = evaluateVariantQuality(variants);
    Logger.log("✓ Variants evaluated and ranked");

    // Step 5: Export results
    exportCreativeResults(evaluatedVariants);
    Logger.log("✓ Creative results exported");

    return {
      success: true,
      generated: evaluatedVariants.length,
      bestVariant: evaluatedVariants[0],
      allVariants: evaluatedVariants
    };

  } catch (error) {
    Logger.log(`Error in workflow: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Creative prompt engineering function - generates unique prompts for each variant
 */
function createCreativePromptStrategy(baseImage) {
  const strategies = [];

  for (const themeKey of Object.keys(CONFIG.PROMPT_THEMES)) {
    const theme = CONFIG.PROMPT_THEMES[themeKey];

    for (const variant of theme.variations) {
      // Apply multiple creative thinking approaches
      const prompts = [];

      // 1. Direct approach - straightforward adaptation
      prompts.push(generateDirectPrompt(theme.base, variant));

      // 2. Chain-of-thought approach - sequential reasoning
      prompts.push(generateChainOfThoughtPrompt(theme.base, variant));

      // 3. Constraint-driven approach - creative boundaries
      prompts.push(generateConstraintDrivenPrompt(theme.base, variant));

      // 4. Persona-based approach - different creative perspectives
      for (const personaKey of Object.keys(CONFIG.CREATIVE_PERSONAS)) {
        const persona = CONFIG.CREATIVE_PERSONAS[personaKey];
        prompts.push(generatePersonaPrompt(theme.base, variant, persona));
      }

      strategies.push({
        theme: themeKey,
        variant: variant,
        prompts: prompts,
        targetDimensions: { width: 1080, height: 1080 },
        proposedColors: variant.colors,
        estimatedProcessingTime: prompts.length * 30000 // 30 seconds per prompt
      });
    }
  }

  return strategies;
}

/**
 * Generates a direct adaptation prompt - simple language transformation
 */
function generateDirectPrompt(basePrompt, variant) {
  return {
    approach: "direct",
    prompt: `${basePrompt} for ${variant.language} audience, using colors ${variant.colors.join(' and ')}, with call-to-action button text: "${variant.buttonText || variant.languages[0]}". Add text elements in ${variant.language} clearly visible.",
    reasoning: "Direct adaptation maintains original intent while localizing for specific market"
  };
}

/**
 * Generates chain-of-thought prompts - sequential reasoning process
 */
function generateChainOfThoughtPrompt(basePrompt, variant) {
  const steps = [
    `Step 1: Analyze target audience for ${variant.language} market...`,
    `Step 2: Select color palette that resonates culturally...`,
    `Step 3: Translate core message considering cultural nuances...`,
    `Step 4: Design button text that drives action in this context...`,
    `Step 5: Ensure all text elements fit within image composition...`
  ];

  return {
    approach: "chain-of-thought",
    prompt: `${basePrompt} 
    
    Sequential reasoning for ${variant.language} market:
    ${steps.join(' ')}
    
    Final composition: ${variant.colors[0]} background, ${variant.colors[1]} foreground, with ${variant.buttonText || variant.languages[0]} button.",
    reasoning: "Exposes reasoning process for human-in-the-loop validation"
  };
}

/**
 * Generates constraint-driven prompts - creative within boundaries
 */
function generateConstraintDrivenPrompt(basePrompt, variant) {
  const constraints = [
    `Must use exactly these colors: ${variant.colors.join(', ')}`,
    `Button must be: "${variant.buttonText || variant.languages[0]}"`,
    `Text must be readable in ${variant.language}`,
    `Design should appeal to ${variant.locale.split('-')[0]} market`,
    `Maintain professional corporate aesthetic"
  ];

  return {
    approach: "constraint-driven",
    prompt: `${basePrompt} with strict constraints: ${constraints.join('; ')}. This forces creative problem-solving within defined parameters, often leading to innovative solutions.",
    reasoning: "Creative constraints often drive breakthrough ideas"
  };
}

/**
 * Generates persona-based prompts - different creative perspectives
 */
function generatePersonaPrompt(basePrompt, variant, persona) {
  const personaInstructions = {
    "MINIMALIST": "Focus on spatial relationships, remove all unnecessary elements, emphasize negative space",
    "DRAMATIC": "Add high contrast lighting, create focal points, use shadow and light strategically",
    "PLAYFUL": "Incorporate rounded shapes, soft edges, vibrant color combinations, approachable typography"
  };

  return {
    approach: "persona-based",
    prompt: `${basePrompt} through the eyes of a ${persona} designer: ${personaInstructions[persona]}. For ${variant.language} market with colors ${variant.colors.join(' and ')}. Include button text: "${variant.buttonText || variant.languages[0]}".",
    reasoning: `Channel specific creative persona (${persona}) for distinctive aesthetic`
  };
}

/**
 * Main AI model integration function - generates ad variants
 */
function generateAdVariants(baseImage, promptStrategies) {
  const generatedVariants = [];

  for (const strategy of promptStrategies) {
    try {
      // Simulate AI model call - in reality this would call Nano Banana or similar
      const variant = simulateImageGeneration(baseImage, strategy);

      // Add metadata for tracking
      variant.strategy = strategy;
      variant.generationTime = new Date().toISOString();
      variant.modelUsed = "Nano Banana (simulated)";

      generatedVariants.push(variant);

      // Add delay between generations to simulate real processing time
      Utilities.sleep(1000); // 1 second delay

    } catch (error) {
      Logger.log(`Failed to generate variant for ${strategy.theme}: ${error.message}`);
    }
  }

  return generatedVariants;
}

/**
 * Simulated image generation with creative variations
 */
function simulateImageGeneration(baseImage, strategy) {
  const variantNumber = Math.random().toString(36).substr(2, 9);

  return {
    id: `variant_${variantNumber}`,
    theme: strategy.theme,
    language: strategy.variant.language,
    locale: strategy.variant.locale,
    colors: strategy.proposedColors,
    buttonText: strategy.variant.buttonText || `Click Here - ${strategy.variant.language.toUpperCase()}`,
    dimensions: strategy.targetDimensions,
    processingApproaches: strategy.prompts.map(p => p.approach),
    creativeRationale: generateCreativeRationale(strategy),
    imageDataUrl: `data:image/png;base64,${generateSimulatedImageData(strategy)}`, // Simulated base64 image
    thumbnails: generateThumbnailUrls(strategy), // Simulated thumbnail URLs
    metadata: {
      generationTimestamp: new Date().toISOString(),
      modelsUsed: ["Gemini AI", "Nano Banana (integrated)"],
      promptVariations: strategy.prompts.length,
      creativePersona: Object.keys(CONFIG.CREATIVE_PERSONAS).join(', ')
    }
  };
}

/**
 * Generates creative rationale for each variant
 */
function generateCreativeRationale(strategy) {
  const rationales = [];

  for (const prompt of strategy.prompts) {
    rationales.push({
      approach: prompt.approach,
      reasoning: prompt.reasoning,
      timestamp: new Date().toISOString(),
      evaluator: "Creative AI Agent"
    });
  }

  return rationales;
}

/**
 * Evaluates variant quality using multi-criteria assessment
 */
function evaluateVariantQuality(variants) {
  return variants.map(variant => {
    const consistencyScore = calculateConsistencyScore(variant);
    const creativityScore = calculateCreativityScore(variant);
    const technicalScore = calculateTechnicalScore(variant);

    const totalScore = (
      consistencyScore * CONFIG.EVALUATION_METRICS.CONSISTENCY_WEIGHT +
      creativityScore * CONFIG.EVALUATION_METRICS.CREATIVITY_WEIGHT +
      technicalScore * CONFIG.EVALUATION_METRICS.TECHNICAL_QUALITY_WEIGHT
    );

    return {
      ...variant,
      qualityMetrics: {
        consistency: consistencyScore,
        creativity: creativityScore,
        technical: technicalScore,
        overall: totalScore
      },
      rankedAt: new Date().toISOString(),
      evaluationMethodology: "Multi-criteria assessment using AI evaluation framework"
    };
  }).sort((a, b) => b.qualityMetrics.overall - a.qualityMetrics.overall);
}

/**
 * Calculates consistency score based on theme and variant coherence
 */
function calculateConsistencyScore(variant) {
  let score = 100;

  // Deduct points for inconsistencies
  if (variant.colors.length !== 2) score -= 20;
  if (!variant.buttonText) score -= 15;
  if (variant.language !== variant.theme.split('_')[0]) score -= 10;

  return Math.max(0, score);
}

/**
 * Calculates creativity score based on approach variety
 */
function calculateCreativityScore(variant) {
  const approaches = variant.processingApproaches;
  const uniqueApproaches = [...new Set(approaches)].length;

  return (uniqueApproaches / Object.keys(CONFIG.CREATIVE_PERSONAS).length) * 100;
}

/**
 * Calculates technical quality score
 */
function calculateTechnicalScore(variant) {
  let score = 100;

  // Check technical aspects
  if (!variant.imageDataUrl) score -= 30;
  if (variant.colors.length !== 2) score -= 20;
  if (variant.buttonText && variant.buttonText.length > 20) score -= 10;

  return Math.max(0, score);
}

/**
 * Exports creative results to Google Sheets
 */
function exportCreativeResults(variants) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Creative Results");

  if (!sheet) {
    sheet = ss.insertSheet("Creative Results");
    setupResultsHeaders(sheet);
  }

  // Clear existing data
  sheet.getRange(2, 1, sheet.getLastRow(), sheet.getLastColumn()).clear();

  // Add new results
  variants.forEach((variant, index) => {
    const row = index + 2;
    sheet.getRange(row, 1).setValue(variant.id);
    sheet.getRange(row, 2).setValue(variant.theme);
    sheet.getRange(row, 3).setValue(variant.language);
    sheet.getRange(row, 4).setValue(variant.locale);
    sheet.getRange(row, 5).setValue(variant.colors.join(', '));
    sheet.getRange(row, 6).setValue(variant.buttonText);
    sheet.getRange(row, 7).setValue(variant.qualityMetrics.overall.toFixed(2));
    sheet.getRange(row, 8).setValue(`=HYPERLINK("#", "View Variant")");
  });

  // Add summary statistics
  addResultsSummary(sheet, variants);
}

/**
 * Sets up headers for results sheet
 */
function setupResultsHeaders(sheet) {
  const headers = [
    "Variant ID",
    "Theme",
    "Language",
    "Locale", 
    "Color Palette",
    "Button Text",
    "Quality Score",
    "Actions"
  ];

  headers.forEach((header, index) => {
    sheet.getRange(1, index + 1).setValue(header);
  });
}

/**
 * Adds summary statistics to results sheet
 */
function addResultsSummary(sheet, variants) {
  const bestVariant = variants[0];
  const averageScore = variants.reduce((sum, v) => sum + v.qualityMetrics.overall, 0) / variants.length;

  sheet.getRange("A1:H1").setFontWeight("bold");
  sheet.getRange("B1").setValue(`Best: ${bestVariant.theme} (${bestVariant.language})")
    .setFontColor("#0066CC");
  sheet.getRange("G1").setValue(`Average Score: ${averageScore.toFixed(2)}")
    .setFontColor("#0066CC");
}

/**
 * Fetches base image from ad library (simulated)
 */
function fetchBaseImageFromLibrary() {
  // In reality, this would integrate with Google Ads API or Meta ad library
  // For demonstration, we return a simulated image

  return {
    id: "base_ad_image_001",
    source: "Google Ads Library",
    lastUpdated: new Date().toISOString(),
    metadata: {
      format: "PNG",
      dimensions: "1080x1080",
      fileSize: "2.5MB",
      estimatedDownloadTime: "3 seconds"
    },
    creativeScore: 85,
    culturalAppropriateness: "Neutral"
  };
}

/**
 * Generates simulated image data URL for demonstration
 */
function generateSimulatedImageData(strategy) {
  // This would be replaced with actual image generation API calls
  return "simulated_base64_data_for_demo_purposes_only";
}

/**
 * Generates simulated thumbnail URLs
 */
function generateThumbnailUrls(strategy) {
  return [
    `gs://creative-variants/${strategy.theme}_${strategy.variant.language}_thumb1.jpg`,
    `gs://creative-variants/${strategy.theme}_${strategy.variant.language}_thumb2.jpg`
  ];
}

/**
 * Utility function to run the complete workflow
 */
function runCompleteCreativeWorkflow() {
  Logger.log("=== Creative Ad Generation Workflow ===");
  Logger.log("This workflow demonstrates rapid prototyping of AI-driven creative solutions");
  Logger.log("\nAvailable commands:");
  Logger.log("1. generateAdCreativeWorkflow() - Run the complete workflow");
  Logger.log("2. createCreativePromptStrategy() - Generate creative prompt strategies");
  Logger.log("3. exportCreativeResults() - Export results to Google Sheets");
  Logger.log("\nWorkflow emphasizes:")
  Logger.log("- Rapid prototyping and iteration")
  Logger.log("- Creative prompt engineering with chain-of-thought reasoning")
  Logger.log("- Multi-criteria quality evaluation")
  Logger.log("- Export-ready results in Google Sheets")

  // Run the main workflow
  return generateAdCreativeWorkflow();
}

/**
 * Sample test function to demonstrate creative thinking approaches
 */
function demonstrateCreativeThinkingApproaches() {
  const creativeExamples = [
    {
      problem: "How do we make a financial service ad feel trustworthy?",
      solution: "Use blue palette, professional typography, and clear value proposition",
      approach: "Persona-based: Financial Advisor"
    },
    {
      problem: "How do we create urgency without being pushy?",
      solution: "Use scarcity elements, social proof, and clear timeline",
      approach: "Constraint-driven: Must mention limited-time offer"
    },
    {
      problem: "How do we make technology accessible to non-technical users?",
      solution: "Use analogies, simple language, and relatable scenarios",
      approach: "Chain-of-thought: Step-by-step user understanding"
    }
  ];

  creativeExamples.forEach((example, index) => {
    Logger.log(`\nExample ${index + 1}: ${example.problem}`);
    Logger.log(`Creative Solution: ${example.solution}`);
    Logger.log(`Thinking Approach: ${example.approach}`);
  });
}
