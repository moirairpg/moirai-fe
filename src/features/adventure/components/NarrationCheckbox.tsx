import { useTranslation } from 'react-i18next';

type NarrationCheckboxProps = {
  checked: boolean;
  onChange: (value: boolean) => void;
  disabled?: boolean;
};

export function NarrationCheckbox({ checked, onChange, disabled = false }: NarrationCheckboxProps) {
  const { t } = useTranslation('adventure');

  return (
    <label
      title={t('page.narration.title')}
      className={`flex select-none items-center gap-1.5 text-xs text-muted-foreground ${
        disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:text-foreground'
      }`}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        className="h-3.5 w-3.5 cursor-pointer rounded border-border !accent-primary disabled:cursor-not-allowed"
      />
      {t('page.narration.label')}
    </label>
  );
}
