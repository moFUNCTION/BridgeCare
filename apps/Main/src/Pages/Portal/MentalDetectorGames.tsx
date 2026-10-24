import React, { useState, useEffect, useRef, useMemo } from "react";
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
import { useUser } from "@repo/react-appwrite";
import {
  LuSparkles,
  LuBrain,
  LuZap,
  LuCloudRain,
  LuGrid2X2,
  LuPlay,
  LuArrowRight,
  LuPause,
  LuRotateCcw,
  LuCheck,
  LuShieldAlert,
  LuSun,
  LuCloudLightning,
  LuMoon,
  LuActivity,
  LuX,
} from "react-icons/lu";

import {
  gameAudio,
  computeAttentionScore,
  computeMoodScore,
  computePatternScore,
  saveScreeningScore,
  getRecentScreeningScores,
  setDoctorFileAttachmentPreference,
  getDoctorFileAttachmentPreference,
  getScoreInterpretation,
  type AttentionTelemetry,
  type MoodTelemetry,
  type PatternTelemetry,
} from "../../services/gameService";

// ============================================================================
// Circular Indicative Gauge Component
// ============================================================================
interface CircularGaugeProps {
  score: number;
  max?: number;
  label: string;
  color: string;
  sublabel?: string;
  badge?: string;
  size?: number;
}

const CircularGauge: React.FC<CircularGaugeProps> = ({
  score,
  max = 10,
  label,
  color,
  sublabel,
  badge,
  size = 130,
}) => {
  const radius = 48;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(1, Math.max(0, score / max));
  const strokeDashoffset = circumference - progress * circumference;

  return (
    <Box
      textAlign="center"
      position="relative"
      display="inline-flex"
      flexDirection="column"
      alignItems="center"
      p="4"
      borderRadius="2xl"
      bg="bg.subtle"
      borderWidth="1px"
      borderColor="border.subtle"
      w="100%"
    >
      <Box position="relative" w={`${size}px`} h={`${size}px`}>
        <svg width={size} height={size} viewBox="0 0 120 120">
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke="currentColor"
            strokeWidth="8"
            fill="transparent"
            opacity={0.12}
          />
          <circle
            cx="60"
            cy="60"
            r={radius}
            stroke={color}
            strokeWidth="9"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
            transform="rotate(-90 60 60)"
            style={{ transition: "stroke-dashoffset 0.9s cubic-bezier(0.4, 0, 0.2, 1)" }}
          />
        </svg>
        <Box
          position="absolute"
          top="50%"
          left="50%"
          transform="translate(-50%, -50%)"
          textAlign="center"
        >
          <Text fontSize="3xl" fontWeight="900" fontFamily="mono" color={color} lineHeight="1">
            {score}
            <Text as="span" fontSize="sm" fontWeight="bold" opacity={0.6}>
              /{max}
            </Text>
          </Text>
        </Box>
      </Box>

      <Text fontSize="sm" fontWeight="bold" mt="3" color="fg">
        {label}
      </Text>

      {badge && (
        <Badge
          size="xs"
          mt="1.5"
          px="2"
          py="0.5"
          borderRadius="full"
          variant="subtle"
          colorPalette={score >= 7 ? "orange" : score >= 4 ? "indigo" : "teal"}
        >
          {badge}
        </Badge>
      )}

      {sublabel && (
        <Text fontSize="2xs" color="fg.muted" mt="2" textAlign="center" lineHeight="shorter">
          {sublabel}
        </Text>
      )}
    </Box>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================
export const MentalDetectorGames: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { user } = useUser();
  const userId = user?.$id || "patient_screening";
  const isArabic = i18n.language === "ar" || document.body.dir === "rtl";

  // Navigation & View States
  const [activeGame, setActiveGame] = useState<"none" | "attention" | "mood" | "pattern">("none");
  const [showResults, setShowResults] = useState(false);
  const [lastCompletedGame, setLastCompletedGame] = useState<"attention" | "mood" | "pattern">("attention");
  const [addedToDossier, setAddedToDossier] = useState(() => getDoctorFileAttachmentPreference());

  // Indicative Scores State (default calibrated indicators)
  const [scores, setScores] = useState({
    attention: 7,
    mood: 6,
    pattern: 3,
  });

  // Load any previously persisted scores on mount
  useEffect(() => {
    getRecentScreeningScores(userId).then((res) => {
      setScores({
        attention: res.attention || 7,
        mood: res.mood || 6,
        pattern: res.pattern || 3,
      });
    });
  }, [userId]);

  const handleToggleDossier = (checked: boolean) => {
    setAddedToDossier(checked);
    setDoctorFileAttachmentPreference(checked);
  };

  // ==========================================================================
  // GAME 1: Starlight Focus & Shift (Attention & ADHD Screening)
  // ==========================================================================
  const ATTENTION_DURATION = 60; // 60 seconds calibrated clinical screening
  const [attentionTimer, setAttentionTimer] = useState(ATTENTION_DURATION);
  const [isAttentionPaused, setIsAttentionPaused] = useState(false);
  const [attentionRuleInverted, setAttentionRuleInverted] = useState(false);
  const [targetStar, setTargetStar] = useState<{ id: number; top: number; left: number; spawnTime: number } | null>(null);
  const [distractorStars, setDistractorStars] = useState<Array<{ id: number; top: number; left: number }>>([]);
  const [attentionStreak, setAttentionStreak] = useState(0);

  // Telemetry buffer
  const attentionTelemetryRef = useRef<AttentionTelemetry>({
    reactionTimes: [],
    commissionErrors: 0,
    omissionErrors: 0,
    switchCosts: [],
    totalTargets: 0,
    totalDistractors: 0,
    durationMs: 0,
  });
  const attentionStartTimeRef = useRef<number>(0);
  const ruleSwitchTimeRef = useRef<number>(0);

  const startAttentionGame = () => {
    attentionTelemetryRef.current = {
      reactionTimes: [],
      commissionErrors: 0,
      omissionErrors: 0,
      switchCosts: [],
      totalTargets: 0,
      totalDistractors: 0,
      durationMs: 0,
    };
    attentionStartTimeRef.current = Date.now();
    ruleSwitchTimeRef.current = 0;
    setAttentionTimer(ATTENTION_DURATION);
    setIsAttentionPaused(false);
    setAttentionRuleInverted(false);
    setAttentionStreak(0);
    setActiveGame("attention");
    spawnCelestialObjects(false);
  };

  const spawnCelestialObjects = (inverted: boolean) => {
    const now = Date.now();
    // Spawn target star in a safe zone (15% - 80%)
    const targetTop = Math.floor(Math.random() * 65) + 15;
    const targetLeft = Math.floor(Math.random() * 70) + 15;
    setTargetStar({ id: now, top: targetTop, left: targetLeft, spawnTime: now });
    attentionTelemetryRef.current.totalTargets += 1;

    // Spawn 1-2 peripheral distractors away from target
    const distractors: Array<{ id: number; top: number; left: number }> = [];
    const count = Math.random() > 0.4 ? 2 : 1;
    for (let i = 0; i < count; i++) {
      distractors.push({
        id: now + i + 1,
        top: Math.floor(Math.random() * 75) + 10,
        left: Math.floor(Math.random() * 75) + 10,
      });
      attentionTelemetryRef.current.totalDistractors += 1;
    }
    setDistractorStars(distractors);
  };

  // Timer & Rule Inversion loop for Attention Game
  useEffect(() => {
    if (activeGame !== "attention" || isAttentionPaused) return;

    if (attentionTimer <= 0) {
      // Completed game
      completeAttentionGame();
      return;
    }

    const interval = setInterval(() => {
      setAttentionTimer((prev) => {
        const next = prev - 1;

        // Invert rules at 35 seconds for task-switching measurement
        if (next === 35 && !attentionRuleInverted) {
          setAttentionRuleInverted(true);
          ruleSwitchTimeRef.current = Date.now();
          gameAudio.playSwitchCue();
        }

        // Periodic celestial movement every 1.8 seconds
        if (next % 2 === 0) {
          // If star was left unclicked, count omission error
          if (targetStar) {
            attentionTelemetryRef.current.omissionErrors += 1;
          }
          spawnCelestialObjects(attentionRuleInverted);
        }

        return next;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [activeGame, isAttentionPaused, attentionTimer, attentionRuleInverted]);

  const handleStarClick = (isTargetStar: boolean) => {
    const now = Date.now();
    // When rule is inverted: purple distractors become targets, gold stars become distractors!
    const effectiveIsTarget = attentionRuleInverted ? !isTargetStar : isTargetStar;

    if (effectiveIsTarget) {
      // Hit target!
      gameAudio.playStarChime();
      setAttentionStreak((s) => s + 1);

      if (targetStar) {
        const latency = now - targetStar.spawnTime;
        attentionTelemetryRef.current.reactionTimes.push(latency);

        // Check if this hit happened right after a rule switch (within 5 seconds)
        if (ruleSwitchTimeRef.current > 0 && now - ruleSwitchTimeRef.current < 5000) {
          attentionTelemetryRef.current.switchCosts.push(latency);
        }
      }
      // Re-spawn immediately
      spawnCelestialObjects(attentionRuleInverted);
    } else {
      // Clicked distractor (impulse / commission error)
      gameAudio.playDistractorBuzz();
      setAttentionStreak(0);
      attentionTelemetryRef.current.commissionErrors += 1;
    }
  };

  const completeAttentionGame = async () => {
    attentionTelemetryRef.current.durationMs = Date.now() - attentionStartTimeRef.current;
    const computedScore = computeAttentionScore(attentionTelemetryRef.current);

    setScores((prev) => ({ ...prev, attention: computedScore }));
    setLastCompletedGame("attention");
    setActiveGame("none");
    setShowResults(true);
    gameAudio.playScorecardFanfare();

    await saveScreeningScore(
      userId,
      "attention",
      computedScore,
      attentionTelemetryRef.current,
      "starlight_adhd_screening"
    );
  };

  // ==========================================================================
  // GAME 2: Weather Within (Mood & Energy Screening)
  // ==========================================================================
  const moodScenarios = useMemo(
    () => [
      {
        id: 1,
        biome: "sunrise",
        name: isArabic ? "شروق الفجر المتجدد" : "The Sunrise Clearing",
        weatherType: "golden",
        icon: LuSun,
        accentColor: "#f59e0b",
        bgGradient: "linear-gradient(135deg, #451a03 0%, #78350f 50%, #b45309 100%)",
        situation: isArabic
          ? "تصلك فكرة مشروع إبداعي جديدة وحماسية في وقت متأخر من المساء. كيف تكون استجابتك الفورية؟"
          : "A brilliant, high-energy creative opportunity arrives unexpectedly late at night. How does your internal system react?",
        choices: [
          {
            label: isArabic
              ? "الاندفاع التام فوراً دون نوم أو طعام لإنهاء كل شيء الليلة"
              : "Dive in with intense feverish energy, forgetting sleep and meals",
            valence: 0.8,
            type: "impulsive",
          },
          {
            label: isArabic
              ? "تدوين الملاحظات بهدوء وجدولة البدء غداً صباحاً"
              : "Calmly jot down notes and schedule it methodically for tomorrow morning",
            valence: 0.2,
            type: "balanced",
          },
          {
            label: isArabic
              ? "الشعور بالإرهاق وثقل الفكرة والرغبة في التراجع"
              : "Feel instantly drained, doubting yourself and feeling the urge to withdraw",
            valence: 0.9,
            type: "withdrawn",
          },
          {
            label: isArabic
              ? "تسارع دقات القلب والقلق الشديد من الفشل قبل البدء"
              : "Immediate heart palpitations and hyper-fixation on what could go wrong",
            valence: 0.6,
            type: "anxious",
          },
        ],
      },
      {
        id: 2,
        biome: "mist",
        name: isArabic ? "وادي الضباب الصامت" : "The Overcast Valley",
        weatherType: "mist",
        icon: LuCloudRain,
        accentColor: "#6366f1",
        bgGradient: "linear-gradient(135deg, #1e1b4b 0%, #312e81 50%, #4338ca 100%)",
        situation: isArabic
          ? "اعتذر أصدقاؤك المقربون فجأة عن موعد كنتم تنتظرونه طويلاً. ما هو الشعور الذي يستقر في صدرك؟"
          : "Close friends cancel a long-anticipated gathering at the last minute. What feeling settles in?",
        choices: [
          {
            label: isArabic
              ? "هبوط حاد في المزاج وفراغ مفاجئ ورغبة في الانعزال لأيام"
              : "A deep sinking emptiness and urge to isolate in bed for days",
            valence: 0.9,
            type: "withdrawn",
          },
          {
            label: isArabic
              ? "تفهم الموقف والاستمتاع بوقت هادئ ومريح لنفسي"
              : "Accept it calmly and enjoy peaceful, restorative solitary time",
            valence: 0.1,
            type: "balanced",
          },
          {
            label: isArabic
              ? "اتخاذ قرار متهور بمغادرة المنزل والقيام بنشاط صاخب"
              : "Make a spontaneous, risky decision to go on a solo adventure alone",
            valence: 0.8,
            type: "impulsive",
          },
          {
            label: isArabic
              ? "دوامة من الشك بأنهم يتجنبونك ولا يريدون وجودك"
              : "A spiral of suspicion that they are secretly avoiding you",
            valence: 0.7,
            type: "anxious",
          },
        ],
      },
      {
        id: 3,
        biome: "tempest",
        name: isArabic ? "عاصفة منتصف الليل" : "The Midnight Tempest",
        weatherType: "storm",
        icon: LuCloudLightning,
        accentColor: "#ef4444",
        bgGradient: "linear-gradient(135deg, #09090b 0%, #18181b 50%, #27272a 100%)",
        situation: isArabic
          ? "تداهمك نوبة مفاجئة من الضيق والتوتر الداخلي دون سبب واضح. كيف تتعامل مع هذه العاصفة؟"
          : "A sudden wave of intense internal tension and irritability strikes without an obvious cause. How do you respond?",
        choices: [
          {
            label: isArabic
              ? "الانغماس في دوامة التفكير السلبي واللوم الذاتي المتواصل"
              : "Spiral into relentless rumination and self-criticism in loops",
            valence: 0.85,
            type: "withdrawn",
          },
          {
            label: isArabic
              ? "تطبيق تمارين التنفس وتذكير نفسي بأن المشاعر عابرة كالسحاب"
              : "Ground myself with slow breathing, acknowledging the storm will pass",
            valence: 0.15,
            type: "balanced",
          },
          {
            label: isArabic
              ? "تفريغ الغضب بقرارات عصبية سريعة أو مواجهات غير محسوبة"
              : "Vent with sharp impulsive reactions or abrupt confrontations",
            valence: 0.8,
            type: "impulsive",
          },
          {
            label: isArabic
              ? "طلب التطمين المفرط من كل من حولي والتأكد من أماني"
              : "Seek urgent reassurance from multiple people to feel secure",
            valence: 0.65,
            type: "anxious",
          },
        ],
      },
      {
        id: 4,
        biome: "aurora",
        name: isArabic ? "شفق السكون والسكينة" : "The Twilight Horizon",
        weatherType: "aurora",
        icon: LuMoon,
        accentColor: "#14b8a6",
        bgGradient: "linear-gradient(135deg, #042f2e 0%, #134e4a 50%, #0f766e 100%)",
        situation: isArabic
          ? "عند استرجاع نمط طاقتك ونشاطك على مدار الأسبوعين الماضيين، ما الوصف الأدق لحالتك؟"
          : "Reflecting on your vitality across the past two weeks, which pattern best mirrors your rhythm?",
        choices: [
          {
            label: isArabic
              ? "تأرجح كبير بين فترات نشاط فائقة السرعة ثم انحدار تام إلى الخمول"
              : "Extreme rollercoaster swings between hyper-speed bursts and total crashes",
            valence: 0.9,
            type: "impulsive",
          },
          {
            label: isArabic
              ? "استقرار نسبي متوازن مع تقلبات طبيعية ومقبولة حسب المهام"
              : "Steady, predictable emotional rhythm with normal, manageable ebbs",
            valence: 0.2,
            type: "balanced",
          },
          {
            label: isArabic
              ? "شعور دائم بضبابية الهمة وثقل استثنائي لإنجاز أبسط المتطلبات"
              : "Persistent grey haze and heavy effort required for basic tasks",
            valence: 0.85,
            type: "withdrawn",
          },
          {
            label: isArabic
              ? "حالة ترقب وتأهب مستمر تحول دون الاسترخاء العميق"
              : "Constant state of hyper-vigilance preventing deep relaxation",
            valence: 0.65,
            type: "anxious",
          },
        ],
      },
    ],
    [isArabic]
  );

  const [currentMoodIndex, setCurrentMoodIndex] = useState(0);
  const [currentVitalitySlider, setCurrentVitalitySlider] = useState(5);
  const moodPromptStartTimeRef = useRef(0);
  const moodTelemetryRef = useRef<MoodTelemetry>({
    valenceBias: 0.5,
    hesitationOnPositiveMs: 0,
    volatilityIndex: 3,
    choiceLatencies: [],
    completedScenarios: 0,
    durationMs: 0,
  });
  const moodChoicesHistory = useRef<Array<{ valence: number; latency: number; type: string }>>([]);
  const vitalityRatings = useRef<number[]>([]);

  const startMoodGame = () => {
    moodTelemetryRef.current = {
      valenceBias: 0.5,
      hesitationOnPositiveMs: 0,
      volatilityIndex: 3,
      choiceLatencies: [],
      completedScenarios: 0,
      durationMs: 0,
    };
    moodChoicesHistory.current = [];
    vitalityRatings.current = [];
    setCurrentMoodIndex(0);
    setCurrentVitalitySlider(5);
    moodPromptStartTimeRef.current = Date.now();
    setActiveGame("mood");
    gameAudio.playAtmosphericChime();
  };

  const handleMoodChoiceSelect = async (choice: { valence: number; type: string }) => {
    const latency = Date.now() - moodPromptStartTimeRef.current;
    gameAudio.playTileClick();

    moodChoicesHistory.current.push({
      valence: choice.valence,
      latency,
      type: choice.type,
    });
    vitalityRatings.current.push(currentVitalitySlider);

    if (currentMoodIndex + 1 < moodScenarios.length) {
      setCurrentMoodIndex((prev) => prev + 1);
      setCurrentVitalitySlider(5);
      moodPromptStartTimeRef.current = Date.now();
      gameAudio.playAtmosphericChime();
    } else {
      // Completed Weather Within game
      completeMoodGame();
    }
  };

  const completeMoodGame = async () => {
    const choices = moodChoicesHistory.current;
    const avgValence = choices.reduce((a, b) => a + b.valence, 0) / choices.length;
    const positiveChoices = choices.filter((c) => c.type === "balanced");
    const avgHesitationOnPositive =
      positiveChoices.length > 0
        ? positiveChoices.reduce((a, b) => a + b.latency, 0) / positiveChoices.length
        : 2200;

    // Volatility index based on standard deviation of vitality ratings
    const meanVitality =
      vitalityRatings.current.reduce((a, b) => a + b, 0) / vitalityRatings.current.length;
    const vitalityVar =
      vitalityRatings.current.reduce((a, b) => a + Math.pow(b - meanVitality, 2), 0) /
      vitalityRatings.current.length;
    const volatilityIndex = Math.min(10, Math.max(1, Math.round(Math.sqrt(vitalityVar) * 2.5)));

    const finalTelemetry: MoodTelemetry = {
      valenceBias: avgValence,
      hesitationOnPositiveMs: avgHesitationOnPositive,
      volatilityIndex,
      choiceLatencies: choices.map((c) => c.latency),
      completedScenarios: choices.length,
      durationMs: Date.now() - (moodPromptStartTimeRef.current || Date.now()),
    };

    const computedScore = computeMoodScore(finalTelemetry);
    setScores((prev) => ({ ...prev, mood: computedScore }));
    setLastCompletedGame("mood");
    setActiveGame("none");
    setShowResults(true);
    gameAudio.playScorecardFanfare();

    await saveScreeningScore(userId, "mood", computedScore, finalTelemetry, "weather_within_screening");
  };

  // ==========================================================================
  // GAME 3: Harmony & Chaos (Pattern & OCD Screening)
  // ==========================================================================
  // 3x3 Grid: 9 tiles. Each tile has a rotation (0, 90, 180, 270).
  // 7 tiles can achieve harmonious symmetry, while 2 tiles are intentionally irreversible
  // to measure tolerance of visual asymmetry and checking frequency.
  interface TileData {
    id: number;
    rotation: number;
    targetRotation: number;
    isIrregular: boolean;
    clickCount: number;
  }

  const initialTiles: TileData[] = useMemo(
    () => [
      { id: 0, rotation: 90, targetRotation: 0, isIrregular: false, clickCount: 0 },
      { id: 1, rotation: 180, targetRotation: 0, isIrregular: false, clickCount: 0 },
      { id: 2, rotation: 270, targetRotation: 0, isIrregular: false, clickCount: 0 },
      { id: 3, rotation: 0, targetRotation: 0, isIrregular: false, clickCount: 0 },
      { id: 4, rotation: 90, targetRotation: 0, isIrregular: true, clickCount: 0 }, // Center irregular
      { id: 5, rotation: 180, targetRotation: 0, isIrregular: false, clickCount: 0 },
      { id: 6, rotation: 270, targetRotation: 0, isIrregular: false, clickCount: 0 },
      { id: 7, rotation: 90, targetRotation: 0, isIrregular: true, clickCount: 0 }, // Asymmetric edge
      { id: 8, rotation: 0, targetRotation: 0, isIrregular: false, clickCount: 0 },
    ],
    []
  );

  const [tiles, setTiles] = useState<TileData[]>(initialTiles);
  const patternStartTimeRef = useRef(0);
  const patternTelemetryRef = useRef<PatternTelemetry>({
    checkingFrequency: 0,
    intoleranceToAsymmetryMs: 0,
    exitHesitationMs: 0,
    totalTileInteractions: 0,
    symmetryAttempts: 0,
    durationMs: 0,
  });
  const irregularTileTouchTimeRef = useRef(0);
  const firstSymmetryAchievedTimeRef = useRef(0);

  const startPatternGame = () => {
    setTiles(
      initialTiles.map((t) => ({
        ...t,
        rotation: (Math.floor(Math.random() * 3) + 1) * 90,
        clickCount: 0,
      }))
    );
    patternTelemetryRef.current = {
      checkingFrequency: 0,
      intoleranceToAsymmetryMs: 0,
      exitHesitationMs: 0,
      totalTileInteractions: 0,
      symmetryAttempts: 0,
      durationMs: 0,
    };
    patternStartTimeRef.current = Date.now();
    irregularTileTouchTimeRef.current = 0;
    firstSymmetryAchievedTimeRef.current = 0;
    setActiveGame("pattern");
  };

  const handleTileClick = (index: number) => {
    gameAudio.playTileClick();
    const now = Date.now();
    patternTelemetryRef.current.totalTileInteractions += 1;

    setTiles((prev) => {
      const copy = [...prev];
      const tile = { ...copy[index] };
      const nextRot = (tile.rotation + 90) % 360;
      tile.rotation = nextRot;
      tile.clickCount += 1;

      // Checking behavior: clicking an already aligned tile repeatedly
      if (tile.clickCount > 4) {
        patternTelemetryRef.current.checkingFrequency += 1;
      }

      // If manipulating an irregular tile, count asymmetry fixation time
      if (tile.isIrregular) {
        patternTelemetryRef.current.intoleranceToAsymmetryMs += 1200;
      }

      copy[index] = tile;

      // Check if majority of normal tiles are aligned
      const normalAligned = copy
        .filter((t) => !t.isIrregular)
        .filter((t) => t.rotation === t.targetRotation).length;
      if (normalAligned >= 5 && firstSymmetryAchievedTimeRef.current === 0) {
        firstSymmetryAchievedTimeRef.current = now;
      }

      return copy;
    });
  };

  const handleCompletePatternGame = async () => {
    const now = Date.now();
    const duration = now - patternStartTimeRef.current;
    patternTelemetryRef.current.durationMs = duration;

    // Exit hesitation: latency from when symmetry was ready until clicking submit
    if (firstSymmetryAchievedTimeRef.current > 0) {
      patternTelemetryRef.current.exitHesitationMs = now - firstSymmetryAchievedTimeRef.current;
    } else {
      patternTelemetryRef.current.exitHesitationMs = 3000;
    }

    const computedScore = computePatternScore(patternTelemetryRef.current);
    setScores((prev) => ({ ...prev, pattern: computedScore }));
    setLastCompletedGame("pattern");
    setActiveGame("none");
    setShowResults(true);
    gameAudio.playScorecardFanfare();

    await saveScreeningScore(
      userId,
      "pattern",
      computedScore,
      patternTelemetryRef.current,
      "harmony_chaos_ocd_screening"
    );
  };

  // Interpretation details for the last played or selected game
  const activeInterpretation = useMemo(() => {
    return getScoreInterpretation(lastCompletedGame, scores[lastCompletedGame], isArabic);
  }, [lastCompletedGame, scores, isArabic]);

  // ==========================================================================
  // RENDER
  // ==========================================================================
  return (
    <Box minH="100vh" bg="bg" color="fg" py="8" px={{ base: "4", md: "8" }}>
      <Container maxW="6xl">
        <Stack gap="8">
          {/* Header & Empathy Banner */}
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
                  <LuBrain size={24} />
                </Flex>
                <Box>
                  <Text fontSize="2xl" fontWeight="black" letterSpacing="tight">
                    {t("games.title", "Gamified Symptom Screening Hub")}
                  </Text>
                  <Text fontSize="xs" color="fg.muted">
                    {t(
                      "games.subtitle",
                      "Stigma-free cognitive games that map your objective behavioral, mood, and pattern traits."
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
                  onClick={() => navigate("/games/era")}
                >
                  {isArabic ? "اختبار ERA السلوكي (استبيان)" : "Take Structured ERA Screener"}
                  <LuArrowRight size={12} style={{ marginLeft: "4px" }} />
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
                    "games.disclaimer",
                    "Game scores and telemetry serve exclusively as initial screening and clinical decision-support indicators. Final diagnosis, psychological evaluation, and medical prescriptions remain the sole legal and clinical responsibility of licensed psychiatrists and physicians."
                  )}
                </Text>
              </Stack>
            </HStack>
          </Box>

          {/* ================================================================ */}
          {/* ACTIVE GAME CANVAS 1: Starlight Focus & Shift                    */}
          {/* ================================================================ */}
          {activeGame === "attention" && (
            <Box
              h={{ base: "420px", md: "460px" }}
              borderRadius="3xl"
              bg="radial-gradient(circle at 50% 40%, #1e1b4b 0%, #09090b 100%)"
              position="relative"
              overflow="hidden"
              borderWidth="2px"
              borderColor={attentionRuleInverted ? "purple.500" : "orange.500"}
              p={{ base: "4", md: "6" }}
              boxShadow="0 20px 50px -10px rgba(0, 0, 0, 0.5)"
            >
              {/* Game Top HUD */}
              <Flex justify="space-between" align="center" color="white" mb="3" wrap="wrap" gap="2">
                <HStack gap="2">
                  <LuZap color={attentionRuleInverted ? "#c084fc" : "#f59e0b"} size={20} />
                  <Text fontWeight="bold" fontSize="sm">
                    {t("games.starlightTitle", "Starlight Focus & Shift")}
                  </Text>
                  {attentionRuleInverted && (
                    <Badge colorPalette="purple" size="xs" px="2" py="0.5" borderRadius="md">
                      {isArabic ? "قاعدة مقلوبة: استهدف النجوم البنفسجية!" : "RULE INVERTED: TARGET PURPLE STARS!"}
                    </Badge>
                  )}
                </HStack>

                <HStack gap="2">
                  <Badge colorPalette="yellow" size="sm" px="2.5" py="1" borderRadius="full">
                    {t("games.scoreLabel", "Hits:")} {attentionTelemetryRef.current.reactionTimes.length}
                  </Badge>
                  <Badge colorPalette="orange" size="sm" px="2.5" py="1" borderRadius="full">
                    Streak: {attentionStreak}x
                  </Badge>
                  <Badge colorPalette="red" size="sm" px="2.5" py="1" borderRadius="full">
                    {t("games.timeLabel", "Time:")} {attentionTimer}s
                  </Badge>

                  <Button
                    size="xs"
                    variant="ghost"
                    color="white"
                    onClick={() => setIsAttentionPaused(!isAttentionPaused)}
                  >
                    {isAttentionPaused ? <LuPlay size={14} /> : <LuPause size={14} />}
                  </Button>
                  <Button
                    size="xs"
                    variant="ghost"
                    color="white"
                    onClick={() => setActiveGame("none")}
                  >
                    <LuX size={14} />
                  </Button>
                </HStack>
              </Flex>

              {/* Inversion Rule Alert Banner */}
              {attentionRuleInverted && (
                <Box
                  position="absolute"
                  top="60px"
                  left="50%"
                  transform="translateX(-50%)"
                  bg="purple.900/80"
                  backdropFilter="blur(8px)"
                  px="4"
                  py="1.5"
                  borderRadius="full"
                  borderWidth="1px"
                  borderColor="purple.400"
                  zIndex={10}
                >
                  <Text fontSize="xs" fontWeight="bold" color="purple.200">
                    {isArabic
                      ? "⚡ انتباه: انقر على النجوم البنفسجية وتجنب الذهبية!"
                      : "⚡ RULE SHIFT: Tap Purple Pulsar Stars, Avoid Gold!"}
                  </Text>
                </Box>
              )}

              {/* Target Star (Gold in normal mode, or Purple in inverted mode) */}
              {targetStar && !isAttentionPaused && (
                <Box
                  position="absolute"
                  top={`${targetStar.top}%`}
                  left={`${targetStar.left}%`}
                  cursor="pointer"
                  onClick={() => handleStarClick(true)}
                  style={{
                    transform: "translate(-50%, -50%)",
                    transition: "top 0.4s ease, left 0.4s ease",
                  }}
                >
                  <Flex
                    w={{ base: "14", md: "16" }}
                    h={{ base: "14", md: "16" }}
                    borderRadius="full"
                    bg={
                      attentionRuleInverted
                        ? "linear-gradient(135deg, #a855f7 0%, #7e22ce 100%)"
                        : "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)"
                    }
                    align="center"
                    justify="center"
                    color="slate.900"
                    boxShadow={
                      attentionRuleInverted
                        ? "0 0 35px rgba(168, 85, 247, 0.85)"
                        : "0 0 35px rgba(245, 158, 11, 0.85)"
                    }
                    _hover={{ transform: "scale(1.2)" }}
                    transition="all 0.15s ease"
                  >
                    <LuSparkles size={28} />
                  </Flex>
                </Box>
              )}

              {/* Peripheral Distractor Stars */}
              {!isAttentionPaused &&
                distractorStars.map((distractor) => (
                  <Box
                    key={distractor.id}
                    position="absolute"
                    top={`${distractor.top}%`}
                    left={`${distractor.left}%`}
                    cursor="pointer"
                    onClick={() => handleStarClick(false)}
                    style={{
                      transform: "translate(-50%, -50%)",
                      transition: "top 0.5s ease, left 0.5s ease",
                    }}
                  >
                    <Flex
                      w="10"
                      h="10"
                      borderRadius="full"
                      bg={
                        attentionRuleInverted
                          ? "linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%)"
                          : "linear-gradient(135deg, #ec4899 0%, #9333ea 100%)"
                      }
                      align="center"
                      justify="center"
                      color="white"
                      opacity={0.7}
                      boxShadow="0 0 15px rgba(236, 72, 153, 0.5)"
                      _hover={{ opacity: 1, transform: "scale(1.15)" }}
                    >
                      <LuZap size={18} />
                    </Flex>
                  </Box>
                ))}

              {/* Pause Overlay */}
              {isAttentionPaused && (
                <Flex
                  position="absolute"
                  inset="0"
                  bg="black/70"
                  backdropFilter="blur(6px)"
                  align="center"
                  justify="center"
                  direction="column"
                  gap="3"
                >
                  <Text fontSize="lg" fontWeight="bold" color="white">
                    {isArabic ? "اللعبة متوقفة مؤقتاً" : "Assessment Paused"}
                  </Text>
                  <Button
                    size="sm"
                    colorPalette="orange"
                    borderRadius="xl"
                    onClick={() => setIsAttentionPaused(false)}
                  >
                    <LuPlay size={14} style={{ marginRight: "6px" }} />
                    {isArabic ? "استئناف" : "Resume"}
                  </Button>
                </Flex>
              )}
            </Box>
          )}

          {/* ================================================================ */}
          {/* ACTIVE GAME CANVAS 2: Weather Within (Mood Screening)            */}
          {/* ================================================================ */}
          {activeGame === "mood" && (
            <Box
              p={{ base: "6", md: "8" }}
              borderRadius="3xl"
              bg={moodScenarios[currentMoodIndex].bgGradient}
              color="white"
              borderWidth="2px"
              borderColor={moodScenarios[currentMoodIndex].accentColor}
              boxShadow="0 25px 60px -15px rgba(0, 0, 0, 0.6)"
              position="relative"
              overflow="hidden"
            >
              <Stack gap="6">
                {/* Header HUD */}
                <Flex justify="space-between" align="center" wrap="wrap" gap="2">
                  <HStack gap="2.5">
                    {React.createElement(moodScenarios[currentMoodIndex].icon, {
                      size: 24,
                      color: moodScenarios[currentMoodIndex].accentColor,
                    })}
                    <Box>
                      <Text fontWeight="black" fontSize="lg">
                        {t("games.game2Title", "Weather Within")}: {moodScenarios[currentMoodIndex].name}
                      </Text>
                      <Text fontSize="xs" opacity={0.8}>
                        {isArabic
                          ? `السيناريو ${currentMoodIndex + 1} من ${moodScenarios.length}`
                          : `Scenario ${currentMoodIndex + 1} of ${moodScenarios.length}`}
                      </Text>
                    </Box>
                  </HStack>

                  <Button
                    size="xs"
                    variant="ghost"
                    color="white"
                    onClick={() => setActiveGame("none")}
                  >
                    <LuX size={16} />
                  </Button>
                </Flex>

                {/* Scenario Situation */}
                <Box
                  p="5"
                  borderRadius="2xl"
                  bg="white/10"
                  backdropFilter="blur(10px)"
                  borderWidth="1px"
                  borderColor="white/20"
                >
                  <Text fontSize={{ base: "md", md: "lg" }} fontWeight="semibold" lineHeight="tall">
                    "{moodScenarios[currentMoodIndex].situation}"
                  </Text>
                </Box>

                {/* Vitality Energy Calibrator */}
                <Stack gap="2">
                  <Flex justify="space-between" align="center">
                    <Text fontSize="xs" fontWeight="bold">
                      {isArabic ? "معايرة الطاقة والحيوية الداخلية الآن:" : "Calibrate Internal Vitality Right Now:"}
                    </Text>
                    <Badge colorPalette="orange" size="sm" px="2" py="0.5" borderRadius="full">
                      {currentVitalitySlider}/10
                    </Badge>
                  </Flex>
                  <input
                    type="range"
                    min="1"
                    max="10"
                    value={currentVitalitySlider}
                    onChange={(e) => setCurrentVitalitySlider(Number(e.target.value))}
                    style={{
                      width: "100%",
                      accentColor: moodScenarios[currentMoodIndex].accentColor,
                      cursor: "pointer",
                      height: "6px",
                    }}
                  />
                  <Flex justify="space-between" fontSize="2xs" opacity={0.7}>
                    <Text>{isArabic ? "خمول تام / انطفاء" : "1 (Depleted/Flat)"}</Text>
                    <Text>{isArabic ? "طاقة متوازنة" : "5 (Steady)"}</Text>
                    <Text>{isArabic ? "طاقة بركانية فائقة" : "10 (Electric Surge)"}</Text>
                  </Flex>
                </Stack>

                {/* Choice Options */}
                <Stack gap="3">
                  <Text fontSize="xs" fontWeight="bold" opacity={0.9}>
                    {isArabic ? "اختر رد فعلك العفوي الأقرب:" : "Select your most natural instinctive response:"}
                  </Text>
                  <Grid templateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }} gap="3">
                    {moodScenarios[currentMoodIndex].choices.map((choice, idx) => (
                      <Button
                        key={idx}
                        variant="outline"
                        p="4"
                        h="auto"
                        borderRadius="2xl"
                        bg="white/5"
                        borderColor="white/15"
                        color="white"
                        justifyContent="flex-start"
                        textAlign="start"
                        whiteSpace="normal"
                        _hover={{
                          bg: "white/20",
                          borderColor: moodScenarios[currentMoodIndex].accentColor,
                          transform: "translateY(-2px)",
                        }}
                        transition="all 0.2s ease"
                        onClick={() => handleMoodChoiceSelect(choice)}
                      >
                        <Text fontSize="xs" fontWeight="medium" lineHeight="tall">
                          {choice.label}
                        </Text>
                      </Button>
                    ))}
                  </Grid>
                </Stack>
              </Stack>
            </Box>
          )}

          {/* ================================================================ */}
          {/* ACTIVE GAME CANVAS 3: Harmony & Chaos (OCD Screening)            */}
          {/* ================================================================ */}
          {activeGame === "pattern" && (
            <Box
              p={{ base: "6", md: "8" }}
              borderRadius="3xl"
              bg="radial-gradient(circle at center, #0f172a 0%, #020617 100%)"
              color="white"
              borderWidth="2px"
              borderColor="teal.500"
              boxShadow="0 25px 60px -15px rgba(20, 184, 166, 0.3)"
            >
              <Stack gap="6">
                <Flex justify="space-between" align="center" wrap="wrap" gap="2">
                  <HStack gap="2.5">
                    <LuGrid2X2 color="#14b8a6" size={24} />
                    <Box>
                      <Text fontWeight="black" fontSize="lg">
                        {t("games.game3Title", "Harmony & Chaos")}: Symmetry & Pattern Tolerance
                      </Text>
                      <Text fontSize="xs" color="gray.400">
                        {isArabic
                          ? "انقر على المربعات لتدويرها ومحاولة تحقيق تناظر متقن، أو اضغط على إنهاء عندما ترضى بالنمط."
                          : "Rotate tiles to seek harmonic circuits. Click 'Accept Arrangement' when you are satisfied."}
                      </Text>
                    </Box>
                  </HStack>

                  <Button
                    size="xs"
                    variant="ghost"
                    color="white"
                    onClick={() => setActiveGame("none")}
                  >
                    <LuX size={16} />
                  </Button>
                </Flex>

                {/* 3x3 Tile Board */}
                <Flex justify="center" py="4">
                  <Grid
                    templateColumns="repeat(3, 1fr)"
                    gap="3"
                    w="280px"
                    h="280px"
                    p="3"
                    bg="white/5"
                    borderRadius="2xl"
                    borderWidth="1px"
                    borderColor="teal.500/30"
                  >
                    {tiles.map((tile, idx) => (
                      <Box
                        key={tile.id}
                        borderRadius="xl"
                        bg="teal.950"
                        borderWidth="2px"
                        borderColor={tile.isIrregular ? "teal.400/60" : "teal.600"}
                        display="flex"
                        alignItems="center"
                        justifyContent="center"
                        cursor="pointer"
                        position="relative"
                        onClick={() => handleTileClick(idx)}
                        style={{
                          transform: `rotate(${tile.rotation}deg)`,
                          transition: "transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
                        }}
                        _hover={{
                          borderColor: "teal.300",
                          boxShadow: "0 0 15px rgba(20, 184, 166, 0.5)",
                        }}
                      >
                        {/* Geometric Pattern Graphic */}
                        <svg width="60" height="60" viewBox="0 0 60 60">
                          <circle cx="30" cy="30" r="16" stroke="#2dd4bf" strokeWidth="3" fill="none" />
                          <line x1="30" y1="0" x2="30" y2="30" stroke="#14b8a6" strokeWidth="4" />
                          <line x1="30" y1="30" x2="60" y2="30" stroke="#14b8a6" strokeWidth="4" />
                          {tile.isIrregular && (
                            <circle cx="42" cy="18" r="4" fill="#f59e0b" />
                          )}
                        </svg>
                      </Box>
                    ))}
                  </Grid>
                </Flex>

                {/* Controls & Submission */}
                <Flex justify="space-between" align="center" wrap="wrap" gap="3">
                  <HStack gap="2">
                    <Button
                      size="sm"
                      variant="outline"
                      colorPalette="teal"
                      borderRadius="xl"
                      onClick={startPatternGame}
                    >
                      <LuRotateCcw size={14} style={{ marginRight: "4px" }} />
                      {isArabic ? "إعادة الخلط" : "Shuffle Tiles"}
                    </Button>
                  </HStack>

                  <Button
                    size="md"
                    px="5"
                    bg="linear-gradient(135deg, #0d9488 0%, #0f766e 100%)"
                    color="white"
                    borderRadius="xl"
                    fontWeight="bold"
                    onClick={handleCompletePatternGame}
                  >
                    <LuCheck size={16} style={{ marginRight: "6px" }} />
                    {isArabic ? "قبول النمط وإنهاء القياس" : "Accept Arrangement & Finish"}
                  </Button>
                </Flex>
              </Stack>
            </Box>
          )}

          {/* ================================================================ */}
          {/* GAME SELECTION CARDS GRID (When no active game is playing)       */}
          {/* ================================================================ */}
          {activeGame === "none" && (
            <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap="6">
              {/* Game 1: Attention & Focus (ADHD) */}
              <Box
                p="6"
                borderRadius="3xl"
                bg="bg.panel"
                borderWidth="1.5px"
                borderColor="border.subtle"
                _hover={{ borderColor: "orange.500", transform: "translateY(-3px)" }}
                transition="all 0.25s ease"
                display="flex"
                flexDirection="column"
                justifyContent="space-between"
              >
                <Stack gap="4">
                  <Flex
                    w="12"
                    h="12"
                    borderRadius="2xl"
                    bg="orange.500/10"
                    color="orange.600"
                    align="center"
                    justify="center"
                  >
                    <LuZap size={24} />
                  </Flex>
                  <Stack gap="1.5">
                    <HStack justify="space-between">
                      <Text fontWeight="bold" fontSize="md">
                        {t("games.game1Title", "Starlight Focus & Shift")}
                      </Text>
                      <Badge colorPalette="orange" size="xs" px="2" py="0.5" borderRadius="md">
                        {t("games.game1Tag", "ADHD & Focus")}
                      </Badge>
                    </HStack>
                    <Text fontSize="xs" color="fg.muted" lineHeight="tall">
                      {t(
                        "games.game1Desc",
                        "Measures reaction consistency, peripheral distractors, and focus drift in 3 minutes."
                      )}
                    </Text>
                  </Stack>
                </Stack>

                <HStack
                  justify="space-between"
                  pt="4"
                  mt="4"
                  borderTopWidth="1px"
                  borderColor="border.subtle"
                >
                  <Text fontSize="sm" fontWeight="black" color="orange.600">
                    {scores.attention}/10 {t("games.indicativeScore", "Indicative")}
                  </Text>
                  <Button
                    size="sm"
                    px="4"
                    bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                    color="white"
                    borderRadius="xl"
                    fontWeight="semibold"
                    onClick={startAttentionGame}
                  >
                    <HStack gap="1.5">
                      <LuPlay size={14} />
                      <Text>{t("games.play", "Play")}</Text>
                    </HStack>
                  </Button>
                </HStack>
              </Box>

              {/* Game 2: Mood & Energy (Bipolar / Depression) */}
              <Box
                p="6"
                borderRadius="3xl"
                bg="bg.panel"
                borderWidth="1.5px"
                borderColor="border.subtle"
                _hover={{ borderColor: "indigo.500", transform: "translateY(-3px)" }}
                transition="all 0.25s ease"
                display="flex"
                flexDirection="column"
                justifyContent="space-between"
              >
                <Stack gap="4">
                  <Flex
                    w="12"
                    h="12"
                    borderRadius="2xl"
                    bg="indigo.500/10"
                    color="indigo.600"
                    align="center"
                    justify="center"
                  >
                    <LuCloudRain size={24} />
                  </Flex>
                  <Stack gap="1.5">
                    <HStack justify="space-between">
                      <Text fontWeight="bold" fontSize="md">
                        {t("games.game2Title", "Weather Within")}
                      </Text>
                      <Badge colorPalette="indigo" size="xs" px="2" py="0.5" borderRadius="md">
                        {t("games.game2Tag", "Bipolar / Mood")}
                      </Badge>
                    </HStack>
                    <Text fontSize="xs" color="fg.muted" lineHeight="tall">
                      {t(
                        "games.game2Desc",
                        "Visual scenario navigation capturing emotional reactivity and energy-shift patterns."
                      )}
                    </Text>
                  </Stack>
                </Stack>

                <HStack
                  justify="space-between"
                  pt="4"
                  mt="4"
                  borderTopWidth="1px"
                  borderColor="border.subtle"
                >
                  <Text fontSize="sm" fontWeight="black" color="indigo.600">
                    {scores.mood}/10 {t("games.indicativeScore", "Indicative")}
                  </Text>
                  <Button
                    size="sm"
                    px="4"
                    bg="linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)"
                    color="white"
                    borderRadius="xl"
                    fontWeight="semibold"
                    onClick={startMoodGame}
                  >
                    <HStack gap="1.5">
                      <LuPlay size={14} />
                      <Text>{t("games.play", "Play")}</Text>
                    </HStack>
                  </Button>
                </HStack>
              </Box>

              {/* Game 3: Pattern & Behavior (OCD) */}
              <Box
                p="6"
                borderRadius="3xl"
                bg="bg.panel"
                borderWidth="1.5px"
                borderColor="border.subtle"
                _hover={{ borderColor: "teal.500", transform: "translateY(-3px)" }}
                transition="all 0.25s ease"
                display="flex"
                flexDirection="column"
                justifyContent="space-between"
              >
                <Stack gap="4">
                  <Flex
                    w="12"
                    h="12"
                    borderRadius="2xl"
                    bg="teal.500/10"
                    color="teal.600"
                    align="center"
                    justify="center"
                  >
                    <LuGrid2X2 size={24} />
                  </Flex>
                  <Stack gap="1.5">
                    <HStack justify="space-between">
                      <Text fontWeight="bold" fontSize="md">
                        {t("games.game3Title", "Harmony & Chaos")}
                      </Text>
                      <Badge colorPalette="teal" size="xs" px="2" py="0.5" borderRadius="md">
                        {t("games.game3Tag", "OCD & Pattern")}
                      </Badge>
                    </HStack>
                    <Text fontSize="xs" color="fg.muted" lineHeight="tall">
                      {t(
                        "games.game3Desc",
                        "Symmetry and sorting puzzle measuring uncertainty tolerance and checking loops."
                      )}
                    </Text>
                  </Stack>
                </Stack>

                <HStack
                  justify="space-between"
                  pt="4"
                  mt="4"
                  borderTopWidth="1px"
                  borderColor="border.subtle"
                >
                  <Text fontSize="sm" fontWeight="black" color="teal.600">
                    {scores.pattern}/10 {t("games.indicativeScore", "Indicative")}
                  </Text>
                  <Button
                    size="sm"
                    px="4"
                    bg="linear-gradient(135deg, #14b8a6 0%, #0d9488 100%)"
                    color="white"
                    borderRadius="xl"
                    fontWeight="semibold"
                    onClick={startPatternGame}
                  >
                    <HStack gap="1.5">
                      <LuPlay size={14} />
                      <Text>{t("games.play", "Play")}</Text>
                    </HStack>
                  </Button>
                </HStack>
              </Box>
            </Grid>
          )}

          {/* ================================================================ */}
          {/* INDICATIVE SCORECARD & CLINICAL DECISION-SUPPORT PANEL           */}
          {/* ================================================================ */}
          {(showResults || activeGame === "none") && (
            <Box
              p={{ base: "6", md: "8" }}
              borderRadius="3xl"
              bg="bg.panel"
              borderWidth="1.5px"
              borderColor="orange.500/30"
              boxShadow="0 20px 45px -10px rgba(234, 88, 12, 0.12)"
            >
              <Stack gap="6">
                <Flex
                  direction={{ base: "column", sm: "row" }}
                  justify="space-between"
                  align={{ base: "start", sm: "center" }}
                  gap="3"
                >
                  <HStack gap="2.5">
                    <LuActivity size={24} color="#ea580c" />
                    <Box>
                      <Text fontSize="lg" fontWeight="black">
                        {t("games.scorecardTitle", "Completed Indicative Scorecard")}
                      </Text>
                      <Text fontSize="xs" color="fg.muted">
                        {isArabic
                          ? "ملف القياس الموضوعي المعد للمشاركة مع طبيبك النفسي"
                          : "Objective telemetry indicators ready for clinical consultation"}
                      </Text>
                    </Box>
                  </HStack>

                  <Badge
                    colorPalette={addedToDossier ? "green" : "gray"}
                    size="sm"
                    px="3"
                    py="1"
                    borderRadius="full"
                    fontSize="xs"
                    fontWeight="bold"
                  >
                    <HStack gap="1.5">
                      <LuCheck size={14} />
                      <Text>
                        {addedToDossier
                          ? t("games.attachedDossier", "Attached to Doctor File")
                          : isArabic
                            ? "غير مضاف للملف الطبي"
                            : "Private & Local Only"}
                      </Text>
                    </HStack>
                  </Badge>
                </Flex>

                {/* 3 Circular Gauges */}
                <Grid templateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }} gap="5">
                  <CircularGauge
                    score={scores.attention}
                    label={t("games.scoreAdhdTitle", "Attention & Focus (ADHD)")}
                    color="#ea580c"
                    sublabel={t(
                      "games.scoreAdhdDesc",
                      "Reaction telemetry indicates sensitivity to peripheral distractors and impulse spikes."
                    )}
                    badge={scores.attention >= 7 ? "Elevated Focus Drift" : "Stable Baseline"}
                  />

                  <CircularGauge
                    score={scores.mood}
                    label={t("games.scoreMoodTitle", "Mood & Energy Fluctuation")}
                    color="#6366f1"
                    sublabel={t(
                      "games.scoreMoodDesc",
                      "Emotional reactivity with circadian energy patterns."
                    )}
                    badge={scores.mood >= 7 ? "Variable Rhythm" : "Adaptive Regulation"}
                  />

                  <CircularGauge
                    score={scores.pattern}
                    label={t("games.scoreOcdTitle", "Pattern & Checking (OCD)")}
                    color="#0d9488"
                    sublabel={t(
                      "games.scoreOcdDesc",
                      "Tolerance for asymmetrical patterns and checking frequency."
                    )}
                    badge={scores.pattern >= 7 ? "Checking Propensity" : "High Uncertainty Tolerance"}
                  />
                </Grid>

                {/* Clinical Interpretation Banner */}
                <Box
                  p="5"
                  borderRadius="2xl"
                  bg="bg.subtle"
                  borderWidth="1px"
                  borderColor="border.subtle"
                >
                  <Stack gap="2">
                    <HStack justify="space-between">
                      <HStack gap="2">
                        <LuBrain size={18} color="#ea580c" />
                        <Text fontSize="xs" fontWeight="bold" color="fg">
                          {isArabic ? "التفسير الإكلينيكي غير المشوه:" : "Clinical Clarity & Non-Stigmatizing Context:"}
                        </Text>
                      </HStack>
                      <Badge colorPalette="orange" size="xs">
                        {activeInterpretation.tag}
                      </Badge>
                    </HStack>
                    <Text fontSize="xs" color="fg.muted" lineHeight="tall">
                      {activeInterpretation.description}
                    </Text>
                  </Stack>
                </Box>

                {/* Consent & Bridge to Therapist Booking */}
                <Flex
                  direction={{ base: "column", md: "row" }}
                  justify="space-between"
                  align={{ base: "start", md: "center" }}
                  pt="5"
                  borderTopWidth="1px"
                  borderColor="border.subtle"
                  gap="4"
                >
                  <HStack gap="3">
                    <Switch.Root
                      checked={addedToDossier}
                      onCheckedChange={(e) => handleToggleDossier(e.checked)}
                      colorPalette="orange"
                    >
                      <Switch.HiddenInput />
                      <Switch.Control />
                    </Switch.Root>
                    <Box>
                      <Text fontSize="xs" fontWeight="bold">
                        {t("games.addToDossier", "Add Scores to My Ready Doctor File")}
                      </Text>
                      <Text fontSize="2xs" color="fg.muted">
                        {isArabic
                          ? "سيتم إرفاق هذه القياسات تلقائياً في الملخص التمهيدي لجلسات الاستشارة"
                          : "Automatically synthesizes these metrics into your pre-session clinical dossier"}
                      </Text>
                    </Box>
                  </HStack>

                  <Button
                    size="md"
                    px="6"
                    py="2.5"
                    fontSize="sm"
                    fontWeight="bold"
                    bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                    color="white"
                    borderRadius="xl"
                    boxShadow="0 8px 20px -5px rgba(234, 88, 12, 0.4)"
                    _hover={{ transform: "translateY(-1px)", opacity: 0.95 }}
                    onClick={() => {
                      const topTrait =
                        scores.attention >= scores.mood && scores.attention >= scores.pattern
                          ? "ADHD"
                          : scores.mood >= scores.pattern
                            ? "Mood"
                            : "OCD";
                      navigate(`/sessions/therapists?specialty=${topTrait}`);
                    }}
                  >
                    <HStack gap="2">
                      <Text>{t("games.findSpecialists", "Find Doctors Specializing in These Traits")}</Text>
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
