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
  Alert,
  Switch,
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
  LuGamepad2,
  LuSparkles,
  LuBrain,
  LuZap,
  LuCloudRain,
  LuGrid2X2,
  LuPlay,
  LuArrowRight,
} from "react-icons/lu";

export const MentalDetectorGames: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();

  const [activeGame, setActiveGame] = useState<"none" | "attention" | "mood" | "pattern">("none");
  const [showResults, setShowResults] = useState(false);
  const [addedToDossier, setAddedToDossier] = useState(true);

  // Attention Game State
  const [attentionScore, setAttentionScore] = useState(0);
  const [starPosition, setStarPosition] = useState({ top: "40%", left: "50%" });
  const [gameTimer, setGameTimer] = useState(15);
  const [isPlayingAttention, setIsPlayingAttention] = useState(false);

  const startAttentionGame = () => {
    setActiveGame("attention");
    setAttentionScore(0);
    setGameTimer(15);
    setIsPlayingAttention(true);
  };

  useEffect(() => {
    if (!isPlayingAttention) return;
    if (gameTimer <= 0) {
      setIsPlayingAttention(false);
      setShowResults(true);
      return;
    }
    const timer = setInterval(() => {
      setGameTimer((prev) => prev - 1);
      setStarPosition({
        top: `${Math.floor(Math.random() * 70) + 15}%`,
        left: `${Math.floor(Math.random() * 70) + 15}%`,
      });
    }, 1200);

    return () => clearInterval(timer);
  }, [isPlayingAttention, gameTimer]);

  return (
    <Box minH="100vh" bg="bg" color="fg" py="8" px={{ base: "4", md: "8" }}>
      <Container maxW="6xl">
        <Stack gap="8">
          {/* Header & Empathy Banner */}
          <Stack gap="2">
            <HStack gap="2">
              <Text fontSize="2xl" fontWeight="bold">
                {t("games.title")}
              </Text>
              <Badge colorPalette="orange" size="md">
                Pillar 2
              </Badge>
            </HStack>
            <Text fontSize="sm" color="fg.muted">
              {t("games.subtitle")}
            </Text>
          </Stack>

          {/* Mandatory Medical Disclaimer Bar */}
          <Alert.Root status="info" variant="subtle" borderRadius="2xl" p="4">
            <Alert.Indicator />
            <Box>
              <Alert.Title fontSize="xs" fontWeight="bold">
                {t("games.disclaimerTitle")}
              </Alert.Title>
              <Text fontSize="2xs" color="fg.muted">
                {t("games.disclaimer")}
              </Text>
            </Box>
          </Alert.Root>

          {/* Active Game Canvas Area */}
          {activeGame === "attention" && isPlayingAttention && (
            <Box
              h="380px"
              borderRadius="3xl"
              bg="radial-gradient(circle at center, #1e1b4b 0%, #0f172a 100%)"
              position="relative"
              overflow="hidden"
              borderWidth="2px"
              borderColor="indigo.500"
              p="6"
            >
              <Flex justify="space-between" align="center" color="white" mb="4">
                <HStack gap="2">
                  <LuZap color="#f59e0b" />
                  <Text fontWeight="bold" fontSize="sm">
                    {t("games.starlightTitle")}
                  </Text>
                </HStack>
                <HStack gap="3">
                  <Badge colorPalette="yellow" size="sm">
                    {t("games.scoreLabel")} {attentionScore}
                  </Badge>
                  <Badge colorPalette="red" size="sm">
                    {t("games.timeLabel")} {gameTimer}s
                  </Badge>
                  <Button size="2xs" variant="ghost" color="white" onClick={() => setIsPlayingAttention(false)}>
                    {t("games.exit")}
                  </Button>
                </HStack>
              </Flex>

              {/* The Target Star */}
              <Box
                position="absolute"
                top={starPosition.top}
                left={starPosition.left}
                cursor="pointer"
                onClick={() => setAttentionScore((prev) => prev + 1)}
                animation="pulse 1s infinite"
                transition="all 0.3s ease"
              >
                <Flex
                  w="14"
                  h="14"
                  borderRadius="full"
                  bg="linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)"
                  align="center"
                  justify="center"
                  color="slate.900"
                  boxShadow="0 0 25px rgba(245, 158, 11, 0.7)"
                  _hover={{ transform: "scale(1.15)" }}
                >
                  <LuSparkles size={28} />
                </Flex>
              </Box>

              {/* Peripheral Distractor */}
              <Box
                position="absolute"
                bottom="20%"
                right="25%"
                opacity={0.3}
                pointerEvents="none"
              >
                <Text fontSize="xs" color="gray.400">
                  {t("games.distractorText")}
                </Text>
              </Box>
            </Box>
          )}

          {/* Game Selection Cards Grid */}
          {!isPlayingAttention && (
            <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap="6">
              {/* Game 1: Attention & Activity */}
              <Box
                p="6"
                borderRadius="3xl"
                bg="bg.panel"
                borderWidth="1px"
                borderColor="border.subtle"
                _hover={{ borderColor: "orange.500", transform: "translateY(-2px)" }}
                transition="all 0.2s"
              >
                <Stack gap="4">
                  <Flex
                    w="12"
                    h="12"
                    borderRadius="2xl"
                    bg="orange.subtle"
                    color="orange.solid"
                    align="center"
                    justify="center"
                  >
                    <LuZap size={24} />
                  </Flex>
                  <Stack gap="1">
                    <HStack justify="space-between">
                      <Text fontWeight="bold" fontSize="md">
                        {t("games.game1Title")}
                      </Text>
                      <Badge colorPalette="orange" size="xs">
                        {t("games.game1Tag")}
                      </Badge>
                    </HStack>
                    <Text fontSize="xs" color="fg.muted">
                      {t("games.game1Desc")}
                    </Text>
                  </Stack>

                  <HStack justify="space-between" pt="2" borderTopWidth="1px" borderColor="border.subtle">
                    <Text fontSize="xs" fontWeight="semibold" color="orange.600">
                      7/10 {t("games.indicativeScore")}
                    </Text>
                    <Button
                      size="sm"
                      bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                      color="white"
                      borderRadius="xl"
                      onClick={startAttentionGame}
                    >
                      <HStack gap="1.5">
                        <LuPlay size={14} />
                        <Text>{t("games.play")}</Text>
                      </HStack>
                    </Button>
                  </HStack>
                </Stack>
              </Box>

              {/* Game 2: Mood & Emotion */}
              <Box
                p="6"
                borderRadius="3xl"
                bg="bg.panel"
                borderWidth="1px"
                borderColor="border.subtle"
                _hover={{ borderColor: "indigo.500", transform: "translateY(-2px)" }}
                transition="all 0.2s"
              >
                <Stack gap="4">
                  <Flex
                    w="12"
                    h="12"
                    borderRadius="2xl"
                    bg="indigo.subtle"
                    color="indigo.solid"
                    align="center"
                    justify="center"
                  >
                    <LuCloudRain size={24} />
                  </Flex>
                  <Stack gap="1">
                    <HStack justify="space-between">
                      <Text fontWeight="bold" fontSize="md">
                        {t("games.game2Title")}
                      </Text>
                      <Badge colorPalette="indigo" size="xs">
                        {t("games.game2Tag")}
                      </Badge>
                    </HStack>
                    <Text fontSize="xs" color="fg.muted">
                      {t("games.game2Desc")}
                    </Text>
                  </Stack>

                  <HStack justify="space-between" pt="2" borderTopWidth="1px" borderColor="border.subtle">
                    <Text fontSize="xs" fontWeight="semibold" color="indigo.600">
                      6/10 {t("games.indicativeScore")}
                    </Text>
                    <Button
                      size="sm"
                      variant="outline"
                      colorPalette="indigo"
                      borderRadius="xl"
                      onClick={() => setShowResults(true)}
                    >
                      <HStack gap="1.5">
                        <LuPlay size={14} />
                        <Text>{t("games.explore")}</Text>
                      </HStack>
                    </Button>
                  </HStack>
                </Stack>
              </Box>

              {/* Game 3: Pattern & Behavior */}
              <Box
                p="6"
                borderRadius="3xl"
                bg="bg.panel"
                borderWidth="1px"
                borderColor="border.subtle"
                _hover={{ borderColor: "teal.500", transform: "translateY(-2px)" }}
                transition="all 0.2s"
              >
                <Stack gap="4">
                  <Flex
                    w="12"
                    h="12"
                    borderRadius="2xl"
                    bg="teal.subtle"
                    color="teal.solid"
                    align="center"
                    justify="center"
                  >
                    <LuGrid2X2 size={24} />
                  </Flex>
                  <Stack gap="1">
                    <HStack justify="space-between">
                      <Text fontWeight="bold" fontSize="md">
                        {t("games.game3Title")}
                      </Text>
                      <Badge colorPalette="teal" size="xs">
                        {t("games.game3Tag")}
                      </Badge>
                    </HStack>
                    <Text fontSize="xs" color="fg.muted">
                      {t("games.game3Desc")}
                    </Text>
                  </Stack>

                  <HStack justify="space-between" pt="2" borderTopWidth="1px" borderColor="border.subtle">
                    <Text fontSize="xs" fontWeight="semibold" color="teal.600">
                      3/10 {t("games.indicativeScore")}
                    </Text>
                    <Button
                      size="sm"
                      variant="outline"
                      colorPalette="teal"
                      borderRadius="xl"
                      onClick={() => setShowResults(true)}
                    >
                      <HStack gap="1.5">
                        <LuPlay size={14} />
                        <Text>{t("games.explore")}</Text>
                      </HStack>
                    </Button>
                  </HStack>
                </Stack>
              </Box>
            </Grid>
          )}

          {/* Gamified Screening Results & Indicative Scorecard */}
          {showResults && (
            <Box
              p="8"
              borderRadius="3xl"
              bg="bg.panel"
              borderWidth="1px"
              borderColor="orange.500/30"
              boxShadow="0 15px 40px -10px rgba(234, 88, 12, 0.15)"
            >
              <Stack gap="6">
                <Flex
                  direction={{ base: "column", sm: "row" }}
                  justify="space-between"
                  align={{ base: "start", sm: "center" }}
                  gap="3"
                >
                  <HStack gap="2">
                    <LuBrain size={22} color="#ea580c" />
                    <Text fontSize="lg" fontWeight="bold">
                      {t("games.scorecardTitle")}
                    </Text>
                  </HStack>
                  <Badge colorPalette="green" size="md">
                    {t("games.attachedDossier")}
                  </Badge>
                </Flex>

                {/* The 3 Indicative Likelihood Score Gauges */}
                <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap="4">
                  {/* Score 1 */}
                  <Box p="4" borderRadius="2xl" bg="bg.subtle" borderWidth="1px" borderColor="border.subtle">
                    <Text fontSize="xs" color="fg.muted" mb="1">
                      {t("games.scoreAdhdTitle")}
                    </Text>
                    <Text fontSize="2xl" fontWeight="black" color="orange.600">
                      7/10
                    </Text>
                    <Text fontSize="2xs" color="fg.muted" mt="1">
                      {t("games.scoreAdhdDesc")}
                    </Text>
                  </Box>

                  {/* Score 2 */}
                  <Box p="4" borderRadius="2xl" bg="bg.subtle" borderWidth="1px" borderColor="border.subtle">
                    <Text fontSize="xs" color="fg.muted" mb="1">
                      {t("games.scoreMoodTitle")}
                    </Text>
                    <Text fontSize="2xl" fontWeight="black" color="indigo.600">
                      6/10
                    </Text>
                    <Text fontSize="2xs" color="fg.muted" mt="1">
                      {t("games.scoreMoodDesc")}
                    </Text>
                  </Box>

                  {/* Score 3 */}
                  <Box p="4" borderRadius="2xl" bg="bg.subtle" borderWidth="1px" borderColor="border.subtle">
                    <Text fontSize="xs" color="fg.muted" mb="1">
                      {t("games.scoreOcdTitle")}
                    </Text>
                    <Text fontSize="2xl" fontWeight="black" color="teal.600">
                      3/10
                    </Text>
                    <Text fontSize="2xs" color="fg.muted" mt="1">
                      {t("games.scoreOcdDesc")}
                    </Text>
                  </Box>
                </Grid>

                {/* Consent & Actions */}
                <Flex
                  direction={{ base: "column", md: "row" }}
                  justify="space-between"
                  align={{ base: "start", md: "center" }}
                  pt="4"
                  borderTopWidth="1px"
                  borderColor="border.subtle"
                  gap="4"
                >
                  <HStack gap="3">
                    <Switch.Root
                      checked={addedToDossier}
                      onCheckedChange={(e) => setAddedToDossier(e.checked)}
                      colorPalette="orange"
                    >
                      <Switch.HiddenInput />
                      <Switch.Control />
                    </Switch.Root>
                    <Text fontSize="xs" fontWeight="semibold">
                      {t("games.addToDossier")}
                    </Text>
                  </HStack>

                  <Button
                    bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                    color="white"
                    borderRadius="xl"
                    onClick={() => navigate("/sessions/therapists")}
                  >
                    <HStack gap="2">
                      <Text>{t("games.findSpecialists")}</Text>
                      <LuArrowRight size={16} />
                    </HStack>
                  </Button>
                </Flex>
              </Stack>
            </Box>
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default MentalDetectorGames;
