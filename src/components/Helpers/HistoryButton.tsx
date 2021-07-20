import React from 'react';
import Box from "@material-ui/core/Box"
import { IconButton } from "@material-ui/core";
import Tooltip from "@material-ui/core/Tooltip"
import { AiOutlineHistory } from 'react-icons/ai';

export default function HistoryButton(props) {
    const { onClick } = props
    return <Box>
        <Tooltip title="History">
            <IconButton className="mr-2" style={{ padding: '6px' }}
                onClick={onClick}>
                <AiOutlineHistory className="mr-1" size={20} />
            </IconButton>
        </Tooltip>
    </Box>
}