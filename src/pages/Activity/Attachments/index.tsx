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
import { Button, Tooltip, IconButton, MenuItem, Menu, TextField, Chip, Link } from '@material-ui/core';
import { useData } from '../../../StateProvider/Provider';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, getApi, getData, gridLoadingTimeout, resourceOptions } from '../../../constants/helpers';
import { Delete as DeleteIcon } from '@material-ui/icons';
import CustomAgGrid from '../../../components/AgGridComponents/CustomAgGrid';
import { gridPageSizes, isObjectEmpty, displayDate } from '../../../constants/helpers';
import { CommonRenderer, CommonRendererWithCopy } from '../../../components/AgGridComponents/CustomAgGridCellRenderers';
import { GoArrowDown } from 'react-icons/go';
import { ExpandMore } from '@material-ui/icons';
import routes from '../../../components/Helpers/Routes';
import CustomSwipableList from '../../../components/SwipableListComponents/CustomSwipableList';
import { MdAdd } from "react-icons/all";
import { Autocomplete } from '@material-ui/lab';
import { camelCase } from 'lodash';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import { startCase } from "lodash";

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
  const [filter, setFilter] = useState([]);
  const [open, setOpen] = useState(false);
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
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;
  const columnState = JSON.parse(localStorage.getItem('attachmentPage'));
  const localStorageSelectedRecords = "attachmentPage_selected";
  const [resource, setResource] = useState('');
  const [resourceData, setResourceData] = useState(null);
  const [loadingResources, setLoadingResources] = useState(false);
  const [selectedResourceData, setSelectedResourceData] = useState(null);
  const [columns, setColumns] = useState([
    { field: 'name', headerName: 'Name', primaryField: true, show: true, disabled: true, cellRenderer: 'nameRenderer' },
    { field: 'relatedTo', headerName: 'Related To', show: true, disabled: true, primaryField: true, cellRenderer: 'referenceRenderer' },
    {
      field: 'createdAt',
      headerName: 'Created At',
      show: true,
      cellRenderer: 'createdByRenderer',
      filter: false,
      sortable: false
    },
    {
      field: 'updatedAt',
      headerName: 'Updated At',
      show: true,
      cellRenderer: 'updatedByRenderer',
      filter: false,
      sortable: false
    }
  ]);
  if (columnState) {
    columns.forEach((item) => {
      columnState.forEach((d) => {
        if (d.colId === item.field) {
          item.show = !d.hide;
        }
      });
    });
  }
  useEffect(() => {
    if (referenceType) {
      GetReferenceName(referenceType, referenceId)
        .then(({ data }) => {
          setFilter([{ _id: referenceId, type: referenceType, name: data.name }]);
        })
        .catch((err) => { });
    }
  }, [referenceId]);

  useEffect(() => {
    fetchAttachments();
  }, [page, limit, filter, filters, sorting]);

  useEffect(() => {
    if (!resource) return;
    setLoadingResources(true);
    axiosInstance()
      .get(`${getApi(resource)}?limit=100`)
      .then(({ data: { data } }) => {
        if (data.length) {
          const mappedData = data.map((_d) => getData(resource, _d));
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
    // eslint-disable-next-line
  }, [resource]);

  const NameRenderer = (params) => (
    <a className={permissions?.attachment?.isUpdate ? "link cursor-pointer" : ""} onClick={() => handleActivityOpen(params.data)}>
      {params.data.name}
    </a >
  );

  const ReferenceRenderer = (params) => (
    <>{params.value && params.value?.length > 0 ? params.value.map(d => {
      return (
        <>
          <Link
            className="link text-truncate"
            onClick={() => history.push(`${routes[d?.type].path}/detail/${d?.referenceId}`)}
          >
            {d.name}
          </Link>
          <Chip
            className="ml-3"
            color="primary"
            label={`${startCase(d.type)}`}
          />
        </>
      )
    })
      : <NoDataCell />
    }
    </>
  );
  const downloadFile = (file) => {
    const fileUrl = file.map(f => f.url)
    setIsDownloading(true);
    axiosInstance()
      .put(`user/download`, {
        files: fileUrl
      }, {
        responseType: 'blob',
        // onDownloadProgress: (progressEvent) => {
        //   let percentCompleted = Math.floor((progressEvent.loaded * 100) / progressEvent.total);

        //   if (percentCompleted === 100) {
        //     toastConfig.setToastConfig({
        //       message: 'File Downloaded Successfully',
        //       open: true,
        //       type: 'success'
        //     });
        //     setTimeout(() => {
        //       setIsDownloading(false);
        //     }, 2000);
        //   }
        // }
      })
      .then(({ data }) => {
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', "download.zip");
        document.body.appendChild(link);
        link.click();
        setTimeout(() => setIsDownloading(false), 2000);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setIsDownloading(false);
      });
  };
  const ActionsRenderer = (params) => (
    <>
      <Tooltip title="Download">
        <IconButton
          size="small"
          aria-label="Download"
          color="primary"
          disabled={isDownloading}
          onClick={() => downloadFile(params.data.file)}
        >
          <GoArrowDown size={26} />
        </IconButton>
      </Tooltip>
      {params.data.canEdit ? (
        <Tooltip title="Delete">
          <IconButton size="small" aria-label="Delete" onClick={() => showConfirmBox(params.data)}>
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

  const CreatedByRenderer = (params) => <span>{displayDate(params.data?.createdByDate)}</span>;
  const UpdatedByRenderer = (params) => <span> {displayDate(params.data?.updatedAtDate)}</span>;

  const frameworkComponents = {
    nameRenderer: NameRenderer,
    referenceRenderer: ReferenceRenderer,
    commonRenderer: CommonRenderer,
    commonRendererWithCopy: CommonRendererWithCopy,
    createdByRenderer: CreatedByRenderer,
    updatedByRenderer: UpdatedByRenderer,
    actionsRenderer: ActionsRenderer
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
      deepFilter = `${deepFilter}&search=${search}`;
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
          let rows = data.map((u) => {
            const { createdBy, updatedBy, ...rest } = u;
            return {
              ...rest,
              fileUrl: u.fileUrl,
              canEdit: u.canEdit,
              createdByDate: u.createdBy.date ?? '',
              updatedByDate: u?.updatedBy?.date ?? ''
            };
          });
          dispatch({ type: 'initialize', data: rows, count: count });

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

  const handleChangeFilter = (value) => {
    setFilter(value);
  };

  const handleActivityOpen = (data) => {
    setOpen(true);
    setAttachmentData(data);
  };
  const handleClose = () => {
    setOpen(false);
    setAttachmentData(null);
  };
  const showConfirmBox = (row) => {
    if (row) {
      if (row && row.id) {
        setDeleteRecord(row);
      }
    }
    setIsConfirmDialogVisible(true);
  };

  const handleDeleteEmails = async () => {
    // .put('/email',
    //             { emails: deleteRecord?.id ? [deleteRecord.id] : selectedRecords.map(d => d._id) })
    setDeleteLoading(true);
    if (deleteRecord?.id || selectedRecords.length > 0)
      axiosInstance()
        .put('attachment/deletemany ', { ids: deleteRecord?.id ? [deleteRecord.id] : selectedRecords.map((d) => d._id) })
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
        <div className="header-panel">
          <Grid container className={styles.filter_side_container}>
            <Grid item xs={12} md={6} sm={12} className="d-flex align-items-center gap-1">
              <AiOutlinePaperClip className="headerLogo" /> <span className="listingHeader">{routes.attachment.title} </span>
              <Autocomplete
                options={resourceOptions}
                getOptionLabel={(option) => option}
                style={{ width: "200px" }}
                value={resource}
                onChange={(event, newValue) => {
                  setResource(newValue);
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
              {Boolean(resource) && resourceData && (
                <Autocomplete
                  disabled={loadingResources}
                  options={resourceData}
                  getOptionLabel={(option: any) => option.name}
                  getOptionSelected={(option: any, value: any) => option.name === value.name}
                  style={{ width: "200px" }}
                  value={selectedResourceData}
                  onChange={(event, newValue) => {
                    setSelectedResourceData(newValue);
                    if (newValue?.id) {
                      setFilter((prevState) => ([...prevState, { _id: newValue.id, type: camelCase(resource), name: newValue.name }]))
                    }
                    else {
                      setFilter([])
                    }
                  }}
                  size="small"
                  renderInput={(params) => <TextField {...params} label={`Select ${resource}`} variant="outlined" />}
                />
              )}
            </Grid>
            <Grid item xs={12} md={6} sm={12} className={styles.filter_side}>
              <Box component="div" className={isMobile ? styles.mobile_filter_side_header : styles.filter_side_header} style={{ width: '100%' }}>
                <Grid style={{ width: "90%", display: "flex" }}>
                  <SearchFilter
                    handleChangeFilter={handleChangeFilter}
                    filter={filter}
                    chip={{ size: 'small' }}
                    activityName="attachment"
                  />
                </Grid>


                <Grid style={{ display: "flex", gap: "5px" }}>
                  {<Button
                    variant={isMobile && !isTablet ? "text" : "contained"}
                    color="primary"
                    size="small"
                    onClick={() => setOpen(true)}
                    className={isMobile && !isTablet ? "mobile_button" : styles.add_submit_btn}
                    startIcon={isMobile && !isTablet ? null : <AddOutlined />}
                  >
                    {isMobile && !isTablet ? <MdAdd size={23} /> : "Add"}
                  </Button>
                  }
                  <Button
                    variant={isMobile && !isTablet ? "text" : "outlined"}
                    color="default"
                    size="small"
                    onClick={openActions}
                    aria-controls="action-menu"
                    disabled={selectedRecords.length > 0 ? false : true}
                    className={isMobile && !isTablet ? "mobile_button" : styles.action_submit_btn}
                  >
                    {isMobile && !isTablet ? "" : "Actions"} <ExpandMore />
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
                      disabled={!selectedRecords.some((records) => records.canEdit)}
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
        {
          isMobile && !isTablet ? <CustomSwipableList
            allowSelection={true}
            allowSwipe={true}
            permissions={permissions.attachment}
            primaryField={columns?.find(d => d.primaryField)}
            onClick={(data) => {
            }}
            dataRows={dataRows}
            selectedRecords={selectedRecords}
            dispatch={dispatch}
            onEdit={(data) => {
            }}
            additionalDetails={[

            ]}
            chips={[

            ]}
            extraParamsToCheckDelete={true}
            onDelete={(data) => {
              showConfirmBox(data);
            }}
            rowCount={rowCount}
            page={page}
            loading={loading}
            onCreate={false}
            showClone={false}
            onClone={() => { }}
            renderedFrom={"attachmentPage"} /> :
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
              actionWidth={150}
              loading={loading}
              renderedFrom="attachmentPage"
              refreshGrid={fetchAttachments}
            />
        }
        {open ? (
          <Dialog
            open={open}
            fullScreen={fullScreen || (isMobile || isTablet)}
            TransitionComponent={CustomDialogTransition}
            aria-labelledby="customized-dialog-title"
            maxWidth={'md'}
            onClose={() => {
              handleClose()
              setFullScreen(false);
            }}
            fullWidth
          >
            <ManageAttachment
              attachmentId={attachmentData?.id}
              relatedTo={[
                {
                  type: resource && selectedResourceData ? camelCase(resource) : "user",
                  referenceId: resource && selectedResourceData ? selectedResourceData.id : user?.user?._id,
                  access: true,
                },
              ]}
              handleClose={() => {
                handleClose()
                setFullScreen(false);
              }}
              attachmentData={attachmentData}
              fetchData={fetchAttachments}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen(prevState => !prevState)
              }}
              showManimizeMaximize={true}
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
            onOk={handleDeleteEmails}
          />
        ) : null}
      </CustomContainer>
    </Fragment>
  );
}
