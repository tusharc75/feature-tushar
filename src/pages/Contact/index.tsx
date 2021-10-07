import { useContext, useEffect, useState, useReducer, Fragment } from 'react';
import { Box, Button, Menu, MenuItem, Grid } from '@material-ui/core';
import { useData } from '../../StateProvider/Provider';
import { Link } from 'react-router-dom';
import { ExpandMore } from '@material-ui/icons';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import AddIcon from '@material-ui/icons/Add';
import ManageContactDialog from './ManageContact/index';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import SearchBox from '../../components/Helpers/SearchBox';
import CustomContainer from '../../components/CustomContainer';
import MessageDialog from '../../components/Helpers/MessageDialog';
import styles from '../Leads/Header.module.scss';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import { MdContacts } from 'react-icons/md';
import axiosInstance from '../../axios/axiosInstance';
import { isObjectEmpty, gridLoadingTimeout } from '../../constants/helpers';
import NoDataCell from '../../components/Helpers/NoDataCell';
import { useHistory } from 'react-router-dom';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import { Chip } from '@material-ui/core';
import routes from './../../components/Helpers/Routes';
import {
  CommonRenderer,
  CreatedByRenderer,
  UpdatedByRenderer,
  CommonRendererWithCopy
} from '../../components/AgGridComponents/CustomAgGridCellRenderers';
import GridDeleteIcon from '../../components/Helpers/GridDeleteIcon';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import contactClass from './contact.module.scss'
import { SET_SELECTED_ENTITY } from '../../StateProvider/actionTypes';
import CustomRenderCell from '../../components/Helpers/CustomRenderCell';
import EntitySelectionsDialog from "../../components/EntitySelections"
import { AiOutlineDeploymentUnit } from "react-icons/ai"
import { sidebarResource } from "../../constants/helpers"
import Tooltip from "@material-ui/core/Tooltip"
import IconButton from "@material-ui/core/IconButton"
import FileCopyIcon from '@material-ui/icons/FileCopy';

const ContactTypes = [
  {
    key: 'All Contacts',
    value: 1
  },
  {
    key: 'My Contacts',
    value: 2
  }
];

let contactTimeout;
export default function Contact(props) {
  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, selectedEntity, permissions }, dispatch: entityDispatch
  }: any = useData();
  const {
    contact: { contactApi, contactResource, contactPermission, contactRoute },
    account
  } = props;
  const [selectedType, setSelectedType] = useState(1);
  const [anchorEl, setAnchorEl] = useState(null);
  const [contactId, setContactId] = useState('');
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [renderCount, setRenderCount] = useState(0);

  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState({ show: false, isDelete: false });
  const [showCreateContactDialog, setShowCreateContactDialog] = useState({ open: false, isClone: false, idToClone: null });
  const [singleContactDelete, setSingleContactDelete] = useState({
    id: null,
    show: false,
    contactedName: ''
  });

  const [accountDetails, setAccountDetails] = useState({
    accountId: history.location?.state?.accountId,
    accountName: history.location?.state?.accountName
  });
  const [contactPermissions, setContactPermissions] = useState<any>({
    isCreate: permissions[contactResource]?.isCreate,
    isUpdate: permissions[contactResource]?.isUpdate,
    isRead: permissions[contactResource]?.isRead,
    isDelete: permissions[contactResource]?.isDelete,
  });
  const [showEntityDialog, setShowEntityDialog] = useState(false)

  const [filter, setFilter] = useState('All Contacts');
  const [entities, setEntities] = useState([])

  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;
  const columnState = JSON.parse(localStorage.getItem(contactResource));

  // const [showGridFilters, setShowGridFilters] = useState(true)
  const columns = [
    { field: 'concatedName', headerName: 'Name', show: true, disabled: true, cellRenderer: 'concatedNameRenderer' },
    { field: 'relatedLead', headerName: 'Related Lead', show: true, cellRenderer: 'relatedLeadRenderer' },
    { field: 'entity', headerName: 'Entity Name', show: true, cellRenderer: 'entityRenderer' },
    { field: 'phone', headerName: 'Phone', show: true, cellRenderer: 'commonRendererWithCopy' },
    { field: 'email', headerName: 'Email', show: true, cellRenderer: 'commonRendererWithCopy' },
    { field: 'createdBy', headerName: 'Created By', show: true, cellRenderer: 'createdByRenderer' },
    { field: 'updatedBy', headerName: 'Updated By', show: true, cellRenderer: 'updatedByRenderer' },
    { field: 'accountName', headerName: 'Account Name', show: true, cellRenderer: 'accountNameRenderer' }
  ];
  //  Grid Variables - End
  if (columnState) {
    columns.map((item) => {
      columnState.map((d) => {
        if (d.colId == item.field) {
          item.show = !d.hide;
        }
      });
    });
  }

  const handleFilter = (event, newFilter) => {
    if (newFilter !== null) {
      setFilter(newFilter);
      handleContactSelect(ContactTypes.find((d) => d.key === newFilter).value);
    }
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
    let millisec = Object.keys(search).length > 0 ? 600 : 5;

    if (contactTimeout) {
      clearTimeout(contactTimeout);
    }

    contactTimeout = setTimeout(() => {
      getContacts();
    }, millisec);
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      getContacts();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, selectedType, filters, sorting, accountDetails, selectedEntity]);

  const handleEntityChange = (entityId) => {
    entityDispatch({ type: SET_SELECTED_ENTITY, payload: entityId });
  }

  const hasAccessToEntity = (id) => {
    const entityList = user.entity?.map((entity) => entity._id);
    return entityList.includes(id);
  }

  const ConcatedNameRenderer = (params) => (
    <Link className="link" to={`/${contactRoute}/detail/${params.data._id}`}>
      {params.value}
    </Link>
  );

  const EntityRenderer = (params) => (
    <h5 className="createBy d-flex">
      {params.data?.firstEntity ?
        <Link className="link" title={params.data.firstEntity} to={`${routes.entity.path}/detail/${params.data.firstEntityId}`}>
          {params.data.firstEntity}
        </Link>
        :
        <NoDataCell />
      }
      {params.data?.restEntity?.length > 0 && (
        <span className="createdAtTime badge-date">{`+${params.data.restEntity.length} more..`}</span>
      )}
    </h5>
  )


  const RelatedLeadRenderer = (params) =>
    params.value ? (
      params?.data?.relatedLeadEntity === selectedEntity ?
        <Link className="link" to={`${routes.leadDetail.path}/${params.data.relatedLeadId}`} title={params.value}>
          {params.value}
        </Link>
        :
        hasAccessToEntity(params?.data?.relatedLeadEntity) ?
          <span
            className="link"
            onClick={() => {
              handleEntityChange(params.data?.relatedLeadEntity)
              history.push(`${routes.leadDetail.path}/${params.data.relatedLeadId}`)
            }}
            title={params.value}
          >
            {params.value}
          </span>
          :
          <span
            title={params.value}
          >
            <CustomRenderCell value={params.value} />
          </span>
    ) : (
      <NoDataCell />
    );

  const AccountNameRenderer = (params) => (
    <Link className="link" to={`/${account.accountRoute}/detail/${params.data.accountId}`}>
      {params.value}
    </Link>
  );

  const ActionsRenderer = (params) => (
    <>
      <Tooltip
        className={contactPermissions.isCreate ? "" : "cursor-stop"}
        title={contactPermissions.isCreate ? "Clone" : "You do not have permission to clone/create"} >
        <IconButton
          size="small"
          aria-label="Clone"
          onClick={() => {
            setShowCreateContactDialog({ open: true, isClone: true, idToClone: params.data._id })
          }}
        >
          <FileCopyIcon fontSize="small" color="primary" />
        </IconButton>
      </Tooltip>
      <GridDeleteIcon
        hasDeletePermission={contactPermissions.isDelete}
        ownerId={params.data.ownerId}
        userId={user?.user?._id}
        onDelete={() => {
          setSingleContactDelete({
            show: true,
            id: params.data._id,
            contactedName: params.data.concatedName
          });
        }}
        entity="contact"
      />

      {
        contactPermissions.isUpdate &&
        <Tooltip title="Entity">
          <IconButton
            size="small"
            aria-label="Entity"
            onClick={() => {
              setContactId(params.data._id)
              setShowEntityDialog(true)
              if (params?.data?.firstEntityId) {
                let entities = []
                if (params?.data?.firstEntityId) {
                  entities.push(params?.data?.firstEntityId)
                }
                if (params?.data?.restEntity) {
                  let restEntities = params?.data?.restEntity.map(o => o?.optionValue)
                  entities = [...entities, ...restEntities]
                }
                setEntities([...entities])
              }
              else if (params?.data?.restEntity) {
                let restEntities = params?.data?.restEntity.map(o => o?.optionValue)
                setEntities([...restEntities])
              }
            }}>
            <AiOutlineDeploymentUnit fontSize="15" color="primary" />
          </IconButton>
        </Tooltip>
      }
    </>
  );

  const frameworkComponents = {
    concatedNameRenderer: ConcatedNameRenderer,
    relatedLeadRenderer: RelatedLeadRenderer,
    commonRenderer: CommonRenderer,
    commonRendererWithCopy: CommonRendererWithCopy,
    createdByRenderer: CreatedByRenderer,
    updatedByRenderer: UpdatedByRenderer,
    accountNameRenderer: AccountNameRenderer,
    actionsRenderer: ActionsRenderer,
    entityRenderer: EntityRenderer,
  };

  const replaceFieldName = (field) => {
    switch (field) {
      case 'createdBy':
        return 'createdBy.user.concatedName';

      case 'updatedBy':
        return 'updatedBy.user.concatedName';

      case 'lead':
        return 'staticData.lead.concatedName';

      default:
        return field;
    }
  };

  const replaceFieldNameForSorting = (field) => {
    const updatedField = replaceFieldName(field);

    if (field !== updatedField) return updatedField;

    switch (field) {
      case 'owner':
        return 'owner.optionLabel';

      case 'accountName':
        return 'accountName.optionLabel';

      case 'entity':
        return 'entity.optionLabel';

      default:
        return field;
    }
  };

  const getQueryString = () => {
    let deepFilter = `?page=${page}&limit=${limit}&filterContacts=${selectedType}`;

    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

    if (accountDetails.accountId) {
      deepFilter = `${deepFilter}&filterById=${JSON.stringify([{ field: replaceFieldName('accountName'), term: accountDetails.accountId }])}`;
    }

    if (!isObjectEmpty(filters)) {
      const updatedFilters = [];

      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: replaceFieldName(field),
          term: filters[field].filter
        });
      });
      deepFilter = `${deepFilter}&deepFilter=${JSON.stringify(updatedFilters)}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${replaceFieldNameForSorting(sorting[0].colId)}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${search}`;
    }

    return deepFilter;
  };

  const getContacts = () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    if (gridApi) {
      gridApi.setRowData([]);
    }

    axiosInstance()
      .get(`${contactApi}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data.map((u) => {
          const { owner, collaborator, createdBy, updatedBy, accountName, staticData, entity, ...restProperties } = u;
          const [firstEntity, ...restEntity] = entity;
          return {
            ...restProperties,
            id: u._id,

            canDelete: u.owner?.optionValue === user?.user._id,

            accountId: u.accountName?.optionValue,
            accountName: u.accountName?.optionLabel,

            firstEntity: firstEntity?.optionLabel ?? '',
            firstEntityId: firstEntity?.optionValue ?? '',
            restEntity: restEntity,
            relatedLead: u.staticData && u.staticData.lead && u.staticData.lead.concatedName,
            relatedLeadId: u.staticData && u.staticData.lead && u.staticData.lead._id,
            relatedLeadEntity: u.staticData && u.staticData.lead && u.staticData.lead?.entity,
            owner: u.owner?.optionLabel,
            ownerId: u.owner?.optionValue,

            createdBy: u.createdBy?.user?.concatedName,
            createdByDate: u.createdBy?.date,
            updatedBy: u.updatedBy?.user?.concatedName,
            updatedByDate: u.updatedBy?.date
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

  const handleSingleDeleteContacts = async () => {
    dispatch({ type: 'loading', loading: true });
    axiosInstance()
      .put(`/${contactApi}/remove`, { ids: [singleContactDelete.id] })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        getContacts();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
    setSingleContactDelete({ id: null, show: false, contactedName: '' });
  };

  // ****** ACTIONS BUTTON STUFF *********
  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };
  const clickCreateNew = () => {
    setShowCreateContactDialog({ open: true, isClone: false, idToClone: null });
  };

  const handleDeleteContact = () => {
    const selectedContacts = selectedRecords.map((m) => {
      return m.id;
    });

    if (selectedContacts.length > 0) {
      dispatch({ type: 'loading', loading: true });
      axiosInstance()
        .put(`/${contactApi}/remove`, {
          ids: [...selectedContacts]
        })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          getContacts();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        })
        .finally(() => {
          dispatch({ type: 'loading', loading: false });
          setShowDeleteConfirmBox(false);
        });
    }
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const handleContactSelect = (filterValues) => {
    setSelectedType(filterValues);
  };

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[{ title: routes[contactResource].title }]}
          />
        </Grid>
        <Grid item md={8} sm={1} xs={2}>
          <ImportExportLinks
            permissions={contactPermissions}
            module="contact(s)"
            api={contactApi}
            afterImportCompleted={() => {
              getContacts();
            }}
            isExportAllOrSomeFeature={true}
            total={rowCount}
            recordsToExport={selectedRecords.length}
            ids={selectedRecords.length ? selectedRecords.map((obj) => obj._id) : []}
            onExportToExcelSuccess={() => {
              if (gridApi) gridApi.deselectAll()
              else getContacts()
            }}
          />
        </Grid>
      </Grid>

      <CustomContainer>
        <div className={`${contactClass['contact_header_inner_container']}`}>
          <Grid container className="header-panel" justify="space-between" alignContent="center">
            <Grid item md={6} sm={6} xs={12} className="d-flex align-items-center gap-1">
              <Grid container>
                <Grid item md={4} sm={4} xs={12} className="d-flex align-items-center gap-1" >
                  <MdContacts className="headerLogo" />
                  <span id="resourceHeader" className="listingHeader">{routes[contactResource].title}</span>
                </Grid>
                <Grid item md={4} sm={4} xs={12}>
                  {ContactTypes && (
                    <ToggleButtonGroup id="resourceTypeSelector" size="small" className="ml-8" value={filter} exclusive onChange={handleFilter}>
                      {ContactTypes.map((k, index) => {
                        return (
                          <ToggleButton value={k.key} key={index}>
                            {k.key}
                          </ToggleButton>
                        );
                      })}
                    </ToggleButtonGroup>
                  )}
                </Grid>
                <Grid className={styles.Related_Account}>
                  {accountDetails.accountId && (
                    <Chip
                      className="ml-3"
                      color="primary"
                      label={`Account: ${accountDetails.accountName}`}
                      onDelete={() => {
                        setAccountDetails({ accountId: null, accountName: null });
                        // getContacts();
                      }}
                    />
                  )}
                </Grid>
              </Grid>
            </Grid>
            <Grid item md={6} sm={6} xs={12} className={styles.filter_side}>
              <Box id="resourceOperations" className={styles.filter_side_header} component="div">
                <SearchBox onSearch={handleSearch} searchbox={styles.search_box_input} value={search} size="small" />
                {contactPermissions.isCreate && (
                  <>
                    <Button
                      variant="contained"
                      color="primary"
                      size="small"
                      onClick={clickCreateNew}
                      startIcon={<AddIcon />}
                      className={styles.add_submit_btn}
                    >
                      Add
                    </Button>
                  </>
                )}
                <>
                  <Button
                    // disabled={Boolean(!selectedBrand)}
                    disabled={selectedRecords.length === 0}
                    variant="outlined"
                    color="default"
                    size="small"
                    onClick={openActions}
                    className={styles.action_submit_btn}
                    aria-controls="action-menu"
                  >
                    Actions <ExpandMore />
                  </Button>
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
                    {contactPermissions.isDelete && (
                      <MenuItem
                        disabled={selectedRecords.length === 0}
                        onClick={() => {
                          if (selectedRecords.some((d) => d.canDelete === false)) {
                            closeActions();
                            setShowDeleteWarningConfirmBox({ show: true, isDelete: true });
                          } else {
                            closeActions();
                            setShowDeleteConfirmBox(true);
                          }
                        }}>
                        Delete
                      </MenuItem>)}
                    {contactPermissions.isUpdate && (
                      <MenuItem
                        disabled={selectedRecords.length === 0}
                        onClick={() => {
                          if (selectedRecords.some((d) => d.isUpdate === false)) {
                            closeActions();
                            setShowDeleteWarningConfirmBox({ show: true, isDelete: false });
                          } else {
                            closeActions();
                            if (selectedRecords.length) {
                              let entities = []
                              selectedRecords.map(current => {

                                if (current?.firstEntityId) {
                                  entities = [...entities, current?.firstEntityId]
                                }
                                if (current?.restEntity) {
                                  let restEntities = current?.restEntity.map(o => o?.optionValue)
                                  entities = [...entities, ...restEntities]
                                }
                              })
                              setEntities([...entities])
                            }
                            setShowEntityDialog(true)
                          }
                        }}
                      >
                        Assign Entity &nbsp; <Chip size="small" label={selectedRecords.length} />
                      </MenuItem>
                    )}
                  </Menu>
                </>

              </Box>
            </Grid>
          </Grid>
        </div>
        <Box component="div">
          <CustomAgGrid
            columns={columns}
            dataRows={dataRows}
            frameworkComponents={frameworkComponents}
            setGridApi={setGridApi}
            dispatch={dispatch}
            rowCount={rowCount}
            limit={limit}
            pageSizes={pageSizes}
            actionWidth={170}
            page={page}
            loading={loading}
            renderedFrom={contactResource}
          />

          {showDeleteWarningConfirmBox?.show ? (
            <MessageDialog
              open={showDeleteWarningConfirmBox?.show}
              message={showDeleteWarningConfirmBox?.isDelete ?
                `You are trying to delete records which you do not have permission to delete, Please remove those records from selection and try again.`
                : `You are trying to update records which you do not have permission to update, Please remove those records from selection and try again.`
              }
              onClose={() => setShowDeleteWarningConfirmBox({ show: false, isDelete: false })}
            />
          ) : null}
          {showDeleteConfirmBox ? (
            <ConfirmationDialog
              open={showDeleteConfirmBox}
              message={`Are you sure you want to delete selected Contacts ?`}
              onClose={() => setShowDeleteConfirmBox(false)}
              onOk={handleDeleteContact}
            />
          ) : null}

          {showCreateContactDialog?.open && (
            <ManageContactDialog
              open={showCreateContactDialog?.open}
              onClose={() => setShowCreateContactDialog({ open: false, isClone: false, idToClone: null })}
              onSuccess={() => {
                setShowCreateContactDialog({ open: false, isClone: false, idToClone: null });
                getContacts();
              }}
              contactResource={contactResource}
              contactApi={contactApi}
              account={account}
              contactId={showCreateContactDialog?.idToClone}
              isClone={showCreateContactDialog?.isClone}
            />
          )}

          {singleContactDelete.show ? (
            <ConfirmationDialog
              open={singleContactDelete.show}
              message={`Are you sure, you want to delete contact: ${singleContactDelete.contactedName} ?`}
              onClose={() =>
                setSingleContactDelete({
                  id: null,
                  show: false,
                  contactedName: ''
                })
              }
              onOk={handleSingleDeleteContacts}
            />
          ) : null}
          {
            showEntityDialog ?
              <EntitySelectionsDialog
                open={showEntityDialog}
                resource={sidebarResource[contactResource]}
                resourceIds={selectedRecords.length ? selectedRecords.map(o => o._id) : [contactId]}
                onClose={() => {
                  setShowEntityDialog(false)
                  setContactId("")
                }}
                onSuccess={getContacts}
                entities={entities}
              /> : null
          }
        </Box>
      </CustomContainer>
    </Fragment>
  );
}
