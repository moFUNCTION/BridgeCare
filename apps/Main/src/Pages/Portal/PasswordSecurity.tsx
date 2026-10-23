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
  LuShieldCheck,
  LuLock,
  LuDownload,
  LuTrash2,
  LuUserX,
  LuCpu,
} from "react-icons/lu";

export const PasswordSecurity: React.FC = () => {
  const { t } = useTranslation();

  const [revoked, setRevoked] = useState(false);

  return (
    <Box minH="100vh" bg="bg" color="fg" py="8" px={{ base: "4", md: "8" }}>
      <Container maxW="5xl">
        <Stack gap="8">
          <Stack gap="1">
            <HStack gap="2">
              <LuShieldCheck size={22} color="#ea580c" />
              <Text fontSize="2xl" fontWeight="bold">
                {t("privacySecurity.title")}
              </Text>
            </HStack>
            <Text fontSize="sm" color="fg.muted">
              {t("privacySecurity.subtitle")}
            </Text>
          </Stack>

          {/* Visual Architecture Diagram */}
          <Box
            p={{ base: "6", md: "8" }}
            borderRadius="3xl"
            bg="linear-gradient(135deg, rgba(20, 184, 166, 0.08) 0%, rgba(234, 88, 12, 0.04) 100%)"
            borderWidth="1px"
            borderColor="teal.500/30"
          >
            <Stack gap="4">
              <HStack gap="2">
                <LuCpu size={20} color="#0d9488" />
                <Text fontSize="md" fontWeight="bold">
                  {t("privacySecurity.architectureTitle")}
                </Text>
              </HStack>
              <Text fontSize="xs" color="fg.muted" lineHeight="tall">
                {t("privacySecurity.architectureDesc")}
              </Text>

              <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="4" mt="2">
                {/* Vault A */}
                <Box p="4" borderRadius="2xl" bg="bg.panel" borderWidth="1px" borderColor="border.subtle">
                  <Badge colorPalette="blue" size="xs" mb="2">
                    Vault A
                  </Badge>
                  <Text fontSize="sm" fontWeight="bold" mb="1">
                    {t("privacySecurity.vaultATitle")}
                  </Text>
                  <Text fontSize="2xs" color="fg.muted">
                    {t("privacySecurity.vaultADesc")}
                  </Text>
                </Box>

                {/* Vault B */}
                <Box p="4" borderRadius="2xl" bg="bg.panel" borderWidth="1px" borderColor="teal.500/40">
                  <Badge colorPalette="teal" size="xs" mb="2">
                    Vault B
                  </Badge>
                  <Text fontSize="sm" fontWeight="bold" mb="1">
                    {t("privacySecurity.vaultBTitle")}
                  </Text>
                  <Text fontSize="2xs" color="fg.muted">
                    {t("privacySecurity.vaultBDesc")}
                  </Text>
                </Box>
              </Grid>
            </Stack>
          </Box>

          {/* Active Doctor Sharing Permissions */}
          <Box p="6" borderRadius="3xl" bg="bg.panel" borderWidth="1px" borderColor="border.subtle">
            <Stack gap="4">
              <Text fontSize="md" fontWeight="bold">
                {t("privacySecurity.permissionsTitle")}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                {t("privacySecurity.permissionsDesc")}
              </Text>

              <Box p="4" borderRadius="2xl" bg="bg.subtle" borderWidth="1px" borderColor="border.subtle">
                <Flex justify="space-between" align="center">
                  <HStack gap="3">
                    <Flex w="10" h="10" borderRadius="xl" bg="orange.subtle" color="orange.solid" align="center" justify="center">
                      <LuLock size={18} />
                    </Flex>
                    <Stack gap="0">
                      <Text fontSize="sm" fontWeight="bold">
                        {t("privacySecurity.sampleDoctor")}
                      </Text>
                      <Text fontSize="2xs" color="fg.muted">
                        {revoked ? t("privacySecurity.accessRevoked") : t("privacySecurity.activeAuth")}
                      </Text>
                    </Stack>
                  </HStack>

                  <Button
                    size="xs"
                    variant={revoked ? "subtle" : "outline"}
                    colorPalette={revoked ? "gray" : "red"}
                    borderRadius="xl"
                    disabled={revoked}
                    onClick={() => setRevoked(true)}
                  >
                    <HStack gap="1">
                      <LuUserX size={13} />
                      <Text>{revoked ? t("privacySecurity.revokedBtn") : t("privacySecurity.revokeBtn")}</Text>
                    </HStack>
                  </Button>
                </Flex>
              </Box>
            </Stack>
          </Box>

          {/* Data Control Actions */}
          <Box p="6" borderRadius="3xl" bg="bg.panel" borderWidth="1px" borderColor="border.subtle">
            <Stack gap="4">
              <Text fontSize="md" fontWeight="bold">
                {t("privacySecurity.dataControlTitle")}
              </Text>

              <Flex direction={{ base: "column", sm: "row" }} gap="3">
                <Button
                  size="sm"
                  variant="outline"
                  borderRadius="xl"
                  onClick={() => alert(t("privacySecurity.downloadArchiveAlert"))}
                >
                  <HStack gap="1.5">
                    <LuDownload size={14} />
                    <Text>{t("privacySecurity.downloadArchive")}</Text>
                  </HStack>
                </Button>

                <Button
                  size="sm"
                  variant="outline"
                  colorPalette="red"
                  borderRadius="xl"
                  onClick={() => {
                    if (confirm(t("privacySecurity.purgeConfirm"))) {
                      alert(t("privacySecurity.purgeDone"));
                    }
                  }}
                >
                  <HStack gap="1.5">
                    <LuTrash2 size={14} />
                    <Text>{t("privacySecurity.purgeHistory")}</Text>
                  </HStack>
                </Button>
              </Flex>
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};

export default PasswordSecurity;
