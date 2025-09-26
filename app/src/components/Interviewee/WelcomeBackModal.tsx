import { Modal, Typography } from 'antd'

interface WelcomeBackModalProps {
  open: boolean
  onResume: () => void
  onRestart: () => void
}

const WelcomeBackModal = ({ open, onResume, onRestart }: WelcomeBackModalProps) => (
  <Modal
    open={open}
    title="Welcome back"
    okText="Resume interview"
    cancelText="Start over"
    onOk={onResume}
    onCancel={onRestart}
    maskClosable={false}
  >
    <Typography.Paragraph>
      We saved your progress, including timers and answers. You can pick up right where you stopped or begin a fresh session.
    </Typography.Paragraph>
  </Modal>
)

export default WelcomeBackModal
