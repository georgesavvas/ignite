async function serverRequest(method, data=undefined) {
  const address = await window.services.get_env("IGNITE_SERVER_ADDRESS");
  console.log("Server request:", address);
  if (!address) {
    console.log("Invalid server address, aborting...");
    return;
  }
  const resp = await fetch(`http://${address}/api/v1/${method}`, {
    method: !data ? "GET" : "POST",
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  return await resp.json()
}

export default serverRequest;
