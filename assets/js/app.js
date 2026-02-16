(function(){
  const $ = (sel, root=document)=>root.querySelector(sel);
  const $$ = (sel, root=document)=>Array.from(root.querySelectorAll(sel));

  // Active nav highlight based on body data-page
  const page = document.body.dataset.page;
  if(page){
    const link = document.querySelector(`.nav a[data-nav='${page}']`);
    if(link) link.classList.add('active');
  }

  // Dashboard hover (desktop) + click-to-toggle (mobile)
  function attachHoverBox(btnId, boxId){
    const btn = document.getElementById(btnId);
    const box = document.getElementById(boxId);
    if(!btn || !box) return;

    const open = ()=>{
      // close others
      ['headHover','brokensHover','rejectHover'].forEach(id=>{
        const el = document.getElementById(id);
        if(el && id !== boxId) el.classList.remove('open');
      });
      box.classList.add('open');
    };
    const close = ()=>box.classList.remove('open');

    // Desktop hover
    btn.addEventListener('mouseenter', open);
    btn.addEventListener('focus', open);
    box.addEventListener('mouseenter', open);
    box.addEventListener('mouseleave', close);
    btn.addEventListener('mouseleave', ()=>setTimeout(()=>{ if(!box.matches(':hover')) close(); }, 120));

    // Mobile/touch: tap to toggle
    btn.addEventListener('click', (e)=>{
      e.preventDefault();
      if(box.classList.contains('open')) close(); else open();
    });
  }
  attachHoverBox('headBtn','headHover');
  attachHoverBox('brokensBtn','brokensHover');
  attachHoverBox('rejectBtn','rejectHover');

  // Click outside closes hover boxes (dashboard)
  document.addEventListener('click', (e)=>{
    const stack = document.querySelector('.hover-stack');
    if(!stack) return;
    const inHover = e.target.closest('.hover-box');
    const inBtns = e.target.closest('#headBtn, #brokensBtn, #rejectBtn');
    if(!inHover && !inBtns){
      ['headHover','brokensHover','rejectHover'].forEach(id=>document.getElementById(id)?.classList.remove('open'));
    }
  });

  // Chips toggle (analysis type, region etc.)
  $$('.chip[data-group]').forEach(chip=>{
    chip.addEventListener('click', ()=>{
      const group = chip.dataset.group;
      const container = chip.closest('[data-chip-scope]') || document;
      $$( `.chip[data-group='${group}']`, container).forEach(c=>c.classList.remove('active'));
      chip.classList.add('active');

      // fire custom event
      document.dispatchEvent(new CustomEvent('chip:change', {detail:{group, value: chip.dataset.value}}));
    });
  });

  // Grain Info page dynamic logic
  const analysisSelect = $('#analysisType');
  const productionOnly = $('#productionOnly');
  const processField = $('#processField');
  const sampleTypeField = $('#sampleTypeField');
  const regionChipsWrap = $('#regionChips');

  // Chalky % slider badge
  const chalkyRange = $('#chalkyRange');
  const chalkyValue = $('#chalkyValue');
  function updateChalky(){
    if(!chalkyRange || !chalkyValue) return;
    chalkyValue.textContent = `${chalkyRange.value}%`;
  }
  if(chalkyRange){
    chalkyRange.addEventListener('input', updateChalky);
    updateChalky();
  }

  // Mode ID: Auto vs Custom
  const modeCustomWrap = $('#modeCustomWrap');
  const modeRadios = document.querySelectorAll('input[name="modeId"]');
  function updateModeId(){
    if(!modeCustomWrap || !modeRadios.length) return;
    const selected = Array.from(modeRadios).find(r=>r.checked)?.value || 'Auto';
    modeCustomWrap.style.display = (selected === 'Custom') ? 'block' : 'none';
  }
  modeRadios.forEach(r=>r.addEventListener('change', updateModeId));
  updateModeId();

  function updateAnalysisBlocks(){
    if(!analysisSelect) return;
    const v = analysisSelect.value;

    // Persist selection so Live Analysis can auto-reflect it
    try{ localStorage.setItem('raice.analysisType', v); }catch(_e){}
    if(productionOnly) productionOnly.style.display = (v === 'Production' || v === 'TMA') ? 'block' : 'none';

    // Procurement rule: show Sample type instead of Process type
    if(processField) processField.style.display = (v === 'Procurement') ? 'none' : 'block';
    if(sampleTypeField) sampleTypeField.style.display = (v === 'Procurement') ? 'block' : 'none';
  }

  if(analysisSelect){
    // Restore last selected analysis type
    try{
      const saved = localStorage.getItem('raice.analysisType');
      if(saved) analysisSelect.value = saved;
    }catch(_e){}

    analysisSelect.addEventListener('change', updateAnalysisBlocks);
    updateAnalysisBlocks();
  }

  const PROCESS_OPTIONS = {
    North: [
      'Golden Sella',
      'White Sella',
      'Lemon Sella',
      'SW Sella',
      'Cream Steam',
      'Lemon Steam',
      'Raw'
    ],
    Rest: [
      'parboiled',
      'sap',
      'raw'
    ]
  };

  function setSelectOptions(selectEl, options){
    if(!selectEl) return;
    const current = selectEl.value;
    selectEl.innerHTML = '';
    options.forEach(opt=>{
      const o = document.createElement('option');
      o.textContent = opt;
      o.value = opt;
      selectEl.appendChild(o);
    });
    // keep selection if possible
    const match = options.find(o=>o===current);
    if(match) selectEl.value = match;
  }

  // Region selection: show segmentation note (North only)
  const segNote = $('#segmentationNote');
  const segLink = $('#segmentationLink');

  function getActiveChipValue(group){
    const active = document.querySelector(`.chip[data-group='${group}'].active`);
    return active ? active.dataset.value : null;
  }

  function updateRegionBlocks(){
    const region = getActiveChipValue('region');
    const isNorth = region ? region.startsWith('North') : false;
    if(segNote) segNote.style.display = isNorth ? 'block' : 'none';
    if(segLink) segLink.style.display = isNorth ? 'inline-flex' : 'none';
  
    // Process list depends on region (North vs Rest of India)
    const processSelect = $('#processType');
    if(processSelect){
      const opts = isNorth ? PROCESS_OPTIONS.North : PROCESS_OPTIONS.Rest;
      setSelectOptions(processSelect, opts);
    }
}

  document.addEventListener('chip:change', (e)=>{
    if(e.detail.group === 'region') updateRegionBlocks();
    if(e.detail.group === 'sampleBasis') updateSampleBasis();
  });
  updateRegionBlocks();

  // Live Analysis page: weight vs count basis
  const weightOptions = $('#weightOptions');
  const countOptions = $('#countOptions');

  function updateSampleBasis(){
    const basis = getActiveChipValue('sampleBasis') || 'Weight';
    if(weightOptions) weightOptions.style.display = (basis === 'Weight') ? 'flex' : 'none';
    if(countOptions) countOptions.style.display = (basis === 'Count') ? 'flex' : 'none';
  }
  updateSampleBasis();

  // Live page: moisture only for procurement
  const liveAnalysisType = $('#liveAnalysisType');
  const moistureCard = $('#moistureCard');
  const tmaPanel = $('#tmaPanel');
  const tmaGrid = $('#tmaGrid');
  const sampleStack = $('#sampleStack');

  const PRODUCTION_MACHINES = [
    'Husker',
    'Tray separator',
    'Whitener 1',
    'Whitener 2',
    'Whitener 3',
    'Whitener 4',
    'Polisher',
    'Thick thin grader',
    'Length grader',
    'Color sorter',
    'Final rice',
    'Blend & pack'
  ];

  function renderTmaGrid(){
    if(!tmaGrid) return;
    tmaGrid.innerHTML = '';
    PRODUCTION_MACHINES.forEach((m, idx)=>{
      const card = document.createElement('div');
      card.className = 'tma-machine';
      card.innerHTML = `
        <div class="tma-machine-title">${m}</div>
        <div class="tma-samples">
          <button class="tma-sample" type="button" data-machine="${idx}" data-sample="1">sample 1 <span class="dot"></span></button>
          <button class="tma-sample" type="button" data-machine="${idx}" data-sample="2">sample 2 <span class="dot"></span></button>
        </div>
      `;
      tmaGrid.appendChild(card);
    });

    // demo interactivity: toggle running dot
    tmaGrid.querySelectorAll('.tma-sample').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const machine = btn.dataset.machine;
        tmaGrid.querySelectorAll(`.tma-sample[data-machine='${machine}']`).forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  function updateMoisture(){
    if(!liveAnalysisType || !moistureCard) return;
    moistureCard.style.display = (liveAnalysisType.value === 'Procurement') ? 'block' : 'none';

    // TMA rule: show machine-wise samples panel
    if(tmaPanel){
      const show = (liveAnalysisType.value === 'TMA');
      tmaPanel.style.display = show ? 'block' : 'none';
      if(show) renderTmaGrid();
    }

    // Show Sample 1/2/3 only for Procurement & Production (NOT for TMA)
    if(sampleStack){
      sampleStack.style.display = (liveAnalysisType.value === 'TMA') ? 'none' : 'flex';
    }
  }
  if(liveAnalysisType){
    // Auto-reflect analysis type from "Tell us about grain" (no need to select here)
    let saved = null;
    try{ saved = localStorage.getItem('raice.analysisType'); }catch(_e){}
    if(saved){
      liveAnalysisType.value = saved;
      liveAnalysisType.disabled = true;

      // Replace dropdown with a badge (more professional)
      const wrap = liveAnalysisType.closest('div');
      if(wrap && !wrap.querySelector('.analysis-badge')){
        const badge = document.createElement('div');
        badge.className = 'analysis-badge';
        badge.textContent = saved;
        badge.style.marginTop = '8px';
        wrap.appendChild(badge);
      }
      liveAnalysisType.style.display = 'none';
    }

    liveAnalysisType.addEventListener('change', updateMoisture);
    updateMoisture();
  }

  // Live page: sample stack quick toggle
  if(sampleStack){
    sampleStack.querySelectorAll('.sample-pill').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        sampleStack.querySelectorAll('.sample-pill').forEach(b=>b.classList.remove('active'));
        btn.classList.add('active');
      });
    });
  }

  // Segmentation page: add/delete classification rows
  const segBody = $('#segmentationBody');
  const addSegRowBtn = $('#addSegRow');
  function getSafeName(str){
    return String(str || '').trim().toLowerCase().replace(/[^a-z0-9]+/g,'_').replace(/^_+|_+$/g,'') || `cls_${Date.now()}`;
  }
  function wireDeleteButtons(root=segBody){
    if(!root) return;
    root.querySelectorAll('.row-del').forEach(btn=>{
      if(btn.__wired) return;
      btn.__wired = true;
      btn.addEventListener('click', ()=>{
        if(!segBody) return;
        const rows = segBody.querySelectorAll('tr');
        if(rows.length <= 1){
          alert('At least one classification must remain.');
          return;
        }
        const row = btn.closest('tr');
        if(!row) return;
        row.classList.add('row-fade');
        setTimeout(()=>row.remove(), 180);
      });
    });
  }
  wireDeleteButtons();

  if(addSegRowBtn && segBody){
    addSegRowBtn.addEventListener('click', ()=>{
      const id = `custom_${Date.now()}`;
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td class="seg-class"><input class="input" placeholder="New class (e.g., Kanki)" data-seg-name /></td>
        <td><input type="radio" name="${id}" value="head" aria-label="Custom → Head rice" /></td>
        <td><input type="radio" name="${id}" value="broken" aria-label="Custom → Brokens" /></td>
        <td class="seg-actions"><button class="row-del" type="button" aria-label="Delete row">✖</button></td>
      `;
      segBody.appendChild(tr);
      wireDeleteButtons();

      // when user types the class name, normalize the radio group name
      const nameInput = tr.querySelector('[data-seg-name]');
      if(nameInput){
        nameInput.addEventListener('change', ()=>{
          const n = getSafeName(nameInput.value);
          tr.querySelectorAll('input[type="radio"]').forEach(r=>r.name = n);
        });
      }

      // auto focus
      nameInput?.focus();
    });
  }

  // Settings page: add row buttons (simple front-end demo)
  $$('#addRowClass, #addRowWI, #addRowMap').forEach(btn=>{
    btn?.addEventListener('click', ()=>{
      const target = btn.dataset.target;
      const tbody = document.querySelector(target);
      if(!tbody) return;

      const tr = document.createElement('tr');
      if(target === '#tbodyClass'){
        tr.innerHTML = `
          <td><input class="input" placeholder="Class (e.g., Dubar)" /></td>
          <td><input class="input" placeholder="Length formula (e.g., l*0.7)" /></td>
          <td><input class="input" placeholder="Breadth formula (e.g., b*1)" /></td>
        `;
      } else if(target === '#tbodyWI'){
        tr.innerHTML = `
          <td><input class="input" placeholder="Process (e.g., Golden)" /></td>
          <td><input class="input" placeholder="W.I Min" /></td>
          <td><input class="input" placeholder="W.I Max" /></td>
        `;
      } else {
        tr.innerHTML = `
          <td><input class="input" placeholder="Milling series (e.g., 8TPH)" /></td>
          <td><input class="input" placeholder="Machine (e.g., Husker)" /></td>
        `;
      }
      tbody.appendChild(tr);
    });
  });

  // Quick toast
  const saveBtns = $$('.js-save');
  if(saveBtns.length){
    const toast = document.createElement('div');
    toast.style.cssText = 'position:fixed;right:18px;bottom:18px;z-index:9999;display:none;padding:12px 14px;border-radius:14px;background:rgba(244,195,0,.96);color:#0b1220;font-weight:900;box-shadow:0 14px 26px rgba(0,0,0,.25)';
    toast.textContent = 'Saved (wireframe demo)';
    document.body.appendChild(toast);

    saveBtns.forEach(b=>b.addEventListener('click', ()=>{
      toast.style.display = 'block';
      clearTimeout(window.__toastTimer);
      window.__toastTimer = setTimeout(()=>toast.style.display='none', 1200);
    }));
  }
})();
