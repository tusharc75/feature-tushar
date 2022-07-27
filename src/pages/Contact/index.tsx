import { useContext, useEffect, useState, useReducer, Fragment } from 'react';
import { Box, Button, Menu, MenuItem, Grid, Dialog } from '@material-ui/core';
import { useData } from '../../StateProvider/Provider';
import { Link, useLocation } from 'react-router-dom';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import AddIcon from '@material-ui/icons/Add';
import ManageContactDialog from './ManageContact/index';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import SearchBox from '../../components/Helpers/SearchBox';
import CustomContainer from '../../components/CustomContainer';
import MessageDialog from '../../components/Helpers/MessageDialog';
import styles from '../Leads/Header.module.scss';
import style from './contact.module.scss';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import { MdContacts } from 'react-icons/md';
import axiosInstance from '../../axios/axiosInstance';
import { isObjectEmpty, gridLoadingTimeout, prepareDataForGrid, userType, getLocalStorageArrayData, removeLocalStorage } from '../../constants/helpers';
import { useHistory } from 'react-router-dom';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import { Chip } from '@material-ui/core';
import routes from './../../components/Helpers/Routes';
import GridDeleteIcon from '../../components/Helpers/GridDeleteIcon';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import contactClass from './contact.module.scss';
import { SET_SELECTED_ENTITY } from '../../StateProvider/actionTypes';
import EntitySelectionsDialog from '../../components/EntitySelections';
import { AiOutlineDeploymentUnit } from 'react-icons/ai';
import { sidebarResource } from '../../constants/helpers';
import Tooltip from '@material-ui/core/Tooltip';
import IconButton from '@material-ui/core/IconButton';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import CustomRenderCell from '../../components/Helpers/CustomRenderCell';
import useColumns, { getStaticFields, getFrameworkComponents, checkStaticField } from '../../constants/useColumns';
import NoDataCell from '../../components/Helpers/NoDataCell';
import CustomSwipableList from '../../components/SwipableListComponents/CustomSwipableList';
import { isMobile, isTablet } from 'react-device-detect';
import queryString from 'query-string';
import { MdAdd } from 'react-icons/all';
import AssignEntityDialog from '../../components/AssignRolesDialog/AssignEntityDialog';
import { FaSuitcase, MdFilterList, MdSort, MdWeb } from 'react-icons/all';
import MobileSortDialog from '../../components/MobileSortDialog';
import MobileFilterDialog from '../../components/MobileFilterDialog';
import { camelCase } from 'lodash';
import WarhouseList from '../Account/Warehouse/WarhouseList';

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
  const location = useLocation();
  let queryParams = queryString.parse(location.search);
  let queryPage: string = queryParams.page as string;
  let queryType: string = queryParams.type as string;
  let querySearch: string = queryParams.search as string;
  let queryColFilter: string = queryParams.colFilter as string;

  const toastConfig = useContext(CustomToastContext);
  const history = useHistory();
  const {
    state: { user, selectedEntity, permissions },
    dispatch: entityDispatch
  }: any = useData();
  const {
    contact: { contactApi, contactResource, contactPermission, contactRoute },
    account
  } = props;
  const [selectedType, setSelectedType] = useState(1);
  const [open, setOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [contactId, setContactId] = useState('');
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [renderCount, setRenderCount] = useState(0);
  const [sortOpen, setSortOpen] = useState(false);
  const [isOpenDialog, setisOpenDialog] = useState(false);
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
    isDelete: permissions[contactResource]?.isDelete
  });
  const [showEntityDialog, setShowEntityDialog] = useState(false);
  const [openAddPlantsDialog, setOpenAddPlantsDialog] = useState(false);
  const [isAddingWarehouse, setAddingWarehouse] = useState(false);

  const [filter, setFilter] = useState(queryType ? queryType : 'All Contacts');
  const [entities, setEntities] = useState([]);
  const [columns, setColumns] = useState([]);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const { getColumnData } = useColumns();
  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } = state;
  const columnState = JSON.parse(localStorage.getItem(contactResource));
  const [showAssignEntityDialog, setShowAssignEntityDialog] = useState(false);
  const [entityAccess, setEntityAccess] = useState([]);
  const [roleAccessOfLoggedInUser, setRoleAccessOfLoggedInUser] = useState([]);
  let renderedFrom = camelCase(contactResource)
  const localStorageSelectedRecords = `${contactResource}_selected`;


  useEffect(() => {
    if (queryPage === undefined) {
      sessionStorage.removeItem('page');
      history.push(`?page=${page}`);
    }
    if (page > 0) {
      sessionStorage.setItem('page', JSON.stringify(page));
      history.replace(
        queryType && querySearch && queryColFilter
          ? `?page=${page}&type=${queryType}&colFilter=${queryColFilter}&search=${querySearch}`
          : queryType && queryColFilter
            ? `?page=${page}&type=${queryType}&colFilter=${queryColFilter}`
            : queryType && querySearch
              ? `?page=${page}&type=${queryType}&search=${querySearch}`
              : queryColFilter && querySearch
                ? `?page=${page}&colFilter=${queryColFilter}&search=${querySearch}`
                : queryType
                  ? `?page=${page}&type=${queryType}`
                  : queryColFilter
                    ? `?page=${page}&colFilter=${queryColFilter}`
                    : querySearch
                      ? `?page=${page}&search=${querySearch}`
                      : `?page=${page}`
      );
    } else {
      history.replace(
        queryType && querySearch && queryColFilter
          ? `?page=${page}&type=${queryType}&colFilter=${queryColFilter}&search=${querySearch}`
          : queryType && queryColFilter
            ? `?page=${page}&type=${queryType}&colFilter=${queryColFilter}`
            : queryType && querySearch
              ? `?page=${page}&type=${queryType}&search=${querySearch}`
              : queryColFilter && querySearch
                ? `?page=${page}&colFilter=${queryColFilter}&search=${querySearch}`
                : queryType
                  ? `?page=${page}&type=${queryType}`
                  : queryColFilter
                    ? `?page=${page}&colFilter=${queryColFilter}`
                    : querySearch
                      ? `?page=${page}&search=${querySearch}`
                      : `?page=${page}`
      );
    }
  }, [page, queryPage]);

  useEffect(() => {
    if (JSON.parse(sessionStorage.getItem('page')) !== null && queryPage !== '0') {
      let savedPage = JSON.parse(sessionStorage.getItem('page'));
      // history.replace(`?page=${savedPage}`);
      dispatch({ type: 'pageChange', page: savedPage });
    }
    fetchGridColumns();
    fetchLoggedInUserEntities();
    fetchLoggedInUserRole();
  }, []);

  const fetchGridColumns = async () => {
    const response = await axiosInstance().get(`/field?resource=${sidebarResource[contactResource]}`);

    let data = response?.data?.data;

    let columns = [];
    let rendererNames = [];
    data.forEach((o) => {
      let currentColumn = getColumnData(contactResource, o?.fieldData, `/${contactRoute}/detail`);
      if (currentColumn !== null) {
        columns = [...columns, currentColumn?.columnData];
        if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
          rendererNames.push(currentColumn?.rendererName);
        }
        return o?.fieldData;
      }
      return o?.fieldData;
    });
    let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
    tempFrameworkComponent = {
      ...tempFrameworkComponent,
      relatedLeadRenderer: RelatedLeadRenderer,
      actionsRenderer: ActionsRenderer
    };
    if (contactResource.includes('customer')) {
      columns = [...columns, { field: 'relatedLead', headerName: 'Related Lead', show: true, cellRenderer: 'relatedLeadRenderer' }];
    }
    setFrameWorkComponent({ ...tempFrameworkComponent });
    let staticFields = getStaticFields();
    staticFields.forEach((field) => {
      columns.push(checkStaticField(routes.projectSales.title, field));
    });
    setColumns([...columns]);

    if (JSON.parse(sessionStorage.getItem('filters')) !== null) {
      let savedFilter = JSON.parse(sessionStorage.getItem('filters'));
      dispatch({ type: 'filter', filters: savedFilter });
    }
  };
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
      history.replace(
        querySearch && queryColFilter
          ? `?page=${page}&type=${newFilter}&colFilter=${queryColFilter}&search=${search}`
          : queryColFilter
            ? `?page=${page}&type=${newFilter}&colFilter=${queryColFilter}`
            : querySearch
              ? `?page=${page}&type=${newFilter}&search=${search}`
              : `?page=${page}&type=${newFilter}`
      );
      sessionStorage.setItem('filterSuccess', JSON.stringify('filterSuccess'));
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
  }, [page, limit, selectedType, filters, sorting, accountDetails, selectedEntity, location, showFilteredRecordsOnly]);

  useEffect(() => {
    if (search) {
      history.replace(
        queryType && queryColFilter
          ? `?page=${page}&type=${queryType}&colFilter=${queryColFilter}&search=${search}`
          : queryType
            ? `?page=${page}&type=${queryType}&search=${search}`
            : queryColFilter
              ? `?page=${page}&colFilter=${queryColFilter}&search=${search}`
              : `?page=${page}&search=${search}`
      );
    } else {
      history.replace(
        queryType && queryColFilter
          ? `?page=${page}&type=${queryType}&colFilter=${queryColFilter}`
          : queryType
            ? `?page=${page}&type=${queryType}`
            : queryColFilter
              ? `?page=${page}&colFilter=${queryColFilter}`
              : `?page=${page}`
      );
    }
  }, [search]);

  useEffect(() => {
    if (querySearch) {
      dispatch({ type: 'search', search: querySearch });
    }
  }, [querySearch]);

  useEffect(() => {
    if (Object.keys(filters).length > 0) {
      sessionStorage.setItem('filters', JSON.stringify(filters));

      let serialize = function (obj) {
        var str = [];
        for (var p in obj)
          if (obj.hasOwnProperty(p)) {
            str.push('{colName=' + encodeURI(p) + ',' + 'colValue=' + encodeURI(obj[p].filter) + '}');
          }
        return str.join(',');
      };

      history.replace(
        queryType && querySearch
          ? `?page=${page}&type=${queryType}&colFilter=[${serialize(filters)}]&search=${querySearch}`
          : queryType
            ? `?page=${page}&type=${queryType}&colFilter=[${serialize(filters)}]`
            : querySearch
              ? `?page=${page}&colFilter=[${serialize(filters)}]&search=${querySearch}`
              : `?page=${page}&colFilter=[${serialize(filters)}]`
      );
    }

    if (Object.keys(filters).length === 0 && queryColFilter !== undefined) {
      history.replace(
        queryType && querySearch
          ? `?page=${page}&type=${queryType}&search=${querySearch}`
          : queryType
            ? `?page=${page}&type=${queryType}`
            : querySearch
              ? `?page=${page}&search=${querySearch}`
              : `?page=${page}`
      );
    }
    if (Object.keys(filters).length === 0 && queryColFilter === undefined) {
      sessionStorage.removeItem('filters');
    }
  }, [filters]);


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

  const RelatedLeadRenderer = (params) =>
    params.value ? (
      params?.data?.relatedLeadEntity === selectedEntity ? (
        <Link className="link" to={`${routes.leadDetail.path}/${params.data.relatedLeadId}`} title={params.value}>
          {params.value}
        </Link>
      ) : hasAccessToEntity(params?.data?.relatedLeadEntity) ? (
        <span
          className="link"
          onClick={() => {
            handleEntityChange(params.data?.relatedLeadEntity);
            history.push(`${routes.leadDetail.path}/${params.data.relatedLeadId}`);
          }}
          title={params.value}
        >
          {params.value}
        </span>
      ) : (
        <span title={params.value}>
          <CustomRenderCell value={params.value} />
        </span>
      )
    ) : (
      <NoDataCell />
    );

  const ActionsRenderer = (params) => (
    <>
      {contactPermissions.isCreate ? (<Tooltip
        title='Clone'
      >
        <IconButton
          size="small"
          aria-label="Clone"
          onClick={() => {
            setShowCreateContactDialog({ open: true, isClone: true, idToClone: params.data._id });
          }}
        >
          <FileCopyIcon fontSize="small" color="primary" />
        </IconButton>
      </Tooltip>) :
        (
          <Tooltip
            className='cursor-stop'
            title='You do not have permission to clone/create'
          >
            <IconButton
              size="small"
              aria-label="Clone"
            >
              <FileCopyIcon fontSize="small" color="disabled" />
            </IconButton>
          </Tooltip>
        )
      }
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

      {contactPermissions.isUpdate && params.data?.isAllowedToUpdate ? (
        <Tooltip title="Entity">
          <IconButton
            size="small"
            aria-label="Entity"
            onClick={() => {
              setContactId(params.data._id);
              setShowEntityDialog(true);
              if (params?.data?.entityId) {
                let entities = [];
                if (params?.data?.entityId) {
                  entities.push(params?.data?.entityId);
                }
                if (params?.data?.restentity) {
                  let restEntities = params?.data?.restentity.map((o) => o?.optionValue);
                  entities = [...entities, ...restEntities];
                }
                setEntities([...entities]);
              } else if (params?.data?.restentity) {
                let restEntities = params?.data?.restentity.map((o) => o?.optionValue);
                setEntities([...restEntities]);
              }
            }}
          >
            <AiOutlineDeploymentUnit fontSize="15" color="primary" />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip className="cursor-stop" title="You do not have permission to update entity">
          <IconButton aria-label="Clone" size="small">
            <AiOutlineDeploymentUnit fontSize="15" />
          </IconButton>
        </Tooltip>
      )}
    </>
  );

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

  const getQueryString = (isExport = false) => {
    let deepFilter = `?page=${page}&limit=${limit}&filterContacts=${queryType === 'My Accounts' ? 2 : selectedType}`;
    if (isExport) {
      deepFilter = `filterContacts=${queryType === 'My Accounts' ? 2 : selectedType}`;
    }
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
      deepFilter = `${deepFilter}&deepFilter=${encodeURI(JSON.stringify(updatedFilters))}&filterType=and`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${replaceFieldNameForSorting(sorting[0].colId)}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURI(search)}`;
    }
    if (showFilteredRecordsOnly) {
      const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
      deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map(m => m._id))}`;
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
          let finalObject = prepareDataForGrid(u, user);
          finalObject['canDelete'] = u.owner?.optionValue === user?.user._id;
          finalObject['isChecked'] = getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = [...(u.collaborator ?? []), u.owner].some((d) => d?.optionValue === user?.user?._id);
          finalObject['owerCollaboratorInitialsOrImages'] = [];
          if (finalObject['owner']) finalObject['owerCollaboratorInitialsOrImages'].push({ initials: finalObject['owner'] });
          finalObject['owerCollaboratorInitialsOrImages'].forEach((f) => {
            if (f.initials) {
              f.initials = f.initials
                .split(' ')
                .map((i) => i[0])
                .join('');
            }
          });

          return {
            ...finalObject,

            canDelete: u.owner?.optionValue === user?.user._id,
            relatedLead: u.staticData && u.staticData.lead && u.staticData.lead.concatedName,
            relatedLeadId: u.staticData && u.staticData.lead && u.staticData.lead._id,
            relatedLeadEntity: u.staticData && u.staticData.lead && u.staticData.lead?.entity
          };
        });
        if (appendRows) {
          dispatch({
            type: 'initialize',
            data: [...dataRows, ...rows],
            count: count,
            selectedRecords: [...dataRows, ...rows].filter((f) => f.isChecked === true)
          });
        } else {
          dispatch({
            type: 'initialize',
            data: rows,
            count: count,
            selectedRecords: rows.filter((f) => f.isChecked === true)
          });
        }

        if (gridApi) {
          try {
            let oldSelectedRecords = localStorage.getItem(localStorageSelectedRecords)
              ? JSON.parse(localStorage.getItem(localStorageSelectedRecords))
              : [];
            if (oldSelectedRecords.length > 0) {
              gridApi.forEachNode(function (node) {
                node.setSelected(oldSelectedRecords.some((o) => o === node.data._id));
              });
            }
          } catch (ex) {
            console.error('Error in getting selected records from local storage');
          }
        }

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
        removeLocalStorage(`${localStorageSelectedRecords}`)
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
    const selectedContacts = getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.map((m) => {
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
          removeLocalStorage(`${localStorageSelectedRecords}`)
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

  const toggleInner = ContactTypes && (
    <ToggleButtonGroup id="resourceTypeSelector" size="small" className=" toggle-button-layout" value={filter} exclusive onChange={handleFilter}>
      {ContactTypes.map((k: any, index) => {
        return (
          <ToggleButton value={k.key} key={index}>
            {k.key}
          </ToggleButton>
        );
      })}
    </ToggleButtonGroup>
  );

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  const handleContactSelect = (filterValues) => {
    setSelectedType(filterValues);
  };
  const handleOpen = () => {
    setisOpenDialog(true);
  };

  const handleClickOpen = () => {
    setSortOpen(true);
  };

  const handleClickClose = () => {
    setSortOpen(false);
  };

  const handleFilterClose = () => {
    setisOpenDialog(false);
  };

  return (
    <Fragment>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[{ title: routes[contactResource].title }]} />
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
            recordsToExport={getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length}
            ids={getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length ? getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.map((obj) => obj._id) : []}
            onExportToExcelSuccess={() => {
              if (gridApi) gridApi.deselectAll();
              else getContacts();
            }}
            additionalParams={getQueryString(true)}
          />
        </Grid>
      </Grid>

      <CustomContainer>
        <div className={`${contactClass['contact_header_inner_container']}`}>
          <Grid container className="header-panel" justify="space-between" alignContent="center">
            <Grid item md={6} sm={12} xs={12} className="d-flex align-items-center gap-1">
              <Grid container className="gap-1">
                <Grid className="d-flex align-items-center gap-1 align-tablet">
                  <Grid>
                    <MdContacts className="headerLogo" />
                    <span id="resourceHeader" className="listingHeader">
                      {routes[contactResource].title}
                    </span>
                  </Grid>

                  {isMobile && (
                    <>
                      <Grid style={{ display: 'inline-flex' }}>
                        <Button
                          id="demo-customized-button"
                          aria-controls="demo-customized-menu"
                          aria-haspopup="true"
                          aria-expanded={open ? 'true' : undefined}
                          color="secondary"
                          variant="text"
                          disableElevation
                          onClick={handleClickOpen}
                          startIcon={<MdSort />}
                          style={{ marginLeft: '40px' }}
                          className={'sort-filter-tablet'}
                        >
                          Sort
                        </Button>

                        <MobileSortDialog
                          isOpen={sortOpen}
                          handleClose={handleClickClose}
                          contentPart={toggleInner}
                          secHeading={['Sort Accounts']}
                          columns={columns}
                          dispatch={dispatch}
                        />
                        <Button
                          id="demo-customized-button"
                          aria-controls="demo-customized-menu"
                          aria-haspopup="true"
                          aria-expanded={open ? 'true' : undefined}
                          variant="text"
                          color="secondary"
                          disableElevation
                          startIcon={<MdFilterList />}
                          className={'sort-filter-tablet'}
                          onClick={handleOpen}
                        >
                          Filter
                        </Button>
                        <MobileFilterDialog
                          isOpen={isOpenDialog}
                          handleClose={handleFilterClose}
                          contentPart={toggleInner}
                          columns={columns}
                          dispatch={dispatch}
                          title={routes?.[contactResource]?.title}
                          filters={filters}
                        />
                      </Grid>
                    </>
                  )}

                  <Grid className="align-toggle-button">
                    {ContactTypes && (
                      <ToggleButtonGroup
                        id="resourceTypeSelector"
                        size="small"
                        className="ml-8 layout-for-mobile"
                        value={filter}
                        exclusive
                        onChange={handleFilter}
                      >
                        {ContactTypes.map((k, index) => {
                          return (
                            <ToggleButton value={k.key} key={index}>
                              {k.key}
                            </ToggleButton>
                          );
                        })}
                      </ToggleButtonGroup>
                    )}

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
              </Grid>
            </Grid>
            <Grid item md={6} sm={12} xs={12} className={styles.filter_side}>
              <Box id="resourceOperations" className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} component="div">
                <Grid style={{ display: 'flex', flex: 1 }}>
                  <SearchBox
                    onSearch={handleSearch}
                    searchbox={styles.search_box_input}
                    value={search}
                    size="small"
                    width={isMobile ? '200px' : '242px'}
                    style={isMobile ? { flex: 1 } : {}}
                  />
                </Grid>

                <Grid style={{ display: 'flex', gap: '5px' }}>
                  {contactPermissions.isCreate && (
                    <>
                      <Button
                        variant={isMobile && !isTablet ? 'text' : 'contained'}
                        color="primary"
                        size="small"
                        onClick={clickCreateNew}
                        className={isMobile && !isTablet ? 'mobile_button' : styles.add_submit_btn}
                        startIcon={isMobile && !isTablet ? '' : <AddOutlined />}
                      >
                        {isMobile && !isTablet ? <MdAdd size={23} /> : 'Add'}
                      </Button>
                    </>
                  )}

                  <>
                    <Button
                      disabled={getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length === 0}
                      variant={isMobile && !isTablet ? 'text' : 'outlined'}
                      color="default"
                      size="small"
                      onClick={openActions}
                      className={isMobile && !isTablet ? 'mobile_button' : styles.action_submit_btn}
                      aria-controls="action-menu"
                    >
                      {isMobile && !isTablet ? '' : 'Actions'} <ExpandMore />
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
                          disabled={getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length === 0}
                          onClick={() => {
                            if (getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.some((d) => d.canDelete === false)) {
                              closeActions();
                              setShowDeleteWarningConfirmBox({ show: true, isDelete: true });
                            } else {
                              closeActions();
                              setShowDeleteConfirmBox(true);
                            }
                          }}
                        >
                          Delete
                        </MenuItem>
                      )}
                      {user.user?.userType === userType.brandAdmin && (
                        <MenuItem
                          disabled={getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length === 0 || getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.some((record) => record?.isUserExist)}
                          onClick={handleAccessToPortal}
                        >
                          Give Access to Portal
                        </MenuItem>
                      )}
                      {(contactPermissions.isUpdate && contactResource === 'customerContact' && permissions?.productInventory) && (
                        <MenuItem
                          disabled={getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length === 0 || [...new Set(getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.map((d) => d.accountNameId))].length > 1}
                          onClick={() => {
                            setOpenAddPlantsDialog(true)
                            closeActions();
                          }}
                        >
                          Assign {routes.warehouse.title} &nbsp; <Chip size="small" label={getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length} />
                        </MenuItem>
                      )}
                      {contactPermissions.isUpdate && (
                        <MenuItem
                          disabled={getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length === 0}
                          onClick={() => {
                            if (getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.some((d) => d.isUpdate === false)) {
                              closeActions();
                              setShowDeleteWarningConfirmBox({ show: true, isDelete: false });
                            } else {
                              closeActions();
                              if (getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length) {
                                let entities = [];
                                getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.map((current) => {
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
                            }
                          }}
                        >
                          Assign Entity &nbsp; <Chip size="small" label={getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length} />
                        </MenuItem>
                      )}
                    </Menu>
                  </>
                </Grid>
              </Box>
            </Grid>
          </Grid>
        </div>

        {Object.keys(frameWorkComponent).length > 0 &&
          (isMobile && !isTablet ? (
            <CustomSwipableList
              allowSelection={true}
              allowSwipe={true}
              permissions={contactPermissions}
              primaryField={columns?.find((d) => d.field === 'concatedName')}
              onClick={(d) => {
                history.push(`${contactApi}/detail/${d._id}`);
              }}
              dataRows={dataRows}
              selectedRecords={getLocalStorageArrayData(`${localStorageSelectedRecords}`)}
              dispatch={dispatch}
              onEdit={(d) => {
                history.push(`${contactApi}/detail/${d._id}?openEdit=true`);
              }}
              extraParamsToCheckDelete={true}
              onDelete={(d) => {
                setSingleContactDelete({
                  show: true,
                  id: d._id,
                  contactedName: d.contactedName
                });
              }}
              rowCount={rowCount}
              page={page}
              loading={loading}
              additionalDetails={[
                {
                  icon: <FaSuitcase size={18} />,
                  field: 'accountName'
                }
              ]}
              chips={[
                {
                  label: 'Email : ',
                  field: 'email'
                },
                {
                  label: 'Entity',
                  field: 'entity'
                }
              ]}
              owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
              onCreate={false}
              showClone={true}
              onClone={(data) => {
                setShowCreateContactDialog({ open: true, isClone: true, idToClone: data._id });
              }}
              renderedFrom={renderedFrom}
            />
          ) : (
            <CustomAgGrid
              columns={columns}
              dataRows={dataRows}
              frameworkComponents={frameWorkComponent}
              setGridApi={setGridApi}
              dispatch={dispatch}
              rowCount={rowCount}
              limit={limit}
              pageSizes={pageSizes}
              actionWidth={170}
              page={page}
              loading={loading}
              renderedFrom={renderedFrom}
              refreshGrid={getContacts}
              showOnlyShowFilteredRecordSwitch={true}
            />
          ))}

        <Box component="div">
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
          {showAssignEntityDialog && (
            <Dialog
              fullWidth
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
                ids={getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.map((record) => record._id || record.id)}
                isRenderedFromContact={true}
                regionalRole={false}
                type="entity"
                entityAccessIds={entityAccess}
                roleAccessIds={roleAccessOfLoggedInUser}
                contactResource={contactResource}
              />
            </Dialog>
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
          {openAddPlantsDialog &&
            <WarhouseList
              isCustomer={true}
              api={`/customer-account/${selectedRecords[0]?.accountNameId}/warehouse`}
              isAddingWarehouse={isAddingWarehouse}
              addWarehouse={(selectedPlants: any) => {
                setAddingWarehouse(true)
                axiosInstance().post(`/customer-contact/assign-warehouse`, {
                  ids: selectedRecords.map((d: any) => d._id),
                  warehouse: selectedPlants.map((d: any) => d._id),
                }).then(() => {
                  getContacts();
                  setAddingWarehouse(false)
                  setOpenAddPlantsDialog(false)
                }).catch(err => {
                  toastConfig.setToastConfig(err)
                  setAddingWarehouse(false)
                  setOpenAddPlantsDialog(false)
                })
              }}
              onClose={() => setOpenAddPlantsDialog(false)}
              assignedWarehouse={[]}
            />
          }
          {showEntityDialog ? (
            <EntitySelectionsDialog
              open={showEntityDialog}
              resource={sidebarResource[contactResource]}
              resourceIds={getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length ? getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.map((o) => o._id) : [contactId]}
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
    </Fragment>
  );
}
