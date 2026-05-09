import { EmailClient, EmailMessage } from "@azure/communication-email";

// Singleton EmailClient — reuses across Lambda/Edge invocations
const connectionString = process.env.AZURE_COMMUNICATION_CONNECTION_STRING;

let emailClient: EmailClient | null = null;
if (connectionString) {
  try {
    emailClient = new EmailClient(connectionString);
  } catch (error) {
    console.error("[Azure Email] Failed to initialize EmailClient:", error);
  }
} else {
  console.warn("[Azure Email] AZURE_COMMUNICATION_CONNECTION_STRING is not defined.");
}

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  from?: string;
}

/**
 * Send an email via Azure Communication Services.
 * 
 * @returns messageId on success, null on failure
 */
export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
  from,
}: SendEmailParams): Promise<string | null> {
  if (!emailClient) {
    console.error("[Azure Email] Client not initialized. Cannot send email.");
    return null;
  }

  // Use the provided from address or fallback to the environment variable.
  // Azure requires this to be an exact match with the verified domain.
  const senderAddress = from || process.env.AZURE_SENDER_ADDRESS || "DoNotReply@reclu.cl";
  const toAddresses = Array.isArray(to) ? to : [to];

  try {
    const message: EmailMessage = {
      senderAddress: senderAddress,
      content: {
        subject: subject,
        html: html,
      },
      recipients: {
        to: toAddresses.map((email) => ({ address: email })),
      },
      ...(replyTo ? { replyTo: [{ address: replyTo }] } : {}),
    };

    const poller = await emailClient.beginSend(message);
    const result = await poller.pollUntilDone();

    if (result.status === "Succeeded") {
      console.log(`[Azure Email] Email sent to ${toAddresses.join(", ")} | MessageId: ${result.id}`);
      return result.id || "success";
    } else {
      console.error(`[Azure Email] Failed to send email. Status: ${result.status}`, result.error);
      return null;
    }
  } catch (error: any) {
    console.error(`[Azure Email] Unexpected error sending email to ${toAddresses.join(", ")}:`, error.message);
    return null;
  }
}
