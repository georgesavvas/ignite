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

import { AssetVersion, IgniteActions, IgniteComponent } from "@renderer/types/common";
import { useSnackbar } from "notistack";
import { useContext, useEffect, useState } from "react";

import FilterField from "../../components/FilterField";
import { ContextContext, ContextContextType } from "../../contexts/ContextContext";
import { CrateContext, CrateContextType } from "../../contexts/CrateContext";
import clientRequest from "../../services/clientRequest";
import { DeleteDir, RenameDir } from "../ContextActions";
import Component from "./Component";
import styles from "./ComponentList.module.css";

interface ComponentList {
  project: string;
  components: IgniteComponent[];
  onSelect: (compId: string) => void;
  selectedComp?: IgniteComponent;
  asset: AssetVersion;
}

const ComponentList = (props: ComponentList) => {
  const [actions, setActions] = useState<IgniteActions>();
  const [filterValue, setFilterValue] = useState("");
  const { addToCrate } = useContext(CrateContext) as CrateContextType;
  const { refresh } = useContext(ContextContext) as ContextContextType;
  const { enqueueSnackbar } = useSnackbar();
  const [modalData, setModalData] = useState({ renameOpen: false, deleteOpen: false });

  useEffect(() => {
    clientRequest("get_actions", { data: props.project }).then((resp) => {
      setActions(resp.data.component || {});
    });
  }, [props.components]);

  const handleContextMenuSelection = (action: string, _data: any) => {
    const data = { ..._data };
    data[`${action}Open`] = true;
    setModalData(data);
  };

  return (
    <div className={styles.container}>
      <DeleteDir
        open={modalData.deleteOpen}
        enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData((prevState) => ({ ...prevState, deleteOpen: false }))}
        data={modalData}
        fn={refresh}
      />
      <RenameDir
        open={modalData.renameOpen}
        enqueueSnackbar={enqueueSnackbar}
        onClose={() => setModalData((prevState) => ({ ...prevState, renameOpen: false }))}
        data={modalData}
        fn={refresh}
      />
      <FilterField filterValue={filterValue} setFilterValue={setFilterValue} />
      <div className={styles.compList}>
        {props.components.map((comp, index) => {
          console.log("This comp should have a path", comp);
          const filterString = `${comp.name}${comp.path}`;
          const hide = filterValue && !filterString.includes(filterValue);
          return (
            <Component
              key={index}
              entity={comp}
              addToCrate={addToCrate}
              onSelect={props.onSelect}
              selectedComp={props.selectedComp}
              actions={actions}
              style={hide ? { display: "none" } : {}}
              handleContextMenuSelection={handleContextMenuSelection}
              asset={props.asset}
            />
          );
        })}
      </div>
    </div>
  );
};

export default ComponentList;
