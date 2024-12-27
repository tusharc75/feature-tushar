import CellDialog from 'src/components/CustomReactTable/Cells/CellDialog';
import NoDataCell from 'src/components/Helpers/NoDataCell';

type RichTextEditorCellProps = {
  field: any;
  original: any;
  enableDilaog?: boolean;
};

function RichTextEditorCell({ field, original, enableDilaog = true }: RichTextEditorCellProps) {
  const textContent = original?.[field.fieldName] ? original?.[field.fieldName] : "";
  const NoData = enableDilaog ? <NoDataCell /> : <span className="block">-</span>;

  if (!textContent) return NoData;

  return (
    <CellDialog dialogTitle={field.fieldLabel}>
      <div className="max-w-full text-wrap" dangerouslySetInnerHTML={{ __html: textContent }} />
    </CellDialog>
  );
}

export default RichTextEditorCell;
