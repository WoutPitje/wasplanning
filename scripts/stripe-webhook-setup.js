#!/usr/bin/env node

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const readline = require('readline');

// Colors for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  red: '\x1b[31m',
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function updateEnvFile(envPath, webhookSecret) {
  try {
    let envContent = '';
    
    if (fs.existsSync(envPath)) {
      envContent = fs.readFileSync(envPath, 'utf8');
    }

    // Check if STRIPE_WEBHOOK_SECRET exists and update it
    if (envContent.includes('STRIPE_WEBHOOK_SECRET=')) {
      envContent = envContent.replace(
        /STRIPE_WEBHOOK_SECRET=.*/,
        `STRIPE_WEBHOOK_SECRET=${webhookSecret}`
      );
      log(`✓ Updated webhook secret in ${envPath}`, colors.green);
    } else {
      // Add it if it doesn't exist
      envContent += `\n# Stripe Webhook Secret (auto-updated)\nSTRIPE_WEBHOOK_SECRET=${webhookSecret}\n`;
      log(`✓ Added webhook secret to ${envPath}`, colors.green);
    }

    fs.writeFileSync(envPath, envContent);
    return true;
  } catch (error) {
    log(`✗ Failed to update ${envPath}: ${error.message}`, colors.red);
    return false;
  }
}

function startStripeWebhookForwarding() {
  return new Promise((resolve, reject) => {
    log('\n🚀 Starting Stripe webhook forwarding...', colors.blue);
    
    const stripeProcess = spawn('stripe', [
      'listen',
      '--forward-to',
      'localhost:3001/webhooks/stripe'
    ], {
      stdio: ['inherit', 'pipe', 'pipe'],
      shell: true
    });

    let secretCaptured = false;
    let output = '';

    // Function to process output lines
    const processLine = (line) => {
      console.log(line); // Show all output
      output += line + '\n';

      // Look for the webhook secret in the output
      const secretMatch = line.match(/Your webhook signing secret is (\w+)/);
      if (secretMatch && !secretCaptured) {
        secretCaptured = true;
        const webhookSecret = secretMatch[1];
        
        log(`\n📝 Captured webhook secret: ${webhookSecret}`, colors.green);
        
        // Update backend .env file
        const backendEnvPath = path.join(__dirname, '../backend/.env');
        const updated = updateEnvFile(backendEnvPath, webhookSecret);
        
        if (updated) {
          log('\n✅ Webhook secret updated successfully!', colors.green);
          log('🔄 Backend will reload automatically to use the new secret\n', colors.yellow);
        }
        
        resolve({ process: stripeProcess, secret: webhookSecret });
      }
    };

    // Create readline interfaces for both stdout and stderr
    const rlOut = readline.createInterface({
      input: stripeProcess.stdout,
      terminal: false
    });

    const rlErr = readline.createInterface({
      input: stripeProcess.stderr,
      terminal: false
    });

    rlOut.on('line', processLine);
    rlErr.on('line', processLine);

    stripeProcess.on('error', (error) => {
      log(`Failed to start Stripe CLI: ${error.message}`, colors.red);
      reject(error);
    });

    // If no secret is captured within 10 seconds, something might be wrong
    setTimeout(() => {
      if (!secretCaptured) {
        log('\n⚠️  No webhook secret captured after 10 seconds', colors.yellow);
        log('The Stripe CLI might already be running or there might be an issue.', colors.yellow);
        log('Continuing anyway...', colors.yellow);
        resolve({ process: stripeProcess, secret: null });
      }
    }, 10000);
  });
}

// Handle process termination
process.on('SIGINT', () => {
  log('\n\n👋 Stopping Stripe webhook forwarding...', colors.yellow);
  process.exit(0);
});

// Main execution
async function main() {
  try {
    log('🎯 Stripe Webhook Auto-Setup', colors.bright);
    log('============================\n', colors.bright);
    
    const result = await startStripeWebhookForwarding();
    
    if (!result.secret) {
      log('\n⚠️  Running without automatic webhook secret update', colors.yellow);
      log('You may need to manually update the webhook secret in your .env file', colors.yellow);
    }
    
    // Keep the process running
    process.stdin.resume();
  } catch (error) {
    log(`\n❌ Error: ${error.message}`, colors.red);
    process.exit(1);
  }
}

main();