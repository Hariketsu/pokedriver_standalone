'use client';

interface ConfirmDialogProps {
  show: boolean;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  show,
  message,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!show) return null;

  return (
    <div className="confirm-overlay show">
      <div className="confirm-box">
        <div className="confirm-text">{message}</div>
        <div className="confirm-btns">
          <button className="btn-cancel" onClick={onCancel}>
            取消
          </button>
          <button className="btn-confirm" onClick={onConfirm}>
            确定
          </button>
        </div>
      </div>
    </div>
  );
}
