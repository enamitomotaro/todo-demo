import ChecklistRtlOutlinedIcon from '@mui/icons-material/ChecklistRtlOutlined';
import Box from '@mui/material/Box';
import Stack from '@mui/material/Stack';
import Typography from '@mui/material/Typography';

export function EmptyState() {
  return (
    <Stack
      spacing={1.5}
      sx={{
        alignItems: 'center',
        textAlign: 'center',
        py: { xs: 8, sm: 10 },
      }}
    >
      <Box
        sx={{
          width: 56,
          height: 56,
          borderRadius: '50%',
          display: 'grid',
          placeItems: 'center',
          // 控えめなアクセント円。Flat Design 内に収まる範囲のディテール
          bgcolor: 'action.hover',
          color: 'text.disabled',
        }}
      >
        <ChecklistRtlOutlinedIcon sx={{ fontSize: 28 }} aria-hidden />
      </Box>
      <Stack spacing={0.5} sx={{ alignItems: 'center' }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 600, color: 'text.primary' }}>
          まだタスクがありません
        </Typography>
        <Typography variant="body2" sx={{ color: 'text.secondary' }}>
          上の入力欄から最初のタスクを追加してみましょう。
        </Typography>
      </Stack>
    </Stack>
  );
}
