import toast from "react-hot-toast";

export const toastSuccess = (msg: string) =>
  toast.success(msg, {
    style: {
      background: "#052e1b",
      color: "#6ee7b7",
      borderLeft: "4px solid #10b981",
      borderRight: "4px solid #10b981",
      padding: "12px 16px",
      borderRadius: "6px",
      fontWeight: "500",
      fontSize: "16px",
      minWidth: "400px",
    },
  });

export const toastWarning = (msg: string) =>
  toast(msg, {
    icon: "⚠️",
    style: {
      background: "#2a0f0f",
      color: "#fca5a5",
      borderLeft: "4px solid #ef4444",
      borderRight: "4px solid #ef4444",
      padding: "12px 16px",
      borderRadius: "6px",
      fontWeight: "500",
      fontSize: "16px",
      minWidth: "400px",
    },
  });

export const toastError = (msg: string) =>
  toast.error(msg, {
    style: {
      background: "#1a0000",
      color: "#fecaca",
      borderLeft: "6px solid #dc2626",
      borderRight: "6px solid #dc2626",
      padding: "14px 18px",
      borderRadius: "6px",
      fontWeight: "500",
      fontSize: "16px",
      minWidth: "400px",
    },
  });