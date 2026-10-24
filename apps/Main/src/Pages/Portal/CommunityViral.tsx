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
  IconButton,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import {
  LuFlame,
  LuSparkles,
  LuHeart,
  LuMessageCircle,
  LuSmile,
  LuBookOpen,
  LuX,
  LuShieldCheck,
  LuLoader,
} from "react-icons/lu";
import type { CommunityPost } from "../../services/communityService";
import {
  fetchViralStories,
  togglePostReaction,
} from "../../services/communityService";

export const CommunityViral: React.FC = () => {
  const { t } = useTranslation();
  const [viralPosts, setViralPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedStory, setSelectedStory] = useState<CommunityPost | null>(null);

  useEffect(() => {
    let isMounted = true;
    fetchViralStories()
      .then((data) => {
        if (isMounted) {
          setViralPosts(data);
          setLoading(false);
        }
      })
      .catch(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const handleReaction = async (
    postId: string,
    reactionType: "relate" | "strength" | "helpful"
  ) => {
    const post = viralPosts.find((p) => p.id === postId);
    if (!post) return;

    const currentActive =
      reactionType === "relate"
        ? !!post.userRelate
        : reactionType === "strength"
        ? !!post.userStrength
        : !!post.userHelpful;

    const delta = currentActive ? -1 : 1;

    // Optimistic update
    setViralPosts((prev) =>
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

    if (selectedStory && selectedStory.id === postId) {
      setSelectedStory((prev) =>
        prev
          ? {
              ...prev,
              relateCount: reactionType === "relate" ? Math.max(0, prev.relateCount + delta) : prev.relateCount,
              strengthCount: reactionType === "strength" ? Math.max(0, prev.strengthCount + delta) : prev.strengthCount,
              helpfulCount: reactionType === "helpful" ? Math.max(0, prev.helpfulCount + delta) : prev.helpfulCount,
              userRelate: reactionType === "relate" ? !currentActive : prev.userRelate,
              userStrength: reactionType === "strength" ? !currentActive : prev.userStrength,
              userHelpful: reactionType === "helpful" ? !currentActive : prev.userHelpful,
            }
          : null
      );
    }

    await togglePostReaction(postId, reactionType, currentActive);
  };

  return (
    <Box minH="100vh" bg="bg" color="fg" py="8" px={{ base: "4", md: "8" }}>
      <Container maxW="5xl">
        <Stack gap="8">
          <Stack gap="2">
            <HStack gap="2">
              <LuFlame size={24} color="#ea580c" />
              <Text fontSize="2xl" fontWeight="bold">
                {t("community.viralTitle")}
              </Text>
            </HStack>
            <Text fontSize="sm" color="fg.muted">
              {t("community.viralSubtitle")}
            </Text>
          </Stack>

          {loading ? (
            <Flex justify="center" align="center" py="16">
              <HStack gap="3" color="orange.600">
                <LuLoader size={20} className="spin" />
                <Text fontSize="sm">Loading highest-empathy viral stories...</Text>
              </HStack>
            </Flex>
          ) : (
            <Stack gap="6">
              {viralPosts.map((tp, idx) => {
                const totalEmpathy = (tp.relateCount || 0) + (tp.strengthCount || 0) + (tp.helpfulCount || 0);
                const badgeLabel =
                  idx === 0
                    ? t("community.viral1Badge") || "Most Empathized"
                    : idx === 1
                    ? t("community.viral2Badge") || "Community Breakthrough"
                    : "Trending Story";

                return (
                  <Box
                    key={tp.id}
                    p="7"
                    borderRadius="3xl"
                    bg="bg.panel"
                    borderWidth="1px"
                    borderColor="orange.500/30"
                    boxShadow="0 10px 30px -10px rgba(234, 88, 12, 0.12)"
                    _hover={{ borderColor: "orange.500/50" }}
                    transition="all 0.2s"
                  >
                    <Flex justify="space-between" align="center" mb="3">
                      <HStack gap="2">
                        <Badge
                          colorPalette="orange"
                          size="sm"
                          px="2.5"
                          py="1"
                          borderRadius="full"
                          fontSize="xs"
                          fontWeight="semibold"
                        >
                          <HStack gap="1">
                            <LuFlame size={13} />
                            <Text>{badgeLabel}</Text>
                          </HStack>
                        </Badge>
                        <Badge
                          colorPalette="teal"
                          size="sm"
                          px="2.5"
                          py="1"
                          borderRadius="full"
                          fontSize="xs"
                          fontWeight="semibold"
                          textTransform="capitalize"
                        >
                          {tp.conditionSpace}
                        </Badge>
                      </HStack>
                      <HStack gap="2">
                        <Badge size="xs" variant="subtle" colorPalette="green">
                          <HStack gap="1">
                            <LuShieldCheck size={11} />
                            <Text>AI Safe</Text>
                          </HStack>
                        </Badge>
                        <Text fontSize="xs" color="fg.muted">
                          {tp.authorAlias}
                        </Text>
                      </HStack>
                    </Flex>

                    <Text fontSize="md" fontWeight="semibold" mb="3" color="fg" lineHeight="tall">
                      {tp.content.length > 220 ? `${tp.content.slice(0, 220)}...` : tp.content}
                    </Text>

                    <Flex
                      justify="space-between"
                      align="center"
                      pt="3"
                      borderTopWidth="1px"
                      borderColor="border.subtle"
                      wrap="wrap"
                      gap="3"
                    >
                      <HStack gap="4">
                        <Button
                          size="xs"
                          variant={tp.userRelate ? "solid" : "ghost"}
                          colorPalette="orange"
                          borderRadius="full"
                          px="2.5"
                          onClick={() => handleReaction(tp.id, "relate")}
                        >
                          <HStack gap="1" fontSize="xs" fontWeight="bold">
                            <LuHeart size={15} />
                            <Text>
                              {tp.relateCount} {t("community.relatesCount")}
                            </Text>
                          </HStack>
                        </Button>

                        <Button
                          size="xs"
                          variant={tp.userStrength ? "solid" : "ghost"}
                          colorPalette="purple"
                          borderRadius="full"
                          px="2.5"
                          onClick={() => handleReaction(tp.id, "strength")}
                        >
                          <HStack gap="1" fontSize="xs" fontWeight="bold">
                            <LuSparkles size={15} />
                            <Text>
                              {tp.strengthCount} {t("community.cheersCount")}
                            </Text>
                          </HStack>
                        </Button>

                        <HStack gap="1.5" color="fg.muted" fontSize="xs">
                          <LuMessageCircle size={15} />
                          <Text>
                            {tp.commentsCount || 0} {t("community.repliesCount")}
                          </Text>
                        </HStack>

                        <Badge colorPalette="gray" size="xs" variant="surface">
                          Total Empathy: {totalEmpathy}
                        </Badge>
                      </HStack>

                      <Button
                        size="xs"
                        px="3.5"
                        py="1.5"
                        borderRadius="xl"
                        fontSize="xs"
                        fontWeight="medium"
                        variant="subtle"
                        colorPalette="orange"
                        onClick={() => setSelectedStory(tp)}
                      >
                        <HStack gap="1.5">
                          <LuBookOpen size={13} />
                          <Text>{t("community.readFullStory")}</Text>
                        </HStack>
                      </Button>
                    </Flex>
                  </Box>
                );
              })}
            </Stack>
          )}
        </Stack>
      </Container>

      {/* Full Story Reader Modal */}
      {selectedStory && (
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
            maxW="xl"
            w="100%"
            bg="bg.panel"
            borderWidth="1px"
            borderColor="orange.500/40"
            borderRadius="3xl"
            boxShadow="0 25px 60px -15px rgba(234, 88, 12, 0.35)"
            p="7"
          >
            <Stack gap="5">
              <Flex justify="space-between" align="center">
                <HStack gap="2">
                  <Badge colorPalette="orange" size="sm" px="2.5" py="1" borderRadius="full">
                    <HStack gap="1">
                      <LuFlame size={12} />
                      <Text>Featured Story</Text>
                    </HStack>
                  </Badge>
                  <Badge colorPalette="teal" size="sm" px="2.5" py="1" borderRadius="full">
                    {selectedStory.conditionSpace}
                  </Badge>
                </HStack>

                <IconButton
                  aria-label="Close"
                  variant="ghost"
                  size="xs"
                  onClick={() => setSelectedStory(null)}
                >
                  <LuX size={16} />
                </IconButton>
              </Flex>

              <HStack gap="3">
                <Flex
                  w="10"
                  h="10"
                  borderRadius="full"
                  bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                  color="white"
                  align="center"
                  justify="center"
                  fontSize="sm"
                  fontWeight="bold"
                >
                  {selectedStory.authorAvatar || selectedStory.authorAlias.slice(0, 2).toUpperCase()}
                </Flex>
                <Stack gap="0">
                  <Text fontSize="sm" fontWeight="bold">
                    {selectedStory.authorAlias}
                  </Text>
                  <Text fontSize="2xs" color="fg.muted">
                    Published anonymously into BridgeCare sanctuary
                  </Text>
                </Stack>
              </HStack>

              <Box p="5" borderRadius="2xl" bg="bg.subtle" borderWidth="1px" borderColor="border.subtle">
                <Text fontSize="sm" color="fg" lineHeight="tall" whiteSpace="pre-wrap">
                  {selectedStory.content}
                </Text>
              </Box>

              <Flex justify="space-between" align="center" pt="2">
                <HStack gap="2">
                  <Button
                    size="xs"
                    variant={selectedStory.userRelate ? "solid" : "subtle"}
                    colorPalette="orange"
                    borderRadius="full"
                    onClick={() => handleReaction(selectedStory.id, "relate")}
                  >
                    <HStack gap="1">
                      <LuHeart size={14} />
                      <Text>Relate ({selectedStory.relateCount})</Text>
                    </HStack>
                  </Button>

                  <Button
                    size="xs"
                    variant={selectedStory.userStrength ? "solid" : "subtle"}
                    colorPalette="purple"
                    borderRadius="full"
                    onClick={() => handleReaction(selectedStory.id, "strength")}
                  >
                    <HStack gap="1">
                      <LuSparkles size={14} />
                      <Text>Strength ({selectedStory.strengthCount})</Text>
                    </HStack>
                  </Button>

                  <Button
                    size="xs"
                    variant={selectedStory.userHelpful ? "solid" : "subtle"}
                    colorPalette="teal"
                    borderRadius="full"
                    onClick={() => handleReaction(selectedStory.id, "helpful")}
                  >
                    <HStack gap="1">
                      <LuSmile size={14} />
                      <Text>Helpful ({selectedStory.helpfulCount})</Text>
                    </HStack>
                  </Button>
                </HStack>

                <Button
                  size="sm"
                  variant="outline"
                  borderRadius="xl"
                  onClick={() => setSelectedStory(null)}
                >
                  Close Story
                </Button>
              </Flex>
            </Stack>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default CommunityViral;
