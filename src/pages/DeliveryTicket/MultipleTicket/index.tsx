import { useState, useEffect, useContext, useReducer, Fragment } from "react";
import Grid from '@material-ui/core/Grid';
import Button from '@material-ui/core/Button';
import { CustomToastContext } from "../../../StateProvider/CustomToastContext/CustomToastContext";
import axiosInstance from "../../../axios/axiosInstance";
import { Box, CircularProgress, IconButton, TextField, Tooltip } from "@material-ui/core";
import SearchBox from '../../../components/Helpers/SearchBox'
import { reducer, intialState } from "../../../components/AgGridComponents/CustomAgGrid";
import { gridLoadingTimeout, CustomDialogTransition, product, packages, isObjectEmpty, prepareDataForGrid } from '../../../constants/helpers';
import Dialog from "@material-ui/core/Dialog/Dialog";
import CustomDialogHeader from "../../../components/CustomDialog/CustomDialogHeader";
import MultipleTicketProcess from "./MultipleTicketProcess";


const MultipleTicket = ({ referenceData, ticketType, referenceType, handleClose }) => {

    return (<Dialog
        fullScreen={true}
        TransitionComponent={CustomDialogTransition}
        aria-labelledby="customized-dialog-title"
        open={true}
    >
        <CustomDialogHeader title={`Process ${ticketType} Ticket`} onClose={handleClose} ></CustomDialogHeader>
        <div className="listing-grid p-3">
            <MultipleTicketProcess
                referenceData={referenceData}
                ticketType={ticketType}
                referenceType={referenceType}
            />
        </div>
    </Dialog>
    );
}

export default MultipleTicket;