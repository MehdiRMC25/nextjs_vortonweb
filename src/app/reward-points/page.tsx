import fs from 'node:fs/promises'
import path from 'node:path'
import { headers } from 'next/headers'
import ReactMarkdown from 'react-markdown'
import RewardPointsHeading from './RewardPointsHeading'
import styles from './RewardPoints.module.css'

export default async function RewardPointsPolicyPage() {
  const locale = (await headers()).get('x-next-locale') === 'az' ? 'az' : 'en'
  const fileName =
    locale === 'az' ? 'rewardPolicy.public.az.md' : 'rewardPolicy.public.md'
  const mdPath = path.join(process.cwd(), 'src', 'data', fileName)
  let markdown = await fs.readFile(mdPath, 'utf8')
  /* Single page title comes from RewardPointsHeading (i18n); drop duplicate H1 from markdown */
  markdown = markdown.replace(/^\s*#[^\n]+\n+/, '')

  return (
    <div className={`container ${styles.page}`}>
      <div className={styles.wrap}>
        <RewardPointsHeading />
        <div className={`${styles.content} ${styles.markdown}`}>
          <ReactMarkdown>{markdown}</ReactMarkdown>
        </div>
      </div>
    </div>
  )
}
