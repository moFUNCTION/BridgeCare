import { ID, Permission, Role, type Models } from "appwrite";
import { account, functions, databases } from "../lib/appwrite";

export interface SendOtpResult {
  success: boolean;
  message?: string;
  userId?: string;
  debugOtp?: string;
}

export interface VerifyOtpResult {
  success: boolean;
  message?: string;
  verified?: boolean;
}

/**
 * Send an OTP verification email to the user.
 * Tries the Appwrite Cloud Function `send-email-otp` first,
 * falling back gracefully to Appwrite's built-in `createEmailToken` or `createVerification`.
 */
export async function sendEmailOtp(email: string, userId?: string): Promise<SendOtpResult> {
  const targetUserId = userId || ID.unique();

  // Try Appwrite Cloud Function: send-email-otp
  try {
    const execution = await functions.createExecution(
      "send-email-otp",
      JSON.stringify({ action: "send", email, userId: targetUserId }),
      false // async: false
    );

    if (execution.status === "completed" && execution.responseBody) {
      const response = JSON.parse(execution.responseBody);
      if (response.success) {
        return {
          success: true,
          message: response.message,
          userId: targetUserId,
          debugOtp: response.debugOtp,
        };
      }
    }
  } catch (fnErr) {
    console.warn("Cloud function send-email-otp fallback:", fnErr);
  }

  // Built-in Appwrite fallback: createEmailToken sends 6-digit OTP to the email
  try {
    const token = await account.createEmailToken(targetUserId, email);
    return {
      success: true,
      message: "Verification code sent to your email",
      userId: token.userId,
    };
  } catch (sdkErr: any) {
    // If user is already authenticated, fallback to createVerification link
    try {
      const redirectUrl = `${window.location.origin}/auth/verify-email`;
      await account.createVerification(redirectUrl);
      return {
        success: true,
        message: "Verification link sent to your email",
        userId: targetUserId,
      };
    } catch (verErr: any) {
      throw new Error(sdkErr?.message || verErr?.message || "Failed to send verification email");
    }
  }
}

/**
 * Verify submitted OTP code against:
 * 1. Appwrite Cloud Function `send-email-otp` with action: 'verify'
 * 2. Or Appwrite `createSession` with OTP token
 */
export async function verifyEmailOtp(userId: string, otp: string): Promise<VerifyOtpResult> {
  // 1. Try Cloud Function send-email-otp with action: 'verify'
  let executionResult: any = null;
  let executionFailedToRun = false;

  try {
    const execution = await functions.createExecution(
      "send-email-otp",
      JSON.stringify({ action: "verify", userId, otp }),
      false
    );

    if (execution.status === "completed" && execution.responseBody) {
      executionResult = JSON.parse(execution.responseBody);
    } else if (execution.status === "failed") {
      throw new Error(execution.errors || "Verification process failed");
    }
  } catch (fnErr: any) {
    if (fnErr.message && !fnErr.message.includes("not found")) {
      throw fnErr;
    }
    executionFailedToRun = true;
  }

  // Handle function response directly
  if (executionResult) {
    if (executionResult.success) {
      return {
        success: true,
        message: executionResult.message,
        verified: true,
      };
    }
    if (executionResult.error) {
      throw new Error(executionResult.error);
    }
  }

  // 2. Built-in Appwrite fallback: only if function wasn't available
  if (executionFailedToRun) {
    try {
      await account.createSession(userId, otp);
      return {
        success: true,
        message: "Email verified successfully!",
        verified: true,
      };
    } catch (err: any) {
      if (err?.message?.includes("session is active")) {
        throw new Error("Invalid verification code. Please check your code or request a new one.");
      }
      throw new Error(err?.message || "Invalid or expired verification code");
    }
  }

  throw new Error("Invalid or expired verification code");
}

/**
 * Send password reset recovery link
 */
export async function sendPasswordRecovery(email: string): Promise<Models.Token> {
  const resetUrl = `${window.location.origin}/auth/forget-password`;
  return await account.createRecovery(email, resetUrl);
}

/**
 * Complete password reset with userId and secret from email link
 */
export async function completePasswordReset(
  userId: string,
  secret: string,
  newPassword: string
): Promise<Models.Token> {
  return await account.updateRecovery(userId, secret, newPassword);
}

/**
 * Update user preferences with extra attributes
 */
export async function saveUserExtraProfile(data: {
  phone?: string;
  age?: number | string;
  country?: string;
  countryName?: string;
}): Promise<Models.User<Models.Preferences>> {
  const current = (await account.getPrefs()) || {};
  return await account.updatePrefs({
    ...current,
    ...data,
  });
}

/**
 * Register patient via cloud function:
 * 1. Executes register-patient cloud function
 * 2. Assigns role 'patient'
 * 3. Saves document into collection 'USERS' with initialized user permissions
 * 4. Falls back to client-side creation if function unavailable
 */
export async function registerPatient(data: {
  email: string;
  password: string;
  userName: string;
  phoneNumber?: string;
  age?: number | string;
  country?: string;
  userId?: string;
}): Promise<{ success: boolean; userId: string; user?: any; document?: any }> {
  const targetUserId = data.userId || ID.unique();

  // 1. Try Cloud Function first
  try {
    const execution = await functions.createExecution(
      "register-patient",
      JSON.stringify({
        ...data,
        userId: targetUserId,
      }),
      false
    );

    if (execution.status === "completed" && execution.responseBody) {
      const result = JSON.parse(execution.responseBody);
      if (result.success) {
        // Also log in to establish client session
        await account.createEmailPasswordSession(data.email, data.password);
        return result;
      } else if (result.error) {
        throw new Error(result.error);
      }
    }
  } catch (fnErr: any) {
    if (fnErr.message && !fnErr.message.includes("not found")) {
      console.warn("register-patient cloud function fallback:", fnErr);
    }
  }

  // 2. Client-side fallback: create user, session, update preferences and store in USERS
  const newAuthUser = await account.create(
    targetUserId,
    data.email,
    data.password,
    data.userName
  );

  await account.createEmailPasswordSession(data.email, data.password);

  await account.updatePrefs({
    role: "patient",
    userName: data.userName,
    phone: data.phoneNumber,
    age: data.age ? Number(data.age) : null,
    country: data.country,
  });

  let doc = null;
  try {
    doc = await databases.createDocument(
      "main",
      "USERS",
      targetUserId,
      {
        userId: targetUserId,
        userName: data.userName,
        email: data.email,
        phoneNumber: data.phoneNumber || null,
        age: data.age ? Number(data.age) : null,
        country: data.country || null,
        role: "patient",
      },
      [
        Permission.read(Role.user(targetUserId)),
        Permission.update(Role.user(targetUserId)),
        Permission.delete(Role.user(targetUserId)),
        Permission.read(Role.team("patients")),
        Permission.read(Role.users()),
      ]
    );
  } catch (docErr) {
    console.warn("Direct USERS document creation note:", docErr);
  }

  return {
    success: true,
    userId: targetUserId,
    user: newAuthUser,
    document: doc,
  };
}

