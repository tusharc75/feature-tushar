import React, { useContext, useState, Fragment } from 'react';
import { Box, Button, capitalize, Chip, Dialog, Divider, List, ListItem, ListItemText, Typography } from '@material-ui/core';
import { useHistory } from 'react-router-dom'
import ListItemAvatar from '@material-ui/core/ListItemAvatar';
import Avatar from '@material-ui/core/Avatar';
import ImageIcon from '@material-ui/icons/Image';
import CustomDialogHeader from './CustomDialog/CustomDialogHeader';
import CustomDialogContent from './CustomDialog/CustomDialogContent';
import CustomDialogFooter from './CustomDialog/CustomDialogFooter';
import routes from './Helpers/Routes';
import { CustomDialogTransition } from 'src/constants/helpers';
import axiosInstance from 'src/axios/axiosInstance';
import { CustomToastContext } from 'src/StateProvider/CustomToastContext/CustomToastContext';
import { makeStyles } from '@material-ui/core';
import BarcodeScannerComponent from "react-qr-barcode-scanner";

const useStyles = makeStyles((theme) => ({
    grow: {
        flexGrow: 1,
    },
    menuButton: {
        marginRight: theme.spacing(2),
    },
    title: {
        display: 'none',
        [theme.breakpoints.up('sm')]: {
            display: 'block',
        },
    },
    search: {
        position: 'relative',
        borderRadius: theme.shape.borderRadius,
        backgroundColor: "white",
        '&:hover': {
            backgroundColor: "white",
        },
        marginRight: theme.spacing(2),
        marginLeft: 0,
        width: '100%',
        [theme.breakpoints.up('sm')]: {
            marginLeft: theme.spacing(3),
            // width: 'auto',
        },
    },
    searchIcon: {
        padding: theme.spacing(0, 2),
        height: '100%',
        position: 'absolute',
        pointerEvents: 'none',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: theme.palette.primary.main
    },
    inputRoot: {
        // color: 'inherit',
        width: "100%"
    },
    inputInput: {
        padding: theme.spacing(1, 1, 1, 0),
        // vertical padding + font size from searchIcon
        paddingLeft: `calc(1em + ${theme.spacing(4)}px)`,
        transition: theme.transitions.create('width'),
        width: '100%',
        // [theme.breakpoints.up('md')]: {
        //     width: '20ch',
        // },
    },
    sectionDesktop: {
        display: 'none',
        [theme.breakpoints.up('md')]: {
            display: 'flex',
        },
    },
    sectionMobile: {
        display: 'flex',
        [theme.breakpoints.up('md')]: {
            display: 'none',
        },
    },
    logo: {
        width: '140px'
    },
    root: {
        width: '100%',
        // maxWidth: '36ch',
        backgroundColor: theme.palette.background.paper,
    },
    inline: {
        display: 'inline',
    },
    brandLogo: {
        maxWidth: '10%',
        height: '45px',
        borderRadius: '4px',
        marginRight: '5px'
    },
}));

export default function Scan({ onClose }) {

    const classes = useStyles();
    const toastConfig = useContext(CustomToastContext);
    const history = useHistory();

    const [scanResult, setScanResult] = useState({ open: false, result: null })

    const closeDialog = () => {
        setScanResult({ open: false, result: null })
    }

    return (<Fragment>
        <Dialog
            fullScreen={true}
            TransitionComponent={CustomDialogTransition}
            aria-labelledby="customized-dialog-title"
            open={true}
        >
            <CustomDialogHeader title={`Scan`} onClose={onClose} ></CustomDialogHeader>
            <BarcodeScannerComponent
                width="100%"
                height="100%"
                onUpdate={(err, result: any) => {
                    if (result) {

                    }
                }}
            />
        </Dialog>
        {scanResult.open && <Dialog
                open
                fullWidth
                maxWidth="sm"
                onClose={closeDialog}
                fullScreen={false}
                TransitionComponent={CustomDialogTransition}
            >
                <CustomDialogHeader
                    title="Scanned Result"
                    onClose={closeDialog}
                    showRequiredLabel={false}
                    showManimizeMaximize={false}
                />
                <CustomDialogContent>
                    {scanResult.result.length > 0 ? <List className={classes.root}>
                            {
                                scanResult.result.map((m) => (
                                    <Fragment key={m._id}>
                                        <ListItem alignItems="flex-start">
                                            <ListItemAvatar className="mr-3">
                                                <Avatar variant="rounded" style={m.image ? { height: 80, width: 80 } : {}}>
                                                    {
                                                        m.image ? <img src={m.image} alt={m.name} loading="lazy" className="w-100" /> : <ImageIcon />
                                                    }
                                                </Avatar>
                                            </ListItemAvatar>
                                            <ListItemText
                                                primary={m.name}
                                                secondary={
                                                    <div className="d-flex flex-column gap-2">
                                                        <Typography
                                                            component="span"
                                                            variant="body2"
                                                            className={classes.inline}
                                                            color="textPrimary"
                                                        >
                                                            {capitalize(m.type)}
                                                        </Typography>

                                                        <div className="d-flex gap-3">
                                                            <Chip className="cursor-pointer" label="Rent" color="primary" title="Rent" onClick={() => {
                                                                history.push(`${routes.productDetail.path}/${m._id}/Rent`)
                                                            }} />
                                                            <Chip className="cursor-pointer" label="Buy" color="primary" title="Buy" onClick={() => {
                                                                history.push(`${routes.productDetail.path}/${m._id}/Sale`)
                                                            }} />
                                                        </div>
                                                    </div>
                                                }
                                            />
                                        </ListItem>
                                        <Divider />
                                    </Fragment>
                                ))
                            }
                        </List> : <h2 className="my-3">No Products Found...</h2>
                    }

                </CustomDialogContent>

                <CustomDialogFooter>
                    <Button variant="outlined" color="primary" onClick={closeDialog}>
                        Close
                    </Button>
                </CustomDialogFooter>
            </Dialog>
        }
    </Fragment >)


}
