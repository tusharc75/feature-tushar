import React, { useCallback, useContext, useEffect, useState } from "react";
import Layout from "../../components/Layout";
import {
  Box,
  Button,
  Checkbox,
  Menu,
  MenuItem,
  Tooltip,
  IconButton,
  Paper,
  Grid,
  Divider,
  Typography,
} from "@material-ui/core";
import { useData } from "../../StateProvider/Provider";
import { Link } from "react-router-dom";
import { DataGrid } from "@material-ui/data-grid";
import { ExpandMore } from "@material-ui/icons";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import AddIcon from "@material-ui/icons/Add";
import ManageContactDialog from "./ManageContact/index";
import { makeStyles } from "@material-ui/core/styles";
import CustomBreadCrumbs from "./../../components/CustomBreadCrumbs";
import SearchBox from "../../components/Helpers/SearchBox";
import DeleteIcon from "@material-ui/icons/Delete";
import CustomContainer from "../../components/CustomContainer";
import MessageDialog from "../../components/Helpers/MessageDialog";
import { getSearchQuery } from "../../services/util";
import DataGridCustomToolbar from "../../components/Helpers/DataGridCustomToolbar";
import CustomRenderCell from "../../components/Helpers/CustomRenderCell";
import styles from "../Leads/Header.module.scss";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import ToggleButton from "@material-ui/lab/ToggleButton";
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup";
import { MdContacts } from "react-icons/md";
import axiosInstance from "../../axios/axiosInstance";
import {
  contactTemplateFileName,
  downloadExcel,
  sidebarResource,
  contactImportErrorFileName,
} from "../../constants/helpers";
import moment from "moment";
import NoDataCell from "../../components/Helpers/NoDataCell";
import { useHistory } from "react-router-dom";
import CustomDataGridNoDataFound from "../../components/Helpers/CustomDataGridNoDataFound";
import ImportExportLinks from "../../components/Helpers/ImportExportLinks";
import { Chip } from "@material-ui/core";
import routes from "./../../components/Helpers/Routes";

const ContactTypes = [
  {
    key: "All Contacts",
    value: 1,
  },
  {
    key: "My Contacts",
    value: 2,
  },
];

let contactTimeout;
export default function Contact(props) {
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user },
  }: any = useData();
  const {
    contact: { contactApi, contactResource, contactPermission, contactRoute },
    contactBreadcrumb,
    account,
  } = props;
  const [selectedType, setselectedType] = useState(1);
  const [contactData, setContactData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dataRows, setDataRows] = useState([]);
  const [rowCount, setRowCount] = useState(0);
  const [checkAllContacts, setCheckAllContacts] = useState(false);
  const [query, setQuery] = useState({ page: 0, limit: 25 });
  const [anchorEl, setAnchorEl] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [renderCount, setRenderCount] = useState(0);

  const [
    showDeleteWarningConfirmBox,
    setShowDeleteWarningConfirmBox,
  ] = useState(false);
  const [showCreateContactDialog, setShowCreateContactDialog] = useState(false);
  const [singleContactDelete, setSingleContactDelete] = useState({
    id: null,
    show: false,
    contactName: "",
  });

  const [createContactEntityDetails] = useState({
    fields: [],
    initialValues: {},
  });

  const history = useHistory();

  const [accountDetails, setAccountDetails] = useState({
    accountId: history.location?.state?.accountId,
    accountName: history.location?.state?.accountName,
  });
  const [contactPermissions, setContactPermissions] = useState<any>({
    isCreate: false,
    isUpdate: false,
    isRead: false,
    isDelete: false,
  });

  const [filter, setFilter] = useState("All Contacts");
  const handleFilter = (event, newFilter) => {
    if (newFilter !== null) {
      setFilter(newFilter);
      handleContactSel(ContactTypes.find((d) => d.key === newFilter).value);
    }
  };

  const columns = [
    {
      field: "isChecked",
      headerName: "Checkbox",
      renderHeader: () => (
        <Checkbox
          color="primary"
          checked={checkAllContacts}
          onChange={(ev) => {
            setCheckAllContacts(ev.target.checked);
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
            const gridData = dataRows;
            const indexOfRecord = gridData.findIndex(
              (d) => d.id === params.row.id
            );
            gridData[indexOfRecord].isChecked = ev.target.checked;

            setDataRows([...gridData]);

            const checkedRecords = gridData.filter((d) => d.isChecked === true);

            if (checkedRecords.length === gridData.length) {
              setCheckAllContacts(true);
            } else {
              setCheckAllContacts(false);
            }
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
      width: 250,
      renderCell: (params) => (
        <>
          <Link className="link" to={`/${contactRoute}/detail/${params.row._id}`}>
            {params.value || ""}
          </Link>
        </>
      ),
    },
    {
      field: "relatedLead",
      headerName: "Related Lead",
      width: 250,
      renderCell: (params) => (
        <>
          {
            params.value ?
              <Link className="link" to={`${routes.leadDetail.path}/${params.value._id}`} title={[params.value?.firstName, params.value?.lastName].filter(f => f).join(" ")}>
                {[params.value?.firstName, params.value?.lastName].filter(f => f).join(" ")}
              </Link>
              : <NoDataCell />
          }
        </>
      ),
      sortable: false,
      filterable: false,
    },
    // { field: "lastName", headerName: "Last Name", width: 200 },
    {
      field: "phone",
      headerName: "Phone",
      width: 300,
      renderCell: (params) => <CustomRenderCell value={params?.value} />,
    },
    {
      field: "email",
      headerName: "Email",
      width: 300,
      renderCell: (params) => <CustomRenderCell value={params?.value} />,
    },
    {
      field: "createdBy",
      headerName: "Created By",
      width: 250,
      disableColumnMenu: true,
      renderCell: (params) =>
        params?.value && params?.value?.user ? (
          <h5 className="createBy">
            {params.value.user.firstName}
            <span
              className="createdAtTime badge-date"
              title={`${params.value.user.firstName} • ${moment(
                params.value.date.slice(0, 10)
              ).format("MMM Do, YYYY")}`}
            >
              {moment(params.value.date.slice(0, 10)).format("MMM Do, YYYY")}
            </span>
          </h5>
        ) : (
          <NoDataCell />
        ),
    },
    {
      field: "updatedBy",
      headerName: "Updated By",
      width: 250,
      renderCell: (params) =>
        params?.value && params?.value?.user ? (
          <h5 className="updateBy">
            {params.value.user.firstName}
            <span
              className="updatedAtTime badge-date"
              title={`${params.value.user.firstName} • ${moment(
                params.value.date.slice(0, 10)
              ).format("MMM Do, YYYY")}`}
            >
              {moment(params.value.date.slice(0, 10)).format("MMM Do, YYYY")}
            </span>
          </h5>
        ) : (
          <NoDataCell />
        ),
    },
    {
      field: "accountName",
      headerName: "Account",
      width: 300,
      renderCell: (params) => <Link className="link" to={`/${account.accountRoute}/detail/${params.row.accountId}`}>
        {params.value}
      </Link>
    },
    {
      field: "actions",
      headerName: "Actions ",
      disableColumnMenu: true,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <>
          {contactPermissions.isDelete ? (
            params.row.canDelete ? (
              <Tooltip title="Delete">
                <IconButton
                  aria-label="Delete"
                  onClick={() => {
                    setSingleContactDelete({
                      show: true,
                      id: params.row._id,
                      contactName: `${params.row.firstName} ${params.row.lastName}`,
                    });
                  }}
                >
                  <DeleteIcon fontSize="small" color="error" />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip
                className="cursor-stop"
                title="You must be the owner of this contact to get the delete functionality"
              >
                <IconButton aria-label="Delete">
                  <DeleteIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )
          ) : (
            <Tooltip
              className="cursor-stop"
              title="You do not have permission to delete contact"
            >
              <IconButton aria-label="Delete">
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
        </>
      ),
      width: 200,
    },
  ];

  const onFilterChange = React.useCallback((params) => {
    if (params.filterModel.items[0].value) {
      let field = params.filterModel.items[0].columnField

      if (params.filterModel.items[0].columnField == 'createdBy') {
        field = "createdBy.user"
      }
      if (params.filterModel.items[0].columnField == 'updatedBy') {
        field = "updatedBy.user"
      }
      let deepFilter = JSON.stringify([{ field: field, term: params.filterModel.items[0].value }])
      if (params.filterModel.items[0].columnField == 'name') {
        deepFilter = JSON.stringify([{ field: "firstName", term: params.filterModel.items[0].value }, { field: "middleName", term: params.filterModel.items[0].value }, { field: "lastName", term: params.filterModel.items[0].value }])
      }
      setQuery((prevState) => ({
        ...prevState,
        deepFilter
      }));
    } else {
      setQuery({ page: 0, limit: 25 });
    }
  }, []);

  useEffect(() => {
    const data = user?.role?.sideBar;

    if (data) {
      const hasContactPermission = data.find(
        (d) => d.name == contactPermission
      );
      if (hasContactPermission) {
        setContactPermissions({
          isCreate: hasContactPermission.isCreate,
          isRead: hasContactPermission.isRead,
          isDelete: hasContactPermission.isDelete,
        });
      }
    }
  }, [user]);

  const getContacts = useCallback(() => {
    setLoading(true);
    let searchParams: any = { ...query, filterContacts: selectedType };
    searchParams = searchVal
      ? { ...searchParams, search: searchVal }
      : { ...searchParams };

    if (accountDetails.accountId) {
      searchParams["filterById"] = JSON.stringify([{ field: "accountName", term: accountDetails.accountId }]);
    }
    let api = getSearchQuery(`/${contactApi}`, searchParams);

    axiosInstance()
      .get(api)
      .then(({ data: { data, count } }) => {
        setContactData(data);
        // getRows(data);
        setRowCount(count);
        setCheckAllContacts(false);
        setLoading(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setLoading(false);
      });
  }, [searchVal, query, selectedType, accountDetails]);



  const handleSingleDeleteContacts = async () => {
    setLoading(true);
    axiosInstance()
      .put(`/${contactApi}/remove`, { ids: [singleContactDelete.id] })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });
        getContacts();
      })
      .catch((error) => {
        setLoading(false);
        toastConfig.setToastConfig(error);
      });
    setSingleContactDelete({ id: null, show: false, contactName: "" });
  };

  useEffect(() => {
    let rows = contactData?.map((u) => ({
      ...u,
      isChecked: false,
      id: u._id,
      canDelete: u?.owner?.optionValue === user?.user._id,
      collaborator: u.collaborator || [],
      accountId: u.accountName?.optionValue,
      accountName: u.accountName?.optionLabel,
      name: [u.firstName, u.middleName, u.lastName].filter((f) => f).join(" "),
      relatedLead: u.staticData?.lead
    }));
    setDataRows([...rows]);
  }, [contactData]);


  useEffect(() => {
    let millisec = Object.keys(searchVal).length > 0 ? 600 : 5;

    if (contactTimeout) {
      clearTimeout(contactTimeout);
    }

    contactTimeout = setTimeout(() => {
      getContacts();
    }, millisec);
  }, [searchVal]);

  useEffect(() => {
    if (renderCount > 0) {
      getContacts();
    } else setRenderCount((preCount) => preCount + 1);
  }, [query, selectedType]);
  // ****** ACTIONS BUTTON STUFF *********
  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const clickCreateNew = () => {
    setShowCreateContactDialog(true);
  };

  const handlePage = (params) => {
    if (query.page !== params.page) {
      setQuery((prevState) => ({ ...prevState, page: params.page }));
    }
  };

  const handleDeleteContact = () => {
    const selectedContacts = dataRows
      .filter((d) => d.isChecked)
      .map((m) => {
        return m.id;
      });

    if (selectedContacts && selectedContacts.length > 0) {
      setLoading(true);
      axiosInstance()
        .put(`/${contactApi}/remove`, {
          ids: [...selectedContacts],
        })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
          getContacts();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        })
        .finally(() => {
          setLoading(false);
          setShowDeleteConfirmBox(false);
        });
    }
  };

  const handleSearch = (e) => {
    if (query.page !== 0) {
      setQuery((prevState) => ({ ...prevState, page: 0 }));
    }
    setSearchVal(e.target.value);
  };

  const handlePageSize = (params) => {
    if (params.pageSize !== query.limit) {
      setQuery({ page: 0, limit: params.pageSize });
    }
  };

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
  };

  const handleContactSel = (filterValues) => {
    setselectedType(filterValues);
  };

  return (
    <Layout>
      <Grid container>
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[contactBreadcrumb]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2}>
          <ImportExportLinks
            module="contact(s)"
            api={contactApi}
            onSuccessfulImport={(isImportedSuccessfully) => {
              if (isImportedSuccessfully) {
                getContacts();
              }
            }}
          />
        </Grid>
      </Grid>

      <CustomContainer>
        <div className="header-panel">
          <Grid
            className={styles.filter_side_container}
            container
            justify="space-between"
          >
            <Grid item className="d-flex align-items-center gap-1">
              <MdContacts className="headerLogo" />
              <span className="listingHeader">
                {sidebarResource[contactResource]}
              </span>
              {ContactTypes && (
                <ToggleButtonGroup
                  size="small"
                  className="ml-8"
                  value={filter}
                  exclusive
                  onChange={handleFilter}
                >
                  {ContactTypes.map((k, index) => {
                    return (
                      <ToggleButton value={k.key} key={index}>
                        {k.key}
                      </ToggleButton>
                    );
                  })}
                </ToggleButtonGroup>
              )}
              {accountDetails.accountId && (
                <Chip
                  className="ml-3"
                  color="primary"
                  label={`Account: ${accountDetails.accountName}`}
                  onDelete={() => {
                    setAccountDetails({ accountId: null, accountName: null });
                    getContacts();
                  }}
                />
              )}
            </Grid>
            <Grid className={styles.filter_side} item>
              <Box className={styles.filter_side_header} component="div">
                <SearchBox
                  onSearch={handleSearch}
                  searchbox={styles.search_box_input}
                  value={searchVal}
                  size="small"
                />
                {contactPermissions.isCreate && (
                  <>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={clickCreateNew}
                      startIcon={<AddIcon />}
                      className={styles.add_submit_btn}
                    >
                      Add
                    </Button>
                  </>
                )}

                {contactPermissions.isDelete && (
                  <>
                    <Button
                      // disabled={Boolean(!selectedBrand)}
                      disabled={
                        dataRows.filter((d) => d.isChecked).length === 0
                      }
                      variant="outlined"
                      color="default"
                      size="small"
                      onClick={openActions}
                      className={styles.action_submit_btn}
                      aria-controls="action-menu"
                    >
                      Actions <ExpandMore />
                    </Button>
                    <Menu
                      anchorEl={anchorEl}
                      keepMounted
                      getContentAnchorEl={null}
                      anchorOrigin={{
                        vertical: "bottom",
                        horizontal: "left",
                      }}
                      id="action-menu"
                      open={Boolean(anchorEl)}
                      onClose={closeActions}
                    >
                      <MenuItem
                        disabled={
                          dataRows.filter((d) => d.isChecked).length == 0
                        }
                        onClick={() => {
                          if (
                            dataRows.find(
                              (d) => d.isChecked && d.canDelete == false
                            )
                          ) {
                            closeActions();
                            setShowDeleteWarningConfirmBox(true);
                          } else {
                            closeActions();
                            setShowDeleteConfirmBox(true);
                          }
                        }}
                      >
                        Delete
                      </MenuItem>
                    </Menu>
                  </>
                )}
              </Box>
            </Grid>
          </Grid>
        </div>
        <Box component="div">
          {/* <Box component="div" marginY={1}> */}
          <div className="listing-grid">
            <DataGrid
              components={{
                Toolbar: DataGridCustomToolbar,
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
              rowCount={rowCount}
              rowsPerPageOptions={[25, 50, 75]}
              onSortModelChange={handleSortModelChange}
              density="compact"
              filterMode="server"
              onFilterModelChange={onFilterChange}
            />
          </div>
          {/* </Box> */}

          {showDeleteWarningConfirmBox ? (
            <MessageDialog
              open={showDeleteWarningConfirmBox}
              message={`You are trying to delete records which you do not have permission to delete, Please remove those records from selection and try again.`}
              onClose={() => setShowDeleteWarningConfirmBox(false)}
            />
          ) : null}
          {showDeleteConfirmBox ? (
            <ConfirmationDialog
              open={showDeleteConfirmBox}
              message={`Are you sure you want to delete selected Contacts ?`}
              onClose={() => setShowDeleteConfirmBox(false)}
              onOk={handleDeleteContact}
            />
          ) : null}

          {showCreateContactDialog && (
            <ManageContactDialog
              open={showCreateContactDialog}
              onClose={() => setShowCreateContactDialog(false)}
              onSuccess={() => {
                setShowCreateContactDialog(false);
                getContacts();
              }}
              contactResource={contactResource}
              contactApi={contactApi}
              account={account}
            />
          )}

          {singleContactDelete.show ? (
            <ConfirmationDialog
              open={singleContactDelete.show}
              message={`Are you sure, you want to delete contact: ${singleContactDelete.contactName} ?`}
              onClose={() =>
                setSingleContactDelete({
                  id: null,
                  show: false,
                  contactName: "",
                })
              }
              onOk={handleSingleDeleteContacts}
            />
          ) : null}
        </Box>
      </CustomContainer>
    </Layout>
  );
}
