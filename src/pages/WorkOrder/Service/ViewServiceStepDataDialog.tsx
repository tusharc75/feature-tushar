import { useEffect, useState } from 'react';
import { Box, Dialog, TextField, Typography, useMediaQuery } from '@mui/material';
import Autocomplete from '@mui/material/Autocomplete';
import CustomDialogContent from 'src/components/CustomDialog/CustomDialogContent';
import CustomDialogHeader from 'src/components/CustomDialog/CustomDialogHeader';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import routes from 'src/components/Helpers/Routes';
import { CustomDialogTransition, sidebarResource } from 'src/constants/helpers';

const renderedFrom = `${sidebarResource?.workOrder}_Service_StepData`;

const ViewServiceStepDataDialog = ({ servicesData, stepsData, handleClose, selectedService }) => {
  const { generateColumns } = useColumns();
  const [serviceOptions, setServiceOptions] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const isMobile = useMediaQuery('(max-width:768px)');

  useEffect(() => {
    const services = [];
    servicesData?.forEach((sd) => {
      const rows = stepsData
        ?.filter((s) => s.uniqueId === sd.uniqueId)
        .map((e, index) => {
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
    if (selectedService && services?.find((e) => e.uniqueId === selectedService?.uniqueId)) {
      setSelectedServices([services?.find((e) => e.uniqueId === selectedService?.uniqueId)]);
    }
  }, [isMobile]);

  const fetchGridColumns = (steps: any) => {
    const initialColumns = [
      {
        accessor: 'index',
        Header: 'Index',
        width: 70,
        sticky: 'left',
        primaryField: true,
        Cell: ({ row }) => (
          <p className="text-truncate">
            {row.original.index} {isMobile ? `: ${row.original.stepName}` : ''}
          </p>
        )
      }
    ];
    if (!isMobile) {
      initialColumns.push({
        accessor: 'stepName',
        Header: 'Step Name',
        width: 100,
        sticky: 'left',
        primaryField: false,
        Cell: ({ row }) => <p className="text-truncate">{row.original.stepName}</p>
      });
    }
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
    return [...initialColumns, ...newColumns];
  };

  return (
    <Dialog
      fullWidth
      maxWidth="md"
      fullScreen={true}
      open={true}
      TransitionComponent={CustomDialogTransition}
      onClose={handleClose}
      aria-labelledby="consume-dialog"
    >
      <CustomDialogHeader title={'View Service Steps Data'} showManimizeMaximize={false} showRequiredLabel={false} onClose={handleClose} />
      <CustomDialogContent isFooterPresent={false}>
        <Autocomplete
          multiple
          id="service"
          className="flex-grow "
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
        <Box className="pt-3 " style={{ overflowY: 'auto', height: 'calc(100% - 70px)' }}>
          {selectedServices
            ?.filter((e) => e?.optionValue !== 'selectAll')
            ?.map((s) => (
              <Box mt={2}>
                <Typography variant="h6">{s?.optionLabel}</Typography>
                <CustomReactTable
                  key={s?.uniqueId}
                  height={s?.row?.length === 0 && 'calc(100px)'}
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
            ))}
        </Box>
      </CustomDialogContent>
    </Dialog>
  );
};

export default ViewServiceStepDataDialog;
