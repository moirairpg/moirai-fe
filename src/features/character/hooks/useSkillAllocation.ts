import { useCallback, useEffect, useState } from 'react';
import type { CharacterSignatures, CharacterSkills } from '../types';
import { useCharacterClasses } from './useCharacterClasses';
import { useSkillVocabulary } from './useSkillVocabulary';

export function useSkillAllocation(characterClass: string) {
  const { vocabulary } = useSkillVocabulary();
  const { classes } = useCharacterClasses();
  const profile = classes.find((option) => option.name === characterClass) ?? null;

  const [pending, setPending] = useState<Record<string, number>>({});
  const [signatureRaise, setSignatureRaise] = useState(0);

  useEffect(() => {
    setPending({});
    setSignatureRaise(0);
  }, [characterClass]);

  const skills = vocabulary?.skills ?? [];
  const creation = vocabulary?.creation ?? null;
  const isReady = creation !== null && profile !== null;

  const levelOf = (skill: string) => pending[skill] ?? 0;

  const costOf = (skill: string) =>
    profile?.favoredSkills.includes(skill) ? creation!.favoredCost : creation!.offClassCost;

  const spent = !isReady
    ? 0
    : skills.reduce((sum, skill) => sum + levelOf(skill.name) * costOf(skill.name), 0) +
      signatureRaise * creation.favoredCost;

  const remaining = (creation?.points ?? 0) - spent;
  const signatureLevel = (creation?.signatureStartingLevel ?? 0) + signatureRaise;

  const increment = (skill: string) =>
    setPending((prev) => ({ ...prev, [skill]: (prev[skill] ?? 0) + 1 }));

  const decrement = (skill: string) =>
    setPending((prev) => ({ ...prev, [skill]: (prev[skill] ?? 0) - 1 }));

  const incrementSignature = () => setSignatureRaise((prev) => prev + 1);
  const decrementSignature = () => setSignatureRaise((prev) => prev - 1);

  const reset = useCallback(() => {
    setPending({});
    setSignatureRaise(0);
  }, []);

  const resetClassSkills = () => {
    setSignatureRaise(0);
    setPending((prev) => Object.fromEntries(
      Object.entries(prev).filter(([name]) => !(profile?.favoredSkills.includes(name) ?? false)),
    ));
  };

  const resetOtherSkills = () =>
    setPending((prev) => Object.fromEntries(
      Object.entries(prev).filter(([name]) => profile?.favoredSkills.includes(name) ?? false),
    ));

  const importLevels = (importedLevels: Record<string, number>, importedSignatureLevel: number) => {
    const cap = creation?.levelCap ?? 0;
    const start = creation?.signatureStartingLevel ?? 0;
    setPending(Object.fromEntries(
      Object.entries(importedLevels).map(([name, level]) => [name, Math.min(Math.max(level, 0), cap)]),
    ));
    setSignatureRaise(Math.min(Math.max(importedSignatureLevel, start), cap) - start);
  };

  const canIncrement = (skill: string) =>
    isReady && levelOf(skill) < creation.levelCap && remaining >= costOf(skill);

  const canDecrement = (skill: string) => levelOf(skill) > 0;

  const canIncrementSignature =
    isReady && signatureLevel < creation.levelCap && remaining >= creation.favoredCost;

  const canDecrementSignature = signatureRaise > 0;

  const isComplete = isReady && remaining === 0;

  const levels: CharacterSkills = Object.fromEntries(skills.map((skill) => [skill.name, levelOf(skill.name)]));

  const signatureSkill: CharacterSignatures = profile
    ? { [profile.signatureSkill.name]: signatureLevel }
    : {};

  return {
    skills,
    profile,
    levels,
    levelOf,
    signatureLevel,
    signatureSkill,
    remaining,
    isComplete,
    increment,
    decrement,
    incrementSignature,
    decrementSignature,
    reset,
    resetClassSkills,
    resetOtherSkills,
    importLevels,
    canIncrement,
    canDecrement,
    canIncrementSignature,
    canDecrementSignature,
  };
}
