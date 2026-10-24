import React, { useState } from "react";
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
} from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import {
  LuCreditCard,
  LuDownload,
  LuTrendingDown,
  LuCheck,
  LuClock,
  LuShieldCheck,
  LuReceipt,
  LuSparkles,
  LuFileText,
  LuPrinter,
} from "react-icons/lu";

interface Invoice {
  id: string;
  date: string;
  doctor: string;
  doctorLicense: string;
  desc: string;
  amount: number;
  status: "Paid" | "Pending" | "Refunded";
  dossierAttached: boolean;
  savingsGenerated: number;
}

export const Billing: React.FC = () => {
  const { t } = useTranslation();

  const [savedSessions, setSavedSessions] = useState(4);
  const avgSessionRate = 120;
  const totalSaved = savedSessions * avgSessionRate;
  const minutesSaved = savedSessions * 50;

  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

  const invoices: Invoice[] = [
    {
      id: "INV-2026-08",
      date: "Oct 20, 2026",
      doctor: "Dr. Tarek Al-Mansouri",
      doctorLicense: "MED-PSY-84920",
      desc: "Follow-Up Telehealth (Session 8) - Dr. Tarek Al-Mansouri",
      amount: 120,
      status: "Paid",
      dossierAttached: true,
      savingsGenerated: 120,
    },
    {
      id: "INV-2026-01",
      date: "Sep 15, 2026",
      doctor: "Dr. Tarek Al-Mansouri",
      doctorLicense: "MED-PSY-84920",
      desc: "Active Launch Session (With Pre-Session Dossier)",
      amount: 120,
      status: "Paid",
      dossierAttached: true,
      savingsGenerated: 480,
    },
    {
      id: "INV-2026-DOS",
      date: "Sep 14, 2026",
      doctor: "BridgeCare Clinical AI Compiler",
      doctorLicense: "SYS-AI-VAL-01",
      desc: "Pre-Session Clinical Dossier Automated Synthesis (Groq llama-3.3-70b)",
      amount: 0,
      status: "Paid",
      dossierAttached: true,
      savingsGenerated: 450,
    },
  ];

  const handleDownloadReceipt = (inv: Invoice) => {
    const receiptContent = `
=====================================================
          BRIDGECARE TELEHEALTH RECEIPT
=====================================================
Receipt Number: ${inv.id}
Date: ${inv.date}
Status: ${inv.status}
Patient ID: Encrypted Vault (Zero Identity Leakage)
Licensed Provider: ${inv.doctor}
Medical License: ${inv.doctorLicense}
-----------------------------------------------------
Service Description:
${inv.desc}

Itemized Breakdown:
- 50-Min Encrypted Telehealth Consultation: $${inv.amount}.00
- Pre-Session Clinical Brief Transmission: INCLUDED ($0.00)
- Longitudinal AI Context Continuity: INCLUDED ($0.00)
-----------------------------------------------------
Total Paid: $${inv.amount}.00 USD
Estimated Clinical Intake Savings: $${inv.savingsGenerated}.00 USD
Bypassed Exploratory Sessions: ${Math.round(inv.savingsGenerated / 120)} Sessions

Payment Method: Visa ending in 4242
HSA / FSA Eligible Telehealth Consultation
Security: End-to-End Encrypted HIPAA Telehealth
=====================================================
`;

    const blob = new Blob([receiptContent], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `BridgeCare_Receipt_${inv.id}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

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
              <Badge colorPalette="orange" size="sm" px="2.5" py="0.5" borderRadius="full">
                Pillar 3
              </Badge>
            </HStack>
            <Text fontSize="sm" color="fg.muted">
              {t("billing.subtitle")}
            </Text>
          </Stack>

          {/* Interactive Financial Savings Calculator Widget */}
          <Box
            p={{ base: "6", md: "8" }}
            borderRadius="3xl"
            bg="linear-gradient(135deg, rgba(22, 163, 74, 0.08) 0%, rgba(234, 88, 12, 0.06) 100%)"
            borderWidth="1px"
            borderColor="green.500/30"
            boxShadow="sm"
          >
            <Flex
              direction={{ base: "column", md: "row" }}
              justify="space-between"
              align={{ base: "start", md: "center" }}
              gap="6"
            >
              <Stack gap="2.5" maxW="lg">
                <HStack gap="2">
                  <LuTrendingDown size={22} color="#16a34a" />
                  <Text fontSize="lg" fontWeight="bold">
                    {t("billing.calculatorTitle")}
                  </Text>
                </HStack>
                <Text fontSize="xs" color="fg.muted" lineHeight="tall">
                  {t("billing.calculatorDesc")}
                </Text>

                {/* Interactive Bypassed Sessions Selector */}
                <Box pt="2">
                  <Text fontSize="xs" fontWeight="semibold" mb="2">
                    {t("billing.bypassedLabel")}
                  </Text>
                  <HStack gap="2" wrap="wrap">
                    {[2, 3, 4, 5, 6].map((num) => (
                      <Button
                        key={num}
                        size="xs"
                        px="3"
                        py="1.5"
                        borderRadius="full"
                        fontSize="xs"
                        fontWeight="semibold"
                        variant={savedSessions === num ? "solid" : "outline"}
                        colorPalette="green"
                        onClick={() => setSavedSessions(num)}
                      >
                        {t("billing.sessionsCount", { count: num })}
                      </Button>
                    ))}
                  </HStack>
                </Box>
              </Stack>

              {/* Savings Total Display Box */}
              <Box
                p="6"
                borderRadius="2xl"
                bg="bg.panel"
                borderWidth="1px"
                borderColor="green.500/30"
                textAlign="center"
                minW={{ base: "100%", md: "240px" }}
                boxShadow="md"
              >
                <Text fontSize="2xs" color="fg.muted" fontWeight="medium">
                  {t("billing.savingsBoxTitle")}
                </Text>
                <Text fontSize="3xl" fontWeight="black" color="green.600" my="1">
                  ${totalSaved}
                </Text>
                <Badge
                  colorPalette="green"
                  size="xs"
                  px="2.5"
                  py="0.5"
                  borderRadius="full"
                  fontSize="2xs"
                  fontWeight="semibold"
                >
                  {t("billing.minutesSaved", { mins: minutesSaved })}
                </Badge>
                <Text fontSize="2xs" color="fg.muted" mt="2">
                  ~{(minutesSaved / 60).toFixed(1)} hours of clinical time saved
                </Text>
              </Box>
            </Flex>
          </Box>

          {/* Traditional vs BridgeCare Comparison Breakdown */}
          <Grid templateColumns={{ base: "1fr", md: "1fr 1fr" }} gap="4">
            <Box p="5" borderRadius="2xl" bg="bg.panel" borderWidth="1px" borderColor="red.500/20">
              <Stack gap="2">
                <HStack gap="2">
                  <Badge colorPalette="red" size="xs">
                    Traditional Therapy Route
                  </Badge>
                </HStack>
                <Text fontSize="sm" fontWeight="bold">
                  3–5 Introductory Intake Sessions ($450–$600)
                </Text>
                <Text fontSize="2xs" color="fg.muted" lineHeight="relaxed">
                  Patients spend weeks repeating backstories, childhood memories, and recent triggers before any prescription or active intervention starts. Over 40% of patients drop out from financial exhaustion.
                </Text>
              </Stack>
            </Box>

            <Box p="5" borderRadius="2xl" bg="bg.panel" borderWidth="1px" borderColor="green.500/25">
              <Stack gap="2">
                <HStack gap="2">
                  <Badge colorPalette="green" size="xs">
                    BridgeCare Telehealth Route
                  </Badge>
                </HStack>
                <Text fontSize="sm" fontWeight="bold" color="green.600">
                  Direct Treatment in Session 1 ($120 Flat)
                </Text>
                <Text fontSize="2xs" color="fg.muted" lineHeight="relaxed">
                  Your Pre-Session Clinical Dossier is synthesized from your AI daily venting and cognitive game telemetry. Your licensed psychiatrist reviews it before the call and launches immediate therapy.
                </Text>
              </Stack>
            </Box>
          </Grid>

          {/* Invoices List */}
          <Stack gap="4">
            <Flex justify="space-between" align="center">
              <Text fontSize="md" fontWeight="bold">
                {t("billing.invoiceHistory")}
              </Text>
              <Badge colorPalette="green" size="xs" px="2" py="0.5" borderRadius="full">
                HSA/FSA Eligible
              </Badge>
            </Flex>

            {invoices.map((inv) => (
              <Box
                key={inv.id}
                p="5"
                borderRadius="2xl"
                bg="bg.panel"
                borderWidth="1px"
                borderColor="border.subtle"
                _hover={{ borderColor: "orange.500/30" }}
                transition="all 0.2s"
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
                      <Badge
                        colorPalette="green"
                        size="xs"
                        px="2"
                        py="0.5"
                        borderRadius="full"
                        fontSize="2xs"
                        fontWeight="semibold"
                      >
                        {inv.status}
                      </Badge>
                      {inv.dossierAttached && (
                        <Badge colorPalette="teal" size="xs" px="1.5" py="0" borderRadius="md">
                          Dossier Attached
                        </Badge>
                      )}
                    </HStack>
                    <Text fontSize="xs" color="fg.muted">
                      {inv.desc} • {inv.date}
                    </Text>
                  </Stack>

                  <HStack gap="4">
                    <Stack gap="0" textAlign="right">
                      <Text fontSize="md" fontWeight="bold">
                        ${inv.amount}
                      </Text>
                      {inv.savingsGenerated > 0 && (
                        <Text fontSize="2xs" color="green.600" fontWeight="bold">
                          Saved ${inv.savingsGenerated}
                        </Text>
                      )}
                    </Stack>

                    <Button
                      size="xs"
                      px="2.5"
                      py="1.5"
                      borderRadius="xl"
                      fontSize="xs"
                      fontWeight="medium"
                      variant="outline"
                      colorPalette="orange"
                      onClick={() => setSelectedInvoice(inv)}
                    >
                      <HStack gap="1">
                        <LuReceipt size={13} />
                        <Text>{t("billing.receiptBtn")}</Text>
                      </HStack>
                    </Button>
                  </HStack>
                </Flex>
              </Box>
            ))}
          </Stack>

          {/* Receipt Modal */}
          {selectedInvoice && (
            <Box
              position="fixed"
              inset="0"
              bg="black/70"
              backdropFilter="blur(6px)"
              zIndex={2000}
              display="flex"
              alignItems="center"
              justifyContent="center"
              p="4"
            >
              <Box
                maxW="md"
                w="100%"
                bg="bg.panel"
                borderRadius="3xl"
                p="6"
                borderWidth="1px"
                borderColor="orange.500/30"
                boxShadow="2xl"
              >
                <Stack gap="4">
                  <Flex justify="space-between" align="center">
                    <HStack gap="2">
                      <LuReceipt size={20} color="#ea580c" />
                      <Text fontSize="md" fontWeight="bold">
                        Telehealth Receipt {selectedInvoice.id}
                      </Text>
                    </HStack>
                    <Badge colorPalette="green" size="xs">
                      {selectedInvoice.status}
                    </Badge>
                  </Flex>

                  <Box p="4" borderRadius="2xl" bg="bg.subtle" borderWidth="1px" borderColor="border.subtle">
                    <Stack gap="2" fontSize="xs">
                      <HStack justify="space-between">
                        <Text color="fg.muted">Service Date:</Text>
                        <Text fontWeight="semibold">{selectedInvoice.date}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text color="fg.muted">Clinician:</Text>
                        <Text fontWeight="semibold">{selectedInvoice.doctor}</Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text color="fg.muted">License #:</Text>
                        <Text fontWeight="semibold">{selectedInvoice.doctorLicense}</Text>
                      </HStack>
                      <HStack justify="space-between" pt="2" borderTopWidth="1px" borderColor="border.subtle">
                        <Text fontWeight="bold">Total Amount Paid:</Text>
                        <Text fontWeight="black" fontSize="sm">
                          ${selectedInvoice.amount}.00 USD
                        </Text>
                      </HStack>
                      <HStack justify="space-between">
                        <Text color="green.600" fontWeight="bold">
                          Direct Intake Savings:
                        </Text>
                        <Text color="green.600" fontWeight="black">
                          ${selectedInvoice.savingsGenerated}.00 USD
                        </Text>
                      </HStack>
                    </Stack>
                  </Box>

                  <Flex justify="flex-end" gap="2">
                    <Button size="sm" variant="subtle" onClick={() => setSelectedInvoice(null)}>
                      Close
                    </Button>
                    <Button
                      size="sm"
                      bg="linear-gradient(135deg, #f97316 0%, #ea580c 100%)"
                      color="white"
                      borderRadius="xl"
                      onClick={() => handleDownloadReceipt(selectedInvoice)}
                    >
                      <HStack gap="1.5">
                        <LuDownload size={14} />
                        <Text>Download Receipt</Text>
                      </HStack>
                    </Button>
                  </Flex>
                </Stack>
              </Box>
            </Box>
          )}
        </Stack>
      </Container>
    </Box>
  );
};

export default Billing;
