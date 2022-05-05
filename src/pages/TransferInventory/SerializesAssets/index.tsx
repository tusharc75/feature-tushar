import React, { useReducer, useState, useEffect, useContext, Fragment } from 'react';
import { useHistory, Link } from 'react-router-dom';
import routes from 'src/components/Helpers/Routes';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { CommonRenderer } from 'src/components/AgGridComponents/CustomAgGridCellRenderers';
import CustomAgGrid, { reducer as gridReducer, intialState as gridState } from 'src/components/AgGridComponents/CustomAgGrid';
import axiosInstance from 'src/axios/axiosInstance';
import CustomSwipableList from 'src/components/SwipableListComponents/CustomSwipableList';
import { useData } from 'src/StateProvider/Provider';
import { AiFillFilePdf } from 'react-icons/ai';
import { gridLoadingTimeout, prepareDataForGrid, TRANSFER_INVENTORY_STATUS } from 'src/constants/helpers';
import { Container, Paper, Typography, Box, Grid, Button, Step, StepLabel, Stepper, Chip } from '@material-ui/core';
import CustomReactTable from 'src/components/CustomReactTable/CustomReactTable';
import { startCase } from 'lodash';
import AddSerializedAsset from 'src/pages/RentalManagement/SerializedAsset/AddSerializedAsset';

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
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(gridReducer, gridState);
  const { dataRows, rowCount, loading, page, limit, pageSizes } = state;
  const [selectedRecords, setSelectedRecords] = useState([]);
  const [downlodingFile, setDownlodingFile] = useState(false);
  const [isAdding, setAdding] = useState(false);
  const [addSerializedAssetDialog, setAddSerializedAssetDialog] = useState(false);

  /*
   * Ag grid columns
   */
  // const columns = [
  //   { field: 'productName', headerName: 'Product Description', show: true, cellRenderer: 'productNameRenderer', primaryField: true },
  //   {
  //     field: 'qty',
  //     headerName: 'Quantity',
  //     show: true,
  //     disabled: false,
  //     cellRenderer: 'commonRenderer',
  //     cellEditor: 'numericCellEditor',
  //     editable: true
  //   }
  // ];

  // const ProductNameRenderer = ({ row }) => (

  // );

  const columns: any = [
    {
      accessor: 'productName',
      Header: 'Product Description',
      width: 300,
      Cell: ({ row }) => (
        <div className="d-flex gap-2 align-items-center">
          <Link className="link" title={row.original.productName} to={`/product/detail/${row.original.id}`}>
            <p>{row.original.productName}</p>
          </Link>
          <Chip className="ml-1" label={row.original.isSerialized ? 'Serialized Product' : 'Non-Serialized Product'} size="small" color="primary" />
        </div>
      )
    },
    {
      accessor: 'assetAssigned',
      Header: 'Assets Assigned',
      width: 100,
      Cell: ({ row }) => {
        return (
          <>
            {row.original.assetAssigned}/{row.original.totalQty}
          </>
        );
      }
    },
    {
      accessor: 'qty',
      Header: 'Quantity',
      width: 100,
      Cell: ({ row }) => {
        return <>{row.original.totalQty}</>;
      }
    }
  ];

  const history = useHistory();

  useEffect(() => {
    fetchInventories();
  }, [transferInventoryData]);

  const fetchInventories = () => {
    setNextStep(false);
    dispatch({ type: 'loading', loading: true });
    if (gridApi) {
      gridApi.setRowData([]);
    }
    axiosInstance()
      .get(`${routes.transferInventory.path}/${transferInventoryData._id}/product`)
      .then(({ data: { data } }) => {
        dispatch({ type: 'loading', loading: true });
        let rows = data?.products.map((u: any) => {
          const assetsData = data?.assets.filter((d: any) => d.parentId === u._id);
          let finalObject = {};
          finalObject['productName'] = u.productDetail.productName;
          finalObject['totalQty'] = u.qty;
          finalObject['qty'] = u.qty - assetsData.length;
          finalObject['isSerialized'] = u.productDetail.serializedProduct;
          finalObject['id'] = u.product;
          finalObject['hideSelection'] = u.productDetail.serializedProduct ? false : true;
          finalObject['parentId'] = u._id;
          finalObject['assetAssigned'] = data?.assets.length > 0 ? assetsData.length : 0;
          finalObject['assets'] = assetsData;
          return {
            ...u,
            ...finalObject
          };
        });
        
        dispatch({ type: 'initialize', data: rows, count: data.count });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      });
  };

  useEffect(( ) => {
    if(dataRows.length === 0) return
    
    const unassignedAsset = dataRows.filter((d) => d.assetAssigned !== d.totalQty);
     
    if(unassignedAsset.length > 0) {
      setNextStep(false)
    } else {
      setNextStep(true)
    }

  },[dataRows])

  // const frameworkComponents = {
  //   commonRenderer: CommonRenderer,
  //   productNameRenderer: ProductNameRenderer
  // };

  const handleAddSerializedAsset = (assets: any[]) => {
    let dataToAdd = [];

    assets.forEach((asset) => {
      let dataObj = {};
      const inventory = selectedRecords.find((rec: any) => rec.product === asset.productId);
      if (inventory) {
        dataObj = {
          asset: asset._id,
          parentId: inventory.parentId
        };
      }

      dataToAdd.push(dataObj);
    });

    setAdding(true);

    axiosInstance()
      .post(`${routes.transferInventory.path}/${transferInventoryData._id}/assets`, {
        assets: dataToAdd
      })
      .then(() => {
        setAddSerializedAssetDialog(false);
        setAdding(false);
        fetchInventories();
      })
      .catch((err) => {
        setAdding(false);
        setAddSerializedAssetDialog(false);
      });
  };

  const disableAssignSerializedAssets = () => {
    if (selectedRecords.length === 0) return true;
    const flatArray = selectedRecords.filter((f) => f.qty !== 0 && f.isSerialized && f.totalQty > f.assetAssigned);
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
      {currentStep === 2 && (
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
      )}
      <Box display="flex" justifyContent="flex-end" alignItems="center" p={1}>
        <Button
          variant="contained"
          color="primary"
          type="button"
          size="small"
          disabled={disableAssignSerializedAssets()}
          onClick={() => setAddSerializedAssetDialog(true)}
        >
          {'Assign ' + routes.serializedAsset.title}
        </Button>
      </Box>
      <Box mt={1}>
        {isMobile && !isTablet ? (
          <CustomSwipableList
            allowSelection={false}
            allowSwipe={false}
            permissions={permissions?.transferInventory}
            primaryField={columns?.find((d: any) => d.primaryField)}
            onClick={(data: any) => {
              history.push(`${routes.productInventory.path}/${data._id}`);
            }}
            dataRows={dataRows}
            selectedRecords={selectedRecords}
            dispatch={dispatch}
            onEdit={() => {}}
            extraParamsToCheckDelete={true}
            onDelete={() => {}}
            rowCount={rowCount}
            page={page}
            loading={loading}
            chips={[
              {
                label: 'Quantity: ',
                field: 'qty'
              }
            ]}
            additionalDetails={[]}
            owerCollaboratorInitialsOrImages="owerCollaboratorInitialsOrImages"
            onCreate={false}
            showClone={false}
            onClone={() => {}}
            renderedFrom={renderedFrom}
          />
        ) : (
          // <CustomAgGrid
          //   columns={columns}
          //   dataRows={dataRows}
          //   frameworkComponents={frameworkComponents}
          //   setGridApi={setGridApi}
          //   dispatch={dispatch}
          //   rowCount={rowCount}
          //   limit={limit}
          //   pageSizes={pageSizes}
          //   page={page}
          //   allowAction={false}
          //   actionWidth={120}
          //   allowSelection={false}
          //   isClientSideGrid={true}
          //   loading={loading}
          //   renderedFrom={renderedFrom}
          //   refreshGrid={() => {}}
          // />
          <CustomReactTable
            height={'calc(100vh - 365px)'}
            columns={columns}
            data={dataRows}
            setWholeRowsCellColor={() => {}}
            onSelect={setSelectedRecords}
            childrenProperty="subRows"
            uniqueKey="_id"
            hideSelection={false}
            renderedFrom={renderedFrom}
            isClientSideGrid={true}
          />
        )}
      </Box>
      {addSerializedAssetDialog && (
        <AddSerializedAsset
          addSerializedAsset={handleAddSerializedAsset}
          handleSerializedAssetClose={() => {
            setAddSerializedAssetDialog(false);
          }}
          refrenceType={'Transfer Inventory'}
          refrenceData={null}
          isAdding={isAdding}
          selectedProducts={selectedRecords}
          filterByPlant={transferInventoryData?.transferFromPlant.optionValue}
        />
      )}
    </Fragment>
  );
};

export default SerialzedAssets;
