import { Checkbox, FormControlLabel } from '@mui/material';

const CheckBox = ({ fieldData, deepFilters, setDeepFilters, sidebarIcon = null }) => {
  return (
    <>
      <div className="sticky top-0 z-10  flex min-h-[64px] items-center justify-between bg-[var(--dark-primary,white)] py-[--py,_16px]">
        <div className="flex items-center gap-2">
          {sidebarIcon}
          <p className="text-[16px] font-medium leading-[19px]">{fieldData?.fieldLabel}</p>
        </div>
      </div>
      <div>
        <div className="">
          <FormControlLabel
            control={
              <Checkbox
                size={'small'}
                name={'Yes'}
                checked={deepFilters?.find((d) => d?.field === fieldData?.fieldName)?.term === 'Yes'}
                onChange={(e) => {
                  if (e?.target?.checked) {
                    setDeepFilters([...deepFilters?.filter((d) => d?.field !== fieldData?.fieldName), { field: fieldData?.fieldName, term: 'Yes' }]);
                  } else {
                    setDeepFilters([...deepFilters?.filter((d) => d?.field !== fieldData?.fieldName)]);
                  }
                }}
              />
            }
            label={<span className="!text-[14px] !font-medium !leading-[17px] !text-[#6C757D] dark:!text-gray-200">Yes</span>}
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
                    setDeepFilters([...deepFilters?.filter((d) => d?.field !== fieldData?.fieldName), { field: fieldData?.fieldName, term: 'No' }]);
                  } else {
                    setDeepFilters([...deepFilters?.filter((d) => d?.field !== fieldData?.fieldName)]);
                  }
                }}
                size="small"
              />
            }
            label={<span className="!text-[14px] !font-medium !leading-[17px] !text-[#6C757D] dark:!text-gray-200">No</span>}
          />
        </div>
      </div>
    </>
  );
};

export default CheckBox;
