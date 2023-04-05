import { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, IconButton, MenuItem, Menu } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import Add from '@material-ui/icons/Add';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import DeleteIcon from '@material-ui/icons/Delete';
import { isMobile } from 'react-device-detect';
import { ExpandMore } from '@material-ui/icons';
import { startCase } from 'lodash';
import { calculateRowsField } from 'src/components/RentalManagment/helper';
import MaterialDialog from './MaterialDialog';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import AssignPackageDialog from 'src/components/AssignRolesDialog/AssignPackageDialog';
import { flattenArray, genrateCustomTableColumns } from 'src/constants/columns';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';

const Material = ({ salesOrderData, renderedFrom, allowedToEdit }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();

  const [isUpdating, setUpdating] = useState(false);
  const [materialEdit, setMaterialEdit] = useState({ open: false, data: null, bulkedit: false, showSaveAndNext: false });
  const [addDialog, setAddDialog] = useState({ open: false, type: '', parentId: null });
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [addAnchorEl, setAddAnchorEl] = useState(null);

  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    var data = fieldsToShow || [];
    setAllFields(JSON.parse(JSON.stringify(data)));
    const newColumns = genrateCustomTableColumns(data, '', '');
    let qtyIndex = newColumns.findIndex((d) => d.accessor === 'qty');
    if (qtyIndex > -1) {
      newColumns[qtyIndex].accessor = 'qtyDisplay';
    }
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
        accessor: 'type',
        Header: 'Type',
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <p>{`${startCase(row.original?.type)} `}</p>
          </div>
        )
      },
      {
        accessor: 'detail',
        Header: 'Detail',
        minWidth: 300,
        width: 300,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row, rows }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {allowedToEdit ? (
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
            ) : (
              <p className="text-truncate">{row.original?.detail}</p>
            )}
            {allowedToEdit && (
              <>
                <Box ml={1}>
                  <span>({row.original?.subRows?.length})</span>
                </Box>
                <Box ml={1}>
                  <HtmlTooltip title="Add Product">
                    <IconButton
                      onClick={() => {
                        setAddDialog({ open: true, type: 'product', parentId: row.original?._id });
                      }}
                      size="small"
                    >
                      <Add fontSize="small" color="primary" />
                    </IconButton>
                  </HtmlTooltip>
                </Box>
              </>
            )}
            <Box ml={1}>
              <IconButton
                size="small"
                onClick={() => {
                  if (row.original.type === 'product') {
                    window.open(`${routes.productDetail.path}/${row.original.materialId}`);
                  } else {
                    window.open(`${routes.packagesDetail.path}/${row.original.materialId}`);
                  }
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
        !row.original.hideSelection && (
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
    fetchData();
  };

  const fetchData = async () => {
    var data: any = [];
    const response = await axiosInstance().get(`${routes.demandOrder.path}/material/${salesOrderData._id}`);
    data = response?.data?.data;
    let rows = data.material.filter((e) => e.parentId === null);
    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail = parent.type === 'product' ? parent.productDetail?.productName : parent.packageDetail?.packageName;

      parent.description = parent.type === 'product' ? parent?.productDetail?.productDescription : parent?.packageDetail?.packageDescription;

      parent.qty = parent.qty;
      parent.qtyDisplay = parent.qty;
      parent.subRows = generateNestedData(data.material, parent);
    });
    setRowsData(rows);
    setSelectedRecords([]);
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    subRows.forEach((_subRow, index) => {
      _subRow.index = parent.index + '.' + `${index + 1}`;
      _subRow.detail = _subRow.type === 'product' ? _subRow.productDetail?.productName : _subRow.packageDetail?.packageName;
      _subRow.description = _subRow.type === 'product' ? _subRow?.productDetail?.productDescription : _subRow?.packageDetail?.packageDescription;
      _subRow.qty = _subRow.qty;
      _subRow.qtyDisplay = parent.qtyDisplay * _subRow.qty;
      _subRow.subRows = generateNestedData(material, _subRow);
    });
    return subRows;
  };

  const handleAdd = async (rows) => {
    const material: any = [];
    rows.forEach((d) => {
      const element: any = {};
      element.materialId = d._id;
      element.type = addDialog.type;
      element.unit = d?.unitMain && d?.unitMain?.length ? d.unitMain[0] : d?.unit ? d?.unit : '';
      element.qty = d.qty ? parseFloat(d.qty) : 1;
      element.parentId = addDialog.parentId;
      material.push(element);
    });
    axiosInstance()
      .post(`${routes?.demandOrder?.path}/material/${salesOrderData._id}`, { material })
      .then(({ data }) => {
        setAddDialog({ open: false, type: '', parentId: null });
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchData();
      })
      .catch((error) => {
        setAddDialog({ open: false, type: '', parentId: null });
        toastConfig.setToastConfig(error);
      });
  };

  const handleSaveData = async (rows: any, saveAndNext = false) => {
    setUpdating(true);
    rows.forEach((element) => {
      delete element.index;
      delete element.detail;
      delete element.qtyDisplay;
      delete element.isValid;
      delete element.hideSelection;
      delete element.productDetail;
      delete element.packageDetail;
      delete element.subRows;
    });
    axiosInstance()
      .put(`${routes.demandOrder.path}/material/${salesOrderData._id}`, { material: rows })
      .then(({ data }) => {
        setUpdating(false);
        fetchData();
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

  const onSaveInlineEdit = async (inputField, updatedData) => {
    const rowData = flattenArray(rowsData)?.find((d) => d._id === updatedData._id);
    if (inputField.hasOwnProperty('qtyDisplay')) {
      inputField['qty'] = inputField['qtyDisplay'];
    }
    let rows: any = [{ ...rowData, ...updatedData }];
    rows = await calculateRowsField(flattenArray(rowsData), inputField, allFields, updatedData);
    handleSaveData(rows);
  };

  const handleDelete = (rows) => {
    setDeleting(true);
    axiosInstance()
      .put(`${routes.demandOrder.path}/material/${salesOrderData?._id}/delete`, { ids: rows })
      .then(({ data }) => {
        setDeleting(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: data.message
        });
        fetchData();
        setDeleteData(null);
      })
      .catch((error) => {
        setDeleting(false);
        toastConfig.setToastConfig(error);
        setDeleteData(null);
      });
  };

  const openActions = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorEl(null);
  };

  const openAddActions = (event) => {
    setAddAnchorEl(event.currentTarget);
  };

  const closeAddActions = () => {
    setAddAnchorEl(null);
  };

  return (
    <Fragment>
      {allowedToEdit && (
        <Box display="flex" justifyContent="space-between" m={1}>
          <Box display="flex" alignItems="center">
            <Button variant={'outlined'} color="primary" size="small" startIcon={<Add />} onClick={openAddActions} aria-controls="add-menu">
              {'Add'}
              <ExpandMore fontSize="small" />
            </Button>
            <Menu
              anchorEl={addAnchorEl}
              keepMounted
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left'
              }}
              id="add-menu"
              open={Boolean(addAnchorEl)}
              onClose={closeAddActions}
            >
              <MenuItem
                onClick={() => {
                  closeAddActions();
                  setAddDialog({ open: true, type: 'product', parentId: null });
                }}
              >
                Add Products
              </MenuItem>
              <MenuItem
                onClick={() => {
                  closeAddActions();
                  setAddDialog({ open: true, type: 'package', parentId: null });
                }}
              >
                Add Packages
              </MenuItem>
            </Menu>
          </Box>
          <Box display="flex">
            <Button
              disabled={selectedRecords?.filter((e) => !e.hideSelection)?.length > 0 ? false : true}
              variant={isMobile ? 'text' : 'outlined'}
              color="default"
              size="small"
              onClick={openActions}
              aria-controls="action-menu"
              endIcon={<ExpandMore />}
            >
              {isMobile ? '' : 'Actions'}
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
                onClick={() => {
                  closeActions();
                  setMaterialEdit({ open: true, data: selectedRecords?.filter((e) => !e.hideSelection), bulkedit: true, showSaveAndNext: false });
                }}
              >
                Bulk Edit
              </MenuItem>
              <MenuItem
                onClick={() => {
                  const dataToDelete = selectedRecords
                    ?.filter((e) => !e.hideSelection)
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
      )}
      {columns && rowsData ? (
        <>
          <Box p="6px" zIndex={5} width={'100%'}>
            <CustomReactTable
              height={'calc(100vh - 345px)'}
              columns={columns}
              data={rowsData}
              setWholeRowsCellColor={(rowData) => (!rowData.isValid ? '' : '')}
              onSelect={setSelectedRecords}
              childrenProperty="subRows"
              uniqueKey="_id"
              renderedFrom={renderedFrom}
              isClientSideGrid={true}
              onSaveEdit={onSaveInlineEdit}
              hideSelection={!allowedToEdit}
              hideAction={!allowedToEdit}
            />
          </Box>
        </>
      ) : (
        <Box p={2} height={500} bgcolor="white">
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
          salesOrderData={salesOrderData}
          handleUpdate={handleSaveData}
          loadingEdit={isUpdating}
          bulkEdit={materialEdit.bulkedit}
          showSaveAndNext={materialEdit.showSaveAndNext}
        />
      )}
      {addDialog.open && addDialog.type === 'product' && (
        <AssignProductDialog
          reference="demandOrder"
          serialized={null}
          productsDialogOpen={addDialog.open}
          productId={null}
          handleCloseDialog={() => setAddDialog({ open: false, type: '', parentId: null })}
          assignedProducts={[]}
          renderedFrom={renderedFrom}
          onSuccess={(d) => {
            handleAdd(d);
          }}
        />
      )}
      {addDialog.open && addDialog.type === 'package' && (
        <AssignPackageDialog
          referenceType="demandOrder"
          handleClose={() => setAddDialog({ open: false, type: '', parentId: null })}
          ids={[]}
          onSuccess={(rows) => {
            handleAdd(rows);
          }}
          packageType={null}
        />
      )}
    </Fragment>
  );
};

const fieldsToShow = [
  {
    _id: '630dbe1e9ec41861052354a3',
    fieldLabel: 'Qty',
    type: 'decimal',
    option: [],
    required: false,
    isTooltip: false,
    tooltipMessage: '',
    editAble: true,
    order: 2,
    decimalPlaces: 2,
    sectionName: 'Quantity Information',
    fieldName: 'qty',
    resource: 'Sales Order Product',
    brand: '630dbe1e9ec418610523529c',
    createdBy: {
      user: '61b84437885fdf02d9104cb0',
      date: '2022-08-30T07:37:02.237Z'
    }
  },
  {
    _id: '630dbe1e9ec41861052354a4',
    fieldLabel: 'Unit',
    type: 'dropDown',
    option: [
      {
        optionLabel: 'Option 1',
        optionValue: 'Option 1'
      }
    ],
    required: false,
    isTooltip: false,
    tooltipMessage: '',
    editAble: true,
    order: 1,
    sectionName: 'Quantity Information',
    fieldName: 'unit',
    resource: 'Sales Order Product',
    brand: '630dbe1e9ec418610523529c',
    createdBy: {
      user: '61b84437885fdf02d9104cb0',
      date: '2022-08-30T07:37:02.237Z'
    }
  }
];

export default Material;
