import './App.css';
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';

const models: { [key: string ]: string} = process.env.REACT_APP_SD_MODEL_MAP
  ? JSON.parse(`${process.env.REACT_APP_SD_MODEL_MAP}`)
  : {};

const App: React.FC = () => {
  const [promptValue, setPromptValue] = useState<string>(() => localStorage.getItem('prompt') || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [outputImageUrl, setOutputImageUrl] = useState<string>(() => localStorage.getItem('outputImageUrl') || '');
  const [promptHistory, setPromptHistory] = useState<{ prompt: string; imageUrl: string }[]>(() => localStorage.getItem('promptHistory') ? JSON.parse(`${localStorage.getItem('promptHistory')}`) : []);
  const [modelIndex, setModelIndex] = useState<string>(localStorage.getItem('modelIndex') || '');
  const [loraName, setLoraName] = useState<string>(localStorage.getItem('loraName') || '');
  const [loraScale, setLoraScale] = useState<string>(localStorage.getItem('loraScale') || '');

  useEffect(() => {
    localStorage.setItem('prompt', promptValue);
  }, [promptValue]);

  useEffect(() => {
    localStorage.setItem('outputImageUrl', outputImageUrl);
  }, [outputImageUrl]);

  useEffect(() => {
    localStorage.setItem('promptHistory', JSON.stringify(promptHistory));
  }, [promptHistory]);

  useEffect(() => {
    localStorage.setItem('modelIndex', modelIndex);
  }, [modelIndex]);

  useEffect(() => {
    localStorage.setItem('loraName', loraName);
  }, [loraName]);

  useEffect(() => {
    localStorage.setItem('loraScale', loraScale);
  }, [loraScale]);
  
  const handleTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPromptValue(event.target.value);
  };

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setModelIndex(event.target.value);
  };

  const handleLoraNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLoraName(event.target.value);
  };

  const handleLoraScaleChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setLoraScale(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const url = `https://${modelIndex}.apps.beam.cloud`;
    const authHeader = `Basic ${process.env.REACT_APP_AUTH_TOKEN}`;
    const payload = { 
      prompt: promptValue, 
      lora_model: loraName,
      lora_scale: loraScale
    };
    fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(data => {
      pollTaskStatus(data.task_id);
    })
    .catch(error => {
      console.error('Error:', error);
      setLoading(false);
    });
  };

  const pollTaskStatus = (taskId: string) => {
    const statusUrl = `https://api.beam.cloud/v1/task/${taskId}/status/`;
    const pollInterval = 3000; // 3 seconds
    const poll = setInterval(() => {
      fetch(statusUrl, {
        headers: {
          'Authorization': `Basic ${process.env.REACT_APP_AUTH_TOKEN}`
        }
      })
      .then(response => response.json())
      .then(data => {
        if (data.status === 'COMPLETE') {
          clearInterval(poll);
          setOutputImageUrl(data.outputs['./output.png'].url);
          setPromptHistory([...promptHistory, { prompt: promptValue, imageUrl: data.outputs['./output.png'].url }]);
          setLoading(false);
        }
      })
      .catch(error => {
        console.error('Error:', error);
        clearInterval(poll);
        setLoading(false);
      });
    }, pollInterval);
  };

  const handleClear = () => {
    setPromptValue('');
    setOutputImageUrl('');
  };

  const handlePromptSelect = (selectedPrompt: string, selectedImageUrl: string) => {
    setPromptValue(selectedPrompt);
    setOutputImageUrl(selectedImageUrl);
  };

  const handlePromptDelete = (promptIndex: number) => {
    const updatedPrompts = [...promptHistory];
    updatedPrompts.splice(promptIndex, 1);
    setPromptHistory(updatedPrompts);
  };
  
  return (
    <div className='container mt-5'>
      <div className='row'>
        <Sidebar prompts={promptHistory} onPromptSelect={handlePromptSelect} onDeletePrompt={handlePromptDelete} />
        <div className='col-9'>
          <h1>
            Simple Form
          </h1>
          <div className='container-lg'>
            <div className='row'>
              <div className='col'>
                <form id='promptForm' onSubmit={handleSubmit}>
                  <div className='mb-3'>
                    <label htmlFor='prompt' className='form-label'>Prompt</label>
                    <textarea className='form-control' id='prompt' name='prompt' value={promptValue} onChange={handleTextareaChange} />
                    <label htmlFor='model' className='form-label'>Model</label>
                    <select className='form-select' aria-label='Default select example' value={modelIndex} onChange={handleModelChange}>
                        {Object.keys(models).map((key) => (
                          <option key={key} value={key}>{models[key]}</option>
                        ))}
                    </select>
                    <label htmlFor='loraName' className='form-label'>Lora Name</label>
                    <input type='text' className='form-control' name='loraName' value={loraName} onChange={handleLoraNameChange} />
                    <label htmlFor='loraScale' className='form-label'>Lora Scale</label>
                    <input type='text' className='form-control' name='loraScale' value={loraScale} onChange={handleLoraScaleChange} />
                  </div>
                  <button type='submit' className='btn btn-primary' id='sendBtn' disabled={promptValue.trim() === '' || !modelIndex || loading}>Send</button>
                  <button type='button' className='btn btn-secondary' id='clearBtn' onClick={handleClear} disabled={loading}>Clear</button>
                </form>
                {loading && (
                  <div id='loadingOverlay' className='loading-overlay'>
                    <div className='spinner-border text-primary' role='status'>
                      <span className='visually-hidden'>Loading...</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
            {outputImageUrl && (
            <div className='row'>
              <div className='col'>
                <div id='outputContainer'>
                  <h2>Output Image</h2>
                  <img id='outputImage' src={outputImageUrl} alt='Output Image' />
                </div>
              </div>
            </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
