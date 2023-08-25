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
import { CustomDialogTransition, gridLoadingTimeout, sidebarResource } from '../../../constants/helpers';
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
import PreviewIcon from '@material-ui/icons/Visibility';
import _ from 'lodash';
import InsertDriveFileOutlinedIcon from '@material-ui/icons/InsertDriveFileOutlined';
import FolderIcon from '@material-ui/icons/Folder';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import SendIcon from '@material-ui/icons/Send';
import { CreateEmail } from 'src/components/Activity/Email/CreateEmail';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';

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
  const [open, setOpen] = useState({ open: false, type: null, parentFolder: null, parentResource: null });
  const [attachmentData, setAttachmentData] = useState(null);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [isConfirmDialogVisible, setIsConfirmDialogVisible] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [sendMail, setSendMail] = useState(false);
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const { dataRows, rowCount, selectedRecords, loading, page, limit, pageSizes, search, filters, sorting } = state;
  const [resource, setResource] = useState(null);
  const [resourceData, setResourceData] = useState(null);
  const [emailAttachment, setEmailAttachment] = useState(null);
  const [loadingResources, setLoadingResources] = useState(false);
  const [selectedResourceData, setSelectedResourceData] = useState(null);
  const [resourceOptions, setResourceOptions] = useState([]);
  const [addchildDialog, setAddchildDialog] = useState({ open: false, data: null, top: null, bottom: null });

  const column: any = [
    {
      accessor: 'type',
      id: 'type',
      Header: 'Type',
      width: 70,
      canDrag: false,
      disableFilters: true,
      Cell: ({ row }) => (
        <p style={{ display: 'flex', alignItems: 'center', color: 'var(--dark-primary-text, #3B4F60)' }}>
          {row.original?.type === 'folder' ? (
            <>
              <FolderIcon style={{ paddingRight: 5 }} />
              Folder
            </>
          ) : (
            <>
              <InsertDriveFileOutlinedIcon style={{ paddingRight: 5 }} />
              File
            </>
          )}
        </p>
      )
    },
    {
      id: 'name',
      accessor: 'name',
      Header: 'Name',
      width: 300,
      canDrag: false,
      disableFilters: true,
      Cell: ({ row }) => (
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <p className={permissions?.attachment?.isUpdate ? 'link cursor-pointer' : ''} onClick={() => handleActivityOpen(row.original)}>
            {row.original.name || ''}
          </p>
          {row.original?.type === 'folder' && (
            <Box pl={1}>
              <HtmlTooltip title={'Add Folder/File'}>
                <IconButton
                  size="small"
                  onClick={(e) => {
                    setAddchildDialog({ open: true, data: row.original, top: e.clientY, bottom: e.clientX });
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
      disableFilters: true,
      Cell: ({ row }) => (
        <>
          {row.original.relatedTo && row.original.relatedTo?.length > 0 ? (
            row.original.relatedTo.map((d) => {
              return (
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <p>{d.name}</p>
                  <IconButton
                    className="ml-3"
                    size="small"
                    onClick={() => redirectToResource(d?.type, d?.referenceId)}
                  >
                    <OpenInNewIcon fontSize="small" color="primary" />
                  </IconButton>
                  <Chip className="ml-3" color="primary" label={`${routes[d?.type]?.title}`} />
                </div>
              );
            })
          ) : (
            <NoDataCell />
          )}
        </>
      )
    },
    {
      id: 'createdBy',
      accessor: 'createdBy',
      Header: 'Created By',
      width: 150,
      canDrag: false,
      disableFilters: true,
      Cell: ({ row }) =>
        row.original?.createdBy ? (
          <p>
            {row.original?.createdBy?.user?.concatedName}
            <span className="createdAtTime badge-date">{displayDate(row.original?.createdBy?.date)}</span>
          </p>
        ) : (
          <NoDataCell />
        )
    },
    {
      id: 'updatedBy',
      accessor: 'updatedBy',
      Header: 'Updated By',
      width: 150,
      canDrag: false,
      disableFilters: true,
      Cell: ({ row }) =>
        row.original?.updatedBy ? (
          <p>
            {row.original?.updatedBy?.user?.concatedName}
            <span className="createdAtTime badge-date">{displayDate(row.original?.updatedBy?.date)}</span>
          </p>
        ) : (
          <NoDataCell />
        )
    },
    {
      id: 'action',
      accessor: 'action',
      Header: 'Actions',
      minWidth: 120,
      width: 120,
      sticky: 'right',
      disableFilters: true,
      canDrag: false,
      Cell: ({ row }) => {
        const allPdf = _.every(row.original?.file, (d) => _.endsWith(d?.url, '.pdf'));
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {row.original.type === 'file' && (
              <Tooltip
                title="Send Email"
                onClick={() => {
                  handleMail(row.original);
                }}
              >
                <IconButton size="small">
                  <SendIcon color="primary" style={{ maxWidth: '18px' }} />
                </IconButton>
              </Tooltip>
            )}
            {row.original.type !== 'folder' && (
              <Tooltip title="Download">
                <IconButton size="small" aria-label="Delete" onClick={() => downloadFile(row.original)}>
                  <GetAppIcon fontSize="small" color="primary" />
                </IconButton>
              </Tooltip>
            )}
            {allPdf && row.original.type === 'file' && (
              <Tooltip
                title="Preview"
                onClick={(e) => {
                  viewPdf(e, row.original);
                }}
              >
                <IconButton size="small">
                  <PreviewIcon fontSize="small" color="primary" />
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
          </div>
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
      const lookupResource = sidebarResource[resource?.optionValue === 'quote' ? 'quoteBuilder' : resource?.optionValue];
      axiosInstance()
        .get(`/sa-formbuilder/lookup?lookupResource=${lookupResource}`)
        .then(({ data: { data } }) => {
          setResourceData(data[lookupResource] || []);
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
    window.open(type === 'quote' ? `${routes['quoteBuilder'].path}/detail/${id}` : `${routes[type].path}/detail/${id}`);
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
  const handleMail = (data) => {
    const file = data?.file;
    axiosInstance()
      .get(`user/download?fileName=${file[0].url}`, {
        responseType: 'blob'
      })
      .then(({ data }) => {
        const tempfile = new Blob([data], { type: 'application/pdf' });
        generateBase64forFile(tempfile, file[0].name, 'pdf');
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const generateBase64forFile = (blobData, fileName, type) => {
    let reader = new FileReader();
    reader.readAsDataURL(blobData);
    reader.onloadend = function () {
      let base64data: any = reader.result;
      if (type === 'pdf') {
        const attachments = [
          {
            base64: base64data.substring(parseInt(base64data.indexOf(',') + 1)),
            contentType: base64data.split(';')[0].split(':')[1],
            name: fileName
          }
        ];
        setEmailAttachment(attachments);
        setSendMail(true);
      }
    };
  };

  const viewPdf = (event, data) => {
    if (event) {
      toastConfig.setToastConfig({
        open: true,
        type: 'info',
        message: `File is Loading, Please wait...`
      });
    }
    const file = data?.file;
    setIsDownloading(true);
    if (file?.length === 1) {
      axiosInstance()
        .get(`user/download?fileName=${file[0].url}`, {
          responseType: 'blob',
          onDownloadProgress: (progressEvent) => {
            let percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total);

            if (percentCompleted === 100) {
              toastConfig.setToastConfig({
                message: 'File Downloaded Successfully',
                open: true,
                type: 'success'
              });
              setTimeout(() => {
                setIsDownloading(false);
              }, 2000);
            }
          }
        })
        .then(({ data }) => {
          const file = new Blob([data], { type: 'application/pdf' });
          const fileURL = URL.createObjectURL(file);
          const pdfWindow = window.open();
          pdfWindow.location.href = fileURL;
          // toastConfig.setToastConfig({ open: true, type: 'success', message: 'Preview file downloaded successfully.' });
          setIsDownloading(false);
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
          setIsDownloading(false);
        });
    } else {
      const fileUrl = file?.map((f) => f.url);
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
          const file = new Blob([data], { type: 'application/pdf' });
          const fileURL = URL.createObjectURL(file);
          const pdfWindow = window.open();
          pdfWindow.location.href = fileURL;
          setTimeout(() => setIsDownloading(false), 2000);
        })
        .catch((err) => {
          toastConfig.setToastConfig(err);
          setIsDownloading(false);
        });
    }
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = !isExport ? `&page=${page}&limit=${limit}` : '';

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
    let api = `/attachment?graphLookup=0&relatedTo=${JSON.stringify(filter)}${queryString}`;
    axiosInstance()
      .get(api)
      .then(
        ({
          data: {
            data: { data, count }
          }
        }) => {
          let rows = data?.filter((e) => !e?.parentFolder);
          const parentRows = rows.map((parent, idx) => {
            parent.subRows = generateNestedData(data, parent);
            return {
              ...parent,
              id: parent._id,
              fileUrl: parent.fileUrl,
              canEdit: parent.type === 'folder' ? true : parent?.canEdit,
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

  const fetchChildAttachment = async (id) => {
    const attachment = await axiosInstance().get(`/attachment/child/${id}`)
    return attachment?.data?.data
  }

  const generateNestedData = (data, parent) => {
    const childRow = data
      ?.filter((e) => e?.parentFolder === parent?._id)
      ?.map((u) => {
        u.subRows = generateNestedData(data, u);
        return {
          ...u,
          id: u._id,
          fileUrl: u.fileUrl,
          canEdit: u.type === 'folder' ? true : u?.canEdit,
          isChecked: false
        };
      });
    return childRow;
  };

  const handleChangeFilter = (value) => {
    setFilter(value);
  };

  const handleActivityOpen = (data) => {
    setOpen({ open: true, type: data?.type ? data.type : 'file', parentFolder: data?.parentFolder, parentResource: null });
    setAttachmentData(data);
  };

  const handleClose = () => {
    setOpen({ open: false, type: null, parentFolder: null, parentResource: null });
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
        <Grid item md={4} sm={11} xs={10}>
          <CustomBreadCrumbs routes={[{ title: routes.attachment.title }]} />
        </Grid>
        <Grid item md={8} sm={1} xs={2}>
          <Grid container direction="row">
            <Grid item xs={12} sm={12}>
              <Grid container justify="flex-end">
                <ImportExportLinks
                  permissions={permissions?.attachment}
                  module="Attachment"
                  api={`/attachment`}
                  afterImportCompleted={() => { }}
                  total={rowCount}
                  onlyExport={true}
                  additionalParams={`&relatedTo=${JSON.stringify(filter)}${getQueryString(true)}`}
                />
              </Grid>
            </Grid>
          </Grid>
        </Grid>
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
                    getOptionLabel={(option: any) => option.optionLabel}
                    getOptionSelected={(option: any, value: any) => option.optionLabel === value.optionLabel}
                    style={{ width: '250px' }}
                    value={selectedResourceData}
                    onChange={(event, newValue) => {
                      setSelectedResourceData(newValue);
                      if (newValue?.optionValue) {
                        setFilter((prevState) => [
                          ...prevState,
                          { _id: newValue.optionValue, type: resource.optionValue, name: newValue.optionLabel }
                        ]);
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
                  <Box style={{ flexGrow: 1, minWidth: 210 }}>
                    <SearchFilter handleChangeFilter={handleChangeFilter} filter={filter} chip={{ size: 'small' }} activityName="attachment" />
                  </Box>
                  <Box style={{ display: 'flex', gap: '5px' }}>
                    {
                      <Button
                        variant={isMobile && !isTablet ? 'text' : 'contained'}
                        color="primary"
                        size="small"
                        onClick={() => setOpen({ open: true, type: 'file', parentFolder: null, parentResource: null })}
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
                      className={`${isMobile && !isTablet ? 'mobile_button' : styles.action_submit_btn} new-dropdown-v1`}
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
                  </Box>
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
                dispatch({ type: 'selection', selectedRecords: newSelectedRecords });
              }}
              dispatch={dispatch}
              childrenProperty="subRows"
              uniqueKey="_id"
              expander={true}
              setWholeRowsCellColor={() => { }}
              renderedFrom={'attachment_render'}
              isClientSideGrid={false}
              rowCount={rowCount}
              limit={limit}
              customFilters={filters}
              sorting={sorting}
              loading={loading}
              fetchChildAttachment={fetchChildAttachment}
            />
          ) : (
            <Box p={2} height={500}>
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
              setAddchildDialog({ open: false, data: null, top: null, bottom: null });
            }}
          >
            <MenuList>
              <MenuItem
                onClick={() => {
                  var parentResource = null;
                  if (addchildDialog.data?.relatedTo?.length) {
                    parentResource = {
                      referenceId: addchildDialog.data?.relatedTo[0]?.referenceId,
                      type: addchildDialog.data?.relatedTo[0]?.type
                    };
                  }
                  setOpen({ open: true, type: 'folder', parentFolder: addchildDialog.data._id, parentResource: parentResource });
                  setAddchildDialog({ open: false, data: null, top: null, bottom: null });
                }}
              >
                Add Folder
              </MenuItem>
              <MenuItem
                onClick={() => {
                  var parentResource = null;
                  if (addchildDialog.data?.relatedTo?.length) {
                    parentResource = {
                      referenceId: addchildDialog.data?.relatedTo[0]?.referenceId,
                      type: addchildDialog.data?.relatedTo[0]?.type
                    };
                  }
                  setOpen({ open: true, type: 'file', parentFolder: addchildDialog.data._id, parentResource: parentResource });
                  setAddchildDialog({ open: false, data: null, top: null, bottom: null });
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
                  type: open.parentResource ? open.parentResource?.type : resource && selectedResourceData ? resource.optionValue : 'user',
                  referenceId: open.parentResource
                    ? open.parentResource?.referenceId
                    : resource && selectedResourceData
                      ? selectedResourceData.optionValue
                      : user?.user?._id,
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
        {sendMail && (
          <Dialog
            fullScreen={fullScreen || isMobile || isTablet}
            TransitionComponent={CustomDialogTransition}
            open={sendMail}
            aria-labelledby="customized-dialog-title"
            maxWidth={'md'}
            onClose={() => {
              setSendMail(false);
              setFullScreen(false);
            }}
            fullWidth
          >
            <CreateEmail
              emailId={null}
              // relatedTo={relatedTo}
              handleClose={() => {
                setSendMail(false);
                setFullScreen(false);
              }}
              fetchData={() => {
                setSendMail(false);
                setFullScreen(false);
              }}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              isMinimized={!fullScreen}
              showManimizeMaximize={true}
              qouteBuilderAttachments={emailAttachment}
              isQuoteBuilder={true}
            />
          </Dialog>
        )}
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
