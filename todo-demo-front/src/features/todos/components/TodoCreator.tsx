import AddIcon from '@mui/icons-material/Add';
import Box from '@mui/material/Box';
import IconButton from '@mui/material/IconButton';
import InputAdornment from '@mui/material/InputAdornment';
import TextField from '@mui/material/TextField';
import { type KeyboardEvent, useCallback, useState } from 'react';
import { useCreateTodo } from '@/features/todos/hooks/useCreateTodo';

export function TodoCreator() {
  const [title, setTitle] = useState('');
  const { mutate, isPending } = useCreateTodo();

  const submit = useCallback(() => {
    const trimmed = title.trim();
    if (trimmed.length === 0) return;
    mutate({ title: trimmed });
    setTitle('');
  }, [title, mutate]);

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.nativeEvent.isComposing) {
      e.preventDefault();
      submit();
    }
  };

  const canSubmit = title.trim().length > 0 && !isPending;

  return (
    <Box
      component="form"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <TextField
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="新しいタスクを入力…"
        autoComplete="off"
        slotProps={{
          input: {
            endAdornment: (
              <InputAdornment position="end" sx={{ mr: 0.5 }}>
                <IconButton
                  type="submit"
                  disabled={!canSubmit}
                  aria-label="タスクを追加"
                  size="small"
                  color="primary"
                  edge="end"
                  sx={{
                    transition: 'background-color 180ms ease, color 180ms ease',
                  }}
                >
                  <AddIcon fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          },
          htmlInput: { 'aria-label': '新しいタスク' },
        }}
        sx={{
          '& .MuiOutlinedInput-root': {
            // やや背の高い入力で「主役」感を出す
            minHeight: 52,
            bgcolor: 'background.paper',
          },
        }}
      />
    </Box>
  );
}
