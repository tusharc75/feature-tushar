import {useContext, useEffect,Fragment,useState, useCallback} from 'react'
import Layout from "../../components/Layout";
import CustomBreadCrumbs from "../../components/CustomBreadCrumbs";
import axiosInstance from '../../axios/axiosInstance'
import { GiAbstract055 } from 'react-icons/gi';
import { CustomToastContext } from "../../StateProvider/CustomToastContext/CustomToastContext";
import CustomDynamicGrid from '../../components/CustomDynamicGrid/CustomDynamicGrid'
import { getSearchQuery } from '../../services/util';
import { termsAndCondition } from '../../constants/helpers';
import CustomRenderCell from '../../components/Helpers/CustomRenderCell'
import { DataGrid } from "@material-ui/data-grid";
import DataGridCustomToolbar from "../../components/Helpers/DataGridCustomToolbar";
import CustomDataGridNoDataFound from "../../components/Helpers/CustomDataGridNoDataFound";
import ManageTermsAndCondition from '../TermsAndConditions/ManageTermsAndCondition'
import {
  Grid as GridDropTable,
  DragDropProvider,
  Table,
  TableHeaderRow,
  TableColumnReordering,
  TableColumnVisibility,
  ColumnChooser,
  Toolbar, 
} from '@devexpress/dx-react-grid-material-ui';

import {
    Box,
    Button,
    Checkbox,
    Radio,
    Grid,
    Menu,
    MenuItem,
    Tooltip,
    IconButton,
    Divider,
    Paper
} from "@material-ui/core";
import AddIcon from "@material-ui/icons/Add";
import { Link } from 'react-router-dom';
import moment from "moment";
import NoDataCell from "../../components/Helpers/NoDataCell";
import DeleteIcon from '@material-ui/icons/Delete';
import { Console } from 'node:console';
import { getObjKeysWithValues } from '../../constants/helpers';
import { CheckBox } from '@material-ui/icons';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    EditorState,
    Editor,
    convertToRaw,
    convertFromRaw
} from 'draft-js';
import draftToHtml from 'draftjs-to-html'
let termsTimeout;



const CreatePriceBuilder=(props)=>{
    //const {priceBuilderId}= props;
    const {priceBuilderId}= {priceBuilderId:"6093cf0fcee24cd4d39ecda8"}

    const [currentVersion,setcurrentVersion]=useState(1);
    const [versions,setVersions]=useState([]);
    const toastConfig = useContext(CustomToastContext);
    const [dynamicCol,setDynamicCol]=useState([]);
    const[ColumnName,setColName]=useState([]);
    const [dynamicTableData,setDynamicTableData]=useState([])
    const [loading, setLoading] = useState(true);
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [query, setQuery] = useState({ page: 0, limit: 5 });
    const [searchVal, setSearchVal] = useState("");
    const [data, setData] = useState([]);
    const [dataRows, setDataRows] = useState([]);
    const [rowCount, setRowCount] = useState(0);
    const [RadioIndex,setRadioIndex] =useState(-1);
    const [checkAllAccounts, setCheckAllAccounts] = useState(false);
    const [editRecord, setEditRecord] = useState<any>({})
    const [tableColumnExtensions,settableColExt] = useState([
      ]);
    const [droppedColumns,setDroppedColumns]=useState([])
    const [QData,setQData]=useState({})
    const [newQuote,setNewQuote]=useState(true);
    const [fetchVersion, setFetchVersion]= useState(false);
    
    useEffect(() => {
        GetQuoteData(0);
    }, []);

    useEffect(() => {
        fetchTermsAndConditions()
    }, [query, searchVal])

    useEffect(() => {
        let rows = data?.map((u) => ({
            ...u,
            isChecked: false,
            id: u._id,
        }));
        setDataRows([...rows]);
    }, [data])


    const handlePage = (params) => {
        if (query.page !== params.page) {
            setQuery((prevState) => ({ ...prevState, page: params.page }));
        }
    };

    const handlePageSize = (params) => {
        if (params.pageSize !== query.limit) {
            setQuery({ page: 0, limit: params.pageSize });
        }
    };

    const handleCloseCreateDialog = (params) => {
        setShowCreateDialog(false)
        setEditRecord({})
        if (params?.fetchData) fetchTermsAndConditions()
    }

    const handleSortModelChange = (params) => {
        if (params?.sortModel && params.sortModel.length > 0) {
            let temp = { ...params.sortModel[0] };
            setQuery((prevState) => ({
                ...prevState,
                page: 0,
                sortBy: temp.field,
                orderBy: temp.sort,
            }));
        }
    };

    const onFilterChange = useCallback((params) => {
        if (params.filterModel.items[0].value) {
            setQuery((prevState) => ({
                ...prevState,
                [params.filterModel.items[0].columnField]:
                    params.filterModel.items[0].value,
            }));
        } else {
            setQuery({ page: 0, limit: 25 });
        }
    }, []);

    const fetchTermsAndConditions = () => {
        if (termsTimeout) {
            clearTimeout(termsTimeout);
        }

        termsTimeout = setTimeout(() => {
            setLoading(true);
            let searchParams = searchVal
                ? { ...query, search: searchVal }
                : { ...query };
            let api = getSearchQuery(termsAndCondition.api, searchParams);
            setLoading(true);
            axiosInstance()
                .get(api)
                .then(({ data }) => {
                    setData(data.data);
                    setRowCount(data.count);
                    setCheckAllAccounts(false);
                    setLoading(false);
                })
                .catch((err) => {
                    toastConfig.setToastConfig(err);
                    setLoading(false);
                });
        }, 600);
    }
    const columns = [
        {
            field: "isChecked",
            headerName: "Select",
            renderCell: (params) => (
                <Radio
                    color="primary"
                    // disabled={!params.canDelete}
                    checked={params.value}
                    onClick={(ev) => {
                        const gridData = dataRows;
                        const indexOfRecord = gridData.findIndex(
                            (d) => d.id === params.row.id
                        );
                        var prevvalue=gridData[indexOfRecord].isChecked;
                        for(var i=0;i<gridData.length;i++){
                            gridData[i].isChecked = false;
                        }
                        if(prevvalue){
                            gridData[indexOfRecord].isChecked = false;
                            setRadioIndex(-1);
                        }
                        else{
                            gridData[indexOfRecord].isChecked = true;
                            setRadioIndex(indexOfRecord);
                        }
                        console.log(gridData);
                        console.log(params.value);

                        setDataRows([...gridData]);

                        const checkedRecords = gridData.filter((d) => d.isChecked === true);

                    }}
                />
            ),
            disableColumnMenu: true,
            sortable: false,
            filterable: false,
            width: 75
        },
        {
            field: "TACName", headerName: "Name", width: 500,
            renderCell: (params) => (
                <Link
                    onClick={() => {
                        setShowCreateDialog(true);
                    }}>
                    <CustomRenderCell value={params?.value} />
                </Link>
            )
        },
       
    ];

    const GetQuoteData=(version)=>{
        if(version===0){
            axiosInstance()
            .get('getQuotefromBuilder/'+priceBuilderId)
            .then(({ data }) => {
                console.log("Got Data from API");
                console.log(data);
                QuoteData(data.Data);
                console.log(data.Data.version);
                var versionres=[]
                for(var i=1;i<data.Data.latestVersion+1;i++){
                    versionres=[...versionres, i];
                }
                console.log(versionres);
                setVersions(versionres);
                setcurrentVersion(data.Data.version);
                console.log("versions are");
                console.log(versions);
                console.log("current Version:");
                console.log(currentVersion);
                setQData(data.Data);
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
            });
            
          
    }
    else{
        axiosInstance()
            .get('quote-builder?priceBuilderId='+priceBuilderId+'&version='+version)
            .then(({ data }) => {
                QuoteData(data.Data);
                setQData(data.Data);
            })
            .catch((err) => {
                toastConfig.setToastConfig(err);
                setLoading(false);
            });
    }
    }
    const QuoteData=(data)=>{
        console.log("getting quote data");
        console.log(data);
        var TableData=[];
        var Col=[];
        var ColName=[];
        var columnext=[];
        var KeyValuePairs=[];
        type Type = {
            [key: string]: any;
          };
          
        for (var i=0;i<data.inventory.length;i++){
            var KeyValue: Type = {};
            for(var j=0;j<data.inventory[i].length;j++){
                var DataSet=data.inventory[i][j];
                if(ColName.indexOf(DataSet.fieldName)===-1){
                    ColName=[...ColName, DataSet.fieldName];
                    Col=[...Col,{title:DataSet.fieldName, name:DataSet.fieldName}];
                    console.log(DataSet.fieldName);
                    columnext=[...columnext,{ColumnName:DataSet.fieldName, width:100}];
                    console.log(columnext);
                }
                KeyValue[DataSet.fieldName]=DataSet.fieldValue;
            }
            KeyValuePairs=[...KeyValuePairs,KeyValue];
        }
        if(data.ColumnOrder){
            setColName(data.ColumnOrder)
        }
        else{
            setColName(ColName)
        }
        if(data.HiddenColumns){
            setDroppedColumns(data.HiddenColumns)
        }
        if(fetchVersion===false && data.status==='Quote not generated yet'){
            setNewQuote(false);
        }
       

        for(var j=0;j<KeyValuePairs.length;j++){
                const DataSet=KeyValuePairs[j];
                var DataRecord:Type ={};
                for(var i=0;i<ColName.length;i++){
                    if(ColName[i] in DataSet){
                        DataRecord[ColName[i]]=DataSet[ColName[i]];
                    }
                    else{
                        DataRecord[ColName[i]]='-';
                    }
                }
                TableData=[...TableData, DataRecord]
        }
        console.log(TableData);
        setDynamicTableData(TableData);
        setDynamicCol(Col);
        settableColExt(columnext);
        console.log(tableColumnExtensions)
    };

    const GeneratePdf=(view)=>{
        console.log(droppedColumns);
        console.log(ColumnName);
        const PdfDoc= new jsPDF('p', 'pt', 'a4');
        var PDFData=[];
        var PdfCol=[];
        dynamicTableData.forEach(dataEntry=>{
            var PdfRow=[];
            ColumnName.forEach(ColName=>{
                if(droppedColumns.indexOf(ColName)===-1){
                    if(PdfCol.indexOf(ColName)==-1){
                        PdfCol.push(ColName);
                    }
                    PdfRow.push(dataEntry[ColName]);
                }
            })
            PDFData.push(PdfRow);
        });
        console.log(PDFData);
        console.log(ColumnName);
        
        PdfDoc.setFontSize(14);
        var text="Please find the Quoatation Below:"
        var lineHeight = PdfDoc.getLineHeight();
        console.log(lineHeight);
        var splittedText = PdfDoc.splitTextToSize(text,50)
        PdfDoc.text(text,20,30);
        var lines = splittedText.length
        var blockHeight =(lines-2)*lineHeight;
        console.log(blockHeight);
        autoTable(PdfDoc,{
            margin:{top:20+blockHeight},
            head:[PdfCol],
            body:PDFData
        });
        let finalY= (PdfDoc as any).lastAutoTable.finalY;
        console.log(finalY);
        if(RadioIndex!==-1){
            let state=convertFromRaw(JSON.parse(dataRows[RadioIndex].description));
            let TNC= EditorState.createWithContent(state)
            var markup = draftToHtml(convertToRaw(TNC.getCurrentContent()));
            console.log(markup);
            markup=markup.replaceAll(" ","&nbsp");
            PdfDoc.html(markup,{callback: function (doc) { 
                if(view){
                    doc.output('dataurlnewwindow');
                }
                else{
                    doc.save();
                }
                
              },x:40,y:finalY+lineHeight,margin:[20,10,20,10]});
        }
        else{
        if(view){
            PdfDoc.output('dataurlnewwindow');
        }
        else{
            PdfDoc.save('Quation.pdf');
        }
    }
    }

    const handleChangeVersion = (event) => {
        setcurrentVersion(event.target.value);
        setFetchVersion(true);
        if(newQuote && event.target.value===Math.max(...versions)){
            GetQuoteData(0);
        }
        else{
            GetQuoteData(1);
        }
        
    };

    const SendforDOA=()=>{
        console.log(QData);
        var newQuoteData={}
        newQuoteData["inventory"]=QData["inventory"];
        newQuoteData["Profitability"]=QData["Profitability"];
        newQuoteData["ColumnOrder"]= ColumnName;
        newQuoteData["HiddenColumns"]= droppedColumns;
        newQuoteData["priceBuilderId"]= QData["priceBuilderId"];
        newQuoteData["Quote Status"]="Pending for DOA Approval";
        newQuoteData["Comment"]="-";
        console.log(newQuoteData);
        axiosInstance()
        .post(`/quote-builder/create`, newQuoteData)
      .then(({data}) => {
        toastConfig.setToastConfig({
            open: true,
            type: "success",
            message: data.message,
          });
        GetQuoteData(0);
        })
      .catch((err) => {
        console.log(err)
        toastConfig.setToastConfig(err);
      });

    }

    
    return(
        <Layout>
            <Grid container direction="row">
                <Grid item xs={12}>
                    <CustomBreadCrumbs routes={[{ title: "Quote Builder" }]} />
                </Grid>
            </Grid>
            <div className="header-panel">
            <Grid className="header-panel">
                <Grid item xs={6} className="d-flex align-items-center gap-1">
                    <GiAbstract055 /> <span className="listingHeader">Quote Builder</span>
                </Grid>
                <Grid item xs={6} container justify="flex-end">
                        <Button onClick={() => GeneratePdf(true)} variant="contained" size="small" color="primary">View</Button> 
                        <Button onClick={() => GeneratePdf(false)} variant="contained" size="small" color="primary">Download</Button>
                        <Button onClick={() => SendforDOA()} variant="contained" size="small" color="primary">Send for DOA</Button>
                </Grid>
            </Grid>
            </div>
            <div>
                <Grid container spacing={2}>
                    <Grid item xs={6} sm={12} md={8} lg={8} spacing={2}>
                        <Paper>
                        Inventory:
                        {/* <CustomDynamicGrid data={dynamicTableData}
                            columns={dynamicCol}
                        /> */}
                            <GridDropTable
                                rows={dynamicTableData}
                                columns={dynamicCol}
                            >
                                <DragDropProvider />
                                <Table
                                    columnExtensions={tableColumnExtensions}
                                />
                                <TableColumnReordering
                                order={ColumnName}
                                onOrderChange={setColName}
                                />
                                
                                <TableHeaderRow />
                                <TableColumnVisibility
                                    hiddenColumnNames={droppedColumns}
                                    onHiddenColumnNamesChange={setDroppedColumns}
                                />
                                <Toolbar/>
                                <ColumnChooser/>
                            </GridDropTable>
                            </Paper>
                        </Grid> 
                        <Grid item xs={6} sm={12} md={4} lg={4} spacing={2}>
                            <Paper>
                            <Grid container>
                                <Grid item xs={12}>
                                    Version:
                                    <select value={currentVersion}
                                    onChange={handleChangeVersion}>
                                        {versions.map((team) => <option key={team} value={team}>{"V-"+team}</option>)}
                                    </select>
                                    <div>
                                    Profitability:{QData["Profitability"]}
                                    </div><div>
                                    Status: {QData["Quote Status"]}
                                    </div><div>
                                    Comment:{QData["Comment"]}
                                    </div>
                                </Grid>
                            </Grid> 
                    </Paper>  
                </Grid>  
                    <Grid item xs={6} sm={12} md={8} lg={8} spacing={2}>
                        <Paper>
                        Terms and Conditons:
                        <Grid item xs={6} container justify="flex-end">
                            <Button onClick={() => setShowCreateDialog(true)} variant="contained" size="small" color="primary" startIcon={<AddIcon />}>Add</Button>
                        </Grid>
                        <div className="listing-grid">
                        <DataGrid
                                components={{
                                    Toolbar: DataGridCustomToolbar,
                                    NoRowsOverlay: CustomDataGridNoDataFound,
                                }}
                                scrollbarSize={20}
                                rows={loading ? [] : dataRows}
                                columns={columns}
                                loading={loading}
                                disableSelectionOnClick
                                disableMultipleSelection
                                paginationMode="server"
                                pagination
                                onPageChange={handlePage}
                                onPageSizeChange={handlePageSize}
                                pageSize={query.limit}
                                page={query.page}
                                rowCount={rowCount}
                                rowsPerPageOptions={[25, 50, 75]}
                                onSortModelChange={handleSortModelChange}
                                // onRowClick={handleRowClick}
                                density="compact"
                                onFilterModelChange={onFilterChange}
                            />
                            </div>
                            </Paper>
                    </Grid>
                    
                </Grid>
                
            </div>
            {showCreateDialog ? (
                            <ManageTermsAndCondition
                                termsAndCondition={termsAndCondition}
                                open={showCreateDialog}
                                handleClose={handleCloseCreateDialog}
                                fetchData={fetchTermsAndConditions}
                                editRecord={editRecord}
                            />
                        ) : null}

        </Layout>


        );
    
}

export default CreatePriceBuilder;