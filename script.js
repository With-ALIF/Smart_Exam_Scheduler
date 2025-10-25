const grid = document.getElementById('grid');

async function loadExams() {
  try {
    const res = await fetch('exams.json');
    const exams = await res.json();
    buildExamCards(exams);
  } catch (err) {
    grid.innerHTML = '<p style="color:red">⚠️ Failed to load exam data!</p>';
    console.error(err);
  }
}

function parseIsoLocal(isoStr){
  const [d,t] = String(isoStr).split('T');
  const [y,mo,da] = (d||'').split('-').map(Number);
  const [hh,mm,ss] = (t||'00:00:00').split(':').map(Number);
  return new Date(y, (mo||1)-1, da, hh, mm, ss).getTime();
}

function formatDateFriendly(dateStr){
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
}

function calcRemaining(targetTs){
  const now = Date.now();
  const diff = targetTs - now;
  if(diff <= 0) return {days:0,hours:0,minutes:0,seconds:0,totalMs:diff};
  const sec=1000,min=sec*60,hr=min*60,day=hr*24;
  const days=Math.floor(diff/day);
  let rem=diff-days*day;
  const hours=Math.floor(rem/hr); rem-=hours*hr;
  const minutes=Math.floor(rem/min); rem-=minutes*min;
  const seconds=Math.floor(rem/sec);
  return {days,hours,minutes,seconds,totalMs:diff};
}

function pad(n){return String(n).padStart(2,'0');}

function makeCard(exam){
  const wrapper=document.createElement('article');
  wrapper.className='card';
  wrapper._targetTs=parseIsoLocal(exam.iso);
  wrapper.innerHTML=`
    <div class="top">
      <div class="left">
        <div class="code">${exam.code}</div>
        <div class="title">${exam.title}</div>
      </div>
      <div class="datetime-pill">
        <div class="dt-date">${formatDateFriendly(exam.date)}</div>
        <div class="dt-time">${exam.timeRange}</div>
      </div>
    </div>
    <div class="countdown">
      <div class="unit"><div class="num" data-unit="days">--</div><div class="lbl">days</div></div>
      <div class="unit"><div class="num" data-unit="hours">--</div><div class="lbl">hours</div></div>
      <div class="unit"><div class="num" data-unit="minutes">--</div><div class="lbl">mins</div></div>
      <div class="unit"><div class="num" data-unit="seconds">--</div><div class="lbl">secs</div></div>
    </div>
    <div class="bottom-row">
      <div class="end-badge">End Exam</div>
    </div>
  `;
  wrapper._countdown=wrapper.querySelector('.countdown');
  wrapper._endBadge=wrapper.querySelector('.end-badge');
  return wrapper;
}

function buildExamCards(exams){
  const cards = exams.map(exam=>{
    const c=makeCard(exam);
    grid.appendChild(c);
    return c;
  });

  function updateAll(){
    const ended=[];
    cards.forEach((card,idx)=>{
      const rem=calcRemaining(card._targetTs);
      const c=card._countdown;
      c.querySelector('[data-unit="days"]').textContent=rem.days;
      c.querySelector('[data-unit="hours"]').textContent=pad(rem.hours);
      c.querySelector('[data-unit="minutes"]').textContent=pad(rem.minutes);
      c.querySelector('[data-unit="seconds"]').textContent=pad(rem.seconds);
      if(rem.totalMs<=0){
        card.classList.add('ended');
        card._endBadge.style.display='inline-block';
        ended.push(card);
      } else {
        card.classList.remove('ended');
        card._endBadge.style.display='none';
      }
    });
    ended.forEach(e=>grid.appendChild(e));
  }

  updateAll();
  setInterval(updateAll,1000);
}

loadExams();
