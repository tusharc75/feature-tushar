import { Box, Button, Menu, MenuItem } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { useContext, useEffect, useReducer, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useHistory } from 'react-router-dom';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import TransferEntityDialog from '../../components/AssignRolesDialog/TransferEntityDialog';
import CustomContainer from '../../components/CustomContainer';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import MessageDialog from '../../components/Helpers/MessageDialog';
import { customerAccount, gridLoadingTimeout, opportunity, prepareDataForGrid, sidebarResource, supplierAccount } from '../../constants/helpers';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import ManageOpportunityDialog from './ManageOpportunityDialog';
import './style.scss';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import CustomReactTable, { checkStaticField, getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTableNew';
import { camelCase } from 'lodash';
import DeleteIcon from '@material-ui/icons/Delete';
import { cloneDisable, deleteDisable } from 'src/constants/messageHelpers';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import SearchBox from 'src/components/Helpers/SearchBox';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import styles from '../Leads/Header.module.scss';

const Opportunities = () => {
  const types = [
    {
      key: `My ${routes.opportunity.title}`,
      value: 1
    },
    {
      key: `All ${routes.opportunity.title}`,
      value: 2
    }
  ];
  const { state, dispatch } = useTableReducer();
  const renderedFrom = camelCase(routes?.opportunity.title);
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, selectedEntity, permissions }
  }: any = useData();
  const { getColumnData } = useColumns();
  const { opportunityResource, opportunityApi } = opportunity;
  const [selectedType, setSelectedType] = useState(1);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState<any>({});
  const [showCreateOpportunityDialog, setShowCreateOpportunityDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false);
  const [accountDetails, setAccountDetails] = useState({
    accountId: history.location?.state?.accountId,
    accountName: history.location?.state?.accountName,
    resource: history.location?.state?.resource
  });
  const [showTransferEntityDialog, setShowTransferEntityDialog] = useState(false);
  const [columns, setColumns] = useState(null);
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const [anchorEl, setAnchorEl] = useState(null);



  //  Grid Variables - End
  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    const response = await axiosInstance().get(`/field?resource=Opportunity&entity=${selectedEntity}&view=true`);
    let data = response?.data?.data;
    let columns = [];
    data.forEach((o) => {
      if (['firstName'].find((d) => d === o?.fieldData?.fieldName)) {
        columns = [
          ...columns,
          {
            disabled: true,
            accessor: 'opportunityName',
            header: 'Opportunity Name',
            pivotIndex: 0,
            show: true,
            primaryField: true
          }
        ];
      } else {
        let currentColumn = getColumnData(routes.opportunity.title, o?.fieldData, routes.opportunityDetail.path, true);
        if (currentColumn !== null) {
          columns = [...columns, currentColumn?.columnData];
        }
      }
      return o?.fieldData;
    });
    let staticFields = getStaticFields();
    staticFields.forEach((field) => {
      columns.push(checkStaticField(routes.opportunity.title, field));
    });
    setColumns([...columns, ActionsRenderer]);
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 100,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title={permissions?.opportunity?.isCreate ? 'Clone' : cloneDisable}  >
          <span>
            <IconButton
              disabled={permissions?.opportunity?.isCreate ? false : true}
              size="small"
              aria-label="Clone"
              onClick={() => {
                setShowCreateOpportunityDialog({ open: true, isClone: true, idToClone: row?.original?._id });
              }}
            >
              <FileCopyIcon fontSize="small" color={permissions?.opportunity?.isCreate ? 'primary' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
        <HtmlTooltip title={row?.original?.canDelete ? "Delete" : deleteDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Delete"
              disabled={row?.original?.canDelete ? false : true}
              onClick={() => {
                setDeleteRecord(row?.original);
                setIsConformDialogVisible(true);
              }
              }
            >
              <DeleteIcon fontSize="small" color={row?.original?.canDelete ? 'error' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    )
  };


  useEffect(() => {
    fetchData()
  }, [search, page, limit, selectedType, filters, sorting, selectedEntity, accountDetails, showFilteredRecordsOnly]);


  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;

    if (isExport) {
      deepFilter = `?`;
    }

    if (selectedType === 1) {
      deepFilter = deepFilter + `&myRecords=1`;
    }

    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify(selectedRecords.map((m) => m._id))}`;
    }

    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (accountDetails.accountId) {
      if (accountDetails.resource === customerAccount.accountResource) {
        filterByIds.push({ field: 'customerAccount', term: accountDetails.accountId });
      } else if (accountDetails.resource === supplierAccount.accountResource) {
        filterByIds.push({ field: 'supplierAccount', term: { $in: [accountDetails.accountId] } });
      }
    }

    if (filterByIds?.length) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify(filterByIds)}`;
    }
    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
    }

    if (filterByIds?.length || deepFilters?.length) {
      deepFilter = `${deepFilter}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
    }

    return deepFilter;
  };

  const fetchData = async () => {
    if (selectedEntity) {
      const queryString = getQueryString();
      dispatch({ type: 'loading', loading: true });
      axiosInstance()
        .get(`${opportunityApi}${queryString}`)
        .then(({ data: { data, count } }) => {
          let rows = data.map((u) => {
            let finalObject = prepareDataForGrid(u);
            finalObject['canDelete'] = u.owner?.optionValue === user?.user._id && permissions?.opportunity?.isDelete;
            finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
            let res = {
              ...finalObject,
              stage: u.stage,
              closeDate: u?.closeDate
            };
            return res;
          });
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
    dispatch({ type: 'pageChange', page: 0 });
    setSelectedType(filterValues);
  };

  const handleTransferEntityDialog = () => {
    setShowTransferEntityDialog(true);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    let ids = [];
    if (deleteRecord?._id) {
      ids.push(deleteRecord?._id);
    } else {
      ids = selectedRecords.map((o) => o._id);
    }

    axiosInstance()
      .put(`${opportunityApi}/remove?entity=${selectedEntity}`, {
        ids
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        dispatch({ type: 'selection', selectedRecords: [] });
        setIsConformDialogVisible(false);
        setDeleteLoading(false);
        setDeleteRecord(null);
        fetchData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsConformDialogVisible(false);
        setDeleteLoading(false);
      });
  };

  const handleFilter = (event, newFilter) => {
    if (newFilter != null) {
      handleOpportunityTypeChange(types.find((d) => d.key === newFilter).value);
    }
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };


  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.opportunity]} />
        <ImportExportLinks
          permissions={permissions?.opportunity}
          module="opportunities"
          api={opportunityApi}
          afterImportCompleted={() => {
            fetchData();
          }}
          isExportAllOrSomeFeature={true}
          total={rowCount}
          recordsToExport={selectedRecords?.length}
          ids={selectedRecords?.map((obj) => obj._id)}
          onExportToExcelSuccess={() => {
            fetchData();
          }}
          additionalParams={getQueryString(true)}
        />
      </div>
      <CustomContainer>
        <div className="header-panel">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 items-start">
            <div className={'d-flex flex-wrap align-items-center gap-2'}>
              <div className={`flex flex-wrap items-center gap-2 `}>
                {types && (
                  <ToggleButtonGroup
                    size="small"
                    className="ml-2"
                    value={types[selectedType - 1].key}
                    exclusive
                    onChange={handleFilter}
                  >
                    {types.map((k, index) => {
                      return (
                        <ToggleButton value={k.key} key={index}>
                          {k.key}
                        </ToggleButton>
                      );
                    })}
                  </ToggleButtonGroup>
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-[8px]  justify-end">
              <SearchBox
                onChange={handleSearch}
                className={isMobile ? styles.search_box_input : ''}
                width="242px"
                size="small"
                value={search}
                style={isMobile ? { flex: 1 } : {}}
              />
              <div className="flex gap-[8px] flex-wrap items-center">
                {permissions?.opportunity?.isCreate && (
                  <Button
                    onClick={() => {
                      setShowCreateOpportunityDialog({ open: true, isClone: false, idToClone: null });
                    }}
                    variant={'contained'}
                    size="small"
                    color="primary"
                    className={`no-shadow`}
                    startIcon={<AddOutlined />}
                  >
                    Add
                  </Button>
                )}
                <HtmlTooltip title={!selectedRecords.length ? "Please select some opportunities" : ""}>
                  <span>
                    <Button
                      variant={'outlined'}
                      color="default"
                      size="small"
                      onClick={openActions}
                      disabled={selectedRecords.length ? false : true}
                      aria-controls="action-menu"
                      className={`new-dropdown-v1`}
                      endIcon={<ExpandMore />}
                    >
                      Actions
                    </Button>
                  </span>
                </HtmlTooltip>
                <Menu
                  anchorEl={anchorEl}
                  keepMounted
                  getContentAnchorEl={null}
                  anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'left'
                  }}
                  id="action-menu"
                  open={Boolean(anchorEl)}
                  onClose={closeActions}
                >
                  <MenuItem
                    disabled={selectedRecords.every((e) => e.canDelete) ? false : true}
                    onClick={() => {
                      closeActions();
                      setIsConformDialogVisible(true);
                    }}
                  >
                    {`Delete (${selectedRecords.length})`}
                  </MenuItem>
                  <MenuItem
                    disabled={selectedRecords.find((d) => d.canDelete === false)}
                    onClick={() => {
                      closeActions();
                      handleTransferEntityDialog();
                    }}
                  >
                    {`Transfer Entity (${selectedRecords.length})`}
                  </MenuItem>
                </Menu>
              </div>
            </div>
          </div>
        </div>
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            onSelect={() => { }}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={true}
            resource={sidebarResource.opportunity}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}

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
            message={`Are you sure you want to delete ${routes.opportunity.title}${selectedRecords.length ? "s" : ""}   ${deleteRecord.opportunityName || ''
              }?`}
            onClose={() => {
              setDeleteRecord(null);
              setIsConformDialogVisible(false);
            }}
            okBtnLoading={deleteLoading}
            onOk={handleDelete}
          />
        ) : null}
      </CustomContainer>

      {showCreateOpportunityDialog?.open && (
        <ManageOpportunityDialog
          open={showCreateOpportunityDialog?.open}
          onSuccess={() => {
            setShowCreateOpportunityDialog({ open: false, isClone: false, idToClone: null });
            fetchData();
          }}
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
            setShowCreateOpportunityDialog({ open: false, isClone: false, idToClone: null });
            fetchData();
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
    </section>
  );
};

export default Opportunities;
