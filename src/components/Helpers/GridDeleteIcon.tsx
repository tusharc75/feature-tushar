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
                    ownerId === userId ?
                        <Tooltip title="Delete" >
                            <IconButton size="small" aria-label="Delete" onClick={onDelete}>
                                <DeleteIcon color="error" />
                            </IconButton>
                        </Tooltip> :
                        <Tooltip className="cursor-stop" title={entity !=="Project" ? `You must be the owner of this ${entity} to get the delete functionality`: `You must be the manager of this ${entity} to get the delete functionality`}>
                            <IconButton size="small" aria-label="Delete">
                                <DeleteIcon />
                            </IconButton>
                        </Tooltip> :
                    <Tooltip className="cursor-stop" title={`You do not have permission to delete ${entity}`}>
                        <IconButton size="small" aria-label="Delete">
                            <DeleteIcon />
                        </IconButton>
                    </Tooltip>
            }
        </>
    )
}
