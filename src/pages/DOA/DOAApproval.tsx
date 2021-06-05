import { useParams, useHistory } from "react-router-dom";
import { useEffect, useState, useContext } from 'react'
import ThumbUpIcon from '@material-ui/icons/ThumbUp';
import ThumbDownIcon from '@material-ui/icons/ThumbDown';
import Layout from "../../components/Layout";
import { DataGrid } from "@material-ui/data-grid";
import ChatRender from '../../components/Chatter'
import axiosInstance from '../../axios/axiosInstance'
import VisibilityIcon from '@material-ui/icons/Visibility';
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import {
    Button,
    Radio,
    Grid,
    Paper,
    Typography
} from "@material-ui/core";
import { GiAbstract055 } from 'react-icons/gi';
import { AiOutlineEye } from 'react-icons/ai';
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import Activity from "../../components/Activity";
import { quoteBuilder } from "../../constants/helpers";



const DOAApproval = () => {


    const toastConfig = useContext(CustomToastContext);
    const history = useHistory();
    const { id } = useParams();
    const [comments, setComments] = useState("");
    const [columns, setColumns] = useState([]);
    const [rows, setRows] = useState([]);
    const [sellingPrice, setSellingPrice] = useState(0);
    const [loading, setLoading] = useState(true);
    const [chatid, setChatid] = useState("")
    const [QData, setQData] = useState({});
    const [needDOA, setneedDOA] = useState(false)
    const [PDFName, setPDFName] = useState("");
    const [buttontext, setButton] = useState("Accept");
    const [QStatus, setQStatus] = useState(true);
    var DOALimit = 0;
    var DOAsetup = false;


    useEffect(() => {
        fetchQuote()
    }, []);



    const fetchDOA = (user) => {
        axiosInstance()
            .post('doa-request/limit', { user: user })
            .then(({ data }) => {
                console.log("DOA limit is:");
                console.log(data);
                DOAsetup = data.data.doasetup;
                DOALimit = data.data.limit;
                if (DOALimit < data.TotalSellingPrice && DOAsetup) {
                    setneedDOA(true);
                    setButton("Send for DOA");
                }
                setLoading(false);

            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
                setLoading(false);
            });
    }


    //to fetch Quote Data from QuoteID 
    const fetchQuote = () => {
        //const baseURL = process?.env?.REACT_APP_API_URL || "https://oms-backend.vebholic.com";
        setLoading(true);
        axiosInstance().get("/quote-builder/getQuotefromDOAId/" + id)
            .then(({ data }) => {
                console.log(data);
                setColumns(data.Columns);
                setRows(data.Rows);
                setSellingPrice(data.TotalSellingPrice);
                fetchDOA(data.Quotedby);
                setPDFName(data.PDF)
                setChatid(data.chatter);
                console.log(data.chatter);
                setQData(data);
                if (data.Quote_Status !== "Sent for DOA") {
                    setQStatus(false);
                }

            })
            .catch((err) => {
                console.log(err);
            });
    }


    const QuoteStatusChange = (accepted) => {

        if (accepted) {
            if (needDOA) {
                axiosInstance().post("/doa-request/createParent/" + id)
                    .then(({ data }) => {
                        history.push('/doa-request')

                    })
                    .catch((err) => {
                        console.log(err);
                    });
            }
            else {
                axiosInstance().post("/doa-request/DOAResponse/" + id, { response: "Accepted " })
                    .then(({ data }) => {
                        history.push('/doa-request')

                    })
                    .catch((err) => {
                        console.log(err);
                    });
            }
        }
        else {
            axiosInstance().post("/doa-request/DOAResponse/" + id, { response: "Rejected" })
                .then(({ data }) => {
                    history.push('/doa-request')

                })
                .catch((err) => {
                    console.log(err);
                });
        }
        console.log(comments);
    };


    const ViewQuote = () => {
        axiosInstance().get("/user/download?fileName=" + PDFName, {
            responseType: "blob"
        })
            .then(({ data }) => {
                console.log(data);
                const file = new Blob([data], { type: "application/pdf" });
                const fileURL = URL.createObjectURL(file);
                const pdfWindow = window.open();
                pdfWindow.location.href = fileURL;
            })
            .catch((err) => {
                console.log(err);
            });
    }

    return (
        <Layout>
            <Grid container direction="row">
                <CustomBreadCrumbs routes={[{ title: "DOA Requests", path: "/doa-request" },
                { title: id }]} />
            </Grid>
            <Grid container spacing={1} className="detail-container">
                <Grid item xs={12} sm={12} md={8} lg={8}>
                    <Paper className="subContainer">
                        <Grid container className="detailHeader">
                            <Grid item xs={12} md={5} sm={6} className="d-flex align-items-center gap-1">
                                <GiAbstract055 color="primary" /><span className="listingHeader">DOA Request</span>
                            </Grid>
                            <Grid item xs={12} md={7} sm={6} className="d-flex align-items-center gap-1" container justify="flex-end">
                                <Button onClick={() => ViewQuote()} variant="outlined" size="small" startIcon={<AiOutlineEye />} color="primary">View</Button>
                                {QStatus ? (<><Button onClick={() => QuoteStatusChange(true)} variant="outlined" size="small" startIcon={<ThumbUpIcon />} color="primary">{buttontext}</Button>
                                    <Button onClick={() => QuoteStatusChange(false)} startIcon={<ThumbDownIcon />} variant="contained" size="small" color="primary">Reject</Button></>) : null}
                            </Grid>
                        </Grid><Grid container>
                            <Grid item xs={12} sm={12} md={12} lg={12} spacing={2}>
                                <Grid item xs={12} md={12} sm={12} className="d-flex align-items-center gap-1 quotePanel">
                                    <div className="quoteBox">
                                        <span>Total Profit</span>
                                        <span>{QData["TotalProfitamount"]} {QData["TotalProfitcurr"]}</span>
                                    </div>
                                    <div className="quoteBox">
                                        <span>Total Cost Price</span>
                                        <span>{QData["TotalCostamount"]} {QData["TotalCostcurr"]}</span>
                                    </div>
                                    <div className="quoteBox">
                                        <span>Total Selling Price</span>
                                        <span>{QData["TotalSellingPriceamount"]} {QData["TotalSellingPricecurr"]}</span>
                                    </div>
                                    <div className="quoteBox">
                                        <span>Total Margin</span>
                                        <span> {QData["TotalMarginamount"]} {QData["TotalMargincurr"]}</span>
                                    </div>
                                    <div>
                                    </div>
                                </Grid>
                                <DataGrid
                                    autoHeight
                                    columns={columns}
                                    rows={rows}
                                    getRowId={(row) => row.id} />
                            </Grid>

                        </Grid>
                    </Paper>
                </Grid>
                <Grid item xs={12} sm={12} md={4} lg={4}>
                    {/* <ChatRender id={QData["chatter"]} isLoaded={true}/> */}
                    <Activity
                        relatedTo={[
                            {
                                type: "DOA",
                                referenceId: QData["quoteBuilderId"],
                                access: true,
                            },
                        ]}
                        handleActivityRefresh={() => { }}

                    />
                </Grid>
            </Grid>
        </Layout>
    );


    // }

    // return(
    //     <Layout>
    //     <Grid container direction="row">
    //     <CustomBreadCrumbs routes={[{ title: "DOA Requests", path: "/doa-request" },
    //             { title: id }]} />
    //     </Grid>
    //     <div>
    //             <div style={{ height: 400,width:"100%"}}>
    //                 <DataGrid
    //                     columns={columns}
    //                     rows={rows}
    //                     getRowId ={(row) => row.id}/>
    //             </div>
    //             {QStatus?(
    //             <><Button variant="contained" color="primary" onClick={()=>QuoteStatusChange(true)}>
    //             <ThumbUpIcon/>{buttontext}
    //             </Button>
    //             <Button variant="contained" color="secondary" onClick={()=>QuoteStatusChange(false)} >
    //             <ThumbDownIcon/>Reject
    //             </Button>
    //             </>):(null)}
    //             <Button variant="contained" color="primary" onClick={()=>ViewQuote()}>
    //             <VisibilityIcon/>View
    //             </Button>

    //             <div>
    //                 Comments:
    //             </div>
    //             <div>
    //             {!loading && <ChatRender id={chatid}/>}
    //         </div>
    //         </div>
    //     </Layout>
    // );

}

export default DOAApproval;