import Box from '@mui/material/Box';
import Skeleton from '@mui/material/Skeleton';
import Stack from '@mui/material/Stack';

export function TodoListSkeleton() {
  return (
    <Box
      aria-label="読み込み中"
      aria-busy="true"
      sx={{
        '& > div + div': {
          borderTop: '1px solid',
          borderColor: 'divider',
        },
      }}
    >
      {[0.9, 0.7, 0.5].map((w) => (
        <Stack
          key={w}
          direction="row"
          spacing={1.25}
          sx={{
            alignItems: 'center',
            py: 1.5,
            px: { xs: 0.5, sm: 1 },
          }}
        >
          <Skeleton
            variant="rectangular"
            width={18}
            height={18}
            sx={{ borderRadius: 0.5, ml: 0.75 }}
          />
          <Skeleton variant="text" sx={{ flexGrow: 1, maxWidth: `${w * 100}%`, fontSize: 15 }} />
        </Stack>
      ))}
    </Box>
  );
}
