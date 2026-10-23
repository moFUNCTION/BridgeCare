import type React from "react";
import { useCallback, useEffect, useId, useMemo, useState } from "react";
import {
  Box,
  IconButton,
  Input,
  InputGroup,
  InputGroupProps,
  Popover,
  Portal,
} from "@chakra-ui/react";
import { DayPicker, type Matcher } from "react-day-picker";
import { addYears, format, isValid, parse, subYears } from "date-fns";
import { enUS, ar } from "date-fns/locale";
import { LuCalendar } from "react-icons/lu";
import { motion, AnimatePresence } from "framer-motion";
import type { Locale } from "../../locale";
import { useComponentTranslations } from "../translations";
import "react-day-picker/style.css";
import "./DatePicker.css";

const localeMap = { en: enUS, ar };

/** Customizable props for the calendar day picker. */
export interface DatePickerCalendarProps extends Omit<
  React.ComponentProps<typeof DayPicker>,
  "mode" | "selected" | "onSelect"
> {}

export interface DatePickerProps {
  /** Selected date (controlled) */
  value?: Date | null;
  /** Called when date changes */
  onChange?: (date: Date | null) => void;
  /** Placeholder text for the input */
  placeholder?: string;
  /** date-fns format string for display (e.g. "yyyy-MM-dd", "PP", "dd/MM/yyyy") */
  dateFormat?: string;
  /** Minimum selectable date */
  minDate?: Date;
  /** Maximum selectable date */
  maxDate?: Date;
  /** Disable specific dates */
  disabled?: Date[] | ((date: Date) => boolean);
  /** Size of the input and trigger */
  size?: "sm" | "md" | "lg" | "xl";
  /** Whether the picker is disabled */
  isDisabled?: boolean;
  /** Whether the field is invalid (shows error state) */
  invalid?: boolean;
  /** Language for placeholder and locale */
  lang?: Locale | null;
  /** Optional props forwarded to the trigger Input */
  InputProps?: Omit<React.ComponentProps<typeof Input>, "value" | "onChange">;
  /** Show calendar icon in the input */
  showCalendarIcon?: boolean;
  /** Allow typing date directly in the input */
  allowInput?: boolean;
  /** Props passed to the DayPicker calendar */
  calendarProps?: DatePickerCalendarProps;
  /** Custom class name for the calendar container */
  calendarClassName?: string;
  /** Whether to show week numbers */
  showWeekNumber?: boolean;
  /** Number of months to display (for range or multiple months) */
  numberOfMonths?: number;
  /** Chakra color palette for selected day accent (e.g. "blue", "green") */
  colorPalette?: string;
  /** Close popover when a date is selected (default: true) */
  closeOnSelect?: boolean;
  /** Configure as birth date input: maxDate=today, minDate=120 years ago, birth date placeholder */
  birthDate?: boolean;
  InputGroupProps?: InputGroupProps;
}

export function DatePicker({
  value = null,
  onChange,
  placeholder,
  dateFormat = "PP",
  minDate,
  maxDate,
  disabled,
  size = "md",
  isDisabled = false,
  invalid = false,
  lang,
  InputProps,
  showCalendarIcon = true,
  allowInput = true,
  calendarProps,
  calendarClassName,
  showWeekNumber = false,
  numberOfMonths = 1,
  colorPalette = "blue",
  closeOnSelect = true,
  birthDate = false,
  InputGroupProps,
}: DatePickerProps): React.ReactElement {
  const t = useComponentTranslations(lang);

  const effectiveMinDate = birthDate ? subYears(new Date(), 120) : minDate;
  const effectiveMaxDate = birthDate ? new Date() : maxDate;

  const dropdownStartMonth = effectiveMinDate ?? subYears(new Date(), 120);
  const dropdownEndMonth = effectiveMaxDate ?? addYears(new Date(), 20);
  const effectivePlaceholder = birthDate
    ? (placeholder ?? t.birthDatePlaceholder)
    : placeholder;
  const inputId = useId();
  const localeKey = lang ?? "en";
  const [month, setMonth] = useState<Date>(value ?? new Date());
  const [inputValue, setInputValue] = useState(() =>
    value ? format(value, dateFormat, { locale: localeMap[localeKey] }) : "",
  );

  const displayValue = value
    ? format(value, dateFormat, { locale: localeMap[localeKey] })
    : "";

  useEffect(() => {
    setInputValue(
      value ? format(value, dateFormat, { locale: localeMap[localeKey] }) : "",
    );
  }, [value, dateFormat, localeKey]);

  const handleDaySelect = useCallback(
    (date: Date | undefined) => {
      if (!date) {
        onChange?.(null);
        setInputValue("");
      } else {
        onChange?.(date);
        setInputValue(
          format(date, dateFormat, { locale: localeMap[lang ?? "en"] }),
        );
        setMonth(date);
      }
    },
    [onChange, dateFormat, lang],
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const raw = e.target.value;
      setInputValue(raw);
      const parsed = parse(raw, dateFormat, new Date(), {
        locale: localeMap[lang ?? "en"],
      });
      if (isValid(parsed)) {
        onChange?.(parsed);
        setMonth(parsed);
      } else if (raw === "") {
        onChange?.(null);
      }
    },
    [onChange, dateFormat, lang],
  );

  const locale = lang ? localeMap[lang] : enUS;
  const placeholderText = effectivePlaceholder ?? t.datePlaceholder;
  const [isOpen, setIsOpen] = useState(false);

  const handleDaySelectWithClose = useCallback(
    (date: Date | undefined) => {
      handleDaySelect(date);
      if (closeOnSelect && date) setIsOpen(false);
    },
    [handleDaySelect, closeOnSelect],
  );

  const disabledMatchers = useMemo<Matcher[]>(() => {
    const matchers: Matcher[] = [];

    if (effectiveMaxDate) {
      matchers.push({ after: effectiveMaxDate });
    }

    if (effectiveMinDate) {
      matchers.push({ before: effectiveMinDate });
    }

    if (disabled) {
      if (Array.isArray(disabled)) {
        matchers.push(...disabled);
      } else {
        matchers.push(disabled);
      }
    }

    return matchers;
  }, [effectiveMaxDate, effectiveMinDate, disabled]);

  return (
    <Popover.Root
      open={isOpen}
      onOpenChange={(e) => setIsOpen(e.open)}
      positioning={{
        placement: "bottom-start",
        sameWidth: true,
        gutter: 8,
      }}
      lazyMount
      unmountOnExit
    >
      <Popover.Trigger asChild>
        <InputGroup
          width="100%"
          endElement={
            showCalendarIcon && (
              <IconButton
                aria-label="Open calendar"
                variant="ghost"
                size={size as "sm" | "md" | "lg" | "xs"}
                pointerEvents="none"
              >
                <LuCalendar />
              </IconButton>
            )
          }
          {...InputGroupProps}
        >
          <Input
            id={inputId}
            value={allowInput ? inputValue : displayValue}
            onChange={allowInput ? handleInputChange : undefined}
            onFocus={(e) => {
              if (!allowInput) {
                e.currentTarget.blur();
              }
              InputProps?.onFocus?.(e);
            }}
            placeholder={placeholderText}
            readOnly={!allowInput}
            cursor={allowInput ? undefined : "pointer"}
            borderColor={invalid ? "red.500" : undefined}
            disabled={isDisabled}
            size={size}
            {...InputProps}
          />
        </InputGroup>
      </Popover.Trigger>
      <Portal>
        <Popover.Positioner>
          <Popover.Content
            p="0"
            overflow="hidden"
            className="date-picker-content-open"
          >
            <Popover.Arrow>
              <Popover.ArrowTip />
            </Popover.Arrow>
            <Popover.Body p="0">
              <AnimatePresence mode="wait">
                <motion.div
                  key={month.getTime()}
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 4 }}
                  transition={{ duration: 0.15 }}
                >
                  <Box
                    className={`date-picker-calendar ${calendarClassName ?? ""}`.trim()}
                    dir="ltr"
                    style={
                      {
                        "--datepicker-accent": `var(--chakra-colors-${colorPalette}-500)`,
                        "--datepicker-accent-bg": `var(--chakra-colors-${colorPalette}-100)`,
                        "--datepicker-accent-hover": `var(--chakra-colors-${colorPalette}-600)`,
                      } as React.CSSProperties
                    }
                  >
                    <DayPicker
                      mode="single"
                      month={month}
                      onMonthChange={setMonth}
                      selected={value ?? undefined}
                      onSelect={handleDaySelectWithClose}
                      locale={locale}
                      disabled={disabledMatchers}
                      fromDate={effectiveMinDate}
                      toDate={effectiveMaxDate}
                      showWeekNumber={showWeekNumber}
                      numberOfMonths={numberOfMonths}
                      animate
                      defaultMonth={value ?? subYears(new Date(), 25)}
                      captionLayout="dropdown"
                      startMonth={dropdownStartMonth}
                      endMonth={dropdownEndMonth}
                      reverseYears
                      {...calendarProps}
                    />
                  </Box>
                </motion.div>
              </AnimatePresence>
            </Popover.Body>
          </Popover.Content>
        </Popover.Positioner>
      </Portal>
    </Popover.Root>
  );
}
