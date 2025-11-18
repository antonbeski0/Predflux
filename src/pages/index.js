import dynamic from 'next/dynamic'
import Recorder from '../components/Recorder'
import Digitizer from '../components/Digitizer'
import MultiAssetForecastModel from '../components/MultiAssetForecastModel'
import React, { useState } from 'react'
import NewsFeed from '../components/NewsFeed';

const Visualizer3D = dynamic(() => import('../components/Visualizer3D'), { ssr: false })
const NeuralNetwork3D = dynamic(() => import('../components/NeuralNetwork3D'), { ssr: false })

export default function Home() {
  const [predictions, setPredictions] = useState(null)
  const [model, setModel] = useState(null);
  const [assets, setAssets] = useState([]);

  const handleAssetsChange = (newAssets) => {
    setAssets(newAssets);
  };

  const handleDigitizerSeries = (newSeries) => {
    setAssets(currentAssets => {
        if (currentAssets.length > 0) {
            const updatedAssets = [...currentAssets];
            updatedAssets[0].series = newSeries; // Update first asset's series
            return updatedAssets;
        } else {
            // If no assets exist, create a new one from the digitized data
            return [{ name: 'Digitized Asset', series: newSeries, sentiment: [] }];
        }
    });
  }

  const handleSentimentChange = (sentimentData) => {
    setAssets(currentAssets => {
         if (currentAssets.length > 0) {
            const updatedAssets = [...currentAssets];
            // Apply sentiment to all assets for now
            updatedAssets.forEach(asset => asset.sentiment = sentimentData); 
            return updatedAssets;
        }
        return currentAssets; 
    });
  };

  const handlePrediction = (newPredictions) => {
      setPredictions(newPredictions);
  }

  return (
    <div style={{ padding: 20, minHeight: '100vh', position: 'relative' }}>

      <div className="card" style={{ marginTop: 20 }}>
        <Recorder />
        <hr style={{ margin: '12px 0', borderColor: 'rgba(255, 255, 255, 0.2)' }} />
        <h3>Digitizer</h3>
        <Digitizer onSeries={handleDigitizerSeries} />
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <h3>Train & Forecast</h3>
        <MultiAssetForecastModel 
            assets={assets} 
            onAssetsChange={handleAssetsChange}
            onPredict={handlePrediction} 
            onModelTrained={setModel} 
        />
        <hr style={{ margin: '12px 0', borderColor: 'rgba(255, 255, 255, 0.2)' }} />
        <div style={{ height: 420 }}>
          <Visualizer3D assets={assets} predictions={predictions} />
        </div>
      </div>
      <div className="card" style={{ marginTop: 20 }}>
          <h3>Neural Network</h3>
          <div style={{ height: "100%" }}>
              <NeuralNetwork3D model={model} />
          </div>
      </div>

      <div className="card" style={{ marginTop: 20 }}>
        <NewsFeed onSentimentChange={handleSentimentChange} />
      </div>

      <p style={{ marginTop: 18, opacity: 0.7 }}>Notes:<br/>Runs fully in-browser. Screen recording begins only with user approval. CSV uploads supported for precise data input.</p>
      <p style={{ marginTop: 18, opacity: 0.7 }}>BUILT BY ANTON BESKI.M</p>
    </div>
  )
}
