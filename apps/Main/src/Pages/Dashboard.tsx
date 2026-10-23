import React from "react";
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
  Alert,
  Image,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useUser, useAuthActions } from "@repo/react-appwrite";
import { SplitText } from "@repo/ui-components";
import { logo } from "@repo/assets";
import { ColorModeButton } from "../components/ui/color-mode";
import LanguageToggle from "../components/LanguageToggle";
import {
  LuLogOut,
  LuShieldCheck,
  LuTriangleAlert,
  LuCalendar,
  LuFileText,
  LuUser,
  LuMapPin,
  LuPhone,
  LuActivity,
} from "react-icons/lu";
import { RiHeartPulseFill } from "react-icons/ri";

export const Dashboard: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user, profile } = useUser();
  const { logout } = useAuthActions();

  const handleSignOut = async () => {
    try {
      await logout();
      navigate("/auth/login");
    } catch (err) {
      console.error("Logout failed:", err);
      navigate("/auth/login");
    }
  };

  const isVerified = Boolean(user?.emailVerification);
  const extraPrefs = (profile || user?.prefs || {}) as Record<string, any>;

  return (
    <Box minH="100vh" bg="bg" color="fg">
      {/* Top Breadcrumb Header Bar */}
      <Flex
        as="header"
        px={{ base: "4", md: "8" }}
        py="3.5"
        alignItems="center"
        justifyContent="space-between"
        borderBottomWidth="1px"
        borderColor="border.subtle"
        bg="bg.subtle/20"
        position="sticky"
        top="0"
        zIndex={10}
        backdropFilter="blur(8px)"
      >
        <HStack gap="2">
          <Text fontSize="xs" fontWeight="semibold" color="fg.muted">
            {t("brand.name")}
          </Text>
          <Text fontSize="xs" color="fg.muted">/</Text>
          <Text fontSize="xs" fontWeight="bold" color="orange.600">
            {t("dashboard.overview")}
          </Text>
        </HStack>

        <HStack gap="2">
          <Badge
            colorPalette={isVerified ? "green" : "orange"}
            variant="subtle"
            size="sm"
            borderRadius="full"
          >
            {isVerified ? t("dashboard.verified") : t("dashboard.unverified")}
          </Badge>
        </HStack>
      </Flex>

      {/* Main Body */}
      <Container
        maxW="6xl"
        py={{ base: "6", md: "10" }}
        px={{ base: "4", md: "8" }}
      >
        <Stack gap="8">
          {/* Email verification alert if unverified */}
          {!isVerified && (
            <Alert.Root
              status="warning"
              variant="subtle"
              borderRadius="2xl"
              p="4"
            >
              <Alert.Indicator />
              <Flex
                direction={{ base: "column", sm: "row" }}
                align={{ base: "start", sm: "center" }}
                justify="space-between"
                w="100%"
                gap="3"
              >
                <Box>
                  <Alert.Title fontSize="sm" fontWeight="bold">
                    {t("dashboard.unverified")}
                  </Alert.Title>
                  <Text fontSize="xs" color="fg.muted">
                    {t("dashboard.verifyNotice")}
                  </Text>
                </Box>
                <Button
                  size="sm"
                  bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                  color="white"
                  borderRadius="xl"
                  _hover={{
                    opacity: 0.94,
                    boxShadow: "0 6px 18px -3px rgba(234, 88, 12, 0.4)",
                  }}
                  onClick={() =>
                    navigate(
                      `/auth/verify-email?email=${encodeURIComponent(user?.email || "")}&userId=${user?.$id || ""}`,
                    )
                  }
                >
                  <HStack gap="1.5">
                    <LuShieldCheck size={16} />
                    <Text>{t("dashboard.verifyButton")}</Text>
                  </HStack>
                </Button>
              </Flex>
            </Alert.Root>
          )}

          {/* Hero Welcome Card */}
          <Box
            p={{ base: "6", md: "8" }}
            borderRadius="3xl"
            borderWidth="1px"
            borderColor="border.subtle"
            bg="linear-gradient(135deg, rgba(249, 115, 22, 0.08) 0%, rgba(234, 88, 12, 0.04) 100%)"
            boxShadow="0 10px 30px -10px rgba(0, 0, 0, 0.05)"
          >
            <Flex
              direction={{ base: "column", md: "row" }}
              justify="space-between"
              align={{ base: "start", md: "center" }}
              gap="4"
            >
              <Stack gap="2">
                <HStack gap="2">
                  <SplitText
                    text={t("dashboard.welcome", {
                      name: user?.name || extraPrefs.userName || "Patient",
                    })}
                    animation="fadeUp"
                    duration={0.5}
                    style={{
                      fontSize: "1.875rem",
                      fontWeight: 800,
                      letterSpacing: "-0.02em",
                    }}
                  />
                  <Badge
                    colorPalette={isVerified ? "green" : "orange"}
                    variant="subtle"
                    size="lg"
                    borderRadius="full"
                    px="3"
                  >
                    <HStack gap="1">
                      {isVerified ? (
                        <LuShieldCheck size={14} />
                      ) : (
                        <LuTriangleAlert size={14} />
                      )}
                      <Text>
                        {isVerified
                          ? t("dashboard.verified")
                          : t("dashboard.unverified")}
                      </Text>
                    </HStack>
                  </Badge>
                </HStack>
                <Text color="fg.muted" fontSize="sm">
                  {t("brand.subtitle")}
                </Text>
              </Stack>

              <HStack gap="3">
                <Box
                  p="3"
                  borderRadius="2xl"
                  bg="bg.panel"
                  borderWidth="1px"
                  borderColor="border.subtle"
                  textAlign="center"
                >
                  <Text fontSize="2xs" color="fg.muted">
                    {t("dashboard.email")}
                  </Text>
                  <Text fontSize="xs" fontWeight="semibold">
                    {user?.email}
                  </Text>
                </Box>
              </HStack>
            </Flex>
          </Box>

          {/* Details & Services Grid */}
          <Grid templateColumns={{ base: "1fr", md: "1fr 2fr" }} gap="6">
            {/* Profile Info */}
            <Box
              p="6"
              borderRadius="2xl"
              borderWidth="1px"
              borderColor="border.subtle"
              bg="bg.panel"
            >
              <Stack gap="4">
                <HStack gap="2" color="orange.600">
                  <LuUser size={20} />
                  <Text fontWeight="bold" fontSize="md">
                    {t("dashboard.profileInfo")}
                  </Text>
                </HStack>

                <Stack gap="3" fontSize="sm">
                  <Flex
                    justify="space-between"
                    py="2"
                    borderBottomWidth="1px"
                    borderColor="border.subtle"
                  >
                    <Text color="fg.muted">{t("dashboard.age")}</Text>
                    <Text fontWeight="semibold">{extraPrefs.age || "—"}</Text>
                  </Flex>
                  <Flex
                    justify="space-between"
                    py="2"
                    borderBottomWidth="1px"
                    borderColor="border.subtle"
                  >
                    <Text color="fg.muted">{t("dashboard.phone")}</Text>
                    <HStack gap="1">
                      <LuPhone size={14} />
                      <Text fontWeight="semibold">
                        {extraPrefs.phone || "—"}
                      </Text>
                    </HStack>
                  </Flex>
                  <Flex
                    justify="space-between"
                    py="2"
                    borderBottomWidth="1px"
                    borderColor="border.subtle"
                  >
                    <Text color="fg.muted">{t("dashboard.country")}</Text>
                    <HStack gap="1">
                      <LuMapPin size={14} />
                      <Text fontWeight="semibold">
                        {extraPrefs.country || "—"}
                      </Text>
                    </HStack>
                  </Flex>
                  <Flex justify="space-between" py="2">
                    <Text color="fg.muted">{t("dashboard.status")}</Text>
                    <Badge
                      colorPalette={isVerified ? "green" : "orange"}
                      size="sm"
                    >
                      {isVerified
                        ? t("dashboard.verified")
                        : t("dashboard.unverified")}
                    </Badge>
                  </Flex>
                </Stack>
              </Stack>
            </Box>

            {/* Medical Care Cards */}
            <Grid templateColumns={{ base: "1fr", sm: "1fr 1fr" }} gap="4">
              <Box
                p="6"
                borderRadius="2xl"
                borderWidth="1px"
                borderColor="border.subtle"
                bg="bg.panel"
                _hover={{
                  borderColor: "orange.500",
                  transform: "translateY(-2px)",
                }}
                transition="all 0.2s"
              >
                <Stack gap="3">
                  <Flex
                    w="10"
                    h="10"
                    borderRadius="xl"
                    bg="orange.subtle"
                    color="orange.solid"
                    align="center"
                    justify="center"
                  >
                    <LuCalendar size={20} />
                  </Flex>
                  <Text fontWeight="bold" fontSize="md">
                    {t("dashboard.appointments")}
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    {t("dashboard.noAppointments")}
                  </Text>
                </Stack>
              </Box>

              <Box
                p="6"
                borderRadius="2xl"
                borderWidth="1px"
                borderColor="border.subtle"
                bg="bg.panel"
                _hover={{
                  borderColor: "amber.500",
                  transform: "translateY(-2px)",
                }}
                transition="all 0.2s"
              >
                <Stack gap="3">
                  <Flex
                    w="10"
                    h="10"
                    borderRadius="xl"
                    bg="amber.subtle"
                    color="amber.solid"
                    align="center"
                    justify="center"
                  >
                    <LuFileText size={20} />
                  </Flex>
                  <Text fontWeight="bold" fontSize="md">
                    {t("dashboard.records")}
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    {t("dashboard.recordsDesc")}
                  </Text>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        </Stack>
      </Container>
    </Box>
  );
};

export default Dashboard;
