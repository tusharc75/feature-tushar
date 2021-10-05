import React, { useContext, useState } from 'react';
import { Box, Button, Popover, FormControl, FormGroup, FormControlLabel, Tooltip, Divider, Switch } from '@material-ui/core';
import ViewWeekIcon from '@material-ui/icons/ViewWeek';
import RefreshIcon from '@material-ui/icons/Refresh';
import { CustomOfflineContext } from '../../StateProvider/OfflineContext/OfflineContext';
import axiosInstance from '../../axios/axiosInstance';
import { useData } from '../../StateProvider/Provider';
import { disabledColumns } from "../../constants/columns"
import { SET_GRID_METADATA } from '../../StateProvider/actionTypes';
import Menu from "@material-ui/core/Menu"
import ExpandMore from '@material-ui/icons/ExpandMore';
import Checkbox from "@material-ui/core/Checkbox"
import { getStaticFields } from "../../constants/columns"

const mappedStaticColumns = {
  "Created By": "createdBy",
  "Updated By": "updatedBy"
}
let timeout
export default function CustomGridHeaderOptions({ columns, setColumns, columnApi,
  refreshGrid = null, renderedFrom = null, }) {
  const [openColumnSelection, setOpenColumnSelection] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [openColumnSelectionAnchorEl, setOpenColumnSelectionAnchorEl] = useState<HTMLButtonElement | null>(null);
  const { isOffline } = useContext(CustomOfflineContext);
  const { state: { user, gridMetaData } }: any = useData();
  const { dispatch }: any = useData();

  const updateGridHiddenColumns = (hiddenColumns = []) => {
    if (timeout) clearTimeout(timeout);
    timeout = setTimeout(function () {
      let request = { ...gridMetaData }
      if (request[renderedFrom]) {
        request[renderedFrom].hide = [...hiddenColumns]
      }
      else {
        request[renderedFrom] = {
          hide: [...hiddenColumns],
          staticColumns: {
            createdBy: false,
            updatedBy: false
          },
          disable: disabledColumns[renderedFrom] ?? []
        }
      }
      updateGridMetaData(request)
    }, 600);

  }
  const updateGridMetaData = (request) => {
    axiosInstance()
      .post(`user/meta-grid`, {
        _id: user?.user?._id,
        gridMetaData: { ...request }
      })
      .then((data) => {
        fetchGridMetaData()
      })
  }
  const fetchGridMetaData = () => {
    axiosInstance()
      .get(`user/meta-grid/${user?.user?._id}`)
      .then(({ data: { data } }) => {
        let tempMetaData = JSON.stringify(data?.gridMetaData)
        localStorage.setItem("gridMetaData", tempMetaData);
        if (dispatch) {
          dispatch({ type: SET_GRID_METADATA, payload: data?.gridMetaData });
        }
      })
  }

  return (
    <Box className="ag-grid-listing-grid-header-options border px-2 py-1 d-flex gap-2">
      <Button
        aria-describedby="columnSelection"
        size="small"
        className="px-2"
        disabled={isOffline}
        startIcon={<ViewWeekIcon />}
        color="primary"
        onClick={(event) => {
          setOpenColumnSelection(true);
          setOpenColumnSelectionAnchorEl(event.currentTarget);
        }}
      >
        Columns
      </Button>

      <Popover
        id="columnSelection"
        open={openColumnSelection}
        anchorEl={openColumnSelectionAnchorEl}
        onClose={() => {
          setOpenColumnSelection(false);
          setOpenColumnSelectionAnchorEl(null);
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left'
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left'
        }}
      >
        <FormControl component="fieldset" className="px-3 py-2">
          <FormGroup>
            {[...columns,
            ...getStaticFields()
            ].map((column: any, index) => {
              return (
                <Tooltip key={index} title={column.disabled ? 'Main columns are always visible' : ''}>
                  <FormControlLabel
                    key={index}
                    className="my-1"
                    name={column.field}
                    control={
                      <Switch
                        size="small"
                        disabled={column.disabled}
                        checked={column.show}
                        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                          const newColumns = [...columns];

                          const getFieldIndex = columns.findIndex((d) => d.field === column.field);
                          newColumns[getFieldIndex].show = event.target.checked;
                          setColumns(newColumns);

                          const hiddenColumns = newColumns.filter((d) => !d.show).map((m) => m.field);
                          const nonHiddenColumns = newColumns.filter((d) => d.show).map((m) => m.field);
                          columnApi.setColumnsVisible(hiddenColumns, false);
                          columnApi.setColumnsVisible(nonHiddenColumns, true);
                          let tempColumnState = columnApi.getColumnState()
                          let hidedColumns = tempColumnState.filter(o => o?.hide)
                            .map(o => o?.colId)

                          updateGridHiddenColumns(hidedColumns)
                          const columnState = JSON.stringify(columnApi.getColumnState());

                          localStorage.setItem(renderedFrom, columnState);
                        }}
                      />
                    }
                    label={column.headerName}
                  />
                </Tooltip>
              );
            })}
          </FormGroup>
        </FormControl>
        <FormControl>

        </FormControl>
      </Popover>

      {refreshGrid && (
        <>
          <Divider orientation="vertical" flexItem />

          <Button
            aria-describedby="columnSelection"
            size="small"
            className="px-2"
            startIcon={<RefreshIcon />}
            color="primary"
            disabled={isOffline}
            onClick={() => {
              refreshGrid();
            }}
          >
            Reftesh
          </Button>
        </>
      )}

      {/* <Button aria-describedby="columnSelection"
            size="small"
            className="px-2"
            startIcon={<FilterListIcon />}
            color="primary"
            onClick={() => {
                setShowGridFilters(!showGridFilters)
            }}>
            {`${showGridFilters ? "Hide" : "Show"} filters`}
        </Button> */}
    </Box>
  );
}
