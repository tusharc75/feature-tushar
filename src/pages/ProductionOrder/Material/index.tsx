import { useState, useEffect, useContext, Fragment } from 'react';
import { Box, Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import axiosInstance from '../../../axios/axiosInstance';
import routes from '../../../components/Helpers/Routes';
import { useData } from '../../../StateProvider/Provider';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import DeleteIcon from '@material-ui/icons/Delete';
import { RESOURCE_LABEL, productionOrder } from '../../../constants/helpers';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { isMobile } from 'react-device-detect';
import { ExpandMore } from '@material-ui/icons';
import { startCase } from 'lodash';
import { calculateRowsField } from 'src/components/RentalManagment/helper';
import MaterialDialog from './MaterialDialog';
import Add from '@material-ui/icons/Add';
import OpenInNewIcon from '@material-ui/icons/OpenInNew';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';
import AssignPackageDialog from 'src/components/AssignRolesDialog/AssignPackageDialog';
import { flattenArray } from 'src/constants/columns';
import PreviewDownload from 'src/components/PreviewDownload';

const Material = ({ productionOrderData, setNextStep, renderedFrom, stepFullScreen, allowedToEdit, allowedToDelete }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();

  const [isUpdating, setUpdating] = useState(false);
  const [addDialog, setAddDialog] = useState({ open: false, type: '', parentId: null });
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [materialEdit, setMaterialEdit] = useState({ open: false, data: null, bulkedit: false, showSaveAndNext: false });
  const [anchorEl, setAnchorEl] = useState(null);
  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [allFields, setAllFields] = useState([]);
  const [addAnchorEl, setAddAnchorEl] = useState(null);

  useEffect(() => {
    fetchFields();
  }, [productionOrderData]);

  const fetchFields = async () => {
    setColumns(null);
    const coloum: any = [
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
        disableFilters: true,
        sticky: isMobile ? 'none' : 'left',
        width: 200,
        Cell: ({ row }) => (row.original['type'] ? <p>{`${startCase(row.original?.type)} `}</p> : <NoDataCell />)
      },
      {
        accessor: 'detail',
        Header: ' Details',
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
      },
      {
        accessor: 'qty',
        Header: 'Qty',
        width: 200,
        Cell: ({ row }) => {
          return row.original['qty'] ? <p className="text-truncate">{row.original.qty}</p> : <NoDataCell />;
        },
        editable: true
      },
      {
        accessor: 'unit',
        Header: 'Unit',
        width: 200,
        Cell: ({ row }) => {
          return row.original['unit'] ? <p className="text-truncate">{row.original.unit}</p> : <NoDataCell />;
        }
      }
    ];
    coloum.push({
      accessor: 'action',
      Header: '',
      minWidth: 70,
      width: 70,
      sticky: 'right',
      disableFilters: true,
      canDrag: false,
      Cell: ({ row }) => (
        <>
          <HtmlTooltip title={allowedToDelete && row.original?.allowedToDelete ? 'Asset is already assigned' : 'Delete'}>
            <IconButton
              size="small"
              aria-label="Details"
              onClick={() => {
                const obj: any = [row.original._id];
                setDeleteData(obj);
              }}
              disabled={allowedToDelete && row.original?.allowedToDelete}
            >
              <DeleteIcon fontSize="small" color={allowedToDelete && row.original?.allowedToDelete ? 'disabled' : 'error'} />
            </IconButton>
          </HtmlTooltip>
        </>
      )
    });
    coloum.forEach((element) => {
      if (element.accessor === 'qty') {
        element['Footer'] = (info) => {
          const qtyTotal = info.rows
            .filter((f) => f.original.parentId === null && f.values.hasOwnProperty(element.accessor) && !isNaN(f.values[element.accessor]))
            .reduce((sum, row) => row.values[element.accessor] + sum, 0);
          return <>{qtyTotal}</>;
        };
      }
    });
    setColumns(coloum);
    fetchData();
  };

  const fetchData = async () => {
    setNextStep(false);

    var data: any = [];
    const response = await axiosInstance().get(`${productionOrder.api}/material/${productionOrderData._id}`);
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

    if (rows.length !== 0) {
      if (rows.filter((_rows) => _rows.isValid === false).length > 0) {
        setNextStep(false);
      } else {
        setNextStep(true);
      }
    } else {
      setNextStep(false);
    }
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
      .post(`${productionOrder.api}/material/${productionOrderData._id}`, { material })
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

  const handleDelete = (rows) => {
    setDeleting(true);
    axiosInstance()
      .put(`${productionOrder.api}/material/${productionOrderData?._id}/delete`, { ids: rows })
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

  const onSaveInlineEdit = async (inputField, updatedData) => {
    const rowData = flattenArray(rowsData)?.find((d) => d._id === updatedData._id);
    if (inputField.hasOwnProperty('qtyDisplay')) {
      inputField['qty'] = inputField['qtyDisplay'];
    }
    let rows: any = [{ ...rowData, ...updatedData }];
    rows = await calculateRowsField(flattenArray(rowsData), inputField, allFields, updatedData);
    handleSaveData(rows);
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
      .put(`${productionOrder.api}/material/${productionOrderData._id}`, { material: rows })
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
            <PreviewDownload resource={RESOURCE_LABEL.demandOrder} referenceId={productionOrderData?._id} columns={columns} />
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
          <Box zIndex={5} width={'100%'}>
            <CustomReactTable
              height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
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
      {addDialog.open && addDialog.type === 'product' && (
        <AssignProductDialog
          reference="productionOrder"
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
          referenceType="productionOrder"
          handleClose={() => setAddDialog({ open: false, type: '', parentId: null })}
          ids={[]}
          onSuccess={(rows) => {
            handleAdd(rows);
          }}
          packageType={null}
        />
      )}
      {materialEdit.open && (
        <MaterialDialog
          onClose={() => {
            setMaterialEdit({ open: false, data: null, bulkedit: false, showSaveAndNext: false });
          }}
          materialData={materialEdit.data}
          productionOrderData={productionOrderData}
          handleUpdate={handleSaveData}
          loadingEdit={isUpdating}
          bulkEdit={materialEdit.bulkedit}
          showSaveAndNext={materialEdit.showSaveAndNext}
        />
      )}
    </Fragment>
  );
};

export default Material;
