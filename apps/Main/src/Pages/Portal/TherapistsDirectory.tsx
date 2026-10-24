import React, { useState, useEffect } from "react";
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
  Input,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUser } from "@repo/react-appwrite";
import { ScrollArea } from "../../components/ui/scroll-area";
import {
  LuStethoscope,
  LuShieldCheck,
  LuCalendar,
  LuCircleCheck,
  LuStar,
  LuVideo,
  LuSparkles,
  LuLock,
  LuArrowRight,
  LuActivity,
  LuCheck,
} from "react-icons/lu";
import {
  fetchTherapists,
  synthesizeClinicalDossier,
  bookTherapistSession,
  type TherapistRecord,
  type ClinicalDossier,
  type SessionRecord,
} from "../../services/clinicalFileService";

export const TherapistsDirectory: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useUser();

  const [therapists, setTherapists] = useState<TherapistRecord[]>([]);
  const [loadingTherapists, setLoadingTherapists] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");

  // Booking Modal & Pre-Session Dossier State
  const [selectedDoctor, setSelectedDoctor] = useState<TherapistRecord | null>(null);
  const [dossier, setDossier] = useState<ClinicalDossier | null>(null);
  const [isCompilingDossier, setIsCompilingDossier] = useState(false);
  const [patientConsent, setPatientConsent] = useState(true);
  const [isBooking, setIsBooking] = useState(false);
  const [bookedSession, setBookedSession] = useState<SessionRecord | null>(null);

  // Specialties filter list
  const specialties = [
    { id: "all", label: "ALL CLINICIANS" },
    { id: "ADHD", label: "ADHD & FOCUS" },
    { id: "Anxiety", label: "ANXIETY & PANIC" },
    { id: "Bipolar", label: "BIPOLAR & MOOD" },
    { id: "OCD", label: "OCD & LOOPS" },
    { id: "PTSD", label: "PTSD & TRAUMA" },
    { id: "Depression", label: "DEPRESSION" },
  ];

  // Auto-filter by query param ?specialty= (e.g. from Gamified Screening Hub deep-link)
  useEffect(() => {
    const querySpecialty = searchParams.get("specialty");
    if (querySpecialty) {
      const match = specialties.find(
        (s) => s.id.toLowerCase() === querySpecialty.toLowerCase()
      );
      if (match) {
        setSelectedSpecialty(match.id);
      }
    }
  }, [searchParams]);

  // Load therapists from Appwrite THERAPISTS collection
  useEffect(() => {
    let isMounted = true;
    async function loadData() {
      setLoadingTherapists(true);
      const docs = await fetchTherapists();
      if (isMounted) {
        setTherapists(docs);
        setLoadingTherapists(false);
      }
    }
    loadData();
    return () => {
      isMounted = false;
    };
  }, []);

  // When doctor is selected, synthesize patient's pre-session dossier
  const handleOpenBooking = async (doc: TherapistRecord) => {
    setSelectedDoctor(doc);
    setIsCompilingDossier(true);
    try {
      const compiled = await synthesizeClinicalDossier(user?.$id || "guest_patient");
      setDossier(compiled);
    } catch (err) {
      console.warn("Could not compile dossier:", err);
    } finally {
      setIsCompilingDossier(false);
    }
  };

  const handleConfirmBooking = async () => {
    if (!selectedDoctor || !dossier) return;
    setIsBooking(true);
    try {
      const res = await bookTherapistSession(
        user?.$id || "patient_guest",
        selectedDoctor.id,
        selectedDoctor.nextAvailable || "Tomorrow, 3:00 PM",
        patientConsent ? dossier : undefined,
        selectedDoctor.name
      );
      setBookedSession(res.session);
    } catch (err) {
      console.error("Booking error:", err);
      alert(t("therapists.bookingSuccessAlert"));
      setSelectedDoctor(null);
    } finally {
      setIsBooking(false);
    }
  };

  const filteredTherapists = therapists.filter((doc) => {
    const matchesSearch =
      doc.name.toLowerCase().includes(search.toLowerCase()) ||
      doc.title.toLowerCase().includes(search.toLowerCase()) ||
      doc.specialties.some((s) => s.toLowerCase().includes(search.toLowerCase()));

    const matchesSpecialty =
      selectedSpecialty === "all" ||
      doc.specialties.some((s) => s.toLowerCase().includes(selectedSpecialty.toLowerCase()));

    return matchesSearch && matchesSpecialty;
  });

  return (
    <Box minH="100vh" bg="bg" color="fg" py="8" px={{ base: "4", md: "8" }}>
      <Container maxW="6xl">
        <Stack gap="8">
          {/* Header Banner with Pillar 3 Highlight */}
          <Box
            p={{ base: "6", md: "8" }}
            borderRadius="3xl"
            bg="linear-gradient(135deg, rgba(234, 88, 12, 0.09) 0%, rgba(20, 184, 166, 0.06) 100%)"
            borderWidth="1px"
            borderColor="orange.500/25"
            boxShadow="sm"
          >
            <Flex
              direction={{ base: "column", md: "row" }}
              justify="space-between"
              align={{ base: "start", md: "center" }}
              gap="6"
            >
              <Stack gap="2">
                <HStack gap="2">
                  <LuStethoscope size={24} color="#ea580c" />
                  <Text fontSize="2xl" fontWeight="bold">
                    {t("therapists.title")}
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
                    Pillar 3
                  </Badge>
                </HStack>
                <Text fontSize="sm" color="fg.muted" maxW="3xl">
                  {t("therapists.subtitle")}
                </Text>
              </Stack>

              <Box
                p="4"
                borderRadius="2xl"
                bg="bg.panel"
                borderWidth="1px"
                borderColor="green.500/30"
                textAlign="center"
                minW={{ md: "230px" }}
              >
                <Text fontSize="2xs" color="fg.muted" fontWeight="medium">
                  {t("therapists.savingsTitle")}
                </Text>
                <Text fontSize="2xl" fontWeight="black" color="green.600" my="0.5">
                  {t("therapists.savingsAmount")}
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
                  {t("therapists.savingsSubtitle")}
                </Badge>
              </Box>
            </Flex>
          </Box>

          {/* Directory Filters & Specialties ScrollArea */}
          <Flex direction={{ base: "column", md: "row" }} gap="4" justify="space-between" align={{ md: "center" }}>
            <HStack gap="2" flex="1" maxW={{ base: "100%", md: "400px" }}>
              <Input
                placeholder={t("therapists.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                borderRadius="xl"
                bg="bg.panel"
                borderWidth="1px"
                borderColor="border.subtle"
                fontSize="sm"
              />
            </HStack>

            <ScrollArea orientation="horizontal" maxW={{ base: "100%", md: "620px" }}>
              <HStack gap="2" py="1" px="0.5" whiteSpace="nowrap">
                {specialties.map((spec) => (
                  <Button
                    key={spec.id}
                    size="xs"
                    px="3"
                    py="1.5"
                    borderRadius="full"
                    fontSize="xs"
                    fontWeight="semibold"
                    variant={selectedSpecialty === spec.id ? "solid" : "subtle"}
                    colorPalette="orange"
                    onClick={() => setSelectedSpecialty(spec.id)}
                    flexShrink={0}
                  >
                    {spec.label}
                  </Button>
                ))}
              </HStack>
            </ScrollArea>
          </Flex>

          {/* Doctor Cards Grid */}
          {loadingTherapists ? (
            <Flex justify="center" align="center" minH="240px">
              <Text fontSize="sm" color="fg.muted">
                Connecting to Appwrite Clinical Directory...
              </Text>
            </Flex>
          ) : filteredTherapists.length === 0 ? (
            <Box p="10" borderRadius="3xl" bg="bg.panel" textAlign="center" borderWidth="1px" borderColor="border.subtle">
              <Text fontSize="md" fontWeight="bold">
                No clinicians found for this filter
              </Text>
              <Text fontSize="xs" color="fg.muted" mt="1">
                Try selecting "ALL CLINICIANS" or clearing your search term.
              </Text>
              <Button
                mt="4"
                size="xs"
                variant="outline"
                colorPalette="orange"
                onClick={() => {
                  setSelectedSpecialty("all");
                  setSearch("");
                }}
              >
                Reset Filters
              </Button>
            </Box>
          ) : (
            <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }} gap="6">
              {filteredTherapists.map((doc) => (
                <Box
                  key={doc.id}
                  p="6"
                  borderRadius="3xl"
                  bg="bg.panel"
                  borderWidth="1px"
                  borderColor="border.subtle"
                  _hover={{ borderColor: "orange.500/40", transform: "translateY(-3px)", boxShadow: "lg" }}
                  transition="all 0.25s ease"
                  display="flex"
                  flexDirection="column"
                  justifyContent="space-between"
                >
                  <Stack gap="4">
                    {/* Top Doctor Header */}
                    <Flex justify="space-between" align="start">
                      <HStack gap="3">
                        <Flex
                          w="12"
                          h="12"
                          borderRadius="2xl"
                          bg={doc.avatarBg}
                          color="white"
                          align="center"
                          justify="center"
                          fontSize="md"
                          fontWeight="bold"
                          boxShadow="0 4px 12px rgba(0,0,0,0.15)"
                        >
                          {doc.name.slice(0, 2)}
                        </Flex>
                        <Stack gap="0.5">
                          <HStack gap="1.5">
                            <Text fontWeight="bold" fontSize="md">
                              {doc.name}
                            </Text>
                            <LuShieldCheck size={16} color="#16a34a" />
                          </HStack>
                          <Badge
                            colorPalette="green"
                            size="xs"
                            px="1.5"
                            py="0"
                            borderRadius="md"
                            fontSize="2xs"
                            fontWeight="semibold"
                          >
                            {doc.licenseNumber}
                          </Badge>
                        </Stack>
                      </HStack>

                      <HStack gap="1" color="amber.500" fontSize="xs" fontWeight="bold">
                        <LuStar size={14} fill="currentColor" />
                        <Text>{doc.rating.toFixed(1)}</Text>
                        <Text fontSize="2xs" color="fg.muted">
                          ({doc.reviewsCount})
                        </Text>
                      </HStack>
                    </Flex>

                    <Text fontSize="xs" color="fg.muted" lineHeight="tall">
                      {doc.title}
                    </Text>

                    {/* Specialties Tags */}
                    <Flex wrap="wrap" gap="1.5">
                      {doc.specialties.map((s, idx) => (
                        <Badge
                          key={idx}
                          size="xs"
                          colorPalette="orange"
                          variant="surface"
                          px="2"
                          py="0.5"
                          borderRadius="md"
                          fontSize="2xs"
                          fontWeight="medium"
                        >
                          {s}
                        </Badge>
                      ))}
                    </Flex>

                    {/* Accepts Dossier Innovation Badge */}
                    {doc.acceptsDossier && (
                      <Box
                        p="2.5"
                        borderRadius="xl"
                        bg="teal.500/10"
                        borderWidth="1px"
                        borderColor="teal.500/20"
                      >
                        <HStack gap="1.5">
                          <LuCircleCheck size={14} color="#0d9488" />
                          <Text fontSize="2xs" fontWeight="bold" color="teal.600">
                            {t("therapists.acceptsFile")}
                          </Text>
                        </HStack>
                      </Box>
                    )}
                  </Stack>

                  {/* Pricing & Booking Footer */}
                  <Box pt="4" mt="4" borderTopWidth="1px" borderColor="border.subtle">
                    <Flex justify="space-between" align="center" mb="3">
                      <Stack gap="0">
                        <Text fontSize="2xs" color="fg.muted">
                          {t("therapists.feeLabel")}
                        </Text>
                        <Text fontSize="lg" fontWeight="black" color="fg">
                          ${doc.sessionFee}
                        </Text>
                      </Stack>
                      <HStack gap="1" color="fg.muted" fontSize="2xs">
                        <LuCalendar size={13} />
                        <Text>{doc.nextAvailable}</Text>
                      </HStack>
                    </Flex>

                    <Button
                      w="100%"
                      size="md"
                      px="4"
                      py="2"
                      fontSize="sm"
                      fontWeight="semibold"
                      bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                      color="white"
                      borderRadius="xl"
                      _hover={{ opacity: 0.92, transform: "scale(1.01)" }}
                      transition="all 0.15s ease"
                      onClick={() => handleOpenBooking(doc)}
                    >
                      <HStack gap="2">
                        <LuVideo size={16} />
                        <Text>{t("therapists.bookWithFile")}</Text>
                      </HStack>
                    </Button>
                  </Box>
                </Box>
              ))}
            </Grid>
          )}

          {/* Pre-Session Dossier Review & Booking Consent Modal */}
          {selectedDoctor && (
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
                maxW="2xl"
                w="100%"
                maxH="90vh"
                overflowY="auto"
                bg="bg.panel"
                borderRadius="3xl"
                p={{ base: "5", md: "7" }}
                borderWidth="1px"
                borderColor="orange.500/30"
                boxShadow="2xl"
              >
                {bookedSession ? (
                  /* Booking Confirmation State */
                  <Stack gap="5" textAlign="center" py="4">
                    <Flex
                      w="16"
                      h="16"
                      borderRadius="full"
                      bg="green.500/15"
                      color="green.600"
                      align="center"
                      justify="center"
                      mx="auto"
                    >
                      <LuCheck size={32} />
                    </Flex>
                    <Stack gap="1">
                      <Text fontSize="xl" fontWeight="bold">
                        Appointment Confirmed with {selectedDoctor.name}
                      </Text>
                      <Text fontSize="xs" color="fg.muted" maxW="md" mx="auto">
                        Your Pre-Session Clinical Dossier has been securely delivered to your doctor. Session 1 direct intervention will launch on schedule.
                      </Text>
                    </Stack>

                    <Box p="4" borderRadius="2xl" bg="bg.subtle" borderWidth="1px" borderColor="border.subtle" textAlign="left">
                      <HStack justify="space-between" mb="2">
                        <Text fontSize="xs" fontWeight="bold">
                          Room ID:
                        </Text>
                        <Badge colorPalette="orange" size="sm" px="2" py="0.5" borderRadius="md">
                          {bookedSession.zegoRoomId}
                        </Badge>
                      </HStack>
                      <HStack justify="space-between">
                        <Text fontSize="xs" fontWeight="bold">
                          Scheduled For:
                        </Text>
                        <Text fontSize="xs" color="fg.muted">
                          {bookedSession.scheduledAt}
                        </Text>
                      </HStack>
                    </Box>

                    <Flex justify="center" gap="3" pt="2">
                      <Button
                        size="sm"
                        variant="subtle"
                        onClick={() => {
                          setSelectedDoctor(null);
                          setBookedSession(null);
                        }}
                      >
                        Close
                      </Button>
                      <Button
                        size="sm"
                        bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                        color="white"
                        borderRadius="xl"
                        onClick={() => {
                          navigate(`/sessions/latest?telehealth=true&room=${bookedSession.zegoRoomId}`);
                        }}
                      >
                        <HStack gap="1.5">
                          <LuVideo size={14} />
                          <Text>Enter Telehealth Room Now</Text>
                        </HStack>
                      </Button>
                    </Flex>
                  </Stack>
                ) : (
                  /* Dossier Inspection & Consent Flow */
                  <Stack gap="5">
                    {/* Modal Header */}
                    <Flex justify="space-between" align="center">
                      <HStack gap="2">
                        <LuSparkles size={20} color="#ea580c" />
                        <Text fontSize="lg" fontWeight="bold">
                          {t("therapists.modalTitle")}
                        </Text>
                      </HStack>
                      <Badge
                        colorPalette="green"
                        size="xs"
                        px="2.5"
                        py="1"
                        borderRadius="full"
                        fontSize="2xs"
                        fontWeight="semibold"
                      >
                        <HStack gap="1">
                          <LuLock size={12} />
                          <Text>{t("therapists.encryptedVault")}</Text>
                        </HStack>
                      </Badge>
                    </Flex>

                    {/* Doctor Info Subheader */}
                    <Box p="3.5" borderRadius="2xl" bg="bg.subtle" borderWidth="1px" borderColor="border.subtle">
                      <Flex justify="space-between" align="center">
                        <HStack gap="2.5">
                          <Flex
                            w="9"
                            h="9"
                            borderRadius="xl"
                            bg={selectedDoctor.avatarBg}
                            color="white"
                            align="center"
                            justify="center"
                            fontWeight="bold"
                            fontSize="sm"
                          >
                            {selectedDoctor.name.slice(0, 2)}
                          </Flex>
                          <Stack gap="0">
                            <Text fontSize="xs" fontWeight="bold">
                              {selectedDoctor.name}
                            </Text>
                            <Text fontSize="2xs" color="fg.muted">
                              {selectedDoctor.title}
                            </Text>
                          </Stack>
                        </HStack>
                        <Text fontSize="xs" fontWeight="black" color="fg">
                          ${selectedDoctor.sessionFee} / 50m
                        </Text>
                      </Flex>
                    </Box>

                    {/* Pre-Session Clinical Dossier Details */}
                    {isCompilingDossier ? (
                      <Box p="8" textAlign="center" borderRadius="2xl" bg="bg.subtle">
                        <Text fontSize="xs" color="fg.muted">
                          Compiling 14 days of AI daily venting transcripts & cognitive screening indicators...
                        </Text>
                      </Box>
                    ) : dossier ? (
                      <Stack gap="3.5">
                        <Box p="4" borderRadius="2xl" bg="bg.subtle" borderWidth="1px" borderColor="border.subtle">
                          <Text fontSize="xs" fontWeight="bold" color="orange.600" mb="2">
                            {t("therapists.dossierIntro")}
                          </Text>

                          {/* Executive Summary */}
                          <Text fontSize="2xs" color="fg.muted" lineHeight="relaxed" mb="3">
                            {dossier.executiveSummary}
                          </Text>

                          {/* Verified Cognitive Indicators */}
                          <Box p="3" borderRadius="xl" bg="bg.panel" mb="3" borderWidth="1px" borderColor="border.subtle">
                            <HStack justify="space-between" mb="2">
                              <HStack gap="1">
                                <LuActivity size={13} color="#ea580c" />
                                <Text fontSize="2xs" fontWeight="bold">
                                  Cognitive Screening Indicators:
                                </Text>
                              </HStack>
                              <Text fontSize="2xs" color="fg.muted">
                                Starlight Focus Telemetry
                              </Text>
                            </HStack>
                            <Grid templateColumns="repeat(3, 1fr)" gap="2" textAlign="center">
                              <Box p="1.5" borderRadius="lg" bg="orange.500/10">
                                <Text fontSize="2xs" color="fg.muted">Attention</Text>
                                <Text fontSize="sm" fontWeight="black" color="orange.600">
                                  {dossier.gameScores.attention}/10
                                </Text>
                              </Box>
                              <Box p="1.5" borderRadius="lg" bg="teal.500/10">
                                <Text fontSize="2xs" color="fg.muted">Mood Stability</Text>
                                <Text fontSize="sm" fontWeight="black" color="teal.600">
                                  {dossier.gameScores.mood}/10
                                </Text>
                              </Box>
                              <Box p="1.5" borderRadius="lg" bg="purple.500/10">
                                <Text fontSize="2xs" color="fg.muted">Pattern Checking</Text>
                                <Text fontSize="sm" fontWeight="black" color="purple.600">
                                  {dossier.gameScores.pattern}/10
                                </Text>
                              </Box>
                            </Grid>
                          </Box>

                          {/* Chief Complaints list */}
                          <Stack gap="1.5" fontSize="2xs" color="fg.muted">
                            {dossier.chiefComplaints.map((complaint, idx) => (
                              <HStack key={idx} gap="1.5" align="start">
                                <LuCircleCheck size={13} color="#16a34a" style={{ marginTop: "2px", flexShrink: 0 }} />
                                <Text>{complaint}</Text>
                              </HStack>
                            ))}
                          </Stack>
                        </Box>

                        {/* Patient Consent Checkbox */}
                        <Box
                          p="3.5"
                          borderRadius="xl"
                          bg={patientConsent ? "orange.500/8" : "bg.subtle"}
                          borderWidth="1px"
                          borderColor={patientConsent ? "orange.500/30" : "border.subtle"}
                          cursor="pointer"
                          onClick={() => setPatientConsent(!patientConsent)}
                        >
                          <HStack gap="2.5" align="start">
                            <Box
                              w="4"
                              h="4"
                              borderRadius="md"
                              borderWidth="1.5px"
                              borderColor={patientConsent ? "orange.500" : "fg.muted"}
                              bg={patientConsent ? "orange.500" : "transparent"}
                              display="flex"
                              alignItems="center"
                              justifyContent="center"
                              color="white"
                              mt="0.5"
                            >
                              {patientConsent && <LuCheck size={12} />}
                            </Box>
                            <Stack gap="0.5">
                              <Text fontSize="xs" fontWeight="semibold">
                                Share Pre-Session Clinical Brief with {selectedDoctor.name}
                              </Text>
                              <Text fontSize="2xs" color="fg.muted">
                                Enables direct Session 1 therapeutic intervention without spending 3–5 sessions narrating background history.
                              </Text>
                            </Stack>
                          </HStack>
                        </Box>

                        {/* Financial Highlight Box */}
                        <Box p="3" borderRadius="xl" bg="green.500/10" borderWidth="1px" borderColor="green.500/25">
                          <HStack justify="space-between" align="center">
                            <Text fontSize="xs" fontWeight="bold" color="green.600">
                              {t("therapists.savedHighlight")}
                            </Text>
                            <Badge colorPalette="green" size="xs">
                              Saves $450
                            </Badge>
                          </HStack>
                        </Box>
                      </Stack>
                    ) : null}

                    {/* Action Buttons */}
                    <Flex justify="flex-end" gap="3" pt="2">
                      <Button
                        size="sm"
                        px="3.5"
                        py="2"
                        fontSize="xs"
                        fontWeight="semibold"
                        variant="ghost"
                        onClick={() => setSelectedDoctor(null)}
                      >
                        {t("community.cancel")}
                      </Button>
                      <Button
                        size="sm"
                        px="4"
                        py="2"
                        fontSize="xs"
                        fontWeight="semibold"
                        bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                        color="white"
                        borderRadius="xl"
                        loading={isBooking}
                        onClick={handleConfirmBooking}
                      >
                        <HStack gap="1.5">
                          <Text>{t("therapists.confirmButton")}</Text>
                          <LuArrowRight size={14} />
                        </HStack>
                      </Button>
                    </Flex>
                  </Stack>
                )}
              </Box>
            </Box>
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default TherapistsDirectory;
