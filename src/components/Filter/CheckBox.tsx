import { Checkbox, FormControlLabel } from '@material-ui/core';

const CheckBox = ({ fieldData, deepFilters, setDeepFilters }) => {
  return (
    <div>
      <div className="flex items-center justify-between">
        <p>{fieldData?.fieldLabel}</p>
      </div>
      <div className="mt-4">
        <div className="">
          <FormControlLabel
            control={
              <Checkbox
                name={'Yes'}
                checked={deepFilters?.find((d) => d?.field === fieldData?.fieldName)?.term === 'Yes'}
                onChange={(e) => {
                  if (e?.target?.checked) {
                    setDeepFilters([...deepFilters?.filter((d) => d?.field != fieldData?.fieldName), { field: fieldData?.fieldName, term: 'Yes' }]);
                  } else {
                    setDeepFilters([...deepFilters?.filter((d) => d?.field != fieldData?.fieldName)]);
                  }
                }}
                color="primary"
              />
            }
            label={'Yes'}
          />
        </div>
        <div className="">
          <FormControlLabel
            control={
              <Checkbox
                name={'No'}
                checked={deepFilters?.find((d) => d?.field === fieldData?.fieldName)?.term === 'No'}
                onChange={(e) => {
                  if (e?.target?.checked) {
                    setDeepFilters([...deepFilters?.filter((d) => d?.field != fieldData?.fieldName), { field: fieldData?.fieldName, term: 'No' }]);
                  } else {
                    setDeepFilters([...deepFilters?.filter((d) => d?.field != fieldData?.fieldName)]);
                  }
                }}
                color="primary"
              />
            }
            label={'No'}
          />
        </div>
      </div>
    </div>
  );
};

export default CheckBox;
