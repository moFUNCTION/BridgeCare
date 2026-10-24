import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  HStack,
  Stack,
  Text,
  Alert,
  Flex,
} from "@chakra-ui/react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useUser, useAuthActions } from "@repo/react-appwrite";
import { SplitText, CodeSlot } from "@repo/ui-components";
import { LuShieldCheck, LuMailCheck, LuRefreshCw } from "react-icons/lu";
import { sendEmailOtp, verifyEmailOtp } from "../../services/authService";
import { setVerificationSkipped } from "../../lib/cookies";

export const VerifyEmail: React.FC = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, refresh } = useUser();
  const { updateVerification } = useAuthActions();

  // Extract from query or user session
  const paramEmail = searchParams.get("email") || user?.email || "";
  const paramUserId = searchParams.get("userId") || user?.$id || "";
  const secret = searchParams.get("secret");

  const [otpValue, setOtpValue] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [isResending, setIsResending] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(60);

  // If redirected from an Appwrite email verification link (?userId=...&secret=...)
  useEffect(() => {
    if (paramUserId && secret) {
      setIsVerifying(true);
      updateVerification(paramUserId, secret)
        .then(async () => {
          setVerificationSkipped(false);
          setSuccessMessage(t("auth.verifyEmail.success"));
          await refresh();
          setTimeout(() => navigate("/"), 2000);
        })
        .catch((err) => {
          setErrorMessage(err?.message || t("auth.verifyEmail.error"));
        })
        .finally(() => setIsVerifying(false));
    }
  }, [paramUserId, secret]);

  // Countdown timer
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const activeEmail = paramEmail || user?.email || "";
  const activeUserId = paramUserId || user?.$id || "";

  const handleVerify = async (codeOverride?: string) => {
    const code = (codeOverride || otpValue).trim();
    if (code.length < 6) {
      setErrorMessage(t("auth.verifyEmail.codePlaceholder"));
      return;
    }
    setIsVerifying(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await verifyEmailOtp(activeUserId, code);
      setVerificationSkipped(false);
      setSuccessMessage(t("auth.verifyEmail.success"));
      await refresh();
      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (err: any) {
      console.error("Verification error:", err);
      setErrorMessage(err?.message || t("auth.verifyEmail.error"));
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    if (countdown > 0 || isResending) return;
    setIsResending(true);
    setErrorMessage(null);
    setOtpValue("");
    try {
      const result = await sendEmailOtp(activeEmail, activeUserId);
      if (result.debugOtp) {
        console.info("Generated OTP (dev):", result.debugOtp);
      }
      setCountdown(60);
      setSuccessMessage(
        result.debugOtp
          ? `${t("auth.verifyEmail.codeSent")} (Code: ${result.debugOtp})`
          : t("auth.verifyEmail.codeSent")
      );
    } catch (err: any) {
      setErrorMessage(err?.message || t("auth.errors.generic"));
    } finally {
      setIsResending(false);
    }
  };

  return (
    <Box>
      <Stack gap="6" textAlign="center">
        {/* Logo & Header */}
        <Flex
          alignItems="center"
          justifyContent="center"
          w="14"
          h="14"
          borderRadius="2xl"
          bg="orange.subtle"
          color="orange.solid"
          mx="auto"
          boxShadow="0 4px 14px rgba(234, 88, 12, 0.25)"
        >
          <LuShieldCheck size={28} />
        </Flex>

        <Stack gap="2">
          <SplitText
            text={t("auth.verifyEmail.title")}
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
            {t("auth.verifyEmail.subtitle")}{" "}
            <Text as="span" fontWeight="bold" color="fg">
              {activeEmail || "your email"}
            </Text>
          </Text>
        </Stack>

        {/* Error / Success Feedback */}
        {errorMessage && (
          <Alert.Root status="error" variant="subtle" borderRadius="xl">
            <Alert.Indicator />
            <Alert.Title fontSize="sm">{errorMessage}</Alert.Title>
          </Alert.Root>
        )}

        {successMessage && (
          <Alert.Root status="success" variant="subtle" borderRadius="xl">
            <Alert.Indicator />
            <Alert.Title fontSize="sm">{successMessage}</Alert.Title>
          </Alert.Root>
        )}

        {/* Animated CodeSlot OTP Input */}
        <Flex justify="center" py="3" w="100%">
          <CodeSlot
            length={6}
            value={otpValue}
            onChange={(val) => {
              setOtpValue(val);
              if (errorMessage) setErrorMessage(null);
            }}
            onComplete={(val) => {
              handleVerify(val);
            }}
            status={errorMessage ? "error" : successMessage ? "success" : "idle"}
            disabled={isVerifying}
            autoFocus={true}
            accentColor="#ea580c"
            inkColor="#f97316"
            slotColor="rgba(249, 115, 22, 0.08)"
            digitColor="var(--chakra-colors-fg, #18181b)"
            dangerColor="#ef4444"
            slotSize={48}
            gap={10}
            radius={14}
            ariaLabel="Email verification code"
          />
        </Flex>

        {/* Verify Button */}
        <Button
          type="button"
          loading={isVerifying}
          disabled={otpValue.length < 6}
          size="lg"
          px="6"
          py="3.5"
          borderRadius="xl"
          bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
          color="white"
          onClick={() => handleVerify()}
          w="100%"
          fontWeight="bold"
          _hover={{
            opacity: 0.94,
            boxShadow: "0 8px 24px -4px rgba(234, 88, 12, 0.45)",
          }}
        >
          <HStack gap="2">
            <LuMailCheck size={18} />
            <Text fontSize="md">
              {isVerifying
                ? t("auth.verifyEmail.submitting")
                : t("auth.verifyEmail.submit")}
            </Text>
          </HStack>
        </Button>

        {/* Resend Section */}
        <HStack justify="center" gap="2" fontSize="sm">
          <Text color="fg.muted">{t("auth.verifyEmail.noCodePrompt")}</Text>
          {countdown > 0 ? (
            <Text color="orange.600" fontWeight="semibold">
              {t("auth.verifyEmail.resendIn", { seconds: countdown })}
            </Text>
          ) : (
            <Button
              variant="plain"
              size="sm"
              px="1.5"
              py="1"
              fontSize="sm"
              loading={isResending}
              onClick={handleResend}
              color="orange.600"
              fontWeight="bold"
            >
              <HStack gap="1">
                <LuRefreshCw size={14} />
                <Text>{t("auth.verifyEmail.resendNow")}</Text>
              </HStack>
            </Button>
          )}
        </HStack>

        {/* Skip Link */}
        <Button
          variant="ghost"
          size="sm"
          px="3"
          py="1.5"
          borderRadius="xl"
          color="fg.muted"
          onClick={() => {
            setVerificationSkipped(true);
            navigate("/");
          }}
          fontSize="xs"
          fontWeight="medium"
        >
          {t("auth.verifyEmail.skip")}
        </Button>
      </Stack>
    </Box>
  );
};

export default VerifyEmail;
