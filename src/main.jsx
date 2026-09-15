import React, {useMemo, useState} from "react";
import { createRoot } from "react-dom/client";
import { Home, Utensils, Dumbbell, TrendingUp, Settings, Plus, ChevronRight, Flame, Droplets, Trophy } from "lucide-react";
import "./styles.css";

const initialFood = [
  {id:1,name:"Eggs",qty:"3 eggs",cal:216,protein:19,fat:14,carbs:1},
  {id:2,name:"Chicken breast",qty:"250 g raw",cal:413,protein:77,fat:9,carbs:0},
];

const exercises = [
  {name:"Bench Press", last:"25 kg × 8"},
  {name:"Lat Pulldown", last:"35 kg × 10"},
  {name:"Incline Dumbbell Press", last:"10 kg × 10"},
];

function App(){
  const [tab,setTab] = useState("home");
  const [food,setFood] = useState(initialFood);
  const [weight,setWeight] = useState(49);
  const [calGoal,setCalGoal] = useState(2700);
  const [proteinGoal,setProteinGoal] = useState(130);

  const totals = useMemo(()=>food.reduce((a,f)=>({
    cal:a.cal+f.cal, protein:a.protein+f.protein, fat:a.fat+f.fat, carbs:a.carbs+f.carbs
  }),{cal:0,protein:0,fat:0,carbs:0}),[food]);

  const addFood=()=>setFood([...food,{id:Date.now(),name:"New food",qty:"1 serving",cal:200,protein:10,fat:5,carbs:25}]);

  return <div className="app">
    <header className="topbar">
      <div>
        <div className="eyebrow">PERSONAL FITNESS</div>
        <h1>N-FIT</h1>
      </div>
      <div className="avatar">N</div>
    </header>

    <main>
      {tab==="home" && <HomePage weight={weight} totals={totals} calGoal={calGoal} proteinGoal={proteinGoal} setTab={setTab}/>}
      {tab==="food" && <FoodPage food={food} totals={totals} addFood={addFood}/>}
      {tab==="workout" && <WorkoutPage/>}
      {tab==="progress" && <ProgressPage weight={weight} setWeight={setWeight}/>}
      {tab==="settings" && <SettingsPage calGoal={calGoal} setCalGoal={setCalGoal} proteinGoal={proteinGoal} setProteinGoal={setProteinGoal}/>}
    </main>

    <nav className="nav">
      {[
        ["home",Home,"Home"],["food",Utensils,"Food"],["workout",Dumbbell,"Train"],["progress",TrendingUp,"Progress"],["settings",Settings,"Settings"]
      ].map(([id,Icon,label])=>
        <button className={tab===id?"active":""} onClick={()=>setTab(id)} key={id}>
          <Icon size={20}/><span>{label}</span>
        </button>
      )}
    </nav>
  </div>
}

function HomePage({weight,totals,calGoal,proteinGoal,setTab}){
 const pct=Math.min(100,Math.round(totals.cal/calGoal*100));
 return <section className="page">
   <div className="welcome"><span>Tuesday, 15 September</span><strong>Keep showing up.</strong></div>
   <div className="heroCard">
     <div><span className="label">CURRENT WEIGHT</span><div className="big">{weight.toFixed(1)} <small>kg</small></div></div>
     <div className="goal">GOAL <b>60 kg</b></div>
   </div>
   <div className="sectionTitle"><h2>Today</h2><span>{pct}% calories</span></div>
   <div className="macroGrid">
     <div className="macro"><Flame size={18}/><b>{totals.cal}</b><span>/ {calGoal} kcal</span><div className="bar"><i style={{width:pct+"%"}}/></div><small>Calories</small></div>
     <div className="macro"><Trophy size={18}/><b>{totals.protein}g</b><span>/ {proteinGoal}g</span><div className="bar"><i style={{width:Math.min(100,totals.protein/proteinGoal*100)+"%"}}/></div><small>Protein</small></div>
   </div>
   <div className="card workoutCard">
     <div className="cardHead"><div><span className="label">TODAY'S SESSION</span><h2>Chest + Triceps</h2></div><Dumbbell size={24}/></div>
     <p>5 exercises · 18 sets</p>
     <button className="primary" onClick={()=>setTab("workout")}>START WORKOUT <ChevronRight size={18}/></button>
   </div>
   <div className="quickGrid">
     <button onClick={()=>setTab("food")}><Utensils/><b>Add food</b><span>Log a meal</span></button>
     <button onClick={()=>setTab("progress")}><TrendingUp/><b>Log weight</b><span>Track progress</span></button>
   </div>
   <div className="card hydration"><Droplets/><div><b>Water</b><span>0 / 2.5 L</span></div><button>+ 250 ml</button></div>
 </section>
}

function FoodPage({food,totals,addFood}){
 return <section className="page">
   <div className="pageTitle"><div><span className="label">NUTRITION</span><h2>Food log</h2></div><button className="round" onClick={addFood}><Plus/></button></div>
   <div className="nutritionHero"><div><span>CALORIES</span><strong>{totals.cal}</strong><small>kcal today</small></div><div><span>PROTEIN</span><strong>{totals.protein}g</strong><small>logged today</small></div></div>
   <div className="sectionTitle"><h2>Today's food</h2><span>{food.length} items</span></div>
   <div className="list">{food.map(f=><div className="foodRow" key={f.id}><div className="foodIcon">🍽️</div><div className="grow"><b>{f.name}</b><span>{f.qty}</span></div><div className="foodMacros"><b>{f.cal}</b><span>{f.protein}g P</span></div></div>)}</div>
   <button className="widePrimary" onClick={addFood}><Plus size={18}/> ADD FOOD</button>
 </section>
}

function WorkoutPage(){
 const [sets,setSets]=useState({});
 const log=(name,i)=>setSets({...sets,[name+"-"+i]:true});
 return <section className="page">
   <div className="pageTitle"><div><span className="label">TUESDAY · CHEST + TRICEPS</span><h2>Workout</h2></div><span className="timer">00:00</span></div>
   <div className="tip">Progressive overload · Beat your previous performance when form stays clean.</div>
   {exercises.map((e,idx)=><div className="exercise card" key={e.name}>
     <div className="exerciseHead"><div><h3>{e.name}</h3><span>Last: {e.last}</span></div><ChevronRight/></div>
     <div className="setHead"><span>SET</span><span>KG</span><span>REPS</span><span></span></div>
     {[0,1,2].map(i=><div className="setRow" key={i}><span>{i+1}</span><input inputMode="decimal" placeholder={idx? "—":"20"}/><input inputMode="numeric" placeholder="8"/><button className={sets[e.name+"-"+i]?"done":""} onClick={()=>log(e.name,i)}>✓</button></div>)}
   </div>)}
   <button className="widePrimary">FINISH WORKOUT</button>
 </section>
}

function ProgressPage({weight,setWeight}){
 const [history,setHistory]=useState([49,49.2,49.0,49.4,49.7]);
 const add=()=>{const n=Number(weight); if(n>0)setHistory([...history,n])};
 const min=Math.min(...history)-.5,max=Math.max(...history)+.5;
 return <section className="page">
   <div className="pageTitle"><div><span className="label">PROGRESS</span><h2>Your journey</h2></div></div>
   <div className="statGrid"><div className="stat"><span>CURRENT</span><b>{weight.toFixed(1)} kg</b></div><div className="stat"><span>GOAL</span><b>60 kg</b></div><div className="stat"><span>TO GO</span><b>{Math.max(0,60-weight).toFixed(1)} kg</b></div></div>
   <div className="card chart"><div className="cardHead"><div><span className="label">BODY WEIGHT</span><h3>Last entries</h3></div><TrendingUp/></div><div className="spark">{history.map((v,i)=><div className="point" key={i} style={{left:`${i/(history.length-1)*90+5}%`,bottom:`${(v-min)/(max-min)*75+10}%`}}><b>{v}</b></div>)}</div><div className="chartLine">{history.map((v,i)=><span key={i} style={{left:`${i/(history.length-1)*90+5}%`}}/>)}</div></div>
   <div className="card inputCard"><label>LOG TODAY'S WEIGHT</label><div className="weightInput"><input value={weight} onChange={e=>setWeight(Number(e.target.value))}/><span>kg</span><button onClick={add}>SAVE</button></div></div>
 </section>
}

function SettingsPage({calGoal,setCalGoal,proteinGoal,setProteinGoal}){
 return <section className="page">
   <div className="pageTitle"><div><span className="label">N-FIT</span><h2>Settings</h2></div></div>
   <div className="card settings"><h3>Your targets</h3><label>Daily calories</label><input type="number" value={calGoal} onChange={e=>setCalGoal(Number(e.target.value))}/><label>Daily protein (g)</label><input type="number" value={proteinGoal} onChange={e=>setProteinGoal(Number(e.target.value))}/><div className="settingLine"><span>Storage</span><b>On this device</b></div><div className="settingLine"><span>App version</span><b>V1.0</b></div></div>
 </section>
}

createRoot(document.getElementById("root")).render(<App/>);
