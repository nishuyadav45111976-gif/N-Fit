import React, { useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { Home, Utensils, Dumbbell, TrendingUp, Settings, Plus, ChevronRight, Flame, Droplets, Trophy, Trash2, X, Pencil, Check } from "lucide-react";
import "./styles.css";

/* ---------- dates ---------- */
// Local calendar date, NOT toISOString() (which is UTC and can roll over
// to the "wrong" day in the evening depending on your timezone).
function todayKey(d = new Date()) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
function dateLabel(key) {
  const [y, m, d] = key.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, { weekday: "short", day: "numeric", month: "short" });
}
function daysAgo(key) {
  const [y, m, d] = key.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const diff = Math.round((now - dt) / 86400000);
  if (diff <= 0) return "today";
  if (diff === 1) return "yesterday";
  return `${diff} days ago`;
}

/* ---------- storage keys ---------- */
const STORAGE = "nfit-v4", OLD_STORAGE = "nfit-v3", OLDER_STORAGE = "nfit-v2";

/* ---------- exercise library ---------- */
const slug = (s) => (s || "").toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "ex";

const defaultExerciseNames = {
  Chest: ["Barbell Bench Press", "Incline Barbell Press", "Decline Barbell Press", "Close-Grip Barbell Press", "Dumbbell Bench Press", "Incline Dumbbell Press", "Decline Dumbbell Press", "Dumbbell Flyes", "Incline Dumbbell Flyes", "Cable Crossover", "Low-to-High Cable Fly", "Cable Chest Press", "Chest Press Machine", "Pec Deck Machine", "Push-Ups", "Dips"],
  Back: ["Pull-Ups", "Lat Pulldown", "Chin-Ups", "Straight Arm Pulldown", "Barbell Row", "T-Bar Row", "Seated Cable Row", "Single Arm Dumbbell Row", "Chest Supported Row", "Face Pull", "Reverse Pec Deck", "Rear Delt Fly", "Dumbbell Pullover", "Inverted Row", "Hyperextension", "Superman", "Conventional Deadlift", "Romanian Deadlift", "Rack Pull", "Good Morning"],
  Shoulders: ["Overhead Press", "Dumbbell Shoulder Press", "Lateral Raise", "Rear Delt Fly", "Face Pull", "Front Raise"],
  Biceps: ["Barbell Curl", "Dumbbell Curl", "Hammer Curl", "Preacher Curl", "Incline Dumbbell Curl", "Cable Curl"],
  Triceps: ["Cable Pushdown", "Overhead Triceps Extension", "Skull Crusher", "Rope Overhead Extension", "Dips", "Close-Grip Bench Press"],
  Forearms: ["Wrist Curl", "Reverse Wrist Curl", "Farmer's Walk", "Plate Pinch Hold", "Wrist Roller", "Zottman Curl"],
  Legs: ["Barbell Back Squat", "Leg Press", "Smith Machine Squat", "Hack Squat", "Leg Extension", "Bulgarian Split Squat", "Romanian Deadlift (RDL)", "Lying Leg Curl", "Seated Leg Curl", "Good Morning", "Single Leg Deadlift", "Hip Thrust", "Cable Pull-Through", "Glute Bridge", "Donkey Kick", "Standing Calf Raise", "Seated Calf Raise", "Sumo Deadlift", "Front Squat", "Walking Lunges", "Step-Ups"],
  Core: ["Hanging Knee Raise", "Lying Leg Raise", "Reverse Crunch", "Decline Sit-Up", "Toes to Bar", "Side Plank", "Russian Twists", "Bicycle Crunch", "Cable Woodchopper", "Crunch", "Sit-Up", "V-Up", "Plank", "Dead Bug", "Bird Dog", "Pallof Press", "Mountain Climber", "Medicine Ball Slam", "Hanging Leg Raise", "Captain's Chair"]
};
// Every exercise gets a stable id (derived from muscle+name) so renaming or
// deleting it later never breaks the link to sets you've already logged.
const defaultExercises = Object.fromEntries(
  Object.entries(defaultExerciseNames).map(([muscle, names]) => [
    muscle,
    names.map((name) => ({ id: slug(`${muscle}-${name}`), name }))
  ])
);

const weightOptions = { min: 2.5, max: 200, step: 2.5 };
const repOptions = { min: 1, max: 40, step: 1 };

const ingredientDatabase = [
  { id: "egg", name: "Egg", unit: "piece", cal: 72, protein: 6.3, fat: 4.8, carbs: .4 },
  { id: "ghee", name: "Ghee", unit: "tbsp", cal: 126, protein: 0, fat: 14, carbs: 0 },
  { id: "oil", name: "Cooking oil", unit: "tbsp", cal: 119, protein: 0, fat: 13.5, carbs: 0 },
  { id: "tomato", name: "Tomato", unit: "g", base: 100, cal: 18, protein: .9, fat: .2, carbs: 3.9 },
  { id: "onion", name: "Onion", unit: "g", base: 100, cal: 40, protein: 1.1, fat: .1, carbs: 9.3 },
  { id: "chilli", name: "Green chilli", unit: "g", base: 100, cal: 40, protein: 1.9, fat: .4, carbs: 8.8 },
  { id: "besan", name: "Besan", unit: "g", base: 100, cal: 387, protein: 22, fat: 6.7, carbs: 58 },
  { id: "chicken", name: "Chicken breast (cooked)", unit: "g", base: 100, cal: 165, protein: 31, fat: 3.6, carbs: 0 },
  { id: "rice", name: "Cooked rice", unit: "g", base: 100, cal: 130, protein: 2.7, fat: .3, carbs: 28 },
  { id: "roti", name: "Roti", unit: "piece", cal: 120, protein: 3.5, fat: 3, carbs: 18 },
  { id: "milk", name: "Milk", unit: "ml", base: 100, cal: 61, protein: 3.2, fat: 3.3, carbs: 4.8 },
  { id: "banana", name: "Banana", unit: "piece", cal: 105, protein: 1.3, fat: .4, carbs: 27 },
  { id: "peanut", name: "Peanuts", unit: "g", base: 100, cal: 567, protein: 25.8, fat: 49.2, carbs: 16.1 },
  { id: "curd", name: "Curd", unit: "g", base: 100, cal: 61, protein: 3.5, fat: 3.3, carbs: 4.7 },
  { id: "paneer", name: "Paneer", unit: "g", base: 100, cal: 265, protein: 18.3, fat: 20.8, carbs: 1.2 },
  { id: "potato", name: "Potato", unit: "g", base: 100, cal: 77, protein: 2, fat: .1, carbs: 17.5 },
  { id: "oats", name: "Oats", unit: "g", base: 100, cal: 389, protein: 16.9, fat: 6.9, carbs: 66.3 },
  { id: "dal", name: "Cooked dal", unit: "g", base: 100, cal: 116, protein: 9, fat: .4, carbs: 20 },
  { id: "bread", name: "Bread", unit: "piece", cal: 75, protein: 2.7, fat: 1, carbs: 14 },
  { id: "apple", name: "Apple", unit: "piece", cal: 95, protein: .5, fat: .3, carbs: 25 },
  { id: "peanutbutter", name: "Peanut butter", unit: "tbsp", cal: 94, protein: 4, fat: 8, carbs: 3.2 },
  { id: "sugar", name: "Sugar", unit: "g", base: 100, cal: 387, protein: 0, fat: 0, carbs: 100 }
];
const defaultRecipes = [{ id: "egg-bhurji", name: "Egg Bhurji", ingredients: [{ id: "egg", amount: 2 }, { id: "ghee", amount: 2 }, { id: "tomato", amount: 50 }, { id: "onion", amount: 30 }, { id: "chilli", amount: 5 }] }];

const defaultData = {
  weight: 49, goalWeight: 60, calGoal: 2700, proteinGoal: 130, waterGoal: 2.5,
  foodByDay: {}, workoutsByDay: {}, weightHistory: [{ date: todayKey(), weight: 49 }],
  waterByDay: {}, exerciseLibrary: defaultExercises, recipes: defaultRecipes, finishedWorkouts: {}
};

/* ---------- migrations (safe to run on every load) ---------- */
// Older saves stored exercises as plain name strings. Give them stable ids,
// then fold in any new default exercises/muscle groups (like Forearms and
// Core) that weren't in the library yet — without touching anything the
// user already renamed, added, or deleted themselves.
function migrateLibrary(raw) {
  const out = {};
  for (const [muscle, arr] of Object.entries(raw || {})) {
    out[muscle] = (arr || []).map((item) =>
      typeof item === "string" ? { id: slug(`${muscle}-${item}`), name: item } : item
    );
  }
  for (const [muscle, defaults] of Object.entries(defaultExercises)) {
    if (!out[muscle]) { out[muscle] = defaults.slice(); continue; }
    const existingNames = new Set(out[muscle].map((x) => x.name.toLowerCase()));
    for (const ex of defaults) {
      if (!existingNames.has(ex.name.toLowerCase())) out[muscle].push(ex);
    }
  }
  return out;
}
// Older saves keyed a day's workout by exercise NAME with a plain sets array.
// New saves key by exercise ID and wrap sets in { name, sets } so history
// still reads correctly even after an exercise is renamed or deleted.
function migrateWorkoutsByDay(raw, library) {
  if (!raw) return {};
  const nameToId = {};
  Object.values(library).forEach((list) => list.forEach((ex) => { nameToId[ex.name] = ex.id; }));
  const out = {};
  for (const [day, entry] of Object.entries(raw)) {
    const next = {};
    for (const [key, val] of Object.entries(entry || {})) {
      if (Array.isArray(val)) {
        const id = nameToId[key] || slug(`legacy-${key}`);
        next[id] = { name: key, sets: val };
      } else if (val && typeof val === "object" && Array.isArray(val.sets)) {
        next[key] = val;
      }
    }
    out[day] = next;
  }
  return out;
}
// Keeps at most one weight entry per calendar day (last one wins), so a
// day you logged twice doesn't show as two separate points on the chart.
function dedupeWeightHistory(arr) {
  const sorted = arr.slice().sort((a, b) => a.date.localeCompare(b.date));
  const byDate = new Map();
  sorted.forEach((x) => byDate.set(x.date, x));
  return Array.from(byDate.values());
}
function mergeData(raw) {
  const d = { ...defaultData, ...(raw || {}) };
  d.exerciseLibrary = migrateLibrary(raw?.exerciseLibrary);
  d.workoutsByDay = migrateWorkoutsByDay(raw?.workoutsByDay, d.exerciseLibrary);
  d.recipes = raw?.recipes?.length ? raw.recipes : defaultRecipes;
  d.finishedWorkouts = raw?.finishedWorkouts || {};
  d.weightHistory = dedupeWeightHistory(raw?.weightHistory || defaultData.weightHistory);
  return d;
}
function load() {
  try {
    const raw = localStorage.getItem(STORAGE) || localStorage.getItem(OLD_STORAGE) || localStorage.getItem(OLDER_STORAGE);
    if (!raw) return defaultData;
    const merged = mergeData(JSON.parse(raw));
    save(merged); // persist the migrated shape once so future loads are instant
    return merged;
  } catch {
    return defaultData;
  }
}
function save(d) { try { localStorage.setItem(STORAGE, JSON.stringify(d)); } catch {} }

function uid() { return crypto.randomUUID?.() || String(Date.now() + Math.random()); }
function nutritionForIngredient(item, amount) {
  const factor = item.unit === "piece" || item.unit === "tbsp" ? Number(amount) : Number(amount) / (item.base || 100);
  return { cal: item.cal * factor, protein: item.protein * factor, fat: item.fat * factor, carbs: item.carbs * factor };
}
function calcIngredients(items) {
  return items.reduce((a, x) => {
    const d = ingredientDatabase.find((i) => i.id === x.id);
    if (!d) return a;
    const n = nutritionForIngredient(d, x.amount);
    return { cal: a.cal + n.cal, protein: a.protein + n.protein, fat: a.fat + n.fat, carbs: a.carbs + n.carbs };
  }, { cal: 0, protein: 0, fat: 0, carbs: 0 });
}
function foodItem(name, qty, n, recipe = false, ingredients = []) {
  return { id: uid(), name, qty, cal: n.cal, protein: n.protein, fat: n.fat, carbs: n.carbs, recipe, ingredients };
}
function lastSession(data, exId, today) {
  const days = Object.keys(data.workoutsByDay || {}).filter((d) => d !== today && data.workoutsByDay[d][exId]).sort().reverse();
  for (const day of days) {
    const doneSets = (data.workoutsByDay[day][exId].sets || []).filter((s) => s.done);
    if (doneSets.length) {
      const top = doneSets.reduce((a, b) => (b.kg > a.kg ? b : a), doneSets[0]);
      return { date: day, top, count: doneSets.length };
    }
  }
  return null;
}

/* ---------- app shell ---------- */
function App() {
  const [tab, setTab] = useState("home");
  const [data, setData] = useState(load);
  const day = todayKey();
  const update = (patch) => setData((prev) => { const next = { ...prev, ...patch }; save(next); return next; });

  const food = data.foodByDay[day] || [], workout = data.workoutsByDay[day] || {};
  const totals = useMemo(() => food.reduce((a, f) => ({ cal: a.cal + f.cal, protein: a.protein + f.protein, fat: a.fat + f.fat, carbs: a.carbs + f.carbs }), { cal: 0, protein: 0, fat: 0, carbs: 0 }), [food]);
  const addFood = (item) => update({ foodByDay: { ...data.foodByDay, [day]: [...food, item] } });
  const removeFood = (id) => update({ foodByDay: { ...data.foodByDay, [day]: food.filter((f) => f.id !== id) } });

  const addWeight = (w) => {
    const history = (data.weightHistory || []).filter((x) => x.date !== day);
    update({ weight: w, weightHistory: [...history, { date: day, weight: w }].sort((a, b) => a.date.localeCompare(b.date)) });
  };

  const water = data.waterByDay[day] || 0;
  const addWater = () => update({ waterByDay: { ...data.waterByDay, [day]: Math.min(data.waterGoal, water + .25) } });

  const saveRecipe = (recipe) => {
    const withoutSameName = (data.recipes || []).filter((r) => r.name.toLowerCase() !== recipe.name.toLowerCase());
    update({ recipes: [...withoutSameName, { ...recipe, id: uid() }] });
  };
  const deleteRecipe = (id) => update({ recipes: (data.recipes || []).filter((r) => r.id !== id) });

  const exportData = () => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `nfit-backup-${day}.json`;
    document.body.appendChild(a); a.click(); a.remove();
    URL.revokeObjectURL(url);
  };
  const importData = (file) => {
    const reader = new FileReader();
    reader.onload = () => {
      try {
        const parsed = JSON.parse(String(reader.result));
        if (!confirm("Replace all current N-FIT data with this backup? This can't be undone.")) return;
        const merged = mergeData(parsed);
        save(merged);
        setData(merged);
        alert("Backup restored.");
      } catch {
        alert("That file doesn't look like a valid N-FIT backup.");
      }
    };
    reader.readAsText(file);
  };

  return <div className="app">
    <header className="topbar"><div><div className="eyebrow">PERSONAL FITNESS</div><h1>N-FIT</h1></div><div className="avatar">N</div></header>
    <main>
      {tab === "home" && <HomePage data={data} totals={totals} water={water} setTab={setTab} addWater={addWater} />}
      {tab === "food" && <FoodPage food={food} totals={totals} addFood={addFood} removeFood={removeFood} recipes={data.recipes} saveRecipe={saveRecipe} deleteRecipe={deleteRecipe} />}
      {tab === "workout" && <WorkoutPage data={data} workout={workout} updateData={update} />}
      {tab === "progress" && <ProgressPage data={data} addWeight={addWeight} />}
      {tab === "settings" && <SettingsPage data={data} update={update} exportData={exportData} importData={importData} />}
    </main>
    <nav className="nav">
      {[["home", Home, "Home"], ["food", Utensils, "Food"], ["workout", Dumbbell, "Train"], ["progress", TrendingUp, "Progress"], ["settings", Settings, "Settings"]].map(([id, I, label]) =>
        <button className={tab === id ? "active" : ""} onClick={() => setTab(id)} key={id}><I size={20} /><span>{label}</span></button>)}
    </nav>
  </div>;
}

function HomePage({ data, totals, water, setTab, addWater }) {
  const pct = Math.min(100, Math.round(totals.cal / data.calGoal * 100));
  const finished = data.finishedWorkouts?.[todayKey()];
  return <section className="page">
    <div className="welcome"><span>{new Date().toLocaleDateString(undefined, { weekday: "long", day: "numeric", month: "long" })}</span><strong>Keep showing up.</strong></div>
    <div className="heroCard"><div><span className="label">CURRENT WEIGHT</span><div className="big">{Number(data.weight).toFixed(1)} <small>kg</small></div></div><div className="goal">GOAL <b>{data.goalWeight} kg</b></div></div>
    <div className="sectionTitle"><h2>Today</h2><span>{pct}% calories</span></div>
    <div className="macroGrid">
      <Macro icon={<Flame size={18} />} value={Math.round(totals.cal)} suffix={`/ ${data.calGoal} kcal`} label="Calories" pct={pct} />
      <Macro icon={<Trophy size={18} />} value={`${totals.protein.toFixed(1)}g`} suffix={`/ ${data.proteinGoal}g`} label="Protein" pct={Math.min(100, totals.protein / data.proteinGoal * 100)} />
    </div>
    <div className="card workoutCard">
      <div className="cardHead"><div><span className="label">TODAY'S TRAINING</span><h2>{finished ? "Workout completed ✓" : "Build your session"}</h2></div><Dumbbell size={24} /></div>
      <p>{finished ? `Finished at ${finished.time}. Your workout is saved.` : "Choose from your saved exercise library and log each set."}</p>
      <button className="primary" onClick={() => setTab("workout")}>{finished ? "VIEW WORKOUT" : "START WORKOUT"}<ChevronRight size={18} /></button>
    </div>
    <div className="quickGrid">
      <button onClick={() => setTab("food")}><Utensils /><b>Add food</b><span>Recipes + foods</span></button>
      <button onClick={() => setTab("progress")}><TrendingUp /><b>Log weight</b><span>Track progress</span></button>
    </div>
    <div className="card hydration"><Droplets /><div><b>Water</b><span>{water.toFixed(2)} / {data.waterGoal} L</span></div><button onClick={addWater}>+ 250 ml</button></div>
  </section>;
}
function Macro({ icon, value, suffix, label, pct }) {
  return <div className="macro">{icon}<b>{value}</b><span>{suffix}</span><div className="bar"><i style={{ width: pct + "%" }} /></div><small>{label}</small></div>;
}

/* ---------- food ---------- */
function IngredientEditor({ items, setItems }) {
  const add = () => setItems([...items, { id: "tomato", amount: 50 }]);
  const upd = (i, p) => setItems(items.map((x, j) => (j === i ? { ...x, ...p } : x)));
  return <>
    <div className="builderHead"><b>Ingredients</b><span>No calories/protein to enter</span></div>
    {items.map((x, i) => {
      const d = ingredientDatabase.find((a) => a.id === x.id) || ingredientDatabase[0];
      return <div className="ingredientRow" key={i}>
        <select value={x.id} onChange={(e) => upd(i, { id: e.target.value })}>{ingredientDatabase.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}</select>
        <input inputMode="decimal" value={x.amount} onChange={(e) => upd(i, { amount: e.target.value })} />
        <span>{d.unit}</span>
        <button className="iconBtn" onClick={() => setItems(items.filter((_, j) => j !== i))}><X size={16} /></button>
      </div>;
    })}
    <button className="addIngredient" onClick={add}>+ ADD INGREDIENT</button>
  </>;
}

function FoodPage({ food, totals, addFood, removeFood, recipes, saveRecipe, deleteRecipe }) {
  const [show, setShow] = useState(false);
  const [mode, setMode] = useState("recipe");
  const [name, setName] = useState("");
  const [ingredients, setIngredients] = useState(defaultRecipes[0].ingredients.map((x) => ({ ...x })));
  const [shouldSave, setShouldSave] = useState(true);
  const n = calcIngredients(ingredients);

  const labelIngredients = (items) => items.map((x) => {
    const d = ingredientDatabase.find((i) => i.id === x.id);
    return `${x.amount} ${d.unit} ${d.name}`;
  });

  const addRecipe = () => {
    const clean = ingredients.filter((x) => Number(x.amount) > 0);
    if (!name.trim() || !clean.length) return;
    addFood(foodItem(name.trim(), "1 serving", n, true, labelIngredients(clean)));
    if (shouldSave) saveRecipe({ name: name.trim(), ingredients: clean });
    setShow(false);
    setName("");
  };
  const useRecipe = (recipe) => {
    const nutrition = calcIngredients(recipe.ingredients);
    addFood(foodItem(recipe.name, "1 serving", nutrition, true, labelIngredients(recipe.ingredients)));
  };
  const removeWithConfirm = (f) => { if (confirm(`Remove "${f.name}" from today's log?`)) removeFood(f.id); };

  return <section className="page">
    <div className="pageTitle"><div><span className="label">NUTRITION</span><h2>Food log</h2></div><button className="round" onClick={() => setShow(!show)}><Plus /></button></div>
    <div className="nutritionHero"><div><span>CALORIES</span><strong>{Math.round(totals.cal)}</strong><small>kcal today</small></div><div><span>PROTEIN</span><strong>{totals.protein.toFixed(1)}g</strong><small>logged today</small></div></div>

    {show && <div className="addPanel card">
      <div className="modeTabs"><button className={mode === "recipe" ? "sel" : ""} onClick={() => setMode("recipe")}>Build a recipe</button><button className={mode === "manual" ? "sel" : ""} onClick={() => setMode("manual")}>Quick food</button></div>
      {mode === "recipe" ? <div className="recipeBuilder">
        <label>RECIPE NAME<input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Egg Bhurji" /></label>
        <IngredientEditor items={ingredients} setItems={setIngredients} />
        <div className="autoNutrition"><div><span>CALORIES</span><b>{Math.round(n.cal)} kcal</b></div><div><span>PROTEIN</span><b>{n.protein.toFixed(1)} g</b></div><div><span>FAT</span><b>{n.fat.toFixed(1)} g</b></div><div><span>CARBS</span><b>{n.carbs.toFixed(1)} g</b></div></div>
        <label className="saveToggle"><input type="checkbox" checked={shouldSave} onChange={(e) => setShouldSave(e.target.checked)} /> Save this recipe for reuse</label>
        <button className="primary" onClick={addRecipe}>ADD TO TODAY</button>
        <p className="helper">Example: Egg Bhurji → 2 eggs + 2 tbsp ghee + 50 g tomato + 30 g onion + 5 g chilli. N-FIT calculates everything automatically.</p>
      </div> : <QuickFood addFood={addFood} />}
    </div>}

    {recipes?.length > 0 && <>
      <div className="sectionTitle"><h2>Saved recipes</h2><span>{recipes.length}</span></div>
      <div className="list">
        {recipes.map((r) => {
          const rn = calcIngredients(r.ingredients);
          return <div className="recipeRow" key={r.id || r.name}>
            <button className="recipeUse" onClick={() => useRecipe(r)}>
              <span className="recipeUseIcon">🍳</span>
              <div className="grow"><b>{r.name}</b><span>{Math.round(rn.cal)} kcal · {rn.protein.toFixed(1)}g protein</span></div>
              <Plus size={16} />
            </button>
            {r.id && <button className="iconBtn" onClick={() => { if (confirm(`Delete saved recipe "${r.name}"?`)) deleteRecipe(r.id); }}><Trash2 size={16} /></button>}
          </div>;
        })}
      </div>
    </>}

    <div className="sectionTitle"><h2>Today's food</h2><span>{food.length} items</span></div>
    <div className="list">
      {food.length === 0 ? <div className="empty">No food logged yet. Tap + to build a recipe.</div> :
        food.map((f) => <div className="foodRow" key={f.id}>
          <div className="foodIcon">{f.recipe ? "🍳" : "🍽️"}</div>
          <div className="grow"><b>{f.name}</b><span>{f.qty}</span>{f.recipe && <small className="ingredients">{f.ingredients.join(" · ")}</small>}</div>
          <div className="foodMacros"><b>{Math.round(f.cal)}</b><span>{f.protein.toFixed(1)}g P</span></div>
          <button className="iconBtn" onClick={() => removeWithConfirm(f)}><Trash2 size={16} /></button>
        </div>)}
    </div>
  </section>;
}
function QuickFood({ addFood }) {
  const [name, setName] = useState("");
  const [items, setItems] = useState([{ id: "banana", amount: 1 }]);
  const n = calcIngredients(items);
  const add = () => {
    if (!name.trim()) return;
    addFood(foodItem(name, "1 serving", n, false, items.map((x) => { const d = ingredientDatabase.find((i) => i.id === x.id); return `${x.amount} ${d.unit} ${d.name}`; })));
    setName("");
  };
  return <div className="recipeBuilder">
    <label>FOOD NAME<input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Banana shake" /></label>
    <IngredientEditor items={items} setItems={setItems} />
    <div className="autoNutrition"><div><span>CALORIES</span><b>{Math.round(n.cal)} kcal</b></div><div><span>PROTEIN</span><b>{n.protein.toFixed(1)} g</b></div></div>
    <button className="primary" onClick={add}>ADD TO TODAY</button>
  </div>;
}

/* ---------- workout ---------- */
function Stepper({ value, step, min, max, onChange }) {
  const dec = () => onChange(Math.max(min, +(value - step).toFixed(2)));
  const inc = () => onChange(Math.min(max, +(value + step).toFixed(2)));
  return <div className="stepper">
    <button type="button" onClick={dec}>–</button>
    <span>{value}</span>
    <button type="button" onClick={inc}>+</button>
  </div>;
}

// One clean stick-figure pose per exercise archetype (not a copy of any
// reference chart — drawn from scratch in the app's own line-art style).
// Each pose is [x1,y1,x2,y2,class] segments plus a head circle.
const POSES = {
  bench: { head: [24, 50, 6], lines: [[14, 66, 74, 66, "ill-bench"], [30, 55, 46, 58, "ill-body"], [46, 58, 42, 72, "ill-body"], [42, 72, 52, 80, "ill-body"], [34, 53, 44, 40, "ill-body"], [44, 40, 44, 26, "ill-body"], [30, 24, 58, 24, "ill-bar"]] },
  fly: { head: [24, 50, 6], lines: [[14, 66, 74, 66, "ill-bench"], [30, 55, 46, 58, "ill-body"], [46, 58, 42, 72, "ill-body"], [42, 72, 52, 80, "ill-body"], [34, 53, 16, 42, "ill-body"], [34, 53, 52, 42, "ill-body"], [10, 40, 18, 44, "ill-bar"], [50, 44, 58, 40, "ill-bar"]] },
  pulldown: { head: [42, 30, 6], lines: [[42, 37, 42, 55, "ill-body"], [42, 55, 33, 84, "ill-body"], [42, 55, 51, 84, "ill-body"], [42, 42, 30, 26, "ill-body"], [42, 42, 54, 26, "ill-body"], [24, 24, 60, 24, "ill-bar"]] },
  row: { head: [30, 33, 6], lines: [[34, 39, 54, 58, "ill-body"], [54, 58, 48, 84, "ill-body"], [54, 58, 62, 84, "ill-body"], [44, 50, 34, 58, "ill-body"], [20, 60, 40, 60, "ill-bar"]] },
  reardelt: { head: [42, 30, 6], lines: [[42, 37, 42, 55, "ill-body"], [42, 55, 33, 84, "ill-body"], [42, 55, 51, 84, "ill-body"], [42, 42, 26, 38, "ill-body"], [42, 42, 58, 38, "ill-body"], [14, 38, 26, 38, "ill-bar"], [58, 38, 70, 38, "ill-bar"]] },
  curl: { head: [42, 30, 6], lines: [[42, 37, 42, 55, "ill-body"], [42, 55, 33, 84, "ill-body"], [42, 55, 51, 84, "ill-body"], [42, 42, 30, 50, "ill-body"], [30, 50, 34, 62, "ill-body"], [42, 42, 50, 58, "ill-body"], [30, 62, 38, 62, "ill-bar"]] },
  triceps: { head: [42, 30, 6], lines: [[42, 37, 42, 55, "ill-body"], [42, 55, 33, 84, "ill-body"], [42, 55, 51, 84, "ill-body"], [42, 40, 52, 22, "ill-body"], [52, 22, 44, 16, "ill-body"], [40, 14, 48, 14, "ill-bar"]] },
  shoulderpress: { head: [42, 30, 6], lines: [[42, 37, 42, 55, "ill-body"], [42, 55, 33, 84, "ill-body"], [42, 55, 51, 84, "ill-body"], [42, 40, 30, 20, "ill-body"], [42, 40, 54, 20, "ill-body"], [26, 18, 34, 18, "ill-bar"], [50, 18, 58, 18, "ill-bar"]] },
  lateral: { head: [42, 30, 6], lines: [[42, 37, 42, 55, "ill-body"], [42, 55, 33, 84, "ill-body"], [42, 55, 51, 84, "ill-body"], [42, 40, 20, 36, "ill-body"], [42, 40, 64, 36, "ill-body"], [14, 34, 20, 38, "ill-bar"], [64, 36, 70, 32, "ill-bar"]] },
  squat: { head: [42, 30, 6], lines: [[42, 37, 42, 55, "ill-body"], [42, 55, 34, 68, "ill-body"], [34, 68, 30, 84, "ill-body"], [42, 55, 50, 68, "ill-body"], [50, 68, 54, 84, "ill-body"], [42, 40, 30, 40, "ill-body"], [42, 40, 54, 40, "ill-body"], [22, 38, 62, 38, "ill-bar"]] },
  hinge: { head: [42, 30, 6], lines: [[42, 37, 58, 52, "ill-body"], [58, 52, 50, 84, "ill-body"], [58, 52, 66, 84, "ill-body"], [50, 45, 46, 60, "ill-body"], [30, 60, 54, 60, "ill-bar"]] },
  lunge: { head: [42, 30, 6], lines: [[42, 37, 42, 55, "ill-body"], [42, 55, 34, 70, "ill-body"], [34, 70, 30, 84, "ill-body"], [42, 55, 54, 64, "ill-body"], [54, 64, 60, 84, "ill-body"], [42, 42, 34, 54, "ill-body"], [42, 42, 50, 54, "ill-body"]] },
  calf: { head: [42, 30, 6], lines: [[42, 37, 42, 55, "ill-body"], [42, 55, 33, 84, "ill-body"], [42, 55, 51, 84, "ill-body"], [33, 84, 37, 81, "ill-body"], [51, 84, 47, 81, "ill-body"], [42, 42, 34, 54, "ill-body"], [42, 42, 50, 54, "ill-body"]] },
  glute: { head: [14, 63, 6], lines: [[20, 66, 46, 52, "ill-body"], [46, 52, 58, 66, "ill-body"], [58, 66, 58, 84, "ill-body"]] },
  plank: { head: [76, 46, 6], lines: [[16, 80, 28, 80, "ill-body"], [28, 78, 70, 50, "ill-body"], [70, 50, 80, 80, "ill-body"]] },
  crunch: { head: [24, 59, 5], lines: [[40, 84, 28, 64, "ill-body"], [40, 84, 52, 68, "ill-body"], [52, 68, 66, 80, "ill-body"], [30, 68, 44, 70, "ill-body"]] },
  hanginglegs: { head: [43, 40, 6], lines: [[20, 20, 64, 20, "ill-bar"], [36, 20, 36, 34, "ill-body"], [50, 20, 50, 34, "ill-body"], [43, 46, 43, 56, "ill-body"], [43, 56, 58, 50, "ill-body"], [58, 50, 68, 54, "ill-body"]] },
  rotation: { head: [42, 30, 6], lines: [[42, 37, 42, 55, "ill-body"], [42, 55, 33, 84, "ill-body"], [42, 55, 51, 84, "ill-body"], [42, 42, 60, 34, "ill-body"], [60, 34, 66, 30, "ill-bar"]] },
  forearm: { head: [42, 30, 6], lines: [[42, 37, 42, 55, "ill-body"], [42, 55, 33, 84, "ill-body"], [42, 55, 51, 84, "ill-body"], [42, 42, 30, 60, "ill-body"], [42, 42, 54, 60, "ill-body"], [26, 60, 34, 60, "ill-bar"], [50, 60, 58, 60, "ill-bar"]] },
  backext: { head: [22, 47, 5], lines: [[46, 66, 60, 66, "ill-bench"], [46, 64, 26, 52, "ill-body"], [46, 64, 66, 54, "ill-body"]] }
};
const POSE_RULES = [
  [/wrist|farmer|plate pinch/, "forearm"],
  [/calf/, "calf"],
  [/hanging|toes to bar|captain/, "hanginglegs"],
  [/crunch|sit-up|v-up/, "crunch"],
  [/russian twist|woodchop|medicine ball/, "rotation"],
  [/plank|mountain climber|dead bug|bird dog|pallof|push-up/, "plank"],
  [/glute bridge|donkey kick|hip thrust/, "glute"],
  [/deadlift|rdl|good morning|rack pull|pull-through/, "hinge"],
  [/hyperextension|superman/, "backext"],
  [/lunge|step-up/, "lunge"],
  [/squat|leg press|leg extension|hack/, "squat"],
  [/face pull|rear delt|reverse pec deck/, "reardelt"],
  [/lateral raise|front raise|side bend/, "lateral"],
  [/overhead press|shoulder press/, "shoulderpress"],
  [/pushdown|triceps extension|skull crusher|close-grip bench|dip/, "triceps"],
  [/curl/, "curl"],
  [/pull-up|chin-up|pulldown/, "pulldown"],
  [/row|pullover/, "row"],
  [/fly|crossover|pec deck/, "fly"]
];
const POSE_FALLBACK = { Chest: "bench", Back: "row", Shoulders: "shoulderpress", Biceps: "curl", Triceps: "triceps", Forearms: "forearm", Legs: "squat", Core: "crunch" };

function ExerciseIllustration({ name, muscle }) {
  const n = name.toLowerCase();
  const matched = POSE_RULES.find(([re]) => re.test(n));
  const key = (matched && matched[1]) || POSE_FALLBACK[muscle] || "squat";
  const pose = POSES[key] || POSES.squat;
  return <div className="exerciseMini">
    <div className="miniLabel">HOW TO <span>• {name}</span></div>
    <svg viewBox="0 0 100 92" role="img" aria-label={`${name} form illustration`}>
      <line x1="6" y1="84" x2="94" y2="84" className="ill-floor" />
      {pose.lines.map((l, i) => <line key={i} x1={l[0]} y1={l[1]} x2={l[2]} y2={l[3]} className={l[4]} />)}
      <circle cx={pose.head[0]} cy={pose.head[1]} r={pose.head[2]} className="ill-head" />
    </svg>
  </div>;
}

function WorkoutPage({ data, workout, updateData }) {
  const library = data.exerciseLibrary || defaultExercises;
  const today = todayKey();
  const defaultSets = () => [{ kg: 10, reps: 8, done: false }, { kg: 10, reps: 8, done: false }, { kg: 10, reps: 8, done: false }];

  const [finished, setFinished] = useState(Boolean(data.finishedWorkouts?.[today]));
  const [muscle, setMuscle] = useState(Object.keys(library)[0] || "Chest");
  const [selected, setSelected] = useState(library[Object.keys(library)[0]]?.[0] || null);
  const [sets, setSets] = useState((selected && workout[selected.id]?.sets) || defaultSets());
  const [manage, setManage] = useState(false);
  const [newExercise, setNewExercise] = useState("");

  const selectExercise = (ex) => { setSelected(ex); setSets(workout[ex.id]?.sets || defaultSets()); };
  const saveSets = (next) => {
    setSets(next);
    if (!selected) return;
    updateData({ workoutsByDay: { ...data.workoutsByDay, [today]: { ...workout, [selected.id]: { name: selected.name, sets: next } } } });
  };
  const addSet = () => saveSets([...sets, { kg: sets.at(-1)?.kg || 10, reps: sets.at(-1)?.reps || 8, done: false }]);

  const addExercise = () => {
    const n = newExercise.trim();
    if (!n) return;
    const ex = { id: slug(`${muscle}-${n}-${Date.now().toString(36)}`), name: n };
    updateData({ exerciseLibrary: { ...library, [muscle]: [...(library[muscle] || []), ex] } });
    setNewExercise("");
    setSelected(ex);
    setSets(defaultSets());
  };
  const rename = (ex) => {
    const n = prompt("New exercise name", ex.name)?.trim();
    if (!n || n === ex.name) return;
    const next = { ...library, [muscle]: (library[muscle] || []).map((x) => (x.id === ex.id ? { ...x, name: n } : x)) };
    const wd = { ...(data.workoutsByDay[today] || {}) };
    if (wd[ex.id]) wd[ex.id] = { ...wd[ex.id], name: n };
    updateData({ exerciseLibrary: next, workoutsByDay: { ...data.workoutsByDay, [today]: wd } });
    if (selected?.id === ex.id) setSelected({ ...ex, name: n });
  };
  const del = (ex) => {
    if ((library[muscle] || []).length <= 1) return;
    if (!confirm(`Delete ${ex.name} from ${muscle}? Sets you've already logged for it stay in your history.`)) return;
    const next = { ...library, [muscle]: (library[muscle] || []).filter((x) => x.id !== ex.id) };
    updateData({ exerciseLibrary: next });
    if (selected?.id === ex.id) selectExercise(next[muscle][0]);
  };
  const finish = () => {
    const currentWorkout = selected ? { ...workout, [selected.id]: { name: selected.name, sets } } : workout;
    const doneExercises = Object.values(currentWorkout).filter((v) => v.sets?.some((s) => s.done)).length;
    updateData({
      workoutsByDay: { ...data.workoutsByDay, [today]: currentWorkout },
      finishedWorkouts: { ...(data.finishedWorkouts || {}), [today]: {
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        exercises: doneExercises,
        totalSets: Object.values(currentWorkout).reduce((a, v) => a + (v.sets?.filter((s) => s.done).length || 0), 0)
      } }
    });
    setFinished(true);
  };

  const last = selected ? lastSession(data, selected.id, today) : null;

  return <section className="page">
    <div className="pageTitle"><div><span className="label">EXERCISE LIBRARY</span><h2>Train</h2></div><button className={manage ? "round manageOn" : "round"} onClick={() => setManage(!manage)}><Settings size={18} /></button></div>

    {manage && <div className="card manager">
      <b>Manage {muscle} exercises</b>
      <div className="addExerciseRow"><input value={newExercise} onChange={(e) => setNewExercise(e.target.value)} placeholder={`New ${muscle} exercise`} /><button onClick={addExercise}><Plus size={17} /></button></div>
      <p>Add, rename or delete exercises in the selected body-part library.</p>
    </div>}

    {finished && <div className="finishBanner"><Check size={18} /><div><b>Workout saved ✓</b><span>Today's workout has been recorded.</span></div><button onClick={() => setFinished(false)}><X size={15} /></button></div>}

    <div className="muscleTabs">{Object.keys(library).map((m) => <button className={muscle === m ? "sel" : ""} onClick={() => { setMuscle(m); selectExercise(library[m][0]); }} key={m}>{m}</button>)}</div>

    <div className="exercisePicker">
      {(library[muscle] || []).map((ex) => <div className="exerciseChip" key={ex.id}>
        <button className={selected?.id === ex.id ? "selected" : ""} onClick={() => selectExercise(ex)}>{ex.name}</button>
        {manage && <div className="chipTools"><button onClick={() => rename(ex)}><Pencil size={12} /></button><button onClick={() => del(ex)}><Trash2 size={12} /></button></div>}
      </div>)}
    </div>

    {selected && <div className="card exercise">
      <div className="exerciseHeadWithVisual">
        <div className="exerciseHead">
          <div>
            <span className="label">{muscle.toUpperCase()}</span>
            <h3>{selected.name}</h3>
            <span>Log your weight and reps for every set.</span>
            {last && <span className="lastTime">Last time ({daysAgo(last.date)}): {last.top.kg}kg × {last.top.reps} · {last.count} set{last.count === 1 ? "" : "s"}</span>}
          </div>
          <Dumbbell />
        </div>
        <ExerciseIllustration name={selected.name} muscle={muscle} />
      </div>
      <div className="setHead"><span>SET</span><span>WEIGHT</span><span>REPS</span><span>DONE</span></div>
      {sets.map((s, i) => <div className="setRow" key={i}>
        <span>{i + 1}</span>
        <Stepper value={s.kg} step={weightOptions.step} min={weightOptions.min} max={weightOptions.max} onChange={(v) => saveSets(sets.map((x, j) => (j === i ? { ...x, kg: v } : x)))} />
        <Stepper value={s.reps} step={repOptions.step} min={repOptions.min} max={repOptions.max} onChange={(v) => saveSets(sets.map((x, j) => (j === i ? { ...x, reps: v } : x)))} />
        <button className={s.done ? "done" : ""} onClick={() => saveSets(sets.map((x, j) => (j === i ? { ...x, done: !x.done } : x)))}>✓</button>
      </div>)}
      <button className="addSet" onClick={addSet}>+ ADD SET</button>
    </div>}

    <button className="widePrimary" onClick={finish}><Check size={17} /> FINISH WORKOUT</button>
  </section>;
}

/* ---------- progress ---------- */
function HistoryRow({ date, summary, entry }) {
  const [open, setOpen] = useState(false);
  const exercises = Object.values(entry || {});
  return <div className="historyRow card">
    <button className="historyHead" onClick={() => setOpen(!open)}>
      <div><b>{dateLabel(date)}</b><span>{summary.time} · {summary.exercises} exercises · {summary.totalSets} sets</span></div>
      <ChevronRight size={16} className={open ? "rot" : ""} />
    </button>
    {open && <div className="historyDetail">
      {exercises.length === 0 ? <p className="helper">No set details saved for this day.</p> :
        exercises.map((ex, i) => <div className="historyExercise" key={i}>
          <b>{ex.name}</b>
          <span>{(ex.sets || []).filter((s) => s.done).map((s) => `${s.kg}kg×${s.reps}`).join(", ") || "no sets marked done"}</span>
        </div>)}
    </div>}
  </div>;
}

function ProgressPage({ data, addWeight }) {
  const [w, setW] = useState(data.weight);
  const h = (data.weightHistory || []).slice(-30);
  const values = h.map((x) => x.weight).concat([data.weight]);
  const min = Math.min(...values) - .5, max = Math.max(...values) + .5;
  const firstTime = h[0] ? new Date(h[0].date).getTime() : Date.now();
  const lastTime = h.length ? new Date(h[h.length - 1].date).getTime() : Date.now();
  const span = Math.max(1, lastTime - firstTime);
  const history = Object.entries(data.finishedWorkouts || {}).sort((a, b) => b[0].localeCompare(a[0])).slice(0, 14);

  return <section className="page">
    <div className="pageTitle"><div><span className="label">PROGRESS</span><h2>Your journey</h2></div></div>
    <div className="statGrid">
      <div className="stat"><span>CURRENT</span><b>{Number(data.weight).toFixed(1)} kg</b></div>
      <div className="stat"><span>GOAL</span><b>{data.goalWeight} kg</b></div>
      <div className="stat"><span>TO GO</span><b>{Math.max(0, data.goalWeight - data.weight).toFixed(1)} kg</b></div>
    </div>
    <div className="card chart">
      <div className="cardHead"><div><span className="label">BODY WEIGHT</span><h3>Saved entries</h3></div><TrendingUp /></div>
      <div className="spark">
        {h.map((v) => {
          const t = new Date(v.date).getTime();
          const left = h.length === 1 ? 50 : ((t - firstTime) / span) * 90 + 5;
          return <div className="point" key={v.date} style={{ left: `${left}%`, bottom: `${((v.weight - min) / (max - min)) * 75 + 10}%` }}><b>{v.weight}</b></div>;
        })}
      </div>
    </div>
    <div className="card inputCard">
      <label>LOG TODAY'S WEIGHT</label>
      <div className="weightInput"><input inputMode="decimal" value={w} onChange={(e) => setW(e.target.value)} /><span>kg</span><button onClick={() => addWeight(Number(w))}>SAVE</button></div>
    </div>

    <div className="sectionTitle"><h2>Workout history</h2><span>{history.length} sessions</span></div>
    {history.length === 0 ? <div className="empty">No finished workouts yet.</div> :
      <div className="list">{history.map(([date, summary]) => <HistoryRow key={date} date={date} summary={summary} entry={data.workoutsByDay?.[date]} />)}</div>}
  </section>;
}

/* ---------- settings ---------- */
function SettingsPage({ data, update, exportData, importData }) {
  const fileRef = useRef(null);
  return <section className="page">
    <div className="pageTitle"><div><span className="label">N-FIT</span><h2>Settings</h2></div></div>
    <div className="card settings">
      <h3>Your targets</h3>
      <label>Daily calories</label><input type="number" value={data.calGoal} onChange={(e) => update({ calGoal: Number(e.target.value) })} />
      <label>Daily protein (g)</label><input type="number" value={data.proteinGoal} onChange={(e) => update({ proteinGoal: Number(e.target.value) })} />
      <label>Goal weight (kg)</label><input type="number" step="0.1" value={data.goalWeight} onChange={(e) => update({ goalWeight: Number(e.target.value) })} />
      <label>Water goal (L)</label><input type="number" step="0.1" value={data.waterGoal} onChange={(e) => update({ waterGoal: Number(e.target.value) })} />
      <div className="settingLine"><span>Storage</span><b>Saved on this device</b></div>
      <div className="settingLine"><span>App version</span><b>V5.0</b></div>
    </div>
    <div className="card settings">
      <h3>Backup</h3>
      <p className="helper">Your data only lives in this browser. Export a backup regularly, or before switching devices/browsers — importing replaces everything currently saved.</p>
      <button className="primary" onClick={exportData}>EXPORT DATA (.json)</button>
      <button className="primary outline" onClick={() => fileRef.current?.click()}>IMPORT DATA (.json)</button>
      <input type="file" accept="application/json" ref={fileRef} style={{ display: "none" }} onChange={(e) => { const f = e.target.files?.[0]; if (f) importData(f); e.target.value = ""; }} />
    </div>
  </section>;
}

createRoot(document.getElementById("root")).render(<App />);
