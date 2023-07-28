import { useCallback, useEffect, useRef, useState } from "react";
import { Box, Button, Chip, Dialog, Grid, TextField } from "@material-ui/core";
import { BiFilterAlt } from "react-icons/bi";
import HtmlTooltip from "src/components/CustomTooltipTitle";
import CustomDialogHeader from "src/components/CustomDialog/CustomDialogHeader";
import CustomDialogContent from "src/components/CustomDialog/CustomDialogContent";
import CustomDialogFooter from "src/components/CustomDialog/CustomDialogFooter";
import CommonSkeleton from "src/components/Helpers/CommonSkeleton";
import { debounce, isEmpty } from "lodash";
import { Autocomplete } from "@material-ui/lab";
import axiosInstance from "src/axios/axiosInstance";
import CloseIcon from '@material-ui/icons/Close';

const CustomFilter = ({ field, setFilterQuery }) => {
    const [isFilterOpen, setIsFilterOpen] = useState(false);

    const [formValues, setFormValues] = useState({});

    const [options, setOptions] = useState([]);
    const [loading, setLoading] = useState(false);

    const [chipData, setChipData] = useState([]);

    const fetchOptions = useCallback(debounce(async (resource: string, searchKey: string = '') => {
        try {
            const lookupResourceName = resource;
            let query = `sa-field/options?resource=${lookupResourceName}&limit=10&search=${searchKey}`;
            const response = await axiosInstance().get(query);
            const options = [...response.data.data];
            setOptions(options);
            setLoading(false)
        } catch (error) {
            console.error(error);
        }
    }, 1000), []);

    const handleFilterOpen = () => {
        setIsFilterOpen(true);
    };

    const handleClose = () => {
        setIsFilterOpen(false)
    }

    const handleSelectFilter = (name, value) => {
        setFormValues((prevState) => ({ ...prevState, [name]: value }));
    };

    const handleApplyFilter = () => {
        const chipData: any = [];
        const filterById: any = [];
        Object.keys(formValues)?.forEach(_f => {
            if (formValues[_f]) {
                chipData.push({
                    title: field?.filter(f => f?.fieldName === _f)[0]?.resource,
                    name: _f,
                    value: formValues[_f]?.optionLabel
                })
                filterById.push({
                    field: _f,
                    term: formValues[_f]?.optionValue
                })
            }
        });
        setFilterQuery(filterById)
        setChipData(chipData)
        handleClose();
    };

    const clearSingleFilter = (name) => {
        delete formValues[name];
        setChipData((prev) => prev.filter((item) => item.name !== name));
        setFilterQuery((prev) => prev.filter((item) => item.field !== name));
    };

    return (
        <>
            <Box mb={1} display='flex' justifyContent='space-between'>
                <Box minWidth="70%">
                    <DisplyaFilters
                        chipData={chipData}
                        handleFilterOpen={handleFilterOpen}
                        clearSingleFilter={clearSingleFilter}
                    />
                </Box>
                <HtmlTooltip title="Apply Filters" placement="top" arrow>
                    <Button
                        style={{ color: '#424242' }}
                        startIcon={<BiFilterAlt />}
                        size={'small'}
                        className="btn-outline-v1 light "
                        onClick={() => {
                            setIsFilterOpen(true)
                        }}
                    >
                        Filter
                    </Button>
                </HtmlTooltip>
            </Box>

            {isFilterOpen &&
                <Dialog
                    maxWidth={'md'}
                    open={true}
                    fullWidth
                    onClose={(e, reason) => {
                        if (reason !== 'backdropClick') {
                            handleClose()
                        }
                    }}
                    aria-describedby="Filter Dialog"
                >
                    <CustomDialogHeader title={`Filters`} onClose={handleClose} showRequiredLabel={false} />
                    <CustomDialogContent>
                        <Box pt={2} pb={2}>
                            <Grid container spacing={2}>
                                {
                                    field ? (
                                        field?.map((field: any, i: number) => {
                                            return (
                                                <Grid item xs={12} sm={6} md={6} key={i}>
                                                    <Autocomplete
                                                        onOpen={() => {
                                                            setOptions([])
                                                            setLoading(true)
                                                            fetchOptions(field?.resource, '')
                                                        }}
                                                        onInputChange={(event, value) => fetchOptions(field?.resource, value)}
                                                        options={options}
                                                        fullWidth
                                                        loading={loading}
                                                        getOptionLabel={(option: any) => option.optionLabel ?? ''}
                                                        getOptionSelected={(option: any, value: any) => option?.optionValue === value?.optionValue}
                                                        value={!isEmpty(formValues) && formValues[field?.fieldName]}
                                                        onChange={(e, val) => {
                                                            handleSelectFilter(field?.fieldName, val)
                                                        }}
                                                        size="small"
                                                        renderInput={(params) => (
                                                            <TextField
                                                                {...params}
                                                                label={field?.fieldLabel}
                                                                variant="outlined"
                                                                name={field?.fieldName}
                                                            />
                                                        )}
                                                    />
                                                </Grid>
                                            )
                                        })
                                    ) : (
                                        <Box p={2} height={500}>
                                            <CommonSkeleton lenArray={[...Array(10).keys()]} />
                                        </Box>
                                    )
                                }
                            </Grid>
                        </Box>
                    </CustomDialogContent>
                    <CustomDialogFooter>
                        <Button
                            onClick={handleClose}
                            size="small"
                            color="primary"
                            variant="outlined"
                        >
                            Cancel
                        </Button>
                        <Button
                            disabled={
                                isEmpty(formValues)
                                    ?
                                    true
                                    :
                                    Object.values(formValues).every(value => value === null)
                                        ?
                                        true
                                        :
                                        false
                            }
                            onClick={handleApplyFilter}
                            size="small"
                            color="primary"
                            variant="contained"
                        >
                            Apply Now
                        </Button>
                    </CustomDialogFooter>
                </Dialog>
            }
        </>
    )
}

export default CustomFilter;

const DisplyaFilters = (props) => {
    const { chipData, handleFilterOpen, clearSingleFilter } = props;
    const [hiddenItems, setHiddenItems] = useState(0);

    const containerRef = useRef(null);
    const countRef = useRef(null);
    const COUNT_PADDING = 10;

    useEffect(() => {
        setHiddenItems(0);
        if (containerRef?.current) {
            hideElementAndShowNumber(containerRef.current);
        }
    }, [chipData]);

    const hideElementAndShowNumber = (container) => {
        const childItems = [...container?.children];

        childItems.forEach((item) => (item.style.display = 'inline-flex'));
        let lastVisibleItem = null;
        const hiddenItems = [];
        for (let i = 0; i < childItems.length; i++) {
            const item = childItems[i] as HTMLDivElement;
            const isOverlapping = item.getBoundingClientRect().right >= container.getBoundingClientRect().right - COUNT_PADDING;
            if (isOverlapping) {
                hiddenItems.push(item);
                if (!lastVisibleItem) {
                    lastVisibleItem = childItems[i - 1];
                }
            }
        }
        hiddenItems.forEach((item) => (item.style.display = 'none'));

        const count = hiddenItems.length;
        setHiddenItems(count);

        const deltaX = lastVisibleItem?.offsetLeft + lastVisibleItem?.clientWidth;

        if (countRef.current) {
            countRef.current.style.cssText = `
          left: ${deltaX + COUNT_PADDING}px;
          display: ${count === 0 ? 'none' : 'block'};
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          cursor: pointer;
          `;
        }
    };

    return (
        <div className="custom-filter">
            {chipData?.length > 0 && (
                <div className="chip-container" style={{ paddingRight: `${55 + COUNT_PADDING}px` }}>
                    <div className={'chip-group'} ref={containerRef}>
                        {chipData?.map((filter) => (
                            <Chip
                                onClick={handleFilterOpen}
                                className={'filter-chip'}
                                deleteIcon={<CloseIcon />}
                                label={`${filter?.title}=${filter?.value}`}
                                onDelete={() => clearSingleFilter(filter.name)}
                            />
                        ))}
                    </div>

                    <div
                        ref={countRef}
                        style={{ cursor: 'pointer', position: 'absolute', top: '50%', transform: 'translateY(-50%)' }}
                        onClick={handleFilterOpen}
                    >
                        +{hiddenItems} more
                    </div>
                </div>
            )}
        </div>
    );
};