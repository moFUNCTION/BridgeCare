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
  LuGlobe,
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
  const { t, i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const [breathingPhase, setBreathingPhase] = useState<"inhale" | "hold" | "exhale" | "rest">("inhale");
  const [countdown, setCountdown] = useState(4);
  const [showBreathing, setShowBreathing] = useState(false);
  const [showInternational, setShowInternational] = useState(false);

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
    inhale: t("crisis.inhale", isAr ? "شهيق عميق... (4ث)" : "Inhale deeply... (4s)"),
    hold: t("crisis.hold", isAr ? "احبس النفس بهدوء... (4ث)" : "Hold breath gently... (4s)"),
    exhale: t("crisis.exhale", isAr ? "زفير بطيء وتفريغ التوتر... (4ث)" : "Exhale slowly & release... (4s)"),
    rest: t("crisis.rest", isAr ? "استرخِ واستعد... (4ث)" : "Rest & reset... (4s)"),
  };

  return (
    <Box
      position="fixed"
      inset="0"
      bg="black/80"
      backdropFilter="blur(10px)"
      zIndex={2500}
      display="flex"
      alignItems="center"
      justifyContent="center"
      p="4"
      dir={isAr ? "rtl" : "ltr"}
    >
      <Box
        maxW="lg"
        w="100%"
        bg="bg.panel"
        borderWidth="1.5px"
        borderColor="red.500/50"
        borderRadius="3xl"
        boxShadow="0 25px 60px -15px rgba(220, 38, 38, 0.45)"
        overflow="hidden"
        animation="scaleIn 0.25s ease-out"
      >
        {/* Urgent Header Banner */}
        <Box
          p="5"
          bg="linear-gradient(135deg, rgba(220, 38, 38, 0.2) 0%, rgba(234, 88, 12, 0.15) 100%)"
          borderBottomWidth="1px"
          borderColor="red.500/30"
        >
          <Flex justify="space-between" align="center">
            <HStack gap="3">
              <Flex
                w="11"
                h="11"
                borderRadius="2xl"
                bg="red.600"
                color="white"
                align="center"
                justify="center"
                boxShadow="0 4px 14px rgba(220, 38, 38, 0.5)"
                flexShrink={0}
              >
                <LuShieldAlert size={24} />
              </Flex>
              <Stack gap="0.5">
                <HStack gap="2">
                  <Text fontWeight="bold" fontSize="md" color="red.600">
                    {t("crisis.title", isAr ? "خط الطوارئ ودعم الأزمات الفوري" : "Immediate Crisis & Suicide Prevention Lifeline")}
                  </Text>
                  <Badge colorPalette="red" variant="solid" size="xs" px="2" py="0.5" borderRadius="full" fontSize="2xs" fontWeight="bold">
                    {t("crisis.free247", isAr ? "مجاني وسري 24/7" : "Free & 24/7")}
                  </Badge>
                </HStack>
                <Text fontSize="xs" color="fg.muted">
                  {t("crisis.subtitle", isAr ? "أنت لست وحدك. هناك من يهتم ويريد مساعدتك الآن." : "You are not alone. Compassionate human help is right here.")}
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
              px="6"
              py="3"
              bg="linear-gradient(135deg, #dc2626 0%, #b91c1c 100%)"
              color="white"
              borderRadius="2xl"
              boxShadow="0 8px 24px rgba(220, 38, 38, 0.35)"
              _hover={{ opacity: 0.94, transform: "scale(1.01)" }}
              justifyContent="center"
              h="52px"
            >
              <HStack gap="2.5">
                <LuPhoneCall size={20} />
                <Text fontWeight="bold" fontSize="md">
                  {t("crisis.callLifeline", isAr ? "اتصال فوري بخط المساعدة (988)" : "Call 988 Suicide & Crisis Lifeline")}
                </Text>
              </HStack>
            </Button>

            <Button
              as="a"
              href="sms:741741?body=HOME"
              size="lg"
              px="6"
              py="3"
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
                  {t("crisis.textCounselor", isAr ? "محادثة نصية مع مستشار الأزمات (741741)" : "Text HOME to 741741 (Crisis Text Line)")}
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
                  {t("crisis.breathingTitle", isAr ? "تمرين التنفس المربع للتهدئة (Box Breathing)" : "Guided Box Breathing Grounding")}
                </Text>
              </HStack>
              <Button
                size="xs"
                px="3"
                py="1.5"
                borderRadius="xl"
                fontSize="xs"
                fontWeight="semibold"
                variant="subtle"
                colorPalette="orange"
                onClick={() => setShowBreathing(!showBreathing)}
              >
                {showBreathing
                  ? t("crisis.hide", isAr ? "إخفاء" : "Hide")
                  : t("crisis.startNow", isAr ? "بدء التمرين (60 ثانية)" : "Start (60s)")}
              </Button>
            </Flex>

            {showBreathing && (
              <Flex direction="column" align="center" py="4" gap="3">
                <Box
                  w="108px"
                  h="108px"
                  borderRadius="full"
                  bg="linear-gradient(135deg, rgba(234, 88, 12, 0.25) 0%, rgba(249, 115, 22, 0.45) 100%)"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                  borderWidth="3px"
                  borderColor="orange.500"
                  transition="all 1s cubic-bezier(0.4, 0, 0.2, 1)"
                  transform={breathingPhase === "inhale" || breathingPhase === "hold" ? "scale(1.22)" : "scale(0.85)"}
                  boxShadow="0 0 30px rgba(234, 88, 12, 0.35)"
                >
                  <Text fontSize="3xl" fontWeight="black" color="orange.600">
                    {countdown}
                  </Text>
                </Box>
                <Text fontSize="sm" fontWeight="bold" color="fg">
                  {phaseLabels[breathingPhase]}
                </Text>
                <Text fontSize="2xs" color="fg.muted" textAlign="center">
                  {t("crisis.boxBreathingHint", isAr ? "دورة 4-4-4-4 لتنظيم الجهاز العصبي وتخفيف نوبات الهلع والتسارع الفكري" : "4-4-4-4 pattern to down-regulate nervous system & ease acute panic")}
                </Text>
              </Flex>
            )}
          </Box>

          {/* Regional & International Emergency Helpline Accordion */}
          <Box
            p="3"
            borderRadius="xl"
            bg="bg.subtle"
            borderWidth="1px"
            borderColor="border.subtle"
          >
            <Flex justify="space-between" align="center">
              <HStack gap="2">
                <LuGlobe size={15} color="#ea580c" />
                <Text fontSize="xs" fontWeight="semibold">
                  {isAr ? "أرقام الطوارئ الدولية والعربية" : "International & Regional Helplines"}
                </Text>
              </HStack>
              <Button
                size="2xs"
                variant="ghost"
                onClick={() => setShowInternational(!showInternational)}
              >
                {showInternational ? (isAr ? "إغلاق" : "Close") : (isAr ? "عرض الأرقام" : "View")}
              </Button>
            </Flex>

            {showInternational && (
              <Stack gap="1.5" mt="3" pt="2" borderTopWidth="1px" borderColor="border.subtle" fontSize="2xs" color="fg.muted">
                <Flex justify="space-between">
                  <Text fontWeight="semibold">{isAr ? "المملكة العربية السعودية:" : "Saudi Arabia:"}</Text>
                  <Text as="a" href="tel:920033360" color="red.600" fontWeight="bold">920033360 / 937</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text fontWeight="semibold">{isAr ? "الإمارات العربية المتحدة:" : "UAE Mental Support:"}</Text>
                  <Text as="a" href="tel:8004673" color="red.600" fontWeight="bold">800-4673 (HOPE)</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text fontWeight="semibold">{isAr ? "مصر (الأمانة العامة للصحة النفسية):" : "Egypt Crisis Line:"}</Text>
                  <Text as="a" href="tel:08008880700" color="red.600" fontWeight="bold">08008880700 / 16328</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text fontWeight="semibold">{isAr ? "المملكة المتحدة:" : "United Kingdom:"}</Text>
                  <Text as="a" href="tel:111" color="red.600" fontWeight="bold">111 (NHS Mental Health)</Text>
                </Flex>
                <Flex justify="space-between">
                  <Text fontWeight="semibold">{isAr ? "أوروبا / عام:" : "Europe / Universal:"}</Text>
                  <Text as="a" href="tel:112" color="red.600" fontWeight="bold">112</Text>
                </Flex>
              </Stack>
            )}
          </Box>

          {/* Emergency Hospital Note & Reassurance */}
          <HStack gap="2" align="start" color="fg.muted" fontSize="2xs">
            <LuHospital size={16} style={{ flexShrink: 0, marginTop: "2px" }} />
            <Text>
              {t("crisis.emergencyHospitalNote", isAr
                ? "إذا كنت في خطر جسدي داهم، يرجى الاتصال فوراً برقم الطوارئ المحلي (911 أو 112 أو 997) أو التوجه لأقرب قسم طوارئ في مستشفى عام."
                : "If you or someone you know is in immediate physical danger, call local emergency services (988, 911, or 112) or go to the nearest hospital emergency department immediately.")}
            </Text>
          </HStack>
        </Stack>
      </Box>
    </Box>
  );
};

export default CrisisHotlineModal;

