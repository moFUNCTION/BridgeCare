import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  HStack,
  Stack,
  Text,
  Badge,
  Textarea,
  Input,
  IconButton,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { useUser } from "@repo/react-appwrite";
import { ScrollArea } from "../../components/ui/scroll-area";
import {
  LuShieldCheck,
  LuShieldAlert,
  LuHeart,
  LuSparkles,
  LuMessageCircle,
  LuSend,
  LuLock,
  LuPlus,
  LuSmile,
  LuInfo,
  LuX,
  LuLoader,
  LuCheck,
} from "react-icons/lu";
import type { CommunityPost, CommunityComment, ModerationResult } from "../../services/communityService";
import {
  fetchPosts,
  createCommunityPost,
  togglePostReaction,
  moderateCommunityContent,
  fetchPostComments,
  addPostComment,
} from "../../services/communityService";

export const CommunityPosts: React.FC = () => {
  const { t } = useTranslation();
  const { profile } = useUser();

  const anonymousAlias = profile?.userName
    ? `Anon_${profile.userName.slice(0, 4)}`
    : (localStorage.getItem("bridgecare_user_alias") || "CalmRiver92");

  const avatarSeed = anonymousAlias.slice(0, 2).toUpperCase();

  const [activeCategory, setActiveCategory] = useState("all");
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  // Composer State
  const [showComposer, setShowComposer] = useState(false);
  const [newPostText, setNewPostText] = useState("");
  const [selectedTag, setSelectedTag] = useState("adhd");
  const [moderation, setModeration] = useState<ModerationResult>({
    isSafe: true,
    flagReason: "clean",
    explanation: "Content Safe & Supportive",
  });
  const [isCheckingSafety, setIsCheckingSafety] = useState(false);
  const [showCoachingModal, setShowCoachingModal] = useState(false);
  const [coachingMessage, setCoachingMessage] = useState("");
  const [submittingPost, setSubmittingPost] = useState(false);

  // Comments Thread State
  const [activeCommentPostId, setActiveCommentPostId] = useState<string | null>(null);
  const [postCommentsMap, setPostCommentsMap] = useState<Record<string, CommunityComment[]>>({});
  const [loadingComments, setLoadingComments] = useState(false);
  const [newCommentText, setNewCommentText] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);

  // Load posts on category switch
  useEffect(() => {
    let isMounted = true;
    setLoading(true);
    fetchPosts(activeCategory)
      .then((data) => {
        if (isMounted) {
          setPosts(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeCategory]);

  // Debounced real-time Groq moderation check on composer input
  useEffect(() => {
    if (!newPostText.trim()) {
      setModeration({
        isSafe: true,
        flagReason: "clean",
        explanation: "Content Safe & Supportive",
      });
      setIsCheckingSafety(false);
      return;
    }

    setIsCheckingSafety(true);
    const timer = setTimeout(async () => {
      const res = await moderateCommunityContent(newPostText, selectedTag);
      setModeration(res);
      setIsCheckingSafety(false);
    }, 400);

    return () => clearTimeout(timer);
  }, [newPostText, selectedTag]);

  // Handle post creation with compassionate coaching modal
  const handleCreatePost = async () => {
    if (!newPostText.trim() || submittingPost) return;

    // Final safety verification
    const safetyCheck = await moderateCommunityContent(newPostText, selectedTag);
    if (!safetyCheck.isSafe) {
      setModeration(safetyCheck);
      setCoachingMessage(safetyCheck.explanation);
      setShowCoachingModal(true);
      return;
    }

    setSubmittingPost(true);
    try {
      const created = await createCommunityPost({
        authorId: profile?.userId || "anon_author",
        authorAlias: anonymousAlias,
        authorAvatar: avatarSeed,
        conditionSpace: selectedTag,
        content: newPostText.trim(),
      });

      setPosts([created, ...posts]);
      setNewPostText("");
      setShowComposer(false);
    } finally {
      setSubmittingPost(false);
    }
  };

  // Empathetic reaction handler
  const handleReaction = async (
    postId: string,
    reactionType: "relate" | "strength" | "helpful"
  ) => {
    // Find current post
    const post = posts.find((p) => p.id === postId);
    if (!post) return;

    const currentActive =
      reactionType === "relate"
        ? !!post.userRelate
        : reactionType === "strength"
        ? !!post.userStrength
        : !!post.userHelpful;

    // Optimistic UI update
    const delta = currentActive ? -1 : 1;
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          return {
            ...p,
            relateCount: reactionType === "relate" ? Math.max(0, p.relateCount + delta) : p.relateCount,
            strengthCount: reactionType === "strength" ? Math.max(0, p.strengthCount + delta) : p.strengthCount,
            helpfulCount: reactionType === "helpful" ? Math.max(0, p.helpfulCount + delta) : p.helpfulCount,
            userRelate: reactionType === "relate" ? !currentActive : p.userRelate,
            userStrength: reactionType === "strength" ? !currentActive : p.userStrength,
            userHelpful: reactionType === "helpful" ? !currentActive : p.userHelpful,
          };
        }
        return p;
      })
    );

    // Call service
    await togglePostReaction(postId, reactionType, currentActive);
  };

  // Toggle comments drawer for a post
  const handleToggleComments = async (postId: string) => {
    if (activeCommentPostId === postId) {
      setActiveCommentPostId(null);
      return;
    }

    setActiveCommentPostId(postId);
    if (!postCommentsMap[postId]) {
      setLoadingComments(true);
      try {
        const comments = await fetchPostComments(postId);
        setPostCommentsMap((prev) => ({ ...prev, [postId]: comments }));
      } finally {
        setLoadingComments(false);
      }
    }
  };

  // Add a comment to active post
  const handleAddComment = async (postId: string) => {
    if (!newCommentText.trim() || submittingComment) return;

    // Screen comment
    const check = await moderateCommunityContent(newCommentText, "comment");
    if (!check.isSafe) {
      setCoachingMessage(check.explanation);
      setShowCoachingModal(true);
      return;
    }

    setSubmittingComment(true);
    try {
      const added = await addPostComment(postId, anonymousAlias, avatarSeed, newCommentText.trim());
      setPostCommentsMap((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] || []), added],
      }));
      setNewCommentText("");

      // Increment comments count on post
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, commentsCount: (p.commentsCount || 0) + 1 } : p))
      );
    } finally {
      setSubmittingComment(false);
    }
  };

  const categories = [
    { id: "all", label: t("community.catAll") },
    { id: "adhd", label: t("community.catAdhd") },
    { id: "anxiety", label: t("community.catAnxiety") },
    { id: "depression", label: t("community.catDepression") },
    { id: "ocd", label: t("community.catOcd") },
    { id: "bipolar", label: "Bipolar Spectrum" },
    { id: "ptsd", label: "PTSD & Grounding" },
    { id: "wins", label: t("community.catWins") },
  ];

  const conditionTags = [
    { id: "adhd", label: "ADHD & Focus" },
    { id: "anxiety", label: "Anxiety & Panic" },
    { id: "depression", label: "Depression" },
    { id: "ocd", label: "OCD Loops" },
    { id: "bipolar", label: "Bipolar Spectrum" },
    { id: "ptsd", label: "PTSD" },
    { id: "wins", label: "Small Wins" },
  ];

  return (
    <Box minH="100vh" bg="bg" color="fg" py="8" px={{ base: "4", md: "8" }}>
      <Container maxW="5xl">
        <Stack gap="8">
          {/* Top Anonymity & Moderation Shield Banner */}
          <Box
            p="5"
            borderRadius="2xl"
            bg="linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(20, 184, 166, 0.06) 100%)"
            borderWidth="1px"
            borderColor="orange.500/25"
          >
            <Flex
              direction={{ base: "column", sm: "row" }}
              justify="space-between"
              align={{ base: "start", sm: "center" }}
              gap="3"
            >
              <HStack gap="3">
                <Flex
                  w="10"
                  h="10"
                  borderRadius="xl"
                  bg="teal.600"
                  color="white"
                  align="center"
                  justify="center"
                  boxShadow="0 4px 14px rgba(20, 184, 166, 0.35)"
                >
                  <LuLock size={18} />
                </Flex>
                <Stack gap="0">
                  <HStack gap="2">
                    <Text fontSize="sm" fontWeight="bold">
                      {t("community.postingAs", { alias: anonymousAlias })}
                    </Text>
                    <Badge
                      colorPalette="green"
                      size="xs"
                      px="2"
                      py="0.5"
                      borderRadius="full"
                      fontSize="2xs"
                      fontWeight="semibold"
                    >
                      {t("community.zeroIdentity")}
                    </Badge>
                  </HStack>
                  <Text fontSize="2xs" color="fg.muted">
                    {t("community.subtitle")}
                  </Text>
                </Stack>
              </HStack>

              <Button
                size="sm"
                px="4"
                py="2"
                fontSize="xs"
                fontWeight="semibold"
                bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                color="white"
                borderRadius="xl"
                onClick={() => setShowComposer(!showComposer)}
              >
                <HStack gap="1.5">
                  <LuPlus size={16} />
                  <Text>{t("community.sharePost")}</Text>
                </HStack>
              </Button>
            </Flex>
          </Box>

          {/* New Post Composer with Live Groq AI Safety Moderation */}
          {showComposer && (
            <Box
              p="6"
              borderRadius="3xl"
              bg="bg.panel"
              borderWidth="1px"
              borderColor="orange.500/35"
              boxShadow="0 10px 30px -10px rgba(234, 88, 12, 0.15)"
            >
              <Stack gap="4">
                <Flex justify="space-between" align="center" wrap="wrap" gap="2">
                  <Text fontWeight="bold" fontSize="sm">
                    {t("community.composerTitle")}
                  </Text>

                  {/* Live AI Safety Shield Badge */}
                  <Badge
                    colorPalette={isCheckingSafety ? "gray" : moderation.isSafe ? "green" : "red"}
                    size="sm"
                    variant="subtle"
                    px="2.5"
                    py="1"
                    borderRadius="full"
                    fontSize="xs"
                    fontWeight="semibold"
                  >
                    <HStack gap="1.5">
                      {isCheckingSafety ? (
                        <LuLoader size={13} className="spin" />
                      ) : moderation.isSafe ? (
                        <LuShieldCheck size={14} color="#16a34a" />
                      ) : (
                        <LuShieldAlert size={14} color="#dc2626" />
                      )}
                      <Text>
                        {isCheckingSafety
                          ? "Groq Shield Screening..."
                          : moderation.isSafe
                          ? "Content Safe & Supportive"
                          : "AI Shield Warning"}
                      </Text>
                    </HStack>
                  </Badge>
                </Flex>

                <Textarea
                  placeholder={t("community.composerPlaceholder")}
                  value={newPostText}
                  onChange={(e) => setNewPostText(e.target.value)}
                  rows={4}
                  borderRadius="2xl"
                  bg="bg"
                  borderColor={!moderation.isSafe ? "red.500/40" : "border.subtle"}
                />

                {/* Inline non-punitive warning preview if flagged */}
                {!moderation.isSafe && (
                  <Box
                    p="3"
                    borderRadius="xl"
                    bg="red.500/10"
                    borderWidth="1px"
                    borderColor="red.500/25"
                  >
                    <HStack gap="2" align="start">
                      <LuInfo size={16} color="#ef4444" style={{ marginTop: "2px", flexShrink: 0 }} />
                      <Text fontSize="xs" color="red.600" lineHeight="tall">
                        {moderation.explanation}
                      </Text>
                    </HStack>
                  </Box>
                )}

                <Flex justify="space-between" align="center" wrap="wrap" gap="3">
                  <HStack gap="1.5" wrap="wrap">
                    <Text fontSize="xs" color="fg.muted" mr="1">
                      {t("community.spaceLabel")}
                    </Text>
                    {conditionTags.map((tag) => (
                      <Button
                        key={tag.id}
                        size="xs"
                        px="2.5"
                        py="1"
                        borderRadius="full"
                        fontSize="2xs"
                        fontWeight="medium"
                        variant={selectedTag === tag.id ? "solid" : "outline"}
                        colorPalette="orange"
                        onClick={() => setSelectedTag(tag.id)}
                      >
                        {tag.label}
                      </Button>
                    ))}
                  </HStack>

                  <HStack gap="2">
                    <Button
                      size="sm"
                      px="3"
                      py="1.5"
                      fontSize="xs"
                      fontWeight="medium"
                      variant="ghost"
                      onClick={() => setShowComposer(false)}
                    >
                      {t("community.cancel")}
                    </Button>
                    <Button
                      size="sm"
                      px="4"
                      py="2"
                      fontSize="xs"
                      fontWeight="semibold"
                      bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                      color="white"
                      borderRadius="xl"
                      disabled={!newPostText.trim() || submittingPost}
                      onClick={handleCreatePost}
                    >
                      <HStack gap="1.5">
                        <LuSend size={14} />
                        <Text>
                          {submittingPost ? "Submitting..." : t("community.postAnonymously")}
                        </Text>
                      </HStack>
                    </Button>
                  </HStack>
                </Flex>
              </Stack>
            </Box>
          )}

          {/* Condition Spaces Filter Tabs */}
          <ScrollArea orientation="horizontal" maxW="100%">
            <HStack gap="2" py="1" px="0.5" whiteSpace="nowrap">
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  size="xs"
                  px="3"
                  py="1.5"
                  borderRadius="full"
                  fontSize="xs"
                  fontWeight="medium"
                  variant={activeCategory === cat.id ? "solid" : "subtle"}
                  colorPalette="orange"
                  onClick={() => setActiveCategory(cat.id)}
                  flexShrink={0}
                >
                  {cat.label}
                </Button>
              ))}
            </HStack>
          </ScrollArea>

          {/* Posts Feed */}
          {loading ? (
            <Flex justify="center" align="center" py="16">
              <HStack gap="3" color="orange.600">
                <LuLoader size={20} className="spin" />
                <Text fontSize="sm">Loading safe community sanctuary...</Text>
              </HStack>
            </Flex>
          ) : posts.length === 0 ? (
            <Box
              p="12"
              borderRadius="3xl"
              bg="bg.panel"
              textAlign="center"
              borderWidth="1px"
              borderColor="border.subtle"
            >
              <Text fontSize="md" fontWeight="bold" mb="1">
                No posts in this space yet
              </Text>
              <Text fontSize="xs" color="fg.muted">
                Be the first to share your experience anonymously and support your peers.
              </Text>
            </Box>
          ) : (
            <Stack gap="5">
              {posts.map((post) => {
                const isCommentsOpen = activeCommentPostId === post.id;
                const comments = postCommentsMap[post.id] || [];

                return (
                  <Box
                    key={post.id}
                    p="6"
                    borderRadius="3xl"
                    bg="bg.panel"
                    borderWidth="1px"
                    borderColor="border.subtle"
                    _hover={{ borderColor: "orange.500/35" }}
                    transition="all 0.2s"
                  >
                    <Flex justify="space-between" align="center" mb="3">
                      <HStack gap="2.5">
                        <Flex
                          w="9"
                          h="9"
                          borderRadius="full"
                          bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                          color="white"
                          align="center"
                          justify="center"
                          fontSize="xs"
                          fontWeight="bold"
                        >
                          {post.authorAvatar || post.authorAlias.slice(0, 2).toUpperCase()}
                        </Flex>
                        <Stack gap="0">
                          <HStack gap="2">
                            <Text fontSize="sm" fontWeight="bold">
                              {post.authorAlias}
                            </Text>
                            <Badge
                              size="xs"
                              colorPalette="orange"
                              variant="surface"
                              px="2"
                              py="0.5"
                              borderRadius="md"
                              fontSize="2xs"
                              fontWeight="medium"
                              textTransform="capitalize"
                            >
                              {post.conditionSpace}
                            </Badge>
                          </HStack>
                          <Text fontSize="2xs" color="fg.muted">
                            {new Date(post.createdAt).toLocaleDateString([], {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </Text>
                        </Stack>
                      </HStack>

                      <Badge
                        size="xs"
                        colorPalette="teal"
                        variant="subtle"
                        px="2"
                        py="0.5"
                        borderRadius="full"
                        fontSize="2xs"
                        fontWeight="semibold"
                      >
                        <HStack gap="1">
                          <LuShieldCheck size={12} />
                          <Text>{t("community.aiVerified")}</Text>
                        </HStack>
                      </Badge>
                    </Flex>

                    <Text fontSize="sm" color="fg" lineHeight="tall" mb="4">
                      {post.content}
                    </Text>

                    {/* Empathetic Reaction Buttons & Replies */}
                    <Flex
                      justify="space-between"
                      align="center"
                      pt="3"
                      borderTopWidth="1px"
                      borderColor="border.subtle"
                      wrap="wrap"
                      gap="2"
                    >
                      <HStack gap="2">
                        {/* 1. Relate Affirmation */}
                        <Button
                          size="xs"
                          px="3"
                          py="1.5"
                          borderRadius="full"
                          fontSize="xs"
                          fontWeight="medium"
                          variant={post.userRelate ? "solid" : "subtle"}
                          colorPalette="orange"
                          onClick={() => handleReaction(post.id, "relate")}
                        >
                          <HStack gap="1.5">
                            <LuHeart size={14} />
                            <Text>
                              {t("community.relate")} ({post.relateCount})
                            </Text>
                          </HStack>
                        </Button>

                        {/* 2. Sending Strength Cheer */}
                        <Button
                          size="xs"
                          px="3"
                          py="1.5"
                          borderRadius="full"
                          fontSize="xs"
                          fontWeight="medium"
                          variant={post.userStrength ? "solid" : "subtle"}
                          colorPalette="purple"
                          onClick={() => handleReaction(post.id, "strength")}
                        >
                          <HStack gap="1.5">
                            <LuSparkles size={14} />
                            <Text>
                              {t("community.strength")} ({post.strengthCount})
                            </Text>
                          </HStack>
                        </Button>

                        {/* 3. Helpful Perspective */}
                        <Button
                          size="xs"
                          px="3"
                          py="1.5"
                          borderRadius="full"
                          fontSize="xs"
                          fontWeight="medium"
                          variant={post.userHelpful ? "solid" : "subtle"}
                          colorPalette="teal"
                          onClick={() => handleReaction(post.id, "helpful")}
                        >
                          <HStack gap="1.5">
                            <LuSmile size={14} />
                            <Text>
                              {t("community.helpful")} ({post.helpfulCount})
                            </Text>
                          </HStack>
                        </Button>
                      </HStack>

                      {/* Comments toggle button */}
                      <Button
                        size="xs"
                        variant="ghost"
                        colorPalette="gray"
                        onClick={() => handleToggleComments(post.id)}
                      >
                        <HStack gap="1" color="fg.muted" fontSize="xs">
                          <LuMessageCircle size={15} />
                          <Text>
                            {post.commentsCount || comments.length} {t("community.replies")}
                          </Text>
                        </HStack>
                      </Button>
                    </Flex>

                    {/* Expandable Comments Section */}
                    {isCommentsOpen && (
                      <Box
                        mt="4"
                        pt="4"
                        borderTopWidth="1px"
                        borderColor="border.subtle"
                        bg="bg.subtle"
                        p="4"
                        borderRadius="2xl"
                      >
                        <Stack gap="3">
                          <Text fontSize="xs" fontWeight="bold">
                            Community Replies ({comments.length})
                          </Text>

                          {loadingComments ? (
                            <HStack gap="2" py="2" color="fg.muted" fontSize="xs">
                              <LuLoader size={14} className="spin" />
                              <Text>Loading replies...</Text>
                            </HStack>
                          ) : comments.length === 0 ? (
                            <Text fontSize="2xs" color="fg.muted">
                              No replies yet. Leave a kind word of support below.
                            </Text>
                          ) : (
                            <Stack gap="2.5">
                              {comments.map((c) => (
                                <Box
                                  key={c.id}
                                  p="3"
                                  borderRadius="xl"
                                  bg="bg.panel"
                                  borderWidth="1px"
                                  borderColor="border.subtle"
                                >
                                  <Flex justify="space-between" align="center" mb="1">
                                    <HStack gap="2">
                                      <Flex
                                        w="6"
                                        h="6"
                                        borderRadius="full"
                                        bg="teal.600"
                                        color="white"
                                        align="center"
                                        justify="center"
                                        fontSize="2xs"
                                        fontWeight="bold"
                                      >
                                        {c.authorAvatar || c.authorAlias.slice(0, 2).toUpperCase()}
                                      </Flex>
                                      <Text fontSize="xs" fontWeight="bold">
                                        {c.authorAlias}
                                      </Text>
                                    </HStack>
                                    <Text fontSize="3xs" color="fg.muted">
                                      {new Date(c.createdAt).toLocaleTimeString([], {
                                        hour: "2-digit",
                                        minute: "2-digit",
                                      })}
                                    </Text>
                                  </Flex>
                                  <Text fontSize="xs" color="fg" pl="8">
                                    {c.content}
                                  </Text>
                                </Box>
                              ))}
                            </Stack>
                          )}

                          {/* Add Reply Input */}
                          <HStack gap="2" mt="2">
                            <Input
                              placeholder="Add an empathetic, judgment-free reply..."
                              value={newCommentText}
                              onChange={(e) => setNewCommentText(e.target.value)}
                              size="sm"
                              borderRadius="xl"
                              bg="bg"
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  handleAddComment(post.id);
                                }
                              }}
                            />
                            <Button
                              size="sm"
                              px="3"
                              borderRadius="xl"
                              colorPalette="orange"
                              disabled={!newCommentText.trim() || submittingComment}
                              onClick={() => handleAddComment(post.id)}
                            >
                              <LuSend size={14} />
                            </Button>
                          </HStack>
                        </Stack>
                      </Box>
                    )}
                  </Box>
                );
              })}
            </Stack>
          )}
        </Stack>
      </Container>

      {/* Non-Punitive Coaching Modal */}
      {showCoachingModal && (
        <Box
          position="fixed"
          inset="0"
          bg="black/75"
          backdropFilter="blur(8px)"
          zIndex={2000}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="4"
        >
          <Box
            maxW="md"
            w="100%"
            bg="bg.panel"
            borderWidth="1px"
            borderColor="orange.500/40"
            borderRadius="3xl"
            boxShadow="0 25px 60px -15px rgba(234, 88, 12, 0.35)"
            p="6"
          >
            <Stack gap="4">
              <Flex justify="space-between" align="center">
                <HStack gap="2" color="orange.600">
                  <LuShieldAlert size={22} />
                  <Text fontSize="md" fontWeight="bold">
                    Compassionate Guidance
                  </Text>
                </HStack>
                <IconButton
                  aria-label="Close"
                  variant="ghost"
                  size="xs"
                  onClick={() => setShowCoachingModal(false)}
                >
                  <LuX size={16} />
                </IconButton>
              </Flex>

              <Box p="4" borderRadius="2xl" bg="orange.500/10" borderWidth="1px" borderColor="orange.500/25">
                <Text fontSize="xs" color="fg" lineHeight="tall">
                  {coachingMessage}
                </Text>
              </Box>

              <Text fontSize="2xs" color="fg.muted">
                BridgeCare is a safe sanctuary. We encourage you to focus on your personal emotional feelings rather than medical dosing or dismissive language.
              </Text>

              <Flex justify="flex-end" gap="2">
                <Button
                  size="sm"
                  borderRadius="xl"
                  bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                  color="white"
                  onClick={() => setShowCoachingModal(false)}
                >
                  <HStack gap="1.5">
                    <LuCheck size={14} />
                    <Text>I Understand & Will Rephrase</Text>
                  </HStack>
                </Button>
              </Flex>
            </Stack>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CommunityPosts;
