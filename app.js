(function(){
  const page = document.body.getAttribute("data-page") || "";

  // active nav
  document.querySelectorAll("[data-nav]").forEach(a=>{
    if(a.getAttribute("data-nav") === page) a.classList.add("active");
  });

  // simple dropdown helpers (native <select> already works; this adds small UX)
  document.querySelectorAll("select.select").forEach(sel=>{
    sel.addEventListener("change", ()=>{
      sel.classList.add("hasValue");
    });
  });

  // Switch toggles
  document.querySelectorAll("[data-switch]").forEach(sw=>{
    sw.addEventListener("click", ()=>{
      sw.classList.toggle("on");
      const target = sw.getAttribute("data-target");
      if(target){
        const el = document.querySelector(target);
        if(el){
          const on = sw.classList.contains("on");
          el.textContent = on ? "ON" : "OFF";
        }
      }
    });
  });

  // Modal
  function openModal(id){
    const m = document.getElementById(id);
    if(!m) return;
    m.classList.add("show");
  }
  function closeModal(el){
    const m = el.closest(".modal");
    if(m) m.classList.remove("show");
  }
  document.querySelectorAll("[data-open-modal]").forEach(btn=>{
    btn.addEventListener("click", ()=> openModal(btn.getAttribute("data-open-modal")));
  });
  document.querySelectorAll("[data-close-modal]").forEach(btn=>{
    btn.addEventListener("click", ()=> closeModal(btn));
  });
  document.querySelectorAll(".modal").forEach(m=>{
    m.addEventListener("click", (e)=>{ if(e.target === m) m.classList.remove("show"); });
  });

  // Fake "Start" & live metrics demo (wireframe only)
  const startBtn = document.getElementById("startBtn");
  if(startBtn){
    let t=0, timer=null;
    const elMoist = document.getElementById("liveMoist");
    const elWeight = document.getElementById("liveWeight");
    startBtn.addEventListener("click", ()=>{
      if(timer){ clearInterval(timer); timer=null; startBtn.textContent="START"; return; }
      startBtn.textContent="STOP";
      timer = setInterval(()=>{
        t++;
        const m = (11 + (Math.sin(t/7)+1)*2.2).toFixed(1);
        const w = (10 + (Math.sin(t/9)+1)*5).toFixed(1);
        if(elMoist) elMoist.textContent = m + " %";
        if(elWeight) elWeight.textContent = w + " gms";
        const clock = document.getElementById("runClock");
        if(clock){
          const s=t%60, mm=Math.floor(t/60)%60, hh=Math.floor(t/3600);
          clock.textContent = String(hh).padStart(2,"0")+":"+String(mm).padStart(2,"0")+":"+String(s).padStart(2,"0");
        }
      }, 900);
    });
  }

  
  // Add Class row (settings)
  const addClassBtn = document.getElementById("addClassRow");
  if(addClassBtn){
    addClassBtn.addEventListener("click", ()=>{
      const tbody = document.querySelector("#classTable tbody");
      if(!tbody) return;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><input class="input" placeholder="Class name (e.g., Dubar)" /></td>
        <td><input class="input" placeholder="length(mm) e.g., l*0.7" /></td>
        <td><input class="input" placeholder="breadth(mm) e.g., b*1" /></td>
      `;
      tbody.appendChild(tr);
    });
  }

  const addColorBtn = document.getElementById("addColorRow");
  if(addColorBtn){
    addColorBtn.addEventListener("click", ()=>{
      const tbody = document.querySelector("#colorTable tbody");
      if(!tbody) return;
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td><input class="input" placeholder="Color (e.g., Golden)" /></td>
        <td><input class="input" placeholder="W.I MIN" /></td>
        <td><input class="input" placeholder="W.I MAX" /></td>
      `;
      tbody.appendChild(tr);
    });
  }

  // Procurement-only material field (Tell us about grain)
  function toggleMaterialForProcurement(){
    const at = document.getElementById("analysisType");
    const mf = document.getElementById("materialField");
    if(!at || !mf) return;
    const v = (at.value||"").toLowerCase();
    const isProc = v.includes("procurement");
    mf.style.display = isProc ? "" : "none";
  }
  const atSel = document.getElementById("analysisType");
  if(atSel){
    atSel.addEventListener("change", toggleMaterialForProcurement);
    toggleMaterialForProcurement();
  }

  // Weight vs Count basis (Live screen)
  function setBasis(isWeight){
    const w = document.getElementById("weightField");
    const c = document.getElementById("countField");
    if(w) w.style.display = isWeight ? "" : "none";
    if(c) c.style.display = isWeight ? "none" : "";
  }
  const basisSwitch = document.querySelector('[data-target="#basisState"]');
  if(basisSwitch){
    // default ON = Weight
    setBasis(basisSwitch.classList.contains("on"));
    basisSwitch.addEventListener("click", ()=>{
      setBasis(basisSwitch.classList.contains("on"));
    });
  }

})();
