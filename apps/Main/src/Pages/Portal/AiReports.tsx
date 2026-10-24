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
  Progress,
  IconButton,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { useUser } from "@repo/react-appwrite";
import {
  fetchPatientTranscripts,
  updateTranscriptClinicalFileStatus,
  type TranscriptRecord,
} from "../../services/groqService";
import { ScrollArea } from "../../components/ui/scroll-area";
import {
  LuCalendar,
  LuShare2,
  LuCircleCheck,
  LuDownload,
  LuShieldCheck,
  LuFilter,
  LuTrendingUp,
  LuFileText,
  LuX,
  LuFlame,
  LuCheck,
  LuActivity,
} from "react-icons/lu";

export const AiReports: React.FC = () => {
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";
  const { user } = useUser();

  const [transcripts, setTranscripts] = useState<TranscriptRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "adhd" | "anxiety" | "bipolar">("all");
  const [selectedTrigger, setSelectedTrigger] = useState<string>("all");
  const [activeLogModal, setActiveLogModal] = useState<TranscriptRecord | null>(null);
  const [syncAlertVisible, setSyncAlertVisible] = useState(false);

  useEffect(() => {
    let mounted = true;
    async function loadData() {
      setLoading(true);
      try {
        const records = await fetchPatientTranscripts(user?.$id);
        if (mounted) {
          setTranscripts(records);
        }
      } catch (err) {
        console.error("Error loading longitudinal transcripts:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadData();
    return () => {
      mounted = false;
    };
  }, [user?.$id]);

  // Compute all unique triggers and their frequencies
  const triggerFrequencies: Record<string, number> = {};
  transcripts.forEach((t) => {
    t.triggers.forEach((tr) => {
      triggerFrequencies[tr] = (triggerFrequencies[tr] || 0) + 1;
    });
  });
  const allUniqueTriggers = Object.keys(triggerFrequencies);

  // Filtered transcripts
  const filteredTranscripts = transcripts.filter((item) => {
    // Condition filter
    if (activeTab !== "all") {
      if (item.conditionTag && item.conditionTag !== activeTab) {
        // Fallback: check text keywords
        const text = (item.summaryText + " " + item.triggers.join(" ") + " " + item.symptoms.join(" ")).toLowerCase();
        if (activeTab === "adhd" && !text.includes("focus") && !text.includes("adhd") && !text.includes("deadline")) {
          return false;
        }
        if (activeTab === "anxiety" && !text.includes("anxi") && !text.includes("panic") && !text.includes("tension") && !text.includes("sensory")) {
          return false;
        }
        if (activeTab === "bipolar" && !text.includes("bipolar") && !text.includes("energy") && !text.includes("mood") && !text.includes("hyperfocus")) {
          return false;
        }
      }
    }

    // Trigger filter
    if (selectedTrigger !== "all") {
      if (!item.triggers.includes(selectedTrigger)) {
        return false;
      }
    }

    return true;
  });

  // Toggle inclusion in doctor clinical file
  const handleToggleInclude = async (transcriptId: string, currentVal: boolean) => {
    const newVal = !currentVal;
    setTranscripts((prev) =>
      prev.map((t) =>
        t.transcriptId === transcriptId || t.$id === transcriptId
          ? { ...t, includeInClinicalFile: newVal }
          : t
      )
    );
    await updateTranscriptClinicalFileStatus(transcriptId, newVal);
  };

  // Export full JSON archive
  const handleExportArchive = () => {
    const archivePayload = {
      vault: "BridgeCare Vault B: Longitudinal AI Venting Transcripts",
      patientId: user?.$id || "anonymous-patient",
      exportedAt: new Date().toISOString(),
      readinessMeter: "85%",
      totalLogsCount: transcripts.length,
      includedInDoctorFileCount: transcripts.filter((t) => t.includeInClinicalFile).length,
      transcripts: transcripts,
    };

    const dataUri =
      "data:text/json;charset=utf-8," +
      encodeURIComponent(JSON.stringify(archivePayload, null, 2));
    const a = document.createElement("a");
    a.setAttribute("href", dataUri);
    a.setAttribute(
      "download",
      `BridgeCare_Clinical_Transcripts_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const getMoodColor = (mood: string) => {
    const m = mood.toLowerCase();
    if (m.includes("anxious") || m.includes("tension") || m.includes("overload")) return "orange";
    if (m.includes("night") || m.includes("rumination") || m.includes("insomnia")) return "purple";
    if (m.includes("calm") || m.includes("steady") || m.includes("focus")) return "green";
    if (m.includes("critical") || m.includes("distress")) return "red";
    return "teal";
  };

  return (
    <Box minH="100vh" bg="bg" color="fg" py="8" px={{ base: "4", md: "8" }} dir={isAr ? "rtl" : "ltr"}>
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
                  {t("aiReports.title", isAr ? "سجل التفريغ اليومي والملف السريري التراكمي" : "Automated Transcripts & Longitudinal Vault")}
                </Text>
                <Badge
                  colorPalette="orange"
                  size="sm"
                  px="2.5"
                  py="0.5"
                  borderRadius="full"
                  fontSize="xs"
                  fontWeight="bold"
                >
                  Pillar 1
                </Badge>
              </HStack>
              <Text fontSize="sm" color="fg.muted">
                {t(
                  "aiReports.subtitle",
                  isAr
                    ? "ملخصات ذكاء اصطناعي تراكمية تحل مشكلة فقدان سياق الجلسات بمرور الوقت. سيتذكر طبيبك أدق التفاصيل حتى في الجلسة الثامنة."
                    : "AI-generated longitudinal summaries that solve context loss. Your doctor will know every daily trigger even in Session 8."
                )}
              </Text>
            </Stack>

            <HStack gap="3">
              <Button
                size="sm"
                variant="outline"
                borderRadius="xl"
                px="3.5"
                py="2"
                fontSize="xs"
                fontWeight="semibold"
                onClick={handleExportArchive}
              >
                <HStack gap="1.5">
                  <LuDownload size={16} />
                  <Text>{t("aiReports.exportArchive", isAr ? "تصدير الأرشيف المشفّر" : "Export Archive (JSON)")}</Text>
                </HStack>
              </Button>

              <Button
                size="sm"
                bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                color="white"
                borderRadius="xl"
                px="3.5"
                py="2"
                fontSize="xs"
                fontWeight="semibold"
                onClick={() => setSyncAlertVisible(true)}
              >
                <HStack gap="1.5">
                  <LuShare2 size={16} />
                  <Text>{t("aiReports.syncTherapist", isAr ? "مزامنة مع الطبيب" : "Sync with Therapist")}</Text>
                </HStack>
              </Button>
            </HStack>
          </Flex>

          {/* Sync Success Banner */}
          {syncAlertVisible && (
            <Flex
              p="4"
              borderRadius="2xl"
              bg="green.500/10"
              borderWidth="1px"
              borderColor="green.500/30"
              justify="space-between"
              align="center"
              animation="fadeIn 0.2s ease-out"
            >
              <HStack gap="2.5">
                <LuCheck size={18} color="#16a34a" />
                <Text fontSize="xs" fontWeight="semibold" color="green.700">
                  {isAr
                    ? "تمت مزامنة 14 يوماً من سجلات التفريغ اليومي ومؤشرات القياس بنجاح مع د. طارق المنصوري."
                    : "14 days of AI daily transcripts and screening indicators successfully synced to Dr. Tarek Al-Mansouri."}
                </Text>
              </HStack>
              <IconButton
                aria-label="Close"
                size="2xs"
                variant="ghost"
                onClick={() => setSyncAlertVisible(false)}
              >
                <LuX size={14} />
              </IconButton>
            </Flex>
          )}

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
                  {t("aiReports.meterTitle", isAr ? "مقياس جاهزية الملف السريري لجلسة الطبيب" : "Pre-Session Clinical File Readiness Meter")}
                </Text>
              </HStack>
              <Badge
                colorPalette="green"
                size="md"
                variant="subtle"
                px="3"
                py="1"
                borderRadius="full"
                fontSize="xs"
                fontWeight="bold"
              >
                85% {t("aiReports.ready", isAr ? "جاهز" : "Ready")}
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
                {t(
                  "aiReports.meterDesc",
                  isAr
                    ? "يدمج ملفك 14 يوماً من سجلات التفريغ الذكي ومؤشرات الألعاب القياسية، مما يوفر من 3 إلى 5 جلسات تعارف استكشافية مكررة."
                    : "Your file combines 14 days of AI venting logs and gamified screening indicators, saving 3 to 5 repetitive exploratory sessions."
                )}
              </Text>
              <Text fontSize="xs" fontWeight="bold" color="green.600">
                {t("aiReports.estimatedSavings", isAr ? "الوفر المالي المقدر: 450$" : "Estimated Savings: $450")}
              </Text>
            </Flex>
          </Box>

          {/* Longitudinal Triggers Frequency Analytics Bar */}
          <Box
            p="4"
            borderRadius="2xl"
            bg="bg.panel"
            borderWidth="1px"
            borderColor="border.subtle"
          >
            <Flex justify="space-between" align="center" mb="2.5">
              <HStack gap="2">
                <LuActivity size={16} color="#ea580c" />
                <Text fontSize="xs" fontWeight="bold">
                  {isAr ? "تحليل تكرار المحفزات اليومية (Trigger Frequencies)" : "Top Trigger Frequency & Trends"}
                </Text>
              </HStack>
              <Text fontSize="2xs" color="fg.muted">
                {isAr ? "مستخرج تلقائياً من المحادثات اليومية" : "Synthesized automatically across all days"}
              </Text>
            </Flex>

            <ScrollArea orientation="horizontal" maxW="100%">
              <HStack gap="2" py="1" px="0.5" whiteSpace="nowrap">
                {Object.entries(triggerFrequencies).map(([trigger, count], idx) => (
                  <Badge
                    key={idx}
                    size="sm"
                    colorPalette={count > 1 ? "orange" : "gray"}
                    variant={selectedTrigger === trigger ? "solid" : "subtle"}
                    px="2.5"
                    py="1"
                    borderRadius="xl"
                    fontSize="xs"
                    cursor="pointer"
                    onClick={() => setSelectedTrigger(selectedTrigger === trigger ? "all" : trigger)}
                  >
                    <HStack gap="1">
                      <LuFlame size={12} />
                      <Text>{trigger}:</Text>
                      <Text fontWeight="bold">{count}x</Text>
                    </HStack>
                  </Badge>
                ))}
              </HStack>
            </ScrollArea>
          </Box>

          {/* Filter Controls: Conditions & Trigger Chips */}
          <Flex
            direction={{ base: "column", md: "row" }}
            justify="space-between"
            align={{ base: "stretch", md: "center" }}
            gap="3"
          >
            {/* Condition Tabs */}
            <HStack gap="2" wrap="wrap">
              <Button
                size="xs"
                px="3"
                py="1.5"
                borderRadius="xl"
                fontSize="xs"
                fontWeight="medium"
                variant={activeTab === "all" ? "solid" : "subtle"}
                colorPalette="orange"
                onClick={() => setActiveTab("all")}
              >
                {t("aiReports.tabAll", isAr ? "جميع الأيام" : "All Days")}
              </Button>
              <Button
                size="xs"
                px="3"
                py="1.5"
                borderRadius="xl"
                fontSize="xs"
                fontWeight="medium"
                variant={activeTab === "adhd" ? "solid" : "subtle"}
                colorPalette="orange"
                onClick={() => setActiveTab("adhd")}
              >
                {t("aiReports.tabAdhd", isAr ? "التركيز و ADHD" : "Focus & ADHD")}
              </Button>
              <Button
                size="xs"
                px="3"
                py="1.5"
                borderRadius="xl"
                fontSize="xs"
                fontWeight="medium"
                variant={activeTab === "anxiety" ? "solid" : "subtle"}
                colorPalette="orange"
                onClick={() => setActiveTab("anxiety")}
              >
                {t("aiReports.tabAnxiety", isAr ? "القلق والتوتر" : "Anxiety & Tension")}
              </Button>
              <Button
                size="xs"
                px="3"
                py="1.5"
                borderRadius="xl"
                fontSize="xs"
                fontWeight="medium"
                variant={activeTab === "bipolar" ? "solid" : "subtle"}
                colorPalette="orange"
                onClick={() => setActiveTab("bipolar")}
              >
                {t("aiReports.tabBipolar", isAr ? "تقلبات المزاج" : "Mood Fluctuation")}
              </Button>
            </HStack>

            {/* Filter by Trigger Selector */}
            <HStack gap="2">
              <LuFilter size={15} color="#ea580c" />
              <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
                {isAr ? "تصفية بالمحفز:" : "Filter by Trigger:"}
              </Text>
              <ScrollArea orientation="horizontal" maxW={{ base: "100%", md: "320px" }}>
                <HStack gap="1.5" py="1" px="0.5" whiteSpace="nowrap">
                  <Button
                    size="2xs"
                    px="2"
                    py="1"
                    borderRadius="md"
                    variant={selectedTrigger === "all" ? "solid" : "outline"}
                    colorPalette="orange"
                    onClick={() => setSelectedTrigger("all")}
                  >
                    {isAr ? "الكل" : "All"}
                  </Button>
                  {allUniqueTriggers.map((trig, i) => (
                    <Button
                      key={i}
                      size="2xs"
                      px="2"
                      py="1"
                      borderRadius="md"
                      variant={selectedTrigger === trig ? "solid" : "outline"}
                      colorPalette="orange"
                      onClick={() => setSelectedTrigger(trig)}
                    >
                      {trig}
                    </Button>
                  ))}
                </HStack>
              </ScrollArea>
            </HStack>
          </Flex>

          {/* Longitudinal Transcripts List */}
          <Stack gap="4">
            {loading ? (
              <Box p="8" textAlign="center">
                <Text fontSize="sm" color="fg.muted">
                  {isAr ? "جارٍ تحميل السجلات المشفّرة..." : "Loading encrypted longitudinal transcripts..."}
                </Text>
              </Box>
            ) : filteredTranscripts.length === 0 ? (
              <Box p="8" textAlign="center" bg="bg.panel" borderRadius="2xl" borderWidth="1px" borderColor="border.subtle">
                <Text fontSize="sm" color="fg.muted">
                  {isAr ? "لا توجد سجلات تطابق الفلتر المختار." : "No daily transcripts match the selected filters."}
                </Text>
              </Box>
            ) : (
              filteredTranscripts.map((card) => {
                const moodColor = getMoodColor(card.moodTrajectory);
                return (
                  <Box
                    key={card.transcriptId}
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
                      <HStack gap="3" wrap="wrap">
                        <HStack gap="1.5" color="fg.muted" fontSize="xs">
                          <LuCalendar size={15} />
                          <Text fontWeight="semibold">{card.date}</Text>
                        </HStack>
                        <Badge
                          colorPalette={moodColor}
                          size="sm"
                          px="2.5"
                          py="0.5"
                          borderRadius="full"
                          fontSize="xs"
                          fontWeight="semibold"
                        >
                          {card.moodTrajectory.split("→")[0]?.trim() || "Active Venting"}
                        </Badge>
                      </HStack>

                      {/* Attached to Doctor File Interactive Control */}
                      <HStack gap="2">
                        <Button
                          size="2xs"
                          px="2.5"
                          py="1"
                          borderRadius="full"
                          variant={card.includeInClinicalFile ? "solid" : "outline"}
                          colorPalette={card.includeInClinicalFile ? "green" : "gray"}
                          onClick={() => handleToggleInclude(card.transcriptId, card.includeInClinicalFile)}
                        >
                          <HStack gap="1">
                            <LuCircleCheck size={13} />
                            <Text fontSize="2xs">
                              {card.includeInClinicalFile
                                ? t("aiReports.attachedBadge", isAr ? "مرفق بملف الطبيب" : "Attached to Doctor File")
                                : (isAr ? "مستبعد من الملف" : "Excluded from File")}
                            </Text>
                          </HStack>
                        </Button>
                      </HStack>
                    </Flex>

                    {/* Mood Trajectory Pathway */}
                    <Flex
                      align="center"
                      gap="2"
                      p="2.5"
                      mb="3"
                      borderRadius="xl"
                      bg="bg.subtle"
                      borderWidth="1px"
                      borderColor="border.subtle"
                    >
                      <LuTrendingUp size={14} color="#ea580c" />
                      <Text fontSize="2xs" fontWeight="bold" color="orange.600">
                        {isAr ? "مسار تقلب المزاج:" : "Mood Trajectory Arc:"}
                      </Text>
                      <Text fontSize="2xs" color="fg.muted">
                        {card.moodTrajectory}
                      </Text>
                    </Flex>

                    <Text fontSize="sm" color="fg" lineHeight="tall" mb="4">
                      {card.summaryText}
                    </Text>

                    <Flex
                      wrap="wrap"
                      justify="space-between"
                      align="center"
                      gap="3"
                      pt="3"
                      borderTopWidth="1px"
                      borderColor="border.subtle"
                    >
                      <HStack gap="2" wrap="wrap">
                        <Text fontSize="2xs" color="fg.muted">
                          {t("aiReports.triggersLabel", isAr ? "المحفزات:" : "Triggers:")}
                        </Text>
                        {card.triggers.map((trig, i) => (
                          <Badge
                            key={i}
                            size="xs"
                            colorPalette="orange"
                            variant="outline"
                            px="2"
                            py="0.5"
                            borderRadius="md"
                            fontSize="2xs"
                          >
                            {trig}
                          </Badge>
                        ))}

                        <Text fontSize="2xs" color="fg.muted" ml="2">
                          {t("aiReports.symptomsLabel", isAr ? "الأعراض:" : "Symptoms:")}
                        </Text>
                        {card.symptoms.map((s, i) => (
                          <Badge
                            key={i}
                            size="xs"
                            colorPalette="teal"
                            variant="subtle"
                            px="2"
                            py="0.5"
                            borderRadius="md"
                            fontSize="2xs"
                          >
                            {s}
                          </Badge>
                        ))}
                      </HStack>

                      <Button
                        size="xs"
                        px="3"
                        py="1"
                        fontSize="xs"
                        fontWeight="semibold"
                        variant="ghost"
                        colorPalette="orange"
                        onClick={() => setActiveLogModal(card)}
                      >
                        <HStack gap="1">
                          <LuFileText size={14} />
                          <Text>{t("aiReports.viewFullLog", isAr ? "عرض السجل المفصل" : "View Full Log")}</Text>
                        </HStack>
                      </Button>
                    </Flex>
                  </Box>
                );
              })
            )}
          </Stack>
        </Stack>
      </Container>

      {/* Full Transcript Detail Modal */}
      {activeLogModal && (
        <Box
          position="fixed"
          inset="0"
          bg="black/75"
          backdropFilter="blur(6px)"
          zIndex={2000}
          display="flex"
          alignItems="center"
          justifyContent="center"
          p="4"
          dir={isAr ? "rtl" : "ltr"}
        >
          <Box
            maxW="2xl"
            w="100%"
            bg="bg.panel"
            borderRadius="3xl"
            borderWidth="1px"
            borderColor="border.subtle"
            boxShadow="2xl"
            overflow="hidden"
          >
            <Box p="5" borderBottomWidth="1px" borderColor="border.subtle" bg="bg.subtle">
              <Flex justify="space-between" align="center">
                <HStack gap="2">
                  <LuFileText size={18} color="#ea580c" />
                  <Text fontWeight="bold" fontSize="md">
                    {isAr ? "سجل الجلسة السريرية المفصل" : "Detailed Clinical Session Transcript"}
                  </Text>
                  <Badge colorPalette="orange" size="xs">
                    {activeLogModal.date}
                  </Badge>
                </HStack>
                <IconButton
                  aria-label="Close"
                  variant="ghost"
                  size="sm"
                  onClick={() => setActiveLogModal(null)}
                >
                  <LuX size={18} />
                </IconButton>
              </Flex>
            </Box>

            <Stack p="6" gap="4" maxH="75vh" overflowY="auto">
              <Box p="3" borderRadius="xl" bg="bg.subtle">
                <Text fontSize="xs" fontWeight="bold" color="orange.600" mb="1">
                  {isAr ? "مسار المزاج الموثق:" : "Documented Mood Trajectory:"}
                </Text>
                <Text fontSize="xs">{activeLogModal.moodTrajectory}</Text>
              </Box>

              <Box>
                <Text fontSize="xs" fontWeight="bold" mb="1">
                  {isAr ? "الملخص السريري المركّز:" : "Synthesized Clinical Summary:"}
                </Text>
                <Text fontSize="sm" color="fg" lineHeight="tall">
                  {activeLogModal.summaryText}
                </Text>
              </Box>

              <HStack gap="2" wrap="wrap">
                <Text fontSize="xs" fontWeight="bold">
                  {isAr ? "المحفزات المسجلة:" : "Recorded Triggers:"}
                </Text>
                {activeLogModal.triggers.map((t, i) => (
                  <Badge key={i} colorPalette="orange" size="xs">
                    {t}
                  </Badge>
                ))}
              </HStack>

              <HStack gap="2" wrap="wrap">
                <Text fontSize="xs" fontWeight="bold">
                  {isAr ? "العلامات السلوكية:" : "Behavioral Markers:"}
                </Text>
                {activeLogModal.symptoms.map((s, i) => (
                  <Badge key={i} colorPalette="teal" size="xs">
                    {s}
                  </Badge>
                ))}
              </HStack>

              {activeLogModal.rawChatLog && (
                <Box mt="2" p="3" borderRadius="xl" bg="bg.subtle">
                  <Text fontSize="xs" fontWeight="bold" mb="2">
                    {isAr ? "أرشيف المحادثة الخام (مشفر):" : "Raw Conversation Snapshot:"}
                  </Text>
                  <Box
                    as="pre"
                    fontSize="2xs"
                    color="fg.muted"
                    maxH="150px"
                    overflowY="auto"
                    whiteSpace="pre-wrap"
                  >
                    {activeLogModal.rawChatLog}
                  </Box>
                </Box>
              )}
            </Stack>

            <Box p="4" borderTopWidth="1px" borderColor="border.subtle" bg="bg.subtle">
              <Flex justify="flex-end">
                <Button
                  size="sm"
                  borderRadius="xl"
                  onClick={() => setActiveLogModal(null)}
                >
                  {isAr ? "إغلاق" : "Close"}
                </Button>
              </Flex>
            </Box>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default AiReports;
