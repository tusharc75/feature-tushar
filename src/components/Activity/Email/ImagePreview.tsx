import React from 'react'
import FullScreenDialog from "../../Helpers/FullScreenDialog"
import "./imagePreview.scss"
import emailStyle from "../../../pages/Activity/Email/email.module.scss"

export default function ImagePreview({ open, close, image, heading = "" }) {
    return <div >
        <FullScreenDialog
            open={open}
            className="imagePreview"
            aria-labelledby="customized-dialog-title"
            heading={heading}
            close={close} >
            <div className={emailStyle.previewImageContainer}>
                <img src={image} />
            </div>
        </FullScreenDialog >
    </div>

}
