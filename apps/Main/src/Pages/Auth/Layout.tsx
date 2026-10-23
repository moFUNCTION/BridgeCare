import React from "react";
import {
  Box,
  Flex,
  HStack,
  Stack,
  Image,
} from "@chakra-ui/react";
import { Link, Outlet, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { logo } from "@repo/assets";
import { ColorModeButton } from "../../components/ui/color-mode";
import LanguageToggle from "../../components/LanguageToggle";
import AnimatedSide from "../../components/AnimatedSide";

export const AuthLayout: React.FC = () => {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const isRtl = i18n.language.startsWith("ar");

  return (
    <Flex
      p={{ base: "3", sm: "4", md: "5" }}
      gap={{ base: "4", lg: "6" }}
      h={{ base: "auto", lg: "100vh" }}
      minH="100vh"
      bgColor="bg"
      color="fg"
      align="stretch"
      pos="relative"
      zIndex="1"
      overflow="hidden"
    >
      {/* Background clouds for mobile */}
      <Box
        display={{ base: "block", lg: "none" }}
        p="0"
        id="clouds"
      >
        {Array.from({ length: 8 }).map((_, index) => (
          <Box
            key={index}
            className={`cloud x${index + 1}`}
            bg="rgba(234, 88, 12, 0.08)"
          />
        ))}
      </Box>

      {/* Left/Animated Column (near lyder-eco design, desktop only) */}
      <AnimatedSide
        containerProps={{
          display: { base: "none", lg: "flex" },
          h: "100%",
          w: { lg: "48%", xl: "48%" },
          flexShrink: 0,
        }}
      />

      {/* Right Column: Top Bar + Centered Form */}
      <Stack
        h="100%"
        flexGrow="1"
        gap="4"
        justify="space-between"
        overflowY="auto"
        px={{ base: "2", sm: "4", md: "6" }}
        py="2"
      >
        {/* Top Navbar */}
        <Flex
          gap="4"
          justify="space-between"
          align="center"
          w="100%"
          py="1"
        >
          <Box
            as={Link}
            to="/auth"
            display="inline-flex"
            alignItems="center"
            gap="2"
            textDecoration="none"
          >
            <Image
              src={logo}
              alt="BridgeCare Logo"
              maxH={{ base: "52px", md: "64px" }}
              objectFit="contain"
            />
          </Box>

          <HStack gap="3">
            <LanguageToggle />
            <ColorModeButton />
          </HStack>
        </Flex>

        {/* Centered Form Wrapper */}
        <Flex
          flex="1"
          align="center"
          justify="center"
          py={{ base: "4", md: "6" }}
        >
          <Box
            w="100%"
            maxW={{ base: "100%", sm: "520px", md: "560px" }}
            bg="bg.panel"
            borderRadius="2xl"
            borderWidth="1px"
            borderColor="border.subtle"
            boxShadow="0 20px 45px -15px rgba(0, 0, 0, 0.07), 0 0 1px 1px rgba(0, 0, 0, 0.02)"
            p={{ base: "6", sm: "8", md: "10" }}
            position="relative"
          >
            <Outlet key={location.pathname} />
          </Box>
        </Flex>

        {/* Minimal Footer */}
        <Flex
          justify="center"
          py="2"
          fontSize="xs"
          color="fg.muted"
        >
          © {new Date().getFullYear()} BridgeCare — {t("brand.tagline")}
        </Flex>
      </Stack>
    </Flex>
  );
};

export default AuthLayout;
