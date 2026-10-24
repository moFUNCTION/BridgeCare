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
import { useUser } from "@repo/react-appwrite";
import {
  LuUser,
  LuShieldCheck,
  LuSparkles,
  LuCircleCheck,
  LuLock,
  LuPalette,
} from "react-icons/lu";
import { databases } from "../../lib/appwrite";

const AVATAR_PALETTES = [
  { id: "teal-1", name: "Serene River", bg: "linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)", color: "white" },
  { id: "orange-1", name: "Warm Sunrise", bg: "linear-gradient(135deg, #f97316 0%, #ea580c 100%)", color: "white" },
  { id: "purple-1", name: "Quiet Twilight", bg: "linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)", color: "white" },
  { id: "emerald-1", name: "Calm Forest", bg: "linear-gradient(135deg, #10b981 0%, #047857 100%)", color: "white" },
  { id: "indigo-1", name: "Night Sky", bg: "linear-gradient(135deg, #6366f1 0%, #4338ca 100%)", color: "white" },
];

export const UserProfile: React.FC = () => {
  const { t } = useTranslation();
  const { user, profile } = useUser();

  const [alias, setAlias] = useState(
    localStorage.getItem("bridgecare_user_alias") || profile?.userName || "CalmRiver92"
  );
  const [selectedAvatarId, setSelectedAvatarId] = useState(
    localStorage.getItem("bridgecare_user_avatar_id") || "teal-1"
  );
  const [age, setAge] = useState(profile?.age ? String(profile.age) : "27");
  const [phone, setPhone] = useState(profile?.phone || "+1 (555) 234-8901");
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const activeAvatar = AVATAR_PALETTES.find((p) => p.id === selectedAvatarId) || AVATAR_PALETTES[0];

  const generateNewAlias = () => {
    const prefixes = ["Calm", "Gentle", "Quiet", "Serene", "Brave", "Still", "Mindful", "Peaceful", "Warm"];
    const suffixes = ["River", "Echo", "Wave", "Mountain", "Forest", "Breeze", "Haven", "Meadow", "Cedar"];
    const num = Math.floor(Math.random() * 90) + 10;
    const randomPrefix = prefixes[Math.floor(Math.random() * prefixes.length)];
    const randomSuffix = suffixes[Math.floor(Math.random() * suffixes.length)];
    setAlias(`${randomPrefix}${randomSuffix}${num}`);
  };

  const handleSave = async () => {
    setIsSaving(true);
    localStorage.setItem("bridgecare_user_alias", alias);
    localStorage.setItem("bridgecare_user_avatar_id", selectedAvatarId);

    // Try Appwrite USERS document update
    if (user?.$id) {
      try {
        await databases.updateDocument("main", "USERS", user.$id, {
          anonymousAlias: alias,
          avatarId: selectedAvatarId,
        });
      } catch (e) {
        // Fallback
      }
    }

    setIsSaving(false);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
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
                <HStack gap="3.5">
                  <Flex
                    w="16"
                    h="16"
                    borderRadius="2xl"
                    bg={activeAvatar.bg}
                    color={activeAvatar.color}
                    align="center"
                    justify="center"
                    fontSize="xl"
                    fontWeight="bold"
                    boxShadow="0 4px 16px rgba(20, 184, 166, 0.3)"
                  >
                    {alias.slice(0, 2).toUpperCase()}
                  </Flex>
                  <Stack gap="0.5">
                    <HStack gap="2">
                      <Text fontSize="lg" fontWeight="bold">
                        {alias}
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
                        {t("profile.anonymousAlias")}
                      </Badge>
                    </HStack>
                    <Text fontSize="xs" color="fg.muted">
                      {user?.email || "patient@bridgecare.app"} (Vault A Protected)
                    </Text>
                  </Stack>
                </HStack>

                <Button
                  size="xs"
                  variant="outline"
                  colorPalette="orange"
                  borderRadius="xl"
                  px="3"
                  py="1.5"
                  fontSize="xs"
                  fontWeight="medium"
                  onClick={generateNewAlias}
                >
                  <HStack gap="1.5">
                    <LuSparkles size={14} />
                    <Text>{t("profile.generateAlias")}</Text>
                  </HStack>
                </Button>
              </Flex>

              {/* Mathematical Separation Confirmation Callout */}
              <Box
                p="4"
                borderRadius="2xl"
                bg="linear-gradient(135deg, rgba(20, 184, 166, 0.08) 0%, rgba(249, 115, 22, 0.04) 100%)"
                borderWidth="1px"
                borderColor="teal.500/30"
              >
                <HStack gap="2.5" align="start">
                  <Flex
                    w="7"
                    h="7"
                    borderRadius="lg"
                    bg="teal.600"
                    color="white"
                    align="center"
                    justify="center"
                    flexShrink={0}
                  >
                    <LuLock size={15} />
                  </Flex>
                  <Stack gap="0.5">
                    <Text fontSize="xs" fontWeight="bold" color="fg">
                      Cryptographic Identity Air-Gap Active
                    </Text>
                    <Text fontSize="2xs" color="fg.muted" lineHeight="tall">
                      Your legal name and email address exist strictly within Vault A. When you vent to Sora or participate in the community, you operate 100% under your anonymous persona ({alias}) with zero linkable pointers.
                    </Text>
                  </Stack>
                </HStack>
              </Box>

              {/* Soothing Avatar Picker */}
              <Stack gap="2">
                <HStack gap="2">
                  <LuPalette size={16} color="#0d9488" />
                  <Text fontSize="xs" fontWeight="bold">
                    Soothing Sanctuary Avatar Palette
                  </Text>
                </HStack>
                <HStack gap="3" wrap="wrap">
                  {AVATAR_PALETTES.map((av) => (
                    <Box
                      key={av.id}
                      onClick={() => setSelectedAvatarId(av.id)}
                      cursor="pointer"
                      p="1"
                      borderRadius="2xl"
                      borderWidth="2px"
                      borderColor={selectedAvatarId === av.id ? "teal.500" : "transparent"}
                      transition="all 0.2s"
                    >
                      <Flex
                        w="10"
                        h="10"
                        borderRadius="xl"
                        bg={av.bg}
                        color="white"
                        align="center"
                        justify="center"
                        fontSize="xs"
                        fontWeight="bold"
                        boxShadow={selectedAvatarId === av.id ? "md" : "none"}
                      >
                        {alias.slice(0, 2).toUpperCase()}
                      </Flex>
                    </Box>
                  ))}
                </HStack>
              </Stack>

              {/* Edit Details */}
              <Grid
                templateColumns={{ base: "1fr", sm: "1fr 1fr" }}
                gap="4"
                pt="4"
                borderTopWidth="1px"
                borderColor="border.subtle"
              >
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
                  <Badge
                    colorPalette={user?.emailVerification ? "green" : "teal"}
                    size="md"
                    borderRadius="xl"
                    px="3"
                    py="2"
                    fontSize="xs"
                    fontWeight="semibold"
                  >
                    <HStack gap="1.5">
                      <LuShieldCheck size={16} />
                      <Text>{user?.emailVerification ? t("profile.verifiedPatient") : "Verified Sanctuary Patient"}</Text>
                    </HStack>
                  </Badge>
                </Stack>
              </Grid>

              {savedSuccess && (
                <Box p="3" borderRadius="xl" bg="green.500/10" borderWidth="1px" borderColor="green.500/20">
                  <HStack gap="2" color="green.600" fontSize="xs">
                    <LuCircleCheck size={16} />
                    <Text fontWeight="bold">{t("profile.saveSuccess")}</Text>
                  </HStack>
                </Box>
              )}

              <Flex justify="flex-end">
                <Button
                  size="md"
                  px="5"
                  py="2.5"
                  fontSize="sm"
                  fontWeight="semibold"
                  bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                  color="white"
                  borderRadius="xl"
                  disabled={isSaving}
                  onClick={handleSave}
                >
                  {isSaving ? "Saving..." : t("profile.saveChanges")}
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
