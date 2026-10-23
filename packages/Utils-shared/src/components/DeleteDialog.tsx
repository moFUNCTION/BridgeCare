import type React from "react";
import { Dialog, Button, Text } from "@chakra-ui/react";

export interface DeleteDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit?: () => void;
  loading?: boolean;
  deleteModalHeaderLabel: string;
  DeleteShape?: React.ReactNode;
  deleteModalText: string;
  cancelText: string;
  deleteBtnText: string;
}

/**
 * Delete confirmation dialog (Chakra UI). Requires @chakra-ui/react.
 */
export function DeleteDialog({
  open,
  onOpenChange,
  onSubmit = () => {},
  loading = false,
  deleteModalHeaderLabel,
  DeleteShape,
  deleteModalText,
  cancelText,
  deleteBtnText,
}: DeleteDialogProps): React.ReactElement {
  return (
    <Dialog.Root open={open} onOpenChange={(e) => onOpenChange(e.open)}>
      <Dialog.Backdrop />
      <Dialog.Positioner>
        <Dialog.Content>
          <Dialog.Header>
            <Text w="100%" textAlign="center" fontSize="xl" fontWeight="bold">
              {deleteModalHeaderLabel}
            </Text>
          </Dialog.Header>
          <Dialog.Body>
            {DeleteShape}
            <Text textAlign="center">{deleteModalText}</Text>
          </Dialog.Body>
          <Dialog.Footer display="flex" justifyContent="flex-end" gap={2}>
            <Button
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              {cancelText}
            </Button>
            <Button colorPalette="red" onClick={onSubmit} loading={loading}>
              {deleteBtnText}
            </Button>
          </Dialog.Footer>
        </Dialog.Content>
      </Dialog.Positioner>
    </Dialog.Root>
  );
}
