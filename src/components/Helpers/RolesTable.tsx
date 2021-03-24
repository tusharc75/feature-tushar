import React, { useEffect } from "react";
import { DataGrid } from "@material-ui/data-grid";
import DataGridCustomToolbar from './../../components/Helpers/DataGridCustomToolbar';

const RolesTable = ({ columns, loading, rows, getTableData }) => {
  useEffect(() => {
    getTableData();

    // eslint-disable-next-line
  }, []);

  return (
    <div style={{ width: "100%", height: "500px" }}>
      <DataGrid
        components={{
          Toolbar: DataGridCustomToolbar,
        }}
        density="compact"
        loading={loading}
        rows={rows}
        columns={columns}
        disableSelectionOnClick
        disableMultipleSelection
        pageSize={10}
        pagination
      />
    </div>
  );
};

export default RolesTable;
