import type { ReactNode } from 'react'

export function SafeRichText({ text }: { text: string }) {
  const normalized = text
    .replace(/\*\*/g, '')
    .replace(/\s+-\s+(?=(?:Predictor|Scanner|Pattern Scanner|Adaptive Driver|Team principal|Lesson):)/gi, '\n- ')
    .replace(/^#{1,6}\s*/gm, '')
  const lines = normalized.split(/\n+/).map((line) => line.trim()).filter(Boolean)
  const nodes: ReactNode[] = []
  let bullets: string[] = []
  const flushBullets = () => {
    if (!bullets.length) return
    nodes.push(<ul key={'list-' + nodes.length}>{bullets.map((item, index) => <li key={index}>{item}</li>)}</ul>)
    bullets = []
  }
  lines.forEach((line) => {
    const bullet = line.match(/^[-•*]\s+(.*)$/)
    if (bullet) bullets.push(bullet[1])
    else {
      flushBullets()
      nodes.push(<p key={'paragraph-' + nodes.length}>{line}</p>)
    }
  })
  flushBullets()
  return <div className="safe-rich-text">{nodes}</div>
}
