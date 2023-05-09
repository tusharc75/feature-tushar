import { Box, Button, Grid, IconButton, Menu, MenuItem, Paper, Tooltip, Typography } from '@material-ui/core';
import { Fragment, useContext, useEffect, useReducer, useState } from 'react';
import CustomBreadCrumbs from 'src/components/CustomBreadCrumbs';
import routes from 'src/components/Helpers/Routes';
import { useData } from 'src/StateProvider/Provider';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { AddOutlined, ExpandMore } from '@material-ui/icons';
import { gridLoadingTimeout, isObjectEmpty, prepareDataForGrid, removeLocalStorage, serviceMaster, sidebarResource } from 'src/constants/helpers';
import { camelCase } from 'lodash';
import DeleteIcon from '@material-ui/icons/Delete';
import { Link } from 'react-router-dom';
import FileCopyIcon from '@material-ui/icons/FileCopy';
import { getFrameworkComponents, getStaticFields } from 'src/constants/useColumns';
import CustomAgGrid, { intialState, reducer } from 'src/components/AgGridComponents/CustomAgGrid';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import useColumns from 'src/constants/useColumns';
import ManageFieldTicket from 'src/pages/FieldTicket/ManageFieldTicket';

const FieldTicket = ({ selectedFieldService }) => {
  const renderedFrom = camelCase(`${routes.fieldTicket?.title}`);
  const localStorageSelectedRecords = `${renderedFrom}_selected`;

  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions, selectedEntity, user }
  }: any = useData();

  const { getColumnData } = useColumns();

  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const [columns, setColumns] = useState([]);
  const [state, dispatch] = useReducer(reducer, intialState);
  const [deleteRecord, setDeleteRecord] = useState(null);
  const [gridApi, setGridApi] = useState(null);
  const [open, setOpen] = useState({ open: false, isClone: false });
  const [fieldTicketId, setFieldTicketId] = useState(null);
  const [showDeleteConfirmBox, setShowDeleteConfirmBox] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords, appendRows, showFilteredRecordsOnly } =
    state;

  useEffect(() => {
    fetchGridColumns();
  }, []);

  useEffect(() => {
    fetchData();
  }, [page, limit, filters, sorting, search, selectedEntity, showFilteredRecordsOnly, selectedFieldService]);

  const fetchGridColumns = () => {
    axiosInstance()
      .get(`/field?resource=${sidebarResource?.fieldTicket}`)
      .then(({ data: { data } }) => {
        let columns = [];
        let rendererNames = [];
        data.forEach((o) => {
          let currentColumn = getColumnData(renderedFrom, o?.fieldData, routes.fieldTicketDetail.path);
          if (currentColumn !== null) {
            columns = [...columns, currentColumn?.columnData];
            if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
              rendererNames.push(currentColumn?.rendererName);
            }
          }
        });
        let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
        tempFrameworkComponent = {
          ...tempFrameworkComponent,
          actionsRenderer: ActionsRenderer
        };
        setFrameWorkComponent({ ...tempFrameworkComponent });
        columns = [...columns, ...getStaticFields()];
        setColumns([...columns]);
      });
  };

  const fetchData = () => {
    dispatch({ type: 'loading', loading: true });
    const queryString = getQueryString();
    if (gridApi) {
      gridApi.setRowData([]);
    }
    axiosInstance()
      .get(`${routes?.fieldTicket.path}${queryString}`)
      .then(({ data: { data, count } }) => {
        let rows = data?.map((u: any) => {
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

    const filterById = [];
    filterById.push({ field: 'serviceOrder', term: selectedFieldService._id });
    filterById.push({ field: 'service', term: selectedFieldService?.service._id });
    filterById.push({ field: 'technician', term: selectedFieldService?.technicianAssign?.technician });
    deepFilter = deepFilter + '&filterById=' + JSON.stringify(filterById) + '&filterType=and';

    if (!isObjectEmpty(filters)) {
      const updatedFilters = [];
      Object.keys(filters).forEach((field) => {
        updatedFilters.push({
          field: replaceFieldName(field),
          term: filters[field].filter
        });
      });
      deepFilter = `${deepFilter}&deepFilter=${encodeURI(JSON.stringify(updatedFilters))}`;
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
        fetchData();
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

  return (
    <>
      <Box p={2} pt={0}>
        <Box display="flex" justifyContent="flex-end" mb={2}>
          <Box display="flex" flexWrap={'wrap'}>
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
              {`Create ${routes.fieldTicket.title}`}
            </Button>
          </Box>
          <Box display="flex" ml={1}>
            {permissions?.fieldServiceTechnician?.isDelete && (
              <>
                <Button
                  variant={'contained'}
                  color="default"
                  size="small"
                  onClick={openActions}
                  disabled={selectedRecords.length ? false : true}
                  aria-controls="action-menu"
                  style={{ marginLeft: '0.4rem' }}
                  endIcon={<ExpandMore />}
                >
                  {'Actions'}
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
          </Box>
        </Box>
        {Object.keys(frameWorkComponent).length > 0 && (
          <Box pt={2}>
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
              refreshGrid={fetchData}
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
            fetchData();
          }}
          referenceData={{
            serviceOrder: selectedFieldService._id,
            service: selectedFieldService?.service._id,
            startDateTime: selectedFieldService?.estimateStartDate,
            endDateTime: selectedFieldService?.estimateEndDate,
            technician: selectedFieldService?.technicianAssign?.technician,
            steps:
              selectedFieldService?.service?.steps?.map((m) => {
                return {
                  optionLabel: m?.stepName,
                  optionValue: m?._id
                };
              }) || []
          }}
          fullScreenView={true}
        />
      )}
    </>
  );
};

export default FieldTicket;
