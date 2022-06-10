async function clientRequest(method, data=undefined) {
  const resp = await fetch(`http://127.0.0.1:9091/api/v1/${method}`, {
    method: !data ? "GET" : "POST",
    headers: {
      'Accept': 'application/json, text/plain, */*',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  })
  return await resp.json()
}

export default clientRequest;
