import { useEffect, useState } from 'react';
import { Box, Dialog, TextField, Typography } from '@material-ui/core';
import { Autocomplete } from '@material-ui/lab';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import routes from 'src/components/Helpers/Routes';

const ViewServiceStepDataDialog = ({ servicesData, stepsData, handleClose }) => {

  const renderedFrom = `${routes?.workOrder?.title}_Service_StepData`;
  const { generateColumns } = useColumns();
  const [serviceOptions, setServiceOptions] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const { state, dispatch } = useTableReducer();

  useEffect(() => {
    const services = [];
    servicesData?.forEach((sd) => {
      const rows = stepsData?.filter((s) => s.uniqueId === sd.uniqueId).map((e, index) => {
        const matchingStep = sd?.steps?.find((item) => item?._id === e?.stepId);
        return {
          index: index + 1,
          stepName: matchingStep?.stepName,
          ...e
        };
      });
      const columns = fetchGridColumns(sd?.steps);
      services.push({
        optionLabel: sd.serviceName,
        optionValue: sd?._id,
        uniqueId: sd?.uniqueId,
        steps: sd?.steps,
        row: rows,
        column: columns
      });
    });
    setServiceOptions(services);
    setSelectedServices([services[0]]);
  }, []);


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
    // setColumns([...initialColumns, ...newColumns]);
    return [...initialColumns, ...newColumns];
  };

  return (
    <Dialog fullWidth maxWidth="md" fullScreen={true} open={true} onClose={handleClose} aria-labelledby="consume-dialog">
      <CustomDialogHeader title={'View Service Steps Data'} showManimizeMaximize={false} showRequiredLabel={false} onClose={handleClose} />
      <CustomDialogContent>
        <Autocomplete
          multiple
          id="service"
          style={{ width: '50%' }}
          options={[{ optionValue: 'selectAll', optionLabel: 'Select All' }, ...serviceOptions]}
          getOptionLabel={(option) => option?.optionLabel}
          value={selectedServices}
          onChange={(event, newValue) => {
            if (newValue?.some((e) => e?.optionValue === 'selectAll')) {
              setSelectedServices(serviceOptions);
              return;
            } else {
              setSelectedServices(newValue);
            }
          }}
          renderInput={(params) => (
            <TextField {...params} margin="dense" variant="outlined" label="Select Service" placeholder="Select Service" name="service" />
          )}
        />
        <Box style={{ overflowY: 'auto', height: 'calc(100% - 70px)' }}>
          {selectedServices?.filter((e) => e?.optionValue !== 'selectAll')?.map(s => (
            (
              <Box mt={2}>
                <Typography variant="h6">{s?.optionLabel}</Typography>
                <CustomReactTable
                  key={s?.uniqueId}
                  height={'calc(400px)'}
                  columns={s?.column}
                  state={{
                    ...state,
                    dataRows: s?.row || [],
                    rowCount: s?.row?.length || 0,
                    initialDataLoaded: true
                  }}
                  dispatch={dispatch}
                  hideSelection={true}
                  hideAction={true}
                  renderedFrom={`${renderedFrom}_${s?.uniqueId}`}
                  isClientSideGrid={true}
                  showArrangeView={false}
                />
              </Box>
            )
          ))}
        </Box>
      </CustomDialogContent>
    </Dialog>
  );
};

export default ViewServiceStepDataDialog;
