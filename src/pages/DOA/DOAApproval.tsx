import { useParams,useHistory} from "react-router-dom";
import {useEffect, useState,useContext} from 'react'
import ThumbUpIcon from '@material-ui/icons/ThumbUp';
import ThumbDownIcon from '@material-ui/icons/ThumbDown';
import Layout from "../../components/Layout";
import { DataGrid } from "@material-ui/data-grid";
import ChatRender from '../../components/Chatter'
import {
    Button
} from "@material-ui/core";
import axiosInstance from '../../axios/axiosInstance'
import VisibilityIcon from '@material-ui/icons/Visibility';
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";



const DOAApproval=()=>{

    
    const toastConfig = useContext(CustomToastContext);
    const history=useHistory();
    const {id}= useParams();
    const [comments,setComments]=useState("");
    const [columns,setColumns]=useState([]);
    const [rows,setRows]=useState([]);
    const [sellingPrice,setSellingPrice]=useState(0);
    const [loading,setLoading]=useState(true);
    const [chatid,setChatid]=useState("")
    const [needDOA,setneedDOA]=useState(false)
    const [PDFName,setPDFName]=useState("");
    const [buttontext,setButton]=useState("Accept");
    const [QStatus,setQStatus]=useState(true);
    var DOALimit=0


    useEffect(()=>{
        fetchDOA()
    },[]);

    useEffect(()=>{
        fetchQuote()
    },[]);

    const fetchDOA=()=>{
        axiosInstance()
            .get('doa-request/limit')
            .then(({ data }) => {
                console.log("DOA limit is:");
                console.log(data);
                DOALimit=data.limit;           
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
                setLoading(false);
            });
    }
    

    //to fetch Quote Data from QuoteID 
    const fetchQuote=()=>{
        //const baseURL = process?.env?.REACT_APP_API_URL || "https://oms-backend.vebholic.com";
        setLoading(true);
        axiosInstance().get("/quote-builder/getQuotefromDOAId/"+id)
            .then(({data})=>{
                console.log(data);
                    setColumns(data.Columns);
                    setRows(data.Rows);
                    setSellingPrice(data.TotalSellingPrice);
                    if(DOALimit<data.TotalSellingPrice){
                        setneedDOA(true);
                        setButton("Send for DOA");
                    }
                    setPDFName(data.PDF)
                    setChatid(data.chatter);
                    console.log(data.chatter);
                    if(data.Quote_Status!=="Sent for DOA"){
                        setQStatus(false);
                    }
                    setLoading(false);
            })
            .catch((err)=>{
                    console.log(err);
            });
    }


    const QuoteStatusChange=(accepted)=>{
        
        if(accepted){
            if(needDOA){
                axiosInstance().post("/doa-request/createParent/"+id)
                .then(({data})=>{
                    history.push('/doa-request')
                    
                })
                .catch((err)=>{
                        console.log(err);
                });
            }
            else{
                axiosInstance().post("/doa-request/DOAResponse/"+id,{response:"Accepted "})
            .then(({data})=>{
                history.push('/doa-request')
                
            })
            .catch((err)=>{
                    console.log(err);
            });
            }
        }
        else{
            axiosInstance().post("/doa-request/DOAResponse/"+id,{response:"Rejected"})
            .then(({data})=>{
                history.push('/doa-request')
                
            })
            .catch((err)=>{
                    console.log(err);
            });
        }
        console.log(comments);
    };
    

    const ViewQuote=()=>{
        axiosInstance().get("/user/download?fileName="+PDFName,{
            responseType:"blob"
        })
            .then(({data})=>{
                const file = new Blob([data], { type: "application/pdf" });
                const fileURL = URL.createObjectURL(file);
                const pdfWindow = window.open();
                pdfWindow.location.href = fileURL;
            })
            .catch((err)=>{
                    console.log(err);
            });
    }

    return(
        <Layout>
        <div>
                <div style={{ height: 400,width:"100%"}}>
                    <DataGrid
                        columns={columns}
                        rows={rows}
                        getRowId ={(row) => row.id}/>
                </div>
                {QStatus?(
                <><Button variant="contained" color="primary" onClick={()=>QuoteStatusChange(true)}>
                <ThumbUpIcon/>{buttontext}
                </Button>
                <Button variant="contained" color="secondary" onClick={()=>QuoteStatusChange(false)} >
                <ThumbDownIcon/>Reject
                </Button>
                </>):(null)}
                <Button variant="contained" color="primary" onClick={()=>ViewQuote()}>
                <VisibilityIcon/>View
                </Button>

                <div>
                    Comments:
                </div>
                <div>
                {!loading && <ChatRender id={chatid}/>}
            </div>
            </div>
        </Layout>
    );

}

export default DOAApproval;