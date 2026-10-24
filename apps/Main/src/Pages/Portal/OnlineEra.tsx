import React, { useState, useRef, useMemo } from "react";
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
  Switch,
  Grid,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { useUser } from "@repo/react-appwrite";
import {
  LuSparkles,
  LuArrowRight,
  LuRefreshCw,
  LuShieldAlert,
  LuGamepad2,
  LuHeartHandshake,
  LuActivity,
} from "react-icons/lu";

import {
  gameAudio,
  saveScreeningScore,
  setDoctorFileAttachmentPreference,
  getDoctorFileAttachmentPreference,
  getScoreInterpretation,
} from "../../services/gameService";

export const OnlineEra: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useUser();
  const userId = user?.$id || "patient_screening";
  const isArabic = i18n.language === "ar" || document.body.dir === "rtl";

  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [completed, setCompleted] = useState(false);
  const [addedToDossier, setAddedToDossier] = useState(() => getDoctorFileAttachmentPreference());

  const startTimeRef = useRef<number>(Date.now());

  const questions = useMemo(
    () => [
      {
        title: isArabic
          ? "عند مواجهة مهمة غير متوقعة ذات مسؤولية عالية وموعد ضاغط:"
          : "When facing an unexpected high-stakes task with urgent deadlines:",
        options: [
          {
            text: isArabic
              ? "تسارع حاد في نبضات القلب وشلل حركي وعجز عن البدء"
              : "Immediate heart rate surge, mental freeze, and initiation paralysis",
            score: 3,
          },
          {
            text: isArabic
              ? "توتر ملحوظ، لكن أستطيع تجزئة المهمة تدريجياً والبدء"
              : "Moderate anxiety, but able to break the task down and proceed",
            score: 2,
          },
          {
            text: isArabic
              ? "هدوء ذهني وقدرة منهجية على التعامل مع المستجدات"
              : "Remain grounded and initiate methodically without panic",
            score: 1,
          },
        ],
      },
      {
        title: isArabic
          ? "في الأماكن المزدحمة ذات الأصوات الصاخبة والأضواء الساطعة:"
          : "In crowded environments with loud ambient noise and harsh lighting:",
        options: [
          {
            text: isArabic
              ? "استنزاف حسي سريع جداً ورغبة ملحة في الهروب الفوري"
              : "Rapid sensory depletion and overwhelming urge to escape",
            score: 3,
          },
          {
            text: isArabic
              ? "انزعاج طفيف يمكن تحمله لفترة محدودة قبل الحاجة للراحة"
              : "Mild discomfort, manageable for a limited period before needing a break",
            score: 2,
          },
          {
            text: isArabic
              ? "تكيف طبيعي دون تأثر كبير بالحمل الحسي المحيط"
              : "Unbothered by ambient sensory load; comfortable in active spaces",
            score: 1,
          },
        ],
      },
      {
        title: isArabic
          ? "عندما يشتد التوتر النفسي، كيف يستجيب جسدك سوماتياً؟"
          : "When emotional stress escalates, how does your somatic system react?",
        options: [
          {
            text: isArabic
              ? "تشنج عضلي حاد في الرقبة/الكتفين، أو اضطراب معوي حاد (قولون عصبي)"
              : "Severe muscle clamping in neck/back, or sharp gastrointestinal distress",
            score: 3,
          },
          {
            text: isArabic
              ? "تنفس سطحي سريع مع تململ حركي في الأطراف"
              : "Shallow breathing, fidgeting, and restless limb pacing",
            score: 2,
          },
          {
            text: isArabic
              ? "استجابة جسدية خفيفة جداً تزول سريعاً بالاسترخاء"
              : "Minimal somatic impact; pulse and muscles remain stable",
            score: 1,
          },
        ],
      },
      {
        title: isArabic
          ? "بعد انتهاء الموقف الموتور أو النقاش الحاد، كم يستغرق جهازك العصبي للهدوء؟"
          : "After an intense stressful event concludes, how long does your nervous system take to settle?",
        options: [
          {
            text: isArabic
              ? "يبقى التوتر والانقباض مستمراً لعدة أيام مع أرق مستمر"
              : "Lingering hyper-activation and insomnia that lasts for days",
            score: 3,
          },
          {
            text: isArabic
              ? "يحتاج بضع ساعات حتى يعود إلى خط الأساس الطبيعي"
              : "A few hours of decompression before returning to baseline",
            score: 2,
          },
          {
            text: isArabic
              ? "أستعيد توازني خلال دقائق معدودة فور انتهاء المؤثر"
              : "Reset to calm within minutes of the stressor ending",
            score: 1,
          },
        ],
      },
      {
        title: isArabic
          ? "عند الخلود للنوم في نهاية يوم حافل بالضغوط:"
          : "When attempting to fall asleep at the end of a demanding day:",
        options: [
          {
            text: isArabic
              ? "أفكار تسابقية ملحة ومراجعة قلقة لكل كلمة قيلت"
              : "Racing thoughts, replaying scenarios on loop, unable to shut down",
            score: 3,
          },
          {
            text: isArabic
              ? "صعوبة مؤقتة في النوم تستغرق نصف ساعة ثم أنام"
              : "Temporary restlessness taking 30–45 minutes before sleep",
            score: 2,
          },
          {
            text: isArabic
              ? "استرخاء سهل ونوم هادئ دون اجترار"
              : "Smooth relaxation and restful sleep without obsessive rumination",
            score: 1,
          },
        ],
      },
    ],
    [isArabic]
  );

  const handleSelect = async (score: number) => {
    gameAudio.playTileClick();
    const updated = [...answers, score];
    setAnswers(updated);

    if (currentStep + 1 < questions.length) {
      setCurrentStep(currentStep + 1);
    } else {
      // Completed questionnaire
      setCompleted(true);
      gameAudio.playScorecardFanfare();

      const totalScore = updated.reduce((a, b) => a + b, 0);
      const maxPossible = questions.length * 3;
      const minPossible = questions.length * 1;
      // Map min-max to 1-10 scale
      const normalizedScore = Math.min(
        10,
        Math.max(1, Math.round(((totalScore - minPossible) / (maxPossible - minPossible)) * 9 + 1))
      );

      const completionTimeMs = Date.now() - startTimeRef.current;
      await saveScreeningScore(
        userId,
        "era",
        normalizedScore,
        {
          answers: updated,
          totalScore,
          maxScore: maxPossible,
          completionTimeMs,
        },
        "online_era_somatic_screening"
      );
    }
  };

  const handleToggleDossier = (checked: boolean) => {
    setAddedToDossier(checked);
    setDoctorFileAttachmentPreference(checked);
  };

  const totalScore = answers.reduce((a, b) => a + b, 0);
  const maxPossible = questions.length * 3;
  const minPossible = questions.length * 1;
  const indicativeScale = Math.min(
    10,
    Math.max(1, Math.round(((totalScore - minPossible) / (maxPossible - minPossible)) * 9 + 1))
  );

  const interpretation = getScoreInterpretation("era", indicativeScale, isArabic);

  // SVG Circular Gauge calculation
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, Math.max(0, indicativeScale / 10));
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <Box minH="100vh" bg="bg" color="fg" py="8" px={{ base: "4", md: "8" }}>
      <Container maxW="3xl">
        <Stack gap="8">
          {/* Header */}
          <Stack gap="2">
            <HStack justify="space-between" wrap="wrap" gap="3">
              <HStack gap="2.5">
                <Flex
                  w="10"
                  h="10"
                  borderRadius="xl"
                  bg="orange.500/10"
                  color="orange.600"
                  align="center"
                  justify="center"
                >
                  <LuActivity size={24} />
                </Flex>
                <Box>
                  <Text fontSize="2xl" fontWeight="black" letterSpacing="tight">
                    {t("era.title", "Online ERA: Somatic & Sensory Screening")}
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    {t(
                      "era.subtitle",
                      "Structured behavioral assessment measuring nervous system reactivity, sensory load, and stress rebound."
                    )}
                  </Text>
                </Box>
              </HStack>

              <HStack gap="2">
                <Badge
                  colorPalette="orange"
                  size="sm"
                  px="3"
                  py="1"
                  borderRadius="full"
                  fontSize="xs"
                  fontWeight="bold"
                >
                  Pillar 2 Assessment
                </Badge>
                <Button
                  size="xs"
                  variant="outline"
                  borderRadius="lg"
                  onClick={() => navigate("/games/detector")}
                >
                  <LuGamepad2 size={14} style={{ marginRight: "4px" }} />
                  {isArabic ? "الانتقال للألعاب التفاعلية" : "Interactive Mini-Games"}
                </Button>
              </HStack>
            </HStack>
          </Stack>

          {/* Mandatory Medical Disclaimer Bar */}
          <Box
            p="4"
            borderRadius="2xl"
            bg="orange.500/10"
            borderWidth="1.5px"
            borderColor="orange.500/30"
          >
            <HStack gap="3" align="start">
              <LuShieldAlert
                size={22}
                color="#ea580c"
                style={{ flexShrink: 0, marginTop: "2px" }}
              />
              <Stack gap="1">
                <Text fontWeight="bold" fontSize="xs" color="orange.600">
                  {t("games.disclaimerTitle", "Official Medical Disclaimer")}
                </Text>
                <Text fontSize="2xs" color="fg.muted" lineHeight="tall">
                  {t(
                    "era.disclaimer",
                    "This assessment outputs indicative decision-support scores for clinical use, not a formal medical diagnosis. Final evaluation and prescriptions remain strictly with licensed clinicians."
                  )}
                </Text>
              </Stack>
            </HStack>
          </Box>

          {/* QUESTIONNAIRE PROGRESS & QUESTION CARD */}
          {!completed ? (
            <Box
              p={{ base: "6", md: "8" }}
              borderRadius="3xl"
              bg="bg.panel"
              borderWidth="1.5px"
              borderColor="border.subtle"
              boxShadow="0 15px 35px -10px rgba(0, 0, 0, 0.08)"
            >
              <Stack gap="6">
                <Flex justify="space-between" align="center">
                  <Text fontSize="xs" fontWeight="bold" color="fg.muted">
                    {t("era.stepLabel", { current: currentStep + 1, total: questions.length })}
                  </Text>
                  <Text fontSize="xs" fontWeight="black" color="orange.600">
                    {Math.round(((currentStep + 1) / questions.length) * 100)}%
                  </Text>
                </Flex>

                <Progress.Root
                  value={((currentStep + 1) / questions.length) * 100}
                  size="sm"
                  colorPalette="orange"
                >
                  <Progress.Track borderRadius="full">
                    <Progress.Range borderRadius="full" />
                  </Progress.Track>
                </Progress.Root>

                <Text fontSize={{ base: "md", md: "lg" }} fontWeight="bold" lineHeight="tall">
                  {questions[currentStep].title}
                </Text>

                <Stack gap="3.5">
                  {questions[currentStep].options.map((opt, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      px="5"
                      py="4"
                      h="auto"
                      borderRadius="2xl"
                      justifyContent="flex-start"
                      textAlign="start"
                      whiteSpace="normal"
                      borderWidth="1.5px"
                      borderColor="border.subtle"
                      _hover={{
                        borderColor: "orange.500",
                        bg: "orange.500/5",
                        transform: "translateY(-1px)",
                      }}
                      transition="all 0.2s ease"
                      onClick={() => handleSelect(opt.score)}
                    >
                      <HStack gap="3" align="start">
                        <Flex
                          w="6"
                          h="6"
                          borderRadius="full"
                          bg="orange.500/10"
                          color="orange.600"
                          align="center"
                          justify="center"
                          fontSize="xs"
                          fontWeight="bold"
                          flexShrink={0}
                          mt="0.5"
                        >
                          {String.fromCharCode(65 + idx)}
                        </Flex>
                        <Text fontSize="sm" fontWeight="medium" lineHeight="tall">
                          {opt.text}
                        </Text>
                      </HStack>
                    </Button>
                  ))}
                </Stack>
              </Stack>
            </Box>
          ) : (
            /* COMPLETED SCORECARD CARD */
            <Box
              p={{ base: "6", md: "8" }}
              borderRadius="3xl"
              bg="bg.panel"
              borderWidth="1.5px"
              borderColor="orange.500/30"
              boxShadow="0 20px 45px -10px rgba(234, 88, 12, 0.15)"
            >
              <Stack gap="7" textAlign="center" align="center">
                <Flex
                  w="16"
                  h="16"
                  borderRadius="full"
                  bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                  color="white"
                  align="center"
                  justify="center"
                  boxShadow="0 10px 25px rgba(234, 88, 12, 0.35)"
                >
                  <LuSparkles size={32} />
                </Flex>

                <Stack gap="1.5">
                  <Text fontSize="2xl" fontWeight="black">
                    {t("era.completedTitle", "ERA Assessment Complete")}
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    {t(
                      "era.completedSubtitle",
                      "Your indicative somatic anxiety score is ready for clinical review."
                    )}
                  </Text>
                </Stack>

                {/* Circular Gauge Display */}
                <Box
                  position="relative"
                  w="140px"
                  h="140px"
                  display="flex"
                  alignItems="center"
                  justifyContent="center"
                >
                  <svg width="140" height="140" viewBox="0 0 130 130">
                    <circle
                      cx="65"
                      cy="65"
                      r={radius}
                      stroke="currentColor"
                      strokeWidth="10"
                      fill="transparent"
                      opacity={0.12}
                    />
                    <circle
                      cx="65"
                      cy="65"
                      r={radius}
                      stroke="#ea580c"
                      strokeWidth="11"
                      strokeDasharray={circumference}
                      strokeDashoffset={strokeDashoffset}
                      strokeLinecap="round"
                      fill="transparent"
                      transform="rotate(-90 65 65)"
                      style={{ transition: "stroke-dashoffset 0.9s ease-in-out" }}
                    />
                  </svg>
                  <Box position="absolute" textAlign="center">
                    <Text fontSize="4xl" fontWeight="900" fontFamily="mono" color="orange.600" lineHeight="1">
                      {indicativeScale}
                      <Text as="span" fontSize="sm" opacity={0.6}>
                        /10
                      </Text>
                    </Text>
                  </Box>
                </Box>

                {/* Interpretation Card */}
                <Box p="5" borderRadius="2xl" bg="bg.subtle" w="100%" maxW="md" textAlign="start">
                  <HStack justify="space-between" mb="2">
                    <Text fontSize="xs" fontWeight="bold">
                      {t("era.indicatorLabel", "Somatic & Sensory Indicator:")}
                    </Text>
                    <Badge colorPalette={indicativeScale >= 7 ? "orange" : "teal"} size="xs">
                      {interpretation.tag}
                    </Badge>
                  </HStack>
                  <Text fontSize="xs" color="fg.muted" lineHeight="tall">
                    {interpretation.description}
                  </Text>
                </Box>

                {/* Dossier Toggle Switch */}
                <Box
                  p="4"
                  borderRadius="2xl"
                  bg="bg.subtle"
                  w="100%"
                  maxW="md"
                  borderWidth="1px"
                  borderColor="border.subtle"
                >
                  <Flex justify="space-between" align="center" gap="3">
                    <HStack gap="2.5">
                      <LuHeartHandshake size={20} color="#ea580c" />
                      <Box textAlign="start">
                        <Text fontSize="xs" fontWeight="bold">
                          {t("games.addToDossier", "Add Scores to My Ready Doctor File")}
                        </Text>
                        <Text fontSize="2xs" color="fg.muted">
                          {isArabic
                            ? "مزامنة النتيجة تلقائياً مع الطبيب قبل الاستشارة"
                            : "Auto-sync into your upcoming clinical dossier"}
                        </Text>
                      </Box>
                    </HStack>

                    <Switch.Root
                      checked={addedToDossier}
                      onCheckedChange={(e) => handleToggleDossier(e.checked)}
                      colorPalette="orange"
                    >
                      <Switch.HiddenInput />
                      <Switch.Control />
                    </Switch.Root>
                  </Flex>
                </Box>

                {/* Actions */}
                <HStack gap="3" wrap="wrap" justify="center">
                  <Button
                    size="md"
                    px="4"
                    py="2"
                    fontSize="sm"
                    fontWeight="semibold"
                    variant="outline"
                    borderRadius="xl"
                    onClick={() => {
                      setCurrentStep(0);
                      setAnswers([]);
                      setCompleted(false);
                      startTimeRef.current = Date.now();
                    }}
                  >
                    <HStack gap="1.5">
                      <LuRefreshCw size={14} />
                      <Text>{t("era.retake", "Retake")}</Text>
                    </HStack>
                  </Button>

                  <Button
                    size="md"
                    px="5"
                    py="2"
                    fontSize="sm"
                    fontWeight="bold"
                    bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                    color="white"
                    borderRadius="xl"
                    onClick={() => navigate("/sessions/therapists?specialty=Anxiety")}
                  >
                    <HStack gap="1.5">
                      <Text>{t("era.bookTherapist", "Find Anxiety & Regulation Specialists")}</Text>
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
