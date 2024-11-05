import { Box, IconButton, MenuItem } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { SiConvertio } from 'react-icons/si';
import { Link, useHistory } from 'react-router-dom';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { cloneDisable, deleteDisable } from 'src/constants/messageHelpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import TransferEntityDialog from '../../components/AssignRolesDialog/TransferEntityDialog';
import CustomContainer from '../../components/CustomContainer';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import MessageDialog from '../../components/Helpers/MessageDialog';
import NoDataCell from '../../components/Helpers/NoDataCell';
import {
  checkIsAllowedToDelete,
  checkIsAllowedToEdit,
  getDefaultMyRecordType,
  gridLoadingTimeout,
  lead,
  prepareDataForGrid,
  processFieldName,
  sidebarResource
} from '../../constants/helpers';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import ManageLeadDialog from './ManageLeadDialog/ManageLeadDialog';
import axios, { CancelTokenSource } from 'axios';

const renderedFrom = camelCase(routes?.lead.title);

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
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);

  const {
    state: { user, selectedEntity, permissions }
  }: any = useData();
  const { generateColumns } = useColumns();
  const [selectedType, setSelectedType] = useState(getDefaultMyRecordType(user.user, sidebarResource.lead));
  const [isOpen, setIsOpen] = useState({ open: false, isClone: false, idToClone: null });
  const [okButtonLoading, setOkButtonLoading] = useState(false);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [messageDialog, setMessageDialog] = useState({ open: false, message: '' });
  const [showTransferEntityDialog, setShowTransferEntityDialog] = useState(false);
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const [columns, setColumns] = useState(null);
  const [allFields, setAllFields] = useState(null);
  const [convertLeadToOpportunityConfirmationDialog, setConvertLeadToOpportunityConfirmationDialog] = useState({
    open: false,
    id: null,
    leadName: null,
    message: null
  });
  const hasPermissionToConvertInOpportunity = user?.role?.selectedEntity?.policy?.isConvertLeadToOpportunity ?? false;

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [search, page, limit, selectedType, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${sidebarResource.lead}&view=true`);
    data = response?.data?.data;
    setAllFields(JSON.parse(JSON.stringify(data)));
  };

  useEffect(() => {
    if (allFields?.length) {
      createColumns(allFields);
    }
  }, [allFields]);

  const createColumns = (data) => {
    let newColumns = generateColumns(lead.leadResource, data, routes.leadDetail.path, true);
    newColumns = [
      ...newColumns,
      {
        accessor: 'relatedOpportunity',
        Header: 'Related Opportunity',
        show: true,
        Cell: ({ row }) => (
          <>
            {row.original?.relatedOpportunity ? (
              <Link
                className="link"
                to={`${routes.opportunityDetail.path}/${row.original?.relatedOpportunityId}`}
                title={row.original?.relatedOpportunity}
              >
                {row.original?.relatedOpportunity}
              </Link>
            ) : (
              <NoDataCell />
            )}
          </>
        )
      },
      ...getStaticFields()
    ];
    setColumns([...newColumns, ActionsRenderer]);
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
        <HtmlTooltip title={row?.original?.canDelete && !row?.original?.convertedToOpportunity ? 'Delete' : deleteDisable}>
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
      </>
    )
  };

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

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    if (selectedEntity) {
      const queryString = getQueryString();
      dispatch({ type: 'loading', loading: true });

      try {
        let data, count;
        const response: any = await axiosInstance().get(`${lead.leadApi}${queryString}`, { cancelToken: cancelTokenSource?.token });
        data = response?.data?.data;
        count = response?.data?.count;
        let rows = data.map((u) => {
          let finalObject: any = prepareDataForGrid(u);
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          finalObject['canDelete'] = permissions?.lead?.isDelete && checkIsAllowedToDelete(user, sidebarResource.lead, finalObject?.ownerId);
          finalObject['canEdit'] = permissions?.lead?.isUpdate && checkIsAllowedToEdit(user, sidebarResource.lead, u);
          let res = {
            ...finalObject,
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

  const generateLeadToOpportunityButton = ({ _id, concatedName, convertedToOpportunity, [processFieldName]: leadProcess, canEdit }) => {
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

    const lastStepText =
      allFields?.find((f) => f?.isRead && f?.fieldData?.fieldName?.toLowerCase() === processFieldName.toLowerCase())?.fieldData?.option?.at(-1)
        ?.optionLabel || '';

    const isCurrentLeadStatusQualified = leadProcess && leadProcess.toLowerCase() === lastStepText?.toLowerCase();

    return dontHavePermissions.length > 0 ? (
      <>
        <HtmlTooltip
          className="cursor-stop"
          title={`To convert lead to opportunity, you must need create permission of ${dontHavePermissions.join(', ')}`}
        >
          <IconButton size="small" aria-label="Convert to opportunity">
            <SiConvertio size={18} />
          </IconButton>
        </HtmlTooltip>
      </>
    ) : convertedToOpportunity ? (
      <>
        <HtmlTooltip className="cursor-stop" title="This lead is already converted to opportunity">
          <IconButton size="small" aria-label="Convert to opportunity">
            <SiConvertio size={18} />
          </IconButton>
        </HtmlTooltip>
      </>
    ) : !canEdit ? (
      <>
        <HtmlTooltip className="cursor-stop" title="You are not allowed to convert as you are neither owner nor collaborator">
          <IconButton size="small" aria-label="Convert to opportunity">
            <SiConvertio size={18} />
          </IconButton>
        </HtmlTooltip>
      </>
    ) : !isCurrentLeadStatusQualified ? (
      <>
        <HtmlTooltip className="cursor-stop" title="To covert this lead to opportunity, Lead status must be qualified">
          <IconButton size="small" aria-label="Convert to opportunity">
            <SiConvertio size={18} />
          </IconButton>
        </HtmlTooltip>
      </>
    ) : (
      <HtmlTooltip title="Convert to opportunity">
        <IconButton
          size="small"
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
        fetchData();
        setIsConformDialogVisible(false);
        setOkButtonLoading(false);
        if (deleteRecord.id) {
          setDeleteRecord({ id: null, name: null });
        }
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
      .post(`${lead.leadApi}/convert`, { ids: ids })
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

  const ActionMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={selectedRecords.every((e) => e.canDelete && !e.convertedToOpportunity) ? false : true}
          onClick={() => {
            setIsConformDialogVisible(true);
          }}
        >
          {`Delete (${selectedRecords.length})`}
        </MenuItem>
        {permissions['customerAccount'].isCreate && permissions['customerContact'].isCreate && permissions['opportunity'].isCreate && (
          <MenuItem
            disabled={selectedRecords.length === 0}
            onClick={() => {
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
                if (selectedRecords.some((d) => d.canEdit === false)) {
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
              handleTransferEntityDialog();
            }}
            disabled={selectedRecords.length === 0 || selectedRecords.some((d) => d.ownerId !== user?.user?._id)}
          >
            {`Transfer Entity (${selectedRecords.length})`}
          </MenuItem>
        )}
      </>
    );
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
        <ListingPageHeader
          toggleButtonList={LeadTypes}
          onToggle={handleFilter}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={true}
          actionButtonProps={{ disabled: selectedRecords.length ? false : true }}
          actionMenuItems={<ActionMenuItems />}
          addButtonOnclick={() => {
            setIsOpen({ open: true, isClone: false, idToClone: null });
          }}
          isAddButtonVisible={permissions?.lead?.isCreate}
        />

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
          <MessageDialog open={messageDialog.open} message={messageDialog.message} onClose={() => setMessageDialog({ open: false, message: null })} />
        ) : null}
        {isConfirmDialogVisible ? (
          <ConfirmationDialog
            open={isConfirmDialogVisible}
            message={`Are you sure you want to delete the ${routes?.lead?.title?.toLowerCase()} ${deleteRecord?.concatedName ? deleteRecord?.concatedName : ''
              }?`}
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
