import React from "react";
import { DataGrid } from "@material-ui/data-grid";
import { Box, Button, TextField, InputAdornment } from "@material-ui/core";
import { Add, Search } from "@material-ui/icons";
import CustomDataGridNoDataFound from "../Helpers/CustomDataGridNoDataFound";

const UserRoles = ({ brand }) => {
  const columns = [
    { field: "entityName", headerName: "Entity Name", width: 150 },
  ];

  const dataRows = brand.entity.map((row) => ({
    id: row.id,
    entityName: row.name,
  }));

  return (
    <div>
      <Box marginBottom={2} display="flex" justifyContent="flex-end">
        <Button variant="outlined">
          <Add /> Create User Roles
        </Button>
        <Box marginX={2} />
        <TextField
          style={{ width: "150px" }}
          variant="outlined"
          type="search"
          placeholder="Search"
          size="small"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search color="disabled" />
              </InputAdornment>
            ),
          }}
        />
      </Box>
      <div style={{ width: "100%", height: "250px" }}>
        <DataGrid
          components={{
            NoRowsOverlay: CustomDataGridNoDataFound,
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
