import * as dotenv from 'dotenv';
import { resolve } from 'path';

// Load the local environment variables manually BEFORE any imports
dotenv.config({ path: resolve(process.cwd(), '.env.local') });

async function testAzureEmail() {
  // Dynamically import to ensure env vars are loaded first
  const { sendEmail } = await import("./src/lib/email/azure-client");
  
  console.log("Testing Azure Email Service...");
  console.log("Sender:", process.env.AZURE_SENDER_ADDRESS);
  
  const result = await sendEmail({
    to: "manuelbustosv@gmail.com", // Change to user email or test
    subject: "Test from Newsbi Pulse Local via Azure",
    html: "<h1>Hello!</h1><p>This is a test email sent using Azure Communication Services.</p>"
  });
  
  if (result) {
    console.log("✅ Success! Message ID:", result);
  } else {
    console.log("❌ Failed to send email.");
  }
}

testAzureEmail();
