import { FormControl, MenuItem, Select, IconButton } from '@material-ui/core';
import { ChevronLeft, ChevronRight } from '@material-ui/icons';
import React, { FC, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useDebounce } from 'src/hooks';

interface PaginationProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  count: number;
  page: number;
  onPageChange: (event: React.MouseEvent<any>, newPage: number) => void;
  rowsPerPage: number;
  onRowsPerPageChange: (event: React.ChangeEvent<{ value: unknown }>, value: number) => void;
  rowsPerPageOptions: number[];
  disabled: boolean;
}

const Pagination: FC<PaginationProps> = ({
  className,
  count,
  page = 0,
  onPageChange,
  rowsPerPage,
  onRowsPerPageChange,
  rowsPerPageOptions,
  disabled,
  ...others
}) => {
  const [textFieldvalue, setTextFieldValue] = useState(page + 1);
  const debouncedTextValue = useDebounce<number>(textFieldvalue, 1000);
  const changedFromInput = useRef(false);

  const possibleMaxPage = useMemo(() => {
    return Math.ceil(count / rowsPerPage);
  }, [count, rowsPerPage]);

  const handleRowsPerPageChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    const target = e.target as HTMLInputElement;
    const value = parseInt(target.value);
    if (onRowsPerPageChange) onRowsPerPageChange(e, value);
    setTextFieldValue(1);
  };

  const visibleDataText = useMemo(() => {
    const fromValue = page * rowsPerPage + 1;
    let toValue = page * rowsPerPage + rowsPerPage;
    if (toValue > count) toValue = count;
    return `${fromValue} - ${toValue} of ${count}`;
  }, [count, page, rowsPerPage]);

  const gotToNextPage = useCallback(
    (e: React.MouseEvent<any>) => {
      let newPage = page + 1;
      if (newPage >= possibleMaxPage) newPage = possibleMaxPage - 1;

      if (onPageChange) onPageChange(e, newPage);
      changedFromInput.current = false;
      setTextFieldValue(newPage + 1);
    },
    [page, possibleMaxPage, onPageChange]
  );

  const gotToPrevPage = useCallback(
    (e: React.MouseEvent<any>) => {
      let newPage = page - 1;
      if (newPage < 0) newPage = 0;

      if (onPageChange) onPageChange(e, newPage);
      changedFromInput.current = false;
      setTextFieldValue(newPage + 1);
    },
    [page, onPageChange]
  );

  const handleTextFieldValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value || '1') || 1;
    if (value < 1) value = 1;
    if (value > possibleMaxPage) value = possibleMaxPage;
    changedFromInput.current = true;
    setTextFieldValue(value);
  };

  useEffect(() => {
    if (!changedFromInput.current) return;
    const value = debouncedTextValue - 1;
    if (value < 0) return;
    if (value >= possibleMaxPage) return;
    if (onPageChange) onPageChange(null, value);
  }, [debouncedTextValue]);

  return (
    <div className={`${className} pagination py-3`} {...others}>
      <div className="flex flex-wrap justify-center sm:justify-end items-center sm:gap-3 gap-2">
        <div className="rows-per-page flex items-center gap-2 basis-1/2 sm:basis-[unset]">
          <span>Rows Per Page:</span>
          <FormControl size="small" margin="none" style={{ width: 'max-content' }} disabled={disabled}>
            <Select labelId="label" id="select" value={rowsPerPage || rowsPerPageOptions[0]} variant="outlined" onChange={handleRowsPerPageChange}>
              {rowsPerPageOptions.map((option) => (
                <MenuItem value={option} key={option}>
                  {option}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </div>

        <span className="basis-1/2 sm:basis-[unset] block">{visibleDataText}</span>

        <div className="flex gap-2 items-center">
          <IconButton disabled={disabled || page <= 0} onClick={(e) => gotToPrevPage(e)} size={'small'}>
            <ChevronLeft />
          </IconButton>
          <div className="flex items-center">
            <input
              placeholder="Page"
              title={'Page'}
              disabled={disabled}
              value={textFieldvalue}
              style={{ maxWidth: 30 }}
              onChange={handleTextFieldValue}
              onClick={(e) => {
                const target = e.target as HTMLInputElement;
                target.select();
              }}
              className="bg-transparent appearance-none text-[var(--primary-text)] shadow-none border-none h-[30px] text-center"
            />
            <span>
              - &nbsp;
              {possibleMaxPage}
            </span>
          </div>
          <IconButton disabled={disabled || page + 1 >= possibleMaxPage} onClick={(e) => gotToNextPage(e)} size={'small'}>
            <ChevronRight />
          </IconButton>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
