import React, {useMemo, useState} from "react";
import { createRoot } from "react-dom/client";
import { Home, Utensils, Dumbbell, TrendingUp, Settings, Plus, ChevronRight, Flame, Droplets, Trophy, Trash2, ChevronDown } from "lucide-react";
import "./styles.css";

const todayKey = () => new Date().toISOString().slice(0,10);
const STORAGE = "nfit-v2";
const defaultData = {
  weight: 49,
  goalWeight: 60,
  calGoal: 2700,
  proteinGoal: 130,
  waterGoal: 2.5,
  foodByDay: {},
  workoutsByDay: {},
  weightHistory: [{date: todayKey(), weight:49}],
  waterByDay: {}
};

const exerciseLibrary = {
  Chest: ["Bench Press","Incline Dumbbell Press","Cable Fly","Pec Deck","Chest Press Machine","Dumbbell Fly"],
  Back: ["Lat Pulldown","Seated Cable Row","One-Arm Dumbbell Row","Barbell Row","Straight-Arm Pulldown","Back Extension"],
  Shoulders: ["Overhead Press","Dumbbell Shoulder Press","Lateral Raise","Rear Delt Fly","Face Pull","Front Raise"],
  Biceps: ["Barbell Curl","Dumbbell Curl","Hammer Curl","Incline Dumbbell Curl","Cable Curl","Preacher Curl"],
  Triceps: ["Cable Pushdown","Overhead Triceps Extension","Skull Crusher","Rope Pushdown","Dips","Close-Grip Bench Press"],
  Legs: ["Barbell Squat","Leg Press","Romanian Deadlift","Leg Extension","Leg Curl","Walking Lunges","Calf Raise"]
};
const weightOptions = Array.from({length: 41},(_,i)=>(i+1)*2.5);
const repOptions = Array.from({length: 30},(_,i)=>i+1);

const foodDatabase = {
  Eggs: {cal:72,protein:6.3,fat:4.8,carbs:.4},
  "Ghee (1 tbsp)": {cal:126,protein:0,fat:14,carbs:0},
  "Tomato (50 g)": {cal:9,protein:.45,fat:.1,carbs:2},
  "Onion (30 g)": {cal:12,protein:.3,fat:0,carbs:2.8},
  "Green chilli (5 g)": {cal:2,protein:.1,fat:0,carbs:.4},
  "Besan (100 g)": {cal:387,protein:22,fat:6.7,carbs:58},
  "Chicken breast (100 g cooked)": {cal:165,protein:31,fat:3.6,carbs:0},
  Rice: {cal:130,protein:2.7,fat:.3,carbs:28},
  Roti: {cal:120,protein:3.5,fat:3,carbs:18}
};
const recipes = {
  "Egg Bhurji": {
    servings: 1,
    ingredients: [
      {name:"Eggs", qty:"2 eggs", amount:2, unit:"eggs"},
      {name:"Ghee", qty:"2 tbsp", amount:2, unit:"tbsp"},
      {name:"Tomato", qty:"50 g", amount:50, unit:"g"},
      {name:"Onion", qty:"30 g", amount:30, unit:"g"},
      {name:"Green chilli", qty:"5 g", amount:5, unit:"g"},
      {name:"Spices", qty:"salt + masala", amount:0, unit:""}
    ],
    note:"Default recipe. You can change the egg/ghee quantities before adding."
  }
};

function load(){try{return {...defaultData,...JSON.parse(localStorage.getItem(STORAGE)||"{}")}}catch{return defaultData}}
function save(data){localStorage.setItem(STORAGE,JSON.stringify(data))}
function foodItem(name,qty,cal,protein,fat=0,carbs=0,recipe=false,ingredients=[]){return {id:crypto.randomUUID?.()||String(Date.now()+Math.random()),name,qty,cal,protein,fat,carbs,recipe,ingredients}}
function calcRecipe(recipe, eggs=2, gheeTbsp=2){
  const cal = eggs*foodDatabase.Eggs.cal + gheeTbsp*foodDatabase["Ghee (1 tbsp)"].cal + foodDatabase["Tomato (50 g)"].cal + foodDatabase["Onion (30 g)"].cal + foodDatabase["Green chilli (5 g)"].cal;
  const protein = eggs*foodDatabase.Eggs.protein + foodDatabase["Tomato (50 g)"].protein + foodDatabase["Onion (30 g)"].protein + foodDatabase["Green chilli (5 g)"].protein;
  const fat = eggs*foodDatabase.Eggs.fat + gheeTbsp*foodDatabase["Ghee (1 tbsp)"].fat + .1;
  const carbs = eggs*foodDatabase.Eggs.carbs + 2 + 2.8 + .4;
  return {cal:Math.round(cal),protein:Number(protein.toFixed(1)),fat:Number(fat.toFixed(1)),carbs:Number(carbs.toFixed(1))};
}

function App(){
 const [tab,setTab]=useState("home");
 const [data,setData]=useState(load);
 const day=todayKey();
 const update=(patch)=>setData(prev=>{const next={...prev,...patch};save(next);return next});
 const food=data.foodByDay[day]||[];
 const workout=data.workoutsByDay[day]||{};
 const totals=useMemo(()=>food.reduce((a,f)=>({cal:a.cal+f.cal,protein:a.protein+f.protein,fat:a.fat+f.fat,carbs:a.carbs+f.carbs}),{cal:0,protein:0,fat:0,carbs:0}),[food]);
 const addFood=(item)=>update({foodByDay:{...data.foodByDay,[day]:[...food,item]}});
 const removeFood=(id)=>update({foodByDay:{...data.foodByDay,[day]:food.filter(f=>f.id!==id)}});
 const addWeight=(w)=>update({weight:w,weightHistory:[...data.weightHistory,{date:day,weight:w}]});
 const water=data.waterByDay[day]||0;
 const addWater=()=>update({waterByDay:{...data.waterByDay,[day]:Math.min(data.waterGoal,water+.25)}});
 return <div className="app">
  <header className="topbar"><div><div className="eyebrow">PERSONAL FITNESS</div><h1>N-FIT</h1></div><div className="avatar">N</div></header>
  <main>
   {tab==="home"&&<HomePage data={data} totals={totals} water={water} setTab={setTab} addWater={addWater}/>} 
   {tab==="food"&&<FoodPage food={food} totals={totals} addFood={addFood} removeFood={removeFood}/>} 
   {tab==="workout"&&<WorkoutPage workout={workout} updateWorkout={(w)=>update({workoutsByDay:{...data.workoutsByDay,[day]:w}})}/>} 
   {tab==="progress"&&<ProgressPage data={data} addWeight={addWeight}/>} 
   {tab==="settings"&&<SettingsPage data={data} update={update}/>} 
  </main>
  <nav className="nav">{[["home",Home,"Home"],["food",Utensils,"Food"],["workout",Dumbbell,"Train"],["progress",TrendingUp,"Progress"],["settings",Settings,"Settings"]].map(([id,Icon,label])=><button className={tab===id?"active":""} onClick={()=>setTab(id)} key={id}><Icon size={20}/><span>{label}</span></button>)}</nav>
 </div>
}

function HomePage({data,totals,water,setTab,addWater}){const pct=Math.min(100,Math.round(totals.cal/data.calGoal*100));return <section className="page">
 <div className="welcome"><span>{new Date().toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long"})}</span><strong>Keep showing up.</strong></div>
 <div className="heroCard"><div><span className="label">CURRENT WEIGHT</span><div className="big">{Number(data.weight).toFixed(1)} <small>kg</small></div></div><div className="goal">GOAL <b>{data.goalWeight} kg</b></div></div>
 <div className="sectionTitle"><h2>Today</h2><span>{pct}% calories</span></div><div className="macroGrid"><Macro icon={<Flame size={18}/>} value={totals.cal} suffix={`/ ${data.calGoal} kcal`} label="Calories" pct={pct}/><Macro icon={<Trophy size={18}/>} value={`${totals.protein}g`} suffix={`/ ${data.proteinGoal}g`} label="Protein" pct={Math.min(100,totals.protein/data.proteinGoal*100)}/></div>
 <div className="card workoutCard"><div className="cardHead"><div><span className="label">TODAY'S TRAINING</span><h2>Build your session</h2></div><Dumbbell size={24}/></div><p>Choose from your saved exercise library and log each set.</p><button className="primary" onClick={()=>setTab("workout")}>START WORKOUT <ChevronRight size={18}/></button></div>
 <div className="quickGrid"><button onClick={()=>setTab("food")}><Utensils/><b>Add food</b><span>Recipes + foods</span></button><button onClick={()=>setTab("progress")}><TrendingUp/><b>Log weight</b><span>Track progress</span></button></div>
 <div className="card hydration"><Droplets/><div><b>Water</b><span>{water.toFixed(2)} / {data.waterGoal} L</span></div><button onClick={addWater}>+ 250 ml</button></div>
 </section>}
function Macro({icon,value,suffix,label,pct}){return <div className="macro">{icon}<b>{value}</b><span>{suffix}</span><div className="bar"><i style={{width:pct+"%"}}/></div><small>{label}</small></div>}

function FoodPage({food,totals,addFood,removeFood}){
 const [show,setShow]=useState(false); const [recipeOpen,setRecipeOpen]=useState(false); const [eggs,setEggs]=useState(2); const [ghee,setGhee]=useState(2);
 const addSimple=()=>{const n=prompt("Food name"); if(!n)return; const cal=Number(prompt("Calories (kcal)")||0), protein=Number(prompt("Protein (g)")||0); addFood(foodItem(n,"1 serving",cal,protein));};
 const r=calcRecipe(recipes["Egg Bhurji"],eggs,ghee);
 return <section className="page"><div className="pageTitle"><div><span className="label">NUTRITION</span><h2>Food log</h2></div><button className="round" onClick={()=>setShow(!show)}><Plus/></button></div>
 <div className="nutritionHero"><div><span>CALORIES</span><strong>{Math.round(totals.cal)}</strong><small>kcal today</small></div><div><span>PROTEIN</span><strong>{totals.protein.toFixed(1)}g</strong><small>logged today</small></div></div>
 {show&&<div className="addPanel card"><button className="recipeButton" onClick={()=>setRecipeOpen(!recipeOpen)}><span>🍳</span><div><b>Egg Bhurji</b><small>2 eggs + ghee + tomato + onion + chilli</small></div><ChevronDown className={recipeOpen?"rot": ""}/></button>{recipeOpen&&<div className="recipeBox"><div className="adjustGrid"><label>Eggs<select value={eggs} onChange={e=>setEggs(Number(e.target.value))}>{[1,2,3,4,5,6].map(n=><option key={n}>{n}</option>)}</select></label><label>Ghee<select value={ghee} onChange={e=>setGhee(Number(e.target.value))}>{[0,1,2,3,4].map(n=><option key={n}>{n} tbsp</option>)}</select></label></div><div className="ingredientList"><b>It will add automatically:</b><span>{eggs} eggs</span><span>{ghee} tbsp ghee</span><span>50 g tomato</span><span>30 g onion</span><span>5 g green chilli</span><span>salt + spices</span></div><div className="recipeTotal"><b>{r.cal} kcal · {r.protein}g protein</b><button className="primary" onClick={()=>{addFood(foodItem("Egg Bhurji",`${eggs} eggs · ${ghee} tbsp ghee`,r.cal,r.protein,r.fat,r.carbs,true,[`${eggs} eggs`,`${ghee} tbsp ghee`,`50 g tomato`,`30 g onion`,`5 g green chilli`,`salt + spices`]));setShow(false);setRecipeOpen(false)}}>ADD TO TODAY</button></div></div>}<button className="simpleAdd" onClick={addSimple}>+ Add another food manually</button></div>}
 <div className="sectionTitle"><h2>Today's food</h2><span>{food.length} items</span></div><div className="list">{food.length===0?<div className="empty">No food logged yet. Add a recipe above.</div>:food.map(f=><div className="foodRow" key={f.id}><div className="foodIcon">{f.recipe?"🍳":"🍽️"}</div><div className="grow"><b>{f.name}</b><span>{f.qty}</span>{f.recipe&&<small className="ingredients">{f.ingredients.join(" · ")}</small>}</div><div className="foodMacros"><b>{Math.round(f.cal)}</b><span>{f.protein}g P</span></div><button className="iconBtn" onClick={()=>removeFood(f.id)}><Trash2 size={16}/></button></div>)}</div>
 </section>
}

function WorkoutPage({workout,updateWorkout}){
 const [muscle,setMuscle]=useState("Chest"); const [selected,setSelected]=useState(exerciseLibrary.Chest[0]); const [sets,setSets]=useState(workout[selected]||[{kg:10,reps:8,done:false},{kg:10,reps:8,done:false},{kg:10,reps:8,done:false}]);
 const selectExercise=(name)=>{setSelected(name);setSets(workout[name]||[{kg:10,reps:8,done:false},{kg:10,reps:8,done:false},{kg:10,reps:8,done:false}])};
 const saveSets=(next)=>{setSets(next);updateWorkout({...workout,[selected]:next})};
 const addSet=()=>saveSets([...sets,{kg:sets.at(-1)?.kg||10,reps:sets.at(-1)?.reps||8,done:false}]);
 return <section className="page"><div className="pageTitle"><div><span className="label">EXERCISE LIBRARY</span><h2>Train</h2></div></div>
 <div className="muscleTabs">{Object.keys(exerciseLibrary).map(m=><button className={muscle===m?"sel":""} onClick={()=>{setMuscle(m);selectExercise(exerciseLibrary[m][0])}} key={m}>{m}</button>)}</div>
 <div className="exercisePicker">{exerciseLibrary[muscle].map(e=><button className={selected===e?"selected":""} onClick={()=>selectExercise(e)} key={e}>{e}</button>)}</div>
 <div className="card exercise"><div className="exerciseHead"><div><span className="label">{muscle.toUpperCase()}</span><h3>{selected}</h3><span>Log your weight and reps for every set.</span></div><Dumbbell/></div>
 <div className="setHead"><span>SET</span><span>WEIGHT</span><span>REPS</span><span>DONE</span></div>
 {sets.map((s,i)=><div className="setRow" key={i}><span>{i+1}</span><select value={s.kg} onChange={e=>saveSets(sets.map((x,j)=>j===i?{...x,kg:Number(e.target.value)}:x))}>{weightOptions.map(w=><option key={w}>{w}</option>)}</select><select value={s.reps} onChange={e=>saveSets(sets.map((x,j)=>j===i?{...x,reps:Number(e.target.value)}:x))}>{repOptions.map(r=><option key={r}>{r}</option>)}</select><button className={s.done?"done":""} onClick={()=>saveSets(sets.map((x,j)=>j===i?{...x,done:!x.done}:x))}>✓</button></div>)}
 <button className="addSet" onClick={addSet}>+ ADD SET</button></div><button className="widePrimary">FINISH WORKOUT</button>
 </section>
}

function ProgressPage({data,addWeight}){const [weight,setWeight]=useState(data.weight); const history=data.weightHistory||[]; const min=Math.min(...history.map(x=>x.weight),data.weight)-.5,max=Math.max(...history.map(x=>x.weight),data.weight)+.5;return <section className="page"><div className="pageTitle"><div><span className="label">PROGRESS</span><h2>Your journey</h2></div></div><div className="statGrid"><div className="stat"><span>CURRENT</span><b>{Number(data.weight).toFixed(1)} kg</b></div><div className="stat"><span>GOAL</span><b>{data.goalWeight} kg</b></div><div className="stat"><span>TO GO</span><b>{Math.max(0,data.goalWeight-data.weight).toFixed(1)} kg</b></div></div><div className="card chart"><div className="cardHead"><div><span className="label">BODY WEIGHT</span><h3>Saved entries</h3></div><TrendingUp/></div><div className="spark">{history.slice(-14).map((v,i,a)=><div className="point" key={i} style={{left:`${a.length===1?50:i/(a.length-1)*90+5}%`,bottom:`${(v.weight-min)/(max-min)*75+10}%`}}><b>{v.weight}</b></div>)}</div></div><div className="card inputCard"><label>LOG TODAY'S WEIGHT</label><div className="weightInput"><input inputMode="decimal" value={weight} onChange={e=>setWeight(e.target.value)}/><span>kg</span><button onClick={()=>addWeight(Number(weight))}>SAVE</button></div></div></section>}

function SettingsPage({data,update}){return <section className="page"><div className="pageTitle"><div><span className="label">N-FIT</span><h2>Settings</h2></div></div><div className="card settings"><h3>Your targets</h3><label>Daily calories</label><input type="number" value={data.calGoal} onChange={e=>update({calGoal:Number(e.target.value)})}/><label>Daily protein (g)</label><input type="number" value={data.proteinGoal} onChange={e=>update({proteinGoal:Number(e.target.value)})}/><label>Goal weight (kg)</label><input type="number" step="0.1" value={data.goalWeight} onChange={e=>update({goalWeight:Number(e.target.value)})}/><label>Water goal (L)</label><input type="number" step="0.1" value={data.waterGoal} onChange={e=>update({waterGoal:Number(e.target.value)})}/><div className="settingLine"><span>Storage</span><b>Saved on this device</b></div><div className="settingLine"><span>App version</span><b>V2.0</b></div></div></section>}

createRoot(document.getElementById("root")).render(<App/>);
