import { CalendarMonth } from '@mui/icons-material';
import { IconButton, Popover } from '@mui/material';
import { DateCalendar, DateCalendarProps } from '@mui/x-date-pickers/DateCalendar';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';
import { TColType } from 'src/components/CustomReactTable/TableComponents/TableHelperComponents';
import { useEditableTableStore } from 'src/components/EditableExcelTable/hooks/useEditableExcelTable';
import { CellProps } from 'src/components/EditableExcelTable/types';
import { cleanDirtyRowData, getCellValue, renderCellText } from 'src/components/EditableExcelTable/utils';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const getCellDate = (column: TColType, data: any) => {
  return !!getCellValue(column, data) ? dayjs.tz(new Date(getCellValue(column, data))) : dayjs.tz(new Date());
};

const DatePickerCell = ({
  cellIndex,
  column,
  data,
  exitEditMode,
  isEditing,
  rowIndex,
  allowedEditing,
  ...rest
}: CellProps & DateCalendarProps<dayjs.Dayjs>) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [, setStore] = useEditableTableStore((prev) => prev.pasteKey);
  const [columns] = useEditableTableStore((prev) => prev.columns);
  const [value, setValue] = useState(getCellDate(column, data));

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (newValue: dayjs.Dayjs = value, save = true) => {
    setAnchorEl(null);
    if (!save) {
      setValue(getCellDate(column, data));
      return;
    }
    setStore((prev) => {
      const tableData = [...prev.tableData];
      const dirtyRows = [...prev.dirtyRows];
      const key = column.accessor || column.id;
      tableData[rowIndex][key] = newValue.toISOString();
      dirtyRows[rowIndex] = cleanDirtyRowData(
        { ...tableData[rowIndex], [key]: newValue.toISOString() },
        columns.map((d) => d.id ?? d.accessor)
      );
      setValue(getCellDate(column, tableData[rowIndex]));
      return {
        dirtyRows,
        tableData
      };
    });
  };

  const open = Boolean(anchorEl);
  const id = open ? 'date-picker-popover' : undefined;

  useEffect(() => {
    if (isEditing) {
      setAnchorEl(buttonRef.current);
    }
  }, [isEditing]);

  return (
    <>
      <span className={'flex items-center gap-2'}>
        <span className=" truncate">{renderCellText(data, column)}</span>
        <div className="ml-auto">
          <IconButton aria-describedby={id} ref={buttonRef} onClick={handleClick} size={'small'} className="ml-auto">
            <CalendarMonth />
          </IconButton>
          <Popover
            id={id}
            open={open}
            anchorEl={anchorEl}
            onClose={() => handleClose(value, false)}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right'
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right'
            }}
          >
            <DateCalendar views={['year', 'month', 'day']} value={value} onChange={(date) => setValue(date)} {...rest} />
            <div className="flex items-center justify-end py-2 pr-2">
              <ThemeButton buttonType="transparent" onClick={() => handleClose(value, false)}>
                Cancel
              </ThemeButton>
              <ThemeButton buttonType="transparent" onClick={() => handleClose(value, true)}>
                Ok
              </ThemeButton>
            </div>
          </Popover>
        </div>
      </span>
    </>
  );
};

export default DatePickerCell;
