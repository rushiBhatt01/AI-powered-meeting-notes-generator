#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env.local');

try {
  const mode = 'serverless';
  const envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';

  const updatedEnv = envContent.includes('NEXT_PUBLIC_API_MODE=')
    ? envContent.replace(/NEXT_PUBLIC_API_MODE=.*/g, `NEXT_PUBLIC_API_MODE=${mode}`)
    : `${envContent}${envContent.endsWith('\n') || envContent.length === 0 ? '' : '\n'}NEXT_PUBLIC_API_MODE=${mode}\n`;

  fs.writeFileSync(envPath, updatedEnv);

  console.log('============================================');
  console.log('   Backend Mode Switcher');
  console.log('============================================\n');
  console.log('✅ Forced SERVERLESS mode (Vercel API Routes).');
  console.log('Local FastAPI mode is disabled for this project setup.');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
