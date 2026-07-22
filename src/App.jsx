import { useState } from "react";
import { supabase } from "./supabaseClient";

const GLOSSARY = {
  "Flourishing":"The condition where genuine connection with others, enjoyment of the world, and forward motion are all present and working together. Not a permanent state — a living condition that needs tending.",
  "Awakening":"The established return after difficulty. All three channels activating. Not yet Flourishing — still carrying the wound — but turned toward the light for the first time and holding that direction.",
  "Anguish":"The condition of acute pain where pathways feel blocked and capacity is insufficient to sustain recovery. Not weakness — the genuine absence of the conditions that make movement possible. Requires safety before anything else.",
  "Despair":"The floor. Both the Resilience Reserve and Hope have collapsed simultaneously. Requires contact — not effort.",
  "Detached":"The Relational channel is intact but not currently engaged. Capacity for genuine connection is present — but contact is absent. Not wounded. Not withdrawn in the Shelter sense. Simply not in relation.",
  "Adrift":"The Agency channel is capable but not currently producing. Like a field left fallow — capacity present, activation absent. Not damaged. Simply not generating.",
  "Stuck":"The Experiential channel is available but not animating. Wonder is present in principle but not producing movement. Something is blocking — not inability but inertia.",
  "Lost Connection":"The Relational wound. The bond with others has been damaged or lost. The channel that needs Connection as its medicine.",
  "Disheartened":"The Experiential wound. The capacity for genuine receptive engagement with the world has been attacked. The channel that needs Wonder as its medicine.",
  "Self-Doubt":"The Agency wound. The capacity to act, produce outcomes, and move forward has been erased through accumulated damaging self-evaluation. The channel that needs Growth as its medicine.",
  "Closed":"Complete protective closure of the Relational channel. An intelligent Shelter response to sustained threat — the system conserving what remains. A tent, not a permanent structure.",
  "Guarded":"The Shelter response of the Agency channel — redirecting contact with the wound rather than facing it directly. Not consumed by the difficulty, not collapsed, but not through it. The wound is being managed at arm's length.",
  "Embattled":"The Shelter response of the Experiential channel — active defence against an external force consuming most available energy. The fight is real. The cost is the capacity that would otherwise be available for recovery.",
  "Grief":"The Healing response of the Relational channel. The natural and necessary process of integrating genuine loss. Not a disorder — the work itself. It has its own timeline and cannot be shortened by effort.",
  "Honouring":"The Healing response of the Relational channel. The natural and necessary process of integrating genuine loss. Not a disorder — the work itself. It has its own timeline and cannot be shortened by effort.",
  "Sanctuary":"The Healing response of the Experiential channel. A protected space created deliberately — not hiding, but creating the conditions where recovery of the Experiential wound becomes possible.",
  "Hibernation":"The Healing response of the Agency channel. Deep inward rest — all available energy drawn toward restoration of capacity and self-worth. Like winter: preparation for return, not absence of life.",
  "Capacity to deal with this":"The Resilience Reserve available right now — after accounting for everything already committed to navigating all currently active difficulties simultaneously. Available capacity is often significantly less than total capacity.",
  "Hope":"A directional force with two components: direction (knowing which way to move) and magnitude (the energy to act on that direction). Both are required. Direction without magnitude is paralysis. Magnitude without direction is misdirected energy.",
  "Meaning":"The sense that what you are experiencing connects to something that matters. One of the forces that can provide vertical lift directly through the Renewal Zone.",
  "Certainty":"Understanding of what is happening and what to do next. Uncertainty consumes committed capacity — naming certainties, however small, releases it.",
  "Shame":"Guilt misattributed from action to identity. Guilt says 'I did something wrong' — processable, correctable. Shame says 'I am wrong' — identity-level, unbounded, with no corrective action available. The intervention is attribution correction, not self-improvement.",
  "Driving force":"The underlying force or mechanism determining why a person is in their current position and what would need to change for movement to become possible.",
  "Witnessing":"Being genuinely seen without being fixed, advised, or assessed. One of the most restorative acts available — particularly in Honouring and Anguish.",
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
  {id:"self",         label:"Self-Assessment", prompt:"My struggle is primarily about how I see myself or what I am capable of.", tags:["Failure","Shame","Identity","Confidence","Self-worth","Competence"]},
  {id:"environmental",label:"Environmental",   prompt:"My struggle is primarily about my circumstances or the world around me.", tags:["Work","Health","Money","Circumstances","Stress","Uncertainty"]},
  {id:"mixed",        label:"Mixed",           prompt:"Several of these feel equally important right now.", tags:[]},
];

const RESPONSES = [
  {id:"facing",     label:"Facing",      prompt:"I am turning toward it and trying to work through it."},
  {id:"avoiding",   label:"Avoiding",    prompt:"I am steering around it — not engaging with it directly."},
  {id:"fighting",   label:"Fighting",    prompt:"I feel angry, resistant, or in active conflict with it."},
  {id:"withdrawing",label:"Withdrawing", prompt:"I am pulling back from people or situations connected to it."},
  {id:"conserving", label:"Conserving",  prompt:"I am protecting my energy and resting as much as I can."},
  {id:"numbing",    label:"Numbing",     prompt:"I am distracting myself from what I am feeling."},
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
  // Reachable: Flourishing (via opening), Detached, Disconnection, Grief, Sealed, Anguish, Despair
  if (wound==="relational") {
    if (response==="avoiding" && tL) return "sealed";
    if (response==="avoiding") return "disconnection";
    if (response==="withdrawing") return "disconnection";
    if (response==="facing" || response==="conserving") return "grief";
    if (response==="numbing" && tL) return "sealed";
    if (response==="fighting" && tL) return "sealed";
    if (tH && hH) return "detached";
    return "disconnection";
  }

  // ── SELF WOUND — Growth/Agency path ──
  // Reachable: Flourishing (via opening), Dormancy (Adrift), Effacing, Hibernation, Deflection, Anguish, Despair
  if (wound==="self") {
    if (response==="numbing") return "deflection";
    if (response==="conserving") return "hibernation";
    if (response==="avoiding" && tH && hH) return "dormancy";
    if (response==="avoiding") return "effacing";
    if (sH) return "effacing";
    if (tH && hH) return "dormancy";
    return "effacing";
  }

  // ── ENVIRONMENTAL WOUND — Delight/Experiential path ──
  // Reachable: Flourishing (via opening), Stagnation, Misery, Sanctuary, Embattled, Anguish, Despair
  if (wound==="environmental") {
    if (response==="fighting" && tL) return "embattled";
    if (response==="fighting") return "embattled";
    if (response==="withdrawing") return "sanctuary";
    if (response==="conserving") return "sanctuary";
    if (tH && hH) return "stagnation";
    return "misery";
  }

  // ── MIXED — can reach stasis positions ──
  if (wound==="mixed") {
    if (tL && hL) return "anguish";
    if (response==="avoiding" && tL) return "sealed";
    if (response==="numbing" && tL) return "deflection";
    if (response==="fighting" && tL) return "embattled";
    if (tH && hH) return "detached";
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
  // ── FULFILMENT TERRITORY ───────────────────────────────────────────────
  flourishing:{
    name:"Flourishing", label:"Fulfilment Territory", color:"#6a7a3a",
    meaning:"Genuine connection with others, receptive engagement with the world, and forward motion are all present and working together right now. This is the wellspring — not a permanent state, but the condition everything else points toward.",
    why:"When all three channels are operating simultaneously they reinforce each other. Connection generates enjoyment. Enjoyment generates energy. Energy deepens connection. The cycle is self-sustaining while it runs.",
    drivingForce:"All three channel forces — Connection, Wonder, and Growth — are operating above threshold simultaneously. What sustains this is genuine engagement across all three, not performance of any one of them. When one goes quiet, the others begin to follow.",
    coreNeed:"Tending", coreNeedWhy:"Flourishing needs tending, not managing. The risk here is taking it for granted or pushing past it toward the next goal before inhabiting where you are.",
    movement:"Be fully here", movementWhy:"The work here is not forward motion — it is presence. Full inhabitation of where you are rather than planning the next thing from within it.",
    practice:"Take ten minutes today to name three things currently present: one genuine connection, one thing that genuinely engages or delights you, and one way you are genuinely moving forward. Not a gratitude exercise — a genuine inventory of what is alive right now.",
    reflection:"What would it mean to be fully present to where you are right now, rather than reaching past it toward the next thing?",
  },

  // ── RENEWAL ZONE ──────────────────────────────────────────────────────
  awakening:{
    name:"Awakening", label:"Renewal Zone", color:"#4a6a4a",
    meaning:"You are in genuine recovery. Something has turned and is holding. All three channels are beginning to activate. Not yet Flourishing — the wound is still present — but you are turned toward the light for the first time and holding that direction.",
    why:"The crossing from Healing has happened and is establishing itself. Each day the new direction holds, the pathways supporting it strengthen. Hope has both direction and magnitude — you know which way and you have something to bring to it.",
    drivingForce:"The acceleration function of the Renewal Zone — the channels are no longer treating the wound, they are rebuilding momentum. Connection, Wonder, and Growth are beginning to compound rather than compete. What keeps this moving is continued genuine engagement rather than testing it prematurely.",
    coreNeed:"Forward momentum", coreNeedWhy:"The recovery is established enough to begin genuine forward motion — not just protecting what has returned but actively building on it.",
    movement:"Begin to build", movementWhy:"The position is stable enough to take slightly larger steps. The work is no longer only protection — it is genuine construction.",
    practice:"Choose one area where you have been holding back — waiting until you felt ready, or protecting the recovery rather than building on it. Take one genuine step into that area today. Not a full commitment — a genuine beginning. Notice whether it holds.",
    reflection:"What have you been waiting to feel ready for — and are you ready now?",
  },

  // ── TRAUMA ZONE ───────────────────────────────────────────────────────
  anguish:{
    name:"Anguish", label:"Trauma Zone", color:"#6b3030", crisis:true,
    meaning:"You are in a place where pain is acute, the usual pathways feel blocked, and each attempt to move has been costing more than it restores. This is not weakness — it is the experience of someone carrying more than the available capacity can currently sustain.",
    why:"When both the Resilience Reserve and Hope are very low, the usual mechanisms for recovery become unavailable. The gap between effort and result has become the dominant experience — every attempt costs more than it gives back, and the system has begun to anticipate failure before it happens.",
    drivingForce:"Allostatic load exceeding available capacity. The cumulative cost of navigating all active difficulties simultaneously has consumed the reserve faster than it can be restored. This is not a character failing — it is a real resource gap. What keeps people here is the genuine absence of the conditions that make movement possible, not the absence of effort.",
    coreNeed:"Safety", coreNeedWhy:"Before movement, safety. The question is not what to do next — it is what would make this moment feel even slightly safer. Safety is the ground from which everything else becomes possible.",
    movement:"Safety first", movementWhy:"Slower, more patient — beginning with what feels safe rather than what feels productive. One small safe thing is more valuable than ten ambitious steps from this position.",
    practice:"Identify one small thing that feels genuinely safe right now. A specific room. A specific person. A physical sensation — the weight of your feet on the floor, the warmth of a drink, a blanket. Stay with it for ten minutes without trying to solve anything. You are not failing to move. You are finding the ground.",
    reflection:"What is one thing — however small — that feels safe or familiar right now?",
  },

  // ── FLOOR ─────────────────────────────────────────────────────────────
  despair:{
    name:"Despair", label:"The floor", color:"#2a1f1f", crisis:true,
    meaning:"You are at the most serious position on this map. Both the Resilience Reserve and Hope have collapsed. This is real and it is serious. You do not have to carry this alone.",
    why:"The combination of depleted capacity and absent Hope has brought you to the floor. This is not where you stay — but it requires care from outside, not effort from within. External restoration is what the floor requires.",
    drivingForce:"Terminal allostatic failure — available capacity has reached minimum and all restoration channels are blocked. This is not weakness. It is the genuine absence of the conditions that make self-directed movement possible. The first movement must come from outside.",
    coreNeed:"Contact", coreNeedWhy:"The most fundamental need here is not to be alone with this. Before anything else — one person who knows. Contact is the only available first step.",
    movement:"Reach out", movementWhy:"The first and only step available from the floor is contact with another person. Not fixing, not explaining — just not being alone with this.",
    practice:"Right now, identify one person you could contact. A message that says 'I'm struggling and I needed to tell someone' is enough. If there is no one immediately available — in Australia, Lifeline is 13 11 14, available any time.",
    reflection:"Who is one person who would want to know you are struggling right now?",
  },

  // ── STASIS TERRITORY ──────────────────────────────────────────────────
  detached:{
    name:"Detached", label:"Stasis Territory", color:"#4a5a6a",
    meaning:"Your capacity for genuine connection is intact — but you are not currently in contact. Not wounded, not closed in the way the Shelter Territory closes. Simply not engaged. The Relational channel is available but not in use.",
    why:"The Relational channel is present but not active. This is not a wound — the capacity for genuine relationship is there. Habit, circumstance, or low activation has meant it is simply not currently running. The engine is undamaged. It is not running.",
    drivingForce:"Alienation — the progressive process of becoming foreign to the relational world through disuse rather than damage. Unlike Lost Connection, where the channel is wounded, Detachment is the condition of an intact channel that has simply stopped being used. The Relational anti-medicine operating below conscious attention.",
    coreNeed:"One genuine point of contact", coreNeedWhy:"Not reconciliation, not effort — just one genuine moment of connection. The capacity is there. It requires activation, not repair.",
    movement:"Make one genuine contact", movementWhy:"The channel is intact. One real exchange — not performed, not obligatory — is often enough to remind the system what connection produces.",
    practice:"Reach out to one person today in a way that is genuinely meant rather than obligatory. Not to catch up, not to solve anything — just to make contact. A message that says something true. A conversation where you are actually present. Notice whether anything moves.",
    reflection:"Who is one person that, if you reached out to them today, you would actually be glad you did?",
  },

  dormancy:{
    name:"Dormancy", displayName:"Adrift", label:"Stasis Territory", color:"#4a5a6a",
    meaning:"Your Agency channel is capable but not currently producing. Like a field left fallow — the capacity is present, activation is absent. Not damaged, not in crisis. Simply not generating. The days are functional but not alive.",
    why:"The Agency channel has not been closed by a wound — it has simply stopped being used. What keeps people here is habit and routine that is functional but not nourishing. The channel is capable of producing. Nothing is currently planted in it.",
    drivingForce:"Decay — the Agency anti-medicine operating through absence rather than attack. Not an active force working against you, but the slow net-negative of a channel available but unused. Restlessness is the signal that the Agency channel needs to produce — when that signal is missed or suppressed repeatedly, Dormancy deepens.",
    coreNeed:"One small activation", coreNeedWhy:"Not ambition, not a plan — one genuinely small thing that requires the Agency channel to open slightly. The capacity is present. It needs use, not repair.",
    movement:"Find one thing that genuinely interests you", movementWhy:"Not something you think should interest you — something that actually does, however small or unexpected. The channel responds to genuine engagement, not performed effort.",
    practice:"Today, look for one moment of genuine engagement — not productive in any external sense, not performed. It might be very small: a question you actually want answered, a task you find yourself doing with more care than required, something in the natural world that catches your attention. When you find it, stay with it rather than moving past it.",
    reflection:"What is something — however small — that has genuinely caught your attention recently?",
  },

  stagnation:{
    name:"Stagnation", displayName:"Stuck", label:"Stasis Territory", color:"#4a5a6a",
    meaning:"Your Experiential channel is available — but it is not animating. Wonder is present in principle but not producing movement. The capacity for genuine engagement with the world is there. Something is blocking it — not damage, but inertia.",
    why:"The Experiential channel has not been closed by a wound — it has simply stopped being activated. What keeps people here is pattern and routine that has become the entire experiential landscape. Nothing new is arriving. Nothing familiar is surprising any more.",
    drivingForce:"Cynicism — the Experiential anti-medicine. The internal pre-emptive closing against Wonder before it can arrive. Not a conscious choice — a learned response that protects against disappointment by eliminating the possibility of genuine engagement. Self-perpetuating: the more Cynicism closes the channel, the less Wonder arrives, which confirms the channel's closure as justified.",
    coreNeed:"Something genuinely new or surprising", coreNeedWhy:"The Experiential channel responds to Surprise — the interruption of the pre-known pattern. Not entertainment, not distraction — something that genuinely breaks the expected.",
    movement:"Interrupt one pattern deliberately", movementWhy:"Cynicism is broken by genuine Surprise — not by effort but by exposure to something that genuinely did not happen the way it was expected to.",
    practice:"Change one thing today that is usually fixed — a route, a sequence, a response, a conversation. Not a large change. Something small enough to be genuinely done and different enough to produce a genuine, unscripted moment. Notice what happens in that gap between the expected and the actual.",
    reflection:"What is something you have been avoiding because you expect it to disappoint — and what if it did not?",
  },

  // ── ADVERSITY TERRITORY ───────────────────────────────────────────────
  disconnection:{
    name:"Disconnection", displayName:"Lost Connection", label:"Adversity Territory", color:"#7a5a30",
    meaning:"Your Relational channel has been wounded — the bond with others has been damaged or lost. The capacity for genuine connection is not absent, but the wound means that connection currently costs more than it restores. You are in the territory where the medicine and the wound are in the same channel.",
    why:"A Relational wound in the Adversity Territory means you are carrying the difficulty but not yet in the Healing crossing. The wound is present and being assessed. What is available here is building the capacity to turn toward it — not Healing yet, but preparation for the crossing.",
    drivingForce:"Alienation deepening through avoidance — each time connection is avoided the wound is confirmed and the relational outcome space expands. The mechanism is self-reinforcing: the wound makes connection costly, avoidance of cost deepens the wound, which makes connection costlier. What breaks this is one low-stakes genuine contact — not reconciliation, just presence.",
    coreNeed:"Low-stakes contact", coreNeedWhy:"Not reconciliation — just one moment of genuine presence with one safe person. The channel needs to be shown it is still possible, not demonstrated to be fixed.",
    movement:"One low-stakes connection", movementWhy:"The smallest possible genuine connection. Not the difficult one — the safe one. One real moment of contact that costs less than it gives back.",
    practice:"Initiate one brief, low-pressure contact with one person today. A message that asks nothing. A short conversation with someone safe. No agenda, no requirement to explain what you are carrying. The purpose is presence, not progress.",
    reflection:"Is there one person you have been keeping at a distance who would welcome hearing from you — with no requirement attached?",
  },

  misery:{
    name:"Disenchantment", displayName:"Disheartened", label:"Adversity Territory", color:"#7a5a30",
    meaning:"Your Experiential channel has been wounded — the capacity for genuine receptive engagement with the world has been attacked. Not the absence of joy as a passing mood, but the structural dimming of the channel through which joy arrives. The world has become flatter.",
    why:"An Experiential wound in the Adversity Territory means the channel is carrying damage. Wonder — the medicine — is what this wound needs. But in the Adversity Territory the channel is building capacity to turn toward the wound rather than Healing yet. What is available here is small genuine acts of engagement rather than full restoration.",
    drivingForce:"Suffering — the external downward Experiential force — combined with Cynicism closing the channel against the possibility of genuine engagement. The wound has taught the Experiential channel to expect disappointment. Each small closure against potential joy confirms the teaching. The channel is not permanently closed — it has learned to pre-empt rather than receive.",
    coreNeed:"One small genuine thing", coreNeedWhy:"Not joy manufactured, not positivity performed — one small thing that produces a genuine response, however faint. The channel needs evidence that it is still capable of receiving, not evidence that everything is fine.",
    movement:"One small act of genuine engagement", movementWhy:"Not joy — just something real. Something that belongs specifically to you and produces a genuine, unperformed response. Small genuine acts accumulate.",
    practice:"Do one small thing today that is genuinely yours — not productive, not obligatory. Something you actually want to engage with, however briefly. Making something with your hands. Reading something you actually want to read. A piece of music that has meant something to you. Sitting somewhere you genuinely like. Notice whether anything stirs.",
    reflection:"What is the smallest thing that used to give you even a flicker of genuine engagement — and when did you last let it?",
  },

  effacing:{
    name:"Effacement", displayName:"Self-Doubt", label:"Adversity Territory", color:"#7a5a30",
    meaning:"Your Agency channel has been wounded — the capacity to act, produce outcomes, and move forward has been eroded through accumulated damaging self-evaluation. Not passive slowing. Active erasure. Each difficulty has added to a case being built against you by your own mind.",
    why:"An Agency wound in the Adversity Territory means Effacement is the active condition. The wound is present and the channel is building capacity to turn toward it. What is available here is not full recovery but the separation of the wound from identity — which is the first movement that makes Healing possible.",
    drivingForce:"Decay — the Agency anti-medicine — operating through Shame as misattribution of Guilt. Guilt says 'I did something wrong' — processable, correctable, action-level. Shame says 'I am wrong' — identity-level, unbounded, no corrective action available. The intervention is attribution correction: returning the consequence certainty to the action where it belongs, away from identity where it has been misplaced.",
    coreNeed:"Separation of wound from identity", coreNeedWhy:"Effacement is a position. It is not a verdict. The most important thing is to separate what is happening from what you are. The wound is real. The wound is not you.",
    movement:"Separate the wound from the person", movementWhy:"What you are experiencing is a condition — not a conclusion. The difficulty has not taken everything. Naming what remains is the first movement.",
    practice:"Write down one thing you were capable of a year ago that you are still capable of today. Not an achievement — a genuine capacity. A quality. A way of being in the world. Then write: 'The difficulty has not taken this.' Read it back as a statement of fact, not reassurance.",
    reflection:"What is one quality in yourself that this difficulty has not been able to take from you?",
  },

  // ── SHELTER TERRITORY ─────────────────────────────────────────────────
  sealed:{
    name:"Sealed", displayName:"Closed", label:"Shelter Territory", color:"#4a3d5c",
    meaning:"The Relational channel has closed. Nothing in, nothing out. This is an intelligent Shelter response — the system conserving what remains when the relational environment has become too costly to engage with. A tent, not a permanent structure.",
    why:"When the Relational channel is wounded and capacity drops below the Healing threshold, Shelter activates automatically. Closure is not a choice — it is conservation. The system is protecting what remains from further loss.",
    drivingForce:"Alienation at Shelter depth — the Relational channel closing to prevent further depletion rather than because the capacity for connection is gone. What keeps people here is that the cost of opening exceeds the available reserve. The closure is accurate to the available resource, not to the permanent state of the channel.",
    coreNeed:"Permission to rest in the closure", coreNeedWhy:"The need is not to be told to open up — it is to have the closure acknowledged as intelligent while keeping the smallest thread available. One thread, not a door.",
    movement:"The smallest possible opening", movementWhy:"Not exposure — just a crack. One small thing that is not entirely closed. The channel does not need to be forced open. It needs to be shown that one small opening is survivable.",
    practice:"Choose one small thing today that is not entirely about protection — something that allows the smallest possible contact with the world outside the closure. Five minutes outside without headphones. One brief message to one safe person. One page of something you used to enjoy. Small and survivable.",
    reflection:"What is the smallest opening you could make right now — that would not feel unsafe?",
  },

  deflection:{
    name:"Guarded", label:"Shelter Territory", color:"#4a3d5c",
    meaning:"The Agency channel's Shelter response — redirecting contact with the wound rather than facing it directly. Not consumed by the difficulty, not collapsed under it, but not through it either. Each time the wound presents, something turns aside. It is being managed at arm's length.",
    why:"When the Agency channel is wounded and capacity is below the Healing threshold, Guarded is the intelligent Shelter response — keeping the wound at manageable distance rather than being overwhelmed by direct engagement. The wound is real. Facing it at full depth would cost more than is currently available.",
    drivingForce:"Decay operating through protective redirection. The wound is present and the system knows it — but each approach is deflected before contact is made. The position is sustainable but not restorative. Guarded keeps the cost manageable but also keeps the wound in place, unaddressed.",
    coreNeed:"One moment of genuine contact with the wound", coreNeedWhy:"Not full confrontation — just one small, contained moment of genuine acknowledgement. The wound does not need to be solved. It needs to be seen, briefly, without the usual turning aside.",
    movement:"One small step toward rather than away", movementWhy:"Not resolution — just one moment of not deflecting. The wound does not need to be fully faced today. It needs to be approached once, briefly, and survived.",
    practice:"Choose one small aspect of what you are managing — not the whole thing, just one edge of it — and spend five minutes staying with it instead of redirecting. Write about it, or sit with it without doing anything else. You do not need to solve anything. The practice is staying rather than turning aside.",
    reflection:"What is the thing you keep almost thinking about — and then finding something else to do instead?",
  },

  embattled:{
    name:"Embattled", label:"Shelter Territory", color:"#4a3d5c",
    meaning:"The Experiential channel's Shelter response — active defence against an external force that has closed the channel to genuine engagement. Fighting is consuming most of the available energy. The anger is real. The cost is the capacity that would otherwise be available for recovery.",
    why:"When the Experiential channel is wounded and capacity drops below the Healing threshold, Embattled is the Shelter response — the channel mobilising against the external force rather than receiving from it. This is structurally correct when a genuine external threat exists. The cost is that fighting consumes the energy the channel needs to restore.",
    drivingForce:"Suffering — the external Experiential downward force — producing Embattled as the defensive response when no other path is visible. What keeps people here is that stopping the fight genuinely feels like losing — and sometimes it would be.",
    coreNeed:"Rest without defeat", coreNeedWhy:"The fighter needs to stop — but stopping feels like losing. The need is for a defined pause that is not surrender. Rest is tactical here, not capitulation.",
    movement:"Rest without surrender", movementWhy:"Not giving up — pausing. A fighter who never rests loses. The pause is what makes the return possible.",
    practice:"Set aside a defined period today — thirty minutes if possible — where you are not fighting anything. Tell yourself explicitly that the fight will still be there when you return. Do something that requires your body without requiring your mind: a walk, physical work, cooking. Rest is tactical, not defeat.",
    reflection:"What would it mean to rest — without it being defeat?",
  },

  // ── HEALING TERRITORY ─────────────────────────────────────────────────
  grief:{
    name:"Grief", displayName:"Honouring", label:"Healing Territory", color:"#6b5a3a",
    meaning:"You are in the Relational channel's Healing crossing — the natural and necessary process of integrating genuine loss. This is not weakness. It is the work itself. Honouring is what genuine Healing of a Relational wound looks and feels like from the inside.",
    why:"A Relational wound met with the courage to face it directly, with sufficient capacity to sustain the process. You are in the right place doing the right thing. The Honouring process is the treatment — not a sign that something has gone wrong, but the sign that something is being addressed.",
    drivingForce:"The Relational wound being treated by the medicine of Connection — through Witnessing, accompaniment, and the processing of loss into something that can be integrated. The gap between what was and what is. The mind continues to reach for what is no longer there and encounters absence. The process has its own timeline and cannot be shortened by effort — only accompanied.",
    coreNeed:"Witnessing", coreNeedWhy:"Honouring needs to be seen. Not solved, not explained away, not accelerated — witnessed. The presence of one genuine witness is one of the most restorative acts available at this position.",
    movement:"Stay with it", movementWhy:"Honouring cannot be rushed or bypassed. The only way through is through. Acceptance is the internal completion of Honouring — the first orientation outward after it completes is Reaching.",
    practice:"Identify one memory, one object, or one ritual that honours what was lost. Spend time with it today without trying to resolve anything. The purpose is presence, not progress. If one person can be with you in this — invite them.",
    reflection:"What do you most want to carry with you from what was lost?",
  },

  sanctuary:{
    name:"Sanctuary", label:"Healing Territory", color:"#6b5a3a",
    meaning:"You are in the Experiential channel's Healing crossing — a protected space created deliberately where recovery of the capacity for genuine engagement becomes possible. Not hiding. Tending. The conditions for Healing are being created.",
    why:"An Experiential wound requires the Healing crossing of Sanctuary — withdrawal from the sources of cost and the creation of conditions where the channel can begin to restore. The withdrawal is not avoidance; it is the specific medicine this wound requires.",
    drivingForce:"Wonder operating at Healing depth — not the full generative force of Flourishing, but the beginning of genuine receptive engagement returning within a protected environment. The Experiential channel restoring its capacity to receive before it is asked to engage with the world that wounded it.",
    coreNeed:"Protected space", coreNeedWhy:"The sanctuary itself is the need. Protecting its quality is more important right now than anything that happens inside it. The space is the treatment.",
    movement:"Protect the space", movementWhy:"Maintain the quality of the sanctuary. What threatens it is the cost. What maintains it is the reduction of exposure to whatever is draining the Experiential channel.",
    practice:"Identify one thing currently threatening the quality of your sanctuary — a demand, a relationship, a notification, an obligation — and reduce your exposure to it today. This might mean declining something, turning something off, or simply setting aside one hour that belongs to the sanctuary.",
    reflection:"What does this space give you that you could not access elsewhere?",
  },

  hibernation:{
    name:"Hibernation", label:"Healing Territory", color:"#6b5a3a",
    meaning:"You are in the Agency channel's Healing crossing — deep inward rest, drawing all available energy toward the restoration of capacity, self-worth, and forward motion. Like winter: not absence of life, but preparation for its return.",
    why:"An Agency wound requires the Healing crossing of Hibernation — the channel withdrawing from output demands in order to restore the capacity that Effacement has eroded. The rest is not giving up. It is the specific medicine this wound requires.",
    drivingForce:"Growth operating at Healing depth — the Agency channel restoring its capacity through genuine rest before it is asked to produce. The pressure to return to function often arrives before the restoration is complete. What keeps people here longer than necessary is the external and internal pressure to demonstrate recovery through output — which is precisely what the Hibernation crossing cannot yet sustain.",
    coreNeed:"Genuine restoration", coreNeedWhy:"Not distraction, not productivity — something that actually refills the Agency channel. Genuine restoration is distinct from numbing: it produces something at the end. Numbing produces absence.",
    movement:"Tend the rest", movementWhy:"Rest is not passive at this position. It is active tending of the conditions for recovery. What is genuinely restorative — as distinct from what merely passes time — is the question.",
    practice:"Choose one thing today that genuinely restores you — distinct from what merely distracts you. Sleep without guilt. Time in nature. The company of one person who requires nothing of you. A meal cooked slowly. Physical warmth. Do it without apologising for it.",
    reflection:"What does genuine restoration feel like for you — as distinct from numbing or distraction?",
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
