// js/features/ranking.js
(function(){
    window.initRanking = function(){
      const section = document.getElementById('rankingSection');
      let pollInterval;
      // 初始狀態：主流幣篩選 + 排序
      let currentFilter = 'mainstream'; // 'mainstream' or 'all'
      let currentMetric = 'changePct';
      let currentDir = 'desc';
      const mainstreamIds = [
        'BTC-USDT-SWAP','ETH-USDT-SWAP','XRP-USDT-SWAP',
        'SOL-USDT-SWAP','DOGE-USDT-SWAP','BCH-USDT-SWAP',
        'TON-USDT-SWAP','LTC-USDT-SWAP','OKB-USDT-SWAP'
      ];
      const metrics = ['changePct','vol24h'];

      section.innerHTML = `
        <div class="ranking-header">
          <h3>🔝 合約交易排行榜</h3>
          <div class="filter-buttons">
            <button data-filter="mainstream" class="active">主流幣</button>
            <button data-filter="all">全部</button>
          </div>
          <button id="rankingCloseBtn" class="close-btn">關閉</button>
        </div>
        <div class="ranking-info" style="margin:8px 0;font-size:0.9rem;color:#666;">
          點擊「24H 漲跌幅」可切換：降序 ▾ / 升序 ▴
        </div>
        <div class="ranking-container">
          <table class="ranking-table">
            <thead>
              <tr id="rankingHeader">
                <th>#</th>
                <th>幣種</th>
                <th class="sortable" data-metric="changePct">24H 漲跌幅 ▾</th>
                <th class="sortable" data-metric="vol24h">24H 交易量</th>
                <th>最新價</th>
                <th>24H 幣量</th>
              </tr>
            </thead>
            <tbody id="rankingBody">
              <tr><td colspan="6">載入中…</td></tr>
            </tbody>
          </table>
        </div>
      `;
      // 關閉
      document.getElementById('rankingCloseBtn').addEventListener('click', () => {
        clearInterval(pollInterval);
        section.innerHTML = '';
      });
      const bodyEl = section.querySelector('#rankingBody');
      const headerEl = section.querySelector('#rankingHeader');
      // 篩選按鈕事件
      section.querySelectorAll('.filter-buttons button').forEach(btn => {
        btn.addEventListener('click', () => {
          section.querySelectorAll('.filter-buttons button').forEach(b=>b.classList.remove('active'));
          btn.classList.add('active');
          currentFilter = btn.dataset.filter;
          renderRows(_data, _data);
        });
      });
      // 排序按鈕事件
      headerEl.querySelectorAll('th.sortable').forEach(th => {
        th.style.cursor = 'pointer';
        th.addEventListener('click', () => {
          const m = th.dataset.metric;
          if(currentMetric === m) currentDir = currentDir === 'desc' ? 'asc' : 'desc';
          else { currentMetric = m; currentDir = 'desc'; }
          updateArrows(); renderRows(_data, _data);
        });
      });

      function fetchData(){
        return fetch('https://www.okx.com/api/v5/market/tickers?instType=SWAP')
          .then(r=>r.json())
          .then(json => json.data.filter(i=>i.instId.endsWith('-USDT-SWAP')).map(i=>(
            {...i, instIdClean:i.instId.replace(/-/g,'').replace('SWAP','.P'), changePct:((+i.last - +i.open24h)/+i.open24h)*100}
          )));
      }

      function updateArrows(){
        headerEl.querySelectorAll('th.sortable').forEach(th=>{
          const base = th.textContent.replace(/ ▾| ▴/,'');
          if(th.dataset.metric === currentMetric) th.textContent = base + (currentDir==='desc'?' ▾':' ▴');
          else th.textContent = base;
        });
      }

      function sortData(data){
        return data.slice().sort((a,b)=>{
          const av = currentMetric==='changePct'?a.changePct:+a[currentMetric];
          const bv = currentMetric==='changePct'?b.changePct:+b[currentMetric];
          return currentDir==='asc'? av-bv: bv-av;
        });
      }

      function renderRows(newData, prevData){
        let dataToShow = newData;
        if(currentFilter==='mainstream') dataToShow = newData.filter(i=>mainstreamIds.includes(i.instId));
        const sorted = sortData(dataToShow);
        bodyEl.innerHTML = '';
        sorted.forEach((row,idx)=>{
          const tr = document.createElement('tr');
          tr.innerHTML = `
            <td>${idx+1}</td>
            <td>${row.instIdClean}</td>
            <td>${row.changePct.toFixed(2)}%</td>
            <td>${(+row.vol24h).toLocaleString()}</td>
            <td>${(+row.last).toFixed(4)}</td>
            <td>${(+row.volCcy24h).toLocaleString()}</td>
          `;
          // highlight
          if(prevData) metrics.forEach(m=>{
            const old = prevData.find(o=>o.instId===row.instId);
            if(old && old[m] != row[m]){
              const cell = tr.querySelector(`td:nth-child(${metrics.indexOf(m)+3})`);
              cell.style.backgroundColor='#fffa65';
              setTimeout(()=>cell.style.backgroundColor='',500);
            }
          });
          bodyEl.appendChild(tr);
        });
      }

      let _data = [];
      function loadAndRender(){
        const prev = _data.map(d=>({...d}));
        fetchData().then(data=>{ _data = data; updateArrows(); renderRows(_data, prev); });
      }
      loadAndRender();
      pollInterval = setInterval(loadAndRender,2000);
    };
})();