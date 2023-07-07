import { Box, Button, IconButton, Menu, MenuItem } from '@material-ui/core';
import { capitalize, sortBy } from 'lodash';
import { useState, useEffect, useContext, Fragment } from 'react';
import { isMobile } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { useData } from 'src/StateProvider/Provider';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import NoDataCell from 'src/components/Helpers/NoDataCell';
import DeleteIcon from '@material-ui/icons/Delete';
import routes from 'src/components/Helpers/Routes';
import axiosInstance from 'src/axios/axiosInstance';
import { getNestedSubRows } from 'src/components/RentalManagment/helper';
import CustomReactTable from '../../../components/CustomReactTable/CustomReactTable';
import { ExpandMore } from '@material-ui/icons';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import ManageSerializedAsset from 'src/pages/SerializedAsset/ManageSerializedAsset';
const alphabet = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

const Material = ({ fetchAssetsReceivingData, assetsReceivingData, setNextStep, renderedFrom, stepFullScreen, allowedToEdit, allowedToDelete }) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { user, permissions }
  }: any = useData();
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [deleteData, setDeleteData] = useState(null);
  const [isDeleting, setDeleting] = useState(false);
  const [material, setMaterial] = useState([]);
  const [addDialog, setAddDialog] = useState({ open: false, type: '', parentId: null });
  const [columns, setColumns] = useState(null);
  const [rowsData, setRowsData] = useState(null);
  const [anchorActionEl, setAnchorActionEl] = useState(null);

  useEffect(() => {
    fetchFields();
  }, [assetsReceivingData]);

  useEffect(() => {
    fetchData();
  }, [columns]);
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
        width: 70,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.type === 'serializedAsset' ? 'Asset' : capitalize(row.original.type)}</p>
      },
      {
        accessor: 'detail',
        Header: 'Details',
        width: 250,
        sticky: isMobile ? 'none' : 'left',
        Cell: ({ row }) => (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <a
              className="link text-truncate"
              target="_blank"
              href={`${row.original.type === 'service'
                ? routes.serviceMasterDetail.path
                : row.original.type === 'product'
                  ? routes.productDetail.path
                  : row.original.type === 'serializedAsset'
                    ? routes.serializedAssetDetail.path
                    : routes.packagesDetail.path
                }/${row.original.materialId}`} rel="noreferrer"
            >
              {row.original.detail}
            </a>
            <Box ml={1} className="d-flex align-items-center">
              <span title={`There are ${row.original?.subRows?.length} product(s) in this ${row.original?.type}`}>
                {row.original?.subRows?.length ? `(${row.original?.subRows?.length})` : null}
              </span>
            </Box>
          </div>
        )
      },
      {
        accessor: 'productName',
        Header: 'Product',
        width: 200,
        Cell: ({ row }) => (
          <div className="d-flex gap-2 align-items-center">
            <p className="text-truncate" title={row.original?.productName}>
              {row.original?.productName ? (
                row.original?.productId ? (
                  <a className="link text-truncate" target="_blank" href={`${routes.productDetail.path}/${row.original?.productId}`} rel="noreferrer">
                    {row.original?.productName}
                  </a>
                ) : (
                  row.original?.productName
                )
              ) : (
                <NoDataCell />
              )}
            </p>
          </div>
        )
      },
      {
        accessor: 'description',
        Header: 'Description',
        width: 200,
        Cell: ({ row }) => {
          return row.original['description'] ? <p className="text-truncate">{row.original.description}</p> : <NoDataCell />;
        }
      },
      {
        accessor: 'status',
        Header: 'Status',
        width: 100,
        Cell: ({ row }) => (row.original['status'] ? <p> {row.original.status}</p> : <NoDataCell />)
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
                setDeleteData([row.original]);
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
  };

  const fetchData = async () => {
    setNextStep(false);

    var data: any = [];
    const response = await axiosInstance().get(`${routes.assetsReceiving.path}/material/${assetsReceivingData._id}/`);
    data = response?.data?.data;

    setMaterial(JSON.parse(JSON.stringify(data.material)));

    const rows = data.material.filter((e) => e.parentId === null);

    rows.forEach((parent, i) => {
      parent.index = i + 1;
      parent.detail = `${parent.type === 'service'
        ? parent.serviceDetail?.serviceName
        : parent.type === 'product'
          ? parent.productDetail?.productName
          : parent.type === 'serializedAsset'
            ? parent.serializedAssetDetail.assetNumber
            : parent.packageDetail?.packageName
        }`;
      parent.description =
        parent.type === 'service'
          ? parent?.serviceDetail?.serviceDescription || ''
          : parent.type === 'product'
            ? parent?.productDetail?.productDescription || ''
            : parent.type === 'package'
              ? parent?.packageDetail?.packageDescription || ''
              : parent.type === 'serializedAsset'
                ? parent?.serializedAssetDetail?.product?.productDescription || ''
                : '';
      parent.productName = parent?.serializedAssetDetail?.product?.optionLabel || '';
      parent.productId = parent?.serializedAssetDetail?.product?.optionValue || '';
      parent.qtyDisplay = parent.qty;
      parent.isValid = true;
      parent.allowedToDelete = parent.workOrder ? true : false;
      parent.subRows = generateNestedData(data.material, parent);
      parent.status = `${parent.type === 'service'
        ? parent.serviceDetail?.status
        : parent.type === 'product'
          ? parent?.productDetail?.status
          : parent.type === 'serializedAsset'
            ? parent?.serializedAssetDetail?.status
            : parent.packageDetail?.status
        }`;
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
    setSelectedProducts([]);
  };

  const generateNestedData = (material, parent) => {
    const subRows: any = material.filter((e) => e.parentId === parent._id);
    let productIndex = 0;
    let serviceIndex = 0;
    subRows.forEach((_subRow, j) => {
      _subRow.index = parent.index + '.' + `${_subRow.type === 'service' ? alphabet[serviceIndex] : productIndex + 1}`;
      _subRow.detail = `${_subRow.type === 'service'
        ? _subRow.serviceDetail?.serviceName
        : _subRow.type === 'product'
          ? _subRow.productDetail?.productName
          : _subRow.type === 'serializedAsset'
            ? _subRow.serializedAssetDetail.assetNumber
            : _subRow.packageDetail?.packageName
        }`;
      _subRow.description =
        _subRow.type === 'service'
          ? _subRow?.serviceDetail?.serviceDescription || ''
          : _subRow.type === 'product'
            ? _subRow?.productDetail?.productDescription || ''
            : _subRow.type === 'package'
              ? _subRow?.packageDetail?.packageDescription || ''
              : '';
      _subRow.productName = _subRow?.serializedAssetDetail?.product?.optionLabel || '';
      _subRow.productId = _subRow?.serializedAssetDetail?.product?.optionValue || '';
      _subRow.qtyDisplay = `${parent.qtyDisplay * _subRow.qty}`;
      _subRow.isValid = true;
      _subRow.hideSelection = true;
      _subRow.subRows = generateNestedData(material, _subRow);
      _subRow.type === 'service' ? serviceIndex++ : productIndex++;
      parent.status = `${parent.type === 'service'
        ? parent.serviceDetail?.status
        : parent.type === 'product'
          ? parent.productDetail?.status
          : parent.type === 'serializedAsset'
            ? parent.serializedAssetDetail.status
            : parent.packageDetail?.status
        }`;
    });
    if (subRows.length === 0 && parent.type === 'package') {
      parent.isValid = false;
    }
    if (parent.type === 'package') {
      parent.hideSelection = subRows.filter((e) => e.hideSelection).length ? true : false;
    }
    return sortBy(subRows, ['type']);
  };

  const handleAdd = async (rows) => {
    const material: any = [];
    rows.forEach((d) => {
      const element: any = {};
      element.materialId = d._id;
      element.type = addDialog.type;
      element.unit = d.unitMain && d.unitMain.length ? d.unitMain[0] : '';
      element.qty = d.qty ? parseFloat(d.qty) : 1;
      element.parentId = addDialog.parentId;
      material.push(element);
    });
    axiosInstance()
      .post(`${routes.assetsReceiving.path}/material/${assetsReceivingData._id}`, { material })
      .then(() => {
        setAddDialog({ open: false, type: '', parentId: null });
        fetchData();
        fetchAssetsReceivingData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleDelete = (rows) => {
    setDeleting(true);
    axiosInstance()
      .put(`${routes.assetsReceiving.path}/material/${assetsReceivingData?._id}/delete`, { rows })
      .then(() => {
        setDeleting(false);
        setSelectedProducts([]);
        fetchData();
        fetchAssetsReceivingData();
        setDeleteData(null);
      })
      .catch((error) => {
        setDeleting(false);
        toastConfig.setToastConfig(error);
        setDeleteData(null);
      });
  };

  const openActions = (event) => {
    setAnchorActionEl(event.currentTarget);
  };

  const closeActions = () => {
    setAnchorActionEl(null);
  };

  return (
    <Fragment>
      {allowedToEdit && (
        <Box display="flex" justifyContent="space-between" flexWrap={'wrap'} gridGap={1} m={1}>
          <Box display="flex" flexWrap={'wrap'}>
            {permissions?.serializedAsset?.isRead && allowedToEdit && (
              <>
                <Button
                  size="small"
                  variant="contained"
                  color="primary"
                  onClick={() => {
                    setAddDialog({ open: true, type: 'serializedAsset', parentId: null });
                  }}
                >
                  {`Create ${routes.serializedAsset.title}`}
                </Button>
                <Box ml={1} />
              </>
            )}
          </Box>
          <Box display="flex">
            <Button
              variant="outlined"
              color="default"
              size="small"
              onClick={openActions}
              aria-controls="action-menu"
              disabled={selectedProducts.length === 0}
              endIcon={<ExpandMore />}
              className="new-dropdown-v1"
            >
              Actions
            </Button>
            <Menu
              anchorEl={anchorActionEl}
              keepMounted
              getContentAnchorEl={null}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'left'
              }}
              id="action-menu"
              open={Boolean(anchorActionEl)}
              onClose={closeActions}
            >
              <MenuItem
                disabled={allowedToDelete && selectedProducts?.filter((e) => e.allowedToDelete)?.length === selectedProducts?.length ? true : false}
                onClick={() => {
                  closeActions();
                  handleDelete(selectedProducts)
                }}
              >
                Delete
              </MenuItem>
            </Menu>
          </Box>
        </Box>
      )}
      {columns && rowsData ? (
        <Box zIndex={5} width={'100%'}>
          <CustomReactTable
            height={stepFullScreen ? 'calc(100vh - 150px)' : 'calc(100vh - 395px)'}
            columns={columns}
            data={rowsData}
            setWholeRowsCellColor={(rowData) => (!rowData.isValid ? 'error' : '')}
            onSelect={setSelectedProducts}
            childrenProperty="subRows"
            uniqueKey="_id"
            hideSelection={!allowedToEdit}
            hideAction={!allowedToEdit}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            hideExpander={true}
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
          message={`Are you sure you want to delete the record ${deleteData?.length === 1 ? deleteData[0].serializedAssetDetail?.assetNumber : "(s)"}?`}
          onClose={() => setDeleteData(null)}
          onOk={() => handleDelete(deleteData)}
          okBtnLoading={isDeleting}
        />
      )}

      {addDialog.open && (
        <ManageSerializedAsset
          onClose={() => setAddDialog({ open: false, type: '', parentId: null })}
          referenceType={'assetsReceiving'}
          referenceData={{
            customerAccount: assetsReceivingData?.customerAccount?.optionValue,
            warehouse: assetsReceivingData?.warehouse?.optionValue
          }}
          onSuccess={(data) => {
            setAddDialog({ open: false, type: '', parentId: null });
            handleAdd([data]);
          }}
        />
      )}
    </Fragment>
  );
};

export default Material;
