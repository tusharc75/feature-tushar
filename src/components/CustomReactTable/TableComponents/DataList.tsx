import { CircularProgress, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import { debounce, uniqBy } from 'lodash';
import { useCallback, useEffect, useState } from 'react';
import axiosInstance from 'src/axios/axiosInstance';
import routes from 'src/components/Helpers/Routes';

const DataList = ({ columnDef, cellValue, setCellValue, cell }) => {
    const [options, setOptions] = useState([]);
  const [defaultOptions, setDefaultOptions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(0);
  const [inputValues, setInputValues] = useState('');

  useEffect(() => {
    console.log('aaaaaaaaa', cellValue, uniqBy([...columnDef?.option, ...defaultOptions], 'optionValue'), columnDef?.option);
  }, []);

  useEffect(() => {
    const { row, column } = cell;
    let option: any = [];
    if (column?.columnDef?.type === 'multiSelect') {
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
          // columnDef.option = [];
          setOptions([])
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
        // columnDef.option = page === 0 ? [...option] : [...(columnDef?.option || []), ...option];
        setOptions((currentOptions) => {
          return page === 0 ? [...option] : [...currentOptions, ...option];
        });
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

  return columnDef?.type === 'multiSelect' ? (
    <>mmmmm</>
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
      // options={uniqBy([...columnDef?.option, ...defaultOptions], 'optionValue')}
      options={uniqBy([...options, ...defaultOptions], 'optionValue')}
      fullWidth
      loading={loading}
      getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
      getOptionSelected={(option: any, val) => option?.optionValue === val}
      // value={uniqBy([...columnDef?.option, ...defaultOptions], 'optionValue').find((data: any) => data.optionValue === cellValue) || ''}
      value={uniqBy([...options, ...defaultOptions], 'optionValue').find((data: any) => data.optionValue === cellValue) || ''}
      onChange={(e, val) => {
        console.log('vvvvvvvv', val, cellValue);
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
          InputProps={{
            ...params.InputProps,
            endAdornment: (
              <>
                {loading ? <CircularProgress color="inherit" size={15} /> : null}
                {params.InputProps.endAdornment}
              </>
            )
          }}
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
