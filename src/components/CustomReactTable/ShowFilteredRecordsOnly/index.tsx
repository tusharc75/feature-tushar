import { SwitchClassKey, SwitchProps } from '@mui/material';
import { Fragment, useEffect, useState } from 'react';

interface Styles extends Partial<Record<SwitchClassKey, string>> {
  focusVisible?: string;
}
interface Props extends SwitchProps {
  classes: Styles;
}

function ShowFilteredRecordsOnly({ dispatchTable, showOnlyShowFilteredRecordSwitch, selectedRecords }) {
  const [disableSelectionSwitch, setDisableSelectionSwitch] = useState(true);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    if (selectedRecords === 0) {
      if (checked) {
        setChecked(false);
        dispatchTable({
          type: 'showFilteredRecordsOnly'
        });
        dispatchTable({ type: 'pageChange', page: 0 });
      }
      setDisableSelectionSwitch(true);
    } else {
      setDisableSelectionSwitch(false);
    }
  }, [selectedRecords]);

  return (
    <Fragment>
      {showOnlyShowFilteredRecordSwitch && (
        <>
          <label
            className="inline-flex cursor-pointer items-center gap-2 aria-[disabled=true]:text-black/35 aria-[disabled=true]:dark:text-[rgba(255,255,255,0.5)]"
            aria-disabled={disableSelectionSwitch}
          >
            <input
              disabled={disableSelectionSwitch}
              type="checkbox"
              checked={checked}
              onChange={() => {
                setChecked(!checked);
                if (dispatchTable) {
                  dispatchTable({
                    type: 'showFilteredRecordsOnly'
                  });
                  dispatchTable({ type: 'pageChange', page: 0 });
                }
              }}
              className="peer sr-only"
            />
            <div className="peer relative h-[22px] w-[37px] rounded-full bg-gray-200 after:absolute after:start-[2px] after:top-[2px] after:h-[18px] after:w-[18px] after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] disabled:bg-[#e0e0e0] peer-checked:bg-[--new-theme-color] peer-checked:after:border-white peer-checked:after:[transform:translateX(calc(100%-2px))] peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:border-gray-600 dark:bg-gray-800 disabled:dark:bg-[#272739] dark:peer-focus:ring-blue-800 rtl:peer-checked:after:-translate-x-full"></div>
            <p className="text-base ">Show Only Selected</p>
          </label>
        </>
      )}
    </Fragment>
  );
}

export default ShowFilteredRecordsOnly;
