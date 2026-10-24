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
  Checkbox,
  Image,
  Flex,
} from "@chakra-ui/react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { useAuthActions, useUser } from "@repo/react-appwrite";
import { SplitText } from "@repo/ui-components";
import { logoWithTitle } from "@repo/assets";
import { LuEye, LuEyeOff, LuMail, LuLock, LuLogIn } from "react-icons/lu";
import { sendEmailOtp } from "../../services/authService";

const loginSchema = z.object({
  email: z.string().min(1, "required").email("invalidEmail"),
  password: z.string().min(8, "passwordLength"),
  rememberMe: z.boolean().optional(),
});

type LoginFormValues = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { loginWithEmail, isPending } = useAuthActions();
  const { refresh } = useUser();

  const [showPassword, setShowPassword] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: true,
    },
  });

  const onSubmit = async (data: LoginFormValues) => {
    setErrorMessage(null);
    try {
      await loginWithEmail(data.email.trim(), data.password);
      const user = await refresh();

      if (user && !user.emailVerification) {
        // User email is unverified! Trigger OTP email and navigate to OTP verification
        try {
          await sendEmailOtp(user.email, user.$id);
        } catch (otpErr) {
          console.warn("Could not auto-send OTP on login:", otpErr);
        }
        navigate(
          `/auth/verify-email?email=${encodeURIComponent(user.email)}&userId=${user.$id}`,
        );
      } else {
        navigate("/");
      }
    } catch (err: any) {
      console.error("Login failed:", err);
      const message =
        err?.code === 401 || err?.message?.includes("Invalid credentials")
          ? t("auth.errors.authFailed")
          : err?.message || t("auth.errors.generic");
      setErrorMessage(message);
    }
  };

  return (
    <Box as="form" onSubmit={handleSubmit(onSubmit)} noValidate>
      <Stack gap="6">
        {/* Header */}
        <Stack gap="3" textAlign="center" align="center">
          <SplitText
            text={t("auth.login.title")}
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
            {t("auth.login.subtitle")}
          </Text>
        </Stack>

        {/* Error Alert */}
        {errorMessage && (
          <Alert.Root status="error" variant="subtle" borderRadius="xl">
            <Alert.Indicator />
            <Alert.Title fontSize="sm">{errorMessage}</Alert.Title>
          </Alert.Root>
        )}

        {/* Inputs */}
        <Stack gap="4">
          {/* Email */}
          <Field.Root invalid={!!errors.email} w="100%">
            <Field.Label fontSize="sm" fontWeight="semibold">
              {t("auth.login.emailLabel")}
            </Field.Label>
            <Box position="relative" w="100%">
              <Input
                type="email"
                placeholder={t("auth.login.emailPlaceholder")}
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
            </Box>
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
            <HStack justify="space-between" w="100%">
              <Field.Label fontSize="sm" fontWeight="semibold">
                {t("auth.login.passwordLabel")}
              </Field.Label>
              <Link
                to="/auth/forget-password"
                style={{
                  fontSize: "0.8125rem",
                  color: "#ea580c",
                  fontWeight: 600,
                  textDecoration: "none",
                }}
              >
                {t("auth.login.forgotPassword")}
              </Link>
            </HStack>
            <Box position="relative" w="100%">
              <Input
                type={showPassword ? "text" : "password"}
                placeholder={t("auth.login.passwordPlaceholder")}
                size="lg"
                borderRadius="xl"
                {...register("password")}
                autoComplete="current-password"
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
        </Stack>

        {/* Submit Button */}
        <Button
          type="submit"
          loading={isPending}
          size="lg"
          px="6"
          py="3.5"
          borderRadius="xl"
          bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
          color="white"
          _hover={{
            opacity: 0.94,
            boxShadow: "0 8px 24px -4px rgba(234, 88, 12, 0.45)",
          }}
          w="100%"
          fontWeight="bold"
        >
          <HStack gap="2">
            <LuLogIn size={18} />
            <Text fontSize="md">
              {isPending ? t("auth.login.submitting") : t("auth.login.submit")}
            </Text>
          </HStack>
        </Button>

        {/* Sign up link */}
        <HStack justify="center" gap="1" fontSize="sm" pt="2">
          <Text color="fg.muted">{t("auth.login.noAccount")}</Text>
          <Link
            to="/auth/register"
            style={{
              fontWeight: 700,
              color: "#ea580c",
              textDecoration: "none",
            }}
          >
            {t("auth.login.createAccount")}
          </Link>
        </HStack>
      </Stack>
    </Box>
  );
};

export default Login;
