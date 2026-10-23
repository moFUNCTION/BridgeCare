import type React from "react";
import {
  Dialog,
  Flex,
  Heading,
  Portal,
  Presence,
  Progress,
  Stack,
} from "@chakra-ui/react";
import type { Locale } from "../locale";
import { useComponentTranslations } from "./translations";

export interface LoadingDialogProgressItem {
  label: string;
  progress: number;
  ref?: string;
}

export interface LoadingDialogProps {
  open: boolean;
  progress?: LoadingDialogProgressItem[];
  /** Language for title (default: "en"). */
  lang?: Locale | null;
}

function UploadingRow({
  label,
  progress,
  itemKey,
}: LoadingDialogProgressItem & { itemKey: string }): React.ReactElement {
  const shownProgress = Math.round(progress);
  return (
    <Presence
      present
      key={itemKey}
      animationName={{
        _open: "slide-from-bottom, fade-in",
        _closed: "slide-to-bottom, fade-out",
      }}
      animationDuration="moderate"
    >
      <Progress.Root
        colorPalette="green"
        shape="full"
        size="lg"
        w="100%"
        p="2"
        value={shownProgress}
        overflow="none"
      >
        <Flex
          transition="0.3s"
          align="center"
          gap="5"
          borderWidth="1px"
          borderColor="fg.subtle"
          p="5"
          w="100%"
          borderRadius="lg"
          bgColor={shownProgress === 100 ? "bg.emphasized" : "orange.subtle"}
          wrap={{ base: "wrap", md: "nowrap" }}
        >
          <Progress.Label as="div">
            <Heading size="md">{label}</Heading>
          </Progress.Label>
          <Progress.Track w="100%" flex="1">
            <Progress.Range />
          </Progress.Track>
          <Progress.ValueText
            bgColor="green.solid"
            w="40px"
            h="40px"
            color="white"
            as={Flex}
            alignItems="center"
            justifyContent="center"
            borderRadius="full"
          >
            {shownProgress}
          </Progress.ValueText>
        </Flex>
      </Progress.Root>
    </Presence>
  );
}

export function LoadingDialog({
  open,
  progress = [],
  lang,
}: LoadingDialogProps): React.ReactElement {
  const t = useComponentTranslations(lang);
  const items = [...progress].reverse();
  return (
    <Dialog.Root
      open={open}
      size="full"
      placement="center"
      motionPreset="slide-in-bottom"
      scrollBehavior="inside"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content>
            <Dialog.Header>
              <Dialog.Title>{t.loading}</Dialog.Title>
            </Dialog.Header>
            <Dialog.Body>
              <Stack gap="3">
                {items.map((item, index) => (
                  <UploadingRow
                    key={item.ref ?? `item-${index}`}
                    itemKey={item.ref ?? `item-${index}`}
                    {...item}
                  />
                ))}
              </Stack>
            </Dialog.Body>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
}
