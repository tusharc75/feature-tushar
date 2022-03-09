import React, { useState, useEffect, useContext, Fragment, useReducer } from 'react';
import { Grid, Box, Button, Paper, Tabs, Tab } from '@material-ui/core';
import { Add } from '@material-ui/icons';
import { Skeleton } from '@material-ui/lab';
import { useParams, useHistory } from 'react-router-dom';
import axiosInstance from '../../axios/axiosInstance';
import routes from '../../components/Helpers/Routes';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import DetailsPageHeader from '../../components/DetailsPageHeader';
import DetailsPage from '../../components/Shared/DetailsPage';
import { useData } from '../../StateProvider/Provider';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { packages, product } from '../../constants/helpers';
import ManagePackageDialog from './ManagePackageDialog';
import DeleteButton from '../../components/Helpers/DeleteButton';
import AssignQuantityDialog from '../../components/Helpers/AssignQuantityDialog';
import ProductsTable from './ProductsTable';
import ImportExportLinks from '../../components/Helpers/ImportExportLinks';
import styles from './packages.module.scss';
import { FaWpforms } from 'react-icons/fa';
import { BiFoodMenu } from 'react-icons/bi';

import CustomSwipableList from '../../components/SwipableListComponents/CustomSwipableList';
import { camelCase } from 'lodash';
import AssignProductDialog from 'src/components/AssignRolesDialog/AssignProductDialog';

interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div role="tabpanel" hidden={value !== index} id={`main-tabpanel-${index}`} aria-labelledby={`main-tab-${index}`} {...other}>
      {children}
    </div>
  );
}

function a11yProps(index: any) {
  return {
    id: `main-tab-${index}`,
    'aria-controls': `main-tabpanel-${index}`
  };
}

const PackageDetails = () => {
  const renderedFrom = camelCase(routes?.packages.title);
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();
  const {
    state: { user, permissions }
  }: any = useData();
  const [headingLabel, setHeadingLabel] = useState('');
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [isRemovingProducts, setRemovingProducts] = useState(false);
  const [packageData, setPackageData] = useState(null);
  const [products, setProducts] = useState([]);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [showProductConfirmBox, setShowProductConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [quantityUpdateLoading, setQuantityUpdateLoading] = useState(false);
  const [packageFields, setPackageFields] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);
  const [showProductAssignDialog, setShowProductAssignDialog] = useState(false);
  const [selectedRecords, setSelectedRecords] = useState([]);

  const [tabValue, setTabValue] = useState(0);

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    if (id) {
      fetchPackage();
      getProducts();
    }
  }, [id]);

  const getRessourceFields = () => {
    setPackagesLoading(true);
    axiosInstance()
      .get('/field?resource=Packages')
      .then(({ data: { data } }) => {
        setPackageFields(data);
        setPackagesLoading(false);
      })
      .catch((err) => {
        setPackagesLoading(false);
        toastConfig.setToastConfig(err);
      });
  };

  const fetchPackage = () => {
    setPackagesLoading(true);
    axiosInstance()
      .get(`${packages.packageApi}/${id}`)
      .then(({ data: { data } }) => {
        setPackageData(data);
        setHeadingLabel(data.packageName);
        setCustomizedRoutes([routes.packages, { title: data.packageName }]);
        getRessourceFields();
      })
      .catch((err) => {
        setPackagesLoading(false);
        toastConfig.setToastConfig(err);
      });
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const handleDelete = () => {
    axiosInstance()
      .put(`${packages.packageApi}/remove`, { ids: [id] })
      .then(() => {
        setShowConfirmBox(false);
        history.goBack();
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        setShowConfirmBox(false);
      });
  };

  const getProducts = () => {
    setLoadingProducts(true);
    axiosInstance()
      .get(`${packages.packageApi}/get-products/${id}`)
      .then(({ data: { data } }) => {
        setProducts(data);
        setLoadingProducts(false);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setLoadingProducts(false);
      });
  };

  const handleUpdateQuantity = (row) => {
    axiosInstance()
      .put(`${packages.packageApi}/${id}/update-product`, {
        ids: [row.data._id],
        qty: Number(row.data.qty)
      })
      .then(() => {
        getProducts();
      })
      .catch((err) => {
      });
  };

  const removeProducts = () => {
    setRemovingProducts(true);
    const Ids = products.filter((p) => selectedRecords.findIndex((_p) => _p._id === p._id) >= 0).map((d) => d._id);
    axiosInstance()
      .put(`${packages.packageApi}/${id}/remove-product`, {
        ids: Ids
      })
      .then(() => {
        setRemovingProducts(false);
        setShowProductConfirmBox(false);
        getProducts();
      })
      .catch((err) => {
        setShowProductConfirmBox(false);
        setRemovingProducts(false);
        toastConfig.setToastConfig(err);
      });
  };

  return (
    <>
      <Grid container className="headerbox">
        <CustomBreadCrumbs routes={customizedRoutes} />
      </Grid>
      <Grid container spacing={1} className="detail-container">
        <Grid item xs={12} sm={12} md={12} lg={12}>
          <Paper>
            {!packageData ? (
              <div>
                <Skeleton variant="text" width="150px" height="40px" />
                <Box display="flex">
                  <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                  <Box marginX={1} />
                  <Skeleton style={{ borderRadius: 6 }} width="120px" height="80px" />
                </Box>
              </div>
            ) : (
              <DetailsPageHeader heading={headingLabel} mainPoints={mainPoints} showHeading={true}>
                {permissions?.packages?.isUpdate && (
                  <Button variant="contained" color="primary" size="small" onClick={handleOpenUpdateDialog}>
                    Edit
                  </Button>
                )}
                {permissions?.packages?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
              </DetailsPageHeader>
            )}

            <Box>
              {packagesLoading || !packageFields.length ? (
                <Grid container spacing={2} style={{ padding: '8px' }}>
                  <CommonSkeleton lenArray={[...Array(7).keys()]} />
                </Grid>
              ) : (
                <>
                  <Tabs
                    className="quote-tab"
                    value={tabValue}
                    onChange={handleMainTabChange}
                    textColor="primary"
                    TabIndicatorProps={{
                      style: {
                        display: 'none'
                      }
                    }}
                  >
                    <Tab
                      className={'tabLayout'}
                      style={{
                        background: tabValue === 1 ? 'white' : '',
                        color: tabValue === 1 ? '#163340' : '#163340'
                      }}
                      label={
                        <div className="d-flex align-items-center tab-font">
                          <FaWpforms className="mr-1" fontSize="inherit" /> Header
                        </div>
                      }
                      {...a11yProps(0)}
                    />
                    <Tab
                      className={'tabLayout'}
                      style={{
                        background: tabValue === 2 ? 'white' : '',
                        color: tabValue === 2 ? 'blue' : '#163340'
                      }}
                      label={
                        <div className="d-flex align-items-center tab-font">
                          <BiFoodMenu className="mr-1" fontSize="inherit" /> Details
                        </div>
                      }
                      {...a11yProps(1)}
                    />
                    <div className={'uio'}> </div>
                  </Tabs>

                  <TabPanel value={tabValue} index={0}>
                    <DetailsPage data={packageData} fields={packageFields} />
                  </TabPanel>

                  <TabPanel value={tabValue} index={1}>
                    <Box mt={2} className="bg-white">
                      <Box mb={1} p={1} display="flex" justifyContent="space-between" alignItems="center">
                        <Box width={'118px'}>
                          <Button variant="contained" color="primary" size="small" onClick={() => setShowProductAssignDialog(true)}>
                            Add Products
                          </Button>
                        </Box>
                        <>
                          <ImportExportLinks
                            permissions={permissions?.packages}
                            module="packages-products"
                            api={`${packages.packageApi}/package-products`}
                            afterImportCompleted={() => {
                              getProducts();
                            }}
                            isExportAllOrSomeFeature={true}
                            total={products?.length}
                            recordsToExport={products.length}
                            ids={[]}
                            additionalParams={`refrenceId=${id}`}
                            isBackgroundWhite={true}
                          />
                          <Box ml={1}>
                            <DeleteButton
                              disabled={selectedRecords.length === 0 || isRemovingProducts}
                              text={'Delete'}
                              onClick={() => {
                                setShowProductConfirmBox(true);
                              }}
                            />
                          </Box>
                        </>
                      </Box>
                      <ProductsTable
                        setSelectedRecords={setSelectedRecords}
                        allowSelection={true}
                        renderedFrom={`${renderedFrom}_grid-1`}
                        productList={products}
                        handleUpdateQuantity={handleUpdateQuantity}
                        handleAssignProduct={setShowProductAssignDialog}
                        updateLoading={quantityUpdateLoading || packagesLoading}
                      />
                    </Box>
                  </TabPanel>
                </>
              )}
            </Box>
          </Paper>
        </Grid>
      </Grid>
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete this package: ${headingLabel} ?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDelete}
        />
      )}
      {openUpdateDialog && (
        <ManagePackageDialog
          open={openUpdateDialog}
          isClone={false}
          packageId={id}
          onClose={() => {
            setOpenUpdateDialog(false);
          }}
          onSuccess={() => {
            fetchPackage();
            setOpenUpdateDialog(false);
          }}
        />
      )}
      {showProductAssignDialog && (
        <AssignProductDialog
          reference="package"
          productsDialogOpen={true}
          productId={id}
          handleCloseDialog={() => setShowProductAssignDialog(false)}
          assignedProducts={products}
          onSuccess={() => {
            getProducts();
            setShowProductAssignDialog(false);
          }}
        />
      )}
      {showProductConfirmBox && (
        <ConfirmationDialog
          open={showProductConfirmBox}
          message={`Are you sure you want to delete the product(s) ?`}
          onClose={() => {
            setShowProductConfirmBox(false);
          }}
          okBtnLoading={isRemovingProducts}
          onOk={removeProducts}
        />
      )}
    </>
  );
};

export default PackageDetails;
