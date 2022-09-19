import React, { useState } from "react";
import Modal from "../../components/Modal";

function Vault(props) {
  return (
    <Modal open={props.open} onClose={props.onClose} title="Vault" maxWidth="lg">
    </Modal>
  )
}

export default Vault;
