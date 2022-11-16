import { useState, useEffect, useContext, useReducer, Fragment } from "react";
import { Grid, Chip, Typography, Tooltip } from "@material-ui/core";
import { Link } from "react-router-dom";
import { useData } from "../../StateProvider/Provider";
import axiosInstance from "../../axios/axiosInstance";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import MessageDialog from "../../components/Helpers/MessageDialog";
import CustomBreadCrumbs from "./../../components/CustomBreadCrumbs";
import routes from "./../../components/Helpers/Routes";
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { GiHiveMind } from "react-icons/gi";
import { SiMarketo, AiFillFileMarkdown, FaPercentage, SiStatuspage, GoVersions } from "react-icons/all";
import {
  isObjectEmpty,
  customerAccount,
  supplierAccount,
  quoteBuilder,
  formatAmountWithCurrency,
  gridLoadingTimeout,
  prepareDataForGrid,
  customerContact,
  supplierContact,
  quote,
  getLocalStorageArrayData,
  removeLocalStorage
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
import CommonSkeleton from "../../components/Helpers/CommonSkeleton";
import useColumns, { getStaticFields, getFrameworkComponents, checkStaticField } from "../../constants/useColumns"
import CustomSwipableList from "../../components/SwipableListComponents/CustomSwipableList";
import { isMobile, isTablet } from 'react-device-detect';
import { quoteStepColors } from '../../constants/helpers';
import InfiniteScroll from "react-infinite-scroll-component";
import { FaSuitcase } from "react-icons/fa";
import { AiFillCrown, BiDollar } from "react-icons/all";
import IconButton from "@material-ui/core/IconButton";
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { styles } from "@material-ui/pickers/views/Calendar/Calendar";
import { camelCase } from "lodash";

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
  const renderedFrom = camelCase(routes?.quoteBuilder.title)
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, selectedEntity, permissions },
  }: any = useData();
  const { getColumnData } = useColumns();
  const { quoteResource } = quote;
  const [selectedType, setSelectedType] = useState(1);
  const [renderCount, setRenderCount] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [showTransferEntityDialog, setShowTransferEntityDialog] = useState(false)
  const [deleteRecord, setDeleteRecord] = useState<any>({});
  const [loadingVersions, setLoadingVersions] = useState(false);
  const [quotePermissions, setQuotePermissions] = useState({
    isCreate: permissions?.quoteBuilder?.isCreate,
    isUpdate: permissions?.quoteBuilder?.isUpdate,
    isRead: permissions?.quoteBuilder?.isRead,
    isDelete: permissions?.quoteBuilder?.isDelete,
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

  const [contactDetails, setContactDetails] = useState({
    contactId: history.location?.state?.contactId,
    contactName: history.location?.state?.contactName,
    resource: history.location?.state?.resource,
  })
  const [opportunityDetails, setOpportunityDetails] = useState({
    opportunityId: history.location?.state?.opportunityId,
    opportunityName: history.location?.state?.opportunityName,
  })
  const [showVersionsDialog, setShowVersionsDialog] = useState(false);
  const [frameWorkComponent, setFrameWorkComponent] = useState({})
  const [columns, setColumns] = useState([])
  const [isAllChecked, setIsAllChecked] = useState(false);
  const [doa, setDoa] = useState([]);
  const [clonedData, setClonedData] = useState([])
  const [clonedId, setClonedId] = useState(null)

  const [versionStatusData, setVersionStatusData] = useState([]);
  const [cloneQuoteWithVersionNumber, setCloneQuoteWithVersionNumber] = useState(0);

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
    appendRows,
    showFilteredRecordsOnly
  } = state;

  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  useEffect(() => {
    fetchGridColumns()
  }, [])

  const fetchGridColumns = async () => {

    const response = await axiosInstance()
      .get(`/field?resource=Quotes&entity=${selectedEntity}&view=true`)

    let data = response?.data?.data

    let columns = []
    let rendererNames = []
    data.forEach(o => {
      if (["quoteName"].find(d => d === o?.fieldData?.fieldName)) {
        columns = [...columns, {
          disabled: true,
          field: "quoteName",
          headerName: "Quote Number",
          pivotIndex: 0,
          show: true,
          cellRenderer: "quoteNameRenderer",
          primaryField: true
        }]
      }
      else {
        let currentColumn = getColumnData(renderedFrom, o?.fieldData, `${routes.quoteBuilder.path}/detail`)
        if (currentColumn !== null) {
          columns = [...columns, currentColumn?.columnData]
          if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
            rendererNames.push(currentColumn?.rendererName)
          }
        }
      }
    })

    let tempFrameworkComponent = getFrameworkComponents(rendererNames, true)
    tempFrameworkComponent = {
      ...tempFrameworkComponent,
      quoteNameRenderer: QuoteNameRenderer,
      relatedOpportunityRenderer: RelatedOpportunityRenderer,
      actionsRenderer: ActionsRenderer
    }
    columns = [...columns,
    {
      field: "relatedOpportunity",
      headerName: "Related Opportunity",
      show: true,
      cellRenderer: "relatedOpportunityRenderer"
    }
    ]
    setFrameWorkComponent({ ...tempFrameworkComponent })
    let staticFields = getStaticFields()
    staticFields.forEach(field => {
      columns.push(checkStaticField(routes.projectSales.title, field))
    })
    setColumns([...columns])
  }

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
    contactDetails,
    opportunityDetails,
    showFilteredRecordsOnly
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
        const newData = data.versions.map((d, index) => {
          return {
            ...d,
            id: index + 1,
            versionNumber: index + 1,
            quoteId: id,
            totalCost: formatAmountWithCurrency(
              currency,
              d?.productData?.totalCost
            ).fullFormatAmount,
            totalSalesPrice: formatAmountWithCurrency(
              currency,
              d?.productData?.totalSalesPrice
            ).fullFormatAmount,
            comment: d.comment || "",
          };
        });

        setVersionStatusData(newData);
        setLoadingVersions(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setLoadingVersions(false);
      });
  };

  const handleSingleDeleteQuote = async () => {
    dispatch({ type: "loading", loading: true });

    const savedIds = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
    localStorage.setItem(localStorageSelectedRecords, JSON.stringify(savedIds.filter(f => f !== singleQuoteDelete.id)));
    dispatch({ type: "selection", selectedRecords: selectedRecords.filter(f => f._id !== singleQuoteDelete.id) });

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
    <>
      <Link
        className="text-truncate link"
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
    </>
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
    <>{quotePermissions?.isCreate ?
      (<Tooltip
        title={"Clone"} >
        <IconButton
          size="small"
          aria-label="Clone"
          onClick={() => {
            handleShowCloneQuoteDialog()
            setClonedId(params.data?._id)
          }}
        >
          <FileCopyIcon fontSize="small" color="primary" />
        </IconButton>
      </Tooltip>) : (
        <Tooltip className="cursor-stop" title="You do not have permission to clone/create">
          <IconButton aria-label="Clone" size="small">
            <FileCopyIcon />
          </IconButton>
        </Tooltip>
      )
    }

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

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}&filterQuotes=${selectedType}`;

    if (isExport) {
      deepFilter = `filterQuotes=${selectedType}`;
    }

    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

    if (showFilteredRecordsOnly) {
      const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
      deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map(m => m._id))}`;
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

    if (contactDetails.contactId) {
      if (contactDetails.resource === customerContact.contactResource) {
        deepFilter = `${deepFilter}&filterById=${JSON.stringify([
          {
            field: replaceFieldName("customerContactName"),
            term: contactDetails.contactId,
          },
        ])}`;
      } else if (contactDetails.resource === supplierContact.contactResource) {
        deepFilter = `${deepFilter}&filterById=${JSON.stringify([
          {
            field: replaceFieldName("supplierContactName"),
            term: { $in: [contactDetails.contactId] },
          },
        ])}`;
      }
    }

    if (opportunityDetails.opportunityId) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify([
        {
          field: "opportunity",
          term: opportunityDetails.opportunityId
        }
      ])}`
    }

    if (!isObjectEmpty(filters)) {
      const updatedFilters = [];

      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: replaceFieldName(field),
          term: filters[field].filter,
        });
      });
      deepFilter = `${deepFilter}&deepFilter=${encodeURI(JSON.stringify(updatedFilters))}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${replaceFieldNameForSorting(
        sorting[0].colId
      )}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURI(search)}`;
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

          let clonedData = {}
          let rows = data.map((u) => {
            clonedData = {
              ...clonedData,
              [u.quoteName]: u
            }

            let versionCount = Object.keys(u.versions).length;
            let tempStatus = "Building Quote"
            let versionArray = []
            Object.keys(u.versions).forEach(key => {
              versionArray.push(u.versions[key])
            })

            const updatedVersion = versionArray.find(v => v.status !== tempStatus)
            if (updatedVersion) {
              tempStatus = updatedVersion.status
            }

            //  Dynamic grid code - start
            let finalObject = prepareDataForGrid(u, user);

            //  Custom props which are required
            finalObject["relatedOpportunity"] = u.opportunity?.optionLabel;
            finalObject["relatedOpportunityId"] = u.opportunity?.optionValue;
            finalObject["id"] = u._id;
            finalObject["canDelete"] = u.owner?.optionValue === user?.user._id;
            finalObject["createdBy"] = u.createdBy?.user?.concatedName;
            finalObject["createdByDate"] = u.createdBy?.date;
            finalObject["updatedBy"] = u.updatedBy?.user?.concatedName;
            finalObject["updatedByDate"] = u.updatedBy?.date;
            finalObject["status"] = tempStatus;
            finalObject["versionCount"] = versionCount;
            finalObject["versionData"] = versionArray;

            finalObject["isChecked"] = selectedRecords.some(s => s._id === u._id);
            finalObject["allowedToEdit"] = (
              [...(u.collaborator ?? []), u.owner].some(
                (d) => d?.optionValue === user?.user?._id
              )
            );

            finalObject["owerCollaboratorInitialsOrImages"] = [];
            if (finalObject["owner"])
              finalObject["owerCollaboratorInitialsOrImages"].push({ initials: finalObject["owner"] });
            if (finalObject["collaborator"])
              finalObject["owerCollaboratorInitialsOrImages"].push({ initials: finalObject["collaborator"] });
            if (finalObject["restcollaborator"]?.length > 0) {
              finalObject["restcollaborator"].forEach((m: any) => {
                finalObject["owerCollaboratorInitialsOrImages"].push({ initials: m.optionLabel })
              });
            }

            finalObject["owerCollaboratorInitialsOrImages"].forEach((f) => {
              if (f.initials) {
                f.initials = f.initials.split(" ").map((i) => i[0]).join("");
              }
            })

            return finalObject;
          });


          //  Dynamic grid code - end

          setIsAllChecked(false);
          setClonedData(data)

          if (appendRows) {
            dispatch({
              type: "initialize", data: [...dataRows, ...rows],
              count: count, selectedRecords: [...dataRows, ...rows].filter(f => f.isChecked === true)
            });
          } else {
            dispatch({
              type: "initialize", data: rows, count: count,
              selectedRecords: rows.filter(f => f.isChecked === true)
            });
          }

          if (gridApi) {
            try {
              let oldSelectedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : []
              if (oldSelectedRecords.length > 0) {
                gridApi.forEachNode(function (node) {
                  node.setSelected(
                    oldSelectedRecords.some((o) => o === node.data._id)
                  );
                });
              }
            } catch (ex) {
              console.error("Error in getting selected records from local storage")
            }
          }

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

          let storedSelectedIds = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
          recordsToDelete.forEach((idToDeleteFromLocalStorage) => {
            storedSelectedIds = storedSelectedIds.filter(id => id !== idToDeleteFromLocalStorage)
          })
          localStorage.setItem(localStorageSelectedRecords, JSON.stringify(storedSelectedIds));
          removeLocalStorage(localStorageSelectedRecords)
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

  const handleCloneQuoteWithVersionFromAllVersion = (quoteId, versionNumber) => {
    setCloneQuoteWithVersionNumber(versionNumber);
    setshowCreateQuoteDialog(true);
    setIsClone(true)
    setClonedId(quoteId)
    setShowVersionsDialog(false);
  };

  return (
    <div className="quote_index_page">
      <Fragment>
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
                    isExportAllOrSomeFeature={true}
                    total={rowCount}
                    recordsToExport={getLocalStorageArrayData(localStorageSelectedRecords).length}
                    ids={getLocalStorageArrayData(localStorageSelectedRecords)?.map(m => m._id)}
                    onExportToExcelSuccess={() => {
                      if (gridApi) gridApi.deselectAll()
                      else fetchQuoteBuilder()
                    }}
                    additionalParams={getQueryString(true)}
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
              columns={columns}
              dispatch={dispatch}
              filters={filters}
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
              {contactDetails.contactId && (
                <Chip
                  className="ml-3"
                  color="primary"
                  label={`Contact: ${contactDetails.contactName}`}
                  onDelete={() => {
                    setContactDetails({
                      contactId: null,
                      contactName: null,
                      resource: null,
                    });
                  }}
                />
              )}

              {opportunityDetails.opportunityId && (
                <Chip
                  className="ml-3"
                  color="primary"
                  label={`Opportunity: ${opportunityDetails.opportunityName}`}
                  onDelete={() => {
                    setOpportunityDetails({
                      opportunityId: null,
                      opportunityName: null
                    });
                  }}
                />
              )}
            </QuoteHeader>
          </div>
          {
            isMobile && !isTablet ?
              <CustomSwipableList
                allowSelection={true}
                allowSwipe={true}
                permissions={permissions.quoteBuilder}
                primaryField={columns?.find(d => d.primaryField)}
                onClick={(data) => {
                  history.push(`${routes.quoteBuilderDetail.path}/${data._id}`)
                }}
                dataRows={dataRows}
                selectedRecords={selectedRecords}
                dispatch={dispatch}
                onEdit={(data) => {
                  history.push(`${routes.quoteBuilderDetail.path}/${data._id}?openEdit=true`)
                }}
                extraParamsToCheckDelete={true}
                onDelete={(data) => {
                  setSingleQuoteDelete({
                    show: true,
                    id: data._id,
                    quoteName: `${data.quoteName}`,
                  })
                }}
                rowCount={rowCount}
                page={page}
                loading={loading}
                additionalDetails={[
                  {
                    icon: <FaSuitcase size={18} />,
                    field: "customerAccountName"
                  },
                  {
                    icon: <BiDollar size={18} />,
                    field: "estimatedAmount"
                  }
                ]}
                chips={[
                  {
                    icon: <GoVersions />,
                    label: "Version(s): ",
                    field: "versionCount",
                    onClick: (data) => {
                      setShowVersionsDialog(true)
                      getVersionStatus(data._id, data.currency)

                    }
                  },
                  {
                    icon: <SiStatuspage />,
                    label: "Status: ",
                    field: "status",
                    chipColorVariable: quoteStepColors

                  },
                  {
                    icon: <AiFillFileMarkdown />,
                    label: "Market:",
                    field: "marketSegment"

                  },
                  {
                    icon: <SiMarketo />,
                    label: "Sub-Market:",
                    field: "subMarketSegment"

                  },

                ]}
                owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
                onCreate={false}
                showClone={false}
                onClone={() => { }}
                renderedFrom={renderedFrom}
              /> : (
                Object.keys(frameWorkComponent).length > 0 ?
                  <CustomAgGrid
                    columns={columns}
                    dataRows={dataRows}
                    frameworkComponents={frameWorkComponent}
                    setGridApi={setGridApi}
                    dispatch={dispatch}
                    rowCount={rowCount}
                    limit={limit}
                    pageSizes={pageSizes}
                    page={page}
                    actionWidth={100}
                    loading={loading}
                    renderedFrom={renderedFrom}
                    refreshGrid={fetchQuoteBuilder}
                    showOnlyShowFilteredRecordSwitch={true}
                  /> : null
              )
          }

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
      </Fragment>

      {showCreateQuoteDialog && (
        <ManageQuoteDialog
          open={showCreateQuoteDialog}
          onSuccess={onSuccess}
          onClose={() => {
            setshowCreateQuoteDialog(false);
            setIsClone(false)
            setClonedId(null)
          }}
          isNew={isClone ? false : true}
          dataToUpdate={isClone ? clonedId && clonedData ? clonedData.filter(o => o._id === clonedId)[0] : clonedData.filter(o => o._id === selectedRecords[0]._id)[0] : null}
          isClone={isClone ? true : false}
          resource={null}
          isRedirectTodetailPage={isClone ? false : true}
          contactId={null}
          opportunityId={null}
          disableOwnerDropDown={true}
          contacts={null}
          doaCollaboratorResources={doa}
          isRenderedFromOpportunity={false}
          cloneQuoteWithVersionNumber={cloneQuoteWithVersionNumber}
        />
      )}


      {showVersionsDialog && (
        <CustomDialogComponent
          title="All Version Status"
          open={showVersionsDialog}
          onClose={() => {
            setShowVersionsDialog(false);
            setVersionStatusData([])
          }}
        >
          {
            versionStatusData.length === 0 ?
              <CommonSkeleton lenArray={arr} />
              :
              <VersionStatus
                handleCloneQuoteWithVersionFromAllVersion={handleCloneQuoteWithVersionFromAllVersion}
                versionStatusData={versionStatusData} />
          }
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
    </div>
  );
};

export default QuoteBuilders;
