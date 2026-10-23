import React, { useState } from "react";
import {
  Box,
  Button,
  Container,
  Flex,
  HStack,
  Stack,
  Text,
  Badge,
  Alert,
  Progress,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  LuSparkles,
  LuArrowRight,
  LuRefreshCw,
} from "react-icons/lu";

export const OnlineEra: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [completed, setCompleted] = useState(false);

  const questions = [
    {
      title: t("era.q1Title"),
      options: [
        { text: t("era.q1Opt1"), score: 3 },
        { text: t("era.q1Opt2"), score: 2 },
        { text: t("era.q1Opt3"), score: 1 },
      ],
    },
    {
      title: t("era.q2Title"),
      options: [
        { text: t("era.q2Opt1"), score: 3 },
        { text: t("era.q2Opt2"), score: 2 },
        { text: t("era.q2Opt3"), score: 1 },
      ],
    },
    {
      title: t("era.q3Title"),
      options: [
        { text: t("era.q3Opt1"), score: 3 },
        { text: t("era.q3Opt2"), score: 2 },
        { text: t("era.q3Opt3"), score: 1 },
      ],
    },
  ];

  const handleSelect = (score: number) => {
    const updated = [...answers, score];
    setAnswers(updated);
    if (currentStep + 1 < questions.length) {
      setCurrentStep(currentStep + 1);
    } else {
      setCompleted(true);
    }
  };

  const totalScore = answers.reduce((a, b) => a + b, 0);
  const indicativeScale = Math.min(Math.round((totalScore / 9) * 10), 10);

  return (
    <Box minH="100vh" bg="bg" color="fg" py="8" px={{ base: "4", md: "8" }}>
      <Container maxW="3xl">
        <Stack gap="8">
          {/* Header */}
          <Stack gap="2">
            <HStack gap="2">
              <Text fontSize="2xl" fontWeight="bold">
                {t("era.title")}
              </Text>
              <Badge colorPalette="orange" size="md">
                Pillar 2
              </Badge>
            </HStack>
            <Text fontSize="sm" color="fg.muted">
              {t("era.subtitle")}
            </Text>
          </Stack>

          {/* Medical Disclaimer */}
          <Alert.Root status="info" variant="subtle" borderRadius="2xl" p="4">
            <Alert.Indicator />
            <Text fontSize="2xs" color="fg.muted">
              {t("era.disclaimer")}
            </Text>
          </Alert.Root>

          {!completed ? (
            <Box p="6" borderRadius="3xl" bg="bg.panel" borderWidth="1px" borderColor="border.subtle">
              <Stack gap="6">
                <Flex justify="space-between" align="center">
                  <Text fontSize="xs" color="fg.muted">
                    {t("era.stepLabel", { current: currentStep + 1, total: questions.length })}
                  </Text>
                  <Text fontSize="xs" fontWeight="bold" color="orange.600">
                    {Math.round(((currentStep + 1) / questions.length) * 100)}%
                  </Text>
                </Flex>

                <Progress.Root value={((currentStep + 1) / questions.length) * 100} size="xs" colorPalette="orange">
                  <Progress.Track>
                    <Progress.Range />
                  </Progress.Track>
                </Progress.Root>

                <Text fontSize="md" fontWeight="bold">
                  {questions[currentStep].title}
                </Text>

                <Stack gap="3">
                  {questions[currentStep].options.map((opt, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      p="5"
                      h="auto"
                      borderRadius="2xl"
                      justifyContent="flex-start"
                      _hover={{ borderColor: "orange.500", bg: "orange.500/5" }}
                      onClick={() => handleSelect(opt.score)}
                    >
                      <Text fontSize="sm">{opt.text}</Text>
                    </Button>
                  ))}
                </Stack>
              </Stack>
            </Box>
          ) : (
            <Box p="8" borderRadius="3xl" bg="bg.panel" borderWidth="1px" borderColor="orange.500/30">
              <Stack gap="6" textAlign="center" align="center">
                <Flex
                  w="16"
                  h="16"
                  borderRadius="full"
                  bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                  color="white"
                  align="center"
                  justify="center"
                  boxShadow="0 8px 24px rgba(234, 88, 12, 0.3)"
                >
                  <LuSparkles size={32} />
                </Flex>

                <Stack gap="1">
                  <Text fontSize="xl" fontWeight="bold">
                    {t("era.completedTitle")}
                  </Text>
                  <Text fontSize="sm" color="fg.muted">
                    {t("era.completedSubtitle")}
                  </Text>
                </Stack>

                <Box p="6" borderRadius="2xl" bg="bg.subtle" w="100%" maxW="md">
                  <Text fontSize="xs" color="fg.muted" mb="1">
                    {t("era.indicatorLabel")}
                  </Text>
                  <Text fontSize="4xl" fontWeight="black" color="orange.600">
                    {indicativeScale}/10
                  </Text>
                  <Text fontSize="xs" color="fg.muted" mt="2">
                    {indicativeScale >= 7 ? t("era.highNotice") : t("era.normalNotice")}
                  </Text>
                </Box>

                <HStack gap="3">
                  <Button
                    variant="outline"
                    borderRadius="xl"
                    onClick={() => {
                      setCurrentStep(0);
                      setAnswers([]);
                      setCompleted(false);
                    }}
                  >
                    <HStack gap="1.5">
                      <LuRefreshCw size={14} />
                      <Text>{t("era.retake")}</Text>
                    </HStack>
                  </Button>

                  <Button
                    bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                    color="white"
                    borderRadius="xl"
                    onClick={() => navigate("/sessions/therapists")}
                  >
                    <HStack gap="1.5">
                      <Text>{t("era.bookTherapist")}</Text>
                      <LuArrowRight size={14} />
                    </HStack>
                  </Button>
                </HStack>
              </Stack>
            </Box>
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default OnlineEra;
