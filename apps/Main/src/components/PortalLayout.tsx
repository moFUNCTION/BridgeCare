import React, { useState } from "react";
import {
  Box,
  Flex,
  HStack,
  Stack,
  Text,
  Button,
  Image,
  Badge,
  IconButton,
} from "@chakra-ui/react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useUser, useAuthActions } from "@repo/react-appwrite";
import { BranchedMenu, type BranchedMenuItem } from "@repo/ui-components";
import { logo } from "@repo/assets";
import { ColorModeButton } from "./ui/color-mode";
import LanguageToggle from "./LanguageToggle";
import CrisisHotlineModal from "./CrisisHotlineModal";
import { setVerificationSkipped } from "../lib/cookies";
import {
  LuUser,
  LuSettings,
  LuShieldCheck,
  LuBot,
  LuFileText,
  LuGamepad2,
  LuSparkles,
  LuMessageSquare,
  LuFlame,
  LuBell,
  LuStethoscope,
  LuCalendar,
  LuCreditCard,
  LuLogOut,
  LuMenu,
  LuX,
  LuHeartHandshake,
  LuShieldAlert,
} from "react-icons/lu";

export const PortalLayout: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, profile } = useUser();
  const { logout } = useAuthActions();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [crisisModalOpen, setCrisisModalOpen] = useState(false);

  const isRtl = i18n.language === "ar" || document.body.dir === "rtl";
  const userName = user?.name || profile?.userName || "Patient";

  const handleSignOut = async () => {
    try {
      setVerificationSkipped(false);
      await logout();
      navigate("/auth/login");
    } catch (err) {
      console.error("Logout failed:", err);
      navigate("/auth/login");
    }
  };

  // Define Branched Menu Items based on user specification
  const menuItems: BranchedMenuItem[] = [
    {
      label: t("menu.sections.user"),
      children: [
        {
          value: "/user/profile",
          label: t("menu.items.userProfile"),
          icon: <LuUser size={16} />,
        },
        {
          value: "/user/settings",
          label: t("menu.items.userSettings"),
          icon: <LuSettings size={16} />,
        },
        {
          value: "/user/security",
          label: t("menu.items.passwordSecurity"),
          icon: <LuShieldCheck size={16} />,
        },
      ],
    },
    {
      label: t("menu.sections.aiTherapist"),
      children: [
        {
          value: "/ai-therapist/chat",
          label: t("menu.items.aiChat"),
          icon: <LuBot size={16} />,
        },
        {
          value: "/ai-therapist/reports",
          label: t("menu.items.latestReports"),
          icon: <LuFileText size={16} />,
        },
      ],
    },
    {
      label: t("menu.sections.games"),
      children: [
        {
          value: "/games/detector",
          label: t("menu.items.mentalDisorderDetector"),
          icon: <LuGamepad2 size={16} />,
        },
        {
          value: "/games/era",
          label: t("menu.items.onlineEra"),
          icon: <LuSparkles size={16} />,
        },
      ],
    },
    {
      label: t("menu.sections.community"),
      children: [
        {
          value: "/community/posts",
          label: t("menu.items.posts"),
          icon: <LuMessageSquare size={16} />,
        },
        {
          value: "/community/viral",
          label: t("menu.items.viral"),
          icon: <LuFlame size={16} />,
        },
        {
          value: "/community/notifications",
          label: t("menu.items.notifications"),
          icon: <LuBell size={16} />,
        },
      ],
    },
    {
      label: t("menu.sections.sessions"),
      children: [
        {
          value: "/sessions/therapists",
          label: t("menu.items.therapists"),
          icon: <LuStethoscope size={16} />,
        },
        {
          value: "/sessions/latest",
          label: t("menu.items.latestSessions"),
          icon: <LuCalendar size={16} />,
        },
        {
          value: "/sessions/billing",
          label: t("menu.items.billing"),
          icon: <LuCreditCard size={16} />,
        },
      ],
    },
  ];

  return (
    <Flex minH="100vh" w="100%" bg="bg" color="fg" direction="row" position="relative">
      {/* Mobile Backdrop Overlay */}
      {mobileMenuOpen && (
        <Box
          display={{ base: "block", md: "none" }}
          position="fixed"
          inset="0"
          bg="black/60"
          backdropFilter="blur(4px)"
          zIndex={990}
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar with Branched Menu */}
      <Box
        as="aside"
        w={{ base: "280px", lg: "300px" }}
        h="100vh"
        position={{ base: "fixed", md: "sticky" }}
        top="0"
        {...(isRtl
          ? { right: { base: mobileMenuOpen ? "0" : "-320px", md: "0" } }
          : { left: { base: mobileMenuOpen ? "0" : "-320px", md: "0" } })}
        zIndex={{ base: 1000, md: 50 }}
        bg="bg.panel"
        borderInlineEndWidth="1px"
        borderColor="border.subtle"
        display="flex"
        flexDirection="column"
        transition="right 300ms ease, left 300ms ease"
        boxShadow={{ base: "2xl", md: "none" }}
      >
        {/* Sidebar Header with Brand */}
        <Flex
          px="6"
          py="5"
          align="center"
          justify="space-between"
          borderBottomWidth="1px"
          borderColor="border.subtle"
        >
          <HStack
            gap="3"
            cursor="pointer"
            onClick={() => {
              navigate("/");
              setMobileMenuOpen(false);
            }}
          >
            <Image
              src={logo}
              alt={t("portalLayout.brandLogo")}
              maxH="38px"
              objectFit="contain"
            />
          </HStack>

          {/* Close button for mobile drawer */}
          <IconButton
            display={{ base: "inline-flex", md: "none" }}
            aria-label={t("portalLayout.closeMenu")}
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(false)}
          >
            <LuX size={20} />
          </IconButton>
        </Flex>

        {/* Branched Menu Body */}
        <Box
          flex="1"
          overflowY="auto"
          px="4"
          py="6"
          css={{
            "&::-webkit-scrollbar": { width: "4px" },
            "&::-webkit-scrollbar-thumb": {
              background: "rgba(234, 88, 12, 0.2)",
              borderRadius: "4px",
            },
          }}
        >
          <BranchedMenu
            items={menuItems}
            width={260}
            rowHeight={38}
            indent={36}
            trunk={14}
            defaultOpen={[0, 1, 2, 3, 4]}
            defaultActive={location.pathname}
            color="var(--chakra-colors-fg)"
            accentColor="#ea580c"
            lineColor="rgba(234, 88, 12, 0.28)"
            onSelect={(value) => {
              navigate(value);
              setMobileMenuOpen(false);
            }}
          />
        </Box>

        {/* Urgent Crisis Help Button */}
        <Box px="4" py="2">
          <Button
            size="xs"
            w="100%"
            variant="outline"
            borderColor="red.500/40"
            color="red.600"
            borderRadius="xl"
            _hover={{ bg: "red.500/10" }}
            onClick={() => setCrisisModalOpen(true)}
          >
            <HStack gap="1.5">
              <LuShieldAlert size={14} />
              <Text fontWeight="semibold">
                {t("portalLayout.needUrgentHelp")}
              </Text>
            </HStack>
          </Button>
        </Box>

        {/* Sidebar User Card & Footer */}
        <Box
          p="4"
          borderTopWidth="1px"
          borderColor="border.subtle"
          bg="bg.subtle/40"
        >
          <Flex align="center" justify="space-between" mb="3">
            <HStack gap="3" overflow="hidden">
              <Flex
                align="center"
                justify="center"
                w="10"
                h="10"
                borderRadius="xl"
                bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                color="white"
                flexShrink={0}
                boxShadow="0 2px 8px rgba(234, 88, 12, 0.3)"
              >
                <LuHeartHandshake size={20} />
              </Flex>
              <Stack gap="0" overflow="hidden">
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  truncate
                  color="fg"
                >
                  {userName}
                </Text>
                <HStack gap="1.5">
                  <Badge
                    size="xs"
                    colorPalette="orange"
                    variant="subtle"
                    borderRadius="full"
                  >
                    {t("portalLayout.rolePatient")}
                  </Badge>
                  {user?.emailVerification && (
                    <Badge
                      size="xs"
                      colorPalette="green"
                      variant="subtle"
                      borderRadius="full"
                    >
                      {t("portalLayout.statusVerified")}
                    </Badge>
                  )}
                </HStack>
              </Stack>
            </HStack>

            <Button
              variant="ghost"
              size="sm"
              colorPalette="red"
              onClick={handleSignOut}
              p="2"
              title={t("dashboard.logout")}
            >
              <LuLogOut size={16} />
            </Button>
          </Flex>

          <HStack justify="space-between" pt="1">
            <LanguageToggle />
            <ColorModeButton />
          </HStack>
        </Box>
      </Box>

      {/* Main Content Area */}
      <Flex flex="1" direction="column" minW="0" minH="100vh">
        {/* Mobile Top Header */}
        <Flex
          display={{ base: "flex", md: "none" }}
          align="center"
          justify="space-between"
          px="4"
          py="3"
          bg="bg.panel"
          borderBottomWidth="1px"
          borderColor="border.subtle"
          position="sticky"
          top="0"
          zIndex={100}
        >
          <IconButton
            aria-label={t("portalLayout.openMenu")}
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(true)}
          >
            <LuMenu size={22} />
          </IconButton>

          <Image
            src={logo}
            alt={t("portalLayout.brandLogo")}
            maxH="32px"
            objectFit="contain"
          />

          <HStack gap="2">
            <Button
              size="xs"
              variant="outline"
              borderColor="red.500/40"
              color="red.600"
              borderRadius="full"
              px="2"
              onClick={() => setCrisisModalOpen(true)}
            >
              <HStack gap="1">
                <LuShieldAlert size={12} />
                <Text fontSize="2xs" fontWeight="bold">
                  {t("crisis.crisisPill")}
                </Text>
              </HStack>
            </Button>
            <LanguageToggle />
            <ColorModeButton />
          </HStack>
        </Flex>

        {/* View Outlet for Route Content */}
        <Box flex="1" p="0" minW="0">
          <Outlet />
        </Box>
      </Flex>

      {/* Persistent Crisis Hotline Modal */}
      <CrisisHotlineModal
        isOpen={crisisModalOpen}
        onClose={() => setCrisisModalOpen(false)}
      />
    </Flex>
  );
};

export default PortalLayout;
