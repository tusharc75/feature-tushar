import React, { useState } from 'react'
import { Grid, Checkbox, FormControlLabel, TablePagination, Chip } from '@material-ui/core'
import {
    SwipeableList,
    SwipeableListItem,
    SwipeAction,
    TrailingActions,
    Type as ListType,
} from 'react-swipeable-list';
import { Link, useHistory } from 'react-router-dom';
import { HiPencil } from "react-icons/hi";
import DeleteIcon from "@material-ui/icons/Delete";
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import InfiniteScroll from 'react-infinite-scroll-component';

export default function CustomSwipableList({
    // columns,
    primaryField,
    dataRows,
    dispatch,
    onEdit,
    onDelete,
    rowCount,
    page,
    limit,
    pageSizes,
    chips
}) {
    const history = useHistory();
    const [isAllChecked, setIsAllChecked] = useState(false);
    // const primaryField = columns.find(d => d.primaryField);


    const generateChipStyle = (chipColorVariable, value) => {
        if (value) {
            return {
                backgroundColor: chipColorVariable[value]?.backgroundColor ?? chipColorVariable["__default__"].backgroundColor,
                border: `1px solid ${chipColorVariable[value]?.backgroundColor ?? chipColorVariable["__default__"].backgroundColor}`,
                color: chipColorVariable[value]?.color ?? chipColorVariable["__default__"].color,
            }
        }
        return {};
    }

    return <>
        <Grid container>
            <Grid item xs={12} sm={12} className="pl-1 ml-3">
                <FormControlLabel
                    control={
                        <Checkbox
                            className="pl-2"
                            checked={isAllChecked}
                            onChange={(e) => {
                                setIsAllChecked(e.target.checked);
                                const updatedMetadata = dataRows.map(d => {
                                    return { ...d, isChecked: e.target.checked };
                                })
                                dispatch({
                                    type: 'selection',
                                    selectedRecords: updatedMetadata.filter(d => d.isChecked)
                                });
                                dispatch({ type: "update", data: updatedMetadata });
                            }}
                            name="checkedB"
                            color="primary"
                        />
                    }
                    label="Check All"
                />
            </Grid>
        </Grid>

        {/* <InfiniteScroll
            dataLength={dataRows.length}
            // height="500px"
            scrollableTarget="scrollableDiv"
            next={() => {
                setTimeout(() => {
                    dispatch({ type: 'pageChange', page: page + 1 })
                }, 1500)
            }}
            hasMore={true}
            loader={
                <h3 className="text-center border mt-3 p-3 loading-dots">
                    Loading more items
                </h3>
            }
        > */}
        <SwipeableList
            fullSwipe={false}
            style={{ backgroundColor: '#f0f2f3' }}
            threshold={0.5}
            type={ListType.IOS}
        >
            {
                dataRows.map((d, index) => (
                    <SwipeableListItem
                        // leadingActions={leadingActions()}
                        trailingActions={
                            <TrailingActions>
                                {
                                    d.allowedToEdit && <div style={{ width: 60, background: "#163340" }} className="h-100 d-flex align-items-center">
                                        <SwipeAction onClick={() => onEdit(d)}>
                                            <HiPencil size={20} style={{ color: "white" }} />
                                        </SwipeAction>
                                    </div>
                                }

                                {
                                    d.canDelete && <div style={{ width: 60, background: "#dc3545" }} className="h-100 d-flex align-items-center">
                                        <SwipeAction onClick={() => onDelete(d)}>
                                            <DeleteIcon fontSize="small" style={{ color: "white" }} />
                                        </SwipeAction>
                                    </div>
                                }
                            </TrailingActions>
                        }
                    >
                        <Grid container className="pb-2">
                            <Grid item xs={1} sm={1}>
                                <Checkbox
                                    color="primary"
                                    checked={d.isChecked}
                                    onChange={(e) => {
                                        dataRows[index].isChecked = e.target.checked;
                                        setIsAllChecked(!dataRows.some(d => d.isChecked === false));

                                        dispatch({
                                            type: 'selection',
                                            selectedRecords: dataRows.filter(d => d.isChecked)
                                        });

                                        dispatch({ type: "update", data: dataRows });
                                    }}
                                    inputProps={{ 'aria-label': 'primary checkbox' }}
                                />
                            </Grid>

                            <Grid item xs={10} sm={10} className="pl-2">

                                {
                                    primaryField && <h4 className="ml-2 mb-2">
                                        <span onClick={() => primaryField.onClick(d)} className="link">{d[primaryField.field]}</span>
                                    </h4>
                                }

                                <div className="d-flex gap-2 mt-2 mb-1 flex-wrap">
                                    {
                                        [
                                            // ...columns.filter(d => !d.primaryField).map(c => (
                                            //     <Chip variant="outlined" onClick={c.onClick ?? null} size="small" label={d[c.field]} />
                                            // )),
                                            ...chips.map(c => (
                                                <Chip variant="outlined" onClick={c.onClick ? () => c.onClick(d) : null}
                                                    size="small" label={`${c.label} ${d[c.field]}`} style={c.chipColorVariable ? generateChipStyle(c.chipColorVariable, d[c.field]?.toLowerCase()) : {}}
                                                />
                                            ))
                                        ]
                                    }
                                </div>

                            </Grid>

                            <Grid item xs={1} sm={1} className="d-flex align-items-center">
                                <ChevronRightIcon color="disabled" />
                            </Grid>

                        </Grid>
                    </SwipeableListItem>
                ))
            }
        </SwipeableList>
        {/* </InfiniteScroll> */}


        <TablePagination
            component="div"
            count={rowCount}
            page={page}
            className="agPagination"
            onPageChange={(event, newPage) => {
                dispatch({ type: 'pageChange', page: newPage });
            }}
            rowsPerPage={limit}
            onRowsPerPageChange={(event) => {
                dispatch({ type: 'pageSizeChange', limit: event.target.value });
            }}
            rowsPerPageOptions={pageSizes}
            labelRowsPerPage={<>Rows</>}
        />

        <div style={{ height: 70 }}></div>

    </>
}