import React, {useEffect, useState} from 'react'
import * as tf from '@tensorflow/tfjs'
import { Line } from 'react-chartjs-2'
import 'chart.js/auto'

const DB_NAME = 'forecast-model-db';
const STORE_NAME = 'models';
const MODEL_NAME = 'time-series-model';

async function openDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onerror = () => reject("Error opening DB");
    request.onsuccess = () => resolve(request.result);
    request.onupgradeneeded = event => {
      const db = event.target.result;
      db.createObjectStore(STORE_NAME, { keyPath: 'name' });
    };
  });
}

async function saveModelToDB(model) {
    const db = await openDB();
    const modelArtifacts = await model.save(tf.io.withSaveHandler(async (artifacts) => artifacts));
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put({ name: MODEL_NAME, modelArtifacts });
        request.onsuccess = () => resolve();
        request.onerror = () => reject("Error saving model");
    });
}

async function loadModelFromDB() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
        const transaction = db.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(MODEL_NAME);
        request.onsuccess = async () => {
            if (request.result) {
                const model = await tf.loadLayersModel(tf.io.fromMemory(request.result.modelArtifacts));
                resolve(model);
            } else {
                resolve(null);
            }
        };
        request.onerror = () => reject("Error loading model");
    });
}


export default function ForecastModel({series, onPredict, onModelTrained}){
  const [status, setStatus] = useState('idle')
  const [history, setHistory] = useState(null)
  const [model, setModel] = useState(null);

  useEffect(()=>{
      async function loadModel() {
          try {
              const loadedModel = await loadModelFromDB();
              if (loadedModel) {
                  setModel(loadedModel);
                  setStatus('loaded model from db');
              } else {
                  setStatus('no model in db');
              }
          } catch (e) {
              console.error(e);
              setStatus('error loading model');
          }
      }
      loadModel();
  }, [])

  useEffect(()=>{ if(series) setHistory(series) },[series])

  async function trainAndPredict(){
    if(!history || history.length<8) { alert('Need at least 8 points'); return }
    setStatus('preparing')
    // prepare windowed dataset
    const seq = history
    const lookback = 8
    const xs = []
    const ys = []
    for(let i=0;i+lookback<seq.length;i++){
      xs.push(seq.slice(i,i+lookback))
      ys.push([seq[i+lookback]])
    }
    const xTensor = tf.tensor3d(xs.map(r=>r.map(v=>[v])))
    const yTensor = tf.tensor2d(ys)

    let currentModel = model;
    if (!currentModel) {
        setStatus('creating model');
        currentModel = tf.sequential()
        currentModel.add(tf.layers.lstm({units:32, inputShape:[lookback,1]}))
        currentModel.add(tf.layers.dense({units:1}))
        currentModel.compile({optimizer:'adam', loss:'meanSquaredError'})
    }

    setStatus('training')
    await currentModel.fit(xTensor, yTensor, {epochs:60, batchSize:8, callbacks: {onEpochEnd: (e,l)=>{ 
        setStatus('epoch '+e)
        if (onModelTrained) {
            onModelTrained(currentModel);
        }
    }}})
    await saveModelToDB(currentModel);
    setModel(currentModel);


    setStatus('predicting')
    // autoregressive predict next 20 steps
    let input = seq.slice(-lookback).slice() // copy
    const preds = []
    for(let i=0;i<20;i++){
      const t = tf.tensor3d([input.map(v=>[v])])
      const p = currentModel.predict(t)
      const v = (await p.array())[0][0]
      preds.push(v)
      input.push(v)
      input.shift()
    }

    setStatus('done')
    onPredict(preds)
  }

  function handleUploadCSV(e){
    const f = e.target.files[0]
    if(!f) return
    const reader = new FileReader()
    reader.onload = ()=>{
      const txt = reader.result
      const vals = txt.trim().split(/\n|,|\r/).map(s=>parseFloat(s)).filter(n=>!isNaN(n))
      // normalize
      const min = Math.min(...vals), max = Math.max(...vals)
      const norm = vals.map(v=> (v-min)/(max-min))
      setHistory(norm)
      alert('CSV loaded and normalized. You can train the model now.')
    }
    reader.readAsText(f)
  }

  const chartData = history ? {
    labels: history.map((_,i)=>i),
    datasets: [
      { label:'input (normalized)', data: history, borderColor:'#5ee7ff', tension:0.2 }
    ]
  } : null

  return (
    <div>
      <div style={{display:'flex', gap:8}}>
        <input type="file" accept=".csv" onChange={handleUploadCSV} />
        <button onClick={trainAndPredict} disabled={!history}>Train & Forecast</button>
      </div>
      <div style={{marginTop:10}}>
        <div>Status: {status}</div>
        {chartData && <div style={{height:220}}><Line data={chartData} /></div>}
      </div>
    </div>
  )
}