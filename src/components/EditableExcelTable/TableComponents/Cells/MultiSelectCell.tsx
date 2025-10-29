import { useEffect, useState } from 'react';
import { useEditableTableStore } from 'src/components/EditableExcelTable/hooks/useEditableExcelTable';
import DropDownHelper from 'src/components/EditableExcelTable/TableComponents/Cells/DropDownHelper';
import { CellProps, Option } from 'src/components/EditableExcelTable/types';
import { cleanDirtyRowData, getDropdownOptionValue, setValidRows } from 'src/components/EditableExcelTable/utils';

const MultiSelectCell = ({ cellIndex, column, data, exitEditMode, isEditing, rowIndex, allowedEditing, isSelected, ...rest }: CellProps) => {
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFocus, setHasFocus] = useState(false);
  const [value, setValue] = useState<Option[] | null>((getDropdownOptionValue(column, data) || []) as Option[]);
  const [, setStore] = useEditableTableStore((prev) => prev.pasteKey);
  const [columns] = useEditableTableStore((prev) => prev.columns);

  useEffect(() => {
    if (!hasFocus) return;
    setOptions(column?.option || []);
    setLoading(false);
  }, [column, hasFocus]);

  const handleCleanDirtyRows = (dirtyRows) => {
    return cleanDirtyRowData(dirtyRows, columns);
  };

  useEffect(() => {
    let errorMessage = '';
    if (column.required && value?.length === 0) {
      errorMessage = `${column.Header} is required`;
    } else {
      errorMessage = '';
    }
    setStore((prev) => setValidRows({ prev, accessor: column.id || column.accessor, rowIndex, errorMessage }));
  }, [value, column.id, column.accessor, column.required, setStore, rowIndex, column.Header]);

  const setValueToState = (newValue: Option[]) => {
    setHasFocus(false);
    setValue(newValue);
    setStore((prev) => {
      const tableData = [...prev.tableData];
      const dirtyRows = [...prev.dirtyRows];
      const key = column.accessor || column.id;
      const [first, ...rest] = newValue;
      if (first) {
        tableData[rowIndex][key] = newValue[0].optionLabel;
        tableData[rowIndex][`${key}Id`] = newValue[0].optionValue;
      } else {
        tableData[rowIndex][key] = '';
        tableData[rowIndex][`${key}Id`] = '';
      }
      tableData[rowIndex][`rest${key}`] = rest ?? [];
      dirtyRows[rowIndex] = handleCleanDirtyRows({ ...tableData[rowIndex], [key]: newValue.map((d) => d.optionValue) });
      return {
        dirtyRows,
        tableData
      };
    });
  };

  return (
    <>
      <DropDownHelper
        multiple={true}
        allowPointer={isSelected}
        options={options}
        loading={hasFocus && loading}
        value={value}
        onChange={(e, value) => setValueToState(value)}
        id={`${column.id}-${rowIndex}-selector`}
        getOptionLabel={(option: Option) => option.optionLabel || ''}
        getOptionKey={(d) => d.optionValue}
        isOptionEqualToValue={(option1, option2) => (option1._id ? option1._id === option2._id : option1.optionValue === option2.optionValue)}
        inputProps={{
          onFocus: () => setHasFocus(true)
        }}
      />
    </>
  );
};

export default MultiSelectCell;
