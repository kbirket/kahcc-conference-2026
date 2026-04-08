import{initializeApp}from"https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import{getAuth,signInWithPopup,GoogleAuthProvider,signOut,onAuthStateChanged}from"https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import{getDatabase,ref,set,get,push,onValue,update,remove}from"https://www.gstatic.com/firebasejs/10.12.0/firebase-database.js";
import{getStorage,ref as sRef,uploadBytes,getDownloadURL}from"https://www.gstatic.com/firebasejs/10.12.0/firebase-storage.js";

const FB={apiKey:"AIzaSyCWBOh3LvdUCfsMwqb0_wpGwCDb8Cmapj4",authDomain:"kahcc-conference-2026.firebaseapp.com",projectId:"kahcc-conference-2026",storageBucket:"kahcc-conference-2026.firebasestorage.app",messagingSenderId:"730154421195",appId:"1:730154421195:web:db3881f6a56527fc98c44e",databaseURL:"https://kahcc-conference-2026-default-rtdb.firebaseio.com"};
const fapp=initializeApp(FB);
const auth=getAuth(fapp);
const db=getDatabase(fapp);
const storage=getStorage(fapp);
const provider=new GoogleAuthProvider();

// ANIMALS
const ANIMALS=["&#127748;","&#128062;","&#129426;","&#128056;","&#128031;","&#128019;","&#128032;","&#128034;","&#128040;","&#129428;","&#127803;","&#129418;","&#128011;","&#128013;","&#128022;","&#129417;","&#128064;","&#128033;"];
function getAnimal(uid){var n=0;for(var i=0;i<uid.length;i++)n+=uid.charCodeAt(i);return ANIMALS[n%ANIMALS.length];}

// STATE
var CU=null,CUD=null,curFeed="general",cardFields=[],myConns={},localAnswers={},localTimer=null,localTR=0,triviaUnsub=null;

// POLLS CONFIG
const POLLS=[
  {id:"truth",label:"The Truth Gone Wild!"},
  {id:"ai-habitat",label:"Explore the AI Habitat"},
  {id:"talk20-thu",label:"Talk 20s - Thursday"},
  {id:"kha",label:"KHA Advocacy Update"},
  {id:"talk20-fri",label:"Talk 20s - Friday"},
  {id:"chris",label:"Work Smarter, Not Harder"},
  {id:"conference",label:"Conference at Large"}
];
const RATING_OPTS=["Fire","Solid","Got one idea","Missed the mark"];
const RATING_EMOJIS=["&#128293;","&#128077;","&#128161;","&#128528;"];
const USAGE_OPTS=["Yes","Maybe","No"];
const USAGE_EMOJIS=["&#9989;","&#129300;","&#10060;"];
const CONF_OPTS=["Definitely","Probably","Not sure"];
const CONF_EMOJIS=["&#128588;","&#128077;","&#129300;"];

// TRIVIA DATA
const ROUND_SECS=15*60,ADMIN_PASS="kahcc2026";
const ROUNDS=[
  {zone:"Savanna",questions:[
    {d:"easy",pts:50,e:"&#127748;",q:"What is the fastest land animal on Earth?",o:["Lion","Cheetah","Greyhound","Pronghorn"],a:1,f:"Cheetahs sprint up to 70 mph and reach 0-60 in 3 seconds!"},
    {d:"medium",pts:100,e:"&#129428;",q:"Which bird has the largest wingspan of any living bird?",o:["Bald Eagle","California Condor","Wandering Albatross","Andean Condor"],a:2,f:"The Wandering Albatross wingspan reaches 11.5 feet - wider than many small planes!"},
    {d:"hard",pts:200,e:"&#128032;",q:"A group of flamingos is a flamboyance. What is a group of rhinos called?",o:["Herd","Crash","Pack","Tower"],a:1,f:"A group of rhinos is a crash - fitting for animals that charge at 30+ mph!"}
  ]},
  {zone:"Rainforest",questions:[
    {d:"easy",pts:50,e:"&#128056;",q:"How many legs does a spider have?",o:["6","8","10","12"],a:1,f:"All spiders have 8 legs - the defining trait of arachnids!"},
    {d:"medium",pts:100,e:"&#129426;",q:"Which animal has the longest gestation period of any land mammal?",o:["Giraffe","African Elephant","Hippopotamus","Rhinoceros"],a:1,f:"African elephants carry their young for up to 22 months - nearly 2 years!"},
    {d:"hard",pts:200,e:"&#128034;",q:"Which animal produces sounds over 188 decibels - the loudest of any creature?",o:["Sperm Whale","Blue Whale","Pistol Shrimp","Howler Monkey"],a:1,f:"Blue whale calls can travel thousands of miles underwater!"}
  ]},
  {zone:"Arctic",questions:[
    {d:"easy",pts:50,e:"&#127803;",q:"What do you call a baby kangaroo?",o:["Cub","Pup","Joey","Kit"],a:2,f:"A baby kangaroo is a joey - born the size of a jellybean!"},
    {d:"medium",pts:100,e:"&#129418;",q:"Which animal can sleep standing up thanks to a stay apparatus in its legs?",o:["Giraffe","Horse","Elephant","Flamingo"],a:1,f:"Horses have tendons that lock their legs in place so they can doze upright!"},
    {d:"hard",pts:200,e:"&#128064;",q:"Octopuses have three hearts. What color is their blood?",o:["Red","Yellow","Blue","Clear"],a:2,f:"Octopus blood is blue! Copper-based hemocyanin works well in cold, low-oxygen water."}
  ]},
  {zone:"Deep Sea",questions:[
    {d:"easy",pts:50,e:"&#128031;",q:"What animal is nicknamed the King of the Jungle?",o:["Tiger","Jaguar","Leopard","Lion"],a:3,f:"Lions are the King - though they actually live in grasslands and savannas!"},
    {d:"medium",pts:100,e:"&#128019;",q:"Koalas are not bears. What type of animal are they?",o:["Primate","Marsupial","Rodent","Monotreme"],a:1,f:"Koalas are marsupials, closely related to wombats. They sleep 22 hours a day!"},
    {d:"hard",pts:200,e:"&#128011;",q:"Which animal has a tongue longer than its body and eats 35,000 insects a day?",o:["Giant Anteater","Chameleon","Frog","Sun Bear"],a:0,f:"The giant anteater tongue is 2 feet long and flicks 150 times per minute!"}
  ]},
  {zone:"Nocturnal House",questions:[
    {d:"easy",pts:50,e:"&#128040;",q:"Which black and white animal sprays sulfur as its defense?",o:["Badger","Panda","Skunk","Zebra"],a:2,f:"Skunks spray up to 10 feet with accuracy - detectable over a mile away!"},
    {d:"medium",pts:100,e:"&#128062;",q:"Which big cat cannot roar but can purr continuously on inhale and exhale?",o:["Snow Leopard","Cougar","Cheetah","Clouded Leopard"],a:2,f:"Cheetahs lack the specialized larynx that lets lions and tigers roar!"},
    {d:"hard",pts:200,e:"&#128013;",q:"Which reptile rotates each eye independently and changes color to communicate?",o:["Gecko","Iguana","Chameleon","Skink"],a:2,f:"Chameleons have 360-degree vision from rotating eyes. Color change is communication, not camouflage!"}
  ]},
  {zone:"Reptile Den",questions:[
    {d:"easy",pts:50,e:"&#128022;",q:"What is the only mammal capable of true sustained powered flight?",o:["Flying Squirrel","Sugar Glider","Bat","Colugo"],a:2,f:"Bats are the only truly flying mammals - over 1,400 species worldwide!"},
    {d:"medium",pts:100,e:"&#129417;",q:"Komodo dragons are the largest lizards. Which country are they native to?",o:["Australia","Philippines","Indonesia","Papua New Guinea"],a:2,f:"Komodo dragons live only on Indonesian islands. They grow 10 feet long!"},
    {d:"hard",pts:200,e:"&#128033;",q:"Which animal freezes completely solid in winter and revives perfectly in spring?",o:["Arctic Ground Squirrel","Wood Frog","Tardigrade","Painted Turtle"],a:1,f:"The wood frog uses glucose as antifreeze, freezes solid, and revives each spring!"}
  ]}
];

const CHALLENGES=[
  {id:"ch1",title:"Strike a Pose!",desc:"Find the tallest animal exhibit and strike the same pose as the animal.",pts:50,diff:"easy"},
  {id:"ch2",title:"New Friend",desc:"Get a photo with someone from a hospital you have never met before.",pts:50,diff:"easy"},
  {id:"ch3",title:"Ancient Artifact",desc:"Find the most ancient artifact in the museum and photograph it with the placard visible.",pts:100,diff:"medium"},
  {id:"ch4",title:"Animal Hands",desc:"Recreate a zoo animal using only your hands and fingers. Be creative!",pts:100,diff:"medium"},
  {id:"ch5",title:"AI-nimal Selfie",desc:"Use an AI tool to transform your selfie into a wild animal. Share the result!",pts:150,diff:"medium"},
  {id:"ch6",title:"The Whole Herd",desc:"Get a photo with at least 6 conference attendees all making animal sounds at once.",pts:200,diff:"hard"},
  {id:"ch7",title:"Safari Sunset",desc:"Find the most beautiful spot in the zoo and capture a photo that could be on a magazine cover.",pts:200,diff:"hard"}
];
const MAX_HUNT=CHALLENGES.reduce(function(s,c){return s+c.pts;},0);

const SESSIONS={
  "truth":{time:"Thursday | 1:15-2:15pm",title:"The Truth Gone Wild!",sub:"Patients tell us what we need to know",body:"<p>Following the popularity of the KHA Fall Convention patient panel, KAHCC is bringing patients back - this time shining a light directly on US. What are marketers doing well or not so well in connecting patients to health education and resources?</p>"},
  "ai-habitat":{time:"Thursday | 2:30-4:00pm",title:"Explore the AI Habitat",sub:"LIVE Podcast - AI Marketing Experts",body:"<div class='spk-chip'><div class='spk-icon'>&#127908;</div><div><div class='spk-name'>AI Marketing Experts</div><div class='spk-org'>Jennifer Crego, Chris Hunter, John Clendenning, Laura Sutherly, Brad Killgore</div></div></div><p>Thousands tune in weekly for the latest AI tips. KAHCC gets to be part of a LIVE podcast sharing top tactics to multiply reach and results.</p>"},
  "talk20-thu":{time:"Thursday | 5:00-5:30pm",title:"Talk 20 Sessions",sub:"All Killer, No Filler",body:"<ul class='blist'><li><strong>Build an App for That</strong> - Kristen Birket, Patterson Health</li><li><strong>Ads for Pennies on the Dollar</strong> - Bryce Dolan, Clay County Memorial</li></ul>"},
  "dinner":{time:"Thursday | 5:30-8:30pm",title:"Dinner and Member Meeting",sub:"Museum Mixer - A Social Safari",body:"<ul class='blist'><li><strong>Watering Hole:</strong> Cash bar and networking</li><li><strong>Museum Prowl:</strong> Scavenger hunt through the museum</li><li><strong>AI-nimal Selfie Contest</strong></li><li><strong>Trivia Trek:</strong> Live mobile trivia challenge</li><li><strong>Creation Center:</strong> Art in the Wild</li><li><strong>Grazing Along the Safari:</strong> Treats from Lucindas Katering, Abilene KS</li></ul><p>KAHCC Membership Meeting during dinner.</p>"},
  "kha":{time:"Friday | 8:30-9:00am",title:"KHA Advocacy Update",sub:"Kansas Hospital Association",body:"<div class='spk-chip'><div class='spk-icon'>&#127963;</div><div><div class='spk-name'>Jaron Caffrey</div><div class='spk-org'>KHA Director of Workforce and Health Care Policy</div></div></div><p>State and federal healthcare legislation update and how you can support positive decisions with your legislators.</p>"},
  "talk20-fri":{time:"Friday | 9:00-10:15am",title:"Talk 20s - Friday",sub:"Multiple presenters",body:"<ul class='blist'><li><strong>Winning Wisdom: 2025 Emeralds Best In Show</strong> - Shelly Conrady, NMC Health</li><li><strong>Creative Patient Solutions</strong> - Clay County General Public Transportation</li></ul>"},
  "chris":{time:"Friday | 10:30am-12pm",title:"Work Smarter, Not Harder: Mastering AI for Healthcare Marketing",sub:"Keynote",body:"<div class='spk-chip'><div class='spk-icon'>&#127942;</div><div><div class='spk-name'>Chris N. Cheetham-West, MBA</div><div class='spk-org'>International Speaker, Author, Former Google Team Member</div></div></div><ul class='blist'><li>Practical step-by-step AI workflow you can implement today</li><li>Free and low-cost AI toolkit for healthcare marketers</li><li>Real-world case studies from healthcare organizations</li><li>How to get found when patients search using AI</li></ul>"},
  "emerald":{time:"Friday | 12:15-2:00pm",title:"Emerald Awards and Luncheon",sub:"Sponsored by Onspire Health Marketing",body:"<div class='spk-chip'><div class='spk-icon'>&#128081;</div><div><div class='spk-name'>Sarah Hancock</div><div class='spk-org'>New Boston Creative Group</div></div></div><p>Celebrate the creativity and success of your fellow healthcare communicators at the annual Emerald Awards, sponsored by Onspire Health Marketing.</p>"}
};

// UTILS
function esc(s){return String(s||"").replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function showToast(msg){var t=document.getElementById("toast");t.textContent=msg;t.classList.add("show");setTimeout(function(){t.classList.remove("show");},2500);}
function fmtTime(ts){var d=Math.floor((Date.now()-(ts||0))/1000);if(d<60)return"just now";if(d<3600)return Math.floor(d/60)+"m ago";if(d<86400)return Math.floor(d/3600)+"h ago";return Math.floor(d/86400)+"d ago";}

// AUTH
onAuthStateChanged(auth,function(user){
  CU=user;
  if(user){
    document.getElementById("authOut").style.display="none";
    document.getElementById("authUser").style.display="flex";
    document.getElementById("signOutBtn").style.display="block";
    var av=document.getElementById("authAvatar");
    if(user.photoURL)av.innerHTML="<img src='"+user.photoURL+"' />";
    else av.textContent=(user.displayName||"A")[0].toUpperCase();
    document.getElementById("authName").textContent=user.displayName||"Attendee";
    loadUserData(user);
  }else{
    document.getElementById("authOut").style.display="block";
    document.getElementById("authUser").style.display="none";
    document.getElementById("signOutBtn").style.display="none";
    CUD=null;
  }
  refresh();
});

function loadUserData(user){
  var ur=ref(db,"users/"+user.uid);
  get(ur).then(function(snap){
    if(snap.exists()){CUD=snap.val();}
    else{
      CUD={uid:user.uid,name:user.displayName||"Attendee",animal:getAnimal(user.uid),card:{fields:[{label:"Organization",value:""},{label:"Email",value:user.email||""}]},score:0,huntScore:0,connections:{}};
      set(ur,CUD);
    }
    cardFields=CUD.card?(CUD.card.fields||[]):[];
    myConns=CUD.connections||{};
    renderMyCard();renderConnections();updateHuntProgress();
  });
}

function refresh(){
  var active=document.querySelector(".tab-panel.active");if(!active)return;
  var id=active.id;
  if(id==="tab-trivia")renderTriviaGame();
  if(id==="tab-community")loadFeed(curFeed);
  if(id==="tab-connect"){renderMyCard();renderConnections();}
  if(id==="tab-hunt")renderHunt();
  if(id==="tab-schedule")checkActivePoll();
  if(id==="tab-dashboard")renderDashboard();
}

// TAB NAV
function switchTab(name){
  document.querySelectorAll(".tab-panel").forEach(function(p){p.classList.remove("active");});
  document.querySelectorAll(".nav-tab").forEach(function(t){t.classList.remove("active");});
  var panel=document.getElementById("tab-"+name);if(panel)panel.classList.add("active");
  var map={schedule:0,trivia:1,hunt:2,community:3,connect:4,info:5};
  if(map[name]!==undefined)document.querySelectorAll(".nav-tab")[map[name]].classList.add("active");
  if(name==="trivia")renderTriviaGame();
  if(name==="community")loadFeed(curFeed);
  if(name==="connect"){renderMyCard();renderConnections();}
  if(name==="hunt")renderHunt();
  if(name==="schedule")checkActivePoll();
  if(name==="dashboard")renderDashboard();
}

// MODAL
function openModal(key){
  var s=SESSIONS[key];if(!s)return;
  document.getElementById("modalTime").textContent=s.time;
  document.getElementById("modalTitle").textContent=s.title;
  document.getElementById("modalSub").textContent=s.sub;
  document.getElementById("modalBody").innerHTML=s.body;
  document.getElementById("sessionModal").classList.add("open");
  document.body.style.overflow="hidden";
}
function closeModal(){document.getElementById("sessionModal").classList.remove("open");document.body.style.overflow="";}
function closeModalOutside(e){if(e.target.id==="sessionModal")closeModal();}

// POLLS
function checkActivePoll(){
  get(ref(db,"activePoll")).then(function(snap){
    var el=document.getElementById("activePollBanner");if(!el)return;
    if(!snap.exists()){el.innerHTML="";return;}
    var pid=snap.val();var poll=POLLS.find(function(p){return p.id===pid;});if(!poll){el.innerHTML="";return;}
    el.innerHTML="<div class='poll-alert'><span class='poll-alert-text'>&#128203; Rate: "+esc(poll.label)+"</span><button class='poll-alert-btn' onclick=\"APP.showPoll('"+pid+"')\">Rate Now</button></div>";
  });
}
onValue(ref(db,"activePoll"),function(){checkActivePoll();});

function showPoll(pid){
  switchTab("trivia");
  setTimeout(function(){renderPollUI(pid);},150);
}

function renderPollControls(){
  var el=document.getElementById("pollControls");if(!el)return;
  var html="";
  POLLS.forEach(function(p){
    html+="<div style='padding:5px 0;border-bottom:1px solid #f0ecf8;'>";
    html+="<div style='font-size:11px;font-weight:700;color:var(--text);margin-bottom:4px;'>"+esc(p.label)+"</div>";
    html+="<div style='display:flex;gap:4px;flex-wrap:wrap;'>";
    html+="<button class='adm-btn adm-green' style='font-size:10px;padding:3px 7px;' onclick=\"APP.activatePoll('"+p.id+"')\">&#9654; Open</button>";
    html+="<button class='adm-btn adm-red' style='font-size:10px;padding:3px 7px;' onclick='APP.closePoll()'>&#9632; Close</button>";
    html+="<button class='adm-btn adm-blue' style='font-size:10px;padding:3px 7px;' onclick=\"APP.revealPoll('"+p.id+"')\">&#128065; Reveal</button>";
    html+="</div></div>";
  });
  el.innerHTML=html;
}

function activatePoll(pid){set(ref(db,"activePoll"),pid);set(ref(db,"revealedPolls/"+pid),false);showToast("Poll opened!");}
function closePoll(){remove(ref(db,"activePoll"));showToast("Poll closed.");}
function revealPoll(pid){set(ref(db,"revealedPolls/"+pid),true);showToast("Results revealed!");}

function renderPollUI(pollId){
  var poll=POLLS.find(function(p){return p.id===pollId;});if(!poll)return;
  var el=document.getElementById("triviaGame");if(!el)return;
  if(!CU){el.innerHTML="<div class='wait-card'><p>Sign in to rate sessions!</p></div>";return;}
  Promise.all([get(ref(db,"pollResponses/"+pollId+"/"+CU.uid)),get(ref(db,"revealedPolls/"+pollId))]).then(function(res){
    var already=res[0].exists();var revealed=res[1].val()===true;
    if(already||revealed){renderPollResults(pollId,poll,revealed);return;}
    var isConf=pollId==="conference";
    var html="<div class='poll-banner'><h3>&#128203; "+esc(poll.label)+"</h3><p>Your feedback goes straight to the KAHCC board!</p></div>";
    html+="<div class='poll-card'><div class='poll-q'>Overall rating</div><div class='poll-opts' id='po-rating'>";
    RATING_OPTS.forEach(function(o,i){html+="<div class='poll-opt' onclick=\"APP.selPoll('rating',"+i+")\">"+RATING_EMOJIS[i]+" "+o+"</div>";});
    html+="</div></div>";
    var q2opts=isConf?CONF_OPTS:USAGE_OPTS;var q2emojis=isConf?CONF_EMOJIS:USAGE_EMOJIS;
    var q2lbl=isConf?"Would you recommend KAHCC membership to a colleague?":"Will you use something from this session in the next 30 days?";
    html+="<div class='poll-card'><div class='poll-q'>"+q2lbl+"</div><div class='poll-opts' id='po-usage'>";
    q2opts.forEach(function(o,i){html+="<div class='poll-opt' onclick=\"APP.selPoll('usage',"+i+")\">"+q2emojis[i]+" "+o+"</div>";});
    html+="</div></div>";
    if(isConf){html+="<div class='poll-card'><div class='poll-q'>What topic would you most like at the next conference?</div><textarea class='poll-textarea' id='po-topic' placeholder='Your suggestion...'></textarea></div>";}
    html+="<div class='poll-card'><div class='poll-q'>What was your biggest takeaway?</div><textarea class='poll-textarea' id='po-takeaway' placeholder='Share your biggest insight...'></textarea></div>";
    html+="<button class='poll-submit' onclick=\"APP.submitPoll('"+pollId+"')\">Submit Feedback &#8250;</button>";
    el.innerHTML=html;
    window._pollSel={};
  });
}

function selPoll(group,idx){
  window._pollSel=window._pollSel||{};
  window._pollSel[group]=idx;
  document.querySelectorAll("#po-"+group+" .poll-opt").forEach(function(o,i){o.className="poll-opt"+(i===idx?" sel":"");});
}

function submitPoll(pollId){
  if(!CU)return;
  window._pollSel=window._pollSel||{};
  if(window._pollSel["rating"]===undefined||window._pollSel["usage"]===undefined){showToast("Please answer all questions!");return;}
  var takeaway=document.getElementById("po-takeaway")?document.getElementById("po-takeaway").value.trim():"";
  var topic=document.getElementById("po-topic")?document.getElementById("po-topic").value.trim():"";
  var data={rating:window._pollSel["rating"],usage:window._pollSel["usage"],takeaway:takeaway,name:CUD?CUD.name:"Attendee",ts:Date.now()};
  if(topic)data.topic=topic;
  set(ref(db,"pollResponses/"+pollId+"/"+CU.uid),data);
  var el=document.getElementById("triviaGame");
  if(el)el.innerHTML="<div class='poll-done'>&#9989; Thank you! Your feedback has been submitted.</div>";
  showToast("Feedback submitted!");
}

function renderPollResults(pollId,poll,revealed){
  var el=document.getElementById("triviaGame");if(!el)return;
  get(ref(db,"pollResponses/"+pollId)).then(function(snap){
    if(!snap.exists()){el.innerHTML="<div class='wait-card'><p>No responses yet.</p></div>";return;}
    var responses=[];snap.forEach(function(c){responses.push(c.val());});
    var rc=[0,0,0,0];var uc=[0,0,0];var takeaways=[];
    responses.forEach(function(r){if(r.rating!==undefined)rc[r.rating]++;if(r.usage!==undefined)uc[r.usage]++;if(r.takeaway)takeaways.push(r.takeaway);});
    var isConf=pollId==="conference";var q2opts=isConf?CONF_OPTS:USAGE_OPTS;var q2emojis=isConf?CONF_EMOJIS:USAGE_EMOJIS;
    var html="<div class='poll-banner' style='background:linear-gradient(135deg,var(--purple),var(--purple-light));'><h3>&#128202; "+esc(poll.label)+"</h3><p>"+responses.length+" response"+(responses.length!==1?"s":"")+" received</p></div>";
    html+="<div class='poll-card'><div class='poll-q'>Overall Rating</div>";
    RATING_OPTS.forEach(function(o,i){var pct=responses.length?Math.round((rc[i]/responses.length)*100):0;html+="<div class='poll-bar-row'><span class='poll-bar-lbl'>"+RATING_EMOJIS[i]+" "+o+"</span><div class='poll-bar-track'><div class='poll-bar-fill' style='width:"+pct+"%'></div></div><span class='poll-bar-pct'>"+pct+"%</span></div>";});
    html+="</div>";
    html+="<div class='poll-card'><div class='poll-q'>"+(isConf?"Recommend KAHCC?":"Use in 30 days?")+"</div>";
    q2opts.forEach(function(o,i){var pct=responses.length?Math.round((uc[i]/responses.length)*100):0;html+="<div class='poll-bar-row'><span class='poll-bar-lbl'>"+q2emojis[i]+" "+o+"</span><div class='poll-bar-track'><div class='poll-bar-fill' style='width:"+pct+"%'></div></div><span class='poll-bar-pct'>"+pct+"%</span></div>";});
    html+="</div>";
    if(takeaways.length){html+="<div class='poll-card'><div class='poll-q'>Key Takeaways</div>";takeaways.slice(0,6).forEach(function(t){html+="<div class='takeaway-item'>&#8220;"+esc(t)+"&#8221;</div>";});html+="</div>";}
    if(!revealed)html+="<div class='poll-done' style='background:#fff3e0;color:var(--medium);'>&#9203; Results will be revealed shortly.</div>";
    el.innerHTML=html;
  });
}

// TRIVIA
function renderTriviaGame(){
  var el=document.getElementById("triviaGame");if(!el)return;
  if(triviaUnsub){triviaUnsub();triviaUnsub=null;}
  triviaUnsub=onValue(ref(db,"gameState"),function(snap){
    var gs=snap.val()||{started:false,gameOver:false,currentRound:-1,timeRemaining:ROUND_SECS};
    renderTriviaUI(gs);
  });
  renderPollControls();checkActivePoll();
}

function renderTriviaUI(gs){
  var el=document.getElementById("triviaGame");if(!el)return;
  if(gs.gameOver){renderGameOver(gs);return;}
  if(!gs.started){el.innerHTML="<div class='wait-card'><div class='wait-icon'>&#128062;</div><h3>Game Not Started Yet</h3><p>Trivia Trek begins during the Museum Mixer Thursday evening. Get ready!</p></div>";return;}
  if(gs.currentRound<0){el.innerHTML="<div class='wait-card'><div class='wait-icon'>&#9201;</div><h3>Get Ready!</h3><p>Round 1 drops soon. Sign in to play!</p></div>"+lbHTML();return;}
  var html="";
  if(CU&&CUD){html+="<div class='score-bar'><div><div class='sb-lbl'>Your Score</div><div class='sb-name'>"+(CUD.animal||"")+" "+esc(CUD.name||"")+"</div></div><div><div class='sb-score'>"+(CUD.score||0)+"</div><div class='sb-pts'>pts</div></div></div>";}
  html+="<div class='score-leg'><div class='sl sl-e'>&#128994; Easy=50</div><div class='sl sl-m'>&#128993; Med=100</div><div class='sl sl-h'>&#128308; Hard=200</div></div>";
  html+="<div class='rounds-prog'>";
  ROUNDS.forEach(function(r,ri){
    html+="<div class='rdg"+(ri===gs.currentRound?" ar":"")+"'><div class='rdg-lbl'>"+r.zone.split(" ")[0].substring(0,5)+"</div><div class='dot-row'>";
    r.questions.forEach(function(q,qi){
      var key=ri+"_"+qi;var a=localAnswers[key];var cls="qdot";
      if(ri>gs.currentRound){}
      else if(ri<gs.currentRound){cls+=a?(a.ok?" dok":" dno"):(" r"+q.d[0]);}
      else{cls+=a?(a.ok?" dok":" dno"):(" r"+q.d[0]+" act");}
      html+="<div class='"+cls+"'></div>";
    });
    html+="</div></div>";
  });
  html+="</div>";
  var pct=Math.max(0,Math.min(100,((gs.timeRemaining||0)/ROUND_SECS)*100));
  var m=Math.floor((gs.timeRemaining||0)/60),s=(gs.timeRemaining||0)%60;
  html+="<div class='timer-wrap'><div class='timer-row'><span class='t-lbl'>Next Round In</span><span class='t-cd' id='timerCD'>"+m+":"+(s<10?"0":"")+s+"</span></div><div class='t-track'><div class='t-fill"+(pct<20?" urg":"")+"' id='timerFill' style='width:"+pct+"%'></div></div></div>";
  var rnd=ROUNDS[gs.currentRound];
  html+="<div class='rnd-hdr'><div class='rnd-name'>&#127758; "+rnd.zone+"</div><div class='rnd-prog'>Round "+(gs.currentRound+1)+" / "+ROUNDS.length+"</div></div>";
  var ltrs=["A","B","C","D"];
  rnd.questions.forEach(function(q,qi){
    var key=gs.currentRound+"_"+qi;var ans=localAnswers[key];var done=ans!==undefined;
    var dc=q.d==="easy"?"ec":q.d==="medium"?"mc":"hc";
    var dd=q.d==="easy"?"de":q.d==="medium"?"dm":"dh";
    var cap=q.d.charAt(0).toUpperCase()+q.d.slice(1);
    html+="<div class='qcard "+dc+"'>";
    html+="<div class='qmeta'><div class='diff-badge "+dd+"'>"+q.e+" "+cap+"</div><div class='pts-badge'>"+(done&&ans.ok?"+"+q.pts+" earned!":"+"+q.pts+" pts")+"</div></div>";
    html+="<div class='qtext'>"+esc(q.q)+"</div><div class='qopts'>";
    q.o.forEach(function(opt,i){
      var cls="qopt";
      if(done){cls+=" dis";if(i===q.a)cls+=" rev";if(ans.chosen===i&&i!==q.a)cls+=" wrg";if(ans.chosen===i&&i===q.a)cls+=" cor";}
      var oc=(!done&&CU)?(" onclick=\"APP.answerQ("+gs.currentRound+","+qi+","+i+")\""): "";
      html+="<div class='"+cls+"'"+oc+"><span class='opt-l'>"+ltrs[i]+"</span>"+esc(opt)+"</div>";
    });
    html+="</div>";
    if(done){html+="<div class='afb "+(ans.ok?"cor":"wrg")+" show'>"+(ans.ok?"&#9989; Correct! ":"&#10060; Not quite. ")+esc(q.f)+"</div>";}
    else if(!CU){html+="<div style='margin-top:9px;text-align:center;font-size:11px;color:#999;'>Sign in to play!</div>";}
    html+="</div>";
  });
  if(!CU){html+="<div class='wait-card' style='padding:14px;'><p style='font-size:12px;'>&#128100; Sign in at the top to play and earn points!</p></div>";}
  html+=lbHTML();
  el.innerHTML=html;
  startLocalTimer(gs);
}

function startLocalTimer(gs){
  clearInterval(localTimer);localTR=gs.timeRemaining||0;
  localTimer=setInterval(function(){
    if(localTR>0){
      localTR--;
      var f=document.getElementById("timerFill");var c=document.getElementById("timerCD");
      if(f&&c){var pct=Math.max(0,(localTR/ROUND_SECS)*100);f.style.width=pct+"%";f.className="t-fill"+(pct<20?" urg":"");var m2=Math.floor(localTR/60),s2=localTR%60;c.textContent=m2+":"+(s2<10?"0":"")+s2;}
    }
  },1000);
}

function lbHTML(){
  var h="<div class='lb-card'><div class='lb-hdr'><span style='font-size:17px;'>&#127942;</span><h3>Leaderboard</h3></div><div class='lb-body' id='lbBody'><div class='lb-empty'>Loading...</div></div></div>";
  setTimeout(loadLeaderboard,150);return h;
}

function loadLeaderboard(){
  var el=document.getElementById("lbBody");if(!el)return;
  get(ref(db,"users")).then(function(snap){
    if(!snap.exists()||!el){if(el)el.innerHTML="<div class='lb-empty'>No players yet!</div>";return;}
    var players=[];snap.forEach(function(c){var d=c.val();if(d.score>0||d.name)players.push(d);});
    players.sort(function(a,b){return(b.score||0)-(a.score||0);});
    if(!players.length){el.innerHTML="<div class='lb-empty'>No scores yet!</div>";return;}
    var html="";
    players.slice(0,10).forEach(function(p,i){
      var rc=i===0?"r1":i===1?"r2":i===2?"r3":"ro";
      var medal=i===0?"&#129351;":i===1?"&#129352;":i===2?"&#129353;":(i+1)+"";
      var me=CU&&p.uid===CU.uid?" <span style='font-size:9px;color:var(--purple);'>(you)</span>":"";
      html+="<div class='lb-entry'><div class='lb-rank "+rc+"'>"+medal+"</div><div class='lb-name'>"+(p.animal||"")+" "+esc(p.name||"Attendee")+me+"</div><div class='lb-score'>"+(p.score||0)+"</div></div>";
    });
    el.innerHTML=html;
  });
}

function renderGameOver(){
  var el=document.getElementById("triviaGame");if(!el)return;
  var myScore=CUD?CUD.score:0;
  var maxPts=ROUNDS.reduce(function(s,r){return s+r.questions.reduce(function(ss,q){return ss+q.pts;},0);},0);
  el.innerHTML="<div class='game-over'><div class='trophy'>&#127942;</div><h2>Trivia Trek Complete!</h2>"+(CU?"<p>Your final score:</p><div class='final-score'>"+myScore+"</div><p style='margin-top:5px;font-size:11px;color:var(--gold-light);'>out of "+maxPts+" pts</p>":"<p>Thanks for watching!</p>")+"</div>"+lbHTML();
}

function answerQ(ri,qi,chosen){
  if(!CU||!CUD)return;
  var key=ri+"_"+qi;if(localAnswers[key]!==undefined)return;
  var q=ROUNDS[ri].questions[qi];var ok=chosen===q.a;
  localAnswers[key]={chosen:chosen,ok:ok};
  if(ok){var bonus=Math.floor((localTR/ROUND_SECS)*q.pts*0.25);var ns=(CUD.score||0)+q.pts+bonus;CUD.score=ns;update(ref(db,"users/"+CU.uid),{score:ns});}
  get(ref(db,"gameState")).then(function(snap){renderTriviaUI(snap.val()||{});});
}
// ADMIN
function toggleAdm(){document.getElementById("adminPanel").classList.toggle("open");}
function unlockAdmin(){
  var v=document.getElementById("adminPassInput").value;
  if(v===ADMIN_PASS){document.getElementById("adminLock").style.display="none";document.getElementById("adminControls").style.display="block";updateAdmStatus();renderPollControls();renderAdminHunt();}
  else{document.getElementById("adminPassInput").value="";document.getElementById("adminPassInput").placeholder="Wrong password...";}
}
function updateAdmStatus(){
  get(ref(db,"gameState")).then(function(snap){
    var gs=snap.val()||{};var el=document.getElementById("adminStatus");if(!el)return;
    if(!gs.started){el.textContent="Game not started.";el.className="adm-status adm-info";}
    else if(gs.gameOver){el.textContent="Game over!";el.className="adm-status adm-ok";}
    else if(gs.currentRound<0){el.textContent="Started - release Round 1.";el.className="adm-status adm-warn";}
    else{el.textContent="Round "+(gs.currentRound+1)+" active.";el.className="adm-status adm-ok";}
  });
}
function adminStartGame(){set(ref(db,"gameState"),{started:true,gameOver:false,currentRound:-1,timeRemaining:ROUND_SECS});updateAdmStatus();}
function adminNextRound(){
  get(ref(db,"gameState")).then(function(snap){
    var gs=snap.val()||{};
    var next=gs.currentRound<0?0:(gs.currentRound<ROUNDS.length-1?gs.currentRound+1:-2);
    if(next===-2){set(ref(db,"gameState"),{started:true,gameOver:true,currentRound:gs.currentRound,timeRemaining:0});}
    else{set(ref(db,"gameState"),{started:true,gameOver:false,currentRound:next,timeRemaining:ROUND_SECS});}
    updateAdmStatus();
  });
}
function adminResetGame(){localAnswers={};set(ref(db,"gameState"),{started:false,gameOver:false,currentRound:-1,timeRemaining:ROUND_SECS});updateAdmStatus();}

// Render the pending Scavenger Hunt submissions for Admins
function renderAdminHunt(){
  var el=document.getElementById("adminHuntApproval");if(!el)return;
  onValue(ref(db,"huntPending"),function(snap){
    if(!snap.exists()){el.innerHTML="<p style='font-size:12px;'>No pending hunt submissions.</p>";return;}
    var html="<h3 style='font-size:14px; margin-bottom:10px;'>&#128247; Pending Hunt Approvals</h3>";
    snap.forEach(function(c){
      var d=c.val();
      html+="<div style='background:#f9f9f9; padding:10px; margin-bottom:10px; border-radius:5px;'>";
      html+="<div style='font-weight:bold; font-size:12px;'>"+esc(d.name)+"</div>";
      html+="<div style='font-size:11px; color:#666; margin-bottom:5px;'>"+esc(d.chTitle)+" ("+d.pts+" pts)</div>";
      html+="<img src='"+d.url+"' style='width:100%; max-width:200px; border-radius:4px; margin-bottom:5px;' />";
      html+="<br><button class='adm-btn adm-green' onclick=\"APP.approveHunt('"+d.uid+"','"+d.chId+"',"+d.pts+")\">&#9989; Approve & Award "+d.pts+" pts</button>";
      html+="</div>";
    });
    el.innerHTML=html;
  });
}

// Approve a submission, add points to the user, and clear from queue
function approveHunt(uid, chId, pts){
  // 1. Mark the specific hunt challenge as approved
  update(ref(db,"hunt/"+uid+"/"+chId), {approved: true});
  
  // 2. Fetch the user's current score and add the new points
  get(ref(db,"users/"+uid)).then(function(snap){
    if(snap.exists()){
      var u = snap.val();
      var newScore = (u.score || 0) + pts;
      update(ref(db,"users/"+uid), {score: newScore});
    }
  });
  
  // 3. Remove it from the pending queue
  remove(ref(db,"huntPending/"+uid+"_"+chId));
  showToast("Approved! Points awarded.");
}
// COMMUNITY
var REACTS=["&#127748;","&#128062;","&#129426;","&#128056;","&#127803;"];
var RNAMES=["Lion","Zebra","Cheetah","Frog","Flower"];

function switchFeed(feed){
  curFeed=feed;
  document.querySelectorAll(".feed-tab").forEach(function(t){t.classList.remove("active");});
  var idx={general:0,resource:1,steal:2}[feed];
  document.querySelectorAll(".feed-tab")[idx].classList.add("active");
  var ta=document.getElementById("postText");
  var ph={general:"Share something with the herd...",resource:"Share a tool, link, or template...",steal:"Share something your hospital does that others could replicate..."};
  if(ta)ta.placeholder=ph[feed]||"";
  loadFeed(feed);
}

function loadFeed(feed){
  var el=document.getElementById("feedPosts");if(!el)return;
  el.innerHTML="<div class='feed-empty'>Loading...</div>";
  onValue(ref(db,"posts/"+feed),function(snap){
    if(!el)return;
    if(!snap.exists()){el.innerHTML="<div class='feed-empty'>No posts yet - be first!</div>";return;}
    var posts=[];snap.forEach(function(c){var d=c.val();d._key=c.key;posts.push(d);});
    posts.sort(function(a,b){return(b.ts||0)-(a.ts||0);});
    el.innerHTML="";
    posts.forEach(function(p){el.appendChild(buildPostCard(p,feed));});
  },{onlyOnce:false});
}

function buildPostCard(p,feed){
  var div=document.createElement("div");
  div.className="post-card"+(feed==="resource"?" resource":feed==="steal"?" steal":"");
  var uid=CU?CU.uid:"";var reacts=p.reacts||{};
  var reactHTML="";
  REACTS.forEach(function(emoji,i){
    var rk=RNAMES[i];var cnt=reacts[rk]?Object.keys(reacts[rk]).length:0;var iR=uid&&reacts[rk]&&reacts[rk][uid];
    reactHTML+="<button class='react-btn"+(iR?" reacted":"")+"' onclick=\"APP.doReact('"+feed+"','"+p._key+"','"+rk+"')\">"+emoji+" <span class='react-count'>"+(cnt||"")+" </span></button>";
  });
  var replies=p.replies||{};var rItems=Object.values(replies).sort(function(a,b){return(a.ts||0)-(b.ts||0);});
  var rHTML=rItems.map(function(r){return"<div class='reply-item'><div class='reply-av'>"+(r.animal||"&#128062;")+"</div><div><div class='reply-author'>"+esc(r.name||"")+"</div><div class='reply-text'>"+esc(r.text||"")+"</div></div></div>";}).join("");
  div.innerHTML="<div class='post-meta'><div class='post-avatar'>"+(p.animal||"&#128062;")+"</div><div><div class='post-author'>"+esc(p.name||"Attendee")+"</div></div><div class='post-time'>"+fmtTime(p.ts)+"</div></div><div class='post-text'>"+esc(p.text||"")+"</div><div class='post-actions'>"+reactHTML+"<button class='reply-btn' onclick='this.nextElementSibling.style.display=this.nextElementSibling.style.display===\"none\"?\"block\":\"none\"'>Reply</button></div><div class='replies-sec' style='display:"+(rItems.length?"block":"none")+"'><div>"+rHTML+"</div><div class='reply-row'><input class='reply-inp' placeholder='Reply...' id='ri_"+p._key+"' /><button class='reply-sub' onclick=\"APP.doReply('"+feed+"','"+p._key+"')\">Send</button></div></div>";
  return div;
}

function doReact(feed,pk,rk){
  if(!CU){showToast("Sign in to react!");return;}
  var path="posts/"+feed+"/"+pk+"/reacts/"+rk+"/"+CU.uid;
  get(ref(db,path)).then(function(snap){if(snap.exists())remove(ref(db,path));else set(ref(db,path),true);});
}
function doReply(feed,pk){
  if(!CU){showToast("Sign in to reply!");return;}
  var inp=document.getElementById("ri_"+pk);if(!inp||!inp.value.trim())return;
  var txt=inp.value.trim();inp.value="";
  push(ref(db,"posts/"+feed+"/"+pk+"/replies"),{text:txt,name:CUD?CUD.name:"Attendee",animal:CUD?CUD.animal:"&#128062;",ts:Date.now()});
}
function submitPost(){
  if(!CU){showToast("Sign in to post!");return;}
  var ta=document.getElementById("postText");if(!ta||!ta.value.trim())return;
  var txt=ta.value.trim();ta.value="";
  push(ref(db,"posts/"+curFeed),{text:txt,name:CUD?CUD.name:"Attendee",animal:CUD?CUD.animal:"&#128062;",uid:CU.uid,ts:Date.now()});
  showToast("Posted!");
}

// CONNECT
function renderMyCard(){
  var el=document.getElementById("myCardDisplay");if(!el)return;
  if(!CU||!CUD){el.innerHTML="<p style='font-size:12px;color:#888;text-align:center;padding:9px 0;'>Sign in to create your card.</p>";return;}
  var fHTML=(cardFields||[]).filter(function(f){return f.value;}).map(function(f){return"<div class='biz-field'>&#8250; <strong>"+esc(f.label)+":</strong> "+esc(f.value)+"</div>";}).join("");
  el.innerHTML="<div class='biz-card'><div class='biz-animal'>"+(CUD.animal||"&#128062;")+"</div><div class='biz-name'>"+esc(CUD.name||"Attendee")+"</div><div class='biz-fields'>"+fHTML+"</div></div>";
}
function toggleCardEdit(){
  var ed=document.getElementById("cardEditor");var btn=document.getElementById("editCardBtn");
  if(ed.style.display==="none"){ed.style.display="block";btn.textContent="Cancel";renderFieldEditor();}
  else{ed.style.display="none";btn.textContent="&#9998; Edit My Card";}
}
function renderFieldEditor(){
  var el=document.getElementById("cardFields");if(!el)return;
  var html="";
  (cardFields||[]).forEach(function(f,i){html+="<div class='field-row'><input placeholder='Label' value='"+esc(f.label)+"' id='fl_"+i+"' /><input placeholder='Value' value='"+esc(f.value)+"' id='fv_"+i+"' /></div>";});
  el.innerHTML=html;
}
function addCardField(){cardFields.push({label:"",value:""});renderFieldEditor();}
function saveMyCard(){
  if(!CU)return;
  var nf=[];
  (cardFields||[]).forEach(function(_,i){var l=document.getElementById("fl_"+i);var v=document.getElementById("fv_"+i);if(l&&v&&(l.value.trim()||v.value.trim()))nf.push({label:l.value.trim(),value:v.value.trim()});});
  cardFields=nf;CUD.card={fields:cardFields};
  update(ref(db,"users/"+CU.uid),{card:{fields:cardFields}});
  toggleCardEdit();renderMyCard();showToast("Card saved!");
}
function searchAttendees(){
  var q=document.getElementById("attendeeSearch").value.trim().toLowerCase();
  var el=document.getElementById("attendeeResults");if(!el)return;
  if(q.length<2){el.innerHTML="";return;}
  get(ref(db,"users")).then(function(snap){
    if(!snap.exists()){el.innerHTML="<div class='feed-empty'>No attendees found.</div>";return;}
    var results=[];
    snap.forEach(function(c){var d=c.val();if(d.name&&d.name.toLowerCase().includes(q)&&d.uid!==CU?.uid)results.push(d);});
    if(!results.length){el.innerHTML="<div class='feed-empty'>No attendees found.</div>";return;}
    el.innerHTML=results.slice(0,10).map(function(a){
      var org=a.card&&a.card.fields&&a.card.fields.find(function(f){return f.label.toLowerCase().includes("org");});
      var iC=myConns&&myConns[a.uid];
      return"<div class='att-card'><div class='att-animal'>"+(a.animal||"&#128062;")+"</div><div class='att-info'><div class='att-name'>"+esc(a.name||"Attendee")+"</div><div class='att-org'>"+(org?esc(org.value):"")+"</div></div><button class='conn-btn"+(iC?" connected":"")+"' onclick=\"APP.doConnect('"+a.uid+"')\">"+(iC?"&#9989; Connected":"Connect")+"</button></div>";
    }).join("");
  });
}
function doConnect(uid){
  if(!CU){showToast("Sign in to connect!");return;}
  get(ref(db,"users/"+uid)).then(function(snap){
    if(!snap.exists())return;
    var o=snap.val();myConns[uid]=o;CUD.connections=myConns;
    update(ref(db,"users/"+CU.uid+"/connections/"+uid),{name:o.name,animal:o.animal,uid:uid,card:o.card||{},connectedAt:Date.now()});
    renderConnections();showToast("Connected with "+o.name+"!");searchAttendees();
  });
}
function renderConnections(){
  var el=document.getElementById("myConnections");var ct=document.getElementById("connCount");var ca=document.getElementById("connActs");if(!el)return;
  var conns=Object.values(myConns||{});
  if(ct)ct.textContent=conns.length;if(ca)ca.style.display=conns.length?"flex":"none";
  if(!conns.length){el.innerHTML="<div class='feed-empty'>No connections yet. Search above!</div>";return;}
  el.innerHTML=conns.map(function(c){
    var org=c.card&&c.card.fields&&c.card.fields.find(function(f){return f.label.toLowerCase().includes("org");});
    return"<div class='att-card'><div class='att-animal'>"+(c.animal||"&#128062;")+"</div><div class='att-info'><div class='att-name'>"+esc(c.name||"Attendee")+"</div><div class='att-org'>"+(org?esc(org.value):"")+"</div></div></div>";
  }).join("");
}
function downloadConnections(){
  var conns=Object.values(myConns||{});if(!conns.length){showToast("No connections yet!");return;}
  var lines=["Name,Organization,Email,Phone"];
  conns.forEach(function(c){var f=c.card&&c.card.fields||[];var g=function(l){var x=f.find(function(ff){return ff.label.toLowerCase().includes(l);});return x?x.value:"";};lines.push([c.name,g("org"),g("email"),g("phone")].map(function(v){return'"'+(v||"")+'"';}).join(","));});
  var blob=new Blob([lines.join("\n")],{type:"text/csv"});var a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download="KAHCC-2026-connections.csv";a.click();showToast("Downloaded!");
}
function emailConnections(){
  var conns=Object.values(myConns||{});if(!conns.length){showToast("No connections yet!");return;}
  var body=encodeURIComponent("My KAHCC 2026 Connections:\n\n"+conns.map(function(c){var f=c.card&&c.card.fields||[];return c.name+"\n"+f.map(function(ff){return ff.label+": "+ff.value;}).join("\n");}).join("\n\n"));
  window.location.href="mailto:"+encodeURIComponent(CU.email||"")+"?subject=My%20KAHCC%202026%20Connections&body="+body;
}

// HUNT
function renderHunt(){
  var el=document.getElementById("huntChallenges");if(!el)return;
  if(!CU){el.innerHTML="<div class='wait-card'><p>Sign in to participate in the hunt!</p></div>";return;}
  
  get(ref(db,"hunt/"+CU.uid)).then(function(snap){
    var mh=snap.val()||{};
    
    // 1. Add the new "AI-nimal Selfie" title, Poster, and Guestcam inside the Hunt tab
    el.innerHTML="<div style='text-align: center; margin-bottom: 25px; padding: 15px; background: #fff; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.05);'>" +
                 "<h2 style='color:var(--purple); margin-bottom:15px; font-size: 24px;'>&#128247; AI-nimal Selfie Contest</h2>" +
                 "<img src='AI-nimalMuseumSelfie.png' style='width: 100%; max-width: 400px; border-radius: 8px; margin-bottom: 15px;' alt='AI-nimal Museum Selfie Contest' onerror=\"this.style.display='none'\" />" +
                 "<p style='font-size: 14px; color: #555; margin-bottom: 15px;'><strong>Step 1:</strong> Use the Guestcam below to snap your photo and transform into a wild animal. Save the image to your phone.<br><br><strong>Step 2:</strong> Scroll down to the challenges below and upload your saved photo to earn points!</p>" +
                 // The Guestcam embedded directly inside the tab
                 "<iframe src='https://guestcam.co/guest/0CMxmfHyNC' style='width: 100%; height: 600px; border: 2px solid var(--purple); border-radius: 8px; background: #f0ecf8;' allow='camera; microphone'></iframe>" +
                 "</div>" +
                 "<h3 style='margin: 0 0 15px 0; color: var(--text); font-size: 18px;'>&#128269; Hunt Challenges</h3>";
                 
    // 2. Loop through all of your original challenges
    CHALLENGES.forEach(function(ch){
      var sub=mh[ch.id];var div=document.createElement("div");div.className="ch-card";
      var sHTML=sub?(sub.approved?"<div class='ch-approved'>&#9989; Approved! +"+ch.pts+" pts</div>":"<div class='ch-pending'>&#9203; Pending admin approval...</div>"):"<label class='upload-btn' style='display:block;text-align:center;padding:9px;' for='upl_"+ch.id+"'>&#128247; Upload Photo<input type='file' id='upl_"+ch.id+"' accept='image/*' style='display:none;' onchange=\"APP.uploadHunt('"+ch.id+"',this)\" /></label>";
      div.innerHTML="<div class='ch-hdr'><span class='ch-pts-badge "+ch.diff+"'>+"+ch.pts+" pts</span><span style='font-size:16px;'>"+(sub?sub.approved?"&#9989;":"&#9203;":"&#128247;")+"</span></div><div class='ch-title'>"+esc(ch.title)+"</div><div class='ch-desc'>"+esc(ch.desc)+"</div>"+sHTML;
      el.appendChild(div);
    });
    updateHuntProgress();
  });
  loadHuntGallery();
}
function uploadHunt(chId,input){
  if(!CU||!input.files||!input.files[0])return;
  var file=input.files[0];showToast("Uploading...");
  var sr=sRef(storage,"hunt/"+CU.uid+"/"+chId+"_"+Date.now());
  uploadBytes(sr,file).then(function(s){return getDownloadURL(s.ref);}).then(function(url){
    var ch=CHALLENGES.find(function(c){return c.id===chId;});
    update(ref(db,"hunt/"+CU.uid+"/"+chId),{url:url,approved:false,name:CUD?CUD.name:"Attendee",animal:CUD?CUD.animal:"&#128062;",chTitle:ch?ch.title:"",pts:ch?ch.pts:0,ts:Date.now()});
    set(ref(db,"huntPending/"+CU.uid+"_"+chId),{uid:CU.uid,chId:chId,url:url,name:CUD?CUD.name:"Attendee",pts:ch?ch.pts:0,chTitle:ch?ch.title:"",ts:Date.now()});
    showToast("Submitted! Awaiting approval.");renderHunt();
  }).catch(function(e){showToast("Upload failed: "+e.message);});
}
function updateHuntProgress(){
  if(!CU)return;
  get(ref(db,"hunt/"+CU.uid)).then(function(snap){
    var mh=snap.val()||{};var earned=0;
    CHALLENGES.forEach(function(ch){if(mh[ch.id]&&mh[ch.id].approved)earned+=ch.pts;});
    var pct=Math.round((earned/MAX_HUNT)*100);
    var bar=document.getElementById("huntBar");var lbl=document.getElementById("huntPtsLbl");
    if(bar)bar.style.width=pct+"%";if(lbl)lbl.textContent=earned+" pts";
  });
}
function loadHuntGallery(){
  var el=document.getElementById("huntGallery");if(!el)return;
  onValue(ref(db,"hunt"),function(snap){
    if(!snap.exists()||!el){if(el)el.innerHTML="<div class='feed-empty'>No approved photos yet!</div>";return;}
    var photos=[];
    snap.forEach(function(uSnap){uSnap.forEach(function(cSnap){var d=cSnap.val();if(d&&d.url&&d.approved)photos.push(d);});});
    if(!photos.length){el.innerHTML="<div class='feed-empty'>No approved photos yet!</div>";return;}
    photos.sort(function(a,b){return(b.ts||0)-(a.ts||0);});
    el.innerHTML="<div class='gallery-grid'>"+photos.slice(0,20).map(function(p){return"<div class='gal-item'><img src='"+p.url+"' loading='lazy' /><div class='gal-lbl'><div class='gal-name'>"+(p.animal||"")+" "+esc(p.name||"")+"</div></div></div>";}).join("")+"</div>";
  },{onlyOnce:false});
}

// DASHBOARD
function renderDashboard(){
  var el=document.getElementById("dashContent");if(!el)return;
  el.innerHTML="<div class='feed-empty'>Loading...</div>";
  Promise.all([get(ref(db,"users")),get(ref(db,"posts")),get(ref(db,"pollResponses")),get(ref(db,"hunt"))]).then(function(results){
    var usersSnap=results[0],postsSnap=results[1],pollsSnap=results[2],huntSnap=results[3];
    var users=[];if(usersSnap.exists())usersSnap.forEach(function(c){users.push(c.val());});
    var totalPosts=0;if(postsSnap.exists())postsSnap.forEach(function(f){f.forEach(function(){totalPosts++;});});
    var totalConns=0;users.forEach(function(u){totalConns+=Object.keys(u.connections||{}).length;});
    var totalHunt=0;if(huntSnap.exists())huntSnap.forEach(function(u){u.forEach(function(){totalHunt++;});});
    var players=users.filter(function(u){return u.score>0;}).sort(function(a,b){return(b.score||0)-(a.score||0);});
    var html="<div class='dash-stats-grid'>";
    html+="<div class='dash-stat-sm'><div class='dsv'>"+users.length+"</div><div class='dsl'>App Users</div></div>";
    html+="<div class='dash-stat-sm'><div class='dsv'>"+Math.round(totalConns/2)+"</div><div class='dsl'>Connections</div></div>";
    html+="<div class='dash-stat-sm'><div class='dsv'>"+totalPosts+"</div><div class='dsl'>Posts</div></div>";
    html+="<div class='dash-stat-sm'><div class='dsv'>"+totalHunt+"</div><div class='dsl'>Hunt Subs</div></div>";
    html+="</div>";
    if(players.length){
      html+="<div class='session-result'><div class='sr-title'>&#127942; Trivia Leaderboard</div>";
      players.slice(0,5).forEach(function(p,i){html+="<div style='display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid #f0ecf8;font-size:12px;'><span style='font-weight:700;color:var(--purple);min-width:20px;'>#"+(i+1)+"</span><span>"+(p.animal||"")+" "+esc(p.name||"")+"</span><span style='margin-left:auto;font-family:Barlow Condensed,sans-serif;font-size:16px;font-weight:700;color:var(--purple);'>"+(p.score||0)+"</span></div>";});
      html+="</div>";
    }
    if(pollsSnap.exists()){
      html+="<div class='sec-hdr' style='margin-top:4px;'>Session Feedback</div>";
      POLLS.forEach(function(poll){
        if(!pollsSnap.hasChild(poll.id))return;
        var responses=[];pollsSnap.child(poll.id).forEach(function(c){responses.push(c.val());});
        if(!responses.length)return;
        var rc=[0,0,0,0];responses.forEach(function(r){if(r.rating!==undefined)rc[r.rating]++;});
        var top=rc.indexOf(Math.max.apply(null,rc));
        var uc=[0,0,0];responses.forEach(function(r){if(r.usage!==undefined)uc[r.usage]++;});
        var takeaways=responses.filter(function(r){return r.takeaway;}).map(function(r){return r.takeaway;});
        html+="<div class='session-result'><div class='sr-title'>"+esc(poll.label)+" <span style='font-size:10px;color:#888;'>("+responses.length+" responses)</span></div>";
        html+="<div class='emoji-bar'>";
        RATING_OPTS.forEach(function(o,i){html+="<div class='emoji-stat"+(i===top?" top":"")+"'>"+RATING_EMOJIS[i]+" "+rc[i]+"</div>";});
        html+="</div><div class='emoji-bar'>";
        var isConf=poll.id==="conference";var uOpts=isConf?CONF_OPTS:USAGE_OPTS;var uEmojis=isConf?CONF_EMOJIS:USAGE_EMOJIS;
        uOpts.forEach(function(o,i){html+="<div class='emoji-stat'>"+uEmojis[i]+" "+uc[i]+"</div>";});
        html+="</div>";
        if(takeaways.length){takeaways.slice(0,3).forEach(function(t){html+="<div class='takeaway-item'>&#8220;"+esc(t)+"&#8221;</div>";});}
        html+="</div>";
      });
    }
    el.innerHTML=html;
  });
}

// PDF EXPORT
function exportPDF(){
  showToast("Generating PDF report...");
  Promise.all([get(ref(db,"users")),get(ref(db,"posts")),get(ref(db,"pollResponses")),get(ref(db,"hunt"))]).then(function(results){
    var usersSnap=results[0],postsSnap=results[1],pollsSnap=results[2],huntSnap=results[3];
    var users=[];if(usersSnap.exists())usersSnap.forEach(function(c){users.push(c.val());});
    var totalPosts=0;if(postsSnap.exists())postsSnap.forEach(function(f){f.forEach(function(){totalPosts++;});});
    var totalConns=0;users.forEach(function(u){totalConns+=Object.keys(u.connections||{}).length;});
    var totalHunt=0;if(huntSnap.exists())huntSnap.forEach(function(u){u.forEach(function(){totalHunt++;});});
    var players=users.filter(function(u){return u.score>0;}).sort(function(a,b){return(b.score||0)-(a.score||0);});
    var jspdf=window.jspdf;var doc=new jspdf.jsPDF({orientation:"portrait",unit:"mm",format:"a4"});
    var W=210,margin=18,y=0;
    function txt(t,x,yy,size,bold,color){doc.setFontSize(size||11);doc.setFont("helvetica",bold?"bold":"normal");doc.setTextColor(color?color[0]:30,color?color[1]:10,color?color[2]:48);doc.text(String(t),x,yy);}
    // COVER
    doc.setFillColor(45,19,80);doc.rect(0,0,W,297,"F");
    doc.setFillColor(232,130,10);doc.rect(0,100,W,6,"F");
    txt("KAHCC",W/2,55,48,true,[255,255,255]);
    doc.setFontSize(10);doc.setFont("helvetica","normal");doc.setTextColor(200,168,75);doc.text("Kansas Association of Health Care Communicators",W/2,64,{align:"center"});
    txt("INNOVATION SPRING CONFERENCE",W/2,80,22,true,[232,130,10]);
    doc.setFontSize(13);doc.setTextColor(255,255,255);doc.text("2026",W/2,89,{align:"center"});
    txt("POST-EVENT REPORT",W/2,115,16,true,[255,255,255]);
    doc.setFontSize(11);doc.setTextColor(200,168,75);doc.text("April 23-24, 2026  |  Rolling Hills Zoo, Salina, KS",W/2,128,{align:"center"});
    doc.setFontSize(9);doc.setTextColor(150,130,190);doc.text("Generated by the KAHCC Innovation Conference App",W/2,200,{align:"center"});
    // PAGE 2
    doc.addPage();
    doc.setFillColor(74,32,128);doc.rect(0,0,W,22,"F");
    txt("AT A GLANCE",margin,14,16,true,[255,255,255]);
    y=36;
    var stats=[[users.length,"App Users"],[Math.round(totalConns/2),"Connections"],[totalPosts,"Community Posts"],[totalHunt,"Hunt Submissions"]];
    var bw=(W-margin*2-12)/4;var bx=margin;
    stats.forEach(function(s){
      doc.setFillColor(248,245,255);doc.roundedRect(bx,y,bw,26,3,3,"F");
      doc.setFillColor(74,32,128);doc.rect(bx,y,bw,4,"F");
      doc.setFontSize(20);doc.setFont("helvetica","bold");doc.setTextColor(74,32,128);doc.text(String(s[0]),bx+bw/2,y+16,{align:"center"});
      doc.setFontSize(7.5);doc.setFont("helvetica","bold");doc.setTextColor(100,80,140);doc.text(s[1].toUpperCase(),bx+bw/2,y+22,{align:"center"});
      bx+=bw+4;
    });
    y=76;
    if(players.length){
      doc.setFillColor(74,32,128);doc.rect(margin,y,W-margin*2,8,"F");
      txt("TRIVIA TREK - FINAL LEADERBOARD",margin+3,y+5.5,10,true,[255,255,255]);
      y+=12;
      players.slice(0,10).forEach(function(p,i){
        doc.setFillColor(i%2===0?248:255,i%2===0?245:255,i%2===0?255:255);doc.rect(margin,y,W-margin*2,7,"F");
        var pos=i===0?"1st":i===1?"2nd":i===2?"3rd":(i+1)+"th";
        doc.setFontSize(9);doc.setFont("helvetica","bold");doc.setTextColor(74,32,128);doc.text(pos,margin+3,y+5);
        doc.setFont("helvetica","normal");doc.setTextColor(30,10,48);doc.text(p.name||"Attendee",margin+18,y+5);
        doc.setFont("helvetica","bold");doc.setTextColor(74,32,128);doc.text(String(p.score||0)+"pts",W-margin-3,y+5,{align:"right"});
        y+=7;
      });
    }
    // SESSION FEEDBACK PAGES
    if(pollsSnap.exists()){
      doc.addPage();
      doc.setFillColor(74,32,128);doc.rect(0,0,W,22,"F");
      txt("SESSION FEEDBACK",margin,14,16,true,[255,255,255]);
      y=32;
      POLLS.forEach(function(poll){
        if(!pollsSnap.hasChild(poll.id))return;
        var responses=[];pollsSnap.child(poll.id).forEach(function(c){responses.push(c.val());});
        if(!responses.length)return;
        if(y>245){doc.addPage();y=20;}
        doc.setFillColor(232,130,10);doc.rect(margin,y,W-margin*2,7,"F");
        txt(poll.label,margin+3,y+5,9,true,[255,255,255]);
        txt(responses.length+" responses",W-margin-3,y+5,8,false,[255,220,180]);
        y+=10;
        var rc=[0,0,0,0];responses.forEach(function(r){if(r.rating!==undefined)rc[r.rating]++;});
        var rColors=[[200,80,20],[74,32,128],[26,138,110],[192,40,40]];
        RATING_OPTS.forEach(function(lbl,i){
          var pct=responses.length?Math.round((rc[i]/responses.length)*100):0;
          doc.setFontSize(8);doc.setFont("helvetica","normal");doc.setTextColor(30,10,48);doc.text(RATING_EMOJIS[i].replace(/&#\d+;/g,"")+" "+lbl,margin,y+4);
          doc.setFillColor(230,224,244);doc.rect(margin+40,y,80,4,"F");
          doc.setFillColor(rColors[i][0],rColors[i][1],rColors[i][2]);if(pct>0)doc.rect(margin+40,y,Math.max(1,pct*0.8),4,"F");
          doc.setFontSize(8);doc.setFont("helvetica","bold");doc.setTextColor(74,32,128);doc.text(pct+"%",margin+124,y+4);
          y+=7;
        });
        var isConf=poll.id==="conference";var uOpts=isConf?CONF_OPTS:USAGE_OPTS;
        var uc=[0,0,0];responses.forEach(function(r){if(r.usage!==undefined)uc[r.usage]++;});
        doc.setFontSize(8);doc.setFont("helvetica","bold");doc.setTextColor(74,32,128);doc.text((isConf?"Recommend KAHCC?":"Use in 30 days?"),margin,y+4);y+=7;
        uOpts.forEach(function(lbl,i){var pct=responses.length?Math.round((uc[i]/responses.length)*100):0;doc.setFontSize(8);doc.setFont("helvetica","normal");doc.setTextColor(30,10,48);doc.text(lbl+": "+pct+"%",margin+(i*55),y+4);});y+=10;
        var takeaways=responses.filter(function(r){return r.takeaway;}).map(function(r){return r.takeaway;});
        if(takeaways.length){
          doc.setFontSize(8);doc.setFont("helvetica","bold");doc.setTextColor(74,32,128);doc.text("Key Takeaways:",margin,y+4);y+=7;
          takeaways.slice(0,3).forEach(function(t){
            if(y>270){doc.addPage();y=20;}
            doc.setFontSize(7.5);doc.setFont("helvetica","italic");doc.setTextColor(60,50,80);
            var lines=doc.splitTextToSize('"'+t+'"',W-margin*2-6);
            lines.forEach(function(l){if(y>270){doc.addPage();y=20;}doc.text(l,margin+3,y+4);y+=5;});
            y+=2;
          });
        }
        y+=5;
        if(y<255){doc.setDrawColor(220,210,240);doc.line(margin,y,W-margin,y);y+=5;}
      });
    }
    doc.save("KAHCC-Innovation-2026-Report.pdf");
    showToast("PDF downloaded!");
  });
}

// EXPOSE APP OBJECT
window.APP={
  signIn:function(){signInWithPopup(auth,provider).catch(function(){showToast("Sign in failed");});},
  signOut:function(){signOut(auth);},
  switchTab:switchTab,
  openModal:openModal,
  closeModal:closeModal,
  closeModalOutside:closeModalOutside,
  toggleAdm:toggleAdm,
  unlockAdmin:unlockAdmin,
  adminStartGame:adminStartGame,
  adminNextRound:adminNextRound,
  adminResetGame:adminResetGame,
  activatePoll:activatePoll,
  closePoll:closePoll,
  revealPoll:revealPoll,
  showPoll:showPoll,
  selPoll:selPoll,
  submitPoll:submitPoll,
  answerQ:answerQ,
  switchFeed:switchFeed,
  approveHunt: approveHunt,
  submitPost:submitPost,
  doReact:doReact,
  doReply:doReply,
  toggleCardEdit:toggleCardEdit,
  addCardField:addCardField,
  saveMyCard:saveMyCard,
  searchAttendees:searchAttendees,
  doConnect:doConnect,
  downloadConnections:downloadConnections,
  emailConnections:emailConnections,
  uploadHunt:uploadHunt,
  exportPDF:exportPDF,
  signIn: function(){
    signInWithPopup(auth, provider).catch(function(error){
      console.error(error); // Logs the full error to your browser console
      showToast("Sign in failed: " + error.message); // Shows you the actual reason on screen
    });
  },
  renderDashboard:renderDashboard
  
};
