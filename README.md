# Creative Ad Generator - Take-Home Assignment

This repository demonstrates an end-to-end agentic AI workflow for generating ad image variants using Google Apps Script and innovative prompt engineering approaches.

## Overview

This project showcases rapid prototyping capabilities for creative media services teams by implementing a complete workflow that:

1. **Pulls/adjusts base ad images** from Google/Meta ad libraries
2. **Applies creative prompt engineering** to generate three variants with different languages, colors, and button text
3. **Demonstrates agentic AI principles** through chaining, evaluation, and continuous improvement
4. **Provides clear documentation** and extensible architecture for further development

## Technology Stack

- **Google Apps Script**: Workflow orchestration in Google Workspace
- **Google Gemini AI**: Image generation and creative prompt engineering
- **JavaScript**: Core logic and utilities
- **Google Sheets**: Results tracking and visualization

## Project Structure

```
monks/
├── ad_generator.gs              # Main Google Apps Script - workflow orchestrator
├── creative_engine.js            # Creative prompt engineering and utilities
├── package.json                 # Node.js package configuration
├── docs/
│   ├── SETUP.md                 # Comprehensive setup guide
│   └── ...                      # Additional documentation
├── scripts/                     # Development and deployment tools
│   ├── index.js                 # Main script management
│   └── *.js                     # Utility scripts
├── frontend/                    # Optional web interface (skeleton)
├── assets/                      # Creative templates and assets
└── tests/                       # Test files (framework independent)
```

## Key Features

### 1. Multi-Approach Prompt Engineering

The script demonstrates four distinct creative thinking approaches:

- **Direct Adaptation**: Simple language transformation preserving original intent
- **Chain-of-Thought Reasoning**: Sequential step-by-step creative process
- **Constraint-Driven Creation**: Innovation within strict boundaries
- **Persona-Based Design**: Creative perspectives from different user types

### 2. Cross-Lingual Creative Adaptation

- Generates variants in multiple languages (English, Spanish, French, German, Japanese)
- Applies cultural awareness for appropriate localization
- Maintains brand consistency across variants

### 3. Continuous Quality Evaluation

- Multi-criteria assessment (technical, cultural, creative, business)
- Automated ranking and selection of best variants
- Continuous improvement feedback loops

### 4. Agentic Workflow Orchestration

- Automated discovery and strategy formulation
- Parallel processing of creative approaches
- Results export to Google Sheets for tracking

## Creative Innovation Highlights

### Prompt Engineering Approaches

Each variant is generated using **multiple creative approaches**, ensuring diverse outcomes:

```javascript
// Example prompt generation
const prompts = {
  direct: { approach: "direct", focus: "preserving intent" },
  chainOfThought: { approach: "chain-of-thought", focus: "sequential reasoning" },
  constraintDriven: { approach: "constraint-driven", focus: "creative limits" },
  personaBased: { approach: "persona-based", focus: "creative perspective" }
};
```

### Cultural Adaptation Strategies

```javascript
// Language-specific creative considerations
culturalConsiderations = {
  "en-US": { trends: "direct", colors: "blue/green/red", design: "minimalist" },
  "es-ES": { trends: "emotional", colors: "red/gold/blue", design: "vibrant" },
  "fr-FR": { trends: "elegant", colors: "navy/gold/red", design: "luxury" },
  "de-DE": { trends: "practical", colors: "grey/blue/green", design: "clean" },
  "ja-JP": { trends: "harmonic", colors: "red/white/green", design: "negative-space" }
};
```

### Creative Constraints as Innovation Drivers

The project demonstrates how **constraints can drive creativity**:

- Fixed color palettes for brand consistency
- Language restrictions for creative problem-solving
- Cultural appropriateness requirements
- Technical dimension constraints

## Getting Started

### 1. Quick Setup

```bash
cd monks
npm run setup
```

### 2. Environment Configuration

1. **Google Workspace Setup**
   - Open Google Sheets
   - Go to `Extensions` → `Apps Script`
   - Copy `ad_generator.gs` and `creative_engine.js` to the project

2. **API Configuration**
   - Configure Google Gemini API credentials
   - Set up optional Google Ads API integration
   - Configure storage for generated variants

### 3. Running the Workflow

Execute the complete creative workflow:

```javascript
function runCreativeAdGeneration() {
  return generateAdCreativeWorkflow();
}
```

The script will:
1. Fetch base image from ad library
2. Generate creative prompt strategies
3. Create multiple variants across languages
4. Evaluate and rank variants
5. Export results to Google Sheets

### 4. Testing

```bash
npm test
```

## Technical Implementation

### Core Workflow Functions

- `generateAdCreativeWorkflow()`: Main orchestrator function
- `createCreativePromptStrategy()`: Multi-approach prompt generation
- `CreativePromptEngineer()`: Creative prompt engineering system
- `EvaluateCreativeQuality()`: Multi-criteria quality assessment

### File Structure

**Google Apps Script (`ad_generator.gs`):**
- Workflow management and orchestration
- API integration with external services
- Google Sheets integration for results

**JavaScript Module (`creative_engine.js`):**
- Creative prompt engineering algorithms
- Cultural adaptation logic
- Quality evaluation metrics
- Persona-based creative approaches

### Creative Prompt Examples

**Direct Approach:**
```
"Professional tech startup ad for English audience with #0066CC and #FFFFFF colors, using Get Started button. Add text elements in English clearly visible."
```

**Chain-of-Thought Approach:**
```
Step 1: Analyze target audience for English market...
Step 2: Select color palette that resonates culturally...
Step 3: Translate core message considering cultural nuances...
Step 4: Design button text that drives action...
Step 5: Ensure text elements fit within image composition...
```

**Constraint-Driven Approach:**
```
Strict constraints: Use exact colors #0066CC and #FFFFFF, button text "Get Started", legible at 50% scale, work on both light and dark backgrounds, include 3-5 typography elements.
```

## Innovation and Research Contributions

### 1. Creative AI Prompt Engineering

- Systematic approaches to creative image generation
- Multi-perspective prompt generation techniques
- Constraint-driven creative problem solving

### 2. Cross-Model Creative Consistency

- Maintaining quality across different creative approaches
- Cultural appropriateness validation
- Brand consistency in creative variations

### 3. Human-AI Creative Collaboration

- Creative judgment integration in automated workflows
- Explainable creative process (chain-of-thought)
- Continuous improvement feedback loops

### 4. Rapid Prototyping Techniques

- One-click generation for rapid iteration
- Streaming generation with incremental feedback
- Automated quality assessment and ranking

## Ethical and Quality Considerations

### Creative Quality Assurance

1. **Bias Mitigation**: Ensuring diverse and inclusive visual representations
2. **Cultural Awareness**: Respecting cultural sensitivities in international markets
3. **Accessibility**: Ensuring text readability and visual hierarchy
4. **Performance**: Balancing creativity with practical business objectives

### Usage Guidelines

- Understand this is a **prototyping and demonstration tool**
- Review outputs for brand and cultural appropriateness
- Use generated variants as creative starting points, not final products
- Consider ethical implications of AI-generated creative content

## Deployment and Production Considerations

### Google Workspace Integration

The project is designed for deployment in Google Workspace:

- **Storage**: Uses Google Drive for generated image variants
- **Collaboration**: Leverages Google Sheets for team oversight
- **Automation**: Can be scheduled for regular generation runs
- **Monitoring**: Built-in logging for process tracking

### Scaling Considerations

For production deployment:

1. **API Rate Limiting**: Implement caching and throttling
2. **Error Handling**: Robust fallback mechanisms
3. **Performance**: Optimize for speed and efficiency
4. **Storage**: Implement backup and recovery systems

## Next Steps and Future Enhancements

### Phase 1: Extend Creative Capabilities

- Add more creative approaches (e.g., emotion-based, trend-driven)
- Integrate additional AI models for diverse creative styles
- Extend cultural awareness framework
- Add more language and locale support

### Phase 2: Advanced Features

- A/B testing integration with Google Ads API
- Automated campaign optimization
- Real-time creative preview and testing
- User feedback integration and learning loops

### Phase 3: Enterprise Integration

- Enterprise brand guideline enforcement
- Compliance checking for different markets
- Advanced analytics and performance tracking
- API-first design for integration with creative tools

## Testing and Validation

### Testing Strategy

While this repository doesn't include a specific test framework (as Google Apps Script has limited testing capabilities), validation is built into the workflow:

1. **API Integration Testing**: Real API calls validate functionality
2. **Creative Quality Assessment**: Multi-criteria evaluation
3. **User Experience Testing**: Manual validation of generated variants
4. **Performance Testing**: Speed and efficiency measurements

### Validation Methods

- Quality scoring for each generated variant
- Cultural appropriateness assessment
- Technical specification validation
- Business effectiveness evaluation

## Support and Community

### Technical Support

For issues or questions about this project:

1. Review the documentation in the `docs/` folder
2. Check the code comments in `ad_generator.gs` and `creative_engine.js`
3. Test with the development scripts provided
4. Reach out through your professional network

### Community Contributions

This project is designed to be extensible:

- Creative approaches can be easily added
- New prompt engineering techniques can be incorporated
- Quality evaluation metrics can be customized
- Cultural awareness framework can be expanded

## License

This project is part of a professional portfolio demonstration. Code is provided for educational and demonstration purposes.

## Conclusion

This repository demonstrates a complete agentic AI workflow for creative image generation, emphasizing:

- **Rapid prototyping** capabilities for creative teams
- **Creative prompt engineering** with multiple innovative approaches
- **Cross-cultural creativity** with proper localization
- **Quality assurance** through systematic evaluation
- **Extensible architecture** for further development

The implementation showcases how AI can enhance creative workflows while maintaining human oversight and quality control, making it suitable for media services teams looking to implement creative AI solutions.
