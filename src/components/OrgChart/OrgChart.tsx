import React, { useEffect, useState } from 'react';
import { Link } from "react-router-dom";

const OrgChart = ({
    positions,
    getOrgChart,
    chartId,
    // update,
    // edit,
    onClickNode,
    google,
}) => {

    let draggedNode = null;
    let chart = null;

    const [orgChart, setOrgChart] = useState(positions || []);

    useEffect(() => {
        getOrgChart()
    }, []);

    useEffect(() => {
        google.charts.setOnLoadCallback(drawChart);
    });

    useEffect(() => {
        setOrgChart(positions);
    }, [positions])

    const getIds = element => {
        if (element) {
            const id = element.querySelector("hidden[data-id]");
            const parentId = element.querySelector("hidden[data-parent-id]");
            if (id && parentId) {
                return {
                    id: id.getAttribute("data-id"),
                    parentId: parentId.getAttribute("data-parent-id"),
                };
            }
        }
    };

    const dragLeave = event => {
        const element = event.target;
        setTimeout(() => {
            element.classList.remove("do-not-drop");
            element.classList.remove("do-drop");
        }, 250);
    };

    const dragStart = event => {
        const element = event.target;
        const currentNode = getIds(element);
        if (currentNode) {
            draggedNode = currentNode;
        }
    };

    const drop = event => {

        let element = event.target;
        if (element.tagName !== "TD") {
            while (element.parentElement) {
                element = element.parentElement;
                if (element.tagName === "TD") {
                    break;
                }
            }
        }
        const dropNode = getIds(element);
        if (dropNode && draggedNode) {
            if (
                draggedNode.id !== dropNode.id &&
                draggedNode.id !== dropNode.parentId
            ) {
                // update(
                //     draggedNode.id,
                //     dropNode.id,
                // );
            }
        }
    };

    const dragEnter = event => {
        event.preventDefault();
        const element = event.target;
        if (element.tagName === "TD") {
            const dropNode = getIds(element);
            if (dropNode && draggedNode) {
                if (
                    draggedNode.id === dropNode.id ||
                    draggedNode.id === dropNode.parentId
                ) {
                    element.classList.add("do-not-drop");
                } else {
                    element.classList.add("do-drop");
                }
            }
        }
    };

    // const editNode = event => {
    //     let element = event.target.parentElement;
    //     const node = getIds(element);
    //     edit(node.id);
    // }

    const onClick = event => {
        let element = event.target;
        if (element.tagName !== "TD") {
            while (element.parentElement) {
                element = element.parentElement;
                if (element.tagName === "TD") {
                    break;
                }
            }
        }
        const currentNode = getIds(element);
        onClickNode(currentNode.id);
    }

    const drawChart = () => {
        const template = p =>
            `
            <hidden data-id='${p.id}' />
            <hidden data-parent-id='${p.parentId}' />
            ${p.logo ? `<img src=${p.logo} width="50px" /> <br />` : ""}
            <h5>${p.name}</h5>
            ${p.email ? `<h5>${p.email}</h5>` : ""}
            ${p.phone ? `<h5>${p.phone}</h5>` : ""}
            <h5 class="title">
              ${p.current ? "(Current)" : ""} 
            </h5>
          `;
        const orgChartDiv = document.getElementById(chartId);
        if (orgChartDiv) {
            chart = new google.visualization.OrgChart(orgChartDiv);

            google.visualization.events.addOneTimeListener(
                chart,
                "ready",
                () => {
                    const nodes = window.document.getElementsByClassName(
                        "google-visualization-orgchart-node",
                    );
                    Array.from(nodes).forEach(node => {
                        // const iconElement = document.createElement('i');
                        // iconElement.className = 'edit outline icon node-icon';
                        // iconElement.addEventListener('click', onClick)
                        // node.appendChild(iconElement);
                        node.classList.add("link");
                        node.addEventListener('click', onClick)
                        // node.setAttribute("draggable", "true");
                        // node.addEventListener("dragstart", dragStart);
                        // node.addEventListener("dragenter", dragEnter);
                        // node.addEventListener("dragover", dragEnter);
                        // node.addEventListener("dragexit", () => (draggedNode = null));
                        // node.addEventListener("dragleave", dragLeave);
                        // node.addEventListener("drop", drop);
                    });
                },
            );

            const data = new google.visualization.DataTable();

            data.addColumn("string", "Name");
            data.addColumn("string", "Manager");
            data.addColumn("string", "ToolTip");

            let orgPositions = orgChart.map(p => [
                { v: `${p.id}`, f: template(p) },
                !p.parentId || p.parentId === "0" ? null : `${p.parentId}`,
                p.title,
            ]);
            data.addRows(orgPositions);

            chart.draw(data, {
                size: "large",
                allowHtml: true,
                nodeClass: "google-visualization-orgchart-node",
            });
        }
    };

    return (
        <div id={chartId} className="org-chart" />
    );
};

export default OrgChart