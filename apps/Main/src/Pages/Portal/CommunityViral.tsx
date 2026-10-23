import React from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  HStack,
  Stack,
  Text,
  Badge,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import {
  LuFlame,
  LuSparkles,
  LuHeart,
  LuMessageCircle,
} from "react-icons/lu";

export const CommunityViral: React.FC = () => {
  const { t } = useTranslation();

  const trendingPosts = [
    {
      id: "v1",
      alias: "BraveSoul42",
      badge: t("community.viral1Badge"),
      condition: t("community.viral1Condition"),
      title: t("community.viral1Title"),
      snippet: t("community.viral1Snippet"),
      relates: 489,
      cheers: 312,
      comments: 64,
    },
    {
      id: "v2",
      alias: "StillOcean99",
      badge: t("community.viral2Badge"),
      condition: t("community.viral2Condition"),
      title: t("community.viral2Title"),
      snippet: t("community.viral2Snippet"),
      relates: 742,
      cheers: 588,
      comments: 91,
    },
  ];

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

          <Stack gap="6">
            {trendingPosts.map((tp) => (
              <Box
                key={tp.id}
                p="7"
                borderRadius="3xl"
                bg="bg.panel"
                borderWidth="1px"
                borderColor="orange.500/30"
                boxShadow="0 10px 30px -10px rgba(234, 88, 12, 0.12)"
              >
                <Flex justify="space-between" align="center" mb="3">
                  <HStack gap="2">
                    <Badge colorPalette="orange" size="sm">
                      <HStack gap="1">
                        <LuFlame size={13} />
                        <Text>{tp.badge}</Text>
                      </HStack>
                    </Badge>
                    <Badge colorPalette="gray" size="sm">
                      {tp.condition}
                    </Badge>
                  </HStack>
                  <Text fontSize="xs" color="fg.muted">
                    {tp.alias}
                  </Text>
                </Flex>

                <Text fontSize="lg" fontWeight="bold" mb="2">
                  {tp.title}
                </Text>
                <Text fontSize="sm" color="fg.muted" lineHeight="tall" mb="5">
                  {tp.snippet}
                </Text>

                <Flex justify="space-between" align="center" pt="3" borderTopWidth="1px" borderColor="border.subtle">
                  <HStack gap="4">
                    <HStack gap="1.5" color="orange.600" fontSize="xs" fontWeight="bold">
                      <LuHeart size={16} />
                      <Text>{tp.relates} {t("community.relatesCount")}</Text>
                    </HStack>
                    <HStack gap="1.5" color="purple.600" fontSize="xs" fontWeight="bold">
                      <LuSparkles size={16} />
                      <Text>{tp.cheers} {t("community.cheersCount")}</Text>
                    </HStack>
                    <HStack gap="1.5" color="fg.muted" fontSize="xs">
                      <LuMessageCircle size={16} />
                      <Text>{tp.comments} {t("community.repliesCount")}</Text>
                    </HStack>
                  </HStack>

                  <Button size="xs" variant="subtle" colorPalette="orange" borderRadius="xl">
                    {t("community.readFullStory")}
                  </Button>
                </Flex>
              </Box>
            ))}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

export default CommunityViral;
