import React, { useContext, useEffect, useState } from 'react';
import { createStyles, withStyles, Theme, FormControlLabel, Switch, Typography, SwitchClassKey, SwitchProps } from '@material-ui/core';
import { CustomOfflineContext } from '../../StateProvider/OfflineContext/OfflineContext';
import axiosInstance from '../../axios/axiosInstance';
import { useData } from '../../StateProvider/Provider';
import { disabledColumns, getSortedColumns } from '../../constants/useColumns';
import { SET_GRID_METADATA } from '../../StateProvider/actionTypes';

let timeout;

interface Styles extends Partial<Record<SwitchClassKey, string>> {
  focusVisible?: string;
}
interface Props extends SwitchProps {
  classes: Styles;
}

const CustomSwitch = withStyles((theme: Theme) =>
  createStyles({
    root: {
      width: 37,
      height: 20,
      padding: 0,
      margin: `0 ${theme.spacing(1)}px 0 0`
    },
    switchBase: {
      padding: '2px',
      '&$checked': {
        transform: 'translateX(16px)',
        color: theme.palette.common.white,
        '& + $track': {
          backgroundColor: '#B7B7B7',
          opacity: 1,
          border: 'none'
        }
      },
      '&$focusVisible $thumb': {
        color: '#52d869',
        border: '6px solid #fff'
      },
      '&.Mui-disabled': {
        color: `${theme.palette.grey[100]} !important`
      }
    },
    thumb: {
      width: 16,
      height: 16
    },
    track: {
      borderRadius: 26 / 2,
      border: `1px solid ${theme.palette.grey[400]}`,
      backgroundColor: '#B7B7B7',
      opacity: 1,
      transition: theme.transitions.create(['background-color', 'border'])
    },
    checked: {},
    focusVisible: {}
  })
)(({ classes, ...props }: Props) => {
  return (
    <Switch
      focusVisibleClassName={classes.focusVisible}
      // disableRipple
      classes={{
        root: classes.root,
        switchBase: classes.switchBase,
        thumb: classes.thumb,
        track: classes.track,
        checked: classes.checked
      }}
      {...props}
    />
  );
});

function CustomReactTableHeaderOptions({
  columns,
  // setColumns,
  // columnApi,
  // refreshGrid = null,
  renderedFrom = null,
  isClientSideGrid = false,
  dispatchTable = null,
  showOnlyShowFilteredRecordSwitch = false,
  saveColumnOptions = false,
  selectedRecords = 0,
  // selectedReportView = null,
  // setSelectedReportView = null
  setHiddenColumns = null,
  getToggleHideAllColumnsProps = null,
  setColumnOrder = null
}) {
  const [disableSelectionSwitch, setDisableSelectionSwitch] = useState(true);

  const [openColumnSelection, setOpenColumnSelection] = useState(false);
  const [checked, setChecked] = useState(false);
  const [openColumnSelectionAnchorEl, setOpenColumnSelectionAnchorEl] = useState<HTMLButtonElement | null>(null);
  const { isOffline } = useContext(CustomOfflineContext);
  const {
    state: { user }
  }: any = useData();
  const { dispatch }: any = useData();

  useEffect(() => {
    const saved = localStorage.getItem(`${renderedFrom}_selected`);
    if (saved) {
      try {
        const initialValue = JSON.parse(saved);
        setDisableSelectionSwitch(selectedRecords === 0);
        if (initialValue?.length === 0 && checked) {
          setChecked(false);
          dispatchTable({
            type: 'showFilteredRecordsOnly'
          });
        }
      } catch {
        setDisableSelectionSwitch(true);
      }
    } else {
      setDisableSelectionSwitch(true);
    }
  }, [selectedRecords]);

  const updateGridHiddenColumns = (hiddenColumns = []) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(function () {
      let data = localStorage.getItem('gridMetaData');
      let request = data == 'undefined' ? {} : { ...JSON.parse(data) };
      if (request[renderedFrom]) {
        request[renderedFrom].hide = [...hiddenColumns];
      } else {
        request[renderedFrom] = {
          hide: [...hiddenColumns],
          staticColumns: {
            createdBy: false,
            updatedBy: false
          },
          disable: disabledColumns[renderedFrom] ?? []
        };
      }
      updateGridMetaData(request);
    }, 600);
  };
  const updateGridMetaData = (request) => {
    axiosInstance()
      .post(`user/meta-grid`, {
        _id: user?.user?._id,
        gridMetaData: { ...request }
      })
      .then((data) => {
        fetchGridMetaData();
      });
  };
  const fetchGridMetaData = () => {
    axiosInstance()
      .get(`user/meta-grid/${user?.user?._id}`)
      .then(({ data: { data } }) => {
        let tempMetaData = JSON.stringify(data?.gridMetaData);
        localStorage.setItem('gridMetaData', tempMetaData);
        if (dispatch) {
          dispatch({ type: SET_GRID_METADATA, payload: data?.gridMetaData });
        }
      });
  };

  // useEffect(() => {
  //     if (!selectedReportView || !columnApi) return

  //     localStorage.removeItem(renderedFrom)

  //     const columnView = JSON.parse(selectedReportView.columnState);

  //     columnApi.setColumnState(columnView);

  // }, [selectedReportView, columnApi])

  return (
    <>
      {showOnlyShowFilteredRecordSwitch && (
        <>
          <FormControlLabel
            value={checked}
            checked={checked}
            onChange={() => {
              setChecked(!checked);

              if (dispatchTable) {
                dispatchTable({
                  type: 'showFilteredRecordsOnly'
                });
              }
            }}
            className="show-only-selected-switch"
            control={<CustomSwitch disabled={disableSelectionSwitch} />}
            style={{ fontSize: '0.8rem', marginLeft: 0, padding: '0px 0 10px' }}
            label={<Typography style={{ fontWeight: 400 }}>Show Only Selected</Typography>}
            labelPlacement="end"
          />
        </>
      )}
    </>
  );
}

export default CustomReactTableHeaderOptions;
