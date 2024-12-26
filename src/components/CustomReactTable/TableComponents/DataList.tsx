import { CircularProgress, TextField } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import { debounce, uniqBy } from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';

const DataList = ({ columnDef, cellValue, setCellValue, cell, currentEditingCellPosition, onBlur }) => {
  const [defaultOptions, setDefaultOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [inputValues, setInputValues] = useState('');

  useEffect(() => {
    const { row, column } = cell;
    let option: any = [];
    if (column?.columnDef?.type === 'multiSelect') {
      if (row.original[column.id]) {
        option.push({
          optionLabel: row.original[column.id],
          optionValue: row.original[`${column.id}Id`]
        });
      }
      if (row.original[`rest${column.id}`]?.length > 0) {
        row.original[`rest${column.id}`]?.forEach((_d) => {
          option.push(_d);
        });
      }
    } else {
      if (row.original[column.id]) {
        option.push({
          optionLabel: row.original[column.id],
          optionValue: row.original[`${column.id}Id`]
        });
      }
    }
    setDefaultOptions(option);
  }, []);

  const fetchOptions = useCallback(
    debounce(async (searchKey: string = '', page: number = 0) => {
      try {
        if (searchKey !== '') {
          page = 0;
          setCurrentPage(0);
        }
        if (page === 0) {
          setCurrentPage(0);
          columnDef.option = [];
        }
        let query = `${routes?.dataList?.path}/data-list-items/${columnDef?.dataListId}?limit=25&page=${page}&search=${encodeURIComponent(
          searchKey
        )}`;
        const {
          data: {
            data: { data }
          }
        } = await axiosInstance().get(query);
        const option = data?.map((d) => ({ optionLabel: d?.title, optionValue: d?._id }));
        columnDef.option = page === 0 ? [...option] : [...(columnDef?.option || []), ...option];
        if (page > 0 && option?.length > 0) {
          setCurrentPage(page);
        }
        setLoading(false);
      } catch (error) {
        console.error(error);
      }
    }, 1000),
    []
  );

  const handleInputChangeMulti = (event, value, reason) => {
    if (reason === 'input') {
      setInputValues(event.target.value);
      fetchOptions(event.target.value);
    }
  };

  return columnDef?.type === 'multiSelect' ? (
    <Autocomplete
      onOpen={() => {
        setLoading(true);
        fetchOptions();
      }}
      onKeyDown={(e) => {
        const target = e.target as HTMLInputElement;
        if (!currentEditingCellPosition) return;
        if (e.key === 'Enter') {
          e.preventDefault();
          target.blur();
        }
      }}
      inputValue={inputValues}
      onInputChange={handleInputChangeMulti}
      loading={loading}
      limitTags={2}
      multiple
      fullWidth
      disableCloseOnSelect={true}
      options={uniqBy([...columnDef?.option, ...defaultOptions], 'optionValue')}
      getOptionLabel={(option: any) => {
        return option ? option?.optionLabel || '' : '';
      }}
      value={
        cellValue
          ? uniqBy([...columnDef?.option, ...defaultOptions], 'optionValue')?.filter((data: any) => cellValue?.includes(data.optionValue))
          : []
      }
      isOptionEqualToValue={(option: any, val: any) => option.optionValue === val.optionValue}
      onChange={(e, val: any) => {
        setCellValue(val ? val.map((val) => val?.optionValue) : []);
        setInputValues('');
      }}
      forcePopupIcon={true}
      renderInput={(params) => (
        <TextField
          {...params}
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={20} /> : null}
                  {params.InputProps.endAdornment}
                </>
              )
            }
          }}
          autoFocus
          onBlur={onBlur}
        />
      )}
      ListboxProps={{
        onScroll: (e) => {
          if (e.target.scrollTop + e.target.clientHeight === e.target.scrollHeight) {
            setLoading(true);
            fetchOptions('', currentPage + 1);
          }
        }
      }}
    />
  ) : (
    <Autocomplete
      onInputChange={(event, value, reason) => {
        if (reason === 'input') {
          fetchOptions(value);
        }
      }}
      onOpen={() => {
        setLoading(true);
        fetchOptions();
      }}
      onKeyDown={(e) => {
        const target = e.target as HTMLInputElement;
        if (!currentEditingCellPosition) return;
        if (e.key === 'Enter') {
          e.preventDefault();
          target.blur();
        }
      }}
      options={uniqBy([...columnDef?.option, ...defaultOptions], 'optionValue')}
      fullWidth
      loading={loading}
      getOptionLabel={(option: any) => (option ? option?.optionLabel || '' : '')}
      isOptionEqualToValue={(option: any, val) => option?.optionValue === val}
      value={uniqBy([...columnDef?.option, ...defaultOptions], 'optionValue').find((data: any) => data.optionValue === cellValue) || ''}
      onChange={(e, val) => {
        setCellValue(val?.optionValue || '');
      }}
      selectOnFocus
      clearOnBlur
      handleHomeEndKeys
      forcePopupIcon={true}
      size="small"
      renderInput={(params) => (
        <TextField
          {...params}
          slotProps={{
            input: {
              ...params.InputProps,
              endAdornment: (
                <>
                  {loading ? <CircularProgress color="inherit" size={15} /> : null}
                  {params.InputProps.endAdornment}
                </>
              )
            }
          }}
          autoFocus
          onBlur={onBlur}
        />
      )}
      ListboxProps={{
        onScroll: (e) => {
          if (e.target.scrollTop + e.target.clientHeight === e.target.scrollHeight) {
            setLoading(true);
            fetchOptions('', currentPage + 1);
          }
        }
      }}
    />
  );
};

export default DataList;
