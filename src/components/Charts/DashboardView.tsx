import {useEffect, useState} from 'react';
import {Box,Button} from '@material-ui/core';
import ChartsRender from './Charts';
import ChartDialog from './AddNewChartDialog'

export default function DashboardView({edit,handleSave,Charts}){
    const [dragId, setDragId] = useState();
    const [charts,setCharts]=useState([]);
    const [addComponent,setAddComponent]=useState(false);
    const [Kpis,setKpis]=useState([]);

    useEffect(()=>{
        fetchDashboardData();
        fetchKPIs();
    },[])
    const fetchDashboardData=()=>{
        const orderedCharts=Charts.sort(function(a,b){
            return(a.order-b.order);
        })
        setCharts(Charts);
    }

    const fetchKPIs=()=>{
        //to fetch Available Kpis
        setKpis(["Standard KPI"]);

    }

    const handleDrag = (ev) => {
        setDragId(ev.currentTarget.id);
    };

    const handleAddComponent= (values)=>{
        let order=1
        let id=""
        if(charts.length===0){
            id=values.chartType+order.toString()
        }
        else{
            order=charts[charts.length-1].order+1
            id=values.chartType+order.toString()
        }
        const newChart={
            chartType:values.chartType,
            title:values.name,
            Kpi:values.kpi,
            order:order,
            id:id
        }
        var oldCharts=charts;
        oldCharts.push(newChart);
        setCharts(oldCharts);
        setAddComponent(false);
    }

    const handleDelete=(deleteId)=>{
        var newChart=[];
        for(var i=0;i<charts.length;i++){
            if(charts[i].id!==deleteId){
                newChart.push(charts[i]);
            }
        }
        setCharts(newChart);

    }

    const handleDrop = (ev) => { 
        const dragBox = charts.find((chart) => chart.id === dragId);
        const dropBox = charts.find((chart) => chart.id === ev.currentTarget.id);
    
        const dragBoxOrder = dragBox.order;
        const dropBoxOrder = dropBox.order;
    
        var newChartState = charts.map((chart) => {
          if (chart.id === dragId) {
            chart.order = dropBoxOrder;
          }
          if (chart.id === ev.currentTarget.id) {
            chart.order = dragBoxOrder;
          }
          return chart;
        });
        newChartState=newChartState.sort(function(a,b){
            return (a.order-b.order);
        });
        setCharts(newChartState);
      };

    return(
    <Box p={1}>
        {edit && 
        <Box>
            <Button variant="contained" size="small" color="primary" onClick={()=> handleSave(charts)}>Save</Button>
            <Button className="ml-2" variant="contained" size="small" color="primary" onClick={()=> setAddComponent(true)}>Add Component</Button>
        </Box>}
        <Box>
            <div style={{width:"100%",display:"flex",justifyContent:"space-between",flexWrap:"wrap"}}>
            {
                charts.map(chart=>
                <ChartsRender 
                    chartType={chart.chartType} 
                    kpi={chart.Kpi} 
                    title={chart.title} 
                    edit={edit}
                    handleDrag={handleDrag}
                    handleDrop={handleDrop}
                    handleDelete={handleDelete}
                    id={chart.id}/>)
            }
            </div>
        </Box>
            {
                addComponent&&
                <ChartDialog
                handleClose={()=>setAddComponent(false)}
                handleAddComponent={handleAddComponent}
                KPIs={Kpis}/>
            }
    </Box>
    );
}