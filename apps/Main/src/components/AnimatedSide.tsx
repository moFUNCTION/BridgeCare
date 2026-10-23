import React from "react";
import { Box, Heading, Stack, Text, VStack } from "@chakra-ui/react";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import { lottieAnimation } from "@repo/assets";
import { SplitText } from "@repo/ui-components";
import { useTranslation } from "react-i18next";

export interface AnimatedSideProps {
  containerProps?: Record<string, any>;
}

export const AnimatedSide: React.FC<AnimatedSideProps> = ({
  containerProps,
}) => {
  const { t, i18n } = useTranslation();
  const isRtl = i18n.language.startsWith("ar");

  return (
    <Stack
      bg="linear-gradient(145deg, #ffa260ff 0%, #e0804dff 45%, #c2623cff 100%)"
      p={{ base: "6", lg: "8" }}
      borderRadius="2xl"
      alignItems="center"
      justify="center"
      pos="relative"
      overflow="hidden"
      zIndex="1"
      boxShadow="0 20px 45px -15px rgba(234, 88, 12, 0.45)"
      {...containerProps}
    >
      {/* Floating clouds */}
      <div id="clouds">
        {Array.from({ length: 10 }).map((_, index) => (
          <div key={index} className={`cloud x${index + 1}`} />
        ))}
      </div>

      {/* Lottie Animation from Assets (substantially enlarged) */}
      <Box
        w="100%"
        maxW={{ base: "420px", lg: "620px", xl: "720px" }}
        mx="auto"
        position="relative"
        zIndex="2"
        display="flex"
        alignItems="center"
        justifyContent="center"
        py="2"
      >
        <DotLottieReact
          src={lottieAnimation}
          style={{
            width: "100%",
            height: "100%",
            maxHeight: "560px",
            minHeight: "420px",
            objectFit: "contain",
          }}
          loop
          autoplay
        />
      </Box>

      {/* Animated Greeting & Slogan */}
      <VStack gap="3" textAlign="center" zIndex="2" px="4">
        <Heading
          color="white"
          fontWeight="extrabold"
          as="h2"
          size={{ base: "xl", lg: "2xl" }}
          letterSpacing="-0.02em"
          textShadow="0 2px 10px rgba(0,0,0,0.2)"
        >
          <SplitText
            key={i18n.language}
            text={t("brand.tagline")}
            animation="fadeUp"
            duration={0.6}
            delay={30}
          />
        </Heading>
        <Text
          color="white/90"
          fontSize={{ base: "sm", lg: "md" }}
          maxW="380px"
          lineHeight="tall"
        >
          {t("brand.subtitle")}
        </Text>
      </VStack>
    </Stack>
  );
};

export default AnimatedSide;
