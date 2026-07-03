#!/usr/bin/env node
"""Setup script for the creative ad generation project

This script initializes the project structure and creates essential configuration files.
Designed for rapid setup and easy deployment.
"""

const fs = require('fs').promises;
const path = require('path');

const PROJECT_ROOT = __dirname;
const SCRIPT_DIR = path.join(PROJECT_ROOT, 'scripts');

/**
 * Main setup function
 */
async function setup() {
  try {
    console.log('🔧 Setting up Creative Ad Generator project...\n');

    // Step 1: Create project directories
    await createDirectories();

    // Step 2: Create configuration files
    await createPackageJson();
    await createGitignore();
    await createWorkflowDocs();

    // Step 3: Validate critical files
    await validateCriticalFiles();

    console.log('\n✅ Project setup completed successfully!');
    console.log('\n📋 Next Steps:');
    console.log('1. npm run deploy  - Prepare for Google Workspace deployment');
    console.log('2. Open Google Sheets → Extensions → Apps Script');
    console.log('3. Copy all .gs files from the project folder');
    console.log('4. Configure API keys in the script environment');
    console.log('5. Run generateAdCreativeWorkflow() to start generation');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

/**
 * Create necessary directories for the project
 */
async function createDirectories() {
  const directories = [
    'scripts',
    'logs',
    'tests',
    'docs',
    'assets/samples',
    'assets/templates',
    'output'
  ];

  for (const dir of directories) {
    const dirPath = path.join(PROJECT_ROOT, dir);
    try {
      await fs.mkdir(dirPath, { recursive: true });
      console.log(`✅ Created directory: ${dir}`);
    } catch (error) {
      if (error.code !== 'EEXIST') {
        throw new Error(`Failed to create directory ${dir}: ${error.message}`);
      }
    }
  }
}

/**
 * Create updated package.json with comprehensive project metadata
 */
async function createPackageJson() {
  const packageJson = {
    name: 'monks-creative-ad-generator',
    version: '1.0.0',
    description: 'Agentic AI workflow for creative ad image generation with rapid prototyping',
    main: 'ad_generator.gs',
    repository: {
      type: 'git',
      url: 'https://github.com/amarnagargoje/monks-creative-ad-generator'
    },
    license: 'MIT',
    keywords: [
      'creative-ai',
      'google-apps-script',
      'ad-generation',
      'prompt-engineering',
      'creative-workflow',
      'multi-language',
      'cultural-ai'
    ],
    author: 'Amar Nagargoje',
    contributors: [
      {
        name: 'Amar Nagargoje',
        email: 'amarnagargoje@example.com'
      }
    ],
    scripts: {
      setup: 'node scripts/setup.js',
      test: 'node scripts/test.js',
      deploy: 'node scripts/deploy.js',
      'docs:generate': 'node scripts/generate-docs.js',
      'lint': 'eslint scripts/ --fix',
      'format': 'prettier --write scripts/'
    },
    dependencies: {},
    devDependencies: {
      prettier: '3.0.0',
      eslint: '8.50.0'
    },
    engines: {
      node: '>=18.0.0'
    },
    directories: {
      doc: 'docs',
      lib: 'scripts',
      test: 'tests'
    },
    bugs: {
      url: 'https://github.com/amarnagargoje/monks-creative-ad-generator/issues'
    },
    homepage: 'https://github.com/amarnagargoje/monks-creative-ad-generator#readme'
  };

  const packageJsonPath = path.join(PROJECT_ROOT, 'package.json');
  await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
  console.log('✅ Created package.json');
}

/**
 * Create .gitignore file to manage dependencies and generated files
 */
async function createGitignore() {
  const gitignore = `# Node.js
node_modules/
.npm
.coveralls.yml
.yarnclean
.nyc_output
.coverage
.env
.env.local
.env.development
.env.test
.env.production

# Build directories
dist/
build/
.cache/
.java
.DS_Store
Thumbs.db

# Logs
logs/
*.log
npm-debug.log*
pnpm-debug.log*
yarn-debug.log*
.lighthouseci

# IDE
.idea/
.vscode/
*.swp
*.swo
*~

# Google Apps Script
docs/
*.gs
*.js
*.js.map

# Generated content
output/
assets/samples/
assets/templates/

# Temporary files
temp/
.tmp/
**/.tmp/

# Documentation
*.md
`;

  const gitignorePath = path.join(PROJECT_ROOT, '.gitignore');
  await fs.writeFile(gitignorePath, gitignore);
  console.log('✅ Created .gitignore');
}

/**
 * Create comprehensive workflow documentation
 */
async function createWorkflowDocs() {
  const docsDir = path.join(PROJECT_ROOT, 'docs');

  // Workflow overview
  const workflowOverview = `# Creative Ad Workflow - Overview

## Purpose
This workflow demonstrates an end-to-end agentic AI system for generating and editing ad images using Google Apps Script and AI models.

## Core Components

### 1. Base Image Handling
- Source images from Google/Meta ad libraries
- Image validation and preprocessing
- Format optimization for different platforms

### 2. Creative Prompt Engineering
- Multi-approach prompt generation
- Chain-of-thought reasoning
- Constraint-driven creativity
- Persona-based design approaches

### 3. Variant Generation
- Multi-language localization
- Color scheme optimization
- Button text adaptation
- Cultural appropriateness validation

### 4. Quality Evaluation
- Multi-criteria assessment
- Automated ranking
- Continuous improvement feedback
- Human-in-the-loop validation

### 5. Results Management
- Google Sheets integration
- Version control and storage
- A/B testing setup
- Performance tracking
`;

  await fs.writeFile(
    path.join(docsDir, 'WORKFLOW.md'),
    workflowOverview
  );

  console.log('✅ Created workflow documentation');
}

/**
 * Validate critical project files are present
 */
async function validateCriticalFiles() {
  const criticalFiles = [
    { path: 'ad_generator.gs', description: 'Main workflow orchestrator' },
    { path: 'creative_engine.js', description: 'Creative prompt engineering engine' }
  ];

  console.log('\n🔍 Validating critical files:');
  for (const file of criticalFiles) {
    try {
      await fs.access(path.join(PROJECT_ROOT, file.path));
      console.log(`✅ ${file.path} - ${file.description}`);
    } catch {
      console.log(`❌ ${file.path} - Missing: ${file.description}`);
      process.exit(1);
    }
  }
}

// Run setup if called directly
if (require.main === module) {
  setup();
}

module.exports = { setup };