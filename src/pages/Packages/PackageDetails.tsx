import React, { useState, useEffect, useContext, Fragment, useReducer } from 'react';
import {
  Grid,
  Box,
  Button,
  Paper, Tabs, Tab
} from '@material-ui/core';
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
import styles from './packages.module.scss'
import {FaWpforms} from "react-icons/fa";
import {BiFoodMenu} from "react-icons/bi";

import CustomSwipableList from "../../components/SwipableListComponents/CustomSwipableList";

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
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();
  const {
    state: { user, permissions }
  }: any = useData();
  const [headingLabel, setHeadingLabel] = useState('');
  const [packagesLoading, setPackagesLoading] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [packageData, setPackageData] = useState(null);
  const [products, setProducts] = useState([]);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [quantityUpdateLoading, setQuantityUpdateLoading] = useState(false);
  const [packageFields, setPackageFields] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);
  const [showProductAssignDialog, setShowProductAssignDialog] = useState(false);

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
      .get(`${routes.packages.path}/${id}`)
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
    setLoadingProducts(true)
    axiosInstance()
      .get(`${packages.packageApi}/get-products/${id}`)
      .then(({ data: { data } }) => {
        setProducts(data);
        setLoadingProducts(false)
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
        setLoadingProducts(false)
      });
  };

  const handleUpdateQuantity = (updatedNode) => {
    let productsToSend = [...products];
    productsToSend = productsToSend.map(o => {
      let res = { product: o?._id, qty: o?.qty }
      if (updatedNode?.data?._id === o?._id) {
        res.qty = (updatedNode?.newValue * 1)
      }
      return res
    })
    setQuantityUpdateLoading(true);
    axiosInstance()
      .post(`${packages.packageApi}/add-products`, {
        ids: [packageData._id],
        products: [...productsToSend]
      })
      .then(() => {
        setQuantityUpdateLoading(false)
        getProducts()
      })
      .catch((err) => {
        setQuantityUpdateLoading(false)
      });
  }
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
                    <Box mb={1}>
                      <div className={`p-2 gap-3 ${styles.package_grid_template}`}>
                        <h3>Product(s)</h3>
                        <ImportExportLinks
                            permissions={permissions?.packages}
                            module="packages-products"
                            api={packages.packageApi}
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
                        <Button className="text-transform-none" variant="outlined" color="primary" startIcon={<Add />} size="small" onClick={() => setShowProductAssignDialog(true)}>
                          Assign Product(s)
                        </Button>
                      </div>
                    </Box>

                    {
                      products.length ?
                          <ProductsTable
                              productList={products}
                              handleUpdateQuantity={handleUpdateQuantity}
                              updateLoading={quantityUpdateLoading || packagesLoading}
                          /> : null
                    }

                  </Box>



                </TabPanel>


                </>
              )}
            </Box>
          </Paper>

          {/* {
            packageData?.products ?
              <ProductsTable
                productList={packageData?.products}
              /> : null
          } */}

        </Grid>
      </Grid>

      {
        showConfirmBox && (
          <ConfirmationDialog
            open={showConfirmBox}
            message={`Are you sure you want to delete this package: ${headingLabel} ?`}
            onClose={() => {
              setShowConfirmBox(false);
            }}
            onOk={handleDelete}
          />
        )
      }
      {
        openUpdateDialog && (
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
        )
      }
      {
        showProductAssignDialog && (
          <AssignQuantityDialog
            ids={[id]}
            onClose={() => setShowProductAssignDialog(false)}
            onSuccess={() => {
              getProducts();
              setShowProductAssignDialog(false);
            }}
            resource={product.api}
            title="Assign Products"
            label='Select Product'
            resourceData={products}
          />
        )
      }
    </>
  );
};

export default PackageDetails;
