class web{

    async post(address, body) {
    const response = await fetch(address, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify(body)
    });

    console.log("STATUS:", response.status);
    console.log("CONTENT-TYPE:", response.headers.get("content-type"));

    const data = await response.text();

    console.log(data);
    return data;
}
    async get(adress,body){
        const response = await fetch(adress);

        const data = await response.text();

        console.log(data);
        return data
    }
    async put(address, body) {
        const response = await fetch(address, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(body)
        });

        console.log("STATUS:", response.status);
        console.log("CONTENT-TYPE:", response.headers.get("content-type"));

        const data = await response.text();

        console.log(data);
        return data;
    }
    async delete(address) {
        const response = await fetch(address, {
            method: "DELETE"
        });

        console.log("STATUS:", response.status);

        const data = await response.text();

        console.log(data);
        return data;
    }
}
export default new web;