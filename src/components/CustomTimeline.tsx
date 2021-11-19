import * as React from 'react';
import {
    Timeline,
    TimelineConnector,
    TimelineContent,
    TimelineDot,
    TimelineItem,
    TimelineSeparator
} from "@material-ui/lab";
import {CssBaseline, Grid} from "@material-ui/core";
import { makeStyles, ThemeProvider } from "@material-ui/core/styles";
import {FaCopy, GiMilkCarton, IoCart , RiSpaceShipLine} from "react-icons/all";

import {MdDelete, MdEdit} from "react-icons/md";
// import styles from './CustomTimeline.scss';



const useStyles = makeStyles(() => ({
        MuiTimelineItem: {
            missingOppositeContent: {
                "&:before": {
                    display: "none !important"
                }
            }
        }
}));



export default function BasicTimeline(
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
) {


    const classes = useStyles();



    return (
        <Timeline style={{justifyContent:"flex-start"}}>
            <TimelineItem className="timelineItemLayout">
                <TimelineSeparator>
                    <TimelineDot style={{backgroundColor:"#8BC646"}}/>
                    <TimelineConnector style={{border: "1px dashed #8BC646"}}/>
                </TimelineSeparator>
                <TimelineContent>
                    <div className="timeline-content-layout">

                    <div className="d-flex align-items-center">
                        <RiSpaceShipLine  size={32} style={{paddingRight:"3px" , color:"#8BC646" , rotate:"90deg"}}/>
                        <div>
                        <h3>Ready to deliver</h3>
                        <h5>Rental/New Rental</h5>
                        </div>

                    </div>

                    <div>
                        <h4>Dec/11/21</h4>

                    </div>

                    </div>


                </TimelineContent>
            </TimelineItem>
            <TimelineItem>
                <TimelineSeparator>
                    <TimelineDot />
                    <TimelineConnector />
                </TimelineSeparator>
                <TimelineContent>Code</TimelineContent>
            </TimelineItem>
            <TimelineItem>
                <TimelineSeparator>
                    <TimelineDot />
                </TimelineSeparator>
                <TimelineContent>Sleep</TimelineContent>
            </TimelineItem>
        </Timeline>
    );
}