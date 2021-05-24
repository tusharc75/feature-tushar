import { useParams } from "react-router-dom";
import React, { useEffect, useState } from 'react'
import { GoThumbsdown, GoThumbsup } from 'react-icons/go';
import Layout from "../../components/Layout";
import { DataGrid } from "@material-ui/data-grid";
import { Grid } from "@material-ui/core";
import {
    Button,
    makeStyles
} from "@material-ui/core";
import axios from 'axios'
import { couldStartTrivia } from "typescript";

const useStyles = makeStyles((theme) => ({
    header: {
        background: "#047d1c",
        textAlign: "center",
        padding: "10px",
        color: "white",
        boxShadow: "1px 4px 5px #7c7979",
    },
    footer: {
        position: "fixed",
        bottom: "7px",
        background: "#ecfcef",
        width: "100%",
        padding: "10px",
        display: "flex",
        alignItems: "center",
        gap: "10px",
    },
    gridContent: {
        height: "calc(100vh - 24vh)",
        width: "100%",
        marginTop: "10px",
        overflow: "auto"
    }
}));

const QuoteApproval = () => {
    const classes = useStyles();
    const { id } = useParams();
    const [comments, setComments] = useState("");
    const [replied, setReplied] = useState(false);
    const [validQuote, setValidQuote] = useState(true);
    const [columns, setColumns] = useState([]);
    const [rows, setRows] = useState([]);
    const [sellingPrice, setSellingPrice] = useState(0);
    const[currency,setCurrency]=useState("");

    const baseURL = process?.env?.REACT_APP_API_URL || "https://oms-backend.vebholic.com"
    useEffect(() => {
        fetchQuote()
    }, []);


    //to fetch Quote Data from QuoteID 
    const fetchQuote = () => {
        //const baseURL = process?.env?.REACT_APP_API_URL || "https://oms-backend.vebholic.com";

        axios.get(baseURL + "/quote-builder/getQuotefromId/" + id)
            .then(({ data }) => {
                console.log(data);
                if (data.Quote_Status === "Sent to Customer") {
                    setColumns(data.Columns);
                    setRows(data.Rows);
                    setSellingPrice(data.TotalSellingPriceamount);
                    setCurrency(data.TotalSellingPricecurr)
                }
                else if (data.Quote_Status === "Accepted by Customer" || data.Quote_Status === "Rejected by Customer") {
                    setReplied(true);
                }
                else {
                    setValidQuote(false);
                }
            })
            .catch((err) => {
                console.log(err);
                setValidQuote(false);
            });
    }

    const QuoteStatusChange = (accepted) => {
        var body = { status: "", comments: comments }
        if (accepted) {
            body.status = "Accepted by Customer";
        }
        else {
            body.status = "Rejected by Customer";
        }
        console.log(comments);
        axios.post(baseURL + "/quote-builder/updateStatusfromCustomer/" + id, body)
            .then(({ data }) => {
                setReplied(true);
            })
            .catch((err) => {
                console.log(err);
            });
    };


    return (
        <div>
            {validQuote ?
                (<div>
                    {replied ? (
                        <div className={classes.header}>
                            <h1>Thanks,Response for the Quote has been sent.</h1>
                        </div>
                    ) : (<div>
                        <div className={classes.header}>
                            <h1>Approve Quote</h1>
                        </div>
                        <div className={classes.gridContent}>
                            <DataGrid
                                columns={columns}
                                rows={rows}
                                getRowId={(row) => row.id} />
                        </div>
                        <div className={classes.footer}>
                            <Grid container>
                                <Grid item xs={12} md={4} sm={4} className="centerItem">
                                   <h1>Total : {sellingPrice} {currency}</h1> 
                                </Grid>
                                <Grid item xs={12} md={8} sm={8} className="centerItem">
                                    <textarea name="story" rows={5} placeholder="Add your comment here..." style={{ width: "100%" }} onChange={(event) => { setComments(event.target.value) }} value={comments} />
                                    <Button variant="contained" startIcon={<GoThumbsup />} color="primary" onClick={() => QuoteStatusChange(true)}>
                                        Accept
                                    </Button>
                                    <Button variant="contained" startIcon={<GoThumbsdown />} color="secondary" onClick={() => QuoteStatusChange(false)} >
                                        Reject
                                    </Button>
                                </Grid>
                            </Grid>
                        </div>
                    </div>)}
                </div>
                ) : (
                    <div>
                        <h1>Invalid URL, Please check the URL</h1>
                    </div>
                )}
        </div>
    );

}

export default QuoteApproval;