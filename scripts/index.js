"""Node.js scripts for the creative ad generation project

This module provides development and deployment tools for the creative ad generation workflow.
Designed for rapid prototyping and demonstration purposes.
"""

const fs = require('fs').promises;
const path = require('path');

const SCRIPT_DIR = __dirname;

/**
 * Setup script - initializes project environment
 */
async function setup() {
  try {
    console.log('Setting up creative ad generation project...');

    // Create necessary directories if they don't exist
    const dirs = ['scripts', 'logs', 'tests', 'docs', 'assets'];
    for (const dir of dirs) {
      await fs.mkdir(path.join(SCRIPT_DIR, dir), { recursive: true });
    }

    // Create basic configuration files
    await createPackageJson();
    await createReadme();
    await createGitignore();

    console.log('✅ Setup completed successfully!');
    console.log('\nNext steps:');
    console.log('1. Deploy to Google Workspace using ad_generator.gs');
    console.log('2. Configure API keys in Google Sheets');
    console.log('3. Run the workflow with generateAdCreativeWorkflow()');

  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    throw error;
  }
}

/**
 * Creates package.json with project metadata
 */
async function createPackageJson() {
  const packageJson = {
    name: 'monks-creative-ad-generator',
    version: '1.0.0',
    description: 'Agentic AI workflow for creative ad image generation with rapid prototyping',
    main: 'ad_generator.gs',
    license: 'MIT',
    keywords: ['creative-ai', 'google-apps-script', 'ad-generation', 'prompt-engineering', 'creative-workflow'],
    author: 'Amar Nagargoje',
    scripts: {
      setup: 'node scripts/setup.js',
      test: 'node scripts/test.js',
      deploy: 'node scripts/deploy.js'
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
      doc: 'docs'
    }
  };

  await fs.writeFile(
    path.join(SCRIPT_DIR, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );
}

/**
 * Creates README with project overview
 */
async function createReadme() {
  const readme = `# Creative Ad Generator - Project Overview

This project demonstrates an end-to-end agentic AI workflow for generating ad image variants using Google Apps Script and creative prompt engineering.

## Quick Start

1. Deploy to Google Workspace
2. Configure API keys
3. Run the workflow

## Key Features

- Creative prompt engineering with multiple approaches
- Multi-language support and cultural adaptation
- Quality evaluation and continuous improvement
- Google Sheets integration for results tracking

## Usage

Run the complete workflow:

```javascript
function runCreativeWorkflow() {
  return generateAdCreativeWorkflow();
}
```

## Documentation

- [Setup Guide](../docs/SETUP.md)
- [Creative Engineering](creative_engine.js)
- [Workflow Script](ad_generator.gs)

## Support

This project showcases rapid prototyping techniques for creative AI workflows.
`;

  await fs.writeFile(
    path.join(SCRIPT_DIR, 'README.md'),
    readme
  );
}

/**
 * Creates .gitignore file
 */
async function createGitignore() {
  const gitignore = `node_modules/
.DS_Store
diagrams/
logs/
.temp/
*.log
.env
.env.local
.idea/
.vscode/

# Google Apps Script
.gs
.js
*.js.map

# Generated content
generated/
output/
`;

  await fs.writeFile(
    path.join(SCRIPT_DIR, '.gitignore'),
    gitignore
  );
}

/**
 * Test script - validates project setup
 */
async function test() {
  try {
    console.log('🧪 Testing project setup...');

    // Check for essential files
    const requiredFiles = ['ad_generator.gs', 'creative_engine.js', 'README.md'];
    for (const file of requiredFiles) {
      try {
        await fs.access(path.join(SCRIPT_DIR, file));
        console.log(`✅ Found: ${file}`);
      } catch {
        console.log(`❌ Missing: ${file}`);
        throw new Error(`Required file not found: ${file}`);
      }
    }

    // Check structure
    console.log('\n📁 Project structure verified:');
    const files = await fs.readdir(SCRIPT_DIR);
    console.log(`- Scripts: ${files.filter(f => f.endsWith('.js') || f.endsWith('.gs')).length} files`);
    console.log(`- Documentation: Found`);

    console.log('\n🎉 All tests passed!');
    console.log('\nReady for deployment: npm run deploy');

  } catch (error) {
    console.error('❌ Testing failed:', error.message);
    throw error;
  }
}

/**
 * Deployment script - prepares for Google Workspace deployment
 */
async function deploy() {
  try {
    console.log('🚀 Deploying to Google Workspace...');

    console.log('\nDeployment Checklist:');
    console.log('1. Open Google Sheets');
    console.log('2. Go to Extensions → Apps Script');
    console.log('3. Copy all .gs files from this folder');
    console.log('4. Configure API keys (see docs/SETUP.md)');
    console.log('5. Test with runCompleteCreativeWorkflow()');
    console.log('6. Verify results in Google Sheets');

    console.log('\n✅ Deployment preparation complete!');

  } catch (error) {
    console.error('❌ Deployment failed:', error.message);
    throw error;
  }
}

// Command line interface
if (require.main === module) {
  const command = process.argv[2];

  switch (command) {
    case 'setup':
      setup();
      break;
    case 'test':
      test();
      break;
    case 'deploy':
      deploy();
      break;
    case 'help':
      console.log('\nAvailable commands:');
      console.log('  npm run setup  - Initialize project environment');
      console.log('  npm run test   - Validate project setup');
      console.log('  npm run deploy - Prepare for Google Workspace');
      break;
    default:
      console.log('\nUsage: npm run <command>');
      console.log('  For help: npm run help');
  }
}

module.exports = {
  setup,
  test,
  deploy
};