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
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import {
  LuCreditCard,
  LuDownload,
  LuTrendingDown,
} from "react-icons/lu";

export const Billing: React.FC = () => {
  const { t } = useTranslation();

  const [savedSessions, setSavedSessions] = useState(4);
  const avgSessionRate = 120;
  const totalSaved = savedSessions * avgSessionRate;

  const invoices = [
    {
      id: "INV-2026-08",
      date: "Oct 20, 2026",
      desc: "Follow-Up Telehealth (Session 8) - Dr. Tarek Al-Mansouri",
      amount: 120,
      status: "Paid",
    },
    {
      id: "INV-2026-01",
      date: "Sep 15, 2026",
      desc: "Active Launch Session (With Pre-Session Dossier)",
      amount: 120,
      status: "Paid",
    },
  ];

  return (
    <Box minH="100vh" bg="bg" color="fg" py="8" px={{ base: "4", md: "8" }}>
      <Container maxW="5xl">
        <Stack gap="8">
          {/* Header */}
          <Stack gap="1">
            <HStack gap="2">
              <LuCreditCard size={22} color="#ea580c" />
              <Text fontSize="2xl" fontWeight="bold">
                {t("billing.title")}
              </Text>
            </HStack>
            <Text fontSize="sm" color="fg.muted">
              {t("billing.subtitle")}
            </Text>
          </Stack>

          {/* Savings Calculator Widget */}
          <Box
            p={{ base: "6", md: "8" }}
            borderRadius="3xl"
            bg="linear-gradient(135deg, rgba(22, 163, 74, 0.08) 0%, rgba(234, 88, 12, 0.05) 100%)"
            borderWidth="1px"
            borderColor="green.500/30"
          >
            <Flex
              direction={{ base: "column", md: "row" }}
              justify="space-between"
              align={{ base: "start", md: "center" }}
              gap="6"
            >
              <Stack gap="2" maxW="lg">
                <HStack gap="2">
                  <LuTrendingDown size={20} color="#16a34a" />
                  <Text fontSize="lg" fontWeight="bold">
                    {t("billing.calculatorTitle")}
                  </Text>
                </HStack>
                <Text fontSize="xs" color="fg.muted" lineHeight="tall">
                  {t("billing.calculatorDesc")}
                </Text>

                <HStack gap="2" pt="2">
                  <Text fontSize="xs" fontWeight="semibold">
                    {t("billing.bypassedLabel")}
                  </Text>
                  {[3, 4, 5].map((num) => (
                    <Button
                      key={num}
                      size="2xs"
                      variant={savedSessions === num ? "solid" : "outline"}
                      colorPalette="green"
                      borderRadius="full"
                      onClick={() => setSavedSessions(num)}
                    >
                      {t("billing.sessionsCount", { count: num })}
                    </Button>
                  ))}
                </HStack>
              </Stack>

              <Box
                p="6"
                borderRadius="2xl"
                bg="bg.panel"
                borderWidth="1px"
                borderColor="green.500/30"
                textAlign="center"
                minW="220px"
              >
                <Text fontSize="2xs" color="fg.muted">
                  {t("billing.savingsBoxTitle")}
                </Text>
                <Text fontSize="3xl" fontWeight="black" color="green.600" my="1">
                  ${totalSaved}
                </Text>
                <Badge colorPalette="green" size="xs">
                  {t("billing.minutesSaved", { mins: savedSessions * 50 })}
                </Badge>
              </Box>
            </Flex>
          </Box>

          {/* Invoices List */}
          <Stack gap="4">
            <Text fontSize="md" fontWeight="bold">
              {t("billing.invoiceHistory")}
            </Text>

            {invoices.map((inv) => (
              <Box
                key={inv.id}
                p="5"
                borderRadius="2xl"
                bg="bg.panel"
                borderWidth="1px"
                borderColor="border.subtle"
              >
                <Flex
                  direction={{ base: "column", sm: "row" }}
                  justify="space-between"
                  align={{ base: "start", sm: "center" }}
                  gap="3"
                >
                  <Stack gap="1">
                    <HStack gap="2">
                      <Text fontSize="sm" fontWeight="bold">
                        {inv.id}
                      </Text>
                      <Badge colorPalette="green" size="xs">
                        {inv.status}
                      </Badge>
                    </HStack>
                    <Text fontSize="xs" color="fg.muted">
                      {inv.desc} • {inv.date}
                    </Text>
                  </Stack>

                  <HStack gap="4">
                    <Text fontSize="md" fontWeight="bold">
                      ${inv.amount}
                    </Text>
                    <Button
                      size="xs"
                      variant="outline"
                      borderRadius="xl"
                      onClick={() => alert(t("billing.downloadAlert"))}
                    >
                      <HStack gap="1">
                        <LuDownload size={13} />
                        <Text>{t("billing.receiptBtn")}</Text>
                      </HStack>
                    </Button>
                  </HStack>
                </Flex>
              </Box>
            ))}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
};

export default Billing;
