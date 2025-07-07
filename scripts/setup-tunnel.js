#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

// Function to update .env file
function updateEnvFile(tunnelUrl) {
  const envPath = path.join(__dirname, '../backend/.env');
  
  if (!fs.existsSync(envPath)) {
    console.error('❌ Backend .env file not found. Please create it from .env.example');
    return false;
  }
  
  let envContent = fs.readFileSync(envPath, 'utf8');
  
  // Update or add MOLLIE_WEBHOOK_URL
  const webhookUrl = `${tunnelUrl}/payments/webhook/mollie`;
  
  if (envContent.includes('MOLLIE_WEBHOOK_URL=')) {
    envContent = envContent.replace(
      /MOLLIE_WEBHOOK_URL=.*/,
      `MOLLIE_WEBHOOK_URL=${webhookUrl}`
    );
  } else {
    envContent += `\n# Automatically added by tunnel script\nMOLLIE_WEBHOOK_URL=${webhookUrl}\n`;
  }
  
  fs.writeFileSync(envPath, envContent);
  console.log(`✅ Updated MOLLIE_WEBHOOK_URL to: ${webhookUrl}`);
  return true;
}

// Start localtunnel
console.log('🚇 Starting localtunnel for Mollie webhooks...');

const tunnel = spawn('npx', ['localtunnel', '--port', '3001', '--subdomain', 'wasplanning-webhook'], {
  stdio: ['inherit', 'pipe', 'inherit']
});

let output = '';

tunnel.stdout.on('data', (data) => {
  const message = data.toString();
  output += message;
  
  // Look for the tunnel URL in the output
  const urlMatch = message.match(/https:\/\/[^\s]+/);
  if (urlMatch) {
    const tunnelUrl = urlMatch[0];
    console.log(`\n🌐 Tunnel URL: ${tunnelUrl}`);
    
    if (updateEnvFile(tunnelUrl)) {
      console.log('\n📌 IMPORTANT: Restart your backend to use the new webhook URL');
      console.log('   Run: npm run backend:dev\n');
    }
  }
  
  // Print the output
  process.stdout.write(message);
});

tunnel.on('close', (code) => {
  console.log(`\n🛑 Tunnel closed with code ${code}`);
  process.exit(code);
});

// Handle Ctrl+C
process.on('SIGINT', () => {
  console.log('\n🛑 Stopping tunnel...');
  tunnel.kill();
  process.exit(0);
});