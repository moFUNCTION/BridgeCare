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
import { useUser } from "@repo/react-appwrite";
import {
  LuUser,
  LuShieldCheck,
  LuSparkles,
  LuCircleCheck,
} from "react-icons/lu";

export const UserProfile: React.FC = () => {
  const { t } = useTranslation();
  const { user, profile } = useUser();

  const [alias, setAlias] = useState(profile?.userName || "CalmRiver92");
  const [age, setAge] = useState(profile?.age || "27");
  const [phone, setPhone] = useState(profile?.phone || "+1 (555) 234-8901");
  const [savedSuccess, setSavedSuccess] = useState(false);

  const generateNewAlias = () => {
    const prefixes = ["Calm", "Gentle", "Quiet", "Serene", "Brave", "Still", "Mindful"];
    const suffixes = ["River", "Echo", "Wave", "Mountain", "Forest", "Breeze", "Haven"];
    const num = Math.floor(Math.random() * 90) + 10;
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    setAlias(`${randomPrefix}${randomSuffix}${num}`);
  };

  const handleSave = () => {
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  return (
    <Box minH="100vh" bg="bg" color="fg" py="8" px={{ base: "4", md: "8" }}>
      <Container maxW="4xl">
        <Stack gap="8">
          <Stack gap="1">
            <HStack gap="2">
              <LuUser size={22} color="#ea580c" />
              <Text fontSize="2xl" fontWeight="bold">
                {t("profile.title")}
              </Text>
            </HStack>
            <Text fontSize="sm" color="fg.muted">
              {t("profile.subtitle")}
            </Text>
          </Stack>

          {/* Anonymity Banner */}
          <Box p="6" borderRadius="3xl" bg="bg.panel" borderWidth="1px" borderColor="border.subtle">
            <Stack gap="6">
              <Flex
                direction={{ base: "column", sm: "row" }}
                justify="space-between"
                align={{ base: "start", sm: "center" }}
                gap="4"
              >
                <HStack gap="3">
                  <Flex
                    w="16"
                    h="16"
                    borderRadius="2xl"
                    bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                    color="white"
                    align="center"
                    justify="center"
                    fontSize="xl"
                    fontWeight="bold"
                    boxShadow="0 4px 16px rgba(234, 88, 12, 0.3)"
                  >
                    {alias.slice(0, 2).toUpperCase()}
                  </Flex>
                  <Stack gap="0.5">
                    <HStack gap="2">
                      <Text fontSize="lg" fontWeight="bold">
                        {alias}
                      </Text>
                      <Badge colorPalette="green" size="xs">
                        {t("profile.anonymousAlias")}
                      </Badge>
                    </HStack>
                    <Text fontSize="xs" color="fg.muted">
                      {user?.email || "patient@bridgecare.app"}
                    </Text>
                  </Stack>
                </HStack>

                <Button size="xs" variant="outline" colorPalette="orange" borderRadius="xl" onClick={generateNewAlias}>
                  <HStack gap="1.5">
                    <LuSparkles size={14} />
                    <Text>{t("profile.generateAlias")}</Text>
                  </HStack>
                </Button>
              </Flex>

              {/* Edit Details */}
              <Grid templateColumns={{ base: "1fr", sm: "1fr 1fr" }} gap="4" pt="4" borderTopWidth="1px" borderColor="border.subtle">
                <Stack gap="1.5">
                  <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
                    {t("profile.aliasLabel")}
                  </Text>
                  <Input value={alias} onChange={(e) => setAlias(e.target.value)} borderRadius="xl" />
                </Stack>

                <Stack gap="1.5">
                  <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
                    {t("profile.ageLabel")}
                  </Text>
                  <Input value={age} onChange={(e) => setAge(e.target.value)} borderRadius="xl" />
                </Stack>

                <Stack gap="1.5">
                  <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
                    {t("profile.phoneLabel")}
                  </Text>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} borderRadius="xl" />
                </Stack>

                <Stack gap="1.5">
                  <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
                    {t("profile.statusLabel")}
                  </Text>
                  <Badge colorPalette={user?.emailVerification ? "green" : "orange"} size="lg" borderRadius="xl" p="2">
                    <HStack gap="1.5">
                      <LuShieldCheck size={16} />
                      <Text>{user?.emailVerification ? t("profile.verifiedPatient") : t("profile.unverified")}</Text>
                    </HStack>
                  </Badge>
                </Stack>
              </Grid>

              {savedSuccess && (
                <Box p="3" borderRadius="xl" bg="green.500/10" borderWidth="1px" borderColor="green.500/20">
                  <HStack gap="2" color="green.600" fontSize="xs">
                    <LuCircleCheck size={16} />
                    <Text fontWeight="bold">
                      {t("profile.saveSuccess")}
                    </Text>
                  </HStack>
                </Box>
              )}

              <Flex justify="flex-end">
                <Button
                  bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                  color="white"
                  borderRadius="xl"
                  onClick={handleSave}
                >
                  {t("profile.saveChanges")}
                </Button>
              </Flex>
            </Stack>
          </Box>
        </Stack>
      </Container>
    </Box>
  );
};

export default UserProfile;
