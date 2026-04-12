import React, { createContext, useContext } from 'react';
import { useLanguageStore } from '../store/languageStore';

interface DirectionContextValue {
  isRTL: boolean;
  direction: 'ltr' | 'rtl';
}

const DirectionContext = createContext<DirectionContextValue>({
  isRTL: false,
  direction: 'ltr',
});

export function DirectionProvider({ children }: { children: React.ReactNode }) {
  const isRTL = useLanguageStore(s => s.isRTL);

  const value: DirectionContextValue = {
    isRTL,
    direction: isRTL ? 'rtl' : 'ltr',
  };

  return (
    <DirectionContext.Provider value={value}>
      {children}
    </DirectionContext.Provider>
  );
}

export function useDirection(): DirectionContextValue {
  return useContext(DirectionContext);
}

export { DirectionContext };
