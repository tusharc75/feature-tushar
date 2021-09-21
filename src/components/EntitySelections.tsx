import React, { useState, useEffect } from "react"
import axiosInstance from "../axios/axiosInstance";
import List from "@material-ui/core/List"
import ListItem from "@material-ui/core/ListItem"
import ListItemIcon from "@material-ui/core/ListItemIcon"
import Checkbox from "@material-ui/core/Checkbox"
import ListItemText from "@material-ui/core/ListItemText"
import { entity } from "../constants/helpers"
import Tooltip from "@material-ui/core/Tooltip"
import IconButton from "@material-ui/core/IconButton"
import { AiOutlineDeploymentUnit } from "react-icons/ai"
import CustomButton from './Helpers/CustomButton'
import Button from "@material-ui/core/Button"
import CustomDialogContent from './CustomDialog/CustomDialogContent';
import CustomDialogFooter from './CustomDialog/CustomDialogFooter';
import CustomDialogHeader from './CustomDialog/CustomDialogHeader';
import Dialog from '@material-ui/core/Dialog'
import { isMobile, isTablet } from "react-device-detect";
import { CustomDialogTransition } from "../constants/helpers";
import Card from '@material-ui/core/Card';
import CardContent from '@material-ui/core/CardContent';
import Typography from '@material-ui/core/Typography';

export default function EntitySelections(props) {
    const { data, entities = [], onAssignEntity=null } = props
    const { entityResource, entityApi } = entity;
    const [entityList, setEntityList] = useState([])
    const [showEntityDialog, setShowEntityDialog] = useState(false)
    const [selectedEntities, setSelectedEntities] = useState([])

    useEffect(() => {
        setSelectedEntities([...entities])
    }, [entities])

    useEffect(() => {
        fetchEntities()
    }, [])

    const fetchEntities = () => {
        axiosInstance()
            .get(`${entityApi}`)
            .then(({ data: { data } }) => {
                setEntityList(data)
            })
    }

    const submitForm = () => {

    }

    return <>
        <Tooltip title="Clone">
            <IconButton
                size="small"
                aria-label="Clone"
                onClick={() => setShowEntityDialog(true)}>
                <AiOutlineDeploymentUnit fontSize="small" color="primary" />
            </IconButton>
        </Tooltip>
        {
            showEntityDialog ?
                <Dialog
                    maxWidth="sm"
                    fullScreen={isMobile || isTablet}
                    TransitionComponent={CustomDialogTransition}
                    aria-labelledby="customized-dialog-title"
                    open={true}
                    onClose={(e, reason) => {
                        if (reason !== 'backdropClick') { }
                    }}
                    fullWidth>
                    <CustomDialogHeader
                        title="Assign Entity"
                        onClose={() => setShowEntityDialog(false)} />

                    <CustomDialogContent>
                        {
                            entityList.length === 0 ?
                                <>
                                    <Card>
                                        <CardContent>
                                            <Typography variant="h5" component="h2">
                                                No Entity
                                            </Typography>
                                        </CardContent>
                                    </Card>
                                </> :
                                <List style={{ padding: 0 }}>
                                    {entityList.map((d) => (
                                        <ListItem divider key={d._id}>
                                            <ListItemIcon>
                                                <Checkbox
                                                    edge="start"
                                                    onChange={(e) => {
                                                        let list = [...selectedEntities]
                                                        if (e.target.checked && list.indexOf(d._id) < 0) {
                                                            list.push(d._id)
                                                        } else {
                                                            list.splice(list.indexOf(d._id), 1)
                                                        }
                                                        setSelectedEntities(list)
                                                    }}
                                                    checked={selectedEntities.indexOf(d._id) >= 0}
                                                    inputProps={{
                                                        "aria-labelledby": `checkbox-list-label-${d._id}`,
                                                    }}
                                                />
                                            </ListItemIcon>
                                            <ListItemText
                                                primary={d.entityName || ""}
                                                secondary={d.address || ""}
                                            />
                                        </ListItem>
                                    ))}
                                </List>
                        }
                    </CustomDialogContent>
                    <CustomDialogFooter>
                        <Button size="small" color="primary"
                            onClick={() => setShowEntityDialog(false)}
                        >Cancel</Button>
                        <CustomButton
                            // loading={loading}
                            variant="contained"
                            color="primary"
                            type="submit"
                            onClick={() => onAssignEntity(selectedEntities)}
                        > Save
                        </CustomButton>
                    </CustomDialogFooter>
                </Dialog >
                : null}
    </>
}