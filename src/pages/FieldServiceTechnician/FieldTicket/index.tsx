import { Box, Button, Grid, IconButton, Menu, MenuItem, Paper, Tooltip, Typography } from '@material-ui/core';
import { Fragment, useContext, useEffect, useReducer, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import { useData } from 'src/StateProvider/Provider';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import { gridLoadingTimeout, isObjectEmpty, prepareDataForGrid, removeLocalStorage, sidebarResource } from 'src/constants/helpers';
import { camelCase } from 'lodash';
import DeleteIcon from '@material-ui/icons/Delete';
import { Link } from 'react-router-dom';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { getColumnData, getFrameworkComponents, getStaticFields } from 'src/constants/columns';
import { DateTimeRenderer } from 'src/components/AgGridComponents/CustomAgGridCellRenderers';
import CustomAgGrid, { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';
import ManageFieldTicket from 'src/pages/FieldTicket/ManageFieldTicket';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';

const FieldTicket = ({ selectedFieldService }) => {
  const renderedFrom = camelCase(routes?.fieldServiceTechnician.title);
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions, selectedEntity, user }
  }: any = useData();
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const [columns, setColumns] = useState([]);
  const [state, dispatch] = useReducer(reducer, intialState);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [gridApi, setGridApi] = useState(null);
  const [open, setOpen] = useState({ open: false, isClone: false });
  const localStorageSelectedRecords = `${renderedFrom}_selected`;
  const [fieldTicketId, setFieldTicketId] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
    state;

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource?.fieldTicket}`)
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          if (o?.fieldData?.primaryField === true) {
            columns = [
              ...columns,
              {
                field: o?.fieldData?.fieldName,
                headerName: o?.fieldData?.fieldLabel,
                show: true,
                disabled: true,
                cellRenderer: 'nameRenderer',
                primaryField: true
              }
            ];
          } else if (o?.fieldData?.fieldName === 'startDateTime' || o?.fieldData?.fieldName === 'endDateTime') {
            columns = [
              ...columns,
              {
                field: o?.fieldData?.fieldName,
                headerName: o?.fieldData?.fieldLabel,
                cellRenderer: 'dateTimeRenderer',
                disabled: false,
                show: true
              }
            ];
          } else {
            let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.fieldServiceTechnician.path);

            if (currentColumn !== null) {
              columns = [...columns, currentColumn?.columnData];
              if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
                rendererNames.push(currentColumn?.rendererName);
              }
            }
          }
        });
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        tempFrameworkComponent = {
          ...tempFrameworkComponent,
          nameRenderer: NameRenderer,
          actionsRenderer: ActionsRenderer,
          dateTimeRenderer: DateTimeRenderer
        };
        setFrameWorkComponent({ ...tempFrameworkComponent });
        columns = [...columns, ...getStaticFields()];
        setColumns([...columns]);
      });
  };

  const fetchFieldTicketData = () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();

    if (gridApi) {
      gridApi.setRowData([]);
    }
    axiosInstance()
      .get(`${routes?.fieldTicket.path}${queryString}`)
      .then(({ data: { data } }) => {
        let count = data?.count;
        let filteredData = data?.data.filter((i) => {
          if  (i.serviceOrder?.optionValue === selectedFieldService?._id && i.service.optionValue === selectedFieldService?.service?._id){
            return i;
          }
        });
        let rows = filteredData?.map((u: any) => {
          let finalObject: any = prepareDataForGrid(u);
          finalObject['canDelete'] = permissions?.fieldServiceTechnician?.isDelete;
          finalObject['isChecked'] = selectedRecords?.some((s) => s._id === u._id);
          finalObject['allowedToEdit'] = permissions?.fieldServiceTechnician?.isUpdate;

          return {
            ...finalObject
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
        dispatch({ type: 'initialize', data: rows, count: count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
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

  const getQueryString = (isExport = false) => {
    let deepFilter = !isExport ? `?page=${page}&limit=${limit}` : '?';
    if (selectedEntity) {
      deepFilter = `${deepFilter}&entity=${selectedEntity}`;
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
      deepFilter = `${deepFilter}&sortBy=${replaceFieldName(sorting[0].colId)}&orderBy=${sorting[0].sort}`;
    }

    if (search) {
      deepFilter = `${deepFilter}&search=${encodeURI(search)}`;
    }
    if (showFilteredRecordsOnly) {
      const savedRecords = localStorage.getItem(localStorageSelectedRecords) ? JSON.parse(localStorage.getItem(localStorageSelectedRecords)) : [];
      deepFilter = `${deepFilter}&getById=${JSON.stringify(savedRecords.map((m) => m._id))}`;
    }
    return deepFilter;
  };

  const handleDelete = () => {
    let ids = [];
    if (deleteRecord) {
      ids.push(deleteRecord._id);
    } else {
      ids = selectedRecords.map((m) => m._id);
    }
    axiosInstance()
      .put(`${routes?.fieldTicket?.path}/remove`, { ids: ids })
      .then(({ data }) => {
        removeLocalStorage(localStorageSelectedRecords);
        fetchFieldTicketData();
        setShowDeleteConfirmBox(false);
        setDeleteRecord(null);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data?.message
        });
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const NameRenderer = (params) => {
    return (
      <span className=" d-flex gap-2 align-items-center">
        <Link className="link" to={`${routes.fieldTicketDetail.path}/${params.data._id}`}>
          {params.value}
        </Link>
      </span>
    );
  };

  const ActionsRenderer = (params) => (
    <Fragment>
      {permissions?.fieldServiceTechnician?.isCreate ? (
        <Tooltip title="Clone">
          <IconButton
            size="small"
            aria-label="Clone"
            onClick={() => {
              setFieldTicketId(params.data.id);
              setOpen({ open: true, isClone: true });
            }}
          >
            <FileCopyIcon fontSize="small" color="primary" />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip className="cursor-stop" title="You do not have permission to clone/create">
          <IconButton aria-label="Clone" size="small">
            <FileCopyIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}

      {params?.data?.canDelete ? (
        <Tooltip title="Delete">
          <IconButton
            aria-label="Delete"
            onClick={() => {
              setDeleteRecord(params.data);
              setShowDeleteConfirmBox(true);
            }}
          >
            <DeleteIcon fontSize="small" color="error" />
          </IconButton>
        </Tooltip>
      ) : (
        <Tooltip className="cursor-stop" title="You do not have permission to delete">
          <IconButton aria-label="Delete" size="small">
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Fragment>
  );

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchFieldTicketData();
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly, selectedFieldService]);


  return (
    <Box className="main-container-v1">
      <Box p={2}>
        <Grid container style={{ display: 'flex' }}>
          <Grid xs={12} md={6} sm={12}></Grid>
          <Grid style={{ display: 'flex', justifyContent: 'flex-end' }} xs={12} md={6} sm={12}>
            <Button
              onClick={() => {
                setFieldTicketId(null);
                setOpen({ open: true, isClone: false });
              }}
              variant={'contained'}
              size="small"
              color="primary"
              startIcon={<AddOutlined />}
            >
              {'Add'}
            </Button>

            {permissions?.fieldServiceTechnician?.isDelete && (
              <>
                <Button
                  variant={'contained'}
                  color="default"
                  size="small"
                  onClick={openActions}
                  disabled={selectedRecords.length ? false : true}
                  aria-controls="action-menu"
                  style={{marginLeft:'0.4rem'}}
                >
                  {'Actions'} <ExpandMore />
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
                    disabled={
                      !((selectedRecords?.length > 0 && selectedRecords?.filter((e) => e?.canDelete === true)?.length) === selectedRecords?.length)
                    }
                    onClick={() => {
                      closeActions();
                      // eslint-disable-next-line no-lone-blocks
                      {
                        selectedRecords.length === 1 && setDeleteRecord(selectedRecords[0]);
                      }
                      setShowDeleteConfirmBox(true);
                    }}
                  >
                    Delete
                  </MenuItem>
                </Menu>
              </>
            )}
          </Grid>
        </Grid>
        {Object.keys(frameWorkComponent).length > 0 && (
          <Box py={2}>
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
              allowAction={true}
              loading={loading}
              renderedFrom={renderedFrom}
              refreshGrid={fetchFieldTicketData}
              showOnlyShowFilteredRecordSwitch={true}
            />
          </Box>
        )}
      </Box>
      {showDeleteConfirmBox && (
        <ConfirmationDialog
          open={showDeleteConfirmBox}
          message={`Are you sure you want to delete Field Ticket  ${deleteRecord?.fieldTicketNumber || ''} ?`}
          onClose={() => {
            setDeleteRecord(null);
            setShowDeleteConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {open?.open && (
        <ManageFieldTicket
          id={fieldTicketId}
          isClone={open?.isClone}
          onClose={() => setOpen({ open: false, isClone: false })}
          onSuccess={() => {
            setOpen({ open: false, isClone: false });
            fetchFieldTicketData();
          }}
          referenceData={{
            serviceOrder: selectedFieldService._id,
            service: selectedFieldService?.service._id,
            startDateTime: selectedFieldService?.estimateStartDate,
            endDateTime: selectedFieldService?.estimateEndDate,
            owner: selectedFieldService?.technicianAssign?.technician
          }}
        />
      )}
    </Box>
  );
};

export default FieldTicket;
