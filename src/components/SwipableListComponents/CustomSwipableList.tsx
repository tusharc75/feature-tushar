import { useState, useEffect, Fragment } from 'react'
import { Grid, Checkbox, FormControlLabel, Fab, Chip, Tooltip, Menu, MenuItem } from '@material-ui/core'
import InfiniteScroll from 'react-infinite-scroll-component';
import { isMobile } from 'react-device-detect';
import MoreHorizIcon from "@material-ui/icons/MoreHoriz"
import AddIcon from "@material-ui/icons/Add";
import { MdAccountCircle, MdDelete, MdEdit, } from "react-icons/md";
import { FaCopy } from "react-icons/all";

//  Swipe functionalities are removed as we are facing overlap issue in mobile quote details screen
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
    checkError = null,
    chips,
    permissions,
    onCreate,
    showClone,
    onClone,
    fullHeight = false,
    renderedFrom,
    additionalDetails = [],
    owerCollaboratorInitialsOrImages = null
}) {

    useEffect(() => {
        localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify([]));
    }, [])

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
                                    localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify(updatedMetadata.filter(d => d.isChecked).map(m => m._id)));
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

        <div style={{ overflowY: "auto", height: fullHeight === true ? "auto" : "calc(100vh - 215px)", backgroundColor: "#F5F7F9" }} id="scrollableDiv">
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
                    {
                        dataRows.map((d, index) => (
                            <Grid key={d._id} container className={`py-2 border-bottom card-shadow mt-2 mb-2 ${index === 0 ? "mt-2 mb-2" : ""} ${checkError && checkError(d) ? "red-data-row" : ""}`}>
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
                                                localStorage.setItem(`${renderedFrom}_selected`, JSON.stringify(dataRows.filter(d => d.isChecked).map(m => m._id)));
                                            }}
                                            inputProps={{ 'aria-label': 'primary checkbox' }}
                                        />
                                    </Grid>
                                }

                                <Grid item xs={11} sm={11} className="pl-2">

                                    <div className="heading-with-icon">
                                        {
                                            primaryField && <h4 className="ml-2 quote-name text-truncate">
                                                <span onClick={() => onClick(d)} className="link quote-name text-truncate">{d[primaryField.field]}</span>
                                            </h4>
                                        }

                                        {
                                            allowSwipe && permissions.isUpdate && d.allowedToEdit && permissions.isDelete && d.canDelete &&
                                            <div className="icon-layout mr-2 d-flex">
                                                {
                                                    showClone &&
                                                    <FaCopy onClick={() => onClone(d)} size={20} className="ml-1" />
                                                }
                                                {
                                                    permissions.isUpdate && d.allowedToEdit && <MdEdit size={20} onClick={() => onEdit(d)} className="ml-1" style={{ color: "#43AEAA" }} />
                                                }
                                                {
                                                    extraParamsToCheckDelete && permissions.isDelete && d.canDelete &&
                                                    <MdDelete size={20} onClick={() => onDelete(d)} className="ml-1" style={{ color: "var(--danger-light)" }} />
                                                }
                                            </div>

                                        }
                                    </div>

                                    <div className="swipe-card-additional-details">
                                        {
                                            additionalDetails.map((a, index) => (
                                                <div key={index} className="ml-2 my-1">
                                                    <div className="swipe-card-additional-details-inner">
                                                        <span style={{ color: "#337FFB" }} className="d-flex align-items-center">{a.icon}</span>
                                                        <h5 className="text-truncate" style={{ paddingTop: "2px", fontWeight: 500 }}>{d[a.field]} asdasda sdasdasd asd asda sdasd asdasdad</h5>
                                                    </div>
                                                </div>
                                            ))
                                        }
                                    </div>

                                    <div className="d-flex gap-2 mt-2 mb-1 flex-wrap ml-2">
                                        {
                                            [
                                                ...chips.map(c => (
                                                    c.forceShow === true || d[c.field] ? <Chip className="overflow-hidden" key={c.field} variant="outlined"
                                                        onClick={c.onClick ? () => c.onClick(d, index) : null}
                                                        size="small" label={`${c.label} ${d[c.field] ?? ""}`} style={c.chipColorVariable ? generateChipStyle(c.chipColorVariable, d[c.field]?.toLowerCase()) : {}}
                                                    /> : <Fragment key={c.field}></Fragment>
                                                ))
                                            ]
                                        }
                                    </div>

                                    {
                                        d[owerCollaboratorInitialsOrImages].length > 0 && <div className="avatars ml-2 mt-2">
                                            {
                                                [...d[owerCollaboratorInitialsOrImages].slice(0, 5)].map((d, index) => (
                                                    <span className="avatars__item" key={index}>
                                                        <span className="avatar">{d.initials}</span>
                                                    </span>
                                                ))
                                            }

                                            {
                                                d[owerCollaboratorInitialsOrImages].length > 5 && <span className="font-weight-bold bold mt-2 ml-1">+{d[owerCollaboratorInitialsOrImages].length - 5} more</span>
                                            }
                                        </div>
                                    }


                                </Grid>
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
                            menuData.showClone && <MenuItem onClick={() => {
                                setAnchorEl(null);
                                menuData.onClone()
                            }}>
                                Clone
                            </MenuItem>
                        }

                        {
                            menuData.showEdit && <MenuItem onClick={() => {
                                menuData.onEdit()
                                setAnchorEl(null)
                            }}>
                                Edit
                            </MenuItem>
                        }

                        {
                            menuData.showDelete && <MenuItem onClick={() => {
                                setAnchorEl(null)
                                menuData.onDelete()
                            }}>
                                Delete
                            </MenuItem>
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