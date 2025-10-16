import { useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import { useEditableTableStore } from 'src/components/EditableExcelTable/hooks/useEditableExcelTable';
import DropDownHelper from 'src/components/EditableExcelTable/TableComponents/Cells/DropDownHelper';
import { CellProps, Option } from 'src/components/EditableExcelTable/types';
import { getDropdownOptionValue } from 'src/components/EditableExcelTable/utils';

const DropDownCell = ({ cellIndex, column, data, exitEditMode, isEditing, rowIndex, allowedEditing, isSelected, ...rest }: CellProps) => {
  const [options, setOptions] = useState<Option[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasFocus, setHasFocus] = useState(false);
  const [value, setValue] = useState<Option | null>(getDropdownOptionValue(column, data) as Option);
  const [, setStore] = useEditableTableStore((prev) => prev.pasteKey);

  useEffect(() => {
    if (!hasFocus) return;
    if (column.lookup) {
      const lookupResource = column.lookupResource === 'Quote' ? 'quoteBuilder' : column.lookupResource;
      axiosInstance()
        .get(`/sa-formbuilder/lookup?lookupResource=${lookupResource}`)
        .then(({ data: { data } }) => {
          setOptions(data[lookupResource] || []);
          setLoading(false);
        })
        .catch((error) => {
          console.error(error);
          setOptions([]);
          setLoading(false);
        });
    } else {
      setOptions(column?.option || []);
      setLoading(false);
    }
  }, [column, hasFocus]);

  const handleBlur = (newValue: Option | null) => {
    setHasFocus(false);
    setStore((prev) => {
      const tableData = [...prev.tableData];
      const dirtyRows = [...prev.dirtyRows];
      const key = column.accessor || column.id;
      if (newValue) {
        tableData[rowIndex][key] = newValue.optionLabel;
        if (column.lookup) {
          tableData[rowIndex][key] = newValue.optionLabel;
          tableData[rowIndex][`${key}Id`] = newValue.optionValue;
        }
        dirtyRows[rowIndex] = { ...tableData[rowIndex], [key]: newValue.optionValue };
      } else {
        tableData[rowIndex][key] = '';
        if (column.lookup) {
          tableData[rowIndex][key] = '';
          tableData[rowIndex][`${key}Id`] = '';
        }
        dirtyRows[rowIndex] = { ...tableData[rowIndex], [key]: '' };
      }
      setValue(getDropdownOptionValue(column, data) as Option);
      return {
        dirtyRows,
        tableData
      };
    });
  };

  return (
    <>
      <DropDownHelper
        allowPointer={isSelected}
        options={options}
        loading={hasFocus && loading}
        value={value}
        onChange={(e, value) => setValue(value)}
        id={`${column.id}-${rowIndex}-selector`}
        getOptionLabel={(option: Option) => option.optionLabel || ''}
        inputProps={{
          onFocus: () => setHasFocus(true),
          onBlur: () => handleBlur(value)
        }}
      />
    </>
  );
};

export default DropDownCell;
