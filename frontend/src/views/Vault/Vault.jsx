import React, { useState, useEffect } from "react";
import Modal from "../../components/Modal";
import {
  ReflexContainer,
  ReflexSplitter,
  ReflexElement
} from 'react-reflex';
import saveReflexLayout from "../../utils/saveReflexLayout";
import loadReflexLayout from "../../utils/loadReflexLayout";
import Browser from "./Browser";
import Details from "./Details";

const splitterStyle = {
  borderColor: "rgb(40,40,40)",
  backgroundColor: "rgb(40,40,40)"
}

const defaultFlexRations = {
  "home.details": 0.3,
  "home.browser": 0.7
}

function Vault(props) {
  const [flexRatios, setFlexRatios] = useState(defaultFlexRations);

  useEffect(() => {
    const data = loadReflexLayout()
    if (!data) {
      setFlexRatios(defaultFlexRations)
      return
    }
    const browser = data["home.browser"]
    const details = data["home.details"]
    if (!browser || !details) {
      setFlexRatios(defaultFlexRations)
      return
    }
    const fullWidth = browser[0] + details[0]
    const ratios = {
      "home.browser": browser[0] / fullWidth,
      "home.details": details[0] / fullWidth
    }
    setFlexRatios(ratios)
  }, [])

  const handleResized = data => {
    saveReflexLayout(data)
  }

  return (
    <Modal open={props.open} onClose={props.onClose} title="Vault" fullWidth
      fullHeight
    >
      <ReflexContainer orientation="vertical">
        <ReflexElement
          flex={flexRatios["home.browser"]}
          name="home.browser"
          onStopResize={handleResized}
        >
          <Browser />
        </ReflexElement>
        <ReflexSplitter style={splitterStyle} />
        <ReflexElement
          flex={flexRatios["home.details"]}
          name="home.details"
          onStopResize={handleResized}
        >
          <Details />
        </ReflexElement>
      </ReflexContainer>
    </Modal>
  )
}

export default Vault;
