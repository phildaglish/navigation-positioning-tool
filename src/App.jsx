import { useState } from "react";
import { supabase } from "./supabaseClient";

const GLOSSARY = {
  "Flourishing":"The state where connection with others, genuine enjoyment, and a sense of forward motion are all present and working together. The wellspring.",
  "Awakening":"An established return — awareness and energy coming back online after difficulty. The turn has happened and is holding.",
  "Anguish":"The deepest form of difficult experience — where pain is acute, pathways feel blocked, and the usual responses are unavailable. Requires safety and care before anything else.",
  "Despair":"The floor. Both capacity and hope have collapsed simultaneously. Requires contact and care before anything else.",
  "Ambivalence":"Holding two equally important directions simultaneously, unable to move toward either. Not indecision — both things genuinely matter.",
  "Adrift":"The specific absence of joy, pleasure, or gratitude — not crisis, not suffering, but a flatness that signals something genuine is missing.",
  "Stuck":"Movement has stopped despite available capacity. Something is blocking it — not inability but reluctance.",
  "Lost Connection":"Separation from meaningful relationship. The wound that needs connection to heal.",
  "Self-Doubt":"The experience of moving backwards — losing ground or confidence that was previously present.",
  "Disheartened":"Sustained joylessness. Not sadness, which is acute — disheartened is chronic. The absence of delight over time.",
  "Sealed":"Complete protective closure. An intelligent response to sustained threat — but a tent, not a permanent structure.",
  "Numbing":"The reduction of emotional signal to manageable levels. A survival strategy — dampening feeling to survive overwhelm.",
  "Embattled":"Active defence against perceived threat. Consuming most available energy in fighting rather than moving.",
  "Grief":"The natural response to genuine loss. Not a disorder — a process that cannot be rushed or bypassed.",
  "Sanctuary":"A protected space created deliberately to allow recovery. Not hiding — intelligent withdrawal.",
  "Hibernation":"Deep inward rest. All available energy drawn toward restoration. Like winter — preparation for return.",
  "Capacity to deal with this":"How much you actually have available right now — after accounting for everything else already in use.",
  "Hope":"A force with direction and magnitude. Both are required. Direction without magnitude is paralysis. Magnitude without direction is misdirected energy.",
  "Meaning":"The sense that what you are experiencing connects to something that matters.",
  "Certainty":"Understanding of what is happening and what to do next. Uncertainty drains capacity.",
  "Shame":"The belief that you are fundamentally flawed — distinct from guilt, which is about what you did.",
  "Driving force":"The underlying mechanism that keeps a person in their current position.",
  "Witnessing":"Being seen without being fixed or advised.",
};

function Term({ term, children, onOpen }) {
  return (
    <span style={{color:"#c8892a",borderBottom:"1px dotted #c8892a",cursor:"pointer"}} onClick={()=>onOpen(term)}>
      {children||term}
    </span>
  );
}

const WOUNDS = [
  {id:"relational",   label:"Relational",     prompt:"My struggle is primarily about people or relationships.", tags:["Loss","Rejection","Betrayal","Loneliness","Disconnection","Conflict"]},
  {id:"self",         label:"Self-Assessment", prompt:"My struggle is primarily about how I see myself.",        tags:["Failure","Shame","Identity","Confidence","Self-worth","Competence"]},
  {id:"environmental",label:"Environmental",   prompt:"My struggle is primarily about my circumstances.",        tags:["Work","Health","Money","Circumstances","Stress","Uncertainty"]},
  {id:"mixed",        label:"Mixed",           prompt:"Several areas feel equally important.", tags:[]},
];

const RESPONSES = [
  {id:"facing",     label:"Facing",      prompt:"I am trying to deal with it directly."},
  {id:"avoiding",   label:"Avoiding",    prompt:"I avoid thinking about it or engaging with it."},
  {id:"fighting",   label:"Fighting",    prompt:"I feel angry, resistant or in conflict with it."},
  {id:"withdrawing",label:"Withdrawing", prompt:"I pull away from people or opportunities."},
  {id:"conserving", label:"Conserving",  prompt:"I feel I need to rest and protect my energy."},
  {id:"numbing",    label:"Numbing",     prompt:"I distract myself from uncomfortable feelings."},
];

const CAP_ITEMS = [
  {id:"tank",     label:"Capacity to deal with this", opts:["Empty","Low","Moderate","Full"]},
  {id:"hope",     label:"Hope",                       opts:["None","Low","Moderate","Strong"]},
  {id:"meaning",  label:"Meaning",                    opts:["Lost","Weak","Present","Strong"]},
  {id:"certainty",label:"Certainty",                  opts:["Confused","Uncertain","Clear","Confident"]},
  {id:"shame",    label:"Shame",                      opts:["Low","Moderate","High"]},
];

function calculatePosition(wound, response, capacity) {
  const tank=capacity.tank||"Moderate", hope=capacity.hope||"Moderate", shame=capacity.shame||"Low";
  const tL=["Empty","Low"].includes(tank), hL=["None","Low"].includes(hope), sH=shame==="High";
  const tH=["Moderate","Full"].includes(tank), hH=["Moderate","Strong"].includes(hope);

  // ── FLOOR — always reachable regardless of wound ──
  if (tank==="Empty" && hope==="None") return "despair";
  if (tank==="Empty" && hL && sH) return "despair";

  // ── ANGUISH — deep difficulty, always reachable regardless of wound ──
  if (tank==="Empty" && hL) return "anguish";
  if (tL && hL) return "anguish";

  // ── RELATIONAL WOUND — Connection path ──
  // Reachable: Flourishing (via opening), Ambivalence, Disconnection, Grief, Sealed, Anguish, Despair
  if (wound==="relational") {
    if (response==="avoiding" && tL) return "sealed";
    if (response==="avoiding") return "disconnection";
    if (response==="withdrawing") return "disconnection";
    if (response==="facing" || response==="conserving") return "grief";
    if (response==="numbing" && tL) return "sealed";
    if (response==="fighting" && tL) return "sealed";
    if (tH && hH) return "ambivalence";
    return "disconnection";
  }

  // ── SELF WOUND — Growth path ──
  // Reachable: Flourishing (via opening), Stagnation, Decline, Hibernation, Numbing, Anguish, Despair
  if (wound==="self") {
    if (response==="numbing") return "numbing";
    if (response==="conserving") return "hibernation";
    if (response==="avoiding" && tH && hH) return "stagnation";
    if (response==="avoiding") return "decline";
    if (sH) return "decline";
    if (tH && hH) return "stagnation";
    return "decline";
  }

  // ── ENVIRONMENTAL WOUND — Delight path ──
  // Reachable: Flourishing (via opening), Boredom, Misery, Sanctuary, Embattled, Anguish, Despair
  if (wound==="environmental") {
    if (response==="fighting" && tL) return "embattled";
    if (response==="fighting") return "embattled";
    if (response==="withdrawing") return "sanctuary";
    if (response==="conserving") return "sanctuary";
    if (tH && hH) return "boredom";
    return "misery";
  }

  // ── MIXED — can reach stasis positions ──
  if (wound==="mixed") {
    if (tL && hL) return "anguish";
    if (response==="avoiding" && tL) return "sealed";
    if (response==="numbing" && tL) return "numbing";
    if (response==="fighting" && tL) return "embattled";
    if (tH && hH) return "ambivalence";
    return "misery";
  }

  return "misery";
}

function calculateRenewal(stability, duration) {
  // All renewal routes to Awakening
  return "awakening";
}

function calculateFulfilment(sustained) {
  // All fulfilment routes to Flourishing
  return "flourishing";
}

const POSITIONS = {
  // ── FLOURISHING ────────────────────────────────────────────────────────
  flourishing:{
    name:"Flourishing", label:"Flourishing", color:"#6a7a3a",
    meaning:"Connection with others, genuine enjoyment, and a sense of forward motion are all present and working together right now. This is the wellspring — not a permanent state, but the one everything else points toward.",
    why:"When all three of these are operating together they reinforce each other. Connection generates enjoyment. Enjoyment generates energy. Energy deepens connection. The cycle is alive.",
    drivingForce:"What sustains this is genuine engagement across all three dimensions simultaneously. When any one of them goes quiet the others begin to follow.",
    coreNeed:"Tending", coreNeedWhy:"Flourishing needs tending, not managing. The most important thing is not to take it for granted or to push past it toward the next goal.",
    movement:"Be fully here", movementWhy:"The work here is not forward motion — it is presence. Full inhabitation of where you are.",
    practice:"Take ten minutes today to name three things currently present: one genuine connection, one thing that genuinely delights you, and one way you are genuinely moving forward. Not a gratitude exercise — a genuine inventory of what is alive right now.",
    reflection:"What would it mean to be fully present to where you are right now, rather than planning the next thing?",
  },

  // ── AWAKENING ─────────────────────────────────────────────────────────
  awakening:{
    name:"Awakening", label:"Renewal", color:"#4a6a4a",
    meaning:"You are in a genuine recovery. Something has turned and is holding. Awareness and energy are coming back online, and the improvement feels real rather than fragile. You are genuinely on your way.",
    why:"The turn from difficulty has happened and is establishing itself. Each day the new direction holds, the pathways supporting it strengthen.",
    drivingForce:"What keeps this moving forward is continued genuine engagement — small consistent acts that consolidate the recovery rather than testing it prematurely.",
    coreNeed:"Forward momentum", coreNeedWhy:"The recovery is established enough to begin genuine forward motion — not just protecting what has returned but actively building.",
    movement:"Begin to build", movementWhy:"The position is stable enough to take slightly larger steps. The work is no longer only protection — it is genuine construction.",
    practice:"Choose one area where you have been holding back — waiting until you felt ready, or protecting the recovery rather than building on it. Take one genuine step into that area today. Not a full commitment — a genuine beginning.",
    reflection:"What have you been waiting to feel ready for — and are you ready now?",
  },

  // ── TRAUMA → ANGUISH ──────────────────────────────────────────────────
  anguish:{
    name:"Anguish", label:"Deep difficulty", color:"#6b3030", crisis:true,
    meaning:"You are in a place where pain is acute, the usual pathways feel blocked, and each attempt to move has been costing more than it restores. This is not weakness — it is the experience of someone carrying more than the available capacity can sustain.",
    why:"When both capacity and hope are very low, the usual mechanisms for recovery become unavailable. What keeps people here is not failure — it is the genuine absence of the conditions that make movement possible.",
    drivingForce:"The gap between effort and result. When every attempt costs more than it gives back, the system begins to anticipate failure before it happens. This is not pessimism — it is a learned response to a real pattern.",
    coreNeed:"Safety", coreNeedWhy:"Before movement, safety. The question is not what to do next — it is what would make this moment feel even slightly safer.",
    movement:"Safety first", movementWhy:"Slower, more patient — beginning with what feels safe rather than what feels productive.",
    practice:"Identify one small thing that feels genuinely safe right now. A specific room. A specific person. A physical sensation — the weight of your feet, the warmth of a drink. Stay with it for ten minutes without trying to solve anything. You are not failing to move. You are finding the ground.",
    reflection:"What is one thing — however small — that feels safe or familiar right now?",
  },

  // ── DESPAIR ───────────────────────────────────────────────────────────
  despair:{
    name:"Despair", label:"The floor", color:"#2a1f1f", crisis:true,
    meaning:"You are at the most serious position on the map. Both capacity and hope have collapsed. This is real and it is serious. You do not have to carry this alone.",
    why:"The combination of depleted capacity, absent hope, and the weight of what you are carrying has brought you to the floor. This is not where you stay — but it requires care, not effort.",
    drivingForce:"When both capacity and hope collapse simultaneously, the usual mechanisms for recovery become unavailable. This is not weakness — it is the absence of the conditions that make movement possible.",
    coreNeed:"Contact", coreNeedWhy:"The most fundamental need here is not to be alone with this. Before anything else — one person who knows.",
    movement:"Reach out", movementWhy:"The first and only step available from the floor is contact with another person. Not fixing, not explaining — just not being alone with this.",
    practice:"Right now, identify one person you could contact. A message that says 'I'm struggling and I needed to tell someone' is enough. If there is no one immediately available — in Australia, Lifeline is 13 11 14, available any time.",
    reflection:"Who is one person who would want to know you are struggling right now?",
  },

  // ── STASIS ────────────────────────────────────────────────────────────
  ambivalence:{
    name:"Ambivalence", label:"Still", color:"#4a5a6a",
    meaning:"You are holding two equally important directions and unable to move toward either. This is not indecision — both things genuinely matter, which is exactly why movement is difficult.",
    why:"Genuine conflict between two things of real value. Choosing one direction means losing something from the other, and both losses feel unacceptable.",
    drivingForce:"Ambivalence is driven by the equal weight of two competing goods. Unlike stagnation — which avoids movement — ambivalence cannot choose between movements because both directions are genuinely important.",
    coreNeed:"Clarity without pressure", coreNeedWhy:"The need is to name both directions fully before being asked to choose between them. Premature resolution collapses what needs to stay open a little longer.",
    movement:"Name both sides", movementWhy:"Before resolution, clarity. Give each direction its full weight in words before choosing.",
    practice:"Write one full paragraph about each direction you are being pulled toward. Make each one as fully true as you can. Then read them both back as if someone else wrote them. You do not need to decide anything today — the practice is simply to give each direction its full weight before the mind reduces one of them to make the choice easier.",
    reflection:"Which direction would future-you be more at peace with — in five years?",
  },

  boredom:{
    name:"Boredom", displayName:"Adrift", label:"Still", color:"#4a5a6a",
    meaning:"Things are okay — but flat. Not difficult, not joyful. The specific absence of anything that genuinely lights you up. This is the shadow of delight: not the loss of connection or direction, but the particular absence of pleasure, wonder, or gratitude in the day to day.",
    why:"Boredom at this level is not trivial restlessness. It is the signal that the capacity for genuine enjoyment and appreciation has gone quiet. Everything functions, but nothing genuinely sparks.",
    drivingForce:"The absence of genuine pleasure rather than the presence of difficulty. What keeps people here is often habit and routine that is functional but not nourishing — the days are full but not alive.",
    coreNeed:"One moment of genuine delight", coreNeedWhy:"Not manufactured positivity — one small thing that is genuinely, specifically enjoyable. The channel needs to be opened, not forced.",
    movement:"Find one thing that genuinely delights you", movementWhy:"Not something you think should make you happy — something that actually does, however small or unexpected.",
    practice:"Today, look for one moment of genuine delight — not manufactured, not performed. It might be small: the quality of light, a piece of music, a conversation that sparks something, something that makes you genuinely laugh. When you find it, stay with it for a few minutes rather than moving past it.",
    reflection:"What is something — however small or unexpected — that has genuinely delighted you recently?",
  },

  stagnation:{
    name:"Stagnation", displayName:"Stuck", label:"Still", color:"#4a5a6a",
    meaning:"You have enough capacity and hope to move — but movement has stopped. The inertia has become a pattern. Something is in the way.",
    why:"Avoidance with good capacity suggests something is blocking movement — not inability but reluctance. The capacity is present. Something is preventing the translation of it into action.",
    drivingForce:"Often unacknowledged fear — of failure, of change, or of what movement might cost. The inertia is comfortable relative to the uncertainty of moving.",
    coreNeed:"Understanding the resistance", coreNeedWhy:"The resistance is not an obstacle — it is information. Understanding it is the first step.",
    movement:"Identify the resistance", movementWhy:"Before moving, understand what is stopping the movement.",
    practice:"Take ten minutes and write answers to two questions separately. First: 'What would I do next if I were not afraid of anything?' Second: 'What am I actually afraid of?' Do not try to resolve the tension. Just name both honestly.",
    reflection:"What would have to be true for you to take one step forward this week?",
  },

  // ── ADVERSITY ─────────────────────────────────────────────────────────
  disconnection:{
    name:"Disconnection", displayName:"Lost Connection", label:"Adversity", color:"#7a5a30",
    meaning:"You are experiencing a separation from meaningful relationship — and avoiding engagement with it. The distance is extending the pain rather than protecting from it.",
    why:"Relational wound met with avoidance. The instinct is to protect yourself from further hurt. But connection is also the pathway out of disconnection.",
    drivingForce:"Protective avoidance. What keeps people here is that the protection feels necessary even when it is preventing the very thing that would help.",
    coreNeed:"Low-stakes contact", coreNeedWhy:"Not reconciliation, not a difficult conversation — just one moment of genuine presence with one safe person.",
    movement:"One low-stakes connection", movementWhy:"The smallest possible genuine connection. Not to fix anything. Just to not be entirely alone.",
    practice:"Initiate one brief, low-pressure contact with one person today. A message that asks nothing. A brief conversation. No agenda. The goal is simply to let one genuine connection happen.",
    reflection:"Is there one person you have been keeping at a distance who would welcome hearing from you?",
  },

  decline:{
    name:"Decline", displayName:"Self-Doubt", label:"Adversity", color:"#7a5a30",
    meaning:"You are experiencing the sense of moving backwards — losing ground or confidence that was previously present. Combined with shame, this can feel like confirmation of your worst fears about yourself.",
    why:"A self-assessment wound combined with shame creates the experience of decline — not just struggling but diminishing. The difficulty feels like evidence of who you are rather than a description of where you are.",
    drivingForce:"Shame combined with comparison — measuring current performance against a previous self and finding the gap unacceptable. The decline feels like a verdict rather than a position.",
    coreNeed:"Separation of wound from identity", coreNeedWhy:"Decline is a position. It is not a verdict. The need is to distinguish between what is happening and what you are.",
    movement:"Separate the wound from the person", movementWhy:"What you are experiencing is real — but it is not what you are.",
    practice:"Write down one thing you were capable of a year ago that you are still capable of today. Not an achievement — a genuine capacity. Then write: 'The difficulty has not taken this.' Read it back to yourself.",
    reflection:"What is one quality in yourself that this difficulty has not been able to take from you?",
  },

  misery:{
    name:"Misery", displayName:"Disheartened", label:"Adversity", color:"#7a5a30",
    meaning:"You are experiencing sustained joylessness — not an acute sadness but a chronic absence of delight. The lights are down. Things that used to give pleasure no longer do. This is one of the most common and least visible forms of difficulty.",
    why:"Misery is not depression necessarily — it is the sustained loss of the capacity for genuine enjoyment. It often arrives gradually and is therefore normalised before it is named.",
    drivingForce:"The depletion of the enjoyment channel over time. What keeps people here is often the absence of even small genuine pleasures — and the habit of moving through days without noticing what is missing.",
    coreNeed:"One genuine pleasure", coreNeedWhy:"Not joy — just one small thing that is genuinely pleasant. The capacity is not gone — it needs to be reactivated through small genuine acts.",
    movement:"Name one small thing", movementWhy:"Not joy — just something that does not hurt. Something that is genuinely, specifically yours.",
    practice:"Do one small thing today that is genuinely yours — not performed for anyone else, not productive in any external sense. Something you actually want to do. Make something. Read something you actually want to read. Call someone you genuinely like. The size does not matter — the genuineness does.",
    reflection:"What is the smallest thing that used to give you even a flicker of something good?",
  },

  // ── SHELTER ───────────────────────────────────────────────────────────
  sealed:{
    name:"Sealed", label:"Protective withdrawal", color:"#4a3d5c",
    meaning:"You have closed off. Nothing in, nothing out. This is not failure — it is an intelligent response to a situation where everything felt unsafe. Protection is a tent, not a bunker — the goal is to keep one small thread open.",
    why:"Avoidance combined with low capacity has activated the most protective response available. You are conserving what you have.",
    drivingForce:"Conservation. When capacity is depleted and the environment feels threatening, the system closes to prevent further loss. What keeps people here is that opening even slightly feels like risk.",
    coreNeed:"Permission to rest", coreNeedWhy:"The need is not to be told to open up — it is to have the closing acknowledged as valid while keeping the smallest thread available.",
    movement:"The smallest opening", movementWhy:"Not exposure — just a crack. One small thing that is not entirely closed.",
    practice:"Choose one thing — small, low-risk, familiar — that you can do today that is not entirely about protection. Five minutes is enough. Sitting outside without headphones. One page of something you used to enjoy. Letting one piece of music play. The goal is not to feel better — just to let one small thing in.",
    reflection:"What is the smallest opening you could make right now without feeling unsafe?",
  },

  numbing:{
    name:"Numbing", label:"Protective withdrawal", color:"#4a3d5c",
    meaning:"You are managing the signal — turning down the emotional volume to a level you can tolerate. This is a survival strategy, not a character flaw. The question is what is being missed while the volume is down.",
    why:"Distraction with low capacity is the nervous system protecting itself from overwhelm. It is not avoidance of the problem — it is management of the cost.",
    drivingForce:"Cost management. The nervous system calculates that full feeling is currently too expensive and reduces the signal. The cost is that genuine restoration requires some feeling to be present.",
    coreNeed:"Gentle noticing", coreNeedWhy:"Not to feel everything at once — just to create one small gap where something real can be observed without being overwhelming.",
    movement:"Reduce one numbing behaviour", movementWhy:"Not all at once — just one. Create a small gap where something real can be noticed.",
    practice:"Today, replace one numbing activity with something quieter — not more emotionally demanding, just less actively distracting. A walk without earphones instead of watching something. Sitting with tea instead of scrolling. Five minutes looking out a window instead of filling the silence.",
    reflection:"What are you most afraid of feeling if the numbing stopped?",
  },

  embattled:{
    name:"Embattled", label:"Protective withdrawal", color:"#4a3d5c",
    meaning:"You are fighting — holding ground against something that feels threatening. This is active, exhausting, and consuming most of your available energy. The anger is real and the fight may be entirely justified.",
    why:"Resistance combined with low capacity produces the experience of being under attack and needing to defend. Fighting is protection.",
    drivingForce:"Threat perception. Whether or not the threat is external, the nervous system is in a sustained state of defence. What keeps people here is that stopping the fight feels like losing.",
    coreNeed:"Rest without defeat", coreNeedWhy:"The fighter needs to stop — but stopping feels like losing. The need is for a pause that is not surrender.",
    movement:"Rest without surrender", movementWhy:"Not giving up — pausing. The fighter who never rests loses.",
    practice:"Set aside a defined period today — thirty minutes if possible — where you are not fighting anything. Tell yourself explicitly that the fight will still be there when you return. Do something that requires your body without requiring your mind: a walk, physical work, cooking. Rest is tactical, not defeat.",
    reflection:"What would it mean to rest without it being defeat?",
  },

  // ── HEALING ───────────────────────────────────────────────────────────
  grief:{
    name:"Grief", label:"Recovery", color:"#6b5a3a",
    meaning:"You are facing a significant loss and allowing yourself to experience it. This is not weakness — it is the natural and necessary response to something real having been lost. Grief is the work of integration.",
    why:"Relational loss met with the courage to face it directly, with enough capacity to sustain the process. You are in the right place doing the right thing. It simply costs.",
    drivingForce:"The gap between what was and what is. The mind continues to reach for what is no longer there and encounters absence. The process has its own timeline and cannot be shortened by effort.",
    coreNeed:"Witnessing", coreNeedWhy:"Grief needs to be seen. Not solved, not explained away — witnessed. By yourself, and if possible by one other person.",
    movement:"Stay with it", movementWhy:"Grief cannot be rushed or bypassed. The only way through is through.",
    practice:"Identify one memory, one object, or one ritual that honours what was lost. Spend time with it today without trying to resolve anything. The purpose is presence, not progress.",
    reflection:"What do you most want to carry with you from what was lost?",
  },

  sanctuary:{
    name:"Sanctuary", label:"Recovery", color:"#6b5a3a",
    meaning:"You have withdrawn into a protected space. This is deliberate and intelligent — the creation of conditions where recovery is possible. Not hiding. Tending.",
    why:"Withdrawal with sufficient capacity suggests a conscious choice to protect your energy and create space. That choice is sound.",
    drivingForce:"Self-created protection. The driving force is the recognition that the environment outside is currently too costly and that a different environment is needed.",
    coreNeed:"Protected space", coreNeedWhy:"The sanctuary itself is the need. Protecting its quality is more important right now than anything that might happen inside it.",
    movement:"Protect the space", movementWhy:"Maintain the quality of the sanctuary.",
    practice:"Identify one thing currently threatening the quality of your sanctuary — a demand, a relationship, a habit, an obligation — and reduce your exposure to it today. This might mean declining something. Turning off a notification. Setting a boundary around one hour of time.",
    reflection:"What does this space give you that you could not access elsewhere?",
  },

  hibernation:{
    name:"Hibernation", label:"Recovery", color:"#6b5a3a",
    meaning:"You are in deep rest. Drawing all available energy inward for restoration. Like winter — not absence of life but preparation for its return.",
    why:"The decision to conserve energy is intelligent given your circumstances. You are not giving up. You are creating the conditions for what comes next.",
    drivingForce:"Depletion. The system has shifted into recovery mode. What keeps people here is that the restoration process takes time — and the pressure to return to function often arrives before the restoration is complete.",
    coreNeed:"Genuine restoration", coreNeedWhy:"Not distraction, not productivity — something that actually refills rather than just passes time.",
    movement:"Tend the rest", movementWhy:"Rest is not passive. It is active tending of the conditions for recovery.",
    practice:"Choose one thing today that genuinely restores you — distinct from what merely distracts you. Sleep without guilt. Time in nature. The company of one person who requires nothing of you. A meal cooked slowly. Physical warmth. Do it without apologising for it.",
    reflection:"What does genuine restoration feel like for you — distinct from numbing or distraction?",
  },
};

const amber="#c8892a";
const S={
  app:{maxWidth:640,margin:"0 auto",padding:"32px 16px 64px",fontFamily:"'Karla', sans-serif",fontWeight:300,lineHeight:1.7,background:"#faf7f2",minHeight:"100vh"},
  hdr:{textAlign:"center",marginBottom:36},
  eye:{fontSize:11,letterSpacing:"0.25em",textTransform:"uppercase",color:amber,marginBottom:10,display:"block"},
  ttl:{fontFamily:"'Cormorant Garamond', serif",fontSize:"clamp(26px,5vw,38px)",fontWeight:300,color:"#1a1814",lineHeight:1.1,marginBottom:12},
  sub:{fontSize:14,color:"#8a8480",maxWidth:420,margin:"0 auto",lineHeight:1.8},
  pw:{marginBottom:28},pb:{height:2,background:"#ddd8cc",borderRadius:2,overflow:"hidden"},
  pf:{height:"100%",background:amber,borderRadius:2,transition:"width 0.5s ease"},
  pl:{fontSize:11,letterSpacing:"0.1em",color:"#b8b4ae",textAlign:"right",marginTop:6},
  card:{background:"#fff",border:"1px solid #ddd8cc",borderRadius:6,overflow:"hidden",boxShadow:"0 4px 24px rgba(50,40,20,0.08)"},
  ch:{background:"#1a1814",padding:"20px 24px"},
  sn:{fontSize:10,letterSpacing:"0.2em",textTransform:"uppercase",color:"rgba(200,137,42,0.75)",marginBottom:7},
  sq:{fontFamily:"'Cormorant Garamond', serif",fontSize:24,fontWeight:400,color:"white",lineHeight:1.25},
  cb:{padding:"22px 24px 26px"},
  ctx:{fontSize:13,color:"#8a8480",lineHeight:1.75,marginBottom:16,fontStyle:"italic",borderLeft:"2px solid #f5e8cc",paddingLeft:12},
  opt:(s)=>({padding:"12px 16px",background:s?"#fdf6e8":"#faf7f2",border:s?"2px solid #c8892a":"1px solid #ddd8cc",borderRadius:4,cursor:"pointer",textAlign:"left",width:"100%",marginBottom:8,fontFamily:"'Karla', sans-serif",transition:"all 0.15s"}),
  ot:{fontSize:14,fontWeight:400,color:"#1a1814",marginBottom:2},
  os:{fontSize:12,color:"#8a8480",lineHeight:1.5},
  tags:{display:"flex",flexWrap:"wrap",gap:4,marginTop:6},
  tag:{fontSize:10,padding:"2px 8px",background:"#f4f0e8",borderRadius:10,color:"#8a8480"},
  ci:{background:"#faf7f2",border:"1px solid #ddd8cc",borderRadius:4,padding:"12px 14px",marginBottom:10},
  cl:{fontSize:12,fontWeight:500,color:"#1a1814",marginBottom:8,letterSpacing:"0.04em"},
  co:{display:"flex",gap:6,flexWrap:"wrap"},
  cop:(s)=>({padding:"4px 12px",border:s?"1px solid #c8892a":"1px solid #ddd8cc",borderRadius:20,fontSize:12,color:s?"white":"#8a8480",cursor:"pointer",background:s?"#c8892a":"#fff",transition:"all 0.15s"}),
  ab:{display:"flex",justifyContent:"space-between",alignItems:"center",marginTop:18,flexWrap:"wrap",gap:8},
  bp:(d)=>({background:d?"#e8d9c0":"#c8892a",color:"white",border:"none",padding:"10px 22px",fontFamily:"'Karla', sans-serif",fontSize:13,letterSpacing:"0.1em",textTransform:"uppercase",cursor:d?"not-allowed":"pointer",borderRadius:3,opacity:d?0.5:1}),
  bg:{background:"transparent",color:"#8a8480",border:"1px solid #ddd8cc",padding:"9px 16px",fontFamily:"'Karla', sans-serif",fontSize:12,cursor:"pointer",borderRadius:3},
  rh:(c)=>({background:c,padding:"24px 28px",color:"white"}),
  re:{fontSize:10,letterSpacing:"0.2em",textTransform:"uppercase",color:"rgba(255,255,255,0.6)",marginBottom:7},
  rp:{fontFamily:"'Cormorant Garamond', serif",fontSize:34,fontWeight:400,color:"white",marginBottom:5},
  rt:{fontSize:12,color:"rgba(255,255,255,0.55)",letterSpacing:"0.1em",textTransform:"uppercase"},
  rb:{padding:"22px 24px"},
  sl:{fontSize:10,letterSpacing:"0.18em",textTransform:"uppercase",color:amber,marginBottom:8},
  st:{fontSize:14,color:"#4a4640",lineHeight:1.85,marginBottom:20},
  df:{background:"#f4f0e8",border:"1px solid #ccc7bb",borderLeft:"3px solid #4a4640",borderRadius:"0 4px 4px 0",padding:"12px 14px",marginBottom:10},
  dft:{fontSize:11,fontWeight:500,color:"#4a4640",marginBottom:4,letterSpacing:"0.08em",textTransform:"uppercase"},
  dfb:{fontSize:13,color:"#4a4640",lineHeight:1.8},
  nb:{background:"#f4f0e8",border:"1px solid #ccc7bb",borderLeft:"3px solid #1a1814",borderRadius:"0 4px 4px 0",padding:"12px 14px",marginBottom:10},
  nt:{fontFamily:"'Cormorant Garamond', serif",fontSize:18,color:"#1a1814",marginBottom:4},
  nw:{fontSize:13,color:"#4a4640",lineHeight:1.75},
  mv:{background:"#fdf6e8",borderLeft:"3px solid #c8892a",padding:"12px 14px",borderRadius:"0 4px 4px 0",marginBottom:10},
  mt:{fontFamily:"'Cormorant Garamond', serif",fontSize:19,color:"#1a1814",marginBottom:5},
  mw:{fontSize:13,color:"#4a4640",lineHeight:1.75},
  pr:{background:"#f4f0e8",border:"1px solid #ddd8cc",borderRadius:4,padding:"14px 16px",marginBottom:10},
  rl:{border:"1px solid #f5e8cc",background:"#fdf6e8",borderRadius:4,padding:"12px 14px",marginBottom:16},
  rq:{fontFamily:"'Cormorant Garamond', serif",fontSize:17,fontStyle:"italic",color:"#1a1814",lineHeight:1.6},
  cr:{background:"#fff5f5",border:"1px solid #f0b4b4",borderRadius:4,padding:"14px 16px",marginBottom:14,fontSize:13,color:"#8b2020",lineHeight:1.75},
  cb2:(t)=>({fontSize:11,padding:"3px 10px",borderRadius:20,background:t==="low"?"#fdf0f0":t==="high"?"#f0f7f0":"#f4f0e8",border:t==="low"?"1px solid #e8b4b4":t==="high"?"1px solid #a8c8a8":"1px solid #ddd8cc",color:t==="low"?"#8b3333":t==="high"?"#2d5a2d":"#4a4640",marginRight:5,marginBottom:5,display:"inline-block",cursor:"pointer"}),
  disc:{background:"#fff",border:"1px solid #ddd8cc",borderRadius:6,padding:"32px",boxShadow:"0 4px 24px rgba(50,40,20,0.08)"},
  iq:{fontFamily:"'Cormorant Garamond', serif",fontSize:18,fontStyle:"italic",color:"#4a4640",borderLeft:"2px solid #c8892a",paddingLeft:16,margin:"18px 0",lineHeight:1.65},
  discBox:{background:"#faf7f2",border:"1px solid #ddd8cc",borderRadius:4,padding:"20px",marginBottom:20},
  discText:{fontSize:13,color:"#4a4640",lineHeight:1.85},
  checkRow:{display:"flex",alignItems:"flex-start",gap:12,marginTop:16,cursor:"pointer"},
  checkBox:(c)=>({width:18,height:18,border:c?"2px solid #c8892a":"2px solid #8a8480",borderRadius:3,background:c?"#c8892a":"white",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:2,cursor:"pointer"}),
  checkLabel:{fontSize:13,color:"#1a1814",lineHeight:1.6,cursor:"pointer"},
  durNote:(t)=>({background:t==="acute"?"#fff8e8":t==="chronic"?"#fdf0f0":"#f4f0e8",border:t==="acute"?"1px solid #e8d4a0":t==="chronic"?"1px solid #e8b4b4":"1px solid #ddd8cc",borderRadius:4,padding:"12px 16px",marginBottom:16,fontSize:13,color:t==="acute"?"#7a5a20":t==="chronic"?"#7a2020":"#4a4640",lineHeight:1.75}),
  emailBlock:{background:"#faf7f2",border:"1px solid #ddd8cc",borderRadius:4,padding:"20px",marginBottom:16},
  emailTitle:{fontSize:13,fontWeight:500,color:"#1a1814",marginBottom:6},
  emailDesc:{fontSize:12,color:"#8a8480",lineHeight:1.7,marginBottom:12},
  emailInput:{width:"100%",padding:"10px 14px",border:"1px solid #ddd8cc",borderRadius:4,fontFamily:"'Karla', sans-serif",fontSize:14,color:"#1a1814",background:"#fff",outline:"none"},
  emailPrivacy:{fontSize:11,color:"#b8b4ae",lineHeight:1.6,marginTop:8,fontStyle:"italic"},
  successBlock:{background:"#f0f7f0",border:"1px solid #a8c8a8",borderRadius:4,padding:"14px 16px",fontSize:13,color:"#2d5a2d",lineHeight:1.75},
  goOverlay:{position:"fixed",inset:0,background:"rgba(20,18,14,0.6)",zIndex:200,display:"flex",alignItems:"flex-end",justifyContent:"center"},
  goPanel:{background:"#fff",borderRadius:"8px 8px 0 0",padding:"28px 24px 40px",maxWidth:560,width:"100%",maxHeight:"70vh",overflowY:"auto"},
  goTitle:{fontFamily:"'Cormorant Garamond', serif",fontSize:22,fontWeight:400,color:"#1a1814",marginBottom:12},
  goBody:{fontSize:14,color:"#4a4640",lineHeight:1.85},
  goHead:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16},
  goX:{background:"none",border:"none",fontSize:22,color:"#8a8480",cursor:"pointer",padding:"2px 6px"},
};

// Steps:
// -1 disclaimer
//  0 duration
//  1 opening (struggling / renewal / flourishing)
//  2 wound
//  3 response
//  4 capacity
//  5 renewal follow-up
//  6 flourishing follow-up
//  7 result

export default function App() {
  const [step,setStep]           = useState(-1);
  const [agreed,setAgreed]       = useState(false);
  const [duration,setDuration]   = useState(null);
  const [opening,setOpening]     = useState(null);
  const [wound,setWound]         = useState(null);
  const [response,setResponse]   = useState(null);
  const [capacity,setCapacity]   = useState({});
  const [stability,setStability] = useState(null);
  const [renewalDur,setRenewalDur] = useState(null);
  const [sustained,setSustained] = useState(null);
  const [result,setResult]       = useState(null);
  const [glossTerm,setGlossTerm] = useState(null);
  const [email,setEmail]         = useState("");
  const [emailSent,setEmailSent] = useState(false);
  const [ageBand,setAgeBand]     = useState(null); // "18plus" | "under18" | null
  const [survey,setSurvey]       = useState({}); // accuracy, usefulness, feltUnderstood, positionFit, altPosition, mostHelpful, comments
  const [surveySaved,setSurveySaved] = useState(false);
  const [subConsent,setSubConsent]   = useState(false);
  const [subAgeConfirm,setSubAgeConfirm] = useState(false);
  const [subSaved,setSubSaved]   = useState(false);
  const [saveError,setSaveError] = useState("");

  const capComplete = Object.keys(capacity).length >= CAP_ITEMS.length;
  const capBadgeType=(id,val)=>{
    const low=["Empty","None","Lost","Confused","High"].includes(val);
    const high=["Full","Strong","Confident"].includes(val);
    return low?"low":high?"high":"mid";
  };
  const handleCap=(id,val)=>setCapacity(prev=>({...prev,[id]:val}));
  const calcStruggling=()=>{ setResult(calculatePosition(wound,response,capacity)); setStep(7); };
  const calcRenewal=()=>{ setResult(calculateRenewal(stability,renewalDur)); setStep(7); };
  const calcFulfilment=()=>{ setResult(calculateFulfilment(sustained)); setStep(7); };
  const reset=()=>{
    setStep(-1);setAgreed(false);setDuration(null);setOpening(null);
    setWound(null);setResponse(null);setCapacity({});
    setStability(null);setRenewalDur(null);setSustained(null);
    setResult(null);setEmail("");setEmailSent(false);
    setAgeBand(null);setSurvey({});setSurveySaved(false);
    setSubConsent(false);setSubAgeConfirm(false);setSubSaved(false);setSaveError("");
  };
  const openGloss=(term)=>setGlossTerm(term);
  const closeGloss=()=>setGlossTerm(null);
  const G=({term,children})=>(
    <span style={{color:amber,borderBottom:"1px dotted #c8892a",cursor:"pointer"}} onClick={()=>openGloss(term)}>
      {children||term}
    </span>
  );
  const newId=()=>`${Date.now()}-${Math.random().toString(36).slice(2,9)}`;

  const saveSurvey=async()=>{
    setSaveError("");
    if(ageBand!=="18plus"){ setSurveySaved(true); setStep(8); return; } // under-18: no data stored, just proceed
    try{
      const record={
        assessment_id:newId(),
        age_eligible:true,
        wound:wound||null,
        response:response||null,
        capacity_data:capacity||{},
        final_position:result||null,
        accuracy_score:survey.accuracy??null,
        usefulness_score:survey.usefulness??null,
        felt_understood:survey.feltUnderstood??null,
        position_fit:survey.positionFit??null,
        alternative_position:survey.altPosition||null,
        most_helpful_component:survey.mostHelpful||null,
        user_comments:survey.comments||"",
      };
      const { error } = await supabase.from("assessments").insert(record);
      if(error) throw error;
      setSurveySaved(true);
    }catch(e){
      setSaveError("We couldn't save your responses, but you can continue.");
      setSurveySaved(true);
    }
    setStep(8);
  };

  const handleEmailSubmit=async()=>{
    if(!email||!email.includes("@")||!subAgeConfirm||!subConsent) return;
    setSaveError("");
    try{
      const record={
        email,
        age_confirmed:true,
        consent:true,
      };
      const { error } = await supabase.from("subscribers").insert(record);
      if(error) throw error;
      setSubSaved(true);
    }catch(e){
      setSaveError("We couldn't save your email right now — please try again.");
    }
  };

  const Header=()=>(
    <div style={S.hdr}>
      <span style={S.eye}>The Personal Navigational Framework · Philip Daglish</span>
      <h1 style={S.ttl}>Navigation Positioning Tool</h1>
    </div>
  );
  const Prog=({cur,total})=>(
    <div style={S.pw}>
      <div style={S.pb}><div style={{...S.pf,width:`${(cur/total)*100}%`}}></div></div>
      <div style={S.pl}>Step {cur} of {total}</div>
    </div>
  );
  const GlossaryOverlay=()=>glossTerm?(
    <div style={S.goOverlay} onClick={closeGloss}>
      <div style={S.goPanel} onClick={e=>e.stopPropagation()}>
        <div style={S.goHead}>
          <div style={S.goTitle}>{glossTerm}</div>
          <button style={S.goX} onClick={closeGloss}>×</button>
        </div>
        <div style={S.goBody}>{GLOSSARY[glossTerm]||"Definition coming soon."}</div>
      </div>
    </div>
  ):null;

  // ── DISCLAIMER ──
  if(step===-1) return(
    <div style={S.app}><GlossaryOverlay/>
      <Header/>
      <div style={S.disc}>
        <div style={S.iq}>You are not lost. You are somewhere. And from somewhere, there is always a next step.</div>
        <div style={S.discBox}>
          <p style={{...S.discText,fontWeight:500,marginBottom:10,fontSize:14}}>Before you begin — please read this carefully</p>
          <p style={S.discText}>This tool helps locate where you are right now. It is a self-reflection tool only.</p><br/>
          <p style={S.discText}><strong>This tool is not therapy, counselling, or clinical treatment.</strong> It is not a diagnostic instrument and does not constitute medical or psychological advice.</p><br/>
          <p style={S.discText}><strong>If you are in crisis</strong>, please reach out. In Australia: <strong>Lifeline 13 11 14</strong> · <strong>Beyond Blue 1300 22 4636</strong> · <strong>Emergency 000</strong>.</p><br/>
          <p style={S.discText}><strong>Privacy:</strong> This tool does not store or track any data. Your email, if provided, is used only to send an automated guide and is not stored or used for marketing.</p>
          <div style={S.checkRow} onClick={()=>setAgreed(a=>!a)}>
            <div style={S.checkBox(agreed)}>{agreed&&<span style={{color:"white",fontSize:12,fontWeight:700}}>✓</span>}</div>
            <div style={S.checkLabel}>I have read and understood the above. I confirm this tool is not a substitute for professional support.</div>
          </div>
        </div>
        <div style={{...S.discBox,marginTop:-8}}>
          <p style={{...S.discText,fontWeight:500,marginBottom:10,fontSize:13}}>One more thing before we begin</p>
          <div style={S.co}>
            <button style={S.cop(ageBand==="18plus")} onClick={()=>setAgeBand("18plus")}>I am 18 or older</button>
            <button style={S.cop(ageBand==="under18")} onClick={()=>setAgeBand("under18")}>I am under 18</button>
          </div>
          <p style={{...S.discText,fontSize:11,color:"#b8b4ae",marginTop:8,fontStyle:"italic"}}>This only affects whether your feedback can be saved to help improve the tool. You can use the tool either way.</p>
        </div>
        <button style={S.bp(!agreed||!ageBand)} disabled={!agreed||!ageBand} onClick={()=>setStep(0)}>I agree — begin</button>
      </div>
    </div>
  );

  // ── DURATION ──
  if(step===0) return(
    <div style={S.app}><GlossaryOverlay/>
      <Header/>
      <div style={S.card}>
        <div style={S.ch}><div style={S.sn}>Before we begin</div><div style={S.sq}>How long have you been feeling this way?</div></div>
        <div style={S.cb}>
          <div style={S.ctx}>This helps distinguish between how you feel right now and your longer-term experience. Both are valid — but they may point to different positions and different needs.</div>
          {[
            {id:"acute",     label:"Today or this week",       desc:"This feels different from how I usually am. Something has shifted recently."},
            {id:"weeks",     label:"A few weeks",              desc:"This has been building or present for several weeks."},
            {id:"chronic",   label:"Several months or longer", desc:"This has been my experience for a sustained period."},
            {id:"fluctuates",label:"It fluctuates",            desc:"It comes and goes — I am not sure what my baseline is."},
          ].map(d=>(
            <button key={d.id} style={S.opt(duration===d.id)} onClick={()=>setDuration(d.id)}>
              <div style={S.ot}>{d.label}</div>
              <div style={S.os}>{d.desc}</div>
            </button>
          ))}
          <div style={S.ab}>
            <button style={S.bg} onClick={()=>{setDuration(null);setStep(-1);}}>← Back</button>
            <button style={S.bp(!duration)} disabled={!duration} onClick={()=>setStep(1)}>Next →</button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── OPENING ──
  if(step===1) return(
    <div style={S.app}><GlossaryOverlay/>
      <Header/><Prog cur={1} total={3}/>
      <div style={S.card}>
        <div style={S.ch}><div style={S.sn}>Step 1 — Where you are</div><div style={S.sq}>How would you describe where you are right now?</div></div>
        <div style={S.cb}>
          <div style={S.ctx}>Choose the option that most honestly describes your current experience.</div>
          {[
            {id:"struggling",label:"I am struggling",                     desc:"Something is difficult, painful, or depleting right now."},
            {id:"renewal",   label:"I am doing okay but not quite myself", desc:"Things are improving or I am managing — but I still have progress to make or something to recover."},
            {id:"fulfilment",label:"I feel restored and fully myself",     desc:"I feel present, connected, and moving well. Things are genuinely good."},
          ].map(o=>(
            <button key={o.id} style={S.opt(opening===o.id)} onClick={()=>setOpening(o.id)}>
              <div style={S.ot}>{o.label}</div>
              <div style={S.os}>{o.desc}</div>
            </button>
          ))}
          <div style={S.ab}>
            <button style={S.bg} onClick={()=>setStep(0)}>← Back</button>
            <button style={S.bp(!opening)} disabled={!opening} onClick={()=>{
              if(opening==="struggling") setStep(2);
              else if(opening==="renewal") setStep(5);
              else setStep(6);
            }}>Next →</button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── WOUND ──
  if(step===2) return(
    <div style={S.app}><GlossaryOverlay/>
      <Header/><Prog cur={2} total={4}/>
      <div style={S.card}>
        <div style={S.ch}><div style={S.sn}>Step 2 — The Wound</div><div style={S.sq}>What hurts most right now?</div></div>
        <div style={S.cb}>
          <div style={S.ctx}>Choose the area that feels most central to your current difficulty.</div>
          {WOUNDS.map(w=>(
            <button key={w.id} style={S.opt(wound===w.id)} onClick={()=>setWound(w.id)}>
              <div style={S.ot}>{w.label}</div>
              <div style={S.os}>{w.prompt}</div>
              {w.tags.length>0&&<div style={S.tags}>{w.tags.map(t=><span key={t} style={S.tag}>{t}</span>)}</div>}
            </button>
          ))}
          <div style={S.ab}>
            <button style={S.bg} onClick={()=>setStep(1)}>← Back</button>
            <button style={S.bp(!wound)} disabled={!wound} onClick={()=>setStep(3)}>Next →</button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── RESPONSE ──
  if(step===3) return(
    <div style={S.app}><GlossaryOverlay/>
      <Header/><Prog cur={3} total={4}/>
      <div style={S.card}>
        <div style={S.ch}><div style={S.sn}>Step 3 — The Response</div><div style={S.sq}>How are you responding to this difficulty?</div></div>
        <div style={S.cb}>
          <div style={S.ctx}>Choose the response that most closely describes how you are coping right now — not how you think you should be responding.</div>
          {RESPONSES.map(r=>(
            <button key={r.id} style={S.opt(response===r.id)} onClick={()=>setResponse(r.id)}>
              <div style={S.ot}>{r.label}</div>
              <div style={S.os}>{r.prompt}</div>
            </button>
          ))}
          <div style={S.ab}>
            <button style={S.bg} onClick={()=>setStep(2)}>← Back</button>
            <button style={S.bp(!response)} disabled={!response} onClick={()=>setStep(4)}>Next →</button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── CAPACITY ──
  if(step===4) return(
    <div style={S.app}><GlossaryOverlay/>
      <Header/><Prog cur={4} total={4}/>
      <div style={S.card}>
        <div style={S.ch}><div style={S.sn}>Step 4 — Your Capacity</div><div style={S.sq}>Where are you right now?</div></div>
        <div style={S.cb}>
          <div style={S.ctx}>For each dimension, choose the word that most honestly describes where you are today. Tap any label for a definition.</div>
          {CAP_ITEMS.map(c=>(
            <div key={c.id} style={S.ci}>
              <div style={S.cl}><G term={c.label}>{c.label}</G></div>
              <div style={S.co}>{c.opts.map(o=><button key={o} style={S.cop(capacity[c.id]===o)} onClick={()=>handleCap(c.id,o)}>{o}</button>)}</div>
            </div>
          ))}
          <div style={S.ab}>
            <button style={S.bg} onClick={()=>setStep(3)}>← Back</button>
            <button style={S.bp(!capComplete)} disabled={!capComplete} onClick={calcStruggling}>Find my position →</button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── RENEWAL FOLLOW-UP ──
  if(step===5) return(
    <div style={S.app}><GlossaryOverlay/>
      <Header/>
      <div style={S.card}>
        <div style={S.ch}><div style={S.sn}>A little more</div><div style={S.sq}>Tell me about how this improvement feels.</div></div>
        <div style={S.cb}>
          <div style={{marginBottom:18}}>
            <div style={{fontSize:12,fontWeight:500,color:"#1a1814",marginBottom:10}}>How does the improvement feel?</div>
            {[
              {id:"fragile",label:"Fragile",desc:"Real but tender — I worry it could close back down."},
              {id:"stable", label:"Stable", desc:"Established — I am fairly confident it is holding."},
            ].map(o=>(
              <button key={o.id} style={S.opt(stability===o.id)} onClick={()=>setStability(o.id)}>
                <div style={S.ot}>{o.label}</div><div style={S.os}>{o.desc}</div>
              </button>
            ))}
          </div>
          <div>
            <div style={{fontSize:12,fontWeight:500,color:"#1a1814",marginBottom:10}}>How long has this improvement been present?</div>
            {[
              {id:"recent",   label:"Very recently",  desc:"Days — it is just beginning."},
              {id:"weeks",    label:"A few weeks",    desc:"Present long enough to feel real."},
              {id:"sustained",label:"Some time",      desc:"Holding for a while — months or more."},
            ].map(o=>(
              <button key={o.id} style={S.opt(renewalDur===o.id)} onClick={()=>setRenewalDur(o.id)}>
                <div style={S.ot}>{o.label}</div><div style={S.os}>{o.desc}</div>
              </button>
            ))}
          </div>
          <div style={S.ab}>
            <button style={S.bg} onClick={()=>setStep(1)}>← Back</button>
            <button style={S.bp(!stability||!renewalDur)} disabled={!stability||!renewalDur} onClick={calcRenewal}>Find my position →</button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── FLOURISHING FOLLOW-UP ──
  if(step===6) return(
    <div style={S.app}><GlossaryOverlay/>
      <Header/>
      <div style={S.card}>
        <div style={S.ch}><div style={S.sn}>One more question</div><div style={S.sq}>Does this feel sustained — or more like a good period?</div></div>
        <div style={S.cb}>
          <div style={S.ctx}>This distinguishes between flourishing that is present and active, and flourishing that has become a deeply settled condition.</div>
          {[
            {id:"yes",      label:"Deeply settled",  desc:"Consistently present for some time. It feels stable, not just a good patch."},
            {id:"mostly",   label:"Generally good",  desc:"Good with some uncertainty — I feel well but aware it could shift."},
            {id:"uncertain",label:"A good period",   desc:"Genuinely good right now but not yet deeply settled."},
          ].map(o=>(
            <button key={o.id} style={S.opt(sustained===o.id)} onClick={()=>setSustained(o.id)}>
              <div style={S.ot}>{o.label}</div><div style={S.os}>{o.desc}</div>
            </button>
          ))}
          <div style={S.ab}>
            <button style={S.bg} onClick={()=>setStep(1)}>← Back</button>
            <button style={S.bp(!sustained)} disabled={!sustained} onClick={calcFulfilment}>Find my position →</button>
          </div>
        </div>
      </div>
    </div>
  );

  // ── RESULT ──
  if(step===7){
  const p=result?POSITIONS[result]:null;
  if(!p) return <div style={S.app}><p>Something went wrong. <button onClick={reset}>Start again</button></p></div>;

  return(
    <div style={S.app}><GlossaryOverlay/>
      <Header/>
      <div style={S.card}>
        <div style={S.rh(p.color)}>
          <div style={S.re}>Your current position</div>
          <div style={S.rp}><G term={p.displayName||p.name}>{p.displayName||p.name}</G></div>
          <div style={S.rt}>{p.label}</div>
        </div>
        <div style={S.rb}>

          {p.crisis&&<div style={S.cr}><strong>If you are in crisis right now</strong>, please reach out. In Australia: <strong>Lifeline 13 11 14</strong> · <strong>Beyond Blue 1300 22 4636</strong>. You do not have to carry this alone.</div>}

          {duration==="acute"&&<div style={S.durNote("acute")}><strong>This reflects how you feel right now.</strong> If this feels different from your usual experience, consider completing the tool again based on how you have felt over the past few weeks.</div>}
          {duration==="fluctuates"&&<div style={S.durNote("neutral")}><strong>Your experience fluctuates.</strong> This result reflects the pattern you described today. It may be worth completing the tool again at a harder moment to understand your full range.</div>}
          {duration==="chronic"&&<div style={S.durNote("chronic")}><strong>This has been sustained.</strong> A position held for several months typically points to structural conditions that need attention — not just immediate steps.</div>}

          <div style={S.sl}>What this means</div>
          <div style={S.st}>{p.meaning}</div>

          <div style={S.sl}>Why you may be here</div>
          <div style={S.st}>{p.why}</div>

          <div style={S.sl}>What is driving this</div>
          <div style={S.df}>
            <div style={S.dft}><span style={{color:amber,borderBottom:"1px dotted #c8892a",cursor:"pointer"}} onClick={()=>openGloss("Driving force")}>Driving force</span></div>
            <div style={S.dfb}>{p.drivingForce}</div>
          </div>

          {opening==="struggling"&&(
            <>
              <div style={S.sl}>Your capacity right now</div>
              <div style={{marginBottom:20}}>
                {CAP_ITEMS.map(c=><span key={c.id} style={S.cb2(capBadgeType(c.id,capacity[c.id]))} onClick={()=>openGloss(c.label)}>{c.label}: {capacity[c.id]}</span>)}
              </div>
            </>
          )}

          <div style={S.sl}>What you need most right now</div>
          <div style={S.nb}>
            <div style={S.nt}><G term={p.coreNeed}>{p.coreNeed}</G></div>
            <div style={S.nw}>{p.coreNeedWhy}</div>
          </div>

          <div style={S.sl}>Next available movement</div>
          <div style={S.mv}>
            <div style={S.mt}>{p.movement}</div>
            <div style={S.mw}>{p.movementWhy}</div>
          </div>

          <div style={S.pr}>
            <div style={{...S.sl,marginBottom:6}}>Directed practice — 5 to 15 minutes</div>
            <div style={{fontSize:13,color:"#4a4640",lineHeight:1.85}}>{p.practice}</div>
          </div>

          <div style={S.rl}>
            <div style={{...S.sl,marginBottom:6}}>Reflection question</div>
            <div style={S.rq}>{p.reflection}</div>
          </div>

          <div style={S.emailBlock}>
            <div style={S.emailTitle}>Help improve this tool</div>
            <div style={S.emailDesc}>A few quick questions about whether this felt accurate — it takes under a minute and helps shape where the framework goes next.</div>
            <button style={{...S.bp(false),padding:"10px 22px"}} onClick={()=>setStep(7.5)}>Continue →</button>
          </div>

        </div>
        <div style={{padding:"16px 24px 22px",display:"flex",justifyContent:"flex-end",gap:10,borderTop:"1px solid #ddd8cc"}}>
          <button style={S.bg} onClick={()=>setStep(opening==="struggling"?4:opening==="renewal"?5:6)}>← Adjust answers</button>
          <button style={S.bg} onClick={reset}>Start again</button>
        </div>
      </div>
    </div>
  );
  }

  // ── SURVEY ──
  if(step===7.5){
    const SCALE10=[1,2,3,4,5,6,7,8,9,10];
    const p=result?POSITIONS[result]:null;
    const otherPositions=Object.keys(POSITIONS).filter(k=>k!==result);
    const setS=(k,v)=>setSurvey(prev=>({...prev,[k]:v}));
    const surveyComplete = survey.accuracy && survey.usefulness && survey.feltUnderstood && survey.positionFit && survey.mostHelpful;
    return(
      <div style={S.app}><GlossaryOverlay/>
        <Header/>
        <div style={S.card}>
          <div style={S.ch}><div style={S.sn}>Quick feedback</div><div style={S.sq}>How accurate did this feel?</div></div>
          <div style={S.cb}>
            <div style={S.ctx}>Your honest answers help us understand whether the framework is actually describing people's real experience. This takes under a minute.</div>

            <div style={S.ci}>
              <div style={S.cl}>How accurately did this describe your current experience? (1 = not at all, 10 = extremely accurately)</div>
              <div style={S.co}>{SCALE10.map(n=><button key={n} style={S.cop(survey.accuracy===n)} onClick={()=>setS("accuracy",n)}>{n}</button>)}</div>
            </div>

            <div style={S.ci}>
              <div style={S.cl}>How useful was the guidance you were given? (1 = not useful, 10 = extremely useful)</div>
              <div style={S.co}>{SCALE10.map(n=><button key={n} style={S.cop(survey.usefulness===n)} onClick={()=>setS("usefulness",n)}>{n}</button>)}</div>
            </div>

            <div style={S.ci}>
              <div style={S.cl}>Did you feel understood by this tool?</div>
              <div style={S.co}>
                {["Not at all","A little","Mostly","Completely"].map(o=><button key={o} style={S.cop(survey.feltUnderstood===o)} onClick={()=>setS("feltUnderstood",o)}>{o}</button>)}
              </div>
            </div>

            <div style={S.ci}>
              <div style={S.cl}>Did the position — <strong>{p?.displayName||p?.name}</strong> — feel like the right fit?</div>
              <div style={S.co}>
                {["Not at all","Partially","Mostly","Exactly right"].map(o=><button key={o} style={S.cop(survey.positionFit===o)} onClick={()=>setS("positionFit",o)}>{o}</button>)}
              </div>
            </div>

            <div style={S.ci}>
              <div style={S.cl}>If another position would have described you better, which one? (optional)</div>
              <div style={S.co}>
                <button style={S.cop(survey.altPosition==="none")} onClick={()=>setS("altPosition","none")}>None — this was right</button>
                {otherPositions.map(k=>{
                  const op=POSITIONS[k];
                  return <button key={k} style={S.cop(survey.altPosition===k)} onClick={()=>setS("altPosition",k)}>{op.displayName||op.name}</button>;
                })}
              </div>
            </div>

            <div style={S.ci}>
              <div style={S.cl}>Which part was most helpful?</div>
              <div style={S.co}>
                {["Understanding the position","Understanding why I may be here","Suggested next movement","Reflection question","Language used"].map(o=>
                  <button key={o} style={S.cop(survey.mostHelpful===o)} onClick={()=>setS("mostHelpful",o)}>{o}</button>
                )}
              </div>
            </div>

            <div style={{...S.ci,marginBottom:0}}>
              <div style={S.cl}>Was anything inaccurate, missing, or unclear? (optional)</div>
              <textarea
                style={{...S.emailInput,minHeight:80,resize:"vertical",fontFamily:"inherit"}}
                placeholder="Type any thoughts here…"
                value={survey.comments||""}
                onChange={e=>setS("comments",e.target.value)}
              />
            </div>

            {saveError&&<div style={S.durNote("chronic")}>{saveError}</div>}

            <div style={S.ab}>
              <button style={S.bg} onClick={()=>setStep(7)}>← Back</button>
              <button style={S.bp(!surveyComplete)} disabled={!surveyComplete} onClick={saveSurvey}>Submit feedback →</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── EMAIL SIGNUP (after survey, fully optional, separate from assessment data) ──
  if(step===8 && ageBand!=="18plus") return(
    <div style={S.app}><GlossaryOverlay/>
      <Header/>
      <div style={S.card}>
        <div style={S.ch}><div style={S.sn}>Thank you</div><div style={S.sq}>That's everything.</div></div>
        <div style={S.cb}>
          <div style={S.st}>Thanks for using the tool and for your feedback — it helps shape where this goes next.</div>
          <div style={S.ab}><span/><button style={S.bp(false)} onClick={reset}>Start again →</button></div>
        </div>
      </div>
    </div>
  );

  if(step===8) return(
    <div style={S.app}><GlossaryOverlay/>
      <Header/>
      <div style={S.card}>
        <div style={S.ch}><div style={S.sn}>Optional</div><div style={S.sq}>Would you like updates as the Personal Navigational Framework develops?</div></div>
        <div style={S.cb}>
          <div style={S.ctx}>This is completely optional and unrelated to your assessment answers — your email is stored separately and is never linked to anything you answered above.</div>

          {!subSaved?(
            <>
              <div style={{marginBottom:14}}>
                <input style={S.emailInput} type="email" placeholder="your@email.com" value={email} onChange={e=>setEmail(e.target.value)}/>
              </div>
              <div style={S.checkRow} onClick={()=>setSubAgeConfirm(a=>!a)}>
                <div style={S.checkBox(subAgeConfirm)}>{subAgeConfirm&&<span style={{color:"white",fontSize:12,fontWeight:700}}>✓</span>}</div>
                <div style={S.checkLabel}>I confirm I am 18 years of age or older.</div>
              </div>
              <div style={S.checkRow} onClick={()=>setSubConsent(c=>!c)}>
                <div style={S.checkBox(subConsent)}>{subConsent&&<span style={{color:"white",fontSize:12,fontWeight:700}}>✓</span>}</div>
                <div style={S.checkLabel}>I consent to receiving updates.</div>
              </div>
              {saveError&&<div style={{fontSize:12,color:"#8b2020",marginTop:10}}>{saveError}</div>}
              <div style={S.ab}>
                <button style={S.bg} onClick={reset}>Skip — start again</button>
                <button style={S.bp(!email||!email.includes("@")||!subAgeConfirm||!subConsent)}
                  disabled={!email||!email.includes("@")||!subAgeConfirm||!subConsent}
                  onClick={handleEmailSubmit}>Sign up →</button>
              </div>
            </>
          ):(
            <>
              <div style={S.successBlock}>✓ Thanks — you're on the list. We'll only email you with genuine updates.</div>
              <div style={{...S.ab,justifyContent:"flex-end"}}>
                <button style={S.bg} onClick={reset}>Start again</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );

  return null;
}
