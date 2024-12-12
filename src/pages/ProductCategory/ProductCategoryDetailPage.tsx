import { Box, Button, Grid } from '@material-ui/core';
import { Edit } from '@material-ui/icons';
import { Fragment, useContext, useEffect, useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import { useHistory, useParams } from 'react-router-dom';
import ActivityButton from 'src/components/Activity/ActivityButton';
import { DeleteButton } from 'src/components/Helpers/Buttons';
import { ACTIVITY_RESOURCE } from 'src/constants/helpers';
import { CustomToastContext } from '../../StateProvider/CustomToastContext/CustomToastContext';
import { useData } from '../../StateProvider/Provider';
import axiosInstance from '../../axios/axiosInstance';
import CustomBreadCrumbs from '../../components/CustomBreadCrumbs';
import DetailsPageHeader from '../../components/DetailsPageHeader';
import CommonSkeleton from '../../components/Helpers/CommonSkeleton';
import ConfirmationDialog from '../../components/Helpers/ConfirmationDialog';
import routes from '../../components/Helpers/Routes';
import DetailsPage from '../../components/Shared/DetailsPage';
import CreateProductCategory from './CreateProductCategory';

const ProductCategoryDetailPage = () => {
  const toastConfig = useContext(CustomToastContext);

  const { id } = useParams();
  const history = useHistory();
  const {
    state: { permissions, resources }
  }: any = useData();
  const [headingLbl, setHeadingLbl] = useState('');
  const [loading, setLoading] = useState(false);
  const [productCategoryData, setProductCategoryData] = useState(null);
  const [showConfirmBox, setShowConfirmBox] = useState(false);
  const [productCategoryFields, setCategoryFields] = useState([]);
  const [mainPoints, setMainPoints] = useState(null);
  const [openUpdateDialog, setOpenUpdateDialog] = useState(false);
  const [productCategoryResource, setProductCategoryResource] = useState(null);
  const [customizedRoutes, setCustomizedRoutes] = useState<any>([{ ...routes.productCategory, title: resources?.productCategory?.titleSingular }]);

  useEffect(() => {
    if (id) {
      getProductCategoryFields();
      fetchProductCategoryData();
    }
  }, [id]);

  const fetchProductCategoryData = async () => {
    setLoading(true);
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/product-category/${id}`);
      handleMainPoints(data);
      setHeadingLbl(data.name);
      setProductCategoryData(data);
      setProductCategoryResource({ id: data._id });
      setCustomizedRoutes([{ ...routes.productCategory, title: resources?.productCategory?.titleSingular }, { title: data.name }]);
      setLoading(false);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleMainPoints = (data) => {
    let tempMp = {
      name: `${data?.name}`,
      taxJurisdiction: data.taxJurisdiction || ''
    };
    setMainPoints(tempMp);
  };

  const getProductCategoryFields = () => {
    axiosInstance()
      .get('/field?resource=Product Category')
      .then(({ data }) => {
        setCategoryFields(data.data?.filter((field) => field.isRead));
      })
      .catch((err) => {
        toastConfig.setToastConfig(err);
      });
  };

  const handleDeleteProductCategory = () => {
    if (id) {
      if (permissions?.productCategory?.isDelete) {
        axiosInstance()
          .put(`/product-category/remove`, { ids: [id] })
          .then(({ data }) => {
            setShowConfirmBox(false);

            history.push(`${routes.productCategory.path}`);
          })
          .catch((err) => {
            setShowConfirmBox(false);
          });
      }
    } else {
      setShowConfirmBox(false);
    }
  };

  const handleOpenUpdateDialog = () => {
    setOpenUpdateDialog(true);
  };

  const closeUpdateDialog = () => {
    setOpenUpdateDialog(false);
  };

  return (
    <Fragment>
      <Box className="main-container-v1">
        <Box className="headerbox-v1">
          <Box className="nav-v1">
            <CustomBreadCrumbs routes={customizedRoutes} />
          </Box>
          <Box className="controls-v1">
            <Box className="control-buttons-v1">
              {permissions?.productCategory?.isUpdate && (
                <Button
                  variant={isMobile && !isTablet ? 'text' : 'contained'}
                  size="small"
                  className={'btn-outline-v1'}
                  onClick={handleOpenUpdateDialog}
                >
                  {isMobile && !isTablet ? <Edit /> : 'Edit'}
                </Button>
              )}
              {permissions?.productCategory?.isDelete && <DeleteButton text="Delete" onClick={() => setShowConfirmBox(true)} />}
              <ActivityButton
                referenceId={productCategoryData?._id}
                resource={ACTIVITY_RESOURCE.productCategory}
                resourceLabel={productCategoryData?.name}
              />
            </Box>
          </Box>
        </Box>
        <Box className={`detail-container-v1`}>
          <DetailsPageHeader mainPoints={mainPoints} />
          {loading || !productCategoryFields.length ? (
            <Grid container spacing={2} style={{ padding: '8px' }}>
              <CommonSkeleton lenArray={[...Array(7).keys()]} />
            </Grid>
          ) : (
            <DetailsPage data={productCategoryData} fields={productCategoryFields} />
          )}
        </Box>
      </Box>
      {openUpdateDialog && (
        <CreateProductCategory
          open={openUpdateDialog}
          onClose={closeUpdateDialog}
          // fetchData={() => {
          //   fetchProductCategoryData();
          // }}
          productCategoryId={id}
          isUpdateDisabled={false}
          isClone={false}
          onSuccess={() => {
            fetchProductCategoryData();
            closeUpdateDialog();
          }}
        />
      )}
      {showConfirmBox && (
        <ConfirmationDialog
          open={showConfirmBox}
          message={`Are you sure you want to delete ${resources?.warehouse?.titleSingular?.toLowerCase()} ${headingLbl}?`}
          onClose={() => {
            setShowConfirmBox(false);
          }}
          onOk={handleDeleteProductCategory}
        />
      )}
    </Fragment>
  );
};

export default ProductCategoryDetailPage;
