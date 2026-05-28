import { useParams } from 'react-router-dom';
import { useConvention } from '../api/queries';
import { ConventionEditor } from './ConventionLibraryPage';

export function ConventionEditorPage() {
  const { id } = useParams<{ id: string }>();
  const { data: convention, isLoading, error } = useConvention(id);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center text-[14px] text-fg-muted">
        Loading…
      </div>
    );
  }

  if (error || !convention) {
    return (
      <div className="flex h-full items-center justify-center text-[14px] text-danger">
        Convention not found.
      </div>
    );
  }

  return <ConventionEditor convention={convention} />;
}
