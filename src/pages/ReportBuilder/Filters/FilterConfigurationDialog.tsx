import { useState, useEffect, Fragment } from 'react';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@mui/material/Dialog';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from '../../../constants/helpers';
import { TextField, FormControl, Select, MenuItem } from '@mui/material';
import { ThemeButton } from '../../../components/Helpers/Buttons';
import { filterOperations, dateFilterOperations } from '../utils';
import Dropdown from './Components/Dropdown';
import CheckboxComponent from './Components/Checkbox';
import NumberComponent from './Components/Number';
import DateComponent from './Components/Date';
import { isEmpty } from 'lodash';

interface FilterConfigurationDialogProps {
  open: boolean;
  onClose: () => void;
  onAddFilter: (filter: { fieldName: string; operation: string; value: any, type: string, resource: string, reportFieldName: string }) => void;
  selectedField: any;
  filterData?: any;
}

const FilterConfigurationDialog = ({
  open,
  onClose,
  onAddFilter,
  selectedField,
  filterData,
}: FilterConfigurationDialogProps) => {
  const [filterOperation, setFilterOperation] = useState('is');
  const [filterValue, setFilterValue] = useState(null);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);

  const getOperationsForFieldType = () => {
    if (selectedField?.type === 'date') {
      return dateFilterOperations;
    }
    if (selectedField?.type === 'checkBox') {
      return [{ optionValue: 'is', optionLabel: 'Is' }];
    }
    return filterOperations;
  };

  const availableOperations = getOperationsForFieldType();

  useEffect(() => {
    if (!isEmpty(filterData)) {
      setFilterOperation(filterData?.operation || 'is');
      setFilterValue(filterData?.value || null);
    } else {
      setFilterOperation(selectedField?.type === 'date' ? 'on' : 'is');
      setFilterValue(null);
    }
  }, [filterData, open]);

  const handleAddFilter = () => {
    if (!selectedField) return;

    onAddFilter({
      fieldName: selectedField?.fieldName,
      resource: selectedField?.resource,
      operation: filterOperation,
      reportFieldName: selectedField?.reportFieldName,
      value: filterValue,
      type: selectedField?.type,
    });

    setFilterOperation('is');
    setFilterValue(null);
  };

  const handleClose = () => {
    setFilterOperation('is');
    setFilterValue(null);
    onClose();
  };

  const isAddDisabled = () => {
    if (!selectedField) return true;

    if (['isEmpty', 'notEmpty'].includes(filterOperation)) {
      return false;
    }

    if (['dropDown', 'multiSelect'].includes(selectedField?.type)) {
      return !Array.isArray(filterValue) || filterValue.length === 0;
    }

    if (selectedField?.type === 'checkBox') {
      return filterValue === null;
    }

    if (selectedField?.type === 'date') {
      if (filterOperation === 'between') {
        return !filterValue?.from || !filterValue?.to;
      } else {
        return !filterValue;
      }
    }

    if (['number', 'decimal'].includes(selectedField?.type)) {
      return filterValue === null || filterValue === undefined;
    }

    return !filterValue;
  };

  return (
    <Dialog
      maxWidth="sm"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="filter-configuration-dialog"
      open={open}
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          handleClose();
        }
      }}
      fullWidth
    >
      <Fragment>
        <CustomDialogHeader
          title={`${!isEmpty(filterData) ? 'Edit' : 'Configure'}: ${selectedField?.fieldLabel}`}
          onClose={handleClose}
          isMinimized={!fullScreen}
          onMinimizeMaximize={() => {
            setFullScreen((prevState) => !prevState);
          }}
          showManimizeMaximize={true}
        />
        <CustomDialogContent>
          {selectedField && (
            <div className="flex flex-col gap-4">
              <FormControl fullWidth size="small" variant="outlined" margin="none">
                <Select
                  size="small"
                  labelId="filter-operation"
                  id="filter-operation"
                  value={filterOperation}
                  onChange={(e) => {
                    setFilterOperation(e.target.value);
                  }}
                  className="[&_.MuiSelect-select]:!p-[5px_32px_5px_10px]"
                  margin="none"
                >
                  {availableOperations?.map((operation) => (
                    <MenuItem key={operation?.optionValue} value={operation?.optionValue}>
                      {operation?.optionLabel}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {!['isEmpty', 'notEmpty'].includes(filterOperation) && (
                <>
                  {['dropDown', 'multiSelect'].includes(selectedField?.type) ? (
                    <Dropdown selectedField={selectedField} filterValue={filterValue} setFilterValue={setFilterValue} />
                  ) : selectedField?.type === 'checkBox' ? (
                    <CheckboxComponent filterValue={filterValue} setFilterValue={setFilterValue} />
                  ) : ['number', 'decimal'].includes(selectedField?.type) ? (
                    <NumberComponent selectedField={selectedField} filterValue={filterValue} setFilterValue={setFilterValue} />
                  ) : selectedField?.type === 'date' ? (
                    <DateComponent filterValue={filterValue} setFilterValue={setFilterValue} operation={filterOperation} />
                  ) : (
                    <TextField
                      required={true}
                      size="small"
                      label={`Search by ${selectedField.fieldLabel}`}
                      variant="outlined"
                      fullWidth
                      value={filterValue || ''}
                      onChange={(e) => setFilterValue(e.target.value)}
                      slotProps={{ inputLabel: { shrink: true } }}
                    />
                  )}
                </>
              )}
            </div>
          )}
        </CustomDialogContent>
        <CustomDialogFooter>
          <ThemeButton buttonType="transparent" onClick={handleClose}>
            Cancel
          </ThemeButton>
          <ThemeButton buttonType="theme" onClick={handleAddFilter} disabled={isAddDisabled()}>
            {`${!isEmpty(filterData) ? 'Update' : 'Add'} filter`}
          </ThemeButton>
        </CustomDialogFooter>
      </Fragment>
    </Dialog>
  );
};

export default FilterConfigurationDialog;
