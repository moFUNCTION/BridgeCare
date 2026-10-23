import React from 'react';
import { Button, Dialog } from '@chakra-ui/react';
import { LogoProvider } from './LogoMakerContext';
import { LogoMakerContent } from './LogoMakerContent';
import { useComponentTranslations } from '../translations';

export interface LogoMakerProps {
  label?: string;
  buttonProps?: React.ComponentProps<typeof Button>;
  onSave?: (dataUrl: string) => void;
  lang?: any; // Using any or importing Locale
}

export const LogoMaker = ({ label, buttonProps, onSave, lang }: LogoMakerProps) => {
  const [open, setOpen] = React.useState(false);
  const t = useComponentTranslations(lang).logoMaker;
  const finalLabel = label || t.openLogoMaker;

  const handleSave = (dataUrl: string) => {
    if (onSave) onSave(dataUrl);
    setOpen(false);
  };

  return (
    <Dialog.Root size="xl" placement="center" scrollBehavior="inside" open={open} onOpenChange={(e) => setOpen(e.open)}>
      <Dialog.Trigger asChild>
        <Button colorPalette="blue" {...buttonProps}>
          {finalLabel}
        </Button>
      </Dialog.Trigger>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content maxW="1000px" h="80vh" overflow="hidden" p="0" borderRadius="xl">
        <Dialog.CloseTrigger position="absolute" top="4" right="4" zIndex="10" bg="white" rounded="full" boxShadow="sm" />
        <Dialog.Body p="0" h="100%">
          <LogoProvider lang={lang}>
            <LogoMakerContent onSave={onSave ? handleSave : undefined} />
          </LogoProvider>
        </Dialog.Body>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
};
