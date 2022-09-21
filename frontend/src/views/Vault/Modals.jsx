import React, { useEffect, useState } from 'react'
import Modal from "../../components/Modal"
import serverRequest from "../../services/serverRequest"
import TextField from '@mui/material/TextField'
import FilterBuilder from './FilterBuilder'

export function EditColl({data, open=false, onClose, enqueueSnackbar, fn}) {
  const [filterData, setFilterData] = useState({})

  useEffect(() => {
    if (data.expression) setFilterData({...data["expression"]})
    else setFilterData({})
  }, [data.path])

  function handleConfirm() {
    serverRequest("edit_collection", {data: {...data, expression: filterData.expression}}).then(resp => {
      if (resp.ok) enqueueSnackbar("Success!", {variant: "success"})
      else {
        let reason = ""
        if (resp.text) reason = ` - ${resp.text}`
        enqueueSnackbar("Couldn't edit collection.", {variant: "error"})
      }
    })
    if (fn) fn()
    onClose()
  }

  const defaultExpr = '{ "condition": "and", "filters": [{ "": "" }, { "": "" }]}'

  return (
    <Modal open={open} buttonLabel="Confirm" onButtonClicked={handleConfirm}
      maxWidth="xl" closeButton onClose={onClose} title={`Editing ${data.name}`}
    >
      <FilterBuilder
        default={JSON.stringify(data.expression) || defaultExpr}
        onChange={value => setFilterData({expression: value})}
      />
    </Modal>
  )
}

export function RenameColl({data, open=false, onClose, enqueueSnackbar, fn}) {
  const [nameValue, setNameValue] = useState("")

  useEffect(() => {
    setNameValue(data.name)
  }, [data.name])

  function handleConfirm() {
    serverRequest("rename_collection", {data: {...data, name: nameValue}}).then(resp => {
      if (resp.ok) enqueueSnackbar("Renamed!", {variant: "success"})
      else {
        let reason = ""
        if (resp.text) reason = ` - ${resp.text}`
        enqueueSnackbar("Couldn't rename collection.", {variant: "error"})
      }
    })
    if (fn) fn()
    onClose()
  }

  return (
    <Modal open={open} buttonLabel="Confirm" onButtonClicked={handleConfirm}
      maxWidth="sm" closeButton onClose={onClose} title={`Renaming ${data.name}`}
    >
      <TextField
        id="name"
        label="Name"
        variant="outlined"
        value={nameValue}
        onChange={e => setNameValue(e.target.value)}
        size="small"
        fullWidth
        autoFocus
        style={{marginTop: "10px"}}
      />
    </Modal>
  )
}
  
export function DeleteColl({data, open=false, onClose, enqueueSnackbar, fn}) {
  const handleConfirm = () => {
    serverRequest("delete_collection", {data: data}).then(resp => {
      if (resp.ok) enqueueSnackbar("Successfully deleted!", {variant: "success"})
      else enqueueSnackbar("There was an issue with deleting this.", {variant: "error"}
      )
    })
    if (fn) fn()
    onClose()
  }

  return (
    <Modal open={open} buttonLabel="Confirm" onButtonClicked={handleConfirm}
      maxWidth="sm" closeButton onClose={onClose}
      text={`This will permanently delete the ${data.name} collection!`}
      title="Are you sure?"
    />
  )
}

export function CreateColl({data, open=false, onClose, enqueueSnackbar, fn}) {
  const [nameValue, setNameValue] = useState("")

  useEffect(() => {
    setNameValue("")
  }, [data.name])

  const handleConfirm = data => {
    data.name = nameValue
    serverRequest("create_collection", {data: data}).then((resp => {
      enqueueSnackbar(resp.text, {variant: resp.ok ? "success" : "error"})
      onClose()
      if (fn) fn()
    }))
  }

  return (
    <Modal open={open} buttonLabel="Create" onButtonClicked={e => handleConfirm(data)}
      maxWidth="sm" closeButton onClose={onClose}
      title="Create"
    >
      <TextField
        id="name"
        label="Name"
        variant="outlined"
        value={nameValue}
        onChange={e => setNameValue(e.target.value)}
        size="small"
        fullWidth
        autoFocus
        style={{marginTop: "10px"}}
      />
    </Modal>
  )
}
