import { useState, useEffect, useContext, Fragment } from 'react';
import { Box, IconButton, Menu, MenuItem } from '@mui/material';
import Grid from '@mui/material/Grid2';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import { CHILD_RESOURCE } from '../../../constants/helpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import AddIcon from '@mui/icons-material/Add';
import { KeyboardArrowDown } from '@mui/icons-material';
import { flattenArray } from 'src/constants/columns';
import AssignSerializedAssetDialog from 'src/components/AssignRolesDialog/AssignSerializedAssetDialog';
import MaterialDialog from './MaterialDialog';
import { calculateRowsField } from 'src/components/RentalManagment/helper';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import { fetch_child_resource_fields } from 'src/components/ChildResourceField';
import { FiExternalLink } from 'react-icons/fi';
import { ThemeButton } from 'src/components/Helpers/Buttons';

const Material = ({ jobData, renderedFrom, allowedToEdit, setNextStep }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();
  const [isUpdating, setUpdating] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [materialEdit, setMaterialEdit] = useState({ open: false, data: null, bulkedit: false, showSaveAndNext: false });
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [columns, setColumns] = useState(null);
  const [addDialog, setAddDialog] = useState({ open: false, type: '' });
  const [allFields, setAllFields] = useState([]);
  const [anchorActionEl, setAnchorActionEl] = useState(null);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const { dataRows, selectedRecords } = state;
  const { generateColumns } = useColumns();

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    var data = await fetch_child_resource_fields(CHILD_RESOURCE.jobDetail, jobData?.currency, allowedToEdit);
    setAllFields(JSON.parse(JSON.stringify(data)));
    const newColumns = generateColumns(renderedFrom, data, null, false, jobData?.currency);

    let coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 100,
        sticky: 'left',
        disableFilters: false,
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'detail',
        Header: 'Detail',
        minWidth: 300,
        disable: true,
        width: 300,
        Cell: ({ row, table }) => (
          <div className="flex items-center gap-2">
            <p
              onClick={() => {
                setMaterialEdit({
                  open: true,
                  data: row.original,
                  bulkedit: false,
                  showSaveAndNext: row?.index < table.getRowModel().rows?.filter((e) => e?.depth === 0)?.length - 1 && row?.depth === 0 ? true : false
                });
              }}
              className="link text-truncate"
              title={row.original?.detail}
            >
              {row.original?.detail}
            </p>
            <IconButton
              size="small"
              onClick={() => {
                window.open(`${routes.serializedAssetDetail.path}/${row.original.materialId}`);
              }}
            >
              <FiExternalLink size={16} className="-mt-[2px] text-gray-500 dark:text-gray-300" />
            </IconButton>
          </div>
        )
      }
    ];
    coloum = [...coloum, ...newColumns];
    coloum.push({
      accessor: 'action',
      Header: 'Actions',
      minWidth: 100,
      width: 100,
      sticky: 'right',
      disableFilters: true,
      disableSortBy: true,
      canDrag: false,
      Cell: ({ row, table }) => (
        <>
          <IconButton
            size="small"
            aria-label="Details"
            disabled={allowedToEdit ? false : true}
            onClick={() => {
              onMaterialEdit(row, table.getRowModel().rows);
            }}
          >
            <EditIcon fontSize="small" color={allowedToEdit ? 'primary' : 'disabled'} />
          </IconButton>
          {allowedToEdit && (
            <Grid container spacing={1}>
              <IconButton
                size="small"
                aria-label="Details"
                onClick={() => {
                  const obj: any = [{ id: row.original._id, type: row.original?.type, materialId: row.original?.materialId }];
                  setDeleteData(obj);
                }}
              >
                <DeleteIcon fontSize="small" color="error" />
              </IconButton>
            </Grid>
          )}
        </>
      )
    });
    setColumns(coloum);
    fetchJobData();
  };

  const fetchJobData = async () => {
    dispatch({ type: 'loading', loading: true });
    dispatch({ type: 'selection', selectedRecords: [] });

    setNextStep(false);
    var data: any = [];
    const response = await axiosInstance().get(`${routes.job.path}/material/${jobData._id}`);
    data = response?.data?.data;
    let rows = data?.material;
    rows?.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail = parent?.serializedAssetDetail?.assetNumber;
      parent.description = parent?.description;
      parent.qty = parent.qty;
    });
    if (rows?.length) {
      setNextStep(true);
    } else {
      setNextStep(false);
    }

    dispatch({ type: 'initialize', data: rows, count: rows?.length });
    dispatch({ type: 'loading', loading: false });
  };

  const openActions = (event) => {
    setAnchorActionEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorActionEl(null);
  };

  const handleAdd = async (rows) => {
    setIsAdding(true);
    const material: any = [];
    rows.forEach((d) => {
      const element: any = {};
      element.materialId = d._id;
      element.type = addDialog.type;
      element.unit = d?.unitMain && d?.unitMain?.length ? d.unitMain[0] : d?.unit ? d?.unit : 'Unit';
      element.qty = d.qty ? parseFloat(d.qty) : 1;
      material.push(element);
    });
    axiosInstance()
      .post(`${routes?.job?.path}/material/${jobData._id}`, { material })
      .then(({ data }) => {
        setAddDialog({ open: false, type: '' });
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchJobData();
        setIsAdding(false);
      })
      .catch((error) => {
        setAddDialog({ open: false, type: '' });
        setIsAdding(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleSaveData = async (rows: any, saveAndNext = false) => {
    setUpdating(true);
    axiosInstance()
      .put(`${routes.job.path}/material/${jobData._id}`, { material: rows })
      .then(({ data }) => {
        setUpdating(false);
        fetchJobData();
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        if (saveAndNext) {
          const rowIndex = dataRows.findIndex((d) => d._id === rows[0]?._id);
          setMaterialEdit({
            open: true,
            data: dataRows[rowIndex + 1],
            bulkedit: false,
            showSaveAndNext: rowIndex + 1 < dataRows?.length - 1 ? true : false
          });
        } else {
          setMaterialEdit({ open: false, data: null, bulkedit: false, showSaveAndNext: false });
        }
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = (rows) => {
    setDeleting(true);
    axiosInstance()
      .put(`${routes.job.path}/material/${jobData?._id}/delete`, { ids: rows })
      .then(() => {
        setDeleting(false);
        fetchJobData();
        setDeleteData(null);
      })
      .catch((error) => {
        setDeleting(false);
        toastConfig.setToastConfig(error);
        setDeleteData(null);
      });
  };
  const onMaterialEdit = (row, rows) => {
    setMaterialEdit({
      open: true,
      data: row.original,
      bulkedit: false,
      showSaveAndNext: row?.index < rows?.filter((e) => e?.depth === 0)?.length - 1 && row?.depth === 0 ? true : false
    });
  };

  const onSaveInlineEdit = async (inputField, updatedData) => {
    const rowData = flattenArray(dataRows)?.find((d) => d._id === updatedData._id);
    let rows: any = [{ ...rowData, ...updatedData }];
    rows = await calculateRowsField(flattenArray(dataRows), inputField, allFields, updatedData, jobData?.currency);
    handleSaveData(rows);
  };

  return (
    <Fragment>
      <Box display="flex" justifyContent="space-between" m={1}>
        <Box display="flex" alignItems="center">
          <ThemeButton
            mobileTooltip="Add"
            iconForMobile={<AddIcon />}
            onClick={() => setAddDialog({ open: true, type: 'serializedAsset' })}
            startIcon={<AddIcon />}
          >
            Add
          </ThemeButton>
        </Box>
        <Box display="flex">
          <HtmlTooltip title={Boolean(selectedRecords && selectedRecords.length) ? 'Bulk edit selected records' : 'Select records to edit'}>
            <span>
              <ThemeButton
                disabled={!Boolean(selectedRecords && selectedRecords.filter((e) => !e.hideSelection).length)}
                onClick={openActions}
                endIcon={<KeyboardArrowDown fontSize="small" />}
                mobileTooltip="Actions"
                buttonType="yellow"
              >
                Actions
              </ThemeButton>
            </span>
          </HtmlTooltip>
          <Menu
            anchorEl={anchorActionEl}
            keepMounted
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'left'
            }}
            open={Boolean(anchorActionEl)}
            onClose={closeActions}
          >
            <MenuItem
              onClick={() => {
                setMaterialEdit({ open: true, data: selectedRecords?.filter((e) => !e.hideSelection), bulkedit: true, showSaveAndNext: false });
                closeActions();
              }}
            >
              Bulk Edit
            </MenuItem>
            <MenuItem
              onClick={() => {
                const dataToDelete =
                  selectedRecords &&
                  selectedRecords
                    .filter((e) => !e.hideSelection)
                    .map((rec: any) => {
                      const obj: any = {};
                      obj.id = rec._id;
                      obj.type = rec?.type;
                      obj.materialId = rec?.materialId;
                      return obj;
                    });
                setDeleteData(dataToDelete);
                closeActions();
              }}
            >
              Delete
            </MenuItem>
          </Menu>
        </Box>
      </Box>
      {columns ? (
        <Box zIndex={5}>
          <CustomReactTable
            height={'calc(100vh - 395px)'}
            columns={columns}
            state={state}
            dispatch={dispatch}
            refreshGrid={fetchJobData}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            onSaveEdit={onSaveInlineEdit}
          />
        </Box>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
      {deleteData && (
        <ConfirmationDialog
          open={true}
          message={`Are you sure you want to delete the record(s)?`}
          onClose={() => setDeleteData(null)}
          onOk={() => handleDelete(deleteData)}
          okBtnLoading={isDeleting}
        />
      )}
      {materialEdit.open && (
        <MaterialDialog
          onClose={() => {
            setMaterialEdit({ open: false, data: null, bulkedit: false, showSaveAndNext: false });
          }}
          materialData={materialEdit.data}
          jobData={jobData}
          handleUpdate={handleSaveData}
          loadingEdit={isUpdating}
          bulkEdit={materialEdit.bulkedit}
          showSaveAndNext={materialEdit.showSaveAndNext}
        />
      )}
      {addDialog.open && addDialog.type === 'serializedAsset' && (
        <AssignSerializedAssetDialog
          reference={'job'}
          handleClose={() => {
            setAddDialog({ open: false, type: '' });
          }}
          ids={flattenArray(dataRows)
            ?.filter((e) => e.type === 'serializedAsset')
            ?.map((e) => e.materialId)}
          handleSucess={(rows) => {
            handleAdd(rows);
          }}
          isAssigning={isAdding}
        />
      )}
    </Fragment>
  );
};

export default Material;
