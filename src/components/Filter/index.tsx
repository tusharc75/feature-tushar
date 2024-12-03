import { Dialog } from '@material-ui/core';
import _, { isArray } from 'lodash';
import { useEffect, useMemo, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from 'src/components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CheckBox from 'src/components/Filter/CheckBox';
import DateTime from 'src/components/Filter/DateTime';
import DropDown from 'src/components/Filter/DropDown';
import SingleLine from 'src/components/Filter/SingleLine';
import CustomButton from 'src/components/Helpers/CustomButton';
import { CustomDialogTransition } from 'src/constants/helpers';

const Filter = ({
  onClose,
  resource,
  columns,
  onApplyFilter,
  deepFilters,
  setDeepFilters,
  filterByIds,
  setFilterByIds,
  defaultColumns = [],
  reportConfig = null
}) => {
  const [selectedField, setSelectedField] = useState(null);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const options = useMemo(() => {
    if (!columns && columns?.length === 0) return [];
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
      ?.map((d) => d?.fieldData);
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

  const getLabel = (field) => {
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
    if (
      ['dropDown', 'multiSelect']?.includes(field?.type) &&
      !field?.lookup &&
      deepFilters?.find((d) => d?.field === field?.fieldName)?.term?.length
    ) {
      return isArray(deepFilters?.find((d) => d?.field === field?.fieldName)?.term)
        ? deepFilters?.find((d) => d?.field === field?.fieldName)?.term?.length
        : deepFilters?.find((d) => d?.field === field?.fieldName)?.term;
    }
    return '';
  };

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
    >
      <CustomDialogHeader
        title={`Set Filters`}
        onClose={onClose}
        isMinimized={!fullScreen}
        onMinimizeMaximize={() => {
          setFullScreen((prevState) => !prevState);
        }}
        showManimizeMaximize={true}
      />
      <CustomDialogContent>
        <div className="flex max-h-[550px] w-full ">
          <div className="w-1/3 overflow-x-auto border border-solid border-black p-2">
            {options?.map((o, i) => {
              return (
                <div
                  key={i}
                  className="mb-2 cursor-pointer border border-solid border-black p-2"
                  style={{ backgroundColor: selectedField?.fieldName === o?.fieldName ? 'lightgray' : '' }}
                  onClick={() => {
                    setSelectedField(o);
                  }}
                >
                  {o?.fieldLabel} {defaultColumns?.some((d) => d?.fieldName === o?.fieldName) && <span style={{ color: 'red' }}>*</span>}{' '}
                  <span className="ml-2">{getLabel(o)}</span>
                </div>
              );
            })}
          </div>
          <div className="w-2/3 overflow-x-auto border border-solid border-black p-2">
            {selectedField && selectedField?.type === 'singleLine' ? (
              <SingleLine
                key={selectedField._id}
                fieldData={selectedField}
                allFields={[]}
                deepFilters={deepFilters}
                setDeepFilters={setDeepFilters}
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
              <div>Select Filter</div>
            )}
          </div>
        </div>
      </CustomDialogContent>
      <CustomDialogFooter>
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
      </CustomDialogFooter>
    </Dialog>
  );
};

export default Filter;
