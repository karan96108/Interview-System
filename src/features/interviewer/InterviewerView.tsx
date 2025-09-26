import { useMemo, useState } from 'react';
import {
  Badge,
  Card,
  Descriptions,
  Divider,
  Drawer,
  Flex,
  Input,
  Space,
  Table,
  Tag,
  Typography
} from 'antd';
import type { ColumnsType } from 'antd/es/table';
import dayjs from 'dayjs';
import { useAppDispatch, useAppSelector } from '../../hooks/reduxHooks';
import { setActiveCandidate } from '../../store/candidatesSlice';
import { Candidate, ChatMessage } from '../../types';

const { Text, Title } = Typography;

interface TableCandidate extends Candidate {
  key: string;
}

const statusTag = (status: Candidate['status']) => {
  if (status === 'completed') return <Tag color="green">Completed</Tag>;
  if (status === 'inProgress') return <Tag color="blue">In progress</Tag>;
  if (status === 'paused') return <Tag color="orange">Paused</Tag>;
  return <Tag>Collecting info</Tag>;
};

const ChatTimeline = ({ chat }: { chat: ChatMessage[] }) => {
  return (
    <Space direction="vertical" style={{ width: '100%' }} size={12}>
      {chat.map((message) => (
        <Card key={message.id} size="small" bodyStyle={{ display: 'flex', justifyContent: 'space-between' }}>
          <Space direction="vertical" size={4} style={{ maxWidth: '80%' }}>
            <Text type="secondary">{message.role === 'assistant' ? 'Crisp (AI)' : 'Candidate'}</Text>
            <Text>{message.content}</Text>
          </Space>
          <Text type="secondary">{dayjs(message.timestamp).format('MMM D, HH:mm')}</Text>
        </Card>
      ))}
    </Space>
  );
};

const InterviewerView = () => {
  const dispatch = useAppDispatch();
  const { candidates } = useAppSelector((state) => state.candidates);
  const [openCandidateId, setOpenCandidateId] = useState<string | undefined>();
  const [search, setSearch] = useState('');

  const tableData: TableCandidate[] = useMemo(() => {
    return candidates
      .filter((candidate) => {
        const haystack = `${candidate.name ?? ''} ${candidate.email ?? ''} ${candidate.phone ?? ''}`.toLowerCase();
        return haystack.includes(search.toLowerCase());
      })
      .map((candidate) => ({ ...candidate, key: candidate.id }))
      .sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0));
  }, [candidates, search]);

  const columns: ColumnsType<TableCandidate> = [
    {
      title: 'Candidate',
      dataIndex: 'name',
      render: (_value, record) => (
        <Space direction="vertical" size={0}>
          <Text strong>{record.name ?? 'Unknown'}</Text>
          <Text type="secondary">{record.email ?? 'No email'}</Text>
        </Space>
      )
    },
    {
      title: 'Status',
      dataIndex: 'status',
      render: (value: Candidate['status']) => statusTag(value)
    },
    {
      title: 'Score',
      dataIndex: 'totalScore',
      sorter: (a, b) => (a.totalScore ?? 0) - (b.totalScore ?? 0),
      defaultSortOrder: 'descend',
      render: (value: number | undefined) =>
        value !== undefined ? <Badge count={value} showZero color="#0f7fff" /> : '--'
    },
    {
      title: 'Completed',
      dataIndex: 'completedAt',
      render: (value?: string) => (value ? dayjs(value).format('MMM D, HH:mm') : '—')
    }
  ];

  const activeCandidate = candidates.find((candidate) => candidate.id === openCandidateId);

  return (
    <Flex vertical gap={24} style={{ width: '100%' }}>
      <Card
        title="Interview dashboard"
        bordered={false}
        style={{ borderRadius: 20, boxShadow: '0 10px 40px rgba(15, 23, 42, 0.08)' }}
      >
        <Space direction="vertical" style={{ width: '100%' }} size={16}>
          <Input.Search
            placeholder="Search by name, email or phone"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            allowClear
          />
          <Table<TableCandidate>
            columns={columns}
            dataSource={tableData}
            pagination={{ pageSize: 5 }}
            onRow={(record) => ({
              onClick: () => {
                setOpenCandidateId(record.id);
                dispatch(setActiveCandidate(record.id));
              }
            })}
          />
        </Space>
      </Card>

      <Drawer
        width={520}
        title="Candidate interview details"
        open={!!openCandidateId}
        onClose={() => setOpenCandidateId(undefined)}
      >
        {!activeCandidate ? (
          <Text type="secondary">Select a candidate from the table to review their conversation.</Text>
        ) : (
          <Space direction="vertical" size={20} style={{ width: '100%' }}>
            <Descriptions title="Profile" column={1} bordered>
              <Descriptions.Item label="Name">{activeCandidate.name ?? 'Not provided'}</Descriptions.Item>
              <Descriptions.Item label="Email">{activeCandidate.email ?? 'Not provided'}</Descriptions.Item>
              <Descriptions.Item label="Phone">{activeCandidate.phone ?? 'Not provided'}</Descriptions.Item>
              <Descriptions.Item label="Status">{statusTag(activeCandidate.status)}</Descriptions.Item>
              <Descriptions.Item label="Score">
                {activeCandidate.totalScore !== undefined ? (
                  <Badge count={activeCandidate.totalScore} showZero color="#0f7fff" />
                ) : (
                  '—'
                )}
              </Descriptions.Item>
            </Descriptions>

            {activeCandidate.summary && (
              <Card type="inner" title="AI summary">
                <Text>{activeCandidate.summary}</Text>
              </Card>
            )}

            <div>
              <Title level={5}>Q&A breakdown</Title>
              <Space direction="vertical" style={{ width: '100%' }} size={12}>
                {activeCandidate.questions.map((question, index) => (
                  <Card key={question.id} type="inner">
                    <Space direction="vertical" style={{ width: '100%' }} size={8}>
                      <Space align="center" size={12}>
                        <Tag color={question.difficulty === 'easy' ? 'green' : question.difficulty === 'medium' ? 'orange' : 'red'}>
                          {question.difficulty.toUpperCase()}
                        </Tag>
                        <Text strong>
                          Question {index + 1}: {question.prompt}
                        </Text>
                      </Space>
                      <Text type="secondary">Time limit: {question.duration}s</Text>
                      <Divider style={{ margin: '8px 0' }} />
                      <Text>
                        <Text strong>Candidate answer:</Text> {question.answer || 'No answer provided'}
                      </Text>
                      <Text>
                        <Text strong>AI score:</Text> {question.score ?? 0}
                      </Text>
                    </Space>
                  </Card>
                ))}
              </Space>
            </div>

            <div>
              <Title level={5}>Chat transcript</Title>
              <ChatTimeline chat={activeCandidate.chat} />
            </div>
          </Space>
        )}
      </Drawer>
    </Flex>
  );
};

export default InterviewerView;
