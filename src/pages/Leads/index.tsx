import React, { useState, useEffect, useContext, useReducer } from "react";
import {
  Grid,
  Tooltip,
  IconButton,
  Checkbox,
  Button,
  TablePagination
} from "@material-ui/core";
import { Link, useHistory } from "react-router-dom";
import CustomBreadCrumbs from "./../../components/CustomBreadCrumbs";
import routes from "./../../components/Helpers/Routes";
import Layout from "../../components/Layout";
import LeadsHeader from "./LeadsHeader";
import axiosInstance from "../../axios/axiosInstance";
import { useData } from "../../StateProvider/Provider";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import MessageDialog from "../../components/Helpers/MessageDialog";
import { leadDetailPage } from "../../routes/Lead";

import CustomRenderCell from "../../components/Helpers/CustomRenderCell";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import {
  gridPageSizes,
  leadProcessFieldName,
} from "../../constants/helpers";
import ManageLeadDialog from "./ManageLeadDialog/ManageLeadDialog";
import { HiUserGroup } from "react-icons/hi";
import { lead } from "../../constants/helpers";
import moment from "moment";
import NoDataCell from "../../components/Helpers/NoDataCell";
import GridDeleteIcon from "../../components/Helpers/GridDeleteIcon";
import { SiConvertio } from "react-icons/si";
import ImportExportLinks from "../../components/Helpers/ImportExportLinks";
import CustomContainer from "../../components/CustomContainer";
import { AgGridColumn, AgGridReact } from 'ag-grid-react';
import { AiOutlineLoading } from 'react-icons/ai'
import "./style.scss";

const LeadTypes = [
  {
    key: "All Leads",
    value: 1,
  },
  {
    key: "My Leads",
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
  filters: [],
  sorting: [],
  selectedRecords: []
}

const columns = [
  { field: "name", headerName: "Name", filter: "agTextColumnFilter", cellRenderer: "nameRenderer" },
  { field: "relatedOpportunity", headerName: "Related Opportunity", filter: "agTextColumnFilter", cellRenderer: "relatedOpportunityRenderer" },
  { field: "title", headerName: "Title", filter: "agTextColumnFilter", cellRenderer: "commonRenderer" },
  { field: "company", headerName: "Company", filter: "agTextColumnFilter", cellRenderer: "commonRenderer" },
  { field: "createdBy", headerName: "Created By", filter: "agTextColumnFilter", cellRenderer: "createdByRenderer" },
  { field: "updatedBy", headerName: "Updated By", filter: "agTextColumnFilter", cellRenderer: "updatedByRenderer" },
  { field: "phone", headerName: "Phone", filter: "agTextColumnFilter", cellRenderer: "commonRenderer" },
  { field: "mobile", headerName: "Mobile", filter: "agTextColumnFilter", cellRenderer: "commonRenderer" },
  { field: "email", headerName: "Email", filter: "agTextColumnFilter", cellRenderer: "commonRenderer" },
  { field: "owner", headerName: "Owner Alies", filter: "agTextColumnFilter", cellRenderer: "optionLabelRenderer" },
];


let leadTimeout;
const Leads = () => {
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);

  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;
  const [gridApi, setGridApi] = useState(null);

  const {
    state: { user, selectedEntity, permissions },
  }: any = useData();
  // const [searchVal, setSearchVal] = useState("");
  // const [query, setQuery] = useState({ page: 0, limit: 25 });
  const [selectedType, setSelectedType] = useState(1);
  const [isOpen, setIsOpen] = useState(false);
  const [checkAllLeads, setCheckAllLeads] = useState(false);
  // const [dataRows, setDataRows] = useState([]);
  // const [rowCount, setRowCount] = useState(0);
  const [renderCount, setRenderCount] = useState(0);
  // const [loading, setLoading] = useState(false);
  const [okButtonLoading, setOkButtonLoading] = useState(false);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState({ id: null, name: null });
  const [leadsPermissions, setLeadsPermissions] = useState({
    isCreate: false,
    isUpdate: false,
    isRead: false,
    isDelete: false,
  });
  const [
    showDeleteWarningConfirmBox,
    setShowDeleteWarningConfirmBox,
  ] = useState(false);

  const dummyData = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(() => {
    let object: any = {};

    columns.forEach((column) => {
      object[column.field] = "Loading..."
    })

    return object;
  })

  const [
    convertLeadToOpportunityConfirmationDialog,
    setConvertLeadToOpportunityConfirmationDialog,
  ] = useState({ open: false, id: null, leadName: null, message: null });
  const hasPermissionToConvertInOpportunity =
    user?.user?.permissions?.convertLeadToOpportunity;

  const { leadResource, leadApi } = lead;

  useEffect(() => {
    if (permissions && permissions[leadResource]) {
      setLeadsPermissions(permissions[leadResource]);
    }
  }, [permissions]);

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (leadTimeout) {
      clearTimeout(leadTimeout);
    }

    leadTimeout = setTimeout(() => {
      fetchLeads();
    }, millisec);
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchLeads();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, selectedType, filters, sorting]);

  const CommonRenderer = params => <CustomRenderCell value={params?.value} />;

  const OptionLabelRenderer = params => <CustomRenderCell value={params.value?.optionLabel ?? ""} />;

  const NameRenderer = params => <Link className="link"
    to={`${leadDetailPage.path}/${params.data._id}`} >
    {params?.value ?? ""}
  </Link>;

  const RelatedOpportunityRenderer = params => <>
    {
      params.value ?
        <Link className="link" to={`${routes.opportunityDetail.path}/${params.data?._id}`} title={params.data?.opportunityName}>
          {params.data?.opportunityName}
        </Link>
        : <NoDataCell />
    }
  </>

  const CreatedByRenderer = params => params.value && params.value.user ? (
    <h5 className="createBy">
      {params.value.user.firstName}
      <span
        className="createdAtTime badge-date"
        title={`${params.value.user.firstName} • ${moment(
          params?.value?.date?.slice(0, 10)
        ).format("MMM Do, YYYY")}`}
      >
        {moment(params?.value?.date?.slice(0, 10)).format("MMM Do, YYYY")}
      </span>
    </h5>
  ) : (
    <NoDataCell />
  );

  const UpdatedByRenderer = params => params.value && params.value.user ? (
    <h5 className="updateBy">
      {params.value.user.firstName}
      <span title={params.value.date} className="updatedAtTime badge-date">
        {moment(params.value.date.slice(0, 10)).format("MMM Do, YYYY")}
      </span>
    </h5>
  ) : (
    <NoDataCell />
  )

  const ActionsRenderer = params => <>
    {
      hasPermissionToConvertInOpportunity &&
      generateLeadToOpportunityButton(params.data)
    }

    <GridDeleteIcon
      hasDeletePermission={leadsPermissions.isDelete}
      ownerId={params.data.owner.optionValue}
      userId={user?.user?._id}
      onDelete={() => showConfirmBox(params.data)}
      entity="lead"
    />
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
    nameRenderer: NameRenderer,
    relatedOpportunityRenderer: RelatedOpportunityRenderer,
    commonRenderer: CommonRenderer,
    createdByRenderer: CreatedByRenderer,
    updatedByRenderer: UpdatedByRenderer,
    optionLabelRenderer: OptionLabelRenderer,
    actionsRenderer: ActionsRenderer,
    customLoadingOverlay: CustomLoadingOverlay,
    // customLoadingCellRenderer: CustomLoadingCellRenderer,
    // customNoRowsOverlay: CustomNoRowsOverlay
  };

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}&filterLeads=${selectedType}`;

    if (filters.length > 0) {
      const updatedFilters = [];

      filters.map(d => {
        let columnName = d.columnName;

        if (d.columnName == 'createdBy') {
          columnName = "createdBy.user"
        } else if (d.columnName == 'updatedBy') {
          columnName = "updatedBy.user"
        }

        updatedFilters.push({
          field: columnName,
          term: d.value
        })
      });
      deepFilter = `${deepFilter}&deepFilter=${JSON.stringify(updatedFilters)}&filterType=and`
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${search}`;
    }

    return deepFilter;
  };


  const fetchLeads = () => {
    if (selectedEntity) {
      const queryString = getQueryString();
      dispatch({ type: "loading", loading: true });

      if (gridApi) {
        gridApi.showLoadingOverlay();
      }

      axiosInstance()
        .get(`${leadApi}${queryString}`)
        .then(({ data: { data, count } }) => {

          let rows = data.map((u) => {
            let name = [u.firstName, u.middleName, u.lastName]
              .filter((d) => d)
              .join(" ");

            let res = {
              ...u,
              id: u._id,
              name: name,
              owner: u.owner,
              isAllowedToUpdate: [...u.collaborator ?? [], u.owner].some(
                (d) => d.optionValue == user?.user?._id
              ),
              relatedOpportunity: u.staticData?.convertedToOpportunity && u.staticData?.opportunity
            };
            return res;
          });

          dispatch({ type: "initialize", data: rows, count: count });

          if (gridApi) {
            //   gridApi.setRowData(rows);
            setTimeout(() => {
              gridApi.hideOverlay();
            }, 1500);
            // } else {
            //   dispatch({ type: "initialize", data: rows, count: count });

            // dispatch({ type: "loading", loading: false })
          }

          setCheckAllLeads(false);
        }).catch((error) => {
          toastConfig.setToastConfig(error);
          if (gridApi) {
            gridApi.hideOverlay();
          }
          // dispatch({ type: "loading", loading: false })
        });
    }
  };

  const handleSearch = (e) => {
    dispatch({ type: "search", search: e.target.value });
    // if (query.page !== 0) {
    //   setQuery((prevState) => ({ ...prevState, page: 0 }));
    // }
    // setSearchVal(e.target.value);
  };

  const handleLeadTypeSel = (filteredValue) => {
    setSelectedType(filteredValue);
  };

  const handleCreate = () => {
    setIsOpen(true);
  };

  const handleClose = () => {
    setIsOpen(false);
    fetchLeads();
  };

  const generateLeadToOpportunityButton = ({
    _id,
    firstName,
    middleName,
    lastName,
    staticData,
    [leadProcessFieldName]: leadProcess,
    isAllowedToUpdate,
  }) => {
    let dontHavePermissions = [];

    if (!permissions["customerAccount"].isCreate) {
      dontHavePermissions.push("Customer Account");
    }
    if (!permissions["customerContact"].isCreate) {
      dontHavePermissions.push("Customer Contact");
    }
    if (!permissions["opportunity"].isCreate) {
      dontHavePermissions.push("Opportunity");
    }

    const isCurrentLeadStatusQualified = leadProcess && leadProcess.toLowerCase() == "qualified";

    return dontHavePermissions.length > 0 ? (
      <>
        <Tooltip className="cursor-stop"
          title={`To convert lead to opportunity, you must need create permission of ${dontHavePermissions.join(
            ", "
          )}`}
        >
          <IconButton aria-label="Convert to opportunity">
            <SiConvertio size={18} />
          </IconButton>
        </Tooltip>
      </>
    ) : staticData && staticData["convertedToOpportunity"] ? (
      <>
        <Tooltip className="cursor-stop" title="This lead is already converted to opportunity">
          <IconButton aria-label="Convert to opportunity">
            <SiConvertio size={18} />
          </IconButton>
        </Tooltip>
      </>
    ) : !isAllowedToUpdate ? (
      <>
        <Tooltip className="cursor-stop" title="You are not allowed to convert as you are neither owner nor collaborator">
          <IconButton aria-label="Convert to opportunity">
            <SiConvertio size={18} />
          </IconButton>
        </Tooltip>
      </>
    ) : !isCurrentLeadStatusQualified ? (
      <>
        <Tooltip className="cursor-stop" title="To covert this lead to opportunity, Lead status must be qualified">
          <IconButton aria-label="Convert to opportunity">
            <SiConvertio size={18} />
          </IconButton>
        </Tooltip>
      </>
    ) : (
      <Tooltip title="Convert to opportunity">
        <IconButton
          aria-label="Convert to opportunity"
          onClick={() => {
            const leadName = [firstName, middleName, lastName]
              .filter((d) => d)
              .join(" ");
            setConvertLeadToOpportunityConfirmationDialog({
              open: true,
              id: _id,
              leadName: leadName,
              message: `Are you sure, You want to convert ${leadName} to opportunity ?`,
            });
          }}
        >
          <SiConvertio size={18} className="text-primary" />
        </IconButton>
      </Tooltip>
    );
  };

  const showConfirmBox = (row) => {
    if (row) {
      setIsConformDialogVisible(true);
      if (row) {
        setDeleteRecord({ id: row._id, name: row.name });
      }
    } else {
      if (
        selectedRecords.find((d) => d.owner.optionValue != user.user._id)
      ) {
        setShowDeleteWarningConfirmBox(true);
      } else {
        setIsConformDialogVisible(true);
      }
    }
  };

  const handleDeleteLeads = async () => {
    if (deleteRecord.id || selectedRecords.length > 0) {
      setOkButtonLoading(true);

      axiosInstance()
        .put(`${leadApi}/remove?entity=${selectedEntity}`,
          { ids: deleteRecord.id ? [deleteRecord.id] : selectedRecords.map(d => d._id) })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
          setIsConformDialogVisible(false);
          setOkButtonLoading(false);
          if (deleteRecord.id) { setDeleteRecord({ id: null, name: null }); }
          fetchLeads();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setIsConformDialogVisible(false);
          setOkButtonLoading(false);
        });
    }
  };

  const convertLeadToOpportunity = () => {
    const ids = convertLeadToOpportunityConfirmationDialog.id
      ? [convertLeadToOpportunityConfirmationDialog.id]
      : selectedRecords.map((m) => m._id);

    axiosInstance()
      .post(`${leadApi}/to-opportunity`, { ids: ids })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });
        setConvertLeadToOpportunityConfirmationDialog({
          open: false,
          id: null,
          leadName: null,
          message: null,
        });
        if (convertLeadToOpportunityConfirmationDialog.id) {
          history.push(`${routes.opportunityDetail.path}/${data.data[0]}`)
        } else {
          fetchLeads();
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setOkButtonLoading(false);
      });
  };

  //  If you want to do something once grid binding done
  const onGridReady = (params) => {
    setGridApi(params.api);
  }

  const generateColumns = columns.map((column: any, index) => {
    return <AgGridColumn
      key={index}
      field={column.field}
      headerName={column.headerName}
      filter={column.filter}
      cellRenderer={column.cellRenderer ?? null}>
    </AgGridColumn>
  })


  return (
    <Layout>
      <Grid container>
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[routes.lead]} />
        </Grid>
        <Grid
          item
          md={8}
          sm={1}
          xs={2}>
          <ImportExportLinks
            module="lead(s)"
            api={leadApi}
            onSuccessfulImport={(isImportedSuccessfully) => {
              if (isImportedSuccessfully) { fetchLeads(); }
            }}
          />
        </Grid>
      </Grid>

      <CustomContainer>
        <div className="header-panel">
          <LeadsHeader
            userId={user?.user?._id}
            selectedType={selectedType}
            onTypeChange={handleLeadTypeSel}
            options={LeadTypes}
            onSearch={handleSearch}
            searchVal={search}
            leadPermissions={leadsPermissions}
            onCreate={handleCreate}
            showConfirmBox={showConfirmBox}
            icon={<HiUserGroup className="headerLogo" />}
            heading="Leads"
            allowToConvertLeadToOpportunity={
              permissions["customerAccount"].isCreate &&
              permissions["customerContact"].isCreate &&
              permissions["opportunity"].isCreate
            }
            selectedLeads={selectedRecords}
            showLeadToOpportunityConfirmationDialog={() => {
              setConvertLeadToOpportunityConfirmationDialog({
                open: true,
                id: null,
                leadName: null,
                message: `Are you sure, You want to convert selected leads to opportunity ?`,
              });
            }}
          />
        </div>
        {isOpen && (
          <ManageLeadDialog
            open={isOpen}
            onSuccess={handleClose}
            onClose={() => {
              setIsOpen(false);
            }}
            isNew={true}
            dataToUpdate={null}
            leadApi={leadApi}
          />
        )}
        {/* <div className="listing-grid"> */}

        {/* <div>
          {
            !loading && <div className="height-100 width-100 d-flex align-items-center justify-content-center">
              Loading.....
            </div>
          }
        </div> */}

        <div className="ag-theme-material listing-grid">

          <div style={{ height: "100%", width: "100%" }}>

            <AgGridReact
              rowData={dataRows}
              onGridReady={onGridReady}
              // suppressDragLeaveHidesColumns={true}
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
                const filterModel = {};
                Object.assign(filterModel, e.api.getFilterModel());
                let filterList = [];

                Object.keys(filterModel).map(field => {
                  filterList.push({
                    columnName: field,
                    value: filterModel[field].filter
                  })
                })
                dispatch({ type: "filter", filters: filterList });
              }}
              enableCellTextSelection={true}
              ensureDomOrder={true}
              loadingOverlayComponent={'customLoadingOverlay'}
              loadingOverlayComponentParams={{
                loadingMessage: 'Loading...',
              }}
              animateRows={false}
              suppressAnimationFrame={true}
              suppressMaintainUnsortedOrder={true}

              // loadingCellRenderer={'customLoadingCellRenderer'}
              // loadingCellRendererParams={{
              //   loadingMessage: 'One moment please...',
              // }}

              suppressRowClickSelection={true}
              rowSelection={'multiple'}
              frameworkComponents={frameworkComponents}
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

              <AgGridColumn width={150} headerName="Actions" pinned="right" lockPinned={true}
                resizable={false} sortable={false}
                filter={false} cellRenderer="actionsRenderer">
              </AgGridColumn>

            </AgGridReact>
          </div>

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

        {
          showDeleteWarningConfirmBox ? (
            <MessageDialog
              open={showDeleteWarningConfirmBox}
              message={`You are trying to delete records which you do not have permission to delete, Please remove those records from selection and try again.`}
              onClose={() => setShowDeleteWarningConfirmBox(false)}
            />
          ) : null
        }
        {
          isConfirmDialogVisible ? (
            <ConfirmationDialog
              open={isConfirmDialogVisible}
              message={`Are you sure, you want to delete Lead ${deleteRecord.name || ""
                }?`}
              onClose={() => {
                if (deleteRecord.id) setDeleteRecord({ id: null, name: null });
                setIsConformDialogVisible(false);
              }}
              okBtnLoading={okButtonLoading}
              onOk={handleDeleteLeads}
            />
          ) : null
        }

        {
          convertLeadToOpportunityConfirmationDialog.open ? (
            <ConfirmationDialog
              open={convertLeadToOpportunityConfirmationDialog.open}
              message={convertLeadToOpportunityConfirmationDialog.message}
              onClose={() => {
                setConvertLeadToOpportunityConfirmationDialog({
                  open: false,
                  id: null,
                  leadName: null,
                  message: null,
                });
              }}
              okBtnLoading={okButtonLoading}
              onOk={convertLeadToOpportunity}
            />
          ) : null
        }
      </CustomContainer >
    </Layout >
  );
};

export default Leads;
