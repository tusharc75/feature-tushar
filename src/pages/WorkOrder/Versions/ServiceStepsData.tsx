import { useEffect, useState } from 'react';
import { Box, TextField, Typography, useMediaQuery } from '@mui/material';
import { Autocomplete } from '@mui/material';
import CustomReactTable, { useColumns, useTableReducer } from 'src/components/CustomReactTable';
import routes from 'src/components/Helpers/Routes';
import { sidebarResource } from 'src/constants/helpers';

const ServiceStepsData = ({ servicesData, stepsData }) => {
  const renderedFrom = `${sidebarResource?.workOrder}}_Version_Service_StepData`;
  const { generateColumns } = useColumns();
  const [serviceOptions, setServiceOptions] = useState([]);
  const [selectedServices, setSelectedServices] = useState([]);
  const { state, dispatch } = useTableReducer({ renderedFrom });
  const isMobile = useMediaQuery('(max-width:768px)');

  useEffect(() => {
    const services = [];
    servicesData?.forEach((sd) => {
      const rows = stepsData
        ?.filter((s) => s?.uniqueId === sd?._id)
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
        optionLabel: sd?.serviceDetail?.serviceName,
        optionValue: sd?._id,
        uniqueId: sd?._id,
        steps: sd?.steps,
        row: rows,
        column: columns
      });
    });
    setServiceOptions(services);
    setSelectedServices(services);
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
    <>
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
    </>
  );
};

export default ServiceStepsData;
