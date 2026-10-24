import * as React from "react";
import {
  ScrollArea as ChakraScrollArea,
  type ScrollAreaRootProps as ChakraScrollAreaRootProps,
  type ScrollAreaViewportProps as ChakraScrollAreaViewportProps,
  type ScrollAreaScrollbarProps as ChakraScrollAreaScrollbarProps,
  type ScrollAreaThumbProps as ChakraScrollAreaThumbProps,
} from "@chakra-ui/react";

export interface ScrollAreaRootProps extends ChakraScrollAreaRootProps {}
export interface ScrollAreaViewportProps extends ChakraScrollAreaViewportProps {}
export interface ScrollAreaScrollbarProps extends ChakraScrollAreaScrollbarProps {}
export interface ScrollAreaThumbProps extends ChakraScrollAreaThumbProps {}

export const ScrollAreaRoot = React.forwardRef<HTMLDivElement, ScrollAreaRootProps>(
  function ScrollAreaRoot({ children, ...props }, ref) {
    return (
      <ChakraScrollArea.Root
        ref={ref}
        position="relative"
        overflow="hidden"
        {...props}
      >
        {children}
      </ChakraScrollArea.Root>
    );
  }
);

export const ScrollAreaViewport = React.forwardRef<HTMLDivElement, ScrollAreaViewportProps>(
  function ScrollAreaViewport({ children, css, ...props }, ref) {
    return (
      <ChakraScrollArea.Viewport
        ref={ref}
        w="100%"
        h="100%"
        borderRadius="inherit"
        css={{
          scrollbarWidth: "none",
          "&::-webkit-scrollbar": { display: "none" },
          msOverflowStyle: "none",
          ...css,
        }}
        {...props}
      >
        {children}
      </ChakraScrollArea.Viewport>
    );
  }
);

export const ScrollAreaContent = ChakraScrollArea.Content;
export const ScrollAreaCorner = ChakraScrollArea.Corner;

export const ScrollAreaThumb = React.forwardRef<
  HTMLDivElement,
  ScrollAreaThumbProps & { orientation?: "horizontal" | "vertical" }
>(function ScrollAreaThumb({ orientation = "vertical", ...props }, ref) {
  const isHorizontal = orientation === "horizontal";
  return (
    <ChakraScrollArea.Thumb
      ref={ref}
      borderRadius="full"
      h={isHorizontal ? "100%" : undefined}
      w={!isHorizontal ? "100%" : undefined}
      bg="orange.500/60"
      _hover={{ bg: "orange.500" }}
      cursor="pointer"
      transition="background-color 150ms ease"
      {...props}
    />
  );
});

export const ScrollAreaScrollbar = React.forwardRef<HTMLDivElement, ScrollAreaScrollbarProps>(
  function ScrollAreaScrollbar({ orientation = "vertical", children, ...props }, ref) {
    const isHorizontal = orientation === "horizontal";
    return (
      <ChakraScrollArea.Scrollbar
        ref={ref}
        orientation={orientation}
        display="flex"
        alignItems="center"
        userSelect="none"
        touchAction="none"
        p="0.5"
        transition="opacity 150ms ease"
        {...(isHorizontal
          ? {
              h: "5px",
              bottom: "0",
              left: "0",
              right: "0",
              bg: "bg.muted/30",
              borderRadius: "full",
            }
          : {
              w: "5px",
              right: "0",
              top: "0",
              bottom: "0",
              bg: "bg.muted/30",
              borderRadius: "full",
            })}
        {...props}
      >
        {children || <ScrollAreaThumb orientation={orientation} />}
      </ChakraScrollArea.Scrollbar>
    );
  }
);

export interface ScrollAreaProps extends ScrollAreaRootProps {
  orientation?: "horizontal" | "vertical" | "both";
  viewportProps?: ScrollAreaViewportProps;
}

export const ScrollArea = Object.assign(
  React.forwardRef<HTMLDivElement, ScrollAreaProps>(function ScrollArea(
    { orientation = "vertical", children, viewportProps, ...rootProps },
    ref
  ) {
    return (
      <ScrollAreaRoot ref={ref} {...rootProps}>
        <ScrollAreaViewport {...viewportProps}>
          <ScrollAreaContent>{children}</ScrollAreaContent>
        </ScrollAreaViewport>
        {(orientation === "horizontal" || orientation === "both") && (
          <ScrollAreaScrollbar orientation="horizontal" />
        )}
        {(orientation === "vertical" || orientation === "both") && (
          <ScrollAreaScrollbar orientation="vertical" />
        )}
        {orientation === "both" && <ScrollAreaCorner />}
      </ScrollAreaRoot>
    );
  }),
  {
    Root: ScrollAreaRoot,
    Viewport: ScrollAreaViewport,
    Content: ScrollAreaContent,
    Scrollbar: ScrollAreaScrollbar,
    Thumb: ScrollAreaThumb,
    Corner: ScrollAreaCorner,
  }
);
