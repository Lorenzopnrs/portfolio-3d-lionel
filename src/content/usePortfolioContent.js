import { useEffect, useState } from 'react'
import { sanityClient } from '../sanity/client.js'
import { PORTFOLIO_CONTENT_QUERY } from '../sanity/queries.js'
import { localPortfolioContent } from './portfolioContent.js'
import { loadPortfolioContent } from './sanityContent.js'

export function usePortfolioContent() {
  const [content, setContent] = useState(localPortfolioContent)

  useEffect(() => {
    let active = true

    loadPortfolioContent({
      fallbackContent: localPortfolioContent,
      fetchContent: () => sanityClient.fetch(PORTFOLIO_CONTENT_QUERY),
      logger: import.meta.env?.DEV ? console : null,
    }).then((nextContent) => {
      if (active) {
        setContent(nextContent)
      }
    })

    return () => {
      active = false
    }
  }, [])

  return content
}
