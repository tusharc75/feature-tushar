import { FC, useEffect, useState, Fragment, useRef, useContext } from 'react';
import { Button, Dialog, Grid, Box } from '@material-ui/core';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import ConfirmationDialog from '../../../components/Helpers/ConfirmationDialog';
import { getObjKeysWithValues, yupSchema } from '../../../constants/helpers';
import { isMobile, isTablet } from 'react-device-detect';
import { CustomDialogTransition } from '../../../constants/helpers';
import { Formik, Form } from 'formik';
import CommonSkeleton from '../../../components/Helpers/CommonSkeleton';
import CustomButton from '../../../components/Helpers/CustomButton';
import { FaDiceOne } from 'react-icons/fa';
import FormTypes from '../../../components/Helpers/FormTypes';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import { isEqual } from 'lodash';

interface EditDialogProps {
  onClose: VoidFunction | any;
  transferInventoryData: any;
  rowData?: object | any;
  handleSave: any;
}

const ProductQtyDialog: FC<EditDialogProps> = ({ onClose, rowData, handleSave }) => {
  const [initialData, setInitialData] = useState({ fields: [], values: {} });
  const [fields, setFields] = useState([]);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const newFields = field.map((item) => item.fieldData);
    setInitialData({
      fields: newFields,
      values: getObjKeysWithValues(rowData, newFields)
    });

    EvaluteproductFields();
  };

  const EvaluteproductFields = () => {
    const sections = [];
    field.forEach((field) => {
      if (!sections.includes(field.fieldData.sectionName)) {
        sections.push(field.fieldData.sectionName);
      }
    });
    const customData = sections.map((name) => {
      let fieldsData = field.filter((field) => field.fieldData.sectionName === name);
      const sectionFields = fieldsData.map((formData) => formData.fieldData);
      return { name, sectionFields };
    });
    setFields(customData);
  };

  const handleSubmit = async (values) => {
    let rows: any = { ...rowData, ...values };
    handleSave({ data: rows });
  };

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
          // validate={validate}
          onSubmit={handleSubmit}
        >
          {({ values, errors, touched, setFieldValue, submitForm }) => (
            <Fragment>
              <CustomDialogHeader
                title={`Edit - ${rowData?.productName}`}
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
                  disabled={isEqual(ref?.current?.values, initialData.values)}
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

const field = [
  {
    fieldData: {
      fieldLabel: 'Qty',
      fieldName: 'qty',
      isTooltip: false,
      option: [],
      order: 1,
      required: true,
      sectionName: 'Quantity Information',
      tooltipMessage: '',
      type: 'number'
    },
    isCreate: true,
    isDelete: true,
    isUpdate: true
  }
];

export default ProductQtyDialog;
