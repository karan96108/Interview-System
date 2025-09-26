import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  Avatar,
  Badge,
  Button,
  Card,
  Empty,
  Flex,
  Input,
  Progress,
  Select,
  Space,
  Tag,
  Typography,
  Upload,
  message
} from 'antd';
import type { RcFile } from 'antd/es/upload';
import { CloudUploadOutlined, PauseCircleOutlined, PlayCircleOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { parseResumeFile } from '../../utils/resumeParser';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks';
import {
  pauseInterview,
  refreshTimerAnchor,
  resumeInterview,
  setActiveCandidate,
  startCandidate,
  submitCandidateMessage,
  tickTimer
} from '../../store/candidatesSlice';
import { Candidate } from '../../types';

const { Text, Title } = Typography;

const difficultyColor: Record<Candidate['questions'][number]['difficulty'], string> = {
  easy: 'green',
  medium: 'orange',
  hard: 'red'
};

const formatTimer = (seconds?: number) => {
  if (seconds === undefined) return '--:--';
  const minutes = Math.floor(seconds / 60);
  const remaining = seconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${remaining.toString().padStart(2, '0')}`;
};

const ChatBubble = ({
  role,
  content,
  timestamp
}: {
  role: 'assistant' | 'candidate' | 'system';
  content: string;
  timestamp: string;
}) => {
  const isCandidate = role === 'candidate';
  const background = isCandidate ? '#0f7fff' : '#f1f5f9';
  const color = isCandidate ? '#fff' : '#0f172a';
  const align = isCandidate ? 'flex-end' : 'flex-start';

  return (
    <Flex style={{ width: '100%' }} vertical align={align} gap={4}>
      <Space size={6} align="center" style={{ maxWidth: '100%' }}>
        {!isCandidate && <Avatar size={28}>AI</Avatar>}
        <Card
          bodyStyle={{ background, color, padding: '12px 16px', maxWidth: 520, whiteSpace: 'pre-wrap' }}
          style={{ borderRadius: 16, border: 'none', boxShadow: '0 2px 8px rgba(15, 23, 42, 0.08)' }}
        >
          <Text style={{ color }}>{content}</Text>
        </Card>
        {isCandidate && <Avatar size={28}>You</Avatar>}
      </Space>
      <Text type="secondary" style={{ fontSize: 12 }}>
        {dayjs(timestamp).format('MMM D, HH:mm:ss')}
      </Text>
    </Flex>
  );
};

const IntervieweeView = () => {
  const dispatch = useAppDispatch();
  const { candidates, activeCandidateId } = useAppSelector((state) => state.candidates);
  const activeCandidate = useMemo(() => {
    if (!activeCandidateId) return candidates[0];
    return candidates.find((candidate) => candidate.id === activeCandidateId) ?? candidates[0];
  }, [activeCandidateId, candidates]);

  const [inputValue, setInputValue] = useState('');
  const [uploading, setUploading] = useState(false);
  const chatContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!activeCandidate) return;
    if (activeCandidate.status !== 'inProgress') return;

    const interval = window.setInterval(() => {
      dispatch(tickTimer({ candidateId: activeCandidate.id, timestamp: Date.now() }));
    }, 1000);

    return () => {
      window.clearInterval(interval);
    };
  }, [dispatch, activeCandidate?.id, activeCandidate?.status]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [activeCandidate?.chat.length]);

  const handleUpload = async (file: RcFile) => {
    try {
      setUploading(true);
      const { resumeText, extracted } = await parseResumeFile(file as File);
      dispatch(
        startCandidate({
          resumeFilename: file.name,
          resumeText,
          extracted
        })
      );
      message.success("Resume processed successfully. Let's get started!");
    } catch (error: unknown) {
      const description = error instanceof Error ? error.message : 'Unable to process the resume.';
      message.error(description);
    } finally {
      setUploading(false);
    }
    return false;
  };

  const handleSend = () => {
    if (!inputValue.trim() || !activeCandidate) return;
    dispatch(submitCandidateMessage({ candidateId: activeCandidate.id, content: inputValue.trim() }));
    setInputValue('');
  };

  const handlePauseResume = () => {
    if (!activeCandidate) return;

    if (activeCandidate.status === 'inProgress') {
      dispatch(tickTimer({ candidateId: activeCandidate.id, timestamp: Date.now() }));
      dispatch(pauseInterview(activeCandidate.id));
      message.info('Interview paused.');
    } else if (activeCandidate.status === 'paused') {
      dispatch(refreshTimerAnchor(activeCandidate.id));
      dispatch(resumeInterview(activeCandidate.id));
      message.success('Interview resumed.');
    }
  };

  const totalQuestions = activeCandidate?.questions.length ?? 6;
  const answered = activeCandidate?.questions.filter((question) => question.answer !== undefined).length ?? 0;
  const currentQuestionIndex = activeCandidate?.currentQuestionIndex ?? 0;
  const progressPercent = Math.round((answered / totalQuestions) * 100);
  const currentQuestion = activeCandidate?.questions[currentQuestionIndex];

  return (
    <Flex vertical gap={24} style={{ width: '100%' }}>
      <Card
        title="Upload your resume"
        bordered={false}
        style={{ borderRadius: 20, boxShadow: '0 10px 40px rgba(15, 127, 255, 0.12)' }}
      >
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
          <Text type="secondary">
            Upload a PDF (preferred) or DOCX resume. We will extract your contact information before starting a 6-question
            full-stack interview.
          </Text>
          <Upload.Dragger
            maxCount={1}
            multiple={false}
            accept=".pdf,.docx"
            showUploadList={false}
            beforeUpload={handleUpload}
            disabled={uploading}
          >
            <p className="ant-upload-drag-icon">
              <CloudUploadOutlined />
            </p>
            <p className="ant-upload-text">Click or drag resume file to this area to upload</p>
            <p className="ant-upload-hint">Supported formats: PDF, DOCX</p>
          </Upload.Dragger>
          {candidates.length > 0 && (
            <Flex align="center" gap={12} wrap>
              <Text strong>Continue with candidate:</Text>
              <Select
                value={activeCandidate?.id}
                onChange={(value) => dispatch(setActiveCandidate(value))}
                style={{ minWidth: 220 }}
                options={candidates.map((candidate) => ({
                  value: candidate.id,
                  label: candidate.name ?? candidate.email ?? candidate.resumeFilename
                }))}
              />
            </Flex>
          )}
        </Space>
      </Card>

      {!activeCandidate ? (
        <Empty description="No interviews started yet" style={{ marginTop: 40 }} />
      ) : (
        <Flex gap={16} align="stretch" style={{ width: '100%' }}>
          <Card
            title="Interview assistant"
            bordered={false}
            style={{ flex: 1, borderRadius: 20, boxShadow: '0 10px 40px rgba(15, 23, 42, 0.08)' }}
            bodyStyle={{ display: 'flex', flexDirection: 'column', gap: 16, height: 520 }}
          >
            <Flex gap={16} align="center" justify="space-between">
              <Flex gap={12} align="center">
                <Progress type="circle" percent={progressPercent} size={80} />
                <Flex vertical gap={4}>
                  <Text type="secondary">Question progress</Text>
                  <Text strong>
                    {answered}/{totalQuestions} answered
                  </Text>
                  {currentQuestion && (
                    <Tag color={difficultyColor[currentQuestion.difficulty]}>
                      {currentQuestion.difficulty.toUpperCase()} • {currentQuestion.duration}s
                    </Tag>
                  )}
                </Flex>
              </Flex>
              {activeCandidate.status !== 'completed' && (
                <Button
                  type="primary"
                  icon={activeCandidate.status === 'paused' ? <PlayCircleOutlined /> : <PauseCircleOutlined />}
                  onClick={handlePauseResume}
                >
                  {activeCandidate.status === 'paused' ? 'Resume' : 'Pause'} interview
                </Button>
              )}
            </Flex>

            {activeCandidate.status === 'collecting' && (
              <Alert
                type="info"
                message="We still need a bit more info"
                description="Please share the missing details the assistant is asking for so we can start your interview."
              />
            )}

            <div
              ref={chatContainerRef}
              style={{
                flex: 1,
                overflowY: 'auto',
                paddingRight: 8,
                display: 'flex',
                flexDirection: 'column',
                gap: 16
              }}
            >
              {activeCandidate.chat.map((messageItem) => (
                <ChatBubble
                  key={messageItem.id}
                  role={messageItem.role}
                  content={messageItem.content}
                  timestamp={messageItem.timestamp}
                />
              ))}
            </div>

            <Flex align="center" justify="space-between" style={{ padding: '12px 16px', background: '#f8fafc', borderRadius: 16 }}>
              <Space size={12} align="center">
                <Badge
                  status={activeCandidate.status === 'inProgress' ? 'processing' : activeCandidate.status === 'completed' ? 'success' : 'default'}
                  text={
                    activeCandidate.status === 'inProgress'
                      ? 'Live question'
                      : activeCandidate.status === 'completed'
                      ? 'Interview completed'
                      : 'Waiting for details'
                  }
                />
                {activeCandidate.status === 'inProgress' && (
                  <Tag color="blue">Time left: {formatTimer(activeCandidate.timers.remainingSeconds)}</Tag>
                )}
              </Space>
            </Flex>

            <Input.TextArea
              rows={3}
              placeholder={
                activeCandidate.status === 'completed'
                  ? 'Interview finished'
                  : 'Type your response here and press Cmd/Ctrl + Enter to send'
              }
              disabled={activeCandidate.status === 'completed'}
              value={inputValue}
              onChange={(event) => setInputValue(event.target.value)}
              onPressEnter={(event) => {
                if (event.metaKey || event.ctrlKey) {
                  event.preventDefault();
                  handleSend();
                }
              }}
            />
            <Flex justify="flex-end">
              <Button type="primary" disabled={!inputValue.trim() || activeCandidate.status === 'completed'} onClick={handleSend}>
                Send response
              </Button>
            </Flex>
          </Card>

          <Card
            title="Profile snapshot"
            style={{ width: 280, borderRadius: 20, boxShadow: '0 10px 40px rgba(15, 23, 42, 0.08)' }}
            bordered={false}
          >
            <Space direction="vertical" size={12} style={{ width: '100%' }}>
              <div>
                <Text type="secondary">Name</Text>
                <Title level={5} style={{ margin: 0 }}>
                  {activeCandidate.name ?? 'Pending'}
                </Title>
              </div>
              <div>
                <Text type="secondary">Email</Text>
                <Text>{activeCandidate.email ?? 'Pending'}</Text>
              </div>
              <div>
                <Text type="secondary">Phone</Text>
                <Text>{activeCandidate.phone ?? 'Pending'}</Text>
              </div>
              <div>
                <Text type="secondary">Resume</Text>
                <Text>{activeCandidate.resumeFilename}</Text>
              </div>
              <div>
                <Text type="secondary">Status</Text>
                <Tag color={
                  activeCandidate.status === 'completed'
                    ? 'green'
                    : activeCandidate.status === 'inProgress'
                    ? 'blue'
                    : activeCandidate.status === 'paused'
                    ? 'orange'
                    : 'default'
                }>
                  {activeCandidate.status.toUpperCase()}
                </Tag>
              </div>
              {activeCandidate.status === 'completed' && (
                <Alert
                  type="success"
                  message={`Final score: ${activeCandidate.totalScore ?? 0}`}
                  description={activeCandidate.summary}
                  showIcon
                />
              )}
            </Space>
          </Card>
        </Flex>
      )}
    </Flex>
  );
};

export default IntervieweeView;
