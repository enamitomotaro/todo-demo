import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Box from '@mui/material/Box';
import ButtonBase from '@mui/material/ButtonBase';
import Checkbox from '@mui/material/Checkbox';
import IconButton from '@mui/material/IconButton';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import type { Todo } from '@/apis/client';
import { DeleteConfirmDialog } from '@/features/todos/components/DeleteConfirmDialog';
import { useDeleteTodo } from '@/features/todos/hooks/useDeleteTodo';
import { useUpdateTodo } from '@/features/todos/hooks/useUpdateTodo';

type Props = { todo: Todo };

export function TodoItem({ todo }: Props) {
  const update = useUpdateTodo();
  const del = useDeleteTodo();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(todo.title);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    } else {
      setDraft(todo.title);
    }
  }, [editing, todo.title]);

  const startEdit = () => {
    setDraft(todo.title);
    setEditing(true);
  };

  const commitEdit = () => {
    const trimmed = draft.trim();
    if (trimmed.length === 0) {
      setEditing(false);
      setDraft(todo.title);
      return;
    }
    if (trimmed !== todo.title) {
      update.mutate({ id: todo.id, patch: { title: trimmed } });
    }
    setEditing(false);
  };

  const cancelEdit = () => {
    setDraft(todo.title);
    setEditing(false);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.nativeEvent.isComposing) return;
    if (e.key === 'Enter') {
      e.preventDefault();
      commitEdit();
    } else if (e.key === 'Escape') {
      e.preventDefault();
      cancelEdit();
    }
  };

  const toggleCompleted = () => {
    update.mutate({ id: todo.id, patch: { completed: !todo.completed } });
  };

  const handleDelete = () => {
    setConfirmOpen(false);
    del.mutate({ id: todo.id });
  };

  return (
    <>
      <Stack
        direction="row"
        spacing={0.5}
        sx={{
          alignItems: 'center',
          py: 1.25,
          px: { xs: 0.5, sm: 1 },
          // hover / focus-within でアクションを浮かび上がらせる
          '&:hover .todo-actions, &:focus-within .todo-actions': {
            opacity: 1,
            pointerEvents: 'auto',
          },
          // タッチ端末では常時表示
          '@media (hover: none)': {
            '& .todo-actions': { opacity: 1, pointerEvents: 'auto' },
          },
        }}
      >
        <Checkbox
          checked={todo.completed}
          onChange={toggleCompleted}
          slotProps={{
            input: {
              'aria-label': todo.completed
                ? `${todo.title} を未完了にする`
                : `${todo.title} を完了にする`,
            },
          }}
          sx={{ flexShrink: 0 }}
        />

        {editing ? (
          <TextField
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={commitEdit}
            inputRef={inputRef}
            size="small"
            autoComplete="off"
            slotProps={{ input: { 'aria-label': 'タスクのタイトルを編集' } }}
            sx={{ flexGrow: 1 }}
          />
        ) : (
          <ButtonBase
            onClick={startEdit}
            aria-label={`「${todo.title}」を編集`}
            focusRipple
            sx={{
              flexGrow: 1,
              justifyContent: 'flex-start',
              textAlign: 'left',
              borderRadius: 1.5,
              px: 1,
              py: 0.5,
              minHeight: 32,
              wordBreak: 'break-word',
              cursor: 'text',
              transition: 'background-color 180ms ease',
              '&:focus-visible': {
                boxShadow: (theme) => `0 0 0 2px ${theme.palette.primary.main}`,
              },
            }}
          >
            <Typography
              variant="body1"
              sx={{
                fontSize: 15,
                color: todo.completed ? 'text.disabled' : 'text.primary',
                position: 'relative',
                transition: 'color 220ms ease',
                // 取り消し線は完了状態のときだけ描画。色も text.disabled と統一感を出す。
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: '50%',
                  height: '1px',
                  bgcolor: 'currentColor',
                  transformOrigin: 'left center',
                  transform: todo.completed ? 'scaleX(1)' : 'scaleX(0)',
                  transition: 'transform 220ms ease',
                },
              }}
            >
              {todo.title}
            </Typography>
          </ButtonBase>
        )}

        {!editing && (
          <Box
            className="todo-actions"
            sx={{
              display: 'flex',
              alignItems: 'center',
              opacity: 0,
              pointerEvents: 'none',
              transition: 'opacity 150ms ease',
            }}
          >
            <Tooltip title="編集">
              <IconButton
                onClick={startEdit}
                aria-label="編集"
                size="small"
                sx={{ color: 'text.secondary' }}
              >
                <EditOutlinedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="削除">
              <IconButton
                onClick={() => setConfirmOpen(true)}
                aria-label="削除"
                size="small"
                sx={{
                  color: 'text.secondary',
                  '&:hover': { color: 'error.main' },
                }}
              >
                <DeleteOutlinedIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          </Box>
        )}
      </Stack>

      <DeleteConfirmDialog
        open={confirmOpen}
        title={todo.title}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={handleDelete}
      />
    </>
  );
}
