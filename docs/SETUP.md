```
# Creative Ad Generator - Setup Guide

## Prerequisites

- Google Workspace account with Apps Script enabled
- Google Cloud Platform project with Gemini API access
- GitHub account (optional for code hosting)
- Basic understanding of Google Apps Script

## Quick Start

### Step 1: Environment Setup
```bash
cd monks
npm install
node scripts/setup.js
```

### Step 2: Configure APIs
Create a `config/` folder and configure your API keys:

1. **Google Gemini API**
   - Visit [Google AI Studio](https://ai.google.dev/)
   - Generate API key
   - Store in Google Sheets or secure storage

2. **Google Ads API (Optional)**
   - Create Google Cloud project
   - Enable Ads API
   - Generate OAuth credentials

### Step 3: Deploy to Google Workspace

1. Open Google Sheets
2. Go to `Extensions` → `Apps Script`
3. Copy all `.gs` files to the project
4. Replace placeholder API keys with real ones
5. Save and run `generateAdCreativeWorkflow()`

## Development Workflow

### Phase 1: Creative Exploration

#### 1.1 Define Creative Brief
- Target audience and market
- Cultural considerations
- Brand guidelines
- Technical constraints

#### 1.2 Prompt Engineering Workshop
Use these approaches in `ad_generator.gs`:

```javascript
// Chain-of-Thought Reasoning
function createChainOfThoughtPrompt() {
  const steps = [
    "Analyze cultural preferences",
    "Select color psychology",
    "Adapt value proposition",
    "Optimize call-to-action"
  ];
}

// Persona-Based Design  
function designForPersona(persona) {
  const personas = {
    FINANIAL_ADVISOR: "trust, stability, professionalism",
    YOUNG_PROFESSIONAL: "ambition, modernity, energy",
    CONSUMER_EXPERT: "approachability, authenticity, relatability"
  };
}
</```

#### 1.3 Constraint-Driven Innovation
Generate innovative solutions within these creative constraints:

```javascript
const creativeConstraints = {
  colorPalette: "{blue, white}",
  buttonLength: "Maximum 3 words",
  readabilityRatio: "4.5:1 contrast",
  culturalAppropriateness: "{locale-specific}",
  aspectRatio: "1:1 for Instagram"
};
```

### Phase 2: Implementation

#### 2.1 Creative Engineering
```javascript
// Configure creative themes in ad_generator.gs
const THEMES = {
  TECHNOLOGY: {
    aesthetic: "Modern, minimalist, professional",
    colorPalettes: { light: ["#0066CC", "#FFFFFF"], dark: ["#FF6600", "#000000"] }
  }
};
```

#### 2.2 Automated Multi-Language Generation
```javascript
// Generate variants for each language
customizeForLocale(variant) {
  return {
    translatedText: await translateToLanguage(variant.text, variant.locale),
    culturallyAdaptedButton: optimizeButtonText(variant.button, variant.culturalContext),
    colorOptimization: adaptColorsForMarket(variant.colors, variant.marketProfile)
  };
}
```

### Phase 3: Quality Assurance and Iteration

#### 3.1 Multi-Criteria Evaluation
```javascript
EvaluateCreativeQuality(variant) {
  return {
    culturalAppropriateness: analyzeCulturalFit(variant),
    creativeInnovation: assessNovelty(variant),
    businessEffectiveness: measureConversionPotential(variant),
    technicalQuality: validateTechnicalSpecs(variant)
  };
}
```

#### 3.2 Continuous Improvement Cycle
```javascript
function continuousImprovement(variant, evaluation) {
  // Extract learning insights
  const insights = {
    successfulApproaches: identifyWhatWorked(variant, evaluation),
    areasForImprovement: identifyGaps(variant, evaluation),
    nextIteration: suggestImprovements(insights)
  };
  
  return {
    learnedFromThisIteration: insights.successfulApproaches,
    actionItems: insights.areasForImprovement.map(item => item.action),
    nextIterationImprovements: insights.nextIteration,
    successMetrics: calculateMetrics(insights),
    recommendation: provideRecommendation(insights)
  };
}
```

## Configuration Guide

### Creative Configuration
Edit `ad_generator.gs` and update these sections:

1. **PROMPT_THEMES**: Define your product categories and creative strategies
2. **CREATIVE_PERSONAS**: Set different creative perspectives for variation
3. **EVALUATION_METRICS**: Weight your quality criteria

### Localization Configuration
Edit `creative_engine.js` for localization setup:

1. **THEMES**: Product-specific aesthetic guidelines
2. **LOCALES**: Language-specific adaptations and cultural considerations
3. **CreativeApproaches**: Which prompt engineering methods to use

### API Integration
1. **Replace placeholder API keys** with real ones from Google Cloud Console
2. **Update Google Ads API credentials** if implementing direct library pulls
3. **Configure OAuth 2.0** for secure API access

## Testing and Validation

### Unit Tests
Run tests to verify creative logic:
```bash
npm test
```

Create test files in `tests/` folder:
- `test_prompt_engineering.js`: Test prompt generation logic
- `test_localization.js`: Test cultural adaptations
- `test_quality_evaluation.js`: Test scoring algorithms

### Manual Testing
1. **Run workflow** in Apps Script editor
2. **Check Google Sheets** output for generated variants
3. **Verify quality scores** and rankings
4. **Validate localization** accuracy

### Integration Testing
1. **Test API calls** with mock responses
2. **Verify Google Sheets integration**
3. **Check file generation and storage**

## Performance Optimization

### Rapid Prototyping Features
```javascript
// One-click generation for rapid iteration
function rapidPrototype() {
  const quickThemes = ["TECHNOLOGY", "SUSTAINABILITY", "FINANCIAL"];
  const fastLocales = ["en-US", "es-ES", "fr-FR"];
  
  for (const theme of quickThemes) {
    for (const locale of fastLocales) {
      generateSingleVariant(theme, locale);
    }
  }
}
```

### Streaming Generation
```javascript
// Process results incrementally for faster feedback
async function streamGeneration() {
  const results = await generateVariantsWithProgressTracking();
  while (!generationComplete) {
    showProgressReport();
    if (someVariantsReady) {
      exportReadyVariants();
    }
  }
}
```

## Advanced Features

### A/B Testing Integration
```javascript
function setupABTestingVariants() {
  const abTestScenarios = [
    {
      id: "version-a",
      colors: ["#0066CC", "#FFFFFF"],
      buttonText: "Get Started",
      copy: "Professional tech solution"
    },
    {
      id: "version-b", 
      colors: ["#FF6600", "#000000"],
      buttonText: "Start Now",
      copy: "Your go-to technology partner"
    }
  ];
}
```

### Automated Iteration
```javascript
function adaptiveCreativeIteration() {
  // Learn from quality scores
  // Automatically generate new variations
  // Test improvements against baseline
  // Optimize over multiple cycles
}
```

### User Feedback Integration
```javascript
function incorporateHumanFeedback() {
  const feedbackSources = [
    GoogleFormsResponses,
    SurveyResults,
    SalesTeamInsights,
    CustomerReviews
  ];
  
  // Process qualitative and quantitative feedback
  // Update creative strategies
  // Re-generate and test improvements
}
```

## Troubleshooting

### Common Issues

1. **API Rate Limits**
   ```javascript
   // Implement rate limiting and caching
   const cachedResults = {};
   function generateWithCache(key, generationFunction) {
     if (cachedResults[key]) return cachedResults[key];
     const result = generationFunction();
     cachedResults[key] = result;
     return result;
   }
   ```

2. **Localization Errors**
   ```javascript
   // Add fallback mechanisms for translation API failures
   function translateWithFallback(text, targetLocale) {
     try {
       return translate(text, targetLocale);
     } catch (error) {
       return translate(text, "en-US"); // Fallback to English
     }
   }
   ```

3. **Performance Issues**
   ```javascript
   // Use batch processing for large datasets
   function batchProcessVariants(variants, batchSize) {
     const batches = [];
     for (let i = 0; i < variants.length; i += batchSize) {
       batches.push(variants.slice(i, i + batchSize));
     }
     return Promise.all(batches.map(processBatch));
   }
   ```

## Deployment Checklist

Before deploying to production:

- [ ] All API keys configured in secure storage
- [ ] Error handling implemented for production edge cases
- [ ] Performance metrics implemented for monitoring
- [ ] Rate limiting configured to respect API limits
- [ ] Logging and monitoring set up for debugging
- [ ] Documentation updated with environment-specific configuration
- [ ] User training materials prepared
- [ ] Support channels established

## Next Steps

### Phase 1: Build Foundation
- [ ] Complete current implementation
- [ ] Add comprehensive tests
- [ ] Improve error handling
- [ ] Optimize performance

### Phase 2: Scale and Integrate
- [ ] Add Google Ads API integration
- [ ] Implement caching layer
- [ ] Add A/B testing capabilities
- [ ] Create web interface for manual oversight

### Phase 3: Advanced Features
- [ ] Machine learning for creative optimization
- [ ] Real-time preview capabilities
- [ ] Automated campaign management
- [ ] Cross-platform synchronization

## Resources

### Creative AI Resources
1. **Prompt Engineering Guide**: [Towards Data Science](https://towardsdatascience.com/how-to-prompt-your-images-with-stable-diffusion-part-1)
2. **Color Psychology**: [Adobe Color](https://color.adobe.com)
3. **Cultural Design Guidelines**: [Nielsen Norman Group](https://www.nngroup.com)

### Google Cloud Resources
1. **Apps Script Documentation**: [Google Developers](https://developers.google.com/apps-script)
2. **Gemini API Documentation**: [Google AI](https://ai.google.dev)
3. **Google Ads API**: [Google Ads Developer](https://developers.google.com/ads/api)

### Productivity Tools
1. **Project Management**: Use Google Sheets for tracking
2. **Version Control**: Git for code management
3. **Testing**: Jest for unit tests
4. **Linting**: Prettier and ESLint for code quality

---

*This setup guide emphasizes rapid prototyping, creative exploration, and practical implementation. The focus is on showcasing the creative process and demonstrating AI-driven workflows rather than creating production-perfect solutions.*