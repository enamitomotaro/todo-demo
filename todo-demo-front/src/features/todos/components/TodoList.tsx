import Box from '@mui/material/Box';
import Collapse from '@mui/material/Collapse';
import { TransitionGroup } from 'react-transition-group';
import type { Todo } from '@/apis/client';
import { TodoItem } from '@/features/todos/components/TodoItem';

type Props = { todos: Todo[] };

export function TodoList({ todos }: Props) {
  return (
    <Box
      component="ul"
      sx={{
        listStyle: 'none',
        m: 0,
        p: 0,
        // 行間の divider（最終行は出さない）
        '& > li + li': {
          borderTop: '1px solid',
          borderColor: 'divider',
        },
      }}
      aria-label="タスク一覧"
    >
      <TransitionGroup>
        {todos.map((todo) => (
          <Collapse key={todo.id} timeout={200}>
            <Box component="li">
              <TodoItem todo={todo} />
            </Box>
          </Collapse>
        ))}
      </TransitionGroup>
    </Box>
  );
}
