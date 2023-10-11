import { useState, useCallback, useEffect } from 'react';
import { Box, IconButton, Grid, Typography } from '@material-ui/core';
import moment from 'moment';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import { Accordion, AccordionDetails, AccordionSummary } from 'src/components/CustomAccordion';
import Chart from '../Helper/Chart';
import FilterModel from '../Helper/FilterModel';
import SearchBox from 'src/components/Helpers/SearchBox';
import { uniqBy } from 'lodash';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';

const Analysis = ({ assetId, dataPoints }) => {
  const [dateFilters, setDateFilters] = useState({
    from: new Date(moment().subtract(8, 'days').format('MM/DD/YYYY')),
    to: new Date(),
    intervals: '1hour'
  });

  const [searchValue, setSearchValue] = useState('');
  const [categories, setCategories] = useState(null);
  const [expandedAccordition, setExpandedAccordition] = useState({});
  const [expandedAccorditionItem, setExpandedAccorditionItem] = useState(null);

  useEffect(() => {
    const categoryData: any = uniqBy(
      dataPoints.filter((d) => !d?.parentCategory),
      'category.optionValue'
    );
    categoryData?.forEach((element) => {
      element.child = uniqBy(
        dataPoints?.filter((e) => e?.parentCategory?.optionValue === element?.category?.optionValue),
        'category.optionValue'
      );
    });
    setCategories(categoryData);
    // if (categoryData?.length) {
    //   setExpandedAccordition({ [categoryData[0]._id]: true });
    // }
  }, [dataPoints]);

  const AccordianItem = ({ dataPoint, data }) => {
    return (
      <Box mt={2}>
        <Accordion
          expanded={expandedAccordition[dataPoint?._id]}
          className={`omsAccordian`}
          onChange={() => {
            setExpandedAccordition((prev) => ({
              ...prev,
              [dataPoint?._id]: expandedAccordition[dataPoint?._id] ? false : true
            }));
          }}
        >
          <AccordionSummary aria-controls="user-panel-content" id="user-panel-header">
            <Box display="flex">
              <Box>
                <IconButton size="small"> {expandedAccordition[dataPoint?._id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
              </Box>
              <Box padding="5px">
                <Typography variant="subtitle2" style={{ fontSize: '14.2056px', fontWeight: 600 }}>
                  {dataPoint?.category?.optionLabel}
                </Typography>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            {expandedAccordition[dataPoint?._id] && (
              <>
                {dataPoint?.child?.map((_c: any) => (
                  <AccordianItem dataPoint={_c} data={data} />
                ))}
                {data
                  ?.filter((d) => d?.category?.optionValue === dataPoint?.category?.optionValue)
                  ?.map((_d) => {
                    return (
                      <Box mt={2}>
                        <Accordion
                          expanded={expandedAccorditionItem === _d?._id}
                          className={`omsAccordian`}
                          onChange={() => {
                            setExpandedAccorditionItem((prev) => (!prev ? _d?._id : prev === _d?._id ? null : _d?._id));
                          }}
                        >
                          <AccordionSummary aria-controls="user-panel-content" id="user-panel-header">
                            <Box display="flex">
                              <Box>
                                <IconButton size="small"> {expandedAccorditionItem === _d?._id ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
                              </Box>
                              <Box padding="5px">
                                <Typography variant="subtitle2" style={{ fontSize: '14.2056px', fontWeight: 600 }}>
                                  {_d?.fieldLabel}
                                </Typography>
                              </Box>
                            </Box>
                          </AccordionSummary>
                          <AccordionDetails>
                            {expandedAccorditionItem === _d?._id && (
                              <div className="container-with-border w-100 sm:h-[calc(574px-48px)] h-[250px] px-4 overflow-auto py-1">
                                <Chart dateFilters={dateFilters} assetId={assetId} dataPoints={[_d]} />
                              </div>
                            )}
                          </AccordionDetails>
                        </Accordion>
                      </Box>
                    );
                  })}
              </>
            )}
            {/* {expandedAccordition[dataPoint?._id] && (
              <div className="container-with-border w-100 sm:h-[calc(574px-48px)] h-[250px] px-4 overflow-auto py-1">
                <Chart dateFilters={dateFilters} assetId={assetId} dataPoints={[dataPoint]} />
              </div>
            )} */}
          </AccordionDetails>
        </Accordion>
      </Box>
    );
  };

  return (
    <>
      <Grid direction="row" justifyContent="flex-end" alignItems="center" container spacing={2}>
        <Grid>
          <FilterModel dateFilters={dateFilters} setDateFilters={setDateFilters} />
        </Grid>
        <Grid item>
          <SearchBox
            onChange={(e) => {
              setSearchValue(e.target.value);
            }}
            value={searchValue}
            size="small"
          />
        </Grid>
      </Grid>
      <Box mt={2}>
        {categories ? (
          categories?.map((_c) => {
            return (
              <AccordianItem
                dataPoint={_c}
                data={dataPoints?.filter((e) =>
                  searchValue?.trim() === '' ? true : e?.fieldLabel?.toLowerCase()?.includes(searchValue?.trim()?.toLowerCase())
                )}
              />
            );
          })
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Box>
      {/* <Box mt={2}>
        {dataPoints
          ?.filter((e) => (searchValue?.trim() === '' ? true : e?.fieldLabel?.toLowerCase()?.includes(searchValue?.trim()?.toLowerCase())))
          ?.map((dataPoint) => {
            return (
              <Box mt={2}>
                <Accordion
                  expanded={expandedAccordition === dataPoint?._id}
                  className={`omsAccordian`}
                  onChange={() => {
                    handleChange(dataPoint?._id);
                  }}
                >
                  <AccordionSummary aria-controls="user-panel-content" id="user-panel-header">
                    <Box display="flex">
                      <Box>
                        <IconButton size="small"> {expandedAccordition === dataPoint?._id ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
                      </Box>
                      <Box padding="5px">
                        <Typography variant="subtitle2" style={{ fontSize: '14.2056px', fontWeight: 600 }}>
                          {dataPoint?.fieldLabel}
                        </Typography>
                      </Box>
                    </Box>
                  </AccordionSummary>
                  <AccordionDetails>
                    {expandedAccordition === dataPoint?._id && (
                      <div className="container-with-border w-100 sm:h-[calc(574px-48px)] h-[250px] px-4 overflow-auto py-1">
                        <Chart dateFilters={dateFilters} assetId={assetId} dataPoints={[dataPoint]} />
                      </div>
                    )}
                  </AccordionDetails>
                </Accordion>
              </Box>
            );
          })}
      </Box> */}
    </>
  );
};

export default Analysis;
