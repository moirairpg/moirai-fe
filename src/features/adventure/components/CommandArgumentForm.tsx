import { useTranslation } from 'react-i18next';
import { toCommand } from '../commands/commandForm';
import { useCommandForm } from '../hooks/useCommandForm';
import type { CommandDefinition, ParsedCommand } from '../commands/types';
import type { ContextAttributes } from '../../sidebar/types';

const INPUT_CLASS = 'rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-1 focus:ring-ring';
const TEXTAREA_CLASS = `resize-y ${INPUT_CLASS}`;

type CommandArgumentFormProps = {
  command: CommandDefinition;
  contextAttributes: ContextAttributes;
  onSubmit: (command: ParsedCommand) => void;
  onCancel: () => void;
};

export function CommandArgumentForm({
  command,
  contextAttributes,
  onSubmit,
  onCancel,
}: CommandArgumentFormProps) {
  const { t } = useTranslation('adventure');
  const { values, setValue, isValid } = useCommandForm(command, contextAttributes);

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!isValid) return;

    const parsed = toCommand(command, values);

    if (!parsed) return;

    onSubmit(parsed);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLFormElement>) => {
    if (e.key !== 'Escape') return;

    e.preventDefault();
    e.stopPropagation();
    onCancel();
  };

  return (
    <form
      onSubmit={handleSubmit}
      onKeyDown={handleKeyDown}
      className="flex flex-col gap-2 rounded-md border border-border p-4"
    >
      <div className="flex items-center gap-2 text-sm">
        <span className="font-mono text-primary">/{command.name}</span>
        <span className="text-muted-foreground">{command.description}</span>
      </div>

      {command.args.map((arg, index) => (
        <div key={arg.name} className="flex flex-col gap-1.5">
          <label htmlFor={`command-${arg.name}`} className="text-sm font-medium text-foreground">
            {t(`page.commandForm.fields.${command.name}.${arg.name}`)}
          </label>

          {arg.type === 'integer' ? (
            <input
              id={`command-${arg.name}`}
              type="number"
              min={1}
              step={1}
              value={values[arg.name] ?? ''}
              onChange={(e) => setValue(arg.name, e.target.value)}
              className={INPUT_CLASS}
              autoFocus={index === 0}
            />
          ) : (
            <textarea
              id={`command-${arg.name}`}
              rows={3}
              value={values[arg.name] ?? ''}
              onChange={(e) => setValue(arg.name, e.target.value)}
              className={TEXTAREA_CLASS}
              autoFocus={index === 0}
            />
          )}
        </div>
      ))}

      <div className="flex gap-2">
        <button
          type="submit"
          disabled={!isValid}
          className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {t('form.actions.save')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted"
        >
          {t('form.actions.cancel')}
        </button>
      </div>
    </form>
  );
}
