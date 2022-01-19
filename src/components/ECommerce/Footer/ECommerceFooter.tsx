import { IconButton } from '@material-ui/core';
import React from 'react'
import { Link } from 'react-router-dom';
import { SVG } from "../../../assets"
import FacebookIcon from '@material-ui/icons/Facebook';
import YouTubeIcon from '@material-ui/icons/YouTube';
import InstagramIcon from '@material-ui/icons/Instagram';
import TwitterIcon from '@material-ui/icons/Twitter';

export default function ECommerceFooter() {
    return (
        <div className="py-5 px-5 bg-primary">
            <div className="d-flex flex-column gap-4">

                <div className="px-4 d-flex gap-5 text-white">

                    <Link to="/">About us</Link>
                    <Link to="/">Terms & Conditions</Link>
                    <Link to="/">Privacy Policies</Link>
                    <Link to="/">Blog</Link>
                    <Link to="/">Reviews</Link>
                    <Link to="/">Near Me</Link>
                    <Link to="/">Contact Us</Link>

                </div>

                <hr />

                <div className="px-4 d-flex gap-5 text-white">

                    <Link to="/">Buy</Link>
                    <Link to="/">Plan</Link>
                    <Link to="/">Rent</Link>
                    <Link to="/">Configure</Link>
                    <Link to="/">Auction</Link>
                    <Link to="/">Advertise</Link>
                    <Link to="/">Market</Link>
                    <Link to="/">Sell</Link>

                </div>

                <div className="mt-3 px-4 text-white d-flex flex-column gap-2">

                    <h4>About Us</h4>

                    <div className="d-flex gap-3">
                        <Link to="/">eQuip-T Website</Link>
                        <Link to="/">Contact Details</Link>
                    </div>

                </div>

                <div className="mt-3 px-4 text-white d-flex flex-column gap-2">

                    <h4>T&C</h4>

                    <div className="d-flex gap-3">
                        <Link to="/">Branches</Link>
                        <Link to="/">Branches</Link>
                    </div>

                </div>

                <hr />

                <div className="px-4 px-4 d-flex align-items-center justify-content-space-between gap-4 text-white">

                    <div className="d-flex gap-3 align-items-center">

                        <Link to="/">
                            <img style={{ width: '140px' }} src={SVG('LogoPng')} alt="equip logo" title="eQuipt Logo" />
                        </Link>

                        <p>&#9400; 2020 - {new Date().getFullYear()} eQuipT Pvt. Ltd.</p>

                    </div>

                    <div className="d-flex gap-3">

                        <IconButton color="inherit" onClick={() => { }}
                        >
                            <FacebookIcon />
                        </IconButton>

                        <IconButton color="inherit" onClick={() => { }}
                        >
                            <YouTubeIcon />
                        </IconButton>

                        <IconButton color="inherit" onClick={() => { }}
                        >
                            <InstagramIcon />
                        </IconButton>

                        <IconButton color="inherit" onClick={() => { }}
                        >
                            <TwitterIcon />
                        </IconButton>

                    </div>

                </div>

            </div>

        </div>
    )
}
