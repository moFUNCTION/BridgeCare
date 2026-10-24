import { Client, Databases, ID, Query, Functions } from "appwrite";
import { databases, functions, APPWRITE_ENDPOINT, APPWRITE_PROJECT_ID } from "../lib/appwrite";

export interface CommunityPost {
  id: string;
  postId: string;
  authorId: string;
  authorAlias: string;
  authorAvatar: string;
  conditionSpace: string;
  content: string;
  relateCount: number;
  strengthCount: number;
  helpfulCount: number;
  commentsCount: number;
  isModerated: boolean;
  createdAt: string;
  userRelate?: boolean;
  userStrength?: boolean;
  userHelpful?: boolean;
}

export interface CommunityComment {
  id: string;
  commentId: string;
  postId: string;
  authorAlias: string;
  authorAvatar: string;
  content: string;
  createdAt: string;
}

export interface ModerationResult {
  isSafe: boolean;
  flagReason: "clean" | "self_harm" | "bullying" | "medical_advice" | "toxic";
  explanation: string;
  suggestedWarning?: string | null;
}

export interface CommunityNotification {
  id: string;
  postId?: string;
  type: "relate" | "strength" | "helpful" | "reply" | "system";
  actorAlias: string;
  title: string;
  message: string;
  createdAt: string;
  read: boolean;
}

const LOCAL_STORAGE_POSTS_KEY = "bridgecare_community_posts_cache";
const LOCAL_STORAGE_COMMENTS_KEY = "bridgecare_community_comments_cache";
const LOCAL_STORAGE_REACTIONS_KEY = "bridgecare_community_reactions_map";
const LOCAL_STORAGE_NOTIFS_KEY = "bridgecare_community_notifications_cache";

// Curated sanctuary seed posts across mental health spaces
const SEED_POSTS: CommunityPost[] = [
  {
    id: "seed-1",
    postId: "seed-1",
    authorId: "anon_seed_1",
    authorAlias: "SilentEcho34",
    authorAvatar: "SE",
    conditionSpace: "adhd",
    content:
      "Finally found a strategy that beats executive paralysis today: The '5-Minute Momentum Trick'. Just commit to staring at the file for 300 seconds. If your brain feels stuck today, remember you're not lazy—you're neurodivergent. Be gentle with yourself.",
    relateCount: 42,
    strengthCount: 29,
    helpfulCount: 18,
    commentsCount: 7,
    isModerated: true,
    createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
  },
  {
    id: "seed-2",
    postId: "seed-2",
    authorId: "anon_seed_2",
    authorAlias: "GentleWave88",
    authorAvatar: "GW",
    conditionSpace: "anxiety",
    content:
      "Woke up with an unprovoked somatic panic spike this morning. Ran the 60-second box breathing tool here while putting an ice pack on the back of my neck. Heart rate dropped from 125 to 78 in 10 minutes. Sharing in case it helps someone else right now.",
    relateCount: 65,
    strengthCount: 51,
    helpfulCount: 34,
    commentsCount: 12,
    isModerated: true,
    createdAt: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
  },
  {
    id: "seed-3",
    postId: "seed-3",
    authorId: "anon_seed_3",
    authorAlias: "QuietHope19",
    authorAvatar: "QH",
    conditionSpace: "ocd",
    content:
      "Sat with the uncertainty of not checking my front door lock for the 4th time today. Resisted the loop for 15 whole minutes. To neurotypicals it sounds trivial, but to anyone battling OCD loops—you know how monumental this win is.",
    relateCount: 38,
    strengthCount: 44,
    helpfulCount: 22,
    commentsCount: 5,
    isModerated: true,
    createdAt: new Date(Date.now() - 6 * 3600 * 1000).toISOString(),
  },
  {
    id: "seed-4",
    postId: "seed-4",
    authorId: "anon_seed_4",
    authorAlias: "BraveSoul42",
    authorAvatar: "BS",
    conditionSpace: "bipolar",
    content:
      "How I finally explained executive dysfunction and hypomania shifts to my family: the 'Brain Wi-Fi' analogy. Stopped apologizing for buffering signals. Understanding replaced frustration for the first time.",
    relateCount: 489,
    strengthCount: 312,
    helpfulCount: 198,
    commentsCount: 64,
    isModerated: true,
    createdAt: new Date(Date.now() - 14 * 3600 * 1000).toISOString(),
  },
  {
    id: "seed-5",
    postId: "seed-5",
    authorId: "anon_seed_5",
    authorAlias: "StillOcean99",
    authorAvatar: "SO",
    conditionSpace: "depression",
    content:
      "First morning in 6 months I made my bed without feeling a physical boulder on my chest. A tiny 2-minute act that felt like summiting Everest. Thank you to everyone in this sanctuary who validated my struggle.",
    relateCount: 742,
    strengthCount: 588,
    helpfulCount: 310,
    commentsCount: 91,
    isModerated: true,
    createdAt: new Date(Date.now() - 22 * 3600 * 1000).toISOString(),
  },
  {
    id: "seed-6",
    postId: "seed-6",
    authorId: "anon_seed_6",
    authorAlias: "MindfulPine21",
    authorAvatar: "MP",
    conditionSpace: "wins",
    content:
      "Celebrated a small micro-win today: finished drinking 1 full liter of water and stepped out into morning sunlight for 7 minutes. Every micro-step matters when recovery feels slow.",
    relateCount: 54,
    strengthCount: 68,
    helpfulCount: 29,
    commentsCount: 8,
    isModerated: true,
    createdAt: new Date(Date.now() - 30 * 3600 * 1000).toISOString(),
  },
  {
    id: "seed-7",
    postId: "seed-7",
    authorId: "anon_seed_7",
    authorAlias: "SereneWillow55",
    authorAvatar: "SW",
    conditionSpace: "ptsd",
    content:
      "During a sudden hypervigilance trigger in a crowded store, I did the 5-4-3-2-1 grounding technique: 5 things I see, 4 touch, 3 hear, 2 smell, 1 taste. It pulled me back to the present. You are safe in this moment.",
    relateCount: 93,
    strengthCount: 112,
    helpfulCount: 81,
    commentsCount: 19,
    isModerated: true,
    createdAt: new Date(Date.now() - 36 * 3600 * 1000).toISOString(),
  },
];

const SEED_COMMENTS: Record<string, CommunityComment[]> = {
  "seed-1": [
    {
      id: "c1-1",
      commentId: "c1-1",
      postId: "seed-1",
      authorAlias: "FocusSparrow7",
      authorAvatar: "FS",
      content: "The 300-second rule changed my work life. Once the momentum starts, the barrier drops!",
      createdAt: new Date(Date.now() - 1 * 3600 * 1000).toISOString(),
    },
    {
      id: "c1-2",
      commentId: "c1-2",
      postId: "seed-1",
      authorAlias: "GentleCloud14",
      authorAvatar: "GC",
      content: "Needed to hear 'you are not lazy, you are neurodivergent' today. Huge relief.",
      createdAt: new Date(Date.now() - 40 * 60 * 1000).toISOString(),
    },
  ],
  "seed-2": [
    {
      id: "c2-1",
      commentId: "c2-1",
      postId: "seed-2",
      authorAlias: "StillRiver88",
      authorAvatar: "SR",
      content: "Cold stimulus on the vagus nerve is scientifically magical for calming adrenaline spikes. Great reminder!",
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    },
  ],
  "seed-3": [
    {
      id: "c3-1",
      commentId: "c3-1",
      postId: "seed-3",
      authorAlias: "ClearSky40",
      authorAvatar: "CS",
      content: "Sitting with that uncertainty is genuinely heroic. Massive win!",
      createdAt: new Date(Date.now() - 3 * 3600 * 1000).toISOString(),
    },
  ],
};

/**
 * Real-time Groq AI safety screening
 * Calls Appwrite Cloud Function `groq-community-moderator`
 * with intelligent clinical safety fallback.
 */
export async function moderateCommunityContent(
  content: string,
  conditionSpace: string = "all"
): Promise<ModerationResult> {
  // 1. Try Appwrite Cloud Function: groq-community-moderator
  try {
    const execution = await functions.createExecution(
      "groq-community-moderator",
      JSON.stringify({ content, conditionSpace }),
      false
    );

    if (execution.status === "completed" && execution.responseBody) {
      const parsed = JSON.parse(execution.responseBody);
      if (typeof parsed.isSafe === "boolean") {
        return parsed as ModerationResult;
      }
    }
  } catch (fnErr) {
    // Cloud function not deployed or network fallback
  }

  // 2. Intelligent client-side heuristic safeguard (Sanctuary Safeguard)
  const lower = content.toLowerCase();

  // A. Self-Harm or Lethal Means Check
  const selfHarmPatterns = [
    "kill myself",
    "suicide",
    "end my life",
    "end it all",
    "want to die",
    "take my life",
    "hang myself",
    "cut my wrists",
    "انتحار",
    "اقتل نفسي",
    "أنهي حياتي",
    "اريد الموت",
    "أؤذي نفسي",
  ];
  if (selfHarmPatterns.some((pattern) => lower.includes(pattern))) {
    return {
      isSafe: false,
      flagReason: "self_harm",
      explanation:
        "Your message touches on severe personal distress or self-harm. In BridgeCare, we cherish your life deeply and want to ensure you receive immediate compassionate human support.",
      suggestedWarning: "Immediate crisis support available. Please connect with our 24/7 Lifeline.",
    };
  }

  // B. Unlicensed Medical Prescriptions / Specific Dosages Check
  const dosagePattern = /\b\d+(\.\d+)?\s*(mg|milligram|milligrams|جرعة|ملغ|حبوب)\b/i;
  const prescriptionMeds = [
    "xanax",
    "adderall",
    "vyvanse",
    "prozac",
    "lexapro",
    "zoloft",
    "klonopin",
    "ritalin",
    "ativan",
    "seroquel",
    "abilify",
    "lithium",
    "سيروكسات",
    "زاناكس",
    "بروزاك",
  ];
  const hasPrescriptionMention = prescriptionMeds.some((med) => lower.includes(med));
  const hasDoseMention = dosagePattern.test(content);

  if (hasDoseMention && hasPrescriptionMention) {
    return {
      isSafe: false,
      flagReason: "medical_advice",
      explanation:
        "We couldn't post this because it mentions specific medication dosing. In BridgeCare, only licensed psychiatrists can prescribe or recommend dosages to keep everyone safe. Could you rephrase your post to focus on how you felt instead?",
      suggestedWarning: "Medical dosing guidance is restricted to licensed clinicians.",
    };
  }

  // C. Bullying, Mocking, Toxic Harassment Check
  const bullyingKeywords = [
    "stupid",
    "idiot",
    "loser",
    "moron",
    "fake disease",
    "lazy liar",
    "ugly",
    "faggot",
    "retard",
    "حمار",
    "غبي",
    "حقير",
    "مرض وهمي",
    "كذاب",
    "يا تافه",
  ];
  if (bullyingKeywords.some((w) => lower.includes(w))) {
    return {
      isSafe: false,
      flagReason: "bullying",
      explanation:
        "This sanctuary is founded on non-judgmental empathy. Harassing remarks or invalidations of others' experiences are not permitted. Please rephrase with kindness.",
      suggestedWarning: "Sanctuary rule: Maintain warm, respectful communication.",
    };
  }

  return {
    isSafe: true,
    flagReason: "clean",
    explanation: "Content is safe, empathetic, and aligned with community guidelines.",
  };
}

/**
 * Fetch all community posts, optionally filtered by condition space.
 * Merges Appwrite database documents with cached local posts and seed data.
 */
export async function fetchPosts(space: string = "all"): Promise<CommunityPost[]> {
  let appwritePosts: CommunityPost[] = [];

  try {
    const queries = [Query.orderDesc("createdAt"), Query.limit(50)];
    if (space !== "all") {
      queries.push(Query.equal("conditionSpace", space));
    }

    const res = await databases.listDocuments("main", "COMMUNITY_POSTS", queries);
    if (res && res.documents) {
      appwritePosts = res.documents.map((d: any) => ({
        id: d.$id,
        postId: d.postId || d.$id,
        authorId: d.authorId || "anonymous",
        authorAlias: d.authorAlias || "CalmRiver92",
        authorAvatar: d.authorAvatar || "CR",
        conditionSpace: d.conditionSpace || "all",
        content: d.content || "",
        relateCount: Number(d.relateCount || 0),
        strengthCount: Number(d.strengthCount || 0),
        helpfulCount: Number(d.helpfulCount || 0),
        commentsCount: 0,
        isModerated: Boolean(d.isModerated ?? true),
        createdAt: d.createdAt || d.$createdAt || new Date().toISOString(),
      }));
    }
  } catch (err) {
    // Appwrite collection not yet created or network unreachable
  }

  // Read local stored posts
  let localPosts: CommunityPost[] = [];
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_POSTS_KEY);
    if (stored) {
      localPosts = JSON.parse(stored);
    }
  } catch (e) {
    localPosts = [];
  }

  // Merge seed posts
  const combinedMap = new Map<string, CommunityPost>();

  // Add seed posts first
  SEED_POSTS.forEach((p) => {
    if (space === "all" || p.conditionSpace === space) {
      combinedMap.set(p.id, { ...p });
    }
  });

  // Overlay local cached posts
  localPosts.forEach((p) => {
    if (space === "all" || p.conditionSpace === space) {
      combinedMap.set(p.id, { ...p });
    }
  });

  // Overlay Appwrite posts
  appwritePosts.forEach((p) => {
    if (space === "all" || p.conditionSpace === space) {
      const existing = combinedMap.get(p.id);
      combinedMap.set(p.id, {
        ...p,
        relateCount: Math.max(p.relateCount, existing?.relateCount || 0),
        strengthCount: Math.max(p.strengthCount, existing?.strengthCount || 0),
        helpfulCount: Math.max(p.helpfulCount, existing?.helpfulCount || 0),
      });
    }
  });

  // Attach user reaction state from local reaction map
  const userReactions = getUserReactionsMap();

  const allPosts = Array.from(combinedMap.values()).map((p) => {
    const userReact = userReactions[p.id] || {};
    return {
      ...p,
      userRelate: !!userReact.relate,
      userStrength: !!userReact.strength,
      userHelpful: !!userReact.helpful,
    };
  });

  // Sort by createdAt descending
  return allPosts.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

/**
 * Create a new anonymous community post
 */
export async function createCommunityPost(params: {
  authorId: string;
  authorAlias: string;
  authorAvatar: string;
  conditionSpace: string;
  content: string;
}): Promise<CommunityPost> {
  const newId = `post_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const now = new Date().toISOString();

  const newPost: CommunityPost = {
    id: newId,
    postId: newId,
    authorId: params.authorId,
    authorAlias: params.authorAlias,
    authorAvatar: params.authorAvatar,
    conditionSpace: params.conditionSpace,
    content: params.content,
    relateCount: 1,
    strengthCount: 0,
    helpfulCount: 0,
    commentsCount: 0,
    isModerated: true,
    createdAt: now,
    userRelate: true,
  };

  // Try Appwrite persistence
  try {
    const doc = await databases.createDocument("main", "COMMUNITY_POSTS", ID.unique(), {
      postId: newId,
      authorId: params.authorId,
      authorAlias: params.authorAlias,
      authorAvatar: params.authorAvatar,
      conditionSpace: params.conditionSpace,
      content: params.content,
      relateCount: 1,
      strengthCount: 0,
      helpfulCount: 0,
      isModerated: true,
      createdAt: now,
    });
    newPost.id = doc.$id;
  } catch (err) {
    // Graceful offline fallback
  }

  // Update local cache
  try {
    const current = JSON.parse(localStorage.getItem(LOCAL_STORAGE_POSTS_KEY) || "[]");
    localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify([newPost, ...current]));
  } catch (e) {
    // LocalStorage quota fallback
  }

  // Mark author's self relate
  recordUserReaction(newPost.id, "relate", true);

  return newPost;
}

/**
 * Optimistically toggle reaction on a post
 */
export async function togglePostReaction(
  postId: string,
  reactionType: "relate" | "strength" | "helpful",
  currentActive: boolean
): Promise<{ relateCount: number; strengthCount: number; helpfulCount: number; newActive: boolean }> {
  const newActive = !currentActive;
  const delta = newActive ? 1 : -1;

  // Update local reaction tracker
  recordUserReaction(postId, reactionType, newActive);

  // Read current cached posts
  let relateCount = 0;
  let strengthCount = 0;
  let helpfulCount = 0;

  try {
    const stored = JSON.parse(localStorage.getItem(LOCAL_STORAGE_POSTS_KEY) || "[]");
    let found = false;
    const updated = stored.map((p: CommunityPost) => {
      if (p.id === postId || p.postId === postId) {
        found = true;
        const currentRelate = p.relateCount || 0;
        const currentStrength = p.strengthCount || 0;
        const currentHelpful = p.helpfulCount || 0;

        const nextRelate = reactionType === "relate" ? Math.max(0, currentRelate + delta) : currentRelate;
        const nextStrength = reactionType === "strength" ? Math.max(0, currentStrength + delta) : currentStrength;
        const nextHelpful = reactionType === "helpful" ? Math.max(0, currentHelpful + delta) : currentHelpful;

        relateCount = nextRelate;
        strengthCount = nextStrength;
        helpfulCount = nextHelpful;

        return {
          ...p,
          relateCount: nextRelate,
          strengthCount: nextStrength,
          helpfulCount: nextHelpful,
        };
      }
      return p;
    });

    if (found) {
      localStorage.setItem(LOCAL_STORAGE_POSTS_KEY, JSON.stringify(updated));
    }
  } catch (e) {
    // Ignore
  }

  // Try Appwrite update
  try {
    const fieldsToUpdate: any = {};
    if (reactionType === "relate") fieldsToUpdate.relateCount = relateCount;
    if (reactionType === "strength") fieldsToUpdate.strengthCount = strengthCount;
    if (reactionType === "helpful") fieldsToUpdate.helpfulCount = helpfulCount;

    await databases.updateDocument("main", "COMMUNITY_POSTS", postId, fieldsToUpdate);
  } catch (err) {
    // Ignore document missing or offline
  }

  // Create real-time notification if reaction was added
  if (newActive) {
    pushNotification({
      type: reactionType,
      postId,
      actorAlias: "A Peer in Sanctuary",
      title:
        reactionType === "relate"
          ? "New Empathy Reaction"
          : reactionType === "strength"
          ? "Strength Sent to You"
          : "Helpful Affirmation",
      message:
        reactionType === "relate"
          ? "A fellow community member resonated with your story: 'I Relate'."
          : reactionType === "strength"
          ? "Someone sent you a spark of strength and encouragement."
          : "Your perspective helped someone through their difficult moment.",
    });
  }

  return { relateCount, strengthCount, helpfulCount, newActive };
}

/**
 * Fetch comments for a specific post
 */
export async function fetchPostComments(postId: string): Promise<CommunityComment[]> {
  let comments: CommunityComment[] = [];

  // Try Appwrite
  try {
    const res = await databases.listDocuments("main", "COMMUNITY_COMMENTS", [
      Query.equal("postId", postId),
      Query.orderAsc("createdAt"),
    ]);
    if (res && res.documents) {
      comments = res.documents.map((d: any) => ({
        id: d.$id,
        commentId: d.commentId || d.$id,
        postId: d.postId,
        authorAlias: d.authorAlias || "GentleMember",
        authorAvatar: d.authorAvatar || "GM",
        content: d.content,
        createdAt: d.createdAt || d.$createdAt,
      }));
    }
  } catch (e) {
    // fallback
  }

  // Merge seed comments
  const seedList = SEED_COMMENTS[postId] || [];
  const map = new Map<string, CommunityComment>();
  seedList.forEach((c) => map.set(c.id, c));

  // Merge local comments
  try {
    const stored = JSON.parse(localStorage.getItem(LOCAL_STORAGE_COMMENTS_KEY) || "{}");
    const postLocal = stored[postId] || [];
    postLocal.forEach((c: CommunityComment) => map.set(c.id, c));
  } catch (e) {
    // ignore
  }

  comments.forEach((c) => map.set(c.id, c));

  return Array.from(map.values()).sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
}

/**
 * Add a comment to an existing post
 */
export async function addPostComment(
  postId: string,
  authorAlias: string,
  authorAvatar: string,
  content: string
): Promise<CommunityComment> {
  const commentId = `comm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
  const now = new Date().toISOString();

  const newComment: CommunityComment = {
    id: commentId,
    commentId,
    postId,
    authorAlias,
    authorAvatar,
    content,
    createdAt: now,
  };

  // Try Appwrite
  try {
    await databases.createDocument("main", "COMMUNITY_COMMENTS", ID.unique(), {
      commentId,
      postId,
      authorAlias,
      authorAvatar,
      content,
      createdAt: now,
    });
  } catch (err) {
    // Offline fallback
  }

  // Save to local storage
  try {
    const stored = JSON.parse(localStorage.getItem(LOCAL_STORAGE_COMMENTS_KEY) || "{}");
    if (!stored[postId]) stored[postId] = [];
    stored[postId].push(newComment);
    localStorage.setItem(LOCAL_STORAGE_COMMENTS_KEY, JSON.stringify(stored));
  } catch (e) {
    // ignore
  }

  // Push notification
  pushNotification({
    type: "reply",
    postId,
    actorAlias,
    title: `New Reply from ${authorAlias}`,
    message: `${authorAlias} commented: "${content.slice(0, 60)}${content.length > 60 ? "..." : ""}"`,
  });

  return newComment;
}

/**
 * Fetch top viral stories sorted by total empathy volume (relateCount + strengthCount)
 */
export async function fetchViralStories(): Promise<CommunityPost[]> {
  const allPosts = await fetchPosts("all");
  return allPosts
    .sort((a, b) => {
      const scoreA = a.relateCount * 1.2 + a.strengthCount * 1.5 + a.helpfulCount;
      const scoreB = b.relateCount * 1.2 + b.strengthCount * 1.5 + b.helpfulCount;
      return scoreB - scoreA;
    })
    .slice(0, 10);
}

/**
 * Fetch live community notifications
 */
export function fetchNotifications(): CommunityNotification[] {
  try {
    const stored = localStorage.getItem(LOCAL_STORAGE_NOTIFS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    // ignore
  }

  // Default seed notifications
  const defaultNotifs: CommunityNotification[] = [
    {
      id: "n1",
      postId: "seed-1",
      type: "relate",
      actorAlias: "CalmRiver92",
      title: "New Empathy Reaction",
      message: "CalmRiver92 empathized with your post on executive dysfunction: 'I relate'.",
      createdAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
      read: false,
    },
    {
      id: "n2",
      postId: "seed-2",
      type: "reply",
      actorAlias: "GentleWave88",
      title: "New Reply in Anxiety Space",
      message: "GentleWave88 replied: 'Thank you for sharing the breathing trick, really calmed me down.'",
      createdAt: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
      read: false,
    },
    {
      id: "n3",
      type: "system",
      actorAlias: "BridgeCare Vault",
      title: "Pre-Session Clinical File Updated",
      message: "Starlight Focus screening scores (7/10) have been successfully compiled into your Pre-Session Clinical Dossier.",
      createdAt: new Date(Date.now() - 24 * 3600 * 1000).toISOString(),
      read: true,
    },
  ];

  localStorage.setItem(LOCAL_STORAGE_NOTIFS_KEY, JSON.stringify(defaultNotifs));
  return defaultNotifs;
}

/**
 * Push a new notification into local cache
 */
export function pushNotification(item: Omit<CommunityNotification, "id" | "createdAt" | "read">): CommunityNotification {
  const notif: CommunityNotification = {
    ...item,
    id: `notif_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    createdAt: new Date().toISOString(),
    read: false,
  };

  try {
    const current = fetchNotifications();
    const updated = [notif, ...current].slice(0, 30);
    localStorage.setItem(LOCAL_STORAGE_NOTIFS_KEY, JSON.stringify(updated));
  } catch (e) {
    // ignore
  }

  return notif;
}

/**
 * Mark all notifications as read
 */
export function markAllNotificationsAsRead(): void {
  try {
    const current = fetchNotifications();
    const updated = current.map((n) => ({ ...n, read: true }));
    localStorage.setItem(LOCAL_STORAGE_NOTIFS_KEY, JSON.stringify(updated));
  } catch (e) {
    // ignore
  }
}

// -------------------------------------------------------------
// Reaction Helpers
// -------------------------------------------------------------
function getUserReactionsMap(): Record<string, Record<string, boolean>> {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_REACTIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch (e) {
    return {};
  }
}

function recordUserReaction(postId: string, type: "relate" | "strength" | "helpful", active: boolean): void {
  try {
    const map = getUserReactionsMap();
    if (!map[postId]) map[postId] = {};
    map[postId][type] = active;
    localStorage.setItem(LOCAL_STORAGE_REACTIONS_KEY, JSON.stringify(map));
  } catch (e) {
    // ignore
  }
}
