import { useState, useEffect } from 'react';
import { Box, Grid } from '@material-ui/core';
import moment from 'moment';
// import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
// import ExpandLessIcon from '@material-ui/icons/ExpandLess';
// import { Accordion, AccordionDetails, AccordionSummary } from 'src/components/CustomAccordion';
import FilterModel from '../Helper/FilterModel';
import SearchBox from 'src/components/Helpers/SearchBox';
import CommonSkeleton from 'src/components/Helpers/CommonSkeleton';
import type { TDataPoints, TCategories } from './types';
import { group } from './utils';
import CollapsibleTree from './CollapsibleTree';
import { useDebounce } from 'src/hooks';

const Analysis = ({ assetId, dataPoints }: { assetId: string; dataPoints: TDataPoints[] }) => {
  const [dateFilters, setDateFilters] = useState({
    from: new Date(moment().subtract(8, 'days').format('MM/DD/YYYY')),
    to: new Date(),
    intervals: '1hour'
  });

  const [searchValue, setSearchValue] = useState('');
  const debouncedSearchValue = useDebounce(searchValue, 500);
  const [categories, setCategories] = useState<TCategories[] | null>(null);
  // const [expandedAccordition, setExpandedAccordition] = useState({});
  // const [expandedAccorditionItem, setExpandedAccorditionItem] = useState(null);

  useEffect(() => {
    const categories = group({ dataPoints: dataPoints, seachKeyword: debouncedSearchValue });
    setCategories(categories);
  }, [dataPoints, debouncedSearchValue]);

  // const AccordianItem = ({ dataPoint, data }) => {
  //   return (
  //     <Box mt={2}>
  //       <Accordion
  //         expanded={expandedAccordition[dataPoint?._id]}
  //         className={`omsAccordian`}
  //         onChange={() => {
  //           setExpandedAccordition((prev) => ({
  //             ...prev,
  //             [dataPoint?._id]: expandedAccordition[dataPoint?._id] ? false : true
  //           }));
  //         }}
  //       >
  //         <AccordionSummary aria-controls="user-panel-content" id="user-panel-header">
  //           <Box display="flex">
  //             <Box>
  //               <IconButton size="small"> {expandedAccordition[dataPoint?._id] ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
  //             </Box>
  //             <Box padding="5px">
  //               <Typography variant="subtitle2" style={{ fontSize: '14.2056px', fontWeight: 600 }}>
  //                 {dataPoint?.category?.optionLabel}
  //               </Typography>
  //             </Box>
  //           </Box>
  //         </AccordionSummary>
  //         <AccordionDetails>
  //           {expandedAccordition[dataPoint?._id] && (
  //             <>
  //               {dataPoint?.child?.map((_c: any) => (
  //                 <AccordianItem dataPoint={_c} data={data} />
  //               ))}
  //               {data
  //                 ?.filter((d) => d?.category?.optionValue === dataPoint?.category?.optionValue)
  //                 ?.map((_d) => {
  //                   return (
  //                     <Box mt={2}>
  //                       <Accordion
  //                         expanded={expandedAccorditionItem === _d?._id}
  //                         className={`omsAccordian`}
  //                         onChange={() => {
  //                           setExpandedAccorditionItem((prev) => (!prev ? _d?._id : prev === _d?._id ? null : _d?._id));
  //                         }}
  //                       >
  //                         <AccordionSummary aria-controls="user-panel-content" id="user-panel-header">
  //                           <Box display="flex">
  //                             <Box>
  //                               <IconButton size="small"> {expandedAccorditionItem === _d?._id ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
  //                             </Box>
  //                             <Box padding="5px">
  //                               <Typography variant="subtitle2" style={{ fontSize: '14.2056px', fontWeight: 600 }}>
  //                                 {_d?.fieldLabel}
  //                               </Typography>
  //                             </Box>
  //                           </Box>
  //                         </AccordionSummary>
  //                         <AccordionDetails>
  //                           {expandedAccorditionItem === _d?._id && (
  //                             <div className="container-with-border w-100 sm:h-[calc(574px-48px)] h-[250px] px-4 overflow-auto py-1">
  //                               <Chart dateFilters={dateFilters} assetId={assetId} dataPoints={[_d]} />
  //                             </div>
  //                           )}
  //                         </AccordionDetails>
  //                       </Accordion>
  //                     </Box>
  //                   );
  //                 })}
  //             </>
  //           )}
  //         </AccordionDetails>
  //       </Accordion>
  //     </Box>
  //   );
  // };

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
          <CollapsibleTree categories={categories} dateFilters={dateFilters} assetId={assetId} />
        ) : (
          <Box p={2} height={500}>
            <CommonSkeleton lenArray={[...Array(10).keys()]} />
          </Box>
        )}
      </Box>
    </>
  );
};

export default Analysis;
