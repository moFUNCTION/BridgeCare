import React, { useState, useEffect } from "react";
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
  LuSparkles,
  LuSmile,
  LuTrash2,
} from "react-icons/lu";
import type { CommunityNotification } from "../../services/communityService";
import {
  fetchNotifications,
  markAllNotificationsAsRead,
} from "../../services/communityService";

export const CommunityNotifications: React.FC = () => {
  const { t } = useTranslation();
  const [notifications, setNotifications] = useState<CommunityNotification[]>([]);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  useEffect(() => {
    setNotifications(fetchNotifications());
  }, []);

  const handleMarkAllRead = () => {
    markAllNotificationsAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearAll = () => {
    localStorage.removeItem("bridgecare_community_notifications_cache");
    setNotifications([]);
  };

  const filteredNotifs = notifications.filter((n) => (filter === "unread" ? !n.read : true));
  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: CommunityNotification["type"]) => {
    switch (type) {
      case "relate":
        return <LuHeart size={18} color="#ea580c" />;
      case "strength":
        return <LuSparkles size={18} color="#9333ea" />;
      case "helpful":
        return <LuSmile size={18} color="#0d9488" />;
      case "reply":
        return <LuMessageCircle size={18} color="#3b82f6" />;
      case "system":
      default:
        return <LuShieldCheck size={18} color="#16a34a" />;
    }
  };

  return (
    <Box minH="100vh" bg="bg" color="fg" py="8" px={{ base: "4", md: "8" }}>
      <Container maxW="4xl">
        <Stack gap="6">
          <Flex justify="space-between" align="center" wrap="wrap" gap="3">
            <HStack gap="2.5">
              <LuBell size={22} color="#ea580c" />
              <Text fontSize="2xl" fontWeight="bold">
                {t("community.notifsTitle")}
              </Text>
              {unreadCount > 0 && (
                <Badge colorPalette="orange" size="sm" px="2.5" py="0.5" borderRadius="full">
                  {unreadCount} unread
                </Badge>
              )}
            </HStack>

            <HStack gap="2">
              <Button
                size="xs"
                variant={filter === "all" ? "solid" : "ghost"}
                colorPalette="orange"
                borderRadius="xl"
                onClick={() => setFilter("all")}
              >
                All
              </Button>
              <Button
                size="xs"
                variant={filter === "unread" ? "solid" : "ghost"}
                colorPalette="orange"
                borderRadius="xl"
                onClick={() => setFilter("unread")}
              >
                Unread ({unreadCount})
              </Button>

              <Button
                size="xs"
                px="2.5"
                py="1.5"
                borderRadius="xl"
                fontSize="xs"
                fontWeight="semibold"
                variant="outline"
                colorPalette="orange"
                onClick={handleMarkAllRead}
              >
                <HStack gap="1">
                  <LuCheckCheck size={14} />
                  <Text>{t("community.markAllRead")}</Text>
                </HStack>
              </Button>

              {notifications.length > 0 && (
                <Button
                  size="xs"
                  px="2"
                  py="1.5"
                  borderRadius="xl"
                  variant="ghost"
                  colorPalette="red"
                  onClick={handleClearAll}
                >
                  <LuTrash2 size={14} />
                </Button>
              )}
            </HStack>
          </Flex>

          {filteredNotifs.length === 0 ? (
            <Box
              p="12"
              borderRadius="3xl"
              bg="bg.panel"
              textAlign="center"
              borderWidth="1px"
              borderColor="border.subtle"
            >
              <Text fontSize="md" fontWeight="bold" mb="1">
                No notifications right now
              </Text>
              <Text fontSize="xs" color="fg.muted">
                When fellow sanctuary members empathize with your stories or send cheers, they will appear here.
              </Text>
            </Box>
          ) : (
            <Stack gap="3">
              {filteredNotifs.map((item) => (
                <Box
                  key={item.id}
                  p="5"
                  borderRadius="2xl"
                  bg={!item.read ? "bg.panel" : "bg.subtle"}
                  borderWidth="1px"
                  borderColor={!item.read ? "orange.500/35" : "border.subtle"}
                  boxShadow={!item.read ? "sm" : "none"}
                  transition="all 0.2s"
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
                        borderWidth="1px"
                        borderColor="border.subtle"
                      >
                        {getIcon(item.type)}
                      </Flex>
                      <Stack gap="1">
                        <HStack gap="2">
                          <Text fontSize="sm" fontWeight="bold">
                            {item.title}
                          </Text>
                          {!item.read && (
                            <Badge
                              colorPalette="orange"
                              size="xs"
                              px="2"
                              py="0.5"
                              borderRadius="full"
                              fontSize="2xs"
                              fontWeight="semibold"
                            >
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
                      {new Date(item.createdAt).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Text>
                  </Flex>
                </Box>
              ))}
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default CommunityNotifications;
