import crypto from "crypto";

/**
 * Generate official ZEGOCLOUD Server Token (Version 04)
 * Signature: HMAC-SHA256(serverSecret, appId + userId + nonce + createTime + payload)
 */
function generateZegoToken04(appId, serverSecret, roomId, userId, effectiveTimeInSeconds = 7200) {
  const createTime = Math.floor(Date.now() / 1000);
  const nonce = crypto.randomBytes(4).readUInt32BE(0);

  const payload = {
    room_id: roomId,
    privilege: {
      1: 1, // Login Room
      2: 1, // Publish Stream
    },
    stream_id_list: null,
  };

  const payloadString = JSON.stringify(payload);
  const signatureRaw = `${appId}${userId}${nonce}${createTime}${payloadString}`;
  const hash = crypto.createHmac("sha256", serverSecret).update(signatureRaw).digest("hex");

  const tokenInfo = {
    ver: 1,
    hash,
    nonce,
    ctime: createTime,
    expire: createTime + effectiveTimeInSeconds,
    payload: payloadString,
  };

  return "04" + Buffer.from(JSON.stringify(tokenInfo)).toString("base64");
}

export default async ({ req, res, log, error }) => {
  try {
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

    const { roomId, userId, role = "patient" } = body;

    if (!roomId || !userId) {
      return res.json({ error: "Both roomId and userId are required parameters" }, 400);
    }

    const appId = Number(process.env.ZEGO_APP_ID || "1234567890");
    const serverSecret = process.env.ZEGO_SERVER_SECRET || "0123456789abcdef0123456789abcdef";

    if (!process.env.ZEGO_APP_ID || !process.env.ZEGO_SERVER_SECRET) {
      log("Notice: ZEGO_APP_ID or ZEGO_SERVER_SECRET not set in env. Generating development mock token.");
    }

    const token = generateZegoToken04(appId, serverSecret, roomId, userId);

    return res.json({
      token,
      appId,
      roomId,
      userId,
      role,
      expiresIn: 7200,
      createdAt: new Date().toISOString(),
    });
  } catch (err) {
    error("Error generating ZEGOCLOUD token: " + err.message);
    return res.json({ error: err.message }, 500);
  }
};
