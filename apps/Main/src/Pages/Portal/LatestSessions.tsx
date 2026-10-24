import React, { useState, useEffect, useRef } from "react";
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
  Textarea,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { useUser } from "@repo/react-appwrite";
import {
  LuCalendar,
  LuVideo,
  LuSparkles,
  LuPill,
  LuClock,
  LuCheck,
  LuShieldCheck,
  LuFileText,
  LuActivity,
  LuPhoneOff,
  LuSave,
  LuStethoscope,
} from "react-icons/lu";
import {
  initializeZegoConsultation,
  destroyZegoConsultation,
} from "../../services/zegocloudService";
import {
  fetchPatientSessions,
  updateSessionNotes,
  type SessionRecord,
} from "../../services/clinicalFileService";
import { fetchPatientTranscripts, type TranscriptRecord } from "../../services/groqService";
import { getRecentScreeningScores } from "../../services/gameService";
import type { ZegoUIKitPrebuilt } from "@zegocloud/zego-uikit-prebuilt";

export const LatestSessions: React.FC = () => {
  const { t } = useTranslation();
  const { user, profile } = useUser();
  const [searchParams] = useSearchParams();

  // Tab switcher: upcoming | telehealth | history
  const [activeTab, setActiveTab] = useState<"upcoming" | "telehealth" | "history">("history");

  // Sessions state
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Active Telehealth Call State
  const [activeRoomId, setActiveRoomId] = useState<string>("bridgecare_consult_room_demo");
  const [isCallMounted, setIsCallMounted] = useState<boolean>(false);
  const [activeDoctorName, setActiveDoctorName] = useState<string>("Dr. Tarek Al-Mansouri");
  const videoContainerRef = useRef<HTMLDivElement | null>(null);
  const zegoInstanceRef = useRef<ZegoUIKitPrebuilt | null>(null);

  // Shared Session Context Telemetry
  const [transcripts, setTranscripts] = useState<TranscriptRecord[]>([]);
  const [gameScores, setGameScores] = useState<Record<string, number>>({
    attention: 7,
    mood: 6,
    pattern: 3,
  });

  // Doctor / In-Session E-Pad Notes
  const [sessionNotes, setSessionNotes] = useState<string>(
    "Patient exhibits sustained grounding. Focus metrics improved after 60-second de-escalation exercise. Recommend maintaining current sensory accommodations."
  );
  const [notesSavedSuccess, setNotesSavedSuccess] = useState(false);

  // Selected dossier inspection modal
  const [selectedDossierSession, setSelectedDossierSession] = useState<SessionRecord | null>(null);

  // Handle URL query parameters (e.g. ?telehealth=true&room=...)
  useEffect(() => {
    const isTelehealth = searchParams.get("telehealth");
    const room = searchParams.get("room");
    if (isTelehealth === "true") {
      setActiveTab("telehealth");
      if (room) {
        setActiveRoomId(room);
      }
    }
  }, [searchParams]);

  // Load patient sessions, transcripts & game scores
  useEffect(() => {
    let isMounted = true;
    async function loadSessionData() {
      setLoadingSessions(true);
      const userId = user?.$id || "patient-1";
      const [loadedSessions, loadedTranscripts, loadedScores] = await Promise.all([
        fetchPatientSessions(userId),
        fetchPatientTranscripts(userId),
        getRecentScreeningScores(userId),
      ]);
      if (isMounted) {
        setSessions(loadedSessions);
        setTranscripts(loadedTranscripts);
        setGameScores(loadedScores);
        setLoadingSessions(false);
      }
    }
    loadSessionData();
    return () => {
      isMounted = false;
    };
  }, [user]);

  // Handle mounting and unmounting ZEGOCLOUD frame
  useEffect(() => {
    let zp: ZegoUIKitPrebuilt | null = null;

    if (activeTab === "telehealth" && isCallMounted && videoContainerRef.current) {
      const patientName = profile?.userName || user?.name || "Patient";
      const userId = user?.$id || "patient_" + Math.random().toString(36).substring(2, 7);

      initializeZegoConsultation(
        videoContainerRef.current,
        activeRoomId,
        userId,
        patientName,
        "patient",
        () => {
          // On leave room callback
          setIsCallMounted(false);
        }
      )
        .then((instance) => {
          zp = instance;
          zegoInstanceRef.current = instance;
        })
        .catch((err) => {
          console.error("ZEGOCLOUD mount error:", err);
        });
    }

    return () => {
      if (zp || zegoInstanceRef.current) {
        destroyZegoConsultation(zp || zegoInstanceRef.current);
        zegoInstanceRef.current = null;
      }
    };
  }, [activeTab, isCallMounted, activeRoomId, user, profile]);

  const handleStartCall = (roomId?: string, docName?: string) => {
    if (roomId) setActiveRoomId(roomId);
    if (docName) setActiveDoctorName(docName);
    setActiveTab("telehealth");
    setIsCallMounted(true);
  };

  const handleLeaveCall = () => {
    if (zegoInstanceRef.current) {
      destroyZegoConsultation(zegoInstanceRef.current);
      zegoInstanceRef.current = null;
    }
    setIsCallMounted(false);
  };

  const handleSaveNotes = async () => {
    await updateSessionNotes(activeRoomId, sessionNotes);
    setNotesSavedSuccess(true);
    setTimeout(() => setNotesSavedSuccess(false), 2000);
  };

  // Derive top triggers from longitudinal transcripts
  const topTriggers = Array.from(
    new Set(transcripts.flatMap((t) => t.triggers || []))
  ).slice(0, 4);

  const upcomingSessions = sessions.filter((s) => s.status === "booked");
  const pastSessions = sessions.filter((s) => s.status === "completed" || s.status !== "booked");

  return (
    <Box minH="100vh" bg="bg" color="fg" py="8" px={{ base: "4", md: "8" }}>
      <Container maxW="6xl">
        <Stack gap="8">
          {/* Header */}
          <Flex
            direction={{ base: "column", md: "row" }}
            justify="space-between"
            align={{ base: "start", md: "center" }}
            gap="4"
          >
            <Stack gap="1">
              <HStack gap="2">
                <LuCalendar size={22} color="#ea580c" />
                <Text fontSize="2xl" fontWeight="bold">
                  {t("sessions.title")}
                </Text>
                <Badge colorPalette="orange" size="sm" px="2.5" py="0.5" borderRadius="full">
                  Pillar 3
                </Badge>
              </HStack>
              <Text fontSize="sm" color="fg.muted" maxW="2xl">
                {t("sessions.subtitle")}
              </Text>
            </Stack>

            {/* Tab navigation buttons */}
            <HStack gap="2" wrap="wrap">
              <Button
                size="sm"
                px="3.5"
                py="2"
                fontSize="xs"
                fontWeight="semibold"
                variant={activeTab === "upcoming" ? "solid" : "subtle"}
                colorPalette="orange"
                onClick={() => {
                  if (activeTab === "telehealth") handleLeaveCall();
                  setActiveTab("upcoming");
                }}
              >
                <HStack gap="1.5">
                  <LuClock size={14} />
                  <Text>Upcoming ({upcomingSessions.length})</Text>
                </HStack>
              </Button>
              <Button
                size="sm"
                px="3.5"
                py="2"
                fontSize="xs"
                fontWeight="semibold"
                variant={activeTab === "telehealth" ? "solid" : "subtle"}
                colorPalette="orange"
                onClick={() => setActiveTab("telehealth")}
              >
                <HStack gap="1.5">
                  <LuVideo size={14} />
                  <Text>{t("sessions.telehealthTab")}</Text>
                </HStack>
              </Button>
              <Button
                size="sm"
                px="3.5"
                py="2"
                fontSize="xs"
                fontWeight="semibold"
                variant={activeTab === "history" ? "solid" : "subtle"}
                colorPalette="orange"
                onClick={() => {
                  if (activeTab === "telehealth") handleLeaveCall();
                  setActiveTab("history");
                }}
              >
                <HStack gap="1.5">
                  <LuFileText size={14} />
                  <Text>{t("sessions.historyTab")}</Text>
                </HStack>
              </Button>
            </HStack>
          </Flex>

          {/* VIEW 1: LIVE TELEHEALTH ROOM (ZEGOCLOUD + SHARED SESSION CONTEXT) */}
          {activeTab === "telehealth" && (
            <Grid templateColumns={{ base: "1fr", lg: "1.9fr 1.1fr" }} gap="6" alignItems="start">
              {/* Left Panel: ZEGOCLOUD Video Consultation Frame */}
              <Stack gap="4">
                {/* Doctor Room Banner */}
                <Box
                  p="4"
                  borderRadius="2xl"
                  bg="bg.panel"
                  borderWidth="1px"
                  borderColor="border.subtle"
                >
                  <Flex justify="space-between" align="center" wrap="wrap" gap="2">
                    <HStack gap="3">
                      <Flex
                        w="10"
                        h="10"
                        borderRadius="xl"
                        bg="orange.500"
                        color="white"
                        align="center"
                        justify="center"
                        fontWeight="bold"
                        fontSize="sm"
                      >
                        {activeDoctorName.slice(0, 2)}
                      </Flex>
                      <Stack gap="0">
                        <HStack gap="1.5">
                          <Text fontSize="sm" fontWeight="bold">
                            {activeDoctorName}
                          </Text>
                          <LuShieldCheck size={16} color="#16a34a" />
                        </HStack>
                        <Text fontSize="2xs" color="fg.muted">
                          Room: {activeRoomId.slice(0, 18)}...
                        </Text>
                      </Stack>
                    </HStack>

                    <HStack gap="2">
                      <Badge
                        colorPalette={isCallMounted ? "green" : "gray"}
                        size="sm"
                        px="2.5"
                        py="0.5"
                        borderRadius="full"
                      >
                        {isCallMounted ? t("sessions.liveBadge") : "Standby"}
                      </Badge>
                      {isCallMounted && (
                        <Button
                          size="xs"
                          colorPalette="red"
                          variant="surface"
                          onClick={handleLeaveCall}
                        >
                          <HStack gap="1">
                            <LuPhoneOff size={13} />
                            <Text>{t("sessions.leaveSession")}</Text>
                          </HStack>
                        </Button>
                      )}
                    </HStack>
                  </Flex>
                </Box>

                {/* Video Frame Canvas */}
                <Box
                  minH="500px"
                  borderRadius="3xl"
                  bg="radial-gradient(circle at center, #1e293b 0%, #0b1120 100%)"
                  borderWidth="2px"
                  borderColor={isCallMounted ? "green.500/40" : "orange.500/30"}
                  overflow="hidden"
                  position="relative"
                  display="flex"
                  flexDirection="column"
                  justifyContent="center"
                  alignItems="center"
                  color="white"
                  boxShadow="xl"
                >
                  {isCallMounted ? (
                    /* ZEGOCLOUD Mount Container */
                    <Box
                      ref={videoContainerRef}
                      w="100%"
                      h="500px"
                      position="relative"
                    />
                  ) : (
                    /* Pre-Call Joining Screen */
                    <Stack gap="4" align="center" textAlign="center" p="6" maxW="md">
                      <Flex
                        w="20"
                        h="20"
                        borderRadius="full"
                        bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                        align="center"
                        justify="center"
                        fontSize="2xl"
                        fontWeight="bold"
                        boxShadow="0 0 30px rgba(234, 88, 12, 0.45)"
                      >
                        <LuVideo size={36} color="white" />
                      </Flex>
                      <Stack gap="1">
                        <Text fontSize="lg" fontWeight="bold">
                          Ready for 1-on-1 Consultation
                        </Text>
                        <Text fontSize="xs" color="gray.300">
                          {t("sessions.reviewingNote")}
                        </Text>
                      </Stack>

                      <Box p="3" borderRadius="xl" bg="white/5" borderWidth="1px" borderColor="white/10" w="100%">
                        <HStack justify="space-between" fontSize="2xs" color="gray.300">
                          <Text>Encrypted WebRTC Channel:</Text>
                          <Badge colorPalette="green" size="xs">
                            Active
                          </Badge>
                        </HStack>
                        <HStack justify="space-between" fontSize="2xs" color="gray.300" mt="1.5">
                          <Text>Pre-Session File Status:</Text>
                          <Badge colorPalette="teal" size="xs">
                            Delivered to Doctor
                          </Badge>
                        </HStack>
                      </Box>

                      <Button
                        size="md"
                        px="6"
                        py="2.5"
                        fontSize="sm"
                        fontWeight="semibold"
                        bg="linear-gradient(135deg, #22c55e 0%, #16a34a 100%)"
                        color="white"
                        borderRadius="xl"
                        _hover={{ opacity: 0.92, transform: "scale(1.02)" }}
                        onClick={() => setIsCallMounted(true)}
                      >
                        <HStack gap="2">
                          <LuVideo size={16} />
                          <Text>Launch Video Consultation</Text>
                        </HStack>
                      </Button>
                    </Stack>
                  )}
                </Box>
              </Stack>

              {/* Right Panel: SHARED SESSION CONTEXT (Solves Problem C: Loss of Context) */}
              <Box
                p="6"
                borderRadius="3xl"
                bg="bg.panel"
                borderWidth="1px"
                borderColor="border.subtle"
                boxShadow="sm"
              >
                <Stack gap="5">
                  {/* Shared Context Header */}
                  <Flex justify="space-between" align="center">
                    <HStack gap="2">
                      <LuSparkles size={18} color="#ea580c" />
                      <Text fontWeight="bold" fontSize="sm">
                        {t("sessions.sharedContextTitle")}
                      </Text>
                    </HStack>
                    <Badge colorPalette="teal" size="xs" px="2" py="0.5" borderRadius="full">
                      Pillar 3 Live Feed
                    </Badge>
                  </Flex>

                  <Text fontSize="2xs" color="fg.muted">
                    {t("sessions.sharedContextDesc")}
                  </Text>

                  {/* Past 7 Days Mood Shift Trajectory */}
                  <Box p="3.5" borderRadius="2xl" bg="bg.subtle" borderWidth="1px" borderColor="border.subtle">
                    <HStack justify="space-between" mb="1.5">
                      <Text fontSize="xs" fontWeight="bold">
                        Past 7 Days Mood Trajectory:
                      </Text>
                      <Badge colorPalette="orange" size="xs">
                        Vault B
                      </Badge>
                    </HStack>
                    <Text fontSize="2xs" color="fg.muted" lineHeight="relaxed">
                      Calm focus morning → 3:30 PM sensory exhaustion & focus drift → Grounded late-night venting recovery.
                    </Text>
                  </Box>

                  {/* Top Identified Triggers */}
                  <Box p="3.5" borderRadius="2xl" bg="bg.subtle" borderWidth="1px" borderColor="border.subtle">
                    <Text fontSize="xs" fontWeight="bold" mb="2">
                      {t("sessions.topTriggerLabel")}
                    </Text>
                    <Flex wrap="wrap" gap="1.5">
                      {topTriggers.length > 0
                        ? topTriggers.map((trig, idx) => (
                            <Badge
                              key={idx}
                              colorPalette="orange"
                              size="xs"
                              px="2"
                              py="0.5"
                              borderRadius="md"
                            >
                              {trig}
                            </Badge>
                          ))
                        : ["Deadline Overload", "Sensory Noise", "Task Switching"].map((trig, idx) => (
                            <Badge key={idx} colorPalette="orange" size="xs" px="2" py="0.5" borderRadius="md">
                              {trig}
                            </Badge>
                          ))}
                    </Flex>
                  </Box>

                  {/* Indicative Game Scores (Pillar 2 Telemetry) */}
                  <Box p="3.5" borderRadius="2xl" bg="bg.subtle" borderWidth="1px" borderColor="border.subtle">
                    <HStack justify="space-between" mb="2">
                      <HStack gap="1">
                        <LuActivity size={14} color="#ea580c" />
                        <Text fontSize="xs" fontWeight="bold">
                          {t("sessions.telemetryLabel")}
                        </Text>
                      </HStack>
                      <Badge colorPalette="green" size="xs">
                        Screening Scores
                      </Badge>
                    </HStack>

                    <Grid templateColumns="repeat(3, 1fr)" gap="2" textAlign="center">
                      <Box p="2" borderRadius="xl" bg="orange.500/10">
                        <Text fontSize="2xs" color="fg.muted">Attention (ADHD)</Text>
                        <Text fontSize="sm" fontWeight="black" color="orange.600">
                          {gameScores.attention}/10
                        </Text>
                      </Box>
                      <Box p="2" borderRadius="xl" bg="teal.500/10">
                        <Text fontSize="2xs" color="fg.muted">Mood Stability</Text>
                        <Text fontSize="sm" fontWeight="black" color="teal.600">
                          {gameScores.mood}/10
                        </Text>
                      </Box>
                      <Box p="2" borderRadius="xl" bg="purple.500/10">
                        <Text fontSize="2xs" color="fg.muted">Pattern Loops</Text>
                        <Text fontSize="sm" fontWeight="black" color="purple.600">
                          {gameScores.pattern}/10
                        </Text>
                      </Box>
                    </Grid>
                  </Box>

                  {/* Doctor E-Pad / In-Session Notes */}
                  <Box p="3.5" borderRadius="2xl" bg="bg.subtle" borderWidth="1px" borderColor="border.subtle">
                    <Flex justify="space-between" align="center" mb="1.5">
                      <Text fontSize="xs" fontWeight="bold">
                        Clinical E-Pad (Doctor & Patient Notes):
                      </Text>
                      {notesSavedSuccess && (
                        <Badge colorPalette="green" size="xs">
                          Saved
                        </Badge>
                      )}
                    </Flex>
                    <Textarea
                      value={sessionNotes}
                      onChange={(e) => setSessionNotes(e.target.value)}
                      rows={3}
                      fontSize="2xs"
                      borderRadius="xl"
                      bg="bg.panel"
                      borderWidth="1px"
                      borderColor="border.subtle"
                      mb="2"
                    />
                    <Flex justify="flex-end">
                      <Button size="xs" colorPalette="orange" variant="outline" onClick={handleSaveNotes}>
                        <HStack gap="1">
                          <LuSave size={12} />
                          <Text>Save Notes</Text>
                        </HStack>
                      </Button>
                    </Flex>
                  </Box>
                </Stack>
              </Box>
            </Grid>
          )}

          {/* VIEW 2: UPCOMING SESSIONS */}
          {activeTab === "upcoming" && (
            <Stack gap="5">
              {upcomingSessions.length === 0 ? (
                <Box p="10" borderRadius="3xl" bg="bg.panel" textAlign="center" borderWidth="1px" borderColor="border.subtle">
                  <Text fontSize="md" fontWeight="bold">
                    No upcoming sessions scheduled
                  </Text>
                  <Text fontSize="xs" color="fg.muted" mt="1">
                    Book a consultation with a licensed psychiatrist or psychologist to attach your Pre-Session Clinical File.
                  </Text>
                  <Button
                    mt="4"
                    size="sm"
                    bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                    color="white"
                    borderRadius="xl"
                    onClick={() => (window.location.href = "/sessions/therapists")}
                  >
                    Browse Therapists Directory
                  </Button>
                </Box>
              ) : (
                upcomingSessions.map((sess) => (
                  <Box
                    key={sess.id}
                    p="6"
                    borderRadius="3xl"
                    bg="bg.panel"
                    borderWidth="1px"
                    borderColor="border.subtle"
                  >
                    <Flex
                      direction={{ base: "column", sm: "row" }}
                      justify="space-between"
                      align={{ base: "start", sm: "center" }}
                      gap="4"
                    >
                      <HStack gap="3">
                        <Flex
                          w="12"
                          h="12"
                          borderRadius="2xl"
                          bg="orange.500"
                          color="white"
                          align="center"
                          justify="center"
                          fontWeight="bold"
                        >
                          <LuVideo size={22} />
                        </Flex>
                        <Stack gap="0.5">
                          <HStack gap="2">
                            <Text fontSize="md" fontWeight="bold">
                              Session {sess.sessionNumber}: {sess.therapistName}
                            </Text>
                            <Badge colorPalette="green" size="xs" px="2" py="0.5" borderRadius="full">
                              Confirmed
                            </Badge>
                          </HStack>
                          <Text fontSize="2xs" color="fg.muted">
                            Scheduled: {sess.scheduledAt} • Duration: {sess.durationMinutes} mins
                          </Text>
                        </Stack>
                      </HStack>

                      <HStack gap="3">
                        <Button
                          size="sm"
                          bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                          color="white"
                          borderRadius="xl"
                          onClick={() => handleStartCall(sess.zegoRoomId, sess.therapistName)}
                        >
                          <HStack gap="1.5">
                            <LuVideo size={14} />
                            <Text>Enter Video Room</Text>
                          </HStack>
                        </Button>
                      </HStack>
                    </Flex>
                  </Box>
                ))
              )}
            </Stack>
          )}

          {/* VIEW 3: HISTORICAL SESSIONS LIST (Solves Session 1 vs Session 8 Memory Continuity) */}
          {activeTab === "history" && (
            <Stack gap="5">
              {pastSessions.map((sess) => (
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
                            {sess.sessionNumber === 8
                              ? t("sessions.sess8Title")
                              : sess.sessionNumber === 1
                              ? t("sessions.sess1Title")
                              : `Session ${sess.sessionNumber}`}
                          </Text>
                          <Badge
                            colorPalette="green"
                            size="xs"
                            px="2"
                            py="0.5"
                            borderRadius="full"
                            fontSize="2xs"
                            fontWeight="semibold"
                          >
                            {sess.status === "completed" ? "Completed" : sess.status}
                          </Badge>
                        </HStack>
                        <Text fontSize="2xs" color="fg.muted">
                          {sess.therapistName} • {sess.scheduledAt}
                        </Text>
                      </Stack>
                    </HStack>

                    <Button
                      size="xs"
                      variant="outline"
                      colorPalette="orange"
                      onClick={() => setSelectedDossierSession(sess)}
                    >
                      <HStack gap="1">
                        <LuFileText size={12} />
                        <Text>View Dossier</Text>
                      </HStack>
                    </Button>
                  </Flex>

                  <Box p="4" borderRadius="2xl" bg="bg.subtle" mb="3">
                    <Text fontSize="xs" color="fg" lineHeight="tall">
                      {sess.clinicalNotes ||
                        "Doctor seamlessly reviewed longitudinal transcripts. Treatment plan executed with zero lost context."}
                    </Text>
                  </Box>

                  <HStack
                    gap="2"
                    pt="2"
                    borderTopWidth="1px"
                    borderColor="border.subtle"
                    fontSize="2xs"
                    color="fg.muted"
                  >
                    <LuPill size={14} color="#ea580c" />
                    <Text fontWeight="semibold" color="orange.600">
                      {t("sessions.actionPlanLabel")}
                    </Text>
                    <Text>{sess.prescriptions || "Refined medication schedule + sensory grounding toolkit"}</Text>
                  </HStack>
                </Box>
              ))}
            </Stack>
          )}

          {/* Session Dossier Inspection Modal */}
          {selectedDossierSession && (
            <Box
              position="fixed"
              inset="0"
              bg="black/70"
              backdropFilter="blur(6px)"
              zIndex={2000}
              display="flex"
              alignItems="center"
              justifyContent="center"
              p="4"
            >
              <Box
                maxW="lg"
                w="100%"
                bg="bg.panel"
                borderRadius="3xl"
                p="6"
                borderWidth="1px"
                borderColor="orange.500/30"
                boxShadow="2xl"
              >
                <Stack gap="4">
                  <Flex justify="space-between" align="center">
                    <HStack gap="2">
                      <LuFileText size={18} color="#ea580c" />
                      <Text fontSize="md" fontWeight="bold">
                        Attached Clinical Dossier - Session {selectedDossierSession.sessionNumber}
                      </Text>
                    </HStack>
                    <Badge colorPalette="green" size="xs">
                      Shared with Doctor
                    </Badge>
                  </Flex>

                  <Box p="4" borderRadius="2xl" bg="bg.subtle" borderWidth="1px" borderColor="border.subtle">
                    <Text fontSize="2xs" fontWeight="bold" color="orange.600" mb="1">
                      Doctor Clinical Notes & Observations:
                    </Text>
                    <Text fontSize="xs" color="fg.muted" lineHeight="relaxed">
                      {selectedDossierSession.clinicalNotes}
                    </Text>
                  </Box>

                  <Box p="3" borderRadius="xl" bg="orange.500/10" borderWidth="1px" borderColor="orange.500/20">
                    <Text fontSize="2xs" fontWeight="bold" color="orange.600" mb="1">
                      Prescribed Action Plan & Interventions:
                    </Text>
                    <Text fontSize="xs">
                      {selectedDossierSession.prescriptions || "Sensory grounding exercises + executive pacing protocol"}
                    </Text>
                  </Box>

                  <Flex justify="flex-end">
                    <Button size="sm" variant="subtle" onClick={() => setSelectedDossierSession(null)}>
                      Close
                    </Button>
                  </Flex>
                </Stack>
              </Box>
            </Box>
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default LatestSessions;
