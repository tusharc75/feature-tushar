import { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import { CHILD_RESOURCE } from '../../../constants/helpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import DeleteIcon from '@material-ui/icons/Delete';
import AddIcon from '@material-ui/icons/Add';
import { isMobile } from 'react-device-detect';
import { KeyboardArrowDown } from '@material-ui/icons';
import { startCase } from 'lodash';
import { flattenArray, generateCustomTableColumns } from 'src/constants/columns';
import AssignSerializedAssetDialog from 'src/components/AssignRolesDialog/AssignSerializedAssetDialog';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import MaterialDialog from './MaterialDialog';
import { calculateRowsFieldNew } from 'src/components/RentalManagment/helper';
import { CURReplaceByCurrencySingle } from 'src/constants/formulaUtility';

const Material = ({ jobData, renderedFrom, allowedToEdit, setNextStep }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();
  const [isUpdating, setUpdating] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [isAdding, setIsAdding] = useState(false);
  const [materialEdit, setMaterialEdit] = useState({ open: false, data: null, bulkedit: false, showSaveAndNext: false });
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [columns, setColumns] = useState(null);
  const [addDialog, setAddDialog] = useState({ open: false, type: '' });
  const [rowsData, setRowsData] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [anchorActionEl, setAnchorActionEl] = useState(null);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    const response = await axiosInstance().get(`/field/child?resource=${CHILD_RESOURCE.jobDetail}`);
    var data = response?.data?.data;
    data = CURReplaceByCurrencySingle(data, jobData?.currency);
    setAllFields(JSON.parse(JSON.stringify(data)));
    const newColumns = generateCustomTableColumns(data, jobData?.currency, renderedFrom);

    let coloum: any = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>,
        Footer: () => {
          return <>Total</>;
        }
      },
      {
        accessor: 'detail',
        Header: 'Detail',
        minWidth: 300,
        width: 300,
        Cell: ({ row, rows }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p
              onClick={() => {
                setMaterialEdit({
                  open: true,
                  data: row.original,
                  bulkedit: false,
                  showSaveAndNext: row?.index < rows?.filter((e) => e?.depth === 0)?.length - 1 && row?.depth === 0 ? true : false
                });
              }}
              className="link text-truncate"
              title={row.original?.detail}
            >
              {row.original?.detail}
            </p>
            <Box ml={1}>
              <IconButton
                size="small"
                onClick={() => {
                  window.open(`${routes.serializedAssetDetail.path}/${row.original.materialId}`);
                }}
              >
                <OpenInNewIcon fontSize="small" color="primary" />
              </IconButton>
            </Box>
          </div>
        )
      }
    ];
    coloum = [...coloum, ...newColumns];
    coloum.push({
      accessor: 'action',
      Header: 'Action',
      minWidth: 100,
      width: 100,
      sticky: 'right',
      disableFilters: true,
      canDrag: false,
      Cell: ({ row }) =>
        allowedToEdit && (
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
        )
    });
    setColumns(coloum);
    fetchJobData();
  };

  const fetchJobData = async () => {
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
    setRowsData(rows);
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
          const rowIndex = rowsData.findIndex((d) => d._id === rows[0]?._id);
          setMaterialEdit({
            open: true,
            data: rowsData[rowIndex + 1],
            bulkedit: false,
            showSaveAndNext: rowIndex + 1 < rowsData?.length - 1 ? true : false
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

  const onSaveInlineEdit = async (inputField, updatedData) => {
    const rowData = flattenArray(rowsData)?.find((d) => d._id === updatedData._id);
    let rows: any = [{ ...rowData, ...updatedData }];
    rows = await calculateRowsFieldNew(flattenArray(rowsData), inputField, allFields, updatedData);
    handleSaveData(rows);
  };

  return (
    <Fragment>
      <Box display="flex" justifyContent="space-between" m={1}>
        <Box display="flex" alignItems="center">
          <Button variant="outlined" size="small" onClick={() => setAddDialog({ open: true, type: 'serializedAsset' })} startIcon={<AddIcon />} color="primary">
            Add
          </Button>
        </Box>
        <Box display="flex">
          <HtmlTooltip title={Boolean(selectedRecords && selectedRecords.length) ? 'Bulk edit selected records' : 'Select records to edit'}>
            <span>
              <Button
                variant="outlined"
                color="primary"
                size="small"
                disabled={!Boolean(selectedRecords && selectedRecords.filter((e) => !e.hideSelection).length)}
                onClick={openActions}
                endIcon={<KeyboardArrowDown fontSize="small" />}
                className="new-dropdown-v1"
              >
                Actions
              </Button>
            </span>
          </HtmlTooltip>
          <Menu
            anchorEl={anchorActionEl}
            keepMounted
            getContentAnchorEl={null}
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
      {columns && rowsData ? (
        <Box zIndex={5}>
          <CustomReactTable
            height={'calc(100vh - 395px)'}
            columns={columns}
            data={rowsData}
            setWholeRowsCellColor={(rowData) => (!rowData.isValid ? '' : '')}
            onSelect={setSelectedRecords}
            childrenProperty="subRows"
            uniqueKey="_id"
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            hideExpander={true}
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
          ids={flattenArray(rowsData)
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
