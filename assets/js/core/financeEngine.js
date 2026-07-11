window.FinanceEngine={
  calculate(state){
    const s=Number(CoreStorage.rawGet("start",0))||0;
    const incOk=state.incomes.filter(x=>x.status==="Tahsil edildi").reduce((a,x)=>a+x.total,0);
    const incWait=state.incomes.filter(x=>x.status==="Bekliyor").reduce((a,x)=>a+x.total,0);
    const expOk=state.expenses.filter(x=>x.status==="Ödendi").reduce((a,x)=>a+x.amount,0);
    const expWait=state.expenses.filter(x=>x.status==="Bekliyor").reduce((a,x)=>a+x.amount,0);
    const p=state.people.reduce((a,x)=>a+x.cost,0);
    const as=state.assets.reduce((a,x)=>a+x.price,0);
    const net=s+incOk-expOk-p-as;
    const profit=s+incOk+incWait-expOk-expWait-p-as;
    return{s,incOk,incWait,expOk,expWait,p,as,net,profit};
  }
};
