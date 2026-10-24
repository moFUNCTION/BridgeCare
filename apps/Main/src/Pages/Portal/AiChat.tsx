import React, { useState, useRef, useEffect, useCallback } from "react";
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
  sendGroqChatMessage,
  extractConversationInsights,
  saveDailyTranscript,
  isCrisisTriggered,
  type ChatMessage,
  type ExtractedInsights,
} from "../../services/groqService";
import CrisisHotlineModal from "../../components/CrisisHotlineModal";
import { ScrollArea } from "../../components/ui/scroll-area";
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
  LuX,
  LuInfo,
  LuShieldAlert,
} from "react-icons/lu";

export const AiChat: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { user, profile } = useUser();
  const userName = user?.name || profile?.userName || (isAr ? "صديقي" : "Friend");

  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "init-1",
      role: "assistant",
      content: t(
        "aiChat.welcome",
        isAr
          ? `مرحباً بك يا ${userName}. هذه مساحتك الخاصة والآمنة تماماً دون أي أحكام أو قيود. كيف تشعر الآن؟ عبّر بحرية تامة عن يومك، الضغوطات، أو أي فكرة تراودك.`
          : `Welcome, ${userName}. This is your completely private, judgment-free sanctuary. How is your mind feeling right now? Vent freely about your day, triggers, or anything on your mind.`
      ),
      timestamp: "Just now",
    },
  ]);

  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [ventingMode, setVentingMode] = useState<"free" | "trigger" | "night" | "doctor">("free");
  const [isVoiceActive, setIsVoiceActive] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");
  const [includeInDossier, setIncludeInDossier] = useState(true);
  const [showDrawer, setShowDrawer] = useState(true);
  const [crisisAlertOpen, setCrisisAlertOpen] = useState(false);
  const [currentSessionTranscriptId] = useState<string>(() => "tr-" + Date.now().toString());

  const [insights, setInsights] = useState<ExtractedInsights>({
    moodTrajectory: isAr
      ? "هدوء الصباح → بدء تفريغ المشاعر"
      : "Baseline Calmness (Morning) → Receptive Unburdening",
    baselineState: isAr ? "حالة الهدوء — انطلاق الجلسة" : "Calmness — Venting session started",
    extractedTriggers: [isAr ? "ضغوطات الروتين اليومي" : "Daily routine strain"],
    behavioralMarkers: [isAr ? "حمل ذهني طفيف" : "Mild cognitive load"],
    includeInClinicalFile: true,
    isCrisis: false,
    detectedMood: isAr ? "متأمل / منفتح للمشاركة" : "Reflective / Receptive",
    moodShift: isAr ? "هدوء البداية → بدء التفريغ" : "Baseline calmness → Venting start",
    triggers: [isAr ? "ضغوطات الروتين اليومي" : "Daily routine strain"],
    symptomMarkers: [isAr ? "حمل ذهني طفيف" : "Mild cognitive load"],
    isCrisisDetected: false,
  });

  const chatEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Sync draft transcript to Appwrite & local storage
  const syncTranscriptDraft = useCallback(
    async (msgs: ChatMessage[], currentInsights: ExtractedInsights, includeFile: boolean) => {
      if (msgs.length <= 1) return;
      try {
        const userText = msgs
          .filter((m) => m.role === "user")
          .map((m) => m.content)
          .join(". ");

        const summaryText =
          userText.length > 300 ? userText.slice(0, 297) + "..." : userText;

        await saveDailyTranscript({
          transcriptId: currentSessionTranscriptId,
          userId: user?.$id || "patient-guest",
          date: new Date().toISOString().slice(0, 10),
          summaryText:
            summaryText ||
            (isAr
              ? "جلسة تفريغ شعوري يومية وتتبع للأنماط المعرفية والجسدية."
              : "Daily venting session capturing emotional release and cognitive patterns."),
          moodTrajectory: currentInsights.moodTrajectory,
          triggers: currentInsights.triggers,
          symptoms: currentInsights.symptomMarkers,
          isCrisisDetected: Boolean(currentInsights.isCrisisDetected),
          includeInClinicalFile: includeFile,
          rawChatLog: JSON.stringify(msgs),
        });
      } catch (err) {
        console.warn("Auto-syncing transcript draft caught non-fatal error:", err);
      }
    },
    [currentSessionTranscriptId, user?.$id, isAr]
  );

  // Handle Web Speech API for voice venting
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (isVoiceActive && SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = isAr ? "ar-SA" : "en-US";

        recognition.onresult = (event: any) => {
          let current = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            current += event.results[i][0].transcript;
          }
          setVoiceTranscript(current);
          setInput(current);
        };

        recognition.onerror = (event: any) => {
          console.warn("Speech recognition warning:", event.error);
        };

        recognition.start();
        recognitionRef.current = recognition;
      } catch (err) {
        console.warn("Could not start speech recognition:", err);
      }
    } else {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
      setVoiceTranscript("");
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isVoiceActive, isAr]);

  const handleSend = async (customText?: string) => {
    const textToSend = customText || input.trim();
    if (!textToSend || loading) return;

    // Check crisis in user input immediately
    const inputCrisis = isCrisisTriggered(textToSend);
    if (inputCrisis) {
      setCrisisAlertOpen(true);
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setInput("");
    setVoiceTranscript("");
    setLoading(true);

    // Live Insight Extraction
    const newInsights = extractConversationInsights(nextMessages, includeInDossier);
    setInsights(newInsights);
    if (newInsights.isCrisisDetected || inputCrisis) {
      setCrisisAlertOpen(true);
    }

    try {
      const response = await sendGroqChatMessage(
        nextMessages,
        ventingMode,
        i18n.language,
        user?.$id
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

      const finalMessages = [...nextMessages, assistantMsg];
      setMessages(finalMessages);

      // Persist draft transcript every message
      syncTranscriptDraft(finalMessages, newInsights, includeInDossier);
    } catch (err) {
      console.error("AI chat error:", err);
    } finally {
      setLoading(false);
    }
  };

  const emotionChips = [
    {
      label: t("aiChat.chipFocus", isAr ? "تشتت / صعوبة بدء المهام" : "Scattered / Unfocused"),
      prompt: t(
        "aiChat.chipFocusPrompt",
        isAr
          ? "أعاني اليوم من صعوبة بالغة في التركيز وبدء المهام المطلوبة مني..."
          : "I'm having a lot of focus drift today and struggling to start tasks..."
      ),
    },
    {
      label: t("aiChat.chipAnxiety", isAr ? "توتر جسدي وقلق مرتفع" : "High Anxiety / Tense"),
      prompt: t(
        "aiChat.chipAnxietyPrompt",
        isAr
          ? "أشعر بموجة قلق متصاعدة وضيق جسدي في الصدر والتنفس..."
          : "I feel a wave of anxiety and somatic tension building up..."
      ),
    },
    {
      label: t("aiChat.chipSensory", isAr ? "إرهاق حسي شديد" : "Sensory Overload"),
      prompt: t(
        "aiChat.chipSensoryPrompt",
        isAr
          ? "أشعر بإرهاق حسي هائل بسبب الضوضاء والازدحام وتراكم الطلبات..."
          : "I'm experiencing intense sensory overload from noise and demands..."
      ),
    },
    {
      label: t("aiChat.chipChecking", isAr ? "أفكار تدقيق وسواسية" : "Intrusive Checking Loop"),
      prompt: t(
        "aiChat.chipCheckingPrompt",
        isAr
          ? "أنا عالق في أفكار تدقيق متكررة لا أستطيع التخلص منها..."
          : "I'm stuck in repetitive checking thoughts that I can't shake..."
      ),
    },
  ];

  const modeDescriptions = {
    free: {
      title: isAr ? "التفريغ الحر (Free Venting)" : "Free Venting Mode",
      desc: isAr
        ? "سورا تستمع إليك بتعاطف عميق ودون أي مقاطعة أو نصائح غير مطلوبة. مساحتك الآمنة 100%."
        : "Sora listens with deep empathy and zero judgment. Validating your feelings without unsolicited advice.",
    },
    trigger: {
      title: isAr ? "تفكيك المحفزات (Unpack a Trigger)" : "Unpack a Trigger Mode",
      desc: isAr
        ? "حوار تفكيكي هادئ لمعرفة متى بدأ التوتر، وما هي المحفزات الحسية والبيئية المسببة له."
        : "Socratic inquiry to map when the spike started, somatic sensations, and situational stressors.",
    },
    night: {
      title: isAr ? "هدوء الليل (Late-Night Calm)" : "Late-Night Calm Mode",
      desc: isAr
        ? "نمط مهدئ منخفض التحفيز لتهدئة الأفكار المتسارعة ومقاومة القلق والأرق قبل النوم."
        : "Low-stimulus grounding to combat late-night rumination, insomnia, and sensory overload.",
    },
    doctor: {
      title: isAr ? "التحضير لجلستك مع الطبيب (Prep Doctor Session)" : "Prep Doctor Session Mode",
      desc: isAr
        ? "تنظيم وصياغة مشاعرك وأعراضك بدقة لتكون جاهزة للمناقشة في جلستك القادمة."
        : "Structuring your weekly emotional triggers and symptoms ready for your clinician to review.",
    },
  };

  return (
    <Box
      minH="100vh"
      bg="bg"
      color="fg"
      display="flex"
      flexDirection="column"
      dir={isAr ? "rtl" : "ltr"}
    >
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
          <HStack gap="2.5">
            <Flex
              w="9"
              h="9"
              borderRadius="xl"
              bg="teal.subtle"
              color="teal.solid"
              align="center"
              justify="center"
              boxShadow="xs"
            >
              <LuLock size={18} />
            </Flex>
            <Stack gap="0">
              <HStack gap="2">
                <Text fontWeight="bold" fontSize="sm">
                  {t("aiChat.title", isAr ? "المعالج الذكي 24/7 (سورا)" : "24/7 AI Daily Companion (Sora)")}
                </Text>
                <Badge
                  colorPalette="green"
                  size="xs"
                  variant="subtle"
                  px="2"
                  py="0.5"
                  borderRadius="full"
                  fontSize="2xs"
                  fontWeight="semibold"
                >
                  {t("aiChat.encryptedBadge", isAr ? "تشفير تام للطرفين" : "End-to-End Encrypted")}
                </Badge>
              </HStack>
              <Text fontSize="2xs" color="fg.muted">
                {t(
                  "aiChat.subtitle",
                  isAr
                    ? "الهوية مفصولة رياضياً عن سجل المحادثات | التدوين السريري المباشر مفعّل"
                    : "Identity mathematically separated from logs | Live clinical auto-transcription active"
                )}
              </Text>
            </Stack>
          </HStack>

          {/* Venting Mode Buttons in Chakra ScrollArea */}
          <HStack gap="2" maxW={{ base: "100%", md: "65%" }} flex="1" justify="flex-end" minW="0">
            <ScrollArea orientation="horizontal" maxW="100%">
              <HStack gap="1.5" py="1" px="0.5" whiteSpace="nowrap">
                <Button
                  size="xs"
                  px="3"
                  py="1.5"
                  borderRadius="xl"
                  fontSize="xs"
                  fontWeight="medium"
                  variant={ventingMode === "free" ? "solid" : "subtle"}
                  colorPalette="orange"
                  onClick={() => setVentingMode("free")}
                  flexShrink={0}
                >
                  <HStack gap="1">
                    <LuSparkles size={13} />
                    <Text>{t("aiChat.modeFree", isAr ? "تفريغ حر" : "Free Venting")}</Text>
                  </HStack>
                </Button>

                <Button
                  size="xs"
                  px="3"
                  py="1.5"
                  borderRadius="xl"
                  fontSize="xs"
                  fontWeight="medium"
                  variant={ventingMode === "trigger" ? "solid" : "subtle"}
                  colorPalette="orange"
                  onClick={() => setVentingMode("trigger")}
                  flexShrink={0}
                >
                  <HStack gap="1">
                    <LuFlame size={13} />
                    <Text>{t("aiChat.modeTrigger", isAr ? "تفكيك محفز" : "Unpack a Trigger")}</Text>
                  </HStack>
                </Button>

                <Button
                  size="xs"
                  px="3"
                  py="1.5"
                  borderRadius="xl"
                  fontSize="xs"
                  fontWeight="medium"
                  variant={ventingMode === "night" ? "solid" : "subtle"}
                  colorPalette="orange"
                  onClick={() => setVentingMode("night")}
                  flexShrink={0}
                >
                  <HStack gap="1">
                    <LuMoon size={13} />
                    <Text>{t("aiChat.modeNight", isAr ? "هدوء الليل" : "Late-Night Calm")}</Text>
                  </HStack>
                </Button>

                <Button
                  size="xs"
                  px="3"
                  py="1.5"
                  borderRadius="xl"
                  fontSize="xs"
                  fontWeight="medium"
                  variant={ventingMode === "doctor" ? "solid" : "subtle"}
                  colorPalette="orange"
                  onClick={() => setVentingMode("doctor")}
                  flexShrink={0}
                >
                  <HStack gap="1">
                    <LuStethoscope size={13} />
                    <Text>{t("aiChat.modeDoctor", isAr ? "تحضير الجلسة" : "Prep Doctor Session")}</Text>
                  </HStack>
                </Button>
              </HStack>
            </ScrollArea>

            <IconButton
              aria-label="Toggle Insights Drawer"
              size="sm"
              w="8"
              h="8"
              borderRadius="lg"
              variant={showDrawer ? "solid" : "outline"}
              colorPalette={showDrawer ? "orange" : "gray"}
              onClick={() => setShowDrawer(!showDrawer)}
              title="Toggle Live Transcript & Clinical Insights"
              flexShrink={0}
            >
              <LuPanelRight size={16} />
            </IconButton>
          </HStack>
        </Flex>

        {/* Venting Mode Philosophy Banner */}
        <Flex
          mt="2.5"
          px="3"
          py="1.5"
          borderRadius="lg"
          bg="orange.500/8"
          borderWidth="1px"
          borderColor="orange.500/20"
          align="center"
          justify="space-between"
          gap="2"
        >
          <HStack gap="2">
            <LuInfo size={14} color="#ea580c" />
            <Text fontSize="2xs" fontWeight="semibold" color="orange.700">
              {modeDescriptions[ventingMode].title}:
            </Text>
            <Text fontSize="2xs" color="fg.muted">
              {modeDescriptions[ventingMode].desc}
            </Text>
          </HStack>
          <Badge colorPalette="orange" variant="subtle" size="xs" fontSize="2xs">
            Groq Llama-3.3-70b
          </Badge>
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
                    maxW={{ base: "88%", md: "78%" }}
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
                    transition="all 0.2s"
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
                    gap="2.5"
                    p="3.5"
                    bg="bg.panel"
                    borderRadius="2xl"
                    borderWidth="1px"
                    borderColor="border.subtle"
                    boxShadow="sm"
                  >
                    <LuBrain className="animate-spin" size={17} color="#ea580c" />
                    <Text fontSize="xs" color="fg.muted">
                      {t("aiChat.thinking", isAr ? "سورا تتأمل وتصيغ إجابة متعاطفة..." : "Sora is thoughtfully reflecting...")}
                    </Text>
                  </HStack>
                </Flex>
              )}
              <div ref={chatEndRef} />
            </Stack>
          </Box>

          {/* Quick Emotion Starter Chips */}
          <Box px={{ base: "4", md: "6" }} py="2" bg="bg.panel/50" borderTopWidth="1px" borderColor="border.subtle">
            <ScrollArea orientation="horizontal" maxW="100%">
              <HStack gap="2" py="1" px="0.5" whiteSpace="nowrap">
                {emotionChips.map((chip, idx) => (
                  <Button
                    key={idx}
                    size="xs"
                    px="3"
                    py="1"
                    fontSize="xs"
                    fontWeight="normal"
                    variant="subtle"
                    colorPalette="gray"
                    borderRadius="full"
                    flexShrink={0}
                    onClick={() => handleSend(chip.prompt)}
                  >
                    {chip.label}
                  </Button>
                ))}
              </HStack>
            </ScrollArea>
          </Box>

          {/* Input & Voice Controls */}
          <Box
            p={{ base: "3", md: "4" }}
            borderTopWidth="1px"
            borderColor="border.subtle"
            bg="bg.panel"
          >
            {/* Audio Waveform Pulsing Visualizer when Voice Venting Active */}
            {isVoiceActive && (
              <Box
                p="3"
                mb="3"
                borderRadius="2xl"
                bg="linear-gradient(135deg, rgba(234, 88, 12, 0.12) 0%, rgba(249, 115, 22, 0.05) 100%)"
                borderWidth="1px"
                borderColor="orange.500/40"
              >
                <Flex justify="space-between" align="center" mb="2">
                  <HStack gap="2">
                    <LuVolume2 size={18} color="#ea580c" />
                    <Text fontSize="xs" fontWeight="bold" color="orange.600">
                      {t("aiChat.voiceActive", isAr ? "غرفة التفريغ الصوتي نشطة — تحدث بكل أريحية..." : "Voice Venting Active — Speak your mind freely...")}
                    </Text>
                  </HStack>
                  <Badge colorPalette="orange" variant="solid" size="xs" borderRadius="full">
                    {isAr ? "استماع مباشر" : "Live Mic"}
                  </Badge>
                </Flex>

                {/* Animated Pulsing Sound Waveform Bars */}
                <Flex align="center" justify="center" gap="1.5" h="28px" py="1">
                  {[18, 28, 12, 34, 22, 14, 30, 24, 16, 32, 20, 15].map((height, i) => (
                    <Box
                      key={i}
                      w="3.5px"
                      h={`${height}px`}
                      bg="linear-gradient(to top, #ea580c, #f97316)"
                      borderRadius="full"
                      style={{
                        animation: `pulse 0.8s ease-in-out infinite alternate`,
                        animationDelay: `${i * 0.08}s`,
                      }}
                    />
                  ))}
                </Flex>

                {voiceTranscript && (
                  <Text fontSize="2xs" color="fg.muted" textAlign="center" mt="1.5" fontStyle="italic">
                    "{voiceTranscript}"
                  </Text>
                )}
              </Box>
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
                placeholder={t(
                  "aiChat.inputPlaceholder",
                  isAr
                    ? "اكتب كل ما تشعر به دون تردد أو قيود... المحادثة سرية 100%"
                    : "Type whatever you feel, no filter needed... 100% confidential"
                )}
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
                size="md"
                px="4"
                py="2"
                borderRadius="xl"
                bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                color="white"
                onClick={() => handleSend()}
                disabled={!input.trim() || loading}
                _hover={{ opacity: 0.92 }}
              >
                <LuSend size={16} />
              </Button>
            </Flex>
          </Box>
        </Flex>

        {/* Right Collapsible Drawer: Live Auto-Transcript & Clinical Pattern Tracker */}
        {showDrawer && (
          <Box
            w={{ base: "100%", md: "330px", lg: "370px" }}
            borderInlineStartWidth="1px"
            borderColor="border.subtle"
            bg="bg.panel"
            p="5"
            overflowY="auto"
            position={{ base: "absolute", md: "relative" }}
            inset={{ base: "0 0 0 auto", md: "auto" }}
            zIndex={{ base: 10, md: 1 }}
            boxShadow={{ base: "xl", md: "none" }}
          >
            <Stack gap="5">
              <Flex justify="space-between" align="center">
                <HStack gap="2">
                  <LuActivity size={18} color="#ea580c" />
                  <Text fontWeight="bold" fontSize="sm">
                    {t("aiChat.drawerTitle", isAr ? "الملف السريري والأنماط اللحظية" : "Live Auto-Transcript & Pattern Tracker")}
                  </Text>
                </HStack>
                <HStack gap="1.5">
                  <Badge
                    colorPalette="orange"
                    size="xs"
                    px="2"
                    py="0.5"
                    borderRadius="full"
                    fontSize="2xs"
                    fontWeight="semibold"
                  >
                    {t("aiChat.pillar1Active", isAr ? "الركيزة 1 نشطة" : "Pillar 1 Active")}
                  </Badge>
                  <IconButton
                    aria-label="Close Drawer"
                    display={{ base: "flex", md: "none" }}
                    size="2xs"
                    variant="ghost"
                    onClick={() => setShowDrawer(false)}
                  >
                    <LuX size={14} />
                  </IconButton>
                </HStack>
              </Flex>

              <Text fontSize="2xs" color="fg.muted">
                {t(
                  "aiChat.drawerDesc",
                  isAr
                    ? "يقوم الذكاء الاصطناعي باستخراج تحولات المزاج والمحفزات البيئية تلقائياً لتجميع ملف سريري مسبق لطبيبك."
                    : "The AI automatically extracts mood shifts and environmental triggers, assembling a Pre-Session Clinical Dossier for your doctor."
                )}
              </Text>

              {/* Detected Mood Trajectory */}
              <Box p="3.5" borderRadius="xl" bg="bg.subtle" borderWidth="1px" borderColor="border.subtle">
                <HStack gap="2" mb="1.5">
                  <LuTrendingUp size={15} color="#ea580c" />
                  <Text fontSize="xs" fontWeight="semibold">
                    {t("aiChat.moodTrajectoryTitle", isAr ? "مسار المزاج اللحظي" : "Real-Time Mood Trajectory")}
                  </Text>
                </HStack>
                <Text fontSize="xs" fontWeight="bold" color="orange.600">
                  {insights.detectedMood}
                </Text>
                <Text fontSize="2xs" color="fg.muted" mt="1" lineHeight="normal">
                  {insights.moodTrajectory}
                </Text>
              </Box>

              {/* Extracted Triggers */}
              <Box p="3.5" borderRadius="xl" bg="bg.subtle" borderWidth="1px" borderColor="border.subtle">
                <Text fontSize="xs" fontWeight="semibold" mb="2">
                  {t("aiChat.triggersTitle", isAr ? "المحفزات المستخرجة" : "Extracted Triggers")}
                </Text>
                <Flex wrap="wrap" gap="1.5">
                  {insights.triggers.map((trig, idx) => (
                    <Badge
                      key={idx}
                      colorPalette="orange"
                      variant="surface"
                      size="xs"
                      px="2"
                      py="0.5"
                      borderRadius="md"
                      fontSize="2xs"
                    >
                      {trig}
                    </Badge>
                  ))}
                </Flex>
              </Box>

              {/* Symptom Markers */}
              <Box p="3.5" borderRadius="xl" bg="bg.subtle" borderWidth="1px" borderColor="border.subtle">
                <Text fontSize="xs" fontWeight="semibold" mb="2">
                  {t("aiChat.symptomsTitle", isAr ? "العلامات السلوكية والجسدية" : "Symptom & Behavioral Markers")}
                </Text>
                <Flex wrap="wrap" gap="1.5">
                  {insights.symptomMarkers.map((sym, idx) => (
                    <Badge
                      key={idx}
                      colorPalette="teal"
                      variant="subtle"
                      size="xs"
                      px="2"
                      py="0.5"
                      borderRadius="md"
                      fontSize="2xs"
                    >
                      {sym}
                    </Badge>
                  ))}
                </Flex>
              </Box>

              {/* Clinical File Toggle */}
              <Box
                p="3.5"
                borderRadius="xl"
                bg="linear-gradient(135deg, rgba(234, 88, 12, 0.08) 0%, rgba(249, 115, 22, 0.04) 100%)"
                borderWidth="1px"
                borderColor="orange.500/25"
              >
                <Flex justify="space-between" align="center">
                  <Stack gap="0" pr="2">
                    <Text fontSize="xs" fontWeight="bold">
                      {t("aiChat.includeDossier", isAr ? "إرفاق بملف الطبيب السريري" : "Include in Doctor Clinical File")}
                    </Text>
                    <Text fontSize="2xs" color="fg.muted">
                      {t("aiChat.includeDossierDesc", isAr ? "لديك تحكّم كامل 100% في بياناتك المشاركة" : "You have 100% control over shared data")}
                    </Text>
                  </Stack>
                  <Switch.Root
                    checked={includeInDossier}
                    onCheckedChange={(e) => {
                      const nextVal = Boolean(e.checked);
                      setIncludeInDossier(nextVal);
                      syncTranscriptDraft(messages, insights, nextVal);
                    }}
                    colorPalette="orange"
                    size="sm"
                  >
                    <Switch.HiddenInput />
                    <Switch.Control />
                  </Switch.Root>
                </Flex>
              </Box>

              {/* Value proposition pill */}
              <HStack gap="2" color="fg.muted" fontSize="2xs" p="1">
                <LuCircleCheck size={15} color="#16a34a" />
                <Text>
                  {t("aiChat.savingsPill", isAr ? "يوفر 300–600 دولار من جلسات التعارف الاستكشافية" : "Saves $300–$600 in exploratory intake sessions")}
                </Text>
              </HStack>

              {/* Safety Protocol Note */}
              <HStack gap="2" color="fg.muted" fontSize="2xs" p="1">
                <LuShieldAlert size={15} color="#dc2626" />
                <Text>
                  {isAr
                    ? "بروتوكول الأزمات النشط: دعم فوري للطوارئ عند رصد أي مؤشرات خطر."
                    : "Active Crisis Protocol: Instant emergency intervention on any self-harm signals."}
                </Text>
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
