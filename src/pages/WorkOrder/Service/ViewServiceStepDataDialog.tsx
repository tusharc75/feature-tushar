import { useEffect, useState } from 'react';
import { Box, Dialog, TextField } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import routes from 'src/components/Helpers/Routes';

const ViewServiceStepDataDialog = ({ servicesData, stepsData, handleClose }) => {

  const renderedFrom = `${routes?.workOrder?.title}_Service_StepData`;
  const { generateColumns } = useColumns();
  const [serviceOptions, setServiceOptions] = useState(null);
  const [selectedService, setSelectedService] = useState(null);
  const [columns, setColumns] = useState(null);
  const { state, dispatch } = useTableReducer();

  useEffect(() => {
    const services = [];
    servicesData?.map((e) => {
      services.push({
        optionLabel: e.serviceName,
        optionValue: e?._id,
        uniqueId: e?.uniqueId,
        steps: e?.steps
      });
    });
    setServiceOptions(services);
  }, []);

  useEffect(() => {
    if (selectedService) {
      fetchGridColumns(selectedService?.steps);
      fetchData(selectedService?.uniqueId);
    }
  }, [selectedService]);

  const fetchGridColumns = (steps: any) => {
    const initialColumns = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.index}</p>
      },
      {
        accessor: 'stepName',
        Header: 'Step Name',
        width: 100,
        sticky: 'left',
        Cell: ({ row }) => <p className="text-truncate">{row.original.stepName}</p>
      }
    ];
    const stepColumns = [];
    const stepFields = steps?.map((e) => e?.fields);
    stepFields?.forEach((step) => {
      step?.forEach((field: any) => {
        if (!stepColumns.some((column: any) => column?.fieldName === field?.fieldName)) {
          stepColumns.push({ ...field });
        }
      });
    });
    let newColumns = generateColumns(renderedFrom, stepColumns);
    setColumns([...initialColumns, ...newColumns]);
  };

  const fetchData = (id: any) => {
    const rows = stepsData?.filter((e) => e.uniqueId === id).map((e, index) => {
      const matchingStep = selectedService?.steps.find((item) => item?._id === e?.stepId);
      return {
        index: index + 1,
        stepName: matchingStep?.stepName,
        ...e
      };
    });
    dispatch({ type: 'initialize', data: rows, count: rows?.length });
  };

  return (
    <Dialog fullWidth maxWidth="md" fullScreen={true} open={true} onClose={handleClose} aria-labelledby="consume-dialog">
      <CustomDialogHeader title={'View Service Steps Data'} showManimizeMaximize={false} showRequiredLabel={false} onClose={handleClose} />
      <CustomDialogContent>
        <Autocomplete
          id="service"
          style={{ width: '300px' }}
          options={serviceOptions}
          getOptionLabel={(option: any) => (option ? option?.optionLabel : '')}
          getOptionSelected={(option: any, val) => option.optionValue === val}
          value={selectedService}
          onChange={(e: any, value) => {
            setSelectedService(value);
          }}
          disableClearable
          renderInput={(params) => (
            <TextField {...params} margin="dense" variant="outlined" label="Select Service" placeholder="Select Service" name="service" />
          )}
        />
        {selectedService ? (
          <Box mt={1}>
            <CustomReactTable
              height={'calc(100vh - 200px)'}
              columns={columns}
              state={state}
              dispatch={dispatch}
              refreshGrid={() => fetchData(selectedService?.uniqueId)}
              hideSelection={true}
              hideAction={true}
              renderedFrom={renderedFrom}
              isClientSideGrid={true}
              showArrangeView={false}
            />
          </Box>
        ) : null}
      </CustomDialogContent>
    </Dialog>
  );
};

export default ViewServiceStepDataDialog;
