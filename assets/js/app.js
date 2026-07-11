const App=(()=>{
  const $=id=>document.getElementById(id);
  const TL=n=>(Number(n)||0).toLocaleString("tr-TR",{style:"currency",currency:"TRY"});
  const uid=()=>crypto.randomUUID?crypto.randomUUID():String(Date.now()+Math.random());
  const users=[{name:"Deniz Bey",mail:"denizhidir35@gmail.com",pass:"1234",role:"CEO"},{name:"Aytaç Bey",mail:"aytacturkbay@gmail.com",pass:"1234",role:"Partner"}];

  let state={
    incomes:CoreStorage.get("incomes"),
    expenses:CoreStorage.get("expenses"),
    people:CoreStorage.get("people"),
    assets:CoreStorage.get("assets")
  };

  function persist(){Object.keys(state).forEach(k=>CoreStorage.set(k,state[k]))}
  function v(id){return $(id).value}
  function n(id){return Number(v(id))||0}
  function today(){return new Date().toISOString().slice(0,10)}
  function card(t,v,c="",extra=""){return `<div class="glass kpi ${extra}"><b>${t}</b><div class="${c}">${v}</div></div>`}
  function item(date,title,desc,amount,cls,extra){return `<div class="item"><span class="pill">${date||"-"}</span><div><b>${title}</b><div class="small">${desc||""}</div></div><b class="${cls}">${amount}</b><div>${extra||""}</div></div>`}

  const auth={
    login(){
      const mail=v("loginMail").trim().toLowerCase(),pass=v("loginPass").trim();
      const u=users.find(x=>x.mail===mail&&x.pass===pass);
      if(!u)return alert("Mail veya şifre hatalı");
      CoreStorage.set("session",u);
      login.style.display="none";app.style.display="block";initApp();
    },
    logout(){CoreStorage.remove("session");app.style.display="none";login.style.display="grid"}
  };

  function go(id,el){
    document.querySelectorAll(".screen").forEach(x=>x.classList.remove("active"));
    $(id).classList.add("active");
    document.querySelectorAll(".nav button,.mobileTab button").forEach(x=>x.classList.remove("active"));
    if(el)el.classList.add("active");
    const m=Navigation.meta(id);
    title.textContent=m[1].replace(/^[^ ]+ /,"");
    sub.textContent=m[2];
    render();
  }

  async function fileData(file){
    if(!file)return null;
    return await new Promise(r=>{let fr=new FileReader();fr.onload=()=>r({id:uid(),name:file.name,type:file.type,data:fr.result,createdAt:new Date().toISOString()});fr.readAsDataURL(file)})
  }

  async function addExpense(){
    let f=await fileData(eFile.files[0]);
    state.expenses.unshift({id:uid(),date:v("eDate"),cat:v("eCat"),desc:v("eDesc"),amount:n("eAmount"),status:v("eStatus"),file:f,createdAt:new Date().toISOString()});
    persist();eDesc.value=eAmount.value="";eFile.value="";go("home");
  }

  function addIncome(){
    let ara=n("iQty")*n("iPrice"),total=ara+(ara*n("iVat")/100);
    state.incomes.unshift({id:uid(),date:v("iDate"),type:v("iType"),desc:v("iDesc"),qty:n("iQty"),price:n("iPrice"),vat:n("iVat"),total,status:v("iStatus"),createdAt:new Date().toISOString()});
    persist();iDesc.value=iQty.value=iPrice.value="";go("home");
  }

  function addPerson(){state.people.unshift({id:uid(),name:v("pName"),role:v("pRole"),cost:n("pCost"),createdAt:new Date().toISOString()});persist();pName.value=pRole.value=pCost.value="";go("home")}
  function addAsset(){state.assets.unshift({id:uid(),name:v("aName"),price:n("aPrice"),who:v("aWho"),createdAt:new Date().toISOString()});persist();aName.value=aPrice.value=aWho.value="";go("home")}
  function del(t,id){const map={income:"incomes",expense:"expenses",person:"people",asset:"assets"};state[map[t]]=state[map[t]].filter(x=>x.id!==id);persist();render()}
  function doc(id){let x=state.expenses.find(e=>e.id===id),f=x?.file;if(!f)return;let w=open("");if(f.type.includes("pdf"))w.document.write(`<iframe src="${f.data}" style="width:100%;height:100vh;border:0"></iframe>`);else w.document.write(`<img src="${f.data}" style="max-width:100%">`)}

  function render(){
    const c=FinanceEngine.calculate(state);
    homeSummary.innerHTML=card("Ana Bakiye",TL(c.net),c.net>=0?"good":"bad","balanceCard")+card("Gelir Özeti",TL(c.incOk+c.incWait),"good")+card("Gider Özeti",TL(c.expOk+c.expWait+c.p+c.as),"bad")+card("Bekleyenler",TL(c.incWait-c.expWait),(c.incWait-c.expWait)>=0?"warn":"bad");

    moduleSummary.innerHTML=`<div class="glass moduleCard"><b>💰 Finans</b><span>Ana para merkezi</span><button onclick="App.go('finance')">Aç</button></div><div class="glass moduleCard"><b>🟢 Gelir</b><span>${state.incomes.length} kayıt</span><button onclick="App.go('income')">Aç</button></div><div class="glass moduleCard"><b>🔴 Gider</b><span>${state.expenses.length} kayıt</span><button onclick="App.go('expense')">Aç</button></div><div class="glass moduleCard"><b>📁 Belgeler</b><span>${state.expenses.filter(x=>x.file).length} belge</span><button onclick="App.go('docs')">Aç</button></div>`;

    financeCards.innerHTML=card("Ana Bakiye",TL(c.net),c.net>=0?"good":"bad","balanceCard")+card("Başlangıç",TL(c.s))+card("Tahsil Edilen",TL(c.incOk),"good")+card("Bekleyen Tahsilat",TL(c.incWait),"warn")+card("Ödenen Gider",TL(c.expOk),"bad")+card("Bekleyen Ödeme",TL(c.expWait),"warn")+card("Personel",TL(c.p),"bad")+card("Tahmini Kâr/Zarar",TL(c.profit),c.profit>=0?"good":"bad");

    financeModules.innerHTML=`<div class="glass moduleCard"><b>Gelir Yönetimi</b><span>Hakediş ve tahsilat</span><button onclick="App.go('income')">Gelir Aç</button></div><div class="glass moduleCard"><b>Gider Yönetimi</b><span>Fatura ve ödeme</span><button onclick="App.go('expense')">Gider Aç</button></div><div class="glass moduleCard"><b>Personel Maliyeti</b><span>Aylık yük</span><button onclick="App.go('people')">Personel Aç</button></div><div class="glass moduleCard"><b>Raporlama</b><span>CFO raporu</span><button onclick="App.go('reports')">Rapor Aç</button></div>`;

    const all=[...state.incomes.map(x=>({date:x.date,title:"+ "+x.type,desc:x.desc+" • "+x.status,amount:x.total,cls:"good",extra:`<button class="danger" onclick="App.del('income','${x.id}')">Sil</button>`})),...state.expenses.map(x=>({date:x.date,title:"- "+x.cat,desc:x.desc+" • "+x.status,amount:x.amount,cls:"bad",extra:`${x.file?`<button class="doc" onclick="App.doc('${x.id}')">Belge/PDF</button>`:""} <button class="danger" onclick="App.del('expense','${x.id}')">Sil</button>`}))].sort((a,b)=>(b.date||"").localeCompare(a.date||""));

    homeMoves.innerHTML=all.slice(0,8).map(x=>item(x.date,x.title,x.desc,TL(x.amount),x.cls,x.extra)).join("")||"<p class='small'>Henüz kayıt yok.</p>";
    incomeList.innerHTML=state.incomes.map(x=>item(x.date,x.type,x.desc+" • "+x.status,TL(x.total),"good",`<button class="danger" onclick="App.del('income','${x.id}')">Sil</button>`)).join("")||"<p class='small'>Gelir kaydı yok.</p>";
    expenseList.innerHTML=state.expenses.map(x=>item(x.date,x.cat,x.desc+" • "+x.status,TL(x.amount),"bad",`${x.file?`<button class="doc" onclick="App.doc('${x.id}')">Belge/PDF</button>`:""} <button class="danger" onclick="App.del('expense','${x.id}')">Sil</button>`)).join("")||"<p class='small'>Gider kaydı yok.</p>";
    peopleList.innerHTML=[...state.people.map(x=>item("Personel",x.name,x.role,TL(x.cost),"bad",`<button class="danger" onclick="App.del('person','${x.id}')">Sil</button>`)),...state.assets.map(x=>item("Demirbaş",x.name,x.who,TL(x.price),"bad",`<button class="danger" onclick="App.del('asset','${x.id}')">Sil</button>`))].join("")||"<p class='small'>Kayıt yok.</p>";
    docsList.innerHTML=state.expenses.filter(x=>x.file).map(x=>item(x.date,x.file.name,x.desc,TL(x.amount),"warn",`<button class="doc" onclick="App.doc('${x.id}')">Aç/PDF</button>`)).join("")||"<p class='small'>Henüz belge yok.</p>";
    reportCards.innerHTML=card("Toplam Gelir",TL(c.incOk+c.incWait),"good")+card("Toplam Gider",TL(c.expOk+c.expWait+c.p+c.as),"bad")+card("Net",TL(c.net),c.net>=0?"good":"bad")+card("Tahmini Kâr",TL(c.profit),c.profit>=0?"good":"bad");
  }

  function saveStart(){CoreStorage.rawSet("start",v("start")||0);render()}
  function backup(){let a=document.createElement("a");a.href=URL.createObjectURL(new Blob([JSON.stringify({version:"1.2",start:CoreStorage.rawGet("start",0),...state,backupDate:new Date().toISOString()},null,2)],{type:"application/json"}));a.download="al-mether-field-finance-yedek-v1-2.json";a.click()}
  function initApp(){if(start)start.value=CoreStorage.rawGet("start","");["iDate","eDate"].forEach(id=>$(id).value=today());render()}
  function init(){Navigation.render();let u=CoreStorage.get("session",null);if(!u){login.style.display="grid";app.style.display="none";return}login.style.display="none";app.style.display="block";initApp()}

  return{init,auth,go,addIncome,addExpense,addPerson,addAsset,del,doc,saveStart,backup};
})();
App.init();
