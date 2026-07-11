window.CoreStorage={
  get(key,def=[]){try{return JSON.parse(localStorage.getItem("am_"+key))??def}catch{return def}},
  set(key,val){localStorage.setItem("am_"+key,JSON.stringify(val))},
  rawGet(key,def=""){return localStorage.getItem("am_"+key)??def},
  rawSet(key,val){localStorage.setItem("am_"+key,val)},
  remove(key){localStorage.removeItem("am_"+key)}
};
