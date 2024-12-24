import { Chip, IconButton, MenuItem, MenuList, Popover, TextField } from '@mui/material';
import Box from '@mui/material/Box';
import Dialog from '@mui/material/Dialog';
import { AddOutlined, Delete as DeleteIcon } from '@mui/icons-material';
import GetAppIcon from '@mui/icons-material/GetApp';
import { Autocomplete } from '@mui/material';
import queryString from 'query-string';
import { useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory } from 'react-router-dom';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../../StateProvider/Provider';
import axiosInstance from '../../../axios/axiosInstance';
import ManageAttachment from '../../../components/Activity/Attachments/ManageAttachment';
import { get_activity_resource } from '../../../components/Activity/Helpers/utils';
import CustomBreadCrumbs from '../../../components/CustomBreadCrumbs';
import CustomContainer from '../../../components/CustomContainer';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import routes from '../../../components/Helpers/Routes';
import { CustomDialogTransition, displayDate, gridLoadingTimeout, isObjectEmpty, sidebarResource } from '../../../constants/helpers';

import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileOutlinedIcon from '@mui/icons-material/InsertDriveFileOutlined';
import SendIcon from '@mui/icons-material/Send';
import PreviewIcon from '@mui/icons-material/Visibility';
import axios, { CancelTokenSource } from 'axios';
import _ from 'lodash';
import mime from 'mime';
import { CreateEmail } from 'src/components/Activity/Email/CreateEmail';
import CustomReactTable, { gridFilterParser, useTableReducer } from 'src/components/CustomReactTable';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ImportExportLinks from 'src/components/Helpers/ImportExportLinks';
import { ListingPageHeader } from 'src/components/PageHeaders';
import { FiExternalLink } from 'react-icons/fi';

const renderedFrom = 'attachment_render';

export default function Attachment() {
  const history = useHistory();
  const parsed = queryString.parse(history.location.search);
  const { referenceType, referenceId } = parsed;

  const [filter, setFilter] = useState(null);
  const [open, setOpen] = useState({ open: false, type: null, parentFolder: null, parentResource: null });
  const [attachmentData, setAttachmentData] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [sendMail, setSendMail] = useState(false);
  const [isAttachmentLoading, setIsAttachmentLoading] = useState(true);
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions, resources }
  }: any = useData();
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [gridApi, setGridApi] = useState(null);
  const { state, dispatch } = useTableReducer({ renderedFrom });
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
                <div className="flex items-center gap-2" key={d.name}>
                  <p>{d.name}</p>
                  <IconButton size="small" onClick={() => redirectToResource(d?.type, d?.referenceId)}>
                    <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
                  </IconButton>
                  <Chip color="primary" label={`${resources[d?.type]?.titleSingular}`} />
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
      id: 'attachmentType',
      accessor: 'attachmentType',
      Header: 'Attachment Type',
      canDrag: false,
      disableFilters: true,
      Cell: ({ row }) => {
        return row.original?.attachmentType ? <p>{row.original.attachmentType}</p> : <NoDataCell />;
      }
    },
    {
      id: 'createdBy',
      accessor: 'createdBy',
      Header: 'Created By',
      canDrag: false,
      disableFilters: true,
      Cell: ({ row }) =>
        row.original?.createdBy ? (
          <p>
            {row.original?.createdBy?.user?.concatedName}
            <span className="hidden">&nbsp;-&nbsp;</span>
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
      canDrag: false,
      disableFilters: true,
      Cell: ({ row }) =>
        row.original?.updatedBy ? (
          <p>
            {row.original?.updatedBy?.user?.concatedName}
            <span className="hidden">&nbsp;-&nbsp;</span>
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
      disableSortBy: true,
      canDrag: false,
      Cell: ({ row }) => {
        const allPdf = _.every(row.original?.file, (d) => _.endsWith(d?.url, '.pdf'));
        return (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <HtmlTooltip title="Send Email">
              <IconButton
                size="small"
                onClick={() => {
                  setSendMail(true);
                  if (row.original.type === 'folder') {
                    handleMailForFolder(row.original?._id, row.original?.name);
                  } else {
                    handleMail(row.original);
                  }
                }}
              >
                <SendIcon color="primary" style={{ maxWidth: '18px' }} />
              </IconButton>
            </HtmlTooltip>
            <HtmlTooltip title="Download">
              <IconButton
                size="small"
                aria-label="Download"
                onClick={() => {
                  if (row.original.type === 'folder') {
                    downloadFolder(row.original?._id, row.original?.name);
                  } else {
                    downloadFile(row.original);
                  }
                }}
              >
                <GetAppIcon fontSize="small" color="primary" />
              </IconButton>
            </HtmlTooltip>
            {allPdf && row.original.type === 'file' && (
              <HtmlTooltip
                title="Preview"
                onClick={(e) => {
                  viewPdf(e, row.original);
                }}
              >
                <IconButton size="small">
                  <PreviewIcon fontSize="small" color="primary" />
                </IconButton>
              </HtmlTooltip>
            )}
            {row.original.canEdit ? (
              <HtmlTooltip title="Delete">
                <IconButton size="small" aria-label="Delete" onClick={() => showConfirmBox(row.original)}>
                  <DeleteIcon fontSize="small" color="error" />
                </IconButton>
              </HtmlTooltip>
            ) : (
              <HtmlTooltip className="cursor-stop" title="Signed Quote Attachment can not be deleted">
                <IconButton size="small" aria-label="Delete">
                  <DeleteIcon fontSize="small" color="disabled" />
                </IconButton>
              </HtmlTooltip>
            )}
          </div>
        );
      }
    }
  ];

  const downloadFolder = (_id, name) => {
    axiosInstance()
      .get(`attachment/zip/${_id}`, {
        responseType: 'blob'
      })
      .then(({ data }) => {
        const url = window.URL.createObjectURL(new Blob([data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `${name || 'folder'}.zip`);
        document.body.appendChild(link);
        link.click();
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  useEffect(() => {
    setResourceOptions(get_activity_resource(permissions, resources));
  }, []);

  useEffect(() => {
    if (referenceType) {
      axiosInstance()
        .get(`/activity/referenceName?referenceType=${referenceType}&referenceId=${referenceId}`)
        .then(({ data: { data } }) => {
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
    const cancelToken = axios.CancelToken.source();
    if (filter) fetchAttachments(cancelToken);
    return () => cancelToken.cancel();

    // eslint-disable-next-line react-hooks/exhaustive-deps
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
        .get(`user/download?fileName=${encodeURIComponent(file[0].url)}`, {
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
      const fileUrl = file.map((f) => encodeURIComponent(f.url));
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

  const handleMail = async (data) => {
    const attachments: any = [];
    try {
      await Promise.all(
        data?.file.map(async (file) => {
          try {
            const response = await axiosInstance().get(`user/download?fileName=${encodeURIComponent(file?.url)}`, { responseType: 'blob' });
            const data = response.data;

            let reader = new FileReader();
            reader.readAsDataURL(new Blob([data], { type: mime.getType(file.url.split('.')?.pop()) }));

            await new Promise<void>((resolve) => {
              reader.onloadend = function () {
                let base64data: any = reader.result;
                attachments.push({
                  base64: base64data.substring(base64data.indexOf(',') + 1),
                  contentType: base64data.split(';')[0].split(':')[1],
                  extension: `.${file.url.split('.')?.pop()}`,
                  name: file.name
                });
                resolve();
              };
            });
          } catch (err) {
            toastConfig.setToastConfig(err);
          }
        })
      );
      setEmailAttachment(attachments);
      setIsAttachmentLoading(false);
    } catch (err) {
      toastConfig.setToastConfig(err);
    }
  };

  const handleMailForFolder = (_id, name) => {
    axiosInstance()
      .get(`attachment/zip/${_id}`, { responseType: 'blob' })
      .then(({ data }) => {
        const zipfile = new Blob([data], { type: 'application/zip' });
        generateBase64forFile(zipfile, `${name || 'folder'}.zip`, '.zip');
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const generateBase64forFile = (blobData, fileName, extension) => {
    let reader = new FileReader();
    reader.readAsDataURL(blobData);
    reader.onloadend = function () {
      let base64data: any = reader.result;
      const attachments = [
        {
          base64: base64data.substring(parseInt(base64data.indexOf(',') + 1)),
          contentType: base64data.split(';')[0].split(':')[1],
          extension: extension,
          name: fileName
        }
      ];
      setEmailAttachment(attachments);
      setIsAttachmentLoading(false);
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
    file?.forEach((ele) => {
      setIsDownloading(true);
      axiosInstance()
        .get(`user/download?fileName=${encodeURIComponent(ele.url)}`, {
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
    });
  };

  const getQueryString = (isExport = false) => {
    let deepFilter = !isExport ? `&page=${page}&limit=${limit}` : '';

    const { deepFilters } = gridFilterParser(filters);
    if (deepFilters?.length) {
      deepFilter = `${deepFilter}&deepFilter=${encodeURIComponent(JSON.stringify(deepFilters))}`;
    }

    if (sorting.length > 0) {
      deepFilter = `${deepFilter}&sortBy=${sorting[0].colId}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURIComponent(search)}`;
    }
    return deepFilter;
  };

  const fetchAttachments = async (cancelTokenSource?: CancelTokenSource) => {
    const queryString = getQueryString();
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    let api = `/attachment?graphLookup=0&relatedTo=${JSON.stringify(filter)}${queryString}`;
    axiosInstance()
      .get(api, { cancelToken: cancelTokenSource?.token })
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
              canExpand: parent.type === 'folder',
              isChecked: false
            };
          });
          dispatch({ type: 'initialize', data: parentRows, count: count });
        }
      )
      .catch((error) => {
        toastConfig.setToastConfig(error);
        // dispatch({ type: 'error', error: true });
      })
      .finally(() => {
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

  const fetchChildAttachment = async (id) => {
    const attachment = await axiosInstance().get(`/attachment/child/${id}`);
    return attachment?.data?.data.map((d) => ({
      ...d,
      id: d._id,
      canEdit: d.type === 'folder' ? true : d?.canEdit,
      canExpand: d.type === 'folder'
    }));
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
    setShowDeleteConfirmBox(true);
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
          setShowDeleteConfirmBox(false);
          setDeleteLoading(false);
          if (deleteRecord) setDeleteRecord(null);
          fetchAttachments();
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
          setShowDeleteConfirmBox(false);
          setDeleteLoading(false);
        });
  };

  const ActionMenuItems = () => {
    return (
      <>
        <MenuItem
          disabled={permissions?.attachment?.isDelete ? !selectedRecords?.every((records) => records?.canEdit) : true}
          onClick={() => {
            showConfirmBox(null);
          }}
        >
          Delete
        </MenuItem>
      </>
    );
  };

  return (
    <section className="main-container-v1">
      <div className="headerbox-v1">
        <CustomBreadCrumbs routes={[{ title: resources?.attachment?.titlePlural }]} />
        <ImportExportLinks
          permissions={permissions?.attachment}
          module={resources?.attachment?.titlePlural}
          api={`/attachment`}
          afterImportCompleted={() => {}}
          total={rowCount}
          onlyExport={true}
          additionalParams={`&relatedTo=${JSON.stringify(filter)}${getQueryString(true)}`}
        />
      </div>
      <CustomContainer>
        {filter && (
          <ListingPageHeader
            leftSideContents={
              <LeftSideContents
                {...{
                  resourceOptions,
                  resource,
                  setResource,
                  setFilter,
                  resourceData,
                  loadingResources,
                  selectedResourceData,
                  setSelectedResourceData
                }}
              />
            }
            searchFilter={filter}
            handleSearchFilter={handleChangeFilter}
            isActionButtonVisible={true}
            actionButtonProps={{ disabled: selectedRecords.length > 0 ? false : true }}
            actionMenuItems={<ActionMenuItems />}
            addButtonOnclick={() => setOpen({ open: true, type: 'file', parentFolder: null, parentResource: null })}
            isAddButtonVisible={true}
          />
        )}

        <Box zIndex={5} width={'100%'}>
          {column ? (
            <CustomReactTable
              height={'calc(100vh - 300px)'}
              columns={column}
              onSelect={(newSelectedRecords) => {
                dispatch({ type: 'selection', selectedRecords: newSelectedRecords });
              }}
              dispatch={dispatch}
              state={state}
              expander={true}
              renderedFrom={renderedFrom}
              fetchChildAttachment={fetchChildAttachment}
              refreshGrid={fetchAttachments}
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
              setIsAttachmentLoading(true);
              setEmailAttachment(null);
            }}
            fullWidth
            disableEnforceFocus={true}
          >
            <CreateEmail
              emailId={null}
              // relatedTo={relatedTo}
              handleClose={() => {
                setSendMail(false);
                setFullScreen(false);
                setIsAttachmentLoading(true);
                setEmailAttachment(null);
              }}
              fetchData={() => {
                setSendMail(false);
                setFullScreen(false);
                setIsAttachmentLoading(true);
                setEmailAttachment(null);
              }}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              isMinimized={!fullScreen}
              showManimizeMaximize={true}
              qouteBuilderAttachments={emailAttachment}
              isQuoteBuilder={true}
              isAttachmentLoading={isAttachmentLoading}
            />
          </Dialog>
        )}
        {showDeleteConfirmBox ? (
          <ConfirmationDialog
            open={showDeleteConfirmBox}
            message={`Are you sure you want to delete this attachment(s)?`}
            onClose={() => {
              if (deleteRecord) setDeleteRecord(null);
              setShowDeleteConfirmBox(false);
            }}
            okBtnLoading={deleteLoading}
            onOk={handleDelete}
          />
        ) : null}
      </CustomContainer>
    </section>
  );
}

const LeftSideContents = ({
  resourceOptions,
  resource,
  setResource,
  setFilter,
  resourceData,
  loadingResources,
  selectedResourceData,
  setSelectedResourceData
}) => {
  return (
    <>
      <Autocomplete
        limitTags={1}
        options={resourceOptions || []}
        getOptionLabel={(option) => option.optionLabel || ''}
        className={`flex-grow sm:min-w-[200px] sm:max-w-[250px]`}
        fullWidth
        value={resource}
        onChange={(event, newValue) => {
          setResource(newValue);
          if (newValue) {
            //setFilter((prevState) => [...prevState, { type: newValue?.optionValue, name: newValue?.optionLabel, isAll: true }]);
          } else {
            setFilter([]);
          }
        }}
        size="small"
        renderInput={(params) => (
          <TextField
            {...params}
            fullWidth
            className="flex-grow md:max-w-[250px]"
            margin="none"
            size="small"
            label="Select Resource"
            variant="outlined"
          />
        )}
      />
      {resource && resourceData && (
        <Autocomplete
          limitTags={1}
          disabled={loadingResources}
          options={resourceData || []}
          className={`flex-grow sm:min-w-[250px] sm:max-w-[270px]`}
          getOptionLabel={(option: any) => option.optionLabel || ''}
          getOptionSelected={(option: any, value: any) => option.optionLabel === value.optionLabel}
          value={selectedResourceData}
          onChange={(event, newValue) => {
            setSelectedResourceData(newValue);
            if (newValue?.optionValue) {
              setFilter((prevState) => [...prevState, { _id: newValue.optionValue, type: resource.optionValue, name: newValue.optionLabel }]);
            } else {
              setFilter([]);
            }
          }}
          size="small"
          renderInput={(params) => (
            <TextField
              {...params}
              fullWidth
              className={`flex-grow sm:min-w-[250px] sm:max-w-[270px]`}
              margin="none"
              size="small"
              label={`Select ${resource.optionLabel}`}
              variant="outlined"
            />
          )}
        />
      )}
    </>
  );
};
