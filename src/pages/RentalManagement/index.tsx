import { useState, useEffect, useContext, useReducer, Fragment } from "react";
import { Grid, Chip, IconButton, Tooltip } from "@material-ui/core";
import queryString from 'query-string';
import { useData } from "../../StateProvider/Provider";
import axiosInstance from "../../axios/axiosInstance";
import ConfirmationDialog from "../../components/Helpers/ConfirmationDialog";
import MessageDialog from "../../components/Helpers/MessageDialog";
import CustomBreadCrumbs from "./../../components/CustomBreadCrumbs";
import routes from "./../../components/Helpers/Routes";
import { getLocalStorageArrayData, prepareDataForGrid } from "../../constants/helpers"
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import { FaRegistered, FaSuitcase } from "react-icons/fa";
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
import GridDeleteIcon from "../../components/Helpers/GridDeleteIcon";
import CustomAgGrid, {
  reducer,
  intialState,
} from "../../components/AgGridComponents/CustomAgGrid";
import RentalManagementHeader from "./RentalManagementHeader";
import ManageRentalManagementDialog from "./ManageRental/ManageRentalManagementDialog";
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { CustomOfflineContext } from "../../StateProvider/OfflineContext/OfflineContext";
import HideWhenOffline from "../../components/HideWhenOffline";
import useColumns, { getStaticFields, getFrameworkComponents, checkStaticField } from "../../constants/useColumns"
import { camelCase } from "lodash";
import { isMobile, isTablet } from 'react-device-detect'
import CustomSwipableList from "../../components/SwipableListComponents/CustomSwipableList";
import { setUpindexDB, objectStore, insertUpdate, findAll, findOne } from '../../constants/indexdbhelper';

let rentalManagementTimeout;
const RentalManagementType = [
  {
    key: `All ${routes.rentalManagement.title}`,
    value: 1,
  },
  {
    key: `My ${routes.rentalManagement.title}`,
    value: 2,
  },
];

const renderedFrom = "rental_management";
const localStorageSelectedRecords = `${renderedFrom}_selected`

const RentalManagement = () => {

  const toastConfig = useContext(CustomToastContext);
  const { isOffline } = useContext(CustomOfflineContext);

  const pageTitle = camelCase(`${routes.rentalManagement.title}`)
  const history = useHistory();
  const { type }: any = queryString.parse(history.location.search);

  const { state: { user, permissions, selectedEntity } }: any = useData();
  const { getColumnData } = useColumns();
  const [locationKeys, setLocationKeys] = useState([])
  const [selectedType, setSelectedType] = useState(type ? parseInt(type) : 1);
  const [renderCount, setRenderCount] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [showTransferEntityDialog, setShowTransferEntityDialog] = useState(false)
  const [frameWorkComponent, setFrameWorkComponent] = useState({})
  const [columns, setColumns] = useState([])
  const [deleteRecord, setDeleteRecord] = useState<any>({});
  const [showManageRentalManagementDialog, setShowManageRentalManagementDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] =
    useState(false);
  const [singleRentalManagementDelete, setSingleRentalManagementDelete] = useState({
    id: null,
    show: false,
    rentalJobName: "",
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
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } = state;

  useEffect(() => {
    setUpindexDB()
    fetchGridColumns()
  }, [])

  useEffect(() => {
    return history.listen(location => {
      const { type }: any = queryString.parse(history.location.search);
      if (history.action === 'PUSH') {
        setLocationKeys([location.key])
      }
      if (history.action === 'POP') {
        if (locationKeys[1] === location.key) {
          setLocationKeys(([_, ...keys]) => keys)
          // Handle forward event
          setSelectedType(type ? parseInt(type) : 1)

        } else {
          setLocationKeys((keys) => [location.key, ...keys])
          // Handle back event
          setSelectedType(type ? parseInt(type) : 1)

        }
      }
    })
  }, [locationKeys])

  const fetchGridColumns = async () => {
    let data
    if (isOffline) {
      data = await findOne(objectStore.resource, objectStore.rentalManagement)
    }
    else {
      const response = await axiosInstance().get(`/field?resource=Rental Management&entity=${selectedEntity}&view=true`)
      data = response?.data?.data
      try {
        insertUpdate(objectStore.resource, objectStore.rentalManagement, data);
      } catch (ex) {
        console.error(`Rental Management: Error while storing data for Offline context. Error: ${ex.message}`)
      }
    }
    let columns = []
    let rendererNames = []
    data.forEach(o => {
      let currentColumn = getColumnData(pageTitle, o?.fieldData, routes.rentalManagementDetail.path)
      if (currentColumn !== null) {
        if (isOffline) {
          currentColumn.columnData["filter"] = false
          currentColumn.columnData["sortable"] = false
        }
        columns = [...columns, currentColumn?.columnData]
        if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
          rendererNames.push(currentColumn?.rendererName)
        }
      }
      return o?.fieldData
    })
    let tempFrameworkComponent = getFrameworkComponents(rendererNames, true)
    tempFrameworkComponent = {
      ...tempFrameworkComponent,
      actionsRenderer: ActionsRenderer
    }
    setFrameWorkComponent({ ...tempFrameworkComponent })
    let staticFields = getStaticFields()
    staticFields.forEach(field => {
      columns.push(checkStaticField(pageTitle, field))
    })
    setColumns([...columns])
  }

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;
    if (rentalManagementTimeout) {
      clearTimeout(rentalManagementTimeout);
    }
    rentalManagementTimeout = setTimeout(() => {
      fetchRentalManagement();
    }, millisec);
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchRentalManagement();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, selectedType, filters, sorting, accountDetails, selectedEntity, isOffline, showFilteredRecordsOnly]);

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
        setSingleRentalManagementDelete({ id: null, show: false, rentalJobName: "" });
      })
      .catch((error) => {
        dispatch({ type: "loading", loading: false });
        toastConfig.setToastConfig(error);
      });
  };

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

      {/* <HideWhenOffline>
        <GridDeleteIcon
          hasDeletePermission={permissions.rentalManagement.isDelete}
          ownerId={params.data.ownerId}
          userId={user?.user?._id}
          onDelete={() =>
            setSingleRentalManagementDelete({
              show: true,
              id: params.data._id,
              rentalJobName: `${params.data.rentalJobName}`,
            })
          }
          entity="rentalManagement"
        />
      </HideWhenOffline> */}
    </>
  );

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

    if (showFilteredRecordsOnly) {
      const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
      deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map(m => m._id))}`;
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
    try {
      let data: any = [], count;
      if (!isOffline) {
        const response: any = await axiosInstance().get(`${rentalManagementApi}${queryString}`);
        data = response?.data?.data;
        count = response?.data?.count;
      }
      else {
        data = await findAll(objectStore.rentalManagement);
        count = data?.length || 0;
      }
      let rows = data.map((u) => {
        let finalObject = prepareDataForGrid(u, user);
        finalObject["canDelete"] = u.owner?.optionValue === user?.user._id;
        finalObject["isChecked"] = false;
        finalObject["allowedToEdit"] = true;
        finalObject["owerCollaboratorInitialsOrImages"] = [];
        if (finalObject["owner"])
          finalObject["owerCollaboratorInitialsOrImages"].push({ initials: finalObject["owner"] }); finalObject["owerCollaboratorInitialsOrImages"].forEach((f) => {
            if (f.initials) {
              f.initials = f.initials.split(" ").map((i) => i[0]).join("");
            }
          })
        return finalObject;
      });
      if (appendRows) {
        dispatch({ type: "initialize", data: [...dataRows, ...rows], count: count });
      } else {
        dispatch({ type: "initialize", data: rows, count: count });
      }
      setTimeout(() => {
        dispatch({ type: "loading", loading: false });
      }, gridLoadingTimeout);
    } catch (error) {
      dispatch({ type: "loading", loading: false });
      toastConfig.setToastConfig(error);
    }
  }

  const handleSearch = (e) => {
    dispatch({ type: "search", search: e.target.value });
  }

  const handleRentalManagementTypeSel = (filterValues) => {
    setSelectedType(filterValues);
    history.push(`?type=${filterValues}`)
  }

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
                    isExportAllOrSomeFeature={true}
                    total={rowCount}
                    recordsToExport={getLocalStorageArrayData(localStorageSelectedRecords).length}
                    ids={getLocalStorageArrayData(localStorageSelectedRecords)?.map(m => m._id)}
                    onExportToExcelSuccess={() => {
                      if (gridApi) gridApi.deselectAll()
                      else fetchRentalManagement()
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
              selectedType={selectedType}
              selectedRecords={selectedRecords}
              onTypeChange={handleRentalManagementTypeSel}
              options={RentalManagementType}
              onSearch={handleSearch}
              searchVal={search}
              RentalManagementPermissions={permissions.rentalManagement}
              onCreate={clickCreateNew}
              showConfirmBox={showConfirmBox}
              icon={<FaRegistered className="headerLogo" />}
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

          {
            Object.keys(frameWorkComponent).length > 0 ?
              isMobile ?
                <CustomSwipableList
                  allowSelection={true}
                  allowSwipe={true}
                  permissions={permissions.rentalManagement}
                  primaryField={columns?.find(d => d.primaryField)}
                  onClick={(data) => {
                    history.push(`${routes.rentalManagementDetail.path}/${data._id}`)
                  }}
                  dataRows={dataRows}
                  selectedRecords={selectedRecords}
                  dispatch={dispatch}
                  onEdit={(data) => {
                    history.push(`${routes.rentalManagementDetail.path}/${data._id}?openEdit=true`)
                  }}
                  extraParamsToCheckDelete={true}
                  onDelete={(data) => {
                    setSingleRentalManagementDelete({
                      show: true,
                      id: data._id,
                      rentalJobName: `${data.rentalJobName}`,
                    })
                  }}
                  rowCount={rowCount}
                  page={page}
                  loading={loading}
                  chips={[
                    {
                      label: "Status: ",
                      field: "status",
                    }
                  ]}
                  additionalDetails={[
                    {
                      icon: <FaSuitcase size={18} />,
                      field: "customerAccount"
                    },
                  ]}
                  owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
                  onCreate={false}
                  showClone={true}
                  onClone={(data) => { setShowManageRentalManagementDialog({ open: true, isClone: true, idToClone: data._id }) }}
                  renderedFrom={pageTitle}
                /> :
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
                  allowSelection={!isOffline}
                  isClientSideGrid={isOffline}
                  refreshGrid={fetchRentalManagement}
                  showOnlyShowFilteredRecordSwitch={true}
                /> : null
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
              message={`Are you sure you want to delete selected ${routes.rentalManagement.title.toLowerCase()} ?`}
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
              message={`Are you sure you want to delete this ${routes.rentalManagement.title.toLowerCase()} ${singleRentalManagementDelete ? singleRentalManagementDelete?.id ? singleRentalManagementDelete?.rentalJobName : "" : ""}?`}
              onClose={() =>
                setSingleRentalManagementDelete({
                  id: null,
                  show: false,
                  rentalJobName: "",
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
              if (!isOffline) {
                fetchRentalManagement();
              }
              setShowManageRentalManagementDialog({ open: false, isClone: false, idToClone: null });
            }}
          />
        )}
    </>
  );
};

export default RentalManagement;
