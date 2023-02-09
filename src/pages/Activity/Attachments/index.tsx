import { useState, useEffect, useContext, useReducer, Fragment } from 'react';
import Box from '@material-ui/core/Box';
import Grid from '@material-ui/core/Grid';
import { SearchFilter } from '../../../components/Activity/Report/SearchFilter';
import { useHistory } from 'react-router-dom';
import queryString from 'query-string';
import { GetReferenceName } from '../../../axios/activity';
import CustomBreadCrumbs from '../../../components/CustomBreadCrumbs';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import Dialog from '@material-ui/core/Dialog';
import ManageAttachment from '../../../components/Activity/Attachments/ManageAttachment';
import CustomContainer from '../../../components/CustomContainer';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import styles from '../../Leads/Header.module.scss';
import { AiOutlinePaperClip } from 'react-icons/ai';
import { AddOutlined } from '@material-ui/icons';
import { Button, Tooltip, IconButton, MenuItem, Menu, TextField, Chip, Link, Popover, MenuList } from '@material-ui/core';
import { useData } from '../../../StateProvider/Provider';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, getApi, getData, gridLoadingTimeout } from '../../../constants/helpers';
import { Delete as DeleteIcon } from '@material-ui/icons';
import { gridPageSizes, isObjectEmpty, displayDate } from '../../../constants/helpers';
import { ExpandMore } from '@material-ui/icons';
import routes from '../../../components/Helpers/Routes';
import { MdAdd } from 'react-icons/all';
import GetAppIcon from '@material-ui/icons/GetApp';
import { Autocomplete } from '@material-ui/lab';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import { get_activity_resource } from '../../../components/Activity/Helpers/utils';
import CustomReactTable from 'src/components/CustomReactTableNew/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import moment from 'moment';

function reducer(state, action) {
  switch (action.type) {
    case 'loading':
      return {
        ...state,
        loading: action.loading
      };

    case 'initialize':
      return {
        ...state,
        dataRows: action.data,
        rowCount: action.count
      };

    case 'selection':
      return {
        ...state,
        selectedRecords: action.selectedRecords
      };

    case 'update':
      return {
        ...state,
        dataRows: action.data,
        loading: false
      };

    case 'filter':
      return {
        ...state,
        loading: true,
        filters: action.filters,
        page: 0
      };

    case 'sort':
      return {
        ...state,
        sorting: action.sorting,
        loading: true
      };

    case 'search':
      return {
        ...state,
        search: action.search,
        loading: true
      };

    case 'pageChange':
      return {
        ...state,
        page: action.page
      };

    case 'pageSizeChange':
      return {
        ...state,
        limit: action.limit,
        page: 0,
        loading: true
      };

    case 'complete':
      return {
        ...state,
        loading: false
      };

    default:
      break;
  }

  return state;
}

const intialState = {
  dataRows: [],
  rowCount: 0,
  loading: false,
  page: 0,
  limit: 25,
  pageSizes: gridPageSizes,
  search: '',
  filters: {},
  sorting: [],
  selectedRecords: []
};

export default function Attachment() {
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { referenceType, referenceId } = parsed;

  const [anchorEl, setAnchorEl] = useState(null);
  const [filter, setFilter] = useState(null);
  const [open, setOpen] = useState({ open: false, type: null, parentFolder: null });
  const [attachmentData, setAttachmentData] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [isConfirmDialogVisible, setIsConfirmDialogVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting } = state;
  const [resource, setResource] = useState(null);
  const [resourceData, setResourceData] = useState(null);
  const [loadingResources, setLoadingResources] = useState(false);
  const [selectedResourceData, setSelectedResourceData] = useState(null);
  const [resourceOptions, setResourceOptions] = useState([]);
  const [addchildDialog, setAddchildDialog] = useState({ open: false, parentId: null, top: null, bottom: null });
  const [selectedRecords, setSelectedRecords] = useState([]);

  const column: any = [
    {
      accessor: 'type',
      id: 'attachmentType',
      Header: 'Type',
      width: 70,
      canDrag: false,
      sticky: isMobile ? 'none' : 'left',
      Cell: ({ row }) => <>{row.original?.type === 'folder' ? 'Folder' : 'Attachment'}</>
    },
    {
      id: 'name',
      accessor: 'name',
      Header: 'Name',
      width: 300,
      canDrag: false,
      sticky: isMobile ? 'none' : 'left',
      Cell: ({ row }) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <a className={permissions?.attachment?.isUpdate ? 'link cursor-pointer' : ''} onClick={() => handleActivityOpen(row.original)}>
            {row.original.name || ''}
          </a>
          {row.original?.attachmentType === 'folder' && (
            <Box pl={1}>
              <HtmlTooltip title={'Add Folder/File'}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    setAddchildDialog({ open: true, parentId: row.original._id, top: e.clientY, bottom: e.clientX });
                  }}
                >
                  <AddOutlined fontSize="small" />
                </IconButton>
              </HtmlTooltip>
            </Box>
          )}
        </div>
      )
    },
    {
      id: 'relatedTo',
      accessor: 'relatedTo',
      Header: 'Related To',
      width: 300,
      canDrag: false,
      sticky: isMobile ? 'none' : 'left',
      Cell: ({ row }) => (
        <>
          {row.original.relatedTo && row.original.relatedTo?.length > 0 ? (
            row.original.relatedTo.map((d) => {
              return (
                <>
                  <Link className="link text-truncate" onClick={() => redirectToResource(d?.type, d?.referenceId)}>
                    {d.name}
                  </Link>
                  <Chip className="ml-3" color="primary" label={`${routes[d?.type]?.title}`} />
                </>
              );
            })
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    {
      id: 'createdAt',
      accessor: 'createdAt',
      Header: 'Created At',
      width: 100,
      canDrag: false,
      sticky: isMobile ? 'none' : 'left',
      Cell: ({ row }) => <>{row.original?.createdBy}</>
    },
    {
      id: 'updatedAt',
      accessor: 'updatedAt',
      Header: 'Updated At',
      width: 100,
      canDrag: false,
      sticky: isMobile ? 'none' : 'left',
      Cell: ({ row }) => <>{row.original?.updatedAt}</>
    },
    {
      id: 'action',
      accessor: 'action',
      Header: '',
      minWidth: 50,
      width: 50,
      sticky: 'right',
      disableFilters: true,
      canDrag: false,
      Cell: ({ row }) => {
        return (
          <>
            {row.original.attachmentType !== 'folder' && (
              <Tooltip title="Download">
                <IconButton size="small" aria-label="Delete" onClick={() => downloadFile(row.original)}>
                  <GetAppIcon fontSize="small" color="primary" />
                </IconButton>
              </Tooltip>
            )}
            {row.original.canEdit ? (
              <Tooltip title="Delete">
                <IconButton size="small" aria-label="Delete" onClick={() => showConfirmBox(row.original)}>
                  <DeleteIcon fontSize="small" color="error" />
                </IconButton>
              </Tooltip>
            ) : (
              <Tooltip className="cursor-stop" title="Signed Quote Attachment can not be deleted">
                <IconButton size="small" aria-label="Delete">
                  <DeleteIcon fontSize="small" color="disabled" />
                </IconButton>
              </Tooltip>
            )}
          </>
        );
      }
    }
  ];

  useEffect(() => {
    setResourceOptions(get_activity_resource(permissions));
  }, []);

  useEffect(() => {
    if (referenceType) {
      GetReferenceName(referenceType, referenceId)
        .then(({ data }) => {
          setFilter([{ _id: referenceId, type: referenceType, name: data.name }]);
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
        });
    } else {
      setFilter([]);
    }
  }, [referenceId]);

  useEffect(() => {
    if (filter) {
      fetchAttachments();
    }
  }, [page, limit, filter, filters, sorting]);

  useEffect(() => {
    if (resource && resource?.optionValue) {
      setLoadingResources(true);
      axiosInstance()
        .get(`${getApi(resource?.optionValue)}?limit=100`)
        .then(({ data: { data } }) => {
          if (data.length) {
            const mappedData = data.map((_d) => getData(resource?.optionValue, _d));
            setResourceData(mappedData || []);
          }
          setLoadingResources(false);
        })
        .catch((error) => {
          setLoadingResources(false);
        });

      return () => {
        setSelectedResourceData(null);
        setResourceData(null);
      };
    }
  }, [resource]);

  const redirectToResource = (type, id) => {
    history.push(type === 'quote' ? `${routes['quoteBuilder'].path}/detail/${id}` : `${routes[type].path}/detail/${id}`);
  };

  const downloadFile = (data1) => {
    const file = data1?.file;
    setIsDownloading(true);
    if (file?.length === 1) {
      axiosInstance()
        .get(`user/download?fileName=${file[0].url}`, {
          responseType: 'blob'
        })
        .then(({ data }) => {
          const url = window.URL.createObjectURL(new Blob([data]));
          const link = document.createElement('a');
          link.href = url;
          var fileExt = file[0].url?.split('.').pop();
          link.setAttribute('download', file[0].name + '.' + fileExt);
          document.body.appendChild(link);
          link.click();
          setTimeout(() => setIsDownloading(false), 2000);
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
          setIsDownloading(false);
        });
    } else {
      const fileUrl = file.map((f) => f.url);
      axiosInstance()
        .put(
          `user/download`,
          {
            files: fileUrl
          },
          {
            responseType: 'blob'
          }
        )
        .then(({ data }) => {
          const url = window.URL.createObjectURL(new Blob([data]));
          const link = document.createElement('a');
          link.href = url;
          link.setAttribute('download', attachmentData?.name ? `${attachmentData?.name}.zip` : 'download.zip');
          document.body.appendChild(link);
          link.click();
          setTimeout(() => setIsDownloading(false), 2000);
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
          setIsDownloading(false);
        });
    }
  };

  const getQueryString = () => {
    let deepFilter = `&page=${page}&limit=${limit}`;

    if (!isObjectEmpty(filters)) {
      const updatedFilters = [];

      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: field,
          term: filters[field].filter
        });
      });
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(updatedFilters))}`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
    }
    return deepFilter;
  };

  const fetchAttachments = async () => {
    const queryString = getQueryString();
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    let api = `/attachment?relatedTo=${JSON.stringify(filter)}${queryString}`;
    axiosInstance()
      .get(api)
      .then(
        ({
          data: {
            data: { data, count }
          }
        }) => {
          console.log('data', data, count);
          let rows = data?.filter((e) => e?.parentFolder === null || e?.parentFolder === undefined);
          const parentRows = rows.map((parent, idx) => {
            parent.srNo = idx + 1;
            parent.subRows = generateNestedData(data, parent);
            return {
              ...parent,
              id: parent._id,
              fileUrl: parent.fileUrl,
              canEdit: parent.type === 'folder' ? true : parent?.canEdit,
              createdBy: moment(parent.createdBy?.date).format('MMM Do, YYYY'),
              updatedBy: moment(parent.updatedBy?.date).format('MMM Do, YYYY'),
              isChecked: false
            };
          });
          dispatch({ type: 'initialize', data: parentRows, count: count });
          setTimeout(() => {
            dispatch({ type: 'loading', loading: false });
          }, gridLoadingTimeout);
        }
      )

      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const generateNestedData = (data, parent) => {
    const childRow = data
      ?.filter((e) => e?.parentFolder === parent?._id)
      ?.map((u) => {
        u.subRows = generateNestedData(data, u);
        return {
          ...u,
          id: u._id,
          fileUrl: u.fileUrl,
          canEdit: u.attachmentType === 'folder' ? true : u?.canEdit,
          createdBy: displayDate(u.createdBy?.date),
          updatedBy: displayDate(u.updatedBy?.date),
          isChecked: false
        };
      });
    return childRow;
  };

  const handleChangeFilter = (value) => {
    setFilter(value);
  };

  const handleActivityOpen = (data) => {
    setOpen({ open: true, type: data?.attachmentType ? data.attachmentType : 'file', parentFolder: data?._id });
    setAttachmentData(data);
  };
  const handleClose = () => {
    setOpen({ open: false, type: null, parentFolder: null });
    setAttachmentData(null);
  };
  const showConfirmBox = (row) => {
    if (row) {
      if (row && row._id) {
        setDeleteRecord(row);
      }
    }
    setIsConfirmDialogVisible(true);
  };

  const handleDelete = async () => {
    setDeleteLoading(true);
    if (deleteRecord?._id || selectedRecords.length > 0)
      axiosInstance()
        .put('attachment/deletemany ', { ids: deleteRecord?._id ? [deleteRecord._id] : selectedRecords.map((d) => d._id) })
        .then(({ data }) => {
          toastConfig.setToastConfig({
            open: true,
            type: 'success',
            message: 'Deleted Successfully'
          });
          setIsConfirmDialogVisible(false);
          setDeleteLoading(false);
          if (deleteRecord) setDeleteRecord(null);
          fetchAttachments();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setIsConfirmDialogVisible(false);
          setDeleteLoading(false);
        });
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  return (
    <Fragment>
      <Grid container className="headerbox">
        <CustomBreadCrumbs routes={[{ title: routes.attachment.title }]} />
      </Grid>
      <CustomContainer>
        {filter && (
          <div className="header-panel">
            <Grid container className={styles.filter_side_container}>
              <Grid item xs={12} md={6} sm={12} className="d-flex align-items-center gap-1">
                <AiOutlinePaperClip className="headerLogo" />
                <span className="listingHeader">{routes.attachment.title} </span>
                <Autocomplete
                  options={resourceOptions}
                  getOptionLabel={(option) => option.optionLabel}
                  style={{ width: '250px' }}
                  value={resource}
                  onChange={(event, newValue) => {
                    setResource(newValue);
                    if (newValue) {
                      setFilter((prevState) => [...prevState, { type: newValue?.optionValue, name: newValue?.optionLabel, isAll: true }]);
                    } else {
                      setFilter([]);
                    }
                  }}
                  size="small"
                  renderInput={(params) =>
                    isMobile && !isTablet ? (
                      <TextField {...params} label="Select Resource" variant="standard" className={isMobile ? 'serchBox' : ''} />
                    ) : (
                      <TextField {...params} label="Select Resource" variant="outlined" />
                    )
                  }
                />
                {resource && resourceData && (
                  <Autocomplete
                    disabled={loadingResources}
                    options={resourceData}
                    getOptionLabel={(option: any) => option.name}
                    getOptionSelected={(option: any, value: any) => option.name === value.name}
                    style={{ width: '250px' }}
                    value={selectedResourceData}
                    onChange={(event, newValue) => {
                      setSelectedResourceData(newValue);
                      if (newValue?.id) {
                        setFilter((prevState) => [...prevState, { _id: newValue.id, type: resource.optionValue, name: newValue.name }]);
                      } else {
                        setFilter([]);
                      }
                    }}
                    size="small"
                    renderInput={(params) => <TextField {...params} label={`Select ${resource.optionLabel}`} variant="outlined" />}
                  />
                )}
              </Grid>
              <Grid item xs={12} md={6} sm={12} className={styles.filter_side}>
                <Box component="div" className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} style={{ width: '100%' }}>
                  <Grid style={{ width: '90%', display: 'flex' }}>
                    <SearchFilter handleChangeFilter={handleChangeFilter} filter={filter} chip={{ size: 'small' }} activityName="attachment" />
                  </Grid>
                  <Grid style={{ display: 'flex', gap: '5px' }}>
                    {
                      <Button
                        variant={isMobile && !isTablet ? 'text' : 'contained'}
                        color="primary"
                        size="small"
                        onClick={() => setOpen({ open: true, type: 'file', parentFolder: null })}
                        className={isMobile && !isTablet ? 'mobile_button' : styles.add_submit_btn}
                        startIcon={isMobile && !isTablet ? null : <AddOutlined />}
                      >
                        {isMobile && !isTablet ? <MdAdd size={23} /> : 'Add'}
                      </Button>
                    }
                    <Button
                      variant={isMobile && !isTablet ? 'text' : 'outlined'}
                      color="default"
                      size="small"
                      onClick={openActions}
                      aria-controls="action-menu"
                      disabled={selectedRecords.length > 0 ? false : true}
                      className={isMobile && !isTablet ? 'mobile_button' : styles.action_submit_btn}
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
                      <MenuItem
                        disabled={permissions.attachment.isDelete ? !selectedRecords.some((records) => records.canEdit) : true}
                        onClick={() => {
                          showConfirmBox(null);
                          closeActions();
                        }}
                      >
                        Delete
                      </MenuItem>
                    </Menu>
                  </Grid>
                </Box>
              </Grid>
            </Grid>
          </div>
        )}
        <Box zIndex={5} width={'100%'}>
          {dataRows ? (
            <CustomReactTable
              height={'calc(100vh - 300px)'}
              columns={column}
              data={dataRows}
              currentPage={page}
              onSelect={(newSelectedRecords) => {
                // dispatch({ type: "selection", selectedRecords: newSelectedRecords })
              }}
              dispatch={dispatch}
              childrenProperty="subRows"
              uniqueKey="_id"
              expander={true}
              setWholeRowsCellColor={() => {}}
              renderedFrom={'attachment_render_form'}
              isClientSideGrid={false}
              rowCount={rowCount}
              limit={limit}
              customFilters={filters}
              sorting={sorting}
              loading={loading}
            />
          ) : (
            <Box p={2} height={500} bgcolor="white">
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </Box>
        {addchildDialog.open && (
          <Popover
            anchorReference="anchorPosition"
            anchorPosition={{ top: addchildDialog.top, left: addchildDialog.bottom }}
            anchorOrigin={{
              vertical: 'center',
              horizontal: 'left'
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'left'
            }}
            open={addchildDialog.open}
            onClose={() => {
              setAddchildDialog({ open: false, parentId: null, top: null, bottom: null });
            }}
          >
            <MenuList>
              <MenuItem
                onClick={() => {
                  setOpen({ open: true, type: 'folder', parentFolder: addchildDialog.parentId });
                  setAddchildDialog({ open: false, parentId: null, top: null, bottom: null });
                }}
              >
                Add Folder
              </MenuItem>
              <MenuItem
                onClick={() => {
                  setOpen({ open: true, type: 'file', parentFolder: addchildDialog.parentId });
                  setAddchildDialog({ open: false, parentId: null, top: null, bottom: null });
                }}
              >
                Add File
              </MenuItem>
            </MenuList>
          </Popover>
        )}
        {open.open ? (
          <Dialog
            open={open.open}
            fullScreen={fullScreen || isMobile || isTablet}
            TransitionComponent={CustomDialogTransition}
            aria-labelledby="customized-dialog-title"
            maxWidth={'md'}
            onClose={(e, reason) => {
              if (reason !== 'backdropClick') {
                handleClose();
                setFullScreen(false);
              }
            }}
            fullWidth
          >
            <ManageAttachment
              attachmentId={attachmentData?.id}
              relatedTo={[
                {
                  type: resource && selectedResourceData ? resource.optionValue : 'user',
                  referenceId: resource && selectedResourceData ? selectedResourceData.id : user?.user?._id,
                  access: true
                }
              ]}
              handleClose={() => {
                handleClose();
                setFullScreen(false);
              }}
              attachmentData={attachmentData}
              fetchData={fetchAttachments}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
              type={open.type}
              parentFolder={open.parentFolder}
            />
          </Dialog>
        ) : null}
        {isConfirmDialogVisible ? (
          <ConfirmationDialog
            open={isConfirmDialogVisible}
            message={`Are you sure you want to delete ${deleteRecord?.id ? deleteRecord?.name ?? 'this attachment?' : 'these attachments?'}`}
            onClose={() => {
              if (deleteRecord) setDeleteRecord(null);
              setIsConfirmDialogVisible(false);
            }}
            okBtnLoading={deleteLoading}
            onOk={handleDelete}
          />
        ) : null}
      </CustomContainer>
    </Fragment>
  );
}
