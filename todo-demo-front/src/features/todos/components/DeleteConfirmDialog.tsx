import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogTitle from '@mui/material/DialogTitle';

type Props = {
  open: boolean;
  title: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export function DeleteConfirmDialog({ open, title, onCancel, onConfirm }: Props) {
  return (
    <Dialog
      open={open}
      onClose={onCancel}
      slotProps={{
        paper: {
          sx: {
            borderRadius: 3,
            border: '1px solid',
            borderColor: 'divider',
            minWidth: 360,
          },
        },
      }}
    >
      <DialogTitle sx={{ fontWeight: 700, letterSpacing: '-0.01em', pb: 1 }}>
        タスクを削除しますか?
      </DialogTitle>
      <DialogContent>
        <DialogContentText sx={{ color: 'text.secondary' }}>
          「{title}」を削除します。この操作は取り消せません。
        </DialogContentText>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2.5, gap: 0.5 }}>
        <Button
          onClick={(e) => {
            // Dialog が閉じる際に aria-hidden が祖先に付与されるため、
            // フォーカスを保持したままにすると Chrome が a11y 警告を出す
            e.currentTarget.blur();
            onCancel();
          }}
          color="inherit"
        >
          キャンセル
        </Button>
        <Button
          onClick={(e) => {
            e.currentTarget.blur();
            onConfirm();
          }}
          color="error"
          variant="contained"
          autoFocus
        >
          削除
        </Button>
      </DialogActions>
    </Dialog>
  );
}
