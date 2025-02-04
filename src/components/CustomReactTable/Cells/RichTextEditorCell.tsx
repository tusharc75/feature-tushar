import { useMemo } from 'react';
import CellDialog from 'src/components/CustomReactTable/Cells/CellDialog';
import NoDataCell from 'src/components/Helpers/NoDataCell';

type RichTextEditorCellProps = {
  field: any;
  original: any;
  enableDilaog?: boolean;
};

function RichTextEditorCell({ field, original, enableDilaog = true }: RichTextEditorCellProps) {
  const textContent = useMemo(() => (original?.[field.fieldName] ? original?.[field.fieldName] : ''), [field.fieldName, original]);
  const NoData = useMemo(() => (enableDilaog ? <NoDataCell /> : <span className="block">-</span>), [enableDilaog]);

  if (!textContent) return NoData;

  return (
    <CellDialog dialogTitle={field.fieldLabel}>
      <div className="max-w-full text-wrap" dangerouslySetInnerHTML={{ __html: textContent }} />
    </CellDialog>
  );
}

export default RichTextEditorCell;
