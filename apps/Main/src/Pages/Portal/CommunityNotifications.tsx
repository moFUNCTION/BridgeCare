import React from "react";
import {
  Box,
  Container,
  Flex,
  HStack,
  Stack,
  Text,
  Badge,
  Button,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import {
  LuBell,
  LuHeart,
  LuMessageCircle,
  LuShieldCheck,
  LuCheckCheck,
} from "react-icons/lu";

export const CommunityNotifications: React.FC = () => {
  const { t } = useTranslation();

  const notifications = [
    {
      id: "n1",
      icon: <LuHeart size={18} color="#ea580c" />,
      title: t("community.notif1Title"),
      message: t("community.notif1Message"),
      time: "15m ago",
      unread: true,
    },
    {
      id: "n2",
      icon: <LuMessageCircle size={18} color="#3b82f6" />,
      title: t("community.notif2Title"),
      message: t("community.notif2Message"),
      time: "2h ago",
      unread: true,
    },
    {
      id: "n3",
      icon: <LuShieldCheck size={18} color="#16a34a" />,
      title: t("community.notif3Title"),
      message: t("community.notif3Message"),
      time: "Yesterday",
      unread: false,
    },
  ];

  return (
    <Box minH="100vh" bg="bg" color="fg" py="8" px={{ base: "4", md: "8" }}>
      <Container maxW="4xl">
        <Stack gap="6">
          <Flex justify="space-between" align="center">
            <HStack gap="2">
              <LuBell size={22} color="#ea580c" />
              <Text fontSize="2xl" fontWeight="bold">
                {t("community.notifsTitle")}
              </Text>
            </HStack>

            <Button size="xs" variant="ghost" colorPalette="orange">
              <HStack gap="1">
                <LuCheckCheck size={14} />
                <Text>{t("community.markAllRead")}</Text>
              </HStack>
            </Button>
          </Flex>

          <Stack gap="3">
            {notifications.map((item) => (
              <Box
                key={item.id}
                p="5"
                borderRadius="2xl"
                bg={item.unread ? "bg.panel" : "bg.subtle"}
                borderWidth="1px"
                borderColor={item.unread ? "orange.500/30" : "border.subtle"}
                boxShadow={item.unread ? "sm" : "none"}
              >
                <Flex justify="space-between" align="start" gap="4">
                  <HStack gap="3" align="start">
                    <Flex
                      w="10"
                      h="10"
                      borderRadius="xl"
                      bg="bg.subtle"
                      align="center"
                      justify="center"
                      flexShrink={0}
                    >
                      {item.icon}
                    </Flex>
                    <Stack gap="1">
                      <HStack gap="2">
                        <Text fontSize="sm" fontWeight="bold">
                          {item.title}
                        </Text>
                        {item.unread && (
                          <Badge colorPalette="orange" size="xs">
                            {t("community.badgeNew")}
                          </Badge>
                        )}
                      </HStack>
                      <Text fontSize="xs" color="fg.muted" lineHeight="tall">
                        {item.message}
                      </Text>
                    </Stack>
                  </HStack>

                  <Text fontSize="2xs" color="fg.muted" flexShrink={0}>
                    {item.time}
                  </Text>
                </Flex>
              </Box>
            ))}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

export default CommunityNotifications;
