import { IconButton } from '@mui/material';
import { useEffect, useMemo, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { TbLayoutSidebarFilled } from 'react-icons/tb';
import CheckBox from 'src/components/Filter/CheckBox';
import DateTime from 'src/components/Filter/DateTime';
import DropDown from 'src/components/Filter/DropDown';
import SingleLine from 'src/components/Filter/SingleLine';
import SearchBox from 'src/components/Helpers/SearchBox';
import { cn } from 'src/constants/helpers';
import selectFilter from 'src/assets/newSvgs/selectFilter.svg';
import listFilter from 'src/assets/newSvgs/listFilter.svg';

import { MdChevronRight } from 'react-icons/md';
import { getLabel, useClassForFewSeconds } from 'src/components/Filter/utils';
import { uniqBy } from 'lodash';

const Filters = ({
  columns,
  defaultSelectedField = null,
  deepFilters,
  setDeepFilters,
  filterByIds,
  setFilterByIds,
  filterTerm = null,
  setFilterTerm = null,
  defaultColumns = [],
  reportConfig = null,
  loading = false,
  errors = {},
  isVisibleFilterSet = false,
  selectedUserFilter = null
}) => {
  const [selectedField, setSelectedField] = useState(null);
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [searchVal, setSearchVal] = useState('');

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const { className } = useClassForFewSeconds('animate-shake', 200);

  const uniqueValues = useMemo(() => {
    return uniqBy([...deepFilters, ...filterByIds], (d) => d.field);
  }, [deepFilters, filterByIds]);

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

  useEffect(() => {
    if (defaultSelectedField) {
      setSelectedField(defaultSelectedField);
    }
  }, [defaultSelectedField]);

  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  return (
    <div
      className={cn(
        'grid overflow-hidden  border',
        isVisibleFilterSet ? 'rounded-b-lg' : 'rounded-lg',
        isMobile ? 'relative' : 'grid-cols-[var(--sidebar-width)1fr]'
      )}
    >
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
            multiple={reportConfig?.defaultColumn ? (reportConfig?.notMultiSelectFields?.includes(selectedField?.fieldName) ? false : true) : true}
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
            sidebarIcon={isMobile && <ToggleSidebar toggleSidebar={() => toggleSidebar()} />}
            selectedUserFilter={selectedUserFilter}
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
  );
};

export default Filters;

const ToggleSidebar = ({ toggleSidebar }) => (
  <IconButton size="small" style={{ padding: 5, height: 32, width: 32 }} onClick={toggleSidebar}>
    <TbLayoutSidebarFilled className="text-[--new-theme-color]" />
  </IconButton>
);
