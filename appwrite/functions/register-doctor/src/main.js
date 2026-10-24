import { Client, Users, Teams, Databases, Permission, Role, ID } from "node-appwrite";

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || "main";
const THERAPISTS_COLLECTION_ID = process.env.THERAPISTS_COLLECTION_ID || "THERAPISTS";
const USERS_COLLECTION_ID = process.env.USERS_COLLECTION_ID || "USERS";
const THERAPISTS_TEAM_ID = process.env.THERAPISTS_TEAM_ID || "therapists";

/**
 * Appwrite Cloud Function: register-doctor
 * 1. Creates/verifies Appwrite auth user
 * 2. Assigns 'therapist' role in 'therapists' team and user labels
 * 3. Stores user profile in database collection 'USERS'
 * 4. Creates directory profile in 'THERAPISTS' with public read permissions
 */
export default async ({ req, res, log, error }) => {
  try {
    const endpoint =
      process.env.APPWRITE_FUNCTION_API_ENDPOINT ||
      process.env.APPWRITE_ENDPOINT ||
      "https://fra.cloud.appwrite.io/v1";

    const projectId =
      process.env.APPWRITE_FUNCTION_PROJECT_ID ||
      process.env.APPWRITE_PROJECT_ID ||
      "6adaf3cd000458c04102";

    const apiKey =
      req.headers?.["x-appwrite-key"] ||
      process.env.APPWRITE_API_KEY ||
      process.env.APPWRITE_FUNCTION_KEY;

    const client = new Client().setEndpoint(endpoint).setProject(projectId);
    if (apiKey) client.setKey(apiKey);

    const users = new Users(client);
    const teams = new Teams(client);
    const databases = new Databases(client);

    let body = {};
    if (typeof req.body === "string" && req.body.trim()) {
      try {
        body = JSON.parse(req.body);
      } catch (e) {
        body = {};
      }
    } else if (typeof req.body === "object" && req.body !== null) {
      body = req.body;
    }

    const email = (body.email || "").trim().toLowerCase();
    const password = body.password || "";
    const fullName = (body.fullName || body.name || "").trim();
    const title = (body.title || "Licensed Clinical Therapist").trim();
    const licenseNumber = (body.licenseNumber || "MD-PENDING").trim();
    const specialties = Array.isArray(body.specialties) ? body.specialties : ["ADHD", "Anxiety"];
    const sessionFee = Number(body.sessionFee || 120);
    const currency = body.currency || "USD";
    const bio = body.bio || "Specialist in trauma recovery and cognitive behavioral therapy.";

    if (!email) {
      return res.json({ error: "Email is required" }, 400);
    }

    // 1. Create or retrieve auth user
    let user;
    try {
      user = await users.create(ID.unique(), email, undefined, password || ID.unique(), fullName || undefined);
    } catch (err) {
      if (err.code === 409 || err.message?.includes("already exists")) {
        const list = await users.list();
        user = list.users.find((u) => u.email.toLowerCase() === email);
        if (!user) {
          throw new Error("User already exists but could not be located by email.");
        }
      } else {
        throw err;
      }
    }

    const therapistId = user.$id;

    // 2. Assign 'therapist' role and team membership
    try {
      await users.updateLabels(therapistId, ["therapist", "doctor"]);
    } catch (lblErr) {
      log("Could not update user labels: " + lblErr.message);
    }

    try {
      await teams.createMembership(THERAPISTS_TEAM_ID, ["therapist"], email, therapistId);
    } catch (teamErr) {
      log("Could not create team membership: " + teamErr.message);
    }

    // 3. Write record to USERS collection (Vault A)
    try {
      await databases.createDocument(
        DATABASE_ID,
        USERS_COLLECTION_ID,
        therapistId,
        {
          userId: therapistId,
          userName: fullName,
          email,
          role: "therapist",
          anonymousAlias: "Dr. " + fullName.split(" ")[0],
          avatarId: "doctor-avatar-1",
        },
        [
          Permission.read(Role.user(therapistId)),
          Permission.update(Role.user(therapistId)),
        ]
      );
    } catch (userDbErr) {
      log("USERS doc may already exist: " + userDbErr.message);
    }

    // 4. Write public card to THERAPISTS collection
    let therapistCard = null;
    try {
      therapistCard = await databases.createDocument(
        DATABASE_ID,
        THERAPISTS_COLLECTION_ID,
        therapistId,
        {
          therapistId,
          fullName,
          title,
          licenseNumber,
          specialties,
          sessionFee,
          currency,
          rating: 5.0,
          reviewCount: 1,
          bio,
          acceptsBridgeCareBrief: true,
        },
        [
          Permission.read(Role.any()),
          Permission.update(Role.user(therapistId)),
        ]
      );
    } catch (cardErr) {
      log("THERAPISTS doc may already exist: " + cardErr.message);
    }

    return res.json({
      success: true,
      therapistId,
      user,
      therapistCard,
      role: "therapist",
    });
  } catch (err) {
    error("Error in register-doctor: " + err.message);
    return res.json({ error: err.message }, 500);
  }
};
