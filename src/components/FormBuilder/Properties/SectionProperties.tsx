import { Box, Button, Dialog } from '@material-ui/core';
import { Form, Formik } from 'formik';
import { isEqual } from 'lodash';
import React, { useState } from 'react';
import { isMobile, isTablet } from 'react-device-detect';
import CustomTabs, { CustomTab, TabPanel } from 'src/components/CustomTabs';
import ConfirmCancelDialog from '../../../components/ConfirmCancelDialog';
import CustomDialogContent from '../../../components/CustomDialog/CustomDialogContent';
import CustomDialogFooter from '../../../components/CustomDialog/CustomDialogFooter';
import CustomDialogHeader from '../../../components/CustomDialog/CustomDialogHeader';
import { CustomDialogTransition, fieldLabelToFieldName } from '../../../constants/helpers';
import Visibility from './Visibility';
import update from 'immutability-helper';

export const SectionProperties = ({ handleClose, section, setSections, sections }) => {
  const [initialValues, setInitialValues] = useState({ visibilityCondition: section?.sectionProperties?.visibilityCondition || [] });

  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [fullScreen, setFullScreen] = useState(isMobile || isTablet);
  const [tabValue, setTabValue] = useState(0);

  const fields = [];

  sections.forEach((_section) => {
    _section.field.forEach((_field) => {
      let ele = { ..._field };
      if (!ele.fieldName) {
        ele.fieldName = fieldLabelToFieldName(ele.fieldLabel);
      }
      if (ele.type === 'converter' || ele.type === 'currencyAmount' || ele.isConverter === true) {
        if (ele.type !== 'currencyAmount' && (ele.type === 'converter' || ele.isConverter === true)) {
          ele.formulaUnits &&
            ele.formulaUnits.forEach((_unit) => {
              fields.push({
                ...ele,
                fieldLabel: ele.fieldLabel + ' (' + _unit + ')',
                fieldName: ele.fieldName + '_' + _unit.toLowerCase()
              });
            });
        } else if (ele.type === 'currencyAmount' && (ele.type === 'converter' || ele.isConverter === true)) {
          ele.displayCurrency &&
            ele.displayCurrency.forEach((_currency) => {
              ele.formulaUnits &&
                ele.formulaUnits.forEach((_unit) => {
                  fields.push({
                    ...ele,
                    fieldLabel: ele.fieldLabel + ' (' + _currency + '/' + _unit + ')',
                    fieldName: ele.fieldName + '_' + _currency.toLowerCase() + '_' + _unit.toLowerCase()
                  });
                });
            });
        } else if (ele.type === 'currencyAmount') {
          ele.displayCurrency &&
            ele.displayCurrency.forEach((_currency) => {
              fields.push({
                ...ele,
                fieldLabel: ele.fieldLabel + ' (' + _currency + ')',
                fieldName: ele.fieldName + '_' + _currency.toLowerCase()
              });
            });
        }
      } else {
        fields.push(ele);
      }
    });
  });

  const handleSave = (values) => {
    setSections(
      update(sections, {
        $apply: (b) =>
          b.map((item) => {
            if (item.sectionId !== section.sectionId) return item;
            return {
              ...item,
              sectionProperties: {
                ...(item?.sectionProperties || {}),
                visibilityCondition: values.visibilityCondition
              }
            };
          })
      })
    );
    handleClose();
  };

  const handleTabChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setTabValue(newValue);
  };

  return (
    <Dialog
      maxWidth="md"
      fullScreen={fullScreen || isMobile || isTablet}
      TransitionComponent={CustomDialogTransition}
      aria-labelledby="customized-dialog-title"
      className="properties_dialog_height"
      open={true}
      fullWidth
      onClose={(e, reason) => {
        if (reason !== 'backdropClick') {
          setShowConfirmDialog(true);
        }
      }}
    >
      <Formik enableReinitialize={true} initialValues={initialValues} onSubmit={handleSave}>
        {({ submitForm, setFieldValue, values }) => (
          <>
            <CustomDialogHeader
              title={`${section['sectionName']} - Properties`}
              onClose={() => {
                if (isEqual(values, initialValues)) handleClose();
                setShowConfirmDialog(true);
              }}
              isMinimized={!fullScreen}
              onMinimizeMaximize={() => {
                setFullScreen((prevState) => !prevState);
              }}
              showManimizeMaximize={true}
            ></CustomDialogHeader>
            <CustomDialogContent>
              <Box>
                <Form autoComplete="off" autoCorrect="off" noValidate>
                  <Box pt={1}>
                    <CustomTabs value={tabValue} onChange={handleTabChange}>
                      <CustomTab value={0} label={'Visibility'} />
                    </CustomTabs>
                    <TabPanel value={tabValue} index={0}>
                      <Visibility
                        values={values}
                        setFieldValue={setFieldValue}
                        fields={fields}
                        fieldsToExclude={section?.field?.map((f) => f.fieldName)}
                        touched={null}
                        errors={null}
                        isVisibilityFromSection={true}
                      />
                    </TabPanel>
                  </Box>
                </Form>
              </Box>
            </CustomDialogContent>
            <CustomDialogFooter>
              <Button
                size="small"
                onClick={() => {
                  if (isEqual(values, initialValues)) handleClose();
                  setShowConfirmDialog(true);
                }}
                color="primary"
              >
                Cancel
              </Button>
              <Button size="small" type="submit" color="primary" variant="contained" onClick={submitForm}>
                Save
              </Button>
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
                  handleClose();
                }}
              />
            ) : null}
          </>
        )}
      </Formik>
    </Dialog>
  );
};
