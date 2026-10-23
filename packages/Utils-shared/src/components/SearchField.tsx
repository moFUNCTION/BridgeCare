import type React from "react";
import { useEffect, useState } from "react";
import {
  Box,
  Button,
  CloseButton,
  Dialog,
  IconButton,
  Input,
  InputGroup,
  Pagination,
  Portal,
  ButtonGroup,
  Stack,
  Heading,
  InputGroupProps,
} from "@chakra-ui/react";
import { CiSearch } from "react-icons/ci";
import { LuChevronLeft, LuChevronRight } from "react-icons/lu";
import { useAnimatedHeightByCount } from "@repo/hooks-shared";
import type { Locale } from "../locale";
import { useComponentTranslations } from "./translations";

export interface SearchFieldProps<
  T extends Record<string, unknown> = Record<string, unknown>,
> {
  placeholder?: string;
  Data?: T[];
  searchField?: keyof T | string;
  SearchItem?: React.ComponentType<{ onSelect: () => void } & T>;
  onSelect?: (item: T) => void;
  itemsPerPageCount?: number;
  isOpen?: boolean;
  onClose?: () => void;
  onOpen?: () => void;
  /** Language for labels (default: "en"). */
  lang?: Locale | null;
  /** Optional props forwarded to the trigger input. */
  InputProps?: React.ComponentProps<typeof Input>;
  InputContainerProps?: InputGroupProps;
  withSearchButtonIcon: boolean;
}

export function SearchField<T extends Record<string, unknown>>({
  placeholder,
  Data = [],
  searchField = "name" as keyof T,
  SearchItem = () => null,
  onSelect,
  itemsPerPageCount = 5,
  isOpen,
  onClose,
  onOpen,
  lang,
  InputProps,
  InputContainerProps,
  withSearchButtonIcon,
}: SearchFieldProps<T>): React.ReactElement {
  const t = useComponentTranslations(lang);
  const placeholderText = placeholder ?? t.searchPlaceholder;
  const [currentPage, setCurrentPage] = useState(1);
  const [input, setInput] = useState<string>("");

  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = typeof isOpen !== "undefined";
  const openState = isControlled ? isOpen : internalOpen;

  const handleOpen = () => {
    if (!isControlled) setInternalOpen(true);
    onOpen?.();
  };

  const handleClose = () => {
    if (!isControlled) setInternalOpen(false);
    onClose?.();
  };

  const searchResults = input
    ? Data.filter((item) => {
        const val = item[searchField as keyof T];
        return (
          val != null && String(val).toLowerCase().includes(input.toLowerCase())
        );
      })
    : Data;

  useEffect(() => {
    setCurrentPage(1);
  }, [input]);

  const start = (currentPage - 1) * itemsPerPageCount;
  const paginatedData = searchResults.slice(start, start + itemsPerPageCount);

  const height = useAnimatedHeightByCount({
    itemCount: paginatedData.length,
    itemHeight: 65,
    spacing: 8,
    extra: 16,
  });

  const SearchItemComponent = SearchItem;

  return (
    <Dialog.Root
      open={openState}
      onOpenChange={({ open }) => (open ? handleOpen() : handleClose())}
      scrollBehavior="inside"
      motionPreset="slide-in-bottom"
      placement="center"
      size="lg"
    >
      <Dialog.Trigger asChild>
        <InputGroup
          endAddon={
            withSearchButtonIcon && (
              <IconButton
                size={InputProps?.size}
                variant="ghost"
                aria-label="Search"
              >
                <CiSearch />
              </IconButton>
            )
          }
          endAddonProps={{ bgColor: "transparent", border: "none" }}
          {...InputContainerProps}
        >
          <Input
            onClick={onOpen}
            size="lg"
            placeholder={placeholderText}
            readOnly
            {...InputProps}
          />
        </InputGroup>
      </Dialog.Trigger>
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner
          w="calc(100% - 10px)"
          left="50%"
          transform="translate(-50% , 0)"
        >
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{placeholderText}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <InputGroup
                endAddon={
                  <IconButton variant="ghost" size="lg" aria-label="Search">
                    <CiSearch />
                  </IconButton>
                }
                endAddonProps={{ bgColor: "transparent", border: "none" }}
                mb="6"
              >
                <Input
                  onChange={(e) => setInput(e.target.value)}
                  value={input}
                  size="xl"
                  placeholder={t.searchPlaceholder}
                />
              </InputGroup>
              {paginatedData.length === 0 && (
                <Heading
                  bgColor={{
                    _light: "blackAlpha.100",
                    _dark: "whiteAlpha.100",
                  }}
                  px="5"
                  py="3"
                  borderRadius="lg"
                  display="flex"
                  gap="3"
                  justifyContent="center"
                  alignItems="center"
                >
                  {t.noResults} <CiSearch />
                </Heading>
              )}
              <Stack h={height} transition="0.3s" gap="3" overflow="hidden">
                {paginatedData.map((item, index) => (
                  <SearchItemComponent
                    key={String(item[searchField as keyof T] ?? index)}
                    {...item}
                    onSelect={() => {
                      onSelect?.(item);
                      handleClose();
                    }}
                  />
                ))}
              </Stack>
              <Pagination.Root
                className="en"
                dir="ltr"
                onPageChange={({ page }) => setCurrentPage(page)}
                page={currentPage}
                m="0 auto"
                mt="5"
                count={searchResults.length}
                pageSize={itemsPerPageCount}
                defaultPage={1}
              >
                <ButtonGroup
                  className="en"
                  dir="ltr"
                  variant="ghost"
                  size={{ base: "xl", md: "md", lg: "lg" }}
                  w="100%"
                  justify="center"
                >
                  <Pagination.PrevTrigger asChild>
                    <IconButton aria-label="Previous page">
                      <LuChevronLeft />
                    </IconButton>
                  </Pagination.PrevTrigger>

                  <Box display={{ mdDown: "none" }}>
                    <Pagination.Items
                      render={(page) => (
                        <IconButton
                          variant={{ base: "ghost", _selected: "outline" }}
                          aria-label={`Page ${page.value}`}
                        >
                          {page.value}
                        </IconButton>
                      )}
                    />
                  </Box>
                  <Pagination.NextTrigger asChild>
                    <IconButton aria-label="Next page">
                      <LuChevronRight />
                    </IconButton>
                  </Pagination.NextTrigger>
                </ButtonGroup>
              </Pagination.Root>
            </Dialog.Body>
            <Dialog.Footer>
              <Dialog.ActionTrigger asChild>
                <Button variant="outline" colorPalette="red">
                  {t.close}
                </Button>
              </Dialog.ActionTrigger>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
