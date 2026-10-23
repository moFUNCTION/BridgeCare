import React, { useRef, useState } from 'react';
import { Box, Flex, Button, Stack } from '@chakra-ui/react';
import { TabsMenu } from '../TabsMenu/TabsMenu';
import { FiType, FiAperture, FiSquare, FiLayout, FiDownload } from 'react-icons/fi';
import { LogoBox } from './LogoBox';
import domtoimage from 'dom-to-image';
import { useComponentTranslations } from '../translations';
import { TextToolbar, IconToolbar, BoxToolbar, LayoutToolbar } from './toolbars';
import { useLogo } from './LogoMakerContext';

export interface LogoMakerContentProps {
  onSave?: (dataUrl: string) => void;
  onCancel?: () => void;
}

export const LogoMakerContent = ({ onSave, onCancel }: LogoMakerContentProps) => {
  const { lang } = useLogo();
  const t = useComponentTranslations(lang).logoMaker;
  
  const [activeTab, setActiveTab] = useState('text');
  const printRef = useRef<HTMLDivElement>(null);

  const tabs = [
    { value: 'text', title: t.text, icon: <FiType /> },
    { value: 'icon', title: t.icon, icon: <FiAperture /> },
    { value: 'box', title: t.box, icon: <FiSquare /> },
    { value: 'layout', title: t.layout, icon: <FiLayout /> },
  ];

  const renderActiveToolbar = () => {
    switch (activeTab) {
      case 'icon': return <IconToolbar />;
      case 'box': return <BoxToolbar />;
      case 'layout': return <LayoutToolbar />;
      case 'text':
      default: return <TextToolbar />;
    }
  };

  const handleAction = async () => {
    if (!printRef.current) return;
    try {
      const dataUrl = await domtoimage.toPng(printRef.current, { quality: 1 });
      if (onSave) {
        onSave(dataUrl);
      } else {
        const link = document.createElement('a');
        link.download = 'logo.png';
        link.href = dataUrl;
        link.click();
      }
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Flex h="100%" direction={{ base: 'column', md: 'row' }} overflow="hidden">
      {/* Sidebar Tools */}
      <Box w={{ base: '100%', md: '360px' }} borderRightWidth={{ md: '1px' }} borderBottomWidth={{ base: '1px', md: '0' }} borderColor="gray.200" bg="white" flexShrink={0} display="flex" boxShadow="sm" zIndex={2}>
        <Box w="80px" borderRightWidth="1px" borderColor="gray.100" bg="gray.50">
          <TabsMenu
            items={tabs}
            value={activeTab}
            onTabChange={(val) => setActiveTab(val as string)}
            asLink={false}
            isMinimal={true}
            userContent={<></>}
            onExpandClick={() => {}}
          />
        </Box>
        <Box flex="1" overflowY="auto" h={{ base: '300px', md: 'auto' }}>
          {renderActiveToolbar()}
        </Box>
      </Box>

      {/* Main Canvas Area */}
      <Flex 
        flex="1" 
        position="relative" 
        align="center" 
        justify="center" 
        p="8" 
        overflow="hidden"
        bg="gray.100"
        backgroundImage="radial-gradient(var(--chakra-colors-gray-300) 1px, transparent 1px)"
        backgroundSize="20px 20px"
      >
        <Box 
          position="relative"
          boxShadow="xl"
          borderRadius="xl"
          transition="transform 0.2s"
          _hover={{ transform: 'scale(1.02)' }}
          css={{
            '& > div': {
              transformOrigin: 'center center',
            }
          }}
        >
          <LogoBox ref={printRef} />
        </Box>

        {/* Floating Save/Download Button */}
        <Box position="absolute" bottom="8" right="8">
          <Button colorPalette="blue" size="xl" borderRadius="full" boxShadow="lg" px="8" onClick={handleAction}>
            <FiDownload style={{ marginRight: '8px' }} /> {onSave ? t.saveLogo : t.downloadLogo}
          </Button>
        </Box>
      </Flex>
    </Flex>
  );
};
