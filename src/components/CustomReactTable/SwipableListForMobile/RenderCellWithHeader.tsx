import { Edit } from '@material-ui/icons';
import { flexRender } from '@tanstack/react-table';
import { TColType } from '../TableComponents/TableHelperComponents';
import { TInitialState } from '../hooks/useTableReducer';
import { getCellValue, handleCellClick, handleKeyDown } from '../utils';

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

  const CellShell = ({ children }) => {
    return (
      <h6 className=" text-[12px] grid max-w-full">
        <span className="text-[var(--dark-primary-text,#8b8b8b)] text-[10px] font-medium">{field.header}: </span>
        <span
          onKeyDown={(e) => {
            handleKeyDown({ e, currentEditingCellPosition, submitInput });
          }}
          onClick={() => {
            handleCellClick({ cell, dispatch, row, setCellValue });
          }}
          className={`text-[12px_!important]  [&>*]:[font-weight:500_!important] [&>*]:[font-size:12px_!important] [&_h5]:[font-size:12px_!important] [&_*]:[white-space:unset_!important] [&>div]:[flex-wrap:wrap_!important]`}
        >
          {children}
        </span>
      </h6>
    );
  };

  switch (true) {
    case !['selection'].includes(cell?.column.id) &&
      currentEditingCellPosition?.rowId === row.original._id &&
      currentEditingCellPosition?.columnName === cell?.column.id:
      return (
        <CellShell>
          <div className="w-full">
            <input
              title={`Edit-${cell.id}`}
              autoFocus
              onBlur={() => (getCellValue(cell) !== cellValue ? submitInput() : resetField())}
              value={cellValue}
              className="dark:text-[white]  appearance-none w-full focus-within:outline-[var(--new-theme-color)] bg-[transparent] outline-[transparent] shadow-0 border-[0] px-[2px] py-[4px] [border-bottom:1px_solid_var(--common-border-color)_!important]"
              onChange={(e) => setCellValue(e.target.value)}
            />
          </div>
        </CellShell>
      );
    case columnDef?.editable:
      return (
        <CellShell>
          <div className="w-full">
            <div className=" [border-bottom:1px_dashed_#8a8a8a] [display:flex_!important] gap-[20px] justify-end ml-auto cursor-pointer max-w-[max-content]">
              <p>{flexRender(cell.column.columnDef.cell, cell?.getContext())}</p>
              <span>
                <Edit className="text-[rgba(0,0,0,0.3)] dark:text-[rgba(255,255,255,0.9)]" fontSize="small" />
              </span>
            </div>
          </div>
        </CellShell>
      );
    default:
      return <CellShell>{flexRender(cell.column.columnDef.cell, cell?.getContext())}</CellShell>;
  }
};

export default RenderCellWithHeader;
