import React, { useState } from "react";
import {
  Box,
  Button,
  Field,
  HStack,
  Input,
  Stack,
  Text,
  Alert,
  IconButton,
  Progress,
  Flex,
  Image,
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import * as z from "zod";
import {
  useMultipleFormSteps,
  type StepComponentProps,
} from "@repo/hooks-shared";
import { useAuthActions, useUser } from "@repo/react-appwrite";
import { SplitText } from "@repo/ui-components";
import {
  LuEye,
  LuEyeOff,
  LuArrowRight,
  LuArrowLeft,
  LuUserPlus,
  LuCheck,
} from "react-icons/lu";
import { sendEmailOtp, registerPatient } from "../../services/authService";

const registerFormSchema = z
  .object({
    userName: z.string().min(2, "required"),
    email: z.string().min(1, "required").email("invalidEmail"),
    password: z.string().min(8, "passwordLength"),
    confirmPassword: z.string().min(8, "passwordLength"),
    phoneNumber: z.string().min(5, "invalidPhone"),
    age: z.union([z.string(), z.number()]).refine((val) => {
      const num = Number(val);
      return !isNaN(num) && num >= 1 && num <= 120;
    }, "invalidAge"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"],
  });

export type RegisterFormValues = z.infer<typeof registerFormSchema>;

/* -------------------------------------------------------------
   Step 1: Account Credentials
------------------------------------------------------------- */
const Step1Credentials: React.FC<StepComponentProps<RegisterFormValues>> = ({
  register,
  errors,
}) => {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  return (
    <Stack gap="4">
      {/* User Name */}
      <Field.Root invalid={!!errors.userName} w="100%">
        <Field.Label fontSize="sm" fontWeight="semibold">
          {t("auth.register.usernameLabel")}
        </Field.Label>
        <Input
          placeholder={t("auth.register.usernamePlaceholder")}
          size="lg"
          borderRadius="xl"
          {...register("userName")}
          autoComplete="name"
          w="100%"
          px="4"
          _focus={{
            borderColor: "orange.500",
            boxShadow: "0 0 0 1px #ea580c",
          }}
        />
        {errors.userName && (
          <Field.ErrorText fontSize="xs">
            {t(`auth.errors.${errors.userName.message}`, {
              defaultValue: t("auth.errors.required"),
            })}
          </Field.ErrorText>
        )}
      </Field.Root>

      {/* Email */}
      <Field.Root invalid={!!errors.email} w="100%">
        <Field.Label fontSize="sm" fontWeight="semibold">
          {t("auth.register.emailLabel")}
        </Field.Label>
        <Input
          type="email"
          placeholder={t("auth.register.emailPlaceholder")}
          size="lg"
          borderRadius="xl"
          {...register("email")}
          autoComplete="email"
          w="100%"
          px="4"
          _focus={{
            borderColor: "orange.500",
            boxShadow: "0 0 0 1px #ea580c",
          }}
        />
        {errors.email && (
          <Field.ErrorText fontSize="xs">
            {t(`auth.errors.${errors.email.message}`, {
              defaultValue: t("auth.errors.invalidEmail"),
            })}
          </Field.ErrorText>
        )}
      </Field.Root>

      {/* Password */}
      <Field.Root invalid={!!errors.password} w="100%">
        <Field.Label fontSize="sm" fontWeight="semibold">
          {t("auth.register.passwordLabel")}
        </Field.Label>
        <Box position="relative" w="100%">
          <Input
            type={showPassword ? "text" : "password"}
            placeholder={t("auth.register.passwordPlaceholder")}
            size="lg"
            borderRadius="xl"
            {...register("password")}
            autoComplete="new-password"
            w="100%"
            px="4"
            pe="12"
            _focus={{
              borderColor: "orange.500",
              boxShadow: "0 0 0 1px #ea580c",
            }}
          />
          <IconButton
            type="button"
            variant="ghost"
            size="sm"
            position="absolute"
            top="50%"
            insetEnd="2"
            transform="translateY(-50%)"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            color="fg.muted"
          >
            {showPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
          </IconButton>
        </Box>
        {errors.password && (
          <Field.ErrorText fontSize="xs">
            {t(`auth.errors.${errors.password.message}`, {
              defaultValue: t("auth.errors.passwordLength"),
            })}
          </Field.ErrorText>
        )}
      </Field.Root>

      {/* Confirm Password */}
      <Field.Root invalid={!!errors.confirmPassword} w="100%">
        <Field.Label fontSize="sm" fontWeight="semibold">
          {t("auth.register.confirmPasswordLabel")}
        </Field.Label>
        <Box position="relative" w="100%">
          <Input
            type={showConfirmPassword ? "text" : "password"}
            placeholder={t("auth.register.confirmPasswordPlaceholder")}
            size="lg"
            borderRadius="xl"
            {...register("confirmPassword")}
            autoComplete="new-password"
            w="100%"
            px="4"
            pe="12"
            _focus={{
              borderColor: "orange.500",
              boxShadow: "0 0 0 1px #ea580c",
            }}
          />
          <IconButton
            type="button"
            variant="ghost"
            size="sm"
            position="absolute"
            top="50%"
            insetEnd="2"
            transform="translateY(-50%)"
            onClick={() => setShowConfirmPassword((prev) => !prev)}
            aria-label={showConfirmPassword ? "Hide password" : "Show password"}
            color="fg.muted"
          >
            {showConfirmPassword ? <LuEyeOff size={18} /> : <LuEye size={18} />}
          </IconButton>
        </Box>
        {errors.confirmPassword && (
          <Field.ErrorText fontSize="xs">
            {t(`auth.errors.${errors.confirmPassword.message}`, {
              defaultValue: t("auth.errors.passwordMismatch"),
            })}
          </Field.ErrorText>
        )}
      </Field.Root>
    </Stack>
  );
};

/* -------------------------------------------------------------
   Step 2: Personal Details
------------------------------------------------------------- */
const Step2Personal: React.FC<StepComponentProps<RegisterFormValues>> = ({
  register,
  errors,
}) => {
  const { t } = useTranslation();

  return (
    <Stack gap="4">
      {/* Phone Number */}
      <Field.Root invalid={!!errors.phoneNumber} w="100%">
        <Field.Label fontSize="sm" fontWeight="semibold">
          {t("auth.register.phoneLabel")}
        </Field.Label>
        <Input
          type="tel"
          placeholder={t("auth.register.phonePlaceholder")}
          size="lg"
          borderRadius="xl"
          {...register("phoneNumber")}
          autoComplete="tel"
          w="100%"
          px="4"
          _focus={{
            borderColor: "orange.500",
            boxShadow: "0 0 0 1px #ea580c",
          }}
        />
        {errors.phoneNumber && (
          <Field.ErrorText fontSize="xs">
            {t(`auth.errors.${errors.phoneNumber.message}`, {
              defaultValue: t("auth.errors.invalidPhone"),
            })}
          </Field.ErrorText>
        )}
      </Field.Root>

      {/* Age */}
      <Field.Root invalid={!!errors.age} w="100%">
        <Field.Label fontSize="sm" fontWeight="semibold">
          {t("auth.register.ageLabel")}
        </Field.Label>
        <Input
          type="number"
          min={1}
          max={120}
          placeholder={t("auth.register.agePlaceholder")}
          size="lg"
          borderRadius="xl"
          {...register("age")}
          w="100%"
          px="4"
          _focus={{
            borderColor: "orange.500",
            boxShadow: "0 0 0 1px #ea580c",
          }}
        />
        {errors.age && (
          <Field.ErrorText fontSize="xs">
            {t(`auth.errors.${errors.age.message}`, {
              defaultValue: t("auth.errors.invalidAge"),
            })}
          </Field.ErrorText>
        )}
      </Field.Root>
    </Stack>
  );
};

/* -------------------------------------------------------------
   Master Register Wizard Component
------------------------------------------------------------- */
export const Register: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const isRtl = i18n.language.startsWith("ar");
  const { register: registerUser } = useAuthActions();
  const { refresh } = useUser();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const stepsConfig = [
    {
      Component: Step1Credentials,
      fieldsRequired: [
        "userName",
        "email",
        "password",
        "confirmPassword",
      ] as (keyof RegisterFormValues)[],
      titleKey: "auth.register.step1Title",
      subtitleKey: "auth.register.step1Subtitle",
    },
    {
      Component: Step2Personal,
      fieldsRequired: ["phoneNumber", "age"] as (keyof RegisterFormValues)[],
      titleKey: "auth.register.step2Title",
      subtitleKey: "auth.register.step2Subtitle",
    },
  ];

  const {
    CurrentStep,
    currentStepIndex,
    totalSteps,
    handleNext,
    handlePrev,
    isFirstStep,
    isLastStep,
    register,
    control,
    watch,
    handleSubmit,
    setValue,
    setError,
    clearErrors,
    wrapperTransitionStyles,
    formState: { errors },
  } = useMultipleFormSteps<RegisterFormValues>({
    steps: stepsConfig,
    schema: registerFormSchema,
    mode: "onChange",
    lang: isRtl ? "ar" : "en",
    animationDirection: "horizontal",
    animationPreset: "smooth",
    defaultValues: {
      userName: "",
      email: "",
      password: "",
      confirmPassword: "",
      phoneNumber: "",
      age: "" as any,
    },
  });

  const onFinalSubmit = async (values: RegisterFormValues) => {
    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      // 1. Register patient via cloud function: saves in USERS collection with permissions & patient role
      const result = await registerPatient({
        email: values.email.trim(),
        password: values.password,
        userName: values.userName.trim(),
        phoneNumber: values.phoneNumber,
        age: Number(values.age),
      });

      const targetUserId = result.userId || result.user?.$id;

      // 2. Initiate Email OTP Verification
      try {
        await sendEmailOtp(values.email.trim(), targetUserId);
      } catch (otpErr) {
        console.warn("Could not dispatch initial OTP:", otpErr);
      }

      // 3. Refresh auth state
      await refresh();

      // 4. Navigate to OTP screen for email verification
      navigate(
        `/auth/verify-email?email=${encodeURIComponent(values.email.trim())}&userId=${targetUserId}`,
      );
    } catch (err: any) {
      console.error("Registration error:", err);
      const msg =
        err?.code === 409 || err?.message?.includes("already exists")
          ? t("auth.errors.userExists")
          : err?.message || t("auth.errors.generic");
      setErrorMessage(msg);
      setIsSubmitting(false);
    }
  };

  const currentConfig = stepsConfig[currentStepIndex];

  return (
    <Box as="form" onSubmit={handleSubmit(onFinalSubmit)} noValidate>
      <Stack gap="6">
        {/* Wizard Header */}
        <Stack gap="3" textAlign="center" align="center">
          <SplitText
            text={t("auth.register.title")}
            animation="fadeUp"
            duration={0.5}
            delay={30}
            style={{
              fontSize: "1.75rem",
              fontWeight: 800,
              letterSpacing: "-0.02em",
            }}
          />
          <Text fontSize="sm" color="fg.muted">
            {t("auth.register.subtitle")}
          </Text>
        </Stack>

        {/* Step Progress & Indicators */}
        <Box>
          <HStack
            justify="space-between"
            mb="2"
            fontSize="xs"
            fontWeight="semibold"
          >
            <Text color="orange.600">
              {t("auth.register.step", {
                current: currentStepIndex + 1,
                total: totalSteps,
              })}
            </Text>
            <Text color="fg.muted">{t(currentConfig.titleKey)}</Text>
          </HStack>
          <Progress.Root
            value={((currentStepIndex + 1) / totalSteps) * 100}
            size="xs"
            borderRadius="full"
          >
            <Progress.Track bg="bg.muted">
              <Progress.Range bg="linear-gradient(90deg, #fb923c, #ea580c)" />
            </Progress.Track>
          </Progress.Root>
        </Box>

        {/* Step Subtitle */}
        <Text fontSize="xs" color="fg.muted" textAlign="center">
          {t(currentConfig.subtitleKey)}
        </Text>

        {/* Error Alert */}
        {errorMessage && (
          <Alert.Root status="error" variant="subtle" borderRadius="xl">
            <Alert.Indicator />
            <Alert.Title fontSize="sm">{errorMessage}</Alert.Title>
          </Alert.Root>
        )}

        {/* Dynamic Step Content with wrapper animation */}
        <Box overflow="hidden" w="100%" minH="240px">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={currentStepIndex}
              style={{
                width: "100%",
                gap: "16px",
                display: "flex",
                flexDirection: "column",
              }}
              {...wrapperTransitionStyles}
            >
              {CurrentStep && (
                <CurrentStep
                  control={control}
                  watch={watch}
                  errors={errors}
                  register={register}
                  setValue={setValue}
                  setError={setError}
                  clearErrors={clearErrors}
                  handleNext={handleNext}
                  handlePrev={handlePrev}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </Box>

        {/* Wizard Navigation Buttons */}
        <Flex gap="3" pt="2">
          {!isFirstStep && (
            <Button
              type="button"
              variant="outline"
              size="lg"
              borderRadius="xl"
              onClick={handlePrev}
              flex="1"
            >
              <HStack gap="2">
                {isRtl ? <LuArrowRight /> : <LuArrowLeft />}
                <Text>{t("auth.register.prev")}</Text>
              </HStack>
            </Button>
          )}

          {!isLastStep ? (
            <Button
              type="button"
              size="lg"
              borderRadius="xl"
              bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
              color="white"
              _hover={{
                opacity: 0.94,
                boxShadow: "0 8px 24px -4px rgba(234, 88, 12, 0.45)",
              }}
              onClick={handleNext}
              flex="2"
              fontWeight="bold"
            >
              <HStack gap="2">
                <Text>{t("auth.register.next")}</Text>
                {isRtl ? <LuArrowLeft /> : <LuArrowRight />}
              </HStack>
            </Button>
          ) : (
            <Button
              type="submit"
              loading={isSubmitting}
              size="lg"
              borderRadius="xl"
              bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
              color="white"
              _hover={{
                opacity: 0.94,
                boxShadow: "0 8px 24px -4px rgba(234, 88, 12, 0.45)",
              }}
              flex="2"
              fontWeight="bold"
            >
              <HStack gap="2">
                <LuUserPlus />
                <Text>
                  {isSubmitting
                    ? t("auth.register.submitting")
                    : t("auth.register.submit")}
                </Text>
              </HStack>
            </Button>
          )}
        </Flex>

        {/* Already have an account link */}
        <HStack justify="center" gap="1" fontSize="sm" pt="1">
          <Text color="fg.muted">{t("auth.register.alreadyHaveAccount")}</Text>
          <Link
            to="/auth/login"
            style={{
              fontWeight: 700,
              color: "#ea580c",
              textDecoration: "none",
            }}
          >
            {t("auth.register.signIn")}
          </Link>
        </HStack>
      </Stack>
    </Box>
  );
};

export default Register;
