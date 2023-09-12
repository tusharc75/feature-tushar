import { Box, Grid, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@material-ui/core';
import _, { startCase } from 'lodash';
import moment from 'moment';
import { useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { dateTimeFormat } from 'src/constants/helpers';
import CustomAccordian from '../Accordian';

export default function Current({ assetId }) {
  const toastConfig = useContext(CustomToastContext);

  const [category, setCategory] = useState(null);
  const [parentCategory, setParentCategory] = useState(null);
  const [errorData, setErrorData] = useState(null);
  const [expandedAccordition, setExpandedAccordition] = useState(null);

  useEffect(() => {
    fetchData();
    fetchErrorData();
  }, [assetId]);

  const fetchData = async () => {
    axiosInstance()
      .get(`/report/iot/current-status`, {
        params: {
          asset: assetId
        }
      })
      .then(({ data: { data } }) => {
        const parentCategory: any = [];
        const category: any = [];

        data?.dataPointData.forEach((d) => {
          if (d?.hasOwnProperty('parentCategory')) {
            parentCategory.push({
              ...d,
              time: moment(d?.time).format(dateTimeFormat)
            });
          } else {
            category.push({
              ...d,
              time: moment(d?.time).format(dateTimeFormat)
            });
          }
        });

        if (parentCategory?.length > 0) {
          const data: any = _.uniqBy(parentCategory, 'parentCategory.optionValue')[0];
          setExpandedAccordition(preVal => (
            {
              ...preVal,
              [data?.parentCategory?.optionValue]: true
            }
          ))
        } else if (category?.length > 0) {
          const data: any = _.uniqBy(category, 'category.optionValue')[0];
          setExpandedAccordition(preVal => (
            {
              ...preVal,
              [data?.category?.optionValue]: true
            }
          ))
        }

        setParentCategory(parentCategory);
        setCategory(category);
      })
      .catch((error) => {
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

  return (
    <>
      {(parentCategory && parentCategory?.length) || (category && category?.length) || (errorData && errorData?.length) ? (
        <Grid container spacing={2}>
          <Grid item lg={8} md={8} sm={12} xs={12}>
            {_.uniqBy(parentCategory, 'parentCategory.optionValue')?.map((p: any, index) => (
              <CustomAccordian
                expended={expandedAccordition}
                data={p}
                onChange={() => {
                  setExpandedAccordition((prev) => (
                    {
                      ...prev,
                      [p?.parentCategory?.optionValue]: expandedAccordition[p?.parentCategory?.optionValue] ? false : true
                    }
                  ));
                }}
                type={'parentCategory'}
                allData={parentCategory}
              />
            ))}
            {_.uniqBy(category, 'category.optionValue')?.map((c: any, i) => (
              <CustomAccordian
                expended={expandedAccordition}
                data={c}
                onChange={() => {
                  setExpandedAccordition((prev) => (
                    {
                      ...prev,
                      [c?.category?.optionValue]: expandedAccordition[c?.category?.optionValue] ? false : true
                    }
                  ));
                }}
                type={'category'}
                allData={category}
              />
            ))}
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
