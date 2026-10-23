import { Client, Users, Teams, Databases, Permission, Role, ID } from "node-appwrite";

const DATABASE_ID = process.env.APPWRITE_DATABASE_ID || "main";
const COLLECTION_ID = process.env.USERS_COLLECTION_ID || "USERS";
const TEAM_ID = process.env.PATIENTS_TEAM_ID || "patients";

/**
 * Appwrite Cloud Function: register-patient
 * 1. Creates/verifies Appwrite auth user
 * 2. Assigns 'patient' role in 'patients' team and user labels
 * 3. Stores user profile in database collection 'USERS'
 * 4. Initializes complete read/update/delete permissions for the user and patient team
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

    const client = new Client()
      .setEndpoint(endpoint)
      .setProject(projectId);

    if (apiKey) {
      client.setKey(apiKey);
    }

    const users = new Users(client);
    const teams = new Teams(client);
    const databases = new Databases(client);

    // 1. Parse body payload
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
    const userName = (body.userName || body.name || "").trim();
    const phoneNumber = (body.phoneNumber || body.phone || "").trim();
    const age = body.age ? Number(body.age) : null;
    const country = (body.country || "").trim();
    let userId = (body.userId || "").trim();

    if (!email) {
      return res.json({ success: false, error: "Email is required" }, 400);
    }

    // 2. Create or verify auth user
    let userObj = null;
    if (userId) {
      try {
        userObj = await users.get(userId);
      } catch (getErr) {
        // Not found by ID, proceed to create
      }
    }

    if (!userObj) {
      if (!password) {
        return res.json({ success: false, error: "Password is required for registration" }, 400);
      }
      userId = userId || ID.unique();
      try {
        userObj = await users.create(userId, email, undefined, password, userName);
        log(`Created new auth user: ${userId} (${email})`);
      } catch (createErr) {
        // If user already exists by email, retrieve user
        if (createErr.code === 409 || createErr.message?.includes("already exists")) {
          const list = await users.list([`equal("email", ["${email}"])`]);
          if (list.total > 0) {
            userObj = list.users[0];
            userId = userObj.$id;
          } else {
            throw createErr;
          }
        } else {
          throw createErr;
        }
      }
    }

    // 3. Assign role 'patient' in team 'patients'
    try {
      await teams.createMembership(
        TEAM_ID,
        ["patient"],
        email,
        userId,
        undefined,
        undefined,
        userName || undefined
      );
      log(`Assigned role 'patient' in team '${TEAM_ID}' to user ${userId}`);
    } catch (teamErr) {
      // Membership might already exist
      log(`Team membership notice: ${teamErr.message}`);
    }

    // 4. Update user labels and preferences
    try {
      await users.updateLabels(userId, ["patient"]);
    } catch (labelErr) {
      log(`Labels update notice: ${labelErr.message}`);
    }

    try {
      const existingPrefs = (await users.getPrefs(userId)) || {};
      await users.updatePrefs(userId, {
        ...existingPrefs,
        role: "patient",
        userName,
        phone: phoneNumber,
        age,
        country,
      });
    } catch (prefErr) {
      log(`Preferences update notice: ${prefErr.message}`);
    }

    // 5. Store user profile in collection 'USERS' with initialized permissions
    const permissions = [
      Permission.read(Role.user(userId)),
      Permission.update(Role.user(userId)),
      Permission.delete(Role.user(userId)),
      Permission.read(Role.team(TEAM_ID)),
      Permission.read(Role.users()),
    ];

    const documentData = {
      userId,
      userName,
      email,
      phoneNumber: phoneNumber || null,
      age: age || null,
      country: country || null,
      role: "patient",
    };

    let doc = null;
    try {
      // Check if document already exists
      doc = await databases.getDocument(DATABASE_ID, COLLECTION_ID, userId);
      // Update existing document
      doc = await databases.updateDocument(
        DATABASE_ID,
        COLLECTION_ID,
        userId,
        documentData,
        permissions
      );
      log(`Updated USERS document for ${userId}`);
    } catch (getDocErr) {
      // Create new document with userId as document ID
      try {
        doc = await databases.createDocument(
          DATABASE_ID,
          COLLECTION_ID,
          userId,
          documentData,
          permissions
        );
        log(`Created USERS document for ${userId}`);
      } catch (createDocErr) {
        error(`Failed to create USERS document: ${createDocErr.message}`);
        throw createDocErr;
      }
    }

    return res.json({
      success: true,
      message: "Patient registered successfully",
      userId,
      user: {
        $id: userObj.$id,
        name: userObj.name,
        email: userObj.email,
      },
      document: doc,
    });
  } catch (err) {
    error(`register-patient error: ${err.message}`);
    return res.json({ success: false, error: err.message }, 500);
  }
};
