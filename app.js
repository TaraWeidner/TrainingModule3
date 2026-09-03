(()=>{
"use strict";
const courses=window.MODULE3_COURSES||[];
const META=window.MODULE3_META||{version:"2026.09.03",title:"Operations, Workflow & Quality Optimization"};
const KEY="inclusiveHealthTraining.module3.v1", PASS=80;
const roles={reception:"Reception / Front Desk",ma:"Medical Assistant",nursing:"Clinical Support / Nursing",provider:"Provider",management:"Management / Leadership"};
const $=id=>document.getElementById(id);
const e={
 learnerButton:$("learnerButton"),learnerSummary:$("learnerSummary"),learnerCard:$("learnerCard"),
 moduleGrid:$("moduleGrid"),template:$("moduleCardTemplate"),overall:$("overallProgressValue"),
 record:$("recordSummary"),csv:$("exportCsvButton"),reset:$("resetButton"),backdrop:$("modalBackdrop"),
 learnerModal:$("learnerModal"),learnerForm:$("learnerForm"),learnerName:$("learnerName"),
 learnerId:$("learnerId"),learnerRole:$("learnerRole"),courseModal:$("courseModal"),
 courseKicker:$("courseKicker"),courseTitle:$("courseTitle"),courseProgressText:$("courseProgressText"),
 courseProgressBar:$("courseProgressBar"),lessonNav:$("lessonNav"),lessonContent:$("lessonContent")
};
let state=load(), course=null, step=0;
function load(){try{const x=JSON.parse(localStorage.getItem(KEY));return x&&x.learners?x:{currentLearnerKey:null,learners:{}}}catch{return{currentLearnerKey:null,learners:{}}}}
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function now(){return new Date().toISOString()}
function esc(v){return String(v??"").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;")}
function fmt(v){if(!v)return"—";const d=new Date(v);return isNaN(d)?"—":d.toLocaleString([],{year:"numeric",month:"short",day:"numeric",hour:"numeric",minute:"2-digit"})}
function learner(){return state.currentLearnerKey?state.learners[state.currentLearnerKey]:null}
function getRecord(id,make=true){
 const l=learner();if(!l)return null;l.records||={};
 if(make&&!l.records[id])l.records[id]={moduleId:id,lessonsDone:[],quizAttempts:[],bestScore:null,passed:false,attestedAt:null,completedAt:null,lastActivityAt:null,courseVersion:META.version};
 return l.records[id]||null;
}
function overall(){if(!learner()||!courses.length)return 0;return Math.round(courses.filter(c=>getRecord(c.id,false)?.completedAt).length/courses.length*100)}
function modulePct(c){const r=getRecord(c.id,false);if(!r)return 0;return Math.round((new Set(r.lessonsDone||[]).size+(r.passed?1:0))/(c.lessons.length+1)*100)}
function dashboard(){
 const l=learner();e.overall.textContent=`${overall()}%`;e.learnerButton.textContent=l?"Change learner":"Set learner";
 e.learnerSummary.textContent=l?`${l.name} • ${roles[l.role]||l.role}`:"No learner selected";
 if(l){
  e.learnerCard.classList.remove("empty-state");
  e.learnerCard.innerHTML=`<strong>${esc(l.name)}</strong><p>${esc(roles[l.role]||l.role)}</p>${l.employeeId?`<p>ID / initials: ${esc(l.employeeId)}</p>`:""}<p>Profile created: ${esc(fmt(l.createdAt))}</p>`;
  const rs=Object.values(l.records||{}),done=rs.filter(r=>r.completedAt).length,att=rs.reduce((n,r)=>n+(r.quizAttempts?.length||0),0);
  e.record.innerHTML=`<p><strong>${done} of ${courses.length} modules complete</strong></p><p>${att} assessment attempt${att===1?"":"s"}</p>`;
  e.csv.disabled=e.reset.disabled=false;
 }else{
  e.learnerCard.classList.add("empty-state");e.learnerCard.textContent="Set a learner profile to begin.";e.record.textContent="No activity yet.";e.csv.disabled=e.reset.disabled=true;
 }
 renderCards();
}
function renderCards(){
 e.moduleGrid.replaceChildren();
 courses.forEach(c=>{
  const f=e.template.content.cloneNode(true),r=getRecord(c.id,false);
  const started=!!r&&((r.lessonsDone?.length||0)||(r.quizAttempts?.length||0)||r.attestedAt),done=!!r?.completedAt,status=f.querySelector(".module-status");
  f.querySelector(".module-number").textContent=`Module ${c.id}`;f.querySelector(".module-title").textContent=c.title;f.querySelector(".module-description").textContent=c.subtitle;
  f.querySelector(".module-meta").innerHTML=`<span>${esc(c.audience)}</span><span>•</span><span>${esc(c.estimate)}</span>`;
  status.textContent=done?"Complete":started?`${modulePct(c)}% in progress`:"Ready";status.className=`module-status pill ${done?"complete":started?"progress":"ready"}`;
  const b=f.querySelector(".module-action");b.textContent="Begin Module";b.onclick=()=>learner()?openCourse(c.id):openLearner();e.moduleGrid.appendChild(f);
 });
}
function openLearner(){const l=learner();e.learnerName.value=l?.name||"";e.learnerId.value=l?.employeeId||"";e.learnerRole.value=l?.role||"";e.backdrop.classList.remove("hidden");e.learnerModal.classList.remove("hidden");e.backdrop.setAttribute("aria-hidden","false");setTimeout(()=>e.learnerName.focus(),0)}
function closeLearner(){e.backdrop.classList.add("hidden");e.learnerModal.classList.add("hidden");e.backdrop.setAttribute("aria-hidden","true")}
function steps(c){return[...c.lessons.map(l=>({type:"lesson",id:l.id,label:l.title,lesson:l})),{type:"role",id:"role",label:"Role & Competency"},{type:"assessment",id:"assessment",label:"Final Assessment"},{type:"completion",id:"completion",label:"Completion"}]}
function firstStep(c){const r=getRecord(c.id);const i=c.lessons.findIndex(l=>!r.lessonsDone.includes(l.id));if(i>=0)return i;if(!r.passed)return c.lessons.length+1;return c.lessons.length+2}
function openCourse(id){course=courses.find(c=>c.id===id);if(!course)return;getRecord(id);step=firstStep(course);e.courseKicker.textContent=`Module ${course.id} • Operations, Workflow & Quality`;e.courseTitle.textContent=course.title;e.courseModal.classList.remove("hidden");document.body.style.overflow="hidden";renderCourse()}
function closeCourse(){e.courseModal.classList.add("hidden");document.body.style.overflow="";course=null;dashboard()}
function stepDone(s){const r=getRecord(course.id);return s.type==="lesson"?r.lessonsDone.includes(s.id):s.type==="assessment"?r.passed:s.type==="completion"?!!r.completedAt:false}
function renderCourse(){
 const r=getRecord(course.id),pct=modulePct(course);e.courseProgressText.textContent=`${pct}% complete`;e.courseProgressBar.style.width=`${pct}%`;e.lessonNav.replaceChildren();
 steps(course).forEach((s,i)=>{const b=document.createElement("button");b.type="button";b.textContent=s.label;if(i===step)b.classList.add("active");if(stepDone(s))b.classList.add("done");b.onclick=()=>{step=i;renderCourse()};e.lessonNav.appendChild(b)});
 const s=steps(course)[step];if(s.type==="lesson")lessonView(s.lesson);else if(s.type==="role")roleView();else if(s.type==="assessment")quizView();else completionView();
 e.lessonContent.focus();r.lastActivityAt=now();save();
}
function nav(complete=false){return`<div class="lesson-actions"><button id="prevStep" class="secondary-button" type="button" ${step===0?"disabled":""}>Previous</button><div>${complete?'<button id="completeStep" class="primary-button" type="button">Mark lesson complete</button>':""}<button id="nextStep" class="secondary-button" type="button" ${step===steps(course).length-1?"disabled":""}>Next</button></div></div>`}
function wire(done){$("prevStep")?.addEventListener("click",()=>move(-1));$("nextStep")?.addEventListener("click",()=>move(1));$("completeStep")?.addEventListener("click",()=>{done?.();move(1)})}
function move(d){step=Math.max(0,Math.min(steps(course).length-1,step+d));renderCourse()}
function lessonView(l){const r=getRecord(course.id),done=r.lessonsDone.includes(l.id);e.lessonContent.innerHTML=`<div class="lesson-inner"><p class="eyebrow">Module ${esc(course.id)}</p><h2>${esc(l.title)}</h2><p class="lead">${esc(course.subtitle)}</p><section class="lesson-copy">${l.html}</section>${nav(!done)}</div>`;wire(()=>{if(!r.lessonsDone.includes(l.id))r.lessonsDone.push(l.id);save()})}
function roleView(){const l=learner(),items=course.roleGuidance?.[l.role]||[];e.lessonContent.innerHTML=`<div class="lesson-inner"><p class="eyebrow">Role application</p><h2>Role & Competency</h2><p class="lead">Review how this module applies to your role and the competency items that may require supervisor validation.</p><section class="role-card"><h3>${esc(roles[l.role]||l.role)}</h3>${items.length?`<ul>${items.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>`:"<p>No role-specific guidance was included for this role.</p>"}</section><section class="competency-card"><h3>Competency checklist</h3><ul class="competency-list">${course.competencies.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></section>${nav(false)}</div>`;wire()}
function prereq(){const r=getRecord(course.id);return course.lessons.every(l=>r.lessonsDone.includes(l.id))}
function quizView(){
 const r=getRecord(course.id);
 if(!prereq()){const miss=course.lessons.filter(l=>!r.lessonsDone.includes(l.id));e.lessonContent.innerHTML=`<div class="lesson-inner"><p class="eyebrow">Final assessment</p><h2>Finish the lessons first</h2><div class="notice notice-warning"><strong>Assessment locked.</strong> Complete all curriculum lessons first.</div><ul>${miss.map(x=>`<li>${esc(x.title)}</li>`).join("")}</ul>${nav(false)}</div>`;wire();return}
 e.lessonContent.innerHTML=`<div class="lesson-inner"><p class="eyebrow">Final assessment</p><h2>${esc(course.title)} Assessment</h2><p class="lead">Select the best answer. A score of ${PASS}% or higher is required to pass.</p>${r.quizAttempts?.length?`<div class="notice notice-info">Previous attempts: ${r.quizAttempts.length}. Best score: ${r.bestScore??"—"}%.</div>`:""}<form id="quizForm">${course.quiz.map((q,i)=>`<section class="quiz-question"><h3>${i+1}. ${esc(q.q)}</h3><div class="choice-list">${q.o.map((o,j)=>`<label class="choice-row"><input type="radio" name="q${i}" value="${j}"> <span>${esc(o)}</span></label>`).join("")}</div></section>`).join("")}<button class="primary-button" type="submit">Submit assessment</button></form><div id="quizResultHost" aria-live="polite"></div>${nav(false)}</div>`;
 $("quizForm").onsubmit=ev=>{
  ev.preventDefault();const ans=course.quiz.map((q,i)=>{const x=ev.currentTarget.querySelector(`input[name="q${i}"]:checked`);return x?+x.value:null});
  if(ans.some(x=>x===null)){$("quizResultHost").innerHTML='<div class="feedback incorrect">Answer every question before submitting.</div>';return}
  const correct=ans.reduce((n,a,i)=>n+(a===course.quiz[i].a),0),score=Math.round(correct/course.quiz.length*100),passed=score>=PASS;
  r.quizAttempts.push({at:now(),score,answers:ans});r.bestScore=r.bestScore==null?score:Math.max(r.bestScore,score);r.passed=r.passed||passed;save();
  $("quizResultHost").innerHTML=`<div class="quiz-result"><div class="score-big">${score}%</div><h3>${passed?"Passed":"Not passed yet"}</h3><p>${passed?"You met the passing score.":`You need ${PASS}% to pass.`}</p><div class="review-list">${course.quiz.map((q,i)=>`<div class="review-item"><strong>${ans[i]===q.a?"✓":"✕"} ${esc(q.q)}</strong><span>${esc(q.e)}</span></div>`).join("")}</div>${passed?'<button id="continuePass" class="primary-button" type="button">Continue to completion</button>':'<button id="retake" class="secondary-button" type="button">Retake assessment</button>'}</div>`;
  $("continuePass")?.addEventListener("click",()=>{step=course.lessons.length+2;renderCourse()});$("retake")?.addEventListener("click",quizView);renderCourseNavOnly();
 };wire();
}
function renderCourseNavOnly(){const pct=modulePct(course);e.courseProgressText.textContent=`${pct}% complete`;e.courseProgressBar.style.width=`${pct}%`;[...e.lessonNav.children].forEach((b,i)=>b.classList.toggle("done",stepDone(steps(course)[i])))}
function completionView(){
 const l=learner(),r=getRecord(course.id);
 if(!r.passed){e.lessonContent.innerHTML=`<div class="lesson-inner"><p class="eyebrow">Completion</p><h2>Pass the assessment first</h2><div class="notice notice-warning">The completion record unlocks after a passing assessment score.</div>${nav(false)}</div>`;wire();return}
 if(r.completedAt){e.lessonContent.innerHTML=`<div class="lesson-inner"><section class="certificate"><img class="certificate-logo" src="inclusive-health-logo-header.png" alt=""><p class="eyebrow">Certificate of Completion</p><h2>Inclusive Health</h2><p>This certifies that</p><div class="certificate-name">${esc(l.name)}</div><p>completed <strong>Module ${esc(course.id)} — ${esc(course.title)}</strong></p><p>Assessment score: <strong>${r.bestScore}%</strong></p><p class="certificate-meta">Completed ${esc(fmt(r.completedAt))} • Version ${esc(r.courseVersion)}</p></section><div class="lesson-actions no-print"><button id="printCertificate" class="primary-button" type="button">Print certificate</button><button id="returnDashboard" class="secondary-button" type="button">Return to dashboard</button></div></div>`;$("printCertificate").onclick=()=>window.print();$("returnDashboard").onclick=closeCourse;return}
 e.lessonContent.innerHTML=`<div class="lesson-inner"><p class="eyebrow">Completion</p><h2>Training attestation</h2><div class="attestation"><label class="ack-row"><input id="attestCheck" type="checkbox"> <span>I attest that I completed this training and understand that I must follow Inclusive Health policies, my role/scope, and supervisor/provider direction.</span></label><button id="completeTraining" class="primary-button" type="button" disabled>Complete Module</button></div>${nav(false)}</div>`;
 $("attestCheck").onchange=ev=>$("completeTraining").disabled=!ev.target.checked;$("completeTraining").onclick=()=>{r.attestedAt=r.completedAt=r.lastActivityAt=now();save();renderCourse();dashboard()};wire();
}
function csv(){
 const l=learner();if(!l)return;const rows=[["Employee","Employee ID","Role","Module","Title","Status","Best Score","Attempts","Completed","Version"]];
 courses.forEach(c=>{const r=getRecord(c.id,false);rows.push([l.name,l.employeeId||"",roles[l.role]||l.role,c.id,c.title,r?.completedAt?"Complete":r?"In progress":"Not started",r?.bestScore??"",r?.quizAttempts?.length||0,r?.completedAt?fmt(r.completedAt):"",r?.courseVersion||META.version])});
 const text=rows.map(row=>row.map(v=>`"${String(v).replaceAll('"','""')}"`).join(",")).join("\r\n"),blob=new Blob([text],{type:"text/csv"}),url=URL.createObjectURL(blob),a=document.createElement("a");a.href=url;a.download=`Inclusive-Health-Module-3-${l.name.replace(/[^a-z0-9]+/gi,"-")}.csv`;a.click();URL.revokeObjectURL(url);
}
e.learnerButton.onclick=openLearner;e.backdrop.onclick=closeLearner;document.querySelectorAll("[data-close-modal]").forEach(b=>b.onclick=closeLearner);document.querySelectorAll("[data-close-course]").forEach(b=>b.onclick=closeCourse);
e.learnerForm.onsubmit=ev=>{ev.preventDefault();const name=e.learnerName.value.trim(),role=e.learnerRole.value,employeeId=e.learnerId.value.trim();if(!name||!role)return;const key=(employeeId||name).toLowerCase().replace(/[^a-z0-9]+/g,"-")+"-"+role;const existing=state.learners[key];state.learners[key]=existing?{...existing,name,employeeId,role}:{name,employeeId,role,createdAt:now(),records:{}};state.currentLearnerKey=key;save();closeLearner();dashboard()};
e.csv.onclick=csv;e.reset.onclick=()=>{const l=learner();if(!l)return;if(confirm(`Reset all Module 3 progress for ${l.name}?`)){l.records={};save();dashboard()}};
document.addEventListener("keydown",ev=>{if(ev.key==="Escape"){if(!e.courseModal.classList.contains("hidden"))closeCourse();else if(!e.learnerModal.classList.contains("hidden"))closeLearner()}});
dashboard();
})();
