import { useEffect, useState } from 'react';
import { isReadable, pickSpeakerColor, readBackgroundRgb } from '../colors/speakerColor';
import type { SpeakerColor } from '../colors/speakerColor';
import type { AdventureMessage } from '../types';

type SpeakerColors = Record<string, SpeakerColor>;

const sessionColors = new Map<string, SpeakerColors>();

function storedColors(adventureId: string): SpeakerColors {
  return sessionColors.get(adventureId) ?? {};
}

function storeColors(adventureId: string, colors: SpeakerColors) {
  sessionColors.set(adventureId, colors);
}

export function speakerKey(message: AdventureMessage): string {
  if (message.role !== 'user') return 'narrator';

  return message.authorId ?? message.authorName ?? 'unknown';
}

export function useSpeakerColors(
  adventureId: string,
  speakerKeys: string[],
  isDarkMode: boolean,
): Record<string, string> {
  const [colors, setColors] = useState<SpeakerColors>(() => storedColors(adventureId));

  useEffect(() => {
    setColors(storedColors(adventureId));
  }, [adventureId]);

  useEffect(() => {
    setColors((prev) => {
      const base = storedColors(adventureId);
      const missing = speakerKeys.filter((key) => !base[key]);

      if (missing.length === 0) return base === prev ? prev : base;

      const background = readBackgroundRgb();
      const next = { ...base };

      missing.forEach((key) => {
        next[key] = pickSpeakerColor(background, Object.values(next));
      });

      storeColors(adventureId, next);
      return next;
    });
  }, [adventureId, speakerKeys]);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      setColors((prev) => {
        const background = readBackgroundRgb();
        const failing = Object.entries(prev).filter(([, color]) => !isReadable(color, background));

        if (failing.length === 0) return prev;

        const next = { ...prev };

        failing.forEach(([key]) => {
          const others = Object.entries(next)
            .filter(([otherKey]) => otherKey !== key)
            .map(([, color]) => color);

          next[key] = pickSpeakerColor(background, others);
        });

        storeColors(adventureId, next);
        return next;
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [adventureId, isDarkMode]);

  return Object.fromEntries(Object.entries(colors).map(([key, color]) => [key, color.css]));
}
