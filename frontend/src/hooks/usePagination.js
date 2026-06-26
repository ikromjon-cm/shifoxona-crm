import { useState, useCallback, useMemo } from 'react'

export function usePagination(defaultPageSize = 20) {
  const [page, setPage] = useState(1)
  const [pageSize] = useState(defaultPageSize)
  const [total, setTotal] = useState(0)

  const totalPages = useMemo(() => Math.max(1, Math.ceil(total / pageSize)), [total, pageSize])

  const goTo = useCallback((p) => setPage(Math.max(1, Math.min(p, totalPages))), [totalPages])
  const next = useCallback(() => goTo(page + 1), [goTo, page])
  const prev = useCallback(() => goTo(page - 1), [goTo, page])

  const offset = useMemo(() => (page - 1) * pageSize, [page, pageSize])

  return { page, pageSize, total, totalPages, setTotal, goTo, next, prev, offset }
}
