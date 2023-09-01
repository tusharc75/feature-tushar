import { useState } from "react";
import { Accordion, AccordionDetails, AccordionSummary, Box, Grid, IconButton, Typography } from "@material-ui/core";
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import ExpandLessIcon from '@material-ui/icons/ExpandLess';
import _ from "lodash";


export default function CustomAccordian({ expended, data, onChange, type, allData = [] }) {

    const [expandedAccordition, setExpandedAccordition] = useState<string | false>('');

    return (
        <Accordion
            expanded={expended === data[type]?.optionValue}
            className={`omsAccordian`}
            onChange={onChange}
        >
            <AccordionSummary aria-controls="user-panel-content" id="user-panel-header">
                <Box display="flex">
                    <Box>
                        <IconButton size="small"> {expended === data[type]?.optionValue ? <ExpandLessIcon /> : <ExpandMoreIcon />}</IconButton>
                    </Box>
                    <Box padding="5px">
                        <Typography variant="subtitle2" style={{ fontSize: '14.2056px', fontWeight: 600 }}>
                            {data[type].optionLabel || 'Data'}
                        </Typography>
                    </Box>
                </Box>
            </AccordionSummary>
            <AccordionDetails>
                {expended === data[type]?.optionValue && (
                    type === 'parentCategory' ? (
                        <Grid container spacing={1}>
                            {
                                _.uniqBy(allData?.filter(d => d['category']?.parentCategory === expended), 'category.optionValue')?.map((data => {
                                    return (
                                        <Grid item xs={12} sm={12} lg={12} md={12}>
                                            <CustomAccordian
                                                expended={expandedAccordition}
                                                data={data}
                                                onChange={() => {
                                                    setExpandedAccordition((prev) => (!prev ? data?.category?.optionValue : prev === data?.category?.optionValue ? false : data?.category?.optionValue));
                                                }}
                                                type={'category'}
                                                allData={allData?.filter(d => d['category']?.optionValue === expandedAccordition)}
                                            />
                                        </Grid>
                                    )
                                }))
                            }
                        </Grid>

                    )
                        :
                        type === 'category' ? (
                            <Grid container spacing={1}>
                                {allData?.filter((d) => d[type]?.optionValue === expended)?.map((data) => {
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
                                    )
                                })}
                            </Grid>
                        )
                            :
                            null
                )}
            </AccordionDetails>
        </Accordion>
    );
}