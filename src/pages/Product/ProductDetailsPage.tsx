import { useState, useEffect, useContext, Fragment, useReducer } from 'react';
import { Grid, Box, Button, Typography, IconButton, Paper, Chip, List, ListItem, ListItemText, ListItemSecondaryAction } from '@material-ui/core';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import { ControlPoint, ExpandLess, ExpandMore, InfoOutlined } from '@material-ui/icons';
import { Skeleton, ToggleButtonGroup, ToggleButton } from '@material-ui/lab';
import { useParams, useHistory, Link } from 'react-router-dom';
import axiosInstance from '../../axios/axiosInstance';
import routes from '../../components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import DetailsPageHeader from '../../components/DetailsPageHeader';
import DetailsPage from '../../components/Shared/DetailsPage';
import { useData } from '../../StateProvider/Provider';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { product, productInventory, serializedAsset, warehouse } from '../../constants/helpers';
import CreateProduct from '../../components/Product/CreateProduct';
import BoxWithBorder from '../../components/BoxWithBorder';
import DeleteButton from '../../components/Helpers/DeleteButton';
import ManageSerializedAsset from '../SerializedAsset/ManageSerializedAsset';
import { extractFieldsForDisplay } from '../../constants/formulaUtility';
import HtmlTooltip from '../../components/CustomTooltipTitle';
import CustomAgGrid, { reducer, intialState } from '../../components/AgGridComponents/CustomAgGrid';
import { CommonRenderer, CreatedByRenderer, UpdatedByRenderer } from '../../components/AgGridComponents/CustomAgGridCellRenderers';
import NoDataCell from '../../components/Helpers/NoDataCell';
import queryString from 'query-string';
import ProductConfiguration from './ProductConfiguration';
import { camelCase } from 'lodash';
import Parts from './Parts';
import ParentProduct from './ParentProduct';
import NonSerializedAssetProductInventory from './inventory';
import ProductRepairType from './RepairType';
import { MdDelete } from 'react-icons/md';
import { isMobile, isTablet } from 'react-device-detect';
import { BiEdit } from 'react-icons/bi';
import InventoryHistory from './InventoryHistory';
import CostDetails from './CostDetails';
import ServiceMaster from './ServiceMaster';
import LeadTimeMaster from '../../components/LeadTime';
import Package from './Package';
import ServicePackage from './ServicePackage';
import Digital from './Digital';

interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

const ProductDetailsPage = () => {
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = camelCase(routes?.product.title);
  const { id } = useParams();
  const history = useHistory();
  const {
    state: { user, permissions }
  }: any = useData();
  const parsed = queryString.parse(history.location.search);
  const { openEdit } = parsed;
  const [headingLabel, setHeadingLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingWarehouse, setLoadingWarehouse] = useState(false);
  const [productData, setProductData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [productFields, setProductFields] = useState([]);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);
  const [inventoriesData, setInventoriesData] = useState([]);
  const [inventoriesWarehouse, setWarehouseInventories] = useState([]);
  const [inventoriesWarehouseLoading, setWarehouseInventoriesLoading] = useState(false);
  const [productWarehouseData, setProductWarehouseData] = useState([]);
  const [tabValue, setTabValue] = useState(0);
  const [selectedWarehouse, setSelectedWarehouse] = useState(null);
  const [openProductInventoryDialog, setOpenProductInventoryDialog] = useState(false);

  const ignoreField = ['priceTemplate', 'brand'];

  const [showConfirmBoxConvert, setShowConfirmBoxConvert] = useState(false);
  const [productInventoryData, setProductInventoryData] = useState([]);

  useEffect(() => {
    if (id) {
      getProductFieldsAndData();
    }
  }, [id]);

  useEffect(() => {
    if (permissions?.serializedAsset) {
      if (productData) {
        getWarehouses();
      }
    }
  }, [productData]);

  useEffect(() => {
    if (selectedWarehouse) {
      setWarehouseInventoriesLoading(true);
      axiosInstance()
        .get(
          `${serializedAsset.api}?limit=6&filterById=[{"field":"warehouse","term":"${selectedWarehouse}"},{"field":"product","term":"${id}"}]&filterByIdType=and`
        )
        .then(({ data: { data } }) => {
          setWarehouseInventories(data);
          setWarehouseInventoriesLoading(false);
        })
        .catch((err) => {
          setWarehouseInventoriesLoading(false);
        });
    }
  }, [selectedWarehouse]);

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  const getProductFieldsAndData = () => {
    setLoading(true);
    axiosInstance()
      .get('/field?resource=Product')
      .then(({ data: { data } }) => {
        const _productField: any = [];
        const filteredData = data.filter((obj) => obj.isRead);
        filteredData.forEach((_f) => {
          if (!ignoreField.includes(_f.fieldData.fieldName)) {
            _productField.push(_f.fieldData);
          }
        });
        const _fields = [];
        _productField.map((_f) => _fields.push({ fieldData: _f }));
        var newField = _fields;
        axiosInstance()
          .get(`/product/` + id)
          .then(({ data: { data } }) => {
            data.fields?.map((_f) => newField.push({ fieldData: _f }));
            data.productData.fields?.map((_f) => newField.push({ fieldData: _f }));
            var fields = [];
            newField.forEach((_f) => {
              fields.push(_f.fieldData);
            });
            fields = extractFieldsForDisplay(fields);
            newField = [];
            fields.forEach((_f) => {
              newField.push({ fieldData: _f });
            });
            setProductFields(newField.filter((d) => !ignoreField.includes(d?.fieldData?.fieldName)));
            setHeadingLabel(
              data.productData?.productNumber
                ? `${data.productData?.productName} - ${data.productData?.productNumber}`
                : data.productData?.productName
            );
            setCustomizedRoutes([routes.product, { title: `${data.productData.productName}` }]);
            if (data?.productData?.entity && data?.productData?.entity !== undefined) {
              data.productData.entity = user.entity
                ?.filter((d) => data?.productData?.entity?.some((e) => d._id === e))
                ?.map((d) => {
                  return { optionValue: d._id, optionLabel: d.entityName };
                });
            }
            setProductData(data.productData);
            setLoading(false);
            if (openEdit === 'true') {
              setOpenUpdateDialog(true);
              const params = new URLSearchParams();
              params.delete('openEdit');
              history.push({ search: params.toString() });
            }
          })
          .catch((error) => {
            toastConfig.setToastConfig(error);
            setLoading(false);
          });
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${product.api}/remove`, { ids: [id] })
      .then(() => {
        setShowConfirmBox(false);
        history.goBack();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  const getWarehouses = () => {
    setLoadingWarehouse(true);
    axiosInstance()
      .get(`${productInventory.api}/product/${id}`)
      .then(async ({ data: { data } }) => {
        setProductInventoryData(data);
        setLoadingWarehouse(false);
      })
      .catch((err) => {
        setLoadingWarehouse(false);
        toastConfig.setToastConfig(err);
      });
    if (productData?.serializedProduct) {
      axiosInstance()
        .get(`product/${id}/warehouse`)
        .then(async ({ data: { data } }) => {
          data = data?.filter((e) => e.warehouse);
          setProductWarehouseData(data);
          setInventoriesData(data);
          setLoadingWarehouse(false);
        })
        .catch((err) => {
          setLoadingWarehouse(false);
          toastConfig.setToastConfig(err);
        });
    }
  };

  const handleConvertSerialized = () => {
    axiosInstance()
      .post(`${product.api}/non-serialized-to-serialized`, { products: [id] })
      .then(() => {
        setShowConfirmBoxConvert(false);
        getProductFieldsAndData();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBoxConvert(false);
      });
  };

  function a11yProps(index: any) {
    return {
      id: `main-tab-${index}`,
      'aria-controls': `main-tabpanel-${index}`
    };
  }

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {permissions?.product?.isUpdate && (
              <Button
                variant={isMobile && !isTablet ? 'text' : 'contained'}
                className={'btn-outline-v1'}
                size="small"
                onClick={handleOpenUpdateDialog}
              >
                {isMobile && !isTablet ? <BiEdit size={20} /> : 'Edit'}
              </Button>
            )}
            {permissions?.product?.isDelete && (
              <DeleteButton text={isMobile && !isTablet ? <MdDelete size={20} /> : 'Delete'} onClick={() => setShowConfirmBox(true)} />
            )}
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <Tabs
          className="new-tab-container-v1"
          variant="scrollable"
          scrollButtons="auto"
          value={tabValue}
          onChange={handleMainTabChange}
          indicatorColor="primary"
          textColor="primary"
          aria-label="Product Details Tab"
          TabIndicatorProps={{
            style: {
              height: 0
            }
          }}
        >
          <Tab className={'tabLayout'} value={0} label={<div className="d-flex align-items-center tab-font">Details</div>} {...a11yProps(0)} />

          {permissions?.serializedAsset && (
            <Tab
              className={'tabLayout'}
              value={1}
              label={<div className="d-flex align-items-center tab-font">Child Product</div>}
              {...a11yProps(1)}
            />
          )}

          {permissions?.serviceMaster && (
            <Tab className={'tabLayout'} value={2} label={<div className="d-flex align-items-center tab-font">Services</div>} {...a11yProps(2)} />
          )}

          {permissions?.serviceMaster && (
            <Tab
              className={'tabLayout'}
              value={3}
              label={<div className="d-flex align-items-center tab-font">Service Packages</div>}
              {...a11yProps(3)}
            />
          )}

          {permissions?.repairType && (
            <Tab className={'tabLayout'} value={4} label={<div className="d-flex align-items-center tab-font">Repair Types</div>} {...a11yProps(4)} />
          )}

          {permissions?.eCommercePolicy?.isRead && productData?.productTemplate && (
            <Tab
              className={'tabLayout'}
              value={5}
              label={<div className="d-flex align-items-center tab-font">Product Images</div>}
              {...a11yProps(5)}
            />
          )}

          {permissions?.packages && (
            <Tab
              className={'tabLayout'}
              value={6}
              label={<div className="d-flex align-items-center tab-font">Product Packages</div>}
              {...a11yProps(6)}
            />
          )}

          {permissions?.serializedAsset && (
            <Tab
              className={'tabLayout'}
              value={7}
              label={<div className="d-flex align-items-center tab-font">Parent Product</div>}
              {...a11yProps(7)}
            />
          )}

          {permissions?.productInventory?.isRead && (
            <Tab className={'tabLayout'} value={8} label={<div className="d-flex align-items-center tab-font">History</div>} {...a11yProps(8)} />
          )}

          {productData?.digitalProduct && (
            <Tab className={'tabLayout'} value={9} label={<div className="d-flex align-items-center tab-font">Digital</div>} {...a11yProps(9)} />
          )}
        </Tabs>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={12} md={8} lg={8}>
            {tabValue === 0 && (
              <Box>
                {loading || !productFields.length ? (
                  <Grid container spacing={2} style={{ padding: '8px' }}>
                    <CommonSkeleton lenArray={[...Array(7).keys()]} />
                  </Grid>
                ) : (
                  <div className="pb-3">
                    <DetailsPage data={productData} fields={productFields} />
                  </div>
                )}
              </Box>
            )}
            {tabValue === 1 && <Parts id={id} />}
            {tabValue === 2 && <ServiceMaster id={id} renderedFrom={`${renderedFrom}_grid-2`} />}
            {tabValue === 3 && <ServicePackage renderedFrom={`${renderedFrom}_grid-3`} productId={id} />}
            {tabValue === 4 && <ProductRepairType id={id} renderedFrom={`${renderedFrom}_grid-4`} />}
            {tabValue === 5 && (
              <ProductConfiguration
                productFields={productFields.map((_f: any) => _f.fieldData)}
                productData={productData}
                id={id}
                renderedFrom={`${renderedFrom}_grid-5`}
              />
            )}
            {tabValue === 6 && <Package renderedFrom={`${renderedFrom}_grid-6`} productId={id} />}
            {tabValue === 7 && <ParentProduct renderedFrom={`${renderedFrom}_grid-6`} productId={id} />}
            {tabValue === 8 && <InventoryHistory id={id} />}
            {tabValue === 9 && <Digital renderedFrom={`${renderedFrom}_grid-8`} productId={id} />}
          </Grid>
          <Grid item xs={12} sm={12} md={4} lg={4} className={'form-v1'}>
            {permissions?.productInventory?.isRead && (
              <Box mb={2}>
                <div style={{ overflow: 'hidden' }} className="single-form-v1">
                  <Box display={'flex'} className={'form-head-v1'}>
                    <Typography className="form-label-style-v1" variant="subtitle2">
                      {routes?.productInventory?.title}
                    </Typography>
                    <Box pl={1}>
                      <IconButton
                        size="small"
                        onClick={() => {
                          history.push(`${routes.productInventory.path}`, { product: id, productName: productData?.productName });
                        }}
                      >
                        <InfoOutlined fontSize="small" />
                      </IconButton>
                    </Box>
                  </Box>
                  <Box className="formdata-v1">
                    {productInventoryData?.filter((d) => d.inventory)?.length ? (
                      <>
                        <Box display="flex" justifyContent="space-between">
                          <Typography className="table-head-v1">{routes.warehouse.title}</Typography>
                          <Typography className="table-head-v1">Qty</Typography>
                        </Box>
                        <Box display="flex" justifyContent="space-between">
                          {productInventoryData
                            ?.filter((d) => d.inventory)
                            .map(({ inventory, warehouse }) => (
                              <>
                                <Typography className="table-data-v1  bt-0 br-0">{warehouse?.name} </Typography>
                                <Typography className="table-data-v1  bt-0">{inventory}</Typography>
                              </>
                            ))}
                        </Box>
                      </>
                    ) : (
                      <Box textAlign="center" padding={2} minHeight={100}>
                        <Typography>No {routes.productInventory.title} Found</Typography>
                      </Box>
                    )}
                    {permissions?.product?.isUpdate && permissions?.serializedAsset?.isCreate && productData?.serializedProduct === false && (
                      <Box pt={1}>
                        <Button
                          variant={'outlined'}
                          color="primary"
                          onClick={() => {
                            setShowConfirmBoxConvert(true);
                          }}
                          size="small"
                        >
                          Convert to Serialized Product
                        </Button>
                        {showConfirmBoxConvert && (
                          <ConfirmationDialog
                            open={showConfirmBoxConvert}
                            message={`Are you sure you want to convert serialized product ?`}
                            onClose={() => {
                              setShowConfirmBoxConvert(false);
                            }}
                            onOk={handleConvertSerialized}
                          />
                        )}
                      </Box>
                    )}
                  </Box>
                </div>
              </Box>
            )}
            {permissions?.serializedAsset?.isRead && productData?.serializedProduct ? (
              <Box className="single-form-v1">
                <Box className="form-head-v1" display="flex" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle2">{routes?.serializedAsset?.title}</Typography>
                  {permissions?.serializedAsset?.isCreate && (
                    <IconButton
                      title="Manage Plant(s)"
                      color="primary"
                      size="small"
                      onClick={() => {
                        setOpenProductInventoryDialog(true);
                      }}
                    >
                      <ControlPoint fontSize="small" />
                    </IconButton>
                  )}
                </Box>

                <Box className="formdata-v1">
                  {loading || loadingWarehouse ? (
                    [1, 2].map((i) => (
                      <BoxWithBorder
                        key={i}
                        style={{
                          margin: '8px'
                        }}
                      >
                        <Box padding={1}>
                          <Skeleton variant="text" width="100px" height="20px" />
                          <Box marginTop={1} />
                          <Skeleton variant="text" width="100%" height="15px" />
                        </Box>
                      </BoxWithBorder>
                    ))
                  ) : inventoriesData?.length ? (
                    inventoriesData?.map(({ products, warehouse, plant, count }, i) => (
                      <Box key={i} pb={1}>
                        <Box display="flex" bgcolor="#f7f5f5" borderRadius="3px" borderBottom="1px solid #efe7e7">
                          <Grid>
                            <Grid item xs={8}>
                              <Box display="flex" alignItems="center">
                                <Box>
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      if (selectedWarehouse !== warehouse?.optionValue ?? plant?.optionValue) {
                                        setSelectedWarehouse(warehouse?.optionValue ?? plant?.optionValue);
                                      } else {
                                        setSelectedWarehouse(null);
                                      }
                                    }}
                                  >
                                    {selectedWarehouse === warehouse?.optionValue ?? plant?.optionValue ? <ExpandLess /> : <ExpandMore />}
                                  </IconButton>
                                </Box>
                                <Box ml={1} display="flex" alignItems="center">
                                  <Typography
                                    variant="subtitle2"
                                    color="primary"
                                    className="d-flex align-items-center"
                                    style={{ display: 'inline-block', whiteSpace: 'nowrap' }}
                                  >
                                    {warehouse?.optionLabel} ({count || 0})
                                  </Typography>
                                  <Box mx={1} />
                                  <HtmlTooltip
                                    arrow
                                    interactive
                                    title={
                                      <>
                                        <Typography>Asset Status: </Typography>
                                        {products.map((s) => (
                                          <Typography>{`(${s?.count}) ${s?.status}`}</Typography>
                                        ))}
                                      </>
                                    }
                                  >
                                    <IconButton size="small">
                                      <InfoOutlined fontSize="small" />
                                    </IconButton>
                                  </HtmlTooltip>
                                </Box>
                              </Box>
                            </Grid>
                          </Grid>
                        </Box>
                        <Box p={1}>
                          {selectedWarehouse === warehouse?.optionValue ?? plant?.optionValue ? (
                            inventoriesWarehouseLoading ? (
                              <Typography
                                variant="subtitle2"
                                color="primary"
                                className="d-flex align-items-center"
                                style={{ display: 'inline-block', whiteSpace: 'nowrap' }}
                              >
                                Loading
                              </Typography>
                            ) : (
                              inventoriesWarehouse.map((i, index) => (
                                <Fragment key={i._id}>
                                  {i?.assetNumber ? (
                                    index === 5 ? (
                                      <Button
                                        fullWidth
                                        className="mt-3"
                                        variant="outlined"
                                        color="primary"
                                        size="small"
                                        onClick={() => {
                                          history.push(`${routes.serializedAsset.path}`, {
                                            warehouse: productWarehouseData.find((d) => d?.warehouse?.optionValue === selectedWarehouse).warehouse,
                                            product: { id: id, name: headingLabel }
                                          });
                                        }}
                                      >
                                        View All
                                      </Button>
                                    ) : (
                                      <Chip
                                        label={i?.assetNumber}
                                        style={{
                                          marginRight: '2px',
                                          background: ['New', 'Available'].indexOf(i?.status) >= 0 ? '#b9ffce' : '#ffb4b4'
                                        }}
                                        onClick={() => {
                                          history.push({ pathname: `${routes.serializedAssetDetail.path}/${i._id}` });
                                        }}
                                      />
                                    )
                                  ) : null}
                                </Fragment>
                              ))
                            )
                          ) : null}
                        </Box>
                      </Box>
                    ))
                  ) : (
                    <Box textAlign="center" padding={2} minHeight={100}>
                      <Typography>No {routes.serializedAsset.title} Found</Typography>
                    </Box>
                  )}
                </Box>
              </Box>
            ) : null}
            {permissions?.productInventory?.isRead && (
              <Box mb={2}>
                <CostDetails product={id} productData={productData} />
              </Box>
            )}
            {permissions?.leadTimeMaster?.isRead && (
              <Box mb={2}>
                <LeadTimeMaster Id={id} type={'product'} />
              </Box>
            )}
          </Grid>
        </Grid>
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this product ${headingLabel} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <CreateProduct
          isClone={false}
          productId={id}
          handleClose={() => {
            setOpenUpdateDialog(false);
            getProductFieldsAndData();
          }}
          openFrom="productMaster"
        />
      )}
      {openProductInventoryDialog ? (
        productData?.serializedProduct ? (
          <ManageSerializedAsset
            productId={productData?._id}
            productCategory={productData?.productCategory}
            productInventoryId={null}
            onClose={() => setOpenProductInventoryDialog(false)}
            onSuccess={() => {
              setOpenProductInventoryDialog(false);
              if (permissions?.serializedAsset) {
                getWarehouses();
              }
            }}
          />
        ) : (
          <NonSerializedAssetProductInventory
            productId={id}
            productInventoryData={inventoriesData}
            onSuccess={() => {
              setOpenProductInventoryDialog(false);
              if (permissions?.serializedAsset) {
                getWarehouses();
              }
            }}
            onClose={() => setOpenProductInventoryDialog(false)}
          />
        )
      ) : null}
    </Box>
  );
};

export default ProductDetailsPage;
