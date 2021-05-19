import { useHistory } from "react-router-dom";
import Box from '@material-ui/core/Box';
import {Button,Tooltip} from '@material-ui/core';
import { Link } from 'react-router-dom'
import axiosInstance from '../../axios/axiosInstance'
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import React, { useState, useEffect, Fragment, useContext } from "react";


const Quote = (props) => {
    const toastConfig = useContext(CustomToastContext)
    const { productBuilderId,newVersion,version} = props;
    console.log(newVersion);
    const history = useHistory();
    const CreateorOpenQuoteBuilder=()=>{
        if(newVersion){
            //create the Quote if no other version exists
            console.log("Create Quote");
            axiosInstance().post(`/quote-builder/createquotefrompricebuilder/`+productBuilderId, {}).then(({ data}) => {
                history.push('/quote-builder/'+productBuilderId);
            }).catch((error) => {
                toastConfig.setToastConfig(error);
            });
        }
        else{
            history.push('/quote-builder/'+productBuilderId);
        }
    }
    const message= "Version "+version+" has same inventory,Click to View";
    return (<div>
        {newVersion ?
        (<Box mt={5} mb={3} >
            <Box>
                <Button variant="contained" size="small" color="primary" onClick={() =>{CreateorOpenQuoteBuilder()}}>Generate Quote</Button>
                
            </Box>
        </Box>):(
          <Box mt={5} mb={3} >
          <Box>
            <Tooltip title={message}>
              <Link to={'/quote-builder/'+productBuilderId}>
                  <Button variant="contained" size="small" color="primary" onClick={() =>{}}>View Quote</Button>
              </Link>
            </Tooltip>
            </Box>
            </Box>  
        )}
    </div>
    );
}

export default Quote;
