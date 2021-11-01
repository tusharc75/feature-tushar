import React, { useState, useEffect, Fragment } from 'react'
import { Grid, Checkbox, FormControlLabel, Fab, Chip, Tooltip } from '@material-ui/core'
import {
    SwipeableList,
    SwipeableListItem,
    SwipeAction,
    TrailingActions,
    Type as ListType,
} from 'react-swipeable-list';
import { HiPencil } from "react-icons/hi";
import DeleteIcon from "@material-ui/icons/Delete";
import ChevronRightIcon from '@material-ui/icons/ChevronRight';
import InfiniteScroll from 'react-infinite-scroll-component';
import { isMobile, isTablet } from 'react-device-detect';
import AddIcon from "@material-ui/icons/Add"
import FileCopyIcon from "@material-ui/icons/FileCopy";

export default function CustomSwipableList({
    // columns,
    allowSelection,
    allowSwipe,
    primaryField,
    onClick,
    dataRows,
    selectedRecords,
    dispatch,
    onEdit,
    onDelete,
    extraParamsToCheckDelete,
    rowCount,
    page,
    loading,
    chips,
    permissions,
    onCreate,
    showClone,
    onClone
}) {
    const [isAllChecked, setIsAllChecked] = useState(false);

    // useEffect(() => {
    //     setIsAllChecked(selectedRecords.length > 0 && selectedRecords.length === dataRows.filter(f => f.isChecked)?.length)
    // }, [selectedRecords])

    // const [dataToShow, setDataToShow] = useState([])

    // useEffect(() => {
    //     setDataToShow(prevState => [...prevState, ...dataRows]);
    // }, [dataRows])

    // const primaryField = columns.find(d => d.primaryField);

    // useEffect(() => {
    //     setIsAllChecked(false);
    // }, [dataRows])


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
        {
            allowSelection && <Grid container>
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
        }

        <div className="custom-swipeable-list" id="scrollableDiv">
            <div>
                <InfiniteScroll
                    dataLength={dataRows.length}
                    // height="400px"
                    next={() => {
                        setTimeout(() => {
                            dispatch({ type: 'pageChange', page: page + 1 })
                        }, 500)
                    }}
                    hasMore={dataRows.length !== rowCount}
                    loader={
                        <h3 className="text-center border mt-3 p-3 loading-dots">
                            Loading more items
                        </h3>
                    }
                    scrollableTarget="scrollableDiv"
                    endMessage={
                        loading == false && dataRows.length === rowCount ? <h3 className="text-center border p-3">
                            No more records found.
                        </h3> : <></>
                    }
                >
                    <SwipeableList
                        fullSwipe={false}
                        style={{ backgroundColor: '#f0f2f3' }}
                        threshold={0.5}
                        type={ListType.IOS}
                    >
                        {
                            dataRows.map((d, index) => (
                                <SwipeableListItem
                                    key={d._id}
                                    // leadingActions={leadingActions()}
                                    trailingActions={
                                        allowSwipe ? <TrailingActions>
                                            {
                                                showClone ? <div style={{ width: 60, background: "var(--link)" }} className="h-100 d-flex align-items-center">
                                                    <SwipeAction onClick={() => onClone(d)}>
                                                        <FileCopyIcon fontSize="small" style={{ color: "white" }} />
                                                    </SwipeAction>
                                                </div> : <></>
                                            }

                                            {
                                                permissions.isUpdate && d.allowedToEdit ? <div style={{ width: 60, background: "#163340" }} className="h-100 d-flex align-items-center">
                                                    <SwipeAction onClick={() => onEdit(d)}>
                                                        <HiPencil size={20} style={{ color: "white" }} />
                                                    </SwipeAction>
                                                </div> : <></>
                                            }

                                            {
                                                extraParamsToCheckDelete && permissions.isDelete && d.canDelete ? <div style={{ width: 60, background: "#dc3545" }} className="h-100 d-flex align-items-center">
                                                    <SwipeAction onClick={() => onDelete(d)}>
                                                        <DeleteIcon fontSize="small" style={{ color: "white" }} />
                                                    </SwipeAction>
                                                </div> : <></>
                                            }
                                        </TrailingActions> : <></>
                                    }
                                >
                                    <Grid container className="pb-2">
                                        {
                                            allowSelection && <Grid item xs={1} sm={1}>
                                                <Checkbox
                                                    color="primary"
                                                    checked={d.isChecked}
                                                    onChange={(e) => {
                                                        dataRows[index].isChecked = e.target.checked;
                                                        setIsAllChecked(dataRows.every(d => d.isChecked === true));

                                                        dispatch({
                                                            type: 'selection',
                                                            selectedRecords: dataRows.filter(d => d.isChecked)
                                                        });

                                                        dispatch({ type: "update", data: dataRows });
                                                    }}
                                                    inputProps={{ 'aria-label': 'primary checkbox' }}
                                                />
                                            </Grid>
                                        }

                                        <Grid item xs={10} sm={10} className="pl-2">

                                            {
                                                primaryField && <h4 className="ml-2 mb-2">
                                                    <span onClick={() => onClick(d)} className="link">{d[primaryField.field]}</span>
                                                </h4>
                                            }

                                            <div className="d-flex gap-2 mt-2 mb-1 flex-wrap">
                                                {
                                                    [
                                                        ...chips.map(c => (
                                                            c.forceShow === true || d[c.field] ? <Chip key={c.field} variant="outlined" onClick={c.onClick ? () => c.onClick(d, index) : null}
                                                                size="small" label={`${c.label} ${d[c.field] ?? ""}`} style={c.chipColorVariable ? generateChipStyle(c.chipColorVariable, d[c.field]?.toLowerCase()) : {}}
                                                            /> : <Fragment key={c.field}></Fragment>
                                                        ))
                                                    ]
                                                }
                                            </div>

                                        </Grid>

                                        {
                                            allowSwipe && permissions.isUpdate && d.allowedToEdit && permissions.isDelete && d.canDelete && <Grid item xs={1} sm={1} className="d-flex align-items-center">
                                                <ChevronRightIcon color="disabled" />
                                            </Grid>
                                        }

                                    </Grid>
                                </SwipeableListItem>
                            ))
                        }
                    </SwipeableList>
                </InfiniteScroll>
            </div>
        </div>

        {/* <TablePagination
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
        /> */}

        {/* {
            dataRows.length !== rowCount && <div style={{ height: 70 }}></div>
        } */}

        {
            permissions?.isCreate && isMobile && onCreate && <Tooltip title="Create">
                <Fab size="small" onClick={onCreate} className="fab-position-b-r" color="primary" aria-label="add">
                    <AddIcon />
                </Fab>
            </Tooltip>
        }
    </>
}