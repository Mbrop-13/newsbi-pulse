import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";

// Singleton SES client — reuses across Lambda/Edge invocations
const sesClient = new SESClient({
  region: process.env.AWS_REGION || "us-east-1",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  replyTo?: string;
  from?: string;
}

/**
 * Send an email via Amazon SES.
 * 
 * @returns MessageId on success, null on failure
 */
export async function sendEmail({
  to,
  subject,
  html,
  replyTo,
  from,
}: SendEmailParams): Promise<string | null> {
  const fromAddress = from || `${process.env.SES_FROM_NAME || "Reclu"} <${process.env.SES_FROM_EMAIL || "alertas@reclu.cl"}>`;
  const toAddresses = Array.isArray(to) ? to : [to];

  try {
    const command = new SendEmailCommand({
      Source: fromAddress,
      Destination: {
        ToAddresses: toAddresses,
      },
      Message: {
        Subject: {
          Charset: "UTF-8",
          Data: subject,
        },
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: html,
          },
        },
      },
      ...(replyTo ? { ReplyToAddresses: [replyTo] } : {}),
    });

    const result = await sesClient.send(command);
    console.log(`[SES] Email sent to ${toAddresses.join(", ")} | MessageId: ${result.MessageId}`);
    return result.MessageId || null;
  } catch (error: any) {
    console.error(`[SES] Failed to send email to ${toAddresses.join(", ")}:`, error.message);
    
    // Specific SES error handling
    if (error.name === "MessageRejected") {
      console.error("[SES] Email rejected — verify sender identity and SES sandbox status");
    } else if (error.name === "MailFromDomainNotVerified") {
      console.error("[SES] Domain not verified — complete SES domain verification");
    }
    
    return null;
  }
}
