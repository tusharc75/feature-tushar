import { useState, useEffect, useReducer, useContext } from 'react';
import Button from '@material-ui/core/Button';
import { Formik, Form } from 'formik';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import Dialog from '@material-ui/core/Dialog';
import axiosInstance from '../../../axios/axiosInstance';
import { CustomToastContext } from '../../../StateProvider/CustomToastContext/CustomToastContext';
import CustomButton from '../../../components/Helpers/CustomButton';
import routes from '../../../components/Helpers/Routes';
import { isMobile, isTablet } from 'react-device-detect';
import InputField from '../../../components/Helpers/InputField';
import {
  getObjKeysWithValues,
  getObjKeys,
  yupSchema,
  pricingCondition,
  CustomDialogTransition,
  getUniqueCurrencies,
  productTemplate,
  gridLoadingTimeout,
  prepareDataForGrid
} from '../../../constants/helpers';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import { Box, Grid, TextField, InputAdornment, Chip, Badge, Select, FormControl, InputLabel, IconButton, Tabs, Tab } from '@material-ui/core';
import Autocomplete from '@material-ui/lab/Autocomplete';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import { result, find, startCase, isEqual, camelCase } from 'lodash';
import { FaDiceOne } from 'react-icons/fa';
import MenuItem from '@material-ui/core/MenuItem';
import MultipleEntry from './MultipleEntry';
import { FaWpforms } from 'react-icons/fa';
import { BiFoodMenu } from 'react-icons/bi';
import useColumns, { getStaticFields, getFrameworkComponents, checkStaticField } from '../../../constants/useColumns';
import CustomAgGrid, { reducer, intialState } from '../../../components/AgGridComponents/CustomAgGrid';
import AddRentDialog from './AddRentDialog';
import { Delete, Edit } from '@material-ui/icons';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';

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

const ConditionDialog = ({ pricingConditionId, conditionData, handleClose, handleSuccess, detailData, isBulkedit }) => {
  const toastConfig = useContext(CustomToastContext);
  // const [loading, setLoading] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [headerLabel, setHeaderLabel] = useState('');

  const [conditionType, setConditionType] = useState(['Rent', 'Price']);
  const [currency, setCurrency] = useState([detailData.currency]);
  const [unit, setUnits] = useState([]);
  const [pricingMethod, setPricingMethod] = useState([]);

  const [discount, setDiscount] = useState([]);
  const [tax, setTax] = useState([]);
  const [charge, setCharge] = useState([]);

  const [initialData, setInitialData] = useState(null);

  const [tabValue, setTabValue] = useState(0);
  const [productFields, setProductFields] = useState(null);
  const [manageRentDialog, setManageRentDialog] = useState({ open: false, id: null, okBtnLoading: false });
  const [removeRentDialog, setRemoveRentDialog] = useState({ open: false, ids: [], okBtnLoading: false });

  //  Grid Variables - Start
  const [gridApi, setGridApi] = useState(null);
  const [state, dispatch] = useReducer(reducer, intialState);
  const [columns, setColumns] = useState([]);
  const [frameWorkComponent, setFrameWorkComponent] = useState({});
  const { dataRows, rowCount, loading, page, limit, pageSizes, search, filters, sorting, selectedRecords } = state;
  const { getColumnData } = useColumns();

  useEffect(() => {
    fetchProductFields();
    fetchProducts();
  }, []);

  const fetchProductFields = () => {
    if (conditionData?.productDetail?.productTemplate) {
      axiosInstance()
        .get(`${productTemplate.productTemplateApi}/fields/${conditionData?.productDetail?.productTemplate}`)
        .then(({ data: { data } }) => {
          let fields = [...data.fields];

          fields.push({
            order: fields.length + 1,
            fieldName: 'rate',
            fieldLabel: 'Rate'
          });

          setProductFields(fields);

          let columns = [];
          let rendererNames = [];
          fields.forEach((o) => {
            let currentColumn = getColumnData(routes.product.title, o, routes.product.path);
            if (currentColumn !== null) {
              columns = [...columns, currentColumn?.columnData];
              if (currentColumn?.rendererName && rendererNames.indexOf(currentColumn?.rendererName) < 0) {
                rendererNames.push(currentColumn?.rendererName);
              }
            }
          });
          let tempFrameworkComponent = getFrameworkComponents(rendererNames, true);
          tempFrameworkComponent = {
            ...tempFrameworkComponent,
            actionsRenderer: ActionRenderer
          };
          setFrameWorkComponent({ ...tempFrameworkComponent });
          setColumns([...columns]);
        })
        .catch((error) => {
          toastConfig.setToastConfig(error);
        });
    }
  };

  const ActionRenderer = (params) => (
    <>
      <IconButton
        size="small"
        color="inherit"
        onClick={() => {
          setManageRentDialog({ open: true, id: params.data._id, okBtnLoading: false });
        }}
      >
        <Edit fontSize="small" />
      </IconButton>
      <IconButton
        size="small"
        color="inherit"
        onClick={() => {
          setRemoveRentDialog({
            open: true,
            ids: [params.data._id],
            okBtnLoading: false
          });
        }}
      >
        <Delete color="error" fontSize="small" />
      </IconButton>
    </>
  );

  const fetchProducts = () => {
    dispatch({ type: 'loading', loading: true });

    if (gridApi) {
      gridApi.setRowData([]);
    }

    axiosInstance()
      .get(`${pricingCondition.api}/${pricingConditionId}/rate/${conditionData?.materialId}`)
      .then(({ data: { data } }) => {
        let rows = data.map((item) => {
          let res = {
            _id: item._id,
            materialId: item.materialId,
            ...prepareDataForGrid(item)
          };
          return res;
        });

        dispatch({ type: 'initialize', data: rows, count: rows.length });
        setTimeout(() => {
          dispatch({ type: 'loading', loading: false });
        }, gridLoadingTimeout);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
        dispatch({ type: 'loading', loading: false });
      });
  };

  const handleMainTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <>
      <Dialog
        maxWidth="md"
        fullScreen={true}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={true}
        onClose={handleClose}
        fullWidth
      >
        <CustomDialogHeader
          title={conditionData ? `Edit ${conditionData?.productDetail?.productName ?? ''}` : 'Add'}
          onClose={handleClose}
          showManimizeMaximize={false}
        />

        <CustomDialogContent>
          <>
            <Tabs
              className="condition-tab"
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
                className="tabLayout"
                style={{
                  background: tabValue === 1 ? 'white' : '',
                  color: tabValue === 1 ? '#163340' : '#163340'
                }}
                label={
                  <div className="d-flex align-items-center tab-font">
                    <FaWpforms className="mr-1" fontSize="inherit" /> Rent
                  </div>
                }
                {...a11yProps(0)}
              />
              <Tab
                className="tabLayout"
                style={{
                  background: tabValue === 2 ? 'white' : '',
                  color: tabValue === 2 ? 'blue' : '#163340'
                }}
                label={
                  <div className="d-flex align-items-center tab-font">
                    <BiFoodMenu className="mr-1" fontSize="inherit" /> Price
                  </div>
                }
                {...a11yProps(1)}
              />
            </Tabs>
            <TabPanel value={tabValue} index={0}>
              <div className="d-flex gap-3 mt-3">
                <Button
                  variant="contained"
                  color="primary"
                  size="small"
                  onClick={() => {
                    setManageRentDialog({ open: true, id: null, okBtnLoading: false });
                  }}
                >
                  Add
                </Button>
                <Button
                  disabled={selectedRecords.length === 0}
                  variant="outlined"
                  color="primary"
                  size="small"
                  onClick={() => {
                    setRemoveRentDialog({ open: true, ids: selectedRecords.map((m) => m._id), okBtnLoading: false });
                  }}
                >
                  Remove
                </Button>
              </div>
              <Grid item xs={12} md={12} sm={12} className="mt-3">
                {Object.keys(frameWorkComponent).length > 0 ? (
                  <CustomAgGrid
                    columns={columns}
                    dataRows={dataRows}
                    frameworkComponents={frameWorkComponent}
                    setGridApi={setGridApi}
                    dispatch={dispatch}
                    rowCount={rowCount}
                    limit={limit}
                    pageSizes={pageSizes}
                    page={page}
                    loading={loading}
                    renderedFrom="pricingConditionRent"
                    // refreshGrid={fetchAccounts}
                    isClientSideGrid={true}
                    // allowAction={!isOffline}
                    // allowSelection={!isOffline}
                  />
                ) : (
                  <Box p={2} height={500}>
                    <CommonSkeleton lenArray={[...Array(10).keys()]} />
                  </Box>
                )}
              </Grid>
            </TabPanel>
            <TabPanel value={tabValue} index={1}></TabPanel>
          </>
        </CustomDialogContent>
      </Dialog>

      {manageRentDialog.open && (
        <AddRentDialog
          fields={productFields}
          id={manageRentDialog.id}
          close={() => setManageRentDialog({ open: false, id: null, okBtnLoading: false })}
          fetchData={fetchProducts}
          conditionData={conditionData}
          pricingConditionId={pricingConditionId}
        />
      )}

      {removeRentDialog.open && (
        <ConfirmationDialog
          open={removeRentDialog.open}
          okBtnLoading={removeRentDialog.okBtnLoading}
          message="Are you sure you want to remove rent?"
          onClose={() => {
            setRemoveRentDialog({ open: false, ids: [], okBtnLoading: false });
          }}
          onOk={() => {
            setRemoveRentDialog((prevState) => {
              return {
                ...prevState,
                okBtnLoading: true
              };
            });

            axiosInstance()
              .post(`${pricingCondition.api}/${pricingConditionId}/rate/${conditionData?.materialId}/remove`, { ids: removeRentDialog.ids })
              .then(() => {
                setRemoveRentDialog({ open: false, ids: [], okBtnLoading: false });
                fetchProducts();
              })
              .catch((error) => {
                toastConfig.setToastConfig(error);
              });
          }}
        />
      )}
    </>
  );
};

export default ConditionDialog;
