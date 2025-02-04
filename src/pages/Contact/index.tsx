import { Box, Chip, Dialog, MenuItem } from '@mui/material';
import IconButton from '@mui/material/IconButton';
import DeleteIcon from '@mui/icons-material/Delete';
import FileCopyIcon from '@mui/icons-material/FileCopy';
import { camelCase } from 'lodash';
import { useContext, useEffect, useState } from 'react';
import { AiOutlineDeploymentUnit } from 'react-icons/ai';
import { Link, useHistory } from 'react-router-dom';
import CustomReactTable, { getStaticFields, gridFilterParser, useColumns, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { cloneDisable, deleteDisable, entityDisable } from 'src/constants/messageHelpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import { SET_SELECTED_ENTITY } from '../../StateProvider/actionTypes';
import axiosInstance from '../../axios/axiosInstance';
import AssignEntityDialog from '../../components/AssignRolesDialog/AssignEntityDialog';
import CustomContainer from '../../components/CustomContainer';
import EntitySelectionsDialog from '../../components/EntitySelections';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import CustomRenderCell from '../../components/Helpers/CustomRenderCell';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import NoDataCell from '../../components/Helpers/NoDataCell';
import {
  checkIsAllowedToDelete,
  checkIsAllowedToEdit,
  CustomDialogTransition,
  getDefaultMyRecordType,
  gridLoadingTimeout,
  prepareDataForGrid,
  sidebarResource,
  userType
} from '../../constants/helpers';
import WarhouseList from '../Account/Warehouse/WarhouseList';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import routes from './../../components/Helpers/Routes';
import ManageContactDialog from './ManageContact';
import { isMobile, isTablet } from 'react-device-detect';

export default function Contact(props) {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, selectedEntity, permissions, resources },
    dispatch: entityDispatch
  }: any = useData();
  const {
    contact: { contactApi, contactResource, contactPermission, contactRoute }
  } = props;
  const [selectedType, setSelectedType] = useState(getDefaultMyRecordType(user.user, sidebarResource[contactResource]));
  const [contactId, setContactId] = useState('');
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [showCreateContactDialog, setShowCreateContactDialog] = useState({ open: false, isClone: false, idToClone: null });

  const [accountDetails, setAccountDetails] = useState({
    accountId: history.location?.state?.accountId,
    accountName: history.location?.state?.accountName
  });

  const [contactPermissions, setContactPermissions] = useState<any>({
    isCreate: permissions[contactResource]?.isCreate,
    isUpdate: permissions[contactResource]?.isUpdate,
    isRead: permissions[contactResource]?.isRead,
    isDelete: permissions[contactResource]?.isDelete
  });
  const [showEntityDialog, setShowEntityDialog] = useState(false);
  const [openAddPlantsDialog, setOpenAddPlantsDialog] = useState(false);
  const [isAddingWarehouse, setAddingWarehouse] = useState(false);
  const [entities, setEntities] = useState([]);
  const [columns, setColumns] = useState(null);
  const { generateColumns, checkStaticField } = useColumns();

  const types = [
    {
      key: `My ${resources[contactResource]?.titlePlural}`,
      value: 1
    },
    {
      key: `All ${resources[contactResource]?.titlePlural}`,
      value: 2
    }
  ];

  const renderedFrom = camelCase(contactResource);

  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { rowCount, page, limit, search, filters, sorting, selectedRecords, showFilteredRecordsOnly } = state;

  const [showAssignEntityDialog, setShowAssignEntityDialog] = useState(false);
  const [entityAccess, setEntityAccess] = useState([]);
  const [roleAccessOfLoggedInUser, setRoleAccessOfLoggedInUser] = useState([]);

  useEffect(() => {
    fetchGridColumns();
    fetchLoggedInUserEntities();
    fetchLoggedInUserRole();
  }, []);

  const fetchGridColumns = async () => {
    const response = await axiosInstance().get(`/field?resource=${sidebarResource[contactResource]}`);
    let data = response?.data?.data;

    let newColumns = generateColumns(contactResource, data, `/${contactRoute}/detail`, true);
    let staticFields = getStaticFields();
    staticFields.forEach((field) => {
      newColumns.push(checkStaticField(sidebarResource.projectSales, field));
    });
    setColumns([...newColumns, ActionsRenderer]);
  };

  useEffect(() => {
    const data = user?.role?.sideBar;
    if (data) {
      const hasContactPermission = data.find((d) => d.name === contactPermission);
      if (hasContactPermission) {
        setContactPermissions({
          isCreate: hasContactPermission.isCreate,
          isRead: hasContactPermission.isRead,
          isDelete: hasContactPermission.isDelete,
          isUpdate: hasContactPermission.isUpdate
        });
      }
    }
  }, [user]);

  useEffect(() => {
    getContacts();
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly, selectedType]);

  const handleEntityChange = (entityId) => {
    entityDispatch({ type: SET_SELECTED_ENTITY, payload: entityId });
  };

  const hasAccessToEntity = (id) => {
    const entityList = user.entity?.map((entity) => entity._id);
    return entityList.includes(id);
  };

  const handleAccessToPortal = () => {
    setShowAssignEntityDialog(true);
  };

  const fetchLoggedInUserRole = async () => {
    let roleIds = [];
    await axiosInstance()
      .get(`/user/${user.user?._id}`)
      .then(({ data: { data } }) => {
        data.entities.map((item) => {
          item.role.forEach((role) => {
            if (roleIds.includes(role?._id)) {
            } else {
              roleIds.push(role?._id);
            }
          });
        });
        setRoleAccessOfLoggedInUser(roleIds);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const fetchLoggedInUserEntities = async () => {
    const entityIds = user.entity?.map((e) => e._id);
    setEntityAccess(entityIds);
  };

  const ActionsRenderer = {
    accessor: 'action',
    Header: 'Actions',
    minWidth: 120,
    width: 120,
    sticky: 'right',
    disableFilters: true,
    disableSortBy: true,
    canDrag: false,
    Cell: ({ row }) => (
      <>
        <HtmlTooltip title={contactPermissions?.isCreate ? 'Clone' : cloneDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Clone"
              disabled={contactPermissions?.isCreate ? false : true}
              onClick={() => {
                setShowCreateContactDialog({ open: true, isClone: true, idToClone: row?.original?._id });
              }}
            >
              <FileCopyIcon fontSize="small" color={contactPermissions?.isCreate ? 'primary' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
        <HtmlTooltip title={contactPermissions?.isDelete && row?.original?.canDelete ? 'Delete' : deleteDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Clone"
              disabled={contactPermissions?.isDelete && row?.original?.canDelete ? false : true}
              onClick={() => {
                setDeleteRecord(row?.original);
                setShowDeleteConfirmBox(true);
              }}
            >
              <DeleteIcon fontSize="small" color={contactPermissions?.isDelete && row?.original?.canDelete ? 'error' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
        <HtmlTooltip title={contactPermissions?.isUpdate && row?.original?.canEdit ? 'Entity' : entityDisable}>
          <span>
            <IconButton
              size="small"
              aria-label="Entity"
              disabled={contactPermissions?.isUpdate && row?.original?.canEdit ? false : true}
              onClick={() => {
                setContactId(row?.original?._id);
                setShowEntityDialog(true);
                if (row?.original?.entityId) {
                  let entities = [];
                  if (row?.original?.entityId) {
                    entities.push(row?.original?.entityId);
                  }
                  if (row?.original?.restentity) {
                    let restEntities = row?.original?.restentity.map((o) => o?.optionValue);
                    entities = [...entities, ...restEntities];
                  }
                  setEntities([...entities]);
                } else if (row?.original?.restentity) {
                  let restEntities = row?.original?.restentity.map((o) => o?.optionValue);
                  setEntities([...restEntities]);
                }
              }}
            >
              <AiOutlineDeploymentUnit fontSize="15" color={contactPermissions?.isUpdate && row?.original?.canEdit ? 'primary' : 'disabled'} />
            </IconButton>
          </span>
        </HtmlTooltip>
      </>
    )
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

    const { filterByIds, deepFilters } = gridFilterParser(filters);

    if (accountDetails.accountId) {
      filterByIds.push({ field: 'accountName', term: accountDetails.accountId });
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
      deepFilter = `${deepFilter}&getById=${JSON.stringify((selectedRecords || []).map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const getContacts = () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    axiosInstance()
      .get(`${contactApi}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          let finalObject = prepareDataForGrid(u, user);
          finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
          return {
            ...finalObject,
            canDelete: checkIsAllowedToDelete(user, sidebarResource[contactResource], u?.owner?.optionValue),
            canEdit: checkIsAllowedToEdit(user, sidebarResource[contactResource], data),
            relatedLead: u.staticData && u.staticData.lead && u.staticData.lead.concatedName,
            relatedLeadId: u.staticData && u.staticData.lead && u.staticData.lead._id,
            relatedLeadEntity: u.staticData && u.staticData.lead && u.staticData.lead?.entity
          };
        });
        dispatch({ type: 'initialize', data: rows, count: count });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      })
      .finally(() => {
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

  const clickCreateNew = () => {
    setShowCreateContactDialog({ open: true, isClone: false, idToClone: null });
  };

  const handleDeleteContact = () => {
    setIsSubmitting(true);
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords?.map((d) => d._id);
    }
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .put(`/${contactApi}/remove`, {
        ids
      })
      .then(({ data }) => {
        setIsSubmitting(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        dispatch({ type: 'selection', selectedRecords: [] });
        setDeleteRecord(null);
        setShowDeleteConfirmBox(false);
        getContacts();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
      .finally(() => {
        dispatch({ type: 'loading', loading: false });
        setIsSubmitting(false);
      });
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const onTypeChange = (event, type) => {
    dispatch({ type: 'pageChange', page: 0 });
  };

  const LeftSideContents = () => {
    return (
      <>
        {accountDetails.accountId ? (
          <Chip
            className="ml-3"
            color="primary"
            label={`Account: ${accountDetails.accountName}`}
            onDelete={() => {
              setAccountDetails({ accountId: null, accountName: null });
            }}
          />
        ) : null}
      </>
    );
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ title: resources[contactResource]?.titlePlural }]} />
        <ImportExportLinks
          permissions={contactPermissions}
          module="contact(s)"
          api={contactApi}
          afterImportCompleted={() => {
            getContacts();
          }}
          isExportAllOrSomeFeature={true}
          total={rowCount}
          recordsToExport={selectedRecords?.length}
          ids={selectedRecords?.map((obj) => obj._id)}
          onExportToExcelSuccess={() => {
            getContacts();
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
          leftSideContents={<LeftSideContents />}
          searchValue={search}
          onSearch={handleSearch}
          isActionButtonVisible={contactPermissions?.isDelete || contactPermissions?.isUpdate}
          actionButtonProps={{ disabled: selectedRecords?.length === 0 }}
          actionMenuItems={
            <ActionMenuItems
              {...{
                contactPermissions,
                selectedRecords,
                setDeleteRecord,
                setShowDeleteConfirmBox,
                user,
                handleAccessToPortal,
                contactResource,
                permissions,
                setOpenAddPlantsDialog,
                setEntities,
                setShowEntityDialog,
                resources
              }}
            />
          }
          addButtonProps={{ disabled: !contactPermissions?.isCreate }}
          addButtonOnclick={clickCreateNew}
          isAddButtonVisible={true}
        />

        {columns ? (
          <CustomReactTable
            height={'calc(100vh - 200px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            renderedFrom={renderedFrom}
            refreshGrid={getContacts}
            showOnlyShowFilteredRecordSwitch={true}
            showFilters={true}
            resource={sidebarResource[contactResource]}
          />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
        <Box component="div">
          {showDeleteConfirmBox ? (
            <ConfirmationDialog
              open={showDeleteConfirmBox}
              message={`Are you sure you want to delete ${deleteRecord
                ? `${resources?.[contactResource]?.titleSingular?.toLowerCase()} : ${deleteRecord?.concatedName}`
                : `selected ${resources?.[contactResource]?.titlePlural?.toLowerCase()}`
                } ?`}
              onClose={() => {
                setShowDeleteConfirmBox(false);
                setDeleteRecord(null);
              }}
              okBtnLoading={isSubmitting}
              onOk={handleDeleteContact}
            />
          ) : null}
          {showCreateContactDialog?.open && (
            <ManageContactDialog
              contactResource={contactResource}
              contactApi={contactApi}
              contactId={showCreateContactDialog?.idToClone}
              isClone={showCreateContactDialog?.isClone}
              onClose={() => {
                setShowCreateContactDialog({ open: false, isClone: false, idToClone: null });
              }}
              onSuccess={() => { }}
              isRedirectToDetailPage={true}
            />
          )}

          {showAssignEntityDialog && (
            <Dialog
              fullWidth
              fullScreen={isMobile || isTablet}
              TransitionComponent={CustomDialogTransition}
              maxWidth="xs"
              open={showAssignEntityDialog}
              onClose={() => setShowAssignEntityDialog(false)}
              aria-labelledby="assign-roles-dialog"
            >
              <AssignEntityDialog
                entitiesDialogOpen={showAssignEntityDialog}
                onSuccess={() => {
                  setShowAssignEntityDialog(false);
                  getContacts();
                }}
                handleCloseDialog={() => setShowAssignEntityDialog(false)}
                assignedEntity={[]}
                ids={selectedRecords?.map((record) => record._id || record.id)}
                isRenderedFromContact={true}
                regionalRole={false}
                type="entity"
                entityAccessIds={entityAccess}
                roleAccessIds={roleAccessOfLoggedInUser}
                contactResource={contactResource}
              />
            </Dialog>
          )}

          {openAddPlantsDialog && (
            <WarhouseList
              isCustomer={true}
              api={`/customer-account/${selectedRecords[0]?.accountNameId}/warehouse`}
              isAddingWarehouse={isAddingWarehouse}
              addWarehouse={(selectedPlants: any) => {
                setAddingWarehouse(true);
                axiosInstance()
                  .post(`/customer-contact/assign-warehouse`, {
                    ids: selectedRecords.map((d: any) => d._id),
                    warehouse: selectedPlants.map((d: any) => d._id)
                  })
                  .then(() => {
                    getContacts();
                    setAddingWarehouse(false);
                    setOpenAddPlantsDialog(false);
                  })
                  .catch((err) => {
                    toastConfig.setToastConfig(err);
                    setAddingWarehouse(false);
                    setOpenAddPlantsDialog(false);
                  });
              }}
              onClose={() => setOpenAddPlantsDialog(false)}
              assignedWarehouse={[]}
            />
          )}

          {showEntityDialog ? (
            <EntitySelectionsDialog
              open={showEntityDialog}
              resource={sidebarResource[contactResource]}
              resourceIds={selectedRecords?.length ? selectedRecords?.map((o) => o._id) : [contactId]}
              onClose={() => {
                setShowEntityDialog(false);
                setContactId('');
              }}
              onSuccess={getContacts}
              entities={entities}
            />
          ) : null}
        </Box>
      </CustomContainer>
    </section>
  );
}

const ActionMenuItems = ({
  contactPermissions,
  selectedRecords,
  setDeleteRecord,
  setShowDeleteConfirmBox,
  user,
  handleAccessToPortal,
  contactResource,
  permissions,
  setOpenAddPlantsDialog,
  setEntities,
  setShowEntityDialog,
  resources
}) => {
  return (
    <>
      {contactPermissions?.isDelete && (
        <MenuItem
          disabled={selectedRecords?.every((e) => e?.canDelete) ? false : true}
          onClick={() => {
            if (selectedRecords.length === 1) {
              setDeleteRecord(selectedRecords[0]);
            } else {
              setDeleteRecord(null);
            }
            setShowDeleteConfirmBox(true);
          }}
        >
          {`Delete (${selectedRecords?.length})`}
        </MenuItem>
      )}
      {user.user?.userType === userType.brandAdmin && (
        <MenuItem disabled={selectedRecords?.length === 0 || selectedRecords?.some((record) => record?.isUserExist)} onClick={handleAccessToPortal}>
          Give Access to Portal
        </MenuItem>
      )}
      {contactPermissions?.isUpdate && contactResource === 'customerContact' && permissions?.productInventory && (
        <MenuItem
          disabled={selectedRecords?.length === 0 || [...new Set(selectedRecords?.map((d) => d.accountNameId))].length > 1}
          onClick={() => {
            setOpenAddPlantsDialog(true);
          }}
        >
          Assign {resources?.warehouse?.titlePlural} &nbsp; <Chip size="small" label={selectedRecords?.length} />
        </MenuItem>
      )}
      {contactPermissions?.isUpdate && (
        <MenuItem
          disabled={selectedRecords?.length === 0}
          onClick={() => {
            if (selectedRecords?.length) {
              let entities = [];
              selectedRecords?.map((current) => {
                if (current?.entityId) {
                  entities = [...entities, current?.entityId];
                }
                if (current?.restentity) {
                  let restEntities = current?.restentity.map((o) => o?.optionValue);
                  entities = [...entities, ...restEntities];
                }
              });
              setEntities([...entities]);
            }
            setShowEntityDialog(true);
          }}
        >
          Assign Entity &nbsp; <Chip size="small" label={selectedRecords?.length} />
        </MenuItem>
      )}
    </>
  );
};
