import React, { useState, useRef, useEffect } from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  Stack,
  Text,
  Badge,
  Input,
  IconButton,
  Switch,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { useUser } from "@repo/react-appwrite";
import {
  sendChatMessage,
  extractConversationInsights,
  type ChatMessage,
  type ExtractedInsights,
} from "../../services/bynaraService";
import CrisisHotlineModal from "../../components/CrisisHotlineModal";
import {
  LuSend,
  LuMic,
  LuMicOff,
  LuLock,
  LuSparkles,
  LuFlame,
  LuMoon,
  LuStethoscope,
  LuActivity,
  LuTrendingUp,
  LuCircleCheck,
  LuBrain,
  LuVolume2,
  LuPanelRight,
} from "react-icons/lu";

export const AiChat: React.FC = () => {
  const { t, i18n } = useTranslation();
  const { user, profile } = useUser();
  const userName = user?.name || profile?.userName || "Friend";

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-1",
      role: "assistant",
      content: t("aiChat.welcome", { name: userName }),
      timestamp: "Just now",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ventingMode, setVentingMode] = useState<"free" | "trigger" | "night" | "doctor">("free");
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [includeInDossier, setIncludeInDossier] = useState(true);
  const [showDrawer, setShowDrawer] = useState(true);
  const [crisisAlertOpen, setCrisisAlertOpen] = useState(false);
  const [insights, setInsights] = useState<ExtractedInsights>({
    detectedMood: "Reflective / Receptive",
    moodShift: "Baseline calmness → Venting start",
    triggers: ["Daily routine strain"],
    symptomMarkers: ["Mild cognitive load"],
    isCrisisDetected: false,
  });

  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input.trim();
    if (!textToSend || loading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setLoading(true);

    const newInsights = extractConversationInsights(nextMessages);
    setInsights(newInsights);
    if (newInsights.isCrisisDetected) {
      setCrisisAlertOpen(true);
    }

    try {
      const response = await sendChatMessage(
        nextMessages,
        ventingMode,
        i18n.language
      );

      if (response.isCrisis) {
        setCrisisAlertOpen(true);
      }

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.error("AI chat error:", err);
    } finally {
      setLoading(false);
    }
  };

  const emotionChips = [
    { label: t("aiChat.chipFocus"), prompt: t("aiChat.chipFocusPrompt") },
    { label: t("aiChat.chipAnxiety"), prompt: t("aiChat.chipAnxietyPrompt") },
    { label: t("aiChat.chipSensory"), prompt: t("aiChat.chipSensoryPrompt") },
    { label: t("aiChat.chipChecking"), prompt: t("aiChat.chipCheckingPrompt") },
  ];

  return (
    <Box minH="100vh" bg="bg" color="fg" display="flex" flexDirection="column">
      {/* Top Header / Mode Switcher Bar */}
      <Box
        px={{ base: "4", md: "6" }}
        py="3"
        borderBottomWidth="1px"
        borderColor="border.subtle"
        bg="bg.panel"
      >
        <Flex
          direction={{ base: "column", md: "row" }}
          justify="space-between"
          align={{ base: "start", md: "center" }}
          gap="3"
        >
          {/* Security & Vault Indicator */}
          <HStack gap="2">
            <Flex
              w="8"
              h="8"
              borderRadius="lg"
              bg="teal.subtle"
              color="teal.solid"
              align="center"
              justify="center"
            >
              <LuLock size={16} />
            </Flex>
            <Stack gap="0">
              <HStack gap="2">
                <Text fontWeight="bold" fontSize="sm">
                  {t("aiChat.title")}
                </Text>
                <Badge colorPalette="green" size="xs" variant="subtle">
                  {t("aiChat.encryptedBadge")}
                </Badge>
              </HStack>
              <Text fontSize="2xs" color="fg.muted">
                {t("aiChat.subtitle")}
              </Text>
            </Stack>
          </HStack>

          {/* Venting Mode Buttons */}
          <HStack gap="1.5" overflowX="auto" maxW="100%" pb={{ base: "1", md: "0" }}>
            <Button
              size="xs"
              variant={ventingMode === "free" ? "solid" : "subtle"}
              colorPalette="orange"
              onClick={() => setVentingMode("free")}
            >
              <HStack gap="1">
                <LuSparkles size={12} />
                <Text>{t("aiChat.modeFree")}</Text>
              </HStack>
            </Button>

            <Button
              size="xs"
              variant={ventingMode === "trigger" ? "solid" : "subtle"}
              colorPalette="orange"
              onClick={() => setVentingMode("trigger")}
            >
              <HStack gap="1">
                <LuFlame size={12} />
                <Text>{t("aiChat.modeTrigger")}</Text>
              </HStack>
            </Button>

            <Button
              size="xs"
              variant={ventingMode === "night" ? "solid" : "subtle"}
              colorPalette="orange"
              onClick={() => setVentingMode("night")}
            >
              <HStack gap="1">
                <LuMoon size={12} />
                <Text>{t("aiChat.modeNight")}</Text>
              </HStack>
            </Button>

            <Button
              size="xs"
              variant={ventingMode === "doctor" ? "solid" : "subtle"}
              colorPalette="orange"
              onClick={() => setVentingMode("doctor")}
            >
              <HStack gap="1">
                <LuStethoscope size={12} />
                <Text>{t("aiChat.modeDoctor")}</Text>
              </HStack>
            </Button>

            <IconButton
              aria-label="Toggle Insights Drawer"
              size="xs"
              variant="outline"
              onClick={() => setShowDrawer(!showDrawer)}
              title="Toggle Live Transcript"
            >
              <LuPanelRight size={14} />
            </IconButton>
          </HStack>
        </Flex>
      </Box>

      {/* Main Chat Canvas & Collapsible Dossier Drawer */}
      <Flex flex="1" overflow="hidden" position="relative">
        {/* Chat Center Stream */}
        <Flex flex="1" direction="column" minW="0" bg="bg">
          {/* Messages Area */}
          <Box flex="1" overflowY="auto" p={{ base: "4", md: "6" }}>
            <Stack gap="4" maxW="4xl" mx="auto">
              {messages.map((m) => (
                <Flex
                  key={m.id}
                  justify={m.role === "user" ? "flex-end" : "flex-start"}
                >
                  <Box
                    maxW={{ base: "85%", md: "75%" }}
                    p="4"
                    borderRadius="2xl"
                    borderBottomRightRadius={m.role === "user" ? "xs" : "2xl"}
                    borderBottomLeftRadius={m.role === "assistant" ? "xs" : "2xl"}
                    bg={
                      m.role === "user"
                        ? "linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                        : "bg.panel"
                    }
                    color={m.role === "user" ? "white" : "fg"}
                    borderWidth={m.role === "assistant" ? "1px" : "0"}
                    borderColor="border.subtle"
                    boxShadow="sm"
                  >
                    <Text fontSize="sm" lineHeight="tall" whiteSpace="pre-wrap">
                      {m.content}
                    </Text>
                    {m.timestamp && (
                      <Text
                        fontSize="2xs"
                        mt="1.5"
                        opacity={0.7}
                        textAlign={m.role === "user" ? "right" : "left"}
                      >
                        {m.timestamp}
                      </Text>
                    )}
                  </Box>
                </Flex>
              ))}

              {loading && (
                <Flex justify="flex-start">
                  <HStack
                    gap="2"
                    p="3.5"
                    bg="bg.panel"
                    borderRadius="2xl"
                    borderWidth="1px"
                    borderColor="border.subtle"
                  >
                    <LuBrain className="animate-spin" size={16} color="#ea580c" />
                    <Text fontSize="xs" color="fg.muted">
                      {t("aiChat.thinking")}
                    </Text>
                  </HStack>
                </Flex>
              )}
              <div ref={chatEndRef} />
            </Stack>
          </Box>

          {/* Quick Emotion Starter Chips */}
          <Box px={{ base: "4", md: "6" }} py="2" bg="bg.panel/50">
            <Flex gap="2" overflowX="auto" pb="1">
              {emotionChips.map((chip, idx) => (
                <Button
                  key={idx}
                  size="2xs"
                  variant="subtle"
                  colorPalette="gray"
                  borderRadius="full"
                  flexShrink={0}
                  onClick={() => handleSend(chip.prompt)}
                >
                  {chip.label}
                </Button>
              ))}
            </Flex>
          </Box>

          {/* Input & Voice Controls */}
          <Box
            p={{ base: "3", md: "4" }}
            borderTopWidth="1px"
            borderColor="border.subtle"
            bg="bg.panel"
          >
            {isVoiceActive && (
              <Flex
                align="center"
                justify="center"
                gap="3"
                p="2"
                mb="2"
                borderRadius="xl"
                bg="orange.500/10"
                borderWidth="1px"
                borderColor="orange.500/30"
              >
                <LuVolume2 size={18} color="#ea580c" />
                <Text fontSize="xs" fontWeight="semibold" color="orange.600">
                  {t("aiChat.voiceActive")}
                </Text>
                <Box
                  w="8"
                  h="2"
                  bg="orange.500"
                  borderRadius="full"
                  animation="pulse 1s infinite"
                />
              </Flex>
            )}

            <Flex gap="2" align="center" maxW="4xl" mx="auto">
              <IconButton
                aria-label="Toggle Voice Venting"
                variant={isVoiceActive ? "solid" : "subtle"}
                colorPalette="orange"
                borderRadius="xl"
                onClick={() => setIsVoiceActive(!isVoiceActive)}
                title="Voice Venting Room"
              >
                {isVoiceActive ? <LuMicOff size={18} /> : <LuMic size={18} />}
              </IconButton>

              <Input
                flex="1"
                placeholder={t("aiChat.inputPlaceholder")}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSend();
                  }
                }}
                borderRadius="xl"
                bg="bg"
              />

              <Button
                bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                color="white"
                borderRadius="xl"
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
              >
                <LuSend size={16} />
              </Button>
            </Flex>
          </Box>
        </Flex>

        {/* Right Collapsible Drawer: Live Auto-Transcript & Clinical Pattern Tracker */}
        {showDrawer && (
          <Box
            w={{ base: "100%", md: "320px", lg: "360px" }}
            borderInlineStartWidth="1px"
            borderColor="border.subtle"
            bg="bg.panel"
            p="5"
            overflowY="auto"
            display={{ base: "none", lg: "block" }}
          >
            <Stack gap="5">
              <HStack justify="space-between">
                <HStack gap="2">
                  <LuActivity size={18} color="#ea580c" />
                  <Text fontWeight="bold" fontSize="sm">
                    {t("aiChat.drawerTitle")}
                  </Text>
                </HStack>
                <Badge colorPalette="orange" size="xs">
                  {t("aiChat.pillar1Active")}
                </Badge>
              </HStack>

              <Text fontSize="2xs" color="fg.muted">
                {t("aiChat.drawerDesc")}
              </Text>

              {/* Detected Mood Trajectory */}
              <Box p="3" borderRadius="xl" bg="bg.subtle" borderWidth="1px" borderColor="border.subtle">
                <HStack gap="2" mb="1">
                  <LuTrendingUp size={14} color="#ea580c" />
                  <Text fontSize="xs" fontWeight="semibold">
                    {t("aiChat.moodTrajectoryTitle")}
                  </Text>
                </HStack>
                <Text fontSize="xs" fontWeight="bold" color="orange.600">
                  {insights.detectedMood}
                </Text>
                <Text fontSize="2xs" color="fg.muted" mt="1">
                  {insights.moodShift}
                </Text>
              </Box>

              {/* Extracted Triggers */}
              <Box p="3" borderRadius="xl" bg="bg.subtle" borderWidth="1px" borderColor="border.subtle">
                <Text fontSize="xs" fontWeight="semibold" mb="2">
                  {t("aiChat.triggersTitle")}
                </Text>
                <Flex wrap="wrap" gap="1.5">
                  {insights.triggers.map((trig, idx) => (
                    <Badge key={idx} colorPalette="orange" variant="surface" size="xs">
                      {trig}
                    </Badge>
                  ))}
                </Flex>
              </Box>

              {/* Symptom Markers */}
              <Box p="3" borderRadius="xl" bg="bg.subtle" borderWidth="1px" borderColor="border.subtle">
                <Text fontSize="xs" fontWeight="semibold" mb="2">
                  {t("aiChat.symptomsTitle")}
                </Text>
                <Flex wrap="wrap" gap="1.5">
                  {insights.symptomMarkers.map((sym, idx) => (
                    <Badge key={idx} colorPalette="teal" variant="subtle" size="xs">
                      {sym}
                    </Badge>
                  ))}
                </Flex>
              </Box>

              {/* Clinical File Toggle */}
              <Box
                p="3"
                borderRadius="xl"
                bg="linear-gradient(135deg, rgba(234, 88, 12, 0.08) 0%, rgba(249, 115, 22, 0.04) 100%)"
                borderWidth="1px"
                borderColor="orange.500/20"
              >
                <Flex justify="space-between" align="center">
                  <Stack gap="0" pr="2">
                    <Text fontSize="xs" fontWeight="bold">
                      {t("aiChat.includeDossier")}
                    </Text>
                    <Text fontSize="2xs" color="fg.muted">
                      {t("aiChat.includeDossierDesc")}
                    </Text>
                  </Stack>
                  <Switch.Root
                    checked={includeInDossier}
                    onCheckedChange={(e) => setIncludeInDossier(e.checked)}
                    colorPalette="orange"
                    size="sm"
                  >
                    <Switch.HiddenInput />
                    <Switch.Control />
                  </Switch.Root>
                </Flex>
              </Box>

              {/* Value proposition pill */}
              <HStack gap="2" color="fg.muted" fontSize="2xs">
                <LuCircleCheck size={14} color="#16a34a" />
                <Text>{t("aiChat.savingsPill")}</Text>
              </HStack>
            </Stack>
          </Box>
        )}
      </Flex>

      {/* Auto-Triggered Crisis Overlay Modal */}
      <CrisisHotlineModal
        isOpen={crisisAlertOpen}
        onClose={() => setCrisisAlertOpen(false)}
        isAutoTriggered={true}
      />
    </Box>
  );
};

export default AiChat;
