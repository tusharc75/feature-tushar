import { CalendarMonth } from '@mui/icons-material';
import { IconButton, Popover } from '@mui/material';
import { StaticDateTimePicker, StaticDateTimePickerProps } from '@mui/x-date-pickers/StaticDateTimePicker';
import dayjs from 'dayjs';
import React, { useEffect, useRef, useState } from 'react';
import { TColType } from 'src/components/CustomReactTable/TableComponents/TableHelperComponents';
import { useEditableTableStore } from 'src/components/EditableExcelTable/hooks/useEditableExcelTable';
import { CellProps } from 'src/components/EditableExcelTable/types';
import { getCellValue, renderCellText } from 'src/components/EditableExcelTable/utils';

const getCellDateTime = (column: TColType, data: any) => {
  return getCellValue(column, data) ? dayjs.tz(new Date(getCellValue(column, data))) : dayjs.tz(new Date());
};

const DateTimePickerCell = ({
  cellIndex,
  column,
  data,
  exitEditMode,
  isEditing,
  rowIndex,
  allowedEditing,
  ...rest
}: CellProps & StaticDateTimePickerProps<dayjs.Dayjs>) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [, setStore] = useEditableTableStore((prev) => prev.pasteKey);
  const [value, setValue] = useState(getCellDateTime(column, data));

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = (newValue: dayjs.Dayjs = value, save = true) => {
    setAnchorEl(null);
    if (!save) {
      setValue(getCellDateTime(column, data));
      return;
    }
    setStore((prev) => {
      const tableData = [...prev.tableData];
      const dirtyRows = [...prev.dirtyRows];
      const key = column.accessor || column.id;
      tableData[rowIndex][key] = newValue.toISOString();
      dirtyRows[rowIndex] = { ...tableData[rowIndex], [key]: newValue.toISOString() };
      setValue(getCellDateTime(column, tableData[rowIndex]));
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
            <StaticDateTimePicker
              views={['year', 'month', 'day', 'hours', 'minutes']}
              value={value}
              onChange={(date) => setValue(date)}
              onAccept={(value) => handleClose(value, true)}
              {...rest}
            />
          </Popover>
        </div>
      </span>
    </>
  );
};

export default DateTimePickerCell;
