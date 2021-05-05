import React, { useState } from 'react'
import { FaCopy, FaRegCopy } from 'react-icons/fa'
import IconButton from '@material-ui/core/IconButton'
import { Tooltip } from '@material-ui/core'
import PropTypes from "prop-types";

export default function CopyToClipboard({ size = 20, textToCopy, ...rest }) {

    const [show, setShow] = useState(false)
    const handleCopyToClipBoard = () => {
        navigator.clipboard.writeText(textToCopy)
        setShow(true)
        setTimeout(() => {
            setShow(false)
        }, 600)
    }
    return <>
        {textToCopy ? <Tooltip title="Copied to clipboard" open={show}>
            <IconButton onClick={handleCopyToClipBoard} {...rest}>
                <FaCopy size={size} />
            </IconButton>
        </Tooltip> : null
        }
    </>
}