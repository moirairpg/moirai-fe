import { Minus, Plus, RotateCcw } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useAttributeVocabulary } from '../hooks/useAttributeVocabulary';
import type { CharacterAttributes } from '../types';
import type { useAttributeAllocation } from '../hooks/useAttributeAllocation';

type AttributeSectionProps =
  | { mode: 'create'; allocation: ReturnType<typeof useAttributeAllocation> }
  | { mode: 'view'; values: CharacterAttributes };

export default function AttributeSection(props: AttributeSectionProps) {
  const { t } = useTranslation('character');
  const { vocabulary } = useAttributeVocabulary();

  const attributes = props.mode === 'create' ? props.allocation.attributes : (vocabulary?.attributes ?? []);
  const maxLevel = vocabulary?.maxLevel ?? 0;
  const isLoading = attributes.length === 0;

  return (
    <div className="flex flex-col gap-4 rounded-md border border-border p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('form.attributes.title')}
        </span>
        {props.mode === 'create' && !isLoading && (
          <div className="flex items-center gap-3">
            {props.allocation.remaining < 0 && (
              <span className="rounded bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                {t('form.overspent')}
              </span>
            )}
            <span className={`text-sm ${props.allocation.remaining < 0 ? 'font-medium text-destructive' : 'text-muted-foreground'}`}>
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

      {isLoading && <span className="text-sm text-muted-foreground">{t('form.loading')}</span>}

      {!isLoading && (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {attributes.map((attribute) => (
            <div key={attribute.name} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <span className="text-sm font-medium text-foreground">
                {t(`form.attributes.names.${attribute.name}`, { defaultValue: attribute.label })}
              </span>
              {props.mode === 'create' ? (
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => props.allocation.decrement(attribute.name)}
                    aria-label={t('form.attributes.decrease')}
                    className={`rounded-full border border-border p-1 text-foreground hover:bg-muted${props.allocation.canDecrement(attribute.name) ? '' : ' invisible'}`}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </button>
                  <span className="w-5 text-center text-sm font-semibold text-foreground">
                    {props.allocation.levelOf(attribute.name)}
                  </span>
                  <button
                    type="button"
                    onClick={() => props.allocation.increment(attribute.name)}
                    aria-label={t('form.attributes.increase')}
                    className={`rounded-full border border-border p-1 text-foreground hover:bg-muted${props.allocation.canIncrement(attribute.name) ? '' : ' invisible'}`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: maxLevel }, (_, index) => (
                      <span
                        key={index}
                        className={`h-2 w-2 rounded-full ${index < (props.values[attribute.name] ?? 0) ? 'bg-primary' : 'bg-muted'}`}
                      />
                    ))}
                  </div>
                  <span className="w-5 text-center text-sm font-semibold text-foreground">
                    {props.values[attribute.name] ?? 0}
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
