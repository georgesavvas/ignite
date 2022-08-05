async function serverRequest(method, data=undefined) {
  const resp = await fetch(`http://raspberrypi:9070/api/v1/${method}`, {
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
