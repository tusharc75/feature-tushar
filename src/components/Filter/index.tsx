import { Collapse, Dialog, FormControl, IconButton, MenuItem, Select } from '@material-ui/core';
import { Close } from '@material-ui/icons';
import { isArray } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { BsFillFunnelFill } from 'react-icons/bs';
import { FaChevronDown } from 'react-icons/fa';
import { MdChevronRight } from 'react-icons/md';
import listFilter from 'src/assets/newSvgs/listFilter.svg';
import selectFilter from 'src/assets/newSvgs/selectFilter.svg';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CheckBox from 'src/components/Filter/CheckBox';
import DateTime from 'src/components/Filter/DateTime';
import DropDown from 'src/components/Filter/DropDown';
import SingleLine from 'src/components/Filter/SingleLine';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import CustomButton from 'src/components/Helpers/CustomButton';
import { cn, CustomDialogTransition } from 'src/constants/helpers';

const getLabel = (field, deepFilters) => {
  if (field?.type === 'singleLine' && deepFilters?.find((d) => d?.field === field?.fieldName)?.term?.length > 0) {
    return isArray(deepFilters?.find((d) => d?.field === field?.fieldName)?.term)
      ? deepFilters?.find((d) => d?.field === field?.fieldName)?.term?.length
      : deepFilters?.find((d) => d?.field === field?.fieldName)?.term;
  }
  if (field?.type === 'checkBox' && deepFilters?.find((d) => d?.field === field?.fieldName)?.term) {
    return deepFilters?.find((d) => d?.field === field?.fieldName)?.term;
  }
  if (
    ['dropDown', 'multiSelect']?.includes(field?.type) &&
    field?.lookup &&
    filterByIds?.find((d) => d?.field === field?.fieldName)?.term?.length > 0
  ) {
    return filterByIds?.find((d) => d?.field === field?.fieldName)?.term?.length;
  }
  if (['dropDown', 'multiSelect']?.includes(field?.type) && !field?.lookup && deepFilters?.find((d) => d?.field === field?.fieldName)?.term?.length) {
    return isArray(deepFilters?.find((d) => d?.field === field?.fieldName)?.term)
      ? deepFilters?.find((d) => d?.field === field?.fieldName)?.term?.length
      : deepFilters?.find((d) => d?.field === field?.fieldName)?.term;
  }
  return '';
};

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
  loading = false
}) => {
  const [selectedField, setSelectedField] = useState(null);
  const [fullScreen] = useState(isMobile || isTablet);
  const [isOpen, setIsOpen] = useState(true);

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
      ?.map((d) => ({ ...d?.fieldData, fieldTitle: getLabel(d, deepFilters) }));
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

  return (
    <Dialog
      open={true}
      maxWidth="md"
      fullWidth
      TransitionComponent={CustomDialogTransition}
      fullScreen={fullScreen}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          onClose();
        }
      }}
      PaperProps={{
        className: 'md:!rounded-[12px] !rounded-[0px]'
      }}
      className="[--container-max-h:500px] [--content-max-h:433px] [--px:20px] [--py:20px] md:[--px:37px] md:[--py:21px]"
    >
      <div className="flex items-center gap-3 px-[--px] py-[--py] ">
        <BsFillFunnelFill size={40} className="flex-shrink-0 text-[--new-theme-color]" />
        <div className="flex-grow">
          <h6 className="mb-[5px] text-[20px] font-semibold leading-[22px]">Filters for {filterTitle}</h6>
          <p className="text-[12px] font-normal leading-[14px] text-[#777575] dark:text-gray-600">
            See results in your view based on the filters your select here.
          </p>
        </div>
        <IconButton onClick={onClose} size="small">
          <Close />
        </IconButton>
      </div>
      <CustomDialogContent className="!px-[--px] !py-[--py] pt-0">
        <div className="grid  grid-cols-[285px_1fr] overflow-hidden rounded-lg border">
          <div className="px-[17px] py-[15px] [border-right:1px_solid_var(--common-border-color)]">
            <div role={'button'} onClick={() => setIsOpen((prev) => !prev)} className="mb-[15px] flex cursor-pointer items-center gap-1">
              <p className="text-[16px] font-medium leading-[22px] text-[--primary-text]">Filters</p>
              <FaChevronDown size={10} className={cn('block  transition-transform', isOpen ? '' : '[transform:rotate(180deg)]')} />
            </div>
            <Collapse in={isOpen}>
              <ul className="max-h-[--content-max-h] space-y-2 overflow-y-auto">
                {!loading
                  ? Array.isArray(options) &&
                    options?.map((o, i) => {
                      return (
                        <li
                          key={i}
                          className="flex cursor-pointer list-none items-center gap-[5px] rounded-lg border px-[14px] py-2 text-[12px] font-medium leading-[14.5px] hover:bg-gray-200 data-[active=true]:bg-gray-200 dark:hover:bg-gray-800 data-[active=true]:dark:bg-gray-800"
                          data-active={selectedField?.fieldName === o?.fieldName}
                          onClick={() => {
                            setSelectedField((prev) => (prev?.fieldName === o?.fieldName ? null : o));
                          }}
                        >
                          <img src={listFilter} alt={''} />
                          {o?.fieldLabel} {defaultColumns?.some?.((d) => d?.fieldName === o?.fieldName) && <span style={{ color: 'red' }}>*</span>}{' '}
                          <span className="ml-2">{o?.fieldTitle}</span>
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
            </Collapse>
          </div>
          <div className="relative h-[--container-max-h] flex-grow overflow-y-auto px-[17px] py-[15px]">
            {selectedField && selectedField?.type === 'singleLine' ? (
              <SingleLine
                key={selectedField._id}
                fieldData={selectedField}
                allFields={[]}
                deepFilters={deepFilters}
                setDeepFilters={setDeepFilters}
                filterTerm={filterTerm}
                setFilterTerm={setFilterTerm}
              />
            ) : ['dropDown', 'multiSelect']?.includes(selectedField?.type) ? (
              <DropDown
                key={selectedField._id}
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
              />
            ) : selectedField?.type === 'checkBox' ? (
              <CheckBox key={selectedField._id} fieldData={selectedField} deepFilters={deepFilters} setDeepFilters={setDeepFilters} />
            ) : selectedField?.type === 'date' ? (
              <DateTime
                key={selectedField._id}
                fieldData={selectedField}
                deepFilters={deepFilters}
                setDeepFilters={setDeepFilters}
                resource={resource}
              />
            ) : (
              <div className="absolute left-[23px] right-[23px] top-[50px] text-center">
                <img src={selectFilter} alt={''} />
                <h6 className="mb-[5px] text-[16px] font-semibold leading-[22px] text-[--primary-text]">Select Filter</h6>
                <p className="text-[12px] font-normal leading-[14.5px]">Choose a filter from the left panel to apply it.</p>
              </div>
            )}
          </div>
        </div>
      </CustomDialogContent>
      <div className="flex justify-between px-[--px] py-[--py] pt-0">
        <ThemeButton iconForMobile={false} onClick={onClose}>
          Close
        </ThemeButton>
        <CustomButton
          variant="contained"
          color="primary"
          onClick={() => {
            if (defaultColumns?.length > 0) {
              let isValid = true;
              for (const c of defaultColumns) {
                if (
                  c?.type === 'date' &&
                  !(
                    deepFilters?.find((d) => d?.field === `from_${c?.fieldName}`)?.term &&
                    deepFilters?.find((d) => d?.field === `to_${c?.fieldName}`)?.term
                  )
                ) {
                  isValid = false;
                  setSelectedField(c);
                  return;
                }
                if (['singleLine']?.includes(c?.type) && !deepFilters?.find((d) => d?.field === c?.fieldName)?.term?.length) {
                  isValid = false;
                  setSelectedField(c);
                  return;
                }
                if (
                  ['dropDown', 'multiSelect']?.includes(c?.type) &&
                  !c?.lookup &&
                  !deepFilters?.find((d) => d?.field === c?.fieldName)?.term?.length
                ) {
                  isValid = false;
                  setSelectedField(c);
                  return;
                }
              }
              if (isValid) {
                onApplyFilter();
              }
            } else {
              onApplyFilter();
            }
          }}
        >
          Apply Filters
        </CustomButton>
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
          label="Select"
          margin="dense"
        >
          <MenuItem value={'$in'}>Include</MenuItem>
          <MenuItem value={'$nin'}>Exclude</MenuItem>
        </Select>
      </FormControl>
    </div>
  );
};
