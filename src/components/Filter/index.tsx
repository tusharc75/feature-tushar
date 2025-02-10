import { Autocomplete, Box, Dialog, FormControl, IconButton, MenuItem, Select, TextField, useMediaQuery } from '@mui/material';
import { Close } from '@mui/icons-material';
import { isEmpty, uniqBy } from 'lodash';
import { useContext, useEffect, useMemo, useState } from 'react';
import { BsFillFunnelFill } from 'react-icons/bs';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import { getErrors, isCLearFilterButtonVisible, useClassForFewSeconds } from 'src/components/Filter/utils';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { cn, CustomDialogTransition } from 'src/constants/helpers';
import SaveFilterDialog from 'src/components/CustomReactTable/GridFilter/SaveFilterDialog';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { RiDeleteBin6Fill } from 'react-icons/ri';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { createFilterSetData } from 'src/components/CustomReactTable';
import Filters from 'src/components/Filter/Filters';
import dayjs from 'dayjs';

const Filter = ({
  onClose,
  resource,
  columns,
  onApplyFilter,
  deepFilters,
  setDeepFilters,
  filterByIds,
  setFilterByIds,
  filterTerm,
  setFilterTerm,
  defaultColumns = [],
  reportConfig = null,
  filterTitle = '',
  loading = false,
  onCloseWithErrors = null,
  isVisibleFilterSet = false,
  fetchUserFilters = () => {},
  userFilters = [],
  selectedFilter = null
}) => {
  const toastConfig = useContext(CustomToastContext);

  const [selectedField, setSelectedField] = useState(null);
  const isMobile = useMediaQuery('(max-width:767px)');
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});
  const [checkForErrors, setCheckForErrors] = useState(false);
  const { addClass } = useClassForFewSeconds('animate-shake', 200);
  const [isSaveFilter, setIsSaveFilter] = useState({ open: false, data: null });
  const [selectedUserFilter, setSelectedUserFilter] = useState(selectedFilter);
  const [isFilterDeleteConfirm, setIsFilterDeleteConfirm] = useState({ open: false, ids: null });

  const uniqueValues = useMemo(() => {
    return uniqBy([...deepFilters, ...filterByIds], (d) => d.field);
  }, [deepFilters, filterByIds]);

  const defaultColumnsMap = useMemo(() => {
    return defaultColumns?.reduce((a, c) => {
      a[c.fieldName] = true;
      return a;
    }, {});
  }, [defaultColumns]);

  useEffect(() => {
    if (defaultColumns?.length > 0) {
      setSelectedField(defaultColumns[0]);
    }
  }, [defaultColumns]);

  useEffect(() => {
    if (deepFilters?.length > 0) {
      setSelectedField(columns?.filter((c) => c?.fieldData?.fieldName === deepFilters[0]?.field)[0]?.fieldData);
    } else if (filterByIds?.length > 0) {
      setSelectedField(columns?.filter((c) => c?.fieldData?.fieldName === filterByIds[0]?.field)[0]?.fieldData);
    }
  }, []);

  const handleClearAllFilter = () => {
    const newDeepFilter = deepFilters.filter((f) => defaultColumnsMap[f.field.replace('from_', '').replace('to_', '')]);
    const newFilterByIds = filterByIds.filter((f) => defaultColumnsMap[f.field.replace('from_', '').replace('to_', '')]);
    if (setDeepFilters) setDeepFilters(newDeepFilter);
    if (setFilterByIds) setFilterByIds(newFilterByIds);
    if (setFilterTerm) setFilterTerm({});
    // onApplyFilter(newDeepFilter, newFilterByIds);
  };

  useEffect(() => {
    if (checkForErrors) {
      const { errors } = getErrors(defaultColumns, uniqueValues);
      setErrors(errors);
    }
  }, [checkForErrors, defaultColumns, uniqueValues]);

  const handleApplyFilter = () => {
    if (defaultColumns?.length > 0) {
      const { errors, errorColumns } = getErrors(defaultColumns, uniqueValues);
      setErrors(errors);
      setCheckForErrors(true);
      if (errorColumns.length > 0) {
        setSelectedField(errorColumns[0]);
        addClass();
      } else {
        onApplyFilter();
      }
    } else {
      onApplyFilter();
    }
  };

  const handleClose = () => {
    if (defaultColumns?.length > 0) {
      const { errors, errorColumns } = getErrors(defaultColumns, uniqueValues);
      setErrors(errors);
      setCheckForErrors(true);
      if (errorColumns.length > 0) {
        if (typeof onCloseWithErrors === 'function') {
          onCloseWithErrors();
        } else {
          onClose();
          if (setDeepFilters) setDeepFilters([]);
          if (setFilterByIds) setFilterByIds([]);
          if (setFilterTerm) setFilterTerm({});
        }
      } else {
        handleApplyFilter();
      }
    } else {
      onClose();
      if (setDeepFilters) setDeepFilters([]);
      if (setFilterByIds) setFilterByIds([]);
      if (setFilterTerm) setFilterTerm({});
    }
  };

  const handleSelectfilterSet = (val) => {
    setSelectedUserFilter(val);
    if (val) {
      const { filterById, deepFilter } = createFilterSetData(val, columns);
      setFilterByIds(filterById);
      setDeepFilters(deepFilter);
      setFilterTerm(val?.filterTerm || {});
    } else {
      setFilterByIds([]);
      setDeepFilters([]);
      setFilterTerm({});
    }
  };

  const handleDeleteUserFilter = () => {
    axiosInstance()
      .put(`/user-resource-filter/remove`, { ids: isFilterDeleteConfirm.ids })
      .then(({ data }) => {
        fetchUserFilters();
        setIsFilterDeleteConfirm({ open: false, ids: null });
        handleSelectfilterSet(null);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const isDisable = () => {
    if (
      deepFilters &&
      deepFilters?.length &&
      deepFilters?.filter((d) => {
        if (d?.type === 'date') {
          return d?.duration !== 'custom';
        }
        return d?.term?.length ? true : false;
      })?.length
    )
      return false;
    if (filterByIds && filterByIds?.length && filterByIds?.filter((d) => d?.term?.length)?.length) return false;
    return true;
  };

  return (
    <>
      <Dialog
        open={true}
        maxWidth="md"
        fullWidth
        TransitionComponent={CustomDialogTransition}
        fullScreen={isMobile}
        onClose={(e, reason) => {
          if (reason !== 'backdropClick') {
            handleClose();
          }
        }}
        PaperProps={{
          className: 'md:!rounded-[12px] !rounded-[0px]'
        }}
        className={cn(
          ' [--px:20px] [--py:20px] md:[--px:37px] md:[--py:21px]',
          isMobile
            ? '[--container-max-h:calc(100vh-212px)]  [--content-max-h:calc(100vh-280px)]'
            : '[--container-max-h:500px] [--content-max-h:433px]'
        )}
      >
        <div className="flex items-center gap-3 px-[--px] py-[--py] ">
          <BsFillFunnelFill size={40} className="flex-shrink-0 text-[--new-theme-color]" />
          <div className="flex-grow">
            <h6 className="mb-[5px] text-[20px] font-semibold leading-[22px]">Filters for {filterTitle}</h6>
            <p className="text-[12px] font-normal leading-[14px] text-[#777575] dark:text-gray-400 max-sm:hidden">
              See results in your view based on the filters you select here.
            </p>
          </div>
          <IconButton onClick={handleClose} size="small">
            <Close />
          </IconButton>
        </div>
        <CustomDialogContent className="relative !px-[--px] !py-[--py] !pt-0 [--sidebar-width:285px]">
          {isVisibleFilterSet && (
            <div className="rounded-t-lg border-l border-r border-t px-[15px] py-2">
              <Autocomplete
                id={`filter-set`}
                options={userFilters}
                autoHighlight
                renderOption={(props, option, state, ownerState) => {
                  const { key, ...optionProps } = props;
                  return (
                    <Box component="li" key={key} {...optionProps}>
                      <div className="flex w-full justify-between">
                        <div>{option?.title}</div>
                        <div>
                          <HtmlTooltip title={'Delete'} placement="top" arrow enterTouchDelay={0}>
                            <IconButton size="small" onClick={() => setIsFilterDeleteConfirm({ open: true, ids: [option._id] })}>
                              <RiDeleteBin6Fill />
                            </IconButton>
                          </HtmlTooltip>
                        </div>
                      </div>
                    </Box>
                  );
                }}
                onChange={(_, newValue: any) => {
                  handleSelectfilterSet(newValue || null);
                }}
                getOptionLabel={(option) => option?.title || ''}
                value={selectedUserFilter}
                renderInput={(params) => <TextField {...params} label="Select a Filter Set" margin="dense" size="small" variant="outlined" />}
              />
            </div>
          )}
          <Filters
            columns={columns}
            defaultSelectedField={selectedField}
            deepFilters={deepFilters}
            setDeepFilters={setDeepFilters}
            filterByIds={filterByIds}
            setFilterByIds={setFilterByIds}
            filterTerm={filterTerm}
            setFilterTerm={setFilterTerm}
            defaultColumns={defaultColumns}
            reportConfig={reportConfig}
            errors={errors}
            loading={loading}
            isVisibleFilterSet={isVisibleFilterSet}
            selectedUserFilter={selectedUserFilter}
          />
        </CustomDialogContent>
        <div className="flex justify-between px-[--px] py-[--py] pt-0">
          {isCLearFilterButtonVisible(defaultColumnsMap, uniqueValues) ? (
            <ThemeButton iconForMobile={false} onClick={handleClearAllFilter}>
              Clear Filters
            </ThemeButton>
          ) : (
            <div />
          )}
          <div className="flex gap-2">
            {isVisibleFilterSet && (
              <ThemeButton
                disabled={isDisable()}
                iconForMobile={false}
                buttonType="yellow"
                onClick={() => setIsSaveFilter({ open: true, data: selectedUserFilter })}
              >
                {selectedUserFilter ? 'Update Filter' : 'Save Filter'}
              </ThemeButton>
            )}
            <ThemeButton
              iconForMobile={false}
              buttonType="theme"
              onClick={() => {
                handleApplyFilter();
              }}
            >
              Apply Filters
            </ThemeButton>
          </div>
        </div>
      </Dialog>
      {isSaveFilter.open && (
        <SaveFilterDialog
          handleClose={() => {
            setIsSaveFilter({ open: false, data: null });
          }}
          columns={columns}
          resource={resource}
          handleSucess={() => {
            setIsSaveFilter({ open: false, data: null });
            fetchUserFilters();
            setSelectedUserFilter(null);
          }}
          filterData={isSaveFilter?.data}
          deepFilters={deepFilters}
          filterByIds={filterByIds}
          filterTerm={filterTerm}
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
    </>
  );
};

export default Filter;

export const InNin = ({ filterTerm, setFilterTerm, fieldName }) => {
  return (
    <div className="mr-2">
      <FormControl fullWidth size="small" variant="outlined" margin="none">
        <Select
          size="small"
          labelId={'filter-term'}
          id={'filter-term'}
          value={filterTerm[fieldName] || '$in'}
          onChange={(e) => {
            setFilterTerm((prev) => ({ ...prev, [fieldName]: e?.target?.value }));
          }}
          className="[&_.MuiSelect-select]:!p-[5px_32px_5px_10px]"
          margin="none"
        >
          <MenuItem value={'$in'}>Include</MenuItem>
          <MenuItem value={'$nin'}>Exclude</MenuItem>
        </Select>
      </FormControl>
    </div>
  );
};

export { getErrors };
