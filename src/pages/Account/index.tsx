import React, { useContext, useEffect, useState, useReducer } from "react";
import Layout from "../../components/Layout";
import { useData } from "../../StateProvider/Provider";
import {
  Button,
  Menu,
  MenuItem,
  Tooltip,
  IconButton,
  Grid,
  Chip,
  TablePagination
} from "@material-ui/core";
import { Link } from "react-router-dom";
import { ExpandMore, AddOutlined } from "@material-ui/icons";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import MessageDialog from "../../components/Helpers/MessageDialog";
import SearchBox from "../../components/Helpers/SearchBox";
import FileCopyIcon from "@material-ui/icons/FileCopy";
import ManageAccountDialog from "./ManageAccount/index";
import CustomBreadCrumbs from "./../../components/CustomBreadCrumbs";
import axiosInstance from "../../axios/axiosInstance";
import CustomContainer from "../../components/CustomContainer";
import CancelIcon from "@material-ui/icons/Cancel";
import accountClass from "./account.module.scss";
import CustomHeader from "../../components/Helpers/CustomHeader";
import CustomRenderCell from "../../components/Helpers/CustomRenderCell";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { FcApproval } from "react-icons/fc";
import { MdAccountCircle } from "react-icons/md";
import { sidebarResource } from "../../constants/helpers";
import NoDataCell from "../../components/Helpers/NoDataCell";
import ImportExportLinks from "../../components/Helpers/ImportExportLinks";
import routes from "./../../components/Helpers/Routes";
import {
  gridPageSizes,
  isObjectEmpty
} from "../../constants/helpers";
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

const AccTypes = [
  {
    key: "All Accounts",
    value: 1,
  },
  {
    key: "My Accounts",
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

let accountTimeout;
export default function Account(props) {
  const toastConfig = useContext(CustomToastContext);

  const {
    account: { accountApi, accountResource, accountRoute },
    accountBreadcrumb,
  } = props;
  const {
    state: { user, permissions },
  }: any = useData();
  const [accountData, setAccountData] = useState([]);
  const [cloneId, setCloneId] = useState("");
  const [anchorEl, setAnchorEl] = useState(null);
  const [renderCount, setRenderCount] = useState(0);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [
    showDeleteWarningConfirmBox,
    setShowDeleteWarningConfirmBox,
  ] = useState(false);
  const [isAccDialogVisible, setIsAccDialogVisible] = useState(false);
  const [selectedType, setselectedType] = useState(1);

  const [singleAccountDelete, setSingleAccountDelete] = useState({
    id: null,
    show: false,
    accountName: "",
  });
  const [
    singleApproveDisapproveAccount,
    setSingleApproveDisapproveAccount,
  ] = useState<any>({
    show: false,
    approved: false,
    id: null,
    accountName: "",
  });
  const [
    multipleApproveDisapproveAccount,
    setMultipleApproveDisapproveAccount,
  ] = useState<any>({ show: false, approved: false, selectedRecords: 0 });

  const [accountPermissions, setAccountPermissions] = useState({
    isCreate: false,
    isRead: false,
    isUpdate: false,
    isDelete: false,
    approveAccount: false,
  });

  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [columnApi, setColumnApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

  // const [showGridFilters, setShowGridFilters] = useState(true)
  const [columns, setColumns] = useState([
    { field: "accountName", headerName: "Account Name", show: true, disabled: true, cellRenderer: "accountNameRenderer" },
    { field: "relatedLead", headerName: "Related Lead", show: true, cellRenderer: "relatedLeadRenderer" },
    { field: "typeOfAccount", headerName: "Type", show: true, cellRenderer: "commonRenderer" },
    { field: "industry", headerName: "Industry", show: true, cellRenderer: "commonRenderer" },
    { field: "createdBy", headerName: "Created By", show: true, cellRenderer: "createdByRenderer" },
    { field: "updatedBy", headerName: "Updated By", show: true, cellRenderer: "updatedByRenderer" },
    { field: "parentAccount", headerName: "Parent Account", show: true, cellRenderer: "parentAccountRenderer" },
    { field: "masterAccount", headerName: "Master Account", show: true, cellRenderer: "masterAccountRenderer", filter: false, sortable: false },
    { field: "phone", headerName: "Phone", show: true, cellRenderer: "commonRendererWithCopy" },
  ]);
  //  Grid Variables - End

  useEffect(() => {
    if (permissions) {
      setAccountPermissions(permissions[accountResource]);
    }
  }, [permissions]);

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;

    if (accountTimeout) {
      clearTimeout(accountTimeout);
    }

    accountTimeout = setTimeout(() => {
      fetchAccounts();
    }, millisec);
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchAccounts();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, selectedType, filters, sorting]);

  const AccountNameRenderer = params => <span className="d-flex gap-2 align-items-center">
    <Link className="link" to={`/${accountRoute}/detail/${params.data._id}`}>
      <CustomRenderCell value={params.value} />
    </Link>
    {
      params.data.approved && <FcApproval title="Approved" size={20} />
    }
  </span>

  const RelatedLeadRenderer = params => params.value ?
    <Link className="link" to={`${routes.leadDetail.path}/${params.data.relatedLeadId}`} title={params.value}>
      {params.value}
    </Link> : <NoDataCell />

  const ParentAccountRenderer = params => params.value ?
    <Link className="link" to={`/${accountRoute}/detail/${params.data.parentAccountId}`} title={params.value}>
      <CustomRenderCell value={params.value} />
    </Link> : <NoDataCell />

  const MasterAccountRenderer = params => params.value ?
    <Link className="link" to={`/${accountRoute}/detail/${params.data.masterAccountId}`} title={params.value}>
      <CustomRenderCell value={params.value} />
    </Link> : <NoDataCell />

  const ActionsRenderer = params => <>
    {accountPermissions.isCreate ? (
      <Tooltip title="Clone">
        <IconButton
          aria-label="Clone"
          onClick={() => {
            cloneAccount(params.data._id);
          }}
        >
          <FileCopyIcon fontSize="small" color="primary" />
        </IconButton>
      </Tooltip>
    ) : (
      <Tooltip
        className="cursor-stop"
        title="You do not have permission to clone/create an account"
      >
        <IconButton aria-label="Clone">
          <FileCopyIcon fontSize="small" />
        </IconButton>
      </Tooltip>
    )}

    {
      accountPermissions.isUpdate && accountPermissions.approveAccount && params.data.approved ? (
        <Tooltip title="Disapprove">
          <IconButton
            aria-label="Disapprove"
            onClick={() => {
              setSingleApproveDisapproveAccount({
                show: true,
                approved: false,
                id: params.data._id,
                accountName: params.data.accountName,
              });
            }}
          >
            <CancelIcon fontSize="inherit" color="error" />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title="Approve">
          <IconButton
            aria-label="Approve"
            onClick={() => {
              setSingleApproveDisapproveAccount({
                show: true,
                approved: true,
                id: params.data._id,
                accountName: params.data.accountName,
              });
            }}
          >
            <FcApproval />
          </IconButton>
        </Tooltip>
      )
    }

    <GridDeleteIcon
      hasDeletePermission={accountPermissions.isDelete}
      ownerId={params.data.ownerId}
      userId={user?.user?._id}
      onDelete={() => {
        setSingleAccountDelete({
          show: true,
          id: params.data._id,
          accountName: params.data.accountName,
        });
      }}
      entity="account"
    />
  </>

  const frameworkComponents = {
    accountNameRenderer: AccountNameRenderer,
    relatedLeadRenderer: RelatedLeadRenderer,
    commonRenderer: CommonRenderer,
    commonRendererWithCopy: CommonRendererWithCopy,
    parentAccountRenderer: ParentAccountRenderer,
    masterAccountRenderer: MasterAccountRenderer,
    createdByRenderer: CreatedByRenderer,
    updatedByRenderer: UpdatedByRenderer,
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

      case "parentAccount":
        return "parentAccount.optionLabel";

      default:
        return field;
    }
  }

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}&filterAccounts=${selectedType}`;

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

  const fetchAccounts = async () => {
    const queryString = getQueryString();
    dispatch({ type: "loading", loading: true });

    if (gridApi) {
      gridApi.setRowData([]);
      gridApi.showLoadingOverlay();
    }

    axiosInstance()
      .get(`${accountApi}${queryString}`)
      .then(({ data: { data, count } }) => {

        let rows = data.map((u) => {
          const { owner, collaborator, createdBy, updatedBy, staticData, parentAccount, parentHierarchy, ...restProperties } = u;

          let res = {
            ...restProperties,
            id: u._id,

            owner: u.owner?.optionLabel,
            ownerId: u.owner?.optionValue,
            canDelete: u.owner?.optionValue === user?.user._id,

            isAllowedToUpdate: [...u.collaborator ?? [], u.owner].some(
              (d) => d.optionValue == user?.user?._id
            ),
            relatedLead: u.staticData && u.staticData.lead && u.staticData.lead.concatedName,
            relatedLeadId: u.staticData && u.staticData.lead && u.staticData.lead._id,

            approved: u.staticData?.approved,

            parentAccount: parentAccount?.optionLabel,
            parentAccountId: parentAccount?.optionValue,

            masterAccount: u.parentHierarchy.length > 0 ? u.parentHierarchy.find(d => d.parentAccount === "")?.accountName : "",
            masterAccountId: u.parentHierarchy.length > 0 ? u.parentHierarchy.find(d => d.parentAccount === "")?._id : "",

            createdBy: u.createdBy?.user?.concatedName,
            createdByDate: u.createdBy?.date,
            updatedBy: u.updatedBy?.user?.concatedName,
            updatedByDate: u.updatedBy?.date,
          };
          return res;
        });

        dispatch({ type: "initialize", data: rows, count: count });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        dispatch({ type: "loading", loading: false });
      });
  }

  const cloneAccount = async (accountId) => {
    setCloneId(accountId);
    setIsAccDialogVisible(true);
  };

  const handleSearch = (e) => {
    dispatch({ type: "search", search: e.target.value });
  };

  // ****** ACTIONS BUTTON STUFF *********
  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const clickCreateNew = () => {
    setIsAccDialogVisible(true);
  };

  const handleDeleteAccounts = async () => {
    let selectedAccounts = selectedRecords.map((cr) => cr._id);

    if (selectedAccounts.length > 0) {
      axiosInstance()
        .put(`/${accountApi}/remove`, {
          ids: [...selectedAccounts],
        }).then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
          setShowDeleteConfirmBox(false);
          fetchAccounts();
        })
        .catch((error) => {
          setShowDeleteConfirmBox(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleSingleDeleteAccounts = async () => {
    axiosInstance()
      .put(`/${accountApi}/remove`, { ids: [singleAccountDelete.id] })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });
        fetchAccounts();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
      .finally(() => {
        setShowDeleteConfirmBox(false);
      });
    setSingleAccountDelete({ id: null, show: false, accountName: "" });
  };

  const handleSingleApproveDisapproveAccount = () => {
    axiosInstance()
      .post(`/${accountApi}/approve`, {
        ids: [singleApproveDisapproveAccount.id],
        approved: singleApproveDisapproveAccount.approved,
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });
        setSingleApproveDisapproveAccount({
          show: false,
          approved: false,
          id: null,
          accountName: "",
        });
        fetchAccounts();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setSingleApproveDisapproveAccount({
          show: false,
          approved: false,
          id: null,
          accountName: "",
        });
      });
  };

  const handleDialogClose = (params) => {
    if (params && params.fetch) {
      fetchAccounts();
    }
    setIsAccDialogVisible(false);
    if (cloneId) {
      setCloneId("");
    }
  };

  const handleAccountSelect = (filterValues) => {
    setselectedType(filterValues);
  };

  const approveDisapproveAccounts = () => {
    const selectedAccountIds = dataRows
      .filter((d) => d.approved === !multipleApproveDisapproveAccount.approved)
      .map((m) => m._id);

    axiosInstance()
      .post(`/${accountApi}/approve`, {
        ids: selectedAccountIds,
        approved: multipleApproveDisapproveAccount.approved,
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });
        setMultipleApproveDisapproveAccount({
          show: false,
          approved: false,
          selectedRecords: 0,
        });
        fetchAccounts();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setMultipleApproveDisapproveAccount({
          show: false,
          approved: false,
          selectedRecords: 0,
        });
      });
  };

  return (
    <>
      <Layout>
        <Grid container className="headerbox">
          <Grid item md={4} sm={11} xs={10}>
            <CustomBreadCrumbs routes={[{ title: accountBreadcrumb.title }]} />
          </Grid>
          <Grid item md={8} sm={1} xs={2}>
            <ImportExportLinks
              module="account(s)"
              api={accountApi}
              onSuccessfulImport={(isImportedSuccessfully) => {
                if (isImportedSuccessfully) {
                  fetchAccounts();
                }
              }}
            />
          </Grid>
        </Grid>
        <CustomContainer>
          <div className={`${accountClass["account_header_inner_container"]}`}>
            <CustomHeader
              total={rowCount}
              heading={sidebarResource[accountResource]}
              selectedType={selectedType}
              onTypeChange={handleAccountSelect}
              options={AccTypes}
              secondHeading="Account"
              icon={<MdAccountCircle className="headerLogo" />}
            >
              <div
                className={`${accountClass.account_header} ${accountClass["account_header-mobile"]}`}
              >
                <SearchBox
                  onSearch={handleSearch}
                  searchbox="account_header_search_bar"
                  width="300px"
                  value={search}
                />
                <div
                  className={`${accountClass.account_header_add_btn_action_btn_group}`}
                >
                  {accountPermissions.isCreate && (
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      className={`${accountClass.account_header_add_btn}`}
                      onClick={clickCreateNew}
                      startIcon={<AddOutlined />}
                    >
                      Add
                    </Button>
                  )}

                  {(accountPermissions.isDelete ||
                    accountPermissions.approveAccount) && (
                      <Button
                        disabled={selectedRecords.length === 0}
                        variant="outlined"
                        color="default"
                        size="small"
                        className={`${accountClass.account_header_action_btn}`}
                        onClick={openActions}
                        aria-controls="action-menu"
                      >
                        Actions <ExpandMore />
                      </Button>
                    )}
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
                    {accountPermissions.isUpdate &&
                      accountPermissions.approveAccount && (
                        <MenuItem
                          disabled={selectedRecords.filter((d) => !d.approved).length === 0}
                          onClick={() => {
                            closeActions();
                            setMultipleApproveDisapproveAccount({
                              show: true,
                              approved: true,
                              selectedRecords: selectedRecords.filter((d) => !d.approved).length,
                            });
                          }}
                        >
                          Approve Accounts &nbsp;{" "}
                          <Chip
                            size="small"
                            label={selectedRecords.filter((d) => !d.approved).length}
                          />
                        </MenuItem>
                      )}
                    {accountPermissions.isUpdate &&
                      accountPermissions.approveAccount && (
                        <MenuItem
                          disabled={selectedRecords.filter((d) => d.approved).length === 0}
                          onClick={() => {
                            closeActions();
                            setMultipleApproveDisapproveAccount({
                              show: true,
                              approved: false,
                              selectedRecords: selectedRecords.filter((d) => d.approved).length,
                            });
                          }}
                        >
                          Disapprove Accounts &nbsp;{" "}
                          <Chip
                            size="small"
                            label={selectedRecords.filter((d) => d.approved).length}
                          />
                        </MenuItem>
                      )}
                    {accountPermissions.isDelete && (
                      <MenuItem
                        disabled={selectedRecords.length === 0}
                        onClick={() => {
                          if (selectedRecords.some((d) => d.canDelete === false)) {
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
                    )}
                  </Menu>
                </div>
              </div>
            </CustomHeader>
          </div>

          <CustomGridHeaderOptions columns={columns} setColumns={setColumns} columnApi={columnApi} />

          <div className="ag-theme-material ag-grid-listing-grid">
            <AgGridReact
              rowData={dataRows}
              onGridReady={onGridReady}
              suppressDragLeaveHidesColumns={true}
              suppressCellSelection={true}
              rowHeight={40}
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
              onSortChanged={(e) => {
                dispatch({ type: "sort", sorting: e.api.getSortModel() })
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

              <AgGridColumn width={200} headerName="Actions"
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

          {/* <div className="listing-grid">
            <DataGrid
              components={{
                Toolbar: CustomDataGridToolbar,
                NoRowsOverlay: CustomDataGridNoDataFound,
                // LoadingOverlay: CustomLoadingOverlay
              }}
              scrollbarSize={20}
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
              // onRowClick={handleRowClick}
              density="compact"
              onFilterModelChange={onFilterChange}
              filterMode="server"
            />
          </div> */}


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
              message={`Are you sure, you want to delete selected account(s) ?`}
              onClose={() => setShowDeleteConfirmBox(false)}
              onOk={handleDeleteAccounts}
            />
          ) : null}
          {singleAccountDelete.show ? (
            <ConfirmationDialog
              open={singleAccountDelete.show}
              message={`Are you sure, you want to delete account: ${singleAccountDelete.accountName} ? `}
              onClose={() =>
                setSingleAccountDelete({
                  id: null,
                  show: false,
                  accountName: "",
                })
              }
              onOk={handleSingleDeleteAccounts}
            />
          ) : null}

          {singleApproveDisapproveAccount.show ? (
            <ConfirmationDialog
              open={singleApproveDisapproveAccount.show}
              message={`Are you sure, you want to ${singleApproveDisapproveAccount.approved
                ? "approve"
                : "disapprove"
                } account: ${singleApproveDisapproveAccount.accountName} ? `}
              onClose={() =>
                setSingleApproveDisapproveAccount({
                  id: null,
                  show: false,
                  accountName: "",
                })
              }
              onOk={handleSingleApproveDisapproveAccount}
            />
          ) : null}

          {multipleApproveDisapproveAccount.show ? (
            <ConfirmationDialog
              open={multipleApproveDisapproveAccount.show}
              message={`Are you sure, you want to ${multipleApproveDisapproveAccount.approved
                ? "approve"
                : "disapprove"
                } selected ${multipleApproveDisapproveAccount.selectedRecords
                } account(s) ? `}
              onClose={() =>
                setMultipleApproveDisapproveAccount({
                  show: false,
                  approved: false,
                  selectedRecords: 0,
                })
              }
              onOk={approveDisapproveAccounts}
            />
          ) : null}
          {isAccDialogVisible ? (
            <ManageAccountDialog
              open={isAccDialogVisible}
              onClose={handleDialogClose}
              id={cloneId}
              accountResource={accountResource}
              accountApi={accountApi}
            />
          ) : null}
        </CustomContainer>
      </Layout>
    </>
  );
}
