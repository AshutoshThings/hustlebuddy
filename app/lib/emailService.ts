// Names are user-supplied; escape them so they can't inject HTML (links,
// fake buttons) into emails sent from our domain.
function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (c) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        c
      ]!,
  );
}

async function sendEmail(
  email: string,
  name: string,
  subject: string,
  html: string,
) {
  const response = await fetch("https://api.mailjet.com/v3.1/send", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization:
        "Basic " +
        Buffer.from(
          `${process.env.MAILJET_API_KEY}:${process.env.MAILJET_SECRET_KEY}`,
        ).toString("base64"),
    },
    body: JSON.stringify({
      Messages: [
        {
          From: {
            Email:
              process.env.MAILJET_SENDER_EMAIL ||
              "founder@hustlebuddy.secondlayer.in",
            Name: "HustleBuddy",
          },
          To: [
            {
              Email: email,
              Name: name,
            },
          ],
          Subject: subject,
          HTMLPart: html,
        },
      ],
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error("Mailjet error:", error);
    throw new Error("Failed to send email");
  }

  return response.json();
}

export async function sendVerificationEmail(
  email: string,
  name: string,
  otp: string,
) {
  try {
    await sendEmail(
      email,
      name,
      "Verify your HustleBuddy Account",
      `
        <div style="font-family: sans-serif; text-align: center;">
          <h2>Welcome to HustleBuddy, ${escapeHtml(name)}!</h2>

          <p>Your verification code is:</p>

          <h1 style="
            letter-spacing: 5px;
            color: #000;
            background: #f4f4f4;
            padding: 12px;
            border-radius: 8px;
            display: inline-block;
          ">
            ${otp}
          </h1>

          <p>This code expires in 10 minutes.</p>
        </div>
      `,
    );
  } catch (error) {
    console.error("Mailjet Verification Email Error:", error);
    throw error;
  }
}

export async function sendPasswordResetEmail(
  email: string,
  name: string,
  otp: string,
) {
  try {
    await sendEmail(
      email,
      name,
      "Password Reset Code - HustleBuddy",
      `
        <div style="font-family: sans-serif; text-align: center;">
          <h2>Password Reset Request</h2>

          <p>
            Hi ${escapeHtml(name)}, use the verification code below
            to reset your password:
          </p>

          <h1 style="
            letter-spacing: 5px;
            color: #000;
            background: #f4f4f4;
            padding: 12px;
            border-radius: 8px;
            display: inline-block;
          ">
            ${otp}
          </h1>

          <p>
            This code expires in 10 minutes.
            If you didn't request this, please ignore this email.
          </p>
        </div>
      `,
    );
  } catch (error) {
    console.error("Mailjet Password Reset Email Error:", error);
    throw error;
  }
}
