import { FC, useEffect, useState, Fragment, useRef, useContext } from 'react';
import { Button, Dialog, Grid, Box } from '@material-ui/core';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { getObjKeysWithValues, getObjKeys, yupSchema } from '../../../constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition, arrayToDropwdownOption } from '../../../constants/helpers';
import { Formik, Form } from 'formik';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import CustomButton from '../../../components/Helpers/CustomButton';
import { FaDiceOne } from 'react-icons/fa';
import FormTypes from '../../../components/Helpers/FormTypes';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import { uniq, map, orderBy, isEqual, intersection } from 'lodash';
import { fetch_repair_order_product_fields } from 'src/components/RepairOrder/helper';

interface EditDialogProps {
  onClose: VoidFunction | any;
  handleSaveData: VoidFunction | any;
  repairOrderData: any;
  rowData?: object | any;
  material: any[];
  isBulkedit: any;
  loading: any;
}

const RepairOrderQtyDialog: FC<EditDialogProps> = ({
  onClose,
  handleSaveData,
  repairOrderData,
  rowData,
  material,
  isBulkedit,
  loading
}) => {

  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [allFields, setAllFields] = useState([]);
  const [fields, setFields] = useState([]);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    var data = await fetch_repair_order_product_fields(repairOrderData?.currency);
    setAllFields(JSON.parse(JSON.stringify(data)));
    if (isBulkedit) {
      data.forEach((element) => {
        element.required = false;
      });
      data = data.filter((e: any) => !e.isUneditable && !e.disableOnEdit);
      setInitialData({
        fields: data,
        values: { ...getObjKeys('', data) }
      });
    } else {
      setInitialData({
        fields: data,
        values: getObjKeysWithValues(rowData, data)
      });
    }
    EvaluteproductFields(data);
  };

  const EvaluteproductFields = (fields) => {
    const sections = uniq(map(fields, 'sectionName'));
    const customData = sections.map((name) => {
      let sectionFields = fields.filter((field) => field.sectionName === name);
      sectionFields = orderBy(sectionFields, 'order', 'asc');
      return { name, sectionFields };
    });
    setFields(customData);
  };

  const getTitle = () => {
    if (rowData) {
      return `Edit - ${rowData.detail}`;
    } else {
      return 'Bulk Edit';
    }
  };

  const handleSubmit = async (values) => {
    let rows: any = [{ ...rowData, ...values }];
    handleSaveData(rows);
  };

  function validate(values) {
    const errors = {};

    if (rowData) {
      if (rowData.parentId) {
        const _package = material?.filter((e) => e._id === rowData.parentId);
        if (_package.length) {
          if (values.qty * _package[0].qty < rowData.subRows?.length) {
            errors['qty'] = 'The quantity is less than what was assigned.';
          }
        }
      } else {
        if (values.qty < rowData.subRows?.length) {
          errors['qty'] = 'The quantity is less than what was assigned.';
        }
      }
    }
    return errors;
  }

  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      open={true}
      fullWidth
    >
      {initialData && initialData.fields.length ? (
        <Formik
          innerRef={ref}
          enableReinitialize={true}
          initialValues={initialData.values}
          validationSchema={yupSchema(initialData.fields)}
          validateOnMount
          validate={validate}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                title={getTitle()}
                onClose={() => {
                  if (!isEqual(ref?.current?.values, initialData.values)) {
                    setShowConfirmDialog(true);
                  } else {
                    onClose();
                  }
                }}
                isMinimized={!fullScreen}
                onMinimizeMaximize={() => {
                  setFullScreen((prevState) => !prevState);
                }}
                showManimizeMaximize={true}
              ></CustomDialogHeader>
              <CustomDialogContent>
                {isBulkedit && <h6 className="form-label-style mb-2">* Please enter value you want to bulk update.</h6>}
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  {fields &&
                    fields.map((section, i) => (
                      <div key={i}>
                        <div className={'detail-box-content detail-product-box'}>
                          <div className={'product-form-layout'}>
                            <FaDiceOne size={16} color={'var(--white)'} style={{ marginRight: '5px' }} />
                            <h2 className={`${'form-label-style'} ${'form-label-product'}`}>{section.name}</h2>
                          </div>
                        </div>
                        <Box marginY={2}>
                          <Grid spacing={3} container>
                            {section.sectionFields &&
                              section.sectionFields.map((field) => (
                                <Grid key={field.fieldName} item xs={12} sm={6} md={6}>
                                  <Box display="flex">
                                    <Box flexGrow={1}>
                                      <FormTypes
                                        {...field}
                                        fields={initialData.fields}
                                        fieldData={field}
                                        values={values}
                                        errors={errors}
                                        touched={touched}
                                        label={field.fieldLabel}
                                        name={field.fieldName}
                                        type={field.type}
                                        options={field.option}
                                        setFieldValue={(name, value) => {
                                          setFieldValue(name, value);
                                        }}
                                        required={field.required}
                                        fullWidth
                                        isTooltip={field.isTooltip}
                                        tooltipMessage={field.tooltipMessage}
                                        size="small"
                                      />
                                    </Box>
                                  </Box>
                                </Grid>
                              ))}
                          </Grid>
                        </Box>
                      </div>
                    ))}
                </Form>
              </CustomDialogContent>
              <CustomDialogFooter>
                <Button
                  size="small"
                  color="primary"
                  onClick={() => {
                    if (!isEqual(ref.current.values, initialData.values)) {
                      setShowConfirmDialog(true);
                    } else {
                      onClose();
                    }
                  }}
                >
                  {'Close'}
                </Button>
                <CustomButton
                  loading={loading}
                  disabled={loading || isEqual(ref?.current?.values, initialData.values)}
                  variant="contained"
                  color="primary"
                  type="submit"
                  onClick={submitForm}
                >
                  {' '}
                  Save
                </CustomButton>
              </CustomDialogFooter>
              {showConfirmDialog ? (
                <ConfirmCancelDialog
                  close={() => setShowConfirmDialog(false)}
                  open={showConfirmDialog}
                  onSave={() => {
                    setShowConfirmDialog(false);
                    submitForm();
                  }}
                  onClose={() => {
                    setShowConfirmDialog(false);
                    onClose();
                  }}
                />
              ) : null}
            </Fragment>
          )}
        </Formik>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </Dialog>
  );
};

export default RepairOrderQtyDialog;
