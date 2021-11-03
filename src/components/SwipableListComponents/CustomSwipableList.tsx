import React, { useState, useEffect, Fragment } from 'react'
import { Grid, Checkbox, FormControlLabel, Fab, Chip, Tooltip, Menu, MenuItem } from '@material-ui/core'
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
import MoreHorizIcon from "@material-ui/icons/MoreHoriz"
import FileCopyIcon from "@material-ui/icons/FileCopy";
import AddIcon from "@material-ui/icons/Add";

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
    const [anchorEl, setAnchorEl] = useState(null);
    const [menuData, setMenuData] = useState({
        showClone: false,
        onClone: null,
        showEdit: false,
        onEdit: null,
        showDelete: false,
        onDelete: null,
    })

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

    const handleOpenMenu = (event) => {
        event.stopPropagation();
        setAnchorEl(event.currentTarget);
    };

    return <>
        {
            allowSelection && <Grid container>
                <Grid item xs={12} sm={12} className="pl-2 border-bottom">
                    <FormControlLabel
                        control={
                            <Checkbox
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
                    {/* <SwipeableList
                        fullSwipe={false}
                        style={{ backgroundColor: '#f0f2f3' }}
                        threshold={0.5}
                        type={ListType.IOS}
                    > */}
                    {
                        dataRows.map((d, index) => (
                            <Grid container className={`pb-2 mb-2 border-bottom ${index === 0 ? "mt-1" : ""}`}>
                                {
                                    allowSelection && <Grid item xs={1} sm={1}>
                                        <Checkbox
                                            className="pt-0"
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
                                                    c.forceShow === true || d[c.field] ? <Chip className="overflow-hidden" key={c.field} variant="outlined" onClick={c.onClick ? () => c.onClick(d, index) : null}
                                                        size="small" label={`${c.label} ${d[c.field] ?? ""}`} style={c.chipColorVariable ? generateChipStyle(c.chipColorVariable, d[c.field]?.toLowerCase()) : {}}
                                                    /> : <Fragment key={c.field}></Fragment>
                                                ))
                                            ]
                                        }
                                    </div>

                                </Grid>

                                {
                                    allowSwipe && permissions.isUpdate && d.allowedToEdit && permissions.isDelete && d.canDelete && <Grid item xs={1} sm={1} className="d-flex align-items-center">
                                        <MoreHorizIcon color="disabled" className="cursor-pointer" onClick={(event) => {
                                            handleOpenMenu(event)
                                            setMenuData({
                                                showClone: showClone,
                                                onClone: () => onClone(d),
                                                showEdit: permissions.isUpdate && d.allowedToEdit,
                                                onEdit: () => onEdit(d),
                                                showDelete: extraParamsToCheckDelete && permissions.isDelete && d.canDelete,
                                                onDelete: () => onDelete(d),
                                            })
                                        }} />
                                    </Grid>
                                }

                            </Grid>
                        ))

                    }

                    <Menu
                        id="menu-actions"
                        anchorEl={anchorEl}
                        keepMounted
                        open={Boolean(anchorEl)}
                        onClose={() => {
                            setAnchorEl(null)
                            setMenuData({
                                showClone: false,
                                onClone: null,
                                showEdit: false,
                                onEdit: null,
                                showDelete: false,
                                onDelete: null,
                            })
                        }}
                    >
                        {
                            menuData.showClone ? <MenuItem onClick={() => {
                                setAnchorEl(null);
                                menuData.onClone()
                            }}>
                                Clone
                            </MenuItem> : <></>
                        }

                        {
                            menuData.showEdit ? <MenuItem onClick={() => {
                                menuData.onEdit()
                                setAnchorEl(null)
                            }}>
                                Edit
                            </MenuItem> : <></>
                        }

                        {
                            menuData.showDelete ? <MenuItem onClick={() => {
                                setAnchorEl(null)
                                menuData.onDelete()
                            }}>
                                Delete
                            </MenuItem> : <></>
                        }
                    </Menu>
                </InfiniteScroll>
            </div>
        </div>

        {
            permissions?.isCreate && isMobile && onCreate && <Tooltip title="Create">
                <Fab size="small" onClick={onCreate} className="fab-position-b-r" color="primary" aria-label="add">
                    <AddIcon />
                </Fab>
            </Tooltip>
        }
    </>
}