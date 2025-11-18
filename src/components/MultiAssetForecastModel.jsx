import React, {useEffect, useState} from 'react';
import * as tf from '@tensorflow/tfjs';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

const DB_NAME = 'forecast-model-db';
const STORE_NAME = 'models';
const MODEL_NAME = 'multi-asset-time-series-model';

// ... (openDB, saveModelToDB, loadModelFromDB functions remain the same)

async function openDB() {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, 1);
        request.onerror = () => reject("Error opening DB");
        request.onsuccess = () => resolve(request.result);
        request.onupgradeneeded = event => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                db.createObjectStore(STORE_NAME, { keyPath: 'name' });
            }
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
                try {
                    const model = await tf.loadLayersModel(tf.io.fromMemory(request.result.modelArtifacts));
                    resolve(model);
                } catch (error) {
                    reject("Error loading model from memory: " + error);
                }
            } else {
                resolve(null);
            }
        };
        request.onerror = (event) => reject("Error loading model from DB: " + event.target.errorCode);
    });
}


export default function MultiAssetForecastModel({assets, onPredict, onModelTrained, onAssetsChange}){
  const [status, setStatus] = useState('idle');
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

  async function trainAndPredict(){
    if(!assets || assets.length === 0) { alert('No assets provided'); return; }

    const lookback = 60;
    const allXs = [];
    const allYs = [];

    for (const asset of assets) {
        const { series, sentiment } = asset;
        if (!series || series.length < lookback) { 
            alert(`Asset ${asset.name} has insufficient data (needs at least ${lookback} points).`);
            continue;
        }

        let avgSentiment = 0;
        if (sentiment && sentiment.length > 0) {
            const sum = sentiment.reduce((a, b) => a + b, 0);
            avgSentiment = sum / sentiment.length;
        }

        const xs = [];
        const ys = [];
        for(let i=0; i + lookback < series.length; i++){
            xs.push(series.slice(i, i + lookback).map(price => [price, avgSentiment]));
            ys.push([series[i + lookback]]);
        }
        allXs.push(xs);
        allYs.push(ys);
    }

    if(allXs.length === 0) { alert("Not enough data to train."); return; }
    
    const numAssets = allXs.length;
    // Assuming all series have the same length for simplicity
    const numSamples = allXs[0].length;
    const xTensors = [];

    for(let i = 0; i < numSamples; i++) {
        for(let j = 0; j < numAssets; j++) {
            xTensors.push(allXs[j][i]);
        }
    }

    const yTensors = allYs.flat();

    const finalXTensor = tf.tensor3d(xTensors);
    const finalYTensor = tf.tensor2d(yTensors);

    let currentModel = model;
    if (!currentModel) {
        setStatus('creating model');
        const inputLayers = [];
        const lstmOutputs = [];
        for (let i = 0; i < numAssets; i++) {
            const input = tf.input({shape: [lookback, 2], name: `input_${i}`});
            inputLayers.push(input);
            const lstm = tf.layers.lstm({units: 32}).apply(input);
            lstmOutputs.push(lstm);
        }
        const concatenated = tf.layers.concatenate().apply(lstmOutputs);
        const dense_1 = tf.layers.dense({units: 64, activation: 'relu'}).apply(concatenated);
        const output = tf.layers.dense({units: 1}).apply(dense_1);
        
        currentModel = tf.model({inputs: inputLayers, outputs: output});
        currentModel.compile({optimizer: 'adam', loss: 'meanSquaredError'});
    }

    setStatus('training');
    const trainingInputs = {};
    for(let i = 0; i < numAssets; i++) {
      trainingInputs[`input_${i}`] = finalXTensor.slice([i * numSamples, 0, 0], [numSamples, lookback, 2]);
    }

    await currentModel.fit(trainingInputs, finalYTensor, {epochs:100, batchSize:8, callbacks: {
        onEpochEnd: (e,l)=>{
            setStatus('epoch '+e);
            if (onModelTrained) {
                onModelTrained(currentModel);
            }
    }}});
    await saveModelToDB(currentModel);
    setModel(currentModel);

    setStatus('predicting');
    const allPreds = [];
    for (let j = 0; j < numAssets; j++) {
        const asset = assets[j];
        let avgSentiment = 0;
        if (asset.sentiment && asset.sentiment.length > 0) {
            avgSentiment = asset.sentiment.reduce((a, b) => a + b, 0) / asset.sentiment.length;
        }

        let input = asset.series.slice(-lookback).map(price => [price, avgSentiment]);
        const preds = [];
        const predictionInputs = {};
        for(let i=0; i<120; i++){
            for(let k=0; k<numAssets; k++) {
                if (k === j) {
                    predictionInputs[`input_${k}`] = tf.tensor3d([input]);
                } else {
                    // For other assets, we can use their historical data or some other placeholder
                    const otherAsset = assets[k];
                    let otherAvgSentiment = 0;
                    if (otherAsset.sentiment && otherAsset.sentiment.length > 0) {
                        otherAvgSentiment = otherAsset.sentiment.reduce((a,b) => a+b, 0) / otherAsset.sentiment.length;
                    }
                    const otherAssetInput = otherAsset.series.slice(-lookback).map(price => [price, otherAvgSentiment]);
                    predictionInputs[`input_${k}`] = tf.tensor3d([otherAssetInput]);
                }
            }
            const p = currentModel.predict(predictionInputs);
            const v = (await p.array())[0][0];
            preds.push(v);
            input.push([v, avgSentiment]);
            input.shift();
        }
        allPreds.push({asset: asset.name, predictions: preds});
    }

    setStatus('done');
    onPredict(allPreds);
  }

  function handleUploadCSV(e){
    const files = e.target.files;
    if(!files.length) return;

    const newAssets = [];
    let filesRead = 0;

    for (let i = 0; i < files.length; i++) {
        const reader = new FileReader();
        const file = files[i];
        reader.onload = () => {
            const txt = reader.result;
            const vals = txt.trim().split(/\n|,|\r/).map(s=>parseFloat(s)).filter(n=>!isNaN(n));
            const min = Math.min(...vals), max = Math.max(...vals);
            const norm = vals.map(v=> (v-min)/(max-min));
            newAssets.push({name: file.name, series: norm, sentiment: []});
            filesRead++;
            if (filesRead === files.length) {
                onAssetsChange(newAssets);
                alert(`${files.length} CSV file(s) loaded and normalized.`);
            }
        };
        reader.readAsText(file);
    }
  }

  return (
    <div>
      <div style={{display:'flex', gap:8, alignItems: 'center'}}>
        <input type="file" accept=".csv" onChange={handleUploadCSV} multiple />
        <button onClick={trainAndPredict} disabled={!assets || assets.length === 0}>Train & Forecast All Assets</button>
      </div>
      <div style={{marginTop:10}}>
        <div>Status: {status}</div>
        <div style={{display: 'flex', flexDirection: 'row', gap: 16, overflowX: 'auto'}}>
            {assets && assets.map((asset, index) => {
                const chartData = {
                    labels: asset.series.map((_,i)=>i),
                    datasets: [
                      { label:`${asset.name} (normalized)`, data: asset.series, borderColor:'#5ee7ff', tension:0.2 }
                    ]
                };
                return (
                    <div key={index} style={{height:220, flexShrink: 0, width: 400}}>
                        <Line data={chartData} options={{ maintainAspectRatio: false }}/>
                    </div>
                )
            })}
        </div>
      </div>
    </div>
  );
}
