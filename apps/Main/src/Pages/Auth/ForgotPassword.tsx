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
  Image,
  Flex,
} from "@chakra-ui/react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useTranslation } from "react-i18next";
import { SplitText } from "@repo/ui-components";
import { logoWithTitle } from "@repo/assets";
import {
  LuEye,
  LuEyeOff,
  LuMail,
  LuKeyRound,
  LuArrowLeft,
  LuArrowRight,
  LuCircleCheck,
} from "react-icons/lu";
import {
  sendPasswordRecovery,
  completePasswordReset,
} from "../../services/authService";

const requestRecoverySchema = z.object({
  email: z.string().min(1, "required").email("invalidEmail"),
});

const resetPasswordSchema = z
  .object({
    password: z.string().min(8, "passwordLength"),
    confirmPassword: z.string().min(8, "passwordLength"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "passwordMismatch",
    path: ["confirmPassword"],
  });

type RequestRecoveryForm = z.infer<typeof requestRecoverySchema>;
type ResetPasswordForm = z.infer<typeof resetPasswordSchema>;

export const ForgotPassword: React.FC = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isRtl = i18n.language.startsWith("ar");

  // Check if user arrived from the email reset link
  const userId = searchParams.get("userId");
  const secret = searchParams.get("secret");
  const isResetPhase = Boolean(userId && secret);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emailSentTo, setEmailSentTo] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Form 1: Request reset link
  const requestForm = useForm<RequestRecoveryForm>({
    resolver: zodResolver(requestRecoverySchema),
    defaultValues: { email: "" },
  });

  // Form 2: Update password
  const resetForm = useForm<ResetPasswordForm>({
    resolver: zodResolver(resetPasswordSchema),
    defaultValues: { password: "", confirmPassword: "" },
  });

  const onRequestSubmit = async (data: RequestRecoveryForm) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await sendPasswordRecovery(data.email.trim());
      setEmailSentTo(data.email.trim());
    } catch (err: any) {
      console.error("Recovery request error:", err);
      setErrorMessage(err?.message || t("auth.errors.generic"));
    } finally {
      setIsLoading(false);
    }
  };

  const onResetSubmit = async (data: ResetPasswordForm) => {
    if (!userId || !secret) return;
    setIsLoading(true);
    setErrorMessage(null);
    try {
      await completePasswordReset(userId, secret, data.password);
      setIsSuccess(true);
      setTimeout(() => {
        navigate("/auth/login");
      }, 2500);
    } catch (err: any) {
      console.error("Reset error:", err);
      setErrorMessage(err?.message || t("auth.errors.generic"));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box>
      <Stack gap="6">
        {/* Header */}
        <Stack gap="3" textAlign="center" align="center">
          <SplitText
            text={
              isResetPhase
                ? t("auth.forgotPassword.resetTitle")
                : t("auth.forgotPassword.title")
            }
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
            {isResetPhase
              ? t("auth.forgotPassword.resetSubtitle")
              : t("auth.forgotPassword.subtitle")}
          </Text>
        </Stack>

        {/* Error Alert */}
        {errorMessage && (
          <Alert.Root status="error" variant="subtle" borderRadius="xl">
            <Alert.Indicator />
            <Alert.Title fontSize="sm">{errorMessage}</Alert.Title>
          </Alert.Root>
        )}

        {/* Phase 2: Reset with token from email link */}
        {isResetPhase ? (
          isSuccess ? (
            <Alert.Root status="success" variant="subtle" borderRadius="xl">
              <Alert.Indicator />
              <Alert.Title fontSize="sm">
                {t("auth.forgotPassword.success")}
              </Alert.Title>
            </Alert.Root>
          ) : (
            <Box
              as="form"
              onSubmit={resetForm.handleSubmit(onResetSubmit)}
              noValidate
            >
              <Stack gap="4">
                <Field.Root invalid={!!resetForm.formState.errors.password} w="100%">
                  <Field.Label fontSize="sm" fontWeight="semibold">
                    {t("auth.forgotPassword.newPasswordLabel")}
                  </Field.Label>
                  <Box position="relative" w="100%">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder={t(
                        "auth.forgotPassword.newPasswordPlaceholder",
                      )}
                      size="lg"
                      borderRadius="xl"
                      {...resetForm.register("password")}
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
                      aria-label="Toggle password"
                      color="fg.muted"
                    >
                      {showPassword ? (
                        <LuEyeOff size={18} />
                      ) : (
                        <LuEye size={18} />
                      )}
                    </IconButton>
                  </Box>
                  {resetForm.formState.errors.password && (
                    <Field.ErrorText fontSize="xs">
                      {t(
                        `auth.errors.${resetForm.formState.errors.password.message}`,
                        {
                          defaultValue: t("auth.errors.passwordLength"),
                        },
                      )}
                    </Field.ErrorText>
                  )}
                </Field.Root>

                <Field.Root
                  invalid={!!resetForm.formState.errors.confirmPassword}
                  w="100%"
                >
                  <Field.Label fontSize="sm" fontWeight="semibold">
                    {t("auth.forgotPassword.confirmNewPasswordLabel")}
                  </Field.Label>
                  <Box position="relative" w="100%">
                    <Input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder={t(
                        "auth.forgotPassword.confirmNewPasswordPlaceholder",
                      )}
                      size="lg"
                      borderRadius="xl"
                      {...resetForm.register("confirmPassword")}
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
                      aria-label="Toggle password"
                      color="fg.muted"
                    >
                      {showConfirmPassword ? (
                        <LuEyeOff size={18} />
                      ) : (
                        <LuEye size={18} />
                      )}
                    </IconButton>
                  </Box>
                  {resetForm.formState.errors.confirmPassword && (
                    <Field.ErrorText fontSize="xs">
                      {t(
                        `auth.errors.${resetForm.formState.errors.confirmPassword.message}`,
                        {
                          defaultValue: t("auth.errors.passwordMismatch"),
                        },
                      )}
                    </Field.ErrorText>
                  )}
                </Field.Root>

                <Button
                  type="submit"
                  loading={isLoading}
                  size="lg"
                  px="6"
                  py="3.5"
                  borderRadius="xl"
                  bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                  color="white"
                  w="100%"
                  fontWeight="bold"
                  _hover={{
                    opacity: 0.94,
                    boxShadow: "0 8px 24px -4px rgba(234, 88, 12, 0.45)",
                  }}
                >
                  <HStack gap="2">
                    <LuKeyRound size={18} />
                    <Text fontSize="md">
                      {isLoading
                        ? t("auth.forgotPassword.updating")
                        : t("auth.forgotPassword.updateSubmit")}
                    </Text>
                  </HStack>
                </Button>
              </Stack>
            </Box>
          )
        ) : emailSentTo ? (
          /* Email Sent Feedback */
          <Stack gap="4" textAlign="center" py="4">
            <Box
              w="14"
              h="14"
              borderRadius="full"
              bg="orange.subtle"
              color="orange.solid"
              display="flex"
              alignItems="center"
              justifyContent="center"
              mx="auto"
              fontSize="2xl"
              boxShadow="0 4px 14px rgba(234, 88, 12, 0.25)"
            >
              <LuCircleCheck />
            </Box>
            <Text fontSize="lg" fontWeight="bold">
              {t("auth.forgotPassword.emailSentTitle")}
            </Text>
            <Text fontSize="sm" color="fg.muted">
              {t("auth.forgotPassword.emailSentDesc", { email: emailSentTo })}
            </Text>
            <HStack gap="3" justify="center" pt="2">
              <Button
                variant="outline"
                size="md"
                px="4"
                py="2"
                borderRadius="xl"
                fontSize="sm"
                fontWeight="semibold"
                onClick={() => setEmailSentTo(null)}
              >
                {t("auth.forgotPassword.resend")}
              </Button>
              <Button
                size="md"
                px="5"
                py="2"
                borderRadius="xl"
                fontSize="sm"
                fontWeight="semibold"
                bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                color="white"
                _hover={{
                  opacity: 0.94,
                  boxShadow: "0 8px 24px -4px rgba(234, 88, 12, 0.45)",
                }}
                onClick={() => navigate("/auth/login")}
              >
                {t("auth.forgotPassword.backToLogin")}
              </Button>
            </HStack>
          </Stack>
        ) : (
          /* Phase 1: Request Reset Link */
          <Box
            as="form"
            onSubmit={requestForm.handleSubmit(onRequestSubmit)}
            noValidate
          >
            <Stack gap="4">
              <Field.Root invalid={!!requestForm.formState.errors.email} w="100%">
                <Field.Label fontSize="sm" fontWeight="semibold">
                  {t("auth.forgotPassword.emailLabel")}
                </Field.Label>
                <Input
                  type="email"
                  placeholder={t("auth.forgotPassword.emailPlaceholder")}
                  size="lg"
                  borderRadius="xl"
                  {...requestForm.register("email")}
                  autoComplete="email"
                  w="100%"
                  px="4"
                  _focus={{
                    borderColor: "orange.500",
                    boxShadow: "0 0 0 1px #ea580c",
                  }}
                />
                {requestForm.formState.errors.email && (
                  <Field.ErrorText fontSize="xs">
                    {t(
                      `auth.errors.${requestForm.formState.errors.email.message}`,
                      {
                        defaultValue: t("auth.errors.invalidEmail"),
                      },
                    )}
                  </Field.ErrorText>
                )}
              </Field.Root>

              <Button
                type="submit"
                loading={isLoading}
                size="lg"
                px="6"
                py="3.5"
                borderRadius="xl"
                bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                color="white"
                w="100%"
                fontWeight="bold"
                _hover={{
                  opacity: 0.94,
                  boxShadow: "0 8px 24px -4px rgba(234, 88, 12, 0.45)",
                }}
              >
                <HStack gap="2">
                  <LuMail size={18} />
                  <Text fontSize="md">
                    {isLoading
                      ? t("auth.forgotPassword.submitting")
                      : t("auth.forgotPassword.submit")}
                  </Text>
                </HStack>
              </Button>
            </Stack>
          </Box>
        )}

        {/* Back to Login Link */}
        <HStack justify="center" gap="1" fontSize="sm">
          <Link
            to="/auth/login"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              fontWeight: 700,
              color: "#ea580c",
              textDecoration: "none",
            }}
          >
            {isRtl ? <LuArrowRight /> : <LuArrowLeft />}
            <span>{t("auth.forgotPassword.backToLogin")}</span>
          </Link>
        </HStack>
      </Stack>
    </Box>
  );
};

export default ForgotPassword;
