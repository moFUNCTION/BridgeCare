import { Button, Field, Flex, Text } from "@chakra-ui/react";
import { subjects, type SubjectOption } from "@repo/data-shared";
import type { Locale } from "../locale";
import { SearchField } from "./SearchField";

export type SubjectValue = { ar: string; en: string };

export interface SubjectFieldProps {
  value?: SubjectValue | null;
  onChange?: (value: SubjectValue) => void;
  onClear?: () => void;
  label?: string;
  placeholder?: string;
  helperText?: string;
  clearLabel?: string;
  selectLabel?: string;
  lang?: Locale | null;
  invalid?: boolean;
  errorText?: string;
}

function SubjectItem(props: SubjectOption & { onSelect: () => void; selectLabel: string }) {
  const { name, nameEnglish, emoji, onSelect, selectLabel } = props;
  return (
    <Flex
      px="4"
      py="3"
      borderWidth="1px"
      borderRadius="lg"
      justify="space-between"
      align="center"
      gap="3"
      bg="white"
    >
      <Text fontWeight="semibold">
        {name} / {nameEnglish} {emoji}
      </Text>
      <Button size="sm" onClick={onSelect} colorPalette="blue">
        {selectLabel}
      </Button>
    </Flex>
  );
}

export function SubjectField({
  value,
  onChange,
  onClear,
  label,
  placeholder,
  helperText,
  clearLabel = "Clear",
  selectLabel = "Select",
  lang,
  invalid,
  errorText,
}: SubjectFieldProps) {
  const effectiveLabel = label ?? (lang === "ar" ? "المادة التعليمية" : "Subject");
  const effectivePlaceholder =
    placeholder ?? (lang === "ar" ? "ابحث عن المادة التعليمية" : "Search subject");
  const effectiveHelperText =
    helperText ??
    (lang === "ar"
      ? "اختر المادة التي سيتم تدريسها في المنصة."
      : "Choose the subject taught on this platform.");

  return (
    <Field.Root invalid={invalid}>
      <Field.Label>{effectiveLabel}</Field.Label>
      <SearchField
        lang={lang}
        withSearchButtonIcon
        Data={subjects}
        searchField={lang === "ar" ? "name" : "nameEnglish"}
        placeholder={effectivePlaceholder}
        onSelect={(item) =>
          onChange?.({
            ar: item.name,
            en: item.nameEnglish,
          })
        }
        SearchItem={(item) => <SubjectItem {...item} selectLabel={selectLabel} />}
      />
      <Field.HelperText>{effectiveHelperText}</Field.HelperText>
      {value?.ar ? (
        <Flex
          justify="space-between"
          align="center"
          borderWidth="1px"
          borderColor="gray.200"
          bg="white"
          borderRadius="lg"
          px="4"
          py="3"
          mt="2"
        >
          <Flex align="center" gap="3">
            <Flex
              w="10"
              h="10"
              borderRadius="md"
              bg="blue.50"
              color="blue.600"
              align="center"
              justify="center"
              fontSize="lg"
              fontWeight="bold"
              textTransform="uppercase"
            >
              {value.en.charAt(0)}
            </Flex>
            <Flex direction="column" gap="0.5">
              <Text fontSize="sm" fontWeight="medium" color="gray.900">
                {lang === "ar" ? value.ar : value.en}
              </Text>
              <Text fontSize="xs" color="gray.500">
                {lang === "ar" ? value.en : value.ar}
              </Text>
            </Flex>
          </Flex>
          <Button
            size="sm"
            variant="ghost"
            colorPalette="red"
            onClick={() => {
              onClear?.();
              onChange?.({ ar: "", en: "" });
            }}
          >
            {clearLabel}
          </Button>
        </Flex>
      ) : null}
      {errorText ? <Field.ErrorText>{errorText}</Field.ErrorText> : null}
    </Field.Root>
  );
}

