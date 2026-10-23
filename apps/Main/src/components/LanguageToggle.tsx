import React from "react";
import { Button, HStack, Text } from "@chakra-ui/react";
import { useTranslation } from "react-i18next";
import { LuLanguages } from "react-icons/lu";

export const LanguageToggle: React.FC = () => {
  const { i18n } = useTranslation();
  const currentLang = i18n.language.startsWith("ar") ? "ar" : "en";

  const handleToggle = () => {
    const nextLang = currentLang === "ar" ? "en" : "ar";
    void i18n.changeLanguage(nextLang);
  };

  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={handleToggle}
      borderRadius="full"
      px="3"
      borderWidth="1px"
      borderColor="border.subtle"
      _hover={{ borderColor: "orange.500", bg: "orange.subtle" }}
      aria-label="Switch Language"
    >
      <HStack gap="2">
        <LuLanguages />
        <Text fontSize="xs" fontWeight="semibold">
          {currentLang === "ar" ? "English" : "العربية"}
        </Text>
      </HStack>
    </Button>
  );
};

export default LanguageToggle;
