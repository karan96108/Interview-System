import { useEffect, useMemo, useState } from 'react'
import { Card, Space, Typography, Button, Alert, Row, Col, Empty } from 'antd'
import ResumeUploadCard from './ResumeUploadCard'
import ChatWindow from './ChatWindow'
import WelcomeBackModal from './WelcomeBackModal'
import { useAppDispatch, useAppSelector } from '../../app/hooks'
import {
  startCandidate,
  processUserMessage,
  tickTimer,
  pauseInterview,
  resumeInterview,
  markWelcomeSeen,
  resetActiveCandidate,
} from '../../features/interview/interviewSlice'
import type { CandidateProfile } from '../../features/interview/types'

const IntervieweeView = () => {
  const dispatch = useAppDispatch()
  const { candidates, activeCandidateId } = useAppSelector((state) => state.interview)
  const activeCandidate = useMemo(
    () => candidates.find((candidate) => candidate.id === activeCandidateId),
    [activeCandidateId, candidates],
  )
  const [input, setInput] = useState('')
  const [welcomeVisible, setWelcomeVisible] = useState(false)

  useEffect(() => {
    if (
      activeCandidate &&
      !activeCandidate.welcomeShown &&
      activeCandidate.status !== 'completed'
    ) {
      setWelcomeVisible(true)
    } else {
      setWelcomeVisible(false)
    }
  }, [activeCandidate])

  useEffect(() => {
    if (
      activeCandidate &&
      activeCandidate.status === 'in-progress' &&
      activeCandidate.timer &&
      !activeCandidate.timer.isPaused
    ) {
      const interval = setInterval(() => dispatch(tickTimer()), 1000)
      return () => clearInterval(interval)
    }
    return () => {}
  }, [dispatch, activeCandidate?.id, activeCandidate?.timer?.questionId, activeCandidate?.status, activeCandidate?.timer?.isPaused])

  useEffect(() => {
    if (activeCandidate?.status === 'completed') {
      setInput('')
    }
  }, [activeCandidate?.status])

  const handleResumeUpload = (profile: CandidateProfile) => {
    dispatch(startCandidate({ profile }))
    setInput('')
  }

  const handleSend = () => {
    if (!input.trim()) {
      return
    }
    dispatch(processUserMessage({ message: input }))
    setInput('')
  }

  const handlePause = () => dispatch(pauseInterview())

  const handleResume = () => dispatch(resumeInterview())

  const handleWelcomeResume = () => {
    dispatch(markWelcomeSeen())
    dispatch(resumeInterview())
    setWelcomeVisible(false)
  }

  const handleRestart = () => {
    dispatch(resetActiveCandidate())
    setWelcomeVisible(false)
    setInput('')
  }

  const showStartNewButton = activeCandidate?.status === 'completed'

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Row gutter={[24, 24]} align="middle">
          <Col flex="auto">
            <Typography.Title level={3} style={{ marginBottom: 0 }}>
              Interviewee experience
            </Typography.Title>
            <Typography.Paragraph type="secondary">
              Upload your resume so Crisp can extract your profile, confirm any missing details, and guide you through a six-question full-stack interview.
            </Typography.Paragraph>
          </Col>
          {showStartNewButton && (
            <Col>
              <Button type="primary" onClick={() => dispatch(resetActiveCandidate())}>
                Start new candidate
              </Button>
            </Col>
          )}
        </Row>
      </Card>

      {!activeCandidate && (
        <ResumeUploadCard onExtracted={handleResumeUpload} />
      )}

      {activeCandidate && (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          {activeCandidate.status !== 'completed' && (
            <Alert
              type="info"
              message="Crisp is conducting a timed chat interview. Questions auto-submit when the timer expires."
            />
          )}
          <ChatWindow
            candidate={activeCandidate}
            input={input}
            onInputChange={setInput}
            onSend={handleSend}
            onPause={handlePause}
            onResume={handleResume}
          />
          {activeCandidate.status === 'completed' && (
            <Card>
              <Typography.Title level={4}>Interview summary</Typography.Title>
              {activeCandidate.summary ? (
                <Typography.Paragraph>{activeCandidate.summary}</Typography.Paragraph>
              ) : (
                <Empty description="Summary unavailable" />
              )}
            </Card>
          )}
        </Space>
      )}

      <WelcomeBackModal
        open={welcomeVisible}
        onResume={handleWelcomeResume}
        onRestart={handleRestart}
      />
    </Space>
  )
}

export default IntervieweeView
