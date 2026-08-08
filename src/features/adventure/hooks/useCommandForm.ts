import { useCallback, useState } from 'react';
import { initialCommandFormValues, isCommandFieldValid } from '../commands/commandForm';
import type { CommandFormValues } from '../commands/commandForm';
import type { CommandDefinition } from '../commands/types';
import type { ContextAttributes } from '../../sidebar/types';

type UseCommandFormResult = {
  values: CommandFormValues;
  setValue: (argName: string, value: string) => void;
  isValid: boolean;
};

export function useCommandForm(
  command: CommandDefinition,
  attributes: ContextAttributes,
): UseCommandFormResult {
  const [values, setValues] = useState<CommandFormValues>(
    () => initialCommandFormValues(command, attributes),
  );

  const setValue = useCallback((argName: string, value: string) => {
    setValues((prev) => ({ ...prev, [argName]: value }));
  }, []);

  const isValid = command.args.every((arg) => isCommandFieldValid(arg, values[arg.name] ?? ''));

  return { values, setValue, isValid };
}
