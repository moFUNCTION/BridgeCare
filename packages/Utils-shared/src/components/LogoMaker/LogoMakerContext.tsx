import React, { createContext, useContext, useState, useMemo } from 'react';
import type { Locale } from '../../locale';

export type LogoLayout = 'Icon-Left' | 'Icon-Right' | 'Icon-Top' | 'Icon-Bottom' | 'Icon-Only' | 'Text-Only';

export interface LogoConfig {
  text: string;
  color: string;
  fontFamily: string;
  fontWeight: string;
  fontSize: number;
  letterSpacing: number;
  backgroundColor: string;
  iconId: string;
  iconColor: string;
  iconSize: number;
  layout: LogoLayout;
  padding: number;
  gap: number;
  borderRadius: number;
}

export const initLogo: LogoConfig = {
  text: 'Logotype',
  color: '#ffffff',
  fontFamily: 'Inter',
  fontWeight: 'bold',
  fontSize: 60,
  letterSpacing: 1,
  backgroundColor: '#0033FF',
  iconId: 'FiActivity',
  iconColor: '#ffffff',
  iconSize: 96,
  layout: 'Icon-Left',
  padding: 70,
  gap: 25,
  borderRadius: 0,
};

interface LogoContextType {
  logo: LogoConfig;
  updateLogo: (value: Partial<LogoConfig>) => void;
  resetLogo: () => void;
  lang?: Locale | null;
}

const LogoContext = createContext<LogoContextType | null>(null);

export const LogoProvider = ({ children, initialConfig, lang }: { children: React.ReactNode, initialConfig?: Partial<LogoConfig>, lang?: Locale | null }) => {
  const [logo, setLogo] = useState<LogoConfig>({ ...initLogo, ...initialConfig });

  const updateLogo = (value: Partial<LogoConfig>) => {
    setLogo((prev) => ({ ...prev, ...value }));
  };

  const resetLogo = () => {
    setLogo({ ...initLogo, ...initialConfig });
  };

  const value = useMemo(() => ({ logo, updateLogo, resetLogo, lang }), [logo, lang]);

  return <LogoContext.Provider value={value}>{children}</LogoContext.Provider>;
};

export const useLogo = () => {
  const context = useContext(LogoContext);
  if (!context) {
    throw new Error('useLogo must be used within a LogoProvider');
  }
  return context;
};
