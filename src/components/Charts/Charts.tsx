import {Bar,Doughnut,Pie,PolarArea,Line,Scatter} from 'react-chartjs-2'
import DeleteIcon from '@material-ui/icons/Delete';
import {Button} from '@material-ui/core'

export default function ChartsRender({chartType,kpi,title,edit,handleDrag,handleDrop,id,handleDelete}){
    const {data,options}=fetchKPIdata(chartType,kpi,title);
    if(chartType==="VerticalBar" || chartType==="HorizontalBar"){
        return(
            <div
                draggable={edit}
                id={id}
                onDragOver={(ev) => ev.preventDefault()}
                onDragStart={handleDrag}
                onDrop={handleDrop}
                style={{
                width: "30%",
                padding:"20px",
                border:"1px"
                }}
            >
            {edit&&
            <Button size="small" variant="contained" color="primary" onClick={()=>{handleDelete(id)}}>
              <DeleteIcon  fontSize="small"/>
            </Button>
            }
            <Bar data={data}  options={options} type="bar"/>
            </div>
        );
    }
    else if(chartType==="Doughnut"){
        return(
            <div
                draggable={edit}
                id={id}
                onDragOver={(ev) => ev.preventDefault()}
                onDragStart={handleDrag}
                onDrop={handleDrop}
                style={{
                width: "30%",
                padding:"20px",
                border:"1px"
                }}
            >
            {edit&&
            <Button size="small"  variant="contained" color="primary"onClick={()=>{handleDelete(id)}}>
              <DeleteIcon  fontSize="small"/>
            </Button>
            }
            <Doughnut data={data}  options={options} type="doughnut"/>
            </div>
        );
    }
    else if(chartType==="Pie"){
        return(
            <div
                draggable={edit}
                id={id}
                onDragOver={(ev) => ev.preventDefault()}
                onDragStart={handleDrag}
                onDrop={handleDrop}
                style={{
                width: "30%",
                padding:"20px",
                border:"1px"
                }}
            >
            {edit&&
            <Button size="small"  variant="contained" color="primary" onClick={()=>{handleDelete(id)}}>
              <DeleteIcon  fontSize="small"/>
            </Button>
            }
            <Pie data={data}  options={options} type="pie"/>
            </div>
        );
    }
    else if(chartType==="Polar"){
        return(
            <div
                draggable={edit}
                id={id}
                onDragOver={(ev) => ev.preventDefault()}
                onDragStart={handleDrag}
                onDrop={handleDrop}
                style={{
                width: "30%",
                padding:"20px",
                border:"1px"
                }}
            >
              {edit&&
            <Button size="small"  variant="contained" color="primary" onClick={()=>{handleDelete(id)}}>
              <DeleteIcon  fontSize="small"/>
            </Button>
            }
            
            <PolarArea data={data}  options={options} type="polar"/>
            </div>
        );
    }
    else if(chartType==="Line"){
        return(
            <div
                draggable={edit}
                id={id}
                onDragOver={(ev) => ev.preventDefault()}
                onDragStart={handleDrag}
                onDrop={handleDrop}
                style={{
                width: "30%",
                padding:"20px",
                border:"1px"
                }}
            >
              {edit&&
            <Button size="small"  variant="contained" color="primary" onClick={()=>{handleDelete(id)}}>
              <DeleteIcon  fontSize="small"/>
            </Button>
            }
            
            <Line data={data} options={options} type="polar"/>
            </div>
        );
    }
    else if(chartType==="Scatter"){
      return(
        <div
            draggable={edit}
            id={id}
            onDragOver={(ev) => ev.preventDefault()}
            onDragStart={handleDrag}
            onDrop={handleDrop}
            style={{
            width: "30%",
            padding:"20px",
            border:"1px"
            }}
        >
          {edit&&
        <Button size="small"  variant="contained" color="primary" onClick={()=>{handleDelete(id)}}>
          <DeleteIcon  fontSize="small"/>
        </Button>
        }
        
        <Scatter data={data} options={options} type="polar"/>
        </div>
    );
    }
};

const fetchKPIdata=(chartType,kpi,title)=>{
  //fetch KPI data as per kpi and convert in data formats
    var data={}
    if(chartType==="Scatter"){
      data = {
        datasets: [
          {
            data: [
              { x: 1, y: 2 },
              { x: 2, y: 3 },
              { x: 2, y: 4 },
              { x: 3, y: 2 },
              { x: 4, y: 2 },
              { x: 5, y: 6 },
              { x: 8, y: 7 }
            ],
            backgroundColor: 'rgba(255, 99, 132, 1)',
          },
        ],
      };

    }

    else{//Call to Kpi to fetch Data
    data = {
        labels: ['Red', 'Blue', 'Yellow', 'Green', 'Purple', 'Orange'],
        datasets: [
          {
            data: [12, 19, 3, 5, 2, 3],
            backgroundColor: [
              'rgba(255, 99, 132, 0.2)',
              'rgba(54, 162, 235, 0.2)',
              'rgba(255, 206, 86, 0.2)',
              'rgba(75, 192, 192, 0.2)',
              'rgba(153, 102, 255, 0.2)',
              'rgba(255, 159, 64, 0.2)',
            ],
            borderColor: [
              'rgba(255, 99, 132, 1)',
              'rgba(54, 162, 235, 1)',
              'rgba(255, 206, 86, 1)',
              'rgba(75, 192, 192, 1)',
              'rgba(153, 102, 255, 1)',
              'rgba(255, 159, 64, 1)',
            ],
            borderWidth: 1,
          },
        ],
      };
    }
      var options={}
    if(chartType==="HorizontalBar"){
        options = {
            indexAxis: 'y',
            elements: {
              bar: {
                borderWidth: 2,
              },
            },
            responsive: true,
            plugins: {
              legend: {
                display:false,
              },
              title: {
                position: "top",
                display: true,
                text: title,
              },
            },
          };
    }
    else{
        options = {
            plugins: {
              legend: {
                display:false,
              },
              title: {
                position: "top",
                display: true,
                text: title,
              },
            },
          };
    }
    return({data:data,options:options})      

};