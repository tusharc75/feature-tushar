import { Box, Button, Menu, MenuItem } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { ToggleButton, ToggleButtonGroup } from '@material-ui/lab';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import { useHistory } from 'react-router-dom';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { cloneDisable, deleteDisable } from 'src/constants/messageHelpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import TransferEntityDialog from '../../components/AssignRolesDialog/TransferEntityDialog';
import CustomContainer from '../../components/CustomContainer';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import MessageDialog from '../../components/Helpers/MessageDialog';
import {
  checkIsAllowedToDelete,
  customerAccount,
  getDefaultMyRecordType,
  gridLoadingTimeout,
  opportunity,
  prepareDataForGrid,
  sidebarResource,
  supplierAccount
} from '../../constants/helpers';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import ManageOpportunityDialog from './ManageOpportunityDialog';
import './style.scss';
import { ListingPageHeader } from 'src/components/PageHeaders';
import axios, { CancelTokenSource } from 'axios';

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
  const { generateColumns, checkStaticField } = useColumns();
  const { opportunityResource, opportunityApi } = opportunity;
  const [selectedType, setSelectedType] = useState(getDefaultMyRecordType(user.user, sidebarResource.opportunity));
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

  //  Grid Variables - End
  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    const response = await axiosInstance().get(`/field?resource=Opportunity&entity=${selectedEntity}&view=true`);
    let data = response?.data?.data;
    const newColumns = generateColumns(routes.opportunity.title, data, routes.opportunityDetail.path, true);
    newColumns?.forEach((o) => {
      if (o.accessor === 'firstName') {
        (o.disabled = true),
          (o.accessor = 'opportunityName'),
          (o.header = 'Opportunity Name'),
          (o.pivotIndex = 0),
          (o.show = true),
          (o.primaryField = true);
      }
    });
    let staticFields = getStaticFields();
    staticFields.forEach((field) => {
      newColumns.push(checkStaticField(routes.opportunity.title, field));
    });
    setColumns([...newColumns, ActionsRenderer]);
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
        <HtmlTooltip title={permissions?.opportunity?.isCreate ? 'Clone' : cloneDisable}>
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
        <HtmlTooltip title={row?.original?.canDelete ? 'Delete' : deleteDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Delete"
              disabled={row?.original?.canDelete ? false : true}
              onClick={() => {
                setDeleteRecord(row?.original);
                setIsConformDialogVisible(true);
              }}
            >
              <DeleteIcon fontSize="small" color={row?.original?.canDelete ? 'error' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    )
  };

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
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

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    const queryString = getQueryString();
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .get(`${opportunityApi}${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject: any = prepareDataForGrid(u);
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          finalObject['canDelete'] =
            permissions?.opportunity?.isDelete && checkIsAllowedToDelete(user, sidebarResource.opportunity, finalObject?.ownerId);
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
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
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

  const onTypeChange = (event, type) => {
    dispatch({ type: 'pageChange', page: 0 });
  };

  const ActionMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={selectedRecords.every((e) => e.canDelete) ? false : true}
          onClick={() => {
            setIsConformDialogVisible(true);
          }}
        >
          {`Delete (${selectedRecords.length})`}
        </MenuItem>
        <MenuItem
          disabled={selectedRecords.find((d) => d.canDelete === false)}
          onClick={() => {
            handleTransferEntityDialog();
          }}
        >
          {`Transfer Entity (${selectedRecords.length})`}
        </MenuItem>
      </>
    );
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
        <ListingPageHeader
          toggleButtonList={types}
          onToggle={onTypeChange}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={true}
          actionButtonProps={{ disabled: selectedRecords.length ? false : true }}
          actionMenuItems={<ActionMenuItems />}
          addButtonOnclick={() => {
            setShowCreateOpportunityDialog({ open: true, isClone: false, idToClone: null });
          }}
          isAddButtonVisible={permissions?.opportunity?.isCreate}
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
            message={`Are you sure you want to delete ${routes.opportunity.title}${selectedRecords.length ? 's' : ''}   ${
              deleteRecord.opportunityName || ''
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
