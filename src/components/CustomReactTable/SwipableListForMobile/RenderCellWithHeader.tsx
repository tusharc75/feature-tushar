import { Edit } from '@material-ui/icons';
import { flexRender } from '@tanstack/react-table';
import { TColType } from '../TableComponents/TableHelperComponents';
import { TInitialState } from '../hooks/useTableReducer';
import { getCellValue, handleCellClick, handleKeyDown } from '../utils';

const CellShell = ({ children, field, currentEditingCellPosition, submitInput, cell, dispatch, row, setCellValue }) => {
  return (
    <h6 className=" grid max-w-full text-[12px]">
      <span className="text-[8px] font-medium text-[var(--dark-secondary-text,#8b8b8b)]">{field.header}: </span>
      <span
        onKeyDown={(e) => {
          handleKeyDown({ e, currentEditingCellPosition, submitInput });
        }}
        onClick={() => {
          handleCellClick({ cell, dispatch, row, setCellValue });
        }}
        className={`text-[12px_!important]  [&>*]:[font-size:12px_!important] [&>*]:[font-weight:500_!important] [&>div]:[flex-wrap:wrap_!important] [&_*]:[white-space:unset_!important] [&_h5]:[font-size:12px_!important]`}
      >
        {children}
      </span>
    </h6>
  );
};

const RenderCellWithHeader = ({ field, row, submitInput, cellValue, setCellValue, state, dispatch }: any) => {
  const { currentEditingCellPosition }: TInitialState = state;
  const cell = row.getVisibleCells().find((cell: any) => cell?.column?.id === field?.id);
  if (!cell) return null;
  const columnDef: TColType = cell.column.columnDef as TColType;

  const resetField = () => {
    dispatch({
      type: 'currentEditingCellPosition',
      cellPosition: null
    });
  };

  switch (true) {
    case !['selection'].includes(cell?.column.id) &&
      currentEditingCellPosition?.rowId === row.original._id &&
      currentEditingCellPosition?.columnName === cell?.column.id:
      return (
        <CellShell
          field={field}
          currentEditingCellPosition={currentEditingCellPosition}
          submitInput={submitInput}
          cell={cell}
          dispatch={dispatch}
          row={row}
          setCellValue={setCellValue}
        >
          <div className="w-full">
            <input
              title={`Edit-${cell.id}`}
              autoFocus
              onBlur={() => (getCellValue(cell) !== cellValue ? submitInput() : resetField())}
              value={cellValue}
              className="shadow-0  w-full appearance-none border-[0] bg-[transparent] px-[2px] py-[4px] outline-[transparent] [border-bottom:1px_solid_var(--common-border-color)_!important] focus-within:outline-[var(--new-theme-color)] dark:text-[white]"
              onChange={(e) => setCellValue(e.target.value)}
            />
          </div>
        </CellShell>
      );
    case columnDef?.editable:
      return (
        <CellShell
          field={field}
          currentEditingCellPosition={currentEditingCellPosition}
          submitInput={submitInput}
          cell={cell}
          dispatch={dispatch}
          row={row}
          setCellValue={setCellValue}
        >
          <div className="w-fit">
            <div className=" ml-auto max-w-[max-content] cursor-pointer justify-end gap-[20px] [border-bottom:1px_dashed_#8a8a8a] [display:flex_!important]">
              <p>{flexRender(cell.column.columnDef.cell, cell?.getContext())}</p>
              <span>
                <Edit className="text-[rgba(0,0,0,0.3)] dark:text-[rgba(255,255,255,0.9)]" fontSize="small" />
              </span>
            </div>
          </div>
        </CellShell>
      );
    default:
      return (
        <CellShell
          field={field}
          currentEditingCellPosition={currentEditingCellPosition}
          submitInput={submitInput}
          cell={cell}
          dispatch={dispatch}
          row={row}
          setCellValue={setCellValue}
        >
          {flexRender(cell.column.columnDef.cell, cell?.getContext())}
        </CellShell>
      );
  }
};

export default RenderCellWithHeader;
