import React, { useState, Fragment } from 'react';
import { generateUniqueId } from '../../constants/helpers';
import OrgChart from './OrgChart';
// import chartService from '../services/ChartService';
// import shortid from 'shortid';
// import Modal from './Modal';
// import { ToastContainer, toast } from 'react-toastify';
// import 'react-toastify/dist/ReactToastify.css';


import './OrgChartContainer.scss';

export default function OrgChartContainer({ data, onClick }) {

    const chartId = `chart-${generateUniqueId()}`;
    const google = window.google;
    google.charts.load('current', { packages: ["orgchart"] });

    const [positions, setPositions] = useState([]);
    const [showModal, setShowModal] = useState(false);
    // const [node, setNode] = useState({
    //     id: '',
    //     title: '',
    //     name: '',
    //     parentId: 0
    // });

    // const fetchNodes = async () => {
    //     const result = await chartService.get('/charts');
    //     if (result.data) {
    //         return result.data
    //     }
    //     return []
    // }

    // const save = async () => {
    //     const { data } = await chartService.post('/charts', positions);
    //     notify('Your chart has been saved successfully');
    // }

    const getOrgChart = async () => {
        // const defaultPositions = await fetchNodes();
        setPositions([...data]);
    };

    const update = (id, parentId) => {
        const updatedPositions = [...positions];
        const index = updatedPositions.findIndex((position) => position.id === id);
        const position = updatedPositions[index];
        updatedPositions.splice(index, 1, {
            id: position.id,
            title: position.title,
            name: position.name,
            parentId,
        });
        setPositions([...updatedPositions]);
    };

    // const addNode = () => {
    //     let updatedNode;
    //     if (node.id) {
    //         const updatedPositions = [...positions];
    //         const index = updatedPositions.findIndex((position) => position.id === node.id);
    //         updatedPositions[index] = { ...node };
    //         setPositions([...updatedPositions]);
    //         // notify('Node has been edited');
    //     } else {
    //         updatedNode = {
    //             ...node,
    //             id: shortid.generate(),
    //         }
    //         setPositions([...positions, updatedNode])
    //         // notify('A new node has been added');
    //     }
    //     toggleModal();
    // }



    const toggleModal = () => {
        setShowModal(!showModal);
    };

    // const handleSubmit = (event) => {
    //     event.preventDefault();
    //     if (!node.name) {
    //         return toast.error('Please enter name');
    //     }
    //     if (!node.title) {
    //         return toast.error('Please enter title');
    //     }

    //     addNode();
    // }

    // const edit = (id) => {
    //     const selectedNode = positions.find(node => node.id === id);
    //     setNode(selectedNode);
    //     toggleModal();
    // }

    const onClickNode = (id) => {
        onClick(id);
        // const selectedNode = positions.find(node => node.id === id);
        // setNode(selectedNode);
        // toggleModal();
    }

    // const openAddModal = () => {
    //     setNode({
    //         id: '',
    //         title: '',
    //         name: '',
    //         parentId: 0
    //     })
    //     toggleModal();
    // }

    // const notify = (message) => toast.success(message);

    // const getManagerList = () => {
    //     return positions.filter(p => p.id !== node.id).map(position => {
    //         return (<option value={position.id}>{position.name}</option>)
    //     })
    // }

    return (
        <Fragment>
            <div className="custom-orgchart">
                <OrgChart
                    positions={positions}
                    getOrgChart={getOrgChart}
                    chartId={chartId}
                    // update={update}
                    onClickNode={onClickNode}
                    google={google}
                />
            </div>

            {/* <ToastContainer position="bottom-right" /> */}
            {/* <div className="ui menu">
                <div className="item">
                    <div onClick={openAddModal} className="ui primary button">Add node</div>
                </div>
                <div className="right menu">
                    <div className="item">
                        <button disabled={positions.length === 0} onClick={save} className="ui button positive ">Save chart</button>
                    </div>
                </div>
            </div> */}
            {/* {positions.length === 0 ? (<div className="no-chart-text"><p>+ Add node to start creating an organizational chart</p></div>) : null}
            {
                showModal ? (
                    <Modal>
                        <div className="modal-wrapper">
                            <div className="my-modal">
                                <form className="ui form edit-form" onSubmit={handleSubmit}>
                                    <div className="form-fields">
                                        <h4 className="ui dividing header">Add/Edit</h4>
                                        <div className="field">
                                            <label>Name</label>
                                            <input type="text" value={node.name} onChange={(e) => setNode({ ...node, name: e.target.value })} name="name" placeholder="Name" />
                                        </div>
                                        <div className="field">
                                            <label>Title</label>
                                            <input type="text" value={node.title} onChange={(e) => setNode({ ...node, title: e.target.value })} name="title" placeholder="Title" />
                                        </div>
                                        <div className="field">
                                            <label>Manager</label>
                                            <select value={node.parentId} onChange={(e) => setNode({ ...node, parentId: e.target.value })} className="ui fluid dropdown">
                                                <option value="0">NA</option>
                                                {getManagerList()}
                                            </select>
                                        </div>
                                    </div>
                                    <button className="ui primary button" type="submit">Submit</button>
                                </form>
                                <i onClick={toggleModal} className="close icon modal-close"></i>
                            </div>
                        </div>
                    </Modal>
                ) : null
            } */}

        </Fragment>
    );
};
