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
  Progress,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import {
  LuCalendar,
  LuShare2,
  LuCircleCheck,
  LuDownload,
  LuShieldCheck,
} from "react-icons/lu";

export const AiReports: React.FC = () => {
  const { t } = useTranslation();

  const [activeTab, setActiveTab] = useState<"all" | "adhd" | "anxiety" | "bipolar">("all");

  const transcriptCards = [
    {
      id: "tr-1",
      date: "Today, 4:30 PM",
      dominantMood: "Anxious with Executive Overload",
      moodColor: "orange",
      summary:
        "Session captured afternoon sensory fatigue and struggle with task prioritization. User completed a 60-second breathing exercise which successfully reduced somatic tension by 40%.",
      triggers: ["Deadline Pressure", "Focus Drift"],
      symptoms: ["Racing Thoughts", "Muscle Tension"],
      inDoctorFile: true,
    },
    {
      id: "tr-2",
      date: "Yesterday, 11:15 PM",
      dominantMood: "Late-Night Rumination",
      moodColor: "purple",
      summary:
        "Late-night venting regarding sleep latency and checking rituals. The companion guided a cognitive unburdening exercise to de-escalate checking anxiety.",
      triggers: ["Insomnia", "Checking Loops"],
      symptoms: ["Sleep Disruption", "Mild Intrusive Thoughts"],
      inDoctorFile: true,
    },
    {
      id: "tr-3",
      date: "Oct 20, 2:00 PM",
      dominantMood: "Calm Baseline & High Focus",
      moodColor: "green",
      summary:
        "Stable emotional baseline with effective hyperfocus utilization. Good sleep duration noted with zero panic spikes.",
      triggers: ["Quiet Environment"],
      symptoms: ["Sustained Focus"],
      inDoctorFile: false,
    },
  ];

  return (
    <Box minH="100vh" bg="bg" color="fg" py="8" px={{ base: "4", md: "8" }}>
      <Container maxW="6xl">
        <Stack gap="8">
          {/* Header & Readiness Banner */}
          <Flex
            direction={{ base: "column", md: "row" }}
            justify="space-between"
            align={{ base: "start", md: "center" }}
            gap="4"
          >
            <Stack gap="1">
              <HStack gap="2">
                <Text fontSize="2xl" fontWeight="bold">
                  {t("aiReports.title")}
                </Text>
                <Badge colorPalette="orange" size="md">
                  Pillar 1
                </Badge>
              </HStack>
              <Text fontSize="sm" color="fg.muted">
                {t("aiReports.subtitle")}
              </Text>
            </Stack>

            <HStack gap="3">
              <Button
                size="sm"
                variant="outline"
                borderRadius="xl"
                onClick={() => alert(t("aiReports.exportSuccess"))}
              >
                <HStack gap="1.5">
                  <LuDownload size={16} />
                  <Text>{t("aiReports.exportArchive")}</Text>
                </HStack>
              </Button>

              <Button
                size="sm"
                bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                color="white"
                borderRadius="xl"
              >
                <HStack gap="1.5">
                  <LuShare2 size={16} />
                  <Text>{t("aiReports.syncTherapist")}</Text>
                </HStack>
              </Button>
            </HStack>
          </Flex>

          {/* Pre-Session Clinical File Readiness Progress Meter */}
          <Box
            p="6"
            borderRadius="3xl"
            bg="linear-gradient(135deg, rgba(234, 88, 12, 0.08) 0%, rgba(249, 115, 22, 0.03) 100%)"
            borderWidth="1px"
            borderColor="orange.500/20"
          >
            <Flex justify="space-between" align="center" mb="3">
              <HStack gap="2">
                <LuShieldCheck size={20} color="#ea580c" />
                <Text fontWeight="bold" fontSize="md">
                  {t("aiReports.meterTitle")}
                </Text>
              </HStack>
              <Badge colorPalette="green" size="md" variant="subtle">
                85% {t("aiReports.ready")}
              </Badge>
            </Flex>

            <Progress.Root value={85} size="md" colorPalette="orange" borderRadius="full">
              <Progress.Track>
                <Progress.Range />
              </Progress.Track>
            </Progress.Root>

            <Flex
              direction={{ base: "column", sm: "row" }}
              justify="space-between"
              align={{ base: "start", sm: "center" }}
              mt="3"
              gap="2"
            >
              <Text fontSize="xs" color="fg.muted">
                {t("aiReports.meterDesc")}
              </Text>
              <Text fontSize="xs" fontWeight="bold" color="green.600">
                {t("aiReports.estimatedSavings")}
              </Text>
            </Flex>
          </Box>

          {/* Filters & Tabs */}
          <HStack gap="2">
            <Button
              size="xs"
              variant={activeTab === "all" ? "solid" : "subtle"}
              colorPalette="orange"
              onClick={() => setActiveTab("all")}
            >
              {t("aiReports.tabAll")}
            </Button>
            <Button
              size="xs"
              variant={activeTab === "adhd" ? "solid" : "subtle"}
              colorPalette="orange"
              onClick={() => setActiveTab("adhd")}
            >
              {t("aiReports.tabAdhd")}
            </Button>
            <Button
              size="xs"
              variant={activeTab === "anxiety" ? "solid" : "subtle"}
              colorPalette="orange"
              onClick={() => setActiveTab("anxiety")}
            >
              {t("aiReports.tabAnxiety")}
            </Button>
            <Button
              size="xs"
              variant={activeTab === "bipolar" ? "solid" : "subtle"}
              colorPalette="orange"
              onClick={() => setActiveTab("bipolar")}
            >
              {t("aiReports.tabBipolar")}
            </Button>
          </HStack>

          {/* Longitudinal Transcripts List */}
          <Stack gap="4">
            {transcriptCards.map((card) => (
              <Box
                key={card.id}
                p="6"
                borderRadius="2xl"
                bg="bg.panel"
                borderWidth="1px"
                borderColor="border.subtle"
                _hover={{ borderColor: "orange.500/40", transform: "translateY(-1px)" }}
                transition="all 0.2s"
              >
                <Flex
                  direction={{ base: "column", md: "row" }}
                  justify="space-between"
                  align={{ base: "start", md: "center" }}
                  gap="3"
                  mb="3"
                >
                  <HStack gap="3">
                    <HStack gap="1.5" color="fg.muted" fontSize="xs">
                      <LuCalendar size={15} />
                      <Text fontWeight="semibold">{card.date}</Text>
                    </HStack>
                    <Badge colorPalette={card.moodColor} size="sm">
                      {card.dominantMood}
                    </Badge>
                  </HStack>

                  {card.inDoctorFile && (
                    <Badge colorPalette="green" variant="subtle" size="xs">
                      <HStack gap="1">
                        <LuCircleCheck size={12} />
                        <Text>{t("aiReports.attachedBadge")}</Text>
                      </HStack>
                    </Badge>
                  )}
                </Flex>

                <Text fontSize="sm" color="fg" lineHeight="tall" mb="4">
                  {card.summary}
                </Text>

                <Flex wrap="wrap" justify="space-between" align="center" gap="3" pt="2" borderTopWidth="1px" borderColor="border.subtle">
                  <HStack gap="2" wrap="wrap">
                    <Text fontSize="2xs" color="fg.muted">
                      {t("aiReports.triggersLabel")}
                    </Text>
                    {card.triggers.map((trig, i) => (
                      <Badge key={i} size="xs" colorPalette="orange" variant="outline">
                        {trig}
                      </Badge>
                    ))}

                    <Text fontSize="2xs" color="fg.muted" ml="2">
                      {t("aiReports.symptomsLabel")}
                    </Text>
                    {card.symptoms.map((s, i) => (
                      <Badge key={i} size="xs" colorPalette="teal" variant="subtle">
                        {s}
                      </Badge>
                    ))}
                  </HStack>

                  <Button size="2xs" variant="ghost" colorPalette="orange">
                    {t("aiReports.viewFullLog")}
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

export default AiReports;
