import React from 'react';
import { DataGrid } from '@material-ui/data-grid';
import { Box, Button, TextField, InputAdornment } from '@mui/material';
import { Add, Search } from '@mui/icons-material';
import CustomDataGridNoDataFound from '../Helpers/DataGridHelpers/CustomDataGridNoDataFound';

const UserRoles = ({ brand }) => {
  const columns = [{ field: 'entityName', headerName: 'Entity Name', width: 150 }];

  const dataRows = brand.entity.map((row) => ({
    id: row.id,
    entityName: row.name
  }));

  return (
    <div>
      <Box marginBottom={2} display="flex" justifyContent="flex-end">
        <Button size="small" variant="outlined">
          <Add /> Create User Roles
        </Button>
        <Box marginX={2} />
        <TextField
          style={{ width: '150px' }}
          variant="outlined"
          type="search"
          placeholder="Search"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search color="disabled" />
              </InputAdornment>
            )
          }}
        />
      </Box>
      <div className="listing-grid">
        <DataGrid
          components={{
            NoRowsOverlay: CustomDataGridNoDataFound
          }}
          rows={dataRows}
          columns={columns}
          disableSelectionOnClick
          disableMultipleSelection
          hideFooter
        />
      </div>
    </div>
  );
};

export default UserRoles;
