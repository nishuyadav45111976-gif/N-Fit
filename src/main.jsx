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
  Chest: ["Bench Press", "Incline Dumbbell Press", "Cable Fly", "Pec Deck", "Chest Press Machine", "Dumbbell Fly"],
  Back: ["Lat Pulldown", "Seated Cable Row", "One-Arm Dumbbell Row", "Barbell Row", "Straight-Arm Pulldown", "Back Extension"],
  Shoulders: ["Overhead Press", "Dumbbell Shoulder Press", "Lateral Raise", "Rear Delt Fly", "Face Pull", "Front Raise"],
  Biceps: ["Barbell Curl", "Dumbbell Curl", "Hammer Curl", "Incline Dumbbell Curl", "Cable Curl", "Preacher Curl"],
  Triceps: ["Cable Pushdown", "Overhead Triceps Extension", "Skull Crusher", "Rope Pushdown", "Dips", "Close-Grip Bench Press"],
  Legs: ["Barbell Squat", "Leg Press", "Romanian Deadlift", "Leg Extension", "Leg Curl", "Walking Lunges", "Calf Raise"]
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
// Older saves stored exercises as plain name strings. Give them stable ids.
function migrateLibrary(raw) {
  if (!raw) return defaultExercises;
  const out = {};
  for (const [muscle, arr] of Object.entries(raw)) {
    out[muscle] = (arr || []).map((item) =>
      typeof item === "string" ? { id: slug(`${muscle}-${item}`), name: item } : item
    );
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

function ExerciseIllustration({ name }) {
  const n = name.toLowerCase();
  let type = "press";
  if (n.includes("squat") || n.includes("leg press") || n.includes("lunge") || n.includes("leg extension") || n.includes("leg curl") || n.includes("calf")) type = "legs";
  else if (n.includes("pulldown") || n.includes("row") || n.includes("back extension")) type = "pull";
  else if (n.includes("curl") || n.includes("hammer")) type = "curl";
  else if (n.includes("lateral") || n.includes("rear delt") || n.includes("face pull") || n.includes("shoulder") || n.includes("overhead")) type = "shoulder";
  else if (n.includes("fly") || n.includes("pec deck")) type = "fly";

  const Frame = ({ x, children }) => <g transform={`translate(${x} 0)`}>{children}</g>;
  const person = (cx = 35, cy = 43) => <circle cx={cx} cy={cy} r="6" className="ill-head" />;
  return <div className="exerciseMini">
    <div className="miniLabel">HOW TO <span>• {name}</span></div>
    <svg viewBox="0 0 270 82" role="img" aria-label={`${name} form illustration`}>
      <line x1="8" y1="70" x2="262" y2="70" className="ill-floor" />
      {type === "press" && <>
        <Frame x={0}>{person(32, 38)}<line x1="37" y1="43" x2="55" y2="57" className="ill-body" /><line x1="52" y1="57" x2="43" y2="68" className="ill-body" /><line x1="52" y1="57" x2="64" y2="68" className="ill-body" /><line x1="48" y1="52" x2="72" y2="40" className="ill-body" /><line x1="69" y1="40" x2="69" y2="30" className="ill-bar" /><line x1="60" y1="30" x2="78" y2="30" className="ill-bar" /><line x1="18" y1="61" x2="78" y2="61" className="ill-bench" /></Frame>
        <Frame x={90}>{person(32, 38)}<line x1="37" y1="43" x2="55" y2="57" className="ill-body" /><line x1="52" y1="57" x2="43" y2="68" className="ill-body" /><line x1="52" y1="57" x2="64" y2="68" className="ill-body" /><line x1="48" y1="52" x2="72" y2="52" className="ill-body" /><line x1="69" y1="52" x2="69" y2="27" className="ill-bar" /><line x1="60" y1="27" x2="78" y2="27" className="ill-bar" /><line x1="18" y1="61" x2="78" y2="61" className="ill-bench" /></Frame>
        <Frame x={180}>{person(32, 38)}<line x1="37" y1="43" x2="55" y2="57" className="ill-body" /><line x1="52" y1="57" x2="43" y2="68" className="ill-body" /><line x1="52" y1="57" x2="64" y2="68" className="ill-body" /><line x1="48" y1="52" x2="72" y2="40" className="ill-body" /><line x1="69" y1="40" x2="69" y2="30" className="ill-bar" /><line x1="60" y1="30" x2="78" y2="30" className="ill-bar" /><line x1="18" y1="61" x2="78" y2="61" className="ill-bench" /></Frame>
      </>}
      {type === "pull" && <>
        <Frame x={0}>{person(36, 43)}<line x1="36" y1="49" x2="36" y2="62" className="ill-body" /><line x1="36" y1="52" x2="23" y2="43" className="ill-body" /><line x1="23" y1="43" x2="23" y2="29" className="ill-body" /><line x1="36" y1="52" x2="49" y2="43" className="ill-body" /><line x1="49" y1="43" x2="49" y2="29" className="ill-body" /><line x1="15" y1="26" x2="57" y2="26" className="ill-bar" /></Frame>
        <Frame x={90}>{person(36, 43)}<line x1="36" y1="49" x2="36" y2="62" className="ill-body" /><line x1="36" y1="52" x2="29" y2="45" className="ill-body" /><line x1="29" y1="45" x2="29" y2="33" className="ill-body" /><line x1="36" y1="52" x2="43" y2="45" className="ill-body" /><line x1="43" y1="45" x2="43" y2="33" className="ill-body" /><line x1="15" y1="26" x2="57" y2="26" className="ill-bar" /></Frame>
        <Frame x={180}>{person(36, 43)}<line x1="36" y1="49" x2="36" y2="62" className="ill-body" /><line x1="36" y1="52" x2="23" y2="43" className="ill-body" /><line x1="23" y1="43" x2="23" y2="29" className="ill-body" /><line x1="36" y1="52" x2="49" y2="43" className="ill-body" /><line x1="49" y1="43" x2="49" y2="29" className="ill-body" /><line x1="15" y1="26" x2="57" y2="26" className="ill-bar" /></Frame>
      </>}
      {type === "legs" && <>
        <Frame x={0}>{person(36, 37)}<line x1="36" y1="43" x2="36" y2="54" className="ill-body" /><line x1="36" y1="46" x2="22" y2="50" className="ill-body" /><line x1="36" y1="46" x2="50" y2="50" className="ill-body" /><line x1="36" y1="54" x2="26" y2="68" className="ill-body" /><line x1="36" y1="54" x2="46" y2="68" className="ill-body" /><line x1="15" y1="42" x2="57" y2="42" className="ill-bar" /></Frame>
        <Frame x={90}>{person(36, 42)}<line x1="36" y1="48" x2="36" y2="57" className="ill-body" /><line x1="36" y1="50" x2="22" y2="54" className="ill-body" /><line x1="36" y1="50" x2="50" y2="54" className="ill-body" /><line x1="36" y1="57" x2="25" y2="64" className="ill-body" /><line x1="36" y1="57" x2="47" y2="64" className="ill-body" /><line x1="15" y1="47" x2="57" y2="47" className="ill-bar" /></Frame>
        <Frame x={180}>{person(36, 37)}<line x1="36" y1="43" x2="36" y2="54" className="ill-body" /><line x1="36" y1="46" x2="22" y2="50" className="ill-body" /><line x1="36" y1="46" x2="50" y2="50" className="ill-body" /><line x1="36" y1="54" x2="26" y2="68" className="ill-body" /><line x1="36" y1="54" x2="46" y2="68" className="ill-body" /><line x1="15" y1="42" x2="57" y2="42" className="ill-bar" /></Frame>
      </>}
      {type === "curl" && <>
        <Frame x={0}>{person(36, 36)}<line x1="36" y1="42" x2="36" y2="58" className="ill-body" /><line x1="36" y1="47" x2="22" y2="56" className="ill-body" /><line x1="36" y1="47" x2="50" y2="56" className="ill-body" /><line x1="36" y1="58" x2="28" y2="68" className="ill-body" /><line x1="36" y1="58" x2="44" y2="68" className="ill-body" /><line x1="19" y1="59" x2="27" y2="54" className="ill-bar" /><line x1="45" y1="54" x2="53" y2="59" className="ill-bar" /></Frame>
        <Frame x={90}>{person(36, 36)}<line x1="36" y1="42" x2="36" y2="58" className="ill-body" /><line x1="36" y1="47" x2="30" y2="57" className="ill-body" /><line x1="36" y1="47" x2="42" y2="57" className="ill-body" /><line x1="36" y1="58" x2="28" y2="68" className="ill-body" /><line x1="36" y1="58" x2="44" y2="68" className="ill-body" /><line x1="27" y1="57" x2="20" y2="52" className="ill-bar" /><line x1="45" y1="57" x2="52" y2="52" className="ill-bar" /></Frame>
        <Frame x={180}>{person(36, 36)}<line x1="36" y1="42" x2="36" y2="58" className="ill-body" /><line x1="36" y1="47" x2="22" y2="56" className="ill-body" /><line x1="36" y1="47" x2="50" y2="56" className="ill-body" /><line x1="36" y1="58" x2="28" y2="68" className="ill-body" /><line x1="36" y1="58" x2="44" y2="68" className="ill-body" /><line x1="19" y1="59" x2="27" y2="54" className="ill-bar" /><line x1="45" y1="54" x2="53" y2="59" className="ill-bar" /></Frame>
      </>}
      {type === "shoulder" && <>
        <Frame x={0}>{person(36, 36)}<line x1="36" y1="42" x2="36" y2="58" className="ill-body" /><line x1="36" y1="48" x2="20" y2="37" className="ill-body" /><line x1="36" y1="48" x2="52" y2="37" className="ill-body" /><line x1="36" y1="58" x2="28" y2="68" className="ill-body" /><line x1="36" y1="58" x2="44" y2="68" className="ill-body" /><line x1="17" y1="35" x2="24" y2="39" className="ill-bar" /><line x1="48" y1="39" x2="55" y2="35" className="ill-bar" /></Frame>
        <Frame x={90}>{person(36, 36)}<line x1="36" y1="42" x2="36" y2="58" className="ill-body" /><line x1="36" y1="48" x2="18" y2="48" className="ill-body" /><line x1="36" y1="48" x2="54" y2="48" className="ill-body" /><line x1="36" y1="58" x2="28" y2="68" className="ill-body" /><line x1="36" y1="58" x2="44" y2="68" className="ill-body" /><line x1="15" y1="48" x2="25" y2="48" className="ill-bar" /><line x1="47" y1="48" x2="57" y2="48" className="ill-bar" /></Frame>
        <Frame x={180}>{person(36, 36)}<line x1="36" y1="42" x2="36" y2="58" className="ill-body" /><line x1="36" y1="48" x2="20" y2="37" className="ill-body" /><line x1="36" y1="48" x2="52" y2="37" className="ill-body" /><line x1="36" y1="58" x2="28" y2="68" className="ill-body" /><line x1="36" y1="58" x2="44" y2="68" className="ill-body" /><line x1="17" y1="35" x2="24" y2="39" className="ill-bar" /><line x1="48" y1="39" x2="55" y2="35" className="ill-bar" /></Frame>
      </>}
      {type === "fly" && <>
        <Frame x={0}>{person(36, 38)}<line x1="41" y1="43" x2="57" y2="57" className="ill-body" /><line x1="55" y1="57" x2="47" y2="68" className="ill-body" /><line x1="55" y1="57" x2="65" y2="68" className="ill-body" /><line x1="48" y1="50" x2="30" y2="40" className="ill-body" /><line x1="66" y1="50" x2="84" y2="40" className="ill-body" /><line x1="25" y1="38" x2="34" y2="43" className="ill-bar" /><line x1="80" y1="43" x2="89" y2="38" className="ill-bar" /><line x1="18" y1="61" x2="78" y2="61" className="ill-bench" /></Frame>
        <Frame x={90}>{person(36, 38)}<line x1="41" y1="43" x2="57" y2="57" className="ill-body" /><line x1="55" y1="57" x2="47" y2="68" className="ill-body" /><line x1="55" y1="57" x2="65" y2="68" className="ill-body" /><line x1="48" y1="50" x2="46" y2="34" className="ill-body" /><line x1="66" y1="50" x2="68" y2="34" className="ill-body" /><line x1="40" y1="32" x2="52" y2="32" className="ill-bar" /><line x1="62" y1="32" x2="74" y2="32" className="ill-bar" /><line x1="18" y1="61" x2="78" y2="61" className="ill-bench" /></Frame>
        <Frame x={180}>{person(36, 38)}<line x1="41" y1="43" x2="57" y2="57" className="ill-body" /><line x1="55" y1="57" x2="47" y2="68" className="ill-body" /><line x1="55" y1="57" x2="65" y2="68" className="ill-body" /><line x1="48" y1="50" x2="30" y2="40" className="ill-body" /><line x1="66" y1="50" x2="84" y2="40" className="ill-body" /><line x1="25" y1="38" x2="34" y2="43" className="ill-bar" /><line x1="80" y1="43" x2="89" y2="38" className="ill-bar" /><line x1="18" y1="61" x2="78" y2="61" className="ill-bench" /></Frame>
      </>}
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
        <ExerciseIllustration name={selected.name} />
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
