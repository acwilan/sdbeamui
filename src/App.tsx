import './App.css';
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import { PromptType } from './types';

const models: { [key: string ]: string} = process.env.REACT_APP_SD_MODEL_MAP
  ? JSON.parse(`${process.env.REACT_APP_SD_MODEL_MAP}`)
  : {};

interface Payload {
  prompt: string;
  negative_prompt?: string | undefined;
  height?: number | undefined;
  width?: number | undefined;
}

const App: React.FC = () => {
  const [promptValue, setPromptValue] = useState<string>(() => localStorage.getItem('prompt') || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [outputImageUrl, setOutputImageUrl] = useState<string>(() => localStorage.getItem('outputImageUrl') || '');
  const [promptHistory, setPromptHistory] = useState<PromptType[]>(() => localStorage.getItem('promptHistory') ? JSON.parse(`${localStorage.getItem('promptHistory')}`) : []);
  const [modelIndex, setModelIndex] = useState<string>(localStorage.getItem('modelIndex') || '');
  const [negativePrompt, setNegativePrompt] = useState<string>(localStorage.getItem('negativePrompt') || '');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [height, setHeight] = useState<string>(localStorage.getItem('height') || '');
  const [width, setWidth] = useState<string>(localStorage.getItem('width') || '');

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
    localStorage.setItem('height', height);
  }, [height]);

  useEffect(() => {
    localStorage.setItem('width', width);
  }, [width]);
  
  const handleTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPromptValue(event.target.value);
  };

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setModelIndex(event.target.value);
  };

  const handleNegativePromptChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNegativePrompt(event.target.value);
  };

  const handleHeightChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setHeight(event.target.value);
  };

  const handleWidthChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setWidth(event.target.value);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const url = `https://${modelIndex}.apps.beam.cloud`;
    const authHeader = `Basic ${process.env.REACT_APP_AUTH_TOKEN}`;
    const payload: Payload = { 
      prompt: promptValue, 
    };
    if (height && height.trim().length > 0) {
      payload.height = parseInt(height.trim(), 0);
    }
    if (width && width.trim().length > 0) {
      payload.width = parseInt(width.trim(), 0);
    }
    if (negativePrompt && negativePrompt.trim().length > 0) {
      payload.negative_prompt = negativePrompt.trim();
    }
    fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': authHeader,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    })
    .then(response => {
      if (response.status !== 200) {
        throw new Error(`Invalid response ${response.status}`);
      }
      return response.json();
    })
    .then(data => {
      setPromptHistory([...promptHistory, { 
        prompt: promptValue, 
        negativePrompt: negativePrompt, 
        modelId: modelIndex, 
        taskId: data.task_id, 
        height: height,
        width: width,
      }]);
      return pollTaskStatus(data.task_id);
    }).then(imageUrl => {
        setOutputImageUrl(imageUrl);
        setLoading(false);
    }).catch(error => {
      console.error('Error: ', error);
      setLoading(false);
      setErrorMessage(`Error retrieving result: ${error}`);
    });
  };

  const pollTaskStatus = (taskId: string): Promise<string> => 
    new Promise<string>((resolve, reject) => {
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
            return resolve(data.outputs['./output.png'].url);
          }
          if (data.status !== 'PENDING' && data.status !== 'RUNNING') {
            reject(data.status);
          }
        })
        .catch(error => {
          clearInterval(poll);
          reject(error);
        });
      }, pollInterval);
    });

  const handleClear = () => {
    setPromptValue('');
    setNegativePrompt('');
    setOutputImageUrl('');
    setErrorMessage('');
    setHeight('');
    setWidth('');
  };

  const handlePromptSelect = (prompt: PromptType) => {
    setPromptValue(prompt.prompt);
    setModelIndex(prompt.modelId);
    setNegativePrompt(prompt.negativePrompt);
    if (prompt.taskId) {
      setLoading(true);
      pollTaskStatus(prompt.taskId)
        .then(outputImageUrl => setOutputImageUrl(outputImageUrl))
        .then(() => setLoading(false));
    } else if (prompt.imageUrl) {
      setOutputImageUrl(outputImageUrl)
    }
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
                {errorMessage && (
                  <div className='alert alert-danger' role='alert'>{errorMessage}</div>
                )}
                <form id='promptForm' onSubmit={handleSubmit}>
                  <div className='mb-3'>
                    <label htmlFor='prompt' className='form-label'>Prompt</label>
                    <textarea className='form-control' id='prompt' name='prompt' value={promptValue} rows={4} onChange={handleTextareaChange} />
                    <label htmlFor='model' className='form-label'>Model</label>
                    <select className='form-select' aria-label='Default select example' value={modelIndex} onChange={handleModelChange}>
                        {Object.keys(models).map((key) => (
                          <option key={key} value={key}>{models[key]}</option>
                        ))}
                    </select>
                    <label htmlFor='negativePrompt' className='form-label'>Negative Prompt</label>
                    <textarea className='form-control' name='negativePrompt' value={negativePrompt} rows={4} onChange={handleNegativePromptChange} />
                    <div className='row'>
                      <div className='col'>
                        <label htmlFor='height' className='form-label'>Height
                          <input type='number' className='form-control' id='height' name='height' value={height} onChange={handleHeightChange} />
                        </label>
                      </div>
                      <div className='col'>
                        <label htmlFor='width' className='form-label'>Width
                            <input type='number' className='form-control' id='width' name='width' value={width} onChange={handleWidthChange} />
                        </label>
                      </div>
                    </div>
                  </div>
                  <button type='submit' className='btn btn-primary' id='sendBtn' disabled={promptValue.trim() === '' || loading}>Send</button>
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
