import React, { useState, useEffect } from 'react';
import { Clock } from 'lucide-react';
import { playKeySound } from '../utils/audio';
import { TranslationDictionary } from '../utils/i18n';

interface NervClockProps {
  t: TranslationDictionary;
}

export const NervClock: React.FC<NervClockProps> = ({ t }) => {
  const [time, setTime] = useState(new Date());
  const [use24Hour, setUse24Hour] = useState(true);

  useEffect(() => {
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleToggleFormat = () => {
    playKeySound();
    setUse24Hour((prev) => !prev);
  };

  const hours = time.getHours();
  const minutes = time.getMinutes();
  const seconds = time.getSeconds();

  const pad = (n: number) => n.toString().padStart(2, '0');

  let displayHours = hours;
  let ampm = '';

  if (!use24Hour) {
    ampm = hours >= 12 ? ' PM' : ' AM';
    displayHours = hours % 12 || 12;
  }

  const timeString = `${pad(displayHours)}:${pad(minutes)}:${pad(seconds)}${ampm}`;
  const dateString = time.toLocaleDateString(undefined, {
    month: 'short',
    day: '2-digit',
  });

  return (
    <div
      onClick={handleToggleFormat}
      className="flex items-center gap-2 px-2.5 py-1 bg-[#0d0905] border border-[#ff7a00]/70 font-mono select-none shadow-[0_0_10px_rgba(255,122,0,0.2)] hover:border-[#ffca8a] transition-all cursor-pointer group h-[44px]"
      title={`${t.clockTooltip || 'Relógio do Sistema NERV'} (Clique para alternar formato 12h/24h)`}
    >
      {/* Icon + Pulsing live radar dot */}
      <div className="flex items-center gap-1.5 text-[#ff7a00]">
        <Clock className="w-3.5 h-3.5 text-[#ff7a00] group-hover:text-[#ffca8a] transition-colors" />
        <span className="w-1.5 h-1.5 rounded-full bg-[#4dff9a] animate-pulse shadow-[0_0_6px_#4dff9a]" />
      </div>

      {/* Label and Digital Time Display */}
      <div className="flex flex-col leading-none">
        <div className="flex items-center justify-between gap-1 text-[8px] text-[#8a6845] font-bold tracking-widest">
          <span>{t.clockLabel || 'HORÁRIO ATUAL'}</span>
          <span className="text-[#6d5236] text-[7px] hidden sm:inline">{dateString}</span>
        </div>
        <span className="text-xs sm:text-sm font-black text-[#ffca8a] tracking-widest font-mono drop-shadow-[0_0_5px_rgba(255,122,0,0.5)] mt-0.5">
          {timeString}
        </span>
      </div>
    </div>
  );
};
