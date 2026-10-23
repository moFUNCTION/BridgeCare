import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Flex,
  HStack,
  Stack,
  Text,
  Badge,
  IconButton,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import {
  LuPhoneCall,
  LuMessageSquare,
  LuX,
  LuShieldAlert,
  LuHospital,
  LuWind,
} from "react-icons/lu";

interface CrisisHotlineModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAutoTriggered?: boolean;
}

export const CrisisHotlineModal: React.FC<CrisisHotlineModalProps> = ({
  isOpen,
  onClose,
  isAutoTriggered = false,
}) => {
  const { t } = useTranslation();
  const [breathingPhase, setBreathingPhase] = useState<"inhale" | "hold" | "exhale" | "rest">("inhale");
  const [countdown, setCountdown] = useState(4);
  const [showBreathing, setShowBreathing] = useState(false);

  // 4-4-4-4 Box Breathing cycle
  useEffect(() => {
    if (!showBreathing || !isOpen) return;
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          setBreathingPhase((phase) => {
            if (phase === "inhale") return "hold";
            if (phase === "hold") return "exhale";
            if (phase === "exhale") return "rest";
            return "inhale";
          });
          return 4;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [showBreathing, isOpen]);

  if (!isOpen) return null;

  const phaseLabels = {
    inhale: t("crisis.inhale"),
    hold: t("crisis.hold"),
    exhale: t("crisis.exhale"),
    rest: t("crisis.rest"),
  };

  return (
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
        maxW="lg"
        w="100%"
        bg="bg.panel"
        borderWidth="1px"
        borderColor="red.500/40"
        borderRadius="3xl"
        boxShadow="0 25px 60px -15px rgba(220, 38, 38, 0.35)"
        overflow="hidden"
        animation="scaleIn 0.25s ease-out"
      >
        {/* Urgent Header Banner */}
        <Box
          p="5"
          bg="linear-gradient(135deg, rgba(220, 38, 38, 0.15) 0%, rgba(234, 88, 12, 0.12) 100%)"
          borderBottomWidth="1px"
          borderColor="red.500/20"
        >
          <Flex justify="space-between" align="center">
            <HStack gap="2.5">
              <Flex
                w="10"
                h="10"
                borderRadius="xl"
                bg="red.600"
                color="white"
                align="center"
                justify="center"
                boxShadow="0 4px 12px rgba(220, 38, 38, 0.4)"
              >
                <LuShieldAlert size={22} />
              </Flex>
              <Stack gap="0">
                <HStack gap="2">
                  <Text fontWeight="bold" fontSize="md" color="red.600">
                    {t("crisis.title")}
                  </Text>
                  <Badge colorPalette="red" variant="solid" size="xs">
                    {t("crisis.free247")}
                  </Badge>
                </HStack>
                <Text fontSize="xs" color="fg.muted">
                  {t("crisis.subtitle")}
                </Text>
              </Stack>
            </HStack>

            <IconButton
              aria-label="Close"
              variant="ghost"
              size="sm"
              onClick={onClose}
              borderRadius="full"
            >
              <LuX size={18} />
            </IconButton>
          </Flex>
        </Box>

        <Stack p="6" gap="5">
          {/* Immediate Action Buttons */}
          <Stack gap="3">
            <Button
              as="a"
              href="tel:988"
              size="lg"
              bg="linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)"
              color="white"
              borderRadius="2xl"
              boxShadow="0 8px 24px rgba(220, 38, 38, 0.35)"
              _hover={{ opacity: 0.94 }}
              justifyContent="center"
              h="52px"
            >
              <HStack gap="2.5">
                <LuPhoneCall size={20} />
                <Text fontWeight="bold" fontSize="md">
                  {t("crisis.callLifeline")}
                </Text>
              </HStack>
            </Button>

            <Button
              as="a"
              href="sms:741741?body=HOME"
              size="lg"
              variant="outline"
              borderColor="red.500/40"
              color="red.600"
              borderRadius="2xl"
              _hover={{ bg: "red.500/10" }}
              justifyContent="center"
              h="48px"
            >
              <HStack gap="2.5">
                <LuMessageSquare size={18} />
                <Text fontWeight="semibold" fontSize="sm">
                  {t("crisis.textCounselor")}
                </Text>
              </HStack>
            </Button>
          </Stack>

          {/* Quick Grounding Breathing Widget */}
          <Box
            p="4"
            borderRadius="2xl"
            bg="bg.subtle"
            borderWidth="1px"
            borderColor="border.subtle"
          >
            <Flex justify="space-between" align="center" mb={showBreathing ? "3" : "0"}>
              <HStack gap="2">
                <LuWind size={18} color="#ea580c" />
                <Text fontSize="sm" fontWeight="semibold">
                  {t("crisis.breathingTitle")}
                </Text>
              </HStack>
              <Button
                size="xs"
                variant="subtle"
                colorPalette="orange"
                onClick={() => setShowBreathing(!showBreathing)}
              >
                {showBreathing ? t("crisis.hide") : t("crisis.startNow")}
              </Button>
            </Flex>

            {showBreathing && (
              <Flex direction="column" align="center" py="4" gap="3">
                <Box
                  w="100px"
                  h="100px"
                  borderRadius="full"
                  bg="linear-gradient(135deg, rgba(234, 88, 12, 0.2) 0%, rgba(249, 115, 22, 0.4) 100%)"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  borderWidth="2px"
                  borderColor="orange.500"
                  transition="all 1s ease-in-out"
                  transform={breathingPhase === "inhale" || breathingPhase === "hold" ? "scale(1.2)" : "scale(0.85)"}
                  boxShadow="0 0 25px rgba(234, 88, 12, 0.3)"
                >
                  <Text fontSize="2xl" fontWeight="black" color="orange.600">
                    {countdown}
                  </Text>
                </Box>
                <Text fontSize="sm" fontWeight="bold" color="fg">
                  {phaseLabels[breathingPhase]}
                </Text>
                <Text fontSize="2xs" color="fg.muted">
                  {t("crisis.boxBreathingHint")}
                </Text>
              </Flex>
            )}
          </Box>

          {/* Emergency Locator Note & Reassurance */}
          <HStack gap="2" align="start" color="fg.muted" fontSize="2xs">
            <LuHospital size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
            <Text>{t("crisis.emergencyHospitalNote")}</Text>
          </HStack>
        </Stack>
      </Box>
    </Box>
  );
};

export default CrisisHotlineModal;
