import { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Pencil, Trash2, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { apiFetch, api, extractApiError, notifySuccess } from '../../../utils/api';
import { EntityBanner } from '../../../shared/view/ui';
import { buildImagePrompt } from '../../../utils/imagePrompt';
import { resolveImagePosition } from '../../../utils/imagePosition';
import { useCharacterClasses } from '../hooks/useCharacterClasses';
import { useAuth } from '../../../components/auth';
import { useCharacterAdventures } from '../hooks/useCharacterAdventures';
import { useJsonImport, parseCharacterJson } from '../../../utils/jsonImport';
import { ConfirmDialog } from '../../../shared/components/ConfirmDialog';
import type { CharacterFormInput, PlayerCharacterDetails } from '../types';

type CharacterFormPageProps = { mode: 'view' | 'edit' | 'create' };

const INPUT_CLASS = 'rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary disabled:cursor-not-allowed disabled:opacity-50';
const TEXTAREA_CLASS = `resize-y ${INPUT_CLASS}`;

const EMPTY: CharacterFormInput = {
  name: '',
  characterClass: '',
  personality: '',
  physicalDescription: '',
};

export default function CharacterFormPage({ mode }: CharacterFormPageProps) {
  const navigate = useNavigate();
  const { characterId } = useParams<{ characterId: string }>();
  const { t } = useTranslation('character');
  const { classes } = useCharacterClasses();

  const [form, setForm] = useState<CharacterFormInput>(EMPTY);
  const [loading, setLoading] = useState(mode !== 'create');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [imagePromptOpen, setImagePromptOpen] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [uiImagePositionX, setUiImagePositionX] = useState(0.5);
  const [uiImagePositionY, setUiImagePositionY] = useState(0.5);
  const [isOwner, setIsOwner] = useState(false);

  const { user } = useAuth();
  const isAdmin = user?.role === 'ADMIN';

  const readOnly = mode === 'view';
  const canEdit = mode === 'view' && (isOwner || isAdmin);
  const canDelete = mode !== 'create' && (isOwner || isAdmin);
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const handleDelete = async () => {
    setConfirmingDelete(false);
    const res = await apiFetch(`/api/player-characters/${characterId}`, { method: 'DELETE' });
    if (res.ok) navigate('/my-stuff');
  };
  const registeredAdventures = useCharacterAdventures(characterId, mode === 'view');
  const adventuresTrackRef = useRef<HTMLDivElement>(null);
  const scrollAdventures = (direction: number) => adventuresTrackRef.current?.scrollBy({ left: direction * 240, behavior: 'smooth' });
  const title = mode === 'create' ? t('form.title.new') : mode === 'edit' ? t('form.title.edit') : t('form.title.fallback');

  const handleJsonImport = useJsonImport((raw) => {
    const data = parseCharacterJson(raw);
    setForm({
      name: data.name,
      characterClass: data.characterClass,
      personality: data.personality,
      physicalDescription: data.physicalDescription,
    });
  });
  const errorBorder = (value: string) => submitted && !value.trim() ? ' border-red-500' : '';

  useEffect(() => {
    setSaving(false);
    setSubmitted(false);
    setError('');

    if (mode === 'create') {
      setForm(EMPTY);
      setImageUrl(null);
      setImageFile(null);
      setUiImagePositionX(0.5);
      setUiImagePositionY(0.5);
      setLoading(false);
      return;
    }

    if (!characterId) return;

    setLoading(true);
    apiFetch(`/api/player-characters/${characterId}`)
      .then((res) => res.json())
      .then((data: PlayerCharacterDetails) => {
        setForm({
          name: data.name,
          characterClass: data.characterClass ?? '',
          personality: data.personality,
          physicalDescription: data.physicalDescription,
        });
        setImageUrl(data.imageUrl ?? null);
        setUiImagePositionX(data.uiImagePositionX ?? 0.5);
        setUiImagePositionY(data.uiImagePositionY ?? 0.5);
        setIsOwner(data.isOwner);
      })
      .catch(() => setError(t('form.errors.loadFailed')))
      .finally(() => setLoading(false));
  }, [mode, characterId]);

  const set = (field: keyof CharacterFormInput) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const canSave =
    form.name.trim() !== '' &&
    form.characterClass !== '' &&
    form.personality.trim() !== '' &&
    form.physicalDescription.trim() !== '';

  const buildPrompt = () => buildImagePrompt({
    subject: 'character',
    fields: [
      { label: 'Name', value: form.name },
      { label: 'Class', value: form.characterClass },
      { label: 'Personality', value: form.personality },
      { label: 'Appearance', value: form.physicalDescription },
    ],
  });

  const handleImageUpload = async (file: File) => {
    setImageFile(file);
    setImageUrl(URL.createObjectURL(file));
    const position = await resolveImagePosition(file);
    setUiImagePositionX(position.x);
    setUiImagePositionY(position.y);
  };

  const handleImageRemove = async () => {
    if (characterId) {
      await api.character.removeImage(characterId);
    }
    setImageUrl(null);
    setImageFile(null);
  };

  const handleImageGenerate = async () => {
    const blob = await api.imageGenerations.generate(buildPrompt());
    const file = new File([blob], 'generated.png', { type: 'image/png' });
    setImageFile(file);
    setImageUrl(URL.createObjectURL(blob));
    const position = await resolveImagePosition(file);
    setUiImagePositionX(position.x);
    setUiImagePositionY(position.y);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setError('');

    if (!canSave) return;

    if (mode === 'create' && !imageFile && !imageUrl) {
      setImagePromptOpen(true);
      return;
    }

    await submitCharacter(false);
  };

  const submitCharacter = async (shouldGenerateImage: boolean) => {
    setSaving(true);

    const body = {
      name: form.name,
      characterClass: form.characterClass,
      personality: form.personality,
      physicalDescription: form.physicalDescription,
      uiImagePositionX,
      uiImagePositionY,
    };

    try {
      if (mode === 'create') {
        const res = await apiFetch('/api/player-characters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          silent: true,
        });
        if (!res.ok) throw new Error(await extractApiError(res) ?? t('form.errors.saveFailed'));
        const data = await res.json();
        const id = data.id;

        const file = imageFile ?? (shouldGenerateImage
          ? await (async () => {
              const blob = await api.imageGenerations.generate(buildPrompt(), { silent: true });
              return new File([blob], 'generated.png', { type: 'image/png' });
            })()
          : null);

        if (file) {
          const uploadRes = await api.character.uploadImage(id, file, { silent: true });
          if (!uploadRes.ok) throw new Error(await extractApiError(uploadRes) ?? t('form.errors.saveFailed'));

          if (!imageFile) {
            const position = await resolveImagePosition(file);
            await apiFetch(`/api/player-characters/${id}`, {
              method: 'PUT',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ ...body, uiImagePositionX: position.x, uiImagePositionY: position.y }),
              silent: true,
            }).catch(() => {});
          }
        }

        notifySuccess(t('toast.saved', { ns: 'common' }));
        navigate(`/character/${id}/view`);
      } else {
        const res = await apiFetch(`/api/player-characters/${characterId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
          silent: true,
        });
        if (!res.ok) throw new Error(await extractApiError(res) ?? t('form.errors.saveFailed'));

        if (imageFile) {
          const uploadRes = await api.character.uploadImage(characterId!, imageFile, { silent: true });
          if (!uploadRes.ok) throw new Error(await extractApiError(uploadRes) ?? t('form.errors.saveFailed'));
        }

        notifySuccess(t('toast.saved', { ns: 'common' }));
        navigate(`/character/${characterId}/view`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t('form.errors.saveFailed'));
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">{t('form.loading')}</div>;
  }

  return (
    <form onSubmit={handleSubmit} className="relative flex flex-1 flex-col overflow-hidden">
      {saving && (
        <div className="absolute inset-0 z-20 flex items-center justify-center bg-background/60">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      )}
      <div className="flex-1 overflow-y-auto px-6 py-8">
        <div className="mx-auto flex w-full max-w-5xl flex-col gap-5">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
            <div className="flex items-center gap-2">
              {mode === 'create' && (
                <label className="cursor-pointer rounded-md border border-border px-3 py-1.5 text-sm font-medium text-foreground hover:bg-muted">
                  {t('form.actions.importJson')}
                  <input type="file" accept=".json" className="sr-only" onChange={handleJsonImport} />
                </label>
              )}
              {canEdit && (
                <button type="button" onClick={() => navigate(`/character/${characterId}/edit`)} className="flex items-center gap-1.5 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  <Pencil className="h-3.5 w-3.5" />
                  {t('card.actions.edit', { ns: 'collection' })}
                </button>
              )}
              {canDelete && (
                <button type="button" onClick={() => setConfirmingDelete(true)} className="flex items-center gap-1.5 rounded-md bg-destructive px-4 py-2 text-sm font-medium text-destructive-foreground hover:bg-destructive/90">
                  <Trash2 className="h-3.5 w-3.5" />
                  {t('card.actions.delete', { ns: 'collection' })}
                </button>
              )}
              <button type="button" onClick={() => navigate(-1)} className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
                {t('form.actions.back')}
              </button>
            </div>
          </div>

          {error && <div className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">{error}</div>}

          <EntityBanner
            imageUrl={imageUrl}
            name={form.name}
            mode={mode}
            canGenerate={mode !== 'view' && canSave}
            uiImagePositionX={uiImagePositionX}
            uiImagePositionY={uiImagePositionY}
            onUiImagePositionChange={(x, y) => { setUiImagePositionX(x); setUiImagePositionY(y); }}
            onUpload={handleImageUpload}
            onRemove={handleImageRemove}
            onGenerate={handleImageGenerate}
          />

          <div className="flex flex-col gap-5 rounded-md border border-border p-4">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('form.sections.basicData')}</span>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">{t('form.fields.name')}</label>
              <input type="text" value={form.name} onChange={set('name')} disabled={readOnly} className={`${INPUT_CLASS}${errorBorder(form.name)}`} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">{t('form.fields.class')}</label>
              <select value={form.characterClass} onChange={set('characterClass')} disabled={readOnly} className={`${INPUT_CLASS}${submitted && form.characterClass === '' ? ' border-red-500' : ''}`}>
                <option value="" disabled>{t('form.classPlaceholder')}</option>
                {classes.map((option) => (
                  <option key={option.name} value={option.name}>
                    {t(`classes.${option.name}`, { defaultValue: option.label })}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">{t('form.fields.personality')}</label>
              <textarea rows={4} value={form.personality} onChange={set('personality')} disabled={readOnly} className={`${TEXTAREA_CLASS}${errorBorder(form.personality)}`} />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium text-foreground">{t('form.fields.physicalDescription')}</label>
              <textarea rows={4} value={form.physicalDescription} onChange={set('physicalDescription')} disabled={readOnly} className={`${TEXTAREA_CLASS}${errorBorder(form.physicalDescription)}`} />
            </div>
          </div>

          {mode === 'view' && registeredAdventures.length > 0 && (
            <div className="flex flex-col gap-3 rounded-md border border-border p-4">
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t('form.sections.registeredIn')}</span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => scrollAdventures(-1)}
                  className="flex-shrink-0 rounded-full border border-border p-1 text-foreground hover:bg-muted"
                  aria-label={t('form.actions.scrollLeft')}
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                <div ref={adventuresTrackRef} className="flex flex-1 gap-3 overflow-x-auto scroll-smooth py-1">
                  {registeredAdventures.map((adventure) => (
                    <a
                      key={adventure.publicId}
                      href={`/adventure/${adventure.publicId}/view`}
                      className="flex w-40 flex-shrink-0 flex-col overflow-hidden rounded-lg border border-border bg-card transition-colors hover:border-primary/50"
                    >
                      <div className="relative h-28 flex-shrink-0 bg-muted">
                        {adventure.imageUrl && (
                          <img src={adventure.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
                        )}
                      </div>
                      <p className="truncate p-3 text-sm font-semibold text-foreground">{adventure.name}</p>
                    </a>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => scrollAdventures(1)}
                  className="flex-shrink-0 rounded-full border border-border p-1 text-foreground hover:bg-muted"
                  aria-label={t('form.actions.scrollRight')}
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {!readOnly && (
        <div className="border-t border-border bg-background px-6 py-4">
          <div className="mx-auto flex w-full max-w-5xl gap-3">
            <button type="submit" disabled={saving} className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50">
              {saving ? t('form.actions.saving') : t('form.actions.save')}
            </button>
            <button type="button" onClick={() => navigate(-1)} className="rounded-md border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted">
              {t('form.actions.cancel')}
            </button>
          </div>
        </div>
      )}

      {confirmingDelete && (
        <ConfirmDialog
          message={t('confirm.deleteCharacter', { ns: 'common' })}
          onConfirm={handleDelete}
          onClose={() => setConfirmingDelete(false)}
        />
      )}

      {imagePromptOpen && (
        <ConfirmDialog
          message={t('imagePrompt.message', { ns: 'common' })}
          confirmLabel={t('imagePrompt.generate', { ns: 'common' })}
          cancelLabel={t('imagePrompt.skip', { ns: 'common' })}
          dismissLabel={t('imagePrompt.cancel', { ns: 'common' })}
          confirmVariant="primary"
          onConfirm={() => { setImagePromptOpen(false); submitCharacter(true); }}
          onCancel={() => { setImagePromptOpen(false); submitCharacter(false); }}
          onClose={() => setImagePromptOpen(false)}
        />
      )}
    </form>
  );
}
