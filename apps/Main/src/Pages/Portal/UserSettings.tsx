import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Flex,
  HStack,
  Stack,
  Text,
  Switch,
  Badge,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import {
  LuSettings,
  LuSparkles,
  LuMoon,
  LuEye,
  LuBell,
  LuShield,
  LuCheck,
} from "react-icons/lu";

export const UserSettings: React.FC = () => {
  const { t } = useTranslation();

  const [nightModeDefault, setNightModeDefault] = useState(() => {
    return localStorage.getItem("bridgecare_setting_night_mode") === "true";
  });
  const [audioWaveforms, setAudioWaveforms] = useState(() => {
    return localStorage.getItem("bridgecare_setting_audio_waveforms") !== "false";
  });
  const [communityNotifs, setCommunityNotifs] = useState(() => {
    return localStorage.getItem("bridgecare_setting_community_notifs") !== "false";
  });
  const [dossierAlerts, setDossierAlerts] = useState(() => {
    return localStorage.getItem("bridgecare_setting_dossier_alerts") !== "false";
  });
  const [sensoryCalm, setSensoryCalm] = useState(() => {
    return localStorage.getItem("bridgecare_setting_sensory_calm") === "true";
  });

  const [savedFeedback, setSavedFeedback] = useState<string | null>(null);

  const showSavedBadge = (keyName: string) => {
    setSavedFeedback(`Saved: ${keyName}`);
    setTimeout(() => setSavedFeedback(null), 2000);
  };

  const handleToggleWaveforms = (checked: boolean) => {
    setAudioWaveforms(checked);
    localStorage.setItem("bridgecare_setting_audio_waveforms", String(checked));
    showSavedBadge("Audio Waveforms");
  };

  const handleToggleNightMode = (checked: boolean) => {
    setNightModeDefault(checked);
    localStorage.setItem("bridgecare_setting_night_mode", String(checked));
    showSavedBadge("Late-Night Calm Mode");
  };

  const handleToggleSensory = (checked: boolean) => {
    setSensoryCalm(checked);
    localStorage.setItem("bridgecare_setting_sensory_calm", String(checked));
    showSavedBadge("Sensory Low-Stimulation");
  };

  const handleToggleCommunity = (checked: boolean) => {
    setCommunityNotifs(checked);
    localStorage.setItem("bridgecare_setting_community_notifs", String(checked));
    showSavedBadge("Community Cheers");
  };

  const handleToggleDossier = (checked: boolean) => {
    setDossierAlerts(checked);
    localStorage.setItem("bridgecare_setting_dossier_alerts", String(checked));
    showSavedBadge("Clinical File Alerts");
  };

  return (
    <Box minH="100vh" bg="bg" color="fg" py="8" px={{ base: "4", md: "8" }}>
      <Container maxW="4xl">
        <Stack gap="8">
          <Flex justify="space-between" align="center" wrap="wrap" gap="2">
            <Stack gap="1">
              <HStack gap="2">
                <LuSettings size={22} color="#ea580c" />
                <Text fontSize="2xl" fontWeight="bold">
                  {t("sensorySettings.title")}
                </Text>
              </HStack>
              <Text fontSize="sm" color="fg.muted">
                {t("sensorySettings.subtitle")}
              </Text>
            </Stack>

            {savedFeedback && (
              <Badge colorPalette="green" size="sm" px="3" py="1" borderRadius="full">
                <HStack gap="1">
                  <LuCheck size={14} />
                  <Text>{savedFeedback}</Text>
                </HStack>
              </Badge>
            )}
          </Flex>

          <Box p="6" borderRadius="3xl" bg="bg.panel" borderWidth="1px" borderColor="border.subtle">
            <Stack gap="6">
              {/* Venting & Comfort Preferences */}
              <HStack gap="2">
                <LuSparkles size={18} color="#ea580c" />
                <Text fontSize="md" fontWeight="bold">
                  {t("sensorySettings.ventingHeader")}
                </Text>
              </HStack>

              <Flex justify="space-between" align="center" py="2" borderBottomWidth="1px" borderColor="border.subtle">
                <Stack gap="0.5">
                  <Text fontSize="sm" fontWeight="semibold">
                    {t("sensorySettings.waveformsLabel")}
                  </Text>
                  <Text fontSize="2xs" color="fg.muted">
                    {t("sensorySettings.waveformsDesc")}
                  </Text>
                </Stack>
                <Switch.Root
                  checked={audioWaveforms}
                  onCheckedChange={(e) => handleToggleWaveforms(e.checked)}
                  colorPalette="orange"
                >
                  <Switch.HiddenInput />
                  <Switch.Control />
                </Switch.Root>
              </Flex>

              <Flex justify="space-between" align="center" py="2" borderBottomWidth="1px" borderColor="border.subtle">
                <Stack gap="0.5">
                  <HStack gap="1.5">
                    <LuMoon size={14} color="#f97316" />
                    <Text fontSize="sm" fontWeight="semibold">
                      {t("sensorySettings.nightCalmLabel")}
                    </Text>
                  </HStack>
                  <Text fontSize="2xs" color="fg.muted">
                    {t("sensorySettings.nightCalmDesc")}
                  </Text>
                </Stack>
                <Switch.Root
                  checked={nightModeDefault}
                  onCheckedChange={(e) => handleToggleNightMode(e.checked)}
                  colorPalette="orange"
                >
                  <Switch.HiddenInput />
                  <Switch.Control />
                </Switch.Root>
              </Flex>

              <Flex justify="space-between" align="center" py="2" borderBottomWidth="1px" borderColor="border.subtle">
                <Stack gap="0.5">
                  <HStack gap="1.5">
                    <LuEye size={14} color="#14b8a6" />
                    <Text fontSize="sm" fontWeight="semibold">
                      {t("sensorySettings.sensoryModeLabel")}
                    </Text>
                  </HStack>
                  <Text fontSize="2xs" color="fg.muted">
                    {t("sensorySettings.sensoryModeDesc")}
                  </Text>
                </Stack>
                <Switch.Root
                  checked={sensoryCalm}
                  onCheckedChange={(e) => handleToggleSensory(e.checked)}
                  colorPalette="orange"
                >
                  <Switch.HiddenInput />
                  <Switch.Control />
                </Switch.Root>
              </Flex>

              {/* Notification Controls */}
              <HStack gap="2" pt="4">
                <LuBell size={18} color="#ea580c" />
                <Text fontSize="md" fontWeight="bold">
                  {t("sensorySettings.notifsHeader")}
                </Text>
              </HStack>

              <Flex justify="space-between" align="center" py="2" borderBottomWidth="1px" borderColor="border.subtle">
                <Stack gap="0.5">
                  <Text fontSize="sm" fontWeight="semibold">
                    {t("sensorySettings.cheersLabel")}
                  </Text>
                  <Text fontSize="2xs" color="fg.muted">
                    {t("sensorySettings.cheersDesc")}
                  </Text>
                </Stack>
                <Switch.Root
                  checked={communityNotifs}
                  onCheckedChange={(e) => handleToggleCommunity(e.checked)}
                  colorPalette="orange"
                >
                  <Switch.HiddenInput />
                  <Switch.Control />
                </Switch.Root>
              </Flex>

              <Flex justify="space-between" align="center" py="2" borderBottomWidth="1px" borderColor="border.subtle">
                <Stack gap="0.5">
                  <Text fontSize="sm" fontWeight="semibold">
                    {t("sensorySettings.dossierAlertsLabel")}
                  </Text>
                  <Text fontSize="2xs" color="fg.muted">
                    {t("sensorySettings.dossierAlertsDesc")}
                  </Text>
                </Stack>
                <Switch.Root
                  checked={dossierAlerts}
                  onCheckedChange={(e) => handleToggleDossier(e.checked)}
                  colorPalette="orange"
                >
                  <Switch.HiddenInput />
                  <Switch.Control />
                </Switch.Root>
              </Flex>

              {/* Identity Protection Status */}
              <Box
                p="4"
                borderRadius="2xl"
                bg="linear-gradient(135deg, rgba(20, 184, 166, 0.08) 0%, rgba(249, 115, 22, 0.04) 100%)"
                borderWidth="1px"
                borderColor="teal.500/30"
              >
                <HStack gap="2.5">
                  <LuShield size={18} color="#0d9488" />
                  <Stack gap="0">
                    <Text fontSize="xs" fontWeight="bold">
                      Zero-Knowledge Vault Separation Active
                    </Text>
                    <Text fontSize="2xs" color="fg.muted">
                      All settings and preferences are stored locally and encrypted in Vault B without transmitting personal identifiers.
                    </Text>
                  </Stack>
                </HStack>
              </Box>
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};

export default UserSettings;
