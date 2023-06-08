import { useState, useEffect, useContext, useReducer } from 'react';
import { Grid, Chip } from '@material-ui/core';
import { Link } from 'react-router-dom';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import { displayDate } from '../../services/util';
import OpportunitiesHeader from './OpportunitiesHeader';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import MessageDialog from '../../components/Helpers/MessageDialog';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { GiHiveMind } from 'react-icons/gi';
import ManageOpportunityDialog from './ManageOpportunityDialog';
import { opportunity, isObjectEmpty, customerAccount, supplierAccount, gridLoadingTimeout, sidebarResource } from '../../constants/helpers';
import NoDataCell from '../../components/Helpers/NoDataCell';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import CustomContainer from '../../components/CustomContainer';
import { useHistory } from 'react-router-dom';
import GridDeleteIcon from '../../components/Helpers/GridDeleteIcon';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import './style.scss';
import TransferEntityDialog from '../../components/AssignRolesDialog/TransferEntityDialog';
import Tooltip from "@material-ui/core/Tooltip"
import IconButton from "@material-ui/core/IconButton"
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { prepareDataForGrid } from "../../constants/helpers"
import { SiMarketo, AiFillFileMarkdown, FaPercentage } from "react-icons/all";
import CustomSwipableList from "../../components/SwipableListComponents/CustomSwipableList";
import { isMobile, isTablet } from 'react-device-detect';
import { FaSuitcase } from 'react-icons/fa';
import useColumns, { getFrameworkComponents, checkStaticField, getStaticFields, gridFilterParser } from '../../constants/useColumns';
import HtmlTooltip from 'src/components/CustomTooltipTitle';


let opportunityTimeout;


const Opportunities = () => {

  const OpportunityTypes = [
    {
      key: `All ${routes.opportunity.title}`,
      value: 1
    },
    {
      key: `My ${routes.opportunity.title}`,
      value: 2
    }
  ];

  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, selectedEntity, permissions }
  }: any = useData();
  const { getColumnData } = useColumns();
  const { opportunityResource, opportunityApi } = opportunity;
  const [selectedType, setSelectedType] = useState(1);
  const [renderCount, setRenderCount] = useState(0);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState<any>({});
  const [opportunityPermissions, setOpportunityPermissions] = useState({
    isCreate: permissions[opportunityResource]?.isCreate,
    isUpdate: permissions[opportunityResource]?.isUpdate,
    isRead: permissions[opportunityResource]?.isRead,
    isDelete: permissions[opportunityResource]?.isDelete
  });
  const [showCreateOpportunityDialog, setShowCreateOpportunityDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false);
  const [singleOpportunityDelete, setSingleOpportunityDelete] = useState({
    id: null,
    show: false,
    opportunityName: ''
  });
  const [accountDetails, setAccountDetails] = useState({
    accountId: history.location?.state?.accountId,
    accountName: history.location?.state?.accountName,
    resource: history.location?.state?.resource
  });
  const [showTransferEntityDialog, setShowTransferEntityDialog] = useState(false);
  const [frameWorkComponent, setFrameWorkComponent] = useState({})
  const [columns, setColumns] = useState([])

  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows } = state;
  const columnState = JSON.parse(localStorage.getItem(opportunityResource));
  const [isAllChecked, setIsAllChecked] = useState(false);
  const [clonedData, setClonedData] = useState([])
  const localStorageSelectedRecords = `${opportunityResource}_selected`;

  if (columnState) {
    columns.map((item) => {
      columnState.map((d) => {
        if (d.colId === item.field) {
          item.show = !d.hide;
        }
      });
    });
  }

  //  Grid Variables - End
  useEffect(() => {
    fetchGridColumns()
  }, [])

  const fetchGridColumns = async () => {

    const response = await axiosInstance()
      .get(`/field?resource=Opportunity&entity=${selectedEntity}&view=true`)

    let data = response?.data?.data

    let columns = []
    let rendererNames = []
    data.forEach(o => {
      if (["firstName"].find(d => d === o?.fieldData?.fieldName)) {
        columns = [...columns, {
          disabled: true,
          field: "opportunityName",
          headerName: "Opportunity Name",
          pivotIndex: 0,
          show: true,
          cellRenderer: "rendererName",
          primaryField: true
        }]
      }
      else {
        let currentColumn = getColumnData(opportunityResource, o?.fieldData, routes.opportunityDetail.path)
        if (currentColumn !== null) {
          columns = [...columns, currentColumn?.columnData]
          if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
            rendererNames.push(currentColumn?.rendererName)
          }
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
      columns.push(checkStaticField(routes.projectSales.title, field))
    })
    setColumns([...columns])
  }

  useEffect(() => {
    if (permissions && permissions[opportunityResource]) {
      setOpportunityPermissions(permissions[opportunityResource]);
    }

    return () => {
      setOpportunityPermissions(null);
    };
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
  }, [page, limit, selectedType, filters, sorting, selectedEntity, accountDetails]);

  const handleSingleDeleteOpportunity = async () => {
    dispatch({ type: 'loading', loading: true });

    axiosInstance()
      .put(`${opportunityApi}/remove?entity=${selectedEntity}`, {
        ids: [singleOpportunityDelete.id]
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchOpportunities();
        dispatch({ type: 'loading', loading: false });
        setSingleOpportunityDelete({ id: null, show: false, opportunityName: '' });
      })
      .catch((error) => {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(error);
      });
  };

  const OpportunityNameRenderer = (params) => (
    <Link className="link" title={params.value} to={`${routes.opportunityDetail.path}/${params.data._id}`}>
      {params.value}
    </Link>
  );

  const CustomerAccountNameRenderer = (params) => (
    <Link className="link" title={params.value} to={`${routes.customerAccount.path}/detail/${params.data.customerAccountId}`}>
      {params.value}
    </Link>
  );

  const SupplierAccountNameRenderer = (params) =>
    params.value ? (
      <>
        <h5 className="createBy d-flex">
          <Link className="link" title={params.value} to={`${routes.supplierAccount.path}/detail/${params.data.supplierAccountId}`}>
            {params.value}
          </Link>
          {params.data.restSupplierAccounts.length > 0 && (
            <span className="createdAtTime badge-date">{`+${params.data.restSupplierAccounts.length} more..`}</span>
          )}
        </h5>
      </>
    ) : (
      <NoDataCell />
    );

  const ActionsRenderer = (params) => (
    <>
      {opportunityPermissions?.isCreate ? (
        <HtmlTooltip
          className={opportunityPermissions?.isCreate ? "" : "cursor-stop"}
          title={opportunityPermissions?.isCreate ? "Clone" : "You do not have permission to clone/create"} >
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              setShowCreateOpportunityDialog({ open: true, isClone: true, idToClone: params.data._id })
            }}
          >
            <FileCopyIcon fontSize="small" color="primary" />
          </IconButton>
        </HtmlTooltip>) : (
        <HtmlTooltip
          className={"cursor-stop"}
          title={"You do not have permission to clone/create"} >
          <IconButton
            size="small"
            aria-label="Clone"
          >
            <FileCopyIcon fontSize="small" />
          </IconButton>
        </HtmlTooltip>
      )}


      <GridDeleteIcon
        hasDeletePermission={opportunityPermissions.isDelete}
        ownerId={params.data.ownerId}
        userId={user?.user?._id}
        onDelete={() =>
          setSingleOpportunityDelete({
            show: true,
            id: params.data._id,
            opportunityName: `${params.data.opportunityName}`
          })
        }
        entity="opportunity"
      />
    </>
  );

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (selectedType === 2) {
      deepFilter = deepFilter + `&myRecords=1`;
    }
    if (isExport) {
      deepFilter = `?`;
    }
    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters)

    if (accountDetails.accountId) {
      if (accountDetails.resource === customerAccount.accountResource) {
        filterByIds.push({ field: 'customerAccount', term: accountDetails.accountId })
      } else if (accountDetails.resource === supplierAccount.accountResource) {
        filterByIds.push({ field: 'supplierAccount', term: { $in: [accountDetails.accountId] } })
      }
    }

    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
    }
    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURI(JSON.stringify(deepFilters))}`;
    }

    if (filterByIds?.length || deepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURI(search)}`;
    }

    return deepFilter;
  };

  const fetchOpportunities = async () => {
    if (selectedEntity) {
      const queryString = getQueryString();
      dispatch({ type: 'loading', loading: true });

      if (gridApi) {
        gridApi.setRowData([]);
      }

      axiosInstance()
        .get(`${opportunityApi}${queryString}`)
        .then(({ data: { data, count } }) => {
          let rows = data.map((u) => {

            let finalObject = prepareDataForGrid(u);

            finalObject["canDelete"] = u.owner?.optionValue === user?.user._id;
            finalObject["isChecked"] = selectedRecords.some(s => s._id === u._id);
            finalObject["allowedToEdit"] = (
              [...(u.collaborator ?? []), u.owner].some(
                (d) => d?.optionValue === user?.user?._id
              )
            );

            finalObject["owerCollaboratorInitialsOrImages"] = [];
            if (finalObject["owner"])
              finalObject["owerCollaboratorInitialsOrImages"].push({ initials: finalObject["owner"] });

            finalObject["owerCollaboratorInitialsOrImages"].forEach((f) => {
              if (f.initials) {
                f.initials = f.initials.split(" ").map((i) => i[0]).join("");
              }
            })


            let res = {
              ...finalObject,
              canDelete: u.owner?.optionValue === user?.user._id,
              stage: u.stage,
              closeDate: u?.closeDate,
            };
            return res;
          });
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


          dispatch({ type: 'initialize', data: rows, count: count });
          setTimeout(() => {
            dispatch({ type: 'loading', loading: false });
          }, gridLoadingTimeout);
        })
        .catch((error) => {
          dispatch({ type: 'loading', loading: false });
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const handleOpportunityTypeChange = (filterValues) => {
    setSelectedType(filterValues);
  };

  const handleTransferEntityDialog = () => {
    setShowTransferEntityDialog(true);
  };

  const onSuccess = () => {
    setShowCreateOpportunityDialog({ open: false, isClone: false, idToClone: null });
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
    setShowCreateOpportunityDialog({ open: true, isClone: false, idToClone: null });
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
          ids: recordsToDelete
        })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
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
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[routes.opportunity]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2}>
          <Grid container direction="row">
            <Grid item xs={12} sm={12}>
              <Grid container justify="flex-end">
                <ImportExportLinks
                  permissions={opportunityPermissions}
                  module="opportunities"
                  api={opportunityApi}
                  afterImportCompleted={() => {
                    fetchOpportunities();
                  }}
                  isExportAllOrSomeFeature={true}
                  total={rowCount}
                  recordsToExport={selectedRecords.length}
                  ids={selectedRecords.length ? selectedRecords.map((obj) => obj._id) : []}
                  onExportToExcelSuccess={() => {
                    if (gridApi) gridApi.deselectAll()
                    else fetchOpportunities()
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
          <OpportunitiesHeader
            selectedRecords={selectedRecords}
            onTypeChange={handleOpportunityTypeChange}
            options={OpportunityTypes}
            onSearch={handleSearch}
            search={search}
            opportunityPermissions={opportunityPermissions}
            onCreate={clickCreateNew}
            showConfirmBox={showConfirmBox}
            canDelete={selectedRecords.length === 0}
            icon={<GiHiveMind className="headerLogo" />}
            heading={routes.opportunity.title}
            showTransferEntityDialog={handleTransferEntityDialog}
            columns={columns}
            dispatch={dispatch}
            filters={filters}
          >
            {accountDetails.accountId && (
              <Chip
                className="ml-3"
                color="primary"
                label={`${accountDetails.resource === customerAccount.accountResource ? 'Customer' : 'Supplier'} Account: ${accountDetails.accountName
                  }`}
                onDelete={() => {
                  setAccountDetails({ accountId: null, accountName: null, resource: null });
                }}
              />
            )}
          </OpportunitiesHeader>
        </div>

        {
          Object.keys(frameWorkComponent).length > 0 ?
            isMobile && !isTablet ?


              <CustomSwipableList
                allowSelection={true}
                allowSwipe={true}
                permissions={permissions[opportunityResource]}
                primaryField={columns?.find(d => d.field)}
                onClick={(data) => {
                  history.push(`${routes.opportunityDetail.path}/${data._id}`)
                }}
                dataRows={dataRows}
                selectedRecords={selectedRecords}
                dispatch={dispatch}
                onEdit={(data) => {
                  history.push(`${routes.opportunityDetail.path}/${data._id}?openEdit=true`)
                }}
                extraParamsToCheckDelete={true}
                onDelete={(data) => {
                  setSingleOpportunityDelete({
                    show: true,
                    id: data._id,
                    opportunityName: `${data.opportunityName}`
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


                ]}
                chips={[
                  {
                    icon: <FaPercentage />,
                    label: "Probability :",
                    field: "probability"

                  },
                  {
                    icon: <AiFillFileMarkdown />,
                    label: "Market:",
                    field: "marketSegment",
                  },
                  {
                    icon: <SiMarketo />,
                    label: "Sub-Market:",
                    field: "subMarketSegment"
                  },

                ]}
                owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
                onCreate={false}
                showClone={true}
                onClone={(data) => { setShowCreateOpportunityDialog({ open: true, isClone: true, idToClone: data._id }) }}
                renderedFrom={opportunityResource}
              />
              :
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
                renderedFrom={opportunityResource}
                refreshGrid={fetchOpportunities}
                showOnlyShowFilteredRecordSwitch={true}
                showFilters={true}
                resource={sidebarResource.opportunity}
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
            message={`Are you sure you want to delete ${deleteRecord?.opportunityName ? 'Opportunity' : 'Opportunities'}   ${deleteRecord.opportunityName || ''
              }?`}
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
            message={`Are you sure you want to delete contact: ${singleOpportunityDelete.opportunityName}?`}
            onClose={() =>
              setSingleOpportunityDelete({
                id: null,
                show: false,
                opportunityName: ''
              })
            }
            onOk={handleSingleDeleteOpportunity}
          />
        ) : null}
      </CustomContainer>

      {showCreateOpportunityDialog?.open && (
        <ManageOpportunityDialog
          open={showCreateOpportunityDialog?.open}
          onSuccess={onSuccess}
          onClose={() => {
            setShowCreateOpportunityDialog({ open: false, isClone: false, idToClone: null });
          }}
          isNew={true}
          dataToUpdate={null}
          resource={null}
          isRedirectTodetailPage={true}
          isClone={showCreateOpportunityDialog?.isClone}
          opportunityId={showCreateOpportunityDialog?.idToClone}
        />
      )}
      {showTransferEntityDialog && (
        <TransferEntityDialog
          TransferEntityDialogOpen={showTransferEntityDialog}
          onSuccess={() => {
            onSuccess();
            setShowTransferEntityDialog(false);
          }}
          handleCloseDialog={() => {
            setShowTransferEntityDialog(false);
          }}
          selectedRecs={selectedRecords.map((r) => r._id)}
          entities={user.entity.filter((e) => e._id !== selectedEntity)}
          type="opportunities"
          api="opportunity"
        />
      )}
    </>
  );
};

export default Opportunities;
