import { Form, Formik } from 'formik';
import { isEmpty } from 'lodash';
import { Dispatch, Fragment, useCallback, useEffect, useRef, useState } from 'react';
import { TChatboxActions, TInitialChatboxState } from 'src/components/AiChatbox/chatboxReducer';
import { Field } from 'src/components/AiChatbox/types';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import FormTypes from 'src/components/Helpers/FormTypes';
import { cn, dateFormatToSend, fieldTicketSteps, yupSchema } from 'src/constants/helpers';

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
  isDefaultMode: boolean;
};


const RenderConform = ({data, onSubmit, onCancel}) => {
  return (
    <div>
      <p><b>Please confirm the following details</b></p>
      <div>
        {Object.keys(data).map((key) => (
          <div key={key}>
            <p> <b>{key} : </b> {data[key]}</p>
          </div>
        ))}
      </div>
      <div className='flex gap-2 mt-5'>
        <ThemeButton onClick={() => onSubmit(data)} buttonType='theme'>Confirm</ThemeButton>
        <ThemeButton onClick={() => onCancel()} buttonType='red'>Cancel</ThemeButton>
      </div>
    </div>
  );
};

const RenderFields = ({ fields, handleSubmit, disabled = false, setState, state, isDefaultMode }: RenderFieldsProps) => {
  const { fullScreen } = state;
  const extractData = useRef({});
  const [shouldUpdateFields, setShouldUpdateFields] = useState(true);
  const [updatedFields, setUpdatedFields] = useState<Field[]>([]);

  useEffect(() => {
    setShouldUpdateFields(true);
  }, [fields]);

  useEffect(() => {
    if(!shouldUpdateFields) return;
    
    const preFillData = {};
    const newFields = fields
      ?.filter((f) => {
        if (f.value && !f.option) {
          preFillData[f.field] = f.value;
          return false;
        }
        if (f.lookupDependentOn) {
          return false;
        }

        if (f.option && f.value) {
          const isValid = f.option.some((o) => o.optionLabel === f.value);
          if (isValid) {
            preFillData[f.field] = f.value;
            return false;
          }
        }
        return true;
      })
      .map((d) => ({ ...d, ...(d.option ? { option: d.option.map((o) => ({ ...o, optionValue: o.optionLabel })) } : {}) }));
    
    extractData.current = preFillData;
    setUpdatedFields(newFields);
    setShouldUpdateFields(false);
  }, [fields, shouldUpdateFields]);


  const onCancel = useCallback(() => {
    fields.forEach((field) => {
      if (field.field) {
        field.value = null;
      }
    });
    setShouldUpdateFields(true);
  }, [fields]);


  const [fieldTypes, setFieldType] = useState({});

  useEffect(() => {
    if (updatedFields.length && !disabled) {
      setState?.({ type: 'disableSendButton', payload: true });
    }
  }, [updatedFields, disabled, setState]);

  const handleSubmitWithFormattedData = (data: { [key: string]: string }) => {
    const formattedData = { ...extractData.current, ...data };

    for (const key of Object.keys(formattedData)) {
      if (fieldTypes[key] === 'date' && formattedData[key]) {
        formattedData[key] = dateFormatToSend(formattedData[key]);
      }
    }
    handleSubmit(formattedData);
  };
  if (!updatedFields?.length && isEmpty(extractData.current)) return null;
  return (
    !updatedFields?.length ? <RenderConform data={extractData.current} onSubmit={handleSubmitWithFormattedData} onCancel={onCancel} /> :
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
              <div className={cn('grid gap-3', fullScreen || isDefaultMode ? 'grid-cols-1 md:grid-cols-2 md:gap-4' : 'grid-cols-1')}>
                {updatedFields.map((field) => (
                  <div>
                    <FormTypes
                      {...field}
                      fieldData={field}
                      values={values}
                      errors={errors}
                      disabled={disabled}
                      touched={touched}
                      label={field.label || field.field}
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
                disabled={disabled}
                iconForMobile={false}
                id="dialog-save-button"
                fullWidth={!fullScreen}
                buttonType="theme"
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
