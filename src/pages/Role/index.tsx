import { useState, FC, useEffect, useContext, useReducer, Fragment } from 'react';
import { Tooltip, IconButton, Grid } from '@material-ui/core';
import { Delete as DeleteIcon } from '@material-ui/icons';
import { Link } from 'react-router-dom';
import axiosInstance from '../../axios/axiosInstance';
import routes from './../../components/Helpers/Routes';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import CustomContainer from '../../components/CustomContainer';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import MessageDialog from '../../components/Helpers/MessageDialog';
import { useData } from '../../StateProvider/Provider';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import CreateRole from './CreateRole';
import { PERMISSION } from '../../constants/Roles';
import { localStorageKeys, roleTypes, gridPageSizes, isObjectEmpty, gridLoadingTimeout, prepareDataForGrid } from '../../constants/helpers';
import RoleHeader from './RoleHeader';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import { CommonRenderer, CreatedByRenderer, UpdatedByRenderer } from '../../components/AgGridComponents/CustomAgGridCellRenderers';
import AssignUserDialog from '../../components/AssignRolesDialog/AssignUserDialog';
import AssignRegionalRolesUserDialog from '../../components/AssignRolesDialog/AssignRegionalRolesUserDialog';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { useHistory } from 'react-router-dom';
import { isMobile, isTablet } from 'react-device-detect';
import { FaSuitcase, MdDescription, IoCreateSharp } from 'react-icons/all';
import CustomSwipableList from '../../components/SwipableListComponents/CustomSwipableList';
import { camelCase } from 'lodash';

const rolePermissionArray = [PERMISSION.superAdmin, PERMISSION.brandAdmin];
let roleTimeout;

const Roles: FC = () => {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { permissions, selectedEntity }
  }: any = useData();
  const [selectedType, setSelectedType] = useState(
    localStorage.getItem(localStorageKeys.currentSelectedRoleType)
      ? roleTypes.find((d) => d.key === localStorage.getItem(localStorageKeys.currentSelectedRoleType)).value
      : roleTypes.find((d) => d.key === 'Global')?.value
  );
  const [isOpen, setIsOpen] = useState({ open: false, isClone: false, idToClone: null });
  const [deleteRecord, setDeleteRecord] = useState<any>({});
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [renderCount, setRenderCount] = useState(0);
  const [isConfirmDialogVisible, setIsConformDialogVisible] = useState(false);
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState(false);
  const [showAssignUserDialog, setShowAssignUserDialog] = useState(false);
  const renderedFrom = camelCase(routes.role.title);
  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;

  // const [showGridFilters, setShowGridFilters] = useState(true)
  const columns = [
    { field: 'name', headerName: 'Name', show: true, disabled: true, cellRenderer: 'nameRenderer' },
    { field: 'description', headerName: 'Description', show: true, cellRenderer: 'commonRenderer' },
    { field: 'createdBy', headerName: 'Created By', show: true, cellRenderer: 'createdByRenderer' },
    { field: 'updatedBy', headerName: 'Updated By', show: true, cellRenderer: 'updatedByRenderer' }
  ];
  const columnState = JSON.parse(localStorage.getItem(renderedFrom));

  if (columnState) {
    columns.forEach((item) => {
      columnState.forEach((d) => {
        if (d.colId === item.field) {
          item.show = !d.hide;
        }
      });
    });
  }
  //  Grid Variables - End

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;

    if (roleTimeout) {
      clearTimeout(roleTimeout);
    }

    roleTimeout = setTimeout(() => {
      fetchRoles();
    }, millisec);
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchRoles();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, selectedType, filters, sorting]);

  const NameRenderer = (params) => (
    <Link title={params.value} className="text-truncate link" to={`${routes.roleDetail.path}/${params.data.id}`}>
      {params.value}
    </Link>
  );

  const ActionsRenderer = (params) => (
    <>
      <Tooltip
        className={permissions.role.isCreate ? '' : 'cursor-stop'}
        title={permissions.role.isCreate ? 'Clone' : 'You do not have permission to clone/create'}
      >
        <IconButton
          size="small"
          aria-label="Clone"
          onClick={() => {
            setIsOpen({ open: true, isClone: true, idToClone: params.data._id });
          }}
        >
          <FileCopyIcon fontSize="small" color="primary" />
        </IconButton>
      </Tooltip>
      {permissions.role.isDelete ? (
        <span title="Delete Role">
          {rolePermissionArray.indexOf(params.data.permission) >= 0 ? (
            <Tooltip
              className="cursor-stop"
              title={
                params.data.type === 'Global Role' ? 'Global brand admin role can not be deleted' : 'Regional brand admin role can not be deleted'
              }
            >
              <IconButton size="small" aria-label="Delete">
                <DeleteIcon />
              </IconButton>
            </Tooltip>
          ) : (
            <IconButton size="small" aria-label="Delete" onClick={() => showConfirmBox(params.data)}>
              <DeleteIcon color="error" />
            </IconButton>
          )}
        </span>
      ) : (
        <Tooltip className="cursor-stop" title="You do not have permission to delete role">
          <IconButton aria-label="Delete">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </>
  );

  const frameworkComponents = {
    nameRenderer: NameRenderer,
    commonRenderer: CommonRenderer,
    createdByRenderer: CreatedByRenderer,
    updatedByRenderer: UpdatedByRenderer,
    actionsRenderer: ActionsRenderer
  };

  const replaceFieldName = (field) => {
    switch (field) {
      case 'createdBy':
        return 'createdBy.user.concatedName';

      case 'updatedBy':
        return 'updatedBy.user.concatedName';

      default:
        return field;
    }
  };

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}&type=2`;

    if (!isObjectEmpty(filters)) {
      const updatedFilters = [];

      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: replaceFieldName(field),
          term: filters[field].filter
        });
      });
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${replaceFieldName(sorting[0].colId)}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${search}`;
    }

    return deepFilter;
  };

  const fetchRoles = async () => {
    const queryString = getQueryString();
    dispatch({ type: 'loading', loading: true });

    if (gridApi) {
      gridApi.setRowData([]);
    }

    axiosInstance()
      .get(`/role/${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject = prepareDataForGrid(u);
          finalObject['canDelete'] = permissions.role.isDelete;
          finalObject['isChecked'] = selectedRecords.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permissions.role.isUpdate;
          return {
            ...finalObject,
            type: `${u.type === roleTypes.find((d) => d.key === 'Global')?.value ? 'Global' : 'Regional'} Role`
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
    // eslint-disable-next-line
  };

  const showConfirmBox = (row) => {
    if (row) {
      setIsConformDialogVisible(true);
      if (row && row.id) {
        setDeleteRecord(row);
      }
    } else {
      if (selectedRecords.find((d) => d.allowToDelete === false)) {
        setShowDeleteWarningConfirmBox(true);
      } else {
        setIsConformDialogVisible(true);
      }
    }
  };

  const handleDeleteRole = async () => {
    setDeleteLoading(true);
    let records = [];
    if (deleteRecord?.id) {
      records.push(deleteRecord?.id);
    } else {
      selectedRecords.forEach((obj) => {
        records.push(obj.id);
      });
    }

    if (records.length > 0) {
      axiosInstance()
        .put(`/role/remove`, { ids: [...records] })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
          if (deleteRecord) setDeleteRecord({});
          fetchRoles();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setIsConformDialogVisible(false);
          setDeleteLoading(false);
        });
    }
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const handleCreate = () => {
    setIsOpen({ open: true, isClone: false, idToClone: null });
  };

  const handleClose = () => {
    setIsOpen({ open: false, isClone: false, idToClone: null });
  };
  const handleRoleTypeSelect = (filteredValue) => {
    setSelectedType(filteredValue);
  };

  const userDialogOpen = () => {
    setShowAssignUserDialog(true);
  };

  const userDialogClose = () => {
    setShowAssignUserDialog(false);
  };

  const disableDelete = selectedRecords.some((o) => rolePermissionArray.indexOf(o?.permission) >= 0);

  return (
    <>
      {isOpen?.open && (
        <CreateRole
          open={isOpen?.open}
          close={handleClose}
          fetchData={fetchRoles}
          roleType={2}
          setToastConfig={toastConfig.setToastConfig}
          selectedEntity={selectedEntity || ''}
          roleId={isOpen?.idToClone}
          isClone={isOpen?.isClone}
        />
      )}
      {showAssignUserDialog &&
        (selectedType === roleTypes.find((d) => d.key === 'Global')?.value ? (
          <AssignUserDialog
            usersDialogOpen={showAssignUserDialog}
            handleCloseDialog={userDialogClose}
            roleIds={selectedRecords.map((d) => d._id)}
            assignedUsers={[]}
            onSuccess={() => {
              userDialogClose();
            }}
            selectedEntity={selectedEntity || ''}
          />
        ) : (
          <AssignRegionalRolesUserDialog
            entitiesDialogOpen={showAssignUserDialog}
            handleCloseDialog={userDialogClose}
            ids={selectedRecords.map((d) => d._id)}
            assignedUsers={[]}
            onSuccess={() => {
              userDialogClose();
            }}
          />
        ))}
      <Fragment>
        <Grid container className="headerbox">
          <Grid item md={12} sm={12} xs={12}>
            <CustomBreadCrumbs routes={[routes.role]} />
          </Grid>
        </Grid>
        <CustomContainer>
          <div className="header-panel">
            <RoleHeader
              selectedType={selectedType}
              onTypeChange={handleRoleTypeSelect}
              options={roleTypes}
              onSearch={handleSearch}
              search={search}
              rolePermissions={permissions.role}
              onCreate={handleCreate}
              showConfirmBox={showConfirmBox}
              canDelete={!disableDelete}
              selectedRecords={selectedRecords}
              userDialogOpen={userDialogOpen}
              dispatch={dispatch}
              columns={columns}
              filters={filters}
            />
          </div>

          {isMobile && !isTablet ? (
            <CustomSwipableList
              allowSelection={true}
              allowSwipe={true}
              permissions={permissions.role}
              primaryField={columns?.find((d) => d.field === 'name')}
              onClick={(d) => {
                history.push(`${routes.roleDetail.path}/${d._id}`);
              }}
              dataRows={dataRows}
              selectedRecords={selectedRecords}
              dispatch={dispatch}
              onEdit={(d) => {
                history.push(`${routes.roleDetail.path}/${d._id}`);
              }}
              extraParamsToCheckDelete={true}
              onDelete={(d) => {}}
              rowCount={rowCount}
              page={page}
              loading={loading}
              additionalDetails={[
                {
                  icon: <FaSuitcase size={18} />,
                  field: 'type'
                }
              ]}
              chips={[
                {
                  icon: <MdDescription />,
                  label: 'Description: ',
                  field: 'description'
                },
                {
                  icon: <IoCreateSharp />,
                  label: 'Created By: ',
                  field: 'createdBy'
                }
              ]}
              owerCollaboratorInitialsOrImages=""
              onCreate={false}
              showClone={false}
              onClone={() => {}}
              renderedFrom={'role'}
            />
          ) : (
            <CustomAgGrid
              columns={columns}
              dataRows={dataRows}
              frameworkComponents={frameworkComponents}
              setGridApi={setGridApi}
              dispatch={dispatch}
              rowCount={rowCount}
              limit={limit}
              pageSizes={pageSizes}
              page={page}
              actionWidth={100}
              loading={loading}
              isClientSideGrid={true}
              refreshGrid={fetchRoles}
              renderedFrom={renderedFrom}
            />
          )}
        </CustomContainer>
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
            message={`Are you sure you want to delete role ${deleteRecord?.name || ''}?`}
            onClose={() => {
              setDeleteRecord(null);
              setIsConformDialogVisible(false);
            }}
            okBtnLoading={deleteLoading}
            onOk={handleDeleteRole}
          />
        ) : null}
      </Fragment>
    </>
  );
};

export default Roles;
