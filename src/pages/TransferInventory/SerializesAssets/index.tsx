import React, { useReducer, useState, useEffect, useContext, Fragment } from 'react';
import { useHistory, Link } from 'react-router-dom';
import routes from 'src/components/Helpers/Routes';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import { useData } from 'src/StateProvider/Provider';
import { IconButton, Container, Paper, Typography, Box, Grid, Button, Step, StepLabel, Stepper, Chip } from '@material-ui/core';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import AddSerializedAsset from 'src/pages/RentalManagement/SerializedAsset/AddSerializedAsset';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import NoDataCell from '../../../components/Helpers/NoDataCell';
import HtmlTooltip from '../../../components/CustomTooltipTitle';
import { Delete } from '@material-ui/icons';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';

const SerialzedAssets = ({
  allowedToEdit,
  transferInventoryData,
  setNextStep,
  statusOptions,
  currentStep,
  renderedFrom,
  updateTransferInventoryStatus
}) => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: { permissions }
  } = useData();

  const [selectedRecords, setSelectedRecords] = useState([]);
  const [isAdding, setAdding] = useState(false);
  const [addSerializedAssetDialog, setAddSerializedAssetDialog] = useState({ open: false, product: [] });

  const [rowsData, setRowsData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [deleteData, setDeleteData] = useState([]);
  const [deleting, setDeleting] = useState(false);

  const columns: any = [
    {
      accessor: 'detail',
      Header: 'Details',
      width: 300,
      Cell: ({ row }) => (
        <div className="d-flex gap-2 align-items-center">
          {row.original.type === 'product' ? (
            <Fragment>
              <Link className="link" title={row.original.detail} to={`${routes.productDetail.path}/${row.original.product}`}>
                <p>{row.original.detail}</p>
              </Link>
              <Chip
                className="ml-1"
                label={row.original.serializedProduct ? 'Serialized Product' : 'Non-Serialized Product'}
                size="small"
                color="primary"
              />
            </Fragment>
          ) : (
            <Fragment>
              <Link className="link" title={row.original.detail} to={`${routes.serializedAssetDetail.path}/${row.original.assetId}`}>
                <p>{row.original.detail}</p>
              </Link>
              <HtmlTooltip title={`Remove`}>
                <IconButton
                  size="small"
                  onClick={() => {
                    setShowConfirmBox(true);
                    setDeleteData([row.original.assetId]);
                  }}
                >
                  <Delete fontSize="small" color="error" />
                </IconButton>
              </HtmlTooltip>
            </Fragment>
          )}
        </div>
      )
    },
    {
      accessor: 'assetAssigned',
      Header: 'Assets Assigned',
      width: 100,
      Cell: ({ row }) => {
        return row.original.serializedProduct ? (
          <Fragment>
            {row.original.assetAssigned}/{row.original.qty}
          </Fragment>
        ) : (
          <NoDataCell />
        );
      }
    },
    {
      accessor: 'qty',
      Header: 'Quantity',
      width: 100,
      Cell: ({ row }) => {
        return row.original.type === 'product' ? <Fragment>{row.original.qty}</Fragment> : <NoDataCell />;
      }
    }
  ];

  useEffect(() => {
    fetchInventories();
  }, [transferInventoryData]);

  const fetchInventories = () => {
    setNextStep(false);
    axiosInstance()
      .get(`${routes.transferInventory.path}/${transferInventoryData._id}/product`)
      .then(({ data: { data } }) => {
        let rows = data?.products.map((u: any) => {
          const assetsData = data?.assets.filter((d: any) => d._id === u._id);
          let finalObject = {};
          finalObject['_id'] = u._id;
          finalObject['detail'] = u.productDetail.productName;
          finalObject['product'] = u.product;
          finalObject['serializedProduct'] = u.productDetail.serializedProduct;
          finalObject['type'] = 'product';
          finalObject['qty'] = u.qty;
          finalObject['assetAssigned'] = assetsData?.length;
          finalObject['hideSelection'] = u.productDetail.serializedProduct ? false : true;
          finalObject['isValid'] = u.productDetail.serializedProduct ? (u.qty - assetsData?.length === 0 ? true : false) : true;
          const subRows = [];
          assetsData?.forEach((ele) => {
            const element = {};
            element['detail'] = ele?.assetDetail?.assetNumber;
            element['assetId'] = ele?.asset;
            element['type'] = 'asset';
            element['isValid'] = true;
            subRows.push(element);
          });
          finalObject['subRows'] = subRows;
          return {
            ...finalObject
          };
        });
        if (rows.filter((_rows) => _rows.isValid === false).length > 0) {
          setNextStep(false);
        } else {
          setNextStep(true);
        }
        setRowsData(rows);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleAddSerializedAsset = (assets: any[]) => {
    let data = [];
    assets.forEach((asset) => {
      let dataObj = {};
      const inventory = addSerializedAssetDialog.product.find((rec: any) => rec.id === asset.productId);
      if (inventory) {
        dataObj = {
          asset: asset._id,
          _id: inventory._id
        };
      }
      data.push(dataObj);
    });
    setAdding(true);
    axiosInstance()
      .post(`${routes.transferInventory.path}/${transferInventoryData._id}/assets`, { assets: data })
      .then(() => {
        setAddSerializedAssetDialog({ open: false, product: [] });
        setAdding(false);
        fetchInventories();
      })
      .catch((error) => {
        setAdding(false);
        toastConfig.setToastConfig(error);
      });
  };

  const handleRemoveAsset = async () => {
    setDeleting(true);
    axiosInstance()
      .put(`${routes.transferInventory.path}/${transferInventoryData._id}/assets/remove`, { ids: deleteData })
      .then(() => {
        setDeleting(false);
        fetchInventories();
        setDeleteData(null);
        setShowConfirmBox(false);
      })
      .catch((error) => {
        setDeleting(false);
        toastConfig.setToastConfig(error);
        setDeleteData(null);
      });
  };

  const disableAssignSerializedAssets = () => {
    if (selectedRecords.length === 0) return true;
    const flatArray = selectedRecords.filter((f) => f.qty !== 0 && f.serializedProduct && f.qty > f.assetAssigned);
    return flatArray.length === 0;
  };

  return (
    <Fragment>
      {/* {currentStep === 1 && statusOptions?.length >= 0 && (
        <Box mt={1}>
          <Grid container spacing={2}>
            <Grid item xs={8} sm={10} md={10}>
              <Stepper activeStep={statusOptions?.findIndex((f) => f.optionLabel === transferInventoryData?.status)} alternativeLabel>
                {statusOptions?.map(({ optionLabel }) => (
                  <Step key={optionLabel}>
                    <StepLabel>{optionLabel}</StepLabel>
                  </Step>
                ))}
              </Stepper>
            </Grid>
            <Grid item xs={4} sm={2} md={2}>
              {allowedToEdit && transferInventoryData?.status !== TRANSFER_INVENTORY_STATUS.delivered && (
                <Button
                  variant="contained"
                  size="small"
                  color="primary"
                  onClick={() => {
                    var index = 0;
                    if (statusOptions?.findIndex((f) => f.optionLabel === transferInventoryData?.status) >= 0) {
                      index = statusOptions?.findIndex((f) => f.optionLabel === transferInventoryData?.status) + 1;
                    }
                    updateTransferInventoryStatus(statusOptions[index]?.optionLabel);
                  }}
                >
                  {statusOptions?.findIndex((f) => f.optionLabel === transferInventoryData?.status) >= 0
                    ? statusOptions[statusOptions?.findIndex((f) => f.optionLabel === transferInventoryData?.status) + 1]?.optionLabel
                    : statusOptions[0]?.optionLabel}
                </Button>
              )}
            </Grid>
          </Grid>
        </Box>
      )} */}
      {/* {currentStep === 2 && (
        <Box mt={1} mr={1} display="flex" justifyContent="flex-end">
          <Button
            onClick={() => {
              setDownlodingFile(true);
              axiosInstance()
                .get(`/transfer-inventory/${transferInventoryData._id}/pdf`)
                .then(({ data }) => {
                  axiosInstance()
                    .get(`user/download?fileName=${data.data.fileName}`, {
                      responseType: 'blob'
                    })
                    .then(({ data }) => {
                      const file = new Blob([data], { type: 'application/pdf' });
                      const fileURL = URL.createObjectURL(file);
                      const pdfWindow = window.open();
                      pdfWindow.location.href = fileURL;
                      toastConfig.setToastConfig({ open: true, type: 'success', message: 'Preview file downloaded successfully.' });
                      setDownlodingFile(false);
                    })
                    .catch((err) => {
                      toastConfig.setToastConfig(err);
                      setDownlodingFile(false);
                    });
                })
                .catch((err) => {
                  toastConfig.setToastConfig(err);
                  setDownlodingFile(false);
                });
            }}
            variant={isMobile && !isTablet ? 'text' : 'outlined'}
            color="primary"
            type="button"
            size="small"
            disabled={downlodingFile || dataRows.length === 0}
            startIcon={<AiFillFilePdf />}
          >
            {downlodingFile ? 'Please wait...' : 'Preview'}
          </Button>
        </Box>
      )} */}
      <Box display="flex" justifyContent="flex-end" alignItems="center" p={1}>
        <Button
          variant="contained"
          color="primary"
          type="button"
          size="small"
          disabled={disableAssignSerializedAssets()}
          onClick={() => {
            const product = [];
            selectedRecords?.forEach((e) => {
              if (e.type === 'product') {
                product.push({
                  _id: e._id,
                  id: e.product,
                  productName: e.detail,
                  qty: e.qty - e.assetAssigned
                });
              }
            });
            setAddSerializedAssetDialog({ open: true, product: product });
          }}
        >
          {'Assign ' + routes.serializedAsset.title}
        </Button>
        {selectedRecords.filter((e: any) => e.type === 'asset').length > 0 &&
          <Box ml={1}>
            <Button
              variant="contained"
              color="primary"
              type="button"
              size="small"
              disabled={selectedRecords.filter((e: any) => e.type === 'asset').length === 0}
              onClick={() => {
                const assets = selectedRecords.filter((e: any) => e.type === 'asset')
                setShowConfirmBox(true);
                setDeleteData(assets.map((a: any) => a.assetId));
              }}
            >
              Remove
            </Button>
          </Box>}
      </Box>
      <Box mt={1}>
        {rowsData ? (
          <CustomReactTable
            height={'calc(100vh - 365px)'}
            columns={columns}
            data={rowsData}
            onSelect={setSelectedRecords}
            childrenProperty="subRows"
            uniqueKey="_id"
            hideSelection={false}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
            setWholeRowsCellColor={(rowData) => {
              if (!rowData.isValid) return 'error';
              return '';
            }}
          />
        ) : (
          <Box p={2} height={500} bgcolor="white">
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Box>
      {addSerializedAssetDialog.open && (
        <AddSerializedAsset
          addSerializedAsset={handleAddSerializedAsset}
          handleSerializedAssetClose={() => {
            setAddSerializedAssetDialog({ open: false, product: [] });
          }}
          refrenceType={'Transfer Inventory'}
          refrenceData={null}
          isAdding={isAdding}
          selectedProducts={addSerializedAssetDialog.product}
          filterByPlant={transferInventoryData?.transferFromPlant?.optionValue}
        />
      )}
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to remove?`}
          onClose={() => {
            setShowConfirmBox(false);
            setDeleteData([]);
          }}
          okBtnLoading={deleting}
          onOk={handleRemoveAsset}
        />
      )}
    </Fragment>
  );
};

export default SerialzedAssets;
