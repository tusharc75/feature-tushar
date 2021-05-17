import { useParams} from "react-router-dom";
import {useEffect, useState} from 'react'
import ThumbUpIcon from '@material-ui/icons/ThumbUp';
import ThumbDownIcon from '@material-ui/icons/ThumbDown';
import Layout from "../../components/Layout";
import { DataGrid } from "@material-ui/data-grid";
import {
    Button
} from "@material-ui/core";
import axios from 'axios'
import { couldStartTrivia } from "typescript";
const QuoteApproval=()=>{

    
    const {id}= useParams();
    const [comments,setComments]=useState("");
    const [replied,setReplied]=useState(false);
    const [validQuote,setValidQuote]=useState(true);
    const [columns,setColumns]=useState([]);
    const [rows,setRows]=useState([]);
    const [sellingPrice,setSellingPrice]=useState(0);

    const baseURL="http://localhost:4000";
    useEffect(()=>{
        fetchQuote()
    },[]);
    

    //to fetch Quote Data from QuoteID 
    const fetchQuote=()=>{
        //const baseURL = process?.env?.REACT_APP_API_URL || "https://oms-backend.vebholic.com";
        
        axios.get(baseURL+"/quote-builder/getQuotefromId/"+id)
            .then(({data})=>{
                console.log(data);
                if(data.Quote_Status==="Pending for Customer Approval"){
                    setColumns(data.Columns);
                    setRows(data.Rows);
                    setSellingPrice(data.TotalSellingPrice);
                }
                else if(data.Quote_Status==="Accepted by Customer" || data.Quote_Status==="Rejected by Customer")
                {
                    setReplied(true);
                }
                else{
                    setValidQuote(false);
                }
            })
            .catch((err)=>{
                    console.log(err);
                   setValidQuote(false); 
            });
    }


    const QuoteStatusChange=(accepted)=>{
        var body={status:"",comments:comments}
        if(accepted){
            body.status="Accepted by Customer";
        }
        else{
            body.status="Rejected by Customer";
        }
        console.log(comments);
        axios.post(baseURL+"/quote-builder/updateStatusfromCustomer/"+id,body)
            .then(({data})=>{
                setReplied(true);
            })
            .catch((err)=>{
                    console.log(err);
            });
    };
    

    return(
        <div>
        {validQuote ? 
        (<div>
            {replied ? (
                <div>
                    <h1>Thanks,Response for the Quote has been sent.</h1>
                </div>    
            ):(<div>
                <div style={{ height: 400,width:"100%"}}>
                    <DataGrid
                        columns={columns}
                        rows={rows}
                        getRowId ={(row) => row.id}/>
                </div>
                <Button variant="contained" color="primary" onClick={()=>QuoteStatusChange(true)}>
                <ThumbUpIcon/>Accept
                </Button>
                <Button variant="contained" color="secondary" onClick={()=>QuoteStatusChange(false)} >
                <ThumbDownIcon/>Reject
                </Button>
                <div>
                    Comments:
                </div>
                <div>
                <textarea onChange={(event)=>{setComments(event.target.value)}} value={comments}/>
            </div>
            </div>)}
            </div>
        ):(
            <div>
                <h1>Invalid URL, Please check the URL</h1>
            </div>
        )}
        </div>
    );

}

export default QuoteApproval;