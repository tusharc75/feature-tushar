import React, { useState, useEffect, useContext, useReducer, useCallback } from "react";
import {
  Grid,
  IconButton,
  Tooltip,
  Checkbox,
  Chip,
  TablePagination
} from "@material-ui/core";
import { Link } from "react-router-dom";
import DeleteIcon from "@material-ui/icons/Delete";
import { DataGrid } from "@material-ui/data-grid";
import { useData } from "../../StateProvider/Provider";
import Layout from "../../components/Layout";
import axiosInstance from "../../axios/axiosInstance";
import { getSearchQuery, displayDate } from "../../services/util";
import OpportunitiesHeader from "./OpportunitiesHeader";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import MessageDialog from "../../components/Helpers/MessageDialog";
import "./style.scss";
import CustomBreadCrumbs from "./../../components/CustomBreadCrumbs";
import routes from "./../../components/Helpers/Routes";
import CustomRenderCell from "../../components/Helpers/CustomRenderCell";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { GiHiveMind } from "react-icons/gi";
import ManageOpportunityDialog from "./ManageOpportunityDialog/ManageOpportunityDialog";
import {
  gridPageSizes,
  opportunity,
  isObjectEmpty
} from "../../constants/helpers";
import moment from "moment";
import NoDataCell from "../../components/Helpers/NoDataCell";
import CustomDataGridNoDataFound from "../../components/Helpers/DataGridHelpers/CustomDataGridNoDataFound";
import ImportExportLinks from "../../components/Helpers/ImportExportLinks";
import CustomContainer from "../../components/CustomContainer";
import { useHistory } from "react-router-dom";
import CustomDataGridToolbar from "../../components/Helpers/DataGridHelpers/CustomDataGridToolbar";
import { AgGridColumn, AgGridReact } from 'ag-grid-react';
import { AiOutlineLoading } from 'react-icons/ai'
import CustomFloatingFilter from '../../components/AgGridComponents/CustomAgGridFilter'
import ViewWeekIcon from '@material-ui/icons/ViewWeek';
import { isMobile, isTablet } from "react-device-detect";

let opportunityTimeout;
const OpportunityTypes = [
  {
    key: "All Opportunities",
    value: 1,
  },
  {
    key: "My Opportunities",
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

const Opportunities = () => {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, selectedEntity, permissions },
  }: any = useData();
  const [selectedType, setSelectedType] = useState(1);
  const [renderCount, setRenderCount] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState<any>({});
  const [opportunityPermissions, setOpportunityPermissions] = useState({
    isCreate: false,
    isUpdate: false,
    isRead: false,
    isDelete: false,
  });
  const [
    showCreateOpportunityDialog,
    setShowCreateOpportunityDialog,
  ] = useState(false);
  const [
    showDeleteWarningConfirmBox,
    setShowDeleteWarningConfirmBox,
  ] = useState(false);
  const [singleOpportunityDelete, setSingleOpportunityDelete] = useState({
    id: null,
    show: false,
    opportunityName: "",
  });
  const [accountDetails, setAccountDetails] = useState({
    accountId: history.location?.state?.accountId,
    accountName: history.location?.state?.accountName,
    resource: history.location?.state?.resource,
  })

  const { opportunityResource, opportunityApi } = opportunity;

  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [columnApi, setColumnApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

  const [openColumnSelection, setOpenColumnSelection] = useState(false)
  const [openColumnSelectionAnchorEl, setOpenColumnSelectionAnchorEl] = useState<HTMLButtonElement | null>(null)
  const [columns, setColumns] = useState([
    {
      field: "opportunityName", headerName: "Opportunity Name", show: true, disabled: true, cellRenderer: "opportunityNameRenderer",
    },
    { field: "supplierAccountName", headerName: "Supplier Account Name", show: true, cellRenderer: "supplierAccountNameRenderer" },
    { field: "customerAccountName", headerName: "Customer Account Name", show: true, cellRenderer: "customerAccountNameRenderer" },
    { field: "createdBy", headerName: "Created By", show: true, cellRenderer: "createdByRenderer" },
    { field: "updatedBy", headerName: "Updated By", show: true, cellRenderer: "updatedByRenderer" },
    { field: "stage", headerName: "Stage", show: true, cellRenderer: "commonRenderer" },
    { field: "closeDate", headerName: "Close Date", show: true, cellRenderer: "commonRenderer" },
    { field: "owner", headerName: "Opportunity Owner", show: true, cellRenderer: "commonRenderer" },
  ]);
  //  Grid Variables - End

  useEffect(() => {
    if (permissions && permissions[opportunityResource]) {
      setOpportunityPermissions(permissions[opportunityResource]);
    }

    return () => {
      setOpportunityPermissions(null)
    }
  }, [permissions]);

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (opportunityTimeout) {
      clearTimeout(opportunityTimeout);
    }

    opportunityTimeout = setTimeout(() => {
      fetchOpportunities();
    }, millisec);
    // eslint-disable-next-line
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchOpportunities();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, selectedType, filters, sorting]);

  const handleSingleDeleteOpportunity = async () => {
    dispatch({ type: "loading", loading: true });

    axiosInstance()
      .put(`${opportunityApi}/remove?entity=${selectedEntity}`, {
        ids: [singleOpportunityDelete.id],
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });
        fetchOpportunities();
        dispatch({ type: "loading", loading: false });
        setSingleOpportunityDelete({ id: null, show: false, opportunityName: "" });

      })
      .catch((error) => {
        dispatch({ type: "loading", loading: false });
        toastConfig.setToastConfig(error);
      });
  };

  const CommonRenderer = params => <CustomRenderCell value={params.value} />;

  const OpportunityNameRenderer = params => <Link className="link"
    to={`${routes.opportunityDetail.path}/${params.data._id}`} title={params.value ?? ""}>
    {params.value ?? ""}
  </Link>

  const SupplierAccountNameRenderer = params => params.data.supplierAccountName ? (
    <>
      <h5 className="createBy">
        <Link className="link"
          to={`${routes.supplierAccount.path}/detail/${params.data.supplierAccountName}`}
        >
          {params.row.supplierAccountName}
        </Link>
        {
          params.row.allSupplierAccounts.length > 1 &&
          <span className="createdAtTime badge-date">
            {`+${params.row.allSupplierAccounts.length - 1} more..`}
          </span>
        }
      </h5>
    </>
  ) : <NoDataCell />

  const CustomerAccountNameRenderer = params => <Link
    className="link"
    to={`${routes.customerAccount.path}/detail/${params.data.customerAccountName}`}
  >
    {params.data.customerAccountName}
  </Link>

  const CreatedByRenderer = params => params.value ? (
    <h5 className="createBy">
      {params.value}
      <span className="createdAtTime badge-date"
        title={`${params.value} • ${moment(
          params.data.createdByDate.slice(0, 10)
        ).format("MMM Do, YYYY")}`}
      >
        {moment(params.data.createdByDate.slice(0, 10)).format("MMM Do, YYYY")}
      </span>
    </h5>
  ) : (
    <NoDataCell />
  );

  const UpdatedByRenderer = params => params.value ? (
    <h5 className="updateBy">
      {params.value}
      <span className="updatedAtTime badge-date"
        title={`${params.value} • ${moment(
          params.data.updatedByDate.slice(0, 10)
        ).format("MMM Do, YYYY")}`}
      >
        {moment(params.data.updatedByDate.slice(0, 10)).format("MMM Do, YYYY")}
      </span>
    </h5>
  ) : (
    <NoDataCell />
  )

  const ActionsRenderer = params => <>
    {
      opportunityPermissions.isDelete ? (
        params.data.canDelete ? (
          <Tooltip title="Delete">
            <IconButton
              aria-label="Delete"
              onClick={() =>
                setSingleOpportunityDelete({
                  show: true,
                  id: params.fata._id,
                  opportunityName: `${params.data.opportunityName}`,
                })
              }
            >
              <DeleteIcon fontSize="small" color="error" />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip
            className="cursor-stop"
            title="You must be the owner of this opportunity to get the delete functionality"
          >
            <IconButton aria-label="Delete">
              <DeleteIcon fontSize="small" color="error" />
            </IconButton>
          </Tooltip>
        )
      ) : (
        <Tooltip
          className="cursor-stop"
          title="You do not have permission to delete opportunity"
        >
          <IconButton aria-label="Delete">
            <DeleteIcon fontSize="small" color="error" />
          </IconButton>
        </Tooltip>
      )
    }
  </>

  const CustomLoadingOverlay = (params) => <div
    className="ag-custom-loading-cell"
    style={{ paddingLeft: '10px', lineHeight: '25px' }}
  >
    <AiOutlineLoading />
    <span className="pl-2 font-size-3">{params.loadingMessage}</span>
  </div>

  const CustomLoadingCellRenderer = (params) => <div
    className="ag-custom-loading-cell p-3"
  >
    <AiOutlineLoading />
    <h4>{params.loadingMessage}</h4>
  </div>

  const frameworkComponents = {
    opportunityNameRenderer: OpportunityNameRenderer,
    supplierAccountNameRenderer: SupplierAccountNameRenderer,
    customerAccountNameRenderer: CustomerAccountNameRenderer,
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

      case "customerAccountName":
        return "customerAccountName.optionLabel";

      case "supplierAccountName":
        return "supplierAccountName.optionLabel";

      default:
        return field;
    }
  }

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}&filterLeads=${selectedType}`;

    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`
    }

    if (accountDetails.accountId) {
      if (accountDetails.resource === "customerAccountName") {
        deepFilter = `${deepFilter}&filterById=${JSON.stringify([{ field: accountDetails.resource, term: accountDetails.accountId }])}`
        // searchParams["filterById"] = JSON.stringify([{ field: accountDetails.resource, term: accountDetails.accountId }]);
      } else if (accountDetails.resource === "supplierAccountName") {
        deepFilter = `${deepFilter}&filterById=${JSON.stringify([{ field: accountDetails.resource, term: { $in: [accountDetails.accountId] } }])}`
        // searchParams["filterById"] = JSON.stringify([{ field: accountDetails.resource, term: { $in: [accountDetails.accountId] } }]);
      }
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

  const fetchOpportunities = async () => {
    if (selectedEntity) {
      const queryString = getQueryString();
      dispatch({ type: "loading", loading: true });

      axiosInstance()
        .get(`${opportunityApi}${queryString}`)
        .then(({ data: { data, count } }) => {

          let rows = data.map((u) => {
            const { owner, collaborator, createdBy, updatedBy, supplierAccountName, ...restProperties } = u;

            let res = {
              ...restProperties,
              id: u._id,

              owner: u.owner?.optionLabel,
              ownerId: u.owner?.optionValue,

              canDelete: u.owner?.optionValue === user?.user._id,
              stage: u.stage,
              closeDate: u?.closeDate ? displayDate(u.closeDate) : "",

              supplierAccountName: u.supplierAccountName.length > 0 ? u.supplierAccountName[0].optionLabel : "",
              supplierAccountId: u.supplierAccountName.length > 0 ? u.supplierAccountName[0].optionValue : "",

              allSupplierAccounts: supplierAccountName,

              customerAccountName: u.customerAccountName?.optionLabel,
              customerAccountId: u.customerAccountName?.optionValue,
            };
            return res;
          });

          dispatch({ type: "initialize", data: rows, count: count });

          if (gridApi && rows.length > 0) {
            gridApi.hideOverlay();
          }
        })
        .catch((error) => {
          dispatch({ type: "loading", loading: false });
          toastConfig.setToastConfig(error);
        });
    }
  }

  const handleSearch = (e) => {
    dispatch({ type: "search", search: e.target.value });
  };

  const handleOpportunityTypeChange = (filterValues) => {
    setSelectedType(filterValues);
  };

  const onSuccess = () => {
    setShowCreateOpportunityDialog(false);
    fetchOpportunities();
  };

  const showConfirmBox = (row) => {
    if (row) {
      setIsConformDialogVisible(true);
      if (row && row._id) {
        setDeleteRecord(row);
      }
    } else {
      if (selectedRecords.find((d) => d.canDelete === false)) {
        setShowDeleteWarningConfirmBox(true);
      } else {
        setIsConformDialogVisible(true);
      }
    }
  };

  const clickCreateNew = () => {
    setShowCreateOpportunityDialog(true);
  };

  const handleDeleteOpportunity = async () => {
    setDeleteLoading(true);
    let recordsToDelete = [];
    if (deleteRecord?._id) {
      recordsToDelete.push(deleteRecord?._id);
    } else {
      recordsToDelete = selectedRecords.map((o) => o._id);
    }
    if (recordsToDelete.length > 0) {
      axiosInstance()
        .put(`${opportunityApi}/remove?entity=${selectedEntity}`, {
          ids: recordsToDelete,
        })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
          if (deleteRecord) setDeleteRecord({});
          fetchOpportunities();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
        });
    }
  };

  return (
    <>
      <Layout>
        <Grid container className="headerbox">
          <Grid item md={4} sm={11} xs={10}>
            <CustomBreadCrumbs routes={[routes.opportunity]} />
          </Grid>
          <Grid
            item
            md={8}
            sm={1}
            xs={2}>
            <Grid container direction="row">
              <Grid item xs={12} sm={12}>
                <Grid container justify="flex-end">
                  <ImportExportLinks
                    module="opportunities"
                    api={opportunityApi}
                    onSuccessfulImport={(isImportedSuccessfully) => {
                      if (isImportedSuccessfully) { fetchOpportunities(); }
                    }}
                  />
                </Grid>
              </Grid>
            </Grid>
          </Grid>
        </Grid>

        {/* Tables Begins Here */}
        <CustomContainer>
          <div className="header-panel">
            <OpportunitiesHeader
              selectedType={selectedType}
              onTypeChange={handleOpportunityTypeChange}
              options={OpportunityTypes}
              onSearch={handleSearch}
              search={search}
              opportunityPermissions={opportunityPermissions}
              onCreate={clickCreateNew}
              showConfirmBox={showConfirmBox}
              canDelete={selectedRecords.length === 0}
              icon={<GiHiveMind className="headerLogo" />}
              heading="Opportunities"
            >
              {
                accountDetails.accountId && <Chip
                  className="ml-3"
                  color="primary"
                  label={`Account: ${accountDetails.accountName}`}
                  onDelete={() => {
                    setAccountDetails({ accountId: null, accountName: null, resource: null });
                  }}
                />
              }
            </OpportunitiesHeader>
          </div>


          <div className="ag-theme-material ag-grid-listing-grid">
            <AgGridReact
              rowData={dataRows}
              onGridReady={onGridReady}
              suppressDragLeaveHidesColumns={true}
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

              <AgGridColumn width={150} headerName="Actions"
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
          {isConfirmDialogVisible ? (
            <ConfirmationDialog
              open={isConfirmDialogVisible}
              message={`Are you sure, you want to delete ${deleteRecord?.opportunityName ? "Opportunity" : "Opportunities"
                }   ${deleteRecord.opportunityName || ""}?`}
              onClose={() => {
                if (deleteRecord) setDeleteRecord({});
                setIsConformDialogVisible(false);
              }}
              okBtnLoading={deleteLoading}
              onOk={handleDeleteOpportunity}
            />
          ) : null}
          {/* {
            showCreateOpportunityDialog && <ManageOpportunityMain
              open={showCreateOpportunityDialog}
              onClose={() => setShowCreateOpportunityDialog(false)}
              onSuccess={() => {
                setShowCreateOpportunityDialog(false);
                fetchOpportunities()
              }}
            />
          } */}
          {singleOpportunityDelete.show ? (
            <ConfirmationDialog
              open={singleOpportunityDelete.show}
              message={`Are you sure, you want to delete contact: ${singleOpportunityDelete.opportunityName} ?`}
              onClose={() =>
                setSingleOpportunityDelete({
                  id: null,
                  show: false,
                  opportunityName: "",
                })
              }
              onOk={handleSingleDeleteOpportunity}
            />
          ) : null}
        </CustomContainer>
      </Layout>

      {showCreateOpportunityDialog && (
        <ManageOpportunityDialog
          open={showCreateOpportunityDialog}
          onSuccess={onSuccess}
          onClose={() => {
            setShowCreateOpportunityDialog(false);
          }}
          isNew={true}
          dataToUpdate={null}
          resource={null}
          isRedirectTodetailPage={true}
        />
      )}
    </>
  );
};

export default Opportunities;
