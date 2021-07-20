import React, { useState } from 'react';
import { Box, Button, Popover, FormControl, FormGroup, FormControlLabel, Tooltip, Divider, Switch } from '@material-ui/core';
import ViewWeekIcon from '@material-ui/icons/ViewWeek';
import RefreshIcon from '@material-ui/icons/Refresh';

export default function CustomGridHeaderOptions({ columns, setColumns, columnApi, refreshGrid = null, renderedFrom = null }) {
  const [openColumnSelection, setOpenColumnSelection] = useState(false);
  const [openColumnSelectionAnchorEl, setOpenColumnSelectionAnchorEl] = useState<HTMLButtonElement | null>(null);

  return (
    <Box className="ag-grid-listing-grid-header-options border px-2 py-1 d-flex gap-2">
      <Button
        aria-describedby="columnSelection"
        size="small"
        className="px-2"
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
            {columns.map((column: any, index) => {
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
