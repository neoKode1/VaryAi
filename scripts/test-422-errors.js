#!/usr/bin/env node

/**
 * Test script to reproduce and debug 422 validation errors
 * This helps identify the exact causes of fal.ai validation failures
 */

const { createClient } = require('@fal-ai/client');
require('dotenv').config();

// Configure FAL client
const falKey = process.env.FAL_KEY || process.env.FAL_AI_KEY;
if (falKey) {
  fal.config({ credentials: falKey });
  console.log('✅ FAL AI configured');
} else {
  console.error('❌ No FAL_KEY found in environment variables');
  process.exit(1);
}

// Test cases that commonly cause 422 errors
const testCases = [
  {
    name: 'Long Prompt (422 Error)',
    prompt: 'The character is in a fog-filled nightclub only illuminated by elaborate multicolored disco lights and psychedelic laser display. The nightclub is on a luxury space station in orbit above São Paulo, creating a surreal cosmic dance environment with floating holographic elements and zero-gravity effects.',
    expectedError: 'Prompt too long (>200 chars)'
  },
  {
    name: 'Valid Short Prompt',
    prompt: 'Character in a nightclub with disco lights',
    expectedError: null
  },
  {
    name: 'Empty Image URLs',
    prompt: 'Character in nightclub',
    imageUrls: [],
    expectedError: 'No images provided'
  },
  {
    name: 'Invalid Image URL',
    prompt: 'Character in nightclub',
    imageUrls: ['https://invalid-url.com/image.jpg'],
    expectedError: 'Invalid image URL'
  }
];

async function testPromptLength(prompt) {
  console.log(`\n🧪 Testing prompt length: ${prompt.length} characters`);
  console.log(`📝 Prompt: "${prompt}"`);
  
  try {
    const result = await fal.subscribe('fal-ai/nano-banana/edit', {
      input: {
        prompt: prompt,
        image_urls: ['https://v3.fal.media/files/elephant/image.jpg'], // Placeholder
        num_images: 1,
        output_format: 'jpeg',
        sync_mode: false
      },
      logs: true
    });
    
    console.log('✅ Success - no validation error');
    return { success: true, result };
  } catch (error) {
    console.log('❌ Error:', error.message);
    
    if (error.message.includes('422') || error.message.includes('validation')) {
      console.log('🚨 422 Validation Error detected!');
      return { success: false, error: error.message, is422: true };
    }
    
    return { success: false, error: error.message, is422: false };
  }
}

async function testImageValidation(imageUrls) {
  console.log(`\n🧪 Testing image URLs: ${imageUrls.length} images`);
  
  try {
    const result = await fal.subscribe('fal-ai/nano-banana/edit', {
      input: {
        prompt: 'Character in nightclub',
        image_urls: imageUrls,
        num_images: 1,
        output_format: 'jpeg',
        sync_mode: false
      },
      logs: true
    });
    
    console.log('✅ Success - images validated');
    return { success: true, result };
  } catch (error) {
    console.log('❌ Error:', error.message);
    
    if (error.message.includes('422') || error.message.includes('validation')) {
      console.log('🚨 422 Validation Error detected!');
      return { success: false, error: error.message, is422: true };
    }
    
    return { success: false, error: error.message, is422: false };
  }
}

async function runTests() {
  console.log('🚀 Starting 422 Error Reproduction Tests\n');
  
  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;
  let validationErrors = 0;
  
  for (const testCase of testCases) {
    console.log(`\n📋 Test Case: ${testCase.name}`);
    totalTests++;
    
    let result;
    
    if (testCase.imageUrls !== undefined) {
      result = await testImageValidation(testCase.imageUrls);
    } else {
      result = await testPromptLength(testCase.prompt);
    }
    
    if (result.is422) {
      validationErrors++;
      if (testCase.expectedError) {
        console.log('✅ Expected 422 error occurred');
        passedTests++;
      } else {
        console.log('❌ Unexpected 422 error');
        failedTests++;
      }
    } else if (result.success) {
      if (!testCase.expectedError) {
        console.log('✅ No error as expected');
        passedTests++;
      } else {
        console.log('❌ Expected error but got success');
        failedTests++;
      }
    } else {
      console.log('❌ Unexpected error type');
      failedTests++;
    }
    
    // Add delay between tests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  console.log('\n📊 Test Results Summary:');
  console.log(`Total Tests: ${totalTests}`);
  console.log(`Passed: ${passedTests}`);
  console.log(`Failed: ${failedTests}`);
  console.log(`422 Validation Errors: ${validationErrors}`);
  
  if (validationErrors > 0) {
    console.log('\n🔍 422 Error Analysis:');
    console.log('- Most common cause: Prompts over 200 characters');
    console.log('- Secondary causes: Invalid image URLs, malformed requests');
    console.log('- Solution: Implement prompt truncation and validation');
  }
}

// Run the tests
runTests().catch(console.error);
