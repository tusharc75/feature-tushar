import React, { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import { IconButton, Box, Button, Menu, MenuItem } from '@material-ui/core';
import { Link, useHistory } from 'react-router-dom';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import axiosInstance from '../../axios/axiosInstance';
import { useData } from '../../StateProvider/Provider';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import MessageDialog from '../../components/Helpers/MessageDialog';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { gridLoadingTimeout, processFieldName, sidebarResource } from '../../constants/helpers';
import ManageLeadDialog from './ManageLeadDialog/ManageLeadDialog';
import { lead, prepareDataForGrid } from '../../constants/helpers';
import NoDataCell from '../../components/Helpers/NoDataCell';
import { SiConvertio } from 'react-icons/si';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import CustomContainer from '../../components/CustomContainer';
import './style.scss';
import TransferEntityDialog from '../../components/AssignRolesDialog/TransferEntityDialog';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTableNew';
import { camelCase } from 'lodash';
import { cloneDisable, deleteDisable } from 'src/constants/messageHelpers';
import DeleteIcon from '@material-ui/icons/Delete';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import SearchBox from 'src/components/Helpers/SearchBox';
import { isMobile } from 'react-device-detect';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import styles from '../Leads/Header.module.scss';

const Leads = () => {
  const LeadTypes = [
    {
      key: `My ${routes.lead.title}`,
      value: 1
    },
    {
      key: `All ${routes.lead.title}`,
      value: 2
    }
  ];
  const { state, dispatch } = useTableReducer();
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = camelCase(routes?.lead.title);

  const {
    state: { user, selectedEntity, permissions }
  }: any = useData();
  const { getColumnData } = useColumns();
  const [selectedType, setSelectedType] = useState(1);
  const [isOpen, setIsOpen] = useState({ open: false, isClone: false, idToClone: null });
  const [okButtonLoading, setOkButtonLoading] = useState(false);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [messageDialog, setMessageDialog] = useState({ open: false, message: '' });
  const [showTransferEntityDialog, setShowTransferEntityDialog] = useState(false);
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const [columns, setColumns] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [convertLeadToOpportunityConfirmationDialog, setConvertLeadToOpportunityConfirmationDialog] = useState({
    open: false,
    id: null,
    leadName: null,
    message: null
  });
  const hasPermissionToConvertInOpportunity = user?.user?.permissions?.convertLeadToOpportunity;

  useEffect(() => {
    fetchGridColumns();
  }, []);


  useEffect(() => {
    fetchData();
  }, [search, page, limit, selectedType, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${sidebarResource.lead}&view=true`);
    data = response?.data?.data;
    let columns = [];
    data?.forEach((o) => {
      let currentColumn = getColumnData(lead.leadResource, o?.fieldData, routes.leadDetail.path, true);
      if (currentColumn !== null) {
        columns = [...columns, currentColumn?.columnData];
      }
    });
    columns = [
      ...columns,
      {
        accessor: 'relatedOpportunity', Header: 'Related Opportunity', show: true,
        Cell: ({ row }) => (
          <>
            {row.original?.relatedOpportunity ? (
              <Link className="link" to={`${routes.opportunityDetail.path}/${row.original?.relatedOpportunityId}`} title={row.original?.relatedOpportunity}>
                {row.original?.relatedOpportunity}
              </Link>
            ) : (
              <NoDataCell />
            )}</>
        )
      },
      ...getStaticFields()
    ];
    setColumns([...columns, ActionsRenderer]);
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 150,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title={permissions?.lead?.isCreate ? 'Clone' : cloneDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Clone"
              onClick={() => {
                setIsOpen({ open: true, isClone: true, idToClone: row?.original._id });
              }}
            >
              <FileCopyIcon fontSize="small" color={permissions?.lead?.isCreate ? 'primary' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
        {hasPermissionToConvertInOpportunity && generateLeadToOpportunityButton(row?.original)}
        <Box ml={1}>
          <HtmlTooltip title={row?.original?.canDelete && !row?.original?.convertedToOpportunity ? "Delete" : deleteDisable}>
            <span>
              <IconButton
                size="small"
                aria-label="Delete"
                disabled={row?.original?.canDelete && !row?.original?.convertedToOpportunity ? false : true}
                onClick={() => {
                  setDeleteRecord(row?.original);
                  setIsConformDialogVisible(true);
                }}
              >
                <DeleteIcon fontSize="small" color={row?.original?.canDelete && !row?.original?.convertedToOpportunity ? 'error' : 'disabled'} />
              </IconButton>
            </span>
          </HtmlTooltip>
        </Box>
      </>
    )
  }

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (selectedType === 1) {
      deepFilter = deepFilter + `&myRecords=1`;
    }
    if (isExport) {
      deepFilter = `?`;
    }
    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify(selectedRecords.map((m) => m._id))}`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);

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

      try {
        let data, count;
        const response: any = await axiosInstance().get(`${lead.leadApi}${queryString}`);
        data = response?.data?.data;
        count = response?.data?.count;
        let rows = data.map((u) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['canDelete'] = u.ownerId === user?.user._id && permissions?.lead?.isDelete;
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          let res = {
            ...finalObject,
            isAllowedToUpdate: [...(u.collaborator ?? []), u.owner].some((d) => d?.optionValue === user?.user?._id),
            convertedToOpportunity: u.staticData && u.staticData.convertedToOpportunity,
            relatedOpportunity: u.staticData && u.staticData.convertedToOpportunity && u.staticData.opportunity?.opportunityName,
            relatedOpportunityId: u.staticData && u.staticData.convertedToOpportunity && u.staticData.opportunity?._id
          };
          return res;
        });
        dispatch({ type: 'initialize', data: rows, count: count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      } catch (error) {
        dispatch({ type: 'loading', loading: false });
        toastConfig.setToastConfig(error);
      }
    }
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const handleLeadTypeSel = (filteredValue) => {
    dispatch({ type: 'pageChange', page: 0 });
    setSelectedType(filteredValue);
  };

  const handleTransferEntityDialog = () => {
    setShowTransferEntityDialog(true);
  };

  const handleClose = () => {
    setIsOpen({ open: false, isClone: false, idToClone: null });
    fetchData();
  };

  const generateLeadToOpportunityButton = ({ _id, concatedName, convertedToOpportunity, [processFieldName]: leadProcess, isAllowedToUpdate }) => {
    let dontHavePermissions = [];

    if (!permissions['customerAccount'].isCreate) {
      dontHavePermissions.push('Customer Account');
    }
    if (!permissions['customerContact'].isCreate) {
      dontHavePermissions.push('Customer Contact');
    }
    if (!permissions['opportunity'].isCreate) {
      dontHavePermissions.push('Opportunity');
    }

    const isCurrentLeadStatusQualified = leadProcess && leadProcess.toLowerCase() === 'qualified';

    return dontHavePermissions.length > 0 ? (
      <>
        <HtmlTooltip
          className="cursor-stop"
          title={`To convert lead to opportunity, you must need create permission of ${dontHavePermissions.join(', ')}`}
        >
          <IconButton size='small' aria-label="Convert to opportunity">
            <SiConvertio size={18} />
          </IconButton>
        </HtmlTooltip>
      </>
    ) : convertedToOpportunity ? (
      <>
        <HtmlTooltip className="cursor-stop" title="This lead is already converted to opportunity">
          <IconButton size='small' aria-label="Convert to opportunity">
            <SiConvertio size={18} />
          </IconButton>
        </HtmlTooltip>
      </>
    ) : !isAllowedToUpdate ? (
      <>
        <HtmlTooltip className="cursor-stop" title="You are not allowed to convert as you are neither owner nor collaborator">
          <IconButton size='small' aria-label="Convert to opportunity">
            <SiConvertio size={18} />
          </IconButton>
        </HtmlTooltip>
      </>
    ) : !isCurrentLeadStatusQualified ? (
      <>
        <HtmlTooltip className="cursor-stop" title="To covert this lead to opportunity, Lead status must be qualified">
          <IconButton size='small' aria-label="Convert to opportunity">
            <SiConvertio size={18} />
          </IconButton>
        </HtmlTooltip>
      </>
    ) : (
      <HtmlTooltip title="Convert to opportunity">
        <IconButton
          size='small'
          aria-label="Convert to opportunity"
          onClick={() => {
            setConvertLeadToOpportunityConfirmationDialog({
              open: true,
              id: _id,
              leadName: concatedName,
              message: `Are you sure you want to convert ${concatedName} to opportunity?`
            });
          }}
        >
          <SiConvertio size={18} className="text-primary" />
        </IconButton>
      </HtmlTooltip>
    );
  };

  const handleDelete = async () => {
    setOkButtonLoading(true);
    let ids = [];
    if (deleteRecord?._id) {
      ids.push(deleteRecord?._id);
    } else {
      selectedRecords.forEach((obj) => {
        ids.push(obj._id);
      });
    }
    axiosInstance()
      .put(`${lead.leadApi}/remove?entity=${selectedEntity}`, { ids })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        dispatch({ type: 'selection', selectedRecords: [] });
        setIsConformDialogVisible(false);
        setOkButtonLoading(false);
        if (deleteRecord.id) {
          setDeleteRecord({ id: null, name: null });
        }
        fetchData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsConformDialogVisible(false);
        setOkButtonLoading(false);
      });
  };

  const convertLeadToOpportunity = () => {
    const ids = convertLeadToOpportunityConfirmationDialog.id ? [convertLeadToOpportunityConfirmationDialog.id] : selectedRecords.map((m) => m._id);
    axiosInstance()
      .post(`${lead.leadApi}/to-opportunity`, { ids: ids })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setConvertLeadToOpportunityConfirmationDialog({
          open: false,
          id: null,
          leadName: null,
          message: null
        });
        if (convertLeadToOpportunityConfirmationDialog.id) {
          history.push(`${routes.opportunityDetail.path}/${data.data[0]}`);
        } else {
          fetchData();
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setOkButtonLoading(false);
      });
  };

  const handleFilter = (event, newFilter) => {
    if (newFilter !== null) {
      handleLeadTypeSel(LeadTypes.find((d) => d.key === newFilter).value);
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
        <CustomBreadCrumbs routes={[routes.lead]} />
        <ImportExportLinks
          permissions={permissions?.lead}
          module="lead(s)"
          api={lead.leadApi}
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
                {LeadTypes && (
                  <ToggleButtonGroup
                    size="small"
                    className="ml-2"
                    value={LeadTypes[selectedType - 1].key}
                    exclusive
                    onChange={handleFilter}
                  >
                    {LeadTypes.map((k, index) => {
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
                {permissions?.lead?.isCreate && (
                  <Button
                    onClick={() => {
                      setIsOpen({ open: true, isClone: false, idToClone: null });
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
                <HtmlTooltip title={!selectedRecords.length ? "Please select some leads" : ""}>
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
                    disabled={selectedRecords.every((e) => e.canDelete && !e.convertedToOpportunity) ? false : true}
                    onClick={() => {
                      closeActions();
                      setIsConformDialogVisible(true);
                    }}
                  >
                    {`Delete (${selectedRecords.length})`}
                  </MenuItem>
                  {permissions['customerAccount'].isCreate && permissions['customerContact'].isCreate && permissions['opportunity'].isCreate && (
                    <MenuItem
                      disabled={selectedRecords.length === 0}
                      onClick={() => {
                        closeActions();
                        if (selectedRecords.some((d) => d.convertedToOpportunity)) {
                          setMessageDialog({
                            open: true,
                            message: `You are trying to convert already converted lead, Please unselect those records and try again.`
                          });
                        } else if (selectedRecords.some((d) => !d[processFieldName] || d[processFieldName].toLowerCase() !== 'qualified')) {
                          setMessageDialog({
                            open: true,
                            message: `You have selected lead(s) which are not qualified yet to be converted into opportunity`
                          });
                        } else {
                          if (selectedRecords.some((d) => d.isAllowedToUpdate === false)) {
                            setMessageDialog({
                              open: true,
                              message: `You are trying to convert lead which you do not have permission, Please unselect those records and try again.`
                            });
                          } else {
                            setConvertLeadToOpportunityConfirmationDialog({
                              open: true,
                              id: null,
                              leadName: null,
                              message: `Are you sure you want to convert selected leads to opportunity?`
                            });
                          }
                        }
                      }}
                    >
                      {`Convert To Opportunity (${selectedRecords.length})`}
                    </MenuItem>
                  )}
                  {permissions?.lead?.isUpdate && (
                    <MenuItem
                      onClick={() => {
                        closeActions();
                        handleTransferEntityDialog();
                      }}
                      disabled={selectedRecords.length === 0 || selectedRecords.some((d) => d.ownerId !== user?.user?._id)}
                    >
                      {`Transfer Entity (${selectedRecords.length})`}
                    </MenuItem>
                  )}
                </Menu>
              </div>
            </div>
          </div>
        </div>
        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={fetchData}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={true}
            resource={sidebarResource.lead}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}

        {isOpen?.open && (
          <ManageLeadDialog
            open={isOpen?.open}
            onSuccess={handleClose}
            onClose={() => {
              setIsOpen({ open: false, isClone: false, idToClone: null });
            }}
            isNew={true}
            dataToUpdate={null}
            isClone={isOpen?.isClone}
            leadId={isOpen?.idToClone}
          />
        )}

        {messageDialog.open ? (
          <MessageDialog
            open={messageDialog.open}
            message={messageDialog.message}
            onClose={() => setMessageDialog({ open: false, message: null })}
          />
        ) : null}
        {isConfirmDialogVisible ? (
          <ConfirmationDialog
            open={isConfirmDialogVisible}
            message={`Are you sure you want to delete the ${routes?.lead?.title?.toLowerCase()} ${deleteRecord?.concatedName
              ? deleteRecord?.concatedName : ''}?`}
            onClose={() => {
              setDeleteRecord(null);
              setIsConformDialogVisible(false);
            }}
            okBtnLoading={okButtonLoading}
            onOk={handleDelete}
          />
        ) : null}

        {convertLeadToOpportunityConfirmationDialog.open ? (
          <ConfirmationDialog
            open={convertLeadToOpportunityConfirmationDialog.open}
            message={convertLeadToOpportunityConfirmationDialog.message}
            onClose={() => {
              setConvertLeadToOpportunityConfirmationDialog({
                open: false,
                id: null,
                leadName: null,
                message: null
              });
            }}
            okBtnLoading={okButtonLoading}
            onOk={convertLeadToOpportunity}
          />
        ) : null}
        {showTransferEntityDialog && (
          <TransferEntityDialog
            TransferEntityDialogOpen={showTransferEntityDialog}
            onSuccess={() => {
              fetchData();
              setShowTransferEntityDialog(false);
            }}
            handleCloseDialog={() => {
              setShowTransferEntityDialog(false);
            }}
            selectedRecs={selectedRecords.map((r) => r._id)}
            entities={user.entity.filter((e) => e._id !== selectedEntity)}
            type="leads"
            api="lead"
          />
        )}
      </CustomContainer>
    </section>
  );
};

export default Leads;
