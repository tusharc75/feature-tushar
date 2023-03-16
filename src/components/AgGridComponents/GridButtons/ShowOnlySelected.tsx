import React, { useState, useEffect } from 'react';
import { FormControlLabel, Switch } from '@material-ui/core';

const ShowOnlySelected = ({ dispatch = null, renderedFrom = null, selectedRecords = [], style = {}, ...otherProps }) => {
  const [disableSelectionSwitch, setDisableSelectionSwitch] = useState(true);
  const [checked, setChecked] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem(`${renderedFrom}_selected`);
    if (saved) {
      try {
        const initialValue = JSON.parse(saved);
        setDisableSelectionSwitch(initialValue.length === 0);
      } catch {
        setDisableSelectionSwitch(true);
      }
    } else {
      setDisableSelectionSwitch(true);
    }
  }, [selectedRecords]);

  return (
    <FormControlLabel
      value={checked}
      checked={checked}
      {...otherProps}
      onChange={() => {
        setChecked(!checked);

        if (dispatch) {
          dispatch({
            type: 'showFilteredRecordsOnly'
          });
        }
      }}
      control={<Switch size="small" color="primary" disabled={disableSelectionSwitch} />}
      style={{ fontSize: '0.8rem', marginLeft: 0, ...style }}
      label="Show Only Selected"
      labelPlacement="end"
    />
  );
};

export default ShowOnlySelected;
