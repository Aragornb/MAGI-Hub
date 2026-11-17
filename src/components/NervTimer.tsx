import React from 'react';
import { NervClock } from './NervClock';
import { TranslationDictionary } from '../utils/i18n';

interface NervTimerProps {
  t: TranslationDictionary;
}

export const NervTimer: React.FC<NervTimerProps> = ({ t }) => {
  return <NervClock t={t} />;
};
