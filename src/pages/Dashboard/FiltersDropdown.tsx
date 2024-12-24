import { Box, Button, IconButton, Popover, TextField } from '@mui/material';
import { Autocomplete } from '@material-ui/lab';
import { isEmpty } from 'lodash';
import React, { useContext, useState } from 'react';
import { AiFillEdit } from 'react-icons/ai';
import { RiDeleteBin6Fill } from 'react-icons/ri';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import axiosInstance from 'src/axios/axiosInstance';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import AsyncDropDown from 'src/components/Helpers/FormTypes/AsyncDropdown';
import routes from 'src/components/Helpers/Routes';
import SaveFilterDialog from './SaveFilterDialog';
interface Props {
  filters: { key: string; title: string; multiple?: boolean; defaultValue?: number }[];
  anchorEl: any;
  closeAnchor: () => any;
  values: any;
  setValues: any;
  filterOptions: any;
  isCRM: boolean;
  kpi: string;
  kpiFilters: any[];
  fetchKpiFilters: () => any;
}

const FiltersDropdown = ({ filterOptions, filters, anchorEl, closeAnchor, values, setValues, isCRM, kpi, kpiFilters, fetchKpiFilters }: Props) => {
  const {
    state: { resources }
  } = useData();
  const [inputValues, setInputValues] = useState({});
  const [selectedKpiFilter, setSelectedKpiFilter] = useState(null);
  const [isFilterDeleteConfirm, setIsFilterDeleteConfirm] = useState({ open: false, ids: null });
  const [isSaveFilter, setIsSaveFilter] = useState({ open: false, data: null });
  const { setToastConfig } = useContext(CustomToastContext);

  React.useEffect(() => {
    if (!filters && !selectedKpiFilter) return;
    filters.forEach((filter) => {
      setValues((prevState: any) => ({
        ...prevState,
        [filter.key]: filter?.multiple ? [] : filter.key === 'status' && isCRM ? { optionValue: 'open', optionLabel: 'Open' } : filter?.defaultValue
      }));
    });
  }, [filters]);

  React.useEffect(() => {
    setSelectedKpiFilter(kpiFilters?.find((f) => f?.default) || null);
  }, [kpiFilters]);

  React.useEffect(() => {
    if (!isEmpty(selectedKpiFilter?.filterValue)) {
      setValues(selectedKpiFilter.filterValue);
      setInputValues(selectedKpiFilter.filterValue);
    } else {
      setValues(() => {
        return filters.reduce((acc, filter) => {
          return {
            ...acc,
            [filter.key]: filter?.multiple
              ? []
              : filter.key === 'status' && isCRM
                ? { optionValue: 'open', optionLabel: 'Open' }
                : filter?.defaultValue
          };
        }, {});
      });
      setInputValues({});
    }
  }, [selectedKpiFilter]);

  const handleChange = (key: string, val: any) => {
    if (key === 'marketSegment') {
      setValues((prevState: any) => ({ ...prevState, subMarketSegment: {} }));
    }
    setValues((prevState: any) => ({ ...prevState, [key]: val }));
  };

  if (!values) return <p>Loading...</p>;

  const handleDeleteUserFilter = () => {
    axiosInstance()
      .put(`/kpi/filters/remove`, { ids: isFilterDeleteConfirm.ids })
      .then(({ data }) => {
        fetchKpiFilters();
        setIsFilterDeleteConfirm({ open: false, ids: null });
        setSelectedKpiFilter(null);
        setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((err) => {
        setToastConfig(err);
      });
  };

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
      <Box width={300} p={2} pt={3}>
        <Autocomplete
          fullWidth
          size="small"
          value={selectedKpiFilter}
          onChange={(event: any, newValue: any) => {
            setSelectedKpiFilter(newValue || null);
          }}
          getOptionLabel={(option) => option?.title}
          renderOption={(option) => (
            <Box display={'flex'} alignItems={'center'} justifyContent={'space-between'} width={'100%'}>
              <span style={{ width: 'calc(100% - 71px)' }}>{option?.title}</span>
              <Box>
                <HtmlTooltip title={'Edit'} placement="top" arrow enterTouchDelay={0}>
                  <IconButton size="small" style={{ marginRight: '20px' }}>
                    <AiFillEdit />
                  </IconButton>
                </HtmlTooltip>
                <HtmlTooltip title={'Delete'} placement="top" arrow enterTouchDelay={0}>
                  <IconButton size="small" onClick={() => setIsFilterDeleteConfirm({ open: true, ids: [option._id] })}>
                    <RiDeleteBin6Fill />
                  </IconButton>
                </HtmlTooltip>
              </Box>
            </Box>
          )}
          id="controllable-states-demo"
          options={kpiFilters}
          renderInput={(params) => <TextField {...params} margin="none" size={'small'} fullWidth label="Select a Filter Set" variant="outlined" />}
          getOptionSelected={(option, val) => option?.optionValue === val?.optionValue}
        />
        <div className="mt-2 [border-top:1px_dashed_var(--common-border-color)]" />
        <div className=" my-5 space-y-3">
          {filters?.map((filter: any, index) => (
            <div key={index}>
              {filter?.resource ? (
                <AsyncDropDown
                  resource={filter?.resource}
                  multiple={filter?.multiple}
                  errors={false}
                  touched={false}
                  value={values[filter?.key] ? values[filter?.key] : filter?.multiple ? [] : {}}
                  fieldLabel={resources[filter.key] ? resources[filter.key]?.titlePlural : filter.title}
                  onChange={(e, val) => {
                    handleChange(filter.key, val);
                    setInputValues((prevValues) => ({ ...prevValues, [filter.key]: val }));
                  }}
                  fieldName={''}
                  required={false}
                />
              ) : filter?.key in filterOptions ? (
                <Autocomplete
                  size="small"
                  multiple={filter?.multiple}
                  fullWidth
                  options={filterOptions[filter?.key] || []}
                  autoHighlight
                  value={values[filter?.key] ? values[filter?.key] : filter?.multiple ? [] : {}}
                  getOptionLabel={(option: any) => option?.optionLabel}
                  getOptionSelected={(option, val) => option?.optionValue === val?.optionValue}
                  onChange={(_, val) => {
                    handleChange(filter?.key, val);
                    setInputValues((prevValues) => ({ ...prevValues, [filter?.key]: val }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      margin="none"
                      size="small"
                      label={resources[filter.key] ? resources[filter.key]?.titlePlural : filter.title}
                      variant="outlined"
                    />
                  )}
                />
              ) : (
                <TextField
                  variant="outlined"
                  type="number"
                  onKeyDown={(e) => ['e', 'E', '+', '-'].includes(e.key) && e.preventDefault()}
                  label={filter?.title}
                  name={filter.key}
                  fullWidth
                  margin="none"
                  size="small"
                  value={values[filter.key] || ''}
                  onChange={(e) => {
                    handleChange(filter.key, Number(e.target.value));
                    setInputValues((prevValues) => ({ ...prevValues, [filter?.key]: e.target.value }));
                  }}
                />
              )}
            </div>
          ))}
        </div>
        <div className="mt-4 pt-2 text-right [border-top:1px_solid_var(--common-border-color)]">
          <Button
            onClick={() => {
              setIsSaveFilter({ open: true, data: selectedKpiFilter });
            }}
            disabled={isEmpty(inputValues) && !selectedKpiFilter ? true : false}
            size="small"
            color="primary"
            className="yellow-button"
          >
            {selectedKpiFilter ? 'Update Filter' : 'Save Filter'}
          </Button>
        </div>
      </Box>
      {isSaveFilter.open && (
        <SaveFilterDialog
          handleClose={() => {
            setIsSaveFilter({ open: false, data: null });
          }}
          kpi={kpi}
          handleSucess={() => {
            setIsSaveFilter({ open: false, data: null });
            setInputValues({});
            fetchKpiFilters();
            setSelectedKpiFilter(null);
          }}
          filterData={isSaveFilter.data}
          filterValue={inputValues}
        />
      )}
      {isFilterDeleteConfirm.open && (
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to delete ?`}
          onClose={() => setIsFilterDeleteConfirm({ open: false, ids: null })}
          onOk={handleDeleteUserFilter}
        />
      )}
    </Popover>
  );
};

export default FiltersDropdown;
