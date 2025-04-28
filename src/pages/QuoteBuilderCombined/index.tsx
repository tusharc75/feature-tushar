import { Box, Chip, MenuItem } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { Link, useHistory } from 'react-router-dom';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { cloneDisable, deleteDisable } from 'src/constants/messageHelpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import TransferEntityDialog from '../../components/AssignRolesDialog/TransferEntityDialog';
import CustomContainer from '../../components/CustomContainer';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import NoDataCell from '../../components/Helpers/NoDataCell';
import {
  checkIsAllowedToDelete,
  customerAccount,
  customerContact,
  dateFormatToSend,
  getDefaultMyRecordType,
  gridLoadingTimeout,
  prepareDataForGrid,
  quoteBuilder,
  sidebarResource,
  supplierAccount,
  supplierContact
} from '../../constants/helpers';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import AllVersionStatus from './AllVersionStatus';
import ManageQuoteDialog from './ManageQuote/ManageQuoteDialog';
import axios, { CancelTokenSource } from 'axios';
import './style.scss';
import dayjs from 'dayjs';

const QuoteBuilders = () => {
  const renderedFrom = camelCase(sidebarResource?.quoteBuilder);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { visibleColumns } = state;

  const history = useHistory();
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, selectedEntity, permissions, resources }
  }: any = useData();

  const types = [
    {
      key: `My ${resources?.quoteBuilder?.titlePlural}`,
      value: 1
    },
    {
      key: `All ${resources?.quoteBuilder?.titlePlural}`,
      value: 2
    }
  ];

  const { generateColumns, checkStaticField } = useColumns();
  const [selectedType, setSelectedType] = useState(getDefaultMyRecordType(user.user, sidebarResource.quoteBuilder));
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [showTransferEntityDialog, setShowTransferEntityDialog] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState<any>({});
  const [showCreateQuoteDialog, setshowCreateQuoteDialog] = useState(false);
  const [isClone, setIsClone] = useState(false);
  const [accountDetails, setAccountDetails] = useState({
    accountId: history.location?.state?.accountId,
    accountName: history.location?.state?.accountName,
    resource: history.location?.state?.resource
  });

  const [contactDetails, setContactDetails] = useState({
    contactId: history.location?.state?.contactId,
    contactName: history.location?.state?.contactName,
    resource: history.location?.state?.resource
  });
  const [opportunityDetails, setOpportunityDetails] = useState({
    opportunityId: history.location?.state?.opportunityId,
    opportunityName: history.location?.state?.opportunityName
  });
  const [showVersionsDialog, setShowVersionsDialog] = useState({ open: false, id: null, quoteData: null });
  const [columns, setColumns] = useState(null);
  const [clonedData, setClonedData] = useState([]);
  const [clonedId, setClonedId] = useState(null);

  const [cloneQuoteWithVersionNumber, setCloneQuoteWithVersionNumber] = useState(0);

  const { qbApi } = quoteBuilder;
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    const response = await axiosInstance().get(`/field?resource=${sidebarResource.quoteBuilder}&entity=${selectedEntity}&view=true`);

    let data = response?.data?.data;

    let columns = [];
    let newColumns = generateColumns(resources?.quoteBuilder?.titlePlural, data, `${routes.quoteBuilder.path}/detail`);
    newColumns?.forEach((o) => {
      if (o.accessor === 'quoteName') {
        o.cell = ({ row }) => (
          <div>
            <Link className="text-truncate link" title={row.original.quoteName} to={`${routes.quoteBuilder.path}/detail/${row.original._id}`}>
              {row.original.quoteName}
            </Link>
            <HtmlTooltip title="Versions">
              <span
                className="link ml-1 cursor-pointer"
                onClick={() => {
                  setShowVersionsDialog({ open: true, id: row.original._id, quoteData: row.original });
                  // getVersionStatus(row.original._id, row.original.currency);
                }}
              >
                ({row.original.versionCount})
              </span>
            </HtmlTooltip>
          </div>
        );
      }
    });
    columns = [
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
                to={`${routes.opportunityDetail.path}/${row.original.relatedOpportunityId}`}
                title={row.original?.relatedOpportunity}
              >
                {row.original?.relatedOpportunity}
              </Link>
            ) : (
              <NoDataCell />
            )}
          </>
        )
      }
    ];
    let staticFields = getStaticFields();
    staticFields.forEach((field) => {
      columns.push(checkStaticField(sidebarResource.projectSales, field));
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
        <HtmlTooltip title={permissions?.quoteBuilder?.isCreate ? 'Clone' : cloneDisable}>
          <span>
            <IconButton
              disabled={permissions?.quoteBuilder?.isCreate ? false : true}
              size="small"
              aria-label="Clone"
              onClick={() => {
                handleShowCloneQuoteDialog();
                setClonedId(row?.original?._id);
              }}
            >
              <FileCopyIcon fontSize="small" color={permissions?.quoteBuilder?.isCreate ? 'primary' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
        <HtmlTooltip title={permissions?.quoteBuilder.isDelete && row?.original?.canDelete ? 'Delete' : deleteDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Delete"
              disabled={permissions?.quoteBuilder.isDelete && row?.original?.canDelete ? false : true}
              onClick={() => {
                setDeleteRecord(row?.original);
                setIsConformDialogVisible(true);
              }}
            >
              <DeleteIcon fontSize="small" color={permissions?.quoteBuilder.isDelete && row?.original?.canDelete ? 'error' : 'disabled'} />
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
  }, [
    search,
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

  const handleShowCloneQuoteDialog = () => {
    setIsClone(true);
    setshowCreateQuoteDialog(true);
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;

    if (isExport) {
      deepFilter = `?`;
    }

    if (selectedType === 1) {
      deepFilter = deepFilter + `&myRecords=1`;
    }

    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify(selectedRecords.map((m) => m._id))}`;
    }

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (accountDetails.accountId) {
      if (accountDetails.resource === customerAccount.accountResource) {
        filterByIds.push({
          field: 'customerAccountName',
          term: accountDetails.accountId
        });
      } else if (accountDetails.resource === supplierAccount.accountResource) {
        filterByIds.push({
          field: 'supplierAccountName',
          term: { $in: [accountDetails.accountId] }
        });
      }
    }

    if (contactDetails.contactId) {
      if (contactDetails.resource === customerContact.contactResource) {
        filterByIds.push({
          field: 'customerContactName',
          term: contactDetails.contactId
        });
      } else if (contactDetails.resource === supplierContact.contactResource) {
        filterByIds.push({
          field: 'supplierContactName',
          term: { $in: [contactDetails.contactId] }
        });
      }
    }

    if (opportunityDetails.opportunityId) {
      filterByIds.push({
        field: 'opportunity',
        term: opportunityDetails.opportunityId
      });
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
    if (selectedEntity) {
      dispatch({ type: 'loading', loading: true });
      const queryString = getQueryString();
      axiosInstance()
        .get(`${qbApi}${queryString}`, { cancelToken: cancelTokenSource?.token })
        .then(({ data: { data, count } }) => {
          let clonedData = {};
          let rows = data.map((u) => {
            clonedData = {
              ...clonedData,
              [u.quoteName]: u
            };
            let versionCount = Object.keys(u.versions).length;
            let tempStatus = 'Building Quote';
            let versionArray = [];
            Object.keys(u.versions).forEach((key) => {
              versionArray.push(u.versions[key]);
            });

            const updatedVersion = versionArray.find((v) => v.status !== tempStatus);
            if (updatedVersion) {
              tempStatus = updatedVersion.status;
            }
            let finalObject = prepareDataForGrid(u, user);
            finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
            finalObject['relatedOpportunity'] = u.opportunity?.optionLabel;
            finalObject['relatedOpportunityId'] = u.opportunity?.optionValue;
            finalObject['status'] = tempStatus;
            finalObject['versionCount'] = versionCount;
            finalObject['versionData'] = versionArray;
            finalObject['canDelete'] = checkIsAllowedToDelete(user, sidebarResource.quoteBuilder, u?.owner?.optionValue);
            return finalObject;
          });
          setClonedData(data);
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

  const handleQuoteBuilderTypeSel = (filterValues) => {
    dispatch({ type: 'pageChange', page: 0 });
  };

  const onSuccess = () => {
    setshowCreateQuoteDialog(false);
    setIsClone(false);
    fetchData();
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
      .put(`${qbApi}/remove?entity=${selectedEntity}`, {
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

  const handleCloneQuoteWithVersionFromAllVersion = (quoteId, versionNumber) => {
    setCloneQuoteWithVersionNumber(versionNumber);
    setshowCreateQuoteDialog(true);
    setIsClone(true);
    setClonedId(quoteId);
    setShowVersionsDialog({ open: false, id: null, quoteData: null });
  };

  const handleFilter = (event, newFilter) => {
    if (newFilter != null) {
      handleQuoteBuilderTypeSel(types.find((d) => d.key === newFilter).value);
    }
  };

  const LeftSideContents = () => {
    return (
      <>
        {accountDetails.accountId && (
          <Chip
            className="ml-3"
            color="primary"
            label={`Account: ${accountDetails.accountName}`}
            onDelete={() => {
              setAccountDetails({
                accountId: null,
                accountName: null,
                resource: null
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
                resource: null
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
      </>
    );
  };

  const ActionMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={selectedRecords.every((e) => e.canDelete) ? false : true}
          onClick={() => {
            if (selectedRecords.length === 1) {
              setDeleteRecord(selectedRecords[0]);
            } else {
              setDeleteRecord(null);
            }
            setIsConformDialogVisible(true);
          }}
        >
          {`Delete (${selectedRecords.length})`}
        </MenuItem>
        <MenuItem
          disabled={selectedRecords.find((d) => d.canDelete === false)}
          onClick={() => {
            setShowTransferEntityDialog(true);
          }}
        >
          {`Transfer Entity (${selectedRecords.length})`}
        </MenuItem>
        <MenuItem
          disabled={selectedRecords.length !== 1}
          onClick={() => {
            setIsClone(true);
            setshowCreateQuoteDialog(true);
          }}
        >
          {`Clone (${selectedRecords.length})`}
        </MenuItem>
      </>
    );
  };

  return (
    <div className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ ...routes.quoteBuilder, title: resources?.quoteBuilder?.titlePlural }]} />
        <ImportExportLinks
          permissions={permissions?.quoteBuilder}
          module={resources?.quoteBuilder?.titlePlural}
          api={qbApi}
          afterImportCompleted={() => {
            fetchData();
          }}
          visibleColumns={visibleColumns}
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
          onToggle={handleFilter}
          selectedType={selectedType}
          setSelectedType={setSelectedType}
          leftSideContents={LeftSideContents}
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={true}
          actionButtonProps={{ disabled: selectedRecords.length ? false : true }}
          actionMenuItems={<ActionMenuItems />}
          addButtonOnclick={() => {
            setshowCreateQuoteDialog(true);
          }}
          isAddButtonVisible={permissions?.quoteBuilder?.isCreate}
        />
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
            setWholeRowsCellColor={(rowData) => {
              const versions = rowData?.versions;
              if (versions && versions.length > 0 && versions[versions.length - 1].status === 'Building Quote') {
                return 'error';
              } else {
                return '';
              }
            }}
            resource={sidebarResource.quoteBuilder}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
        {isConfirmDialogVisible ? (
          <ConfirmationDialog
            open={isConfirmDialogVisible}
            message={`Are you sure you want to delete ${deleteRecord ? `${resources?.quoteBuilder?.titleSingular?.toLowerCase()} : ${deleteRecord?.quoteName || ''}` : `selected ${resources?.quoteBuilder?.titlePlural?.toLowerCase()}`} ?`}
            onClose={() => {
              setDeleteRecord(null);
              setIsConformDialogVisible(false);
            }}
            okBtnLoading={deleteLoading}
            onOk={handleDelete}
          />
        ) : null}
      </CustomContainer>

      {showCreateQuoteDialog && (
        <ManageQuoteDialog
          open={showCreateQuoteDialog}
          onSuccess={onSuccess}
          onClose={() => {
            setshowCreateQuoteDialog(false);
            setIsClone(false);
            setClonedId(null);
          }}
          isNew={isClone ? false : true}
          dataToUpdate={
            isClone
              ? clonedId && clonedData
                ? clonedData.filter((o) => o._id === clonedId)[0]
                : clonedData.filter((o) => o._id === selectedRecords[0]._id)[0]
              : null
          }
          isClone={isClone ? true : false}
          resource={null}
          isRedirectTodetailPage={isClone ? false : true}
          contactId={null}
          opportunityId={null}
          disableOwnerDropDown={true}
          contacts={null}
          doaCollaboratorResources={[]}
          isRenderedFromOpportunity={false}
          cloneQuoteWithVersionNumber={cloneQuoteWithVersionNumber}
        />
      )}

      {showVersionsDialog.open && (
        <AllVersionStatus
          open={showVersionsDialog.open}
          onClose={() => setShowVersionsDialog({ open: false, id: null, quoteData: null })}
          quoteId={showVersionsDialog.id}
          quoteData={showVersionsDialog.quoteData}
          quotePermissions={permissions?.quoteBuilder}
          fetchQuoteData={() => { }}
          handleChangeVersionFromAllVersion={(versionNumber) => {
            history.push(`quotes/detail/${showVersionsDialog.id}`, {
              versionNumber: `${versionNumber}`,
              tabValue: 1
            });
          }}
          handleCloneQuoteWithVersionFromAllVersion={(versionNumber) => {
            handleCloneQuoteWithVersionFromAllVersion(showVersionsDialog.id, versionNumber);
          }}
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
          type="quotes"
          api="quote-builder"
        />
      )}
    </div>
  );
};

export default QuoteBuilders;
