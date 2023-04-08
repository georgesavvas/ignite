// Copyright 2023 Georgios Savvas

// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at

//     https://www.apache.org/licenses/LICENSE-2.0

// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.


import React, {useState, useEffect, useContext} from "react";

import styles from "./ComponentList.module.css";
import clientRequest from "../../services/clientRequest";
import FilterField from "../../components/FilterField";
import {CrateContext} from "../../contexts/CrateContext";
import Component from "./Component";
import {ContextContext} from "../../contexts/ContextContext";
import {useSnackbar} from "notistack";
import {DeleteDir, RenameDir} from "../ContextActions";


function ComponentList(props) {
  const [actions, setActions] = useState({});
  const [filterValue, setFilterValue] = useState("");
  const {addToCrate} = useContext(CrateContext);
  const [,, refreshContext] = useContext(ContextContext);
  const {enqueueSnackbar} = useSnackbar();
  const [modalData, setModalData] = useState({});

  useEffect(() => {
    clientRequest("get_actions", {data: props.project}).then(resp => {
      setActions(resp.data.component || {});
    });
  }, [props.components]);

  const handleContextMenuSelection = (action, _data) => {
    const data = {..._data};
    data[`${action}Open`] = true;
    setModalData(data);
  };

  return (
    <div className={styles.container}>
      <DeleteDir open={modalData.deleteOpen} enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData(prevState => ({...prevState, deleteOpen: false}))}
        data={modalData} fn={refreshContext}
      />
      <RenameDir open={modalData.renameOpen} enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData(prevState => ({...prevState, renameOpen: false}))}
        data={modalData} fn={refreshContext}
      />
      <FilterField filterValue={filterValue} setFilterValue={setFilterValue} />
      <div className={styles.compList}>
        {props.components.map((comp, index) => {
          const filterString = `${comp.name}${comp.file}`;
          const hide = filterValue && !filterString.includes(filterValue);
          return <Component key={index} entity={comp} addToCrate={addToCrate}
            onSelect={props.onSelect} selectedComp={props.selectedComp}
            actions={actions} style={hide ? {display: "none"} : null}
            handleContextMenuSelection={handleContextMenuSelection}
            asset={props.asset}
          />;
        })}
      </div>
    </div>
  );
}

export default ComponentList;
