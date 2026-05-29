import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useConvention } from '../api/queries';
import { ConventionEditor } from './ConventionLibraryPage';

export function ConventionEditorPage() {
  const { id } = useParams<{ id: string }>();
  const { t } = useTranslation('editor');
  const { data: convention, isLoading, error } = useConvention(id);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-[14px] text-fg-muted">
        {t('conventionEditorPage.loading')}
      </div>
    );
  }

  if (error || !convention) {
    return (
      <div className="flex h-full items-center justify-center text-[14px] text-danger">
        {t('conventionEditorPage.notFound')}
      </div>
    );
  }

  return <ConventionEditor convention={convention} />;
}
