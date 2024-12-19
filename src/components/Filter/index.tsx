import { Dialog, FormControl, IconButton, MenuItem, Select, useMediaQuery } from '@material-ui/core';
import { Close } from '@material-ui/icons';
import { uniqBy } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { BsFillFunnelFill } from 'react-icons/bs';
import { MdChevronRight } from 'react-icons/md';
import { TbLayoutSidebarFilled } from 'react-icons/tb';
import listFilter from 'src/assets/newSvgs/listFilter.svg';
import selectFilter from 'src/assets/newSvgs/selectFilter.svg';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CheckBox from 'src/components/Filter/CheckBox';
import DateTime from 'src/components/Filter/DateTime';
import DropDown from 'src/components/Filter/DropDown';
import SingleLine from 'src/components/Filter/SingleLine';
import { getErrors, getLabel, isCLearFilterButtonVisible, useClassForFewSeconds } from 'src/components/Filter/utils';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import SearchBox from 'src/components/Helpers/SearchBox';
import { cn, CustomDialogTransition } from 'src/constants/helpers';

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
  onCloseWithErrors = null
}) => {
  const [selectedField, setSelectedField] = useState(null);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [searchVal, setSearchVal] = useState('');
  const isMobile = useMediaQuery('(max-width:767px)');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [errors, setErrors] = useState<{ [key: string]: boolean }>({});
  const [checkForErrors, setCheckForErrors] = useState(false);
  const { addClass, className } = useClassForFewSeconds('animate-shake', 200);

  const uniqueValues = useMemo(() => {
    return uniqBy([...deepFilters, ...filterByIds], (d) => d.field);
  }, [deepFilters, filterByIds]);

  const defaultColumnsMap = useMemo(() => {
    return defaultColumns?.reduce((a, c) => {
      a[c.fieldName] = true;
      return a;
    }, {});
  }, [defaultColumns]);

  const options = useMemo(() => {
    if (!columns || columns?.length === 0 || !Array.isArray(columns)) return [];
    const colum = columns
      ?.filter(
        (c) =>
          c?.isRead &&
          (c.fieldData.type === 'dropDown' ||
            c.fieldData.type === 'multiSelect' ||
            c.fieldData.type === 'date' ||
            c.fieldData.type === 'checkBox' ||
            c.fieldData.type === 'singleLine')
      )
      ?.map((d) => ({ ...d?.fieldData }));
    return [...colum?.filter((f) => f?.required), ...colum?.filter((f) => !f?.required)];
  }, [columns]);

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

  useEffect(() => {
    handleSearch();
  }, [options]);

  const handleSearch = (e?: React.ChangeEvent<HTMLInputElement>) => {
    const val = e?.target?.value;
    setSearchVal(val);
    if (val) {
      const lowerCaseVal = val.toLowerCase();
      const filtered = options?.filter((d) => d?.fieldLabel?.toLowerCase()?.includes(lowerCaseVal));
      setFilteredOptions(filtered);
    } else {
      setFilteredOptions(options);
    }
  };

  const handleClearAllFilter = () => {
    const newDeepFilter = deepFilters.filter((f) => defaultColumnsMap[f.field.replace('from_', '').replace('to_', '')]);
    const newFilterByIds = filterByIds.filter((f) => defaultColumnsMap[f.field.replace('from_', '').replace('to_', '')]);
    setDeepFilters(newDeepFilter);
    setFilterByIds(newFilterByIds);
    setFilterTerm({});
    // onApplyFilter(newDeepFilter, newFilterByIds);
  };

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
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
        }
      } else {
        handleApplyFilter();
      }
    } else {
      onClose();
    }
  };

  return (
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
        isMobile ? '[--container-max-h:calc(100vh-160px)]  [--content-max-h:calc(100vh-237px)]' : '[--container-max-h:500px] [--content-max-h:433px]'
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
      <CustomDialogContent className="relative !px-[--px] !py-[--py] pt-0 [--sidebar-width:285px]">
        <div className={cn('grid overflow-hidden rounded-lg border', isMobile ? 'relative' : 'grid-cols-[var(--sidebar-width)1fr]')}>
          <div
            className={cn(
              'transition-[width] duration-300 ',
              isMobile ? 'absolute bottom-0 left-0 top-0 z-[11] bg-[--dark-primary,white]' : '[border-right:1px_solid_var(--common-border-color)]',
              isMobile && isSidebarOpen ? 'w-[--sidebar-width] [border-right:1px_solid_var(--common-border-color)]' : isMobile ? 'w-0' : ''
            )}
          >
            <div
              className={cn(
                'w-[--sidebar-width] px-[17px] py-[15px] transition-transform duration-300',
                isMobile ? `shadow-md` : '[border-right:1px_solid_var(--common-border-color)]',
                isMobile && isSidebarOpen ? '[transform:translateX(0)]' : isMobile ? '[transform:translateX(calc(var(--sidebar-width)*-1))]' : ''
              )}
            >
              <div className="mb-[15px] flex items-center gap-4">
                <p className="text-[16px] font-medium leading-[22px] text-[--primary-text]">Filters</p>
                <SearchBox value={searchVal} onChange={handleSearch} disabled={loading} />
                {isMobile && <ToggleSidebar toggleSidebar={() => toggleSidebar()} />}
              </div>
              <ul className={cn(' space-y-2 overflow-y-auto overflow-x-hidden', isMobile ? 'h-[--content-max-h]' : 'max-h-[--content-max-h]')}>
                {!loading
                  ? filteredOptions?.map((o, i) => {
                      return (
                        <li
                          key={i}
                          className={cn(
                            'flex cursor-pointer list-none items-center gap-[5px] rounded-lg px-[14px] py-2 text-[12px] font-medium leading-[14.5px] hover:bg-gray-100 data-[active=true]:bg-gray-100 dark:hover:bg-gray-800 data-[active=true]:dark:bg-gray-800',
                            errors[o?.fieldName] ? ` ${className} border border-red-500` : 'border'
                          )}
                          data-active={selectedField?.fieldName === o?.fieldName}
                          onClick={() => {
                            setSelectedField((prev) => (prev?.fieldName === o?.fieldName ? null : o));
                            setIsSidebarOpen(false);
                          }}
                        >
                          <img src={listFilter} alt={''} />
                          {o?.fieldLabel} {defaultColumns?.some?.((d) => d?.fieldName === o?.fieldName) && <span style={{ color: 'red' }}>*</span>}{' '}
                          <span className="block min-w-[14px] rounded-[4px] bg-[--dark-secondary,#E3F3F2] px-[2px] text-center text-[10px] font-bold leading-[14px] text-[--new-theme-color]">
                            {getLabel(o, uniqueValues)}
                          </span>
                          <MdChevronRight className="ml-auto text-[--new-theme-color]" />
                        </li>
                      );
                    })
                  : [...Array(9).keys()].map((l) => (
                      <li className="list-none">
                        <div className="h-[39px] w-full animate-pulse rounded-lg bg-gray-200" />
                      </li>
                    ))}
              </ul>
            </div>
          </div>
          <div
            className={cn(
              'relative h-[--container-max-h] flex-grow  px-[17px] py-[15px] pt-0 [--py:15px]',
              isMobile && isSidebarOpen ? 'overflow-hidden' : 'overflow-y-auto'
            )}
          >
            {selectedField && selectedField?.type === 'singleLine' ? (
              <SingleLine
                key={selectedField._id || selectedField.fieldName}
                fieldData={selectedField}
                allFields={[]}
                deepFilters={deepFilters}
                setDeepFilters={setDeepFilters}
                filterTerm={filterTerm}
                setFilterTerm={setFilterTerm}
                sidebarIcon={isMobile && <ToggleSidebar toggleSidebar={() => toggleSidebar()} />}
              />
            ) : ['dropDown', 'multiSelect']?.includes(selectedField?.type) ? (
              <DropDown
                key={selectedField._id || selectedField.fieldName}
                fieldData={selectedField}
                deepFilters={deepFilters}
                setDeepFilters={setDeepFilters}
                filterByIds={filterByIds}
                setFilterByIds={setFilterByIds}
                multiple={
                  reportConfig?.defaultColumn ? (reportConfig?.notMultiSelectFields?.includes(selectedField?.fieldName) ? false : true) : true
                }
                filterTerm={filterTerm}
                setFilterTerm={setFilterTerm}
                sidebarIcon={isMobile && <ToggleSidebar toggleSidebar={() => toggleSidebar()} />}
              />
            ) : selectedField?.type === 'checkBox' ? (
              <CheckBox
                key={selectedField._id || selectedField.fieldName}
                fieldData={selectedField}
                deepFilters={deepFilters}
                setDeepFilters={setDeepFilters}
                sidebarIcon={isMobile && <ToggleSidebar toggleSidebar={() => toggleSidebar()} />}
              />
            ) : selectedField?.type === 'date' ? (
              <DateTime
                key={selectedField._id || selectedField.fieldName}
                fieldData={selectedField}
                deepFilters={deepFilters}
                setDeepFilters={setDeepFilters}
                resource={resource}
                sidebarIcon={isMobile && <ToggleSidebar toggleSidebar={() => toggleSidebar()} />}
              />
            ) : (
              <div className="min-h-[75px] py-[15px]">
                {isMobile && <ToggleSidebar toggleSidebar={() => toggleSidebar()} />}
                <div className="absolute left-[23px] right-[23px] top-[50px] text-center">
                  <img src={selectFilter} alt={''} />
                  <h6 className="mb-[5px] text-[16px] font-semibold leading-[22px] text-[--primary-text]">Select Filter</h6>
                  <p className="text-[12px] font-normal leading-[14.5px]">Choose a filter from the left panel to apply it.</p>
                </div>
              </div>
            )}
            <div
              onClick={() => setIsSidebarOpen(false)}
              title={isMobile && isSidebarOpen ? 'Close Sidebar' : ''}
              className={cn(
                'absolute inset-0 cursor-pointer bg-black/50 [backdrop-filter:blur(3px)] [transition:opacity_300ms,_backdrop-filter_300ms] ',
                isMobile && isSidebarOpen ? 'z-10 opacity-100' : '-z-10 opacity-0'
              )}
            />
          </div>
        </div>
      </CustomDialogContent>
      <div className="flex justify-between px-[--px] py-[--py] pt-0">
        {isCLearFilterButtonVisible(defaultColumnsMap, uniqueValues) ? (
          <ThemeButton iconForMobile={false} onClick={handleClearAllFilter}>
            Clear Filters
          </ThemeButton>
        ) : (
          <div />
        )}
        <ThemeButton
          iconForMobile={false}
          borderColor="none"
          color="primary"
          onClick={() => {
            handleApplyFilter();
          }}
        >
          Apply Filters
        </ThemeButton>
      </div>
    </Dialog>
  );
};

export default Filter;

export const InNin = ({ filterTerm, setFilterTerm, fieldName }) => {
  return (
    <div className="mr-2">
      <FormControl fullWidth size="small" variant="outlined" margin="dense">
        <Select
          labelId={'filter-term'}
          id={'filter-term'}
          value={filterTerm[fieldName] || '$in'}
          onChange={(e) => {
            setFilterTerm((prev) => ({ ...prev, [fieldName]: e?.target?.value }));
          }}
          className="[&_.MuiSelect-root]:p-[7px_32px_7px_10px]"
          margin="none"
        >
          <MenuItem value={'$in'}>Include</MenuItem>
          <MenuItem value={'$nin'}>Exclude</MenuItem>
        </Select>
      </FormControl>
    </div>
  );
};

const ToggleSidebar = ({ toggleSidebar }) => (
  <IconButton size="small" style={{ padding: 5, height: 32, width: 32 }} onClick={toggleSidebar}>
    <TbLayoutSidebarFilled className="text-[--new-theme-color]" />
  </IconButton>
);

export { getErrors };
