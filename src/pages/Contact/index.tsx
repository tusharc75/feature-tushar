import React, { useContext, useEffect, useState, useReducer } from "react";
import Layout from "../../components/Layout";
import {
  Box,
  Button,
  Menu,
  MenuItem,
  Grid,
  TablePagination
} from "@material-ui/core";
import { useData } from "../../StateProvider/Provider";
import { Link } from "react-router-dom";
import { ExpandMore } from "@material-ui/icons";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import AddIcon from "@material-ui/icons/Add";
import ManageContactDialog from "./ManageContact/index";
import CustomBreadCrumbs from "./../../components/CustomBreadCrumbs";
import SearchBox from "../../components/Helpers/SearchBox";
import CustomContainer from "../../components/CustomContainer";
import MessageDialog from "../../components/Helpers/MessageDialog";
import styles from "../Leads/Header.module.scss";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import ToggleButton from "@material-ui/lab/ToggleButton";
import ToggleButtonGroup from "@material-ui/lab/ToggleButtonGroup";
import { MdContacts } from "react-icons/md";
import axiosInstance from "../../axios/axiosInstance";
import {
  sidebarResource,
  gridPageSizes,
  isObjectEmpty
} from "../../constants/helpers";
import NoDataCell from "../../components/Helpers/NoDataCell";
import { useHistory } from "react-router-dom";
import ImportExportLinks from "../../components/Helpers/ImportExportLinks";
import { Chip } from "@material-ui/core";
import routes from "./../../components/Helpers/Routes";
import { AgGridColumn, AgGridReact } from 'ag-grid-react';
import CustomFloatingFilter from '../../components/AgGridComponents/CustomAgGridFilter'
import { isMobile, isTablet } from "react-device-detect";
import {
  CommonRenderer,
  CreatedByRenderer,
  UpdatedByRenderer,
  CustomLoadingOverlay,
  CommonRendererWithCopy
} from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import CustomGridHeaderOptions from "../../components/AgGridComponents/CustomGridHeaderOptions";
import GridDeleteIcon from "../../components/Helpers/GridDeleteIcon";
import { AgGridHeaderHeight, AgGridRowHeight, AgGridFloatingFiltersHeight } from './../../constants/helpers';

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

function reducer(state, action) {
  switch (action.type) {
    case "loading":
      return {
        ...state,
        loading: action.loading
      }

    case "initialize":
      return {
        ...state,
        dataRows: action.data,
        rowCount: action.count,
        loading: false
      }

    case "selection":
      return {
        ...state,
        selectedRecords: action.selectedRecords,
      }

    case "update":
      return {
        ...state,
        dataRows: action.data,
        loading: false
      }

    case "filter":
      return {
        ...state,
        loading: true,
        filters: action.filters,
        page: 0
      }

    case "sort":
      return {
        ...state,
        sorting: action.sorting,
        loading: true
      }

    case "search":
      return {
        ...state,
        search: action.search,
        loading: true
      }

    case "pageChange":
      return {
        ...state,
        page: action.page
      }

    case "pageSizeChange":
      return {
        ...state,
        limit: action.limit,
        page: 0,
        loading: true
      }

    case "complete":
      return {
        ...state,
        loading: false
      }

    default:
      break;
  }

  return state;
}

const intialState = {
  dataRows: [],
  rowCount: 0,
  loading: false,
  page: 0,
  limit: 25,
  pageSizes: gridPageSizes,
  search: "",
  filters: {},
  sorting: [],
  selectedRecords: []
}

let contactTimeout;
export default function Contact(props) {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const {
    state: { user },
  }: any = useData();
  const {
    contact: { contactApi, contactResource, contactPermission, contactRoute },
    contactBreadcrumb,
    account,
  } = props;
  const [selectedType, setSelectedType] = useState(1);
  const [anchorEl, setAnchorEl] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
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

  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [columnApi, setColumnApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

  // const [showGridFilters, setShowGridFilters] = useState(true)
  const [columns, setColumns] = useState([
    { field: "fullName", headerName: "Name", show: true, disabled: true, cellRenderer: "fullNameRenderer" },
    { field: "relatedLead", headerName: "Related Lead", show: true, cellRenderer: "relatedLeadRenderer" },
    { field: "phone", headerName: "Phone", show: true, cellRenderer: "commonRendererWithCopy" },
    { field: "email", headerName: "Email", show: true, cellRenderer: "commonRendererWithCopy" },
    { field: "createdBy", headerName: "Created By", show: true, cellRenderer: "createdByRenderer" },
    { field: "updatedBy", headerName: "Updated By", show: true, cellRenderer: "updatedByRenderer" },
    { field: "accountName", headerName: "Account Name", show: true, disabled: true, cellRenderer: "accountNameRenderer" }
  ]);
  //  Grid Variables - End

  const handleFilter = (event, newFilter) => {
    if (newFilter !== null) {
      setFilter(newFilter);
      handleContactSelect(ContactTypes.find((d) => d.key === newFilter).value);
    }
  };

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

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;

    if (contactTimeout) {
      clearTimeout(contactTimeout);
    }

    contactTimeout = setTimeout(() => {
      getContacts();
    }, millisec);
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      getContacts();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, selectedType, filters, sorting, accountDetails]);

  const FullNameRenderer = params => <Link className="link" to={`/${contactRoute}/detail/${params.data._id}`}>
    {params.value}
  </Link>

  const RelatedLeadRenderer = params => params.value ?
    <Link className="link" to={`${routes.leadDetail.path}/${params.data.relatedLeadId}`} title={params.value}>
      {params.value}
    </Link> : <NoDataCell />

  const AccountNameRenderer = params => <Link className="link" to={`/${account.accountRoute}/detail/${params.data.accountId}`}>
    {params.value}
  </Link>

  const ActionsRenderer = params => <>
    <GridDeleteIcon
      hasDeletePermission={contactPermissions.isDelete}
      ownerId={params.data.ownerId}
      userId={user?.user?._id}
      onDelete={() => {
        setSingleContactDelete({
          show: true,
          id: params.data._id,
          contactName: params.data.fullName,
        })
      }}
      entity="contact"
    />
  </>

  const frameworkComponents = {
    fullNameRenderer: FullNameRenderer,
    relatedLeadRenderer: RelatedLeadRenderer,
    commonRenderer: CommonRenderer,
    commonRendererWithCopy: CommonRendererWithCopy,
    createdByRenderer: CreatedByRenderer,
    updatedByRenderer: UpdatedByRenderer,
    accountNameRenderer: AccountNameRenderer,
    actionsRenderer: ActionsRenderer,
    customLoadingOverlay: CustomLoadingOverlay,
    customFloatingFilter: CustomFloatingFilter,
    // customLoadingCellRenderer: CustomLoadingCellRenderer,
    // customNoRowsOverlay: CustomNoRowsOverlay
  };

  //  If you want to do something once grid binding done
  const onGridReady = (params) => {
    setGridApi(params.api);
    setColumnApi(params.columnApi)
  }

  const generateColumns = columns.map((column: any, index) => {
    return <AgGridColumn
      key={index}
      field={column.field}
      headerName={column.headerName}
      filter={column.filter ?? "agTextColumnFilter"}
      sortable={column.sortable ?? true}
      cellRenderer={column.cellRenderer ?? null}
    // floatingFilterComponent={column.floatingFilterComponent ?? null}
    // floatingFilterComponentParams={column.floatingFilterComponentParams ?? {
    //   suppressFilterButton: true,
    // }}
    >
    </AgGridColumn>
  })

  const replaceFieldName = (field) => {
    switch (field) {
      case "createdBy":
        return "createdBy.user.concatedName";

      case "updatedBy":
        return "updatedBy.user.concatedName";

      case "relatedLead":
        return "staticData.relatedLead.concatedName";

      default:
        return field;
    }
  }

  const replaceFieldNameForSorting = (field) => {
    const updatedField = replaceFieldName(field);

    if (field !== updatedField) return updatedField;

    switch (field) {
      case "owner":
        return "owner.optionLabel";

      case "accountName":
        return "accountName.optionLabel";

      default:
        return field;
    }
  }

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}&filterContacts=${selectedType}`;

    if (accountDetails.accountId) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify([{ field: replaceFieldName("accountName"), term: accountDetails.accountId }])}`
    }

    if (!isObjectEmpty(filters)) {
      const updatedFilters = [];

      Object.keys(filters).map(field => {
        updatedFilters.push({
          field: replaceFieldName(field),
          term: filters[field].filter
        })
      });
      deepFilter = `${deepFilter}&deepFilter=${JSON.stringify(updatedFilters)}&filterType=and`
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${replaceFieldNameForSorting(sorting[0].colId)}&orderBy=${sorting[0].sort}`
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${search}`;
    }

    return deepFilter;
  };

  const getContacts = () => {

    const queryString = getQueryString();
    dispatch({ type: "loading", loading: true });

    if (gridApi) {
      gridApi.setRowData([]);
      gridApi.showLoadingOverlay();
    }

    axiosInstance()
      .get(`${contactApi}${queryString}`)
      .then(({ data: { data, count } }) => {

        let rows = data.map((u) => {
          const { owner, collaborator, createdBy, updatedBy, accountName, staticData, ...restProperties } = u;

          return {
            ...restProperties,
            id: u._id,

            canDelete: u.owner?.optionValue === user?.user._id,

            accountId: u.accountName?.optionValue,
            accountName: u.accountName?.optionLabel,

            relatedLead: u.staticData && u.staticData.lead && u.staticData.lead.concatedName,
            relatedLeadId: u.staticData && u.staticData.lead && u.staticData.lead._id,

            owner: u.owner?.optionLabel,
            ownerId: u.owner?.optionValue,

            createdBy: u.createdBy?.user?.concatedName,
            createdByDate: u.createdBy?.date,
            updatedBy: u.updatedBy?.user?.concatedName,
            updatedByDate: u.updatedBy?.date
          }
        });

        dispatch({ type: "initialize", data: rows, count: count });

      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        dispatch({ type: "loading", loading: false });
      });
  };

  const handleSingleDeleteContacts = async () => {
    dispatch({ type: "loading", loading: true });
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
        toastConfig.setToastConfig(error);
        dispatch({ type: "loading", loading: false });
      });
    setSingleContactDelete({ id: null, show: false, contactName: "" });
  };

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

  const handleDeleteContact = () => {
    const selectedContacts = selectedRecords.map((m) => {
      return m.id;
    });

    if (selectedContacts.length > 0) {
      dispatch({ type: "loading", loading: true });
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
          dispatch({ type: "loading", loading: false });
          setShowDeleteConfirmBox(false);
        });
    }
  };

  const handleSearch = (e) => {
    dispatch({ type: "search", search: e.target.value });
  };

  const handleContactSelect = (filterValues) => {
    setSelectedType(filterValues);
  };

  return (
    <Layout>
      <Grid container className="headerbox">
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
                    // getContacts();
                  }}
                />
              )}
            </Grid>
            <Grid className={styles.filter_side} item>
              <Box className={styles.filter_side_header} component="div">
                <SearchBox
                  onSearch={handleSearch}
                  searchbox={styles.search_box_input}
                  value={search}
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
                      disabled={selectedRecords.length === 0}
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
                        disabled={selectedRecords.length == 0}
                        onClick={() => {
                          if (selectedRecords.some((d) => d.canDelete == false)) {
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

          <CustomGridHeaderOptions columns={columns} setColumns={setColumns} columnApi={columnApi} />

          <div className="ag-theme-material ag-grid-listing-grid">
            <AgGridReact
              rowData={dataRows}
              onGridReady={onGridReady}
              suppressDragLeaveHidesColumns={true}
              suppressCellSelection={true}
              headerHeight={AgGridHeaderHeight}
              floatingFiltersHeight={AgGridFloatingFiltersHeight}
              rowHeight={AgGridRowHeight}
              frameworkComponents={frameworkComponents}
              defaultColDef={{
                resizable: true,
                floatingFilter: true,
                sortable: true,
                width: 250,
                suppressMenu: true,
                // headerCheckboxSelection: true,
                // checkboxSelection: true,
                floatingFilterComponentParams: { suppressFilterButton: true }
              }}
              onSortChanged={() => {
                dispatch({ type: "sort", sorting: columnApi.getColumnState().filter(d => ["asc", "desc"].some(s => s === d.sort)) });
              }}
              onFilterChanged={(e) => {
                dispatch({ type: "filter", filters: e.api.getFilterModel() });
              }}
              enableCellTextSelection={true}
              ensureDomOrder={false}
              loadingOverlayComponent={'customLoadingOverlay'}
              loadingOverlayComponentParams={{
                loadingMessage: 'Loading...',
              }}
              animateRows={false}
              suppressAnimationFrame={true}
              suppressMaintainUnsortedOrder={true}

              rowBuffer={limit}
              // suppressMaxRenderedRowRestriction={true}

              // loadingCellRenderer={'customLoadingCellRenderer'}
              // loadingCellRendererParams={{
              //   loadingMessage: 'One moment please...',
              // }}

              suppressRowClickSelection={true}
              rowSelection={'multiple'}
              onSelectionChanged={(event: any) => {
                dispatch({ type: "selection", selectedRecords: event.api.getSelectedRows() })
              }}
              immutableData={true}
              getRowNodeId={(data) => {
                return data._id;
              }}
            >
              <AgGridColumn width={70} filter={false} pinned="left" lockPinned={true}
                headerCheckboxSelection={true}
                headerCheckboxSelectionFilteredOnly={true}
                checkboxSelection={true}
                resizable={false} sortable={false}
              >
              </AgGridColumn>

              {generateColumns}

              <AgGridColumn width={100} headerName="Actions"
                pinned={(isMobile || isTablet) ? false : "right"}
                lockPinned={(isMobile || isTablet) ? false : true}
                resizable={false} sortable={false}
                filter={false} cellRenderer="actionsRenderer">
              </AgGridColumn>

            </AgGridReact>
          </div>

          <TablePagination
            component="div"
            count={rowCount}
            page={page}
            onChangePage={(event, newPage) => {
              dispatch({ type: "pageChange", page: newPage })
            }}
            rowsPerPage={limit}
            onChangeRowsPerPage={(event) => {
              dispatch({ type: "pageSizeChange", limit: event.target.value })
            }}
            rowsPerPageOptions={pageSizes}
          />

          {/* <Box component="div" marginY={1}> */}
          {/* <div className="listing-grid">
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
              rowCount={rowCount}
              rowsPerPageOptions={[25, 50, 75]}
              onSortModelChange={handleSortModelChange}
              density="compact"
              filterMode="server"
              onFilterModelChange={onFilterChange}
            />
          </div> */}
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
