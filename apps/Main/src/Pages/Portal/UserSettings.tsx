import React, { useState } from "react";
import {
  Box,
  Container,
  Flex,
  HStack,
  Stack,
  Text,
  Switch,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import {
  LuSettings,
} from "react-icons/lu";

export const UserSettings: React.FC = () => {
  const { t } = useTranslation();

  const [nightModeDefault, setNightModeDefault] = useState(false);
  const [audioWaveforms, setAudioWaveforms] = useState(true);
  const [communityNotifs, setCommunityNotifs] = useState(true);
  const [dossierAlerts, setDossierAlerts] = useState(true);
  const [sensoryCalm, setSensoryCalm] = useState(false);

  return (
    <Box minH="100vh" bg="bg" color="fg" py="8" px={{ base: "4", md: "8" }}>
      <Container maxW="4xl">
        <Stack gap="8">
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

          <Box p="6" borderRadius="3xl" bg="bg.panel" borderWidth="1px" borderColor="border.subtle">
            <Stack gap="6">
              {/* Venting Preferences */}
              <Text fontSize="md" fontWeight="bold">
                {t("sensorySettings.ventingHeader")}
              </Text>

              <Flex justify="space-between" align="center" py="2" borderBottomWidth="1px" borderColor="border.subtle">
                <Stack gap="0.5">
                  <Text fontSize="sm" fontWeight="semibold">
                    {t("sensorySettings.waveformsLabel")}
                  </Text>
                  <Text fontSize="2xs" color="fg.muted">
                    {t("sensorySettings.waveformsDesc")}
                  </Text>
                </Stack>
                <Switch.Root checked={audioWaveforms} onCheckedChange={(e) => setAudioWaveforms(e.checked)} colorPalette="orange">
                  <Switch.HiddenInput />
                  <Switch.Control />
                </Switch.Root>
              </Flex>

              <Flex justify="space-between" align="center" py="2" borderBottomWidth="1px" borderColor="border.subtle">
                <Stack gap="0.5">
                  <Text fontSize="sm" fontWeight="semibold">
                    {t("sensorySettings.nightCalmLabel")}
                  </Text>
                  <Text fontSize="2xs" color="fg.muted">
                    {t("sensorySettings.nightCalmDesc")}
                  </Text>
                </Stack>
                <Switch.Root checked={nightModeDefault} onCheckedChange={(e) => setNightModeDefault(e.checked)} colorPalette="orange">
                  <Switch.HiddenInput />
                  <Switch.Control />
                </Switch.Root>
              </Flex>

              <Flex justify="space-between" align="center" py="2" borderBottomWidth="1px" borderColor="border.subtle">
                <Stack gap="0.5">
                  <Text fontSize="sm" fontWeight="semibold">
                    {t("sensorySettings.sensoryModeLabel")}
                  </Text>
                  <Text fontSize="2xs" color="fg.muted">
                    {t("sensorySettings.sensoryModeDesc")}
                  </Text>
                </Stack>
                <Switch.Root checked={sensoryCalm} onCheckedChange={(e) => setSensoryCalm(e.checked)} colorPalette="orange">
                  <Switch.HiddenInput />
                  <Switch.Control />
                </Switch.Root>
              </Flex>

              {/* Notification Controls */}
              <Text fontSize="md" fontWeight="bold" pt="4">
                {t("sensorySettings.notifsHeader")}
              </Text>

              <Flex justify="space-between" align="center" py="2" borderBottomWidth="1px" borderColor="border.subtle">
                <Stack gap="0.5">
                  <Text fontSize="sm" fontWeight="semibold">
                    {t("sensorySettings.cheersLabel")}
                  </Text>
                  <Text fontSize="2xs" color="fg.muted">
                    {t("sensorySettings.cheersDesc")}
                  </Text>
                </Stack>
                <Switch.Root checked={communityNotifs} onCheckedChange={(e) => setCommunityNotifs(e.checked)} colorPalette="orange">
                  <Switch.HiddenInput />
                  <Switch.Control />
                </Switch.Root>
              </Flex>

              <Flex justify="space-between" align="center" py="2">
                <Stack gap="0.5">
                  <Text fontSize="sm" fontWeight="semibold">
                    {t("sensorySettings.dossierAlertsLabel")}
                  </Text>
                  <Text fontSize="2xs" color="fg.muted">
                    {t("sensorySettings.dossierAlertsDesc")}
                  </Text>
                </Stack>
                <Switch.Root checked={dossierAlerts} onCheckedChange={(e) => setDossierAlerts(e.checked)} colorPalette="orange">
                  <Switch.HiddenInput />
                  <Switch.Control />
                </Switch.Root>
              </Flex>
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};

export default UserSettings;
