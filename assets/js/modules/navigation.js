window.Navigation={
  modules:[
    ["home","🏠 Ana Özet","AL Mether Field Finance kontrol merkezi"],
    ["finance","💰 Finans","Bakiye, tahsilat, ödeme, bekleyenler ve CFO özetleri"],
    ["income","🟢 Gelir","Hakediş ve gelir kayıtları"],
    ["expense","🔴 Gider + Fatura","Gider, fatura ve belge kayıtları"],
    ["people","👷 Personel / Demirbaş","Personel maliyeti ve demirbaş takibi"],
    ["docs","📁 Belgeler","Fatura, PDF ve belge kasası"],
    ["workshop","🛠️ Workshop","Saha iş emirleri ve operasyon takibi"],
    ["reports","📊 Raporlar","Finans ve operasyon raporları"],
    ["settings","⚙️ Ayarlar","Kullanıcı, şirket ve entegrasyon ayarları"]
  ],
  render(){
    sideNav.innerHTML=this.modules.map((m,i)=>`<button class="${i===0?"active":""}" onclick="App.go('${m[0]}',this)">${m[1]}</button>`).join("");
    mobileNav.innerHTML=this.modules.slice(0,5).map((m,i)=>`<button class="${i===0?"active":""}" onclick="App.go('${m[0]}',this)">${m[1].replace(/^[^ ]+ /,"")}</button>`).join("");
  },
  meta(id){return this.modules.find(x=>x[0]===id)}
};
