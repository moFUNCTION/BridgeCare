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
  Input,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import {
  LuStethoscope,
  LuShieldCheck,
  LuCalendar,
  LuCircleCheck,
  LuStar,
  LuVideo,
} from "react-icons/lu";

interface Therapist {
  id: string;
  name: string;
  title: string;
  licenseNumber: string;
  specialties: string[];
  rating: number;
  reviewsCount: number;
  sessionFee: number;
  nextAvailable: string;
  acceptsDossier: boolean;
  avatarBg: string;
}

export const TherapistsDirectory: React.FC = () => {
  const { t } = useTranslation();

  const [search, setSearch] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("all");
  const [selectedDoctor, setSelectedDoctor] = useState<Therapist | null>(null);

  const therapists: Therapist[] = [
    {
      id: "doc-1",
      name: "Dr. Tarek Al-Mansouri",
      title: "Consultant Psychiatrist (ADHD & Neurodivergence)",
      licenseNumber: "MED-PSY-84920",
      specialties: ["ADHD & Focus", "Anxiety", "Bipolar"],
      rating: 4.9,
      reviewsCount: 128,
      sessionFee: 120,
      nextAvailable: "Tomorrow, 3:00 PM",
      acceptsDossier: true,
      avatarBg: "#ea580c",
    },
    {
      id: "doc-2",
      name: "Dr. Layla Kamal, PhD",
      title: "Clinical Psychologist (CBT & OCD Specialist)",
      licenseNumber: "PSY-LIC-39102",
      specialties: ["OCD Loops", "Panic", "Depression"],
      rating: 4.8,
      reviewsCount: 94,
      sessionFee: 95,
      nextAvailable: "Thursday, 11:00 AM",
      acceptsDossier: true,
      avatarBg: "#0d9488",
    },
    {
      id: "doc-3",
      name: "Dr. Youssef El-Sherif",
      title: "Psychiatrist (Trauma & Mood Spectrum)",
      licenseNumber: "MED-PSY-61205",
      specialties: ["PTSD", "Depression", "Bipolar"],
      rating: 5.0,
      reviewsCount: 76,
      sessionFee: 140,
      nextAvailable: "Saturday, 5:30 PM",
      acceptsDossier: true,
      avatarBg: "#6366f1",
    },
  ];

  const handleBook = (doc: Therapist) => {
    setSelectedDoctor(doc);
  };

  const confirmBooking = () => {
    setSelectedDoctor(null);
    alert(t("therapists.bookingSuccessAlert"));
  };

  return (
    <Box minH="100vh" bg="bg" color="fg" py="8" px={{ base: "4", md: "8" }}>
      <Container maxW="6xl">
        <Stack gap="8">
          {/* Header Banner with Pillar 3 Highlight */}
          <Box
            p={{ base: "6", md: "8" }}
            borderRadius="3xl"
            bg="linear-gradient(135deg, rgba(234, 88, 12, 0.09) 0%, rgba(20, 184, 166, 0.05) 100%)"
            borderWidth="1px"
            borderColor="orange.500/25"
          >
            <Flex
              direction={{ base: "column", md: "row" }}
              justify="space-between"
              align={{ base: "start", md: "center" }}
              gap="4"
            >
              <Stack gap="2">
                <HStack gap="2">
                  <LuStethoscope size={24} color="#ea580c" />
                  <Text fontSize="2xl" fontWeight="bold">
                    {t("therapists.title")}
                  </Text>
                  <Badge colorPalette="orange" size="md">
                    Pillar 3
                  </Badge>
                </HStack>
                <Text fontSize="sm" color="fg.muted" maxW="3xl">
                  {t("therapists.subtitle")}
                </Text>
              </Stack>

              <Box p="4" borderRadius="2xl" bg="bg.panel" borderWidth="1px" borderColor="border.subtle" textAlign="center">
                <Text fontSize="2xs" color="fg.muted">
                  {t("therapists.savingsTitle")}
                </Text>
                <Text fontSize="xl" fontWeight="black" color="green.600">
                  {t("therapists.savingsAmount")}
                </Text>
                <Text fontSize="2xs" color="fg.muted">
                  {t("therapists.savingsSubtitle")}
                </Text>
              </Box>
            </Flex>
          </Box>

          {/* Directory Filters */}
          <Flex direction={{ base: "column", sm: "row" }} gap="3" justify="space-between">
            <HStack gap="2" flex="1" maxW="md">
              <Input
                placeholder={t("therapists.searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                borderRadius="xl"
                bg="bg.panel"
              />
            </HStack>

            <HStack gap="2" overflowX="auto" pb="1">
              {["all", "ADHD", "Anxiety", "OCD", "PTSD"].map((spec) => (
                <Button
                  key={spec}
                  size="xs"
                  variant={selectedSpecialty === spec ? "solid" : "subtle"}
                  colorPalette="orange"
                  borderRadius="full"
                  onClick={() => setSelectedSpecialty(spec)}
                >
                  {spec.toUpperCase()}
                </Button>
              ))}
            </HStack>
          </Flex>

          {/* Doctor Cards Grid */}
          <Grid templateColumns={{ base: "1fr", lg: "repeat(3, 1fr)" }} gap="6">
            {therapists.map((doc) => (
              <Box
                key={doc.id}
                p="6"
                borderRadius="3xl"
                bg="bg.panel"
                borderWidth="1px"
                borderColor="border.subtle"
                _hover={{ borderColor: "orange.500/40", transform: "translateY(-2px)" }}
                transition="all 0.2s"
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
                        <Text fontSize="2xs" color="fg.muted">
                          {doc.licenseNumber}
                        </Text>
                      </Stack>
                    </HStack>

                    <HStack gap="1" color="amber.500" fontSize="xs" fontWeight="bold">
                      <LuStar size={14} fill="currentColor" />
                      <Text>{doc.rating}</Text>
                    </HStack>
                  </Flex>

                  <Text fontSize="xs" color="fg.muted" lineHeight="tall">
                    {doc.title}
                  </Text>

                  {/* Specialties Tags */}
                  <Flex wrap="wrap" gap="1.5">
                    {doc.specialties.map((s, idx) => (
                      <Badge key={idx} size="xs" colorPalette="orange" variant="surface">
                        {s}
                      </Badge>
                    ))}
                  </Flex>

                  {/* Accepts Dossier Badge */}
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
                    bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                    color="white"
                    borderRadius="xl"
                    onClick={() => handleBook(doc)}
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

          {/* Booking Confirmation / Pre-Session Dossier Modal */}
          {selectedDoctor && (
            <Box
              position="fixed"
              inset="0"
              bg="black/70"
              backdropFilter="blur(8px)"
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
                <Stack gap="5">
                  <Flex justify="space-between" align="center">
                    <Text fontSize="lg" fontWeight="bold">
                      {t("therapists.modalTitle")}
                    </Text>
                    <Badge colorPalette="green" size="xs">
                      {t("therapists.encryptedVault")}
                    </Badge>
                  </Flex>

                  <Box p="4" borderRadius="2xl" bg="bg.subtle" borderWidth="1px" borderColor="border.subtle">
                    <Text fontSize="xs" fontWeight="bold" mb="2">
                      {t("therapists.dossierIntro")}
                    </Text>
                    <Stack gap="1.5" fontSize="2xs" color="fg.muted">
                      <HStack gap="1.5">
                        <LuCircleCheck size={13} color="#16a34a" />
                        <Text>{t("therapists.dossierItem1")}</Text>
                      </HStack>
                      <HStack gap="1.5">
                        <LuCircleCheck size={13} color="#16a34a" />
                        <Text>{t("therapists.dossierItem2")}</Text>
                      </HStack>
                      <HStack gap="1.5">
                        <LuCircleCheck size={13} color="#16a34a" />
                        <Text>{t("therapists.dossierItem3")}</Text>
                      </HStack>
                    </Stack>
                  </Box>

                  <Box p="3" borderRadius="xl" bg="green.500/10" borderWidth="1px" borderColor="green.500/20">
                    <Text fontSize="xs" fontWeight="bold" color="green.600">
                      {t("therapists.savedHighlight")}
                    </Text>
                  </Box>

                  <Flex justify="flex-end" gap="3">
                    <Button variant="ghost" onClick={() => setSelectedDoctor(null)}>
                      {t("community.cancel")}
                    </Button>
                    <Button
                      bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                      color="white"
                      borderRadius="xl"
                      onClick={confirmBooking}
                    >
                      {t("therapists.confirmButton")}
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

export default TherapistsDirectory;
