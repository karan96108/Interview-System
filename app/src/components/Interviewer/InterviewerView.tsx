import { useEffect, useMemo, useState } from 'react'
import { Card, Input, Select, Table, Tag, Typography, Row, Col, Space } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import CandidateDetail from './CandidateDetail'
import { useAppSelector } from '../../app/hooks'
import type { Candidate } from '../../features/interview/types'

interface CandidateRow {
  key: string
  name: string
  email: string
  status: Candidate['status']
  score: number
  lastInteractionAt: string
}

const statusColor: Record<Candidate['status'], string> = {
  'collecting-profile': 'cyan',
  'in-progress': 'blue',
  paused: 'orange',
  completed: 'green',
}

const InterviewerView = () => {
  const { candidates } = useAppSelector((state) => state.interview)
  const [search, setSearch] = useState('')
  const [sortMode, setSortMode] = useState<'score' | 'recent'>('score')
  const [selectedId, setSelectedId] = useState<string | null>(candidates[0]?.id ?? null)

  const filteredCandidates = useMemo(() => {
    const query = search.trim().toLowerCase()
    if (!query) {
      return candidates
    }
    return candidates.filter((candidate) => {
      const name = candidate.profile.name?.toLowerCase() ?? ''
      const email = candidate.profile.email?.toLowerCase() ?? ''
      return name.includes(query) || email.includes(query)
    })
  }, [candidates, search])

  const sortedCandidates = useMemo(() => {
    const copy = [...filteredCandidates]
    if (sortMode === 'score') {
      copy.sort((a, b) => (b.totalScore ?? 0) - (a.totalScore ?? 0))
    } else {
      copy.sort(
        (a, b) => new Date(b.lastInteractionAt).getTime() - new Date(a.lastInteractionAt).getTime(),
      )
    }
    return copy
  }, [filteredCandidates, sortMode])

  useEffect(() => {
    if (!sortedCandidates.length) {
      setSelectedId(null)
      return
    }
    if (!sortedCandidates.some((candidate) => candidate.id === selectedId)) {
      setSelectedId(sortedCandidates[0].id)
    }
  }, [sortedCandidates, selectedId])

  const columns: ColumnsType<CandidateRow> = [
    {
      title: 'Candidate',
      dataIndex: 'name',
      key: 'name',
      render: (text: string, record) => (
        <Space direction="vertical" size={0}>
          <Typography.Text strong>{text || 'Unnamed candidate'}</Typography.Text>
          <Typography.Text type="secondary">{record.email || 'Email unavailable'}</Typography.Text>
        </Space>
      ),
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: Candidate['status']) => <Tag color={statusColor[status]}>{status.replace('-', ' ')}</Tag>,
    },
    {
      title: 'Score',
      dataIndex: 'score',
      key: 'score',
      align: 'right',
      render: (value: number, record) =>
        value || record.status === 'completed' ? Math.round(value) : '—',
    },
    {
      title: 'Last interaction',
      dataIndex: 'lastInteractionAt',
      key: 'lastInteractionAt',
      render: (value: string) => new Date(value).toLocaleString(),
    },
  ]

  const dataSource: CandidateRow[] = sortedCandidates.map((candidate) => ({
    key: candidate.id,
    name: candidate.profile.name ?? '',
    email: candidate.profile.email ?? '',
    status: candidate.status,
    score: candidate.totalScore ?? 0,
    lastInteractionAt: candidate.lastInteractionAt,
  }))

  const selectedCandidate = sortedCandidates.find((candidate) => candidate.id === selectedId)

  return (
    <Space direction="vertical" size="large" style={{ width: '100%' }}>
      <Card>
        <Row gutter={[16, 16]} align="middle">
          <Col flex="auto">
            <Typography.Title level={3} style={{ marginBottom: 0 }}>
              Interviewer dashboard
            </Typography.Title>
            <Typography.Paragraph type="secondary">
              Review candidate performance, search transcripts, and compare scores. Data persists locally so you can continue later.
            </Typography.Paragraph>
          </Col>
          <Col>
            <Select
              value={sortMode}
              onChange={(value) => setSortMode(value)}
              options={[
                { label: 'Sort by score', value: 'score' },
                { label: 'Sort by recent activity', value: 'recent' },
              ]}
            />
          </Col>
        </Row>
        <Input.Search
          placeholder="Search by name or email"
          allowClear
          onSearch={setSearch}
          onChange={(event) => setSearch(event.target.value)}
          style={{ marginTop: 16 }}
        />
      </Card>

      <Row gutter={[24, 24]}>
        <Col xs={24} lg={12}>
          <Card bodyStyle={{ padding: 0 }}>
            <Table
              columns={columns}
              dataSource={dataSource}
              pagination={false}
              rowKey="key"
              onRow={(record) => ({
                onClick: () => setSelectedId(record.key),
              })}
              rowClassName={(record) => (record.key === selectedId ? 'table-row-active' : '')}
              locale={{ emptyText: 'No candidates yet. Run an interview to see results.' }}
            />
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <CandidateDetail candidate={selectedCandidate} />
        </Col>
      </Row>
    </Space>
  )
}

export default InterviewerView
