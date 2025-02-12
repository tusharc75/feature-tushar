import { Close } from '@mui/icons-material';
import { Checkbox, Dialog, FormControlLabel, IconButton, Radio, RadioGroup, TextField } from '@mui/material';
import { Formik } from 'formik';

import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import Content from 'src/components/CustomReactTable/ArrangeView/ArrangeViewDialog1/Content';
import Sidebar from 'src/components/CustomReactTable/ArrangeView/ArrangeViewDialog1/Sidebar';
import useArrangeView from 'src/components/CustomReactTable/ArrangeView/ArrangeViewDialog1/useArrangeView';
import { ThemeButton } from 'src/components/Helpers/Buttons';
import { cn, CustomDialogTransition } from 'src/constants/helpers';
import { object, string } from 'yup';
import { ArrangeViewDialogProps } from './types';
import HeadInputs from 'src/components/CustomReactTable/ArrangeView/ArrangeViewDialog1/HeadInputs';

const formSchema = object().shape({
  name: string().min(2, 'Name too short').max(50, 'Name too long!').required('Name is required')
});

const ArrangeViewDialog1 = ({
  columns,
  data,
  expander,
  getAllSavedViews,
  hideSelection,
  oldSerializedSizes,
  onClose,
  renderedFrom,
  table
}: ArrangeViewDialogProps) => {
  const state = useArrangeView({
    columns,
    data,
    expander,
    getAllSavedViews,
    hideSelection,
    oldSerializedSizes,
    onClose,
    renderedFrom,
    table
  });
  const { defaultValue, loading, resized, handleOnSubmit, handleReset, isMobile } = state;

  return (
    <Formik initialValues={defaultValue} validationSchema={formSchema} validateOnMount onSubmit={handleOnSubmit}>
      {({ submitForm, values, errors, touched, setFieldValue, dirty }) => (
        <Dialog
          open={true}
          maxWidth="md"
          fullWidth
          slots={{
            transition: CustomDialogTransition
          }}
          fullScreen={isMobile}
          onClose={(e, reason) => {
            if (reason !== 'backdropClick') {
              onClose();
            }
          }}
          slotProps={{
            paper: {
              className: 'md:!rounded-[12px] !rounded-[0px]'
            }
          }}
          className={cn(
            ' [--px:20px] [--py:20px] [--sidebar-width:285px] md:[--px:37px] md:[--py:21px]',
            isMobile
              ? 'max-md:[--container-max-h:calc(100vh-240px)] max-md:[--content-max-h:calc(100vh-310px)] max-[410px]:[--container-max-h:calc(100vh-280px)] max-[410px]:[--content-max-h:calc(100vh-350px)]'
              : '[--container-max-h:500px] [--content-max-h:433px]'
          )}
        >
          <div className="flex items-center gap-3 px-[--px] py-[--py] ">
            <div className="flex-grow">
              <h6 className="mb-[5px] text-[20px] font-semibold leading-[22px]">Arrange View</h6>
              <p className="text-[12px] font-normal leading-[14px] text-[#777575] dark:text-gray-400 max-sm:hidden">
                See results in your view based on the filters you select here.
              </p>
            </div>
            <IconButton onClick={onClose} size="small">
              <Close />
            </IconButton>
          </div>

          <CustomDialogContent className="relative !px-[--px] !py-[--py] !pt-0 ">
            <HeadInputs errors={errors} setFieldValue={setFieldValue} state={state} touched={touched} values={values} />
            <div className={cn('grid overflow-hidden  rounded-lg border', isMobile ? 'relative' : 'grid-cols-[var(--sidebar-width)1fr]')}>
              <Sidebar state={state} values={values} setFieldValue={setFieldValue} />
              <Content state={state} values={values} setFieldValue={setFieldValue} />
            </div>
          </CustomDialogContent>
          <div className="flex justify-between px-[--px] py-[--py] pt-0">
            <div className="ml-auto flex gap-2">
              <ThemeButton onClick={() => handleReset(setFieldValue)} iconForMobile={false} disabled={loading}>
                Reset
              </ThemeButton>
              <ThemeButton
                onClick={submitForm}
                iconForMobile={false}
                buttonType="theme"
                isLoading={loading}
                disabled={loading ? true : resized ? false : !dirty}
              >
                Save
              </ThemeButton>
            </div>
          </div>
        </Dialog>
      )}
    </Formik>
  );
};

export default ArrangeViewDialog1;
