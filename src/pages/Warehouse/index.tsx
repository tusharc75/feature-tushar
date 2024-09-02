import { Box, Chip, IconButton, MenuItem } from '@material-ui/core';
import DeleteIcon from '@material-ui/icons/Delete';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { AiOutlineDeploymentUnit } from 'react-icons/ai';
import AssignDynamicDialog from 'src/components/AssignRolesDialog/AssignDynamicDialog';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import EntitySelectionsDialog from 'src/components/EntitySelections';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import MessageDialog from 'src/components/Helpers/MessageDialog';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomContainer from '../../components/CustomContainer';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import { gridLoadingTimeout, prepareDataForGrid, sidebarResource } from '../../constants/helpers';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import ManageWarehouse from './ManageWarehouse';
import axios, { CancelTokenSource } from 'axios';
import { useSetWalkmeData } from 'src/components/CustomIntro';
import { createResourceFlow } from 'src/components/CustomIntro/walkmeSteps';

const Warehouse = () => {
  const renderedFrom = camelCase(routes?.warehouse.title);
  const { setWalkmeData } = useSetWalkmeData();
  const toastConfig = useContext(CustomToastContext);
  const { state, dispatch } = useTableReducer();
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;
  const { generateColumns } = useColumns();

  const {
    state: { user, permissions, selectedEntity }
  }: any = useData();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showManageDialog, setShowManageDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);

  const [columns, setColumns] = useState(null);
  const [isAssigning, setIsAssigning] = useState(false);
  const [userAssignDialog, setUserAssignDialog] = useState(false);
  const [showEntityDialog, setShowEntityDialog] = useState(false);
  const [warehouseId, setWarehouseId] = useState('');
  const [entities, setEntities] = useState([]);
  const [showUpdateWarningConfirmBox, setShowUpdateWarningConfirmBox] = useState(false);

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    const cancelTokenSource = axios.CancelToken.source();
    fetchData(cancelTokenSource);
    return () => cancelTokenSource.cancel();
  }, [search, page, limit, filters, sorting, selectedEntity, showFilteredRecordsOnly]);

  const fetchGridColumns = async () => {
    let data;
    const response = await axiosInstance().get(`/field?resource=${sidebarResource.warehouse}`);
    data = response?.data?.data;
    setWalkmeData([createResourceFlow(sidebarResource.warehouse, data)]);

    const newColumns = generateColumns(renderedFrom, data, routes.warehouseDetail.path, true);
    setColumns([...newColumns, ...getStaticFields(), ActionsRenderer]);
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 100,
    width: 130,
    sticky: 'right',
    disableFilters: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        {permissions?.warehouse?.isCreate ? (
          <HtmlTooltip title="Clone">
            <IconButton
              size="small"
              aria-label="Clone"
              onClick={() => {
                setShowManageDialog({ open: true, isClone: true, idToClone: row.original._id });
              }}
            >
              <FileCopyIcon fontSize="small" color="primary" />
            </IconButton>
          </HtmlTooltip>
        ) : (
          <HtmlTooltip className="cursor-stop" title="You do not have permission to clone/create">
            <IconButton aria-label="Clone" size="small">
              <FileCopyIcon fontSize="small" />
            </IconButton>
          </HtmlTooltip>
        )}
        {permissions?.warehouse?.isDelete && (
          <HtmlTooltip title="Delete">
            <IconButton
              size="small"
              aria-label="Delete"
              disabled={row.original?.deleted ? true : false}
              onClick={() => {
                setDeleteRecord(row.original);
                setShowDeleteConfirmBox(true);
              }}
            >
              <DeleteIcon color={row.original?.deleted ? 'disabled' : "error"} />
            </IconButton>
          </HtmlTooltip>
        )}
        {permissions?.warehouse?.isUpdate && row?.original?.isAllowedToUpdate && !row.original?.deleted ? (
          <HtmlTooltip title="Entity">
            <IconButton
              size="small"
              aria-label="Entity"
              onClick={() => {
                setShowEntityDialog(true);
                setWarehouseId(row?.original._id);
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
              <AiOutlineDeploymentUnit fontSize="15" color="primary" />
            </IconButton>
          </HtmlTooltip>
        ) : (
          <HtmlTooltip className="cursor-stop" title="You do not have permission to update entity">
            <IconButton aria-label="Clone" size="small">
              <AiOutlineDeploymentUnit fontSize="15" />
            </IconButton>
          </HtmlTooltip>
        )}
      </>
    )
  };

  const handleAssignUser = (data) => {
    setIsAssigning(true);
    const user = data?.map((e) => e?._id);
    const warehouse = selectedRecords?.map((m) => m._id);
    axiosInstance()
      .post(`${routes.warehouse.path}/user/assign`, { warehouse, user })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchData();
        setUserAssignDialog(false);
        setIsAssigning(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsAssigning(false);
      });
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}`;
    if (isExport) {
      deepFilter = `?`;
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
    if (showFilteredRecordsOnly) {
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const fetchData = async (cancelTokenSource?: CancelTokenSource) => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    axiosInstance()
      .get(`${routes?.warehouse.path}${queryString}`, { cancelToken: cancelTokenSource?.token })
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject = prepareDataForGrid(u, user);
          finalObject['canDelete'] = permissions?.warehouse?.isDelete;
          finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permissions?.warehouse?.isUpdate;
          return finalObject;
        });
        dispatch({ type: 'initialize', data: rows, count: count });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
      .finally(() => {
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const handleDelete = () => {
    setIsSubmitting(true);
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords?.map((d) => d._id);
    }
    axiosInstance()
      .put(`${routes?.warehouse.path}/remove`, { ids: ids })
      .then(() => {
        dispatch({ type: 'selection', selectedRecords: [] });
        fetchData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        setIsSubmitting(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setIsSubmitting(false);
      });
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[routes.warehouse]} />
        <ImportExportLinks
          permissions={permissions?.warehouse}
          module={routes.warehouse.title}
          api={routes?.warehouse.path}
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
          extraImportExportLinks={
            user?.user?.brandPolicy?.warehouseAccessByUser
              ? [
                {
                  title: 'Assign Users Template',
                  api: `warehouse/user/template`,
                  type: 'download'
                },
                {
                  title: 'Assign Users Export',
                  api: `warehouse/user/template?export=true${selectedRecords.length ? `&ids=${JSON.stringify(selectedRecords?.map((obj) => obj._id))}` : ''
                    }`,
                  type: 'export'
                },
                {
                  title: 'Assign Users Import',
                  api: `warehouse/user/import`,
                  type: 'import'
                }
              ]
              : []
          }
        />
      </div>
      <CustomContainer>
        <ListingPageHeader
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={true}
          actionButtonProps={{ disabled: selectedRecords?.length ? false : true }}
          actionMenuItems={
            <ActionMenuItems
              {...{
                permissions,
                selectedRecords,
                setShowDeleteConfirmBox,
                setShowUpdateWarningConfirmBox,
                setEntities,
                setShowEntityDialog,
                user,
                setUserAssignDialog
              }}
            />
          }
          addButtonOnclick={() => {
            setShowManageDialog({ open: true, isClone: false, idToClone: null });
          }}
          isAddButtonVisible={permissions?.warehouse?.isCreate}
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
            resource={sidebarResource.warehouse}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomContainer>
      {userAssignDialog && (
        <AssignDynamicDialog
          onSuccess={(data) => {
            handleAssignUser(data);
          }}
          handleClose={() => {
            setUserAssignDialog(false);
          }}
          resource={sidebarResource?.user}
          isSubmitting={isAssigning}
        />
      )}
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete ${routes?.warehouse?.title?.toLowerCase()} ${deleteRecord ? (deleteRecord?._id ? deleteRecord?.warehouseName : '') : ''
            } ?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          okBtnLoading={isSubmitting}
          onOk={handleDelete}
        />
      )}
      {showManageDialog.open && (
        <ManageWarehouse
          isClone={showManageDialog.isClone}
          open={showManageDialog.open}
          warehouseId={showManageDialog.idToClone}
          close={() => setShowManageDialog({ open: false, isClone: false, idToClone: null })}
          onSuccess={() => {
            fetchData();
            setShowManageDialog({ open: false, isClone: false, idToClone: null });
          }}
        />
      )}
      {showUpdateWarningConfirmBox ? (
        <MessageDialog
          open={showUpdateWarningConfirmBox}
          message={`You are trying to update records which you do not have permission to update, Please remove those records from selection and try again.`}
          onClose={() => setShowUpdateWarningConfirmBox(false)}
        />
      ) : null}
      {showEntityDialog ? (
        <EntitySelectionsDialog
          open={showEntityDialog}
          resource={sidebarResource.warehouse}
          resourceIds={selectedRecords.length ? selectedRecords.map((o) => o._id) : [warehouseId]}
          onClose={() => {
            setShowEntityDialog(false);
            setWarehouseId('');
          }}
          onSuccess={fetchData}
          entities={entities}
        />
      ) : null}
    </section>
  );
};

export default Warehouse;

const ActionMenuItems = ({
  permissions,
  selectedRecords,
  setShowDeleteConfirmBox,
  setShowUpdateWarningConfirmBox,
  setEntities,
  setShowEntityDialog,
  user,
  setUserAssignDialog
}) => {
  return (
    <>
      {permissions?.warehouse?.isDelete && (
        <MenuItem
          disabled={!((selectedRecords?.length > 0 && selectedRecords?.filter((e) => e?.canDelete && !e?.deleted)?.length) === selectedRecords?.length)}
          onClick={() => {
            setShowDeleteConfirmBox(true);
          }}
        >
          {`Delete (${selectedRecords?.length})`}
        </MenuItem>
      )}
      {permissions?.warehouse?.isUpdate && (
        <MenuItem
          onClick={() => {
            if (selectedRecords.some((d) => d.isUpdate === false)) {
              setShowUpdateWarningConfirmBox(true);
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
      {permissions?.warehouse?.isUpdate && user?.user?.brandPolicy?.warehouseAccessByUser && (
        <MenuItem
          onClick={() => {
            setUserAssignDialog(true);
          }}
        >
          Assign Users &nbsp; <Chip size="small" label={selectedRecords.length} />
        </MenuItem>
      )}
    </>
  );
};
