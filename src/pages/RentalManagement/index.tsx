import { useState, useEffect, useContext, useReducer, Fragment } from "react";
import { Grid, Chip, IconButton, Tooltip } from "@material-ui/core";
import { Link } from "react-router-dom";
import { useData } from "../../StateProvider/Provider";
import axiosInstance from "../../axios/axiosInstance";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import MessageDialog from "../../components/Helpers/MessageDialog";
import CustomBreadCrumbs from "./../../components/CustomBreadCrumbs";
import routes from "./../../components/Helpers/Routes";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { GiHiveMind } from "react-icons/gi";
import {
  isObjectEmpty,
  customerAccount,
  supplierAccount,
  gridLoadingTimeout,
  rentalManagement,
} from "../../constants/helpers";
import ImportExportLinks from "../../components/Helpers/ImportExportLinks";
import CustomContainer from "../../components/CustomContainer";
import { useHistory } from "react-router-dom";
import {
  CommonRenderer,
  CreatedByRenderer,
  DateRenderer,
  UpdatedByRenderer,
} from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import GridDeleteIcon from "../../components/Helpers/GridDeleteIcon";
import CustomAgGrid, {
  reducer,
  intialState,
} from "../../components/AgGridComponents/CustomAgGrid";
import NoDataCell from "../../components/Helpers/NoDataCell";
import RentalManagementHeader from "./RentalManagementHeader";
import ManageRentalManagementDialog from "./ManageRental/ManageRentalManagementDialog";
import FileCopyIcon from '@material-ui/icons/FileCopy';

let rentalManagementTimeout;
const RentalManagementType = [
  {
    key: "All Rental Managements",
    value: 1,
  },
  {
    key: "My Rental Managements",
    value: 2,
  },
];

const RentalManagement = () => {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, permissions },
  }: any = useData();
  const [selectedType, setSelectedType] = useState(1);
  const [renderCount, setRenderCount] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [showTransferEntityDialog, setShowTransferEntityDialog] = useState(false)
  const [deleteRecord, setDeleteRecord] = useState<any>({});
  const [showManageRentalManagementDialog, setShowManageRentalManagementDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] =
    useState(false);
  const [singleRentalManagementDelete, setSingleRentalManagementDelete] = useState({
    id: null,
    show: false,
    rentalManagementName: "",
  });
  const [accountDetails, setAccountDetails] = useState({
    accountId: history.location?.state?.accountId,
    accountName: history.location?.state?.accountName,
    resource: history.location?.state?.resource,
  });
  // const [rentalManagementPermissions, setRentalManagementPermissions] = useState({
  //   isCreate: permissions?.rentalManagement?.isCreate,
  //   isUpdate: permissions?.quoteBuilder?.isUpdate,
  //   isRead: permissions?.quoteBuilder?.isRead,
  //   isDelete: permissions?.quoteBuilder?.isDelete,
  // });
  const { rentalManagementResource, rentalManagementApi } = rentalManagement;
  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const {
    dataRows,
    rowCount,
    loading,
    page,
    limit,
    pageSizes,
    search,
    filters,
    sorting,
    selectedRecords,
  } = state;

  const columns = [
    {
      field: "rentalJobName",
      headerName: "Rental Job Name",
      show: true,
      disabled: true,
      cellRenderer: "rentalManagementNameRenderer",
    },
    {
      field: "status",
      headerName: "Status",
      show: true,
      disabled: false,
      cellRenderer: "commonRenderer",
    },
    {
      field: "rentalJobID",
      headerName: "Rental Job ID",
      show: true,
      cellRenderer: "commonRenderer",
    },
    {
      field: "rentalStartDate",
      headerName: "Rental Start Date",
      show: true,
      filter: false,
      cellRenderer: "dateRenderer",
    },
    {
      field: "rentalEndDate",
      headerName: "Rental End Date",
      show: true,
      filter: false,
      cellRenderer: "dateRenderer",
    },
    {
      field: "customerAccount",
      headerName: "Customer Account Name",
      show: true,
      cellRenderer: "customerAccountRenderer",
    },
    {
      field: "relatedOpportunity",
      headerName: "Related Opportunity",
      show: true,
      cellRenderer: "relatedOpportunityRenderer"
    },

    {
      field: "createdBy",
      headerName: "Created By",
      show: true,
      cellRenderer: "createdByRenderer",
    },
    {
      field: "updatedBy",
      headerName: "Updated By",
      show: true,
      cellRenderer: "updatedByRenderer",
    },
    {
      field: "owner",
      headerName: "RentalManagement Owner",
      show: true,
      cellRenderer: "commonRenderer",
    },
  ];
  //  Grid Variables - End

  const columnState = JSON.parse(localStorage.getItem("rentalManagementPage"));
  if (columnState) {
    columns.forEach((item) => {
      columnState.forEach((d) => {
        if (d.colId === item.field) {
          item.show = !d.hide;
        }
      });
    });
  }

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (rentalManagementTimeout) {
      clearTimeout(rentalManagementTimeout);
    }

    rentalManagementTimeout = setTimeout(() => {
      fetchRentalManagement();
    }, millisec);
    // eslint-disable-next-line
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchRentalManagement();
    } else setRenderCount((preCount) => preCount + 1);
  }, [
    page,
    limit,
    selectedType,
    filters,
    sorting,
    accountDetails,
  ]);

  const handleSingleDeleteRentalManagement = async () => {
    dispatch({ type: "loading", loading: true });

    axiosInstance()
      .put(`${rentalManagementApi}/remove`, {
        ids: [singleRentalManagementDelete.id],
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });
        fetchRentalManagement();
        dispatch({ type: "loading", loading: false });
        setSingleRentalManagementDelete({ id: null, show: false, rentalManagementName: "" });
      })
      .catch((error) => {
        dispatch({ type: "loading", loading: false });
        toastConfig.setToastConfig(error);
      });
  };

  const RentalManagementNameRenderer = (params) => (
    <>
      <Link
        className="text-truncate link"
        title={params.value}
        to={`${routes.rentalManagement.path}/detail/${params.data._id}`}
      >
        {params.value}
      </Link>
    </>
  );

  const CustomerAccountRenderer = (params) => <>
    {
      params.value ?
        <Link
          className="link"
          title={params.value}
          to={`${routes.customerAccount.path}/detail/${params.data.customerAccountId}`}
        >
          {params.value}
        </Link> : <NoDataCell />
    }
  </>


  const RelatedOpportunityRenderer = params => <>
    {
      params.value ?
        <Link className="link" to={`${routes.opportunityDetail.path}/${params.data.relatedOpportunityId}`} title={params.value}>
          {params.value}
        </Link>
        : <NoDataCell />
    }
  </>

  const ActionsRenderer = (params) => (
    <>
      {
        permissions.rentalManagement.isCreate ? (
          <Tooltip title="Clone">
            <IconButton
              size="small"
              aria-label="Clone"
              onClick={() => {
                setShowManageRentalManagementDialog({ open: true, isClone: true, idToClone: params.data._id })
              }}
            >
              <FileCopyIcon fontSize="small" color="primary" />
            </IconButton>
          </Tooltip>
        ) : (
          <Tooltip className="cursor-stop" title="You do not have permission to clone/create">
            <IconButton aria-label="Clone" size="small">
              <FileCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        )}

      <GridDeleteIcon
        hasDeletePermission={permissions.rentalManagement.isDelete}
        ownerId={params.data.ownerId}
        userId={user?.user?._id}
        onDelete={() =>
          setSingleRentalManagementDelete({
            show: true,
            id: params.data._id,
            rentalManagementName: `${params.data.rentalManagementName}`,
          })
        }
        entity="rentalManagement"
      />
    </>
  );

  const frameworkComponents = {
    rentalManagementNameRenderer: RentalManagementNameRenderer,
    customerAccountRenderer: CustomerAccountRenderer,
    relatedOpportunityRenderer: RelatedOpportunityRenderer,
    createdByRenderer: CreatedByRenderer,
    updatedByRenderer: UpdatedByRenderer,
    actionsRenderer: ActionsRenderer,
    commonRenderer: CommonRenderer,
    dateRenderer: DateRenderer,
  };

  const replaceFieldName = (field) => {
    switch (field) {
      case "createdBy":
        return "createdBy.user.concatedName";

      case "updatedBy":
        return "updatedBy.user.concatedName";

      default:
        return field;
    }
  };

  const replaceFieldNameForSorting = (field) => {
    const updatedField = replaceFieldName(field);

    if (field !== updatedField) return updatedField;

    switch (field) {
      case "owner":
        return "owner.optionLabel";

      case "customerAccount":
        return "customerAccount.optionLabel";

      case "supplierAccountName":
        return "supplierAccountName.optionLabel";

      default:
        return field;
    }
  };

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}&filterRentalManagements=${selectedType}`;
    if (accountDetails.accountId) {
      if (accountDetails.resource === customerAccount.accountResource) {
        deepFilter = `${deepFilter}&filterById=${JSON.stringify([
          {
            field: replaceFieldName("customerAccount"),
            term: accountDetails.accountId,
          },
        ])}`;
      } else if (accountDetails.resource === supplierAccount.accountResource) {
        deepFilter = `${deepFilter}&filterById=${JSON.stringify([
          {
            field: replaceFieldName("supplierAccountName"),
            term: { $in: [accountDetails.accountId] },
          },
        ])}`;
      }
    }

    if (!isObjectEmpty(filters)) {
      const updatedFilters = [];

      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: replaceFieldName(field),
          term: filters[field].filter,
        });
      });
      deepFilter = `${deepFilter}&deepFilter=${JSON.stringify(
        updatedFilters
      )}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${replaceFieldNameForSorting(
        sorting[0].colId
      )}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${search}`;
    }

    return deepFilter;
  };

  const fetchRentalManagement = async () => {
    dispatch({ type: "loading", loading: true });
    const queryString = getQueryString();

    if (gridApi) {
      gridApi.setRowData([]);
    }

    axiosInstance()
      .get(`${rentalManagementApi}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          const {
            owner,
            collaborator,
            createdBy,
            updatedBy,
            customerAccount,
            ...restProperties
          } = u;

          let res = {
            ...restProperties,
            id: u._id,
            status: u.status,
            owner: u.owner?.optionLabel,
            ownerId: u.owner?.optionValue,
            customerAccount: u.customerAccount?.optionLabel,
            customerAccountId: u.customerAccount?.optionValue,
            customerContact: u.customerContact?.optionLabel,
            relatedOpportunity: u.opportunity?.optionLabel,
            relatedOpportunityId: u.opportunity?.optionValue,
            createdBy: u.createdBy?.user?.concatedName,
            createdByDate: u.createdBy?.date,
            updatedBy: u.updatedBy?.user?.concatedName,
            updatedByDate: u.updatedBy?.date,
          };
          return res;
        });

        dispatch({ type: "initialize", data: rows, count: count });
        setTimeout(() => {
          dispatch({ type: "loading", loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        dispatch({ type: "loading", loading: false });
        toastConfig.setToastConfig(error);
      });

  };

  const handleSearch = (e) => {
    dispatch({ type: "search", search: e.target.value });
  };

  const handleRentalManagementTypeSel = (filterValues) => {
    setSelectedType(filterValues);
  };

  const handleTransferEntityDialog = () => {
    setShowTransferEntityDialog(true)
  }

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
    setShowManageRentalManagementDialog({ open: true, isClone: false, idToClone: null });
  };

  const handleDeleteRentalManagement = async () => {
    setDeleteLoading(true);
    let recordsToDelete = [];
    if (deleteRecord?._id) {
      recordsToDelete.push(deleteRecord?._id);
    } else {
      recordsToDelete = selectedRecords.map((o) => o._id);
    }
    if (recordsToDelete.length > 0) {
      axiosInstance()
        .put(`${rentalManagementApi}/remove`, {
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
          fetchRentalManagement();
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
      <Fragment>
        <Grid container className="headerbox">
          <Grid item md={4} sm={11} xs={10}>
            <CustomBreadCrumbs routes={[routes.rentalManagement]} />
          </Grid>
          <Grid item md={8} sm={1} xs={2}>
            <Grid container direction="row">
              <Grid item xs={12} sm={12}>
                <Grid container justify="flex-end">
                  <ImportExportLinks
                    permissions={permissions.rentalManagement}
                    module="rentalManagements"
                    api={rentalManagementApi}
                    afterImportCompleted={() => {
                      fetchRentalManagement();
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
            <RentalManagementHeader
              selectedRecords={selectedRecords}
              onTypeChange={handleRentalManagementTypeSel}
              options={RentalManagementType}
              onSearch={handleSearch}
              searchVal={search}
              RentalManagementPermissions={permissions.rentalManagement}
              onCreate={clickCreateNew}
              showConfirmBox={showConfirmBox}
              canDelete={selectedRecords.length === 0}
              icon={<GiHiveMind className="headerLogo" />}
              heading={routes.rentalManagement.title}
              showTransferEntityDialog={handleTransferEntityDialog}
            // showCloneRentalManagementDialog={() => {
            //   handleShowCloneRentalManagementDialog()
            // }}

            >
              {accountDetails.accountId && (
                <Chip
                  className="ml-3"
                  color="primary"
                  label={`Account: ${accountDetails.accountName}`}
                  onDelete={() => {
                    setAccountDetails({
                      accountId: null,
                      accountName: null,
                      resource: null,
                    });
                  }}
                />
              )}
            </RentalManagementHeader>
          </div>

          <CustomAgGrid
            columns={columns}
            dataRows={dataRows}
            frameworkComponents={frameworkComponents}
            setGridApi={setGridApi}
            dispatch={dispatch}
            rowCount={rowCount}
            limit={limit}
            pageSizes={pageSizes}
            page={page}
            actionWidth={100}
            loading={loading}
            renderedFrom={"rentalManagementPage"}
          />

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
              message={`Are you sure you want to delete ${deleteRecord?.rentalManagementName ? "RentalManagement" : "RentalManagements"
                }   ${deleteRecord.rentalManagementName || ""}?`}
              onClose={() => {
                if (deleteRecord) setDeleteRecord({});
                setIsConformDialogVisible(false);
              }}
              okBtnLoading={deleteLoading}
              onOk={handleDeleteRentalManagement}
            />
          ) : null}

          {singleRentalManagementDelete.show ? (
            <ConfirmationDialog
              open={singleRentalManagementDelete.show}
              message={`Are you sure you want to delete RentalManagement: ${singleRentalManagementDelete.rentalManagementName}?`}
              onClose={() =>
                setSingleRentalManagementDelete({
                  id: null,
                  show: false,
                  rentalManagementName: "",
                })
              }
              onOk={handleSingleDeleteRentalManagement}
            />
          ) : null}
        </CustomContainer>
      </Fragment>

      {
        showManageRentalManagementDialog.open && (
          <ManageRentalManagementDialog
            isClone={showManageRentalManagementDialog.isClone}
            open={showManageRentalManagementDialog.open}
            rentalManagementId={showManageRentalManagementDialog.idToClone}
            onClose={() => setShowManageRentalManagementDialog({ open: false, isClone: false, idToClone: null })}
            onSuccess={() => {
              fetchRentalManagement();
              setShowManageRentalManagementDialog({ open: false, isClone: false, idToClone: null });
            }}
          />
        )}
    </>
  );
};

export default RentalManagement;
