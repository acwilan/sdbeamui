import React from 'react';

interface SidebarProps {
  prompts: { prompt: string; imageUrl: string }[];
  onPromptSelect: (prompt: string, imageUrl: string) => void;
  onDeletePrompt: (promptIndex: number) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ prompts, onPromptSelect, onDeletePrompt }) => {
  return (
    <div className='col-3'>
      <h2>Prompt History</h2>
      <ul className='list-group'>
        {prompts.map(({ prompt, imageUrl }, index) => (
          <li key={index} className='list-group-item d-flex justify-content-between align-items-center'>
            <div onClick={() => onPromptSelect(prompt, imageUrl)} className='text-truncate' style={{ maxWidth: '80%', overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{prompt}</div>
            <button type='button' className='btn btn-link' onClick={() => onDeletePrompt(index)} name='delete'>
              <i className='bi bi-trash'></i>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default Sidebar;
