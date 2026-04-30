import React from "react";

type Props = {
  children: React.ReactNode;
  onClose: () => void;
};

export default function ModalLayout({ children, onClose }: Props) {
  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex justify-end"
      onClick={onClose}
    >
      <div
        className="bg-gray-900 w-full h-full overflow-y-auto p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4"
        >
          ✕
        </button>

        {children}
      </div>
    </div>
  );
}