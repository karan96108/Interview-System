import { useState } from 'react'
import { Upload, Typography, message } from 'antd'
import { InboxOutlined } from '@ant-design/icons'
import type { UploadProps } from 'antd'
import { parseResume } from '../../utils/resumeParser'
import { extractProfileFromText } from '../../utils/profile'
import { toDataUrl } from '../../features/interview/utils'
import type { CandidateProfile } from '../../features/interview/types'

const { Dragger } = Upload

interface ResumeUploadCardProps {
  onExtracted: (profile: CandidateProfile) => void
  disabled?: boolean
}

const allowedTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

const ResumeUploadCard = ({ onExtracted, disabled }: ResumeUploadCardProps) => {
  const [loading, setLoading] = useState(false)

  const beforeUpload: UploadProps['beforeUpload'] = async (file) => {
    if (disabled) {
      message.info('Finish the current interview before uploading a new resume.')
      return Upload.LIST_IGNORE
    }
    if (!allowedTypes.includes(file.type) && !/\.(pdf|docx)$/i.test(file.name)) {
      message.error('Please upload a PDF or DOCX file.')
      return Upload.LIST_IGNORE
    }

    setLoading(true)
    try {
      const text = await parseResume(file as File)
      const profile = extractProfileFromText(text)
      profile.resumeFile = {
        name: file.name,
        type: file.type,
        dataUrl: await toDataUrl(file as File),
      }
      onExtracted(profile)
      message.success('Resume processed. Let\'s get started!')
    } catch (error) {
      const err = error as Error
      message.error(err.message || 'Unable to process the resume. Please try again.')
    } finally {
      setLoading(false)
    }
    return Upload.LIST_IGNORE
  }

  return (
    <Dragger
      multiple={false}
      maxCount={1}
      beforeUpload={beforeUpload}
      showUploadList={false}
      disabled={disabled || loading}
      style={{ padding: 24 }}
    >
      <p className="ant-upload-drag-icon">
        <InboxOutlined />
      </p>
      <Typography.Title level={4}>Upload your resume to begin</Typography.Title>
      <Typography.Paragraph type="secondary">
        Drop a PDF or DOCX file here, or click to browse. Crisp will extract your contact details and start the interview.
      </Typography.Paragraph>
      {loading && <Typography.Text>Reading resume...</Typography.Text>}
    </Dragger>
  )
}

export default ResumeUploadCard
