import type React from "react";
import { Suspense } from "react";
import { Skeleton } from "@chakra-ui/react";
import { motion } from "framer-motion";

export interface LazyPageWrapperProps {
  children: React.ReactNode;
  /** Reverse entrance/exit direction (default: false). */
  reverse?: boolean;
  /** Props passed to the Skeleton fallback. */
  SkeletonProps?: Record<string, unknown>;
  containerStyles?: React.CSSProperties;
  Loader?: React.ReactNode;
}

function PageWrapper({
  children,
  reverse = false,
  SkeletonProps,
  containerStyles,
  Loader,
}: LazyPageWrapperProps): React.ReactElement {
  return (
    <Suspense
      fallback={Loader || <Skeleton h="100vh" w="100%" {...SkeletonProps} />}
    >
      <motion.div
        initial={{ opacity: 0, y: reverse ? -20 : 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: reverse ? 20 : -20 }}
        transition={{ duration: 0.5 }}
        style={{ width: "100%", height: "100%", ...containerStyles }}
      >
        {children}
      </motion.div>
    </Suspense>
  );
}

export function LazyPageWrapper({
  children,
  reverse = false,
  SkeletonProps,
  Loader,
}: LazyPageWrapperProps): React.ReactElement {
  return (
    <PageWrapper
      Loader={Loader}
      reverse={reverse}
      SkeletonProps={SkeletonProps}
    >
      {children}
    </PageWrapper>
  );
}
