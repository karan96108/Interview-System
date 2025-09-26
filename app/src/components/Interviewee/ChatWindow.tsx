import { useEffect, useMemo, useRef } from 'react'
import {
  Card,
  Typography,
  Space,
  Tag,
  Button,
  Input,
  Flex,
  Progress,
  Tooltip,
} from 'antd'
import { PauseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons'
import type { Candidate } from '../../features/interview/types'
import { formatDuration } from '../../features/interview/utils'

const { TextArea } = Input

interface ChatWindowProps {
  candidate: Candidate
  input: string
  onInputChange: (value: string) => void
  onSend: () => void
  onPause: () => void
  onResume: () => void
}

const statusColors: Record<Candidate['status'], string> = {
  'collecting-profile': 'cyan',
  'in-progress': 'blue',
  paused: 'orange',
  completed: 'green',
}

const ChatWindow = ({ candidate, input, onInputChange, onSend, onPause, onResume }: ChatWindowProps) => {
  const listRef = useRef<HTMLDivElement>(null)
  const isInterviewing = candidate.status === 'in-progress'
  const isPaused = candidate.status === 'paused'
  const isInputDisabled = candidate.status === 'completed' || candidate.status === 'paused'
  const progressPercent = useMemo(() => {
    if (!candidate.questions.length) {
      return 0
    }
    return Math.round((candidate.answers.length / candidate.questions.length) * 100)
  }, [candidate.answers.length, candidate.questions.length])

  useEffect(() => {
    const node = listRef.current
    if (node) {
      node.scrollTo({ top: node.scrollHeight })
    }
  }, [candidate.chat.length])

  const timerText = candidate.timer
    ? `${formatDuration(candidate.timer.remainingSeconds)} remaining`
    : candidate.status === 'completed'
      ? 'Interview finished'
      : candidate.pendingProfileFields.length
        ? 'Confirm your details to begin'
        : candidate.questions.length
          ? 'Waiting for next question'
          : 'Preparing questions'

  return (
    <Card className="chat-window" bodyStyle={{ padding: 0 }}>
      <Flex vertical className="chat-window__container">
        <div className="chat-window__header">
          <div>
            <Typography.Title level={4} style={{ marginBottom: 0 }}>
              {candidate.profile.name ?? 'Candidate'}
            </Typography.Title>
            <Space size="small">
              {candidate.profile.email && <Typography.Text type="secondary">{candidate.profile.email}</Typography.Text>}
              {candidate.profile.phone && (
                <Typography.Text type="secondary">{candidate.profile.phone}</Typography.Text>
              )}
            </Space>
          </div>
          <Space align="start">
            <Tag color={statusColors[candidate.status]}>{candidate.status.replace('-', ' ')}</Tag>
            {candidate.timer && isInterviewing && (
              <Tooltip title={`Question ${candidate.currentQuestionIndex + 1} / ${candidate.questions.length}`}>
                <Tag color="geekblue">{timerText}</Tag>
              </Tooltip>
            )}
            {!candidate.timer && <Tag>{timerText}</Tag>}
            {candidate.questions.length > 0 && (
              <Tooltip title={`${candidate.answers.length} of ${candidate.questions.length} questions scored`}>
                <Progress
                  type="circle"
                  percent={progressPercent}
                  size={52}
                  strokeColor="#1677ff"
                  strokeWidth={10}
                />
              </Tooltip>
            )}
          </Space>
        </div>

        <div className="chat-window__messages" ref={listRef}>
          {candidate.chat.map((message) => (
            <div key={message.id} className={`chat-bubble chat-bubble--${message.role}`}>
              <div className="chat-bubble__meta">
                <Typography.Text type="secondary">{new Date(message.timestamp).toLocaleTimeString()}</Typography.Text>
              </div>
              <div className="chat-bubble__content">
                {message.content.split('\n').map((line) => (
                  <Typography.Paragraph key={line} style={{ marginBottom: 4 }}>
                    {line}
                  </Typography.Paragraph>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="chat-window__composer">
          <Space style={{ width: '100%' }} size="middle">
            <TextArea
              placeholder={
                candidate.pendingProfileFields.length
                  ? `Share your ${candidate.pendingProfileFields[0]} to continue`
                  : 'Type your answer here...'
              }
              value={input}
              autoSize={{ minRows: 2, maxRows: 4 }}
              onChange={(event) => onInputChange(event.target.value)}
              onPressEnter={(event) => {
                if (!event.shiftKey) {
                  event.preventDefault()
                  onSend()
                }
              }}
              disabled={isInputDisabled}
            />
            <Flex vertical gap={8} style={{ minWidth: 140 }}>
              <Button type="primary" onClick={onSend} disabled={!input.trim() || isInputDisabled}>
                Send
              </Button>
              {isInterviewing && (
                <Button icon={<PauseCircleOutlined />} onClick={onPause}>
                  Pause
                </Button>
              )}
              {isPaused && (
                <Button icon={<PlayCircleOutlined />} type="dashed" onClick={onResume}>
                  Resume
                </Button>
              )}
            </Flex>
          </Space>
        </div>
      </Flex>
    </Card>
  )
}

export default ChatWindow
