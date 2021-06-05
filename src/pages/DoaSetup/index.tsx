import React, { useContext, useEffect, useState } from "react";
import { makeStyles } from "@material-ui/core/styles";
import {
  Box,
  Grid,
  Divider,
  IconButton,
  Tooltip,
  Checkbox,
  Button,
  TextField,
  InputAdornment,
} from "@material-ui/core";
import { Link } from 'react-router-dom'
import { DataGrid } from "@material-ui/data-grid";
import Layout from "../../components/Layout";
import Container from "../../components/CustomContainer";
import BoxWithBorder from "../../components/BoxWithBorder";
import NewStepper from "../../components/Helpers/NewStepper";
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import DoaDialog from "./ManageDoa/ManageDoaDialog";
import DoaHeader from "./DoaHeader";
import { GiHiveMind } from "react-icons/gi";
import routes from './../../components/Helpers/Routes';
import { useData } from "../../StateProvider/Provider";
import DeleteIcon from '@material-ui/icons/Delete';
import { FcPlus } from "react-icons/fc";
import { useCallback } from "react";
import { getSearchQuery } from "../../services/util";
import axiosInstance from "../../axios/axiosInstance";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import moment from "moment";
import { FaUserAltSlash, FaUserCheck } from "react-icons/fa";
import CustomDataGridNoDataFound from "../../components/Helpers/DataGridHelpers/CustomDataGridNoDataFound";
import CustomRenderCell from '../../components/Helpers/CustomRenderCell'
import CustomDataGridToolbar from "../../components/Helpers/DataGridHelpers/CustomDataGridToolbar";
import { dateFormat } from "../../constants/helpers"

const useStyles = makeStyles((theme) => ({
  actionBtn: {
    background: theme.palette.primary.light,  //  lightBg
    color: theme.palette.error.contrastText,
    "&:hover": {
      background: theme.palette.primary.light,  //  lightBg
    },
  },

  backButton: {
    marginRight: theme.spacing(1),
  },

  tabsContainer: {
    marginBottom: theme.spacing(2),
  },

  tab: {
    margin: theme.spacing(0, 2),
  },

  infoContainer: {
    display: "flex",
    marginTop: theme.spacing(2),
    justifyContent: "space-evenly",
    [theme.breakpoints.down("sm")]: "flex-start",
  },

  box: {
    backgroundColor: theme.palette.primary.light,
    borderRadius: 8,
    padding: theme.spacing(1.5, 2),
    margin: theme.spacing(0, 2),
    fontWeight: "normal",
    width: "141",
    height: "51"
  },

  btnMargin: {
    marginRight: theme.spacing(6)
  },

  newBox: {
    backgroundColor: theme.palette.primary.light,
    borderRadius: 5,
    color: theme.palette.error.contrastText,
    display: "flex",
    padding: theme.spacing(1, 4),
    justifyContent: "space-evenly",
    [theme.breakpoints.down("sm")]: "flex-start",
  },

  container: {
    marginTop: theme.spacing(2)
  },

  doaInfo: {
    marginTop: theme.spacing(5),
    marginBottom: theme.spacing(2.25),
    marginLeft: theme.spacing(3.125)
  },

  headerCss: {
    paddingLeft: theme.spacing(3.125)
  },

  actionIcon: {
    "&:hover": {
      cursor: "pointer"
    },
    width: 18,
    height: 18,
    margin: 2
  },
  links: {
    color: theme.palette.primary.main,  //  textDark
  },

  no_doa: {
    color: theme.palette.error.main,  //  textDark
  },
  linkDivider: {
    backgroundColor: theme.palette.primary.main,  //  darkBg
    margin: "0 1rem",
  },
}));

export default function Doa() {

  const classes = useStyles();
  const [dataRows, setDataRows] = useState<any[]>([]);
  const { state: { user } }: any = useData();
  const [userSingleSelect, setUserSingleSelect] = useState(null);
  const [open, setOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [query, setQuery] = useState({ page: 0, limit: 25 });
  const [doaPermissions, setDoaPermissions] = useState({ isCreate: true, isUpdate: true, isRead: true, isDelete: true });
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false)
  const [deleteRec, setDeleteRec] = useState<any>({})
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false)
  const [loading, setLoading] = useState(false);
  const [rowCount, setRowCount] = useState(0);
  const [checkAllUsers, setCheckAllUsers] = useState(false);
  const [singleUserDelete, setSingleUserDelete] = useState({ id: null, show: false, Name: "" })
  const toastConfig = useContext(CustomToastContext);
  const [users, setUsers] = useState<any[]>([]);
  const [doa, setDoa] = useState<any[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<any[]>([]);


  useEffect(() => {
    const data = user?.role?.sideBar;

    if (data) {
      const hasOpportunityPermission = data.find(d => d.name == "DOA");
      if (hasOpportunityPermission) {
        setDoaPermissions({
          isCreate: hasOpportunityPermission.isCreate,
          isUpdate: hasOpportunityPermission.isUpdate,
          isRead: hasOpportunityPermission.isRead,
          isDelete: hasOpportunityPermission.isDelete
        });
      }
    }
  }, [user]);

  const fetchUsers = useCallback(() => {
    let searchParams: any = { ...query };
    searchParams = searchVal
      ? { ...searchParams, search: searchVal }
      : { ...searchParams };
    let api = getSearchQuery("/user", searchParams);
    setLoading(true);
    axiosInstance()
      .get(api)
      .then(({ data: { data, count } }) => {
        setUsers(data);
        getRows(data);
        setRowCount(count);
        setCheckAllUsers(false);
        setLoading(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setLoading(false);
      });
  }, [searchVal, query]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const fetchDoa = (id) => {
    setDoa([])
    axiosInstance()
      .get(`/doa/${id}`)
      .then(({ data: { data, count } }) => {
        setDoa(data?.doa.map(item => {
          return {
            id: item.user?._id,
            name: `${item.user.firstName} ${item.user.lastName}`,
            firstName: item.user.firstName,
            lastName: item.user.lastName,
            currency: item.currency ? item.currency : "USD",
            amount: item.amount
          };
        })
        );
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setLoading(false);
      });
  }


  const getRows = (data: []) => {
    const rows = data.length
      ? data.map((user: any) => ({
        id: user._id,
        isChecked: false,
        name: `${user.firstName} ${user.lastName}`,
        email: user.email,
        createdAt: moment(user.createdAt).format(dateFormat),
        status: user.blocked ? user.blocked : false,
      }))
      : [];

    setDataRows(rows);
  };

  const handlePage = (params) => {
    if (query.page !== params.page) {
      setQuery((prevState) => ({ ...prevState, page: params.page }));
    }
  }
  const handlePageSize = (params) => {
    if (params.pageSize !== query.limit) {
      setQuery({ page: 0, limit: params.pageSize });
    }
  };


  const handleSearch = (e) => {
    if (query.page !== 0) {
      setQuery((prevState) => ({ ...prevState, page: 0 }));
    }
    setSearchVal(e.target.value);
  };

  const showConfirmBox = (row) => {
    if (row) {
      setIsConformDialogVisible(true)
      if (row && row._id) {
        setDeleteRec(row)
      }
    }
    else {
      if (dataRows.find((d) => d.isChecked && d.canDelete == false)) {
        setShowDeleteWarningConfirmBox(true);
      } else {
        setIsConformDialogVisible(true)
      }
    }
  }

  const handleSortModelChange = (params) => {
    if (params?.sortModel && params.sortModel.length > 0) {
      let temp = { ...params.sortModel[0] };
      setQuery((prevState) => ({
        ...prevState,
        page: 0,
        sortBy: temp.field,
        orderBy: temp.sort,
      }));
    }
  }

  const columns = [
    {
      field: "isChecked",
      headerName: "Checkbox",
      renderHeader: () => (
        <Checkbox
          color="primary"
          checked={checkAllUsers}
          onChange={(ev) => {
            setCheckAllUsers(ev.target.checked);
            const gridData = dataRows;
            gridData.map((d) => {
              d.isChecked = ev.target.checked;
              return d;
            });
            setDataRows([...gridData]);
          }}
        />
      ),
      renderCell: (params) => (
        <Checkbox
          color="primary"
          checked={params.value}
          onChange={(ev) => {
            updateCheckedStatus(params, ev);
          }}
        />
      ),
      disableColumnMenu: true,
      sortable: false,
      filterable: false,
      width: 75,
    },
    {
      field: "name",
      headerName: "Name",
      width: 400,
      renderCell: (params: any) => (
        <Link
          title={params.value}
          className="text-truncate link"
          onClick={() => {
            // setOpen(true)
            setUserSingleSelect(params?.row)
            fetchDoa(params?.row?.id)
          }
          }
        >
          {params.value}
        </Link>
      ),
    },
    {
      field: "status",
      headerName: "Status",
      width: 150,
      sortable: false,
      filterable: false,
      align: "center",
      headerAlign: "center",
      disableColumnMenu: true,
      renderCell: (params: any) => (
        <div style={{ width: 150 }}>
          {params.value ? (
            <FaUserCheck className="text-success" />
          ) : (
            <FaUserAltSlash className="text-error" />
          )}{" "}
        </div>
      ),
    },

    {
      field: "email",
      headerName: "Email",
      width: 300,
      renderCell: (params: any) => (
        <p title={params.value} className="text-truncate">
          <CustomRenderCell value={params?.value} isCopyToClipboard={true} />
        </p>
      ),
    },
    {
      field: "createdAt",
      headerName: "Created At",
      width: 200,
      renderCell: (params: any) => (
        <p title={`Created At • ${params.value}`} className="text-truncate">
          {params.value}
        </p>
      ),
    },

    // {
    //   field: "actions",
    //   headerName: "Actions ",
    //   renderCell: (params: any) =>
    //     user?.user._id === params.row.id ? (
    //       <p title="There is no action for currently logged in user">
    //         No Actions
    //       </p>
    //     ) : (
    //       <>
    //         {
    //           doaPermissions.isUpdate ?
    //             <Tooltip title="Edit">
    //               <IconButton aria-label="Edit" onClick={() => {
    //                 // setSingleApproveDisapproveAccount({ show: true, approved: true, id: params.row._id, accountName: params.row.accountName })
    //                 setOpen(true)
    //                 setUserSingleSelect(params.row);
    //                 // fetchDoa(params?.row?.id)
    //               }}>
    //                 <FcPlus />
    //               </IconButton>
    //             </Tooltip> : ""
    //         }
    //         {doaPermissions.isDelete ? (
    //           <Tooltip title="Delete">
    //             <IconButton
    //               aria-label="Delete"
    //               onClick={() => showConfirmBox(params.row)}
    //             >
    //               <DeleteIcon fontSize="small" color="error" />
    //             </IconButton>
    //           </Tooltip>
    //         ) : (
    //           <Tooltip
    //             className="cursor-stop"
    //             title="You do not have permission to delete user"
    //           >
    //             <IconButton aria-label="Delete">
    //               <DeleteIcon fontSize="small" />
    //             </IconButton>
    //           </Tooltip>
    //         )}
    //       </>
    //     ),
    //   width: 200,
    // },
  ] as Array<any>;

  const updateCheckedStatus = (params, ev) => {
    const gridData = [...dataRows];
    const indexOfRecord = gridData.findIndex((d) => d.id === params.row.id);
    gridData[indexOfRecord].isChecked = ev.target.checked;

    setDataRows([...gridData]);

    const checkedRecords = gridData.filter((d) => d.isChecked === true);

    if (checkedRecords.length === gridData.length) {
      setCheckAllUsers(true);
    } else {
      setCheckAllUsers(false);
    }
    handleSelectedUsers(params.row.id, ev.target.checked);
  };

  const handleSelectedUsers = (id, isChecked) => {
    let tempSelectedRecs = [...selectedUsers],
      curRecIndex = selectedUsers.indexOf(id);
    if (isChecked && curRecIndex < 0) {
      tempSelectedRecs = [...selectedUsers, id];
    } else if (!isChecked && curRecIndex >= 0) {
      tempSelectedRecs.splice(curRecIndex, 1);
    }
    setSelectedUsers(tempSelectedRecs);
  };


  return (
    <Layout>
      <Grid container className="headerbox">
        <CustomBreadCrumbs routes={[routes.doa]} />
      </Grid>
      {/* Tables Begins Here */}
      <Container>
        <div className="header-panel">
          <DoaHeader
            onSearch={handleSearch}
            searchVal={searchVal}
            DoaPermissions={doaPermissions}
            onCreate={1}
            showConfirmBox={showConfirmBox}
            canDelete={dataRows.filter((d) => d.isChecked).length == 0}
            icon={<GiHiveMind className="headerLogo" />}
            heading="DOA Setup"
          />
        </div>
      </Container>
      <Box component="div">
        {(userSingleSelect) && (
          <DoaDialog
            userList={dataRows}
            doa={doa}
            doaCurrency={"USD"}
            userSelected={userSingleSelect.id}
            open={open}
            onClose={() => setOpen(false)}
            onSuccess={() => {
              setOpen(false)
              fetchDoa(userSingleSelect.id)
            }}
          />
        )}
        {/* <BrandHeader
          total={dataRows.length}
          totalHeading={"Total no. of Users"}
          active={[1, 78, 786]}
          activeHeading={"DOA - Active"}
          inActive={[1, 78, 786]}
          inActiveHeading={"DOA - Incomplete"}
          heading="DOA Set up"
        >
        </BrandHeader> */}
        <Container>
          <div className="listing-grid">
            <DataGrid
              components={{
                Toolbar: CustomDataGridToolbar,
                NoRowsOverlay: CustomDataGridNoDataFound,
              }}
              rows={loading ? [] : dataRows}
              columns={columns}
              loading={loading}
              disableSelectionOnClick
              disableMultipleSelection
              paginationMode="server"
              pagination
              onPageChange={handlePage}
              onPageSizeChange={handlePageSize}
              pageSize={query.limit}
              page={query.page}
              rowCount={dataRows.length}
              rowsPerPageOptions={[25, 50, 75]}
              onSortModelChange={handleSortModelChange}
              density="compact"
            />
          </div>
          <Box marginY={5} />
          <BoxWithBorder styles={{ minHeight: "300px", padding: "0px" }}>

            {userSingleSelect ? (
              doa.length > 0
                ? (
                  <>
                    <Button
                      color="inherit"
                      size="small"
                      className={classes.actionBtn}
                      onClick={() => setOpen(true)}
                    >
                      Edit Doa
                </Button>
                    <NewStepper
                      heading={"DOA Details of " + userSingleSelect?.name}
                      doaCurrency={"USD"}
                      steps={doa}
                    />
                  </>
                ) : (
                  <React.Fragment>
                    <div className={classes.no_doa}>No DOA created </div>
                    <Button
                      size="small"
                      color="inherit"
                      className={classes.actionBtn}
                      onClick={() => setOpen(true)}
                    >
                      Add Doa
                    </Button>
                  </React.Fragment>
                )) : "Select a DOA"
            }
          </BoxWithBorder>
        </Container>
      </Box>
    </Layout>
  )
};
