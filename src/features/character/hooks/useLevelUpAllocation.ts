import { useCallback, useState } from 'react';
import type { CharacterAttributes, CharacterSignatures, CharacterSkills } from '../types';
import { useAttributeVocabulary } from './useAttributeVocabulary';
import { useCharacterClasses } from './useCharacterClasses';
import { useSkillVocabulary } from './useSkillVocabulary';

const ATTRIBUTE_HIGH_LEVEL_COST = 2;

type LevelUpAllocationInput = {
  characterClass: string;
  attributes: CharacterAttributes;
  skills: CharacterSkills;
  signatureLevel: number;
  attributePointsAvailable: number;
  skillPointsAvailable: number;
};

export function useLevelUpAllocation(input: LevelUpAllocationInput) {
  const { vocabulary: attributeVocabulary } = useAttributeVocabulary();
  const { vocabulary: skillVocabulary } = useSkillVocabulary();
  const { classes } = useCharacterClasses();
  const profile = classes.find((option) => option.name === input.characterClass) ?? null;

  const [pendingAttributes, setPendingAttributes] = useState<Record<string, number>>({});
  const [pendingSkills, setPendingSkills] = useState<Record<string, number>>({});
  const [pendingSignature, setPendingSignature] = useState(0);

  const attributes = attributeVocabulary?.attributes ?? [];
  const skills = skillVocabulary?.skills ?? [];
  const attributeMaxLevel = attributeVocabulary?.maxLevel ?? 0;
  const skillMaxLevel = skillVocabulary?.maxLevel ?? 0;
  const attributeHighCostFrom = (attributeVocabulary?.creation.levelCap ?? 0) + 1;
  const favoredCost = skillVocabulary?.creation.favoredCost ?? 0;
  const offClassCost = skillVocabulary?.creation.offClassCost ?? 0;
  const isReady = attributeVocabulary !== null && skillVocabulary !== null && profile !== null;

  const committedAttributeOf = (name: string) => input.attributes[name] ?? 0;
  const committedSkillOf = (name: string) => input.skills[name] ?? 0;

  const pendingAttributeOf = (name: string) => pendingAttributes[name] ?? 0;
  const pendingSkillOf = (name: string) => pendingSkills[name] ?? 0;

  const attributeLevelOf = (name: string) => committedAttributeOf(name) + pendingAttributeOf(name);
  const skillLevelOf = (name: string) => committedSkillOf(name) + pendingSkillOf(name);
  const signatureLevel = input.signatureLevel + pendingSignature;

  const costOfAttributeLevel = (level: number) =>
    level >= attributeHighCostFrom ? ATTRIBUTE_HIGH_LEVEL_COST : 1;

  const costOfPendingAttribute = (name: string) => {
    let cost = 0;

    for (let level = committedAttributeOf(name) + 1; level <= attributeLevelOf(name); level++) {
      cost += costOfAttributeLevel(level);
    }

    return cost;
  };

  const costOfSkill = (name: string) =>
    profile?.favoredSkills.includes(name) ? favoredCost : offClassCost;

  const attributePointsSpent = attributes.reduce(
    (sum, attribute) => sum + costOfPendingAttribute(attribute.name), 0);
  const skillPointsSpent = skills.reduce(
    (sum, skill) => sum + pendingSkillOf(skill.name) * costOfSkill(skill.name), 0)
    + pendingSignature * favoredCost;

  const attributeRemaining = input.attributePointsAvailable - attributePointsSpent;
  const skillRemaining = input.skillPointsAvailable - skillPointsSpent;

  const canIncrementAttribute = (name: string) =>
    isReady && attributeLevelOf(name) < attributeMaxLevel
    && attributeRemaining >= costOfAttributeLevel(attributeLevelOf(name) + 1);

  const canDecrementAttribute = (name: string) => pendingAttributeOf(name) > 0;

  const canIncrementSkill = (name: string) =>
    isReady && skillLevelOf(name) < skillMaxLevel && skillRemaining >= costOfSkill(name);

  const canDecrementSkill = (name: string) => pendingSkillOf(name) > 0;

  const canIncrementSignature =
    isReady && signatureLevel < skillMaxLevel && skillRemaining >= favoredCost;

  const canDecrementSignature = pendingSignature > 0;

  const incrementAttribute = (name: string) =>
    setPendingAttributes((prev) => ({ ...prev, [name]: (prev[name] ?? 0) + 1 }));

  const decrementAttribute = (name: string) =>
    setPendingAttributes((prev) => ({ ...prev, [name]: (prev[name] ?? 0) - 1 }));

  const incrementSkill = (name: string) =>
    setPendingSkills((prev) => ({ ...prev, [name]: (prev[name] ?? 0) + 1 }));

  const decrementSkill = (name: string) =>
    setPendingSkills((prev) => ({ ...prev, [name]: (prev[name] ?? 0) - 1 }));

  const incrementSignature = () => setPendingSignature((prev) => prev + 1);
  const decrementSignature = () => setPendingSignature((prev) => prev - 1);

  const reset = useCallback(() => {
    setPendingAttributes({});
    setPendingSkills({});
    setPendingSignature(0);
  }, []);

  const pendingCount = attributes.reduce((sum, attribute) => sum + pendingAttributeOf(attribute.name), 0)
    + skills.reduce((sum, skill) => sum + pendingSkillOf(skill.name), 0)
    + pendingSignature;

  const hasLegalPlacement = attributes.some((attribute) => canIncrementAttribute(attribute.name))
    || skills.some((skill) => canIncrementSkill(skill.name))
    || canIncrementSignature;

  const isSaveable = pendingCount > 0
    && ((attributeRemaining === 0 && skillRemaining === 0) || !hasLegalPlacement);

  const levels: CharacterAttributes = Object.fromEntries(
    attributes.map((attribute) => [attribute.name, attributeLevelOf(attribute.name)]));

  const skillLevels: CharacterSkills = Object.fromEntries(
    skills.map((skill) => [skill.name, skillLevelOf(skill.name)]));

  const signatureSkill: CharacterSignatures = profile
    ? { [profile.signatureSkill.name]: signatureLevel }
    : {};

  return {
    attributes,
    skills,
    profile,
    isReady,
    favoredCost,
    offClassCost,
    attributeRemaining,
    skillRemaining,
    hasLegalPlacement,
    isSaveable,
    levels,
    skillLevels,
    signatureSkill,
    signatureLevel,
    pendingSignature,
    committedAttributeOf,
    committedSkillOf,
    attributeLevelOf,
    skillLevelOf,
    pendingAttributeOf,
    pendingSkillOf,
    canIncrementAttribute,
    canDecrementAttribute,
    canIncrementSkill,
    canDecrementSkill,
    canIncrementSignature,
    canDecrementSignature,
    incrementAttribute,
    decrementAttribute,
    incrementSkill,
    decrementSkill,
    incrementSignature,
    decrementSignature,
    reset,
  };
}
