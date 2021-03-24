import React, { useState, useEffect } from "react";
import { useHistory } from "react-router-dom";
import { DataGrid, GridToolbar } from "@material-ui/data-grid";
import {
  Box,
  IconButton,
  Tooltip,
  Chip,
  TextField,
  InputAdornment,
} from "@material-ui/core";
import { Add, Delete, Search } from "@material-ui/icons";
import moment from "moment";
import NoDataCell from '../Helpers/NoDataCell'
import { GetUsers } from "../../axios";
import DataGridCustomToolbar from './../../components/Helpers/DataGridCustomToolbar';

const INACTIVE_STATUS = "Inactive";
const ACTIVE_STATUS = "Active";

const Users = ({ entity }) => {
  const history = useHistory();
  const [selectedUser, setSelectedUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [dataRows, setRows] = useState([]);

  useEffect(() => {
    getUsersForEntity();

    // eslint-disable-next-line
  }, []);

  const getUsersForEntity = async () => {
    try {
      setLoading(true);
      const { data } = await GetUsers("", { entity: entity._id });
      getDataRows(data);
      setLoading(false);
    } catch (error) {
      console.log(error);
      setLoading(false);
    }
  };

  const columns = [
    {
      field: "name", headerName: "Name", width: 150,
      renderCell: (params) => (
        <>
          {
            params?.value ?? <NoDataCell />
          }
        </>
      )
    },
    {
      field: "email", headerName: "Email", width: 300,
      renderCell: (params) => (
        <>
          {
            params?.value ?? <NoDataCell />
          }
        </>
      )
    },
    {
      field: "status",
      headerName: "Status",
      width: 100,
      renderCell: (params) =>
        params.value === ACTIVE_STATUS ? (
          <Chip size="small" label={ACTIVE_STATUS} className="bg-primary" />
        ) : (
          <Chip size="small" label={INACTIVE_STATUS} className="bg-danger" />
        ),
    },
    {
      field: "createdAt", headerName: "Created At", width: 120,
      renderCell: (params) => (
        <>
          {
            params?.value ?? <NoDataCell />
          }
        </>
      )
    },
  ];

  const getDataRows = (users) => {
    const rows = users?.map((row) => ({
      id: row._id,
      name: `${row.firstName} ${row.lastName}`,
      email: row.email,
      status: row.blocked ? INACTIVE_STATUS : ACTIVE_STATUS,
      createdAt: moment(row.createdAt).format("MMM Do, YYYY"),
    }));

    setRows(rows);
  };

  // const onCellClick = ({ row }) => {
  //   history.push({
  //     pathname: "/brand-configuration/users",
  //     state: {
  //       brandData: {
  //         id: entity.brand,
  //       },
  //       userId: row,
  //     },
  //   });
  // };

  const handleRowSelection = ({ rowIds }) => {
    if (rowIds.length > 1) {
      setSelectedUser(null);
    } else {
      const id = rowIds[0];
      const row = entity.user.find((data) => id === data._id);
      setSelectedUser(row);
    }
  };

  return (
    <div>
      <Box
        marginBottom={2}
        display="flex"
        justifyContent="flex-end"
        alignItems="center"
      >
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
        <Box component="span" marginX={1} />
        <Tooltip title="Delete User">
          <IconButton
            onClick={() => alert("TODO: You need to setup delete yet!")}
          >
            <Delete />
          </IconButton>
        </Tooltip>
        <Box marginX={1} />
        <Tooltip title="Create User">
          <IconButton
            onClick={() =>
              history.push({
                pathname: "/brand-configuration/users/new",
                state: {
                  brand_id: entity._id,
                },
              })
            }
          >
            <Add />
          </IconButton>
        </Tooltip>
      </Box>
      <div style={{ width: "100%", height: "350px" }}>
        <DataGrid
          components={{
            Toolbar: DataGridCustomToolbar,
          }}
          loading={loading}
          rows={dataRows}
          columns={columns}
          checkboxSelection
          disableSelectionOnClick
          disableMultipleSelection
          density="compact"
          // onCellClick={onCellClick}
          // onSelectionChange={handleRowSelection}
          pageSize={5}
          pagination
        />
      </div>
    </div>
  );
};

export default Users;
