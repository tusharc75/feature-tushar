import { Form, Formik } from 'formik';

import moment from 'moment';
import { Dispatch, Fragment, useEffect, useMemo, useState } from 'react';
import { TChatboxActions, TInitialChatboxState } from 'src/components/AgentChat/chatboxReducer';
import { Field } from 'src/components/AgentChat/types';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import FormTypes from 'src/components/Helpers/FormTypes';
import { cn, dateFormat, yupSchema } from 'src/constants/helpers';

function validate(values: any) {
  const errors = {};
  return errors;
}

type RenderFieldsProps = {
  fields: Field[];
  handleSubmit: (values: any) => void;
  disabled?: boolean;
  setState?: Dispatch<TChatboxActions>;
  state: TInitialChatboxState;
};

const RenderFields = ({ fields, handleSubmit, disabled = false, setState, state }: RenderFieldsProps) => {
  const { fullScreen } = state;
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
      setState?.({ type: 'disableSendButton', payload: true });
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
    <div
      className={cn(
        'my-[18px] ml-[50px] flex max-w-[800px] flex-col gap-2 rounded-md  shadow-md [border:1px_solid_var(--common-border-color)]',
        fullScreen ? 'md:p-8' : 'p-4'
      )}
    >
      <p className={cn('text-md text-center font-semibold text-[var(--primary)] dark:text-white', fullScreen ? 'md:mb-4 md:text-xl' : 'mb-3')}>
        Please fill the following details
      </p>
      <Formik initialValues={{}} validationSchema={yupSchema(fields)} validateOnMount validate={validate} onSubmit={handleSubmitWithFormattedData}>
        {({ values, errors, touched, setFieldValue, submitForm }) => (
          <Fragment>
            <Form autoComplete="off" autoCorrect="off" noValidate>
              <div className={cn('grid gap-3', fullScreen ? 'grid-cols-1 md:grid-cols-2 md:gap-4' : 'grid-cols-1')}>
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
            <div className={cn('text-right', fullScreen ? 'md:mt-5' : 'mt-3')}>
              <ThemeButton
                borderColor="none"
                disabled={disabled}
                iconForMobile={false}
                id="dialog-save-button"
                fullWidth={!fullScreen}
                color="primary"
                style={{ padding: '6px 25px' }}
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
