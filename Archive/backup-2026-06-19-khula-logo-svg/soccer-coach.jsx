import { useState, useEffect, useRef } from "react";

// ── Formations ────────────────────────────────────────────────────────────────
const FORMATIONS = {
  "1-3-2-3": [
    { id:"st", label:"Striker",         left:"50%", top:"7%",  tx:"-50%" },
    { id:"al", label:"Left Wing",       left:"18%", top:"21%", tx:"-50%" },
    { id:"ar", label:"Right Wing",      left:"82%", top:"21%", tx:"-50%" },
    { id:"ml", label:"Left Mid",        left:"30%", top:"40%", tx:"-50%" },
    { id:"mr", label:"Right Mid",       left:"70%", top:"40%", tx:"-50%" },
    { id:"dl", label:"Left Def",        left:"18%", top:"67%", tx:"-50%" },
    { id:"dc", label:"Centre Def",      left:"50%", top:"67%", tx:"-50%" },
    { id:"dr", label:"Right Def",       left:"82%", top:"67%", tx:"-50%" },
    { id:"gk", label:"Goalkeeper",      left:"50%", top:"83%", tx:"-50%" },
  ],
  "1-3-3-2": [
    { id:"lf", label:"Left Fwd",        left:"30%", top:"10%", tx:"-50%" },
    { id:"rf", label:"Right Fwd",       left:"70%", top:"10%", tx:"-50%" },
    { id:"ml", label:"Left Mid",        left:"18%", top:"40%", tx:"-50%" },
    { id:"mc", label:"Centre Mid",      left:"50%", top:"40%", tx:"-50%" },
    { id:"mr", label:"Right Mid",       left:"82%", top:"40%", tx:"-50%" },
    { id:"dl", label:"Left Def",        left:"18%", top:"67%", tx:"-50%" },
    { id:"dc", label:"Centre Def",      left:"50%", top:"67%", tx:"-50%" },
    { id:"dr", label:"Right Def",       left:"82%", top:"67%", tx:"-50%" },
    { id:"gk", label:"Goalkeeper",      left:"50%", top:"83%", tx:"-50%" },
  ],
  "1-2-3-3": [
    { id:"st", label:"Striker",         left:"50%", top:"7%",  tx:"-50%" },
    { id:"al", label:"Left Wing",       left:"18%", top:"21%", tx:"-50%" },
    { id:"ar", label:"Right Wing",      left:"82%", top:"21%", tx:"-50%" },
    { id:"ml", label:"Left Mid",        left:"18%", top:"48%", tx:"-50%" },
    { id:"mc", label:"Centre Mid",      left:"50%", top:"48%", tx:"-50%" },
    { id:"mr", label:"Right Mid",       left:"82%", top:"48%", tx:"-50%" },
    { id:"dl", label:"Left Def",        left:"30%", top:"72%", tx:"-50%" },
    { id:"dr", label:"Right Def",       left:"70%", top:"72%", tx:"-50%" },
    { id:"gk", label:"Goalkeeper",      left:"50%", top:"83%", tx:"-50%" },
  ],
};
const DEFAULT_FORMATION = "1-3-2-3";
const POSITIONS   = FORMATIONS[DEFAULT_FORMATION];
// All positions across all formations — used in squad position dropdowns
const ALL_POSITIONS = [
  {id:"gk", label:"Goalkeeper"},
  {id:"dl", label:"Left Def"},  {id:"dc", label:"Centre Def"}, {id:"dr", label:"Right Def"},
  {id:"ml", label:"Left Mid"},  {id:"mc", label:"Centre Mid"}, {id:"mr", label:"Right Mid"},
  {id:"al", label:"Left Wing"}, {id:"ar", label:"Right Wing"},
  {id:"lf", label:"Left Fwd"},  {id:"rf", label:"Right Fwd"},  {id:"st", label:"Striker"},
];
const PAIR_COLORS = ["#f59e0b", "#a855f7", "#06b6d4"];

function getPositions(formation) { return FORMATIONS[formation] || FORMATIONS[DEFAULT_FORMATION]; }
function getPosIds(positions)    { return positions.map(p => p.id); }
function getPosLabel(positions)  { return Object.fromEntries(positions.map(p => [p.id, p.label])); }
function getPeriodMins(cfg)      { return (cfg?.halfMins || 24) / (cfg?.numPeriods || 3); }

// ── Storage ───────────────────────────────────────────────────────────────────
const SQUAD_KEY    = "soccerCoach_squad";
const CONFIG_KEY   = "soccerCoach_config";
const GAMES_KEY    = "soccerCoach_games";
const SETTINGS_KEY = "soccerCoach_settings";

function loadSquad()    { try { const v=JSON.parse(localStorage.getItem(SQUAD_KEY)); if(!Array.isArray(v))return[]; return v.map(x=>typeof x==="string"?{name:x,pos:""}:x); } catch{return[];} }
function saveSquad(l)   { try{localStorage.setItem(SQUAD_KEY,JSON.stringify(l));}catch{} }
function loadConfig()   { try{return JSON.parse(localStorage.getItem(CONFIG_KEY))||{halfMins:24,numPeriods:3,formation:DEFAULT_FORMATION};}catch{return{halfMins:24,numPeriods:3,formation:DEFAULT_FORMATION};} }
function saveConfig(c)  { try{localStorage.setItem(CONFIG_KEY,JSON.stringify(c));}catch{} }
function loadGames()    { try{return JSON.parse(localStorage.getItem(GAMES_KEY))||[];}catch{return[];} }
function saveGames(g)   { try{localStorage.setItem(GAMES_KEY,JSON.stringify(g));}catch{} }
function loadSettings() { try{return JSON.parse(localStorage.getItem(SETTINGS_KEY))||{teamName:"",coachName:"",managerName:""};}catch{return{teamName:"",coachName:"",managerName:""};} }
function saveSettings(s){ try{localStorage.setItem(SETTINGS_KEY,JSON.stringify(s));}catch{} }

const FX_SCORES_KEY   = "soccerCoach_fixtureScores";
const TEAM_NOTES_KEY  = "soccerCoach_teamNotes";
function fixtureKey(f){ return f.round+'|||'+f.home+'|||'+f.away; }
function loadFxScores()   { try{return JSON.parse(localStorage.getItem(FX_SCORES_KEY))||{};}catch{return{};} }
function saveFxScores(s)  { try{localStorage.setItem(FX_SCORES_KEY,JSON.stringify(s));}catch{} }
function loadTeamNotes()  { try{return JSON.parse(localStorage.getItem(TEAM_NOTES_KEY))||{};}catch{return{};} }
function saveTeamNotes(n) { try{localStorage.setItem(TEAM_NOTES_KEY,JSON.stringify(n));}catch{} }

const TEAM_NICKNAMES_KEY = "soccerCoach_teamNicknames";
function loadNicknames()  { try{return JSON.parse(localStorage.getItem(TEAM_NICKNAMES_KEY))||{};}catch{return{};} }
function saveNicknames(n) { try{localStorage.setItem(TEAM_NICKNAMES_KEY,JSON.stringify(n));}catch{} }

// Responsive device detection
const DEVICE = (()=>{
  const w = window.innerWidth;
  const ua = navigator.userAgent||'';
  const isIpad = /ipad/i.test(ua)||(w>=768&&/mac/i.test(ua)&&navigator.maxTouchPoints>1);
  return { isIpad, cardMax: isIpad ? 660 : 420 };
})();

const FIXTURES_KEY = 'soccerCoach_fixtures';
function loadFixtures() {
  try { const v=JSON.parse(localStorage.getItem(FIXTURES_KEY)); if(Array.isArray(v)&&v.length>0) return v; } catch{}
  return null; // falls back to HARDCODED_FIXTURES
}
function saveFixtures(arr) { try{localStorage.setItem(FIXTURES_KEY,JSON.stringify(arr));}catch{} }
function isUpcoming(f) {
  const sc = loadFxScores()[fixtureKey(f)];
  if (sc && !sc.postponed && sc.home !== undefined) return false; // has result
  if (sc && sc.postponed) return false; // postponed
  // No score — upcoming only if date hasn't passed
  const d = parseFixtureDate(f.date);
  return d >= new Date(new Date().setHours(0,0,0,0));
}

// Suggest a short display nickname from a full team name
function suggestNickname(name) {
  const dropSet = new Set(['U11','Girls','Joey','Central','Under','11']);
  const words = name.split(' ').filter(w => !dropSet.has(w));
  if (words.length <= 2) return words.join(' ');
  if (words[0] === 'The') return 'The ' + words[1];
  if (words[0] === 'UQFC') {
    const rest = words.slice(1).filter(w => w !== 'FC');
    return 'UQFC ' + (rest[0] || words[1]);
  }
  const fcIdx = words.indexOf('FC');
  if (fcIdx > 0) {
    const before = words.slice(0, fcIdx).join(' ');
    const after  = words.slice(fcIdx + 1);
    return after.length ? before + ' ' + after[after.length - 1] : before;
  }
  return words[0] + ' ' + words[words.length - 1];
}

// Return the display name for a team (nickname if set, else full name)
function teamDisplay(fullName, nicknames) {
  return (nicknames && nicknames[fullName]) || fullName;
}

// Single source of truth for a game's score.
// Prefers fxScores (fixture-linked & manually-overridable) over the raw
// scoreUs/scoreThem saved in the game object.
function getScore(game, fxScores) {
  if (game.linkedFixtureKey) {
    const sc = (fxScores || loadFxScores())[game.linkedFixtureKey];
    if (sc != null) {
      return game.fixtureIsHome
        ? { us: sc.home, them: sc.away }
        : { us: sc.away, them: sc.home };
    }
  }
  return { us: game.scoreUs || 0, them: game.scoreThem || 0 };
}

function cloneSlots(s) { return JSON.parse(JSON.stringify(s)); }
function fmtTime(secs) { return String(Math.floor(secs/60)).padStart(2,"0")+":"+String(secs%60).padStart(2,"0"); }

function computeSwapPairs(prevSlots, curSlots, posIds) {
  const prevField = new Set(posIds.map(id=>prevSlots[id]).filter(Boolean));
  const curField  = new Set(posIds.map(id=>curSlots[id]).filter(Boolean));
  const wentOff = [...prevField].filter(n=>!curField.has(n));
  const cameOn  = [...curField].filter(n=>!prevField.has(n));
  const pairs = {};
  const n = Math.min(wentOff.length, cameOn.length, PAIR_COLORS.length);
  for(let i=0;i<n;i++){pairs[wentOff[i]]=i;pairs[cameOn[i]]=i;}
  return pairs;
}

// ── Player stats ──────────────────────────────────────────────────────────────
function computePlayerStats(games) {
  const map = {};
  const ensure = name => { if(!map[name]) map[name]={goals:0,gameIds:new Set(),mins:0,gkPeriods:0,potm:0}; };
  const fxScores = loadFxScores();
  games.forEach(game => {
    const pm = getPeriodMins(game.config);
    if(game.halves) {
      game.halves.forEach(half => half.forEach(period => {
        if(!period.slots) return;
        const pos = getPositions(game.config?.formation);
        getPosIds(pos).map(id=>period.slots[id]).filter(Boolean).forEach(name => {
          ensure(name); map[name].gameIds.add(game.id); map[name].mins+=pm;
        });
        // Track GK appearances
        const gkName = period.slots["gk"];
        if(gkName){ ensure(gkName); map[gkName].gkPeriods++; }
      }));
    }
    // Cap individual goal entries at the actual verified score so stats stay consistent
    const actualScore = getScore(game, fxScores);
    const loggedGoals = (game.goals||[]).filter(g=>g.team==="us");
    const cap = actualScore.us > 0 ? Math.min(loggedGoals.length, actualScore.us) : loggedGoals.length;
    loggedGoals.slice(0, cap).forEach(g => {
      ensure(g.scorer); map[g.scorer].goals++;
      if(!game.halves) map[g.scorer].gameIds.add(game.id);
    });
    // Track MVP
    const potmArr = Array.isArray(game.potm)?game.potm:(game.potm?[game.potm]:[]);
    potmArr.forEach(name=>{ ensure(name); map[name].potm++; });
  });
  return Object.entries(map).map(([name,s])=>({name,goals:s.goals,apps:s.gameIds.size,mins:Math.round(s.mins),gkPeriods:s.gkPeriods,potm:s.potm})).sort((a,b)=>b.apps-a.apps||b.goals-a.goals);
}

// ── Single source of truth for all results involving my team ─────────────────
// Priority: fixtureScores (entered via Fixtures screen) > game object scores
// Returns array of { id, type, round, dateStr, opponent, isHome, us, them, game }
function getAllResults() {
  const myTeam   = localStorage.getItem('soccerCoach_fixtureTeam') || '';
  const fxScores = loadFxScores();
  const games    = loadGames();
  const results  = [];
  const usedGameIds = new Set();

  // 1. Fixture-based results — fixtureScores is the truth
  FIXTURES.forEach(f => {
    if (!myTeam || (f.home !== myTeam && f.away !== myTeam)) return;
    const sc = fxScores[fixtureKey(f)];
    if (!sc || sc.postponed) return;           // no score recorded yet
    const isHome = f.home === myTeam;
    const us     = isHome ? sc.home : sc.away;
    const them   = isHome ? sc.away : sc.home;
    // Attach full game object if one exists (for lineup/events detail)
    const game   = games.find(g => g.linkedFixtureKey === fixtureKey(f)) || null;
    if (game) usedGameIds.add(game.id);
    results.push({ id: fixtureKey(f), type:'fixture', round:f.round, dateStr:f.date,
                   opponent: isHome ? f.away : f.home, isHome, us, them, game });
  });

  // 2. Standalone games — played through the app but not linked to any fixture
  games.forEach(g => {
    if (g.linkedFixtureKey || usedGameIds.has(g.id)) return;
    const sc = getScore(g, fxScores);
    results.push({ id: g.id, type:'standalone', round:null,
                   dateStr: new Date(g.date).toLocaleDateString('en-AU'),
                   opponent: g.opponent||'Opposition', isHome:null, us:sc.us, them:sc.them, game:g });
  });

  return results;
}

// ── Season stats — now driven by getAllResults so fixtures & game log agree ──
function computeSeasonStats() {
  const results = getAllResults();
  const played  = results.length;
  const wins    = results.filter(r => r.us > r.them).length;
  const draws   = results.filter(r => r.us === r.them).length;
  const losses  = results.filter(r => r.us < r.them).length;
  const gf      = results.reduce((s,r) => s + r.us, 0);
  const ga      = results.reduce((s,r) => s + r.them, 0);
  return { played, wins, draws, losses, gf, ga, gd: gf-ga };
}

// ── Alarm ─────────────────────────────────────────────────────────────────────
let audioCtx = null;
function getCtx(){ if(!audioCtx){try{audioCtx=new(window.AudioContext||window.webkitAudioContext)();}catch(e){}}return audioCtx; }
function unlockAudio(){ const ctx=getCtx();if(!ctx)return;ctx.resume&&ctx.resume();try{const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);g.gain.value=0.0001;o.start();o.stop(ctx.currentTime+0.03);}catch(e){} }
function playAlarm(){
  const ctx=getCtx();if(!ctx)return;
  const fire=()=>{
    const t0=ctx.currentTime+0.02;
    [0,0.35,0.7,1.05,1.4,1.75].forEach((s,i)=>{
      const o=ctx.createOscillator(),g=ctx.createGain();o.connect(g);g.connect(ctx.destination);
      o.frequency.setValueAtTime(i%2?1175:880,t0+s);o.type="square";
      g.gain.setValueAtTime(0.0001,t0+s);g.gain.exponentialRampToValueAtTime(0.9,t0+s+0.02);g.gain.exponentialRampToValueAtTime(0.0001,t0+s+0.28);
      o.start(t0+s);o.stop(t0+s+0.33);
    });
  };
  if(ctx.state==="suspended")ctx.resume().then(fire).catch(fire);else fire();
  if(navigator.vibrate)navigator.vibrate([300,120,300,120,300,120,500]);
}

// ── Reports ───────────────────────────────────────────────────────────────────
function buildLocalReport(game) {
  const {opponent,goals,matchEvents,date,oppNotes}=game;
  const us=goals.filter(g=>g.team==="us");
  const them=goals.filter(g=>g.team==="them").length;
  const result=us.length>them?"a win":us.length<them?"a loss":"a draw";
  const lines=[];
  lines.push(`Match Report — vs ${opponent||"Opposition"}`);
  if(date)lines.push(new Date(date).toLocaleDateString(undefined,{weekday:"long",year:"numeric",month:"long",day:"numeric"}));
  lines.push("");lines.push(`Final score: ${us.length} – ${them} (${result}).`);lines.push("");
  if(us.length){
    lines.push("Our goals:");
    us.forEach(g=>lines.push(`  • ${g.scorer}${g.position?` (${g.position})`:""} — H${g.half} ${g.timeStr}`));
    const tally={};us.forEach(g=>{tally[g.scorer]=(tally[g.scorer]||0)+1;});
    lines.push("");lines.push(`Scorers: ${Object.entries(tally).map(([n,c])=>c>1?`${n} (${c})`:n).join(", ")}.`);
  } else {lines.push("No goals scored by our team this match.");}
  lines.push("");
  const evts=matchEvents||[]; if(evts.length){lines.push("Match events:");evts.forEach(e=>{const rule=(typeof MATCH_EVENT_RULES!=="undefined"?MATCH_EVENT_RULES:[]).find(r=>r.type===e.type)||{icon:"📝",label:e.type};lines.push(`  ${rule.icon} ${e.minute}' ${rule.label}${e.team?` (${e.team==="us"?"Us":opponent||"Them"})`:``}${e.notes?` — ${e.notes}`:``}`);});}
  if(oppNotes&&oppNotes.trim()){lines.push("");lines.push("Opposition notes:");lines.push(oppNotes.trim());}
  return lines.join("\n");
}
async function generateAIReport(game) {
  const us=game.goals.filter(g=>g.team==="us").length;
  const them=game.goals.filter(g=>g.team==="them").length;
  const goalSummary=game.goals.map(g=>`H${g.half} ${g.timeStr} — ${g.team==="us"?`${g.scorer}${g.position?` ('${g.position}')`:""} (our team)`:"Opponent"}`).join("\n")||"No goals logged";
  const evts2=(game.matchEvents||[]); const noteSummary=evts2.length?evts2.map(e=>`${e.minute}' ${e.type}${e.team?` (${e.team==="us"?"Us":game.opponent||"Them"})`:``}${e.notes?` — ${e.notes}`:``}`).join("\n"):"No match events recorded";
  const potmArr=Array.isArray(game.potm)?game.potm:(game.potm?[game.potm]:[]);
  const potmLine=potmArr.length?`\nMost Valuable Player (MVP): ${potmArr.join(", ")}`:"";
  const oppLine=game.oppNotes&&game.oppNotes.trim()?`\n\nOpposition notes:\n${game.oppNotes.trim()}`:"";
  const prompt=`You are writing a match report for a U11 girls soccer match.\n\nOpponent: ${game.opponent||"Opposition"}\nFormation: ${game.config?.formation||"1-3-2-3"}\nFinal score: Us ${us} – Them ${them}${potmLine}\n\nGoals:\n${goalSummary}\n\nCoach's notes:\n${noteSummary}${oppLine}\n\nWrite a warm, encouraging match report (3-5 short paragraphs): result, key moments with goal scorers and their positions, observations from notes, positive takeaways and one or two development areas, and a short motivational closing. Age-appropriate and supportive. Refer to players by name where known.`;
  const resp=await fetch("https://api.anthropic.com/v1/messages",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-6",max_tokens:1000,messages:[{role:"user",content:prompt}]})});
  const data=await resp.json();const text=data?.content?.[0]?.text;if(!text)throw new Error("no text");return text;
}

// ════════════════════════════════════════════════════════════════════════════════
//  FIXTURES DATA
// ════════════════════════════════════════════════════════════════════════════════
function _fx(round, items){ return items.map(([date,time,home,away,venue,s])=>({round,date,time,home,away,venue,s})); }
const HARDCODED_FIXTURES = [
  ..._fx("Round 1",[
    ["2 May","9:30am","Bardon Latrobe U11 Girls Stars","Toowong FC U11 White","Bowman Park - Field 3","r"],
    ["2 May","11:00am","UQFC U11 Girls Rubies Joey Central","Brisbane Knights FC U11 Girls Joeys","Cubberla Creek Reserve - Field 2A","r"],
    ["2 May","11:00am","Toowong FC U11 Rose","Bardon Latrobe U11 Girls Bananas","Dunmore Park - Field 1A","r"],
    ["2 May","11:30am","Springfield United U11 Emeralds Girls","UQFC U11 Girls Emeralds Joey Central","Springfield Central Sports Complex - Field 1D","r"],
    ["2 May","11:30am","Bardon Latrobe U11 Girls Bandits","UQFC U11 Girls Sapphires Joey Central","Bowman Park - Field 3","r"],
    ["2 May","1:00pm","UQFC U11 Girls Diamonds Joey Central","Under 11 Koalas","Cubberla Creek Reserve - Field 2C","r"],
    ["2 May","3:00pm","The Gap Under 11 Canberra","Mitchelton FC U11 Girls Glitter Dragons","Hilder Road State School - Field 1","r"],
  ]),
  ..._fx("Round 2",[
    ["9 May","10:00am","UQFC U11 Girls Emeralds Joey Central","Bardon Latrobe U11 Girls Bandits","Cubberla Creek Reserve - Field 2C","r"],
    ["9 May","10:00am","Brisbane Knights FC U11 Girls Joeys","Springfield United U11 Emeralds Girls","Croatian Community Centre QLD - Field 3A","r"],
    ["9 May","10:00am","Under 11 Koalas","UQFC U11 Girls Rubies Joey Central","Sutton Park - Field 4","r"],
    ["9 May","11:00am","UQFC U11 Girls Sapphires Joey Central","The Gap Under 11 Canberra","Cubberla Creek Reserve - Field 2B","r"],
    ["9 May","11:00am","Toowong FC U11 White","Toowong FC U11 Rose","Dunmore Park - Field 1A","r"],
    ["9 May","11:30am","Mitchelton FC U11 Girls Glitter Dragons","Bardon Latrobe U11 Girls Stars","Teralba Park - Field 2B","r"],
    ["9 May","11:30am","Bardon Latrobe U11 Girls Bananas","UQFC U11 Girls Diamonds Joey Central","Bowman Park - Field 4","r"],
  ]),
  ..._fx("Round 3",[
    ["16 May","10:00am","Brisbane Knights FC U11 Girls Joeys","Under 11 Koalas","Croatian Community Centre QLD - Field 3A","r"],
    ["16 May","10:00am","Toowong FC U11 Rose","Mitchelton FC U11 Girls Glitter Dragons","Dunmore Park - Field 1A","r"],
    ["16 May","11:00am","UQFC U11 Girls Rubies Joey Central","Bardon Latrobe U11 Girls Bananas","Cubberla Creek Reserve - Field 2B","r"],
    ["16 May","1:30pm","Bardon Latrobe U11 Girls Stars","UQFC U11 Girls Sapphires Joey Central","Bowman Park - Field 3","r"],
    ["16 May","2:00pm","UQFC U11 Girls Diamonds Joey Central","Toowong FC U11 White","Cubberla Creek Reserve - Field 2B","r"],
    ["16 May","2:00pm","The Gap Under 11 Canberra","UQFC U11 Girls Emeralds Joey Central","Hilder Road State School - Field 1","r"],
    ["16 May","2:30pm","Bardon Latrobe U11 Girls Bandits","Springfield United U11 Emeralds Girls","Bowman Park - Field 4","r"],
  ]),
  ..._fx("Round 4",[
    ["23 May","8:30am","Bardon Latrobe U11 Girls Bananas","Under 11 Koalas","Bowman Park - Field 3","r"],
    ["23 May","8:30am","Bardon Latrobe U11 Girls Bandits","Brisbane Knights FC U11 Girls Joeys","Bowman Park - Field 4","r"],
    ["23 May","10:30am","Mitchelton FC U11 Girls Glitter Dragons","UQFC U11 Girls Diamonds Joey Central","Teralba Park - Field 2A","r"],
    ["23 May","11:00am","UQFC U11 Girls Emeralds Joey Central","Bardon Latrobe U11 Girls Stars","Cubberla Creek Reserve - Field 2B","r"],
    ["23 May","11:00am","Toowong FC U11 White","UQFC U11 Girls Rubies Joey Central","Dunmore Park - Field 1B","r"],
    ["23 May","11:30am","Springfield United U11 Emeralds Girls","The Gap Under 11 Canberra","Springfield Central Sports Complex - Field 1E","r"],
    ["23 May","1:00pm","UQFC U11 Girls Sapphires Joey Central","Toowong FC U11 Rose","Cubberla Creek Reserve - Field 2B","r"],
  ]),
  ..._fx("Round 5",[
    ["30 May","9:00am","Under 11 Koalas","Toowong FC U11 White","Sutton Park - Field 4","r"],
    ["30 May","9:30am","Bardon Latrobe U11 Girls Stars","Springfield United U11 Emeralds Girls","Bowman Park - Field 3","r"],
    ["30 May","10:00am","UQFC U11 Girls Diamonds Joey Central","UQFC U11 Girls Sapphires Joey Central","Cubberla Creek Reserve - Field 2A","r"],
    ["30 May","10:00am","Brisbane Knights FC U11 Girls Joeys","Bardon Latrobe U11 Girls Bananas","Croatian Community Centre QLD - Field 3A","r"],
    ["30 May","11:00am","Toowong FC U11 Rose","UQFC U11 Girls Emeralds Joey Central","Dunmore Park - Field 1B","r"],
    ["30 May","1:00pm","The Gap Under 11 Canberra","Bardon Latrobe U11 Girls Bandits","Walton Bridge Reserve - Field 3","r"],
    ["30 May","3:00pm","UQFC U11 Girls Rubies Joey Central","Mitchelton FC U11 Girls Glitter Dragons","Cubberla Creek Reserve - Field 2B","r"],
  ]),
  ..._fx("Round 6",[
    ["6 Jun","9:30am","Bardon Latrobe U11 Girls Bandits","Bardon Latrobe U11 Girls Stars","Bowman Park - Field 3","r"],
    ["6 Jun","10:00am","Toowong FC U11 White","Bardon Latrobe U11 Girls Bananas","Dunmore Park - Field 1B","r"],
    ["6 Jun","10:30am","Springfield United U11 Emeralds Girls","Toowong FC U11 Rose","Springfield Central Sports Complex - Field 1D","r"],
    ["6 Jun","11:30am","Mitchelton FC U11 Girls Glitter Dragons","Under 11 Koalas","Teralba Park - Field 2B","r"],
    ["6 Jun","12:00pm","UQFC U11 Girls Emeralds Joey Central","UQFC U11 Girls Diamonds Joey Central","Cubberla Creek Reserve - Field 2B","r"],
    ["6 Jun","1:00pm","UQFC U11 Girls Sapphires Joey Central","UQFC U11 Girls Rubies Joey Central","Cubberla Creek Reserve - Field 2C","r"],
    ["6 Jun","3:00pm","The Gap Under 11 Canberra","Brisbane Knights FC U11 Girls Joeys","Walton Bridge Reserve - Field 2","r"],
  ]),
  ..._fx("Round 7",[
    ["13 Jun","10:00am","Brisbane Knights FC U11 Girls Joeys","Toowong FC U11 White","Croatian Community Centre QLD - Field 3A","p"],
    ["13 Jun","10:00am","Toowong FC U11 Rose","Bardon Latrobe U11 Girls Bandits","Dunmore Park - Field 1A","r"],
    ["13 Jun","11:00am","UQFC U11 Girls Rubies Joey Central","UQFC U11 Girls Emeralds Joey Central","Cubberla Creek Reserve - Field 2B","r"],
    ["13 Jun","11:00am","Under 11 Koalas","UQFC U11 Girls Sapphires Joey Central","Sutton Park - Field 4","r"],
    ["13 Jun","12:00pm","UQFC U11 Girls Diamonds Joey Central","Springfield United U11 Emeralds Girls","Cubberla Creek Reserve - Field 2A","r"],
    ["13 Jun","1:30pm","Bardon Latrobe U11 Girls Stars","The Gap Under 11 Canberra","Bowman Park - Field 3","p"],
    ["13 Jun","1:30pm","Bardon Latrobe U11 Girls Bananas","Mitchelton FC U11 Girls Glitter Dragons","Bowman Park - Field 4","p"],
  ]),
  ..._fx("Round 8",[
    ["20 Jun","9:30am","Bardon Latrobe U11 Girls Bandits","UQFC U11 Girls Diamonds Joey Central","Bowman Park - Field 3","u"],
    ["20 Jun","9:30am","Bardon Latrobe U11 Girls Stars","Brisbane Knights FC U11 Girls Joeys","Bowman Park - Field 4","u"],
    ["20 Jun","10:00am","UQFC U11 Girls Emeralds Joey Central","Under 11 Koalas","Cubberla Creek Reserve - Field 2B","u"],
    ["20 Jun","11:30am","Springfield United U11 Emeralds Girls","UQFC U11 Girls Rubies Joey Central","Springfield Central Sports Complex - Field 1G","u"],
    ["20 Jun","12:00pm","UQFC U11 Girls Sapphires Joey Central","Bardon Latrobe U11 Girls Bananas","Cubberla Creek Reserve - Field 2C","u"],
    ["20 Jun","12:30pm","Mitchelton FC U11 Girls Glitter Dragons","Toowong FC U11 White","Teralba Park - Field 11","u"],
    ["20 Jun","2:00pm","The Gap Under 11 Canberra","Toowong FC U11 Rose","Hilder Road State School - Field 2","u"],
  ]),
  ..._fx("Round 9",[
    ["27 Jun","8:30am","Bardon Latrobe U11 Girls Bananas","UQFC U11 Girls Emeralds Joey Central","Bowman Park - Field 3","u"],
    ["27 Jun","9:00am","Under 11 Koalas","Springfield United U11 Emeralds Girls","Sutton Park - Field 3","u"],
    ["27 Jun","10:00am","Brisbane Knights FC U11 Girls Joeys","Mitchelton FC U11 Girls Glitter Dragons","Croatian Community Centre QLD - Field 3A","u"],
    ["27 Jun","10:00am","UQFC U11 Girls Rubies Joey Central","Bardon Latrobe U11 Girls Bandits","Cubberla Creek Reserve - Field 2A","u"],
    ["27 Jun","10:00am","Toowong FC U11 Rose","Bardon Latrobe U11 Girls Stars","Dunmore Park - Field 1A","u"],
    ["27 Jun","11:00am","Toowong FC U11 White","UQFC U11 Girls Sapphires Joey Central","Dunmore Park - Field 1B","u"],
    ["27 Jun","12:00pm","UQFC U11 Girls Diamonds Joey Central","The Gap Under 11 Canberra","Cubberla Creek Reserve - Field 2C","u"],
  ]),
  ..._fx("Round 10",[
    ["18 Jul","10:00am","UQFC U11 Girls Emeralds Joey Central","Toowong FC U11 White","Cubberla Creek Reserve - Field 2B","u"],
    ["18 Jul","10:30am","Springfield United U11 Emeralds Girls","Bardon Latrobe U11 Girls Bananas","Springfield Central Sports Complex - Field 1C","u"],
    ["18 Jul","10:30am","Bardon Latrobe U11 Girls Stars","UQFC U11 Girls Diamonds Joey Central","Bowman Park - Field 3","u"],
    ["18 Jul","11:00am","Toowong FC U11 Rose","Brisbane Knights FC U11 Girls Joeys","Dunmore Park - Field 1B","u"],
    ["18 Jul","11:30am","Bardon Latrobe U11 Girls Bandits","Under 11 Koalas","Bowman Park - Field 4","u"],
    ["18 Jul","12:00pm","UQFC U11 Girls Sapphires Joey Central","Mitchelton FC U11 Girls Glitter Dragons","Cubberla Creek Reserve - Field 2B","u"],
    ["18 Jul","2:00pm","The Gap Under 11 Canberra","UQFC U11 Girls Rubies Joey Central","Hilder Road State School - Field 1","u"],
  ]),
  ..._fx("Round 11",[
    ["25 Jul","9:30am","Bardon Latrobe U11 Girls Bananas","Bardon Latrobe U11 Girls Bandits","Bowman Park - Field 3","u"],
    ["25 Jul","10:00am","Brisbane Knights FC U11 Girls Joeys","UQFC U11 Girls Sapphires Joey Central","Croatian Community Centre QLD - Field 3A","u"],
    ["25 Jul","10:00am","Toowong FC U11 White","Springfield United U11 Emeralds Girls","Dunmore Park - Field 1B","u"],
    ["25 Jul","10:30am","Mitchelton FC U11 Girls Glitter Dragons","UQFC U11 Girls Emeralds Joey Central","Teralba Park - Field 10","u"],
    ["25 Jul","11:00am","Under 11 Koalas","The Gap Under 11 Canberra","Sutton Park - Field 4","u"],
    ["25 Jul","1:00pm","UQFC U11 Girls Diamonds Joey Central","Toowong FC U11 Rose","Cubberla Creek Reserve - Field 2B","u"],
    ["25 Jul","1:00pm","UQFC U11 Girls Rubies Joey Central","Bardon Latrobe U11 Girls Stars","Cubberla Creek Reserve - Field 2A","u"],
  ]),
  ..._fx("Round 12",[
    ["1 Aug","8:30am","Bardon Latrobe U11 Girls Bandits","Toowong FC U11 White","Bowman Park - Field 3","u"],
    ["1 Aug","8:30am","Bardon Latrobe U11 Girls Stars","Under 11 Koalas","Bowman Park - Field 4","u"],
    ["1 Aug","10:00am","Toowong FC U11 Rose","UQFC U11 Girls Rubies Joey Central","Dunmore Park - Field 1A","u"],
    ["1 Aug","11:00am","UQFC U11 Girls Diamonds Joey Central","Brisbane Knights FC U11 Girls Joeys","Cubberla Creek Reserve - Field 2A","u"],
    ["1 Aug","11:30am","Springfield United U11 Emeralds Girls","Mitchelton FC U11 Girls Glitter Dragons","Springfield Central Sports Complex - Field 1G","u"],
    ["1 Aug","12:00pm","UQFC U11 Girls Emeralds Joey Central","UQFC U11 Girls Sapphires Joey Central","Cubberla Creek Reserve - Field 2C","u"],
    ["1 Aug","2:00pm","The Gap Under 11 Canberra","Bardon Latrobe U11 Girls Bananas","Hilder Road State School - Field 2","u"],
  ]),
  ..._fx("Round 13",[
    ["8 Aug","10:30am","Mitchelton FC U11 Girls Glitter Dragons","Bardon Latrobe U11 Girls Bandits","Teralba Park - Field 11","u"],
    ["8 Aug","11:00am","Toowong FC U11 White","The Gap Under 11 Canberra","Dunmore Park - Field 1B","u"],
    ["8 Aug","11:00am","Under 11 Koalas","Toowong FC U11 Rose","Sutton Park - Field 4","u"],
    ["8 Aug","12:00pm","UQFC U11 Girls Sapphires Joey Central","Springfield United U11 Emeralds Girls","Cubberla Creek Reserve - Field 2A","u"],
    ["8 Aug","2:00pm","UQFC U11 Girls Rubies Joey Central","UQFC U11 Girls Diamonds Joey Central","Cubberla Creek Reserve - Field 2A","u"],
    ["8 Aug","2:30pm","Bardon Latrobe U11 Girls Bananas","Bardon Latrobe U11 Girls Stars","Bowman Park - Field 3","u"],
    ["8 Aug","3:00pm","UQFC U11 Girls Emeralds Joey Central","Brisbane Knights FC U11 Girls Joeys","Cubberla Creek Reserve - Field 2A","u"],
  ]),
  ..._fx("Round 14",[
    ["15 Aug","10:00am","Brisbane Knights FC U11 Girls Joeys","UQFC U11 Girls Rubies Joey Central","Croatian Community Centre QLD - Field 3A","u"],
    ["15 Aug","10:00am","UQFC U11 Girls Sapphires Joey Central","Bardon Latrobe U11 Girls Bandits","Cubberla Creek Reserve - Field 2B","u"],
    ["15 Aug","10:00am","Toowong FC U11 White","Bardon Latrobe U11 Girls Stars","Dunmore Park - Field 1A","u"],
    ["15 Aug","10:00am","Under 11 Koalas","UQFC U11 Girls Diamonds Joey Central","Sutton Park - Field 3","u"],
    ["15 Aug","10:30am","Bardon Latrobe U11 Girls Bananas","Toowong FC U11 Rose","Bowman Park - Field 4","u"],
    ["15 Aug","11:00am","UQFC U11 Girls Emeralds Joey Central","Springfield United U11 Emeralds Girls","Cubberla Creek Reserve - Field 2A","u"],
    ["15 Aug","11:30am","Mitchelton FC U11 Girls Glitter Dragons","The Gap Under 11 Canberra","Teralba Park - Field 2B","u"],
  ]),
  ..._fx("Round 15",[
    ["22 Aug","10:00am","UQFC U11 Girls Rubies Joey Central","Under 11 Koalas","Cubberla Creek Reserve - Field 2B","u"],
    ["22 Aug","10:30am","Bardon Latrobe U11 Girls Bandits","UQFC U11 Girls Emeralds Joey Central","Bowman Park - Field 4","u"],
    ["22 Aug","11:00am","Toowong FC U11 Rose","Toowong FC U11 White","Dunmore Park - Field 1B","u"],
    ["22 Aug","12:30pm","Springfield United U11 Emeralds Girls","Brisbane Knights FC U11 Girls Joeys","Springfield Central Sports Complex - Field 1C","u"],
    ["22 Aug","12:30pm","Bardon Latrobe U11 Girls Stars","Mitchelton FC U11 Girls Glitter Dragons","Bowman Park - Field 4","u"],
    ["22 Aug","2:00pm","The Gap Under 11 Canberra","UQFC U11 Girls Sapphires Joey Central","Hilder Road State School - Field 2","u"],
    ["22 Aug","3:00pm","UQFC U11 Girls Diamonds Joey Central","Bardon Latrobe U11 Girls Bananas","Cubberla Creek Reserve - Field 2B","u"],
  ]),
  ..._fx("Round 16",[
    ["29 Aug","10:00am","UQFC U11 Girls Emeralds Joey Central","The Gap Under 11 Canberra","Cubberla Creek Reserve - Field 2C","u"],
    ["29 Aug","10:00am","Under 11 Koalas","Brisbane Knights FC U11 Girls Joeys","Sutton Park - Field 4","u"],
    ["29 Aug","11:00am","Toowong FC U11 White","UQFC U11 Girls Diamonds Joey Central","Dunmore Park - Field 1B","u"],
    ["29 Aug","11:30am","Mitchelton FC U11 Girls Glitter Dragons","Toowong FC U11 Rose","Teralba Park - Field 2A","u"],
    ["29 Aug","11:30am","Springfield United U11 Emeralds Girls","Bardon Latrobe U11 Girls Bandits","Springfield Central Sports Complex - Field 1C","u"],
    ["29 Aug","11:30am","Bardon Latrobe U11 Girls Bananas","UQFC U11 Girls Rubies Joey Central","Bowman Park - Field 4","u"],
    ["29 Aug","12:00pm","UQFC U11 Girls Sapphires Joey Central","Bardon Latrobe U11 Girls Stars","Cubberla Creek Reserve - Field 2C","u"],
  ]),
  ..._fx("Round 17",[
    ["5 Sep","9:00am","Under 11 Koalas","Bardon Latrobe U11 Girls Bananas","Sutton Park - Field 4","u"],
    ["5 Sep","9:30am","Bardon Latrobe U11 Girls Stars","UQFC U11 Girls Emeralds Joey Central","Bowman Park - Field 4","u"],
    ["5 Sep","10:00am","UQFC U11 Girls Rubies Joey Central","Toowong FC U11 White","Cubberla Creek Reserve - Field 2B","u"],
    ["5 Sep","10:00am","Brisbane Knights FC U11 Girls Joeys","Bardon Latrobe U11 Girls Bandits","Croatian Community Centre QLD - Field 3A","u"],
    ["5 Sep","11:00am","Toowong FC U11 Rose","UQFC U11 Girls Sapphires Joey Central","Dunmore Park - Field 1A","u"],
    ["5 Sep","2:00pm","The Gap Under 11 Canberra","Springfield United U11 Emeralds Girls","Hilder Road State School - Field 1","u"],
    ["5 Sep","3:00pm","UQFC U11 Girls Diamonds Joey Central","Mitchelton FC U11 Girls Glitter Dragons","Cubberla Creek Reserve - Field 2C","u"],
  ]),
  ..._fx("Round 18",[
    ["12 Sep","8:30am","Bardon Latrobe U11 Girls Bananas","Brisbane Knights FC U11 Girls Joeys","Bowman Park - Field 3","u"],
    ["12 Sep","9:30am","Mitchelton FC U11 Girls Glitter Dragons","UQFC U11 Girls Rubies Joey Central","Teralba Park - Field 10","u"],
    ["12 Sep","10:00am","UQFC U11 Girls Emeralds Joey Central","Toowong FC U11 Rose","Cubberla Creek Reserve - Field 2C","u"],
    ["12 Sep","10:00am","Toowong FC U11 White","Under 11 Koalas","Dunmore Park - Field 1B","u"],
    ["12 Sep","10:30am","Springfield United U11 Emeralds Girls","Bardon Latrobe U11 Girls Stars","Springfield Central Sports Complex - Field 1G","u"],
    ["12 Sep","11:30am","Bardon Latrobe U11 Girls Bandits","The Gap Under 11 Canberra","Bowman Park - Field 4","u"],
    ["12 Sep","12:00pm","UQFC U11 Girls Sapphires Joey Central","UQFC U11 Girls Diamonds Joey Central","Cubberla Creek Reserve - Field 2A","u"],
  ]),
];

// Load from localStorage if user has imported a schedule, else use hardcoded
let FIXTURES = loadFixtures() || HARDCODED_FIXTURES;

// ════════════════════════════════════════════════════════════════════════════════
//  SCREEN: FIXTURES
// ════════════════════════════════════════════════════════════════════════════════
function FixturesScreen({ onBack, embedded }) {
  const [myTeam, setMyTeam] = useState(() => localStorage.getItem('soccerCoach_fixtureTeam') || '');
  const [filter, setFilter]   = useState(() => {
    const t = localStorage.getItem('soccerCoach_fixtureTeam') || '';
    return t ? 'ours' : 'all';
  });
  const [scores, setScores]   = useState(() => loadFxScores());
  const [editing, setEditing] = useState(null);
  const [hg, setHg] = useState('');
  const [ag, setAg] = useState('');

  function pickTeam(t) { setMyTeam(t); localStorage.setItem('soccerCoach_fixtureTeam', t); if(t) setFilter('ours'); }

  function openScore(f) {
    const existing = scores[fixtureKey(f)];
    if (existing?.postponed) { setHg(''); setAg(''); }
    else { setHg(existing != null ? String(existing.home) : ''); setAg(existing != null ? String(existing.away) : ''); }
    setEditing(f);
  }

  function saveScore() {
    if (hg === '' || ag === '') return;
    const next = { ...scores, [fixtureKey(editing)]: { home: Number(hg), away: Number(ag) } };
    setScores(next); saveFxScores(next); setEditing(null);
  }

  function savePostponed() {
    const next = { ...scores, [fixtureKey(editing)]: { postponed: true } };
    setScores(next); saveFxScores(next); setEditing(null);
  }

  function clearScore() {
    const next = { ...scores };
    delete next[fixtureKey(editing)];
    setScores(next); saveFxScores(next); setEditing(null);
  }

  const allTeams  = [...new Set(FIXTURES.flatMap(f => [f.home, f.away]))].sort();
  const nextRound = (FIXTURES.find(f => isUpcoming(f)) || {}).round;
  const shown     = (filter === 'ours' && myTeam)
    ? FIXTURES.filter(f => f.home === myTeam || f.away === myTeam)
    : FIXTURES;

  const grouped = [];
  let cur = null;
  for (const f of shown) {
    if (!cur || f.round !== cur.round) { cur = { round: f.round, fixtures: [] }; grouped.push(cur); }
    cur.fixtures.push(f);
  }

  const tabBtn = (active) => ({
    flex: 1, padding: '8px 0', border: 'none', borderRadius: 8, fontSize: 13,
    fontWeight: 600, cursor: 'pointer', background: active ? '#3D2000' : '#1A1A1A', color: active ? '#fff' : '#A1A1A1',
  });

  const numInp = { width: 56, padding: '10px 0', textAlign: 'center', fontSize: 24, fontWeight: 700,
    borderRadius: 8, border: '1px solid #2A2A2A', background: '#0D0D0D', color: '#FFFFFF' };

  const modal = editing && (
    <div style={{ position:'fixed', inset:0, background:'rgba(0,0,0,0.7)', zIndex:200, display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}>
      <div style={{ background:'#1A1A1A', borderRadius:14, padding:20, width:'100%', maxWidth:340 }}>
        <div style={{ fontSize:13, color:'#A1A1A1', marginBottom:4 }}>{editing.date} · {editing.time}</div>
        <div style={{ fontSize:13, color:'#A1A1A1', marginBottom:16, lineHeight:1.4 }}>
          {editing.home} <span style={{color:'#A1A1A1'}}>vs</span> {editing.away}
        </div>
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:16, marginBottom:20 }}>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:11, color:'#A1A1A1', marginBottom:6 }}>HOME</div>
            <input type="number" min="0" value={hg} onChange={e=>setHg(e.target.value)} style={numInp} />
          </div>
          <div style={{ fontSize:20, color:'#A1A1A1', fontWeight:700 }}>–</div>
          <div style={{ textAlign:'center' }}>
            <div style={{ fontSize:11, color:'#A1A1A1', marginBottom:6 }}>AWAY</div>
            <input type="number" min="0" value={ag} onChange={e=>setAg(e.target.value)} style={numInp} />
          </div>
        </div>
        <button onClick={saveScore} disabled={hg===''||ag===''} style={{ width:'100%', padding:'11px 0', borderRadius:9, border:'none', fontSize:15, fontWeight:700, cursor:'pointer', background:'#3D2000', color:'#fff', marginBottom:8, opacity:hg===''||ag===''?0.5:1 }}>Save Score</button>
        <button onClick={savePostponed} style={{ width:'100%', padding:'9px 0', borderRadius:9, border:'1px solid #92400e', fontSize:13, fontWeight:700, cursor:'pointer', background:'#431407', color:'#fb923c', marginBottom:8 }}>🚫 Bye / Postponed</button>
        {scores[fixtureKey(editing)] && (
          <button onClick={clearScore} style={{ width:'100%', padding:'9px 0', borderRadius:9, border:'1px solid #2A2A2A', fontSize:13, fontWeight:600, cursor:'pointer', background:'transparent', color:'#f87171', marginBottom:8 }}>Clear</button>
        )}
        <button onClick={()=>setEditing(null)} style={{ width:'100%', padding:'9px 0', borderRadius:9, border:'1px solid #2A2A2A', fontSize:13, fontWeight:600, cursor:'pointer', background:'transparent', color:'#A1A1A1' }}>Cancel</button>
      </div>
    </div>
  );

  const controls = (
    <div style={{ padding: embedded ? '0 0 12px' : '16px 16px 12px', borderBottom:'1px solid #1E1400', flexShrink:0 }}>
      {!embedded && <h2 style={{ margin:'8px 0 12px', fontSize:18, fontWeight:800, color:'#FFFFFF' }}>📅 Fixtures — 2026 Season</h2>}
      <select value={myTeam} onChange={e=>pickTeam(e.target.value)}
        style={{ width:'100%', padding:'8px 10px', borderRadius:8, background:'#0D0D0D', color:'#FFFFFF', border:'1px solid #2A2A2A', fontSize:13, marginBottom:10 }}>
        <option value=''>— Select your team to highlight —</option>
        {allTeams.map(t => <option key={t} value={t}>{t}</option>)}
      </select>
      <div style={{ display:'flex', gap:6 }}>
        <button style={tabBtn(filter==='all')} onClick={()=>setFilter('all')}>All Fixtures</button>
        <button style={{ ...tabBtn(filter==='ours'), opacity:myTeam?1:0.4, cursor:myTeam?'pointer':'not-allowed' }}
          onClick={()=>myTeam&&setFilter('ours')}>Our Games</button>
      </div>
    </div>
  );

  const list = (
    <div style={{ padding:'4px 16px 40px' }}>
      {grouped.length===0 && <div style={{ textAlign:'center', color:'#A1A1A1', padding:'40px 0', fontSize:14 }}>No fixtures found.</div>}
      {grouped.map(rnd => {
        const isNext = rnd.round === nextRound;
        return (
          <div key={rnd.round}>
            <div style={{ display:'flex', alignItems:'center', gap:8, padding:'14px 0 6px' }}>
              <span style={{ fontSize:11, fontWeight:700, color:isNext?'#F5C04A':'#A1A1A1', textTransform:'uppercase', letterSpacing:1 }}>{rnd.round}</span>
              {isNext && <span style={{ fontSize:10, background:'#1E1000', color:'#FDE68A', borderRadius:4, padding:'2px 6px', fontWeight:700 }}>NEXT UP</span>}
            </div>
            {rnd.fixtures.map((f, i) => {
              const key      = fixtureKey(f);
              const sc       = scores[key];
              const homeIsUs = myTeam && f.home === myTeam;
              const awayIsUs = myTeam && f.away === myTeam;
              const ours     = homeIsUs || awayIsUs;
              const isPast   = !isUpcoming(f) && !sc;
              const canEdit  = true;
              let scoreBadge;
              if (sc?.postponed) {
                scoreBadge = <span style={{ fontSize:11, background:'#431407', color:'#fb923c', borderRadius:5, padding:'2px 7px', fontWeight:700 }}>Postponed</span>;
              } else if (sc != null) {
                const hl = sc.home > sc.away ? '#FCD34D' : sc.home < sc.away ? '#f87171' : '#A1A1A1';
                const al = sc.away > sc.home ? '#FCD34D' : sc.away < sc.home ? '#f87171' : '#A1A1A1';
                scoreBadge = <span style={{ fontSize:15, fontWeight:800 }}>
                  <span style={{ color:hl }}>{sc.home}</span>
                  <span style={{ color:'#A1A1A1', margin:'0 4px' }}>–</span>
                  <span style={{ color:al }}>{sc.away}</span>
                </span>;
              } else if (isPast) {
                scoreBadge = <span style={{ fontSize:11, color:'#A1A1A1', fontStyle:'italic' }}>Unknown</span>;
              } else {
                scoreBadge = <span style={{ fontSize:11, color:'#60a5fa', fontWeight:500 }}>Upcoming</span>;
              }
              return (
                <div key={i} onClick={() => canEdit && openScore(f)}
                  style={{ background: ours ? '#110D00' : '#1a2332', border:`1px solid ${ours?'#F5C04A55':isNext?'#F5C04A33':'#1E1400'}`, borderRadius:10, padding:'10px 12px', marginBottom:6, cursor: canEdit ? 'pointer' : 'default' }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:4 }}>
                    <span style={{ fontSize:12, color:'#A1A1A1' }}>{f.date} · {f.time}</span>
                    {scoreBadge}
                  </div>
                  <div style={{ fontSize:13, fontWeight:600, lineHeight:1.5 }}>
                    <span style={{ color:homeIsUs?'#FCD34D':'#e2e8f0' }}>{f.home}</span>
                    <span style={{ color:'#A1A1A1', fontWeight:400, margin:'0 6px', fontSize:11 }}>vs</span>
                    <span style={{ color:awayIsUs?'#FCD34D':'#e2e8f0' }}>{f.away}</span>
                  </div>
                  <div style={{ fontSize:11, color:'#A1A1A1', marginTop:3 }}>📍 {f.venue}{canEdit ? <span style={{color:'#2A2A2A'}}> · tap to record score</span> : ''}</div>
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );

  if (embedded) {
    return <div>{modal}{controls}{list}</div>;
  }
  return (
    <div style={S.page}>
      <div style={{ ...S.card, padding: 0, display: 'flex', flexDirection: 'column', maxHeight:'calc(100vh - max(env(safe-area-inset-top),16px) - max(env(safe-area-inset-bottom),16px) - 32px)' }}>
        {modal}{controls}
        <div style={{ overflowY:'auto', flex:1 }}>{list}</div>
        {!embedded && <div style={{borderTop:"1px solid #1E1400",padding:"10px 14px",paddingBottom:"max(10px,env(safe-area-inset-bottom))",flexShrink:0}}><button onClick={onBack} style={S.backBtn}>← Back</button></div>}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  OPPONENT SCOUTING
// ════════════════════════════════════════════════════════════════════════════════
function generateOpponentInsights(name, stats, results, uqfcGames, vsUsGames, theirPos, myPos, myTeam, coachNotes) {
  const short = name.split(' ').slice(-2).join(' ');
  const lines = [];

  if (stats.p === 0) {
    lines.push(`No results recorded for ${short} yet — go to Fixtures and enter scores to unlock insights.`);
  } else {
    const winPct = Math.round((stats.w / stats.p) * 100);
    const gpg  = (stats.gf / stats.p).toFixed(1);
    const gcpg = (stats.ga / stats.p).toFixed(1);

    if (winPct >= 70)
      lines.push(`${short} are in strong form this season — ${stats.w} wins from ${stats.p} games (${winPct}% win rate), averaging ${gpg} goals per game. Expect a well-organised, confident side.`);
    else if (winPct >= 40)
      lines.push(`${short} have had a mixed season: ${stats.w}W ${stats.d}D ${stats.l}L from ${stats.p} games. They score ${gpg} and concede ${gcpg} goals per game on average.`);
    else
      lines.push(`${short} have found it tough this season with just ${stats.w} win${stats.w!==1?'s':''} from ${stats.p} games, conceding ${gcpg} per game. There should be chances if you play your game.`);

    if (stats.gf > stats.ga * 1.5)
      lines.push(`They are attack-minded — scoring significantly more than they concede. Strong defensive shape will be key.`);
    else if (stats.ga > stats.gf * 1.5)
      lines.push(`They tend to concede more than they score. Getting forward early and applying pressure could pay dividends.`);

    const last3 = results.filter(r=>r.result!=='?').slice(-3);
    if (last3.length >= 2) {
      const form = last3.map(r=>r.result).join('-');
      if (last3.every(r=>r.result==='W'))
        lines.push(`Recent form: ${form} — they arrive in this game full of confidence.`);
      else if (last3.every(r=>r.result==='L'))
        lines.push(`Recent form: ${form} — they have been struggling lately.`);
      else
        lines.push(`Recent form: ${form}.`);
    }
  }

  // UQFC cross-results (exclude games vs my own team since those go in H2H below)
  const uqfcOther = uqfcGames.filter(r => !myTeam || r.vs !== myTeam);
  if (uqfcOther.length > 0) {
    const sc = uqfcOther.filter(r=>r.result!=='?');
    if (sc.length > 0) {
      const uqfcWins = sc.filter(r=>r.result==='L').length; // opponent lost = UQFC won
      const uqfcLoss = sc.filter(r=>r.result==='W').length; // opponent won = UQFC lost
      const uqfcDraw = sc.filter(r=>r.result==='D').length;
      const ogf = sc.reduce((s,r)=>s+r.scored,0);
      const oga = sc.reduce((s,r)=>s+r.conceded,0);
      const label = myTeam && myTeam.toLowerCase().includes('uqfc') ? 'other UQFC teams' : 'UQFC teams';
      if (uqfcWins > uqfcLoss)
        lines.push(`\nAgainst ${label} this season: ${label.charAt(0).toUpperCase()+label.slice(1)} have won ${uqfcWins} of ${sc.length} encounters (${short} scored ${ogf}, conceded ${oga}).`);
      else if (uqfcLoss > uqfcWins)
        lines.push(`\n${short} have had the better of ${label} — winning ${uqfcLoss} of ${sc.length} matchups. Don't underestimate them.`);
      else
        lines.push(`\nResults vs ${label} are evenly split (${uqfcWins}W ${uqfcDraw}D ${uqfcLoss}L).`);
    }
  }

  if (myTeam && vsUsGames.length > 0) {
    const sc = vsUsGames.filter(r=>r.result!=='?');
    if (sc.length > 0) {
      const r = sc[sc.length-1];
      const outcome = r.result==='W'?'they won':r.result==='L'?'you won':'it was a draw';
      lines.push(`\nHead-to-head: You last met on ${r.f.date} — ${r.scored}–${r.conceded} (${outcome}).`);
    }
  }

  if (theirPos > 0 && myPos > 0 && stats.p > 0) {
    // diff > 0 means they rank lower (higher position number = lower on ladder = worse)
    const diff = theirPos - myPos;
    lines.push('');
    if (diff >= 4)
      lines.push(`📊 Prediction: You sit ${diff} places above them on the ladder — a favourable matchup. Focus on your structure and it should be a positive result.`);
    else if (diff <= -4)
      lines.push(`📊 Prediction: They are ${Math.abs(diff)} places above you on the ladder. Expect a tough game — stay disciplined, press high, and take your chances.`);
    else
      lines.push(`📊 Prediction: You are closely matched (${diff===0?'level on the ladder':diff>0?`you are ${diff} ahead`:`they are ${Math.abs(diff)} ahead`}). Form on the day will decide it.`);
  } else if (stats.p === 0) {
    lines.push(`\n📊 Prediction: Not enough data yet. Record more fixture scores to unlock predictions.`);
  }

  if (coachNotes && coachNotes.trim()) {
    lines.push(`\n📝 Coach Notes:\n${coachNotes.trim()}`);
  }

  return lines.join('\n');
}

function OpponentStatsScreen({ opponent, onBack, embedded, teamNotes }) {
  const [tick, setTick] = React.useState(0); // bump to reload all data from storage
  const scores  = loadFxScores();
  const myTeam  = localStorage.getItem('soccerCoach_fixtureTeam') || '';
  const ladder  = computeLadder(scores);

  const theirGames = FIXTURES.filter(f => f.home===opponent || f.away===opponent);

  let p=0,w=0,d=0,l=0,gf=0,ga=0,pts=0;
  const results = [];
  theirGames.forEach(f => {
    const sc      = scores[fixtureKey(f)];
    const isHome  = f.home === opponent;
    const opp     = isHome ? f.away : f.home;
    if (sc != null) {
      const scored    = isHome ? sc.home : sc.away;
      const conceded  = isHome ? sc.away : sc.home;
      p++; gf+=scored; ga+=conceded;
      let res;
      if (scored > conceded)  { w++; pts+=3; res='W'; }
      else if (scored < conceded) { l++; res='L'; }
      else                    { d++; pts+=1; res='D'; }
      results.push({f, result:res, scored, conceded, vs:opp});
    } else if (parseFixtureDate(f.date) < new Date()) {
      results.push({f, result:'?', scored:null, conceded:null, vs:opp});
    }
  });

  const gd       = gf - ga;
  const uqfcGames = results.filter(r=>r.vs.toLowerCase().includes('uqfc'));
  const vsUsGames = myTeam ? results.filter(r=>r.vs===myTeam) : [];
  const theirPos  = ladder.findIndex(t=>t.name===opponent)+1;
  const myPos     = myTeam ? ladder.findIndex(t=>t.name===myTeam)+1 : 0;
  const insights  = generateOpponentInsights(opponent, {p,w,d,l,gf,ga,pts}, results, uqfcGames, vsUsGames, theirPos, myPos, myTeam, teamNotes || '');

  const statBox = (label, val, color='#e2e8f0') => (
    <div style={{flex:1, background:'#1A1A1A', borderRadius:8, padding:'8px 4px', textAlign:'center'}}>
      <div style={{fontSize:18, fontWeight:800, color}}>{val}</div>
      <div style={{fontSize:10, color:'#A1A1A1', marginTop:2}}>{label}</div>
    </div>
  );

  const resultBadge = (res) => ({W:'#FCD34D',L:'#f87171',D:'#fcd34d','?':'#A1A1A1'}[res]||'#A1A1A1');

  const statsContent = (
    <div style={{ padding: embedded ? '0' : '14px 16px 36px' }}>
      {p > 0 ? (
        <>
          <div style={{display:'flex', gap:6, marginBottom:6}}>
            {statBox('P', p, '#A1A1A1')}
            {statBox('W', w, w>0?'#FCD34D':'#A1A1A1')}
            {statBox('D', d, d>0?'#fcd34d':'#A1A1A1')}
            {statBox('L', l, l>0?'#f87171':'#A1A1A1')}
            {statBox('Pts', pts, '#e2e8f0')}
          </div>
          <div style={{display:'flex', gap:6, marginBottom:16}}>
            {statBox('GF', gf, '#FCD34D')}
            {statBox('GA', ga, '#f87171')}
            {statBox('GD', (gd>0?'+':'')+gd, gd>0?'#FCD34D':gd<0?'#f87171':'#A1A1A1')}
            {statBox('Ladder', theirPos>0?`#${theirPos}`:'–', '#c4b5fd')}
          </div>
        </>
      ) : (
        <div style={{background:'#1A1A1A', borderRadius:10, padding:'12px 14px', marginBottom:16, fontSize:13, color:'#A1A1A1'}}>
          No scores recorded for this team yet.
        </div>
      )}
      <div style={{background:'#0a1929', border:'1px solid #3b82f644', borderRadius:12, padding:'14px', marginBottom:16}}>
        <div style={{display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:10}}>
          <div style={{fontSize:11, fontWeight:700, color:'#60a5fa', textTransform:'uppercase', letterSpacing:1}}>✨ Scout Report</div>
          <button
            onClick={() => setTick(t => t + 1)}
            style={{background:'#1E1400', border:'1px solid #F5C04A33', color:'#93c5fd', borderRadius:6, padding:'3px 9px', fontSize:11, cursor:'pointer'}}
          >↻ Refresh</button>
        </div>
        <div style={{fontSize:13, color:'#cbd5e1', lineHeight:1.75, whiteSpace:'pre-wrap'}}>{insights}</div>
      </div>
      {uqfcGames.length > 0 && (
        <div style={{marginBottom:16}}>
          <div style={{fontSize:11, fontWeight:700, color:'#A1A1A1', textTransform:'uppercase', letterSpacing:1, marginBottom:8}}>vs UQFC Teams</div>
          {uqfcGames.map((r,i)=>(
            <div key={i} style={{background:'#1A1A1A', borderRadius:9, padding:'10px 12px', marginBottom:6, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>
                <div style={{fontSize:13, color:'#e2e8f0'}}>{r.vs}</div>
                <div style={{fontSize:11, color:'#A1A1A1'}}>{r.f.date} · {r.f.round}</div>
              </div>
              {r.result!=='?' ? (
                <div style={{textAlign:'right'}}>
                  <span style={{fontSize:15, fontWeight:800, color:resultBadge(r.result)}}>{r.scored}–{r.conceded}</span>
                  <span style={{fontSize:10, marginLeft:5, fontWeight:700, color:resultBadge(r.result)}}>{r.result}</span>
                </div>
              ) : <span style={{fontSize:11,color:'#A1A1A1',fontStyle:'italic'}}>Unknown</span>}
            </div>
          ))}
        </div>
      )}
      {results.length > 0 && (
        <div>
          <div style={{fontSize:11, fontWeight:700, color:'#A1A1A1', textTransform:'uppercase', letterSpacing:1, marginBottom:8}}>All Results This Season</div>
          {results.map((r,i)=>(
            <div key={i} style={{background:'#121212', borderRadius:8, padding:'8px 12px', marginBottom:4, display:'flex', justifyContent:'space-between', alignItems:'center'}}>
              <div>
                <div style={{fontSize:12, color:'#e2e8f0'}}>{r.vs}</div>
                <div style={{fontSize:10, color:'#A1A1A1'}}>{r.f.date} · {r.f.round}</div>
              </div>
              {r.result!=='?' ? (
                <div>
                  <span style={{fontSize:14, fontWeight:700, color:resultBadge(r.result)}}>{r.scored}–{r.conceded}</span>
                  <span style={{fontSize:10, marginLeft:5, color:resultBadge(r.result)}}>{r.result}</span>
                </div>
              ) : <span style={{fontSize:11, color:'#A1A1A1', fontStyle:'italic'}}>Unknown</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (embedded) return statsContent;

  return (
    <div style={S.page}>
      <div style={{...S.card, padding:0, display:'flex', flexDirection:'column', maxHeight:'calc(100vh - max(env(safe-area-inset-top),16px) - max(env(safe-area-inset-bottom),16px) - 32px)'}}>
        <div style={{padding:'16px 16px 10px', borderBottom:'1px solid #1E1400', flexShrink:0}}>
          <h2 style={{margin:'4px 0 2px', fontSize:18, fontWeight:800, color:'#FFFFFF'}}>{opponent}</h2>
          <div style={{fontSize:12, color:'#A1A1A1'}}>2026 Season · Scouting Report</div>
        </div>
        <div style={{overflowY:'auto', flex:1, padding:'14px 16px 36px'}}>
          {statsContent}
        </div>
        <div style={{borderTop:"1px solid #1E1400",padding:"10px 14px",paddingBottom:"max(10px,env(safe-area-inset-bottom))",flexShrink:0}}><button onClick={onBack} style={S.backBtn}>← Back</button></div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  SCREEN: LADDER
// ════════════════════════════════════════════════════════════════════════════════
function computeLadder(scores) {
  const teams = {};
  [...new Set(FIXTURES.flatMap(f=>[f.home,f.away]))].forEach(t=>{
    teams[t] = { name:t, p:0, w:0, d:0, l:0, gf:0, ga:0, pts:0 };
  });
  FIXTURES.forEach(f => {
    const sc = scores[fixtureKey(f)];
    if (sc == null) return;
    const { home: hg, away: ag } = sc;
    teams[f.home].p++; teams[f.home].gf+=hg; teams[f.home].ga+=ag;
    teams[f.away].p++; teams[f.away].gf+=ag; teams[f.away].ga+=hg;
    if (hg > ag)      { teams[f.home].w++; teams[f.home].pts+=3; teams[f.away].l++; }
    else if (hg < ag) { teams[f.away].w++; teams[f.away].pts+=3; teams[f.home].l++; }
    else              { teams[f.home].d++; teams[f.home].pts+=1; teams[f.away].d++; teams[f.away].pts+=1; }
  });
  return Object.values(teams).sort((a,b)=>{
    if (b.pts!==a.pts) return b.pts-a.pts;
    const gda=a.gf-a.ga, gdb=b.gf-b.ga;
    if (gdb!==gda) return gdb-gda;
    if (b.gf!==a.gf) return b.gf-a.gf;
    return a.name.localeCompare(b.name);
  });
}

// Parse a fixture date string like "2 May" or "13 Jun" into a Date (using current year)
function parseFixtureDate(dateStr) {
  const year = new Date().getFullYear();
  return new Date(dateStr + ' ' + year);
}

// Extrapolated ladder — only games up to today; unknown past games estimated from team stats
function computeExtrapolatedLadder(scores) {
  const today = new Date();
  today.setHours(23, 59, 59, 999); // include today fully

  // Only fixtures that should have been played by today (not postponed)
  const pastFixtures = FIXTURES.filter(f => {
    const sc_check = scores[fixtureKey(f)]; if (sc_check?.postponed) return false; // postponed, skip
    const d = parseFixtureDate(f.date);
    return d <= today;
  });

  // Step 1: collect known (explicitly recorded, non-postponed) scores to build team stats
  const teamStats = {}; // { name: { gf, ga, gp } }
  const initStat = name => { if (!teamStats[name]) teamStats[name] = { gf:0, ga:0, gp:0 }; };

  pastFixtures.forEach(f => {
    initStat(f.home); initStat(f.away);
    const sc = scores[fixtureKey(f)];
    if (sc && !sc.postponed) {
      teamStats[f.home].gf += sc.home; teamStats[f.home].ga += sc.away; teamStats[f.home].gp++;
      teamStats[f.away].gf += sc.away; teamStats[f.away].ga += sc.home; teamStats[f.away].gp++;
    }
  });

  // Step 2: build ladder using known scores + estimated unknowns
  const teams = {};
  [...new Set(FIXTURES.flatMap(f=>[f.home,f.away]))].forEach(t=>{
    teams[t] = { name:t, p:0, w:0, d:0, l:0, gf:0, ga:0, pts:0, assumedPts:0 };
  });

  pastFixtures.forEach(f => {
    const sc = scores[fixtureKey(f)];
    let hg, ag, assumed;

    if (sc && !sc.postponed) {
      // Known score
      hg = sc.home; ag = sc.away; assumed = false;
    } else if (sc?.postponed) {
      return; // skip postponed games entirely
    } else {
      // Estimate: use each team's avg GF and GA; fall back to 0 if no history
      const hs = teamStats[f.home] || { gf:0, ga:0, gp:0 };
      const as_ = teamStats[f.away] || { gf:0, ga:0, gp:0 };
      if (hs.gp === 0 && as_.gp === 0) {
        // No data at all — assume 0-0
        hg = 0; ag = 0;
      } else {
        const hAvgGf = hs.gp > 0 ? hs.gf / hs.gp : (as_.gp > 0 ? as_.ga / as_.gp : 0);
        const hAvgGa = hs.gp > 0 ? hs.ga / hs.gp : (as_.gp > 0 ? as_.gf / as_.gp : 0);
        const aAvgGf = as_.gp > 0 ? as_.gf / as_.gp : (hs.gp > 0 ? hs.ga / hs.gp : 0);
        const aAvgGa = as_.gp > 0 ? as_.ga / as_.gp : (hs.gp > 0 ? hs.gf / hs.gp : 0);
        hg = Math.max(0, Math.round((hAvgGf + aAvgGa) / 2));
        ag = Math.max(0, Math.round((aAvgGf + hAvgGa) / 2));
      }
      assumed = true;
    }

    teams[f.home].p++; teams[f.home].gf+=hg; teams[f.home].ga+=ag;
    teams[f.away].p++; teams[f.away].gf+=ag; teams[f.away].ga+=hg;
    if (hg > ag) {
      teams[f.home].w++; teams[f.home].pts+=3; teams[f.away].l++;
      if (assumed) teams[f.home].assumedPts+=3;
    } else if (hg < ag) {
      teams[f.away].w++; teams[f.away].pts+=3; teams[f.home].l++;
      if (assumed) teams[f.away].assumedPts+=3;
    } else {
      teams[f.home].d++; teams[f.home].pts+=1; teams[f.away].d++; teams[f.away].pts+=1;
      if (assumed) { teams[f.home].assumedPts+=1; teams[f.away].assumedPts+=1; }
    }
  });

  return Object.values(teams)
    .filter(t => t.p > 0)
    .sort((a,b)=>{
      if (b.pts!==a.pts) return b.pts-a.pts;
      const gda=a.gf-a.ga, gdb=b.gf-b.ga;
      if (gdb!==gda) return gdb-gda;
      if (b.gf!==a.gf) return b.gf-a.gf;
      return a.name.localeCompare(b.name);
    });
}

function LadderScreen({ onBack, embedded }) {
  const [scores]    = useState(()=>loadFxScores());
  const [view, setView] = useState('current'); // 'current' | 'extrapolated'
  const myTeam      = localStorage.getItem('soccerCoach_fixtureTeam') || '';
  const ladder      = computeLadder(scores);
  const extLadder   = computeExtrapolatedLadder(scores);
  const hasData     = ladder.some(t=>t.p>0);

  const cell = (content, style={}) => (
    <td style={{ padding:'8px 5px', textAlign:'center', fontSize:12, borderBottom:'1px solid #1E1400', ...style }}>{content}</td>
  );

  const ladderTable = (rows, showAssumed) => (
    <div style={{ overflowX:'auto' }}>
      <table style={{ width:'100%', borderCollapse:'collapse', minWidth:380 }}>
        <thead>
          <tr style={{ background:'#0a0f1a' }}>
            {['#','Team','P','W','D','L','GF','GA','GD','Pts'].map(h=>(
              <th key={h} style={{ padding:'7px 5px', fontSize:10, fontWeight:700, color:'#A1A1A1', textTransform:'uppercase', letterSpacing:0.5, textAlign:h==='Team'?'left':'center', borderBottom:'1px solid #1E1400', whiteSpace:'nowrap' }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((t, i) => {
            const isUs  = myTeam && t.name === myTeam;
            const gd    = t.gf - t.ga;
            const hasAssumptions = showAssumed && (t.assumedPts || 0) > 0;
            const rowBg = isUs ? '#110D00' : hasAssumptions ? '#16120a' : i%2===0 ? '#121212' : '#0d1420';
            return (
              <tr key={t.name} style={{ background:rowBg }}>
                <td style={{ padding:'8px 5px', textAlign:'center', fontSize:12, borderBottom:'1px solid #1E1400', color:'#A1A1A1', fontWeight:700 }}>{i+1}</td>
                <td style={{ padding:'8px 7px', fontSize:12, borderBottom:'1px solid #1E1400', color:isUs?'#FCD34D':'#e2e8f0', fontWeight:isUs?700:400, whiteSpace:'nowrap', maxWidth:130, overflow:'hidden', textOverflow:'ellipsis' }}>
                  {isUs && '⭐ '}{t.name}
                  {hasAssumptions && <span style={{fontSize:9,color:'#f59e0b',marginLeft:3,fontWeight:700}}>~{t.assumedPts}est</span>}
                </td>
                {cell(t.p, {color:'#A1A1A1'})}
                {cell(t.w, {color:t.w>0?'#FCD34D':'#A1A1A1'})}
                {cell(t.d, {color:t.d>0?'#fcd34d':'#A1A1A1'})}
                {cell(t.l, {color:t.l>0?'#f87171':'#A1A1A1'})}
                {cell(t.gf, {color:'#A1A1A1'})}
                {cell(t.ga, {color:'#A1A1A1'})}
                {cell((gd>0?'+':'')+gd, {color:gd>0?'#FCD34D':gd<0?'#f87171':'#A1A1A1'})}
                {cell(t.pts, {color: hasAssumptions?'#f59e0b':'#FFFFFF', fontWeight:700, fontSize:14})}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  const toggleBar = (
    <div style={{ display:'flex', gap:6, margin:'10px 0 12px' }}>
      <button onClick={()=>setView('current')} style={{
        flex:1, padding:'8px 0', borderRadius:8, border:'none', fontSize:13, fontWeight:700, cursor:'pointer',
        background: view==='current' ? '#3D2000' : '#1A1A1A',
        color: view==='current' ? '#fff' : '#A1A1A1',
      }}>📊 Current</button>
      <button onClick={()=>setView('extrapolated')} style={{
        flex:1, padding:'8px 0', borderRadius:8, border:'none', fontSize:13, fontWeight:700, cursor:'pointer',
        background: view==='extrapolated' ? '#78350f' : '#1A1A1A',
        color: view==='extrapolated' ? '#fcd34d' : '#A1A1A1',
      }}>🔮 Extrapolated</button>
    </div>
  );

  const tableContent = (
    <>
      {!hasData && view==='current' && <p style={{ fontSize:13, color:'#A1A1A1', margin:'8px 0' }}>No scores recorded yet. Enter results in Fixtures to see the ladder.</p>}

      {toggleBar}

      {view === 'current' && (
        <>
          {ladderTable(ladder, false)}
          <div style={{ padding:'6px 0 10px', fontSize:11, color:'#A1A1A1' }}>
            Recorded scores only · W=3pts D=1pt L=0pts
          </div>
        </>
      )}

      {view === 'extrapolated' && (
        <>
          <div style={{ fontSize:11, color:'#78350f', background:'#1c1007', border:'1px solid #92400e44', borderRadius:8, padding:'8px 12px', marginBottom:10 }}>
            <span style={{color:'#f59e0b',fontWeight:700}}>🔮 Extrapolated</span> — games played up to today.
            Unknown scores estimated from each team's scoring record.
            <span style={{color:'#f59e0b'}}> ~N est</span> = estimated points.
          </div>
          {extLadder.length === 0
            ? <p style={{ fontSize:13, color:'#A1A1A1' }}>No past fixtures found to extrapolate.</p>
            : ladderTable(extLadder, true)
          }
          <div style={{ padding:'6px 0 10px', fontSize:11, color:'#A1A1A1' }}>
            Future fixtures not included · Postponed games skipped
          </div>
        </>
      )}
    </>
  );

  if (embedded) return <div style={{ padding:'4px 0' }}>{tableContent}</div>;

  return (
    <div style={S.page}>
      <div style={{ ...S.card, padding:0, display:'flex', flexDirection:'column', maxHeight:'calc(100vh - max(env(safe-area-inset-top),16px) - max(env(safe-area-inset-bottom),16px) - 32px)' }}>
        <div style={{ padding:'16px 16px 12px', borderBottom:'1px solid #1E1400', flexShrink:0 }}>
          <h2 style={{ margin:'4px 0 4px', fontSize:18, fontWeight:800, color:'#FFFFFF' }}>🏅 Ladder — 2026 Season</h2>
        </div>
        <div style={{ overflowY:'auto', flex:1, padding:'0 16px 20px' }}>{tableContent}</div>
        <div style={{borderTop:"1px solid #1E1400",padding:"10px 14px",paddingBottom:"max(10px,env(safe-area-inset-bottom))",flexShrink:0}}><button onClick={onBack} style={S.backBtn}>← Back</button></div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  SCREEN: SETTINGS
// ════════════════════════════════════════════════════════════════════════════════
function SettingsScreen({ settings, onSave, onBack, onViewImportExport }) {
  const [form, setForm] = useState({ ...settings });

  const allTeams = [...new Set(FIXTURES.flatMap(f => [f.home, f.away]))].sort();

  function upd(key, val) { setForm(f=>({...f,[key]:val})); }

  function save() {
    // Keep soccerCoach_fixtureTeam in sync with teamName
    if (form.teamName) localStorage.setItem('soccerCoach_fixtureTeam', form.teamName);
    onSave(form);
    onBack();
  }





  return (
    <div style={S.page}>
      <div style={S.card}>
        <h1 style={S.h1}>Settings</h1>

        {/* Team name as dropdown */}
        <div>
          <div style={S.fieldLbl}>Our team</div>
          <select style={{...S.inp, width:'100%'}} value={form.teamName||''} onChange={e=>upd('teamName',e.target.value)}>
            <option value=''>— Select your team —</option>
            {allTeams.map(t=><option key={t} value={t}>{t}</option>)}
          </select>
        </div>

        {[["coachName","Coach name"],["managerName","Manager name"]].map(([key,lbl])=>(
          <div key={key}>
            <div style={S.fieldLbl}>{lbl}</div>
            <input style={{...S.inp,width:'100%'}} value={form[key]||''} onChange={e=>upd(key,e.target.value)} />
          </div>
        ))}

        <button style={S.btnGreen} onClick={save}>Save Settings</button>

        {/* Import / Export */}
        <div style={{borderTop:'1px solid #1E1400', paddingTop:12, marginTop:4}}>
          <button style={{...S.btnDark, width:'100%', fontSize:13, display:'flex', alignItems:'center', justifyContent:'center', gap:8}} onClick={onViewImportExport}>
            📦 Import / Export Data
          </button>
        </div>
        <div style={{borderTop:"1px solid #1E1400",paddingTop:10,marginTop:4}}>
          <button style={S.btnGhost} onClick={onBack}>← More</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  SCREEN: PLAYER STATS
// ════════════════════════════════════════════════════════════════════════════════
function StatsScreen({ games, onBack }) {
  const rows = computePlayerStats(games).sort((a,b)=>b.apps-a.apps||b.goals-a.goals);
  const COL = {width:38,textAlign:"center",fontSize:13,fontWeight:700,flexShrink:0};
  return (
    <div style={S.page}>
      <div style={{...S.card,maxWidth:440,padding:0}}>
        <div style={{padding:"14px 16px 10px",borderBottom:"1px solid #1E1400"}}>
          <h1 style={{...S.h1,marginBottom:0}}>Player Stats</h1>
          <p style={{...S.sub,marginTop:4,marginBottom:0,fontSize:11}}>{games.length} game{games.length!==1?"s":""} recorded</p>
        </div>
        {rows.length===0
          ? <p style={{...S.sub,padding:"20px 16px"}}>Save some games to see player stats.</p>
          : <>
              {/* Header */}
              <div style={{display:"flex",alignItems:"center",padding:"8px 16px",background:"#0D0D0D",borderBottom:"1px solid #1E1400"}}>
                <span style={{flex:1,fontSize:11,fontWeight:700,color:"#A1A1A1",textTransform:"uppercase",letterSpacing:1}}>Player</span>
                <span style={{...COL,fontSize:11,color:"#A1A1A1"}}>Apps</span>
                <span style={{...COL,fontSize:14}}>⚽</span>
                <span style={{...COL,fontSize:14}}>🧤</span>
                <span style={{...COL,fontSize:14}}>⭐</span>
              </div>
              {/* Rows */}
              {rows.map((r,i)=>(
                <div key={r.name} style={{display:"flex",alignItems:"center",padding:"10px 16px",borderBottom:"1px solid #0D0D0D",background:i%2===0?"#121212":"#0D0D0D"}}>
                  <span style={{flex:1,fontSize:13,color:"#FFFFFF",fontWeight:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{r.name}</span>
                  <span style={{...COL,color:"#A1A1A1"}}>{r.apps||"–"}</span>
                  <span style={{...COL,color:r.goals>0?"#F5C04A":"#2A2A2A",fontWeight:r.goals>0?800:400}}>{r.goals||"–"}</span>
                  <span style={{...COL,color:r.gkPeriods>0?"#38bdf8":"#2A2A2A",fontWeight:r.gkPeriods>0?700:400}}>{r.gkPeriods||"–"}</span>
                  <span style={{...COL,color:r.potm>0?"#fcd34d":"#2A2A2A",fontWeight:r.potm>0?700:400}}>{r.potm||"–"}</span>
                </div>
              ))}
            </>
        }
        <div style={{borderTop:"1px solid #1E1400",padding:"10px 14px",paddingBottom:"max(10px,env(safe-area-inset-bottom))",flexShrink:0}}><button onClick={onBack} style={S.backBtn}>← Back</button></div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  SCREEN: SEASON LOG
// ════════════════════════════════════════════════════════════════════════════════
function SeasonScreen({ games, onBack, onOpenGame, onDeleteGame }) {
  const fxScores = loadFxScores();
  return (
    <div style={S.page}>
      <div style={{...S.card,maxWidth:440}}>
        <h1 style={S.h1}>Season Log</h1>
        {games.length===0&&<p style={S.sub}>No games saved yet.</p>}
        {games.slice().reverse().map(g=>{
          const sc=getScore(g, fxScores);
          const res=sc.us>sc.them?"W":sc.us<sc.them?"L":"D";
          const resColor=res==="W"?"#F5C04A":res==="L"?"#ef4444":"#f59e0b";
          return (
            <div key={g.id} style={S.gameRow} onClick={()=>onOpenGame(g.id)}>
              <div style={{...S.resultBadge,background:resColor+"22",color:resColor,border:`1px solid ${resColor}55`}}>{res}</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={S.gameOpp}>vs {g.opponent||"Opposition"}</div>
                <div style={S.gameDate}>{new Date(g.date).toLocaleDateString()}</div>
                {(()=>{
                  const scorers=[...new Set((g.goals||[]).filter(x=>x.team==="us").map(x=>x.scorer))];
                  const potmArr=Array.isArray(g.potm)?g.potm:(g.potm?[g.potm]:[]);
                  return (<div style={{display:"flex",gap:6,marginTop:3,flexWrap:"wrap"}}>
                    {scorers.length>0&&<span style={{fontSize:9,color:"#FDE68A",fontWeight:600}}>⚽ {scorers.join(", ")}</span>}
                    {potmArr.length>0&&<span style={{fontSize:9,color:"#fcd34d",fontWeight:600}}>⭐ {potmArr.join(", ")}</span>}
                  </div>);
                })()}
              </div>
              <div style={S.gameScore}>{sc.us}–{sc.them}</div>
              <button style={S.btnTinyX} onClick={e=>{e.stopPropagation();onDeleteGame(g.id);}}>✕</button>
            </div>
          );
        })}
        <div style={{borderTop:"1px solid #1E1400",paddingTop:10,marginTop:4}}>
          <button style={S.btnGhost} onClick={onBack}>← Menu</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  SCREEN: SEASON HUB (tabbed)
// ════════════════════════════════════════════════════════════════════════════════
function SeasonHubScreen({ games, onBack, onOpenGame, onDeleteGame }) {
  const [subScreen, setSubScreen] = useState(null); // null | 'log' | 'fixtures' | 'ladder' | 'teams'
  const [teamNotes, setTeamNotes] = useState(() => loadTeamNotes());
  const [selectedTeam, setSelected] = useState('');
  const [noteText, setNoteText]   = useState('');

  const allTeams = [...new Set(FIXTURES.flatMap(f => [f.home, f.away]))].sort();
  function selectTeam(name) { setSelected(name); setNoteText(teamNotes[name] || ''); }
  function saveNote() {
    if (!selectedTeam) return;
    const updated = { ...teamNotes, [selectedTeam]: noteText };
    setTeamNotes(updated); saveTeamNotes(updated);
  }

  const { played, wins, draws, losses, gf, ga, gd } = computeSeasonStats();
  const fxScores = loadFxScores();

  // Sub-screen: Game Log
  if (subScreen === 'log') {
    const allRes = getAllResults();
    return (
    <div style={S.page}>
      <div style={{ ...S.card, padding:0, display:'flex', flexDirection:'column', maxHeight:'calc(100vh - max(env(safe-area-inset-top),16px) - max(env(safe-area-inset-bottom),16px) - 32px)' }}>
        <div style={{ padding:'14px 16px 10px', borderBottom:'1px solid #1E1400', flexShrink:0 }}>
          <h2 style={{ margin:'4px 0 0', fontSize:18, fontWeight:800, color:'#FFFFFF' }}>📋 Game Log</h2>
          <p style={{ margin:'4px 0 0', fontSize:11, color:'#A1A1A1' }}>{allRes.length} result{allRes.length!==1?'s':''} — fixture results + standalone games</p>
        </div>
        <div style={{ overflowY:'auto', flex:1, padding:'4px 16px 40px' }}>
          {allRes.length === 0 && <p style={{ ...S.sub, padding:'20px 0' }}>No results yet. Enter scores in Fixtures or play a game.</p>}
          {allRes.map(r => {
            const res = r.us > r.them ? 'W' : r.us < r.them ? 'L' : 'D';
            const resColor = res==='W'?'#F5C04A':res==='L'?'#ef4444':'#f59e0b';
            const g = r.game;
            const scorers = g ? [...new Set((g.goals||[]).filter(x=>x.team==='us').map(x=>x.scorer))] : [];
            const potmArr = g ? (Array.isArray(g.potm)?g.potm:(g.potm?[g.potm]:[])) : [];
            const hasDetail = !!g;
            return (
              <div key={r.id} style={{ ...S.gameRow, marginBottom:6, opacity:1 }}
                onClick={() => hasDetail && onOpenGame(g.id)}>
                <div style={{ ...S.resultBadge, background:resColor+'22', color:resColor, border:`1px solid ${resColor}55` }}>{res}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={S.gameOpp}>vs {r.opponent}</div>
                  <div style={S.gameDate}>
                    {r.round ? r.round+' · ' : ''}{r.dateStr}
                    {r.type==='fixture' && <span style={{ fontSize:9, color:'#A1A1A1', marginLeft:4 }}>{r.isHome?'H':'A'}</span>}
                  </div>
                  <div style={{ display:'flex', gap:6, marginTop:3, flexWrap:'wrap' }}>
                    {scorers.length>0 && <span style={{ fontSize:9, color:'#FDE68A', fontWeight:600 }}>⚽ {scorers.join(', ')}</span>}
                    {potmArr.length>0  && <span style={{ fontSize:9, color:'#fcd34d', fontWeight:600 }}>⭐ {potmArr.join(', ')}</span>}
                    {!hasDetail && <span style={{ fontSize:9, color:'#A1A1A1', fontWeight:600 }}>fixture only</span>}
                  </div>
                </div>
                <div style={S.gameScore}>{r.us}–{r.them}</div>
                {hasDetail && <button style={S.btnTinyX} onClick={e=>{ e.stopPropagation(); onDeleteGame(g.id); }}>✕</button>}
              </div>
            );
          })}
        </div>
        <div style={{borderTop:"1px solid #1E1400",padding:"10px 14px",paddingBottom:"max(10px,env(safe-area-inset-bottom))",flexShrink:0}}><button onClick={()=>setSubScreen(null)} style={S.backBtn}>← Season</button></div>
      </div>
    </div>
  );}

  // Sub-screen: Fixtures
  if (subScreen === 'fixtures') return (
    <div style={S.page}>
      <div style={{ ...S.card, padding:0, display:'flex', flexDirection:'column', maxHeight:'calc(100vh - max(env(safe-area-inset-top),16px) - max(env(safe-area-inset-bottom),16px) - 32px)' }}>
        <div style={{ padding:'14px 16px 10px', borderBottom:'1px solid #1E1400', flexShrink:0 }}>
          <h2 style={{ margin:'4px 0 0', fontSize:18, fontWeight:800, color:'#FFFFFF' }}>📅 Fixtures</h2>
        </div>
        <div style={{ overflowY:'auto', flex:1 }}><FixturesScreen embedded /></div>
        <div style={{borderTop:"1px solid #1E1400",padding:"10px 14px",paddingBottom:"max(10px,env(safe-area-inset-bottom))",flexShrink:0}}><button onClick={()=>setSubScreen(null)} style={S.backBtn}>← Season</button></div>
      </div>
    </div>
  );

  // Sub-screen: Ladder
  if (subScreen === 'ladder') return (
    <div style={S.page}>
      <div style={{ ...S.card, padding:0, display:'flex', flexDirection:'column', maxHeight:'calc(100vh - max(env(safe-area-inset-top),16px) - max(env(safe-area-inset-bottom),16px) - 32px)' }}>
        <div style={{ padding:'14px 16px 10px', borderBottom:'1px solid #1E1400', flexShrink:0 }}>
          <h2 style={{ margin:'4px 0 0', fontSize:18, fontWeight:800, color:'#FFFFFF' }}>🏅 Ladder</h2>
        </div>
        <div style={{ overflowY:'auto', flex:1, padding:'0 16px 20px' }}><LadderScreen embedded /></div>
        <div style={{borderTop:"1px solid #1E1400",padding:"10px 14px",paddingBottom:"max(10px,env(safe-area-inset-bottom))",flexShrink:0}}><button onClick={()=>setSubScreen(null)} style={S.backBtn}>← Season</button></div>
      </div>
    </div>
  );

  // Sub-screen: Teams
  if (subScreen === 'teams') return (
    <div style={S.page}>
      <div style={{ ...S.card, padding:0, display:'flex', flexDirection:'column', maxHeight:'calc(100vh - max(env(safe-area-inset-top),16px) - max(env(safe-area-inset-bottom),16px) - 32px)' }}>
        <div style={{ padding:'14px 16px 10px', borderBottom:'1px solid #1E1400', flexShrink:0 }}>
          <h2 style={{ margin:'4px 0 0', fontSize:18, fontWeight:800, color:'#FFFFFF' }}>👥 Teams</h2>
        </div>
        <div style={{ overflowY:'auto', flex:1, padding:'14px 16px 40px' }}>
          <select value={selectedTeam} onChange={e => selectTeam(e.target.value)}
            style={{ width:'100%', padding:'8px 10px', borderRadius:8, background:'#0D0D0D', color:'#FFFFFF', border:'1px solid #2A2A2A', fontSize:13, marginBottom:14 }}>
            <option value=''>— Select an opponent team —</option>
            {allTeams.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          {selectedTeam && (
            <>
              <OpponentStatsScreen opponent={selectedTeam} embedded teamNotes={teamNotes[selectedTeam] || ''} />
              <div style={{ marginTop:16, borderTop:'1px solid #1E1400', paddingTop:16 }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#A1A1A1', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>📝 Coach Notes</div>
                <textarea value={noteText} onChange={e => setNoteText(e.target.value)}
                  placeholder="Add scouting notes — included in the AI scout report above."
                  style={{ width:'100%', minHeight:90, padding:'10px 12px', background:'#0D0D0D', border:'1px solid #2A2A2A', borderRadius:10, color:'#FFFFFF', fontSize:13, lineHeight:1.6, resize:'vertical', fontFamily:'inherit', outline:'none' }}
                />
                <button onClick={saveNote} style={{ ...S.btnGreen, width:'100%', padding:'10px 0', marginTop:8, fontSize:13 }}>
                  Save Notes
                </button>
              </div>
            </>
          )}
        </div>
        <div style={{borderTop:"1px solid #1E1400",padding:"10px 14px",paddingBottom:"max(10px,env(safe-area-inset-bottom))",flexShrink:0}}><button onClick={()=>setSubScreen(null)} style={S.backBtn}>← Season</button></div>
      </div>
    </div>
  );

  // Default: 4-tile hub
  return (
    <div style={S.page}>
      <div style={S.card}>
        <h1 style={S.h1}>📅 Season</h1>
        {played > 0 && (
          <div style={S.scoreTile}>
            <div style={{ display:'flex' }}>
              <div style={S.scoreTileStat}><div style={S.scoreTileNum}>{played}</div><div style={S.scoreTileLbl}>Played</div></div>
              <div style={S.scoreTileStat}><div style={{ ...S.scoreTileNum, color:'#FCD34D' }}>{wins}</div><div style={S.scoreTileLbl}>Won</div></div>
              <div style={S.scoreTileStat}><div style={{ ...S.scoreTileNum, color:'#fcd34d' }}>{draws}</div><div style={S.scoreTileLbl}>Drawn</div></div>
              <div style={S.scoreTileStat}><div style={{ ...S.scoreTileNum, color:'#f87171' }}>{losses}</div><div style={S.scoreTileLbl}>Lost</div></div>
            </div>
          </div>
        )}
        <div style={S.tileGrid}>
          <button style={{ ...S.tile, background:'#0D0D0D', border:'1px solid #1E1400' }} onClick={() => setSubScreen('log')}>
            <span style={S.tileIcon}>📋</span>
            <span style={S.tileLbl}>Game Log</span>
            {games.length > 0 && <span style={{ fontSize:10, color:'#A1A1A1' }}>{games.length} game{games.length!==1?'s':''}</span>}
          </button>
          <button style={{ ...S.tile, background:'#0D0D0D', border:'1px solid #1E1400' }} onClick={() => setSubScreen('fixtures')}>
            <span style={S.tileIcon}>📅</span>
            <span style={S.tileLbl}>Fixtures</span>
          </button>
          <button style={{ ...S.tile, background:'#0D0D0D', border:'1px solid #1E1400' }} onClick={() => setSubScreen('ladder')}>
            <span style={S.tileIcon}>🏅</span>
            <span style={S.tileLbl}>Ladder</span>
          </button>
          <button style={{ ...S.tile, background:'#0D0D0D', border:'1px solid #1E1400' }} onClick={() => setSubScreen('teams')}>
            <span style={S.tileIcon}>👥</span>
            <span style={S.tileLbl}>Teams</span>
          </button>
        </div>

        <div style={{borderTop:"1px solid #1E1400",padding:"10px 14px",paddingBottom:"max(10px,env(safe-area-inset-bottom))",flexShrink:0}}><button onClick={onBack} style={S.backBtn}>← Menu</button></div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  SCREEN: TEAM HUB
// ════════════════════════════════════════════════════════════════════════════════
function TeamScreen({ onBack, onViewStats, onManageSquad }) {
  return (
    <div style={S.page}>
      <div style={S.card}>
        <h1 style={S.h1}>👥 Team</h1>
        <div style={S.tileGrid}>
          <button style={{...S.tile, background:'#1E1400', border:'1px solid #F5C04A33'}} onClick={onViewStats}>
            <span style={S.tileIcon}>📊</span><span style={S.tileLbl}>Player Stats</span>
          </button>
          <button style={{...S.tile, background:'#1A1A1A', border:'1px solid #2A2A2A'}} onClick={onManageSquad}>
            <span style={S.tileIcon}>🗒️</span><span style={S.tileLbl}>Manage Squad</span>
          </button>
        </div>
        <div style={{borderTop:"1px solid #1E1400",padding:"10px 14px",paddingBottom:"max(10px,env(safe-area-inset-bottom))",flexShrink:0}}><button onClick={onBack} style={S.backBtn}>← Menu</button></div>
      </div>
    </div>
  );
}

// ── Mini pitch ─────────────────────────────────────────────────────────────────
function MiniPitch({ slots, positions }) {
  if(!slots) return null;
  return (
    <div style={{position:"relative",width:"100%",aspectRatio:"0.68",borderRadius:12,overflow:"hidden",border:"2px solid #F5C04A44",background:"linear-gradient(180deg,#4A2B00 0%,#3D2000 50%,#4A2B00 100%)"}}>
      <div style={{position:"absolute",top:"50%",left:0,right:0,height:1.5,background:"#ffffff18",pointerEvents:"none"}}/>
      <div style={{position:"absolute",top:"50%",left:"50%",transform:"translate(-50%,-50%)",width:"30%",paddingBottom:"30%",border:"1.5px solid #ffffff18",borderRadius:"50%",pointerEvents:"none"}}/>
      <div style={{position:"absolute",top:0,left:"25%",right:"25%",height:"13%",border:"1.5px solid #ffffff18",borderTop:"none",pointerEvents:"none"}}/>
      <div style={{position:"absolute",bottom:0,left:"25%",right:"25%",height:"13%",border:"1.5px solid #ffffff18",borderBottom:"none",pointerEvents:"none"}}/>
      {positions.map(pos=>{
        const name=slots[pos.id];
        return (
          <div key={pos.id} style={{position:"absolute",left:pos.left,top:pos.top,transform:`translateX(${pos.tx})`,display:"flex",flexDirection:"column",alignItems:"center",gap:2,zIndex:1}}>
            {name
              ? <div style={{background:"#1E1400",borderRadius:6,padding:"3px 6px",fontSize:9,fontWeight:700,color:"#fff",textAlign:"center",maxWidth:58,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",border:"1px solid #3b82f644"}}>{name}</div>
              : <div style={{width:40,height:18,border:"1.5px dashed #ffffff25",borderRadius:6}}/>
            }
 
            <span style={{fontSize:6,color:"#ffffff55",fontWeight:600,letterSpacing:0.3,textTransform:"uppercase",textAlign:"center"}}>{pos.label}</span>
          </div>
        );
      })}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  SCREEN: SAVED GAME DETAIL
// ════════════════════════════════════════════════════════════════════════════════
function GameDetailScreen({ game, onBack, onUpdateGame }) {
  const fxScores = loadFxScores();
  const sc = getScore(game, fxScores);
  const [report, setReport] = useState(game.report||buildLocalReport(game));
  const [loading, setLoading] = useState(false);
  const [potm, setPotm] = useState(game.potm||"");
  const [view, setView] = useState("summary");
  const [lineupHalf, setLineupHalf] = useState(0);
  const [lineupPeriod, setLineupPeriod] = useState(0);

  const formation = game.config?.formation || DEFAULT_FORMATION;
  const positions = getPositions(formation);
  const halves = game.halves || [];
  const startingSlots = halves?.[0]?.[0]?.slots;
  const gk = startingSlots?.gk || "—";

  const usGoals  = (game.goals||[]).filter(g=>g.team==="us");
  const themGoals= (game.goals||[]).filter(g=>g.team==="them");

  const allPlayers = startingSlots
    ? [...new Set([...positions.map(p=>startingSlots[p.id]).filter(Boolean),...(startingSlots.bench||[])])]
    : [];

  function handlePotm(name) {
    setPotm(name);
    if (onUpdateGame) onUpdateGame({...game,potm:name});
  }

  async function regenerateAI() {
    setLoading(true);
    try { const text=await generateAIReport({...game,potm}); setReport(text); if(onUpdateGame) onUpdateGame({...game,potm,report:text}); }
    catch { setReport(buildLocalReport(game)); }
    setLoading(false);
  }

  const curSlots = halves?.[lineupHalf]?.[lineupPeriod]?.slots;
  const numHalves = halves.length;
  const numPeriods = halves[lineupHalf]?.length || 0;

  return (
    <div style={S.page}>
      <div style={{...S.card,maxWidth:460}}>
        <h1 style={S.h1}>vs {game.opponent||"Opposition"}</h1>
        <div style={S.detailScore}>{sc.us} – {sc.them}</div>
        <div style={S.sub}>{new Date(game.date).toLocaleDateString(undefined,{weekday:"long",month:"long",day:"numeric"})}</div>

        <div style={{display:"flex",gap:6}}>
          {[["summary","📋 Summary"],["lineup","🟩 Lineup"],[game.matchEvents?.length?"events":"events","📊 Events"]].map(([k,l])=>(
            <button key={k} style={{...S.tab,...(view===k?S.tabOn:{}),flex:1}} onClick={()=>setView(k)}>{l}</button>
          ))}
        </div>

        {view==="summary" && <>
          <div style={S.factGrid}>
            <div style={S.factCard}><div style={S.factLbl}>🧤 Goalkeeper</div><div style={S.factVal}>{gk}</div></div>
            <div style={S.factCard}><div style={S.factLbl}>📐 Formation</div><div style={S.factVal}>{formation}</div></div>
            {potm && <div style={{...S.factCard,gridColumn:"1/-1"}}><div style={S.factLbl}>⭐ Player of the Match</div><div style={{...S.factVal,color:"#fcd34d"}}>{potm}</div></div>}
          </div>
          {usGoals.length>0 && (
            <div style={S.scorerBox}>
              <div style={S.scorerHd}>⚽ Our Goals</div>
              {usGoals.map((g,i)=>(
                <div key={i} style={S.scorerRow}>
                  <span style={{color:"#FDE68A",fontWeight:700}}>{g.scorer}</span>
                  <span style={{color:"#A1A1A1",fontSize:11}}>{g.position?`(${g.position}) `:""}H{g.half} {g.timeStr}</span>
                </div>
              ))}
            </div>
          )}
          {themGoals.length>0 && (
            <div style={{...S.scorerBox,borderColor:"#ef444433"}}>
              <div style={{...S.scorerHd,color:"#fca5a5"}}>⚽ Opposition Goals</div>
              {themGoals.map((g,i)=>(
                <div key={i} style={S.scorerRow}><span style={{color:"#fca5a5"}}>Opponent</span><span style={{color:"#A1A1A1",fontSize:11}}>H{g.half} {g.timeStr}</span></div>
              ))}
            </div>
          )}
          <div>
            <div style={S.fieldLbl}>⭐ Player of the Match</div>
            <select style={S.sel} value={potm} onChange={e=>handlePotm(e.target.value)}>
              <option value="">— select —</option>
              {allPlayers.map(n=><option key={n} value={n}>{n}</option>)}
            </select>
          </div>
          {game.voiceNotes && (
            <div style={{background:"#0c1a0c",border:"1px solid #F5C04A33",borderRadius:10,padding:"10px 14px",marginBottom:10}}>
              <div style={{fontSize:11,fontWeight:700,color:"#FCD34D",letterSpacing:1,marginBottom:6}}>🎙️ VOICE NOTES</div>
              <div style={{fontSize:13,color:"#d1fae5",whiteSpace:"pre-wrap",lineHeight:1.6}}>{game.voiceNotes}</div>
            </div>
          )}
          <div style={S.reportBox}>{loading?"✨ Generating…":report}</div>
          {!loading&&(
            <div style={{display:"flex",gap:8}}>
              <button style={{...S.btnDark,flex:1}} onClick={()=>navigator.clipboard?.writeText(report)}>Copy</button>
              <button style={{...S.btnBlue,flex:1}} onClick={regenerateAI}>✨ AI Rewrite</button>
            </div>
          )}
        </>}

        {view==="events" && (() => {
          const evts = game.matchEvents||[];
          const goalEvts = (game.goals||[]).map(g=>({id:'g_'+g.secs+'_'+g.team,type:'GOAL',team:g.team,minute:Math.floor(g.secs/60),timestamp:g.secs*1000,player:g.team==='us'?g.scorer:'Opponent',notes:'',_fromGoals:true}));
          const evGoalKeys=new Set(evts.filter(e=>e.type==='GOAL').map(e=>e.team+'_'+e.minute));
          const filteredGoals=goalEvts.filter(ge=>!evGoalKeys.has(ge.team+'_'+ge.minute));
          const all=[...evts,...filteredGoals].sort((a,b)=>a.minute-b.minute||a.timestamp-b.timestamp);
          const usCt={},themCt={};
          MATCH_EVENT_RULES.forEach(r=>{usCt[r.type]=0;themCt[r.type]=0;});
          all.forEach(ev=>{if(ev.team==='us')usCt[ev.type]=(usCt[ev.type]||0)+1;else if(ev.team==='them')themCt[ev.type]=(themCt[ev.type]||0)+1;});
          const maxSt=Math.max(...MATCH_EVENT_RULES.map(r=>Math.max(usCt[r.type]||0,themCt[r.type]||0)),1);
          return (
            <div>
              {all.length===0 && <p style={{...S.sub,textAlign:"center"}}>No events recorded for this match.</p>}
              {/* Stats bars */}
              {all.length>0 && (
                <div style={{marginBottom:16}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                    <span style={{fontSize:12,fontWeight:700,color:"#FCD34D"}}>⭐ Us</span>
                    <span style={{fontSize:11,color:"#A1A1A1"}}>Stats</span>
                    <span style={{fontSize:12,fontWeight:700,color:"#fca5a5"}}>{game.opponent||"Them"}</span>
                  </div>
                  {MATCH_EVENT_RULES.filter(r=>r.type!=='NOTE').map(rule=>{
                    const us=usCt[rule.type]||0,them=themCt[rule.type]||0;
                    if(us===0&&them===0)return null;
                    return (<div key={rule.type} style={{marginBottom:10}}>
                      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:3}}>
                        <span style={{fontSize:13,fontWeight:800,color:"#FCD34D",minWidth:20}}>{us}</span>
                        <span style={{fontSize:11,color:"#A1A1A1"}}>{rule.icon} {rule.label}</span>
                        <span style={{fontSize:13,fontWeight:800,color:"#fca5a5",minWidth:20,textAlign:"right"}}>{them}</span>
                      </div>
                      <div style={{position:"relative",height:5,background:"#1A1A1A",borderRadius:3}}>
                        <div style={{position:"absolute",right:"50%",top:0,height:"100%",width:(us/maxSt*50)+"%",background:"#F5C04A",borderRadius:"3px 0 0 3px"}}/>
                        <div style={{position:"absolute",left:"50%",top:0,height:"100%",width:(them/maxSt*50)+"%",background:"#ef4444",borderRadius:"0 3px 3px 0"}}/>
                        <div style={{position:"absolute",left:"50%",top:-2,width:1,height:9,background:"#A1A1A1"}}/>
                      </div>
                    </div>);
                  })}
                </div>
              )}
              {/* Timeline */}
              {all.length>0 && <div style={{fontSize:11,fontWeight:700,color:"#A1A1A1",textTransform:"uppercase",letterSpacing:1,marginBottom:8}}>Timeline</div>}
              {all.map(ev=>{
                const rule=MATCH_EVENT_RULES.find(r=>r.type===ev.type)||MATCH_EVENT_RULES[MATCH_EVENT_RULES.length-1];
                return (<div key={ev.id} style={{background:"#0D0D0D",borderLeft:"3px solid "+rule.color,borderRadius:"0 8px 8px 0",padding:"7px 10px",marginBottom:5,display:"flex",alignItems:"flex-start",gap:8}}>
                  <div style={{fontSize:10,color:"#A1A1A1",fontWeight:700,minWidth:28,paddingTop:2}}>{ev.minute}'</div>
                  <div style={{fontSize:15}}>{rule.icon}</div>
                  <div style={{flex:1}}>
                    <div style={{display:"flex",alignItems:"center",gap:5,flexWrap:"wrap"}}>
                      <span style={{fontSize:12,fontWeight:700,color:rule.color}}>{rule.label}</span>
                      {ev.team&&<span style={{fontSize:10,color:ev.team==="us"?"#FCD34D":"#fca5a5",background:ev.team==="us"?"#110D0033":"#7f1d1d33",borderRadius:4,padding:"1px 5px"}}>{ev.team==="us"?"Us":game.opponent||"Them"}</span>}
                    </div>
                    {ev.player&&<div style={{fontSize:11,color:"#A1A1A1"}}>👤 {ev.player}</div>}
                    {ev.notes&&<div style={{fontSize:11,color:"#A1A1A1"}}>{ev.notes}</div>}
                  </div>
                </div>);
              })}
            </div>
          );
        })()}

        {view==="lineup" && (
          <>
            {numHalves > 1 && (
              <div style={{display:"flex",gap:6,marginBottom:6}}>
                {halves.map((_,i)=>(
                  <button key={i} style={{...S.tab,...(i===lineupHalf?S.tabOn:{}),flex:1}} onClick={()=>{setLineupHalf(i);setLineupPeriod(0);}}>
                    {i===0?"1st Half":"2nd Half"}
                  </button>
                ))}
              </div>
            )}
            {numPeriods > 1 && (
              <div style={{display:"flex",gap:4,marginBottom:6,flexWrap:"wrap"}}>
                {Array.from({length:numPeriods},(_,i)=>(
                  <button key={i} style={{...S.tab,...(i===lineupPeriod?S.tabOn:{})}} onClick={()=>setLineupPeriod(i)}>
                    P{i+1}
                  </button>
                ))}
              </div>
            )}
            {curSlots
              ? <>
                  <p style={{...S.sub,fontSize:11}}>H{lineupHalf+1} P{lineupPeriod+1} · {formation}</p>
                  <MiniPitch slots={curSlots} positions={positions} />
                  {(curSlots.bench||[]).length>0 && (
                    <div style={S.benchPreview}><span style={S.benchPreviewHd}>Bench: </span>{curSlots.bench.join(", ")}</div>
                  )}
                </>
              : <p style={S.sub}>No lineup data for this period.</p>
            }
          </>
        )}
        <div style={{borderTop:"1px solid #1E1400",paddingTop:10,marginTop:4}}>
          <button style={S.btnGhost} onClick={onBack}>← Season Log</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  SCREEN: SQUAD + new game setup
// ════════════════════════════════════════════════════════════════════════════════
function SquadScreen({ mode, onNext, onBack, onViewOpponent }) {
  const [squad, setSquad]   = useState(()=>loadSquad());
  const [config, setConfig] = useState(()=>loadConfig());
  const [input, setInput]   = useState("");

  // Pre-fill opponent from next fixture
  const myTeam = localStorage.getItem('soccerCoach_fixtureTeam') || '';
  const nextFix = FIXTURES.find(f=>(f.home===myTeam||f.away===myTeam)&&isUpcoming(f));
  const suggestedOpponent = nextFix ? (nextFix.home===myTeam?nextFix.away:nextFix.home) : '';
  const [opponent, setOpponent] = useState(suggestedOpponent);

  function persist(next){ setSquad(next); saveSquad(next); }
  function addPlayer(){ const name=input.trim(); if(!name||squad.some(p=>p.name===name))return; persist([...squad,{name,pos:"",pos2:"",pos3:""}]); setInput(""); }
  function remove(name){ persist(squad.filter(p=>p.name!==name)); }
  function setPos(name,field,val){ persist(squad.map(p=>p.name===name?{...p,[field]:val}:p)); }
  function updCfg(key,val){ const next={...config,[key]:val}; setConfig(next); saveConfig(next); }

  const isNewGame = mode==="newGame";
  const pm = getPeriodMins(config);
  const pmDisplay = Number.isInteger(pm) ? `${pm}` : pm.toFixed(1);

  const posOpts = <><option value="">—</option>{ALL_POSITIONS.map(p=><option key={p.id} value={p.id}>{p.label}</option>)}</>;

  return (
    <div style={S.page}>
      <div style={S.card}>
        <div style={S.pill}>{config.formation||DEFAULT_FORMATION}</div>
        <h1 style={S.h1}>{isNewGame?"New Game":"Manage Squad"}</h1>

        {/* Players — always at top */}
        <div style={S.fieldLbl}>Players {squad.length>0&&`(${squad.length})`}</div>
        <div style={{display:"flex",gap:8,marginBottom:8}}>
          <input style={S.inp} placeholder="Player name…" value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&addPlayer()} />
          <button style={S.btnAdd} onClick={addPlayer}>Add</button>
        </div>
        <div style={S.squadList}>
          {squad.length===0&&<div style={S.empty}>No players yet.</div>}
          {squad.map((p,i)=>(
            <div key={p.name} style={{...S.squadRow,flexDirection:"column",alignItems:"stretch",gap:6,padding:"10px 10px"}}>
              <div style={{display:"flex",alignItems:"center",gap:8}}>
                <span style={S.squadNum}>{i+1}</span>
                <span style={{...S.squadName,flex:1}}>{p.name}</span>
                <button style={S.btnX} onClick={()=>remove(p.name)}>✕</button>
              </div>
              <div style={{display:"flex",gap:6,paddingLeft:28}}>
                <div style={{flex:1}}>
                  <div style={{fontSize:9,color:"#A1A1A1",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>Primary</div>
                  <select style={{...S.posSel,width:"100%"}} value={p.pos||""} onChange={e=>setPos(p.name,"pos",e.target.value)}>{posOpts}</select>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:9,color:"#A1A1A1",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>Alt 1</div>
                  <select style={{...S.posSel,width:"100%"}} value={p.pos2||""} onChange={e=>setPos(p.name,"pos2",e.target.value)}>{posOpts}</select>
                </div>
                <div style={{flex:1}}>
                  <div style={{fontSize:9,color:"#A1A1A1",fontWeight:700,textTransform:"uppercase",letterSpacing:1,marginBottom:2}}>Alt 2</div>
                  <select style={{...S.posSel,width:"100%"}} value={p.pos3||""} onChange={e=>setPos(p.name,"pos3",e.target.value)}>{posOpts}</select>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* New Game bottom section */}
        {isNewGame && (<>
          <div style={{marginTop:8}}>
            <div style={S.fieldLbl}>Opponent</div>
            <div style={{display:"flex",gap:6}}>
              <input style={{...S.inp,flex:1}} placeholder="e.g. Riverside Rovers" value={opponent} onChange={e=>setOpponent(e.target.value)} />
              {opponent.trim() && onViewOpponent && (
                <button style={{...S.btnAdd,background:"#1E1400",border:"1px solid #F5C04A33",fontSize:11,padding:"9px 10px",whiteSpace:"nowrap"}} onClick={()=>onViewOpponent(opponent.trim())}>🔍 Scout</button>
              )}
            </div>
            {suggestedOpponent && opponent===suggestedOpponent && (
              <div style={{fontSize:11,color:"#60a5fa",marginTop:4}}>📅 From next fixture — tap to change</div>
            )}
          </div>
          <div style={S.configBox}>
            <div style={S.configHd}>⚙️ Match Settings</div>
            <div style={S.configRow}>
              <label style={S.configLbl}>Formation</label>
              <select style={{...S.posSel,maxWidth:120}} value={config.formation||DEFAULT_FORMATION} onChange={e=>updCfg("formation",e.target.value)}>
                {Object.keys(FORMATIONS).map(f=><option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div style={S.configRow}>
              <label style={S.configLbl}>Half length</label>
              <div style={S.configVal}>
                <button style={S.stepBtn} onClick={()=>updCfg("halfMins",Math.max(5,config.halfMins-5))}>−</button>
                <span style={S.stepNum}>{config.halfMins} min</span>
                <button style={S.stepBtn} onClick={()=>updCfg("halfMins",Math.min(60,config.halfMins+5))}>+</button>
              </div>
            </div>
            <div style={S.configRow}>
              <label style={S.configLbl}>Periods / half</label>
              <div style={S.configVal}>
                <button style={S.stepBtn} onClick={()=>updCfg("numPeriods",Math.max(1,config.numPeriods-1))}>−</button>
                <span style={S.stepNum}>{config.numPeriods}</span>
                <button style={S.stepBtn} onClick={()=>updCfg("numPeriods",Math.min(6,config.numPeriods+1))}>+</button>
              </div>
            </div>
            <div style={{fontSize:11,color:"#F5C04A",textAlign:"center"}}>= {pmDisplay} min per period</div>
          </div>
          <button style={{...S.btnGreen,opacity:squad.length<9?0.4:1}} disabled={squad.length<9} onClick={()=>{
              const opp = opponent.trim();
              const mt  = localStorage.getItem('soccerCoach_fixtureTeam')||'';
              const mf  = FIXTURES.find(f=>isUpcoming(f)&&((f.home===mt&&f.away===opp)||(f.away===mt&&f.home===opp)));
              onNext(squad,config,opp, mf?fixtureKey(mf):null, mf?mf.home===mt:null);
            }}>
            Pick Starting XI →
          </button>
          {squad.length<9&&<p style={S.warn}>Need at least 9 players.</p>}
        </>)}

        {!isNewGame && <button style={S.btnGreen} onClick={onBack}>Done</button>}
        {isNewGame && <div style={{borderTop:"1px solid #1E1400",paddingTop:10,marginTop:4}}><button style={S.btnGhost} onClick={onBack}>← Back</button></div>}
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  SCREEN: LINEUP PICKER
// ════════════════════════════════════════════════════════════════════════════════
function PickerScreen({ squad, config, opponent, onNext, onBack }) {
  const positions = getPositions(config.formation);
  const posIds    = getPosIds(positions);
  const names     = squad.map(p=>p.name);
  const [slots, setSlots] = useState(()=>{
    const s={}; posIds.forEach(id=>s[id]="");
    // First pass: fill by position match (primary, then alts)
    squad.forEach(p=>{ [p.pos,p.pos2,p.pos3].filter(Boolean).forEach(pos=>{ if(posIds.includes(pos)&&!s[pos]) s[pos]=p.name; }); });
    // Second pass: greedy fill any remaining slots with unassigned players
    const used=new Set(Object.values(s).filter(Boolean));
    const remaining=[...squad.map(p=>p.name).filter(n=>!used.has(n))];
    posIds.forEach(id=>{ if(!s[id]&&remaining.length) s[id]=remaining.shift(); });
    return s;
  });
  const assigned = Object.values(slots).filter(Boolean);
  const bench    = names.filter(n=>!assigned.includes(n));

  function set(posId,name){
    setSlots(prev=>{ const next={...prev}; Object.keys(next).forEach(k=>{if(next[k]===name&&k!==posId)next[k]="";}); next[posId]=name; return next; });
  }
  function canStart(){ return positions.every(p=>slots[p.id]); }
  function buildHalf(){
    const base={...slots,bench:names.filter(n=>!Object.values(slots).includes(n))};
    return Array.from({length:config.numPeriods},(_,i)=>({slots:cloneSlots(base),seeded:i===0}));
  }

  return (
    <div style={S.page}>
      <div style={{...S.card,maxWidth:420}}>
        <h1 style={S.h1}>Starting Lineup</h1>
        <p style={S.sub}>vs {opponent||"Opposition"} · {config.formation||DEFAULT_FORMATION}</p>
        <div style={S.pickerGrid}>
          {positions.map(pos=>(
            <div key={pos.id} style={S.pickerRow}>
              <span style={S.pickerLabel}>{pos.label}</span>
              <select style={S.sel} value={slots[pos.id]} onChange={e=>set(pos.id,e.target.value)}>
                <option value="">— select —</option>
                {names.map(name=>(<option key={name} value={name} disabled={assigned.includes(name)&&slots[pos.id]!==name}>{name}{assigned.includes(name)&&slots[pos.id]!==name?" ✓":""}</option>))}
              </select>
            </div>
          ))}
        </div>
        {bench.length>0&&<div style={S.benchPreview}><span style={S.benchPreviewHd}>Bench: </span>{bench.join(", ")}</div>}
        <button style={{...S.btnGreen,opacity:canStart()?1:0.4}} disabled={!canStart()} onClick={()=>onNext(buildHalf())}>Start Match →</button>
        {!canStart()&&<p style={S.warn}>Assign all {positions.length} positions to continue.</p>}
        <div style={{borderTop:"1px solid #1E1400",paddingTop:10,marginTop:4}}>
          <button style={S.btnGhost} onClick={onBack}>← Back</button>
        </div>
      </div>
    </div>
  );
}

// ── Token ─────────────────────────────────────────────────────────────────────
function Token({ name, color, selected, onTap, onDragStart }) {
  const bg=color||(selected?"#7c3aed":"#1E1400");
  return (
    <div draggable={!!onDragStart} onDragStart={onDragStart} onClick={onTap}
      style={{...S.token,background:bg,boxShadow:selected?"0 0 0 3px #a78bfa":color?`0 0 0 2.5px ${color}`:"none",transform:selected?"scale(1.1)":"none",cursor:"pointer"}}>
      {name}
    </div>
  );
}

// ── Goal Modal ────────────────────────────────────────────────────────────────
function GoalModal({ squad, slots, posIds, posLabel, onLog, onClose }) {
  const [scorer, setScorer] = useState("");
  const posOf=(name)=>{ const id=posIds.find(id=>slots[id]===name); return id?posLabel[id]:"Bench"; };
  return (
    <div style={S.modalBack} onClick={onClose}>
      <div style={S.modalBox} onClick={e=>e.stopPropagation()}>
        <div style={S.modalTitle}>⚽ Log Our Goal</div>
        <div style={S.modalLbl}>Scorer</div>
        <select style={S.sel} value={scorer} onChange={e=>setScorer(e.target.value)}>
          <option value="">— select player —</option>
          {squad.map(p=><option key={p.name} value={p.name}>{p.name}</option>)}
        </select>
        {scorer&&<div style={{fontSize:12,color:"#06b6d4",marginTop:2}}>Position: {posOf(scorer)}</div>}
        <div style={{display:"flex",gap:8,marginTop:8}}>
          <button style={{...S.btnGreen,flex:1,opacity:scorer?1:0.4}} disabled={!scorer} onClick={()=>{onLog(scorer,posOf(scorer));onClose();}}>Log Goal</button>
          <button style={S.btnCancel} onClick={onClose}>Cancel</button>
        </div>
        <div style={{borderTop:"1px solid #1E1400",paddingTop:10,marginTop:4}}>
          <button style={S.btnGhost} onClick={onBack}>← Back</button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  SCREEN: MATCH
// ════════════════════════════════════════════════════════════════════════════════

// ─── MATCH EVENT RULES ────────────────────────────────────────────────────────
const MATCH_EVENT_RULES = [
  { type:"GOAL",         icon:"⚽", color:"#F5D53F", label:"Goal"             },
  { type:"SHOT",         icon:"🎯", color:"#60a5fa", label:"Shot"             },
  { type:"CORNER",       icon:"🚩", color:"#f97316", label:"Corner"           },
  { type:"FOUL",         icon:"⚠️", color:"#ef4444", label:"Foul / Free Kick" },
  { type:"YELLOW",       icon:"🟨", color:"#fcd34d", label:"Yellow Card"      },
  { type:"RED",          icon:"🟥", color:"#dc2626", label:"Red Card"         },
  { type:"SUBSTITUTION", icon:"🔄", color:"#FDE68A", label:"Sub"              },
  { type:"OFFSIDE",      icon:"🚫", color:"#c084fc", label:"Offside"          },
  { type:"INJURY",       icon:"🏥", color:"#fb923c", label:"Injury"           },
  { type:"NOTE",         icon:"📝", color:"#A1A1A1", label:"Note"             },
];

function EventsPage({ halfElapsed, goals, matchEvents, setMatchEvents, onBack, opponentName, ourName, usGoalsLen, themGoalsLen }) {
  const [evTab, setEvTab]             = useState('record');
  const [pendingType, setPendingType] = useState(null);
  const [noteText, setNoteText]       = useState('');
  const [aiText, setAiText]           = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [statusMsg, setStatusMsg]     = useState('');

  const OUR  = ourName   || 'My Team';
  const THEM = opponentName || 'Opposition';
  const matchMinute = Math.floor(halfElapsed / 60);
  const mm = String(Math.floor(halfElapsed/60)).padStart(2,'0');
  const ss = String(halfElapsed%60).padStart(2,'0');

  function makeEv(type,team){ return{id:'ev_'+Date.now()+'_'+Math.random().toString(36).slice(2),type,team,minute:matchMinute,timestamp:Date.now(),player:'',notes:''}; }
  function addEv(type,team,extra={}){
    setMatchEvents(evs=>[...evs,{...makeEv(type,team),...extra}]);
    const rule=MATCH_EVENT_RULES.find(r=>r.type===type);
    const tl=team==='us'?OUR:team==='them'?THEM:'';
    setStatusMsg('checkmark '+(rule?.label||type)+(tl?' — '+tl:'')+' — '+matchMinute+"'");
    setTimeout(()=>setStatusMsg(''),2500);
    setPendingType(null); setNoteText('');
  }
  function removeEv(id){ setMatchEvents(evs=>evs.filter(e=>e.id!==id)); }

  async function processAI(){
    if(!aiText.trim())return;
    setIsProcessing(true); setStatusMsg('Detecting…');
    try{
      const typeList=MATCH_EVENT_RULES.map(r=>r.type).join(', ');
      const prompt='Soccer match. Our team vs '+THEM+'.\nEvent: "'+aiText+'"\nDetect events. Respond ONLY with JSON: {"events":[{"type":"TYPE","team":"us" or "them" or null,"notes":"brief"}]}\nValid types: '+typeList;
      const resp=await fetch('https://api.anthropic.com/v1/messages',{method:'POST',headers:{'Content-Type':'application/json','anthropic-version':'2023-06-01'},body:JSON.stringify({model:'claude-haiku-4-5-20251001',max_tokens:200,messages:[{role:'user',content:prompt}]})});
      const data=await resp.json();
      const txt=(data.content||[]).map(c=>c.text||'').join('').replace(/```json|```/g,'').trim();
      const parsed=JSON.parse(txt);
      const evts=parsed.events||[];
      evts.forEach((ev,i)=>setTimeout(()=>addEv(ev.type||'NOTE',ev.team||null,{notes:ev.notes||aiText,transcript:aiText}),i*50));
      setAiText(''); setStatusMsg('checkmark '+evts.length+' event(s) detected');
    }catch{
      addEv('NOTE',null,{notes:aiText,transcript:aiText});
      setAiText(''); setStatusMsg('Saved as note');
    }
    setIsProcessing(false); setTimeout(()=>setStatusMsg(''),3000);
  }

  // Stats counts
  const usCt={}, themCt={};
  MATCH_EVENT_RULES.forEach(r=>{usCt[r.type]=0;themCt[r.type]=0;});
  matchEvents.forEach(ev=>{
    if(ev.team==='us') usCt[ev.type]=(usCt[ev.type]||0)+1;
    else if(ev.team==='them') themCt[ev.type]=(themCt[ev.type]||0)+1;
  });
  goals.forEach(g=>{ if(g.team==='us')usCt['GOAL']=(usCt['GOAL']||0)+1; else themCt['GOAL']=(themCt['GOAL']||0)+1; });
  const maxStat=Math.max(...MATCH_EVENT_RULES.map(r=>Math.max(usCt[r.type]||0,themCt[r.type]||0)),1);

  // Timeline — merge goals + events, dedup
  const goalEvts=goals.map(g=>({id:'g_'+g.secs+'_'+g.team,type:'GOAL',team:g.team,minute:Math.floor(g.secs/60),timestamp:g.secs*1000,player:g.team==='us'?g.scorer:'Opponent',notes:'',_fromGoals:true}));
  const evGoalKeys=new Set(matchEvents.filter(e=>e.type==='GOAL').map(e=>e.team+'_'+e.minute));
  const filteredGoalEvts=goalEvts.filter(ge=>!evGoalKeys.has(ge.team+'_'+ge.minute));
  const sorted=[...matchEvents,...filteredGoalEvts].sort((a,b)=>a.minute-b.minute||a.timestamp-b.timestamp);

  // Export report
  const now=new Date();
  const dateStr=now.toISOString().split('T')[0];
  const timeStr=now.toLocaleDateString('en-GB')+', '+now.toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',second:'2-digit'});
  const reportLines=[
    'MATCH REPORT','________________________','',
    OUR+' '+usGoalsLen+' - '+themGoalsLen+' '+THEM,'',
    'Date: '+dateStr,'Venue: —','Competition: League','',
    '________________________','',
    'MATCH EVENTS ('+sorted.length+')','________________________',
    ...sorted.map(ev=>{const rule=MATCH_EVENT_RULES.find(r=>r.type===ev.type)||MATCH_EVENT_RULES[MATCH_EVENT_RULES.length-1];const team=ev.team==='us'?OUR:ev.team==='them'?THEM:'';return '  '+ev.minute+"' "+rule.label+(team?' · '+team:'');}),
    '','________________________','','STATISTICS','________________________','',
    ...MATCH_EVENT_RULES.filter(r=>r.type!=='NOTE').map(rule=>(rule.label+'/Free Kick').slice(0,16).padEnd(20)+(usCt[rule.type]||0)+' - '+(themCt[rule.type]||0)),
    '','Generated by Soccer Coach · '+timeStr,
  ];
  const reportText=reportLines.join('\n');
  function downloadTxt(){const blob=new Blob([reportText],{type:'text/plain'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='match-report.txt';a.click();URL.revokeObjectURL(url);}
  function exportJSON(){const blob=new Blob([JSON.stringify({match:{ourTeam:OUR,opponent:THEM,score:{us:usGoalsLen,them:themGoalsLen},date:dateStr},events:matchEvents,goals},null,2)],{type:'application/json'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='match-data.json';a.click();URL.revokeObjectURL(url);}

  const TABS=[{k:'record',icon:'🎙',label:'Record'},{k:'timeline',icon:'📋',label:'Timeline'},{k:'stats',icon:'📊',label:'Stats'},{k:'export',icon:'📤',label:'Export'}];
  const BG='#0a150a', CARD='#163016', BORDER='#0d200d';

  return (
    <div style={{...S.wrap,padding:0,background:BG}}>

      {/* Compact header */}
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'10px 16px',background:BG,borderBottom:'1px solid '+CARD,flexShrink:0,width:'100%',maxWidth:500}}>
        <button style={{...S.btnGhost,borderColor:'#1A1400',color:'#7A5000'}} onClick={onBack}>← Pitch</button>
        <div style={{fontSize:14,fontWeight:800,color:'#FFFFFF'}}>{usGoalsLen} – {themGoalsLen} <span style={{fontSize:11,color:'#7A5000',fontWeight:400}}>{mm}:{ss}</span></div>
        <div style={{width:60}}/>
      </div>

      {/* Khula-style tab bar */}
      <div style={{display:'flex',background:BG,borderBottom:'1px solid '+CARD,flexShrink:0,width:'100%',maxWidth:500}}>
        {TABS.map(({k,icon,label})=>(
          <button key={k} onClick={()=>setEvTab(k)} style={{flex:1,padding:'10px 2px 8px',border:'none',background:'transparent',color:evTab===k?'#fff':'#4a6a4a',fontSize:10,fontWeight:evTab===k?700:400,cursor:'pointer',borderBottom:evTab===k?'2px solid #F5D53F':'2px solid transparent',display:'flex',flexDirection:'column',alignItems:'center',gap:2,transition:'color 0.15s'}}>
            <span style={{fontSize:16}}>{icon}</span>
            <span>{label}</span>
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div style={{flex:1,overflowY:'auto',padding:'16px',background:BG,width:'100%',maxWidth:500,boxSizing:'border-box'}}>

        {/* ── RECORD ── */}
        {evTab==='record' && (
          <div>
            {pendingType && (()=>{
              const rule=MATCH_EVENT_RULES.find(r=>r.type===pendingType)||MATCH_EVENT_RULES[MATCH_EVENT_RULES.length-1];
              return (
                <div style={{background:CARD,border:'2px solid '+rule.color+'55',borderRadius:12,padding:14,marginBottom:14}}>
                  <div style={{fontSize:15,fontWeight:700,color:rule.color,textAlign:'center',marginBottom:12}}>{rule.icon} {rule.label} — which team?</div>
                  {pendingType==='NOTE' ? (
                    <div>
                      <textarea value={noteText} onChange={e=>setNoteText(e.target.value)} rows={2} placeholder="What happened?" style={{...S.inp,resize:'none',width:'100%',marginBottom:8,fontSize:13,background:'#0d200d',borderColor:'#1A1400'}}/>
                      <div style={{display:'flex',gap:6,marginBottom:8}}>
                        <button onClick={()=>addEv('NOTE','us',{notes:noteText})} style={{flex:1,padding:'11px 6px',borderRadius:9,border:'none',background:'#0b3a1a',color:'#FDE68A',fontWeight:700,fontSize:13,cursor:'pointer'}}>⭐ {OUR}</button>
                        <button onClick={()=>addEv('NOTE','them',{notes:noteText})} style={{flex:1,padding:'11px 6px',borderRadius:9,border:'none',background:'#3a0b0b',color:'#fca5a5',fontWeight:700,fontSize:13,cursor:'pointer'}}>{THEM}</button>
                        <button onClick={()=>addEv('NOTE',null,{notes:noteText})} style={{flex:1,padding:'11px 6px',borderRadius:9,border:'none',background:CARD,color:'#9ca3af',fontWeight:700,fontSize:11,cursor:'pointer'}}>General</button>
                      </div>
                      <button onClick={()=>setPendingType(null)} style={{width:'100%',padding:'9px',borderRadius:9,border:'1px solid #1A1400',background:'transparent',color:'#7A5000',fontSize:12,cursor:'pointer'}}>Cancel</button>
                    </div>
                  ) : (
                    <div>
                      <div style={{display:'flex',gap:8,marginBottom:8}}>
                        <button onClick={()=>addEv(pendingType,'us')} style={{flex:1,padding:'14px 8px',borderRadius:9,border:'none',background:'#0b3a1a',color:'#FDE68A',fontWeight:700,fontSize:15,cursor:'pointer'}}>⭐ {OUR}</button>
                        <button onClick={()=>addEv(pendingType,'them')} style={{flex:1,padding:'14px 8px',borderRadius:9,border:'none',background:'#3a0b0b',color:'#fca5a5',fontWeight:700,fontSize:15,cursor:'pointer'}}>{THEM}</button>
                      </div>
                      <button onClick={()=>setPendingType(null)} style={{width:'100%',padding:'9px',borderRadius:9,border:'1px solid #1A1400',background:'transparent',color:'#7A5000',fontSize:12,cursor:'pointer'}}>Cancel</button>
                    </div>
                  )}
                </div>
              );
            })()}

            {statusMsg&&<div style={{background:'#110D00',border:'1px solid #F5C04A44',borderRadius:9,padding:'9px 12px',marginBottom:12}}><span style={{fontSize:13,color:'#FCD34D',fontWeight:600}}>{statusMsg}</span></div>}

            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
              {MATCH_EVENT_RULES.map(rule=>(
                <button key={rule.type} onClick={()=>setPendingType(rule.type)}
                  style={{background:pendingType===rule.type?rule.color+'33':rule.color+'15',border:'2px solid '+(pendingType===rule.type?rule.color:rule.color+'44'),borderRadius:11,padding:'13px 10px',cursor:'pointer',color:rule.color,fontSize:13,fontWeight:700,textAlign:'left',display:'flex',alignItems:'center',gap:9}}>
                  <span style={{fontSize:22}}>{rule.icon}</span><span>{rule.label}</span>
                </button>
              ))}
            </div>

            <div style={{borderTop:'1px solid '+CARD,paddingTop:14}}>
              <div style={{fontSize:11,fontWeight:700,color:'#7A5000',textTransform:'uppercase',letterSpacing:1,marginBottom:8}}>🤖 Describe what happened</div>
              <textarea value={aiText} onChange={e=>setAiText(e.target.value)} rows={3}
                placeholder='e.g. "Corner for us, keeper tipped it over"'
                style={{...S.inp,resize:'none',width:'100%',lineHeight:1.6,fontSize:13,background:'#0d200d',borderColor:'#1A1400'}}/>
              <button onClick={processAI} disabled={isProcessing||!aiText.trim()}
                style={{...S.btnBlue,width:'100%',marginTop:9,fontSize:13,opacity:aiText.trim()&&!isProcessing?1:0.4}}>
                {isProcessing?'Detecting…':'✨ AI Detect & Log'}
              </button>
            </div>
          </div>
        )}

        {/* ── TIMELINE ── */}
        {evTab==='timeline' && (
          <div>
            <div style={{fontSize:11,fontWeight:700,color:'#9ca3af',letterSpacing:1,textTransform:'uppercase',marginBottom:14}}>{sorted.length} EVENTS</div>
            {sorted.length===0&&<p style={{color:'#4a6a4a',textAlign:'center',padding:24,margin:0}}>No events yet — use Record to add some.</p>}
            {sorted.map(ev=>{
              const rule=MATCH_EVENT_RULES.find(r=>r.type===ev.type)||MATCH_EVENT_RULES[MATCH_EVENT_RULES.length-1];
              const teamName=ev.team==='us'?OUR:ev.team==='them'?THEM:null;
              return (
                <div key={ev.id} style={{background:CARD,borderRadius:10,borderLeft:'3px solid '+rule.color,padding:'14px 12px',marginBottom:8,display:'flex',alignItems:'center',gap:10}}>
                  <span style={{fontSize:12,color:'#6a8a6a',minWidth:28,flexShrink:0}}>{ev.minute}'</span>
                  <span style={{fontSize:26,flexShrink:0}}>{rule.icon}</span>
                  <div style={{flex:1,display:'flex',alignItems:'center',gap:8,flexWrap:'wrap'}}>
                    <span style={{fontSize:15,fontWeight:700,color:rule.color}}>{rule.label}</span>
                    {teamName&&<span style={{background:BORDER,color:'#9ca3af',borderRadius:6,padding:'2px 8px',fontSize:12}}>{teamName}</span>}
                    {ev.notes&&<span style={{fontSize:11,color:'#6a8a6a',width:'100%',marginTop:2}}>{ev.notes}</span>}
                  </div>
                  {!ev._fromGoals&&<button style={{background:'none',border:'none',color:'#4a6a4a',fontSize:11,fontWeight:700,cursor:'pointer',flexShrink:0,padding:'4px 6px'}} onClick={()=>removeEv(ev.id)}>EDIT</button>}
                </div>
              );
            })}
          </div>
        )}

        {/* ── STATS ── */}
        {evTab==='stats' && (
          <div>
            {/* Final score card */}
            <div style={{background:CARD,borderRadius:12,padding:'20px 16px',marginBottom:20,textAlign:'center'}}>
              <div style={{fontSize:11,fontWeight:700,color:'#7A5000',letterSpacing:2,textTransform:'uppercase',marginBottom:10}}>FINAL SCORE</div>
              <div style={{fontSize:52,fontWeight:900,color:'#F5D53F',lineHeight:1,marginBottom:12}}>{usGoalsLen} – {themGoalsLen}</div>
              <div style={{display:'flex',justifyContent:'space-between'}}>
                <span style={{fontSize:14,fontWeight:700,color:'#FFFFFF'}}>{OUR}</span>
                <span style={{fontSize:14,fontWeight:700,color:'#FFFFFF'}}>{THEM}</span>
              </div>
            </div>

            {/* Match statistics */}
            <div style={{fontSize:11,fontWeight:700,color:'#9ca3af',letterSpacing:1,textTransform:'uppercase',marginBottom:10}}>MATCH STATISTICS</div>
            <div style={{background:CARD,borderRadius:12,padding:'16px 16px 8px',marginBottom:20}}>
              {MATCH_EVENT_RULES.filter(r=>r.type!=='NOTE').map(rule=>{
                const us=usCt[rule.type]||0, them=themCt[rule.type]||0;
                return (
                  <div key={rule.type} style={{marginBottom:14}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:5}}>
                      <span style={{fontSize:15,fontWeight:700,color:'#60c4f0',minWidth:20}}>{us}</span>
                      <span style={{fontSize:12,color:'#9ca3af'}}>{rule.label}</span>
                      <span style={{fontSize:15,fontWeight:700,color:'#f97316',minWidth:20,textAlign:'right'}}>{them}</span>
                    </div>
                    <div style={{height:4,background:BORDER,borderRadius:2,position:'relative'}}>
                      <div style={{position:'absolute',right:'50%',top:0,height:'100%',width:(us/maxStat*50)+'%',background:'#60c4f0',borderRadius:'2px 0 0 2px'}}/>
                      <div style={{position:'absolute',left:'50%',top:0,height:'100%',width:1,background:'#1A1400'}}/>
                      <div style={{position:'absolute',left:'50%',top:0,height:'100%',width:(them/maxStat*50)+'%',background:'#f97316',borderRadius:'0 2px 2px 0'}}/>
                    </div>
                  </div>
                );
              })}
              <div style={{display:'flex',justifyContent:'space-between',marginTop:8,paddingTop:8,borderTop:'1px solid '+BORDER}}>
                <span style={{fontSize:12,fontWeight:700,color:'#60c4f0'}}>{OUR}</span>
                <span style={{fontSize:12,fontWeight:700,color:'#f97316'}}>{THEM}</span>
              </div>
            </div>

            {/* Total events list */}
            {(()=>{
              const totals=MATCH_EVENT_RULES.filter(r=>r.type!=='NOTE').map(r=>({rule:r,count:(usCt[r.type]||0)+(themCt[r.type]||0)})).filter(x=>x.count>0);
              if(totals.length===0)return null;
              const total=totals.reduce((a,x)=>a+x.count,0);
              return (
                <div>
                  <div style={{fontSize:11,fontWeight:700,color:'#9ca3af',letterSpacing:1,textTransform:'uppercase',marginBottom:10}}>{total} TOTAL EVENTS</div>
                  <div style={{background:CARD,borderRadius:12,overflow:'hidden'}}>
                    {totals.map(({rule,count},i)=>(
                      <div key={rule.type} style={{display:'flex',alignItems:'center',gap:12,padding:'13px 16px',borderBottom:i<totals.length-1?'1px solid '+BORDER:'none'}}>
                        <span style={{fontSize:22}}>{rule.icon}</span>
                        <span style={{flex:1,fontSize:14,fontWeight:700,color:rule.color}}>{rule.label}</span>
                        <span style={{fontSize:15,fontWeight:700,color:'#FFFFFF'}}>{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ── EXPORT ── */}
        {evTab==='export' && (
          <div>
            <div style={{fontSize:11,fontWeight:700,color:'#9ca3af',letterSpacing:1,textTransform:'uppercase',marginBottom:14}}>EXPORT MATCH REPORT</div>
            <div style={{background:CARD,borderRadius:12,padding:12,marginBottom:20,display:'flex',flexDirection:'column',gap:8}}>
              <button onClick={()=>navigator.clipboard?.writeText(reportText)} style={{background:'#F5D53F',border:'none',borderRadius:10,padding:'16px',fontSize:14,fontWeight:700,color:'#0a150a',cursor:'pointer',width:'100%'}}>
                📋 Copy Report to Clipboard
              </button>
              <button onClick={downloadTxt} style={{background:'#60c4f0',border:'none',borderRadius:10,padding:'16px',fontSize:14,fontWeight:700,color:'#0a150a',cursor:'pointer',width:'100%'}}>
                ↓ Download .txt Report
              </button>
              <button onClick={exportJSON} style={{background:'#2d5a2d',border:'none',borderRadius:10,padding:'16px',fontSize:14,fontWeight:700,color:'#FFFFFF',cursor:'pointer',width:'100%'}}>
                ↓ Export Raw Data (JSON)
              </button>
            </div>

            <div style={{fontSize:11,fontWeight:700,color:'#9ca3af',letterSpacing:1,textTransform:'uppercase',marginBottom:10}}>PREVIEW</div>
            <div style={{background:CARD,borderRadius:12,padding:'16px'}}>
              <pre style={{margin:0,fontFamily:'monospace',fontSize:11,color:'#9ca3af',lineHeight:1.8,whiteSpace:'pre-wrap',wordBreak:'break-word'}}>{reportText}</pre>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}

function MatchScreen({ half1, config, squad, opponent, linkedFixKey, fixIsHome, onSaveGame, onExit }) {
  const positions = getPositions(config.formation);
  const posIds    = getPosIds(positions);
  const posLabel  = getPosLabel(positions);
  const periodMins = getPeriodMins(config);

  const [halves, setHalves] = useState(()=>[half1, Array.from({length:config.numPeriods},()=>({slots:null,seeded:false}))]);
  const [halfIdx, setHalfIdx] = useState(0);
  const [pidx, setPidx]         = useState(0);
  const [manualPeriod, setManualPeriod] = useState(false);
  const [selected, setSelected] = useState(null);
  const [dragging, setDragging] = useState(null);
  const [periodLeft, setPeriodLeft] = useState(Math.round(periodMins*60));
  const [halfElapsed, setHalfElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [alarmed, setAlarmed] = useState(false);
  const [goals, setGoals]   = useState([]);
  const [matchEvents, setMatchEvents] = useState([]);
  const [modal, setModal]   = useState(null);
  const [eventsView, setEventsView] = useState(false);
  const [report, setReport] = useState("");
  const [reportLoading, setReportLoading] = useState(false);
  const [voiceNotes, setVoiceNotes]   = useState("");      // accumulated transcript
  const [voiceReview, setVoiceReview] = useState("");      // editable copy in review modal
  const [isVoiceRec, setIsVoiceRec]   = useState(false);
  const [voicePulse, setVoicePulse]   = useState(false);
  const timerRef = useRef(null);
  const recognitionRef = useRef(null);
  const pulseRef = useRef(null);

  const periods = halves[halfIdx];
  const cur     = periods[pidx];

  let prevSlots = null;
  if(pidx>0) prevSlots=periods[pidx-1]?.slots;
  else if(halfIdx>0){const ph=halves[halfIdx-1];prevSlots=ph[ph.length-1]?.slots;}
  const swapPairs=(prevSlots&&cur.slots)?computeSwapPairs(prevSlots,cur.slots,posIds):{};

  useEffect(()=>{
    let need=false; halves.forEach(h=>h.forEach(p=>{if(!p.slots)need=true;})); if(!need)return;
    setHalves(hs=>{
      const next=hs.map(h=>h.map(p=>({...p}))); let prev=null;
      for(let hi=0;hi<next.length;hi++)for(let pi=0;pi<next[hi].length;pi++){
        if(next[hi][pi].slots)prev=next[hi][pi].slots;
        else if(prev){next[hi][pi].slots=cloneSlots(prev);prev=next[hi][pi].slots;}
      }
      return next;
    });
  },[halves]);

  useEffect(()=>{
    if(running){timerRef.current=setInterval(()=>{
      setHalfElapsed(g=>g+1);
      setPeriodLeft(t=>{if(t<=1){clearInterval(timerRef.current);setRunning(false);setAlarmed(true);playAlarm();return 0;}return t-1;});
    },1000);}else clearInterval(timerRef.current);
    return()=>clearInterval(timerRef.current);
  },[running]);
  // Auto-advance period tab when timer crosses period boundaries
  useEffect(()=>{
    if(manualPeriod) return;
    const pSecs = Math.round(periodMins * 60);
    const next = Math.min(Math.floor(halfElapsed / pSecs), periods.length - 1);
    if(next >= 0) setPidx(next);
  },[halfElapsed, manualPeriod, periodMins, periods.length]);

  function toggleRun(){ unlockAudio(); setRunning(r=>!r); setAlarmed(false); }

  // ── Voice notes (Web Speech API) ────────────────────────────────────────
  function startVoice() {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) { alert('Speech recognition is not supported on this browser. Try Chrome or Safari on iOS 14.5+.'); return; }
    const rec = new SR();
    rec.lang = 'en-AU';
    rec.continuous = true;
    rec.interimResults = false;
    let buf = '';
    rec.onresult = e => {
      buf = Array.from(e.results).map(r=>r[0].transcript).join(' ');
    };
    rec.onerror = () => stopVoice(buf);
    rec.onend   = () => { if(isVoiceRecRef.current) { stopVoice(buf); } };
    rec.start();
    recognitionRef.current = rec;
    isVoiceRecRef.current = true;
    setIsVoiceRec(true);
    // Pulse animation
    pulseRef.current = setInterval(()=>setVoicePulse(p=>!p), 600);
  }
  const isVoiceRecRef = useRef(false);
  function stopVoice(extraText) {
    isVoiceRecRef.current = false;
    setIsVoiceRec(false);
    clearInterval(pulseRef.current);
    setVoicePulse(false);
    try { recognitionRef.current?.stop(); } catch {}
    if (extraText && extraText.trim()) {
      const ts = String(Math.floor(halfElapsed/60)).padStart(2,'0') + ':' + String(halfElapsed%60).padStart(2,'0');
      setVoiceNotes(prev => prev ? prev + '\n[' + ts + '] ' + extraText.trim() : '[' + ts + '] ' + extraText.trim());
    }
  }
  function toggleVoice() {
    if (isVoiceRec) { stopVoice(''); }
    else { startVoice(); }
  }
  function resetPeriodTimer(){ setRunning(false); setPeriodLeft(Math.round(periodMins*60)); setAlarmed(false); }
  function goNextPeriod(){
    setRunning(false); setPeriodLeft(Math.round(periodMins*60)); setAlarmed(false);
    setManualPeriod(false); // return to timer-driven period
    if(pidx<periods.length-1){setSelected(null);}
    else if(halfIdx<halves.length-1){setHalfIdx(halfIdx+1);setPidx(0);setSelected(null);setHalfElapsed(0);}
  }
  function switchPeriod(i){ setManualPeriod(true); setPidx(i); setSelected(null); }
  function switchHalf(h){ if(h<0||h>halves.length-1)return; setHalfIdx(h);setPidx(0);setManualPeriod(false);setSelected(null);setHalfElapsed(0); }

  const touchStart=useRef(null);
  function onTouchStart(e){touchStart.current={x:e.touches[0].clientX,y:e.touches[0].clientY};}
  function onTouchEnd(e){
    if(!touchStart.current)return;
    const dx=e.changedTouches[0].clientX-touchStart.current.x,dy=e.changedTouches[0].clientY-touchStart.current.y;
    touchStart.current=null;
    if(Math.abs(dx)>80&&Math.abs(dx)>Math.abs(dy)*2){dx<0?switchHalf(halfIdx+1):switchHalf(halfIdx-1);}
  }
  const pitchTouch=useRef(null);
  function onPitchTouchStart(e){e.stopPropagation();pitchTouch.current={x:e.touches[0].clientX,y:e.touches[0].clientY};}
  function onPitchTouchEnd(e){
    e.stopPropagation();if(!pitchTouch.current)return;
    const dx=e.changedTouches[0].clientX-pitchTouch.current.x,dy=e.changedTouches[0].clientY-pitchTouch.current.y;
    pitchTouch.current=null;const adx=Math.abs(dx),ady=Math.abs(dy);
    if(adx<25&&ady<25)return;
    if(adx>ady*1.2){if(dx<0&&pidx<periods.length-1)switchPeriod(pidx+1);if(dx>0&&pidx>0)switchPeriod(pidx-1);}
    else{if(dy<0)switchHalf(halfIdx+1);if(dy>0)switchHalf(halfIdx-1);}
  }

  function applyMove(slots,name,from,to){
    const s={}; posIds.forEach(id=>s[id]=slots[id]);
    let bench=[...slots.bench];
    if(from==="bench")bench=bench.filter(n=>n!==name);else if(posIds.includes(from))s[from]="";
    if(to==="bench"){if(!bench.includes(name))bench.push(name);}
    else{const d=s[to];s[to]=name;if(d&&d!==name){if(from==="bench"){if(!bench.includes(d))bench.push(d);}else s[from]=d;}}
    const onField=new Set(posIds.map(id=>s[id]).filter(Boolean));
    bench=[...new Set(bench.filter(n=>!onField.has(n)))];
    return{...s,bench};
  }
  function flatten(hs){const f=[];hs.forEach((h,hi)=>h.forEach((p,pi)=>f.push({hi,pi,slots:p.slots})));return f;}
  function movePlayer(name,from,to){
    if(from===to)return;
    setHalves(hs=>{
      const flat=flatten(hs);const idx=flat.findIndex(f=>f.hi===halfIdx&&f.pi===pidx);if(idx<0)return hs;
      const after=applyMove(flat[idx].slots,name,from,to);const newByKey={[`${halfIdx}.${pidx}`]:after};
      for(let j=idx+1;j<flat.length;j++){
        const cand=flat[j].slots;if(!cand)continue;
        let candFrom=null;
        if((cand.bench||[]).includes(name))candFrom="bench";else{const pos=posIds.find(id=>cand[id]===name);if(pos)candFrom=pos;}
        if(candFrom===from){newByKey[`${flat[j].hi}.${flat[j].pi}`]=applyMove(cand,name,from,to);}else break;
      }
      return hs.map((h,hi)=>h.map((p,pi)=>{const k=`${hi}.${pi}`;return newByKey[k]?{...p,slots:newByKey[k],seeded:true}:p;}));
    });
  }
  function handleTap(id,isBench,benchName){
    if(selected){
      const to=isBench?"bench":id;
      if(selected.from===to&&(!isBench||selected.name===benchName)){setSelected(null);return;}
      movePlayer(selected.name,selected.from,to);setSelected(null);
    } else {
      if(isBench){setSelected({name:benchName,from:"bench"});return;}
      const name=cur.slots[id];if(name)setSelected({name,from:id});
    }
  }
  function handleDrop(toId){if(!dragging)return;movePlayer(dragging.name,dragging.from,toId);setDragging(null);}
  function getTokenColor(name){if(!name)return null;const i=swapPairs[name];return i!==undefined?PAIR_COLORS[i]:null;}

  function logGoal(scorer,position){setGoals(g=>[...g,{scorer,position,secs:halfElapsed,timeStr:fmtTime(halfElapsed),team:"us",half:halfIdx+1}]);}
  function logThemGoal(){setGoals(g=>[...g,{scorer:"Opponent",secs:halfElapsed,timeStr:fmtTime(halfElapsed),team:"them",half:halfIdx+1}]);}
  function removeGoal(i){setGoals(g=>g.filter((_,j)=>j!==i));}

  const usGoals=goals.filter(g=>g.team==="us");
  const themGoals=goals.filter(g=>g.team==="them");

  function currentGameObj(){
    return{opponent,date:Date.now(),goals,matchEvents,scoreUs:usGoals.length,scoreThem:themGoals.length,halves,config,voiceNotes:voiceNotes||"",...(linkedFixKey?{linkedFixtureKey:linkedFixKey,fixtureIsHome:fixIsHome}:{})};
  }
  async function generateReport(){
    setModal("report");setReportLoading(true);
    const game=currentGameObj();
    try{const text=await generateAIReport(game);setReport(text);}
    catch{setReport(buildLocalReport(game));}
    setReportLoading(false);
  }
  function saveAndExit(){
    const game=currentGameObj();game.id="g_"+Date.now();game.report=report||buildLocalReport(game);onSaveGame(game);
  }

  const pMM=String(Math.floor(periodLeft/60)).padStart(2,"0");
  const pSS=String(periodLeft%60).padStart(2,"0");
  const gMM=String(Math.floor(halfElapsed/60)).padStart(2,"0");
  const gSS=String(halfElapsed%60).padStart(2,"0");
  const totalPeriodSecs=Math.round(periodMins*60);
  const pct=periodLeft/totalPeriodSecs;
  const ringColor=pct>0.4?"#F5C04A":pct>0.15?"#f59e0b":"#ef4444";
  const swapEntries=PAIR_COLORS.map((c,i)=>{const players=Object.entries(swapPairs).filter(([,v])=>v===i).map(([k])=>k);return players.length===2?{color:c,a:players[0],b:players[1]}:null;}).filter(Boolean);
  const offCounts={};
  halves.forEach((h,hi)=>h.forEach((p,pi)=>{if(!p.slots)return;const future=hi>halfIdx||(hi===halfIdx&&pi>pidx);if(!future)(p.slots.bench||[]).forEach(n=>{offCounts[n]=(offCounts[n]||0)+1;});}));
  const offSummary=Object.entries(offCounts).sort((a,b)=>b[1]-a[1]);

  if(!cur.slots)return<div style={S.wrap}><p style={{color:"#A1A1A1"}}>Loading…</p></div>;

  if(eventsView) return <EventsPage halfElapsed={halfElapsed} goals={goals} matchEvents={matchEvents} setMatchEvents={setMatchEvents} onBack={()=>setEventsView(false)} opponentName={opponent||"Opposition"} ourName={config?.teamName||"My Team"} usGoalsLen={goals.filter(g=>g.team==='us').length} themGoalsLen={goals.filter(g=>g.team==='them').length} />;

  return (
    <div style={S.wrap} onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>
      {modal==="goal"&&<GoalModal squad={squad} slots={cur.slots} posIds={posIds} posLabel={posLabel} onLog={logGoal} onClose={()=>setModal(null)}/>}

      {modal==="report"&&(
        <div style={S.modalBack} onClick={()=>setModal(null)}>
          <div style={{...S.modalBox,maxWidth:460,maxHeight:"85vh",overflowY:"auto"}} onClick={e=>e.stopPropagation()}>
            <div style={S.modalHeader}><span style={S.modalTitle}>📋 Match Report</span><button style={S.btnX} onClick={()=>setModal(null)}>✕</button></div>
            <div style={S.reportBox}>{reportLoading?"✨ Generating…":report}</div>
            {!reportLoading&&(<div style={{display:"flex",gap:8}}>
              <button style={{...S.btnDark,flex:1}} onClick={()=>navigator.clipboard?.writeText(report)}>Copy</button>
              <button style={{...S.btnGreen,flex:1}} onClick={saveAndExit}>Save Game ✓</button>
            </div>)}
          </div>
        </div>
      )}

      {modal==="save"&&(
        <div style={S.modalBack} onClick={()=>setModal(null)}>
          <div style={S.modalBox} onClick={e=>e.stopPropagation()}>
            <div style={S.modalTitle}>End &amp; Save Game?</div>
            <p style={S.sub}>Final score vs {opponent||"Opposition"}: {usGoals.length}–{themGoals.length}.</p>
            <div style={{display:"flex",gap:8}}>
              <button style={{...S.btnGreen,flex:1}} onClick={saveAndExit}>Save</button>
              <button style={S.btnCancel} onClick={()=>setModal(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {modal==="voiceReview"&&(
        <div style={S.modalBack} onClick={()=>{}}>
          <div style={{...S.modalBox,maxWidth:460,maxHeight:"85vh",display:"flex",flexDirection:"column"}} onClick={e=>e.stopPropagation()}>
            <div style={S.modalHeader}>
              <span style={S.modalTitle}>🎙️ Review Voice Notes</span>
              <button style={S.btnX} onClick={()=>setModal("save")}>✕</button>
            </div>
            <p style={{...S.sub,margin:"0 0 10px",fontSize:12}}>Edit your notes before saving. These will be stored with the game.</p>
            <textarea
              value={voiceReview}
              onChange={e=>setVoiceReview(e.target.value)}
              rows={10}
              style={{...S.sel,fontFamily:"inherit",lineHeight:1.6,resize:"vertical",flex:1,whiteSpace:"pre-wrap"}}
              placeholder="Your voice notes will appear here…"
            />
            <div style={{display:"flex",gap:8,marginTop:12}}>
              <button style={{...S.btnGreen,flex:2}} onClick={()=>{
                const game=currentGameObj();
                game.voiceNotes=voiceReview.trim();
                game.report=voiceReview.trim()||report||buildLocalReport(game);
                game.id="g_"+Date.now();
                onSaveGame(game);
              }}>✓ Approve &amp; Save</button>
              <button style={{...S.btnDark,flex:1}} onClick={()=>{
                const game=currentGameObj();
                game.id="g_"+Date.now();
                game.report=report||buildLocalReport(game);
                onSaveGame(game);
              }}>Save without Notes</button>
            </div>
          </div>
        </div>
      )}

      <div style={S.header}>
        <div style={{display:"flex",alignItems:"center",gap:6}}>
          <button style={S.btnGhost} onClick={onExit}>←</button>
          <div style={S.gameClock}><span style={S.clockLabel}>{halfIdx===0?"1ST":"2ND"}</span><span style={S.gameClockNum}>{gMM}:{gSS}</span></div>
          <div style={{position:"relative",width:52,height:52}}>
            <svg width="52" height="52" style={{position:"absolute",top:0,left:0,transform:"rotate(-90deg)"}}>
              <circle cx="26" cy="26" r="22" fill="none" stroke="#1A1A1A" strokeWidth="4"/>
              <circle cx="26" cy="26" r="22" fill="none" stroke={ringColor} strokeWidth="4"
                strokeDasharray={`${2*Math.PI*22}`} strokeDashoffset={`${2*Math.PI*22*(1-pct)}`}
                strokeLinecap="round" style={{transition:"stroke-dashoffset 1s linear,stroke 0.5s"}}/>
            </svg>
            <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",color:alarmed?"#ef4444":"#FFFFFF",animation:alarmed?"pulse 0.6s ease-in-out infinite alternate":"none"}}>
              <span style={{fontSize:6,color:"#A1A1A1",fontWeight:700}}>PERIOD</span>
              <span style={{fontVariantNumeric:"tabular-nums",fontSize:11,fontWeight:800}}>{pMM}:{pSS}</span>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:3}}>
            <button style={{...S.btnSm,background:running?"#ef4444":"#F5C04A"}} onClick={toggleRun}>{running?"⏸":"▶"}</button>
            {alarmed
              ?<button style={{...S.btnSm,background:"#E9AA23"}} onClick={goNextPeriod}>Next→</button>
              :<button style={{...S.btnSm,background:"#A1A1A1"}} onClick={resetPeriodTimer}>↺</button>}
          </div>
        </div>
        <button style={S.micBtn} onClick={()=>setEventsView(true)}>
          📊<span style={{fontSize:9,marginTop:2,color:"#A1A1A1"}}>Events</span>
        </button>
      </div>

      <div style={{fontSize:12,color:"#A1A1A1",marginBottom:4}}>vs <b style={{color:"#cbd5e1"}}>{opponent||"Opposition"}</b></div>
      {alarmed&&<div style={S.alarmBanner}>🔔 Period over! Make your subs, then tap Next →</div>}

      <div style={S.tabsRow}>
        <span style={S.halfChip}>{halfIdx===0?"1st Half":"2nd Half"}</span>
        <div style={S.tabs}>
          {periods.map((p,i)=>(
            <button key={i} style={{...S.tab,...(i===pidx?S.tabOn:{})}} onClick={()=>switchPeriod(i)}>
              {`${Math.round(i*periodMins)}–${Math.round((i+1)*periodMins)}m`}
            </button>
          ))}
        </div>
      </div>

      {(swapEntries.length>0||selected)&&(
        <div style={S.legend}>
          {swapEntries.length>0&&<span style={{fontSize:10,color:"#A1A1A1"}}>Swaps:</span>}
          {swapEntries.map(({color,a,b})=>(<div key={a} style={S.legendRow}><div style={{...S.dot,background:color}}/><span style={{fontSize:10,color}}>{a} ↔ {b}</span></div>))}
          {selected&&<div style={{...S.legendRow,background:"#7c3aed22",padding:"2px 8px",borderRadius:6}}><div style={{...S.dot,background:"#7c3aed"}}/><span style={{fontSize:10,color:"#c4b5fd"}}>Moving: {selected.name}</span></div>}
        </div>
      )}

      <div style={S.mainRow}>
        <div style={S.pitchOuter} onDragOver={e=>e.preventDefault()} onTouchStart={onPitchTouchStart} onTouchEnd={onPitchTouchEnd}>
          <div style={S.cc}/><div style={S.hw}/><div style={S.ptop}/><div style={S.pbot}/>
          {positions.map(pos=>{
            const name=cur.slots[pos.id];const isSel=selected?.from===pos.id;const color=isSel?null:getTokenColor(name);
            return (
              <div key={pos.id} style={{position:"absolute",left:pos.left,top:pos.top,transform:`translateX(${pos.tx})`,display:"flex",flexDirection:"column",alignItems:"center",gap:2,zIndex:isSel?10:1}}
                onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();handleDrop(pos.id);}}
                onClick={e=>{e.stopPropagation();handleTap(pos.id,false,null);}}>
                {name?<Token name={name} color={color} selected={isSel} onTap={()=>{}} onDragStart={()=>{setDragging({name,from:pos.id});setSelected(null);}}/>:<div style={S.emptySlot}/>}
                <span style={S.posLbl}>{pos.label}</span>
              </div>
            );
          })}
        </div>
        <div style={S.bench} onDragOver={e=>e.preventDefault()} onDrop={e=>{e.preventDefault();handleDrop("bench");}} onClick={()=>{if(selected)handleTap(null,true,null);}}>
          <div style={S.benchHd}>BENCH</div>
          {cur.slots.bench.length===0&&<div style={S.benchEm}>—</div>}
          {cur.slots.bench.map(name=>{
            const isSel=selected?.name===name&&selected?.from==="bench";const color=isSel?null:getTokenColor(name);
            return (<div key={name} style={{marginBottom:6}} onClick={e=>{e.stopPropagation();handleTap(null,true,name);}}><Token name={name} color={color} selected={isSel} onDragStart={()=>{setDragging({name,from:"bench"});setSelected(null);}}/></div>);
          })}
          <div style={S.benchDiv}/>
          <div style={{fontSize:8,color:"#A1A1A1",textAlign:"center",marginBottom:4,fontWeight:700}}>TIMES RESTED</div>
          {offSummary.length===0&&<div style={{fontSize:9,color:"#2A2A2A",textAlign:"center"}}>none yet</div>}
          {offSummary.map(([n,c])=>(<div key={n} style={{display:"flex",justifyContent:"space-between",fontSize:9,color:"#cbd5e1",padding:"1px 2px"}}><span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{n.split(" ")[0]}</span><span style={{color:c>=2?"#f59e0b":"#A1A1A1",fontWeight:700}}>{c}×</span></div>))}
        </div>
      </div>

      <p style={S.hint}>{selected?`Tap destination for ${selected.name}`:"Tap player to move"}</p>

      <div style={S.goalSection}>
        <div style={S.goalHeader}>
          <div style={S.scoreBlock}>
            <span style={S.scoreLabel}>Us</span><span style={S.scoreNum}>{usGoals.length}</span>
            <span style={S.scoreDash}>–</span><span style={S.scoreNum}>{themGoals.length}</span><span style={S.scoreLabel}>Them</span>
          </div>
          <div style={{display:"flex",gap:6}}>
            <button style={S.btnGoalUs} onClick={()=>setModal("goal")}>⚽ Our Goal</button>
            <button style={S.btnGoalThem} onClick={logThemGoal}>+ Their Goal</button>
          </div>
        </div>
        {goals.length>0&&(
          <div style={S.goalLog}>
            {goals.map((g,i)=>(<div key={i} style={{...S.goalEntry,color:g.team==="us"?"#FDE68A":"#fca5a5"}}><span>⚽ H{g.half} {g.timeStr} — {g.team==="us"?`${g.scorer}${g.position?` (${g.position})`:""}`:"Opponent"}</span><button style={S.btnTinyX} onClick={()=>removeGoal(i)}>✕</button></div>))}
          </div>
        )}
      </div>

      <div style={{display:"flex",gap:8,width:"100%",maxWidth:500,marginTop:8}}>
        <button style={S.btnNotes} onClick={()=>setEventsView(true)}>📊 Events {matchEvents.length>0&&<span style={S.noteBadge}>{matchEvents.length}</span>}</button>
        <button style={S.btnNotes} onClick={toggleVoice}
          title={isVoiceRec?"Stop recording":"Start voice note"}
          style={{...S.btnNotes,flex:0,width:52,paddingLeft:0,paddingRight:0,flexDirection:"column",gap:2,
            background:isVoiceRec?(voicePulse?"#7f1d1d":"#450a0a"):"#1A1A1A",
            border:isVoiceRec?"1px solid #ef4444":"1px solid #2A2A2A",
            color:isVoiceRec?"#fca5a5":"#A1A1A1",transition:"background 0.3s"}}>
          <span style={{fontSize:18}}>{isVoiceRec?"🔴":"🎙️"}</span>
          <span style={{fontSize:8,fontWeight:700,marginTop:1}}>{voiceNotes?"●":""}</span>
        </button>
        <button style={S.btnReport} onClick={generateReport}>📋 Report</button>
      </div>
      <button style={{...S.btnGreen,width:"100%",maxWidth:500,marginTop:8}} onClick={()=>{
        if(voiceNotes.trim()){setVoiceReview(voiceNotes);setModal("voiceReview");}
        else setModal("save");
      }}>End &amp; Save Game</button>

      <div style={S.halfBar}>
        <button style={{...S.halfArrow,opacity:halfIdx>0?1:0.3}} onClick={()=>switchHalf(halfIdx-1)} disabled={halfIdx===0}>←</button>
        <div style={S.halfBarCenter}>
          {["1st Half","2nd Half"].map((lbl,i)=>(<div key={i} style={{...S.halfPill,...(i===halfIdx?S.halfPillOn:{})}} onClick={()=>switchHalf(i)}>{lbl}</div>))}
        </div>
        <button style={{...S.halfArrow,opacity:halfIdx<halves.length-1?1:0.3}} onClick={()=>switchHalf(halfIdx+1)} disabled={halfIdx>=halves.length-1}>→</button>
      </div>
      <p style={S.swipeHint}>swipe field ← → period · ↑ ↓ half</p>
      <style>{`@keyframes pulse{from{opacity:1}to{opacity:0.3}}`}</style>
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  ROOT
// ════════════════════════════════════════════════════════════════════════════════
// ════════════════════════════════════════════════════════════════════════════════
//  SCREEN: IMPORT / EXPORT
// ════════════════════════════════════════════════════════════════════════════════
function ImportExportScreen({ onBack }) {
  const [confirmReset, setConfirmReset] = useState(false);
  const [status, setStatus]   = useState('');
  const [statusOk, setStatusOk] = useState(true);
  // Filename modal: { type, defaultName } | null
  const [exportPending, setExportPending] = useState(null);
  const [filename, setFilename] = useState('');

  function msg(text, ok=true){ setStatus(text); setStatusOk(ok); setTimeout(()=>setStatus(''),3500); }

  // ── CSV helpers ────────────────────────────────────────────────────────
  function esc(v){ const s=String(v??''); return (s.includes(',')||s.includes('"')||s.includes('\n'))?'"'+s.replace(/"/g,'""')+'"':s; }
  function row(arr){ return arr.map(esc).join(','); }

  function buildCsv(type) {
    if(type==='team'){
      const squad = JSON.parse(localStorage.getItem('soccerCoach_squad')||'[]');
      const lines = [row(['Name','Primary Position','Alt Position 1','Alt Position 2'])];
      squad.forEach(p=>lines.push(row([p.name, p.pos||'', p.pos2||'', p.pos3||''])));
      return lines.join('\n');
    }
    if(type==='scores'){
      const games   = JSON.parse(localStorage.getItem('soccerCoach_games')||'[]');
      const fxSc    = JSON.parse(localStorage.getItem('soccerCoach_fixtureScores')||'{}');
      const lines   = [row(['Date','Opponent','Our Score','Their Score','Result','Goal Scorers','MVP','Events'])];
      games.forEach(g=>{
        let us=g.scoreUs||0,them=g.scoreThem||0;
        if(g.linkedFixtureKey&&fxSc[g.linkedFixtureKey]){const sc=fxSc[g.linkedFixtureKey];us=g.fixtureIsHome?sc.home:sc.away;them=g.fixtureIsHome?sc.away:sc.home;}
        const res=us>them?'W':us<them?'L':'D';
        const scorers=[...new Set((g.goals||[]).filter(x=>x.team==='us').map(x=>x.scorer))].join('; ');
        const potm=Array.isArray(g.potm)?g.potm.join('; '):(g.potm||'');
        const evts=(g.matchEvents||[]).map(e=>e.minute+"' "+e.type+(e.team?' ('+e.team+')':'')).join('; ');
        lines.push(row([new Date(g.date).toLocaleDateString('en-AU'),g.opponent||'',us,them,res,scorers,potm,evts]));
      });
      return lines.join('\n');
    }
    if(type==='fixtures'){
      // Comma-separated CSV
      const SEP = ',';
      const tRow = arr => arr.map(v=>String(v).includes(',')?'"'+ v +'"':v).join(SEP);
      const fxSc = JSON.parse(localStorage.getItem('soccerCoach_fixtureScores')||'{}');
      const headers = ['Round','Date & Time (AEST)','Home Team','Away Team','Venue & Field','Match Status / Result'];
      const lines = [tRow(headers)];
      let lastRound = null;
      FIXTURES.forEach(f=>{
        const k = f.round+'|||'+f.home+'|||'+f.away;
        const sc = fxSc[k];
        let result;
        if(!sc)               result = '0:00';
        else if(sc.postponed) result = 'Postponed';
        else                  result = sc.home+':'+sc.away;
        const roundCell = f.round !== lastRound ? f.round : '';
        lastRound = f.round;
        // Format date: "2 May" + "9:30am" → "Sat, May 2, 2026, 09:30 AM"
        const year = new Date().getFullYear();
        const d = new Date((f.date||'')+ ' '+year);
        const dn = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'][d.getDay()];
        const mn = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][d.getMonth()];
        const tm = (f.time||'').replace(/^(\d+):(\d+)(am|pm)$/i,(_,h,m,p)=>String(h).padStart(2,'0')+':'+m+' '+p.toUpperCase());
        const dateTime = dn+', '+mn+' '+d.getDate()+', '+year+', '+tm;
        lines.push(tRow([roundCell, dateTime, f.home, f.away, f.venue||'', result]));
      });
      return lines.join('\n');
    }
    if(type==='all'){
      // JSON for full backup (CSV can't handle nested data)
      const ALL_KEYS=['soccerCoach_squad','soccerCoach_config','soccerCoach_games',
        'soccerCoach_settings','soccerCoach_fixtureScores','soccerCoach_teamNotes',
        'soccerCoach_teamNicknames','soccerCoach_fixtureTeam','soccerCoach_fixtures'];
      const data={_exported:new Date().toISOString()};
      ALL_KEYS.forEach(k=>{const v=localStorage.getItem(k);if(v)data[k]=JSON.parse(v);});
      return JSON.stringify(data,null,2);
    }
    return '';
  }

  // ── Export ────────────────────────────────────────────────────────────
  async function doExport() {
    const { type, fname } = exportPending || {};
    const isJson = type==='all';
    const ext    = isJson?'.json':'.csv';
    const mime   = isJson?'application/json':'text/csv';
    const finalName = (filename||fname)+ext;
    const data   = buildCsv(type);
    const blob   = new Blob([data], {type:mime});

    setExportPending(null); setFilename('');

    if(navigator.share && navigator.canShare){
      const file=new File([blob],finalName,{type:mime});
      if(navigator.canShare({files:[file]})){
        try{ await navigator.share({files:[file],title:finalName}); msg('Exported '+finalName); return; }
        catch(e){ if(e.name==='AbortError')return; }
      }
    }
    const url=URL.createObjectURL(blob);
    const a=document.createElement('a');
    a.href=url; a.download=finalName;
    document.body.appendChild(a); a.click();
    document.body.removeChild(a);
    setTimeout(()=>URL.revokeObjectURL(url),1000);
    msg('Exported '+finalName);
  }

  // ── Import ────────────────────────────────────────────────────────────
  // Parse CSV or TSV — auto-detects separator from header row
  function parseSV(text){
    const lines = text.trim().split(/\r?\n/);
    if(lines.length<2) return [];
    const sep = lines[0].includes('\t') ? '\t' : ',';
    function splitLine(line){
      if(sep==='\t') return line.split('\t').map(s=>s.replace(/^"|"$/g,'').trim());
      const cols=[]; let cur='',inQ=false;
      for(let i=0;i<line.length;i++){
        const c=line[i];
        if(c==='"'&&!inQ){ inQ=true; }
        else if(c==='"'&&inQ&&line[i+1]==='"'){ cur+='"'; i++; }
        else if(c==='"'&&inQ){ inQ=false; }
        else if(c===sep&&!inQ){ cols.push(cur); cur=''; }
        else cur+=c;
      }
      cols.push(cur); return cols;
    }
    const headers = splitLine(lines[0]).map(h=>h.replace(/^"|"$/g,'').trim());
    return lines.slice(1).map(line=>{
      const cols=splitLine(line); const obj={};
      headers.forEach((h,i)=>obj[h]=(cols[i]||'').replace(/^"|"$/g,'').trim());
      return obj;
    });
  }

  function doImport(type){
    const input=document.createElement('input');
    input.type='file'; input.accept='.csv,.tsv,.txt,.json';
    input.onchange=e=>{
      const file=e.target.files[0]; if(!file)return;
      const reader=new FileReader();
      reader.onload=ev=>{
        try{
          const text=ev.target.result;
          const isJson=file.name.endsWith('.json');
          if(isJson){
            // Full JSON backup restore
            const data=JSON.parse(text);
            let count=0;
            Object.entries(data).forEach(([k,v])=>{if(k!=='_exported'){localStorage.setItem(k,JSON.stringify(v));count++;}});
            msg('Imported '+count+' data sets — reloading',true);
            setTimeout(()=>window.location.reload(),1500);
            return;
          }
          // CSV / TSV import
          const rows = parseSV(text);
          if(type==='team'){
            const squad=rows.map(r=>({name:r['Name'],pos:r['Primary Position']||'',pos2:r['Alt Position 1']||'',pos3:r['Alt Position 2']||''})).filter(p=>p.name);
            localStorage.setItem('soccerCoach_squad',JSON.stringify(squad));
            msg('Imported '+squad.length+' players — reloading',true);
            setTimeout(()=>window.location.reload(),1500);
          } else if(type==='scores'){
            // Rebuild game records from exported scores CSV
            const newGames = rows.map(r=>{
              const dateStr = (r['Date']||'').trim();
              const parts = dateStr.split('/'); // en-AU: d/m/yyyy
              let dateMs = Date.now();
              if(parts.length===3) dateMs = new Date(parts[2]+'-'+String(parts[1]).padStart(2,'0')+'-'+String(parts[0]).padStart(2,'0')).getTime();
              const us   = parseInt(r['Our Score'])||0;
              const them = parseInt(r['Their Score'])||0;
              const scorersStr = r['Goal Scorers']||'';
              const goals = scorersStr.split(';').map(s=>s.trim()).filter(Boolean).map(name=>({team:'us',scorer:name,secs:0}));
              const potm = (r['MVP']||'').trim();
              return {id:'g_imp_'+Date.now()+'_'+Math.random().toString(36).slice(2),
                date:dateMs, opponent:(r['Opponent']||'').trim(),
                scoreUs:us, scoreThem:them, goals, potm,
                halves:[], matchEvents:[], config:{}, voiceNotes:'', report:''};
            }).filter(g=>g.opponent);
            // Merge — skip rows already matching date+opponent
            const existing = loadGames();
            const eKeys = new Set(existing.map(g=>new Date(g.date).toLocaleDateString('en-AU')+'|'+g.opponent));
            const toAdd = newGames.filter(g=>!eKeys.has(new Date(g.date).toLocaleDateString('en-AU')+'|'+g.opponent));
            saveGames([...existing, ...toAdd]);
            msg('Imported '+toAdd.length+' game records'+(newGames.length-toAdd.length>0?' ('+( newGames.length-toAdd.length)+' skipped — already exist)':'')+' — reloading',true);
            setTimeout(()=>window.location.reload(),1500);
          } else if(type==='fixtures'){
            // Parse FA-format date "Sat, May 2, 2026, 09:30 AM" -> {date:"2 May", time:"9:30am"}
            function parseFADateTime(str) {
              if(!str) return {date:'',time:''};
              const m = str.match(/\w+,\s+(\w+)\s+(\d+),\s+\d+,\s+(\d+):(\d+)\s+(AM|PM)/i);
              if(!m) return {date:str, time:''};
              const [,mon,day,h,min,ampm] = m;
              return {date:day+' '+mon, time:h+':'+min+ampm.toLowerCase()};
            }
            const fxSc = {}; const fxArr = []; let scCount = 0; let lastRound = '';
            rows.forEach(r=>{
              const round = (r['Round']||'').trim() || lastRound;
              if(round) lastRound = round;
              const home = (r['Home Team']||r['Home']||'').trim();
              const away = (r['Away Team']||r['Away']||'').trim();
              if(!round||!home||!away) return;
              const k = round+'|||'+home+'|||'+away;
              // Save fixture schedule row
              const dt = parseFADateTime(r['Date & Time (AEST)']||'');
              fxArr.push({round, home, away, date:dt.date, time:dt.time, venue:(r['Venue & Field']||'').trim()});
              // Save score
              const result = (r['Match Status / Result']||r['Status']||'').trim();
              if(result && result!=='0:00'){
                if(result.toLowerCase()==='postponed'){ fxSc[k]={postponed:true}; scCount++; }
                else {
                  const parts = result.split(/[:\-]/);
                  if(parts.length===2){
                    const h=parseInt(parts[0]), a=parseInt(parts[1]);
                    if(!isNaN(h)&&!isNaN(a)){ fxSc[k]={home:h,away:a}; scCount++; }
                  }
                }
              }
            });
            // Overwrite both stores
            if(fxArr.length>0) saveFixtures(fxArr);
            localStorage.setItem('soccerCoach_fixtureScores',JSON.stringify(fxSc));
            msg('Imported '+fxArr.length+' fixtures, '+scCount+' results - reloading',true);
            setTimeout(()=>window.location.reload(),1500);
          }
        }catch(err){msg('Could not import: '+err.message,false);}
      };
      reader.readAsText(file);
    };
    input.click();
  }

  // ── Reset ─────────────────────────────────────────────────────────────
  function doReset(){
    ['soccerCoach_squad','soccerCoach_config','soccerCoach_games','soccerCoach_settings',
     'soccerCoach_fixtureScores','soccerCoach_teamNotes','soccerCoach_teamNicknames','soccerCoach_fixtureTeam','soccerCoach_fixtures']
      .forEach(k=>localStorage.removeItem(k));
    msg('All data cleared — reloading',true);
    setTimeout(()=>window.location.reload(),1200);
  }

  const CARD='#1A1A1A';
  const today=new Date().toISOString().split('T')[0];

  function Section({icon,title,subtitle,type,defaultName}){
    return(
      <div style={{background:CARD,borderRadius:12,padding:'14px 16px',marginBottom:10}}>
        <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
          <span style={{fontSize:20}}>{icon}</span>
          <div><div style={{fontSize:14,fontWeight:700,color:'#FFFFFF'}}>{title}</div>
          <div style={{fontSize:11,color:'#A1A1A1'}}>{subtitle}</div></div>
        </div>
        <div style={{display:'flex',gap:8}}>
          <button onClick={()=>{setExportPending({type,fname:defaultName});setFilename(defaultName);}}
            style={{flex:1,padding:'11px',borderRadius:9,border:'none',background:'#E9AA23',color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer'}}>
            ↑ Export {type==='all'?'JSON':'CSV'}
          </button>
          <button onClick={()=>doImport(type)}
            style={{flex:1,padding:'11px',borderRadius:9,border:'none',background:'#164e63',color:'#7dd3fc',fontWeight:700,fontSize:13,cursor:'pointer'}}>
            ↓ Import
          </button>
        </div>
      </div>
    );
  }

  return(
    <div style={{...S.wrap,background:'#0D0D0D'}}>
      {/* Filename modal */}
      {exportPending&&(
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.7)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:9999,padding:24}}>
          <div style={{background:'#1A1A1A',borderRadius:16,padding:24,width:'100%',maxWidth:380}}>
            <div style={{fontSize:16,fontWeight:800,color:'#FFFFFF',marginBottom:4}}>Save as</div>
            <div style={{fontSize:12,color:'#A1A1A1',marginBottom:16}}>Enter a filename for your export</div>
            <div style={{display:'flex',alignItems:'center',background:'#0D0D0D',border:'1px solid #2A2A2A',borderRadius:9,padding:'10px 12px',marginBottom:16,gap:4}}>
              <input autoFocus value={filename} onChange={e=>setFilename(e.target.value)}
                onKeyDown={e=>{if(e.key==='Enter')doExport();if(e.key==='Escape'){setExportPending(null);setFilename('');}}}
                style={{flex:1,background:'none',border:'none',color:'#FFFFFF',fontSize:14,outline:'none',fontFamily:'inherit'}}
                placeholder="filename" />
              <span style={{fontSize:12,color:'#A1A1A1',flexShrink:0}}>{exportPending.type==='all'?'.json':'.csv'}</span>
            </div>
            <div style={{display:'flex',gap:8}}>
              <button onClick={doExport} style={{flex:2,padding:'12px',borderRadius:9,border:'none',background:'#E9AA23',color:'#fff',fontWeight:700,fontSize:14,cursor:'pointer'}}>
                Export
              </button>
              <button onClick={()=>{setExportPending(null);setFilename('');}} style={{flex:1,padding:'12px',borderRadius:9,border:'1px solid #2A2A2A',background:'transparent',color:'#A1A1A1',fontWeight:700,fontSize:14,cursor:'pointer'}}>
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      <h2 style={{margin:"0 0 16px",fontSize:18,fontWeight:800,color:'#FFFFFF'}}>Import / Export</h2>

      {status&&<div style={{background:statusOk?'#110D00':'#3a0b0b',border:'1px solid '+(statusOk?'#F5C04A44':'#ef444444'),borderRadius:9,padding:'10px 14px',marginBottom:14,fontSize:13,color:statusOk?'#FCD34D':'#fca5a5',fontWeight:600,flexShrink:0}}>{status}</div>}

      <div style={{flex:1,overflowY:'auto'}}>
        <Section icon="👥" title="Team" subtitle="Squad, positions and settings" type="team" defaultName={'team-'+today} />
        <Section icon="📊" title="Scores" subtitle="Game results and match events" type="scores" defaultName={'scores-'+today} />
        <Section icon="📅" title="Fixtures" subtitle="Fixture results and team" type="fixtures" defaultName={'fixtures-'+today} />
        <Section icon="📦" title="Everything" subtitle="Full JSON backup — all data" type="all" defaultName={'soccer-backup-'+today} />

        <div style={{background:'#3a0b0b',border:'1px solid #ef444433',borderRadius:12,padding:'14px 16px',marginTop:4}}>
          <div style={{fontSize:14,fontWeight:700,color:'#fca5a5',marginBottom:4}}>🗑 Reset All Data</div>
          <div style={{fontSize:11,color:'#A1A1A1',marginBottom:12}}>Permanently clears everything. Export a backup first.</div>
          {!confirmReset
            ?<button onClick={()=>setConfirmReset(true)} style={{width:'100%',padding:'11px',borderRadius:9,border:'1px solid #ef4444',background:'transparent',color:'#ef4444',fontWeight:700,fontSize:13,cursor:'pointer'}}>Reset All Data</button>
            :<div style={{display:'flex',gap:8}}>
              <button onClick={doReset} style={{flex:1,padding:'11px',borderRadius:9,border:'none',background:'#ef4444',color:'#fff',fontWeight:700,fontSize:13,cursor:'pointer'}}>Yes, delete everything</button>
              <button onClick={()=>setConfirmReset(false)} style={{flex:1,padding:'11px',borderRadius:9,border:'1px solid #2A2A2A',background:'transparent',color:'#A1A1A1',fontWeight:700,fontSize:13,cursor:'pointer'}}>Cancel</button>
            </div>
          }
        </div>
        <div style={{borderTop:"1px solid #1E1400",paddingTop:10,marginTop:4}}>
          <button style={S.btnGhost} onClick={onBack}>← Menu</button>
        </div>
      </div>
    </div>
  );
}



// ════════════════════════════════════════════════════════════════════════════════
//  HELPERS — HOME SCREEN
// ════════════════════════════════════════════════════════════════════════════════
function getGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function getInitials(name) {
  if (!name) return '?';
  const parts = name.trim().split(/\s+/);
  return parts.length >= 2
    ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    : name[0].toUpperCase();
}

// ════════════════════════════════════════════════════════════════════════════════
//  COMPONENT: BOTTOM NAV BAR
// ════════════════════════════════════════════════════════════════════════════════
function BottomNav({ activeTab, onTab }) {
  const tabs = [
    { id:'home',   icon:'⊞',  svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>, label:'Home' },
    { id:'match',  icon:'⚽', svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/><path d="M2 12h20"/></svg>, label:'Match' },
    { id:'season', icon:'📅', svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>, label:'Season' },
    { id:'team',   icon:'👥', svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>, label:'Team' },
    { id:'more',   icon:'···', svg:<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>, label:'More' },
  ];
  return (
    <nav style={{
      position:'fixed', bottom:0, left:0, right:0, zIndex:200,
      background:'#0d1526', borderTop:'1px solid #1E1400',
      display:'flex', justifyContent:'space-around', alignItems:'center',
      paddingBottom:'max(env(safe-area-inset-bottom),4px)',
      paddingTop:6,
    }}>
      {tabs.map(t => {
        const active = activeTab === t.id;
        return (
          <button key={t.id} onClick={() => onTab(t.id)} style={{
            background:'none', border:'none', cursor:'pointer',
            display:'flex', flexDirection:'column', alignItems:'center', gap:3,
            padding:'4px 8px', color: active ? '#F5C04A' : '#A1A1A1',
            minWidth:56,
          }}>
            <span style={{display:'flex', alignItems:'center', justifyContent:'center', width:22, height:22}}>
              {React.cloneElement(t.svg, { stroke: active ? '#F5C04A' : '#A1A1A1' })}
            </span>
            <span style={{fontSize:10, fontWeight: active ? 700 : 500, letterSpacing:0.3}}>{t.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  SCREEN: HOME DASHBOARD
// ════════════════════════════════════════════════════════════════════════════════
function HomeScreen({ games, settings, onMatchDay, onGoSeason, onGoTeam }) {
  const coachName = settings?.coachName || 'Coach';
  const teamName  = settings?.teamName  || localStorage.getItem('soccerCoach_fixtureTeam') || 'My Team';
  const initials  = getInitials(coachName);

  // Next upcoming fixture
  const myTeam = localStorage.getItem('soccerCoach_fixtureTeam') || '';
  const nextFix = FIXTURES.find(f => isUpcoming(f));
  const isHome  = nextFix && nextFix.home === myTeam;
  const opponent = nextFix ? (isHome ? nextFix.away : nextFix.home) : null;

  // Season stats
  const { played, wins, draws, losses } = computeSeasonStats();

  // Most recent result
  const allRes  = getAllResults();
  const lastRes = allRes.length > 0 ? allRes[allRes.length - 1] : null;

  const DAYS = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

  function formatFixDate(f) {
    if (!f?.date) return '';
    const d = parseFixtureDate(f.date);
    if (!d) return f.date;
    return `${DAYS[d.getDay()]} ${d.getDate()} ${MONTHS[d.getMonth()]}`;
  }

  return (
    <div style={{ minHeight:'100vh', background:'#0D0D0D', paddingBottom:80, paddingTop:'max(env(safe-area-inset-top),0px)' }}>

      {/* ── Khula Hero Banner ── */}
      <div style={{
        background:'#000000',
        borderBottom:'1px solid #F5C04A22',
        paddingTop:'max(env(safe-area-inset-top),0px)',
      }}>
        <svg viewBox="0 0 400 100" width="100%" style={{display:'block'}} overflow="visible">

          {/* ── SWOOSH ARC — wraps around player ── */}
          <path d="M 96 94 A 56 56 0 1 1 96 6"
            stroke="#F5C04A" strokeWidth="4" fill="none" strokeLinecap="round"/>

          {/* ── PLAYER SILHOUETTE (filled, kicking pose) ── */}

          {/* Head */}
          <circle cx="82" cy="13" r="10" fill="#F5C04A"/>

          {/* Torso — thick stroke = mass */}
          <path d="M 82 23 Q 80 36 75 50"
            stroke="#F5C04A" strokeWidth="15" strokeLinecap="round" fill="none"/>

          {/* Right arm — raised forward/left (arms out for balance) */}
          <path d="M 80 30 Q 65 24 52 19"
            stroke="#F5C04A" strokeWidth="9" strokeLinecap="round" fill="none"/>
          <path d="M 52 19 Q 43 16 36 15"
            stroke="#F5C04A" strokeWidth="7" strokeLinecap="round" fill="none"/>

          {/* Left arm — swings back-right */}
          <path d="M 80 30 Q 93 38 102 47"
            stroke="#F5C04A" strokeWidth="9" strokeLinecap="round" fill="none"/>
          <path d="M 102 47 Q 108 55 110 62"
            stroke="#F5C04A" strokeWidth="7" strokeLinecap="round" fill="none"/>

          {/* Right / support leg — planted, slightly bent */}
          <path d="M 77 50 Q 86 66 84 82"
            stroke="#F5C04A" strokeWidth="12" strokeLinecap="round" fill="none"/>
          <path d="M 84 82 Q 82 90 78 93"
            stroke="#F5C04A" strokeWidth="9" strokeLinecap="round" fill="none"/>
          {/* Support foot flat */}
          <path d="M 78 93 Q 68 97 60 95"
            stroke="#F5C04A" strokeWidth="7" strokeLinecap="round" fill="none"/>

          {/* Left / kicking leg — thigh swings forward-left */}
          <path d="M 75 50 Q 58 60 44 68"
            stroke="#F5C04A" strokeWidth="12" strokeLinecap="round" fill="none"/>
          {/* Lower kicking leg extends toward ball */}
          <path d="M 44 68 Q 31 74 20 76"
            stroke="#F5C04A" strokeWidth="10" strokeLinecap="round" fill="none"/>
          {/* Kicking foot */}
          <path d="M 20 76 Q 11 78 6 80"
            stroke="#F5C04A" strokeWidth="7" strokeLinecap="round" fill="none"/>

          {/* ── BALL ── */}
          <circle cx="22" cy="90" r="0" fill="none"/>
          {/* Ball outline */}
          <circle cx="14" cy="90" r="9" stroke="#F5C04A" strokeWidth="2.5" fill="none"/>
          {/* Ball pentagon pattern */}
          <path d="M 14 81 Q 18 85 14 90 Q 10 95 14 99"
            stroke="#F5C04A" strokeWidth="1.2" fill="none" opacity="0.55"/>
          <path d="M 6 84 Q 10 88 14 90 Q 18 92 22 88"
            stroke="#F5C04A" strokeWidth="1.2" fill="none" opacity="0.55"/>

          {/* ── MOTION LINES ── */}
          <line x1="3" y1="83" x2="-10" y2="79" stroke="#F5C04A" strokeWidth="2.2" strokeLinecap="round"/>
          <line x1="3" y1="89" x2="-12" y2="89" stroke="#F5C04A" strokeWidth="2.2" strokeLinecap="round"/>
          <line x1="4" y1="95" x2="-8" y2="99" stroke="#F5C04A" strokeWidth="2.2" strokeLinecap="round"/>

          {/* ══ KHULA WORDMARK ══ */}
          <text x="122" y="66"
            fontFamily="'Outfit',sans-serif" fontSize="56" fontWeight="900"
            fill="#FFFFFF" letterSpacing="4">KHULA</text>

          {/* Gold ▲ caret above the A in KHULA */}
          {/* "KHUL" ≈ 4 chars × 36px + 3 gaps × 4px = 144+12=156, A center ≈ 122+156+18=296 */}
          <polygon points="295,4 305,18 285,18" fill="#F5C04A"/>

          {/* Tagline */}
          <text x="124" y="82"
            fontFamily="'Outfit',sans-serif" fontSize="10.5" fontWeight="600"
            fill="#F5C04A" letterSpacing="2.5">PLAY. CONNECT. ELEVATE.</text>

        </svg>
      </div>

      {/* ── Coach Header ── */}
      <div style={{ padding:'14px 20px 12px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
        <div style={{ display:'flex', alignItems:'center', gap:12 }}>
          <div style={{
            width:42, height:42, borderRadius:'50%',
            background:'linear-gradient(135deg,#3D2000,#F5C04A)',
            display:'flex', alignItems:'center', justifyContent:'center',
            fontSize:15, fontWeight:800, color:'#0D0D0D', flexShrink:0,
          }}>{initials}</div>
          <div>
            <div style={{ fontSize:11, color:'#A1A1A1', fontWeight:500 }}>{getGreeting()},</div>
            <div style={{ fontSize:17, fontWeight:800, color:'#FFFFFF', lineHeight:1.2 }}>{coachName} 👋</div>
            <div style={{ fontSize:10, color:'#A1A1A1', marginTop:1 }}>⚽ {teamName}</div>
          </div>
        </div>
        <button onClick={onGoTeam} style={{ background:'none', border:'1px solid #2A2A2A', borderRadius:10, padding:'7px 10px', cursor:'pointer', color:'#A1A1A1' }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="8" r="4"/><path d="M20 21a8 8 0 1 0-16 0"/></svg>
        </button>
      </div>

      {/* ── Next Match Card ── */}
      {nextFix ? (
        <div onClick={onGoSeason} style={{
          margin:'0 16px 16px', borderRadius:16, overflow:'hidden',
          background:'linear-gradient(135deg,#1A0900 0%,#2E1800 60%,#3D2000 100%)',
          border:'1px solid #F5C04A44', cursor:'pointer',
        }}>
          <div style={{ padding:'16px 18px' }}>
            <div style={{ fontSize:10, fontWeight:700, color:'#FDE68A', letterSpacing:1.5, textTransform:'uppercase', marginBottom:10 }}>
              {nextFix.round ? nextFix.round + '  ·  ' : ''}Upcoming Match
            </div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between' }}>
              <div>
                <div style={{ fontSize:20, fontWeight:800, color:'#fff', marginBottom:4 }}>vs {opponent}</div>
                <div style={{ fontSize:13, color:'#FDE68A', display:'flex', alignItems:'center', gap:8 }}>
                  <span>{formatFixDate(nextFix)}{nextFix.time ? ' · ' + nextFix.time : ''}</span>
                </div>
                <div style={{ fontSize:12, color:'#FCD34D88', marginTop:4 }}>
                  {isHome ? '🏠 Home' : '✈️ Away'}{nextFix.venue ? '  ·  ' + nextFix.venue : ''}
                </div>
              </div>
              <div style={{
                width:52, height:52, borderRadius:12,
                background:'#ffffff18', border:'1px solid #ffffff25',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:26,
              }}>⚽</div>
            </div>
          </div>
          <div style={{ background:'#ffffff0a', padding:'10px 18px', display:'flex', alignItems:'center', justifyContent:'space-between' }}>
            <span style={{ fontSize:12, color:'#FDE68A', fontWeight:600 }}>View fixtures →</span>
          </div>
        </div>
      ) : (
        <div style={{ margin:'0 16px 16px', borderRadius:16, background:'#1A1A1A', border:'1px solid #1E1400', padding:'20px 18px', textAlign:'center' }}>
          <div style={{ fontSize:28, marginBottom:8 }}>📅</div>
          <div style={{ fontSize:14, color:'#A1A1A1' }}>No upcoming fixtures</div>
          <div style={{ fontSize:12, color:'#A1A1A1', marginTop:4 }}>Import your fixture schedule in More → Import/Export</div>
        </div>
      )}

      {/* ── Season Stats ── */}
      {played > 0 && (
        <div style={{ margin:'0 16px 16px' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'#A1A1A1', letterSpacing:1.5, textTransform:'uppercase', marginBottom:8 }}>This season</div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:8 }}>
            {[['Played', played, '#FFFFFF'], ['Won', wins, '#F5C04A'], ['Drawn', draws, '#f59e0b'], ['Lost', losses, '#ef4444']].map(([label, val, color]) => (
              <div key={label} style={{ background:'#1A1A1A', borderRadius:12, padding:'12px 8px', textAlign:'center', border:'1px solid #1E1400' }}>
                <div style={{ fontSize:22, fontWeight:800, color }}>{val}</div>
                <div style={{ fontSize:10, color:'#A1A1A1', fontWeight:600, marginTop:2 }}>{label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Quick Actions ── */}
      <div style={{ margin:'0 16px 16px' }}>
        <div style={{ fontSize:10, fontWeight:700, color:'#A1A1A1', letterSpacing:1.5, textTransform:'uppercase', marginBottom:8 }}>Quick actions</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:10 }}>
          {[
            { icon:'⚽', label:'Match Day', action: onMatchDay, highlight: true },
            { icon:'📅', label:'Season',    action: onGoSeason },
            { icon:'👥', label:'Team',      action: onGoTeam },
            { icon:'📊', label:'Stats',     action: onGoSeason },
          ].map(item => (
            <button key={item.label} onClick={item.action} style={{
              background: item.highlight ? '#F5C04A' : '#1A1A1A',
              border: item.highlight ? 'none' : '1px solid #1E1400',
              borderRadius:14, padding:'14px 4px 10px',
              display:'flex', flexDirection:'column', alignItems:'center', gap:6,
              cursor:'pointer',
            }}>
              <span style={{ fontSize:24 }}>{item.icon}</span>
              <span style={{ fontSize:11, fontWeight:700, color: item.highlight ? '#0D0D0D' : '#FFFFFF', lineHeight:1.2 }}>{item.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* ── Recent Result ── */}
      {lastRes && (
        <div style={{ margin:'0 16px 0' }}>
          <div style={{ fontSize:10, fontWeight:700, color:'#A1A1A1', letterSpacing:1.5, textTransform:'uppercase', marginBottom:8 }}>Last result</div>
          <div style={{ background:'#1A1A1A', borderRadius:14, padding:'14px 16px', border:'1px solid #1E1400', display:'flex', alignItems:'center', gap:12 }}>
            {(() => {
              const res = lastRes.us > lastRes.them ? 'W' : lastRes.us < lastRes.them ? 'L' : 'D';
              const col = res==='W' ? '#F5C04A' : res==='L' ? '#ef4444' : '#f59e0b';
              return <>
                <div style={{ width:36, height:36, borderRadius:10, background:col+'22', border:`1px solid ${col}44`, display:'flex', alignItems:'center', justifyContent:'center', fontWeight:800, fontSize:14, color:col, flexShrink:0 }}>{res}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:14, fontWeight:700, color:'#FFFFFF' }}>vs {lastRes.opponent}</div>
                  <div style={{ fontSize:11, color:'#A1A1A1', marginTop:2 }}>{lastRes.dateStr || ''}{lastRes.round ? ' · ' + lastRes.round : ''}</div>
                </div>
                <div style={{ fontSize:22, fontWeight:800, color:'#FFFFFF' }}>{lastRes.us}–{lastRes.them}</div>
              </>;
            })()}
          </div>
        </div>
      )}
    </div>
  );
}

// ════════════════════════════════════════════════════════════════════════════════
//  SCREEN: MORE (settings hub)
// ════════════════════════════════════════════════════════════════════════════════
function MoreScreen({ onSettings, onImportExport }) {
  const items = [
    { icon:'⚙️', label:'Settings', sub:'Team name, coach, formation', action: onSettings },
    { icon:'📦', label:'Import / Export', sub:'Backup data, import fixtures & scores', action: onImportExport },
  ];
  return (
    <div style={{ minHeight:'100vh', background:'#0D0D0D', paddingBottom:90, paddingTop:'max(env(safe-area-inset-top),16px)' }}>
      <div style={{ padding:'20px 20px 16px' }}>
        <h1 style={{ margin:0, fontSize:24, fontWeight:800, color:'#FFFFFF' }}>More</h1>
      </div>
      <div style={{ padding:'0 16px', display:'flex', flexDirection:'column', gap:10 }}>
        {items.map(item => (
          <button key={item.label} onClick={item.action} style={{
            background:'#1A1A1A', border:'1px solid #1E1400', borderRadius:14,
            padding:'16px', display:'flex', alignItems:'center', gap:14,
            cursor:'pointer', textAlign:'left', width:'100%',
          }}>
            <span style={{ fontSize:26, flexShrink:0 }}>{item.icon}</span>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:'#FFFFFF' }}>{item.label}</div>
              <div style={{ fontSize:12, color:'#A1A1A1', marginTop:2 }}>{item.sub}</div>
            </div>
            <span style={{ marginLeft:'auto', color:'#2A2A2A', fontSize:18 }}>›</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default function App() {
  const [activeTab, setActiveTab]   = useState("home");
  const [screen, setScreen]         = useState("home");
  const [games, setGames]           = useState(()=>loadGames());
  const [settings, setSettings]     = useState(()=>loadSettings());
  const [squad, setSquad]           = useState([]);
  const [config, setConfig]         = useState({halfMins:24,numPeriods:3,formation:DEFAULT_FORMATION});
  const [opponent, setOpponent]     = useState("");
  const [half1, setHalf1]           = useState(null);
  const [squadMode, setSquadMode]   = useState("newGame");
  const [linkedFixKey, setLinkedFixKey] = useState(null);
  const [fixIsHome,    setFixIsHome]    = useState(null);
  const [openGameId, setOpenGameId] = useState(null);
  const [scoutTeam, setScoutTeam]   = useState("");
  const [squadBackTo, setSquadBackTo] = useState("home");

  // Hide bottom nav during active match recording
  const hideNav = screen === "match";

  function goTab(tab) {
    setActiveTab(tab);
    const roots = { home:"home", match:"squad", season:"season", team:"teamScreen", more:"more" };
    if (tab === "match") { setSquadMode("newGame"); setSquadBackTo("home"); }
    setScreen(roots[tab]);
  }

  function saveGame(game){
    const next=[...games,game]; setGames(next); saveGames(next);
    if(game.linkedFixtureKey){
      const fxSc = loadFxScores();
      const us=game.scoreUs||0, them=game.scoreThem||0;
      fxSc[game.linkedFixtureKey] = game.fixtureIsHome ? {home:us,away:them} : {home:them,away:us};
      saveFxScores(fxSc);
    }
    setActiveTab("season"); setScreen("season");
  }
  function deleteGame(id){ const next=games.filter(g=>g.id!==id); setGames(next); saveGames(next); }
  function updateGame(updated){ const next=games.map(g=>g.id===updated.id?updated:g); setGames(next); saveGames(next); }
  function handleSaveSettings(s){ setSettings(s); saveSettings(s); }

  function renderScreen() {
    if(screen==="home")         return <HomeScreen games={games} settings={settings} onMatchDay={()=>goTab("match")} onGoSeason={()=>goTab("season")} onGoTeam={()=>goTab("team")} />;
    if(screen==="more")         return <MoreScreen onSettings={()=>setScreen("settings")} onImportExport={()=>setScreen("importExport")} />;
    if(screen==="settings")     return <SettingsScreen settings={settings} onSave={handleSaveSettings} onBack={()=>setScreen("more")} onViewImportExport={()=>setScreen("importExport")} />;
    if(screen==="importExport") return <ImportExportScreen onBack={()=>setScreen("more")} />;
    if(screen==="season")       return <SeasonHubScreen games={games} onBack={()=>goTab("home")} onOpenGame={id=>{setOpenGameId(id);setScreen("gameDetail");}} onDeleteGame={deleteGame} />;
    if(screen==="gameDetail"){  const game=games.find(g=>g.id===openGameId); return <GameDetailScreen game={game} onBack={()=>setScreen("season")} onUpdateGame={updateGame} />; }
    if(screen==="teamScreen")   return <TeamScreen onBack={()=>goTab("home")} onViewStats={()=>setScreen("stats")} onManageSquad={()=>{setSquadMode("manage");setSquadBackTo("teamScreen");setScreen("squad");}} />;
    if(screen==="stats")        return <StatsScreen games={games} onBack={()=>setScreen("teamScreen")} />;
    if(screen==="opponentStats") return <OpponentStatsScreen opponent={scoutTeam} onBack={()=>setScreen("squad")} />;
    if(screen==="squad")        return <SquadScreen mode={squadMode} onNext={(s,c,opp,lfk,fih)=>{setSquad(s);setConfig(c);setOpponent(opp);setLinkedFixKey(lfk);setFixIsHome(fih);setScreen("picker");}} onBack={()=>setScreen(squadBackTo)} onViewOpponent={t=>{setScoutTeam(t);setScreen("opponentStats");}} />;
    if(screen==="picker")       return <PickerScreen squad={squad} config={config} opponent={opponent} onNext={h=>{setHalf1(h);setScreen("match");}} onBack={()=>setScreen("squad")} />;
    if(screen==="match")        return <MatchScreen half1={half1} config={config} squad={squad} opponent={opponent} linkedFixKey={linkedFixKey} fixIsHome={fixIsHome} onSaveGame={saveGame} onExit={()=>{ setActiveTab("home"); setScreen("home"); }} />;
    return null;
  }

  return (
    <div style={{ minHeight:"100vh", background:"#0D0D0D", position:"relative" }}>
      {renderScreen()}
      {!hideNav && <BottomNav activeTab={activeTab} onTab={goTab} />}
    </div>
  );
}


// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  page:         { minHeight:"100vh", background:"#0D0D0D", display:"flex", alignItems:"center", justifyContent:"center", padding:16, paddingTop:"max(env(safe-area-inset-top),16px)", paddingBottom:"max(env(safe-area-inset-bottom),16px)", boxSizing:"border-box" },
  card:         { background:"#1A1A1A", border:"1px solid #1E1400", borderRadius:16, padding:"24px 20px", width:"100%", maxWidth:DEVICE.cardMax, display:"flex", flexDirection:"column", gap:12 },
  pill:         { alignSelf:"flex-start", background:"#F5C04A22", color:"#F5C04A", border:"1px solid #F5C04A44", borderRadius:20, fontSize:11, fontWeight:700, padding:"3px 12px", letterSpacing:2 },
  h1:           { margin:0, fontSize:24, fontWeight:800, color:"#FFFFFF" },
  sub:          { margin:0, fontSize:13, color:"#A1A1A1", lineHeight:1.5 },
  fieldLbl:     { fontSize:12, fontWeight:700, color:"#A1A1A1", marginBottom:4 },
  inp:          { flex:1, background:"#0D0D0D", border:"1px solid #2A2A2A", borderRadius:8, color:"#FFFFFF", fontSize:14, padding:"9px 12px", outline:"none", fontFamily:"inherit" },
  btnAdd:       { background:"#E9AA23", color:"#fff", border:"none", borderRadius:8, padding:"9px 16px", fontWeight:700, fontSize:14, cursor:"pointer" },
  btnGreen:     { background:"#F5C04A", color:"#0D0D0D", border:"none", borderRadius:10, padding:"12px 0", fontWeight:800, fontSize:14, cursor:"pointer" },
  btnBlue:      { background:"#E9AA23", color:"#fff", border:"none", borderRadius:10, padding:"12px 0", fontWeight:800, fontSize:14, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:6 },
  btnDark:      { background:"#0D0D0D", color:"#cbd5e1", border:"1px solid #2A2A2A", borderRadius:10, padding:"12px 0", fontWeight:700, fontSize:14, cursor:"pointer" },
  btnCancel:    { background:"#1A1A1A", color:"#A1A1A1", border:"1px solid #2A2A2A", borderRadius:10, padding:"12px 16px", fontWeight:700, fontSize:14, cursor:"pointer" },
  btnGhost:     { background:"none", border:"1px solid #2A2A2A", color:"#A1A1A1", borderRadius:8, padding:"6px 10px", fontSize:14, cursor:"pointer", alignSelf:"flex-start" },
  backBtn:      { background:"none", border:"1px solid #2A2A2A", color:"#A1A1A1", borderRadius:8, padding:"6px 10px", fontSize:13, cursor:"pointer" },
  btnX:         { background:"none", border:"none", color:"#A1A1A1", fontSize:14, cursor:"pointer", padding:"0 2px" },
  btnTinyX:     { background:"none", border:"none", color:"#A1A1A1", fontSize:11, cursor:"pointer", marginLeft:4 },
  scoreTile:    { background:"#0D0D0D", borderRadius:12, padding:"14px 16px", border:"1px solid #1E1400" },
  scoreTileStat:{ flex:1, textAlign:"center" },
  scoreTileNum: { fontSize:24, fontWeight:900, color:"#FFFFFF" },
  scoreTileLbl: { fontSize:10, color:"#A1A1A1", fontWeight:700, marginTop:2 },
  tileGrid:     { display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 },
  tile:         { aspectRatio:"1", borderRadius:14, display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", gap:8, cursor:"pointer", padding:0 },
  tileIcon:     { fontSize:30 },
  tileLbl:      { fontSize:13, fontWeight:700, color:"#FFFFFF", textAlign:"center", lineHeight:1.2 },
  gameRow:      { display:"flex", alignItems:"center", gap:10, background:"#0D0D0D", borderRadius:10, padding:"10px 12px", cursor:"pointer" },
  resultBadge:  { width:30, height:30, borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:14, flexShrink:0 },
  gameOpp:      { fontSize:14, fontWeight:700, color:"#FFFFFF", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" },
  gameDate:     { fontSize:11, color:"#A1A1A1" },
  gameScore:    { fontSize:18, fontWeight:800, color:"#FFFFFF" },
  detailScore:  { fontSize:36, fontWeight:900, color:"#FFFFFF" },
  factGrid:     { display:"grid", gridTemplateColumns:"1fr 1fr", gap:8 },
  factCard:     { background:"#0D0D0D", borderRadius:10, padding:"10px 12px" },
  factLbl:      { fontSize:10, color:"#A1A1A1", fontWeight:700, marginBottom:4 },
  factVal:      { fontSize:15, fontWeight:800, color:"#FFFFFF" },
  scorerBox:    { background:"#0D0D0D", borderRadius:10, padding:"10px 12px", border:"1px solid #F5C04A22", display:"flex", flexDirection:"column", gap:6 },
  scorerHd:     { fontSize:11, fontWeight:800, color:"#A1A1A1", letterSpacing:0.5 },
  scorerRow:    { display:"flex", justifyContent:"space-between", alignItems:"center", fontSize:13 },
  reportBox:    { background:"#0D0D0D", borderRadius:10, padding:"14px 16px", fontSize:13, color:"#e2e8f0", lineHeight:1.7, whiteSpace:"pre-wrap", maxHeight:"50vh", overflowY:"auto" },
  squadList:    { display:"flex", flexDirection:"column", gap:4, maxHeight:200, overflowY:"auto" },
  squadRow:     { display:"flex", alignItems:"center", gap:6, background:"#0D0D0D", borderRadius:8, padding:"6px 8px" },
  squadNum:     { fontSize:11, color:"#A1A1A1", minWidth:16 },
  squadName:    { flex:1, fontSize:13, color:"#FFFFFF", fontWeight:600, whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" },
  posSel:       { background:"#1A1A1A", border:"1px solid #2A2A2A", borderRadius:6, color:"#A1A1A1", fontSize:11, padding:"4px 4px", outline:"none", fontFamily:"inherit", maxWidth:96 },
  empty:        { fontSize:13, color:"#2A2A2A", padding:"12px 0", textAlign:"center" },
  warn:         { margin:0, fontSize:11, color:"#f59e0b", textAlign:"center" },
  configBox:    { background:"#0D0D0D", borderRadius:10, padding:"12px 14px", display:"flex", flexDirection:"column", gap:10 },
  configHd:     { fontSize:12, fontWeight:700, color:"#A1A1A1" },
  configRow:    { display:"flex", alignItems:"center", justifyContent:"space-between" },
  configLbl:    { fontSize:13, color:"#A1A1A1" },
  configVal:    { display:"flex", alignItems:"center", gap:8 },
  stepBtn:      { background:"#1A1A1A", border:"1px solid #2A2A2A", color:"#FFFFFF", borderRadius:6, width:28, height:28, fontSize:16, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center" },
  stepNum:      { fontSize:14, fontWeight:700, color:"#FFFFFF", minWidth:64, textAlign:"center" },
  pickerGrid:   { display:"flex", flexDirection:"column", gap:8 },
  pickerRow:    { display:"flex", alignItems:"center", gap:10 },
  pickerLabel:  { fontSize:12, fontWeight:700, color:"#A1A1A1", minWidth:124, textAlign:"right" },
  sel:          { flex:1, background:"#0D0D0D", border:"1px solid #2A2A2A", borderRadius:8, color:"#FFFFFF", fontSize:13, padding:"8px 10px", outline:"none", fontFamily:"inherit" },
  benchPreview: { background:"#0D0D0D", borderRadius:8, padding:"8px 12px", fontSize:12, color:"#A1A1A1" },
  benchPreviewHd:{ fontWeight:700, color:"#A1A1A1" },
  wrap:         { minHeight:"100vh", background:"#0D0D0D", color:"#FFFFFF", fontFamily:"'Inter',system-ui,sans-serif", display:"flex", flexDirection:"column", alignItems:"center", padding:"10px 8px 24px", paddingTop:"max(env(safe-area-inset-top),10px)" },
  header:       { width:"100%", maxWidth:500, display:"flex", alignItems:"center", justifyContent:"space-between", marginBottom:4, paddingTop:"max(env(safe-area-inset-top),4px)" },
  gameClock:    { display:"flex", flexDirection:"column", alignItems:"center", background:"#1A1A1A", borderRadius:8, padding:"4px 10px", border:"1px solid #2A2A2A" },
  clockLabel:   { fontSize:7, color:"#A1A1A1", fontWeight:700, letterSpacing:1 },
  gameClockNum: { fontVariantNumeric:"tabular-nums", fontSize:16, fontWeight:800, color:"#FFFFFF" },
  btnSm:        { border:"none", borderRadius:7, padding:"5px 9px", fontSize:12, fontWeight:700, color:"#fff", cursor:"pointer", minWidth:32 },
  micBtn:       { display:"flex", flexDirection:"column", alignItems:"center", justifyContent:"center", width:52, height:52, borderRadius:12, border:"1px solid #2A2A2A", fontSize:22, cursor:"pointer", flexShrink:0, background:"#1A1A1A", transition:"background 0.2s" },
  alarmBanner:  { background:"#ef444422", border:"1px solid #ef4444", color:"#fca5a5", borderRadius:8, padding:"7px 14px", fontSize:12, fontWeight:600, textAlign:"center", width:"100%", maxWidth:500, marginBottom:5 },
  tabsRow:      { display:"flex", alignItems:"center", gap:8, marginBottom:5, width:"100%", maxWidth:500, flexWrap:"wrap" },
  halfChip:     { fontSize:10, fontWeight:800, color:"#06b6d4", background:"#06b6d422", border:"1px solid #06b6d444", borderRadius:6, padding:"4px 8px", letterSpacing:0.5, whiteSpace:"nowrap" },
  tabs:         { display:"flex", gap:5, flexWrap:"wrap" },
  tab:          { background:"#1A1A1A", border:"1px solid #2A2A2A", color:"#A1A1A1", borderRadius:8, padding:"5px 9px", fontSize:11, fontWeight:600, cursor:"pointer" },
  tabOn:        { background:"#E9AA23", border:"1px solid #3b82f6", color:"#fff" },
  legend:       { display:"flex", gap:7, marginBottom:5, flexWrap:"wrap", alignItems:"center", width:"100%", maxWidth:500 },
  legendRow:    { display:"flex", alignItems:"center", gap:4 },
  dot:          { width:8, height:8, borderRadius:"50%", flexShrink:0 },
  mainRow:      { display:"flex", gap:10, alignItems:"flex-start", width:"100%", maxWidth:500 },
  pitchOuter:   { flex:1, borderRadius:12, overflow:"hidden", border:"2px solid #F5C04A44", background:"linear-gradient(180deg,#4A2B00 0%,#3D2000 50%,#4A2B00 100%)", position:"relative", aspectRatio:"0.68", touchAction:"none" },
  cc:           { position:"absolute", top:"50%", left:"50%", transform:"translate(-50%,-50%)", width:"30%", paddingBottom:"30%", border:"1.5px solid #ffffff20", borderRadius:"50%", pointerEvents:"none" },
  hw:           { position:"absolute", top:"50%", left:0, right:0, height:1.5, background:"#ffffff20", pointerEvents:"none" },
  ptop:         { position:"absolute", top:0, left:"25%", right:"25%", height:"12%", border:"1.5px solid #ffffff20", borderTop:"none", pointerEvents:"none" },
  pbot:         { position:"absolute", bottom:0, left:"25%", right:"25%", height:"12%", border:"1.5px solid #ffffff20", borderBottom:"none", pointerEvents:"none" },
  token:        { borderRadius:7, padding:"5px 5px", fontSize:10, fontWeight:700, color:"#fff", textAlign:"center", width:60, lineHeight:1.2, userSelect:"none", transition:"transform 0.1s, box-shadow 0.15s", whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" },
  emptySlot:    { width:58, height:28, border:"1.5px dashed #ffffff30", borderRadius:7 },
  posLbl:       { fontSize:7, color:"#ffffff60", fontWeight:600, letterSpacing:0.5, textTransform:"uppercase", textAlign:"center" },
  bench:        { width:88, borderRadius:12, border:"1px solid #2A2A2A", background:"#1a2236", padding:"10px 6px", display:"flex", flexDirection:"column", alignItems:"center", minHeight:280 },
  benchHd:      { fontSize:9, fontWeight:800, color:"#A1A1A1", letterSpacing:1.5, marginBottom:8 },
  benchEm:      { fontSize:12, color:"#2A2A2A", marginTop:8 },
  benchDiv:     { width:"100%", height:1, background:"#2A2A2A", margin:"8px 0" },
  hint:         { marginTop:6, fontSize:10, color:"#A1A1A1", textAlign:"center", marginBottom:12 },
  goalSection:  { width:"100%", maxWidth:500, background:"#1A1A1A", borderRadius:12, padding:"12px 14px", marginTop:8, display:"flex", flexDirection:"column", gap:8 },
  goalHeader:   { display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:8 },
  scoreBlock:   { display:"flex", alignItems:"center", gap:8 },
  scoreLabel:   { fontSize:11, fontWeight:700, color:"#A1A1A1" },
  scoreNum:     { fontSize:28, fontWeight:900, color:"#FFFFFF", minWidth:24, textAlign:"center" },
  scoreDash:    { fontSize:20, color:"#2A2A2A" },
  btnGoalUs:    { background:"#3D2000", color:"#FDE68A", border:"1px solid #F5C04A44", borderRadius:7, padding:"6px 10px", fontSize:11, fontWeight:700, cursor:"pointer" },
  btnGoalThem:  { background:"#7f1d1d", color:"#fca5a5", border:"1px solid #ef444444", borderRadius:7, padding:"6px 10px", fontSize:11, fontWeight:700, cursor:"pointer" },
  goalLog:      { display:"flex", flexDirection:"column", gap:3 },
  goalEntry:    { display:"flex", alignItems:"center", justifyContent:"space-between", background:"#0D0D0D", borderRadius:6, padding:"5px 10px", fontSize:11, fontWeight:600 },
  btnNotes:     { flex:1, background:"#1A1A1A", border:"1px solid #2A2A2A", color:"#A1A1A1", borderRadius:10, padding:"11px 0", fontWeight:700, fontSize:13, cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:4 },
  noteBadge:    { display:"inline-block", background:"#06b6d4", color:"#0D0D0D", borderRadius:10, fontSize:10, fontWeight:800, padding:"1px 6px", marginLeft:4 },
  btnReport:    { flex:1, background:"linear-gradient(135deg,#E9AA23,#7c3aed)", color:"#fff", border:"none", borderRadius:10, padding:"11px 0", fontWeight:800, fontSize:13, cursor:"pointer" },
  halfBar:      { display:"flex", alignItems:"center", justifyContent:"space-between", gap:10, width:"100%", maxWidth:500, marginTop:14, background:"#1A1A1A", borderRadius:12, padding:"8px 12px" },
  halfArrow:    { background:"#0D0D0D", border:"1px solid #2A2A2A", color:"#FFFFFF", borderRadius:8, width:40, height:36, fontSize:18, fontWeight:800, cursor:"pointer" },
  halfBarCenter:{ display:"flex", gap:6 },
  halfPill:     { fontSize:12, fontWeight:700, color:"#A1A1A1", background:"#0D0D0D", border:"1px solid #2A2A2A", borderRadius:8, padding:"7px 14px", cursor:"pointer" },
  halfPillOn:   { color:"#FFFFFF", background:"#E9AA23", borderColor:"#3b82f6" },
  swipeHint:    { fontSize:9, color:"#2A2A2A", textAlign:"center", margin:"2px 0 0" },
};
