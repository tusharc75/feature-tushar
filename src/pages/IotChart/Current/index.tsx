import { Box, Grid, IconButton, Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@material-ui/core';
import { startCase } from 'lodash';
import moment from 'moment';
import { Fragment, useContext, useEffect, useState } from 'react';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import axiosInstance from 'src/axios/axiosInstance';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import { dateTimeFormat } from 'src/constants/helpers';
import CustomAccordian from '../Accordian';
import RefreshIcon from '@material-ui/icons/Refresh';
import HtmlTooltip from 'src/components/CustomTooltipTitle';
import SearchBox from 'src/components/Helpers/SearchBox';

export default function Current({ assetId }) {
  const toastConfig = useContext(CustomToastContext);

  const [errorData, setErrorData] = useState(null);
  const [expandedAccordition, setExpandedAccordition] = useState({});
  const [categories, setCategories] = useState(null);
  const [currentData, setCurrentData] = useState(null);
  const [searchValue, setSearchValue] = useState('');

  useEffect(() => {
    fetchCategory();
    fetchData();
    fetchErrorData();
  }, [assetId]);

  const fetchCategory = async () => {
    axiosInstance()
      .get(`/dynamic-form`, {
        headers: {
          Resource: 'Iot Data Points Category'
        }
      })
      .then(({ data: { data } }) => {
        const categoryData: any = data?.filter((e) => !e.parentCategory);
        categoryData?.forEach((element) => {
          element.child = data?.filter((e) => e?.parentCategory?.optionValue === element?._id);
        });
        setCategories(categoryData);
        if (categoryData?.length) {
          setExpandedAccordition({ [categoryData[0]._id]: true });
        }
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const fetchData = async () => {
    setCurrentData(null);
    axiosInstance()
      .get(`/report/iot/current-status`, {
        params: {
          asset: assetId
        }
      })
      .then(({ data: { data } }) => {
        setCurrentData(data?.dataPointData || []);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  const fetchErrorData = async () => {
    setErrorData(null);
    axiosInstance()
      .get(`/report/iot/asset-error-message`, {
        params: {
          asset: assetId
        }
      })
      .then(({ data: { data } }) => {
        setErrorData(data);
      })
      .catch((error) => {
        toastConfig.setToastConfig(error);
      });
  };

  return (
    <>
      <Box pb={2}>
        <Grid direction="row" justifyContent="flex-end" alignItems="center" container spacing={2}>
          <Grid item>
            <SearchBox
              onChange={(e) => {
                setSearchValue(e.target.value);
              }}
              value={searchValue}
              size="small"
            />
          </Grid>
          <Grid item>
            <HtmlTooltip title="Refresh">
              <IconButton
                size="small"
                onClick={() => {
                  fetchData();
                  fetchErrorData();
                }}
              >
                <RefreshIcon />
              </IconButton>
            </HtmlTooltip>
          </Grid>
        </Grid>
      </Box>
      <Grid container spacing={2}>
        <Grid item lg={8} md={8} sm={12} xs={12}>
          {categories && currentData ? (
            currentData?.length ? (
              categories?.map((category: any, index) => (
                <CustomAccordian
                  expandedAccordition={expandedAccordition}
                  setExpandedAccordition={setExpandedAccordition}
                  category={category}
                  currentData={
                    searchValue?.trim() === ''
                      ? currentData
                      : currentData?.filter((e) => e?.fieldLabel?.toLowerCase()?.includes(searchValue?.trim()?.toLowerCase()))
                  }
                />
              ))
            ) : (
              <Box mt={5} textAlign="center">
                <p>No Data Found</p>
              </Box>
            )
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </Grid>
        <Grid item lg={4} md={4} sm={12} xs={12}>
          {errorData ? (
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
                  {errorData
                    ?.sort((a, b) => moment(a.time).diff(moment(b.time)))
                    ?.filter((e) => e?.message)
                    ?.map((data: any, index) => (
                      <TableRow key={'row ' + index + 1}>
                        <TableCell key={'cell ' + index + 1} align="left">
                          {data?.message}
                          <br />
                          {moment(data?.time).format(dateTimeFormat)}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box p={2} height={500}>
              <CommonSkeleton lenArray={[...Array(10).keys()]} />
            </Box>
          )}
        </Grid>
      </Grid>
    </>
  );
}
