#!/usr/bin/env node
"""Test script for validating the creative ad generation project setup

This script validates the project configuration and critical components
to ensure they meet requirements for deployment and execution.
"""

const fs = require('fs').promises;
const path = require('path');

const PROJECT_ROOT = __dirname + '/..';

/**
 * Main test function
 */
async function test() {
  try {
    console.log('🧪 Testing Creative Ad Generator project...\n');

    // Test 1: Validate file structure
    await testFileStructure();

    // Test 2: Validate Google Apps Script syntax (basic checks)
    await testGoogleAppsScript();

    // Test 3: Validate JavaScript modules
    await testJavaScriptModules();

    // Test 4: Validate configuration files
    await testConfigurationFiles();

    // Test 5: Validate documentation
    await testDocumentation();

    console.log('\n✅ All tests passed successfully!');
    console.log('\n🚀 Project ready for deployment to Google Workspace');
    console.log('Run: npm run deploy');

  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    process.exit(1);
  }
}

/**
 * Test the overall file structure
 */
async function testFileStructure() {
  console.log('📁 Testing file structure...');

  const requiredFiles = [
    { path: 'ad_generator.gs', category: 'Core workflow' },
    { path: 'creative_engine.js', category: 'Creative engine' },
    { path: 'package.json', category: 'Configuration' },
    { path: 'README.md', category: 'Documentation' }
  ];

  for (const file of requiredFiles) {
    const filePath = path.join(PROJECT_ROOT, file.path);
    try {
      await fs.access(filePath);
      console.log(`  ✅ ${file.path} (${file.category})`);
    } catch {
      console.log(`  ❌ ${file.path} (${file.category}) - MISSING`);
      throw new Error(`Required file missing: ${file.path}`);
    }
  }

  // Check for critical directories
  const criticalDirs = ['docs', 'scripts', 'assets'];
  for (const dir of criticalDirs) {
    const dirPath = path.join(PROJECT_ROOT, dir);
    try {
      await fs.access(dirPath);
      console.log(`  ✅ Directory ${dir} exists`);
    } catch {
      console.log(`  ❌ Directory ${dir} missing");
      throw new Error(`Required directory missing: ${dir}`);
    }
  }
}

/**
 * Validate Google Apps Script basic structure
 */
async function testGoogleAppsScript() {
  console.log('\n📝 Testing Google Apps Script structure...');

  const scriptPath = path.join(PROJECT_ROOT, 'ad_generator.gs');
  const content = await fs.readFile(scriptPath, 'utf8');

  // Basic validation checks
  const checks = [
    { pattern: /function generateAdCreativeWorkflow/, name: 'Main workflow function' },
    { pattern: /const CONFIG =/, name: 'Configuration object' },
    { pattern: /Logger\.log/, name: 'Logging function' },
    { pattern: /function createCreativePromptStrategy/, name: 'Prompt strategy function' },
    { pattern: /function generateAdVariants/, name: 'Variant generation function' },
    { pattern: /exportCreativeResults/, name: 'Results export function' }
  ];

  for (const check of checks) {
    if (content.includes(check.pattern)) {
      console.log(`  ✅ Contains: ${check.name}`);
    } else {
      console.log(`  ❌ Missing: ${check.name}`);
      throw new Error(`Google Apps Script missing required function: ${check.name}`);
    }
  }

  // Check for key creative features
  const creativeFeatures = [
    { pattern: /Creative Prompt Engineer/, name: 'Creative prompt engineering' },
    { pattern: /Chain-of-Thought/, name: 'Chain-of-thought reasoning' },
    { pattern: /Constraint-Driven/, name: 'Constraint-driven creativity' },
    { pattern: /Persona-Based/, name: 'Persona-based design' }
  ];

  for (const feature of creativeFeatures) {
    if (content.includes(feature.pattern)) {
      console.log(`  ✅ Creative feature: ${feature.name}`);
    } else {
      console.log(`  ❌ Creative feature missing: ${feature.name}`);
    }
  }
}

/**
 * Validate JavaScript modules
 */
async function testJavaScriptModules() {
  console.log('\n🔧 Testing JavaScript modules...');

  const jsPath = path.join(PROJECT_ROOT, 'creative_engine.js');
  const content = await fs.readFile(jsPath, 'utf8');

  // Basic validation checks
  const checks = [
    { pattern: /const CreativeConfig =/, name: 'Configuration object' },
    { pattern: /class CreativePromptEngineer/, name: 'Prompt engineer class' },
    { pattern: /CreativeApproaches =/, name: 'Creative approaches' },
    { pattern: /function generatePersonaPrompt/, name: 'Persona prompt function' },
    { pattern: /function generateConstraintPrompt/, name: 'Constraint prompt function' },
    { pattern: /function evaluateCreativeQuality/, name: 'Quality evaluation function' }
  ];

  for (const check of checks) {
    if (content.includes(check.pattern)) {
      console.log(`  ✅ Contains: ${check.name}`);
    } else {
      console.log(`  ❌ Missing: ${check.name}`);
      throw new Error(`JavaScript module missing function: ${check.name}`);
    }
  }
}

/**
 * Test configuration files
 */
async function testConfigurationFiles() {
  console.log('\n⚙️ Testing configuration files...');

  // Test package.json
  const packagePath = path.join(PROJECT_ROOT, 'package.json');
  const packageContent = await fs.readFile(packagePath, 'utf8');
  const packageJson = JSON.parse(packageContent);

  const requiredPackage = [
    { key: 'name', expected: 'monks-creative-ad-generator' },
    { key: 'version', expected: '1.0.0' },
    { key: 'main', expected: 'ad_generator.gs' }
  ];

  for (const req of requiredPackage) {
    if (packageJson[req.key] === req.expected) {
      console.log(`  ✅ package.json ${req.key} = ${req.expected}`);
    } else {
      console.log(`  ❌ package.json ${req.key} incorrect: expected ${req.expected}, got ${packageJson[req.key]}`);
      throw new Error(`package.json configuration error: ${req.key}`);
    }
  }

  // Check scripts
  const requiredScripts = ['setup', 'test', 'deploy'];
  for (const script of requiredScripts) {
    if (packageJson.scripts && packageJson.scripts[script]) {
      console.log(`  ✅ Script available: ${script}`);
    } else {
      console.log(`  ❌ Missing script: ${script}`);
      throw new Error(`package.json missing script: ${script}`);
    }
  }
}

/**
 * Test documentation
 */
async function testDocumentation() {
  console.log('\n📚 Testing documentation...');

  const docsDir = path.join(PROJECT_ROOT, 'docs');

  try {
    const files = await fs.readdir(docsDir);
    console.log(`  ✅ Found ${files.length} documentation files`);

    const requiredDocs = ['SETUP.md'];
    for (const doc of requiredDocs) {
      const docPath = path.join(docsDir, doc);
      try {
        await fs.access(docPath);
        console.log(`  ✅ Documentation: ${doc}`);
      } catch {
        console.log(`  ❌ Documentation: ${doc} missing");
        throw new Error(`Required documentation missing: ${doc}`);
      }
    }
  } catch {
    console.log(`  ❌ Documentation directory missing");
    throw new Error(`Documentation directory not found`);
  }
}

// Run tests if called directly
if (require.main === module) {
  test();
}

module.exports = { test };