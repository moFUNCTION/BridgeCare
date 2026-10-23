import React, { forwardRef } from 'react';
import { Box, Text, Flex } from '@chakra-ui/react';
import { useLogo } from './LogoMakerContext';
import * as FiIcons from 'react-icons/fi';

export const LogoBox = forwardRef<HTMLDivElement>((_, ref) => {
  const { logo } = useLogo();
  const IconComp = (FiIcons as any)[logo.iconId] || FiIcons.FiActivity;

  const getFlexDirection = () => {
    switch (logo.layout) {
      case 'Icon-Top': return 'column';
      case 'Icon-Bottom': return 'column-reverse';
      case 'Icon-Right': return 'row-reverse';
      case 'Icon-Left':
      default: return 'row';
    }
  };

  const showIcon = logo.layout !== 'Text-Only';
  const showText = logo.layout !== 'Icon-Only';

  return (
    <Flex
      ref={ref}
      align="center"
      justify="center"
      bg={logo.backgroundColor}
      p={`${logo.padding}px`}
      gap={`${logo.gap}px`}
      borderRadius={`${logo.borderRadius}px`}
      flexDirection={getFlexDirection()}
      boxShadow="0 0 50px 10px rgba(0, 0, 0, 0.05)"
      overflow="hidden"
    >
      {showIcon && (
        <IconComp 
          color={logo.iconColor} 
          size={logo.iconSize} 
        />
      )}
      {showText && (
        <Text
          color={logo.color}
          fontSize={`${logo.fontSize}px`}
          fontFamily={logo.fontFamily}
          fontWeight={logo.fontWeight}
          letterSpacing={`${logo.letterSpacing}px`}
          lineHeight="1"
          textAlign="center"
          whiteSpace="nowrap"
        >
          {logo.text}
        </Text>
      )}
    </Flex>
  );
});
