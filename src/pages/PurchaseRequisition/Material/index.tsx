import { Box, Button, IconButton, makeStyles, Grid, Menu, MenuItem } from '@material-ui/core';
import { ExpandMore } from '@material-ui/icons';
import { startCase } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile } from 'react-device-detect';
import axiosInstance from 'src/axios/axiosInstance';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import AssignServiceDialog from 'src/components/AssignRolesDialog/AssignServiceDialog';
import routes from 'src/components/Helpers/Routes';
import { genrateCustomTableColumns } from 'src/constants/columns';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import DeleteIcon from '@material-ui/icons/Delete';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import { calculateRowsField } from 'src/components/RentalManagment/helper';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ConfirmationDialog from 'src/components/Helpers/ConfirmationDialog';
import PurchaseRequisitionDetailDialog from './PurchaseRequisitionDetailDialog';
import AddIcon from '@material-ui/icons/Add';

const Material = ({ renderedFrom, allowedToEdit, setNextStep, purchaseRequisitionData, stepFullScreen }) => {
  const {
    state: { user, permissions }
  }: any = useData();
  const toastConfig = useContext(CustomToastContext);
  const [addExistingProductDialog, setAddExistingProductDialog] = useState({ open: false, type: '' });
  const [rowsData, setRowsData] = useState(null);
  const [allFields, setAllFields] = useState([]);
  const [columns, setColumns] = useState(null);
  const [material, setMaterial] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [isUpdating, setUpdating] = useState(false);
  const [isProductEdit, setIsProductEdit] = useState({ open: false, isBulkedit: false });
  const [recordToUpdate, setRecordToUpdate] = useState(null);
  const [addAnchorEl, setAddAnchorEl] = useState(null);


  useEffect(() => {
    fetchFields();
  }, []);

  const fetchFields = async () => {
    try {
      let fields = await axiosInstance().get('/field?resource=Purchase Requisition Detail');
      let data = fields?.data?.data.map((i: any) => {
        return i?.fieldData
      })
      setAllFields(data);
      const newColumns = genrateCustomTableColumns(data, '', '');
      let qtyIndex = newColumns.findIndex((d) => d.accessor === 'qty');
      if (qtyIndex > -1) {
        newColumns[qtyIndex].accessor = 'qtyDisplay';
      }
      newColumns.forEach((element) => {
        if (element.accessor === 'qtyDisplay') {
          element['Footer'] = (info) => {
            const qtyTotal = info.rows
              .filter((f) => f.values.hasOwnProperty(element.accessor) && !isNaN(f.values[element.accessor]))
              .reduce((sum, row) => row.values[element.accessor] + sum, 0);
            return <>{qtyTotal}</>;
          };
        }
      })
      let coloum: any = [
        {
          accessor: 'srno',
          Header: 'Index',
          width: 70,
          sticky: isMobile ? 'none' : 'left',
          Cell: ({ row }) => <p className="text-truncate">{row.original.srno}</p>,
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
          Cell: ({ row }) => (
            <div style={{ display: 'flex', alignItems: 'center' }}>
              {
                <p
                  onClick={() => {
                    handleOpen(row.original);
                  }}
                  className="link text-truncate"
                  title={row.original?.detail}
                >
                  {row.original?.detail}
                </p>
              }
            </div>
          )
        }
      ];
      coloum = [...coloum, ...newColumns];
      {
        isMobile ? (
          <Box display={'none'} />
        ) : (
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
          })
        );
      }
      setColumns(coloum);
      fetchData();
    } catch (err) {
      toastConfig.setToastConfig(err);
    }
  };

  const fetchData = async () => {
    setNextStep(false);
    var data: any = [];
    const response = await axiosInstance().get(`${routes.purchaseRequisition.path}/material/${purchaseRequisitionData._id}`);
    data = response?.data?.data;
    setMaterial(JSON.parse(JSON.stringify(data.material)));
    const rows = data.material
    rows.forEach((parent, i) => {
      parent.srno = i + 1;
      parent.detail = `${parent.type === 'product' ? parent.productDetail?.productName : parent.serviceDetail?.serviceName}`;
      parent.qtyDisplay = parent.qty;
    });
    if (rows.filter((_rows) => _rows.isValid === false).length > 0 || rows.length === 0) {
      setNextStep(true);
    } else {
      setNextStep(true);
    }
    setRowsData(rows);
    setSelectedProducts([]);
  };

  const handleOpen = (rowData) => {
    setIsProductEdit({ open: true, isBulkedit: false });
    setRecordToUpdate(rowData);
  };

  const onSaveInlineEdit = async (inputField, updatedData) => {
    const rowData = material.find((d) => d._id === updatedData._id);
    if (inputField.hasOwnProperty('qtyDisplay')) {
      inputField['qty'] = inputField['qtyDisplay'];
    }
    let rows: any = [{ ...rowData, ...updatedData }];
    rows = await calculateRowsField(material, inputField, allFields, updatedData);
    handleSaveData(rows);
  };

  const handleSaveData = async (rows: any) => {
    setUpdating(true);
    axiosInstance()
      .put(`${routes.purchaseRequisition.path}/material/${purchaseRequisitionData._id}`, { material: rows })
      .then(() => {
        setUpdating(false);
        setIsProductEdit({ open: false, isBulkedit: false });
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Record updated successfully`
        });
        fetchData();
      })
      .catch((error) => {
        setUpdating(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = (rows) => {
    setDeleting(true);
    axiosInstance()
      .put(`${routes.purchaseRequisition.path}/material/${purchaseRequisitionData?._id}/delete`, { ids: rows })
      .then(() => {
        setDeleting(false);
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Record deleted successfully`
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


  const handleAdd = async (rows) => {
    const material: any = [];
    rows.forEach((d) => {
      const element: any = {};
      element.materialId = d._id;
      element.type = addExistingProductDialog.type;
      element.unit = d?.unitMain && d?.unitMain?.length ? d.unitMain[0] : d?.unit ? d?.unit : '';
      element.qty = d.qty ? parseFloat(d.qty) : 1;
      material.push(element);
    });
    axiosInstance()
      .post(`${routes?.purchaseRequisition?.path}/material/${purchaseRequisitionData._id}`, { material })
      .then(() => {
        setAddExistingProductDialog({ open: false, type: '' });
        toastConfig.setToastConfig({
          open: true,
          type: 'success',
          message: `Record added successfully`
        });
        fetchData();
      })
      .catch((error) => {
        setAddExistingProductDialog({ open: false, type: '' });
        toastConfig.setToastConfig(error);
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
      <Box display="flex" justifyContent="space-between" m={1}>
        <Box display="flex" alignItems="center">
          <Button variant={'outlined'} color="primary" size="small" startIcon={<AddIcon />} onClick={openAddActions} aria-controls="add-menu">
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
                setAddExistingProductDialog({ open: true, type: 'product' });
              }}
            >
              Add Products
            </MenuItem>
            <MenuItem
              onClick={() => {
                closeAddActions();
                setAddExistingProductDialog({ open: true, type: 'service' });
              }}
            >
              Add Services
            </MenuItem>
          </Menu>
        </Box>
        <Box display="flex">
          <Button
            disabled={!Boolean(selectedProducts && selectedProducts.filter((e) => !e.hideSelection).length) || isDeleting}
            variant={isMobile ? 'text' : 'outlined'}
            color="default"
            size="small"
            onClick={openActions}
            aria-controls="action-menu"
          >
            {isMobile ? '' : 'Actions'} <ExpandMore />
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
                const dataToDelete =
                  selectedProducts &&
                  selectedProducts
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
              disabled={!Boolean(selectedProducts && selectedProducts.filter((e) => !e.hideSelection).length) || isDeleting}
            >
              Delete
            </MenuItem>
          </Menu>
        </Box>
      </Box>
      {columns && rowsData ? (
        <>
          <Box p="6px" zIndex={5} width={'100%'}>
            <CustomReactTable
              height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 345px)'}
              columns={columns}
              data={rowsData}
              setWholeRowsCellColor={(rowData) => (!rowData.isValid ? '' : '')}
              onSelect={setSelectedProducts}
              childrenProperty="subRows"
              uniqueKey="_id"
              renderedFrom={renderedFrom}
              isClientSideGrid={true}
              onSaveEdit={onSaveInlineEdit}
              hideSelection={!allowedToEdit}
              hideAction={!allowedToEdit}
              hideExpander={true}
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
      {isProductEdit.open && (
        <PurchaseRequisitionDetailDialog
          onClose={() => {
            setIsProductEdit({ open: false, isBulkedit: false });
          }}
          productionOrderData={recordToUpdate}
          handleSave={handleSaveData}
          loading={isUpdating}
        />
      )}
      {addExistingProductDialog.open && addExistingProductDialog.type === 'product' && (
        <AssignProductDialog
          reference="purchaseRequisition"
          serialized={null}
          productsDialogOpen={addExistingProductDialog.open}
          productId={null}
          handleCloseDialog={() => setAddExistingProductDialog({ open: false, type: '' })}
          assignedProducts={rowsData?.map((e) => e?.materialId)}
          renderedFrom={renderedFrom}
          onSuccess={(d) => {
            handleAdd(d);
          }}
        />
      )}
      {addExistingProductDialog.open && addExistingProductDialog.type === 'service' && (
        <AssignServiceDialog
          reference={"purchaseRequisition"}
          referenceId={purchaseRequisitionData?._id}
          handleClose={() => setAddExistingProductDialog({ open: false, type: '' })}
          ids={rowsData?.map((e) => e?.materialId)}
          onSuccess={(rows) => {
            handleAdd(rows);
          }}
        />
      )}
    </Fragment>
  );
};

export default Material;
