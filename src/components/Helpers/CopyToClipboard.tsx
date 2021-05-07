import React, { useState } from 'react'
import { MdContentCopy } from 'react-icons/md'
import IconButton from '@material-ui/core/IconButton'
import { Tooltip } from '@material-ui/core'
import PropTypes from "prop-types";

export default function CopyToClipboard({ size = 12, textToCopy, ...rest }) {

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
            <span className="pl-2" onClick={handleCopyToClipBoard} {...rest}>
                <MdContentCopy size={size} />
            </span>
        </Tooltip> : null
        }
    </>
}