import { Box, Button, Flex, Input, Stack, Text, SimpleGrid, ColorPicker, HStack, Portal, parseColor } from '@chakra-ui/react';
import { useLogo } from './LogoMakerContext';
import { useComponentTranslations } from '../translations';

const SimpleColorPicker = ({ value, onChange, labelTransparent }: { value: string, onChange: (val: string) => void, labelTransparent: string }) => {
  const safeValue = value === 'transparent' ? '#00000000' : value;
  
  return (
    <Flex gap="3" align="center" w="100%">
      <ColorPicker.Root
        size="md"
        value={parseColor(safeValue)}
        onValueChange={(details) => onChange(details.valueAsString)}
        flex="1"
      >
      <ColorPicker.HiddenInput />
      <ColorPicker.Control width="100%">
        <ColorPicker.Input flex="1" />
        <ColorPicker.Trigger />
      </ColorPicker.Control>
      <Portal>
        <ColorPicker.Positioner>
          <ColorPicker.Content>
            <ColorPicker.Area />
            <HStack gap="2">
              <ColorPicker.EyeDropper size="xs" variant="outline" />
              <ColorPicker.Sliders />
            </HStack>
          </ColorPicker.Content>
        </ColorPicker.Positioner>
      </Portal>
    </ColorPicker.Root>
    <Button size="sm" variant="outline" onClick={() => onChange('transparent')}>
      {labelTransparent}
    </Button>
  </Flex>
  );
};

// TextToolbar
export const TextToolbar = () => {
  const { logo, updateLogo, lang } = useLogo();
  const t = useComponentTranslations(lang).logoMaker;

  return (
    <Stack gap="4" p="4">
      <Box>
        <Text fontSize="sm" fontWeight="medium" mb="2">{t.logoText}</Text>
        <Input 
          value={logo.text} 
          onChange={(e) => updateLogo({ text: e.target.value })}
          placeholder={t.placeholderText}
        />
      </Box>
      <Box>
        <Text fontSize="sm" fontWeight="medium" mb="2">{t.fontFamily}</Text>
        <Input 
          value={logo.fontFamily} 
          onChange={(e) => updateLogo({ fontFamily: e.target.value })}
          placeholder={t.placeholderFont}
        />
      </Box>
      <Box>
        <Text fontSize="sm" fontWeight="medium" mb="2">{t.fontWeight}</Text>
        <Flex gap="2">
          {['normal', 'bold'].map(weight => (
            <Button
              key={weight}
              size="sm"
              variant={logo.fontWeight === weight ? 'solid' : 'outline'}
              onClick={() => updateLogo({ fontWeight: weight })}
            >
              {weight === 'normal' ? t.weightNormal : t.weightBold}
            </Button>
          ))}
        </Flex>
      </Box>
      <Box>
        <Text fontSize="sm" fontWeight="medium" mb="2">{t.fontSize} ({logo.fontSize}px)</Text>
        <Input 
          type="range"
          value={logo.fontSize} 
          min={10} max={200} step={1}
          onChange={(e) => updateLogo({ fontSize: Number(e.target.value) })}
        />
      </Box>
      <Box>
        <Text fontSize="sm" fontWeight="medium" mb="2">{t.letterSpacing} ({logo.letterSpacing}px)</Text>
        <Input 
          type="range"
          value={logo.letterSpacing} 
          min={-10} max={50} step={1}
          onChange={(e) => updateLogo({ letterSpacing: Number(e.target.value) })}
        />
      </Box>
      <Box>
        <Text fontSize="sm" fontWeight="medium" mb="2">{t.textColor}</Text>
        <SimpleColorPicker 
          value={logo.color} 
          onChange={(val: string) => updateLogo({ color: val })} 
          labelTransparent={t.transparent}
        />
      </Box>
    </Stack>
  );
};

// Available icons
import * as FiIcons from 'react-icons/fi';

const iconList = [
  'FiActivity', 'FiAnchor', 'FiAperture', 'FiAward', 'FiBox', 
  'FiBriefcase', 'FiCamera', 'FiCloud', 'FiCoffee', 'FiCommand', 
  'FiCompass', 'FiCpu', 'FiCrosshair', 'FiDatabase', 'FiDroplet',
  'FiFeather', 'FiFlag', 'FiGift', 'FiGlobe', 'FiHeart',
  'FiHexagon', 'FiKey', 'FiLayers', 'FiMap', 'FiMonitor',
  'FiMoon', 'FiMusic', 'FiPenTool', 'FiPieChart', 'FiRadio',
  'FiShield', 'FiStar', 'FiSun', 'FiTarget', 'FiTriangle',
  'FiUmbrella', 'FiVideo', 'FiWatch', 'FiWind', 'FiZap'
];

export const IconToolbar = () => {
  const { logo, updateLogo, lang } = useLogo();
  const t = useComponentTranslations(lang).logoMaker;

  return (
    <Stack gap="4" p="4">
      <Box>
        <Text fontSize="sm" fontWeight="medium" mb="2">{t.iconSize} ({logo.iconSize}px)</Text>
        <Input 
          type="range"
          value={logo.iconSize} 
          min={10} max={300} step={1}
          onChange={(e) => updateLogo({ iconSize: Number(e.target.value) })}
        />
      </Box>
      <Box>
        <Text fontSize="sm" fontWeight="medium" mb="2">{t.selectIcon}</Text>
        <Box h="200px" overflowY="auto" borderWidth="1px" borderRadius="md" p="2">
          <SimpleGrid columns={5} gap="2">
            {iconList.map(iconId => {
              const IconComp = (FiIcons as any)[iconId];
              return (
                <Flex 
                  key={iconId}
                  p="2" 
                  align="center" justify="center"
                  borderRadius="md"
                  cursor="pointer"
                  bg={logo.iconId === iconId ? 'blue.100' : 'transparent'}
                  _hover={{ bg: 'gray.100' }}
                  onClick={() => updateLogo({ iconId })}
                >
                  <IconComp size={24} color={logo.iconId === iconId ? 'var(--chakra-colors-blue-600)' : 'var(--chakra-colors-gray-600)'} />
                </Flex>
              );
            })}
          </SimpleGrid>
        </Box>
      </Box>
      <Box>
        <Text fontSize="sm" fontWeight="medium" mb="2">{t.iconColor}</Text>
        <SimpleColorPicker 
          value={logo.iconColor} 
          onChange={(val: string) => updateLogo({ iconColor: val })} 
          labelTransparent={t.transparent}
        />
      </Box>
    </Stack>
  );
};

export const BoxToolbar = () => {
  const { logo, updateLogo, lang } = useLogo();
  const t = useComponentTranslations(lang).logoMaker;

  return (
    <Stack gap="4" p="4">
      <Box>
        <Text fontSize="sm" fontWeight="medium" mb="2">{t.padding} ({logo.padding}px)</Text>
        <Input 
          type="range"
          value={logo.padding} 
          min={0} max={200} step={1}
          onChange={(e) => updateLogo({ padding: Number(e.target.value) })}
        />
      </Box>
      <Box>
        <Text fontSize="sm" fontWeight="medium" mb="2">{t.borderRadius} ({logo.borderRadius}px)</Text>
        <Input 
          type="range"
          value={logo.borderRadius} 
          min={0} max={300} step={1}
          onChange={(e) => updateLogo({ borderRadius: Number(e.target.value) })}
        />
      </Box>
      <Box>
        <Text fontSize="sm" fontWeight="medium" mb="2">{t.backgroundColor}</Text>
        <SimpleColorPicker 
          value={logo.backgroundColor} 
          onChange={(val: string) => updateLogo({ backgroundColor: val })} 
          labelTransparent={t.transparent}
        />
      </Box>
    </Stack>
  );
};

export const LayoutToolbar = () => {
  const { logo, updateLogo, lang } = useLogo();
  const t = useComponentTranslations(lang).logoMaker;

  return (
    <Stack gap="4" p="4">
      <Box>
        <Text fontSize="sm" fontWeight="medium" mb="2">{t.layout}</Text>
        <Flex gap="2" flexWrap="wrap">
          {['Icon-Left', 'Icon-Right', 'Icon-Top', 'Icon-Bottom', 'Icon-Only', 'Text-Only'].map(layout => {
            const layoutLabels: Record<string, string> = {
              'Icon-Left': t.layoutIconLeft,
              'Icon-Right': t.layoutIconRight,
              'Icon-Top': t.layoutIconTop,
              'Icon-Bottom': t.layoutIconBottom,
              'Icon-Only': t.layoutIconOnly,
              'Text-Only': t.layoutTextOnly
            };
            return (
              <Button
                key={layout}
                size="sm"
                variant={logo.layout === layout ? 'solid' : 'outline'}
                onClick={() => updateLogo({ layout: layout as any })}
              >
                {layoutLabels[layout]}
              </Button>
            );
          })}
        </Flex>
      </Box>
      <Box>
        <Text fontSize="sm" fontWeight="medium" mb="2">{t.gap} ({logo.gap}px)</Text>
        <Input 
          type="range"
          value={logo.gap} 
          min={0} max={100} step={1}
          onChange={(e) => updateLogo({ gap: Number(e.target.value) })}
        />
      </Box>
    </Stack>
  );
};
