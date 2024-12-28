import { Box, Button, Chip, IconButton, Typography } from '@mui/material';
import Grid from '@mui/material/Grid2';
import { ControlPoint, ExpandLess, ExpandMore, InfoOutlined } from '@mui/icons-material';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import { Skeleton } from '@mui/material';
import { camelCase } from 'lodash';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { MdDelete } from 'react-icons/md';
import { useHistory, useParams } from 'react-router-dom';
import ActivityButton from 'src/components/Activity/ActivityButton';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import { DeleteButton, ThemeButton } from 'src/components/Helpers/Buttons';
import { useAppTheme } from 'src/constants/AppConfig';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import BoxWithBorder from '../../components/BoxWithBorder';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import HtmlTooltip from '../../components/CustomTooltipTitle';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import routes from '../../components/Helpers/Routes';
import CreateProduct from '../../components/Product/CreateProduct';
import DetailsPage from '../../components/Shared/DetailsPage';
import { extractFieldsForDisplay } from '../../constants/formulaUtility';
import { ACTIVITY_RESOURCE, MATERIAL_TYPE, product, productInventory, serializedAsset, sidebarResource } from '../../constants/helpers';
import ManageSerializedAsset from '../SerializedAsset/ManageSerializedAsset';
import CostDetails from './CostDetails';
import Digital from './Digital';
import InventoryHistory from './InventoryHistory';
import Package from './Package';
import ParentProduct from './ParentProduct';
import Parts from './Parts';
import ProductConfiguration from './ProductConfiguration';
import ProductRepairType from './RepairType';
import ServiceMaster from './ServiceMaster';
import ServicePackage from './ServicePackage';
import NonSerializedAssetProductInventory from './inventory';
import LeadTime from 'src/components/LeadTime';
import Step from 'src/pages/DynamicForm/Step';

const minHeight = '250px';

const ProductDetailsPage = () => {
  const [themeColor] = useAppTheme();
  const toastConfig = useContext(CustomToastContext);
  const renderedFrom = camelCase(sidebarResource.product);
  const { id } = useParams();
  const history = useHistory();
  const {
    state: { user, permissions, resources }
  }: any = useData();
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
  const [productInventoryLoading, setProductInventoryLoading] = useState(false);
  const [resourceData, setResourceData] = useState(null);

  useEffect(() => {
    if (id) {
      getProductFieldsAndData();
      fetchPolicy();
    }
  }, [id]);

  const fetchPolicy = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/dynamic-form/policy?resource=${sidebarResource.product}`);
      if (data) {
        setResourceData(data);
      }
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

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
            setCustomizedRoutes([{ ...routes.product, title: resources?.product?.titlePlural }, { title: `${data.productData.productName}` }]);
            if (data?.productData?.entity && data?.productData?.entity !== undefined) {
              data.productData.entity = user.entity
                ?.filter((d) => data?.productData?.entity?.some((e) => d._id === e))
                ?.map((d) => {
                  return { optionValue: d._id, optionLabel: d.entityName };
                });
            }
            setProductData(data.productData);
            setLoading(false);
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
        history.push(`${routes.product.path}`);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  const fetchProductInventoryData = () => {
    setProductInventoryLoading(true);
    axiosInstance()
      .get(`${productInventory.api}/product/${id}`)
      .then(async ({ data: { data } }) => {
        setProductInventoryData(data);
        setProductInventoryLoading(false);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setProductInventoryLoading(false);
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

  return (
    <Box className="main-container-v1">
      <Box className="headerbox-v1">
        <Box className="nav-v1">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Box>
        <Box className="controls-v1">
          <Box className="control-buttons-v1">
            {permissions?.product?.isUpdate && (
              <ThemeButton iconForMobile={<EditIcon />} onClick={handleOpenUpdateDialog} mobileTooltip={'Edit'}>
                {'Edit'}
              </ThemeButton>
            )}
            {permissions?.product?.isDelete && (
              <DeleteButton text={isMobile && !isTablet ? <MdDelete size={20} /> : 'Delete'} onClick={() => setShowConfirmBox(true)} />
            )}
            <ActivityButton referenceId={productData?._id} resource={ACTIVITY_RESOURCE.product} resourceLabel={productData?.productName} />
          </Box>
        </Box>
      </Box>
      <Box className={`detail-container-v1`}>
        <CustomTabs value={tabValue} onChange={handleMainTabChange} aria-label="Product Details Tab" variant="scrollable" scrollButtons="auto">
          <CustomTab value={0} className={'tabLayout'} label={'Details'} />
          {(permissions?.serializedAsset || permissions?.productionOrder) && <CustomTab value={1} label={'Child Products'} />}
          {permissions?.serviceMaster && <CustomTab value={2} label={'Services/Consumables'} />}
          {permissions?.serviceMaster && <CustomTab value={3} label={'Service Packages'} />}
          {permissions?.repairType && <CustomTab value={4} label={'Repair Types'} />}
          {permissions?.eCommercePolicy?.isRead && productData?.productTemplate && <CustomTab value={5} label={'Product Images'} />}
          {permissions?.packages && <CustomTab value={6} label={'Product Packages'} />}
          {(permissions?.serializedAsset || permissions?.productionOrder) && <CustomTab value={7} label={'Parent Products'} />}
          {permissions?.productInventory?.isRead && <CustomTab value={8} label={'History'} />}
          {productData?.digitalProduct && <CustomTab value={9} label={'Digital'} />}
          {resourceData &&
            resourceData?.tabs?.length > 0 &&
            resourceData?.tabs?.map((tab, i) => <CustomTab value={i + 10}>{tab?.tabName}</CustomTab>)}
        </CustomTabs>
        <TabPanel value={tabValue} index={0}>
          <Box>
            {loading || !productFields.length ? (
              <Grid container spacing={2} style={{ padding: '8px' }}>
                <CommonSkeleton lenArray={[...Array(10).keys()]} />
              </Grid>
            ) : (
              <div className="pb-3">
                <DetailsPage data={productData} fields={productFields} fullHeight={false} />
                <Box mt={3}>
                  <Grid size={{ xs: 12, sm: 12, md: 12, lg: 12 }} className={'form-v1'}>
                    <Grid container spacing={2}>
                      {permissions?.productInventory?.isRead && !user?.user?.brandPolicy?.hideInventoryCount && (
                        <Grid size={{ xs: 12, sm: 6, md: 4, xl: 3 }}>
                          <div style={{ overflow: 'hidden' }} className="single-form-v1">
                            <Box display={'flex'} justifyContent="space-between" className={'form-head-v1'}>
                              <Box display="flex" alignItems="center">
                                <Typography style={{ fontWeight: '600' }} className="form-label-style-v1" variant="subtitle2">
                                  {productData?.expenseItem ? 'Expense Quantity' : resources?.productInventory?.titleSingular}
                                </Typography>
                                <Box pl={1} display="flex">
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
                              <IconButton size="small" onClick={fetchProductInventoryData}>
                                <RefreshIcon fontSize="small" />
                              </IconButton>
                            </Box>

                            {!productInventoryLoading ? (
                              <Box className="formdata-v1" style={{ minHeight }}>
                                {productInventoryData?.filter((d) => d.inventory)?.length ? (
                                  <>
                                    <Box display="flex" justifyContent="space-between">
                                      <Typography className="table-head-v1">{resources?.warehouse?.titleSingular}</Typography>
                                      {user?.user?.brandPolicy?.storageLocation && (
                                        <Typography className="table-head-v1">{resources?.storageLocation?.titleSingular}</Typography>
                                      )}
                                      <Typography className="table-head-v1">Qty</Typography>
                                    </Box>
                                    {productInventoryData
                                      ?.filter((d) => d.inventory)
                                      .map(({ inventory, warehouse, storageLocation }) => (
                                        <Box display="flex" justifyContent="space-between">
                                          <Typography className="table-data-v1 bt-0 br-0">{warehouse?.name} </Typography>
                                          {user?.user?.brandPolicy?.storageLocation && (
                                            <Typography className="table-data-v1 bt-0 br-0">{storageLocation?.storageLocationName} </Typography>
                                          )}
                                          <Typography className="table-data-v1 bt-0">{inventory}</Typography>
                                        </Box>
                                      ))}
                                  </>
                                ) : (
                                  <Box textAlign="center" padding={2} minHeight={10}>
                                    <Typography>No Record Found</Typography>
                                  </Box>
                                )}
                              </Box>
                            ) : (
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
                            )}
                          </div>
                        </Grid>
                      )}
                      {permissions?.serializedAsset?.isRead && productData?.serializedProduct ? (
                        <Grid size={{ xs: 12, sm: 6, md: 4, xl: 3 }}>
                          <Box className="single-form-v1">
                            <Box className="form-head-v1" display="flex" justifyContent="space-between" alignItems="center">
                              <Typography variant="subtitle2">{resources?.serializedAsset?.titlePlural}</Typography>
                              <Box>
                                {permissions?.serializedAsset?.isCreate && (
                                  <IconButton
                                    title={`Create ${resources?.serializedAsset?.titleSingular}`}
                                    color="primary"
                                    size="small"
                                    onClick={() => {
                                      setOpenProductInventoryDialog(true);
                                    }}
                                  >
                                    <ControlPoint fontSize="small" />
                                  </IconButton>
                                )}
                                <IconButton size="small" onClick={getWarehouses}>
                                  <RefreshIcon fontSize="small" />
                                </IconButton>
                              </Box>
                            </Box>

                            <Box className="formdata-v1" style={{ minHeight }}>
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
                                    <Box
                                      display="flex"
                                      bgcolor="var(--dark-secondary, #f7f5f5)"
                                      borderRadius="3px"
                                      borderBottom="1px solid var(--dark-mode-border-color, #efe7e7)"
                                    >
                                      <Grid>
                                        <Grid size={{ xs: 8 }}>
                                          <Box display="flex" alignItems="center">
                                            <Box>
                                              <IconButton
                                                size="small"
                                                onClick={() => {
                                                  if (selectedWarehouse !== warehouse?.optionValue) {
                                                    setSelectedWarehouse(warehouse?.optionValue);
                                                  } else {
                                                    setSelectedWarehouse(null);
                                                  }
                                                }}
                                              >
                                                {selectedWarehouse === warehouse?.optionValue ? <ExpandLess /> : <ExpandMore />}
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
                                    <Box p={1} className="flex flex-wrap gap-2">
                                      {selectedWarehouse === warehouse?.optionValue ? (
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
                                                      const warehouseFilter = [
                                                        {
                                                          optionLabel: productWarehouseData.find(
                                                            (d) => d?.warehouse?.optionValue === selectedWarehouse
                                                          )?.warehouse?.optionLabel,
                                                          optionValue: selectedWarehouse
                                                        }
                                                      ];
                                                      const productFilter = [
                                                        {
                                                          optionLabel: productData?.productName,
                                                          optionValue: id
                                                        }
                                                      ];
                                                      window.open(
                                                        `${routes.serializedAsset.path}?warehouse=${encodeURIComponent(JSON.stringify(warehouseFilter))}&product=${encodeURIComponent(JSON.stringify(productFilter))}`,
                                                        '_blank'
                                                      );
                                                    }}
                                                  >
                                                    View All
                                                  </Button>
                                                ) : (
                                                  <Chip
                                                    label={i?.assetNumber}
                                                    style={{
                                                      background:
                                                        ['New', 'Available'].indexOf(i?.status) >= 0
                                                          ? `${themeColor === 'light' ? '#b9ffce' : 'rgb(70, 100, 79)'}`
                                                          : `${themeColor === 'light' ? '#ffb4b4' : 'rgb(144, 86, 86)'}`
                                                    }}
                                                    onClick={() => {
                                                      window.open(`${routes.serializedAssetDetail.path}/${i._id}`);
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
                                  <Typography>No {resources?.serializedAsset?.titlePlural} Found</Typography>
                                </Box>
                              )}
                            </Box>
                          </Box>
                        </Grid>
                      ) : null}
                      {permissions?.productInventory?.isRead && (
                        <Grid size={{ xs: 12, sm: 6, md: 4, xl: 3 }}>
                          <CostDetails product={id} productData={productData} minHeight={minHeight} />
                        </Grid>
                      )}
                      <Grid size={{ xs: 12, sm: 6, md: 4, xl: 3 }}>
                        <LeadTime referenceType={MATERIAL_TYPE.product} referenceId={id} referenceLabel={productData?.productName} />
                      </Grid>
                    </Grid>
                  </Grid>
                </Box>
              </div>
            )}
          </Box>
        </TabPanel>
        <TabPanel value={tabValue} index={1}>
          <Parts id={id} />
        </TabPanel>
        <TabPanel value={tabValue} index={2}>
          <ServiceMaster id={id} renderedFrom={`${renderedFrom}_grid-2`} />
        </TabPanel>
        <TabPanel value={tabValue} index={3}>
          <ServicePackage renderedFrom={`${renderedFrom}_grid-3`} productId={id} />
        </TabPanel>
        <TabPanel value={tabValue} index={4}>
          <ProductRepairType id={id} renderedFrom={`${renderedFrom}_grid-4`} />
        </TabPanel>
        <TabPanel value={tabValue} index={5}>
          <ProductConfiguration
            productFields={productFields.map((_f: any) => _f.fieldData)}
            productData={productData}
            id={id}
            renderedFrom={`${renderedFrom}_grid-5`}
          />
        </TabPanel>
        <TabPanel value={tabValue} index={6}>
          <Package renderedFrom={`${renderedFrom}_grid-6`} productId={id} />
        </TabPanel>
        <TabPanel value={tabValue} index={7}>
          <ParentProduct renderedFrom={`${renderedFrom}_grid-7`} productId={id} />
        </TabPanel>
        <TabPanel value={tabValue} index={8}>
          <InventoryHistory id={id} />
        </TabPanel>
        <TabPanel value={tabValue} index={9}>
          <Digital renderedFrom={`${renderedFrom}_grid-8`} productId={id} />
        </TabPanel>
        {resourceData &&
          resourceData?.tabs?.length > 0 &&
          resourceData?.tabs?.map((tab, i) => {
            return (
              <TabPanel value={tabValue} index={i + 10}>
                <Step
                  tab={tab}
                  resourcePolicyId={resourceData?._id}
                  resourceId={id}
                  resource={sidebarResource.product}
                  data={productData}
                  allowedToEdit={permissions?.product?.isUpdate}
                />
              </TabPanel>
            );
          })}
      </Box>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this product : ${headingLabel} ?`}
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
              setSelectedWarehouse(null);
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
