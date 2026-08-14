import { Minus, Plus, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { ATTRIBUTE_MAX_LEVEL, CHARACTER_ATTRIBUTES } from '../attributes';
import type { CharacterAttributes } from '../types';
import type { useAttributeAllocation } from '../hooks/useAttributeAllocation';

type AttributeSectionProps =
  | { mode: 'create'; allocation: ReturnType<typeof useAttributeAllocation> }
  | { mode: 'view'; values: CharacterAttributes };

export default function AttributeSection(props: AttributeSectionProps) {
  const { t } = useTranslation('character');

  return (
    <div className="flex flex-col gap-4 rounded-md border border-border p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('form.attributes.title')}
        </span>
        {props.mode === 'create' && (
          <div className="flex items-center gap-3">
            <span className="text-sm text-muted-foreground">
              {t('form.attributes.remaining', { count: props.allocation.remaining })}
            </span>
            <button
              type="button"
              onClick={props.allocation.reset}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t('form.attributes.reset')}
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {CHARACTER_ATTRIBUTES.map((attribute) => (
          <div key={attribute} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
            <span className="text-sm font-medium text-foreground">{t(`form.attributes.names.${attribute}`)}</span>
            {props.mode === 'create' ? (
              <div className="flex items-center gap-2">
                {props.allocation.canDecrement(attribute) ? (
                  <button
                    type="button"
                    onClick={() => props.allocation.decrement(attribute)}
                    aria-label={t('form.attributes.decrease')}
                    className="rounded-full border border-border p-1 text-foreground hover:bg-muted"
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <span className="w-7" />
                )}
                <span className="w-5 text-center text-sm font-semibold text-foreground">
                  {props.allocation.levels[attribute]}
                </span>
                {props.allocation.canIncrement(attribute) ? (
                  <button
                    type="button"
                    onClick={() => props.allocation.increment(attribute)}
                    aria-label={t('form.attributes.increase')}
                    className="rounded-full border border-border p-1 text-foreground hover:bg-muted"
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                ) : (
                  <span className="w-7" />
                )}
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {Array.from({ length: ATTRIBUTE_MAX_LEVEL }, (_, index) => (
                    <span
                      key={index}
                      className={`h-2 w-2 rounded-full ${index < props.values[attribute] ? 'bg-primary' : 'bg-muted'}`}
                    />
                  ))}
                </div>
                <span className="w-5 text-center text-sm font-semibold text-foreground">{props.values[attribute]}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
