const f = async () => {
  try {

     await Promise.reject({ab: "hello world"});
 
  } catch(e) {
    console.log(e)
  }
  return await Promise.resolve({ab: "hello world"});
}

f()
// .then(v => console.log(v))