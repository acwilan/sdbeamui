import './App.css';
import React, { useState, useEffect } from 'react';
import Sidebar from './components/Sidebar';

const models: string[] = [
  "SDXL Turbo",
  "Realistic Vision XL 4.0",
  "SDXXXL v3.0"
];

const App: React.FC = () => {
  const [promptValue, setPromptValue] = useState<string>(() => localStorage.getItem('prompt') || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [outputImageUrl, setOutputImageUrl] = useState<string>(() => localStorage.getItem('outputImageUrl') || '');
  const [promptHistory, setPromptHistory] = useState<{ prompt: string; imageUrl: string }[]>(() => localStorage.getItem('promptHistory') ? JSON.parse(`${localStorage.getItem('promptHistory')}`) : []);
  const [modelIndex, setModelIndex] = useState<number>(parseInt(localStorage.getItem('modelIndex') || '1'));

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
    localStorage.setItem('modelIndex', modelIndex.toString());
  }, [modelIndex]);

  const notificationsEnabled = (): boolean => {
    return Notification.permission === 'granted';
  }

  const requestNotificationPermission = () => {
    Notification.requestPermission().then((permission) => {
      if (permission === 'granted') {
        console.log('Notification permission granted.');
      }
    });
  };

  const showNotification = (title: string, body: string) => {
    if (Notification.permission === 'granted') {
      const notification = new Notification(title, { body });
      notification.onclick = () => {
        window.focus();
      };
    }
  };

  const handleTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPromptValue(event.target.value);
  };

  const handleModelChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setModelIndex(parseInt(event.target.value));
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);

    const url = `${process.env.REACT_APP_BASE_URL}`;
    const authHeader = `Basic ${process.env.REACT_APP_AUTH_TOKEN}`;
    const payload = { prompt: promptValue, model_index: modelIndex };
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
          showNotification('Task Complete', 'Task is complete. Click to view output image.');
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
            {notificationsEnabled() && (
              <button className='btn btn-link' onClick={requestNotificationPermission}>Enable notifications</button>
            )}
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
                        {models.map((model, index) => (
                          <option key={index} value={index}>{model}</option>
                        ))}
                    </select>
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
