import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, Pencil, Play, Trash2 } from 'lucide-react';

const BASE_PATH = {
  adventure: '/adventure',
  world: '/world',
  character: '/character',
};

type AdventureCardProps = {
  kind: 'adventure';
  id: string;
  name: string;
  description: string;
  visibility: string;
  imageUrl?: string | null;
  canWrite: boolean;
  onDelete: (id: string) => void;
};

type WorldCardProps = {
  kind: 'world';
  id: string;
  name: string;
  description: string;
  visibility: string;
  imageUrl?: string | null;
  canWrite: boolean;
  onDelete: (id: string) => void;
};

type CharacterCardProps = {
  kind: 'character';
  id: string;
  name: string;
  classLabel: string | null;
  imageUrl?: string | null;
  onDelete: (id: string) => void;
};

type EntityCardProps = AdventureCardProps | WorldCardProps | CharacterCardProps;

export function EntityCard(props: EntityCardProps) {
  const [hovered, setHovered] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const { t } = useTranslation('collection');

  const bodyText = props.kind === 'character' ? null : props.description;
  const viewPath = `${BASE_PATH[props.kind]}/${props.id}/view`;
  const editPath = `${BASE_PATH[props.kind]}/${props.id}/edit`;

  const handleDeleteClick = () => setIsConfirming(true);
  const handleConfirmDelete = () => { setIsConfirming(false); props.onDelete(props.id); };
  const handleCancel = () => { setIsConfirming(false); };

  return (
    <div className="col-span-2 flex h-72 flex-col overflow-hidden rounded-lg border border-border bg-card">
      <div
        className="relative h-40 flex-shrink-0 bg-muted"
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { if (!isConfirming) setHovered(false); }}
      >
        {props.imageUrl && (
          <img src={props.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
        )}
        {isConfirming && (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70">
            <p className="text-sm font-medium text-white">{t('card.confirm')}</p>
            <div className="flex gap-2">
              <button
                onClick={handleConfirmDelete}
                className="flex items-center gap-1 rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
              >
                <Trash2 className="h-3.5 w-3.5" />
                {t('card.actions.delete')}
              </button>
              <button
                onClick={handleCancel}
                className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent/80"
              >
                {t('card.actions.cancel')}
              </button>
            </div>
          </div>
        )}

        {!isConfirming && hovered && (
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/60">
            {props.kind === 'adventure' && (
              <Link
                to={`/adventure/play/${props.id}`}
                className="flex items-center gap-1 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
              >
                <Play className="h-3.5 w-3.5" />
                {t('card.actions.play')}
              </Link>
            )}

            <Link
              to={viewPath}
              className="flex items-center gap-1 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent/80"
            >
              <Eye className="h-3.5 w-3.5" />
              {t('card.actions.view')}
            </Link>

            {(props.kind === 'character' || props.canWrite) && (
              <>
                <Link
                  to={editPath}
                  className="flex items-center gap-1 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground hover:bg-accent/80"
                >
                  <Pencil className="h-3.5 w-3.5" />
                  {t('card.actions.edit')}
                </Link>
                <button
                  onClick={handleDeleteClick}
                  className="flex items-center gap-1 rounded-md bg-destructive px-3 py-1.5 text-sm font-medium text-destructive-foreground hover:bg-destructive/90"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {t('card.actions.delete')}
                </button>
              </>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col gap-1.5 p-3">
        <p className="truncate text-sm font-semibold text-foreground">{props.name}</p>
        {bodyText !== null && <p className="line-clamp-2 text-xs text-muted-foreground">{bodyText}</p>}
        {props.kind === 'character' ? (
          <span className="mt-1 inline-flex w-fit items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {props.classLabel ?? t('card.noClass')}
          </span>
        ) : (
          <span className="mt-1 inline-flex w-fit items-center rounded-full bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">
            {props.visibility}
          </span>
        )}
      </div>
    </div>
  );
}
