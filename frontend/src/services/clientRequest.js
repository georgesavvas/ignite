async function clientRequest(method, data=undefined) {
  const address = await window.services.get_env("IGNITE_CLIENT_ADDRESS");
  console.log("Client request:", address, method, data);
  if (!address) {
    console.log("Invalid client address, aborting...");
    return;
  }
  try {
    const resp = await fetch(`http://${address}/api/v1/${method}`, {
      method: !data ? "GET" : "POST",
      headers: {
        "Accept": "application/json, text/plain, */*",
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
    const resp2 = await resp.json();
    console.log("Client response:", method, resp2);
    return resp2;
  } catch (error) {
    console.log(error);
    return {ok: false, msg: "Could not connect to Ignite client..."};
  }
}

export default clientRequest;
