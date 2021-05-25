import React from 'react'
import FullScreenDialog from "../../Helpers/FullScreenDialog"
import "./imagePreview.scss"

export default function ImagePreview({ open, close, image, heading = "" }) {
    return <div >
        <FullScreenDialog
            open={open}
            className="imagePreview"
            aria-labelledby="customized-dialog-title"
            heading={heading}
            close={close} >
            <div style={{
                textAlign: 'center', minHeight: "60%", maxHeight: "60%",
                minWidth: "70%", background: 'transparent'
            }}>
                <img src={image} style={{ border: '1px solid 999' }} />
            </div>
        </FullScreenDialog >
    </div>

}
