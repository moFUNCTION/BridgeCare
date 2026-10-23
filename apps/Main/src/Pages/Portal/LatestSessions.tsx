import React, { useState } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  Grid,
  HStack,
  Stack,
  Text,
  Badge,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import {
  LuCalendar,
  LuVideo,
  LuSparkles,
  LuPill,
} from "react-icons/lu";

export const LatestSessions: React.FC = () => {
  const { t } = useTranslation();

  const [activeSessionView, setActiveSessionView] = useState<"history" | "telehealth">("history");

  const sessions = [
    {
      id: "sess-8",
      sessionNumber: t("sessions.sess8Title"),
      doctor: t("sessions.sess8Doctor"),
      date: t("sessions.sess8Date"),
      status: t("sessions.sess8Status"),
      notes: t("sessions.sess8Notes"),
      prescription: t("sessions.sess8Plan"),
    },
    {
      id: "sess-1",
      sessionNumber: t("sessions.sess1Title"),
      doctor: t("sessions.sess1Doctor"),
      date: t("sessions.sess1Date"),
      status: t("sessions.sess1Status"),
      notes: t("sessions.sess1Notes"),
      prescription: t("sessions.sess1Plan"),
    },
  ];

  return (
    <Box minH="100vh" bg="bg" color="fg" py="8" px={{ base: "4", md: "8" }}>
      <Container maxW="6xl">
        <Stack gap="8">
          {/* Header */}
          <Flex
            direction={{ base: "column", sm: "row" }}
            justify="space-between"
            align={{ base: "start", sm: "center" }}
            gap="4"
          >
            <Stack gap="1">
              <HStack gap="2">
                <LuCalendar size={22} color="#ea580c" />
                <Text fontSize="2xl" fontWeight="bold">
                  {t("sessions.title")}
                </Text>
              </HStack>
              <Text fontSize="sm" color="fg.muted">
                {t("sessions.subtitle")}
              </Text>
            </Stack>

            <HStack gap="2">
              <Button
                size="sm"
                variant={activeSessionView === "history" ? "solid" : "subtle"}
                colorPalette="orange"
                onClick={() => setActiveSessionView("history")}
              >
                {t("sessions.historyTab")}
              </Button>
              <Button
                size="sm"
                variant={activeSessionView === "telehealth" ? "solid" : "subtle"}
                colorPalette="orange"
                onClick={() => setActiveSessionView("telehealth")}
              >
                <HStack gap="1.5">
                  <LuVideo size={14} />
                  <Text>{t("sessions.telehealthTab")}</Text>
                </HStack>
              </Button>
            </HStack>
          </Flex>

          {/* Telehealth Room Simulation View */}
          {activeSessionView === "telehealth" ? (
            <Grid templateColumns={{ base: "1fr", lg: "2fr 1fr" }} gap="6">
              {/* Video consultation canvas */}
              <Box
                h="460px"
                borderRadius="3xl"
                bg="radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)"
                borderWidth="2px"
                borderColor="orange.500/30"
                p="6"
                display="flex"
                flexDirection="column"
                justifyContent="space-between"
                color="white"
                position="relative"
              >
                <Flex justify="space-between" align="center">
                  <HStack gap="2">
                    <Badge colorPalette="green" size="md">
                      {t("sessions.liveBadge")}
                    </Badge>
                    <Text fontSize="xs" fontWeight="bold">
                      {t("sessions.withDoctor", { name: "Dr. Tarek Al-Mansouri" })}
                    </Text>
                  </HStack>
                  <Text fontSize="xs" opacity={0.8}>
                    32:40 / 50:00
                  </Text>
                </Flex>

                <Flex direction="column" align="center" justify="center" gap="3">
                  <Flex
                    w="24"
                    h="24"
                    borderRadius="full"
                    bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                    align="center"
                    justify="center"
                    fontSize="2xl"
                    fontWeight="bold"
                    boxShadow="0 0 35px rgba(234, 88, 12, 0.4)"
                  >
                    TM
                  </Flex>
                  <Text fontWeight="bold" fontSize="md">
                    {t("sessions.connectedStatus", { name: "Dr. Tarek Al-Mansouri" })}
                  </Text>
                  <Text fontSize="xs" color="gray.300">
                    {t("sessions.reviewingNote")}
                  </Text>
                </Flex>

                <Flex justify="center" gap="3">
                  <Button size="sm" colorPalette="red" borderRadius="xl">
                    {t("sessions.leaveSession")}
                  </Button>
                </Flex>
              </Box>

              {/* Shared Context Side Panel */}
              <Box p="6" borderRadius="3xl" bg="bg.panel" borderWidth="1px" borderColor="border.subtle">
                <Stack gap="4">
                  <HStack gap="2">
                    <LuSparkles size={18} color="#ea580c" />
                    <Text fontWeight="bold" fontSize="sm">
                      {t("sessions.sharedContextTitle")}
                    </Text>
                  </HStack>
                  <Text fontSize="2xs" color="fg.muted">
                    {t("sessions.sharedContextDesc")}
                  </Text>

                  <Box p="3" borderRadius="xl" bg="bg.subtle" borderWidth="1px" borderColor="border.subtle">
                    <Text fontSize="xs" fontWeight="bold" mb="1">
                      {t("sessions.topTriggerLabel")}
                    </Text>
                    <Badge colorPalette="orange" size="xs">
                      Deadline Pressure
                    </Badge>
                  </Box>

                  <Box p="3" borderRadius="xl" bg="bg.subtle" borderWidth="1px" borderColor="border.subtle">
                    <Text fontSize="xs" fontWeight="bold" mb="1">
                      {t("sessions.telemetryLabel")}
                    </Text>
                    <Text fontSize="xs" color="orange.600" fontWeight="bold">
                      ADHD: 7/10 | Bipolar/Mood: 6/10
                    </Text>
                  </Box>
                </Stack>
              </Box>
            </Grid>
          ) : (
            /* Historical Sessions List */
            <Stack gap="5">
              {sessions.map((sess) => (
                <Box
                  key={sess.id}
                  p="6"
                  borderRadius="3xl"
                  bg="bg.panel"
                  borderWidth="1px"
                  borderColor="border.subtle"
                >
                  <Flex justify="space-between" align="center" mb="3">
                    <HStack gap="2.5">
                      <Flex
                        w="10"
                        h="10"
                        borderRadius="xl"
                        bg="orange.subtle"
                        color="orange.solid"
                        align="center"
                        justify="center"
                      >
                        <LuCalendar size={18} />
                      </Flex>
                      <Stack gap="0">
                        <HStack gap="2">
                          <Text fontSize="sm" fontWeight="bold">
                            {sess.sessionNumber}
                          </Text>
                          <Badge colorPalette="green" size="xs">
                            {sess.status}
                          </Badge>
                        </HStack>
                        <Text fontSize="2xs" color="fg.muted">
                          {sess.doctor} • {sess.date}
                        </Text>
                      </Stack>
                    </HStack>
                  </Flex>

                  <Box p="4" borderRadius="2xl" bg="bg.subtle" mb="3">
                    <Text fontSize="xs" color="fg" lineHeight="tall">
                      {sess.notes}
                    </Text>
                  </Box>

                  <HStack gap="2" pt="2" borderTopWidth="1px" borderColor="border.subtle" fontSize="2xs" color="fg.muted">
                    <LuPill size={14} color="#ea580c" />
                    <Text fontWeight="semibold" color="orange.600">
                      {t("sessions.actionPlanLabel")}
                    </Text>
                    <Text>{sess.prescription}</Text>
                  </HStack>
                </Box>
              ))}
            </Stack>
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default LatestSessions;
