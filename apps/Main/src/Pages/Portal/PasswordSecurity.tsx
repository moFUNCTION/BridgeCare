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
  IconButton,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { useUser } from "@repo/react-appwrite";
import {
  LuShieldCheck,
  LuLock,
  LuDownload,
  LuTrash2,
  LuUserX,
  LuCpu,
  LuFileText,
  LuShieldAlert,
  LuCheck,
  LuPhone,
  LuUserCheck,
  LuLoader,
  LuX,
} from "react-icons/lu";
import type { DoctorPermission, EmergencyContact } from "../../services/privacyService";
import {
  fetchDoctorPermissions,
  revokeDoctorAccess,
  exportPatientArchive,
  downloadArchiveJson,
  purgeChatAndScreeningHistory,
  getEmergencyContact,
  saveEmergencyContact,
} from "../../services/privacyService";

export const PasswordSecurity: React.FC = () => {
  const { t } = useTranslation();
  const { user, profile } = useUser();

  const userId = user?.$id || profile?.userId || "curr_user";
  const alias = profile?.userName || localStorage.getItem("bridgecare_user_alias") || "CalmRiver92";

  // Doctor Permissions State
  const [permissions, setPermissions] = useState<DoctorPermission[]>([]);
  const [loadingPerms, setLoadingPerms] = useState(true);
  const [revokingId, setRevokingId] = useState<string | null>(null);

  // Archive Export State
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState(false);

  // Purge Modal State
  const [showPurgeModal, setShowPurgeModal] = useState(false);
  const [isPurging, setIsPurging] = useState(false);
  const [purgeSuccessMessage, setPurgeSuccessMessage] = useState<string | null>(null);

  // Emergency Contact State
  const [emergencyContact, setEmergencyContact] = useState<EmergencyContact>(getEmergencyContact());
  const [emergencySaved, setEmergencySaved] = useState(false);

  useEffect(() => {
    fetchDoctorPermissions(userId).then((data) => {
      setPermissions(data);
      setLoadingPerms(false);
    });
  }, [userId]);

  const handleRevoke = async (fileId: string, therapistId?: string) => {
    setRevokingId(fileId);
    try {
      await revokeDoctorAccess(fileId, therapistId);
      setPermissions((prev) =>
        prev.map((p) =>
          p.fileId === fileId
            ? { ...p, status: "revoked" as const, revokedAt: new Date().toISOString() }
            : p
        )
      );
    } finally {
      setRevokingId(null);
    }
  };

  const handleDownloadArchive = async () => {
    setIsExporting(true);
    setExportSuccess(false);
    try {
      const archive = await exportPatientArchive(userId, alias);
      downloadArchiveJson(archive);
      setExportSuccess(true);
      setTimeout(() => setExportSuccess(false), 4000);
    } finally {
      setIsExporting(false);
    }
  };

  const handleExecutePurge = async () => {
    setIsPurging(true);
    try {
      const res = await purgeChatAndScreeningHistory(userId);
      setShowPurgeModal(false);
      setPurgeSuccessMessage(
        `History permanently wiped (${res.transcriptsDeleted} transcripts, ${res.screeningDeleted} screening scores).`
      );
      setTimeout(() => setPurgeSuccessMessage(null), 5000);
    } finally {
      setIsPurging(false);
    }
  };

  const handleSaveEmergencyContact = () => {
    saveEmergencyContact(emergencyContact);
    setEmergencySaved(true);
    setTimeout(() => setEmergencySaved(false), 3000);
  };

  return (
    <Box minH="100vh" bg="bg" color="fg" py="8" px={{ base: "4", md: "8" }}>
      <Container maxW="5xl">
        <Stack gap="8">
          {/* Header */}
          <Stack gap="1">
            <HStack gap="2">
              <LuShieldCheck size={24} color="#ea580c" />
              <Text fontSize="2xl" fontWeight="bold">
                {t("privacySecurity.title")}
              </Text>
            </HStack>
            <Text fontSize="sm" color="fg.muted">
              {t("privacySecurity.subtitle")}
            </Text>
          </Stack>

          {/* Visual Architecture Diagram: Dual Vault */}
          <Box
            p={{ base: "6", md: "8" }}
            borderRadius="3xl"
            bg="linear-gradient(135deg, rgba(20, 184, 166, 0.08) 0%, rgba(234, 88, 12, 0.05) 100%)"
            borderWidth="1px"
            borderColor="teal.500/30"
          >
            <Stack gap="4">
              <Flex justify="space-between" align="center" wrap="wrap" gap="2">
                <HStack gap="2">
                  <LuCpu size={22} color="#0d9488" />
                  <Text fontSize="md" fontWeight="bold">
                    {t("privacySecurity.architectureTitle")}
                  </Text>
                </HStack>

                <Badge colorPalette="teal" size="sm" px="2.5" py="1" borderRadius="full">
                  Zero-Knowledge Air-Gap Verified
                </Badge>
              </Flex>

              <Text fontSize="xs" color="fg.muted" lineHeight="tall">
                {t("privacySecurity.architectureDesc")}
              </Text>

              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="4" mt="2">
                {/* Vault A */}
                <Box
                  p="5"
                  borderRadius="2xl"
                  bg="bg.panel"
                  borderWidth="1px"
                  borderColor="border.subtle"
                  boxShadow="sm"
                >
                  <HStack justify="space-between" mb="2">
                    <Badge colorPalette="blue" size="xs" px="2" py="0.5" borderRadius="md" fontWeight="semibold">
                      Vault A: Identity & Legal
                    </Badge>
                    <LuLock size={14} color="#3b82f6" />
                  </HStack>
                  <Text fontSize="sm" fontWeight="bold" mb="1">
                    {t("privacySecurity.vaultATitle")}
                  </Text>
                  <Text fontSize="2xs" color="fg.muted" lineHeight="tall" mb="3">
                    {t("privacySecurity.vaultADesc")}
                  </Text>
                  <Stack gap="1" fontSize="2xs" color="fg.muted" bg="bg.subtle" p="3" borderRadius="xl">
                    <Text>• Real Email & Phone: {user?.email || "patient@bridgecare.app"}</Text>
                    <Text>• Billing Invoices & Receipts (HIPAA isolated)</Text>
                    <Text>• Verified Doctor Clinical Licenses</Text>
                  </Stack>
                </Box>

                {/* Vault B */}
                <Box
                  p="5"
                  borderRadius="2xl"
                  bg="bg.panel"
                  borderWidth="1px"
                  borderColor="teal.500/40"
                  boxShadow="sm"
                >
                  <HStack justify="space-between" mb="2">
                    <Badge colorPalette="teal" size="xs" px="2" py="0.5" borderRadius="md" fontWeight="semibold">
                      Vault B: Clinical Sanctuary
                    </Badge>
                    <LuShieldCheck size={14} color="#0d9488" />
                  </HStack>
                  <Text fontSize="sm" fontWeight="bold" mb="1">
                    {t("privacySecurity.vaultBTitle")}
                  </Text>
                  <Text fontSize="2xs" color="fg.muted" lineHeight="tall" mb="3">
                    {t("privacySecurity.vaultBDesc")}
                  </Text>
                  <Stack gap="1" fontSize="2xs" color="fg.muted" bg="bg.subtle" p="3" borderRadius="xl">
                    <Text>• Pseudonym: {alias} (Zero Real Names Exposed)</Text>
                    <Text>• 24/7 AI Daily Venting Transcripts & Mood Shifts</Text>
                    <Text>• Gamified Screening Metrics (7/10 Starlight, OCD, ERA)</Text>
                  </Stack>
                </Box>
              </Grid>
            </Stack>
          </Box>

          {/* Active Doctor Sharing Permissions */}
          <Box p="6" borderRadius="3xl" bg="bg.panel" borderWidth="1px" borderColor="border.subtle">
            <Stack gap="4">
              <Flex justify="space-between" align="center" wrap="wrap" gap="2">
                <Text fontSize="md" fontWeight="bold">
                  {t("privacySecurity.permissionsTitle")}
                </Text>
                <Badge colorPalette="orange" size="xs" px="2" py="0.5" borderRadius="full">
                  Time-Bounded Scoped Access
                </Badge>
              </Flex>
              <Text fontSize="xs" color="fg.muted">
                {t("privacySecurity.permissionsDesc")}
              </Text>

              {loadingPerms ? (
                <HStack gap="2" py="4" color="orange.600">
                  <LuLoader size={16} className="spin" />
                  <Text fontSize="xs">Loading clinical authorizations...</Text>
                </HStack>
              ) : (
                <Stack gap="3">
                  {permissions.map((doc) => {
                    const isRevoked = doc.status === "revoked";

                    return (
                      <Box
                        key={doc.fileId}
                        p="5"
                        borderRadius="2xl"
                        bg="bg.subtle"
                        borderWidth="1px"
                        borderColor={isRevoked ? "border.subtle" : "orange.500/30"}
                      >
                        <Flex
                          direction={{ base: "column", sm: "row" }}
                          justify="space-between"
                          align={{ base: "start", sm: "center" }}
                          gap="3"
                        >
                          <HStack gap="3.5">
                            <Flex
                              w="11"
                              h="11"
                              borderRadius="xl"
                              bg={isRevoked ? "gray.subtle" : "orange.subtle"}
                              color={isRevoked ? "gray.solid" : "orange.solid"}
                              align="center"
                              justify="center"
                              flexShrink={0}
                            >
                              <LuLock size={20} />
                            </Flex>
                            <Stack gap="0.5">
                              <HStack gap="2">
                                <Text fontSize="sm" fontWeight="bold">
                                  {doc.therapistName}
                                </Text>
                                <Badge
                                  colorPalette={isRevoked ? "gray" : "green"}
                                  size="xs"
                                  px="2"
                                  py="0.5"
                                  borderRadius="full"
                                  fontSize="2xs"
                                >
                                  {isRevoked ? t("privacySecurity.accessRevoked") : "Active Consent"}
                                </Badge>
                              </HStack>
                              <Text fontSize="2xs" color="fg.muted">
                                {doc.therapistTitle}
                              </Text>
                              <Text fontSize="2xs" color="fg.subtle">
                                Scope: {doc.scopeDescription}
                              </Text>
                            </Stack>
                          </HStack>

                          <Button
                            size="xs"
                            variant={isRevoked ? "subtle" : "outline"}
                            colorPalette={isRevoked ? "gray" : "red"}
                            borderRadius="xl"
                            px="3.5"
                            py="1.5"
                            fontSize="xs"
                            fontWeight="medium"
                            disabled={isRevoked || revokingId === doc.fileId}
                            onClick={() => handleRevoke(doc.fileId, doc.therapistId)}
                          >
                            <HStack gap="1.5">
                              {revokingId === doc.fileId ? (
                                <LuLoader size={13} className="spin" />
                              ) : (
                                <LuUserX size={13} />
                              )}
                              <Text>
                                {isRevoked
                                  ? t("privacySecurity.revokedBtn")
                                  : t("privacySecurity.revokeBtn")}
                              </Text>
                            </HStack>
                          </Button>
                        </Flex>
                      </Box>
                    );
                  })}
                </Stack>
              )}
            </Stack>
          </Box>

          {/* Data Control Actions & GDPR Portability */}
          <Box p="6" borderRadius="3xl" bg="bg.panel" borderWidth="1px" borderColor="border.subtle">
            <Stack gap="4">
              <Text fontSize="md" fontWeight="bold">
                {t("privacySecurity.dataControlTitle")}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                You retain complete, unencumbered ownership of your psychiatric transcript history. Export your data to bring to any outside clinician, or irreversibly purge your logs at any time.
              </Text>

              {exportSuccess && (
                <Box p="3.5" borderRadius="xl" bg="green.500/10" borderWidth="1px" borderColor="green.500/25">
                  <HStack gap="2" color="green.600" fontSize="xs">
                    <LuCheck size={16} />
                    <Text fontWeight="bold">
                      Complete encrypted archive exported and downloaded (bridgecare-clinical-archive.json).
                    </Text>
                  </HStack>
                </Box>
              )}

              {purgeSuccessMessage && (
                <Box p="3.5" borderRadius="xl" bg="red.500/10" borderWidth="1px" borderColor="red.500/25">
                  <HStack gap="2" color="red.600" fontSize="xs">
                    <LuCheck size={16} />
                    <Text fontWeight="bold">{purgeSuccessMessage}</Text>
                  </HStack>
                </Box>
              )}

              <Flex direction={{ base: "column", sm: "row" }} gap="3">
                {/* 1. Download Complete Archive */}
                <Button
                  size="sm"
                  variant="outline"
                  borderRadius="xl"
                  px="4"
                  py="2"
                  fontSize="xs"
                  fontWeight="semibold"
                  disabled={isExporting}
                  onClick={handleDownloadArchive}
                >
                  <HStack gap="1.5">
                    {isExporting ? <LuLoader size={14} className="spin" /> : <LuDownload size={14} />}
                    <Text>
                      {isExporting ? "Generating Vault B Archive..." : t("privacySecurity.downloadArchive")}
                    </Text>
                  </HStack>
                </Button>

                {/* 2. Irreversible History Purge */}
                <Button
                  size="sm"
                  variant="outline"
                  colorPalette="red"
                  borderRadius="xl"
                  px="4"
                  py="2"
                  fontSize="xs"
                  fontWeight="semibold"
                  onClick={() => setShowPurgeModal(true)}
                >
                  <HStack gap="1.5">
                    <LuTrash2 size={14} />
                    <Text>{t("privacySecurity.purgeHistory")}</Text>
                  </HStack>
                </Button>
              </Flex>
            </Stack>
          </Box>

          {/* Emergency Crisis Contact Management */}
          <Box p="6" borderRadius="3xl" bg="bg.panel" borderWidth="1px" borderColor="border.subtle">
            <Stack gap="4">
              <HStack gap="2">
                <LuPhone size={18} color="#ea580c" />
                <Text fontSize="md" fontWeight="bold">
                  Designated Emergency Crisis Supporter
                </Text>
              </HStack>
              <Text fontSize="xs" color="fg.muted" lineHeight="tall">
                Designate a trusted family member or close friend.
                <Text as="span" fontWeight="bold" color="fg" ml="1">
                  Privacy Guarantee:
                </Text>{" "}
                This supporter is never contacted during ordinary venting or symptom checks. They are only reached if you explicitly authorize emergency outreach within the Crisis Intervention modal.
              </Text>

              <Grid templateColumns={{ base: "1fr", sm: "1fr 1fr" }} gap="3">
                <Stack gap="1">
                  <Text fontSize="2xs" fontWeight="semibold" color="fg.muted">
                    Contact Full Name
                  </Text>
                  <Input
                    size="sm"
                    borderRadius="xl"
                    value={emergencyContact.name}
                    onChange={(e) =>
                      setEmergencyContact({ ...emergencyContact, name: e.target.value })
                    }
                  />
                </Stack>

                <Stack gap="1">
                  <Text fontSize="2xs" fontWeight="semibold" color="fg.muted">
                    Emergency Phone Number
                  </Text>
                  <Input
                    size="sm"
                    borderRadius="xl"
                    value={emergencyContact.phone}
                    onChange={(e) =>
                      setEmergencyContact({ ...emergencyContact, phone: e.target.value })
                    }
                  />
                </Stack>
              </Grid>

              {emergencySaved && (
                <Box p="3" borderRadius="xl" bg="green.500/10" borderWidth="1px" borderColor="green.500/25">
                  <HStack gap="2" color="green.600" fontSize="xs">
                    <LuCheck size={15} />
                    <Text fontWeight="bold">Emergency supporter configuration updated successfully.</Text>
                  </HStack>
                </Box>
              )}

              <Flex justify="flex-end">
                <Button
                  size="xs"
                  px="3.5"
                  py="1.5"
                  borderRadius="xl"
                  colorPalette="orange"
                  onClick={handleSaveEmergencyContact}
                >
                  Save Supporter Details
                </Button>
              </Flex>
            </Stack>
          </Box>
        </Stack>
      </Container>

      {/* Purge Confirmation Modal */}
      {showPurgeModal && (
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
            maxW="md"
            w="100%"
            bg="bg.panel"
            borderWidth="1px"
            borderColor="red.500/40"
            borderRadius="3xl"
            boxShadow="0 25px 60px -15px rgba(220, 38, 38, 0.4)"
            p="6"
          >
            <Stack gap="4">
              <Flex justify="space-between" align="center">
                <HStack gap="2" color="red.600">
                  <LuShieldAlert size={22} />
                  <Text fontSize="md" fontWeight="bold">
                    Irreversible History Purge
                  </Text>
                </HStack>
                <IconButton
                  aria-label="Close"
                  variant="ghost"
                  size="xs"
                  onClick={() => setShowPurgeModal(false)}
                >
                  <LuX size={16} />
                </IconButton>
              </Flex>

              <Text fontSize="xs" color="fg.muted" lineHeight="tall">
                Are you sure you want to permanently delete all your daily AI transcripts, mood shift logs, and game screening metrics? This action is
                <Text as="span" fontWeight="bold" color="red.600" ml="1">
                  irreversible
                </Text>
                . Your legal account and doctor appointments will remain intact.
              </Text>

              <Flex justify="flex-end" gap="2" pt="2">
                <Button
                  size="sm"
                  variant="ghost"
                  borderRadius="xl"
                  onClick={() => setShowPurgeModal(false)}
                >
                  Cancel
                </Button>
                <Button
                  size="sm"
                  colorPalette="red"
                  borderRadius="xl"
                  disabled={isPurging}
                  onClick={handleExecutePurge}
                >
                  <HStack gap="1.5">
                    {isPurging ? <LuLoader size={14} className="spin" /> : <LuTrash2 size={14} />}
                    <Text>{isPurging ? "Purging Records..." : "Yes, Purge Permanently"}</Text>
                  </HStack>
                </Button>
              </Flex>
            </Stack>
          </Box>
        </Box>
      )}
    </Box>
  );
};

export default PasswordSecurity;
