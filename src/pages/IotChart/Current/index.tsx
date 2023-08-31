import { Box, Grid, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Typography } from '@material-ui/core';
import _, { startCase } from 'lodash';

import { Accordion, AccordionDetails, AccordionSummary } from 'src/components/CustomAccordion';

import moment from 'moment';
import { useCallback, useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { dateTimeFormat } from 'src/constants/helpers';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';

export default function Current({ assetId }) {
  const toastConfig = useContext(CustomToastContext);

  const [dataPointData, setDataPointData] = useState(null);
  const [errorData, setErrorData] = useState(null);
  const [expandedAccordition, setExpandedAccordition] = useState<string | false>('');

  useEffect(() => {
    fetchData();
    fetchErrorData();
  }, [assetId]);

  const fetchData = async () => {
    axiosInstance().get(`/report/iot/current-status`, {
      params: {
        asset: assetId
      }
    }).then(({ data: { data } }) => {
      let newData = data?.dataPointData?.map((data) => {
        const obj = {
          ...data,
          time: moment(data?.time).format(dateTimeFormat)
        };
        return obj;
      });
      setDataPointData(newData);
    }).catch((error) => {
      toastConfig.setToastConfig(error);
    });
  };

  const fetchErrorData = async () => {
    try {
      const {
        data: { data }
      } = await axiosInstance().get(`/report/iot/asset-error-message?asset=${assetId}`);
      const tableData: any = [];
      data
        ?.sort((a, b) => moment(a.time).diff(moment(b.time)))
        ?.forEach((e) => {
          if (e.errorMessage) {
            tableData.push({
              ...e,
              time: moment(e?.time).format(dateTimeFormat)
            });
          }
        });
      setErrorData(tableData);
    } catch (error) {
      toastConfig.setToastConfig(error);
    }
  };

  const handleChange = useCallback((name: string) => {
    setExpandedAccordition((prev) => (!prev ? name : prev === name ? false : name));
  }, []);

  return (
    <>
      {(dataPointData && dataPointData?.length) || (errorData && errorData?.length) ? (
        <Grid container spacing={2}>
          <Grid item lg={8} md={8} sm={12} xs={12}>
            {_.uniqBy(dataPointData, 'category.optionValue')?.map((d: any, i) => {
              return (
                <Accordion
                  expanded={expandedAccordition === d?.category?.optionValue}
                  className={`omsAccordian`}
                  onChange={() => {
                    handleChange(d?.category?.optionValue);
                  }}
                >
                  <AccordionSummary aria-controls="user-panel-content" id="user-panel-header">
                    <Box display="flex">
                      <Box>
                        <IconButton size="small"> {expandedAccordition === d?.category?.optionValue ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
                      </Box>
                      <Box padding="5px">
                        <Typography variant="subtitle2" style={{ fontSize: '14.2056px', fontWeight: 600 }}>
                          {d?.category?.optionLabel || 'Data'}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {expandedAccordition === d?.category?.optionValue && (
                      <Grid container spacing={1}>
                        {dataPointData?.filter((d) => d?.category?.optionValue === expandedAccordition)?.map((data) => {
                          return (
                            <Grid item xs={12} sm={6} lg={4} md={4}>
                              <Box
                                border="1px solid var(--common-border-color)"
                                className="p-[10px] rounded-md min-h-full"
                                title={`${data?.fieldLabel} : ${data?.value} ${data?.unit ? `(${data.unit})` : ''}`}
                              >
                                <p className="mb-2 flex flex-wrap justify-between text-[14px] text-[var(--primary-text)]">
                                  <strong className=" line-clamp-1">{data?.fieldLabel} : </strong>
                                  <span className=" font-medium">
                                    {data?.value}
                                    {data?.unit && `(${data?.unit})`}
                                  </span>
                                </p>
                                <span className="text-gray-500 dark:text-gray-300 text-[12px]">{data?.time}</span>
                              </Box>
                            </Grid>
                          );
                        })}
                      </Grid>
                    )}
                  </AccordionDetails>
                </Accordion>
              );
            })}
          </Grid>
          <Grid item lg={4} md={4} sm={12} xs={12}>
            <TableContainer id={`${Date.now()}`} style={{ height: 'calc(100vh - 200px)', width: 'auto' }}>
              <Table stickyHeader id={'table_' + '1'} aria-label="simple table">
                <TableHead>
                  <TableRow>
                    {['alert'].map((_k: any, index) => (
                      <TableCell key={_k + ' ' + index + 1} align="left">
                        {startCase(_k)}
                      </TableCell>
                    ))}
                  </TableRow>
                </TableHead>
                <TableBody>
                  {errorData?.map((data: any, index) => (
                    <TableRow key={'row ' + index + 1}>
                      <TableCell key={'cell ' + index + 1} align="left">
                        {data?.errorMessage}
                        <br />
                        {data?.time}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </Grid>
        </Grid>
      ) : (
        <Box p={2} height={500}>
          <CommonSkeleton lenArray={[...Array(10).keys()]} />
        </Box>
      )}
    </>
  );
}
