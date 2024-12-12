import { Box, Chip, MenuItem } from '@material-ui/core';
import IconButton from '@material-ui/core/IconButton';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { camelCase } from 'lodash';
import { FC, useContext, useEffect, useState } from 'react';
import { AiOutlineDeploymentUnit } from 'react-icons/ai';
import { useHistory } from 'react-router-dom';
import CustomContainer from 'src/components/CustomContainer';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { cloneDisable, deleteDisable, entityDisable } from 'src/constants/messageHelpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import EntitySelectionsDialog from '../../components/EntitySelections';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import MessageDialog from '../../components/Helpers/MessageDialog';
import routes from '../../components/Helpers/Routes';
import { customerAccount, gridLoadingTimeout, prepareDataForGrid, sidebarResource, supplierAccount } from '../../constants/helpers';
import CreateProjectSales from './CreateProjectSales';
import axios, { CancelTokenSource } from 'axios';

const ProjectSales: FC = () => {

  const {
    state: { user, permissions, selectedEntity, resources }
  }: any = useData();

  const types = [
    {
      key: `My ${resources?.projectSales?.titlePlural}`,
      value: 1
    },
    {
      key: `All ${resources?.projectSales?.titlePlural}`,
      value: 2
    }
  ];

  const renderedFrom = camelCase(sidebarResource.projectSales);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();

  const { generateColumns } = useColumns();
  const [isOpen, setIsOpen] = useState({ open: false, isClone: false, idToClone: null });
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [selectedType, setselectedType] = useState(1);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState({ show: false, isDelete: false });
  const [projectSalesId, setProjectSalesId] = useState(null);
  const [showEntityDialog, setShowEntityDialog] = useState(false);
  const [entities, setEntities] = useState([]);
  const [columns, setColumns] = useState(null);

  const [referenceDetails, setReferenceDetails] = useState({
    referenceId: history.location?.state?.accountId,
    referenceName: history.location?.state?.accountName,
    resource: history.location?.state?.resource
  });
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  useEffect(() => {
    fetchGridColumns();
  }, []);

  const fetchGridColumns = async () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource.projectSales}`)
      .then(({ data: { data } }) => {
        let columns = [];
        let newColumns = generateColumns(renderedFrom, data, routes.projectSalesDetail.path, true);
        columns = [...newColumns, ...getStaticFields()];
        setColumns([...columns, ActionsRenderer]);
      });
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
        <HtmlTooltip title={permissions?.projectSales?.isCreate ? 'Clone' : cloneDisable}>
          <span>
            <IconButton
              disabled={permissions?.projectSales?.isCreate ? false : true}
              size="small"
              aria-label="Clone"
              onClick={() => {
                setIsOpen({ open: true, isClone: true, idToClone: row?.original?._id });
              }}
            >
              <FileCopyIcon fontSize="small" color={permissions?.projectSales?.isCreate ? 'primary' : 'disabled'} />
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
                setShowDeleteConfirmBox(true);
                setDeleteRecord(row?.original);
              }}
            >
              <DeleteIcon fontSize="small" color={row?.original?.canDelete ? 'error' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
        <HtmlTooltip
          title={(permissions?.projectSales?.isUpdate && row?.original?.isTeamMember) || row?.original?.isManager ? 'Entity' : entityDisable}
        >
          <span>
            <IconButton
              disabled={(permissions?.projectSales?.isUpdate && row?.original?.isTeamMember) || row?.original?.isManager ? false : true}
              size="small"
              aria-label="Entity"
              onClick={() => {
                setProjectSalesId(row?.original._id);
                setShowEntityDialog(true);
                if (row?.original?.entity) {
                  let entities = [];
                  if (row?.original?.entityId) {
                    entities.push(row?.original?.entityId);
                  }
                  if (row?.original?.restentity) {
                    let restEntities = row?.original?.restentity.map((o) => o.optionValue);
                    entities = [...entities, ...restEntities];
                  }
                  setEntities([...entities]);
                }
              }}
            >
              <AiOutlineDeploymentUnit
                fontSize="15"
                color={(permissions?.projectSales?.isUpdate && row?.original?.isTeamMember) || row?.original?.isManager ? 'primary' : 'disabled'}
              />
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
  }, [page, limit, filters, sorting, search, selectedEntity, selectedType, showFilteredRecordsOnly]);

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

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (referenceDetails.referenceId) {
      if (referenceDetails.resource === sidebarResource.opportunity) {
        filterByIds.push({ field: 'staticData.opportunity', term: referenceDetails.referenceId });
      } else if (referenceDetails.resource === customerAccount.accountResource) {
        filterByIds.push({ field: 'customerAccountName', term: referenceDetails.referenceId });
      } else if (referenceDetails.resource === supplierAccount.accountResource) {
        filterByIds.push({ field: 'supplierAccountName', term: { $in: [referenceDetails.referenceId] } });
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

    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify(selectedRecords.map((m) => m._id))}`;
    }

    return deepFilter;
  };

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    axiosInstance()
      .get(`/project-sales${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data, count } }) => {
        let rows = data.map((project) => {
          let finalObject = prepareDataForGrid(project, user);
          finalObject['canDelete'] = finalObject['projectManagerId'] === user?.user._id && permissions?.projectSales?.isDelete;
          return {
            ...finalObject,
            isManager: user.user._id === project?.projectManager?.optionValue,
            isTeamMember: Boolean(data.staticData?.user.find((u) => u._id === user.user._id))
          };
        });
        dispatch({ type: 'initialize', data: rows, count: count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const handleProjectFilter = (filterValues) => {
    dispatch({ type: 'pageChange', page: 0 });
    setselectedType(filterValues);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    let ids = [];
    if (deleteRecord?._id) {
      ids.push(deleteRecord?._id);
    } else {
      selectedRecords.forEach((obj) => {
        ids.push(obj._id);
      });
    }

    axiosInstance()
      .put(`/project-sales/remove`, { ids })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        dispatch({ type: 'selection', selectedRecords: [] });
        setShowDeleteConfirmBox(false);
        setDeleteLoading(false);
        setDeleteRecord(null);
        fetchData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowDeleteConfirmBox(false);
        setDeleteLoading(false);
      });
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const handleClose = () => {
    setIsOpen({ open: false, isClone: false, idToClone: null });
  };

  const handleFilter = (event, newFilter) => {
    if (newFilter != null) {
      handleProjectFilter(types.find((d) => d.key === newFilter).value);
    }
  };

  const ActionMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={selectedRecords.every((e) => e.canDelete) ? false : true}
          onClick={() => {
            setShowDeleteConfirmBox(true);
          }}
        >
          {`Delete (${selectedRecords.length})`}
        </MenuItem>
        {permissions?.projectSales?.isUpdate && (
          <MenuItem
            disabled={selectedRecords.length === 0}
            onClick={() => {
              if (selectedRecords.some((d) => d.isUpdate === false)) {
                setShowDeleteWarningConfirmBox({ show: true, isDelete: false });
              } else {
                if (selectedRecords.length) {
                  let entities = [];
                  selectedRecords.map((current) => {
                    if (current?.entity) {
                      if (current?.entityId) {
                        entities.push(current?.entityId);
                      }
                      if (current?.restentity) {
                        let restEntities = current?.restentity.map((o) => o.optionValue);
                        entities = [...entities, ...restEntities];
                      }
                    }
                  });
                  setEntities([...entities]);
                }
                setShowEntityDialog(true);
              }
            }}
          >
            Assign Entity &nbsp; <Chip size="small" label={selectedRecords.length} />
          </MenuItem>
        )}
      </>
    );
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{...routes.projectSales, title: resources?.projectSales?.titlePlural}]} />
        <ImportExportLinks
          permissions={permissions?.projectSales}
          module={resources?.projectSales?.titlePlural}
          api={'project-sales'}
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
          onToggle={handleFilter}
          selectedType={selectedType}
          setSelectedType={setselectedType}
          // leftSideContents
          searchValue={search}
          onSearch={handleSearch}
          // rightSideContents
          isActionButtonVisible={true}
          actionButtonProps={{ disabled: selectedRecords.length ? false : true }}
          actionMenuItems={<ActionMenuItems />}
          // addButtonProps
          addButtonOnclick={() => {
            setIsOpen({ open: true, isClone: false, idToClone: null });
          }}
          isAddButtonVisible={permissions?.projectSales?.isCreate}
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
            resource={sidebarResource.projectSales}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomContainer>

      {showDeleteWarningConfirmBox?.show ? (
        <MessageDialog
          open={showDeleteWarningConfirmBox?.show}
          message={
            showDeleteWarningConfirmBox?.isDelete
              ? `You are trying to delete records which you do not have permission to delete, Please remove those records from selection and try again.`
              : `You are trying to update records which you do not have permission to update, Please remove those records from selection and try again.`
          }
          onClose={() => setShowDeleteWarningConfirmBox({ show: false, isDelete: false })}
        />
      ) : null}

      {showDeleteConfirmBox ? (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete the ${resources?.projectSales?.titlePlural?.toLowerCase()}${selectedRecords.length ? 's' : ''} ${
            deleteRecord?._id ? deleteRecord?.projectName : ''
          } ? `}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          okBtnLoading={deleteLoading}
          onOk={handleDelete}
        />
      ) : null}
      {showEntityDialog ? (
        <EntitySelectionsDialog
          open={showEntityDialog}
          resource={sidebarResource.projectSales}
          resourceIds={selectedRecords.length ? selectedRecords.map((o) => o._id) : [projectSalesId]}
          onClose={() => {
            setShowEntityDialog(false);
            setProjectSalesId('');
          }}
          entities={entities}
          onSuccess={fetchData}
        />
      ) : null}
      {isOpen?.open && (
        <CreateProjectSales
          open={isOpen?.open}
          isClone={isOpen?.isClone}
          projectSalesId={isOpen?.idToClone}
          close={handleClose}
          fetchData={fetchData}
        />
      )}
    </section>
  );
};

export default ProjectSales;
