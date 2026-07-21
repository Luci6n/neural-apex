import { Fragment } from 'react'

export function SafeRichText({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n{2,}/).map((paragraph, paragraphIndex) => (
        <p key={paragraphIndex}>
          {paragraph.split(/(\*\*[^*]+\*\*)/g).filter(Boolean).map((part, index) =>
            part.startsWith('**') && part.endsWith('**')
              ? <strong key={index}>{part.slice(2, -2)}</strong>
              : <Fragment key={index}>{part}</Fragment>,
          )}
        </p>
      ))}
    </>
  )
}
