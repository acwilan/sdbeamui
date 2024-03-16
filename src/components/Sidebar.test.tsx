import React from 'react';
import { render, fireEvent } from '@testing-library/react';
import Sidebar from './Sidebar';

describe('Sidebar component', () => {
  const prompts = [
    { prompt: 'Prompt 1', imageUrl: 'https://example.com/image1.jpg' },
    { prompt: 'Prompt 2', imageUrl: 'https://example.com/image2.jpg' },
  ];
  const onPromptSelectMock = jest.fn();
  const onDeletePromptMock = jest.fn();

  beforeEach(() => {
    onPromptSelectMock.mockClear();
    onDeletePromptMock.mockClear();
  });

  test('renders list of prompts', () => {
    const { getByText } = render(<Sidebar prompts={prompts} onPromptSelect={onPromptSelectMock} onDeletePrompt={onDeletePromptMock} />);
    prompts.forEach(({ prompt }) => {
      expect(getByText(prompt)).toBeInTheDocument();
    });
  });

  test('calls onPromptSelect when a prompt is clicked', () => {
    const { getByText } = render(<Sidebar prompts={prompts} onPromptSelect={onPromptSelectMock} onDeletePrompt={onDeletePromptMock} />);
    fireEvent.click(getByText('Prompt 1'));
    expect(onPromptSelectMock).toHaveBeenCalledWith('Prompt 1', 'https://example.com/image1.jpg');
  });

  test('calls onDeletePrompt when a delete button is clicked', () => {
    const { getAllByRole } = render(<Sidebar prompts={prompts} onPromptSelect={onPromptSelectMock} onDeletePrompt={onDeletePromptMock} />);
    const deleteButtons = getAllByRole('button').filter(button =>
      button.querySelector('.bi-trash')
    );
    fireEvent.click(deleteButtons[0]);
    expect(onDeletePromptMock).toHaveBeenCalledWith(0);  });
});
