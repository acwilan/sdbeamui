import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import App from './App';

const taskId: string = '12345';

describe('App component', () => {
  let mock: MockAdapter;

  beforeAll(() => {
    mock = new MockAdapter(axios);
  });

  afterEach(() => {
    mock.reset();
  });

  afterAll(() => {
    mock.restore();
  });

  test('renders prompt history and output image', async () => {
    // Mock the API call
    mock.onPost(`${process.env.REACT_APP_BASE_URL}`).reply(200, { task_id: taskId });
    mock.onGet(`https://api.beam.cloud/v1/task/${taskId}/status/`).reply(200, { task_id: taskId, status: 'COMPLETE', outputs: { './output.png': { url: 'https://example.com/image.png' } } });
  
    const { getByLabelText, getByRole, findByAltText } = render(<App />);
  
    // Enter a prompt
    const promptInput = getByLabelText('Prompt');
    fireEvent.change(promptInput, { target: { value: 'Test Prompt' } });
  
    // Submit the prompt
    const sendButton = getByRole('button', { name: /send/i });
    fireEvent.click(sendButton);
  
    // Wait for the loading spinner to disappear
    // await waitFor(() => {
    //   expect(getByRole('button', { name: /clear/i })).toBeInTheDocument();
    // });
  
    // // Wait for the image to be updated
    // const outputImage = await findByAltText('Output Image');
    // expect(outputImage).toBeInTheDocument();
  
    // // Click on the clear button
    // const clearButton = getByRole('button', { name: /clear/i });
    // fireEvent.click(clearButton);
  });  
});
