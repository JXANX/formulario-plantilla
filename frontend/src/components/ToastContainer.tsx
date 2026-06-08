import { useEffect, useRef, useState } from 'react';
import type { ReactElement } from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleOutlinedIcon from '@mui/icons-material/CheckCircleOutlined';
import ErrorOutlinedIcon from '@mui/icons-material/ErrorOutlined';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import { useToast } from '../context/ToastContext';
import type { Toast, ToastType } from '../context/ToastContext';

// ── Palette ────────────────────────────────────────────────────────────────
const PALETTE: Record<ToastType, { bg: string; border: string; bar: string; icon: string }> = {
  success: { bg: '#f0fdf4', border: '#22c55e', bar: '#16a34a', icon: '#16a34a' },
  error:   { bg: '#fff1f2', border: '#f43f5e', bar: '#e11d48', icon: '#e11d48' },
  warning: { bg: '#fffbeb', border: '#f59e0b', bar: '#d97706', icon: '#d97706' },
  info:    { bg: '#eff6ff', border: '#3b82f6', bar: '#2563eb', icon: '#2563eb' },
};

const ICONS: Record<ToastType, ReactElement> = {
  success: <CheckCircleOutlinedIcon fontSize="small" />,
  error:   <ErrorOutlinedIcon fontSize="small" />,
  warning: <WarningAmberIcon fontSize="small" />,
  info:    <InfoOutlinedIcon fontSize="small" />,
};

// ── Single Toast Item ──────────────────────────────────────────────────────
function ToastItem({ toast }: { toast: Toast }) {
  const { removeToast } = useToast();
  const [visible, setVisible] = useState(false);
  const [progress, setProgress] = useState(100);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());
  const colors = PALETTE[toast.type];

  // Slide-in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 20);
    return () => clearTimeout(t);
  }, []);

  // Progress bar countdown & auto-dismiss
  useEffect(() => {
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, 100 - (elapsed / toast.duration) * 100);
      setProgress(remaining);
      if (remaining === 0) {
        clearInterval(intervalRef.current!);
        handleDismiss();
      }
    }, 50);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast.id, toast.duration]);

  const handleDismiss = () => {
    setVisible(false);
    setTimeout(() => removeToast(toast.id), 350);
  };

  return (
    <Box
      role="alert"
      aria-live="polite"
      sx={{
        position: 'relative',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 1.2,
        minWidth: 300,
        maxWidth: 420,
        bgcolor: colors.bg,
        border: `1.5px solid ${colors.border}`,
        borderRadius: '10px',
        boxShadow: '0 4px 24px 0 rgba(0,0,0,0.12)',
        px: 2,
        pt: 1.5,
        pb: 2.2,
        overflow: 'hidden',
        transition: 'all 350ms cubic-bezier(0.4, 0, 0.2, 1)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0)' : 'translateX(110%)',
      }}
    >
      {/* Icon */}
      <Box sx={{ color: colors.icon, mt: 0.2, flexShrink: 0 }}>
        {ICONS[toast.type]}
      </Box>

      {/* Message */}
      <Typography
        variant="body2"
        sx={{ flex: 1, fontSize: '0.875rem', lineHeight: 1.5, color: '#1e293b', pr: 1 }}
      >
        {toast.message}
      </Typography>

      {/* Close button */}
      <IconButton
        size="small"
        onClick={handleDismiss}
        aria-label="Cerrar notificación"
        sx={{ color: '#64748b', mt: -0.5, mr: -0.8, '&:hover': { color: '#1e293b' } }}
      >
        <CloseIcon fontSize="inherit" />
      </IconButton>

      {/* Progress bar */}
      <Box
        sx={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          height: '3px',
          width: `${progress}%`,
          bgcolor: colors.bar,
          borderRadius: '0 0 0 10px',
          transition: 'width 50ms linear',
        }}
      />
    </Box>
  );
}

// ── Container ──────────────────────────────────────────────────────────────
export default function ToastContainer() {
  const { toasts } = useToast();

  return (
    <Box
      sx={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        gap: 1.2,
        pointerEvents: 'none',
        '& > *': { pointerEvents: 'auto' },
      }}
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </Box>
  );
}
