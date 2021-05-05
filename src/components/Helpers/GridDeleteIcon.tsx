import React from 'react'
import { Tooltip, IconButton } from '@material-ui/core'
import DeleteIcon from '@material-ui/icons/Delete';

//  entity means the record type, to show the proper message in dialog,
//  entity could be, Supplier Account, Supplier Contact, Lead, Opportunity etc
export default function GridDeleteIcon({ hasDeletePermission, ownerId, userId, onDelete, entity }) {
    return (
        <>
            {
                hasDeletePermission ?
                    ownerId == userId ?
                        <Tooltip title="Delete" >
                            <IconButton aria-label="Delete" onClick={onDelete}>
                                <DeleteIcon
                                    fontSize="small" color="error" />
                            </IconButton>
                        </Tooltip> :
                        <Tooltip className="cursor-stop" title={`You must be the owner of this ${entity} to get the delete functionality`}>
                            <IconButton aria-label="Delete">
                                <DeleteIcon fontSize="small" />
                            </IconButton>
                        </Tooltip> :
                    <Tooltip className="cursor-stop" title={`You do not have permission to delete ${entity}`}>
                        <IconButton aria-label="Delete">
                            <DeleteIcon fontSize="small" />
                        </IconButton>
                    </Tooltip>
            }
        </>
    )
}
