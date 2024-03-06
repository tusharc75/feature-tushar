import React, { useCallback, useState } from 'react';
import { Popover, TextField, Box, CircularProgress } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import routes from 'src/components/Helpers/Routes';
import { debounce } from 'lodash';
import axiosInstance from 'src/axios/axiosInstance';
import { sidebarResource } from 'src/constants/helpers';
import { useData } from 'src/StateProvider/Provider';
interface Props {
  filters: { key: string; title: string; multiple?: boolean; defaultValue?: number; }[];
  anchorEl: any;
  closeAnchor: () => any;
  values: any;
  setValues: any;
  filterOptions: any;
  isCRM: boolean;
}

const FiltersDropdown = ({ filterOptions, filters, anchorEl, closeAnchor, values, setValues, isCRM }: Props) => {
  const {
    state: { selectedEntity }
  } = useData();
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState({ loading: false, resource: null });
  const [currentPage, setCurrentPage] = useState(0);
  const [inputValues, setInputValues] = useState({});
  
  React.useEffect(() => {
    if (!filters) return;
    filters.forEach((filter) => {
      setValues((prevState: any) => ({
        ...prevState,
        [filter.key]: filter?.multiple ? [] : filter.key === 'status' && isCRM ? { optionValue: 'open', optionLabel: 'Open' } : filter?.defaultValue
      }));
    });
  }, [filters]);

  const fetchOptions = useCallback(
    debounce(async (resource: string, searchKey: string = '', page: number = 0, key: string = '') => {
      try {
        const lookupResourceName = resource;
        if (searchKey !== '') {
          page = 0;
          setCurrentPage(0);
        }
        if (page === 0) {
          setCurrentPage(0);
          setOptions([]);
        }
        let query = `sa-field/options?resource=${lookupResourceName}&limit=25&page=${page}&search=${searchKey}`;
        const response = await axiosInstance().get(query);
        let data = response?.data?.data
        if(resource===sidebarResource.customerAccount){
          data = data.filter((c: any) =>
              Array.isArray(c?.entity) ? c?.entity?.findIndex((entity: any) => entity === selectedEntity) !== -1 : c?.entity === selectedEntity
            )
        }
        if(resource===sidebarResource.user){
          data = data.filter((u: any) => u?.entities?.findIndex((d: any) => d.entity === selectedEntity) !== -1)
        }
        if(resource===sidebarResource.marketSegment){
          if(key==='marketSegment'){
            data = data.filter((d) => !d.parentMarketSegment);
          }else if(key==='subMarketSegment'){
            data = data.filter((d) => d.parentMarketSegment);
          }
        }
       
        setOptions((currentOptions) => {
          return page === 0 ? [...data] : [...currentOptions, ...data];
        });
        if (page > 0 && data?.length > 0) {
          setCurrentPage(page);
        }
        setLoading({ loading: false, resource: null });
      } catch (error) {
        console.error(error);
      }
    }, 1000),
    []
  );

  const handleChange = (key: string, val: any) => {
    if (key === 'marketSegment') {
      setValues((prevState: any) => ({ ...prevState, subMarketSegment: {} }));
    }
    setValues((prevState: any) => ({ ...prevState, [key]: val }));
  };

  if (!values) return <p>Loading...</p>;
  
  return (
    <Popover
      open={Boolean(anchorEl)}
      anchorEl={anchorEl}
      onClose={closeAnchor}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center'
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center'
      }}
    >
  <Box width={300} padding={'0px 16px 16px 16px'}>
  {filters.map((filter:any, index) => (
    <Box mt={'16px'} key={index}>
      {filter.key in filterOptions ? (
        filterOptions[filter.key] ? (
          <Autocomplete
            size="small"
            multiple={filter?.multiple}
            fullWidth
            options={filterOptions[filter.key]}
            autoHighlight
            value={values[filter.key]}
            getOptionLabel={(option: any) => option.optionLabel}
            getOptionSelected={(option, val) => option.optionValue === val.optionValue}
            onChange={(_, val) => {
              handleChange(filter.key, val);
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={routes[filter.key] ? routes[filter.key]?.title : filter.title}
                variant="outlined"
              />
            )}
          />
        ) : (
          <Autocomplete
            size="small"
            multiple={filter?.multiple}
            fullWidth
            inputValue={inputValues[filter.key] || ''}
            onOpen={() => {
                setOptions([]);
                setLoading({ loading: true, resource: filter?.resource });
                fetchOptions(filter?.resource, '',0,filter.key)
            }}
            onInputChange={(event, value, reason) => {
              if (reason === 'input') {
                setInputValues((prevValues) => ({ ...prevValues, [filter?.key]: value }));
                fetchOptions(filter?.resource, value);
              }
            }}
            loading={loading.loading && loading.resource === filter?.resource}
            options={options}
            autoHighlight
            value={values[filter.key]}
            getOptionLabel={(option: any) => option.optionLabel}
            getOptionSelected={(option, val) => option.optionValue === val.optionValue}
            onChange={(_, val) => {
              handleChange(filter.key, val);
              setInputValues((prevValues) => ({ ...prevValues, [filter.key]: '' }));
            }}
            renderInput={(params) => (
              <TextField
                {...params}
                label={routes[filter.key] ? routes[filter.key]?.title : filter.title}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loading.loading && loading.resource === filter?.resource ? (
                        <CircularProgress color="inherit" size={20} />
                      ) : null}
                      {params.InputProps.endAdornment}
                    </>
                  )
                }}
                variant="outlined"
              />
            )}
            ListboxProps={{
              onScroll: (e:any) => {
                if (e.target.scrollTop + e.target.clientHeight === e.target.scrollHeight) {
                  setLoading({ loading: true, resource: filter?.resource });
                  fetchOptions(filter?.resource, '', currentPage + 1);
                }
              }
            }}
          />
        )
      ) : (
        <TextField
          variant="outlined"
          type="number"
          onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
          label={filter?.title}
          name={filter.key}
          fullWidth
          margin="dense"
          value={values[filter.key]}
          onChange={(e) => handleChange(filter.key, Number(e.target.value))}
        />
      )}
    </Box>
  ))}
</Box>

    </Popover>
  );
};

export default FiltersDropdown;
