import { Card, Typography, Space, Tag, Descriptions, List, Empty, Collapse } from 'antd'
import type { Candidate } from '../../features/interview/types'
import { formatDuration } from '../../features/interview/utils'

interface CandidateDetailProps {
  candidate?: Candidate
}

const CandidateDetail = ({ candidate }: CandidateDetailProps) => {
  if (!candidate) {
    return (
      <Card>
        <Empty description="Select a candidate to review their interview" />
      </Card>
    )
  }

  const score = candidate.totalScore ?? candidate.answers.reduce((acc, answer) => acc + answer.score, 0)

  return (
    <Card title="Candidate profile" bordered={false} className="candidate-detail">
      <Space direction="vertical" size="large" style={{ width: '100%' }}>
        <div>
          <Space size="middle" align="start">
            <Typography.Title level={4} style={{ marginBottom: 0 }}>
              {candidate.profile.name ?? 'Unknown candidate'}
            </Typography.Title>
            <Tag color={candidate.status === 'completed' ? 'green' : candidate.status === 'paused' ? 'orange' : 'blue'}>
              {candidate.status.replace('-', ' ')}
            </Tag>
          </Space>
          <Typography.Paragraph type="secondary" style={{ marginTop: 8 }}>
            {candidate.profile.email ?? 'Email unavailable'} · {candidate.profile.phone ?? 'Phone unavailable'}
          </Typography.Paragraph>
        </div>

        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="Final score">{Math.round(score)}</Descriptions.Item>
          <Descriptions.Item label="Questions completed">
            {candidate.answers.length} / {candidate.questions.length || 6}
          </Descriptions.Item>
          <Descriptions.Item label="Last activity">
            {new Date(candidate.lastInteractionAt).toLocaleString()}
          </Descriptions.Item>
          <Descriptions.Item label="Summary">
            {candidate.summary ?? 'Summary will appear after the interview is completed.'}
          </Descriptions.Item>
        </Descriptions>

        <Collapse defaultActiveKey={['answers']}>
          <Collapse.Panel header="Question performance" key="answers">
            {candidate.answers.length ? (
              <List
                itemLayout="vertical"
                dataSource={candidate.answers}
                renderItem={(answer, index) => {
                  const question = candidate.questions.find((item) => item.id === answer.questionId)
                  return (
                    <List.Item key={answer.questionId}>
                      <List.Item.Meta
                        title={`Q${index + 1}: ${question?.prompt ?? 'Question'}`}
                        description={`Difficulty: ${question?.difficulty ?? 'n/a'} | Score: ${answer.score}`}
                      />
                      <Typography.Paragraph strong>Candidate response</Typography.Paragraph>
                      <Typography.Paragraph>{answer.response}</Typography.Paragraph>
                      <Typography.Paragraph type="secondary">
                        Time taken: {formatDuration(answer.timeTakenSeconds)}
                      </Typography.Paragraph>
                      <Typography.Paragraph type="success">
                        {answer.feedback}
                      </Typography.Paragraph>
                    </List.Item>
                  )
                }}
              />
            ) : (
              <Empty description="No answers captured yet" />
            )}
          </Collapse.Panel>
          <Collapse.Panel header="Full chat transcript" key="chat">
            {candidate.chat.length ? (
              <List
                dataSource={candidate.chat}
                renderItem={(message) => (
                  <List.Item key={message.id}>
                    <List.Item.Meta
                      title={`${message.role.toUpperCase()} • ${new Date(message.timestamp).toLocaleString()}`}
                    />
                    <Typography.Paragraph>{message.content}</Typography.Paragraph>
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="Chat history unavailable" />
            )}
          </Collapse.Panel>
        </Collapse>
      </Space>
    </Card>
  )
}

export default CandidateDetail
