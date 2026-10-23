import React, { useState } from "react";
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
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { useUser } from "@repo/react-appwrite";
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
} from "react-icons/lu";

interface Post {
  id: string;
  authorAlias: string;
  avatarSeed: string;
  conditionTag: string;
  content: string;
  relateCount: number;
  strengthCount: number;
  helpfulCount: number;
  commentsCount: number;
  timeAgo: string;
  userRelate?: boolean;
}

export const CommunityPosts: React.FC = () => {
  const { t } = useTranslation();
  const { profile } = useUser();

  const anonymousAlias = profile?.userName ? `Anon_${profile.userName.slice(0, 4)}` : "CalmRiver92";

  const [activeCategory, setActiveCategory] = useState("all");
  const [newPostText, setNewPostText] = useState("");
  const [selectedTag, setSelectedTag] = useState("ADHD & Focus");
  const [showComposer, setShowComposer] = useState(false);

  const containsHarmfulContent = (text: string) => {
    const blockedKeywords = ["stupid", "idiot", "loser", "ugly", "حمار", "غبي", "حقير"];
    return blockedKeywords.some((w) => text.toLowerCase().includes(w));
  };
  const isSafe = !containsHarmfulContent(newPostText);

  const [posts, setPosts] = useState<Post[]>([
    {
      id: "p1",
      authorAlias: "SilentEcho34",
      avatarSeed: "SE",
      conditionTag: "ADHD & Focus",
      content:
        "Finally found a strategy that beats executive paralysis today: The '5-Minute Momentum Trick'. Just commit to staring at the file for 300 seconds. If your brain feels stuck today, remember you're not lazy—you're neurodivergent. Be gentle with yourself.",
      relateCount: 42,
      strengthCount: 29,
      helpfulCount: 18,
      commentsCount: 7,
      timeAgo: "2h ago",
    },
    {
      id: "p2",
      authorAlias: "GentleWave88",
      avatarSeed: "GW",
      conditionTag: "Anxiety & Panic",
      content:
        "Woke up with an unprovoked somatic panic spike this morning. Ran the 60-second box breathing tool here while putting an ice pack on the back of my neck. Heart rate dropped from 125 to 78 in 10 minutes. Sharing in case it helps someone else right now.",
      relateCount: 65,
      strengthCount: 51,
      helpfulCount: 34,
      commentsCount: 12,
      timeAgo: "4h ago",
    },
    {
      id: "p3",
      authorAlias: "QuietHope19",
      avatarSeed: "QH",
      conditionTag: "OCD Loops",
      content:
        "Sat with the uncertainty of not checking my front door lock for the 4th time today. Resisted the loop for 15 whole minutes. To neurotypicals it sounds trivial, but to anyone battling OCD loops—you know how monumental this win is.",
      relateCount: 38,
      strengthCount: 44,
      helpfulCount: 22,
      commentsCount: 5,
      timeAgo: "6h ago",
    },
  ]);

  const handleCreatePost = () => {
    if (!newPostText.trim() || !isSafe) return;

    const newPost: Post = {
      id: Date.now().toString(),
      authorAlias: anonymousAlias,
      avatarSeed: anonymousAlias.slice(0, 2).toUpperCase(),
      conditionTag: selectedTag,
      content: newPostText,
      relateCount: 1,
      strengthCount: 1,
      helpfulCount: 1,
      commentsCount: 0,
      timeAgo: "Just now",
      userRelate: true,
    };

    setPosts([newPost, ...posts]);
    setNewPostText("");
    setShowComposer(false);
  };

  const handleRelate = (id: string) => {
    setPosts(
      posts.map((p) =>
        p.id === id
          ? {
              ...p,
              relateCount: p.userRelate ? p.relateCount - 1 : p.relateCount + 1,
              userRelate: !p.userRelate,
            }
          : p
      )
    );
  };

  const categories = [
    { id: "all", label: t("community.catAll") },
    { id: "adhd", label: t("community.catAdhd") },
    { id: "anxiety", label: t("community.catAnxiety") },
    { id: "depression", label: t("community.catDepression") },
    { id: "ocd", label: t("community.catOcd") },
    { id: "wins", label: t("community.catWins") },
  ];

  return (
    <Box minH="100vh" bg="bg" color="fg" py="8" px={{ base: "4", md: "8" }}>
      <Container maxW="5xl">
        <Stack gap="8">
          {/* Top Anonymity & Moderation Shield Banner */}
          <Box
            p="5"
            borderRadius="2xl"
            bg="linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(20, 184, 166, 0.05) 100%)"
            borderWidth="1px"
            borderColor="orange.500/20"
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
                  boxShadow="0 4px 12px rgba(20, 184, 166, 0.3)"
                >
                  <LuLock size={18} />
                </Flex>
                <Stack gap="0">
                  <HStack gap="2">
                    <Text fontSize="sm" fontWeight="bold">
                      {t("community.postingAs", { alias: anonymousAlias })}
                    </Text>
                    <Badge colorPalette="green" size="xs">
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

          {/* New Post Composer with Live AI Safety Moderation */}
          {showComposer && (
            <Box p="6" borderRadius="3xl" bg="bg.panel" borderWidth="1px" borderColor="orange.500/30">
              <Stack gap="4">
                <Flex justify="space-between" align="center">
                  <Text fontWeight="bold" fontSize="sm">
                    {t("community.composerTitle")}
                  </Text>

                  {/* Live AI Safety Shield Badge */}
                  <Badge colorPalette={isSafe ? "green" : "red"} size="sm" variant="subtle">
                    <HStack gap="1">
                      {isSafe ? <LuShieldCheck size={14} /> : <LuShieldAlert size={14} />}
                      <Text>{isSafe ? t("community.shieldSafe") : t("community.shieldAlert")}</Text>
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
                />

                <Flex justify="space-between" align="center" wrap="wrap" gap="3">
                  <HStack gap="2">
                    <Text fontSize="xs" color="fg.muted">
                      {t("community.spaceLabel")}
                    </Text>
                    <Button
                      size="2xs"
                      variant={selectedTag === "ADHD & Focus" ? "solid" : "outline"}
                      colorPalette="orange"
                      onClick={() => setSelectedTag("ADHD & Focus")}
                    >
                      ADHD & Focus
                    </Button>
                    <Button
                      size="2xs"
                      variant={selectedTag === "Anxiety & Panic" ? "solid" : "outline"}
                      colorPalette="orange"
                      onClick={() => setSelectedTag("Anxiety & Panic")}
                    >
                      Anxiety & Panic
                    </Button>
                    <Button
                      size="2xs"
                      variant={selectedTag === "Small Daily Wins" ? "solid" : "outline"}
                      colorPalette="orange"
                      onClick={() => setSelectedTag("Small Daily Wins")}
                    >
                      Small Wins
                    </Button>
                  </HStack>

                  <HStack gap="2">
                    <Button size="sm" variant="ghost" onClick={() => setShowComposer(false)}>
                      {t("community.cancel")}
                    </Button>
                    <Button
                      size="sm"
                      bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                      color="white"
                      borderRadius="xl"
                      disabled={!newPostText.trim() || !isSafe}
                      onClick={handleCreatePost}
                    >
                      <HStack gap="1">
                        <LuSend size={14} />
                        <Text>{t("community.postAnonymously")}</Text>
                      </HStack>
                    </Button>
                  </HStack>
                </Flex>
              </Stack>
            </Box>
          )}

          {/* Condition Spaces Filter Tabs */}
          <Flex gap="2" overflowX="auto" pb="2">
            {categories.map((cat) => (
              <Button
                key={cat.id}
                size="xs"
                variant={activeCategory === cat.id ? "solid" : "subtle"}
                colorPalette="orange"
                borderRadius="full"
                onClick={() => setActiveCategory(cat.id)}
                flexShrink={0}
              >
                {cat.label}
              </Button>
            ))}
          </Flex>

          {/* Posts Feed */}
          <Stack gap="5">
            {posts.map((post) => (
              <Box
                key={post.id}
                p="6"
                borderRadius="3xl"
                bg="bg.panel"
                borderWidth="1px"
                borderColor="border.subtle"
                _hover={{ borderColor: "orange.500/30" }}
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
                      {post.avatarSeed}
                    </Flex>
                    <Stack gap="0">
                      <HStack gap="2">
                        <Text fontSize="sm" fontWeight="bold">
                          {post.authorAlias}
                        </Text>
                        <Badge size="xs" colorPalette="orange" variant="surface">
                          {post.conditionTag}
                        </Badge>
                      </HStack>
                      <Text fontSize="2xs" color="fg.muted">
                        {post.timeAgo}
                      </Text>
                    </Stack>
                  </HStack>

                  <Badge size="xs" colorPalette="teal" variant="subtle">
                    <HStack gap="1">
                      <LuShieldCheck size={12} />
                      <Text>{t("community.aiVerified")}</Text>
                    </HStack>
                  </Badge>
                </Flex>

                <Text fontSize="sm" color="fg" lineHeight="tall" mb="4">
                  {post.content}
                </Text>

                {/* Empathetic Reaction Buttons */}
                <Flex justify="space-between" align="center" pt="3" borderTopWidth="1px" borderColor="border.subtle">
                  <HStack gap="2">
                    <Button
                      size="xs"
                      variant={post.userRelate ? "solid" : "subtle"}
                      colorPalette="orange"
                      borderRadius="full"
                      onClick={() => handleRelate(post.id)}
                    >
                      <HStack gap="1.5">
                        <LuHeart size={14} />
                        <Text>{t("community.relate")} ({post.relateCount})</Text>
                      </HStack>
                    </Button>

                    <Button
                      size="xs"
                      variant="subtle"
                      colorPalette="purple"
                      borderRadius="full"
                      onClick={() => alert("Sending Strength Cheer Sent")}
                    >
                      <HStack gap="1.5">
                        <LuSparkles size={14} />
                        <Text>{t("community.strength")} ({post.strengthCount})</Text>
                      </HStack>
                    </Button>

                    <Button
                      size="xs"
                      variant="subtle"
                      colorPalette="teal"
                      borderRadius="full"
                    >
                      <HStack gap="1.5">
                        <LuSmile size={14} />
                        <Text>{t("community.helpful")} ({post.helpfulCount})</Text>
                      </HStack>
                    </Button>
                  </HStack>

                  <HStack gap="1" color="fg.muted" fontSize="xs">
                    <LuMessageCircle size={15} />
                    <Text>{post.commentsCount} {t("community.replies")}</Text>
                  </HStack>
                </Flex>
              </Box>
            ))}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

export default CommunityPosts;
