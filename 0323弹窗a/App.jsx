import { useState } from 'react';
import Modal from './Modal';

export default function App() {
  const [open, setOpen] = useState(false);

  return (
    <div style={{ padding: 40, textAlign: 'center' }}>
      <button
        onClick={() => setOpen(true)}
        style={{
          padding: '10px 24px',
          fontSize: 16,
          borderRadius: 8,
          border: 'none',
          background: '#1677ff',
          color: '#fff',
          cursor: 'pointer',
        }}
      >
        打开弹窗
      </button>

      <Modal
        open={open}
        onClose={() => setOpen(false)}
        title="标题"
        footer={
          <>
            <button onClick={() => setOpen(false)} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid #ddd', background: '#fff', cursor: 'pointer' }}>
              取消
            </button>
            <button onClick={() => setOpen(false)} style={{ padding: '8px 16px', borderRadius: 6, border: 'none', background: '#1677ff', color: '#fff', cursor: 'pointer' }}>
              确定
            </button>
          </>
        }
      >
        <p>弹窗内容区域，支持任意子组件。</p>
        <p>点击遮罩或右上角关闭按钮可关闭。</p>
      </Modal>
    </div>
  );
}
