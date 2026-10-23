import type React from "react";
import {
  Accordion,
  Box,
  Button,
  CloseButton,
  Drawer,
  IconButton,
  Portal,
  Tabs,
  ScrollArea,
  Flex,
  Stack,
  Text,
} from "@chakra-ui/react";
import { IoMenuOutline } from "react-icons/io5";
import { Link, useLocation } from "react-router-dom";
import { useState } from "react";

function isExternalNavHref(href: string | undefined): boolean {
  if (!href) return false;
  return /^https?:\/\//i.test(href.trim());
}

/** Parse href for pathname + search (supports relative segments like "user" → "/user"). */
function normalizeNavHref(href: string): { pathname: string; search: string } {
  const withSlash = href.startsWith("/") ? href : `/${href}`;
  const url = new URL(withSlash, "http://local.invalid");
  return { pathname: url.pathname, search: url.search };
}

function matchesNavHref(
  href: string | undefined,
  pathname: string,
  search: string,
): boolean {
  if (!href) return false;
  if (isExternalNavHref(href)) return false;
  const n = normalizeNavHref(href);
  return n.pathname === pathname && n.search === search;
}

/** Absolute path + search for React Router `to` (avoids broken relative `base` → `/user/base`). */
function routerLinkTo(href: string): string {
  const n = normalizeNavHref(href);
  return `${n.pathname}${n.search}`;
}

function navItemIsActive(
  item: TabsMenuItem,
  pathname: string,
  search: string,
  activeValue: string | undefined,
  getItemValue: (i: TabsMenuItem) => string,
): boolean {
  const itemValue = getItemValue(item);
  if (!itemValue) return false;
  const children = item.childItems ?? [];
  if (children.length > 0) {
    const parentHref = item.href ?? itemValue;
    return (
      children.some((c) =>
        matchesNavHref(c.href ?? getItemValue(c), pathname, search),
      ) ||
      matchesNavHref(parentHref, pathname, search) ||
      activeValue === itemValue
    );
  }
  return (
    matchesNavHref(item.href ?? itemValue, pathname, search) ||
    activeValue === itemValue
  );
}

/**
 * Value for Tabs.Root so the indicator stays on the parent when a nested route is active.
 */
function resolveTabsIndicatorValue(
  items: TabsMenuItem[],
  pathname: string,
  search: string,
  propValue: string | undefined,
  getItemValue: (item: TabsMenuItem) => string,
): string {
  for (const item of items) {
    const children = item.childItems ?? [];
    const parentVal = getItemValue(item);
    if (!parentVal) continue;

    if (children.length > 0) {
      const parentHref = item.href ?? parentVal;
      const childHit = children.some((c) =>
        matchesNavHref(c.href ?? getItemValue(c), pathname, search),
      );
      const parentHit = matchesNavHref(parentHref, pathname, search);
      if (childHit || parentHit) return parentVal;
    } else {
      const href = item.href ?? parentVal;
      if (matchesNavHref(href, pathname, search)) return parentVal;
    }
  }
  return propValue ?? "";
}

export interface TabsMenuItem {
  /** Unique value for the tab (used for active state). Defaults to href if not provided. */
  value?: string;
  /** Display title */
  title: string;
  /** Optional icon element */
  icon?: React.ReactNode;
  /** Route href when using asLink (router mode). Used as value if value is not set. */
  href?: string;
  /** Optional nested items rendered inside Chakra Accordion */
  childItems?: TabsMenuItem[];
  /** Additional data for custom rendering */
  [key: string]: unknown;
}

export interface TabsMenuProps {
  /** Array of tab items */
  items?: TabsMenuItem[];
  /** @deprecated Use `items` instead */
  Links?: TabsMenuItem[];
  /** Currently active tab value */
  value?: string;
  /** @deprecated Use `value` instead */
  currentRoute?: string;
  /** Use React Router Link for navigation (default: true) */
  asLink?: boolean;
  /** Icon-only mode - hide titles (default: false) */
  isMinimal?: boolean;
  /** Called when a tab is selected (use instead of Link when asLink is false) */
  onTabChange?: (value: string, item: TabsMenuItem) => void;
  /** Tab orientation (default: "vertical") */
  orientation?: "horizontal" | "vertical";
  /** Chakra Tabs variant (default: "plain") */
  variant?: "line" | "subtle" | "enclosed" | "outline" | "plain";
  /** Render custom content before the tab list items */
  children?: React.ReactNode;
  /** Show menu toggle button (for collapsed/minimal layouts) */
  withMenuButton?: boolean;
  /** Accordion: allow closing an open parent (default: true) */
  nestedAccordionCollapsible?: boolean;
  /** Nested items left padding (Chakra spacing units, default: 2) */
  nestedIndent?: number;
  /** Props forwarded to ScrollArea.Root */
  scrollContainerProps?: React.ComponentProps<typeof ScrollArea.Root>;
  /** Props forwarded to ScrollArea.Scrollbar */
  scrollBarProps?: React.ComponentProps<typeof ScrollArea.Scrollbar>;
  /** Props forwarded to Tabs.Root */
  tabsRootProps?: React.ComponentProps<typeof Tabs.Root>;
  /** Props forwarded to Tabs.List */
  tabsListProps?: React.ComponentProps<typeof Tabs.List>;
  /** Props forwarded to each Tabs.Trigger */
  tabTriggerProps?: React.ComponentProps<typeof Tabs.Trigger>;
  /** Custom render function for each tab item */
  renderItem?: (item: TabsMenuItem, isActive: boolean) => React.ReactNode;
  userContent: React.ReactNode;
  onExpandClick: () => void;
}

/**
 * Customizable tabs menu component with Chakra UI.
 * Supports both React Router navigation and callback-based selection.
 */
export function TabsMenu({
  items = [],
  Links,
  value,
  currentRoute,
  asLink = true,
  isMinimal = false,
  onTabChange,
  orientation = "vertical",
  variant = "plain",
  children,
  withMenuButton,
  nestedAccordionCollapsible = true,
  nestedIndent = 2,
  scrollContainerProps,
  scrollBarProps,
  tabsRootProps,
  tabsListProps,
  tabTriggerProps,
  renderItem,
  userContent,
  onExpandClick,
}: TabsMenuProps): React.ReactElement {
  const { pathname, search } = useLocation();
  const [nestedSheetItem, setNestedSheetItem] = useState<TabsMenuItem | null>(
    null,
  );
  const tabItems = items.length > 0 ? items : (Links ?? []);
  const activeValue = value ?? currentRoute;

  const getItemValue = (item: TabsMenuItem): string =>
    item.value ?? item.href ?? "";

  const tabsRootValue = resolveTabsIndicatorValue(
    tabItems,
    pathname,
    search,
    activeValue,
    getItemValue,
  );

  const leafIsActive = (_item: TabsMenuItem, itemValue: string, href: string) =>
    (activeValue != null && activeValue === itemValue) ||
    matchesNavHref(href, pathname, search);

  /** Top-level or single-level nav: real tab triggers + indicator. */
  const renderLeafTrigger = (
    item: TabsMenuItem,
    level: number,
    reactKey?: string,
  ) => {
    const itemValue = getItemValue(item);
    if (!itemValue) return null;

    const href = item.href ?? itemValue;
    const isActive = leafIsActive(item, itemValue, href);
    const key = reactKey ?? itemValue;

    const triggerContent = renderItem ? (
      renderItem(item, isActive)
    ) : (
      <>
        {item.icon}
        {!isMinimal && item.title}
      </>
    );

    const trigger = (
      <Tabs.Trigger
        w="100%"
        textAlign="start"
        flexShrink="0"
        justifyContent={isMinimal ? "center" : "start"}
        alignItems="center"
        value={itemValue}
        pl={level > 0 ? level * nestedIndent : undefined}
        {...tabTriggerProps}
      >
        {triggerContent}
      </Tabs.Trigger>
    );

    // Only the leaf nodes navigate via react-router when `asLink` is enabled.
    if (asLink && href && !onTabChange) {
      if (isExternalNavHref(href)) {
        return (
          <a
            href={href}
            key={key}
            style={{ width: "100%", textDecoration: "none", color: "inherit" }}
          >
            {trigger}
          </a>
        );
      }
      return (
        <Link to={routerLinkTo(href)} style={{ width: "100%" }} key={key}>
          {trigger}
        </Link>
      );
    }

    return (
      <div key={key} style={{ width: "100%" }}>
        {trigger}
      </div>
    );
  };

  /**
   * Nested submenu links are not Tabs.Trigger so the shared Tabs.Indicator
   * stays on the parent row; active child is styled separately.
   */
  const renderNestedChildLink = (
    item: TabsMenuItem,
    reactKey?: string,
  ) => {
    const itemValue = getItemValue(item);
    if (!itemValue) return null;

    const href = item.href ?? itemValue;
    const isActive = matchesNavHref(href, pathname, search);
    const key = reactKey ?? itemValue;

    const inner = renderItem ? (
      renderItem(item, isActive)
    ) : (
      <Flex
        align="center"
        gap="2"
        w="100%"
        p="4"
        borderRadius="l2"
        bg={isActive ? "white" : undefined}
        color={isActive ? "fg" : "fg.muted"}
        fontWeight={isActive ? "semibold" : "normal"}
        transition="background 0.15s, color 0.15s"
        _hover={{ bg: isActive ? "white" : "bg.subtle" }}
      >
        {item.icon}
        {!isMinimal && item.title}
      </Flex>
    );

    if (asLink && href) {
      if (isExternalNavHref(href)) {
        return (
          <a
            href={href}
            key={key}
            style={{
              width: "100%",
              display: "block",
              textDecoration: "none",
              color: "inherit",
            }}
            onClick={() => onTabChange?.(itemValue, item)}
          >
            {inner}
          </a>
        );
      }
      return (
        <Link
          to={routerLinkTo(href)}
          style={{ width: "100%", display: "block", textDecoration: "none" }}
          key={key}
          onClick={() => onTabChange?.(itemValue, item)}
        >
          {inner}
        </Link>
      );
    }

    return (
      <Box
        key={key}
        w="100%"
        cursor="pointer"
        onClick={() => onTabChange?.(itemValue, item)}
      >
        {inner}
      </Box>
    );
  };

  const content = (
    <ScrollArea.Root
      {...scrollContainerProps}
      variant="hover"
      size="xs"
      minW={0}
      overflowX="hidden"
    >
      <ScrollArea.Viewport overflowX="hidden">
        <ScrollArea.Content minW={0} maxW="100%">
          <Tabs.Root
            className="scroll-modern"
            value={tabsRootValue}
            onValueChange={(details) => {
              const nextValue =
                typeof details === "object" && details?.value != null
                  ? details.value
                  : String(details);
              const item = tabItems.find(
                (i) => (i.value ?? i.href) === nextValue,
              );
              if (item && onTabChange) onTabChange(nextValue, item);
            }}
            variant={variant}
            w="100%"
            maxW={orientation === "vertical" ? "100%" : "fit-content"}
            orientation={orientation}
            fitted
            {...tabsRootProps}
          >
            <Tabs.List
              overflowY="auto"
              overflowX="hidden"
              w="100%"
              maxW="100%"
              minW={0}
              bg="bg.muted"
              rounded="l3"
              p="2"
              gap="2"
              {...tabsListProps}
            >
              {children}
              {withMenuButton && (
                <Flex
                  align="center"
                  p="3"
                  bgColor="bg.subtle"
                  justify={isMinimal ? "center" : "space-between"}
                  borderRadius="xl"
                >
                  <Flex align="center" gap="3">
                    {userContent}
                  </Flex>
                  <IconButton
                    borderRadius="full"
                    aria-label="Menu"
                    size="lg"
                    variant="outline"
                    onClick={onExpandClick}
                  >
                    <IoMenuOutline />
                  </IconButton>
                </Flex>
              )}
              {tabItems.map((item, index) => {
                const itemValue = getItemValue(item);
                if (!itemValue) return null;

                const childItems = item.childItems ?? [];
                const hasNested = childItems.length > 0;
                const uniqueKey = `${itemValue}-${index}`;

                // Leaf item: preserve the original behavior (tabs + optional react-router link).
                if (!hasNested) return renderLeafTrigger(item, 0, uniqueKey);

                // Parent item: use Accordion to show nested items.
                const isParentActive =
                  activeValue === itemValue ||
                  childItems.some((child) =>
                    matchesNavHref(
                      child.href ?? getItemValue(child),
                      pathname,
                      search,
                    ),
                  ) ||
                  matchesNavHref(item.href ?? itemValue, pathname, search);

                const parentContent = renderItem ? (
                  renderItem(item, isParentActive)
                ) : (
                  <>
                    {item.icon}
                    {!isMinimal && item.title}
                  </>
                );

                return (
                  <Accordion.Root
                    variant="outline"
                    // Remount on route change so the "active" parent auto-expands reliably.
                    key={`${uniqueKey}-${pathname}${search}`}
                    collapsible={nestedAccordionCollapsible}
                    defaultValue={isParentActive ? [itemValue] : []}
                  >
                    <Accordion.Item value={itemValue}>
                      <Accordion.ItemTrigger>
                        <Tabs.Trigger
                          w="100%"
                          textAlign="start"
                          flexShrink="0"
                          justifyContent="space-between"
                          alignItems="center"
                          gap="2"
                          value={itemValue}
                          {...tabTriggerProps}
                        >
                          <Flex align="center" gap="2" minW="0">
                            {parentContent}
                          </Flex>
                          <Accordion.ItemIndicator flexShrink="0" />
                        </Tabs.Trigger>
                      </Accordion.ItemTrigger>
                      <Accordion.ItemContent>
                        <Stack gap="0" pt="1" pb="2" pl="1">
                          {childItems.map((child, childIndex) =>
                            renderNestedChildLink(
                              child,
                              `${uniqueKey}-c-${childIndex}`,
                            ),
                          )}
                        </Stack>
                      </Accordion.ItemContent>
                    </Accordion.Item>
                  </Accordion.Root>
                );
              })}
              <Tabs.Indicator rounded="l2" />
            </Tabs.List>
          </Tabs.Root>
        </ScrollArea.Content>
      </ScrollArea.Viewport>
      <ScrollArea.Scrollbar {...scrollBarProps} />
    </ScrollArea.Root>
  );

  const barItemStyle = {
      flex: "1 0 5.25rem",
      minWidth: "5.25rem",
      maxWidth: "7rem",
    } as const;

    const renderMobileBarItem = (item: TabsMenuItem, index?: number) => {
      const itemValue = getItemValue(item);
      if (!itemValue) return null;
      const key = index !== undefined ? `${itemValue}-${index}` : itemValue;
      const childItems = item.childItems ?? [];
      const hasNested = childItems.length > 0;
      const active = navItemIsActive(
        item,
        pathname,
        search,
        activeValue,
        getItemValue,
      );

      const iconBox = (
        <Box
          lineHeight="1"
          fontSize="2xl"
          css={{
            "& svg": { width: "1.75rem", height: "1.75rem" },
          }}
          color={active ? "blue.solid" : "fg.muted"}
        >
          {item.icon}
        </Box>
      );
      const label = (
        <Text
          fontSize="sm"
          fontWeight={active ? "semibold" : "medium"}
          textAlign="center"
          lineClamp={2}
          lineHeight="1.2"
          color={active ? "blue.solid" : "fg.muted"}
          w="100%"
        >
          {item.title}
        </Text>
      );

      if (hasNested) {
        return (
          <Button
            key={key}
            variant="ghost"
            h="auto"
            py="3"
            px="1.5"
            borderRadius="l2"
            bg={active ? "blue.subtle" : "transparent"}
            _hover={{ bg: active ? "blue.subtle" : "bg.subtle" }}
            onClick={() => setNestedSheetItem(item)}
            {...barItemStyle}
          >
            <Flex direction="column" align="center" justify="center" gap="1">
              {iconBox}
              {label}
            </Flex>
          </Button>
        );
      }

      const href = item.href ?? itemValue;
      if (asLink && href) {
        const barFlex = (
          <Flex
            direction="column"
            align="center"
            justify="center"
            gap="1"
            py="3"
            px="1.5"
            borderRadius="l2"
            bg={active ? "blue.subtle" : "transparent"}
            h="100%"
            minH="4.5rem"
          >
            {iconBox}
            {label}
          </Flex>
        );
        if (isExternalNavHref(href)) {
          return (
            <a
              key={key}
              href={href}
              style={{
                ...barItemStyle,
                textDecoration: "none",
                color: "inherit",
              }}
              onClick={() => {
                setNestedSheetItem(null);
                onTabChange?.(itemValue, item);
              }}
            >
              {barFlex}
            </a>
          );
        }
        return (
          <Link
            key={key}
            to={routerLinkTo(href)}
            style={{
              ...barItemStyle,
              textDecoration: "none",
              color: "inherit",
            }}
            onClick={() => {
              setNestedSheetItem(null);
              onTabChange?.(itemValue, item);
            }}
          >
            {barFlex}
          </Link>
        );
      }

      return (
        <Button
          key={key}
          variant="ghost"
          h="auto"
          py="3"
          px="1.5"
          borderRadius="l2"
          bg={active ? "blue.subtle" : "transparent"}
          onClick={() => {
            setNestedSheetItem(null);
            onTabChange?.(itemValue, item);
          }}
          {...barItemStyle}
        >
          <Flex direction="column" align="center" justify="center" gap="1">
            {iconBox}
            {label}
          </Flex>
        </Button>
      );
    };

    const renderMobileMenu = () => (
      <>
        <Portal>
          <Flex
            as="nav"
            role="navigation"
            aria-label="Main"
            position="fixed"
            bottom="0"
            left="0"
            right="0"
            zIndex={1100}
            hideFrom="md"
            bg="bg.muted"
            borderTopWidth="1px"
            borderColor="border.muted"
            pt="2.5"
            pb="calc(0.5rem + env(safe-area-inset-bottom, 0px))"
            px="1.5"
            boxShadow="0 -4px 14px rgba(0,0,0,0.06)"
          >
            <Flex
              w="100%"
              align="stretch"
              justify="flex-start"
              gap="1"
              overflowX="auto"
              overflowY="hidden"
              css={{
                scrollbarWidth: "thin",
                WebkitOverflowScrolling: "touch",
              }}
            >
              {tabItems.map((item, index) => renderMobileBarItem(item, index))}
            </Flex>
          </Flex>
        </Portal>

        <Drawer.Root
          open={nestedSheetItem != null}
          onOpenChange={(details) => {
            if (!details.open) setNestedSheetItem(null);
          }}
          placement="bottom"
        >
          <Portal>
            <Drawer.Backdrop />
            <Drawer.Positioner>
              <Drawer.Content
                borderTopRadius="2xl"
                maxH="min(70dvh, 520px)"
                pb="calc(env(safe-area-inset-bottom, 0px) + 0.75rem)"
              >
                <Drawer.Header
                  display="flex"
                  alignItems="center"
                  justifyContent="space-between"
                  gap="2"
                  borderBottomWidth="1px"
                  borderColor="border.muted"
                >
                  <Drawer.Title flex="1" fontSize="xl" fontWeight="semibold">
                    {nestedSheetItem?.title}
                  </Drawer.Title>
                  <Drawer.CloseTrigger asChild>
                    <CloseButton size="md" />
                  </Drawer.CloseTrigger>
                </Drawer.Header>
                <Drawer.Body pt="2">
                  <Stack gap="1">
                    {(nestedSheetItem?.childItems ?? []).map((child, idx) => {
                      const cv = getItemValue(child);
                      if (!cv) return null;
                      const childKey = `${cv}-${idx}`;

                      const chref = child.href ?? cv;
                      const childActive = matchesNavHref(
                        chref,
                        pathname,
                        search,
                      );
                      const row = (
                        <Flex
                          align="center"
                          gap="4"
                          w="100%"
                          py="4"
                          px="4"
                          borderRadius="l2"
                          bg={childActive ? "blue.subtle" : "transparent"}
                          color={childActive ? "blue.solid" : "fg"}
                          fontWeight={childActive ? "semibold" : "normal"}
                        >
                          <Box
                            fontSize="2xl"
                            color="inherit"
                            lineHeight="1"
                            css={{
                              "& svg": { width: "1.75rem", height: "1.75rem" },
                            }}
                          >
                            {child.icon}
                          </Box>
                          <Text flex="1" textAlign="start" fontSize="md">
                            {child.title}
                          </Text>
                        </Flex>
                      );
                      if (asLink && chref) {
                        if (isExternalNavHref(chref)) {
                          return (
                            <a
                              key={childKey}
                              href={chref}
                              style={{
                                width: "100%",
                                textDecoration: "none",
                                color: "inherit",
                              }}
                              onClick={() => {
                                setNestedSheetItem(null);
                                onTabChange?.(cv, child);
                              }}
                            >
                              {row}
                            </a>
                          );
                        }
                        return (
                          <Link
                            key={childKey}
                            to={routerLinkTo(chref)}
                            style={{ width: "100%", textDecoration: "none" }}
                            onClick={() => {
                              setNestedSheetItem(null);
                              onTabChange?.(cv, child);
                            }}
                          >
                            {row}
                          </Link>
                        );
                      }
                      return (
                        <Button
                          key={childKey}
                          variant="ghost"
                          h="auto"
                          p="0"
                          w="100%"
                          justifyContent="stretch"
                          onClick={() => {
                            setNestedSheetItem(null);
                            onTabChange?.(cv, child);
                          }}
                        >
                          {row}
                        </Button>
                      );
                    })}
                  </Stack>
                </Drawer.Body>
              </Drawer.Content>
            </Drawer.Positioner>
          </Portal>
        </Drawer.Root>
      </>
    );

  return (
    <>
      {renderMobileMenu()}
      <Box hideBelow="md" h="100%">
        {content}
      </Box>
    </>
  );
}
