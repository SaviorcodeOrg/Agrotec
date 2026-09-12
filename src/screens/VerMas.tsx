import { useEffect } from "react";
import { useFetch } from "../hooks/useFetch";

export  function VerMas() {
 const {data,request,loading,error}=useFetch('https://agrotec.saviorcode.com')
    useEffect(()=>
    {
        request('/')
    },[request])
  return (
    <>
      <div>
        Precio jeje
        <h1>Ola</h1>
        <p>JEJEJEJJE</p>
      </div>
     <pre>{JSON.stringify(data)}</pre>
     {data &&<>
     <h1>{data}</h1></>}
    </>
  );
}
