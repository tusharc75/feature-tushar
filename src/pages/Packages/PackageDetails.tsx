import { useState, useEffect, useContext, Fragment } from 'react';
import { Grid, Box, Button, Paper, Typography, IconButton, List, ListItem, ListItemText, ListItemSecondaryAction } from '@material-ui/core';
import { ControlPoint } from '@material-ui/icons';
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
import { packages } from '../../constants/helpers';
import ManagePackageDialog from './ManagePackageDialog';
import DeleteButton from '../../components/Helpers/DeleteButton';
import BoxWithBorder from '../../components/BoxWithBorder';
import AssignProductDialog from './AssignProducts';

const PackageDetails = () => {
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();
  const {
    state: { user, permissions }
  }: any = useData();
  const [headingLabel, setHeadingLabel] = useState('');
  const [loading, setLoading] = useState(false);
  const [packageData, setPackageData] = useState(null);
  const [products, setProducts] = useState([]);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [packageFields, setPackageFields] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [customizedRoutes, setCustomizedRoutes] = useState([]);
  const [showProductAssignDialog, setShowProductAssignDialog] = useState(false);

  useEffect(() => {
    if (id) {
      fetchPackage();
      getProducts();
    }
    // eslint-disable-next-line
  }, [id]);

  const handleMainPoints = (data) => {
    let mainPoint = {};
    mainPoint['Package Name'] = data?.packageName || '';
    setMainPoints(mainPoint);
  };

  const getRessourceFields = () => {
    setLoading(true);
    axiosInstance()
      .get('/field?resource=Packages')
      .then(({ data: { data } }) => {
        setPackageFields(data);
        setLoading(false);
      })
      .catch((err) => {
        setLoading(false);
        toastConfig.setToastConfig(err);
      });
  };

  const fetchPackage = () => {
    setLoading(true);
    axiosInstance()
      .get(`${routes.packages.path}/${id}`)
      .then(({ data: { data } }) => {
        setPackageData(data);
        handleMainPoints(data);
        setHeadingLabel(data.packageName);
        setCustomizedRoutes([routes.packages, { title: data.packageName }]);
        getRessourceFields();
      })
      .catch((err) => {
        setLoading(false);
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
    axiosInstance()
      .get(`${packages.packageApi}/get-products/${id}`)
      .then(({ data: { data } }) => {
        const newArr = data?.products.map((product) => ({ product: product.productId, qty: product.qty })) || [];
        setProducts(newArr);
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  return (
    <>
      <Fragment>
        <Grid container className="headerbox">
          <CustomBreadCrumbs routes={customizedRoutes} />
        </Grid>
        <Grid container spacing={1} className="detail-container">
          <Grid item xs={12} sm={12} md={8} lg={8} spacing={2}>
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
                {loading || !packageFields.length ? (
                  <Grid container spacing={2} style={{ padding: '8px' }}>
                    <CommonSkeleton lenArray={[...Array(7).keys()]} />
                  </Grid>
                ) : (
                  <>
                    <DetailsPage data={packageData} fields={packageFields} />
                  </>
                )}
              </Box>
            </Paper>
          </Grid>
          <Grid item xs={12} sm={12} md={4} lg={4} spacing={2}>
            <Paper style={{ overflow: 'hidden' }} elevation={2}>
              <Box padding={1} bgcolor="grey.200" display="flex" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle2">Products ({products.length || 0})</Typography>

                {permissions?.product?.isUpdate && (
                  <IconButton title="Assign users" color="primary" size="small" onClick={() => setShowProductAssignDialog(true)}>
                    <ControlPoint />
                  </IconButton>
                )}
              </Box>
              <Box style={{ paddingBottom: '4px' }}>
                {loading ? (
                  [1, 2].map((i) => (
                    <BoxWithBorder key={i} margin={'8px'}>
                      <Box padding={1}>
                        <Skeleton variant="text" width="100px" height="20px" />
                        <Box marginTop={1} />
                        <Skeleton variant="text" width="100%" height="15px" />
                      </Box>
                    </BoxWithBorder>
                  ))
                ) : products.length > 0 ? (
                  <>
                    <Box width="100%">
                      <Box mx={2} mt={1} display="flex" justifyContent="space-between">
                        <Typography variant="h6">Product</Typography>
                        <Typography variant="h6">Qty.</Typography>
                      </Box>
                      {products.map(({ qty, product }) => (
                        <List disablePadding key={product?._id}>
                          <ListItem dense>
                            <ListItemText primary={product?.productName} />
                            <ListItemSecondaryAction>
                              <Typography variant="h6">{qty}</Typography>
                            </ListItemSecondaryAction>
                          </ListItem>
                        </List>
                      ))}
                    </Box>
                  </>
                ) : (
                  <Box textAlign="center" padding={1} minHeight={180}>
                    <Typography>No Products</Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>
        </Grid>
      </Fragment>
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
          packageIds={[id]}
          onClose={() => setShowProductAssignDialog(false)}
          onSuccess={() => {
            setShowProductAssignDialog(false);
            getProducts();
          }}
        />
      )}
    </>
  );
};

export default PackageDetails;
