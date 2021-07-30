import React, { useState, useEffect, useContext, useReducer } from "react";
import { Grid, Chip, Typography, Tooltip } from "@material-ui/core";
import { Link } from "react-router-dom";
import { useData } from "../../StateProvider/Provider";
import Layout from "../../components/Layout";
import axiosInstance from "../../axios/axiosInstance";
import { displayDate } from "../../services/util";
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
  quoteBuilder,
  formatAmountWithCurrency,
  gridLoadingTimeout,
} from "../../constants/helpers";
import ImportExportLinks from "../../components/Helpers/ImportExportLinks";
import CustomContainer from "../../components/CustomContainer";
import { useHistory } from "react-router-dom";
import {
  CommonRenderer,
  CreatedByRenderer,
  UpdatedByRenderer,
} from "../../components/AgGridComponents/CustomAgGridCellRenderers";
import GridDeleteIcon from "../../components/Helpers/GridDeleteIcon";
import "./style.scss";
import CustomAgGrid, {
  reducer,
  intialState,
} from "../../components/AgGridComponents/CustomAgGrid";
import QuoteHeader from "./QuoteHeader";
import ManageQuoteDialog from "./ManageQuote/ManageQuoteDialog";
import NoDataCell from "../../components/Helpers/NoDataCell";
import CustomDialogComponent from "../../components/CustomDialog/CustomDialogComponent";
import VersionStatus from "./VersionStatus";
import TransferEntityDialog from "../../components/AssignRolesDialog/TransferEntityDialog";
import CustomDialogContent from "../../components/CustomDialog/CustomDialogContent";
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";

let quoteTimeout;
const QuoteType = [
  {
    key: "All Quotes",
    value: 1,
  },
  {
    key: "My Quotes",
    value: 2,
  },
];
const arr = [...Array(9).keys()];

const QuoteBuilders = () => {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, selectedEntity, permissions },
  }: any = useData();
  const [selectedType, setSelectedType] = useState(1);
  const [renderCount, setRenderCount] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [showTransferEntityDialog, setShowTransferEntityDialog] = useState(false)
  const [deleteRecord, setDeleteRecord] = useState<any>({});
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [quotePermissions, setQuotePermissions] = useState({
    isCreate: false,
    isUpdate: false,
    isRead: false,
    isDelete: false,
  });
  const [showCreateQuoteDialog, setshowCreateQuoteDialog] = useState(false);
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] =
    useState(false);
  const [isClone, setIsClone] = useState(false);
  const [singleQuoteDelete, setSingleQuoteDelete] = useState({
    id: null,
    show: false,
    quoteName: "",
  });
  const [accountDetails, setAccountDetails] = useState({
    accountId: history.location?.state?.accountId,
    accountName: history.location?.state?.accountName,
    resource: history.location?.state?.resource,
  });
  const [showVersionsDialog, setShowVersionsDialog] = useState(false);
  const [versionStatusData, setVersionStatusData] = useState({
    columns: [
      {
        field: "versionNumber", headerName: "Version #", flex: .75,
        renderCell: (params: any) => (
          <span
            title={params.value}
          >
            {params.value}
          </span>
        ),
      },
      {
        field: "status", headerName: "Status", flex: 1,
        renderCell: (params: any) => (
          <span
            title={params.value}
            className="text-truncate link"
            onClick={() => {
              history.push(`quotes/detail/${params.row._id}`, {
                versionNumber: `${params.row.versionNumber}`,
                tabValue: 2
              })
            }}
          >
            {params.value}
          </span>
        ),
      },
      {
        field: "comment", headerName: "Comment", flex: 1,
        renderCell: (params: any) => (
          <Typography
            title={params.value}
            className="text-truncate"
          >
            {params.value}
          </Typography>
        ),
      },
      {
        field: "processStatus", headerName: "Conclusion", flex: 1,
        renderCell: (params: any) => (
          <Typography
            title={params.value}
          >
            {params.value}
          </Typography>
        ),
      },

      {
        field: "totalCost", headerName: "Total Cost", flex: 1,
        renderCell: (params: any) => (
          <span>
            {params.value}
          </span>
        ),
      },
      {
        field: "totalSalesPrice",
        headerName: "Total Sales Price",
        flex: 1,
        renderCell: (params: any) => (
          <span
          >
            {params.value}
          </span>
        ),
      },
      // { field: "processStatus", headerName: "ProcessStatus" }
    ],
    data: [],
  });

  const { qbApi } = quoteBuilder;

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
      field: "quoteName",
      headerName: "Quote Name",
      show: true,
      disabled: true,
      cellRenderer: "quoteNameRenderer",
    },
    {
      field: "customerAccountName",
      headerName: "Customer Account Name",
      show: true,
      cellRenderer: "customerAccountNameRenderer",
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
      field: "expiryDate",
      headerName: "Expiry Date",
      show: true,
      filter: false,
      cellRenderer: "commonRenderer",
    },
    {
      field: "owner",
      headerName: "Quote Owner",
      show: true,
      cellRenderer: "commonRenderer",
    },
  ];
  //  Grid Variables - End

  useEffect(() => {
    if (permissions && permissions.quoteBuilder) {
      setQuotePermissions(permissions.quoteBuilder);
    }

    return () => {
      setQuotePermissions(null);
    };
  }, [permissions]);

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (quoteTimeout) {
      clearTimeout(quoteTimeout);
    }

    quoteTimeout = setTimeout(() => {
      fetchQuoteBuilder();
    }, millisec);
    // eslint-disable-next-line
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchQuoteBuilder();
    } else setRenderCount((preCount) => preCount + 1);
  }, [
    page,
    limit,
    selectedType,
    filters,
    sorting,
    selectedEntity,
    accountDetails,
  ]);

  const getVersionStatus = (id, currency) => {
    // setAllVersionStatusButtonText(gettingVersionStatusText);
    // if(event){
    //   toastConfig.setToastConfig({
    //     open: true,
    //     type: "info",
    //     message: `Please wait...`,
    // });
    // }
    setLoadingVersions(true)
    axiosInstance()
      .get(`/quote-builder/quote-hierarchy/${id}`)
      .then(({ data: { data } }) => {
        //   toastConfig.setToastConfig({
        //     open: true,
        //     type: "success",
        //     message: "Data Retreived successfully",
        // });
        // setShowVersionsDialog(true);
        let quoteId = id;
        const newData = data.versions.map((d, index) => {
          return {
            ...d,
            id: index + 1,
            versionNumber: index + 1,
            _id: quoteId,
            totalCost: formatAmountWithCurrency(
              currency,
              d.productData.totalCost
            ).fullFormatAmount,
            totalSalesPrice: formatAmountWithCurrency(
              currency,
              d.productData.totalSalesPrice
            ).fullFormatAmount,
            comment: d.comment ? d.comment : "",
          };
        });

        setVersionStatusData((prevState) => {
          return {
            ...prevState,
            data: newData,
          }

        });


        setLoadingVersions(false);
        // setAllVersionStatusButtonText("All Version Status");
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setLoadingVersions(false);
        // setAllVersionStatusButtonText("All Version Status");
      });
  };

  const handleSingleDeleteQuote = async () => {
    dispatch({ type: "loading", loading: true });

    axiosInstance()
      .put(`${qbApi}/remove?entity=${selectedEntity}`, {
        ids: [singleQuoteDelete.id],
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: "success",
          message: data.message,
        });
        fetchQuoteBuilder();
        dispatch({ type: "loading", loading: false });
        setSingleQuoteDelete({ id: null, show: false, quoteName: "" });
      })
      .catch((error) => {
        dispatch({ type: "loading", loading: false });
        toastConfig.setToastConfig(error);
      });
  };

  const handleShowCloneQuoteDialog = () => {
    setIsClone(true)
    setshowCreateQuoteDialog(true)
  }

  const QuoteNameRenderer = (params) => (
    <span>
      <Link
        className="link"
        title={params.value}
        to={`${routes.quoteBuilder.path}/detail/${params.data._id}`}
      >
        {params.value}
      </Link>
      <Tooltip
        title="Versions">
        <span
          className="cursor-pointer link ml-1"
          onClick={() => {
            setShowVersionsDialog(true)
            getVersionStatus(params.data._id, params.data.currency)
          }}>({params.data.versionCount})</span>
      </Tooltip>
    </span>
  );

  const CustomerAccountNameRenderer = (params) => (
    <Link
      className="link"
      title={params.value}
      to={`${routes.customerAccount.path}/detail/${params.data.customerAccountId}`}
    >
      {params.value}
    </Link>
  );

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
      <GridDeleteIcon
        hasDeletePermission={quotePermissions.isDelete}
        ownerId={params.data.ownerId}
        userId={user?.user?._id}
        onDelete={() =>
          setSingleQuoteDelete({
            show: true,
            id: params.data._id,
            quoteName: `${params.data.quoteName}`,
          })
        }
        entity="quote"
      />
    </>
  );

  const frameworkComponents = {
    quoteNameRenderer: QuoteNameRenderer,
    customerAccountNameRenderer: CustomerAccountNameRenderer,
    relatedOpportunityRenderer: RelatedOpportunityRenderer,
    createdByRenderer: CreatedByRenderer,
    updatedByRenderer: UpdatedByRenderer,
    actionsRenderer: ActionsRenderer,
    commonRenderer: CommonRenderer,
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

      case "customerAccountName":
        return "customerAccountName.optionLabel";

      case "supplierAccountName":
        return "supplierAccountName.optionLabel";

      default:
        return field;
    }
  };

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}&filterQuotes=${selectedType}`;

    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

    if (accountDetails.accountId) {
      if (accountDetails.resource === customerAccount.accountResource) {
        deepFilter = `${deepFilter}&filterById=${JSON.stringify([
          {
            field: replaceFieldName("customerAccountName"),
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

  const fetchQuoteBuilder = async () => {
    if (selectedEntity) {
      dispatch({ type: "loading", loading: true });
      const queryString = getQueryString();

      if (gridApi) {
        gridApi.setRowData([]);
      }

      axiosInstance()
        .get(`${qbApi}${queryString}`)
        .then(({ data: { data, count } }) => {
          let rows = data.map((u) => {
            const {
              owner,
              collaborator,
              createdBy,
              updatedBy,
              customerAccountName,
              ...restProperties
            } = u;

            let count = Object.keys(u.versions).length;
            let tempStatus = "Building Quote"
            let versionArray = []
            Object.keys(u.versions).forEach(key => {
              versionArray.push(u.versions[key])
            })

            const updatedVersion = versionArray.find(v => v.status !== tempStatus)
            if (updatedVersion) {
              tempStatus = updatedVersion.status
            }

            let res = {
              ...restProperties,
              id: u._id,

              owner: u.owner?.optionLabel,
              ownerId: u.owner?.optionValue,

              canDelete: u.owner?.optionValue === user?.user._id,
              expiryDate: u.expiryDate ? displayDate(u.expiryDate) : "",

              customerAccountName: u.customerAccountName?.optionLabel,
              customerAccountId: u.customerAccountName?.optionValue,
              status: tempStatus,
              versionCount: count,
              versionData: versionArray,
              currency: u.currency,
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
    }
  };

  const handleSearch = (e) => {
    dispatch({ type: "search", search: e.target.value });
  };

  const handleQuoteBuilderTypeSel = (filterValues) => {
    setSelectedType(filterValues);
  };

  const onSuccess = () => {
    setshowCreateQuoteDialog(false);
    setIsClone(false);
    fetchQuoteBuilder();
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
    setshowCreateQuoteDialog(true);
  };

  const handleDeleteQuote = async () => {
    setDeleteLoading(true);
    let recordsToDelete = [];
    if (deleteRecord?._id) {
      recordsToDelete.push(deleteRecord?._id);
    } else {
      recordsToDelete = selectedRecords.map((o) => o._id);
    }
    if (recordsToDelete.length > 0) {
      axiosInstance()
        .put(`${qbApi}/remove?entity=${selectedEntity}`, {
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
          fetchQuoteBuilder();
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
            <CustomBreadCrumbs routes={[routes.quoteBuilder]} />
          </Grid>
          <Grid item md={8} sm={1} xs={2}>
            <Grid container direction="row">
              <Grid item xs={12} sm={12}>
                <Grid container justify="flex-end">
                  <ImportExportLinks
                    permissions={quotePermissions}
                    module="quotes"
                    api={qbApi}
                    afterImportCompleted={() => {
                      fetchQuoteBuilder();
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
            <QuoteHeader
              selectedRecords={selectedRecords}
              onTypeChange={handleQuoteBuilderTypeSel}
              options={QuoteType}
              onSearch={handleSearch}
              searchVal={search}
              QuotePermissions={quotePermissions}
              onCreate={clickCreateNew}
              showConfirmBox={showConfirmBox}
              canDelete={selectedRecords.length === 0}
              icon={<GiHiveMind className="headerLogo" />}
              heading={routes.quoteBuilder.title}
              showTransferEntityDialog={handleTransferEntityDialog}
              showCloneQuoteDialog={() => {
                handleShowCloneQuoteDialog()
              }}

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
            </QuoteHeader>
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
              message={`Are you sure you want to delete ${deleteRecord?.quoteName ? "Quote" : "Quotes"
                }   ${deleteRecord.quoteName || ""}?`}
              onClose={() => {
                if (deleteRecord) setDeleteRecord({});
                setIsConformDialogVisible(false);
              }}
              okBtnLoading={deleteLoading}
              onOk={handleDeleteQuote}
            />
          ) : null}

          {singleQuoteDelete.show ? (
            <ConfirmationDialog
              open={singleQuoteDelete.show}
              message={`Are you sure you want to delete Quote: ${singleQuoteDelete.quoteName}?`}
              onClose={() =>
                setSingleQuoteDelete({
                  id: null,
                  show: false,
                  quoteName: "",
                })
              }
              onOk={handleSingleDeleteQuote}
            />
          ) : null}
        </CustomContainer>
      </Layout>

      {showCreateQuoteDialog && (
        <ManageQuoteDialog
          open={showCreateQuoteDialog}
          onSuccess={onSuccess}
          onClose={() => {
            setshowCreateQuoteDialog(false);
            setIsClone(false)
          }}
          isNew={isClone ? false : true}
          dataToUpdate={isClone ? { ...selectedRecords[0], ...{ 'owner': { 'optionLabel': selectedRecords[0].owner, 'optionValue': selectedRecords[0].ownerId } } } : null}
          isClone={isClone ? true : false}
          resource={null}
          isRedirectTodetailPage={isClone ? false : true}
          contactId={null}
          opportunityId={null}
          disableOwnerDropDown={true}
          contacts={null}
          doaCollaboratorResources={user.user?.doa.map(obj => obj.user)}
          isRenderedFromOpportunity={false}
        />
      )}


      {showVersionsDialog && (
        <CustomDialogComponent
          title="All Version Status"
          open={showVersionsDialog}
          onClose={() => {
            setShowVersionsDialog(false);
            setVersionStatusData((prevState) => ({ ...prevState, data: [] }))
          }}
        >
          <CustomDialogContent>
            {versionStatusData.data.length === 0 && (
              <CommonSkeleton lenArray={arr} />
            )}
            {versionStatusData.data.length > 0 &&
              <VersionStatus loadingVersions={loadingVersions} versionStatusData={versionStatusData}
              />}
          </CustomDialogContent>
        </CustomDialogComponent>
      )}
      {showTransferEntityDialog && (
        <TransferEntityDialog
          TransferEntityDialogOpen={showTransferEntityDialog}
          onSuccess={() => {
            onSuccess()
            setShowTransferEntityDialog(false);
          }}
          handleCloseDialog={() => {
            setShowTransferEntityDialog(false);
          }}
          selectedRecs={selectedRecords.map(r => r._id)}
          entities={user.entity.filter(e => e._id !== selectedEntity)}
          type="quotes"
          api="quote-builder"
        />
      )}
    </>
  );
};

export default QuoteBuilders;
