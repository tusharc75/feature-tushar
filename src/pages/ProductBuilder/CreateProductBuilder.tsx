import React, { useState, useEffect, Fragment, useContext } from 'react';
import Box from '@mui/material/Box';
import Grid from '@mui/material/Grid2';
import Button from '@mui/material/Button';
import { useParams, useHistory } from 'react-router-dom';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import { Formik, Form } from 'formik';
import { object, string } from 'yup';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from '../../axios/axiosInstance';
import CustomContainer from '../../components/CustomContainer';
import routes from '../../components/Helpers/Routes';
import ProductBuilder from '../../components/productBuilder';
import { BiArrowBack } from 'react-icons/bi';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import FormTypes from '../../components/Helpers/FormTypes';
import { useData } from '../../StateProvider/Provider';
import { TextField } from '@mui/material';

const ProductBuilderSchema = object().shape({
  name: string().min(3, 'Too Short!').max(50, 'Too Long').required('name is required')
});

const CreateProductBuilder = () => {
  const toastConfig = useContext(CustomToastContext);
  const {
    state: {
      permissions: { productBuilder: permissions },
      resources
    }
  }: any = useData();
  const history = useHistory();
  const { id } = useParams();

  const [isUpdating] = useState(false);
  const [initialValues, setInitialValues] = useState(null);
  const [currency, setCurrency] = useState('');

  useEffect(() => {
    fetchOneProductBuilder();
  }, [id]);

  const fetchOneProductBuilder = () => {
    axiosInstance()
      .get(`/productBuilder/` + id)
      .then(({ data: { data } }) => {
        setInitialValues(data);
        setCurrency(data?.currency);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const handleSave = () => {};

  const refreshProducts = (data) => {};

  const [isAddNewProduct, setIsAddNewProduct] = useState(false);
  const [isAddExistingProduct, setIsAddExistingProduct] = useState(false);

  const [tabIndex, setTabIndex] = React.useState(0);

  const handleChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  return (
    <Box className="main-container-v1">
      <Grid container className="headerbox">
        <Grid size={{md:4, sm:11, xs:10}}>
          <CustomBreadCrumbs
            routes={[
              {
                title: resources?.productBuilde?.titlePlural,
                path: routes.productBuilder.path
              },
              {
                title: id === '0' ? 'New' : initialValues && initialValues.name
              }
            ]}
          />
        </Grid>
        <Grid size={{md:8, sm:1, xs:2}}></Grid>
      </Grid>
      <CustomContainer>
        {initialValues ? (
          <Formik initialValues={initialValues} validationSchema={ProductBuilderSchema} onSubmit={handleSave}>
            {({ values, errors, touched, setFieldValue, submitForm }) => (
              <Form>
                <Box p={1}>
                  <Grid container spacing={1}>
                    <Grid size={{xs:12, sm:3}}>
                      <TextField
                        fullWidth
                        margin="dense"
                        size="small"
                        type="text"
                        label="Name"
                        name="name"
                        variant="outlined"
                        disabled={true}
                        value={values['name']}
                      />
                    </Grid>
                    <Grid size={{xs:12, sm:3}}>
                      <Box mt={1}>
                        <FormTypes
                          values={values}
                          errors={errors}
                          touched={touched}
                          label={'Currency'}
                          name="currency"
                          type="currency"
                          setFieldValue={setFieldValue}
                          required={true}
                          fullWidth
                          isTooltip={false}
                          tooltipMessage={''}
                          size="small"
                          disabled={true}
                        />
                      </Box>
                    </Grid>
                    <Grid size={{xs:12, sm:6}} container justifyContent="flex-end">
                      <Box ml={1}>
                        <Button
                          size="small"
                          color="primary"
                          variant="contained"
                          onClick={() =>
                            history.push({
                              pathname: routes.productBuilder.path
                            })
                          }
                          startIcon={<BiArrowBack />}
                        >
                          Back
                        </Button>
                      </Box>
                    </Grid>
                  </Grid>
                </Box>
                <Box p={1}>
                  <CustomTabs value={tabIndex} onChange={handleChange}>
                    <CustomTab value={0} label={'Product'} />
                    <CustomTab value={1} label={'Cost'} />
                    {/* <CustomTab value={2} label="All" /> */}
                  </CustomTabs>
                </Box>
                <TabPanel value={tabIndex} index={0}>
                  <Fragment>
                    <Box p={1}>
                      <Grid size={{xs:12, md:6, sm:6}} className="d-flex align-items-center gap-1">
                        {permissions.isUpdate && (
                          <>
                            <Button
                              variant="contained"
                              size="small"
                              color="primary"
                              onClick={() => {
                                setIsAddNewProduct(true);
                              }}
                            >
                              New
                            </Button>
                            <Button
                              className="ml-2"
                              variant="contained"
                              size="small"
                              color="primary"
                              onClick={() => {
                                setIsAddExistingProduct(true);
                              }}
                            >
                              Add Existing
                            </Button>
                          </>
                        )}
                      </Grid>
                    </Box>
                    <Box mt={1}>
                      {isUpdating ? null : (
                        <ProductBuilder
                          currency={currency}
                          permissions={permissions}
                          createdBy={values?.createdBy?.user}
                          productBuilderId={id}
                          isAddNewProduct={isAddNewProduct}
                          setIsAddNewProduct={setIsAddNewProduct}
                          isAddExistingProduct={isAddExistingProduct}
                          setIsAddExistingProduct={setIsAddExistingProduct}
                          refreshProducts={refreshProducts}
                          Editable={true}
                          stage="product"
                        />
                      )}
                    </Box>
                  </Fragment>
                </TabPanel>
                <TabPanel value={tabIndex} index={1}>
                  <Fragment>
                    <Box mt={1}>
                      {isUpdating ? null : (
                        <ProductBuilder
                          currency={currency}
                          permissions={permissions}
                          createdBy={values?.createdBy?.user}
                          productBuilderId={id}
                          isAddNewProduct={isAddNewProduct}
                          setIsAddNewProduct={setIsAddNewProduct}
                          isAddExistingProduct={isAddExistingProduct}
                          setIsAddExistingProduct={setIsAddExistingProduct}
                          refreshProducts={refreshProducts}
                          Editable={true}
                          stage="cost"
                        />
                      )}
                    </Box>
                  </Fragment>
                </TabPanel>
                <TabPanel value={tabIndex} index={2}>
                  <Fragment>
                    <Box p={1}>
                      <Grid size={{xs:6}} className="d-flex align-items-center gap-1">
                        {permissions.isUpdate && (
                          <>
                            <Button
                              variant="contained"
                              size="small"
                              color="primary"
                              onClick={() => {
                                setIsAddNewProduct(true);
                              }}
                            >
                              New
                            </Button>
                            <Button
                              className="ml-2"
                              variant="contained"
                              size="small"
                              color="primary"
                              onClick={() => {
                                setIsAddExistingProduct(true);
                              }}
                            >
                              Add Existing
                            </Button>
                          </>
                        )}
                      </Grid>
                    </Box>
                    <Box mt={1}>
                      {isUpdating ? null : (
                        <ProductBuilder
                          currency={currency}
                          permissions={permissions}
                          createdBy={values?.createdBy?.user}
                          productBuilderId={id}
                          isAddNewProduct={isAddNewProduct}
                          setIsAddNewProduct={setIsAddNewProduct}
                          isAddExistingProduct={isAddExistingProduct}
                          setIsAddExistingProduct={setIsAddExistingProduct}
                          refreshProducts={refreshProducts}
                          Editable={true}
                        />
                      )}
                    </Box>
                  </Fragment>
                </TabPanel>
              </Form>
            )}
          </Formik>
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </CustomContainer>
    </Box>
  );
};

export default CreateProductBuilder;
