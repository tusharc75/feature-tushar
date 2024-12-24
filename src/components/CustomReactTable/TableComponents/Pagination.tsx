import { FormControl, MenuItem, Select, IconButton } from '@mui/material';
import { ChevronLeft, ChevronRight } from '@mui/icons-material';
import React, { FC, useState, useCallback, useMemo, useEffect, useRef } from 'react';
import { useDebounce } from 'src/hooks';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import axiosInstance from 'src/axios/axiosInstance';
import { useData } from 'src/StateProvider/Provider';
import { SET_USER } from 'src/StateProvider/actionTypes';

interface PaginationProps extends React.HtmlHTMLAttributes<HTMLDivElement> {
  count: number;
  page: number;
  onPageChange: (event: React.MouseEvent<any>, newPage: number) => void;
  rowsPerPage: number;
  onRowsPerPageChange: (event: React.ChangeEvent<{ value: unknown }>, value: number) => void;
  rowsPerPageOptions: number[];
  disabled: boolean;
  renderedFrom: string;
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
  renderedFrom,
  ...others
}) => {
  const [textFieldvalue, setTextFieldValue] = useState(page + 1);
  const debouncedTextValue = useDebounce<number>(textFieldvalue, 800);
  const changedFromInput = useRef(false);
  const [isConfirmDialogOpen, setIsConfirmDialogOpen] = useState<{ value: number; loading: boolean }>(null);

  const {
    state: { user },
    dispatch
  }: any = useData();

  const possibleMaxPage = useMemo(() => {
    return Math.ceil(count / rowsPerPage);
  }, [count, rowsPerPage]);

  const handleSaveRowsPerPage = async (value: number) => {
    setIsConfirmDialogOpen((prev) => (prev ? { ...prev, loading: true } : null));
    try {
      await axiosInstance().put('/user/grid-view/grid-rows-per-page', { rowsPerPage: value, resource: renderedFrom });
      const gridRowsPerPage = [...(user?.gridRowsPerPage || [])];
      const foundedIndex = gridRowsPerPage.findIndex((d) => d.resource === renderedFrom);
      if (foundedIndex > -1) {
        gridRowsPerPage[foundedIndex] = { ...gridRowsPerPage[foundedIndex], rowsPerPage: value };
      } else {
        gridRowsPerPage.push({ resource: renderedFrom, rowsPerPage: value, _id: Date.now().toString() });
      }
      const newUser = { ...user, gridRowsPerPage: gridRowsPerPage };
      dispatch({ type: SET_USER, payload: newUser });
    } catch (error) {
      console.error(error);
    } finally {
      setIsConfirmDialogOpen(null);
    }
  };

  const handleRowsPerPageChange = (e: React.ChangeEvent<{ value: unknown }>) => {
    const target = e.target as HTMLInputElement;
    const value = parseInt(target.value);
    setIsConfirmDialogOpen({ value, loading: false });
    if (onRowsPerPageChange) onRowsPerPageChange(e, value);
    setTextFieldValue(1);
  };

  useEffect(() => {
    setTextFieldValue(page + 1);
  }, [page]);

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
    <div className={`${className} pagination py-3 max-[768px]:mt-3`} {...others}>
      <div className="flex flex-wrap items-center justify-between gap-2 sm:justify-end sm:gap-3">
        <div className="rows-per-page sm:justify-[unset] flex items-center justify-center gap-2 min-[768px]:ml-auto max-[768px]:[&_.MuiSelect-iconOutlined]:[right:2px_!important] max-[768px]:[&_.MuiSelect-select]:[padding:5.5px_29px_5.5px_10px_!important]">
          <span className="max-[768px]:sr-only">Rows Per Page:</span>
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

        <span className="block text-gray-500 dark:text-gray-300 max-[768px]:text-[13px]">{visibleDataText}</span>

        <div className="flex items-center gap-2 max-[365px]:mx-auto">
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
              className={`h-[30px] appearance-none rounded-md border-none bg-transparent text-center text-[var(--primary-text)] shadow-none [border:1px_solid_var(--common-border-color)] focus-within:outline-[var(--new-theme-color)]`}
            />
            &nbsp;
            <span>
              -&nbsp;
              {possibleMaxPage}
            </span>
          </div>
          <IconButton disabled={disabled || page + 1 >= possibleMaxPage} onClick={(e) => gotToNextPage(e)} size={'small'}>
            <ChevronRight />
          </IconButton>
        </div>
      </div>
      {Boolean(isConfirmDialogOpen) && (
        <ConfirmationDialog
          title={'Set as default'}
          message={`Would you like to set ${isConfirmDialogOpen.value} as the default "Rows Per Page" for this table?`}
          onOk={() => {
            handleSaveRowsPerPage(isConfirmDialogOpen.value as number);
          }}
          onClose={() => setIsConfirmDialogOpen(null)}
          open={Boolean(isConfirmDialogOpen)}
          okBtnLoading={isConfirmDialogOpen.loading}
        />
      )}
    </div>
  );
};

export default Pagination;
