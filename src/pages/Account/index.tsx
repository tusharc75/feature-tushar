import React, { useContext, useEffect, useState, useReducer } from 'react';
import { useData } from '../../StateProvider/Provider';
import { Button, Menu, MenuItem, Tooltip, IconButton, Grid, Chip, MenuList } from '@material-ui/core';
import { Link, useHistory, useParams } from 'react-router-dom';
import { ExpandMore, AddOutlined } from '@material-ui/icons';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import MessageDialog from '../../components/Helpers/MessageDialog';
import SearchBox from '../../components/Helpers/SearchBox';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import ManageAccountDialog from './ManageAccount/index';
import CustomBreadCrumbs from './../../components/CustomBreadCrumbs';
import axiosInstance from '../../axios/axiosInstance';
import CustomContainer from '../../components/CustomContainer';
import CancelIcon from '@material-ui/icons/Cancel';
import accountClass from './account.module.scss';
import CustomRenderCell from '../../components/Helpers/CustomRenderCell';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { FcApproval } from 'react-icons/fc';
import ButtonGroup from '@material-ui/core/ButtonGroup';
import ArrowDropDownIcon from '@material-ui/icons/ArrowDropDown';
import ClickAwayListener from '@material-ui/core/ClickAwayListener';
import Grow from '@material-ui/core/Grow';
import Paper from '@material-ui/core/Paper';
import Popper from '@material-ui/core/Popper';
import { MdAccountCircle } from 'react-icons/md';
import { gridLoadingTimeout, entity, sidebarResource, prepareDataForGrid, getLocalStorageArrayData, removeLocalStorage } from '../../constants/helpers';
import NoDataCell from '../../components/Helpers/NoDataCell';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import routes from './../../components/Helpers/Routes';
import { isObjectEmpty } from '../../constants/helpers';
import GridDeleteIcon from '../../components/Helpers/GridDeleteIcon';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import ToggleButton from '@material-ui/lab/ToggleButton';
import ToggleButtonGroup from '@material-ui/lab/ToggleButtonGroup';
import styles from '../Leads/Header.module.scss';
import { SET_SELECTED_ENTITY } from '../../StateProvider/actionTypes';
import EntitySelectionsDialog from '../../components/EntitySelections';
import { AiOutlineDeploymentUnit } from 'react-icons/ai';
import { HiBadgeCheck } from 'react-icons/hi';
import useColumns, { getStaticFields, getFrameworkComponents, checkStaticField } from '../../constants/useColumns';
import { useLocation } from 'react-router-dom';
import queryString from 'query-string';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomOfflineContext } from '../../StateProvider/OfflineContext/OfflineContext';
import { GridApi } from 'ag-grid-community';
import CustomSwipableList from '../../components/SwipableListComponents/CustomSwipableList';
import { MdAdd } from 'react-icons/all';
import MobileFilterDialog from '../../components/MobileFilterDialog';
import MobileSortDialog from '../../components/MobileSortDialog';
import { IoFilterCircle, MdFilterList, MdSort, MdWeb } from 'react-icons/all';
import { FaSuitcase, FaAddressBook, FaAddressCard } from 'react-icons/fa';
import { camelCase } from 'lodash';
import WarhouseList from './Warehouse/WarhouseList';

const AccTypes = [
  {
    key: 'All Accounts',
    value: 1
  },
  {
    key: 'My Accounts',
    value: 2
  }
];

const options = ['All', 'Approved', 'Disapproved'];

let accountTimeout;
export default function Account(props) {
  const location = useLocation();

  let queryParams = queryString.parse(location.search);
  let queryType: string = queryParams.type as string;
  let queryApproval: string = queryParams.approval as string;
  let querySearch: string = queryParams.search as string;
  let queryPage: string = queryParams.page as string;
  let queryColFilter: string = queryParams.colFilter as string;

  const toastConfig = useContext(CustomToastContext);
  const { getColumnData } = useColumns();

  const {
    account: { accountApi, accountResource, accountRoute }
  } = props;

  const { isOffline, offlineGridData, updateOfflineGridData, offlineFieldsData, updateFieldsData } = useContext(CustomOfflineContext);
  const {
    state: { user, permissions, selectedEntity },
    dispatch: entityDispatch
  }: any = useData();
  const history = useHistory();
  const [cloneId, setCloneId] = useState('');
  const [anchorEl, setAnchorEl] = useState(null);
  const [type, setType] = useState(options[queryApproval === 'Approved' ? 1 : queryApproval === 'Disapproved' ? 2 : 0]);
  const [renderCount, setRenderCount] = useState(0);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [showDeleteWarningConfirmBox, setShowDeleteWarningConfirmBox] = useState({ show: false, isDelete: false });
  const [isAccDialogVisible, setIsAccDialogVisible] = useState(false);
  const [selectedType, setselectedType] = useState(1);
  const [accountId, setAccountId] = useState(null);
  const [sortOpen, setSortOpen] = React.useState(false);
  const [openAddPlantsDialog, setOpenAddPlantsDialog] = React.useState(false);
  const [showEntityDialog, setShowEntityDialog] = useState(false);
  const [isAddingWarehouse, setAddingWarehouse] = useState(false);
  let renderedFrom = camelCase(accountResource);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const [singleAccountDelete, setSingleAccountDelete] = useState({
    id: null,
    show: false,
    accountName: ''
  });
  const [singleApproveDisapproveAccount, setSingleApproveDisapproveAccount] = useState<any>({
    show: false,
    approved: false,
    id: null,
    accountName: ''
  });
  const [multipleApproveDisapproveAccount, setMultipleApproveDisapproveAccount] = useState<any>({ show: false, approved: false, selectedRecords: 0 });

  const [accountPermissions, setAccountPermissions] = useState({
    isCreate: permissions[accountResource]?.isCreate,
    isRead: permissions[accountResource]?.isRead,
    isUpdate: permissions[accountResource]?.isUpdate,
    isDelete: permissions[accountResource]?.isDelete,
    approveAccount: false
  });
  const [open, setOpen] = React.useState(false);
  const [entities, setEntities] = useState([]);
  const anchorRef = React.useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = React.useState(queryApproval === 'Approved' ? 1 : queryApproval === 'Disapproved' ? 2 : 0);
  const [filter, setFilter] = useState(queryType ? queryType : 'All Accounts');
  const [accountNameForClone, setAccountNameForClone] = useState('');

  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const [columns, setColumns] = useState([]);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
    state;

  const columnState = JSON.parse(localStorage.getItem(accountResource));

  if (columnState) {
    columns.forEach((item) => {
      columnState.forEach((d) => {
        if (d.colId == item.field) {
          item.show = !d.hide;
        }
      });
    });
  }

  useEffect(() => {
    if (queryPage === undefined) {
      sessionStorage.removeItem('page');
      history.replace(`?page=${page}`);
    }
    if (page > 0) {
      sessionStorage.setItem('page', JSON.stringify(page));
      history.replace(
        queryType && queryApproval && queryColFilter && querySearch
          ? `?page=${page}&type=${queryType}&approval=${queryApproval}&colFilter=${queryColFilter}&search=${search}`
          : queryType && queryApproval && queryColFilter
            ? `?page=${page}&type=${queryType}&approval=${queryApproval}&colFilter=${queryColFilter}`
            : queryType && queryApproval && querySearch
              ? `?page=${page}&type=${queryType}&approval=${queryApproval}&search=${querySearch}`
              : queryType && querySearch && queryColFilter
                ? `?page=${page}&type=${queryType}&colFilter=${queryColFilter}&search=${querySearch}`
                : queryApproval && querySearch && queryColFilter
                  ? `?page=${page}&approval=${queryApproval}&colFilter=${queryColFilter}&seach=${search}`
                  : queryType && queryApproval
                    ? `?page=${page}&type=${queryType}&approval=${queryApproval}`
                    : queryType && queryColFilter
                      ? `?page=${page}&type=${queryType}&colFilter=${queryColFilter}`
                      : queryType && querySearch
                        ? `?page=${page}&type=${queryType}&search=${querySearch}`
                        : queryApproval && queryColFilter
                          ? `?page=${page}&approval=${queryApproval}&colFilter=${queryColFilter}`
                          : queryApproval && querySearch
                            ? `?page=${page}&approval=${queryApproval}&search=${querySearch}`
                            : queryColFilter && querySearch
                              ? `?page=${page}&colFilter=${queryColFilter}&search=${querySearch}`
                              : queryType
                                ? `?page=${page}&type=${queryType}`
                                : queryApproval
                                  ? `?page=${page}&approval=${queryApproval}`
                                  : queryColFilter
                                    ? `?page=${page}&colFilter=${queryColFilter}`
                                    : querySearch
                                      ? `?page=${page}&search=${querySearch}`
                                      : `?page=${page}`
      );
    } else {
      history.replace(
        queryType && queryApproval && queryColFilter && querySearch
          ? `?page=${page}&type=${queryType}&approval=${queryApproval}&colFilter=${queryColFilter}&search=${search}`
          : queryType && queryApproval && queryColFilter
            ? `?page=${page}&type=${queryType}&approval=${queryApproval}&colFilter=${queryColFilter}`
            : queryType && queryApproval && querySearch
              ? `?page=${page}&type=${queryType}&approval=${queryApproval}&search=${querySearch}`
              : queryType && querySearch && queryColFilter
                ? `?page=${page}&type=${queryType}&colFilter=${queryColFilter}&search=${querySearch}`
                : queryApproval && querySearch && queryColFilter
                  ? `?page=${page}&approval=${queryApproval}&colFilter=${queryColFilter}&seach=${search}`
                  : queryType && queryApproval
                    ? `?page=${page}&type=${queryType}&approval=${queryApproval}`
                    : queryType && queryColFilter
                      ? `?page=${page}&type=${queryType}&colFilter=${queryColFilter}`
                      : queryType && querySearch
                        ? `?page=${page}&type=${queryType}&search=${querySearch}`
                        : queryApproval && queryColFilter
                          ? `?page=${page}&approval=${queryApproval}&colFilter=${queryColFilter}`
                          : queryApproval && querySearch
                            ? `?page=${page}&approval=${queryApproval}&search=${querySearch}`
                            : queryColFilter && querySearch
                              ? `?page=${page}&colFilter=${queryColFilter}&search=${querySearch}`
                              : queryType
                                ? `?page=${page}&type=${queryType}`
                                : queryApproval
                                  ? `?page=${page}&approval=${queryApproval}`
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
  }, []);

  const fetchGridColumns = async () => {
    let data;
    if (isOffline) {
      data = offlineFieldsData[accountResource] ?? [];
    } else {
      const response = await axiosInstance().get(`/field?resource=${sidebarResource[accountResource]}`);

      data = response?.data?.data;
      try {
        updateFieldsData(accountResource, data);
      } catch (ex) {
        console.error(`Rental Management: Error while storing data for Offline context. Error: ${ex.message}`);
      }
    }

    let columns = [];
    let rendererNames = [];

    data.forEach((o) => {
      if (['accountName'].indexOf(o?.fieldData?.fieldName) === 0) {
        columns = [
          ...columns,
          {
            pivotIndex: 0,
            field: 'accountName',
            headerName: 'Account Name',
            show: true,
            disabled: true,
            cellRenderer: 'accountNameRenderer'
          }
        ];
      } else {
        let currentColumn = getColumnData(accountResource, o?.fieldData, `/${accountRoute}/detail`);
        if (currentColumn !== null) {
          columns = [...columns, currentColumn?.columnData];
          if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
            rendererNames.push(currentColumn?.rendererName);
          }
        }
      }
      return o?.fieldData;
    });
    let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
    tempFrameworkComponent = {
      ...tempFrameworkComponent,
      accountNameRenderer: AccountNameRenderer,
      masterAccountRenderer: MasterAccountRenderer,
      leadRenderer: LeadRenderer,
      actionsRenderer: ActionsRenderer
    };
    setFrameWorkComponent({ ...tempFrameworkComponent });
    if (accountResource.includes('customer')) {
      columns = [...columns, { field: 'lead', headerName: 'Related Lead', show: true, cellRenderer: 'leadRenderer' }];
    }

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

  useEffect(() => {
    if (permissions) {
      setAccountPermissions(permissions[accountResource]);
    }
  }, [permissions]);

  useEffect(() => {
    let millisec = Object.keys(search).length > 0 ? 600 : 5;

    if (accountTimeout) {
      clearTimeout(accountTimeout);
    }

    accountTimeout = setTimeout(() => {
      fetchAccounts();
    }, millisec);
  }, [search]);

  useEffect(() => {
    if (renderCount > 0) {
      fetchAccounts();
    } else setRenderCount((preCount) => preCount + 1);
  }, [page, limit, selectedType, type, sorting, selectedEntity, location, showFilteredRecordsOnly]);

  useEffect(() => {
    if (search) {
      history.replace(
        queryType && queryApproval && queryColFilter
          ? `?page=${page}&type=${queryType}&approval=${queryApproval}&colFilter=${queryColFilter}&search=${search}`
          : queryType && queryApproval
            ? `?page=${page}&type=${queryType}&approval=${queryApproval}&search=${search}`
            : queryType && queryColFilter
              ? `?page=${page}&type=${queryType}&colFilter=${queryColFilter}&search=${search}`
              : queryApproval && queryColFilter
                ? `?page=${page}&approval=${queryApproval}&colFilter=${queryColFilter}&search=${search}`
                : queryType
                  ? `?page=${page}&type=${queryType}&search=${search}`
                  : queryApproval
                    ? `?page=${page}&approval=${queryApproval}&search=${search}`
                    : queryColFilter
                      ? `?page=${page}&colFilter=${queryColFilter}&search=${search}`
                      : `?page=${page}&search=${search}`
      );
    } else {
      history.replace(
        queryType && queryApproval && queryColFilter
          ? `?page=${page}&type=${queryType}&approval=${queryApproval}&colFilter=${queryColFilter}`
          : queryType && queryApproval
            ? `?page=${page}&type=${queryType}&approval=${queryApproval}`
            : queryType && queryColFilter
              ? `?page=${page}&type=${queryType}&colFilter=${queryColFilter}`
              : queryApproval && queryColFilter
                ? `?page=${page}&approval=${queryApproval}&colFilter=${queryColFilter}`
                : queryType
                  ? `?page=${page}&type=${queryType}`
                  : queryApproval
                    ? `?page=${page}&approval=${queryApproval}`
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
        queryType && queryApproval && querySearch
          ? `?page=${page}&type=${queryType}&approval=${queryApproval}&colFilter=[${serialize(filters)}]&search=${querySearch}`
          : queryType && queryApproval
            ? `?page=${page}&type=${queryType}&approval=${queryApproval}&colFilter=[${serialize(filters)}]`
            : queryType && querySearch
              ? `?page=${page}&type=${queryType}&colFilter=[${serialize(filters)}]&search=${querySearch}`
              : queryApproval && querySearch
                ? `?page=${page}&approval=${queryApproval}&colFilter=[${serialize(filters)}]&search=${querySearch}`
                : queryType
                  ? `?page=${page}&type=${queryType}&colFilter=[${serialize(filters)}]`
                  : queryApproval
                    ? `?page=${page}&approval=${queryApproval}&colFilter=[${serialize}]`
                    : querySearch
                      ? `?page=${page}&colFilter=[${serialize(filters)}]&search=${querySearch}`
                      : `?page=${page}&colFilter=[${serialize(filters)}]`
      );
    }

    if (Object.keys(filters).length === 0 && queryColFilter !== undefined) {
      history.replace(
        queryType && queryApproval && querySearch
          ? `?page=${page}&type=${queryType}&approval=${queryApproval}&search=${querySearch}`
          : queryType && queryApproval
            ? `?page=${page}&type=${queryType}&approval=${queryApproval}`
            : queryType && querySearch
              ? `?page=${page}&type=${queryType}&search=${querySearch}`
              : queryApproval && querySearch
                ? `?page=${page}&approval=${queryApproval}&search=${querySearch}`
                : queryType
                  ? `?page=${page}&type=${queryType}`
                  : queryApproval
                    ? `?page=${page}&approval=${queryApproval}`
                    : querySearch
                      ? `?page=${page}&search=${querySearch}`
                      : `?page=${page}`
      );
    }
    if (Object.keys(filters).length === 0 && queryColFilter === undefined) {
      sessionStorage.removeItem('filters');
    }
  }, [filters]);

  const AccountNameRenderer = (params) => (
    <span className="d-flex gap-2 align-items-center">
      <Link className="link" to={`/${accountRoute}/detail/${params.data._id}`}>
        <CustomRenderCell value={params.value} />
      </Link>
      {params.data.approved && <FcApproval title="Approved" size={20} />}
    </span>
  );

  const handleEntityChange = (entityId) => {
    entityDispatch({ type: SET_SELECTED_ENTITY, payload: entityId });
  };

  const hasAccessToEntity = (id) => {
    const entityList = user.entity?.map((entity) => entity._id);
    return entityList.includes(id);
  };

  const LeadRenderer = (params) =>
    params.value ? (
      params?.data?.leadEntity === selectedEntity ? (
        <Link className="link" to={`${routes.leadDetail.path}/${params.data.leadId}`} title={params.value}>
          {params.value}
        </Link>
      ) : hasAccessToEntity(params?.data?.leadEntity) ? (
        <span
          className="link"
          onClick={() => {
            handleEntityChange(params.data.leadEntity);
            history.replace(`${routes.leadDetail.path}/${params.data.leadId}`);
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

  const EntityRenderer = (params) => (
    <h5 className="createBy d-flex">
      {params.value ? (
        <Link className="link" title={params.value} to={`${routes.entity.path}/detail/${params.data.entityId}`}>
          {params.value}
        </Link>
      ) : (
        <NoDataCell />
      )}
      {params.data?.restentity?.length > 0 && <span className="createdAtTime badge-date">{`+${params.data?.restentity.length} more..`}</span>}
    </h5>
  );

  const ParentAccountRenderer = (params) =>
    params.value ? (
      <Link className="link" to={`/${accountRoute}/detail/${params.data.parentAccountId}`} title={params.value}>
        <CustomRenderCell value={params.value} />
      </Link>
    ) : (
      <NoDataCell />
    );

  const MasterAccountRenderer = (params) =>
    params.value ? (
      <Link className="link" to={`/${accountRoute}/detail/${params.data.masterAccountId}`} title={params.value}>
        <CustomRenderCell value={params.value} />
      </Link>
    ) : (
      <NoDataCell />
    );

  const ActionsRenderer = (params) => (
    <>
      {accountPermissions.isCreate ? (
        <Tooltip title="Clone">
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              cloneAccount(params.data);
            }}
          >
            <FileCopyIcon fontSize="small" color="primary" />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip className="cursor-stop" title="You do not have permission to clone/create an account">
          <IconButton aria-label="Clone" size="small">
            <FileCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {accountPermissions.isUpdate && accountPermissions.approveAccount && params.data.approved ? (
        <Tooltip title="Disapprove">
          <IconButton
            aria-label="Disapprove"
            onClick={() => {
              setSingleApproveDisapproveAccount({
                show: true,
                approved: false,
                id: params.data._id,
                accountName: params.data.accountName
              });
            }}
          >
            <CancelIcon fontSize="inherit" color="error" />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip title={params?.data?.approved ? 'Disapprove' : 'Approve'}>
          <IconButton
            aria-label={params?.data?.approved ? 'Disapprove' : 'Approve'}
            onClick={() => {
              setSingleApproveDisapproveAccount({
                show: true,
                approved: params?.data?.approved ? false : true,
                id: params.data._id,
                accountName: params.data.accountName
              });
            }}
          >
            {params?.data?.approved ? <HiBadgeCheck /> : <FcApproval />}
          </IconButton>
        </Tooltip>
      )}

      <GridDeleteIcon
        hasDeletePermission={accountPermissions.isDelete}
        ownerId={params.data.ownerId}
        userId={user?.user?._id}
        onDelete={() => {
          setSingleAccountDelete({
            show: true,
            id: params.data._id,
            accountName: params.data.accountName
          });
        }}
        entity="account"
      />
      {accountPermissions.isUpdate && params.data?.isAllowedToUpdate ? (
        <Tooltip title="Entity">
          <IconButton
            size="small"
            aria-label="Entity"
            onClick={() => {
              setAccountId(params.data._id);
              setShowEntityDialog(true);
              if (params?.data?.entity) {
                let entities = [];
                if (params?.data?.entityId) {
                  entities.push(params?.data?.entityId);
                }
                if (params?.data?.restentity) {
                  let restEntities = params?.data?.restentity.map((o) => o.optionValue);
                  entities = [...entities, ...restEntities];
                }
                setEntities([...entities]);
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

      case 'parentAccount':
        return 'parentAccount.optionLabel';
      case 'entity':
        return 'entity.optionLabel';

      default:
        return field;
    }
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = !isExport ? `?page=${page}&limit=${limit}&filterAccounts=${queryType === 'My Accounts' ? 2 : selectedType}` : '?';
    
    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
    }

    const updatedFilters = [];
    if (type !== options[0]) {
      updatedFilters.push({ field: 'staticData.approved', term: type === 'Approved' });
    }

    if (JSON.parse(sessionStorage.getItem('filters')) !== null) {
      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: replaceFieldName(field),
          term: filters[field].filter
        });
      });
    }

    deepFilter = `${deepFilter}&deepFilter=${encodeURI(JSON.stringify(updatedFilters))}&filterType=and`;

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${replaceFieldNameForSorting(sorting[0].colId)}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${search}`;
    }

    if (showFilteredRecordsOnly) {
      const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
      deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map((m) => m._id))}`;
    }

    return deepFilter;
  };

  const menuOptionSelection = (selectedOption) => {
    setType(options[selectedOption]);
  };

  const handleMenuItemClick = (event: React.MouseEvent<HTMLLIElement, MouseEvent>, index: number) => {
    setSelectedIndex(index);
    menuOptionSelection(index);
    setOpen(false);
    history.replace(
      queryType && queryColFilter && querySearch
        ? `?page=${page}&type=${queryType}&approval=${encodeURI(options[index])}&colFilter=${queryColFilter}&search=${querySearch}`
        : queryType && queryColFilter
          ? `?page=${page}&type=${queryType}&approval=${encodeURI(options[index])}&colFilter=${queryColFilter}`
          : queryType && querySearch
            ? `?page=${page}&type=${queryType}&approval=${encodeURI(options[index])}&search=${search}`
            : querySearch && queryColFilter
              ? `?page=${page}&approval=${encodeURI(options[index])}&colFilter=${queryColFilter}&search=${search}`
              : queryType
                ? `?page=${page}&type=${queryType}&approval=${encodeURI(options[index])}`
                : queryColFilter
                  ? `?page=${page}&approval=${encodeURI(options[index])}&colFilter=${queryColFilter}`
                  : querySearch
                    ? `?page=${page}&approval=${encodeURI(options[index])}&search=${search}`
                    : `?page=${page}&approval=${encodeURI(options[index])}`
    );
  };

  const handleToggle = () => {
    setOpen((prevOpen) => !prevOpen);
  };

  const handleClose = (event: React.MouseEvent<Document, MouseEvent>) => {
    if (anchorRef.current && anchorRef.current.contains(event.target as HTMLElement)) {
      return;
    }

    setOpen(false);
  };

  const fetchAccounts = async () => {
    dispatch({ type: 'loading', loading: true });

    const queryString = getQueryString();

    if (gridApi) {
      gridApi.setRowData([]);
    }

    let data, count;

    if (!isOffline) {
      const response: any = await axiosInstance().get(`${accountApi}${queryString}`);

      data = response?.data?.data;
      count = response?.data?.count;
    } else {
      data = (offlineGridData && offlineGridData[accountResource]) || [];
      count = (offlineGridData && offlineGridData[accountResource]?.length) || 0;
    }

    try {
      updateOfflineGridData(accountResource, data);
    } catch (ex) {
      console.error(`${accountResource}: Error while storing data for Offline context. Error: ${ex.message}`);
    }

    let rows = data.map((u) => {
      let finalObject = prepareDataForGrid(u, user);
      let res = {
        ...finalObject,
        canDelete: u.owner?.optionValue === user?.user._id,
        allowedToEdit: [...(u.collaborator ?? []), u.owner].some((d) => d?.optionValue == user?.user?._id),
        lead: u.staticData && u.staticData.lead && u.staticData.lead.concatedName,
        leadId: u.staticData && u.staticData.lead && u.staticData.lead._id,
        leadEntity: u.staticData && u.staticData.lead && u.staticData.lead?.entity,
        approved: u.staticData?.approved ? u.staticData?.approved : false,
        isChecked: false,

        masterAccount: u.parentHierarchy.length > 0 ? u.parentHierarchy.find((d) => d.parentAccount === '')?.accountName : '',
        masterAccountId: u.parentHierarchy.length > 0 ? u.parentHierarchy.find((d) => d.parentAccount === '')?._id : ''
      };
      return res;
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

    setTimeout(() => {
      dispatch({ type: 'loading', loading: false });
    }, gridLoadingTimeout);
  };

  const cloneAccount = async (data) => {
    setAccountNameForClone(data?.accountName);
    setCloneId(data?._id);
    setIsAccDialogVisible(true);
  };

  const handleSearch = (e) => {
    dispatch({ type: 'search', search: e.target.value });
  };

  // ****** ACTIONS BUTTON STUFF *********
  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const clickCreateNew = () => {
    setIsAccDialogVisible(true);
  };

  const handleDeleteAccounts = async () => {
    let selectedAccounts = getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.map((cr) => cr._id);
    if (selectedAccounts.length > 0) {
      axiosInstance()
        .put(`/${accountApi}/remove`, {
          ids: [...selectedAccounts]
        })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: data.message
          });
          setShowDeleteConfirmBox(false);
          removeLocalStorage(`${localStorageSelectedRecords}`)
          fetchAccounts();
        })
        .catch((error) => {
          setShowDeleteConfirmBox(false);
          toastConfig.setToastConfig(error);
        });
    }
  };

  const handleSingleDeleteAccounts = async () => {
    axiosInstance()
      .put(`/${accountApi}/remove`, { ids: [singleAccountDelete.id] })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        removeLocalStorage(`${localStorageSelectedRecords}`)
        fetchAccounts();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      })
      .finally(() => {
        setShowDeleteConfirmBox(false);
      });
    setSingleAccountDelete({ id: null, show: false, accountName: '' });
  };

  const handleSingleApproveDisapproveAccount = () => {
    axiosInstance()
      .post(`/${accountApi}/approve`, {
        ids: [singleApproveDisapproveAccount.id],
        approved: singleApproveDisapproveAccount.approved
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setSingleApproveDisapproveAccount({
          show: false,
          approved: false,
          id: null,
          accountName: ''
        });
        fetchAccounts();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setSingleApproveDisapproveAccount({
          show: false,
          approved: false,
          id: null,
          accountName: ''
        });
      });
  };

  const handleDialogClose = (params) => {
    if (params && params.fetch) {
      fetchAccounts();
    }
    setIsAccDialogVisible(false);
    if (cloneId) {
      setCloneId('');
    }
  };

  const handleAccountSelect = (filterValues) => {
    setselectedType(filterValues);
  };

  const approveDisapproveAccounts = () => {
    const selectedAccountIds = getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.filter((d) => d.approved === !multipleApproveDisapproveAccount.approved).map((m) => m._id);
    axiosInstance()
      .post(`/${accountApi}/approve`, {
        ids: selectedAccountIds,
        approved: multipleApproveDisapproveAccount.approved
      })
      .then(({ data }) => {
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        setMultipleApproveDisapproveAccount({
          show: false,
          approved: false,
          selectedRecords: 0
        });
        if (gridApi) gridApi.deselectAll()
        removeLocalStorage(localStorageSelectedRecords)
        fetchAccounts();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setMultipleApproveDisapproveAccount({
          show: false,
          approved: false,
          selectedRecords: 0
        });
      });
  };

  const handleFilter = (event, newFilter) => {
    if (newFilter != null) {
      setFilter(newFilter);
      handleAccountSelect(AccTypes.find((d) => d.key === newFilter).value);
      history.replace(
        queryApproval && queryColFilter && querySearch
          ? `?page=${page}&type=${newFilter}&approval=${queryApproval}&colFilter=${queryColFilter}&search=${search}`
          : queryApproval && queryColFilter
            ? `?page=${page}&type=${newFilter}&approval=${queryApproval}&colFilter=${queryColFilter}`
            : queryApproval && querySearch
              ? `?page=${page}&type=${newFilter}&approval=${queryApproval}&search=${search}`
              : queryColFilter && querySearch
                ? `?page=${page}&type=${newFilter}&colFilter=${queryColFilter}&search=${search}`
                : queryApproval
                  ? `?page=${page}&type=${newFilter}&approval=${queryApproval}`
                  : queryColFilter
                    ? `?page=${page}&type=${newFilter}&colFilter=${queryColFilter}`
                    : querySearch
                      ? `?page=${page}&type=${newFilter}&search=${search}`
                      : `?page=${page}&type=${newFilter}`
      );
      handleFilterClose();
    }
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

  let toggleInner = AccTypes && (
    <ToggleButtonGroup size="small" className=" toggle-button-layout" value={filter} exclusive onChange={handleFilter}>
      {AccTypes.map((k, index) => {
        return (
          <ToggleButton value={k.key} key={index}>
            {k.key}
          </ToggleButton>
        );
      })}
    </ToggleButtonGroup>
  );

  const [isOpenDialog, setisOpenDialog] = useState(false);

  return (
    <>
      <Grid container className="headerbox">
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[{ title: routes[accountResource].title }]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2}>
          <ImportExportLinks
            permissions={accountPermissions}
            module="account(s)"
            api={accountApi}
            afterImportCompleted={() => {
              fetchAccounts();
            }}
            isExportAllOrSomeFeature={true}
            total={rowCount}
            recordsToExport={getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length}
            ids={
              getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length
                ? getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.map((obj) => obj._id)
                : []
            }
            onExportToExcelSuccess={() => {
              if (gridApi) gridApi.deselectAll();
              else fetchAccounts();
            }}
            additionalParams={getQueryString(true)}
          />
        </Grid>
      </Grid>
      <CustomContainer>
        <div className={`${accountClass['account_header_inner_container']}`}>
          <Grid container className="header-panel" justify="space-between" alignContent="center">
            <Grid item md={6} sm={12} xs={12} className="d-flex align-items-center gap-1 ">
              <div className={`${accountClass.account_header} ${accountClass['account_header-mobile']}`}>
                <Grid style={{ display: 'inline-flex', alignItems: 'center' }}>
                  <MdAccountCircle className="headerLogo" />{' '}
                  <span id="resourceHeader" className="listingHeader">
                    {routes[accountResource].title}
                  </span>
                </Grid>

                {isMobile && (
                  <>
                    <Grid style={{ display: 'inline-flex' }}>
                      <Button
                        onClick={handleClickOpen}
                        id="demo-customized-button"
                        aria-controls="demo-customized-menu"
                        aria-haspopup="true"
                        aria-expanded={open ? 'true' : undefined}
                        color="secondary"
                        variant="text"
                        disableElevation
                        startIcon={<MdSort />}
                        className={'sort-filter-tablet'}
                        style={isTablet ? { marginLeft: '50px' } : {}}
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
                        className={'sort-filter-tablet'}
                        startIcon={<MdFilterList />}
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
                        title={routes?.[accountResource]?.title}
                        filters={filters}
                      />
                    </Grid>
                  </>
                )}

                {isOffline ? (
                  <></>
                ) : (
                  <div className={`align-items-center gap-1  layout-for-mobile`}>
                    {AccTypes && (
                      <ToggleButtonGroup
                        id="resourceTypeSelector"
                        size="small"
                        className={`ml-8 ${'accountActions'}`}
                        value={filter}
                        exclusive
                        onChange={handleFilter}
                      >
                        {AccTypes.map((k: any, index) => {
                          return (
                            <ToggleButton value={k.key} key={index}>
                              {k.key}
                            </ToggleButton>
                          );
                        })}
                      </ToggleButtonGroup>
                    )}

                    <ButtonGroup
                      id="approveDisapprove"
                      size="small"
                      className={'accountActions'}
                      variant="outlined"
                      color="primary"
                      ref={anchorRef}
                      aria-label="small outlined button group"
                    >
                      <Button>{queryApproval ? queryApproval : options[selectedIndex]}</Button>
                      <Button
                        color="primary"
                        size="small"
                        aria-controls={open ? 'split-button-menu' : undefined}
                        aria-expanded={open ? 'true' : undefined}
                        aria-label="select merge strategy"
                        aria-haspopup="menu"
                        onClick={handleToggle}
                        className="all-button"
                      >
                        <ArrowDropDownIcon className="all-button-sub-icon" />
                      </Button>
                    </ButtonGroup>
                    <Popper open={open} anchorEl={anchorRef.current} role={undefined} transition disablePortal style={{ zIndex: 1111111 }}>
                      {({ TransitionProps, placement }) => (
                        <Grow
                          {...TransitionProps}
                          style={{
                            transformOrigin: placement === 'bottom' ? 'center top' : 'center bottom'
                          }}
                        >
                          <Paper>
                            <ClickAwayListener onClickAway={handleClose}>
                              <MenuList id="menu" style={{ backgroundColor: 'transparent', fontSize: '10px' }}>
                                {options.map((option, index) => (
                                  <MenuItem
                                    key={option}
                                    selected={index === selectedIndex}
                                    onClick={(event) => handleMenuItemClick(event, index)}
                                    style={{ color: 'black' }}
                                  >
                                    {option}
                                  </MenuItem>
                                ))}
                              </MenuList>
                            </ClickAwayListener>
                          </Paper>
                        </Grow>
                      )}
                    </Popper>
                  </div>
                )}
              </div>
            </Grid>
            <Grid
              item
              md={6}
              sm={12}
              xs={12}
              className={`d-flex align-items-center gap-1 ${styles.filter_side}`}
              justify={isMobile ? 'flex-start' : 'flex-end'}
            >
              <div
                id="resourceOperations"
                className={`${isMobile ? accountClass.mobile_filter_side_header : accountClass.account_header} ${accountClass['account_header-mobile']
                  }`}
                style={isMobile && !isTablet ? { flex: 1 } : {}}
              >
                <Grid style={{ display: 'flex', flex: 1 }}>
                  {!isOffline && (
                    <SearchBox
                      onSearch={handleSearch}
                      searchbox={isMobile ? accountClass.search_box_input : ''}
                      style={isMobile ? { flex: 1 } : {}}
                      value={search}
                      width={isMobile ? '200px' : 'auto'}
                    />
                  )}
                </Grid>

                <Grid style={{ display: 'flex', gap: '5px' }}>
                  {accountPermissions.isCreate && (
                    <Button
                      variant={isMobile && !isTablet ? 'text' : 'contained'}
                      color="primary"
                      size="small"
                      className={isMobile && !isTablet ? 'mobile_button' : styles.add_submit_btn}
                      onClick={clickCreateNew}
                      startIcon={isMobile && !isTablet ? null : <AddOutlined />}
                    >
                      {isMobile && !isTablet ? <MdAdd size={23} /> : 'Add'}
                    </Button>
                  )}

                  {!isOffline && (accountPermissions.isDelete || accountPermissions.approveAccount) && (
                    <Button
                      disabled={getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length === 0}
                      variant={isMobile && !isTablet ? 'text' : 'outlined'}
                      color="default"
                      size="small"
                      className={isMobile && !isTablet ? 'mobile_button' : `${styles.add_submit_btn} ${styles.action_new_submit_btn}`}
                      onClick={openActions}
                      aria-controls="action-menu"
                    >
                      {isMobile && !isTablet ? '' : 'Actions'} <ExpandMore />
                    </Button>
                  )}
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
                    {accountPermissions.isUpdate && accountPermissions.approveAccount && (
                      <MenuItem
                        disabled={getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.filter((d) => !d.approved).length === 0}
                        onClick={() => {
                          closeActions();
                          setMultipleApproveDisapproveAccount({
                            show: true,
                            approved: true,
                            selectedRecords: getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.filter((d) => !d.approved).length
                          });
                        }}
                      >
                        Approve Accounts &nbsp; <Chip size="small" label={getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.filter((d) => !d.approved).length} />
                      </MenuItem>
                    )}
                    {accountPermissions.isUpdate && accountPermissions.approveAccount && (
                      <MenuItem
                        disabled={getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.filter((d) => d.approved).length === 0}
                        onClick={() => {
                          closeActions();
                          setMultipleApproveDisapproveAccount({
                            show: true,
                            approved: false,
                            selectedRecords: getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.filter((d) => d.approved).length
                          });
                        }}
                      >
                        Disapprove Accounts &nbsp; <Chip size="small" label={getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.filter((d) => d.approved).length} />
                      </MenuItem>
                    )}
                    {accountPermissions.isDelete && (
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
                    {(accountPermissions.isUpdate && accountResource === 'customerAccount' && permissions?.productInventory) && (
                      <MenuItem
                        disabled={getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length === 0}
                        onClick={() => {
                          setOpenAddPlantsDialog(true)
                          closeActions();
                        }}
                      >
                        Assign {routes.warehouse.title} &nbsp; <Chip size="small" label={getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length} />
                      </MenuItem>
                    )}
                    {accountPermissions.isUpdate && (
                      <MenuItem
                        disabled={getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length === 0}
                        onClick={() => {
                          if (getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.some((d) => d?.isAllowedToUpdate === false)) {
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
                                  let restEntities = current?.restentity.map((o) => o.optionValue);
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
                </Grid>
              </div>
            </Grid>
          </Grid>

          {/* <CustomHeader
              total={rowCount}
              heading={sidebarResource[accountResource]}
              selectedType={selectedType}
              onTypeChange={handleAccountSelect}
              options={AccTypes}
              secondHeading="Account"
              icon={<MdAccountCircle className="headerLogo" />}
            >
            </CustomHeader> */}
        </div>

        {Object.keys(frameWorkComponent).length > 0 ? (
          isMobile && !isTablet ? (
            <CustomSwipableList
              allowSelection={true}
              allowSwipe={true}
              permissions={accountPermissions}
              primaryField={columns?.find((d) => d.field === 'accountName')}
              onClick={(d) => {
                history.push(`${accountApi}/detail/${d._id}`);
              }}
              dataRows={dataRows}
              selectedRecords={getLocalStorageArrayData(`${localStorageSelectedRecords}`)}
              dispatch={dispatch}
              onEdit={(d) => {
                history.push(`${accountApi}/detail/${d._id}?openEdit=true`);
              }}
              extraParamsToCheckDelete={true}
              onDelete={(d) => {
                setSingleAccountDelete({
                  show: true,
                  id: d._id,
                  accountName: d.accountName
                });
              }}
              rowCount={rowCount}
              page={page}
              loading={loading}
              additionalDetails={[
                {
                  icon: <FaSuitcase size={18} />,
                  field: 'parentAccount'
                }
              ]}
              chips={[
                {
                  icon: <MdWeb />,
                  label: 'Website:',
                  field: 'website'
                },
                {
                  icon: <FaAddressBook />,
                  label: 'BillingAddress',
                  field: 'billingAddress'
                },
                {
                  icon: <FaAddressCard />,
                  label: 'ShippingAddress',
                  field: 'shippingAddress'
                }

                // {

                //     logo: "accountLogo:",
                //     field: "accountLogo",

                // },
              ]}
              // avatarLogo={[
              //   {

              //     label: "accountLogo:",
              //     field: "accountLogo",

              // }
              // ]}
              owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
              onCreate={false}
              showClone={true}
              onClone={(data) => {
                cloneAccount(data);
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
              page={page}
              loading={loading}
              renderedFrom={renderedFrom}
              refreshGrid={fetchAccounts}
              isClientSideGrid={isOffline}
              allowAction={!isOffline}
              allowSelection={!isOffline}
              showOnlyShowFilteredRecordSwitch={true}
            />
          )
        ) : null}

        {showDeleteWarningConfirmBox?.show ? (
          <MessageDialog
            open={showDeleteWarningConfirmBox?.show}
            message={
              showDeleteWarningConfirmBox.isDelete
                ? `You are trying to delete records which you do not have permission to delete, Please remove those records from selection and try again.`
                : `You are trying to update records which you do not have permission to update, Please remove those records from selection and try again.`
            }
            onClose={() => setShowDeleteWarningConfirmBox({ show: false, isDelete: false })}
          />
        ) : null}

        {showDeleteConfirmBox ? (
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={`Are you sure you want to delete the selected account(s) ?`}
            onClose={() => setShowDeleteConfirmBox(false)}
            onOk={handleDeleteAccounts}
          />
        ) : null}
        {singleAccountDelete.show ? (
          <ConfirmationDialog
            open={singleAccountDelete.show}
            message={`Are you sure you want to delete the account: ${singleAccountDelete.accountName} ? `}
            onClose={() =>
              setSingleAccountDelete({
                id: null,
                show: false,
                accountName: ''
              })
            }
            onOk={handleSingleDeleteAccounts}
          />
        ) : null}

        {singleApproveDisapproveAccount.show ? (
          <ConfirmationDialog
            open={singleApproveDisapproveAccount.show}
            message={`Are you sure you want to ${singleApproveDisapproveAccount.approved ? 'approve' : 'disapprove'} account: ${singleApproveDisapproveAccount.accountName
              } ? `}
            onClose={() =>
              setSingleApproveDisapproveAccount({
                id: null,
                show: false,
                accountName: ''
              })
            }
            onOk={handleSingleApproveDisapproveAccount}
          />
        ) : null}

        {multipleApproveDisapproveAccount.show ? (
          <ConfirmationDialog
            open={multipleApproveDisapproveAccount.show}
            message={`Are you sure you want to ${multipleApproveDisapproveAccount.approved ? 'approve' : 'disapprove'} selected ${multipleApproveDisapproveAccount.selectedRecords
              } account(s) ? `}
            onClose={() =>
              setMultipleApproveDisapproveAccount({
                show: false,
                approved: false,
                selectedRecords: 0
              })
            }
            onOk={approveDisapproveAccounts}
          />
        ) : null}
        {isAccDialogVisible ? (
          <ManageAccountDialog
            open={isAccDialogVisible}
            onClose={handleDialogClose}
            id={cloneId}
            accountResource={accountResource}
            accountApi={accountApi}
            isClone={cloneId ? true : false}
            accountNameForClone={accountNameForClone}
          />
        ) : null}
        {openAddPlantsDialog &&
          <WarhouseList
            isCustomer={false}
            api="/warehouse"
            isAddingWarehouse={isAddingWarehouse}
            addWarehouse={(selectedPlants: any) => {
              setAddingWarehouse(true)
              axiosInstance().post(`/customer-account/assign-warehouse`, {
                ids: getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.map((d: any) => d._id),
                warehouse: selectedPlants.map((d: any) => d._id),
              }).then(() => {
                fetchAccounts();
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
            resource={sidebarResource[accountResource]}
            resourceIds={getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.length ? getLocalStorageArrayData(`${localStorageSelectedRecords}`)?.map((o) => o._id) : [accountId]}
            onClose={() => {
              setShowEntityDialog(false);
              setAccountId('');
            }}
            onSuccess={fetchAccounts}
            entities={entities}
          />
        ) : null}
      </CustomContainer>
    </>
  );
}
