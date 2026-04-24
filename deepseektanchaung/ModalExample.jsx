import { useState } from 'react';
import Modal from './Modal';

export default function ModalExample() {
  const [visible, setVisible] = useState(false);

  return (
    <div style={{ padding: 40 }}>
      <button onClick={() => setVisible(true)}>打开弹窗</button>

      <Modal
        visible={visible}
        onClose={() => setVisible(false)}
        title="确认操作"
        footer={
          <>
            <button className="btn-cancel" onClick={() => setVisible(false)}>取消</button>
            <button className="btn-confirm" onClick={() => { /* 确认逻辑 */ setVisible(false); }}>
              确认
            </button>
          </>
        }
      >
        <p>确定要执行此操作吗？操作不可撤销。</p>
      </Modal>
    </div>
  );
}
