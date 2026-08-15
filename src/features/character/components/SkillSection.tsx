import { Minus, Plus, RotateCcw, Star } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useSkillVocabulary } from '../hooks/useSkillVocabulary';
import { useCharacterClasses } from '../hooks/useCharacterClasses';
import type { CharacterSignatures, CharacterSkills } from '../types';
import type { useSkillAllocation } from '../hooks/useSkillAllocation';

type SkillSectionProps =
  | {
      mode: 'create';
      characterClass: string;
      allocation: ReturnType<typeof useSkillAllocation>;
      classSelector?: React.ReactNode;
    }
  | { mode: 'view'; characterClass: string | null; skills: CharacterSkills; signatureSkill: CharacterSignatures };

type SkillRowProps = {
  label: string;
  signatureBadge?: string;
} & (
  | {
      mode: 'create';
      level: number;
      canIncrement: boolean;
      canDecrement: boolean;
      onIncrement: () => void;
      onDecrement: () => void;
      increaseLabel: string;
      decreaseLabel: string;
    }
  | { mode: 'view'; level: number; maxLevel: number }
);

function SkillRow(props: SkillRowProps) {
  return (
    <div className="flex items-center justify-between rounded-md border border-border px-3 py-2">
      <span className="flex items-center gap-1.5 text-sm font-medium text-foreground">
        {props.label}
        {props.signatureBadge && (
          <span className="flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
            <Star className="h-3 w-3" />
            {props.signatureBadge}
          </span>
        )}
      </span>
      {props.mode === 'create' ? (
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={props.onDecrement}
            aria-label={props.decreaseLabel}
            className={`rounded-full border border-border p-1 text-foreground hover:bg-muted${props.canDecrement ? '' : ' invisible'}`}
          >
            <Minus className="h-3.5 w-3.5" />
          </button>
          <span className="w-5 text-center text-sm font-semibold text-foreground">{props.level}</span>
          <button
            type="button"
            onClick={props.onIncrement}
            aria-label={props.increaseLabel}
            className={`rounded-full border border-border p-1 text-foreground hover:bg-muted${props.canIncrement ? '' : ' invisible'}`}
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {Array.from({ length: props.maxLevel }, (_, index) => (
              <span
                key={index}
                className={`h-2 w-2 rounded-full ${index < props.level ? 'bg-primary' : 'bg-muted'}`}
              />
            ))}
          </div>
          <span className="w-5 text-center text-sm font-semibold text-foreground">{props.level}</span>
        </div>
      )}
    </div>
  );
}

export default function SkillSection(props: SkillSectionProps) {
  const { t } = useTranslation('character');
  const { vocabulary } = useSkillVocabulary();
  const { classes } = useCharacterClasses();
  const profile = props.characterClass
    ? (classes.find((option) => option.name === props.characterClass) ?? null)
    : null;

  const favored = profile?.favoredSkills ?? [];
  const skillOptions = vocabulary?.skills ?? [];
  const favoredOptions = favored
    .map((name) => skillOptions.find((skill) => skill.name === name))
    .filter((skill) => skill !== undefined);
  const otherOptions = skillOptions.filter((skill) => !favored.includes(skill.name));
  const isClassless = props.mode === 'view' && props.characterClass === null;
  const awaitingClass = props.mode === 'create' && props.characterClass === '';
  const isLoading = vocabulary === null || profile === null;

  const labelOf = (name: string, fallback: string) => t(`form.skills.names.${name}`, { defaultValue: fallback });

  const rowControls = (skillName: string) =>
    props.mode === 'create'
      ? {
          mode: 'create' as const,
          level: props.allocation.levelOf(skillName),
          canIncrement: props.allocation.canIncrement(skillName),
          canDecrement: props.allocation.canDecrement(skillName),
          onIncrement: () => props.allocation.increment(skillName),
          onDecrement: () => props.allocation.decrement(skillName),
          increaseLabel: t('form.skills.increase'),
          decreaseLabel: t('form.skills.decrease'),
        }
      : {
          mode: 'view' as const,
          level: props.skills[skillName] ?? 0,
          maxLevel: vocabulary?.maxLevel ?? 0,
        };

  const signatureControls = () =>
    props.mode === 'create'
      ? {
          mode: 'create' as const,
          level: props.allocation.signatureLevel,
          canIncrement: props.allocation.canIncrementSignature,
          canDecrement: props.allocation.canDecrementSignature,
          onIncrement: props.allocation.incrementSignature,
          onDecrement: props.allocation.decrementSignature,
          increaseLabel: t('form.skills.increase'),
          decreaseLabel: t('form.skills.decrease'),
        }
      : {
          mode: 'view' as const,
          level: profile ? (props.signatureSkill[profile.signatureSkill.name] ?? 0) : 0,
          maxLevel: vocabulary?.maxLevel ?? 0,
        };

  return (
    <div className="flex flex-col gap-4 rounded-md border border-border p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {t('form.skills.title')}
        </span>
        {props.mode === 'create' && !isLoading && (
          <div className="flex items-center gap-3">
            {props.allocation.remaining < 0 && (
              <span className="rounded bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
                {t('form.overspent')}
              </span>
            )}
            <span className={`text-sm ${props.allocation.remaining < 0 ? 'font-medium text-destructive' : 'text-muted-foreground'}`}>
              {t('form.skills.remaining', { count: props.allocation.remaining })}
            </span>
            <button
              type="button"
              onClick={props.allocation.reset}
              className="flex items-center gap-1.5 rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
            >
              <RotateCcw className="h-3.5 w-3.5" />
              {t('form.skills.reset')}
            </button>
          </div>
        )}
      </div>

      {props.mode === 'create' && props.classSelector}

      {isClassless && (
        <span className="self-start rounded bg-destructive/10 px-2 py-0.5 text-xs font-medium text-destructive">
          {t('form.skills.needsClass')}
        </span>
      )}

      {!isClassless && !awaitingClass && isLoading && (
        <span className="text-sm text-muted-foreground">{t('form.loading')}</span>
      )}

      {!isLoading && (
        <>
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('form.skills.classSkills')}
              </span>
              <span className="text-xs text-muted-foreground">
                {t('form.skills.costPerLevel', { count: vocabulary.creation.favoredCost })}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <SkillRow
                label={t(`form.skills.signatures.${profile.signatureSkill.name}`, {
                  defaultValue: profile.signatureSkill.label,
                })}
                signatureBadge={t('form.skills.signatureBadge')}
                {...signatureControls()}
              />
              {favoredOptions.map((skill) => (
                <SkillRow key={skill.name} label={labelOf(skill.name, skill.label)} {...rowControls(skill.name)} />
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('form.skills.otherSkills')}
              </span>
              <span className="text-xs text-muted-foreground">
                {t('form.skills.costPerLevel', { count: vocabulary.creation.offClassCost })}
              </span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {otherOptions.map((skill) => (
                <SkillRow key={skill.name} label={labelOf(skill.name, skill.label)} {...rowControls(skill.name)} />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
