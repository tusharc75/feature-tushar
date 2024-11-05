import { Form, Formik } from 'formik';

import moment from 'moment';
import { Dispatch, Fragment, useEffect, useMemo, useState } from 'react';
import { TChatboxActions } from 'src/components/AgentChat/chatboxReducer';
import { Field } from 'src/components/AgentChat/types';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import FormTypes from 'src/components/Helpers/FormTypes';
import { dateFormat, yupSchema } from 'src/constants/helpers';

function validate(values: any) {
  const errors = {};
  return errors;
}

type RenderFieldsProps = {
  fields: Field[];
  handleSubmit: (values: any) => void;
  disabled?: boolean;
  setState?: Dispatch<TChatboxActions>;
};

const RenderFields = ({ fields, handleSubmit, disabled = false, setState }: RenderFieldsProps) => {
  const updatedFields = useMemo(() => {
    return fields
      ?.filter((f) => {
        if (f.value) {
          return false;
        }
        if (f.lookupDependentOn) {
          return false;
        }
        return true;
      })
      .map((d) => ({ ...d, ...(d.option ? { option: d.option.map((o) => ({ ...o, optionValue: o.optionLabel })) } : {}) }));
  }, [fields]);
  const [fieldTypes, setFieldType] = useState({});

  useEffect(() => {
    if (updatedFields.length && !disabled) {
      setState?.({ type: 'disableSendButton', payload: { disabled: true } });
    }
  }, [updatedFields, disabled, setState]);

  const handleSubmitWithFormattedData = (data: { [key: string]: string }) => {
    const formattedData = { ...data };

    for (const key of Object.keys(formattedData)) {
      if (fieldTypes[key] === 'date' && formattedData[key]) {
        formattedData[key] = moment(formattedData[key]).format(dateFormat);
      }
    }
    handleSubmit(formattedData);
  };

  if (!updatedFields || updatedFields.length === 0) return null;
  return (
    <div className="mt-4 flex flex-col gap-2 rounded-md p-4 shadow-md [border:1px_solid_var(--common-border-color)]">
      <p className="text-md mb-3 text-center font-semibold text-[var(--primary)] dark:text-white">Please fill the following details</p>
      <Formik initialValues={{}} validationSchema={yupSchema(fields)} validateOnMount validate={validate} onSubmit={handleSubmitWithFormattedData}>
        {({ values, errors, touched, setFieldValue, submitForm }) => (
          <Fragment>
            <Form autoComplete="off" autoCorrect="off" noValidate>
              <div className="grid gap-3">
                {updatedFields.map((field) => (
                  <div>
                    <FormTypes
                      {...field}
                      fieldData={field}
                      values={values}
                      errors={errors}
                      disabled={disabled}
                      touched={touched}
                      label={field.field}
                      name={field.field}
                      type={field.type}
                      options={field.option}
                      setFieldValue={(name, value) => {
                        setFieldValue(name, value);
                        setFieldType((prev) => ({ ...prev, [name]: field.type }));
                      }}
                      fullWidth
                      size="small"
                    />
                  </div>
                ))}
              </div>
            </Form>
            <div className="mt-3">
              <ThemeButton
                borderColor="none"
                disabled={disabled}
                iconForMobile={false}
                id="dialog-save-button"
                color="primary"
                fullWidth
                onClick={(e) => {
                  e.preventDefault();
                  submitForm();
                }}
              >
                Submit
              </ThemeButton>
            </div>
          </Fragment>
        )}
      </Formik>
    </div>
  );
};

export default RenderFields;
